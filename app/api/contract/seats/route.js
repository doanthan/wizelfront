import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import ContractSeat from "@/models/ContractSeat";
import User from "@/models/User";
import Role from "@/models/Role";
import Store from "@/models/Store";

// GET - List all seats in a contract
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');

    if (!contractId) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to this contract
    const userSeat = await ContractSeat.findOne({
      contract_id: contractId,
      user_id: currentUser._id,
      status: 'active'
    }).populate('default_role_id');

    if (!userSeat && !currentUser.is_super_user) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all seats for this contract
    const seats = await ContractSeat.find({
      contract_id: contractId
    })
      .populate('user_id', 'name email avatar_url status last_login')
      .populate('default_role_id')
      .populate('invited_by', 'name email')
      .sort({ created_at: -1 });

    // Populate store names for store_access
    const seatsWithStores = await Promise.all(seats.map(async (seat) => {
      const seatObj = seat.toObject();

      // Get store names for store_access
      if (seatObj.store_access && seatObj.store_access.length > 0) {
        seatObj.store_access = await Promise.all(
          seatObj.store_access.map(async (access) => {
            const store = await Store.findById(access.store_id).select('name public_id');
            return {
              ...access,
              store_name: store?.name,
              store_public_id: store?.public_id
            };
          })
        );
      }

      return seatObj;
    }));

    return NextResponse.json({
      seats: seatsWithStores,
      total: seats.length
    });

  } catch (error) {
    console.error('Error listing contract seats:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Invite a new user to the contract
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, email, roleId, storeAccess } = body;

    if (!contractId || !email || !roleId) {
      return NextResponse.json(
        { error: "Contract ID, email, and role are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user has permission to invite users
    const userSeat = await ContractSeat.findOne({
      contract_id: contractId,
      user_id: currentUser._id,
      status: 'active'
    }).populate('default_role_id');

    if (!userSeat && !currentUser.is_super_user) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user has team.invite_users permission
    if (!currentUser.is_super_user && !userSeat.default_role_id.permissions.team.invite_users) {
      return NextResponse.json(
        { error: "You don't have permission to invite users" },
        { status: 403 }
      );
    }

    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Find or create user
    let targetUser = await User.findOne({ email: email.toLowerCase() });

    if (!targetUser) {
      // Create new user with pending status
      targetUser = new User({
        email: email.toLowerCase(),
        name: email.split('@')[0],
        password: Math.random().toString(36).slice(-12), // Temporary password
        status: 'inactive' // User needs to set password and verify email
      });
      await targetUser.save();
    }

    // Check if seat already exists
    const existingSeat = await ContractSeat.findOne({
      contract_id: contractId,
      user_id: targetUser._id
    });

    if (existingSeat && existingSeat.status === 'active') {
      return NextResponse.json(
        { error: "User already has an active seat in this contract" },
        { status: 400 }
      );
    }

    // Create or reactivate seat
    let seat;
    if (existingSeat) {
      existingSeat.status = 'pending';
      existingSeat.default_role_id = roleId;
      existingSeat.invited_by = currentUser._id;
      existingSeat.invitation_email = email;
      existingSeat.invitation_sent_at = new Date();
      existingSeat.store_access = storeAccess || [];
      seat = await existingSeat.save();
    } else {
      seat = await ContractSeat.create({
        contract_id: contractId,
        user_id: targetUser._id,
        default_role_id: roleId,
        invited_by: currentUser._id,
        invitation_email: email,
        invitation_sent_at: new Date(),
        status: 'pending',
        store_access: storeAccess || []
      });
    }

    // Populate for response
    await seat.populate('user_id default_role_id invited_by');

    // TODO: Send invitation email

    return NextResponse.json({
      success: true,
      seat: seat,
      message: "User invitation sent successfully"
    });

  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

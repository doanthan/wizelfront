import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import ContractSeat from "@/models/ContractSeat";
import User from "@/models/User";
import Role from "@/models/Role";
import Store from "@/models/Store";
import Contract from "@/models/Contract";
import { createInvitationToken } from "@/lib/invitation-token";
import { sendNewUserInvitation, sendExistingUserNotification } from "@/lib/email";

// GET - List all seats in a contract
export async function GET(request) {
  try {
    const session = await auth();
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
    const session = await auth();
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

    // Get contract and role details for emails
    const [contract, role] = await Promise.all([
      Contract.findById(contractId),
      Role.findById(roleId)
    ]);

    if (!contract || !role) {
      return NextResponse.json({ error: "Contract or role not found" }, { status: 404 });
    }

    // Get store names if storeAccess is provided
    let storeNames = [];
    if (storeAccess && storeAccess.length > 0) {
      const storeIds = storeAccess.map(access => access.store_id);
      const stores = await Store.find({ _id: { $in: storeIds } }).select('name');
      storeNames = stores.map(store => store.name);
    }

    // Find existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    // Determine invitation path: new user vs existing user
    let targetUser;
    let invitationMethod;
    let seatStatus;
    let invitationToken = null;

    if (!existingUser) {
      // PATH 1: New User - Create inactive user account
      console.log('📧 New user invitation for:', email);
      invitationMethod = 'new_user';
      seatStatus = 'pending';

      // Create new user with inactive status
      targetUser = new User({
        email: email.toLowerCase(),
        name: email.split('@')[0],
        password: Math.random().toString(36).slice(-12), // Temporary password
        status: 'inactive' // User needs to accept invitation and set password
      });
      await targetUser.save();

      // Generate invitation token
      const tokenData = createInvitationToken();
      invitationToken = tokenData.hashedToken; // Store hashed token

      // Send new user invitation email with signup link
      const emailResult = await sendNewUserInvitation({
        to: email,
        contractName: contract.contract_name,
        roleName: role.name,
        storeNames,
        invitedBy: currentUser.name || currentUser.email,
        token: tokenData.token // Send plain token in email
      });

      if (!emailResult.success) {
        console.error('Failed to send new user invitation email:', emailResult.error);
      }

    } else if (existingUser.status === 'active') {
      // PATH 2A: Existing Active User - Grant immediate access
      console.log('✅ Existing active user, granting immediate access:', email);
      invitationMethod = 'existing_user';
      seatStatus = 'active';
      targetUser = existingUser;

      // Send notification email
      const emailResult = await sendExistingUserNotification({
        to: email,
        name: existingUser.name,
        contractName: contract.contract_name,
        roleName: role.name,
        storeNames,
        invitedBy: currentUser.name || currentUser.email
      });

      if (!emailResult.success) {
        console.error('Failed to send existing user notification email:', emailResult.error);
      }

    } else {
      // PATH 2B: Existing Inactive User - Send invitation to complete setup
      console.log('📧 Existing inactive user, sending invitation:', email);
      invitationMethod = 'new_user'; // Treat as new user flow
      seatStatus = 'pending';
      targetUser = existingUser;

      // Generate invitation token
      const tokenData = createInvitationToken();
      invitationToken = tokenData.hashedToken;

      // Send new user invitation email
      const emailResult = await sendNewUserInvitation({
        to: email,
        contractName: contract.contract_name,
        roleName: role.name,
        storeNames,
        invitedBy: currentUser.name || currentUser.email,
        token: tokenData.token
      });

      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
      }
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
      existingSeat.status = seatStatus;
      existingSeat.default_role_id = roleId;
      existingSeat.invited_by = currentUser._id;
      existingSeat.invitation_email = email;
      existingSeat.invitation_sent_at = new Date();
      existingSeat.invitation_method = invitationMethod;
      existingSeat.store_access = storeAccess || [];

      if (invitationToken) {
        existingSeat.invitation_token = invitationToken;
        const tokenExpiration = new Date();
        tokenExpiration.setDate(tokenExpiration.getDate() + 7); // 7 days
        existingSeat.invitation_token_expires = tokenExpiration;
      }

      if (seatStatus === 'active') {
        existingSeat.activated_at = new Date();
      }

      seat = await existingSeat.save();
    } else {
      const seatData = {
        contract_id: contractId,
        user_id: targetUser._id,
        default_role_id: roleId,
        invited_by: currentUser._id,
        invitation_email: email,
        invitation_sent_at: new Date(),
        invitation_method: invitationMethod,
        status: seatStatus,
        store_access: storeAccess || []
      };

      if (invitationToken) {
        seatData.invitation_token = invitationToken;
        const tokenExpiration = new Date();
        tokenExpiration.setDate(tokenExpiration.getDate() + 7);
        seatData.invitation_token_expires = tokenExpiration;
      }

      if (seatStatus === 'active') {
        seatData.activated_at = new Date();
      }

      seat = await ContractSeat.create(seatData);
    }

    // If seat is active, add to user's active_seats
    if (seatStatus === 'active') {
      targetUser.addSeat(contractId, contract.contract_name, seat._id);
      await targetUser.save();
    }

    // Populate for response
    await seat.populate('user_id default_role_id invited_by');

    const message = invitationMethod === 'new_user'
      ? `Invitation sent to ${email}. They will receive an email to create their account.`
      : `${email} has been added to the contract and notified via email.`;

    return NextResponse.json({
      success: true,
      seat: seat,
      invitationMethod,
      message
    });

  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

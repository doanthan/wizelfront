import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import ContractSeat from "@/models/ContractSeat";
import User from "@/models/User";
import Contract from "@/models/Contract";
import { validateInvitationToken } from "@/lib/invitation-token";
import bcrypt from "bcryptjs";

/**
 * POST /api/invitations/accept
 * Accept an invitation and set up account
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, password, name } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find seat by invitation token
    const seat = await ContractSeat.findOne({
      invitation_token: token,
      status: 'pending'
    }).populate('user_id contract_id default_role_id');

    if (!seat) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Validate token
    const validation = validateInvitationToken(
      token,
      seat.invitation_token,
      seat.invitation_token_expires
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || "Invalid invitation" },
        { status: 400 }
      );
    }

    const user = seat.user_id;

    // Update user account
    user.password = await bcrypt.hash(password, 10);
    user.status = 'active';
    if (name && name.trim()) {
      user.name = name.trim();
    }
    await user.save();

    // Activate seat
    seat.status = 'active';
    seat.activated_at = new Date();
    seat.invitation_token = undefined; // Clear token after use
    seat.invitation_token_expires = undefined;
    await seat.save();

    // Add seat to user's active_seats
    const contract = seat.contract_id;
    user.addSeat(contract._id, contract.contract_name, seat._id);
    await user.save();

    console.log('✅ Invitation accepted for user:', user.email);

    return NextResponse.json({
      success: true,
      message: "Account created successfully! You can now log in.",
      user: {
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invitations/accept?token=xxx
 * Get invitation details (for pre-filling the accept form)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find seat by invitation token
    const seat = await ContractSeat.findOne({
      invitation_token: token,
      status: 'pending'
    })
      .populate('user_id', 'email name')
      .populate('contract_id', 'contract_name')
      .populate('default_role_id', 'name')
      .populate('invited_by', 'name email');

    if (!seat) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Validate token expiration
    const validation = validateInvitationToken(
      token,
      seat.invitation_token,
      seat.invitation_token_expires
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || "Invitation expired" },
        { status: 400 }
      );
    }

    // Get store names if store_access exists
    let storeNames = [];
    if (seat.store_access && seat.store_access.length > 0) {
      const Store = (await import('@/models/Store')).default;
      const storeIds = seat.store_access.map(access => access.store_id);
      const stores = await Store.find({ _id: { $in: storeIds } }).select('name');
      storeNames = stores.map(store => store.name);
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: seat.user_id.email,
        contractName: seat.contract_id.contract_name,
        roleName: seat.default_role_id.name,
        invitedBy: seat.invited_by?.name || seat.invited_by?.email || 'Team',
        storeNames,
        hasStoreRestrictions: seat.store_access?.length > 0
      }
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

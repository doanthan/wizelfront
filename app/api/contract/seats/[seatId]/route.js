import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import ContractSeat from "@/models/ContractSeat";
import User from "@/models/User";
import Role from "@/models/Role";
import Store from "@/models/Store";

// GET - Get specific seat details
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seatId } = await params;

    await connectToDatabase();

    const seat = await ContractSeat.findById(seatId)
      .populate('user_id', 'name email avatar_url status last_login')
      .populate('default_role_id')
      .populate('invited_by', 'name email');

    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    // Populate store names
    const seatObj = seat.toObject();
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

    return NextResponse.json({ seat: seatObj });

  } catch (error) {
    console.error('Error fetching seat:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update seat (role, store access, status)
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seatId } = await params;
    const body = await request.json();
    const { roleId, storeAccess, status } = body;

    await connectToDatabase();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the seat to update
    const seat = await ContractSeat.findById(seatId).populate('default_role_id');
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    // Check if current user has permission to manage roles
    const userSeat = await ContractSeat.findOne({
      contract_id: seat.contract_id,
      user_id: currentUser._id,
      status: 'active'
    }).populate('default_role_id');

    if (!currentUser.is_super_user) {
      if (!userSeat) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Check if user has team.manage_roles permission
      if (!userSeat.default_role_id.permissions.team.manage_roles) {
        return NextResponse.json(
          { error: "You don't have permission to manage user roles" },
          { status: 403 }
        );
      }

      // Can't assign a role higher than your own
      if (roleId) {
        const newRole = await Role.findById(roleId);
        if (newRole && newRole.level >= userSeat.default_role_id.level) {
          return NextResponse.json(
            { error: "You can only assign roles lower than your own" },
            { status: 403 }
          );
        }
      }
    }

    // Update seat
    if (roleId) {
      seat.default_role_id = roleId;
    }

    if (storeAccess !== undefined) {
      seat.store_access = storeAccess;
    }

    if (status && ['pending', 'active', 'suspended', 'revoked'].includes(status)) {
      // Prevent suspending or revoking contract owners
      if ((status === 'suspended' || status === 'revoked') && seat.default_role_id?.name === 'owner') {
        return NextResponse.json({
          error: "Cannot suspend or revoke contract owner",
          message: "The contract owner cannot be suspended or revoked."
        }, { status: 403 });
      }

      seat.status = status;

      if (status === 'suspended') {
        seat.suspended_at = new Date();
        seat.suspended_by = currentUser._id;
      } else if (status === 'active' && seat.status !== 'active') {
        seat.activated_at = new Date();
        seat.suspended_at = undefined;
        seat.suspended_by = undefined;
      } else if (status === 'revoked') {
        seat.revoked_at = new Date();
        seat.revoked_by = currentUser._id;
      }
    }

    await seat.save();
    await seat.populate('user_id default_role_id invited_by');

    return NextResponse.json({
      success: true,
      seat: seat,
      message: "Seat updated successfully"
    });

  } catch (error) {
    console.error('Error updating seat:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove/revoke seat
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { seatId } = await params;

    await connectToDatabase();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the seat to delete
    const seat = await ContractSeat.findById(seatId).populate('default_role_id');
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    // Prevent deleting contract owners
    if (seat.default_role_id?.name === 'owner') {
      return NextResponse.json({
        error: "Cannot remove contract owner",
        message: "The contract owner cannot be removed. Please transfer ownership first."
      }, { status: 403 });
    }

    // Check if current user has permission to remove users
    const userSeat = await ContractSeat.findOne({
      contract_id: seat.contract_id,
      user_id: currentUser._id,
      status: 'active'
    }).populate('default_role_id');

    if (!currentUser.is_super_user) {
      if (!userSeat) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Check if user has team.remove_users permission
      if (!userSeat.default_role_id.permissions.team.remove_users) {
        return NextResponse.json(
          { error: "You don't have permission to remove users" },
          { status: 403 }
        );
      }

      // Can't remove users with equal or higher role
      if (seat.default_role_id.level >= userSeat.default_role_id.level) {
        return NextResponse.json(
          { error: "You can only remove users with roles lower than your own" },
          { status: 403 }
        );
      }
    }

    // Revoke the seat
    await seat.revoke(currentUser._id);

    return NextResponse.json({
      success: true,
      message: "User access revoked successfully"
    });

  } catch (error) {
    console.error('Error deleting seat:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

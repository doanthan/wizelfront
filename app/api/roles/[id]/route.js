import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Role from "@/models/Role";

// GET - Get a specific role
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ role });

  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update role permissions
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    // Find the role
    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Prevent editing system roles
    if (role.is_system_role) {
      return NextResponse.json(
        { error: "Cannot modify system roles" },
        { status: 403 }
      );
    }

    // Update permissions
    if (body.permissions) {
      role.permissions = body.permissions;
    }

    // Update other fields if provided
    if (body.display_name) {
      role.display_name = body.display_name;
    }

    if (body.description) {
      role.description = body.description;
    }

    await role.save();

    return NextResponse.json({
      success: true,
      role
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a custom role
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    // Find the role
    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Prevent deleting system roles
    if (role.is_system_role) {
      return NextResponse.json(
        { error: "Cannot delete system roles" },
        { status: 403 }
      );
    }

    // Check if any users have this role
    // TODO: Add check for users with this role before deleting

    // Soft delete
    role.is_active = false;
    await role.save();

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

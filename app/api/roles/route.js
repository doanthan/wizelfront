import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Role from "@/models/Role";

// GET - List all roles (system + custom for a contract)
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');

    await connectToDatabase();

    let roles;

    if (contractId) {
      // Get both system roles and contract-specific custom roles
      roles = await Role.find({
        $or: [
          { is_system_role: true },
          { contract_id: contractId, is_system_role: false }
        ],
        is_active: { $ne: false }
      }).sort({ level: -1 });
    } else {
      // Get only system roles if no contract specified
      roles = await Role.find({
        is_system_role: true,
        is_active: { $ne: false }
      }).sort({ level: -1 });
    }

    return NextResponse.json({
      roles: roles
    });

  } catch (error) {
    console.error('Error listing roles:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a custom role
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractId, name, display_name, description, baseRole, permissions } = body;

    // Validate required fields
    if (!contractId || !name || !display_name) {
      return NextResponse.json(
        { error: "Missing required fields: contractId, name, display_name" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // If baseRole is provided, use it as a template
    let rolePermissions = permissions || {};
    let roleLevel = 50; // Default level for custom roles

    if (baseRole) {
      const baseRoleDoc = await Role.findOne({
        name: baseRole,
        is_system_role: true
      });

      if (baseRoleDoc) {
        // Deep copy permissions from base role
        rolePermissions = JSON.parse(JSON.stringify(baseRoleDoc.permissions));
        roleLevel = baseRoleDoc.level - 1; // Slightly lower level than base role

        // Override with custom permissions if provided
        if (permissions) {
          for (const [category, actions] of Object.entries(permissions)) {
            if (rolePermissions[category]) {
              rolePermissions[category] = { ...rolePermissions[category], ...actions };
            } else {
              rolePermissions[category] = actions;
            }
          }
        }
      }
    }

    // Check if role with same name already exists for this contract
    const existingRole = await Role.findOne({
      name: name.toLowerCase(),
      contract_id: contractId,
      is_system_role: false
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "A custom role with this name already exists" },
        { status: 409 }
      );
    }

    // Create the custom role
    const newRole = new Role({
      name: name.toLowerCase(),
      display_name,
      description: description || `Custom role based on ${baseRole || 'default'}`,
      level: roleLevel,
      is_system_role: false,
      contract_id: contractId,
      permissions: rolePermissions,
      capabilities: {
        canManageBilling: false,
        canDeleteContract: false,
        canCreateStores: false,
        creditLimits: 'medium',
        requiresApproval: roleLevel < 60 // Require approval for lower level roles
      },
      is_active: true
    });

    await newRole.save();

    return NextResponse.json({
      success: true,
      role: newRole
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating custom role:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

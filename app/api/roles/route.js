import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Role from "@/models/Role";

// GET - List all system roles
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get all system roles, sorted by level descending
    const roles = await Role.find({
      is_system_role: true,
      is_active: true
    }).sort({ level: -1 });

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

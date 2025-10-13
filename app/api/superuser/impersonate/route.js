import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { encode } from "next-auth/jwt";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Contract from "@/models/Contract";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Simple superuser check - ignore complex roles/permissions
    const requestingUser = await User.findOne({ email: session.user.email });
    
    if (!requestingUser?.is_super_user) {
      return NextResponse.json({ 
        error: "Superuser access required" 
      }, { status: 403 });
    }

    // Find the target user
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return NextResponse.json({ 
        error: "Target user not found" 
      }, { status: 404 });
    }

    // Prevent impersonating other super users
    if (targetUser.is_super_user) {
      return NextResponse.json({ 
        error: "Cannot impersonate super users" 
      }, { status: 403 });
    }

    // Get target user's contracts
    const contracts = targetUser.primary_contract_id ? 
      await Contract.findByUserSeats(targetUser._id.toString()) : [];

    // Create impersonation token with target user's data
    const impersonationToken = {
      id: targetUser._id.toString(),
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      primary_contract_id: targetUser.primary_contract_id?.toString(),
      contracts: contracts || [],
      // Add impersonation metadata
      isImpersonating: true,
      impersonatedBy: {
        id: requestingUser._id.toString(),
        email: requestingUser.email,
        name: requestingUser.name
      },
      impersonationStarted: new Date().toISOString()
    };

    // Generate JWT token using NextAuth's encode function
    const jwt = await encode({
      token: impersonationToken,
      secret: process.env.NEXTAUTH_SECRET,
      maxAge: 60 * 60 * 2 // 2 hours for impersonation sessions
    });

    // Log the impersonation for security/audit purposes
    console.log(`IMPERSONATION: ${requestingUser.email} (${requestingUser._id}) impersonating ${targetUser.email} (${targetUser._id})`);

    return NextResponse.json({
      success: true,
      token: jwt,
      impersonatedUser: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      },
      message: `Successfully generated impersonation token for ${targetUser.name}`
    });

  } catch (error) {
    console.error('Superuser API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
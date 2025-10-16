import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Hash the token to match with database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token and check if not expired
    const user = await User.findOne({
      email_verification_token: hashedToken,
      email_verification_expires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update user - mark as verified and clear token
    user.email_verified = true;
    user.email_verification_token = undefined;
    user.email_verification_expires = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail({
      to: user.email,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      user: {
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

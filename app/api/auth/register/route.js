import { NextResponse } from 'next/server';
import User from '@/models/User';
import Contract from '@/models/Contract';
import connectToDatabase from '@/lib/mongoose';
import { UserModel } from '@/lib/user-model';
import { ContractModel } from '@/lib/contract-model';
import { sendVerificationEmail, isValidEmail, isValidEmailDomain } from '@/lib/email';

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate email domain (check for typos and disposable emails)
    const isValidDomain = await isValidEmailDomain(email);
    if (!isValidDomain) {
      return NextResponse.json(
        { error: 'Please use a valid email address. Temporary or disposable email addresses are not allowed.' },
        { status: 400 }
      );
    }

    // Enhanced password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least 1 uppercase letter' },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least 1 special character' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Mock Stripe customer for testing
    const stripeCustomer = {
      id: 'test_customer_' + Date.now(),
    };

    // Create user first (without contract reference initially)
    const user = await UserModel.createUser({
      name,
      email,
      password,
    });

    // Now create the contract with the user's ID
    const contract = await ContractModel.createContract({
      contract_name: `${name}'s Contract`,
      billing_email: email,
      owner_id: user._id,
      billing_contact_id: user._id,
      stripe_customer_id: stripeCustomer.id,
    });

    // Update user with contract reference
    user.personal_contract_id = contract._id;
    user.primary_contract_id = contract._id;

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: verificationToken,
      });
      console.log('✅ Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Error sending verification email:', emailError);
      // Don't fail registration if email fails - user can resend verification
    }

    // Return success (password is excluded from user object)
    return NextResponse.json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        personal_contract_id: user.personal_contract_id,
        email_verified: user.email_verified,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);

    if (error.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/user-model';
import { ContractModel } from '@/lib/contract-model';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    // Create Stripe customer for the user's contract (commented out for testing)
    // const stripeCustomer = await stripe.customers.create({
    //   email: email,
    //   name: name,
    //   metadata: {
    //     user_email: email,
    //   },
    // });
    
    // Mock Stripe customer for testing
    const stripeCustomer = {
      id: 'test_customer_' + Date.now(),
    };

    // Create user's primary contract
    const contract = await ContractModel.createContract({
      name: `${name}'s Contract`,
      billing_email: email,
      owner_id: null, // Will be set after user creation
      stripe_customer_id: stripeCustomer.id,
      contract_type: 'individual',
      max_stores: 10,
      max_users: 1,
      ai_credits_balance: 10, // Welcome bonus
    });

    // Create user
    const user = await UserModel.createUser({
      name,
      email,
      password,
      primary_contract_id: contract._id,
      stripe_customer_id: stripeCustomer.id,
    });

    // Update contract with owner_id
    await ContractModel.updateContract(contract._id.toString(), {
      owner_id: user._id,
    });

    // Return success (password is excluded from user object)
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        primary_contract_id: user.primary_contract_id,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
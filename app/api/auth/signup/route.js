import { NextResponse } from 'next/server';
import User from '@/models/User';
import { ContractModel } from '@/lib/contract-model';
import connectToDatabase from '@/lib/mongoose';
import bcrypt from 'bcryptjs';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, company } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Ensure mongoose connection
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create Stripe customer (commented out for testing)
    // const stripeCustomer = await stripe.customers.create({
    //   email: email,
    //   name: name || email.split('@')[0],
    //   metadata: {
    //     signup_date: new Date().toISOString(),
    //   },
    // });

    // Create contract for the new user
    const contract = await ContractModel.createContract({
      name: company ? `${company} Contract` : `${name || email.split('@')[0]}'s Contract`,
      billing_email: email,
      owner_id: null, // Will be updated after user creation
      stripe_customer_id: 'test_customer_' + Date.now(), // stripeCustomer.id in production
      contract_type: 'individual',
      billing_plan: 'starter',
      max_stores: 3,
      max_users: 1,
      ai_credits_balance: 100, // Give 100 free credits to start
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with contract using Mongoose model
    const user = new User({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'admin',
      primary_contract_id: contract._id,
      contract_access: [{
        contract_id: contract._id,
        role: 'owner',
        added_at: new Date()
      }],
      // Add default stores access if needed
      stores: [],
    });

    await user.save();

    // Update contract with owner_id
    await ContractModel.updateContract(contract._id, {
      owner_id: user._id
    });

    // Create Stripe subscription with trial (commented out for testing)
    // const subscription = await stripe.subscriptions.create({
    //   customer: stripeCustomer.id,
    //   items: [
    //     {
    //       price: process.env.STRIPE_STARTER_PRICE_ID, // Starter plan price ID
    //     },
    //   ],
    //   trial_period_days: 14,
    //   metadata: {
    //     contract_id: contract._id.toString(),
    //     user_id: user._id.toString(),
    //   },
    // });

    // Update contract with subscription info
    // await ContractModel.updateContract(contract._id, {
    //   stripe_subscription_id: subscription.id,
    //   subscription_status: subscription.status,
    //   trial_ends_at: new Date(subscription.trial_end * 1000),
    // });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      contract: {
        id: contract._id,
        name: contract.name,
        plan: contract.billing_plan,
        max_stores: contract.max_stores,
        max_users: contract.max_users,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import User from '@/models/User';
import { ContractModel } from '@/lib/contract-model';
import connectToDatabase from '@/lib/mongoose';
import bcrypt from 'bcryptjs'; // Keep for password verification test
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request) {
  try {
    console.log('Signup API called');
    const body = await request.json();
    console.log('Request body:', body);
    const { email, password, name, company } = body;

    // Validate required fields
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Ensure mongoose connection
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists with email:', email);
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

    // First create the user, then the contract
    // The User model's pre-save hook will hash the password automatically

    // Create user without contract first - password will be hashed by the model
    const user = new User({
      email: email.toLowerCase(),
      password: password, // Pass plain password - the model will hash it
      name: name || email.split('@')[0],
      role: 'admin',
      stores: [],
    });

    await user.save();

    // Verify the password was saved correctly
    const savedUser = await User.findById(user._id).select('+password');
    console.log('Saved user password:', {
      savedPasswordLength: savedUser.password?.length,
      passwordExists: !!savedUser.password
    });

    // Test the password immediately with the original password
    const testCompare = await bcrypt.compare(password, savedUser.password);
    console.log('Immediate password test:', testCompare);

    // Now create contract with the user ID
    const contract = await ContractModel.createContract({
      contract_name: company ? `${company} Contract` : `${name || email.split('@')[0]}'s Contract`,
      billing_contact_id: user._id, // Use the created user's ID
      billing_email: email, // Add the billing email
      owner_id: user._id, // Set owner_id to user's ID
      stripe_customer_id: 'test_customer_' + Date.now(),
      contract_type: 'individual',
      billing_plan: 'starter',
      max_stores: 3,
      max_users: 1,
      ai_credits_balance: 100,
    });

    // Update user with contract reference
    user.primary_contract_id = contract._id;
    user.contract_access = [{
      contract_id: contract._id,
      role: 'owner',
      added_at: new Date()
    }];

    await user.save();

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
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      errors: error.errors
    });

    // Return more specific error message
    let errorMessage = 'Failed to create user';
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.errors) {
      // Mongoose validation errors
      const validationErrors = Object.values(error.errors).map(err => err.message);
      errorMessage = validationErrors.join(', ');
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
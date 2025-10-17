import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import Contract from '@/models/Contract';
import ContractSeat from '@/models/ContractSeat';
import User from '@/models/User';
import Store from '@/models/Store';
import AICredits from '@/models/AICredits';
import connectToDatabase from '@/lib/mongoose';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { contract_id, credits_package } = body;

    // Validate input
    if (!contract_id || !credits_package) {
      return NextResponse.json(
        { error: 'Contract ID and credits package are required' },
        { status: 400 }
      );
    }

    // Get contract
    const contract = await Contract.findById(contract_id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if user has a seat in this contract
    const seat = await ContractSeat.findOne({
      user_id: user._id,
      contract_id: contract_id,
      status: 'active'
    });

    if (!seat && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Access denied to this contract' },
        { status: 403 }
      );
    }

    // Get credit package details
    const packages = AICredits.getCreditPackages ? AICredits.getCreditPackages() : [];
    const selectedPackage = packages.find(pkg => pkg.credits === credits_package);

    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid credits package' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session for credits purchase (commented out for testing)
    // const checkoutSession = await stripe.checkout.sessions.create({
    //   customer: contract.stripe_customer_id,
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: 'usd',
    //         product_data: {
    //           name: `${selectedPackage.credits} AI Credits`,
    //           description: selectedPackage.description,
    //         },
    //         unit_amount: selectedPackage.price, // Price in cents
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   mode: 'payment',
    //   success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?credits_success=true`,
    //   cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?credits_cancelled=true`,
    //   metadata: {
    //     type: 'credits',
    //     contract_id: contract_id,
    //     credits: selectedPackage.credits.toString(),
    //     user_id: session.user.id,
    //   },
    // });

    // For testing, just add credits directly
    // Update contract AI credits (simplified - adjust based on your Contract model structure)
    await Contract.findByIdAndUpdate(contract_id, {
      $inc: { 'ai_credits.current_balance': selectedPackage.credits }
    });

    return NextResponse.json({
      checkout_url: '/dashboard/billing?credits_success=true', // Mock URL for testing
      session_id: 'test_session_' + Date.now(),
      package: selectedPackage,
      message: 'Credits added successfully (test mode)'
    });
  } catch (error) {
    console.error('Credits purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to create credits purchase session' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contract_id');

    if (contractId) {
      // Get specific contract balance
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      }

      // Verify user has access
      const seat = await ContractSeat.findOne({
        user_id: user._id,
        contract_id: contractId,
        status: 'active'
      });

      if (!seat && !user.is_super_user) {
        return NextResponse.json({ error: 'Access denied to this contract' }, { status: 403 });
      }

      return NextResponse.json({
        balance: contract.ai_credits?.current_balance || 0,
        contract_id: contractId
      });
    } else {
      // Get all user's contract balances
      const userSeats = await ContractSeat.find({
        user_id: user._id,
        status: 'active'
      }).populate('contract_id');

      const balances = await Promise.all(
        userSeats
          .filter(seat => seat.contract_id)
          .map(async (seat) => {
            const storesCount = await Store.countDocuments({
              contract_id: seat.contract_id._id,
              is_deleted: { $ne: true }
            });

            return {
              contract_id: seat.contract_id._id,
              contract_name: seat.contract_id.contract_name,
              balance: seat.contract_id.ai_credits?.current_balance || 0,
              stores_count: storesCount
            };
          })
      );

      return NextResponse.json({ balances });
    }
  } catch (error) {
    console.error('Failed to get credits balance:', error);
    return NextResponse.json(
      { error: 'Failed to get credits balance' },
      { status: 500 }
    );
  }
}
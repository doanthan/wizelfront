import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Contract from '@/models/Contract';
import User from '@/models/User';
import AICredits from '@/models/AICredits';
import connectToDatabase from '@/lib/mongoose';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Get contract and verify user has access
    const contract = await ContractModel.getContractById(contract_id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if user owns or has access to this contract
    const user = await UserModel.getUserById(session.user.id);
    const hasAccess = contract.owner_id.toString() === session.user.id ||
      user.contract_access?.some(access => access.contract_id.toString() === contract_id);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this contract' },
        { status: 403 }
      );
    }

    // Get credit package details
    const packages = AICreditsModel.getCreditPackages();
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
    await ContractModel.updateAICredits(contract_id, selectedPackage.credits, 'purchase');

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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contract_id');

    if (contractId) {
      // Get specific contract balance
      const balance = await AICreditsModel.getContractBalance(contractId);
      return NextResponse.json({ balance, contract_id: contractId });
    } else {
      // Get all user's contract balances
      const user = await UserModel.getUserWithContracts(session.user.id);
      const balances = await Promise.all(
        user.contracts.map(async (contract) => ({
          contract_id: contract._id,
          contract_name: contract.name,
          balance: contract.ai_credits_balance,
          stores_count: (await ContractModel.getContractStores(contract._id)).length
        }))
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
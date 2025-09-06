import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AICreditsModel } from '@/lib/ai-credits-model';
import { StoreModel } from '@/lib/store-model';

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
    const { store_id, action, metadata } = body;

    // Validate input
    if (!store_id || !action) {
      return NextResponse.json(
        { error: 'Store ID and action are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this store
    const store = await StoreModel.getStoreById(store_id);
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // For now, allow if user created the store or has access to the contract
    // TODO: Implement proper store-level permissions
    const hasAccess = store.user_id.toString() === session.user.id;
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this store' },
        { status: 403 }
      );
    }

    // Check credits before consuming
    const creditCheck = await AICreditsModel.checkCreditsBeforeAction(store_id, action);
    
    if (!creditCheck.has_credits) {
      return NextResponse.json({
        error: 'Insufficient AI credits',
        credits_needed: creditCheck.credits_needed,
        current_balance: creditCheck.current_balance,
        requires_purchase: true
      }, { status: 402 }); // Payment Required
    }

    // Consume credits
    const result = await AICreditsModel.consumeCredits(
      store_id,
      session.user.id,
      action,
      creditCheck.credits_needed,
      metadata
    );

    return NextResponse.json({
      success: true,
      credits_consumed: creditCheck.credits_needed,
      remaining_credits: result.remaining_credits,
      action: action,
      usage_log_id: result.usage_log_id
    });

  } catch (error) {
    console.error('AI credits consumption error:', error);
    
    if (error.message === 'Insufficient AI credits') {
      return NextResponse.json(
        { error: error.message, requires_purchase: true },
        { status: 402 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to consume AI credits' },
      { status: 500 }
    );
  }
}

// Get available actions and their credit costs
export async function GET() {
  try {
    const creditCosts = AICreditsModel.getCreditCosts();
    const packages = AICreditsModel.getCreditPackages();
    
    return NextResponse.json({
      credit_costs: creditCosts,
      packages: packages
    });
  } catch (error) {
    console.error('Failed to get credit info:', error);
    return NextResponse.json(
      { error: 'Failed to get credit information' },
      { status: 500 }
    );
  }
}
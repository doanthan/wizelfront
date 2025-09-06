import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
// import Stripe from 'stripe';
import { StoreModel } from '@/lib/store-model';
import { ContractModel } from '@/lib/contract-model';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2023-10-16',
// });

// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  // Temporarily disabled for testing without Stripe
  return NextResponse.json({ received: true });
  
  /* Commented out for testing
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        await handleTrialEndingSoon(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handler functions
async function handleSubscriptionUpdate(subscription) {
  try {
    // Find store by subscription ID
    const stores = await StoreModel.getCollection();
    const store = await stores.findOne({ 
      stripe_subscription_id: subscription.id 
    });

    if (store) {
      await StoreModel.updateStripeSubscription(store._id.toString(), {
        customer_id: subscription.customer,
        subscription_id: subscription.id,
        status: subscription.status,
        tier: subscription.metadata?.tier || 'pro',
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      });
      console.log(`Updated subscription for store ${store._id}`);
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    const stores = await StoreModel.getCollection();
    const store = await stores.findOne({ 
      stripe_subscription_id: subscription.id 
    });

    if (store) {
      await StoreModel.updateStore(store._id.toString(), {
        subscription_status: 'cancelled',
        is_active: false,
      });
      console.log(`Cancelled subscription for store ${store._id}`);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleTrialEndingSoon(subscription) {
  try {
    const stores = await StoreModel.getCollection();
    const store = await stores.findOne({ 
      stripe_subscription_id: subscription.id 
    });

    if (store) {
      // TODO: Send email notification about trial ending
      console.log(`Trial ending soon for store ${store._id}`);
    }
  } catch (error) {
    console.error('Error handling trial ending:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    // Log successful payment
    console.log(`Payment succeeded for invoice ${invoice.id}`);
    
    // Update subscription status if needed
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      await handleSubscriptionUpdate(subscription);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    console.log(`Payment failed for invoice ${invoice.id}`);
    
    // Update subscription status
    if (invoice.subscription) {
      const stores = await StoreModel.getCollection();
      const store = await stores.findOne({ 
        stripe_subscription_id: invoice.subscription 
      });

      if (store) {
        await StoreModel.updateStore(store._id.toString(), {
          subscription_status: 'past_due',
        });
        // TODO: Send payment failure notification email
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleCheckoutCompleted(session) {
  try {
    console.log(`Checkout completed for session ${session.id}`);
    
    // Handle AI credits purchase if applicable
    if (session.metadata?.type === 'credits') {
      const credits = parseInt(session.metadata.credits);
      const contractId = session.metadata.contract_id;
      
      // Add credits to contract
      await ContractModel.updateAICredits(contractId, credits, 'purchase');
      console.log(`Added ${credits} credits to contract ${contractId}`);
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}
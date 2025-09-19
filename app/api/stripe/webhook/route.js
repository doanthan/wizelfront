import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing stripe signature or webhook secret" },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session) {
  try {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId) {
      console.error("No userId in session metadata");
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found:", userId);
      return;
    }

    // Update user's subscription info
    user.subscription = {
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      plan_id: planId,
      status: "active",
      current_period_end: new Date(session.expires_at * 1000),
      created_at: new Date()
    };

    await user.save();
    console.log(`Subscription created for user ${userId} with plan ${planId}`);

  } catch (error) {
    console.error("Error handling checkout completed:", error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    const user = await User.findOne({
      "subscription.stripe_subscription_id": subscription.id
    });

    if (!user) {
      console.error("User not found for subscription:", subscription.id);
      return;
    }

    // Update subscription status
    user.subscription = {
      ...user.subscription,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    };

    // Update plan if changed
    if (subscription.items && subscription.items.data[0]) {
      const priceId = subscription.items.data[0].price.id;
      const planId = mapPriceIdToPlanId(priceId);
      if (planId) {
        user.subscription.plan_id = planId;
      }
    }

    await user.save();
    console.log(`Subscription updated for user ${user._id}`);

  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    const user = await User.findOne({
      "subscription.stripe_subscription_id": subscription.id
    });

    if (!user) {
      console.error("User not found for subscription:", subscription.id);
      return;
    }

    user.subscription = {
      ...user.subscription,
      status: "cancelled",
      cancelled_at: new Date(),
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : new Date()
    };

    await user.save();
    console.log(`Subscription cancelled for user ${user._id}`);

  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}

async function handleInvoicePaid(invoice) {
  try {
    const user = await User.findOne({
      stripe_customer_id: invoice.customer
    });

    if (!user) {
      console.error("User not found for customer:", invoice.customer);
      return;
    }

    if (!user.payment_history) {
      user.payment_history = [];
    }

    user.payment_history.push({
      invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: "paid",
      paid_at: new Date(invoice.status_transitions.paid_at * 1000),
      period_start: new Date(invoice.period_start * 1000),
      period_end: new Date(invoice.period_end * 1000)
    });

    if (user.payment_history.length > 100) {
      user.payment_history = user.payment_history.slice(-100);
    }

    await user.save();
    console.log(`Payment recorded for user ${user._id}`);

  } catch (error) {
    console.error("Error handling invoice paid:", error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    const user = await User.findOne({
      stripe_customer_id: invoice.customer
    });

    if (!user) {
      console.error("User not found for customer:", invoice.customer);
      return;
    }

    if (user.subscription) {
      user.subscription.payment_failed = true;
      user.subscription.payment_failed_at = new Date();
    }

    await user.save();
    console.log(`Payment failed for user ${user._id}`);

  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

function mapPriceIdToPlanId(priceId) {
  const priceMap = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID]: "starter",
    [process.env.STRIPE_STARTER_YEARLY_PRICE_ID]: "starter",
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID]: "professional",
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID]: "professional"
  };

  return priceMap[priceId] || null;
}

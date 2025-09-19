import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

// Price IDs from Stripe Dashboard - replace with your actual price IDs
const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "price_starter_monthly",
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "price_starter_yearly"
  },
  professional: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_professional_monthly",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_professional_yearly"
  }
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { priceId, planId, billingPeriod } = await request.json();

    if (!priceId || !planId || !billingPeriod) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });

      stripeCustomerId = customer.id;

      // Save Stripe customer ID to user
      user.stripe_customer_id = stripeCustomerId;
      await user.save();
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[planId]?.[billingPeriod] || priceId,
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?cancelled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          userId: user._id.toString(),
          planId: planId,
          billingPeriod: billingPeriod
        }
      },
      metadata: {
        userId: user._id.toString(),
        planId: planId
      }
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
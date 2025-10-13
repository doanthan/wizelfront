import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
}) : null;

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
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

    const billingInfo = {
      subscription: null,
      paymentMethod: null,
      invoices: [],
      usage: {
        emailsSent: 0,
        emailLimit: 1000,
        activeCampaigns: 0,
        campaignLimit: 10,
        connectedStores: 0,
        storeLimit: 1
      }
    };

    // Get subscription info
    if (stripe && user.subscription?.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          user.subscription.stripe_subscription_id
        );

        billingInfo.subscription = {
          status: subscription.status,
          planName: getPlanName(user.subscription.plan_id),
          amount: subscription.items.data[0]?.price?.unit_amount / 100,
          currency: subscription.currency,
          interval: subscription.items.data[0]?.price?.recurring?.interval,
          currentPeriodEnd: subscription.current_period_end * 1000,
          nextBillingDate: subscription.current_period_end * 1000,
          cancelAt: subscription.cancel_at ? subscription.cancel_at * 1000 : null,
          trialEnd: subscription.trial_end ? subscription.trial_end * 1000 : null
        };

        // Update usage limits based on plan
        billingInfo.usage = getUsageLimits(user.subscription.plan_id);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    }

    // Get payment method
    if (user.stripe_customer_id) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: user.stripe_customer_id,
          type: "card"
        });

        if (paymentMethods.data.length > 0) {
          const pm = paymentMethods.data[0];
          billingInfo.paymentMethod = {
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year
          };
        }
      } catch (error) {
        console.error("Error fetching payment method:", error);
      }

      // Get invoices
      try {
        const invoices = await stripe.invoices.list({
          customer: user.stripe_customer_id,
          limit: 10
        });

        billingInfo.invoices = invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          created: invoice.created,
          invoice_pdf: invoice.invoice_pdf,
          hosted_invoice_url: invoice.hosted_invoice_url
        }));
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    }

    // Get actual usage (TODO: implement actual usage tracking)
    // For now, return mock data
    billingInfo.usage.emailsSent = 245;
    billingInfo.usage.activeCampaigns = 3;
    billingInfo.usage.connectedStores = user.store_ids?.length || 0;

    return NextResponse.json(billingInfo);

  } catch (error) {
    console.error("Billing info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}

function getPlanName(planId) {
  const plans = {
    free: "Free Plan",
    starter: "Starter Plan",
    professional: "Professional Plan",
    enterprise: "Enterprise Plan"
  };
  return plans[planId] || "Free Plan";
}

function getUsageLimits(planId) {
  const limits = {
    free: {
      emailsSent: 0,
      emailLimit: 1000,
      activeCampaigns: 0,
      campaignLimit: 10,
      connectedStores: 0,
      storeLimit: 1
    },
    starter: {
      emailsSent: 0,
      emailLimit: 10000,
      activeCampaigns: 0,
      campaignLimit: 50,
      connectedStores: 0,
      storeLimit: 3
    },
    professional: {
      emailsSent: 0,
      emailLimit: 50000,
      activeCampaigns: 0,
      campaignLimit: "Unlimited",
      connectedStores: 0,
      storeLimit: 10
    },
    enterprise: {
      emailsSent: 0,
      emailLimit: "Unlimited",
      activeCampaigns: 0,
      campaignLimit: "Unlimited",
      connectedStores: 0,
      storeLimit: "Unlimited"
    }
  };
  return limits[planId] || limits.free;
}
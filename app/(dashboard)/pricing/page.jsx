"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { useChat } from "@/app/contexts/chat-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";
import { Check, X, Zap, TrendingUp, Building, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: "Up to 1,000 email sends/month", included: true },
      { text: "1 connected store", included: true },
      { text: "Basic analytics", included: true },
      { text: "Email support", included: true },
      { text: "Campaign templates", included: true },
      { text: "Advanced segmentation", included: false },
      { text: "Custom branding", included: false },
      { text: "Priority support", included: false },
      { text: "API access", included: false },
      { text: "Team collaboration", included: false }
    ],
    stripePriceId: null,
    popular: false
  },
  {
    id: "starter",
    name: "Starter",
    description: "For growing businesses",
    monthlyPrice: 49,
    yearlyPrice: 470,
    features: [
      { text: "Up to 10,000 email sends/month", included: true },
      { text: "3 connected stores", included: true },
      { text: "Advanced analytics & reporting", included: true },
      { text: "Priority email support", included: true },
      { text: "All campaign templates", included: true },
      { text: "Advanced segmentation", included: true },
      { text: "A/B testing", included: true },
      { text: "Custom branding", included: false },
      { text: "Phone support", included: false },
      { text: "API access", included: false }
    ],
    stripePriceId: {
      monthly: "price_starter_monthly",
      yearly: "price_starter_yearly"
    },
    popular: true
  },
  {
    id: "professional",
    name: "Professional",
    description: "For established brands",
    monthlyPrice: 149,
    yearlyPrice: 1430,
    features: [
      { text: "Up to 50,000 email sends/month", included: true },
      { text: "10 connected stores", included: true },
      { text: "Advanced analytics & reporting", included: true },
      { text: "Priority phone & email support", included: true },
      { text: "All campaign templates", included: true },
      { text: "Advanced segmentation", included: true },
      { text: "A/B testing", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: true },
      { text: "Team collaboration (5 users)", included: true }
    ],
    stripePriceId: {
      monthly: "price_professional_monthly",
      yearly: "price_professional_yearly"
    },
    popular: false
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      { text: "Unlimited email sends", included: true },
      { text: "Unlimited connected stores", included: true },
      { text: "Custom analytics & reporting", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom templates & workflows", included: true },
      { text: "Advanced segmentation", included: true },
      { text: "Multi-variate testing", included: true },
      { text: "White-label solution", included: true },
      { text: "Full API access", included: true },
      { text: "Unlimited team members", included: true }
    ],
    stripePriceId: null,
    popular: false,
    isCustom: true
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { openSupportChat } = useChat();
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSelectPlan = async (plan) => {
    if (plan.id === "free") {
      router.push("/account-settings");
      return;
    }

    if (plan.isCustom) {
      // Handle enterprise/custom pricing
      router.push("/contact-sales");
      return;
    }

    if (!session) {
      router.push("/auth/signin?callbackUrl=/pricing");
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const priceId = plan.stripePriceId[billingPeriod];
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          planId: plan.id,
          billingPeriod
        })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url; // Redirect to Stripe Checkout
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const yearlyDiscount = billingPeriod === "yearly";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-sky-blue to-vivid-violet text-white border-0">
            SIMPLE PRICING
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-gray dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-neutral-gray dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn(
              "font-medium",
              billingPeriod === "monthly" ? "text-slate-gray dark:text-white" : "text-neutral-gray"
            )}>
              Monthly
            </span>
            <Switch
              checked={billingPeriod === "yearly"}
              onCheckedChange={(checked) => setBillingPeriod(checked ? "yearly" : "monthly")}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-sky-blue data-[state=checked]:to-vivid-violet"
            />
            <span className={cn(
              "font-medium",
              billingPeriod === "yearly" ? "text-slate-gray dark:text-white" : "text-neutral-gray"
            )}>
              Yearly
              {yearlyDiscount && (
                <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Save 20%
                </Badge>
              )}
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                plan.popular && "border-2 border-sky-blue shadow-lg scale-105"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-sky-blue to-vivid-violet text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {plan.id === "free" && <Zap className="h-5 w-5 text-neutral-gray" />}
                  {plan.id === "starter" && <TrendingUp className="h-5 w-5 text-sky-blue" />}
                  {plan.id === "professional" && <Building className="h-5 w-5 text-vivid-violet" />}
                  {plan.id === "enterprise" && <Building className="h-5 w-5 text-deep-purple" />}
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  {plan.isCustom ? (
                    <div className="text-3xl font-bold text-slate-gray dark:text-white">
                      Custom
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold text-slate-gray dark:text-white">
                        {billingPeriod === "monthly"
                          ? formatCurrency(plan.monthlyPrice).replace(".00", "")
                          : formatCurrency(plan.yearlyPrice / 12).replace(".00", "")}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-neutral-gray ml-2">/month</span>
                      )}
                      {billingPeriod === "yearly" && plan.yearlyPrice > 0 && (
                        <div className="text-sm text-neutral-gray mt-1">
                          {formatCurrency(plan.yearlyPrice)} billed yearly
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <span className={cn(
                        "text-sm",
                        feature.included ? "text-slate-gray dark:text-gray-200" : "text-gray-400 dark:text-gray-600"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                      : plan.id === "free"
                      ? "bg-gray-100 hover:bg-gray-200 text-slate-gray dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                      : "bg-white hover:bg-gray-50 text-slate-gray border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700"
                  )}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? (
                    <MorphingLoader size="small" showThemeText={false} />
                  ) : plan.isCustom ? (
                    "Contact Sales"
                  ) : plan.id === "free" ? (
                    "Get Started"
                  ) : (
                    <>
                      Start Free Trial
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-gray dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-gray">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-gray">
                  We accept all major credit cards (Visa, MasterCard, American Express) and process payments securely through Stripe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-gray">
                  Yes! All paid plans come with a 14-day free trial. No credit card required to start.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-gray">
                  Absolutely. You can cancel your subscription at any time from your billing settings. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4 text-slate-gray dark:text-white">
            Still have questions?
          </h3>
          <p className="text-neutral-gray mb-6">
            Our team is here to help you choose the right plan for your business.
          </p>
          <Button variant="outline" size="lg" onClick={openSupportChat}>
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
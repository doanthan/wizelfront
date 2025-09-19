"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { useToast } from "@/app/components/ui/use-toast";
import MorphingLoader from "@/app/components/ui/loading";
import {
  CreditCard, Download, Calendar, Package, ChevronRight, AlertCircle,
  CheckCircle, XCircle, RefreshCw, FileText, TrendingUp, Zap
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    subscription: null,
    paymentMethod: null,
    invoices: [],
    usage: null
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchBillingInfo();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/billing/info");
      if (response.ok) {
        const data = await response.json();
        setBillingInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing info:", error);
      toast({
        title: "Error",
        description: "Failed to load billing information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      return;
    }

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST"
      });

      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled and will end at the end of the current billing period."
        });
        fetchBillingInfo();
      } else {
        throw new Error("Failed to cancel subscription");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      const response = await fetch("/api/billing/update-payment", {
        method: "POST"
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error("Failed to create update session");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment method.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`/api/billing/invoice/${invoiceId}`);
      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        throw new Error("Failed to get invoice");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice.",
        variant: "destructive"
      });
    }
  };

  // Show loader only when actively loading data, not during session check
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" showText={true} text="Loading billing information..." />
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  const subscription = billingInfo.subscription || {};
  const paymentMethod = billingInfo.paymentMethod;
  const usage = billingInfo.usage || {};

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white">Billing & Subscription</h1>
        <p className="text-neutral-gray dark:text-gray-400 mt-2">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Current Subscription */}
      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-sky-blue" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription.status ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {subscription.planName || "Free Plan"}
                      {subscription.status === "active" && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                      {subscription.status === "trialing" && (
                        <Badge className="bg-blue-100 text-blue-800">Trial</Badge>
                      )}
                      {subscription.status === "cancelled" && (
                        <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
                      )}
                    </h3>
                    <p className="text-neutral-gray mt-1">
                      {formatCurrency(subscription.amount || 0)} / {subscription.interval || "month"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {subscription.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/pricing")}
                        >
                          Change Plan
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={handleCancelSubscription}
                        >
                          Cancel Subscription
                        </Button>
                      </>
                    )}
                    {(!subscription.status || subscription.status === "cancelled") && (
                      <Button
                        className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                        onClick={() => router.push("/pricing")}
                      >
                        Upgrade Now
                        <Zap className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>

                {subscription.nextBillingDate && (
                  <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="h-4 w-4 text-neutral-gray" />
                    <span className="text-sm">
                      Next billing date: <strong>{new Date(subscription.nextBillingDate).toLocaleDateString()}</strong>
                    </span>
                  </div>
                )}

                {subscription.cancelAt && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">
                      Your subscription will end on {new Date(subscription.cancelAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                <p className="text-neutral-gray mb-6">
                  Upgrade to a paid plan to unlock premium features
                </p>
                <Button
                  className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                  onClick={() => router.push("/pricing")}
                >
                  View Plans
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        {subscription.status === "active" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-blue" />
                Current Usage
              </CardTitle>
              <CardDescription>
                Track your usage against your plan limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Email Sends</span>
                    <span className="text-sm text-neutral-gray">
                      {usage.emailsSent || 0} / {usage.emailLimit || "Unlimited"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-sky-blue to-vivid-violet h-2 rounded-full"
                      style={{ width: `${Math.min((usage.emailsSent || 0) / (usage.emailLimit || 100000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Active Campaigns</span>
                    <span className="text-sm text-neutral-gray">
                      {usage.activeCampaigns || 0} / {usage.campaignLimit || "Unlimited"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-sky-blue to-vivid-violet h-2 rounded-full"
                      style={{ width: `${Math.min((usage.activeCampaigns || 0) / (usage.campaignLimit || 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Connected Stores</span>
                    <span className="text-sm text-neutral-gray">
                      {usage.connectedStores || 0} / {usage.storeLimit || "Unlimited"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-sky-blue to-vivid-violet h-2 rounded-full"
                      style={{ width: `${Math.min((usage.connectedStores || 0) / (usage.storeLimit || 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-sky-blue" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethod ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-neutral-gray" />
                    <div>
                      <p className="font-medium">
                        {paymentMethod.brand} •••• {paymentMethod.last4}
                      </p>
                      <p className="text-sm text-neutral-gray">
                        Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleUpdatePaymentMethod}>
                    Update
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-neutral-gray mb-4">No payment method on file</p>
                <Button variant="outline" onClick={handleUpdatePaymentMethod}>
                  Add Payment Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-blue" />
              Billing History
            </CardTitle>
            <CardDescription>
              Download invoices for your records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billingInfo.invoices && billingInfo.invoices.length > 0 ? (
              <div className="space-y-2">
                {billingInfo.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-4 w-4 text-neutral-gray" />
                      <div>
                        <p className="font-medium text-sm">
                          Invoice #{invoice.number}
                        </p>
                        <p className="text-xs text-neutral-gray">
                          {new Date(invoice.created * 1000).toLocaleDateString()} • {formatCurrency(invoice.amount_paid / 100)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.status === "paid" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : invoice.status === "open" ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-neutral-gray">No invoices yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Store } from "lucide-react";

export default function SuperuserStoresPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white mb-2">
          Store Analytics
        </h1>
        <p className="text-neutral-gray dark:text-gray-400">
          Monitor store performance and metrics across all accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Analytics Dashboard</CardTitle>
          <CardDescription>Comprehensive store analytics and reporting tools</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Store className="h-16 w-16 text-neutral-gray mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-gray dark:text-white mb-2">
            Store Analytics Dashboard
          </h3>
          <p className="text-neutral-gray dark:text-gray-400 mb-4">
            Advanced store analytics and performance monitoring coming soon
          </p>
          <div className="space-y-2 text-left max-w-md mx-auto mb-6">
            <p className="text-sm text-neutral-gray">• Multi-store performance comparison</p>
            <p className="text-sm text-neutral-gray">• Real-time revenue tracking</p>
            <p className="text-sm text-neutral-gray">• Store health monitoring</p>
            <p className="text-sm text-neutral-gray">• Integration status overview</p>
          </div>
          <Button variant="outline">
            View Current Stores
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
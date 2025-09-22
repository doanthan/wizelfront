"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatCurrency } from '@/lib/utils';
import { Package } from 'lucide-react';

export default function ApvTab({ reportData }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Average Purchase Value
          </CardTitle>
          <CardDescription>
            Order value metrics and optimization insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current AOV</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(reportData?.avg_order_value || 0)}
              </p>
              {reportData?.previous_period?.avg_order_value && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Previous: {formatCurrency(reportData.previous_period.avg_order_value)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue per Customer</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  reportData?.unique_customers > 0 ?
                  reportData.overall_revenue / reportData.unique_customers : 0
                )}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Orders per Customer</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {reportData?.unique_customers > 0 ?
                  (reportData.total_orders / reportData.unique_customers).toFixed(1) : '0'}
              </p>
            </div>
          </div>

          {/* Value Distribution */}
          <div className="pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Value Insights</h4>
            <div className="p-4 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Your average order value is {reportData?.avg_order_value > 100 ? 'above' : 'below'} the industry average.
                {reportData?.avg_order_value > 100 ?
                  ' Consider bundle offers to increase further.' :
                  ' Focus on upselling and cross-selling strategies.'}
              </p>
            </div>
          </div>

          {/* Order Value Trends */}
          {reportData && (
            <div className="pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Performance Metrics</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(reportData.overall_revenue || 0)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {reportData.total_orders || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { Users } from 'lucide-react';

export default function LtvTab({ reportData }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-vivid-violet" />
            Customer Lifetime Value
          </CardTitle>
          <CardDescription>
            Track and analyze customer value over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average LTV</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(reportData?.avg_order_value ? reportData.avg_order_value * 3.2 : 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Based on 3.2x AOV industry average
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Customer Retention</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(reportData?.repeat_rate || 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Returning customer rate
              </p>
            </div>
          </div>

          {/* Customer Segments */}
          <div className="pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Customer Segments</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">New Customers</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(reportData?.new_customers || 0)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  First-time buyers this period
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Returning Customers</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(reportData?.returning_customers || 0)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Repeat buyers this period
                </p>
              </div>
            </div>
          </div>

          {/* Customer Value Insights */}
          <div className="pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Value Metrics</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue per Customer</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(
                    reportData?.unique_customers > 0 ?
                    reportData.overall_revenue / reportData.unique_customers : 0
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Unique Customers</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(reportData?.unique_customers || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {reportData?.new_customers && reportData?.unique_customers ?
                    formatPercentage((reportData.new_customers / reportData.unique_customers) * 100) : '0%'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatNumber, formatPercentage } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export default function RepeatCustomersTab({ reportData }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-deep-purple" />
            Repeat Customer Analysis
          </CardTitle>
          <CardDescription>
            Customer retention and loyalty metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Repeat Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(reportData?.returning_customers || 0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatPercentage(reportData?.repeat_rate || 0)} of total
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Repeat Purchase Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(reportData?.repeat_rate || 0)}
              </p>
              {reportData?.previous_period && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Previous: {formatPercentage(
                    reportData.previous_period.returning_customers && reportData.previous_period.unique_customers ?
                    (reportData.previous_period.returning_customers / reportData.previous_period.unique_customers * 100) : 0
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Customer Churn Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(100 - (reportData?.repeat_rate || 0))}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Monthly average
              </p>
            </div>
          </div>

          {/* Retention Metrics */}
          <div className="pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Retention Metrics</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">New vs Returning Ratio</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {reportData?.new_customers || 0} : {reportData?.returning_customers || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  New to returning customer ratio
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer Growth</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {reportData?.new_customers > reportData?.returning_customers ? '+' : ''}{formatPercentage(
                    reportData?.unique_customers > 0 ?
                    ((reportData?.new_customers - reportData?.returning_customers) / reportData?.unique_customers * 100) : 0
                  )}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Net customer growth rate
                </p>
              </div>
            </div>
          </div>

          {/* Loyalty Insights */}
          <div className="pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Retention Strategy</h4>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {reportData?.repeat_rate > 30 ?
                  'Great retention rate! Focus on increasing purchase frequency with targeted campaigns.' :
                  'Consider implementing a loyalty program and win-back campaigns to improve retention.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
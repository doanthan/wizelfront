"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

export default function TotalSalesTab({ reportData }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-sky-blue" />
            Total Sales Performance
          </CardTitle>
          <CardDescription>
            Comprehensive sales metrics and trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(reportData?.overall_revenue || 0)}
              </p>
              {reportData?.previous_period?.overall_revenue && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Previous: {formatCurrency(reportData.previous_period.overall_revenue)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(reportData?.total_orders || 0)}
              </p>
              {reportData?.previous_period?.total_orders && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Previous: {formatNumber(reportData.previous_period.total_orders)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Order Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(reportData?.avg_order_value || 0)}
              </p>
              {reportData?.previous_period?.avg_order_value && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Previous: {formatCurrency(reportData.previous_period.avg_order_value)}
                </p>
              )}
            </div>
          </div>

          {/* Sales by Channel */}
          {reportData?.channel_breakdown && (
            <div className="pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Sales by Channel</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Campaign Revenue</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(reportData.channel_breakdown.campaign_revenue)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatPercentage(reportData.channel_breakdown.campaign_percentage)} of total
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Flow Revenue</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(reportData.channel_breakdown.flow_revenue)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatPercentage(reportData.channel_breakdown.flow_percentage)} of total
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Other Revenue</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(reportData.channel_breakdown.other_revenue)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatPercentage(reportData.channel_breakdown.other_percentage)} of total
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
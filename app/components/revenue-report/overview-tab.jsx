"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import {
  DollarSign, ShoppingCart, Users, Package,
  RefreshCw, Mail, Target, Activity, MousePointer,
  ArrowUp, ArrowDown
} from 'lucide-react';

export default function OverviewTab({ reportData, currentStore }) {
  // Calculate percentage change helper
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate metric card data
  const getMetricCardData = () => {
    if (!reportData) return [];

    const {
      overall_revenue = 0,
      attributed_revenue = 0,
      attributed_percentage = 0,
      total_orders = 0,
      unique_customers = 0,
      avg_order_value = 0,
      new_customers = 0,
      returning_customers = 0,
      repeat_rate = 0,
      previous_period = {}
    } = reportData || {};

    return [
      {
        title: "Overall Revenue",
        value: formatCurrency(overall_revenue || 0),
        change: getPercentageChange(overall_revenue, previous_period?.overall_revenue),
        icon: DollarSign,
        color: "text-sky-blue"
      },
      {
        title: "Attributed Revenue",
        value: formatCurrency(attributed_revenue || 0),
        change: getPercentageChange(attributed_revenue, previous_period?.attributed_revenue),
        icon: Target,
        color: "text-vivid-violet",
        subtitle: reportData.attributed_percentage ?
          `${formatPercentage(reportData.attributed_percentage)} of total` : null
      },
      {
        title: "Total Orders",
        value: formatNumber(total_orders || 0),
        change: getPercentageChange(total_orders, previous_period?.total_orders),
        icon: ShoppingCart,
        color: "text-deep-purple"
      },
      {
        title: "Unique Customers",
        value: formatNumber(unique_customers || 0),
        change: getPercentageChange(unique_customers, previous_period?.unique_customers),
        icon: Users,
        color: "text-royal-blue"
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(avg_order_value || 0),
        change: getPercentageChange(avg_order_value, previous_period?.avg_order_value),
        icon: Package,
        color: "text-green-600"
      },
      {
        title: "New Customers",
        value: formatNumber(new_customers || 0),
        change: getPercentageChange(new_customers, previous_period?.new_customers),
        icon: Users,
        color: "text-orange-600"
      },
      {
        title: "Returning Customers",
        value: formatNumber(returning_customers || 0),
        subtitle: repeat_rate ? `${formatPercentage(repeat_rate)} repeat rate` : null,
        icon: RefreshCw,
        color: "text-purple-600"
      },
      {
        title: "Email Performance",
        value: reportData.brand?.total_campaigns ?
          `${reportData.brand.total_campaigns} campaigns` : "0 campaigns",
        subtitle: reportData.brand?.active_flows ?
          `${reportData.brand.active_flows} active flows` : null,
        icon: Mail,
        color: "text-blue-600"
      }
    ];
  };

  const metricCards = getMetricCardData();

  return (
    <div className="space-y-4">
      {/* Metrics Grid - matching SimpleDashboard style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
              {card.change !== undefined && card.change !== 0 && (
                <p className={`text-xs flex items-center ${
                  card.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change > 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {formatPercentage(Math.abs(card.change))} from last period
                </p>
              )}
              {card.subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Attribution Breakdown */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Attribution Breakdown</CardTitle>
            <CardDescription>
              Channel performance for {reportData.brand?.name || currentStore?.name || 'this store'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-sky-blue" />
                    <span className="text-sm">Email Campaigns</span>
                  </div>
                  <span className="text-sm font-medium">
                    {reportData?.channel_breakdown ?
                      formatPercentage(reportData.channel_breakdown.campaign_percentage) : '0%'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-blue to-vivid-violet"
                    style={{ width: `${reportData?.channel_breakdown?.campaign_percentage || 0}%` }}
                  />
                </div>
                {reportData?.channel_breakdown && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatCurrency(reportData.channel_breakdown.campaign_revenue)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-vivid-violet" />
                    <span className="text-sm">Automated Flows</span>
                  </div>
                  <span className="text-sm font-medium">
                    {reportData?.channel_breakdown ?
                      formatPercentage(reportData.channel_breakdown.flow_percentage) : '0%'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-vivid-violet to-deep-purple"
                    style={{ width: `${reportData?.channel_breakdown?.flow_percentage || 0}%` }}
                  />
                </div>
                {reportData?.channel_breakdown && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatCurrency(reportData.channel_breakdown.flow_revenue)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-deep-purple" />
                    <span className="text-sm">Other Revenue</span>
                  </div>
                  <span className="text-sm font-medium">
                    {reportData?.channel_breakdown ?
                      formatPercentage(reportData.channel_breakdown.other_percentage) : '0%'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-deep-purple to-royal-blue"
                    style={{ width: `${reportData?.channel_breakdown?.other_percentage || 0}%` }}
                  />
                </div>
                {reportData?.channel_breakdown && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatCurrency(reportData.channel_breakdown.other_revenue)}
                  </p>
                )}
              </div>
            </div>

            {/* Brand Info */}
            {reportData?.brand && (
              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Segments</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{reportData.brand.segments || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{reportData.brand.total_campaigns || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Flows</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{reportData.brand.active_flows || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
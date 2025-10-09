"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import {
  DollarSign, ShoppingCart, Users, Package,
  RefreshCw, Mail, Target, Activity, MousePointer,
  TrendingUp, TrendingDown
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

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
        currentValue: overall_revenue,
        previousValue: previous_period?.overall_revenue,
        change: getPercentageChange(overall_revenue, previous_period?.overall_revenue),
        icon: DollarSign,
        type: "currency"
      },
      {
        title: "Attributed Revenue",
        value: formatCurrency(attributed_revenue || 0),
        currentValue: attributed_revenue,
        previousValue: previous_period?.attributed_revenue,
        change: getPercentageChange(attributed_revenue, previous_period?.attributed_revenue),
        icon: Target,
        type: "currency",
        subtitle: reportData.attributed_percentage ?
          `${formatPercentage(reportData.attributed_percentage)} of total` : null
      },
      {
        title: "Total Orders",
        value: formatNumber(total_orders || 0),
        currentValue: total_orders,
        previousValue: previous_period?.total_orders,
        change: getPercentageChange(total_orders, previous_period?.total_orders),
        icon: ShoppingCart,
        type: "number"
      },
      {
        title: "Unique Customers",
        value: formatNumber(unique_customers || 0),
        currentValue: unique_customers,
        previousValue: previous_period?.unique_customers,
        change: getPercentageChange(unique_customers, previous_period?.unique_customers),
        icon: Users,
        type: "number"
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(avg_order_value || 0),
        currentValue: avg_order_value,
        previousValue: previous_period?.avg_order_value,
        change: getPercentageChange(avg_order_value, previous_period?.avg_order_value),
        icon: Package,
        type: "currency"
      },
      {
        title: "New Customers",
        value: formatNumber(new_customers || 0),
        currentValue: new_customers,
        previousValue: previous_period?.new_customers,
        change: getPercentageChange(new_customers, previous_period?.new_customers),
        icon: Users,
        type: "number"
      },
      {
        title: "Returning Customers",
        value: formatNumber(returning_customers || 0),
        currentValue: returning_customers,
        previousValue: previous_period?.returning_customers,
        change: getPercentageChange(returning_customers, previous_period?.returning_customers),
        icon: RefreshCw,
        type: "number",
        subtitle: repeat_rate ? `${formatPercentage(repeat_rate)} repeat rate` : null
      },
      {
        title: "Email Performance",
        value: reportData.brand?.total_campaigns ?
          `${reportData.brand.total_campaigns} campaigns` : "0 campaigns",
        subtitle: reportData.brand?.active_flows ?
          `${reportData.brand.active_flows} active flows` : null,
        icon: Mail
      }
    ];
  };

  const metricCards = getMetricCardData();

  // Prepare pie chart data with separate email/SMS campaigns
  const pieChartData = reportData?.channel_breakdown ? [
    {
      name: 'Email Campaigns',
      value: reportData.channel_breakdown.campaign_email_revenue || 0,
      percentage: reportData.channel_breakdown.campaign_email_percentage || 0,
      color: '#60A5FA' // sky-blue
    },
    {
      name: 'SMS Campaigns',
      value: reportData.channel_breakdown.campaign_sms_revenue || 0,
      percentage: reportData.channel_breakdown.campaign_sms_percentage || 0,
      color: '#F59E0B' // orange
    },
    {
      name: 'Automated Flows',
      value: reportData.channel_breakdown.flow_revenue || 0,
      percentage: reportData.channel_breakdown.flow_percentage || 0,
      color: '#10B981' // green
    },
    {
      name: 'Other Revenue',
      value: reportData.channel_breakdown.other_revenue || 0,
      percentage: reportData.channel_breakdown.other_percentage || 0,
      color: '#8B5CF6' // vivid-violet
    }
  ].filter(item => item.value > 0) : [];

  // Prepare revenue over time data
  const revenueOverTimeData = reportData?.revenue_by_day || [];

  // Debug logging
  console.log('Revenue report data:', {
    hasReportData: !!reportData,
    hasRevenueByDay: !!reportData?.revenue_by_day,
    revenueByDayLength: revenueOverTimeData.length,
    sampleData: revenueOverTimeData[0]
  });

  return (
    <div className="space-y-4">
      {/* Metrics Grid - Minimalist Dashboard Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
              {card.subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {card.subtitle}
                </p>
              )}
              {card.change !== undefined && card.previousValue !== undefined ? (
                <div className="mt-1">
                  <p className={`text-xs font-medium flex items-center gap-1 ${
                    card.change > 0 ? 'text-green-600 dark:text-green-500' :
                    card.change < 0 ? 'text-red-600 dark:text-red-500' :
                    'text-gray-600 dark:text-gray-500'
                  }`}>
                    {card.change > 0 ? <TrendingUp className="h-3 w-3" /> :
                     card.change < 0 ? <TrendingDown className="h-3 w-3" /> :
                     <span className="h-3 w-3 inline-block text-center">—</span>}
                    {card.change === 0 ? 'No change' :
                     card.previousValue === 0 && card.currentValue > 0 ? 'New!' :
                     Math.abs(card.change) > 1000 ? '>1,000%' :
                     `${Math.abs(card.change).toFixed(1)}%`} from last period
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                    Previous: {card.previousValue === 0 ?
                      (card.type === 'currency' ? '$0' : '0') :
                      card.type === 'currency' ? formatCurrency(card.previousValue) :
                      formatNumber(Math.round(card.previousValue))
                    }
                  </p>
                </div>
              ) : card.change !== undefined && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No comparison data</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Attribution Breakdown - Pie Chart */}
        {reportData && pieChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Attribution Breakdown</CardTitle>
              <CardDescription>
                Channel performance for {reportData.brand?.name || currentStore?.name || 'this store'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${formatPercentage(percentage)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Brand Info */}
              {reportData?.brand && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
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

        {/* Revenue Over Time - Line Chart */}
        {reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Total revenue and channel breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueOverTimeData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  No daily revenue data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1e293b"
                    strokeWidth={3}
                    dot={false}
                    name="Total Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="email_campaign_revenue"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    dot={false}
                    name="Email Campaigns"
                  />
                  <Line
                    type="monotone"
                    dataKey="sms_campaign_revenue"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    name="SMS Campaigns"
                  />
                  <Line
                    type="monotone"
                    dataKey="flow_revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="Automated Flows"
                  />
                  <Line
                    type="monotone"
                    dataKey="other_revenue"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                    name="Other Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { formatPercentage, formatCurrency } from '@/lib/utils';

/**
 * Revenue Efficiency Breakdown Component
 *
 * Shows the revenue funnel breakdown:
 * Open Rate × Click Rate × Conversion Rate × AOV = Revenue per Recipient
 *
 * Identifies which stage of the funnel is the bottleneck
 */
export default function RevenueEfficiencyBreakdown({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue Efficiency Breakdown
          </CardTitle>
          <CardDescription>Loading efficiency metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue Efficiency Breakdown
          </CardTitle>
          <CardDescription>No data available for the selected period</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { current, previous, weeklyTrend, bottleneck, insights } = data;

  // Calculate percentage changes
  const changes = {
    openRate: previous.openRate > 0
      ? ((current.openRate - previous.openRate) / previous.openRate) * 100
      : 0,
    clickRate: previous.clickRate > 0
      ? ((current.clickRate - previous.clickRate) / previous.clickRate) * 100
      : 0,
    conversionRate: previous.conversionRate > 0
      ? ((current.conversionRate - previous.conversionRate) / previous.conversionRate) * 100
      : 0,
    aov: previous.averageOrderValue > 0
      ? ((current.averageOrderValue - previous.averageOrderValue) / previous.averageOrderValue) * 100
      : 0,
    rpr: previous.revenuePerRecipient > 0
      ? ((current.revenuePerRecipient - previous.revenuePerRecipient) / previous.revenuePerRecipient) * 100
      : 0
  };

  // Prepare funnel data for visualization
  const funnelData = [
    {
      stage: 'Delivered',
      current: 100,
      previous: 100,
      label: 'Recipients',
      count: current.delivered
    },
    {
      stage: 'Opened',
      current: current.openRate,
      previous: previous.openRate,
      label: 'Open Rate',
      count: current.opensUnique
    },
    {
      stage: 'Clicked',
      current: current.clickRate,
      previous: previous.clickRate,
      label: 'Click Rate',
      count: current.clicksUnique
    },
    {
      stage: 'Converted',
      current: current.conversionRate,
      previous: previous.conversionRate,
      label: 'Conv. Rate',
      count: current.conversions
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Efficiency Breakdown
            </CardTitle>
            <CardDescription>
              Analyze which stage of your funnel needs optimization
            </CardDescription>
          </div>
          <Target className="h-6 w-6 text-vivid-violet" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Bottleneck Alert */}
        {bottleneck && bottleneck.metric !== 'none' && (
          <div className="mb-6 p-4 rounded-lg border-l-4 bg-orange-50 border-orange-500 dark:bg-orange-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Bottleneck Identified: {bottleneck.metric.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {bottleneck.message}
                </p>
                <div className="text-sm font-medium text-orange-600 mt-2">
                  Down {Math.abs(bottleneck.change).toFixed(1)}% vs. previous period
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue per Recipient Summary */}
        <div className="mb-6 p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Revenue per Recipient
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(current.revenuePerRecipient)}
              </div>
            </div>
            <DollarSign className="h-12 w-12 text-green-600 opacity-50" />
          </div>
          <div className="flex items-center gap-2">
            {changes.rpr >= 0 ? (
              <Badge variant="success" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{changes.rpr.toFixed(1)}%
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                {changes.rpr.toFixed(1)}%
              </Badge>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              vs. {formatCurrency(previous.revenuePerRecipient)} previous period
            </span>
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            Formula: Open Rate × Click Rate × Conversion Rate × AOV ÷ Recipients
          </div>
        </div>

        {/* Funnel Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {/* Open Rate */}
          <div className={`p-4 rounded-lg border ${
            changes.openRate < 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          }`}>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Open Rate
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(current.openRate)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {changes.openRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                changes.openRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {changes.openRate > 0 ? '+' : ''}{changes.openRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {current.opensUnique.toLocaleString()} opens
            </div>
          </div>

          {/* Click Rate */}
          <div className={`p-4 rounded-lg border ${
            changes.clickRate < 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
          }`}>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Click Rate
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(current.clickRate)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {changes.clickRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                changes.clickRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {changes.clickRate > 0 ? '+' : ''}{changes.clickRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {current.clicksUnique.toLocaleString()} clicks
            </div>
          </div>

          {/* Conversion Rate */}
          <div className={`p-4 rounded-lg border ${
            changes.conversionRate < 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
          }`}>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Conversion Rate
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(current.conversionRate)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {changes.conversionRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                changes.conversionRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {changes.conversionRate > 0 ? '+' : ''}{changes.conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {current.conversions.toLocaleString()} orders
            </div>
          </div>

          {/* Average Order Value */}
          <div className={`p-4 rounded-lg border ${
            changes.aov < 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          }`}>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Avg Order Value
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(current.averageOrderValue)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {changes.aov >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                changes.aov >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {changes.aov > 0 ? '+' : ''}{changes.aov.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatCurrency(current.revenue)} total
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Conversion Funnel: Current vs. Previous Period
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="stage"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                itemStyle={{
                  color: '#111827'
                }}
                labelStyle={{
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}
                formatter={(value, name, props) => {
                  if (name === 'Current Period') {
                    return [`${value.toFixed(2)}% (${props.payload.count.toLocaleString()})`, name];
                  }
                  return [`${value.toFixed(2)}%`, name];
                }}
              />
              <Legend />

              <Area
                type="monotone"
                dataKey="previous"
                name="Previous Period"
                stroke="#94A3B8"
                fill="#94A3B8"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="current"
                name="Current Period"
                stroke="#60A5FA"
                fill="#60A5FA"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        {weeklyTrend && weeklyTrend.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Efficiency Trend Over Time
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Revenue per Recipient' || name === 'AOV') {
                      return [formatCurrency(value), name];
                    }
                    return [`${value.toFixed(2)}%`, name];
                  }}
                />
                <Legend />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="openRate"
                  name="Open Rate"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={{ fill: '#60A5FA', r: 3 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clickRate"
                  name="Click Rate"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 3 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversionRate"
                  name="Conversion Rate"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenuePerRecipient"
                  name="Revenue per Recipient"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Insights and Recommendations */}
        {insights && insights.recommendations && insights.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Optimization Recommendations
            </h4>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {insights.message}
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mt-3">
              {insights.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

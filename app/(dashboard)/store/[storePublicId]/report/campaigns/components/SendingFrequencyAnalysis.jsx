"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { formatPercentage, formatCurrency } from '@/lib/utils';

/**
 * Sending Frequency vs. Engagement Analysis Component
 *
 * Shows correlation between campaign frequency and engagement metrics:
 * - Campaign count per week (bars)
 * - Open Rate trend (line)
 * - Unsubscribe Rate trend (line)
 * - Revenue per Recipient trend (line)
 */
export default function SendingFrequencyAnalysis({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Sending Frequency vs. Engagement Impact
          </CardTitle>
          <CardDescription>Loading frequency analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.trendData || data.trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Sending Frequency vs. Engagement Impact
          </CardTitle>
          <CardDescription>No data available for the selected period</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { trendData, correlation, insights } = data;

  // Determine if correlation is negative (bad) or positive (good)
  const isNegativeCorrelation = correlation?.frequencyVsOpenRate < -0.3;
  const isPositiveUnsubscribeCorrelation = correlation?.frequencyVsUnsubscribeRate > 0.3;

  const getCorrelationBadge = (value) => {
    if (value < -0.5) return { variant: 'destructive', label: 'Strong Negative', icon: TrendingDown };
    if (value < -0.3) return { variant: 'warning', label: 'Negative', icon: TrendingDown };
    if (value > 0.5) return { variant: 'success', label: 'Strong Positive', icon: TrendingUp };
    if (value > 0.3) return { variant: 'success', label: 'Positive', icon: TrendingUp };
    return { variant: 'secondary', label: 'Neutral', icon: CheckCircle };
  };

  const openRateCorr = correlation ? getCorrelationBadge(correlation.frequencyVsOpenRate) : null;
  const unsubCorr = correlation ? getCorrelationBadge(correlation.frequencyVsUnsubscribeRate) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Sending Frequency vs. Engagement Impact
            </CardTitle>
            <CardDescription>
              Analyze how your sending frequency affects subscriber engagement
            </CardDescription>
          </div>
          <Calendar className="h-6 w-6 text-sky-blue" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Correlation Summary */}
        {correlation && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-100 dark:border-sky-800">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Avg Campaigns per Week
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {correlation.avgFrequency.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Campaigns sent per week on average
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Frequency → Open Rate
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={openRateCorr.variant} className="flex items-center gap-1">
                  <openRateCorr.icon className="h-3 w-3" />
                  {openRateCorr.label}
                </Badge>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {correlation.frequencyVsOpenRate.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Correlation coefficient
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-100 dark:border-orange-800">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Frequency → Unsubscribes
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={isPositiveUnsubscribeCorrelation ? 'destructive' : 'success'}
                  className="flex items-center gap-1"
                >
                  {isPositiveUnsubscribeCorrelation ? (
                    <><AlertTriangle className="h-3 w-3" /> Warning</>
                  ) : (
                    <><CheckCircle className="h-3 w-3" /> Good</>
                  )}
                </Badge>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {correlation.frequencyVsUnsubscribeRate.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Correlation coefficient
              </div>
            </div>
          </div>
        )}

        {/* Alert Banner */}
        {(isNegativeCorrelation || isPositiveUnsubscribeCorrelation) && (
          <div className="mb-6 p-4 rounded-lg border-l-4 bg-orange-50 border-orange-500 dark:bg-orange-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {isPositiveUnsubscribeCorrelation
                    ? '⚠️ Over-sending Alert: Increased frequency is causing unsubscribes'
                    : 'Sending frequency is negatively impacting engagement'
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {insights?.message || 'Consider reducing your send frequency or improving audience targeting'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Campaign Frequency vs. Engagement Over Time
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'Campaign Count', angle: -90, position: 'insideLeft', style: { fill: 'currentColor' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                label={{ value: 'Rate (%)', angle: 90, position: 'insideRight', style: { fill: 'currentColor' } }}
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
                formatter={(value, name) => {
                  if (name === 'Campaigns Sent') return [value, name];
                  if (name === 'Revenue per Recipient') return [formatCurrency(value), name];
                  return [`${value.toFixed(2)}%`, name];
                }}
              />
              <Legend />

              {/* Bar for campaign count */}
              <Bar
                yAxisId="left"
                dataKey="campaignCount"
                name="Campaigns Sent"
                fill="#60A5FA"
                opacity={0.7}
                radius={[4, 4, 0, 0]}
              />

              {/* Line for open rate */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="openRate"
                name="Open Rate"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ fill: '#22C55E', r: 4 }}
                activeDot={{ r: 6 }}
              />

              {/* Line for unsubscribe rate */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="unsubscribeRate"
                name="Unsubscribe Rate"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 4 }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue per Recipient Trend */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Impact of Sending Frequency
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: 'currentColor' }}
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
                  if (name === 'Campaigns Sent') return [value, name];
                  return [formatCurrency(value), name];
                }}
              />
              <Legend />

              <Bar
                yAxisId="left"
                dataKey="campaignCount"
                name="Campaigns Sent"
                fill="#8B5CF6"
                opacity={0.5}
                radius={[4, 4, 0, 0]}
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenuePerRecipient"
                name="Revenue per Recipient"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights and Recommendations */}
        {insights && insights.recommendations && insights.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Recommendations to Optimize Sending Frequency
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {insights.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Insights */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Understanding Correlation:</h5>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li><strong>Positive correlation (Frequency → Open Rate):</strong> More sends = Higher engagement (good!)</li>
            <li><strong>Negative correlation (Frequency → Open Rate):</strong> More sends = Lower engagement (email fatigue)</li>
            <li><strong>Positive correlation (Frequency → Unsubscribes):</strong> More sends = More unsubscribes (warning!)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

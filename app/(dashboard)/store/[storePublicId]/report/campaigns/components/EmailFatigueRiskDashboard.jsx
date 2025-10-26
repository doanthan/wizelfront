"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { formatPercentage } from '@/lib/utils';

/**
 * Email Fatigue Risk Dashboard Component
 *
 * Shows list health metrics over time:
 * - Unsubscribe Rate
 * - Bounce Rate
 * - Spam Complaint Rate
 *
 * With threshold warning zones and risk scoring
 */
export default function EmailFatigueRiskDashboard({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Fatigue Risk Dashboard
          </CardTitle>
          <CardDescription>Loading fatigue metrics...</CardDescription>
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
            Email Fatigue Risk Dashboard
          </CardTitle>
          <CardDescription>No data available for the selected period</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { trendData, summary } = data;
  const { current, previous, riskScore, riskLevel } = summary;

  // Get risk level styling
  const getRiskBadgeVariant = (level) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      case 'caution': return 'secondary';
      default: return 'success';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'critical': return <AlertCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'caution': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getRiskMessage = (level, score) => {
    switch (level) {
      case 'critical':
        return 'CRITICAL: Immediate action required to prevent deliverability issues';
      case 'warning':
        return 'Warning: List health is declining - review your email strategy';
      case 'caution':
        return 'Caution: Monitor list health metrics closely';
      default:
        return 'Healthy: List metrics are within acceptable ranges';
    }
  };

  // Calculate percentage changes
  const unsubscribeChange = previous.unsubscribeRate > 0
    ? ((current.unsubscribeRate - previous.unsubscribeRate) / previous.unsubscribeRate) * 100
    : 0;
  const bounceChange = previous.bounceRate > 0
    ? ((current.bounceRate - previous.bounceRate) / previous.bounceRate) * 100
    : 0;
  const spamChange = previous.spamComplaintRate > 0
    ? ((current.spamComplaintRate - previous.spamComplaintRate) / previous.spamComplaintRate) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Fatigue Risk Dashboard
            </CardTitle>
            <CardDescription>
              Track list health metrics to prevent email fatigue and deliverability issues
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{riskScore}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Risk Score</div>
            </div>
            <Badge variant={getRiskBadgeVariant(riskLevel)} className="flex items-center gap-1">
              {getRiskIcon(riskLevel)}
              {riskLevel.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Risk Message */}
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          riskLevel === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
          riskLevel === 'warning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
          riskLevel === 'caution' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' :
          'bg-green-50 border-green-500 dark:bg-green-900/20'
        }`}>
          <div className="flex items-start gap-3">
            {getRiskIcon(riskLevel)}
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {getRiskMessage(riskLevel, riskScore)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Based on unsubscribe rate, bounce rate, and spam complaints relative to industry benchmarks
              </p>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-100 dark:border-red-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Unsubscribe Rate</div>
              {unsubscribeChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(current.unsubscribeRate)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${
                unsubscribeChange > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {unsubscribeChange > 0 ? '+' : ''}{unsubscribeChange.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">vs. previous period</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {current.unsubscribes.toLocaleString()} total unsubscribes
            </div>
            <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">
              Benchmark: {current.unsubscribeRate > 0.5 ? '⚠️ Above 0.5%' : '✓ Below 0.5%'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-100 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Bounce Rate</div>
              {bounceChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-orange-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(current.bounceRate)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${
                bounceChange > 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {bounceChange > 0 ? '+' : ''}{bounceChange.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">vs. previous period</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {current.bounces.toLocaleString()} total bounces
            </div>
            <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">
              Benchmark: {current.bounceRate > 2 ? '⚠️ Above 2%' : '✓ Below 2%'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Spam Complaint Rate</div>
              {spamChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-purple-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPercentage(current.spamComplaintRate)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${
                spamChange > 0 ? 'text-purple-600' : 'text-green-600'
              }`}>
                {spamChange > 0 ? '+' : ''}{spamChange.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">vs. previous period</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {current.spamComplaints.toLocaleString()} total complaints
            </div>
            <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">
              Benchmark: {current.spamComplaintRate > 0.1 ? '⚠️ Above 0.1%' : '✓ Below 0.1%'}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            List Health Trends Over Time
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `${value.toFixed(2)}%`}
              />

              {/* Warning threshold lines */}
              <ReferenceLine
                y={0.5}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                label={{ value: 'Unsubscribe Warning (0.5%)', position: 'right', fill: '#F59E0B', fontSize: 10 }}
              />
              <ReferenceLine
                y={2}
                stroke="#EF4444"
                strokeDasharray="3 3"
                label={{ value: 'Bounce Warning (2%)', position: 'right', fill: '#EF4444', fontSize: 10 }}
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
                  return [`${value.toFixed(3)}%`, name];
                }}
              />
              <Legend />

              <Line
                type="monotone"
                dataKey="unsubscribeRate"
                name="Unsubscribe Rate"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="bounceRate"
                name="Bounce Rate"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="spamComplaintRate"
                name="Spam Complaint Rate"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendations */}
        {riskLevel !== 'healthy' && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              Recommended Actions
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {current.unsubscribeRate > 0.5 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Reduce sending frequency - high unsubscribe rate indicates email fatigue</span>
                </li>
              )}
              {current.bounceRate > 2 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Clean your email list - high bounce rate affects deliverability</span>
                </li>
              )}
              {current.spamComplaintRate > 0.1 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>URGENT: Review email content and list sources - spam complaints damage sender reputation</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Implement preference center to let subscribers control email frequency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Segment your audience and send more targeted, relevant content</span>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

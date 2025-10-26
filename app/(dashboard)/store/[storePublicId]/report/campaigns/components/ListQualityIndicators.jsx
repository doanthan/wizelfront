"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercentage, formatNumber } from '@/lib/utils';

/**
 * List Quality Indicators
 *
 * Shows 4 key list health metrics in a compact row:
 * - RPR (Revenue Per Recipient)
 * - Engagement Rate
 * - Send Frequency
 * - List Health Status
 */
export default function ListQualityIndicators({ healthData, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData || !healthData.current || !healthData.baseline) {
    return null;
  }

  const { current, baseline, percentChanges } = healthData;

  // Helper to render trend indicator
  const renderTrend = (value, isPositiveBetter = true) => {
    if (Math.abs(value) < 0.1) {
      return (
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Minus className="h-3 w-3" />
          <span>Stable</span>
        </div>
      );
    }

    const isPositive = value > 0;
    const isGood = isPositiveBetter ? isPositive : !isPositive;
    const colorClass = isGood
      ? "text-green-600 dark:text-green-500"
      : "text-red-600 dark:text-red-500";
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span>{formatPercentage(Math.abs(value))} vs avg</span>
      </div>
    );
  };

  // Calculate additional metrics
  const sendFrequency = current.avgRecipients / 30; // Daily average
  const baselineSendFrequency = baseline.avgRecipients / 30;
  const sendFrequencyChange = baselineSendFrequency > 0
    ? ((sendFrequency - baselineSendFrequency) / baselineSendFrequency) * 100
    : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* RPR */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Revenue Per Recipient
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              ${current.avgRPR.toFixed(3)}
            </div>
            <div className="text-xs">
              {renderTrend(percentChanges.rpr, true)}
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Engagement Rate
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatPercentage(current.avgEngagement * 100)}
            </div>
            <div className="text-xs">
              {renderTrend(percentChanges.engagement, true)}
            </div>
          </div>

          {/* Send Frequency */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Daily Avg Sends
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatNumber(sendFrequency)}
            </div>
            <div className="text-xs">
              {renderTrend(sendFrequencyChange, false)}
            </div>
          </div>

          {/* List Health Score */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              List Health Score
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {healthData.fatigueScore}/100
            </div>
            <div className="text-xs">
              <span className={`font-medium ${
                healthData.status === 'healthy' ? 'text-green-600 dark:text-green-500' :
                healthData.status === 'caution' ? 'text-yellow-600 dark:text-yellow-500' :
                healthData.status === 'warning' ? 'text-orange-600 dark:text-orange-500' :
                'text-red-600 dark:text-red-500'
              }`}>
                {healthData.status === 'healthy' ? 'Healthy' :
                 healthData.status === 'caution' ? 'Caution' :
                 healthData.status === 'warning' ? 'Warning' :
                 'Critical'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

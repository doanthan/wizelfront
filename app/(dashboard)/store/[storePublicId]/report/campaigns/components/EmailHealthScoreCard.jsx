"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Info, TrendingUp, TrendingDown, Mail, Activity, DollarSign, Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { formatPercentage } from '@/lib/utils';

/**
 * Email List Health Score Card
 *
 * Displays a 0-100 health score with color-coded status and breakdown of components:
 * - RPR Trend (40%)
 * - Volume Trend (20%)
 * - Engagement Trend (20%)
 * - Efficiency (20%)
 */
export default function EmailHealthScoreCard({ healthData, loading }) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-sky-blue" />
            Email List Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData || healthData.status === 'no_data' || healthData.status === 'insufficient_data') {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-sky-blue" />
            Email List Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Info className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {healthData?.message || 'Not enough data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { fatigueScore, status, scoreBreakdown, percentChanges } = healthData;

  // Determine color based on status
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', ring: 'ring-green-600', border: 'border-green-600' };
      case 'caution': return { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', ring: 'ring-yellow-600', border: 'border-yellow-600' };
      case 'warning': return { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-600', border: 'border-orange-600' };
      case 'critical': return { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', ring: 'ring-red-600', border: 'border-red-600' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', ring: 'ring-gray-600', border: 'border-gray-600' };
    }
  };

  const statusColors = getStatusColor();

  const getStatusLabel = () => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'caution': return 'Caution';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  // Calculate progress bar percentage
  const progressPercent = Math.min(100, Math.max(0, fatigueScore));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-sky-blue" />
          Email List Health Score
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-2">
                  <p className="font-semibold">How the score is calculated:</p>
                  <ul className="text-xs space-y-1">
                    <li><strong>RPR Trend (40%):</strong> Revenue per recipient vs 6-month average</li>
                    <li><strong>Volume Trend (20%):</strong> Changes in email send volume</li>
                    <li><strong>Engagement Trend (20%):</strong> Open and click rate changes</li>
                    <li><strong>Efficiency (20%):</strong> Revenue growth vs volume growth</li>
                  </ul>
                  <p className="text-xs mt-2 pt-2 border-t">
                    <strong>Score ranges:</strong><br/>
                    80-100: Healthy | 60-79: Caution | 40-59: Warning | 0-39: Critical
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Compact Layout: Score on right, Stats on one line */}
        <div className="flex items-center justify-between gap-6 mb-4">
          {/* Left: Progress Bar */}
          <div className="flex-1">
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusColors.bg} ${statusColors.border} border-l-4 transition-all duration-500`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className={`mt-2 inline-block px-3 py-1 rounded-full ${statusColors.bg} ${statusColors.text} font-medium text-xs`}>
              {getStatusLabel()}
            </div>
          </div>

          {/* Right: Score Display */}
          <div className="text-right">
            <div className="text-5xl font-bold text-gray-900 dark:text-white leading-none">
              {fatigueScore}
              <span className="text-2xl text-gray-500 dark:text-gray-400">/100</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown - Single Row */}
        <div className="grid grid-cols-4 gap-3">
          {/* RPR Trend */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 dark:text-gray-400">RPR Trend</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {scoreBreakdown.rprTrend}/100
              </div>
              <div className={`text-xs flex items-center gap-0.5 ${percentChanges.rpr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {percentChanges.rpr >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercentage(Math.abs(percentChanges.rpr))}
              </div>
            </div>
          </div>

          {/* Volume Trend */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 dark:text-gray-400">Volume</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {scoreBreakdown.volumeTrend}/100
              </div>
              <div className={`text-xs flex items-center gap-0.5 ${percentChanges.volume >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                {percentChanges.volume >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercentage(Math.abs(percentChanges.volume))}
              </div>
            </div>
          </div>

          {/* Engagement Trend */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Activity className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 dark:text-gray-400">Engagement</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {scoreBreakdown.engagementTrend}/100
              </div>
              <div className={`text-xs flex items-center gap-0.5 ${percentChanges.engagement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {percentChanges.engagement >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercentage(Math.abs(percentChanges.engagement))}
              </div>
            </div>
          </div>

          {/* Efficiency */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <TrendingUp className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 dark:text-gray-400">Efficiency</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {scoreBreakdown.efficiency}/100
              </div>
              <div className={`text-xs flex items-center gap-0.5 ${percentChanges.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {percentChanges.revenue >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercentage(Math.abs(percentChanges.revenue))}
              </div>
            </div>
          </div>
        </div>

        {/* Baseline Reference */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            vs. 6-month average baseline
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

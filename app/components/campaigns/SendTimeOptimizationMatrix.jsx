"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Badge } from "@/app/components/ui/badge";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mail,
  MessageSquare,
  Bell,
  DollarSign,
  MousePointer,
  Eye,
  Star,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

// Days of week and hours of day for the matrix
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i);

// Metrics for optimization - channel aware
const getMetricsForChannel = (channel) => {
  const baseMetrics = {
    clickRate: { label: 'Click Rate', icon: MousePointer, format: 'percentage', color: '#10b981' },
    conversionRate: { label: 'Conversion Rate', icon: DollarSign, format: 'percentage', color: '#8b5cf6' },
    revenue: { label: 'Revenue', icon: DollarSign, format: 'currency', color: '#f59e0b' },
    engagement: { label: 'Engagement Score', icon: Zap, format: 'score', color: '#ef4444' }
  };

  // Add open rate only for email and push channels
  if (channel === 'all' || channel === 'email' || channel === 'push') {
    return {
      openRate: { label: 'Open Rate', icon: Eye, format: 'percentage', color: '#3b82f6' },
      ...baseMetrics
    };
  }

  // For SMS, exclude open rate
  return baseMetrics;
};

const METRICS = getMetricsForChannel('all'); // Default for backward compatibility

// View modes
const VIEW_MODES = {
  heatmap: { label: 'Heatmap Matrix', icon: Calendar },
  timeline: { label: 'Timeline Analysis', icon: Clock },
  dayComparison: { label: 'Day Comparison', icon: BarChart },
  recommendations: { label: 'Smart Recommendations', icon: Star }
};

export default function SendTimeOptimizationMatrix({ campaignData = [] }) {
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('openRate'); // Default to open rate to see the issue
  const [viewMode, setViewMode] = useState('heatmap');
  const [clickedSlot, setClickedSlot] = useState(null); // For managing click-based tooltips


  // Helper function to format metric values
  const formatMetricValue = (value, metric) => {
    if (!value || value === 0) return '—';

    const metricConfig = availableMetrics[metric] || {};

    switch (metricConfig.format) {
      case 'percentage':
        // Convert decimal to percentage for display (0.349 -> 34.9%)
        return formatPercentage(value * 100);
      case 'currency':
        return formatCurrency(value);
      case 'score':
        return value.toFixed(2);
      default:
        return formatNumber(value);
    }
  };

  // Get metrics based on selected channel
  const availableMetrics = useMemo(() => {
    return getMetricsForChannel(selectedChannel);
  }, [selectedChannel]);

  // Ensure selected metric is available for the channel
  useEffect(() => {
    if (!availableMetrics[selectedMetric]) {
      // If current metric not available (e.g., openRate for SMS), switch to clickRate
      setSelectedMetric('clickRate');
    }
  }, [selectedChannel, selectedMetric, availableMetrics]);

  // Process campaign data into time-based metrics
  const timeMatrixData = useMemo(() => {
    const matrix = {};

    // Initialize matrix
    DAYS_OF_WEEK.forEach(day => {
      matrix[day] = {};
      HOURS_OF_DAY.forEach(hour => {
        matrix[day][hour] = {
          campaigns: [],
          metrics: {
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
            revenue: 0,
            engagement: 0,
            count: 0,
            totalCampaigns: 0
          }
        };
      });
    });

    // Process campaigns
    campaignData.forEach(campaign => {
      // Handle both formats - direct fields and nested statistics
      const sendTime = campaign.send_time || campaign.sentAt;
      if (!sendTime) return;

      // Check channel filter
      const campaignChannel = campaign.channel || campaign.type || 'email';
      if (selectedChannel !== 'all' && campaignChannel !== selectedChannel) return;

      const date = new Date(sendTime);
      const dayIndex = date.getDay();
      const day = DAYS_OF_WEEK[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust for Monday start
      const hour = date.getHours();

      if (matrix[day] && matrix[day][hour]) {
        const slot = matrix[day][hour];
        slot.campaigns.push(campaign);

        // Extract metrics - handle both formats
        const stats = campaign.statistics || campaign;
        const recipients = stats.recipients || campaign.recipients || 1;

        // Handle rates - they might be in percentage (33.5) or decimal (0.335 or 0.00335) form
        let openRate = stats.open_rate || stats.openRate || campaign.openRate || 0;
        let clickRate = stats.click_rate || stats.clickRate || campaign.clickRate || 0;
        let conversionRate = stats.conversion_rate || stats.conversionRate || campaign.conversionRate || 0;

        // Convert percentage values (>1) to decimals
        // Keep decimal values (<=1) as-is
        // The API returns rates like 0.25828 which means 25.828%
        if (openRate > 1) {
          openRate = openRate / 100;
        }

        if (clickRate > 1) {
          clickRate = clickRate / 100;
        }

        if (conversionRate > 1) {
          conversionRate = conversionRate / 100;
        }


        const revenue = stats.revenue_per_recipient ? stats.revenue_per_recipient * recipients :
                       stats.conversion_value || campaign.revenue || 0;

        // Aggregate metrics
        slot.metrics.openRate += openRate * recipients;
        slot.metrics.clickRate += clickRate * recipients;
        slot.metrics.conversionRate += conversionRate * recipients;
        slot.metrics.revenue += revenue;
        slot.metrics.count += recipients;
        slot.metrics.totalCampaigns += 1;
      }
    });

    // Calculate averages and engagement scores
    DAYS_OF_WEEK.forEach(day => {
      HOURS_OF_DAY.forEach(hour => {
        const slot = matrix[day][hour];
        if (slot.metrics.count > 0) {
          const originalOpenRate = slot.metrics.openRate;
          const originalCount = slot.metrics.count;

          slot.metrics.openRate /= slot.metrics.count;
          slot.metrics.clickRate /= slot.metrics.count;
          slot.metrics.conversionRate /= slot.metrics.count;


          // Calculate engagement score based on channel
          if (selectedChannel === 'sms') {
            // For SMS: focus on click and conversion rates
            slot.metrics.engagement = (
              slot.metrics.clickRate * 0.5 +
              slot.metrics.conversionRate * 0.5
            );
          } else {
            // For Email/Push/All: include open rate
            slot.metrics.engagement = (
              slot.metrics.openRate * 0.3 +
              slot.metrics.clickRate * 0.3 +
              slot.metrics.conversionRate * 0.4
            );
          }
        }
      });
    });

    return matrix;
  }, [campaignData, selectedChannel]);

  // Find best performing time slots
  const bestTimeSlots = useMemo(() => {
    const slots = [];

    DAYS_OF_WEEK.forEach(day => {
      HOURS_OF_DAY.forEach(hour => {
        const slot = timeMatrixData[day][hour];
        if (slot.campaigns.length > 0) {
          slots.push({
            day,
            hour,
            ...slot.metrics,
            campaignCount: slot.campaigns.length
          });
        }
      });
    });

    // Sort by selected metric
    return slots.sort((a, b) => b[selectedMetric] - a[selectedMetric]).slice(0, 10);
  }, [timeMatrixData, selectedMetric]);

  // Calculate day performance
  const dayPerformance = useMemo(() => {
    return DAYS_OF_WEEK.map(day => {
      let totalMetrics = {
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        revenue: 0,
        engagement: 0,
        count: 0,
        campaigns: 0
      };

      HOURS_OF_DAY.forEach(hour => {
        const slot = timeMatrixData[day][hour];
        if (slot.metrics.count > 0) {
          totalMetrics.openRate += slot.metrics.openRate * slot.metrics.count;
          totalMetrics.clickRate += slot.metrics.clickRate * slot.metrics.count;
          totalMetrics.conversionRate += slot.metrics.conversionRate * slot.metrics.count;
          totalMetrics.revenue += slot.metrics.revenue;
          totalMetrics.count += slot.metrics.count;
          totalMetrics.campaigns += slot.campaigns.length;
        }
      });

      if (totalMetrics.count > 0) {
        totalMetrics.openRate /= totalMetrics.count;
        totalMetrics.clickRate /= totalMetrics.count;
        totalMetrics.conversionRate /= totalMetrics.count;
        totalMetrics.engagement = (
          totalMetrics.openRate * 0.3 +
          totalMetrics.clickRate * 0.3 +
          totalMetrics.conversionRate * 0.4
        );
      }

      return {
        day,
        ...totalMetrics
      };
    });
  }, [timeMatrixData]);

  // Calculate hourly performance across all days
  const hourlyPerformance = useMemo(() => {
    return HOURS_OF_DAY.map(hour => {
      let totalMetrics = {
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        revenue: 0,
        engagement: 0,
        count: 0,
        campaigns: 0
      };

      DAYS_OF_WEEK.forEach(day => {
        const slot = timeMatrixData[day][hour];
        if (slot.metrics.count > 0) {
          totalMetrics.openRate += slot.metrics.openRate * slot.metrics.count;
          totalMetrics.clickRate += slot.metrics.clickRate * slot.metrics.count;
          totalMetrics.conversionRate += slot.metrics.conversionRate * slot.metrics.count;
          totalMetrics.revenue += slot.metrics.revenue;
          totalMetrics.count += slot.metrics.count;
          totalMetrics.campaigns += slot.campaigns.length;
        }
      });

      if (totalMetrics.count > 0) {
        totalMetrics.openRate /= totalMetrics.count;
        totalMetrics.clickRate /= totalMetrics.count;
        totalMetrics.conversionRate /= totalMetrics.count;
        totalMetrics.engagement = (
          totalMetrics.openRate * 0.3 +
          totalMetrics.clickRate * 0.3 +
          totalMetrics.conversionRate * 0.4
        );
      }

      // Format hour for display
      const hourLabel = hour === 0 ? '12am' :
                       hour < 12 ? `${hour}am` :
                       hour === 12 ? '12pm' :
                       `${hour - 12}pm`;

      return {
        hour: hourLabel,
        hourNum: hour,
        ...totalMetrics
      };
    });
  }, [timeMatrixData]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    const recs = [];

    // Best overall time
    if (bestTimeSlots.length > 0) {
      const best = bestTimeSlots[0];
      const hourLabel = best.hour === 0 ? '12am' :
                       best.hour < 12 ? `${best.hour}am` :
                       best.hour === 12 ? '12pm' :
                       `${best.hour - 12}pm`;
      recs.push({
        type: 'success',
        title: 'Optimal Send Time',
        description: `${best.day} at ${hourLabel} shows highest ${METRICS[selectedMetric].label}`,
        metric: formatMetricValue(best[selectedMetric], selectedMetric),
        icon: CheckCircle2
      });
    }

    // Best day
    const bestDay = [...dayPerformance].sort((a, b) => b[selectedMetric] - a[selectedMetric])[0];
    if (bestDay && bestDay[selectedMetric] > 0) {
      recs.push({
        type: 'info',
        title: 'Best Performing Day',
        description: `${bestDay.day} consistently shows strong performance`,
        metric: formatMetricValue(bestDay[selectedMetric], selectedMetric),
        icon: TrendingUp
      });
    }

    // Avoid times
    const worstSlots = [...bestTimeSlots].reverse().slice(0, 3);
    if (worstSlots.length > 0 && worstSlots[0][selectedMetric] < bestTimeSlots[0][selectedMetric] * 0.5) {
      const worst = worstSlots[0];
      const hourLabel = worst.hour === 0 ? '12am' :
                       worst.hour < 12 ? `${worst.hour}am` :
                       worst.hour === 12 ? '12pm' :
                       `${worst.hour - 12}pm`;
      recs.push({
        type: 'warning',
        title: 'Times to Avoid',
        description: `${worst.day} at ${hourLabel} shows poor performance`,
        metric: formatMetricValue(worst[selectedMetric], selectedMetric),
        icon: AlertCircle
      });
    }

    // Peak hours
    const peakHours = hourlyPerformance
      .filter(h => h[selectedMetric] > 0)
      .sort((a, b) => b[selectedMetric] - a[selectedMetric])
      .slice(0, 3);
    if (peakHours.length > 0) {
      recs.push({
        type: 'success',
        title: 'Peak Hours',
        description: `Best performance during ${peakHours.map(h => h.hour).join(', ')}`,
        metric: `Avg: ${formatMetricValue(peakHours[0][selectedMetric], selectedMetric)}`,
        icon: Clock
      });
    }

    // Weekend vs Weekday
    const weekdayAvg = dayPerformance
      .filter(d => !['Sat', 'Sun'].includes(d.day))
      .reduce((sum, d) => sum + d[selectedMetric], 0) / 5;
    const weekendAvg = dayPerformance
      .filter(d => ['Sat', 'Sun'].includes(d.day))
      .reduce((sum, d) => sum + d[selectedMetric], 0) / 2;

    if (weekdayAvg > 0 || weekendAvg > 0) {
      const better = weekdayAvg > weekendAvg ? 'Weekdays' : 'Weekends';
      const diff = Math.abs(((weekdayAvg - weekendAvg) / Math.max(weekdayAvg, weekendAvg)) * 100);
      recs.push({
        type: 'info',
        title: `${better} Perform Better`,
        description: `${diff.toFixed(0)}% higher ${METRICS[selectedMetric].label} on ${better.toLowerCase()}`,
        metric: formatMetricValue(better === 'Weekdays' ? weekdayAvg : weekendAvg, selectedMetric),
        icon: Calendar
      });
    }

    return recs;
  }, [bestTimeSlots, dayPerformance, hourlyPerformance, selectedMetric]);

  // Get color intensity for heatmap
  const getHeatmapColor = (value, max) => {
    if (!value || value === 0) return 'bg-gray-100 dark:bg-gray-800';

    const intensity = max > 0 ? value / max : 0;

    if (intensity >= 0.8) return 'bg-green-600 dark:bg-green-700 text-white';
    if (intensity >= 0.6) return 'bg-green-500 dark:bg-green-600 text-white';
    if (intensity >= 0.4) return 'bg-yellow-500 dark:bg-yellow-600 text-white';
    if (intensity >= 0.2) return 'bg-orange-500 dark:bg-orange-600 text-white';
    return 'bg-red-500 dark:bg-red-600 text-white';
  };

  // Find max value for current metric
  const maxMetricValue = useMemo(() => {
    let max = 0;
    DAYS_OF_WEEK.forEach(day => {
      HOURS_OF_DAY.forEach(hour => {
        const value = timeMatrixData[day][hour].metrics[selectedMetric];
        if (value > max) max = value;
      });
    });
    return max;
  }, [timeMatrixData, selectedMetric]);

  // Render heatmap matrix
  const renderHeatmap = () => (
    <div className="w-full overflow-x-auto">
      <div className="w-full">
        {/* Click anywhere else to close tooltip */}
        <div className="absolute inset-0 pointer-events-none" onClick={() => setClickedSlot(null)} />

        {/* Hour headers */}
        <div className="flex gap-0.5 mb-1 pl-10">
          {HOURS_OF_DAY.map(hour => (
            <div key={hour} className="flex-1 text-center text-[10px] text-gray-900 dark:text-gray-400">
              {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
            </div>
          ))}
        </div>

        {/* Days and cells */}
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="flex gap-0.5 mb-0.5">
            <div className="w-10 text-right text-[11px] font-medium text-gray-900 dark:text-gray-300 pr-1 py-1">
              {day}
            </div>
            {HOURS_OF_DAY.map(hour => {
              const slot = timeMatrixData[day][hour];
              const value = slot.metrics[selectedMetric];
              const hasData = slot.campaigns.length > 0;

              const slotKey = `${day}-${hour}`;
              const isClicked = clickedSlot === slotKey;

              return (
                <TooltipProvider key={slotKey}>
                  <Tooltip open={isClicked || undefined}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          flex-1 h-8 rounded-sm flex items-center justify-center text-[10px] font-medium
                          transition-all cursor-pointer hover:scale-105
                          ${hasData ? getHeatmapColor(value, maxMetricValue) : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800'}
                          ${isClicked ? 'ring-2 ring-blue-500' : ''}
                        `}
                        onClick={() => setClickedSlot(isClicked ? null : slotKey)}
                      >
                        {hasData && formatMetricValue(value, selectedMetric).replace(/[$%]/g, '')}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-gray-800 p-3 min-w-[250px] shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="font-semibold text-gray-900 dark:text-white border-b pb-1">
                          {day} at {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                        </div>
                        {hasData ? (
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-900 dark:text-gray-300">Campaigns Sent:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{slot.metrics.totalCampaigns || slot.campaigns.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900 dark:text-gray-300">Total Recipients:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(Math.round(slot.metrics.count))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900 dark:text-gray-300">Total Revenue:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(slot.metrics.revenue)}</span>
                            </div>
                            <div className="border-t pt-1.5 mt-1.5">
                              {selectedChannel !== 'sms' && (
                                <div className="flex justify-between">
                                  <span className="text-gray-900 dark:text-gray-300">Avg Open Rate:</span>
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {formatPercentage((slot.metrics.openRate || 0) * 100)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-900 dark:text-gray-300">Avg Click Rate:</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {formatPercentage((slot.metrics.clickRate || 0) * 100)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-900 dark:text-gray-300">Avg Conversion:</span>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  {formatPercentage((slot.metrics.conversionRate || 0) * 100)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-900 dark:text-gray-300">Engagement Score:</span>
                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                  {(slot.metrics.engagement * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-900 dark:text-gray-400">No campaigns scheduled at this time</div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-between gap-4 mt-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-900 dark:text-gray-400">Performance:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 dark:bg-green-700 rounded" />
              <span className="text-gray-900 dark:text-gray-300">Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 dark:bg-yellow-600 rounded" />
              <span className="text-gray-900 dark:text-gray-300">Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 dark:bg-red-600 rounded" />
              <span className="text-gray-900 dark:text-gray-300">Poor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded" />
              <span className="text-gray-900 dark:text-gray-300">No Data</span>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {campaignData.filter(c => !selectedChannel || selectedChannel === 'all' || c.type === selectedChannel).length}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-gray-900 dark:text-gray-300 inline-flex items-center gap-1 cursor-help">
                    Total Campaigns
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm">
                    <strong>Total Campaigns:</strong> The total number of campaigns analyzed in the selected time period and filters. This shows your overall email/SMS sending volume.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {DAYS_OF_WEEK.reduce((sum, day) =>
                sum + HOURS_OF_DAY.filter(hour => timeMatrixData[day][hour].campaigns.length > 0).length, 0
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-gray-900 dark:text-gray-300 inline-flex items-center gap-1 cursor-help">
                    Data Points
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm">
                    <strong>Data Points:</strong> The number of unique day/hour combinations that have campaign data. Out of 168 possible slots (7 days × 24 hours), this shows how many have actual campaign performance to analyze.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {bestTimeSlots.length > 0 ? formatMetricValue(bestTimeSlots[0][selectedMetric], selectedMetric) : '—'}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-gray-900 dark:text-gray-300 inline-flex items-center gap-1 cursor-help">
                    Best {availableMetrics[selectedMetric]?.label || 'Metric'}
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm">
                    <strong>Best {availableMetrics[selectedMetric]?.label || 'Metric'}:</strong> The highest performing time slot for the selected metric. This represents the peak performance you've achieved and indicates the optimal send time for this metric.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round((DAYS_OF_WEEK.reduce((sum, day) =>
                sum + HOURS_OF_DAY.filter(hour => timeMatrixData[day][hour].campaigns.length > 0).length, 0
              ) / (DAYS_OF_WEEK.length * HOURS_OF_DAY.length)) * 100)}%
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-gray-900 dark:text-gray-300 inline-flex items-center gap-1 cursor-help">
                    Coverage
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm">
                    <strong>Coverage:</strong> The percentage of time slots with campaign data (Data Points ÷ 168). Higher coverage means more comprehensive testing across different send times. Aim for 30%+ for reliable insights.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );

  // Render timeline analysis
  const renderTimeline = () => (
    <div className="space-y-6">
      {/* Hourly performance */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Hourly Performance (All Days Average)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 12 }}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatMetricValue(value, selectedMetric).replace(/[$]/g, '')}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                const metricLabel = availableMetrics[selectedMetric]?.label || 'Metric';
                const metricValue = data[selectedMetric];

                return (
                  <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[280px]">
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-900 dark:text-white border-b pb-1">
                        {label}
                      </div>
                      <div className="text-sm space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 dark:text-gray-300">{metricLabel}:</span>
                          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {formatMetricValue(metricValue, selectedMetric)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                          This means {metricValue > 0 ? formatPercentage(metricValue * 100) : '0%'} of recipients
                          {selectedMetric === 'openRate' ? ' opened' :
                           selectedMetric === 'clickRate' ? ' clicked' :
                           selectedMetric === 'conversionRate' ? ' converted' : ''}
                          {' emails sent at this time'}
                        </div>
                        <div className="border-t pt-2 mt-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-700 dark:text-gray-300">Campaigns at {label}:</span>
                            <span className="text-xs font-semibold">{data.campaigns || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-700 dark:text-gray-300">Total Recipients:</span>
                            <span className="text-xs font-semibold">{formatNumber(Math.round(data.count || 0))}</span>
                          </div>
                          {data.revenue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-700 dark:text-gray-300">Revenue Generated:</span>
                              <span className="text-xs font-semibold text-green-600">{formatCurrency(data.revenue)}</span>
                            </div>
                          )}
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="text-xs space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Open Rate:</span>
                              <span className="font-medium">{formatPercentage((data.openRate || 0) * 100)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Click Rate:</span>
                              <span className="font-medium">{formatPercentage((data.clickRate || 0) * 100)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Conversion:</span>
                              <span className="font-medium">{formatPercentage((data.conversionRate || 0) * 100)}</span>
                            </div>
                          </div>
                        </div>
                        {data.campaigns > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 mt-2">
                            <p className="text-xs text-gray-700 dark:text-gray-400 italic">
                              💡 <strong>Pro Tip:</strong> {metricValue > 0.5 ?
                                'Great performance! Consider scheduling more campaigns at this time.' :
                                'This time slot could use optimization. Try A/B testing different content.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={availableMetrics[selectedMetric]?.color || '#3b82f6'}
              fill={availableMetrics[selectedMetric]?.color || '#3b82f6'}
              fillOpacity={0.3}
              strokeWidth={2}
              name={availableMetrics[selectedMetric]?.label}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best performing hours */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Top Performing Time Slots</h4>
        <div className="space-y-2">
          {bestTimeSlots.slice(0, 5).map((slot, index) => {
            const hourLabel = slot.hour === 0 ? '12am' :
                             slot.hour < 12 ? `${slot.hour}am` :
                             slot.hour === 12 ? '12pm' :
                             `${slot.hour - 12}pm`;
            return (
              <div key={`${slot.day}-${slot.hour}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{slot.day} at {hourLabel}</div>
                    <div className="text-xs text-gray-900 dark:text-gray-400">
                      {slot.campaignCount} campaigns sent
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatMetricValue(slot[selectedMetric], selectedMetric)}
                  </div>
                  <div className="text-xs text-gray-900 dark:text-gray-400">
                    {METRICS[selectedMetric].label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Render day comparison
  const renderDayComparison = () => (
    <div className="space-y-6">
      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dayPerformance}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatMetricValue(value, selectedMetric).replace(/[$]/g, '')}
          />
          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;

              // Find best and worst performing hours for this day
              const dayHours = HOURS_OF_DAY.map(hour => ({
                hour,
                ...timeMatrixData[label][hour].metrics,
                campaigns: timeMatrixData[label][hour].campaigns.length
              })).filter(h => h.campaigns > 0);

              const bestHour = dayHours.sort((a, b) => b[selectedMetric] - a[selectedMetric])[0];
              const worstHour = dayHours.sort((a, b) => a[selectedMetric] - b[selectedMetric])[0];

              // Calculate averages across all other days for comparison
              const otherDaysAvg = dayPerformance
                .filter(d => d.day !== label)
                .reduce((acc, d) => ({
                  openRate: acc.openRate + d.openRate,
                  clickRate: acc.clickRate + d.clickRate,
                  conversionRate: acc.conversionRate + d.conversionRate,
                  revenue: acc.revenue + d.revenue,
                  count: acc.count + 1
                }), { openRate: 0, clickRate: 0, conversionRate: 0, revenue: 0, count: 0 });

              if (otherDaysAvg.count > 0) {
                otherDaysAvg.openRate /= otherDaysAvg.count;
                otherDaysAvg.clickRate /= otherDaysAvg.count;
                otherDaysAvg.conversionRate /= otherDaysAvg.count;
                otherDaysAvg.revenue /= otherDaysAvg.count;
              }

              const formatHour = (h) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

              return (
                <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[350px]">
                  <div className="space-y-3">
                    <div className="font-semibold text-lg text-gray-900 dark:text-white border-b pb-2">
                      {label} Performance Overview
                    </div>

                    {/* Main metric highlight */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {availableMetrics[selectedMetric]?.label}
                        </span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatMetricValue(data[selectedMetric], selectedMetric)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {data[selectedMetric] > otherDaysAvg[selectedMetric] ? (
                          <span className="text-green-600 dark:text-green-400">
                            ↑ {formatPercentage(((data[selectedMetric] - otherDaysAvg[selectedMetric]) / otherDaysAvg[selectedMetric]) * 100)} vs other days
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">
                            ↓ {formatPercentage(((otherDaysAvg[selectedMetric] - data[selectedMetric]) / otherDaysAvg[selectedMetric]) * 100)} vs other days
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key metrics grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                        <div className="text-xs text-gray-500 dark:text-gray-500">Campaigns</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{data.campaigns}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                        <div className="text-xs text-gray-500 dark:text-gray-500">Recipients</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{formatNumber(Math.round(data.count))}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                        <div className="text-xs text-gray-500 dark:text-gray-500">Total Revenue</div>
                        <div className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.revenue)}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                        <div className="text-xs text-gray-500 dark:text-gray-500">Rev/Recipient</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {data.count > 0 ? formatCurrency(data.revenue / data.count) : '$0'}
                        </div>
                      </div>
                    </div>

                    {/* Performance metrics */}
                    <div className="border-t pt-3">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Performance Metrics</div>
                      <div className="space-y-1.5">
                        {selectedChannel !== 'sms' && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Open Rate</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatPercentage(data.openRate * 100)}
                              </span>
                              {data.openRate > otherDaysAvg.openRate ? (
                                <span className="text-[10px] text-green-600 dark:text-green-400">▲</span>
                              ) : (
                                <span className="text-[10px] text-red-600 dark:text-red-400">▼</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Click Rate</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPercentage(data.clickRate * 100)}
                            </span>
                            {data.clickRate > otherDaysAvg.clickRate ? (
                              <span className="text-[10px] text-green-600 dark:text-green-400">▲</span>
                            ) : (
                              <span className="text-[10px] text-red-600 dark:text-red-400">▼</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Conversion Rate</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPercentage(data.conversionRate * 100)}
                            </span>
                            {data.conversionRate > otherDaysAvg.conversionRate ? (
                              <span className="text-[10px] text-green-600 dark:text-green-400">▲</span>
                            ) : (
                              <span className="text-[10px] text-red-600 dark:text-red-400">▼</span>
                            )}
                          </div>
                        </div>
                        {selectedChannel !== 'sms' && data.openRate > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Click-to-Open Rate</span>
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                              {formatPercentage((data.clickRate / data.openRate) * 100)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Best and worst hours for this day */}
                    {dayHours.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Time Analysis for {label}</div>
                        <div className="space-y-2">
                          {bestHour && (
                            <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded p-2">
                              <div className="text-xs">
                                <div className="font-medium text-green-700 dark:text-green-400">Best Hour</div>
                                <div className="text-green-600 dark:text-green-500">{formatHour(bestHour.hour)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-700 dark:text-green-400">
                                  {formatMetricValue(bestHour[selectedMetric], selectedMetric)}
                                </div>
                                <div className="text-[10px] text-green-600 dark:text-green-500">
                                  {bestHour.campaigns} campaign{bestHour.campaigns > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          )}
                          {worstHour && bestHour && worstHour.hour !== bestHour.hour && (
                            <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded p-2">
                              <div className="text-xs">
                                <div className="font-medium text-red-700 dark:text-red-400">Worst Hour</div>
                                <div className="text-red-600 dark:text-red-500">{formatHour(worstHour.hour)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-red-700 dark:text-red-400">
                                  {formatMetricValue(worstHour[selectedMetric], selectedMetric)}
                                </div>
                                <div className="text-[10px] text-red-600 dark:text-red-500">
                                  {worstHour.campaigns} campaign{worstHour.campaigns > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Engagement score */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Engagement Score</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-4 rounded-sm ${
                                  i < Math.round((data.engagement || 0) * 5)
                                    ? 'bg-orange-500 dark:bg-orange-400'
                                    : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            {formatPercentage((data.engagement || 0) * 100)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-3">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                        💡 Recommendation
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-500">
                        {data[selectedMetric] > otherDaysAvg[selectedMetric]
                          ? `Strong performance on ${label}s! Consider increasing campaign frequency on this day, especially around ${bestHour ? formatHour(bestHour.hour) : 'peak hours'}.`
                          : `${label}s show below-average performance. Test different content types or consider shifting campaigns to better-performing days.`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey={selectedMetric}
            fill={METRICS[selectedMetric].color}
            name={METRICS[selectedMetric].label}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Day statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dayPerformance.map(day => (
          <div key={day.day}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">{day.day}</h4>
              <Badge variant={day.campaigns > 10 ? 'default' : 'secondary'}>
                {day.campaigns} campaigns
              </Badge>
            </div>

            {/* Main performance metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Open Rate</div>
                <div className="font-semibold text-gray-900 dark:text-white">{formatPercentage(day.openRate * 100)}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Click Rate</div>
                <div className="font-semibold text-gray-900 dark:text-white">{formatPercentage(day.clickRate * 100)}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Conversion</div>
                <div className="font-semibold text-gray-900 dark:text-white">{formatPercentage(day.conversionRate * 100)}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Revenue</div>
                <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(day.revenue)}</div>
              </div>
            </div>

            {/* Additional insights */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-500 dark:text-gray-500">Recipients</div>
                  <div className="font-medium text-gray-900 dark:text-white">{formatNumber(day.count || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-500">Engagement</div>
                  <div className="font-medium text-gray-900 dark:text-white">{formatPercentage((day.engagement || 0) * 100)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-500">Revenue/Recipient</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {day.count > 0 ? formatCurrency(day.revenue / day.count) : formatCurrency(0)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-500">Click-to-Open</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {day.openRate > 0 ? formatPercentage((day.clickRate / day.openRate) * 100) : '0%'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render recommendations
  const renderRecommendations = () => (
    <div className="space-y-4">
      {recommendations.map((rec, index) => {
        const Icon = rec.icon;
        const typeColors = {
          success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        };
        const iconColors = {
          success: 'text-green-600 dark:text-green-400',
          warning: 'text-yellow-600 dark:text-yellow-400',
          info: 'text-blue-600 dark:text-blue-400'
        };

        return (
          <div key={index}
            className={`p-4 rounded-lg border ${typeColors[rec.type]}`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 ${iconColors[rec.type]}`} />
              <div className="flex-1">
                <h4 className="font-semibold mb-1 text-gray-900 dark:text-white">{rec.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {rec.description}
                </p>
                <div className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{rec.metric}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Send Time Optimization Matrix
            </CardTitle>
            <CardDescription>
              Identify optimal campaign send times based on historical performance
            </CardDescription>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Channel filter */}
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email Only</SelectItem>
                <SelectItem value="sms">SMS Only</SelectItem>
                <SelectItem value="push">Push Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Metric selector - shows only available metrics for channel */}
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableMetrics).map(([key, metric]) => {
                  const Icon = metric.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {metric.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* View mode selector */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {Object.entries(VIEW_MODES).map(([key, mode]) => {
                const Icon = mode.icon;
                return (
                  <Button
                    key={key}
                    variant={viewMode === key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(key)}
                    className="gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{mode.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {campaignData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Clock className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-300">No Campaign Data Available</p>
            <p className="text-sm text-gray-900 dark:text-gray-400">Send some campaigns to see time optimization insights</p>
          </div>
        ) : (
          <>
            {/* Render based on view mode */}
            {viewMode === 'heatmap' && renderHeatmap()}
            {viewMode === 'timeline' && renderTimeline()}
            {viewMode === 'dayComparison' && renderDayComparison()}
            {viewMode === 'recommendations' && renderRecommendations()}

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-sm text-gray-900 dark:text-gray-300">Total Campaigns</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(campaignData.length)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-900 dark:text-gray-300">Data Points</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(bestTimeSlots.length)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-900 dark:text-gray-300">Best {availableMetrics[selectedMetric]?.label || 'Metric'}</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {bestTimeSlots[0] ? formatMetricValue(bestTimeSlots[0][selectedMetric], selectedMetric) : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-900 dark:text-gray-300">Coverage</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage((bestTimeSlots.length / (24 * 7)) * 100)}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { useMemo } from 'react';
import { Mail, Eye, MousePointer, DollarSign, Send, Clock, Users, TrendingUp } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

export const CampaignStats = ({ campaigns, isFiltered = false, view = 'month', date = new Date() }) => {
  // Get period text based on view
  const getPeriodText = () => {
    if (isFiltered) return 'Filtered';

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (view === 'day') {
      // Format: "Sep 25"
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    } else if (view === 'week') {
      // Get week start and end dates
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Format: "Sep 22-28" or "Sep 29 - Oct 5"
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}`;
      } else {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
      }
    } else {
      // Month view - Format: "September"
      const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
      return fullMonthNames[date.getMonth()];
    }
  };

  const periodText = getPeriodText();

  const stats = useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      return {
        totalSent: 0,
        totalScheduled: 0,
        totalRecipients: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        totalRevenue: 0,
        totalOpens: 0,
        totalClicks: 0,
        conversionRate: 0
      };
    }

    // Debug logging to see what we're working with
    console.log('📊 CampaignStats calculating from campaigns:', {
      totalCampaigns: campaigns.length,
      firstCampaign: campaigns[0],
      samplePerformance: campaigns[0]?.performance,
      allStatuses: [...new Set(campaigns.map(c => c.status))],
      allChannels: [...new Set(campaigns.map(c => c.channel))],
      // Check performance data availability
      hasPerformanceObject: campaigns.filter(c => c.performance).length,
      sampleCampaignData: campaigns.slice(0, 2).map(c => ({
        name: c.name,
        performance: c.performance
      }))
    });

    // Separate sent and scheduled campaigns
    // Campaigns are considered "sent" if they're not scheduled/draft and have performance data
    const sentCampaigns = campaigns.filter(c => {
      // First check if explicitly scheduled or draft
      const isScheduledOrDraft = c.isScheduled ||
                                 c.status === 'scheduled' ||
                                 c.status === 'Scheduled' ||
                                 c.status === 'draft' ||
                                 c.status === 'Draft' ||
                                 c.status === 'Sending' 

      // If it's scheduled or draft, it's not sent
      if (isScheduledOrDraft) {
        return false;
      }

      // A campaign is "sent" if it has statistics data (recipients > 0)
      return c.statistics && c.statistics.recipients > 0;
    });

    const scheduledCampaigns = campaigns.filter(c => {
      // Check explicit scheduled/draft statuses
      const hasScheduledStatus = c.isScheduled ||
                                 c.status === 'scheduled' ||
                                 c.status === 'Scheduled' ||
                                 c.status === 'draft' ||
                                 c.status === 'Draft' ||
                                 c.status === 'Sending' 

      // Check if campaign date is in the future
      const campaignDate = new Date(c.date);
      const now = new Date();
      const isInFuture = campaignDate > now;

      // A campaign is scheduled if it has scheduled status OR is in the future
      return hasScheduledStatus || isInFuture;
    });

    console.log('📈 Campaign breakdown:', {
      sent: sentCampaigns.length,
      scheduled: scheduledCampaigns.length,
      firstSentCampaign: sentCampaigns[0],
      sentCampaignNames: sentCampaigns.slice(0, 3).map(c => c.name),
      scheduledCampaignNames: scheduledCampaigns.slice(0, 5).map(c => c.name),
      scheduledCampaignDetails: scheduledCampaigns.slice(0, 3).map(c => ({
        name: c.name,
        date: c.date,
        status: c.status,
        isScheduled: c.isScheduled,
        isInFuture: new Date(c.date) > new Date()
      })),
      allCampaignStatuses: campaigns.map(c => ({
        name: c.name,
        status: c.status,
        isScheduled: c.isScheduled,
        date: c.date,
        isFuture: new Date(c.date) > new Date()
      })),
      sentCampaignData: sentCampaigns.slice(0, 2).map(c => ({
        name: c.name,
        hasStats: !!c.statistics,
        recipients: c.statistics?.recipients || c.recipients || 0,
        revenue: c.statistics?.conversion_value || c.revenue || 0,
        opensUnique: c.statistics?.opens_unique || c.opensUnique || 0
      }))
    });

    const totalSent = sentCampaigns.length;
    const totalScheduled = scheduledCampaigns.length;

    // Calculate totals from sent campaigns using statistics object
    const totalRecipients = sentCampaigns.reduce((sum, c) => {
      return sum + (c.statistics?.recipients || 0);
    }, 0);

    const totalRevenue = sentCampaigns.reduce((sum, c) => {
      return sum + (c.statistics?.conversion_value || 0);
    }, 0);

    const totalOpens = sentCampaigns.reduce((sum, c) => {
      return sum + (c.statistics?.opens_unique || 0);
    }, 0);

    const totalClicks = sentCampaigns.reduce((sum, c) => {
      return sum + (c.statistics?.clicks_unique || 0);
    }, 0);

    const totalConversions = sentCampaigns.reduce((sum, c) => {
      return sum + (c.statistics?.conversions || 0);
    }, 0);

    // Calculate weighted averages for rates
    const avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) : 0;
    const avgClickRate = totalRecipients > 0 ? (totalClicks / totalRecipients) : 0;
    const conversionRate = totalRecipients > 0 ? (totalConversions / totalRecipients) : 0;

    console.log('📊 Final stats calculated:', {
      totalSent,
      totalScheduled,
      totalRecipients,
      totalRevenue,
      totalOpens,
      totalClicks,
      avgOpenRate: (avgOpenRate * 100).toFixed(1) + '%',
      avgClickRate: (avgClickRate * 100).toFixed(1) + '%',
      totalConversions,
      conversionRate: (conversionRate * 100).toFixed(1) + '%'
    });

    return {
      totalSent,
      totalScheduled,
      totalRecipients,
      avgOpenRate,
      avgClickRate,
      totalRevenue,
      totalOpens,
      totalClicks,
      conversionRate
    };
  }, [campaigns]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {/* Campaigns Sent */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Campaigns Sent</span>
          <Send className="h-4 w-4 text-sky-blue" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalSent}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {periodText}
        </div>
      </div>

      {/* Scheduled */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
          <Clock className="h-4 w-4 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalScheduled}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {periodText}
        </div>
      </div>

      {/* Total Recipients */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Recipients</span>
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(stats.totalRecipients)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Total reached
        </div>
      </div>

      {/* Average Open Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Open Rate</span>
          <Eye className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatPercentage(stats.avgOpenRate * 100)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatNumber(stats.totalOpens)} opens
        </div>
      </div>

      {/* Average Click Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Click Rate</span>
          <MousePointer className="h-4 w-4 text-vivid-violet" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatPercentage(stats.avgClickRate * 100)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatNumber(stats.totalClicks)} clicks
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
          <DollarSign className="h-4 w-4 text-orange-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(stats.totalRevenue)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatPercentage(stats.conversionRate * 100)} conv
        </div>
      </div>
    </div>
  );
};
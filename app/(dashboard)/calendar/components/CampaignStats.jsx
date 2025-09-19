"use client";

import { useMemo } from 'react';
import { Mail, Eye, MousePointer, DollarSign, Send, Clock } from 'lucide-react';

export const CampaignStats = ({ campaigns, isFiltered = false }) => {
  const stats = useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      return {
        totalSent: 0,
        totalScheduled: 0,
        avgOpenRate: 0,
        avgClickRate: 0,
        totalRevenue: 0,
        totalOpens: 0,
        totalClicks: 0,
        conversionRate: 0
      };
    }

    // Separate sent and scheduled campaigns
    const sentCampaigns = campaigns.filter(c => !c.isScheduled && c.status !== 'scheduled');
    const scheduledCampaigns = campaigns.filter(c => c.isScheduled || c.status === 'scheduled');

    const totalSent = sentCampaigns.length;
    const totalScheduled = scheduledCampaigns.length;
    const totalRevenue = sentCampaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0);

    // Calculate weighted averages for rates (only for sent campaigns)
    const totalRecipients = sentCampaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0);
    const totalOpens = sentCampaigns.reduce((sum, c) => sum + (c.performance?.opensUnique || 0), 0);
    const totalClicks = sentCampaigns.reduce((sum, c) => sum + (c.performance?.clicksUnique || 0), 0);
    const totalConversions = sentCampaigns.reduce((sum, c) => sum + (c.performance?.conversions || 0), 0);

    const avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) : 0;
    const avgClickRate = totalRecipients > 0 ? (totalClicks / totalRecipients) : 0;
    const conversionRate = totalRecipients > 0 ? (totalConversions / totalRecipients) : 0;

    return {
      totalSent,
      totalScheduled,
      avgOpenRate,
      avgClickRate,
      totalRevenue,
      totalOpens,
      totalClicks,
      conversionRate
    };
  }, [campaigns]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {/* Total Campaigns Sent */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Campaigns Sent</span>
          <Send className="h-4 w-4 text-sky-blue" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalSent}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isFiltered ? 'Filtered' : 'This month'}
        </div>
      </div>

      {/* Total Campaigns Scheduled */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
          <Clock className="h-4 w-4 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalScheduled}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {isFiltered ? 'Filtered' : 'Upcoming'}
        </div>
      </div>

      {/* Average Open Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Open Rate</span>
          <Eye className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {(stats.avgOpenRate * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.totalOpens.toLocaleString()} opens
        </div>
      </div>

      {/* Average Click Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Click Rate</span>
          <MousePointer className="h-4 w-4 text-vivid-violet" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {(stats.avgClickRate * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.totalClicks.toLocaleString()} clicks
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
          <DollarSign className="h-4 w-4 text-orange-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          ${stats.totalRevenue.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {(stats.conversionRate * 100).toFixed(0)}% conv
        </div>
      </div>
    </div>
  );
};
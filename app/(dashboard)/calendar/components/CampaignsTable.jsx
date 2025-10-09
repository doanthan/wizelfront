'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  Bell,
  ChevronsUpDown,
  Calendar,
  Building2
} from 'lucide-react';

/**
 * CampaignsTable Component
 *
 * Displays a detailed table of campaigns for the selected calendar period
 * Following the design pattern from /graphs TablesStyle component
 *
 * Features:
 * - Sortable columns
 * - Icons for message types
 * - Metrics: Recipients, Open Rate, Click Rate, CTOR, Revenue Per Recipient, Revenue
 * - Responsive design with proper dark mode support
 */
export function CampaignsTable({ campaigns, stores, onCampaignClick, view, date, loading }) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Get message type icon
  const getMessageIcon = (campaign) => {
    const channel = campaign.channel?.toLowerCase() || '';

    if (channel.includes('sms')) {
      return <MessageSquare className="h-4 w-4 text-green-600" />;
    } else if (channel.includes('push')) {
      return <Bell className="h-4 w-4 text-purple-600" />;
    } else {
      return <Mail className="h-4 w-4 text-blue-600" />;
    }
  };

  // Get store name from klaviyo_public_id
  const getStoreName = (campaign) => {
    const store = stores.find(s =>
      s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
    );
    return store?.name || 'Unknown Store';
  };

  // Calculate metrics for each campaign
  const enrichedCampaigns = useMemo(() => {
    return campaigns.map(campaign => {
      const stats = campaign.statistics || campaign;

      // Extract metrics
      const recipients = stats.recipients_delivered || stats.recipients || 0;
      const opensUnique = stats.opens_unique || stats.opensUnique || 0;
      const clicksUnique = stats.clicks_unique || stats.clicksUnique || 0;
      const revenue = stats.attributed_revenue || stats.revenue || 0;

      // Calculate rates
      const openRate = recipients > 0 ? (opensUnique / recipients) * 100 : 0;
      const clickRate = recipients > 0 ? (clicksUnique / recipients) * 100 : 0;
      const ctor = opensUnique > 0 ? (clicksUnique / opensUnique) * 100 : 0;
      const revenuePerRecipient = recipients > 0 ? revenue / recipients : 0;

      return {
        ...campaign,
        metrics: {
          recipients,
          openRate,
          clickRate,
          ctor,
          revenuePerRecipient,
          revenue
        }
      };
    });
  }, [campaigns]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort campaigns
  const sortedCampaigns = useMemo(() => {
    return [...enrichedCampaigns].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'name':
          aValue = (a.name || a.campaign_name || '').toLowerCase();
          bValue = (b.name || b.campaign_name || '').toLowerCase();
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);

        case 'date':
          aValue = new Date(a.date || a.send_time).getTime();
          bValue = new Date(b.date || b.send_time).getTime();
          break;

        case 'store':
          aValue = getStoreName(a).toLowerCase();
          bValue = getStoreName(b).toLowerCase();
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);

        default:
          // For metrics
          aValue = a.metrics[sortField] || 0;
          bValue = b.metrics[sortField] || 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [enrichedCampaigns, sortField, sortDirection, stores]);

  // Get view period description
  const getPeriodDescription = () => {
    if (view === 'day') {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (view === 'week') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  if (loading) {
    return (
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-gray-900 dark:text-white">Campaign Performance</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Loading campaigns...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedCampaigns.length === 0) {
    return (
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-gray-900 dark:text-white">Campaign Performance</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {getPeriodDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No campaigns found for this period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-300 dark:border-gray-600">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-gray-900 dark:text-white">Campaign Performance</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {getPeriodDescription()} • {sortedCampaigns.length} {sortedCampaigns.length === 1 ? 'campaign' : 'campaigns'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th
                  className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Campaign
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('store')}
                >
                  <div className="flex items-center gap-1">
                    Store
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('recipients')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Recipients
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('openRate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Open Rate
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('clickRate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Click Rate
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('ctor')}
                >
                  <div className="flex items-center justify-end gap-1">
                    CTOR
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('revenuePerRecipient')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Rev/Recipient
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Revenue
                    <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map((campaign, index) => {
                const campaignDate = new Date(campaign.date || campaign.send_time);
                const isScheduled = campaign.isScheduled || campaign.status === 'Scheduled' || campaign.status === 'Draft';

                return (
                  <tr
                    key={campaign.id || index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onClick={() => onCampaignClick(campaign)}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {getMessageIcon(campaign)}
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-50">
                            {campaign.name || campaign.campaign_name || 'Untitled Campaign'}
                          </span>
                          {isScheduled && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-200">
                      <div className="flex flex-col">
                        <span>
                          {campaignDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: campaignDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {campaignDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-200">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-sm">{getStoreName(campaign)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {formatNumber(campaign.metrics.recipients)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {campaign.metrics.openRate > 0 ? formatPercentage(campaign.metrics.openRate) : '—'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {campaign.metrics.clickRate > 0 ? formatPercentage(campaign.metrics.clickRate) : '—'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {campaign.metrics.ctor > 0 ? formatPercentage(campaign.metrics.ctor) : '—'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {campaign.metrics.revenuePerRecipient > 0 ? formatCurrency(campaign.metrics.revenuePerRecipient) : '—'}
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-gray-50">
                      {campaign.metrics.revenue > 0 ? formatCurrency(campaign.metrics.revenue) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/app/components/ui/hover-card';
import { formatNumber, formatCurrency, formatPercentage, cn } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  Bell,
  ChevronsUpDown,
  Calendar,
  Building2,
  Table as TableIcon,
  Users,
  Eye,
  MousePointer,
  DollarSign,
  Image as ImageIcon
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
export function CampaignsTable({ campaigns, stores, onCampaignClick, view, date, loading, displayMode, setDisplayMode }) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [smsContent, setSmsContent] = useState({}); // Cache for SMS content

  // Fetch SMS content directly from CDN (CORS configured on R2)
  const fetchSmsContent = async (campaign) => {
    const campaignId = campaign.id || campaign._id;

    // Check if already cached
    if (smsContent[campaignId]) {
      return smsContent[campaignId];
    }

    // Check if SMS preview URL exists
    if (!campaign.preview_sms_url) {
      return null;
    }

    try {
      // Fetch directly from R2 CDN (CORS enabled)
      const response = await fetch(campaign.preview_sms_url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'text/plain, */*'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch SMS content:', response.status);
        return null;
      }

      const text = await response.text();

      // Cache the content
      setSmsContent(prev => ({
        ...prev,
        [campaignId]: text
      }));

      return text;
    } catch (error) {
      console.error('Error fetching SMS content:', error);
      return null;
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Campaign Performance</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Loading campaigns...
              </CardDescription>
            </div>

            {/* View Mode Toggle */}
            {setDisplayMode && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={displayMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('calendar')}
                  className={cn(
                    "gap-1.5",
                    displayMode === 'calendar'
                      ? "bg-sky-blue hover:bg-royal-blue text-white"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Button>
                <Button
                  variant={displayMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('table')}
                  className={cn(
                    "gap-1.5",
                    displayMode === 'table'
                      ? "bg-sky-blue hover:bg-royal-blue text-white"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  <TableIcon className="h-4 w-4" />
                  Performance Table
                </Button>
              </div>
            )}
          </div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Campaign Performance</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {getPeriodDescription()}
              </CardDescription>
            </div>

            {/* View Mode Toggle */}
            {setDisplayMode && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={displayMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('calendar')}
                  className={cn(
                    "gap-1.5",
                    displayMode === 'calendar'
                      ? "bg-sky-blue hover:bg-royal-blue text-white"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Button>
                <Button
                  variant={displayMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('table')}
                  className={cn(
                    "gap-1.5",
                    displayMode === 'table'
                      ? "bg-sky-blue hover:bg-royal-blue text-white"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  <TableIcon className="h-4 w-4" />
                  Performance Table
                </Button>
              </div>
            )}
          </div>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 dark:text-white">Campaign Performance</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {getPeriodDescription()} • {sortedCampaigns.length} {sortedCampaigns.length === 1 ? 'campaign' : 'campaigns'}
            </CardDescription>
          </div>

          {/* View Mode Toggle */}
          {setDisplayMode && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={displayMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('calendar')}
                className={cn(
                  "gap-1.5",
                  displayMode === 'calendar'
                    ? "bg-sky-blue hover:bg-royal-blue text-white"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </Button>
              <Button
                variant={displayMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('table')}
                className={cn(
                  "gap-1.5",
                  displayMode === 'table'
                    ? "bg-sky-blue hover:bg-royal-blue text-white"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                <TableIcon className="h-4 w-4" />
                Performance Table
              </Button>
            </div>
          )}
        </div>
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
                const campaignId = campaign.id || campaign._id || index;

                // Check if campaign has a preview (email or SMS)
                const hasEmailPreview = campaign.preview_image_url || campaign.preview_image_html;
                const hasSMSPreview = campaign.channel?.toLowerCase().includes('sms') && campaign.preview_sms_url;
                const hasPreview = hasEmailPreview || hasSMSPreview;

                return (
                  <HoverCard
                    key={campaignId}
                    openDelay={200}
                    closeDelay={100}
                    onOpenChange={(open) => {
                      // Prefetch SMS content when hover opens
                      if (open && hasSMSPreview && !smsContent[campaignId]) {
                        fetchSmsContent(campaign);
                      }
                    }}
                  >
                    <HoverCardTrigger asChild>
                      <tr
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
                    </HoverCardTrigger>

                    {/* Preview Popover (Email or SMS) */}
                    {hasPreview && (
                      <HoverCardContent
                        className="w-[320px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl"
                        side="top"
                        align="start"
                        sideOffset={5}
                        alignOffset={50}
                      >
                        <div className="space-y-0">
                          {/* Campaign Info Header */}
                          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                              {campaign.name || campaign.campaign_name || 'Unnamed Campaign'}
                            </div>
                            {campaign.subject && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                                {campaign.subject}
                              </div>
                            )}
                            {/* Quick Stats */}
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {formatNumber(campaign.metrics.recipients)}
                                </span>
                              </div>
                              {campaign.channel?.toLowerCase().includes('email') && (
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                                    {campaign.metrics.openRate > 0 ? formatPercentage(campaign.metrics.openRate) : '0%'}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <MousePointer className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {campaign.metrics.clickRate > 0 ? formatPercentage(campaign.metrics.clickRate) : '0%'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {campaign.metrics.revenue > 0 ? formatCurrency(campaign.metrics.revenue) : '$0'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SMS Preview */}
                          {hasSMSPreview ? (
                            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                              <div className="p-4">
                                {/* SMS Message Bubble */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm shadow-md p-4 max-w-[280px]">
                                  {smsContent[campaignId] ? (
                                    <>
                                      <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                                        {smsContent[campaignId]}
                                      </div>
                                      {/* Character count */}
                                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                        {smsContent[campaignId].length} characters
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                                      Loading SMS content...
                                    </div>
                                  )}
                                </div>
                                {/* SMS indicator */}
                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>SMS Message</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Email Preview - Above the fold only */
                            campaign.preview_image_url ? (
                              <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800">
                                <div className="relative h-[280px] overflow-hidden">
                                  <img
                                    src={campaign.preview_image_url}
                                    alt={`Preview of ${campaign.name || campaign.campaign_name || 'campaign'}`}
                                    className="w-full h-auto object-cover object-top"
                                    style={{
                                      maxHeight: 'none',
                                      minHeight: '280px'
                                    }}
                                    onError={(e) => {
                                      // Fallback if image fails to load
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div
                                    className="hidden items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm"
                                    style={{ display: 'none' }}
                                  >
                                    <div className="text-center">
                                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p>Preview not available</p>
                                    </div>
                                  </div>
                                </div>
                                {/* Fade overlay at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent pointer-events-none" />
                              </div>
                            ) : campaign.preview_image_html ? (
                              <div className="text-xs text-gray-500 dark:text-gray-400 p-4 text-center">
                                <a
                                  href={campaign.preview_image_html}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                  View HTML Preview
                                </a>
                              </div>
                            ) : null
                          )}
                        </div>
                      </HoverCardContent>
                    )}
                  </HoverCard>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

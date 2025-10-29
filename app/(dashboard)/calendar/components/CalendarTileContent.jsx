"use client";

import { useState } from 'react';
import { Clock, Mail, MessageSquare, Bell, CheckSquare, Square, FileText, Users, Eye, MousePointer, DollarSign, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { getStoreColor } from '@/lib/calendar-colors';
import { getCampaignMetrics, isCampaignScheduled } from '../utils/calendar-helpers';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/app/components/ui/hover-card';

export const CalendarTileContent = ({
  campaigns,
  stores,
  handleCampaignClick,
  maxCampaignsToShow = 2,
  selectedForComparison = [],
  handleComparisonToggle
}) => {
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

  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div className="w-full mt-1 space-y-1">
      {campaigns.slice(0, maxCampaignsToShow).map((campaign, index) => {
        const { openRate, clickRate, revenue, metricValue } = getCampaignMetrics(campaign);
        const campaignId = campaign.id || campaign._id;

        // Get store for color coding
        const store = stores.find(s =>
          s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
        );

        const colorKey = store?.id || store?._id || campaign.klaviyo_public_id;
        const storeColor = getStoreColor(colorKey);

        // Check if campaign is scheduled
        const isScheduled = isCampaignScheduled(campaign);

        // Check if campaign has a preview (email or SMS) - only for sent campaigns
        const hasEmailPreview = !isScheduled && (campaign.preview_image_url || campaign.preview_image_html);
        const hasSMSPreview = !isScheduled && campaign.channel === 'sms' && campaign.preview_sms_url;
        const hasPreview = hasEmailPreview || hasSMSPreview;

        // Build classes and tooltip
        const baseClasses = `text-xs px-1.5 py-1 rounded-md border cursor-pointer hover:opacity-90 transition-opacity shadow-sm`;

        let campaignClasses;
        let titleText;

        if (isScheduled) {
          // Scheduled campaigns: dashed border with store color
          campaignClasses = `${baseClasses} ${storeColor.bg} ${storeColor.text} border-dashed ${storeColor.border}`;
          const statusLabel = campaign.status === 'Draft' ? 'DRAFT' :
                            campaign.status === 'Sending' ? 'SENDING' :
                            'SCHEDULED';
          titleText = `📅 ${statusLabel}: ${campaign.name}\n${store?.name || campaign.storeName || 'Unknown Store'}\n${campaign.channel.toUpperCase()}\n${statusLabel === 'DRAFT' ? 'Created' : 'Scheduled'}: ${format(new Date(campaign.date), 'MMM d, h:mm a')}`;
        } else {
          // Sent campaigns: solid border, store color background
          campaignClasses = `${baseClasses} ${storeColor.bg} ${storeColor.text} ${storeColor.border}`;

          // Format the metrics for display
          const openRatePercent = openRate < 1 ? openRate * 100 : openRate;
          const clickRatePercent = clickRate < 1 ? clickRate * 100 : clickRate;

          titleText = `${campaign.name}\n${store?.name || campaign.storeName || 'Unknown Store'}\n${campaign.channel.toUpperCase()}\nOpen: ${openRatePercent.toFixed(1)}%\nClick: ${clickRatePercent.toFixed(1)}%\nRevenue: $${revenue.toFixed(2)}`;
        }

        const isSelected = selectedForComparison.includes(campaign.id);

        return (
          <HoverCard
            key={`${campaign.isScheduled ? 'future' : 'past'}-${campaignId}-${index}`}
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
              <div
                className={cn(campaignClasses, "relative", isSelected && "ring-2 ring-sky-blue")}
            onClick={(e) => {
              e.stopPropagation();
              handleCampaignClick(campaign);
            }}
          >
            {handleComparisonToggle && !isScheduled && (
              <div
                className="absolute -top-1 -right-1 z-10 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-md border border-gray-200 dark:border-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComparisonToggle(campaign.id);
                }}
              >
                {isSelected ? (
                  <CheckSquare className="h-3 w-3 text-sky-blue" />
                ) : (
                  <Square className="h-3 w-3 text-gray-400 hover:text-sky-blue" />
                )}
              </div>
            )}
            <div className="truncate font-semibold text-xs flex items-center">
              {isScheduled && (
                campaign.status === 'Draft' ?
                  <FileText className="h-3 w-3 mr-1 flex-shrink-0" /> :
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              )}
              <span className="truncate">{campaign.name}</span>
            </div>
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-[10px] font-medium flex items-center">
                {campaign.channel === 'email' && <Mail className="h-3 w-3 inline mr-0.5" />}
                {campaign.channel === 'sms' && <MessageSquare className="h-3 w-3 inline mr-0.5" />}
                {campaign.channel === 'push-notification' && <Bell className="h-3 w-3 inline mr-0.5" />}
                {store?.name || campaign.storeName || 'Unknown'}
              </span>
              <span className={`text-[10px] font-bold`}>
                {isScheduled ? format(new Date(campaign.date), 'h:mm a') : (
                  revenue > 0 ? `$${revenue >= 1000 ? `${(revenue/1000).toFixed(1)}k` : revenue.toFixed(0)}` : '$0'
                )}
              </span>
            </div>
            {isScheduled && (
              <div className="text-[10px] font-medium mt-0.5 text-sky-blue">
                {campaign.status === 'Draft' ? 'Draft' :
                 campaign.status === 'Sending' ? 'Sending' :
                 'Scheduled'}
              </div>
            )}
              </div>
            </HoverCardTrigger>

            {/* Preview Popover (Email or SMS) - Only for sent campaigns */}
            {hasPreview && (
              <HoverCardContent
                className="w-[320px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl z-50"
                side="top"
                align="center"
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
                          {formatNumber(campaign.statistics?.recipients || 0)}
                        </span>
                      </div>
                      {campaign.channel === 'email' && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {formatPercentage(openRate < 1 ? openRate * 100 : openRate)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MousePointer className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {formatPercentage(clickRate < 1 ? clickRate * 100 : clickRate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {formatCurrency(revenue)}
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
      {campaigns.length > maxCampaignsToShow && (
        <div className="text-[10px] text-center text-gray-500 dark:text-gray-400 font-medium">
          +{campaigns.length - maxCampaignsToShow} more
        </div>
      )}
    </div>
  );
};
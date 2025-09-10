"use client";

import { Clock, Mail, MessageSquare, Bell, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStoreColor } from '@/lib/calendar-colors';
import { getCampaignMetrics, isCampaignScheduled } from '../utils/calendar-helpers';

export const CalendarTileContent = ({ 
  campaigns, 
  stores, 
  handleCampaignClick,
  maxCampaignsToShow = 2,
  selectedForComparison = [],
  handleComparisonToggle
}) => {
  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div className="w-full mt-1 space-y-1">
      {campaigns.slice(0, maxCampaignsToShow).map((campaign, index) => {
        const { openRate, clickRate, revenue, metricValue } = getCampaignMetrics(campaign);
        
        // Get store for color coding
        const store = stores.find(s => 
          s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
        );
        
        const colorKey = store?.id || store?._id || campaign.klaviyo_public_id;
        const storeColor = getStoreColor(colorKey);
        
        // Check if campaign is scheduled
        const isScheduled = isCampaignScheduled(campaign);
        
        // Build classes and tooltip
        const baseClasses = `text-xs px-1.5 py-1 rounded-md border cursor-pointer hover:opacity-90 transition-opacity shadow-sm`;
        
        let campaignClasses;
        let titleText;
        
        if (isScheduled) {
          // Scheduled campaigns: dashed border with store color
          campaignClasses = `${baseClasses} ${storeColor.bg} ${storeColor.text} border-dashed ${storeColor.border}`;
          titleText = `📅 SCHEDULED: ${campaign.name}\n${store?.name || campaign.storeName || 'Unknown Store'}\n${campaign.channel.toUpperCase()}\nScheduled: ${format(new Date(campaign.date), 'MMM d, h:mm a')}`;
        } else {
          // Sent campaigns: solid border, store color background
          campaignClasses = `${baseClasses} ${storeColor.bg} ${storeColor.text} ${storeColor.border}`;
          titleText = `${campaign.name}\n${store?.name || campaign.storeName || 'Unknown Store'}\n${campaign.channel.toUpperCase()}\nOpen: ${(openRate * 100).toFixed(1)}%\nClick: ${(clickRate * 100).toFixed(1)}%\nRevenue: $${revenue.toFixed(2)}`;
        }
        
        const isSelected = selectedForComparison.includes(campaign.id);
        
        return (
          <div
            key={`${campaign.isScheduled ? 'future' : 'past'}-${campaign.id}-${index}`}
            className={cn(campaignClasses, "relative", isSelected && "ring-2 ring-sky-blue")}
            title={titleText}
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
              {isScheduled && <Clock className="h-3 w-3 mr-1 flex-shrink-0" />}
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
                {isScheduled ? format(new Date(campaign.date), 'h:mm a') : `${(metricValue * 100).toFixed(1)}%`}
              </span>
            </div>
            {!isScheduled && revenue > 0 && (
              <div className="text-[10px] font-bold mt-0.5">
                ${revenue >= 1000 ? `${(revenue/1000).toFixed(1)}k` : revenue.toFixed(0)}
              </div>
            )}
            {isScheduled && (
              <div className="text-[10px] font-medium mt-0.5 text-sky-blue">
                Scheduled
              </div>
            )}
          </div>
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
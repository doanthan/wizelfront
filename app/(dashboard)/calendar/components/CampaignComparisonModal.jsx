"use client";

import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Mail, MessageSquare, Bell, Users, Eye, MousePointer, DollarSign, Calendar, Target, Zap, X } from 'lucide-react';
import { getCampaignMetrics } from '../utils/calendar-helpers';
import { cn } from '@/lib/utils';
import { EmailPreviewPanel } from './EmailPreviewPanel';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

export default function CampaignComparisonModal({ 
  campaignIds, 
  campaigns, 
  onClose,
  stores 
}) {
  const selectedCampaigns = campaigns.filter(c => 
    campaignIds.includes(c.id)
  ).slice(0, 5); // Limit to 5 campaigns
  
  if (selectedCampaigns.length === 0) return null;
  
  // Debug: Log available stores
  console.log('🏪 Available stores in comparison modal:', stores?.map(s => ({
    name: s.name,
    public_id: s.public_id,
    klaviyo_public_id: s.klaviyo_integration?.public_id
  })));

  // Debug: Log campaigns being compared
  console.log('📊 Campaigns to compare:', selectedCampaigns.map(c => ({
    name: c.name,
    klaviyo_public_id: c.klaviyo_public_id,
    store_public_id: c.store_public_id,
    storeIds: c.storeIds
  })));

  // Prepare data for each campaign
  const campaignData = selectedCampaigns.map(campaign => {
    // Find store by matching klaviyo_public_id first, then by store_public_id, then by storeIds array
    const store = stores?.find(s =>
      s.klaviyo_integration?.public_id === campaign.klaviyo_public_id ||
      s.public_id === campaign.store_public_id ||
      campaign.storeIds?.includes(s.public_id)
    );

    console.log(`🔍 Store lookup for campaign "${campaign.name}":`, {
      found: !!store,
      storeName: store?.name,
      storePublicId: store?.public_id,
      matchedBy: store ? (
        store.klaviyo_integration?.public_id === campaign.klaviyo_public_id ? 'klaviyo_public_id' :
        store.public_id === campaign.store_public_id ? 'store_public_id' :
        campaign.storeIds?.includes(store.public_id) ? 'storeIds array' : 'unknown'
      ) : 'not found'
    });
    const { openRate, clickRate, revenue } = getCampaignMetrics(campaign);
    const recipients = campaign.performance?.recipients || campaign.recipients || 0;
    const delivered = campaign.performance?.delivered || campaign.delivered || recipients;
    const opensUnique = campaign.performance?.opensUnique || campaign.opensUnique || 0;
    const clicksUnique = campaign.performance?.clicksUnique || campaign.clicksUnique || 0;
    const conversions = campaign.performance?.conversions || campaign.conversions || 0;
    const conversionRate = campaign.performance?.conversionRate || campaign.conversionRate || 0;
    
    return {
      ...campaign,
      store,
      metrics: {
        recipients,
        delivered,
        opensUnique,
        clicksUnique,
        conversions,
        openRate,
        clickRate,
        conversionRate,
        revenue,
        ctor: openRate > 0 ? (clickRate / openRate) : 0,
        revenuePerRecipient: recipients > 0 ? revenue / recipients : 0
      }
    };
  });
  
  // Determine grid columns based on number of campaigns
  const getGridCols = () => {
    switch(selectedCampaigns.length) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-2 lg:grid-cols-4';
      case 5: return 'grid-cols-2 lg:grid-cols-5';
      default: return 'grid-cols-3';
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] h-[95vh] p-0 overflow-hidden bg-gray-950">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Campaign Comparison ({selectedCampaigns.length} campaigns)
        </DialogTitle>
        
        {/* Custom header bar */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-200">
            Campaign Comparison ({selectedCampaigns.length} campaigns)
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        
        {/* Main content area */}
        <div className="h-full pt-10 bg-gray-950 overflow-hidden flex flex-col">
          {/* Email/SMS Preview Section - Takes most of the space */}
          <div className="flex-1 overflow-hidden">
            <div className={cn("grid h-full", getGridCols())}>
              {campaignData.map(campaign => (
                <div key={campaign.id} className="border-r border-gray-800 last:border-r-0 flex flex-col h-full overflow-hidden">
                  {/* Campaign Info Header - Ultra compact */}
                  <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {campaign.channel === 'email' && <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                        {campaign.channel === 'sms' && <MessageSquare className="h-3 w-3 text-green-500 flex-shrink-0" />}
                        {campaign.channel === 'push-notification' && <Bell className="h-3 w-3 text-purple-500 flex-shrink-0" />}
                        <h4 className="text-sm text-gray-100 truncate" title={campaign.name}>
                          {campaign.name}
                        </h4>
                      </div>
                      <Badge className="text-xs flex-shrink-0" variant={campaign.channel === 'email' ? 'default' : 'secondary'}>
                        {campaign.channel?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-gray-400 truncate">
                        {campaign.store?.name || 'Unknown Store'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.date || campaign.send_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Email/SMS Preview - Individual scrollable containers */}
                  <div className="flex-1 min-h-0 bg-white dark:bg-gray-950 overflow-y-auto comparison-preview-scroll">
                    {(() => {
                      // Get the store's public_id (NOT klaviyo_public_id)
                      // Priority:
                      // 1. campaign.store.public_id (from store lookup)
                      // 2. campaign.store_public_id (direct field - historical campaigns)
                      // 3. campaign.store_public_ids[0] (plural array - future campaigns)
                      // 4. campaign.storeIds[0] (alias array)
                      // 5. Find store by klaviyo_public_id and get its public_id
                      let storeId = campaign.store?.public_id ||
                                   campaign.store_public_id ||           // Historical campaigns (singular)
                                   campaign.store_public_ids?.[0] ||     // Future campaigns (plural array)
                                   campaign.storeIds?.[0];               // Alias array

                      // Only fall back to klaviyo_public_id lookup if we still don't have a storeId
                      if (!storeId && campaign.klaviyo_public_id) {
                        const foundStore = stores?.find(s =>
                          s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                        );
                        storeId = foundStore?.public_id;
                      }

                      console.log('🔍 Comparison Modal Preview Debug:', {
                        campaignName: campaign.name,
                        messageId: campaign.messageId,
                        finalStoreId: storeId,
                        hasStore: !!campaign.store,
                        storePublicId: campaign.store?.public_id,
                        campaignStorePublicId: campaign.store_public_id,
                        storeIds: campaign.storeIds,
                        storePublicIds: campaign.store_public_ids,
                        klaviyoPublicId: campaign.klaviyo_public_id,
                        storeKlaviyoId: campaign.store?.klaviyo_integration?.public_id
                      });

                      return (
                        <EmailPreviewPanel
                          messageId={campaign.messageId}
                          storeId={storeId}
                          campaign={campaign}
                          compact={true}
                        />
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stats Section - Fixed height with unified scroll */}
          <div className="flex-shrink-0 bg-gray-900/50 border-t border-gray-800 relative" style={{ height: '280px' }}>
            <div className="h-full overflow-y-auto pb-12">
              <div className={cn("grid", getGridCols())}>
                {campaignData.map((campaign, idx) => (
                  <div key={campaign.id} className={cn("border-r border-gray-800", idx === campaignData.length - 1 && "border-r-0")}>
                    <table className="w-full text-xs">
                      <tbody>
                        {/* Recipients Row */}
                        <tr className="border-b border-gray-800">
                          <td className="px-3 py-2 text-gray-400 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Recipients
                          </td>
                          <td className="px-3 py-2 text-right text-gray-200 font-medium">
                            {formatNumber(campaign.metrics.recipients)}
                          </td>
                        </tr>
                      
                      {/* Delivered Row */}
                      <tr className="border-b border-gray-800 bg-gray-900/30">
                        <td className="px-3 py-2 text-gray-400">Delivered</td>
                        <td className="px-3 py-2 text-right text-gray-200">
                          {formatNumber(campaign.metrics.delivered)}
                        </td>
                      </tr>
                      
                      {/* Opens Row */}
                      <tr className="border-b border-gray-800">
                        <td className="px-3 py-2 text-gray-400 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Opens
                        </td>
                        <td className="px-3 py-2 text-right text-gray-200">
                          {formatNumber(campaign.metrics.opensUnique)}
                        </td>
                      </tr>
                      
                      {/* Open Rate Row */}
                      <tr className="border-b border-gray-800 bg-gray-900/30">
                        <td className="px-3 py-2 text-gray-400">Open Rate</td>
                        <td className={cn(
                          "px-3 py-2 text-right font-semibold",
                          campaign.metrics.openRate > 0.2 ? 'text-green-500' : 
                          campaign.metrics.openRate > 0.1 ? 'text-yellow-500' : 'text-red-500'
                        )}>
                          {formatPercentage(campaign.metrics.openRate * 100)}
                        </td>
                      </tr>
                      
                      {/* Clicks Row */}
                      <tr className="border-b border-gray-800">
                        <td className="px-3 py-2 text-gray-400 flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          Clicks
                        </td>
                        <td className="px-3 py-2 text-right text-gray-200">
                          {formatNumber(campaign.metrics.clicksUnique)}
                        </td>
                      </tr>
                      
                      {/* Click Rate Row */}
                      <tr className="border-b border-gray-800 bg-gray-900/30">
                        <td className="px-3 py-2 text-gray-400">Click Rate</td>
                        <td className={cn(
                          "px-3 py-2 text-right font-semibold",
                          campaign.metrics.clickRate > 0.05 ? 'text-green-500' : 
                          campaign.metrics.clickRate > 0.02 ? 'text-yellow-500' : 'text-red-500'
                        )}>
                          {formatPercentage(campaign.metrics.clickRate * 100)}
                        </td>
                      </tr>
                      
                      {/* CTOR Row */}
                      <tr className="border-b border-gray-800">
                        <td className="px-3 py-2 text-gray-400 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          CTOR
                        </td>
                        <td className={cn(
                          "px-3 py-2 text-right font-semibold",
                          campaign.metrics.ctor > 0.25 ? 'text-green-500' : 
                          campaign.metrics.ctor > 0.15 ? 'text-yellow-500' : 'text-red-500'
                        )}>
                          {formatPercentage(campaign.metrics.ctor * 100)}
                        </td>
                      </tr>
                      
                      {/* Conversions Row */}
                      <tr className="border-b border-gray-800 bg-gray-900/30">
                        <td className="px-3 py-2 text-gray-400 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Conversions
                        </td>
                        <td className="px-3 py-2 text-right text-gray-200">
                          {formatNumber(campaign.metrics.conversions)}
                        </td>
                      </tr>
                      
                      {/* Conversion Rate Row */}
                      <tr className="border-b border-gray-800">
                        <td className="px-3 py-2 text-gray-400">Conv. Rate</td>
                        <td className={cn(
                          "px-3 py-2 text-right font-semibold",
                          campaign.metrics.conversionRate > 0.05 ? 'text-green-500' : 
                          campaign.metrics.conversionRate > 0.02 ? 'text-yellow-500' : 'text-red-500'
                        )}>
                          {formatPercentage(campaign.metrics.conversionRate * 100)}
                        </td>
                      </tr>
                      
                      {/* Revenue Row */}
                      <tr className="border-b border-gray-800 bg-gray-900/30">
                        <td className="px-3 py-2 text-gray-400 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Revenue
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-500">
                          {formatCurrency(campaign.metrics.revenue)}
                        </td>
                      </tr>
                      
                      {/* Rev/Recipient Row */}
                      <tr className="border-b border-gray-800">
                        <td className="px-3 py-2 text-gray-400">Rev/Recipient</td>
                        <td className="px-3 py-2 text-right text-gray-200">
                          {formatCurrency(campaign.metrics.revenuePerRecipient)}
                        </td>
                      </tr>
                      
                        {/* Average Order Value */}
                        <tr className="border-b border-gray-800 bg-gray-900/30">
                          <td className="px-3 py-2 text-gray-400">AOV</td>
                          <td className="px-3 py-2 text-right text-gray-200">
                            {campaign.metrics.conversions > 0 
                              ? formatCurrency(campaign.metrics.revenue / campaign.metrics.conversions)
                              : '$0.00'
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
            {/* Summary Statistics - Positioned at bottom of stats section */}
            {selectedCampaigns.length > 1 && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-t-lg px-6 py-2 shadow-lg z-10">
                <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Avg Open Rate:</span>
                  <span className="font-medium text-gray-200">
                    {formatPercentage(
                      campaignData.reduce((sum, c) => sum + c.metrics.openRate, 0) / 
                      campaignData.length * 100
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Avg Click Rate:</span>
                  <span className="font-medium text-gray-200">
                    {formatPercentage(
                      campaignData.reduce((sum, c) => sum + c.metrics.clickRate, 0) / 
                      campaignData.length * 100
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Avg CTOR:</span>
                  <span className="font-medium text-gray-200">
                    {formatPercentage(
                      campaignData.reduce((sum, c) => sum + c.metrics.ctor, 0) / 
                      campaignData.length * 100
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 border-l border-gray-700 pl-6">
                  <span className="text-gray-400">Total Revenue:</span>
                  <span className="font-medium text-emerald-500">
                    {formatCurrency(
                      campaignData.reduce((sum, c) => sum + c.metrics.revenue, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
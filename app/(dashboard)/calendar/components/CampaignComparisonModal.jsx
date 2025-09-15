"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Mail, MessageSquare, Bell, Users, Eye, MousePointer, DollarSign } from 'lucide-react';
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
      <DialogContent className="max-w-[95vw] h-[90vh] overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-between">
            <span>Campaign Comparison ({selectedCampaigns.length} campaigns)</span>
            {selectedCampaigns.length === 5 && (
              <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Max 5 campaigns</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Main content area - side by side previews with stats */}
        <div className="flex-1 overflow-auto p-4">
          <div className={cn("grid gap-4", getGridCols())}>
            {selectedCampaigns.map(campaign => {
              const store = stores?.find(s => 
                s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
              );
              const { openRate, clickRate, revenue } = getCampaignMetrics(campaign);
              const recipients = campaign.performance?.recipients || 0;
              
              return (
                <div key={campaign.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-gray-900 h-full">
                  {/* Campaign Header - Fixed height */}
                  <div className="p-3 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 h-[88px]">
                    <div className="flex items-center gap-2 mb-1">
                      {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                      {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                      {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600" />}
                      <Badge className="text-xs" variant={campaign.channel === 'email' ? 'default' : 'secondary'}>
                        {campaign.channel?.toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={campaign.name}>
                      {campaign.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{store?.name || 'Unknown Store'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={campaign.subject || 'No subject'}>
                      {campaign.channel === 'email' ? `Subject: ${campaign.subject || 'No subject'}` : `${campaign.channel === 'sms' ? 'SMS Message' : 'Push Notification'}`}
                    </p>
                  </div>
                  
                  {/* Preview Area - Fixed height */}
                  <div className="bg-gray-50 dark:bg-gray-950 h-[350px] overflow-hidden">
                    <EmailPreviewPanel 
                      messageId={campaign.messageId} 
                      storeId={campaign.klaviyo_public_id || store?.klaviyo_integration?.public_id || campaign.storeIds?.[0]}
                      compact={true}
                    />
                  </div>
                  
                  {/* Detailed Stats Section - Fixed height structure */}
                  <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700">
                      <div className="bg-white dark:bg-gray-800 p-2 h-[60px] flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Users className="h-3 w-3" />
                          Recipients
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white mt-1">
                          {formatNumber(recipients)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 h-[60px] flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <DollarSign className="h-3 w-3" />
                          Revenue
                        </div>
                        <p className="font-semibold text-emerald-600 mt-1">
                          {formatCurrency(revenue)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-px bg-gray-200 dark:bg-gray-700">
                      <div className="bg-white dark:bg-gray-800 p-2 text-center h-[65px] flex flex-col justify-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Eye className="h-3 w-3" />
                          Open
                        </div>
                        <div className="mt-1">
                          <Badge 
                            className={cn(
                              "font-semibold text-xs",
                              openRate > 0.2 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : openRate > 0.1 
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {formatPercentage(openRate * 100)}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 text-center h-[65px] flex flex-col justify-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <MousePointer className="h-3 w-3" />
                          Click
                        </div>
                        <div className="mt-1">
                          <Badge 
                            className={cn(
                              "font-semibold text-xs",
                              clickRate > 0.05 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : clickRate > 0.02 
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {formatPercentage(clickRate * 100)}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 text-center h-[65px] flex flex-col justify-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          CTOR
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-1">
                          {openRate > 0 ? formatPercentage((clickRate / openRate) * 100) : '0%'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700">
                      <div className="bg-white dark:bg-gray-800 p-2 text-center h-[50px] flex flex-col justify-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Rev/Recipient</div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mt-0.5">
                          {recipients > 0 ? formatCurrency(revenue / recipients) : '$0.00'}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 text-center h-[50px] flex flex-col justify-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Conv. Rate</div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mt-0.5">
                          {formatPercentage((campaign.performance?.conversionRate || 0) * 100)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary Statistics */}
          {selectedCampaigns.length > 1 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Average Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Recipients</div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(
                      selectedCampaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0) / 
                      selectedCampaigns.length
                    )}
                  </p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Open Rate</div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPercentage(
                      selectedCampaigns.reduce((sum, c) => sum + (c.performance?.openRate || 0), 0) / 
                      selectedCampaigns.length * 100
                    )}
                  </p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Click Rate</div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPercentage(
                      selectedCampaigns.reduce((sum, c) => sum + (c.performance?.clickRate || 0), 0) / 
                      selectedCampaigns.length * 100
                    )}
                  </p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Revenue</div>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(
                      selectedCampaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0) / 
                      selectedCampaigns.length
                    )}
                  </p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</div>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(
                      selectedCampaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0)
                    )}
                  </p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Recipients</div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(
                      selectedCampaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Mail, MessageSquare, Bell, Eye, MousePointer, DollarSign, BarChart3, FileText } from 'lucide-react';
import { getCampaignMetrics } from '../utils/calendar-helpers';
import { cn } from '@/lib/utils';
import { EmailPreviewPanel } from './EmailPreviewPanel';

export default function CampaignComparisonModal({ 
  campaignIds, 
  campaigns, 
  onClose,
  stores 
}) {
  const [activeTab, setActiveTab] = useState('metrics');
  const selectedCampaigns = campaigns.filter(c => 
    campaignIds.includes(c.id)
  ).slice(0, 5); // Limit to 5 campaigns
  
  if (selectedCampaigns.length === 0) return null;
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[85vh] overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-between">
            <span>Campaign Comparison ({selectedCampaigns.length} campaigns)</span>
            {selectedCampaigns.length === 5 && (
              <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Max 5 campaigns</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start border-b border-gray-200 dark:border-gray-700 bg-transparent rounded-none px-4 flex-shrink-0">
            <TabsTrigger 
              value="metrics" 
              className="flex items-center gap-2 data-[state=active]:text-sky-blue data-[state=active]:border-b-2 data-[state=active]:border-sky-blue"
            >
              <BarChart3 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger 
              value="previews" 
              className="flex items-center gap-2 data-[state=active]:text-sky-blue data-[state=active]:border-b-2 data-[state=active]:border-sky-blue"
            >
              <FileText className="h-4 w-4" />
              Previews
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="flex-1 overflow-auto p-4">
            <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">Campaign</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Channel</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Recipients</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Open Rate</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Click Rate</th>
                <th className="text-center p-3 font-semibold text-gray-900 dark:text-gray-100">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {selectedCampaigns.map((campaign, index) => {
                const { openRate, clickRate, revenue } = getCampaignMetrics(campaign);
                const recipients = campaign.performance?.recipients || 0;
                
                return (
                  <tr 
                    key={campaign.id} 
                    className={cn(
                      "border-b border-gray-200 dark:border-gray-700",
                      index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"
                    )}
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{campaign.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{campaign.storeName}</div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600 mx-auto" />}
                      {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600 mx-auto" />}
                      {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600 mx-auto" />}
                    </td>
                    <td className="p-3 text-center font-medium text-gray-900 dark:text-white">
                      {recipients.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <Badge 
                        className={cn(
                          "font-semibold",
                          openRate > 0.2 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700" 
                            : openRate > 0.1 
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700"
                        )}
                      >
                        {(openRate * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge 
                        className={cn(
                          "font-semibold",
                          clickRate > 0.05 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700" 
                            : clickRate > 0.02 
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700"
                        )}
                      >
                        {(clickRate * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                      ${revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                <td className="p-3 text-gray-900 dark:text-white">Average</td>
                <td className="p-3"></td>
                <td className="p-3 text-center text-gray-900 dark:text-white">
                  {Math.round(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0) / 
                    selectedCampaigns.length
                  ).toLocaleString()}
                </td>
                <td className="p-3 text-center text-gray-900 dark:text-white">
                  {(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.openRate || 0), 0) / 
                    selectedCampaigns.length * 100
                  ).toFixed(1)}%
                </td>
                <td className="p-3 text-center text-gray-900 dark:text-white">
                  {(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.clickRate || 0), 0) / 
                    selectedCampaigns.length * 100
                  ).toFixed(1)}%
                </td>
                <td className="p-3 text-right text-gray-900 dark:text-white">
                  ${Math.round(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0) / 
                    selectedCampaigns.length
                  ).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
          </TabsContent>
          
          <TabsContent value="previews" className="flex-1 overflow-hidden p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-auto">
              {selectedCampaigns.map(campaign => {
                const store = stores?.find(s => 
                  s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                );
                
                return (
                  <div key={campaign.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                    {/* Campaign Header */}
                    <div className="p-3 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                        {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                        {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600" />}
                        <Badge className="text-xs" variant={campaign.channel === 'email' ? 'default' : 'secondary'}>
                          {campaign.channel?.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{campaign.name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{store?.name || 'Unknown Store'}</p>
                      {campaign.subject && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Subject: {campaign.subject}</p>
                      )}
                    </div>
                    
                    {/* Preview Area */}
                    <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
                      <div className="h-[400px] overflow-hidden">
                        <EmailPreviewPanel 
                          messageId={campaign.messageId} 
                          storeId={campaign.klaviyo_public_id || store?.klaviyo_integration?.public_id || campaign.storeIds?.[0]}
                          compact={true}
                        />
                      </div>
                    </div>
                    
                    {/* Quick Stats Footer */}
                    <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <span className="text-gray-500 dark:text-gray-400">Open</span>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {((campaign.performance?.openRate || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <span className="text-gray-500 dark:text-gray-400">Click</span>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {((campaign.performance?.clickRate || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <span className="text-gray-500 dark:text-gray-400">Revenue</span>
                          <p className="font-semibold text-emerald-600">
                            ${(campaign.performance?.revenue || 0) >= 1000
                              ? `${((campaign.performance?.revenue || 0)/1000).toFixed(1)}k`
                              : (campaign.performance?.revenue || 0).toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
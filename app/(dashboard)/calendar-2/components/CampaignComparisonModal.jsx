"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Mail, MessageSquare, Bell, Eye, MousePointer, DollarSign } from 'lucide-react';
import { getCampaignMetrics } from '../utils/calendar-helpers';

export default function CampaignComparisonModal({ 
  campaignIds, 
  campaigns, 
  onClose 
}) {
  const selectedCampaigns = campaigns.filter(c => 
    campaignIds.includes(c.id)
  );
  
  if (selectedCampaigns.length === 0) return null;
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Campaign Comparison ({selectedCampaigns.length} campaigns)
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-3">Campaign</th>
                <th className="text-center p-3">Channel</th>
                <th className="text-center p-3">Recipients</th>
                <th className="text-center p-3">Open Rate</th>
                <th className="text-center p-3">Click Rate</th>
                <th className="text-center p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {selectedCampaigns.map(campaign => {
                const { openRate, clickRate, revenue } = getCampaignMetrics(campaign);
                const recipients = campaign.performance?.recipients || 0;
                
                return (
                  <tr key={campaign.id} className="border-b dark:border-gray-700">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-gray-500">{campaign.storeName}</div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600 mx-auto" />}
                      {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600 mx-auto" />}
                      {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">{recipients.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <Badge variant={openRate > 0.2 ? 'success' : openRate > 0.1 ? 'warning' : 'destructive'}>
                        {(openRate * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={clickRate > 0.05 ? 'success' : clickRate > 0.02 ? 'warning' : 'destructive'}>
                        {(clickRate * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-medium">
                      ${revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="p-3">Average</td>
                <td className="p-3"></td>
                <td className="p-3 text-center">
                  {Math.round(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.recipients || 0), 0) / 
                    selectedCampaigns.length
                  ).toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  {(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.openRate || 0), 0) / 
                    selectedCampaigns.length * 100
                  ).toFixed(1)}%
                </td>
                <td className="p-3 text-center">
                  {(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.clickRate || 0), 0) / 
                    selectedCampaigns.length * 100
                  ).toFixed(1)}%
                </td>
                <td className="p-3 text-right">
                  ${Math.round(
                    selectedCampaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0) / 
                    selectedCampaigns.length
                  ).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
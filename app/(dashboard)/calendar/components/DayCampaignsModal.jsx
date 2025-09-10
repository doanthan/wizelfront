"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { format } from 'date-fns';
import { Mail, MessageSquare, Bell, Eye, MousePointer, DollarSign, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoreColor } from '@/lib/calendar-colors';
import { getCampaignMetrics, isCampaignScheduled } from '../utils/calendar-helpers';

export default function DayCampaignsModal({ 
  campaigns, 
  onClose, 
  onSelectCampaign,
  stores 
}) {
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  
  if (!campaigns || campaigns.length === 0) return null;
  
  const date = campaigns[0]?.date ? new Date(campaigns[0].date) : new Date();
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Campaigns for {format(date, 'MMMM d, yyyy')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {campaigns.length} campaign{campaigns.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 overflow-y-auto max-h-[60vh]">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign, idx) => (
                <CampaignCard
                  key={`day-modal-${campaign.id}-${idx}`}
                  campaign={campaign}
                  store={stores.find(s => 
                    s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                  )}
                  onClick={() => {
                    onSelectCampaign(campaign);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <CampaignTable
              campaigns={campaigns}
              stores={stores}
              onSelectCampaign={(campaign) => {
                onSelectCampaign(campaign);
                onClose();
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CampaignCard({ campaign, store, onClick }) {
  const { openRate, clickRate, revenue } = getCampaignMetrics(campaign);
  const isScheduled = isCampaignScheduled(campaign);
  const storeColor = getStoreColor(store?.id || store?._id || campaign.klaviyo_public_id);
  
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all border-l-4 bg-white dark:bg-gray-800",
        storeColor.border.replace('border-', 'border-l-'),
        isScheduled && "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
            {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
            {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600" />}
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{campaign.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{store?.name || 'Unknown Store'}</p>
            </div>
          </div>
          <Badge variant={isScheduled ? 'secondary' : 'default'} className="text-xs">
            {isScheduled ? 'Scheduled' : 'Sent'}
          </Badge>
        </div>
        
        {!isScheduled && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <Eye className="h-3 w-3 mx-auto mb-1 text-blue-600" />
              <div className="text-xs font-medium text-gray-900 dark:text-white">{(openRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Open</div>
            </div>
            <div className="text-center">
              <MousePointer className="h-3 w-3 mx-auto mb-1 text-green-600" />
              <div className="text-xs font-medium text-gray-900 dark:text-white">{(clickRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Click</div>
            </div>
            <div className="text-center">
              <DollarSign className="h-3 w-3 mx-auto mb-1 text-purple-600" />
              <div className="text-xs font-medium text-gray-900 dark:text-white">${revenue.toFixed(0)}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Revenue</div>
            </div>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          {format(new Date(campaign.date), 'h:mm a')}
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignTable({ campaigns, stores, onSelectCampaign }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Campaign</th>
          <th className="text-left p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Store</th>
          <th className="text-center p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Time</th>
          <th className="text-center p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Open Rate</th>
          <th className="text-center p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Click Rate</th>
          <th className="text-right p-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map((campaign, idx) => {
          const store = stores.find(s => 
            s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
          );
          const { openRate, clickRate, revenue } = getCampaignMetrics(campaign);
          const isScheduled = isCampaignScheduled(campaign);
          
          return (
            <tr
              key={`day-table-${campaign.id}-${idx}`}
              className={cn(
                "border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors",
                idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50",
                "hover:bg-sky-50 dark:hover:bg-gray-700"
              )}
              onClick={() => onSelectCampaign(campaign)}
            >
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {campaign.channel === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                  {campaign.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                  {campaign.channel === 'push-notification' && <Bell className="h-4 w-4 text-purple-600" />}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</span>
                  {isScheduled && (
                    <Badge variant="secondary" className="text-xs ml-2">Scheduled</Badge>
                  )}
                </div>
              </td>
              <td className="p-3 text-sm text-gray-900 dark:text-white">{store?.name || 'Unknown'}</td>
              <td className="p-3 text-sm text-center text-gray-900 dark:text-white">
                {format(new Date(campaign.date), 'h:mm a')}
              </td>
              <td className="p-3 text-sm text-center">
                <span className={cn(
                  "font-medium",
                  isScheduled ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
                )}>
                  {isScheduled ? '-' : `${(openRate * 100).toFixed(1)}%`}
                </span>
              </td>
              <td className="p-3 text-sm text-center">
                <span className={cn(
                  "font-medium",
                  isScheduled ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
                )}>
                  {isScheduled ? '-' : `${(clickRate * 100).toFixed(1)}%`}
                </span>
              </td>
              <td className="p-3 text-sm text-right">
                <span className={cn(
                  "font-bold",
                  isScheduled ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
                )}>
                  {isScheduled ? '-' : `$${revenue.toFixed(0)}`}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
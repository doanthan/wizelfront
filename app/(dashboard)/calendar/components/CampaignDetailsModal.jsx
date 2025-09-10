"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { 
  ChevronLeft, Mail, MessageSquare, Bell, Users, Eye, MousePointer, 
  DollarSign, BarChart3, TrendingUp, Activity, Zap, Info, Settings,
  CheckCircle, XCircle, Package, Calendar, AlertCircle, ShoppingCart,
  Target, Clock
} from 'lucide-react';
import { format, getDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmailPreviewPanel } from './EmailPreviewPanel';

export default function CampaignDetailsModal({ 
  campaign, 
  onClose, 
  stores,
  audienceCache = {},
  previousView = 'calendar',
  onBackToDay
}) {
  const [selectedCampaign, setSelectedCampaign] = useState(campaign);
  
  useEffect(() => {
    setSelectedCampaign(campaign);
  }, [campaign]);

  if (!selectedCampaign) return null;

  const store = stores.find(s => 
    s.klaviyo_integration?.public_id === selectedCampaign.klaviyo_public_id
  );

  // Helper function to resolve audience names
  const resolveAudienceNames = (audienceData, klaviyoPublicId) => {
    if (!audienceData || audienceData.length === 0) return [];
    
    // If the audience data already has name and type (from past campaigns), return as is
    if (audienceData[0]?.name && audienceData[0]?.type) {
      return audienceData;
    }
    
    // Otherwise, it's just IDs (future campaigns), so resolve from cache
    const audiences = audienceCache[klaviyoPublicId];
    if (!audiences) return audienceData.map(id => ({ id, name: id, type: 'unknown' }));
    
    return audienceData.map(id => {
      const segment = audiences.segments?.find(s => s.id === id);
      if (segment) return { id, name: segment.name, type: 'segment' };
      
      const list = audiences.lists?.find(l => l.id === id);
      if (list) return { id, name: list.name, type: 'list' };
      
      return { id, name: id, type: 'unknown' };
    });
  };

  const isFutureCampaign = selectedCampaign?.isScheduled || 
                           selectedCampaign?.status === 'Draft' || 
                           selectedCampaign?.status === 'Scheduled' || 
                           selectedCampaign?.status === 'Queued without Recipients';

  return (
    <Dialog 
      open={true} 
      onOpenChange={onClose}
      onEscapeKeyDown={onClose}
    >
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Campaign Details</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 min-h-0">
          {/* Email Preview Panel - Left Side */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    onClose();
                    if (previousView === 'dayModal' && onBackToDay) {
                      onBackToDay();
                    }
                  }}
                  title={previousView === 'dayModal' ? "Back to day view" : "Back to calendar"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {selectedCampaign?.channel === 'email' && <Mail className="h-4 w-4 text-sky-blue" />}
                {selectedCampaign?.channel === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                {selectedCampaign?.channel === 'push-notification' && <Bell className="h-4 w-4 text-vivid-violet" />}
                <h3 className="text-sm font-semibold text-slate-gray dark:text-white">
                  {selectedCampaign?.name}
                </h3>
                <Badge className="text-xs bg-gradient-to-r from-sky-blue to-vivid-violet text-white border-0">
                  {selectedCampaign?.channel?.toUpperCase()}
                </Badge>
                <span className="text-xs text-neutral-gray dark:text-gray-400 ml-auto">
                  {selectedCampaign?.date && (() => {
                    const date = new Date(selectedCampaign.date);
                    const day = getDate(date);
                    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                                  day === 2 || day === 22 ? 'nd' : 
                                  day === 3 || day === 23 ? 'rd' : 'th';
                    const isFuture = selectedCampaign.isScheduled || selectedCampaign.status === 'Draft' || selectedCampaign.status === 'Scheduled';
                    const label = isFuture ? 'Scheduled For' : 'Sent At';
                    return `${label}: ${format(date, `d'${suffix}' MMMM yy HH:mm`)}`;
                  })()}
                </span>
              </div>
              <p className="text-xs text-neutral-gray mt-1">
                {selectedCampaign.subject || 'No subject'}
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden bg-gray-100 dark:bg-gray-950">
              <EmailPreviewPanel 
                messageId={selectedCampaign.messageId} 
                storeId={selectedCampaign.klaviyo_public_id || store?.klaviyo_integration?.public_id || selectedCampaign.storeIds?.[0]}
              />
            </div>
          </div>

          {/* Stats Panel or Audience Info - Right Side */}
          <div className="w-1/2 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            {isFutureCampaign ? (
              /* Future Campaign - Show Audience Info */
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-slate-gray dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky-blue" />
                    Campaign Audience
                  </h3>
                  <p className="text-sm text-neutral-gray mt-1">
                    Segments and lists targeted for this campaign
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Campaign Information */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-sky-blue" />
                        Campaign Information
                      </h4>
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Campaign Name</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedCampaign?.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Status</span>
                            <Badge className={cn(
                              "text-xs",
                              selectedCampaign?.status === 'scheduled' || selectedCampaign?.isScheduled
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            )}>
                              {selectedCampaign?.isScheduled ? 'Scheduled' : selectedCampaign?.status || 'Unknown'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Scheduled Date</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {selectedCampaign?.date ? format(new Date(selectedCampaign.date), 'MMM d, yyyy h:mm a') : 'Not scheduled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Included Audiences */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Included Audiences
                      </h4>
                      <div className="space-y-2">
                        {selectedCampaign?.audiences?.included?.length > 0 ? (
                          resolveAudienceNames(
                            selectedCampaign.audiences.included,
                            selectedCampaign.klaviyo_public_id
                          ).map((audience, index) => (
                            <div key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg p-3 border border-green-200 dark:border-green-800">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-sky-blue" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {audience.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {audience.type === 'segment' ? 'Segment' : audience.type === 'list' ? 'List' : 'ID'} • {audience.id}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    className={cn(
                                      "text-xs border-0",
                                      audience.type === 'segment' 
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                                        : audience.type === 'list'
                                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                    )}
                                  >
                                    {audience.type === 'segment' ? 'Segment' : audience.type === 'list' ? 'List' : 'Unknown'}
                                  </Badge>
                                  <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0">
                                    Included
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No audiences selected
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Excluded Audiences */}
                    {selectedCampaign?.audiences?.excluded?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Excluded Audiences
                        </h4>
                        <div className="space-y-2">
                          {resolveAudienceNames(
                            selectedCampaign.audiences.excluded,
                            selectedCampaign.klaviyo_public_id
                          ).map((audience, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-900/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-red-600" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {audience.name}
                                    </span>
                                    {audience.type !== 'unknown' && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {audience.type === 'segment' ? 'Segment' : 'List'} • {audience.id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={audience.type === 'segment' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {audience.type === 'segment' ? 'Segment' : audience.type === 'list' ? 'List' : 'Unknown'}
                                  </Badge>
                                  <Badge variant="destructive" className="text-xs">
                                    Excluded
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Campaign Settings */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        Campaign Settings
                      </h4>
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Channel</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {selectedCampaign?.channel || 'email'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">From Address</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedCampaign?.fromAddress ? (
                              selectedCampaign.fromLabel ? 
                                `${selectedCampaign.fromLabel} <${selectedCampaign.fromAddress}>` : 
                                selectedCampaign.fromAddress
                            ) : 'Not specified'}
                          </span>
                        </div>
                        {selectedCampaign?.tags?.length > 0 && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Tags</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedCampaign.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Past Campaign - Show Stats */
              <Tabs defaultValue="overview" className="flex flex-col h-full">
                <TabsList className="w-full px-6 py-3 bg-transparent border-b border-gray-200 dark:border-gray-700 flex justify-start gap-8 rounded-none flex-shrink-0">
                  <TabsTrigger 
                    value="overview" 
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-sky-blue dark:data-[state=active]:text-sky-blue data-[state=active]:border-sky-blue dark:data-[state=active]:border-sky-blue hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="performance" 
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-sky-blue dark:data-[state=active]:text-sky-blue data-[state=active]:border-sky-blue dark:data-[state=active]:border-sky-blue hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger 
                    value="engagement" 
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-sky-blue dark:data-[state=active]:text-sky-blue data-[state=active]:border-sky-blue dark:data-[state=active]:border-sky-blue hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Engagement
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="space-y-3">
                    {/* Primary Performance Metrics */}
                    <div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-sky-blue/30 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-slate-gray dark:text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-sky-blue" />
                        Campaign Performance
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Recipients */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-gray">Recipients</span>
                            <Users className="h-3.5 w-3.5 text-sky-blue" />
                          </div>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            {(selectedCampaign.performance?.recipients || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-gray mt-1">
                            {((selectedCampaign.performance?.delivered || selectedCampaign.performance?.recipients || 0) / (selectedCampaign.performance?.recipients || 1) * 100).toFixed(0)}% delivered
                          </p>
                        </div>

                        {/* Open Rate */}
                        {selectedCampaign?.channel !== 'sms' && (
                          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-neutral-gray">Open Rate</span>
                              <Eye className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <p className="text-xl font-bold text-slate-gray dark:text-white">
                              {((selectedCampaign.performance?.openRate || 0) * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-neutral-gray mt-1">
                              {(selectedCampaign.performance?.opensUnique || 0).toLocaleString()} opens
                            </p>
                          </div>
                        )}

                        {/* Click Rate */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-gray">Click Rate</span>
                            <MousePointer className="h-3.5 w-3.5 text-vivid-violet" />
                          </div>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            {((selectedCampaign.performance?.clickRate || 0) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-neutral-gray mt-1">
                            {(selectedCampaign.performance?.clicksUnique || 0).toLocaleString()} clicks
                          </p>
                        </div>

                        {/* CTOR - Click to Open Rate */}
                        {selectedCampaign?.channel !== 'sms' && selectedCampaign.performance?.opensUnique > 0 && (
                          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-neutral-gray">CTOR</span>
                              <Zap className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <p className="text-xl font-bold text-slate-gray dark:text-white">
                              {((selectedCampaign.performance?.clicksUnique || 0) / (selectedCampaign.performance?.opensUnique || 1) * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-neutral-gray mt-1">
                              Click-to-open
                            </p>
                          </div>
                        )}

                        {/* Conversion Rate */}
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-gray">Conv. Rate</span>
                            <ShoppingCart className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            {((selectedCampaign.performance?.conversionRate || 0) * 100).toFixed(2)}%
                          </p>
                          <p className="text-xs text-neutral-gray mt-1">
                            {selectedCampaign.performance?.conversions || 0} orders
                          </p>
                        </div>

                        {/* Placeholder for SMS to balance grid */}
                        {selectedCampaign?.channel === 'sms' && (
                          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-neutral-gray">Delivered</span>
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <p className="text-xl font-bold text-slate-gray dark:text-white">
                              {(selectedCampaign.performance?.delivered || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-gray mt-1">
                              Messages sent
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Revenue Metrics */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-emerald-500/30 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-slate-gray dark:text-white mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Revenue Metrics
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                          <span className="text-xs text-neutral-gray block mb-1">Total Revenue</span>
                          <p className="text-lg font-bold text-emerald-600">
                            ${(selectedCampaign.performance?.revenue || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                          <span className="text-xs text-neutral-gray block mb-1">AOV</span>
                          <p className="text-lg font-bold text-slate-gray dark:text-white">
                            ${selectedCampaign.performance?.averageOrderValue?.toFixed(2) || 
                              (selectedCampaign.performance?.conversions > 0 
                                ? (selectedCampaign.performance.revenue / selectedCampaign.performance.conversions).toFixed(2)
                                : '0.00')}
                          </p>
                        </div>
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                          <span className="text-xs text-neutral-gray block mb-1">Rev/Recipient</span>
                          <p className="text-lg font-bold text-slate-gray dark:text-white">
                            ${selectedCampaign.performance?.revenuePerRecipient?.toFixed(2) ||
                              (selectedCampaign.performance?.recipients > 0 
                                ? (selectedCampaign.performance.revenue / selectedCampaign.performance.recipients).toFixed(2)
                                : '0.00')}
                          </p>
                        </div>
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-3">
                          <span className="text-xs text-neutral-gray block mb-1">Total Orders</span>
                          <p className="text-lg font-bold text-slate-gray dark:text-white">
                            {(selectedCampaign.performance?.conversions || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Audiences Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-slate-gray dark:text-white mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-sky-blue" />
                        Target Audiences
                      </h3>
                      
                      {/* Included Audiences */}
                      {selectedCampaign?.audiences?.included?.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 mb-2">
                            <CheckCircle className="h-3 w-3" />
                            INCLUDED
                          </span>
                          <div className="space-y-1.5">
                            {resolveAudienceNames(
                              selectedCampaign.audiences.included,
                              selectedCampaign.klaviyo_public_id
                            ).map((audience, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <Badge 
                                  className={cn(
                                    "text-xs border-0",
                                    audience.type === 'segment' 
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" 
                                      : audience.type === 'list'
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  )}
                                >
                                  {audience.type === 'segment' ? 'Segment' : audience.type === 'list' ? 'List' : 'Unknown'}
                                </Badge>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{audience.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Excluded Audiences */}
                      {selectedCampaign?.audiences?.excluded?.length > 0 && (
                        <div>
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mb-2">
                            <XCircle className="h-3 w-3" />
                            EXCLUDED
                          </span>
                          <div className="space-y-1.5">
                            {resolveAudienceNames(
                              selectedCampaign.audiences.excluded,
                              selectedCampaign.klaviyo_public_id
                            ).map((audience, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <Badge 
                                  className={cn(
                                    "text-xs border-0",
                                    audience.type === 'segment' 
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" 
                                      : audience.type === 'list'
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  )}
                                >
                                  {audience.type === 'segment' ? 'Segment' : audience.type === 'list' ? 'List' : 'Unknown'}
                                </Badge>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{audience.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!selectedCampaign?.audiences?.included?.length && !selectedCampaign?.audiences?.excluded?.length) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No audience information available
                        </p>
                      )}
                    </div>

                    {/* Delivery Performance */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-sky-blue" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Delivery Performance</h3>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-gray">Delivery Rate</span>
                          <span className="font-semibold text-slate-gray dark:text-white">
                            {((((selectedCampaign.performance?.delivered || selectedCampaign.performance?.recipients || 0) / (selectedCampaign.performance?.recipients || 1))) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={((selectedCampaign.performance?.delivered || selectedCampaign.performance?.recipients || 0) / (selectedCampaign.performance?.recipients || 1)) * 100}
                          className="h-1.5"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">
                            {(selectedCampaign.performance?.bounced || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Bounced</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {(selectedCampaign.performance?.failed || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">
                            {(selectedCampaign.performance?.unsubscribes || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Unsubs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-600">
                            {(selectedCampaign.performance?.spamComplaints || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-gray">Spam</div>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Score */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-vivid-violet" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Engagement Score</h3>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="ml-auto">
                              <Info className="h-3.5 w-3.5 text-gray-400 hover:text-sky-blue transition-colors" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <p className="font-semibold mb-1">Engagement Score Calculation:</p>
                              <ul className="space-y-1">
                                <li>• Open Rate: 40% weight</li>
                                <li>• Click Rate: 30% weight</li>
                                <li>• Conversion Rate: 30% weight</li>
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {(() => {
                        const openScore = (selectedCampaign.performance?.openRate || 0) * 0.4;
                        const clickScore = (selectedCampaign.performance?.clickRate || 0) * 0.3;
                        const conversionScore = (selectedCampaign.performance?.conversionRate || 0) * 0.3;
                        const totalScore = (openScore + clickScore + conversionScore) * 100;
                        
                        return (
                          <>
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-neutral-gray">Overall Score</span>
                                <span className={cn(
                                  "font-semibold",
                                  totalScore >= 15 ? "text-green-600" : 
                                  totalScore >= 8 ? "text-yellow-600" : "text-red-600"
                                )}>
                                  {totalScore.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={Math.min(totalScore, 100)}
                                className={cn(
                                  "h-2",
                                  totalScore >= 15 ? "[&>div]:bg-green-600" : 
                                  totalScore >= 8 ? "[&>div]:bg-yellow-600" : "[&>div]:bg-red-600"
                                )}
                              />
                            </div>
                            
                            <div className="text-xs text-center">
                              <Badge 
                                variant={totalScore >= 15 ? "success" : totalScore >= 8 ? "warning" : "destructive"}
                                className="text-xs"
                              >
                                {totalScore >= 15 ? "Excellent" : totalScore >= 8 ? "Good" : "Needs Improvement"}
                              </Badge>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="space-y-4">
                    {/* Revenue Metrics */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Revenue Metrics</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Total Revenue</p>
                          <p className="text-2xl font-bold text-emerald-600">
                            ${(selectedCampaign.performance?.revenue || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Total Orders</p>
                          <p className="text-2xl font-bold text-slate-gray dark:text-white">
                            {(selectedCampaign.performance?.conversions || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Avg Order Value</p>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            ${(selectedCampaign.performance?.conversions > 0 
                              ? (selectedCampaign.performance.revenue / selectedCampaign.performance.conversions).toFixed(2)
                              : 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Revenue per Recipient</p>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            ${(selectedCampaign.performance?.recipients > 0 
                              ? (selectedCampaign.performance.revenue / selectedCampaign.performance.recipients).toFixed(2)
                              : 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-neutral-gray">Conversion Rate</span>
                          <span className="font-semibold text-slate-gray dark:text-white">
                            {((selectedCampaign.performance?.conversionRate || 0) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <Progress
                          value={(selectedCampaign.performance?.conversionRate || 0) * 100}
                          className="h-2 [&>div]:bg-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Conversion Funnel */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-4 w-4 text-sky-blue" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Conversion Funnel</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { 
                            label: 'Delivered', 
                            value: selectedCampaign.performance?.delivered || selectedCampaign.performance?.recipients || 0,
                            percent: 100
                          },
                          { 
                            label: 'Opened', 
                            value: selectedCampaign.performance?.opensUnique || 0,
                            percent: ((selectedCampaign.performance?.openRate || 0) * 100)
                          },
                          { 
                            label: 'Clicked', 
                            value: selectedCampaign.performance?.clicksUnique || 0,
                            percent: ((selectedCampaign.performance?.clickRate || 0) * 100)
                          },
                          { 
                            label: 'Converted', 
                            value: selectedCampaign.performance?.conversions || 0,
                            percent: ((selectedCampaign.performance?.conversionRate || 0) * 100)
                          }
                        ].map((stage, index) => (
                          <div key={index} className="relative">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-neutral-gray">{stage.label}</span>
                              <span className="font-semibold text-slate-gray dark:text-white">
                                {stage.value.toLocaleString()} ({stage.percent.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress
                              value={stage.percent}
                              className="h-6"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Engagement Tab */}
                <TabsContent value="engagement" className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="space-y-4">
                    {/* Click Performance */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <MousePointer className="h-4 w-4 text-vivid-violet" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Click Performance</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Total Clicks</p>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            {(selectedCampaign.performance?.clicksTotal || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Unique Clicks</p>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            {(selectedCampaign.performance?.clicksUnique || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Click Rate</p>
                          <p className="text-xl font-bold text-vivid-violet">
                            {((selectedCampaign.performance?.clickRate || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-gray mb-1">Click-to-Open Rate</p>
                          <p className="text-xl font-bold text-slate-gray dark:text-white">
                            {selectedCampaign.performance?.opensUnique > 0 
                              ? ((selectedCampaign.performance.clicksUnique / selectedCampaign.performance.opensUnique) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-4 w-4 text-gray-600" />
                        <h3 className="text-sm font-semibold text-slate-gray dark:text-white">Additional Metrics</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-neutral-gray mb-1">Unsubscribe Rate</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {selectedCampaign.performance?.recipients > 0 
                              ? ((selectedCampaign.performance?.unsubscribes / selectedCampaign.performance.recipients) * 100).toFixed(2)
                              : 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-gray mb-1">Spam Complaint Rate</p>
                          <p className="text-lg font-bold text-red-600">
                            {selectedCampaign.performance?.recipients > 0 
                              ? ((selectedCampaign.performance?.spamComplaints / selectedCampaign.performance.recipients) * 100).toFixed(3)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
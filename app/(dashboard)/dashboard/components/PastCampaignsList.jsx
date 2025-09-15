"use client";

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Bell, Calendar, TrendingUp, Eye, MousePointer, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

export const PastCampaignsList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchPastCampaigns();
  }, []);

  const fetchPastCampaigns = async () => {
    try {
      setLoading(true);
      
      // Fetch stores first
      const storesResponse = await fetch('/api/stores/analytics-access');
      const storesData = await storesResponse.json();
      setStores(storesData.stores || []);

      // Calculate date range for past 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Fetch campaigns
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/calendar/campaigns/past?${params}`);
      const data = await response.json();
      
      if (data.campaigns) {
        // Sort by date and take the 20 most recent
        const sortedCampaigns = data.campaigns
          .sort((a, b) => new Date(b.send_time || b.date) - new Date(a.send_time || a.date))
          .slice(0, 20);
        
        setCampaigns(sortedCampaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel?.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'push-notification':
        return <Bell className="h-4 w-4 text-purple-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStoreName = (campaign) => {
    const store = stores?.find(s => 
      s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
    );
    return store?.name || 'Unknown Store';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue"></div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Past Campaign Deliveries
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No campaigns found for the past 30 days.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-sky-blue" />
        Past 20 Campaign Deliveries & Stats
      </h3>
      
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const openRate = campaign.openRate || 0;
          const clickRate = campaign.clickRate || 0;
          const revenue = campaign.revenue || 0;
          const recipients = campaign.recipients || 0;
          const conversionRate = campaign.conversionRate || 0;
          
          return (
            <div 
              key={campaign._id || campaign.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getChannelIcon(campaign.groupings?.send_channel || campaign.channel)}
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                      {campaign.campaign_name || campaign.name || 'Unnamed Campaign'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(campaign.send_time || campaign.date)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                      {getStoreName(campaign)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recipients</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    {formatNumber(recipients)}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Open Rate</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <Eye className="h-3 w-3 text-green-500" />
                    {formatPercentage(openRate)}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Click Rate</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <MousePointer className="h-3 w-3 text-vivid-violet" />
                    {formatPercentage(clickRate)}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Revenue</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-orange-500" />
                    {formatCurrency(revenue)}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conv. Rate</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPercentage(conversionRate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
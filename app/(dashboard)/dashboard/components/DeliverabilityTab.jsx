"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { MultiSelect } from '@/app/components/ui/multi-select';
import CampaignDetailsModal from './CampaignDetailsModal';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import LoadingSpinner from '@/app/components/ui/loading-spinner';
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Activity,
  BarChart3,
  Search,
  MessageSquare,
  Bell,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { formatNumber, formatPercentage } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Bell curve distribution function for color coding rates
const getColorForRate = (value, rateType, channel = 'Email') => {
    if (value === null || value === undefined || isNaN(value)) {
        return "text-gray-500 bg-gray-50"
    }
    
    // Special handling for SMS metrics
    if (channel && channel.toLowerCase() === 'sms') {
        switch (rateType) {
            case 'open':
                // SMS doesn't track opens, so 0% is normal - show as gray
                return "text-gray-500 bg-gray-50"
            case 'click':
                // SMS click rates are much higher than email
                if (value >= 15) return "text-green-800 bg-green-50 font-medium"
                else if (value >= 8) return "text-orange-800 bg-orange-50 font-medium"
                else return "text-red-800 bg-red-50 font-medium"
            case 'clickToOpen':
                // CTOR doesn't apply to SMS since we can't track opens
                return "text-gray-500 bg-gray-50"
            case 'delivery':
                // SMS delivery is similar to email
                if (value >= 97) return "text-green-800 bg-green-50 font-medium"
                else if (value >= 95) return "text-orange-800 bg-orange-50 font-medium"
                else return "text-red-800 bg-red-50 font-medium"
            // Other metrics use same logic as email
        }
    }

    let mean, stdDev, isInverse = false
    
    // Define bell curve parameters for different rate types (email)
    switch (rateType) {
        case 'delivery':
            mean = 98.5  // 98.5% is excellent delivery
            stdDev = 2.5
            break
        case 'open':
            mean = 25    // 25% is good open rate
            stdDev = 8
            break
        case 'click':
            mean = 3.5   // 3.5% is good click rate for email
            stdDev = 2
            break
        case 'clickToOpen':
            mean = 15    // 15% is good click-to-open rate
            stdDev = 7
            break
        case 'bounce':
            mean = 2     // 2% bounce rate (lower is better)
            stdDev = 2
            isInverse = true
            break
        case 'spam':
            mean = 0.1   // 0.1% spam rate (lower is better)
            stdDev = 0.3
            isInverse = true
            break
        case 'unsubscribe':
            mean = 0.5   // 0.5% unsubscribe rate (lower is better)
            stdDev = 0.8
            isInverse = true
            break
        case 'conversion':
            mean = 2.5   // 2.5% conversion rate
            stdDev = 2
            break
        default:
            return "text-gray-900 bg-white"
    }

    // Calculate standard deviations from mean
    const deviation = Math.abs(value - mean) / stdDev
    
    // For inverse metrics (bounce, spam, unsubscribe), flip the logic
    let score
    if (isInverse) {
        // For inverse metrics, values closer to 0 are better
        if (value <= mean) {
            score = 1 - (value / mean) * 0.3  // 0.7 to 1.0 for values at or below mean
        } else {
            score = Math.max(0, 0.7 - (deviation * 0.35))  // Decrease score for values above mean
        }
    } else {
        // For normal metrics, values closer to mean are better
        if (deviation <= 1) {
            score = 1 - (deviation * 0.3)  // 0.7 to 1.0 for within 1 std dev
        } else if (deviation <= 2) {
            score = 0.7 - ((deviation - 1) * 0.35)  // 0.35 to 0.7 for 1-2 std dev
        } else {
            score = Math.max(0, 0.35 - ((deviation - 2) * 0.175))  // 0 to 0.35 for 2+ std dev
        }
    }

    // Convert score to color classes
    if (score >= 0.7) {
        return "text-green-800 bg-green-50 font-medium"  // Green for excellent
    } else if (score >= 0.35) {
        return "text-orange-800 bg-orange-50 font-medium"  // Orange for moderate
    } else {
        return "text-red-800 bg-red-50 font-medium"  // Red for poor
    }
}

export default function DeliverabilityTab({ 
  selectedAccounts, 
  stores,
  campaignsData,
  campaignsLoading,
  campaignsError
}) {
  const [selectedMetric, setSelectedMetric] = useState('delivered');
  const [sortField, setSortField] = useState('send_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedSegments, setSelectedSegments] = useState([{ value: 'all', label: 'All Segments' }]);
  const [selectedTags, setSelectedTags] = useState([{ value: 'all', label: 'All Tags' }]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Transform campaign data for deliverability view
  const campaigns = useMemo(() => {
    if (!campaignsData?.campaigns || campaignsData.campaigns.length === 0) {
      return [];
    }
    
    // Use all campaigns passed from parent (already filtered by date range)
    const filteredCampaigns = campaignsData.campaigns;
    
    // Transform campaign data for deliverability metrics
    const campaignsWithDeliverability = filteredCampaigns.map(campaign => ({
      campaign_name: campaign.name,
      send_date: campaign.sentAt,
      recipients: campaign.recipients || 0,
      delivered: campaign.delivered || (campaign.recipients - (campaign.bounced || 0)),
      bounced: campaign.bounced || 0,
      spamReports: campaign.spamComplaints || 0,
      unsubscribed: campaign.unsubscribes || 0,
      bounceRate: campaign.bounceRate || 0,
      deliveryRate: campaign.deliveryRate || ((campaign.delivered || campaign.recipients - campaign.bounced) / campaign.recipients * 100),
      spamComplaintRate: campaign.spamComplaintRate || 0,
      unsubscribeRate: campaign.unsubscribeRate || 0,
      openRate: campaign.openRate || 0,
      clickRate: campaign.clickRate || 0,
      ctor: (campaign.opensUnique && campaign.opensUnique > 0) 
        ? (campaign.clicksUnique / campaign.opensUnique) * 100 
        : 0,
      conversionRate: campaign.conversionRate || 0,
      revenuePerRecipient: campaign.revenuePerRecipient || 0,
      type: campaign.type || 'email',
      includedAudiences: campaign.includedAudiences || [],
      tagNames: campaign.tagNames || []
    }));
    
    // Apply filters
    let filtered = campaignsWithDeliverability;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Channel filter
    if (selectedChannel && selectedChannel !== 'all') {
      filtered = filtered.filter(campaign => 
        campaign.type?.toLowerCase() === selectedChannel.toLowerCase()
      );
    }
    
    // Segment/Audience filter (multi-select)
    if (selectedSegments && selectedSegments.length > 0) {
      // Check if "all" is selected
      const hasViewAll = selectedSegments.some(s => s.value === 'all');
      if (!hasViewAll) {
        filtered = filtered.filter(campaign => 
          campaign.includedAudiences?.some(audience => 
            selectedSegments.some(selected => 
              selected.value === audience.name?.toLowerCase()
            )
          )
        );
      }
    }
    
    // Tag filter (multi-select)
    if (selectedTags && selectedTags.length > 0) {
      // Check if "all" is selected
      const hasViewAll = selectedTags.some(t => t.value === 'all');
      if (!hasViewAll) {
        filtered = filtered.filter(campaign => 
          campaign.tagNames?.some(tag => 
            selectedTags.some(selected => 
              selected.value === tag?.toLowerCase()
            )
          )
        );
      }
    }
    
    // Sort campaigns
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch(sortField) {
        case 'campaign_name':
          aVal = a.campaign_name || '';
          bVal = b.campaign_name || '';
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        case 'send_date':
          aVal = new Date(a.send_date).getTime();
          bVal = new Date(b.send_date).getTime();
          break;
        case 'recipients':
          aVal = a.recipients || 0;
          bVal = b.recipients || 0;
          break;
        case 'deliveryRate':
          aVal = a.deliveryRate || 0;
          bVal = b.deliveryRate || 0;
          break;
        case 'bounceRate':
          aVal = a.bounceRate || 0;
          bVal = b.bounceRate || 0;
          break;
        case 'spamComplaintRate':
          aVal = a.spamComplaintRate || 0;
          bVal = b.spamComplaintRate || 0;
          break;
        case 'unsubscribeRate':
          aVal = a.unsubscribeRate || 0;
          bVal = b.unsubscribeRate || 0;
          break;
        case 'openRate':
          aVal = a.openRate || 0;
          bVal = b.openRate || 0;
          break;
        case 'clickRate':
          aVal = a.clickRate || 0;
          bVal = b.clickRate || 0;
          break;
        case 'ctor':
          aVal = a.ctor || 0;
          bVal = b.ctor || 0;
          break;
        case 'conversionRate':
          aVal = a.conversionRate || 0;
          bVal = b.conversionRate || 0;
          break;
        case 'revenuePerRecipient':
          aVal = a.revenuePerRecipient || 0;
          bVal = b.revenuePerRecipient || 0;
          break;
        default:
          aVal = new Date(a.send_date).getTime();
          bVal = new Date(b.send_date).getTime();
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    console.log('Transformed deliverability campaigns:', sorted);
    return sorted;
  }, [campaignsData, sortField, sortDirection, searchTerm, selectedChannel, selectedSegments, selectedTags]);
  
  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calculate deliverability metrics
  const deliverabilityMetrics = useMemo(() => {
    console.log('Calculating metrics for campaigns:', campaigns);
    if (!campaigns.length) return null;

    const totalSent = campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered || 0), 0);
    const totalBounced = campaigns.reduce((sum, c) => sum + (c.bounced || 0), 0);
    const totalSpamReports = campaigns.reduce((sum, c) => sum + (c.spamReports || 0), 0);
    const totalUnsubscribes = campaigns.reduce((sum, c) => sum + (c.unsubscribed || 0), 0);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const spamRate = totalDelivered > 0 ? (totalSpamReports / totalDelivered) * 100 : 0;
    const unsubscribeRate = totalDelivered > 0 ? (totalUnsubscribes / totalDelivered) * 100 : 0;

    return {
      deliveryRate,
      bounceRate,
      spamRate,
      unsubscribeRate,
      totalSent,
      totalDelivered,
      totalBounced,
      totalSpamReports,
      totalUnsubscribes
    };
  }, [campaigns]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!campaigns.length) return [];

    // Group campaigns by date
    const groupedByDate = campaigns.reduce((acc, campaign) => {
      const date = new Date(campaign.send_date).toISOString().split('T')[0]; // Use ISO date format for better sorting
      if (!acc[date]) {
        acc[date] = {
          date,
          sent: 0,
          delivered: 0,
          bounced: 0,
          spamReports: 0,
          unsubscribed: 0
        };
      }
      acc[date].sent += campaign.recipients || 0;
      acc[date].delivered += campaign.delivered || 0;
      acc[date].bounced += campaign.bounced || 0;
      acc[date].spamReports += campaign.spamReports || 0;
      acc[date].unsubscribed += campaign.unsubscribed || 0;
      return acc;
    }, {});

    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date
      .map(day => ({
        ...day,
        deliveryRate: day.sent > 0 ? parseFloat(((day.delivered / day.sent) * 100).toFixed(2)) : 0,
        bounceRate: day.sent > 0 ? parseFloat(((day.bounced / day.sent) * 100).toFixed(2)) : 0,
        spamRate: day.delivered > 0 ? parseFloat(((day.spamReports / day.delivered) * 100).toFixed(2)) : 0,
        unsubscribeRate: day.delivered > 0 ? parseFloat(((day.unsubscribed / day.delivered) * 100).toFixed(2)) : 0
      }));
  }, [campaigns]);

  // Get health score and status
  const getHealthScore = (metrics) => {
    if (!metrics) return { score: 0, status: 'unknown', color: 'gray' };
    
    let score = 100;
    
    // Deduct points based on metrics
    if (metrics.deliveryRate < 95) score -= 20;
    if (metrics.bounceRate > 5) score -= 25;
    if (metrics.spamRate > 0.1) score -= 30;
    if (metrics.unsubscribeRate > 2) score -= 15;
    
    if (score >= 90) return { score, status: 'Excellent', color: 'green' };
    if (score >= 75) return { score, status: 'Good', color: 'blue' };
    if (score >= 60) return { score, status: 'Fair', color: 'yellow' };
    return { score, status: 'Poor', color: 'red' };
  };

  const healthScore = getHealthScore(deliverabilityMetrics);

  if (campaignsLoading) {
    return <LoadingSpinner message="Loading deliverability data..." />;
  }
  
  if (campaignsError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Error loading deliverability data</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{campaignsError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    console.log('No campaigns to display, campaigns:', campaigns);
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Mail className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No deliverability data available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {selectedAccounts && selectedAccounts.length > 0 
              ? 'No campaign data found for the selected date range'
              : 'Select accounts to view deliverability metrics'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title */}
      <div className="px-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Deliverability metrics and campaign performance
        </h2>
      </div>

      {/* Top Metrics Cards - matching the design */}
      <div className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Sent Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sent</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(deliverabilityMetrics.totalSent)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatNumber(0)} previous
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaignsData?.campaigns?.length || campaigns.length}
              </p>
              <p className="text-xs text-gray-500">
                vs. {0} previous
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(deliverabilityMetrics.deliveryRate)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatPercentage(0)} previous
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Delivered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(deliverabilityMetrics.totalDelivered)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatNumber(0)} previous
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bounce Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bounce Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(deliverabilityMetrics.bounceRate)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatPercentage(0)} previous
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bounced</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(deliverabilityMetrics.totalBounced)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatNumber(0)} previous
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Spam Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Spam Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(deliverabilityMetrics.spamRate)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatPercentage(0)} previous
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Spam Complaints</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(deliverabilityMetrics.totalSpamReports)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatNumber(0)} previous
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unsubscribe Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unsubscribe Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(deliverabilityMetrics.unsubscribeRate)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatPercentage(0)} previous
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unsubscribes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(deliverabilityMetrics.totalUnsubscribes)}
              </p>
              <p className="text-xs text-gray-500">
                vs. {formatNumber(0)} previous
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="px-6">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Deliverability Trends</h3>
              <p className="text-sm text-gray-500 mt-1">Track deliverability metrics over time</p>
            </div>
            <Select value="daily" onValueChange={() => {}}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Daily" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '6px'
                }}
                formatter={(value, name) => [`${value}%`, name]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              
              {/* Bounce Rate - Red */}
              <Line 
                type="monotone" 
                dataKey="bounceRate" 
                stroke="#ef4444" 
                name="Bounce Rate"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              />
              
              {/* Spam Rate - Orange */}
              <Line 
                type="monotone" 
                dataKey="spamRate" 
                stroke="#f59e0b" 
                name="Spam Rate"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              />
              
              {/* Unsubscribe Rate - Purple */}
              <Line 
                type="monotone" 
                dataKey="unsubscribeRate" 
                stroke="#8b5cf6" 
                name="Unsubscribe Rate"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
        </Card>
      </div>

      {/* Campaign Deliverability Details Table */}
      <div className="mx-2">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Search and Filters Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaign names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-sky-blue focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Channel:</span>
            <Button 
              variant="ghost"
              className={`h-8 px-3 text-sm ${selectedChannel === 'all' ? 'bg-sky-blue text-white hover:bg-royal-blue' : ''}`}
              onClick={() => setSelectedChannel('all')}
            >
              All
            </Button>
            <Button 
              variant="ghost"
              className={`h-8 px-3 text-sm flex items-center gap-1 ${selectedChannel === 'email' ? 'bg-sky-blue text-white hover:bg-royal-blue' : ''}`}
              onClick={() => setSelectedChannel('email')}
            >
              <Mail className="h-3 w-3" />
              Email
            </Button>
            <Button 
              variant="ghost"
              className={`h-8 px-3 text-sm flex items-center gap-1 ${selectedChannel === 'sms' ? 'bg-sky-blue text-white hover:bg-royal-blue' : ''}`}
              onClick={() => setSelectedChannel('sms')}
            >
              <MessageSquare className="h-3 w-3" />
              SMS
            </Button>
            <Button 
              variant="ghost"
              className={`h-8 px-3 text-sm flex items-center gap-1 ${selectedChannel === 'push' ? 'bg-sky-blue text-white hover:bg-royal-blue' : ''}`}
              onClick={() => setSelectedChannel('push')}
            >
              <Bell className="h-3 w-3" />
              Push
            </Button>
          </div>
          
          {/* Segment Filter - Multi-select */}
          <MultiSelect
            options={[
              { value: 'all', label: 'All Segments' },
              ...[...new Set(
                campaignsData?.campaigns?.flatMap(c => 
                  c.includedAudiences?.map(a => a.name)
                ).filter(Boolean) || []
              )].map(audienceName => ({
                value: audienceName.toLowerCase(),
                label: audienceName
              }))
            ]}
            value={selectedSegments}
            onChange={setSelectedSegments}
            placeholder="Filter by segments..."
            className="w-[200px]"
          />
          
          {/* Tag Filter - Multi-select */}
          <MultiSelect
            options={[
              { value: 'all', label: 'All Tags' },
              ...[...new Set(
                campaignsData?.campaigns?.flatMap(c => c.tagNames || []).filter(Boolean) || []
              )].map(tagName => ({
                value: tagName.toLowerCase(),
                label: tagName
              }))
            ]}
            value={selectedTags}
            onChange={setSelectedTags}
            placeholder="Filter by tags..."
            className="w-[200px]"
          />
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {campaigns.length} campaigns
          </div>
        </div>

        {/* Table */}
        <div className="w-full">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th 
                  className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('campaign_name')}
                >
                  <div className="flex items-center gap-1">
                    Campaign Name
                    {sortField === 'campaign_name' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('send_date')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Send Date
                    {sortField === 'send_date' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs">
                  Account
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('recipients')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Recipients
                    {sortField === 'recipients' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('deliveryRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Delivery Rate
                    {sortField === 'deliveryRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('openRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Open Rate
                    {sortField === 'openRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('clickRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Click Rate
                    {sortField === 'clickRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('ctor')}
                >
                  <div className="flex items-center justify-center gap-1">
                    CTOR
                    {sortField === 'ctor' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('bounceRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Bounce Rate
                    {sortField === 'bounceRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('spamComplaintRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Spam Rate
                    {sortField === 'spamComplaintRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('unsubscribeRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Unsubscribe
                    {sortField === 'unsubscribeRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('conversionRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Conv. Rate
                    {sortField === 'conversionRate' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-center py-2 px-1 font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('revenuePerRecipient')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Revenue/ Recipient
                    {sortField === 'revenuePerRecipient' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map((campaign, index) => {
                const deliveryRate = campaign.deliveryRate || 0;
                const bounceRate = campaign.bounceRate || 0;
                const spamRate = campaign.spamComplaintRate || 0;
                const unsubscribeRate = campaign.unsubscribeRate || 0;

                return (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      // Prepare campaign data with deliverability focus
                      const campaignWithDetails = {
                        ...campaign,
                        showDeliveryFocus: true,
                        opensUnique: campaign.openRate * campaign.delivered / 100,
                        clicksUnique: campaign.clickRate * campaign.delivered / 100,
                        conversions: campaign.conversionRate * campaign.delivered / 100,
                        revenue: campaign.revenuePerRecipient * campaign.recipients,
                        failed: 0 // Add if available from your data
                      };
                      setSelectedCampaign(campaignWithDetails);
                      setIsModalOpen(true);
                    }}
                  >
                    {/* Campaign Name */}
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white text-xs truncate max-w-[200px] block" title={campaign.campaign_name || 'Untitled'}>
                          {campaign.campaign_name || 'Untitled'}
                        </span>
                      </div>
                    </td>
                    
                    {/* Send Date */}
                    <td className="text-center py-2 px-1 text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(campaign.send_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </td>
                    
                    {/* Account */}
                    <td className="text-center py-2 px-1">
                      <span className="px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        Main Store
                      </span>
                    </td>
                    
                    {/* Recipients */}
                    <td className="text-center py-2 px-1 text-gray-900 dark:text-white text-xs">
                      {formatNumber(campaign.recipients)}
                    </td>
                    
                    {/* Delivery Rate */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(deliveryRate, 'delivery', campaign.type)}`}>
                        {formatPercentage(deliveryRate)}
                      </span>
                    </td>
                    
                    {/* Open Rate */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(campaign.openRate, 'open', campaign.type)}`}>
                        {formatPercentage(campaign.openRate)}
                      </span>
                    </td>
                    
                    {/* Click Rate */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(campaign.clickRate, 'click', campaign.type)}`}>
                        {formatPercentage(campaign.clickRate)}
                      </span>
                    </td>
                    
                    {/* CTOR */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(campaign.ctor, 'clickToOpen', campaign.type)}`}>
                        {formatPercentage(campaign.ctor)}
                      </span>
                    </td>
                    
                    {/* Bounce Rate */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(bounceRate, 'bounce', campaign.type)}`}>
                        {formatPercentage(bounceRate)}
                      </span>
                    </td>
                    
                    {/* Spam Rate */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(spamRate, 'spam', campaign.type)}`}>
                        {formatPercentage(spamRate)}
                      </span>
                    </td>
                    
                    {/* Unsubscribe Rate */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(unsubscribeRate, 'unsubscribe', campaign.type)}`}>
                        {formatPercentage(unsubscribeRate)}
                      </span>
                    </td>
                    
                    {/* Conversion Rate */}
                    <td className="text-center py-2 px-1">
                      <span className={`px-2 py-1 rounded text-xs ${getColorForRate(campaign.conversionRate, 'conversion', campaign.type)}`}>
                        {formatPercentage(campaign.conversionRate)}
                      </span>
                    </td>
                    
                    {/* Revenue per Recipient */}
                    <td className="text-center py-2 px-1 text-gray-900 dark:text-white text-xs">
                      ${campaign.revenuePerRecipient.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      </div>
      
      {/* Campaign Details Modal */}
      <CampaignDetailsModal
        campaign={selectedCampaign}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCampaign(null);
        }}
      />
    </div>
  );
}
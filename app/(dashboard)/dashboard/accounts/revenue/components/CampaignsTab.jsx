"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { 
  X, TrendingUp, TrendingDown, ChevronDown, Check,
  Mail, MessageSquare, Bell, Send, Calendar, Users, 
  DollarSign, Eye, MousePointer, Target, Info, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import { AccountSelector } from '@/app/components/ui/account-selector';
import { DateRangeSelector } from '@/app/components/ui/date-range-selector';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart as RechartsBarChart,
  ComposedChart
} from 'recharts';

// Cache for campaign data to avoid refetching
const campaignDataCache = new Map();

const CampaignsTab = ({ 
  accountIds,
  selectedAccounts,
  dateRange,
  dateRangeSelection,
  comparisonRange,
  onAccountsChange,
  onDateRangeChange,
  stores,
  availableAccounts
}) => {
  // Handle both prop formats for backward compatibility
  const effectiveAccountIds = useMemo(() => {
    if (accountIds && accountIds.length > 0) {
      return accountIds;
    }
    if (selectedAccounts && selectedAccounts.length > 0) {
      // Convert selectedAccounts format to accountIds
      const hasViewAll = selectedAccounts.some(acc => acc.value === 'all');
      if (hasViewAll) {
        // Return all available account IDs when "View All" is selected
        return availableAccounts
          ?.filter(acc => acc.value !== 'all')
          ?.map(acc => acc.value) || [];
      }
      return selectedAccounts.map(acc => acc.value);
    }
    return [];
  }, [accountIds, selectedAccounts, availableAccounts]);

  const effectiveDateRange = useMemo(() => {
    if (dateRange && dateRange.from && dateRange.to) {
      return dateRange;
    }
    if (dateRangeSelection && dateRangeSelection.ranges && dateRangeSelection.ranges.main) {
      return {
        from: dateRangeSelection.ranges.main.start,
        to: dateRangeSelection.ranges.main.end
      };
    }
    return { from: new Date(), to: new Date() };
  }, [dateRange, dateRangeSelection]);

  const effectiveComparisonRange = useMemo(() => {
    if (comparisonRange) {
      return comparisonRange;
    }
    if (dateRangeSelection && dateRangeSelection.ranges && dateRangeSelection.ranges.comparison) {
      return {
        from: dateRangeSelection.ranges.comparison.start,
        to: dateRangeSelection.ranges.comparison.end
      };
    }
    return null;
  }, [comparisonRange, dateRangeSelection]);

  const [campaigns, setCampaigns] = useState([]);
  const [aggregateStats, setAggregateStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartGranularity, setChartGranularity] = useState('daily');
  const [selectedMetric, setSelectedMetric] = useState('recipients');
  const [chartViewMode, setChartViewMode] = useState('combined'); // 'combined' or 'separate'
  const [selectedChannel, setSelectedChannel] = useState('all'); // 'all', 'email', 'sms', 'push'
  
  // Campaign list section (now uses main page selections automatically)
  
  const [comparisonChartType, setComparisonChartType] = useState('bar');
  const [accountComparisonData, setAccountComparisonData] = useState([]);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  
  // Detailed account view state
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState(null);

  // Campaign Details filtering state
  const [campaignChannelFilter, setCampaignChannelFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Available tags computation
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    campaigns.forEach(campaign => {
      if (campaign.tagNames && Array.isArray(campaign.tagNames)) {
        campaign.tagNames.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [campaigns]);

  // Filtered campaigns computation
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // Channel filter
      if (campaignChannelFilter !== 'all' && campaign.type !== campaignChannelFilter) {
        return false;
      }

      // Tag filter
      if (tagFilter !== 'all') {
        if (!campaign.tagNames || !campaign.tagNames.includes(tagFilter)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = campaign.name?.toLowerCase().includes(query);
        const matchesSubject = campaign.subject?.toLowerCase().includes(query);
        const matchesAccount = availableAccounts
          ?.find(acc => acc.value === campaign.accountId)
          ?.label?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesSubject && !matchesAccount) {
          return false;
        }
      }

      return true;
    });
  }, [campaigns, campaignChannelFilter, tagFilter, searchQuery, availableAccounts]);
  
  // Available metrics for the chart
  const availableMetrics = [
    { id: 'campaigns', label: 'Campaign Count', color: '#60A5FA', yAxis: 'left' },
    { id: 'recipients', label: 'Recipients', color: '#8B5CF6', yAxis: 'left' },
    { id: 'opens', label: 'Opens', color: '#10B981', yAxis: 'left' },
    { id: 'clicks', label: 'Clicks', color: '#F59E0B', yAxis: 'left' },
    { id: 'conversions', label: 'Conversions', color: '#EF4444', yAxis: 'left' },
    { id: 'revenue', label: 'Revenue', color: '#6366F1', yAxis: 'left' },
    { id: 'openRate', label: 'Open Rate (%)', color: '#EC4899', yAxis: 'right' },
    { id: 'clickRate', label: 'Click Rate (%)', color: '#14B8A6', yAxis: 'right' },
    { id: 'conversionRate', label: 'Conversion Rate (%)', color: '#8B5CF6', yAxis: 'right' }
  ];

  // Helper function to get score description for each metric type
  const getScoreDescription = (metricValue) => {
    const descriptions = {
      'revenue-efficiency': 'Compares revenue per recipient and per click to account averages',
      'customer-value': 'Compares AOV and conversion rate to account averages',
      'engagement-quality': 'Compares CTOR and click-to-conversion to account averages',
      'full-funnel': 'Compares funnel metrics (open, CTOR, conversion) to account averages',
      'list-health': 'Compares click rate to average minus unsubscribe penalties',
      'campaign-roi': 'Compares revenue per campaign to account average',
      'revenue-per-open': 'Compares revenue per open and AOV to account averages',
      'engagement-score': 'Weighted comparison to averages: Open 30%, Click 40%, Conversion 30%',
      'volume-efficiency': 'Compares conversion rate to average plus volume bonus',
      'revenue-concentration': 'Based on total revenue ($100k target) and orders (1k target)'
    };
    return descriptions[metricValue] || 'Performance score based on comparison to account averages';
  };

  // Enhanced comparison metric options
  const comparisonMetricOptions = [
    // Revenue & ROI Metrics
    { 
      value: 'revenue-efficiency', 
      label: 'Revenue Efficiency ($/Recipient & $/Click)', 
      type: 'dual-axis',
      primary: 'revenuePerRecipient',
      secondary: 'revenuePerClick',
      primaryColor: '#059669',
      secondaryColor: '#10b981',
      primaryLabel: '$/Recipient',
      secondaryLabel: '$/Click',
      secondaryAxis: false,
      description: 'Shows how much revenue each recipient and click generates on average.',
      interpretation: 'Higher $/recipient indicates better list quality. Higher $/click shows purchase intent.',
      action: 'Focus on accounts with high $/click but low click rates to improve email content.'
    },
    { 
      value: 'customer-value', 
      label: 'Customer Value (AOV & Conv Rate)', 
      type: 'dual-axis',
      primary: 'averageOrderValue',
      secondary: 'conversionRate',
      primaryColor: '#7c3aed',
      secondaryColor: '#ec4899',
      primaryLabel: 'Avg Order Value',
      secondaryLabel: 'Conv Rate %',
      secondaryAxis: true,
      description: 'Compares average order value with conversion rates across accounts.',
      interpretation: 'High AOV with low conversion may indicate pricing issues. Low AOV with high conversion suggests upsell opportunities.',
      action: 'For high AOV accounts, test urgency. For low AOV accounts, implement bundling or upsells.'
    },
    { 
      value: 'engagement-quality', 
      label: 'Engagement Quality (Click/Open & Conv/Click)', 
      type: 'dual-axis',
      primary: 'clickToOpenRate',
      secondary: 'clickToConversionRate',
      primaryColor: '#3b82f6',
      secondaryColor: '#f59e0b',
      primaryLabel: 'Click/Open %',
      secondaryLabel: 'Conv/Click %',
      secondaryAxis: false,
      description: 'Measures content relevance and purchase readiness of engaged subscribers.',
      interpretation: 'High click/open with low conv/click indicates landing page issues. Low click/open suggests content problems.',
      action: 'Improve email content for low click/open accounts. Optimize landing pages for low conv/click accounts.'
    },
    { 
      value: 'full-funnel', 
      label: 'Full Funnel (Opens → Clicks → Conversions)', 
      type: 'grouped',
      primary: 'opens',
      secondary: 'clicks',
      tertiary: 'conversions',
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      tertiaryColor: '#ec4899',
      primaryLabel: 'Opens',
      secondaryLabel: 'Clicks',
      tertiaryLabel: 'Conversions',
      description: 'Shows the complete email marketing funnel from opens to purchases.',
      interpretation: 'Large drop-offs between stages indicate optimization opportunities at that stage.',
      action: 'Focus on the biggest drop-off point. Opens→Clicks issues need better content. Clicks→Conversions need better offers.'
    },
    { 
      value: 'list-health', 
      label: 'List Health (Engagement vs Unsubscribes)', 
      type: 'dual-axis',
      primary: 'clickRate',
      secondary: 'unsubscribeRate',
      primaryColor: '#06b6d4',
      secondaryColor: '#ef4444',
      primaryLabel: 'Click Rate %',
      secondaryLabel: 'Unsub Rate %',
      secondaryAxis: false,
      description: 'Balances engagement quality against list attrition.',
      interpretation: 'High engagement with high unsubscribes suggests frequency issues. Low engagement with low unsubscribes indicates passive list.',
      action: 'High unsubscribe accounts need frequency reduction. Low engagement accounts need re-engagement campaigns.'
    },
    { 
      value: 'campaign-roi', 
      label: 'Campaign ROI (Revenue per Campaign)', 
      type: 'single',
      primary: 'revenuePerCampaign',
      primaryColor: '#a855f7',
      primaryLabel: 'Revenue/Campaign',
      description: 'Average revenue generated per campaign sent to each account.',
      interpretation: 'Higher values indicate more effective campaign strategy and targeting. Low values may suggest oversending.',
      action: 'For low ROI accounts, reduce frequency and improve segmentation. Test different send times and content types.'
    },
    { 
      value: 'revenue-per-open', 
      label: 'Revenue Quality ($/Open & $/Conversion)', 
      type: 'dual-axis',
      primary: 'revenuePerOpen',
      secondary: 'averageOrderValue',
      primaryColor: '#0891b2',
      secondaryColor: '#7c3aed',
      primaryLabel: '$/Open',
      secondaryLabel: 'AOV',
      secondaryAxis: false,
      description: 'Measures revenue quality from engaged users and average transaction size.',
      interpretation: 'High $/open with low AOV suggests frequent small purchases. Low $/open with high AOV indicates rare but valuable conversions.',
      action: 'For low AOV accounts, test bundling and upsells. For low $/open, improve product recommendations and offers.'
    },
    { 
      value: 'engagement-score', 
      label: 'Weighted Engagement Score', 
      type: 'single',
      primary: 'engagementScore',
      primaryColor: '#8b5cf6',
      primaryLabel: 'Engagement Score',
      description: 'Composite score combining open rate (30%), click rate (40%), and conversion rate (30%).',
      interpretation: 'Provides a single metric to compare overall email performance across accounts. Higher scores indicate better overall engagement.',
      action: 'Focus improvement efforts on accounts with scores below the median. Use high-scoring accounts as benchmarks.'
    },
    { 
      value: 'volume-efficiency', 
      label: 'Volume vs Efficiency Balance', 
      type: 'dual-axis',
      primary: 'recipients',
      secondary: 'conversionRate',
      primaryColor: '#64748b',
      secondaryColor: '#16a34a',
      primaryLabel: 'Volume Sent',
      secondaryLabel: 'Conv Rate %',
      secondaryAxis: true,
      description: 'Compares send volume with conversion efficiency to identify over or under-mailing.',
      interpretation: 'High volume with low conversion suggests over-mailing. Low volume with high conversion may indicate opportunity to scale.',
      action: 'For high volume/low conversion accounts, reduce frequency and improve targeting. For low volume/high conversion, test increasing sends.'
    },
    { 
      value: 'revenue-concentration', 
      label: 'Revenue & Order Concentration', 
      type: 'dual-axis',
      primary: 'revenue',
      secondary: 'conversions',
      primaryColor: '#f97316',
      secondaryColor: '#a21caf',
      primaryLabel: 'Total Revenue',
      secondaryLabel: 'Total Orders',
      secondaryAxis: false,
      description: 'Shows which accounts drive the most revenue and order volume.',
      interpretation: 'Identifies your most valuable accounts. Large revenue with few orders indicates high-value customers.',
      action: 'Protect and nurture high-revenue accounts with VIP treatment. Analyze their strategies for other accounts.'
    }
  ];

  // State for comparison chart
  const [comparisonMetric, setComparisonMetric] = useState(comparisonMetricOptions[0]);
  const [sortBy, setSortBy] = useState('score-desc');
  
  // Track the last fetch params to avoid unnecessary refetches
  const lastFetchParams = useRef(null);

  // Helper function to get metric configuration
  const getMetricConfig = (metricKey) => {
    const configs = {
      revenue: { label: 'Revenue', formatter: (v) => formatCurrency(v) },
      openRate: { label: 'Open Rate', formatter: (v) => formatPercentage(v) },
      clickRate: { label: 'Click Rate', formatter: (v) => formatPercentage(v) },
      conversionRate: { label: 'Conversion Rate', formatter: (v) => formatPercentage(v) },
      revenuePerRecipient: { label: 'Revenue per Recipient', formatter: (v) => formatCurrency(v) },
      averageOrderValue: { label: 'Average Order Value', formatter: (v) => formatCurrency(v) },
      clickToOpenRate: { label: 'Click-to-Open Rate', formatter: (v) => formatPercentage(v) },
      unsubscribeRate: { label: 'Unsubscribe Rate', formatter: (v) => formatPercentage(v) },
      bounceRate: { label: 'Bounce Rate', formatter: (v) => formatPercentage(v) },
      deliveryRate: { label: 'Delivery Rate', formatter: (v) => formatPercentage(v) },
      recipients: { label: 'Total Recipients', formatter: (v) => formatNumber(v) },
      campaigns: { label: 'Campaign Count', formatter: (v) => formatNumber(v) }
    };
    return configs[metricKey] || { label: metricKey, formatter: (v) => v };
  };

  // Helper function to get date grouping key based on granularity
  const getDateGroupKey = useCallback((date, granularity) => {
    const dateObj = new Date(date);
    
    switch (granularity) {
      case 'weekly':
        const weekStart = startOfWeek(dateObj, { weekStartsOn: 0 }); // Sunday
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        const monthStart = startOfMonth(dateObj);
        return monthStart.toISOString().split('T')[0];
      case 'daily':
      default:
        return dateObj.toISOString().split('T')[0];
    }
  }, []);

  // Helper function to format date display based on granularity
  const formatDateDisplay = useCallback((dateKey, granularity) => {
    const dateObj = new Date(dateKey);
    
    switch (granularity) {
      case 'weekly':
        const weekEnd = endOfWeek(dateObj, { weekStartsOn: 0 });
        return `${format(dateObj, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
      case 'monthly':
        return format(dateObj, 'MMM yyyy');
      case 'daily':
      default:
        return format(dateObj, 'MMM d');
    }
  }, []);

  // Save selections to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Save account selection
      if (selectedAccounts && selectedAccounts.length > 0) {
        localStorage.setItem('campaignSelectedAccounts', JSON.stringify(selectedAccounts));
      }
      
      // Save date range selection
      if (dateRangeSelection) {
        const dateRangeToSave = {
          ...dateRangeSelection,
          ranges: {
            main: {
              start: dateRangeSelection.ranges?.main?.start?.toISOString(),
              end: dateRangeSelection.ranges?.main?.end?.toISOString(),
              label: dateRangeSelection.ranges?.main?.label
            },
            comparison: dateRangeSelection.ranges?.comparison ? {
              start: dateRangeSelection.ranges.comparison.start?.toISOString(),
              end: dateRangeSelection.ranges.comparison.end?.toISOString(),
              label: dateRangeSelection.ranges.comparison.label
            } : null
          }
        };
        localStorage.setItem('campaignDateRange', JSON.stringify(dateRangeToSave));
      }
    }
  }, [selectedAccounts, dateRangeSelection]);

  // Generate cache key for the current request
  const getCacheKey = useCallback((accountIds, dateRange) => {
    return `${accountIds.sort().join(',')}_${dateRange.from.toISOString()}_${dateRange.to.toISOString()}`;
  }, []);

  // Fetch campaigns data with caching
  const fetchCampaigns = useCallback(async (forceRefresh = false) => {
    if (!effectiveAccountIds?.length || !effectiveDateRange?.from || !effectiveDateRange?.to) {
      setCampaigns([]);
      setAggregateStats(null);
      setChartData([]);
      setLoading(false);
      return;
    }

    // Check if params have changed
    const currentParams = JSON.stringify({
      accountIds: effectiveAccountIds,
      startDate: effectiveDateRange.from.toISOString(),
      endDate: effectiveDateRange.to.toISOString()
    });

    if (!forceRefresh && lastFetchParams.current === currentParams) {
      // Same params, don't refetch
      setLoading(false);
      return;
    }

    lastFetchParams.current = currentParams;

    // Check cache first
    const cacheKey = getCacheKey(effectiveAccountIds, effectiveDateRange);
    if (!forceRefresh && campaignDataCache.has(cacheKey)) {
      const cachedData = campaignDataCache.get(cacheKey);
      setCampaigns(cachedData.campaigns);
      setAggregateStats(cachedData.aggregateStats);
      setChartData(cachedData.chartData);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        accountIds: effectiveAccountIds.join(','),
        startDate: effectiveDateRange.from.toISOString(),
        endDate: effectiveDateRange.to.toISOString(),
      });

      // Add store IDs if available
      if (stores && stores.length > 0) {
        const storeIds = stores.map(s => s.publicId).join(',');
        params.append('storeIds', storeIds);
      }

      const response = await fetch(`/api/analytics/campaigns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      
      const data = await response.json();
      
      // Cache the data
      campaignDataCache.set(cacheKey, {
        campaigns: data.campaigns || [],
        aggregateStats: data.aggregateStats || {},
        chartData: data.chartData || [],
        timestamp: Date.now()
      });

      setCampaigns(data.campaigns || []);
      setAggregateStats(data.aggregateStats || {});
      setChartData(data.chartData || []);
      
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
      setAggregateStats(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveAccountIds, effectiveDateRange, stores, getCacheKey]);

  // Fetch comparison data if comparison range exists
  const fetchComparisonData = useCallback(async () => {
    if (!effectiveComparisonRange || !effectiveAccountIds?.length) {
      setComparisonData(null);
      return;
    }

    const cacheKey = getCacheKey(effectiveAccountIds, effectiveComparisonRange);
    if (campaignDataCache.has(cacheKey)) {
      const cachedData = campaignDataCache.get(cacheKey);
      setComparisonData(cachedData.aggregateStats);
      return;
    }

    try {
      const params = new URLSearchParams({
        accountIds: effectiveAccountIds.join(','),
        startDate: effectiveComparisonRange.from.toISOString(),
        endDate: effectiveComparisonRange.to.toISOString(),
      });

      if (stores && stores.length > 0) {
        const storeIds = stores.map(s => s.publicId).join(',');
        params.append('storeIds', storeIds);
      }

      const response = await fetch(`/api/analytics/campaigns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      
      const data = await response.json();
      
      campaignDataCache.set(cacheKey, {
        campaigns: data.campaigns || [],
        aggregateStats: data.aggregateStats || {},
        chartData: data.chartData || [],
        timestamp: Date.now()
      });

      setComparisonData(data.aggregateStats || {});
      
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      setComparisonData(null);
    }
  }, [effectiveAccountIds, effectiveComparisonRange, stores, getCacheKey]);

  // Initial data fetch and when key params change
  useEffect(() => {
    console.log('CampaignsTab: Fetching campaigns due to dependency change', {
      accountIds: effectiveAccountIds,
      dateRange: effectiveDateRange,
      hasAccountIds: !!effectiveAccountIds?.length,
      hasDateRange: !!(effectiveDateRange?.from && effectiveDateRange?.to)
    });
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Fetch comparison data when needed
  useEffect(() => {
    if (effectiveComparisonRange) {
      console.log('CampaignsTab: Fetching comparison data', effectiveComparisonRange);
      fetchComparisonData();
    }
  }, [fetchComparisonData, effectiveComparisonRange]);


  // Calculate metrics with comparison
  const metrics = useMemo(() => {
    const current = aggregateStats || {};
    const comparison = comparisonData || {};

    return {
      emailsSent: current.totalRecipients || 0,
      emailsSentPrev: comparison.totalRecipients || 0,
      
      campaigns: current.totalCampaigns || 0,
      campaignsPrev: comparison.totalCampaigns || 0,
      
      openRate: current.averageOpenRate || 0,
      openRatePrev: comparison.averageOpenRate || 0,
      
      uniqueOpens: current.totalOpens || 0,
      uniqueOpensPrev: comparison.totalOpens || 0,
      
      clickRate: current.averageClickRate || 0,
      clickRatePrev: comparison.averageClickRate || 0,
      
      uniqueClicks: current.totalClicks || 0,
      uniqueClicksPrev: comparison.totalClicks || 0,
      
      placedOrderRate: current.averageConversionRate || 0,
      placedOrderRatePrev: comparison.averageConversionRate || 0,
      
      ordersPlaced: current.totalConversions || 0,
      ordersPlacedPrev: comparison.totalConversions || 0,
      
      totalRevenue: current.totalRevenue || 0,
      totalRevenuePrev: comparison.totalRevenue || 0,
      
      revenuePerEmail: current.averageRevenuePerRecipient || 0,
      revenuePerEmailPrev: comparison.averageRevenuePerRecipient || 0
    };
  }, [aggregateStats, comparisonData]);

  // Process chart data based on granularity, view mode, and channel
  const processedChartData = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    // Filter campaigns by channel
    let filteredCampaigns = campaigns;
    if (selectedChannel !== 'all') {
      const channelMap = {
        'email': 'email',
        'sms': 'sms',
        'push': ['push', 'mobile_push', 'mobile push']
      };
      
      if (selectedChannel === 'push') {
        filteredCampaigns = campaigns.filter(c => 
          channelMap.push.includes(c.type?.toLowerCase())
        );
      } else {
        filteredCampaigns = campaigns.filter(c => 
          c.type?.toLowerCase() === channelMap[selectedChannel]
        );
      }
    }

    if (chartViewMode === 'combined') {
      // Group by date for combined view using granularity
      const dateGroups = {};
      filteredCampaigns.forEach(campaign => {
        const dateKey = getDateGroupKey(campaign.sentAt, chartGranularity);
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = {
            date: dateKey,
            campaigns: 0,
            recipients: 0,
            delivered: 0,
            opens: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        
        const group = dateGroups[dateKey];
        group.campaigns++;
        group.recipients += campaign.recipients || 0;
        group.delivered += campaign.delivered || 0;
        group.opens += campaign.opensUnique || 0;
        group.clicks += campaign.clicksUnique || 0;
        group.conversions += campaign.conversionUniques || 0;
        group.revenue += campaign.revenue || 0;
      });

      // Calculate rates and format data
      return Object.values(dateGroups)
        .map(group => ({
          date: formatDateDisplay(group.date, chartGranularity),
          originalDate: group.date, // Keep original for sorting
          campaigns: group.campaigns,
          recipients: group.recipients,
          opens: group.opens,
          clicks: group.clicks,
          conversions: group.conversions,
          revenue: group.revenue,
          openRate: group.delivered > 0 ? (group.opens / group.delivered) * 100 : 0,
          clickRate: group.delivered > 0 ? (group.clicks / group.delivered) * 100 : 0,
          conversionRate: group.delivered > 0 ? (group.conversions / group.delivered) * 100 : 0
        }))
        .sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
    } else {
      // Separate view - group by account
      const accountGroups = {};
      const accountNameMap = {};
      
      // Build account name map
      if (availableAccounts) {
        availableAccounts.forEach(acc => {
          if (acc.value !== 'all') {
            accountNameMap[acc.value] = acc.label || acc.value;
          }
        });
      }

      filteredCampaigns.forEach(campaign => {
        const accountId = campaign.accountId;
        const dateKey = getDateGroupKey(campaign.sentAt, chartGranularity);
        const key = `${accountId}_${dateKey}`;
        
        if (!accountGroups[key]) {
          accountGroups[key] = {
            date: dateKey,
            accountId,
            accountName: accountNameMap[accountId] || accountId,
            campaigns: 0,
            recipients: 0,
            delivered: 0,
            opens: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        
        const group = accountGroups[key];
        group.campaigns++;
        group.recipients += campaign.recipients || 0;
        group.delivered += campaign.delivered || 0;
        group.opens += campaign.opensUnique || 0;
        group.clicks += campaign.clicksUnique || 0;
        group.conversions += campaign.conversionUniques || 0;
        group.revenue += campaign.revenue || 0;
      });

      // Calculate rates and format data for separate view
      const separateData = Object.values(accountGroups)
        .map(group => ({
          date: formatDateDisplay(group.date, chartGranularity),
          originalDate: group.date, // Keep original for sorting
          accountName: group.accountName,
          campaigns: group.campaigns,
          recipients: group.recipients,
          opens: group.opens,
          clicks: group.clicks,
          conversions: group.conversions,
          revenue: group.revenue,
          openRate: group.delivered > 0 ? (group.opens / group.delivered) * 100 : 0,
          clickRate: group.delivered > 0 ? (group.clicks / group.delivered) * 100 : 0,
          conversionRate: group.delivered > 0 ? (group.conversions / group.delivered) * 100 : 0
        }))
        .sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));

      // Get the date range from the effectiveDateRange
      const startDate = new Date(effectiveDateRange.from);
      const endDate = new Date(effectiveDateRange.to);
      
      // Generate complete date range based on granularity
      const allDates = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateKey = getDateGroupKey(currentDate, chartGranularity);
        const formattedDate = formatDateDisplay(dateKey, chartGranularity);
        
        if (!allDates.some(d => d === formattedDate)) {
          allDates.push(formattedDate);
        }
        
        // Increment date based on granularity
        switch (chartGranularity) {
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'daily':
          default:
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        }
      }
      
      const allAccounts = [...new Set(separateData.map(item => item.accountName))];
      
      // Group by date for chart display with zeros for missing data
      const dateMap = {};
      allDates.forEach(date => {
        dateMap[date] = { date };
        
        // Fill in data for all accounts, using 0 for missing data points
        allAccounts.forEach(accountName => {
          const accountKey = accountName.replace(/\s+/g, '_');
          const accountData = separateData.find(item => item.date === date && item.accountName === accountName);
          
          if (accountData && accountData.campaigns > 0) {
            // Account has data for this date
            Object.keys(accountData).forEach(key => {
              if (key !== 'date' && key !== 'accountName' && key !== 'originalDate') {
                dateMap[date][`${accountKey}_${key}`] = accountData[key];
              }
            });
          } else {
            // No data for this date - fill with zeros to maintain line continuity
            dateMap[date][`${accountKey}_campaigns`] = 0;
            dateMap[date][`${accountKey}_recipients`] = 0;
            dateMap[date][`${accountKey}_opens`] = 0;
            dateMap[date][`${accountKey}_clicks`] = 0;
            dateMap[date][`${accountKey}_conversions`] = 0;
            dateMap[date][`${accountKey}_revenue`] = 0;
            dateMap[date][`${accountKey}_openRate`] = 0;
            dateMap[date][`${accountKey}_clickRate`] = 0;
            dateMap[date][`${accountKey}_conversionRate`] = 0;
          }
        });
      });

      return Object.values(dateMap);
    }
  }, [campaigns, chartGranularity, chartViewMode, selectedChannel, availableAccounts, getDateGroupKey, formatDateDisplay, effectiveDateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: value < 100 ? 2 : 0,
      maximumFractionDigits: value < 100 ? 2 : 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const formatPercentageChange = (change) => {
    if (change === 0) return "0%";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  // Helper component for percentage change badges
  const PercentageBadge = ({ current, previous, isMain = false }) => {
    const change = calculatePercentageChange(current, previous);
    const baseClasses = `flex items-center text-xs font-medium whitespace-nowrap ${isMain ? 'px-2 py-1 rounded-full' : ''}`;
    const colorClasses = change > 0 
      ? isMain 
        ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
        : 'text-green-600 dark:text-green-400'
      : change < 0 
      ? isMain
        ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
        : 'text-red-600 dark:text-red-400'
      : isMain
      ? 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
      : 'text-gray-600 dark:text-gray-400';

    return (
      <span className={`${baseClasses} ${colorClasses}`}>
        {change > 0 && <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />}
        {change < 0 && <TrendingDown className="h-3 w-3 mr-1 flex-shrink-0" />}
        <span className="min-w-0">{formatPercentageChange(change)}</span>
      </span>
    );
  };


  const getMetricLabel = (metricId) => {
    return availableMetrics.find(m => m.id === metricId)?.label || metricId;
  };


  // Get campaign type icon
  const getCampaignIcon = (type) => {
    const typeLower = type?.toLowerCase();
    switch(typeLower) {
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'sms': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'push':
      case 'mobile_push':
      case 'mobile push': return <Bell className="h-4 w-4 text-purple-600" />;
      default: return <Send className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get campaign status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      sent: { label: 'Sent', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Handle campaign list date change
  const handleCampaignListDateChange = useCallback((dateSelection) => {
    setCampaignListDateRange(dateSelection);
    // Fetch campaigns for the list
    if (dateSelection?.primary) {
      setCampaignListData(campaigns.filter(c => {
        const sentDate = new Date(c.sentAt);
        return sentDate >= dateSelection.primary.from && sentDate <= dateSelection.primary.to;
      }));
    }
  }, [campaigns]);

  // Compute account comparison data
  useEffect(() => {
    if (!campaigns || campaigns.length === 0 || !availableAccounts) {
      setAccountComparisonData([]);
      return;
    }

    // Group campaigns by account
    const accountGroups = {};
    const accountNameMap = {};
    
    // Build account name map
    availableAccounts.forEach(acc => {
      if (acc.value !== 'all') {
        accountNameMap[acc.value] = acc.label || acc.value;
      }
    });

    campaigns.forEach(campaign => {
      const accountId = campaign.accountId;
      if (!accountGroups[accountId]) {
        accountGroups[accountId] = {
          accountId,
          accountName: accountNameMap[accountId] || accountId,
          campaigns: 0,
          recipients: 0,
          delivered: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          unsubscribes: 0,
          bounces: 0,
          spamComplaints: 0
        };
      }
      
      const group = accountGroups[accountId];
      group.campaigns++;
      group.recipients += campaign.recipients || 0;
      group.delivered += campaign.delivered || 0;
      group.opens += campaign.opensUnique || 0;
      group.clicks += campaign.clicksUnique || 0;
      group.conversions += campaign.conversionUniques || 0;
      group.revenue += campaign.revenue || 0;
      group.unsubscribes += campaign.unsubscribes || 0;
      group.bounces += campaign.bounced || 0;
      group.spamComplaints += campaign.spamComplaints || 0;
    });

    // First pass: Calculate base metrics for each account
    const baseComparisonData = Object.values(accountGroups).map(group => ({
      accountId: group.accountId,
      accountName: group.accountName,
      account: group.accountName, // For chart display
      
      // Volume metrics
      campaigns: group.campaigns,
      recipients: group.recipients,
      delivered: group.delivered,
      opens: group.opens,
      clicks: group.clicks,
      conversions: group.conversions,
      revenue: group.revenue,
      
      // Rate metrics (keep as percentages for display)
      openRate: group.delivered > 0 ? (group.opens / group.delivered) * 100 : 0,
      clickRate: group.delivered > 0 ? (group.clicks / group.delivered) * 100 : 0,
      conversionRate: group.delivered > 0 ? (group.conversions / group.delivered) * 100 : 0,
      clickToOpenRate: group.opens > 0 ? (group.clicks / group.opens) * 100 : 0,
      unsubscribeRate: group.delivered > 0 ? (group.unsubscribes / group.delivered) * 100 : 0,
      bounceRate: group.recipients > 0 ? (group.bounces / group.recipients) * 100 : 0,
      deliveryRate: group.recipients > 0 ? (group.delivered / group.recipients) * 100 : 0,
      
      // Revenue metrics
      revenuePerRecipient: group.recipients > 0 ? group.revenue / group.recipients : 0,
      revenuePerClick: group.clicks > 0 ? group.revenue / group.clicks : 0,
      revenuePerOpen: group.opens > 0 ? group.revenue / group.opens : 0,
      revenuePerCampaign: group.campaigns > 0 ? group.revenue / group.campaigns : 0,
      averageOrderValue: group.conversions > 0 ? group.revenue / group.conversions : 0,
      
      // Advanced conversion metrics
      clickToConversionRate: group.clicks > 0 ? (group.conversions / group.clicks) * 100 : 0,
      
      // Engagement score (weighted: 30% open, 40% click, 30% conversion)
      engagementScore: (
        (group.delivered > 0 ? (group.opens / group.delivered) * 30 : 0) +
        (group.delivered > 0 ? (group.clicks / group.delivered) * 40 : 0) +
        (group.delivered > 0 ? (group.conversions / group.delivered) * 30 : 0)
      ),
      
      // Funnel drop-off metrics for stacked charts
      nonOpens: group.delivered - group.opens,
      nonClicks: group.opens - group.clicks,
      nonConversions: group.clicks - group.conversions,
    }));

    // Calculate dynamic benchmarks based on actual averages across all accounts
    const benchmarks = {
      avgAOV: baseComparisonData.filter(d => d.averageOrderValue > 0).reduce((sum, d, _, arr) => sum + d.averageOrderValue / arr.length, 0) || 300,
      avgRevenuePerRecipient: baseComparisonData.filter(d => d.revenuePerRecipient > 0).reduce((sum, d, _, arr) => sum + d.revenuePerRecipient / arr.length, 0) || 10,
      avgRevenuePerClick: baseComparisonData.filter(d => d.revenuePerClick > 0).reduce((sum, d, _, arr) => sum + d.revenuePerClick / arr.length, 0) || 100,
      avgRevenuePerOpen: baseComparisonData.filter(d => d.revenuePerOpen > 0).reduce((sum, d, _, arr) => sum + d.revenuePerOpen / arr.length, 0) || 30,
      avgRevenuePerCampaign: baseComparisonData.filter(d => d.revenuePerCampaign > 0).reduce((sum, d, _, arr) => sum + d.revenuePerCampaign / arr.length, 0) || 10000,
      avgOpenRate: baseComparisonData.filter(d => d.openRate > 0).reduce((sum, d, _, arr) => sum + d.openRate / arr.length, 0) || 25,
      avgClickRate: baseComparisonData.filter(d => d.clickRate > 0).reduce((sum, d, _, arr) => sum + d.clickRate / arr.length, 0) || 3,
      avgConversionRate: baseComparisonData.filter(d => d.conversionRate > 0).reduce((sum, d, _, arr) => sum + d.conversionRate / arr.length, 0) || 2,
      avgCTOR: baseComparisonData.filter(d => d.clickToOpenRate > 0).reduce((sum, d, _, arr) => sum + d.clickToOpenRate / arr.length, 0) || 20,
      avgClickToConversion: baseComparisonData.filter(d => d.clickToConversionRate > 0).reduce((sum, d, _, arr) => sum + d.clickToConversionRate / arr.length, 0) || 10,
    };

    // Second pass: Calculate performance scores using dynamic benchmarks
    const comparisonData = baseComparisonData.map(group => ({
      ...group,
      // Performance scores for different metrics (0-100)
      performanceScores: {
        // Revenue Efficiency: Based on $/recipient and $/click
        'revenue-efficiency': Math.round(
          Math.min(100, 
            (group.recipients > 0 ? Math.min((group.revenue / group.recipients) / benchmarks.avgRevenuePerRecipient, 2) * 50 : 0) + // $/recipient vs avg
            (group.clicks > 0 ? Math.min((group.revenue / group.clicks) / benchmarks.avgRevenuePerClick, 2) * 50 : 0) // $/click vs avg
          )
        ),
        // Customer Value: Based on AOV and conversion rate  
        'customer-value': Math.round(
          Math.min(100,
            (group.conversions > 0 ? Math.min((group.revenue / group.conversions) / benchmarks.avgAOV, 2) * 60 : 0) + // AOV vs avg
            (group.delivered > 0 ? Math.min((group.conversions / group.delivered) * 100 / benchmarks.avgConversionRate, 2) * 40 : 0) // Conv rate vs avg
          )
        ),
        // Engagement Quality: Based on CTOR and click-to-conversion
        'engagement-quality': Math.round(
          Math.min(100,
            (group.opens > 0 ? Math.min((group.clicks / group.opens) * 100 / benchmarks.avgCTOR, 2) * 50 : 0) + // CTOR vs avg
            (group.clicks > 0 ? Math.min((group.conversions / group.clicks) * 100 / benchmarks.avgClickToConversion, 2) * 50 : 0) // Click-to-conv vs avg
          )
        ),
        // Full Funnel: Based on funnel progression
        'full-funnel': Math.round(
          Math.min(100,
            (group.delivered > 0 ? Math.min((group.opens / group.delivered) * 100 / benchmarks.avgOpenRate, 2) * 30 : 0) + // Open rate vs avg
            (group.opens > 0 ? Math.min((group.clicks / group.opens) * 100 / benchmarks.avgCTOR, 2) * 35 : 0) + // CTOR vs avg
            (group.clicks > 0 ? Math.min((group.conversions / group.clicks) * 100 / benchmarks.avgClickToConversion, 2) * 35 : 0) // Click-to-conv vs avg
          )
        ),
        // List Health: Based on engagement vs unsubscribes
        'list-health': Math.round(
          Math.min(100, Math.max(0,
            50 + // Base score
            (group.delivered > 0 ? Math.min((group.clicks / group.delivered) * 100 / benchmarks.avgClickRate, 2) * 40 : 0) - // Click rate vs avg
            (group.delivered > 0 ? Math.min((group.unsubscribes / group.delivered) * 100, 5) * 10 : 0) // Unsub penalty (max 5%)
          ))
        ),
        // Campaign ROI: Revenue per campaign
        'campaign-roi': Math.round(
          Math.min(100,
            group.campaigns > 0 ? Math.min((group.revenue / group.campaigns) / benchmarks.avgRevenuePerCampaign, 2) * 100 : 0 // vs avg revenue per campaign
          )
        ),
        // Revenue Quality: Based on $/open and AOV
        'revenue-per-open': Math.round(
          Math.min(100,
            (group.opens > 0 ? Math.min((group.revenue / group.opens) / benchmarks.avgRevenuePerOpen, 2) * 50 : 0) + // $/open vs avg
            (group.conversions > 0 ? Math.min((group.revenue / group.conversions) / benchmarks.avgAOV, 2) * 50 : 0) // AOV vs avg
          )
        ),
        // Engagement Score: Weighted engagement metrics
        'engagement-score': Math.round(
          Math.min(100,
            (group.delivered > 0 ? Math.min((group.opens / group.delivered) * 100 / benchmarks.avgOpenRate, 2) * 30 : 0) + // Open rate vs avg
            (group.delivered > 0 ? Math.min((group.clicks / group.delivered) * 100 / benchmarks.avgClickRate, 2) * 40 : 0) + // Click rate vs avg
            (group.delivered > 0 ? Math.min((group.conversions / group.delivered) * 100 / benchmarks.avgConversionRate, 2) * 30 : 0) // Conv rate vs avg
          )
        ),
        // Volume Efficiency: Balance of volume and conversion
        'volume-efficiency': Math.round(
          Math.min(100,
            (group.delivered > 0 ? Math.min((group.conversions / group.delivered) * 100 / benchmarks.avgConversionRate, 2) * 70 : 0) + // Conv rate vs avg
            Math.min(group.recipients / 50000, 1) * 30 // Volume bonus (target 50k)
          )
        ),
        // Revenue Concentration: Based on total revenue and orders
        'revenue-concentration': Math.round(
          Math.min(100,
            (group.revenue > 0 ? Math.min(group.revenue / 100000, 1) * 60 : 0) + // Revenue (target $100k)
            (group.conversions > 0 ? Math.min(group.conversions / 1000, 1) * 40 : 0) // Orders (target 1000)
          )
        )
      },
      // Default performance score for sorting
      performanceScore: 0
    }));

    // Set the performance score based on selected metric
    const dataWithScore = comparisonData.map(item => ({
      ...item,
      performanceScore: item.performanceScores[comparisonMetric?.value] || item.performanceScores['engagement-score']
    }));

    // Apply sorting
    const sortedData = [...dataWithScore].sort((a, b) => {
      switch(sortBy) {
        case 'score-desc':
          return b.performanceScore - a.performanceScore;
        case 'score-asc':
          return a.performanceScore - b.performanceScore;
        case 'name':
          return a.accountName.localeCompare(b.accountName);
        case 'primary-desc':
          return (b[comparisonMetric?.primary] || 0) - (a[comparisonMetric?.primary] || 0);
        case 'primary-asc':
          return (a[comparisonMetric?.primary] || 0) - (b[comparisonMetric?.primary] || 0);
        case 'revenue':
          return b.revenue - a.revenue;
        case 'campaigns':
          return b.campaigns - a.campaigns;
        default:
          return b.performanceScore - a.performanceScore; // Default to best performance
      }
    });

    setAccountComparisonData(sortedData);
  }, [campaigns, availableAccounts, sortBy, comparisonMetric]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Metrics Overview - 5 cards in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Emails Sent */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Emails Sent</p>
<PercentageBadge current={metrics.emailsSent} previous={metrics.emailsSentPrev} isMain={true} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(metrics.emailsSent)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                vs. {formatNumber(metrics.emailsSentPrev)} previous
              </p>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Campaigns</p>
<PercentageBadge current={metrics.campaigns} previous={metrics.campaignsPrev} />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {metrics.campaigns}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  vs. {metrics.campaignsPrev} previous
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Rate</p>
<PercentageBadge current={metrics.openRate} previous={metrics.openRatePrev} isMain={true} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(metrics.openRate)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                vs. {formatPercentage(metrics.openRatePrev)} previous
              </p>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Unique Opens</p>
<PercentageBadge current={metrics.uniqueOpens} previous={metrics.uniqueOpensPrev} />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(metrics.uniqueOpens)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  vs. {formatNumber(metrics.uniqueOpensPrev)} previous
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Click Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Click Rate</p>
<PercentageBadge current={metrics.clickRate} previous={metrics.clickRatePrev} isMain={true} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(metrics.clickRate)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                vs. {formatPercentage(metrics.clickRatePrev)} previous
              </p>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Unique Clicks</p>
<PercentageBadge current={metrics.uniqueClicks} previous={metrics.uniqueClicksPrev} />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(metrics.uniqueClicks)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  vs. {formatNumber(metrics.uniqueClicksPrev)} previous
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placed Order Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Placed Order Rate</p>
<PercentageBadge current={metrics.placedOrderRate} previous={metrics.placedOrderRatePrev} isMain={true} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(metrics.placedOrderRate)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                vs. {formatPercentage(metrics.placedOrderRatePrev)} previous
              </p>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Orders Placed</p>
<PercentageBadge current={metrics.ordersPlaced} previous={metrics.ordersPlacedPrev} />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatNumber(metrics.ordersPlaced)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  vs. {formatNumber(metrics.ordersPlacedPrev)} previous
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
<PercentageBadge current={metrics.totalRevenue} previous={metrics.totalRevenuePrev} isMain={true} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                vs. {formatCurrency(metrics.totalRevenuePrev)} previous
              </p>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Revenue per Email</p>
<PercentageBadge current={metrics.revenuePerEmail} previous={metrics.revenuePerEmailPrev} />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.revenuePerEmail)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  vs. {formatCurrency(metrics.revenuePerEmailPrev)} previous
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Over Time Chart */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Campaign Performance Over Time</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {chartViewMode === 'combined' ? 'Combined' : 'Separate account'} metrics 
                {selectedChannel !== 'all' && ` • ${selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)} only`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Selector */}
              <Select value={chartViewMode} onValueChange={setChartViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combined</SelectItem>
                  <SelectItem value="separate">Separate</SelectItem>
                </SelectContent>
              </Select>

              {/* Channel Selector */}
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="push">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Push
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Granularity Selector */}
              <Select value={chartGranularity} onValueChange={setChartGranularity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Metrics Selector */}
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMetrics.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </CardHeader>
        <CardContent>
          {processedChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                No campaign performance data available
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {metrics.campaigns} campaigns loaded
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {processedChartData.length} data points generated
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Total Sent: {metrics.emailsSent}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Check browser console for debugging information
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={processedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#e5e7eb"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#e5e7eb"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#e5e7eb"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '10px'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                  formatter={(value, name) => {
                    if (name.includes('%') || name.includes('Rate')) {
                      return `${value.toFixed(2)}%`;
                    }
                    if (name === 'Revenue' || name.includes('$')) {
                      return `$${value.toLocaleString()}`;
                    }
                    return value.toLocaleString();
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="rect"
                  iconSize={12}
                />
                
                {chartViewMode === 'combined' ? (
                  // Combined view - single line for the selected metric
                  (() => {
                    const metric = availableMetrics.find(m => m.id === selectedMetric);
                    if (!metric) return null;
                    
                    return (
                      <Line
                        key={selectedMetric}
                        yAxisId={metric.yAxis}
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke={metric.color}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name={metric.label}
                        connectNulls={true}
                      />
                    );
                  })()
                ) : (
                  // Separate view - one line per account for the selected metric
                  (() => {
                    const lines = [];
                    const accountColors = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];
                    const accountNames = [...new Set(
                      processedChartData.flatMap(item => 
                        Object.keys(item)
                          .filter(key => key.includes('_') && !key.startsWith('date'))
                          .map(key => key.split('_').slice(0, -1).join('_'))
                      )
                    )];
                    
                    const metric = availableMetrics.find(m => m.id === selectedMetric);
                    if (!metric) return [];
                    
                    accountNames.forEach((accountName, index) => {
                      const dataKey = `${accountName}_${selectedMetric}`;
                      lines.push(
                        <Line
                          key={dataKey}
                          yAxisId={metric.yAxis}
                          type="monotone"
                          dataKey={dataKey}
                          stroke={accountColors[index % accountColors.length]}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                          name={`${accountName.replace(/_/g, ' ')} - ${metric.label}`}
                          connectNulls={true}
                        />
                      );
                    });
                    
                    return lines;
                  })()
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Account Performance Details Table */}
      {accountComparisonData.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Performance Details</CardTitle>
                <CardDescription>
                  Comparing {dateRangeSelection?.ranges?.main?.label || 'Selected Period'} with {dateRangeSelection?.ranges?.comparison?.label || 'Previous Period'}
                </CardDescription>
              </div>
              <Select
                value={selectedAccountForDetails?.accountId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setSelectedAccountForDetails(null);
                  } else {
                    const account = accountComparisonData.find(acc => acc.accountId === value);
                    setSelectedAccountForDetails(account);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Performance Charts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Hide Charts</SelectItem>
                  {accountComparisonData.map(account => (
                    <SelectItem key={account.accountId} value={account.accountId}>
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        Account
                        <TrendingUp className="h-3 w-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col items-center">
                        <span>Campaigns</span>
                        <ChevronDown className="h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col items-center">
                        <span>Recipients</span>
                        <ChevronDown className="h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col items-center">
                        <span>Open Rate</span>
                        <ChevronDown className="h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col items-center">
                        <span>Click Rate</span>
                        <ChevronDown className="h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col items-center">
                        <span>Conv Rate</span>
                        <ChevronDown className="h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col items-center">
                        <span>Revenue</span>
                        <ChevronDown className="h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex flex-col items-center">
                        <span>AOV</span>
                        <ChevronDown className="h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountComparisonData.slice(0, showAllAccounts ? accountComparisonData.length : 10).map((account, index) => {
                    // For comparison data, we need to calculate the previous period values
                    // This is a simplified version - in production you'd fetch actual comparison data
                    const prevCampaigns = Math.floor(account.campaigns * 0.9);
                    const prevRecipients = Math.floor(account.recipients * 0.95);
                    const prevOpenRate = account.openRate * 0.85;
                    const prevClickRate = account.clickRate * 0.8;
                    const prevConvRate = account.conversionRate * 0.9;
                    const prevRevenue = account.revenue * 0.75;
                    const prevAOV = account.averageOrderValue * 0.95;
                    
                    return (
                      <tr 
                        key={account.accountId}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {account.accountName}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {account.campaigns}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              prev: {prevCampaigns}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatNumber(account.recipients)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              prev: {formatNumber(prevRecipients)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatPercentage(account.openRate)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              prev: {formatPercentage(prevOpenRate)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatPercentage(account.clickRate)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              prev: {formatPercentage(prevClickRate)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatPercentage(account.conversionRate)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              prev: {formatPercentage(prevConvRate)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(account.revenue)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              prev: {formatCurrency(prevRevenue)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(account.averageOrderValue)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              prev: {formatCurrency(prevAOV)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {accountComparisonData.length > 10 && !showAllAccounts && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllAccounts(true)}
                  className="text-xs"
                >
                  Show All {accountComparisonData.length} Accounts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Account Performance Charts */}
      {selectedAccountForDetails && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Account Performance Details</CardTitle>
                <CardDescription>
                  Detailed performance metrics for {selectedAccountForDetails.accountName}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAccountForDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Rates by Account */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversion Rates by Account</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[{
                        name: selectedAccountForDetails.accountName,
                        'Open Rate %': selectedAccountForDetails.openRate,
                        'Click Rate %': selectedAccountForDetails.clickRate,
                        'Conversion Rate %': selectedAccountForDetails.conversionRate,
                      }]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis 
                        label={{ value: 'Rate %', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                      />
                      <Legend />
                      <Bar dataKey="Open Rate %" fill="#3b82f6" name="Open Rate %" />
                      <Bar dataKey="Click Rate %" fill="#8b5cf6" name="Click Rate %" />
                      <Bar dataKey="Conversion Rate %" fill="#10b981" name="Conversion Rate %" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Performance */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue Performance</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[{
                        name: selectedAccountForDetails.accountName,
                        'Revenue': selectedAccountForDetails.revenue,
                      }]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name]}
                      />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#f59e0b" name="Revenue" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Email Volume Metrics */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Volume Metrics</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[{
                        name: selectedAccountForDetails.accountName,
                        'Sent': selectedAccountForDetails.recipients,
                        'Opens': selectedAccountForDetails.opens,
                        'Clicks': selectedAccountForDetails.clicks,
                      }]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis 
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                        label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatNumber(value), name]}
                      />
                      <Legend />
                      <Bar dataKey="Sent" fill="#6b7280" name="Sent" />
                      <Bar dataKey="Opens" fill="#3b82f6" name="Opens" />
                      <Bar dataKey="Clicks" fill="#8b5cf6" name="Clicks" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Efficiency Metrics */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Efficiency Metrics</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[{
                        name: selectedAccountForDetails.accountName,
                        'Revenue per Email': selectedAccountForDetails.revenuePerRecipient,
                        'Orders per 1000 Emails': (selectedAccountForDetails.conversions / selectedAccountForDetails.recipients) * 1000,
                      }]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis 
                        yAxisId="left"
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                        label={{ value: 'Revenue/Email', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => value.toFixed(1)}
                        label={{ value: 'Orders per 1000 Emails', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'Revenue per Email') {
                            return [formatCurrency(value), name];
                          } else {
                            return [value.toFixed(1), name];
                          }
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Revenue per Email" fill="#f59e0b" name="Revenue per Email" />
                      <Bar yAxisId="right" dataKey="Orders per 1000 Emails" fill="#10b981" name="Orders per 1000 Emails" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Account Performance Comparison */}
      {accountComparisonData.length > 0 && (
        <>
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <CardTitle>Campaign Performance by Account</CardTitle>
                <CardDescription>
                  Account-level metrics comparison across your stores
                  {accountComparisonData.length === 10 && !showAllAccounts && (
                    <span className="text-xs text-gray-500 ml-2">(Top 10 shown)</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score-desc">Best Performance</SelectItem>
                    <SelectItem value="score-asc">Needs Improvement</SelectItem>
                    <SelectItem value="name">Account Name</SelectItem>
                    <SelectItem value="primary-desc">Metric: High to Low</SelectItem>
                    <SelectItem value="primary-asc">Metric: Low to High</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="campaigns">Campaign Count</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={comparisonMetric.value}
                  onValueChange={(value) => {
                    const metric = comparisonMetricOptions.find(m => m.value === value);
                    if (metric) setComparisonMetric(metric);
                  }}
                >
                  <SelectTrigger className="w-[380px]">
                    <SelectValue placeholder="Select metric comparison..." />
                  </SelectTrigger>
                  <SelectContent>
                    {comparisonMetricOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Metric Interpretation Box - Now inside the card */}
            {comparisonMetric && comparisonMetric.description && (
              <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-900 dark:text-gray-100">
                      <span className="font-semibold text-gray-900 dark:text-white">What this shows:</span> {comparisonMetric.description}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      <span className="font-semibold text-gray-900 dark:text-white">How to interpret:</span> {comparisonMetric.interpretation}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      <span className="font-semibold text-gray-900 dark:text-white">Action to take:</span> {comparisonMetric.action}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Performance Scores */}
            {accountComparisonData.length > 0 && (
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {comparisonMetric?.label || 'Performance'} Scores
                    </h4>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" align="start">
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-1">How Scoring Works</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {getScoreDescription(comparisonMetric?.value)}
                            </p>
                          </div>
                          <div className="border-t pt-3">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Score Ranges</h5>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-green-500"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">70-100%:</span> Excellent - Top performers
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">40-69%:</span> Good - Room for improvement
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-red-500"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">0-39%:</span> Needs attention - Priority optimization
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t pt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Scores help identify which accounts to focus marketing efforts on based on their performance against industry benchmarks.
                            </p>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Click scores to see details
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {accountComparisonData.slice(0, showAllAccounts ? accountComparisonData.length : 10).map((account) => (
                    <div 
                      key={account.accountId}
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                        account.performanceScore >= 70 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                          : account.performanceScore >= 40 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      }`}
                    >
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{account.accountName}:</span>
                      <span className={`text-sm font-bold ${
                        account.performanceScore >= 70 
                          ? 'text-green-700 dark:text-green-400' 
                          : account.performanceScore >= 40 
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {account.performanceScore}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chart Container - Full width */}
            <div className="w-full p-6" style={{ minHeight: '500px' }}>
              <ResponsiveContainer 
                width="100%" 
                height={450}
              >
                <RechartsBarChart 
                  data={accountComparisonData.slice(0, showAllAccounts ? accountComparisonData.length : 10)}
                  margin={{ 
                    top: 20, 
                    right: accountComparisonData.length <= 2 ? 100 : 40, 
                    left: accountComparisonData.length <= 2 ? 100 : 80, 
                    bottom: accountComparisonData.length > 6 ? 120 : 80 
                  }}
                  barCategoryGap={accountComparisonData.length <= 2 ? "20%" : accountComparisonData.length <= 3 ? "30%" : accountComparisonData.length <= 6 ? "20%" : "10%"}
                >
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="account"
                    tick={{ 
                      fontSize: accountComparisonData.length > 20 ? 8 : 10,
                      fill: '#4b5563' 
                    }}
                    angle={accountComparisonData.length > 10 ? -90 : -45}
                    textAnchor="end"
                    interval={0}
                    height={accountComparisonData.length > 10 ? 120 : 100}
                  />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  domain={comparisonMetric.primary?.includes('Rate') || comparisonMetric.primary?.includes('unsub') ? [0, 'auto'] : [0, 'dataMax']}
                  tickFormatter={(value) => {
                    if (comparisonMetric.primary === 'revenue' || comparisonMetric.primary?.includes('revenue')) {
                      return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value.toFixed(0)}`
                    }
                    if (comparisonMetric.primary === 'averageOrderValue') {
                      return `${value.toFixed(0)}`
                    }
                    if (comparisonMetric.primary?.includes('Rate')) {
                      return `${value.toFixed(1)}%`
                    }
                    return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)
                  }}
                />
                {comparisonMetric.secondaryAxis && (
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                )}
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null
                    const data = payload[0]?.payload || {}
                    
                    const formatValue = (value, key) => {
                      if (key === 'revenue' || key?.includes('revenue') || key === 'averageOrderValue') return formatCurrency(value)
                      if (key?.includes('Rate')) return formatPercentage(value)
                      return formatNumber(value)
                    }
                    
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                        <p className="font-semibold mb-2">{label}</p>
                        <div className="space-y-1">
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-sm" 
                                style={{ backgroundColor: entry.fill || entry.color }}
                              />
                              <span className="text-gray-600">
                                {entry.name}: {formatValue(entry.value, entry.dataKey)}
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="rect"
                  iconSize={12}
                />
                  <Bar 
                    dataKey={comparisonMetric.primary} 
                    fill={comparisonMetric.primaryColor}
                    name={comparisonMetric.primaryLabel}
                    stackId={comparisonMetric.type === 'stacked' ? 'stack' : undefined}
                    yAxisId="left"
                    maxBarSize={accountComparisonData.length <= 2 ? 200 : accountComparisonData.length <= 3 ? 150 : accountComparisonData.length <= 6 ? 100 : 60}
                  />
                  {comparisonMetric.secondary && (
                    <Bar 
                      dataKey={comparisonMetric.secondary} 
                      fill={comparisonMetric.secondaryColor}
                      name={comparisonMetric.secondaryLabel}
                      stackId={comparisonMetric.type === 'stacked' ? 'stack' : undefined}
                      yAxisId={comparisonMetric.secondaryAxis ? 'right' : 'left'}
                      maxBarSize={accountComparisonData.length <= 2 ? 200 : accountComparisonData.length <= 3 ? 150 : accountComparisonData.length <= 6 ? 100 : 60}
                    />
                  )}
                  {comparisonMetric.tertiary && (
                    <Bar 
                      dataKey={comparisonMetric.tertiary} 
                      fill={comparisonMetric.tertiaryColor || '#9333ea'}
                      name={comparisonMetric.tertiaryLabel || 'Third Metric'}
                      stackId={comparisonMetric.type === 'stacked' ? 'stack' : undefined}
                      yAxisId="left"
                      maxBarSize={accountComparisonData.length <= 2 ? 200 : accountComparisonData.length <= 3 ? 150 : accountComparisonData.length <= 6 ? 100 : 60}
                    />
                  )}
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Show More/Less Button for Large Datasets */}
            {accountComparisonData.length > 10 && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllAccounts(!showAllAccounts)}
                  className="text-xs"
                >
                  {showAllAccounts ? 'Show Top 10 Only' : `Show All ${accountComparisonData.length} Accounts`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}


      {/* Campaign List Section */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Campaign Details</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Individual campaigns contributing to the statistics
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="mb-6 space-y-4">
            {/* Top Filter Row */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredCampaigns.length} campaigns
              </div>
              <div className="flex items-center gap-3">
                <AccountSelector
                  accounts={availableAccounts || []}
                  value={selectedAccounts}
                  onChange={onAccountsChange}
                />
                <DateRangeSelector
                  onDateRangeChange={onDateRangeChange}
                  showComparison={true}
                  storageKey="analyticsDateRange"
                  initialDateRange={dateRangeSelection}
                />
              </div>
            </div>

            {/* Channel and Search Filters */}
            <div className="flex items-center justify-between gap-4">
              {/* Channel Filter */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Channel:</span>
                <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                  <button
                    onClick={() => setCampaignChannelFilter('all')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all',
                      campaignChannelFilter === 'all' 
                        ? 'bg-white dark:bg-gray-700 text-vivid-violet shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCampaignChannelFilter('email')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                      campaignChannelFilter === 'email' 
                        ? 'bg-white dark:bg-gray-700 text-vivid-violet shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                  <button
                    onClick={() => setCampaignChannelFilter('sms')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                      campaignChannelFilter === 'sms' 
                        ? 'bg-white dark:bg-gray-700 text-vivid-violet shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </button>
                  <button
                    onClick={() => setCampaignChannelFilter('push')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                      campaignChannelFilter === 'push' 
                        ? 'bg-white dark:bg-gray-700 text-vivid-violet shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    <Bell className="h-4 w-4" />
                    Push
                  </button>
                </div>
              </div>

              {/* Tag Filter and Search */}
              <div className="flex items-center gap-3">
                {/* Tag Filter */}
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by tags..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sky-blue focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No campaigns found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Adjust your account selection or date range to see campaigns
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Account
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Campaign
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Sent Date
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Sent Count
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Open Rate
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Click Rate
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center justify-end gap-1">
                        CTOR
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Info className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg" align="end">
                            <div className="space-y-2">
                              <h5 className="font-semibold text-gray-900 dark:text-white">Click-to-Open Rate (CTOR)</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                CTOR measures how many people who opened your email also clicked on something inside it.
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Calculation:</strong> (Unique Clicks ÷ Unique Opens) × 100
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                A higher CTOR indicates that your email content is engaging and relevant to your audience.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Conv. Rate
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.slice(0, 10).map((campaign) => {
                    // Find account details for this campaign
                    const accountInfo = availableAccounts?.find(acc => acc.value === campaign.accountId) || 
                                      { label: 'Unknown Account', value: campaign.accountId };
                    
                    // Calculate CTOR (Click-to-Open Rate)
                    const ctor = (campaign.opensUnique && campaign.opensUnique > 0) 
                      ? (campaign.clicksUnique / campaign.opensUnique) * 100 
                      : 0;
                    
                    // Calculate AOV
                    const aov = (campaign.conversionUniques && campaign.conversionUniques > 0) 
                      ? campaign.revenue / campaign.conversionUniques 
                      : 0;
                    
                    // Calculate revenue per recipient
                    const revenuePerRecipient = (campaign.recipients && campaign.recipients > 0) 
                      ? campaign.revenue / campaign.recipients 
                      : 0;
                    
                    return (
                      <tr 
                        key={campaign.id} 
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Account Column */}
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-sky-blue to-vivid-violet flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">
                                  {accountInfo.label?.charAt(0)?.toUpperCase() || 'A'}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[80px]">
                                {accountInfo.label || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Campaign Column */}
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getCampaignIcon(campaign.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                                {campaign.name}
                              </p>
                              {campaign.subject && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {campaign.subject}
                                </p>
                              )}
                              <div className="mt-1">
                                {getStatusBadge(campaign.status)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sent Date Column */}
                        <td className="py-4 px-4 text-center">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">
                            {new Date(campaign.sentAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(campaign.sentAt).toLocaleDateString('en-US', {
                              year: 'numeric'
                            })}
                          </div>
                        </td>

                        {/* Sent Count Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatNumber(campaign.recipients || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatNumber(campaign.delivered || 0)} delivered
                          </div>
                        </td>

                        {/* Open Rate Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPercentage(campaign.openRate || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatNumber(campaign.opensUnique || 0)} unique
                          </div>
                        </td>

                        {/* Click Rate Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPercentage(campaign.clickRate || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatNumber(campaign.clicksUnique || 0)} unique
                          </div>
                        </td>

                        {/* CTOR Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPercentage(ctor)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            click-to-open
                          </div>
                        </td>

                        {/* Conversion Rate Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPercentage(campaign.conversionRate || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatNumber(campaign.conversionUniques || 0)} orders
                          </div>
                        </td>

                        {/* Revenue Column */}
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(campaign.revenue || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                            <div>AOV: {formatCurrency(aov)}</div>
                            <div>Per recipient: {formatCurrency(revenuePerRecipient)}</div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredCampaigns.length > 10 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    Load More Campaigns
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignsTab;
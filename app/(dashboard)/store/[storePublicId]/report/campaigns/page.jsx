"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, Search, Filter } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Mail, MousePointer,
  Eye, Target, Send, Users, DollarSign,
  ArrowUp, ArrowDown, Calendar, MessageSquare,
  Clock, CheckCircle, XCircle, AlertCircle, ArrowUpDown, Info
} from 'lucide-react';
import UpcomingCampaigns from "@/app/(dashboard)/dashboard/components/UpcomingCampaigns";
import EmailHealthScoreCard from "./components/EmailHealthScoreCard";
import EmailFatigueChart from "./components/EmailFatigueChart";
import ListQualityIndicators from "./components/ListQualityIndicators";
import CampaignDetailsModal from "@/app/(dashboard)/calendar/components/CampaignDetailsModal";
import CampaignROIMatrix from "./components/CampaignROIMatrix";
import RevenueAttributionFunnel from "./components/RevenueAttributionFunnel";
import CampaignQualityHeatmap from "./components/CampaignQualityHeatmap";
import RevenueEfficiencyTrend from "./components/RevenueEfficiencyTrend";

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreCampaignsReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { stores, isLoadingStores, selectStore } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaignsData, setCampaignsData] = useState(null);
  const [error, setError] = useState(null);
  const [storePublicId, setStorePublicId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("send_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get active tab from URL or default to "summary"
  const activeTab = searchParams?.get('tab') || 'summary';

  // Get storePublicId from params
  useEffect(() => {
    async function getStoreId() {
      const resolvedParams = await params;
      setStorePublicId(resolvedParams.storePublicId);
    }
    getStoreId();
  }, [params]);

  // Calculate default dates
  const getDefaultDateRange = () => {
    const now = new Date();
    const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const past60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    return {
      period: "last30",
      comparisonType: "previous-period",
      ranges: {
        main: {
          start: past30Days,
          end: now,
          label: "Past 30 days"
        },
        comparison: {
          start: past60Days,
          end: past30Days,
          label: "Previous 30 days"
        }
      }
    };
  };

  const [dateRangeSelection, setDateRangeSelection] = useState(getDefaultDateRange());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current store
  const currentStore = useMemo(() => {
    if (!stores || !storePublicId) return null;
    return stores.find(s => s.public_id === storePublicId);
  }, [stores, storePublicId]);

  // Memoize stores array for UpcomingCampaigns to prevent unnecessary re-fetches
  const storesForUpcoming = useMemo(() => {
    return currentStore ? [currentStore] : [];
  }, [currentStore]);

  // Handle date range changes
  const handleDateRangeChange = (newDateRangeSelection) => {
    setDateRangeSelection(newDateRangeSelection);
    localStorage.setItem('campaignsReportDateRange', JSON.stringify(newDateRangeSelection));
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      // Update the store context to synchronize with sidebar
      selectStore(newStoreId);
      // Navigate to the new store's report page
      router.push(`/store/${newStoreId}/report/campaigns`);
    }
  };

  // Handle campaign click to open modal
  const handleCampaignClick = (campaign) => {
    // Transform campaign data to match modal expectations
    const transformedCampaign = {
      ...campaign,
      // Map field names for consistency with calendar modal
      campaign_name: campaign.name,
      send_date: campaign.send_date,
      opensUnique: campaign.opens,
      clicksUnique: campaign.clicks,
      openRate: campaign.open_rate,
      clickRate: campaign.click_rate,
      conversionRate: campaign.conversion_rate,
      revenuePerRecipient: campaign.revenue_per_recipient,
      ctor: campaign.click_to_open_rate,
      deliveryRate: campaign.delivery_rate,
      bounceRate: campaign.bounce_rate,
      unsubscribeRate: campaign.unsubscribe_rate,
      spamComplaintRate: campaign.spam_complaint_rate,
      channel: campaign.type, // 'email' or 'sms'
      // Add message_id for email preview (if available)
      message_id: campaign.message_id || campaign.groupings?.campaign_message_id,
      // Store mapping
      store_public_id: storePublicId,
      klaviyo_public_id: currentStore?.klaviyo_integration?.public_id
    };

    console.log('Opening campaign modal:', transformedCampaign);
    setSelectedCampaign(transformedCampaign);
    setIsModalOpen(true);
  };

  // Fetch campaign data from API
  useEffect(() => {
    if (!storePublicId) return;

    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRangeSelection.ranges.main.start.toISOString();
        const endDate = dateRangeSelection.ranges.main.end.toISOString();

        const response = await fetch(
          `/api/store/${storePublicId}/report/campaigns?startDate=${startDate}&endDate=${endDate}`,
          {
            credentials: 'include', // Include cookies for authentication
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[Campaign Report] API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData.error || `Failed to fetch campaign data (${response.status})`);
        }

        const data = await response.json();
        console.log('[Campaign Report Frontend] Received data:', {
          totalRevenue: data.attributedRevenueSummary?.currentPeriod?.totalRevenue,
          attributedRevenue: data.attributedRevenueSummary?.currentPeriod?.attributedRevenue,
          chartDataPoints: data.attributedRevenueOverTime?.length,
          sampleChartData: data.attributedRevenueOverTime?.slice(0, 3)
        });
        setCampaignsData(data);
      } catch (err) {
        console.error('Error fetching campaign data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [storePublicId, dateRangeSelection]);

  // Fetch email health data from API
  useEffect(() => {
    if (!storePublicId) return;

    const fetchHealthData = async () => {
      try {
        setHealthLoading(true);

        const response = await fetch(
          `/api/store/${storePublicId}/report/campaigns/health`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error('[Health Data] API Error:', response.status);
          setHealthData(null);
          return;
        }

        const data = await response.json();
        console.log('[Health Data] Received:', data);
        setHealthData(data);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setHealthData(null);
      } finally {
        setHealthLoading(false);
      }
    };

    fetchHealthData();
  }, [storePublicId]);

  // Mock data for fallback - replace with actual API calls
  const mockCampaignsData = {
    summary: {
      total_campaigns: 45,
      total_sent: 285000,
      avg_open_rate: 24.5,
      avg_click_rate: 3.2,
      avg_conversion_rate: 2.1,
      total_revenue: 125000,
      total_opens: 69825,
      total_clicks: 9120,
      total_conversions: 5985
    },
    previousPeriod: {
      total_campaigns: 38,
      total_sent: 245000,
      avg_open_rate: 22.1,
      avg_click_rate: 2.8,
      avg_conversion_rate: 1.8,
      total_revenue: 98000
    },
    performanceOverTime: [
      { date: '2024-01-01', opens: 2500, clicks: 320, conversions: 85 },
      { date: '2024-01-08', opens: 2800, clicks: 380, conversions: 95 },
      { date: '2024-01-15', opens: 3200, clicks: 420, conversions: 110 },
      { date: '2024-01-22', opens: 2900, clicks: 390, conversions: 100 },
      { date: '2024-01-29', opens: 3100, clicks: 410, conversions: 105 }
    ],
    attributedRevenueOverTime: [
      { month: 'Mar 2024', attributedRevenue: 9200, totalRevenue: 24000, percentAttributed: 38.3, campaigns: 12, flows: 8 },
      { month: 'Apr 2024', attributedRevenue: 9500, totalRevenue: 23500, percentAttributed: 40.4, campaigns: 14, flows: 9 },
      { month: 'May 2024', attributedRevenue: 10800, totalRevenue: 25200, percentAttributed: 42.9, campaigns: 15, flows: 10 },
      { month: 'Jun 2024', attributedRevenue: 8200, totalRevenue: 21800, percentAttributed: 37.6, campaigns: 11, flows: 7 },
      { month: 'Jul 2024', attributedRevenue: 9800, totalRevenue: 24100, percentAttributed: 40.7, campaigns: 13, flows: 9 },
      { month: 'Aug 2024', attributedRevenue: 10200, totalRevenue: 25800, percentAttributed: 39.5, campaigns: 14, flows: 8 },
      { month: 'Sep 2024', attributedRevenue: 11000, totalRevenue: 26500, percentAttributed: 41.5, campaigns: 16, flows: 10 },
      { month: 'Oct 2024', attributedRevenue: 9400, totalRevenue: 23200, percentAttributed: 40.5, campaigns: 13, flows: 9 },
      { month: 'Nov 2024', attributedRevenue: 22500, totalRevenue: 52000, percentAttributed: 43.3, campaigns: 22, flows: 15 },
      { month: 'Dec 2024', attributedRevenue: 8900, totalRevenue: 22100, percentAttributed: 40.3, campaigns: 12, flows: 8 },
      { month: 'Jan 2025', attributedRevenue: 10600, totalRevenue: 25800, percentAttributed: 41.1, campaigns: 15, flows: 10 },
      { month: 'Feb 2025', attributedRevenue: 9800, totalRevenue: 24200, percentAttributed: 40.5, campaigns: 14, flows: 9 },
      { month: 'Mar 2025', attributedRevenue: 9900, totalRevenue: 24500, percentAttributed: 40.4, campaigns: 13, flows: 9 }
    ],
    attributedRevenueSummary: {
      currentPeriod: {
        attributedRevenue: 9603.94,
        totalRevenue: 24937.91,
        percentAttributed: 38.5,
        change: 11.5
      },
      previousPeriod: {
        attributedRevenue: 8614.52,
        totalRevenue: 20559.58,
        percentAttributed: 41.9
      }
    },
    campaigns: [
      {
        id: 1,
        name: "New Year Sale Campaign",
        status: "sent",
        send_date: "2024-01-01",
        recipients: 25000,
        opens: 7500,
        open_rate: 30,
        clicks: 1250,
        click_rate: 5,
        conversions: 375,
        conversion_rate: 1.5,
        revenue: 18750,
        type: "email"
      },
      {
        id: 2,
        name: "Product Launch Announcement",
        status: "sent",
        send_date: "2024-01-15",
        recipients: 30000,
        opens: 8100,
        open_rate: 27,
        clicks: 1080,
        click_rate: 3.6,
        conversions: 324,
        conversion_rate: 1.08,
        revenue: 21600,
        type: "email"
      },
      {
        id: 3,
        name: "Valentine's Day Special",
        status: "scheduled",
        send_date: "2024-02-14",
        recipients: 35000,
        type: "email"
      },
      {
        id: 4,
        name: "SMS Flash Sale",
        status: "sent",
        send_date: "2024-01-20",
        recipients: 15000,
        opens: 4500,
        open_rate: 30,
        clicks: 900,
        click_rate: 6,
        conversions: 450,
        conversion_rate: 3,
        revenue: 13500,
        type: "sms"
      }
    ],
    campaignTypes: [
      { type: "Promotional", count: 25, percentage: 55.6 },
      { type: "Informational", count: 12, percentage: 26.7 },
      { type: "Seasonal", count: 8, percentage: 17.7 }
    ]
  };

  // Calculate metric changes
  const getPercentageChange = (current, previous) => {
    // Handle null, undefined, or NaN values
    const currentVal = Number(current) || 0;
    const previousVal = Number(previous) || 0;

    // If both are 0, show 0% change
    if (currentVal === 0 && previousVal === 0) return 0;
    // If previous is 0 but current is not, show 100% (or could show "New" instead)
    if (previousVal === 0) return currentVal > 0 ? 100 : 0;

    const change = ((currentVal - previousVal) / previousVal) * 100;

    // Cap at reasonable values to avoid display issues
    if (change > 10000) return 10000;
    if (change < -10000) return -10000;

    return change;
  };

  // Render change indicator with proper styling and previous period value
  const renderChangeIndicator = (current, previous, metricType = 'number') => {
    const currentVal = Number(current) || 0;
    const previousVal = Number(previous) || 0;

    // If both current and previous are 0, show "No change"
    if (currentVal === 0 && previousVal === 0) {
      return (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No change
        </p>
      );
    }

    const change = getPercentageChange(current, previous);

    // Determine color and icon based on change
    const isPositive = change > 0;
    const isZero = change === 0;
    const colorClass = isZero
      ? "text-gray-500 dark:text-gray-400"
      : isPositive
        ? "text-green-600 dark:text-green-500"
        : "text-red-600 dark:text-red-500";
    const Icon = isZero ? null : isPositive ? ArrowUp : ArrowDown;

    // Format both current and previous period values based on metric type
    let formattedCurrent = '';
    let formattedPrevious = '';
    if (metricType === 'currency') {
      formattedCurrent = formatCurrency(currentVal);
      formattedPrevious = formatCurrency(previousVal);
    } else if (metricType === 'percentage') {
      formattedCurrent = formatPercentage(currentVal);
      formattedPrevious = formatPercentage(previousVal);
    } else {
      formattedCurrent = formatNumber(currentVal);
      formattedPrevious = formatNumber(previousVal);
    }

    return (
      <div className="space-y-0.5">
        <p className={`text-xs flex items-center ${colorClass}`}>
          {Icon && <Icon className="h-3 w-3 mr-1" />}
          {formatPercentage(Math.abs(change))} from last period
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Previous: {formattedPrevious}
        </p>
      </div>
    );
  };

  // Use real data or fallback to mock data
  const data = campaignsData || mockCampaignsData || {
    summary: {},
    campaigns: [],
    performanceOverTime: [],
    attributedRevenueOverTime: []
  };

  // Filter campaigns
  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle tab change with URL update
  const handleTabChange = (tab) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.push(url.pathname + url.search);
  };

  const filteredCampaigns = useMemo(() => {
    if (!data.campaigns) return [];

    let filtered = data.campaigns;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);

        case 'send_date':
          aVal = a.send_date ? new Date(a.send_date).getTime() : 0;
          bVal = b.send_date ? new Date(b.send_date).getTime() : 0;
          break;

        case 'recipients':
        case 'opens':
        case 'clicks':
        case 'open_rate':
        case 'click_rate':
        case 'click_to_open_rate':
        case 'conversion_rate':
        case 'conversions':
        case 'average_order_value':
        case 'revenue_per_recipient':
        case 'revenue':
        case 'delivery_rate':
          aVal = a[sortField] || 0;
          bVal = b[sortField] || 0;
          break;

        default:
          return 0;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [data.campaigns, searchQuery, statusFilter, sortField, sortDirection]);

  // Show loading state
  if (loading && !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" showText={true} text="Loading campaign data..." />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Campaigns Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Email & SMS campaign performance for {currentStore?.name || 'store'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={storePublicId || ''} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-[200px]">
              <Store className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select a store">
                {currentStore?.name || 'Select store'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stores && stores.map(store => (
                <SelectItem key={store.public_id} value={store.public_id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      store.klaviyo_integration?.public_id ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {store.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateRangeSelector
            onDateRangeChange={handleDateRangeChange}
            storageKey="campaignsReportDateRange"
            showComparison={true}
            initialDateRange={dateRangeSelection}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hover:bg-sky-tint/50 transition-all"
          >
            {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <div className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-200">Error loading campaign data</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                {error.includes('Unauthorized') && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Please ensure you're logged in and have access to this store.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <MorphingLoader size="medium" showText={true} text="Loading campaigns..." />
        </div>
      )}

      {/* Tabs Navigation */}
      {!loading && !error && (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-sky-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.total_campaigns}</div>
            {renderChangeIndicator(data.summary.total_campaigns, data.previousPeriod.total_campaigns, 'number')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-vivid-violet" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(data.summary.avg_open_rate)}</div>
            {renderChangeIndicator(data.summary.avg_open_rate, data.previousPeriod.avg_open_rate, 'percentage')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-deep-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(data.summary.avg_click_rate)}</div>
            {renderChangeIndicator(data.summary.avg_click_rate, data.previousPeriod.avg_click_rate, 'percentage')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.summary.total_revenue)}</div>
            {renderChangeIndicator(data.summary.total_revenue, data.previousPeriod.total_revenue, 'currency')}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Side by Side */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attributed Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Attributed Revenue
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900 dark:text-white">Attribution Metrics</p>
                      <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                        <li><strong>Total Store Revenue:</strong> All revenue from your store (light purple bars)</li>
                        <li><strong>Attributed Revenue:</strong> Revenue directly from email/SMS campaigns (green bars)</li>
                        <li><strong>Percent Attributed:</strong> What % of total revenue comes from campaigns (blue line)</li>
                        <li><strong>Campaigns:</strong> Number of campaigns sent that period (purple dotted line)</li>
                      </ul>
                      <p className="text-xs mt-2 pt-2 border-t text-gray-900 dark:text-white font-semibold">
                        How to Use:
                      </p>
                      <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                        <li>• Compare green vs light purple bars to see campaign impact</li>
                        <li>• Blue line shows campaign effectiveness over time</li>
                        <li>• If percent attributed drops, campaigns may need optimization</li>
                        <li>• Track correlation between campaign count and attributed revenue</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Store Revenue</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.attributedRevenueSummary.currentPeriod.totalRevenue)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">vs. {formatCurrency(data.attributedRevenueSummary.previousPeriod.totalRevenue)} previous period</span>
                  <Badge variant="success" className="ml-2">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    21.3%
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Attributed Revenue</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.attributedRevenueSummary.currentPeriod.attributedRevenue)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">vs. {formatCurrency(data.attributedRevenueSummary.previousPeriod.attributedRevenue)} previous period</span>
                  <Badge variant="success" className="ml-2">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {typeof data.attributedRevenueSummary.currentPeriod.change === 'number'
                      ? data.attributedRevenueSummary.currentPeriod.change.toFixed(1)
                      : '0.0'}%
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Percent of Total</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof data.attributedRevenueSummary.currentPeriod.percentAttributed === 'number'
                    ? data.attributedRevenueSummary.currentPeriod.percentAttributed.toFixed(1)
                    : '0.0'}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    vs. {typeof data.attributedRevenueSummary.previousPeriod.percentAttributed === 'number'
                      ? data.attributedRevenueSummary.previousPeriod.percentAttributed.toFixed(1)
                      : '0.0'}% previous period
                  </span>
                  <Badge variant="destructive" className="ml-2">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    {typeof data.attributedRevenueSummary.currentPeriod.percentAttributed === 'number' &&
                     typeof data.attributedRevenueSummary.previousPeriod.percentAttributed === 'number'
                      ? Math.abs(data.attributedRevenueSummary.currentPeriod.percentAttributed -
                                 data.attributedRevenueSummary.previousPeriod.percentAttributed).toFixed(1)
                      : '0.0'}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.attributedRevenueOverTime} barGap={-32}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{
                    color: '#111827'
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Attributed Revenue') return formatCurrency(value);
                    if (name === 'Total Store Revenue') return formatCurrency(value);
                    if (name === 'Percent Attributed') return `${value.toFixed(1)}%`;
                    if (name === 'Campaigns') return value;
                    return null; // Hide flows
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px'
                  }}
                  formatter={(value) => {
                    if (value === 'Flows') return null; // Hide flows from legend
                    return value;
                  }}
                />

                {/* Bar for Total Store Revenue (larger, background - light purple) */}
                <Bar
                  yAxisId="left"
                  dataKey="totalRevenue"
                  name="Total Store Revenue"
                  fill="#C4B5FD"
                  opacity={0.6}
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />

                {/* Bar for Attributed Revenue (smaller, foreground - vibrant emerald) */}
                <Bar
                  yAxisId="left"
                  dataKey="attributedRevenue"
                  name="Attributed Revenue"
                  fill="#10B981"
                  opacity={1}
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />

                {/* Line for Percent Attributed - Sky Blue */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="percentAttributed"
                  name="Percent Attributed"
                  stroke="#60A5FA"
                  strokeWidth={3}
                  dot={{ fill: '#60A5FA', r: 5, strokeWidth: 2, stroke: '#fff' }}
                />

                {/* Line for Campaigns - Vivid Violet */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="campaigns"
                  name="Campaigns"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  strokeDasharray="5 5"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Campaign Performance Over Time
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900 dark:text-white">Engagement Funnel</p>
                      <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                        <li><strong>Opens:</strong> How many recipients opened your emails (blue bars)</li>
                        <li><strong>Clicks:</strong> How many clicked links in your emails (purple bars)</li>
                        <li><strong>Conversions:</strong> How many made a purchase (green bars)</li>
                      </ul>
                      <p className="text-xs mt-2 pt-2 border-t text-gray-900 dark:text-white font-semibold">
                        How to Use:
                      </p>
                      <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                        <li>• Look for consistent growth trends across all three metrics</li>
                        <li>• If opens high but clicks low = weak email content/CTAs</li>
                        <li>• If clicks high but conversions low = landing page issues</li>
                        <li>• Compare week-over-week to identify what's working</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Open Rate</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.summary.avg_open_rate)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">vs. {formatPercentage(data.previousPeriod.avg_open_rate)} previous period</span>
                  <Badge variant="success" className="ml-2">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {Math.abs(data.summary.avg_open_rate - data.previousPeriod.avg_open_rate).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Click Rate</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.summary.avg_click_rate)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">vs. {formatPercentage(data.previousPeriod.avg_click_rate)} previous period</span>
                  <Badge variant="success" className="ml-2">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {Math.abs(data.summary.avg_click_rate - data.previousPeriod.avg_click_rate).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.summary.avg_conversion_rate)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">vs. {formatPercentage(data.previousPeriod.avg_conversion_rate)} previous period</span>
                  <Badge variant="success" className="ml-2">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {Math.abs(data.summary.avg_conversion_rate - data.previousPeriod.avg_conversion_rate).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="date" tick={{ fill: 'currentColor' }} />
                <YAxis tick={{ fill: 'currentColor' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{
                    color: '#111827'
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}
                />
                <Legend />
                <Bar dataKey="opens" fill="#60A5FA" name="Opens" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="#8B5CF6" name="Clicks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="#22C55E" name="Conversions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* List Quality Indicators - 4 Metric Cards */}
      <ListQualityIndicators healthData={healthData} loading={healthLoading} />

      {/* Email Fatigue Analysis Chart with Health Score */}
      <EmailFatigueChart healthData={healthData} loading={healthLoading} />

      {/* Advanced Analytics Section - moved from Campaigns tab */}
      {data?.campaigns && data.campaigns.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Advanced Analytics & Insights
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Data-driven insights and actionable recommendations to optimize your campaign performance
              </p>
            </div>
          </div>

          {/* ROI Matrix & Attribution Funnel */}
          <div className="grid md:grid-cols-2 gap-6">
            <CampaignROIMatrix
              campaigns={data.campaigns.map(c => ({
                ...c,
                campaign_name: c.name,
                statistics: {
                  click_rate: c.click_rate,
                  conversion_rate: c.conversion_rate,
                  revenue: c.revenue
                }
              }))}
              loading={loading}
            />
            <RevenueAttributionFunnel
              campaigns={data.campaigns}
              loading={loading}
            />
          </div>

          {/* Quality Heatmap */}
          <CampaignQualityHeatmap
            campaigns={data.campaigns.map(c => ({
              ...c,
              campaign_name: c.name,
              send_time: c.send_date,
              statistics: {
                open_rate: c.open_rate,
                click_rate: c.click_rate,
                conversion_rate: c.conversion_rate,
                revenue: c.revenue
              }
            }))}
            loading={loading}
          />

          {/* Revenue Efficiency Analysis */}
          <RevenueEfficiencyTrend
            campaigns={data.campaigns.map(c => ({
              ...c,
              campaign_name: c.name,
              send_time: c.send_date,
              statistics: {
                recipients: c.recipients,
                conversion_value: c.revenue,
                revenue_per_recipient: c.revenue_per_recipient,
                average_order_value: c.average_order_value
              }
            }))}
            loading={loading}
          />
        </div>
      )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
      {/* Upcoming Campaigns - First */}
      <UpcomingCampaigns
        stores={storesForUpcoming}
      />

      {/* Recent Campaigns Table - Second */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Detailed campaign performance metrics</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-visible">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-auto min-w-[140px]">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Campaign
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead className="text-right w-[70px]">
                    <button
                      onClick={() => handleSort('recipients')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Recip.
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[60px]">
                    <button
                      onClick={() => handleSort('opens')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Opens
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[60px]">
                    <button
                      onClick={() => handleSort('clicks')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Clicks
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[60px]">
                    <button
                      onClick={() => handleSort('click_to_open_rate')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      CTOR
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[70px]">
                    <button
                      onClick={() => handleSort('conversion_rate')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Conv.
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[60px]">
                    <button
                      onClick={() => handleSort('conversions')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Orders
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[70px]">
                    <button
                      onClick={() => handleSort('average_order_value')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      AOV
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[70px]">
                    <button
                      onClick={() => handleSort('revenue_per_recipient')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      $/Recip
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[70px]">
                    <button
                      onClick={() => handleSort('revenue')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Revenue
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right w-[60px]">
                    <button
                      onClick={() => handleSort('delivery_rate')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-white text-xs"
                    >
                      Deliv.
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => {
                  // Format send_date
                  const sendDate = campaign.send_date ? new Date(campaign.send_date) : null;
                  const formattedDate = sendDate ? sendDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : '';

                  // Shorten campaign name - extract key part
                  const shortenedName = campaign.name
                    ? campaign.name.replace(/Email Campaign - |SMS Campaign - /gi, '').trim()
                    : 'Untitled';

                  return (
                  <TableRow
                    key={campaign.id}
                    className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleCampaignClick(campaign)}
                  >
                    <TableCell className="py-2">
                      <div className="max-w-[160px]">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm" title={campaign.name}>
                          {shortenedName}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{formattedDate}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {campaign.type === 'email' ? <Mail className="h-4 w-4 text-blue-500" /> : <MessageSquare className="h-4 w-4 text-green-500" />}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm">{formatNumber(campaign.recipients)}</span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      {campaign.type === 'email' ? (
                        <span className="text-gray-900 dark:text-gray-100 text-sm">
                          {campaign.open_rate ? `${campaign.open_rate.toFixed(2)}%` : '0.00%'}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm">
                        {campaign.click_rate ? `${campaign.click_rate.toFixed(2)}%` : '0.00%'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      {campaign.type === 'email' ? (
                        <span className="text-gray-900 dark:text-gray-100 text-sm">
                          {campaign.click_to_open_rate ? `${(campaign.click_to_open_rate * 100).toFixed(2)}%` : '0.00%'}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm">
                        {campaign.conversion_rate ? `${campaign.conversion_rate.toFixed(2)}%` : '0.00%'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm">
                        {campaign.conversions ? formatNumber(campaign.conversions) : '0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm">
                        {campaign.average_order_value ? formatCurrency(campaign.average_order_value) : '$0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm">
                        {campaign.revenue_per_recipient ? formatCurrency(campaign.revenue_per_recipient) : '$0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <span className="text-gray-900 dark:text-gray-100 text-sm">
                        {campaign.revenue ? formatCurrency(campaign.revenue) : '$0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      {campaign.type === 'email' ? (
                        <span className="text-gray-900 dark:text-gray-100 text-sm">
                          {campaign.delivery_rate ? `${(campaign.delivery_rate * 100).toFixed(2)}%` : '0.00%'}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCampaign(null);
          }}
          stores={stores || []}
        />
      )}
    </div>
  );
}
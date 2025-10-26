"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, ArrowUpDown } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign,
  Users, Mail, ArrowUp, ArrowDown
} from 'lucide-react';

// Design system colors from design-principles.md
const COLORS = [
  '#60A5FA', // Sky blue (primary brand)
  '#8B5CF6', // Vivid violet (secondary)
  '#22C55E', // Success green
  '#F59E0B', // Warning amber
  '#EF4444', // Danger red
  '#2563EB', // Royal blue
  '#7C3AED', // Deep purple
  '#34D399', // Emerald
  '#FBBF24', // Amber
  '#F87171'  // Red
];

const METRIC_OPTIONS = [
  { value: 'recipients', label: 'Recipients', color: '#3b82f6' },
  { value: 'opens', label: 'Unique Opens', color: '#10b981' },
  { value: 'clicks', label: 'Unique Clicks', color: '#f59e0b' },
  { value: 'conversions', label: 'Conversions', color: '#8b5cf6' },
  { value: 'open_rate', label: 'Open Rate %', color: '#06b6d4' },
  { value: 'click_rate', label: 'Click Rate %', color: '#ec4899' },
  { value: 'conversion_rate', label: 'Conversion Rate %', color: '#ef4444' },
  { value: 'revenue', label: 'Revenue', color: '#10b981' },
];

// Helper function to get metric label
function getMetricLabel(metric) {
  const labels = {
    open_rate: 'Open Rate',
    click_rate: 'Click Rate',
    conversion_rate: 'Conversion Rate',
    recipients: 'Recipients',
    opens_unique: 'Unique Opens',
    clicks_unique: 'Unique Clicks',
    conversions: 'Conversions',
    conversion_value: 'Revenue'
  };
  return labels[metric] || metric;
}

// Helper function to format dates in a friendly way (e.g., "27th Sept")
function formatFriendlyDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });

  // Add ordinal suffix (st, nd, rd, th)
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return `${getOrdinal(day)} ${month}`;
}

// Helper function to prepare time series data for multiple flows
function prepareTimeSeriesData(performanceOverTime, selectedFlows, selectedMetric) {
  if (!performanceOverTime || Object.keys(performanceOverTime).length === 0) {
    return [];
  }

  // Convert performanceOverTime object to array sorted by date
  const sortedDates = Object.keys(performanceOverTime).sort();

  const timeSeriesData = sortedDates.map(date => {
    const dayData = performanceOverTime[date];
    const dataPoint = { date };

    if (!selectedFlows || selectedFlows.length === 0) {
      // If no flows selected, aggregate all flows for this date
      const flowNames = Object.keys(dayData);
      const aggregated = flowNames.reduce((acc, flowName) => {
        const flowData = dayData[flowName];
        return {
          recipients: acc.recipients + (flowData.recipients || 0),
          delivered: acc.delivered + (flowData.delivered || 0),
          opens_unique: acc.opens_unique + (flowData.opens_unique || 0),
          clicks_unique: acc.clicks_unique + (flowData.clicks_unique || 0),
          conversions: acc.conversions + (flowData.conversions || 0),
          conversion_value: acc.conversion_value + (flowData.conversion_value || 0)
        };
      }, { recipients: 0, delivered: 0, opens_unique: 0, clicks_unique: 0, conversions: 0, conversion_value: 0 });

      // Calculate aggregated value
      let value;
      if (selectedMetric === 'open_rate') {
        value = aggregated.delivered > 0 ? (aggregated.opens_unique / aggregated.delivered) * 100 : 0;
      } else if (selectedMetric === 'click_rate') {
        value = aggregated.delivered > 0 ? (aggregated.clicks_unique / aggregated.delivered) * 100 : 0;
      } else if (selectedMetric === 'conversion_rate') {
        value = aggregated.delivered > 0 ? (aggregated.conversions / aggregated.delivered) * 100 : 0;
      } else {
        value = aggregated[selectedMetric] || 0;
      }

      dataPoint['All Flows'] = value;
    } else {
      // Add data for each selected flow
      selectedFlows.forEach(flowName => {
        const flowData = dayData[flowName];
        if (flowData) {
          dataPoint[flowName] = flowData[selectedMetric] || 0;
        } else {
          dataPoint[flowName] = 0;
        }
      });
    }

    return dataPoint;
  });

  return timeSeriesData;
}

// Helper function to get available flows from performance data
function getAvailableFlows(performanceOverTime) {
  if (!performanceOverTime || Object.keys(performanceOverTime).length === 0) {
    return [];
  }

  const flowSet = new Set();
  Object.values(performanceOverTime).forEach(dayData => {
    Object.keys(dayData).forEach(flowName => flowSet.add(flowName));
  });

  return Array.from(flowSet).sort();
}

// Helper function to prepare funnel data for a selected message
function prepareMessageFunnelData(messages, selectedMessageId) {
  if (!messages || messages.length === 0 || !selectedMessageId) {
    return [];
  }

  const message = messages.find(m => m.flow_message_id === selectedMessageId);
  if (!message) {
    return [];
  }

  const recipients = message.recipients || 0;
  const delivered = message.delivered || 0;
  const opens = message.opens || 0;
  const clicks = message.clicks || 0;
  const conversions = message.conversions || 0;

  // Calculate percentages (of recipients)
  const deliveredPct = recipients > 0 ? (delivered / recipients) * 100 : 0;
  const opensPct = recipients > 0 ? (opens / recipients) * 100 : 0;
  const clicksPct = recipients > 0 ? (clicks / recipients) * 100 : 0;
  const conversionsPct = recipients > 0 ? (conversions / recipients) * 100 : 0;

  return [
    { stage: 'Recipients', value: recipients, percentage: 100 },
    { stage: 'Delivered', value: delivered, percentage: deliveredPct },
    { stage: 'Opened', value: opens, percentage: opensPct },
    { stage: 'Clicked', value: clicks, percentage: clicksPct },
    { stage: 'Converted', value: conversions, percentage: conversionsPct }
  ];
}

// Helper function to get unique messages with flow context
function getUniqueMessages(messages) {
  if (!messages || messages.length === 0) {
    return [];
  }

  return messages.map(msg => ({
    value: msg.flow_message_id,
    label: `${msg.flow_name} - ${msg.flow_message_name || 'Message ' + msg.flow_message_id.substring(0, 8)}`,
    flow_name: msg.flow_name,
    message_name: msg.flow_message_name || msg.flow_message_id,
    full_data: msg
  }));
}

// Helper function to prepare message time series data
function prepareMessageTimeSeriesData(messagePerformanceOverTime, selectedMessages, selectedMetric) {
  if (!messagePerformanceOverTime || Object.keys(messagePerformanceOverTime).length === 0) {
    return [];
  }

  // Convert to array sorted by date
  const sortedDates = Object.keys(messagePerformanceOverTime).sort();

  const timeSeriesData = sortedDates.map(date => {
    const dayData = messagePerformanceOverTime[date];
    const dataPoint = { date };

    if (!selectedMessages || selectedMessages.length === 0) {
      return dataPoint;
    }

    // Add data for each selected message
    selectedMessages.forEach(msg => {
      const messageData = dayData[msg.value];
      if (messageData) {
        dataPoint[msg.label] = messageData[selectedMetric] || 0;
      } else {
        dataPoint[msg.label] = 0;
      }
    });

    return dataPoint;
  });

  return timeSeriesData;
}

export default function StoreFlowsReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores, selectStore } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flowsData, setFlowsData] = useState(null);
  const [error, setError] = useState(null);
  const [storePublicId, setStorePublicId] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([
    { value: 'recipients', label: 'Recipients' },
    { value: 'opens', label: 'Unique Opens' },
    { value: 'clicks', label: 'Unique Clicks' },
    { value: 'conversions', label: 'Conversions' }
  ]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [sortColumn, setSortColumn] = useState('recipients');
  const [sortDirection, setSortDirection] = useState('desc');

  // Message Level sorting
  const [messageSortColumn, setMessageSortColumn] = useState('recipients');
  const [messageSortDirection, setMessageSortDirection] = useState('desc');

  // Flow Aggregate View selections
  const [selectedEngagementFlows, setSelectedEngagementFlows] = useState([]);
  const [selectedEngagementMetric, setSelectedEngagementMetric] = useState('open_rate');
  const [selectedComparisonFlows, setSelectedComparisonFlows] = useState([]);
  const [selectedRevenueFlows, setSelectedRevenueFlows] = useState([]);
  const [hiddenFlowLines, setHiddenFlowLines] = useState(new Set());

  // Flow Performance Over Time chart selections
  const [selectedFlowMetric, setSelectedFlowMetric] = useState('conversion_value');
  const [selectedFlowsForChart, setSelectedFlowsForChart] = useState([]);

  // Message Level View selections
  const [selectedMessageEngagementMessages, setSelectedMessageEngagementMessages] = useState([]);
  const [selectedMessageEngagementMetric, setSelectedMessageEngagementMetric] = useState('open_rate');
  const [selectedMessageFunnel, setSelectedMessageFunnel] = useState(null);
  const [selectedMessageComparison, setSelectedMessageComparison] = useState([]);
  const [selectedMessageComparisonMetric, setSelectedMessageComparisonMetric] = useState('recipients');
  const [selectedMessageRevenue, setSelectedMessageRevenue] = useState([]);
  const [hiddenMessageLines, setHiddenMessageLines] = useState(new Set());

  // Get tab from URL
  const [view, setView] = useState('aggregate');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'message-level') {
        setView('messages');
      }
    }
  }, []);

  // Reset hidden lines when selected messages change
  useEffect(() => {
    setHiddenMessageLines(new Set());
  }, [selectedMessageEngagementMessages]);

  // Reset hidden flow lines when selected flows change
  useEffect(() => {
    setHiddenFlowLines(new Set());
  }, [selectedEngagementFlows]);

  // Update URL when tab changes
  const handleTabChange = (newTab) => {
    setView(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newTab === 'messages') {
        url.searchParams.set('tab', 'message-level');
      } else {
        url.searchParams.delete('tab');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

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

  // Handle date range changes
  const handleDateRangeChange = (newDateRangeSelection) => {
    setDateRangeSelection(newDateRangeSelection);
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      // Update the store context to synchronize with sidebar
      selectStore(newStoreId);
      // Navigate to the new store's report page
      router.push(`/store/${newStoreId}/report/flows`);
    }
  };

  // Fetch flow data from API
  useEffect(() => {
    if (!storePublicId) return;

    const fetchFlowData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRangeSelection.ranges.main.start.toISOString();
        const endDate = dateRangeSelection.ranges.main.end.toISOString();

        const response = await fetch(
          `/api/store/${storePublicId}/report/flows?startDate=${startDate}&endDate=${endDate}`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[Flow Report] API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData.error || `Failed to fetch flow data (${response.status})`);
        }

        const data = await response.json();
        setFlowsData(data);

        // Preselect all messages for the time series chart
        if (data.messages && data.messages.length > 0) {
          const allMessages = getUniqueMessages(data.messages);
          setSelectedMessageEngagementMessages(allMessages);
        }
      } catch (err) {
        console.error('Error fetching flow data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlowData();
  }, [storePublicId, dateRangeSelection]);

  // Use real data or mock data
  const data = flowsData || {
    flows: [],
    summary: {
      total_recipients: 0,
      total_revenue: 0,
      avg_open_rate: 0,
      avg_click_rate: 0,
      avg_conversion_rate: 0
    },
    previousPeriod: {
      total_recipients: 0,
      total_revenue: 0,
      avg_open_rate: 0,
      avg_click_rate: 0
    }
  };

  // Calculate metrics
  const totalMetrics = data.flows.reduce((acc, flow) => ({
    recipients: acc.recipients + (flow.recipients || 0),
    delivered: acc.delivered + (flow.delivered || 0),
    opens: acc.opens + (flow.opens_unique || 0),
    clicks: acc.clicks + (flow.clicks_unique || 0),
    conversions: acc.conversions + (flow.conversions || 0),
    revenue: acc.revenue + (flow.conversion_value || 0)
  }), { recipients: 0, delivered: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0 });

  const avgOpenRate = data.summary?.avg_open_rate || 0;
  const avgClickRate = data.summary?.avg_click_rate || 0;
  const avgConversionRate = data.summary?.avg_conversion_rate || 0;

  // Calculate changes
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const recipientsChange = calculateChange(totalMetrics.recipients, data.previousPeriod?.total_recipients);
  const openRateChange = calculateChange(avgOpenRate, data.previousPeriod?.avg_open_rate);
  const clickRateChange = calculateChange(avgClickRate, data.previousPeriod?.avg_click_rate);
  const revenueChange = calculateChange(totalMetrics.revenue, data.previousPeriod?.total_revenue);

  // Handle sorting for flows
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Handle sorting for messages
  const handleMessageSort = (column) => {
    if (messageSortColumn === column) {
      setMessageSortDirection(messageSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setMessageSortColumn(column);
      setMessageSortDirection('desc');
    }
  };

  // Sort flows data
  const sortedFlows = [...data.flows].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle flow_name (string)
    if (sortColumn === 'flow_name') {
      aVal = aVal || '';
      bVal = bVal || '';
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    // Handle numeric values
    aVal = aVal || 0;
    bVal = bVal || 0;
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Sort messages data
  const sortedMessages = [...(data.messages || [])].sort((a, b) => {
    let aVal = a[messageSortColumn];
    let bVal = b[messageSortColumn];

    // Handle string columns
    if (messageSortColumn === 'flow_name' || messageSortColumn === 'flow_message_name') {
      aVal = aVal || '';
      bVal = bVal || '';
      return messageSortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    // Handle numeric values
    aVal = aVal || 0;
    bVal = bVal || 0;
    return messageSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Prepare time series data for Flow Performance Over Time chart
  const flowTimeSeriesData = useMemo(() => {
    if (!data.performanceOverTime) return [];
    return prepareTimeSeriesData(
      data.performanceOverTime,
      selectedFlowsForChart.map(f => f.value || f.label),
      selectedFlowMetric
    );
  }, [data.performanceOverTime, selectedFlowsForChart, selectedFlowMetric]);

  // Auto-select top 5 revenue-performing flows on initial load
  useEffect(() => {
    if (data.flows && data.flows.length > 0 && selectedFlowsForChart.length === 0) {
      // Sort flows by revenue (conversion_value) descending
      const topFlows = [...data.flows]
        .sort((a, b) => (b.conversion_value || 0) - (a.conversion_value || 0))
        .slice(0, 5)
        .map(f => ({ value: f.flow_name, label: f.flow_name }));

      setSelectedFlowsForChart(topFlows);
    }
  }, [data.flows]);

  // Filter messages for selected flow
  const messageData = selectedFlow
    ? (data.messages || []).filter(msg => msg.flow_name === selectedFlow)
    : [];

  // Handle legend click to toggle line visibility for messages
  const handleLegendClick = (e) => {
    const dataKey = e.dataKey;
    setHiddenMessageLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  // Handle legend click to toggle line visibility for flows
  const handleFlowLegendClick = (e) => {
    const dataKey = e.dataKey;
    setHiddenFlowLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  // Show loading state
  if (loading && !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" showText={true} text="Loading flow data..." />
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, trend }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        {subtitle && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</div>}
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-sm mt-2 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend > 0 ? <ArrowUp className="h-3 w-3" /> : trend < 0 ? <ArrowDown className="h-3 w-3" /> : null}
            {Math.abs(trend).toFixed(1)}% vs last period
          </div>
        )}
      </CardContent>
    </Card>
  );

  const SortableHeader = ({ column, label, align = "left" }) => (
    <TableHead
      className={`text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortColumn === column ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </TableHead>
  );

  const MessageSortableHeader = ({ column, label, align = "left" }) => (
    <TableHead
      className={`text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}`}
      onClick={() => handleMessageSort(column)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${messageSortColumn === column ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Flow Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and analyze your Klaviyo flow performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={storePublicId || ""} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-[240px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Store className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {stores?.map((store) => (
                <SelectItem key={store.public_id} value={store.public_id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeSelector
            value={dateRangeSelection}
            onDateRangeChange={handleDateRangeChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Tabs for View Selection */}
      <Tabs value={view} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="aggregate">Flow Aggregate View</TabsTrigger>
          <TabsTrigger value="messages">Message Level View</TabsTrigger>
        </TabsList>

        {/* Flow Aggregate View */}
        <TabsContent value="aggregate">
          {!loading && !error && (
            <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Recipients"
              value={formatNumber(totalMetrics.recipients)}
              trend={recipientsChange}
            />
            <MetricCard
              title="Avg Open Rate"
              value={formatPercentage(avgOpenRate)}
              subtitle="Across all flows"
              trend={openRateChange}
            />
            <MetricCard
              title="Avg Click Rate"
              value={formatPercentage(avgClickRate)}
              subtitle="Across all flows"
              trend={clickRateChange}
            />
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(totalMetrics.revenue)}
              trend={revenueChange}
            />
          </div>

          {/* Detailed Flow Table */}
          <Card>
            <CardHeader>
              <CardTitle>Flow Details</CardTitle>
              <CardDescription>Click column headers to sort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-visible">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <SortableHeader column="flow_name" label="Flow Name" />
                      <SortableHeader column="recipients" label="Recipients" align="right" />
                      <SortableHeader column="open_rate" label="Open Rate" align="right" />
                      <SortableHeader column="click_rate" label="Click Rate" align="right" />
                      <SortableHeader column="conversion_rate" label="Conv Rate" align="right" />
                      <SortableHeader column="conversion_value" label="Revenue" align="right" />
                      <SortableHeader column="revenue_per_recipient" label="RPR" align="right" />
                      <SortableHeader column="bounce_rate" label="Bounce Rate" align="right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFlows.map((flow, idx) => {
                      // Calculate changes vs previous period
                      const prevPeriod = flow.previous_period;
                      const calcChange = (current, previous) => {
                        // If both are 0, show 0% change
                        if (current === 0 && previous === 0) return 0;
                        // If previous is 0 but current is not, we can't calculate meaningful percentage
                        if (!previous || previous === 0) return 0;
                        return ((current - previous) / previous) * 100;
                      };

                      const recipientsChange = prevPeriod ? calcChange(flow.recipients, prevPeriod.recipients) : null;
                      const openRateChange = prevPeriod ? calcChange(flow.open_rate, prevPeriod.open_rate) : null;
                      const clickRateChange = prevPeriod ? calcChange(flow.click_rate, prevPeriod.click_rate) : null;
                      const convRateChange = prevPeriod ? calcChange(flow.conversion_rate, prevPeriod.conversion_rate) : null;
                      const revenueChange = prevPeriod ? calcChange(flow.conversion_value, prevPeriod.conversion_value || prevPeriod.revenue) : null;
                      const rprChange = prevPeriod ? calcChange(flow.revenue_per_recipient, prevPeriod.revenue_per_recipient) : null;
                      const bounceRateChange = prevPeriod ? calcChange(flow.bounce_rate, prevPeriod.bounce_rate) : null;

                      const ChangeIndicator = ({ change, previousValue, formatter, inverse = false }) => {
                        if (change === null || change === undefined) return null;
                        const isPositive = inverse ? change < 0 : change > 0;
                        const color = isPositive ? 'text-green-600 dark:text-green-500' : change === 0 ? 'text-gray-500' : 'text-red-600 dark:text-red-500';
                        const icon = change > 0 ? '↑' : change < 0 ? '↓' : '';
                        return (
                          <div className="text-xs">
                            <div className={`${color} font-medium`}>
                              {icon} {Math.abs(change).toFixed(1)}%
                            </div>
                            {previousValue !== undefined && previousValue !== null && (
                              <div className="text-gray-500 dark:text-gray-400">
                                vs. {formatter ? formatter(previousValue) : previousValue}
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <TableRow key={idx} className="text-sm">
                          <TableCell className="font-medium text-gray-900 dark:text-white py-3">
                            {flow.flow_name}
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="text-gray-900 dark:text-gray-100">{formatNumber(flow.recipients)}</div>
                            <ChangeIndicator
                              change={recipientsChange}
                              previousValue={prevPeriod?.recipients}
                              formatter={formatNumber}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="text-gray-900 dark:text-gray-100">{formatPercentage(flow.open_rate)}</div>
                            <ChangeIndicator
                              change={openRateChange}
                              previousValue={prevPeriod?.open_rate}
                              formatter={formatPercentage}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="text-gray-900 dark:text-gray-100">{formatPercentage(flow.click_rate)}</div>
                            <ChangeIndicator
                              change={clickRateChange}
                              previousValue={prevPeriod?.click_rate}
                              formatter={formatPercentage}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="text-gray-900 dark:text-gray-100">{formatPercentage(flow.conversion_rate)}</div>
                            <ChangeIndicator
                              change={convRateChange}
                              previousValue={prevPeriod?.conversion_rate}
                              formatter={formatPercentage}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="text-gray-900 dark:text-gray-100">{formatCurrency(flow.conversion_value)}</div>
                            <ChangeIndicator
                              change={revenueChange}
                              previousValue={prevPeriod?.conversion_value || prevPeriod?.revenue}
                              formatter={formatCurrency}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="text-gray-900 dark:text-gray-100">{formatCurrency(flow.revenue_per_recipient)}</div>
                            <ChangeIndicator
                              change={rprChange}
                              previousValue={prevPeriod?.revenue_per_recipient}
                              formatter={formatCurrency}
                            />
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="text-gray-900 dark:text-gray-100">{formatPercentage(flow.bounce_rate)}</div>
                            <ChangeIndicator
                              change={bounceRateChange}
                              previousValue={prevPeriod?.bounce_rate}
                              formatter={formatPercentage}
                              inverse={true}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Flow Performance Over Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Flow Performance Over Time</CardTitle>
                <CardDescription>Daily trend of selected flows for the chosen metric</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedFlowMetric} onValueChange={setSelectedFlowMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recipients">Recipients</SelectItem>
                    <SelectItem value="opens_unique">Unique Opens</SelectItem>
                    <SelectItem value="clicks_unique">Unique Clicks</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="open_rate">Open Rate %</SelectItem>
                    <SelectItem value="click_rate">Click Rate %</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate %</SelectItem>
                    <SelectItem value="conversion_value">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <MultiSelect
                  options={data.flows.map(f => ({ value: f.flow_name, label: f.flow_name }))}
                  value={selectedFlowsForChart}
                  onChange={setSelectedFlowsForChart}
                  placeholder="Select flows to compare..."
                />
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={flowTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#111827', fontSize: 12 }}
                    tickFormatter={formatFriendlyDate}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fill: '#111827' }}
                    tickFormatter={(value) => {
                      if (selectedFlowMetric.includes('rate')) return `${value.toFixed(1)}%`;
                      if (selectedFlowMetric === 'conversion_value') return formatCurrency(value).replace('$', '');
                      return formatNumber(value);
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                    formatter={(value, name) => {
                      if (selectedFlowMetric.includes('rate')) return `${value.toFixed(1)}%`;
                      if (selectedFlowMetric === 'conversion_value') return formatCurrency(value);
                      return formatNumber(value);
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    onClick={handleFlowLegendClick}
                  />
                  {selectedFlowsForChart.map((flowOption, idx) => (
                    !hiddenFlowLines.has(flowOption.label) && (
                      <Line
                        key={flowOption.value}
                        type="monotone"
                        dataKey={flowOption.label}
                        name={flowOption.label}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ fill: COLORS[idx % COLORS.length], r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Rates - Full Width with Time Series */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Engagement Rates by Flow - Daily Time Series</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedEngagementMetric} onValueChange={setSelectedEngagementMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_rate">Open Rate</SelectItem>
                    <SelectItem value="click_rate">Click Rate</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    <SelectItem value="recipients">Recipients</SelectItem>
                    <SelectItem value="opens_unique">Unique Opens</SelectItem>
                    <SelectItem value="clicks_unique">Unique Clicks</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="conversion_value">Revenue</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-[280px]">
                  <MultiSelect
                    options={getAvailableFlows(data.performanceOverTime).map(flow => ({
                      value: flow,
                      label: flow
                    }))}
                    value={selectedEngagementFlows}
                    onChange={setSelectedEngagementFlows}
                    placeholder="Select flows to compare..."
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={prepareTimeSeriesData(data.performanceOverTime, selectedEngagementFlows.map(f => f.value), selectedEngagementMetric)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'currentColor' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) => {
                      if (['open_rate', 'click_rate', 'conversion_rate'].includes(selectedEngagementMetric)) {
                        return formatPercentage(value);
                      }
                      if (selectedEngagementMetric === 'conversion_value') {
                        return formatCurrency(value).replace('$', '');
                      }
                      return formatNumber(value);
                    }}
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      let formattedValue;
                      if (['open_rate', 'click_rate', 'conversion_rate'].includes(selectedEngagementMetric)) {
                        formattedValue = formatPercentage(value);
                      } else if (selectedEngagementMetric === 'conversion_value') {
                        formattedValue = formatCurrency(value);
                      } else {
                        formattedValue = formatNumber(value);
                      }
                      return [formattedValue, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                    onClick={handleFlowLegendClick}
                    iconType="line"
                  />
                  {selectedEngagementFlows.length === 0 ? (
                    <Line
                      type="monotone"
                      dataKey="All Flows"
                      stroke="#60A5FA"
                      name="All Flows (Aggregate)"
                      strokeWidth={3}
                      dot={{ fill: '#60A5FA', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      hide={hiddenFlowLines.has('All Flows (Aggregate)')}
                      strokeOpacity={hiddenFlowLines.has('All Flows (Aggregate)') ? 0 : 1}
                    />
                  ) : (
                    selectedEngagementFlows.map((flow, idx) => (
                      <Line
                        key={flow.value}
                        type="monotone"
                        dataKey={flow.value}
                        stroke={COLORS[idx % COLORS.length]}
                        name={flow.label}
                        strokeWidth={3}
                        dot={{ fill: COLORS[idx % COLORS.length], r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                        hide={hiddenFlowLines.has(flow.label)}
                        strokeOpacity={hiddenFlowLines.has(flow.label) ? 0 : 1}
                      />
                    ))
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </div>
          )}
        </TabsContent>

        {/* Message Level View */}
        <TabsContent value="messages">
          {!loading && !error && (
            <div className="space-y-6">
          {/* Message Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
              <CardDescription>Click column headers to sort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <MessageSortableHeader column="flow_name" label="Flow" />
                      <MessageSortableHeader column="flow_message_name" label="Message" />
                      <MessageSortableHeader column="recipients" label="Recipients" align="right" />
                      <MessageSortableHeader column="open_rate" label="Open Rate" align="right" />
                      <MessageSortableHeader column="click_rate" label="Click Rate" align="right" />
                      <MessageSortableHeader column="conversion_rate" label="Conv Rate" align="right" />
                      <MessageSortableHeader column="revenue" label="Revenue" align="right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMessages.map((msg, idx) => (
                      <TableRow key={idx} className="text-sm">
                        <TableCell className="font-medium text-gray-900 dark:text-white py-2">
                          {msg.flow_name}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100 py-2">
                          {msg.flow_message_name || msg.flow_message_id}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatNumber(msg.recipients)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatPercentage(msg.open_rate)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatPercentage(msg.click_rate)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatPercentage(msg.conversion_rate)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 dark:text-gray-100 py-2">
                          {formatCurrency(msg.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Message Performance Time Series */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Message Performance Time Series</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedMessageEngagementMetric} onValueChange={setSelectedMessageEngagementMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_rate">Open Rate</SelectItem>
                    <SelectItem value="click_rate">Click Rate</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    <SelectItem value="recipients">Recipients</SelectItem>
                    <SelectItem value="opens_unique">Unique Opens</SelectItem>
                    <SelectItem value="clicks_unique">Unique Clicks</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="conversion_value">Revenue</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-[280px]">
                  <MultiSelect
                    options={getUniqueMessages(data.messages)}
                    value={selectedMessageEngagementMessages}
                    onChange={setSelectedMessageEngagementMessages}
                    placeholder="Select messages..."
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={prepareMessageTimeSeriesData(
                  data.messagePerformanceOverTime,
                  selectedMessageEngagementMessages,
                  selectedMessageEngagementMetric
                )}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'currentColor' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) => {
                      if (['open_rate', 'click_rate', 'conversion_rate'].includes(selectedMessageEngagementMetric)) {
                        return formatPercentage(value);
                      }
                      if (selectedMessageEngagementMetric === 'conversion_value') {
                        return formatCurrency(value).replace('$', '');
                      }
                      return formatNumber(value);
                    }}
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      let formattedValue;
                      if (['open_rate', 'click_rate', 'conversion_rate'].includes(selectedMessageEngagementMetric)) {
                        formattedValue = formatPercentage(value);
                      } else if (selectedMessageEngagementMetric === 'conversion_value') {
                        formattedValue = formatCurrency(value);
                      } else {
                        formattedValue = formatNumber(value);
                      }
                      return [formattedValue, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                    onClick={handleLegendClick}
                    iconType="line"
                  />
                  {selectedMessageEngagementMessages.map((msg, idx) => (
                    <Line
                      key={msg.value}
                      type="monotone"
                      dataKey={msg.label}
                      stroke={COLORS[idx % COLORS.length]}
                      name={msg.label}
                      strokeWidth={3}
                      dot={{ fill: COLORS[idx % COLORS.length], r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      hide={hiddenMessageLines.has(msg.label)}
                      strokeOpacity={hiddenMessageLines.has(msg.label) ? 0 : 1}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Message Performance Comparison */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Message Performance Comparison</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedMessageComparisonMetric} onValueChange={setSelectedMessageComparisonMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recipients">Recipients</SelectItem>
                    <SelectItem value="opens">Unique Opens</SelectItem>
                    <SelectItem value="clicks">Unique Clicks</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="open_rate">Open Rate</SelectItem>
                    <SelectItem value="click_rate">Click Rate</SelectItem>
                    <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-[280px]">
                  <MultiSelect
                    options={getUniqueMessages(data.messages)}
                    value={selectedMessageComparison}
                    onChange={setSelectedMessageComparison}
                    placeholder="Select messages to compare..."
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={selectedMessageComparison.length > 0
                  ? data.messages.filter(m => selectedMessageComparison.some(s => s.value === m.flow_message_id))
                  : data.messages
                }>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="flow_message_name"
                    angle={-15}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    tickFormatter={(value) => {
                      if (['open_rate', 'click_rate', 'conversion_rate'].includes(selectedMessageComparisonMetric)) {
                        return formatPercentage(value);
                      }
                      if (selectedMessageComparisonMetric === 'revenue') {
                        return formatCurrency(value).replace('$', '');
                      }
                      return formatNumber(value);
                    }}
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    formatter={(value) => {
                      if (['open_rate', 'click_rate', 'conversion_rate'].includes(selectedMessageComparisonMetric)) {
                        return formatPercentage(value);
                      }
                      if (selectedMessageComparisonMetric === 'revenue') {
                        return formatCurrency(value);
                      }
                      return formatNumber(value);
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      color: 'var(--tooltip-text, #111827)'
                    }}
                    wrapperClassName="[&_*]:dark:!bg-gray-900 [&_*]:dark:!border-gray-700 [&_*]:dark:!text-gray-100"
                  />
                  <Bar
                    dataKey={selectedMessageComparisonMetric}
                    fill="#60A5FA"
                    name={getMetricLabel(selectedMessageComparisonMetric)}
                    radius={[8, 8, 0, 0]}
                  >
                    {(selectedMessageComparison.length > 0
                      ? data.messages.filter(m => selectedMessageComparison.some(s => s.value === m.flow_message_id))
                      : data.messages
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

            </div>
          )}
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <MorphingLoader size="large" showText={true} text="Loading flow data..." />
        </div>
      )}

      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/app/components/ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import MorphingLoader from "@/app/components/ui/loading"
import Select from "react-select"
import { selectStyles, selectStylesDark } from "@/app/components/selectStyles"
import { useAI } from "@/app/contexts/ai-context"
import { useTheme } from "@/app/contexts/theme-context"
import { useDashboardData } from "@/app/hooks/useDashboardData"
import {
    DollarSign,
    ShoppingCart,
    Users,
    Target,
    TrendingUp,
    TrendingDown
} from "lucide-react"
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts"
import AccountStatsTable from "./AccountStatsTable"

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

export default function SimpleDashboard({
    selectedAccounts,
    dateRangeSelection,
    stores,
    showAccountTable = true,
    recentCampaignsData,  // ADD: Pass recent campaigns from parent
    upcomingCampaignsData  // ADD: Pass upcoming campaigns from parent
}) {
    const { updateAIState } = useAI();
    const { theme } = useTheme();

    // State for chart selections
    const [performanceMetric, setPerformanceMetric] = useState('revenue')
    const [performanceView, setPerformanceView] = useState('by-account')
    const [topMetric, setTopMetric] = useState('revenue')

    // State for selected accounts in the line chart (for easy comparison)
    const [selectedLineAccounts, setSelectedLineAccounts] = useState(new Set())

    // Use appropriate select styles based on theme
    const currentSelectStyles = theme === 'dark' ? selectStylesDark : selectStyles

    // Available performance metrics for dropdown
    const PERFORMANCE_METRICS = [
        { value: 'revenue', label: 'Total Revenue' },
        { value: 'attributedRevenue', label: 'Attributed Revenue' },
        { value: 'orders', label: 'Orders' },
        { value: 'customers', label: 'Customers' },
        { value: 'aov', label: 'Average Order Value' },
        { value: 'openRate', label: 'Open Rate %' },
        { value: 'clickRate', label: 'Click Rate %' }
    ]

    // Prepare store IDs for the API - memoized to prevent infinite re-renders
    const storeIds = useMemo(() => {
        return selectedAccounts?.[0]?.value === 'all' || !selectedAccounts?.length
            ? stores?.map(s => s.public_id).filter(Boolean)
            : selectedAccounts.map(acc => acc.value).filter(v => !v.startsWith('tag:'));
    }, [selectedAccounts, stores]);

    // Use the dashboard data hook
    const {
        data,
        loading: isLoading,
        error,
        refresh
    } = useDashboardData(
        storeIds,
        dateRangeSelection?.ranges?.main ? {
            start: dateRangeSelection.ranges.main.start,
            end: dateRangeSelection.ranges.main.end
        } : null,
        dateRangeSelection?.ranges?.comparison ? {
            start: dateRangeSelection.ranges.comparison.start,
            end: dateRangeSelection.ranges.comparison.end
        } : null
    );

    // Update AI context when data changes - COMPREHENSIVE VERSION
    useEffect(() => {
        if (data?.summary) {
            // Build selected stores data for context
            const selectedStoresData = selectedAccounts?.map(acc => {
                const store = stores?.find(s => s.public_id === acc.value);
                return store ? {
                    value: store.public_id,
                    label: store.name,
                    klaviyo_id: store.klaviyo_integration?.public_id
                } : null;
            }).filter(Boolean) || [];

            // Format date range for display
            const formatDate = (date) => {
                if (!date) return 'N/A';
                return new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            };

            // Calculate date range duration in days
            const calculateDaysDuration = (start, end) => {
                if (!start || !end) return null;
                const diffTime = Math.abs(new Date(end) - new Date(start));
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            };

            const daysDuration = calculateDaysDuration(
                dateRangeSelection?.ranges?.main?.start,
                dateRangeSelection?.ranges?.main?.end
            );

            updateAIState({
                currentPage: "dashboard",
                pageTitle: "Dashboard Overview",
                pageType: "dashboard",

                // Selected stores with names for natural language queries
                selectedStores: selectedStoresData,
                selectedKlaviyoIds: selectedStoresData.map(s => s.klaviyo_id).filter(Boolean),

                // ENHANCED: Date range information with duration
                dateRange: {
                    start: dateRangeSelection?.ranges?.main?.start || null,
                    end: dateRangeSelection?.ranges?.main?.end || null,
                    preset: dateRangeSelection?.period || 'last90',
                    formatted: `${formatDate(dateRangeSelection?.ranges?.main?.start)} - ${formatDate(dateRangeSelection?.ranges?.main?.end)}`,
                    daysSpan: daysDuration,
                    label: dateRangeSelection?.ranges?.main?.label || `Past ${daysDuration} days`,
                    comparison: dateRangeSelection?.ranges?.comparison ? {
                        start: dateRangeSelection.ranges.comparison.start,
                        end: dateRangeSelection.ranges.comparison.end,
                        formatted: `${formatDate(dateRangeSelection.ranges.comparison.start)} - ${formatDate(dateRangeSelection.ranges.comparison.end)}`,
                        label: dateRangeSelection.ranges.comparison.label || 'Previous period'
                    } : null
                },

                // ✅ NEW STRUCTURE: Summary Data (sent to AI)
                summaryData: {
                    // Dashboard KPI summary
                    dashboard: {
                        totalRevenue: data.summary?.totalRevenue || 0,
                        attributedRevenue: data.summary?.attributedRevenue || 0,
                        totalOrders: data.summary?.totalOrders || 0,
                        uniqueCustomers: data.summary?.uniqueCustomers || 0,
                        avgOrderValue: data.summary?.avgOrderValue || 0,
                        revenueChange: data.summary?.revenueChange || 0,
                        attributedRevenueChange: data.summary?.attributedRevenueChange || 0,
                        ordersChange: data.summary?.ordersChange || 0,
                        customersChange: data.summary?.customersChange || 0,
                    },

                    // By-account summaries (all accounts)
                    byAccount: data.byAccount?.map(account => ({
                        name: account.storeName,
                        storeName: account.storeName, // Include both for compatibility
                        id: account.storePublicId,
                        storePublicId: account.storePublicId,
                        klaviyoId: account.klaviyoPublicId,
                        klaviyoPublicId: account.klaviyoPublicId,
                        revenue: account.revenue || 0,
                        revenueChange: account.revenueChange || 0,
                        orders: account.orders || 0,
                        customers: account.customers || 0,
                        avgOrderValue: account.avgOrderValue || 0,
                        openRate: account.openRate || 0,
                        clickRate: account.clickRate || 0,
                        attributedRevenue: account.attributedRevenue || 0,
                        // ✅ ADD: Missing fields that formatter expects
                        recipients: account.recipients || 0,
                        emailRecipients: account.emailRecipients || 0,
                        smsRecipients: account.smsRecipients || 0,
                        revenuePerRecipient: account.revenuePerRecipient || 0,
                        ctor: account.ctor || 0,
                    })) || [],

                    // Time series (sampled to ~20 points for AI)
                    timeSeries: data.timeSeries?.length > 20
                        ? data.timeSeries.filter((_, i) => i % Math.ceil(data.timeSeries.length / 20) === 0).slice(0, 20)
                        : data.timeSeries || [],

                    // Recent campaigns (top 10 only for AI)
                    campaigns: {
                        total: recentCampaignsData?.length || 0,
                        topPerformers: (recentCampaignsData || [])
                            .sort((a, b) => (b.statistics?.conversion_value || b.revenue || 0) - (a.statistics?.conversion_value || a.revenue || 0))
                            .slice(0, 10)
                            .map(campaign => ({
                                name: campaign.campaign_name || campaign.name,
                                sentAt: campaign.send_time || campaign.sendTime,
                                channel: campaign.send_channel || campaign.channel,
                                recipients: campaign.statistics?.recipients || campaign.recipients || 0,
                                openRate: campaign.statistics?.open_rate || campaign.openRate || 0,
                                clickRate: campaign.statistics?.click_rate || campaign.clickRate || 0,
                                revenue: campaign.statistics?.conversion_value || campaign.revenue || 0,
                            })),
                        summaryStats: {
                            totalRevenue: (recentCampaignsData || []).reduce((sum, c) => sum + (c.statistics?.conversion_value || c.revenue || 0), 0),
                        },
                    },

                    // Metadata
                    dataFreshness: new Date().toISOString(),
                    estimatedTokens: 0, // Will be calculated by context
                },

                // ✅ Raw data (NOT sent to AI, kept for UI)
                rawData: {
                    campaigns: recentCampaignsData || [],
                    timeSeries: data.timeSeries || [],
                    timeSeriesByAccount: data.timeSeriesByAccount || [],
                    metrics: data.summary || {},
                },

                // Insights (pre-calculated)
                insights: {
                    automated: [
                        `Revenue ${data.summary?.revenueChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(data.summary?.revenueChange || 0).toFixed(1)}%`,
                        `${data.summary?.uniqueCustomers || 0} unique customers generated ${formatCurrency(data.summary?.totalRevenue || 0)} in revenue`,
                        `Average order value: ${formatCurrency(data.summary?.avgOrderValue || 0)}`,
                        `Viewing ${selectedStoresData.length} store${selectedStoresData.length !== 1 ? 's' : ''}: ${selectedStoresData.map(s => s.label).join(', ')}`,
                    ],
                    patterns: {},
                    recommendations: [],
                },
            });
        }
    }, [data, updateAIState, selectedAccounts, dateRangeSelection, stores, performanceMetric, performanceView, selectedLineAccounts, recentCampaignsData, upcomingCampaignsData]);

    // Initialize selected accounts when data loads (select top 3 by default)
    useEffect(() => {
        if (data?.byAccount && data.byAccount.length > 0 && selectedLineAccounts.size === 0) {
            const topAccounts = data.byAccount.slice(0, 3).map(acc => acc.storePublicId);
            setSelectedLineAccounts(new Set(topAccounts));
        }
    }, [data?.byAccount, selectedLineAccounts.size]);

    // Show loading spinner while fetching data
    if (isLoading || !stores || stores.length === 0 || (!data && storeIds && storeIds.length > 0)) {
        return (
            <div className="flex items-center justify-center h-96">
                <MorphingLoader size="large" showText={true} text="Loading dashboard..." />
            </div>
        );
    }

    // Show "No stores selected" message
    if (stores && stores.length > 0 && (!storeIds || storeIds.length === 0) && !isLoading) {
        return (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                No stores selected
            </div>
        );
    }

    // Show error message if data fetching failed
    if (error && !data) {
        return (
            <div className="text-center py-12 text-red-600 dark:text-red-400">
                Error loading dashboard data: {error.message || 'Unknown error'}
            </div>
        );
    }

    // Prepare chart data
    const dashboardData = {
        summary: data?.summary || {},
        timeSeries: data?.timeSeries || [],
        timeSeriesByAccount: data?.timeSeriesByAccount || [],
        byAccount: data?.byAccount || []
    };

    // Filter accounts to display based on selection
    const visibleLineAccounts = dashboardData.byAccount?.filter(account =>
        selectedLineAccounts.has(account.storePublicId)
    ) || [];

    // Handle legend click to toggle account visibility
    const handleLegendClick = (e) => {
        const dataKey = e.dataKey;
        // Extract store public ID from dataKey (format: "storePublicId_metric")
        const storePublicId = dataKey.split('_')[0];

        setSelectedLineAccounts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(storePublicId)) {
                newSet.delete(storePublicId);
            } else {
                newSet.add(storePublicId);
            }
            return newSet;
        });
    };

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* KPI Cards - First Row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Overall Revenue */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Overall Revenue</CardTitle>
                                <UITooltip>
                                    <TooltipTrigger>
                                        <InfoCircledIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="font-semibold mb-1">Overall Revenue</p>
                                        <p className="text-sm">Total revenue from all orders in the selected period, including both attributed and non-attributed sales.</p>
                                        <p className="text-sm mt-1 text-gray-400">Source: account_aggregates_daily.total_revenue</p>
                                    </TooltipContent>
                                </UITooltip>
                            </div>
                            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(dashboardData.summary.totalRevenue || 0)}
                            </div>
                            {dashboardData.summary.revenueChange !== null && dashboardData.summary.revenueChange !== undefined ? (
                                <div className="mt-1">
                                    <p className={`text-xs font-medium flex items-center gap-1 ${dashboardData.summary.revenueChange > 0 ? 'text-green-600 dark:text-green-500' : dashboardData.summary.revenueChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-500'}`}>
                                        {dashboardData.summary.revenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : dashboardData.summary.revenueChange < 0 ? <TrendingDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.revenueChange === 0 ? 'No change' :
                                         dashboardData.summary.revenueChange >= 999999 ? 'New!' :
                                         dashboardData.summary.revenueChange > 1000 ? '>1,000%' :
                                         `${Math.abs(dashboardData.summary.revenueChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatCurrency(dashboardData.summary.prevTotalRevenue || 0)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attributed Revenue */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Attributed Revenue</CardTitle>
                                <UITooltip>
                                    <TooltipTrigger>
                                        <InfoCircledIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="font-semibold mb-1">Attributed Revenue</p>
                                        <p className="text-sm">Revenue directly attributed to your email campaigns and flows. This shows the direct impact of your marketing efforts.</p>
                                        <p className="text-sm mt-1 text-gray-400">Source: account_aggregates_daily.attributed_revenue</p>
                                    </TooltipContent>
                                </UITooltip>
                            </div>
                            <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(dashboardData.summary.attributedRevenue || 0)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                {dashboardData.summary.totalRevenue > 0
                                    ? formatPercentage((dashboardData.summary.attributedRevenue / dashboardData.summary.totalRevenue) * 100)
                                    : '0%'} of total revenue
                            </p>
                            {dashboardData.summary.attributedRevenueChange !== null && dashboardData.summary.attributedRevenueChange !== undefined ? (
                                <div className="mt-1">
                                    <p className={`text-xs font-medium flex items-center gap-1 ${dashboardData.summary.attributedRevenueChange > 0 ? 'text-green-600 dark:text-green-500' : dashboardData.summary.attributedRevenueChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-500'}`}>
                                        {dashboardData.summary.attributedRevenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : dashboardData.summary.attributedRevenueChange < 0 ? <TrendingDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.attributedRevenueChange === 0 ? 'No change' :
                                         dashboardData.summary.attributedRevenueChange >= 999999 ? 'New!' :
                                         dashboardData.summary.attributedRevenueChange > 1000 ? '>1,000%' :
                                         `${Math.abs(dashboardData.summary.attributedRevenueChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatCurrency(dashboardData.summary.prevAttributedRevenue || 0)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Total Orders */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Orders</CardTitle>
                                <UITooltip>
                                    <TooltipTrigger>
                                        <InfoCircledIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="font-semibold mb-1">Total Orders</p>
                                        <p className="text-sm">Count of all orders placed during the selected period across all channels.</p>
                                        <p className="text-sm mt-1 text-gray-400">Source: account_aggregates_daily.total_orders</p>
                                    </TooltipContent>
                                </UITooltip>
                            </div>
                            <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatNumber(dashboardData.summary.totalOrders || 0)}
                            </div>
                            {dashboardData.summary.ordersChange !== null && dashboardData.summary.ordersChange !== undefined ? (
                                <div className="mt-1">
                                    <p className={`text-xs font-medium flex items-center gap-1 ${dashboardData.summary.ordersChange > 0 ? 'text-green-600 dark:text-green-500' : dashboardData.summary.ordersChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-500'}`}>
                                        {dashboardData.summary.ordersChange > 0 ? <TrendingUp className="h-3 w-3" /> : dashboardData.summary.ordersChange < 0 ? <TrendingDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.ordersChange === 0 ? 'No change' :
                                         dashboardData.summary.ordersChange >= 999999 ? 'New!' :
                                         dashboardData.summary.ordersChange > 1000 ? '>1,000%' :
                                         `${Math.abs(dashboardData.summary.ordersChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatNumber(dashboardData.summary.prevTotalOrders || 0)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Customers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Active Customers</CardTitle>
                                <UITooltip>
                                    <TooltipTrigger>
                                        <InfoCircledIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p className="font-semibold mb-1">Active Customers</p>
                                        <p className="text-sm">Total number of unique customers who made purchases during the selected period.</p>
                                        <p className="text-sm mt-1 text-gray-400">Source: account_aggregates_daily.unique_customers</p>
                                    </TooltipContent>
                                </UITooltip>
                            </div>
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatNumber(dashboardData.summary.uniqueCustomers || 0)}
                            </div>
                            {dashboardData.summary.customersChange !== null && dashboardData.summary.customersChange !== undefined ? (
                                <div className="mt-1">
                                    <p className={`text-xs font-medium flex items-center gap-1 ${dashboardData.summary.customersChange > 0 ? 'text-green-600 dark:text-green-500' : dashboardData.summary.customersChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-500'}`}>
                                        {dashboardData.summary.customersChange > 0 ? <TrendingUp className="h-3 w-3" /> : dashboardData.summary.customersChange < 0 ? <TrendingDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.customersChange === 0 ? 'No change' :
                                         dashboardData.summary.customersChange >= 999999 ? 'New!' :
                                         dashboardData.summary.customersChange > 1000 ? '>1,000%' :
                                         `${Math.abs(dashboardData.summary.customersChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatNumber(dashboardData.summary.prevUniqueCustomers || 0)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Account Performance Table */}
                {showAccountTable && (
                    <AccountStatsTable
                        stores={stores}
                        dateRangeSelection={dateRangeSelection}
                    />
                )}

                {/* Performance Over Time Line Chart */}
                <div>
                    <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Performance Over Time</CardTitle>
                                    <CardDescription className="text-gray-800 dark:text-gray-400">
                                        {performanceView === 'by-account' ? 'Comparison by account' : 'Aggregate trends'}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-32">
                                        <Select
                                            value={{
                                                value: performanceView,
                                                label: performanceView === 'by-account' ? 'By Account' : 'Aggregate'
                                            }}
                                            onChange={(option) => setPerformanceView(option.value)}
                                            options={[
                                                { value: 'by-account', label: 'By Account' },
                                                { value: 'aggregate', label: 'Aggregate' }
                                            ]}
                                            styles={currentSelectStyles}
                                            isSearchable={false}
                                        />
                                    </div>
                                    <div className="w-44">
                                        <Select
                                            value={{
                                                value: performanceMetric,
                                                label: performanceMetric === 'revenue' ? 'Total Revenue' :
                                                       performanceMetric === 'orders' ? 'Orders' :
                                                       performanceMetric === 'customers' ? 'Customers' :
                                                       performanceMetric === 'aov' ? 'AOV' :
                                                       performanceMetric === 'openRate' ? 'Open Rate' :
                                                       performanceMetric === 'clickRate' ? 'Click Rate' : 'Revenue'
                                            }}
                                            onChange={(option) => setPerformanceMetric(option.value)}
                                            options={[
                                                { value: 'revenue', label: 'Total Revenue' },
                                                { value: 'attributedRevenue', label: 'Attributed Revenue' },
                                                { value: 'orders', label: 'Orders' },
                                                { value: 'customers', label: 'Customers' },
                                                { value: 'aov', label: 'Average Order Value' },
                                                { value: 'openRate', label: 'Open Rate %' },
                                                { value: 'clickRate', label: 'Click Rate %' }
                                            ]}
                                            styles={currentSelectStyles}
                                            isSearchable={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {performanceView === 'by-account' && dashboardData.byAccount && dashboardData.byAccount.length > 0 && (
                                <div className="mb-6 flex flex-wrap gap-2">
                                    {dashboardData.byAccount.map((account, index) => {
                                        const isSelected = selectedLineAccounts.has(account.storePublicId);
                                        return (
                                            <Badge
                                                key={account.storePublicId}
                                                onClick={() => {
                                                    setSelectedLineAccounts(prev => {
                                                        const newSet = new Set(prev);
                                                        if (newSet.has(account.storePublicId)) {
                                                            newSet.delete(account.storePublicId);
                                                        } else {
                                                            newSet.add(account.storePublicId);
                                                        }
                                                        return newSet;
                                                    });
                                                }}
                                                className={`cursor-pointer transition-all hover:scale-105 ${
                                                    isSelected
                                                        ? 'bg-sky-blue text-white border-2 border-sky-blue hover:bg-royal-blue'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-400'
                                                }`}
                                                style={isSelected ? {
                                                    borderColor: COLORS[visibleLineAccounts.findIndex(a => a.storePublicId === account.storePublicId) % COLORS.length]
                                                } : {}}
                                            >
                                                {isSelected && (
                                                    <span
                                                        className="inline-block w-3 h-3 rounded-full mr-1.5"
                                                        style={{ backgroundColor: COLORS[visibleLineAccounts.findIndex(a => a.storePublicId === account.storePublicId) % COLORS.length] }}
                                                    />
                                                )}
                                                {account.storeName}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart
                                    data={performanceView === 'aggregate' ? dashboardData.timeSeries : dashboardData.timeSeriesByAccount}
                                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#60A5FA" />
                                            <stop offset="100%" stopColor="#8B5CF6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        tickFormatter={(value) => {
                                            if (['revenue', 'attributedRevenue', 'aov'].includes(performanceMetric)) {
                                                return formatCurrency(value).replace('$', '')
                                            } else if (performanceMetric.includes('Rate')) {
                                                return `${value.toFixed(1)}%`
                                            } else {
                                                return formatNumber(value)
                                            }
                                        }}
                                        tickMargin={8}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (['revenue', 'attributedRevenue', 'aov'].includes(performanceMetric)) {
                                                return formatCurrency(value)
                                            } else if (performanceMetric.includes('Rate')) {
                                                return `${value.toFixed(2)}%`
                                            } else {
                                                return formatNumber(value)
                                            }
                                        }}
                                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                            border: '2px solid #60A5FA',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    {performanceView === 'aggregate' ? (
                                        <Line
                                            type="monotone"
                                            dataKey={performanceMetric}
                                            stroke="url(#lineGradient)"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#8B5CF6' }}
                                        />
                                    ) : (
                                        visibleLineAccounts.map((account, index) => (
                                            <Line
                                                key={`line-${account.storePublicId || index}`}
                                                type="monotone"
                                                dataKey={`${account.storePublicId}_${performanceMetric}`}
                                                name={account.storeName || `Account ${index + 1}`}
                                                stroke={COLORS[index % COLORS.length]}
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                        ))
                                    )}
                                    {performanceView === 'by-account' && (
                                        <Legend
                                            wrapperStyle={{ fontSize: '12px', cursor: 'pointer' }}
                                            iconType="line"
                                            onClick={handleLegendClick}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    );
}
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
    ArrowUp,
    ArrowDown
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

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

export default function SimpleDashboard({
    selectedAccounts,
    dateRangeSelection,
    stores
}) {
    const { updateAIState } = useAI();
    const { theme } = useTheme();

    // State for chart selections
    const [performanceMetric, setPerformanceMetric] = useState('revenue')
    const [performanceView, setPerformanceView] = useState('by-account')
    const [topMetric, setTopMetric] = useState('revenue')

    // Use appropriate select styles based on theme
    const currentSelectStyles = theme === 'dark' ? selectStylesDark : selectStyles

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

    // Update AI context when data changes
    useEffect(() => {
        if (data?.summary) {
            updateAIState({
                currentPage: "dashboard",
                pageTitle: "Dashboard Overview",
                data: {
                    dateRange: `${dateRangeSelection?.ranges?.main?.start || 'N/A'} - ${dateRangeSelection?.ranges?.main?.end || 'N/A'}`,
                    trends: {
                        revenueChange: data.summary?.revenueChange || 0,
                        ordersChange: data.summary?.ordersChange || 0,
                        customersChange: data.summary?.customersChange || 0
                    }
                },
                metrics: {
                    totalRevenue: data.summary?.totalRevenue || 0,
                    attributedRevenue: data.summary?.attributedRevenue || 0,
                    totalOrders: data.summary?.totalOrders || 0,
                    uniqueCustomers: data.summary?.uniqueCustomers || 0
                },
                filters: {
                    accounts: selectedAccounts?.map(a => a.label).join(', ') || 'All Accounts',
                    dateRange: dateRangeSelection?.label || 'Past 90 days'
                },
                insights: [
                    `Revenue ${data.summary?.revenueChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(data.summary?.revenueChange || 0).toFixed(1)}%`,
                    `${data.summary?.uniqueCustomers || 0} unique customers generated ${formatCurrency(data.summary?.totalRevenue || 0)} in revenue`,
                    `Average order value: ${formatCurrency(data.summary?.avgOrderValue || 0)}`
                ]
            });
        }
    }, [data, updateAIState, selectedAccounts, dateRangeSelection]);

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
                                        {dashboardData.summary.revenueChange > 0 ? <ArrowUp className="h-3 w-3" /> : dashboardData.summary.revenueChange < 0 ? <ArrowDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.revenueChange === 0 ? 'No change' : `${Math.abs(dashboardData.summary.revenueChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatCurrency(dashboardData.summary.totalRevenue / (1 + dashboardData.summary.revenueChange / 100))}
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
                                        {dashboardData.summary.attributedRevenueChange > 0 ? <ArrowUp className="h-3 w-3" /> : dashboardData.summary.attributedRevenueChange < 0 ? <ArrowDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.attributedRevenueChange === 0 ? 'No change' : `${Math.abs(dashboardData.summary.attributedRevenueChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatCurrency(dashboardData.summary.attributedRevenue / (1 + dashboardData.summary.attributedRevenueChange / 100))}
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
                                        {dashboardData.summary.ordersChange > 0 ? <ArrowUp className="h-3 w-3" /> : dashboardData.summary.ordersChange < 0 ? <ArrowDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.ordersChange === 0 ? 'No change' : `${Math.abs(dashboardData.summary.ordersChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatNumber(Math.round(dashboardData.summary.totalOrders / (1 + dashboardData.summary.ordersChange / 100)))}
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
                                        {dashboardData.summary.customersChange > 0 ? <ArrowUp className="h-3 w-3" /> : dashboardData.summary.customersChange < 0 ? <ArrowDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.customersChange === 0 ? 'No change' : `${Math.abs(dashboardData.summary.customersChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatNumber(Math.round(dashboardData.summary.uniqueCustomers / (1 + dashboardData.summary.customersChange / 100)))}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* KPI Cards - Second Row (Additional Metrics) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Average Order Value */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Order Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(dashboardData.summary.avgOrderValue || 0)}
                            </div>
                            {dashboardData.summary.aovChange !== null && dashboardData.summary.aovChange !== undefined ? (
                                <div className="mt-1">
                                    <p className={`text-xs font-medium flex items-center gap-1 ${dashboardData.summary.aovChange > 0 ? 'text-green-600 dark:text-green-500' : dashboardData.summary.aovChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-500'}`}>
                                        {dashboardData.summary.aovChange > 0 ? <ArrowUp className="h-3 w-3" /> : dashboardData.summary.aovChange < 0 ? <ArrowDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.aovChange === 0 ? 'No change' : `${Math.abs(dashboardData.summary.aovChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatCurrency(dashboardData.summary.avgOrderValue / (1 + dashboardData.summary.aovChange / 100))}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* First-Time Buyers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">First-Time Buyers</CardTitle>
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatNumber(dashboardData.summary.newCustomers || 0)}
                            </div>
                            {dashboardData.summary.newCustomersChange !== null && dashboardData.summary.newCustomersChange !== undefined ? (
                                <div className="mt-1">
                                    <p className={`text-xs font-medium flex items-center gap-1 ${dashboardData.summary.newCustomersChange > 0 ? 'text-green-600 dark:text-green-500' : dashboardData.summary.newCustomersChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-500'}`}>
                                        {dashboardData.summary.newCustomersChange > 0 ? <ArrowUp className="h-3 w-3" /> : dashboardData.summary.newCustomersChange < 0 ? <ArrowDown className="h-3 w-3" /> : <span className="h-3 w-3 inline-block text-center">—</span>}
                                        {dashboardData.summary.newCustomersChange === 0 ? 'No change' : `${Math.abs(dashboardData.summary.newCustomersChange).toFixed(1)}%`} from last period
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">
                                        Previous: {formatNumber(Math.round(dashboardData.summary.newCustomers / (1 + dashboardData.summary.newCustomersChange / 100)))}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Repeat Buyers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Repeat Buyers</CardTitle>
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatNumber(dashboardData.summary.returningCustomers || 0)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {dashboardData.summary.returningCustomers && dashboardData.summary.uniqueCustomers
                                    ? formatPercentage((dashboardData.summary.returningCustomers / dashboardData.summary.uniqueCustomers) * 100)
                                    : '0%'} of active customers
                            </p>
                        </CardContent>
                    </Card>

                    {/* Attribution Rate */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Attribution Rate</CardTitle>
                            <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {dashboardData.summary.totalRevenue > 0
                                    ? formatPercentage((dashboardData.summary.attributedRevenue / dashboardData.summary.totalRevenue) * 100)
                                    : '0%'}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Revenue from campaigns & flows
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top 5 by Metric Bar Chart */}
                    <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        Top 5 {topMetric === 'revenue' ? 'Revenue' : topMetric === 'clickRate' ? 'Click Rate' : 'Open Rate'} by Client
                                    </CardTitle>
                                    <CardDescription className="text-gray-800 dark:text-gray-400">Highest performing accounts</CardDescription>
                                </div>
                                <div className="w-36">
                                    <Select
                                        value={{
                                            value: topMetric,
                                            label: topMetric === 'revenue' ? 'Revenue' : topMetric === 'clickRate' ? 'Click Rate' : 'Open Rate'
                                        }}
                                        onChange={(option) => setTopMetric(option.value)}
                                        options={[
                                            { value: 'revenue', label: 'Revenue' },
                                            { value: 'clickRate', label: 'Click Rate' },
                                            { value: 'openRate', label: 'Open Rate' }
                                        ]}
                                        styles={currentSelectStyles}
                                        isSearchable={false}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={dashboardData.byAccount
                                        .map(account => ({
                                            ...account,
                                            displayValue: topMetric === 'revenue' ? account.revenue :
                                                         topMetric === 'clickRate' ? account.clickRate :
                                                         account.openRate
                                        }))
                                        .sort((a, b) => (b.displayValue || 0) - (a.displayValue || 0))
                                        .slice(0, 5)
                                    }>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        tickFormatter={(value) =>
                                            topMetric === 'revenue' ? formatCurrency(value).replace('$', '') :
                                            `${value.toFixed(1)}%`
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value) =>
                                            topMetric === 'revenue' ? formatCurrency(value) :
                                            formatPercentage(value)
                                        }
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                            border: '2px solid #60A5FA',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar dataKey="displayValue" fill="url(#barGradient)" radius={[6, 6, 0, 0]}>
                                        {dashboardData.byAccount.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Performance Over Time Line Chart */}
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
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={performanceView === 'aggregate' ? dashboardData.timeSeries : dashboardData.timeSeriesByAccount}>
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
                                        dashboardData.byAccount?.slice(0, 3).map((account, index) => (
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
                                            wrapperStyle={{ fontSize: '12px' }}
                                            iconType="line"
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
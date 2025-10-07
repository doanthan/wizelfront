"use client"

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import LoadingSpinner from "@/app/components/ui/loading-spinner"
import Select from "react-select"
import { selectStyles } from "@/app/components/selectStyles"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Mail,
    MessageSquare,
    ArrowUp,
    ArrowDown,
    BarChart2,
    Activity,
    Target,
    ChevronsUpDown,
    Info
} from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Cell
} from "recharts"

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function RevenueTab({
    selectedAccounts,
    dateRangeSelection,
    stores,
    isLoading = false
}) {
    const [timeGranularity, setTimeGranularity] = useState('monthly')
    const [revenueMetric, setRevenueMetric] = useState('overall') // overall, attributed, attributedPercent
    const [revenueData, setRevenueData] = useState(null)
    const [accountComparison, setAccountComparison] = useState([])
    const [channelRevenue, setChannelRevenue] = useState([])
    const [sortField, setSortField] = useState('totalRevenue')
    const [sortDirection, setSortDirection] = useState('desc')
    const [isLoadingData, setIsLoadingData] = useState(true)

    // State for all accounts data (independent of selection)
    const [allAccountComparison, setAllAccountComparison] = useState([])
    const [isLoadingAllAccounts, setIsLoadingAllAccounts] = useState(true)

    // Get sorted account data - must be before any conditional returns
    const sortedAccountComparison = useMemo(() => {
        if (!accountComparison || accountComparison.length === 0) return []

        return [...accountComparison].sort((a, b) => {
            let aValue = a[sortField] || 0
            let bValue = b[sortField] || 0

            // Handle string fields
            if (sortField === 'account') {
                aValue = (a.account || '').toString().toLowerCase()
                bValue = (b.account || '').toString().toLowerCase()
                return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
            }

            // Handle numeric fields
            aValue = parseFloat(aValue) || 0
            bValue = parseFloat(bValue) || 0

            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        })
    }, [accountComparison, sortField, sortDirection])

    // Get sorted account data for ALL accounts (independent of selection)
    const sortedAllAccountComparison = useMemo(() => {
        if (!allAccountComparison || allAccountComparison.length === 0) return []

        return [...allAccountComparison].sort((a, b) => {
            let aValue = a[sortField] || 0
            let bValue = b[sortField] || 0

            // Handle string fields
            if (sortField === 'account') {
                aValue = (a.account || '').toString().toLowerCase()
                bValue = (b.account || '').toString().toLowerCase()
                return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
            }

            // Handle numeric fields
            aValue = parseFloat(aValue) || 0
            bValue = parseFloat(bValue) || 0

            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        })
    }, [allAccountComparison, sortField, sortDirection])

    // Calculate totals for footer row
    const totals = useMemo(() => {
        if (!sortedAllAccountComparison || sortedAllAccountComparison.length === 0) return null

        const totalRevenue = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.totalRevenue || 0), 0)
        const totalOrders = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.orders || 0), 0)
        const totalCampaignRevenue = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.campaignRevenue || 0), 0)
        const totalFlowRevenue = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.flowRevenue || 0), 0)
        const totalCampaigns = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.campaignsSent || 0), 0)
        const totalNewCustomers = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.newCustomers || 0), 0)
        const totalReturningCustomers = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.returningCustomers || 0), 0)
        const totalRecipients = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.recipients || 0), 0)
        const totalAttributedRevenue = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.attributedRevenue || 0), 0)
        const totalEmailClicks = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.emailClicks || 0), 0)
        const totalEmailDelivered = sortedAllAccountComparison.reduce((sum, acc) => sum + (acc.emailDelivered || 0), 0)

        return {
            totalRevenue,
            totalOrders,
            avgAOV: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            totalCampaignRevenue,
            totalFlowRevenue,
            totalCampaigns,
            totalNewCustomers,
            totalReturningCustomers,
            avgReturnRate: (totalNewCustomers + totalReturningCustomers) > 0
                ? (totalReturningCustomers / (totalNewCustomers + totalReturningCustomers)) * 100
                : 0,
            avgEmailCTR: totalEmailDelivered > 0 ? (totalEmailClicks / totalEmailDelivered) * 100 : 0,
            avgAttributedRevenuePerRecipient: totalRecipients > 0 ? totalAttributedRevenue / totalRecipients : 0,
            avgTotalRevenuePerRecipient: totalRecipients > 0 ? totalRevenue / totalRecipients : 0
        }
    }, [sortedAllAccountComparison])

    // Format helpers
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0)
    }

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0'
        return new Intl.NumberFormat().format(num)
    }

    const formatPercentage = (num) => {
        if (num === null || num === undefined) return '0%'
        return `${num.toFixed(1)}%`
    }

    // Fetch revenue data for selected accounts
    useEffect(() => {
        fetchRevenueData()
    }, [selectedAccounts, dateRangeSelection, timeGranularity])

    // Separate effect for account comparison (always fetch all accounts)

    useEffect(() => {
        fetchAllAccountsData()
    }, [dateRangeSelection, timeGranularity]) // No dependency on selectedAccounts

    const fetchAllAccountsData = async () => {
        setIsLoadingAllAccounts(true)

        try {
            // Prepare query params for ALL accounts
            const params = new URLSearchParams({
                storeIds: 'all', // Always fetch all accounts
                comparisonType: dateRangeSelection?.comparisonType || 'previous-period',
                timeGranularity
            })

            // Add date range
            if (dateRangeSelection?.ranges?.main) {
                const formatDate = (date) => {
                    if (!date) return null
                    return new Date(date).toISOString().split('T')[0]
                }
                const startDate = formatDate(dateRangeSelection.ranges.main.start)
                const endDate = formatDate(dateRangeSelection.ranges.main.end)
                if (startDate) params.append('startDate', startDate)
                if (endDate) params.append('endDate', endDate)
            }

            // Add comparison date range
            if (dateRangeSelection?.ranges?.comparison) {
                const formatDate = (date) => {
                    if (!date) return null
                    return new Date(date).toISOString().split('T')[0]
                }
                const compStartDate = formatDate(dateRangeSelection.ranges.comparison.start)
                const compEndDate = formatDate(dateRangeSelection.ranges.comparison.end)
                if (compStartDate) params.append('compareStartDate', compStartDate)
                if (compEndDate) params.append('compareEndDate', compEndDate)
            }

            const response = await fetch(`/api/dashboard/multi-account-revenue?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch account data')

            const data = await response.json()

            // Process only the account comparison part
            const processedAccountComparison = (data.accountComparison || []).map(account => ({
                account: account.account_name || account.klaviyo_public_id || 'Unknown',
                accountId: account.klaviyo_public_id,
                totalRevenue: parseFloat(account.total_revenue) || 0,
                attributedRevenue: parseFloat(account.attributed_revenue) || 0,
                orders: parseInt(account.total_orders) || 0,
                recipients: parseInt(account.total_recipients) || 0,
                attributedRevenuePerRecipient: parseFloat(account.attributed_revenue_per_recipient) || 0,
                totalRevenuePerRecipient: parseFloat(account.total_revenue_per_recipient) || 0,
                emailRevenue: parseFloat(account.email_revenue) || 0,
                smsRevenue: parseFloat(account.sms_revenue) || 0,
                aov: parseFloat(account.avg_order_value) || 0,
                revenuePerRecipient: parseFloat(account.revenue_per_recipient) || 0,
                attributionPercentage: parseFloat(account.attribution_percentage) || 0,
                // New performance marketing metrics
                campaignRevenue: parseFloat(account.campaign_revenue) || 0,
                flowRevenue: parseFloat(account.flow_revenue) || 0,
                campaignsSent: parseInt(account.campaigns_sent) || 0,
                emailClicks: parseInt(account.email_clicks) || 0,
                emailDelivered: parseInt(account.email_delivered) || 0,
                emailCTR: account.email_delivered > 0 ? (account.email_clicks / account.email_delivered) * 100 : 0,
                newCustomers: parseInt(account.new_customers_total) || 0,
                returningCustomers: parseInt(account.returning_customers_total) || 0,
                returnRate: parseFloat(account.return_rate) || 0
            }))

            setAllAccountComparison(processedAccountComparison)

        } catch (error) {
            console.error('Error fetching all accounts data:', error)
            setAllAccountComparison([])
        } finally {
            setIsLoadingAllAccounts(false)
        }
    }

    const fetchRevenueData = async () => {
        setIsLoadingData(true)

        console.log('📅 RevenueTab dateRangeSelection:', dateRangeSelection)

        try {
            // Prepare store IDs for the API
            let storeIds = []
            if (selectedAccounts?.some(acc => acc.value === 'all')) {
                storeIds = ['all']
            } else if (selectedAccounts?.length > 0) {
                // Extract store IDs from selected accounts
                storeIds = selectedAccounts.map(acc => acc.value)
            }

            // Format dates for API
            const formatDate = (date) => {
                if (!date) return null
                return new Date(date).toISOString().split('T')[0]
            }

            // Prepare query params
            const params = new URLSearchParams({
                storeIds: storeIds.join(','),
                comparisonType: dateRangeSelection?.comparisonType || 'previous-period',
                timeGranularity
            })

            // Add date range
            if (dateRangeSelection?.ranges?.main) {
                const startDate = formatDate(dateRangeSelection.ranges.main.start)
                const endDate = formatDate(dateRangeSelection.ranges.main.end)
                if (startDate) params.append('startDate', startDate)
                if (endDate) params.append('endDate', endDate)
            }

            // Add comparison range
            if (dateRangeSelection?.ranges?.comparison) {
                const compStartDate = formatDate(dateRangeSelection.ranges.comparison.start)
                const compEndDate = formatDate(dateRangeSelection.ranges.comparison.end)
                if (compStartDate) params.append('comparisonStartDate', compStartDate)
                if (compEndDate) params.append('comparisonEndDate', compEndDate)
            }

            console.log('📊 RevenueTab API Request:', `/api/dashboard/multi-account-revenue?${params}`)

            // Call the new multi-account revenue API
            const response = await fetch(`/api/dashboard/multi-account-revenue?${params}`)

            if (!response.ok) {
                let errorData;
                try {
                    const text = await response.text();
                    try {
                        errorData = JSON.parse(text);
                    } catch {
                        errorData = { error: text || 'Unknown error' };
                    }
                } catch {
                    errorData = { error: 'Unknown error' };
                }
                console.error('API Error Response:', errorData);
                throw new Error(`API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`)
            }

            const data = await response.json()

            console.log('Multi-Account Revenue API Response:', data);

            // Process the ClickHouse data for the revenue tab
            const processedData = processClickHouseData(data, timeGranularity)
            console.log('Processed Revenue Data:', processedData);

            setRevenueData(processedData)
            setAccountComparison(processedData.accountComparison)
            setChannelRevenue(processedData.channelRevenue)

        } catch (error) {
            console.error('Error fetching revenue data:', error)
            // Fall back to empty data structure
            const emptyData = {
                metrics: {
                    totalRevenue: 0,
                    attributedRevenue: 0,
                    totalOrders: 0,
                    totalRecipients: 0,
                    totalEmailsSent: 0,
                    totalSMSSent: 0,
                    revenuePerEmail: 0,
                    revenuePerSMS: 0,
                    revenuePerRecipient: 0,
                    averageOrderValue: 0,
                    momGrowth: 0,
                    yoyGrowth: 0
                },
                accountComparison: [],
                channelRevenue: [],
                trendData: []
            }
            setRevenueData(emptyData)
            setAccountComparison(emptyData.accountComparison)
            setChannelRevenue(emptyData.channelRevenue)
        } finally {
            setIsLoadingData(false)
        }
    }

    // Process ClickHouse data for revenue tab display
    const processClickHouseData = (data, granularity) => {
        const { stats = {}, trends = [], accountComparison: byAccount = [], channelRevenue: channelData = [], metadata = {} } = data

        console.log('Processing ClickHouse data:', {
            stats,
            trendDataCount: trends.length,
            accountComparisonCount: byAccount.length,
            channelRevenueCount: channelData.length,
            metadata
        });

        // Extract metrics from stats
        const totalRevenue = parseFloat(stats.overall_revenue) || 0
        const attributedRevenue = parseFloat(stats.attributed_revenue) || 0
        const attributionPercentage = parseFloat(stats.attribution_percentage) || 0
        const totalOrders = parseInt(stats.total_orders) || 0
        const uniqueCustomers = parseInt(stats.unique_customers) || 0
        const newCustomers = parseInt(stats.new_customers) || 0
        const returningCustomers = parseInt(stats.returning_customers) || 0
        const aov = parseFloat(stats.avg_order_value) || 0
        const emailRevenue = parseFloat(stats.total_email_revenue) || 0
        const emailRecipients = parseInt(stats.total_emails_sent) || 0
        const smsRevenue = parseFloat(stats.total_sms_revenue) || 0
        const smsRecipients = parseInt(stats.total_sms_sent) || 0
        const totalRecipients = parseInt(stats.total_recipients) || 0

        // Calculate percentage changes
        const revenueChange = parseFloat(stats.revenue_change) || 0
        const attributedRevenueChange = parseFloat(stats.attributed_revenue_change) || 0
        const ordersChange = parseFloat(stats.orders_change) || 0
        const customersChange = parseFloat(stats.customers_change) || 0

        // Process account comparison data from API response
        const processedAccountComparison = byAccount.map(account => ({
            account: account.account_name || account.klaviyo_public_id || 'Unknown',
            accountId: account.klaviyo_public_id,
            totalRevenue: parseFloat(account.total_revenue) || 0,
            attributedRevenue: parseFloat(account.attributed_revenue) || 0,
            orders: parseInt(account.total_orders) || 0,
            recipients: parseInt(account.total_recipients) || 0,
            attributedRevenuePerRecipient: parseFloat(account.attributed_revenue_per_recipient) || 0,
            totalRevenuePerRecipient: parseFloat(account.total_revenue_per_recipient) || 0,
            emailRevenue: parseFloat(account.email_revenue) || 0,
            smsRevenue: parseFloat(account.sms_revenue) || 0,
            aov: parseFloat(account.avg_order_value) || 0,
            revenuePerRecipient: parseFloat(account.revenue_per_recipient) || 0,
            attributionPercentage: parseFloat(account.attribution_percentage) || 0,
            // New performance marketing metrics
            campaignRevenue: parseFloat(account.campaign_revenue) || 0,
            flowRevenue: parseFloat(account.flow_revenue) || 0,
            campaignsSent: parseInt(account.campaigns_sent) || 0,
            emailClicks: parseInt(account.email_clicks) || 0,
            emailDelivered: parseInt(account.email_delivered) || 0,
            emailCTR: account.email_delivered > 0 ? (account.email_clicks / account.email_delivered) * 100 : 0,
            newCustomers: parseInt(account.new_customers_total) || 0,
            returningCustomers: parseInt(account.returning_customers_total) || 0,
            returnRate: parseFloat(account.return_rate) || 0
        }))

        // Process trends data from API response
        const processedTrendData = trends.map(trend => ({
            period: new Date(trend.period).toLocaleDateString(),
            overallRevenue: parseFloat(trend.overall_revenue) || 0,
            attributedRevenue: parseFloat(trend.attributed_revenue) || 0,
            campaignRevenue: parseFloat(trend.campaign_revenue) || 0,
            flowRevenue: parseFloat(trend.flow_revenue) || 0,
            emailRevenue: parseFloat(trend.email_revenue) || 0,
            smsRevenue: parseFloat(trend.sms_revenue) || 0,
            attributionPercentage: parseFloat(trend.attribution_percentage) || 0
        }))

        // Process channel revenue breakdown from API response
        const processedChannelRevenue = channelData.map(channel => ({
            channel: channel.channel,
            revenue: parseFloat(channel.revenue) || 0,
            recipients: parseInt(channel.recipients) || 0,
            delivered: parseInt(channel.delivered) || 0,
            clicks: parseInt(channel.clicks) || 0,
            percentage: totalRevenue > 0 ? (channel.revenue / totalRevenue) * 100 : 0
        }))

        console.log('Revenue Metrics Calculated:', {
            totalRevenue,
            attributedRevenue,
            emailRecipients,
            smsRecipients,
            accountCount: processedAccountComparison.length,
            trendDataCount: processedTrendData.length
        });

        return {
            metrics: {
                totalRevenue: totalRevenue,
                attributedRevenue: attributedRevenue,
                totalOrders: totalOrders,
                uniqueCustomers: uniqueCustomers,
                newCustomers: newCustomers,
                returningCustomers: returningCustomers,
                totalRecipients: totalRecipients,
                totalEmailsSent: emailRecipients,
                totalSMSSent: smsRecipients,
                // Use pre-calculated ratios from API
                revenuePerEmail: parseFloat(stats.revenue_per_email) || 0,
                revenuePerSMS: parseFloat(stats.revenue_per_sms) || 0,
                revenuePerRecipient: parseFloat(stats.revenue_per_recipient) || 0,
                averageOrderValue: aov,
                momGrowth: revenueChange,
                yoyGrowth: revenueChange,
                // Include comparison changes if available
                revenueChange: revenueChange,
                attributedRevenueChange: attributedRevenueChange,
                ordersChange: ordersChange,
                customersChange: customersChange
            },
            accountComparison: processedAccountComparison,
            channelRevenue: processedChannelRevenue,
            trendData: processedTrendData
        }
    }

    // Show loading state
    if (isLoading || isLoadingData || !revenueData) {
        return (
            <div className="min-h-[600px] w-full flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        )
    }

    const { metrics, trendData } = revenueData

    // Main KPI Cards
    const kpiCards = [
        {
            title: 'Overall Revenue',
            value: formatCurrency(metrics.totalRevenue),
            change: metrics.revenueChange,
            icon: DollarSign,
            color: 'text-green-600'
        },
        {
            title: 'Attributed Revenue',
            value: formatCurrency(metrics.attributedRevenue),
            subtitle: `${((metrics.attributedRevenue / metrics.totalRevenue) * 100 || 0).toFixed(1)}% of total`,
            change: metrics.attributedRevenueChange,
            icon: Target,
            color: 'text-purple-600'
        },
        {
            title: 'Total Orders',
            value: formatNumber(metrics.totalOrders),
            subtitle: `AOV: ${formatCurrency(metrics.averageOrderValue)}`,
            change: metrics.ordersChange,
            icon: ShoppingCart,
            color: 'text-blue-600'
        },
        {
            title: 'Unique Customers',
            value: formatNumber(metrics.uniqueCustomers),
            subtitle: `${metrics.newCustomers} new, ${metrics.returningCustomers} returning`,
            change: metrics.customersChange,
            icon: Users,
            color: 'text-indigo-600'
        }
    ]

    const channelCards = [
        {
            title: 'Revenue per Email',
            value: `$${metrics.revenuePerEmail.toFixed(2)}`,
            subtitle: `${formatNumber(metrics.totalEmailsSent)} emails sent`,
            icon: Mail,
            color: 'text-blue-600'
        },
        {
            title: 'Revenue per SMS',
            value: `$${metrics.revenuePerSMS.toFixed(2)}`,
            subtitle: `${formatNumber(metrics.totalSMSSent)} SMS sent`,
            icon: MessageSquare,
            color: 'text-green-600'
        },
        {
            title: 'Revenue per Recipient',
            value: `$${metrics.revenuePerRecipient.toFixed(2)}`,
            subtitle: `${formatNumber(metrics.totalRecipients)} total recipients`,
            icon: Activity,
            color: 'text-purple-600'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, index) => (
                    <Card key={index} className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {card.title}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {card.value}
                                        </span>
                                        {card.change !== 0 && (
                                            <div className={`flex items-center text-sm ${
                                                card.change > 0 ? 'text-green-600' : card.change < 0 ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                {card.change > 0 ? (
                                                    <ArrowUp className="h-4 w-4" />
                                                ) : card.change < 0 ? (
                                                    <ArrowDown className="h-4 w-4" />
                                                ) : null}
                                                <span>{formatPercentage(Math.abs(card.change))}</span>
                                            </div>
                                        )}
                                    </div>
                                    {card.subtitle && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {card.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Channel Performance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {channelCards.map((card, index) => (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {card.title}
                                    </p>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" side="left">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-sm">{card.title}</h4>
                                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <div>
                                                        <span className="font-medium">Formula:</span>
                                                        <span className="ml-1">
                                                            {card.title === 'Revenue per Email'
                                                                ? 'Total Email Revenue ÷ Total Email Recipients'
                                                                : card.title === 'Revenue per SMS'
                                                                ? 'Total SMS Revenue ÷ Total SMS Recipients'
                                                                : 'Total Attributed Revenue ÷ Total Recipients'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Calculation:</span>
                                                        <span className="ml-1">
                                                            {card.title === 'Revenue per Email'
                                                                ? 'Divides the total revenue generated from email campaigns by the number of email recipients sent during the selected period'
                                                                : card.title === 'Revenue per SMS'
                                                                ? 'Divides the total revenue generated from SMS campaigns by the number of SMS recipients sent during the selected period'
                                                                : 'Divides the total attributed revenue (campaign + flow) by the total number of recipients across all channels'}
                                                        </span>
                                                    </div>
                                                    {revenueData && (
                                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <span className="font-medium">Your data:</span>
                                                            <div className="ml-1">
                                                                {card.title === 'Revenue per Email'
                                                                    ? `${formatCurrency(metrics.totalEmailsSent * metrics.revenuePerEmail)} (email revenue) ÷ ${formatNumber(metrics.totalEmailsSent)} (emails sent) = ${card.value}`
                                                                    : card.title === 'Revenue per SMS'
                                                                    ? `${formatCurrency(metrics.totalSMSSent * metrics.revenuePerSMS)} (SMS revenue) ÷ ${formatNumber(metrics.totalSMSSent)} (SMS sent) = ${card.value}`
                                                                    : `${formatCurrency(metrics.attributedRevenue)} (attributed revenue) ÷ ${formatNumber(metrics.totalRecipients)} (total recipients) = ${card.value}`}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {card.value}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {card.subtitle}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Trends Chart */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Revenue Trends</CardTitle>
                        <CardDescription>Revenue breakdown and attribution over time</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={{ value: revenueMetric, label:
                                revenueMetric === 'overall' ? 'Revenue Overview' :
                                revenueMetric === 'channels' ? 'Channel Breakdown' :
                                revenueMetric === 'sources' ? 'Campaign vs Flow' :
                                'Attribution %'
                            }}
                            onChange={(option) => setRevenueMetric(option.value)}
                            options={[
                                { value: 'overall', label: 'Revenue Overview' },
                                { value: 'channels', label: 'Channel Breakdown' },
                                { value: 'sources', label: 'Campaign vs Flow' },
                                { value: 'attribution', label: 'Attribution %' }
                            ]}
                            styles={selectStyles}
                            className="min-w-[180px]"
                        />
                        <Select
                            value={{ value: timeGranularity, label: timeGranularity === 'daily' ? 'Daily' : timeGranularity === 'weekly' ? 'Weekly' : 'Monthly' }}
                            onChange={(option) => setTimeGranularity(option.value)}
                            options={[
                                { value: 'daily', label: 'Daily' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'monthly', label: 'Monthly' }
                            ]}
                            styles={selectStyles}
                            className="min-w-[120px]"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-96">
                        {trendData && trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 12 }}
                                        className="text-gray-600 dark:text-gray-400"
                                    />
                                    <YAxis
                                        tickFormatter={(value) => {
                                            if (revenueMetric === 'attribution') {
                                                return `${value}%`
                                            }
                                            return formatCurrency(value).replace('$', '')
                                        }}
                                        tick={{ fontSize: 12 }}
                                        className="text-gray-600 dark:text-gray-400"
                                    />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (revenueMetric === 'attribution' || name.includes('%')) {
                                                return [`${value.toFixed(1)}%`, name]
                                            }
                                            return [formatCurrency(value), name]
                                        }}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '8px'
                                        }}
                                    />
                                    <Legend />

                                    {/* Revenue Overview - Shows Overall and Attributed Revenue */}
                                    {revenueMetric === 'overall' && (
                                        <>
                                            <Line
                                                type="monotone"
                                                dataKey="overallRevenue"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                name="Overall Revenue"
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="attributedRevenue"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                name="Attributed Revenue"
                                                strokeDasharray="5 5"
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </>
                                    )}

                                    {/* Channel Breakdown - Email vs SMS Revenue */}
                                    {revenueMetric === 'channels' && (
                                        <>
                                            <Line
                                                type="monotone"
                                                dataKey="overallRevenue"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                name="Total Revenue"
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="attributedRevenue"
                                                stroke="#ec4899"
                                                strokeWidth={2.5}
                                                name="Attributed Revenue"
                                                strokeDasharray="8 4"
                                                dot={false}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="emailRevenue"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                name="Email Revenue"
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="smsRevenue"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                name="SMS Revenue"
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </>
                                    )}

                                    {/* Campaign vs Flow Breakdown */}
                                    {revenueMetric === 'sources' && (
                                        <>
                                            <Line
                                                type="monotone"
                                                dataKey="attributedRevenue"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                name="Total Attributed"
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="campaignRevenue"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                name="Campaign Revenue"
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="flowRevenue"
                                                stroke="#ec4899"
                                                strokeWidth={2}
                                                name="Flow Revenue"
                                                dot={false}
                                                activeDot={{ r: 4 }}
                                            />
                                        </>
                                    )}

                                    {/* Attribution Percentage Over Time */}
                                    {revenueMetric === 'attribution' && (
                                        <Line
                                            type="monotone"
                                            dataKey="attributionPercentage"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            name="Attribution %"
                                            dot={{ fill: '#10b981', r: 3 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                No trend data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Account Comparison Table */}
            {sortedAllAccountComparison.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Account Performance Comparison</CardTitle>
                        <CardDescription>Revenue breakdown by account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th
                                            className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'account') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('account')
                                                    setSortDirection('asc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1">
                                                Account
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'totalRevenue') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('totalRevenue')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                Revenue
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'orders') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('orders')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                Orders
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'aov') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('aov')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                AOV
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'campaignRevenue') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('campaignRevenue')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                Campaign Rev
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'flowRevenue') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('flowRevenue')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                Flow Rev
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'emailCTR') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('emailCTR')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                Email CTR
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'returnRate') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('returnRate')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                New vs Return
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'campaignsSent') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('campaignsSent')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                Campaigns
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'attributedRevenuePerRecipient') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('attributedRevenuePerRecipient')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>Attr Rev/Recipient</span>
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right py-3 px-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            onClick={() => {
                                                if (sortField === 'totalRevenuePerRecipient') {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                                                } else {
                                                    setSortField('totalRevenuePerRecipient')
                                                    setSortDirection('desc')
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                <span>Total Rev/Recipient</span>
                                                <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAllAccountComparison.map((account, index) => (
                                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                            <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{account.account}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(account.totalRevenue)}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">{formatNumber(account.orders)}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">{formatCurrency(account.aov)}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">{formatCurrency(account.campaignRevenue || 0)}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">{formatCurrency(account.flowRevenue || 0)}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">{account.emailCTR ? formatPercentage(account.emailCTR) : '-'}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">
                                                <div className="text-right">
                                                    <div className="font-medium">{account.returnRate.toFixed(3)}%</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {account.newCustomers || 0}/{account.returningCustomers || 0}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">{formatNumber(account.campaignsSent || 0)}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">${(account.attributedRevenuePerRecipient || 0).toFixed(2)}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-300">${(account.totalRevenuePerRecipient || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {totals && (
                                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                                            <td className="py-3 px-2 text-gray-900 dark:text-gray-100">Total</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(totals.totalRevenue)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatNumber(totals.totalOrders)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(totals.avgAOV)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(totals.totalCampaignRevenue)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(totals.totalFlowRevenue)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatPercentage(totals.avgEmailCTR)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">
                                                <div className="text-right">
                                                    <div>{totals.avgReturnRate.toFixed(3)}%</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {totals.totalNewCustomers}/{totals.totalReturningCustomers}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">{formatNumber(totals.totalCampaigns)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">${totals.avgAttributedRevenuePerRecipient.toFixed(2)}</td>
                                            <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-100">${totals.avgTotalRevenuePerRecipient.toFixed(2)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
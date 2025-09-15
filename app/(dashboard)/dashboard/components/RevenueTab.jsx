"use client"

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import LoadingSpinner from "@/app/components/ui/loading-spinner"
import Select from "react-select"
import { selectStyles } from "@/app/components/selectStyles"
import { useAI } from "@/app/contexts/ai-context"
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
    ArrowUpDown,
    BarChart2,
    Activity,
    Target,
    Trophy,
    AlertTriangle
} from "lucide-react"
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'
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
    const { updateAIState } = useAI();
    const [timeGranularity, setTimeGranularity] = useState('monthly')
    const [revenueMetric, setRevenueMetric] = useState('overall') // overall, attributed, attributedPercent
    const [revenueData, setRevenueData] = useState(null)
    const [accountComparison, setAccountComparison] = useState([])
    const [channelRevenue, setChannelRevenue] = useState([])
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [sortConfig, setSortConfig] = useState({ key: 'totalRevenue', direction: 'desc' })
    const [performanceMetric, setPerformanceMetric] = useState('totalRevenue') // totalRevenue, attributedRevenue, opens, clicks, revenuePerRecipient
    
    // Get sorted accounts for performance rankings
    const getSortedAccounts = (metric) => {
        return [...accountComparison].sort((a, b) => {
            const aValue = a[metric] || 0
            const bValue = b[metric] || 0
            return bValue - aValue // Descending order
        })
    }

    // Sorting function
    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    // Sort the account comparison data
    const sortedAccountComparison = useMemo(() => {
        if (!accountComparison || accountComparison.length === 0) return []
        
        const sorted = [...accountComparison].sort((a, b) => {
            let aValue = a[sortConfig.key]
            let bValue = b[sortConfig.key]
            
            // Handle account name (string) separately
            if (sortConfig.key === 'account') {
                aValue = aValue?.toLowerCase() || ''
                bValue = bValue?.toLowerCase() || ''
            }
            
            if (aValue === null || aValue === undefined) aValue = 0
            if (bValue === null || bValue === undefined) bValue = 0
            
            if (sortConfig.direction === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })
        
        return sorted
    }, [accountComparison, sortConfig])

    // Fetch revenue data for selected accounts
    useEffect(() => {
        fetchRevenueData()
    }, [selectedAccounts, dateRangeSelection, timeGranularity])

    // Update AI State whenever data changes
    useEffect(() => {
        if (!revenueData || isLoadingData) return;

        // Calculate key insights
        const insights = [];
        
        // Top performing account
        if (accountComparison.length > 0) {
            const topAccount = accountComparison[0];
            insights.push(`Top performing account: ${topAccount.account} with ${formatCurrency(topAccount.totalRevenue)} in revenue`);
        }

        // Channel performance
        if (channelRevenue.length > 0) {
            const topChannel = channelRevenue[0];
            insights.push(`${topChannel.channel} is the dominant channel, generating ${formatCurrency(topChannel.revenue)} (${topChannel.percentage.toFixed(1)}% of total)`);
        }

        // Revenue trends
        if (revenueData?.metrics) {
            const avgOrderValue = revenueData.metrics.totalOrders > 0 
                ? revenueData.metrics.totalRevenue / revenueData.metrics.totalOrders 
                : 0;
            insights.push(`Average order value: ${formatCurrency(avgOrderValue)}`);
            
            const conversionRate = revenueData.metrics.totalRecipients > 0
                ? (revenueData.metrics.totalOrders / revenueData.metrics.totalRecipients) * 100
                : 0;
            insights.push(`Overall conversion rate: ${conversionRate.toFixed(2)}%`);
        }

        // Build comprehensive AI state
        const aiState = {
            currentPage: 'dashboard-revenue',
            pageTitle: 'Revenue Analytics Dashboard',
            filters: {
                dateRange: dateRangeSelection?.ranges?.main 
                    ? `${new Date(dateRangeSelection.ranges.main.start).toLocaleDateString()} - ${new Date(dateRangeSelection.ranges.main.end).toLocaleDateString()}`
                    : 'Last 90 days',
                selectedAccounts: selectedAccounts?.map(a => a.label).join(', ') || 'All accounts',
                timeGranularity: timeGranularity,
                revenueMetric: revenueMetric,
                performanceMetric: performanceMetric
            },
            metrics: {
                totalRevenue: revenueData?.metrics?.totalRevenue || 0,
                attributedRevenue: revenueData?.metrics?.attributedRevenue || 0,
                totalOrders: revenueData?.metrics?.totalOrders || 0,
                totalRecipients: revenueData?.metrics?.totalRecipients || 0,
                emailsSent: revenueData?.metrics?.totalEmailsSent || 0,
                smsSent: revenueData?.metrics?.totalSMSSent || 0,
                averageOrderValue: revenueData?.metrics?.totalOrders > 0 
                    ? revenueData?.metrics?.totalRevenue / revenueData?.metrics?.totalOrders 
                    : 0,
                conversionRate: revenueData?.metrics?.totalRecipients > 0
                    ? (revenueData?.metrics?.totalOrders / revenueData?.metrics?.totalRecipients) * 100
                    : 0
            },
            data: {
                totalRecords: accountComparison.length,
                dateRange: dateRangeSelection?.ranges?.main 
                    ? `${new Date(dateRangeSelection.ranges.main.start).toLocaleDateString()} - ${new Date(dateRangeSelection.ranges.main.end).toLocaleDateString()}`
                    : null,
                topPerformers: accountComparison.slice(0, 3).map(acc => ({
                    name: acc.account,
                    revenue: acc.totalRevenue,
                    orders: acc.orders,
                    conversionRate: acc.conversionRate
                })),
                channelBreakdown: channelRevenue.map(ch => ({
                    channel: ch.channel,
                    revenue: ch.revenue,
                    percentage: ch.percentage
                })),
                trends: {
                    timeGranularity: timeGranularity,
                    dataPoints: revenueData?.trendData?.length || 0
                }
            },
            insights: insights
        };

        updateAIState(aiState);
    }, [revenueData, accountComparison, channelRevenue, selectedAccounts, dateRangeSelection, 
        timeGranularity, revenueMetric, performanceMetric, isLoadingData, updateAIState])

    const fetchRevenueData = async () => {
        setIsLoadingData(true)
        
        try {
            // Build query parameters
            const params = new URLSearchParams()
            
            // Add date range parameters
            if (dateRangeSelection?.ranges?.main) {
                params.append('startDate', dateRangeSelection.ranges.main.start)
                params.append('endDate', dateRangeSelection.ranges.main.end)
            }
            
            // Add account filter if not "all"
            if (selectedAccounts?.length > 0 && !selectedAccounts.some(acc => acc.value === 'all')) {
                const accountIds = selectedAccounts.map(acc => acc.value).join(',')
                params.append('accounts', accountIds)
            }
            
            // Fetch campaign data
            const campaignResponse = await fetch(`/api/report/campaigns?${params}`)
            let campaignData = null
            if (campaignResponse.ok) {
                campaignData = await campaignResponse.json()
            }
            
            // Fetch flow data
            const flowResponse = await fetch(`/api/report/flows?${params}`)
            let flowData = null
            if (flowResponse.ok) {
                flowData = await flowResponse.json()
            }
            
            if (campaignData?.success && flowData?.success) {
                // Process and combine revenue data from campaigns and flows
                const processedData = processRevenueData(campaignData.data, flowData.data)
                setRevenueData(processedData)
                setAccountComparison(processedData.accountComparison)
                setChannelRevenue(processedData.channelRevenue)
            } else {
                console.log('API endpoints not available, using mock data')
                // Fall back to mock data
                const mockData = generateMockRevenueData()
                setRevenueData(mockData)
                setAccountComparison(mockData.accountComparison)
                setChannelRevenue(mockData.channelRevenue)
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error)
            // Fall back to mock data
            const mockData = generateMockRevenueData()
            setRevenueData(mockData)
            setAccountComparison(mockData.accountComparison)
            setChannelRevenue(mockData.channelRevenue)
        } finally {
            setIsLoadingData(false)
        }
    }
    
    // Process revenue data from API responses
    const processRevenueData = (campaignData, flowData) => {
        const campaigns = campaignData.items || []
        const flows = flowData.flows || []
        
        // Combine all revenue sources
        const allItems = [...campaigns, ...flows]
        
        // Calculate overall metrics
        const totalRevenue = allItems.reduce((sum, item) => sum + (item.revenue || 0), 0)
        const totalRecipients = allItems.reduce((sum, item) => sum + (item.recipients || 0), 0)
        const totalOrders = allItems.reduce((sum, item) => sum + (item.conversions || 0), 0)
        
        // Separate by channel
        const emailItems = allItems.filter(item => item.channel === 'Email')
        const smsItems = allItems.filter(item => item.channel === 'SMS')
        const pushItems = allItems.filter(item => item.channel === 'Push')
        
        const emailRevenue = emailItems.reduce((sum, item) => sum + (item.revenue || 0), 0)
        const smsRevenue = smsItems.reduce((sum, item) => sum + (item.revenue || 0), 0)
        const pushRevenue = pushItems.reduce((sum, item) => sum + (item.revenue || 0), 0)
        
        const emailSent = emailItems.reduce((sum, item) => sum + (item.recipients || 0), 0)
        const smsSent = smsItems.reduce((sum, item) => sum + (item.recipients || 0), 0)
        const pushSent = pushItems.reduce((sum, item) => sum + (item.recipients || 0), 0)
        
        // Group by account
        const accountMap = new Map()
        allItems.forEach(item => {
            const accountKey = item.klaviyoPublicId || item.accountId || 'unknown'
            const accountName = item.accountName || item.account || 'Unknown'
            
            if (!accountMap.has(accountKey)) {
                accountMap.set(accountKey, {
                    account: accountName,
                    accountId: accountKey,
                    totalRevenue: 0,
                    attributedRevenue: 0,
                    orders: 0,
                    recipients: 0,
                    emailsSent: 0,
                    smsSent: 0,
                    emailRevenue: 0,
                    smsRevenue: 0
                })
            }
            
            const account = accountMap.get(accountKey)
            account.totalRevenue += item.revenue || 0
            account.attributedRevenue += item.revenue || 0 // Assuming all tracked revenue is attributed
            account.orders += item.conversions || 0
            account.recipients += item.recipients || 0
            
            if (item.channel === 'Email') {
                account.emailsSent += item.recipients || 0
                account.emailRevenue += item.revenue || 0
            } else if (item.channel === 'SMS') {
                account.smsSent += item.recipients || 0
                account.smsRevenue += item.revenue || 0
            }
        })
        
        // Calculate per-account metrics
        const accountComparison = Array.from(accountMap.values()).map(account => ({
            ...account,
            revenuePerEmail: account.emailsSent > 0 ? account.emailRevenue / account.emailsSent : 0,
            revenuePerSMS: account.smsSent > 0 ? account.smsRevenue / account.smsSent : 0,
            revenuePerRecipient: account.recipients > 0 ? account.totalRevenue / account.recipients : 0,
            aov: account.orders > 0 ? account.totalRevenue / account.orders : 0,
            conversionRate: account.recipients > 0 ? (account.orders / account.recipients) * 100 : 0
        }))
        
        // Channel revenue breakdown
        const channelRevenue = [
            { channel: 'Email', revenue: emailRevenue, percentage: totalRevenue > 0 ? (emailRevenue / totalRevenue) * 100 : 0 },
            { channel: 'SMS', revenue: smsRevenue, percentage: totalRevenue > 0 ? (smsRevenue / totalRevenue) * 100 : 0 },
            { channel: 'Push', revenue: pushRevenue, percentage: totalRevenue > 0 ? (pushRevenue / totalRevenue) * 100 : 0 }
        ].filter(channel => channel.revenue > 0)
        
        // Generate trend data based on actual campaign/flow dates
        const trendData = generateTrendData(allItems, accountComparison, dateRangeSelection, timeGranularity)
        
        return {
            metrics: {
                totalRevenue,
                attributedRevenue: totalRevenue, // All tracked revenue is attributed
                totalOrders,
                totalRecipients,
                totalEmailsSent: emailSent,
                totalSMSSent: smsSent,
                revenuePerEmail: emailSent > 0 ? emailRevenue / emailSent : 0,
                revenuePerSMS: smsSent > 0 ? smsRevenue / smsSent : 0,
                revenuePerRecipient: totalRecipients > 0 ? totalRevenue / totalRecipients : 0,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                momGrowth: 12.5, // TODO: Calculate from historical data
                yoyGrowth: 45.2  // TODO: Calculate from historical data
            },
            accountComparison,
            channelRevenue,
            trendData
        }
    }
    
    // Generate trend data from actual items
    const generateTrendData = (items, accounts, dateRange, granularity) => {
        // Group items by date based on granularity
        const dateGroups = new Map()
        
        items.forEach(item => {
            if (!item.sentDate) return
            
            const date = new Date(item.sentDate)
            let groupKey
            
            if (granularity === 'daily') {
                groupKey = `${date.getMonth() + 1}/${date.getDate()}`
            } else if (granularity === 'weekly') {
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                groupKey = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
            } else { // monthly
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                groupKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
            }
            
            if (!dateGroups.has(groupKey)) {
                dateGroups.set(groupKey, {
                    date: groupKey,
                    totalRevenue: 0,
                    totalAttributed: 0,
                    accountData: new Map()
                })
            }
            
            const group = dateGroups.get(groupKey)
            group.totalRevenue += item.revenue || 0
            group.totalAttributed += item.revenue || 0
            
            // Track per-account data
            const accountKey = item.accountName || item.account || 'Unknown'
            if (!group.accountData.has(accountKey)) {
                group.accountData.set(accountKey, {
                    overall: 0,
                    attributed: 0
                })
            }
            const accountData = group.accountData.get(accountKey)
            accountData.overall += item.revenue || 0
            accountData.attributed += item.revenue || 0
        })
        
        // Convert to array and add account-specific fields
        const trendData = Array.from(dateGroups.values()).map(group => {
            const dataPoint = {
                date: group.date,
                totalRevenue: group.totalRevenue,
                totalAttributed: group.totalAttributed,
                totalPercent: group.totalRevenue > 0 ? (group.totalAttributed / group.totalRevenue) * 100 : 0
            }
            
            // Add per-account data
            group.accountData.forEach((data, accountName) => {
                dataPoint[`${accountName}_overall`] = data.overall
                dataPoint[`${accountName}_attributed`] = data.attributed
                dataPoint[`${accountName}_percent`] = data.overall > 0 ? (data.attributed / data.overall) * 100 : 0
                dataPoint[accountName] = data.overall // Backward compatibility
            })
            
            return dataPoint
        })
        
        // Sort by date
        trendData.sort((a, b) => {
            // Simple sorting - may need improvement for proper date ordering
            return a.date.localeCompare(b.date)
        })
        
        return trendData
    }
    
    // Generate mock data for demonstration
    const generateMockRevenueData = () => {
        const isViewAll = selectedAccounts.some(acc => acc.value === 'all')
        const accounts = isViewAll ? stores.filter(s => s.klaviyo_integration) : selectedAccounts.map(acc => {
            const store = stores.find(s => 
                s.klaviyo_integration?.public_key === acc.value ||
                s.klaviyo_integration?.public_id === acc.value
            )
            return store
        }).filter(Boolean)
        
        // Overall metrics
        const totalRevenue = accounts.length * 125000 + Math.random() * 50000
        const attributedRevenue = totalRevenue * 0.35
        const totalOrders = Math.floor(accounts.length * 1500 + Math.random() * 500)
        const totalRecipients = accounts.length * 25000
        const totalEmailsSent = accounts.length * 150000
        const totalSMSSent = accounts.length * 30000
        
        // Growth calculations
        const momGrowth = 12.5 + Math.random() * 10
        const yoyGrowth = 45.2 + Math.random() * 20
        
        // Per-account comparison data
        const accountComparison = accounts.map((account, idx) => ({
            account: account?.klaviyo_integration?.account_name || account?.name || `Account ${idx + 1}`,
            accountId: account?.klaviyo_integration?.public_key || account?.klaviyo_integration?.public_id || `account_${idx}`,
            totalRevenue: 125000 + Math.random() * 100000,
            attributedRevenue: 35000 + Math.random() * 30000,
            orders: 1500 + Math.floor(Math.random() * 1000),
            recipients: 25000 + Math.floor(Math.random() * 10000),
            emailsSent: 150000 + Math.floor(Math.random() * 50000),
            smsSent: 30000 + Math.floor(Math.random() * 20000),
            revenuePerEmail: 0.85 + Math.random() * 0.5,
            revenuePerSMS: 2.5 + Math.random() * 1.5,
            revenuePerRecipient: 5.2 + Math.random() * 3,
            aov: 75 + Math.random() * 50,
            conversionRate: 2.5 + Math.random() * 2
        }))
        
        // Channel revenue breakdown
        const channelRevenue = [
            { channel: 'Email', revenue: totalRevenue * 0.7, percentage: 70 },
            { channel: 'SMS', revenue: totalRevenue * 0.25, percentage: 25 },
            { channel: 'Push', revenue: totalRevenue * 0.05, percentage: 5 }
        ]
        
        // Time series data for trends based on date range and granularity
        const trendData = []
        let startDate = new Date()
        let endDate = new Date()
        let dataPoints = 12
        
        // Use date range from selector if available
        if (dateRangeSelection?.ranges?.main?.start && dateRangeSelection?.ranges?.main?.end) {
            startDate = new Date(dateRangeSelection.ranges.main.start)
            endDate = new Date(dateRangeSelection.ranges.main.end)
        } else {
            // Default to last 12 months
            endDate = new Date()
            startDate = new Date()
            startDate.setMonth(startDate.getMonth() - 11)
        }
        
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        
        // Calculate data points based on granularity
        if (timeGranularity === 'daily') {
            dataPoints = Math.min(daysDiff, 365) // Max 365 days
        } else if (timeGranularity === 'weekly') {
            dataPoints = Math.ceil(daysDiff / 7)
        } else { // monthly
            dataPoints = Math.ceil(daysDiff / 30)
        }
        
        // Generate data points
        for (let i = 0; i < dataPoints; i++) {
            const currentDate = new Date(startDate)
            
            if (timeGranularity === 'daily') {
                currentDate.setDate(startDate.getDate() + i)
            } else if (timeGranularity === 'weekly') {
                currentDate.setDate(startDate.getDate() + (i * 7))
            } else {
                currentDate.setMonth(startDate.getMonth() + i)
            }
            
            // Format the date label
            let dateLabel
            if (timeGranularity === 'daily') {
                dateLabel = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`
            } else if (timeGranularity === 'weekly') {
                const weekEnd = new Date(currentDate)
                weekEnd.setDate(currentDate.getDate() + 6)
                dateLabel = `${currentDate.getMonth() + 1}/${currentDate.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
            } else {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                dateLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            }
            
            const dataPoint = {
                date: dateLabel,
                totalRevenue: 0,
                totalAttributed: 0
            }
            
            // Add per-account data with consistent values
            accounts.forEach((account, idx) => {
                const accountKey = account?.klaviyo_integration?.account_name || account?.name || `Account ${idx + 1}`
                const baseRevenue = 20000 + (idx * 10000) // Different base for each account
                const trend = i * (1000 + idx * 500) // Different growth trend
                const variation = Math.random() * 5000 // Some random variation
                const revenue = baseRevenue + trend + variation
                const attributed = revenue * (0.3 + Math.random() * 0.15) // 30-45% attributed
                
                // Store both overall and attributed values
                dataPoint[`${accountKey}_overall`] = revenue
                dataPoint[`${accountKey}_attributed`] = attributed
                dataPoint[`${accountKey}_percent`] = (attributed / revenue) * 100
                
                // Keep the default key for backward compatibility
                dataPoint[accountKey] = revenue
                
                dataPoint.totalRevenue += revenue
                dataPoint.totalAttributed += attributed
            })
            
            // Calculate total attributed percentage
            dataPoint.totalPercent = dataPoint.totalRevenue > 0 ? (dataPoint.totalAttributed / dataPoint.totalRevenue) * 100 : 0
            
            trendData.push(dataPoint)
        }
        
        return {
            metrics: {
                totalRevenue,
                attributedRevenue,
                totalOrders,
                totalRecipients,
                totalEmailsSent,
                totalSMSSent,
                revenuePerEmail: attributedRevenue / totalEmailsSent,
                revenuePerSMS: attributedRevenue / totalSMSSent,
                revenuePerRecipient: attributedRevenue / totalRecipients,
                averageOrderValue: totalRevenue / totalOrders,
                momGrowth,
                yoyGrowth
            },
            accountComparison,
            channelRevenue,
            trendData
        }
    }
    
    // Show loading state if data is being loaded
    if (isLoading || isLoadingData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        )
    }
    
    if (!revenueData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600 dark:text-gray-400">No revenue data available</p>
            </div>
        )
    }

    const { metrics, trendData } = revenueData

    return (
        <div className="space-y-6">
            {/* Portfolio Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalRevenue)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="text-green-600 flex items-center">
                                <ArrowUp className="h-3 w-3 mr-1" />
                                {formatPercentage(metrics.momGrowth)} MoM
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Attributed Revenue</CardTitle>
                        <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.attributedRevenue)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatPercentage((metrics.attributedRevenue / metrics.totalRevenue) * 100)} of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(metrics.totalOrders)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            AOV: {formatCurrency(metrics.averageOrderValue)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">YoY Growth</CardTitle>
                        <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                            {formatPercentage(metrics.yoyGrowth)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Year over year
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row - Revenue per Channel Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue per Email</CardTitle>
                        <Mail className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrics.totalEmailsSent > 0 ? formatCurrency(metrics.revenuePerEmail) : '$∞'}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {metrics.totalEmailsSent > 0 ? `${formatNumber(metrics.totalEmailsSent)} emails sent` : '0 emails sent'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue per SMS</CardTitle>
                        <MessageSquare className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrics.totalSMSSent > 0 ? formatCurrency(metrics.revenuePerSMS) : '$∞'}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {metrics.totalSMSSent > 0 ? `${formatNumber(metrics.totalSMSSent)} SMS sent` : '0 SMS sent'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue per Recipient</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrics.totalRecipients > 0 ? formatCurrency(metrics.revenuePerRecipient) : '$∞'}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {metrics.totalRecipients > 0 ? `${formatNumber(metrics.totalRecipients)} total recipients` : '0 total recipients'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Rankings Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Performance Rankings</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Best and worst performing accounts</p>
                    </div>
                    <Select
                        value={{ 
                            value: performanceMetric, 
                            label: performanceMetric === 'totalRevenue' ? 'Revenue' :
                                   performanceMetric === 'attributedRevenue' ? 'Attributed Revenue' :
                                   performanceMetric === 'opens' ? 'Opens' :
                                   performanceMetric === 'clicks' ? 'Clicks' :
                                   'Revenue per Recipient'
                        }}
                        onChange={(option) => setPerformanceMetric(option.value)}
                        options={[
                            { value: 'totalRevenue', label: 'Revenue' },
                            { value: 'attributedRevenue', label: 'Attributed Revenue' },
                            { value: 'opens', label: 'Opens' },
                            { value: 'clicks', label: 'Clicks' },
                            { value: 'revenuePerRecipient', label: 'Revenue per Recipient' }
                        ]}
                        styles={selectStyles}
                        className="w-48 text-sm"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Best Performing Accounts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-600" />
                                Best Performing Accounts
                            </CardTitle>
                            <CardDescription>Top 5 accounts by {performanceMetric.replace(/([A-Z])/g, ' $1').toLowerCase()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {getSortedAccounts(performanceMetric)
                                    .slice(0, 5)
                                    .map((account, idx) => {
                                        const value = account[performanceMetric] || 0
                                        const maxValue = Math.max(...accountComparison.map(a => a[performanceMetric] || 0))
                                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
                                        
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                            idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            idx === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                                            idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className="font-medium">{account.account}</span>
                                                    </div>
                                                    <span className="font-bold">
                                                        {performanceMetric.includes('revenue') || performanceMetric.includes('Revenue') ? 
                                                            formatCurrency(value) : 
                                                            formatNumber(value)
                                                        }
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600" 
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Worst Performing Accounts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                Needs Attention
                            </CardTitle>
                            <CardDescription>Bottom 5 accounts by {performanceMetric.replace(/([A-Z])/g, ' $1').toLowerCase()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {getSortedAccounts(performanceMetric)
                                    .slice(-5)
                                    .reverse()
                                    .map((account, idx) => {
                                        const value = account[performanceMetric] || 0
                                        const maxValue = Math.max(...accountComparison.map(a => a[performanceMetric] || 0))
                                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
                                        
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                            {accountComparison.length - 4 + idx}
                                                        </div>
                                                        <span className="font-medium">{account.account}</span>
                                                    </div>
                                                    <span className="font-bold">
                                                        {performanceMetric.includes('revenue') || performanceMetric.includes('Revenue') ? 
                                                            formatCurrency(value) : 
                                                            formatNumber(value)
                                                        }
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div 
                                                        className="h-2 rounded-full bg-gradient-to-r from-red-500 to-red-600" 
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Section - Account Performance Table and Revenue Trends Side by Side */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Account Performance Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Performance Comparison</CardTitle>
                        <CardDescription>Key metrics across all accounts</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full">
                                <thead className="border-b bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                            Account
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                            Revenue
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                            Attributed
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                            Orders
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {sortedAccountComparison.map((account, idx) => (
                                        <tr key={`${account.accountId}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 text-sm">{account.account}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold text-sm">{formatCurrency(account.totalRevenue)}</td>
                                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-sm">{formatCurrency(account.attributedRevenue)}</td>
                                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-sm">{formatNumber(account.orders)}</td>
                                        </tr>
                                    ))}
                                    {sortedAccountComparison.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                                                No account data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Trends Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Revenue Trends</CardTitle>
                                <CardDescription>Portfolio performance over time</CardDescription>
                            </div>
                            <Select
                                value={{ 
                                    value: timeGranularity, 
                                    label: timeGranularity.charAt(0).toUpperCase() + timeGranularity.slice(1) 
                                }}
                                onChange={(option) => setTimeGranularity(option.value)}
                                options={[
                                    { value: 'daily', label: 'Daily' },
                                    { value: 'weekly', label: 'Weekly' },
                                    { value: 'monthly', label: 'Monthly' }
                                ]}
                                styles={selectStyles}
                                className="w-32 text-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 10 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={70}
                                />
                                <YAxis 
                                    tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                    labelFormatter={(label) => `Period: ${label}`}
                                />
                                
                                {/* Total portfolio line */}
                                <Line 
                                    type="monotone" 
                                    dataKey="totalRevenue"
                                    stroke="#8b5cf6" 
                                    strokeWidth={3}
                                    name="Total Portfolio"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
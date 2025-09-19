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
    AlertTriangle,
    Minus
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
        
        if (revenueData?.current) {
            insights.push(`Total revenue: ${formatCurrency(revenueData.current.totalRevenue)}`);
            insights.push(`Attributed revenue: ${formatCurrency(revenueData.current.attributedRevenue)} (${revenueData.current.attributionRate}%)`);
            
            if (revenueData.growth?.revenue !== 0) {
                const trend = revenueData.growth.revenue > 0 ? 'up' : 'down';
                insights.push(`Revenue is ${trend} ${Math.abs(revenueData.growth.revenue)}% compared to ${revenueData.comparison?.period || 'previous period'}`);
            }
        }

        // Channel performance
        if (revenueData?.channels) {
            if (revenueData.channels.email?.revenue > 0) {
                insights.push(`Email generated ${formatCurrency(revenueData.channels.email.revenue)} (${revenueData.channels.email.percentage}% of total)`);
            }
            if (revenueData.channels.sms?.revenue > 0) {
                insights.push(`SMS generated ${formatCurrency(revenueData.channels.sms.revenue)} (${revenueData.channels.sms.percentage}% of total)`);
            }
        }

        // Build comprehensive AI state
        const aiState = {
            currentPage: 'dashboard-revenue',
            pageTitle: 'Revenue Analytics Dashboard',
            filters: {
                dateRange: dateRangeSelection?.ranges?.main 
                    ? `${new Date(dateRangeSelection.ranges.main.start).toLocaleDateString()} - ${new Date(dateRangeSelection.ranges.main.end).toLocaleDateString()}`
                    : 'Last 90 days',
                comparisonPeriod: dateRangeSelection?.comparisonType || 'previous-period',
                selectedAccounts: selectedAccounts?.map(a => a.label).join(', ') || 'All accounts',
                timeGranularity: timeGranularity,
                performanceMetric: performanceMetric
            },
            metrics: revenueData?.current || {},
            comparison: revenueData?.comparison || {},
            growth: revenueData?.growth || {},
            channels: revenueData?.channels || {},
            customers: revenueData?.customers || {},
            insights: insights
        };

        updateAIState(aiState);
    }, [revenueData, selectedAccounts, dateRangeSelection, timeGranularity, performanceMetric, isLoadingData, updateAIState])

    const fetchRevenueData = async () => {
        setIsLoadingData(true)
        
        try {
            // Build query parameters
            const params = new URLSearchParams()
            
            // Add date range parameters
            if (dateRangeSelection?.ranges?.main) {
                params.append('startDate', new Date(dateRangeSelection.ranges.main.start).toISOString().split('T')[0])
                params.append('endDate', new Date(dateRangeSelection.ranges.main.end).toISOString().split('T')[0])
            }
            
            // Add comparison period parameters
            if (dateRangeSelection?.comparisonType) {
                params.append('comparison', dateRangeSelection.comparisonType)
            }
            
            if (dateRangeSelection?.ranges?.comparison) {
                params.append('comparisonStartDate', new Date(dateRangeSelection.ranges.comparison.start).toISOString().split('T')[0])
                params.append('comparisonEndDate', new Date(dateRangeSelection.ranges.comparison.end).toISOString().split('T')[0])
            }
            
            // Add account filter if not "all"
            if (selectedAccounts?.length > 0 && !selectedAccounts.some(acc => acc.value === 'all')) {
                const accountIds = selectedAccounts.map(acc => acc.value).join(',')
                params.append('storeIds', accountIds)
            }
            
            // Fetch dashboard data from ClickHouse
            const response = await fetch(`/api/report?${params}&type=dashboard`, {
                credentials: 'include'
            })
            
            if (response.ok) {
                const result = await response.json()
                
                if (result.success && result.data) {
                    setRevenueData(result.data)
                    
                    // Process channel revenue for display
                    const channels = []
                    if (result.data.channels?.email) {
                        channels.push({
                            channel: 'Email',
                            revenue: result.data.channels.email.revenue,
                            percentage: parseFloat(result.data.channels.email.percentage)
                        })
                    }
                    if (result.data.channels?.sms) {
                        channels.push({
                            channel: 'SMS',
                            revenue: result.data.channels.sms.revenue,
                            percentage: parseFloat(result.data.channels.sms.percentage)
                        })
                    }
                    setChannelRevenue(channels)
                    
                    // Fetch account performance data
                    const perfResponse = await fetch(`/api/report?${params}&type=performance`, {
                        credentials: 'include'
                    })
                    if (perfResponse.ok) {
                        const perfResult = await perfResponse.json()
                        if (perfResult.success && perfResult.data?.rankings) {
                            setAccountComparison(perfResult.data.rankings.map(acc => ({
                                account: acc.store_name,
                                accountId: acc.store_id,
                                totalRevenue: acc.total_revenue,
                                attributedRevenue: acc.attributed_revenue,
                                orders: acc.total_orders,
                                aov: parseFloat(acc.aov),
                                attributionRate: parseFloat(acc.attribution_rate),
                                emailRevenue: acc.email_revenue,
                                smsRevenue: acc.sms_revenue,
                                revenuePerRecipient: acc.total_revenue / (acc.recipients || 1)
                            })))
                        }
                    }
                } else {
                    console.error('No data returned from API')
                    // Fall back to empty state
                    setRevenueData(null)
                    setAccountComparison([])
                    setChannelRevenue([])
                }
            } else {
                console.error('API request failed:', response.status)
                // Fall back to empty state
                setRevenueData(null)
                setAccountComparison([])
                setChannelRevenue([])
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error)
            // Fall back to empty state
            setRevenueData(null)
            setAccountComparison([])
            setChannelRevenue([])
        } finally {
            setIsLoadingData(false)
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

    const { current, comparison, growth, channels, customers } = revenueData

    // Helper function to get growth indicator
    const getGrowthIndicator = (value) => {
        if (value > 0) return <ArrowUp className="h-3 w-3" />
        if (value < 0) return <ArrowDown className="h-3 w-3" />
        return <Minus className="h-3 w-3" />
    }

    const getGrowthColor = (value) => {
        if (value > 0) return "text-green-600"
        if (value < 0) return "text-red-600"
        return "text-gray-600"
    }

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
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(current?.totalRevenue || 0)}
                        </div>
                        <p className={`text-xs flex items-center ${getGrowthColor(growth?.revenue || 0)}`}>
                            {getGrowthIndicator(growth?.revenue || 0)}
                            {formatPercentage(Math.abs(growth?.revenue || 0))} vs {comparison?.period === 'previous-year' ? 'last year' : 'prev period'}
                        </p>
                        {comparison?.totalRevenue > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Was: {formatCurrency(comparison.totalRevenue)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Attributed Revenue</CardTitle>
                        <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(current?.attributedRevenue || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {current?.attributionRate || 0}% of total
                        </p>
                        {growth?.attributed !== 0 && (
                            <p className={`text-xs flex items-center mt-1 ${getGrowthColor(growth?.attributed || 0)}`}>
                                {getGrowthIndicator(growth?.attributed || 0)}
                                {formatPercentage(Math.abs(growth?.attributed || 0))} vs {comparison?.period === 'previous-year' ? 'last year' : 'prev period'}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(current?.totalOrders || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            AOV: {formatCurrency(current?.aov || 0)}
                        </p>
                        {growth?.orders !== 0 && (
                            <p className={`text-xs flex items-center mt-1 ${getGrowthColor(growth?.orders || 0)}`}>
                                {getGrowthIndicator(growth?.orders || 0)}
                                {formatPercentage(Math.abs(growth?.orders || 0))} vs {comparison?.period === 'previous-year' ? 'last year' : 'prev period'}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Unique Customers</CardTitle>
                        <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(current?.uniqueCustomers || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Recipients: {formatNumber(current?.totalRecipients || 0)}
                        </p>
                        {current?.revenuePerRecipient > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ${current.revenuePerRecipient}/recipient
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Second Row - Revenue per Channel Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Revenue</CardTitle>
                        <Mail className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(channels?.email?.revenue || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {channels?.email?.percentage || 0}% of total • ${channels?.email?.revenuePerRecipient || 0}/recipient
                        </p>
                        {channels?.email?.recipients > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatNumber(channels.email.recipients)} emails sent
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Revenue</CardTitle>
                        <MessageSquare className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(channels?.sms?.revenue || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {channels?.sms?.percentage || 0}% of total • ${channels?.sms?.revenuePerRecipient || 0}/recipient
                        </p>
                        {channels?.sms?.recipients > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatNumber(channels.sms.recipients)} SMS sent
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Segments</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-gray-400">New Customers</span>
                                <span className="text-sm font-bold">{customers?.newPercentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600" 
                                    style={{ width: `${customers?.newPercentage || 0}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatCurrency(customers?.newRevenue || 0)} revenue
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Channel Revenue Breakdown */}
            {channelRevenue.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Channel</CardTitle>
                        <CardDescription>Distribution of revenue across marketing channels</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {channelRevenue.map((channel, idx) => (
                                <div key={channel.channel} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {channel.channel === 'Email' ? (
                                                <Mail className="h-4 w-4 text-blue-600" />
                                            ) : channel.channel === 'SMS' ? (
                                                <MessageSquare className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Activity className="h-4 w-4 text-purple-600" />
                                            )}
                                            <span className="font-medium">{channel.channel}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{formatCurrency(channel.revenue)}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {channel.percentage.toFixed(1)}% of total
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full" 
                                            style={{ 
                                                width: `${channel.percentage}%`,
                                                backgroundColor: COLORS[idx % COLORS.length]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Rankings Section */}
            {accountComparison.length > 0 && (
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
                                       performanceMetric === 'orders' ? 'Orders' :
                                       performanceMetric === 'aov' ? 'AOV' :
                                       'Revenue per Recipient'
                            }}
                            onChange={(option) => setPerformanceMetric(option.value)}
                            options={[
                                { value: 'totalRevenue', label: 'Revenue' },
                                { value: 'attributedRevenue', label: 'Attributed Revenue' },
                                { value: 'orders', label: 'Orders' },
                                { value: 'aov', label: 'AOV' },
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
                                <CardDescription>Top accounts by {performanceMetric.replace(/([A-Z])/g, ' $1').toLowerCase()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {getSortedAccounts(performanceMetric)
                                        .slice(0, Math.min(5, accountComparison.length))
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
                                                            {performanceMetric.includes('revenue') || performanceMetric.includes('Revenue') || performanceMetric === 'aov' ? 
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
                        {accountComparison.length > 1 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        Needs Attention
                                    </CardTitle>
                                    <CardDescription>Bottom accounts by {performanceMetric.replace(/([A-Z])/g, ' $1').toLowerCase()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {getSortedAccounts(performanceMetric)
                                            .slice(-Math.min(5, accountComparison.length))
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
                                                                    {accountComparison.length - Math.min(5, accountComparison.length) + idx + 1}
                                                                </div>
                                                                <span className="font-medium">{account.account}</span>
                                                            </div>
                                                            <span className="font-bold">
                                                                {performanceMetric.includes('revenue') || performanceMetric.includes('Revenue') || performanceMetric === 'aov' ? 
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
                        )}
                    </div>
                </div>
            )}

            {/* Account Performance Table */}
            {accountComparison.length > 0 && (
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
                                        <th className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                            AOV
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {sortedAccountComparison.map((account, idx) => (
                                        <tr key={`${account.accountId}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 text-sm">{account.account}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold text-sm">{formatCurrency(account.totalRevenue)}</td>
                                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-sm">
                                                {formatCurrency(account.attributedRevenue)}
                                                <span className="text-xs text-gray-500 ml-1">({account.attributionRate}%)</span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-sm">{formatNumber(account.orders)}</td>
                                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 text-sm">{formatCurrency(account.aov)}</td>
                                        </tr>
                                    ))}
                                    {sortedAccountComparison.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                                                No account data available
                                            </td>
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
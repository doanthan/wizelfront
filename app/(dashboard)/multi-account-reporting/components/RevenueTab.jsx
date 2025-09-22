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
    ChevronsUpDown
} from "lucide-react"
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

    const fetchRevenueData = async () => {
        setIsLoadingData(true)

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
                comparisonType: dateRangeSelection?.comparisonType || 'previous-period'
            })

            // Add date range
            if (dateRangeSelection?.ranges?.main) {
                params.append('startDate', formatDate(dateRangeSelection.ranges.main.start))
                params.append('endDate', formatDate(dateRangeSelection.ranges.main.end))
            }

            // Add comparison range
            if (dateRangeSelection?.ranges?.comparison) {
                params.append('comparisonStartDate', formatDate(dateRangeSelection.ranges.comparison.start))
                params.append('comparisonEndDate', formatDate(dateRangeSelection.ranges.comparison.end))
            }

            // Call the new multi-account revenue API
            const response = await fetch(`/api/dashboard/multi-account-revenue?${params}`)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
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
        const { stats = {}, trend = {}, campaigns = [], flows = [], byAccount = [], metadata = {} } = data

        console.log('Processing ClickHouse data:', {
            stats,
            trendDataCount: trend.current?.length || 0,
            campaignsCount: campaigns.length,
            flowsCount: flows.length,
            byAccountCount: byAccount.length,
            metadata
        });

        console.log('Debug - Raw ClickHouse Stats:', {
            current_revenue: stats.current_revenue,
            current_campaign_revenue: stats.current_campaign_revenue,
            current_flow_revenue: stats.current_flow_revenue,
            current_orders: stats.current_orders,
            current_customers: stats.current_customers,
            current_new_customers: stats.current_new_customers,
            current_returning_customers: stats.current_returning_customers
        });

        console.log('Debug - Sample Campaign Data:', campaigns.slice(0, 3).map(day => ({
            date: day.date,
            campaign_revenue: day.campaign_revenue,
            email_revenue: day.email_revenue,
            sms_revenue: day.sms_revenue,
            email_recipients: day.email_recipients,
            sms_recipients: day.sms_recipients
        })));

        // Extract metrics from stats
        const totalRevenue = parseFloat(stats.current_revenue) || 0
        const campaignRevenue = parseFloat(stats.current_campaign_revenue) || 0
        const flowRevenue = parseFloat(stats.current_flow_revenue) || 0
        // Attributed revenue is campaign + flow revenue (they're subsets of total)
        const attributedRevenue = campaignRevenue + flowRevenue
        const totalOrders = parseInt(stats.current_orders) || 0
        const uniqueCustomers = parseInt(stats.current_customers) || 0
        const newCustomers = parseInt(stats.current_new_customers) || 0
        const returningCustomers = parseInt(stats.current_returning_customers) || 0
        const aov = parseFloat(stats.current_aov) || 0

        // Calculate email/SMS metrics from campaign data
        let emailRevenue = 0
        let smsRevenue = 0
        let emailRecipients = 0
        let smsRecipients = 0

        // Sum up email and SMS metrics from campaigns
        campaigns.forEach(day => {
            emailRevenue += (parseFloat(day.email_revenue) || 0)
            smsRevenue += (parseFloat(day.sms_revenue) || 0)
            emailRecipients += (parseInt(day.email_recipients) || 0)
            smsRecipients += (parseInt(day.sms_recipients) || 0)
        })

        const totalRecipients = emailRecipients + smsRecipients

        // Process account comparison data
        let accountComparison = []

        if (byAccount && byAccount.length > 0) {
            // Use actual per-account data from API
            accountComparison = byAccount.map(account => ({
                account: account.storeName || account.storeId || 'Unknown',
                accountId: account.storeId,
                totalRevenue: parseFloat(account.totalRevenue) || 0,
                attributedRevenue: (parseFloat(account.campaignRevenue) || 0) + (parseFloat(account.flowRevenue) || 0),
                orders: parseInt(account.orders) || 0,
                recipients: parseInt(account.recipients) || 0,
                emailsSent: parseInt(account.emailRecipients) || 0,
                smsSent: parseInt(account.smsRecipients) || 0,
                emailRevenue: parseFloat(account.emailRevenue) || 0,
                smsRevenue: parseFloat(account.smsRevenue) || 0,
                revenuePerEmail: account.emailRecipients > 0 ? (account.emailRevenue / account.emailRecipients) : 0,
                revenuePerSMS: account.smsRecipients > 0 ? (account.smsRevenue / account.smsRecipients) : 0,
                revenuePerRecipient: account.recipients > 0 ? (account.totalRevenue / account.recipients) : 0,
                aov: account.orders > 0 ? (account.totalRevenue / account.orders) : 0,
                conversionRate: account.recipients > 0 ? ((account.orders / account.recipients) * 100) : 0
            }))
        } else if (metadata.storeCount > 0) {
            // Fallback to aggregated data
            accountComparison = [{
                account: metadata.storeCount > 1 ? `${metadata.storeCount} Accounts Combined` : 'Account',
                accountId: 'aggregated',
                totalRevenue: totalRevenue,
                attributedRevenue: attributedRevenue,
                orders: totalOrders,
                recipients: totalRecipients,
                emailsSent: emailRecipients,
                smsSent: smsRecipients,
                emailRevenue: emailRevenue,
                smsRevenue: smsRevenue,
                revenuePerEmail: emailRecipients > 0 ? emailRevenue / emailRecipients : 0,
                revenuePerSMS: smsRecipients > 0 ? smsRevenue / smsRecipients : 0,
                revenuePerRecipient: totalRecipients > 0 ? attributedRevenue / totalRecipients : 0,
                aov: aov,
                conversionRate: totalRecipients > 0 ? ((totalOrders / totalRecipients) * 100) : 0
            }]
        }

        // Channel revenue breakdown
        const channelRevenue = []
        if (emailRevenue > 0) {
            channelRevenue.push({
                channel: 'Email',
                revenue: emailRevenue,
                percentage: attributedRevenue > 0 ? (emailRevenue / attributedRevenue) * 100 : 0
            })
        }
        if (smsRevenue > 0) {
            channelRevenue.push({
                channel: 'SMS',
                revenue: smsRevenue,
                percentage: attributedRevenue > 0 ? (smsRevenue / attributedRevenue) * 100 : 0
            })
        }

        // Process time series data based on granularity
        const trendData = processTimeSeries(trend, campaigns, granularity)

        console.log('Revenue Metrics Calculated:', {
            totalRevenue,
            attributedRevenue,
            emailRecipients,
            smsRecipients,
            accountCount: accountComparison.length,
            trendDataCount: trendData.length
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
                revenuePerEmail: emailRecipients > 0 ? emailRevenue / emailRecipients : 0,
                revenuePerSMS: smsRecipients > 0 ? smsRevenue / smsRecipients : 0,
                revenuePerRecipient: totalRecipients > 0 ? attributedRevenue / totalRecipients : 0,
                averageOrderValue: aov,
                momGrowth: parseFloat(stats.revenue_change) || 0,
                yoyGrowth: parseFloat(stats.revenue_change) || 0,
                // Include comparison changes if available
                revenueChange: parseFloat(stats.revenue_change) || 0,
                attributedRevenueChange: parseFloat(stats.campaign_revenue_change) || 0,
                ordersChange: parseFloat(stats.order_change) || 0,
                customersChange: parseFloat(stats.customer_change) || 0,
                avgOrderValueChange: parseFloat(stats.aov_change) || 0,
                newCustomersChange: parseFloat(stats.new_customer_change) || 0
            },
            accountComparison,
            channelRevenue,
            trendData
        }
    }

    // Process time series data based on granularity
    const processTimeSeries = (trendData, campaignData, granularity) => {
        const currentTrend = trendData.current || []
        const comparisonTrend = trendData.comparison || []

        if (!currentTrend || currentTrend.length === 0) return []

        // Group time series by the selected granularity
        const grouped = new Map()
        const accountDataMap = new Map() // Track per-account data

        currentTrend.forEach(point => {
            const date = new Date(point.date)
            let groupKey
            let dateObj = date

            if (granularity === 'daily') {
                groupKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            } else if (granularity === 'weekly') {
                // Get week start
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                groupKey = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                dateObj = weekStart
            } else { // monthly
                groupKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                dateObj = new Date(date.getFullYear(), date.getMonth(), 1)
            }


            if (!grouped.has(groupKey)) {
                grouped.set(groupKey, {
                    date: groupKey,
                    dateObj: dateObj,
                    totalRevenue: 0,
                    totalAttributed: 0,
                    campaignRevenue: 0,
                    flowRevenue: 0,
                    orders: 0,
                    customers: 0,
                    accountData: new Map()
                })
            }

            const group = grouped.get(groupKey)
            // Use the actual point values
            const revenue = parseFloat(point.revenue) || 0
            const campaignRev = parseFloat(point.campaign_revenue) || 0
            const flowRev = parseFloat(point.flow_revenue) || 0

            // For monthly/weekly grouping, sum the daily values
            group.totalRevenue += revenue
            group.campaignRevenue += campaignRev
            group.flowRevenue += flowRev
            group.totalAttributed += campaignRev + flowRev
            group.orders += parseInt(point.orders) || 0
            group.customers += parseInt(point.customers) || 0

            // Track per-account data if available
            if (point.storeId || point.accountId) {
                const accountKey = point.storeName || point.accountName || point.storeId || point.accountId
                if (!group.accountData.has(accountKey)) {
                    group.accountData.set(accountKey, {
                        overall: 0,
                        attributed: 0,
                        campaign: 0,
                        flow: 0
                    })
                }
                const accountData = group.accountData.get(accountKey)
                accountData.overall += revenue
                accountData.campaign += campaignRev
                accountData.flow += flowRev
                accountData.attributed += campaignRev + flowRev
            }
        })

        // Convert to array and format, sorted by date
        const trendDataArray = Array.from(grouped.values())
            .sort((a, b) => a.dateObj - b.dateObj)
            .map(group => {
                const dataPoint = {
                    date: group.date,
                    totalRevenue: group.totalRevenue,
                    totalAttributed: group.totalAttributed,
                    campaignRevenue: group.campaignRevenue,
                    flowRevenue: group.flowRevenue,
                    totalPercent: group.totalRevenue > 0 ? (group.totalAttributed / group.totalRevenue) * 100 : 0,
                    orders: group.orders,
                    customers: group.customers
                }

                // Add per-account data for multi-account line charts
                group.accountData.forEach((data, accountName) => {
                    dataPoint[`${accountName}_overall`] = data.overall
                    dataPoint[`${accountName}_attributed`] = data.attributed
                    dataPoint[`${accountName}_percent`] = data.overall > 0 ? (data.attributed / data.overall) * 100 : 0
                    dataPoint[accountName] = data.overall // Backward compatibility
                })

                return dataPoint
            })

        return trendDataArray
    }

    // Process revenue data from API responses (OLD - keeping for reference)
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
                <p className="text-gray-600 dark:text-[#111827]">No revenue data available</p>
            </div>
        )
    }

    const { metrics, trendData } = revenueData

    // Extract additional metrics for new cards
    const totalRevenue = metrics?.totalRevenue || 0
    const attributedRevenue = metrics?.attributedRevenue || 0
    const totalRecipients = metrics?.totalRecipients || 0
    const uniqueCustomers = metrics?.uniqueCustomers || 0

    // Sort function for table
    const handleSort = (field) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    return (
        <div className="space-y-4">
            {/* Key Revenue Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-600 dark:text-[#111827]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalRevenue)}</div>
                        <p className="text-xs text-gray-600 dark:text-[#111827]">
                            {metrics.revenueChange !== undefined && metrics.revenueChange !== null ? (
                                <span className={`flex items-center ${metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.revenueChange >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                    {formatPercentage(Math.abs(metrics.revenueChange))} vs {dateRangeSelection?.ranges?.comparison?.label || 'previous period'}
                                </span>
                            ) : (
                                <span className="text-gray-500">No comparison data</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Attributed Revenue</CardTitle>
                        <Target className="h-4 w-4 text-gray-600 dark:text-[#111827]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.attributedRevenue)}</div>
                        <p className="text-xs text-gray-600 dark:text-[#111827]">
                            {metrics.attributedRevenueChange !== undefined && metrics.attributedRevenueChange !== null ? (
                                <span className={`flex items-center ${metrics.attributedRevenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.attributedRevenueChange >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                    {formatPercentage(Math.abs(metrics.attributedRevenueChange))} vs {dateRangeSelection?.ranges?.comparison?.label || 'previous'}
                                </span>
                            ) : (
                                <span>{formatPercentage((metrics.attributedRevenue / metrics.totalRevenue) * 100)} of total</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-[#111827]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(metrics.totalOrders)}</div>
                        <p className="text-xs text-gray-600 dark:text-[#111827]">
                            {metrics.ordersChange !== undefined && metrics.ordersChange !== null ? (
                                <span className={`flex items-center ${metrics.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.ordersChange >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                    {formatPercentage(Math.abs(metrics.ordersChange))} | AOV: {formatCurrency(metrics.averageOrderValue)}
                                </span>
                            ) : (
                                <span>AOV: {formatCurrency(metrics.averageOrderValue)}</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Unique Customers</CardTitle>
                        <Users className="h-4 w-4 text-gray-600 dark:text-[#111827]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(metrics.uniqueCustomers || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-[#111827]">
                            {metrics.customersChange !== undefined && metrics.customersChange !== null ? (
                                <span className={`flex items-center ${metrics.customersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.customersChange >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                    {formatPercentage(Math.abs(metrics.customersChange))} vs {dateRangeSelection?.ranges?.comparison?.label || 'previous'}
                                </span>
                            ) : (
                                <span>{formatNumber(metrics.newCustomers || 0)} new, {formatNumber(metrics.returningCustomers || 0)} returning</span>
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Efficiency Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue per Email</CardTitle>
                        <Mail className="h-4 w-4 text-gray-600 dark:text-[#111827]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.revenuePerEmail)}</div>
                        <p className="text-xs text-gray-600 dark:text-[#111827]">
                            {formatNumber(metrics.totalEmailsSent)} emails sent
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue per SMS</CardTitle>
                        <MessageSquare className="h-4 w-4 text-gray-600 dark:text-[#111827]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.revenuePerSMS)}</div>
                        <p className="text-xs text-gray-600 dark:text-[#111827]">
                            {formatNumber(metrics.totalSMSSent)} SMS sent
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue per Recipient</CardTitle>
                        <Users className="h-4 w-4 text-gray-600 dark:text-[#111827]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.revenuePerRecipient)}</div>
                        <p className="text-xs text-gray-600 dark:text-[#111827]">
                            {formatNumber(metrics.totalRecipients)} total recipients
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Trends Chart */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Revenue Trends</CardTitle>
                            <CardDescription>
                                {selectedAccounts.some(acc => acc.value === 'all') 
                                    ? 'Revenue performance across all accounts' 
                                    : `Revenue performance for ${selectedAccounts.length} selected account${selectedAccounts.length > 1 ? 's' : ''}`
                                }
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {/* Metric Selection */}
                            <Select
                                value={{ 
                                    value: revenueMetric, 
                                    label: revenueMetric === 'overall' ? 'Overall Revenue' : 
                                           revenueMetric === 'attributed' ? 'Attributed Revenue' : 
                                           'Attributed Revenue %'
                                }}
                                onChange={(option) => setRevenueMetric(option.value)}
                                options={[
                                    { value: 'overall', label: 'Overall Revenue' },
                                    { value: 'attributed', label: 'Attributed Revenue' },
                                    { value: 'attributedPercent', label: 'Attributed Revenue %' }
                                ]}
                                styles={selectStyles}
                                className="w-48 text-sm"
                            />
                            {/* Time Granularity */}
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
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        {revenueMetric === 'overall' ? (
                            // Show combined chart with overall and attributed revenue
                            <ComposedChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11 }}
                                    angle={trendData.length > 15 ? -45 : 0}
                                    textAnchor={trendData.length > 15 ? "end" : "middle"}
                                    height={trendData.length > 15 ? 70 : 30}
                                />
                                <YAxis
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) {
                                            return `${(value / 1000000).toFixed(1)}M`
                                        }
                                        return `${(value / 1000).toFixed(0)}k`
                                    }}
                                    width={60}
                                />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === 'Attribution %') {
                                            return `${value.toFixed(1)}%`
                                        }
                                        return formatCurrency(value)
                                    }}
                                    labelFormatter={(label) => `Period: ${label}`}
                                />
                                <Legend />

                                {/* Attributed Revenue as Area (underneath) */}
                                <Area
                                    type="monotone"
                                    dataKey="totalAttributed"
                                    fill="#c4b5fd"
                                    fillOpacity={0.3}
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    name="Attributed Revenue"
                                />

                                {/* Overall Revenue as Line (on top) */}
                                <Line
                                    type="monotone"
                                    dataKey="totalRevenue"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    name="Overall Revenue"
                                    dot={false}
                                />

                                {/* Attribution Percentage as secondary Y-axis */}
                                <Line
                                    type="monotone"
                                    dataKey="totalPercent"
                                    stroke="#f97316"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    name="Attribution %"
                                    yAxisId="right"
                                    dot={false}
                                />

                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                                    domain={[0, 100]}
                                    width={50}
                                />
                            </ComposedChart>
                        ) : (
                            // Original line chart for other metrics
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11 }}
                                    angle={trendData.length > 15 ? -45 : 0}
                                    textAnchor={trendData.length > 15 ? "end" : "middle"}
                                    height={trendData.length > 15 ? 70 : 30}
                                />
                                <YAxis
                                    tickFormatter={(value) => {
                                        if (revenueMetric === 'attributedPercent') {
                                            return `${value.toFixed(0)}%`
                                        }
                                        return `${(value / 1000).toFixed(0)}k`
                                    }}
                                    domain={revenueMetric === 'attributedPercent' ? [0, 100] : undefined}
                                />
                                <Tooltip
                                    formatter={(value) => {
                                        if (revenueMetric === 'attributedPercent') {
                                            return `${value.toFixed(1)}%`
                                        }
                                        return formatCurrency(value)
                                    }}
                                    labelFormatter={(label) => `Period: ${label}`}
                                />
                                <Legend />

                                {/* Show total line if multiple accounts */}
                                {accountComparison.length > 1 && (
                                    <Line
                                        type="monotone"
                                        dataKey={
                                            revenueMetric === 'attributed' ? 'totalAttributed' :
                                            'totalPercent'
                                        }
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        name="Total"
                                        dot={false}
                                    />
                                )}

                                {/* Individual account lines */}
                                {accountComparison.map((account, idx) => {
                                    const dataKey = revenueMetric === 'attributed' ?
                                        `${account.account}_attributed` :
                                        `${account.account}_percent`

                                    return (
                                        <Line
                                            key={`${account.accountId}_${revenueMetric}`}
                                            type="monotone"
                                            dataKey={dataKey}
                                            stroke={COLORS[idx % COLORS.length]}
                                            strokeWidth={2}
                                            name={account.account}
                                            dot={false}
                                        />
                                    )
                                })}
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </CardContent>
            </Card>


            {/* Account Comparison Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Performance Comparison</CardTitle>
                    <CardDescription>Revenue metrics across selected accounts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-left">
                                    <th
                                        className="pb-2 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('account')}
                                    >
                                        <div className="flex items-center gap-1 text-[#111827]">
                                            Account
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('totalRevenue')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            Total Revenue
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('attributedRevenue')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            Attributed
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('orders')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            Orders
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('aov')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            AOV
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('revenuePerEmail')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            Rev/Email
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('revenuePerSMS')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            Rev/SMS
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('revenuePerRecipient')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            Rev/Recipient
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                    <th
                                        className="pb-2 font-medium text-right cursor-pointer hover:bg-gray-50 px-2 py-1 rounded select-none"
                                        onClick={() => handleSort('conversionRate')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-[#111827]">
                                            Conv Rate
                                            <ChevronsUpDown className="h-3 w-3 text-[#111827]" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAccountComparison.map((account, idx) => (
                                    <tr key={`${account.accountId}-${idx}`} className="border-b">
                                        <td className="py-3 font-medium text-[#111827]">{account.account}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatCurrency(account.totalRevenue)}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatCurrency(account.attributedRevenue)}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatNumber(account.orders)}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatCurrency(account.aov)}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatCurrency(account.revenuePerEmail)}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatCurrency(account.revenuePerSMS)}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatCurrency(account.revenuePerRecipient)}</td>
                                        <td className="py-3 text-right text-[#111827]">{formatPercentage(account.conversionRate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Revenue by Channel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Attribution by Channel</CardTitle>
                        <CardDescription>Revenue breakdown by communication channel</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={channelRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="channel" />
                                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="revenue" fill="#8b5cf6">
                                    {channelRevenue.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {channelRevenue.map((channel, idx) => (
                                <div key={`${channel.channel}-${idx}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                        />
                                        <span className="text-sm">{channel.channel}</span>
                                    </div>
                                    <div className="text-sm text-right">
                                        <span className="font-medium">{formatCurrency(channel.revenue)}</span>
                                        <span className="text-[#111827] ml-2">({formatPercentage(channel.percentage)})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Account Revenue Ranking */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Revenue Ranking</CardTitle>
                        <CardDescription>Top performing accounts by attributed revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {accountComparison
                                .sort((a, b) => b.attributedRevenue - a.attributedRevenue)
                                .slice(0, 5)
                                .map((account, idx) => {
                                    const maxRevenue = Math.max(...accountComparison.map(a => a.attributedRevenue))
                                    const percentage = (account.attributedRevenue / maxRevenue) * 100
                                    
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-purple-50 text-purple-700'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-medium">{account.account}</span>
                                                </div>
                                                <span className="font-bold">{formatCurrency(account.attributedRevenue)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="h-2 rounded-full bg-purple-600" 
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
    )
}
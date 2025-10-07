"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Download,
  RefreshCw,
  Info,
  ChevronUp,
  ChevronDown,
  MousePointer,
  Eye,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils"
import MorphingLoader from "@/app/components/ui/loading"
import DeliverabilityDetailsModal from "./DeliverabilityDetailsModal"

// Fetch deliverability data from API
const fetchDeliverabilityData = async (stores, selectedAccounts, dateRange) => {
  try {
    // Get store public IDs from selected accounts
    const storePublicIds = selectedAccounts
      .filter(acc => acc.value !== 'all' && !acc.value.startsWith('tag:'))
      .map(acc => acc.value);

    // If "View All" is selected, use all store IDs
    const storeIds = selectedAccounts.some(acc => acc.value === 'all')
      ? stores.map(s => s.public_id)
      : storePublicIds;

    // Build query params
    const params = new URLSearchParams({
      stores: storeIds.join(','),
      startDate: dateRange.ranges?.main?.start?.toISOString() || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: dateRange.ranges?.main?.end?.toISOString() || new Date().toISOString()
    });

    const response = await fetch(`/api/multi-account-reporting/deliverability?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch deliverability data');
    }

    const data = await response.json();
    return {
      campaigns: data.campaigns || [],
      summary: data.summary || {},
      dailyData: []
    };
  } catch (error) {
    console.error('Error fetching deliverability data:', error);
    return { campaigns: [], summary: {}, dailyData: [] };
  }
};

// Legacy mock generator (kept for reference, not used)
const generateMockDeliverabilityData_OLD = (stores, selectedAccounts, dateRange) => {
  const campaigns = [
    {
      campaign_id: "camp_1",
      campaign_name: "Black Friday Mega Sale",
      store_public_id: "store_1",
      store_name: "Acme Fashion",
      account_name: "Acme Fashion",
      send_date: "2024-01-20",
      channel: "Email",
      tags: ["promotional", "holiday"],
      color: "#3B82F6"
    },
    {
      campaign_id: "camp_2",
      campaign_name: "Welcome Series - Email 1",
      store_public_id: "store_1",
      store_name: "Acme Fashion",
      account_name: "Acme Fashion",
      send_date: "2024-01-18",
      channel: "Email",
      tags: ["automation", "welcome"],
      color: "#10B981"
    },
    {
      campaign_id: "camp_3",
      campaign_name: "Product Launch Announcement",
      store_public_id: "store_2",
      store_name: "Beauty Boutique",
      account_name: "Beauty Boutique",
      send_date: "2024-01-15",
      channel: "Email",
      tags: ["product", "announcement"],
      color: "#8B5CF6"
    },
    {
      campaign_id: "camp_4",
      campaign_name: "Customer Winback Campaign",
      store_public_id: "store_2",
      store_name: "Beauty Boutique",
      account_name: "Beauty Boutique",
      send_date: "2024-01-12",
      channel: "Email",
      tags: ["winback", "retention"],
      color: "#F59E0B"
    },
    {
      campaign_id: "camp_5",
      campaign_name: "Weekly Newsletter #47",
      store_public_id: "store_3",
      store_name: "Tech Store",
      account_name: "Tech Store",
      send_date: "2024-01-10",
      channel: "Email",
      tags: ["newsletter", "content"],
      color: "#EC4899"
    },
    {
      campaign_id: "camp_6",
      campaign_name: "Flash Sale - 2 Hours Only",
      store_public_id: "store_1",
      store_name: "Acme Fashion",
      account_name: "Acme Fashion",
      send_date: "2024-01-08",
      channel: "Email",
      tags: ["sale", "urgent"],
      color: "#EF4444"
    }
  ]

  // Generate performance data for each campaign with realistic deliverability scenarios
  const campaignData = []

  campaigns.forEach(campaign => {
    // Create different deliverability scenarios
    let deliveryRate, bounceRate, spamRate, unsubscribeRate, openRate, clickRate

    switch (campaign.campaign_id) {
      case "camp_1": // Excellent performance
        deliveryRate = 99.2
        bounceRate = 0.8
        spamRate = 0.05
        unsubscribeRate = 0.3
        openRate = 28.5
        clickRate = 4.2
        break
      case "camp_2": // Good performance
        deliveryRate = 98.8
        bounceRate = 1.2
        spamRate = 0.08
        unsubscribeRate = 0.4
        openRate = 32.1
        clickRate = 3.8
        break
      case "camp_3": // Average performance
        deliveryRate = 97.5
        bounceRate = 2.5
        spamRate = 0.12
        unsubscribeRate = 0.6
        openRate = 23.7
        clickRate = 2.9
        break
      case "camp_4": // Poor performance - high bounces
        deliveryRate = 94.2
        bounceRate = 5.8
        spamRate = 0.25
        unsubscribeRate = 1.2
        openRate = 18.3
        clickRate = 1.8
        break
      case "camp_5": // Warning performance - spam issues
        deliveryRate = 96.8
        bounceRate = 3.2
        spamRate = 0.18
        unsubscribeRate = 0.8
        openRate = 21.4
        clickRate = 2.3
        break
      case "camp_6": // Critical performance - multiple issues
        deliveryRate = 91.5
        bounceRate = 8.5
        spamRate = 0.35
        unsubscribeRate = 1.8
        openRate = 15.2
        clickRate = 1.1
        break
      default:
        deliveryRate = 98.0
        bounceRate = 2.0
        spamRate = 0.1
        unsubscribeRate = 0.5
        openRate = 25.0
        clickRate = 3.0
    }

    const recipients = Math.floor(Math.random() * 50000) + 10000
    const delivered = Math.floor(recipients * (deliveryRate / 100))
    const bounced = Math.floor(recipients * (bounceRate / 100))
    const opens = Math.floor(delivered * (openRate / 100))
    const clicks = Math.floor(delivered * (clickRate / 100))
    const spamComplaints = Math.floor(delivered * (spamRate / 100))
    const unsubscribes = Math.floor(delivered * (unsubscribeRate / 100))
    const conversions = Math.floor(clicks * 0.08) // 8% conversion rate from clicks
    const revenue = conversions * (150 + Math.random() * 200) // $150-350 AOV

    campaignData.push({
      ...campaign,
      recipients,
      delivered,
      bounced,
      opens,
      clicks,
      spam_complaints: spamComplaints,
      unsubscribes,
      conversions,
      revenue,
      delivery_rate: deliveryRate,
      bounce_rate: bounceRate,
      spam_rate: spamRate,
      unsubscribe_rate: unsubscribeRate,
      open_rate: openRate,
      click_rate: clickRate,
      click_to_open_rate: opens > 0 ? (clicks / opens) * 100 : 0,
      conversion_rate: delivered > 0 ? (conversions / delivered) * 100 : 0,
      revenue_per_recipient: recipients > 0 ? revenue / recipients : 0,
      // Deliverability health score (0-100)
      health_score: Math.min(100,
        (deliveryRate - 90) * 5 + // Delivery rate weight
        Math.max(0, (2 - bounceRate) * 10) + // Bounce rate weight (inverse)
        Math.max(0, (0.3 - spamRate) * 50) + // Spam rate weight (inverse)
        Math.max(0, (1 - unsubscribeRate) * 20) // Unsubscribe rate weight (inverse)
      )
    })
  })

  return { campaigns: campaignData, dailyData: [] }
}

// Color coding function for deliverability metrics
const getDeliverabilityColor = (value, metricType) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "text-gray-500 bg-gray-50"
  }

  switch (metricType) {
    case 'delivery_rate':
      if (value >= 98.5) return "text-green-800 bg-green-50 font-medium"
      else if (value >= 95) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    case 'bounce_rate':
      if (value <= 2) return "text-green-800 bg-green-50 font-medium"
      else if (value <= 5) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    case 'spam_rate':
      if (value <= 0.1) return "text-green-800 bg-green-50 font-medium"
      else if (value <= 0.3) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    case 'unsubscribe_rate':
      if (value <= 0.5) return "text-green-800 bg-green-50 font-medium"
      else if (value <= 1.0) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    case 'open_rate':
      if (value >= 25) return "text-green-800 bg-green-50 font-medium"
      else if (value >= 20) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    case 'click_rate':
      if (value >= 3) return "text-green-800 bg-green-50 font-medium"
      else if (value >= 2) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    case 'health_score':
      if (value >= 80) return "text-green-800 bg-green-50 font-medium"
      else if (value >= 60) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    default:
      return "text-gray-900 bg-white"
  }
}

export default function DeliverabilityTab({
    selectedAccounts,
    dateRangeSelection,
    stores
}) {
    const [loading, setLoading] = useState(true)
    const [deliverabilityData, setDeliverabilityData] = useState({ campaigns: [], dailyData: [] })
    const [searchQuery, setSearchQuery] = useState("")
    const [sortConfig, setSortConfig] = useState({ key: "health_score", direction: "desc" })
    const [filterPerformance, setFilterPerformance] = useState("all") // all, excellent, good, warning, critical
    const [selectedCampaign, setSelectedCampaign] = useState(null)
    const [showCampaignDetails, setShowCampaignDetails] = useState(false)

    // Load deliverability data
    useEffect(() => {
        const loadDeliverabilityData = async () => {
            setLoading(true)
            try {
                // Fetch real data from API
                const data = await fetchDeliverabilityData(stores, selectedAccounts, dateRangeSelection)
                setDeliverabilityData(data)
            } catch (error) {
                console.error("Error loading deliverability data:", error)
                setDeliverabilityData({ campaigns: [], summary: {}, dailyData: [] })
            } finally {
                setLoading(false)
            }
        }

        if (stores.length > 0 && selectedAccounts.length > 0) {
            loadDeliverabilityData()
        }
    }, [stores, selectedAccounts, dateRangeSelection])

    // Calculate aggregate metrics from API summary data
    const calculateAggregateMetrics = useCallback((data) => {
        if (data.length === 0) return {
            totalRecipients: 0,
            totalDelivered: 0,
            deliveryRate: 0,
            bounceRate: 0,
            spamRate: 0,
            unsubscribeRate: 0,
            openRate: 0,
            clickRate: 0,
            totalRevenue: 0,
            revenuePerRecipient: 0,
            avgHealthScore: 0,
            campaignCount: 0
        }

        const totals = data.reduce((acc, item) => {
            acc.recipients += item.recipients || 0
            acc.delivered += item.delivered || 0
            acc.bounced += item.bounced || 0
            acc.spam_complaints += item.spam_complaints || 0
            acc.unsubscribes += item.unsubscribes || 0
            acc.opens += item.opens_unique || 0
            acc.clicks += item.clicks_unique || 0
            acc.revenue += item.revenue || 0
            return acc
        }, {
            recipients: 0, delivered: 0, bounced: 0, spam_complaints: 0,
            unsubscribes: 0, opens: 0, clicks: 0, revenue: 0
        })

        const avgHealthScore = data.reduce((sum, item) => sum + (item.health_score || 0), 0) / data.length

        return {
            totalRecipients: totals.recipients,
            totalDelivered: totals.delivered,
            deliveryRate: totals.recipients > 0 ? (totals.delivered / totals.recipients) * 100 : 0,
            bounceRate: totals.recipients > 0 ? (totals.bounced / totals.recipients) * 100 : 0,
            spamRate: totals.delivered > 0 ? (totals.spam_complaints / totals.delivered) * 100 : 0,
            unsubscribeRate: totals.delivered > 0 ? (totals.unsubscribes / totals.delivered) * 100 : 0,
            openRate: totals.delivered > 0 ? (totals.opens / totals.delivered) * 100 : 0,
            clickRate: totals.delivered > 0 ? (totals.clicks / totals.delivered) * 100 : 0,
            totalRevenue: totals.revenue,
            revenuePerRecipient: totals.recipients > 0 ? totals.revenue / totals.recipients : 0,
            avgHealthScore: avgHealthScore,
            campaignCount: data.length
        }
    }, [])

    // Filter and sort data
    const filteredData = useMemo(() => {
        let filtered = deliverabilityData.campaigns

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(campaign =>
                campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                campaign.store_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Performance filter
        if (filterPerformance !== "all") {
            filtered = filtered.filter(campaign => {
                const score = campaign.health_score
                switch (filterPerformance) {
                    case "excellent": return score >= 80
                    case "good": return score >= 60 && score < 80
                    case "warning": return score >= 40 && score < 60
                    case "critical": return score < 40
                    default: return true
                }
            })
        }

        // Sort data
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key]
                let bValue = b[sortConfig.key]

                if (aValue === null || aValue === undefined) return 1
                if (bValue === null || bValue === undefined) return -1

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase()
                    bValue = bValue.toLowerCase()
                }

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return filtered
    }, [deliverabilityData.campaigns, searchQuery, filterPerformance, sortConfig])

    // Aggregate metrics for filtered data
    const metrics = useMemo(() => {
        return calculateAggregateMetrics(filteredData)
    }, [filteredData, calculateAggregateMetrics])

    // Handle sorting
    const handleSort = (key) => {
        let direction = "asc"
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    // Get sort icon
    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="h-4 w-4 text-gray-300" />
        }
        return sortConfig.direction === "asc" ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
        )
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="flex items-center justify-center h-96">
                        <MorphingLoader size="large" showText={true} text="Loading deliverability data..." />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-gray dark:text-white">
                        Email Deliverability Analytics
                    </h3>
                    <p className="text-sm text-neutral-gray dark:text-gray-400">
                        Monitor sender reputation and delivery performance across accounts
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Metrics Cards - First Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Delivery Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Delivery Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className={`text-2xl font-bold ${getDeliverabilityColor(metrics.deliveryRate, 'delivery_rate').split(' ').slice(0, 2).join(' ')}`}>
                            {formatPercentage(metrics.deliveryRate || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Target: 98.5%+
                        </p>
                    </CardContent>
                </Card>

                {/* Bounce Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Bounce Rate</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className={`text-2xl font-bold ${getDeliverabilityColor(metrics.bounceRate, 'bounce_rate').split(' ').slice(0, 2).join(' ')}`}>
                            {formatPercentage(metrics.bounceRate || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Target: &lt;2%
                        </p>
                    </CardContent>
                </Card>

                {/* Spam Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Spam Rate</CardTitle>
                        <Shield className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className={`text-2xl font-bold ${getDeliverabilityColor(metrics.spamRate, 'spam_rate').split(' ').slice(0, 2).join(' ')}`}>
                            {formatPercentage(metrics.spamRate || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Target: &lt;0.1%
                        </p>
                    </CardContent>
                </Card>

                {/* Unsubscribe Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Unsubscribe Rate</CardTitle>
                        <XCircle className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className={`text-2xl font-bold ${getDeliverabilityColor(metrics.unsubscribeRate, 'unsubscribe_rate').split(' ').slice(0, 2).join(' ')}`}>
                            {formatPercentage(metrics.unsubscribeRate || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Target: &lt;0.5%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Metrics Cards - Second Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Open Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Open Rate</CardTitle>
                        <Eye className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatPercentage(metrics.openRate || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            engagement metric
                        </p>
                    </CardContent>
                </Card>

                {/* Click Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Click Rate</CardTitle>
                        <MousePointer className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatPercentage(metrics.clickRate || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            engagement metric
                        </p>
                    </CardContent>
                </Card>

                {/* Health Score */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Health Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className={`text-2xl font-bold ${getDeliverabilityColor(metrics.avgHealthScore, 'health_score').split(' ').slice(0, 2).join(' ')}`}>
                            {Math.round(metrics.avgHealthScore || 0)}/100
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            overall performance
                        </p>
                    </CardContent>
                </Card>

                {/* Total Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(metrics.totalRevenue || 0)}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            from {metrics.campaignCount || 0} campaigns
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="overflow-hidden max-w-full">
                <CardHeader>
                    <CardTitle className="text-lg">Campaign Deliverability Performance</CardTitle>
                    <CardDescription>
                        Detailed deliverability metrics for each campaign with color-coded performance indicators
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0 max-w-full">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 px-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search campaigns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filterPerformance} onValueChange={setFilterPerformance}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Performance</SelectItem>
                                <SelectItem value="excellent">Excellent (80-100)</SelectItem>
                                <SelectItem value="good">Good (60-79)</SelectItem>
                                <SelectItem value="warning">Warning (40-59)</SelectItem>
                                <SelectItem value="critical">Critical (&lt;40)</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {filteredData.length} campaigns
                        </div>
                    </div>

                    {/* Performance Table */}
                    <div className="overflow-x-auto max-w-full">
                        <div className="inline-block min-w-full align-middle">
                            <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th
                                        className="text-left p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[25%] min-w-[180px]"
                                        onClick={() => handleSort("campaign_name")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Campaign
                                            {getSortIcon("campaign_name")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[15%] min-w-[100px]"
                                        onClick={() => handleSort("store_name")}
                                    >
                                        <div className="flex items-center gap-1">
                                            Store
                                            {getSortIcon("store_name")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[8%]"
                                        onClick={() => handleSort("send_date")}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Date
                                            {getSortIcon("send_date")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[8%]"
                                        onClick={() => handleSort("recipients")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Recip.
                                            {getSortIcon("recipients")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[6%]"
                                        onClick={() => handleSort("delivery_rate")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Deliv.
                                            <TooltipProvider>
                                                <UITooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="font-semibold mb-1">Delivery Rate</p>
                                                        <p>Percentage of emails successfully delivered to recipients' inboxes. Industry standard: 98.5%+</p>
                                                    </TooltipContent>
                                                </UITooltip>
                                            </TooltipProvider>
                                            {getSortIcon("delivery_rate")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[6%]"
                                        onClick={() => handleSort("bounce_rate")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Bounce
                                            <TooltipProvider>
                                                <UITooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="font-semibold mb-1">Bounce Rate</p>
                                                        <p>Emails that couldn't be delivered (hard & soft bounces). Keep below 2% to maintain good sender reputation.</p>
                                                    </TooltipContent>
                                                </UITooltip>
                                            </TooltipProvider>
                                            {getSortIcon("bounce_rate")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[5%]"
                                        onClick={() => handleSort("spam_rate")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Spam
                                            <TooltipProvider>
                                                <UITooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="font-semibold mb-1">Spam Complaint Rate</p>
                                                        <p>Percentage of delivered emails marked as spam. MUST stay below 0.1% to avoid blocklisting.</p>
                                                    </TooltipContent>
                                                </UITooltip>
                                            </TooltipProvider>
                                            {getSortIcon("spam_rate")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[5%]"
                                        onClick={() => handleSort("unsubscribe_rate")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Unsub
                                            <TooltipProvider>
                                                <UITooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="font-semibold mb-1">Unsubscribe Rate</p>
                                                        <p>Percentage of recipients who unsubscribed. Below 0.5% is healthy, above 1% indicates content issues.</p>
                                                    </TooltipContent>
                                                </UITooltip>
                                            </TooltipProvider>
                                            {getSortIcon("unsubscribe_rate")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[5%]"
                                        onClick={() => handleSort("open_rate")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Open
                                            {getSortIcon("open_rate")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[5%]"
                                        onClick={() => handleSort("click_rate")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Click
                                            {getSortIcon("click_rate")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[8%]"
                                        onClick={() => handleSort("revenue")}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Revenue
                                            {getSortIcon("revenue")}
                                        </div>
                                    </th>
                                    <th
                                        className="text-center p-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 w-[6%]"
                                        onClick={() => handleSort("health_score")}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Health
                                            {getSortIcon("health_score")}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((campaign) => (
                                    <tr
                                        key={campaign.campaign_id}
                                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setSelectedCampaign(campaign);
                                            setShowCampaignDetails(true);
                                        }}
                                    >
                                        <td className="p-2 max-w-[200px]">
                                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate" title={campaign.campaign_name}>
                                                {campaign.campaign_name}
                                            </div>
                                        </td>
                                        <td className="p-2 max-w-[120px]">
                                            <div className="text-gray-600 dark:text-gray-400 truncate" title={campaign.store_name}>
                                                {campaign.store_name}
                                            </div>
                                        </td>
                                        <td className="p-2 text-center text-gray-600 dark:text-gray-400">
                                            {new Date(campaign.send_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-2 text-right">{formatNumber(campaign.recipients)}</td>
                                        <td className={`p-2 text-right rounded ${getDeliverabilityColor(campaign.delivery_rate, 'delivery_rate')}`}>
                                            {formatPercentage(campaign.delivery_rate)}
                                        </td>
                                        <td className={`p-2 text-right rounded ${getDeliverabilityColor(campaign.bounce_rate, 'bounce_rate')}`}>
                                            {formatPercentage(campaign.bounce_rate)}
                                        </td>
                                        <td className={`p-2 text-right rounded ${getDeliverabilityColor(campaign.spam_rate, 'spam_rate')}`}>
                                            {formatPercentage(campaign.spam_rate)}
                                        </td>
                                        <td className={`p-2 text-right rounded ${getDeliverabilityColor(campaign.unsubscribe_rate, 'unsubscribe_rate')}`}>
                                            {formatPercentage(campaign.unsubscribe_rate)}
                                        </td>
                                        <td className={`p-2 text-right rounded ${getDeliverabilityColor(campaign.open_rate, 'open_rate')}`}>
                                            {formatPercentage(campaign.open_rate)}
                                        </td>
                                        <td className={`p-2 text-right rounded ${getDeliverabilityColor(campaign.click_rate, 'click_rate')}`}>
                                            {formatPercentage(campaign.click_rate)}
                                        </td>
                                        <td className="p-2 text-right text-gray-900 dark:text-gray-100 font-medium">
                                            {formatCurrency(campaign.revenue)}
                                        </td>
                                        <td className="p-2 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDeliverabilityColor(campaign.health_score, 'health_score')}`}>
                                                {Math.round(campaign.health_score)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>

                        {filteredData.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No campaigns found matching your criteria</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Campaign Details Modal */}
            <DeliverabilityDetailsModal
                campaign={selectedCampaign}
                isOpen={showCampaignDetails}
                onClose={() => {
                    setShowCampaignDetails(false);
                    setSelectedCampaign(null);
                }}
                stores={stores}
            />
        </div>
    )
}
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Checkbox } from "@/app/components/ui/checkbox"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import FlowMessageDetailModal from "@/app/components/flows/FlowMessageDetailModal"
import { MultiSelect } from "@/app/components/ui/multi-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs"
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
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Users,
  Target,
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  DollarSign,
  MousePointer,
  Eye,
  CheckCircle,
  Zap,
  Search,
  ArrowUpDown,
  Download,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils"
import MorphingLoader from "@/app/components/ui/loading"

// Generate colors for flows based on their index
const getFlowColor = (index) => {
  const colors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#84CC16", // Lime
    "#F97316", // Orange
    "#6366F1"  // Indigo
  ]
  return colors[index % colors.length]
}

export default function FlowsTab({
    selectedAccounts,
    dateRangeSelection,
    stores
}) {
    const [loading, setLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [flowsData, setFlowsData] = useState({ flows: [], dailyData: [] })
    const [messagesData, setMessagesData] = useState([])
    const [selectedFlows, setSelectedFlows] = useState([])
    const [selectedMessages, setSelectedMessages] = useState([]) // For message comparison
    const [comparisonMode, setComparisonMode] = useState("flows") // "flows" or "messages"
    const [selectedMessage, setSelectedMessage] = useState(null)
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [filterStore, setFilterStore] = useState("all")
    // Table-specific filters
    const [tableSearchQuery, setTableSearchQuery] = useState("")
    const [tableFilterStores, setTableFilterStores] = useState([]) // Array of store IDs
    const [tableFilterTags, setTableFilterTags] = useState([]) // Array of tag names
    const [tableViewMode, setTableViewMode] = useState("flows") // "flows" or "messages"
    const [tableSortColumn, setTableSortColumn] = useState("totalRecipients")
    const [tableSortDirection, setTableSortDirection] = useState("desc")
    const [chartType, setChartType] = useState("performance") // performance, revenue, conversion
    const [chartView, setChartView] = useState("line") // line, area, bar
    const [comparisonMetric, setComparisonMetric] = useState("open_rate")
    const [refreshKey, setRefreshKey] = useState(0) // For triggering manual refresh

    // Calculate aggregate metrics
    const calculateAggregateMetrics = useCallback((data) => {
        if (data.length === 0) return {}

        const totals = data.reduce((acc, item) => {
            acc.recipients += item.recipients || 0
            acc.delivered += item.delivered || 0
            acc.opens += item.opens_unique || 0
            acc.clicks += item.clicks_unique || 0
            acc.conversions += (item.conversion_uniques || item.conversions) || 0
            acc.revenue += item.conversion_value || 0
            acc.bounced += item.bounced || 0
            acc.unsubscribes += (item.unsubscribe_uniques || item.unsubscribes) || 0
            return acc
        }, {
            recipients: 0, delivered: 0, opens: 0, clicks: 0, conversions: 0,
            revenue: 0, bounced: 0, unsubscribes: 0
        })

        return {
            totalRecipients: totals.recipients,
            totalRevenue: totals.revenue,
            openRate: totals.recipients > 0 ? (totals.opens / totals.recipients) * 100 : 0,
            clickRate: totals.recipients > 0 ? (totals.clicks / totals.recipients) * 100 : 0,
            conversionRate: totals.recipients > 0 ? (totals.conversions / totals.recipients) * 100 : 0,
            bounceRate: totals.recipients > 0 ? (totals.bounced / totals.recipients) * 100 : 0,
            unsubscribeRate: totals.recipients > 0 ? (totals.unsubscribes / totals.recipients) * 100 : 0,
            averageOrderValue: totals.conversions > 0 ? totals.revenue / totals.conversions : 0,
            revenuePerRecipient: totals.recipients > 0 ? totals.revenue / totals.recipients : 0
        }
    }, [])

    // Load flows data
    useEffect(() => {
        const loadFlowsData = async () => {
            setLoading(true)
            try {
                // Build query parameters
                const params = new URLSearchParams()

                // Use store public IDs - extract values from account objects
                if (selectedAccounts && selectedAccounts.length > 0) {
                    const accountIds = selectedAccounts
                        .filter(account => account.value !== 'all') // Filter out 'View All' option
                        .map(account => account.value)
                    if (accountIds.length > 0) {
                        params.append('stores', accountIds.join(','))
                    }
                }

                // Add date range
                if (dateRangeSelection?.ranges?.main?.start) {
                    params.append('startDate', dateRangeSelection.ranges.main.start.toISOString().split('T')[0])
                }
                if (dateRangeSelection?.ranges?.main?.end) {
                    params.append('endDate', dateRangeSelection.ranges.main.end.toISOString().split('T')[0])
                }

                // Fetch from the API
                const url = `/api/multi-account-reporting/flows?${params.toString()}`
                const response = await fetch(url)

                let data;
                try {
                    data = await response.json()
                } catch (e) {
                    console.error('Failed to parse JSON response:', e)
                    throw new Error('Failed to parse server response')
                }

                if (!response.ok) {
                    console.error('API error:', data)
                    throw new Error(data.error || `Failed to fetch flows data (${response.status})`)
                }

                // Set flows data with assigned colors
                const flowsWithColors = (data.flows || []).map((flow, index) => ({
                    ...flow,
                    color: getFlowColor(index)
                }))

                setFlowsData({
                    flows: flowsWithColors,
                    dailyData: data.dailyStats || []
                })

                // Auto-select first 3 flows for comparison
                const initialSelection = flowsWithColors.slice(0, 3).map(f => f.flow_id)
                setSelectedFlows(initialSelection)
            } catch (error) {
                console.error("Error loading flows data:", error)
                setFlowsData({ flows: [], dailyData: [] })
            } finally {
                setLoading(false)
            }
        }

        // Only load if we have date ranges set up
        if (dateRangeSelection?.ranges?.main?.start && dateRangeSelection?.ranges?.main?.end) {
            loadFlowsData()
        }
    }, [stores, selectedAccounts, dateRangeSelection, refreshKey])

    // Load messages data when in messages comparison mode
    useEffect(() => {
        const loadMessagesData = async () => {
            if (comparisonMode !== 'messages') return

            setMessagesLoading(true)
            try {
                // Build query parameters
                const params = new URLSearchParams()

                // Use store public IDs - extract values from account objects
                if (selectedAccounts && selectedAccounts.length > 0) {
                    const accountIds = selectedAccounts
                        .filter(account => account.value !== 'all')
                        .map(account => account.value)
                    if (accountIds.length > 0) {
                        params.append('stores', accountIds.join(','))
                    }
                }

                // Add date range
                if (dateRangeSelection?.ranges?.main?.start) {
                    params.append('startDate', dateRangeSelection.ranges.main.start.toISOString().split('T')[0])
                }
                if (dateRangeSelection?.ranges?.main?.end) {
                    params.append('endDate', dateRangeSelection.ranges.main.end.toISOString().split('T')[0])
                }

                // Add viewMode parameter
                params.append('viewMode', 'messages')

                // Fetch from the API
                const response = await fetch(`/api/multi-account-reporting/flows?${params.toString()}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch messages data')
                }

                // Set messages data with assigned colors
                const messagesWithColors = (data.messages || []).map((message, index) => ({
                    ...message,
                    color: getFlowColor(index)
                }))

                console.log('Messages loaded:', messagesWithColors.length)
                if (messagesWithColors.length > 0) {
                    console.log('Sample message:', messagesWithColors[0])
                }

                setMessagesData(messagesWithColors)
            } catch (error) {
                console.error("Error loading messages data:", error)
                setMessagesData([])
            } finally {
                setMessagesLoading(false)
            }
        }

        // Only load if we have date ranges set up and we're in messages comparison mode
        if (dateRangeSelection?.ranges?.main?.start && dateRangeSelection?.ranges?.main?.end && comparisonMode === 'messages') {
            loadMessagesData()
        }
    }, [stores, selectedAccounts, dateRangeSelection, refreshKey, comparisonMode])

    // Refresh handler
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1)
    }

    // Filter flows based on search and filters (for comparison selector)
    const filteredFlows = useMemo(() => {
        return flowsData.flows.filter(flow => {
            if (searchQuery && !flow.flow_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !flow.store_name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }
            if (filterStatus !== "all" && flow.status !== filterStatus) {
                return false
            }
            if (filterStore !== "all" && flow.store_public_id !== filterStore) {
                return false
            }
            return true
        })
    }, [flowsData.flows, searchQuery, filterStatus, filterStore])

    // Filter flows for table (independent filters)
    const tableFilteredFlows = useMemo(() => {
        return flowsData.flows.filter(flow => {
            // Search filter
            if (tableSearchQuery &&
                !flow.flow_name.toLowerCase().includes(tableSearchQuery.toLowerCase()) &&
                !flow.store_name.toLowerCase().includes(tableSearchQuery.toLowerCase())) {
                return false
            }

            // Store filter - if stores selected, flow must match one of them
            if (tableFilterStores.length > 0 && !tableFilterStores.includes(flow.store_public_id)) {
                return false
            }

            return true
        })
    }, [flowsData.flows, tableSearchQuery, tableFilterStores])

    // Filter messages for table (independent filters)
    const tableFilteredMessages = useMemo(() => {
        return messagesData.filter(message => {
            // Search filter
            if (tableSearchQuery &&
                !message.flow_message_name.toLowerCase().includes(tableSearchQuery.toLowerCase()) &&
                !message.flow_name.toLowerCase().includes(tableSearchQuery.toLowerCase()) &&
                !message.store_name.toLowerCase().includes(tableSearchQuery.toLowerCase())) {
                return false
            }

            // Store filter - if stores selected, message must match one of them
            if (tableFilterStores.length > 0 && !tableFilterStores.includes(message.store_public_id)) {
                return false
            }

            // Tag filter - if tags selected, message must have at least one matching tag
            if (tableFilterTags.length > 0) {
                const messageTags = message.tag_names || []
                const hasMatchingTag = tableFilterTags.some(filterTag => messageTags.includes(filterTag))
                if (!hasMatchingTag) {
                    return false
                }
            }

            return true
        })
    }, [messagesData, tableSearchQuery, tableFilterStores, tableFilterTags])

    // Extract unique stores from messages data
    const availableStores = useMemo(() => {
        const storesMap = new Map()
        messagesData.forEach(message => {
            if (message.store_public_id && message.store_name) {
                storesMap.set(message.store_public_id, message.store_name)
            }
        })
        return Array.from(storesMap.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [messagesData])

    // Extract unique tags from messages data
    const availableTags = useMemo(() => {
        const tagsSet = new Set()
        messagesData.forEach(message => {
            if (message.tag_names && Array.isArray(message.tag_names)) {
                message.tag_names.forEach(tag => {
                    if (tag && tag.trim() !== '') {
                        tagsSet.add(tag)
                    }
                })
            }
        })
        return Array.from(tagsSet)
            .sort()
            .map(tag => ({ value: tag, label: tag }))
    }, [messagesData])

    // Sort table messages
    const sortedTableMessages = useMemo(() => {
        return [...tableFilteredMessages].sort((a, b) => {
            let aVal, bVal

            // Handle text field sorting
            if (tableSortColumn === 'messageName') {
                aVal = a.flow_message_name.toLowerCase()
                bVal = b.flow_message_name.toLowerCase()
                return tableSortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            if (tableSortColumn === 'flowName') {
                aVal = a.flow_name.toLowerCase()
                bVal = b.flow_name.toLowerCase()
                return tableSortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            if (tableSortColumn === 'storeName') {
                aVal = a.store_name.toLowerCase()
                bVal = b.store_name.toLowerCase()
                return tableSortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            // Handle numeric field sorting
            const metricMapping = {
                'totalRecipients': 'recipients',
                'openRate': 'open_rate',
                'clickRate': 'click_rate',
                'conversionRate': 'conversion_rate',
                'totalRevenue': 'conversion_value',
                'revenuePerRecipient': 'revenue_per_recipient'
            }

            const field = metricMapping[tableSortColumn] || tableSortColumn
            aVal = a[field] || 0
            bVal = b[field] || 0

            // Numeric sorting
            return tableSortDirection === 'asc' ? aVal - bVal : bVal - aVal
        })
    }, [tableFilteredMessages, tableSortColumn, tableSortDirection])

    // Sort table flows
    const sortedTableFlows = useMemo(() => {
        const flowsWithMetrics = tableFilteredFlows.map(flow => {
            const flowData = flowsData.dailyData.filter(d => d.flow_id === flow.flow_id)
            const flowMetrics = calculateAggregateMetrics(flowData)
            return { flow, metrics: flowMetrics }
        })

        return flowsWithMetrics.sort((a, b) => {
            let aVal = a.metrics[tableSortColumn] || 0
            let bVal = b.metrics[tableSortColumn] || 0

            // Handle flow name sorting separately
            if (tableSortColumn === 'flowName') {
                aVal = a.flow.flow_name.toLowerCase()
                bVal = b.flow.flow_name.toLowerCase()
                return tableSortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            // Handle store name sorting separately
            if (tableSortColumn === 'storeName') {
                aVal = a.flow.store_name.toLowerCase()
                bVal = b.flow.store_name.toLowerCase()
                return tableSortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal)
            }

            // Numeric sorting
            return tableSortDirection === 'asc' ? aVal - bVal : bVal - aVal
        })
    }, [tableFilteredFlows, flowsData.dailyData, tableSortColumn, tableSortDirection, calculateAggregateMetrics])

    // Handle column header click for sorting
    const handleSort = (column) => {
        if (tableSortColumn === column) {
            setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setTableSortColumn(column)
            setTableSortDirection('desc')
        }
    }

    // Calculate aggregate metrics for selected flows
    const selectedFlowsData = useMemo(() => {
        const selectedFlowsList = filteredFlows.filter(f => selectedFlows.includes(f.flow_id))
        const relevantData = flowsData.dailyData.filter(d => selectedFlows.includes(d.flow_id))

        // Group by date for chart
        const chartData = {}
        relevantData.forEach(item => {
            if (!chartData[item.date]) {
                chartData[item.date] = {
                    date: item.date,
                    formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
            }

            // Use flow_id as the key to ensure consistency
            const flowKey = `flow_${item.flow_id}`
            chartData[item.date][`${flowKey}_recipients`] = item.recipients
            chartData[item.date][`${flowKey}_opens`] = item.opens_unique
            chartData[item.date][`${flowKey}_clicks`] = item.clicks_unique
            chartData[item.date][`${flowKey}_conversions`] = item.conversion_uniques || item.conversions
            chartData[item.date][`${flowKey}_revenue`] = item.conversion_value

            // Calculate rates - ALWAYS as percentages (0-100)
            // Always calculate from raw counts to ensure consistency
            chartData[item.date][`${flowKey}_open_rate`] = item.opens_unique && item.recipients
                ? (item.opens_unique / item.recipients) * 100
                : 0

            chartData[item.date][`${flowKey}_click_rate`] = item.clicks_unique && item.recipients
                ? (item.clicks_unique / item.recipients) * 100
                : 0

            chartData[item.date][`${flowKey}_conversion_rate`] = (item.conversion_uniques || item.conversions) && item.recipients
                ? ((item.conversion_uniques || item.conversions) / item.recipients) * 100
                : 0
        })

        return {
            flows: selectedFlowsList,
            chartData: Object.values(chartData).sort((a, b) => new Date(a.date) - new Date(b.date)),
            aggregateMetrics: calculateAggregateMetrics(relevantData)
        }
    }, [filteredFlows, selectedFlows, flowsData.dailyData, calculateAggregateMetrics])

    // Toggle flow selection
    const toggleFlowSelection = (flowId) => {
        setSelectedFlows(prev => {
            if (prev.includes(flowId)) {
                return prev.filter(id => id !== flowId)
            } else {
                return [...prev, flowId]
            }
        })
    }

    // Render comparison chart
    const renderComparisonChart = () => {
        const data = selectedFlowsData.chartData
        const flows = selectedFlowsData.flows

        if (data.length === 0 || flows.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-gray-600 dark:text-gray-400">
                    <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-300" />
                        <p>Select flows to compare performance</p>
                    </div>
                </div>
            )
        }

        const ChartComponent = chartView === "area" ? AreaChart : chartView === "bar" ? BarChart : LineChart

        // Debug logging
        console.log('=== CHART DEBUG ===')
        console.log('Number of data points:', data.length)
        console.log('Number of flows:', flows.length)
        console.log('Comparison metric:', comparisonMetric)
        console.log('First data point:', data[0])
        console.log('All keys in first data point:', Object.keys(data[0] || {}))

        // Calculate dynamic Y-axis domain based on data
        const calculateYAxisDomain = () => {
            // For rates, always show 0-100% scale for consistency
            if (comparisonMetric.includes('rate')) {
                return [0, 100]
            }

            // For other metrics, calculate max and add 10% padding
            let maxValue = 0
            data.forEach(item => {
                flows.forEach(flow => {
                    const dataKey = `flow_${flow.flow_id}_${comparisonMetric}`
                    const value = item[dataKey] || 0
                    if (value > maxValue) maxValue = value
                })
            })

            return [0, maxValue * 1.1]
        }

        const yAxisDomain = calculateYAxisDomain()

        return (
            <ResponsiveContainer width="100%" height={400}>
                <ChartComponent data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                        dataKey="formattedDate"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#374151' }}
                    />
                    <YAxis
                        domain={yAxisDomain}
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#374151' }}
                        tickFormatter={(value) => {
                            if (comparisonMetric.includes('rate')) {
                                return `${value.toFixed(1)}%`
                            } else if (comparisonMetric === 'revenue') {
                                return formatCurrency(value).replace('$', '')
                            } else {
                                return formatNumber(value)
                            }
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgb(31 41 55)',
                            border: '1px solid rgb(75 85 99)',
                            borderRadius: '8px',
                            color: 'white'
                        }}
                        content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null

                            return (
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                                    <p className="text-gray-300 text-sm mb-2 font-medium">{label}</p>
                                    {payload.map((entry, index) => {
                                        const flowName = entry.name
                                        const dataIndex = data.findIndex(d => d.formattedDate === label)
                                        const dataPoint = data[dataIndex]

                                        // Find the flow to get its flow_id
                                        const flow = flows.find(f => f.flow_name === flowName)
                                        if (!flow || !dataPoint) return null

                                        const flowKey = `flow_${flow.flow_id}`

                                        // Get the raw counts for this flow
                                        const recipients = dataPoint[`${flowKey}_recipients`] || 0
                                        const opens = dataPoint[`${flowKey}_opens`] || 0
                                        const clicks = dataPoint[`${flowKey}_clicks`] || 0
                                        const conversions = dataPoint[`${flowKey}_conversions`] || 0
                                        const revenue = dataPoint[`${flowKey}_revenue`] || 0

                                        return (
                                            <div key={index} className="mb-2 last:mb-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <span className="text-white font-medium text-sm">{flowName}</span>
                                                </div>
                                                <div className="ml-5 space-y-0.5">
                                                    {comparisonMetric === 'open_rate' && (
                                                        <>
                                                            <p className="text-white text-base font-bold">{formatPercentage(entry.value)}</p>
                                                            <p className="text-gray-400 text-xs">{formatNumber(opens)} opens / {formatNumber(recipients)} recipients</p>
                                                        </>
                                                    )}
                                                    {comparisonMetric === 'click_rate' && (
                                                        <>
                                                            <p className="text-white text-base font-bold">{formatPercentage(entry.value)}</p>
                                                            <p className="text-gray-400 text-xs">{formatNumber(clicks)} clicks / {formatNumber(recipients)} recipients</p>
                                                        </>
                                                    )}
                                                    {comparisonMetric === 'conversion_rate' && (
                                                        <>
                                                            <p className="text-white text-base font-bold">{formatPercentage(entry.value)}</p>
                                                            <p className="text-gray-400 text-xs">{formatNumber(conversions)} conversions / {formatNumber(recipients)} recipients</p>
                                                        </>
                                                    )}
                                                    {comparisonMetric === 'revenue' && (
                                                        <>
                                                            <p className="text-white text-base font-bold">{formatCurrency(entry.value)}</p>
                                                            <p className="text-gray-400 text-xs">{formatNumber(conversions)} orders</p>
                                                        </>
                                                    )}
                                                    {comparisonMetric === 'recipients' && (
                                                        <p className="text-white text-base font-bold">{formatNumber(entry.value)} recipients</p>
                                                    )}
                                                    {comparisonMetric === 'conversions' && (
                                                        <p className="text-white text-base font-bold">{formatNumber(entry.value)} conversions</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        }}
                    />
                    <Legend />

                    {flows.map((flow, index) => {
                        const dataKey = `flow_${flow.flow_id}_${comparisonMetric}`
                        const color = flow.color || `hsl(${index * 60}, 70%, 50%)`

                        if (chartView === "area") {
                            return (
                                <Area
                                    key={flow.flow_id}
                                    type="monotone"
                                    dataKey={dataKey}
                                    stackId="1"
                                    stroke={color}
                                    fill={color}
                                    fillOpacity={0.3}
                                    strokeWidth={2}
                                    name={flow.flow_name}
                                />
                            )
                        } else if (chartView === "bar") {
                            return (
                                <Bar
                                    key={flow.flow_id}
                                    dataKey={dataKey}
                                    fill={color}
                                    name={flow.flow_name}
                                    radius={[2, 2, 0, 0]}
                                />
                            )
                        } else {
                            return (
                                <Line
                                    key={flow.flow_id}
                                    type="monotone"
                                    dataKey={dataKey}
                                    stroke={color}
                                    strokeWidth={3}
                                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                                    name={flow.flow_name}
                                    connectNulls={true}
                                />
                            )
                        }
                    })}
                </ChartComponent>
            </ResponsiveContainer>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="flex items-center justify-center h-96">
                        <MorphingLoader size="large" showText={true} text="Loading flows data..." />
                    </CardContent>
                </Card>
            </div>
        )
    }

    const metrics = selectedFlowsData.aggregateMetrics

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-gray dark:text-white">
                        Flow Performance Analytics
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Compare automated flow performance across stores
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Recipients</CardTitle>
                        <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(metrics.totalRecipients || 0)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">across all flows</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.totalRevenue || 0)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">generated by flows</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Messages Sent</CardTitle>
                        <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(metrics.totalMessages || metrics.totalRecipients || 0)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">total message recipients</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Click Rate</CardTitle>
                        <MousePointer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPercentage(metrics.clickRate || 0)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">click-through rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Conversion Rate</CardTitle>
                        <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPercentage(metrics.conversionRate || 0)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">conversion success</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Revenue/Recipient</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.revenuePerRecipient || 0)}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">per recipient</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Flow Selection Sidebar */}
                <div className="col-span-4">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader className="space-y-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    {comparisonMode === "flows" ? "Select Flows to Compare" : "Select Messages to Compare"}
                                </CardTitle>
                            </div>

                            {/* Comparison Mode Toggle */}
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <button
                                    onClick={() => setComparisonMode("flows")}
                                    className={cn(
                                        "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                        comparisonMode === "flows"
                                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        <span>Flows</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setComparisonMode("messages")}
                                    className={cn(
                                        "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                                        comparisonMode === "messages"
                                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>Messages</span>
                                    </div>
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                            {/* Filters */}
                            <div className="p-4 space-y-3 border-b flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <Input
                                        placeholder={comparisonMode === "flows" ? "Search flows..." : "Search messages..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={filterStore} onValueChange={setFilterStore}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Stores</SelectItem>
                                        {Array.from(new Set(flowsData.flows.map(f => f.store_public_id)))
                                            .map(storeId => {
                                                const flow = flowsData.flows.find(f => f.store_public_id === storeId)
                                                return flow ? (
                                                    <SelectItem key={storeId} value={storeId}>
                                                        {flow.store_name}
                                                    </SelectItem>
                                                ) : null
                                            })
                                            .filter(Boolean)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* List - Scrollable Area */}
                            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                                {comparisonMode === "flows" ? (
                                    /* Flow Selection List */
                                    <div className="space-y-3">
                                        {filteredFlows.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                                No flows found
                                            </div>
                                        ) : (
                                            filteredFlows.map((flow) => (
                                                <div
                                                    key={flow.flow_id}
                                                    className={cn(
                                                        "p-3 rounded-lg border cursor-pointer transition-all",
                                                        selectedFlows.includes(flow.flow_id)
                                                            ? "border-sky-blue bg-sky-50 dark:bg-sky-900/20"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                    )}
                                                    onClick={() => toggleFlowSelection(flow.flow_id)}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <Checkbox
                                                                checked={selectedFlows.includes(flow.flow_id)}
                                                                onChange={() => {}} // Handled by onClick above
                                                                className="mt-0.5 flex-shrink-0"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                                                                    {flow.flow_name}
                                                                </h4>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                    {flow.store_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: flow.color }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center flex-wrap gap-2 mt-2 text-xs">
                                                        <span className="text-gray-600 dark:text-gray-500">
                                                            {flow.total_messages} messages
                                                        </span>
                                                        <Badge className={cn(
                                                            "text-xs",
                                                            flow.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                        )}>
                                                            {flow.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    /* Message Selection List */
                                    <div className="space-y-3">
                                        {messagesLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <MorphingLoader size="medium" showText={true} text="Loading messages..." />
                                            </div>
                                        ) : messagesData.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                                No messages available. Select flows in the table view to load messages.
                                            </div>
                                        ) : (
                                            messagesData
                                                .filter(msg => {
                                                    // Apply search filter - search in message name and flow name
                                                    if (searchQuery) {
                                                        const query = searchQuery.toLowerCase()
                                                        const messageName = (msg.flow_message_name || msg.message_name || '').toLowerCase()
                                                        const flowName = (msg.flow_name || '').toLowerCase()

                                                        if (!messageName.includes(query) && !flowName.includes(query)) {
                                                            return false
                                                        }
                                                    }
                                                    // Apply store filter
                                                    if (filterStore !== "all" && msg.store_public_id !== filterStore) {
                                                        return false
                                                    }
                                                    return true
                                                })
                                                .map((message, idx) => {
                                                    const messageId = message.flow_message_id || message.message_id || `msg-${idx}`
                                                    const isSelected = selectedMessages.includes(messageId)
                                                    const messageColor = getFlowColor(idx)
                                                    const messageName = message.flow_message_name || message.message_name || `Message ${idx + 1}`

                                                    return (
                                                        <div
                                                            key={messageId}
                                                            className={cn(
                                                                "p-3 rounded-lg border cursor-pointer transition-all",
                                                                isSelected
                                                                    ? "border-sky-blue bg-sky-50 dark:bg-sky-900/20"
                                                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                            )}
                                                            onClick={() => {
                                                                setSelectedMessages(prev =>
                                                                    prev.includes(messageId)
                                                                        ? prev.filter(id => id !== messageId)
                                                                        : [...prev, messageId]
                                                                )
                                                            }}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onChange={() => {}} // Handled by onClick above
                                                                        className="mt-0.5 flex-shrink-0"
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <h4 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                                                                            {messageName}
                                                                        </h4>
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                            {message.flow_name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                                                            {message.store_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                                    style={{ backgroundColor: messageColor }}
                                                                />
                                                            </div>

                                                            <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-gray-600 dark:text-gray-500">
                                                                <span>{formatNumber(message.recipients || 0)} recipients</span>
                                                                <span>•</span>
                                                                <span>{formatPercentage(message.open_rate || 0)} open</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart Area */}
                <div className="col-span-8">
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {comparisonMode === "flows" ? "Flow Performance Comparison" : "Message Performance Comparison"}
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 dark:text-gray-400">
                                        {comparisonMode === "flows"
                                            ? `Compare ${selectedFlows.length} selected flow${selectedFlows.length !== 1 ? 's' : ''} over time`
                                            : `Compare ${selectedMessages.length} selected message${selectedMessages.length !== 1 ? 's' : ''} over time`
                                        }
                                    </CardDescription>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Metric Selector */}
                                    <Select value={comparisonMetric} onValueChange={setComparisonMetric}>
                                        <SelectTrigger className="w-32 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open_rate">Open Rate</SelectItem>
                                            <SelectItem value="click_rate">Click Rate</SelectItem>
                                            <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                                            <SelectItem value="revenue">Revenue</SelectItem>
                                            <SelectItem value="recipients">Recipients</SelectItem>
                                            <SelectItem value="conversions">Conversions</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Chart Type Selector */}
                                    <Select value={chartView} onValueChange={setChartView}>
                                        <SelectTrigger className="w-24 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="line">Line</SelectItem>
                                            <SelectItem value="area">Area</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-4">
                            {renderComparisonChart()}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Flow Performance Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Detailed Flow Metrics</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                                Performance breakdown for all flows
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 mr-4">
                                <button
                                    onClick={() => setTableViewMode('flows')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                        tableViewMode === 'flows'
                                            ? "bg-sky-blue text-white"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    )}
                                >
                                    By Flow
                                </button>
                                <button
                                    onClick={() => setTableViewMode('messages')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                        tableViewMode === 'messages'
                                            ? "bg-sky-blue text-white"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    )}
                                >
                                    By Message
                                </button>
                            </div>
                            <div className="relative w-48">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <Input
                                    placeholder={`Search ${tableViewMode}...`}
                                    value={tableSearchQuery}
                                    onChange={(e) => setTableSearchQuery(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                            <MultiSelect
                                options={availableStores}
                                value={tableFilterStores.map(storeId =>
                                    availableStores.find(s => s.value === storeId) || { value: storeId, label: storeId }
                                )}
                                onChange={(selected) => {
                                    setTableFilterStores(selected.map(s => s.value))
                                }}
                                placeholder="All Stores"
                                className="w-40 h-9"
                            />
                            {tableViewMode === 'messages' && (
                                <MultiSelect
                                    options={availableTags}
                                    value={tableFilterTags.map(tagName =>
                                        availableTags.find(t => t.value === tagName) || { value: tagName, label: tagName }
                                    )}
                                    onChange={(selected) => {
                                        setTableFilterTags(selected.map(t => t.value))
                                    }}
                                    placeholder="All Tags"
                                    className="w-40 h-9"
                                />
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    {tableViewMode === 'messages' ? (
                        <>
                        {messagesLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <MorphingLoader size="medium" showText={true} text="Loading messages..." />
                            </div>
                        ) : (
                        <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th
                                        className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('messageName')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Message Name
                                            {tableSortColumn === 'messageName' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('flowName')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Flow Name
                                            {tableSortColumn === 'flowName' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('storeName')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Store
                                            {tableSortColumn === 'storeName' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="text-left p-2 font-medium text-gray-700 dark:text-gray-300">
                                        Tags
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('totalRecipients')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Recipients
                                            {tableSortColumn === 'totalRecipients' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('openRate')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Open Rate
                                            {tableSortColumn === 'openRate' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('clickRate')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Click Rate
                                            {tableSortColumn === 'clickRate' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('conversionRate')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Conv. Rate
                                            {tableSortColumn === 'conversionRate' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('totalRevenue')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Revenue
                                            {tableSortColumn === 'totalRevenue' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => handleSort('revenuePerRecipient')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            RPR
                                            {tableSortColumn === 'revenuePerRecipient' && (
                                                <ArrowUpDown className="h-3 w-3" />
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTableMessages.map((message) => (
                                    <tr key={message.flow_message_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="p-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedMessage(message);
                                                    setIsMessageModalOpen(true);
                                                }}
                                                className="font-medium text-sky-blue hover:text-royal-blue dark:text-sky-blue dark:hover:text-vivid-violet hover:underline text-left transition-colors"
                                            >
                                                {message.flow_message_name}
                                            </button>
                                        </td>
                                        <td className="p-2 text-gray-700 dark:text-gray-300">{message.flow_name}</td>
                                        <td className="p-2 text-gray-700 dark:text-gray-300">{message.store_name}</td>
                                        <td className="p-2">
                                            {message.tag_names && message.tag_names.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {message.tag_names.map((tag, idx) => (
                                                        <Badge key={idx} className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatNumber(message.recipients || 0)}</td>
                                        <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatPercentage(message.open_rate || 0)}</td>
                                        <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatPercentage(message.click_rate || 0)}</td>
                                        <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatPercentage(message.conversion_rate || 0)}</td>
                                        <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(message.conversion_value || 0)}</td>
                                        <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(message.revenue_per_recipient || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {sortedTableMessages.length === 0 && (
                            <div className="text-center py-8 text-gray-600 dark:text-gray-500">
                                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-300" />
                                <p>No messages found matching your filters</p>
                            </div>
                        )}
                        </>
                        )}
                        </>
                    ) : (
                    <>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th
                                    className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('flowName')}
                                >
                                    <div className="flex items-center gap-1">
                                        Flow Name
                                        {tableSortColumn === 'flowName' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="text-left p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('storeName')}
                                >
                                    <div className="flex items-center gap-1">
                                        Store
                                        {tableSortColumn === 'storeName' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('totalRecipients')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Recipients
                                        {tableSortColumn === 'totalRecipients' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('openRate')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Open Rate
                                        {tableSortColumn === 'openRate' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('clickRate')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Click Rate
                                        {tableSortColumn === 'clickRate' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('conversionRate')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Conv. Rate
                                        {tableSortColumn === 'conversionRate' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('totalRevenue')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Revenue
                                        {tableSortColumn === 'totalRevenue' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="text-right p-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => handleSort('revenuePerRecipient')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        RPR
                                        {tableSortColumn === 'revenuePerRecipient' && (
                                            <ArrowUpDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTableFlows.map(({ flow, metrics }) => (
                                <tr key={flow.flow_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: flow.color }}
                                            />
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{flow.flow_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 text-gray-700 dark:text-gray-300">{flow.store_name}</td>
                                    <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatNumber(metrics.totalRecipients || 0)}</td>
                                    <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatPercentage(metrics.openRate || 0)}</td>
                                    <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatPercentage(metrics.clickRate || 0)}</td>
                                    <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatPercentage(metrics.conversionRate || 0)}</td>
                                    <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(metrics.totalRevenue || 0)}</td>
                                    <td className="p-2 text-right text-gray-900 dark:text-gray-100">{formatCurrency(metrics.revenuePerRecipient || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {sortedTableFlows.length === 0 && (
                        <div className="text-center py-8 text-gray-600 dark:text-gray-500">
                            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-300" />
                            <p>No flows found matching your filters</p>
                        </div>
                    )}
                    </>
                    )}
                </CardContent>
            </Card>

            {/* Flow Message Detail Modal */}
            <FlowMessageDetailModal
                message={selectedMessage}
                isOpen={isMessageModalOpen}
                onClose={() => {
                    setIsMessageModalOpen(false);
                    setSelectedMessage(null);
                }}
            />
        </div>
    )
}
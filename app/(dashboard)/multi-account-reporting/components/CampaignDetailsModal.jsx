"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
    Mail,
    Users,
    Eye,
    MousePointer,
    DollarSign,
    TrendingUp,
    Calendar,
    Tag,
    Target,
    AlertCircle,
    CheckCircle,
    XCircle,
    ArrowUp,
    ArrowDown,
    Zap,
    BarChart3,
    Activity,
    Monitor,
    Smartphone,
    MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'
import LoadingSpinner from '@/app/components/ui/loading-spinner'
import dynamic from 'next/dynamic'

// Dynamically import EmailPreviewPanel from shared components
const EmailPreviewPanel = dynamic(
    () => import('@/app/components/campaigns/EmailPreviewPanel').then(mod => mod.EmailPreviewPanel),
    {
        loading: () => <LoadingSpinner />,
        ssr: false
    }
)

export default function CampaignDetailsModal({ campaign, isOpen, onClose, stores }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [campaignData, setCampaignData] = useState(null)
    const [loadingData, setLoadingData] = useState(false)
    const [previewMode, setPreviewMode] = useState('desktop')

    // Fetch campaign data when modal opens
    useEffect(() => {
        if (isOpen && campaign) {
            // If campaign already has full data, use it
            if (campaign.opensUnique !== undefined) {
                setCampaignData(campaign)
            } else if (campaign.campaign_id && campaign.store_public_id) {
                // Fetch detailed campaign data
                setLoadingData(true)
                fetch(`/api/store/${campaign.store_public_id}/campaigns/${campaign.campaign_id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.campaign) {
                            setCampaignData({ ...campaign, ...data.campaign })
                        } else {
                            setCampaignData(campaign)
                        }
                    })
                    .catch(err => {
                        console.error('Failed to fetch campaign data:', err)
                        setCampaignData(campaign)
                    })
                    .finally(() => setLoadingData(false))
            } else if (campaign.groupings?.campaign_message_id) {
                // For campaigns from campaignStats, we have campaign_message_id directly
                setCampaignData({
                    ...campaign,
                    message_id: campaign.groupings.campaign_message_id,
                    campaign_id: campaign.groupings.campaign_id,
                    channel: campaign.groupings.send_channel || 'email'
                })
            } else {
                setCampaignData(campaign)
            }
            
            // Reset tab based on context
            if (campaign?.showDeliveryFocus) {
                setActiveTab('deliverability')
            } else {
                setActiveTab('overview')
            }
        }
    }, [isOpen, campaign])
    
    // Get store info for the campaign
    const campaignStore = stores?.find(s => 
        s.public_id === campaign?.store_public_id || 
        s.klaviyo_integration?.public_id === campaign?.klaviyo_public_id ||
        campaign?.store_public_ids?.includes(s.public_id)
    )

    if (!campaign) return null
    
    // Use campaignData if available, otherwise fall back to campaign prop
    const data = campaignData || campaign

    // Format numbers
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0'
        return new Intl.NumberFormat().format(num)
    }

    const formatPercentage = (num) => {
        if (num === null || num === undefined) return '0%'
        if (num === 0) return '0%'
        // If the number is already a percentage (e.g., 23 for 23%)
        if (num > 1) {
            return `${num.toFixed(1)}%`
        }
        // If the number is a decimal (e.g., 0.23 for 23%)
        return `${(num * 100).toFixed(1)}%`
    }

    const formatCurrency = (num) => {
        if (num === null || num === undefined) return '$0.00'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(num)
    }

    const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Calculate delivery health score
    const calculateDeliveryScore = () => {
        const deliveryRate = data.deliveryRate || 0
        const bounceRate = data.bounceRate || 0
        const spamRate = data.spamComplaintRate || 0
        const unsubRate = data.unsubscribeRate || 0
        
        let score = 100
        
        // Deduct points based on metrics
        if (deliveryRate < 95) score -= 20
        if (bounceRate > 5) score -= 25
        if (spamRate > 0.1) score -= 30
        if (unsubRate > 2) score -= 15
        
        return Math.max(0, score)
    }

    const deliveryScore = calculateDeliveryScore()
    
    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600'
        if (score >= 75) return 'text-blue-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }
    
    const getScoreLabel = (score) => {
        if (score >= 90) return 'Excellent'
        if (score >= 75) return 'Good'
        if (score >= 60) return 'Fair'
        return 'Needs Improvement'
    }

    // Metric Card Component
    const MetricCard = ({ icon: Icon, label, value, subValue, trend, color = "text-gray-900" }) => (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className={`text-2xl font-bold ${color} dark:text-white`}>{value}</div>
            {subValue && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</div>}
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
                <DialogTitle className="sr-only">Campaign Deliverability Details</DialogTitle>
                <DialogDescription className="sr-only">
                    View detailed deliverability statistics and performance metrics for this campaign
                </DialogDescription>
                
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                                    {data.campaign_name || data.name || 'Untitled Campaign'}
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(data.send_date || data.date)}</span>
                                    </div>
                                    <Badge variant="outline">
                                        {data.type === 'sms' || data.channel === 'sms' ? (
                                            <><MessageSquare className="w-3 h-3 mr-1" /> SMS</>
                                        ) : (
                                            <><Mail className="w-3 h-3 mr-1" /> Email</>
                                        )}
                                    </Badge>
                                    <Badge variant="outline">{formatNumber(data.recipients)} Recipients</Badge>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`text-3xl font-bold ${getScoreColor(deliveryScore)}`}>
                                    {deliveryScore}/100
                                </div>
                                <div className={`text-sm font-medium ${getScoreColor(deliveryScore)}`}>
                                    {getScoreLabel(deliveryScore)}
                                </div>
                            </div>
                        </div>

                        {/* Tags and Audiences */}
                        {(data.tagNames?.length > 0 || data.includedAudiences?.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                                {data.tagNames?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                                {data.includedAudiences?.map(audience => (
                                    <Badge key={audience.id || audience.name} variant="outline" className="text-xs">
                                        <Target className="w-3 h-3 mr-1" />
                                        {audience.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Two Column Layout */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Column - Email Preview */}
                        <div className="w-1/2 border-r dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Campaign Preview</h3>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {(data.message_id || data.groupings?.campaign_message_id) && campaignStore?.public_id ? (
                                    <EmailPreviewPanel
                                        messageId={data.message_id || data.groupings?.campaign_message_id}
                                        storeId={campaignStore?.public_id}
                                        campaign={data}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                            <p>No preview available</p>
                                            {!campaignStore && <p className="text-xs mt-2">Store not found</p>}
                                            {!(data.message_id || data.groupings?.campaign_message_id) && <p className="text-xs mt-2">No message ID</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Right Column - Data Tabs */}
                        <div className="w-1/2 flex flex-col overflow-hidden">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                                <TabsList className="grid w-full grid-cols-2 mx-4" style={{width: 'calc(100% - 2rem)'}}>
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
                                </TabsList>

                        {/* Deliverability Tab */}
                        <TabsContent value="deliverability" className="flex-1 mt-0 overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    {/* Delivery Overview */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Mail className="w-5 h-5" />
                                                Delivery Overview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-4 gap-4">
                                                <MetricCard
                                                    icon={Users}
                                                    label="Total Recipients"
                                                    value={formatNumber(data.recipients)}
                                                    color="text-gray-900"
                                                />
                                                <MetricCard
                                                    icon={CheckCircle}
                                                    label="Delivered"
                                                    value={formatNumber(data.delivered)}
                                                    subValue={formatPercentage(data.deliveryRate)}
                                                    color="text-green-600"
                                                />
                                                <MetricCard
                                                    icon={XCircle}
                                                    label="Bounced"
                                                    value={formatNumber(data.bounced)}
                                                    subValue={formatPercentage(data.bounceRate)}
                                                    color="text-red-600"
                                                />
                                                <MetricCard
                                                    icon={AlertCircle}
                                                    label="Failed"
                                                    value={formatNumber(data.failed || 0)}
                                                    subValue={formatPercentage(data.failedRate || 0)}
                                                    color="text-orange-600"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Bounce Analysis */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                Bounce Analysis
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span>Total Bounce Rate</span>
                                                    <span className={`font-medium ${
                                                        data.bounceRate < 2 ? 'text-green-600' :
                                                        data.bounceRate < 5 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {formatPercentage(data.bounceRate)}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={Math.min(data.bounceRate, 10) * 10}
                                                    className="h-2"
                                                />
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Industry average: 2% • 
                                                    {data.bounceRate < 2 ? ' Below average ✓' :
                                                     data.bounceRate < 5 ? ' Average' :
                                                     ' Above average ⚠'}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Spam & Complaints */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <XCircle className="w-5 h-5" />
                                                Spam Complaints & Unsubscribes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Spam Complaints</span>
                                                        <Badge 
                                                            variant={data.spamComplaintRate < 0.1 ? "default" : "destructive"}
                                                            className={data.spamComplaintRate < 0.1 ? "bg-green-100 text-green-800" : ""}
                                                        >
                                                            {formatPercentage(data.spamComplaintRate)}
                                                        </Badge>
                                                    </div>
                                                    <Progress
                                                        value={Math.min(data.spamComplaintRate * 1000, 100)}
                                                        className="h-2"
                                                    />
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Target: &lt; 0.1% • 
                                                        {data.spamComplaintRate < 0.1 ? ' Excellent ✓' : ' Needs attention ⚠'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Unsubscribes</span>
                                                        <Badge 
                                                            variant="outline"
                                                            className={data.unsubscribeRate < 0.5 ? "border-green-200 text-green-700" : "border-yellow-200 text-yellow-700"}
                                                        >
                                                            {formatPercentage(data.unsubscribeRate)}
                                                        </Badge>
                                                    </div>
                                                    <Progress
                                                        value={Math.min(data.unsubscribeRate * 200, 100)}
                                                        className="h-2"
                                                    />
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Target: &lt; 0.5% • 
                                                        {data.unsubscribeRate < 0.5 ? ' Good ✓' : ' Monitor closely'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total List Health Impact</div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {formatNumber(data.unsubscribed + data.spamReports)} contacts lost
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatPercentage(data.unsubscribeRate + data.spamComplaintRate)}
                                                        of recipients
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Consolidated Overview Tab */}
                        <TabsContent value="overview" className="flex-1 mt-0 overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                {loadingData ? (
                                    <div className="flex items-center justify-center h-full">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                <div className="p-6 space-y-6">
                                    {/* Key Performance Metrics Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <MetricCard
                                            icon={Eye}
                                            label="Opens"
                                            value={formatNumber(data.opensUnique || 0)}
                                            subValue={`${formatPercentage(data.openRate)} rate`}
                                            color="text-blue-600"
                                        />
                                        <MetricCard
                                            icon={MousePointer}
                                            label="Clicks"
                                            value={formatNumber(data.clicksUnique || 0)}
                                            subValue={`${formatPercentage(data.clickRate)} rate`}
                                            color="text-purple-600"
                                        />
                                        <MetricCard
                                            icon={DollarSign}
                                            label="Revenue"
                                            value={formatCurrency(data.revenue || 0)}
                                            subValue={`${formatNumber(data.conversions || 0)} orders`}
                                            color="text-green-600"
                                        />
                                        <MetricCard
                                            icon={TrendingUp}
                                            label="Conversion"
                                            value={formatPercentage(data.conversionRate)}
                                            subValue={`${formatCurrency(data.revenuePerRecipient)}/recipient`}
                                            color="text-green-600"
                                        />
                                    </div>

                                    {/* Two Column Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Engagement Funnel */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Activity className="w-4 h-4" />
                                                    Engagement Funnel
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {[
                                                    {
                                                        label: 'Delivered',
                                                        value: data.delivered || 0,
                                                        percentage: 100,
                                                        color: 'bg-blue-400'
                                                    },
                                                    {
                                                        label: 'Opened',
                                                        value: data.opensUnique || 0,
                                                        percentage: data.openRate || 0,
                                                        color: 'bg-blue-500'
                                                    },
                                                    {
                                                        label: 'Clicked',
                                                        value: data.clicksUnique || 0,
                                                        percentage: data.clickRate || 0,
                                                        color: 'bg-purple-500'
                                                    },
                                                    {
                                                        label: 'Converted',
                                                        value: data.conversions || 0,
                                                        percentage: data.conversionRate || 0,
                                                        color: 'bg-green-500'
                                                    }
                                                ].map((step) => (
                                                    <div key={step.label}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">{step.label}</span>
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {formatNumber(step.value)} ({formatPercentage(step.percentage)})
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <Progress value={step.percentage > 1 ? step.percentage : step.percentage * 100} className="h-6" />
                                                            <div
                                                                className={`absolute inset-0 ${step.color} rounded-md transition-all opacity-20`}
                                                                style={{ width: `${step.percentage > 1 ? step.percentage : step.percentage * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>

                                        {/* Performance Summary */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4" />
                                                    Performance Summary
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* CTOR */}
                                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-orange-500" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click-to-Open Rate</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-orange-600">{formatPercentage(data.ctor)}</span>
                                                </div>

                                                {/* Revenue Metrics */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Revenue</div>
                                                        <div className="text-xl font-bold text-green-600">{formatCurrency(data.revenue || 0)}</div>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Revenue/Recipient</div>
                                                        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.revenuePerRecipient || 0)}</div>
                                                    </div>
                                                </div>

                                                {/* Delivery Health */}
                                                <div className="pt-2 border-t dark:border-gray-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Health</span>
                                                        <Badge 
                                                            variant={deliveryScore >= 90 ? "default" : deliveryScore >= 75 ? "secondary" : "destructive"}
                                                            className={deliveryScore >= 90 ? "bg-green-100 text-green-700" : ""}
                                                        >
                                                            {deliveryScore}/100
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Bounced</span>
                                                            <span className={data.bounceRate < 2 ? "text-green-600" : "text-red-600"}>
                                                                {formatPercentage(data.bounceRate)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600 dark:text-gray-400">Unsubscribed</span>
                                                            <span className={data.unsubscribeRate < 0.5 ? "text-green-600" : "text-yellow-600"}>
                                                                {formatPercentage(data.unsubscribeRate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Additional Metrics Row */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Total Recipients</span>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumber(data.recipients)}</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Delivered</span>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumber(data.delivered)}</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <XCircle className="w-3 h-3 text-red-600" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Bounced</span>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumber(data.bounced)}</div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="w-3 h-3 text-yellow-600" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Spam Reports</span>
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumber(data.spamReports || 0)}</div>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
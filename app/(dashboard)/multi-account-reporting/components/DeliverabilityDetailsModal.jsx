"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import { Badge } from '@/app/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
    Mail,
    Users,
    Eye,
    MousePointer,
    DollarSign,
    TrendingUp,
    Calendar,
    Target,
    AlertCircle,
    CheckCircle,
    XCircle,
    Shield,
    TrendingDown,
    BarChart3,
    Activity,
    MessageSquare,
    Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import MorphingLoader from '@/app/components/ui/loading'
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Dynamically import EmailPreviewPanel
const EmailPreviewPanel = dynamic(
    () => import('@/app/components/campaigns/EmailPreviewPanel').then(mod => mod.EmailPreviewPanel),
    {
        loading: () => <div className="flex items-center justify-center p-8"><MorphingLoader size="medium" showText={true} text="Loading preview..." /></div>,
        ssr: false
    }
)

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

    case 'health_score':
      if (value >= 80) return "text-green-800 bg-green-50 font-medium"
      else if (value >= 60) return "text-orange-800 bg-orange-50 font-medium"
      else return "text-red-800 bg-red-50 font-medium"

    default:
      return "text-gray-900 bg-white"
  }
}

export default function DeliverabilityDetailsModal({ campaign, isOpen, onClose, stores }) {
    const [activeTab, setActiveTab] = useState('deliverability')

    if (!campaign) return null

    // Calculate delivery health score
    const calculateDeliveryScore = (data) => {
        const deliveryRate = data.delivery_rate || 0
        const bounceRate = data.bounce_rate || 0
        const spamRate = data.spam_rate || 0
        const unsubRate = data.unsubscribe_rate || 0

        let score = 100

        // Deduct points based on metrics
        if (deliveryRate < 95) score -= 20
        if (bounceRate > 5) score -= 25
        if (spamRate > 0.1) score -= 30
        if (unsubRate > 2) score -= 15

        return Math.max(0, score)
    }

    const deliveryScore = calculateDeliveryScore(campaign)

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent'
        if (score >= 60) return 'Good'
        return 'Needs Improvement'
    }

    // Get store info for the campaign
    const campaignStore = stores?.find(s =>
        s.public_id === campaign?.store_public_id ||
        s.klaviyo_integration?.public_id === campaign?.klaviyo_public_id ||
        campaign?.store_public_ids?.includes(s.public_id)
    )

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

    // Metric Card Component
    const MetricCard = ({ icon: Icon, label, value, subValue, color = "text-gray-900", bgColor = "bg-gray-50" }) => (
        <div className={`${bgColor} dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                </div>
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

                <div className="flex h-full overflow-hidden">
                    {/* Left Column - Email Preview */}
                    <div className="w-1/2 border-r dark:border-gray-700 overflow-hidden relative">
                        <div className="h-full overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <div className="pb-40">
                                    {(() => {
                                        const messageId = campaign.message_id || campaign.messageId || campaign.campaign_message_id;
                                        // IMPORTANT: Must use store's public_id (NOT klaviyo_integration.public_id)
                                        const storeId = campaignStore?.public_id;

                                        console.log('🔍 Deliverability Preview Debug:', {
                                            messageId,
                                            storeId,
                                            campaignStore: campaignStore ? {
                                                name: campaignStore.name,
                                                public_id: campaignStore.public_id,
                                                klaviyo_public_id: campaignStore.klaviyo_integration?.public_id
                                            } : null,
                                            campaign_keys: Object.keys(campaign)
                                        });

                                        if (messageId && storeId) {
                                            return (
                                                <EmailPreviewPanel
                                                    messageId={messageId}
                                                    storeId={storeId}
                                                />
                                            );
                                        }

                                        return (
                                            <div className="flex items-center justify-center h-full text-gray-500">
                                                <div className="text-center">
                                                    <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                                    <p>No preview available</p>
                                                    {!campaignStore && <p className="text-xs mt-2">Store not found</p>}
                                                    {!messageId && <p className="text-xs mt-2">No message ID available</p>}
                                                    {!storeId && campaignStore && <p className="text-xs mt-2">No store ID available</p>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Campaign Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="bg-white dark:bg-gray-800 backdrop-blur-md rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-lg">
                                <div>
                                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                        {campaign.campaign_name || 'Untitled Campaign'}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-200">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                            <span>{formatDate(campaign.send_date)}</span>
                                        </div>
                                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                            <Mail className="w-3 h-3 mr-1" /> Email
                                        </Badge>
                                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                            {formatNumber(campaign.recipients)} Recipients
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Deliverability Stats */}
                    <div className="w-1/2 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                            <div className="p-6">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Deliverability Metrics
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Email delivery performance and health indicators
                                </p>
                            </div>
                        </div>

                        {/* Content - Redesigned for single-view */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 space-y-4">
                                {/* Top Row - Key Metrics (Compact 4-column) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`${campaign.delivery_rate >= 98.5 ? "bg-green-50" : campaign.delivery_rate >= 95 ? "bg-orange-50" : "bg-red-50"} dark:bg-gray-800 rounded-lg p-3`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Delivery Rate</span>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-bold ${campaign.delivery_rate >= 98.5 ? "text-green-600" : campaign.delivery_rate >= 95 ? "text-orange-600" : "text-red-600"}`}>
                                            {formatPercentage(campaign.delivery_rate)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Target: 98.5%+</div>
                                    </div>

                                    <div className={`${campaign.bounce_rate <= 2 ? "bg-green-50" : campaign.bounce_rate <= 5 ? "bg-orange-50" : "bg-red-50"} dark:bg-gray-800 rounded-lg p-3`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Bounce Rate</span>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-bold ${campaign.bounce_rate <= 2 ? "text-green-600" : campaign.bounce_rate <= 5 ? "text-orange-600" : "text-red-600"}`}>
                                            {formatPercentage(campaign.bounce_rate)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Target: &lt;2%</div>
                                    </div>

                                    <div className={`${campaign.spam_rate <= 0.1 ? "bg-green-50" : campaign.spam_rate <= 0.3 ? "bg-orange-50" : "bg-red-50"} dark:bg-gray-800 rounded-lg p-3`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Spam Rate</span>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-bold ${campaign.spam_rate <= 0.1 ? "text-green-600" : campaign.spam_rate <= 0.3 ? "text-orange-600" : "text-red-600"}`}>
                                            {formatPercentage(campaign.spam_rate)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Target: &lt;0.1%</div>
                                    </div>

                                    <div className={`${campaign.unsubscribe_rate <= 0.5 ? "bg-green-50" : campaign.unsubscribe_rate <= 1.0 ? "bg-orange-50" : "bg-red-50"} dark:bg-gray-800 rounded-lg p-3`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <XCircle className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">Unsubscribe Rate</span>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-bold ${campaign.unsubscribe_rate <= 0.5 ? "text-green-600" : campaign.unsubscribe_rate <= 1.0 ? "text-orange-600" : "text-red-600"}`}>
                                            {formatPercentage(campaign.unsubscribe_rate)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Target: &lt;0.5%</div>
                                    </div>
                                </div>

                                {/* Detailed Delivery Breakdown - Compact */}
                                <Card>
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5" />
                                            Detailed Delivery Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3">
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Recipients</div>
                                                <div className="text-base font-bold text-gray-900 dark:text-white">{formatNumber(campaign.recipients)}</div>
                                            </div>
                                            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Delivered</div>
                                                <div className="text-base font-bold text-green-600">{formatNumber(campaign.delivered)}</div>
                                                <div className="text-xs text-green-600">{formatPercentage(campaign.delivery_rate)}</div>
                                            </div>
                                            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bounced</div>
                                                <div className="text-base font-bold text-red-600">{formatNumber(campaign.bounced)}</div>
                                                <div className="text-xs text-red-600">{formatPercentage(campaign.bounce_rate)}</div>
                                            </div>
                                            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Spam</div>
                                                <div className="text-base font-bold text-yellow-600">{formatNumber(campaign.spam_complaints)}</div>
                                                <div className="text-xs text-yellow-600">{formatPercentage(campaign.spam_rate)}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Health Score and Engagement - Side by Side */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Email Health Score - Compact */}
                                    <Card>
                                        <CardHeader className="pb-2 pt-3 px-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <Activity className="w-3.5 h-3.5" />
                                                Email Health Score
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-3 pb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`text-2xl font-bold ${getScoreColor(deliveryScore)}`}>
                                                    {deliveryScore}/100
                                                </div>
                                                <Badge
                                                    variant={deliveryScore >= 80 ? "default" : deliveryScore >= 60 ? "secondary" : "destructive"}
                                                    className={deliveryScore >= 80 ? "bg-green-100 text-green-700 text-xs" : "text-xs"}
                                                >
                                                    {getScoreLabel(deliveryScore)}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Bounce Rate</span>
                                                    <span className={campaign.bounce_rate < 2 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                        {formatPercentage(campaign.bounce_rate)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Spam Rate</span>
                                                    <span className={campaign.spam_rate < 0.1 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                        {formatPercentage(campaign.spam_rate)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Unsubscribe</span>
                                                    <span className={campaign.unsubscribe_rate < 0.5 ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                                                        {formatPercentage(campaign.unsubscribe_rate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Engagement Metrics - Compact */}
                                    <Card>
                                        <CardHeader className="pb-2 pt-3 px-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <BarChart3 className="w-3.5 h-3.5" />
                                                Engagement Metrics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-3 pb-3">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                                                    <div className="flex items-center gap-1.5">
                                                        <Eye className="w-3 h-3 text-blue-600" />
                                                        <span className="text-xs text-gray-700 dark:text-gray-300">Open Rate</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-blue-600">
                                                        {formatPercentage(campaign.open_rate)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded">
                                                    <div className="flex items-center gap-1.5">
                                                        <MousePointer className="w-3 h-3 text-purple-600" />
                                                        <span className="text-xs text-gray-700 dark:text-gray-300">Click Rate</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-purple-600">
                                                        {formatPercentage(campaign.click_rate)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-1.5 bg-green-50 dark:bg-green-900/20 rounded">
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="w-3 h-3 text-green-600" />
                                                        <span className="text-xs text-gray-700 dark:text-gray-300">Revenue</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {formatCurrency(campaign.revenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
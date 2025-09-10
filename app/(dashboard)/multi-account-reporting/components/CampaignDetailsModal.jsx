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

export default function CampaignDetailsModal({ campaign, isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('deliverability')
    const [emailPreview, setEmailPreview] = useState(null)
    const [loadingPreview, setLoadingPreview] = useState(false)
    const [previewMode, setPreviewMode] = useState('desktop')

    // Reset to deliverability tab when opening from deliverability view
    useEffect(() => {
        if (isOpen && campaign?.showDeliveryFocus) {
            setActiveTab('deliverability')
        }
    }, [isOpen, campaign])

    if (!campaign) return null

    // Format numbers
    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0'
        return new Intl.NumberFormat().format(num)
    }

    const formatPercentage = (num) => {
        if (num === null || num === undefined) return '0.00%'
        if (num === 0) return '0.00%'
        // If the number is already a percentage (e.g., 23 for 23%)
        if (num > 1) {
            return `${num.toFixed(2)}%`
        }
        // If the number is a decimal (e.g., 0.23 for 23%)
        return `${(num * 100).toFixed(2)}%`
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
        const deliveryRate = campaign.deliveryRate || 0
        const bounceRate = campaign.bounceRate || 0
        const spamRate = campaign.spamComplaintRate || 0
        const unsubRate = campaign.unsubscribeRate || 0
        
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
            <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden">
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
                                    {campaign.campaign_name || 'Untitled Campaign'}
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(campaign.send_date)}</span>
                                    </div>
                                    <Badge variant="outline">
                                        {campaign.type === 'sms' ? (
                                            <><MessageSquare className="w-3 h-3 mr-1" /> SMS</>
                                        ) : (
                                            <><Mail className="w-3 h-3 mr-1" /> Email</>
                                        )}
                                    </Badge>
                                    <Badge variant="outline">{formatNumber(campaign.recipients)} Recipients</Badge>
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
                        {(campaign.tagNames?.length > 0 || campaign.includedAudiences?.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                                {campaign.tagNames?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                                {campaign.includedAudiences?.map(audience => (
                                    <Badge key={audience.id || audience.name} variant="outline" className="text-xs">
                                        <Target className="w-3 h-3 mr-1" />
                                        {audience.name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="engagement">Engagement</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
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
                                                    value={formatNumber(campaign.recipients)}
                                                    color="text-gray-900"
                                                />
                                                <MetricCard
                                                    icon={CheckCircle}
                                                    label="Delivered"
                                                    value={formatNumber(campaign.delivered)}
                                                    subValue={formatPercentage(campaign.deliveryRate)}
                                                    color="text-green-600"
                                                />
                                                <MetricCard
                                                    icon={XCircle}
                                                    label="Bounced"
                                                    value={formatNumber(campaign.bounced)}
                                                    subValue={formatPercentage(campaign.bounceRate)}
                                                    color="text-red-600"
                                                />
                                                <MetricCard
                                                    icon={AlertCircle}
                                                    label="Failed"
                                                    value={formatNumber(campaign.failed || 0)}
                                                    subValue={formatPercentage(campaign.failedRate || 0)}
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
                                                        campaign.bounceRate < 2 ? 'text-green-600' :
                                                        campaign.bounceRate < 5 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {formatPercentage(campaign.bounceRate)}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={Math.min(campaign.bounceRate, 10) * 10}
                                                    className="h-2"
                                                />
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Industry average: 2% • 
                                                    {campaign.bounceRate < 2 ? ' Below average ✓' :
                                                     campaign.bounceRate < 5 ? ' Average' :
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
                                                            variant={campaign.spamComplaintRate < 0.1 ? "default" : "destructive"}
                                                            className={campaign.spamComplaintRate < 0.1 ? "bg-green-100 text-green-800" : ""}
                                                        >
                                                            {formatPercentage(campaign.spamComplaintRate)}
                                                        </Badge>
                                                    </div>
                                                    <Progress
                                                        value={Math.min(campaign.spamComplaintRate * 1000, 100)}
                                                        className="h-2"
                                                    />
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Target: &lt; 0.1% • 
                                                        {campaign.spamComplaintRate < 0.1 ? ' Excellent ✓' : ' Needs attention ⚠'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Unsubscribes</span>
                                                        <Badge 
                                                            variant="outline"
                                                            className={campaign.unsubscribeRate < 0.5 ? "border-green-200 text-green-700" : "border-yellow-200 text-yellow-700"}
                                                        >
                                                            {formatPercentage(campaign.unsubscribeRate)}
                                                        </Badge>
                                                    </div>
                                                    <Progress
                                                        value={Math.min(campaign.unsubscribeRate * 200, 100)}
                                                        className="h-2"
                                                    />
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Target: &lt; 0.5% • 
                                                        {campaign.unsubscribeRate < 0.5 ? ' Good ✓' : ' Monitor closely'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total List Health Impact</div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {formatNumber(campaign.unsubscribed + campaign.spamReports)} contacts lost
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatPercentage(campaign.unsubscribeRate + campaign.spamComplaintRate)}
                                                        of recipients
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="flex-1 mt-0 overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    {/* Key Metrics Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <MetricCard
                                            icon={Eye}
                                            label="Opens"
                                            value={formatNumber(campaign.opensUnique || 0)}
                                            subValue={`${formatPercentage(campaign.openRate)} open rate`}
                                            color="text-blue-600"
                                        />
                                        <MetricCard
                                            icon={MousePointer}
                                            label="Clicks"
                                            value={formatNumber(campaign.clicksUnique || 0)}
                                            subValue={`${formatPercentage(campaign.clickRate)} click rate`}
                                            color="text-purple-600"
                                        />
                                        <MetricCard
                                            icon={Zap}
                                            label="Click-to-Open"
                                            value={formatPercentage(campaign.ctor)}
                                            subValue="Engagement rate"
                                            color="text-orange-600"
                                        />
                                        <MetricCard
                                            icon={DollarSign}
                                            label="Revenue"
                                            value={formatCurrency(campaign.revenue || 0)}
                                            subValue={`${formatNumber(campaign.conversions || 0)} conversions`}
                                            color="text-green-600"
                                        />
                                        <MetricCard
                                            icon={TrendingUp}
                                            label="Conversion Rate"
                                            value={formatPercentage(campaign.conversionRate)}
                                            subValue={`${formatCurrency(campaign.revenuePerRecipient)} per recipient`}
                                            color="text-green-600"
                                        />
                                        <MetricCard
                                            icon={Users}
                                            label="Recipients"
                                            value={formatNumber(campaign.recipients)}
                                            subValue={`${formatNumber(campaign.delivered)} delivered`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Engagement Tab */}
                        <TabsContent value="engagement" className="flex-1 mt-0 overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    {/* Engagement Funnel */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Activity className="w-5 h-5" />
                                                Engagement Funnel
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                {
                                                    label: 'Delivered',
                                                    value: campaign.delivered || 0,
                                                    percentage: 100,
                                                    color: 'bg-blue-500'
                                                },
                                                {
                                                    label: 'Opened',
                                                    value: campaign.opensUnique || 0,
                                                    percentage: campaign.openRate || 0,
                                                    color: 'bg-indigo-500'
                                                },
                                                {
                                                    label: 'Clicked',
                                                    value: campaign.clicksUnique || 0,
                                                    percentage: campaign.clickRate || 0,
                                                    color: 'bg-purple-500'
                                                },
                                                {
                                                    label: 'Converted',
                                                    value: campaign.conversions || 0,
                                                    percentage: campaign.conversionRate || 0,
                                                    color: 'bg-green-500'
                                                }
                                            ].map((step) => (
                                                <div key={step.label}>
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="font-medium">{step.label}</span>
                                                        <span>
                                                            {formatNumber(step.value)} ({formatPercentage(step.percentage)})
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <Progress value={step.percentage > 1 ? step.percentage : step.percentage * 100} className="h-8" />
                                                        <div
                                                            className={`absolute inset-0 ${step.color} rounded-md transition-all opacity-20`}
                                                            style={{ width: `${step.percentage > 1 ? step.percentage : step.percentage * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Performance Tab */}
                        <TabsContent value="performance" className="flex-1 mt-0 overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    {/* Revenue Performance */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <DollarSign className="w-5 h-5" />
                                                Revenue Performance
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-3xl font-bold text-green-600 mb-1">
                                                        {formatCurrency(campaign.revenue || 0)}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                                                </div>
                                                <div>
                                                    <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">
                                                        {formatCurrency(campaign.revenuePerRecipient || 0)}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Revenue per Recipient</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
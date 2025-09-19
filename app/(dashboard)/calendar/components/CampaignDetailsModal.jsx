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
    MessageSquare,
    Info,
    ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { Button } from '@/app/components/ui/button'
import { InlineLoader } from '@/app/components/ui/loading'
import dynamic from 'next/dynamic'

// Dynamically import EmailPreviewPanel
const EmailPreviewPanel = dynamic(
    () => import('./EmailPreviewPanel').then(mod => mod.EmailPreviewPanel),
    {
        loading: () => <div className="flex items-center justify-center p-8"><InlineLoader showText={true} text="Loading preview..." /></div>,
        ssr: false
    }
)

export default function CampaignDetailsModal({ campaign, isOpen, onClose, stores, onBackToDay }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [campaignData, setCampaignData] = useState(null)
    const [previewMode, setPreviewMode] = useState('desktop')

    // Fetch campaign data when modal opens
    useEffect(() => {
        if (isOpen && campaign) {
            console.log('🔍 CampaignDetailsModal: Received campaign data:', campaign);
            
            // Always use the campaign data directly since it should contain all metrics
            // The campaign object passed from calendar should already have the stats
            setCampaignData(campaign);
            
            // Reset tab based on context
            if (campaign?.showDeliveryFocus) {
                setActiveTab('deliverability')
            } else {
                setActiveTab('overview')
            }
        }
    }, [isOpen, campaign])
    
    if (!campaign) return null
    
    // Use campaignData if available, otherwise fall back to campaign prop
    const data = campaignData || campaign
    
    // Debug logging
    console.log('📊 CampaignDetailsModal: Final data being used:', {
        opensUnique: data.opensUnique,
        clicksUnique: data.clicksUnique,
        revenue: data.revenue,
        recipients: data.recipients,
        delivered: data.delivered,
        openRate: data.openRate,
        clickRate: data.clickRate,
        conversionRate: data.conversionRate,
        fullData: data
    });

    // Get store info for the campaign
    const campaignStore = stores?.find(s => 
        s.public_id === campaign?.store_public_id || 
        s.klaviyo_integration?.public_id === campaign?.klaviyo_public_id ||
        campaign?.store_public_ids?.includes(s.public_id) ||
        // Handle case where data uses different field names
        s.public_id === data?.store_public_id ||
        s.klaviyo_integration?.public_id === data?.klaviyo_public_id
    )
    
    console.log('🔍 Store lookup debug:', {
        availableStores: stores?.length,
        campaign: {
            store_public_id: campaign?.store_public_id,
            klaviyo_public_id: campaign?.klaviyo_public_id,
            store_public_ids: campaign?.store_public_ids
        },
        data: {
            store_public_id: data?.store_public_id,
            klaviyo_public_id: data?.klaviyo_public_id
        },
        foundStore: campaignStore ? {
            name: campaignStore.name,
            public_id: campaignStore.public_id,
            klaviyo_public_id: campaignStore.klaviyo_integration?.public_id
        } : null
    })
    
    console.log('🔍 Full campaign data structure:', JSON.stringify(campaign, null, 2))
    console.log('🔍 Full data structure:', JSON.stringify(data, null, 2))

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
        const isSMS = data.type === 'sms' || data.channel === 'sms'
        
        let score = 100
        
        // Deduct points based on metrics
        if (deliveryRate < 95) score -= 20
        
        // For SMS, bounces are less common but more severe when they happen
        if (isSMS) {
            if (bounceRate > 1) score -= 35  // SMS bounce threshold is lower
        } else {
            if (bounceRate > 5) score -= 25  // Email bounce threshold
        }
        
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
                
                <div className="flex h-full overflow-hidden">
                    {/* Left Column - Email Preview with Overlay */}
                    <div className="w-1/2 border-r dark:border-gray-700 overflow-hidden relative">
                        {/* Full Height Email Preview with Bottom Padding */}
                        <div className="h-full overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <div className="pb-40"> {/* Add padding bottom to allow scrolling past overlay */}
                                    {(() => {
                                        const messageId = data.message_id || data.messageId || data.groupings?.campaign_message_id;
                                        const storeId = campaignStore?.klaviyo_integration?.public_id || campaignStore?.public_id;
                                        
                                        console.log('🔍 Preview panel debug:', {
                                            messageId,
                                            storeId,
                                            campaignStore: campaignStore ? {
                                                name: campaignStore.name,
                                                public_id: campaignStore.public_id,
                                                klaviyo_public_id: campaignStore.klaviyo_integration?.public_id
                                            } : null,
                                            dataKeys: Object.keys(data),
                                            hasGroupings: !!data.groupings,
                                            klaviyo_public_id: data.klaviyo_public_id,
                                            store_public_id: data.store_public_id,
                                            data_message_id: data.message_id,
                                            data_groupings: data.groupings,
                                            full_data_sample: {
                                                ...data,
                                                // Limit to first few keys to avoid console spam
                                                ...(Object.keys(data).length > 10 ? { truncated: '...more keys' } : {})
                                            }
                                        });
                                        
                                        console.log('🔍 Raw data for message ID extraction:')
                                        console.log('data.message_id:', data.message_id)
                                        console.log('data.messageId (camelCase):', data.messageId)
                                        console.log('data.groupings:', data.groupings)
                                        console.log('data.groupings?.campaign_message_id:', data.groupings?.campaign_message_id)
                                        console.log('Final messageId used:', messageId)
                                        
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
                                                    {!messageId && <p className="text-xs mt-2">No message ID: {JSON.stringify({
                                                        message_id: data.message_id,
                                                        groupings_message_id: data.groupings?.campaign_message_id
                                                    })}</p>}
                                                    {!storeId && campaignStore && <p className="text-xs mt-2">No store ID: {JSON.stringify({
                                                        store_public_id: campaignStore.public_id,
                                                        klaviyo_public_id: campaignStore.klaviyo_integration?.public_id
                                                    })}</p>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        
                        {/* Back Button - Only show if coming from day modal */}
                        {campaign?.navigationSource === 'dayModal' && onBackToDay && (
                            <div className="absolute top-4 left-4 z-10">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onBackToDay();
                                    }}
                                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Day View
                                </Button>
                            </div>
                        )}

                        {/* Sticky Campaign Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="bg-white dark:bg-gray-800 backdrop-blur-md rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-lg">
                                <div>
                                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                        {data.campaign_name || data.name || 'Untitled Campaign'}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-200">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                            <span>{formatDate(data.send_date || data.date)}</span>
                                        </div>
                                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                            {data.type === 'sms' || data.channel === 'sms' ? (
                                                <><MessageSquare className="w-3 h-3 mr-1" /> SMS</>
                                            ) : (
                                                <><Mail className="w-3 h-3 mr-1" /> Email</>
                                            )}
                                        </Badge>
                                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                            {formatNumber(data.recipients)} Recipients
                                        </Badge>
                                    </div>
                                    
                                    {/* Tags and Audiences */}
                                    {(data.tagNames?.length > 0 || data.includedAudiences?.length > 0) && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {data.tagNames?.map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {data.includedAudiences?.map(audience => (
                                                <Badge key={audience.id || audience.name} variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">
                                                    <Target className="w-3 h-3 mr-1" />
                                                    {audience.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Column - Tab Content with Header */}
                    <div className="w-1/2 flex flex-col overflow-hidden">
                        {/* Elegant Tab Header */}
                        <div className="border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2 bg-transparent border-0 rounded-none h-14">
                                    <TabsTrigger 
                                        value="overview" 
                                        className="flex items-center gap-3 px-6 py-4 text-base font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="deliverability" 
                                        className="flex items-center gap-3 px-6 py-4 text-base font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                                    >
                                        <Mail className="w-5 h-5" />
                                        Deliverability
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        
                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden">
                            {/* Deliverability Tab */}
                            {activeTab === 'deliverability' && (
                                <div className="h-full overflow-y-auto">
                                    <div className="p-4">
                                        {data.type === 'sms' || data.channel === 'sms' ? (
                                            /* SMS-focused deliverability */
                                            <div className="space-y-4">
                                                {/* SMS Delivery Status */}
                                                <Card>
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <MessageSquare className="w-4 h-4" />
                                                            SMS Delivery Status
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sent</div>
                                                                <div className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(data.recipients || 0)}</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Delivered</div>
                                                                <div className="text-xl font-bold text-green-600">{formatNumber(data.delivered || data.recipients || 0)}</div>
                                                                <div className="text-xs text-green-600">{formatPercentage(data.deliveryRate || 100)}</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Failed</div>
                                                                <div className="text-xl font-bold text-red-600">{formatNumber(data.failed || data.bounced || 0)}</div>
                                                                <div className="text-xs text-red-600">{formatPercentage(data.failedRate || data.bounceRate || 0)}</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Opt-outs</div>
                                                                <div className="text-xl font-bold text-blue-600">{formatNumber(data.unsubscribed || 0)}</div>
                                                                <div className="text-xs text-blue-600">{formatPercentage(data.unsubscribeRate || 0)}</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* SMS Health & Best Practices */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {/* SMS Health Score */}
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <Activity className="w-4 h-4" />
                                                                SMS Health Score
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="text-3xl font-bold text-green-600">
                                                                    {Math.max(90, 100 - (data.failedRate || 0) * 10)}/100
                                                                </div>
                                                                <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                                                            </div>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 dark:text-gray-400">Delivery Rate</span>
                                                                    <span className="text-green-600 font-medium">{formatPercentage(data.deliveryRate || 100)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 dark:text-gray-400">Opt-out Rate</span>
                                                                    <span className="text-blue-600 font-medium">{formatPercentage(data.unsubscribeRate || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 dark:text-gray-400">Failed Rate</span>
                                                                    <span className="text-red-600 font-medium">{formatPercentage(data.failedRate || data.bounceRate || 0)}</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* SMS Best Practices */}
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" />
                                                                SMS Best Practices
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                                                    <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                                    <span className="text-green-700 dark:text-green-300">Message under 160 characters</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                                                    <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                                    <span className="text-green-700 dark:text-green-300">Clear opt-out instructions</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                                                    <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                                    <span className="text-green-700 dark:text-green-300">Proper sender identification</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                                                    <AlertCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                                    <span className="text-blue-700 dark:text-blue-300">Monitor opt-out rates</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Email-focused deliverability (compact) */
                                            <div className="space-y-4">
                                                {/* Email Delivery Overview */}
                                                <Card>
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <Mail className="w-4 h-4" />
                                                            Email Delivery Overview
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recipients</div>
                                                                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(data.recipients)}</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Delivered</div>
                                                                <div className="text-lg font-bold text-green-600">{formatNumber(data.delivered)}</div>
                                                                <div className="text-xs text-green-600">{formatPercentage(data.deliveryRate)}</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bounced</div>
                                                                <div className="text-lg font-bold text-red-600">{formatNumber(data.bounced)}</div>
                                                                <div className="text-xs text-red-600">{formatPercentage(data.bounceRate)}</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Spam</div>
                                                                <div className="text-lg font-bold text-yellow-600">{formatNumber(data.spamReports || 0)}</div>
                                                                <div className="text-xs text-yellow-600">{formatPercentage(data.spamComplaintRate || 0)}</div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Email Health & Quick Stats */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {/* Email Health Score */}
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <Activity className="w-4 h-4" />
                                                                Email Health Score
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={`text-3xl font-bold ${getScoreColor(deliveryScore)}`}>
                                                                    {deliveryScore}/100
                                                                </div>
                                                                <Badge 
                                                                    variant={deliveryScore >= 90 ? "default" : deliveryScore >= 75 ? "secondary" : "destructive"}
                                                                    className={deliveryScore >= 90 ? "bg-green-100 text-green-700" : ""}
                                                                >
                                                                    {getScoreLabel(deliveryScore)}
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 dark:text-gray-400">Bounce Rate</span>
                                                                    <span className={data.bounceRate < 2 ? "text-green-600" : "text-red-600"}>{formatPercentage(data.bounceRate)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 dark:text-gray-400">Spam Rate</span>
                                                                    <span className={data.spamComplaintRate < 0.1 ? "text-green-600" : "text-red-600"}>{formatPercentage(data.spamComplaintRate)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 dark:text-gray-400">Unsubscribe Rate</span>
                                                                    <span className={data.unsubscribeRate < 0.5 ? "text-green-600" : "text-yellow-600"}>{formatPercentage(data.unsubscribeRate)}</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Quick Health Tips */}
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Health Tips
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-2">
                                                                {data.bounceRate < 2 && (
                                                                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                                                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                                        <span className="text-green-700 dark:text-green-300">Excellent bounce rate</span>
                                                                    </div>
                                                                )}
                                                                {data.spamComplaintRate < 0.1 && (
                                                                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                                                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                                        <span className="text-green-700 dark:text-green-300">Low spam complaints</span>
                                                                    </div>
                                                                )}
                                                                {data.deliveryRate > 95 && (
                                                                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                                                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                                        <span className="text-green-700 dark:text-green-300">High delivery rate</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                                                    <AlertCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                                                    <span className="text-blue-700 dark:text-blue-300">Monitor sender reputation</span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Consolidated Overview Tab */}
                            {activeTab === 'overview' && (
                            <div className="flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto">
                                <div className="p-6 space-y-6">
                                    {/* Key Performance Metrics Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {data.type === 'sms' || data.channel === 'sms' ? (
                                            // SMS-focused metrics
                                            <>
                                                <MetricCard
                                                    icon={MessageSquare}
                                                    label="Delivered"
                                                    value={formatNumber(data.delivered || data.recipients || 0)}
                                                    subValue={`${formatPercentage(data.deliveryRate || 100)} rate`}
                                                    color="text-green-600"
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
                                            </>
                                        ) : (
                                            // Email-focused metrics
                                            <>
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
                                            </>
                                        )}
                                    </div>

                                    {/* Two Column Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Engagement Funnel */}
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Activity className="w-4 h-4" />
                                                    {data.type === 'sms' || data.channel === 'sms' ? 'SMS Engagement Funnel' : 'Engagement Funnel'}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {((data.type === 'sms' || data.channel === 'sms') ? (
                                                    // SMS funnel - no opens step
                                                    [
                                                        {
                                                            label: 'Delivered',
                                                            value: data.delivered || data.recipients || 0,
                                                            percentage: 100,
                                                            color: 'bg-green-400'
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
                                                            color: 'bg-blue-500'
                                                        }
                                                    ]
                                                ) : (
                                                    // Email funnel - includes opens
                                                    [
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
                                                    ]
                                                )).map((step) => (
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
                                                {/* CTOR for Email, Click-to-Delivery for SMS */}
                                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-orange-500" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {data.type === 'sms' || data.channel === 'sms' ? 'Click-to-Delivery Rate' : 'Click-to-Open Rate'}
                                                        </span>
                                                    </div>
                                                    <span className="text-lg font-bold text-orange-600">
                                                        {data.type === 'sms' || data.channel === 'sms' 
                                                            ? formatPercentage(((data.clicksUnique || 0) / (data.delivered || data.recipients || 1)) * 100)
                                                            : formatPercentage(data.ctor || data.clickToOpenRate || data.clickToOpen || 0)
                                                        }
                                                    </span>
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
                                                <div className="flex items-center gap-1">
                                                    <BarChart3 className="w-3 h-3 text-blue-600" />
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Delivery Score</span>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <button className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5">
                                                                <Info className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                                                            <div className="space-y-3">
                                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Delivery Health Score</h4>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                    Our delivery score rates campaign quality from 0-100 based on key metrics:
                                                                </p>
                                                                <div className="space-y-2 text-xs">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Delivery Rate &lt; 95%:</span>
                                                                        <span className="text-red-600">-20 points</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">
                                                                            {data.type === 'sms' || data.channel === 'sms' ? 'Bounce Rate > 1%:' : 'Bounce Rate > 5%:'}
                                                                        </span>
                                                                        <span className="text-red-600">
                                                                            {data.type === 'sms' || data.channel === 'sms' ? '-35 points' : '-25 points'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Spam Rate &gt; 0.1%:</span>
                                                                        <span className="text-red-600">-30 points</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Unsubscribe Rate &gt; 2%:</span>
                                                                        <span className="text-red-600">-15 points</span>
                                                                    </div>
                                                                </div>
                                                                {data.type === 'sms' || data.channel === 'sms' ? (
                                                                    <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                                                        SMS campaigns have stricter bounce thresholds since delivery failures are less common but more impactful.
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>
                                            <div className={`text-lg font-semibold ${getScoreColor(deliveryScore)} dark:text-white flex items-center gap-1`}>
                                                {deliveryScore}/100
                                                <span className={`text-xs font-medium ${getScoreColor(deliveryScore)}`}>
                                                    {getScoreLabel(deliveryScore)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
"use client"

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/app/components/ui/dialog'
import { Badge } from '@/app/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import {
    Clock,
    Send,
    Users,
    UserCheck,
    Settings,
    ToggleLeft,
    ToggleRight,
    Link2,
    Calendar,
    Mail,
    MessageSquare,
    XCircle,
    Activity,
    Target,
    Trash2,
    Edit,
    AlertTriangle,
    Plus,
    Search,
    Check,
    X,
    FileText
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useToast } from '@/app/components/ui/use-toast'
import MorphingLoader from '@/app/components/ui/loading'
import { formatNumber } from '@/lib/utils'

// Dynamically import EmailPreviewPanel
const EmailPreviewPanel = dynamic(
    () => import('./EmailPreviewPanel').then(mod => mod.EmailPreviewPanel),
    {
        loading: () => <div className="flex items-center justify-center p-8">Loading preview...</div>,
        ssr: false
    }
)

// Global cache for audiences across all stores
const audienceCache = {};
// Track which stores are currently being fetched to prevent duplicate requests
const fetchingStores = new Set();

export default function ScheduledCampaignModal({ campaign, isOpen, onClose, stores, onCampaignDeleted, onCampaignUpdated }) {
    const { toast } = useToast()
    const [campaignData, setCampaignData] = useState(null)
    const [estimatedRecipients, setEstimatedRecipients] = useState(0)
    const [loadingRecipientCount, setLoadingRecipientCount] = useState(false)
    const [storeAudiences, setStoreAudiences] = useState(null)
    const [loadingAudiences, setLoadingAudiences] = useState(false)

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirmName, setDeleteConfirmName] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    // Update modal state
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateForm, setUpdateForm] = useState({
        name: '',
        send_time: '',
        is_local: false,
        included_audiences: [],
        excluded_audiences: [],
        use_smart_sending: true,
        ignore_unsubscribes: false,
        is_tracking_opens: true,
        is_tracking_clicks: true,
        is_add_utm: false,
        utm_source: '',
        utm_medium: '',
        utm_campaign: ''
    })
    const [availableAudiences, setAvailableAudiences] = useState({ segments: [], lists: [] })
    const [searchQuery, setSearchQuery] = useState('')
    const [loadingAvailableAudiences, setLoadingAvailableAudiences] = useState(false)

    useEffect(() => {
        if (isOpen && campaign) {
            setCampaignData(campaign);

            // Debug logging to check audiences data
            console.log('ScheduledCampaignModal - Campaign data:', {
                campaignName: campaign.name,
                audiences: campaign.audiences,
                included_audiences: campaign.included_audiences,
                excluded_audiences: campaign.excluded_audiences,
                hasAudiences: !!(campaign.audiences?.included?.length || campaign.audiences?.excluded?.length)
            });

            // Initialize update form with campaign data
            setUpdateForm({
                name: campaign.campaign_name || campaign.name || '',
                send_time: campaign.send_strategy?.options?.datetime || campaign.send_time || campaign.scheduled_at || '',
                is_local: campaign.send_strategy?.options?.is_local || false,
                included_audiences: campaign.audiences?.included || [],
                excluded_audiences: campaign.audiences?.excluded || [],
                use_smart_sending: campaign.send_options?.use_smart_sending !== false,
                ignore_unsubscribes: campaign.send_options?.ignore_unsubscribes || false,
                is_tracking_opens: campaign.tracking_options?.is_tracking_opens !== false,
                is_tracking_clicks: campaign.tracking_options?.is_tracking_clicks !== false,
                is_add_utm: campaign.tracking_options?.is_add_utm || false,
                utm_source: campaign.tracking_options?.utm_params?.find(p => p.name === 'utm_source')?.value || '',
                utm_medium: campaign.tracking_options?.utm_params?.find(p => p.name === 'utm_medium')?.value || '',
                utm_campaign: campaign.tracking_options?.utm_params?.find(p => p.name === 'utm_campaign')?.value || ''
            });
        }

        // Reset delete modal state
        if (!isOpen) {
            setShowDeleteModal(false);
            setDeleteConfirmName('');
            setShowUpdateModal(false);
        }
    }, [isOpen, campaign])

    // Fetch full campaign details including audiences when modal opens
    useEffect(() => {
        const fetchCampaignDetails = async () => {
            if (!isOpen || !campaign) return;

            const campaignId = campaign.campaignId || campaign.id?.replace('future-', '');
            const storeId = campaign.klaviyo_public_id;

            if (!campaignId || !storeId) {
                console.warn('Missing campaignId or storeId for fetching campaign details');
                return;
            }

            try {
                console.log('Fetching full campaign details:', { campaignId, storeId });
                const response = await fetch(`/api/klaviyo/campaign/${campaignId}?storeId=${storeId}`);

                if (response.ok) {
                    const result = await response.json();

                    if (result.success && result.data) {
                        console.log('Fetched campaign with audiences:', result.data.audiences);

                        // Update the campaign data with the fetched details
                        setCampaignData(prev => ({
                            ...prev,
                            audiences: result.data.audiences,
                            attributes: result.data.attributes,
                            ...result.data.attributes  // Spread attributes to top level for easier access
                        }));
                    }
                } else {
                    console.error('Failed to fetch campaign details, status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching campaign details:', error);
            }
        };

        fetchCampaignDetails();
    }, [isOpen, campaign?.id, campaign?.campaignId, campaign?.klaviyo_public_id]);

    // Fetch and cache audiences for the store
    useEffect(() => {
        const fetchStoreAudiences = async () => {
            if (!isOpen || !campaign) return;

            const data = campaignData || campaign;
            // Try multiple ways to get the store ID
            const storeId = data.klaviyo_public_id ||
                           data.store?.klaviyo_integration?.public_id ||
                           stores?.find(s =>
                               s.public_id === data?.store_public_id ||
                               s.public_id === campaign?.store_public_id
                           )?.klaviyo_integration?.public_id;

            if (!storeId) {
                console.warn('No klaviyo store ID found for audience fetch');
                return;
            }

            // Check if we already have cached audiences for this store
            if (audienceCache[storeId]) {
                console.log('Using cached audiences for store:', storeId);
                setStoreAudiences(audienceCache[storeId]);
                return;
            }

            // Check if we're already fetching for this store
            if (fetchingStores.has(storeId)) {
                console.log('Already fetching audiences for store:', storeId);
                return;
            }

            fetchingStores.add(storeId);
            setLoadingAudiences(true);

            try {
                console.log('Fetching audiences for store:', storeId);
                const response = await fetch(`/api/klaviyo/store-audiences?storeId=${storeId}`);

                if (response.ok) {
                    const result = await response.json();
                    const audienceData = result.data?.audienceIndex || {};

                    console.log('Fetched audience data:', {
                        storeId,
                        audienceCount: Object.keys(audienceData).length,
                        sampleAudiences: Object.keys(audienceData).slice(0, 3)
                    });

                    // Cache the data globally
                    audienceCache[storeId] = audienceData;
                    setStoreAudiences(audienceData);
                } else {
                    console.error('Failed to fetch audiences, status:', response.status);
                    setStoreAudiences({});
                }
            } catch (error) {
                console.error('Error fetching store audiences:', error);
                setStoreAudiences({});
            } finally {
                setLoadingAudiences(false);
                fetchingStores.delete(storeId);
            }
        };

        fetchStoreAudiences();
    }, [isOpen, campaign?.id, campaign?.klaviyo_public_id]) // Use campaign's klaviyo_public_id instead

    // Fetch recipient estimation using the simpler endpoint
    useEffect(() => {
        const fetchRecipientEstimation = async () => {
            if (!isOpen || !campaign) return;

            const data = campaignData || campaign;

            // Extract the actual Klaviyo campaign ID (remove any prefixes like 'future-')
            let campaignId = data.id || data.campaign_id || data.messageId;
            if (campaignId && campaignId.startsWith('future-')) {
                campaignId = campaignId.replace('future-', '');
            }

            const storeId = data.klaviyo_public_id;

            // Use existing values if available
            if (data.estimated_recipients || data.recipients) {
                setEstimatedRecipients(data.estimated_recipients || data.recipients);
                return;
            }

            if (!campaignId || !storeId) {
                console.log('Missing campaign ID or store ID for recipient estimation', { campaignId, storeId, data });
                return;
            }

            // For scheduled campaigns, we might not have recipient estimation available yet
            // Skip fetching if the campaign ID looks invalid
            if (campaignId.length < 10) {
                console.log('Skipping recipient estimation for invalid campaign ID:', campaignId);
                setEstimatedRecipients(0);
                return;
            }

            setLoadingRecipientCount(true);

            try {
                const response = await fetch(
                    `/api/klaviyo/campaign-recipient-estimation?campaignId=${campaignId}&storeId=${storeId}`
                );

                if (response.ok) {
                    const result = await response.json();

                    if (result.data?.status === 'processing') {
                        // Estimation is being calculated, try again after a delay
                        setTimeout(async () => {
                            try {
                                const retryResponse = await fetch(
                                    `/api/klaviyo/campaign-recipient-estimation?campaignId=${campaignId}&storeId=${storeId}`
                                );
                                if (retryResponse.ok) {
                                    const retryResult = await retryResponse.json();
                                    setEstimatedRecipients(retryResult.data?.estimated_recipient_count || 0);
                                }
                            } catch (err) {
                                console.error('Error on retry:', err);
                            }
                            setLoadingRecipientCount(false);
                        }, 5000); // Retry after 5 seconds
                    } else {
                        setEstimatedRecipients(result.data?.estimated_recipient_count || 0);
                        setLoadingRecipientCount(false);
                    }
                } else {
                    // For scheduled campaigns, estimation might not be available
                    setEstimatedRecipients(0);
                    setLoadingRecipientCount(false);
                }
            } catch (error) {
                console.error('Error fetching recipient estimation:', error);
                setEstimatedRecipients(0);
                setLoadingRecipientCount(false);
            }
        };

        fetchRecipientEstimation();
    }, [isOpen, campaign?.id, campaignData])

    if (!campaign) return null

    const data = campaignData || campaign

    // Memoize store info for the campaign to prevent recalculation
    const campaignStore = useMemo(() => {
        return stores?.find(s =>
            s.public_id === campaign?.store_public_id ||
            s.klaviyo_integration?.public_id === campaign?.klaviyo_public_id ||
            s.public_id === data?.store_public_id ||
            s.klaviyo_integration?.public_id === data?.klaviyo_public_id
        )
    }, [stores, campaign?.store_public_id, campaign?.klaviyo_public_id, data?.store_public_id, data?.klaviyo_public_id])

    // Memoize messageId and storeId for EmailPreviewPanel
    const emailPreviewProps = useMemo(() => {
        const messageId = data.messageId || data.message_id;
        const storeId = campaignStore?.klaviyo_integration?.public_id || campaignStore?.public_id;
        return { messageId, storeId };
    }, [data.messageId, data.message_id, campaignStore?.klaviyo_integration?.public_id, campaignStore?.public_id])

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

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0'
        return new Intl.NumberFormat().format(num)
    }

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
                <DialogTitle className="sr-only">Scheduled Campaign Details</DialogTitle>
                <DialogDescription className="sr-only">
                    View scheduled campaign information and settings
                </DialogDescription>

                <div className="flex h-full overflow-hidden">
                    {/* Left Column - Email Preview */}
                    <div className="w-1/2 border-r dark:border-gray-700 overflow-hidden relative">
                        <div className="h-full overflow-y-auto">
                            <div className="pb-32">
                                {emailPreviewProps.messageId && emailPreviewProps.storeId ? (
                                    <EmailPreviewPanel
                                        key={`${emailPreviewProps.messageId}-${emailPreviewProps.storeId}`}
                                        messageId={emailPreviewProps.messageId}
                                        storeId={emailPreviewProps.storeId}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                            <p>No preview available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Campaign Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-lg">
                                <div>
                                    <h2 className="text-lg font-semibold mb-1.5 text-gray-900 dark:text-white">
                                        {data.campaign_name || data.name || 'Untitled Campaign'}
                                    </h2>
                                    <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-200">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                                            <span className="font-medium">{formatDate(data.send_time || data.scheduled_at)}</span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={
                                                data.status === 'Draft'
                                                    ? "border-gray-500 text-gray-600 bg-gray-50 py-0 px-1.5 text-xs"
                                                    : "border-blue-500 text-blue-600 bg-blue-50 py-0 px-1.5 text-xs"
                                            }
                                        >
                                            {data.status === 'Draft' ?
                                                <><FileText className="w-2.5 h-2.5 mr-0.5" />Draft</> :
                                                <><Clock className="w-2.5 h-2.5 mr-0.5" />Scheduled</>
                                            }
                                        </Badge>
                                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 py-0 px-1.5 text-xs">
                                            {data.type === 'sms' || data.channel === 'sms' ? (
                                                <><MessageSquare className="w-2.5 h-2.5 mr-0.5" /> SMS</>
                                            ) : (
                                                <><Mail className="w-2.5 h-2.5 mr-0.5" /> Email</>
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Scheduled Campaign Info */}
                    <div className="w-1/2 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="border-b dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 px-4 py-3">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Campaign Overview
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Send Information */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Send className="w-4 h-4" />
                                        Send Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        {/* Scheduled Send Time */}
                                        <div className="flex items-start gap-2">
                                            <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Scheduled Send Time</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {data.send_strategy?.options?.datetime ?
                                                        formatDate(data.send_strategy.options.datetime) :
                                                        data.send_time ? formatDate(data.send_time) :
                                                        data.scheduled_at ? formatDate(data.scheduled_at) :
                                                        'Not scheduled yet'
                                                    }
                                                </p>
                                                {/* Local timezone note - moved here */}
                                                {data.send_strategy?.options?.is_local && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Sending in recipient's local timezone
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Send Strategy */}
                                        <div className="flex items-start gap-2">
                                            <Settings className="w-4 h-4 text-gray-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Send Strategy</p>
                                                <p className="text-sm text-gray-900 dark:text-white capitalize">
                                                    {data.send_strategy?.method || 'Static'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Campaign Status */}
                                        <div className="flex items-start gap-2">
                                            <Activity className="w-4 h-4 text-gray-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Campaign Status</p>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        data.status === 'Draft'
                                                            ? "border-gray-500 text-gray-600 bg-gray-50 mt-1"
                                                            : data.status === 'Queued without Recipients'
                                                            ? "border-yellow-500 text-yellow-600 bg-yellow-50 mt-1"
                                                            : "border-blue-500 text-blue-600 bg-blue-50 mt-1"
                                                    }
                                                >
                                                    {/* Show the actual status from Klaviyo */}
                                                    {data.status || 'Scheduled'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Channel Type */}
                                        <div className="flex items-start gap-2">
                                            {data.type === 'sms' || data.channel === 'sms' ? (
                                                <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                                            ) : (
                                                <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Channel</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {data.type === 'sms' || data.channel === 'sms' ? 'SMS' : 'Email'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Audience Information */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4" />
                                        Audience & Targeting
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Debug logging for audiences */}
                                    {console.log('Full campaign data:', campaign)}
                                    {console.log('Full data object:', data)}
                                    {console.log('Audiences display check:', {
                                        data_audiences: data.audiences,
                                        campaign_audiences: campaign?.audiences,
                                        included: data.audiences?.included || campaign?.audiences?.included,
                                        excluded: data.audiences?.excluded || campaign?.audiences?.excluded,
                                        storeAudiences: Object.keys(storeAudiences || {}).length,
                                        loadingAudiences
                                    })}

                                    {(data.audiences?.included?.length > 0 || campaign?.audiences?.included?.length > 0) && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                                Included Audiences
                                                {loadingAudiences && (
                                                    <span className="ml-2 text-[10px] opacity-60">(loading names...)</span>
                                                )}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(data.audiences?.included || campaign?.audiences?.included || []).map((audienceId) => {
                                                    const audience = storeAudiences?.[audienceId];
                                                    // Show the name if we have it, otherwise show the ID
                                                    const name = audience?.name || `Audience ${audienceId.slice(0, 8)}...`;
                                                    const profileCount = audience?.profile_count;
                                                    const type = audience?.type;
                                                    const isLoading = loadingAudiences && !audience;

                                                    return (
                                                        <Badge
                                                            key={audienceId}
                                                            variant="secondary"
                                                            className={`text-xs py-0.5 px-2 ${
                                                                isLoading ? 'bg-gray-100 text-gray-600 animate-pulse' :
                                                                'bg-green-100 text-green-800 border-green-300'
                                                            }`}
                                                            title={`${type === 'segment' ? 'Segment' : type === 'list' ? 'List' : 'Audience'}: ${audience?.name || audienceId}`}
                                                        >
                                                            <UserCheck className="w-2.5 h-2.5 mr-0.5" />
                                                            {name}
                                                            {profileCount !== undefined && profileCount > 0 && (
                                                                <span className="ml-1 text-[10px] opacity-75">
                                                                    ({formatNumber(profileCount)})
                                                                </span>
                                                            )}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {(data.audiences?.excluded?.length > 0 || campaign?.audiences?.excluded?.length > 0) && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                                Excluded Audiences
                                                {loadingAudiences && (
                                                    <span className="ml-2 text-[10px] opacity-60">(loading names...)</span>
                                                )}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(data.audiences?.excluded || campaign?.audiences?.excluded || []).map((audienceId) => {
                                                    const audience = storeAudiences?.[audienceId];
                                                    // Show the name if we have it, otherwise show the ID
                                                    const name = audience?.name || `Audience ${audienceId.slice(0, 8)}...`;
                                                    const type = audience?.type;
                                                    const isLoading = loadingAudiences && !audience;

                                                    return (
                                                        <Badge
                                                            key={audienceId}
                                                            variant="secondary"
                                                            className={`text-xs py-0.5 px-2 ${
                                                                isLoading ? 'bg-gray-100 text-gray-600 animate-pulse' :
                                                                'bg-red-100 text-red-800 border-red-300'
                                                            }`}
                                                            title={`${type === 'segment' ? 'Segment' : type === 'list' ? 'List' : 'Audience'}: ${audience?.name || audienceId}`}
                                                        >
                                                            <XCircle className="w-2.5 h-2.5 mr-0.5" />
                                                            {name}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Estimated Recipients</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {loadingRecipientCount ? (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <span className="animate-pulse">Calculating...</span>
                                                    </span>
                                                ) : estimatedRecipients > 0 ? (
                                                    formatNumber(estimatedRecipients)
                                                ) : data.estimated_recipients > 0 ? (
                                                    formatNumber(data.estimated_recipients)
                                                ) : campaign?.estimated_recipients > 0 ? (
                                                    formatNumber(campaign.estimated_recipients)
                                                ) : (
                                                    <span className="text-xs text-gray-500">Not available</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Campaign Settings */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Settings className="w-4 h-4" />
                                        Campaign Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Send Options Column */}
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Send Options</p>
                                            <div className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                                <span className="text-gray-600 dark:text-gray-400">Smart Sending</span>
                                                {data.send_options?.use_smart_sending ? (
                                                    <ToggleRight className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                                <span className="text-gray-600 dark:text-gray-400">Ignore Unsubscribes</span>
                                                {data.send_options?.ignore_unsubscribes ? (
                                                    <ToggleRight className="w-4 h-4 text-yellow-600" />
                                                ) : (
                                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Tracking Options Column */}
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Tracking Options</p>
                                            <div className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                                <span className="text-gray-600 dark:text-gray-400">Track Opens</span>
                                                {data.tracking_options?.is_tracking_opens !== false ? (
                                                    <ToggleRight className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                                <span className="text-gray-600 dark:text-gray-400">Track Clicks</span>
                                                {data.tracking_options?.is_tracking_clicks !== false ? (
                                                    <ToggleRight className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* UTM Tracking Note - Full Width Below */}
                                    {data.tracking_options?.add_tracking_params && (
                                        <div className="mt-2 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                                            <div className="flex items-center gap-1.5">
                                                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                                                <span className="text-xs text-blue-700 dark:text-blue-300">UTM tracking enabled</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Buttons Footer */}
                        <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="text-sm"
                            >
                                Close
                            </Button>

                            <div className="flex items-center gap-2">
                                {/* Action buttons for scheduled campaigns - always show since this is ScheduledCampaignModal */}
                                <Button
                                    variant="outline"
                                    onClick={() => setShowUpdateModal(true)}
                                    className="text-sm bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white border-0"
                                >
                                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                                    Update Campaign
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="text-sm border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Delete Campaign
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal />

        {/* Update Campaign Modal */}
        <UpdateCampaignModal />
        </>
    );

    // Delete Confirmation Modal Component
    function DeleteConfirmationModal() {
        const campaignName = data?.campaign_name || data?.name || 'Untitled Campaign';
        const canDelete = deleteConfirmName === campaignName;

        const handleDelete = async () => {
            if (!canDelete) return;

            setIsDeleting(true);
            const campaignId = (data.id || '').replace('future-', '');
            const storeId = data.klaviyo_public_id;

            try {
                const response = await fetch(`/api/klaviyo/campaign/delete`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ campaignId, storeId })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    toast({
                        title: "Success",
                        description: "Campaign deleted successfully",
                    });
                    setShowDeleteModal(false);
                    onClose();
                    if (onCampaignDeleted) onCampaignDeleted(data.id);
                } else {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to delete campaign",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error('Error deleting campaign:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete campaign",
                    variant: "destructive",
                });
            } finally {
                setIsDeleting(false);
            }
        };

        return (
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Campaign
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The campaign will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                You are about to delete the campaign:
                                <strong className="block mt-2">{campaignName}</strong>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="delete-confirm">
                                Type the campaign name to confirm deletion:
                            </Label>
                            <Input
                                id="delete-confirm"
                                value={deleteConfirmName}
                                onChange={(e) => setDeleteConfirmName(e.target.value)}
                                placeholder={campaignName}
                                className="font-mono"
                            />
                            {deleteConfirmName && !canDelete && (
                                <p className="text-xs text-red-500">Name doesn't match</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={!canDelete || isDeleting}
                        >
                            {isDeleting ? (
                                <><MorphingLoader size="small" showThemeText={false} /> Deleting...</>
                            ) : (
                                <>Delete Campaign</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    // Update Campaign Modal Component
    function UpdateCampaignModal() {
        // Fetch available audiences when modal opens
        useEffect(() => {
            if (showUpdateModal && data?.klaviyo_public_id) {
                fetchAvailableAudiences();
            }
        }, [showUpdateModal]);

        const fetchAvailableAudiences = async () => {
            setLoadingAvailableAudiences(true);
            const storeId = data.klaviyo_public_id;

            try {
                const response = await fetch(`/api/klaviyo/store-audiences?storeId=${storeId}`);
                if (response.ok) {
                    const result = await response.json();
                    setAvailableAudiences({
                        segments: result.data?.segments || [],
                        lists: result.data?.lists || []
                    });
                }
            } catch (error) {
                console.error('Error fetching audiences:', error);
            } finally {
                setLoadingAvailableAudiences(false);
            }
        };

        const handleUpdate = async () => {
            setIsUpdating(true);
            const campaignId = (data.id || '').replace('future-', '');
            const storeId = data.klaviyo_public_id;

            try {
                const response = await fetch(`/api/klaviyo/campaign/update`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campaignId,
                        storeId,
                        updates: updateForm
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    toast({
                        title: "Success",
                        description: "Campaign updated successfully",
                    });
                    setShowUpdateModal(false);
                    if (onCampaignUpdated) onCampaignUpdated(result.data);
                } else {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to update campaign",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error('Error updating campaign:', error);
                toast({
                    title: "Error",
                    description: "Failed to update campaign",
                    variant: "destructive",
                });
            } finally {
                setIsUpdating(false);
            }
        };

        const toggleAudience = (audienceId, type) => {
            setUpdateForm(prev => {
                const included = [...prev.included_audiences];
                const excluded = [...prev.excluded_audiences];

                if (type === 'include') {
                    const idx = included.indexOf(audienceId);
                    if (idx > -1) {
                        included.splice(idx, 1);
                    } else {
                        included.push(audienceId);
                        // Remove from excluded if present
                        const exIdx = excluded.indexOf(audienceId);
                        if (exIdx > -1) excluded.splice(exIdx, 1);
                    }
                } else {
                    const idx = excluded.indexOf(audienceId);
                    if (idx > -1) {
                        excluded.splice(idx, 1);
                    } else {
                        excluded.push(audienceId);
                        // Remove from included if present
                        const inIdx = included.indexOf(audienceId);
                        if (inIdx > -1) included.splice(inIdx, 1);
                    }
                }

                return { ...prev, included_audiences: included, excluded_audiences: excluded };
            });
        };

        const filteredAudiences = {
            segments: availableAudiences.segments.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
            lists: availableAudiences.lists.filter(l =>
                l.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        };

        return (
            <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
                <DialogContent className="max-w-3xl max-h-[85vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Update Campaign
                        </DialogTitle>
                        <DialogDescription>
                            Modify campaign settings, audiences, and tracking options
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="audiences">Audiences</TabsTrigger>
                            <TabsTrigger value="send">Send Options</TabsTrigger>
                            <TabsTrigger value="tracking">Tracking</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="h-[400px] pr-4">
                            <TabsContent value="general" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="campaign-name">Campaign Name</Label>
                                    <Input
                                        id="campaign-name"
                                        value={updateForm.name}
                                        onChange={(e) => setUpdateForm({...updateForm, name: e.target.value})}
                                        placeholder="Enter campaign name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="send-time">Scheduled Send Time</Label>
                                    <Input
                                        id="send-time"
                                        type="datetime-local"
                                        value={updateForm.send_time ? new Date(updateForm.send_time).toISOString().slice(0, 16) : ''}
                                        onChange={(e) => setUpdateForm({...updateForm, send_time: new Date(e.target.value).toISOString()})}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="local-timezone"
                                        checked={updateForm.is_local}
                                        onCheckedChange={(checked) => setUpdateForm({...updateForm, is_local: checked})}
                                    />
                                    <Label htmlFor="local-timezone">
                                        Send in recipient's local timezone
                                    </Label>
                                </div>
                            </TabsContent>

                            <TabsContent value="audiences" className="mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Search className="w-4 h-4 text-gray-500" />
                                        <Input
                                            placeholder="Search audiences..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>

                                    {loadingAvailableAudiences ? (
                                        <div className="flex items-center justify-center py-8">
                                            <MorphingLoader size="medium" showText={true} text="Loading audiences..." />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredAudiences.segments.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                        <Target className="w-4 h-4" />
                                                        Segments
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {filteredAudiences.segments.map(segment => {
                                                            const isIncluded = updateForm.included_audiences.includes(segment.id);
                                                            const isExcluded = updateForm.excluded_audiences.includes(segment.id);

                                                            return (
                                                                <div key={segment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{segment.name}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {formatNumber(segment.profile_count)} profiles
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant={isIncluded ? "default" : "outline"}
                                                                            className={isIncluded ? "bg-green-600 hover:bg-green-700" : ""}
                                                                            onClick={() => toggleAudience(segment.id, 'include')}
                                                                        >
                                                                            {isIncluded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                                            Include
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant={isExcluded ? "default" : "outline"}
                                                                            className={isExcluded ? "bg-red-600 hover:bg-red-700" : ""}
                                                                            onClick={() => toggleAudience(segment.id, 'exclude')}
                                                                        >
                                                                            {isExcluded ? <X className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                                            Exclude
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {filteredAudiences.lists.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        Lists
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {filteredAudiences.lists.map(list => {
                                                            const isIncluded = updateForm.included_audiences.includes(list.id);
                                                            const isExcluded = updateForm.excluded_audiences.includes(list.id);

                                                            return (
                                                                <div key={list.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{list.name}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {formatNumber(list.profile_count)} profiles
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant={isIncluded ? "default" : "outline"}
                                                                            className={isIncluded ? "bg-green-600 hover:bg-green-700" : ""}
                                                                            onClick={() => toggleAudience(list.id, 'include')}
                                                                        >
                                                                            {isIncluded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                                            Include
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant={isExcluded ? "default" : "outline"}
                                                                            className={isExcluded ? "bg-red-600 hover:bg-red-700" : ""}
                                                                            onClick={() => toggleAudience(list.id, 'exclude')}
                                                                        >
                                                                            {isExcluded ? <X className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                                            Exclude
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="send" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <Label htmlFor="smart-sending" className="text-sm font-medium">Smart Sending</Label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Avoid sending to recently contacted profiles
                                            </p>
                                        </div>
                                        <Switch
                                            id="smart-sending"
                                            checked={updateForm.use_smart_sending}
                                            onCheckedChange={(checked) => setUpdateForm({...updateForm, use_smart_sending: checked})}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <Label htmlFor="ignore-unsubs" className="text-sm font-medium">Ignore Unsubscribes</Label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Send to unsubscribed profiles (transactional only)
                                            </p>
                                        </div>
                                        <Switch
                                            id="ignore-unsubs"
                                            checked={updateForm.ignore_unsubscribes}
                                            onCheckedChange={(checked) => setUpdateForm({...updateForm, ignore_unsubscribes: checked})}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="tracking" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <Label htmlFor="track-opens" className="text-sm font-medium">Track Opens</Label>
                                        <Switch
                                            id="track-opens"
                                            checked={updateForm.is_tracking_opens}
                                            onCheckedChange={(checked) => setUpdateForm({...updateForm, is_tracking_opens: checked})}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <Label htmlFor="track-clicks" className="text-sm font-medium">Track Clicks</Label>
                                        <Switch
                                            id="track-clicks"
                                            checked={updateForm.is_tracking_clicks}
                                            onCheckedChange={(checked) => setUpdateForm({...updateForm, is_tracking_clicks: checked})}
                                        />
                                    </div>

                                    <div className="space-y-3 border-t pt-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="utm-tracking" className="text-sm font-medium">UTM Tracking</Label>
                                            <Switch
                                                id="utm-tracking"
                                                checked={updateForm.is_add_utm}
                                                onCheckedChange={(checked) => setUpdateForm({...updateForm, is_add_utm: checked})}
                                            />
                                        </div>

                                        {updateForm.is_add_utm && (
                                            <div className="space-y-2 pl-4">
                                                <div>
                                                    <Label htmlFor="utm-source" className="text-xs">UTM Source</Label>
                                                    <Input
                                                        id="utm-source"
                                                        value={updateForm.utm_source}
                                                        onChange={(e) => setUpdateForm({...updateForm, utm_source: e.target.value})}
                                                        placeholder="e.g., email"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="utm-medium" className="text-xs">UTM Medium</Label>
                                                    <Input
                                                        id="utm-medium"
                                                        value={updateForm.utm_medium}
                                                        onChange={(e) => setUpdateForm({...updateForm, utm_medium: e.target.value})}
                                                        placeholder="e.g., newsletter"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="utm-campaign" className="text-xs">UTM Campaign</Label>
                                                    <Input
                                                        id="utm-campaign"
                                                        value={updateForm.utm_campaign}
                                                        onChange={(e) => setUpdateForm({...updateForm, utm_campaign: e.target.value})}
                                                        placeholder="e.g., spring_sale"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowUpdateModal(false)}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple"
                        >
                            {isUpdating ? (
                                <><MorphingLoader size="small" showThemeText={false} /> Updating...</>
                            ) : (
                                <>Save Changes</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }}

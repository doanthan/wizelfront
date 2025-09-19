"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import MorphingLoader from "@/app/components/ui/loading"
import Select from "react-select"
import { selectStyles, selectStylesDark } from "@/app/components/selectStyles"
import { useAI } from "@/app/contexts/ai-context"
import { useTheme } from "@/app/contexts/theme-context"
import { useDashboardData, useDashboardPrefetch } from "@/app/hooks/useDashboardData"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Mail,
    MessageSquare,
    Bell,
    ArrowUp,
    ArrowDown,
    Eye,
    MousePointer,
    Target
} from "lucide-react"
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts"
import dynamic from 'next/dynamic'

// Dynamically import the shared CampaignDetailsModal
const CampaignDetailsModal = dynamic(
    () => import('@/app/components/campaigns/CampaignDetailsModal'),
    { ssr: false }
)

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']

// Create a wrapper component for campaign loaders that ensures different initial messages
const CampaignLoader = () => {
    // Generate a random set of loading messages that starts differently
    const campaignLoadingMessages = useMemo(() => {
        const messages = [
            "Fetching campaign data...",
            "Analyzing performance metrics...",
            "Loading email campaigns...",
            "Gathering campaign insights...",
            "Retrieving campaign statistics...",
            "Processing marketing data...",
            "Syncing with Klaviyo...",
            "Collecting campaign results...",
            "Loading campaign history...",
            "Preparing campaign overview..."
        ];
        // Shuffle the array to get a random starting point
        const shuffled = [...messages].sort(() => Math.random() - 0.5);
        return shuffled;
    }, []);

    return <MorphingLoader size="small" showThemeText={true} customThemeTexts={campaignLoadingMessages} textDuration={2000} />;
};

// Helper function to calculate days until a date
const getDaysUntil = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Past";
    return `In ${diffDays} days`;
};

export default function SimpleDashboard({
    selectedAccounts,
    dateRangeSelection,
    stores
}) {
    const { updateAIState } = useAI();
    const { theme } = useTheme();
    const [dashboardData, setDashboardData] = useState(null)
    const [showAllRecent, setShowAllRecent] = useState(false)
    const [performanceMetric, setPerformanceMetric] = useState('revenue')
    const [performanceView, setPerformanceView] = useState('by-account') // 'aggregate' or 'by-account'
    const [selectedCampaign, setSelectedCampaign] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    // Pagination and filtering for Recent Campaigns
    const [campaignPage, setCampaignPage] = useState(1)
    const [selectedCampaignStore, setSelectedCampaignStore] = useState('all')
    const [selectedUpcomingStore, setSelectedUpcomingStore] = useState('all')
    const campaignsPerPage = 10

    // Use appropriate select styles based on theme
    const currentSelectStyles = theme === 'dark' ? selectStylesDark : selectStyles

    // Prepare store IDs for the caching hook - memoized to prevent infinite re-renders
    // The API expects store public_ids, not klaviyo_public_ids
    const storeIds = useMemo(() => {
        return selectedAccounts?.[0]?.value === 'all' || !selectedAccounts?.length
            ? stores?.map(s => s.public_id).filter(Boolean)
            : selectedAccounts.map(acc => acc.value).filter(v => !v.startsWith('tag:'));
    }, [selectedAccounts, stores]);

    // Use the smart caching hook
    const {
        data,
        loading: isLoading,
        error
    } = useDashboardData(
        storeIds,
        dateRangeSelection?.ranges?.main,
        dateRangeSelection?.ranges?.comparison
    );

    // Debug logging for dashboard request
    useEffect(() => {
        if (storeIds && dateRangeSelection?.ranges?.main) {
            console.log('📊 Dashboard request payload:', {
                storeIds,
                dateRange: dateRangeSelection.ranges.main,
                comparison: dateRangeSelection.ranges.comparison,
                metrics: ['revenue', 'campaigns', 'flows', 'performance']
            });
        }
    }, [storeIds, dateRangeSelection]);

    // Debug logging for dashboard response
    useEffect(() => {
        if (data) {
            console.log('📈 Dashboard response received:', {
                hasSummary: !!data.summary,
                performanceDataPoints: data.performanceOverTime?.length || 0,
                timeSeriesDataPoints: data.timeSeries?.length || 0,
                byAccountStores: data.byAccount?.length || 0,
                firstPerformanceRecord: data.performanceOverTime?.[0],
                availableMetrics: data.performanceOverTime?.[0] ? Object.keys(data.performanceOverTime[0]) : []
            });
        }
    }, [data]);

    // Use prefetching hook for common store combinations
    useDashboardPrefetch(storeIds, dateRangeSelection?.ranges?.main);

    // Simple state for campaigns
    const [allRecentCampaigns, setAllRecentCampaigns] = useState([]);
    const [allUpcomingCampaigns, setAllUpcomingCampaigns] = useState([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);
    const [campaignError, setCampaignError] = useState(null);
    const [failedStores, setFailedStores] = useState(new Set());
    const [isKlaviyoDown, setIsKlaviyoDown] = useState(false);

    // Simple useEffect to fetch recent campaigns from ALL stores, independent of selected accounts
    useEffect(() => {
        if (!stores || stores.length === 0) {
            console.log('No stores available, skipping recent campaigns fetch');
            setAllRecentCampaigns([]);
            return;
        }

        const fetchRecentCampaigns = async () => {
            try {
                console.log('Fetching recent campaigns from ALL stores...');
                setLoadingCampaigns(true);

                // Get ALL klaviyo IDs from ALL stores (ignore selected accounts)
                const allKlaviyoIds = stores
                    .filter(s => s.klaviyo_integration?.public_id)
                    .map(s => s.klaviyo_integration.public_id);

                if (allKlaviyoIds.length === 0) {
                    console.log('No Klaviyo integrations found');
                    setAllRecentCampaigns([]);
                    setLoadingCampaigns(false);
                    return;
                }

                // Calculate date range (past 14 days)
                const now = new Date();
                const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

                const params = new URLSearchParams({
                    startDate: fourteenDaysAgo.toISOString(),
                    endDate: now.toISOString(),
                    storeIds: allKlaviyoIds.join(',')  // Always use ALL klaviyo IDs
                });

                const response = await fetch(`/api/calendar/campaigns?${params}`);
                if (response.ok) {
                    const { campaigns } = await response.json();
                    console.log(`Fetched ${campaigns?.length || 0} recent campaigns from ALL stores`);

                    // Map campaigns and add store information
                    const campaignsWithStoreInfo = (campaigns || []).map(campaign => {
                        // Find the store that matches this campaign's klaviyo_public_id
                        const matchingStore = stores.find(s =>
                            s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                        );

                        return {
                            ...campaign,
                            store_public_id: matchingStore?.public_id || campaign.store_public_ids?.[0],
                            store_name: matchingStore?.name || campaign.storeName || 'Unknown Store'
                        };
                    });

                    setAllRecentCampaigns(campaignsWithStoreInfo);
                } else {
                    console.error('Failed to fetch recent campaigns:', response.status);
                    setAllRecentCampaigns([]);
                }
            } catch (error) {
                console.error('Error fetching recent campaigns:', error);
                setCampaignError(error.message);
                setAllRecentCampaigns([]);
            } finally {
                setLoadingCampaigns(false);
            }
        };

        fetchRecentCampaigns();
    }, [stores]); // Only re-fetch when stores change, NOT when selected accounts change

    // Simple useEffect to fetch upcoming campaigns from ALL stores, independent of selected accounts
    useEffect(() => {
        if (!stores || stores.length === 0) {
            console.log('No stores available, skipping upcoming campaigns fetch');
            setAllUpcomingCampaigns([]);
            return;
        }

        const fetchUpcomingCampaigns = async () => {
            try {
                console.log('Fetching upcoming campaigns from ALL stores...');

                // Get ALL klaviyo IDs from ALL stores (ignore selected accounts)
                const allKlaviyoIds = stores
                    .filter(s => s.klaviyo_integration?.public_id)
                    .map(s => s.klaviyo_integration.public_id);

                if (allKlaviyoIds.length === 0) {
                    console.log('No Klaviyo integrations found');
                    setAllUpcomingCampaigns([]);
                    return;
                }

                // Calculate date range (next 30 days)
                const now = new Date();
                const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                const params = new URLSearchParams({
                    startDate: now.toISOString(),
                    endDate: thirtyDaysFromNow.toISOString(),
                    storeIds: allKlaviyoIds.join(','),  // Always use ALL klaviyo IDs
                    status: 'scheduled'
                });

                const response = await fetch(`/api/calendar/campaigns?${params}`);
                if (response.ok) {
                    const { campaigns } = await response.json();
                    console.log(`Fetched ${campaigns?.length || 0} upcoming campaigns from ALL stores`);

                    // Map campaigns and add store information
                    const campaignsWithStoreInfo = (campaigns || []).map(campaign => {
                        // Find the store that matches this campaign's klaviyo_public_id
                        const matchingStore = stores.find(s =>
                            s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                        );

                        return {
                            ...campaign,
                            store_public_id: matchingStore?.public_id || campaign.store_public_ids?.[0],
                            store_name: matchingStore?.name || campaign.storeName || 'Unknown Store'
                        };
                    });

                    setAllUpcomingCampaigns(campaignsWithStoreInfo);
                } else {
                    console.error('Failed to fetch upcoming campaigns:', response.status);
                    setAllUpcomingCampaigns([]);
                }
            } catch (error) {
                console.error('Error fetching upcoming campaigns:', error);
                setCampaignError(error.message);
                setAllUpcomingCampaigns([]);
            }
        };

        fetchUpcomingCampaigns();
    }, [stores]); // Only re-fetch when stores change, NOT when selected accounts change

    // Simple client-side filtering function
    const getFilteredCampaigns = useCallback((selectedStoreIds) => {
        if (!selectedStoreIds || selectedStoreIds.length === 0 || selectedStoreIds.includes('all')) {
            return { recent: allRecentCampaigns, upcoming: allUpcomingCampaigns };
        }

        // Get klaviyo IDs for the selected store IDs
        const selectedKlaviyoIds = stores
            .filter(s => selectedStoreIds.includes(s.public_id))
            .map(s => s.klaviyo_integration?.public_id)
            .filter(Boolean);

        const filteredRecent = allRecentCampaigns.filter(campaign =>
            selectedKlaviyoIds.includes(campaign.klaviyo_public_id)
        );

        const filteredUpcoming = allUpcomingCampaigns.filter(campaign =>
            selectedKlaviyoIds.includes(campaign.klaviyo_public_id)
        );

        return { recent: filteredRecent, upcoming: filteredUpcoming };
    }, [allRecentCampaigns, allUpcomingCampaigns, stores]);

    // Memoize klaviyo IDs to prevent recalculation
    const klaviyoIds = useMemo(() => {
        if (!stores || stores.length === 0) return [];

        return storeIds
            ? stores
                .filter(s => storeIds.includes(s.public_id) && s.klaviyo_integration?.public_id)
                .map(s => s.klaviyo_integration.public_id)
            : stores
                .filter(s => s.klaviyo_integration?.public_id)
                .map(s => s.klaviyo_integration.public_id);
    }, [stores, storeIds]);

    // Create a stable reference for klaviyo IDs to prevent unnecessary re-fetches
    const klaviyoIdsString = JSON.stringify(klaviyoIds.sort());

    // Create stable reference for selectedAccounts to prevent infinite re-renders
    const selectedAccountsString = useMemo(() =>
        JSON.stringify(selectedAccounts?.map(acc => acc.value).sort() || []),
        [selectedAccounts]
    );

    // Filter campaigns based ONLY on the individual card dropdowns, NOT the main account selector
    const { recentCampaigns, upcomingCampaigns, totalRecentCampaigns } = useMemo(() => {
        // If no campaigns loaded yet, return empty arrays
        if (!allRecentCampaigns || !allUpcomingCampaigns) {
            return {
                recentCampaigns: [],
                upcomingCampaigns: [],
                totalRecentCampaigns: 0
            };
        }

        // Start with ALL campaigns - ignore the main account selector completely
        let recentFiltered = allRecentCampaigns;
        let upcomingFiltered = allUpcomingCampaigns;

        // Only filter by the individual card dropdown selections
        if (selectedCampaignStore !== 'all') {
            // Get the klaviyo ID for the selected store
            const selectedStore = stores.find(s => s.public_id === selectedCampaignStore);
            const klaviyoId = selectedStore?.klaviyo_integration?.public_id;

            recentFiltered = allRecentCampaigns.filter(campaign =>
                campaign.klaviyo_public_id === klaviyoId
            );
        }

        if (selectedUpcomingStore !== 'all') {
            // Get the klaviyo ID for the selected store
            const selectedStore = stores.find(s => s.public_id === selectedUpcomingStore);
            const klaviyoId = selectedStore?.klaviyo_integration?.public_id;

            upcomingFiltered = allUpcomingCampaigns.filter(campaign =>
                campaign.klaviyo_public_id === klaviyoId
            );
        }

        return {
            recentCampaigns: recentFiltered,
            upcomingCampaigns: upcomingFiltered.slice(0, 10), // Limit upcoming to 10
            totalRecentCampaigns: recentFiltered.length
        };
    }, [
        allRecentCampaigns,
        allUpcomingCampaigns,
        selectedCampaignStore,
        selectedUpcomingStore,
        stores
    ]);

    // Campaign data is now handled by the useCampaignData hook above with smart caching
    // This eliminates the need for re-fetching campaigns when filters change

    // Old campaign fetching useEffect removed - using smart caching instead
    /*useEffect(() => {
        // Create abort controller for this effect
        const abortController = new AbortController();
        let isMounted = true;

        const fetchCampaigns = async () => {
            if (klaviyoIds.length === 0 || stores.length === 0) {
                setRecentCampaigns([]);
                setUpcomingCampaigns([]);
                return;
            }

            setLoadingCampaigns(true);
            try {

                const now = new Date();
                const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                // Fetch recent campaigns from the calendar endpoint (historical)
                const params = new URLSearchParams({
                    startDate: fourteenDaysAgo.toISOString(),
                    endDate: now.toISOString(),  // Only fetch up to now for recent campaigns
                    storeIds: klaviyoIds.join(',')
                });

                let response;
                try {
                    response = await fetch(`/api/calendar/campaigns?${params}`, {
                        signal: abortController.signal
                    });
                } catch (err) {
                    // Handle abort silently
                    if (err.name === 'AbortError' || !isMounted) {
                        return;
                    }
                    throw err;
                }
                if (!isMounted) return; // Exit if component unmounted
                if (response.ok) {
                    const { campaigns } = await response.json();

                    console.log('📧 Dashboard campaign data sample:', campaigns.slice(0, 2));

                    // Split campaigns into recent and upcoming based on send_time
                    const recent = [];
                    const upcoming = [];

                    campaigns.forEach(campaign => {
                        const sendTime = new Date(campaign.date || campaign.send_time || campaign.scheduled_at);

                        // Find store name - try multiple approaches
                        // 1. First try to match by store_public_ids array (from MongoDB)
                        let campaignStore = null;
                        const storePublicId = campaign.store_public_ids?.[0] || campaign.storeIds?.[0];
                        if (storePublicId) {
                            campaignStore = stores?.find(s => s.public_id === storePublicId);
                        }

                        // 2. If not found, try to match by klaviyo_public_id
                        if (!campaignStore && campaign.klaviyo_public_id) {
                            campaignStore = stores?.find(s =>
                                s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
                            );
                        }

                        // Debug logging for first few campaigns
                        if ((recent.length + upcoming.length) < 2) {
                            console.log('🏪 Store matching debug:', {
                                campaign_name: campaign.name || campaign.campaign_name,
                                store_public_ids: campaign.store_public_ids,
                                klaviyo_public_id: campaign.klaviyo_public_id,
                                found_store: campaignStore?.name,
                                available_stores: stores?.map(s => ({
                                    name: s.name,
                                    public_id: s.public_id,
                                    klaviyo_id: s.klaviyo_integration?.public_id
                                }))
                            });
                        }

                        // Map campaign data to match dashboard format and include all fields needed for modal
                        const mappedCampaign = {
                            // Basic info
                            id: campaign.campaignId || campaign.id || campaign._id,
                            campaignId: campaign.campaignId || campaign.id,
                            messageId: campaign.messageId || campaign.groupings?.campaign_message_id,
                            name: campaign.name || campaign.campaign_name || 'Unnamed Campaign',
                            subject: campaign.subject || campaign.subject_line || '',
                            channel: campaign.channel || campaign.groupings?.send_channel || 'email',
                            send_date: campaign.date || campaign.send_time || campaign.scheduled_at,

                            // Store info - use the found store or fallback values
                            store_public_id: storePublicId || campaignStore?.public_id || null,
                            store_name: campaignStore?.name || campaign.storeName || 'Unknown Store',
                            klaviyo_public_id: campaign.klaviyo_public_id,

                            // Preserve groupings for modal preview
                            groupings: campaign.groupings,

                            // Performance metrics (for modal display)
                            recipients: campaign.performance?.recipients || campaign.statistics?.recipients || 0,
                            delivered: campaign.performance?.delivered || campaign.statistics?.delivered || campaign.performance?.recipients || 0,
                            opensUnique: campaign.performance?.opensUnique || campaign.statistics?.opens_unique || 0,
                            clicksUnique: campaign.performance?.clicksUnique || campaign.statistics?.clicks_unique || 0,
                            conversions: campaign.performance?.conversions || campaign.statistics?.conversions || 0,
                            revenue: campaign.performance?.revenue || campaign.statistics?.conversion_value || 0,

                            // Rates
                            openRate: campaign.performance?.openRate || campaign.statistics?.open_rate || 0,
                            clickRate: campaign.performance?.clickRate || campaign.statistics?.click_rate || 0,
                            conversionRate: campaign.performance?.conversionRate || campaign.statistics?.conversion_rate || 0,
                            clickToOpenRate: campaign.performance?.clickToOpenRate || campaign.statistics?.click_to_open_rate || 0,

                            // Additional metrics
                            bounced: campaign.performance?.bounced || campaign.statistics?.bounced || 0,
                            unsubscribes: campaign.performance?.unsubscribes || campaign.statistics?.unsubscribes || 0,
                            spamComplaints: campaign.performance?.spamComplaints || campaign.statistics?.spam_complaints || 0,

                            // Other info
                            tags: campaign.tags || [],
                            fromAddress: campaign.fromAddress || campaign.from_address || '',
                            estimated_recipients: campaign.performance?.recipients || campaign.statistics?.recipients || 0
                        };

                        // Debug log the first few campaigns
                        if ((recent.length + upcoming.length) < 3) {
                            console.log('🔍 Mapped campaign:', {
                                original_name: campaign.name,
                                original_campaign_name: campaign.campaign_name,
                                mapped_name: mappedCampaign.name,
                                channel: mappedCampaign.channel
                            });
                        }

                        // Only add to recent campaigns (past campaigns)
                        if (sendTime <= now) {
                            recent.push(mappedCampaign);
                        }
                    });

                    // Sort recent by most recent first
                    recent.sort((a, b) => new Date(b.send_date) - new Date(a.send_date));
                    setRecentCampaigns(recent);
                    setTotalRecentCampaigns(recent.length);
                }

                // Fetch upcoming SCHEDULED campaigns from the API endpoint
                try {
                    // Prepare store IDs for the API call - need to pass klaviyo_public_ids
                    let storeIdsParam = 'all';
                    if (selectedAccounts?.[0]?.value !== 'all' && selectedAccounts?.length > 0) {
                        const selectedStorePublicIds = selectedAccounts.map(acc => acc.value).filter(v => !v.startsWith('tag:'));
                        // Convert store public_ids to klaviyo_public_ids
                        const selectedKlaviyoIds = stores
                            .filter(s => selectedStorePublicIds.includes(s.public_id))
                            .map(s => s.klaviyo_integration?.public_id)
                            .filter(Boolean);
                        storeIdsParam = selectedKlaviyoIds.join(',');
                    }

                    // Fetch scheduled campaigns from the calendar endpoint with status filter
                    const scheduledParams = new URLSearchParams({
                        startDate: now.toISOString(),
                        endDate: thirtyDaysFromNow.toISOString(),
                        storeIds: storeIdsParam,
                        status: 'scheduled' // Only get scheduled campaigns for upcoming section
                    });

                    console.log('📅 Fetching scheduled campaigns with params:', {
                        startDate: now.toISOString(),
                        endDate: thirtyDaysFromNow.toISOString(),
                        storeIds: storeIdsParam,
                        selectedAccounts,
                        stores: stores?.map(s => ({ name: s.name, public_id: s.public_id, klaviyo_id: s.klaviyo_integration?.public_id }))
                    });

                    let scheduledResponse;
                    try {
                        scheduledResponse = await fetch(`/api/calendar/campaigns?${scheduledParams}`, {
                            signal: abortController.signal
                        });
                    } catch (err) {
                        // Handle abort silently
                        if (err.name === 'AbortError' || !isMounted) {
                            return;
                        }
                        throw err;
                    }
                    if (!isMounted) return; // Exit if component unmounted
                    if (scheduledResponse.ok) {
                        const { campaigns: scheduledCampaigns, scheduled, historical } = await scheduledResponse.json();

                        console.log(`📅 API Response: Found ${scheduledCampaigns?.length || 0} total campaigns (${scheduled || 0} scheduled, ${historical || 0} historical)`);

                        if (scheduledCampaigns?.length > 0) {
                            console.log('📅 Sample scheduled campaigns:', scheduledCampaigns.slice(0, 2).map(c => ({
                                name: c.name,
                                date: c.date,
                                status: c.status,
                                klaviyo_public_id: c.klaviyo_public_id,
                                store_public_ids: c.store_public_ids
                            })));
                        }

                        // Map the scheduled campaigns to the format needed for display
                        const upcoming = scheduledCampaigns.map(campaign => ({
                            id: campaign.id,
                            campaignId: campaign.campaignId,
                            messageId: campaign.messageId,
                            name: campaign.name,
                            subject: campaign.subject,
                            channel: campaign.channel,
                            send_date: campaign.date,
                            status: campaign.status || 'scheduled',

                            // Store info
                            store_public_id: campaign.store_public_ids?.[0],
                            store_name: campaign.storeName || campaign.store_name || 'Unknown Store',
                            klaviyo_public_id: campaign.klaviyo_public_id,

                            // Metrics (empty for scheduled)
                            recipients: campaign.performance?.recipients || 0,
                            estimated_recipients: campaign.estimated_recipients || campaign.performance?.recipients || 0,
                            delivered: 0,
                            opensUnique: 0,
                            clicksUnique: 0,
                            conversions: 0,
                            revenue: 0,

                            // Other info
                            tags: campaign.tags || [],
                            fromAddress: campaign.fromAddress || '',
                        }));

                        // Sort upcoming by soonest first, limit to 10
                        upcoming.sort((a, b) => new Date(a.send_date) - new Date(b.send_date));
                        setUpcomingCampaigns(upcoming.slice(0, 10));
                    } else {
                        console.error('Failed to fetch scheduled campaigns');
                        setUpcomingCampaigns([]);
                    }

                } catch (error) {
                    console.error('Error fetching scheduled campaigns:', error);
                    setUpcomingCampaigns([]);
                }
            } catch (error) {
                // Only log errors if not aborted
                if (error.name !== 'AbortError' && isMounted) {
                    console.error('Error fetching campaigns:', error);
                    setRecentCampaigns([]);
                    setUpcomingCampaigns([]);
                }
            } finally {
                if (isMounted) {
                    setLoadingCampaigns(false);
                }
            }
        };

        fetchCampaigns();

        // Cleanup function
        return () => {
            isMounted = false;
            // Don't abort - just mark as unmounted
            // This prevents uncaught promise rejections
        };
    }, [klaviyoIdsString, stores, selectedAccountsString]); */

    // Process the fetched data
    useEffect(() => {
        if (data) {
            try {

                // Debug the data structure
                console.log('Dashboard data received:', {
                    hasTimeSeries: !!data.timeSeries,
                    timeSeriesLength: data.timeSeries?.length,
                    hasPerformanceOverTime: !!data.performanceOverTime,
                    performanceOverTimeLength: data.performanceOverTime?.length,
                    firstTimeSeriesItem: data.timeSeries?.[0],
                    firstPerformanceItem: data.performanceOverTime?.[0],
                    rawData: data
                });

                // Process dashboard data
                const processedData = {
                    // KPI Metrics from ClickHouse
                    overallRevenue: data.summary?.totalRevenue || 0,
                    attributedRevenue: data.summary?.attributedRevenue || 0,
                    totalOrders: data.summary?.totalOrders || 0,
                    uniqueCustomers: data.summary?.uniqueCustomers || 0,

                    // Changes from comparison period
                    revenueChange: data.summary?.revenueChange || 0,
                    attributedRevenueChange: data.summary?.attributedRevenueChange,
                    ordersChange: data.summary?.ordersChange || 0,
                    customersChange: data.summary?.customersChange || 0,
                    avgOrderValueChange: data.summary?.avgOrderValueChange,
                    newCustomersChange: data.summary?.newCustomersChange,

                    // Additional metrics
                    avgOrderValue: data.summary?.avgOrderValue || 0,
                    newCustomers: data.summary?.newCustomers || 0,
                    returningCustomers: data.summary?.returningCustomers || 0,

                    // Revenue by account (for bar chart) - already sorted and limited
                    revenueByAccount: data.byAccount?.slice(0, 5) || [],

                    // Use performanceOverTime if available, otherwise fall back to timeSeries
                    performanceOverTime: (data.performanceOverTime || data.timeSeries || []).map(point => ({
                        ...point,
                        // Ensure the date field exists and is properly formatted
                        date: point.date || new Date().toISOString().split('T')[0],
                        // All the metrics from the API - keep original field names
                        revenue: parseFloat(point.revenue) || 0,
                        campaignRevenue: parseFloat(point.campaignRevenue) || 0,
                        flowRevenue: parseFloat(point.flowRevenue) || 0,
                        emailRevenue: parseFloat(point.emailRevenue) || 0,
                        smsRevenue: parseFloat(point.smsRevenue) || 0,
                        orders: parseInt(point.orders) || 0,
                        emailOrders: parseInt(point.emailOrders) || 0,
                        smsOrders: parseInt(point.smsOrders) || 0,
                        customers: parseInt(point.customers) || 0,
                        newCustomers: parseInt(point.newCustomers || point.new_customers) || 0,
                        returningCustomers: parseInt(point.returningCustomers || point.returning_customers) || 0,
                        aov: parseFloat(point.aov) || 0,
                        // Engagement metrics
                        emailsSent: parseInt(point.emailsSent) || 0,
                        smsSent: parseInt(point.smsSent) || 0,
                        recipients: parseInt(point.recipients) || 0,
                        delivered: parseInt(point.delivered) || 0,
                        opens: parseInt(point.opens) || 0,
                        clicks: parseInt(point.clicks) || 0,
                        conversions: parseInt(point.conversions) || 0,
                        // Revenue efficiency
                        revenuePerEmail: parseFloat(point.revenuePerEmail) || 0,
                        revenuePerSms: parseFloat(point.revenuePerSms) || 0,
                        revenuePerRecipient: parseFloat(point.revenuePerRecipient) || 0,
                        // Rates and percentages
                        openRate: parseFloat(point.openRate) || 0,
                        clickRate: parseFloat(point.clickRate) || 0,
                        ctor: parseFloat(point.ctor) || 0,
                        conversionRate: parseFloat(point.conversionRate) || 0,
                        bounceRate: parseFloat(point.bounceRate) || 0,
                        unsubscribeRate: parseFloat(point.unsubscribeRate) || 0,
                        // Flow metrics (if available)
                        activeFlows: parseInt(point.activeFlows) || 0,
                        flowRecipients: parseInt(point.flowRecipients) || 0,
                        flowOpens: parseInt(point.flowOpens) || 0,
                        flowClicks: parseInt(point.flowClicks) || 0,
                        flowConversions: parseInt(point.flowConversions) || 0,
                        // Campaign metrics
                        campaignsSent: parseInt(point.campaignsSent) || 0
                    }))
                }

                // Process performance data to include account-specific metrics if available
                if (processedData.revenueByAccount.length > 0 && processedData.performanceOverTime.length > 0) {
                    // Add account-specific data for multi-line charts
                    processedData.performanceOverTime = processedData.performanceOverTime.map(day => {
                        const dayData = { ...day }
                        // Add placeholder account data for by-account view
                        processedData.revenueByAccount.forEach(account => {
                            // Create dynamic fields for each metric type
                            dayData[`${account.name}_revenue`] = day.revenue * (Math.random() * 0.3 + 0.1)
                            dayData[`${account.name}_campaignRevenue`] = day.campaignRevenue * (Math.random() * 0.3 + 0.1)
                            dayData[`${account.name}_flowRevenue`] = day.flowRevenue * (Math.random() * 0.3 + 0.1)
                            dayData[`${account.name}_emailRevenue`] = day.emailRevenue * (Math.random() * 0.3 + 0.1)
                            dayData[`${account.name}_smsRevenue`] = day.smsRevenue * (Math.random() * 0.3 + 0.1)
                            dayData[`${account.name}_orders`] = Math.floor(day.orders * (Math.random() * 0.3 + 0.1))
                            dayData[`${account.name}_customers`] = Math.floor(day.customers * (Math.random() * 0.3 + 0.1))
                            dayData[`${account.name}_newCustomers`] = Math.floor(day.newCustomers * (Math.random() * 0.3 + 0.1))
                            dayData[`${account.name}_returningCustomers`] = Math.floor(day.returningCustomers * (Math.random() * 0.3 + 0.1))
                            dayData[`${account.name}_aov`] = day.aov * (Math.random() * 0.2 + 0.9)
                            dayData[`${account.name}_revenuePerRecipient`] = day.revenuePerRecipient * (Math.random() * 0.2 + 0.9)
                            dayData[`${account.name}_revenuePerEmail`] = day.revenuePerEmail * (Math.random() * 0.2 + 0.9)
                            dayData[`${account.name}_revenuePerSms`] = day.revenuePerSms * (Math.random() * 0.2 + 0.9)
                            dayData[`${account.name}_openRate`] = day.openRate * (Math.random() * 0.2 + 0.9)
                            dayData[`${account.name}_clickRate`] = day.clickRate * (Math.random() * 0.2 + 0.9)
                            dayData[`${account.name}_ctor`] = day.ctor * (Math.random() * 0.2 + 0.9)
                            dayData[`${account.name}_recipients`] = Math.floor(day.recipients * (Math.random() * 0.3 + 0.1))
                            dayData[`${account.name}_opens`] = Math.floor(day.opens * (Math.random() * 0.3 + 0.1))
                            dayData[`${account.name}_clicks`] = Math.floor(day.clicks * (Math.random() * 0.3 + 0.1))
                        })
                        return dayData
                    })
                }

                // Debug log to check the processed data
                console.log('Processed performance data sample:', {
                    totalPoints: processedData.performanceOverTime.length,
                    firstPoint: processedData.performanceOverTime[0],
                    accountNames: processedData.revenueByAccount.map(a => a.name)
                });

                setDashboardData(processedData)

                // Campaign data is now handled by the useCampaignData hook with smart caching
                // No need to set campaign data here - it comes from the hook
                
                // Update AI context
                updateAIState({
                    currentPage: "dashboard",
                    pageTitle: "Dashboard Overview",
                    data: {
                        totalRecords: data.campaigns?.length || 0,
                        dateRange: `${dateRangeSelection?.ranges?.main?.start || 'N/A'} - ${dateRangeSelection?.ranges?.main?.end || 'N/A'}`,
                        trends: {
                            revenueChange: data.summary?.revenueChange || 0,
                            ordersChange: data.summary?.ordersChange || 0,
                            customersChange: data.summary?.customersChange || 0
                        }
                    },
                    metrics: {
                        totalRevenue: processedData.overallRevenue,
                        attributedRevenue: processedData.attributedRevenue,
                        totalOrders: processedData.totalOrders,
                        uniqueCustomers: processedData.uniqueCustomers
                    },
                    filters: {
                        accounts: selectedAccounts?.map(a => a.label).join(', ') || 'All Accounts',
                        dateRange: dateRangeSelection?.label || 'Past 90 days'
                    },
                    insights: [
                        `Revenue ${data.summary?.revenueChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(data.summary?.revenueChange || 0)}%`,
                        `${processedData.uniqueCustomers} unique customers generated ${formatCurrency(processedData.overallRevenue)} in revenue`,
                        `Average order value: ${formatCurrency(processedData.overallRevenue / (processedData.totalOrders || 1))}`
                    ]
                })
                
            } catch (err) {
                console.error('Error processing dashboard data:', err)

                // Use mock data for development
                const topStores = stores?.slice(0, 5).map((store, idx) => ({
                    name: store.name,
                    revenue: Math.random() * 50000 + 10000
                })).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || []
                
                const mockData = {
                    overallRevenue: 125430,
                    attributedRevenue: 87500,
                    totalOrders: 342,
                    uniqueCustomers: 289,
                    revenueChange: 12.5,
                    ordersChange: 8.3,
                    customersChange: 15.2,
                    revenueByAccount: topStores,
                    performanceOverTime: Array.from({ length: 30 }, (_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() - (29 - i))
                        const opens = Math.floor(Math.random() * 1000 + 200)
                        const clicks = Math.floor(Math.random() * 300 + 50)
                        const recipients = Math.floor(Math.random() * 2000 + 500)
                        const conversions = Math.floor(Math.random() * 50 + 5)
                        
                        // Calculate rates
                        const openRate = (opens / recipients) * 100
                        const clickRate = (clicks / recipients) * 100
                        const ctor = opens > 0 ? (clicks / opens) * 100 : 0
                        const conversionRate = (conversions / recipients) * 100
                        
                        // Create data for each account
                        const accountData = {}
                        topStores.forEach(store => {
                            accountData[`${store.name}_revenue`] = Math.random() * 2000 + 500
                            accountData[`${store.name}_openRate`] = Math.random() * 20 + 15
                            accountData[`${store.name}_clickRate`] = Math.random() * 8 + 2
                            accountData[`${store.name}_ctor`] = Math.random() * 30 + 10
                        })
                        
                        return {
                            date: date.toISOString().split('T')[0], // Use YYYY-MM-DD format
                            revenue: Math.random() * 5000 + 2000,
                            orders: Math.floor(Math.random() * 20 + 5),
                            opens,
                            clicks,
                            openRate,
                            clickRate,
                            ctor,
                            conversionRate,
                            recipients,
                            conversions,
                            bounceRate: Math.random() * 5,
                            unsubscribeRate: Math.random() * 0.5,
                            revenuePerRecipient: Math.random() * 10 + 1,
                            avgOrderValue: Math.random() * 100 + 50,
                            ...accountData
                        }
                    })
                }
                
                setDashboardData(mockData)

                // Remove mock campaign data - it causes a flash between mock and real data
                // The real campaign data will be fetched via the useEffect that watches klaviyoIdsString
            }
        } else {
            // Clear data when no data is available
            setDashboardData(null)
            // Campaign data is handled by useCampaignData hook - no need to clear here
        }
    }, [data, stores, updateAIState, dateRangeSelection, selectedAccountsString])

    // Show loading spinner while fetching data OR if we have no data yet
    // Show loading spinner if:
    // 1. Data is being loaded (isLoading is true)
    // 2. Stores haven't been loaded yet (!stores or empty)
    // 3. Dashboard data doesn't exist AND we have valid store IDs to load
    if (isLoading || !stores || stores.length === 0 || (!dashboardData && storeIds && storeIds.length > 0)) {
        return (
            <div className="flex items-center justify-center h-96">
                <MorphingLoader size="large" showText={true} text="Loading dashboard..." />
            </div>
        )
    }

    // Show "No stores selected" message only when:
    // - Stores have been fully loaded (stores exist and have length > 0)
    // - No store IDs are selected (empty or null)
    // - We're not in any loading state
    if (stores && stores.length > 0 && (!storeIds || storeIds.length === 0) && !isLoading) {
        return (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                No stores selected
            </div>
        )
    }

    // Show error message if data fetching failed
    if (error && !dashboardData) {
        return (
            <div className="text-center py-12 text-red-600 dark:text-red-400">
                Error loading dashboard data: {error.message || 'Unknown error'}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards - First Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Overall Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Overall Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboardData.overallRevenue)}</div>
                        {dashboardData.revenueChange !== null && dashboardData.revenueChange !== undefined ? (
                            <p className={`text-xs flex items-center gap-1 ${dashboardData.revenueChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {dashboardData.revenueChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {Math.abs(dashboardData.revenueChange).toFixed(1)}% from last period
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                        )}
                    </CardContent>
                </Card>

                {/* Attributed Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Attributed Revenue</CardTitle>
                        <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(dashboardData.attributedRevenue)}</div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formatPercentage((dashboardData.attributedRevenue / dashboardData.overallRevenue) * 100)} of total
                            </span>
                        </div>
                        {dashboardData.attributedRevenueChange !== null && dashboardData.attributedRevenueChange !== undefined ? (
                            <p className={`text-xs flex items-center gap-1 ${dashboardData.attributedRevenueChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {dashboardData.attributedRevenueChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {Math.abs(dashboardData.attributedRevenueChange).toFixed(1)}% from last period
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                        )}
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(dashboardData.totalOrders)}</div>
                        {dashboardData.ordersChange !== null && dashboardData.ordersChange !== undefined ? (
                            <p className={`text-xs flex items-center gap-1 ${dashboardData.ordersChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {dashboardData.ordersChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {Math.abs(dashboardData.ordersChange).toFixed(1)}% from last period
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                        )}
                    </CardContent>
                </Card>

                {/* Unique Customers */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Unique Customers</CardTitle>
                        <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(dashboardData.uniqueCustomers)}</div>
                        {dashboardData.customersChange !== null && dashboardData.customersChange !== undefined ? (
                            <p className={`text-xs flex items-center gap-1 ${dashboardData.customersChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {dashboardData.customersChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {Math.abs(dashboardData.customersChange).toFixed(1)}% from last period
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* KPI Cards - Second Row (Additional Metrics) */}
            {dashboardData.avgOrderValue !== undefined && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Average Order Value */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Order Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(dashboardData.avgOrderValue)}
                            </div>
                            {dashboardData.avgOrderValueChange !== null && dashboardData.avgOrderValueChange !== undefined ? (
                                <p className={`text-xs flex items-center gap-1 ${dashboardData.avgOrderValueChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {dashboardData.avgOrderValueChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {Math.abs(dashboardData.avgOrderValueChange).toFixed(1)}% from last period
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* New Customers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">New Customers</CardTitle>
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatNumber(dashboardData.newCustomers || 0)}
                            </div>
                            {dashboardData.newCustomersChange !== null && dashboardData.newCustomersChange !== undefined ? (
                                <p className={`text-xs flex items-center gap-1 ${dashboardData.newCustomersChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {dashboardData.newCustomersChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {Math.abs(dashboardData.newCustomersChange).toFixed(1)}% from last period
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Returning Customers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Returning Customers</CardTitle>
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatNumber(dashboardData.returningCustomers || 0)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {dashboardData.returningCustomers && dashboardData.uniqueCustomers
                                    ? formatPercentage((dashboardData.returningCustomers / dashboardData.uniqueCustomers) * 100)
                                    : '0%'} of total
                            </p>
                        </CardContent>
                    </Card>

                    {/* Repeat Customer Rate */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Repeat Rate</CardTitle>
                            <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {dashboardData.returningCustomers && dashboardData.uniqueCustomers
                                    ? formatPercentage((dashboardData.returningCustomers / dashboardData.uniqueCustomers) * 100)
                                    : '0%'}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Customers who ordered again
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Top 5 Revenue by Client Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Revenue by Client</CardTitle>
                        <CardDescription>Highest performing accounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dashboardData.revenueByAccount}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                                />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#60A5FA" radius={[4, 4, 0, 0]}>
                                    {dashboardData.revenueByAccount.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Performance Over Time Line Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Performance</CardTitle>
                                <CardDescription>
                                    {performanceView === 'by-account' ? 'Comparison by account' : 'Aggregate trends over time'}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-32">
                                    <Select
                                        value={{ 
                                            value: performanceView,
                                            label: performanceView === 'aggregate' ? 'Aggregate' : 'By Account'
                                        }}
                                        onChange={(option) => setPerformanceView(option.value)}
                                        options={[
                                            { value: 'aggregate', label: 'Aggregate' },
                                            { value: 'by-account', label: 'By Account' }
                                        ]}
                                        styles={currentSelectStyles}
                                        isSearchable={false}
                                    />
                                </div>
                                <div className="w-44">
                                    <Select
                                        value={{
                                            value: performanceMetric,
                                            label: {
                                                'revenue': 'Total Revenue',
                                                'campaignRevenue': 'Campaign Revenue',
                                                'flowRevenue': 'Flow Revenue',
                                                'emailRevenue': 'Email Revenue',
                                                'smsRevenue': 'SMS Revenue',
                                                'orders': 'Orders',
                                                'aov': 'Average Order Value',
                                                'revenuePerRecipient': 'Revenue per Recipient',
                                                'revenuePerEmail': 'Revenue per Email',
                                                'revenuePerSms': 'Revenue per SMS',
                                                'customers': 'Total Customers',
                                                'newCustomers': 'New Customers',
                                                'returningCustomers': 'Returning Customers',
                                                'campaignsSent': 'Campaigns Sent',
                                                'emailCampaigns': 'Email Campaigns',
                                                'smsCampaigns': 'SMS Campaigns',
                                                'recipients': 'Recipients',
                                                'delivered': 'Delivered',
                                                'activeFlows': 'Active Flows',
                                                'flowRecipients': 'Flow Recipients',
                                                'opens': 'Opens',
                                                'clicks': 'Clicks',
                                                'conversions': 'Conversions',
                                                'flowOpens': 'Flow Opens',
                                                'flowClicks': 'Flow Clicks',
                                                'flowConversions': 'Flow Conversions',
                                                'openRate': 'Open Rate %',
                                                'clickRate': 'Click Rate %',
                                                'ctor': 'Click-to-Open Rate %',
                                                'conversionRate': 'Conversion Rate %',
                                                'bounceRate': 'Bounce Rate %',
                                                'unsubscribeRate': 'Unsubscribe Rate %'
                                            }[performanceMetric] || 'Total Revenue'
                                        }}
                                        onChange={(option) => setPerformanceMetric(option.value)}
                                        options={[
                                            // Revenue & Order Metrics
                                            { value: 'revenue', label: 'Total Revenue' },
                                            { value: 'campaignRevenue', label: 'Campaign Revenue' },
                                            { value: 'flowRevenue', label: 'Flow Revenue' },
                                            { value: 'emailRevenue', label: 'Email Revenue' },
                                            { value: 'smsRevenue', label: 'SMS Revenue' },
                                            { value: 'orders', label: 'Orders' },
                                            { value: 'aov', label: 'Average Order Value' },
                                            { value: 'revenuePerRecipient', label: 'Revenue per Recipient' },
                                            { value: 'revenuePerEmail', label: 'Revenue per Email' },
                                            { value: 'revenuePerSms', label: 'Revenue per SMS' },
                                            // Customer Metrics
                                            { value: 'customers', label: 'Total Customers' },
                                            { value: 'newCustomers', label: 'New Customers' },
                                            { value: 'returningCustomers', label: 'Returning Customers' },
                                            // Campaign Volume Metrics
                                            { value: 'campaignsSent', label: 'Campaigns Sent' },
                                            { value: 'emailCampaigns', label: 'Email Campaigns' },
                                            { value: 'smsCampaigns', label: 'SMS Campaigns' },
                                            { value: 'recipients', label: 'Recipients' },
                                            { value: 'delivered', label: 'Delivered' },
                                            { value: 'activeFlows', label: 'Active Flows' },
                                            { value: 'flowRecipients', label: 'Flow Recipients' },
                                            // Engagement Metrics
                                            { value: 'opens', label: 'Opens' },
                                            { value: 'clicks', label: 'Clicks' },
                                            { value: 'conversions', label: 'Conversions' },
                                            { value: 'flowOpens', label: 'Flow Opens' },
                                            { value: 'flowClicks', label: 'Flow Clicks' },
                                            { value: 'flowConversions', label: 'Flow Conversions' },
                                            // Rate Metrics
                                            { value: 'openRate', label: 'Open Rate %' },
                                            { value: 'clickRate', label: 'Click Rate %' },
                                            { value: 'ctor', label: 'Click-to-Open Rate %' },
                                            { value: 'conversionRate', label: 'Conversion Rate %' },
                                            { value: 'bounceRate', label: 'Bounce Rate %' },
                                            { value: 'unsubscribeRate', label: 'Unsubscribe Rate %' }
                                        ]}
                                        styles={{
                                            ...currentSelectStyles,
                                            option: (provided, state) => ({
                                                ...currentSelectStyles.option(provided, state),
                                                fontSize: '0.875rem',
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                margin: '2px 0',
                                                backgroundColor: state.isSelected
                                                    ? '#60A5FA'
                                                    : state.isFocused
                                                        ? '#E0F2FE'
                                                        : 'transparent',
                                                color: state.isSelected ? 'white' : '#1f2937',
                                                cursor: 'pointer',
                                                '&:active': {
                                                    backgroundColor: state.isSelected ? '#2563EB' : '#BFDBFE'
                                                }
                                            }),
                                            menu: (provided) => ({
                                                ...currentSelectStyles.menu(provided),
                                                maxHeight: '400px',
                                                overflowY: 'auto'
                                            }),
                                            menuList: (provided) => ({
                                                ...currentSelectStyles.menuList(provided),
                                                padding: '6px',
                                                maxHeight: '380px'
                                            }),
                                            control: (provided, state) => ({
                                                ...currentSelectStyles.control(provided, state),
                                                minHeight: '38px',
                                                fontSize: '0.875rem'
                                            }),
                                            singleValue: (provided) => ({
                                                ...currentSelectStyles.singleValue(provided),
                                                fontSize: '0.875rem',
                                                fontWeight: '500'
                                            })
                                        }}
                                        isSearchable={false}
                                        placeholder="Select metric"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dashboardData.performanceOverTime}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        // Currency metrics
                                        if (['revenue', 'campaignRevenue', 'flowRevenue', 'emailRevenue', 'smsRevenue', 'revenuePerRecipient', 'revenuePerEmail', 'revenuePerSms', 'aov'].includes(performanceMetric)) {
                                            return formatCurrency(value).replace('$', '')
                                        }
                                        // Percentage metrics
                                        else if (performanceMetric.includes('Rate') || performanceMetric === 'ctor') {
                                            return `${value.toFixed(1)}%`
                                        }
                                        // Number metrics
                                        else {
                                            return formatNumber(value)
                                        }
                                    }}
                                />
                                <Tooltip 
                                    formatter={(value) => {
                                        // Currency metrics
                                        if (['revenue', 'campaignRevenue', 'flowRevenue', 'emailRevenue', 'smsRevenue', 'revenuePerRecipient', 'revenuePerEmail', 'revenuePerSms', 'aov'].includes(performanceMetric)) {
                                            return formatCurrency(value)
                                        }
                                        // Percentage metrics
                                        else if (performanceMetric.includes('Rate') || performanceMetric === 'ctor') {
                                            return `${value.toFixed(2)}%`
                                        }
                                        // Number metrics
                                        else {
                                            return formatNumber(value)
                                        }
                                    }}
                                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px'
                                    }}
                                />
                                {performanceView === 'aggregate' ? (
                                    <Line 
                                        type="monotone" 
                                        dataKey={performanceMetric}
                                        stroke={
                                            // Revenue metrics - Purple
                                            ['revenue', 'campaignRevenue', 'flowRevenue', 'emailRevenue', 'smsRevenue', 'aov', 'revenuePerRecipient', 'revenuePerEmail', 'revenuePerSms'].includes(performanceMetric) ? '#8B5CF6' :
                                            // Order metrics - Green
                                            performanceMetric === 'orders' ? '#10B981' :
                                            // Customer metrics - Cyan
                                            ['customers', 'newCustomers', 'returningCustomers'].includes(performanceMetric) ? '#06B6D4' :
                                            // Campaign volume - Indigo
                                            ['campaignsSent', 'emailCampaigns', 'smsCampaigns', 'activeFlows'].includes(performanceMetric) ? '#6366F1' :
                                            // Recipient metrics - Sky Blue
                                            ['recipients', 'delivered', 'flowRecipients'].includes(performanceMetric) ? '#60A5FA' :
                                            // Open metrics - Blue
                                            performanceMetric.includes('open') || performanceMetric === 'openRate' || performanceMetric === 'flowOpens' ? '#3B82F6' :
                                            // Click metrics - Amber
                                            performanceMetric.includes('click') || performanceMetric === 'clickRate' || performanceMetric === 'flowClicks' ? '#F59E0B' :
                                            // CTOR - Pink
                                            performanceMetric === 'ctor' ? '#EC4899' :
                                            // Conversion metrics - Red
                                            performanceMetric.includes('conversion') || performanceMetric === 'flowConversions' ? '#EF4444' :
                                            // Bounce metrics - Rose
                                            performanceMetric.includes('bounce') ? '#F87171' :
                                            // Unsubscribe metrics - Orange
                                            performanceMetric.includes('unsubscribe') ? '#FB923C' :
                                            // Default - Teal
                                            '#14B8A6'
                                        }
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                ) : (
                                    // Multiple lines for each account
                                    dashboardData.revenueByAccount?.map((account, index) => (
                                        <Line 
                                            key={account.name}
                                            type="monotone" 
                                            dataKey={`${account.name}_${performanceMetric}`}
                                            name={account.name}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                        />
                                    ))
                                )}
                                {performanceView === 'by-account' && (
                                    <Legend 
                                        wrapperStyle={{ fontSize: '12px' }}
                                        iconType="line"
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* This section is intentionally left empty - campaigns now filter based on the main account selector */}

            {/* Campaign Lists - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Campaigns - Left Column */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Campaigns</CardTitle>
                                <CardDescription>Past 14 days campaigns</CardDescription>
                                {/* Error Messages */}
                                {isKlaviyoDown && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                        ⚠️ Klaviyo's API might be down
                                    </div>
                                )}
                                {!isKlaviyoDown && failedStores && failedStores.size > 0 && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        {Array.from(failedStores).map(klaviyoId => {
                                            const store = stores?.find(s => s.klaviyo_integration?.public_id === klaviyoId);
                                            return `Store: ${store?.name || klaviyoId} failed to fetch`;
                                        }).join(', ')}
                                    </div>
                                )}
                            </div>
                            {/* Store Filter Dropdown */}
                            <div className="w-48">
                                <Select
                                    value={{ value: selectedCampaignStore, label: selectedCampaignStore === 'all' ? 'All Stores' : stores?.find(s => s.public_id === selectedCampaignStore)?.name || 'All Stores' }}
                                    onChange={(option) => {
                                        setSelectedCampaignStore(option.value);
                                        setCampaignPage(1); // Reset to first page when filter changes
                                    }}
                                    options={[
                                        { value: 'all', label: 'All Stores' },
                                        ...(stores?.map(store => ({
                                            value: store.public_id,
                                            label: store.name
                                        })) || [])
                                    ]}
                                    className="text-sm"
                                    styles={currentSelectStyles}
                                    isSearchable={false}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loadingCampaigns ? (
                                <div className="py-8 flex flex-col items-center justify-center">
                                    <CampaignLoader />
                                </div>
                            ) : recentCampaigns
                                .slice((campaignPage - 1) * campaignsPerPage, campaignPage * campaignsPerPage)
                                .map((campaign, index) => (
                                <div
                                    key={campaign.id || `campaign-${index}`}
                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setSelectedCampaign(campaign)
                                        setModalOpen(true)
                                    }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {campaign.channel === 'email' ? (
                                                    <Mail className="h-4 w-4 text-blue-600" />
                                                ) : campaign.channel === 'sms' ? (
                                                    <MessageSquare className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Bell className="h-4 w-4 text-purple-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate flex-1">
                                                        {campaign.name}
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {campaign.store_name}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {campaign.date ? new Date(campaign.date).toLocaleDateString() : 'Date unknown'} • {formatNumber(campaign.performance?.recipients || 0)} recipients
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3 text-gray-400" />
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {formatNumber(campaign.performance?.opensUnique || 0)} opens
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MousePointer className="h-3 w-3 text-gray-400" />
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {formatNumber(campaign.performance?.clicksUnique || 0)} clicks
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3 text-gray-400" />
                                                        <span className="font-semibold text-green-600">
                                                            {formatCurrency(campaign.performance?.revenue || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loadingCampaigns && recentCampaigns.length === 0 && (
                                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                    No campaigns found in the past 14 days
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {recentCampaigns.length > campaignsPerPage && (
                            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing {((campaignPage - 1) * campaignsPerPage) + 1} to{' '}
                                    {Math.min(
                                        campaignPage * campaignsPerPage,
                                        recentCampaigns.length
                                    )}{' '}
                                    of{' '}
                                    {recentCampaigns.length}{' '}
                                    campaigns
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCampaignPage(prev => Math.max(1, prev - 1))}
                                        disabled={campaignPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCampaignPage(prev => prev + 1)}
                                        disabled={
                                            campaignPage * campaignsPerPage >=
                                            recentCampaigns.length
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Campaigns - Right Column */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Upcoming Campaigns</CardTitle>
                                {/* Error Messages */}
                                {isKlaviyoDown && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                        ⚠️ Klaviyo's API might be down
                                    </div>
                                )}
                                {!isKlaviyoDown && failedStores && failedStores.size > 0 && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        {Array.from(failedStores).map(klaviyoId => {
                                            const store = stores?.find(s => s.klaviyo_integration?.public_id === klaviyoId);
                                            return `Store: ${store?.name || klaviyoId} failed to fetch`;
                                        }).join(', ')}
                                    </div>
                                )}
                            </div>
                            {/* Store Filter Dropdown */}
                            <div className="w-48">
                                <Select
                                    value={{ value: selectedUpcomingStore, label: selectedUpcomingStore === 'all' ? 'All Stores' : stores?.find(s => s.public_id === selectedUpcomingStore)?.name || 'All Stores' }}
                                    onChange={(option) => {
                                        setSelectedUpcomingStore(option.value);
                                    }}
                                    options={[
                                        { value: 'all', label: 'All Stores' },
                                        ...(stores?.map(store => ({
                                            value: store.public_id,
                                            label: store.name
                                        })) || [])
                                    ]}
                                    className="text-sm"
                                    styles={currentSelectStyles}
                                    isSearchable={false}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loadingCampaigns ? (
                                <div className="py-8 flex flex-col items-center justify-center">
                                    <CampaignLoader />
                                </div>
                            ) : upcomingCampaigns
                                .slice(0, 10)
                                .map((campaign, index) => (
                                <div key={campaign.id || `upcoming-${index}`} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setSelectedCampaign(campaign)
                                        setModalOpen(true)
                                    }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {campaign.channel === 'email' ? (
                                                    <Mail className="h-4 w-4 text-blue-600" />
                                                ) : campaign.channel === 'sms' ? (
                                                    <MessageSquare className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Bell className="h-4 w-4 text-purple-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate flex-1">
                                                        {campaign.name}
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {campaign.store_name}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {campaign.date ? (
                                                        <>
                                                            {new Date(campaign.date).toLocaleDateString()} at {new Date(campaign.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </>
                                                    ) : 'Date unknown'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end ml-4 text-right">
                                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                {formatNumber(campaign.performance?.recipients || campaign.estimated_recipients || 0)} recipients
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {getDaysUntil(campaign.date)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loadingCampaigns && upcomingCampaigns.length === 0 && (
                                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                    No upcoming campaigns scheduled
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign Details Modal */}
            {selectedCampaign && (
                <CampaignDetailsModal
                    campaign={selectedCampaign}
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false)
                        setSelectedCampaign(null)
                    }}
                    stores={stores}
                />
            )}
        </div>
    )
}
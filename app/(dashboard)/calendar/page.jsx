'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { InlineLoading } from '@/app/components/ui/loading-spinner';
import { useCampaignData } from '@/app/contexts/campaign-data-context';
import { resetColorAssignments, getStoreColor, getColorByIndex } from '@/lib/calendar-colors';
import { cn } from '@/lib/utils';
import { CalendarHeader } from './components/CalendarHeader';
import { X, Mail, MessageSquare, Bell, Tag, Check } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { MonthView, WeekView, DayView } from './components/CalendarViews';
import { CampaignStats } from './components/CampaignStats';
import { 
  filterCampaignsByDate,
  sortCampaignsByDate,
  updateURLWithFilters,
  isCampaignScheduled 
} from './utils/calendar-helpers';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';

// Dynamically import heavy components
const EmailPreviewPanel = dynamic(
  () => import('./components/EmailPreviewPanel').then(mod => mod.EmailPreviewPanel),
  { 
    loading: () => <InlineLoading text="Loading preview..." />,
    ssr: false 
  }
);

// Will create these modal components separately
const CampaignDetailsModal = dynamic(() => import('./components/CampaignDetailsModal'), { ssr: false });
const DayCampaignsModal = dynamic(() => import('./components/DayCampaignsModal'), { ssr: false });
const CampaignComparisonModal = dynamic(() => import('./components/CampaignComparisonModal'), { ssr: false });
const NewCampaignModal = dynamic(() => import('./components/NewCampaignModal'), { ssr: false });

export default function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Use shared campaign data context
  const { getCampaignData } = useCampaignData();
  
  // Core state
  const [date, setDate] = useState(() => {
    const dateParam = searchParams.get('date');
    return dateParam ? new Date(dateParam) : new Date();
  });
  
  const [view, setView] = useState(() => searchParams.get('view') || 'month');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [futureLoading, setFutureLoading] = useState(false);
  
  // Separate state for past and future campaigns to enable parallel loading
  const [pastCampaigns, setPastCampaigns] = useState([]);
  const [futureCampaigns, setFutureCampaigns] = useState([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [futureLoadingState, setFutureLoadingState] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  
  // Filter state
  const [selectedStores, setSelectedStores] = useState(() => {
    const storesParam = searchParams.get('stores');
    return storesParam ? storesParam.split(',').filter(Boolean) : [];
  });
  
  const [selectedTags, setSelectedTags] = useState(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  });
  
  const [selectedChannels, setSelectedChannels] = useState(() => {
    const channelsParam = searchParams.get('channels');
    return channelsParam ? channelsParam.split(',').filter(Boolean) : [];
  });
  
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    const statusesParam = searchParams.get('statuses');
    return statusesParam ? statusesParam.split(',').filter(Boolean) : [];
  });
  
  // Modal state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDayCampaigns, setShowDayCampaigns] = useState(false);
  const [selectedDayCampaigns, setSelectedDayCampaigns] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  
  // Cache for future campaigns only - use useRef to persist across navigations
  const futureCampaignCache = useRef({
    campaigns: new Map(), // Map<campaignId, campaignData> for efficient lookups
    lastUpdated: null
  });
  const [audienceCache, setAudienceCache] = useState({});
  
  // Fetch audiences for a store
  const fetchAudiences = useCallback(async (klaviyoPublicId) => {
    if (!klaviyoPublicId || audienceCache[klaviyoPublicId]) return;
    
    try {
      const response = await fetch(`/api/klaviyo/audiences?storeId=${klaviyoPublicId}`);
      if (response.ok) {
        const result = await response.json();
        setAudienceCache(prev => ({
          ...prev,
          [klaviyoPublicId]: result.data
        }));
        console.log('✅ Fetched audiences for store:', klaviyoPublicId);
      }
    } catch (error) {
      console.error('Error fetching audiences:', error);
    }
  }, [audienceCache]);
  
  // Extract unique tags from campaigns
  const availableTags = useMemo(() => {
    const tags = new Set();
    campaigns.forEach(campaign => {
      if (campaign.tags && Array.isArray(campaign.tags)) {
        campaign.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [campaigns]);
  
  /**
   * Fetch stores with analytics access
   */
  const fetchStores = useCallback(async () => {
    try {
      setLoadingStores(true);
      const response = await fetch('/api/stores/analytics-access');
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  }, []);
  
  /**
   * Calculate date range based on current view
   */
  const getDateRange = useCallback(() => {
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    if (view === 'month') {
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
    } else if (view === 'week') {
      startDate.setDate(date.getDate() - 7);
      endDate.setDate(date.getDate() + 7);
    } else {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  }, [date, view]);

  /**
   * Load past campaigns using CampaignDataContext (runs first, shows immediately)
   */
  const loadPastCampaigns = useCallback(async () => {
    if (stores.length === 0) return;
    
    try {
      setPastLoading(true);
      const { startDate, endDate } = getDateRange();
      const now = new Date();
      let pastCampaignsData = [];
      
      // Load past campaigns from shared context
      if (startDate <= now) {
        const klaviyoIds = stores
          .filter(store => store.klaviyo_integration?.public_id)
          .map(store => store.klaviyo_integration.public_id);
        
        if (klaviyoIds.length > 0) {
          const pastEndDate = new Date(Math.min(endDate.getTime(), now.getTime()));
          console.log('📅 Loading past campaigns from CampaignDataContext', {
            dateRange: `${startDate.toDateString()} to ${pastEndDate.toDateString()}`,
            cacheKey: `${startDate.toISOString().split('T')[0]}_${pastEndDate.toISOString().split('T')[0]}_${klaviyoIds.sort().join(',')}`,
          });
          
          const contextData = await getCampaignData(
            startDate.toISOString(),
            pastEndDate.toISOString(),
            klaviyoIds,
            { forceRefresh: false, prefetch: true, subscribe: true }
          );
          
          console.log('📅 Past campaigns loaded:', {
            dataReceived: !!contextData,
            campaignCount: contextData?.campaigns?.length || 0,
            fromCache: contextData?.fromCache,
            cacheHit: contextData?.cacheHit
          });
          
          if (contextData?.campaigns) {
            pastCampaignsData = contextData.campaigns.map(campaign => ({
              ...campaign,
              id: campaign._id || campaign.id || campaign.campaignId,
              messageId: campaign.groupings?.campaign_message_id || campaign.messageId,
              name: campaign.campaign_name || campaign.name || 'Unnamed Campaign',
              date: campaign.send_time || campaign.sentAt || campaign.scheduled_at || campaign.created_at || campaign.date,
              channel: campaign.groupings?.send_channel || campaign.type || campaign.channel || 'email',
              subject: campaign.subject_line || campaign.subject || '',
              status: 'sent',
              isScheduled: false,
              klaviyo_public_id: campaign.accountId || campaign.klaviyo_public_id,
              storeIds: campaign.storeIds || campaign.store_public_ids || [],
              performance: {
                // Recipients and delivery
                recipients: campaign.recipients || campaign.statistics?.recipients || 0,
                delivered: campaign.delivered || campaign.statistics?.delivered || 0,
                
                // Opens - convert from percentage back to decimal if needed
                openRate: campaign.openRate ? campaign.openRate / 100 : (campaign.statistics?.open_rate || 0),
                opensUnique: campaign.opensUnique || campaign.statistics?.opens_unique || 0,
                opensTotal: campaign.opensTotal || campaign.statistics?.opens || 0,
                
                // Clicks - convert from percentage back to decimal if needed
                clickRate: campaign.clickRate ? campaign.clickRate / 100 : (campaign.statistics?.click_rate || 0),
                clicksUnique: campaign.clicksUnique || campaign.statistics?.clicks_unique || 0,
                clicksTotal: campaign.clicksTotal || campaign.statistics?.clicks || 0,
                clickToOpenRate: campaign.clickToOpenRate ? campaign.clickToOpenRate / 100 : (campaign.statistics?.click_to_open_rate || 0),
                
                // Conversions and revenue
                conversionRate: campaign.conversionRate ? campaign.conversionRate / 100 : (campaign.statistics?.conversion_rate || 0),
                conversions: campaign.conversions || campaign.conversionUniques || campaign.statistics?.conversions || 0,
                revenue: campaign.revenue || campaign.statistics?.conversion_value || 0,
                averageOrderValue: campaign.averageOrderValue || campaign.statistics?.average_order_value || 0,
                revenuePerRecipient: campaign.revenuePerRecipient || campaign.statistics?.revenue_per_recipient || 0,
                
                // Delivery metrics
                bounced: campaign.bounced || campaign.statistics?.bounced || 0,
                bounceRate: campaign.bounceRate ? campaign.bounceRate / 100 : (campaign.statistics?.bounce_rate || 0),
                failed: campaign.failed || campaign.statistics?.failed || 0,
                
                // Unsubscribes and complaints
                unsubscribes: campaign.unsubscribes || campaign.statistics?.unsubscribes || 0,
                unsubscribeRate: campaign.unsubscribeRate ? campaign.unsubscribeRate / 100 : (campaign.statistics?.unsubscribe_rate || 0),
                spamComplaints: campaign.spamComplaints || campaign.statistics?.spam_complaints || 0,
                spamComplaintRate: campaign.spamComplaintRate ? campaign.spamComplaintRate / 100 : (campaign.statistics?.spam_complaint_rate || 0),
                
                // Additional timing info
                firstOpen: campaign.firstOpen || null,
                lastOpen: campaign.lastOpen || null,
                firstClick: campaign.firstClick || null,
                lastClick: campaign.lastClick || null
              },
              // Audiences - properly map the audience objects with id, type, and name
              audiences: {
                included: campaign.includedAudiences || campaign.included_audiences || [],
                excluded: campaign.excludedAudiences || campaign.excluded_audiences || []
              },
              // Tags
              tags: campaign.tagNames || campaign.tags || [],
              // From info
              fromAddress: campaign.fromAddress || campaign.from_address || '',
              fromLabel: campaign.fromLabel || campaign.from_label || ''
            }));
          }
        }
      }
      
      setPastCampaigns(pastCampaignsData);
      console.log(`✅ Past campaigns ready: ${pastCampaignsData.length} campaigns`);
    } catch (error) {
      console.error('Error loading past campaigns:', error);
      setPastCampaigns([]);
    } finally {
      setPastLoading(false);
    }
  }, [stores, getCampaignData, getDateRange]);

  /**
   * Load future campaigns using Klaviyo API (runs in background)
   * This should only fetch from API once per session, then filter from cache
   */
  const loadFutureCampaigns = useCallback(async () => {
    const { startDate, endDate } = getDateRange();
    
    // Check if we have cached future campaigns from this session
    const cachedFutureCampaigns = Array.from(futureCampaignCache.current.campaigns.values());
    const hasCachedFutureCampaigns = cachedFutureCampaigns.length > 0;
    
    // Only fetch from API if we don't have any cached future campaigns
    if (!hasCachedFutureCampaigns && !futureCampaignCache.current.lastUpdated) {
      setFutureLoadingState(true);
      try {
        console.log('🔄 Loading ALL future campaigns from Klaviyo API (one-time fetch)...');
        const now = new Date();
        
        const params = new URLSearchParams({
          startDate: now.toISOString(),
          endDate: new Date('2030-12-31').toISOString()  // Get all future campaigns
        });

        const response = await fetch(`/api/calendar/campaigns/future?${params}`);
        if (response.ok) {
          const data = await response.json();
          const freshFutureCampaigns = data.campaigns || [];
          
          console.log(`📥 Received ${freshFutureCampaigns.length} future campaigns from API`);
          
          // Populate the session cache with ALL future campaigns
          const campaignMap = futureCampaignCache.current.campaigns;
          campaignMap.clear(); // Clear any existing entries
          freshFutureCampaigns.forEach(campaign => {
            const campaignKey = campaign.campaignId || campaign.id;
            campaignMap.set(campaignKey, campaign);
          });
          
          futureCampaignCache.current.lastUpdated = Date.now();
          console.log(`💾 Cached ${freshFutureCampaigns.length} future campaigns for entire session`);
        }
      } catch (error) {
        console.error('Error loading future campaigns:', error);
      } finally {
        setFutureLoadingState(false);
      }
    } else {
      console.log('📦 Using cached future campaigns from session (no API call needed)');
    }
    
    // Always filter cached future campaigns for current view
    const allFutureCampaigns = Array.from(futureCampaignCache.current.campaigns.values());
    const filteredFutureCampaigns = allFutureCampaigns.filter(c => {
      const cDate = new Date(c.date).getTime();
      return cDate >= startDate.getTime() && cDate <= endDate.getTime();
    });
    
    setFutureCampaigns(filteredFutureCampaigns);
    console.log(`📅 Showing ${filteredFutureCampaigns.length} future campaigns for current view (from ${allFutureCampaigns.length} total cached)`);
  }, [getDateRange]);

  /**
   * Main campaign loading coordinator - runs both functions in parallel
   */
  const loadAllCampaigns = useCallback(async () => {
    setLoading(true);
    
    // Run both loading functions in parallel for maximum performance
    await Promise.all([
      loadPastCampaigns(),    // Fast: hits cache, shows immediately
      loadFutureCampaigns()   // Slower: may hit API, shows loading state
    ]);
    
    setLoading(false);
  }, [loadPastCampaigns, loadFutureCampaigns]);

  // Update combined campaigns whenever past or future campaigns change
  useEffect(() => {
    const allCampaigns = [...pastCampaigns, ...futureCampaigns];
    const sortedCampaigns = sortCampaignsByDate(allCampaigns, 'desc');
    setCampaigns(sortedCampaigns);
    
    console.log(`📊 Combined campaigns updated:`, {
      pastCampaigns: pastCampaigns.length,
      futureCampaigns: futureCampaigns.length,
      totalCampaigns: allCampaigns.length
    });
  }, [pastCampaigns, futureCampaigns]);

  // Load stores on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);
  
  // Load campaigns initially when stores are available
  useEffect(() => {
    if (stores.length > 0) {
      loadAllCampaigns();
    }
  }, [stores, loadAllCampaigns]);
  
  // Update visible campaigns when date/view changes (but don't re-fetch)
  useEffect(() => {
    if (stores.length > 0 && futureCampaignCache.current.lastUpdated) {
      // Just re-filter the cached future campaigns for the new view
      const { startDate, endDate } = getDateRange();
      const allFutureCampaigns = Array.from(futureCampaignCache.current.campaigns.values());
      const filteredFutureCampaigns = allFutureCampaigns.filter(c => {
        const cDate = new Date(c.date).getTime();
        return cDate >= startDate.getTime() && cDate <= endDate.getTime();
      });
      setFutureCampaigns(filteredFutureCampaigns);
      console.log(`📅 View changed - showing ${filteredFutureCampaigns.length} future campaigns from cache`);
      
      // Also update past campaigns for the new view
      loadPastCampaigns();
    }
  }, [date, view, getDateRange, loadPastCampaigns, stores]);

  // Reset color assignments when stores change
  useEffect(() => {
    resetColorAssignments();
  }, [selectedStores]);

  // Update URL when filters change
  useEffect(() => {
    updateURLWithFilters(router, pathname, {
      date: date.toISOString(),
      view,
      stores: selectedStores.join(','),
      channels: selectedChannels.join(','),
      tags: selectedTags.join(','),
      statuses: selectedStatuses.join(',')
    });
  }, [date, view, selectedStores, selectedChannels, selectedTags, selectedStatuses, router, pathname]);
  
  /**
   * Get campaigns for a specific date with filters applied
   */
  const getCampaignsForDate = useCallback((targetDate) => {
    let dateCampaigns = filterCampaignsByDate(campaigns, targetDate);
    
    // Apply store filter
    if (selectedStores.length > 0) {
      dateCampaigns = dateCampaigns.filter(campaign => {
        const store = stores.find(s => 
          s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
        );
        
        if (store && selectedStores.includes(store.public_id)) {
          return true;
        }
        
        if (campaign.storeIds?.some(id => selectedStores.includes(id))) {
          return true;
        }
        
        return false;
      });
    }
    
    // Apply channel filter
    if (selectedChannels.length > 0) {
      dateCampaigns = dateCampaigns.filter(c => 
        selectedChannels.includes(c.channel)
      );
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      dateCampaigns = dateCampaigns.filter(c => 
        c.tags?.some(tag => selectedTags.includes(tag))
      );
    }
    
    // Apply status filter
    if (selectedStatuses.length > 0) {
      dateCampaigns = dateCampaigns.filter(campaign => {
        const isScheduled = isCampaignScheduled(campaign);
        const status = campaign.status?.toLowerCase();
        
        return selectedStatuses.some(s => {
          if (s === 'sent' && !isScheduled && status === 'sent') return true;
          if (s === 'scheduled' && (isScheduled || status === 'scheduled')) return true;
          if (s === 'draft' && status === 'draft') return true;
          return false;
        });
      });
    }
    
    return dateCampaigns;
  }, [campaigns, selectedStores, selectedChannels, selectedTags, selectedStatuses, stores]);
  
  /**
   * Handle campaign click
   */
  const handleCampaignClick = useCallback((campaign, source = 'calendar') => {
    setSelectedCampaign({ ...campaign, navigationSource: source });
    setShowCampaignDetails(true);
    // Fetch audiences for this campaign's store if needed
    if (campaign.klaviyo_public_id) {
      fetchAudiences(campaign.klaviyo_public_id);
    }
  }, [fetchAudiences]);
  
  /**
   * Handle day click - show day campaigns modal if multiple campaigns
   */
  const handleDayClick = useCallback((clickedDate) => {
    const dayCampaigns = getCampaignsForDate(clickedDate);
    
    if (dayCampaigns.length > 1) {
      // Multiple campaigns - show day modal
      setSelectedDayCampaigns(dayCampaigns);
      setShowDayCampaigns(true);
    } else if (dayCampaigns.length === 1) {
      // Single campaign - open directly
      handleCampaignClick(dayCampaigns[0], 'calendar');
    } else {
      // No campaigns - just set the date
      setDate(clickedDate);
    }
  }, [getCampaignsForDate, handleCampaignClick]);
  
  // Filter handlers for inline chip removal
  const handleStoreToggle = useCallback((storeId) => {
    setSelectedStores(prev => prev.filter(id => id !== storeId));
  }, []);
  
  const handleChannelToggle = useCallback((channel) => {
    setSelectedChannels(prev => prev.filter(c => c !== channel));
  }, []);
  
  const handleTagToggle = useCallback((tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  }, []);
  
  const handleStatusToggle = useCallback((status) => {
    setSelectedStatuses(prev => prev.filter(s => s !== status));
  }, []);
  
  const clearAllFilters = useCallback(() => {
    setSelectedStores([]);
    setSelectedChannels([]);
    setSelectedTags([]);
    setSelectedStatuses([]);
  }, []);
  
  /**
   * Handle comparison toggle - limit to 5 campaigns
   */
  const handleComparisonToggle = useCallback((campaignId) => {
    setSelectedForComparison(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else {
        // Limit to 5 campaigns
        if (prev.length >= 5) {
          alert('You can compare up to 5 campaigns at a time');
          return prev;
        }
        return [...prev, campaignId];
      }
    });
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Campaign Stats Cards */}
      {!loadingStores && campaigns.length > 0 && (
        <CampaignStats campaigns={campaigns} />
      )}
      
      {/* Calendar Header */}
      <CalendarHeader
        date={date}
        setDate={setDate}
        view={view}
        setView={setView}
        stores={stores}
        selectedStores={selectedStores}
        setSelectedStores={setSelectedStores}
        selectedChannels={selectedChannels}
        setSelectedChannels={setSelectedChannels}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        availableTags={availableTags}
        showStoreDropdown={showStoreDropdown}
        setShowStoreDropdown={setShowStoreDropdown}
        setShowCampaignModal={setShowCampaignModal}
        selectedForComparison={selectedForComparison}
        setShowCompareModal={setShowCompareModal}
        futureLoading={futureLoadingState}
        pastLoading={pastLoading}
        loading={loading}
        loadingStores={loadingStores}
      />
      
      {/* Filters and Store Legend Section */}
      <div className="bg-gradient-to-r from-sky-50/50 to-purple-50/50 dark:from-gray-800/50 dark:to-gray-800/50 rounded-lg border border-sky-blue/30 dark:border-gray-700 p-3 space-y-2">
        {/* Store Legend - Always visible */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            STORES:
          </span>
          {stores
            .filter(store => store.klaviyo_integration?.public_id)
            .map((store, index) => {
              const colorIndex = index * 3; // Skip 3 colors for differentiation
              const storeColor = getColorByIndex(colorIndex);
              const isFiltered = selectedStores.includes(store.public_id);
              return (
                <button
                  key={store.public_id || store.id || store._id}
                  onClick={() => {
                    // Toggle this store as a filter
                    if (isFiltered) {
                      setSelectedStores(prev => prev.filter(id => id !== store.public_id));
                    } else {
                      setSelectedStores(prev => [...prev, store.public_id]);
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    storeColor.bg,
                    storeColor.text,
                    storeColor.border,
                    isFiltered ? "ring-2 ring-sky-blue shadow-sm" : "opacity-70 hover:opacity-100",
                    "hover:scale-105"
                  )}
                  title={isFiltered ? `Click to show all ${store.name} campaigns` : `Click to filter by ${store.name}`}
                >
                  <div className={cn("w-2 h-2 rounded-full", storeColor.bg)} />
                  {store.name}
                  {isFiltered && (
                    <Check className="h-3 w-3 ml-0.5" />
                  )}
                </button>
              );
            })
          }
          {selectedStores.length > 0 && (
            <button
              onClick={() => setSelectedStores([])}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline ml-2"
            >
              Show all stores
            </button>
          )}
        </div>
        
        {/* Active Filters Row - Only show if filters exist */}
        {(selectedChannels.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0) && (
          <div className="flex flex-wrap gap-2 items-center border-t border-sky-blue/20 dark:border-gray-700 pt-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              ACTIVE FILTERS:
            </span>
            
            {/* Channel filters */}
            {selectedChannels.map(channel => {
              const channelInfo = {
                email: { label: 'Email', icon: Mail, color: 'text-blue-600' },
                sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-600' },
                'push-notification': { label: 'Push', icon: Bell, color: 'text-purple-600' }
              }[channel];
              const Icon = channelInfo?.icon;
              return (
                <Badge
                  key={channel}
                  variant="secondary"
                  className="pl-1.5 pr-1 py-0.5 text-xs bg-gradient-to-r from-sky-tint to-lilac-mist/50 border-sky-blue/30 hover:border-sky-blue/50 transition-all"
                >
                  {Icon && <Icon className={cn("h-3 w-3 mr-1", channelInfo.color)} />}
                  {channelInfo?.label}
                  <button
                    onClick={() => handleChannelToggle(channel)}
                    className="ml-1 hover:bg-sky-blue/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            
            {/* Tag filters */}
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="pl-1.5 pr-1 py-0.5 text-xs bg-gradient-to-r from-sky-tint to-lilac-mist/50 border-sky-blue/30 hover:border-sky-blue/50 transition-all"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1 hover:bg-sky-blue/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            {/* Status filters */}
            {selectedStatuses.map(status => {
              const statusInfo = {
                sent: { label: 'Sent', color: 'text-gray-600' },
                scheduled: { label: 'Scheduled', color: 'text-sky-blue' },
                draft: { label: 'Draft', color: 'text-yellow-600' }
              }[status];
              return (
                <Badge
                  key={status}
                  variant="secondary"
                  className="pl-1.5 pr-1 py-0.5 text-xs bg-gradient-to-r from-sky-tint to-lilac-mist/50 border-sky-blue/30 hover:border-sky-blue/50 transition-all"
                >
                  {statusInfo?.label}
                  <button
                    onClick={() => handleStatusToggle(status)}
                    className="ml-1 hover:bg-sky-blue/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            
            {/* Clear all button for non-store filters */}
            {(selectedChannels.length + selectedTags.length + selectedStatuses.length) > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  setSelectedChannels([]);
                  setSelectedTags([]);
                  setSelectedStatuses([]);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
          
      
      {/* Loading indicators for future campaigns */}
      {futureLoadingState && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg shadow-sm">
          <div className="h-3 w-3 border-2 border-vivid-violet border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium text-xs">Loading scheduled campaigns...</span>
        </div>
      )}
      
      {/* Calendar Views */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        {(pastLoading || loadingStores) ? (
          <div className="flex items-center justify-center py-20">
            <InlineLoading text="Loading past campaigns..." />
          </div>
        ) : view === 'month' ? (
          <MonthView
            date={date}
            setDate={setDate}
            campaigns={campaigns}
            stores={stores}
            handleCampaignClick={handleCampaignClick}
            getCampaignsForDate={getCampaignsForDate}
            handleDayClick={handleDayClick}
            selectedForComparison={selectedForComparison}
            handleComparisonToggle={handleComparisonToggle}
          />
        ) : view === 'week' ? (
          <WeekView
            date={date}
            campaigns={campaigns}
            stores={stores}
            handleCampaignClick={handleCampaignClick}
            getCampaignsForDate={getCampaignsForDate}
            handleDayClick={handleDayClick}
            selectedForComparison={selectedForComparison}
            handleComparisonToggle={handleComparisonToggle}
          />
        ) : view === 'day' ? (
          <DayView
            date={date}
            campaigns={campaigns}
            stores={stores}
            handleCampaignClick={handleCampaignClick}
            getCampaignsForDate={getCampaignsForDate}
            selectedForComparison={selectedForComparison}
            handleComparisonToggle={handleComparisonToggle}
          />
        ) : null}
      </div>
      
      {/* Modals */}
      {showCampaignDetails && selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() => {
            setShowCampaignDetails(false);
            setSelectedCampaign(null);
          }}
          stores={stores}
          audienceCache={audienceCache}
          onBackToDay={() => {
            // Re-open the day campaigns modal if we came from there
            if (selectedCampaign?.navigationSource === 'dayModal' && selectedDayCampaigns.length > 0) {
              setShowDayCampaigns(true);
            }
          }}
        />
      )}
      
      {showDayCampaigns && (
        <DayCampaignsModal
          campaigns={selectedDayCampaigns}
          onClose={() => setShowDayCampaigns(false)}
          onSelectCampaign={handleCampaignClick}
          stores={stores}
        />
      )}
      
      {showCompareModal && (
        <CampaignComparisonModal
          campaignIds={selectedForComparison}
          campaigns={campaigns}
          stores={stores}
          onClose={() => {
            setShowCompareModal(false);
            setSelectedForComparison([]);
          }}
        />
      )}
      
      {showCampaignModal && (
        <NewCampaignModal
          onClose={() => setShowCampaignModal(false)}
          stores={stores}
        />
      )}
    </div>
  );
}
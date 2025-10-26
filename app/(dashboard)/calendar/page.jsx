'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { InlineLoader } from '@/app/components/ui/loading';
import { resetColorAssignments, getStoreColor } from '@/lib/calendar-colors';
import { CalendarHeader } from './components/CalendarHeader';
import { FilterCard } from './components/FilterCard';
import { CalendarSkeleton } from './components/CalendarSkeleton';
import { MonthView, WeekView, DayView } from './components/CalendarViews';
import { CampaignStats } from './components/CampaignStats';
import { CampaignsTable } from './components/CampaignsTable';
import { 
  filterCampaignsByDate,
  sortCampaignsByDate,
  updateURLWithFilters,
  isCampaignScheduled 
} from './utils/calendar-helpers';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';

// Dynamically import heavy components from shared location

// Import modals from shared location
const CampaignDetailsModal = dynamic(() => import('@/app/components/campaigns/CampaignDetailsModal'), { ssr: false });
const ScheduledCampaignModal = dynamic(() => import('./components/ScheduledCampaignModal'), { ssr: false });
const DayCampaignsModal = dynamic(() => import('./components/DayCampaignsModal'), { ssr: false });
const CampaignComparisonModal = dynamic(() => import('./components/CampaignComparisonModal'), { ssr: false });
const NewCampaignModal = dynamic(() => import('./components/NewCampaignModal'), { ssr: false });

export default function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Core state
  const [date, setDate] = useState(() => {
    const dateParam = searchParams.get('date');
    return dateParam ? new Date(dateParam) : new Date();
  });
  
  const [view, setView] = useState(() => searchParams.get('view') || 'month');
  const [displayMode, setDisplayMode] = useState(() => searchParams.get('displayMode') || 'calendar'); // 'calendar' or 'table'
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

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
  
  // Smart caching for both past and future campaigns - use useRef to persist across navigations
  const futureCampaignCache = useRef({
    campaigns: new Map(), // Map<campaignId, campaignData> for efficient lookups
    lastUpdated: null,
    allFetched: false // Track if we've fetched ALL future campaigns
  });

  // Smart cache for past campaigns - keyed by date range and store IDs
  const pastCampaignCache = useRef({
    campaigns: new Map(), // Map<cacheKey, Array<campaigns>>
    ranges: new Map(), // Map<cacheKey, {startDate, endDate}> to track what ranges we have
    lastStoreIds: null // Track store IDs to invalidate cache when stores change
  });

  // Cache for all audiences (segments and lists) across all stores
  const [audienceCache, setAudienceCache] = useState({
    byStore: {},      // Organized by klaviyo_public_id
    audienceIndex: {},        // Flat index for quick lookups
    loading: false,
    loaded: false
  });

  // Fetch all audiences for all stores at once
  const fetchAllAudiences = useCallback(async () => {
    // Only fetch if not already loaded or loading
    if (audienceCache.loaded || audienceCache.loading) return;

    setAudienceCache(prev => ({ ...prev, loading: true }));

    try {
      // Get klaviyo IDs from all stores
      const klaviyoIds = stores
        .filter(s => s.klaviyo_integration?.public_id)
        .map(s => s.klaviyo_integration.public_id);

      if (klaviyoIds.length === 0) return;

      // Fetch all audiences in bulk
      const response = await fetch(`/api/klaviyo/audiences/bulk?storeIds=${klaviyoIds.join(',')}`);
      if (response.ok) {
        const result = await response.json();
        setAudienceCache({
          byStore: result.audiencesByStore || {},
          audienceIndex: result.audienceIndex || {},
          loading: false,
          loaded: true
        });
        console.log('✅ Loaded audience cache:', {
          stores: Object.keys(result.audiencesByStore || {}).length,
          totalAudiences: Object.keys(result.audienceIndex || {}).length
        });
      }
    } catch (error) {
      console.error('Error fetching all audiences:', error);
      setAudienceCache(prev => ({ ...prev, loading: false }));
    }
  }, [stores, audienceCache.loaded, audienceCache.loading]);
  
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
      // Set to first day of month
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      // Set to last day of month (get next month, then day 0 = last day of current month)
      const nextMonth = new Date(date);
      nextMonth.setMonth(date.getMonth() + 1);
      nextMonth.setDate(0);
      endDate.setTime(nextMonth.getTime());
      endDate.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      // Get start of week (Sunday)
      const dayOfWeek = date.getDay();
      startDate.setDate(date.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      // Get end of week (Saturday)
      endDate.setDate(date.getDate() + (6 - dayOfWeek));
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log('📅 Date range calculated:', {
      view,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    return { startDate, endDate };
  }, [date, view]);

  /**
   * Generate cache key for past campaigns based on date range
   */
  const generatePastCacheKey = useCallback((startDate, endDate) => {
    // Create a cache key based on month/year to group related queries
    const startKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    const endKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
    return `${startKey}_${endKey}`;
  }, []);

  /**
   * Check if we have cached data that covers the requested date range
   */
  const getCachedPastCampaigns = useCallback((startDate, endDate) => {
    const cache = pastCampaignCache.current;

    // Check each cached range to see if any covers our requested range
    for (const [cacheKey, range] of cache.ranges.entries()) {
      const cachedStart = new Date(range.startDate);
      const cachedEnd = new Date(range.endDate);

      // Check if cached range fully covers requested range
      if (cachedStart <= startDate && cachedEnd >= endDate) {
        const cachedCampaigns = cache.campaigns.get(cacheKey) || [];
        console.log(`✅ Cache HIT for past campaigns: Found ${cachedCampaigns.length} campaigns in cache`);

        // Filter the cached campaigns to the requested date range
        return cachedCampaigns.filter(campaign => {
          const campaignDate = new Date(campaign.date);
          return campaignDate >= startDate && campaignDate <= endDate;
        });
      }
    }

    console.log('❌ Cache MISS for past campaigns: Need to fetch from API');
    return null;
  }, []);

  /**
   * Load past campaigns with smart caching
   */
  const loadPastCampaigns = useCallback(async () => {
    if (stores.length === 0) return;

    try {
      const { startDate, endDate } = getDateRange();
      const now = new Date();
      let pastCampaignsData = [];

      // Check if store IDs have changed (invalidate cache if they have)
      const currentStoreIds = stores
        .filter(store => store.klaviyo_integration?.public_id && store.public_id)
        .map(store => store.public_id)
        .sort()
        .join(',');

      if (pastCampaignCache.current.lastStoreIds !== currentStoreIds) {
        console.log('🔄 Store IDs changed, clearing past campaign cache');
        pastCampaignCache.current.campaigns.clear();
        pastCampaignCache.current.ranges.clear();
        pastCampaignCache.current.lastStoreIds = currentStoreIds;
      }

      // Load past campaigns
      if (startDate <= now) {
        const pastEndDate = endDate < now ? endDate : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // Check cache first
        const cachedData = getCachedPastCampaigns(startDate, pastEndDate);

        if (cachedData) {
          // Use cached data
          pastCampaignsData = cachedData;
          setPastLoading(false); // Don't show loading for cached data
        } else {
          // Need to fetch from API
          setPastLoading(true);

          // Expand the fetch range to cover the entire month(s) for better caching
          const fetchStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0);
          const fetchEndDate = new Date(pastEndDate.getFullYear(), pastEndDate.getMonth() + 1, 0, 23, 59, 59, 999);

          console.log('📅 Fetching past campaigns from API', {
            requestedRange: `${startDate.toDateString()} to ${pastEndDate.toDateString()}`,
            fetchingRange: `${fetchStartDate.toDateString()} to ${fetchEndDate.toDateString()}`,
            reason: 'Fetching entire month for better caching'
          });

          const params = new URLSearchParams({
            startDate: fetchStartDate.toISOString(),
            endDate: fetchEndDate.toISOString()
          });

          const response = await fetch(`/api/calendar/campaigns?${params}`);
          if (!response.ok) {
            throw new Error('Failed to fetch campaigns');
          }

          const contextData = await response.json();

          if (contextData?.campaigns) {
            // Process and cache ALL fetched campaigns
            const allFetchedCampaigns = contextData.campaigns
              .filter(campaign => {
                const campaignDate = new Date(campaign.date);
                const isInPast = campaignDate <= now;
                const isScheduledStatus = campaign.isScheduled ||
                                        campaign.status === 'Scheduled' ||
                                        campaign.status === 'Draft' ||
                                        campaign.status === 'Sending';
                return isInPast && !isScheduledStatus;
              })
              .map(campaign => ({
                ...campaign,
                id: campaign.id || campaign._id || campaign.campaignId,
                status: 'sent',
                isScheduled: false
              }));

            // Cache the full month's data
            const cacheKey = generatePastCacheKey(fetchStartDate, fetchEndDate);
            pastCampaignCache.current.campaigns.set(cacheKey, allFetchedCampaigns);
            pastCampaignCache.current.ranges.set(cacheKey, {
              startDate: fetchStartDate.toISOString(),
              endDate: fetchEndDate.toISOString()
            });

            console.log(`💾 Cached ${allFetchedCampaigns.length} past campaigns for range: ${cacheKey}`);

            // Filter to just what we need for the current view
            pastCampaignsData = allFetchedCampaigns.filter(campaign => {
              const campaignDate = new Date(campaign.date);
              return campaignDate >= startDate && campaignDate <= pastEndDate;
            });
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
  }, [stores, getDateRange, getCachedPastCampaigns, generatePastCacheKey]);

  /**
   * Load future campaigns with smart caching
   * Fetches ALL scheduled/draft campaigns once, then uses cache
   */
  const loadFutureCampaigns = useCallback(async () => {
    const { startDate, endDate } = getDateRange();

    // Check if store IDs have changed (invalidate cache if they have)
    const currentStoreIds = stores
      .filter(store => store.klaviyo_integration?.public_id && store.public_id)
      .map(store => store.public_id)
      .sort()
      .join(',');

    if (pastCampaignCache.current.lastStoreIds !== currentStoreIds && futureCampaignCache.current.allFetched) {
      console.log('🔄 Store IDs changed, clearing future campaign cache');
      futureCampaignCache.current.campaigns.clear();
      futureCampaignCache.current.lastUpdated = null;
      futureCampaignCache.current.allFetched = false;
    }

    // Check if we've already fetched ALL future campaigns
    if (!futureCampaignCache.current.allFetched) {
      setFutureLoadingState(true);
      try {
        console.log('🚀 One-time fetch of ALL scheduled/draft campaigns...');
        const now = new Date();

        // Fetch from a date far in the past to catch ALL draft/scheduled campaigns
        // (since drafts might have old creation dates)
        const params = new URLSearchParams({
          startDate: new Date('2020-01-01').toISOString(),
          endDate: new Date('2030-12-31').toISOString(),
          statusFilter: 'scheduled,draft,sending' // Only get non-sent campaigns
        });

        const response = await fetch(`/api/calendar/campaigns?${params}`);
        if (response.ok) {
          const data = await response.json();

          // Get ALL scheduled, draft, or future campaigns
          const allScheduledCampaigns = (data.campaigns || []).filter(c => {
            const hasScheduledStatus = c.isScheduled ||
                                       c.status === 'Scheduled' ||
                                       c.status === 'Draft' ||
                                       c.status === 'Sending';
            const isInFuture = new Date(c.date) > now;

            // Include if it has a scheduled status OR is in the future
            return hasScheduledStatus || isInFuture;
          });

          console.log(`✅ Fetched ${allScheduledCampaigns.length} scheduled/draft campaigns`);

          // Cache ALL scheduled/draft campaigns
          const campaignMap = futureCampaignCache.current.campaigns;
          campaignMap.clear();
          allScheduledCampaigns.forEach(campaign => {
            const campaignKey = campaign.campaignId || campaign.id || `${campaign.name}-${campaign.date}`;
            campaignMap.set(campaignKey, campaign);
          });

          futureCampaignCache.current.lastUpdated = Date.now();
          futureCampaignCache.current.allFetched = true;
          console.log(`💾 Cached ALL ${allScheduledCampaigns.length} scheduled/draft campaigns`);
        }
      } catch (error) {
        console.error('Error loading future campaigns:', error);
      } finally {
        setFutureLoadingState(false);
      }
    } else {
      console.log('✨ Using cached scheduled/draft campaigns (no API call)');
    }

    // Filter cached campaigns for current view
    const allFutureCampaigns = Array.from(futureCampaignCache.current.campaigns.values());

    const filteredFutureCampaigns = allFutureCampaigns.filter(c => {
      const cDate = new Date(c.date);
      const cTime = cDate.getTime();
      return cTime >= startDate.getTime() && cTime <= endDate.getTime();
    });

    setFutureCampaigns(filteredFutureCampaigns);
    console.log(`📅 Showing ${filteredFutureCampaigns.length}/${allFutureCampaigns.length} scheduled campaigns in current view`);
  }, [getDateRange, stores]);

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

  // Load all audiences when stores are available
  useEffect(() => {
    if (stores.length > 0 && !audienceCache.loaded && !audienceCache.loading) {
      fetchAllAudiences();
    }
  }, [stores, audienceCache.loaded, audienceCache.loading, fetchAllAudiences]);
  
  // Update visible campaigns when date/view changes
  useEffect(() => {
    if (stores.length > 0) {
      // For future campaigns, just re-filter from cache if we have it
      if (futureCampaignCache.current.allFetched) {
        const { startDate, endDate } = getDateRange();
        const allFutureCampaigns = Array.from(futureCampaignCache.current.campaigns.values());

        const filteredFutureCampaigns = allFutureCampaigns.filter(c => {
          const cDate = new Date(c.date);
          const cTime = cDate.getTime();
          return cTime >= startDate.getTime() && cTime <= endDate.getTime();
        });

        setFutureCampaigns(filteredFutureCampaigns);
        console.log(`📅 View changed - showing ${filteredFutureCampaigns.length}/${allFutureCampaigns.length} scheduled from cache`);
      }

      // For past campaigns, load with smart caching (will use cache if available)
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
      displayMode,
      stores: selectedStores.join(','),
      channels: selectedChannels.join(','),
      tags: selectedTags.join(','),
      statuses: selectedStatuses.join(',')
    });
  }, [date, view, displayMode, selectedStores, selectedChannels, selectedTags, selectedStatuses, router, pathname]);
  
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
    // Check if this is a future/scheduled campaign
    // Future campaigns have IDs that start with 'future-' or have specific status values
    // Show all future campaigns - either explicitly marked or with future date
    const isFutureCampaign = campaign.id?.startsWith('future-') ||
                             campaign.status === 'Scheduled' ||
                             campaign.status === 'Draft' ||
                             campaign.status === 'Sending' ||
                             new Date(campaign.date) > new Date(); // Also check if date is in future

    // Also check using the utility function
    const isScheduled = isFutureCampaign || campaign.isScheduled || isCampaignScheduled(campaign);

    // For future campaigns, ensure they have proper fields
    if (isScheduled && !campaign.recipients && !campaign.estimated_recipients) {
      campaign.estimated_recipients = 0; // Will be fetched by the modal
    }

    setSelectedCampaign({ ...campaign, isScheduled, navigationSource: source });
    setShowCampaignDetails(true);
  }, []);
  
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

  /**
   * Handle manual refresh - clears caches and reloads data
   */
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered - clearing all caches');

    // Clear past campaign cache
    pastCampaignCache.current.campaigns.clear();
    pastCampaignCache.current.ranges.clear();

    // Clear future campaign cache
    futureCampaignCache.current.campaigns.clear();
    futureCampaignCache.current.lastUpdated = null;
    futureCampaignCache.current.allFetched = false;

    // Reload all campaigns
    await loadAllCampaigns();
  }, [loadAllCampaigns]);

  /**
   * Get filtered campaigns for stats - apply all active filters AND date range
   */
  const getFilteredCampaigns = useCallback(() => {
    let filteredCampaigns = [...campaigns];

    // First filter by current view's date range
    const { startDate, endDate } = getDateRange();
    filteredCampaigns = filteredCampaigns.filter(campaign => {
      const campaignDate = new Date(campaign.date);
      return campaignDate >= startDate && campaignDate <= endDate;
    });

    // Apply store filter
    if (selectedStores.length > 0) {
      filteredCampaigns = filteredCampaigns.filter(campaign => {
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
      filteredCampaigns = filteredCampaigns.filter(c =>
        selectedChannels.includes(c.channel)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filteredCampaigns = filteredCampaigns.filter(c =>
        c.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filteredCampaigns = filteredCampaigns.filter(campaign => {
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

    return filteredCampaigns;
  }, [campaigns, selectedStores, selectedChannels, selectedTags, selectedStatuses, stores, getDateRange]);
  
  return (
    <div className="space-y-4">
      {/* Campaign Stats Cards - Always show, even with 0 campaigns */}
      {!loadingStores && (
        <CampaignStats
          campaigns={getFilteredCampaigns()}
          isFiltered={selectedStores.length > 0 || selectedChannels.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0}
          view={view}
          date={date}
        />
      )}
      
      {/* Filter Card - Above Calendar Header */}
      <FilterCard
        stores={stores.filter(store => store.klaviyo_integration?.public_id)}
        campaigns={campaigns}
        selectedStores={selectedStores}
        setSelectedStores={setSelectedStores}
        selectedChannels={selectedChannels}
        setSelectedChannels={setSelectedChannels}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        className="mb-4"
      />

      {/* Conditionally render based on displayMode */}
      {displayMode === 'calendar' ? (
        <>
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
            onRefresh={handleRefresh}
          />


          {/* Loading indicators for future campaigns */}
          {futureLoadingState && (
            <div className="bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-lg shadow-sm">
              <InlineLoader size="small" showText={true} text="Loading scheduled campaigns..." />
            </div>
          )}

          {/* Calendar Views */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            {(pastLoading || loadingStores) ? (
              <CalendarSkeleton view={view} />
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
        </>
      ) : (
        <>
          {/* Performance Table View */}
          <CampaignsTable
            campaigns={getFilteredCampaigns()}
            stores={stores}
            onCampaignClick={handleCampaignClick}
            view={view}
            date={date}
            loading={pastLoading || loadingStores}
          />
        </>
      )}
      
      {/* Modals */}
      {selectedCampaign && (
        selectedCampaign.isScheduled === true ? (
          <ScheduledCampaignModal
            key={`scheduled-modal-${selectedCampaign?.id}`}
            campaign={selectedCampaign}
            isOpen={showCampaignDetails}
            onClose={() => {
              setShowCampaignDetails(false);
              setSelectedCampaign(null);
            }}
            stores={stores}
            onCampaignDeleted={(campaignId) => {
              // Remove the deleted campaign from the state
              setCampaigns(prev => prev.filter(c => c.id !== campaignId));
              setFutureCampaigns(prev => prev.filter(c => c.id !== campaignId));
              // Clear the cache
              if (campaignCacheRef.current) {
                delete campaignCacheRef.current[campaignId];
              }
            }}
            onCampaignUpdated={(updatedCampaign) => {
              // Update the campaign in the state
              const updateCampaignInList = (list) =>
                list.map(c => c.id === updatedCampaign.id ? { ...c, ...updatedCampaign } : c);

              setCampaigns(prev => updateCampaignInList(prev));
              setFutureCampaigns(prev => updateCampaignInList(prev));
              // Don't update selectedCampaign here as it will cause re-render
              // The modal will handle its own state

              // Update the cache
              if (campaignCacheRef.current && updatedCampaign.id) {
                campaignCacheRef.current[updatedCampaign.id] = { ...selectedCampaign, ...updatedCampaign };
              }
            }}
          />
        ) : (
          <CampaignDetailsModal
            key={`campaign-modal-${selectedCampaign?.id}`}
            campaign={selectedCampaign}
            isOpen={showCampaignDetails}
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
        )
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
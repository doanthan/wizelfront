"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Smart Campaign Data Hook
 * Implements intelligent caching for campaign cards
 * Fetches ALL campaigns once, then filters client-side for better UX
 */

// Simple in-memory cache for campaign data
const campaignCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000, // 5 minutes TTL

  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  },

  get() {
    if (!this.data || !this.timestamp) return null;
    if (Date.now() - this.timestamp > this.ttl) {
      this.clear();
      return null;
    }
    return this.data;
  },

  clear() {
    this.data = null;
    this.timestamp = null;
  },

  isValid() {
    return this.data && this.timestamp && (Date.now() - this.timestamp < this.ttl);
  }
};

export function useCampaignData(stores) {
  console.log('🚨 useCampaignData called with stores:', stores === undefined ? 'undefined' : stores?.length || 'empty');
  console.log('🚨 Stores sample:', stores?.slice(0, 2)?.map(s => ({
    name: s.name,
    public_id: s.public_id,
    klaviyo_integration: s.klaviyo_integration,
    klaviyo_public_id: s.klaviyo_public_id
  })) || 'none');

  // TEMPORARY: Show real store data for debugging
  if (stores && stores.length > 0) {
    console.log('🚨 Real stores found!', stores.length, stores.map(s => ({
      name: s.name,
      public_id: s.public_id,
      klaviyo_integration: s.klaviyo_integration
    })));
  }

  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [failedStores, setFailedStores] = useState(new Set());
  const [isKlaviyoDown, setIsKlaviyoDown] = useState(false);

  const abortController = useRef(null);
  const isMountedRef = useRef(true);

  // Memoize all klaviyo IDs from all stores for fetching ALL campaigns
  const allKlaviyoIds = useMemo(() => {
    // Handle case where stores is undefined (not loaded yet) vs empty array (no stores)
    if (stores === undefined) {
      console.log('🚨 useCampaignData: Stores not loaded yet (undefined)');
      return null; // Return null to indicate "not ready yet"
    }

    if (!stores || stores.length === 0) {
      console.log('🚨 useCampaignData: No stores available (empty array)');
      return [];
    }

    console.log('🚨 useCampaignData: Processing stores:', stores.length);
    console.log('🚨 useCampaignData: Store details:', stores.map(s => ({
      name: s.name,
      public_id: s.public_id,
      has_klaviyo_integration: !!s.klaviyo_integration,
      klaviyo_integration_keys: s.klaviyo_integration ? Object.keys(s.klaviyo_integration) : [],
      klaviyo_integration_public_id: s.klaviyo_integration?.public_id,
      has_klaviyo_public_id: !!s.klaviyo_public_id,
      klaviyo_public_id: s.klaviyo_public_id,
      calculated_klaviyo_id: s.klaviyo_integration?.public_id || s.klaviyo_public_id
    })));

    const klaviyoIds = stores
      .filter(s => s.klaviyo_integration?.public_id || s.klaviyo_public_id)
      .map(s => s.klaviyo_integration?.public_id || s.klaviyo_public_id);

    console.log('🚨 useCampaignData: Extracted klaviyo IDs:', klaviyoIds);
    return klaviyoIds;
  }, [stores]);

  // Create stable reference to prevent unnecessary re-fetches
  const allKlaviyoIdsString = allKlaviyoIds ? JSON.stringify(allKlaviyoIds.sort()) : 'null';

  /**
   * Fetch ALL campaigns once and cache them
   */
  const fetchAllCampaigns = useCallback(async () => {
    // Don't fetch if stores haven't loaded yet (allKlaviyoIds is null)
    if (allKlaviyoIds === null) {
      console.log('🚨 useCampaignData: Waiting for stores to load...');
      return;
    }

    if (allKlaviyoIds.length === 0) {
      console.log('🚨 useCampaignData: No Klaviyo integrations found');
      setRecentCampaigns([]);
      setUpcomingCampaigns([]);
      setLoading(false); // Not loading anymore - we have a definitive result
      return;
    }

    // Check cache first
    const cached = campaignCache.get();
    if (cached) {
      console.log('📦 Using cached campaign data');
      setRecentCampaigns(cached.recent);
      setUpcomingCampaigns(cached.upcoming);
      setFailedStores(cached.failedStores || new Set());
      setIsKlaviyoDown(cached.isKlaviyoDown || false);
      return;
    }

    // Cancel previous request gracefully
    if (abortController.current) {
      // Don't abort - just mark it as cancelled
      abortController.current = null;
    }
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);
    setFailedStores(new Set());
    setIsKlaviyoDown(false);

    try {
      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      console.log('🚀 Fetching ALL campaigns for caching (will filter client-side)');

      let allRecent = [];
      let allUpcoming = [];
      const currentFailedStores = new Set();

      // Fetch recent campaigns (past 14 days) - graceful error handling
      try {
        const recentParams = new URLSearchParams({
          startDate: fourteenDaysAgo.toISOString(),
          endDate: now.toISOString(),
          storeIds: allKlaviyoIds.join(',')
        });

        const recentResponse = await fetch(`/api/calendar/campaigns?${recentParams}`, {
          signal: abortController.current.signal
        });

        if (!isMountedRef.current) return;

        if (recentResponse.ok) {
          const { campaigns } = await recentResponse.json();
          allRecent = campaigns || [];
          console.log(`📦 Recent campaigns loaded: ${allRecent.length}`);
        } else {
          console.warn('❌ Recent campaigns API failed:', recentResponse.status);
          // Don't throw error - just log and continue with empty data
        }
      } catch (recentError) {
        if (recentError.name !== 'AbortError') {
          console.warn('❌ Recent campaigns fetch failed:', recentError.message);
          // Track that recent campaigns failed but continue
        }
      }

      // Fetch upcoming campaigns (next 30 days) - graceful error handling
      try {
        const upcomingParams = new URLSearchParams({
          startDate: now.toISOString(),
          endDate: thirtyDaysFromNow.toISOString(),
          storeIds: allKlaviyoIds.join(','),
          status: 'scheduled'
        });

        const upcomingResponse = await fetch(`/api/calendar/campaigns?${upcomingParams}`, {
          signal: abortController.current.signal
        });

        if (!isMountedRef.current) return;

        if (upcomingResponse.ok) {
          const { campaigns } = await upcomingResponse.json();
          allUpcoming = campaigns || [];
          console.log(`📦 Upcoming campaigns loaded: ${allUpcoming.length}`);
        } else {
          console.warn('❌ Upcoming campaigns API failed:', upcomingResponse.status);
          // Don't throw error - just log and continue with empty data
        }
      } catch (upcomingError) {
        if (upcomingError.name !== 'AbortError') {
          console.warn('❌ Upcoming campaigns fetch failed:', upcomingError.message);
          // Track that upcoming campaigns failed but continue
        }
      }

      // Process and map campaigns
      const processedRecent = processCampaigns(allRecent, stores, 'recent');
      const processedUpcoming = processCampaigns(allUpcoming, stores, 'upcoming');

      // Determine which stores had failed campaigns (if any individual store failures)
      const storesWithData = new Set();
      [...processedRecent, ...processedUpcoming].forEach(campaign => {
        if (campaign.klaviyo_public_id) {
          storesWithData.add(campaign.klaviyo_public_id);
        }
      });

      // Find stores that should have data but don't
      const expectedStores = new Set(allKlaviyoIds);
      expectedStores.forEach(storeId => {
        if (!storesWithData.has(storeId)) {
          currentFailedStores.add(storeId);
        }
      });

      // Determine if Klaviyo might be down (more than 2 stores failed OR both API calls failed)
      const bothApisFailed = allRecent.length === 0 && allUpcoming.length === 0 && allKlaviyoIds.length > 0;
      const tooManyStoresFailed = currentFailedStores.size > 2;

      if (bothApisFailed || tooManyStoresFailed) {
        setIsKlaviyoDown(true);
        console.warn('🔴 Klaviyo API might be down - too many failures detected');
      } else if (currentFailedStores.size > 0) {
        setFailedStores(currentFailedStores);
        console.warn('🟡 Some stores failed to fetch campaigns:', Array.from(currentFailedStores));
      }

      // Cache the results even if some failed (partial data is better than no data)
      const cacheData = {
        recent: processedRecent,
        upcoming: processedUpcoming,
        failedStores: currentFailedStores,
        isKlaviyoDown: bothApisFailed || tooManyStoresFailed
      };
      campaignCache.set(cacheData);

      console.log(`📦 Cached ${processedRecent.length} recent + ${processedUpcoming.length} upcoming campaigns`);
      if (currentFailedStores.size > 0) {
        console.log(`⚠️ ${currentFailedStores.size} stores failed to load campaigns`);
      }

      setRecentCampaigns(processedRecent);
      setUpcomingCampaigns(processedUpcoming);

    } catch (error) {
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('❌ Critical error fetching campaigns:', error);
        // Don't set this as a blocking error - just log it
        // The page should still load with empty campaign data
        setRecentCampaigns([]);
        setUpcomingCampaigns([]);
        setIsKlaviyoDown(true); // Assume Klaviyo is down if we get a critical error
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [allKlaviyoIdsString, stores]);

  // Fetch campaigns when stores change or cache expires
  useEffect(() => {
    fetchAllCampaigns();

    return () => {
      isMountedRef.current = false;
      // Don't abort - just mark as unmounted to prevent state updates
      // The abort will happen naturally when the component unmounts
      if (abortController.current) {
        abortController.current = null;
      }
    };
  }, [fetchAllCampaigns]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Filter cached campaigns by selected store IDs
   * This happens instantly without API calls
   */
  const getFilteredCampaigns = useCallback((selectedStoreIds) => {
    const cached = campaignCache.get();
    if (!cached) return { recent: [], upcoming: [] };

    // If "all" is selected or no selection, return all campaigns
    if (!selectedStoreIds || selectedStoreIds.length === 0 || selectedStoreIds.includes('all')) {
      return cached;
    }

    // Filter campaigns by selected store IDs
    const filteredRecent = cached.recent.filter(campaign => {
      return selectedStoreIds.includes(campaign.store_public_id) ||
             selectedStoreIds.includes(campaign.klaviyo_public_id);
    });

    const filteredUpcoming = cached.upcoming.filter(campaign => {
      return selectedStoreIds.includes(campaign.store_public_id) ||
             selectedStoreIds.includes(campaign.klaviyo_public_id);
    });

    console.log(`🔍 Filtered campaigns: ${filteredRecent.length} recent, ${filteredUpcoming.length} upcoming`);

    return {
      recent: filteredRecent,
      upcoming: filteredUpcoming
    };
  }, []);

  return {
    recentCampaigns,
    upcomingCampaigns,
    loading,
    error,
    failedStores,
    isKlaviyoDown,
    getFilteredCampaigns,
    refreshCampaigns: () => {
      campaignCache.clear();
      fetchAllCampaigns();
    }
  };
}

/**
 * Process and map campaign data to dashboard format
 */
function processCampaigns(campaigns, stores, type) {
  const now = new Date();

  return campaigns.map(campaign => {
    const sendTime = new Date(campaign.date || campaign.send_time || campaign.scheduled_at);

    // Find store by matching store_public_ids or klaviyo_public_id
    let campaignStore = null;
    const storePublicId = campaign.store_public_ids?.[0] || campaign.storeIds?.[0];
    if (storePublicId) {
      campaignStore = stores?.find(s => s.public_id === storePublicId);
    }
    if (!campaignStore && campaign.klaviyo_public_id) {
      campaignStore = stores?.find(s =>
        s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
      );
    }

    return {
      // Basic info
      id: campaign.campaignId || campaign.id || campaign._id,
      campaignId: campaign.campaignId || campaign.id,
      messageId: campaign.messageId || campaign.groupings?.campaign_message_id,
      name: campaign.name || campaign.campaign_name || 'Unnamed Campaign',
      subject: campaign.subject || campaign.subject_line || '',
      channel: campaign.channel || campaign.groupings?.send_channel || 'email',
      send_date: campaign.date || campaign.send_time || campaign.scheduled_at,

      // Store info
      store_public_id: storePublicId || campaignStore?.public_id || null,
      store_name: campaignStore?.name || campaign.storeName || 'Unknown Store',
      klaviyo_public_id: campaign.klaviyo_public_id,

      // Preserve groupings for modal preview
      groupings: campaign.groupings,

      // Performance metrics
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
      estimated_recipients: campaign.performance?.recipients || campaign.statistics?.recipients || 0,
      status: campaign.status || (type === 'upcoming' ? 'scheduled' : 'sent')
    };
  }).filter(campaign => {
    // Additional filtering based on type
    const sendTime = new Date(campaign.send_date);
    if (type === 'recent') {
      return sendTime <= now;
    } else if (type === 'upcoming') {
      return sendTime > now;
    }
    return true;
  }).sort((a, b) => {
    // Sort by date
    const dateA = new Date(a.send_date);
    const dateB = new Date(b.send_date);
    if (type === 'recent') {
      return dateB - dateA; // Most recent first
    } else {
      return dateA - dateB; // Soonest first
    }
  });
}
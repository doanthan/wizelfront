"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardCache } from '@/app/utils/DashboardCacheManager';

/**
 * Smart Dashboard Data Hook
 * Implements intelligent caching and subset filtering
 * to minimize API calls when changing store selections
 */
export function useDashboardData(storeIds, dateRange, comparison = null) {
  // Start with loading true if we have valid inputs that would trigger a fetch
  const hasValidInputs = storeIds && storeIds.length > 0 &&
                         dateRange && dateRange.start && dateRange.end;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(hasValidInputs);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({
    hit: false,
    type: null, // 'exact', 'subset', 'miss'
    filteredFrom: null
  });

  // Track the last fetch to prevent duplicate calls
  const lastFetchKey = useRef(null);
  const abortController = useRef(null);
  const isMountedRef = useRef(true);

  // Convert arrays and objects to stable strings for dependency comparison
  const stableStoreIds = JSON.stringify(storeIds);
  const stableDateRange = JSON.stringify(dateRange);
  const stableComparison = JSON.stringify(comparison);

  /**
   * Fetch data from API with caching logic
   */
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Parse the stable strings back to their original values
    const parsedStoreIds = JSON.parse(stableStoreIds);
    const parsedDateRange = JSON.parse(stableDateRange);
    const parsedComparison = JSON.parse(stableComparison);

    // Generate fetch key to prevent duplicate calls
    const fetchKey = dashboardCache.generateCacheKey(parsedStoreIds, parsedDateRange, parsedComparison);

    // Prevent duplicate fetches
    if (lastFetchKey.current === fetchKey && !forceRefresh) {
      console.log('⏭️ Skipping duplicate fetch for:', fetchKey);
      return;
    }

    // Cancel any in-flight requests
    if (abortController.current && !forceRefresh && !abortController.current.signal.aborted) {
      // Don't abort, just let the previous request complete
      // This prevents the "New request initiated" error
      console.log('🔄 Previous request still in progress, letting it complete');
      // Wait a bit for the previous request to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedEntry = dashboardCache.findUsableCache(
        parsedStoreIds,
        parsedDateRange,
        parsedComparison
      );

      if (cachedEntry) {
        // Check if we need to filter the cached data
        const isExactMatch = cachedEntry.storeIds.length === parsedStoreIds.length &&
          cachedEntry.storeIds.every(id => parsedStoreIds.includes(id));

        if (isExactMatch) {
          // Exact match - use as is
          console.log('✅ Using exact cache match');
          setData(cachedEntry.data);
          setCacheInfo({
            hit: true,
            type: 'exact',
            filteredFrom: null
          });
        } else {
          // Subset match - filter the cached data
          console.log('✅ Using filtered cache (subset of superset)');
          const filteredData = dashboardCache.filterCachedData(
            cachedEntry.data,
            parsedStoreIds
          );
          setData(filteredData);
          setCacheInfo({
            hit: true,
            type: 'subset',
            filteredFrom: cachedEntry.storeIds
          });
        }

        setError(null);
        lastFetchKey.current = fetchKey;
        return;
      }
    }

    // No cache hit or force refresh - fetch from API
    console.log('🌐 Fetching fresh data from API...');
    setLoading(true);
    setCacheInfo({
      hit: false,
      type: 'miss',
      filteredFrom: null
    });
    setError(null);

    try {
      // Create a new abort controller for this request
      const controller = new AbortController();
      abortController.current = controller;

      let response;
      try {
        response = await fetch('/api/dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeIds: parsedStoreIds,
            dateRange: parsedDateRange,
            comparison: parsedComparison,
            metrics: ['revenue', 'campaigns', 'flows', 'performance'],
            forceRefresh
          }),
          signal: controller.signal
        });
      } catch (err) {
        // Check if component was unmounted
        if (!isMountedRef.current) {
          return;
        }
        // Handle abort errors silently
        if (err.name === 'AbortError' || controller.signal.aborted) {
          return; // Exit silently for abort
        }
        throw err; // Re-throw other errors
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Check if still mounted before parsing response
      if (!isMountedRef.current) {
        return;
      }

      const responseData = await response.json();

      // Check again after async operation
      if (!isMountedRef.current) {
        return;
      }

      // Store in cache for future use
      dashboardCache.set(parsedStoreIds, parsedDateRange, parsedComparison, responseData);

      // Update state only if still mounted
      if (isMountedRef.current) {
        setData(responseData);
        setError(null);
        lastFetchKey.current = fetchKey;
      }

    } catch (err) {
      // Silently handle abort errors
      if (err?.name === 'AbortError') {
        return;
      }
      // Only log and set real errors
      if (err?.message && typeof err.message === 'string') {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      }
    } finally {
      // Only set loading false if the request wasn't aborted
      if (abortController.current && !abortController.current.signal.aborted) {
        setLoading(false);
      } else if (!abortController.current) {
        // If no abort controller, just set loading to false
        setLoading(false);
      }
      // Don't clear abort controller here, let the effect manage it
    }
  }, [stableStoreIds, stableDateRange, stableComparison]);

  // Set mounted ref on mount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Effect to fetch data when dependencies change
   */
  useEffect(() => {
    // Skip if no stores selected
    if (!storeIds || storeIds.length === 0) {
      setData(null);
      return;
    }

    // Skip if invalid date range
    if (!dateRange || !dateRange.start || !dateRange.end) {
      setData(null);
      return;
    }

    // Set a flag to track if this effect is still mounted
    let isMounted = true;

    // Fetch data
    const doFetch = async () => {
      if (isMounted) {
        await fetchData().catch(err => {
          // Silently catch any abort errors at the top level
          if (err?.name !== 'AbortError') {
            console.error('Dashboard fetch error:', err);
          }
        });
      }
    };

    doFetch();

    // Cleanup function
    return () => {
      isMounted = false;
      isMountedRef.current = false;
      // Mark the controller as aborted but don't actually abort
      // This prevents uncaught promise rejections
      if (abortController.current) {
        // Just null it out without aborting to prevent errors
        abortController.current = null;
      }
    };
  }, [fetchData]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    return fetchData(true);
  }, [fetchData]);

  /**
   * Clear cache for current selection
   */
  const clearCache = useCallback(() => {
    const parsedStoreIds = JSON.parse(stableStoreIds);
    const parsedDateRange = JSON.parse(stableDateRange);
    const parsedComparison = JSON.parse(stableComparison);
    dashboardCache.invalidate(parsedStoreIds, parsedDateRange, parsedComparison);
    console.log('🗑️ Cache cleared for current selection');
  }, [stableStoreIds, stableDateRange, stableComparison]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return dashboardCache.getStats();
  }, []);

  return {
    data,
    loading,
    error,
    cacheInfo,
    refresh,
    clearCache,
    getCacheStats
  };
}

/**
 * Hook for prefetching common store combinations
 */
export function useDashboardPrefetch(currentStores, dateRange) {
  const prefetchQueue = useRef(new Set());
  const prefetchTimeout = useRef(null);

  const prefetchCombinations = useCallback(async () => {
    // Don't prefetch if less than 2 stores selected
    if (currentStores.length < 2) return;

    // Get all available stores from session/context
    // This would need to be passed in or fetched from context
    const allStores = currentStores; // Simplified for now

    // If 1 store selected, prefetch combinations with other stores
    if (currentStores.length === 1) {
      // Prefetch combinations with up to 2 more stores
      const otherStores = allStores.filter(s => !currentStores.includes(s));

      otherStores.slice(0, 2).forEach(store => {
        const combination = [...currentStores, store].sort();
        queuePrefetch(combination, dateRange);
      });
    }

    // If 2 stores selected, prefetch the 3-store combination
    if (currentStores.length === 2) {
      const otherStores = allStores.filter(s => !currentStores.includes(s));

      if (otherStores.length > 0) {
        const combination = [...currentStores, otherStores[0]].sort();
        queuePrefetch(combination, dateRange);
      }
    }
  }, [currentStores, dateRange]);

  const queuePrefetch = (storeIds, dateRange) => {
    const key = dashboardCache.generateCacheKey(storeIds, dateRange);

    if (!prefetchQueue.current.has(key)) {
      prefetchQueue.current.add(key);

      // Debounce prefetch to avoid too many requests
      if (prefetchTimeout.current) {
        clearTimeout(prefetchTimeout.current);
      }

      prefetchTimeout.current = setTimeout(() => {
        performPrefetch(storeIds, dateRange);
      }, 2000); // Wait 2 seconds before prefetching
    }
  };

  const performPrefetch = async (storeIds, dateRange) => {
    // Check if already cached
    const existing = dashboardCache.findUsableCache(storeIds, dateRange);
    if (existing) {
      console.log('⏭️ Prefetch skipped (already cached):', storeIds);
      return;
    }

    console.log('🔮 Prefetching:', storeIds);

    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeIds,
          dateRange,
          metrics: ['revenue', 'campaigns', 'flows', 'performance'],
          prefetch: true // Indicate this is a prefetch request
        })
      });

      if (response.ok) {
        const data = await response.json();
        dashboardCache.set(storeIds, dateRange, null, data);
        console.log('✅ Prefetch complete:', storeIds);
      }
    } catch (error) {
      console.error('❌ Prefetch failed:', error);
    }
  };

  useEffect(() => {
    prefetchCombinations();

    return () => {
      if (prefetchTimeout.current) {
        clearTimeout(prefetchTimeout.current);
      }
    };
  }, [prefetchCombinations]);
}
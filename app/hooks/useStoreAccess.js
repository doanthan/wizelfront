/**
 * Client-side hook for store access management
 * Caches accessible stores to avoid repeated API calls
 */

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const CACHE_KEY = 'accessible_stores';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to manage accessible stores with caching
 * Only calls /api/store ONCE per session, then uses cached data
 */
export function useStoreAccess() {
  const { data: session, status } = useSession();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStores = useCallback(async (forceRefresh = false) => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    try {
      // Check cache first (unless forced refresh)
      if (!forceRefresh) {
        const cached = getCachedStores();
        if (cached) {
          setStores(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      // Fetch from API
      const response = await fetch('/api/store');
      if (!response.ok) {
        throw new Error('Failed to fetch accessible stores');
      }

      const data = await response.json();
      const storeList = data.stores || [];

      // Cache the result
      cacheStores(storeList);

      setStores(storeList);
      setError(null);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Load stores on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  /**
   * Check if user has access to a specific store
   */
  const hasAccessToStore = useCallback((storePublicId) => {
    return stores.some(store => store.public_id === storePublicId);
  }, [stores]);

  /**
   * Get store by public_id from cached list
   */
  const getStore = useCallback((storePublicId) => {
    return stores.find(store => store.public_id === storePublicId);
  }, [stores]);

  /**
   * Clear cache and refetch
   */
  const refresh = useCallback(() => {
    clearStoreCache();
    fetchStores(true);
  }, [fetchStores]);

  return {
    stores,
    loading,
    error,
    hasAccessToStore,
    getStore,
    refresh
  };
}

/**
 * Hook to check access to a specific store
 * Uses cached data to avoid API calls
 */
export function useStoreAccessCheck(storePublicId) {
  const { stores, loading, hasAccessToStore } = useStoreAccess();
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    if (!loading && storePublicId) {
      setHasAccess(hasAccessToStore(storePublicId));
    }
  }, [loading, storePublicId, hasAccessToStore]);

  return { hasAccess, loading };
}

// Cache helpers
function getCachedStores() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error reading store cache:', err);
    return null;
  }
}

function cacheStores(stores) {
  try {
    const cacheData = {
      data: stores,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Error caching stores:', err);
  }
}

function clearStoreCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    console.error('Error clearing store cache:', err);
  }
}

"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useStores } from './store-context'

const CampaignDataContext = createContext({})

// Cache configuration - simplified for account changes only
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes for account-specific cache
const MAX_CACHE_ENTRIES = 10 // Reduced cache entries

export function CampaignDataProvider({ children }) {
  const { stores } = useStores()
  
  // Simplified cache - only for preventing duplicate requests
  const [cache, setCache] = useState(new Map())

  // Loading states for different operations
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  /**
   * Generate a cache key from date range and account IDs
   * Format: "YYYY-MM-DD_YYYY-MM-DD_account1,account2,account3"
   */
  const generateCacheKey = useCallback((startDate, endDate, accountIds = []) => {
    const start = new Date(startDate).toISOString().split('T')[0]
    const end = new Date(endDate).toISOString().split('T')[0]
    const accounts = [...accountIds].sort().join(',') || 'all'
    return `${start}_${end}_${accounts}`
  }, [])

  /**
   * Check if cached data is still valid - only for same date range and accounts
   */
  const isCacheValid = useCallback((cacheEntry, forceRefresh = false) => {
    if (!cacheEntry || forceRefresh) return false
    // Never use cache for date changes or if explicitly refreshing
    return false // Disabled caching for now
  }, [])

  // Removed complex overlapping cache logic - not needed

  // Removed complex missing ranges calculation - always fetch full range

  /**
   * Fetch campaign data from API - always use ClickHouse
   */
  const fetchCampaignData = useCallback(async (startDate, endDate, accountIds = []) => {
    try {
      // Build query parameters - ALWAYS use ClickHouse endpoint
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        useClickHouse: 'true' // Force ClickHouse usage
      })

      // Pass store public IDs (not Klaviyo IDs) - API will convert them
      if (accountIds.length > 0 && !accountIds.includes('all')) {
        params.append('accountIds', accountIds.join(','))
      } else if (stores.length > 0) {
        // Use all store public IDs
        const allStoreIds = stores
          .filter(store => store.public_id)
          .map(store => store.public_id)
        params.append('accountIds', allStoreIds.join(','))
      }

      console.log('📊 Fetching from ClickHouse with params:', params.toString())
      const response = await fetch(`/api/analytics/campaigns?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ ClickHouse data received:', data.campaigns?.length, 'campaigns')
      return data
    } catch (error) {
      console.error('Error fetching campaign data:', error)
      throw error
    }
  }, [stores])

  // Removed merge function - not needed with simplified approach

  /**
   * Get campaign data - simplified version that always fetches fresh data
   */
  const getCampaignData = useCallback(async (startDate, endDate, accountIds = [], options = {}) => {
    const { forceRefresh = true } = options // Always force refresh for date changes

    const cacheKey = generateCacheKey(startDate, endDate, accountIds)
    const loadingKey = `${cacheKey}_loading`

    // Prevent duplicate requests for the exact same parameters
    if (loading[loadingKey]) {
      console.log('⏳ Request already in progress, waiting...')
      // Wait for existing request to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!loading[loadingKey]) {
            clearInterval(checkInterval)
            const entry = cache.get(cacheKey)
            if (entry) {
              resolve(entry.data)
            } else {
              reject(new Error('Failed to load data'))
            }
          }
        }, 100)

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Request timeout'))
        }, 30000)
      })
    }

    try {
      setLoading(prev => ({ ...prev, [loadingKey]: true }))
      setErrors(prev => ({ ...prev, [cacheKey]: null }))

      // Always fetch fresh data from ClickHouse
      console.log('🚀 Fetching fresh campaign data from ClickHouse')
      const data = await fetchCampaignData(startDate, endDate, accountIds)

      // Simple cache entry for deduplication only
      const newCacheEntry = {
        data,
        timestamp: Date.now(),
        dateRange: { start: startDate, end: endDate },
        accountIds
      }

      // Update cache
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.set(cacheKey, newCacheEntry)

        // Keep only recent entries
        if (newCache.size > MAX_CACHE_ENTRIES) {
          const entries = Array.from(newCache.entries())
            .sort((a, b) => b[1].timestamp - a[1].timestamp)
            .slice(0, MAX_CACHE_ENTRIES)
          return new Map(entries)
        }

        return newCache
      })

      console.log('✅ Campaign data loaded:', data.campaigns?.length, 'campaigns')
      return data

    } catch (error) {
      console.error('Error getting campaign data:', error)
      setErrors(prev => ({ ...prev, [cacheKey]: error.message }))
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }, [loading, generateCacheKey, fetchCampaignData])

  /**
   * Invalidate cache for specific date range or all cache
   */
  const invalidateCache = useCallback((startDate = null, endDate = null, accountIds = null) => {
    if (!startDate && !endDate) {
      // Clear all cache
      console.log('🗑️ Clearing all campaign cache')
      setCache(new Map())
      return
    }
    
    // Clear specific cache entries
    const keysToRemove = []
    cache.forEach((entry, key) => {
      if (accountIds) {
        const cacheAccounts = entry.accountIds?.sort().join(',') || 'all'
        const requestAccounts = accountIds?.sort().join(',') || 'all'
        if (cacheAccounts !== requestAccounts) return
      }
      
      if (startDate && endDate) {
        const cacheStart = new Date(entry.dateRange.start)
        const cacheEnd = new Date(entry.dateRange.end)
        const requestStart = new Date(startDate)
        const requestEnd = new Date(endDate)
        
        if (cacheStart <= requestEnd && cacheEnd >= requestStart) {
          keysToRemove.push(key)
        }
      }
    })
    
    if (keysToRemove.length > 0) {
      console.log('🗑️ Invalidating cache entries:', keysToRemove)
      setCache(prev => {
        const newCache = new Map(prev)
        keysToRemove.forEach(key => newCache.delete(key))
        return newCache
      })
    }
  }, [cache])

  // Removed background refresh - not needed with simplified approach

  // Removed unsubscribe - not needed

  // Provide cache statistics for debugging
  const getCacheStats = useCallback(() => {
    const stats = {
      entries: cache.size,
      totalSizeEstimate: 0,
      oldestEntry: null,
      newestEntry: null,
      activeSubscriptions: activeSubscriptions.current.size
    }
    
    let oldest = Infinity
    let newest = 0
    
    cache.forEach(entry => {
      stats.totalSizeEstimate += JSON.stringify(entry).length
      if (entry.timestamp < oldest) {
        oldest = entry.timestamp
        stats.oldestEntry = new Date(entry.timestamp).toISOString()
      }
      if (entry.timestamp > newest) {
        newest = entry.timestamp
        stats.newestEntry = new Date(entry.timestamp).toISOString()
      }
    })
    
    stats.totalSizeEstimate = `${(stats.totalSizeEstimate / 1024).toFixed(2)} KB`
    
    return stats
  }, [cache])

  const value = {
    getCampaignData,
    invalidateCache,
    getCacheStats,
    loading,
    errors,
    // Expose cache for debugging
    _cache: cache
  }

  return (
    <CampaignDataContext.Provider value={value}>
      {children}
    </CampaignDataContext.Provider>
  )
}

export function useCampaignData() {
  const context = useContext(CampaignDataContext)
  if (!context) {
    throw new Error('useCampaignData must be used within CampaignDataProvider')
  }
  return context
}
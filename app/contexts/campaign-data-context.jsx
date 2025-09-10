"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useStores } from './store-context'

const CampaignDataContext = createContext({})

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_ENTRIES = 50 // Maximum number of cache entries to prevent memory issues
const PREFETCH_BUFFER_DAYS = 7 // Prefetch X days before/after requested range

export function CampaignDataProvider({ children }) {
  const { stores } = useStores()
  
  // Main cache storage: Map of cacheKey -> { data, timestamp, dateRange, accountIds }
  const [cache, setCache] = useState(new Map())
  
  // Loading states for different operations
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  
  // Track active subscriptions to know what data to keep fresh
  const activeSubscriptions = useRef(new Set())
  
  // Background refresh timer
  const refreshTimer = useRef(null)

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
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((cacheEntry) => {
    if (!cacheEntry) return false
    const age = Date.now() - cacheEntry.timestamp
    return age < CACHE_TTL
  }, [])

  /**
   * Find overlapping cached date ranges
   * Returns array of cache entries that overlap with requested range
   */
  const findOverlappingCaches = useCallback((startDate, endDate, accountIds) => {
    const overlapping = []
    const requestStart = new Date(startDate)
    const requestEnd = new Date(endDate)
    
    cache.forEach((entry, key) => {
      // Check if accounts match
      const cacheAccounts = entry.accountIds?.sort().join(',') || 'all'
      const requestAccounts = accountIds?.sort().join(',') || 'all'
      if (cacheAccounts !== requestAccounts) return
      
      // Check if date ranges overlap
      const cacheStart = new Date(entry.dateRange.start)
      const cacheEnd = new Date(entry.dateRange.end)
      
      if (cacheStart <= requestEnd && cacheEnd >= requestStart) {
        overlapping.push(entry)
      }
    })
    
    return overlapping
  }, [cache])

  /**
   * Calculate missing date ranges that need to be fetched
   * Returns array of { start, end } date ranges not covered by cache
   */
  const calculateMissingRanges = useCallback((startDate, endDate, accountIds) => {
    const overlapping = findOverlappingCaches(startDate, endDate, accountIds)
    
    if (overlapping.length === 0) {
      // No cache, fetch entire range
      return [{ start: startDate, end: endDate }]
    }
    
    // Sort overlapping caches by start date
    overlapping.sort((a, b) => new Date(a.dateRange.start) - new Date(b.dateRange.start))
    
    const missing = []
    let currentStart = new Date(startDate)
    const requestEnd = new Date(endDate)
    
    for (const cache of overlapping) {
      const cacheStart = new Date(cache.dateRange.start)
      const cacheEnd = new Date(cache.dateRange.end)
      
      // Check if there's a gap before this cache entry
      if (currentStart < cacheStart) {
        missing.push({
          start: currentStart.toISOString(),
          end: new Date(Math.min(cacheStart - 1, requestEnd)).toISOString()
        })
      }
      
      // Move current pointer past this cache entry
      currentStart = new Date(Math.max(cacheEnd.getTime() + 86400000, currentStart.getTime())) // +1 day
    }
    
    // Check if there's a gap after the last cache entry
    if (currentStart <= requestEnd) {
      missing.push({
        start: currentStart.toISOString(),
        end: requestEnd.toISOString()
      })
    }
    
    return missing
  }, [findOverlappingCaches])

  /**
   * Fetch campaign data from API
   */
  const fetchCampaignData = useCallback(async (startDate, endDate, accountIds = []) => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      })
      
      if (accountIds.length > 0 && !accountIds.includes('all')) {
        params.append('accountIds', accountIds.join(','))
      } else if (stores.length > 0) {
        // Use all available store accounts
        const allAccountIds = stores
          .filter(store => store.klaviyo_integration?.public_id)
          .map(store => store.klaviyo_integration.public_id)
        params.append('accountIds', allAccountIds.join(','))
      }
      
      const response = await fetch(`/api/analytics/campaigns?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching campaign data:', error)
      throw error
    }
  }, [stores])

  /**
   * Merge multiple campaign datasets, removing duplicates
   */
  const mergeCampaignData = useCallback((datasets) => {
    const campaignMap = new Map()
    const aggregateStats = {
      totalCampaigns: 0,
      totalRecipients: 0,
      totalDelivered: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0
    }
    
    // Merge all campaigns, using ID as key to avoid duplicates
    datasets.forEach(dataset => {
      if (dataset?.campaigns) {
        dataset.campaigns.forEach(campaign => {
          const key = campaign.id || campaign.campaignId || `${campaign.name}_${campaign.sentAt}`
          if (!campaignMap.has(key)) {
            campaignMap.set(key, campaign)
          }
        })
      }
    })
    
    const mergedCampaigns = Array.from(campaignMap.values())
    
    // Recalculate aggregate stats
    mergedCampaigns.forEach(campaign => {
      aggregateStats.totalCampaigns++
      aggregateStats.totalRecipients += campaign.recipients || 0
      aggregateStats.totalDelivered += campaign.delivered || 0
      aggregateStats.totalOpens += campaign.opensUnique || 0
      aggregateStats.totalClicks += campaign.clicksUnique || 0
      aggregateStats.totalConversions += campaign.conversionUniques || 0
      aggregateStats.totalRevenue += campaign.revenue || 0
    })
    
    // Calculate weighted averages
    if (aggregateStats.totalDelivered > 0) {
      aggregateStats.averageOpenRate = (aggregateStats.totalOpens / aggregateStats.totalDelivered) * 100
      aggregateStats.averageClickRate = (aggregateStats.totalClicks / aggregateStats.totalDelivered) * 100
      aggregateStats.averageConversionRate = (aggregateStats.totalConversions / aggregateStats.totalDelivered) * 100
      aggregateStats.averageRevenuePerRecipient = aggregateStats.totalRevenue / aggregateStats.totalDelivered
    }
    
    return {
      campaigns: mergedCampaigns,
      aggregateStats,
      totalCount: mergedCampaigns.length
    }
  }, [])

  /**
   * Get campaign data with intelligent caching
   */
  const getCampaignData = useCallback(async (startDate, endDate, accountIds = [], options = {}) => {
    const { 
      forceRefresh = false, 
      prefetch = true,
      subscribe = true 
    } = options
    
    const cacheKey = generateCacheKey(startDate, endDate, accountIds)
    const loadingKey = `${cacheKey}_loading`
    
    // Register subscription if requested
    if (subscribe) {
      activeSubscriptions.current.add(cacheKey)
    }
    
    // Check for exact cache hit
    if (!forceRefresh) {
      const cachedEntry = cache.get(cacheKey)
      console.log('🔍 Cache check for:', cacheKey, {
        cacheExists: !!cachedEntry,
        isValid: cachedEntry ? isCacheValid(cachedEntry) : false,
        cacheAge: cachedEntry ? (Date.now() - cachedEntry.timestamp) / 1000 : 'N/A',
        maxAge: CACHE_TTL / 1000,
        totalCacheEntries: cache.size,
        allCacheKeys: Array.from(cache.keys())
      })
      
      if (cachedEntry && isCacheValid(cachedEntry)) {
        console.log('🎯 Cache HIT for:', cacheKey, 'returning', cachedEntry.data.campaigns?.length, 'campaigns')
        return { ...cachedEntry.data, fromCache: true, cacheHit: true }
      } else if (cachedEntry) {
        console.log('❌ Cache EXPIRED for:', cacheKey, 'age:', (Date.now() - cachedEntry.timestamp) / 1000, 'seconds')
      } else {
        console.log('❌ Cache MISS for:', cacheKey, 'not found in cache')
      }
    }
    
    // Prevent duplicate requests
    if (loading[loadingKey]) {
      console.log('⏳ Request already in progress for:', cacheKey)
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
      })
    }
    
    try {
      setLoading(prev => ({ ...prev, [loadingKey]: true }))
      setErrors(prev => ({ ...prev, [cacheKey]: null }))
      
      // Calculate what data we need to fetch
      const missingRanges = forceRefresh 
        ? [{ start: startDate, end: endDate }]
        : calculateMissingRanges(startDate, endDate, accountIds)
      
      console.log('📊 Missing ranges to fetch:', missingRanges)
      
      // Fetch missing data in parallel
      const fetchPromises = missingRanges.map(range => 
        fetchCampaignData(range.start, range.end, accountIds)
      )
      
      // Get existing overlapping data
      const existingData = forceRefresh 
        ? []
        : findOverlappingCaches(startDate, endDate, accountIds)
          .filter(entry => isCacheValid(entry))
          .map(entry => entry.data)
      
      // Wait for all fetches to complete
      const newDatasets = await Promise.all(fetchPromises)
      
      // Merge all data (existing + new)
      const mergedData = mergeCampaignData([...existingData, ...newDatasets])
      
      // Update cache with new entry
      const newCacheEntry = {
        data: mergedData,
        timestamp: Date.now(),
        dateRange: { start: startDate, end: endDate },
        accountIds
      }
      
      setCache(prev => {
        const newCache = new Map(prev)
        
        // Add new entry
        newCache.set(cacheKey, newCacheEntry)
        
        // Clean up old entries if cache is too large
        if (newCache.size > MAX_CACHE_ENTRIES) {
          // Remove oldest entries
          const entries = Array.from(newCache.entries())
            .sort((a, b) => b[1].timestamp - a[1].timestamp)
            .slice(0, MAX_CACHE_ENTRIES)
          return new Map(entries)
        }
        
        return newCache
      })
      
      // Prefetch adjacent date ranges if requested
      if (prefetch && !forceRefresh) {
        const prefetchStart = new Date(startDate)
        const prefetchEnd = new Date(endDate)
        prefetchStart.setDate(prefetchStart.getDate() - PREFETCH_BUFFER_DAYS)
        prefetchEnd.setDate(prefetchEnd.getDate() + PREFETCH_BUFFER_DAYS)
        
        // Prefetch in background (don't await)
        setTimeout(() => {
          getCampaignData(
            prefetchStart.toISOString(), 
            prefetchEnd.toISOString(), 
            accountIds,
            { prefetch: false, subscribe: false }
          ).catch(console.error)
        }, 1000)
      }
      
      console.log('✅ Campaign data loaded and cached:', cacheKey)
      return mergedData
      
    } catch (error) {
      console.error('Error getting campaign data:', error)
      setErrors(prev => ({ ...prev, [cacheKey]: error.message }))
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }, [cache, loading, generateCacheKey, isCacheValid, calculateMissingRanges, fetchCampaignData, findOverlappingCaches, mergeCampaignData])

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

  /**
   * Background refresh for active subscriptions
   */
  useEffect(() => {
    const refreshActiveSubscriptions = () => {
      activeSubscriptions.current.forEach(cacheKey => {
        const entry = cache.get(cacheKey)
        if (entry && !isCacheValid(entry)) {
          console.log('🔄 Background refresh for:', cacheKey)
          getCampaignData(
            entry.dateRange.start,
            entry.dateRange.end,
            entry.accountIds,
            { forceRefresh: true, subscribe: false }
          ).catch(console.error)
        }
      })
    }
    
    // Set up periodic refresh
    refreshTimer.current = setInterval(refreshActiveSubscriptions, 60000) // Check every minute
    
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current)
      }
    }
  }, [cache, isCacheValid, getCampaignData])

  /**
   * Cleanup inactive subscriptions
   */
  const unsubscribe = useCallback((startDate, endDate, accountIds) => {
    const cacheKey = generateCacheKey(startDate, endDate, accountIds)
    activeSubscriptions.current.delete(cacheKey)
  }, [generateCacheKey])

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
    unsubscribe,
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
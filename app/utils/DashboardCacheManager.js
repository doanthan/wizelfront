/**
 * Smart Dashboard Cache Manager
 * Implements hierarchical caching strategy with subset filtering
 * to minimize API calls when narrowing store selections
 */

export class DashboardCacheManager {
  constructor() {
    this.cache = new Map();
    this.maxAge = 10 * 60 * 1000; // 10 minutes cache TTL (data updates every 15 mins)
    this.derivedCache = new Map(); // For filtered subsets
  }

  /**
   * Generate a unique cache key for the request
   */
  generateCacheKey(storeIds, dateRange, comparison = null) {
    const sortedStores = [...storeIds].sort().join(',');

    // Normalize dates to ISO strings for consistent cache keys
    const startDate = dateRange.start instanceof Date
      ? dateRange.start.toISOString()
      : dateRange.start;
    const endDate = dateRange.end instanceof Date
      ? dateRange.end.toISOString()
      : dateRange.end;

    const dateKey = `${startDate}:${endDate}`;

    let compKey = 'none';
    if (comparison && comparison.start && comparison.end) {
      const compStart = comparison.start instanceof Date
        ? comparison.start.toISOString()
        : comparison.start;
      const compEnd = comparison.end instanceof Date
        ? comparison.end.toISOString()
        : comparison.end;
      compKey = `${compStart}:${compEnd}`;
    }

    const key = `${sortedStores}|${dateKey}|${compKey}`;
    console.log('📦 Generated cache key:', key);
    return key;
  }

  /**
   * Check if cached entry contains all requested data
   */
  canUseCache(requestedStores, requestedDateRange, cachedEntry) {
    // Check if all requested stores exist in cached data
    const hasAllStores = requestedStores.every(store =>
      cachedEntry.storeIds.includes(store)
    );

    // Normalize dates for comparison
    const normalizeDate = (date) => date instanceof Date ? date.toISOString() : date;

    // Check if date ranges match
    const sameDateRange =
      normalizeDate(requestedDateRange.start) === normalizeDate(cachedEntry.dateRange.start) &&
      normalizeDate(requestedDateRange.end) === normalizeDate(cachedEntry.dateRange.end);

    // Check if cache is not expired
    const notExpired = Date.now() - cachedEntry.timestamp < this.maxAge;

    console.log('📦 Cache check:', {
      hasAllStores,
      sameDateRange,
      notExpired,
      requestedStart: normalizeDate(requestedDateRange.start),
      cachedStart: normalizeDate(cachedEntry.dateRange.start),
      requestedEnd: normalizeDate(requestedDateRange.end),
      cachedEnd: normalizeDate(cachedEntry.dateRange.end)
    });

    return hasAllStores && sameDateRange && notExpired;
  }

  /**
   * Find any cached entry that contains the requested data
   */
  findUsableCache(storeIds, dateRange, comparison = null) {
    // First check for exact match
    const exactKey = this.generateCacheKey(storeIds, dateRange, comparison);
    if (this.cache.has(exactKey)) {
      const entry = this.cache.get(exactKey);
      if (Date.now() - entry.timestamp < this.maxAge) {
        console.log('📦 Cache hit (exact match):', exactKey);
        return entry;
      }
    }

    // Check for superset cache that contains requested data
    for (const [key, entry] of this.cache) {
      if (this.canUseCache(storeIds, dateRange, entry)) {
        console.log('📦 Cache hit (superset):', key, '→', exactKey);
        return entry;
      }
    }

    console.log('📦 Cache miss for:', exactKey);
    return null;
  }

  /**
   * Filter cached data to only include requested stores
   */
  filterCachedData(cachedData, requestedStores) {
    // Create a derived cache key
    const derivedKey = requestedStores.sort().join(',');

    // Debug logging
    console.log('📦 Filtering cached data:', {
      requestedStores,
      cachedAccounts: cachedData.byAccount?.length || 0,
      firstAccount: cachedData.byAccount?.[0],
      accountStoreIds: cachedData.byAccount?.map(a => a.store_public_id || a.storePublicId || 'unknown'),
      summaryBefore: cachedData.summary
    });

    // Filter by-account data
    // The byAccount data uses store_public_id from the API
    const filteredAccounts = cachedData.byAccount?.filter(account =>
      requestedStores.includes(account.store_public_id || account.storePublicId || account.public_id)
    ) || [];

    console.log('📦 Filtered accounts:', {
      count: filteredAccounts.length,
      accounts: filteredAccounts.map(a => ({
        store_public_id: a.store_public_id,
        revenue: a.revenue,
        orders: a.orders
      }))
    });

    // Recalculate summary metrics
    const newSummary = this.recalculateSummary(filteredAccounts, cachedData);

    console.log('📦 Recalculated summary:', newSummary);

    // Return filtered data structure
    return {
      ...cachedData,
      byAccount: filteredAccounts,

      // Filter campaigns
      campaigns: this.filterCampaigns(cachedData.campaigns, requestedStores),

      // Filter flows
      flows: this.filterFlows(cachedData.flows, requestedStores),

      // Use recalculated summary
      summary: newSummary,

      // Filter timeSeries data stays the same (it's aggregate for all selected stores)
      timeSeries: cachedData.timeSeries,

      // Keep comparison data if it exists
      comparison: cachedData.comparison ? {
        ...cachedData.comparison,
        byAccount: cachedData.comparison.byAccount?.filter(account =>
          requestedStores.includes(account.store_public_id || account.storePublicId || account.public_id)
        ) || []
      } : null,

      // Metadata
      fromCache: true,
      filteredFrom: cachedData.storeIds,
      filteredTo: requestedStores
    };
  }

  /**
   * Filter campaigns for requested stores
   */
  filterCampaigns(campaigns = [], requestedStores) {
    if (!campaigns || !Array.isArray(campaigns)) return [];

    // Campaigns use store_public_id for filtering
    const filtered = campaigns.filter(campaign =>
      requestedStores.includes(campaign.storePublicId || campaign.store_public_id || campaign.storeId)
    );

    // Re-sort by performance
    return filtered.sort((a, b) => {
      const metricA = a.revenue || 0;
      const metricB = b.revenue || 0;
      return metricB - metricA;
    }).slice(0, 10); // Top 10 campaigns
  }

  /**
   * Filter flows for requested stores
   */
  filterFlows(flows = [], requestedStores) {
    if (!flows || !Array.isArray(flows)) return [];

    // Flows use store_public_id for filtering
    return flows.filter(flow =>
      requestedStores.includes(flow.storePublicId || flow.store_public_id || flow.storeId)
    ).slice(0, 10); // Top 10 flows
  }

  /**
   * Recalculate summary metrics from filtered accounts
   */
  recalculateSummary(filteredAccounts, originalData) {
    console.log('📦 recalculateSummary input:', {
      filteredAccountsCount: filteredAccounts?.length || 0,
      firstFilteredAccount: filteredAccounts?.[0],
      originalSummary: originalData?.summary
    });

    if (!filteredAccounts || filteredAccounts.length === 0) {
      return {
        totalRevenue: 0,
        attributedRevenue: 0,
        totalOrders: 0,
        uniqueCustomers: 0,
        avgOrderValue: 0,
        newCustomers: 0,
        returningCustomers: 0,
        revenueChange: originalData?.summary?.revenueChange || 0,
        ordersChange: originalData?.summary?.ordersChange || 0,
        customersChange: originalData?.summary?.customersChange || 0,
        avgOrderValueChange: originalData?.summary?.avgOrderValueChange || 0
      };
    }

    // Calculate totals from filtered accounts
    const totalRevenue = filteredAccounts.reduce((sum, a) => {
      const revenue = parseFloat(a.revenue) || 0;
      console.log(`Account ${a.store_public_id}: revenue = ${revenue}`);
      return sum + revenue;
    }, 0);

    const totalOrders = filteredAccounts.reduce((sum, a) => {
      const orders = parseInt(a.orders) || 0;
      console.log(`Account ${a.store_public_id}: orders = ${orders}`);
      return sum + orders;
    }, 0);

    const totalCustomers = filteredAccounts.reduce((sum, a) => {
      const customers = parseInt(a.customers) || 0;
      console.log(`Account ${a.store_public_id}: customers = ${customers}`);
      return sum + customers;
    }, 0);

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // For attributed revenue, we need to calculate the proportion
    // If we have the original data, calculate the proportion of filtered accounts
    let attributedRevenue = totalRevenue * 0.7; // Default estimate
    if (originalData?.summary?.attributedRevenue && originalData?.summary?.totalRevenue > 0) {
      const attributionRate = originalData.summary.attributedRevenue / originalData.summary.totalRevenue;
      attributedRevenue = totalRevenue * attributionRate;
    }

    // For new/returning customers, aggregate from accounts if available
    // Otherwise, estimate based on proportion
    let newCustomers = 0;
    let returningCustomers = 0;

    // Check if accounts have this data
    const hasCustomerBreakdown = filteredAccounts.some(a => a.newCustomers !== undefined || a.returningCustomers !== undefined);

    if (hasCustomerBreakdown) {
      newCustomers = filteredAccounts.reduce((sum, a) =>
        sum + (parseInt(a.newCustomers) || 0), 0
      );
      returningCustomers = filteredAccounts.reduce((sum, a) =>
        sum + (parseInt(a.returningCustomers) || 0), 0
      );
    } else if (originalData?.summary?.newCustomers && originalData?.summary?.uniqueCustomers > 0) {
      // Estimate based on proportion
      const proportion = totalCustomers / originalData.summary.uniqueCustomers;
      newCustomers = Math.round(originalData.summary.newCustomers * proportion);
      returningCustomers = Math.round(originalData.summary.returningCustomers * proportion);
    }

    // Keep percentage changes from original data if they exist
    // These are calculated at the API level with comparison periods
    const result = {
      totalRevenue,
      attributedRevenue,
      totalOrders,
      uniqueCustomers: totalCustomers,
      avgOrderValue,
      newCustomers,
      returningCustomers,
      // Preserve the change percentages from the original data
      revenueChange: originalData?.summary?.revenueChange || null,
      ordersChange: originalData?.summary?.ordersChange || null,
      customersChange: originalData?.summary?.customersChange || null,
      avgOrderValueChange: originalData?.summary?.avgOrderValueChange || null,
      attributedRevenueChange: originalData?.summary?.attributedRevenueChange || null,
      newCustomersChange: originalData?.summary?.newCustomersChange || null,
      noComparisonData: originalData?.summary?.noComparisonData || false
    };

    console.log('📦 recalculateSummary result:', result);
    return result;
  }

  /**
   * Store data in cache
   */
  set(storeIds, dateRange, comparison, data) {
    const key = this.generateCacheKey(storeIds, dateRange, comparison);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      storeIds,
      dateRange,
      comparison
    });

    console.log('📦 Cached data for:', key);

    // Cleanup old entries
    this.cleanup();
  }

  /**
   * Clear specific cache entry
   */
  invalidate(storeIds, dateRange, comparison = null) {
    const key = this.generateCacheKey(storeIds, dateRange, comparison);
    this.cache.delete(key);
    console.log('🗑️ Cache invalidated:', key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.derivedCache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        console.log('🗑️ Expired cache removed:', key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough)
   */
  estimateMemoryUsage() {
    let bytes = 0;
    for (const [key, value] of this.cache) {
      bytes += key.length * 2; // Rough estimate for string
      bytes += JSON.stringify(value).length * 2; // Rough estimate for data
    }
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}

// Export singleton instance
export const dashboardCache = new DashboardCacheManager();
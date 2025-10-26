/**
 * Klaviyo MCP Server Client
 *
 * Provides real-time access to Klaviyo API data via MCP protocol
 * Used for live data that complements ClickHouse historical analytics
 *
 * @see https://developers.klaviyo.com/en/docs/klaviyo_mcp_server
 */

import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';

/**
 * MCP Server endpoints mapped to Klaviyo API
 */
const MCP_ENDPOINTS = {
  // Accounts
  getAccountDetails: 'get_account_details',

  // Catalogs
  getCatalogItems: 'get_catalog_items',

  // Events & Metrics
  getEvents: 'get_events',
  getMetrics: 'get_metrics',
  getMetric: 'get_metric',

  // Flows
  getFlows: 'get_flows',
  getFlow: 'get_flow',

  // Lists & Segments
  getLists: 'get_lists',
  getList: 'get_list',
  getSegments: 'get_segments',
  getSegment: 'get_segment',

  // Profiles
  getProfiles: 'get_profiles',
  getProfile: 'get_profile',
  createProfile: 'create_profile',
  updateProfile: 'update_profile',

  // Reporting
  getCampaignReport: 'get_campaign_report',
  getFlowReport: 'get_flow_report',
};

/**
 * Rate limits for MCP requests (respect Klaviyo API limits)
 */
const RATE_LIMITS = {
  burst: 10,    // 10 requests per second
  steady: 150,  // 150 requests per minute
};

/**
 * Cache for MCP responses to reduce API calls
 */
const mcpCache = new Map();
const CACHE_TTL = {
  account: 3600000,      // 1 hour
  lists: 300000,         // 5 minutes
  segments: 300000,      // 5 minutes
  flows: 600000,         // 10 minutes
  metrics: 600000,       // 10 minutes
  profiles: 60000,       // 1 minute (profiles change frequently)
  reports: 300000,       // 5 minutes
  catalogItems: 3600000, // 1 hour
};

/**
 * Get cache key for MCP request
 */
function getCacheKey(endpoint, params, klaviyoPublicId) {
  return `${klaviyoPublicId}:${endpoint}:${JSON.stringify(params)}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry, ttl) {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < ttl;
}

/**
 * Base MCP request function
 *
 * @param {string} endpoint - MCP endpoint name
 * @param {object} params - Request parameters
 * @param {object} store - Store object with klaviyo_integration
 * @param {object} options - Additional options (cache, debug)
 */
async function mcpRequest(endpoint, params = {}, store, options = {}) {
  const { useCache = true, debug = false, cacheTTL } = options;

  // Validate store
  if (!store?.klaviyo_integration?.public_id) {
    throw new Error('Store must have Klaviyo integration configured');
  }

  const klaviyoPublicId = store.klaviyo_integration.public_id;

  // Check cache
  if (useCache) {
    const cacheKey = getCacheKey(endpoint, params, klaviyoPublicId);
    const cached = mcpCache.get(cacheKey);

    // Determine TTL based on endpoint type
    const ttl = cacheTTL || determineTTL(endpoint);

    if (isCacheValid(cached, ttl)) {
      if (debug) console.log(`🎯 MCP Cache HIT: ${endpoint}`, params);
      return cached.data;
    }
  }

  if (debug) {
    console.log(`🔵 MCP Request: ${endpoint}`, {
      params,
      klaviyoPublicId,
      store: store.name
    });
  }

  // Build auth options (OAuth-first)
  const authOptions = buildKlaviyoAuthOptions(store);

  try {
    // Make request to our MCP proxy endpoint
    const response = await fetch('/api/mcp/klaviyo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        params,
        klaviyoPublicId,
        authOptions
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `MCP request failed: ${response.status}`);
    }

    const data = await response.json();

    // Cache successful response
    if (useCache) {
      const cacheKey = getCacheKey(endpoint, params, klaviyoPublicId);
      mcpCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    if (debug) {
      console.log(`✅ MCP Response: ${endpoint}`, {
        dataSize: JSON.stringify(data).length,
        cached: useCache
      });
    }

    return data;
  } catch (error) {
    console.error(`❌ MCP Error: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Determine cache TTL based on endpoint
 */
function determineTTL(endpoint) {
  if (endpoint.includes('account')) return CACHE_TTL.account;
  if (endpoint.includes('list')) return CACHE_TTL.lists;
  if (endpoint.includes('segment')) return CACHE_TTL.segments;
  if (endpoint.includes('flow')) return CACHE_TTL.flows;
  if (endpoint.includes('metric')) return CACHE_TTL.metrics;
  if (endpoint.includes('profile')) return CACHE_TTL.profiles;
  if (endpoint.includes('report')) return CACHE_TTL.reports;
  if (endpoint.includes('catalog')) return CACHE_TTL.catalogItems;

  return 300000; // Default 5 minutes
}

/**
 * Clear cache for specific store or all
 */
export function clearMCPCache(klaviyoPublicId = null) {
  if (klaviyoPublicId) {
    // Clear cache for specific account
    for (const [key] of mcpCache) {
      if (key.startsWith(`${klaviyoPublicId}:`)) {
        mcpCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    mcpCache.clear();
  }
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Get account details
 */
export async function getAccountDetails(store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getAccountDetails, {}, store, options);
}

/**
 * Get all lists for an account
 */
export async function getLists(store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getLists, {}, store, {
    ...options,
    cacheTTL: CACHE_TTL.lists
  });
}

/**
 * Get specific list details
 */
export async function getList(listId, store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getList, { list_id: listId }, store, options);
}

/**
 * Get all segments for an account
 */
export async function getSegments(store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getSegments, {}, store, {
    ...options,
    cacheTTL: CACHE_TTL.segments
  });
}

/**
 * Get specific segment details including profile count
 */
export async function getSegment(segmentId, store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getSegment, {
    segment_id: segmentId
  }, store, options);
}

/**
 * Get all flows
 */
export async function getFlows(store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getFlows, {}, store, {
    ...options,
    cacheTTL: CACHE_TTL.flows
  });
}

/**
 * Get specific flow details
 */
export async function getFlow(flowId, store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getFlow, { flow_id: flowId }, store, options);
}

/**
 * Get event metrics
 */
export async function getMetrics(store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getMetrics, {}, store, {
    ...options,
    cacheTTL: CACHE_TTL.metrics
  });
}

/**
 * Get specific metric details
 */
export async function getMetric(metricId, store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getMetric, { metric_id: metricId }, store, options);
}

/**
 * Get profiles (with pagination)
 */
export async function getProfiles(store, options = {}) {
  const { pageSize = 100, cursor = null, ...otherOptions } = options;

  return mcpRequest(MCP_ENDPOINTS.getProfiles, {
    page_size: pageSize,
    ...(cursor && { page_cursor: cursor })
  }, store, {
    ...otherOptions,
    cacheTTL: CACHE_TTL.profiles
  });
}

/**
 * Get specific profile details
 */
export async function getProfile(profileId, store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getProfile, {
    profile_id: profileId
  }, store, {
    ...options,
    cacheTTL: CACHE_TTL.profiles
  });
}

/**
 * Get campaign report (real-time)
 */
export async function getCampaignReport(campaignId, store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getCampaignReport, {
    campaign_id: campaignId
  }, store, {
    ...options,
    cacheTTL: CACHE_TTL.reports
  });
}

/**
 * Get flow report (real-time)
 */
export async function getFlowReport(flowId, store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getFlowReport, {
    flow_id: flowId
  }, store, {
    ...options,
    cacheTTL: CACHE_TTL.reports
  });
}

/**
 * Get catalog items
 */
export async function getCatalogItems(store, options = {}) {
  return mcpRequest(MCP_ENDPOINTS.getCatalogItems, {}, store, {
    ...options,
    cacheTTL: CACHE_TTL.catalogItems
  });
}

/**
 * Get events
 */
export async function getEvents(store, options = {}) {
  const { pageSize = 100, cursor = null, metricId = null, ...otherOptions } = options;

  return mcpRequest(MCP_ENDPOINTS.getEvents, {
    page_size: pageSize,
    ...(cursor && { page_cursor: cursor }),
    ...(metricId && { metric_id: metricId })
  }, store, otherOptions);
}

// ============================================================================
// MULTI-ACCOUNT HELPERS
// ============================================================================

/**
 * Get lists for multiple stores (parallel requests)
 */
export async function getListsForStores(stores, options = {}) {
  const promises = stores.map(store =>
    getLists(store, options).catch(err => ({
      error: err.message,
      store: store.public_id
    }))
  );

  const results = await Promise.all(promises);

  return stores.map((store, index) => ({
    store_public_id: store.public_id,
    store_name: store.name,
    klaviyo_public_id: store.klaviyo_integration?.public_id,
    lists: results[index]?.data || [],
    error: results[index]?.error || null
  }));
}

/**
 * Get segments for multiple stores (parallel requests)
 */
export async function getSegmentsForStores(stores, options = {}) {
  const promises = stores.map(store =>
    getSegments(store, options).catch(err => ({
      error: err.message,
      store: store.public_id
    }))
  );

  const results = await Promise.all(promises);

  return stores.map((store, index) => ({
    store_public_id: store.public_id,
    store_name: store.name,
    klaviyo_public_id: store.klaviyo_integration?.public_id,
    segments: results[index]?.data || [],
    error: results[index]?.error || null
  }));
}

/**
 * Get flows for multiple stores (parallel requests)
 */
export async function getFlowsForStores(stores, options = {}) {
  const promises = stores.map(store =>
    getFlows(store, options).catch(err => ({
      error: err.message,
      store: store.public_id
    }))
  );

  const results = await Promise.all(promises);

  return stores.map((store, index) => ({
    store_public_id: store.public_id,
    store_name: store.name,
    klaviyo_public_id: store.klaviyo_integration?.public_id,
    flows: results[index]?.data || [],
    error: results[index]?.error || null
  }));
}

export default {
  // Account
  getAccountDetails,

  // Lists & Segments
  getLists,
  getList,
  getSegments,
  getSegment,

  // Flows
  getFlows,
  getFlow,

  // Metrics & Events
  getMetrics,
  getMetric,
  getEvents,

  // Profiles
  getProfiles,
  getProfile,

  // Reports
  getCampaignReport,
  getFlowReport,

  // Catalog
  getCatalogItems,

  // Multi-account
  getListsForStores,
  getSegmentsForStores,
  getFlowsForStores,

  // Cache management
  clearMCPCache
};

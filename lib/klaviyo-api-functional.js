/**
 * Klaviyo API Client (Functional Version)
 * Supports both API Keys and OAuth Bearer tokens with automatic refresh
 * OAuth Documentation: https://developers.klaviyo.com/en/docs/set_up_oauth
 */

const BASE_URL = 'https://a.klaviyo.com/api/';
const OAUTH_TOKEN_URL = 'https://a.klaviyo.com/oauth/token';
const API_REVISION = process.env.KLAVIYO_REVISION;

/**
 * Create a token manager for OAuth tokens (functional approach)
 */
const createTokenManager = (clientId, clientSecret, refreshToken) => {
  // Private state using closure
  let state = {
    clientId,
    clientSecret,
    refreshToken,
    accessToken: null,
    tokenExpiry: null
  };

  const getBasicAuth = () => {
    return Buffer.from(`${state.clientId}:${state.clientSecret}`).toString('base64');
  };

  const isTokenExpired = () => {
    if (!state.tokenExpiry) return true;
    const now = Date.now();
    const expiryTime = state.tokenExpiry - (5 * 60 * 1000); // 5 minutes buffer
    return now >= expiryTime;
  };

  const refreshAccessToken = async () => {
    if (!state.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getBasicAuth()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: state.refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh token: ${response.status} ${error}`);
      }

      const data = await response.json();
      
      state.accessToken = data.access_token;
      state.refreshToken = data.refresh_token || state.refreshToken;
      
      if (data.expires_in) {
        state.tokenExpiry = Date.now() + (data.expires_in * 1000);
      }

      console.log('Access token refreshed successfully');
      return state.accessToken;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  const getAccessToken = async () => {
    if (isTokenExpired()) {
      await refreshAccessToken();
    }
    return state.accessToken;
  };

  const setTokens = (accessToken, refreshTokenParam, expiresIn) => {
    state.accessToken = accessToken;
    if (refreshTokenParam) {
      state.refreshToken = refreshTokenParam;
    }
    if (expiresIn) {
      state.tokenExpiry = Date.now() + (expiresIn * 1000);
    }
  };

  // Return public interface
  return {
    getAccessToken,
    setTokens,
    refreshAccessToken,
    isTokenExpired
  };
};

/**
 * Create a rate limiter for Klaviyo API endpoints (functional approach)
 */
const createRateLimiter = (burstLimit = 75, steadyLimit = 700) => {
  // Private state
  let state = {
    burstLimit,
    steadyLimit,
    burstWindow: 3000, // 3 seconds
    steadyWindow: 60000, // 60 seconds
    burstRequests: [],
    steadyRequests: []
  };

  const waitIfNeeded = async () => {
    const now = Date.now();
    
    // Clean old requests
    state.burstRequests = state.burstRequests.filter(t => now - t < state.burstWindow);
    state.steadyRequests = state.steadyRequests.filter(t => now - t < state.steadyWindow);
    
    // Calculate wait time
    let waitTime = 0;
    
    if (state.burstRequests.length >= state.burstLimit) {
      const oldestBurst = Math.min(...state.burstRequests);
      waitTime = Math.max(waitTime, state.burstWindow - (now - oldestBurst) + 100);
    }
    
    if (state.steadyRequests.length >= state.steadyLimit) {
      const oldestSteady = Math.min(...state.steadyRequests);
      waitTime = Math.max(waitTime, state.steadyWindow - (now - oldestSteady) + 100);
    }
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Record this request
    state.burstRequests.push(Date.now());
    state.steadyRequests.push(Date.now());
  };

  return { waitIfNeeded };
};

// Cache managers using Maps (module-level state)
const rateLimitersCache = new Map();
const tokenManagersCache = new Map();

/**
 * Get or create token manager (functional version)
 */
const getTokenManager = (clientId, clientSecret, refreshToken) => {
  const key = clientId;
  if (!tokenManagersCache.has(key)) {
    tokenManagersCache.set(key, createTokenManager(clientId, clientSecret, refreshToken));
  }
  return tokenManagersCache.get(key);
};

/**
 * Get or create rate limiter (functional version)
 */
const getRateLimiter = (burstLimit = 75, steadyLimit = 700) => {
  const key = `${burstLimit}-${steadyLimit}`;
  if (!rateLimitersCache.has(key)) {
    rateLimitersCache.set(key, createRateLimiter(burstLimit, steadyLimit));
  }
  return rateLimitersCache.get(key);
};

/**
 * Get rate limits for specific endpoints
 */
const getEndpointLimits = (endpoint) => {
  if (endpoint.includes('/events')) {
    return { burst: 350, steady: 3500 };
  }
  if (endpoint.includes('/flows')) {
    return { burst: 3, steady: 60 };
  }
  if (endpoint.includes('/metric-aggregates')) {
    return { burst: 3, steady: 60 };
  }
  if (endpoint.includes('/lists') || endpoint.includes('/segments')) {
    return { burst: 10, steady: 150 };
  }
  if (endpoint.includes('/campaigns')) {
    return { burst: 10, steady: 150 };
  }
  if (endpoint.includes('/metrics')) {
    return { burst: 10, steady: 150 };
  }
  return { burst: 75, steady: 700 };
};

/**
 * Build Klaviyo headers based on auth type
 */
const getKlaviyoHeaders = (auth, isOAuth = false) => {
  if (!auth) {
    throw new Error('Authentication required: provide apiKey or accessToken');
  }
  
  const headers = {
    'revision': API_REVISION,
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/json',
  };

  // Determine auth type
  if (isOAuth || !auth.startsWith('pk_')) {
    headers['Authorization'] = `Bearer ${auth}`;
  } else {
    headers['Authorization'] = `Klaviyo-API-Key ${auth}`;
  }

  return headers;
};

/**
 * Generic Klaviyo API request function with rate limiting and OAuth support
 */
export const klaviyoRequest = async (method, endpoint, options = {}) => {
  const { 
    apiKey,
    accessToken,
    clientId,
    clientSecret,
    refreshToken,
    payload, 
    burstLimit, 
    steadyLimit,
    skipRateLimit = false,
    maxRetries = 3 
  } = options;
  
  // Determine authentication method
  let auth = apiKey || accessToken;
  let isOAuth = !!accessToken || !!clientId;
  let tokenManager = null;
  
  // Setup OAuth token manager if using OAuth
  if (isOAuth && clientId && clientSecret) {
    tokenManager = getTokenManager(clientId, clientSecret, refreshToken);
    
    // Set initial access token if provided
    if (accessToken && !tokenManager.isTokenExpired()) {
      tokenManager.setTokens(accessToken, refreshToken);
    }
  }
  
  // Build URL
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  // Get rate limits for this endpoint
  const limits = getEndpointLimits(endpoint);
  const rateLimiter = getRateLimiter(
    burstLimit || limits.burst, 
    steadyLimit || limits.steady
  );
  
  // Apply rate limiting unless skipped
  if (!skipRateLimit) {
    await rateLimiter.waitIfNeeded();
  }
  
  // Retry logic with token refresh
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Get fresh token if using OAuth
      if (tokenManager) {
        auth = await tokenManager.getAccessToken();
      }
      
      // Build headers
      const headers = getKlaviyoHeaders(auth, isOAuth);
      
      // Build fetch options
      const fetchOptions = {
        method,
        headers,
      };
      
      if (payload && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(payload);
      }
      
      const res = await fetch(url, fetchOptions);
      
      // Handle 401 - token might be expired
      if (res.status === 401 && tokenManager) {
        const errorData = await res.json().catch(() => ({}));
        
        // Check if it's an expired token error
        if (errorData.errors?.[0]?.code === 'not_authenticated' || 
            errorData.errors?.[0]?.detail?.includes('access token')) {
          console.log('Access token expired, refreshing...');
          
          // Force token refresh
          await tokenManager.refreshAccessToken();
          auth = await tokenManager.getAccessToken();
          
          // Retry the request with new token
          if (attempt < maxRetries) {
            continue;
          }
        }
      }
      
      // Handle rate limit response
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.min(Math.pow(2, attempt) * 1000, 30000);
        
        console.warn(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
      }
      
      // Handle other errors
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Klaviyo API error: ${res.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors && errorJson.errors[0]) {
            errorMessage = errorJson.errors[0].detail || errorJson.errors[0].title || errorMessage;
          }
        } catch {
          errorMessage += ` ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse and return successful response
      const data = await res.json();
      
      // Add rate limit info if available
      const rateLimit = {
        remaining: res.headers.get('X-RateLimit-Remaining'),
        limit: res.headers.get('X-RateLimit-Limit'),
        retryAfter: res.headers.get('X-RateLimit-Retry-After')
      };
      
      if (rateLimit.remaining || rateLimit.limit) {
        data._rateLimit = rateLimit;
      }
      
      return data;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message.includes('Invalid API key') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('No refresh token')) {
        throw error;
      }
      
      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const backoffTime = Math.min(Math.pow(2, attempt) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  throw lastError || new Error('Request failed after maximum retries');
};

/**
 * OAuth helper functions (functional style)
 */
export const oauth = {
  exchangeCodeForTokens: async (clientId, clientSecret, code, redirectUri) => {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${response.status} ${error}`);
    }

    return response.json();
  },

  refreshAccessToken: async (clientId, clientSecret, refreshToken) => {
    const tokenManager = getTokenManager(clientId, clientSecret, refreshToken);
    return tokenManager.refreshAccessToken();
  },

  getAuthorizationUrl: (clientId, redirectUri, state, scopes = []) => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: scopes.join(' '),
    });
    
    return `https://a.klaviyo.com/oauth/authorize?${params.toString()}`;
  }
};

/**
 * Convenience wrappers
 */
export const klaviyoGet = (endpoint, opts) => klaviyoRequest('GET', endpoint, opts);
export const klaviyoPost = (endpoint, payload, opts) => klaviyoRequest('POST', endpoint, { ...opts, payload });
export const klaviyoPatch = (endpoint, payload, opts) => klaviyoRequest('PATCH', endpoint, { ...opts, payload });
export const klaviyoDelete = (endpoint, opts) => klaviyoRequest('DELETE', endpoint, opts);

/**
 * Fetches all paginated results from a Klaviyo endpoint
 */
export const klaviyoGetAll = async (endpoint, opts = {}) => {
  let url = endpoint;
  let allData = [];
  let allIncluded = [];
  let firstResponse = null;
  let pageCount = 0;
  const maxPages = opts.maxPages || null;
  
  while (url) {
    if (maxPages && pageCount >= maxPages) {
      break;
    }
    
    const res = await klaviyoGet(url, opts);
    
    if (!firstResponse) firstResponse = res;
    
    if (Array.isArray(res.data)) {
      allData = allData.concat(res.data);
    } else if (res.data) {
      allData.push(res.data);
    }
    
    if (Array.isArray(res.included)) {
      allIncluded = allIncluded.concat(res.included);
    }
    
    url = res.links && res.links.next ? res.links.next : null;
    pageCount++;
    
    if (opts.debug) {
      console.log(`Fetched page ${pageCount}, total items: ${allData.length}`);
    }
  }
  
  return {
    ...firstResponse,
    data: allData,
    included: allIncluded,
    links: firstResponse?.links || {},
    meta: {
      ...(firstResponse?.meta || {}),
      totalPages: pageCount,
      totalItems: allData.length
    }
  };
};

/**
 * Build query string from params object
 */
export const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  
  const queryParts = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      value.forEach(item => {
        queryParts.push(`${key}[]=${encodeURIComponent(item)}`);
      });
    } else if (typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value)) {
        queryParts.push(`${key}[${subKey}]=${encodeURIComponent(subValue)}`);
      }
    } else {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  
  return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
};

/**
 * Common Klaviyo API operations (functional style)
 */
export const klaviyo = {
  // Profiles
  getProfiles: (params, opts) => klaviyoGet(`profiles${buildQueryString(params)}`, opts),
  getProfile: (id, params, opts) => klaviyoGet(`profiles/${id}${buildQueryString(params)}`, opts),
  createProfile: (data, opts) => klaviyoPost('profiles', { data: { type: 'profile', attributes: data } }, opts),
  updateProfile: (id, data, opts) => klaviyoPatch(`profiles/${id}`, { data: { type: 'profile', id, attributes: data } }, opts),
  
  // Events
  createEvent: (data, opts) => klaviyoPost('events', { data: { type: 'event', attributes: data } }, opts),
  getEvents: (params, opts) => klaviyoGet(`events${buildQueryString(params)}`, opts),
  
  // Lists
  getLists: (params, opts) => klaviyoGet(`lists${buildQueryString(params)}`, opts),
  getList: (id, params, opts) => klaviyoGet(`lists/${id}${buildQueryString(params)}`, opts),
  createList: (data, opts) => klaviyoPost('lists', { data: { type: 'list', attributes: data } }, opts),
  
  // Segments
  getSegments: (params, opts) => klaviyoGet(`segments${buildQueryString(params)}`, opts),
  getSegment: (id, params, opts) => klaviyoGet(`segments/${id}${buildQueryString(params)}`, opts),
  
  // Campaigns
  getCampaigns: (params, opts) => klaviyoGet(`campaigns${buildQueryString(params)}`, opts),
  getCampaign: (id, params, opts) => klaviyoGet(`campaigns/${id}${buildQueryString(params)}`, opts),
  
  // Flows
  getFlows: (params, opts) => klaviyoGet(`flows${buildQueryString(params)}`, opts),
  getFlow: (id, params, opts) => klaviyoGet(`flows/${id}${buildQueryString(params)}`, opts),
  
  // Metrics
  getMetrics: (params, opts) => klaviyoGet(`metrics${buildQueryString(params)}`, opts),
  getMetric: (id, params, opts) => klaviyoGet(`metrics/${id}${buildQueryString(params)}`, opts),
  queryMetricAggregates: (data, opts) => klaviyoPost('metric-aggregates', { data: { type: 'metric-aggregate', attributes: data } }, opts),
  
  // Get all pages for any endpoint
  getAllPages: (endpoint, opts) => klaviyoGetAll(endpoint, opts)
};

// Default export for convenience
export default {
  klaviyoRequest,
  klaviyoGet,
  klaviyoPost,
  klaviyoPatch,
  klaviyoDelete,
  klaviyoGetAll,
  buildQueryString,
  oauth,
  createTokenManager,
  createRateLimiter,
  ...klaviyo
};
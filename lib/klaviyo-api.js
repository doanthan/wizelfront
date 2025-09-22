/**
 * Klaviyo API Client
 * Supports both API Keys and OAuth Bearer tokens with automatic refresh
 * OAuth Documentation: https://developers.klaviyo.com/en/docs/set_up_oauth
 */

const BASE_URL = 'https://a.klaviyo.com/api/';
const OAUTH_TOKEN_URL = 'https://a.klaviyo.com/oauth/token';
// IMPORTANT: Always use the KLAVIYO_REVISION from .env
const API_REVISION = process.env.NEXT_PUBLIC_KLAVIYO_REVISION || '2025-07-15';

/**
 * Token manager for OAuth tokens
 */
class TokenManager {
  constructor(clientId, clientSecret, refreshToken) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get base64 encoded credentials for OAuth
   */
  getBasicAuth() {
    return Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
  }

  /**
   * Check if token is expired or about to expire (within 5 minutes)
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    const now = Date.now();
    const expiryTime = this.tokenExpiry - (5 * 60 * 1000); // 5 minutes buffer
    return now >= expiryTime;
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.getBasicAuth()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh token: ${response.status} ${error}`);
      }

      const data = await response.json();
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || this.refreshToken; // Update if new refresh token provided
      
      // Calculate token expiry (expires_in is in seconds)
      if (data.expires_in) {
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      }

      console.log('Access token refreshed successfully');
      return this.accessToken;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getAccessToken() {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  /**
   * Set tokens manually (e.g., after initial OAuth flow)
   */
  setTokens(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    if (expiresIn) {
      this.tokenExpiry = Date.now() + (expiresIn * 1000);
    }
  }
}

/**
 * Rate limiter for Klaviyo API endpoints
 */
class KlaviyoRateLimiter {
  constructor(burstLimit = 75, steadyLimit = 700) {
    this.burstLimit = burstLimit;
    this.steadyLimit = steadyLimit;
    this.burstWindow = 3000; // 3 seconds
    this.steadyWindow = 60000; // 60 seconds
    this.burstRequests = [];
    this.steadyRequests = [];
  }

  async waitIfNeeded() {
    const now = Date.now();
    
    // Clean old requests
    this.burstRequests = this.burstRequests.filter(t => now - t < this.burstWindow);
    this.steadyRequests = this.steadyRequests.filter(t => now - t < this.steadyWindow);
    
    // Calculate wait time
    let waitTime = 0;
    
    if (this.burstRequests.length >= this.burstLimit) {
      const oldestBurst = Math.min(...this.burstRequests);
      waitTime = Math.max(waitTime, this.burstWindow - (now - oldestBurst) + 100);
    }
    
    if (this.steadyRequests.length >= this.steadyLimit) {
      const oldestSteady = Math.min(...this.steadyRequests);
      waitTime = Math.max(waitTime, this.steadyWindow - (now - oldestSteady) + 100);
    }
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Record this request
    this.burstRequests.push(Date.now());
    this.steadyRequests.push(Date.now());
  }
}

// Cache rate limiters per endpoint pattern
const rateLimiters = new Map();

// Cache token managers per client
const tokenManagers = new Map();

/**
 * Get or create token manager
 */
function getTokenManager(clientId, clientSecret, refreshToken) {
  const key = clientId;
  if (!tokenManagers.has(key)) {
    tokenManagers.set(key, new TokenManager(clientId, clientSecret, refreshToken));
  }
  return tokenManagers.get(key);
}

/**
 * Get rate limiter for endpoint
 */
function getRateLimiter(endpoint, burstLimit = 75, steadyLimit = 700) {
  const key = `${burstLimit}-${steadyLimit}`;
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new KlaviyoRateLimiter(burstLimit, steadyLimit));
  }
  return rateLimiters.get(key);
}

/**
 * Get rate limits for specific endpoints
 */
function getEndpointLimits(endpoint) {
  // Check endpoint patterns and return appropriate limits
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
  // Default limits for profiles and other endpoints
  return { burst: 75, steady: 700 };
}

/**
 * Build Klaviyo headers based on auth type
 * @param {string} auth - API key or access token
 * @param {boolean} isOAuth - Whether using OAuth (bearer token)
 */
function getKlaviyoHeaders(auth, isOAuth = false) {
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
    // OAuth bearer token
    headers['Authorization'] = `Bearer ${auth}`;
  } else {
    // Standard API key
    headers['Authorization'] = `Klaviyo-API-Key ${auth}`;
  }

  return headers;
}

/**
 * Generic Klaviyo API request function with rate limiting and OAuth support.
 * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
 * @param {string} endpoint - e.g. 'lists', 'profiles/xyz', or full URL
 * @param {Object} [options] - { apiKey, accessToken, clientId, clientSecret, refreshToken, payload, ... }
 */
export async function klaviyoRequest(method, endpoint, options = {}) {
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
    if (accessToken && !tokenManager.accessToken) {
      tokenManager.setTokens(accessToken, refreshToken);
    }
  }
  
  // Build URL
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  // Get rate limits for this endpoint
  const limits = getEndpointLimits(endpoint);
  const rateLimiter = getRateLimiter(
    endpoint, 
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
          tokenManager.tokenExpiry = null;
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
}

/**
 * OAuth helper functions
 */
export const oauth = {
  /**
   * Exchange authorization code for tokens
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @param {string} code - Authorization code from OAuth flow
   * @param {string} redirectUri - Redirect URI used in OAuth flow
   */
  async exchangeCodeForTokens(clientId, clientSecret, code, redirectUri) {
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

  /**
   * Refresh access token
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @param {string} refreshToken - Refresh token
   */
  async refreshAccessToken(clientId, clientSecret, refreshToken) {
    const tokenManager = getTokenManager(clientId, clientSecret, refreshToken);
    return tokenManager.refreshAccessToken();
  },

  /**
   * Create OAuth authorization URL
   * @param {string} clientId - OAuth client ID
   * @param {string} redirectUri - Redirect URI
   * @param {string} state - State parameter for security
   * @param {Array} scopes - Required scopes
   */
  getAuthorizationUrl(clientId, redirectUri, state, scopes = []) {
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
 * Fetches all paginated results from a Klaviyo endpoint.
 * @param {string} endpoint - e.g. 'campaigns?include=tags'
 * @param {Object} opts - { apiKey, accessToken, clientId, clientSecret, refreshToken, ... }
 * @returns {Promise<Object>} - Combined results with all data and included arrays merged.
 */
export async function klaviyoGetAll(endpoint, opts = {}) {
  let url = endpoint;
  let allData = [];
  let allIncluded = [];
  let firstResponse = null;
  let pageCount = 0;
  const maxPages = opts.maxPages || null;
  
  while (url) {
    // Check if we've hit the max pages limit
    if (maxPages && pageCount >= maxPages) {
      break;
    }
    
    const res = await klaviyoGet(url, opts);
    
    // Store first response as base
    if (!firstResponse) firstResponse = res;
    
    // Collect data
    if (Array.isArray(res.data)) {
      allData = allData.concat(res.data);
    } else if (res.data) {
      allData.push(res.data);
    }
    
    // Collect included resources
    if (Array.isArray(res.included)) {
      allIncluded = allIncluded.concat(res.included);
    }
    
    // Get next page URL
    url = res.links && res.links.next ? res.links.next : null;
    pageCount++;
    
    // Log progress if in debug mode
    if (opts.debug) {
      console.log(`Fetched page ${pageCount}, total items: ${allData.length}`);
    }
  }
  
  // Return combined response using first response as base
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
}

/**
 * Build query string from params object
 */
export function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) return '';
  
  const queryParts = [];
  
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      // Handle array parameters (e.g., fields, include)
      value.forEach(item => {
        queryParts.push(`${key}[]=${encodeURIComponent(item)}`);
      });
    } else if (typeof value === 'object') {
      // Handle nested objects (e.g., filter, page)
      for (const [subKey, subValue] of Object.entries(value)) {
        queryParts.push(`${key}[${subKey}]=${encodeURIComponent(subValue)}`);
      }
    } else {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  
  return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
}

/**
 * Common Klaviyo API operations (works with both API key and OAuth)
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
const klaviyoApiExport = {
  klaviyoRequest,
  klaviyoGet,
  klaviyoPost,
  klaviyoPatch,
  klaviyoDelete,
  klaviyoGetAll,
  buildQueryString,
  oauth,
  ...klaviyo
};

export default klaviyoApiExport;
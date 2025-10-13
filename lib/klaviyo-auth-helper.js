/**
 * Klaviyo OAuth-First Authentication Helper
 * 
 * This helper provides a centralized way to build authentication options for Klaviyo API calls.
 * It implements OAuth-first approach: tries OAuth tokens first, then falls back to API key.
 * 
 * Usage:
 * import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
 * import { klaviyoRequest } from '@/lib/klaviyo-api';
 * 
 * const authOptions = buildKlaviyoAuthOptions(store);
 * const response = await klaviyoRequest('GET', 'campaigns', authOptions);
 */

/**
 * Build OAuth-first authentication options from store klaviyo_integration data
 * @param {Object} store - Store object with klaviyo_integration
 * @returns {Object} Authentication options for klaviyo-api functions
 */
export function buildKlaviyoAuthOptions(store) {
  if (!store?.klaviyo_integration) {
    throw new Error('Store does not have klaviyo_integration configured');
  }

  const integration = store.klaviyo_integration;
  const authOptions = {};

  // Priority 1: OAuth credentials (preferred)
  if (integration.oauth_token) {
    authOptions.accessToken = integration.oauth_token;
    
    if (integration.refresh_token) {
      authOptions.refreshToken = integration.refresh_token;
    }
    
    // OAuth client credentials are required for token refresh
    if (process.env.WIZEL_KLAVIYO_ID && process.env.WIZEL_KLAVIYO_SECRET) {
      authOptions.clientId = process.env.WIZEL_KLAVIYO_ID;
      authOptions.clientSecret = process.env.WIZEL_KLAVIYO_SECRET;
    } else {
      console.warn('OAuth tokens provided but WIZEL_KLAVIYO_ID/WIZEL_KLAVIYO_SECRET not found in environment');
    }
    
    return authOptions;
  }

  // Priority 2: API Key fallback
  if (integration.apiKey) {
    authOptions.apiKey = integration.apiKey;
    return authOptions;
  }

  throw new Error('No valid Klaviyo authentication found. Need either oauth_token or apiKey.');
}

/**
 * Check if store has valid OAuth configuration
 * @param {Object} store - Store object with klaviyo_integration
 * @returns {boolean} True if OAuth is configured
 */
export function hasOAuthConfig(store) {
  return !!(
    store?.klaviyo_integration?.oauth_token &&
    process.env.WIZEL_KLAVIYO_ID &&
    process.env.WIZEL_KLAVIYO_SECRET
  );
}

/**
 * Check if store has valid API key configuration
 * @param {Object} store - Store object with klaviyo_integration
 * @returns {boolean} True if API key is configured
 */
export function hasApiKeyConfig(store) {
  return !!(store?.klaviyo_integration?.apiKey);
}

/**
 * Get authentication method being used
 * @param {Object} store - Store object with klaviyo_integration
 * @returns {string} 'oauth', 'apikey', or 'none'
 */
export function getAuthMethod(store) {
  if (hasOAuthConfig(store)) {
    return 'oauth';
  }
  if (hasApiKeyConfig(store)) {
    return 'apikey';
  }
  return 'none';
}

/**
 * Build authentication options with detailed logging
 * @param {Object} store - Store object with klaviyo_integration
 * @param {Object} options - Additional options { debug: boolean }
 * @returns {Object} Authentication options for klaviyo-api functions
 */
export function buildKlaviyoAuthOptionsWithLogging(store, { debug = false } = {}) {
  const authMethod = getAuthMethod(store);

  // Only log in development environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const shouldDebug = debug && isDevelopment;

  if (shouldDebug) {
    console.log('🔐 Klaviyo Authentication Analysis:', {
      storeId: store?.public_id,
      storeName: store?.name,
      hasOAuth: hasOAuthConfig(store),
      hasApiKey: hasApiKeyConfig(store),
      selectedMethod: authMethod,
      hasRefreshToken: !!(store?.klaviyo_integration?.refresh_token),
      tokenExpiry: store?.klaviyo_integration?.token_expires_at
        ? new Date(store.klaviyo_integration.token_expires_at).toISOString()
        : null
    });
  }

  return buildKlaviyoAuthOptions(store);
}

/**
 * Simplified wrapper for common use case
 * @param {Object} store - Store object with klaviyo_integration
 * @returns {Object} Ready-to-use auth options
 */
export default function getKlaviyoAuth(store) {
  return buildKlaviyoAuthOptions(store);
}
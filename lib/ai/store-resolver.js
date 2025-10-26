/**
 * Store Name Resolver for AI Chat
 *
 * Resolves store names mentioned in user queries to actual Store documents
 * Handles fuzzy matching and user permission validation
 */

import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import User from '@/models/User';

/**
 * Resolve store names from query to Store documents with permission checking
 *
 * @param {string[]} storeNames - Array of store names extracted from query
 * @param {Object} user - User document from MongoDB
 * @returns {Promise<Object>} - { stores: Store[], notFound: string[], accessDenied: string[] }
 */
export async function resolveStoreNames(storeNames, user) {
  if (!storeNames || storeNames.length === 0) {
    return { stores: [], notFound: [], accessDenied: [] };
  }

  await connectToDatabase();

  const results = {
    stores: [],
    notFound: [],
    accessDenied: []
  };

  // Get user's accessible store IDs
  const userStoreIds = user.store_ids || [];

  // For each store name, try to find a matching store
  for (const storeName of storeNames) {
    const matchedStore = await findStoreByName(storeName, userStoreIds, user);

    if (!matchedStore.found) {
      results.notFound.push(storeName);
    } else if (!matchedStore.hasAccess) {
      results.accessDenied.push(storeName);
    } else {
      results.stores.push(matchedStore.store);
    }
  }

  return results;
}

/**
 * Find a store by name with fuzzy matching
 * Only returns stores the user has access to
 */
async function findStoreByName(storeName, userStoreIds, user) {
  // Try exact match first (case-insensitive)
  let store = await Store.findOne({
    name: new RegExp(`^${escapeRegex(storeName)}$`, 'i'),
    public_id: { $in: userStoreIds },
    is_deleted: { $ne: true }
  });

  if (store) {
    return { found: true, hasAccess: true, store, matchType: 'exact' };
  }

  // Try partial match (contains)
  store = await Store.findOne({
    name: new RegExp(escapeRegex(storeName), 'i'),
    public_id: { $in: userStoreIds },
    is_deleted: { $ne: true }
  });

  if (store) {
    return { found: true, hasAccess: true, store, matchType: 'partial' };
  }

  // Check if store exists but user doesn't have access
  const storeWithoutAccess = await Store.findOne({
    name: new RegExp(escapeRegex(storeName), 'i'),
    is_deleted: { $ne: true }
  });

  if (storeWithoutAccess) {
    return { found: true, hasAccess: false, store: null, matchType: 'no_access' };
  }

  // Store not found
  return { found: false, hasAccess: false, store: null, matchType: 'not_found' };
}

/**
 * Escape special regex characters in store name
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get stores for AI query with intelligent fallback
 *
 * Priority:
 * 1. If store names mentioned in query → resolve those names
 * 2. If "my store" or no store mentioned → use user's accessible stores
 * 3. If user has selected stores in UI → use those
 *
 * @param {string} query - User's question
 * @param {Object} user - User document
 * @param {Object} context - AI context with selectedStores
 * @returns {Promise<Object>} - { storeIds: string[], stores: Store[], resolution: string }
 */
export async function getStoresForQuery(query, user, context = {}) {
  await connectToDatabase();

  // Get user's accessible stores for Haiku context
  const userAccessibleStores = await getUserAccessibleStores(user);

  const { needsStoreResolution } = await import('./intent-detection-haiku.js');

  // Use Haiku to extract store names
  const resolution = await needsStoreResolution(query, userAccessibleStores);

  // Case 1: Specific store names mentioned in query
  if (resolution.needed && resolution.storeNames.length > 0) {
    console.log('🏪 Resolving store names from query (Haiku):', {
      storeNames: resolution.storeNames,
      confidence: resolution.confidence,
      method: resolution.method
    });

    const resolved = await resolveStoreNames(resolution.storeNames, user);

    if (resolved.stores.length > 0) {
      return {
        storeIds: resolved.stores.map(s => s.public_id),
        stores: resolved.stores,
        resolution: 'query_mentioned',
        extractionMethod: resolution.method,
        confidence: resolution.confidence,
        notFound: resolved.notFound,
        accessDenied: resolved.accessDenied
      };
    }

    // If no stores found/accessible, provide helpful message
    if (resolved.notFound.length > 0 || resolved.accessDenied.length > 0) {
      return {
        storeIds: [],
        stores: [],
        resolution: 'not_found',
        notFound: resolved.notFound,
        accessDenied: resolved.accessDenied,
        error: buildStoreResolutionError(resolved, userAccessibleStores)
      };
    }
  }

  // Case 2: User has selected stores in UI context
  const selectedStores = context?.aiState?.selectedStores || [];
  if (selectedStores.length > 0 && selectedStores[0]?.value) {
    console.log('🏪 Using UI-selected stores:', selectedStores.length);

    const storeIds = selectedStores.map(s => s.value);
    const stores = await Store.find({
      public_id: { $in: storeIds },
      is_deleted: { $ne: true }
    });

    return {
      storeIds,
      stores,
      resolution: 'ui_selected'
    };
  }

  // Case 3: Fallback to all user's accessible stores
  console.log('🏪 Falling back to user\'s accessible stores');

  const userStoreIds = user.store_ids || [];
  const stores = await Store.find({
    public_id: { $in: userStoreIds },
    is_deleted: { $ne: true }
  });

  return {
    storeIds: userStoreIds,
    stores,
    resolution: 'user_default'
  };
}

/**
 * Build helpful error message when stores can't be resolved
 */
function buildStoreResolutionError(resolved, userAccessibleStores = []) {
  const messages = [];

  if (resolved.notFound.length > 0) {
    messages.push(`I couldn't find ${resolved.notFound.length === 1 ? 'a store' : 'stores'} named: ${resolved.notFound.join(', ')}`);
  }

  if (resolved.accessDenied.length > 0) {
    messages.push(`You don't have access to: ${resolved.accessDenied.join(', ')}`);
  }

  // Suggest available stores
  if (userAccessibleStores.length > 0) {
    const storeList = userAccessibleStores
      .slice(0, 5) // Show max 5
      .map(s => s.name)
      .join(', ');

    const moreStores = userAccessibleStores.length > 5
      ? ` (and ${userAccessibleStores.length - 5} more)`
      : '';

    messages.push(`Your accessible stores are: ${storeList}${moreStores}`);
  }

  return messages.join('. ');
}

/**
 * Get user's accessible stores (formatted for display)
 */
export async function getUserAccessibleStores(user) {
  await connectToDatabase();

  const stores = await Store.find({
    public_id: { $in: user.store_ids || [] },
    is_deleted: { $ne: true }
  }).select('public_id name klaviyo_integration');

  return stores.map(store => ({
    public_id: store.public_id,
    name: store.name,
    hasKlaviyo: !!store.klaviyo_integration?.public_id,
    klaviyo_id: store.klaviyo_integration?.public_id
  }));
}

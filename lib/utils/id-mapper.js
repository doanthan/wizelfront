/**
 * Store ID ↔ Klaviyo ID Mapper
 *
 * Handles the critical conversion between store_public_ids (used in UI/localStorage)
 * and klaviyo_public_ids (used in ClickHouse queries)
 */

import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';

/**
 * Convert store public IDs to Klaviyo public IDs
 *
 * CRITICAL: localStorage and UI use store_public_ids, but ClickHouse queries
 * require klaviyo_public_ids. This function performs the conversion.
 *
 * @param {string[]} storePublicIds - Array of store public IDs
 * @returns {Promise<{ klaviyoIds: string[], storeMap: Map<string, Object>, errors: string[] }>}
 */
export async function storeIdsToKlaviyoIds(storePublicIds) {
  if (!storePublicIds || storePublicIds.length === 0) {
    return {
      klaviyoIds: [],
      storeMap: new Map(),
      errors: ['No store IDs provided'],
    };
  }

  try {
    await connectToDatabase();

    // Fetch all stores with their Klaviyo integrations
    const stores = await Store.find({
      public_id: { $in: storePublicIds },
      is_deleted: { $ne: true },
    }).select('public_id name klaviyo_integration');

    if (stores.length === 0) {
      return {
        klaviyoIds: [],
        storeMap: new Map(),
        errors: [`No valid stores found for IDs: ${storePublicIds.join(', ')}`],
      };
    }

    // Build mapping and extract Klaviyo IDs
    const storeMap = new Map();
    const klaviyoIds = [];
    const errors = [];

    for (const store of stores) {
      const storeId = store.public_id;
      const klaviyoId = store.klaviyo_integration?.public_id;

      if (!klaviyoId) {
        errors.push(`Store ${storeId} (${store.name}) has no Klaviyo integration`);
        continue;
      }

      // Store mapping for later reference
      storeMap.set(storeId, {
        store_public_id: storeId,
        klaviyo_public_id: klaviyoId,
        store_name: store.name,
        has_klaviyo: true,
      });

      // Add to Klaviyo IDs list (avoid duplicates)
      if (!klaviyoIds.includes(klaviyoId)) {
        klaviyoIds.push(klaviyoId);
      }
    }

    // Check for missing stores
    const foundStoreIds = stores.map(s => s.public_id);
    const missingStoreIds = storePublicIds.filter(id => !foundStoreIds.includes(id));
    if (missingStoreIds.length > 0) {
      errors.push(`Stores not found: ${missingStoreIds.join(', ')}`);
    }

    return {
      klaviyoIds,
      storeMap,
      errors: errors.length > 0 ? errors : [],
    };
  } catch (error) {
    console.error('Error converting store IDs to Klaviyo IDs:', error);
    return {
      klaviyoIds: [],
      storeMap: new Map(),
      errors: [`Database error: ${error.message}`],
    };
  }
}

/**
 * Get Klaviyo IDs from user's accessible stores
 *
 * @param {Object} user - User object with store_ids
 * @param {string[]} requestedStoreIds - Optional subset of store IDs to filter
 * @returns {Promise<{ klaviyoIds: string[], storeMap: Map<string, Object>, errors: string[] }>}
 */
export async function getUserKlaviyoIds(user, requestedStoreIds = null) {
  if (!user || !user.store_ids || user.store_ids.length === 0) {
    return {
      klaviyoIds: [],
      storeMap: new Map(),
      errors: ['User has no accessible stores'],
    };
  }

  // If specific stores requested, validate user has access
  let storeIds = user.store_ids;
  if (requestedStoreIds && requestedStoreIds.length > 0) {
    const unauthorizedStores = requestedStoreIds.filter(
      id => !user.store_ids.includes(id)
    );

    if (unauthorizedStores.length > 0) {
      return {
        klaviyoIds: [],
        storeMap: new Map(),
        errors: [`User does not have access to stores: ${unauthorizedStores.join(', ')}`],
      };
    }

    storeIds = requestedStoreIds;
  }

  return await storeIdsToKlaviyoIds(storeIds);
}

/**
 * Validate store access for user
 *
 * @param {Object} user - User object with store_ids
 * @param {string[]} requestedStoreIds - Store IDs to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateStoreAccess(user, requestedStoreIds) {
  if (!user || !user.store_ids) {
    return { valid: false, error: 'User has no store access' };
  }

  if (!requestedStoreIds || requestedStoreIds.length === 0) {
    return { valid: false, error: 'No store IDs provided' };
  }

  const unauthorizedStores = requestedStoreIds.filter(
    id => !user.store_ids.includes(id)
  );

  if (unauthorizedStores.length > 0) {
    return {
      valid: false,
      error: `Access denied to stores: ${unauthorizedStores.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Build Klaviyo ID filter clause for SQL queries
 *
 * @param {string[]} klaviyoIds - Klaviyo public IDs
 * @param {string} columnName - Column name (default: 'klaviyo_public_id')
 * @returns {string} - SQL WHERE clause fragment
 */
export function buildKlaviyoIdFilter(klaviyoIds, columnName = 'klaviyo_public_id') {
  if (!klaviyoIds || klaviyoIds.length === 0) {
    throw new Error('No Klaviyo IDs provided for filter');
  }

  if (klaviyoIds.length === 1) {
    return `${columnName} = '${klaviyoIds[0]}'`;
  }

  const idList = klaviyoIds.map(id => `'${id}'`).join(', ');
  return `${columnName} IN (${idList})`;
}

/**
 * Get store information by Klaviyo ID (reverse lookup)
 *
 * @param {string} klaviyoId - Klaviyo public ID
 * @returns {Promise<Object[]>} - Array of stores with this Klaviyo integration
 */
export async function getStoresByKlaviyoId(klaviyoId) {
  if (!klaviyoId) {
    return [];
  }

  try {
    await connectToDatabase();

    const stores = await Store.find({
      'klaviyo_integration.public_id': klaviyoId,
      is_deleted: { $ne: true },
    }).select('public_id name klaviyo_integration');

    return stores.map(store => ({
      store_public_id: store.public_id,
      store_name: store.name,
      klaviyo_public_id: store.klaviyo_integration?.public_id,
    }));
  } catch (error) {
    console.error('Error getting stores by Klaviyo ID:', error);
    return [];
  }
}

/**
 * Example usage in API routes:
 *
 * ```javascript
 * // In your API route
 * export async function GET(request) {
 *   const { searchParams } = new URL(request.url);
 *   const storePublicIds = searchParams.get('accountIds')?.split(',') || [];
 *
 *   // Convert store IDs to Klaviyo IDs for ClickHouse query
 *   const { klaviyoIds, storeMap, errors } = await storeIdsToKlaviyoIds(storePublicIds);
 *
 *   if (errors.length > 0) {
 *     console.warn('ID mapping warnings:', errors);
 *   }
 *
 *   if (klaviyoIds.length === 0) {
 *     return NextResponse.json({ campaigns: [] });
 *   }
 *
 *   // Build ClickHouse query with Klaviyo IDs
 *   const filter = buildKlaviyoIdFilter(klaviyoIds);
 *   const query = `
 *     SELECT * FROM campaign_statistics
 *     WHERE ${filter}
 *     AND date >= '2025-01-01'
 *     LIMIT 100
 *   `;
 *
 *   // Execute query...
 * }
 * ```
 */

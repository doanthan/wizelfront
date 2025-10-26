import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import Store from '@/models/Store';
import ContractSeat from '@/models/ContractSeat';

/**
 * Get all stores accessible to a user based on their ContractSeat permissions
 * Filters stores by analytics permissions (view_own or view_all)
 * @param {string} userId - MongoDB User ID
 * @returns {Promise<Array>} Array of accessible stores with klaviyo_public_id and analytics permissions
 */
export async function getUserAccessibleStores(userId) {
  await connectToDatabase();

  // Get all active contract seats for this user
  const seats = await ContractSeat.find({
    user_id: userId,
    status: 'active'
  }).populate('default_role_id');

  console.log('🔍 [getUserAccessibleStores] Found seats:', seats.length);

  if (seats.length === 0) {
    console.warn('⚠️ [getUserAccessibleStores] No active ContractSeats found for user:', userId);
    return [];
  }

  // Collect all store IDs user has access to with their analytics permissions
  const storeAccessMap = new Map(); // Map<storeId, { store, role, analyticsPermissions }>

  for (const seat of seats) {
    console.log('🔍 [getUserAccessibleStores] Seat store_access count:', seat.store_access?.length || 0);

    // Get role and analytics permissions
    const role = seat.default_role_id;
    const analyticsPermissions = role?.permissions?.analytics || {};

    console.log('🔍 [getUserAccessibleStores] Role:', role?.name, 'Analytics:', analyticsPermissions);

    // Skip users without any analytics permissions
    if (!analyticsPermissions.view_own && !analyticsPermissions.view_all) {
      console.warn('⚠️ [getUserAccessibleStores] Seat has no analytics permissions:', seat._id);
      continue;
    }

    // Get all stores in this contract
    const contractStores = await Store.find({
      contract_id: seat.contract_id,
      is_deleted: { $ne: true }
    }).lean();

    console.log('🔍 [getUserAccessibleStores] Contract stores:', contractStores.length);

    // Check access for each store using the seat's hasStoreAccess method
    for (const store of contractStores) {
      // Empty store_access array means access to ALL stores in contract
      const hasAccess = seat.hasStoreAccess(store._id);

      if (hasAccess) {
        const storeId = store._id.toString();

        // Only add if not already added with higher permissions
        if (!storeAccessMap.has(storeId)) {
          storeAccessMap.set(storeId, {
            store,
            role: role?.name || 'viewer',
            analyticsPermissions
          });
        } else {
          // Upgrade permissions if this seat has better access
          const existing = storeAccessMap.get(storeId);
          if (analyticsPermissions.view_all && !existing.analyticsPermissions.view_all) {
            storeAccessMap.set(storeId, {
              store,
              role: role?.name || 'viewer',
              analyticsPermissions
            });
          }
        }
      }
    }
  }

  console.log('🔍 [getUserAccessibleStores] Total unique stores with analytics access:', storeAccessMap.size);

  // Map to user-friendly format with klaviyo_public_id and analytics permissions
  const mappedStores = Array.from(storeAccessMap.values())
    .filter(({ store }) => store.klaviyo_integration?.public_id) // Only stores with Klaviyo integration
    .map(({ store, role, analyticsPermissions }) => ({
      public_id: store.public_id,
      name: store.name,
      klaviyo_public_id: store.klaviyo_integration?.public_id,
      user_role: role,
      analytics_permissions: {
        view_own: analyticsPermissions.view_own || false,
        view_all: analyticsPermissions.view_all || false,
        export: analyticsPermissions.export || false,
        view_financial: analyticsPermissions.view_financial || false
      }
    }));

  console.log('🔍 [getUserAccessibleStores] Stores with Klaviyo integration and analytics access:',
    mappedStores.length);

  return mappedStores;
}

/**
 * Check if user has analytics access to specific stores
 * @param {string} userId - MongoDB User ID
 * @param {Array<string>} storePublicIds - Array of store public_ids to check
 * @returns {Promise<Object>} { hasAccess: boolean, allowedStores: Array, deniedStores: Array }
 */
export async function validateStoreAnalyticsAccess(userId, storePublicIds) {
  const accessibleStores = await getUserAccessibleStores(userId);
  const accessiblePublicIds = new Set(accessibleStores.map(s => s.public_id));

  const allowedStores = storePublicIds.filter(id => accessiblePublicIds.has(id));
  const deniedStores = storePublicIds.filter(id => !accessiblePublicIds.has(id));

  return {
    hasAccess: deniedStores.length === 0,
    allowedStores: allowedStores.map(id =>
      accessibleStores.find(s => s.public_id === id)
    ),
    deniedStores
  };
}

/**
 * Get user's analytics permission level for a specific store
 * @param {string} userId - MongoDB User ID
 * @param {string} storePublicId - Store public_id
 * @returns {Promise<Object|null>} Analytics permissions object or null if no access
 */
export async function getStoreAnalyticsPermissions(userId, storePublicId) {
  const accessibleStores = await getUserAccessibleStores(userId);
  const store = accessibleStores.find(s => s.public_id === storePublicId);

  return store ? store.analytics_permissions : null;
}

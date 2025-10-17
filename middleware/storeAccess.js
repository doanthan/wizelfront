/**
 * Store Access Middleware - PERMISSIONS_GUIDE.md v3 Architecture
 *
 * Implements User → ContractSeat → Contract → Store permission model
 *
 * CRITICAL: This uses the ContractSeat architecture from PERMISSIONS_GUIDE.md
 * - Users access stores via ContractSeats
 * - Each seat has a default role and optional per-store role overrides
 * - Supports multi-contract workflows (contractors, agencies, etc.)
 *
 * @see /context/PERMISSIONS_GUIDE.md
 */

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import ContractSeat from "@/models/ContractSeat";
import Contract from "@/models/Contract";
import Store from "@/models/Store";
import Role from "@/models/Role";
import { NextResponse } from "next/server";

/**
 * Validates if user has access to the requested store via ContractSeat system
 *
 * Flow:
 * 1. Get Store → Contract
 * 2. Find user's ContractSeat for that Contract
 * 3. Check if seat has store access (empty store_access = all stores in contract)
 * 4. Get applicable role (store-specific or default)
 * 5. Return access info with populated role
 *
 * @param {string} storePublicId - Store public ID from route params
 * @param {Object} session - NextAuth session object (optional, will fetch if not provided)
 * @returns {Object} { hasAccess: boolean, store: Store|null, user: User|null, seat: ContractSeat|null, role: Role|null, error: string|null }
 */
export async function validateStoreAccess(storePublicId, session = null) {
  try {
    // Get session if not provided
    if (!session) {
      session = await auth();
    }

    if (!session?.user?.email) {
      return {
        hasAccess: false,
        store: null,
        user: null,
        seat: null,
        role: null,
        error: "Unauthorized - no active session"
      };
    }

    await connectToDatabase();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return {
        hasAccess: false,
        store: null,
        user: null,
        seat: null,
        role: null,
        error: "User not found"
      };
    }

    // Superuser bypass - has access to ALL stores
    if (user.is_super_user) {
      const store = await Store.findOne({
        public_id: storePublicId,
        is_deleted: { $ne: true }
      }).populate('contract_id');

      return {
        hasAccess: true,
        store,
        user,
        seat: null, // Superuser doesn't need a seat
        role: null, // Superuser bypasses role checks
        isSuperUser: true,
        error: null
      };
    }

    // Get the requested store
    const store = await Store.findOne({
      public_id: storePublicId,
      is_deleted: { $ne: true }
    }).populate('contract_id');

    if (!store) {
      return {
        hasAccess: false,
        store: null,
        user,
        seat: null,
        role: null,
        error: "Store not found or deleted"
      };
    }

    // Find user's seat for this store's contract
    const seat = await ContractSeat.findOne({
      user_id: user._id,
      contract_id: store.contract_id._id,
      status: 'active'
    }).populate('default_role_id');

    if (!seat) {
      return {
        hasAccess: false,
        store,
        user,
        seat: null,
        role: null,
        error: "No active seat for this store's contract"
      };
    }

    // Check if seat has access to this specific store
    // Empty store_access array means access to ALL stores in contract
    const hasStoreAccess = seat.hasStoreAccess(store._id);

    if (!hasStoreAccess) {
      return {
        hasAccess: false,
        store,
        user,
        seat,
        role: null,
        error: "Seat does not have access to this store"
      };
    }

    // Get the applicable role (store-specific override or default role)
    const roleId = seat.getStoreRole(store._id);
    const role = await Role.findById(roleId);

    if (!role) {
      return {
        hasAccess: false,
        store,
        user,
        seat,
        role: null,
        error: "Role not found for seat"
      };
    }

    return {
      hasAccess: true,
      store,
      user,
      seat,
      role,
      contract: store.contract_id,
      error: null
    };

  } catch (error) {
    console.error('[validateStoreAccess] Error:', error);
    return {
      hasAccess: false,
      store: null,
      user: null,
      seat: null,
      role: null,
      error: "Internal server error during access validation"
    };
  }
}

/**
 * Get all accessible stores for a user across ALL contracts
 * Uses ContractSeat system to gather stores from all active seats
 *
 * @param {Object} session - NextAuth session object (optional)
 * @returns {Array} Array of accessible stores with contract and role info
 */
export async function getUserAccessibleStores(session = null) {
  try {
    if (!session) {
      session = await auth();
    }

    if (!session?.user?.email) {
      return [];
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) return [];

    // Superuser sees all stores
    if (user.is_super_user) {
      const stores = await Store.find({
        is_deleted: { $ne: true }
      })
      .populate('contract_id')
      .select('public_id name klaviyo_integration contract_id');

      return stores.map(store => ({
        public_id: store.public_id,
        name: store.name,
        klaviyo_id: store.klaviyo_integration?.public_id || null,
        contract_id: store.contract_id?.public_id || null,
        contract_name: store.contract_id?.contract_name || null,
        role: 'super_user',
        isSuperUser: true
      }));
    }

    // Get all user's active seats
    const seats = await ContractSeat.find({
      user_id: user._id,
      status: 'active'
    })
    .populate('contract_id')
    .populate('default_role_id');

    if (!seats || seats.length === 0) return [];

    const accessibleStores = [];

    for (const seat of seats) {
      if (!seat.contract_id || seat.contract_id.status !== 'active') continue;

      // Get all stores in this contract
      const contractStores = await Store.find({
        contract_id: seat.contract_id._id,
        is_deleted: { $ne: true }
      }).select('public_id name klaviyo_integration _id');

      for (const store of contractStores) {
        // Check if seat has access to this store
        // Empty store_access = access to all stores in contract
        if (seat.hasStoreAccess(store._id)) {
          const roleId = seat.getStoreRole(store._id);
          const role = await Role.findById(roleId);

          accessibleStores.push({
            public_id: store.public_id,
            name: store.name,
            klaviyo_id: store.klaviyo_integration?.public_id || null,
            contract_id: seat.contract_id.public_id,
            contract_name: seat.contract_id.contract_name,
            role: role?.name || 'unknown',
            role_level: role?.level || 0,
            seat_id: seat._id.toString()
          });
        }
      }
    }

    return accessibleStores;

  } catch (error) {
    console.error('[getUserAccessibleStores] Error:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission for a store
 *
 * Permission format: 'category.action'
 * Examples: 'campaigns.create', 'analytics.export', 'stores.manage_integrations'
 *
 * @param {Object} user - User object
 * @param {string} storePublicId - Store public ID
 * @param {string} permission - Permission in format 'category.action'
 * @returns {boolean} True if user has permission
 */
export async function checkStorePermission(user, storePublicId, permission) {
  try {
    // Superuser has all permissions
    if (user.is_super_user) {
      return true;
    }

    await connectToDatabase();

    const { hasAccess, role, error } = await validateStoreAccess(storePublicId);

    if (!hasAccess || !role) {
      console.log(`[checkStorePermission] Access denied: ${error}`);
      return false;
    }

    // Parse permission (e.g., 'campaigns.create' → category: 'campaigns', action: 'create')
    const [category, action] = permission.split('.');

    if (!category || !action) {
      console.error(`[checkStorePermission] Invalid permission format: ${permission}`);
      return false;
    }

    // Check if role has this permission
    const hasPermission = role.permissions?.[category]?.[action] === true;

    return hasPermission;

  } catch (error) {
    console.error('[checkStorePermission] Error:', error);
    return false;
  }
}

/**
 * Wrapper for API routes to enforce store access via ContractSeat system
 *
 * Usage in API routes:
 * export const GET = withStoreAccess(async (request, context) => {
 *   // request.store, request.user, request.seat, request.role are now available
 *   const { store, user, seat, role } = request;
 *   // Your handler logic...
 * });
 *
 * @param {Function} handler - The actual route handler
 * @returns {Function} Wrapped handler with access validation
 */
export function withStoreAccess(handler) {
  return async (request, context) => {
    try {
      const params = await context.params;
      const { storePublicId } = params;

      const session = await auth();
      const { hasAccess, store, user, seat, role, error } = await validateStoreAccess(
        storePublicId,
        session
      );

      if (!hasAccess) {
        return NextResponse.json({
          error: error || "Access denied to this store",
          code: "STORE_ACCESS_DENIED"
        }, { status: 403 });
      }

      // Attach validated entities to request for handler to use
      request.store = store;
      request.user = user;
      request.seat = seat;
      request.role = role;
      request.contract = store.contract_id;

      // Execute the actual handler
      return await handler(request, context);

    } catch (error) {
      console.error('[withStoreAccess] Middleware error:', error);
      return NextResponse.json({
        error: "Internal server error in access validation",
        code: "MIDDLEWARE_ERROR"
      }, { status: 500 });
    }
  };
}

/**
 * Check if user can perform a specific action based on role level
 *
 * @param {Object} role - Role object from ContractSeat
 * @param {number} requiredLevel - Minimum role level required
 * @returns {boolean}
 */
export function hasMinimumRoleLevel(role, requiredLevel) {
  if (!role || !role.level) return false;
  return role.level >= requiredLevel;
}

/**
 * Get all stores accessible to a user within a specific contract
 * Useful for multi-store management within a single contract
 *
 * @param {string} userId - User's ObjectId
 * @param {string} contractId - Contract's ObjectId
 * @returns {Array} Stores accessible in this contract
 */
export async function getContractStoresForUser(userId, contractId) {
  try {
    await connectToDatabase();

    const seat = await ContractSeat.findOne({
      user_id: userId,
      contract_id: contractId,
      status: 'active'
    }).populate('default_role_id');

    if (!seat) return [];

    // Get all stores in contract
    const allStores = await Store.find({
      contract_id: contractId,
      is_deleted: { $ne: true }
    }).select('public_id name klaviyo_integration _id');

    // Filter to stores the seat can access
    const accessibleStores = allStores.filter(store =>
      seat.hasStoreAccess(store._id)
    );

    return accessibleStores.map(store => ({
      public_id: store.public_id,
      name: store.name,
      klaviyo_id: store.klaviyo_integration?.public_id || null,
      role: seat.getStoreRole(store._id)
    }));

  } catch (error) {
    console.error('[getContractStoresForUser] Error:', error);
    return [];
  }
}

/**
 * Validate contractor multi-contract isolation
 * Ensures contractor credits/permissions don't leak across contracts
 *
 * @param {string} userId - User's ObjectId
 * @param {string} contractId - Contract being accessed
 * @returns {Object} { isValid: boolean, seat: ContractSeat|null, error: string|null }
 */
export async function validateContractorIsolation(userId, contractId) {
  try {
    await connectToDatabase();

    const seat = await ContractSeat.findOne({
      user_id: userId,
      contract_id: contractId,
      status: 'active'
    }).populate('default_role_id');

    if (!seat) {
      return {
        isValid: false,
        seat: null,
        error: "No active seat for this contract"
      };
    }

    // Check if this is a contractor seat with isolation requirements
    const isContractor = seat.credit_limits?.isolated_credits === true;

    if (isContractor) {
      // Ensure contractor has proper role restrictions
      const role = seat.default_role_id;

      if (role.level > 60) { // Higher than manager
        return {
          isValid: false,
          seat,
          error: "Contractor cannot have owner/admin role"
        };
      }

      // Ensure billing attribution is set
      if (!seat.credit_limits?.billing_attribution?.contract_pays) {
        return {
          isValid: false,
          seat,
          error: "Contractor seat missing billing attribution"
        };
      }
    }

    return {
      isValid: true,
      seat,
      isContractor,
      error: null
    };

  } catch (error) {
    console.error('[validateContractorIsolation] Error:', error);
    return {
      isValid: false,
      seat: null,
      error: "Internal error validating contractor isolation"
    };
  }
}

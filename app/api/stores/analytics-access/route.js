import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Store from '@/models/Store';
import User from '@/models/User';
import ContractSeat from '@/models/ContractSeat';
import Role from '@/models/Role';
import connectToDatabase from '@/lib/mongoose';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching stores with analytics access for user:', session.user.id);

    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Super admins have access to all stores
    const isSuperAdmin = user?.is_super_user || user?.super_user_role === 'SUPER_ADMIN';
    
    if (isSuperAdmin) {
      console.log('Super admin - returning all non-deleted stores with analytics access');
      const allStores = await Store.find({ 
        is_deleted: { $ne: true },
        'klaviyo_integration.public_id': { $exists: true, $ne: null }
      }).lean();
      
      // Add user_role for consistency
      const storesWithRole = allStores.map(store => ({
        ...store,
        user_role: 'owner', // Super admins have owner-level access
        analytics_permissions: {
          view_all: true,
          view_own: true,
          export: true,
          view_financial: true
        }
      }));
      
      return NextResponse.json({ 
        stores: storesWithRole,
        hasFullAccess: true 
      });
    }

    // For regular users, check ContractSeat permissions
    const userSeats = await ContractSeat.find({
      user_id: session.user.id,
      status: 'active'
    }).populate('default_role_id');

    const storesWithAnalyticsAccess = [];
    const processedStoreIds = new Set();

    for (const seat of userSeats) {
      // Get all stores in this contract
      const contractStores = await Store.find({
        contract_id: seat.contract_id,
        is_deleted: { $ne: true },
        'klaviyo_integration.public_id': { $exists: true, $ne: null }
      }).lean();

      for (const store of contractStores) {
        // Skip if already processed
        if (processedStoreIds.has(store._id.toString())) {
          continue;
        }

        // Check if user has access to this specific store
        const hasStoreAccess = seat.hasStoreAccess(store._id);
        if (!hasStoreAccess) {
          continue;
        }

        // Get the role for this store
        let role = null;
        const storeAccess = seat.store_access.find(
          access => access.store_id.toString() === store._id.toString()
        );

        if (storeAccess) {
          // User has specific role for this store
          role = await Role.findById(storeAccess.role_id);
        } else if (seat.store_access.length === 0) {
          // User has default role for all stores in contract
          role = seat.default_role_id;
        }

        // Check if role has analytics permissions
        if (role && (role.permissions?.analytics?.view_all || 
                    role.permissions?.analytics?.view_own ||
                    role.name === 'owner' || 
                    role.name === 'admin' ||
                    role.name === 'manager')) {
          storesWithAnalyticsAccess.push({
            ...store,
            klaviyo_integration: store.klaviyo_integration, // Ensure klaviyo_integration is included
            analytics_permissions: {
              view_all: role.permissions?.analytics?.view_all || false,
              view_own: role.permissions?.analytics?.view_own || false,
              export: role.permissions?.analytics?.export || false,
              view_financial: role.permissions?.analytics?.view_financial || false
            },
            user_role: role.name
          });
          processedStoreIds.add(store._id.toString());
        }
      }
    }

    // Also check legacy permissions for backward compatibility
    const legacyStores = await Store.findByUser(session.user.id).lean();
    
    for (const store of legacyStores) {
      if (processedStoreIds.has(store._id.toString())) {
        continue;
      }

      // Only include stores with Klaviyo integration for analytics
      if (store.klaviyo_integration?.public_id) {
        // Check user's legacy permissions for this store
        const userPermission = user.store_permissions?.find(
          perm => perm.store_id?.toString() === store._id.toString()
        );

        // Legacy system - assume analytics access for certain roles
        if (userPermission && 
            (userPermission.role === 'owner' || 
             userPermission.role === 'admin' ||
             userPermission.permissions?.canViewAnalytics)) {
          storesWithAnalyticsAccess.push({
            ...store,
            analytics_permissions: {
              view_all: true,
              view_own: true,
              export: userPermission.role === 'owner' || userPermission.role === 'admin',
              view_financial: userPermission.role === 'owner'
            },
            user_role: userPermission.role
          });
          processedStoreIds.add(store._id.toString());
        }
      }
    }

    console.log(`Found ${storesWithAnalyticsAccess.length} stores with analytics access`);

    return NextResponse.json({ 
      stores: storesWithAnalyticsAccess,
      hasFullAccess: false
    });

  } catch (error) {
    console.error('Failed to fetch stores with analytics access:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
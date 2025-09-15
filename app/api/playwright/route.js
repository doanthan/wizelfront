import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import Store from '@/models/Store';
import { ContractModel } from '@/lib/contract-model';
import { ObjectId } from 'mongodb';
import connectToDatabase from '@/lib/mongoose';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    const debugInfo = {
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        } : null
      },
      stores: {
        count: 0,
        list: []
      },
      user: null,
      database: {
        connected: false,
        collections: []
      }
    };

    if (session?.user) {
      // Ensure mongoose connection
      await connectToDatabase();
      
      // Get user details
      const user = await User.findById(session.user.id);
      debugInfo.user = {
        id: user?._id?.toString(),
        email: user?.email,
        name: user?.name,
        is_super_admin: user?.is_super_user || user?.super_user_role === 'SUPER_ADMIN' || false,
        store_permissions_count: user?.store_permissions?.length || 0,
        store_permissions: user?.store_permissions?.map(sp => ({
          store_id: sp.store_id,
          role: sp.role,
          permissions_v2: sp.permissions_v2
        }))
      };

      // Get all stores
      const allStores = await Store.find({ isActive: true }).lean();
      
      debugInfo.stores.count = allStores.length;
      debugInfo.stores.list = allStores.map(store => ({
        id: store._id?.toString(),
        name: store.name,
        url: store.url,
        public_id: store.public_id,
        owner_id: store.owner_id,
        contract_id: store.contract_id,
        subscription_status: store.subscription_status
      }));

      // Database is connected if we got here
      debugInfo.database.connected = true;
    }

    // Return debug information
    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Playwright API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get debug info',
        message: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

// Test endpoint to create a store
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure mongoose connection
    await connectToDatabase();
    
    // Get user to get contract
    const user = await User.findById(session.user.id);
    if (!user?.primary_contract_id) {
      return NextResponse.json({ error: 'User has no contract' }, { status: 400 });
    }

    // Create a test store using Mongoose model
    const store = new Store({
      name: `Test Store ${Date.now()}`,
      url: `https://test-store-${Date.now()}.com`,
      shopify_domain: `test-store-${Date.now()}.myshopify.com`,
      owner_id: new ObjectId(session.user.id),
      contract_id: user.primary_contract_id,
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });

    await store.save();

    return NextResponse.json({
      message: 'Test store created',
      store: {
        id: store._id?.toString(),
        name: store.name,
        url: store.url,
        public_id: store.public_id
      }
    });
  } catch (error) {
    console.error('Failed to create test store:', error);
    return NextResponse.json(
      { error: 'Failed to create test store', message: error.message },
      { status: 500 }
    );
  }
}
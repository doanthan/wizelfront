import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request, context) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('No session found in collections API');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    
    console.log('Session found for user:', session.user.email);

    // Await params as required in Next.js 14+
    const { storePublicId } = await context.params;

    // Connect to MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    // Get the store to verify access
    const storesCollection = db.collection('stores');
    const store = await storesCollection.findOne({ public_id: storePublicId });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check user permissions for this store
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      email: session.user.email 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to view this store
    // First check if they're the owner
    let hasAccess = false;
    let userRole = null;

    const storeOwnerId = store.owner_id ? store.owner_id.toString() : null;
    const userId = user._id ? user._id.toString() : null;
    
    if (storeOwnerId && userId && storeOwnerId === userId) {
      hasAccess = true;
      userRole = 'owner';
    }

    // Check store_permissions array
    if (!hasAccess && user.store_permissions) {
      const storeId = store._id ? store._id.toString() : null;
      const storePermission = user.store_permissions.find(
        sp => {
          const spStoreId = sp.store_id ? sp.store_id.toString() : null;
          return spStoreId && storeId && spStoreId === storeId;
        }
      );
      
      if (storePermission) {
        hasAccess = true;
        userRole = storePermission.role;
      }
    }

    // Check if user is super admin
    if (user.is_super_admin || user.super_user_role === 'SUPER_ADMIN') {
      hasAccess = true;
      userRole = 'super_admin';
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if user can edit brands (to show Collections, Products, CTAs tabs)
    const canEditBrands = ['owner', 'admin', 'manager', 'super_admin'].includes(userRole);
    
    console.log('User role:', userRole, 'Can edit brands:', canEditBrands);

    // Fetch collections for this store
    const collectionsCollection = db.collection('collections');
    console.log('Fetching collections for store_public_id:', storePublicId);
    
    // Also try to find collections with store_id field in case they use that
    const collections = await collectionsCollection.find({
      $or: [
        { store_public_id: storePublicId },
        { store_id: store._id }
      ]
    }).toArray();
    
    console.log(`Found ${collections.length} collections for store ${storePublicId}`);

    // Format collections for frontend
    const formattedCollections = collections.map(collection => ({
      id: collection._id.toString(),
      shopify_collection_id: collection.shopify_collection_id,
      title: collection.title,
      handle: collection.handle,
      body_html: collection.body_html,
      products_count: collection.products_count || 0,
      status: collection.status || 'active',
      sync_status: collection.sync_status || 'synced',
      url_link: collection.url_link,
      domain: collection.domain,
      published_at: collection.published_at,
      updated_at: collection.shopify_updated_at,
      last_synced_at: collection.last_synced_at,
      marketing: collection.marketing || {
        tagline: '',
        description: '',
        key_benefits: [],
        target_audience: '',
        campaign_focus: null,
        campaign_performance: {
          total_emails_sent: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          last_updated: null
        }
      },
      shopify_image: collection.shopify_image || {
        src: null,
        alt: null
      },
      collection_type: collection.collection_type || 'custom',
      sort_order: collection.sort_order || ''
    }));

    return NextResponse.json({
      collections: formattedCollections,
      permissions: {
        canEditBrands,
        canCreateCollections: canEditBrands,
        canEditCollections: canEditBrands,
        canDeleteCollections: ['owner', 'admin', 'super_admin'].includes(userRole),
        userRole
      },
      store: {
        id: store._id.toString(),
        public_id: store.public_id,
        name: store.name,
        url: store.url,
        domain: store.domain
      }
    });

  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new collection
export async function POST(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params as required in Next.js 14+
    const { storePublicId } = await context.params;
    const body = await request.json();

    // Connect to MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    // Verify store and permissions
    const storesCollection = db.collection('stores');
    const store = await storesCollection.findOne({ public_id: storePublicId });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check user permissions
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ 
      email: session.user.email 
    });

    let canCreate = false;
    const storeOwnerId = store.owner_id ? store.owner_id.toString() : null;
    const userId = user._id ? user._id.toString() : null;
    
    if (storeOwnerId && userId && storeOwnerId === userId) {
      canCreate = true;
    } else if (user.store_permissions) {
      const storeId = store._id ? store._id.toString() : null;
      const storePermission = user.store_permissions.find(
        sp => {
          const spStoreId = sp.store_id ? sp.store_id.toString() : null;
          return spStoreId && storeId && spStoreId === storeId;
        }
      );
      if (storePermission && ['owner', 'admin', 'manager'].includes(storePermission.role)) {
        canCreate = true;
      }
    }
    
    if (user.is_super_admin) {
      canCreate = true;
    }

    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions to create collections' }, { status: 403 });
    }

    // Create new collection
    const collectionsCollection = db.collection('collections');
    const newCollection = {
      store_public_id: storePublicId,
      title: body.title,
      handle: body.handle || body.title.toLowerCase().replace(/\s+/g, '-'),
      body_html: body.body_html || '',
      collection_type: body.collection_type || 'custom',
      domain: store.url || store.domain,
      products_count: 0,
      status: 'active',
      sync_status: 'synced',
      marketing: {
        tagline: body.tagline || '',
        description: body.description || '',
        key_benefits: body.key_benefits || [],
        target_audience: body.target_audience || '',
        campaign_focus: null,
        campaign_performance: {
          total_emails_sent: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          last_updated: null
        }
      },
      created_at: new Date(),
      updated_at: new Date(),
      last_synced_at: new Date()
    };

    const result = await collectionsCollection.insertOne(newCollection);

    return NextResponse.json({
      success: true,
      collection: {
        id: result.insertedId.toString(),
        ...newCollection
      }
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection', details: error.message },
      { status: 500 }
    );
  }
}
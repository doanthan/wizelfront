import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check if user can edit brands (to show Collections, Products, CTAs tabs)
    // Owner, admin, manager roles can view/edit collections
    const canEditBrands = role?.level >= 60 || user.is_super_user; // Manager level (60) and above

    console.log('User role:', role?.name, 'Can edit brands:', canEditBrands);

    // Connect to MongoDB for collections data
    await connectToDatabase();
    const db = mongoose.connection.db;

    // Check if this is a Shopify store
    let formattedCollections = [];

    if (store.isShopify && store.shopifyCollections && store.shopifyCollections.length > 0) {
      // Use Shopify collections from the Store document
      console.log(`Using Shopify collections for store ${store.public_id}: ${store.shopifyCollections.length} collections`);

      formattedCollections = store.shopifyCollections.map(collection => ({
        id: collection.id,
        shopify_collection_id: collection.id,
        title: collection.title,
        handle: collection.handle,
        body_html: collection.body_html,
        products_count: collection.products_count || 0,
        status: collection.published_scope === 'web' ? 'active' : 'draft',
        sync_status: 'synced',
        url_link: store.url ? `${store.url}/collections/${collection.handle}` : null,
        domain: store.url || store.shopify_domain || store.domain,
        published_at: collection.published_at,
        updated_at: collection.updated_at,
        last_synced_at: store.shopifyCollectionsUpdatedAt || collection.updated_at,
        marketing: {
          tagline: '',
          description: collection.body_html || '',
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
        shopify_image: collection.image || {
          src: null,
          alt: null
        },
        collection_type: collection.collection_type || 'custom',
        sort_order: collection.sort_order || '',
        // Additional Shopify-specific fields
        isShopifyCollection: true,
        rules: collection.rules || [],
        disjunctive: collection.disjunctive || false
      }));
    } else {
      // Use regular collections from MongoDB collections collection
      const collectionsCollection = db.collection('collections');
      console.log('Fetching collections for store_public_id:', store.public_id);

      // Also try to find collections with store_id field in case they use that
      const collections = await collectionsCollection.find({
        $or: [
          { store_public_id: store.public_id },
          { store_id: store._id }
        ]
      }).toArray();

      console.log(`Found ${collections.length} collections for store ${store.public_id}`);

      // Format collections for frontend
      formattedCollections = collections.map(collection => ({
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
        sort_order: collection.sort_order || '',
        isShopifyCollection: false
      }));
    }

    return NextResponse.json({
      collections: formattedCollections,
      permissions: {
        canEditBrands,
        canCreateCollections: canEditBrands,
        canEditCollections: canEditBrands,
        canDeleteCollections: role?.level >= 80 || user.is_super_user, // Admin level (80) and above
        userRole: role?.name || 'unknown'
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
});

// POST endpoint to create a new collection
export const POST = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check if user has permission to create collections (manager level and above)
    if (role?.level < 60 && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create collections' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Connect to MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;

    // Create new collection
    const collectionsCollection = db.collection('collections');
    const newCollection = {
      store_public_id: store.public_id,
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
});
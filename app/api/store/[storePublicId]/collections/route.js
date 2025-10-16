import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Get pagination parameters from query
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    const search = url.searchParams.get('search') || '';

    // Check if user can edit brands (to show Collections, Products, CTAs tabs)
    // Owner, admin, manager roles can view/edit collections
    const canEditBrands = role?.level >= 60 || user.is_super_user; // Manager level (60) and above

    console.log('User role:', role?.name, 'Can edit brands:', canEditBrands);
    console.log('Pagination params:', { page, limit, skip, search });

    // Connect to MongoDB for collections data
    await connectToDatabase();
    const db = mongoose.connection.db;

    // Build search filter
    const searchFilter = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Fetch from collections collection
    const collectionsCol = db.collection('collections');
    console.log('Fetching collections for store_public_id:', store.public_id);

    const collectionsQuery = {
      store_public_ids: store.public_id,
      ...searchFilter
    };

    const totalCollectionsCount = await collectionsCol.countDocuments(collectionsQuery);

    const collectionsData = await collectionsCol.find(collectionsQuery)
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(`Found ${collectionsData.length} collections for store ${store.public_id}`);

    // Format collections data
    const totalCollections = totalCollectionsCount;
    const formattedCollections = collectionsData.map(collection => {
      // Ensure _id is always converted to string
      const idString = collection._id ? String(collection._id) : null;

      return {
        id: idString,
        collection_id: collection.collection_id ? String(collection.collection_id) : null,
        shopify_collection_id: collection.shopify_collection_id ? String(collection.shopify_collection_id) : (collection.collection_id ? String(collection.collection_id) : null),
        title: collection.title || 'Untitled Collection',
        handle: collection.handle || '',
        body_html: collection.description || '',
        description: collection.description || '',
        products_count: collection.products_count || 0,
        product_handles: collection.product_handles || [],
        status: collection.published_at ? 'active' : 'draft',
        sync_status: collection.sync_status || 'synced',
        url_link: collection.domain ? `https://${collection.domain}/collections/${collection.handle}` : null,
        domain: collection.domain || store.url || store.domain,
        published_at: collection.published_at,
        updated_at: collection.updated_at,
        last_synced_at: collection.last_synced_at,
        marketing: {
          tagline: '',
          description: collection.description || '',
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
        shopify_image: collection.image ? (
          typeof collection.image === 'string' ? {
            src: collection.image,
            alt: collection.title
          } : {
            src: collection.image.src || collection.image.url || null,
            alt: collection.image.alt || collection.title
          }
        ) : {
          src: null,
          alt: null
        },
        collection_type: 'custom',
        sort_order: '',
        isShopifyCollection: true,
        raw_data: collection.raw_data
      };
    });

    return NextResponse.json({
      collections: formattedCollections,
      pagination: {
        page,
        limit,
        total: totalCollections,
        totalPages: Math.ceil(totalCollections / limit),
        hasMore: skip + formattedCollections.length < totalCollections
      },
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

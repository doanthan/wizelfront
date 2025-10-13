import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import connectToDatabase from '@/lib/mongoose';

export const POST = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check if user has integration management permissions
    if (!role?.permissions?.stores?.manage_integrations && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage integrations' },
        { status: 403 }
      );
    }

    // Check if store has Shopify integration
    if (!store.shopify_integration || store.shopify_integration.status !== 'connected') {
      return NextResponse.json({
        error: 'Shopify integration not connected'
      }, { status: 400 });
    }

    if (!store.shopify_integration.access_token) {
      return NextResponse.json({
        error: 'Shopify access token not found'
      }, { status: 400 });
    }

    const shopifyDomain = store.shopify_domain || store.url;
    if (!shopifyDomain) {
      return NextResponse.json({
        error: 'Shopify domain not configured'
      }, { status: 400 });
    }

    // Fetch collections from Shopify API
    const shopifyUrl = `https://${shopifyDomain}/admin/api/2024-01/custom_collections.json`;

    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': store.shopify_integration.access_token,
        'Content-Type': 'application/json'
      }
    });

    if (!shopifyResponse.ok) {
      console.error('Shopify API error:', shopifyResponse.status, await shopifyResponse.text());
      return NextResponse.json({
        error: 'Failed to fetch collections from Shopify'
      }, { status: 500 });
    }

    const shopifyData = await shopifyResponse.json();
    const customCollections = shopifyData.custom_collections || [];

    // Also fetch smart collections
    const smartCollectionsUrl = `https://${shopifyDomain}/admin/api/2024-01/smart_collections.json`;
    const smartResponse = await fetch(smartCollectionsUrl, {
      headers: {
        'X-Shopify-Access-Token': store.shopify_integration.access_token,
        'Content-Type': 'application/json'
      }
    });

    let smartCollections = [];
    if (smartResponse.ok) {
      const smartData = await smartResponse.json();
      smartCollections = smartData.smart_collections || [];
    }

    // Combine both collection types
    const allCollections = [...customCollections, ...smartCollections];

    // Format collections for storage
    const formattedCollections = allCollections.map(col => ({
      id: col.id?.toString(),
      handle: col.handle,
      title: col.title,
      updated_at: col.updated_at,
      body_html: col.body_html,
      published_at: col.published_at,
      sort_order: col.sort_order,
      template_suffix: col.template_suffix,
      products_count: col.products_count || 0,
      collection_type: col.rules ? 'smart' : 'custom',
      published_scope: col.published_scope,
      admin_graphql_api_id: col.admin_graphql_api_id,
      image: col.image ? {
        created_at: col.image.created_at,
        alt: col.image.alt,
        width: col.image.width,
        height: col.image.height,
        src: col.image.src
      } : null,
      rules: col.rules || [],
      disjunctive: col.disjunctive || false
    }));

    // Update the store with Shopify collections
    store.isShopify = true;
    store.shopifyCollections = formattedCollections;
    store.shopifyCollectionsUpdatedAt = new Date();

    await store.save();

    console.log(`Synced ${formattedCollections.length} Shopify collections for store ${store.public_id}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${formattedCollections.length} collections from Shopify`,
      collections_count: formattedCollections.length,
      last_synced: store.shopifyCollectionsUpdatedAt
    });

  } catch (error) {
    console.error('Error syncing Shopify collections:', error);
    return NextResponse.json(
      { error: 'Failed to sync Shopify collections', details: error.message },
      { status: 500 }
    );
  }
});

// GET endpoint to check sync status
export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check if user has integration management permissions
    if (!role?.permissions?.stores?.manage_integrations && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage integrations' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isShopify: store.isShopify || false,
      collections_count: store.shopifyCollections?.length || 0,
      last_synced: store.shopifyCollectionsUpdatedAt,
      requires_sync: !store.shopifyCollectionsUpdatedAt ||
        (new Date() - new Date(store.shopifyCollectionsUpdatedAt)) > 24 * 60 * 60 * 1000 // Older than 24 hours
    });

  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
});
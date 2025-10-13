import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import mongoose from "mongoose";

export const GET = withStoreAccess(async (request, { params }) => {
  try {
    const { storePublicId } = await params;
    const storeId = storePublicId; // Use consistent naming
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // 'products', 'collections', or 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const db = mongoose.connection.db;

    let products = [];
    let collections = [];
    let totalProducts = 0;
    let totalCollections = 0;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Fetch products if needed
    if (type === 'products' || type === 'all') {
      const productsCollection = db.collection('products');
      const productQuery = {
        store_public_id: storeId,
        status: 'active',
        ...searchQuery
      };

      totalProducts = await productsCollection.countDocuments(productQuery);

      products = await productsCollection
        .find(productQuery)
        .sort({ updated_at: -1 })
        .skip(type === 'products' ? skip : 0)
        .limit(type === 'products' ? limit : 6)
        .toArray();

      // Transform products for frontend
      products = products.map(product => ({
        id: product._id.toString(),
        shopify_id: product.shopify_product_id,
        title: product.title,
        handle: product.handle,
        price: product.price,
        image: product.product_image_url || '/placeholder-product.png',
        description: product.description?.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
        type: 'product',
        vendor: product.vendor,
        available: product.available,
        inventory: product.inventory_quantity,
        variants_count: product.variants_count || 1
      }));
    }

    // Fetch collections if needed
    if (type === 'collections' || type === 'all') {
      const collectionsDb = db.collection('collections');
      const collectionQuery = {
        store_public_id: storeId,
        status: 'active',
        ...searchQuery
      };

      totalCollections = await collectionsDb.countDocuments(collectionQuery);

      collections = await collectionsDb
        .find(collectionQuery)
        .sort({ products_count: -1, updated_at: -1 })
        .skip(type === 'collections' ? skip : 0)
        .limit(type === 'collections' ? limit : 6)
        .toArray();

      // Transform collections for frontend
      collections = collections.map(collection => ({
        id: collection._id.toString(),
        shopify_id: collection.shopify_collection_id,
        title: collection.title,
        handle: collection.handle,
        image: collection.shopify_image?.src || '/placeholder-collection.png',
        description: collection.body_html?.replace(/<[^>]*>/g, '').substring(0, 150) ||
                     `Collection with ${collection.products_count} products`,
        type: 'collection',
        products_count: collection.products_count,
        collection_type: collection.collection_type
      }));
    }

    // Calculate pagination info
    const totalItems = type === 'products' ? totalProducts :
                      type === 'collections' ? totalCollections :
                      totalProducts + totalCollections;

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      success: true,
      data: {
        products,
        collections,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasMore: page < totalPages
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products/collections:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products and collections" },
      { status: 500 }
    );
  }
});
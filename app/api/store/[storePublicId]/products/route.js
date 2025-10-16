import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import mongoose from 'mongoose';

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { storePublicId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';
    const availability = searchParams.get('availability') || 'all';
    const priceMin = parseFloat(searchParams.get('priceMin')) || null;
    const priceMax = parseFloat(searchParams.get('priceMax')) || null;
    const productType = searchParams.get('productType') || '';
    const vendor = searchParams.get('vendor') || '';
    const skip = (page - 1) * limit;

    // Access validated entities from middleware
    const { store, user, role } = request;
    const db = mongoose.connection.db;

    // Check specific permissions for products
    const canEditProducts = user.is_super_user || role?.permissions?.products?.edit === true;
    const canCreateProducts = user.is_super_user || role?.permissions?.products?.create === true;
    const canDeleteProducts = user.is_super_user || role?.permissions?.products?.delete === true;
    
    // Build query - use store_public_ids array field
    const query = { store_public_ids: storePublicId };
    
    // Add search conditions
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } },
        { product_type: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Add availability filter
    if (availability === 'available') {
      query.available = true;
    } else if (availability === 'unavailable') {
      query.available = false;
    }
    
    // Add price range filter
    if (priceMin !== null || priceMax !== null) {
      query.price = {};
      if (priceMin !== null) {
        query.price.$gte = priceMin.toString();
      }
      if (priceMax !== null) {
        query.price.$lte = priceMax.toString();
      }
    }
    
    // Add product type filter
    if (productType) {
      query.product_type = productType;
    }
    
    // Add vendor filter
    if (vendor) {
      query.vendor = vendor;
    }
    
    // Determine sort order
    let sortOptions = {};
    switch (sort) {
      case 'oldest':
        sortOptions = { created_at: 1 };
        break;
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'name-az':
        sortOptions = { title: 1 };
        break;
      case 'name-za':
        sortOptions = { title: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { created_at: -1 };
        break;
    }
    
    // Get products from MongoDB 'products' collection
    const productsCollection = db.collection('products');

    const products = await productsCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await productsCollection.countDocuments(query);

    // Get unique product types and vendors for filter metadata
    const allProducts = await productsCollection
      .find({ store_public_ids: storePublicId })
      .project({ product_type: 1, vendor: 1 })
      .toArray();
    
    const uniqueProductTypes = [...new Set(allProducts.map(p => p.product_type).filter(Boolean))];
    const uniqueVendors = [...new Set(allProducts.map(p => p.vendor).filter(Boolean))];
    
    // Transform products data
    const transformedProducts = products.map(product => ({
      id: product._id.toString(),
      shopify_product_id: product.shopify_product_id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      product_type: product.product_type,
      vendor: product.vendor,
      status: product.status || 'active',
      tags: product.tags || [],
      price: product.price,
      compare_at_price: product.compare_at_price,
      available: product.available,
      inventory_quantity: product.inventory_quantity,
      product_image_url: product.product_image_url,
      images_count: product.images_count || 0,
      variants_count: product.variants_count || 0,
      options: product.options || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
      published_at: product.published_at,
      domain: product.domain
    }));
    
    console.log(`Found ${transformedProducts.length} products for store ${storePublicId}`);
    
    return NextResponse.json({
      products: transformedProducts,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      permissions: {
        canView: true,
        canEdit: canEditProducts,
        canCreate: canCreateProducts,
        canDelete: canDeleteProducts,
        userRole: role?.name || 'user'
      },
      store: {
        id: store._id.toString(),
        public_id: store.public_id,
        name: store.name,
        url: store.url
      },
      metadata: {
        productTypes: uniqueProductTypes.sort(),
        vendors: uniqueVendors.sort()
      }
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
});

// POST endpoint for importing products from Shopify
export const POST = withStoreAccess(async (request, context) => {
  try {
    const { storePublicId } = await context.params;
    const { store, user, role } = request;

    // Check if user has permission to import products
    const canEditProducts = user.is_super_user || role?.permissions?.products?.edit === true;

    if (!canEditProducts) {
      return NextResponse.json(
        { error: 'You do not have permission to import products' },
        { status: 403 }
      );
    }
    
    if (!store.url) {
      return NextResponse.json(
        { error: 'Store URL not configured' },
        { status: 400 }
      );
    }
    
    // Here you would typically:
    // 1. Call Shopify API to fetch products
    // 2. Store them in MongoDB
    // 3. Return success message
    
    // For now, return a placeholder response
    return NextResponse.json({
      message: 'Product import initiated',
      store: store.name
    });
    
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Failed to import products', details: error.message },
      { status: 500 }
    );
  }
});
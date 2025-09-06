import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';
import Store from '@/models/Store';
import Brand from '@/models/Brand';
import User from '@/models/User';
import Role from '@/models/Role';
import Contract from '@/models/Contract';
import ContractSeat from '@/models/ContractSeat';
// Removed checkStorePermissions import - will use inline permission checking like collections route

export async function GET(request, context) {
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
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    // Find the store
    const store = await Store.findOne({ public_id: storePublicId }).lean();
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Find the user
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to view this store
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

    // Define permissions based on role
    const canEditProducts = ['owner', 'admin', 'manager', 'super_admin'].includes(userRole);
    const canCreateProducts = ['owner', 'admin', 'super_admin'].includes(userRole);
    const canDeleteProducts = ['owner', 'admin', 'super_admin'].includes(userRole);
    
    // Build query
    const query = { store_public_id: storePublicId };
    
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
    
    // Get products from MongoDB - try both possible collection names
    let products = [];
    let totalCount = 0;
    
    // Try 'shopifyproducts' first (based on the structure of your data)
    const productsCollection = db.collection('shopifyproducts');
    products = await productsCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    totalCount = await productsCollection.countDocuments(query);
    
    // If no products found, try 'shopify_products' as fallback
    if (products.length === 0 && !search && !productType && !vendor && availability === 'all') {
      const altCollection = db.collection('shopify_products');
      products = await altCollection
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      totalCount = await altCollection.countDocuments(query);
    }
    
    // If still no products, try 'products'
    if (products.length === 0 && !search && !productType && !vendor && availability === 'all') {
      const productsOnlyCollection = db.collection('products');
      products = await productsOnlyCollection
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      totalCount = await productsOnlyCollection.countDocuments(query);
    }
    
    // Get unique product types and vendors for filter metadata
    const allProducts = await db.collection('shopifyproducts')
      .find({ store_public_id: storePublicId })
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
        userRole: userRole
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
}

// POST endpoint for importing products from Shopify
export async function POST(request, context) {
  try {
    const { storePublicId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Find the store first
    const store = await Store.findOne({ public_id: storePublicId }).lean();
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Find the user
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to edit this store
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

    const canEditProducts = ['owner', 'admin', 'manager', 'super_admin'].includes(userRole);
    
    if (!hasAccess || !canEditProducts) {
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
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';
import Store from '@/models/Store';
import User from '@/models/User';

export async function GET(request, context) {
  try {
    const { storePublicId, productId } = await context.params;
    
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
    
    // Try to find product with different collection names and ID formats
    let product = null;
    
    // Try with ObjectId format first
    try {
      const objectId = new mongoose.Types.ObjectId(productId);
      
      // Try 'shopifyproducts' first
      const productsCollection = db.collection('shopifyproducts');
      product = await productsCollection.findOne({ 
        _id: objectId,
        store_public_id: storePublicId 
      });
      
      // If not found, try 'shopify_products'
      if (!product) {
        const altCollection = db.collection('shopify_products');
        product = await altCollection.findOne({ 
          _id: objectId,
          store_public_id: storePublicId 
        });
      }
      
      // If not found, try 'products'
      if (!product) {
        const productsOnlyCollection = db.collection('products');
        product = await productsOnlyCollection.findOne({ 
          _id: objectId,
          store_public_id: storePublicId 
        });
      }
    } catch (objectIdError) {
      // If ObjectId conversion fails, try as string
      console.log('ObjectId conversion failed, trying as string:', objectIdError.message);
    }
    
    // If still not found, try with productId as string
    if (!product) {
      const productsCollection = db.collection('shopifyproducts');
      product = await productsCollection.findOne({ 
        shopify_product_id: productId,
        store_public_id: storePublicId 
      });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Note: Fixed image gallery issue where images_count was inaccurate
    // The component now correctly handles cases where images field is undefined
    // but images_count has a value, using available product_image_url instead
    
    // Transform product data
    const transformedProduct = {
      id: product._id.toString(),
      shopify_product_id: product.shopify_product_id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      description_text: product.description_text,
      marketing_name: product.marketing_name,
      product_type: product.product_type,
      vendor: product.vendor,
      status: product.status || 'active',
      tags: product.tags || [],
      price: product.price,
      compare_at_price: product.compare_at_price,
      available: product.available,
      inventory_quantity: product.inventory_quantity,
      product_image_url: product.product_image_url,
      images: product.images || [],
      images_count: product.images_count || 0,
      variants: product.variants || [],
      variants_count: product.variants_count || 0,
      options: product.options || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
      published_at: product.published_at,
      domain: product.domain,
      url_link: product.url_link
    };
    
    console.log(`Found product ${product.title} for store ${storePublicId}`);
    
    return NextResponse.json({
      product: transformedProduct,
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
      }
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating marketing fields only
export async function PATCH(request, context) {
  try {
    const { storePublicId, productId } = await context.params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    
    // Define allowed marketing fields that can be edited
    const allowedFields = ['title', 'marketing_name', 'description_text', 'product_type'];
    
    // Filter out non-allowed fields
    const updateData = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated timestamp
    updateData.updated_at = new Date();
    
    // Try to find and update product in different collections
    let updatedProduct = null;
    
    // Try with ObjectId format first
    try {
      const objectId = new mongoose.Types.ObjectId(productId);
      
      // Try 'shopifyproducts' first
      const productsCollection = db.collection('shopifyproducts');
      const result = await productsCollection.findOneAndUpdate(
        { _id: objectId, store_public_id: storePublicId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      if (result) {
        updatedProduct = result;
      } else {
        // Try 'shopify_products'
        const altCollection = db.collection('shopify_products');
        const altResult = await altCollection.findOneAndUpdate(
          { _id: objectId, store_public_id: storePublicId },
          { $set: updateData },
          { returnDocument: 'after' }
        );
        
        if (altResult) {
          updatedProduct = altResult;
        } else {
          // Try 'products'
          const productsOnlyCollection = db.collection('products');
          const productsResult = await productsOnlyCollection.findOneAndUpdate(
            { _id: objectId, store_public_id: storePublicId },
            { $set: updateData },
            { returnDocument: 'after' }
          );
          
          if (productsResult) {
            updatedProduct = productsResult;
          }
        }
      }
    } catch (objectIdError) {
      console.log('ObjectId conversion failed, trying as string:', objectIdError.message);
    }
    
    // If still not found, try with productId as shopify_product_id
    if (!updatedProduct) {
      const productsCollection = db.collection('shopifyproducts');
      const result = await productsCollection.findOneAndUpdate(
        { shopify_product_id: productId, store_public_id: storePublicId },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      updatedProduct = result;
    }
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Product not found or could not be updated' },
        { status: 404 }
      );
    }
    
    // Transform updated product data
    const transformedProduct = {
      id: updatedProduct._id.toString(),
      shopify_product_id: updatedProduct.shopify_product_id,
      title: updatedProduct.title,
      handle: updatedProduct.handle,
      description: updatedProduct.description,
      description_text: updatedProduct.description_text,
      marketing_name: updatedProduct.marketing_name,
      product_type: updatedProduct.product_type,
      vendor: updatedProduct.vendor,
      status: updatedProduct.status || 'active',
      tags: updatedProduct.tags || [],
      price: updatedProduct.price,
      compare_at_price: updatedProduct.compare_at_price,
      available: updatedProduct.available,
      inventory_quantity: updatedProduct.inventory_quantity,
      product_image_url: updatedProduct.product_image_url,
      images: updatedProduct.images || [],
      images_count: updatedProduct.images_count || 0,
      variants: updatedProduct.variants || [],
      variants_count: updatedProduct.variants_count || 0,
      options: updatedProduct.options || [],
      created_at: updatedProduct.created_at,
      updated_at: updatedProduct.updated_at,
      published_at: updatedProduct.published_at,
      domain: updatedProduct.domain,
      url_link: updatedProduct.url_link
    };
    
    console.log(`Updated product ${updatedProduct.title} for store ${storePublicId}`);
    
    return NextResponse.json({
      product: transformedProduct,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import mongoose from 'mongoose';

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { storePublicId, productId } = await context.params;
    const { store, user, role } = request;
    const db = mongoose.connection.db;

    // Check specific permissions for products
    const canEditProducts = user.is_super_user || role?.permissions?.products?.edit === true;
    const canCreateProducts = user.is_super_user || role?.permissions?.products?.create === true;
    const canDeleteProducts = user.is_super_user || role?.permissions?.products?.delete === true;
    
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
        userRole: role?.name || 'user'
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
});

// PATCH endpoint for updating marketing fields only
export const PATCH = withStoreAccess(async (request, context) => {
  try {
    const { storePublicId, productId } = await context.params;
    const { store, user, role } = request;
    const db = mongoose.connection.db;

    // Check if user has permission to edit products
    const canEditProducts = user.is_super_user || role?.permissions?.products?.edit === true;

    if (!canEditProducts) {
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
});
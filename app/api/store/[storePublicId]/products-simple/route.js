import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import mongoose from "mongoose";

export const GET = withStoreAccess(async (request, { params }) => {
  try {
    const { storePublicId } = await params;
    const db = mongoose.connection.db;

    // Fetch all active products for this store
    const productsCollection = db.collection('products');
    const products = await productsCollection
      .find({
        store_public_id: storePublicId,
        status: 'active'
      })
      .sort({ updated_at: -1 })
      .toArray();

    // Debug: Log first product structure
    if (products.length > 0) {
      console.log('First product structure:', {
        title: products[0].title,
        hasImages: !!products[0].images,
        imagesType: Array.isArray(products[0].images) ? 'array' : typeof products[0].images,
        imagesLength: products[0].images?.length,
        firstImage: products[0].images?.[0],
        product_image_url: products[0].product_image_url,
        featured_image: products[0].featured_image,
        image: products[0].image
      });
    }

    // Transform products for frontend with minimal data
    const transformedProducts = products.map(product => {
      // Handle various image field names that might exist
      let imageUrl = '/placeholder-product.png';

      // Check for Shopify image structure first
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Shopify stores images as an array with src property
        if (product.images[0].src) {
          imageUrl = product.images[0].src;
        } else if (typeof product.images[0] === 'string') {
          imageUrl = product.images[0];
        }
      } else if (product.featured_image) {
        // Some Shopify exports have featured_image
        imageUrl = product.featured_image;
      } else if (product.image) {
        // Simple image field
        imageUrl = product.image.src || product.image;
      } else if (product.product_image_url) {
        // Custom field name
        imageUrl = product.product_image_url;
      } else if (product.image_url) {
        // Alternative field name
        imageUrl = product.image_url;
      }

      // Ensure the image URL is absolute (for Shopify CDN images)
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `https:${imageUrl}`;
      }

      const transformed = {
        id: product._id.toString(),
        title: product.title,
        price: product.price || product.variants?.[0]?.price || 0,
        image: imageUrl,
        vendor: product.vendor || '',
        available: product.available !== false,
        inventory: product.inventory_quantity || product.variants?.[0]?.inventory_quantity || 0
      };

      // Debug log for first few products
      if (transformedProducts.length < 3) {
        console.log(`Product "${transformed.title}" image URL:`, transformed.image);
      }

      return transformed;
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total: transformedProducts.length
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
});
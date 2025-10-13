import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';

export const GET = withStoreAccess(async (request, { params }) => {
  try {
    const { storePublicId } = await params;
    const { store } = request;

    // Get the store URL - could be from shopify_domain or url field
    let storeUrl = store.shopify_domain || store.url;

    if (!storeUrl) {
      return NextResponse.json({
        error: "Store URL not configured",
        message: "Please ensure your store has a Shopify domain configured"
      }, { status: 400 });
    }

    // Clean up the URL
    storeUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Fetch ALL products from Shopify with pagination
    let allProducts = [];
    let page = 1;
    let hasMorePages = true;
    const limit = 250; // Shopify's maximum limit per request

    console.log(`Starting to fetch all products from: https://${storeUrl}/products.json`);

    while (hasMorePages) {
      const productsUrl = `https://${storeUrl}/products.json?limit=${limit}&page=${page}`;

      console.log(`Fetching page ${page} from: ${productsUrl}`);

      const response = await fetch(productsUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Wizel-App/1.0'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch from Shopify: ${response.status} ${response.statusText}`);
        // If first page fails, return error
        if (page === 1) {
          return NextResponse.json({
            error: "Failed to fetch products from Shopify",
            details: `Status: ${response.status}`,
            url: productsUrl
          }, { status: response.status });
        }
        // If subsequent pages fail, break but keep what we have
        break;
      }

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        allProducts = [...allProducts, ...data.products];
        console.log(`Page ${page}: Got ${data.products.length} products (Total: ${allProducts.length})`);

        // If we got less than the limit, we've reached the end
        if (data.products.length < limit) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        // No more products
        hasMorePages = false;
      }

      // Safety check - prevent infinite loops (max 100 pages = 25,000 products)
      if (page > 100) {
        console.warn('Reached maximum page limit (100)');
        hasMorePages = false;
      }

      // Add a small delay between requests to be respectful to Shopify's API
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Successfully fetched ${allProducts.length} total products from Shopify`);

    // Transform Shopify products to our format
    const transformedProducts = allProducts.map(product => {
      // Get the first image from Shopify's images array
      let imageUrl = '/placeholder-product.png';

      if (product.images && product.images.length > 0) {
        imageUrl = product.images[0].src || product.images[0];
      } else if (product.image) {
        imageUrl = product.image.src || product.image;
      } else if (product.featured_image) {
        imageUrl = product.featured_image;
      }

      return {
        id: product.id.toString(),
        title: product.title,
        handle: product.handle,
        price: product.variants?.[0]?.price || '0',
        image: imageUrl,
        vendor: product.vendor || '',
        available: product.variants?.[0]?.available !== false,
        inventory: product.variants?.[0]?.inventory_quantity || 0,
        description: product.body_html?.replace(/<[^>]*>/g, '').substring(0, 150) || '',
        tags: product.tags || [],
        product_type: product.product_type || ''
      };
    });

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total: transformedProducts.length,
      source: 'shopify',
      pages_fetched: page - 1,
      message: `Fetched all ${transformedProducts.length} products from ${page - 1} page(s)`
    });

  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch products from Shopify",
        details: error.toString()
      },
      { status: 500 }
    );
  }
});
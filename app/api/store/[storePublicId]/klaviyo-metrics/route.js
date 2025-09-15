import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    
    await connectToDatabase();
    
    // Find the store
    const store = await Store.findOne({ 
      public_id: storePublicId,
      is_deleted: { $ne: true }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if Klaviyo is connected
    if (store.klaviyo_integration?.status !== 'connected') {
      return NextResponse.json({ 
        error: 'Klaviyo not connected',
        metrics: [],
        account: null 
      }, { status: 200 });
    }

    try {
      // Build OAuth-first authentication
      const authOptions = buildKlaviyoAuthOptions(store);
      
      // Fetch standard metrics
      const metricsResponse = await klaviyoRequest('GET', 'metrics', {
        ...authOptions,
        params: {
          'page[size]': 100
        }
      });
      
      // Try to fetch custom metrics as well
      let customMetricsResponse = null;
      try {
        customMetricsResponse = await klaviyoRequest('GET', 'custom-metrics', {
          ...authOptions,
          params: {
            'page[size]': 100
          }
        });
      } catch (customError) {
        console.log('Custom metrics not available or error fetching:', customError.message);
        // Continue without custom metrics
      }
      
      // Process standard metrics
      const processedMetrics = (metricsResponse?.data || []).map(metric => ({
        ...metric,
        isShopifyPlacedOrder: metric.attributes?.name === "Placed Order" && 
                             metric.attributes?.integration?.key === "shopify",
        integration: metric.attributes?.integration?.name || 'Standard',
        category: 'standard'
      }));
      
      // Add custom metrics if available
      if (customMetricsResponse?.data) {
        const existingIds = new Set(processedMetrics.map(m => m.id));
        customMetricsResponse.data.forEach(metric => {
          if (!existingIds.has(metric.id)) {
            processedMetrics.push({
              ...metric,
              isShopifyPlacedOrder: false,
              integration: 'Custom',
              category: 'custom',
              attributes: {
                ...metric.attributes,
                name: metric.attributes?.name || metric.attributes?.display_name || metric.id
              }
            });
          }
        });
      }
      
      // Sort metrics: Shopify Placed Order first, then Custom metrics, then alphabetically
      processedMetrics.sort((a, b) => {
        if (a.isShopifyPlacedOrder) return -1;
        if (b.isShopifyPlacedOrder) return 1;
        // Custom metrics come after recommended but before standard
        if (a.category === 'custom' && b.category !== 'custom') return -1;
        if (b.category === 'custom' && a.category !== 'custom') return 1;
        return (a.attributes?.name || '').localeCompare(b.attributes?.name || '');
      });

      // Fetch account info
      let accountInfo = null;
      try {
        const accountResponse = await klaviyoRequest('GET', 'accounts', authOptions);
        if (accountResponse?.data?.[0]) {
          const account = accountResponse.data[0];
          accountInfo = {
            id: account.id,
            test_account: account.attributes?.test_account,
            contact_information: account.attributes?.contact_information,
            locale: account.attributes?.locale,
            timezone: account.attributes?.timezone,
            preferred_currency: account.attributes?.preferred_currency,
            public_api_key: account.attributes?.public_api_key
          };
        }
      } catch (accountError) {
        console.error('Error fetching account info:', accountError);
      }

      return NextResponse.json({
        metrics: processedMetrics,
        account: accountInfo,
        success: true
      });
      
    } catch (apiError) {
      console.error('Klaviyo API error:', apiError);
      
      // Check if token expired and needs refresh
      if (apiError.message?.includes('401') && store.klaviyo_integration?.refresh_token) {
        // Token might be expired, but the klaviyo-api library should handle refresh automatically
        return NextResponse.json({ 
          error: 'Authentication failed. Please reconnect.',
          metrics: [],
          account: null 
        }, { status: 401 });
      }
      
      return NextResponse.json({
        error: 'Failed to fetch metrics',
        metrics: [],
        account: null
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
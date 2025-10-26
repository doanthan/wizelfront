import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import connectToDatabase from '@/lib/mongoose';
import { klaviyoGetAll } from '@/lib/klaviyo-api';
import { logAuditEvent } from '@/lib/posthog-audit';

async function completeConnection(store, apiKey, metricId, reportingMetricId, refundMetricIds) {
  try {
    console.log("Completing Klaviyo connection with metrics:", { conversion: metricId, reporting: reportingMetricId, refund: refundMetricIds });
    
    // Fetch account info to verify API key
    const account = await klaviyoGetAll("accounts", { apiKey });
    
    if (!account || !account.data || account.data.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }
    
    // Update store with Klaviyo integration
    store.klaviyo_integration = {
      status: 'connected',
      account: account,
      public_id: account.data[0].attributes?.public_api_key || account.data[0].id,
      conversion_metric_id: metricId,
      reporting_metric_id: reportingMetricId || null,
      refund_metric_ids: refundMetricIds || [],
      conversion_type: 'value',
      apiKey: apiKey,
      auth_type: 'api_key',
      connected_at: new Date(),
      last_sync: new Date()
    };
    
    // Save timezone and currency from Klaviyo account
    if (account.data[0].attributes?.timezone) {
      store.timezone = account.data[0].attributes.timezone;
    }
    if (account.data[0].attributes?.preferred_currency) {
      store.currency = account.data[0].attributes.preferred_currency;
    }
    
    await store.save();
    console.log("Store saved with Klaviyo integration");
    
    // Log audit event for Klaviyo connection
    await logAuditEvent({
      action: 'KLAVIYO_CONNECT',
      userId: store._id.toString(),
      storeId: store.public_id,
      metadata: {
        account_id: account.data[0].id,
        auth_type: 'api_key',
        has_conversion_metric: !!metricId,
        has_reporting_metric: !!reportingMetricId,
        refund_metric_count: refundMetricIds?.length || 0
      },
      severity: 'info',
      success: true
    });
    
    // Check if it's Shopify Placed Order and store this information
    let isShopifyPlacedOrder = false;
    if (metricId) {
      try {
        const metrics = await klaviyoGetAll("metrics", { apiKey });
        const selectedMetric = metrics.data.find(m => m.id === metricId);
        isShopifyPlacedOrder = selectedMetric &&
                               selectedMetric.attributes.name === "Placed Order" &&
                               selectedMetric.attributes.integration?.key === "shopify";
      } catch (e) {
        console.error("Error checking metric type:", e);
      }
    }

    // Add is_shopify_placed_order flag to klaviyo_integration
    store.klaviyo_integration.is_shopify_placed_order = isShopifyPlacedOrder;

    // Trigger sync if we have a metric
    if (metricId) {
      // Trigger report server sync (fire-and-forget)
      const reportServerUrl = process.env.REPORT_SERVER || 'http://localhost:8001';
      const reportServerKey = process.env.REPORT_SERVER_KEY;

      if (reportServerKey) {
        (async () => {
          try {
            const syncPayload = {
              klaviyo_public_id: store.klaviyo_integration.public_id,
              do_not_order_sync: !isShopifyPlacedOrder,
              env: process.env.NODE_ENV
            };

            console.log("Triggering report server sync:", syncPayload);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            await fetch(`${reportServerUrl}/api/v2/reports/full_sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${reportServerKey}`
              },
              body: JSON.stringify(syncPayload),
              signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));
          } catch (error) {
            if (error.name === 'AbortError') {
              console.warn("Report server sync timed out after 10 seconds (non-blocking, sync will continue in background)");
            } else {
              console.error("Report server sync error (non-blocking):", error);
            }
          }
        })();
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Klaviyo connected successfully',
      klaviyo_integration: store.klaviyo_integration
    });
    
  } catch (error) {
    console.error("Error completing Klaviyo connection:", error);
    return NextResponse.json({
      error: 'Failed to connect Klaviyo',
      details: error.message
    }, { status: 500 });
  }
}

// GET - Fetch current Klaviyo integration status
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

    // Return klaviyo integration status matching old code format
    return NextResponse.json({
      success: true,
      klaviyo_integration: store.klaviyo_integration || {
        status: "not_configured",
        connected_at: null,
        last_sync: null,
        sync_status: null,
        is_shopify_placed_order: false
      }
    });

  } catch (error) {
    console.error('GET /api/store/[storePublicId]/klaviyo-connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST - Connect/Update Klaviyo integration
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

    const body = await request.json();
    const { apiKey, action, conversionMetricId, conversion_metric_id, reporting_metric_id, refund_metric_ids, conversion_type } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // If action is "test", just test the API and return metrics
    if (action === 'test') {
      try {
        console.log("Testing Klaviyo API and fetching metrics...");
        
        // Fetch account and standard metrics (required)
        const [account, standardMetrics] = await Promise.all([
          klaviyoGetAll("accounts", { apiKey }),
          klaviyoGetAll("metrics", { apiKey })
        ]);
        
        // Try to fetch custom metrics, but don't fail if it errors
        let customMetrics = { data: [] };
        try {
          customMetrics = await klaviyoGetAll("custom-metrics", { apiKey });
          console.log(`Found ${customMetrics.data?.length || 0} custom metrics`);
        } catch (customError) {
          console.warn("Failed to fetch custom metrics:", customError.message);
          // Continue without custom metrics
        }
        
        // Combine and format metrics for frontend
        const allMetrics = [];
        
        // Add standard metrics
        standardMetrics.data.forEach(metric => {
          allMetrics.push({
            id: metric.id,
            name: metric.attributes.name,
            integration: metric.attributes.integration?.name || 'Standard',
            category: metric.attributes.integration?.category || 'STANDARD',
            isShopifyPlacedOrder: metric.attributes.name === "Placed Order" && 
                                 metric.attributes.integration?.key === "shopify"
          });
        });
        
        // Add custom metrics (custom-metrics endpoint returns different structure)
        const existingIds = new Set(allMetrics.map(m => m.id));
        if (customMetrics.data && Array.isArray(customMetrics.data)) {
          customMetrics.data.forEach(metric => {
            // Custom metrics have a different structure - they don't have integration field
            if (!existingIds.has(metric.id)) {
              allMetrics.push({
                id: metric.id,
                name: metric.attributes.name || metric.attributes.display_name,
                integration: 'Custom',
                category: 'CUSTOM',
                isShopifyPlacedOrder: false
              });
            }
          });
        }
        
        // Sort metrics: Shopify Placed Order first, then alphabetically
        allMetrics.sort((a, b) => {
          if (a.isShopifyPlacedOrder) return -1;
          if (b.isShopifyPlacedOrder) return 1;
          return a.name.localeCompare(b.name);
        });
        
        return NextResponse.json({
          success: true,
          action: 'test',
          account: {
            id: account.data[0].id,
            name: account.data[0].attributes.contact_information?.organization_name || 
                  account.data[0].attributes.contact_information?.contact_email || 
                  'Unknown Account'
          },
          metrics: allMetrics
        });
        
      } catch (error) {
        console.error("Error testing Klaviyo API:", error);
        return NextResponse.json({
          success: false,
          message: "Failed to validate API key or fetch metrics. Please check your connection and try again.",
          error: error.message
        }, { status: 500 });
      }
    }

    // If action is "connect", complete the connection
    if (action === 'connect') {
      // Use conversion_metric_id from body (frontend sends this), fallback to conversionMetricId
      const metricId = conversion_metric_id || conversionMetricId || null;
      
      // Check if store already has OAuth connection
      if (store.klaviyo_integration?.auth_type === 'oauth' && store.klaviyo_integration?.oauth_token) {
        // Check if the selected metric is Shopify Placed Order for OAuth connections
        let isShopifyPlacedOrderOAuth = false;
        if (metricId) {
          try {
            // We need to get metrics using OAuth token - for now, we'll use the auth helper
            const { buildKlaviyoAuthOptions } = require('@/lib/klaviyo-auth-helper');
            const authOptions = buildKlaviyoAuthOptions(store);
            const metrics = await klaviyoGetAll("metrics", authOptions);
            const selectedMetric = metrics.data.find(m => m.id === metricId);
            isShopifyPlacedOrderOAuth = selectedMetric &&
                                      selectedMetric.attributes.name === "Placed Order" &&
                                      selectedMetric.attributes.integration?.key === "shopify";
          } catch (e) {
            console.error("Error checking OAuth metric type:", e);
          }
        }

        // Update metrics and is_shopify_placed_order flag for OAuth connections
        store.klaviyo_integration.conversion_metric_id = metricId;
        store.klaviyo_integration.reporting_metric_id = reporting_metric_id || null;
        store.klaviyo_integration.refund_metric_ids = refund_metric_ids || [];
        store.klaviyo_integration.conversion_type = conversion_type || 'value';
        store.klaviyo_integration.is_shopify_placed_order = isShopifyPlacedOrderOAuth;
        await store.save();

        return NextResponse.json({
          success: true,
          message: 'Klaviyo settings updated successfully',
          klaviyo_integration: store.klaviyo_integration
        });
      }
      
      // Otherwise use API key to complete connection
      return await completeConnection(store, apiKey, metricId, reporting_metric_id, refund_metric_ids);
    }

    // Otherwise, complete the connection with the selected metric (legacy flow)
    let finalMetricId = conversion_metric_id || conversionMetricId;
    let isShopifyPlacedOrder = false; // Define in outer scope
    
    try {
      console.time("klaviyo fetches");
      
      // Fetch account info and metrics to verify the selected metric
      const [account, metrics] = await Promise.all([
        klaviyoGetAll("accounts", { apiKey }),
        klaviyoGetAll("metrics", { apiKey })
      ]);
      
      // Check if the selected metric is Shopify Placed Order
      const selectedMetric = metrics.data.find(m => m.id === conversion_metric_id);
      isShopifyPlacedOrder = selectedMetric &&
                             selectedMetric.attributes.name === "Placed Order" &&
                             selectedMetric.attributes.integration?.key === "shopify";

      console.log(`Selected metric: ${selectedMetric?.attributes?.name}, Is Shopify Placed Order: ${isShopifyPlacedOrder}`);

      // Update store with Klaviyo integration in the correct format (matching old code structure)
      store.klaviyo_integration = {
        status: 'connected',
        account: account,  // Store full account object like old code
        public_id: account.data[0].id,
        conversion_metric_id: conversion_metric_id ? conversion_metric_id : null,
        reporting_metric_id: reporting_metric_id ? reporting_metric_id : null,
        refund_metric_ids: refund_metric_ids || [],
        conversion_type: 'value',
        apiKey: apiKey,
        connected_at: new Date(),
        last_sync: new Date(),
        is_updating_dashboard: false,
        is_shopify_placed_order: isShopifyPlacedOrder, // Add flag to track if using Shopify Placed Order
        campaign_values_last_update: null,
        segment_series_last_update: null,
        flow_series_last_update: null,
        form_series_last_update: null
      };
      
      console.timeEnd("klaviyo fetches");
      
      // Save the store with updated integration
      await store.save();
      
      // Log audit event for successful connection
      await logAuditEvent({
        action: 'KLAVIYO_CONNECT',
        userId: user._id.toString(),
        userEmail: user.email,
        storeId: store.public_id,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        metadata: {
          account_id: store.klaviyo_integration.public_id,
          auth_type: 'api_key',
          has_conversion_metric: !!conversion_metric_id,
          has_reporting_metric: !!reporting_metric_id,
          refund_metric_count: refund_metric_ids?.length || 0,
          is_shopify_placed_order: isShopifyPlacedOrder
        },
        severity: 'info',
        success: true
      });
      
    } catch (error) {
      console.error("Error testing Klaviyo API key:", error);
      return NextResponse.json({
        success: false,
        message: "Failed to validate API key. Please check your connection and try again."
      }, { status: 500 });
    }
    
    // NOW call report server after store is saved (fire-and-forget)
    if (conversion_metric_id && store.klaviyo_integration.apiKey) {
      console.log("Triggering report server sync (fire-and-forget)");
      
      const reportServerUrl = process.env.REPORT_SERVER || 'http://localhost:8001';
      const reportServerKey = process.env.REPORT_SERVER_KEY;
      
      if (!reportServerKey) {
        console.error("REPORT_SERVER_KEY environment variable is not set");
      } else {
        // Fire and forget - don't await the response
        (async () => {
          try {
            // Build payload with do_not_order_sync flag if not using Shopify Placed Order
            const syncPayload = {
              klaviyo_public_id: store.klaviyo_integration.public_id,
              store_public_id: store.public_id,
              force_full:true,
              env: process.env.NODE_ENV
            };
            
            console.log("Sending sync request to report server:", {
              url: `${reportServerUrl}/api/v2/reports/full_sync`,
              ...syncPayload
            });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`${reportServerUrl}/api/v2/reports/full_sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${reportServerKey}`
              },
              body: JSON.stringify(syncPayload),
              signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Report server sync failed with status: ${response.status}`, errorText);
            } else {
              const result = await response.json();
              console.log("Report server sync initiated successfully:", result);
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.warn("Report server sync timed out after 10 seconds (non-blocking, sync will continue in background)");
            } else {
              console.error("Error triggering report server sync:", error.message, error.stack);
            }
          }
        })();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Klaviyo connected successfully",
      store: store
    });

  } catch (error) {
    console.error('POST /api/store/[storePublicId]/klaviyo-connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE - Disconnect Klaviyo integration
export const DELETE = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check if user has integration management permissions
    if (!role?.permissions?.stores?.manage_integrations && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage integrations' },
        { status: 403 }
      );
    }

    // Check if integration exists
    const klaviyoIntegration = store.klaviyo_integration;
    if (!klaviyoIntegration || klaviyoIntegration.status === 'not_configured') {
      return NextResponse.json({ error: 'Klaviyo integration not found' }, { status: 404 });
    }

    // Reset Klaviyo integration to not_configured state
    store.klaviyo_integration = {
      status: 'not_configured',
      public_id: null,
      conversion_type: 'value',
      conversion_metric_id: null,
      reporting_metric_id: null,
      refund_metric_ids: [],
      apiKey: null,
      connected_at: null,
      is_updating_dashboard: false,
      is_shopify_placed_order: false,
      campaign_values_last_update: null,
      segment_series_last_update: null,
      flow_series_last_update: null,
      form_series_last_update: null
    };

    await store.save();

    // Log audit event for Klaviyo disconnection
    await logAuditEvent({
      action: 'KLAVIYO_DISCONNECT',
      userId: user._id.toString(),
      userEmail: user.email,
      storeId: store.public_id,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      metadata: {
        previous_account_id: klaviyoIntegration.public_id,
        auth_type: klaviyoIntegration.auth_type || 'api_key'
      },
      severity: 'info',
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Klaviyo integration disconnected successfully'
    });

  } catch (error) {
    console.error('DELETE /api/store/[storePublicId]/klaviyo-connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

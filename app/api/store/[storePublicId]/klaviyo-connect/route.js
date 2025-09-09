import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Store from '@/models/Store';
import ContractSeat from '@/models/ContractSeat';
import Role from '@/models/Role';
import connectToDatabase from '@/lib/mongoose';
import { klaviyoGetAll } from '@/lib/klaviyo-api';

async function validatePermissions(userId, storeId) {
  // Find the user's contract seat for this store
  const contractSeat = await ContractSeat.findOne({
    user_id: userId,
    'store_access.store_id': storeId
  }).populate('default_role_id');

  if (!contractSeat) {
    return { hasPermission: false, error: 'User not associated with this store' };
  }

  // Get the role for this specific store or default role
  const storeAccess = contractSeat.store_access?.find(access => 
    access.store_id.toString() === storeId.toString()
  );
  
  const roleToCheck = storeAccess ? 
    await Role.findById(storeAccess.role_id) : 
    contractSeat.default_role_id;
    
  if (!roleToCheck) {
    return { 
      hasPermission: false, 
      error: 'No valid role found for this store' 
    };
  }
  
  // Check if user has manage_integrations permission
  const hasManageIntegrations = roleToCheck.permissions?.stores?.manage_integrations;
  
  // Only owners (100) and admins (80) can manage integrations
  if (!hasManageIntegrations || roleToCheck.level < 80) {
    return { 
      hasPermission: false, 
      error: 'Insufficient permissions. Manage integrations requires owner or admin role.' 
    };
  }

  return { hasPermission: true };
}



// GET - Fetch current Klaviyo integration status
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storePublicId } = await params;
    
    // Get user from authentication session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find store by storePublicId
    const store = await Store.findByIdOrPublicId(storePublicId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Validate permissions
    const permissionCheck = await validatePermissions(session.user.id, store._id);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    // Return klaviyo integration status matching old code format
    return NextResponse.json({
      success: true,
      klaviyo_integration: store.klaviyo_integration || {
        status: "not_configured",
        connected_at: null,
        last_sync: null,
        sync_status: null
      }
    });

  } catch (error) {
    console.error('GET /api/store/[storePublicId]/klaviyo-connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Connect/Update Klaviyo integration
export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storePublicId } = await params;
    const body = await request.json();
    const { apiKey, action, conversionMetricId } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Get user from authentication session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find store by storePublicId
    const store = await Store.findByIdOrPublicId(storePublicId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Validate permissions
    const permissionCheck = await validatePermissions(session.user.id, store._id);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
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

    // Otherwise, complete the connection with the selected metric
    if (!conversionMetricId) {
      return NextResponse.json({ error: 'Conversion metric ID is required' }, { status: 400 });
    }

    let conversion_metric_id = conversionMetricId;
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
        conversion_type: 'value',
        apiKey: apiKey,
        connected_at: new Date(),
        last_sync: new Date(),
        is_updating_dashboard: false,
        campaign_values_last_update: null,
        segment_series_last_update: null,
        flow_series_last_update: null,
        form_series_last_update: null
      };
      
      console.timeEnd("klaviyo fetches");
      
      // Save the store with updated integration FIRST
      await store.save();
      
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
              do_not_order_sync: !isShopifyPlacedOrder  // true if NOT Shopify Placed Order
            };
            
            console.log("Sending sync request to report server:", {
              url: `${reportServerUrl}/api/v1/reports/full_sync`,
              ...syncPayload
            });
            
            const response = await fetch(`${reportServerUrl}/api/v1/reports/full_sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${reportServerKey}`
              },
              body: JSON.stringify(syncPayload)
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Report server sync failed with status: ${response.status}`, errorText);
            } else {
              const result = await response.json();
              console.log("Report server sync initiated successfully:", result);
            }
          } catch (error) {
            console.error("Error triggering report server sync:", error.message, error.stack);
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
}

// DELETE - Disconnect Klaviyo integration
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storePublicId } = await params;

    // Get user from authentication session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find store by storePublicId
    const store = await Store.findByIdOrPublicId(storePublicId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Validate permissions
    const permissionCheck = await validatePermissions(session.user.id, store._id);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
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
      apiKey: null,
      connected_at: null,
      is_updating_dashboard: false,
      campaign_values_last_update: null,
      segment_series_last_update: null,
      flow_series_last_update: null,
      form_series_last_update: null
    };
    
    await store.save();

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
}

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
    const { apiKey } = body;

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

    let conversion_metric_id;  // Declare here so it's accessible later
    
    try {
      console.time("klaviyo fetches");
      
      // Use klaviyoGetAll to fetch account and metrics like in old code
      const [account, metrics] = await Promise.all([
        klaviyoGetAll("accounts", { apiKey }),
        klaviyoGetAll("metrics", { apiKey }),
      ]);
      
      // Find conversion metric (Placed Order)
      conversion_metric_id = metrics.data.find(metric =>
        metric.attributes.name === "Placed Order" &&
        metric.attributes.integration?.key === "shopify"
      )?.id;
      
      // Fallback to just "Placed Order" if Shopify integration not found
      if (!conversion_metric_id) {
        conversion_metric_id = metrics.data.find(metric =>
          metric.attributes.name === "Placed Order"
        )?.id;
      }
      
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
            console.log("Sending sync request to report server:", {
              url: `${reportServerUrl}/api/v1/reports/full_sync`,
              klaviyo_public_id: store.klaviyo_integration.public_id,
              store_public_id: store.public_id
            });
            
            const response = await fetch(`${reportServerUrl}/api/v1/reports/full_sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${reportServerKey}`
              },
              body: JSON.stringify({
                klaviyo_public_id: store.klaviyo_integration.public_id,
                store_public_id: store.public_id
              })
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

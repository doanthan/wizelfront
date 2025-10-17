import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import WebFeed from '@/models/WebFeed';
import { getServerSession } from 'next-auth';
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    const query = {};
    if (storeId) {
      query.store_id = storeId;
    }
    
    const webFeeds = await WebFeed.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, webFeeds });
  } catch (error) {
    console.error('Error fetching web feeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web feeds' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const data = await request.json();
    
    // Check if a webfeed with the same name already exists for this store
    const existingFeed = await WebFeed.findOne({
      store_id: data.store_id,
      name: { $regex: new RegExp(`^${data.name}$`, 'i') } // Case-insensitive check
    });
    
    if (existingFeed) {
      return NextResponse.json(
        { 
          error: `A web feed named "${data.name}" already exists for this store. Please choose a different name.`,
          field: 'name'
        },
        { status: 400 }
      );
    }
    
    const webFeed = new WebFeed({
      ...data,
      created_by: session.user.id
    });
    
    await webFeed.save();
    
    // Always generate R2 JSON and sync to Klaviyo for new feeds
    const { updateWebFeedCache } = await import('@/lib/r2-webfeed-helpers');
    const cacheResult = await updateWebFeedCache(webFeed);
    
    if (cacheResult.success) {
      console.log(`R2 JSON created for feed ${webFeed.name}: ${cacheResult.url}`);
      
      // Refetch to get the updated R2 URLs
      const updatedWebFeed = await WebFeed.findById(webFeed._id);
      
      // Automatically sync to Klaviyo for new feeds
      try {
        console.log('Auto-syncing new web feed to Klaviyo...');
        
        // Get the store for Klaviyo credentials
        const Store = await import('@/models/Store').then(m => m.default);
        const store = await Store.findOne({ public_id: updatedWebFeed.store_id });
        
        if (store && store.klaviyo_integration) {
          console.log('Store klaviyo_integration found:', {
            hasOAuthToken: !!store.klaviyo_integration.oauth_token,
            hasApiKey: !!store.klaviyo_integration.apiKey,
            status: store.klaviyo_integration.status
          });
          
          const { klaviyoRequest } = await import('@/lib/klaviyo-api');
          
          // Prepare auth options - handle both OAuth and API key
          const authOptions = {};
          let hasAuth = false;
          
          if (store.klaviyo_integration.oauth_token) {
            // OAuth authentication
            authOptions.accessToken = store.klaviyo_integration.oauth_token;
            authOptions.refreshToken = store.klaviyo_integration.refresh_token;
            authOptions.clientId = process.env.KLAVIYO_CLIENT_ID;
            authOptions.clientSecret = process.env.KLAVIYO_CLIENT_SECRET;
            hasAuth = true;
          } else if (store.klaviyo_integration.apiKey) {
            // API key authentication
            authOptions.apiKey = store.klaviyo_integration.apiKey;
            hasAuth = true;
          }
          
          if (!hasAuth) {
            console.log('No Klaviyo auth credentials found, skipping auto-sync');
            // Return success even if Klaviyo sync failed
            if (updatedWebFeed) {
              return NextResponse.json({ 
                success: true, 
                webFeed: updatedWebFeed,
                message: 'Web feed created successfully',
                r2_url: updatedWebFeed.r2_json_url
              });
            }
            return;
          }
          
          // Prepare Klaviyo payload
          const klaviyoFeedData = {
            data: {
              type: 'web-feed',
              attributes: {
                name: updatedWebFeed.name,
                url: updatedWebFeed.feed_url,
                request_method: 'get',
                content_type: 'json'
              }
            }
          };
          
          console.log('Syncing to Klaviyo:', JSON.stringify(klaviyoFeedData, null, 2));
          console.log('Using auth method:', authOptions.accessToken ? 'OAuth' : 'API Key');
          
          // Call Klaviyo Web Feeds API using the helper
          const response = await klaviyoRequest('POST', 'web-feeds', {
            ...authOptions,
            payload: klaviyoFeedData
          });
          
          if (response.data?.id) {
            // Update the web feed with Klaviyo sync info
            updatedWebFeed.klaviyo_feed_id = response.data.id;
            updatedWebFeed.last_synced = new Date();
            updatedWebFeed.sync_status = 'synced';
            await updatedWebFeed.save();
            
            console.log(`Web feed auto-synced to Klaviyo with ID: ${response.data.id}`);
            
            return NextResponse.json({ 
              success: true, 
              webFeed: updatedWebFeed,
              message: 'Web feed created and synced to Klaviyo successfully',
              r2_url: updatedWebFeed.r2_json_url,
              klaviyo_synced: true,
              klaviyo_feed_id: response.data.id
            });
          } else {
            console.error('Failed to auto-sync to Klaviyo:', response);
            // Don't fail the creation, just log the error
          }
        } else {
          console.log('Klaviyo integration not found for store, skipping auto-sync');
        }
      } catch (syncError) {
        console.error('Error auto-syncing to Klaviyo:', syncError);
        // Don't fail the creation, just log the error
      }
      
      // Return success even if Klaviyo sync failed
      if (updatedWebFeed) {
        return NextResponse.json({ 
          success: true, 
          webFeed: updatedWebFeed,
          message: 'Web feed created successfully',
          r2_url: updatedWebFeed.r2_json_url
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      webFeed,
      message: 'Web feed created successfully',
      r2_url: webFeed.r2_json_url
    });
  } catch (error) {
    console.error('Error creating web feed:', error);
    
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      if (error.keyPattern?.feed_url) {
        return NextResponse.json(
          { error: 'A web feed with this URL already exists' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create web feed' },
      { status: 500 }
    );
  }
}
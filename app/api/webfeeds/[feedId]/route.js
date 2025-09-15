import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import WebFeed from '@/models/WebFeed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { feedId } = await params;
    
    await connectToDatabase();
    
    const webFeed = await WebFeed.findById(feedId);
    
    if (!webFeed) {
      return NextResponse.json(
        { error: 'Web feed not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, webFeed });
  } catch (error) {
    console.error('Error fetching web feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web feed' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedId } = await params;
    const data = await request.json();
    
    await connectToDatabase();
    
    // If the name is being changed, check for duplicates
    if (data.name) {
      const currentFeed = await WebFeed.findById(feedId);
      if (!currentFeed) {
        return NextResponse.json(
          { error: 'Web feed not found' },
          { status: 404 }
        );
      }
      
      // Only check if the name is actually changing
      if (currentFeed.name !== data.name) {
        const existingFeed = await WebFeed.findOne({
          _id: { $ne: feedId }, // Exclude current feed
          store_id: data.store_id || currentFeed.store_id,
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
      }
    }
    
    // Remove metadata from the update data to avoid conflicts
    const { metadata, ...updateData } = data;
    
    // Build the update operation with proper MongoDB operators
    const updateOperation = {
      $set: updateData
    };
    
    // If items are being updated, update metadata fields using operators
    if (updateData.items) {
      updateOperation.$set['metadata.total_items'] = updateData.items.length;
      updateOperation.$set['metadata.last_modified'] = new Date();
      
      // Increment version when items are updated
      updateOperation.$inc = { 'metadata.version': 1 };
    }
    
    // The WebFeed model's pre-hook will handle validation and feed URL updates
    const webFeed = await WebFeed.findByIdAndUpdate(
      feedId,
      updateOperation,
      { new: true, runValidators: true }
    );
    
    if (!webFeed) {
      return NextResponse.json(
        { error: 'Web feed not found' },
        { status: 404 }
      );
    }
    
    // Manually trigger R2 cache update if items were updated
    if (data.items && webFeed.status === 'active') {
      const { updateWebFeedCache } = await import('@/lib/r2-webfeed-helpers');
      const cacheResult = await updateWebFeedCache(webFeed);
      
      if (cacheResult.success) {
        console.log(`R2 JSON updated for feed ${webFeed.name}`);
        // Refetch to get the updated R2 URLs
        const updatedWebFeed = await WebFeed.findById(feedId);
        if (updatedWebFeed) {
          return NextResponse.json({ 
            success: true, 
            webFeed: updatedWebFeed,
            message: 'Web feed updated successfully',
            r2_url: updatedWebFeed.r2_json_url
          });
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      webFeed,
      message: 'Web feed updated successfully'
    });
  } catch (error) {
    console.error('Error updating web feed:', error);
    return NextResponse.json(
      { error: 'Failed to update web feed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedId } = await params;
    
    await connectToDatabase();
    
    // First get the webFeed to delete from R2 and Klaviyo
    const webFeed = await WebFeed.findById(feedId);
    
    if (!webFeed) {
      return NextResponse.json(
        { error: 'Web feed not found' },
        { status: 404 }
      );
    }
    
    // Delete from Klaviyo if it was synced
    if (webFeed.klaviyo_feed_id && webFeed.sync_status === 'synced') {
      try {
        // Get the store to get Klaviyo credentials
        const Store = await import('@/models/Store').then(m => m.default);
        const store = await Store.findOne({ public_id: webFeed.store_id });
        
        if (store && store.klaviyo_integration) {
          const { klaviyoRequest } = await import('@/lib/klaviyo-api');
          
          // Prepare auth options - handle both OAuth and API key
          const authOptions = {};
          
          if (store.klaviyo_integration.oauth_token) {
            // OAuth authentication
            authOptions.accessToken = store.klaviyo_integration.oauth_token;
            authOptions.refreshToken = store.klaviyo_integration.refresh_token;
            authOptions.clientId = process.env.KLAVIYO_CLIENT_ID;
            authOptions.clientSecret = process.env.KLAVIYO_CLIENT_SECRET;
          } else if (store.klaviyo_integration.apiKey) {
            // API key authentication
            authOptions.apiKey = store.klaviyo_integration.apiKey;
          }
          
          if (authOptions.apiKey || authOptions.accessToken) {
            console.log(`Deleting web feed from Klaviyo: ${webFeed.klaviyo_feed_id}`);
            
            try {
              // Call Klaviyo Web Feeds API using the helper
              await klaviyoRequest('DELETE', `web-feeds/${webFeed.klaviyo_feed_id}`, authOptions);
              console.log(`Successfully deleted web feed from Klaviyo: ${webFeed.klaviyo_feed_id}`);
            } catch (deleteError) {
              // Check if it's a 404 (feed already deleted)
              if (deleteError.message?.includes('404')) {
                console.log('Web feed already deleted from Klaviyo');
              } else {
                console.error('Failed to delete from Klaviyo:', deleteError.message);
              }
              // Continue with deletion even if Klaviyo fails
            }
          } else {
            console.log('No Klaviyo credentials found, skipping Klaviyo deletion');
          }
        }
      } catch (klaviyoError) {
        console.error('Error deleting from Klaviyo:', klaviyoError);
        // Continue with deletion
      }
    }
    
    // Delete from R2 storage (images and JSON)
    try {
      const { deleteWebFeedFromR2 } = await import('@/lib/r2-webfeed-helpers');
      const r2Result = await deleteWebFeedFromR2(webFeed);
      
      if (!r2Result.success) {
        console.error('Failed to delete R2 assets:', r2Result.error);
        // Continue with MongoDB deletion even if R2 fails
      } else {
        console.log(`Deleted R2 assets for feed ${webFeed.name}`);
      }
    } catch (r2Error) {
      console.error('Error deleting from R2:', r2Error);
      // Continue with MongoDB deletion
    }
    
    // Delete from MongoDB
    await WebFeed.findByIdAndDelete(feedId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Web feed deleted from all systems successfully'
    });
  } catch (error) {
    console.error('Error deleting web feed:', error);
    return NextResponse.json(
      { error: 'Failed to delete web feed' },
      { status: 500 }
    );
  }
}
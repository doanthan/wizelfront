import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import WebFeed from '@/models/WebFeed';
import Store from '@/models/Store';
import { klaviyoRequest } from '@/lib/klaviyo-api';
import { buildKlaviyoAuthOptionsWithLogging } from '@/lib/klaviyo-auth-helper';

// POST - Sync a web feed to Klaviyo
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { feedId } = await request.json();
    
    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }
    
    // Get the web feed
    const webFeed = await WebFeed.findById(feedId);
    
    if (!webFeed) {
      return NextResponse.json(
        { error: 'Web feed not found' },
        { status: 404 }
      );
    }
    
    // Warn if the feed has no items but allow syncing
    if (!webFeed.items || webFeed.items.length === 0) {
      console.warn(`Warning: Syncing web feed "${webFeed.name}" with no items to Klaviyo`);
    }
    
    // Automatically set to active if syncing
    if (webFeed.status !== 'active') {
      console.log(`Setting web feed "${webFeed.name}" to active status for Klaviyo sync`);
      webFeed.status = 'active';
      await webFeed.save();
    }
    
    // Get the store to get Klaviyo credentials
    const store = await Store.findOne({ public_id: webFeed.store_id });
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Build OAuth-first authentication options
    let authOptions;
    try {
      authOptions = buildKlaviyoAuthOptionsWithLogging(store, { debug: true });
    } catch (error) {
      return NextResponse.json(
        { error: `Klaviyo integration not configured: ${error.message}` },
        { status: 400 }
      );
    }
    
    // Always trigger R2 cache update to ensure the JSON is up-to-date
    const { updateWebFeedCache } = await import('@/lib/r2-webfeed-helpers');
    const cacheResult = await updateWebFeedCache(webFeed);
    
    if (!cacheResult.success) {
      return NextResponse.json(
        { error: 'Failed to generate feed JSON file in cloud storage' },
        { status: 500 }
      );
    }
    
    // Refetch the webFeed to get the updated R2 URLs
    const updatedFeed = await WebFeed.findById(webFeed._id);
    if (updatedFeed) {
      webFeed.feed_url = updatedFeed.feed_url;
      webFeed.r2_json_url = updatedFeed.r2_json_url;
    }
    
    // Verify the feed URL is set
    if (!webFeed.feed_url) {
      return NextResponse.json(
        { error: 'Feed URL not set. Please ensure the feed is properly configured.' },
        { status: 500 }
      );
    }
    
    // Format the feed data for Klaviyo Web Feeds API
    // Match the exact structure from Klaviyo documentation
    const klaviyoFeedData = {
      data: {
        type: 'web-feed',
        attributes: {
          name: webFeed.name,
          url: webFeed.feed_url, // feed_url is now always the R2 URL
          request_method: 'get',
          content_type: 'json'
        }
      }
    };
    
    // Log the request details
    console.log('========================================');
    console.log('KLAVIYO WEB FEED SYNC REQUEST');
    console.log('========================================');
    console.log('Endpoint:', 'web-feeds');
    console.log('Method:', 'POST');
    console.log('Auth Method:', authOptions.accessToken ? 'OAuth' : 'API Key');
    console.log('Payload:', JSON.stringify(klaviyoFeedData, null, 2));
    console.log('Feed URL being sent:', webFeed.feed_url);
    console.log('Feed Status:', webFeed.status);
    console.log('Feed Items Count:', webFeed.items?.length || 0);
    console.log('========================================');
    
    // Call Klaviyo Web Feeds API using OAuth-first approach
    const klaviyoResponse = await klaviyoRequest('POST', 'web-feeds', {
      ...authOptions,
      payload: klaviyoFeedData
    });
    
    console.log('========================================');
    console.log('KLAVIYO RESPONSE');
    console.log('========================================');
    console.log('Response:', JSON.stringify(klaviyoResponse, null, 2));
    console.log('========================================');
    
    // Update the web feed with Klaviyo sync info
    webFeed.klaviyo_feed_id = klaviyoResponse.data?.id;
    webFeed.last_synced = new Date();
    webFeed.sync_status = 'synced';
    await webFeed.save();
    
    return NextResponse.json({ 
      success: true,
      message: 'Web feed synced to Klaviyo successfully',
      klaviyoFeedId: klaviyoResponse.data?.id,
      feedUrl: webFeed.feed_url
    });
    
  } catch (error) {
    console.error('Error syncing web feed to Klaviyo:', error);
    
    // Check if it's because the feed already exists
    if (error.message?.includes('already exists')) {
      // Try to update instead
      return updateExistingFeed(webFeed, authOptions, klaviyoFeedData);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to sync web feed to Klaviyo',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Helper function to update existing feed
async function updateExistingFeed(webFeed, authOptions, feedData) {
  try {
    // First, try to get the existing feed by name
    const existingFeeds = await klaviyoRequest('GET', `web-feeds/?filter=equals(name,"${webFeed.name}")`, authOptions);
    
    if (existingFeeds.data?.length > 0) {
      const existingFeedId = existingFeeds.data[0].id;
      
      // Update the existing feed
      const updateData = await klaviyoRequest('PUT', `web-feeds/${existingFeedId}/`, {
        ...authOptions,
        payload: feedData
      });
      
      // Update local feed record
      webFeed.klaviyo_feed_id = existingFeedId;
      webFeed.last_synced = new Date();
      webFeed.sync_status = 'synced';
      await webFeed.save();
      
      return NextResponse.json({ 
        success: true,
        message: 'Web feed updated in Klaviyo successfully',
        klaviyoFeedId: existingFeedId,
        feedUrl: webFeed.feed_url
      });
    }
    
    throw new Error('Could not update existing feed');
  } catch (error) {
    console.error('Error updating existing feed:', error);
    return NextResponse.json(
      { error: 'Failed to update existing feed in Klaviyo' },
      { status: 500 }
    );
  }
}

// GET - Check sync status
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('feedId');
    
    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const webFeed = await WebFeed.findById(feedId);
    
    if (!webFeed) {
      return NextResponse.json(
        { error: 'Web feed not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      syncStatus: webFeed.sync_status || 'not_synced',
      lastSynced: webFeed.last_synced,
      klaviyoFeedId: webFeed.klaviyo_feed_id,
      feedUrl: webFeed.feed_url
    });
    
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}
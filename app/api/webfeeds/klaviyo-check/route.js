import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongoose';
import WebFeed from '@/models/WebFeed';
import Store from '@/models/Store';
import { klaviyoRequest } from '@/lib/klaviyo-api';
import { buildKlaviyoAuthOptionsWithLogging } from '@/lib/klaviyo-auth-helper';

// GET - Check if feeds exist in Klaviyo
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('feedId');
    const storeId = searchParams.get('storeId');
    
    // Get store to get Klaviyo credentials
    let store;
    if (feedId) {
      const webFeed = await WebFeed.findById(feedId);
      if (!webFeed) {
        return NextResponse.json({ error: 'Web feed not found' }, { status: 404 });
      }
      store = await Store.findOne({ public_id: webFeed.store_id });
    } else if (storeId) {
      store = await Store.findOne({ public_id: storeId });
    } else {
      return NextResponse.json({ error: 'Feed ID or Store ID required' }, { status: 400 });
    }
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
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
    
    // Get all web feeds from Klaviyo using OAuth-first approach
    console.log('Checking Klaviyo for web feeds using OAuth-first approach...');
    const klaviyoData = await klaviyoRequest('GET', 'web-feeds', authOptions);
    
    console.log('Klaviyo Web Feeds Response:', JSON.stringify(klaviyoData, null, 2));
    
    // If checking for specific feed, find it in the list
    let specificFeed = null;
    if (feedId) {
      const webFeed = await WebFeed.findById(feedId);
      if (webFeed && webFeed.klaviyo_feed_id) {
        specificFeed = klaviyoData.data?.find(f => f.id === webFeed.klaviyo_feed_id);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      klaviyoFeeds: klaviyoData.data || [],
      totalFeeds: klaviyoData.data?.length || 0,
      specificFeed,
      message: `Found ${klaviyoData.data?.length || 0} feeds in Klaviyo`
    });
    
  } catch (error) {
    console.error('Error checking Klaviyo feeds:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check Klaviyo feeds',
        details: error.message
      },
      { status: 500 }
    );
  }
}
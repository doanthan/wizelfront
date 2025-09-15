import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import WebFeed from '@/models/WebFeed';

export async function GET(request, { params }) {
  try {
    const { storeId, feedName } = await params;
    
    await connectToDatabase();
    
    // Find the web feed by store_id and name
    // Feed names use underscores, so we can search directly or case-insensitive
    const webFeed = await WebFeed.findOne({
      store_id: storeId,
      name: { $regex: new RegExp(`^${feedName}$`, 'i') },
      status: 'active'
    });
    
    if (!webFeed) {
      return NextResponse.json(
        { error: 'Web feed not found or inactive' },
        { status: 404 }
      );
    }
    
    // Update last synced time
    webFeed.last_synced = new Date();
    await webFeed.save();
    
    // Format the data for Klaviyo
    const formattedData = webFeed.formatForKlaviyo();
    
    // Always return JSON for Klaviyo compatibility
    return NextResponse.json(formattedData, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow Klaviyo to access
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error serving web feed:', error);
    return NextResponse.json(
      { error: 'Failed to serve web feed' },
      { status: 500 }
    );
  }
}
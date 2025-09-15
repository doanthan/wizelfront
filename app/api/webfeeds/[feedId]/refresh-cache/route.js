import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import WebFeed from '@/models/WebFeed';
import { updateWebFeedCache } from '@/lib/r2-webfeed-helpers';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedId } = await params;
    
    await connectToDatabase();
    
    const webFeed = await WebFeed.findById(feedId);
    
    if (!webFeed) {
      return NextResponse.json(
        { error: 'Web feed not found' },
        { status: 404 }
      );
    }
    
    // Manually refresh the R2 cache
    const result = await updateWebFeedCache(webFeed);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Cache refreshed successfully',
        url: result.url,
        key: result.key
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Cache refresh failed',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Proxy endpoint for fetching R2 preview content
 *
 * This endpoint solves CORS issues when accessing private R2 URLs from the browser.
 * It fetches the content server-side and streams it to the client.
 *
 * Usage: GET /api/preview-proxy?url=<encoded_r2_url>
 */
export async function GET(request) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate that the URL is from our R2 storage
    if (!url.includes('.r2.cloudflarestorage.com')) {
      return NextResponse.json({
        error: 'Invalid URL - only R2 storage URLs are allowed'
      }, { status: 400 });
    }

    console.log('🔄 Proxying R2 content:', url);

    // Fetch the content from R2
    const response = await fetch(url, {
      headers: {
        // Add any required R2 authentication headers here if needed
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch from R2:', response.status, response.statusText);
      return NextResponse.json({
        error: `Failed to fetch content: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    // Get the content
    const content = await response.text();
    const contentType = response.headers.get('content-type') || 'text/html';

    console.log('✅ R2 content fetched successfully:', {
      contentLength: content.length,
      contentType
    });

    // Return the content with appropriate headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('❌ Preview proxy error:', error);
    return NextResponse.json({
      error: 'Failed to fetch preview content',
      details: error.message
    }, { status: 500 });
  }
}

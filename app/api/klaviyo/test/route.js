import { NextResponse } from 'next/server';
import { createKlaviyoClient } from '@/lib/klaviyo-helpers';

/**
 * GET /api/klaviyo/test
 * Test Klaviyo API connection and get account info
 */
export async function GET(request) {
  try {
    // Get API key from query params or environment
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey') || process.env.KLAVIYO_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key is required',
          message: 'Provide apiKey in query params or set KLAVIYO_API_KEY env variable'
        },
        { status: 400 }
      );
    }

    // Create Klaviyo client
    const klaviyo = createKlaviyoClient(apiKey, {
      debug: true
    });

    // Test API connection by fetching lists
    console.log('Testing Klaviyo API connection...');
    
    const listsResponse = await klaviyo.getLists({
      params: {
        'page[size]': 5
      }
    });

    // Get metrics to show available metrics
    const metricsResponse = await klaviyo.getMetrics({
      params: {
        'page[size]': 10
      }
    });

    // Get basic account stats
    const profilesResponse = await klaviyo.getProfiles({
      params: {
        'page[size]': 1 // Just to get count
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Klaviyo API connection successful',
      data: {
        lists: {
          count: listsResponse.data?.length || 0,
          items: listsResponse.data?.slice(0, 3).map(list => ({
            id: list.id,
            name: list.attributes?.name,
            profileCount: list.attributes?.profile_count
          }))
        },
        metrics: {
          count: metricsResponse.data?.length || 0,
          available: metricsResponse.data?.slice(0, 5).map(metric => ({
            id: metric.id,
            name: metric.attributes?.name,
            integration: metric.attributes?.integration?.name
          }))
        },
        rateLimit: listsResponse.rateLimit,
        apiRevision: '2025-07-15'
      }
    });
  } catch (error) {
    console.error('Klaviyo API test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Klaviyo API test failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/klaviyo/test
 * Test creating an event in Klaviyo
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey, email, eventName, properties } = body;
    
    if (!apiKey || !email || !eventName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'apiKey, email, and eventName are required'
        },
        { status: 400 }
      );
    }

    // Create Klaviyo client
    const klaviyo = createKlaviyoClient(apiKey);

    // Track test event
    const eventResponse = await klaviyo.createEvent({
      profile: {
        data: {
          type: 'profile',
          attributes: {
            email: email
          }
        }
      },
      metric: {
        data: {
          type: 'metric',
          attributes: {
            name: eventName
          }
        }
      },
      properties: properties || {
        test: true,
        source: 'wizel-api-test'
      },
      time: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Test event created successfully',
      data: eventResponse.data
    });
  } catch (error) {
    console.error('Failed to create test event:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test event',
        message: error.message
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

// GET - Fetch a specific segment or list with profile count
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get parameters
    const { id: audienceId } = await params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const type = searchParams.get('type'); // 'segment' or 'list'

    if (!storeId || !audienceId || !type) {
      return NextResponse.json({
        error: 'Store ID, audience ID, and type are required'
      }, { status: 400 });
    }

    // 3. Find the store
    let store = await Store.findOne({
      'klaviyo_integration.public_id': storeId
    });

    if (!store) {
      store = await Store.findOne({
        public_id: storeId
      });
    }

    if (!store) {
      return NextResponse.json({
        error: 'Store not found'
      }, { status: 404 });
    }

    if (!store.klaviyo_integration ||
        (!store.klaviyo_integration.apiKey && !store.klaviyo_integration.oauth_token)) {
      return NextResponse.json({
        error: 'Klaviyo authentication not configured for this store'
      }, { status: 404 });
    }

    // 4. Check user has access to this store
    const hasAccess = await Store.hasAccess(store._id, session.user.id);

    if (!hasAccess) {
      // Also check if user is super admin
      const User = (await import('@/models/User')).default;
      const user = await User.findById(session.user.id);

      if (!user?.is_super_user) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // 5. Build OAuth-first authentication options
    const klaviyoAuthOptions = buildKlaviyoAuthOptions(store);

    // 6. Fetch the specific segment or list with profile count
    try {
      let endpoint, additionalFields;

      if (type === 'segment') {
        endpoint = `segments/${audienceId}/`;
        additionalFields = '?additional-fields[segment]=profile_count';
      } else if (type === 'list') {
        endpoint = `lists/${audienceId}/`;
        additionalFields = '?additional-fields[list]=profile_count';
      } else {
        return NextResponse.json({
          error: 'Invalid type. Must be "segment" or "list"'
        }, { status: 400 });
      }

      // Add a small delay if this is part of multiple requests to respect rate limits
      // (1/s burst for profile_count requests)
      const lastRequestTime = global.lastKlaviyoProfileCountRequest || 0;
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      if (timeSinceLastRequest < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
      }
      global.lastKlaviyoProfileCountRequest = Date.now();

      const response = await klaviyoRequest(
        'GET',
        `${endpoint}${additionalFields}`,
        klaviyoAuthOptions
      );

      if (!response.data) {
        return NextResponse.json({
          error: `${type === 'segment' ? 'Segment' : 'List'} not found`
        }, { status: 404 });
      }

      // Format the response
      const audience = {
        id: response.data.id,
        type: type,
        name: response.data.attributes?.name || `Unknown ${type}`,
        profileCount: response.data.attributes?.profile_count || 0,
        created: response.data.attributes?.created,
        updated: response.data.attributes?.updated
      };

      return NextResponse.json({
        success: true,
        data: audience,
        storeId: store.klaviyo_integration.public_id
      });

    } catch (error) {
      // If profile_count fails, try without it
      if (error.message?.includes('additional-fields') || error.message?.includes('400')) {
        try {
          let endpoint = type === 'segment' ?
            `segments/${audienceId}/` :
            `lists/${audienceId}/`;

          const response = await klaviyoRequest(
            'GET',
            endpoint,
            klaviyoAuthOptions
          );

          if (!response.data) {
            return NextResponse.json({
              error: `${type === 'segment' ? 'Segment' : 'List'} not found`
            }, { status: 404 });
          }

          const audience = {
            id: response.data.id,
            type: type,
            name: response.data.attributes?.name || `Unknown ${type}`,
            profileCount: 0, // No profile count available
            created: response.data.attributes?.created,
            updated: response.data.attributes?.updated
          };

          return NextResponse.json({
            success: true,
            data: audience,
            storeId: store.klaviyo_integration.public_id,
            warning: 'Profile count not available'
          });
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('Error fetching audience details:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch audience details'
    }, { status: 500 });
  }
}
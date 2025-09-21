import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get storeId from query parameter
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ 
        error: 'Store ID is required' 
      }, { status: 400 });
    }

    // 3. Find the store by klaviyo_public_id or public_id
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

      if (!user.super_admin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // 5. Build OAuth-first authentication options
    const klaviyoAuthOptions = buildKlaviyoAuthOptions(store);

    // 6. Fetch segments and lists from Klaviyo with profile counts
    const fetchWithIds = searchParams.get('withIds');
    const segmentIds = fetchWithIds ? searchParams.get('segmentIds')?.split(',').filter(Boolean) : [];
    const listIds = fetchWithIds ? searchParams.get('listIds')?.split(',').filter(Boolean) : [];

    let segments = [];
    let lists = [];

    // When fetching with IDs, we don't know if they're segments or lists
    // So we'll try to determine the type by attempting both
    const audienceIds = fetchWithIds ? [...new Set([...(segmentIds || []), ...(listIds || [])])] : [];

    try {
      // Fetch specific audiences by ID or fetch all
      if (fetchWithIds && audienceIds.length > 0) {
        // Try to fetch each ID as both segment and list
        for (const audienceId of audienceIds) {
          let found = false;

          // First try as a segment with profile_count
          try {
            const segmentResponse = await klaviyoRequest(
              'GET',
              `segments/${audienceId}/?additional-fields[segment]=profile_count`,
              klaviyoAuthOptions
            );
            if (segmentResponse.data) {
              segments.push(segmentResponse.data);
              found = true;
            }
          } catch (segErr) {
            // Not a segment or error with profile_count, try without
            try {
              const segmentResponse = await klaviyoRequest(
                'GET',
                `segments/${audienceId}/`,
                klaviyoAuthOptions
              );
              if (segmentResponse.data) {
                segments.push(segmentResponse.data);
                found = true;
              }
            } catch (fallbackErr) {
              // Not a segment at all
            }
          }

          // If not found as segment, try as a list
          if (!found) {
            try {
              const listResponse = await klaviyoRequest(
                'GET',
                `lists/${audienceId}/?additional-fields[list]=profile_count`,
                klaviyoAuthOptions
              );
              if (listResponse.data) {
                lists.push(listResponse.data);
                found = true;
              }
            } catch (listErr) {
              // Try without profile_count
              try {
                const listResponse = await klaviyoRequest(
                  'GET',
                  `lists/${audienceId}/`,
                  klaviyoAuthOptions
                );
                if (listResponse.data) {
                  lists.push(listResponse.data);
                  found = true;
                }
              } catch (fallbackErr) {
                console.log(`Could not fetch audience ${audienceId} as either segment or list`);
              }
            }
          }
        }
      } else if (!fetchWithIds) {
        // Fetch all segments
        try {
          const segmentsResponse = await klaviyoRequest(
            'GET',
            'segments/',
            klaviyoAuthOptions
          );
          segments = segmentsResponse.data || [];
        } catch (err) {
          console.error('Error fetching all segments:', err.message);
        }
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
      // Continue without segments if fetch fails
    }

    // Only fetch all lists if not fetching with IDs
    if (!fetchWithIds) {
      try {
        const listsResponse = await klaviyoRequest(
          'GET',
          'lists/',
          klaviyoAuthOptions
        );
        lists = listsResponse.data || [];
      } catch (err) {
        console.error('Error fetching all lists:', err.message);
      }
    }

    // Format the response
    const audiences = {
      segments: segments.map(segment => ({
        id: segment.id,
        type: 'segment',
        name: segment.attributes?.name || 'Unknown Segment',
        profile_count: segment.attributes?.profile_count || 0,
        created: segment.attributes?.created,
        updated: segment.attributes?.updated
      })),
      lists: lists.map(list => ({
        id: list.id,
        type: 'list',
        name: list.attributes?.name || 'Unknown List',
        profile_count: list.attributes?.profile_count || 0,
        created: list.attributes?.created,
        updated: list.attributes?.updated
      }))
    };

    // Calculate combined stats if specific IDs were requested
    if (fetchWithIds) {
      const totalIncluded = audiences.segments
        .concat(audiences.lists)
        .reduce((sum, a) => sum + (a.profile_count || 0), 0);

      return NextResponse.json({
        success: true,
        data: audiences,
        stats: {
          totalIncludedProfiles: totalIncluded,
          includedSegments: audiences.segments.length,
          includedLists: audiences.lists.length
        },
        storeId: store.klaviyo_integration.public_id
      });
    }

    // 7. Return formatted response
    return NextResponse.json({
      success: true,
      data: audiences,
      storeId: store.klaviyo_integration.public_id
    });

  } catch (error) {
    console.error('Error fetching audiences:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch audiences' 
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

// GET - Fetch all segments and lists for multiple stores at once
export async function GET(request) {
  try {
    await connectToDatabase();

    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get storeIds from query parameter
    const { searchParams } = new URL(request.url);
    const storeIds = searchParams.get('storeIds')?.split(',').filter(Boolean) || [];

    // 3. Get all accessible stores
    const allStores = await Store.findByUser(session.user.id);

    // Filter to requested stores if specified, otherwise use all
    let targetStores = allStores;
    if (storeIds.length > 0) {
      targetStores = allStores.filter(store =>
        storeIds.includes(store.klaviyo_integration?.public_id) ||
        storeIds.includes(store.public_id)
      );
    }

    // Only process stores with Klaviyo authentication
    const storesWithAuth = targetStores.filter(s =>
      s.klaviyo_integration &&
      (s.klaviyo_integration.apiKey || s.klaviyo_integration.oauth_token)
    );

    if (storesWithAuth.length === 0) {
      return NextResponse.json({
        audiences: {},
        message: 'No stores with Klaviyo authentication configured'
      });
    }

    // 4. Fetch audiences for each store in parallel (with controlled concurrency)
    const audiencesByStore = {};
    const errors = [];

    // Process stores in batches to avoid overwhelming the API
    const BATCH_SIZE = 3;
    for (let i = 0; i < storesWithAuth.length; i += BATCH_SIZE) {
      const batch = storesWithAuth.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (store) => {
        const klaviyoId = store.klaviyo_integration.public_id;
        try {
          const klaviyoAuthOptions = buildKlaviyoAuthOptions(store);

          // Fetch segments and lists in parallel for this store
          const [segmentsResult, listsResult] = await Promise.allSettled([
            fetchSegments(klaviyoAuthOptions),
            fetchLists(klaviyoAuthOptions)
          ]);

          const segments = segmentsResult.status === 'fulfilled' ? segmentsResult.value : [];
          const lists = listsResult.status === 'fulfilled' ? listsResult.value : [];

          // Store the results indexed by klaviyo_public_id
          audiencesByStore[klaviyoId] = {
            segments: segments.map(formatAudience),
            lists: lists.map(formatAudience),
            storeName: store.name,
            storePublicId: store.public_id
          };

        } catch (error) {
          console.error(`Error fetching audiences for store ${store.name}:`, error);
          errors.push({
            store: store.name,
            error: error.message
          });
        }
      }));
    }

    // 5. Create a flat index for quick lookups
    const audienceIndex = {};
    Object.entries(audiencesByStore).forEach(([klaviyoId, storeData]) => {
      // Index segments
      storeData.segments.forEach(segment => {
        audienceIndex[`${klaviyoId}:segment:${segment.id}`] = {
          id: segment.id,
          name: segment.name,
          profileCount: segment.profileCount,
          type: 'segment',
          klaviyoPublicId: klaviyoId,
          storeName: storeData.storeName,
          created: segment.created,
          updated: segment.updated
        };
      });

      // Index lists
      storeData.lists.forEach(list => {
        audienceIndex[`${klaviyoId}:list:${list.id}`] = {
          id: list.id,
          name: list.name,
          profileCount: list.profileCount,
          type: 'list',
          klaviyoPublicId: klaviyoId,
          storeName: storeData.storeName,
          created: list.created,
          updated: list.updated
        };
      });
    });

    return NextResponse.json({
      success: true,
      audiencesByStore,
      audienceIndex,
      totalStores: storesWithAuth.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk audiences fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch audiences'
    }, { status: 500 });
  }
}

// Helper function to fetch segments with pagination
async function fetchSegments(authOptions) {
  const segments = [];
  let nextPageUrl = 'segments/';

  try {
    while (nextPageUrl) {
      const response = await klaviyoRequest('GET', nextPageUrl, authOptions);

      if (response.data) {
        segments.push(...response.data);
      }

      // Check for next page
      nextPageUrl = response.links?.next ?
        response.links.next.replace('https://a.klaviyo.com/api/', '') :
        null;

      // Limit to prevent infinite loops
      if (segments.length > 500) break;
    }
  } catch (error) {
    console.error('Error fetching segments:', error.message);
  }

  return segments;
}

// Helper function to fetch lists with pagination
async function fetchLists(authOptions) {
  const lists = [];
  let nextPageUrl = 'lists/';

  try {
    while (nextPageUrl) {
      const response = await klaviyoRequest('GET', nextPageUrl, authOptions);

      if (response.data) {
        lists.push(...response.data);
      }

      // Check for next page
      nextPageUrl = response.links?.next ?
        response.links.next.replace('https://a.klaviyo.com/api/', '') :
        null;

      // Limit to prevent infinite loops
      if (lists.length > 500) break;
    }
  } catch (error) {
    console.error('Error fetching lists:', error.message);
  }

  return lists;
}

// Helper function to format audience data
function formatAudience(audience) {
  return {
    id: audience.id,
    name: audience.attributes?.name || 'Unknown',
    profileCount: audience.attributes?.profile_count || 0,
    created: audience.attributes?.created,
    updated: audience.attributes?.updated
  };
}
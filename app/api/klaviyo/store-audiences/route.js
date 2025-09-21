import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find store with the given klaviyo_public_id
    const store = await Store.findOne({
      'klaviyo_integration.public_id': storeId
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Build OAuth-first authentication options
    const authOpts = buildKlaviyoAuthOptions(store);

    try {
      // Fetch segments and lists in parallel with pagination
      const [segments, lists] = await Promise.all([
        fetchAllSegments(authOpts),
        fetchAllLists(authOpts)
      ]);

      // Create a combined index for quick lookup
      const audienceIndex = {};

      // Add segments to index
      segments.forEach(segment => {
        audienceIndex[segment.id] = {
          id: segment.id,
          name: segment.attributes?.name || segment.id,
          type: 'segment',
          profile_count: segment.attributes?.profile_count || 0,
          created_at: segment.attributes?.created || null,
          updated_at: segment.attributes?.updated || null
        };
      });

      // Add lists to index
      lists.forEach(list => {
        audienceIndex[list.id] = {
          id: list.id,
          name: list.attributes?.name || list.id,
          type: 'list',
          profile_count: list.attributes?.profile_count || 0,
          created_at: list.attributes?.created || null,
          updated_at: list.attributes?.updated || null
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          segments: segments.map(s => ({
            id: s.id,
            name: s.attributes?.name || s.id,
            profile_count: s.attributes?.profile_count || 0
          })),
          lists: lists.map(l => ({
            id: l.id,
            name: l.attributes?.name || l.id,
            profile_count: l.attributes?.profile_count || 0
          })),
          audienceIndex,
          total: segments.length + lists.length,
          fetched_at: new Date().toISOString()
        }
      });
    } catch (apiError) {
      console.error('Error fetching store audiences:', apiError);
      return NextResponse.json(
        { error: 'Failed to fetch audiences' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Store audiences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to fetch all segments with pagination
async function fetchAllSegments(authOptions) {
  const segments = [];
  let nextUrl = 'segments'; // Start with base endpoint

  try {
    while (nextUrl) {
      const response = await klaviyoRequest('GET', nextUrl, authOptions);

      if (response?.data) {
        segments.push(...response.data);
      }

      // Check for next page
      if (response?.links?.next) {
        // Extract the path from the full URL
        const fullNextUrl = response.links.next;
        if (fullNextUrl.startsWith('https://')) {
          // Parse the full URL and extract just the path and query
          const urlObj = new URL(fullNextUrl);
          nextUrl = `segments${urlObj.search}`; // e.g., "segments?page[cursor]=xxx"
        } else {
          nextUrl = fullNextUrl;
        }
      } else {
        // No more pages
        break;
      }
    }
  } catch (error) {
    console.error('Error fetching segments:', error);
  }

  console.log(`Fetched ${segments.length} segments`);
  return segments;
}

// Helper function to fetch all lists with pagination
async function fetchAllLists(authOptions) {
  const lists = [];
  let nextUrl = 'lists'; // Start with base endpoint

  try {
    while (nextUrl) {
      const response = await klaviyoRequest('GET', nextUrl, authOptions);

      if (response?.data) {
        lists.push(...response.data);
      }

      // Check for next page
      if (response?.links?.next) {
        // Extract the path from the full URL
        const fullNextUrl = response.links.next;
        if (fullNextUrl.startsWith('https://')) {
          // Parse the full URL and extract just the path and query
          const urlObj = new URL(fullNextUrl);
          nextUrl = `lists${urlObj.search}`; // e.g., "lists?page[cursor]=xxx"
        } else {
          nextUrl = fullNextUrl;
        }
      } else {
        // No more pages
        break;
      }
    }
  } catch (error) {
    console.error('Error fetching lists:', error);
  }

  console.log(`Fetched ${lists.length} lists`);
  return lists;
}
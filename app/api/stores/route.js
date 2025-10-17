import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getUserAccessibleStores } from '@/middleware/storeAccess';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { storeOperations } from '@/lib/db-utils';

/**
 * GET /api/stores
 * Get all accessible stores for the authenticated user
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the centralized function to get accessible stores
    const stores = await getUserAccessibleStores(session);

    // Apply any additional filters from query params
    const { searchParams } = new URL(request.url);
    let filteredStores = stores;

    // Add search filters if provided
    if (searchParams.get('name')) {
      const nameFilter = searchParams.get('name').toLowerCase();
      filteredStores = filteredStores.filter(store =>
        store.name?.toLowerCase().includes(nameFilter)
      );
    }

    if (searchParams.get('tag')) {
      const tag = searchParams.get('tag');
      // Note: Would need to fetch full store data to filter by tags
      // This is a simplified version
    }

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    const paginatedStores = filteredStores.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginatedStores,
      pagination: {
        total: filteredStores.length,
        limit,
        skip,
        hasMore: skip + limit < filteredStores.length
      }
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stores',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stores
 * Create a new store
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.url) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          details: 'Name and URL are required'
        },
        { status: 400 }
      );
    }
    
    // Create store using utility function (handles URL formatting)
    const store = await storeOperations.createStore(body);
    
    return NextResponse.json({
      success: true,
      data: store,
      message: 'Store created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Store already exists',
          details: 'A store with this name or URL already exists'
        },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          details: Object.values(error.errors).map(e => e.message)
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create store',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
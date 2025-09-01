import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { dbOperations } from '@/lib/db-utils';

/**
 * GET /api/stores/[storeId]
 * Get a single store by ID
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storeId } = params;
    
    const store = await dbOperations.findById(Store, storeId);
    
    if (!store) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Store not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid store ID format'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch store',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/stores/[storeId]
 * Update a store
 */
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storeId } = params;
    const body = await request.json();
    
    // Ensure URL has https:// if being updated
    if (body.url) {
      if (!body.url.startsWith('http')) {
        body.url = 'https://' + body.url;
      }
      if (body.url.startsWith('http://')) {
        body.url = body.url.replace('http://', 'https://');
      }
    }
    
    const store = await dbOperations.updateById(
      Store,
      storeId,
      body,
      { runValidators: true }
    );
    
    if (!store) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Store not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: store,
      message: 'Store updated successfully'
    });
  } catch (error) {
    console.error('Error updating store:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid store ID format'
        },
        { status: 400 }
      );
    }
    
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
        error: 'Failed to update store',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stores/[storeId]
 * Delete a store
 */
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storeId } = params;
    
    const store = await dbOperations.deleteById(Store, storeId);
    
    if (!store) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Store not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    
    if (error.name === 'CastError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid store ID format'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete store',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import BrandStyle from '@/models/BrandStyle';
import mongoose from 'mongoose';

/**
 * GET /api/brand-styles/[id]
 *
 * Get a specific brand style by ID
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid brand style ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const brandStyle = await BrandStyle.findOne({
      _id: id,
      $or: [
        { userId: session.user.id },
        { isPublic: true }
      ],
      isActive: true
    }).lean();

    if (!brandStyle) {
      return NextResponse.json(
        { error: 'Brand style not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      brandStyle
    });

  } catch (error) {
    console.error('Error fetching brand style:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand style' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/brand-styles/[id]
 *
 * Update a brand style
 */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid brand style ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the brand style and verify ownership
    const existingBrandStyle = await BrandStyle.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!existingBrandStyle) {
      return NextResponse.json(
        { error: 'Brand style not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Update the brand style
    const updatedBrandStyle = await BrandStyle.findByIdAndUpdate(
      id,
      {
        ...body,
        lastUpdated: new Date(),
        'metadata.manualOverrides': true,
        'metadata.version': (existingBrandStyle.metadata?.version || 1) + 1
      },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      brandStyle: updatedBrandStyle,
      message: 'Brand style updated successfully'
    });

  } catch (error) {
    console.error('Error updating brand style:', error);
    return NextResponse.json(
      { error: 'Failed to update brand style', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-styles/[id]
 *
 * Delete (soft delete) a brand style
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid brand style ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Soft delete - set isActive to false
    const brandStyle = await BrandStyle.findOneAndUpdate(
      {
        _id: id,
        userId: session.user.id
      },
      {
        isActive: false,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!brandStyle) {
      return NextResponse.json(
        { error: 'Brand style not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Brand style deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting brand style:', error);
    return NextResponse.json(
      { error: 'Failed to delete brand style' },
      { status: 500 }
    );
  }
}

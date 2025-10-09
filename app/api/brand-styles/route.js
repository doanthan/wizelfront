import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import BrandStyle from '@/models/BrandStyle';

/**
 * GET /api/brand-styles
 *
 * Fetch brand styles for the authenticated user
 *
 * Query parameters:
 * - storeId: Filter by store ID
 * - industry: Filter by industry
 * - public: Include public brand styles (true/false)
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const industry = searchParams.get('industry');
    const includePublic = searchParams.get('public') === 'true';

    // Build query
    const query = { isActive: true };

    if (storeId) {
      query.storeId = storeId;
    } else if (industry) {
      query['metadata.industry'] = industry;
    }

    // If includePublic is true, get both user's styles and public styles
    if (includePublic) {
      query.$or = [
        { userId: session.user.id },
        { isPublic: true }
      ];
    } else {
      query.userId = session.user.id;
    }

    const brandStyles = await BrandStyle.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      brandStyles,
      count: brandStyles.length
    });

  } catch (error) {
    console.error('Error fetching brand styles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand styles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-styles
 *
 * Create a new brand style
 *
 * Body: BrandStyle object
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();

    // Create new brand style
    const brandStyle = new BrandStyle({
      ...body,
      userId: session.user.id,
      scrapedAt: new Date(),
      lastUpdated: new Date()
    });

    await brandStyle.save();

    return NextResponse.json({
      success: true,
      brandStyle,
      message: 'Brand style created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating brand style:', error);
    return NextResponse.json(
      { error: 'Failed to create brand style', details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import BrandStyle from '@/models/BrandStyle';
import mongoose from 'mongoose';

/**
 * GET /api/brand-styles/[id]/styles
 *
 * Get CSS variables and email styles for a brand
 *
 * Query parameters:
 * - format: 'css' | 'email' | 'both' (default: 'both')
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'both';

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
    });

    if (!brandStyle) {
      return NextResponse.json(
        { error: 'Brand style not found' },
        { status: 404 }
      );
    }

    const response = {
      success: true,
      brandName: brandStyle.brandName
    };

    // Add CSS variables
    if (format === 'css' || format === 'both') {
      response.cssVariables = brandStyle.toCSSVariables();
      response.cssString = Object.entries(brandStyle.toCSSVariables())
        .map(([key, value]) => `  ${key}: ${value};`)
        .join('\n');
    }

    // Add email styles
    if (format === 'email' || format === 'both') {
      response.emailStyles = brandStyle.getEmailStyles();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating styles:', error);
    return NextResponse.json(
      { error: 'Failed to generate styles' },
      { status: 500 }
    );
  }
}

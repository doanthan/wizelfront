import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Store from '@/models/Store';
import BrandSettings from '@/models/Brand';
import connectToDatabase from '@/lib/mongoose';

// GET - Fetch brand settings for a store
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storePublicId } = await params;
    
    // Get user from authentication session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find store by storePublicId
    const store = await Store.findByIdOrPublicId(storePublicId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Find brand settings for this store
    // Try multiple fields for compatibility
    let brandSettings = await BrandSettings.findOne({
      $or: [
        { store_public_id: storePublicId },
        { store_public_id: store.public_id },
        { store_id: store._id }
      ],
      isActive: true
    });

    // If no brand settings found, try to find default brand
    if (!brandSettings) {
      brandSettings = await BrandSettings.findOne({
        store_id: store._id,
        isDefault: true
      });
    }

    if (!brandSettings) {
      return NextResponse.json({ 
        success: true,
        brandSettings: null,
        message: 'No brand settings configured for this store'
      });
    }

    return NextResponse.json({
      success: true,
      brandSettings: brandSettings.toObject()
    });

  } catch (error) {
    console.error('GET /api/store/[storePublicId]/brand-settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update brand settings
export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    
    const { storePublicId } = await params;
    const body = await request.json();
    
    // Get user from authentication session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find store by storePublicId
    const store = await Store.findByIdOrPublicId(storePublicId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if brand settings already exist
    let brandSettings = await BrandSettings.findOne({
      $or: [
        { store_public_id: storePublicId },
        { store_public_id: store.public_id },
        { store_id: store._id }
      ]
    });

    if (brandSettings) {
      // Update existing brand settings
      Object.assign(brandSettings, body);
      brandSettings.updatedBy = session.user.id;
      await brandSettings.save();
    } else {
      // Create new brand settings
      brandSettings = await BrandSettings.create({
        ...body,
        store_id: store._id,
        store_public_id: store.public_id,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        isActive: true,
        isDefault: true // First brand is default
      });
    }

    return NextResponse.json({
      success: true,
      brandSettings: brandSettings.toObject()
    });

  } catch (error) {
    console.error('POST /api/store/[storePublicId]/brand-settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
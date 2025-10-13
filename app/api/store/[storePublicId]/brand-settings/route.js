import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import BrandSettings from '@/models/Brand';

// GET - Fetch brand settings for a store
export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store } = request;

    // Find brand settings for this store
    let brandSettings = await BrandSettings.findOne({
      store_id: store._id,
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
});

// POST - Create or update brand settings
export const POST = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;
    const body = await request.json();

    // Check permission - brands create/edit required
    if (!role?.permissions?.brands?.create && !role?.permissions?.brands?.edit) {
      return NextResponse.json({
        error: 'You do not have permission to manage brand settings'
      }, { status: 403 });
    }

    // Check if brand settings already exist
    let brandSettings = await BrandSettings.findOne({
      store_id: store._id
    });

    if (brandSettings) {
      // Update existing brand settings
      Object.assign(brandSettings, body);
      brandSettings.updatedBy = user._id;
      await brandSettings.save();
    } else {
      // Create new brand settings
      brandSettings = await BrandSettings.create({
        ...body,
        store_id: store._id,
        store_public_id: store.public_id,
        createdBy: user._id,
        updatedBy: user._id,
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
});
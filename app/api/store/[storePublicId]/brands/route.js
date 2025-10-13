import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import BrandSettings from '@/models/Brand';

// GET - Get all brands for a store
export const GET = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store } = request;

    // Get all brands for this store (excluding soft-deleted brands)
    const brands = await BrandSettings.find({
      store_id: store._id,
      isActive: true,
      isDeleted: { $ne: true }
    }).sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json({
      brands: brands.map(brand => ({
        _id: brand._id,
        name: brand.name || brand.brandName,
        slug: brand.slug,
        isDefault: brand.isDefault,
        primaryColor: brand.primaryColor,
        secondaryColors: brand.secondaryColors,
        logo: brand.logo,
        brandTagline: brand.brandTagline,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt
      }))
    });

  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
});

// POST - Create a new brand (used for cloning)
export const POST = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store, user, role } = request;

    const body = await request.json();
    const { sourceBrandId, newName } = body;

    // Check if user has create permissions for brands
    if (!role?.permissions?.brands?.create && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create brands' },
        { status: 403 }
      );
    }

    // Check brand limit (max 3 brands per store)
    const brandCount = await BrandSettings.countDocuments({
      store_id: store._id,
      isActive: true
    });

    if (brandCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 brands per store allowed' },
        { status: 400 }
      );
    }

    let newBrand;

    if (sourceBrandId) {
      // Clone existing brand
      const sourceBrand = await BrandSettings.findOne({
        _id: sourceBrandId,
        store_id: store._id,
        isActive: true
      });

      if (!sourceBrand) {
        return NextResponse.json({ error: 'Source brand not found' }, { status: 404 });
      }

      // Create a copy of the source brand
      const brandData = sourceBrand.toObject();
      delete brandData._id;
      delete brandData.createdAt;
      delete brandData.updatedAt;
      delete brandData.__v;

      // Update with new name and ensure it's not default
      brandData.name = newName || `${sourceBrand.name} Copy`;
      brandData.brandName = newName || `${sourceBrand.brandName} Copy`;
      brandData.isDefault = false;
      brandData.createdBy = user._id;
      brandData.updatedBy = user._id;
      brandData.store_id = store._id;
      brandData.store_public_id = store.public_id;

      // Generate new slug
      delete brandData.slug; // Will be auto-generated

      newBrand = new BrandSettings(brandData);
    } else {
      // Create new brand from scratch
      newBrand = new BrandSettings({
        store_id: store._id,
        store_public_id: store.public_id,
        name: newName || 'New Brand',
        brandName: newName || 'New Brand',
        isDefault: false,
        isActive: true,
        createdBy: user._id,
        updatedBy: user._id,
        // Set some default values
        primaryColor: [{ hex: '#60A5FA', name: 'Sky Blue' }],
        secondaryColors: [{ hex: '#8B5CF6', name: 'Vivid Violet' }],
        buttonBackgroundColor: '#60A5FA',
        buttonTextColor: '#FFFFFF',
        emailFallbackFont: 'Arial'
      });
    }

    await newBrand.save();

    return NextResponse.json({
      message: sourceBrandId ? 'Brand cloned successfully' : 'Brand created successfully',
      brand: {
        _id: newBrand._id,
        name: newBrand.name,
        slug: newBrand.slug,
        isDefault: newBrand.isDefault
      }
    });

  } catch (error) {
    console.error('Brand POST error:', error);
    return NextResponse.json({ error: 'Failed to create/clone brand' }, { status: 500 });
  }
});
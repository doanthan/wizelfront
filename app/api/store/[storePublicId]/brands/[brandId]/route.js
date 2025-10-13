import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import BrandSettings from '@/models/Brand';

// DELETE - Delete a brand
export const DELETE = withStoreAccess(async (request, context) => {
  try {
    const { store, user, seat, role } = request;
    const params = await context.params;
    const { brandId } = params;

    // Check permission - brands delete required
    if (!role?.permissions?.brands?.delete) {
      return NextResponse.json({
        error: 'You do not have permission to delete brands'
      }, { status: 403 });
    }

    // Find the brand
    const brand = await BrandSettings.findOne({
      _id: brandId,
      store_id: store._id,
      isActive: true
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Prevent deletion of default brand
    if (brand.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete the default brand' },
        { status: 400 }
      );
    }

    // Soft delete the brand
    brand.isActive = false;
    brand.updatedBy = user._id;
    brand.lastUpdated = new Date();
    await brand.save();

    // Track the operation for billing if user has a seat
    if (seat) {
      seat.trackBrandOperation('delete', brand._id, 0.5);
      await seat.save();
    }

    return NextResponse.json({
      message: 'Brand deleted successfully'
    });
    
  } catch (error) {
    console.error('Brand DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
});

// PUT - Update a brand
export const PUT = withStoreAccess(async (request, context) => {
  try {
    const { store, user, seat, role } = request;
    const params = await context.params;
    const { brandId } = params;
    const body = await request.json();

    // Check permission - brands edit required
    if (!role?.permissions?.brands?.edit) {
      return NextResponse.json({
        error: 'You do not have permission to edit brands'
      }, { status: 403 });
    }

    // Find the brand
    const brand = await BrandSettings.findOne({
      _id: brandId,
      store_id: store._id,
      isActive: true
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Update brand fields
    if (body.name) {
      brand.name = body.name;
      brand.brandName = body.name;
      // Regenerate slug if name changes
      brand.slug = await brand.generateSlug(body.name);
    }

    // Update other allowed fields
    const allowedFields = [
      'brandTagline', 'websiteUrl', 'missionStatement', 
      'primaryColor', 'secondaryColors', 'logo',
      'brandVoice', 'brandPersonality', 'coreValues'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        brand[field] = body[field];
      }
    });

    brand.updatedBy = user._id;
    brand.lastUpdated = new Date();
    await brand.save();

    // Track the operation for billing if user has a seat
    if (seat) {
      seat.trackBrandOperation('update', brand._id, 0.5);
      await seat.save();
    }

    return NextResponse.json({
      message: 'Brand updated successfully',
      brand: {
        _id: brand._id,
        name: brand.name,
        slug: brand.slug,
        isDefault: brand.isDefault
      }
    });
    
  } catch (error) {
    console.error('Brand PUT error:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
});
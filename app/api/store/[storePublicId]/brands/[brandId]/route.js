import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Store from '@/models/Store';
import BrandSettings from '@/models/Brand';
import ContractSeat from '@/models/ContractSeat';
import connectToDatabase from '@/lib/mongoose';

// DELETE - Delete a brand
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId, brandId } = params;
    
    // Find store by public ID (excluding soft-deleted stores)
    const store = await Store.findOne({ 
      public_id: storePublicId,
      is_deleted: { $ne: true }
    });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user has access to this store
    const userSeat = await ContractSeat.findUserSeatForContract(
      session.user.id, 
      store.contract_id
    );
    
    const isOwner = store.owner_id?.toString() === session.user.id;
    
    if (!userSeat && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
    brand.updatedBy = session.user.id;
    brand.lastUpdated = new Date();
    await brand.save();

    // Track the operation for billing if user has a seat
    if (userSeat) {
      userSeat.trackBrandOperation('delete', brand._id, 0.5);
      await userSeat.save();
    }

    return NextResponse.json({
      message: 'Brand deleted successfully'
    });
    
  } catch (error) {
    console.error('Brand DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}

// PUT - Update a brand
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId, brandId } = params;
    const body = await request.json();
    
    // Find store by public ID (excluding soft-deleted stores)
    const store = await Store.findOne({ 
      public_id: storePublicId,
      is_deleted: { $ne: true }
    });
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user has access to this store
    const userSeat = await ContractSeat.findUserSeatForContract(
      session.user.id, 
      store.contract_id
    );
    
    const isOwner = store.owner_id?.toString() === session.user.id;
    
    if (!userSeat && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

    brand.updatedBy = session.user.id;
    brand.lastUpdated = new Date();
    await brand.save();

    // Track the operation for billing if user has a seat
    if (userSeat) {
      userSeat.trackBrandOperation('update', brand._id, 0.5);
      await userSeat.save();
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
}
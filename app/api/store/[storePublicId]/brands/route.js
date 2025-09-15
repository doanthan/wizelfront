import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Store from '@/models/Store';
import BrandSettings from '@/models/Brand';
import ContractSeat from '@/models/ContractSeat';
import connectToDatabase from '@/lib/mongoose';

// GET - Get all brands for a store
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    
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
}

// POST - Create a new brand (used for cloning)
export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;
    const body = await request.json();
    const { sourceBrandId, newName } = body;
    
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
      brandData.createdBy = session.user.id;
      brandData.updatedBy = session.user.id;
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
        createdBy: session.user.id,
        updatedBy: session.user.id,
        // Set some default values
        primaryColor: [{ hex: '#60A5FA', name: 'Sky Blue' }],
        secondaryColors: [{ hex: '#8B5CF6', name: 'Vivid Violet' }],
        buttonBackgroundColor: '#60A5FA',
        buttonTextColor: '#FFFFFF',
        emailFallbackFont: 'Arial'
      });
    }

    await newBrand.save();

    // Track the operation for billing if user has a seat
    if (userSeat) {
      userSeat.trackBrandOperation('create', newBrand._id, 1);
      await userSeat.save();
    }

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
}
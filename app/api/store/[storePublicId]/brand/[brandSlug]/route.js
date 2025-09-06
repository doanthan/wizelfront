import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Store from '@/models/Store';
import BrandSettings from '@/models/Brand';
import ContractSeat from '@/models/ContractSeat';
import connectToDatabase from '@/lib/mongoose';

// GET - Get a single brand by slug
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId, brandSlug } = await params;
    
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

    // Find the brand by slug
    const brand = await BrandSettings.findOne({
      slug: brandSlug,
      store_id: store._id,
      isActive: true
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Return the full brand object
    return NextResponse.json({
      brand: brand.toObject()
    });
    
  } catch (error) {
    console.error('Brand GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}

// PUT - Update brand by slug
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId, brandSlug } = await params;
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

    // Find the brand by slug
    const brand = await BrandSettings.findOne({
      slug: brandSlug,
      store_id: store._id,
      isActive: true
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Update brand fields
    const allowedFields = [
      'brandName', 'brandTagline', 'websiteUrl', 
      'missionStatement', 'originStory', 'uniqueValueProposition',
      'brandJourney', 'customerPromise',
      'brandVoice', 'brandPersonality', 'coreValues',
      'primaryColor', 'secondaryColors', 'logo',
      'targetAudienceAge', 'targetAudienceGender', 'geographicFocus',
      'industryCategories', 'uniqueSellingPoints',
      'customerPainPoints', 'customerAspirations',
      'mainProductCategories', 'bestsellingProducts',
      'socialLinks', 'competitors', 'socialProof',
      'trustBadges', 'customerPersonas', 'customerFears',
      'emotionalTriggers', 'customerLanguage',
      'brandArchetype', 'brandMetrics', 'emailStrategy'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        brand[field] = body[field];
      }
    });

    // Update name if brandName changes
    if (body.brandName) {
      brand.name = body.brandName;
    }

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
      brand: brand.toObject()
    });
    
  } catch (error) {
    console.error('Brand PUT error:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}
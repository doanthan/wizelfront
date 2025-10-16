import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import BrandSettings from '@/models/Brand';

// GET - Get a single brand by slug
export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store } = request;
    const params = await context.params;
    const { brandSlug } = params;

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
});

// PUT - Update brand by slug
export const PUT = withStoreAccess(async (request, context) => {
  try {
    const { store, user, seat, role } = request;
    const params = await context.params;
    const { brandSlug } = params;
    const body = await request.json();

    // Check permission - brands edit required
    if (!role?.permissions?.brands?.edit) {
      return NextResponse.json({
        error: 'You do not have permission to edit brands'
      }, { status: 403 });
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
      'brandArchetype', 'brandMetrics', 'emailStrategy',
      // Marketing-specific fields
      'emailFrequency', 'contentPriority', 'secondaryObjectives',
      'uniqueFeatures', 'competitiveAdvantages', 'contentStrategy',
      'customerJourneyInsights', 'customerLifecycleStage',
      'buyingMotivations', 'purchaseBarriers', 'decisionFactors',
      'trustBuilders', 'headerLinks', 'socialIconStyle',
      'currentPromotion', 'upcomingProductLaunch', 'seasonalFocus',
      'discountStrategy', 'loyaltyProgramDetails', 'primaryCampaignObjective'
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
      brand: brand.toObject()
    });
    
  } catch (error) {
    console.error('Brand PUT error:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
});
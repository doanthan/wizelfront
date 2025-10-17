import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import Brand from '@/models/Brand';
import { generateWithClaude, MODELS } from '@/lib/openrouter';

// Configure route to allow longer execution time for AI generation
export const maxDuration = 300; // 5 minutes (max for Vercel Pro)
export const dynamic = 'force-dynamic';

/**
 * Generate campaign prompt for Claude
 */
const generateCampaignPrompt = (inputs) => {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // Determine region-specific settings
  const primaryRegion = inputs.geographicFocus?.[0] || 'Global';
  const isAustralia = primaryRegion.toLowerCase().includes('australia');
  const isUK = primaryRegion.toLowerCase().includes('uk') || primaryRegion.toLowerCase().includes('united kingdom');
  const isBrazil = primaryRegion.toLowerCase().includes('brazil');
  const isUSA = primaryRegion.toLowerCase().includes('us') || primaryRegion.toLowerCase().includes('united states');

  // Set language variant
  let languageInstruction = '';
  if (isAustralia || isUK) {
    languageInstruction = 'IMPORTANT: Use British/Australian English spelling (e.g., "organise" not "organize", "colour" not "color", "recognise" not "recognize").';
  } else if (isBrazil) {
    languageInstruction = 'IMPORTANT: Consider Brazilian Portuguese cultural context and local expressions where appropriate.';
  } else {
    languageInstruction = 'IMPORTANT: Use US English spelling.';
  }

  return `You are a Klaviyo-certified email marketing strategist specializing in eCommerce revenue optimization. Generate high-performance email campaigns that drive measurable results.

<brand_context>
<website>${inputs.brandUrl}</website>
<brand_name>${inputs.brandName || 'Not provided'}</brand_name>
<tagline>${inputs.brandTagline || 'Not provided'}</tagline>
<brand_positioning>${inputs.brandPositioning || 'Not provided'}</brand_positioning>
<geographic_focus>${inputs.geographicFocus || 'Global'}</geographic_focus>
<primary_region>${primaryRegion}</primary_region>
<current_month>${currentMonth} ${currentYear}</current_month>
<products_differentiation>${inputs.productsDiff}</products_differentiation>
<customer_profile>${inputs.customerProfile}</customer_profile>
<average_order_value>${inputs.aov || 'Not provided'}</average_order_value>
<purchase_frequency>${inputs.purchaseFreq || 'Not provided'}</purchase_frequency>
<email_list_metrics>${inputs.listMetrics || 'Not provided'}</email_list_metrics>
<brand_voice>${inputs.brandVoice || 'Not provided'}</brand_voice>
<core_values>${inputs.coreValues || 'Not provided'}</core_values>
<unique_value_proposition>${inputs.uvp || 'Not provided'}</unique_value_proposition>
<competitive_advantages>${inputs.competitiveAdvantages || 'Not provided'}</competitive_advantages>
<bestselling_products>${inputs.bestsellingProducts || 'Not provided'}</bestselling_products>
</brand_context>

<regional_context>
${languageInstruction}

Use region-appropriate holidays, events, and seasonal shifts for ${primaryRegion}:
- Reference local public holidays, national days, and cultural events specific to ${primaryRegion}
- Consider local weather patterns and seasons (e.g., ${isAustralia ? 'Australian summer in December-February' : 'Northern hemisphere seasons'})
- Use culturally relevant references and examples
- Align timing recommendations with local shopping behaviors and peak times
</regional_context>

Generate exactly 24 unique email campaign ideas for ${currentMonth} ${currentYear}. Each campaign must include all 9 required components and a brief concept explanation.

<output_format>
Return your response as a valid JSON array with this exact structure:

[
  {
    "campaignName": "string",
    "hookAngle": "string - the core psychological trigger",
    "conceptExplanation": "string - brief explanation of the concept and what the email would talk about",
    "targetSegment": "string - specific audience segment",
    "subjectLines": ["variant 1", "variant 2"],
    "previewText": "string",
    "coreMessage": "string - 2-3 sentences describing email content",
    "ctaAndGoal": "string - action + KPI (e.g., 'Shop Collection - optimise for 8% CTR')",
    "triggerTiming": "string - when/how to send",
    "formatRecommendation": "string - plain-text or HTML with rationale"
  }
]
</output_format>

<campaign_criteria>
MUST INCLUDE:
- Non-discount focused (unless seasonally relevant for ${primaryRegion} in ${currentMonth})
- Highly creative and hyper-specific to the product, customer psychology, or common objections
- Aligned with events, holidays, or seasonal shifts happening in ${primaryRegion} during ${currentMonth} ${currentYear}
- Designed to educate, build trust, and convert
- Revenue-focused: Clear path to purchase or increased LTV
- Segment-specific: Tailored to customer journey stage (cold, engaged, first-time buyer, repeat, lapsed)
- Mobile-optimized: Scroll-stopping and designed for mobile inboxes
- Direct response principles: persuasive while staying on-brand and not pushy
- Format-flexible: Can work in both plain-text and graphic-based email formats

CAMPAIGN TYPE VARIETY (prioritise):
1. Product-focused content (features, benefits, use cases)
2. Educational emails (how-to guides, tips, product usage tutorials)
3. Social proof (UGC, testimonials, reviews, customer transformations)
4. Founder's voice or story-driven emails
5. Creative micro-topics (specific ingredients, features, or use cases)
6. Objection-handling emails (addressing common purchase barriers)
7. Transformation stories (before/after, customer success)

MUST AVOID:
- Generic campaigns like "New Drop" or "Back in Stock" unless deeply contextualised with specific product/brand angle
- Discount dependency that trains customers to wait for sales
- Vague CTAs that don't specify the action or success metric
- One-size-fits-all messaging that ignores segmentation
- US-centric references if brand is not in the US
</campaign_criteria>

<additional_considerations>
- Each idea should include a brief explanation of the concept and what the email would talk about
- Prioritise campaigns that can be automated in Klaviyo flows
- Include seasonal/timely angles that feel organic to the brand and ${primaryRegion}
- Suggest UGC/social proof integration opportunities where relevant
- Incorporate cross-sell/upsell mechanics for higher AOV
- Design post-purchase campaigns that increase customer LTV
- Reference specific products from the bestselling list when relevant
- Leverage competitive advantages in campaign angles
</additional_considerations>

Generate all 24 campaigns now, ensuring each is hyper-specific to this brand's unique value proposition, customer psychology, and ${primaryRegion} cultural context for ${currentMonth} ${currentYear}. Return ONLY the JSON array, no additional text.`;
};

/**
 * POST /api/idea-generator/generate
 *
 * Generate AI campaign ideas using Claude Sonnet 4.5
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { storeId, brandId, temperature, notes } = body;

    if (!storeId || !brandId) {
      return NextResponse.json(
        { error: 'Store ID and Brand ID are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Fetch store
    const store = await Store.findOne({ public_id: storeId });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch brand settings
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Prepare inputs from brand settings
    const inputs = {
      brandUrl: brand.websiteUrl || store.website || 'Not provided',
      brandName: brand.brandName || brand.name || 'Not provided',
      brandTagline: brand.brandTagline || 'Not provided',

      // Geographic Focus (CRITICAL - used for region-specific content)
      geographicFocus: brand.geographicFocus?.join(', ') || 'Global',

      // Brand Positioning
      brandPositioning: [
        brand.uniqueValueProposition,
        brand.competitiveAdvantages?.join('; '),
        brand.missionStatement
      ].filter(Boolean).join(' | ') || 'Not provided',

      // Products & Differentiation
      productsDiff: [
        brand.uniqueSellingPoints,
        brand.mainProductCategories?.join(', ')
      ].filter(Boolean).join(' | ') || 'Not provided',

      // Bestselling Products
      bestsellingProducts: brand.bestsellingProducts?.join(' | ') || 'Not provided',

      // Customer Profile (enhanced)
      customerProfile: [
        `Demographics: ${brand.targetAudienceAge?.join(', ') || 'Not specified'} years old, ${brand.targetAudienceGender?.join(', ') || 'Not specified'}`,
        `Location: ${brand.geographicFocus?.join(', ') || 'Not specified'}`,
        `Pain Points: ${brand.customerPainPoints?.slice(0, 3).join('; ') || 'Not specified'}`,
        `Aspirations: ${brand.customerAspirations?.slice(0, 3).join('; ') || 'Not specified'}`,
        `Purchase Barriers: ${brand.purchaseBarriers?.slice(0, 2).join('; ') || 'Not specified'}`
      ].join(' | '),

      // Metrics from brand or store
      aov: brand.brandMetrics?.averageOrderValue
        ? `$${brand.brandMetrics.averageOrderValue}`
        : 'Not provided',

      purchaseFreq: brand.brandMetrics?.purchaseFrequency?.mode || 'Not provided',

      // Email list metrics (if available from store)
      listMetrics: 'Not provided', // Could be populated from Klaviyo integration

      // Brand voice and values
      brandVoice: brand.brandVoice?.join(', ') || 'Not provided',
      coreValues: brand.coreValues?.join(', ') || 'Not provided',
      uvp: brand.uniqueValueProposition || 'Not provided',

      // Competitive Advantages
      competitiveAdvantages: brand.competitiveAdvantages?.join('; ') || 'Not provided',

      // Additional context from notes
      additionalContext: notes || ''
    };

    // Generate the prompt
    const prompt = generateCampaignPrompt(inputs);

    // Add notes as additional context if provided
    const finalPrompt = notes
      ? `${prompt}\n\n<additional_user_notes>\n${notes}\n</additional_user_notes>`
      : prompt;

    console.log('🎨 Generating campaign ideas with Claude Sonnet 4.5...');
    console.log('Temperature:', temperature || 0.7);
    console.log('Brand:', brand.brandName);

    // Call Claude via OpenRouter
    const response = await generateWithClaude(finalPrompt, {
      model: MODELS.CLAUDE.SONNET_4_5,
      temperature: parseFloat(temperature) || 0.7,
      max_tokens: 16000, // Reduced from 32000 for faster response
      response_format: { type: 'json_object' } // Request JSON output
    });

    console.log('✅ Campaign ideas generated successfully');
    console.log('Usage:', response.usage);

    // Parse the response content
    let campaigns;
    try {
      // Try to parse the JSON response
      const content = response.content.trim();

      // Remove markdown code blocks if present
      const jsonContent = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      campaigns = JSON.parse(jsonContent);

      // Ensure it's an array
      if (!Array.isArray(campaigns)) {
        campaigns = [campaigns];
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response content:', response.content.substring(0, 500));

      return NextResponse.json({
        error: 'Failed to parse AI response',
        details: parseError.message,
        rawContent: response.content
      }, { status: 500 });
    }

    // Return the generated campaigns
    return NextResponse.json({
      success: true,
      campaigns,
      metadata: {
        model: response.model,
        temperature: parseFloat(temperature) || 0.7,
        tokensUsed: response.usage?.total_tokens || 0,
        brandName: brand.brandName,
        campaignCount: campaigns.length
      }
    });

  } catch (error) {
    console.error('❌ Campaign generation error:', error);

    return NextResponse.json({
      error: 'Failed to generate campaigns',
      message: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateWithClaude, MODELS } from "@/lib/openrouter";

export async function POST(request, { params }) {
  try {
    // Authenticate user - Auth.js v5
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { storePublicId, brandSlug } = await params;
    const { prompt, brandData } = await request.json();

    if (!prompt || !brandData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build the AI prompt with brand context
    const systemPrompt = `You are an expert marketing strategist and customer research specialist. Your task is to create detailed, realistic customer personas based on brand information and user requirements.

You must return a valid JSON object with the following structure:
{
  "name": "Persona Name (e.g., Conscious Wellness Seeker)",
  "description": "Brief 1-2 sentence description of this customer persona",
  "demographics": {
    "age": "Age range (e.g., 35-44)",
    "income": "Income range (e.g., $85k-$125k)",
    "education": "Education level (e.g., Bachelor's degree or higher)",
    "occupation": "Occupation(s) (e.g., Marketing Manager, Healthcare Professional)",
    "location": "Geographic location (e.g., Urban and suburban areas, coastal cities)"
  },
  "psychographics": {
    "interests": ["Interest 1", "Interest 2", "Interest 3"],
    "values": ["Value 1", "Value 2", "Value 3"],
    "lifestyle": "Detailed lifestyle description",
    "personality": ["Trait 1", "Trait 2", "Trait 3"]
  },
  "shoppingBehavior": {
    "frequency": "Purchase frequency (e.g., Every 45-60 days)",
    "averageOrderValue": "AOV range (e.g., $120-$180)",
    "preferredChannels": ["Channel 1", "Channel 2"],
    "decisionFactors": ["Factor 1", "Factor 2", "Factor 3"]
  }
}

IMPORTANT: Return ONLY valid JSON. Do not include any markdown code blocks, explanations, or additional text.`;

    const userPrompt = `Based on the following brand information, create a customer persona:

**Brand Name:** ${brandData.name || 'Not specified'}
**Website:** ${brandData.websiteUrl || 'Not specified'}
**Tagline:** ${brandData.tagline || 'Not specified'}
**Industry:** ${brandData.industry?.join(', ') || 'Not specified'}
**Core Values:** ${brandData.values?.join(', ') || 'Not specified'}
**Brand Voice:** ${brandData.voice?.join(', ') || 'Not specified'}
**Product Categories:** ${brandData.products?.join(', ') || 'Not specified'}
**Customer Pain Points:** ${brandData.painPoints?.join(', ') || 'Not specified'}
**Customer Aspirations:** ${brandData.aspirations?.join(', ') || 'Not specified'}

**User Request:**
${prompt}

Generate a detailed customer persona that aligns with this brand and meets the user's requirements. Return ONLY the JSON object, no additional text.`;

    console.log('🤖 Generating persona with Claude Sonnet 4.5...');

    // Generate persona using Claude Sonnet 4.5
    const response = await generateWithClaude(userPrompt, {
      model: MODELS.CLAUDE.SONNET_4_5,
      system: systemPrompt,
      temperature: 0.8,
      max_tokens: 4096,
    });

    console.log('✅ Persona generated successfully');

    // Parse the JSON response
    let personaData;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = response.content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      personaData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw response:', response.content);
      return NextResponse.json(
        { error: "Failed to parse AI-generated persona. Please try again." },
        { status: 500 }
      );
    }

    // Validate the persona structure
    if (!personaData.name || !personaData.description) {
      console.error('❌ Invalid persona structure:', personaData);
      return NextResponse.json(
        { error: "Generated persona is missing required fields" },
        { status: 500 }
      );
    }

    // Ensure all required fields have defaults
    const validatedPersona = {
      name: personaData.name,
      description: personaData.description,
      demographics: {
        age: personaData.demographics?.age || '',
        income: personaData.demographics?.income || '',
        education: personaData.demographics?.education || '',
        occupation: personaData.demographics?.occupation || '',
        location: personaData.demographics?.location || ''
      },
      psychographics: {
        interests: personaData.psychographics?.interests || [],
        values: personaData.psychographics?.values || [],
        lifestyle: personaData.psychographics?.lifestyle || '',
        personality: personaData.psychographics?.personality || []
      },
      shoppingBehavior: {
        frequency: personaData.shoppingBehavior?.frequency || '',
        averageOrderValue: personaData.shoppingBehavior?.averageOrderValue || '',
        preferredChannels: personaData.shoppingBehavior?.preferredChannels || [],
        decisionFactors: personaData.shoppingBehavior?.decisionFactors || []
      }
    };

    return NextResponse.json(validatedPersona);

  } catch (error) {
    console.error('❌ Error generating persona:', error);
    return NextResponse.json(
      { error: error.message || "Failed to generate persona" },
      { status: 500 }
    );
  }
}

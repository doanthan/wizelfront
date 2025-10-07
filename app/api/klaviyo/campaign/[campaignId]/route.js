import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function GET(request, { params }) {
  try {
    const { campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    console.log(`📊 Fetching campaign details for: ${campaignId}`);
    console.log(`🏪 Store ID: ${storeId}`);

    if (!campaignId || !storeId) {
      return NextResponse.json(
        { error: 'Campaign ID and Store ID are required' },
        { status: 400 }
      );
    }

    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find store with the given klaviyo_public_id
    const store = await Store.findOne({
      'klaviyo_integration.public_id': storeId
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Build OAuth-first authentication options
    const authOpts = buildKlaviyoAuthOptions(store);

    try {
      // Use the exact endpoint format that works in Postman
      const endpoint = `campaigns/${campaignId}?fields[campaign]=audiences.included,audiences.excluded,send_options,send_time,send_strategy,tracking_options,name,status,scheduled_at&include=campaign-messages,tags`;

      console.log(`🔍 Fetching campaign from Klaviyo: ${endpoint}`);

      const campaignData = await klaviyoRequest('GET', endpoint, authOpts);

      if (!campaignData?.data) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }

      // Extract the campaign details
      const campaign = campaignData.data;
      const included = campaignData.included || [];

      // Find the campaign message from included data
      const campaignMessage = included.find(item =>
        item.type === 'campaign-message'
      );

      console.log(`✅ Found campaign with audiences:`, {
        id: campaign.id,
        name: campaign.attributes?.name,
        audiences: campaign.attributes?.audiences
      });

      return NextResponse.json({
        success: true,
        data: {
          id: campaign.id,
          attributes: campaign.attributes,
          relationships: campaign.relationships,
          campaignMessage: campaignMessage,
          // Explicitly include audiences at top level for easy access
          audiences: campaign.attributes?.audiences || {
            included: [],
            excluded: []
          }
        }
      });

    } catch (apiError) {
      console.error('Klaviyo API error:', apiError);

      return NextResponse.json(
        { error: `Failed to fetch campaign: ${apiError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Campaign fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
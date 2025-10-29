import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import mongoose from "mongoose";
import Store from "@/models/Store";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { storeIds, limit = 10 } = await request.json();

    if (!storeIds || storeIds.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    // Get stores with their Klaviyo public IDs
    const stores = await Store.find({
      public_id: { $in: storeIds }
    }).select('public_id name klaviyo_integration.public_id').lean();

    const klaviyoPublicIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    if (klaviyoPublicIds.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    // Access the campaignStats collection directly
    const db = mongoose.connection.db;
    const campaignStatsCollection = db.collection('campaignstats');

    // Fetch recent campaigns for the selected Klaviyo accounts
    const recentCampaigns = await campaignStatsCollection
      .find({
        klaviyo_public_id: { $in: klaviyoPublicIds },
        'statistics.recipients': { $gt: 0 }, // Only campaigns that were actually sent
        send_time: { $exists: true } // Ensure send_time exists
      })
      .sort({ send_time: -1 }) // Sort by most recent first
      .limit(limit)
      .toArray();

    // Map the campaigns to include store information
    const campaignsWithStores = recentCampaigns.map(campaign => {
      // Find which stores use this Klaviyo account
      const associatedStores = stores.filter(
        s => s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
      );

      return {
        id: campaign.groupings?.campaign_id || campaign._id,
        campaignId: campaign.groupings?.campaign_id,
        messageId: campaign.groupings?.campaign_message_id, // CRITICAL: Include messageId for preview
        name: campaign.campaign_name,
        channel: campaign.groupings?.send_channel || 'email',
        send_date: campaign.send_time || campaign.scheduled_at,
        recipients: campaign.statistics?.recipients || 0,
        opensUnique: campaign.statistics?.opens_unique || 0,
        clicksUnique: campaign.statistics?.clicks_unique || 0,
        conversions: campaign.statistics?.conversions || 0,
        revenue: campaign.statistics?.conversion_value || 0,

        // Rates
        openRate: campaign.statistics?.open_rate || 0,
        clickRate: campaign.statistics?.click_rate || 0,
        conversionRate: campaign.statistics?.conversion_rate || 0,

        // Include full statistics object for AOV and other metrics
        statistics: campaign.statistics,

        // Include groupings for modal preview
        groupings: campaign.groupings,

        // CRITICAL: Include preview URLs for stored previews
        preview_image_html: campaign.preview_image_html,
        preview_image_url: campaign.preview_image_url,
        preview_sms_url: campaign.preview_sms_url,
        preview_generated_at: campaign.preview_generated_at,

        // Store information
        klaviyo_public_id: campaign.klaviyo_public_id,
        store_public_ids: campaign.store_public_ids || associatedStores.map(s => s.public_id),
        store_names: associatedStores.map(s => s.name)
      };
    });

    return NextResponse.json({
      campaigns: campaignsWithStores,
      count: campaignsWithStores.length
    });

  } catch (error) {
    console.error('Error fetching recent campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// GET method
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '500');

    // Get user's accessible stores
    const User = (await import('@/models/User')).default;
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allStores = await Store.findByUser(session.user.id);
    if (!allStores || allStores.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    console.log('[Recent Campaigns] Found stores:', allStores.map(s => ({
      public_id: s.public_id,
      name: s.name,
      has_klaviyo: !!s.klaviyo_integration,
      klaviyo_public_id: s.klaviyo_integration?.public_id
    })));

    const klaviyoPublicIds = allStores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    console.log('[Recent Campaigns] Extracted klaviyo IDs:', klaviyoPublicIds);

    if (klaviyoPublicIds.length === 0) {
      console.log('[Recent Campaigns] No klaviyo IDs found, returning empty campaigns');
      return NextResponse.json({ campaigns: [] });
    }

    // Access the campaignStats collection directly
    const db = mongoose.connection.db;
    const campaignStatsCollection = db.collection('campaignstats');

    // Get date range from query params or default to past 14 days
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const endDate = endDateParam ? new Date(endDateParam) : now;

    console.log('[Recent Campaigns] Date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysRange: Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
    });

    const query = {
      klaviyo_public_id: { $in: klaviyoPublicIds },
      'statistics.recipients': { $gt: 0 }, // Only campaigns that were actually sent
      send_time: {
        $exists: true,
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add channel filter
    if (channel && channel !== 'all') {
      query['groupings.send_channel'] = channel;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { campaign_name: { $regex: search, $options: 'i' } },
        { subject_line: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch recent campaigns
    const recentCampaigns = await campaignStatsCollection
      .find(query)
      .sort({ send_time: -1 }) // Sort by most recent first
      .limit(limit)
      .toArray();

    // Map the campaigns to include store information
    const campaignsWithStores = recentCampaigns.map(campaign => {
      // Find which stores use this Klaviyo account
      const associatedStores = allStores.filter(
        s => s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
      );

      // Debug log for the first campaign to verify messageId is present
      if (recentCampaigns.indexOf(campaign) === 0) {
        console.log('[Recent Campaigns] First campaign messageId:', {
          campaign_name: campaign.campaign_name,
          groupings_campaign_id: campaign.groupings?.campaign_id,
          groupings_campaign_message_id: campaign.groupings?.campaign_message_id,
          has_groupings: !!campaign.groupings
        });
      }

      return {
        id: campaign.groupings?.campaign_id || campaign._id,
        campaignId: campaign.groupings?.campaign_id,
        messageId: campaign.groupings?.campaign_message_id, // CRITICAL: Include messageId for preview
        name: campaign.campaign_name,
        channel: campaign.groupings?.send_channel || 'email',
        date: campaign.send_time || campaign.scheduled_at,
        performance: {
          recipients: campaign.statistics?.recipients || 0,
          opensUnique: campaign.statistics?.opens_unique || 0,
          clicksUnique: campaign.statistics?.clicks_unique || 0,
          openRate: campaign.statistics?.open_rate || 0,
          clickRate: campaign.statistics?.click_rate || 0,
          conversions: campaign.statistics?.conversion_uniques || 0,
          revenue: campaign.statistics?.conversion_value || 0
        },

        // Include full statistics object for AOV and other metrics
        statistics: campaign.statistics,

        // Include groupings for modal preview
        groupings: campaign.groupings,

        // CRITICAL: Include preview URLs for stored previews
        preview_image_html: campaign.preview_image_html,
        preview_image_url: campaign.preview_image_url,
        preview_sms_url: campaign.preview_sms_url,
        preview_generated_at: campaign.preview_generated_at,

        // Store information
        klaviyo_public_id: campaign.klaviyo_public_id,
        store_public_ids: campaign.store_public_ids || associatedStores.map(s => s.public_id),
        storeName: associatedStores[0]?.name || 'Unknown'
      };
    });

    return NextResponse.json({
      campaigns: campaignsWithStores,
      total: campaignsWithStores.length
    });

  } catch (error) {
    console.error('Error fetching recent campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import mongoose from "mongoose";
import Store from "@/models/Store";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
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

    const now = new Date();

    // Access the campaignStats collection directly
    const db = mongoose.connection.db;
    const campaignStatsCollection = db.collection('campaignstats');

    // Fetch upcoming/scheduled campaigns
    const upcomingCampaigns = await campaignStatsCollection
      .find({
        klaviyo_public_id: { $in: klaviyoPublicIds },
        $or: [
          { scheduled_at: { $gte: now } },
          {
            send_time: { $gte: now },
            'statistics.recipients': { $eq: 0 } // Not sent yet
          }
        ]
      })
      .sort({ scheduled_at: 1, send_time: 1 }) // Sort by soonest first
      .limit(limit)
      .toArray();

    // Map the campaigns to include store information
    const campaignsWithStores = upcomingCampaigns.map(campaign => {
      // Find which stores use this Klaviyo account
      const associatedStores = stores.filter(
        s => s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
      );

      return {
        id: campaign.groupings?.campaign_id || campaign._id,
        name: campaign.campaign_name,
        channel: campaign.groupings?.send_channel || 'email',
        send_date: campaign.scheduled_at || campaign.send_time,
        estimated_recipients: campaign.statistics?.recipients || 0,

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
    console.error('Error fetching upcoming campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET(request) {
  return POST(request);
}
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import mongoose from "mongoose";
import User from "@/models/User";
import ContractSeat from "@/models/ContractSeat";
import Store from "@/models/Store";
import CampaignStat from "@/models/CampaignStat";

/**
 * GET /api/dashboard/recent-campaigns
 * Fetches recent campaign statistics from MongoDB with proper permission checks
 *
 * Query params:
 * - stores: comma-separated store public_ids (optional, defaults to all accessible)
 * - limit: number of campaigns to return (default 20, max 100)
 * - days: how many days back to look (default 14)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const requestedStoreIds = searchParams.get('stores')?.split(',').filter(Boolean) || [];
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const daysBack = parseInt(searchParams.get('days') || '14');

    // Get user with their contract seats
    const user = await User.findOne({ email: session.user.email })
      .select('_id is_super_user active_seats')
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 1: Determine which stores the user has access to
    let accessibleStoreIds = [];
    let accessibleKlaviyoIds = [];

    if (user.is_super_user) {
      // Super users can access all stores
      const allStores = await Store.find({ is_deleted: { $ne: true } })
        .select('public_id klaviyo_integration.public_id')
        .lean();

      accessibleStoreIds = allStores.map(s => s.public_id);
      accessibleKlaviyoIds = allStores
        .filter(s => s.klaviyo_integration?.public_id)
        .map(s => s.klaviyo_integration.public_id);
    } else {
      // Get all contract seats for the user
      const contractSeats = await ContractSeat.find({
        user_id: user._id,
        status: 'active'
      }).lean();

      if (!contractSeats.length) {
        return NextResponse.json({ campaigns: [] });
      }

      // Collect all accessible store IDs from contract seats
      const storeObjectIds = new Set();

      for (const seat of contractSeats) {
        // Check if user has permission to view campaigns
        const canViewCampaigns =
          seat.role_level >= 10 || // Viewer level or above
          seat.permissions?.campaigns?.view_own ||
          seat.permissions?.campaigns?.view_all ||
          seat.permissions?.analytics?.view_own ||
          seat.permissions?.analytics?.view_all;

        if (!canViewCampaigns) continue;

        // Add stores from store_access array
        if (seat.store_access && seat.store_access.length > 0) {
          seat.store_access.forEach(storeId => storeObjectIds.add(storeId.toString()));
        } else {
          // If no specific store access, get all stores for the contract
          const contractStores = await Store.find({
            contract_id: seat.contract_id,
            is_deleted: { $ne: true }
          }).select('_id').lean();

          contractStores.forEach(store => storeObjectIds.add(store._id.toString()));
        }
      }

      // Get full store details for accessible stores
      const stores = await Store.find({
        _id: { $in: Array.from(storeObjectIds).map(id => new mongoose.Types.ObjectId(id)) },
        is_deleted: { $ne: true }
      }).select('public_id klaviyo_integration.public_id').lean();

      accessibleStoreIds = stores.map(s => s.public_id);
      accessibleKlaviyoIds = stores
        .filter(s => s.klaviyo_integration?.public_id)
        .map(s => s.klaviyo_integration.public_id);
    }

    // Step 2: Filter to requested stores if specified
    let finalKlaviyoIds = accessibleKlaviyoIds;
    if (requestedStoreIds.length > 0) {
      // Map requested store public_ids to klaviyo_ids
      const requestedStores = await Store.find({
        public_id: { $in: requestedStoreIds },
        is_deleted: { $ne: true }
      }).select('public_id klaviyo_integration.public_id').lean();

      const requestedKlaviyoIds = requestedStores
        .filter(s => s.klaviyo_integration?.public_id)
        .map(s => s.klaviyo_integration.public_id);

      // Only include requested stores that user has access to
      finalKlaviyoIds = requestedKlaviyoIds.filter(id => accessibleKlaviyoIds.includes(id));
    }

    if (finalKlaviyoIds.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    // Step 3: Query campaign stats from MongoDB
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    const campaigns = await CampaignStat.find({
      klaviyo_public_id: { $in: finalKlaviyoIds },
      send_time: { $gte: dateThreshold },
      'statistics.recipients': { $gt: 0 } // Only campaigns that were actually sent
    })
    .sort({ send_time: -1 })
    .limit(limit)
    .lean();

    // Step 4: Format the response with store names
    const storeMap = {};
    const storesWithKlaviyo = await Store.find({
      'klaviyo_integration.public_id': { $in: finalKlaviyoIds }
    }).select('public_id name klaviyo_integration.public_id').lean();

    storesWithKlaviyo.forEach(store => {
      storeMap[store.klaviyo_integration.public_id] = {
        public_id: store.public_id,
        name: store.name
      };
    });

    const formattedCampaigns = campaigns.map(campaign => ({
      campaign_id: campaign.groupings?.campaign_id,
      campaign_message_id: campaign.groupings?.campaign_message_id,
      campaign_name: campaign.campaign_name,
      subject_line: campaign.subject_line,
      channel: campaign.groupings?.send_channel || 'email',
      send_time: campaign.send_time,
      scheduled_at: campaign.scheduled_at,

      // Store info
      klaviyo_public_id: campaign.klaviyo_public_id,
      store_public_id: storeMap[campaign.klaviyo_public_id]?.public_id,
      store_name: storeMap[campaign.klaviyo_public_id]?.name || 'Unknown Store',

      // Core metrics
      recipients: campaign.statistics?.recipients || 0,
      delivered: campaign.statistics?.delivered || 0,
      delivery_rate: campaign.statistics?.delivery_rate || 0,

      // Engagement
      opens_unique: campaign.statistics?.opens_unique || 0,
      open_rate: campaign.statistics?.open_rate || 0,
      clicks_unique: campaign.statistics?.clicks_unique || 0,
      click_rate: campaign.statistics?.click_rate || 0,
      click_to_open_rate: campaign.statistics?.click_to_open_rate || 0,

      // Negative metrics
      bounced: campaign.statistics?.bounced || 0,
      bounce_rate: campaign.statistics?.bounce_rate || 0,
      unsubscribes: campaign.statistics?.unsubscribe_uniques || 0,
      unsubscribe_rate: campaign.statistics?.unsubscribe_rate || 0,
      spam_complaints: campaign.statistics?.spam_complaints || 0,
      spam_complaint_rate: campaign.statistics?.spam_complaint_rate || 0,

      // Revenue
      conversions: campaign.statistics?.conversions || 0,
      conversion_uniques: campaign.statistics?.conversion_uniques || 0,
      conversion_rate: campaign.statistics?.conversion_rate || 0,
      conversion_value: campaign.statistics?.conversion_value || 0,
      average_order_value: campaign.statistics?.average_order_value || 0,
      revenue_per_recipient: campaign.statistics?.revenue_per_recipient || 0,

      // Tags
      tags: campaign.tagNames || [],

      // Metadata
      created_at: campaign.created_at,
      updated_at: campaign.updated_at
    }));

    // Step 5: Calculate summary statistics
    const summary = {
      total_campaigns: formattedCampaigns.length,
      total_recipients: formattedCampaigns.reduce((sum, c) => sum + c.recipients, 0),
      total_delivered: formattedCampaigns.reduce((sum, c) => sum + c.delivered, 0),
      total_opens: formattedCampaigns.reduce((sum, c) => sum + c.opens_unique, 0),
      total_clicks: formattedCampaigns.reduce((sum, c) => sum + c.clicks_unique, 0),
      total_conversions: formattedCampaigns.reduce((sum, c) => sum + c.conversions, 0),
      total_revenue: formattedCampaigns.reduce((sum, c) => sum + c.conversion_value, 0),

      // Weighted averages
      avg_open_rate: formattedCampaigns.length > 0 ?
        (formattedCampaigns.reduce((sum, c) => sum + c.opens_unique, 0) /
         formattedCampaigns.reduce((sum, c) => sum + c.delivered, 0)) || 0 : 0,
      avg_click_rate: formattedCampaigns.length > 0 ?
        (formattedCampaigns.reduce((sum, c) => sum + c.clicks_unique, 0) /
         formattedCampaigns.reduce((sum, c) => sum + c.delivered, 0)) || 0 : 0,
      avg_conversion_rate: formattedCampaigns.length > 0 ?
        (formattedCampaigns.reduce((sum, c) => sum + c.conversions, 0) /
         formattedCampaigns.reduce((sum, c) => sum + c.delivered, 0)) || 0 : 0
    };

    return NextResponse.json({
      campaigns: formattedCampaigns,
      summary,
      metadata: {
        days_back: daysBack,
        limit,
        accessible_stores: accessibleStoreIds.length,
        queried_stores: finalKlaviyoIds.length
      }
    });

  } catch (error) {
    console.error('Recent campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent campaigns' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import CampaignStat from '@/models/CampaignStat';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const storePublicIds = searchParams.get('stores')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('[Deliverability API] Request params:', { storePublicIds, startDate, endDate });

    // CRITICAL: Convert store_public_ids to klaviyo_public_ids for querying MongoDB
    const stores = await Store.find({
      public_id: { $in: storePublicIds },
      is_deleted: { $ne: true }
    }).select('public_id name klaviyo_integration');

    const klaviyoIds = stores
      .map(store => store.klaviyo_integration?.public_id)
      .filter(Boolean);

    console.log('[Deliverability API] Found klaviyo IDs:', klaviyoIds);

    if (klaviyoIds.length === 0) {
      return NextResponse.json({
        campaigns: [],
        summary: {
          total_campaigns: 0,
          total_recipients: 0,
          total_delivered: 0,
          total_bounced: 0,
          total_spam_complaints: 0,
          total_unsubscribes: 0,
          total_opens_unique: 0,
          total_clicks_unique: 0,
          total_conversions: 0,
          total_revenue: 0,
          avg_delivery_rate: 0,
          avg_bounce_rate: 0,
          avg_spam_rate: 0,
          avg_unsubscribe_rate: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          avg_health_score: 0,
          revenue_per_recipient: 0,
          average_order_value: 0
        },
        metadata: {
          dateRange: { startDate, endDate },
          stores: 0,
          last_updated: new Date().toISOString()
        }
      });
    }

    // Build query for MongoDB campaignStats
    const query = {
      klaviyo_public_id: { $in: klaviyoIds }
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      query.send_time = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Fetch campaigns from MongoDB
    const campaignStats = await CampaignStat.find(query)
      .sort({ send_time: -1 })
      .lean();

    console.log('[Deliverability API] Found campaigns:', campaignStats.length);

    // Calculate health score for a campaign
    const calculateHealthScore = (stats) => {
      const deliveryRate = stats.delivery_rate || 0;
      const bounceRate = stats.bounce_rate || 0;
      const spamRate = stats.spam_complaint_rate || 0;
      const unsubscribeRate = stats.unsubscribe_rate || 0;

      const score = Math.min(100,
        Math.max(0, (deliveryRate - 90) * 5) +                    // Delivery rate weight
        Math.max(0, (2 - bounceRate) * 10) +                      // Bounce rate weight (inverse)
        Math.max(0, (0.3 - spamRate) * 50) +                      // Spam rate weight (inverse)
        Math.max(0, (1 - unsubscribeRate) * 20)                   // Unsubscribe rate weight (inverse)
      );

      return Math.max(0, Math.min(100, score));
    };

    // Map campaigns to deliverability format
    const campaigns = campaignStats.map(campaign => {
      const stats = campaign.statistics || {};
      const store = stores.find(s => s.klaviyo_integration?.public_id === campaign.klaviyo_public_id);

      // Convert rates from decimals (0.23) to percentages (23)
      const deliveryRate = (stats.delivery_rate || 0) * 100;
      const bounceRate = (stats.bounce_rate || 0) * 100;
      const spamRate = (stats.spam_complaint_rate || 0) * 100;
      const unsubscribeRate = (stats.unsubscribe_rate || 0) * 100;
      const openRate = (stats.open_rate || 0) * 100;
      const clickRate = (stats.click_rate || 0) * 100;
      const clickToOpenRate = (stats.click_to_open_rate || 0) * 100;
      const conversionRate = (stats.conversion_rate || 0) * 100;

      const healthScore = calculateHealthScore({
        delivery_rate: deliveryRate,
        bounce_rate: bounceRate,
        spam_complaint_rate: spamRate,
        unsubscribe_rate: unsubscribeRate
      });

      return {
        campaign_id: campaign.groupings?.campaign_id || campaign._id?.toString(),
        campaign_message_id: campaign.groupings?.campaign_message_id || '',
        campaign_name: campaign.campaign_name || 'Untitled Campaign',
        klaviyo_public_id: campaign.klaviyo_public_id,
        store_name: store?.name || 'Unknown Store',
        store_public_id: store?.public_id || '',
        send_date: campaign.send_time || campaign.created_at,
        channel: campaign.groupings?.send_channel || 'email',
        tags: campaign.tagNames || [],

        // Core metrics (raw numbers)
        recipients: stats.recipients || 0,
        delivered: stats.delivered || 0,
        bounced: stats.bounced || 0,
        spam_complaints: stats.spam_complaints || 0,
        unsubscribes: stats.unsubscribe_uniques || stats.unsubscribes || 0,
        opens: stats.opens || 0,
        opens_unique: stats.opens_unique || 0,
        clicks: stats.clicks || 0,
        clicks_unique: stats.clicks_unique || 0,
        conversions: stats.conversion_uniques || stats.conversions || 0,
        revenue: stats.conversion_value || 0,

        // Rates (as percentages)
        delivery_rate: deliveryRate,
        bounce_rate: bounceRate,
        spam_rate: spamRate,
        unsubscribe_rate: unsubscribeRate,
        open_rate: openRate,
        click_rate: clickRate,
        click_to_open_rate: clickToOpenRate,
        conversion_rate: conversionRate,
        revenue_per_recipient: stats.revenue_per_recipient || 0,
        average_order_value: stats.average_order_value || 0,

        // Health score
        health_score: healthScore,

        // Color for UI (based on health score)
        color: healthScore >= 80 ? '#10B981' :
               healthScore >= 60 ? '#F59E0B' :
               '#EF4444'
      };
    });

    // Calculate summary statistics
    const totals = campaigns.reduce((acc, campaign) => {
      acc.total_recipients += campaign.recipients;
      acc.total_delivered += campaign.delivered;
      acc.total_bounced += campaign.bounced;
      acc.total_spam_complaints += campaign.spam_complaints;
      acc.total_unsubscribes += campaign.unsubscribes;
      acc.total_opens_unique += campaign.opens_unique;
      acc.total_clicks_unique += campaign.clicks_unique;
      acc.total_conversions += campaign.conversions;
      acc.total_revenue += campaign.revenue;
      return acc;
    }, {
      total_recipients: 0,
      total_delivered: 0,
      total_bounced: 0,
      total_spam_complaints: 0,
      total_unsubscribes: 0,
      total_opens_unique: 0,
      total_clicks_unique: 0,
      total_conversions: 0,
      total_revenue: 0
    });

    const summary = {
      total_campaigns: campaigns.length,
      ...totals,
      // Calculate weighted averages
      avg_delivery_rate: totals.total_recipients > 0 ?
        (totals.total_delivered / totals.total_recipients) * 100 : 0,
      avg_bounce_rate: totals.total_recipients > 0 ?
        (totals.total_bounced / totals.total_recipients) * 100 : 0,
      avg_spam_rate: totals.total_delivered > 0 ?
        (totals.total_spam_complaints / totals.total_delivered) * 100 : 0,
      avg_unsubscribe_rate: totals.total_delivered > 0 ?
        (totals.total_unsubscribes / totals.total_delivered) * 100 : 0,
      avg_open_rate: totals.total_delivered > 0 ?
        (totals.total_opens_unique / totals.total_delivered) * 100 : 0,
      avg_click_rate: totals.total_delivered > 0 ?
        (totals.total_clicks_unique / totals.total_delivered) * 100 : 0,
      avg_health_score: campaigns.length > 0 ?
        campaigns.reduce((sum, c) => sum + c.health_score, 0) / campaigns.length : 0,
      revenue_per_recipient: totals.total_recipients > 0 ?
        totals.total_revenue / totals.total_recipients : 0,
      average_order_value: totals.total_conversions > 0 ?
        totals.total_revenue / totals.total_conversions : 0
    };

    const response = {
      campaigns,
      summary,
      metadata: {
        dateRange: { startDate, endDate },
        stores: stores.length,
        totalDataPoints: campaigns.length,
        last_updated: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching deliverability data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverability data' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getClickHouseClient } from '@/lib/clickhouse';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

/**
 * Hybrid approach for campaign analytics using ClickHouse:
 * 1. Use campaign_daily_aggregates for pre-aggregated email performance metrics
 * 2. Use account_metrics_daily for channel revenue breakdown
 * 3. Use campaign_statistics for individual campaign details
 *
 * IMPORTANT: This endpoint converts store public IDs to Klaviyo public IDs
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storePublicIds = searchParams.get('accountIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({
        error: 'Start date and end date are required'
      }, { status: 400 });
    }

    // Connect to MongoDB to fetch Klaviyo IDs
    await connectToDatabase();
    const db = mongoose.connection.db;

    // Convert store public IDs to Klaviyo public IDs
    let klaviyoIds = [];
    let storeMapping = {};

    if (storePublicIds.length > 0 && !storePublicIds.includes('all')) {
      console.log('Converting store public IDs to Klaviyo IDs:', storePublicIds);

      // Find all stores with these public IDs
      const stores = await db.collection('stores').find({
        public_id: { $in: storePublicIds },
        is_deleted: { $ne: true }
      }).toArray();

      console.log(`Found ${stores.length} stores out of ${storePublicIds.length} requested`);

      // Build mapping and extract Klaviyo IDs
      stores.forEach(store => {
        const klaviyoId = store.klaviyo_integration?.public_id;
        storeMapping[store.public_id] = {
          name: store.name,
          klaviyoId: klaviyoId || null
        };

        if (klaviyoId) {
          klaviyoIds.push(klaviyoId);
        }

        console.log(`  Store: ${store.name} (${store.public_id}) → Klaviyo: ${klaviyoId || 'NOT CONFIGURED'}`);
      });

      // Check for stores not found
      const notFound = storePublicIds.filter(id => !storeMapping[id]);
      if (notFound.length > 0) {
        console.log('Store IDs not found in database:', notFound);
      }

      if (klaviyoIds.length === 0) {
        console.log('WARNING: No stores have Klaviyo integration configured');

        // Return empty response instead of attempting fallback
        return NextResponse.json({
          campaigns: [],
          daily: [],
          aggregate: {
            totalCampaigns: 0,
            emailCampaigns: 0,
            smsCampaigns: 0,
            totalRecipients: 0,
            totalDelivered: 0,
            totalOpens: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            avgOpenRate: 0,
            avgClickRate: 0,
            avgConversionRate: 0
          }
        });
      }
    } else if (storePublicIds.length === 0) {
      // If no specific stores selected, get all stores with Klaviyo integration
      console.log('No specific stores selected, fetching all stores with Klaviyo integration');

      const allStores = await db.collection('stores').find({
        'klaviyo_integration.public_id': { $ne: null },
        is_deleted: { $ne: true }
      }).toArray();

      // Build mapping for all stores and extract Klaviyo IDs
      allStores.forEach(store => {
        const klaviyoId = store.klaviyo_integration?.public_id;
        storeMapping[store.public_id] = {
          name: store.name,
          klaviyoId: klaviyoId || null
        };

        if (klaviyoId) {
          klaviyoIds.push(klaviyoId);
        }
      });

      console.log(`Found ${klaviyoIds.length} stores with Klaviyo integration`);
    }

    const client = getClickHouseClient();

    // Build WHERE clause for filtering - convert ISO dates to YYYY-MM-DD format
    const whereConditions = [];
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    console.log(`Date conversion: ${startDate} → ${formattedStartDate}, ${endDate} → ${formattedEndDate}`);

    whereConditions.push(`date >= '${formattedStartDate}'`);
    whereConditions.push(`date <= '${formattedEndDate}'`);

    if (klaviyoIds.length > 0) {
      const klaviyoIdList = klaviyoIds.map(id => `'${id}'`).join(',');
      whereConditions.push(`klaviyo_public_id IN (${klaviyoIdList})`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Query 1: Get daily aggregated campaign performance from campaign_daily_aggregates
    const dailyAggregatesQuery = `
      SELECT
        date,
        klaviyo_public_id,

        -- Campaign counts
        total_campaigns,
        email_campaigns,
        sms_campaigns,

        -- Email performance metrics
        email_recipients,
        email_delivered,
        email_opens_unique,
        email_clicks_unique,

        -- Email rates (already calculated)
        email_open_rate,
        email_click_rate,

        -- SMS metrics
        sms_recipients,
        sms_delivered,
        sms_clicks_unique,
        sms_click_rate,

        -- Conversion metrics
        total_conversions,
        total_conversion_value,
        avg_conversion_rate,
        revenue_per_recipient,

        -- Best performers
        best_performing_campaign_id,
        best_performing_campaign_name,
        best_performing_campaign_revenue

      FROM campaign_daily_aggregates
      WHERE ${whereClause}
      ORDER BY date DESC
    `;

    // Query 2: Get channel revenue breakdown from account_metrics_daily
    const revenueQuery = `
      SELECT
        date,
        klaviyo_public_id,

        -- Channel-specific campaign revenue
        campaign_email_revenue,
        campaign_sms_revenue,
        campaign_push_revenue,

        -- Channel-specific flow revenue
        flow_email_revenue,
        flow_sms_revenue,
        flow_push_revenue,

        -- Combined channel totals
        email_revenue,
        sms_revenue,
        push_revenue,

        -- Total campaign and flow revenue
        campaign_revenue,
        flow_revenue,

        -- Overall metrics
        total_revenue,
        total_orders

      FROM account_metrics_daily_latest
      WHERE ${whereClause}
      ORDER BY date DESC
    `;

    // Query 3: Get individual campaign statistics for detailed view
    const campaignDetailsQuery = `
      SELECT
        campaign_id,
        campaign_name,
        klaviyo_public_id,
        date,
        send_channel as channel,
        recipients,
        delivered,
        opens_unique,
        clicks_unique,
        conversions,
        conversion_value as revenue,
        unsubscribes,

        -- Calculate rates
        CASE WHEN recipients > 0 THEN (delivered * 100.0 / recipients) ELSE 0 END as delivery_rate,
        CASE WHEN delivered > 0 THEN (opens_unique * 100.0 / delivered) ELSE 0 END as open_rate,
        CASE WHEN delivered > 0 THEN (clicks_unique * 100.0 / delivered) ELSE 0 END as click_rate,
        CASE WHEN opens_unique > 0 THEN (clicks_unique * 100.0 / opens_unique) ELSE 0 END as click_to_open_rate,
        CASE WHEN delivered > 0 THEN (conversions * 100.0 / delivered) ELSE 0 END as conversion_rate,
        CASE WHEN recipients > 0 THEN (conversion_value / recipients) ELSE 0 END as revenue_per_recipient,

        updated_at

      FROM campaign_statistics_latest
      WHERE ${whereClause}
      ORDER BY date DESC, revenue DESC
      LIMIT 1000
    `;

    // Execute all queries in parallel
    console.log('Executing ClickHouse queries...');
    const [dailyAggregatesResult, revenueResult, campaignDetailsResult] = await Promise.all([
      client.query({ query: dailyAggregatesQuery, format: 'JSONEachRow' }),
      client.query({ query: revenueQuery, format: 'JSONEachRow' }),
      client.query({ query: campaignDetailsQuery, format: 'JSONEachRow' })
    ]);

    // Parse results
    const dailyAggregates = await dailyAggregatesResult.json();
    const revenueData = await revenueResult.json();
    const campaignDetails = await campaignDetailsResult.json();

    console.log(`Found ${dailyAggregates.length} daily aggregate records`);
    console.log(`Found ${revenueData.length} revenue records`);
    console.log(`Found ${campaignDetails.length} campaign details`);

    // Merge daily data by date
    const dailyDataMap = new Map();

    // Process daily aggregates
    dailyAggregates.forEach(day => {
      const key = `${day.date}_${day.klaviyo_public_id}`;
      dailyDataMap.set(key, {
        ...day,
        // Initialize revenue fields
        campaign_email_revenue: 0,
        campaign_sms_revenue: 0,
        campaign_push_revenue: 0
      });
    });

    // Merge revenue data
    revenueData.forEach(revenue => {
      const key = `${revenue.date}_${revenue.klaviyo_public_id}`;
      const existing = dailyDataMap.get(key);
      if (existing) {
        dailyDataMap.set(key, {
          ...existing,
          campaign_email_revenue: revenue.campaign_email_revenue,
          campaign_sms_revenue: revenue.campaign_sms_revenue,
          campaign_push_revenue: revenue.campaign_push_revenue,
          flow_email_revenue: revenue.flow_email_revenue,
          flow_sms_revenue: revenue.flow_sms_revenue,
          total_revenue: revenue.total_revenue
        });
      }
    });

    // Calculate aggregate statistics across all days
    let aggregateStats = {
      totalCampaigns: 0,
      emailCampaigns: 0,
      smsCampaigns: 0,

      // Email metrics
      totalEmailRecipients: 0,
      totalEmailDelivered: 0,
      totalEmailOpens: 0,
      totalEmailClicks: 0,

      // SMS metrics
      totalSmsRecipients: 0,
      totalSmsDelivered: 0,
      totalSmsClicks: 0,

      // Conversion and revenue
      totalConversions: 0,
      totalRevenue: 0,
      campaignEmailRevenue: 0,
      campaignSmsRevenue: 0,

      // Calculated rates
      avgEmailOpenRate: 0,
      avgEmailClickRate: 0,
      avgEmailCTOR: 0,
      avgSmsClickRate: 0,
      avgConversionRate: 0,
      revenuePerRecipient: 0
    };

    // Aggregate daily data
    Array.from(dailyDataMap.values()).forEach(day => {
      aggregateStats.totalCampaigns += day.total_campaigns || 0;
      aggregateStats.emailCampaigns += day.email_campaigns || 0;
      aggregateStats.smsCampaigns += day.sms_campaigns || 0;

      aggregateStats.totalEmailRecipients += day.email_recipients || 0;
      aggregateStats.totalEmailDelivered += day.email_delivered || 0;
      aggregateStats.totalEmailOpens += day.email_opens_unique || 0;
      aggregateStats.totalEmailClicks += day.email_clicks_unique || 0;

      aggregateStats.totalSmsRecipients += day.sms_recipients || 0;
      aggregateStats.totalSmsDelivered += day.sms_delivered || 0;
      aggregateStats.totalSmsClicks += day.sms_clicks_unique || 0;

      aggregateStats.totalConversions += day.total_conversions || 0;
      aggregateStats.totalRevenue += day.total_conversion_value || 0;
      aggregateStats.campaignEmailRevenue += day.campaign_email_revenue || 0;
      aggregateStats.campaignSmsRevenue += day.campaign_sms_revenue || 0;
    });

    // Calculate weighted average rates
    if (aggregateStats.totalEmailDelivered > 0) {
      aggregateStats.avgEmailOpenRate = (aggregateStats.totalEmailOpens / aggregateStats.totalEmailDelivered) * 100;
      aggregateStats.avgEmailClickRate = (aggregateStats.totalEmailClicks / aggregateStats.totalEmailDelivered) * 100;
    }

    if (aggregateStats.totalEmailOpens > 0) {
      aggregateStats.avgEmailCTOR = (aggregateStats.totalEmailClicks / aggregateStats.totalEmailOpens) * 100;
    }

    if (aggregateStats.totalSmsDelivered > 0) {
      aggregateStats.avgSmsClickRate = (aggregateStats.totalSmsClicks / aggregateStats.totalSmsDelivered) * 100;
    }

    const totalRecipients = aggregateStats.totalEmailRecipients + aggregateStats.totalSmsRecipients;
    if (totalRecipients > 0) {
      aggregateStats.avgConversionRate = (aggregateStats.totalConversions / totalRecipients) * 100;
      aggregateStats.revenuePerRecipient = aggregateStats.totalRevenue / totalRecipients;
    }

    // Prepare chart data (daily aggregates)
    const chartData = Array.from(dailyDataMap.values()).map(day => ({
      date: day.date,
      campaigns: day.total_campaigns,
      emailCampaigns: day.email_campaigns,
      smsCampaigns: day.sms_campaigns,
      recipients: day.email_recipients + day.sms_recipients,
      delivered: day.email_delivered + day.sms_delivered,
      opens: day.email_opens_unique,
      clicks: day.email_clicks_unique + day.sms_clicks_unique,
      conversions: day.total_conversions,
      revenue: day.total_conversion_value,
      emailRevenue: day.campaign_email_revenue,
      smsRevenue: day.campaign_sms_revenue,
      openRate: day.email_open_rate * 100,
      clickRate: day.email_click_rate * 100,
      conversionRate: day.avg_conversion_rate * 100
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create reverse mapping from klaviyo_public_id to store info
    const klaviyoToStoreMapping = {};
    Object.entries(storeMapping).forEach(([storePublicId, storeInfo]) => {
      if (storeInfo.klaviyoId) {
        klaviyoToStoreMapping[storeInfo.klaviyoId] = {
          storePublicId,
          storeName: storeInfo.name
        };
      }
    });

    // Transform individual campaigns for frontend
    const transformedCampaigns = campaignDetails.map(campaign => {
      // Find store info using klaviyo_public_id
      const storeInfo = klaviyoToStoreMapping[campaign.klaviyo_public_id] || {};

      return {
        id: campaign.campaign_id,
        campaignId: campaign.campaign_id,
        name: campaign.campaign_name || 'Unnamed Campaign',
        type: campaign.channel,
        channel: campaign.channel,
        status: 'sent',

        // Store information for calendar mapping
        klaviyo_public_id: campaign.klaviyo_public_id,
        store_public_ids: storeInfo.storePublicId ? [storeInfo.storePublicId] : [],
        storeName: storeInfo.storeName || 'Unknown Store',

        // Core metrics
        recipients: campaign.recipients,
        delivered: campaign.delivered,
        opensUnique: campaign.opens_unique,
        clicksUnique: campaign.clicks_unique,
        conversions: campaign.conversions,
        revenue: campaign.revenue,

        // Rates (already calculated in query)
        deliveryRate: campaign.delivery_rate,
        openRate: campaign.open_rate,
        clickRate: campaign.click_rate,
        clickToOpenRate: campaign.click_to_open_rate,
        conversionRate: campaign.conversion_rate,
        revenuePerRecipient: campaign.revenue_per_recipient,

        // Other metrics
        unsubscribes: campaign.unsubscribes,
        unsubscribeRate: campaign.delivered > 0 ? (campaign.unsubscribes / campaign.delivered) * 100 : 0,

        // Metadata
        sentAt: campaign.date,
        send_date: campaign.date,
        updatedAt: campaign.updated_at,
        accountId: campaign.klaviyo_public_id
      };
    });

    return NextResponse.json({
      campaigns: transformedCampaigns,
      aggregateStats,
      chartData,
      dailyData: Array.from(dailyDataMap.values()),
      totalCount: transformedCampaigns.length,
      dateRange: { startDate, endDate },
      filters: { accountIds: storePublicIds },
      dataSource: 'clickhouse'
    });

  } catch (error) {
    console.error('Error fetching campaign analytics from ClickHouse:', error);
    return NextResponse.json({
      error: 'Failed to fetch campaign analytics from ClickHouse',
      details: error.message
    }, { status: 500 });
  }
}
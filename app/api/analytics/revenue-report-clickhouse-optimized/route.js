import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request) {
  try {
    // Verify user session
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');
    const storeId = searchParams.get('storeId');

    // Get store info to get klaviyo_public_id
    const store = await Store.findOne({ public_id: storeId });
    if (!store || !store.klaviyo_integration?.public_id) {
      return NextResponse.json({ error: "Store not found or not configured" }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration.public_id;
    const clickhouse = getClickHouseClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2));
    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - days);

    // Format dates for ClickHouse
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Query 1: Use account_metrics_daily for aggregated metrics (V2 architecture)
    // This table is the primary source for overall revenue metrics with channel breakdown
    const ordersQuery = `
      SELECT
        sum(total_orders) as total_orders,
        sum(total_revenue) as total_revenue,
        avg(avg_order_value) as avg_order_value,
        max(unique_customers) as unique_customers,
        sum(new_customers) as new_customers_count,
        sum(returning_customers) as returning_customers_count,
        -- Channel revenue breakdown (V2 fields)
        sum(email_revenue) as email_revenue,
        sum(sms_revenue) as sms_revenue,
        sum(push_revenue) as push_revenue,
        sum(campaign_revenue) as campaign_revenue,
        sum(flow_revenue) as flow_revenue,
        -- Separate campaign channel revenue
        sum(campaign_email_revenue) as campaign_email_revenue,
        sum(campaign_sms_revenue) as campaign_sms_revenue,
        sum(campaign_push_revenue) as campaign_push_revenue
      FROM account_metrics_daily_latest
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {start_date:Date} AND {end_date:Date}
    `;

    // Query 2: Get detailed campaign statistics using campaign_statistics table (V2)
    const campaignStatsDetailQuery = `
      WITH latest_campaigns AS (
        SELECT
          campaign_id,
          argMax(recipients, last_updated) as recipients,
          argMax(opens_unique, last_updated) as opens_unique,
          argMax(clicks_unique, last_updated) as clicks_unique,
          argMax(conversions, last_updated) as conversions,
          argMax(conversion_value, last_updated) as conversion_value,
          argMax(send_channel, last_updated) as send_channel
        FROM campaign_statistics_latest
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date BETWEEN {start_date:Date} AND {end_date:Date}
        GROUP BY campaign_id
      )
      SELECT
        count(DISTINCT campaign_id) as total_campaigns,
        sum(recipients) as total_recipients,
        sum(conversion_value) as campaign_revenue,
        sum(conversions) as total_conversions,
        sum(conversion_value) / nullIf(sum(recipients), 0) as avg_rpr
      FROM latest_campaigns
    `;

    // Query 3: Get flow attributed revenue using flow_statistics (V2 with argMax)
    const flowRevenueQuery = `
      WITH latest_flows AS (
        SELECT
          flow_id,
          argMax(recipients, last_updated) as recipients,
          argMax(conversion_value, last_updated) as conversion_value,
          argMax(conversions, last_updated) as conversions
        FROM flow_statistics_latest
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date BETWEEN {start_date:Date} AND {end_date:Date}
        GROUP BY flow_id
      )
      SELECT
        sum(conversion_value) as flow_revenue,
        sum(recipients) as total_recipients,
        count(DISTINCT flow_id) as active_flows
      FROM latest_flows
    `;

    // Query 4: Customer analysis is now included in account_metrics_daily, no separate query needed

    // Query 5: Get previous period metrics using account_metrics_daily (V2)
    const previousPeriodQuery = `
      SELECT
        sum(total_orders) as total_orders,
        sum(total_revenue) as total_revenue,
        avg(avg_order_value) as avg_order_value,
        max(unique_customers) as unique_customers,
        sum(campaign_revenue) as campaign_revenue,
        sum(flow_revenue) as flow_revenue
      FROM account_metrics_daily_latest
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {prev_start_date:Date} AND {prev_end_date:Date}
    `;

    // Query 6: Get form statistics using V2 argMax pattern
    const formStatsQuery = `
      WITH latest_forms AS (
        SELECT
          form_id,
          argMax(submits, last_updated) as submits
        FROM form_statistics_latest
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date BETWEEN {start_date:Date} AND {end_date:Date}
        GROUP BY form_id
      )
      SELECT
        count(DISTINCT form_id) as active_forms,
        sum(submits) as total_submissions
      FROM latest_forms
    `;

    // Query 7: Get segment statistics using V2 argMax pattern
    const segmentStatsQuery = `
      WITH latest_segments AS (
        SELECT
          segment_id,
          argMax(total_members, last_updated) as total_members
        FROM segment_statistics_latest
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date = (
            SELECT max(date)
            FROM segment_statistics_latest
            WHERE klaviyo_public_id = {klaviyo_public_id:String}
          )
        GROUP BY segment_id
      )
      SELECT
        count(DISTINCT segment_id) as total_segments,
        sum(total_members) as total_profiles
      FROM latest_segments
    `;

    // Query 8: Get email/SMS campaign performance using V2 argMax pattern
    const campaignStatsQuery = `
      WITH latest_campaigns AS (
        SELECT
          campaign_id,
          argMax(send_channel, last_updated) as channel,
          argMax(recipients, last_updated) as recipients,
          argMax(opens_unique, last_updated) as opens_unique,
          argMax(clicks_unique, last_updated) as clicks_unique,
          argMax(open_rate, last_updated) as open_rate,
          argMax(click_rate, last_updated) as click_rate
        FROM campaign_statistics_latest
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date BETWEEN {start_date:Date} AND {end_date:Date}
        GROUP BY campaign_id
      )
      SELECT
        channel,
        count(DISTINCT campaign_id) as total_campaigns,
        sum(recipients) as total_sent,
        sum(opens_unique) as total_opens,
        sum(clicks_unique) as total_clicks,
        avg(open_rate) as avg_open_rate,
        avg(click_rate) as avg_click_rate,
        avg(CASE WHEN opens_unique > 0 THEN (clicks_unique * 100.0 / opens_unique) ELSE 0 END) as avg_ctor
      FROM latest_campaigns
      GROUP BY channel
    `;

    // Query 9: Get daily revenue breakdown for chart
    const revenueByDayQuery = `
      SELECT
        date,
        total_revenue as revenue,
        (campaign_revenue + flow_revenue) as attributed_revenue,
        campaign_email_revenue as email_campaign_revenue,
        campaign_sms_revenue as sms_campaign_revenue,
        flow_revenue as flow_revenue,
        GREATEST(0, total_revenue - campaign_revenue - flow_revenue) as other_revenue
      FROM account_metrics_daily_latest
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {start_date:Date} AND {end_date:Date}
      ORDER BY date ASC
    `;

    // Execute queries
    const queries = [
      clickhouse.query({
        query: ordersQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: campaignStatsDetailQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: flowRevenueQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: previousPeriodQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          prev_start_date: formatDate(previousStartDate),
          prev_end_date: formatDate(previousEndDate)
        },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: formStatsQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: segmentStatsQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId
        },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: campaignStatsQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: revenueByDayQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      })
    ];

    const results = await Promise.all(queries);

    // Parse results - V2 architecture doesn't need separate customer query
    const orders = (await results[0].json())[0] || {};
    const campaignsDetail = (await results[1].json())[0] || {};
    const flows = (await results[2].json())[0] || {};
    const previous = (await results[3].json())[0] || {};
    const forms = (await results[4].json())[0] || {};
    const segments = (await results[5].json())[0] || {};
    const campaignStatsArray = await results[6].json() || [];
    const revenueByDay = await results[7].json() || [];

    // Parse campaign stats by channel
    const campaignStatsByChannel = {};
    for (const stat of campaignStatsArray) {
      campaignStatsByChannel[stat.channel] = stat;
    }

    // Calculate derived metrics using V2 aggregated data
    const totalRevenue = parseFloat(orders.total_revenue || 0);

    // Use channel revenue from account_metrics_daily (includes both campaign and flow)
    const campaignRevenue = parseFloat(orders.campaign_revenue || 0);
    const flowRevenue = parseFloat(orders.flow_revenue || 0);
    const emailRevenue = parseFloat(orders.email_revenue || 0);
    const smsRevenue = parseFloat(orders.sms_revenue || 0);
    const pushRevenue = parseFloat(orders.push_revenue || 0);

    // Separate campaign channel revenue
    const campaignEmailRevenue = parseFloat(orders.campaign_email_revenue || 0);
    const campaignSmsRevenue = parseFloat(orders.campaign_sms_revenue || 0);
    const campaignPushRevenue = parseFloat(orders.campaign_push_revenue || 0);

    const attributedRevenue = campaignRevenue + flowRevenue;
    const attributedPercentage = totalRevenue > 0 ? (attributedRevenue / totalRevenue) * 100 : 0;

    const uniqueCustomers = parseInt(orders.unique_customers || 0);
    const newCustomers = parseInt(orders.new_customers_count || 0);
    const returningCustomers = parseInt(orders.returning_customers_count || 0);
    const repeatRate = uniqueCustomers > 0 ? (returningCustomers / uniqueCustomers) * 100 : 0;

    // Build response
    const response = {
      // Current period metrics
      overall_revenue: totalRevenue,
      attributed_revenue: attributedRevenue,
      attributed_percentage: attributedPercentage,
      total_orders: parseInt(orders.total_orders || 0),
      unique_customers: uniqueCustomers,
      avg_order_value: parseFloat(orders.avg_order_value || 0),
      new_customers: newCustomers,
      returning_customers: returningCustomers,
      repeat_rate: repeatRate,

      // Channel breakdown - enhanced with V2 channel revenue data
      channel_breakdown: {
        campaign_revenue: campaignRevenue,
        campaign_percentage: totalRevenue > 0 ? (campaignRevenue / totalRevenue) * 100 : 0,
        flow_revenue: flowRevenue,
        flow_percentage: totalRevenue > 0 ? (flowRevenue / totalRevenue) * 100 : 0,
        other_revenue: Math.max(0, totalRevenue - attributedRevenue),
        other_percentage: totalRevenue > 0 ? Math.max(0, ((totalRevenue - attributedRevenue) / totalRevenue) * 100) : 0,
        // V2 channel revenue breakdown
        email_revenue: emailRevenue,
        sms_revenue: smsRevenue,
        push_revenue: pushRevenue,
        // Campaign channel breakdown
        campaign_email_revenue: campaignEmailRevenue,
        campaign_email_percentage: totalRevenue > 0 ? (campaignEmailRevenue / totalRevenue) * 100 : 0,
        campaign_sms_revenue: campaignSmsRevenue,
        campaign_sms_percentage: totalRevenue > 0 ? (campaignSmsRevenue / totalRevenue) * 100 : 0,
        campaign_push_revenue: campaignPushRevenue,
        campaign_push_percentage: totalRevenue > 0 ? (campaignPushRevenue / totalRevenue) * 100 : 0
      },

      // Email/SMS campaign performance (check both lowercase and capitalized)
      campaign_performance: {
        email: campaignStatsByChannel['email'] || campaignStatsByChannel['Email'] || {
          total_campaigns: 0,
          total_sent: 0,
          total_opens: 0,
          total_clicks: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          avg_ctor: 0
        },
        sms: campaignStatsByChannel['sms'] || campaignStatsByChannel['SMS'] || {
          total_campaigns: 0,
          total_sent: 0,
          total_opens: 0,
          total_clicks: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          avg_ctor: 0
        }
      },

      // Previous period for comparison (now includes attribution data from V2)
      previous_period: {
        overall_revenue: parseFloat(previous.total_revenue || 0),
        attributed_revenue: parseFloat(previous.campaign_revenue || 0) + parseFloat(previous.flow_revenue || 0),
        total_orders: parseInt(previous.total_orders || 0),
        unique_customers: parseInt(previous.unique_customers || 0),
        avg_order_value: parseFloat(previous.avg_order_value || 0),
        new_customers: 0, // Could be added to previous period query if needed
        returning_customers: 0 // Could be added to previous period query if needed
      },

      // Brand/Store info
      brand: {
        name: store.name,
        total_campaigns: parseInt(campaignsDetail.total_campaigns || 0),
        active_flows: parseInt(flows.active_flows || 0),
        segments: parseInt(segments.total_segments || 0),
        active_forms: parseInt(forms.active_forms || 0),
        total_submissions: parseInt(forms.total_submissions || 0),
        total_profiles: parseInt(segments.total_profiles || 0)
      },

      // Date range info
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: days
      },

      // Daily revenue breakdown for charts
      revenue_by_day: revenueByDay.map(day => ({
        date: day.date,
        revenue: parseFloat(day.revenue || 0),
        attributed_revenue: parseFloat(day.attributed_revenue || 0),
        email_campaign_revenue: parseFloat(day.email_campaign_revenue || 0),
        sms_campaign_revenue: parseFloat(day.sms_campaign_revenue || 0),
        flow_revenue: parseFloat(day.flow_revenue || 0),
        other_revenue: parseFloat(day.other_revenue || 0)
      })),

      // Metadata
      _metadata: {
        using_v2_architecture: true,
        query_timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Revenue report ClickHouse error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue report from ClickHouse', details: error.message },
      { status: 500 }
    );
  }
}
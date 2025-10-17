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

    // Query 1: Use account_metrics_daily for overall metrics (V2 architecture)
    const ordersQuery = `
      SELECT
        sum(total_orders) as total_orders,
        sum(total_revenue) as total_revenue,
        avg(avg_order_value) as avg_order_value,
        max(unique_customers) as unique_customers,
        sum(new_customers) as new_customers,
        sum(returning_customers) as returning_customers
      FROM account_metrics_daily
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {start_date:Date} AND {end_date:Date}
    `;

    // Query 2: Get campaign statistics using V2 argMax pattern
    const campaignRevenueQuery = `
      WITH latest_campaigns AS (
        SELECT
          campaign_id,
          argMax(recipients, updated_at) as recipients,
          argMax(conversion_value, updated_at) as conversion_value,
          argMax(conversions, updated_at) as conversions
        FROM campaign_statistics
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date BETWEEN {start_date:Date} AND {end_date:Date}
        GROUP BY campaign_id
      )
      SELECT
        count(DISTINCT campaign_id) as total_campaigns,
        sum(recipients) as total_recipients,
        sum(conversion_value) as campaign_revenue,
        sum(conversions) as total_conversions,
        sum(conversions) * 100.0 / nullIf(sum(recipients), 0) as avg_conversion_rate,
        sum(conversion_value) / nullIf(sum(recipients), 0) as revenue_per_recipient
      FROM latest_campaigns
    `;

    // Query 3: Get flow statistics using V2 argMax pattern
    const flowRevenueQuery = `
      WITH latest_flows AS (
        SELECT
          flow_id,
          argMax(conversion_value, updated_at) as conversion_value,
          argMax(recipients, updated_at) as recipients
        FROM flow_statistics
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

    // Query 4: Customer analysis is included in account_metrics_daily (V2)
    // No separate query needed as new_customers and returning_customers are in ordersQuery

    // Query 5: Get previous period metrics using account_metrics_daily
    const previousPeriodQuery = `
      SELECT
        sum(total_orders) as total_orders,
        sum(total_revenue) as total_revenue,
        avg(avg_order_value) as avg_order_value,
        max(unique_customers) as unique_customers
      FROM account_metrics_daily
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {prev_start_date:Date} AND {prev_end_date:Date}
    `;

    // Query 6: Get form statistics using V2 argMax pattern
    const formStatsQuery = `
      WITH latest_forms AS (
        SELECT
          form_id,
          argMax(submits, updated_at) as submits
        FROM form_statistics
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
          argMax(total_members, updated_at) as total_members
        FROM segment_statistics
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date = (
            SELECT max(date)
            FROM segment_statistics
            WHERE klaviyo_public_id = {klaviyo_public_id:String}
          )
        GROUP BY segment_id
      )
      SELECT
        count(DISTINCT segment_id) as total_segments,
        sum(total_members) as total_profiles
      FROM latest_segments
    `;

    // Execute all queries in parallel (customerAnalysisQuery removed - data in ordersQuery)
    const [
      ordersResult,
      campaignResult,
      flowResult,
      previousResult,
      formResult,
      segmentResult
    ] = await Promise.all([
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
        query: campaignRevenueQuery,
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
      })
    ]);

    // Parse results (customer data now included in orders)
    const orders = (await ordersResult.json())[0] || {};
    const campaigns = (await campaignResult.json())[0] || {};
    const flows = (await flowResult.json())[0] || {};
    const previous = (await previousResult.json())[0] || {};
    const forms = (await formResult.json())[0] || {};
    const segments = (await segmentResult.json())[0] || {};

    // Calculate derived metrics
    const totalRevenue = parseFloat(orders.total_revenue || 0);
    const campaignRevenue = parseFloat(campaigns.campaign_revenue || 0);
    const flowRevenue = parseFloat(flows.flow_revenue || 0);
    const attributedRevenue = campaignRevenue + flowRevenue;
    const attributedPercentage = totalRevenue > 0 ? (attributedRevenue / totalRevenue) * 100 : 0;

    const uniqueCustomers = parseInt(orders.unique_customers || 0);
    const newCustomers = parseInt(orders.new_customers || 0);
    const returningCustomers = parseInt(orders.returning_customers || 0);
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

      // Channel breakdown
      channel_breakdown: {
        campaign_revenue: campaignRevenue,
        campaign_percentage: totalRevenue > 0 ? (campaignRevenue / totalRevenue) * 100 : 0,
        flow_revenue: flowRevenue,
        flow_percentage: totalRevenue > 0 ? (flowRevenue / totalRevenue) * 100 : 0,
        other_revenue: Math.max(0, totalRevenue - attributedRevenue),
        other_percentage: totalRevenue > 0 ? Math.max(0, ((totalRevenue - attributedRevenue) / totalRevenue) * 100) : 0
      },

      // Previous period for comparison
      previous_period: {
        overall_revenue: parseFloat(previous.total_revenue || 0),
        attributed_revenue: 0, // Would need separate queries
        total_orders: parseInt(previous.total_orders || 0),
        unique_customers: parseInt(previous.unique_customers || 0),
        avg_order_value: parseFloat(previous.avg_order_value || 0),
        new_customers: 0, // Would need separate query
        returning_customers: 0 // Would need separate query
      },

      // Brand/Store info
      brand: {
        name: store.name,
        total_campaigns: parseInt(campaigns.total_campaigns || 0),
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
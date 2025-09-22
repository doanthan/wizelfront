import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
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

    // Query 1: Try to get aggregated metrics from account_metrics_daily first (most efficient)
    // If this table exists, it's the best source for overall revenue metrics
    let ordersQuery;
    let useAggregatedTable = false;

    try {
      // Check if account_metrics_daily exists and has data
      const checkTableQuery = `
        SELECT count() as row_count
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date BETWEEN {start_date:Date} AND {end_date:Date}
        LIMIT 1
      `;

      const checkResult = await clickhouse.query({
        query: checkTableQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      });

      const check = (await checkResult.json())[0];

      if (check && check.row_count > 0) {
        useAggregatedTable = true;
        ordersQuery = `
          SELECT
            sum(total_orders) as total_orders,
            sum(total_revenue) as total_revenue,
            avg(avg_order_value) as avg_order_value,
            sum(unique_customers) as unique_customers,
            sum(new_customers) as new_customers_count,
            sum(returning_customers) as returning_customers_count
          FROM account_metrics_daily FINAL
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
            AND date BETWEEN {start_date:Date} AND {end_date:Date}
        `;
      }
    } catch (e) {
      console.log('account_metrics_daily not available, falling back to orders table');
    }

    // Fallback to orders table if aggregated table not available
    if (!useAggregatedTable) {
      ordersQuery = `
        SELECT
          count() as total_orders,
          sum(order_value) as total_revenue,
          avg(order_value) as avg_order_value,
          uniqExact(customer_email) as unique_customers
        FROM klaviyo_orders FINAL
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND toDate(order_timestamp) BETWEEN {start_date:Date} AND {end_date:Date}
      `;
    }

    // Query 2: Get campaign attributed revenue using aggregated table for better performance
    const campaignRevenueQuery = `
      SELECT
        sum(total_campaigns) as total_campaigns,
        sum(email_recipients + sms_recipients) as total_recipients,
        sum(total_conversion_value) as campaign_revenue,
        sum(total_conversions) as total_conversions,
        avg(revenue_per_recipient) as avg_rpr
      FROM campaign_daily_aggregates FINAL
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {start_date:Date} AND {end_date:Date}
    `;

    // Query 3: Get flow attributed revenue
    const flowRevenueQuery = `
      SELECT
        sum(conversion_value) as flow_revenue,
        sum(recipients) as total_recipients,
        count(DISTINCT flow_id) as active_flows
      FROM flow_statistics FINAL
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {start_date:Date} AND {end_date:Date}
    `;

    // Query 4: Get customer breakdown (only if not using aggregated table)
    let customerAnalysisQuery = null;
    if (!useAggregatedTable) {
      customerAnalysisQuery = `
        WITH customer_orders AS (
          SELECT
            customer_email,
            count() as order_count,
            min(order_timestamp) as first_order_date
          FROM klaviyo_orders FINAL
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
          GROUP BY customer_email
        )
        SELECT
          countIf(toDate(first_order_date) BETWEEN {start_date:Date} AND {end_date:Date}) as new_customers,
          countIf(toDate(first_order_date) < {start_date:Date} AND order_count > 1) as returning_customers
        FROM customer_orders
      `;
    }

    // Query 5: Get previous period metrics
    let previousPeriodQuery;
    if (useAggregatedTable) {
      previousPeriodQuery = `
        SELECT
          sum(total_orders) as total_orders,
          sum(total_revenue) as total_revenue,
          avg(avg_order_value) as avg_order_value,
          sum(unique_customers) as unique_customers
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND date BETWEEN {prev_start_date:Date} AND {prev_end_date:Date}
      `;
    } else {
      previousPeriodQuery = `
        SELECT
          count() as total_orders,
          sum(order_value) as total_revenue,
          avg(order_value) as avg_order_value,
          uniqExact(customer_email) as unique_customers
        FROM klaviyo_orders FINAL
        WHERE klaviyo_public_id = {klaviyo_public_id:String}
          AND toDate(order_timestamp) BETWEEN {prev_start_date:Date} AND {prev_end_date:Date}
      `;
    }

    // Query 6: Get form statistics
    const formStatsQuery = `
      SELECT
        count(DISTINCT form_id) as active_forms,
        sum(submits) as total_submissions
      FROM form_statistics FINAL
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date BETWEEN {start_date:Date} AND {end_date:Date}
    `;

    // Query 7: Get segment statistics
    const segmentStatsQuery = `
      SELECT
        count(DISTINCT segment_id) as total_segments,
        sum(total_members) as total_profiles
      FROM segment_statistics FINAL
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date = (
          SELECT max(date)
          FROM segment_statistics FINAL
          WHERE klaviyo_public_id = {klaviyo_public_id:String}
        )
    `;

    // Query 8: Get email/SMS campaign performance
    const campaignStatsQuery = `
      SELECT
        send_channel as channel,
        count(DISTINCT campaign_id) as total_campaigns,
        sum(recipients) as total_sent,
        sum(opens_unique) as total_opens,
        sum(clicks_unique) as total_clicks,
        avg(CASE WHEN recipients > 0 THEN (opens_unique * 100.0 / recipients) ELSE 0 END) as avg_open_rate,
        avg(CASE WHEN recipients > 0 THEN (clicks_unique * 100.0 / recipients) ELSE 0 END) as avg_click_rate,
        avg(CASE WHEN opens_unique > 0 THEN (clicks_unique * 100.0 / opens_unique) ELSE 0 END) as avg_ctor
      FROM campaign_statistics FINAL
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
        AND date >= {start_date:Date}
        AND date <= {end_date:Date}
      GROUP BY send_channel
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
      }),
      clickhouse.query({
        query: campaignStatsQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      })
    ];

    // Add customer analysis query if needed
    if (customerAnalysisQuery) {
      queries.splice(3, 0, clickhouse.query({
        query: customerAnalysisQuery,
        query_params: {
          klaviyo_public_id: klaviyoPublicId,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        },
        format: 'JSONEachRow'
      }));
    }

    const results = await Promise.all(queries);

    // Parse results
    let resultIndex = 0;
    const orders = (await results[resultIndex++].json())[0] || {};
    const campaigns = (await results[resultIndex++].json())[0] || {};
    const flows = (await results[resultIndex++].json())[0] || {};
    const customers = customerAnalysisQuery ? (await results[resultIndex++].json())[0] || {} : null;
    const previous = (await results[resultIndex++].json())[0] || {};
    const forms = (await results[resultIndex++].json())[0] || {};
    const segments = (await results[resultIndex++].json())[0] || {};
    const campaignStatsArray = await results[resultIndex++].json() || [];

    // Parse campaign stats by channel
    const campaignStatsByChannel = {};
    for (const stat of campaignStatsArray) {
      campaignStatsByChannel[stat.channel] = stat;
    }

    // Calculate derived metrics
    const totalRevenue = parseFloat(orders.total_revenue || 0);
    const campaignRevenue = parseFloat(campaigns.campaign_revenue || 0);
    const flowRevenue = parseFloat(flows.flow_revenue || 0);
    const attributedRevenue = campaignRevenue + flowRevenue;
    const attributedPercentage = totalRevenue > 0 ? (attributedRevenue / totalRevenue) * 100 : 0;

    const uniqueCustomers = parseInt(orders.unique_customers || 0);

    // Use aggregated data if available, otherwise use calculated values
    const newCustomers = useAggregatedTable ?
      parseInt(orders.new_customers_count || 0) :
      parseInt(customers?.new_customers || 0);

    const returningCustomers = useAggregatedTable ?
      parseInt(orders.returning_customers_count || 0) :
      parseInt(customers?.returning_customers || 0);

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
      },

      // Metadata
      _metadata: {
        using_aggregated_table: useAggregatedTable,
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
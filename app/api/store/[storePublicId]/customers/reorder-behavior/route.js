import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { createClient } from '@clickhouse/client';

export async function GET(request, { params }) {
  try {
    const { storePublicId } = await params;

    // Connect to MongoDB and get store
    await connectToDatabase();
    const store = await Store.findOne({
      public_id: storePublicId,
      is_deleted: { $ne: true }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration?.public_id;
    if (!klaviyoPublicId) {
      return NextResponse.json({ error: 'No Klaviyo integration found' }, { status: 404 });
    }

    // Create ClickHouse client (move inside function to avoid initialization errors)
    const clickhouse = createClient({
      url: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || '8443'}`,
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD,
    });

    // Step 1: Get percentiles first
    const percentilesQuery = `
      WITH customer_orders AS (
        SELECT
          customer_email,
          toDate(order_timestamp) as order_date,
          row_number() OVER (PARTITION BY customer_email ORDER BY order_timestamp) as order_number
        FROM klaviyo_orders
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
          AND customer_email != ''
          AND customer_email NOT LIKE '%redacted%'
          AND customer_email NOT LIKE '%null%'
          AND customer_email NOT LIKE '%@anonymous.local%'
          AND customer_email LIKE '%@%.%'
      ),
      reorder_intervals AS (
        SELECT
          dateDiff('day', prev.order_date, curr.order_date) as days_between_orders
        FROM customer_orders curr
        INNER JOIN customer_orders prev
          ON curr.customer_email = prev.customer_email
          AND curr.order_number = prev.order_number + 1
        WHERE dateDiff('day', prev.order_date, curr.order_date) > 0
      )
      SELECT
        quantile(0.25)(days_between_orders) as q1,
        quantile(0.50)(days_between_orders) as median,
        quantile(0.75)(days_between_orders) as q3,
        quantile(0.95)(days_between_orders) as p95,
        COUNT(*) as total_intervals
      FROM reorder_intervals
    `;

    const percentilesResult = await clickhouse.query({ query: percentilesQuery });
    const percentilesJson = await percentilesResult.json();
    const percentilesData = percentilesJson.data || percentilesJson || [];

    if (!percentilesData || percentilesData.length === 0) {
      return NextResponse.json({
        status: 'insufficient_data',
        message: 'Not enough repeat customers to analyze reorder behavior'
      });
    }

    const percentiles = percentilesData[0];

    // Step 2: Calculate bucket percentages using the percentiles as constants
    const bucketsQuery = `
      WITH customer_orders AS (
        SELECT
          customer_email,
          toDate(order_timestamp) as order_date,
          row_number() OVER (PARTITION BY customer_email ORDER BY order_timestamp) as order_number
        FROM klaviyo_orders
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
          AND customer_email != ''
          AND customer_email NOT LIKE '%redacted%'
          AND customer_email NOT LIKE '%null%'
          AND customer_email NOT LIKE '%@anonymous.local%'
          AND customer_email LIKE '%@%.%'
      ),
      reorder_intervals AS (
        SELECT
          dateDiff('day', prev.order_date, curr.order_date) as days_between_orders
        FROM customer_orders curr
        INNER JOIN customer_orders prev
          ON curr.customer_email = prev.customer_email
          AND curr.order_number = prev.order_number + 1
        WHERE dateDiff('day', prev.order_date, curr.order_date) > 0
      )
      SELECT
        countIf(days_between_orders <= ${percentiles.q1}) / COUNT(*) * 100 as bucket1_pct,
        countIf(days_between_orders > ${percentiles.q1} AND days_between_orders <= ${percentiles.median}) / COUNT(*) * 100 as bucket2_pct,
        countIf(days_between_orders > ${percentiles.median} AND days_between_orders <= ${percentiles.q3}) / COUNT(*) * 100 as bucket3_pct,
        countIf(days_between_orders > ${percentiles.q3} AND days_between_orders <= ${percentiles.p95}) / COUNT(*) * 100 as bucket4_pct,
        countIf(days_between_orders > ${percentiles.p95}) / COUNT(*) * 100 as bucket5_pct
      FROM reorder_intervals
    `;

    const bucketsResult = await clickhouse.query({ query: bucketsQuery });
    const bucketsJson = await bucketsResult.json();
    const bucketsData = bucketsJson.data || bucketsJson || [];

    console.log('ClickHouse percentiles:', percentiles);
    console.log('ClickHouse buckets:', bucketsData[0]);

    // Combine percentiles and bucket percentages
    const stats = {
      ...percentiles,
      ...(bucketsData[0] || {})
    };

    // Step 2: Get overdue customers
    const overdueQuery = `
      WITH customer_last_order AS (
        SELECT
          customer_email,
          MAX(toDate(order_timestamp)) as last_order_date,
          COUNT(*) as total_orders
        FROM klaviyo_orders
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
          AND customer_email != ''
          AND customer_email NOT LIKE '%redacted%'
          AND customer_email NOT LIKE '%null%'
          AND customer_email NOT LIKE '%@anonymous.local%'
          AND customer_email LIKE '%@%.%'
        GROUP BY customer_email
        HAVING total_orders > 1
      )
      SELECT
        COUNT(*) as overdue_count,
        COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT customer_email) FROM customer_last_order) as overdue_percentage
      FROM customer_last_order
      WHERE dateDiff('day', last_order_date, today()) > ${Math.round(stats.median)}
      
    `;

    const overdueResult = await clickhouse.query({ query: overdueQuery });
    const overdueJsonResult = await overdueResult.json();
    const overdueData = overdueJsonResult.data || overdueJsonResult || [];

    // Step 3: Get list of overdue customers
    const overdueListQuery = `
      WITH customer_last_order AS (
        SELECT
          customer_email,
          MAX(toDate(order_timestamp)) as last_order_date,
          COUNT(*) as total_orders
        FROM klaviyo_orders
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
          AND customer_email != ''
          AND customer_email NOT LIKE '%redacted%'
          AND customer_email NOT LIKE '%null%'
          AND customer_email NOT LIKE '%@anonymous.local%'
          AND customer_email LIKE '%@%.%'
        GROUP BY customer_email
        HAVING total_orders > 1
      )
      SELECT
        customer_email,
        last_order_date,
        dateDiff('day', last_order_date, today()) as days_since_last_order,
        total_orders,
        dateDiff('day', last_order_date, today()) - ${Math.round(stats.median)} as days_overdue
      FROM customer_last_order
      WHERE dateDiff('day', last_order_date, today()) > ${Math.round(stats.median)}
      ORDER BY days_since_last_order DESC
      LIMIT 100
      
    `;

    const overdueListResult = await clickhouse.query({ query: overdueListQuery });
    const overdueListJsonResult = await overdueListResult.json();
    const overdueCustomers = overdueListJsonResult.data || overdueListJsonResult || [];

    return NextResponse.json({
      status: 'success',
      store: {
        name: store.name,
        public_id: store.public_id
      },
      summary: {
        median_reorder_days: Math.round(stats.median),
        total_intervals_analyzed: stats.total_intervals,
        recommended_followup_day: Math.round(stats.median * 0.9),
        business_type: stats.median <= 60 ? 'high_frequency' : 'low_frequency',
      },
      reorder_distribution: [
        {
          label: `0-${Math.round(stats.q1)} days (Fast)`,
          min_days: 0,
          max_days: Math.round(stats.q1),
          percentage: Math.round(stats.bucket1_pct * 10) / 10
        },
        {
          label: `${Math.round(stats.q1)+1}-${Math.round(stats.median)} days (Normal)`,
          min_days: Math.round(stats.q1)+1,
          max_days: Math.round(stats.median),
          percentage: Math.round(stats.bucket2_pct * 10) / 10
        },
        {
          label: `${Math.round(stats.median)+1}-${Math.round(stats.q3)} days (Slow)`,
          min_days: Math.round(stats.median)+1,
          max_days: Math.round(stats.q3),
          percentage: Math.round(stats.bucket3_pct * 10) / 10
        },
        {
          label: `${Math.round(stats.q3)+1}-${Math.round(stats.p95)} days (Very Slow)`,
          min_days: Math.round(stats.q3)+1,
          max_days: Math.round(stats.p95),
          percentage: Math.round(stats.bucket4_pct * 10) / 10
        },
        {
          label: `${Math.round(stats.p95)+1}+ days (Rare)`,
          min_days: Math.round(stats.p95)+1,
          max_days: 999999,
          percentage: Math.round(stats.bucket5_pct * 10) / 10
        },
      ],
      overdue_customers: {
        count: overdueData[0]?.overdue_count || 0,
        percentage: Math.round((overdueData[0]?.overdue_percentage || 0) * 10) / 10,
        customers: overdueCustomers.slice(0, 20), // Top 20
      },
      actionable_insights: [
        `📊 Your typical customer reorders every ${Math.round(stats.median)} days`,
        `⚠️ ${overdueData[0]?.overdue_count || 0} customers (${Math.round((overdueData[0]?.overdue_percentage || 0) * 10) / 10}%) are overdue for reorder`,
        `💡 Set up automated email at day ${Math.round(stats.median * 0.9)} to capture reorders`,
        `🎯 Focus on the ${Math.round(stats.bucket1_pct * 10) / 10}% who reorder within ${Math.round(stats.q1)} days - they're your best customers`,
      ],
      quartile_stats: {
        q1_25th_percentile: Math.round(stats.q1),
        median_50th_percentile: Math.round(stats.median),
        q3_75th_percentile: Math.round(stats.q3),
        p95_95th_percentile: Math.round(stats.p95),
      }
    });

  } catch (error) {
    console.error('Error fetching reorder behavior:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reorder behavior' },
      { status: 500 }
    );
  }
}

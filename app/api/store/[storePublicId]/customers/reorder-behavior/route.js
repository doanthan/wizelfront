import { NextResponse } from 'next/server';
import { createClient } from '@clickhouse/client';
import { validateStoreAccess } from '@/middleware/storeAccess';

export async function GET(request, { params }) {
  try {
    const { storePublicId } = await params;

    // Validate store access (replaces separate /api/store call + store lookup)
    const { hasAccess, store, user, error } = await validateStoreAccess(storePublicId);

    if (!hasAccess) {
      return NextResponse.json({ error: error || 'Access denied' }, { status: 403 });
    }

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

    // Step 2: Get customer breakdown (one-time vs repeat)
    // IMPORTANT: Must use klaviyo_orders (same as overdue query) for data consistency
    const customerBreakdownQuery = `
      WITH customer_order_counts AS (
        SELECT
          customer_email,
          COUNT(*) as total_orders
        FROM klaviyo_orders
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
          AND customer_email != ''
          AND customer_email NOT LIKE '%redacted%'
          AND customer_email NOT LIKE '%null%'
          AND customer_email NOT LIKE '%@anonymous.local%'
          AND customer_email LIKE '%@%.%'
        GROUP BY customer_email
      )
      SELECT
        COUNT(*) as total_customers,
        countIf(total_orders = 1) as one_time_customers,
        countIf(total_orders > 1) as repeat_customers,
        countIf(total_orders = 1) * 100.0 / COUNT(*) as one_time_percentage,
        countIf(total_orders > 1) * 100.0 / COUNT(*) as repeat_percentage
      FROM customer_order_counts
    `;

    const breakdownResult = await clickhouse.query({ query: customerBreakdownQuery });
    const breakdownJson = await breakdownResult.json();
    const breakdownData = (breakdownJson.data || breakdownJson || [])[0] || {};

    // Step 3: Get high-value win-back opportunities
    // Use a more aggressive threshold (1.5x median) to identify truly at-risk customers
    // This focuses on customers who are significantly overdue, not just past the median
    const winbackThreshold = Math.round(stats.median * 1.5);

    const overdueQuery = `
      WITH customer_orders_agg AS (
        SELECT
          customer_email,
          MAX(toDate(order_timestamp)) as last_order_date,
          COUNT(*) as total_orders,
          MIN(toDate(order_timestamp)) as first_order_date
        FROM klaviyo_orders
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
          AND customer_email != ''
          AND customer_email NOT LIKE '%redacted%'
          AND customer_email NOT LIKE '%null%'
          AND customer_email NOT LIKE '%@anonymous.local%'
          AND customer_email LIKE '%@%.%'
        GROUP BY customer_email
        HAVING total_orders > 1
      ),
      repeat_customer_base AS (
        SELECT COUNT(*) as total_repeat_customers
        FROM customer_orders_agg
      )
      SELECT
        COUNT(*) as overdue_count,
        (SELECT total_repeat_customers FROM repeat_customer_base) as total_repeat_customers,
        COUNT(*) * 100.0 / (SELECT total_repeat_customers FROM repeat_customer_base) as overdue_percentage
      FROM customer_orders_agg
      WHERE dateDiff('day', last_order_date, today()) > ${winbackThreshold}
        AND dateDiff('day', last_order_date, today()) <= ${winbackThreshold * 3}

    `;

    const overdueResult = await clickhouse.query({ query: overdueQuery });
    const overdueJsonResult = await overdueResult.json();
    const overdueData = overdueJsonResult.data || overdueJsonResult || [];

    console.log('Overdue customers data:', overdueData[0]);
    console.log('Customer breakdown:', breakdownData);

    // Step 4: Get product repurchase recommendations
    const productRepurchaseQuery = `
      SELECT
        product_id,
        product_name,
        median_repurchase_days,
        total_repurchases,
        repeat_customers,
        recommended_reminder_day,
        product_type
      FROM product_repurchase_stats
      WHERE klaviyo_public_id = '${klaviyoPublicId}'
        AND total_repurchases >= 5
      ORDER BY total_repurchases DESC
      LIMIT 10
    `;

    const productRepurchaseResult = await clickhouse.query({ query: productRepurchaseQuery });
    const productRepurchaseJsonResult = await productRepurchaseResult.json();
    const productRepurchaseData = productRepurchaseJsonResult.data || productRepurchaseJsonResult || [];

    return NextResponse.json({
      status: 'success',
      store: {
        name: store.name,
        public_id: store.public_id
      },
      customer_breakdown: {
        total_customers: parseInt(breakdownData.total_customers) || 0,
        one_time_customers: parseInt(breakdownData.one_time_customers) || 0,
        repeat_customers: parseInt(breakdownData.repeat_customers) || 0,
        one_time_percentage: Math.round((parseFloat(breakdownData.one_time_percentage) || 0) * 10) / 10,
        repeat_percentage: Math.round((parseFloat(breakdownData.repeat_percentage) || 0) * 10) / 10,
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
      },
      product_repurchase_recommendations: productRepurchaseData.map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        median_repurchase_days: p.median_repurchase_days,
        total_repurchases: p.total_repurchases,
        repeat_customers: p.repeat_customers,
        recommended_reminder_day: p.recommended_reminder_day,
        product_type: p.product_type || 'Unknown'
      })),
      actionable_insights: [
        `📊 Repeat customers reorder every ${Math.round(stats.median)} days on average - use this for campaign timing`,
        `⚠️ ${Math.round(breakdownData.one_time_percentage || 0)}% of customers only buy once - significant retention opportunity`,
        `🔄 ${overdueData[0]?.overdue_count || 0} high-value customers (${Math.round((overdueData[0]?.overdue_percentage || 0) * 10) / 10}%) are ${winbackThreshold}+ days past last order - priority win-back targets`,
        `💡 Optimal win-back timing: Day ${Math.round(stats.median * 0.9)} (proactive) and Day ${winbackThreshold} (reactive)`,
        `🎯 Fast reorderers (within ${Math.round(stats.q1)} days) represent ${Math.round(stats.bucket1_pct * 10) / 10}% of repeat purchases - your VIP segment`,
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

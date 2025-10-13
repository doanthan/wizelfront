/**
 * Combined Page Data API
 * Returns all data needed for a store page in ONE API call
 * Eliminates multiple sequential API calls from the frontend
 *
 * Example usage:
 * GET /api/store/r37cMpq/page-data?include=brand,reorder,analytics
 *
 * Returns: { brand: {...}, reorder_behavior: {...}, analytics: {...} }
 */

import { NextResponse } from 'next/server';
import { validateStoreAccess } from '@/middleware/storeAccess';
import { createClient } from '@clickhouse/client';
import Brand from '@/models/Brand';

export async function GET(request, { params }) {
  try {
    const { storePublicId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse what data to include (comma-separated)
    const includeParam = searchParams.get('include') || '';
    const includes = includeParam.split(',').map(i => i.trim()).filter(Boolean);

    // Validate store access ONCE
    const { hasAccess, store, user, error } = await validateStoreAccess(storePublicId);

    if (!hasAccess) {
      return NextResponse.json({ error: error || 'Access denied' }, { status: 403 });
    }

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const response = {
      store: {
        public_id: store.public_id,
        name: store.name,
        has_klaviyo: !!store.klaviyo_integration?.public_id
      }
    };

    // Fetch all requested data in parallel
    const promises = [];

    // Brand data
    if (includes.includes('brand')) {
      promises.push(
        Brand.findOne({
          store_public_id: storePublicId,
          isActive: true
        })
          .then(brand => ({ brand }))
          .catch(err => ({ brand_error: err.message }))
      );
    }

    // Reorder behavior (if needed for customer insights page)
    if (includes.includes('reorder') && store.klaviyo_integration?.public_id) {
      promises.push(
        fetchReorderBehavior(store.klaviyo_integration.public_id)
          .then(reorder => ({ reorder_behavior: reorder }))
          .catch(err => ({ reorder_error: err.message }))
      );
    }

    // Analytics summary (if needed for dashboard)
    if (includes.includes('analytics') && store.klaviyo_integration?.public_id) {
      promises.push(
        fetchAnalyticsSummary(store.klaviyo_integration.public_id)
          .then(analytics => ({ analytics }))
          .catch(err => ({ analytics_error: err.message }))
      );
    }

    // Wait for all data fetches
    const results = await Promise.allSettled(promises);

    // Merge all results into response
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        Object.assign(response, result.value);
      }
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Combined page data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page data' },
      { status: 500 }
    );
  }
}

/**
 * Fetch reorder behavior data (extracted from existing API)
 */
async function fetchReorderBehavior(klaviyoPublicId) {
  const clickhouse = createClient({
    url: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || '8443'}`,
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD,
  });

  // Get customer breakdown
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

  const result = await clickhouse.query({ query: customerBreakdownQuery });
  const json = await result.json();
  const data = (json.data || json || [])[0] || {};

  return {
    total_customers: parseInt(data.total_customers) || 0,
    one_time_customers: parseInt(data.one_time_customers) || 0,
    repeat_customers: parseInt(data.repeat_customers) || 0,
    one_time_percentage: Math.round((parseFloat(data.one_time_percentage) || 0) * 10) / 10,
    repeat_percentage: Math.round((parseFloat(data.repeat_percentage) || 0) * 10) / 10,
  };
}

/**
 * Fetch analytics summary (example - customize based on your needs)
 */
async function fetchAnalyticsSummary(klaviyoPublicId) {
  const clickhouse = createClient({
    url: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || '8443'}`,
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD,
  });

  const query = `
    SELECT
      COUNT(DISTINCT customer_email) as total_customers,
      COUNT(*) as total_orders,
      SUM(order_value) as total_revenue,
      AVG(order_value) as avg_order_value
    FROM klaviyo_orders
    WHERE klaviyo_public_id = '${klaviyoPublicId}'
      AND order_timestamp >= now() - INTERVAL 30 DAY
      AND customer_email != ''
      AND customer_email NOT LIKE '%redacted%'
      AND customer_email LIKE '%@%.%'
  `;

  const result = await clickhouse.query({ query });
  const json = await result.json();
  const data = (json.data || json || [])[0] || {};

  return {
    period: 'last_30_days',
    total_customers: parseInt(data.total_customers) || 0,
    total_orders: parseInt(data.total_orders) || 0,
    total_revenue: parseFloat(data.total_revenue) || 0,
    avg_order_value: parseFloat(data.avg_order_value) || 0,
  };
}

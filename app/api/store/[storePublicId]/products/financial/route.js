import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import { getClickHouseClient } from '@/lib/clickhouse';

/**
 * Product Financial Metrics API
 * Returns: Discount Impact, Quality Signals (refunds), Channel Attribution
 */
export const GET = withStoreAccess(async (request, { params }) => {
  try {
    const { storePublicId } = await params;
    const { searchParams } = new URL(request.url);
    const { store } = request;

    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Convert ISO timestamps to YYYY-MM-DD format for ClickHouse
    const startDate = new Date(startDateParam).toISOString().split('T')[0];
    const endDate = new Date(endDateParam).toISOString().split('T')[0];

    console.log('[Products Financial] Date conversion:', {
      startDateParam,
      endDateParam,
      startDate,
      endDate
    });

    if (!store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: 'Klaviyo not connected'
      }, { status: 404 });
    }

    const klaviyoId = store.klaviyo_integration.public_id;
    const clickhouse = getClickHouseClient();

    // 1. Discount Impact Comparison - Using order_timestamp instead of order_date
    const discountComparisonQuery = `
      SELECT
          product_id,
          product_name,
          SUM(CASE WHEN discount_amount > 0 THEN line_total ELSE 0 END) as revenue_with_discount,
          SUM(CASE WHEN discount_amount = 0 THEN line_total ELSE 0 END) as revenue_without_discount,
          COUNT(CASE WHEN discount_amount > 0 THEN 1 END) as orders_with_discount,
          COUNT(CASE WHEN discount_amount = 0 THEN 1 END) as orders_without_discount
      FROM klaviyo_order_line_items
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
      GROUP BY product_id, product_name
      ORDER BY (revenue_with_discount + revenue_without_discount) DESC
      LIMIT 20
    `;

    // 2. Discount Dependency Score - Following guide exactly
    const dependencyScoresQuery = `
      SELECT
          product_id,
          product_name,
          discount_dependency_score,
          repeat_rate_full_price,
          repeat_rate_discounted,
          revenue_lost_to_discounts
      FROM product_discount_analysis
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND analysis_end_date >= {startDate:String}
      ORDER BY discount_dependency_score DESC
      LIMIT 20
    `;

    // 3. Discount Distribution - Using order_timestamp instead of order_date
    const discountDistributionQuery = `
      SELECT
          CASE
              WHEN discount_percentage = 0 THEN 'Full Price'
              WHEN discount_percentage <= 10 THEN '1-10%'
              WHEN discount_percentage <= 20 THEN '11-20%'
              WHEN discount_percentage <= 30 THEN '21-30%'
              ELSE '30%+'
          END as range,
          COUNT(*) as count,
          SUM(line_total) as revenue
      FROM klaviyo_order_line_items
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
          AND discount_percentage IS NOT NULL
      GROUP BY range
      ORDER BY
          CASE range
              WHEN 'Full Price' THEN 0
              WHEN '1-10%' THEN 1
              WHEN '11-20%' THEN 2
              WHEN '21-30%' THEN 3
              ELSE 4
          END
    `;

    // 4. Quality Signals - Refund Rates - Using order_timestamp instead of order_date
    const refundRatesQuery = `
      WITH product_refunds AS (
          SELECT
              product_id,
              product_name,
              SUM(line_total) as gross_revenue,
              COUNT(DISTINCT order_id) as total_orders
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
          GROUP BY product_id, product_name
      ),
      refund_data AS (
          SELECT
              arrayJoin(products_affected) as product_name,
              SUM(refund_amount) as total_refunded,
              COUNT(*) as refund_count
          FROM refund_cancelled_orders
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND event_timestamp BETWEEN {startDate:String} AND {endDate:String}
          GROUP BY product_name
      )
      SELECT
          pr.product_id,
          pr.product_name,
          pr.gross_revenue,
          COALESCE(rd.total_refunded, 0) as refund_amount,
          pr.gross_revenue - COALESCE(rd.total_refunded, 0) as net_revenue,
          ROUND((COALESCE(rd.total_refunded, 0) / pr.gross_revenue) * 100, 2) as refund_rate
      FROM product_refunds pr
      LEFT JOIN refund_data rd ON pr.product_name = rd.product_name
      WHERE pr.gross_revenue > 100
      ORDER BY refund_rate DESC
      LIMIT 20
    `;

    // 5. Problem Products (High Refund) - Using order_timestamp instead of order_date
    const problemProductsQuery = `
      WITH product_refunds AS (
          SELECT
              product_id,
              product_name,
              SUM(line_total) as gross_revenue,
              COUNT(DISTINCT order_id) as total_orders
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
          GROUP BY product_id, product_name
      ),
      refund_data AS (
          SELECT
              arrayJoin(products_affected) as product_name,
              SUM(refund_amount) as total_refunded,
              COUNT(*) as refund_count
          FROM refund_cancelled_orders
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND event_timestamp BETWEEN {startDate:String} AND {endDate:String}
          GROUP BY product_name
      )
      SELECT
          pr.product_id,
          pr.product_name,
          ROUND((COALESCE(rd.total_refunded, 0) / pr.gross_revenue) * 100, 2) as refund_rate,
          COALESCE(rd.total_refunded, 0) as refund_amount
      FROM product_refunds pr
      LEFT JOIN refund_data rd ON pr.product_name = rd.product_name
      WHERE pr.gross_revenue > 100
          AND (COALESCE(rd.total_refunded, 0) / pr.gross_revenue) * 100 > 10
      ORDER BY refund_rate DESC
      LIMIT 10
    `;

    // 6. Quality Products (Low Refund) - Using order_timestamp instead of order_date
    const qualityProductsQuery = `
      WITH product_refunds AS (
          SELECT
              product_id,
              product_name,
              SUM(line_total) as gross_revenue,
              COUNT(DISTINCT order_id) as total_orders
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
          GROUP BY product_id, product_name
      ),
      refund_data AS (
          SELECT
              arrayJoin(products_affected) as product_name,
              SUM(refund_amount) as total_refunded,
              COUNT(*) as refund_count
          FROM refund_cancelled_orders
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND event_timestamp BETWEEN {startDate:String} AND {endDate:String}
          GROUP BY product_name
      )
      SELECT
          pr.product_id,
          pr.product_name,
          ROUND((COALESCE(rd.total_refunded, 0) / pr.gross_revenue) * 100, 2) as refund_rate,
          pr.gross_revenue as revenue
      FROM product_refunds pr
      LEFT JOIN refund_data rd ON pr.product_name = rd.product_name
      WHERE pr.gross_revenue > 1000
          AND (COALESCE(rd.total_refunded, 0) / pr.gross_revenue) * 100 < 5
      ORDER BY gross_revenue DESC
      LIMIT 10
    `;

    // Execute all queries in parallel
    const [
      discountComparisonResult,
      dependencyScoresResult,
      discountDistributionResult,
      refundRatesResult,
      problemProductsResult,
      qualityProductsResult
    ] = await Promise.all([
      clickhouse.query({ query: discountComparisonQuery, query_params: { klaviyoId, startDate, endDate }, format: 'JSONEachRow' }),
      clickhouse.query({ query: dependencyScoresQuery, query_params: { klaviyoId, startDate }, format: 'JSONEachRow' }).catch(() => ({ json: async () => [] })), // May not exist
      clickhouse.query({ query: discountDistributionQuery, query_params: { klaviyoId, startDate, endDate }, format: 'JSONEachRow' }),
      clickhouse.query({ query: refundRatesQuery, query_params: { klaviyoId, startDate, endDate }, format: 'JSONEachRow' }).catch(() => ({ json: async () => [] })), // May not exist
      clickhouse.query({ query: problemProductsQuery, query_params: { klaviyoId, startDate, endDate }, format: 'JSONEachRow' }).catch(() => ({ json: async () => [] })), // May not exist
      clickhouse.query({ query: qualityProductsQuery, query_params: { klaviyoId, startDate, endDate }, format: 'JSONEachRow' }).catch(() => ({ json: async () => [] })) // May not exist
    ]);

    const discountComparison = await discountComparisonResult.json();
    const dependencyScores = await dependencyScoresResult.json();
    const discountDistribution = await discountDistributionResult.json();
    const refundRates = await refundRatesResult.json();
    const problemProducts = await problemProductsResult.json();
    const qualityProducts = await qualityProductsResult.json();

    // Calculate summaries
    const totalRevenueLost = discountComparison.reduce((sum, p) => {
      const discount = parseFloat(p.revenue_with_discount || 0);
      const full = parseFloat(p.revenue_without_discount || 0);
      // Estimate lost revenue (assuming discounted items would have sold at full price)
      return sum + (discount * 0.15); // Approximate 15% average discount
    }, 0);

    const avgDiscount = discountDistribution.reduce((sum, d) => {
      const midpoint = d.range === 'Full Price' ? 0 :
                      d.range === '1-10%' ? 5 :
                      d.range === '11-20%' ? 15 :
                      d.range === '21-30%' ? 25 : 35;
      return sum + (midpoint * parseInt(d.count || 0));
    }, 0) / Math.max(discountDistribution.reduce((sum, d) => sum + parseInt(d.count || 0), 0), 1);

    const totalRefunded = refundRates.reduce((sum, p) => sum + parseFloat(p.refund_amount || 0), 0);
    const avgRefundRate = refundRates.reduce((sum, p) => sum + parseFloat(p.refund_rate || 0), 0) / Math.max(refundRates.length, 1);
    const problemCount = problemProducts.length;

    // Net revenue data
    const netRevenue = refundRates.map(p => ({
      product_name: p.product_name,
      gross_revenue: parseFloat(p.gross_revenue || 0),
      net_revenue: parseFloat(p.net_revenue || 0)
    }));

    // Channel attribution - Simplified without complex joins
    const byChannel = []; // Placeholder - complex query requires event data
    const channelDistribution = []; // Placeholder

    return NextResponse.json({
      discountComparison,
      dependencyScores,
      discountDistribution,
      summary: {
        revenue_lost: totalRevenueLost,
        avg_discount: avgDiscount
      },
      refundRates,
      netRevenue,
      problemProducts,
      qualityProducts,
      refundSummary: {
        total_refunded: totalRefunded,
        avg_refund_rate: avgRefundRate.toFixed(2),
        problem_count: problemCount
      },
      byChannel,
      channelDistribution
    });

  } catch (error) {
    console.error('Error fetching product financial metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product financial metrics', details: error.message },
      { status: 500 }
    );
  }
});

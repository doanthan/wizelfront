import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { storePublicId } = await params;
    const { searchParams } = new URL(request.url);

    // Get date range from query params
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const comparisonStartParam = searchParams.get('comparison_start');
    const comparisonEndParam = searchParams.get('comparison_end');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Convert ISO timestamps to YYYY-MM-DD format for ClickHouse
    const startDate = new Date(startDateParam).toISOString().split('T')[0];
    const endDate = new Date(endDateParam).toISOString().split('T')[0];

    // Comparison period (optional)
    const comparisonStart = comparisonStartParam ? new Date(comparisonStartParam).toISOString().split('T')[0] : null;
    const comparisonEnd = comparisonEndParam ? new Date(comparisonEndParam).toISOString().split('T')[0] : null;

    console.log('📊 [Products Analytics] Request received:', {
      storePublicId,
      startDateParam,
      endDateParam,
      startDate,
      endDate,
      timestamp: new Date().toISOString()
    });

    // Get store with Klaviyo integration
    const store = await Store.findOne({ public_id: storePublicId })
      .select('public_id name klaviyo_integration.public_id')
      .lean();

    if (!store || !store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: 'Store not found or Klaviyo not connected'
      }, { status: 404 });
    }

    const klaviyoId = store.klaviyo_integration.public_id;
    const clickhouse = getClickHouseClient();

    // 1. Top Products Performance - Current Period
    const topProductsQuery = `
      SELECT
          product_id,
          product_name,
          product_brand,
          product_categories,
          SUM(line_total) as total_revenue,
          SUM(quantity) as total_quantity,
          COUNT(DISTINCT customer_email) as unique_customers,
          COUNT(DISTINCT order_id) as total_orders,
          AVG(unit_price) as avg_price,
          MIN(unit_price) as min_price,
          MAX(unit_price) as max_price
      FROM klaviyo_order_line_items
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
      GROUP BY product_id, product_name, product_brand, product_categories
      ORDER BY total_revenue DESC
      LIMIT {limit:UInt32}
    `;

    // 1b. Top Products Performance - Comparison Period (if provided)
    const topProductsComparisonQuery = comparisonStart && comparisonEnd ? `
      SELECT
          product_id,
          product_name,
          SUM(line_total) as comparison_revenue,
          SUM(quantity) as comparison_quantity
      FROM klaviyo_order_line_items
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND toDate(order_timestamp) BETWEEN {comparisonStart:String} AND {comparisonEnd:String}
      GROUP BY product_id, product_name
    ` : null;

    // 2. Revenue Trend (Daily) - Using order_timestamp instead of order_date
    const revenueTrendQuery = `
      SELECT
          toDate(order_timestamp) as date,
          SUM(line_total) as revenue,
          SUM(quantity) as units_sold,
          COUNT(DISTINCT product_id) as unique_products
      FROM klaviyo_order_line_items
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
      GROUP BY date
      ORDER BY date
    `;

    // 3. New Products (first sold in last 90 days) - Using order_timestamp
    const newProductsQuery = `
      SELECT
          product_id,
          product_name,
          first_sold_date,
          SUM(line_total) as revenue,
          dateDiff('day', first_sold_date, today()) as days_live
      FROM (
          SELECT
              product_id,
              product_name,
              MIN(toDate(order_timestamp)) as first_sold_date,
              SUM(line_total) as line_total
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
          GROUP BY product_id, product_name
      ) as product_first_sales
      WHERE first_sold_date >= today() - INTERVAL 90 DAY
      GROUP BY product_id, product_name, first_sold_date
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // 4. Declining Products - Bottom 20 products by revenue change (absolute decline)
    const decliningProductsQuery = comparisonStart && comparisonEnd ? `
      WITH period_sales AS (
          SELECT
              product_id,
              product_name,
              SUM(CASE WHEN toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String} THEN line_total ELSE 0 END) as recent_revenue,
              SUM(CASE WHEN toDate(order_timestamp) BETWEEN {comparisonStart:String} AND {comparisonEnd:String} THEN line_total ELSE 0 END) as previous_revenue
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND (
                  toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
                  OR toDate(order_timestamp) BETWEEN {comparisonStart:String} AND {comparisonEnd:String}
              )
          GROUP BY product_id, product_name
      )
      SELECT
          product_id,
          product_name,
          recent_revenue,
          previous_revenue,
          (recent_revenue - previous_revenue) as revenue_change,
          ROUND(((recent_revenue - previous_revenue) / previous_revenue) * 100, 2) as decline_rate
      FROM period_sales
      WHERE previous_revenue > 100
          AND recent_revenue < previous_revenue
      ORDER BY revenue_change ASC
      LIMIT 20
    ` : `
      WITH recent_sales AS (
          SELECT
              product_id,
              product_name,
              SUM(CASE WHEN toDate(order_timestamp) >= today() - INTERVAL 30 DAY THEN line_total ELSE 0 END) as recent_revenue,
              SUM(CASE WHEN toDate(order_timestamp) BETWEEN today() - INTERVAL 60 DAY AND today() - INTERVAL 30 DAY THEN line_total ELSE 0 END) as previous_revenue
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND toDate(order_timestamp) >= today() - INTERVAL 60 DAY
          GROUP BY product_id, product_name
      )
      SELECT
          product_id,
          product_name,
          recent_revenue,
          previous_revenue,
          (recent_revenue - previous_revenue) as revenue_change,
          ROUND(((recent_revenue - previous_revenue) / previous_revenue) * 100, 2) as decline_rate
      FROM recent_sales
      WHERE previous_revenue > 100
          AND recent_revenue < previous_revenue
      ORDER BY revenue_change ASC
      LIMIT 20
    `;

    // 5. Growth Trends - Using order_timestamp
    const growthTrendsQuery = `
      WITH monthly_sales AS (
          SELECT
              product_id,
              product_name,
              toStartOfMonth(order_timestamp) as month,
              SUM(line_total) as revenue
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND toDate(order_timestamp) >= today() - INTERVAL 180 DAY
          GROUP BY product_id, product_name, toStartOfMonth(order_timestamp)
      ),
      growth_calc AS (
          SELECT
              product_id,
              product_name,
              revenue,
              lagInFrame(revenue, 1) OVER (PARTITION BY product_id ORDER BY month) as prev_month_revenue
          FROM monthly_sales
      )
      SELECT
          product_id,
          product_name,
          AVG(revenue) as avg_monthly_revenue,
          AVG(CASE WHEN prev_month_revenue > 0 THEN ((revenue - prev_month_revenue) / prev_month_revenue) * 100 ELSE 0 END) as avg_growth_rate
      FROM growth_calc
      GROUP BY product_id, product_name
      HAVING avg_monthly_revenue > 100
      ORDER BY avg_growth_rate DESC
      LIMIT 20
    `;

    // 6. Inventory Velocity - Using order_timestamp
    const velocityQuery = `
      SELECT
          product_id,
          product_name,
          SUM(quantity) as total_units_sold,
          COUNT(DISTINCT toDate(order_timestamp)) as days_with_sales,
          ROUND(SUM(quantity)::Float64 / COUNT(DISTINCT toDate(order_timestamp)), 2) as units_per_day,
          SUM(line_total) / COUNT(DISTINCT toDate(order_timestamp)) as revenue_per_day
      FROM klaviyo_order_line_items
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
      GROUP BY product_id, product_name
      ORDER BY units_per_day DESC
      LIMIT 20
    `;

    // 7. Revenue Efficiency - Using order_timestamp
    const efficiencyQuery = `
      WITH product_totals AS (
          SELECT SUM(line_total) as total_revenue
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND toDate(order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
      )
      SELECT
          p.product_id,
          p.product_name,
          SUM(p.line_total) as revenue,
          ROUND((SUM(p.line_total) / pt.total_revenue) * 100, 2) as revenue_share_pct,
          AVG(p.unit_price) as avg_price,
          SUM(CASE WHEN p.discount_amount = 0 THEN p.line_total ELSE 0 END) as full_price_revenue,
          SUM(CASE WHEN p.discount_amount > 0 THEN p.line_total ELSE 0 END) as discounted_revenue
      FROM klaviyo_order_line_items p
      CROSS JOIN product_totals pt
      WHERE p.klaviyo_public_id = {klaviyoId:String}
          AND toDate(p.order_timestamp) BETWEEN {startDate:String} AND {endDate:String}
      GROUP BY p.product_id, p.product_name, pt.total_revenue
      ORDER BY revenue DESC
      LIMIT 20
    `;

    // Build queries array
    const queries = [
      clickhouse.query({
        query: topProductsQuery,
        query_params: { klaviyoId, startDate, endDate, limit },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: revenueTrendQuery,
        query_params: { klaviyoId, startDate, endDate },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: newProductsQuery,
        query_params: { klaviyoId },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: decliningProductsQuery,
        query_params: comparisonStart && comparisonEnd
          ? { klaviyoId, startDate, endDate, comparisonStart, comparisonEnd }
          : { klaviyoId },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: growthTrendsQuery,
        query_params: { klaviyoId },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: velocityQuery,
        query_params: { klaviyoId, startDate, endDate },
        format: 'JSONEachRow'
      }),
      clickhouse.query({
        query: efficiencyQuery,
        query_params: { klaviyoId, startDate, endDate },
        format: 'JSONEachRow'
      })
    ];

    // Add comparison query if dates provided
    if (topProductsComparisonQuery) {
      queries.push(
        clickhouse.query({
          query: topProductsComparisonQuery,
          query_params: { klaviyoId, comparisonStart, comparisonEnd },
          format: 'JSONEachRow'
        })
      );
    }

    // Execute all queries in parallel
    const results = await Promise.all(queries);

    const [
      topProductsResult,
      revenueTrendResult,
      newProductsResult,
      decliningProductsResult,
      growthTrendsResult,
      velocityResult,
      efficiencyResult,
      topProductsComparisonResult
    ] = results;

    const topProducts = await topProductsResult.json();
    const revenueTrend = await revenueTrendResult.json();
    const newProducts = await newProductsResult.json();
    const decliningProducts = await decliningProductsResult.json();
    const growthTrends = await growthTrendsResult.json();
    const velocity = await velocityResult.json();
    const efficiency = await efficiencyResult.json();
    const topProductsComparison = topProductsComparisonResult ? await topProductsComparisonResult.json() : [];

    console.log('📊 [Products Analytics] Query results:', {
      topProductsCount: topProducts.length,
      revenueTrendCount: revenueTrend.length,
      comparisonCount: topProductsComparison.length,
      decliningProductsCount: decliningProducts.length,
      dateRange: { startDate, endDate },
      comparisonRange: comparisonStart ? { comparisonStart, comparisonEnd } : null,
      firstProduct: topProducts[0],
      revenueTrendSample: revenueTrend.slice(0, 3),
      decliningProductsSample: decliningProducts.slice(0, 3)
    });

    // Merge comparison data with top products
    if (topProductsComparison.length > 0) {
      const comparisonMap = new Map(
        topProductsComparison.map(p => [p.product_id, p])
      );

      topProducts.forEach(product => {
        const comparison = comparisonMap.get(product.product_id);
        if (comparison) {
          product.comparison_revenue = parseFloat(comparison.comparison_revenue || 0);
          product.comparison_quantity = parseInt(comparison.comparison_quantity || 0);

          // Calculate percentage changes
          const currentRevenue = parseFloat(product.total_revenue || 0);
          const prevRevenue = product.comparison_revenue;
          product.revenue_change = prevRevenue > 0
            ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
            : 0;

          const currentQty = parseInt(product.total_quantity || 0);
          const prevQty = product.comparison_quantity;
          product.quantity_change = prevQty > 0
            ? ((currentQty - prevQty) / prevQty) * 100
            : 0;
        }
      });
    }

    // Calculate summary metrics
    const totalRevenue = topProducts.reduce((sum, p) => sum + parseFloat(p.total_revenue || 0), 0);
    const totalUnits = topProducts.reduce((sum, p) => sum + parseInt(p.total_quantity || 0), 0);
    const avgAOV = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    // Calculate comparison summary metrics
    const comparisonTotalRevenue = topProductsComparison.reduce((sum, p) => sum + parseFloat(p.comparison_revenue || 0), 0);
    const comparisonTotalUnits = topProductsComparison.reduce((sum, p) => sum + parseInt(p.comparison_quantity || 0), 0);
    const comparisonAvgAOV = comparisonTotalUnits > 0 ? comparisonTotalRevenue / comparisonTotalUnits : 0;

    // Calculate percentage changes for summary
    const revenueChange = comparisonTotalRevenue > 0
      ? ((totalRevenue - comparisonTotalRevenue) / comparisonTotalRevenue) * 100
      : 0;
    const unitsChange = comparisonTotalUnits > 0
      ? ((totalUnits - comparisonTotalUnits) / comparisonTotalUnits) * 100
      : 0;
    const aovChange = comparisonAvgAOV > 0
      ? ((avgAOV - comparisonAvgAOV) / comparisonAvgAOV) * 100
      : 0;

    // Sort velocity for fast/slow movers
    const fastMovers = velocity.slice(0, 10).map(p => ({
      name: p.product_name,
      velocity: parseFloat(p.units_per_day || 0)
    }));
    const slowMovers = velocity.slice(-10).reverse().map(p => ({
      name: p.product_name,
      velocity: parseFloat(p.units_per_day || 0)
    }));

    // Calculate summary for efficiency
    const totalRevenueForEfficiency = efficiency.reduce((sum, p) => sum + parseFloat(p.revenue || 0), 0);
    const top20Pct = efficiency.slice(0, Math.ceil(efficiency.length * 0.2));
    const top20Revenue = top20Pct.reduce((sum, p) => sum + parseFloat(p.revenue || 0), 0);
    const fullPriceRevenue = efficiency.reduce((sum, p) => sum + parseFloat(p.full_price_revenue || 0), 0);

    return NextResponse.json({
      topProducts,
      revenueTrend,
      summary: {
        total_revenue: totalRevenue,
        units_sold: totalUnits,
        avg_aov: avgAOV
      },
      growthTrends,
      newProducts,
      decliningProducts,
      velocityMetrics: velocity,
      fastMovers,
      slowMovers,
      velocityTrend: revenueTrend.slice(-30), // Last 30 days for trend
      revenueContribution: efficiency,
      pricePoints: efficiency.map(p => ({
        product_name: p.product_name,
        avg_price: parseFloat(p.avg_price || 0)
      })),
      summary: {
        total_revenue: totalRevenue,
        units_sold: totalUnits,
        avg_aov: avgAOV,
        top_20_pct_share: totalRevenueForEfficiency > 0 ? ((top20Revenue / totalRevenueForEfficiency) * 100).toFixed(1) : 0,
        high_price_count: efficiency.filter(p => parseFloat(p.avg_price || 0) > 100).length,
        full_price_pct: totalRevenueForEfficiency > 0 ? ((fullPriceRevenue / totalRevenueForEfficiency) * 100).toFixed(1) : 0,
        // Comparison data
        revenue_change: revenueChange,
        units_change: unitsChange,
        aov_change: aovChange,
        comparison_revenue: comparisonTotalRevenue,
        comparison_units: comparisonTotalUnits,
        comparison_aov: comparisonAvgAOV
      }
    });

  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics', details: error.message },
      { status: 500 }
    );
  }
}

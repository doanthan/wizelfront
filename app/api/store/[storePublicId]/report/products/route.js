import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import { getClickHouseClient } from '@/lib/clickhouse';

export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check analytics permissions
    if (!role?.permissions?.analytics?.view_all && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view analytics' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Get date range from query params (default to last 30 days)
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const defaultEnd = now;

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate'))
      : defaultStart;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate'))
      : defaultEnd;

    // Get previous period dates for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = searchParams.get('previousStartDate')
      ? new Date(searchParams.get('previousStartDate'))
      : new Date(startDate.getTime() - periodLength);
    const previousEndDate = searchParams.get('previousEndDate')
      ? new Date(searchParams.get('previousEndDate'))
      : startDate;

    // Use store directly - it's already fetched by middleware
    const klaviyoPublicId = store.klaviyo_integration?.public_id;
    if (!klaviyoPublicId) {
      return NextResponse.json({ error: 'Klaviyo not connected' }, { status: 404 });
    }

    // Get ClickHouse client (uses connection pooling)
    const clickhouse = getClickHouseClient();

    console.log('[Products Report] ClickHouse Debug:', {
      storePublicId: store.public_id,
      klaviyoPublicId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    // Query 1: Top Products Table
    const topProductsQuery = `
      WITH
      -- Get product metrics from products_master (ReplacingMergeTree)
      product_metrics AS (
          SELECT
              product_id,
              argMax(product_name, last_updated) as product_name,
              argMax(sku, last_updated) as sku,
              argMax(product_brand, last_updated) as product_brand,
              argMax(product_categories, last_updated) as product_categories,
              argMax(total_revenue, last_updated) as total_revenue,
              argMax(total_orders, last_updated) as total_orders,
              argMax(unique_customers, last_updated) as unique_customers,
              argMax(total_quantity, last_updated) as total_quantity,
              argMax(avg_price, last_updated) as avg_price,
              argMax(first_sold_date, last_updated) as first_sold_date,
              argMax(last_sold_date, last_updated) as last_sold_date
          FROM products_master
          WHERE klaviyo_public_id = {klaviyoId:String}
          GROUP BY product_id
      ),

      -- Calculate revenue and units for selected date range from line items
      recent_performance AS (
          SELECT
              li.product_id,
              sum(li.line_total - li.discount_amount) as revenue_30d,
              sum(li.quantity) as units_30d,
              uniqExact(o.customer_email) as customers_30d
          FROM klaviyo_order_line_items li
          INNER JOIN klaviyo_orders o
              ON li.order_id = o.order_id
              AND li.klaviyo_public_id = o.klaviyo_public_id
          WHERE li.klaviyo_public_id = {klaviyoId:String}
              AND o.order_timestamp >= parseDateTime64BestEffort({startDate:String})
              AND o.order_timestamp <= parseDateTime64BestEffort({endDate:String})
              AND li.product_id != ''
              AND li.quantity > 0
          GROUP BY li.product_id
      ),

      -- Calculate previous period performance for comparison
      previous_performance AS (
          SELECT
              li.product_id,
              sum(li.line_total - li.discount_amount) as prev_revenue,
              sum(li.quantity) as prev_units,
              uniqExact(o.customer_email) as prev_customers
          FROM klaviyo_order_line_items li
          INNER JOIN klaviyo_orders o
              ON li.order_id = o.order_id
              AND li.klaviyo_public_id = o.klaviyo_public_id
          WHERE li.klaviyo_public_id = {klaviyoId:String}
              AND o.order_timestamp >= parseDateTime64BestEffort({previousStartDate:String})
              AND o.order_timestamp <= parseDateTime64BestEffort({previousEndDate:String})
              AND li.product_id != ''
              AND li.quantity > 0
          GROUP BY li.product_id
      ),

      -- Get LTV metrics from first_purchase_ltv_analysis (ReplacingMergeTree)
      ltv_metrics AS (
          SELECT
              first_product_id,
              argMax(first_product_sku, last_updated) as first_product_sku,
              sum(customers_acquired) as total_customers_acquired,
              avg(avg_ltv_90d) as avg_customer_ltv_90d,
              avg(ltv_multiplier_90d) as avg_ltv_multiplier_90d,
              sum(repeat_purchase_rate_90d) / greatest(sum(customers_acquired), 1) as repeat_rate_90d
          FROM first_purchase_ltv_analysis
          WHERE klaviyo_public_id = {klaviyoId:String}
          GROUP BY first_product_id
      ),

      -- Same-product repurchase rate (customers who bought THIS product again in the date range)
      customer_purchases AS (
          SELECT
              li.product_id,
              o.customer_email,
              count(DISTINCT o.order_id) as purchase_count
          FROM klaviyo_order_line_items li
          INNER JOIN klaviyo_orders o
              ON li.order_id = o.order_id
              AND li.klaviyo_public_id = o.klaviyo_public_id
          WHERE li.klaviyo_public_id = {klaviyoId:String}
              AND o.order_timestamp >= parseDateTime64BestEffort({startDate:String})
              AND o.order_timestamp <= parseDateTime64BestEffort({endDate:String})
              AND li.product_id != ''
              AND li.quantity > 0
          GROUP BY li.product_id, o.customer_email
      ),

      same_product_repurchase AS (
          SELECT
              product_id,
              count(*) as total_customers,
              countIf(purchase_count > 1) as customers_who_repurchased,
              if(count(*) > 0,
                 countIf(purchase_count > 1) / count(*) * 100.0,
                 0) as same_product_repurchase_rate
          FROM customer_purchases
          GROUP BY product_id
      ),

      -- Any purchase repurchase rate (customers who bought ANYTHING again in the date range)
      customer_order_counts AS (
          SELECT
              li.product_id,
              o.customer_email,
              count(DISTINCT o.order_id) as total_orders
          FROM klaviyo_order_line_items li
          INNER JOIN klaviyo_orders o
              ON li.order_id = o.order_id
              AND li.klaviyo_public_id = o.klaviyo_public_id
          WHERE li.klaviyo_public_id = {klaviyoId:String}
              AND o.order_timestamp >= parseDateTime64BestEffort({startDate:String})
              AND o.order_timestamp <= parseDateTime64BestEffort({endDate:String})
              AND li.product_id != ''
              AND li.quantity > 0
          GROUP BY li.product_id, o.customer_email
      ),

      any_product_repurchase AS (
          SELECT
              product_id,
              count(*) as total_customers,
              countIf(total_orders > 1) as customers_who_purchased_anything,
              if(count(*) > 0,
                 countIf(total_orders > 1) / count(*) * 100.0,
                 0) as any_product_repurchase_rate
          FROM customer_order_counts
          GROUP BY product_id
      ),

      -- Calculate refund metrics for the selected date range
      product_refunds AS (
          SELECT
              li.product_id,
              sum(o.refund_amount * (li.line_total / NULLIF(o.order_value, 0))) as total_refund_amount,
              count(DISTINCT CASE WHEN o.refund_amount > 0 THEN o.order_id END) as refund_count
          FROM klaviyo_order_line_items li
          INNER JOIN klaviyo_orders o
              ON li.order_id = o.order_id
              AND li.klaviyo_public_id = o.klaviyo_public_id
          WHERE li.klaviyo_public_id = {klaviyoId:String}
              AND o.order_timestamp >= parseDateTime64BestEffort({startDate:String})
              AND o.order_timestamp <= parseDateTime64BestEffort({endDate:String})
              AND li.product_id != ''
              AND li.quantity > 0
          GROUP BY li.product_id
      )

      -- Final SELECT with all metrics
      SELECT
          pm.product_id,
          pm.product_name,
          pm.sku,
          pm.product_brand,
          pm.product_categories,

          -- Revenue metrics
          COALESCE(rp.revenue_30d, 0) as revenue_last_30_days,
          pm.total_revenue as revenue_all_time,

          -- Sales metrics
          COALESCE(rp.units_30d, 0) as units_sold_30d,
          pm.total_quantity as units_sold_all_time,

          -- Customer metrics
          COALESCE(rp.customers_30d, 0) as unique_customers_30d,
          pm.unique_customers as unique_customers_all_time,

          -- Pricing
          pm.avg_price,

          -- Same-product repurchase rate (customers who bought THIS product again)
          COALESCE(spr.same_product_repurchase_rate, 0) as same_product_repurchase_rate,
          COALESCE(spr.customers_who_repurchased, 0) as same_product_repurchase_count,

          -- Any-product repurchase rate (customers who bought ANYTHING again)
          COALESCE(apr.any_product_repurchase_rate, 0) as any_product_repurchase_rate,
          COALESCE(apr.customers_who_purchased_anything, 0) as any_product_repurchase_count,

          -- LTV metrics (may be NULL for products not used as first purchase)
          COALESCE(ltv.repeat_rate_90d, 0) as repeat_purchase_rate,
          COALESCE(ltv.avg_ltv_multiplier_90d, 1) as ltv_multiplier,
          COALESCE(ltv.avg_customer_ltv_90d, 0) as avg_customer_ltv,

          -- Previous period metrics for comparison
          COALESCE(pp.prev_revenue, 0) as prev_revenue,
          COALESCE(pp.prev_units, 0) as prev_units,
          COALESCE(pp.prev_customers, 0) as prev_customers,

          -- Lifecycle metrics
          dateDiff('day', pm.first_sold_date, today()) as days_since_launch,
          dateDiff('day', pm.last_sold_date, today()) as days_since_last_sale,

          -- Performance indicators
          if(COALESCE(rp.revenue_30d, 0) > 0, 'Active', 'Inactive') as status_30d,

          -- Revenue per customer
          if(pm.unique_customers > 0, pm.total_revenue / pm.unique_customers, 0) as revenue_per_customer,

          -- Refund metrics
          COALESCE(ref.total_refund_amount, 0) as total_refund_amount,
          COALESCE(ref.refund_count, 0) as refund_count,
          if(COALESCE(rp.revenue_30d, 0) > 0,
             (COALESCE(ref.total_refund_amount, 0) / rp.revenue_30d) * 100.0,
             0) as refund_rate

      FROM product_metrics pm
      LEFT JOIN recent_performance rp ON pm.product_id = rp.product_id
      LEFT JOIN previous_performance pp ON pm.product_id = pp.product_id
      LEFT JOIN same_product_repurchase spr ON pm.product_id = spr.product_id
      LEFT JOIN any_product_repurchase apr ON pm.product_id = apr.product_id
      LEFT JOIN ltv_metrics ltv ON pm.product_id = ltv.first_product_id
      LEFT JOIN product_refunds ref ON pm.product_id = ref.product_id

      WHERE COALESCE(rp.units_30d, 0) > 0

      ORDER BY COALESCE(rp.revenue_30d, 0) DESC
      LIMIT 50

      SETTINGS max_threads = 4
    `;

    const topProductsResult = await clickhouse.query({
      query: topProductsQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        previousStartDate: previousStartDate.toISOString(),
        previousEndDate: previousEndDate.toISOString()
      },
      format: 'JSONEachRow'
    });

    const topProductsRaw = await topProductsResult.json();
    console.log('[Products Report] Top products:', topProductsRaw.length);

    // Convert string values to numbers for proper frontend display
    const topProducts = topProductsRaw.map(product => ({
      ...product,
      revenue_last_30_days: parseFloat(product.revenue_last_30_days || 0),
      units_sold_30d: parseInt(product.units_sold_30d || 0),
      unique_customers_30d: parseInt(product.unique_customers_30d || 0),
      prev_revenue: parseFloat(product.prev_revenue || 0),
      prev_units: parseInt(product.prev_units || 0),
      prev_customers: parseInt(product.prev_customers || 0),
      avg_price: parseFloat(product.avg_price || 0),
      same_product_repurchase_rate: parseFloat(product.same_product_repurchase_rate || 0),
      same_product_repurchase_count: parseInt(product.same_product_repurchase_count || 0),
      any_product_repurchase_rate: parseFloat(product.any_product_repurchase_rate || 0),
      any_product_repurchase_count: parseInt(product.any_product_repurchase_count || 0),
      repeat_purchase_rate: parseFloat(product.repeat_purchase_rate || 0),
      ltv_multiplier: parseFloat(product.ltv_multiplier || 0),
      total_refund_amount: parseFloat(product.total_refund_amount || 0),
      refund_count: parseInt(product.refund_count || 0),
      refund_rate: parseFloat(product.refund_rate || 0)
    }));

    // Debug: Check first product's customer data
    if (topProducts.length > 0) {
      console.log('[Products Report] Sample product customer data:', {
        product_name: topProducts[0].product_name,
        unique_customers_30d: topProducts[0].unique_customers_30d,
        prev_customers: topProducts[0].prev_customers,
        revenue_last_30_days: topProducts[0].revenue_last_30_days,
        units_sold_30d: topProducts[0].units_sold_30d
      });
    }

    // Query for previous period (for comparison)
    const previousPeriodQuery = `
      SELECT
          sum(li.line_total - li.discount_amount) as revenue,
          sum(li.quantity) as units,
          count(DISTINCT li.product_id) as active_products
      FROM klaviyo_order_line_items li
      JOIN klaviyo_orders o
          ON li.order_id = o.order_id
          AND li.klaviyo_public_id = o.klaviyo_public_id
      WHERE li.klaviyo_public_id = {klaviyoId:String}
          AND o.order_timestamp >= parseDateTime64BestEffort({previousStartDate:String})
          AND o.order_timestamp <= parseDateTime64BestEffort({previousEndDate:String})
          AND li.product_id != ''
          AND li.quantity > 0
    `;

    const previousResult = await clickhouse.query({
      query: previousPeriodQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        previousStartDate: previousStartDate.toISOString(),
        previousEndDate: previousEndDate.toISOString()
      },
      format: 'JSONEachRow'
    });

    const previousData = await previousResult.json();
    const previousPeriod = previousData[0] || { revenue: 0, units: 0, active_products: 0 };
    console.log('[Products Report] Previous period:', previousPeriod);

    // Query 2: Category Performance
    const categoryQuery = `
      WITH
      -- Flatten product categories from products_master
      product_with_categories AS (
          SELECT
              product_id,
              argMax(product_name, last_updated) as product_name,
              argMax(total_revenue, last_updated) as total_revenue,
              argMax(total_quantity, last_updated) as total_quantity,
              argMax(unique_customers, last_updated) as unique_customers,
              argMax(product_categories, last_updated) as categories
          FROM products_master
          WHERE klaviyo_public_id = {klaviyoId:String}
          GROUP BY product_id
      ),

      -- Explode categories array and aggregate
      category_metrics AS (
          SELECT
              arrayJoin(categories) as category,
              sum(total_revenue) as revenue,
              sum(total_quantity) as units_sold,
              sum(unique_customers) as total_customers,
              count(DISTINCT product_id) as product_count
          FROM product_with_categories
          WHERE length(categories) > 0
          GROUP BY category
      )

      SELECT
          category,
          revenue,
          units_sold,
          total_customers,
          product_count,
          revenue / product_count as avg_revenue_per_product,
          units_sold / product_count as avg_units_per_product,
          revenue / sum(revenue) OVER () * 100 as revenue_share_pct

      FROM category_metrics
      ORDER BY revenue DESC
      LIMIT 20

      SETTINGS max_threads = 4
    `;

    const categoryResult = await clickhouse.query({
      query: categoryQuery,
      query_params: {
        klaviyoId: klaviyoPublicId
      },
      format: 'JSONEachRow'
    });

    const categories = await categoryResult.json();
    console.log('[Products Report] Categories:', categories.length);

    // Query 3: Price Range Performance - Using actual order data from selected period
    const priceRangeQuery = `
      WITH
      product_sales AS (
          SELECT
              li.product_id,
              li.product_name,
              sum(li.line_total - li.discount_amount) / sum(li.quantity) as avg_price,
              sum(li.line_total - li.discount_amount) as total_revenue,
              sum(li.quantity) as total_quantity,
              count(DISTINCT o.order_id) as total_orders,
              uniqExact(o.customer_email) as unique_customers
          FROM klaviyo_order_line_items li
          INNER JOIN klaviyo_orders o
              ON li.order_id = o.order_id
              AND li.klaviyo_public_id = o.klaviyo_public_id
          WHERE li.klaviyo_public_id = {klaviyoId:String}
              AND o.order_timestamp >= parseDateTime64BestEffort({startDate:String})
              AND o.order_timestamp <= parseDateTime64BestEffort({endDate:String})
              AND li.product_id != ''
              AND li.quantity > 0
          GROUP BY li.product_id, li.product_name
      )

      SELECT
          CASE
              WHEN avg_price < 25 THEN '$0-25'
              WHEN avg_price < 50 THEN '$26-50'
              WHEN avg_price < 75 THEN '$51-75'
              WHEN avg_price < 100 THEN '$76-100'
              ELSE '$100+'
          END as price_range,

          CASE
              WHEN avg_price < 25 THEN 1
              WHEN avg_price < 50 THEN 2
              WHEN avg_price < 75 THEN 3
              WHEN avg_price < 100 THEN 4
              ELSE 5
          END as sort_order,

          sum(total_revenue) as revenue,
          sum(total_quantity) as units_sold,
          sum(total_orders) as orders,
          sum(unique_customers) as customers,
          count(DISTINCT product_id) as product_count,

          if(sum(unique_customers) > 0,
             sum(total_orders)::Float64 / sum(unique_customers) * 100,
             0) as conversion_rate_pct,

          avg(avg_price) as avg_price_in_range,
          sum(total_revenue) / sum(total_quantity) as revenue_per_unit

      FROM product_sales
      WHERE avg_price > 0
      GROUP BY price_range, sort_order
      ORDER BY sort_order

      SETTINGS max_threads = 4
    `;

    const priceRangeResult = await clickhouse.query({
      query: priceRangeQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      format: 'JSONEachRow'
    });

    const priceRanges = await priceRangeResult.json();
    console.log('[Products Report] Price ranges:', priceRanges.length);

    // Calculate summary metrics
    const totalRevenue = topProducts.reduce((sum, p) => sum + parseFloat(p.revenue_last_30_days || 0), 0);
    const totalUnits = topProducts.reduce((sum, p) => sum + parseInt(p.units_sold_30d || 0), 0);
    const activeProducts = topProducts.filter(p => p.status_30d === 'Active').length;
    const avgRepeatRate = topProducts.reduce((sum, p) => sum + parseFloat(p.repeat_purchase_rate || 0), 0) / Math.max(topProducts.length, 1);

    const summary = {
      total_products: topProducts.length,
      active_products: activeProducts,
      total_revenue_30d: totalRevenue,
      total_units_30d: totalUnits,
      avg_repeat_rate: avgRepeatRate * 100,
      best_seller: topProducts[0]?.product_name || 'N/A',
      // Previous period data for comparison
      previous_revenue: parseFloat(previousPeriod.revenue || 0),
      previous_units: parseInt(previousPeriod.units || 0),
      previous_active: parseInt(previousPeriod.active_products || 0)
    };

    return NextResponse.json({
      summary,
      topProducts,
      categories,
      priceRanges,
      dateRange: {
        period: 'last_30_days'
      }
    });

  } catch (error) {
    console.error('Error fetching products data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products data', details: error.message },
      { status: 500 }
    );
  }
});

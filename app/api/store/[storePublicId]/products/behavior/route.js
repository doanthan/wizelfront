import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import { getClickHouseClient } from '@/lib/clickhouse';

/**
 * Product Behavior Analytics API
 * Returns: Repurchase, Customer Preferences, Affinity Analysis
 */
export const GET = withStoreAccess(async (request, { params }) => {
  try {
    const { storePublicId } = await params;
    const { searchParams } = new URL(request.url);
    const { store } = request;

    const limit = parseInt(searchParams.get('limit') || '20');

    if (!store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: 'Klaviyo not connected'
      }, { status: 404 });
    }

    const klaviyoId = store.klaviyo_integration.public_id;
    const clickhouse = getClickHouseClient();

    // 1. Product Repurchase Rates - Following guide exactly
    const repurchaseRatesQuery = `
      WITH customer_product_purchases AS (
          SELECT
              customer_email,
              product_id,
              product_name,
              COUNT(DISTINCT order_id) as purchase_count
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
          GROUP BY customer_email, product_id, product_name
      )
      SELECT
          product_id,
          product_name,
          COUNT(DISTINCT customer_email) as total_customers,
          COUNT(DISTINCT CASE WHEN purchase_count >= 2 THEN customer_email END) as repeat_customers,
          ROUND((COUNT(DISTINCT CASE WHEN purchase_count >= 2 THEN customer_email END)::Float64 / COUNT(DISTINCT customer_email)) * 100, 2) as repurchase_rate
      FROM customer_product_purchases
      GROUP BY product_id, product_name
      HAVING total_customers >= 10
      ORDER BY repurchase_rate DESC
      LIMIT 20
    `;

    // 2. Customer LTV by Product - Following guide exactly
    const ltvByProductQuery = `
      SELECT
          first_product_id as product_id,
          first_product_name as product_name,
          AVG(avg_ltv_90d) as avg_ltv,
          COUNT(*) as customers_acquired
      FROM first_purchase_ltv_analysis
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND avg_ltv_90d > 0
      GROUP BY first_product_id, first_product_name
      ORDER BY avg_ltv DESC
      LIMIT 10
    `;

    // 3. Days Between Repurchases - Using P75 for campaign timing optimization
    const daysBetweenQuery = `
      WITH product_purchases AS (
          SELECT
              customer_email,
              product_id,
              product_name,
              toDate(order_timestamp) as purchase_date,
              lagInFrame(toDate(order_timestamp), 1) OVER (
                  PARTITION BY customer_email, product_id
                  ORDER BY toDate(order_timestamp)
              ) as prev_purchase_date
          FROM klaviyo_order_line_items
          WHERE klaviyo_public_id = {klaviyoId:String}
      ),
      days_calculated AS (
          SELECT
              product_id,
              product_name,
              dateDiff('day', prev_purchase_date, purchase_date) as days_between
          FROM product_purchases
          WHERE prev_purchase_date IS NOT NULL
              AND dateDiff('day', prev_purchase_date, purchase_date) > 0
              AND dateDiff('day', prev_purchase_date, purchase_date) < 730
      )
      SELECT
          product_id,
          product_name,
          ROUND(quantile(0.75)(days_between), 0) as avg_days_between_purchases,
          ROUND(quantile(0.5)(days_between), 0) as median_days,
          ROUND(AVG(days_between), 0) as mean_days,
          COUNT(*) as sample_size
      FROM days_calculated
      GROUP BY product_id, product_name
      HAVING COUNT(*) >= 5
      ORDER BY avg_days_between_purchases ASC
      LIMIT 20
    `;

    // 4. Product Affinity (Frequently Bought Together) - Following guide exactly
    const affinityQuery = `
      SELECT
          first_product_name as product_1,
          second_product_name as product_2,
          customers_bought_both as co_purchases,
          ROUND(lift_score, 2) as lift_score,
          ROUND(confidence_score * 100, 2) as confidence
      FROM product_affinity_matrix
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND lift_score > 1.5
          AND customers_bought_both >= 5
      ORDER BY lift_score DESC, customers_bought_both DESC
      LIMIT 20
    `;

    // 5. Affinity Matrix for Scatter Plot - Following guide exactly
    const affinityMatrixQuery = `
      SELECT
          first_product_name as product_1,
          second_product_name as product_2,
          ROUND(confidence_score * 100, 2) as confidence,
          ROUND(lift_score, 2) as lift
      FROM product_affinity_matrix
      WHERE klaviyo_public_id = {klaviyoId:String}
          AND customers_bought_both >= 1
      ORDER BY lift_score DESC
      LIMIT 50
    `;

    // 6. New vs Returning Customer Preferences - Calculate is_first_order dynamically
    const preferencesQuery = `
      WITH customer_first_orders AS (
          SELECT
              customer_email,
              MIN(order_timestamp) as first_order_time
          FROM klaviyo_orders
          WHERE klaviyo_public_id = {klaviyoId:String}
              AND customer_email != ''
              AND customer_email NOT LIKE '%redacted%'
              AND customer_email NOT LIKE '%null%'
          GROUP BY customer_email
      ),
      enriched_orders AS (
          SELECT
              o.order_id,
              o.customer_email,
              o.klaviyo_public_id,
              CASE
                  WHEN o.order_timestamp = cfo.first_order_time THEN 1
                  ELSE 0
              END as is_first_order
          FROM klaviyo_orders o
          LEFT JOIN customer_first_orders cfo
              ON o.customer_email = cfo.customer_email
          WHERE o.klaviyo_public_id = {klaviyoId:String}
      )
      SELECT
          li.product_id,
          li.product_name,
          SUM(CASE WHEN eo.is_first_order = 1 THEN li.line_total ELSE 0 END) as new_customer_revenue,
          SUM(CASE WHEN eo.is_first_order = 0 THEN li.line_total ELSE 0 END) as returning_customer_revenue,
          COUNT(DISTINCT CASE WHEN eo.is_first_order = 1 THEN eo.customer_email END) as new_customers,
          COUNT(DISTINCT CASE WHEN eo.is_first_order = 0 THEN eo.customer_email END) as returning_customers
      FROM klaviyo_order_line_items li
      JOIN enriched_orders eo ON li.order_id = eo.order_id AND li.klaviyo_public_id = eo.klaviyo_public_id
      WHERE li.klaviyo_public_id = {klaviyoId:String}
      GROUP BY li.product_id, li.product_name
      HAVING (new_customer_revenue + returning_customer_revenue) > 0
      ORDER BY (new_customer_revenue + returning_customer_revenue) DESC
      LIMIT 20
    `;

    // 7. Retention Rate by Entry Product - Following guide exactly
    const retentionByProductQuery = `
      SELECT
          first_product_id as product_id,
          first_product_name as product_name,
          AVG(repeat_purchase_rate_90d) * 100 as retention_rate,
          COUNT(*) as customers_acquired
      FROM first_purchase_ltv_analysis
      WHERE klaviyo_public_id = {klaviyoId:String}
      GROUP BY first_product_id, first_product_name
      HAVING customers_acquired >= 10
      ORDER BY retention_rate DESC
      LIMIT 20
    `;

    // Execute all queries in parallel
    const [
      repurchaseRatesResult,
      ltvByProductResult,
      daysBetweenResult,
      affinityResult,
      affinityMatrixResult,
      preferencesResult,
      retentionByProductResult
    ] = await Promise.all([
      clickhouse.query({ query: repurchaseRatesQuery, query_params: { klaviyoId }, format: 'JSONEachRow' }),
      clickhouse.query({ query: ltvByProductQuery, query_params: { klaviyoId }, format: 'JSONEachRow' }),
      clickhouse.query({ query: daysBetweenQuery, query_params: { klaviyoId }, format: 'JSONEachRow' }),
      clickhouse.query({ query: affinityQuery, query_params: { klaviyoId }, format: 'JSONEachRow' }),
      clickhouse.query({ query: affinityMatrixQuery, query_params: { klaviyoId }, format: 'JSONEachRow' }),
      clickhouse.query({ query: preferencesQuery, query_params: { klaviyoId }, format: 'JSONEachRow' }),
      clickhouse.query({ query: retentionByProductQuery, query_params: { klaviyoId }, format: 'JSONEachRow' })
    ]);

    const repurchaseRates = await repurchaseRatesResult.json();
    const ltvByProduct = await ltvByProductResult.json();
    const daysBetweenPurchases = await daysBetweenResult.json();
    const topPairs = await affinityResult.json();
    const affinityMatrix = await affinityMatrixResult.json();
    const preferences = await preferencesResult.json();
    const retentionByProduct = await retentionByProductResult.json();

    // Transform for acquisition products (top 5 by new customers)
    const acquisitionProducts = preferences
      .sort((a, b) => parseInt(b.new_customers || 0) - parseInt(a.new_customers || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.product_name,
        new_customers: parseInt(p.new_customers || 0)
      }));

    // Transform for retention products (top 5 by retention rate)
    const retentionProducts = retentionByProduct
      .slice(0, 5)
      .map(p => ({
        name: p.product_name,
        repurchase_rate: parseFloat(p.retention_rate || 0)
      }));

    return NextResponse.json({
      repurchaseRates,
      ltvByProduct,
      daysBetweenPurchases,
      topPairs,
      affinityMatrix,
      preferences,
      retentionByProduct,
      acquisitionProducts,
      retentionProducts
    });

  } catch (error) {
    console.error('Error fetching product behavior:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product behavior', details: error.message },
      { status: 500 }
    );
  }
});

import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const klaviyoId = searchParams.get('klaviyo_id') || 'XqkVGb';

    const client = getClickHouseClient();

    // Get order frequency distribution
    const orderDistQuery = `
      SELECT
        total_orders,
        COUNT(*) as customer_count
      FROM customer_profiles
      WHERE klaviyo_public_id = '${klaviyoId}'
      GROUP BY total_orders
      ORDER BY total_orders
    `;

    const orderDistResult = await client.query({
      query: orderDistQuery,
      format: 'JSONEachRow'
    });
    const orderDistribution = await orderDistResult.json();

    // Get sample Loyal Customers with their scores
    const loyalSampleQuery = `
      SELECT
        rfm_segment,
        recency_score,
        frequency_score,
        monetary_score,
        total_orders,
        net_revenue,
        days_since_last_order,
        first_order_date,
        last_order_date
      FROM customer_profiles
      WHERE klaviyo_public_id = '${klaviyoId}'
      AND rfm_segment = 'Loyal Customers'
      ORDER BY total_orders DESC
      LIMIT 20
    `;

    const loyalSampleResult = await client.query({
      query: loyalSampleQuery,
      format: 'JSONEachRow'
    });
    const loyalSamples = await loyalSampleResult.json();

    // Get RFM score distribution
    const scoreDistQuery = `
      SELECT
        rfm_segment,
        recency_score,
        frequency_score,
        monetary_score,
        COUNT(*) as count
      FROM customer_profiles
      WHERE klaviyo_public_id = '${klaviyoId}'
      GROUP BY rfm_segment, recency_score, frequency_score, monetary_score
      ORDER BY rfm_segment, count DESC
    `;

    const scoreDistResult = await client.query({
      query: scoreDistQuery,
      format: 'JSONEachRow'
    });
    const scoreDistribution = await scoreDistResult.json();

    // Get percentile info
    const percentilesQuery = `
      SELECT
        quantile(0.2)(total_orders) as p20_orders,
        quantile(0.4)(total_orders) as p40_orders,
        quantile(0.6)(total_orders) as p60_orders,
        quantile(0.8)(total_orders) as p80_orders,
        quantile(1.0)(total_orders) as p100_orders,
        quantile(0.2)(days_since_last_order) as p20_recency,
        quantile(0.4)(days_since_last_order) as p40_recency,
        quantile(0.6)(days_since_last_order) as p60_recency,
        quantile(0.8)(days_since_last_order) as p80_recency,
        quantile(1.0)(days_since_last_order) as p100_recency,
        MIN(total_orders) as min_orders,
        MAX(total_orders) as max_orders,
        AVG(total_orders) as avg_orders,
        COUNT(*) as total_customers
      FROM customer_profiles
      WHERE klaviyo_public_id = '${klaviyoId}'
    `;

    const percentilesResult = await client.query({
      query: percentilesQuery,
      format: 'JSONEachRow'
    });
    const percentiles = await percentilesResult.json();

    return NextResponse.json({
      success: true,
      klaviyoId,
      analysis: {
        orderDistribution,
        loyalCustomerSamples: loyalSamples,
        scoreDistribution,
        percentiles: percentiles[0],
        summary: {
          totalCustomers: percentiles[0]?.total_customers,
          oneTimeBuyers: orderDistribution.find(d => d.total_orders === '1')?.customer_count || 0,
          multipleOrderCustomers: orderDistribution.filter(d => parseInt(d.total_orders) > 1).reduce((sum, d) => sum + parseInt(d.customer_count), 0)
        }
      }
    });

  } catch (error) {
    console.error('RFM analysis error:', error);
    return NextResponse.json({
      error: "RFM analysis failed",
      details: error.message
    }, { status: 500 });
  }
}

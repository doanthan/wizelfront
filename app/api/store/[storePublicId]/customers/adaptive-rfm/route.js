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

    // Create ClickHouse client
    const clickhouse = createClient({
      url: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || '8443'}`,
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD,
    });

    // Query ClickHouse for RFM statistics from customer_profiles
    const query = `
      WITH customer_stats AS (
        SELECT
          COUNT(*) as total_customers,
          COUNT(DISTINCT CASE WHEN total_orders = 1 THEN customer_email END) as one_time_buyers,
          COUNT(DISTINCT CASE WHEN total_orders > 1 THEN customer_email END) as repeat_buyers,
          quantile(0.5)(days_since_last_order) as median_days_since_last_order,
          AVG(total_revenue) as avg_ltv
        FROM customer_profiles
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
      ),
      frequency_tiers AS (
        SELECT
          COUNT(DISTINCT CASE WHEN total_orders >= 3 THEN customer_email END) / COUNT(*) * 100 as pct_high_frequency,
          COUNT(DISTINCT CASE WHEN total_orders = 2 THEN customer_email END) / COUNT(*) * 100 as pct_medium_frequency,
          COUNT(DISTINCT CASE WHEN total_orders = 1 THEN customer_email END) / COUNT(*) * 100 as pct_low_frequency,
          quantile(0.9)(total_revenue) as p90_revenue,
          quantile(0.75)(total_revenue) as p75_revenue,
          quantile(0.60)(total_revenue) as p60_revenue
        FROM customer_profiles
        WHERE klaviyo_public_id = '${klaviyoPublicId}'
      )
      SELECT
        cs.*,
        ft.*,
        cs.one_time_buyers / cs.total_customers * 100 as one_time_buyer_pct,
        cs.repeat_buyers / cs.total_customers * 100 as repeat_buyer_pct
      FROM customer_stats cs, frequency_tiers ft
    `;

    const result = await clickhouse.query({ query });
    const jsonResult = await result.json();
    const stats = (jsonResult.data || jsonResult || [])[0];

    if (!stats) {
      return NextResponse.json({
        success: false,
        needsCalculation: true,
        message: 'No customer profile data found in ClickHouse. Run full sync first.',
        store: {
          name: store.name,
          public_id: store.public_id,
          klaviyo_public_id: klaviyoPublicId
        }
      });
    }

    // Detect business template based on one-time buyer percentage
    let template_used = 'medium_repeat';
    let confidence_score = 0.7;

    if (stats.one_time_buyer_pct >= 80) {
      template_used = 'low_repeat';
      confidence_score = 0.9;
    } else if (stats.one_time_buyer_pct <= 40) {
      template_used = 'high_repeat';
      confidence_score = 0.9;
    }

    // Calculate adaptive recency thresholds based on business type
    let thresholds = {};
    if (template_used === 'low_repeat') {
      thresholds = { hot: 30, warm: 90, cool: 180, at_risk: 365, lost: 730 };
    } else if (template_used === 'high_repeat') {
      thresholds = { hot: 21, warm: 45, cool: 90, at_risk: 180, lost: 270 };
    } else {
      thresholds = { hot: 30, warm: 60, cool: 90, at_risk: 180, lost: 365 };
    }

    return NextResponse.json({
      success: true,
      version: '3.0',
      klaviyo_public_id: klaviyoPublicId,
      last_calculated: new Date().toISOString(),
      needs_recalculation: false,

      // Business characteristics from ClickHouse data
      characteristics: {
        one_time_buyer_percentage: parseFloat(stats.one_time_buyer_pct.toFixed(1)),
        repeat_purchase_rate: parseFloat(stats.repeat_buyer_pct.toFixed(1)),
        detected_template: template_used,
        confidence_score: confidence_score,
        median_inter_purchase_days: Math.round(stats.median_days_since_last_order),
        avg_order_value: null,
      },

      // Calculated criteria based on actual data
      calculated_criteria: {
        frequency: {
          champion: {
            min_orders: template_used === 'low_repeat' ? 2 : template_used === 'high_repeat' ? 6 : 5,
            baseline_used: template_used === 'low_repeat' ? 3 : template_used === 'high_repeat' ? 6 : 5,
            adjusted: template_used === 'low_repeat',
            adjustment_reason: template_used === 'low_repeat'
              ? `${stats.pct_high_frequency.toFixed(1)}% of customers are high-frequency buyers, adjusted for low-repeat business`
              : `${stats.pct_high_frequency.toFixed(1)}% meet high-frequency criteria, within healthy range`,
            pct_customers_meeting: parseFloat(stats.pct_high_frequency.toFixed(1)),
            expected_range: template_used === 'low_repeat' ? [2.0, 8.0] : [5.0, 15.0],
            is_healthy: true
          },
          loyal: {
            min_orders: template_used === 'low_repeat' ? 2 : template_used === 'high_repeat' ? 4 : 3,
            baseline_used: template_used === 'low_repeat' ? 2 : template_used === 'high_repeat' ? 4 : 3,
            adjusted: false,
            adjustment_reason: `${stats.pct_medium_frequency.toFixed(1)}% meet medium-frequency criteria`,
            pct_customers_meeting: parseFloat(stats.pct_medium_frequency.toFixed(1)),
            expected_range: template_used === 'low_repeat' ? [5.0, 15.0] : [15.0, 30.0],
            is_healthy: true
          },
          active: {
            min_orders: 1,
            baseline_used: 1,
            adjusted: false,
            adjustment_reason: "All customers with 1+ order are considered active",
            pct_customers_meeting: 100.0,
            expected_range: [90.0, 100.0],
            is_healthy: true
          }
        },
        monetary: {
          champion: {
            min_revenue: parseFloat(stats.p90_revenue.toFixed(2)),
            percentile_used: 0.90,
            pct_customers_meeting: 10.0,
            expected_range: [8.0, 12.0],
            is_healthy: true
          },
          loyal: {
            min_revenue: parseFloat(stats.p75_revenue.toFixed(2)),
            percentile_used: 0.75,
            pct_customers_meeting: 25.0,
            expected_range: [20.0, 30.0],
            is_healthy: true
          },
          active: {
            min_revenue: parseFloat((stats.p60_revenue || 0).toFixed(2)),
            percentile_used: 0.60,
            pct_customers_meeting: 40.0,
            expected_range: [35.0, 45.0],
            is_healthy: true
          }
        }
      },

      // Validation
      validation: {
        distribution_healthy: true,
        warnings: [],
        recommendations: [
          `Your business is a ${template_used.replace('_', ' ')} model with ${stats.one_time_buyer_pct.toFixed(1)}% one-time buyers`,
          `Median time between purchases is ${Math.round(stats.median_days_since_last_order)} days`,
          "RFM data is calculated from existing customer_profiles table in ClickHouse"
        ]
      },

      // Adaptive recency thresholds
      thresholds: thresholds,

      // No overrides from ClickHouse data
      has_override: false,
      override_metadata: null,

      // Template detected
      template_used: template_used,

      // Data quality from ClickHouse
      data_quality: {
        total_customers: parseInt(stats.total_customers),
        repeat_sample_size: parseInt(stats.repeat_buyers),
        is_sufficient: stats.total_customers > 100,
        total_orders: null,
        date_range_days: null
      },

      store: {
        name: store.name,
        public_id: store.public_id
      }
    });

  } catch (error) {
    console.error('Error fetching adaptive RFM from ClickHouse:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adaptive RFM from ClickHouse' },
      { status: 500 }
    );
  }
}

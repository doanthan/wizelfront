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

    // Get RFM segment distribution from ClickHouse - using median instead of average
    const query = `
      SELECT
        rfm_segment,
        COUNT(*) as customer_count,
        SUM(net_revenue) as total_revenue,
        quantile(0.5)(net_revenue) as median_revenue,
        AVG(net_revenue) as avg_revenue,
        SUM(total_orders) as total_orders,
        quantile(0.5)(days_since_last_order) as median_days_since_last_order,
        AVG(days_since_last_order) as avg_days_since_last_order,
        SUM(total_refunds) as total_refunds,
        AVG(refund_rate) as avg_refund_rate
      FROM customer_profiles
      WHERE klaviyo_public_id = '${klaviyoPublicId}'
      GROUP BY rfm_segment
      ORDER BY total_revenue DESC
    `;

    const result = await clickhouse.query({ query });
    const jsonResult = await result.json();

    // ClickHouse returns data in { data: [...] } format
    const segments = jsonResult.data || jsonResult || [];

    console.log('ClickHouse segments result:', segments);

    return NextResponse.json({
      success: true,
      segments: segments,
      store: {
        name: store.name,
        public_id: store.public_id
      }
    });

  } catch (error) {
    console.error('Error fetching customer segments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer segments' },
      { status: 500 }
    );
  }
}

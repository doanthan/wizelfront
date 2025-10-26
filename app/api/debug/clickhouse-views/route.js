import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request) {
  try {
    // Verify user session
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    }

    // Get store info to get klaviyo_public_id
    const store = await Store.findOne({ public_id: storeId });
    if (!store || !store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: "Store not found or not configured",
        store_found: !!store,
        has_klaviyo: !!store?.klaviyo_integration?.public_id
      }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration.public_id;
    const clickhouse = getClickHouseClient();

    console.log(`🔍 Checking ClickHouse views for klaviyo_public_id: ${klaviyoPublicId}`);

    // Test connection
    const testResult = await clickhouse.query({
      query: 'SELECT 1 as test',
      format: 'JSONEachRow'
    });
    const testData = await testResult.json();
    console.log('✅ ClickHouse connection OK:', testData);

    // Check if views exist
    const viewsCheckQuery = `
      SELECT
        database,
        name,
        engine,
        total_rows
      FROM system.tables
      WHERE name IN (
        'account_metrics_daily_latest',
        'campaign_statistics_latest',
        'flow_statistics_latest',
        'form_statistics_latest',
        'segment_statistics_latest'
      )
      ORDER BY name
    `;

    const viewsResult = await clickhouse.query({
      query: viewsCheckQuery,
      format: 'JSONEachRow'
    });
    const views = await viewsResult.json();
    console.log('📊 Found views:', views);

    // Check account_metrics_daily_latest
    const metricsQuery = `
      SELECT
        count() as total_rows,
        min(date) as min_date,
        max(date) as max_date,
        countDistinct(klaviyo_public_id) as unique_accounts
      FROM account_metrics_daily_latest
    `;
    const metricsResult = await clickhouse.query({
      query: metricsQuery,
      format: 'JSONEachRow'
    });
    const metricsInfo = await metricsResult.json();
    console.log('📈 account_metrics_daily_latest info:', metricsInfo);

    // Check if this specific klaviyo_public_id exists
    const accountCheckQuery = `
      SELECT
        count() as row_count,
        min(date) as min_date,
        max(date) as max_date,
        sum(total_revenue) as total_revenue,
        sum(total_orders) as total_orders
      FROM account_metrics_daily_latest
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
    `;
    const accountResult = await clickhouse.query({
      query: accountCheckQuery,
      query_params: { klaviyo_public_id: klaviyoPublicId },
      format: 'JSONEachRow'
    });
    const accountData = await accountResult.json();
    console.log(`🎯 Data for ${klaviyoPublicId}:`, accountData);

    // Get sample data
    const sampleQuery = `
      SELECT
        date,
        total_revenue,
        total_orders,
        campaign_revenue,
        flow_revenue,
        email_revenue,
        sms_revenue
      FROM account_metrics_daily_latest
      WHERE klaviyo_public_id = {klaviyo_public_id:String}
      ORDER BY date DESC
      LIMIT 10
    `;
    const sampleResult = await clickhouse.query({
      query: sampleQuery,
      query_params: { klaviyo_public_id: klaviyoPublicId },
      format: 'JSONEachRow'
    });
    const sampleData = await sampleResult.json();
    console.log('📋 Sample data:', sampleData);

    return NextResponse.json({
      success: true,
      store: {
        public_id: store.public_id,
        name: store.name,
        klaviyo_public_id: klaviyoPublicId
      },
      clickhouse: {
        connected: true,
        views_found: views,
        metrics_info: metricsInfo[0] || {},
        account_data: accountData[0] || {},
        sample_data: sampleData
      }
    });

  } catch (error) {
    console.error('❌ ClickHouse views check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check ClickHouse views',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

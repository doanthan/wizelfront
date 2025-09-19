import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";
import { getClickHouseClient } from "@/lib/clickhouse";

export async function GET(request) {
  try {
    await connectToDatabase();

    // Get all users to debug
    const users = await User.find({}).limit(5).lean();

    // Get all stores to debug
    const stores = await Store.find({})
      .select('name public_id klaviyo_integration.public_id')
      .limit(10)
      .lean();

    // Check ClickHouse for data
    const klaviyoIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    let clickhouseData = null;
    let clickhouseError = null;

    if (klaviyoIds.length > 0) {
      try {
        const client = getClickHouseClient();

        // Check for any data in account_metrics_daily
        const checkQuery = `
          SELECT
            klaviyo_public_id,
            COUNT(*) as row_count,
            MIN(date) as earliest_date,
            MAX(date) as latest_date,
            SUM(total_revenue) as total_revenue
          FROM account_metrics_daily
          WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
          GROUP BY klaviyo_public_id
          LIMIT 10
        `;

        const result = await client.query({ query: checkQuery, format: 'JSONEachRow' });
        clickhouseData = await result.json();
      } catch (error) {
        clickhouseError = error.message;
      }
    }

    // Also check campaign_statistics table
    let campaignData = null;
    let campaignError = null;

    if (klaviyoIds.length > 0) {
      try {
        const client = getClickHouseClient();

        const campaignQuery = `
          SELECT
            klaviyo_public_id,
            COUNT(*) as campaign_count,
            MIN(date) as earliest_date,
            MAX(date) as latest_date,
            SUM(recipients) as total_recipients,
            SUM(conversion_value) as total_revenue
          FROM campaign_statistics
          WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
          GROUP BY klaviyo_public_id
          LIMIT 10
        `;

        const result = await client.query({ query: campaignQuery, format: 'JSONEachRow' });
        campaignData = await result.json();
      } catch (error) {
        campaignError = error.message;
      }
    }

    // Prepare debug info
    const debugInfo = {
      database_connection: {
        mongodb: "connected",
        clickhouse: !!process.env.CLICKHOUSE_URL ? "configured" : "not configured"
      },
      users_summary: {
        total: users.length,
        sample: users.slice(0, 3).map(u => ({
          email: u.email,
          store_count: u.store_ids?.length || 0
        }))
      },
      stores_summary: {
        total: stores.length,
        with_klaviyo: stores.filter(s => s.klaviyo_integration?.public_id).length,
        sample: stores.slice(0, 5).map(s => ({
          name: s.name,
          public_id: s.public_id,
          klaviyo_public_id: s.klaviyo_integration?.public_id || 'none'
        }))
      },
      clickhouse_data: {
        account_metrics: {
          klaviyo_ids_checked: klaviyoIds.slice(0, 5),
          data_found: clickhouseData,
          error: clickhouseError
        },
        campaign_statistics: {
          data_found: campaignData,
          error: campaignError
        }
      },
      diagnosis: []
    };

    // Add diagnosis based on findings
    if (stores.length === 0) {
      debugInfo.diagnosis.push("❌ No stores found in database");
    } else if (!klaviyoIds.length) {
      debugInfo.diagnosis.push("⚠️ Stores exist but none have Klaviyo integration configured");
    } else if (clickhouseError || campaignError) {
      debugInfo.diagnosis.push("❌ ClickHouse connection error - check CLICKHOUSE_URL in .env");
    } else if ((!clickhouseData || clickhouseData.length === 0) && (!campaignData || campaignData.length === 0)) {
      debugInfo.diagnosis.push("⚠️ Klaviyo integrations exist but no data found in ClickHouse tables");
      debugInfo.diagnosis.push("💡 This could mean: 1) Data sync hasn't run yet, 2) No historical data available");
    } else {
      debugInfo.diagnosis.push("✅ Data pipeline appears to be working");
    }

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
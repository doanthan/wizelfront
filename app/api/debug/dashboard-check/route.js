import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";
import { getClickHouseClient } from "@/lib/clickhouse";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's stores
    const stores = await Store.find({ _id: { $in: user.store_ids } })
      .select('name public_id klaviyo_integration.public_id klaviyo_integration.apiKey klaviyo_integration.oauth_token')
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
        `;

        const result = await client.query({ query: checkQuery, format: 'JSONEachRow' });
        clickhouseData = await result.json();
      } catch (error) {
        clickhouseError = error.message;
      }
    }

    // Prepare debug info
    const debugInfo = {
      user: {
        email: user.email,
        store_count: user.store_ids?.length || 0,
        store_ids: user.store_ids
      },
      stores: stores.map(s => ({
        name: s.name,
        public_id: s.public_id,
        has_klaviyo: !!s.klaviyo_integration?.public_id,
        klaviyo_public_id: s.klaviyo_integration?.public_id || 'none',
        auth_type: s.klaviyo_integration?.oauth_token ? 'OAuth' :
                   s.klaviyo_integration?.apiKey ? 'API Key' : 'None'
      })),
      clickhouse: {
        has_connection: !!process.env.CLICKHOUSE_URL,
        klaviyo_ids_to_check: klaviyoIds,
        data_found: clickhouseData,
        error: clickhouseError
      },
      suggestions: []
    };

    // Add suggestions based on findings
    if (!stores.length) {
      debugInfo.suggestions.push("No stores found for this user. Please add stores first.");
    } else if (!klaviyoIds.length) {
      debugInfo.suggestions.push("Stores exist but none have Klaviyo integration. Connect Klaviyo to see data.");
    } else if (clickhouseError) {
      debugInfo.suggestions.push("ClickHouse connection error. Check CLICKHOUSE_URL in .env");
    } else if (!clickhouseData || clickhouseData.length === 0) {
      debugInfo.suggestions.push("Klaviyo integration exists but no data in ClickHouse. Data sync may be needed.");
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
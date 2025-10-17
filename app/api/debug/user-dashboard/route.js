import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";
import { getClickHouseClient } from "@/lib/clickhouse";

export async function POST(request) {
  try {
    const session = await auth();

    const debug = {
      timestamp: new Date().toISOString(),
      test: "User Dashboard Flow",
      steps: []
    };

    // Step 1: Session Check
    debug.steps.push({
      step: 1,
      name: "Session Check",
      success: !!session?.user?.email,
      data: {
        hasSession: !!session,
        userEmail: session?.user?.email || null,
        userId: session?.user?.id || null
      }
    });

    if (!session?.user?.email) {
      return NextResponse.json({
        error: "No session - user needs to log in",
        debug,
        instructions: "User must be logged in to test dashboard flow"
      });
    }

    await connectToDatabase();

    // Step 2: Get User and Store IDs
    const user = await User.findOne({ email: session.user.email });
    debug.steps.push({
      step: 2,
      name: "User Lookup",
      success: !!user,
      data: {
        found: !!user,
        userId: user?._id,
        userStoreIds: user?.store_ids || [],
        storeIdsCount: user?.store_ids?.length || 0
      }
    });

    if (!user) {
      return NextResponse.json({
        error: "User not found in database",
        debug
      });
    }

    // Step 3: Simulate exact dashboard store query
    const { testStoreIds } = await request.json().catch(() => ({ testStoreIds: null }));

    // Use the exact logic from dashboard API
    let storeQuery;
    if (!testStoreIds || testStoreIds.length === 0 || testStoreIds.includes('all')) {
      // Dashboard "View All" - get all user stores
      storeQuery = { _id: { $in: user.store_ids } };
    } else {
      // Dashboard specific selection
      storeQuery = {
        $or: [
          { public_id: { $in: testStoreIds } },
          { _id: { $in: user.store_ids } }
        ]
      };
    }

    const stores = await Store.find(storeQuery)
      .select('public_id name klaviyo_integration')
      .lean();

    debug.steps.push({
      step: 3,
      name: "Store Query (Dashboard Logic)",
      success: true,
      data: {
        query: storeQuery,
        testStoreIds: testStoreIds || 'all',
        storesFound: stores.length,
        stores: stores.map(s => ({
          name: s.name,
          public_id: s.public_id,
          klaviyo_public_id: s.klaviyo_integration?.public_id || null
        }))
      }
    });

    // Step 4: Extract Klaviyo IDs (Dashboard Logic)
    const klaviyoPublicIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    debug.steps.push({
      step: 4,
      name: "Klaviyo ID Extraction",
      success: klaviyoPublicIds.length > 0,
      data: {
        klaviyoIds: klaviyoPublicIds,
        storesWithKlaviyo: stores.filter(s => s.klaviyo_integration?.public_id).length,
        totalStores: stores.length
      }
    });

    if (klaviyoPublicIds.length === 0) {
      return NextResponse.json({
        error: "No stores with Klaviyo integration found for this user",
        debug,
        recommendation: "Check if user has access to stores with Klaviyo integrations"
      });
    }

    // Step 5: Test ClickHouse query with user's Klaviyo IDs
    try {
      const client = getClickHouseClient();

      // Simulate exact dashboard API query for past 90 days
      const now = new Date();
      const past90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const dashboardQuery = `
        SELECT
          SUM(total_revenue) as revenue_sum,
          SUM(total_orders) as orders_sum,
          SUM(unique_customers) as customers_sum,
          COUNT(*) as days_with_data
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          AND date >= '${past90Days.toISOString().split('T')[0]}'
          AND date <= '${now.toISOString().split('T')[0]}'
      `;

      const result = await client.query({
        query: dashboardQuery,
        format: 'JSONEachRow'
      });
      const dashboardData = await result.json();

      debug.steps.push({
        step: 5,
        name: "Dashboard ClickHouse Query",
        success: true,
        data: {
          query: dashboardQuery,
          result: dashboardData[0] || {},
          hasData: (dashboardData[0]?.revenue_sum || 0) > 0
        }
      });

      // Summary and diagnosis
      const totalRevenue = parseFloat(dashboardData[0]?.revenue_sum || 0);
      const totalOrders = parseInt(dashboardData[0]?.orders_sum || 0);
      const daysWithData = parseInt(dashboardData[0]?.days_with_data || 0);

      const diagnosis = {
        issue: totalRevenue === 0 ? "No revenue data found" : null,
        expectedRevenue: totalRevenue,
        expectedOrders: totalOrders,
        daysWithData: daysWithData,
        recommendation: totalRevenue === 0
          ? "Check if the Klaviyo IDs have data in ClickHouse for the past 90 days"
          : "Dashboard should show data - there might be a frontend issue"
      };

      return NextResponse.json({
        success: true,
        debug,
        diagnosis,
        summary: {
          userHasStores: stores.length > 0,
          storesHaveKlaviyo: klaviyoPublicIds.length > 0,
          clickhouseHasData: totalRevenue > 0,
          shouldShowData: totalRevenue > 0
        }
      });

    } catch (error) {
      debug.steps.push({
        step: 5,
        name: "Dashboard ClickHouse Query",
        success: false,
        error: error.message
      });

      return NextResponse.json({
        error: "ClickHouse query failed",
        debug
      });
    }

  } catch (error) {
    console.error('User dashboard debug error:', error);
    return NextResponse.json({
      error: "Debug failed",
      details: error.message
    }, { status: 500 });
  }
}
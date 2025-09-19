import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";
import { getClickHouseClient } from "@/lib/clickhouse";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    const debug = {
      timestamp: new Date().toISOString(),
      steps: []
    };

    // Step 1: Check session
    debug.steps.push({
      step: 1,
      name: "Session Check",
      success: !!session?.user?.email,
      data: {
        hasSession: !!session,
        userEmail: session?.user?.email || null
      }
    });

    if (!session?.user?.email) {
      return NextResponse.json({
        error: "No session found",
        debug
      }, { status: 401 });
    }

    // Step 2: Connect to MongoDB
    try {
      await connectToDatabase();
      debug.steps.push({
        step: 2,
        name: "MongoDB Connection",
        success: true,
        data: { connected: true }
      });
    } catch (error) {
      debug.steps.push({
        step: 2,
        name: "MongoDB Connection",
        success: false,
        data: { error: error.message }
      });
      return NextResponse.json({ error: "MongoDB connection failed", debug }, { status: 500 });
    }

    // Step 3: Get user
    const user = await User.findOne({ email: session.user.email });
    debug.steps.push({
      step: 3,
      name: "User Lookup",
      success: !!user,
      data: {
        found: !!user,
        userId: user?._id,
        storeIdsCount: user?.store_ids?.length || 0
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", debug }, { status: 404 });
    }

    // Step 4: Get stores
    const stores = await Store.find({ _id: { $in: user.store_ids } })
      .select('public_id name klaviyo_integration')
      .lean();

    debug.steps.push({
      step: 4,
      name: "Stores Query",
      success: true,
      data: {
        totalStores: stores.length,
        stores: stores.map(store => ({
          name: store.name,
          public_id: store.public_id,
          has_klaviyo: !!store.klaviyo_integration,
          klaviyo_public_id: store.klaviyo_integration?.public_id || null
        }))
      }
    });

    // Step 5: Filter stores with Klaviyo integration
    const klaviyoStores = stores.filter(s => s.klaviyo_integration?.public_id);
    const klaviyoPublicIds = klaviyoStores.map(s => s.klaviyo_integration.public_id);

    debug.steps.push({
      step: 5,
      name: "Klaviyo Integration Check",
      success: klaviyoStores.length > 0,
      data: {
        storesWithKlaviyo: klaviyoStores.length,
        totalStores: stores.length,
        klaviyoPublicIds
      }
    });

    // Step 6: Test ClickHouse connection
    try {
      const client = getClickHouseClient();
      const testResult = await client.query({
        query: 'SELECT 1 as test',
        format: 'JSONEachRow'
      });
      await testResult.json();

      debug.steps.push({
        step: 6,
        name: "ClickHouse Connection",
        success: true,
        data: { connected: true }
      });
    } catch (error) {
      debug.steps.push({
        step: 6,
        name: "ClickHouse Connection",
        success: false,
        data: { error: error.message }
      });
    }

    // Step 7: Test ClickHouse data (if we have Klaviyo IDs)
    if (klaviyoPublicIds.length > 0) {
      try {
        const client = getClickHouseClient();

        // Check account_metrics_daily table
        const accountQuery = `
          SELECT
            COUNT(*) as total_rows,
            MIN(date) as min_date,
            MAX(date) as max_date,
            SUM(total_revenue) as total_revenue,
            SUM(total_orders) as total_orders
          FROM account_metrics_daily FINAL
          WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        `;

        const accountResult = await client.query({
          query: accountQuery,
          format: 'JSONEachRow'
        });
        const accountData = await accountResult.json();

        // Check recent data (last 30 days)
        const recentQuery = `
          SELECT
            klaviyo_public_id,
            date,
            total_revenue,
            total_orders,
            unique_customers
          FROM account_metrics_daily FINAL
          WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
            AND date >= today() - INTERVAL 30 DAY
          ORDER BY date DESC
          LIMIT 10
        `;

        const recentResult = await client.query({
          query: recentQuery,
          format: 'JSONEachRow'
        });
        const recentData = await recentResult.json();

        debug.steps.push({
          step: 7,
          name: "ClickHouse Data Check",
          success: true,
          data: {
            accountMetrics: accountData[0] || {},
            recentDataRows: recentData.length,
            recentSample: recentData.slice(0, 3)
          }
        });

      } catch (error) {
        debug.steps.push({
          step: 7,
          name: "ClickHouse Data Check",
          success: false,
          data: { error: error.message }
        });
      }
    } else {
      debug.steps.push({
        step: 7,
        name: "ClickHouse Data Check",
        success: false,
        data: { error: "No Klaviyo public IDs to query" }
      });
    }

    // Summary
    const successfulSteps = debug.steps.filter(s => s.success).length;
    const diagnosis = {
      overallHealth: `${successfulSteps}/${debug.steps.length} steps successful`,
      issues: debug.steps.filter(s => !s.success).map(s => ({
        step: s.step,
        name: s.name,
        issue: s.data
      })),
      recommendations: []
    };

    // Generate recommendations
    if (klaviyoStores.length === 0) {
      diagnosis.recommendations.push("No stores have Klaviyo integrations - this is likely why dashboard shows zero data");
    }

    if (debug.steps.find(s => s.step === 6 && !s.success)) {
      diagnosis.recommendations.push("ClickHouse connection failed - check environment variables and server status");
    }

    if (debug.steps.find(s => s.step === 7 && s.data?.accountMetrics?.total_rows === 0)) {
      diagnosis.recommendations.push("No data in ClickHouse for the selected stores");
    }

    return NextResponse.json({
      success: true,
      debug,
      diagnosis
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: "Debug failed",
      details: error.message
    }, { status: 500 });
  }
}
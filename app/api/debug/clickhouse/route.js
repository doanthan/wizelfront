import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export async function GET(request) {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: ClickHouse Connection
    try {
      const client = getClickHouseClient();
      const result = await client.query({
        query: 'SELECT 1 as test, now() as server_time',
        format: 'JSONEachRow'
      });
      const data = await result.json();

      debug.tests.push({
        name: "ClickHouse Connection",
        success: true,
        data: data[0]
      });
    } catch (error) {
      debug.tests.push({
        name: "ClickHouse Connection",
        success: false,
        error: error.message
      });
    }

    // Test 2: List Tables
    try {
      const client = getClickHouseClient();
      const result = await client.query({
        query: 'SHOW TABLES',
        format: 'JSONEachRow'
      });
      const tables = await result.json();

      debug.tests.push({
        name: "List Tables",
        success: true,
        data: {
          tableCount: tables.length,
          tables: tables.map(t => t.name)
        }
      });
    } catch (error) {
      debug.tests.push({
        name: "List Tables",
        success: false,
        error: error.message
      });
    }

    // Test 3: Check key tables exist
    const keyTables = ['account_metrics_daily', 'campaign_statistics', 'flow_statistics'];
    for (const tableName of keyTables) {
      try {
        const client = getClickHouseClient();
        const result = await client.query({
          query: `SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`,
          format: 'JSONEachRow'
        });
        const data = await result.json();

        debug.tests.push({
          name: `Table: ${tableName}`,
          success: true,
          data: { rowCount: data[0]?.count || 0 }
        });
      } catch (error) {
        debug.tests.push({
          name: `Table: ${tableName}`,
          success: false,
          error: error.message
        });
      }
    }

    // Test 4: Sample data from account_metrics_daily
    try {
      const client = getClickHouseClient();
      const result = await client.query({
        query: `
          SELECT
            klaviyo_public_id,
            date,
            total_revenue,
            total_orders,
            unique_customers
          FROM account_metrics_daily
          ORDER BY date DESC
          LIMIT 5
        `,
        format: 'JSONEachRow'
      });
      const data = await result.json();

      debug.tests.push({
        name: "Sample Account Metrics",
        success: true,
        data: {
          sampleRows: data.length,
          sample: data
        }
      });
    } catch (error) {
      debug.tests.push({
        name: "Sample Account Metrics",
        success: false,
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      debug
    });

  } catch (error) {
    console.error('ClickHouse debug error:', error);
    return NextResponse.json({
      error: "ClickHouse debug failed",
      details: error.message
    }, { status: 500 });
  }
}
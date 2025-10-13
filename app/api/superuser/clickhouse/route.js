import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import {
  testConnection,
  getTables,
  getTableStats,
  getSystemMetrics,
  executeQuery,
  getDatabaseStats,
} from "@/lib/clickhouse";

/**
 * GET /api/superuser/clickhouse
 * Fetch ClickHouse data for superuser monitoring
 * SOC2: CC7.1 System Monitoring | ISO 27001: A.12.4 Logging and Monitoring
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Check if user is superuser
    const user = await User.findOne({ email: session.user.email });
    if (!user?.is_super_user) {
      return NextResponse.json({ 
        error: "Superuser access required" 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "overview";
    const database = searchParams.get("database");
    const table = searchParams.get("table");
    const query = searchParams.get("query");

    let result;

    switch (action) {
      case "test":
        // Test connection
        result = await testConnection();
        break;

      case "tables":
        // Get all tables
        result = await getTables();
        break;

      case "table-stats":
        // Get specific table statistics
        if (!database || !table) {
          return NextResponse.json(
            { error: "Database and table parameters required" },
            { status: 400 }
          );
        }
        result = await getTableStats(database, table);
        break;

      case "system-metrics":
        // Get system metrics
        result = await getSystemMetrics();
        break;

      case "database-stats":
        // Get database statistics
        result = await getDatabaseStats();
        break;

      case "execute":
        // Execute custom query (with safety checks)
        if (!query) {
          return NextResponse.json(
            { error: "Query parameter required" },
            { status: 400 }
          );
        }
        result = await executeQuery(query);
        break;

      case "overview":
      default:
        // Get comprehensive overview
        const [connection, tables, dbStats, metrics] = await Promise.all([
          testConnection(),
          getTables(),
          getDatabaseStats(),
          getSystemMetrics(),
        ]);

        result = {
          success: connection.success && tables.success,
          connection,
          tables: tables.tables || [],
          databases: dbStats.databases || [],
          metrics: metrics.metrics || [],
          uptime: metrics.uptime || {},
          activeQueries: metrics.activeQueries || [],
          summary: {
            totalDatabases: dbStats.databases?.length || 0,
            totalTables: tables.tables?.length || 0,
            totalRows: tables.tables?.reduce((sum, t) => sum + (t.total_rows || 0), 0) || 0,
            totalSize: tables.tables?.reduce((sum, t) => sum + (t.total_bytes || 0), 0) || 0,
          },
        };
        break;
    }

    // Log superuser action for audit
    console.log(`[AUDIT] Superuser ${user.email} accessed ClickHouse ${action} at ${new Date().toISOString()}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Superuser API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superuser/clickhouse
 * Execute ClickHouse queries (restricted to SELECT/SHOW/DESCRIBE)
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Check if user is superuser
    const user = await User.findOne({ email: session.user.email });
    if (!user?.is_super_user) {
      return NextResponse.json({ 
        error: "Superuser access required" 
      }, { status: 403 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Execute the query with safety checks
    const result = await executeQuery(query);

    // Log superuser action for audit
    console.log(`[AUDIT] Superuser ${user.email} executed ClickHouse query at ${new Date().toISOString()}`);
    console.log(`[AUDIT] Query: ${query.substring(0, 100)}...`);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Superuser API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
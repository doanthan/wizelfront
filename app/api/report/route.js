import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Store from "@/models/Store";
import { getClickHouseClient } from "@/lib/clickhouse";

/**
 * GET /api/report
 * Fetch account reporting data from ClickHouse
 * Aggregates data for multiple stores by klaviyo_public_key
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get user and their stores
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get("endDate") || new Date().toISOString().split('T')[0];
    const storeIds = searchParams.get("storeIds")?.split(",") || [];
    const reportType = searchParams.get("type") || "dashboard";
    const metric = searchParams.get("metric") || "revenue";

    // Get stores based on user permissions
    let stores = [];
    if (user.is_super_user && storeIds.length === 0) {
      // Super user can see all stores
      stores = await Store.find({}).select('public_id name klaviyo_integration.public_id');
    } else if (storeIds.length > 0) {
      // Specific stores requested
      stores = await Store.find({ 
        public_id: { $in: storeIds },
        $or: [
          { public_id: { $in: user.store_ids || [] } },
          { 'klaviyo_integration.public_id': { $in: user.klaviyo_public_keys || [] } }
        ]
      }).select('public_id name klaviyo_integration.public_id');
    } else {
      // User's stores
      stores = await Store.find({ 
        $or: [
          { public_id: { $in: user.store_ids || [] } },
          { 'klaviyo_integration.public_id': { $in: user.klaviyo_public_keys || [] } }
        ]
      }).select('public_id name klaviyo_integration.public_id');
    }

    if (stores.length === 0) {
      return NextResponse.json({ 
        error: "No stores found",
        data: getEmptyDashboardData() 
      });
    }

    // Extract klaviyo public keys
    const klaviyoPublicKeys = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    if (klaviyoPublicKeys.length === 0) {
      return NextResponse.json({ 
        error: "No Klaviyo integrations found",
        data: getEmptyDashboardData() 
      });
    }

    // Get ClickHouse client
    const client = getClickHouseClient();

    // Build response based on report type
    let response = {};
    
    switch (reportType) {
      case "dashboard":
        response = await getDashboardMetrics(client, klaviyoPublicKeys, startDate, endDate);
        break;
      
      case "campaigns":
        response = await getCampaignMetrics(client, klaviyoPublicKeys, startDate, endDate);
        break;
      
      case "flows":
        response = await getFlowMetrics(client, klaviyoPublicKeys, startDate, endDate);
        break;
      
      case "performance":
        response = await getAccountPerformance(client, klaviyoPublicKeys, startDate, endDate, stores);
        break;
      
      default:
        response = await getDashboardMetrics(client, klaviyoPublicKeys, startDate, endDate);
    }

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        startDate,
        endDate,
        storeCount: stores.length,
        reportType
      }
    });

  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error.message,
        data: getEmptyDashboardData()
      },
      { status: 500 }
    );
  }
}

/**
 * Get dashboard metrics from ClickHouse
 */
async function getDashboardMetrics(client, klaviyoPublicKeys, startDate, endDate) {
  try {
    const keysString = klaviyoPublicKeys.map(k => `'${k}'`).join(',');
    
    // Overall revenue and orders
    const revenueQuery = `
      SELECT 
        sum(revenue) as total_revenue,
        sum(attributed_revenue) as attributed_revenue,
        count(DISTINCT order_id) as total_orders,
        avg(revenue) as avg_order_value,
        sum(email_revenue) as email_revenue,
        sum(sms_revenue) as sms_revenue,
        count(DISTINCT IF(channel = 'email', recipient_id, NULL)) as email_recipients,
        count(DISTINCT IF(channel = 'sms', recipient_id, NULL)) as sms_recipients,
        count(DISTINCT recipient_id) as total_recipients
      FROM analytics.orders
      WHERE klaviyo_public_key IN (${keysString})
        AND date >= '${startDate}'
        AND date <= '${endDate}'
    `;

    // Year-over-year growth
    const lastYearStart = new Date(startDate);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    const lastYearEnd = new Date(endDate);
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
    
    const yoyQuery = `
      SELECT 
        sum(IF(date >= '${startDate}', revenue, 0)) as current_revenue,
        sum(IF(date < '${startDate}', revenue, 0)) as previous_revenue
      FROM analytics.orders
      WHERE klaviyo_public_key IN (${keysString})
        AND date >= '${lastYearStart.toISOString().split('T')[0]}'
        AND date <= '${endDate}'
    `;

    // Execute queries
    const [revenueResult, yoyResult] = await Promise.all([
      client.query({ query: revenueQuery, format: 'JSONEachRow' }),
      client.query({ query: yoyQuery, format: 'JSONEachRow' })
    ]);

    const revenueData = await revenueResult.json();
    const yoyData = await yoyResult.json();

    const revenue = revenueData[0] || {};
    const yoy = yoyData[0] || {};

    // Calculate metrics
    const totalRevenue = revenue.total_revenue || 0;
    const attributedRevenue = revenue.attributed_revenue || 0;
    const totalOrders = revenue.total_orders || 0;
    const aov = revenue.avg_order_value || 0;
    const emailRevenue = revenue.email_revenue || 0;
    const smsRevenue = revenue.sms_revenue || 0;
    const emailRecipients = revenue.email_recipients || 0;
    const smsRecipients = revenue.sms_recipients || 0;
    const totalRecipients = revenue.total_recipients || 0;

    const currentRevenue = yoy.current_revenue || 0;
    const previousRevenue = yoy.previous_revenue || 0;
    const yoyGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    return {
      overview: {
        totalRevenue,
        attributedRevenue,
        attributionRate: totalRevenue > 0 ? (attributedRevenue / totalRevenue * 100).toFixed(1) : 0,
        totalOrders,
        aov: aov.toFixed(2),
        yoyGrowth: parseFloat(yoyGrowth)
      },
      channels: {
        email: {
          revenue: emailRevenue,
          recipients: emailRecipients,
          revenuePerRecipient: emailRecipients > 0 ? (emailRevenue / emailRecipients).toFixed(2) : 0
        },
        sms: {
          revenue: smsRevenue,
          recipients: smsRecipients,
          revenuePerRecipient: smsRecipients > 0 ? (smsRevenue / smsRecipients).toFixed(2) : 0
        },
        overall: {
          revenuePerRecipient: totalRecipients > 0 ? (totalRevenue / totalRecipients).toFixed(2) : 0
        }
      }
    };
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return getEmptyDashboardData();
  }
}

/**
 * Get campaign metrics from ClickHouse
 */
async function getCampaignMetrics(client, klaviyoPublicKeys, startDate, endDate) {
  try {
    const keysString = klaviyoPublicKeys.map(k => `'${k}'`).join(',');
    
    const query = `
      SELECT 
        campaign_id,
        campaign_name,
        campaign_type,
        sum(sends) as sends,
        sum(opens) as opens,
        sum(clicks) as clicks,
        sum(conversions) as conversions,
        sum(revenue) as revenue,
        avg(open_rate) as open_rate,
        avg(click_rate) as click_rate,
        avg(conversion_rate) as conversion_rate
      FROM analytics.campaign_stats
      WHERE klaviyo_public_key IN (${keysString})
        AND date >= '${startDate}'
        AND date <= '${endDate}'
      GROUP BY campaign_id, campaign_name, campaign_type
      ORDER BY revenue DESC
      LIMIT 100
    `;

    const result = await client.query({ query, format: 'JSONEachRow' });
    const campaigns = await result.json();

    return {
      campaigns,
      summary: {
        totalCampaigns: campaigns.length,
        totalRevenue: campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0),
        avgOpenRate: campaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / campaigns.length,
        avgClickRate: campaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) / campaigns.length
      }
    };
  } catch (error) {
    console.error("Campaign metrics error:", error);
    return { campaigns: [], summary: {} };
  }
}

/**
 * Get flow metrics from ClickHouse
 */
async function getFlowMetrics(client, klaviyoPublicKeys, startDate, endDate) {
  try {
    const keysString = klaviyoPublicKeys.map(k => `'${k}'`).join(',');
    
    const query = `
      SELECT 
        flow_id,
        flow_name,
        flow_type,
        sum(triggered) as triggered,
        sum(completed) as completed,
        sum(revenue) as revenue,
        avg(completion_rate) as completion_rate,
        avg(revenue_per_recipient) as revenue_per_recipient
      FROM analytics.flow_stats
      WHERE klaviyo_public_key IN (${keysString})
        AND date >= '${startDate}'
        AND date <= '${endDate}'
      GROUP BY flow_id, flow_name, flow_type
      ORDER BY revenue DESC
      LIMIT 100
    `;

    const result = await client.query({ query, format: 'JSONEachRow' });
    const flows = await result.json();

    return {
      flows,
      summary: {
        totalFlows: flows.length,
        totalRevenue: flows.reduce((sum, f) => sum + (f.revenue || 0), 0),
        totalTriggered: flows.reduce((sum, f) => sum + (f.triggered || 0), 0),
        avgCompletionRate: flows.reduce((sum, f) => sum + (f.completion_rate || 0), 0) / flows.length
      }
    };
  } catch (error) {
    console.error("Flow metrics error:", error);
    return { flows: [], summary: {} };
  }
}

/**
 * Get account performance rankings
 */
async function getAccountPerformance(client, klaviyoPublicKeys, startDate, endDate, stores) {
  try {
    const keysString = klaviyoPublicKeys.map(k => `'${k}'`).join(',');
    
    const query = `
      SELECT 
        klaviyo_public_key,
        sum(revenue) as total_revenue,
        count(DISTINCT order_id) as total_orders,
        avg(revenue) as avg_order_value,
        sum(attributed_revenue) as attributed_revenue
      FROM analytics.orders
      WHERE klaviyo_public_key IN (${keysString})
        AND date >= '${startDate}'
        AND date <= '${endDate}'
      GROUP BY klaviyo_public_key
      ORDER BY total_revenue DESC
    `;

    const result = await client.query({ query, format: 'JSONEachRow' });
    const performance = await result.json();

    // Map klaviyo keys to store names
    const performanceWithNames = performance.map(p => {
      const store = stores.find(s => s.klaviyo_integration?.public_id === p.klaviyo_public_key);
      return {
        ...p,
        store_name: store?.name || 'Unknown Store',
        store_id: store?.public_id
      };
    });

    // Get top and bottom performers
    const topPerformers = performanceWithNames.slice(0, 5);
    const bottomPerformers = performanceWithNames.slice(-5).reverse();

    return {
      rankings: performanceWithNames,
      topPerformers,
      bottomPerformers,
      summary: {
        totalAccounts: performanceWithNames.length,
        totalRevenue: performanceWithNames.reduce((sum, p) => sum + (p.total_revenue || 0), 0),
        avgRevenuePerAccount: performanceWithNames.reduce((sum, p) => sum + (p.total_revenue || 0), 0) / performanceWithNames.length
      }
    };
  } catch (error) {
    console.error("Account performance error:", error);
    return { rankings: [], topPerformers: [], bottomPerformers: [], summary: {} };
  }
}

/**
 * Get empty dashboard data structure
 */
function getEmptyDashboardData() {
  return {
    overview: {
      totalRevenue: 0,
      attributedRevenue: 0,
      attributionRate: 0,
      totalOrders: 0,
      aov: 0,
      yoyGrowth: 0
    },
    channels: {
      email: {
        revenue: 0,
        recipients: 0,
        revenuePerRecipient: 0
      },
      sms: {
        revenue: 0,
        recipients: 0,
        revenuePerRecipient: 0
      },
      overall: {
        revenuePerRecipient: 0
      }
    }
  };
}
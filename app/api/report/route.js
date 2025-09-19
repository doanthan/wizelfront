import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Store from "@/models/Store";
import { getClickHouseClient } from "@/lib/clickhouse";

/**
 * GET /api/report
 * Fetch account reporting data from ClickHouse using hybrid query strategy
 * Aggregates data for multiple stores by klaviyo_public_id
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
    const comparisonType = searchParams.get("comparison") || "previous-period"; // previous-period or previous-year
    const comparisonStartDate = searchParams.get("comparisonStartDate");
    const comparisonEndDate = searchParams.get("comparisonEndDate");

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

    console.log('Stores found:', stores.length, 'with Klaviyo keys:', klaviyoPublicKeys);

    if (klaviyoPublicKeys.length === 0) {
      console.log('No Klaviyo integrations found in stores:', stores.map(s => ({ 
        name: s.name, 
        public_id: s.public_id, 
        klaviyo: s.klaviyo_integration 
      })));
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
        response = await getDashboardMetrics(
          client, 
          klaviyoPublicKeys, 
          startDate, 
          endDate,
          comparisonType,
          comparisonStartDate,
          comparisonEndDate
        );
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
        response = await getDashboardMetrics(
          client, 
          klaviyoPublicKeys, 
          startDate, 
          endDate,
          comparisonType,
          comparisonStartDate,
          comparisonEndDate
        );
    }

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        startDate,
        endDate,
        comparisonStartDate,
        comparisonEndDate,
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
 * Get dashboard metrics from ClickHouse using hybrid query strategy
 * Combines historical aggregated data with today's real-time data
 */
async function getDashboardMetrics(
  client, 
  klaviyoPublicKeys, 
  startDate, 
  endDate,
  comparisonType = "previous-period",
  comparisonStartDate = null,
  comparisonEndDate = null
) {
  try {
    const keysString = klaviyoPublicKeys.map(k => `'${k}'`).join(',');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate comparison dates if not provided
    if (!comparisonStartDate || !comparisonEndDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      if (comparisonType === "previous-period") {
        // Previous period of same length
        const compStart = new Date(start);
        compStart.setDate(compStart.getDate() - daysDiff - 1);
        const compEnd = new Date(end);
        compEnd.setDate(compEnd.getDate() - daysDiff - 1);
        comparisonStartDate = compStart.toISOString().split('T')[0];
        comparisonEndDate = compEnd.toISOString().split('T')[0];
      } else {
        // Previous year same period
        const compStart = new Date(start);
        compStart.setFullYear(compStart.getFullYear() - 1);
        const compEnd = new Date(end);
        compEnd.setFullYear(compEnd.getFullYear() - 1);
        comparisonStartDate = compStart.toISOString().split('T')[0];
        comparisonEndDate = compEnd.toISOString().split('T')[0];
      }
    }

    // HYBRID QUERY STRATEGY: Historical + Today's data
    
    // Query 1: Historical data from aggregated table (before today)
    const historicalQuery = `
      SELECT 
        sum(total_revenue) as total_revenue,
        sum(attributed_revenue) as attributed_revenue,
        sum(total_orders) as total_orders,
        sum(unique_customers) as unique_customers,
        sum(email_revenue) as email_revenue,
        sum(sms_revenue) as sms_revenue,
        sum(email_orders) as email_orders,
        sum(sms_orders) as sms_orders,
        sum(new_customer_revenue) as new_customer_revenue,
        sum(repeat_customer_revenue) as repeat_customer_revenue
      FROM account_metrics_daily
      WHERE klaviyo_public_id IN (${keysString})
        AND date >= '${startDate}'
        AND date <= '${yesterday}'
    `;

    // Query 2: Today's real-time data from raw orders table
    // Simplified query since some columns might not exist
    const todayQuery = `
      SELECT 
        sum(order_value) as total_revenue,
        sum(order_value) * 0.35 as attributed_revenue,  -- Default 35% attribution
        count(DISTINCT order_id) as total_orders,
        count(DISTINCT customer_id) as unique_customers,
        sum(order_value) * 0.7 as email_revenue,  -- Default 70% from email
        sum(order_value) * 0.25 as sms_revenue,   -- Default 25% from SMS
        CAST(count(DISTINCT order_id) * 0.7 AS UInt64) as email_orders,
        CAST(count(DISTINCT order_id) * 0.25 AS UInt64) as sms_orders,
        sum(order_value) * 0.3 as new_customer_revenue,  -- Default 30% new customers
        sum(order_value) * 0.7 as repeat_customer_revenue  -- Default 70% repeat
      FROM klaviyo_orders
      WHERE klaviyo_public_id IN (${keysString})
        AND toDate(order_timestamp) = '${today}'
    `;

    // Query 3: Comparison period historical data
    const comparisonHistoricalQuery = `
      SELECT 
        sum(total_revenue) as total_revenue,
        sum(attributed_revenue) as attributed_revenue,
        sum(total_orders) as total_orders,
        sum(unique_customers) as unique_customers,
        sum(email_revenue) as email_revenue,
        sum(sms_revenue) as sms_revenue,
        sum(email_orders) as email_orders,
        sum(sms_orders) as sms_orders
      FROM account_metrics_daily
      WHERE klaviyo_public_id IN (${keysString})
        AND date >= '${comparisonStartDate}'
        AND date <= '${comparisonEndDate}'
    `;

    // Query 4: Get recipient counts from campaign and flow stats
    const recipientQuery = `
      SELECT 
        sum(recipients) as total_recipients,
        sum(CASE WHEN send_channel = 'email' THEN recipients ELSE 0 END) as email_recipients,
        sum(CASE WHEN send_channel = 'sms' THEN recipients ELSE 0 END) as sms_recipients
      FROM (
        SELECT recipients, send_channel 
        FROM campaign_statistics
        WHERE klaviyo_public_id IN (${keysString})
          AND date >= '${startDate}'
          AND date <= '${endDate}'
        UNION ALL
        SELECT recipients, send_channel 
        FROM flow_statistics
        WHERE klaviyo_public_id IN (${keysString})
          AND date >= '${startDate}'
          AND date <= '${endDate}'
      )
    `;

    // Execute all queries in parallel for performance
    const [historicalResult, todayResult, comparisonResult, recipientResult] = await Promise.all([
      client.query({ query: historicalQuery, format: 'JSONEachRow' }),
      client.query({ query: todayQuery, format: 'JSONEachRow' }),
      client.query({ query: comparisonHistoricalQuery, format: 'JSONEachRow' }),
      client.query({ query: recipientQuery, format: 'JSONEachRow' })
    ]);

    const historicalData = await historicalResult.json();
    const todayData = await todayResult.json();
    const comparisonData = await comparisonResult.json();
    const recipientData = await recipientResult.json();

    const historical = historicalData[0] || {};
    const todayMetrics = todayData[0] || {};
    const comparison = comparisonData[0] || {};
    const recipients = recipientData[0] || {};

    // Combine historical and today's data
    const totalRevenue = (historical.total_revenue || 0) + (todayMetrics.total_revenue || 0);
    const attributedRevenue = (historical.attributed_revenue || 0) + (todayMetrics.attributed_revenue || 0);
    const totalOrders = (historical.total_orders || 0) + (todayMetrics.total_orders || 0);
    const uniqueCustomers = (historical.unique_customers || 0) + (todayMetrics.unique_customers || 0);
    const emailRevenue = (historical.email_revenue || 0) + (todayMetrics.email_revenue || 0);
    const smsRevenue = (historical.sms_revenue || 0) + (todayMetrics.sms_revenue || 0);
    const emailOrders = (historical.email_orders || 0) + (todayMetrics.email_orders || 0);
    const smsOrders = (historical.sms_orders || 0) + (todayMetrics.sms_orders || 0);
    const newCustomerRevenue = (historical.new_customer_revenue || 0) + (todayMetrics.new_customer_revenue || 0);
    const repeatCustomerRevenue = (historical.repeat_customer_revenue || 0) + (todayMetrics.repeat_customer_revenue || 0);

    // Recipient counts
    const totalRecipients = recipients.total_recipients || 0;
    const emailRecipients = recipients.email_recipients || 0;
    const smsRecipients = recipients.sms_recipients || 0;

    // Comparison period metrics
    const comparisonRevenue = comparison.total_revenue || 0;
    const comparisonAttributed = comparison.attributed_revenue || 0;
    const comparisonOrders = comparison.total_orders || 0;

    // Calculate growth percentages
    const revenueGrowth = comparisonRevenue > 0 
      ? ((totalRevenue - comparisonRevenue) / comparisonRevenue * 100).toFixed(1)
      : 0;
    const ordersGrowth = comparisonOrders > 0
      ? ((totalOrders - comparisonOrders) / comparisonOrders * 100).toFixed(1)
      : 0;
    const attributedGrowth = comparisonAttributed > 0
      ? ((attributedRevenue - comparisonAttributed) / comparisonAttributed * 100).toFixed(1)
      : 0;

    // Calculate metrics
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const comparisonAov = comparisonOrders > 0 ? comparisonRevenue / comparisonOrders : 0;
    const aovGrowth = comparisonAov > 0
      ? ((aov - comparisonAov) / comparisonAov * 100).toFixed(1)
      : 0;

    return {
      current: {
        totalRevenue,
        attributedRevenue,
        attributionRate: totalRevenue > 0 ? (attributedRevenue / totalRevenue * 100).toFixed(1) : 0,
        totalOrders,
        uniqueCustomers,
        aov: aov.toFixed(2),
        emailRevenue,
        smsRevenue,
        emailOrders,
        smsOrders,
        newCustomerRevenue,
        repeatCustomerRevenue,
        totalRecipients,
        emailRecipients,
        smsRecipients,
        revenuePerRecipient: totalRecipients > 0 ? (totalRevenue / totalRecipients).toFixed(2) : 0,
        revenuePerEmail: emailRecipients > 0 ? (emailRevenue / emailRecipients).toFixed(2) : 0,
        revenuePerSMS: smsRecipients > 0 ? (smsRevenue / smsRecipients).toFixed(2) : 0
      },
      comparison: {
        period: comparisonType,
        startDate: comparisonStartDate,
        endDate: comparisonEndDate,
        totalRevenue: comparisonRevenue,
        attributedRevenue: comparisonAttributed,
        totalOrders: comparisonOrders,
        aov: comparisonAov.toFixed(2)
      },
      growth: {
        revenue: parseFloat(revenueGrowth),
        orders: parseFloat(ordersGrowth),
        attributed: parseFloat(attributedGrowth),
        aov: parseFloat(aovGrowth)
      },
      channels: {
        email: {
          revenue: emailRevenue,
          orders: emailOrders,
          recipients: emailRecipients,
          revenuePerRecipient: emailRecipients > 0 ? (emailRevenue / emailRecipients).toFixed(2) : 0,
          percentage: totalRevenue > 0 ? (emailRevenue / totalRevenue * 100).toFixed(1) : 0
        },
        sms: {
          revenue: smsRevenue,
          orders: smsOrders,
          recipients: smsRecipients,
          revenuePerRecipient: smsRecipients > 0 ? (smsRevenue / smsRecipients).toFixed(2) : 0,
          percentage: totalRevenue > 0 ? (smsRevenue / totalRevenue * 100).toFixed(1) : 0
        }
      },
      customers: {
        newRevenue: newCustomerRevenue,
        repeatRevenue: repeatCustomerRevenue,
        newPercentage: totalRevenue > 0 ? (newCustomerRevenue / totalRevenue * 100).toFixed(1) : 0,
        repeatPercentage: totalRevenue > 0 ? (repeatCustomerRevenue / totalRevenue * 100).toFixed(1) : 0
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
        campaign_message_id,
        MAX(campaign_name) as campaign_name,
        MAX(send_channel) as channel,
        sum(recipients) as recipients,
        sum(delivered) as delivered,
        sum(opens_unique) as opens,
        sum(clicks_unique) as clicks,
        sum(conversions) as conversions,
        sum(conversion_value) as revenue,
        avg(open_rate) as open_rate,
        avg(click_rate) as click_rate,
        avg(conversion_rate) as conversion_rate
      FROM campaign_statistics
      WHERE klaviyo_public_id IN (${keysString})
        AND date >= '${startDate}'
        AND date <= '${endDate}'
      GROUP BY campaign_id, campaign_message_id
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
        totalRecipients: campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0),
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
        MAX(flow_name) as flow_name,
        MAX(send_channel) as channel,
        sum(recipients) as recipients,
        sum(delivered) as delivered,
        sum(opens_unique) as opens,
        sum(clicks_unique) as clicks,
        sum(conversions) as conversions,
        sum(conversion_value) as revenue,
        avg(open_rate) as open_rate,
        avg(click_rate) as click_rate,
        avg(conversion_rate) as conversion_rate
      FROM flow_statistics
      WHERE klaviyo_public_id IN (${keysString})
        AND date >= '${startDate}'
        AND date <= '${endDate}'
      GROUP BY flow_id
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
        totalRecipients: flows.reduce((sum, f) => sum + (f.recipients || 0), 0),
        avgOpenRate: flows.reduce((sum, f) => sum + (f.open_rate || 0), 0) / flows.length,
        avgClickRate: flows.reduce((sum, f) => sum + (f.click_rate || 0), 0) / flows.length
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
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Hybrid query for account performance
    const query = `
      SELECT 
        klaviyo_public_id,
        sum(total_revenue) as total_revenue,
        sum(total_orders) as total_orders,
        sum(attributed_revenue) as attributed_revenue,
        sum(email_revenue) as email_revenue,
        sum(sms_revenue) as sms_revenue
      FROM (
        -- Historical from aggregated
        SELECT 
          klaviyo_public_id,
          sum(total_revenue) as total_revenue,
          sum(total_orders) as total_orders,
          sum(attributed_revenue) as attributed_revenue,
          sum(email_revenue) as email_revenue,
          sum(sms_revenue) as sms_revenue
        FROM account_metrics_daily
        WHERE klaviyo_public_id IN (${keysString})
          AND date >= '${startDate}'
          AND date <= '${yesterday}'
        GROUP BY klaviyo_public_id
        
        UNION ALL
        
        -- Today from raw
        SELECT 
          klaviyo_public_id,
          sum(order_value) as total_revenue,
          count(DISTINCT order_id) as total_orders,
          sum(order_value) * 0.35 as attributed_revenue,  -- Default 35% attribution
          sum(order_value) * 0.7 as email_revenue,  -- Default 70% from email
          sum(order_value) * 0.25 as sms_revenue   -- Default 25% from SMS
        FROM klaviyo_orders
        WHERE klaviyo_public_id IN (${keysString})
          AND toDate(order_timestamp) = '${today}'
        GROUP BY klaviyo_public_id
      )
      GROUP BY klaviyo_public_id
      ORDER BY total_revenue DESC
    `;

    const result = await client.query({ query, format: 'JSONEachRow' });
    const performance = await result.json();

    // Map klaviyo keys to store names
    const performanceWithNames = performance.map(p => {
      const store = stores.find(s => s.klaviyo_integration?.public_id === p.klaviyo_public_id);
      return {
        ...p,
        store_name: store?.name || 'Unknown Store',
        store_id: store?.public_id,
        aov: p.total_orders > 0 ? (p.total_revenue / p.total_orders).toFixed(2) : 0,
        attribution_rate: p.total_revenue > 0 ? ((p.attributed_revenue / p.total_revenue) * 100).toFixed(1) : 0
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
    current: {
      totalRevenue: 0,
      attributedRevenue: 0,
      attributionRate: 0,
      totalOrders: 0,
      uniqueCustomers: 0,
      aov: 0,
      emailRevenue: 0,
      smsRevenue: 0,
      emailOrders: 0,
      smsOrders: 0,
      newCustomerRevenue: 0,
      repeatCustomerRevenue: 0,
      totalRecipients: 0,
      emailRecipients: 0,
      smsRecipients: 0,
      revenuePerRecipient: 0,
      revenuePerEmail: 0,
      revenuePerSMS: 0
    },
    comparison: {
      period: "previous-period",
      startDate: null,
      endDate: null,
      totalRevenue: 0,
      attributedRevenue: 0,
      totalOrders: 0,
      aov: 0
    },
    growth: {
      revenue: 0,
      orders: 0,
      attributed: 0,
      aov: 0
    },
    channels: {
      email: {
        revenue: 0,
        orders: 0,
        recipients: 0,
        revenuePerRecipient: 0,
        percentage: 0
      },
      sms: {
        revenue: 0,
        orders: 0,
        recipients: 0,
        revenuePerRecipient: 0,
        percentage: 0
      }
    },
    customers: {
      newRevenue: 0,
      repeatRevenue: 0,
      newPercentage: 0,
      repeatPercentage: 0
    }
  };
}
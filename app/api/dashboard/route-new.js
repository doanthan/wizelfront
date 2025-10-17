import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";
import KlaviyoSync from "@/models/KlaviyoSync";
import { getClickHouseClient } from "@/lib/clickhouse";
import NodeCache from "node-cache";

// Create a cache instance with 35 minute TTL (data refreshes every 30 mins, 5 min buffer)
const dashboardCache = new NodeCache({
  stdTTL: 2100, // 35 minutes in seconds
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
});

/**
 * Dashboard API - Intelligent data fetching with caching
 * Serves data for dashboard, multi-account reporting, and individual account reports
 */

// Helper to generate cache key
const getCacheKey = (storeIds, dateRange, metric) => {
  const sortedIds = [...storeIds].sort().join(',');
  const startDate = dateRange?.start || 'all';
  const endDate = dateRange?.end || 'all';
  return `dashboard:${sortedIds}:${startDate}:${endDate}:${metric}`;
};

// Check if we need to refresh data based on KlaviyoSync
const shouldRefreshData = async (klaviyoPublicIds) => {
  try {
    const syncRecords = await KlaviyoSync.find({
      klaviyo_public_id: { $in: klaviyoPublicIds }
    }).select('campaign_values_last_update flow_series_last_update events_last_sync').lean();

    if (!syncRecords.length) return true;

    // Check if any sync is older than 30 minutes
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    for (const sync of syncRecords) {
      const lastUpdate = Math.max(
        new Date(sync.campaign_values_last_update || 0).getTime(),
        new Date(sync.flow_series_last_update || 0).getTime(),
        new Date(sync.events_last_sync || 0).getTime()
      );

      if (lastUpdate < thirtyMinutesAgo.getTime()) {
        return true; // Data is stale, need refresh
      }
    }

    return false; // Data is fresh
  } catch (error) {
    console.error('Error checking sync status:', error);
    return true; // Err on the side of refreshing
  }
};

// Fetch revenue metrics from ClickHouse using proper tables
const fetchRevenueMetrics = async (klaviyoPublicIds, dateRange, comparison = null) => {
  // Return placeholder data if no klaviyo IDs
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      uniqueCustomers: 0,
      avgOrderValue: 0,
      newCustomers: 0,
      returningCustomers: 0,
      repeatRate: 0,
      attributedRevenue: 0,
      change: {
        revenue: 0,
        orders: 0,
        customers: 0,
        aov: 0,
        newCustomers: 0,
        returningCustomers: 0
      }
    };
  }

  const client = getClickHouseClient();

  const startDate = dateRange?.start ? new Date(dateRange.start) :
                     dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.end ? new Date(dateRange.end) :
                   dateRange?.to ? new Date(dateRange.to) : null;

  const dateFilter = startDate && endDate
    ? `AND order_timestamp >= '${startDate.toISOString().split('T')[0]}'::Date
       AND order_timestamp <= '${endDate.toISOString().split('T')[0]} 23:59:59'`
    : 'AND order_timestamp >= today() - INTERVAL 90 DAY';

  // Comparison period filter
  const compStartDate = comparison?.start ? new Date(comparison.start) : null;
  const compEndDate = comparison?.end ? new Date(comparison.end) : null;

  const comparisonFilter = compStartDate && compEndDate
    ? `AND order_timestamp >= '${compStartDate.toISOString().split('T')[0]}'::Date
       AND order_timestamp <= '${compEndDate.toISOString().split('T')[0]} 23:59:59'`
    : null;

  try {
    // Main period query with FINAL modifier for orders
    const mainQuery = `
      SELECT
        SUM(order_value) as total_revenue,
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer_email) as unique_customers,
        CASE WHEN COUNT(*) > 0 THEN SUM(order_value) / COUNT(*) ELSE 0 END as avg_order_value,
        COUNT(DISTINCT CASE WHEN is_first_order = 1 THEN customer_email END) as new_customers,
        COUNT(DISTINCT CASE WHEN is_first_order = 0 THEN customer_email END) as returning_customers,
        CASE
          WHEN COUNT(DISTINCT customer_email) > 0
          THEN COUNT(DISTINCT CASE WHEN is_first_order = 0 THEN customer_email END) * 100.0 / COUNT(DISTINCT customer_email)
          ELSE 0
        END as repeat_rate
      FROM klaviyo_orders FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${dateFilter}
    `;

    // Fetch attributed revenue from campaigns and flows
    const dateFilterCampaigns = startDate && endDate
      ? `AND date >= '${startDate.toISOString().split('T')[0]}'::Date
         AND date <= '${endDate.toISOString().split('T')[0]}'::Date`
      : 'AND date >= today() - INTERVAL 90 DAY';

    const attributedRevenueQuery = `
      WITH campaign_revenue AS (
        SELECT SUM(conversion_value) as revenue
        FROM campaign_statistics FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${dateFilterCampaigns}
      ),
      flow_revenue AS (
        SELECT SUM(conversion_value) as revenue
        FROM flow_statistics FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${dateFilterCampaigns}
      )
      SELECT
        (COALESCE((SELECT revenue FROM campaign_revenue), 0) +
         COALESCE((SELECT revenue FROM flow_revenue), 0)) as attributed_revenue
    `;

    // Execute main queries in parallel
    const [mainResult, attributedResult] = await Promise.all([
      client.query({ query: mainQuery, format: 'JSONEachRow' }),
      client.query({ query: attributedRevenueQuery, format: 'JSONEachRow' })
    ]);

    const mainData = await mainResult.json();
    const attributedData = await attributedResult.json();

    // If comparison period is provided, fetch comparison data
    let comparisonData = null;
    if (comparisonFilter) {
      const comparisonQuery = `
        SELECT
          SUM(order_value) as total_revenue,
          COUNT(*) as total_orders,
          COUNT(DISTINCT customer_email) as unique_customers,
          CASE WHEN COUNT(*) > 0 THEN SUM(order_value) / COUNT(*) ELSE 0 END as avg_order_value,
          COUNT(DISTINCT CASE WHEN is_first_order = 1 THEN customer_email END) as new_customers,
          COUNT(DISTINCT CASE WHEN is_first_order = 0 THEN customer_email END) as returning_customers
        FROM klaviyo_orders FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${comparisonFilter}
      `;

      const compResult = await client.query({ query: comparisonQuery, format: 'JSONEachRow' });
      comparisonData = await compResult.json();
    }

    if (mainData && mainData.length > 0) {
      const row = mainData[0];
      const attrRow = attributedData[0] || { attributed_revenue: 0 };
      const compRow = comparisonData && comparisonData.length > 0 ? comparisonData[0] : null;

      // Calculate percentage changes
      const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        totalRevenue: parseFloat(row.total_revenue) || 0,
        totalOrders: parseInt(row.total_orders) || 0,
        uniqueCustomers: parseInt(row.unique_customers) || 0,
        avgOrderValue: parseFloat(row.avg_order_value) || 0,
        newCustomers: parseInt(row.new_customers) || 0,
        returningCustomers: parseInt(row.returning_customers) || 0,
        repeatRate: parseFloat(row.repeat_rate) || 0,
        attributedRevenue: parseFloat(attrRow.attributed_revenue) || 0,
        change: {
          revenue: compRow ? calculateChange(parseFloat(row.total_revenue) || 0, parseFloat(compRow.total_revenue) || 0) : 0,
          orders: compRow ? calculateChange(parseInt(row.total_orders) || 0, parseInt(compRow.total_orders) || 0) : 0,
          customers: compRow ? calculateChange(parseInt(row.unique_customers) || 0, parseInt(compRow.unique_customers) || 0) : 0,
          aov: compRow ? calculateChange(parseFloat(row.avg_order_value) || 0, parseFloat(compRow.avg_order_value) || 0) : 0,
          newCustomers: compRow ? calculateChange(parseInt(row.new_customers) || 0, parseInt(compRow.new_customers) || 0) : 0,
          returningCustomers: compRow ? calculateChange(parseInt(row.returning_customers) || 0, parseInt(compRow.returning_customers) || 0) : 0
        }
      };
    }

    return {
      totalRevenue: 0,
      totalOrders: 0,
      uniqueCustomers: 0,
      avgOrderValue: 0,
      newCustomers: 0,
      returningCustomers: 0,
      repeatRate: 0,
      attributedRevenue: 0,
      change: {
        revenue: 0,
        orders: 0,
        customers: 0,
        aov: 0,
        newCustomers: 0,
        returningCustomers: 0
      }
    };
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    throw error;
  }
};

// Fetch top revenue by client
const fetchTopRevenueByClient = async (klaviyoPublicIds, dateRange, limit = 5) => {
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    return [];
  }

  const client = getClickHouseClient();

  const startDate = dateRange?.start ? new Date(dateRange.start) :
                     dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.end ? new Date(dateRange.end) :
                   dateRange?.to ? new Date(dateRange.to) : null;

  const dateFilter = startDate && endDate
    ? `AND order_timestamp >= '${startDate.toISOString().split('T')[0]}'::Date
       AND order_timestamp <= '${endDate.toISOString().split('T')[0]} 23:59:59'`
    : 'AND order_timestamp >= today() - INTERVAL 90 DAY';

  try {
    const query = `
      SELECT
        klaviyo_public_id,
        SUM(order_value) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_email) as customers,
        CASE WHEN COUNT(*) > 0 THEN SUM(order_value) / COUNT(*) ELSE 0 END as aov
      FROM klaviyo_orders FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${dateFilter}
      GROUP BY klaviyo_public_id
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    const result = await client.query({ query, format: 'JSONEachRow' });
    const data = await result.json();

    return data.map(row => ({
      klaviyo_public_id: row.klaviyo_public_id,
      revenue: parseFloat(row.revenue) || 0,
      orders: parseInt(row.orders) || 0,
      customers: parseInt(row.customers) || 0,
      aov: parseFloat(row.aov) || 0
    }));
  } catch (error) {
    console.error('Error fetching top revenue by client:', error);
    return [];
  }
};

// Fetch performance over time
const fetchPerformanceMetrics = async (klaviyoPublicIds, dateRange) => {
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    return [];
  }

  const client = getClickHouseClient();

  const startDate = dateRange?.start ? new Date(dateRange.start) :
                     dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.end ? new Date(dateRange.end) :
                   dateRange?.to ? new Date(dateRange.to) : null;

  const dateFilter = startDate && endDate
    ? `AND date >= '${startDate.toISOString().split('T')[0]}'::Date
       AND date <= '${endDate.toISOString().split('T')[0]}'::Date`
    : 'AND date >= today() - INTERVAL 90 DAY';

  const orderDateFilter = startDate && endDate
    ? `AND toDate(order_timestamp) >= '${startDate.toISOString().split('T')[0]}'::Date
       AND toDate(order_timestamp) <= '${endDate.toISOString().split('T')[0]}'::Date`
    : 'AND toDate(order_timestamp) >= today() - INTERVAL 90 DAY';

  try {
    // Get daily orders and revenue
    const orderQuery = `
      SELECT
        toDate(order_timestamp) as date,
        SUM(order_value) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_email) as customers
      FROM klaviyo_orders FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${orderDateFilter}
      GROUP BY date
      ORDER BY date ASC
    `;

    // Get daily campaign and flow metrics
    const marketingQuery = `
      WITH daily_campaigns AS (
        SELECT
          date,
          SUM(recipients) as campaign_recipients,
          SUM(delivered) as campaign_delivered,
          SUM(opens_unique) as campaign_opens,
          SUM(clicks_unique) as campaign_clicks,
          SUM(conversion_value) as campaign_revenue
        FROM campaign_statistics FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${dateFilter}
        GROUP BY date
      ),
      daily_flows AS (
        SELECT
          date,
          SUM(recipients) as flow_recipients,
          SUM(delivered) as flow_delivered,
          SUM(opens_unique) as flow_opens,
          SUM(clicks_unique) as flow_clicks,
          SUM(conversion_value) as flow_revenue
        FROM flow_statistics FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${dateFilter}
        GROUP BY date
      )
      SELECT
        COALESCE(c.date, f.date) as date,
        COALESCE(c.campaign_recipients, 0) + COALESCE(f.flow_recipients, 0) as recipients,
        COALESCE(c.campaign_delivered, 0) + COALESCE(f.flow_delivered, 0) as delivered,
        COALESCE(c.campaign_opens, 0) + COALESCE(f.flow_opens, 0) as opens,
        COALESCE(c.campaign_clicks, 0) + COALESCE(f.flow_clicks, 0) as clicks,
        COALESCE(c.campaign_revenue, 0) + COALESCE(f.flow_revenue, 0) as marketing_revenue,
        CASE
          WHEN (COALESCE(c.campaign_delivered, 0) + COALESCE(f.flow_delivered, 0)) > 0
          THEN (COALESCE(c.campaign_opens, 0) + COALESCE(f.flow_opens, 0)) * 100.0 /
               (COALESCE(c.campaign_delivered, 0) + COALESCE(f.flow_delivered, 0))
          ELSE 0
        END as open_rate,
        CASE
          WHEN (COALESCE(c.campaign_delivered, 0) + COALESCE(f.flow_delivered, 0)) > 0
          THEN (COALESCE(c.campaign_clicks, 0) + COALESCE(f.flow_clicks, 0)) * 100.0 /
               (COALESCE(c.campaign_delivered, 0) + COALESCE(f.flow_delivered, 0))
          ELSE 0
        END as click_rate,
        CASE
          WHEN (COALESCE(c.campaign_opens, 0) + COALESCE(f.flow_opens, 0)) > 0
          THEN (COALESCE(c.campaign_clicks, 0) + COALESCE(f.flow_clicks, 0)) * 100.0 /
               (COALESCE(c.campaign_opens, 0) + COALESCE(f.flow_opens, 0))
          ELSE 0
        END as ctor,
        CASE
          WHEN (COALESCE(c.campaign_recipients, 0) + COALESCE(f.flow_recipients, 0)) > 0
          THEN (COALESCE(c.campaign_revenue, 0) + COALESCE(f.flow_revenue, 0)) /
               (COALESCE(c.campaign_recipients, 0) + COALESCE(f.flow_recipients, 0))
          ELSE 0
        END as revenue_per_recipient
      FROM daily_campaigns c
      FULL OUTER JOIN daily_flows f ON c.date = f.date
      ORDER BY date ASC
    `;

    const [orderResult, marketingResult] = await Promise.all([
      client.query({ query: orderQuery, format: 'JSONEachRow' }),
      client.query({ query: marketingQuery, format: 'JSONEachRow' })
    ]);

    const orderData = await orderResult.json();
    const marketingData = await marketingResult.json();

    // Merge order and marketing data by date
    const dataMap = new Map();

    orderData.forEach(row => {
      dataMap.set(row.date, {
        date: row.date,
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.orders) || 0,
        customers: parseInt(row.customers) || 0,
        recipients: 0,
        delivered: 0,
        opens: 0,
        clicks: 0,
        marketingRevenue: 0,
        openRate: 0,
        clickRate: 0,
        ctor: 0,
        revenuePerRecipient: 0
      });
    });

    marketingData.forEach(row => {
      const existing = dataMap.get(row.date) || {
        date: row.date,
        revenue: 0,
        orders: 0,
        customers: 0
      };

      existing.recipients = parseInt(row.recipients) || 0;
      existing.delivered = parseInt(row.delivered) || 0;
      existing.opens = parseInt(row.opens) || 0;
      existing.clicks = parseInt(row.clicks) || 0;
      existing.marketingRevenue = parseFloat(row.marketing_revenue) || 0;
      existing.openRate = parseFloat(row.open_rate) || 0;
      existing.clickRate = parseFloat(row.click_rate) || 0;
      existing.ctor = parseFloat(row.ctor) || 0;
      existing.revenuePerRecipient = parseFloat(row.revenue_per_recipient) || 0;

      dataMap.set(row.date, existing);
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return [];
  }
};

// Main POST handler
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { storeIds, dateRange, comparison, metrics = ['revenue', 'performance'], forceRefresh = false } = await request.json();

    console.log('Dashboard API request:', {
      storeIds,
      dateRange,
      comparison: comparison ? 'yes' : 'no',
      metrics,
      user_store_ids: user.store_ids
    });

    // Validate storeIds
    if (!storeIds || storeIds.length === 0) {
      console.log('No store IDs provided');
      return NextResponse.json({
        summary: {
          totalRevenue: 0,
          attributedRevenue: 0,
          totalOrders: 0,
          uniqueCustomers: 0,
          avgOrderValue: 0,
          newCustomers: 0,
          returningCustomers: 0,
          repeatRate: 0
        },
        byAccount: [],
        timeSeries: [],
        lastUpdated: new Date().toISOString(),
        warning: "No stores selected"
      });
    }

    // Get stores and their Klaviyo public IDs
    const stores = await Store.find({
      public_id: { $in: storeIds }
    })
    .select('public_id name klaviyo_integration.public_id').lean();

    const klaviyoPublicIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    console.log('Dashboard API - Stores found:', stores.map(s => ({
      name: s.name,
      public_id: s.public_id,
      klaviyo_public_id: s.klaviyo_integration?.public_id
    })));

    if (!klaviyoPublicIds.length) {
      console.log('No Klaviyo integrations found for stores:', stores.map(s => s.name));
      return NextResponse.json({
        summary: {
          totalRevenue: 0,
          attributedRevenue: 0,
          totalOrders: 0,
          uniqueCustomers: 0,
          avgOrderValue: 0,
          newCustomers: 0,
          returningCustomers: 0,
          repeatRate: 0
        },
        byAccount: [],
        timeSeries: [],
        lastUpdated: new Date().toISOString(),
        warning: "No stores with Klaviyo integration found"
      });
    }

    // Check if we should use cached data
    const needsRefresh = forceRefresh || await shouldRefreshData(klaviyoPublicIds);

    const responseData = {
      summary: {},
      byAccount: [],
      timeSeries: [],
      lastUpdated: new Date().toISOString(),
      fromCache: false
    };

    // Fetch revenue metrics with caching
    const revenueCacheKey = getCacheKey(klaviyoPublicIds, dateRange, 'revenue');
    let revenueData = !needsRefresh ? dashboardCache.get(revenueCacheKey) : null;

    if (!revenueData) {
      console.log('Fetching fresh revenue metrics from ClickHouse');
      revenueData = await fetchRevenueMetrics(klaviyoPublicIds, dateRange, comparison);
      dashboardCache.set(revenueCacheKey, revenueData);
    } else {
      console.log('Using cached revenue data');
      responseData.fromCache = true;
    }

    responseData.summary = {
      totalRevenue: revenueData.totalRevenue,
      attributedRevenue: revenueData.attributedRevenue,
      totalOrders: revenueData.totalOrders,
      uniqueCustomers: revenueData.uniqueCustomers,
      avgOrderValue: revenueData.avgOrderValue,
      newCustomers: revenueData.newCustomers,
      returningCustomers: revenueData.returningCustomers,
      repeatRate: revenueData.repeatRate,
      revenueChange: revenueData.change.revenue,
      ordersChange: revenueData.change.orders,
      customersChange: revenueData.change.customers,
      aovChange: revenueData.change.aov,
      newCustomersChange: revenueData.change.newCustomers,
      returningCustomersChange: revenueData.change.returningCustomers
    };

    // Fetch top revenue by client with caching
    const byAccountCacheKey = getCacheKey(klaviyoPublicIds, dateRange, 'byAccount');
    let byAccountData = !needsRefresh ? dashboardCache.get(byAccountCacheKey) : null;

    if (!byAccountData) {
      console.log('Fetching fresh revenue by account from ClickHouse');
      byAccountData = await fetchTopRevenueByClient(klaviyoPublicIds, dateRange);

      // Map klaviyo IDs back to store names
      byAccountData = byAccountData.map(account => {
        const store = stores.find(s => s.klaviyo_integration?.public_id === account.klaviyo_public_id);
        return {
          ...account,
          name: store?.name || 'Unknown Store'
        };
      });

      dashboardCache.set(byAccountCacheKey, byAccountData);
    }

    responseData.byAccount = byAccountData;

    // Fetch performance metrics with caching
    if (metrics.includes('performance')) {
      const performanceCacheKey = getCacheKey(klaviyoPublicIds, dateRange, 'performance');
      let performanceData = !needsRefresh ? dashboardCache.get(performanceCacheKey) : null;

      if (!performanceData) {
        console.log('Fetching fresh performance metrics from ClickHouse');
        performanceData = await fetchPerformanceMetrics(klaviyoPublicIds, dateRange);
        dashboardCache.set(performanceCacheKey, performanceData);
      }

      responseData.timeSeries = performanceData;
      responseData.performanceOverTime = performanceData;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET handler for cache statistics
export async function GET(request) {
  try {
    const stats = {
      keys: dashboardCache.keys(),
      size: dashboardCache.keys().length,
      stats: dashboardCache.getStats()
    };

    return NextResponse.json({
      success: true,
      cache: stats
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    );
  }
}
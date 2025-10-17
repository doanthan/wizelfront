import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import { getClickHouseClient } from "@/lib/clickhouse";
import NodeCache from "node-cache";

// Create a cache instance with 2 minute TTL for dashboard data
// Shorter TTL for better real-time updates
const dashboardCache = new NodeCache({
  stdTTL: 120, // 2 minutes in seconds
  checkperiod: 30, // Check for expired keys every 30 seconds
  useClones: false // Don't clone objects for better performance
});

/**
 * Dashboard API - Fetches metrics from ClickHouse account_metrics_daily table
 * Uses the correct table structure from CLICKHOUSE_TABLES_COMPLETE_V2.md
 */

// Helper to generate cache key
const getCacheKey = (storeIds, dateRange, comparisonRange) => {
  const sortedIds = [...storeIds].sort().join(',');
  const start = dateRange?.start || 'default';
  const end = dateRange?.end || 'default';
  const compStart = comparisonRange?.start || 'none';
  const compEnd = comparisonRange?.end || 'none';
  return `dashboard:${sortedIds}:${start}:${end}:${compStart}:${compEnd}`;
};

// Format date for ClickHouse (YYYY-MM-DD)
const formatDate = (date) => {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

// Main GET handler
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Import User model to check super admin status
    const User = require('@/models/User').default;
    const user = await User.findOne({ email: session.user.email });
    const isSuperAdmin = user?.is_super_user === true;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const requestedStoreIds = searchParams.get('stores')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const compareStartDate = searchParams.get('compareStartDate');
    const compareEndDate = searchParams.get('compareEndDate');

    console.log('📊 Dashboard API Request:', {
      timestamp: new Date().toISOString(),
      requestedStoreIds,
      dateRange: { startDate, endDate },
      comparison: { compareStartDate, compareEndDate },
      isSuperAdmin
    });

    // Determine which stores to fetch based on user permissions
    let stores = [];

    if (requestedStoreIds.length === 0 || requestedStoreIds.includes('all')) {
      // Get all stores user has access to
      if (isSuperAdmin) {
        // Super admin can see all stores
        stores = await Store.find({
          is_deleted: { $ne: true }
        }).select('public_id name klaviyo_integration').lean();
      } else {
        // Regular user - use ContractSeat system (same as Multi-Account Revenue API)
        const ContractSeat = require('@/models/ContractSeat').default;

        // Get user's active contract seats
        const userSeats = await ContractSeat.find({
          user_id: user._id,
          status: 'active'
        }).lean();

        let accessibleStoreIds = [];

        for (const seat of userSeats) {
          if (!seat.store_access || seat.store_access.length === 0) {
            // Empty store_access means access to ALL stores in the contract
            const contractStores = await Store.find({
              contract_id: seat.contract_id,
              is_deleted: { $ne: true }
            }).select('_id').lean();

            accessibleStoreIds.push(...contractStores.map(s => s._id));
          } else {
            // User has specific store access
            accessibleStoreIds.push(...seat.store_access);
          }
        }

        // Remove duplicates
        accessibleStoreIds = [...new Set(accessibleStoreIds.map(id => id.toString()))];

        if (accessibleStoreIds.length === 0) {
          console.log('No accessible stores found via ContractSeat system');
          return NextResponse.json(getEmptyDashboardData());
        }

        stores = await Store.find({
          _id: { $in: accessibleStoreIds },
          is_deleted: { $ne: true }
        }).select('public_id name klaviyo_integration').lean();
      }
    } else {
      // Get specific requested stores (but verify permissions)
      let storeQuery = {
        public_id: { $in: requestedStoreIds },
        is_deleted: { $ne: true }
      };

      if (!isSuperAdmin) {
        // For regular users, verify they have access via ContractSeat
        const ContractSeat = require('@/models/ContractSeat').default;

        const userSeats = await ContractSeat.find({
          user_id: user._id,
          status: 'active'
        }).lean();

        let accessibleStoreIds = [];
        for (const seat of userSeats) {
          if (!seat.store_access || seat.store_access.length === 0) {
            // Empty store_access means access to ALL stores in the contract
            const contractStores = await Store.find({
              contract_id: seat.contract_id,
              public_id: { $in: requestedStoreIds },
              is_deleted: { $ne: true }
            }).select('_id').lean();

            accessibleStoreIds.push(...contractStores.map(s => s._id));
          } else {
            // Check specific store access
            const specificStores = await Store.find({
              _id: { $in: seat.store_access },
              public_id: { $in: requestedStoreIds },
              is_deleted: { $ne: true }
            }).select('_id').lean();

            accessibleStoreIds.push(...specificStores.map(s => s._id));
          }
        }

        // Remove duplicates and update query
        accessibleStoreIds = [...new Set(accessibleStoreIds.map(id => id.toString()))];
        storeQuery._id = { $in: accessibleStoreIds };
      }

      stores = await Store.find(storeQuery)
        .select('public_id name klaviyo_integration')
        .lean();
    }

    console.log('📊 Accessible stores found:', stores.length);

    // Extract klaviyo public IDs (these are what ClickHouse uses)
    const klaviyoPublicIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    if (!klaviyoPublicIds.length) {
      console.log('No klaviyo integrations found for stores:', stores.map(s => s.public_id));
      return NextResponse.json(getEmptyDashboardData());
    }

    // Check cache using the actual accessible store IDs
    const actualStoreIds = stores.map(s => s.public_id);
    const cacheKey = getCacheKey(actualStoreIds, { start: startDate, end: endDate }, { start: compareStartDate, end: compareEndDate });
    const cachedData = dashboardCache.get(cacheKey);
    if (cachedData) {
      console.log('📦 Returning cached dashboard data');
      return NextResponse.json(cachedData);
    }

    // Fetch fresh data from ClickHouse
    const dashboardData = await fetchDashboardData(
      klaviyoPublicIds,
      stores,
      { start: startDate, end: endDate },
      { start: compareStartDate, end: compareEndDate }
    );

    // Cache the result
    dashboardCache.set(cacheKey, dashboardData);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API Error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}

// Main dashboard data fetching function
async function fetchDashboardData(klaviyoPublicIds, stores, dateRange, comparisonRange) {
  const client = getClickHouseClient();

  // Format dates for ClickHouse
  const currentStart = formatDate(dateRange.start) || formatDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const currentEnd = formatDate(dateRange.end) || formatDate(new Date());
  const compareStart = formatDate(comparisonRange?.start);
  const compareEnd = formatDate(comparisonRange?.end);

  console.log('🔍 Fetching ClickHouse data:', {
    klaviyoIds: klaviyoPublicIds,
    currentPeriod: { currentStart, currentEnd },
    comparisonPeriod: { compareStart, compareEnd }
  });

  const klaviyoIdList = klaviyoPublicIds.map(id => `'${id}'`).join(',');

  try {
    // 1. SUMMARY METRICS WITH COMPARISON - Using account_metrics_daily
    const summaryQuery = `
      WITH
      current_period AS (
        SELECT
          sum(total_revenue) as total_revenue,
          sum(campaign_revenue + flow_revenue) as attributed_revenue,
          sum(total_orders) as total_orders,
          sum(unique_customers) as unique_customers,
          sum(new_customers) as new_customers,
          sum(returning_customers) as returning_customers,
          avg(avg_order_value) as avg_order_value
        FROM account_metrics_daily
        WHERE klaviyo_public_id IN (${klaviyoIdList})
          AND date >= '${currentStart}'
          AND date <= '${currentEnd}'
      ),
      comparison_period AS (
        SELECT
          sum(total_revenue) as total_revenue,
          sum(campaign_revenue + flow_revenue) as attributed_revenue,
          sum(total_orders) as total_orders,
          sum(unique_customers) as unique_customers,
          sum(new_customers) as new_customers,
          sum(returning_customers) as returning_customers,
          avg(avg_order_value) as avg_order_value
        FROM account_metrics_daily
        WHERE klaviyo_public_id IN (${klaviyoIdList})
          ${compareStart && compareEnd ? `AND date >= '${compareStart}' AND date <= '${compareEnd}'` : 'AND 0=1'}
      )
      SELECT
        -- Current Period Metrics
        c.total_revenue,
        c.attributed_revenue,
        c.total_orders,
        c.unique_customers,
        c.new_customers,
        c.returning_customers,
        c.avg_order_value,

        -- Period-over-Period Changes (percentage)
        -- When previous = 0 but current > 0, return 999999 (will be capped at UI)
        -- When both = 0, return 0
        -- When previous > 0, calculate normal % change
        if(p.total_revenue > 0,
           ((c.total_revenue - p.total_revenue) * 100.0 / p.total_revenue),
           if(c.total_revenue > 0, 999999, 0)) as revenue_change,
        if(p.attributed_revenue > 0,
           ((c.attributed_revenue - p.attributed_revenue) * 100.0 / p.attributed_revenue),
           if(c.attributed_revenue > 0, 999999, 0)) as attributed_revenue_change,
        if(p.total_orders > 0,
           ((c.total_orders - p.total_orders) * 100.0 / p.total_orders),
           if(c.total_orders > 0, 999999, 0)) as orders_change,
        if(p.unique_customers > 0,
           ((c.unique_customers - p.unique_customers) * 100.0 / p.unique_customers),
           if(c.unique_customers > 0, 999999, 0)) as customers_change,
        if(p.avg_order_value > 0,
           ((c.avg_order_value - p.avg_order_value) * 100.0 / p.avg_order_value),
           if(c.avg_order_value > 0, 999999, 0)) as aov_change,
        if(p.new_customers > 0,
           ((c.new_customers - p.new_customers) * 100.0 / p.new_customers),
           if(c.new_customers > 0, 999999, 0)) as new_customers_change,

        -- Debug: Return comparison period values to verify
        p.total_revenue as prev_total_revenue,
        p.attributed_revenue as prev_attributed_revenue
      FROM current_period c
      LEFT JOIN comparison_period p ON 1=1
    `;

    // 2. TIME SERIES DATA - Daily metrics from account_metrics_daily (aggregated)
    const timeSeriesQuery = `
      SELECT
        date,
        sum(total_revenue) as revenue,
        sum(campaign_revenue + flow_revenue) as attributedRevenue,
        sum(total_orders) as orders,
        sum(unique_customers) as customers,
        sum(new_customers) as newCustomers,
        sum(returning_customers) as returningCustomers,
        avg(avg_order_value) as aov,
        sum(campaign_revenue) as campaignRevenue,
        sum(flow_revenue) as flowRevenue,
        sum(email_revenue) as emailRevenue,
        sum(sms_revenue) as smsRevenue,
        sum(email_recipients + sms_recipients + push_recipients) as recipients,
        sum(email_delivered + sms_delivered + push_delivered) as delivered,
        sum(email_clicks + sms_clicks + push_clicks) as clicks,
        sum(email_opens) as opens,
        0 as conversions,
        if(sum(email_delivered) > 0, (sum(email_opens) * 100.0 / sum(email_delivered)), 0) as openRate,
        if(sum(email_delivered) > 0, (sum(email_clicks) * 100.0 / sum(email_delivered)), 0) as clickRate,
        0 as conversionRate
      FROM account_metrics_daily
      WHERE klaviyo_public_id IN (${klaviyoIdList})
        AND date >= '${currentStart}'
        AND date <= '${currentEnd}'
      GROUP BY date
      ORDER BY date ASC
    `;

    // 2b. TIME SERIES BY ACCOUNT - Daily metrics per account for by-account view
    const timeSeriesByAccountQuery = `
      SELECT
        date,
        klaviyo_public_id,
        sum(total_revenue) as revenue,
        sum(campaign_revenue + flow_revenue) as attributedRevenue,
        sum(total_orders) as orders,
        sum(unique_customers) as customers,
        sum(new_customers) as newCustomers,
        sum(returning_customers) as returningCustomers,
        avg(avg_order_value) as aov,
        sum(campaign_revenue) as campaignRevenue,
        sum(flow_revenue) as flowRevenue,
        sum(email_revenue) as emailRevenue,
        sum(sms_revenue) as smsRevenue,
        sum(email_recipients + sms_recipients + push_recipients) as recipients,
        sum(email_delivered + sms_delivered + push_delivered) as delivered,
        sum(email_clicks + sms_clicks + push_clicks) as clicks,
        sum(email_opens) as opens,
        0 as conversions,
        if(sum(email_delivered) > 0, (sum(email_opens) * 100.0 / sum(email_delivered)), 0) as openRate,
        if(sum(email_delivered) > 0, (sum(email_clicks) * 100.0 / sum(email_delivered)), 0) as clickRate,
        0 as conversionRate
      FROM account_metrics_daily
      WHERE klaviyo_public_id IN (${klaviyoIdList})
        AND date >= '${currentStart}'
        AND date <= '${currentEnd}'
      GROUP BY date, klaviyo_public_id
      ORDER BY date ASC, klaviyo_public_id ASC
    `;

    // 3. BY ACCOUNT BREAKDOWN - Top 5 stores by revenue
    const byAccountQuery = `
      SELECT
        klaviyo_public_id,
        sum(total_revenue) as revenue,
        sum(campaign_revenue + flow_revenue) as attributedRevenue,
        sum(total_orders) as orders,
        sum(unique_customers) as customers,
        avg(avg_order_value) as avgOrderValue,
        if(sum(email_delivered) > 0, (sum(email_opens) * 100.0 / sum(email_delivered)), 0) as openRate,
        if(sum(email_delivered) > 0, (sum(email_clicks) * 100.0 / sum(email_delivered)), 0) as clickRate
      FROM account_metrics_daily
      WHERE klaviyo_public_id IN (${klaviyoIdList})
        AND date >= '${currentStart}'
        AND date <= '${currentEnd}'
      GROUP BY klaviyo_public_id
      ORDER BY revenue DESC
      LIMIT 5
    `;

    // Execute all queries in parallel
    console.log('🚀 Executing ClickHouse queries...');
    const [summaryResult, timeSeriesResult, timeSeriesByAccountResult, byAccountResult] = await Promise.all([
      client.query({ query: summaryQuery, format: 'JSONEachRow' }),
      client.query({ query: timeSeriesQuery, format: 'JSONEachRow' }),
      client.query({ query: timeSeriesByAccountQuery, format: 'JSONEachRow' }),
      client.query({ query: byAccountQuery, format: 'JSONEachRow' })
    ]);

    // Parse results
    const summary = (await summaryResult.json())[0] || {};
    const timeSeries = await timeSeriesResult.json();
    const timeSeriesByAccountRaw = await timeSeriesByAccountResult.json();
    const byAccountRaw = await byAccountResult.json();

    console.log('✅ ClickHouse query results:', {
      summary: {
        revenue: summary.total_revenue,
        orders: summary.total_orders,
        customers: summary.unique_customers
      },
      timeSeriesCount: timeSeries.length,
      timeSeriesByAccountCount: timeSeriesByAccountRaw.length,
      byAccountCount: byAccountRaw.length
    });

    // Map store names to account data
    const byAccount = byAccountRaw.map(account => {
      const store = stores.find(s => s.klaviyo_integration?.public_id === account.klaviyo_public_id);
      return {
        ...account,
        name: store?.name || 'Unknown Store',
        storeName: store?.name || 'Unknown Store',
        storePublicId: store?.public_id,
        klaviyoPublicId: account.klaviyo_public_id,
        revenue: parseFloat(account.revenue) || 0,
        openRate: parseFloat(account.openRate) || 0,
        clickRate: parseFloat(account.clickRate) || 0
      };
    });

    // Process time series by account data - transform from rows to nested structure
    // Group by date first, then add account-specific metrics
    const timeSeriesByAccountMap = new Map();

    timeSeriesByAccountRaw.forEach(row => {
      const dateKey = row.date;
      if (!timeSeriesByAccountMap.has(dateKey)) {
        timeSeriesByAccountMap.set(dateKey, { date: dateKey });
      }

      const store = stores.find(s => s.klaviyo_integration?.public_id === row.klaviyo_public_id);
      const storeName = store?.name || 'Unknown';
      const storePublicId = store?.public_id;

      // Add metrics for this account with account identifier as suffix
      const dateData = timeSeriesByAccountMap.get(dateKey);
      dateData[`${storePublicId}_revenue`] = parseFloat(row.revenue) || 0;
      dateData[`${storePublicId}_attributedRevenue`] = parseFloat(row.attributedRevenue) || 0;
      dateData[`${storePublicId}_orders`] = parseInt(row.orders) || 0;
      dateData[`${storePublicId}_customers`] = parseInt(row.customers) || 0;
      dateData[`${storePublicId}_aov`] = parseFloat(row.aov) || 0;
      dateData[`${storePublicId}_clickRate`] = parseFloat(row.clickRate) || 0;
      dateData[`${storePublicId}_openRate`] = parseFloat(row.openRate) || 0;
      dateData[`${storePublicId}_conversionRate`] = parseFloat(row.conversionRate) || 0;

      // Store metadata for reference
      if (!dateData._accounts) {
        dateData._accounts = [];
      }
      dateData._accounts.push({
        storePublicId,
        storeName,
        klaviyoPublicId: row.klaviyo_public_id
      });
    });

    const timeSeriesByAccount = Array.from(timeSeriesByAccountMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Return formatted dashboard data
    return {
      summary: {
        totalRevenue: parseFloat(summary.total_revenue) || 0,
        attributedRevenue: parseFloat(summary.attributed_revenue) || 0,
        totalOrders: parseInt(summary.total_orders) || 0,
        uniqueCustomers: parseInt(summary.unique_customers) || 0,
        avgOrderValue: parseFloat(summary.avg_order_value) || 0,
        newCustomers: parseInt(summary.new_customers) || 0,
        returningCustomers: parseInt(summary.returning_customers) || 0,
        // Period changes
        revenueChange: parseFloat(summary.revenue_change) || 0,
        attributedRevenueChange: parseFloat(summary.attributed_revenue_change) || 0,
        ordersChange: parseFloat(summary.orders_change) || 0,
        customersChange: parseFloat(summary.customers_change) || 0,
        aovChange: parseFloat(summary.aov_change) || 0,
        newCustomersChange: parseFloat(summary.new_customers_change) || 0
      },
      timeSeries: timeSeries.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue) || 0,
        attributedRevenue: parseFloat(row.attributedRevenue) || 0,
        orders: parseInt(row.orders) || 0,
        customers: parseInt(row.customers) || 0,
        newCustomers: parseInt(row.newCustomers) || 0,
        returningCustomers: parseInt(row.returningCustomers) || 0,
        aov: parseFloat(row.aov) || 0,
        campaignRevenue: parseFloat(row.campaignRevenue) || 0,
        flowRevenue: parseFloat(row.flowRevenue) || 0,
        emailRevenue: parseFloat(row.emailRevenue) || 0,
        smsRevenue: parseFloat(row.smsRevenue) || 0,
        recipients: parseInt(row.recipients) || 0,
        delivered: parseInt(row.delivered) || 0,
        opens: parseInt(row.opens) || 0,
        clicks: parseInt(row.clicks) || 0,
        conversions: parseInt(row.conversions) || 0,
        openRate: parseFloat(row.openRate) || 0,
        clickRate: parseFloat(row.clickRate) || 0,
        conversionRate: parseFloat(row.conversionRate) || 0
      })),
      timeSeriesByAccount, // New: per-account time series data
      byAccount
    };
  } catch (error) {
    console.error('ClickHouse Query Error:', error);
    throw error;
  }
}

// Helper function to return empty dashboard data
function getEmptyDashboardData() {
  return {
    summary: {
      totalRevenue: 0,
      attributedRevenue: 0,
      totalOrders: 0,
      uniqueCustomers: 0,
      avgOrderValue: 0,
      newCustomers: 0,
      returningCustomers: 0,
      revenueChange: 0,
      attributedRevenueChange: 0,
      ordersChange: 0,
      customersChange: 0,
      aovChange: 0,
      newCustomersChange: 0
    },
    timeSeries: [],
    timeSeriesByAccount: [],
    byAccount: []
  };
}
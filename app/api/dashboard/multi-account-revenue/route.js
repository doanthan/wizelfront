import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import { getClickHouseClient } from "@/lib/clickhouse";
import { formatCurrency, formatNumber, formatPercentage, formatPercentageChange } from "@/lib/utils";

/**
 * Multi-Account Revenue Dashboard API
 * Fetches revenue metrics and trends from ClickHouse for multi-account reporting
 * v2 - Fixed nested aggregations
 */

export async function GET(request) {
  try {
    console.log('Multi-account revenue API called');

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Session user:', session.user.email);

    await connectToDatabase();

    // Import User model to check super admin status
    const User = require('@/models/User').default;
    const user = await User.findOne({ email: session.user.email });
    const isSuperAdmin = user?.is_super_user === true;

    console.log('User found:', !!user, 'Is super admin:', isSuperAdmin);

    const { searchParams } = new URL(request.url);
    const storeIds = searchParams.get('storeIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const comparisonStartDate = searchParams.get('comparisonStartDate');
    const comparisonEndDate = searchParams.get('comparisonEndDate');
    const comparisonType = searchParams.get('comparisonType') || 'previous-period';

    // If "all" is selected or no stores, get all stores for the user
    let klaviyoPublicIds = [];
    let stores = [];

    if (storeIds.length === 0 || storeIds.includes('all')) {
      // Get all stores based on user type
      if (isSuperAdmin) {
        // Super admin can see all stores
        stores = await Store.find({
          'klaviyo_integration.public_id': { $exists: true, $ne: null }
        }).select('klaviyo_integration.public_id name public_id').lean();
      } else {
        // Regular user can only see their stores
        stores = await Store.find({
          users: { $in: [session.user.email] }
        }).select('klaviyo_integration.public_id name public_id').lean();
      }

      klaviyoPublicIds = stores
        .filter(store => store.klaviyo_integration?.public_id)
        .map(store => store.klaviyo_integration.public_id);
    } else {
      // Get specific stores
      const storeQuery = {
        public_id: { $in: storeIds }
      };

      // Only apply user filter for non-super admins
      if (!isSuperAdmin) {
        storeQuery.users = { $in: [session.user.email] };
      }

      stores = await Store.find(storeQuery)
        .select('klaviyo_integration.public_id name public_id')
        .lean();

      klaviyoPublicIds = stores
        .filter(store => store.klaviyo_integration?.public_id)
        .map(store => store.klaviyo_integration.public_id);
    }
    
    if (klaviyoPublicIds.length === 0) {
      console.log('No klaviyo public IDs found');
      return NextResponse.json({
        error: "No stores with Klaviyo integration found"
      }, { status: 404 });
    }

    console.log('Found klaviyoPublicIds:', klaviyoPublicIds);

    const client = getClickHouseClient();
    console.log('ClickHouse client created');
    
    // Build date filters
    const mainDateFilter = startDate && endDate 
      ? `AND date >= '${startDate}' AND date <= '${endDate}'`
      : `AND date >= today() - INTERVAL 90 DAY`;
      
    const comparisonDateFilter = comparisonStartDate && comparisonEndDate
      ? `AND date >= '${comparisonStartDate}' AND date <= '${comparisonEndDate}'`
      : `AND date >= today() - INTERVAL 180 DAY AND date < today() - INTERVAL 90 DAY`;
    
    // Fetch main dashboard stats
    const dashboardStatsQuery = `
      WITH current_period AS (
        SELECT
          SUM(total_revenue) as total_revenue,
          SUM(total_orders) as total_orders,
          SUM(unique_customers) as unique_customers,
          SUM(new_customers) as new_customers,
          SUM(returning_customers) as returning_customers,
          SUM(flow_revenue) as flow_revenue,
          SUM(campaign_revenue) as campaign_revenue
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
      ),
      previous_period AS (
        SELECT
          SUM(total_revenue) as total_revenue,
          SUM(total_orders) as total_orders,
          SUM(unique_customers) as unique_customers,
          SUM(new_customers) as new_customers,
          SUM(returning_customers) as returning_customers,
          SUM(flow_revenue) as flow_revenue,
          SUM(campaign_revenue) as campaign_revenue
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${comparisonDateFilter}
      )
      SELECT
        c.total_revenue as current_revenue,
        p.total_revenue as previous_revenue,
        if(p.total_revenue > 0, (c.total_revenue - p.total_revenue) / p.total_revenue * 100, 0) as revenue_change,
        c.total_orders as current_orders,
        p.total_orders as previous_orders,
        if(p.total_orders > 0, (c.total_orders - p.total_orders) / p.total_orders * 100, 0) as order_change,
        c.unique_customers as current_customers,
        p.unique_customers as previous_customers,
        if(p.unique_customers > 0, (c.unique_customers - p.unique_customers) / p.unique_customers * 100, 0) as customer_change,
        if(c.total_orders > 0, c.total_revenue / c.total_orders, 0) as current_aov,
        if(p.total_orders > 0, p.total_revenue / p.total_orders, 0) as previous_aov,
        if(p.total_orders > 0 AND c.total_orders > 0,
           ((c.total_revenue / c.total_orders) - (p.total_revenue / p.total_orders)) / (p.total_revenue / p.total_orders) * 100, 0) as aov_change,
        c.flow_revenue as current_flow_revenue,
        c.campaign_revenue as current_campaign_revenue,
        if(p.campaign_revenue > 0, (c.campaign_revenue - p.campaign_revenue) / p.campaign_revenue * 100, 0) as campaign_revenue_change,
        c.new_customers as current_new_customers,
        c.returning_customers as current_returning_customers,
        if(p.new_customers > 0, (c.new_customers - p.new_customers) / p.new_customers * 100, 0) as new_customer_change
      FROM current_period c, previous_period p
    `;
    
    // Fetch revenue trend data for chart
    // Using subqueries to avoid nested aggregations
    const revenueTrendQuery = `
      WITH daily_metrics_raw AS (
        SELECT
          date,
          SUM(total_revenue) as revenue,
          SUM(total_orders) as orders,
          SUM(unique_customers) as customers,
          SUM(campaign_revenue) as campaign_revenue,
          SUM(flow_revenue) as flow_revenue
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        GROUP BY date
      ),
      daily_metrics AS (
        SELECT
          date,
          revenue,
          orders,
          customers,
          campaign_revenue,
          flow_revenue,
          if(orders > 0, revenue / orders, 0) as aov
        FROM daily_metrics_raw
        ORDER BY date ASC
      ),
      comparison_metrics AS (
        SELECT
          date,
          SUM(total_revenue) as revenue,
          SUM(total_orders) as orders,
          SUM(unique_customers) as customers,
          SUM(campaign_revenue) as campaign_revenue,
          SUM(flow_revenue) as flow_revenue
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${comparisonDateFilter}
        GROUP BY date
        ORDER BY date ASC
      )
      SELECT
        'current' as period,
        date,
        revenue,
        orders,
        customers,
        campaign_revenue,
        flow_revenue,
        aov
      FROM daily_metrics
      UNION ALL
      SELECT
        'comparison' as period,
        date,
        revenue,
        orders,
        customers,
        campaign_revenue,
        flow_revenue,
        0 as aov
      FROM comparison_metrics
      ORDER BY period, date ASC
    `;
    
    // Fetch campaign performance data from pre-aggregated table
    // Using renamed aliases to avoid ClickHouse FINAL aggregation issues
    const campaignPerformanceQuery = `
      SELECT
        date,
        SUM(total_campaigns) as campaigns_count,
        SUM(email_campaigns) as email_campaigns_count,
        SUM(sms_campaigns) as sms_campaigns_count,
        SUM(email_recipients) as email_recipients_sum,
        SUM(sms_recipients) as sms_recipients_sum,
        SUM(total_conversion_value) as revenue_sum,
        SUM(total_conversions) as conversions_sum,
        AVG(avg_conversion_rate) * 100 as conversion_rate_avg
      FROM campaign_daily_aggregates FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${mainDateFilter}
      GROUP BY date
      ORDER BY date ASC
    `;

    // Fetch per-account breakdown if multiple accounts
    let byAccountQuery = null;
    if (klaviyoPublicIds.length > 1) {
      byAccountQuery = `
        SELECT
          klaviyo_public_id,
          SUM(total_revenue) as totalRevenue,
          SUM(total_orders) as orders,
          SUM(unique_customers) as customers,
          SUM(campaign_revenue) as campaignRevenue,
          SUM(flow_revenue) as flowRevenue,
          if(SUM(total_orders) > 0, SUM(total_revenue) / SUM(total_orders), 0) as aov
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        GROUP BY klaviyo_public_id
      `;
    }

    // Fetch flow statistics for revenue calculation
    const flowPerformanceQuery = `
      SELECT
        date,
        SUM(conversion_value) as flow_revenue,
        SUM(conversions) as flow_conversions,
        SUM(recipients) as flow_recipients
      FROM flow_statistics FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${mainDateFilter}
      GROUP BY date
      ORDER BY date ASC
    `;
    
    // Execute all queries in parallel
    console.log('Executing ClickHouse queries...');
    const queries = [
      client.query({ query: dashboardStatsQuery }),
      client.query({ query: revenueTrendQuery }),
      client.query({ query: campaignPerformanceQuery }),
      client.query({ query: flowPerformanceQuery })
    ];

    if (byAccountQuery) {
      queries.push(client.query({ query: byAccountQuery }));
    }

    const results = await Promise.all(queries);

    const statsData = await results[0].json();
    const trendData = await results[1].json();
    const campaignData = await results[2].json();
    const flowData = await results[3].json();
    const byAccountData = byAccountQuery ? await results[4].json() : null;

    // Post-process campaign data to calculate derived fields and rename fields back
    const processedCampaignData = campaignData.data.map(row => ({
      date: row.date,
      total_campaigns: row.campaigns_count,
      email_campaigns: row.email_campaigns_count,
      sms_campaigns: row.sms_campaigns_count,
      email_recipients: row.email_recipients_sum,
      sms_recipients: row.sms_recipients_sum,
      total_recipients: (row.email_recipients_sum || 0) + (row.sms_recipients_sum || 0),
      campaign_revenue: row.revenue_sum,
      conversions: row.conversions_sum,
      avg_conversion_rate: row.conversion_rate_avg,
      revenue_per_recipient: ((row.email_recipients_sum || 0) + (row.sms_recipients_sum || 0)) > 0
        ? row.revenue_sum / ((row.email_recipients_sum || 0) + (row.sms_recipients_sum || 0))
        : 0,
      email_revenue: 0, // These would need separate queries to calculate properly
      sms_revenue: 0
    }));
    
    // Process trend data into current and comparison arrays
    const currentTrend = trendData.data.filter(d => d.period === 'current');
    const comparisonTrend = trendData.data.filter(d => d.period === 'comparison');
    
    // Map klaviyo_public_ids back to store names for display
    const storeMapping = {};
    if (byAccountData && byAccountData.data) {
      // Use the stores we already fetched earlier
      stores.forEach(store => {
        if (store.klaviyo_integration?.public_id) {
          storeMapping[store.klaviyo_integration.public_id] = {
            name: store.name,
            publicId: store.public_id
          };
        }
      });
    }

    // Process by-account data with store names
    const byAccount = byAccountData ? byAccountData.data.map(account => ({
      storeId: account.klaviyo_public_id,
      storeName: storeMapping[account.klaviyo_public_id]?.name || 'Unknown Store',
      storePublicId: storeMapping[account.klaviyo_public_id]?.publicId,
      totalRevenue: account.totalRevenue,
      orders: account.orders,
      customers: account.customers,
      campaignRevenue: account.campaignRevenue,
      flowRevenue: account.flowRevenue,
      aov: account.aov,
      // Calculate email/SMS metrics from campaigns for this store
      emailRecipients: 0, // Will be calculated from campaign data
      smsRecipients: 0,
      emailRevenue: 0,
      smsRevenue: 0,
      recipients: 0
    })) : [];

    // Format the response
    const response = {
      stats: statsData.data[0] || {},
      trend: {
        current: currentTrend,
        comparison: comparisonTrend
      },
      campaigns: processedCampaignData || [],
      flows: flowData.data || [],
      byAccount: byAccount,
      metadata: {
        storeCount: klaviyoPublicIds.length,
        dateRange: {
          start: startDate || 'last90days',
          end: endDate || 'today',
          comparisonStart: comparisonStartDate,
          comparisonEnd: comparisonEndDate,
          comparisonType
        }
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching multi-account revenue data:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
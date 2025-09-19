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
 */

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const storeIds = searchParams.get('storeIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const comparisonStartDate = searchParams.get('comparisonStartDate');
    const comparisonEndDate = searchParams.get('comparisonEndDate');
    const comparisonType = searchParams.get('comparisonType') || 'previous-period';
    
    // If "all" is selected or no stores, get all stores for the user
    let klaviyoPublicIds = [];
    
    if (storeIds.length === 0 || storeIds.includes('all')) {
      // Get all stores for the user
      const stores = await Store.find({ 
        users: session.user.email 
      }).select('klaviyo_integration.public_id name public_id').lean();
      
      klaviyoPublicIds = stores
        .filter(store => store.klaviyo_integration?.public_id)
        .map(store => store.klaviyo_integration.public_id);
    } else {
      // Get specific stores
      const stores = await Store.find({ 
        public_id: { $in: storeIds },
        users: session.user.email 
      }).select('klaviyo_integration.public_id name public_id').lean();
      
      klaviyoPublicIds = stores
        .filter(store => store.klaviyo_integration?.public_id)
        .map(store => store.klaviyo_integration.public_id);
    }
    
    if (klaviyoPublicIds.length === 0) {
      return NextResponse.json({ 
        error: "No stores with Klaviyo integration found" 
      }, { status: 404 });
    }
    
    const client = getClickHouseClient();
    
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
          SUM(repeat_customers) as repeat_customers,
          SUM(email_revenue) as email_revenue,
          SUM(sms_revenue) as sms_revenue,
          SUM(flow_revenue) as flow_revenue,
          SUM(campaign_revenue) as campaign_revenue,
          AVG(avg_order_value) as avg_order_value
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
          SUM(repeat_customers) as repeat_customers,
          SUM(email_revenue) as email_revenue,
          SUM(sms_revenue) as sms_revenue,
          SUM(flow_revenue) as flow_revenue,
          SUM(campaign_revenue) as campaign_revenue,
          AVG(avg_order_value) as avg_order_value
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
        c.avg_order_value as current_aov,
        p.avg_order_value as previous_aov,
        if(p.avg_order_value > 0, (c.avg_order_value - p.avg_order_value) / p.avg_order_value * 100, 0) as aov_change,
        c.email_revenue as current_email_revenue,
        c.sms_revenue as current_sms_revenue,
        c.flow_revenue as current_flow_revenue,
        c.campaign_revenue as current_campaign_revenue,
        c.new_customers as current_new_customers,
        c.repeat_customers as current_repeat_customers
      FROM current_period c, previous_period p
    `;
    
    // Fetch revenue trend data for chart
    const revenueTrendQuery = `
      WITH daily_metrics AS (
        SELECT
          date,
          SUM(total_revenue) as revenue,
          SUM(total_orders) as orders,
          SUM(unique_customers) as customers,
          SUM(campaign_revenue) as campaign_revenue,
          SUM(flow_revenue) as flow_revenue,
          SUM(email_revenue) as email_revenue,
          SUM(sms_revenue) as sms_revenue,
          AVG(avg_order_value) as aov
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        GROUP BY date
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
        email_revenue,
        sms_revenue,
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
        0 as email_revenue,
        0 as sms_revenue,
        0 as aov
      FROM comparison_metrics
      ORDER BY period, date ASC
    `;
    
    // Fetch campaign performance data from pre-aggregated table
    const campaignPerformanceQuery = `
      SELECT
        date,
        SUM(total_campaigns) as total_campaigns,
        SUM(email_campaigns) as email_campaigns,
        SUM(sms_campaigns) as sms_campaigns,
        SUM(email_recipients + COALESCE(sms_recipients, 0)) as total_recipients,
        SUM(total_conversion_value) as campaign_revenue,
        SUM(total_conversions) as conversions,
        AVG(avg_conversion_rate) * 100 as avg_conversion_rate,
        SUM(total_conversion_value) / NULLIF(SUM(email_recipients + COALESCE(sms_recipients, 0)), 0) as revenue_per_recipient
      FROM campaign_daily_aggregates FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${mainDateFilter}
      GROUP BY date
      ORDER BY date ASC
    `;
    
    // Execute all queries in parallel
    const [statsResult, trendResult, campaignResult] = await Promise.all([
      client.query({ query: dashboardStatsQuery }),
      client.query({ query: revenueTrendQuery }),
      client.query({ query: campaignPerformanceQuery })
    ]);
    
    const statsData = await statsResult.json();
    const trendData = await trendResult.json();
    const campaignData = await campaignResult.json();
    
    // Process trend data into current and comparison arrays
    const currentTrend = trendData.data.filter(d => d.period === 'current');
    const comparisonTrend = trendData.data.filter(d => d.period === 'comparison');
    
    // Format the response
    const response = {
      stats: statsData.data[0] || {},
      trend: {
        current: currentTrend,
        comparison: comparisonTrend
      },
      campaigns: campaignData.data || [],
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
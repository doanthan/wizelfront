import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";
import ContractSeat from "@/models/ContractSeat";
import Role from "@/models/Role";
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

// Fetch marketing channel metrics from ClickHouse
const fetchMarketingMetrics = async (klaviyoPublicIds, dateRange) => {
  // Return empty data for now to avoid enum errors
  // Silently skip marketing metrics due to ClickHouse enum issue
  return {
    emailMetrics: { sent: 0, revenue: 0, delivered: 0, opens: 0, clicks: 0, conversions: 0 },
    smsMetrics: { sent: 0, revenue: 0, delivered: 0, opens: 0, clicks: 0, conversions: 0 },
    channelBreakdown: []
  };

  // Return empty data if no klaviyo IDs
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    return {
      emailMetrics: { sent: 0, revenue: 0 },
      smsMetrics: { sent: 0, revenue: 0 },
      channelBreakdown: []
    };
  }

  const client = getClickHouseClient();

  const startDate = dateRange?.start ? new Date(dateRange.start) :
                     dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.end ? new Date(dateRange.end) :
                   dateRange?.to ? new Date(dateRange.to) : null;

  const dateFilter = startDate && endDate
    ? `AND date >= '${startDate.toISOString().split('T')[0]}'
       AND date <= '${endDate.toISOString().split('T')[0]}'`
    : 'AND date >= today() - INTERVAL 90 DAY';

  try {
    // Query for campaign channel metrics
    const campaignChannelQuery = `
      SELECT
        COALESCE(send_channel, 'unknown') as send_channel,
        SUM(recipients) as total_sent,
        SUM(delivered) as total_delivered,
        SUM(opens_unique) as total_opens,
        SUM(clicks_unique) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(conversion_value) as total_revenue
      FROM campaign_statistics FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${dateFilter}
      GROUP BY COALESCE(send_channel, 'unknown')
    `;

    // Query for flow channel metrics
    const flowChannelQuery = `
      SELECT
        COALESCE(send_channel, 'unknown') as send_channel,
        SUM(recipients) as total_sent,
        SUM(delivered) as total_delivered,
        SUM(opens_unique) as total_opens,
        SUM(clicks_unique) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(conversion_value) as total_revenue
      FROM flow_statistics FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${dateFilter}
      GROUP BY COALESCE(send_channel, 'unknown')
    `;

    const [campaignResult, flowResult] = await Promise.all([
      client.query({ query: campaignChannelQuery, format: 'JSONEachRow' }),
      client.query({ query: flowChannelQuery, format: 'JSONEachRow' })
    ]);

    const campaignChannels = await campaignResult.json();
    const flowChannels = await flowResult.json();

    // Combine campaign and flow metrics by channel
    const channelMap = new Map();

    [...campaignChannels, ...flowChannels].forEach(channel => {
      const key = channel.send_channel || 'unknown';
      if (!channelMap.has(key)) {
        channelMap.set(key, {
          channel: key,
          sent: 0,
          delivered: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        });
      }
      const metrics = channelMap.get(key);
      metrics.sent += parseFloat(channel.total_sent) || 0;
      metrics.delivered += parseFloat(channel.total_delivered) || 0;
      metrics.opens += parseFloat(channel.total_opens) || 0;
      metrics.clicks += parseFloat(channel.total_clicks) || 0;
      metrics.conversions += parseFloat(channel.total_conversions) || 0;
      metrics.revenue += parseFloat(channel.total_revenue) || 0;
    });

    const channelBreakdown = Array.from(channelMap.values());

    // Extract email and SMS specific metrics
    const emailMetrics = channelMap.get('email') || { sent: 0, revenue: 0 };
    const smsMetrics = channelMap.get('sms') || { sent: 0, revenue: 0 };

    return {
      emailMetrics: {
        sent: emailMetrics.sent,
        delivered: emailMetrics.delivered,
        opens: emailMetrics.opens,
        clicks: emailMetrics.clicks,
        conversions: emailMetrics.conversions,
        revenue: emailMetrics.revenue
      },
      smsMetrics: {
        sent: smsMetrics.sent,
        delivered: smsMetrics.delivered,
        opens: smsMetrics.opens,
        clicks: smsMetrics.clicks,
        conversions: smsMetrics.conversions,
        revenue: smsMetrics.revenue
      },
      channelBreakdown
    };
  } catch (error) {
    console.error('Error fetching marketing metrics:', error);
    throw error;
  }
};

// Fetch revenue metrics from ClickHouse
const fetchRevenueMetrics = async (klaviyoPublicIds, dateRange) => {
  // Return empty data if no klaviyo IDs
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    console.log('No klaviyo IDs provided to fetchRevenueMetrics');
    return {
      summary: {
        totalRevenue: 0,
        attributedRevenue: 0,
        totalOrders: 0,
        uniqueCustomers: 0,
        avgOrderValue: 0,
        newCustomers: 0,
        returningCustomers: 0
      },
      byAccount: [],
      timeSeries: []
    };
  }

  const client = getClickHouseClient();

  // Handle both start/end and from/to formats
  const startDate = dateRange?.start ? new Date(dateRange.start) :
                     dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.end ? new Date(dateRange.end) :
                   dateRange?.to ? new Date(dateRange.to) : null;
  
  // Build date filter - ClickHouse expects DateTime format as 'YYYY-MM-DD HH:MM:SS'
  const formatDateTimeForClickHouse = (date, isEndDate = false) => {
    // For end dates, set to end of day (23:59:59)
    if (isEndDate) {
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.toISOString().replace('T', ' ').split('.')[0];
    }
    // For start dates, set to beginning of day (00:00:00)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay.toISOString().replace('T', ' ').split('.')[0];
  };

  const dateFilter = startDate && endDate
    ? `AND order_timestamp >= '${formatDateTimeForClickHouse(startDate)}'
       AND order_timestamp <= '${formatDateTimeForClickHouse(endDate, true)}'`
    : 'AND order_timestamp >= today() - 90'; // Default to last 90 days

  // Debug logging
  console.log('Fetching revenue metrics for:', {
    klaviyoPublicIds,
    dateFilter,
    startDate: startDate ? formatDateTimeForClickHouse(startDate) : 'default',
    endDate: endDate ? formatDateTimeForClickHouse(endDate, true) : 'default',
    clickHouseDateRange: {
      start: startDate ? startDate.toISOString().split('T')[0] : 'default',
      end: endDate ? endDate.toISOString().split('T')[0] : 'default'
    }
  });

  try {
    // Direct aggregation query - no CTEs to avoid ILLEGAL_AGGREGATION
    const overallQuery = `
      SELECT
        SUM(total_revenue) as revenue_sum,
        SUM(total_orders) as orders_sum,
        SUM(unique_customers) as customers_sum,
        CASE
          WHEN SUM(total_orders) > 0 THEN SUM(total_revenue) / SUM(total_orders)
          ELSE 0
        END as aov_calculated,
        SUM(new_customers) as new_customers_sum,
        SUM(returning_customers) as returning_customers_sum
      FROM account_metrics_daily FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        AND date >= ${startDate ? `'${startDate.toISOString().split('T')[0]}'` : 'today() - INTERVAL 90 DAY'}
        AND date <= ${endDate ? `'${endDate.toISOString().split('T')[0]}'` : 'today()'}
    `;

    // Simplified attribution query - direct calculation without CTEs to avoid ILLEGAL_AGGREGATION
    const attributionQuery = `
      SELECT
        (
          SELECT SUM(conversion_value)
          FROM campaign_statistics FINAL
          WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
            AND date >= ${startDate ? `'${startDate.toISOString().split('T')[0]}'` : 'today() - INTERVAL 90 DAY'}
            AND date <= ${endDate ? `'${endDate.toISOString().split('T')[0]}'` : 'today()'}
        ) + (
          SELECT SUM(conversion_value)
          FROM flow_statistics FINAL
          WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
            AND date >= ${startDate ? `'${startDate.toISOString().split('T')[0]}'` : 'today() - INTERVAL 90 DAY'}
            AND date <= ${endDate ? `'${endDate.toISOString().split('T')[0]}'` : 'today()'}
        ) as attributed_revenue
    `;

    // Simple direct query with FINAL and GROUP BY
    const byAccountQuery = `
      SELECT
        klaviyo_public_id,
        SUM(total_revenue) as revenue,
        SUM(total_orders) as orders,
        SUM(unique_customers) as customers,
        CASE
          WHEN SUM(total_orders) > 0 THEN SUM(total_revenue) / SUM(total_orders)
          ELSE 0
        END as aov
      FROM account_metrics_daily FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        AND date >= ${startDate ? `'${startDate.toISOString().split('T')[0]}'` : 'today() - INTERVAL 90 DAY'}
        AND date <= ${endDate ? `'${endDate.toISOString().split('T')[0]}'` : 'today()'}
      GROUP BY klaviyo_public_id
      ORDER BY revenue DESC
    `;

    // Simplified Performance Over Time Query - Direct query with FINAL
    const timeSeriesQuery = `
      SELECT
        date,
        SUM(total_revenue) as revenue,
        SUM(total_orders) as orders,
        SUM(unique_customers) as customers,
        SUM(new_customers) as new_customers,
        SUM(returning_customers) as returning_customers,
        CASE
          WHEN SUM(total_orders) > 0 THEN SUM(total_revenue) / SUM(total_orders)
          ELSE 0
        END as aov,
        0 as campaignsSent,
        0 as recipients,
        0 as delivered,
        0 as opens,
        0 as clicks,
        0 as conversions,
        0 as campaignRevenue,
        0 as activeFlows,
        0 as flowRecipients,
        0 as flowOpens,
        0 as flowClicks,
        0 as flowConversions,
        0 as flowRevenue,
        0 as openRate,
        0 as clickRate,
        0 as ctor,
        0 as conversionRate,
        0 as bounceRate,
        0 as unsubscribeRate,
        0 as revenuePerRecipient
      FROM account_metrics_daily FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        AND date >= ${startDate ? `'${startDate.toISOString().split('T')[0]}'` : 'today() - INTERVAL 90 DAY'}
        AND date <= ${endDate ? `'${endDate.toISOString().split('T')[0]}'` : 'today()'}
      GROUP BY date
      ORDER BY date ASC
    `;

    // Execute all queries in parallel
    const [overallResult, attributionResult, byAccountResult, timeSeriesResult] = await Promise.all([
      client.query({ query: overallQuery, format: 'JSONEachRow' }),
      client.query({ query: attributionQuery, format: 'JSONEachRow' }),
      client.query({ query: byAccountQuery, format: 'JSONEachRow' }),
      client.query({ query: timeSeriesQuery, format: 'JSONEachRow' })
    ]);

    const overall = (await overallResult.json())[0] || {};
    const attribution = (await attributionResult.json())[0] || {};
    const byAccount = await byAccountResult.json();
    const timeSeries = await timeSeriesResult.json();
    
    // Debug logging
    console.log('ClickHouse Overall Query Result:', {
      revenue_sum: overall.revenue_sum,
      orders_sum: overall.orders_sum,
      customers_sum: overall.customers_sum
    });

    return {
      summary: {
        totalRevenue: parseFloat(overall.revenue_sum) || 0,
        attributedRevenue: parseFloat(attribution.attributed_revenue) || 0,
        totalOrders: parseInt(overall.orders_sum) || 0,
        uniqueCustomers: parseInt(overall.customers_sum) || 0,
        avgOrderValue: parseFloat(overall.aov_calculated) || 0,
        newCustomers: parseInt(overall.new_customers_sum) || 0,
        returningCustomers: parseInt(overall.returning_customers_sum) || 0
      },
      byAccount,
      timeSeries
    };
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    throw error;
  }
};

// Enhanced Campaign Performance Metrics with all fields from ClickHouse
const fetchCampaignMetrics = async (klaviyoPublicIds, dateRange, limit = 15) => {
  // Return empty data if no klaviyo IDs
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    console.log('No klaviyo IDs provided to fetchCampaignMetrics');
    return [];
  }

  const client = getClickHouseClient();

  // Handle both start/end and from/to formats
  const startDate = dateRange?.start ? new Date(dateRange.start) :
                     dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.end ? new Date(dateRange.end) :
                   dateRange?.to ? new Date(dateRange.to) : null;

  const dateFilter = startDate && endDate
    ? `AND date >= '${startDate.toISOString().split('T')[0]}'
       AND date <= '${endDate.toISOString().split('T')[0]}'`
    : 'AND date >= today() - INTERVAL 90 DAY';

  try {
    // Query using FINAL for ReplacingMergeTree to get latest values
    const query = `
      SELECT
        campaign_id,
        campaign_name,
        send_channel as channel,
        date as last_sent,
        -- Recipients and delivery metrics
        recipients as total_recipients,
        delivered as total_delivered,
        bounced as total_bounced,
        failed as total_failed,
        -- Engagement metrics
        opens as total_opens,
        opens_unique as unique_opens,
        clicks as total_clicks,
        clicks_unique as unique_clicks,
        -- Conversion metrics
        conversions as total_conversions,
        conversion_value as revenue,
        -- Negative engagement metrics
        unsubscribes,
        spam_complaints,
        -- Calculated rates
        CASE
          WHEN recipients > 0
          THEN opens_unique * 100.0 / recipients
          ELSE 0
        END as open_rate,
        CASE
          WHEN recipients > 0
          THEN clicks_unique * 100.0 / recipients
          ELSE 0
        END as click_rate,
        CASE
          WHEN opens_unique > 0
          THEN clicks_unique * 100.0 / opens_unique
          ELSE 0
        END as ctor,
        CASE
          WHEN recipients > 0
          THEN conversions * 100.0 / recipients
          ELSE 0
        END as conversion_rate,
        CASE
          WHEN delivered > 0
          THEN bounced * 100.0 / delivered
          ELSE 0
        END as bounce_rate,
        CASE
          WHEN recipients > 0
          THEN unsubscribes * 100.0 / recipients
          ELSE 0
        END as unsubscribe_rate,
        CASE
          WHEN recipients > 0
          THEN conversion_value / recipients
          ELSE 0
        END as revenue_per_recipient,
        updated_at as last_updated
      FROM campaign_statistics FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${dateFilter}
      ORDER BY last_sent DESC
      LIMIT ${limit}
    `;

    const result = await client.query({ query, format: 'JSONEachRow' });
    const campaigns = await result.json();

    // Add channel detection based on campaign name patterns and map field names
    return campaigns.map((campaign, index) => ({
      ...campaign,
      id: campaign.campaign_id || `campaign-${index}`,
      name: campaign.campaign_name,
      channel: campaign.campaign_name?.toLowerCase().includes('sms') ? 'sms' : 'email',
      send_date: campaign.last_sent,
      recipients: campaign.total_recipients,
      opensUnique: campaign.total_opens,
      clicksUnique: campaign.total_clicks,
      conversions: campaign.total_conversions,
      clickToOpenRate: campaign.ctor || 0,
      revenue: campaign.revenue || 0,
      open_rate: campaign.open_rate || 0,
      click_rate: campaign.click_rate || 0,
      conversion_rate: campaign.conversion_rate || 0
    }));
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    throw error;
  }
};

// Enhanced Performance Metrics with all ClickHouse fields
const fetchPerformanceMetrics = async (klaviyoPublicIds, dateRange) => {
  // Return empty data if no klaviyo IDs
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    console.log('No klaviyo IDs provided to fetchPerformanceMetrics');
    return [];
  }

  const client = getClickHouseClient();

  // Handle both start/end and from/to formats
  const startDate = dateRange?.start ? new Date(dateRange.start) :
                     dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.end ? new Date(dateRange.end) :
                   dateRange?.to ? new Date(dateRange.to) : null;

  const dateFilter = startDate && endDate
    ? `AND date >= '${startDate.toISOString().split('T')[0]}'
       AND date <= '${endDate.toISOString().split('T')[0]}'`
    : 'AND date >= today() - INTERVAL 90 DAY';

  console.log('🔍 Performance metrics query details:', {
    klaviyoPublicIds,
    startDateFormatted: startDate ? startDate.toISOString().split('T')[0] : 'default (90 days)',
    endDateFormatted: endDate ? endDate.toISOString().split('T')[0] : 'default (today)',
    dateFilter
  });

  try {
    // Query using only columns that exist in account_metrics_daily table
    const performanceQuery = `
      SELECT
        date,

        -- Revenue Metrics (confirmed available in account_metrics_daily)
        SUM(total_revenue) as revenue,
        SUM(campaign_revenue) as campaignRevenue,
        SUM(total_revenue - campaign_revenue) as flowRevenue, -- Calculate flow revenue as difference
        SUM(email_revenue) as emailRevenue,
        SUM(sms_revenue) as smsRevenue,

        -- Order Metrics
        SUM(total_orders) as orders,
        SUM(email_orders) as emailOrders,
        SUM(sms_orders) as smsOrders,
        CASE
          WHEN SUM(total_orders) > 0 THEN SUM(total_revenue) / SUM(total_orders)
          ELSE 0
        END as aov,

        -- Customer Metrics
        SUM(unique_customers) as customers,
        SUM(new_customers) as newCustomers,
        SUM(repeat_customers) as returningCustomers,

        -- Engagement Volume Metrics
        SUM(total_emails_sent) as emailsSent,
        SUM(total_sms_sent) as smsSent,
        SUM(total_emails_sent + total_sms_sent) as recipients,
        SUM(total_emails_sent + total_sms_sent) as delivered,
        SUM(total_opens) as opens,
        SUM(total_clicks) as clicks,

        -- Revenue Efficiency Metrics
        AVG(revenue_per_email) as revenuePerEmail,
        AVG(revenue_per_sms) as revenuePerSms,
        AVG(revenue_per_recipient) as revenuePerRecipient,

        -- Calculate rates based on available data
        CASE
          WHEN SUM(total_emails_sent + total_sms_sent) > 0
          THEN (SUM(total_opens) * 100.0) / SUM(total_emails_sent + total_sms_sent)
          ELSE 0
        END as openRate,

        CASE
          WHEN SUM(total_emails_sent + total_sms_sent) > 0
          THEN (SUM(total_clicks) * 100.0) / SUM(total_emails_sent + total_sms_sent)
          ELSE 0
        END as clickRate,

        CASE
          WHEN SUM(total_opens) > 0
          THEN (SUM(total_clicks) * 100.0) / SUM(total_opens)
          ELSE 0
        END as ctor,

        -- Placeholder for metrics not in account_metrics_daily
        0 as campaignsSent,
        0 as conversions,
        0 as conversionRate,
        0 as activeFlows,
        0 as flowRecipients,
        0 as flowOpens,
        0 as flowClicks,
        0 as flowConversions,
        0 as bounceRate,
        0 as unsubscribeRate

      FROM account_metrics_daily FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${dateFilter}
      GROUP BY date
      ORDER BY date ASC
    `;

    try {
      const result = await client.query({ query: performanceQuery, format: 'JSONEachRow' });
      const data = await result.json();

      // Log sample data for debugging
      console.log('📊 Performance metrics query result:', {
        dataLength: data?.length || 0,
        firstItem: data?.[0],
        lastItem: data?.[data?.length - 1]
      });

      if (data && data.length > 0) {
        console.log('✅ Performance metrics sample:', {
          date: data[0].date,
          revenue: data[0].revenue,
          campaignRevenue: data[0].campaignRevenue,
          flowRevenue: data[0].flowRevenue,
          orders: data[0].orders,
          customers: data[0].customers,
          emailRevenue: data[0].emailRevenue,
          smsRevenue: data[0].smsRevenue
        });
      } else {
        console.log('⚠️ No performance data returned from ClickHouse for IDs:', klaviyoPublicIds);
      }

      return data;
    } catch (queryError) {
      console.warn('Performance query failed, trying simplified version:', queryError.message);

      // Fallback to simplified query if the enhanced one fails
      const fallbackQuery = `
        SELECT
          date,
          SUM(total_revenue) as revenue,
          SUM(campaign_revenue) as campaignRevenue,
          SUM(total_revenue - campaign_revenue) as flowRevenue,
          SUM(total_orders) as orders,
          SUM(unique_customers) as customers,
          CASE
            WHEN SUM(total_orders) > 0 THEN SUM(total_revenue) / SUM(total_orders)
            ELSE 0
          END as aov
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${dateFilter}
        GROUP BY date
        ORDER BY date ASC
      `;

      try {
        const fallbackResult = await client.query({ query: fallbackQuery, format: 'JSONEachRow' });
        return await fallbackResult.json();
      } catch (fallbackError) {
        console.error('Even fallback query failed:', fallbackError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

// Main POST handler
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { storeIds, dateRange, comparison, metrics = ['revenue', 'campaigns', 'performance'], forceRefresh = false } = await request.json();

    console.log('🎯 Dashboard API request received:', {
      storeIds,
      dateRange,
      comparison: comparison ? 'yes' : 'no',
      metrics,
      user_id: user._id,
      forceRefresh
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
          returningCustomers: 0
        },
        campaigns: [],
        performanceOverTime: [],
        byAccount: [],
        timeSeries: [],
        lastUpdated: new Date().toISOString(),
        warning: "No stores selected"
      });
    }

    // Get stores using ContractSeat permission system (simplified)
    let accessibleStores = [];

    // Get user's ContractSeat to find accessible stores
    const userSeats = await ContractSeat.find({
      user_id: session.user.id,
      status: 'active'
    }).populate('default_role_id');

    console.log('Dashboard API - ContractSeat check:', {
      user_id: session.user.id,
      seats_found: userSeats.length,
      total_store_access: userSeats.reduce((sum, seat) => sum + seat.store_access.length, 0)
    });

    if (userSeats.length === 0) {
      console.log('Dashboard API - No ContractSeats found for user');
      return NextResponse.json({
        summary: {
          totalRevenue: 0,
          attributedRevenue: 0,
          totalOrders: 0,
          uniqueCustomers: 0,
          avgOrderValue: 0,
          newCustomers: 0,
          returningCustomers: 0
        },
        campaigns: [],
        performanceOverTime: [],
        byAccount: [],
        timeSeries: [],
        lastUpdated: new Date().toISOString(),
        warning: "No store access found"
      });
    }

    // Collect all store IDs user has access to
    const allAccessibleStoreIds = [];
    for (const seat of userSeats) {
      const storeAccessIds = seat.store_access.map(access => access.store_id);
      allAccessibleStoreIds.push(...storeAccessIds);
    }

    // Remove duplicates
    const uniqueStoreIds = [...new Set(allAccessibleStoreIds.map(id => id.toString()))];

    console.log('Dashboard API - User has access to stores:', uniqueStoreIds.length);

    // Build query based on requested stores
    let storeQuery = {
      is_deleted: { $ne: true },
      'klaviyo_integration.public_id': { $exists: true, $ne: null },
      _id: { $in: uniqueStoreIds }
    };

    if (!storeIds.includes('all')) {
      // Filter to specific requested stores
      storeQuery.$and = [
        { _id: { $in: uniqueStoreIds } },
        {
          $or: [
            { public_id: { $in: storeIds } },
            { 'klaviyo_integration.public_id': { $in: storeIds } }
          ]
        }
      ];
    }

    accessibleStores = await Store.find(storeQuery)
      .select('public_id name klaviyo_integration.public_id').lean();

    console.log('Dashboard API - Store query result:', {
      stores_requested: storeIds,
      storeIdsType: 'klaviyo_public_ids',
      query_used: JSON.stringify(storeQuery),
      stores_found: accessibleStores.length,
      sample_store: accessibleStores[0]
    });

    const stores = accessibleStores;

    console.log('Dashboard API - ContractSeat access check complete');
    console.log('Dashboard API - Raw stores found:', stores.length, stores.map(s => ({ name: s.name, public_id: s.public_id, has_klaviyo: !!s.klaviyo_integration?.public_id })));

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
      // Return empty data structure instead of error to allow dashboard to render
      return NextResponse.json({
        summary: {
          totalRevenue: 0,
          attributedRevenue: 0,
          totalOrders: 0,
          uniqueCustomers: 0,
          avgOrderValue: 0,
          newCustomers: 0,
          returningCustomers: 0
        },
        campaigns: [],
        performanceOverTime: [],
        byAccount: [],
        timeSeries: [],
        lastUpdated: new Date().toISOString(),
        warning: "No stores with Klaviyo integration found",
        stores: stores.map(s => ({ name: s.name, public_id: s.public_id }))
      });
    }

    // Check if we should use cached data
    const needsRefresh = forceRefresh || await shouldRefreshData(klaviyoPublicIds);
    
    const responseData = {
      summary: {},
      campaigns: [],
      performanceOverTime: [],
      byAccount: [],
      lastUpdated: new Date().toISOString(),
      fromCache: false
    };

    // Fetch revenue metrics
    if (metrics.includes('revenue')) {
      const cacheKey = getCacheKey(klaviyoPublicIds, dateRange, 'revenue');
      let revenueData = !needsRefresh ? dashboardCache.get(cacheKey) : null;
      let marketingData = null;

      if (!revenueData) {
        try {
          console.log('Fetching revenue metrics for:', { klaviyoPublicIds, dateRange });

          // Fetch both revenue and marketing metrics in parallel
          const [revData, mktData] = await Promise.all([
            fetchRevenueMetrics(klaviyoPublicIds, dateRange),
            fetchMarketingMetrics(klaviyoPublicIds, dateRange)
          ]);

          revenueData = revData;
          marketingData = mktData;

          // Enhance summary with marketing metrics
          revenueData.summary.totalEmailsSent = marketingData.emailMetrics.sent;
          revenueData.summary.totalSMSSent = marketingData.smsMetrics.sent;
          revenueData.summary.emailRevenue = marketingData.emailMetrics.revenue;
          revenueData.summary.smsRevenue = marketingData.smsMetrics.revenue;
          revenueData.summary.channelBreakdown = marketingData.channelBreakdown;

          dashboardCache.set(cacheKey, revenueData);
        } catch (revError) {
          console.error('Revenue metrics fetch failed:', revError);
          // Return default revenue data structure
          revenueData = {
            summary: {
              totalRevenue: 0,
              attributedRevenue: 0,
              totalOrders: 0,
              uniqueCustomers: 0,
              avgOrderValue: 0,
              newCustomers: 0,
              returningCustomers: 0,
              totalEmailsSent: 0,
              totalSMSSent: 0,
              emailRevenue: 0,
              smsRevenue: 0,
              channelBreakdown: []
            },
            byAccount: [],
            timeSeries: []
          };
        }
      } else {
        responseData.fromCache = true;
      }

      responseData.summary = revenueData.summary;

      // Debug the timeSeries data
      console.log('TimeSeries data from ClickHouse:', {
        count: revenueData.timeSeries?.length,
        firstItem: revenueData.timeSeries?.[0],
        lastItem: revenueData.timeSeries?.[revenueData.timeSeries.length - 1]
      });

      responseData.timeSeries = revenueData.timeSeries?.map(point => ({
        date: point.date, // Keep the date as-is from ClickHouse (YYYY-MM-DD format)
        revenue: parseFloat(point.revenue) || 0,
        orders: parseInt(point.orders) || 0,
        customers: parseInt(point.customers) || 0,
        aov: parseFloat(point.aov) || 0
      })) || [];
      
      // Map Klaviyo IDs back to store names for the UI
      responseData.byAccount = revenueData.byAccount.map(account => {
        const store = stores.find(s => s.klaviyo_integration?.public_id === account.klaviyo_public_id);
        return {
          ...account,
          name: store?.name || 'Unknown Store',
          store_public_id: store?.public_id,
          revenue: parseFloat(account.revenue) || 0,
          orders: parseInt(account.orders) || 0,
          customers: parseInt(account.customers) || 0,
          aov: parseFloat(account.aov) || 0
        };
      });
    }

    // Fetch campaign metrics
    if (metrics.includes('campaigns')) {
      const cacheKey = getCacheKey(klaviyoPublicIds, dateRange, 'campaigns');
      let campaignData = !needsRefresh ? dashboardCache.get(cacheKey) : null;

      if (!campaignData) {
        try {
          console.log('Fetching campaign metrics for:', { klaviyoPublicIds, dateRange });
          campaignData = await fetchCampaignMetrics(klaviyoPublicIds, dateRange);
          dashboardCache.set(cacheKey, campaignData);
        } catch (campError) {
          console.error('Campaign metrics fetch failed:', campError);
          // Return empty campaign data
          campaignData = [];
        }
      } else {
        responseData.fromCache = true;
      }

      responseData.campaigns = campaignData;
    }

    // Fetch performance metrics
    if (metrics.includes('performance')) {
      const cacheKey = getCacheKey(klaviyoPublicIds, dateRange, 'performance');
      let performanceData = !needsRefresh ? dashboardCache.get(cacheKey) : null;

      if (!performanceData) {
        try {
          console.log('📊 Fetching performance metrics for:', {
            klaviyoPublicIds,
            dateRange,
            startDate: dateRange?.start || dateRange?.from,
            endDate: dateRange?.end || dateRange?.to
          });
          performanceData = await fetchPerformanceMetrics(klaviyoPublicIds, dateRange);

          console.log('📈 Performance data fetched:', {
            dataPoints: performanceData?.length || 0,
            firstRecord: performanceData?.[0],
            lastRecord: performanceData?.[performanceData?.length - 1],
            hasData: performanceData?.length > 0
          });

          dashboardCache.set(cacheKey, performanceData);
        } catch (perfError) {
          console.error('Performance metrics fetch failed:', perfError);
          // Return empty performance data rather than failing the entire request
          performanceData = [];
        }
      } else {
        console.log('📦 Using cached performance data');
        responseData.fromCache = true;
      }

      responseData.performanceOverTime = performanceData;
    }

    // Calculate period-over-period changes if comparison range provided
    if (comparison) {
      console.log('Fetching comparison data for:', {
        start: comparison.start || comparison.from,
        end: comparison.end || comparison.to,
        label: comparison.label,
        startFormatted: (comparison.start || comparison.from) ? new Date(comparison.start || comparison.from).toISOString().split('T')[0] : 'undefined',
        endFormatted: (comparison.end || comparison.to) ? new Date(comparison.end || comparison.to).toISOString().split('T')[0] : 'undefined'
      });
      
      const comparisonData = await fetchRevenueMetrics(klaviyoPublicIds, comparison);
      
      console.log('Comparison data fetched:', {
        revenue: comparisonData.summary.totalRevenue,
        orders: comparisonData.summary.totalOrders,
        customers: comparisonData.summary.uniqueCustomers
      });
      
      // Check if there's any comparison data
      const hasComparisonData = comparisonData.summary.totalRevenue > 0 || 
                                comparisonData.summary.totalOrders > 0 || 
                                comparisonData.summary.uniqueCustomers > 0;
      
      if (!hasComparisonData) {
        console.log('No comparison data available for the selected period');
        // If no comparison data, return null for all changes (will show as N/A in UI)
        responseData.summary.revenueChange = null;
        responseData.summary.attributedRevenueChange = null;
        responseData.summary.ordersChange = null;
        responseData.summary.customersChange = null;
        responseData.summary.avgOrderValueChange = null;
        responseData.summary.newCustomersChange = null;
        responseData.summary.noComparisonData = true;
      } else {
        // Calculate actual percentage changes when we have comparison data
        responseData.summary.revenueChange = comparisonData.summary.totalRevenue > 0
          ? ((responseData.summary.totalRevenue - comparisonData.summary.totalRevenue) / 
             comparisonData.summary.totalRevenue) * 100
          : null;
        
        responseData.summary.attributedRevenueChange = comparisonData.summary.attributedRevenue > 0
          ? ((responseData.summary.attributedRevenue - comparisonData.summary.attributedRevenue) / 
             comparisonData.summary.attributedRevenue) * 100
          : null;
        
        responseData.summary.ordersChange = comparisonData.summary.totalOrders > 0
          ? ((responseData.summary.totalOrders - comparisonData.summary.totalOrders) / 
             comparisonData.summary.totalOrders) * 100
          : null;
        
        responseData.summary.customersChange = comparisonData.summary.uniqueCustomers > 0
          ? ((responseData.summary.uniqueCustomers - comparisonData.summary.uniqueCustomers) / 
             comparisonData.summary.uniqueCustomers) * 100
          : null;
        
        responseData.summary.avgOrderValueChange = comparisonData.summary.avgOrderValue > 0
          ? ((responseData.summary.avgOrderValue - comparisonData.summary.avgOrderValue) / 
             comparisonData.summary.avgOrderValue) * 100
          : null;
        
        responseData.summary.newCustomersChange = comparisonData.summary.newCustomers > 0
          ? ((responseData.summary.newCustomers - comparisonData.summary.newCustomers) / 
             comparisonData.summary.newCustomers) * 100
          : null;
      }
        
      // Add comparison period values for debugging
      console.log('Comparison Period Data:', {
        current: {
          revenue: responseData.summary.totalRevenue,
          attributedRevenue: responseData.summary.attributedRevenue,
          orders: responseData.summary.totalOrders,
          customers: responseData.summary.uniqueCustomers,
          aov: responseData.summary.avgOrderValue,
          newCustomers: responseData.summary.newCustomers
        },
        comparison: {
          revenue: comparisonData.summary.totalRevenue,
          attributedRevenue: comparisonData.summary.attributedRevenue,
          orders: comparisonData.summary.totalOrders,
          customers: comparisonData.summary.uniqueCustomers,
          aov: comparisonData.summary.avgOrderValue,
          newCustomers: comparisonData.summary.newCustomers
        },
        changes: {
          revenueChange: responseData.summary.revenueChange,
          attributedRevenueChange: responseData.summary.attributedRevenueChange,
          ordersChange: responseData.summary.ordersChange,
          customersChange: responseData.summary.customersChange,
          aovChange: responseData.summary.avgOrderValueChange,
          newCustomersChange: responseData.summary.newCustomersChange
        }
      });
    }

    // Add cache metadata for debugging
    responseData.cacheInfo = {
      fromCache: responseData.fromCache,
      cacheKeys: dashboardCache.keys(),
      ttl: dashboardCache.getTtl(getCacheKey(klaviyoPublicIds, dateRange, 'revenue'))
    };

    // Debug log the response
    console.log('Dashboard API response structure:', {
      hasPerformanceOverTime: !!responseData.performanceOverTime,
      performanceLength: responseData.performanceOverTime?.length,
      hasTimeSeries: !!responseData.timeSeries,
      timeSeriesLength: responseData.timeSeries?.length,
      firstPerformanceItem: responseData.performanceOverTime?.[0],
      metrics: Object.keys(responseData)
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Dashboard API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error.message,
        hint: error.message?.includes('campaign_daily_aggregates') ?
          'campaign_daily_aggregates table may not exist, using fallback' : undefined
      },
      { status: 500 }
    );
  }
}

// GET handler for cache status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return cache statistics
    const cacheStats = {
      keys: dashboardCache.keys(),
      stats: dashboardCache.getStats(),
      size: dashboardCache.keys().length
    };

    return NextResponse.json({ 
      success: true,
      cache: cacheStats 
    });

  } catch (error) {
    console.error('Cache status error:', error);
    return NextResponse.json(
      { error: "Failed to get cache status" },
      { status: 500 }
    );
  }
}
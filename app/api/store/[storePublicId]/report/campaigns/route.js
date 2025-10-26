import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import mongoose from "mongoose";
import { createClient } from '@clickhouse/client';

export const GET = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store, user, role } = request;

    // Check if user has analytics view permissions
    if (!role?.permissions?.analytics?.view_all && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view analytics' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Get date range from query params (default to last 30 days)
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const defaultEnd = now;

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate'))
      : defaultStart;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate'))
      : defaultEnd;

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = startDate;

    // Check if Klaviyo is connected
    if (!store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: 'Klaviyo not connected to this store'
      }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration.public_id;
    const db = mongoose.connection.db;
    const campaignStatsCollection = db.collection('campaignstats');

    // Fetch campaigns for current period
    const currentPeriodCampaigns = await campaignStatsCollection
      .find({
        klaviyo_public_id: klaviyoPublicId,
        'statistics.recipients': { $gt: 0 },
        send_time: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ send_time: -1 })
      .toArray();

    // Fetch campaigns for previous period
    const previousPeriodCampaigns = await campaignStatsCollection
      .find({
        klaviyo_public_id: klaviyoPublicId,
        'statistics.recipients': { $gt: 0 },
        send_time: {
          $gte: previousStart,
          $lt: previousEnd
        }
      })
      .toArray();

    // Calculate summary statistics for current period
    const currentStats = calculatePeriodStats(currentPeriodCampaigns);
    const previousStats = calculatePeriodStats(previousPeriodCampaigns);

    // Generate performance over time data (weekly aggregation for selected period)
    const performanceOverTime = generatePerformanceTimeSeries(currentPeriodCampaigns, startDate, endDate);

    // Get ClickHouse total revenue data (wrap in try-catch)
    let attributedRevenueOverTime = [];
    let currentTotalRevenue = 0;
    let previousTotalRevenue = 0;

    try {
      const clickhouse = createClient({
        host: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || '8443'}`,
        username: process.env.CLICKHOUSE_USER || 'default',
        password: process.env.CLICKHOUSE_PASSWORD,
      });

      console.log('[Campaign Report] ClickHouse Debug:', {
        storePublicId: store.public_id,
        klaviyoPublicId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Test query to check if data exists
      const testQuery = `
        SELECT count() as row_count
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id = {klaviyoId:String}
      `;

      const testResult = await clickhouse.query({
        query: testQuery,
        query_params: { klaviyoId: klaviyoPublicId },
        format: 'JSONEachRow'
      });

      const testData = await testResult.json();
      console.log('[Campaign Report] ClickHouse data exists check:', testData);

      // Generate attributed revenue over time with total revenue from ClickHouse
      attributedRevenueOverTime = await generateAttributedRevenueTimeSeries(
        campaignStatsCollection,
        klaviyoPublicId,
        startDate,
        endDate,
        clickhouse
      );

      // Calculate total revenue for summary using subquery with argMax
      const totalRevenueQuery = `
        WITH latest_daily_metrics AS (
          SELECT
            date,
            argMax(total_revenue, last_updated) as total_revenue
          FROM account_metrics_daily_latest
          WHERE klaviyo_public_id = {klaviyoId:String}
            AND date >= {startDate:String}
            AND date <= {endDate:String}
          GROUP BY date
        )
        SELECT sum(total_revenue) as total_revenue
        FROM latest_daily_metrics
      `;

      const totalRevenueResult = await clickhouse.query({
        query: totalRevenueQuery,
        query_params: {
          klaviyoId: klaviyoPublicId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        },
        format: 'JSONEachRow'
      });

      const totalRevenueData = await totalRevenueResult.json();
      console.log('[Campaign Report] Total Revenue Query Result:', totalRevenueData);
      currentTotalRevenue = totalRevenueData[0]?.total_revenue || 0;

      // Get previous period total revenue
      const previousTotalRevenueResult = await clickhouse.query({
        query: totalRevenueQuery,
        query_params: {
          klaviyoId: klaviyoPublicId,
          startDate: previousStart.toISOString().split('T')[0],
          endDate: previousEnd.toISOString().split('T')[0]
        },
        format: 'JSONEachRow'
      });

      const previousTotalRevenueData = await previousTotalRevenueResult.json();
      previousTotalRevenue = previousTotalRevenueData[0]?.total_revenue || 0;

      console.log('[Campaign Report] Revenue Summary:', {
        currentTotalRevenue,
        previousTotalRevenue,
        attributedRevenueDataPoints: attributedRevenueOverTime.length
      });

    } catch (clickhouseError) {
      console.error('ClickHouse error (continuing without total revenue data):', clickhouseError);
      // Continue without ClickHouse data - will show 0 for total revenue
    }

    // Calculate attributed revenue summary
    const percentAttributed = currentTotalRevenue > 0
      ? (currentStats.total_revenue / currentTotalRevenue) * 100
      : 0;

    const attributedRevenueSummary = {
      currentPeriod: {
        attributedRevenue: currentStats.total_revenue,
        totalRevenue: currentTotalRevenue,
        percentAttributed: percentAttributed,
        change: calculatePercentageChange(currentStats.total_revenue, previousStats.total_revenue)
      },
      previousPeriod: {
        attributedRevenue: previousStats.total_revenue,
        totalRevenue: previousTotalRevenue,
        percentAttributed: previousTotalRevenue > 0
          ? (previousStats.total_revenue / previousTotalRevenue) * 100
          : 0
      }
    };

    // Format campaigns for table
    const campaigns = currentPeriodCampaigns.map(campaign => ({
      id: campaign.groupings?.campaign_id || campaign._id,
      campaignId: campaign.groupings?.campaign_id,
      messageId: campaign.groupings?.campaign_message_id,
      name: campaign.campaign_name || 'Untitled Campaign',
      status: campaign.send_time ? 'sent' : 'scheduled',
      send_date: campaign.send_time,
      type: campaign.groupings?.send_channel || 'email',
      recipients: campaign.statistics?.recipients || 0,

      // Opens and clicks
      opens: campaign.statistics?.opens_unique || 0,
      open_rate: campaign.statistics?.open_rate || 0,
      clicks: campaign.statistics?.clicks_unique || 0,
      click_rate: campaign.statistics?.click_rate || 0,

      // Advanced metrics
      click_to_open_rate: campaign.statistics?.click_to_open_rate || 0,
      conversion_rate: campaign.statistics?.conversion_rate || 0,
      conversions: campaign.statistics?.conversions || 0,
      average_order_value: campaign.statistics?.average_order_value || 0,
      revenue_per_recipient: campaign.statistics?.revenue_per_recipient || 0,
      revenue: campaign.statistics?.conversion_value || 0,
      delivery_rate: campaign.statistics?.delivery_rate || 0,

      // Full statistics for reference
      statistics: campaign.statistics,
      groupings: campaign.groupings,
      klaviyo_public_id: campaign.klaviyo_public_id
    }));

    return NextResponse.json({
      summary: currentStats,
      previousPeriod: previousStats,
      campaigns,
      performanceOverTime,
      attributedRevenueOverTime,
      attributedRevenueSummary,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('Error fetching campaign report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign report data' },
      { status: 500 }
    );
  }
});

// Helper function to calculate statistics for a period
function calculatePeriodStats(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return {
      total_campaigns: 0,
      total_recipients: 0,
      total_opens: 0,
      total_clicks: 0,
      total_conversions: 0,
      total_revenue: 0,
      avg_open_rate: 0,
      avg_click_rate: 0,
      avg_conversion_rate: 0
    };
  }

  const totals = campaigns.reduce((acc, campaign) => {
    const stats = campaign.statistics || {};
    return {
      recipients: acc.recipients + (stats.recipients || 0),
      opens: acc.opens + (stats.opens_unique || 0),
      clicks: acc.clicks + (stats.clicks_unique || 0),
      conversions: acc.conversions + (stats.conversions || 0),
      revenue: acc.revenue + (stats.conversion_value || 0),
      delivered: acc.delivered + (stats.delivered || 0)
    };
  }, { recipients: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0, delivered: 0 });

  // Calculate weighted averages based on recipients
  const avgOpenRate = totals.delivered > 0
    ? (totals.opens / totals.delivered) * 100
    : 0;
  const avgClickRate = totals.delivered > 0
    ? (totals.clicks / totals.delivered) * 100
    : 0;
  const avgConversionRate = totals.delivered > 0
    ? (totals.conversions / totals.delivered) * 100
    : 0;

  return {
    total_campaigns: campaigns.length,
    total_recipients: totals.recipients,
    total_opens: totals.opens,
    total_clicks: totals.clicks,
    total_conversions: totals.conversions,
    total_revenue: totals.revenue,
    avg_open_rate: avgOpenRate,
    avg_click_rate: avgClickRate,
    avg_conversion_rate: avgConversionRate
  };
}

// Helper function to generate weekly performance time series
function generatePerformanceTimeSeries(campaigns, startDate, endDate) {
  if (!campaigns || campaigns.length === 0) {
    return [];
  }

  // Group campaigns by week
  const weeklyData = {};

  campaigns.forEach(campaign => {
    if (!campaign.send_time) return;

    const date = new Date(campaign.send_time);
    // Get the start of the week (Sunday)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        date: weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        weekStart: weekStart, // Keep for sorting
        opens: 0,
        clicks: 0,
        conversions: 0
      };
    }

    const stats = campaign.statistics || {};
    weeklyData[weekKey].opens += stats.opens_unique || 0;
    weeklyData[weekKey].clicks += stats.clicks_unique || 0;
    weeklyData[weekKey].conversions += stats.conversions || 0;
  });

  // Convert to array and sort by date
  const sortedData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart - b.weekStart)
    .map(item => {
      // Remove weekStart before returning
      const { weekStart, ...rest } = item;
      return rest;
    });

  return sortedData;
}

// Helper function to generate daily attributed revenue time series with total revenue
async function generateAttributedRevenueTimeSeries(collection, klaviyoPublicId, startDate, endDate, clickhouse) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get daily total revenue from ClickHouse
  const dailyRevenueQuery = `
    SELECT
      date,
      argMax(total_revenue, last_updated) as total_revenue
    FROM account_metrics_daily_latest
    WHERE klaviyo_public_id = {klaviyoId:String}
      AND date >= {startDate:String}
      AND date <= {endDate:String}
    GROUP BY date
    ORDER BY date ASC
  `;

  const revenueResult = await clickhouse.query({
    query: dailyRevenueQuery,
    query_params: {
      klaviyoId: klaviyoPublicId,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    },
    format: 'JSONEachRow'
  });

  const dailyRevenueData = await revenueResult.json();
  console.log('[AttributedRevenue] ClickHouse daily revenue data:', {
    rowCount: dailyRevenueData.length,
    sample: dailyRevenueData.slice(0, 3)
  });

  // Create a map of date -> total revenue
  const revenueMap = {};
  dailyRevenueData.forEach(row => {
    revenueMap[row.date] = parseFloat(row.total_revenue) || 0;
  });
  console.log('[AttributedRevenue] Revenue map:', Object.keys(revenueMap).length, 'dates');

  // Group campaigns by day
  const dailyData = {};

  // Fetch all campaigns in the date range
  const campaigns = await collection
    .find({
      klaviyo_public_id: klaviyoPublicId,
      'statistics.recipients': { $gt: 0 },
      send_time: {
        $gte: start,
        $lte: end
      }
    })
    .toArray();

  campaigns.forEach(campaign => {
    if (!campaign.send_time) return;

    const date = new Date(campaign.send_time);
    const dateKey = date.toISOString().split('T')[0];

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        dateObj: date,
        attributedRevenue: 0,
        campaigns: 0
      };
    }

    const stats = campaign.statistics || {};
    dailyData[dateKey].attributedRevenue += stats.conversion_value || 0;
    dailyData[dateKey].campaigns += 1;
  });

  console.log('[AttributedRevenue] Campaign daily data:', {
    campaignCount: campaigns.length,
    dateCount: Object.keys(dailyData).length,
    sample: Object.entries(dailyData).slice(0, 2)
  });

  // Combine with total revenue data - merge both revenue and campaign data
  const combinedData = [];
  const allDates = new Set([...Object.keys(revenueMap), ...Object.keys(dailyData)]);
  console.log('[AttributedRevenue] Combining data:', {
    revenueDates: Object.keys(revenueMap).length,
    campaignDates: Object.keys(dailyData).length,
    totalUniqueDates: allDates.size
  });

  allDates.forEach(dateKey => {
    const campaignData = dailyData[dateKey] || {
      attributedRevenue: 0,
      campaigns: 0
    };

    const totalRevenue = revenueMap[dateKey] || 0;
    const attributedRevenue = campaignData.attributedRevenue;
    const percentAttributed = totalRevenue > 0
      ? (attributedRevenue / totalRevenue) * 100
      : 0;

    combinedData.push({
      date: dateKey, // Keep for sorting
      month: new Date(dateKey).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      attributedRevenue: attributedRevenue,
      totalRevenue: totalRevenue,
      percentAttributed: percentAttributed,
      campaigns: campaignData.campaigns,
      flows: 0
    });
  });

  // Sort by date
  combinedData.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  console.log('[AttributedRevenue] Final combined data:', {
    totalPoints: combinedData.length,
    sample: combinedData.slice(0, 3).map(d => ({
      date: d.date,
      totalRevenue: d.totalRevenue,
      attributedRevenue: d.attributedRevenue
    }))
  });

  // Remove the date field used for sorting
  return combinedData.map(({ date, ...rest }) => rest);
}

// Helper function to calculate percentage change
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

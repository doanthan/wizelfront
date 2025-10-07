import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { storePublicId } = await params;
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

    // Get store with Klaviyo integration
    const store = await Store.findOne({ public_id: storePublicId })
      .select('public_id name klaviyo_integration.public_id')
      .lean();

    if (!store || !store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: 'Store not found or Klaviyo not connected'
      }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration.public_id;

    // Get ClickHouse client (uses connection pooling)
    const clickhouse = getClickHouseClient();

    console.log('[Flow Report] ClickHouse Debug:', {
      storePublicId,
      klaviyoPublicId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    // Query flow statistics with argMax pattern
    const flowStatsQuery = `
      SELECT
        flow_id,
        flow_message_id,
        argMax(flow_name, updated_at) as flow_name,
        argMax(flow_message_name, updated_at) as flow_message_name,
        argMax(send_channel, updated_at) as send_channel,
        argMax(recipients, updated_at) as recipients,
        argMax(delivered, updated_at) as delivered,
        argMax(opens_unique, updated_at) as opens_unique,
        argMax(clicks_unique, updated_at) as clicks_unique,
        argMax(bounced, updated_at) as bounced,
        argMax(unsubscribes, updated_at) as unsubscribes,
        argMax(conversions, updated_at) as conversions,
        argMax(conversion_value, updated_at) as conversion_value,
        argMax(open_rate, updated_at) as open_rate,
        argMax(click_rate, updated_at) as click_rate,
        argMax(delivery_rate, updated_at) as delivery_rate,
        argMax(bounce_rate, updated_at) as bounce_rate,
        argMax(unsubscribe_rate, updated_at) as unsubscribe_rate,
        argMax(conversion_rate, updated_at) as conversion_rate
      FROM flow_statistics
      WHERE klaviyo_public_id = {klaviyoId:String}
        AND date >= {startDate:String}
        AND date <= {endDate:String}
      GROUP BY flow_id, flow_message_id
      ORDER BY conversion_value DESC
    `;

    const currentFlowsResult = await clickhouse.query({
      query: flowStatsQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      format: 'JSONEachRow'
    });

    const currentFlowsData = await currentFlowsResult.json();
    console.log('[Flow Report] Current period flows:', currentFlowsData.length);

    // Query previous period for comparison
    const previousFlowsResult = await clickhouse.query({
      query: flowStatsQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0]
      },
      format: 'JSONEachRow'
    });

    const previousFlowsData = await previousFlowsResult.json();
    console.log('[Flow Report] Previous period flows:', previousFlowsData.length);

    // Calculate aggregate summary for current period
    const currentSummary = calculateFlowSummary(currentFlowsData);
    const previousSummary = calculateFlowSummary(previousFlowsData);

    // Group flows by flow_id for aggregate view with previous period comparison
    const previousFlowsAggregate = groupFlowsByFlowId(previousFlowsData);
    const flowsAggregate = groupFlowsByFlowId(currentFlowsData, previousFlowsAggregate);

    // Format messages for message-level view
    const messages = currentFlowsData.map(flow => ({
      flow_id: flow.flow_id,
      flow_message_id: flow.flow_message_id,
      flow_name: flow.flow_name,
      flow_message_name: flow.flow_message_name || flow.flow_message_id,
      channel: flow.send_channel || 'email',

      // Basic metrics
      recipients: flow.recipients || 0,
      delivered: flow.delivered || 0,
      opens: flow.opens_unique || 0,
      clicks: flow.clicks_unique || 0,
      conversions: flow.conversions || 0,
      revenue: flow.conversion_value || 0,

      // Rates (already in percentage format from ClickHouse)
      open_rate: flow.open_rate || 0,
      click_rate: flow.click_rate || 0,
      delivery_rate: flow.delivery_rate || 0,
      conversion_rate: flow.conversion_rate || 0,

      // Negative metrics
      bounced: flow.bounced || 0,
      unsubscribes: flow.unsubscribes || 0,
      bounce_rate: flow.bounce_rate || 0,
      unsubscribe_rate: flow.unsubscribe_rate || 0
    }));

    // Generate performance over time data (daily)
    const performanceOverTime = await generateDailyPerformance(
      clickhouse,
      klaviyoPublicId,
      startDate,
      endDate
    );

    // Generate message-level daily performance
    const messagePerformanceOverTime = await generateDailyMessagePerformance(
      clickhouse,
      klaviyoPublicId,
      startDate,
      endDate
    );

    return NextResponse.json({
      summary: currentSummary,
      previousPeriod: previousSummary,
      flows: flowsAggregate,
      messages: messages,
      performanceOverTime,
      messagePerformanceOverTime,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('Error fetching flow report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow report data', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate summary statistics
function calculateFlowSummary(flowsData) {
  if (!flowsData || flowsData.length === 0) {
    return {
      total_flows: 0,
      total_messages: 0,
      total_recipients: 0,
      total_delivered: 0,
      total_opens: 0,
      total_clicks: 0,
      total_conversions: 0,
      total_revenue: 0,
      avg_open_rate: 0,
      avg_click_rate: 0,
      avg_conversion_rate: 0,
      avg_delivery_rate: 0
    };
  }

  // Sum up all metrics
  const totals = flowsData.reduce((acc, flow) => ({
    recipients: acc.recipients + (flow.recipients || 0),
    delivered: acc.delivered + (flow.delivered || 0),
    opens: acc.opens + (flow.opens_unique || 0),
    clicks: acc.clicks + (flow.clicks_unique || 0),
    conversions: acc.conversions + (flow.conversions || 0),
    revenue: acc.revenue + (flow.conversion_value || 0)
  }), { recipients: 0, delivered: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0 });

  // Count unique flows
  const uniqueFlowIds = new Set(flowsData.map(f => f.flow_id));

  // Calculate weighted averages
  const avgOpenRate = totals.delivered > 0 ? (totals.opens / totals.delivered) * 100 : 0;
  const avgClickRate = totals.delivered > 0 ? (totals.clicks / totals.delivered) * 100 : 0;
  const avgConversionRate = totals.delivered > 0 ? (totals.conversions / totals.delivered) * 100 : 0;
  const avgDeliveryRate = totals.recipients > 0 ? (totals.delivered / totals.recipients) * 100 : 0;

  return {
    total_flows: uniqueFlowIds.size,
    total_messages: flowsData.length,
    total_recipients: totals.recipients,
    total_delivered: totals.delivered,
    total_opens: totals.opens,
    total_clicks: totals.clicks,
    total_conversions: totals.conversions,
    total_revenue: totals.revenue,
    avg_open_rate: avgOpenRate,
    avg_click_rate: avgClickRate,
    avg_conversion_rate: avgConversionRate,
    avg_delivery_rate: avgDeliveryRate
  };
}

// Helper function to group flows by flow_id
function groupFlowsByFlowId(flowsData, previousFlowsMap = null) {
  const flowsMap = {};

  flowsData.forEach(flow => {
    if (!flowsMap[flow.flow_id]) {
      flowsMap[flow.flow_id] = {
        flow_id: flow.flow_id,
        flow_name: flow.flow_name,
        message_count: 0,
        recipients: 0,
        delivered: 0,
        opens: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0
      };
    }

    flowsMap[flow.flow_id].message_count += 1;
    flowsMap[flow.flow_id].recipients += flow.recipients || 0;
    flowsMap[flow.flow_id].delivered += flow.delivered || 0;
    flowsMap[flow.flow_id].opens += flow.opens_unique || 0;
    flowsMap[flow.flow_id].clicks += flow.clicks_unique || 0;
    flowsMap[flow.flow_id].conversions += flow.conversions || 0;
    flowsMap[flow.flow_id].revenue += flow.conversion_value || 0;
  });

  // If previous period data exists, create a map for lookup
  let prevMap = {};
  if (previousFlowsMap && Array.isArray(previousFlowsMap)) {
    previousFlowsMap.forEach(flow => {
      prevMap[flow.flow_id] = flow;
    });
  }

  // Calculate rates for each flow and add previous period comparison
  return Object.values(flowsMap).map(flow => {
    const currentMetrics = {
      ...flow,
      open_rate: flow.delivered > 0 ? (flow.opens / flow.delivered) * 100 : 0,
      click_rate: flow.delivered > 0 ? (flow.clicks / flow.delivered) * 100 : 0,
      conversion_rate: flow.delivered > 0 ? (flow.conversions / flow.delivered) * 100 : 0,
      delivery_rate: flow.recipients > 0 ? (flow.delivered / flow.recipients) * 100 : 0,
      bounce_rate: flow.delivered > 0 ? ((flow.bounced || 0) / flow.delivered) * 100 : 0,
      revenue_per_recipient: flow.recipients > 0 ? flow.revenue / flow.recipients : 0,
      conversion_value: flow.revenue
    };

    // Add previous period comparison if available
    const prevFlow = prevMap[flow.flow_id];
    if (prevFlow) {
      currentMetrics.previous_period = {
        recipients: prevFlow.recipients,
        open_rate: prevFlow.open_rate,
        click_rate: prevFlow.click_rate,
        conversion_rate: prevFlow.conversion_rate,
        revenue: prevFlow.revenue,
        revenue_per_recipient: prevFlow.revenue_per_recipient,
        bounce_rate: prevFlow.bounce_rate
      };
    }

    return currentMetrics;
  }).sort((a, b) => b.revenue - a.revenue);
}

// Helper function to generate daily performance data by flow
async function generateDailyPerformance(clickhouse, klaviyoPublicId, startDate, endDate) {
  try {
    const dailyQuery = `
      SELECT
        date,
        flow_id,
        argMax(flow_name, updated_at) as flow_name,
        argMax(recipients, updated_at) as recipients,
        argMax(delivered, updated_at) as delivered,
        argMax(opens_unique, updated_at) as opens_unique,
        argMax(clicks_unique, updated_at) as clicks_unique,
        argMax(conversions, updated_at) as conversions,
        argMax(conversion_value, updated_at) as conversion_value,
        argMax(open_rate, updated_at) as open_rate,
        argMax(click_rate, updated_at) as click_rate,
        argMax(conversion_rate, updated_at) as conversion_rate
      FROM flow_statistics
      WHERE klaviyo_public_id = {klaviyoId:String}
        AND date >= {startDate:String}
        AND date <= {endDate:String}
      GROUP BY date, flow_id
      ORDER BY date ASC, flow_name ASC
    `;

    const result = await clickhouse.query({
      query: dailyQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      format: 'JSONEachRow'
    });

    const dailyData = await result.json();

    // Group by date and flow
    const dateFlowMap = {};
    dailyData.forEach(row => {
      if (!dateFlowMap[row.date]) {
        dateFlowMap[row.date] = {};
      }
      dateFlowMap[row.date][row.flow_name] = {
        recipients: row.recipients || 0,
        delivered: row.delivered || 0,
        opens_unique: row.opens_unique || 0,
        clicks_unique: row.clicks_unique || 0,
        conversions: row.conversions || 0,
        conversion_value: row.conversion_value || 0,
        open_rate: row.open_rate || 0,
        click_rate: row.click_rate || 0,
        conversion_rate: row.conversion_rate || 0
      };
    });

    return dateFlowMap;
  } catch (error) {
    console.error('Error generating daily performance:', error);
    return {};
  }
}

// Helper function to generate daily performance data by message
async function generateDailyMessagePerformance(clickhouse, klaviyoPublicId, startDate, endDate) {
  try {
    const dailyQuery = `
      SELECT
        date,
        flow_message_id,
        argMax(flow_name, updated_at) as flow_name,
        argMax(flow_message_name, updated_at) as flow_message_name,
        argMax(recipients, updated_at) as recipients,
        argMax(delivered, updated_at) as delivered,
        argMax(opens_unique, updated_at) as opens_unique,
        argMax(clicks_unique, updated_at) as clicks_unique,
        argMax(conversions, updated_at) as conversions,
        argMax(conversion_value, updated_at) as conversion_value,
        argMax(open_rate, updated_at) as open_rate,
        argMax(click_rate, updated_at) as click_rate,
        argMax(conversion_rate, updated_at) as conversion_rate
      FROM flow_statistics
      WHERE klaviyo_public_id = {klaviyoId:String}
        AND date >= {startDate:String}
        AND date <= {endDate:String}
      GROUP BY date, flow_message_id
      ORDER BY date ASC, flow_name ASC
    `;

    const result = await clickhouse.query({
      query: dailyQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      format: 'JSONEachRow'
    });

    const dailyData = await result.json();

    // Group by date and message
    const dateMessageMap = {};
    dailyData.forEach(row => {
      if (!dateMessageMap[row.date]) {
        dateMessageMap[row.date] = {};
      }
      const messageKey = row.flow_message_id;
      dateMessageMap[row.date][messageKey] = {
        flow_name: row.flow_name,
        flow_message_name: row.flow_message_name || row.flow_message_id,
        recipients: row.recipients || 0,
        delivered: row.delivered || 0,
        opens_unique: row.opens_unique || 0,
        clicks_unique: row.clicks_unique || 0,
        conversions: row.conversions || 0,
        conversion_value: row.conversion_value || 0,
        open_rate: row.open_rate || 0,
        click_rate: row.click_rate || 0,
        conversion_rate: row.conversion_rate || 0
      };
    });

    return dateMessageMap;
  } catch (error) {
    console.error('Error generating daily message performance:', error);
    return {};
  }
}

// Helper function to calculate percentage change
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

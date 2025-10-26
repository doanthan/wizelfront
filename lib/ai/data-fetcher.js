/**
 * Data Fetcher - Dual-Mode Data Loading
 *
 * Fetches data from ClickHouse with mode-appropriate depth and scope:
 * - SINGLE_STORE: Detailed data (up to 90 days, full records)
 * - PORTFOLIO: Aggregated summaries (14 days max, top performers only)
 */

import { getClickHouseClient } from '@/lib/clickhouse';
import { storeIdsToKlaviyoIds } from '@/lib/utils/id-mapper';
import { AnalysisMode } from '@/lib/ai/mode-detector';

/**
 * Estimate token count for data
 * Rough heuristic: ~4 characters per token
 */
function estimateTokens(data) {
  const jsonString = JSON.stringify(data);
  return Math.ceil(jsonString.length / 4);
}

/**
 * Fetch campaign data based on mode
 *
 * @param {string} mode - Analysis mode (single_store | portfolio)
 * @param {string[]} klaviyoIds - Klaviyo public IDs
 * @param {Object} timeRange - Time range configuration
 * @param {Object} requirements - Data requirements
 * @returns {Promise<Object>} Campaign data
 */
export async function fetchCampaignData(mode, klaviyoIds, timeRange, requirements) {
  const clickhouse = getClickHouseClient();

  if (mode === AnalysisMode.SINGLE_STORE && requirements.campaigns === 'full') {
    // Single store: Get all campaigns with details
    const query = `
      SELECT
        campaign_id,
        campaign_name,
        DATE(date) as send_date,
        SUM(recipients) as recipients,
        SUM(opens_unique) as opens_unique,
        SUM(clicks_unique) as clicks_unique,
        SUM(conversions_unique) as conversions_unique,
        SUM(conversion_value) as revenue,
        (AVG(open_rate) / 100.0) * 100 as open_rate_pct,
        (AVG(click_rate) / 100.0) * 100 as click_rate_pct,
        (AVG(conversion_rate) / 100.0) * 100 as conversion_rate_pct,
        SUM(conversion_value) / NULLIF(SUM(recipients), 0) as revenue_per_recipient
      FROM campaign_statistics
      WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
        AND date >= toDate('${timeRange.startDate.toISOString().split('T')[0]}')
        AND date <= toDate('${timeRange.endDate.toISOString().split('T')[0]}')
      GROUP BY campaign_id, campaign_name, DATE(date)
      ORDER BY send_date DESC, revenue DESC
      LIMIT ${requirements.maxRecords || 1000}
    `;

    const result = await clickhouse.query({
      query,
      format: 'JSONEachRow'
    });

    const campaigns = await result.json();

    return {
      total: campaigns.length,
      campaigns,
      summary: {
        totalRecipients: campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0),
        totalRevenue: campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0),
        avgOpenRate: campaigns.length > 0
          ? (campaigns.reduce((sum, c) => sum + (c.open_rate_pct || 0), 0) / campaigns.length)
          : 0,
        avgClickRate: campaigns.length > 0
          ? (campaigns.reduce((sum, c) => sum + (c.click_rate_pct || 0), 0) / campaigns.length)
          : 0,
      },
      timeRange: {
        start: timeRange.startDate,
        end: timeRange.endDate,
        days: timeRange.days
      },
      tokenEstimate: estimateTokens(campaigns)
    };

  } else {
    // Portfolio mode: Get aggregated summary only
    const query = `
      SELECT
        klaviyo_public_id,
        COUNT(DISTINCT campaign_id) as total_campaigns,
        SUM(recipients) as total_recipients,
        SUM(opens_unique) as total_opens,
        SUM(clicks_unique) as total_clicks,
        SUM(conversions_unique) as total_conversions,
        SUM(conversion_value) as total_revenue,
        (AVG(open_rate) / 100.0) * 100 as avg_open_rate_pct,
        (AVG(click_rate) / 100.0) * 100 as avg_click_rate_pct,
        (AVG(conversion_rate) / 100.0) * 100 as avg_conversion_rate_pct
      FROM campaign_statistics
      WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
        AND date >= toDate('${timeRange.startDate.toISOString().split('T')[0]}')
        AND date <= toDate('${timeRange.endDate.toISOString().split('T')[0]}')
      GROUP BY klaviyo_public_id
    `;

    const result = await clickhouse.query({
      query,
      format: 'JSONEachRow'
    });

    const summaries = await result.json();

    // Also get top 10 campaigns per account for context
    const topCampaignsQuery = `
      SELECT
        klaviyo_public_id,
        campaign_id,
        campaign_name,
        SUM(recipients) as recipients,
        SUM(conversion_value) as revenue,
        (AVG(open_rate) / 100.0) * 100 as open_rate_pct,
        (AVG(click_rate) / 100.0) * 100 as click_rate_pct
      FROM campaign_statistics
      WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
        AND date >= toDate('${timeRange.startDate.toISOString().split('T')[0]}')
        AND date <= toDate('${timeRange.endDate.toISOString().split('T')[0]}')
      GROUP BY klaviyo_public_id, campaign_id, campaign_name
      ORDER BY revenue DESC
      LIMIT 10
    `;

    const topResult = await clickhouse.query({
      query: topCampaignsQuery,
      format: 'JSONEachRow'
    });

    const topCampaigns = await topResult.json();

    return {
      total: summaries.length,
      summaries,
      topPerformers: topCampaigns,
      tokenEstimate: estimateTokens({ summaries, topPerformers: topCampaigns })
    };
  }
}

/**
 * Fetch flow data based on mode
 *
 * @param {string} mode - Analysis mode
 * @param {string[]} klaviyoIds - Klaviyo public IDs
 * @param {Object} timeRange - Time range configuration
 * @param {Object} requirements - Data requirements
 * @returns {Promise<Object>} Flow data
 */
export async function fetchFlowData(mode, klaviyoIds, timeRange, requirements) {
  const clickhouse = getClickHouseClient();

  if (mode === AnalysisMode.SINGLE_STORE && requirements.flows === 'full') {
    // Single store: Get all flows with message-level details
    const query = `
      SELECT
        flow_id,
        flow_name,
        flow_message_id,
        flow_message_name,
        SUM(recipients) as recipients,
        SUM(opens_unique) as opens_unique,
        SUM(clicks_unique) as clicks_unique,
        SUM(conversions_unique) as conversions_unique,
        SUM(conversion_value) as revenue,
        (AVG(open_rate) / 100.0) * 100 as open_rate_pct,
        (AVG(click_rate) / 100.0) * 100 as click_rate_pct,
        (AVG(conversion_rate) / 100.0) * 100 as conversion_rate_pct,
        SUM(conversion_value) / NULLIF(SUM(recipients), 0) as revenue_per_recipient
      FROM flow_statistics
      WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
        AND date >= toDate('${timeRange.startDate.toISOString().split('T')[0]}')
        AND date <= toDate('${timeRange.endDate.toISOString().split('T')[0]}')
      GROUP BY flow_id, flow_name, flow_message_id, flow_message_name
      ORDER BY revenue DESC
      LIMIT ${requirements.maxRecords || 1000}
    `;

    const result = await clickhouse.query({
      query,
      format: 'JSONEachRow'
    });

    const flows = await result.json();

    // Group by flow_id for easier analysis
    const flowsGrouped = {};
    flows.forEach(flow => {
      if (!flowsGrouped[flow.flow_id]) {
        flowsGrouped[flow.flow_id] = {
          flow_id: flow.flow_id,
          flow_name: flow.flow_name,
          messages: [],
          totalRevenue: 0,
          totalRecipients: 0
        };
      }

      flowsGrouped[flow.flow_id].messages.push({
        message_id: flow.flow_message_id,
        message_name: flow.flow_message_name,
        recipients: flow.recipients,
        open_rate_pct: flow.open_rate_pct,
        click_rate_pct: flow.click_rate_pct,
        conversion_rate_pct: flow.conversion_rate_pct,
        revenue: flow.revenue,
        revenue_per_recipient: flow.revenue_per_recipient
      });

      flowsGrouped[flow.flow_id].totalRevenue += flow.revenue || 0;
      flowsGrouped[flow.flow_id].totalRecipients += flow.recipients || 0;
    });

    const flowsArray = Object.values(flowsGrouped);

    return {
      total: flowsArray.length,
      flows: flowsArray,
      messages: flows,
      summary: {
        totalFlows: flowsArray.length,
        totalMessages: flows.length,
        totalRevenue: flowsArray.reduce((sum, f) => sum + (f.totalRevenue || 0), 0),
        totalRecipients: flowsArray.reduce((sum, f) => sum + (f.totalRecipients || 0), 0)
      },
      tokenEstimate: estimateTokens(flowsArray)
    };

  } else {
    // Portfolio mode: Get flow summaries only
    const query = `
      SELECT
        klaviyo_public_id,
        COUNT(DISTINCT flow_id) as total_flows,
        SUM(recipients) as total_recipients,
        SUM(conversion_value) as total_revenue,
        (AVG(open_rate) / 100.0) * 100 as avg_open_rate_pct,
        (AVG(click_rate) / 100.0) * 100 as avg_click_rate_pct,
        (AVG(conversion_rate) / 100.0) * 100 as avg_conversion_rate_pct
      FROM flow_statistics
      WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
        AND date >= toDate('${timeRange.startDate.toISOString().split('T')[0]}')
        AND date <= toDate('${timeRange.endDate.toISOString().split('T')[0]}')
      GROUP BY klaviyo_public_id
    `;

    const result = await clickhouse.query({
      query,
      format: 'JSONEachRow'
    });

    const summaries = await result.json();

    // Get top 5 flows per account
    const topFlowsQuery = `
      SELECT
        klaviyo_public_id,
        flow_id,
        flow_name,
        SUM(recipients) as recipients,
        SUM(conversion_value) as revenue,
        (AVG(open_rate) / 100.0) * 100 as open_rate_pct
      FROM flow_statistics
      WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
        AND date >= toDate('${timeRange.startDate.toISOString().split('T')[0]}')
        AND date <= toDate('${timeRange.endDate.toISOString().split('T')[0]}')
      GROUP BY klaviyo_public_id, flow_id, flow_name
      ORDER BY revenue DESC
      LIMIT 5
    `;

    const topResult = await clickhouse.query({
      query: topFlowsQuery,
      format: 'JSONEachRow'
    });

    const topFlows = await topResult.json();

    return {
      total: summaries.length,
      summaries,
      topPerformers: topFlows,
      tokenEstimate: estimateTokens({ summaries, topPerformers: topFlows })
    };
  }
}

/**
 * Fetch account metrics (for portfolio mode comparisons)
 *
 * @param {string[]} klaviyoIds - Klaviyo public IDs
 * @param {Object} timeRange - Time range configuration
 * @returns {Promise<Object>} Account metrics with comparisons
 */
export async function fetchAccountMetrics(klaviyoIds, timeRange) {
  const clickhouse = getClickHouseClient();

  // Current period
  const currentQuery = `
    SELECT
      klaviyo_public_id,
      SUM(total_revenue) as revenue,
      SUM(total_orders) as orders,
      AVG(avg_order_value) as avg_order_value,
      SUM(campaign_sends) as campaign_sends,
      SUM(flow_sends) as flow_sends
    FROM account_metrics_daily
    WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
      AND date >= toDate('${timeRange.startDate.toISOString().split('T')[0]}')
      AND date <= toDate('${timeRange.endDate.toISOString().split('T')[0]}')
    GROUP BY klaviyo_public_id
  `;

  // Comparison period
  const comparisonQuery = timeRange.comparison ? `
    SELECT
      klaviyo_public_id,
      SUM(total_revenue) as revenue,
      SUM(total_orders) as orders,
      AVG(avg_order_value) as avg_order_value,
      SUM(campaign_sends) as campaign_sends,
      SUM(flow_sends) as flow_sends
    FROM account_metrics_daily
    WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
      AND date >= toDate('${timeRange.comparison.startDate.toISOString().split('T')[0]}')
      AND date <= toDate('${timeRange.comparison.endDate.toISOString().split('T')[0]}')
    GROUP BY klaviyo_public_id
  ` : null;

  const [currentResult, comparisonResult] = await Promise.all([
    clickhouse.query({ query: currentQuery, format: 'JSONEachRow' }),
    comparisonQuery ? clickhouse.query({ query: comparisonQuery, format: 'JSONEachRow' }) : null
  ]);

  const currentMetrics = await currentResult.json();
  const comparisonMetrics = comparisonResult ? await comparisonResult.json() : null;

  // Combine with comparisons
  const combined = currentMetrics.map(current => {
    const comparison = comparisonMetrics?.find(c => c.klaviyo_public_id === current.klaviyo_public_id);

    const changes = comparison ? {
      revenue: {
        current: current.revenue,
        previous: comparison.revenue,
        change: comparison.revenue > 0
          ? ((current.revenue - comparison.revenue) / comparison.revenue * 100).toFixed(1)
          : null
      },
      campaign_sends: {
        current: current.campaign_sends,
        previous: comparison.campaign_sends,
        change: comparison.campaign_sends > 0
          ? ((current.campaign_sends - comparison.campaign_sends) / comparison.campaign_sends * 100).toFixed(1)
          : null
      },
      flow_sends: {
        current: current.flow_sends,
        previous: comparison.flow_sends,
        change: comparison.flow_sends > 0
          ? ((current.flow_sends - comparison.flow_sends) / comparison.flow_sends * 100).toFixed(1)
          : null
      }
    } : null;

    return {
      klaviyo_public_id: current.klaviyo_public_id,
      current,
      comparison,
      changes
    };
  });

  return {
    accounts: combined,
    tokenEstimate: estimateTokens(combined)
  };
}

/**
 * Main data fetcher - Coordinates all data retrieval based on mode
 *
 * @param {Object} modeConfig - Mode configuration from mode-detector
 * @param {string[]} storePublicIds - Store public IDs
 * @returns {Promise<Object>} Fetched data
 */
export async function fetchAnalysisData(modeConfig, storePublicIds) {
  const { mode, timeRange, dataRequirements } = modeConfig;

  // Convert store IDs to Klaviyo IDs
  const { klaviyoIds, storeMap, errors } = await storeIdsToKlaviyoIds(storePublicIds);

  if (klaviyoIds.length === 0) {
    throw new Error('No valid Klaviyo integrations found for selected stores');
  }

  // Log ID mapping for debugging
  console.log('🔍 ID Mapping:', {
    storePublicIds,
    klaviyoIds,
    mode,
    errors: errors.length > 0 ? errors : 'none'
  });

  // Fetch data based on requirements
  const dataPromises = {};

  if (dataRequirements.campaigns) {
    dataPromises.campaigns = fetchCampaignData(mode, klaviyoIds, timeRange, dataRequirements);
  }

  if (dataRequirements.flows) {
    dataPromises.flows = fetchFlowData(mode, klaviyoIds, timeRange, dataRequirements);
  }

  // Portfolio mode: Always fetch account metrics for comparison
  if (mode === AnalysisMode.PORTFOLIO) {
    dataPromises.accountMetrics = fetchAccountMetrics(klaviyoIds, timeRange);
  }

  // Fetch all data in parallel
  const results = await Promise.all(
    Object.entries(dataPromises).map(async ([key, promise]) => {
      try {
        const data = await promise;
        return [key, data];
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        return [key, { error: error.message }];
      }
    })
  );

  const data = Object.fromEntries(results);

  // Calculate total token estimate
  const totalTokens = Object.values(data).reduce(
    (sum, d) => sum + (d.tokenEstimate || 0),
    0
  );

  return {
    ...data,
    metadata: {
      mode,
      timeRange,
      klaviyoIds,
      storeMap,
      dataRequirements,
      totalTokens,
      fetchedAt: new Date().toISOString()
    }
  };
}

/**
 * Example usage:
 *
 * ```javascript
 * import { getModeConfiguration } from '@/lib/ai/mode-detector';
 * import { fetchAnalysisData } from '@/lib/ai/data-fetcher';
 *
 * // Single store
 * const singleConfig = getModeConfiguration('XAeU8VL', 'Analyze my flows');
 * const singleData = await fetchAnalysisData(singleConfig, ['XAeU8VL']);
 * // Returns: { flows: { total: 8, flows: [...], messages: [...] }, metadata: {...} }
 *
 * // Portfolio
 * const portfolioConfig = getModeConfiguration(null, 'Any issues?');
 * const portfolioData = await fetchAnalysisData(portfolioConfig, ['XAeU8VL', '7MP60fH', 'zp7vNlc']);
 * // Returns: { campaigns: { summaries: [...], topPerformers: [...] }, accountMetrics: {...} }
 * ```
 */

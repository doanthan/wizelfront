/**
 * Intelligent Data Source Router
 *
 * Analyzes user queries and summary data to determine the optimal data source:
 * - Summary Data (On-screen): Fast, cheap, limited scope
 * - ClickHouse SQL: Comprehensive historical analysis
 * - Klaviyo MCP: Real-time live data from Klaviyo API
 *
 * Uses Haiku 4.5 for intelligent semantic routing
 */

import { makeOpenRouterRequest } from '@/lib/ai/openrouter';

/**
 * Query Types that help determine data source
 */
export const QueryType = {
  SUMMARY: 'summary',           // Answerable from summary data
  HISTORICAL: 'historical',     // Requires ClickHouse historical data
  REALTIME: 'realtime',         // Requires live Klaviyo MCP data
  COMPLEX: 'complex',           // Requires deep analysis across multiple sources
};

/**
 * Data Sufficiency Analysis
 * Checks if summary data contains enough information to answer the query
 */
export function analyzeSummaryDataSufficiency(query, summaryData) {
  const queryLower = query.toLowerCase();

  // Quick heuristics for data sufficiency
  const checks = {
    hasCampaignData: !!summaryData?.campaigns?.total && summaryData.campaigns.total > 0,
    hasFlowData: !!summaryData?.flows?.total && summaryData.flows.total > 0,
    hasRevenue: !!summaryData?.dashboard?.totalRevenue || !!summaryData?.campaigns?.summaryStats?.totalRevenue,
    hasTimeSeries: !!summaryData?.timeSeries?.length && summaryData.timeSeries.length > 0,
    hasTopPerformers: !!summaryData?.campaigns?.topPerformers?.length || !!summaryData?.flows?.topPerformers?.length,
    hasByAccount: !!summaryData?.byAccount?.length && summaryData.byAccount.length > 0,
  };

  // Check for queries requiring more data than summary provides
  const needsMore = {
    // Requests for specific counts beyond top 10
    largeListRequest: /\b(top|all|list)\s+(\d{2,}|all)\b/i.test(queryLower) &&
                      !/top\s+(5|10)\b/i.test(queryLower),

    // Specific filtering requirements
    specificFilters: /\b(with|having|where)\s+(open rate|click rate|revenue)\s*(<|>|less than|more than|below|above)\b/i.test(queryLower),

    // Advanced analytics
    cohortAnalysis: /\b(cohort|segment|group by|breakdown by)\b/i.test(queryLower),

    // Time-based comparisons beyond summary
    detailedTimeSeries: /\b(daily|weekly|trend|over time|growth|decline)\b/i.test(queryLower) && !checks.hasTimeSeries,

    // Product/customer level queries
    productLevel: /\b(product|sku|item|customer|profile|subscriber)\b/i.test(queryLower),

    // Attribution analysis
    attribution: /\b(attribution|attributed|source|channel breakdown)\b/i.test(queryLower),
  };

  const insufficientData = Object.values(needsMore).some(v => v);

  return {
    sufficient: !insufficientData && (checks.hasCampaignData || checks.hasFlowData || checks.hasRevenue),
    checks,
    reasons: Object.entries(needsMore).filter(([_, v]) => v).map(([key]) => key),
    recommendation: insufficientData ? 'clickhouse' : 'summary',
  };
}

/**
 * Determine if query needs real-time Klaviyo MCP data
 */
export function requiresRealtimeMCP(query) {
  const queryLower = query.toLowerCase();

  const mcpIndicators = {
    // Live state queries
    currentState: /\b(current|now|right now|live|active|currently|today)\s+(segment|flow|campaign|form)\b/i.test(queryLower),

    // Configuration queries
    listResources: /\b(list|show|get)\s+(my|all)?\s*(segments?|flows?|forms?|templates?|lists?)\b/i.test(queryLower),

    // Profile count queries (must be real-time)
    profileCounts: /\b(how many|count|number of)\s+(profiles?|subscribers?|people|contacts?)\b/i.test(queryLower),

    // Active/inactive status
    statusCheck: /\b(active|inactive|paused|draft|scheduled)\s+(campaigns?|flows?)\b/i.test(queryLower),

    // Segment membership
    segmentMembership: /\b(who is in|members of|profiles? in)\s+\w+\s+(segment|list)\b/i.test(queryLower),
  };

  const needsMCP = Object.values(mcpIndicators).some(v => v);

  return {
    required: needsMCP,
    indicators: Object.entries(mcpIndicators).filter(([_, v]) => v).map(([key]) => key),
    confidence: needsMCP ? 'high' : 'low',
  };
}

/**
 * Use Haiku 4.5 to intelligently route data source selection
 */
export async function routeDataSource(query, summaryData, context = {}) {
  // First, run quick heuristics
  const sufficiencyCheck = analyzeSummaryDataSufficiency(query, summaryData);
  const mcpCheck = requiresRealtimeMCP(query);

  // If clearly needs MCP, route there immediately
  if (mcpCheck.required && mcpCheck.confidence === 'high') {
    return {
      source: 'mcp',
      confidence: 'high',
      reason: `Real-time Klaviyo data required: ${mcpCheck.indicators.join(', ')}`,
      method: 'heuristic',
      fallback: 'clickhouse',
    };
  }

  // If summary data is sufficient, use it
  if (sufficiencyCheck.sufficient && sufficiencyCheck.checks.hasCampaignData) {
    return {
      source: 'summary',
      confidence: 'high',
      reason: 'Query answerable from available summary data',
      method: 'heuristic',
      fallback: null,
    };
  }

  // For ambiguous cases, use Haiku for intelligent routing
  return await routeWithHaiku(query, summaryData, sufficiencyCheck, mcpCheck, context);
}

/**
 * Use Haiku 4.5 for intelligent semantic data source routing
 */
async function routeWithHaiku(query, summaryData, sufficiencyCheck, mcpCheck, context) {
  const systemPrompt = `You are a data source router for a marketing analytics platform.

Your job: Determine which data source can best answer the user's query.

DATA SOURCES:
1. **SUMMARY** - On-screen aggregated data (fast, limited)
   - Top 10 campaigns/flows by revenue
   - Summary statistics (totals, averages, rates)
   - Account-level rollups
   - Time-series samples (max 20 points)
   USE WHEN: Query can be answered with visible aggregated data

2. **CLICKHOUSE** - Historical SQL database (comprehensive)
   - All historical campaigns, flows, orders, customers
   - Detailed filtering and segmentation
   - Product-level, customer-level analysis
   - Complex aggregations and breakdowns
   - Time-series with daily/hourly granularity
   USE WHEN: Query needs historical data beyond summaries

3. **MCP** - Real-time Klaviyo API (live state)
   - Current segment profile counts
   - Active/inactive flow status
   - Live campaign schedule
   - Current list memberships
   - Template configurations
   USE WHEN: Query needs live/current state from Klaviyo

AVAILABLE SUMMARY DATA:
${JSON.stringify({
  campaigns: summaryData?.campaigns ? {
    total: summaryData.campaigns.total,
    hasTopPerformers: summaryData.campaigns.topPerformers?.length > 0,
    summaryStats: !!summaryData.campaigns.summaryStats,
  } : null,
  flows: summaryData?.flows ? {
    total: summaryData.flows.total,
    hasTopPerformers: summaryData.flows.topPerformers?.length > 0,
  } : null,
  timeSeries: summaryData?.timeSeries?.length || 0,
  byAccount: summaryData?.byAccount?.length || 0,
}, null, 2)}

HEURISTIC ANALYSIS:
- Summary data sufficient: ${sufficiencyCheck.sufficient}
- Insufficiency reasons: ${sufficiencyCheck.reasons.join(', ') || 'none'}
- MCP indicators: ${mcpCheck.indicators.join(', ') || 'none'}

CONTEXT:
- Date range: ${context?.dateRange?.preset || 'unknown'} (${context?.dateRange?.daysSpan || 0} days)
- Selected accounts: ${context?.selectedStores?.length || 0}
- Page type: ${context?.pageType || 'unknown'}

Return JSON only:
{
  "source": "summary" | "clickhouse" | "mcp",
  "confidence": "low" | "medium" | "high",
  "reason": "Brief explanation of routing decision",
  "fallback": "summary" | "clickhouse" | "mcp" | null
}`;

  const userPrompt = `Route this user query to the optimal data source:

"${query}"

Return only JSON.`;

  try {
    const response = await makeOpenRouterRequest({
      model: process.env.OPENROUTER_MODEL_HAIKU || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    // Parse response
    let routingData;
    try {
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        routingData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Haiku routing response:', parseError);
      // Fallback to heuristic
      return {
        source: sufficiencyCheck.sufficient ? 'summary' : 'clickhouse',
        confidence: 'medium',
        reason: 'Haiku routing failed, using heuristic fallback',
        method: 'heuristic-fallback',
        fallback: null,
      };
    }

    return {
      ...routingData,
      method: 'haiku',
      cost: calculateCost(response.usage),
    };

  } catch (error) {
    console.error('Haiku routing failed:', error);

    // Fallback to heuristic routing
    if (mcpCheck.required) {
      return {
        source: 'mcp',
        confidence: 'medium',
        reason: 'MCP indicators detected (Haiku unavailable)',
        method: 'fallback',
        fallback: 'clickhouse',
      };
    }

    return {
      source: sufficiencyCheck.sufficient ? 'summary' : 'clickhouse',
      confidence: 'medium',
      reason: sufficiencyCheck.sufficient
        ? 'Summary data available (Haiku unavailable)'
        : 'Insufficient summary data (Haiku unavailable)',
      method: 'fallback',
      fallback: null,
    };
  }
}

/**
 * Calculate cost of Haiku routing
 */
function calculateCost(usage) {
  if (!usage) return { formatted: '$0.000000' };

  const inputCost = (usage.prompt_tokens / 1_000_000) * 1.0;
  const outputCost = (usage.completion_tokens / 1_000_000) * 5.0;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalCost,
    formatted: `$${totalCost.toFixed(6)}`,
  };
}

/**
 * Build context for data source routing
 */
export function buildRoutingContext(aiState) {
  return {
    pageType: aiState?.pageType,
    dateRange: aiState?.dateRange,
    selectedStores: aiState?.selectedStores,
    hasRawData: !!(
      aiState?.rawData?.campaigns?.length ||
      aiState?.rawData?.flows?.length ||
      aiState?.rawData?.revenue
    ),
    hasSummaryData: !!(
      aiState?.summaryData?.campaigns?.total ||
      aiState?.summaryData?.flows?.total ||
      aiState?.summaryData?.dashboard
    ),
  };
}

/**
 * Example usage:
 *
 * ```javascript
 * import { routeDataSource } from '@/lib/ai/data-source-router';
 *
 * const routing = await routeDataSource(
 *   "What were my top 20 campaigns by revenue last month?",
 *   summaryData, // Has top 10, user wants top 20
 *   { dateRange, selectedStores, pageType }
 * );
 *
 * console.log(routing);
 * // {
 * //   source: 'clickhouse',
 * //   confidence: 'high',
 * //   reason: 'Query requests top 20, summary only has top 10',
 * //   method: 'haiku',
 * //   fallback: 'summary'
 * // }
 * ```
 */

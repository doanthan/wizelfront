"use client";

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const AIContext = createContext({});

// ===================================================================
// CRITICAL: AI CONTEXT DESIGN PHILOSOPHY v4.0 - Smart Summarization
// ===================================================================
//
// **GUIDING PRINCIPLE**: Smart context, not data dumping
//
// **STRATEGY** (Following Shopify/Google Analytics patterns):
// 1. Send summary statistics, NOT raw arrays
// 2. Sample time-series to max 20-30 points
// 3. Pre-calculate insights and trends
// 4. Target 3,000-5,000 tokens per request (not 150k!)
// 5. Use query-specific data fetching
//
// **WHY THIS WORKS BETTER**:
// - Faster responses (better UX)
// - Lower costs (10-50x cheaper)
// - More focused insights (better quality)
// - Scales to more users
// - Follows industry best practices
//
// **TOKEN BUDGET**:
// - Simple queries: 2,000 tokens
// - Complex queries: 5,000 tokens
// - Deep analysis: 10,000 tokens MAX
// - Reserve 2,000 tokens for AI response
//
// **DATA PRIORITY** (what to send):
// 1. Summary statistics (totals, averages, changes)
// 2. Visible data context (what user sees on screen)
// 3. Sampled time-series (max 20 points per account)
// 4. Pre-calculated insights
// 5. User filters and selections
//
// **NEVER SEND**:
// - Complete campaign/flow arrays (hundreds of items)
// - Full time-series data (90+ days)
// - Duplicate information
// - Display formatting info
//
// ===================================================================

// Rough token estimation: 1 token ≈ 4 characters
const CHAR_TO_TOKEN_RATIO = 4;
const TARGET_CONTEXT_TOKENS = 5000; // Target for most queries
const MAX_CONTEXT_TOKENS = 10000; // Absolute maximum
const MAX_TIME_SERIES_POINTS = 20; // Max points per account

export function AIProvider({ children }) {
  // Core AI state - designed to hold MASSIVE amounts of raw data
  const [aiState, setAIState] = useState({
    // Page context
    currentPage: '',
    pageTitle: '',
    pageType: '', // 'dashboard' | 'campaigns' | 'flows' | 'revenue' | 'deliverability' | 'calendar'

    // Account/Store context
    selectedStores: [], // [{ value: 'store_id', label: 'Store Name', klaviyo_id: 'xxx' }]
    selectedKlaviyoIds: [],
    storeMetadata: {}, // Store-specific settings, industry, size, etc.

    // Time context
    dateRange: {
      start: null,
      end: null,
      preset: '', // 'last7days' | 'last30days' | 'last90days' | 'custom'
      daysSpan: 0, // Number of days in range
    },

    // SUMMARY DATA - Pre-aggregated statistics for AI consumption
    // IMPORTANT: Store summaries, NOT full arrays
    summaryData: {
      // Campaign summaries
      campaigns: {
        total: 0,
        topPerformers: [], // Top 5-10 campaigns only
        summaryStats: {
          totalSent: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
          totalRevenue: 0,
        },
      },

      // Flow summaries
      flows: {
        total: 0,
        topPerformers: [], // Top 5-10 flows only
        summaryStats: {
          totalRevenue: 0,
          avgConversion: 0,
        },
      },

      // Time-series data (sampled)
      timeSeries: [], // Max 20 points, sampled from full range

      // By-account breakdowns
      byAccount: [], // Summary per account

      // Metadata
      dataFreshness: null,
      estimatedTokens: 0,
    },

    // RAW DATA - Only used for server-side calculations
    // NEVER sent to AI - kept for UI display and calculations
    rawData: {
      campaigns: [], // Full array (used for calculations, NOT sent to AI)
      flows: [],
      segments: [],
      forms: [],
      metrics: {},
      orders: [],
      profiles: [],
    },

    // Filters and view state
    filters: {
      stores: [],
      channels: [], // 'email' | 'sms' | 'push' | 'whatsapp'
      campaigns: [],
      flows: [],
      tags: [],
      status: [], // 'draft' | 'scheduled' | 'sent' | 'paused'
      segmentType: [], // List/segment filters
      searchQuery: '', // User's search/filter text
    },

    // Pre-calculated insights (lightweight, won't count against token limit much)
    insights: {
      automated: [], // Quick insights from analysis
      patterns: {}, // Detected patterns
      recommendations: [], // Action recommendations
      opportunities: [], // Growth opportunities
      warnings: [], // Alerts
    },

    // User interaction context
    userContext: {
      recentQueries: [], // Last 5 queries
      currentIntent: '', // What user is trying to do
      focusArea: '', // What user is looking at
    },

    // Metadata
    timestamp: new Date().toISOString(),
    version: '3.0', // Context schema version
  });

  // History for context awareness
  const conversationHistory = useRef([]);
  const MAX_HISTORY = 20;

  // Update AI state with validation
  const updateAIState = useCallback((newState) => {
    setAIState(prevState => {
      const updated = {
        ...prevState,
        ...newState,
        timestamp: new Date().toISOString()
      };

      // Track state changes for context
      conversationHistory.current.unshift({
        timestamp: new Date().toISOString(),
        change: newState,
        page: newState.currentPage || prevState.currentPage
      });

      // Keep history limited
      if (conversationHistory.current.length > MAX_HISTORY) {
        conversationHistory.current = conversationHistory.current.slice(0, MAX_HISTORY);
      }

      return updated;
    });
  }, []);

  // Smart context builder - sends SUMMARIES only, not raw data
  const getAIContext = useCallback(() => {
    // Build smart summary context
    const context = buildSmartContext(aiState);
    const contextSize = estimateDataSize(context);

    // Return summary-based context (NOT raw data)
    return {
      routeToTier: 1, // On-screen context tier

      // Page metadata
      currentPage: aiState.currentPage,
      pageTitle: aiState.pageTitle,
      pageType: aiState.pageType,

      // Account/Store context
      selectedStores: aiState.selectedStores,
      selectedKlaviyoIds: aiState.selectedKlaviyoIds,

      // Time context
      dateRange: aiState.dateRange,

      // SUMMARY DATA (not raw arrays!)
      summaryData: aiState.summaryData,

      // Filters
      filters: aiState.filters,

      // Pre-calculated insights
      insights: aiState.insights,

      // User context
      userContext: aiState.userContext,

      // Conversation history
      conversationHistory: conversationHistory.current.slice(0, 5),

      // Formatted text summary for AI
      formattedContext: formatSummaryForHaiku(aiState),

      // Metadata
      dataSize: contextSize,
      timestamp: aiState.timestamp,
      version: aiState.version,
    };
  }, [aiState]);

  // Track user queries for better responses
  const trackUserQuery = useCallback((query, response) => {
    setAIState(prev => ({
      ...prev,
      userContext: {
        ...prev.userContext,
        recentQueries: [
          { query, response, timestamp: new Date().toISOString() },
          ...prev.userContext.recentQueries.slice(0, 4)
        ]
      }
    }));
  }, []);

  return (
    <AIContext.Provider value={{
      aiState,
      updateAIState,
      setAIState, // Direct setter for compatibility
      getAIContext,
      trackUserQuery,
      // Utility functions
      utils: {
        estimateDataSize,
        formatCurrency: (value) => formatCurrency(value),
        formatPercentage: (value) => formatPercentage(value),
        formatNumber: (value) => formatNumber(value),
      }
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

// ===================================================================
// SMART CONTEXT BUILDER
// Builds summary-based context from raw data
// ===================================================================

function buildSmartContext(state) {
  // If summaryData is already populated, return it
  if (state.summaryData && state.summaryData.estimatedTokens > 0) {
    return state.summaryData;
  }

  // Otherwise, build summaries from rawData
  const summaryData = {
    campaigns: buildCampaignSummary(state.rawData.campaigns),
    flows: buildFlowSummary(state.rawData.flows),
    timeSeries: sampleTimeSeries(state.rawData.timeSeries, MAX_TIME_SERIES_POINTS),
    byAccount: buildAccountSummaries(state.rawData, state.selectedStores),
    dataFreshness: new Date().toISOString(),
    estimatedTokens: 0, // Will be calculated
  };

  // Estimate token count for this summary
  summaryData.estimatedTokens = Math.ceil(JSON.stringify(summaryData).length / CHAR_TO_TOKEN_RATIO);

  return summaryData;
}

function buildCampaignSummary(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return { total: 0, topPerformers: [], summaryStats: {} };
  }

  // Sort by revenue and take top 10
  const topPerformers = [...campaigns]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 10)
    .map(c => ({
      name: c.campaign_name || c.name,
      sentAt: c.send_time,
      recipients: c.recipients,
      openRate: c.recipients > 0 ? ((c.opens_unique || 0) / c.recipients * 100).toFixed(1) : 0,
      clickRate: c.recipients > 0 ? ((c.clicks_unique || 0) / c.recipients * 100).toFixed(2) : 0,
      revenue: c.revenue || 0,
    }));

  // Calculate summary stats
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.opens_unique || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks_unique || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);

  return {
    total: campaigns.length,
    topPerformers,
    summaryStats: {
      totalSent: totalRecipients,
      avgOpenRate: totalRecipients > 0 ? (totalOpens / totalRecipients * 100).toFixed(1) : 0,
      avgClickRate: totalRecipients > 0 ? (totalClicks / totalRecipients * 100).toFixed(2) : 0,
      totalRevenue,
    },
  };
}

function buildFlowSummary(flows) {
  if (!flows || flows.length === 0) {
    return { total: 0, topPerformers: [], summaryStats: {} };
  }

  // Sort by revenue and take top 10
  const topPerformers = [...flows]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 10)
    .map(f => ({
      name: f.flow_name || f.name,
      status: f.status,
      triggers: f.trigger_count || f.triggers || 0,
      revenue: f.revenue || 0,
      conversionRate: (f.trigger_count || f.triggers || 0) > 0
        ? ((f.conversions || 0) / (f.trigger_count || f.triggers || 0) * 100).toFixed(2)
        : 0,
    }));

  const totalRevenue = flows.reduce((sum, f) => sum + (f.revenue || 0), 0);
  const totalConversions = flows.reduce((sum, f) => sum + (f.conversions || 0), 0);
  const totalTriggers = flows.reduce((sum, f) => sum + (f.trigger_count || f.triggers || 0), 0);

  return {
    total: flows.length,
    topPerformers,
    summaryStats: {
      totalRevenue,
      avgConversion: totalTriggers > 0 ? (totalConversions / totalTriggers * 100).toFixed(2) : 0,
    },
  };
}

function sampleTimeSeries(data, maxPoints) {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  if (data.length <= maxPoints) return data;

  // Sample evenly across the range
  const step = Math.floor(data.length / maxPoints);
  const sampled = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Always include the last data point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled.slice(0, maxPoints);
}

function buildAccountSummaries(rawData, selectedStores) {
  if (!selectedStores || selectedStores.length === 0) return [];

  return selectedStores.map(store => {
    // Filter data for this store
    const storeCampaigns = (rawData.campaigns || []).filter(c =>
      c.store_public_ids?.includes(store.value) || c.klaviyo_public_id === store.klaviyo_id
    );

    const storeFlows = (rawData.flows || []).filter(f =>
      f.store_public_ids?.includes(store.value) || f.klaviyo_public_id === store.klaviyo_id
    );

    // Calculate totals
    const campaignRevenue = storeCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const flowRevenue = storeFlows.reduce((sum, f) => sum + (f.revenue || 0), 0);
    const totalRevenue = campaignRevenue + flowRevenue;

    const totalRecipients = storeCampaigns.reduce((sum, c) => sum + (c.recipients || 0), 0);

    return {
      name: store.label,
      id: store.value,
      campaigns: storeCampaigns.length,
      flows: storeFlows.length,
      revenue: totalRevenue,
      recipients: totalRecipients,
    };
  });
}

// ===================================================================
// SUMMARY FORMATTER FOR HAIKU
// Converts summary data into concise, structured text
// ===================================================================

function formatSummaryForHaiku(state) {
  const {
    currentPage,
    pageTitle,
    pageType,
    selectedStores,
    dateRange,
    summaryData,
    filters,
    insights,
    userContext,
  } = state;

  let context = `# Wizel AI - Page Context Summary\n\n`;

  // Page identification
  context += `## Current View\n`;
  context += `**Page:** ${pageTitle || currentPage} (${pageType})\n`;
  if (selectedStores.length > 0) {
    context += `**Accounts:** ${selectedStores.map(s => s.label).join(', ')}\n`;
  }
  context += `**Date Range:** ${formatDateRange(dateRange)} (${dateRange.daysSpan} days)\n`;
  context += '\n';

  // Active filters (if any)
  const activeFilters = Object.entries(filters || {}).filter(([key, value]) => {
    if (key === 'searchQuery' && value) return true;
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });

  if (activeFilters.length > 0) {
    context += `## Active Filters\n`;
    activeFilters.forEach(([key, value]) => {
      if (key === 'searchQuery') {
        context += `- **Search:** "${value}"\n`;
      } else {
        context += `- **${formatMetricName(key)}:** ${formatFilterValue(value)}\n`;
      }
    });
    context += '\n';
  }

  // SUMMARY DATA - Pre-aggregated stats
  if (summaryData) {
    // Campaign summary
    if (summaryData.campaigns && summaryData.campaigns.total > 0) {
      const c = summaryData.campaigns;
      context += `## Campaign Summary (${c.total} total campaigns)\n\n`;
      context += `**Overall Stats:**\n`;
      context += `- Total Recipients: ${formatNumber(c.summaryStats.totalSent)}\n`;
      context += `- Avg Open Rate: ${c.summaryStats.avgOpenRate}%\n`;
      context += `- Avg Click Rate: ${c.summaryStats.avgClickRate}%\n`;
      context += `- Total Revenue: ${formatCurrency(c.summaryStats.totalRevenue)}\n\n`;

      if (c.topPerformers && c.topPerformers.length > 0) {
        context += `**Top ${c.topPerformers.length} Campaigns by Revenue:**\n`;
        c.topPerformers.forEach((campaign, i) => {
          context += `${i + 1}. ${campaign.name?.substring(0, 50) || 'Unnamed'}\n`;
          context += `   - Recipients: ${formatNumber(campaign.recipients)}, Open: ${campaign.openRate}%, Click: ${campaign.clickRate}%, Revenue: ${formatCurrency(campaign.revenue)}\n`;
        });
        context += '\n';
      }
    }

    // Flow summary
    if (summaryData.flows && summaryData.flows.total > 0) {
      const f = summaryData.flows;
      context += `## Flow Summary (${f.total} total flows)\n\n`;
      context += `**Overall Stats:**\n`;
      context += `- Total Revenue: ${formatCurrency(f.summaryStats.totalRevenue)}\n`;
      context += `- Avg Conversion: ${f.summaryStats.avgConversion}%\n\n`;

      if (f.topPerformers && f.topPerformers.length > 0) {
        context += `**Top ${f.topPerformers.length} Flows by Revenue:**\n`;
        f.topPerformers.forEach((flow, i) => {
          context += `${i + 1}. ${flow.name?.substring(0, 50) || 'Unnamed'} (${flow.status})\n`;
          context += `   - Triggers: ${formatNumber(flow.triggers)}, Conv: ${flow.conversionRate}%, Revenue: ${formatCurrency(flow.revenue)}\n`;
        });
        context += '\n';
      }
    }

    // Account breakdowns
    if (summaryData.byAccount && summaryData.byAccount.length > 0) {
      context += `## Performance by Account\n\n`;
      summaryData.byAccount.forEach(account => {
        context += `**${account.name}:**\n`;
        context += `- Campaigns: ${account.campaigns}, Flows: ${account.flows}\n`;
        context += `- Recipients: ${formatNumber(account.recipients)}, Revenue: ${formatCurrency(account.revenue)}\n\n`;
      });
    }

    // Time series (sampled)
    if (summaryData.timeSeries && summaryData.timeSeries.length > 0) {
      context += `## Trend Data (sampled to ${summaryData.timeSeries.length} points)\n\n`;
      context += `Recent data points available for trend analysis.\n\n`;
    }
  }

  // Quick insights (if pre-calculated)
  if (insights && insights.automated && insights.automated.length > 0) {
    context += `## Quick Insights\n`;
    insights.automated.forEach((insight, i) => {
      context += `${i + 1}. ${insight}\n`;
    });
    context += '\n';
  }

  // Patterns detected
  if (insights && insights.patterns && Object.keys(insights.patterns).length > 0) {
    context += `## Detected Patterns\n`;
    Object.entries(insights.patterns).forEach(([pattern, value]) => {
      context += `- **${formatMetricName(pattern)}:** ${JSON.stringify(value)}\n`;
    });
    context += '\n';
  }

  // Data quality metadata
  if (summaryData) {
    context += `## Data Info\n`;
    context += `- Est. tokens: ~${summaryData.estimatedTokens || 'calculating...'}\n`;
    context += `- Freshness: ${summaryData.dataFreshness || 'just fetched'}\n`;
    context += '\n';
  }

  return context;
}

// ===================================================================
// RAW DATA FORMATTERS - Dense, structured data for AI consumption
// ===================================================================

function formatCampaignsRaw(campaigns) {
  if (!campaigns || campaigns.length === 0) return 'No campaigns';

  let output = '';

  // Table header
  output += `| Campaign | Send Date | Recipients | Opens | Clicks | Revenue | Open% | Click% | Conv% |\n`;
  output += `|----------|-----------|-----------|-------|--------|---------|-------|--------|-------|\n`;

  // All campaigns (no truncation unless absolutely necessary)
  campaigns.forEach(c => {
    const name = (c.campaign_name || c.name || 'Unnamed').substring(0, 40);
    const sendDate = c.send_time ? new Date(c.send_time).toLocaleDateString() : 'N/A';
    const recipients = formatNumber(c.recipients || 0);
    const opens = formatNumber(c.opens_unique || 0);
    const clicks = formatNumber(c.clicks_unique || 0);
    const revenue = formatCurrency(c.revenue || 0);
    const openRate = c.recipients > 0 ? ((c.opens_unique || 0) / c.recipients * 100).toFixed(1) : '0.0';
    const clickRate = c.recipients > 0 ? ((c.clicks_unique || 0) / c.recipients * 100).toFixed(2) : '0.00';
    const convRate = c.recipients > 0 ? ((c.conversions || 0) / c.recipients * 100).toFixed(2) : '0.00';

    output += `| ${name} | ${sendDate} | ${recipients} | ${opens} | ${clicks} | ${revenue} | ${openRate}% | ${clickRate}% | ${convRate}% |\n`;
  });

  // Summary row
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.recipients || 0), 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.opens_unique || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks_unique || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

  output += `| **TOTAL** | - | ${formatNumber(totalRecipients)} | ${formatNumber(totalOpens)} | ${formatNumber(totalClicks)} | ${formatCurrency(totalRevenue)} | ${(totalOpens / totalRecipients * 100).toFixed(1)}% | ${(totalClicks / totalRecipients * 100).toFixed(2)}% | ${(totalConversions / totalRecipients * 100).toFixed(2)}% |\n`;

  return output;
}

function formatFlowsRaw(flows) {
  if (!flows || flows.length === 0) return 'No flows';

  let output = '';

  output += `| Flow Name | Status | Triggers | Conversions | Revenue | Conv% |\n`;
  output += `|-----------|--------|----------|-------------|---------|-------|\n`;

  flows.forEach(f => {
    const name = (f.flow_name || f.name || 'Unnamed').substring(0, 50);
    const status = f.status || 'unknown';
    const triggers = formatNumber(f.trigger_count || f.triggers || 0);
    const conversions = formatNumber(f.conversions || 0);
    const revenue = formatCurrency(f.revenue || 0);
    const convRate = (f.trigger_count || f.triggers || 0) > 0
      ? ((f.conversions || 0) / (f.trigger_count || f.triggers || 0) * 100).toFixed(2)
      : '0.00';

    output += `| ${name} | ${status} | ${triggers} | ${conversions} | ${revenue} | ${convRate}% |\n`;
  });

  return output;
}

function formatSegmentsRaw(segments) {
  if (!segments || segments.length === 0) return 'No segments';

  let output = '';

  output += `| Segment Name | Profile Count | Growth Rate |\n`;
  output += `|--------------|---------------|-------------|\n`;

  segments.forEach(s => {
    const name = (s.segment_name || s.name || 'Unnamed').substring(0, 50);
    const profileCount = formatNumber(s.profile_count || 0);
    const growthRate = s.growth_rate ? `${(s.growth_rate * 100).toFixed(1)}%` : 'N/A';

    output += `| ${name} | ${profileCount} | ${growthRate} |\n`;
  });

  return output;
}

function formatFormsRaw(forms) {
  if (!forms || forms.length === 0) return 'No forms';

  let output = '';

  output += `| Form Name | Views | Submissions | Conversion Rate |\n`;
  output += `|-----------|-------|-------------|------------------|\n`;

  forms.forEach(f => {
    const name = (f.form_name || f.name || 'Unnamed').substring(0, 50);
    const views = formatNumber(f.views || 0);
    const submissions = formatNumber(f.submissions || 0);
    const convRate = (f.views || 0) > 0
      ? ((f.submissions || 0) / (f.views || 0) * 100).toFixed(2)
      : '0.00';

    output += `| ${name} | ${views} | ${submissions} | ${convRate}% |\n`;
  });

  return output;
}

// ===================================================================
// DATA SIZE ESTIMATION
// ===================================================================

function estimateDataSize(rawData) {
  if (!rawData) {
    return { estimatedChars: 0, estimatedTokens: 0, breakdown: {} };
  }

  const breakdown = {
    campaigns: estimateArraySize(rawData.campaigns),
    flows: estimateArraySize(rawData.flows),
    segments: estimateArraySize(rawData.segments),
    forms: estimateArraySize(rawData.forms),
    metrics: estimateObjectSize(rawData.metrics),
    orders: estimateArraySize(rawData.orders),
    profiles: estimateArraySize(rawData.profiles),
  };

  const totalChars = Object.values(breakdown).reduce((sum, size) => sum + size, 0);
  const estimatedTokens = Math.ceil(totalChars / CHAR_TO_TOKEN_RATIO);

  return {
    estimatedChars: totalChars,
    estimatedTokens: estimatedTokens,
    breakdown: breakdown,
    fitsInContext: estimatedTokens < MAX_CONTEXT_TOKENS,
    utilizationPercent: (estimatedTokens / MAX_CONTEXT_TOKENS * 100).toFixed(1),
  };
}

function estimateArraySize(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;

  // Estimate size of first item, multiply by array length
  const sampleSize = JSON.stringify(arr[0] || {}).length;
  return sampleSize * arr.length;
}

function estimateObjectSize(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return JSON.stringify(obj).length;
}

// ===================================================================
// SQL FALLBACK SUGGESTION
// When data is too large, suggest SQL query structure
// ===================================================================

function generateSQLQuerySuggestion(state) {
  const { pageType, selectedKlaviyoIds, dateRange, filters } = state;

  let suggestion = {
    table: '',
    filters: [],
    aggregations: [],
    reasoning: '',
  };

  switch (pageType) {
    case 'campaigns':
      suggestion.table = 'campaign_statistics';
      suggestion.filters = [
        `klaviyo_public_id IN (${selectedKlaviyoIds.map(id => `'${id}'`).join(',')})`,
        `date >= '${dateRange.start}'`,
        `date <= '${dateRange.end}'`,
      ];
      suggestion.aggregations = [
        'SUM(recipients_count) as total_recipients',
        'SUM(opens_unique) as total_opens',
        'SUM(clicks_unique) as total_clicks',
        'SUM(attributed_revenue) as total_revenue',
      ];
      suggestion.reasoning = `Dataset too large for on-screen context. Use SQL to aggregate ${selectedKlaviyoIds.length} accounts over ${dateRange.daysSpan} days.`;
      break;

    case 'flows':
      suggestion.table = 'flow_statistics';
      suggestion.filters = [
        `klaviyo_public_id IN (${selectedKlaviyoIds.map(id => `'${id}'`).join(',')})`,
        `date >= '${dateRange.start}'`,
        `date <= '${dateRange.end}'`,
      ];
      suggestion.aggregations = [
        'COUNT(DISTINCT flow_id) as total_flows',
        'SUM(trigger_count) as total_triggers',
        'SUM(conversions) as total_conversions',
        'SUM(revenue) as total_revenue',
      ];
      suggestion.reasoning = `Flow data spans multiple accounts and long time range. SQL aggregation recommended.`;
      break;

    case 'revenue':
      suggestion.table = 'klaviyo_orders';
      suggestion.filters = [
        `klaviyo_public_id IN (${selectedKlaviyoIds.map(id => `'${id}'`).join(',')})`,
        `order_timestamp >= '${dateRange.start}'`,
        `order_timestamp <= '${dateRange.end}'`,
      ];
      suggestion.aggregations = [
        'COUNT(*) as total_orders',
        'SUM(value) as total_revenue',
        'AVG(value) as avg_order_value',
        'COUNT(DISTINCT profile_id) as unique_customers',
      ];
      suggestion.reasoning = `Revenue analysis across ${dateRange.daysSpan} days requires SQL for accurate aggregation.`;
      break;

    default:
      suggestion.reasoning = 'Data size exceeds context limit. Route to SQL tier for aggregation.';
  }

  return suggestion;
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function formatDateRange(dateRange) {
  if (dateRange.preset) {
    return dateRange.preset.replace(/([A-Z])/g, ' $1').toLowerCase();
  }
  if (dateRange.start && dateRange.end) {
    return `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
  }
  return 'N/A';
}

function formatFilterValue(value) {
  if (Array.isArray(value)) {
    return value.length > 3 ? `${value.slice(0, 3).join(', ')}... (${value.length} total)` : value.join(', ');
  }
  return String(value);
}

function formatMetricName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatPercentage(value) {
  if (value === null || value === undefined) return 'N/A';
  const percentage = value < 1 ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(value);
}

// ===================================================================
// USAGE EXAMPLE FOR PAGES (Updated for Smart Summarization)
// ===================================================================

/**
 * Example: Campaign Report Page with Smart Summarization
 *
 * ```jsx
 * import { useAI } from '@/app/contexts/ai-context';
 *
 * export default function CampaignsPage() {
 *   const { updateAIState } = useAI();
 *   const [campaigns, setCampaigns] = useState([]);
 *
 *   useEffect(() => {
 *     // Fetch all campaigns for display
 *     const fetchData = async () => {
 *       const response = await fetch('/api/campaigns');
 *       const allCampaigns = await response.json();
 *       setCampaigns(allCampaigns);
 *
 *       // Calculate date range span
 *       const dateRange = {
 *         start: startDate,
 *         end: endDate,
 *         preset: 'last30days',
 *         daysSpan: 30,
 *       };
 *
 *       // Store raw data (for UI display and calculations)
 *       // AI will automatically build summaries from this
 *       updateAIState({
 *         pageType: 'campaigns',
 *         pageTitle: 'Campaign Report',
 *         currentPage: '/campaigns',
 *         selectedStores: selectedAccounts,
 *         selectedKlaviyoIds: selectedAccounts.map(a => a.klaviyo_id),
 *         dateRange: dateRange,
 *
 *         // RAW DATA - Stored locally, NOT sent to AI
 *         // AI context will automatically summarize this
 *         rawData: {
 *           campaigns: allCampaigns, // All campaigns for calculations
 *         },
 *
 *         // Active filters
 *         filters: {
 *           stores: selectedAccounts.map(a => a.value),
 *           searchQuery: searchTerm,
 *         },
 *
 *         // User context
 *         userContext: {
 *           currentIntent: 'Analyzing campaign performance',
 *           focusArea: 'revenue',
 *         },
 *       });
 *     };
 *
 *     fetchData();
 *   }, [selectedAccounts, startDate, endDate, searchTerm]);
 *
 *   return (
 *     <div>
 *       {campaigns.map(campaign => (
 *         <CampaignCard key={campaign.id} campaign={campaign} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * **What gets sent to AI:**
 * - Summary statistics (totals, averages, changes)
 * - Top 10 campaigns only (not all 900)
 * - Sampled time-series (max 20 points)
 * - Account breakdowns
 * - Pre-calculated insights
 * - Total: ~3,000-5,000 tokens (not 150k!)
 *
 * **Benefits of Smart Summarization:**
 * - 10-50x cheaper per request
 * - 2-5x faster responses
 * - Better focused insights
 * - Scales to more users
 * - Industry best practice
 */

export default AIContext;

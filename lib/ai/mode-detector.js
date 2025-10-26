/**
 * Mode Detector - Determines Analysis Mode Based on Store Context
 *
 * Two modes:
 * 1. SINGLE_STORE: Deep dive analysis (up to 90 days, detailed data)
 * 2. PORTFOLIO: Multi-store overview (max 14 days, aggregated data)
 *
 * The mode is determined by the chatSelectedStore context:
 * - null → PORTFOLIO mode (all stores)
 * - string (store_public_id) → SINGLE_STORE mode
 */

export const AnalysisMode = {
  SINGLE_STORE: 'single_store',
  PORTFOLIO: 'portfolio'
};

export const ModeConfig = {
  [AnalysisMode.SINGLE_STORE]: {
    name: 'Single Store Deep Dive',
    description: 'Comprehensive analysis of one store with detailed recommendations',
    timeRange: {
      default: 90,              // Default: 90 days
      max: 90,                  // Maximum: 90 days
      comparison: true,         // Allow period-over-period comparisons
      comparisonDefault: 'previous_period' // Compare to previous 90 days
    },
    dataDepth: {
      campaigns: 'full',        // All campaigns with details
      flows: 'full',            // All flows with message-level data
      timeSeries: 'daily',      // Daily granularity
      segments: true,           // Include segment breakdowns
      products: true,           // Include product-level data
      maxRecords: 1000          // Max records to fetch per query
    },
    analysisTypes: [
      'flow_audit',             // Comprehensive flow optimization
      'campaign_performance',   // Campaign analysis with A/B test recommendations
      'audience_segmentation',  // Segment performance analysis
      'product_performance',    // Product-level insights
      'time_optimization'       // Send time and frequency optimization
    ],
    prompts: {
      flows: 'flows-audit',
      campaigns: 'campaigns-single-store',
      general: 'single-store-analyst'
    },
    tokenBudget: {
      max: 50000,               // Max tokens for context
      prompt: 8000,             // Estimated prompt tokens
      response: 4000,           // Max response tokens
      data: 38000               // Max data tokens (50K - 8K - 4K)
    }
  },

  [AnalysisMode.PORTFOLIO]: {
    name: 'Portfolio Health Overview',
    description: 'Multi-account monitoring with actionable alerts',
    timeRange: {
      default: 14,              // Default: 14 days (2 weeks)
      max: 14,                  // Maximum: 14 days (hard limit)
      comparison: true,         // Always compare to previous period
      comparisonDefault: 'previous_14_days' // Compare to previous 14 days
    },
    dataDepth: {
      campaigns: 'summary',     // Aggregated campaign stats only
      flows: 'summary',         // Aggregated flow stats only
      timeSeries: 'none',       // No time series (use aggregates)
      segments: false,          // No segment breakdowns
      products: false,          // No product-level data
      maxRecords: 100           // Max 100 records per store (top performers only)
    },
    analysisTypes: [
      'portfolio_health',       // Overall portfolio health score
      'critical_alerts',        // Issues requiring immediate attention
      'opportunities',          // Wins to replicate across accounts
      'cross_account_insights'  // Best practices identification
    ],
    prompts: {
      general: 'portfolio-health',
      flows: 'portfolio-health',
      campaigns: 'portfolio-health'
    },
    tokenBudget: {
      max: 30000,               // Max tokens for context (lower for multi-store)
      prompt: 5000,             // Estimated prompt tokens
      response: 3000,           // Max response tokens
      data: 22000               // Max data tokens (30K - 5K - 3K)
    }
  }
};

/**
 * Detect analysis mode from store context
 *
 * @param {string|null} chatSelectedStore - Selected store from chat context
 * @returns {Object} Mode configuration and metadata
 */
export function detectAnalysisMode(chatSelectedStore) {
  const isSingleStore = typeof chatSelectedStore === 'string' && chatSelectedStore !== null;

  const mode = isSingleStore ? AnalysisMode.SINGLE_STORE : AnalysisMode.PORTFOLIO;
  const config = ModeConfig[mode];

  return {
    mode,
    config,
    metadata: {
      selectedStore: chatSelectedStore,
      isSingleStore,
      isPortfolio: !isSingleStore,
      storeCount: isSingleStore ? 1 : 'multiple'
    }
  };
}

/**
 * Get time range configuration based on mode and user query
 *
 * @param {string} mode - Analysis mode
 * @param {string} query - User query
 * @param {Object} options - Additional options
 * @returns {Object} Time range configuration
 */
export function getTimeRangeConfig(mode, query = '', options = {}) {
  const config = ModeConfig[mode];
  const queryLower = query.toLowerCase();

  // Extract time range from query if specified
  let days = config.timeRange.default;

  // Check for explicit time ranges in query
  const timePatterns = [
    { regex: /last (\d+) days?/i, handler: (match) => Math.min(parseInt(match[1]), config.timeRange.max) },
    { regex: /past (\d+) days?/i, handler: (match) => Math.min(parseInt(match[1]), config.timeRange.max) },
    { regex: /last week/i, handler: () => 7 },
    { regex: /last month/i, handler: () => Math.min(30, config.timeRange.max) },
    { regex: /last (\d+) weeks?/i, handler: (match) => Math.min(parseInt(match[1]) * 7, config.timeRange.max) },
    { regex: /last quarter/i, handler: () => Math.min(90, config.timeRange.max) },
  ];

  for (const { regex, handler } of timePatterns) {
    const match = queryLower.match(regex);
    if (match) {
      days = handler(match);
      break;
    }
  }

  // Enforce mode-specific max
  days = Math.min(days, config.timeRange.max);

  // Calculate date ranges
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const comparisonStartDate = new Date(startDate);
  comparisonStartDate.setDate(comparisonStartDate.getDate() - days);
  const comparisonEndDate = new Date(startDate);

  return {
    days,
    startDate,
    endDate: now,
    comparison: config.timeRange.comparison ? {
      startDate: comparisonStartDate,
      endDate: comparisonEndDate,
      type: config.timeRange.comparisonDefault
    } : null,
    preset: days === 7 ? 'lastWeek' :
            days === 14 ? 'last14Days' :
            days === 30 ? 'lastMonth' :
            days === 90 ? 'last90Days' : 'custom',
    maxDaysAllowed: config.timeRange.max
  };
}

/**
 * Get data requirements based on mode and query intent
 *
 * @param {string} mode - Analysis mode
 * @param {string} query - User query
 * @param {Object} intentData - Intent detection results from Haiku
 * @returns {Object} Data requirements
 */
export function getDataRequirements(mode, query = '', intentData = {}) {
  const config = ModeConfig[mode];
  const queryLower = query.toLowerCase();

  // Determine what data is needed based on query
  const needs = {
    campaigns: false,
    flows: false,
    revenue: false,
    products: false,
    segments: false,
    timeSeries: false
  };

  // Campaign-related keywords
  if (/\b(campaign|email|send|broadcast|newsletter)\b/i.test(queryLower)) {
    needs.campaigns = true;
  }

  // Flow-related keywords
  if (/\b(flow|automation|welcome|abandon|browse|win-?back)\b/i.test(queryLower)) {
    needs.flows = true;
  }

  // Revenue/order keywords
  if (/\b(revenue|sales|orders?|aov|average order|conversion)\b/i.test(queryLower)) {
    needs.revenue = true;
  }

  // Product keywords
  if (/\b(product|item|sku|bestseller|top selling)\b/i.test(queryLower)) {
    needs.products = true;
  }

  // Segment keywords
  if (/\b(segment|audience|list|subscriber|vip|customer)\b/i.test(queryLower)) {
    needs.segments = true;
  }

  // Time-series/trend keywords
  if (/\b(trend|over time|daily|weekly|growth|decline|compare)\b/i.test(queryLower)) {
    needs.timeSeries = true;
  }

  // If no specific needs detected, default to campaigns and revenue
  if (!Object.values(needs).some(v => v)) {
    needs.campaigns = true;
    needs.revenue = true;
  }

  // Apply mode-specific constraints
  if (config.dataDepth.campaigns === 'summary') {
    needs.campaigns = 'summary';
  }

  if (config.dataDepth.flows === 'summary') {
    needs.flows = 'summary';
  }

  if (!config.dataDepth.products) {
    needs.products = false;
  }

  if (!config.dataDepth.segments) {
    needs.segments = false;
  }

  if (config.dataDepth.timeSeries === 'none') {
    needs.timeSeries = false;
  }

  return {
    ...needs,
    depth: config.dataDepth,
    maxRecords: config.dataDepth.maxRecords
  };
}

/**
 * Select appropriate prompt template based on mode and query
 *
 * @param {string} mode - Analysis mode
 * @param {string} query - User query
 * @returns {string} Prompt template name
 */
export function selectPromptTemplate(mode, query = '') {
  const config = ModeConfig[mode];
  const queryLower = query.toLowerCase();

  if (mode === AnalysisMode.PORTFOLIO) {
    // Portfolio mode always uses portfolio-health prompt
    return config.prompts.general;
  }

  // Single store mode - select based on query intent
  if (/\b(flow|automation)\b/i.test(queryLower)) {
    return config.prompts.flows;
  }

  if (/\b(campaign|email)\b/i.test(queryLower)) {
    return config.prompts.campaigns;
  }

  // Default to general analyst prompt
  return config.prompts.general || 'flows-audit';
}

/**
 * Validate if requested data fits within token budget
 *
 * @param {string} mode - Analysis mode
 * @param {number} estimatedDataTokens - Estimated tokens for data
 * @returns {Object} Validation result
 */
export function validateTokenBudget(mode, estimatedDataTokens) {
  const config = ModeConfig[mode];
  const budget = config.tokenBudget;

  const fits = estimatedDataTokens <= budget.data;
  const utilizationPct = (estimatedDataTokens / budget.data * 100).toFixed(1);

  return {
    valid: fits,
    estimatedDataTokens,
    maxDataTokens: budget.data,
    utilization: `${utilizationPct}%`,
    warning: estimatedDataTokens > budget.data * 0.9 ? 'Approaching token limit' : null,
    recommendation: fits ? null : `Reduce data scope (current: ${estimatedDataTokens} tokens, max: ${budget.data})`
  };
}

/**
 * Get complete mode configuration with all computed values
 *
 * @param {string|null} chatSelectedStore - Selected store
 * @param {string} query - User query
 * @param {Object} options - Additional options
 * @returns {Object} Complete mode configuration
 */
export function getModeConfiguration(chatSelectedStore, query = '', options = {}) {
  const { mode, config, metadata } = detectAnalysisMode(chatSelectedStore);
  const timeRange = getTimeRangeConfig(mode, query, options);
  const dataRequirements = getDataRequirements(mode, query, options.intentData);
  const promptTemplate = selectPromptTemplate(mode, query);

  return {
    mode,
    config,
    metadata,
    timeRange,
    dataRequirements,
    promptTemplate,
    tokenBudget: config.tokenBudget,
    description: `${config.name}: ${config.description}`,
    constraints: {
      maxDays: config.timeRange.max,
      maxRecords: config.dataDepth.maxRecords,
      depth: config.dataDepth.campaigns
    }
  };
}

/**
 * Example usage:
 *
 * ```javascript
 * import { getModeConfiguration, AnalysisMode } from '@/lib/ai/mode-detector';
 *
 * // Single store mode
 * const singleStoreConfig = getModeConfiguration(
 *   'XAeU8VL',  // store public_id
 *   'Analyze my flows and suggest optimizations'
 * );
 * console.log(singleStoreConfig);
 * // {
 * //   mode: 'single_store',
 * //   timeRange: { days: 90, ... },
 * //   dataRequirements: { campaigns: false, flows: 'full', ... },
 * //   promptTemplate: 'flows-audit'
 * // }
 *
 * // Portfolio mode
 * const portfolioConfig = getModeConfiguration(
 *   null,  // All stores
 *   'Any issues with my accounts?'
 * );
 * console.log(portfolioConfig);
 * // {
 * //   mode: 'portfolio',
 * //   timeRange: { days: 14, ... },
 * //   dataRequirements: { campaigns: 'summary', flows: 'summary', ... },
 * //   promptTemplate: 'portfolio-health'
 * // }
 * ```
 */

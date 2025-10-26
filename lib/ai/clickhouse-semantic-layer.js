/**
 * ClickHouse Semantic Layer for AI Chat
 *
 * Following the architecture pattern from /context/AI_CHAT.md:
 * - Semantic metrics definitions (single source of truth)
 * - Query templates for common patterns
 * - Intent-to-SQL translation
 * - Smart aggregation builders
 *
 * This provides a clean abstraction between natural language and ClickHouse SQL
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METRIC TYPES AND AGGREGATION METHODS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const MetricType = {
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage',
  COUNT: 'count',
  RATE: 'rate',
  RATIO: 'ratio',
  DAYS: 'days',
};

export const AggregationMethod = {
  SUM: 'sum',
  AVG: 'average',
  COUNT: 'count',
  WEIGHTED_AVG: 'weighted_average',
  MIN: 'min',
  MAX: 'max',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METRICS CATALOG - Single Source of Truth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const METRICS_CATALOG = {
  // ────────────────────────────────────────────────────────────
  // Campaign Metrics
  // ────────────────────────────────────────────────────────────
  campaign_revenue: {
    key: 'campaign_revenue',
    name: 'Campaign Revenue',
    description: 'Total revenue attributed to campaigns',
    ai_context: 'Revenue generated from email and SMS marketing campaigns in the selected time period',
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: 'SUM(conversion_value)',
    requires_time_range: true,
    category: 'marketing',
    table: 'campaign_statistics',
  },

  campaign_open_rate: {
    key: 'campaign_open_rate',
    name: 'Campaign Open Rate',
    description: 'Percentage of delivered emails that were opened',
    ai_context: 'The percentage of campaign emails that were opened at least once',
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: '(SUM(opens_unique) / NULLIF(SUM(delivered), 0)) * 100',
    requires_time_range: true,
    category: 'marketing',
    table: 'campaign_statistics',
  },

  campaign_click_rate: {
    key: 'campaign_click_rate',
    name: 'Campaign Click Rate',
    description: 'Percentage of delivered emails that received clicks',
    ai_context: 'The percentage of campaign emails where at least one link was clicked',
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: '(SUM(clicks_unique) / NULLIF(SUM(delivered), 0)) * 100',
    requires_time_range: true,
    category: 'marketing',
    table: 'campaign_statistics',
  },

  campaign_conversion_rate: {
    key: 'campaign_conversion_rate',
    name: 'Campaign Conversion Rate',
    description: 'Percentage of recipients who made a purchase',
    ai_context: 'The percentage of campaign recipients who made a purchase',
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: '(SUM(conversion_uniques) / NULLIF(SUM(recipients), 0)) * 100',
    requires_time_range: true,
    category: 'marketing',
    table: 'campaign_statistics',
  },

  // ────────────────────────────────────────────────────────────
  // Flow Metrics
  // ────────────────────────────────────────────────────────────
  flow_revenue: {
    key: 'flow_revenue',
    name: 'Flow Revenue',
    description: 'Revenue attributed to automated flows',
    ai_context: 'Revenue generated from automated email/SMS flows',
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: 'SUM(conversion_value)',
    requires_time_range: true,
    category: 'marketing',
    table: 'flow_statistics',
  },

  flow_trigger_count: {
    key: 'flow_trigger_count',
    name: 'Flow Triggers',
    description: 'Number of times flows were triggered',
    ai_context: 'Total number of times automated flows were triggered',
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: 'SUM(trigger_count)',
    requires_time_range: true,
    category: 'marketing',
    table: 'flow_statistics',
  },

  // ────────────────────────────────────────────────────────────
  // Revenue Metrics
  // ────────────────────────────────────────────────────────────
  total_revenue: {
    key: 'total_revenue',
    name: 'Total Revenue',
    description: 'Sum of all order values',
    ai_context: 'Total revenue from all orders in the time period',
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: 'SUM(value)',
    requires_time_range: true,
    category: 'revenue',
    table: 'klaviyo_orders',
  },

  total_orders: {
    key: 'total_orders',
    name: 'Total Orders',
    description: 'Count of all orders',
    ai_context: 'Total number of orders placed in the time period',
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.COUNT,
    clickhouse_expr: 'COUNT(DISTINCT order_id)',
    requires_time_range: true,
    category: 'revenue',
    table: 'klaviyo_orders',
  },

  average_order_value: {
    key: 'average_order_value',
    name: 'Average Order Value',
    description: 'Average value per order',
    ai_context: 'The average dollar amount spent per order',
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: 'AVG(value)',
    requires_time_range: true,
    category: 'revenue',
    table: 'klaviyo_orders',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY TEMPLATES - Pre-defined Query Patterns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const QUERY_TEMPLATES = {
  campaign_performance: {
    description: 'Campaign performance by revenue, engagement, and conversion',
    table: 'campaign_statistics',
    default_metrics: ['campaign_revenue', 'campaign_open_rate', 'campaign_click_rate', 'campaign_conversion_rate'],
    default_grouping: 'campaign_name',
    default_order: 'SUM(conversion_value) DESC',
    default_limit: 10,
    default_filters: [],
  },

  flow_performance: {
    description: 'Automated flow performance metrics',
    table: 'flow_statistics',
    default_metrics: ['flow_revenue', 'flow_trigger_count'],
    default_grouping: 'flow_name',
    default_order: 'SUM(conversion_value) DESC',
    default_limit: 10,
    default_filters: [],
  },

  daily_revenue: {
    description: 'Daily revenue trends over time',
    table: 'account_metrics_daily',
    default_metrics: ['total_revenue', 'total_orders', 'average_order_value'],
    default_grouping: 'date',
    default_order: 'date DESC',
    default_limit: 30,
    default_filters: [],
  },

  revenue_breakdown: {
    description: 'Revenue breakdown by period',
    table: 'klaviyo_orders',
    default_metrics: ['total_revenue', 'total_orders', 'average_order_value'],
    default_grouping: "toDate(order_timestamp) AS order_date",
    default_order: 'order_date DESC',
    default_limit: 90,
    default_filters: [],
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY BUILDER - Semantic Layer to SQL Translation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Build ClickHouse SQL query from semantic query specification
 */
export function buildSemanticQuery(spec) {
  const {
    template,           // Query template name (optional)
    metrics = [],       // Metric keys to fetch
    filters = [],       // WHERE clause filters
    groupBy = null,     // GROUP BY dimension
    orderBy = null,     // ORDER BY clause
    limit = 100,        // LIMIT
    klaviyoIds = [],    // CRITICAL: klaviyo_public_id filter
  } = spec;

  // Get template if specified
  const templateSpec = template ? QUERY_TEMPLATES[template] : null;

  // Determine table
  const table = templateSpec?.table || inferTableFromMetrics(metrics);

  // Determine metrics
  const metricsToFetch = metrics.length > 0
    ? metrics
    : (templateSpec?.default_metrics || []);

  // Build SELECT clause
  const selectFields = [];

  if (groupBy) {
    selectFields.push(groupBy);
  }

  // Add metric expressions
  for (const metricKey of metricsToFetch) {
    const metric = METRICS_CATALOG[metricKey];
    if (!metric) {
      console.warn(`Unknown metric: ${metricKey}`);
      continue;
    }

    selectFields.push(`${metric.clickhouse_expr} AS ${metricKey}`);
  }

  if (selectFields.length === 0) {
    throw new Error('No metrics specified for query');
  }

  // Build WHERE clause
  const whereClauses = [];

  // CRITICAL: Always filter by klaviyo_public_id
  if (klaviyoIds && klaviyoIds.length > 0) {
    const idsFormatted = klaviyoIds.map(id => `'${id}'`).join(', ');
    whereClauses.push(`klaviyo_public_id IN (${idsFormatted})`);
  }

  // Add custom filters
  whereClauses.push(...filters);

  // Add template default filters
  if (templateSpec?.default_filters) {
    whereClauses.push(...templateSpec.default_filters);
  }

  // Build GROUP BY
  const groupByClause = groupBy ? `GROUP BY ${groupBy}` : '';

  // Build ORDER BY
  const orderByClause = orderBy
    ? `ORDER BY ${orderBy}`
    : (templateSpec?.default_order ? `ORDER BY ${templateSpec.default_order}` : '');

  // Build LIMIT
  const limitClause = limit ? `LIMIT ${limit}` : '';

  // Assemble final query
  const query = `
    SELECT ${selectFields.join(', ')}
    FROM ${table}
    ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
    ${groupByClause}
    ${orderByClause}
    ${limitClause}
  `.trim();

  return {
    sql: query,
    table,
    metrics: metricsToFetch,
    template: template || 'custom',
  };
}

/**
 * Infer table name from metrics being queried
 */
function inferTableFromMetrics(metrics) {
  if (metrics.length === 0) return 'campaign_statistics'; // Default

  const metric = METRICS_CATALOG[metrics[0]];
  return metric?.table || 'campaign_statistics';
}

/**
 * Build time filter for ClickHouse
 */
export function buildTimeFilter(timeRange, dateField = 'date') {
  const mapping = {
    'last7days': `${dateField} >= today() - 7`,
    'last30days': `${dateField} >= today() - 30`,
    'last90days': `${dateField} >= today() - 90`,
    'lastYear': `${dateField} >= today() - 365`,
    'thisMonth': `toStartOfMonth(${dateField}) = toStartOfMonth(today())`,
    'lastMonth': `toStartOfMonth(${dateField}) = toStartOfMonth(today() - INTERVAL 1 MONTH)`,
    'yearToDate': `${dateField} >= toStartOfYear(today())`,
  };

  return mapping[timeRange] || `${dateField} >= today() - 30`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get lightweight metric context for AI intent classification
 */
export function getMetricContextForAI() {
  return {
    available_metrics: Object.values(METRICS_CATALOG).map(m => ({
      key: m.key,
      name: m.name,
      category: m.category,
      description: m.ai_context,
    })),
    metric_categories: Array.from(new Set(Object.values(METRICS_CATALOG).map(m => m.category))),
    common_queries: Object.keys(QUERY_TEMPLATES).map(key => ({
      type: key,
      description: QUERY_TEMPLATES[key].description,
    })),
  };
}

/**
 * Get metric definition by key
 */
export function getMetric(key) {
  return METRICS_CATALOG[key];
}

/**
 * Get all metrics in a category
 */
export function getMetricsByCategory(category) {
  return Object.values(METRICS_CATALOG).filter(m => m.category === category);
}

/**
 * Example usage:
 *
 * ```javascript
 * import { buildSemanticQuery, buildTimeFilter } from '@/lib/ai/clickhouse-semantic-layer';
 *
 * // Build query using template
 * const query = buildSemanticQuery({
 *   template: 'campaign_performance',
 *   klaviyoIds: ['XqkVGb', 'Pe5Xw6'],
 *   filters: [
 *     buildTimeFilter('last30days', 'date'),
 *   ],
 *   limit: 20,
 * });
 *
 * console.log(query.sql);
 * // SELECT campaign_name,
 * //        SUM(conversion_value) AS campaign_revenue,
 * //        (SUM(opens_unique) / NULLIF(SUM(delivered), 0)) * 100 AS campaign_open_rate,
 * //        (SUM(clicks_unique) / NULLIF(SUM(delivered), 0)) * 100 AS campaign_click_rate
 * // FROM campaign_statistics
 * // WHERE klaviyo_public_id IN ('XqkVGb', 'Pe5Xw6')
 * //   AND date >= today() - 30
 * // GROUP BY campaign_name
 * // ORDER BY SUM(conversion_value) DESC
 * // LIMIT 20
 * ```
 */

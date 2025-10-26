# AI Sidekick Implementation Guide - WizelReport Analytics Platform

> **Architecture Pattern**: Industry-standard semantic layer approach (Shopify/Google Analytics/Amplitude pattern)
> **Token Budget**: ~2,500 tokens per query vs 100,000+ naive approach
> **Cost**: $0.015 per query vs $0.60+ naive
> **Latency**: 2-3 seconds total

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Principles](#core-principles)
3. [Implementation Layers](#implementation-layers)
4. [Next.js API Structure](#nextjs-api-structure)
5. [Semantic Metrics Layer](#semantic-metrics-layer)
6. [Intent Classification](#intent-classification)
7. [Smart Data Fetcher](#smart-data-fetcher)
8. [Multi-Tier Caching](#multi-tier-caching)
9. [Response Generation](#response-generation)
10. [Complete Code Examples](#complete-code-examples)
11. [ClickHouse Schema Reference](#clickhouse-schema-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER QUERY                               │
│              "What are my top campaigns?"                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Intent Classification (Haiku - 200 tokens)        │
│  ─────────────────────────────────────────────────────────  │
│  Input: User query + Available metric names                 │
│  Output: {                                                   │
│    type: "campaign_performance",                             │
│    time_range: "last_30_days",                               │
│    metrics: ["revenue", "open_rate", "click_rate"],          │
│    grouping: "campaign_name",                                │
│    limit: 10                                                 │
│  }                                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: Data Fetching (ClickHouse Direct)                 │
│  ─────────────────────────────────────────────────────────  │
│  Execute query based on intent classification                │
│  Return ONLY the aggregated results (10-50 rows max)        │
│                                                               │
│  SELECT campaign_name, SUM(conversion_value) as revenue,     │
│         AVG(open_rate) as open_rate                          │
│  FROM campaign_statistics                                    │
│  WHERE klaviyo_public_id = 'xxx' AND date >= today() - 30  │
│  GROUP BY campaign_name ORDER BY revenue DESC LIMIT 10       │
│                                                               │
│  Result: 10 rows × 3 columns = ~500 tokens                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: Context Building (Smart Assembly)                 │
│  ─────────────────────────────────────────────────────────  │
│  {                                                            │
│    // Tier 1: Static (cached 30min)                         │
│    metric_definitions: { ... },    // 800 tokens            │
│    account_name: "Store XYZ",                                │
│                                                               │
│    // Tier 2: Semi-static (cached 5min)                     │
│    account_summary: {              // 300 tokens            │
│      total_revenue_30d: 125000,                              │
│      total_campaigns_30d: 45,                                │
│      avg_open_rate: 0.23                                     │
│    },                                                         │
│                                                               │
│    // Tier 3: Dynamic (fresh)                               │
│    query_result: [ ... ],          // 500 tokens            │
│    user_question: "What are my top campaigns?"              │
│  }                                                            │
│                                                               │
│  Total: ~2,000 tokens                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: AI Response Generation (Sonnet 4.5)               │
│  ─────────────────────────────────────────────────────────  │
│  "Your top 10 campaigns by revenue in the last 30 days:     │
│                                                               │
│  1. Spring Sale Email - $15,450 (24% open rate)             │
│  2. Welcome Series #3 - $12,300 (31% open rate)             │
│  ...                                                          │
│                                                               │
│  Your average open rate across all campaigns is 23%.        │
│  The top performer 'Welcome Series #3' has a 35% higher     │
│  open rate than average."                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### ✅ DO's

1. **NEVER send raw data to AI** - Always pre-aggregate in ClickHouse
2. **Use semantic layer** - Define metrics once, reference by name
3. **Implement multi-tier caching** - Static (30min), semi-static (5min), dynamic (0s)
4. **Query-specific fetching** - Only fetch what's needed based on intent
5. **Token budget discipline** - Target 2,000-3,000 tokens per query
6. **Progressive disclosure** - Start with summaries, drill down on request

### ❌ DON'Ts

1. **DON'T send all tables** - Use intent classification first
2. **DON'T send raw order data** - Send aggregations only
3. **DON'T skip caching** - Reduces costs by 80%+
4. **DON'T ignore time ranges** - Always limit data scope
5. **DON'T use SELECT *** - Specify exact columns needed
6. **DON'T forget parameterized queries** - Prevent SQL injection

---

## Implementation Layers

### Layer 1: Semantic Metrics Layer
**File**: `/lib/ai/metrics-definitions.js`
**Purpose**: Single source of truth for all metrics
**Token Usage**: 800 tokens (cached)

### Layer 2: Intent Classification Service
**File**: `/lib/ai/intent-classifier.js`
**Purpose**: Classify user queries into structured intents
**Token Usage**: 200 tokens per query
**Model**: Claude Haiku (fast & cheap)

### Layer 3: Smart Data Fetcher
**File**: `/lib/ai/data-fetcher.js`
**Purpose**: Execute ClickHouse queries based on intent
**Token Usage**: 0 tokens (direct DB query)

### Layer 4: Context Builder
**File**: `/lib/ai/context-builder.js`
**Purpose**: Assemble minimal context with caching
**Token Usage**: 1,500 tokens (mostly from cache)

### Layer 5: Response Generator
**File**: `/lib/ai/response-generator.js`
**Purpose**: Generate natural language responses
**Token Usage**: 2,500 tokens total
**Model**: Claude Sonnet 4.5

---

## Next.js API Structure

```
/app/api/ai/
├── chat/
│   └── route.js                  # Main chat endpoint
├── suggested-questions/
│   └── route.js                  # Generate follow-up questions
└── metrics/
    └── route.js                  # Get available metrics

/lib/ai/
├── metrics-definitions.js        # Semantic layer (Layer 1)
├── intent-classifier.js          # Intent classification (Layer 2)
├── data-fetcher.js              # Query builder (Layer 3)
├── context-builder.js           # Context assembly (Layer 4)
└── response-generator.js        # AI response (Layer 5)

/lib/clickhouse/
└── client.js                    # ClickHouse connection pool
```

---

## Semantic Metrics Layer

### File: `/lib/ai/metrics-definitions.js`

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEMANTIC METRICS LAYER - Single Source of Truth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Metric Types (constants)
export const MetricType = {
  CURRENCY: "currency",
  PERCENTAGE: "percentage",
  COUNT: "count",
  DAYS: "days",
  SCORE: "score",
  RATIO: "ratio"
};

// Aggregation Methods (constants)
export const AggregationMethod = {
  SUM: "sum",
  AVG: "average",
  COUNT: "count",
  WEIGHTED_AVG: "weighted_average",
  MIN: "min",
  MAX: "max"
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METRICS CATALOG - All Available Metrics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const METRICS_CATALOG = {
  // ────────────────────────────────────────────────────────────
  // Marketing Metrics - Campaigns
  // ────────────────────────────────────────────────────────────
  campaign_revenue: {
    key: "campaign_revenue",
    name: "Campaign Revenue",
    description: "Total revenue attributed to campaigns",
    ai_context: "Revenue generated from email and SMS marketing campaigns in the selected time period",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(conversion_value)",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["campaign_conversions", "campaign_rpr", "campaign_aov"]
  },

  campaign_open_rate: {
    key: "campaign_open_rate",
    name: "Campaign Open Rate",
    description: "Percentage of delivered emails that were opened",
    ai_context: "The percentage of campaign emails that were opened at least once",
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: "(SUM(opens_unique) / NULLIF(SUM(delivered), 0)) * 100",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["campaign_click_rate", "campaign_cto_rate"]
  },

  campaign_click_rate: {
    key: "campaign_click_rate",
    name: "Campaign Click Rate",
    description: "Percentage of delivered emails that received clicks",
    ai_context: "The percentage of campaign emails where at least one link was clicked",
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: "(SUM(clicks_unique) / NULLIF(SUM(delivered), 0)) * 100",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["campaign_open_rate", "campaign_cto_rate"]
  },

  campaign_cto_rate: {
    key: "campaign_cto_rate",
    name: "Click-to-Open Rate",
    description: "Percentage of opens that resulted in clicks",
    ai_context: "Of those who opened the email, what percentage clicked a link",
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: "(SUM(clicks_unique) / NULLIF(SUM(opens_unique), 0)) * 100",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["campaign_open_rate", "campaign_click_rate"]
  },

  campaign_conversion_rate: {
    key: "campaign_conversion_rate",
    name: "Campaign Conversion Rate",
    description: "Percentage of recipients who made a purchase",
    ai_context: "The percentage of campaign recipients who made a purchase after receiving the campaign",
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: "(SUM(conversion_uniques) / NULLIF(SUM(recipients), 0)) * 100",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["campaign_revenue", "campaign_aov"]
  },

  campaign_aov: {
    key: "campaign_aov",
    name: "Campaign Average Order Value",
    description: "Average order value from campaign conversions",
    ai_context: "The average order value for purchases attributed to campaigns",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: "AVG(average_order_value)",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["campaign_revenue", "campaign_conversions"]
  },

  campaign_rpr: {
    key: "campaign_rpr",
    name: "Revenue Per Recipient",
    description: "Average revenue generated per campaign recipient",
    ai_context: "How much revenue each recipient generates on average",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: "AVG(revenue_per_recipient)",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["campaign_revenue", "campaign_conversions"]
  },

  // ────────────────────────────────────────────────────────────
  // Marketing Metrics - Flows
  // ────────────────────────────────────────────────────────────
  flow_revenue: {
    key: "flow_revenue",
    name: "Flow Revenue",
    description: "Revenue attributed to automated flows",
    ai_context: "Revenue generated from automated email/SMS flows",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(conversion_value)",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["flow_conversions", "flow_open_rate"]
  },

  flow_open_rate: {
    key: "flow_open_rate",
    name: "Flow Open Rate",
    description: "Percentage of flow emails opened",
    ai_context: "The percentage of automated flow emails that were opened",
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.WEIGHTED_AVG,
    clickhouse_expr: "(SUM(opens_unique) / NULLIF(SUM(delivered), 0)) * 100",
    requires_time_range: true,
    category: "marketing",
    related_metrics: ["flow_click_rate", "flow_conversion_rate"]
  },

  // ────────────────────────────────────────────────────────────
  // Customer Metrics
  // ────────────────────────────────────────────────────────────
  customer_ltv: {
    key: "customer_ltv",
    name: "Customer Lifetime Value",
    description: "Total revenue per customer over their lifetime",
    ai_context: "Average total revenue generated per customer since they first purchased",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: "AVG(total_revenue)",
    requires_time_range: false,
    category: "customer",
    related_metrics: ["customer_aov", "customer_orders"]
  },

  customer_aov: {
    key: "customer_aov",
    name: "Average Order Value",
    description: "Average value per order",
    ai_context: "The average dollar amount spent per order",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: "AVG(avg_order_value)",
    requires_time_range: true,
    category: "customer",
    related_metrics: ["total_revenue", "total_orders"]
  },

  customer_orders: {
    key: "customer_orders",
    name: "Orders Per Customer",
    description: "Average number of orders per customer",
    ai_context: "How many orders each customer has placed on average",
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: "AVG(total_orders)",
    requires_time_range: false,
    category: "customer",
    related_metrics: ["customer_ltv", "customer_aov"]
  },

  churn_risk_customers: {
    key: "churn_risk_customers",
    name: "At-Risk Customers",
    description: "Number of high-value customers at risk of churning",
    ai_context: "Customers who haven't ordered recently but have high lifetime value",
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.COUNT,
    clickhouse_expr: "COUNT(DISTINCT customer_email)",
    requires_time_range: false,
    category: "customer",
    related_metrics: ["customer_ltv", "days_since_last_order"]
  },

  // ────────────────────────────────────────────────────────────
  // Product Metrics
  // ────────────────────────────────────────────────────────────
  product_revenue: {
    key: "product_revenue",
    name: "Product Revenue",
    description: "Total revenue by product",
    ai_context: "Total sales revenue generated by specific products",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(line_total)",
    requires_time_range: true,
    category: "product",
    related_metrics: ["product_units_sold", "product_avg_price"]
  },

  product_units_sold: {
    key: "product_units_sold",
    name: "Units Sold",
    description: "Total quantity of products sold",
    ai_context: "Number of product units sold in the time period",
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(quantity)",
    requires_time_range: true,
    category: "product",
    related_metrics: ["product_revenue", "product_avg_price"]
  },

  product_avg_price: {
    key: "product_avg_price",
    name: "Average Product Price",
    description: "Average selling price of product",
    ai_context: "The average price at which this product sells",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: "AVG(unit_price)",
    requires_time_range: true,
    category: "product",
    related_metrics: ["product_revenue", "product_units_sold"]
  },

  // ────────────────────────────────────────────────────────────
  // Order Metrics
  // ────────────────────────────────────────────────────────────
  total_orders: {
    key: "total_orders",
    name: "Total Orders",
    description: "Count of all orders",
    ai_context: "Total number of orders placed in the time period",
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.COUNT,
    clickhouse_expr: "COUNT(DISTINCT order_id)",
    requires_time_range: true,
    category: "orders",
    related_metrics: ["total_revenue", "customer_aov"]
  },

  total_revenue: {
    key: "total_revenue",
    name: "Total Revenue",
    description: "Sum of all order values",
    ai_context: "Total revenue from all orders in the time period",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(order_value)",
    requires_time_range: true,
    category: "orders",
    related_metrics: ["total_orders", "customer_aov"]
  },

  new_customer_orders: {
    key: "new_customer_orders",
    name: "New Customer Orders",
    description: "Orders from first-time customers",
    ai_context: "Number of orders from customers making their first purchase",
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(CASE WHEN is_first_order = 1 THEN 1 ELSE 0 END)",
    requires_time_range: true,
    category: "orders",
    related_metrics: ["total_orders", "new_customers"]
  },

  repeat_customer_orders: {
    key: "repeat_customer_orders",
    name: "Repeat Customer Orders",
    description: "Orders from returning customers",
    ai_context: "Number of orders from customers who have purchased before",
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(CASE WHEN is_first_order = 0 THEN 1 ELSE 0 END)",
    requires_time_range: true,
    category: "orders",
    related_metrics: ["total_orders", "returning_customers"]
  },

  // ────────────────────────────────────────────────────────────
  // Refund Metrics
  // ────────────────────────────────────────────────────────────
  total_refunds: {
    key: "total_refunds",
    name: "Total Refunds",
    description: "Number of refund events",
    ai_context: "Total number of refunds processed in the time period",
    unit: MetricType.COUNT,
    aggregation: AggregationMethod.COUNT,
    clickhouse_expr: "COUNT(DISTINCT event_id)",
    requires_time_range: true,
    category: "refunds",
    related_metrics: ["refund_amount", "refund_rate"]
  },

  refund_amount: {
    key: "refund_amount",
    name: "Refund Amount",
    description: "Total dollar value of refunds",
    ai_context: "Total amount refunded to customers in the time period",
    unit: MetricType.CURRENCY,
    aggregation: AggregationMethod.SUM,
    clickhouse_expr: "SUM(refund_amount)",
    requires_time_range: true,
    category: "refunds",
    related_metrics: ["total_refunds", "total_revenue"]
  },

  refund_rate: {
    key: "refund_rate",
    name: "Refund Rate",
    description: "Percentage of orders refunded",
    ai_context: "The percentage of orders that resulted in a refund",
    unit: MetricType.PERCENTAGE,
    aggregation: AggregationMethod.AVG,
    clickhouse_expr: "AVG(refund_rate) * 100",
    requires_time_range: true,
    category: "refunds",
    related_metrics: ["total_refunds", "total_orders"]
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY TEMPLATES - Pre-defined query patterns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const QUERY_TEMPLATES = {
  campaign_performance: {
    table: "campaign_statistics",
    default_metrics: ["campaign_revenue", "campaign_open_rate", "campaign_click_rate", "campaign_conversion_rate"],
    default_grouping: "campaign_name",
    default_filters: ["date >= today() - 30"],
    default_order: "campaign_revenue DESC",
    default_limit: 10,
    description: "Campaign performance by revenue, engagement, and conversion"
  },

  flow_performance: {
    table: "flow_statistics",
    default_metrics: ["flow_revenue", "flow_open_rate", "campaign_conversion_rate"],
    default_grouping: "flow_name",
    default_filters: ["date >= today() - 30"],
    default_order: "flow_revenue DESC",
    default_limit: 10,
    description: "Automated flow performance metrics"
  },

  customer_segments: {
    table: "customer_profiles",
    default_metrics: ["customer_ltv", "customer_aov", "customer_orders"],
    default_grouping: "rfm_segment",
    default_filters: [],
    default_order: "customer_ltv DESC",
    default_limit: null,
    description: "Customer segmentation by RFM analysis"
  },

  product_bestsellers: {
    table: "klaviyo_order_line_items",
    default_metrics: ["product_revenue", "product_units_sold", "product_avg_price"],
    default_grouping: "product_name",
    default_filters: ["order_date >= today() - 30"],
    default_order: "product_revenue DESC",
    default_limit: 20,
    description: "Top selling products by revenue and quantity"
  },

  daily_trends: {
    table: "account_metrics_daily",
    default_metrics: ["total_revenue", "total_orders", "customer_aov"],
    default_grouping: "date",
    default_filters: ["date >= today() - 30"],
    default_order: "date DESC",
    default_limit: 30,
    description: "Daily business metrics over time"
  },

  churn_analysis: {
    table: "customer_profiles",
    default_metrics: ["customer_ltv", "churn_risk_customers"],
    default_grouping: null,
    default_filters: [
      "rfm_segment IN ('At Risk', 'Cannot Lose Them', 'Hibernating')",
      "total_revenue > 500"
    ],
    default_order: "total_revenue DESC",
    default_limit: 50,
    description: "High-value customers at risk of churning"
  },

  discount_analysis: {
    table: "product_discount_analysis",
    default_metrics: ["product_revenue", "product_units_sold"],
    default_grouping: "product_name",
    default_filters: ["total_orders_with_discount + total_orders_without_discount >= 10"],
    default_order: "discount_dependency_score DESC",
    default_limit: 20,
    description: "Product discount dependency analysis"
  },

  geographic_performance: {
    table: "klaviyo_orders",
    default_metrics: ["total_revenue", "total_orders", "customer_aov"],
    default_grouping: "shipping_state",
    default_filters: ["order_date >= today() - 30", "shipping_country = 'US'"],
    default_order: "total_revenue DESC",
    default_limit: 20,
    description: "Revenue performance by geographic location"
  },

  refund_tracking: {
    table: "refund_cancelled_orders",
    default_metrics: ["total_refunds", "refund_amount"],
    default_grouping: "toDate(event_timestamp) AS refund_date",
    default_filters: ["event_timestamp >= now() - INTERVAL 30 DAY"],
    default_order: "refund_date DESC",
    default_limit: 30,
    description: "Refund tracking over time"
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get lightweight metric context for AI intent classification
 * Used in Stage 1 to help AI understand available metrics
 */
export function getMetricContextForAI() {
  return {
    available_metrics: Object.values(METRICS_CATALOG).map(m => ({
      key: m.key,
      name: m.name,
      category: m.category,
      description: m.ai_context
    })),
    metric_categories: Array.from(new Set(Object.values(METRICS_CATALOG).map(m => m.category))),
    common_queries: Object.keys(QUERY_TEMPLATES).map(key => ({
      type: key,
      description: QUERY_TEMPLATES[key].description
    }))
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
 * Get query template by type
 */
export function getQueryTemplate(type) {
  return QUERY_TEMPLATES[type];
}
```

---

## Intent Classification

### File: `/lib/ai/intent-classifier.js`

```javascript
import Anthropic from "@anthropic-ai/sdk";
import { getMetricContextForAI } from "./metrics-definitions.js";

/**
 * Intent Classifier - Classifies user queries into structured intents
 */
export class IntentClassifier {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Classify user intent using Haiku (fast + cheap)
   * Returns structured QueryIntent for data fetching
   *
   * @param {string} userQuery - The user's question
   * @param {Array<{role: string, content: string}>} conversationHistory - Previous messages
   * @returns {Promise<Object>} QueryIntent object
   */
  async classifyIntent(userQuery, conversationHistory = []) {
    const metricContext = getMetricContextForAI();

    const prompt = `You are a query intent classifier for a marketing analytics platform.

Available query types:
${metricContext.common_queries.map(q => `- ${q.type}: ${q.description}`).join('\n')}

Available metric categories:
${metricContext.metric_categories.join(', ')}

Sample metrics:
${metricContext.available_metrics.slice(0, 20).map(m => `- ${m.key}: ${m.description}`).join('\n')}

User question: "${userQuery}"

Return a JSON object with:
- query_type: One of the query types above
- metrics: Array of metric keys to fetch (max 5)
- time_range: "last_7_days", "last_30_days", "last_90_days", "last_year", or "all_time"
- grouping: What dimension to group by (campaign_name, product_name, customer_email, date, etc.) or null
- limit: Number of results (10-50)

Example output:
{
  "query_type": "campaign_performance",
  "metrics": ["campaign_revenue", "campaign_open_rate", "campaign_click_rate"],
  "time_range": "last_30_days",
  "grouping": "campaign_name",
  "limit": 10,
  "filters": [],
  "additional_context": {}
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

    const response = await this.client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      temperature: 0,
      messages: [
        ...conversationHistory,
        { role: "user", content: prompt }
      ]
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format from AI");
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const intent = JSON.parse(jsonMatch[0]);

    // Set defaults for missing fields
    intent.filters = intent.filters || [];
    intent.additional_context = intent.additional_context || {};

    return intent;
  }
}
```

---

## Smart Data Fetcher

### File: `/lib/ai/data-fetcher.js`

```javascript
import { METRICS_CATALOG, QUERY_TEMPLATES } from "./metrics-definitions.js";

/**
 * Smart Data Fetcher - Executes ClickHouse queries based on intent
 */
export class SmartDataFetcher {
  constructor(clickhouse) {
    this.clickhouse = clickhouse;
  }

  /**
   * Convert time_range string to ClickHouse SQL filter
   */
  buildTimeFilter(timeRange) {
    const mapping = {
      "last_7_days": "date >= today() - 7",
      "last_30_days": "date >= today() - 30",
      "last_90_days": "date >= today() - 90",
      "last_year": "date >= today() - 365",
      "this_month": "toStartOfMonth(date) = toStartOfMonth(today())",
      "last_month": "toStartOfMonth(date) = toStartOfMonth(today() - INTERVAL 1 MONTH)",
      "year_to_date": "date >= toStartOfYear(today())",
      "all_time": "1=1"
    };

    return mapping[timeRange] || "date >= today() - 30";
  }

  /**
   * Fetch aggregated data based on classified intent
   * Returns summary stats + top N results (never raw data)
   *
   * @param {Object} intent - Classified query intent
   * @param {string} klaviyoPublicId - Account identifier
   * @returns {Promise<Object>} QueryResult object
   */
  async fetchForIntent(intent, klaviyoPublicId) {
    // Get query template
    const template = QUERY_TEMPLATES[intent.query_type];
    if (!template) {
      throw new Error(`Unknown query type: ${intent.query_type}`);
    }

    const table = template.table;

    // Build SELECT clause from requested metrics
    const selectFields = [];

    if (intent.grouping) {
      selectFields.push(intent.grouping);
    }

    for (const metricKey of intent.metrics) {
      const metricDef = METRICS_CATALOG[metricKey];
      if (!metricDef) {
        console.warn(`Unknown metric: ${metricKey}`);
        continue;
      }
      selectFields.push(`${metricDef.clickhouse_expr} AS ${metricKey}`);
    }

    // Build WHERE clause
    const whereClauses = [`klaviyo_public_id = '${klaviyoPublicId}'`];

    // Add time filter if metrics require it
    const requiresTimeRange = intent.metrics.some(
      key => METRICS_CATALOG[key]?.requires_time_range
    );
    if (requiresTimeRange && intent.time_range) {
      whereClauses.push(this.buildTimeFilter(intent.time_range));
    }

    // Add custom filters
    whereClauses.push(...(intent.filters || []));
    whereClauses.push(...(template.default_filters || []));

    // Build GROUP BY
    const groupBy = intent.grouping ? `GROUP BY ${intent.grouping}` : "";

    // Build ORDER BY
    const orderBy = template.default_order
      ? `ORDER BY ${template.default_order}`
      : "";

    // Build LIMIT
    const limit = intent.limit ? `LIMIT ${intent.limit}` : "";

    // Construct main query
    const query = `
      SELECT ${selectFields.join(', ')}
      FROM ${table}
      WHERE ${whereClauses.join(' AND ')}
      ${groupBy}
      ${orderBy}
      ${limit}
    `.trim();

    console.log('🔍 Executing query:', query);

    // Execute query
    const result = await this.clickhouse.query({
      query,
      format: 'JSONEachRow'
    });

    const rows = await result.json();

    // Also fetch summary stats
    const summaryFields = intent.metrics
      .map(key => {
        const metric = METRICS_CATALOG[key];
        return metric ? `${metric.clickhouse_expr} AS ${key}` : null;
      })
      .filter(Boolean);

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT ${intent.grouping || '*'}) as total_count,
        ${summaryFields.join(', ')}
      FROM ${table}
      WHERE ${whereClauses.join(' AND ')}
    `.trim();

    const summaryResult = await this.clickhouse.query({
      query: summaryQuery,
      format: 'JSONEachRow'
    });

    const summaryRows = await summaryResult.json();
    const summary = summaryRows[0] || {};

    return {
      query_type: intent.query_type,
      time_range: intent.time_range,
      summary,
      results: rows,
      result_count: rows.length,
      generated_sql: query
    };
  }
}
```

---

## Multi-Tier Caching

### File: `/lib/ai/context-builder.js`

```javascript
import { getMetricContextForAI } from "./metrics-definitions.js";

/**
 * AI Context Builder - Assembles context with multi-tier caching
 */
export class AIContextBuilder {
  constructor(clickhouse, redis = null) {
    this.clickhouse = clickhouse;
    this.redis = redis;
  }

  /**
   * Get from cache if available
   */
  async getCached(key) {
    if (!this.redis) return null;
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  }

  /**
   * Set cache with TTL
   */
  async setCached(key, value, ttlSeconds) {
    if (!this.redis) return;
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error('Cache set error:', err);
    }
  }

  /**
   * Tier 1: Static context (cached 30 minutes)
   * Metric definitions, query types, etc.
   * ~800 tokens
   */
  async getStaticContext() {
    const cacheKey = "ai:context:static";
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    const context = {
      metric_definitions: getMetricContextForAI(),
      system_capabilities: [
        "Campaign performance analysis",
        "Customer segmentation and LTV",
        "Product performance tracking",
        "Churn prediction and prevention",
        "Discount effectiveness analysis",
        "Geographic revenue breakdown",
        "Refund and return analysis",
        "Daily/weekly/monthly trends"
      ]
    };

    await this.setCached(cacheKey, context, 1800); // 30 min
    return context;
  }

  /**
   * Tier 2: Semi-static context (cached 5 minutes)
   * Account summary stats, recent totals
   * ~300 tokens
   */
  async getAccountContext(klaviyoPublicId) {
    const cacheKey = `ai:context:account:${klaviyoPublicId}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    // Fetch summary stats from account_metrics_daily
    const query = `
      SELECT
        SUM(total_revenue) as revenue_30d,
        SUM(total_orders) as orders_30d,
        AVG(avg_order_value) as avg_aov,
        SUM(new_customers) as new_customers_30d,
        SUM(campaigns_sent) as campaigns_sent_30d,
        SUM(campaign_revenue) as campaign_revenue_30d,
        SUM(flow_revenue) as flow_revenue_30d,
        AVG(email_opens / NULLIF(email_delivered, 0)) * 100 as avg_email_open_rate
      FROM account_metrics_daily
      WHERE klaviyo_public_id = '${klaviyoPublicId}'
        AND date >= today() - 30
    `;

    const result = await this.clickhouse.query({
      query,
      format: 'JSONEachRow'
    });

    const rows = await result.json();
    const row = rows[0] || {};

    const context = {
      account_id: klaviyoPublicId,
      summary_30d: {
        total_revenue: parseFloat(row.revenue_30d || 0),
        total_orders: parseInt(row.orders_30d || 0),
        avg_order_value: parseFloat(row.avg_aov || 0),
        new_customers: parseInt(row.new_customers_30d || 0),
        campaigns_sent: parseInt(row.campaigns_sent_30d || 0),
        campaign_revenue: parseFloat(row.campaign_revenue_30d || 0),
        flow_revenue: parseFloat(row.flow_revenue_30d || 0),
        avg_email_open_rate: parseFloat(row.avg_email_open_rate || 0)
      },
      current_date: new Date().toISOString().split('T')[0]
    };

    await this.setCached(cacheKey, context, 300); // 5 min
    return context;
  }

  /**
   * Assemble complete context for AI response generation
   * Total: ~2,000-3,000 tokens
   */
  async buildFullContext(klaviyoPublicId, userQuery, queryResults) {
    const [staticContext, accountContext] = await Promise.all([
      this.getStaticContext(),
      this.getAccountContext(klaviyoPublicId)
    ]);

    return {
      // Tier 1: Static (~800 tokens)
      metric_definitions: staticContext.metric_definitions,
      system_capabilities: staticContext.system_capabilities,

      // Tier 2: Semi-static (~300 tokens)
      account_summary: accountContext.summary_30d,
      current_date: accountContext.current_date,

      // Tier 3: Dynamic (~1000 tokens)
      user_question: userQuery,
      query_type: queryResults.query_type,
      time_range: queryResults.time_range,
      data_summary: queryResults.summary,
      top_results: queryResults.results.slice(0, 20), // Max 20 rows
      total_results: queryResults.result_count
    };
  }
}
```

---

## Response Generation

### File: `/lib/ai/response-generator.js`

```javascript
import Anthropic from "@anthropic-ai/sdk";

/**
 * AI Response Generator - Generates natural language responses
 */
export class AIResponseGenerator {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Generate natural language response from pre-aggregated data
   * Uses Sonnet 4.5 for high-quality explanations
   */
  async generateResponse(context, conversationHistory = []) {
    const systemPrompt = `You are WizelReport AI, an analytics assistant for e-commerce marketers.

Your job is to:
1. Answer questions about marketing, customer, and product analytics
2. Provide clear, actionable insights from the data
3. Explain trends, comparisons, and anomalies
4. Suggest next steps or optimizations
5. Format numbers appropriately (currency, percentages, etc.)

Guidelines:
- Be concise but thorough
- Use bullet points and formatting for readability
- Highlight surprising or important findings
- Compare to account averages when relevant
- Suggest drill-down questions if appropriate
- Never mention that you're working with pre-aggregated data
- Format currency as $X,XXX.XX
- Format percentages as XX.X%
- Use emojis sparingly and only when they add clarity

Data context provided:
- Account summary statistics (30-day window)
- Query results (top N items)
- Metric definitions and meanings`;

    const userPrompt = `User question: "${context.user_question}"

**Account Summary (last 30 days):**
- Total Revenue: $${context.account_summary.total_revenue.toLocaleString()}
- Total Orders: ${context.account_summary.total_orders.toLocaleString()}
- Average Order Value: $${context.account_summary.avg_order_value.toFixed(2)}
- New Customers: ${context.account_summary.new_customers.toLocaleString()}
- Campaigns Sent: ${context.account_summary.campaigns_sent.toLocaleString()}
- Avg Email Open Rate: ${context.account_summary.avg_email_open_rate.toFixed(1)}%

**Query Type:** ${context.query_type}
**Time Range:** ${context.time_range}

**Data Summary:**
${JSON.stringify(context.data_summary, null, 2)}

**Top Results** (${context.total_results} total):
${JSON.stringify(context.top_results, null, 2)}

Please provide a clear, insightful answer to the user's question based on this data.`;

    const messages = [
      ...conversationHistory,
      { role: "user", content: userPrompt }
    ];

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: messages as any
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format from AI");
    }

    return content.text;
  }

  /**
   * Generate suggested follow-up questions
   */
  async generateSuggestedQuestions(context, previousResponse) {
    const prompt = `Based on this analytics query and response, suggest 3-5 relevant follow-up questions the user might ask.

User's original question: "${context.user_question}"

Query type: ${context.query_type}

Your previous response:
${previousResponse}

Return a JSON array of 3-5 short, specific follow-up questions. For example:
["What were my top products last month?", "How do my email open rates compare to SMS?", "Which customers are at risk of churning?"]

Return ONLY the JSON array, no other text.`;

    const response = await this.client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return [];
    }

    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return JSON.parse(jsonMatch[0]);
    } catch {
      return [];
    }
  }
}
```

---

## Complete Code Examples

### Main Chat API Route

**File**: `/app/api/ai/chat/route.js`

```javascript
import { NextResponse } from "next/server";
import { createClient } from "@clickhouse/client";
import { Redis } from "@upstash/redis";

import { IntentClassifier } from "@/lib/ai/intent-classifier.js";
import { SmartDataFetcher } from "@/lib/ai/data-fetcher.js";
import { AIContextBuilder } from "@/lib/ai/context-builder.js";
import { AIResponseGenerator } from "@/lib/ai/response-generator.js";

// Initialize services
const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  database: process.env.CLICKHOUSE_DATABASE,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const intentClassifier = new IntentClassifier(process.env.ANTHROPIC_API_KEY);
const responseGenerator = new AIResponseGenerator(process.env.ANTHROPIC_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { klaviyo_public_id, message, conversation_history = [] } = body;

    // Validate inputs
    if (!klaviyo_public_id || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`🤖 AI Chat Request: "${message}"`);

    // Step 1: Classify intent (Haiku - 200 tokens)
    console.log("📋 Step 1: Classifying intent...");
    const intent = await intentClassifier.classifyIntent(
      message,
      conversation_history
    );
    console.log("✅ Intent classified:", intent.query_type);

    // Step 2: Fetch aggregated data (no tokens - direct DB query)
    console.log("📊 Step 2: Fetching data...");
    const dataFetcher = new SmartDataFetcher(clickhouse);
    const queryResults = await dataFetcher.fetchForIntent(
      intent,
      klaviyo_public_id
    );
    console.log(`✅ Data fetched: ${queryResults.result_count} results`);

    // Step 3: Build context with caching (~2,000 tokens)
    console.log("🏗️  Step 3: Building context...");
    const contextBuilder = new AIContextBuilder(clickhouse, redis);
    const context = await contextBuilder.buildFullContext(
      klaviyo_public_id,
      message,
      queryResults
    );
    console.log("✅ Context built");

    // Step 4: Generate response (Sonnet 4.5 - 2,500 tokens total)
    console.log("💬 Step 4: Generating response...");
    const responseText = await responseGenerator.generateResponse(
      context,
      conversation_history
    );
    console.log("✅ Response generated");

    // Optional: Generate suggested follow-up questions
    const suggestedQuestions = await responseGenerator.generateSuggestedQuestions(
      context,
      responseText
    );

    return NextResponse.json({
      response: responseText,
      query_type: queryResults.query_type,
      data_summary: queryResults.summary,
      suggested_questions: suggestedQuestions,
      debug_info: process.env.NODE_ENV === "development"
        ? {
            intent,
            sql_generated: queryResults.generated_sql,
            result_count: queryResults.result_count,
          }
        : undefined,
    });
  } catch (error) {
    console.error("❌ AI Chat Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Get Available Metrics API

**File**: `/app/api/ai/metrics/route.js`

```javascript
import { NextResponse } from "next/server";
import { getMetricContextForAI } from "@/lib/ai/metrics-definitions.js";

export async function GET() {
  try {
    const context = getMetricContextForAI();
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## ClickHouse Schema Reference

### 🚨 CRITICAL Schema Notes (AI Must Read!)

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CRITICAL ENCODING RULES - AI MUST UNDERSTAND THESE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCHEMA_CRITICAL_NOTES = {
  // ⚠️ MOST IMPORTANT: Rate fields are encoded as integers
  rate_fields_encoding: {
    rule: "Rates stored as UInt16 where 2500 = 25.00%",
    affected_fields: [
      "open_rate", "click_rate", "conversion_rate", "bounce_rate",
      "delivery_rate", "click_to_open_rate", "spam_complaint_rate",
      "unsubscribe_rate", "failed_rate", "bounced_or_failed_rate"
    ],
    calculation: {
      to_display: "value / 100",
      to_filter: "multiply by 100",
      example: "open_rate > 2000 means > 20%"
    },
    query_example: `
      -- CORRECT: Get campaigns with >20% open rate
      SELECT campaign_name, open_rate / 100 as open_pct
      FROM campaign_statistics
      WHERE open_rate > 2000  -- 2000 = 20%

      -- WRONG: WHERE open_rate > 0.20  (this would match nothing!)
    `
  },

  // Campaign vs Flow distinction
  campaign_vs_flow: {
    campaigns: {
      description: "ONE-TIME broadcast sends (newsletters, promotions)",
      table: "campaign_statistics",
      use_when: "User asks about 'campaigns' specifically"
    },
    flows: {
      description: "AUTOMATED sequences (welcome series, abandoned cart, post-purchase)",
      table: "flow_statistics",
      use_when: "User asks about 'automations', 'flows', or 'triggered emails'"
    },
    both: {
      description: "When user asks about 'emails' or 'email program', include BOTH",
      combined_in: "account_metrics_daily (email_revenue = campaign_email_revenue + flow_email_revenue)"
    }
  },

  // Revenue field disambiguation
  revenue_attribution: {
    conversion_value: {
      location: "campaign_statistics.conversion_value, flow_statistics.conversion_value",
      meaning: "Direct revenue from this specific send",
      use_when: "Default - most accurate for campaign/flow performance"
    },
    campaign_revenue: {
      location: "account_metrics_daily.campaign_revenue",
      meaning: "All revenue from campaigns on this date",
      formula: "SUM of campaign_statistics.conversion_value"
    },
    flow_revenue: {
      location: "account_metrics_daily.flow_revenue",
      meaning: "All revenue from flows on this date",
      formula: "SUM of flow_statistics.conversion_value"
    },
    email_revenue: {
      location: "account_metrics_daily.email_revenue",
      meaning: "Total email revenue (campaigns + flows)",
      formula: "campaign_email_revenue + flow_email_revenue"
    },
    attributed_revenue: {
      location: "account_metrics_daily.attributed_revenue",
      meaning: "Broader attribution (may include indirect conversions)",
      use_when: "User specifically asks about 'attribution' or 'total impact'"
    }
  },

  // Channel breakdown
  send_channels: {
    values: ["email", "sms", "push-notification"],
    location: "campaign_statistics.send_channel, flow_statistics.send_channel",
    revenue_breakdown: {
      email: "campaign_email_revenue, flow_email_revenue, email_revenue",
      sms: "campaign_sms_revenue, flow_sms_revenue, sms_revenue",
      push: "campaign_push_revenue, flow_push_revenue, push_revenue"
    }
  },

  // Store/Account relationship
  account_structure: {
    klaviyo_public_id: "The account/client identifier (ALWAYS filter by this)",
    store_public_ids: "Array of store IDs (one account can have multiple stores)",
    always_filter: "WHERE klaviyo_public_id = 'xxx' (NEVER omit this filter)"
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INDUSTRY BENCHMARKS - For AI to provide context
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EMAIL_BENCHMARKS = {
  ecommerce_industry_averages: {
    open_rate: 18.0,        // 18% (stored as 1800 in DB)
    click_rate: 2.5,        // 2.5% (stored as 250 in DB)
    click_to_open_rate: 14.0, // 14%
    conversion_rate: 1.5,   // 1.5% (stored as 150 in DB)
    bounce_rate: 2.0,       // 2%
    unsubscribe_rate: 0.2,  // 0.2%
    spam_complaint_rate: 0.05 // 0.05%
  },

  performance_ratings: {
    open_rate: {
      excellent: 25.0,  // > 25%
      good: 18.0,       // 18-25%
      average: 15.0,    // 15-18%
      poor: 10.0        // < 15%
    },
    click_rate: {
      excellent: 4.0,   // > 4%
      good: 2.5,        // 2.5-4%
      average: 1.5,     // 1.5-2.5%
      poor: 1.0         // < 1.5%
    },
    conversion_rate: {
      excellent: 3.0,   // > 3%
      good: 1.5,        // 1.5-3%
      average: 0.8,     // 0.8-1.5%
      poor: 0.5         // < 0.8%
    }
  }
};
```

### Schema Tables Overview (47 Tables Total)

**Marketing Performance** (11 tables)
- campaign_statistics, campaign_daily_aggregates
- flow_statistics, flow_metadata
- form_statistics, form_metadata
- segment_statistics, segment_metadata

**Order & Transactions** (3 tables)
- klaviyo_orders, klaviyo_order_line_items
- refund_cancelled_orders

**Customer Analytics** (6 tables)
- customer_profiles, customer_first_orders_cache
- customer_ltv_predictions, repeat_customers_cache
- buyer_segments_analysis, repeat_customers_dict

**Product Performance** (12 tables)
- products_master, product_relationships_optimized
- product_affinity_matrix, product_discount_analysis
- product_repurchase_stats, product_ltv_analysis
- first_purchase_ltv_analysis, new_customer_products
- product_cohorts, product_entry_cohorts
- product_type_performance

**Aggregated Metrics** (4 tables)
- account_metrics_daily, brand_performance
- tag_performance, discount_usage_analytics
- discount_dependency

**System** (1 table)
- klaviyo_syncs

### Complete Schema with AI Context

```csv
table_name,column_name,column_type,ai_context,common_queries
account_metrics_daily,date,Date,"Daily rollup date","Daily trends, week-over-week comparison"
account_metrics_daily,klaviyo_public_id,String,"Account ID - ALWAYS filter by this","All queries"
account_metrics_daily,total_revenue,Float64,"Total revenue from all orders this day","Daily revenue, revenue trends"
account_metrics_daily,email_revenue,Float64,"Email channel revenue (campaigns + flows)","Email performance, channel breakdown"
account_metrics_daily,campaign_revenue,Float64,"Revenue from campaigns only","Campaign impact"
account_metrics_daily,flow_revenue,Float64,"Revenue from flows only","Flow/automation impact"
account_metrics_daily,attributed_revenue,Float64,"Broader attribution model","Total marketing impact"
account_metrics_daily,email_opens,Int32,"Total email opens","Engagement metrics"
account_metrics_daily,campaigns_sent,UInt32,"Number of campaigns sent","Send volume"
account_metrics_daily,new_customers,UInt32,"First-time customers acquired","Acquisition metrics"
account_metrics_daily,returning_customers,UInt32,"Repeat customers","Retention metrics"

campaign_statistics,date,Date,"Campaign send date","Campaign performance by date"
campaign_statistics,campaign_id,String,"Unique campaign identifier","Specific campaign lookup"
campaign_statistics,campaign_name,String,"Campaign display name - USE THIS for human-readable results","Top campaigns, campaign comparison"
campaign_statistics,send_channel,String,"email/sms/push-notification","Channel filtering"
campaign_statistics,recipients,UInt32,"Total recipients sent to","Reach metrics"
campaign_statistics,delivered,UInt32,"Successfully delivered","Deliverability"
campaign_statistics,opens_unique,UInt32,"Unique opens (one per person)","Engagement - use UNIQUE for rates"
campaign_statistics,clicks_unique,UInt32,"Unique clicks","Click engagement - use UNIQUE for rates"
campaign_statistics,open_rate,UInt16,"⚠️ ENCODED: 2500 = 25.00%","Campaign engagement - DIVIDE BY 100"
campaign_statistics,click_rate,UInt16,"⚠️ ENCODED: 250 = 2.50%","Click engagement - DIVIDE BY 100"
campaign_statistics,conversion_rate,UInt16,"⚠️ ENCODED: 150 = 1.50%","Conversion performance - DIVIDE BY 100"
campaign_statistics,conversion_value,Float64,"Revenue from this campaign - PRIMARY REVENUE METRIC","Campaign ROI, top performers"
campaign_statistics,bounce_rate,UInt16,"⚠️ ENCODED - deliverability issue indicator","Deliverability health"
campaign_statistics,spam_complaint_rate,UInt16,"⚠️ ENCODED - spam complaints","List health"
campaign_statistics,unsubscribe_rate,UInt16,"⚠️ ENCODED - opt-outs","List health, campaign quality"

flow_statistics,flow_name,String,"Flow/automation name","Flow performance, automation analysis"
flow_statistics,flow_message_name,String,"Specific message in flow (e.g., 'Email 2 of Welcome Series')","Message-level analysis"
flow_statistics,conversion_value,Float64,"Revenue from this flow","Flow ROI"
flow_statistics,send_channel,String,"email/sms/push","Channel breakdown"

customer_profiles,customer_email,String,"Customer identifier","Customer lookup, segmentation"
customer_profiles,total_revenue,Float64,"Lifetime value (LTV)","Top customers, LTV analysis"
customer_profiles,total_orders,UInt32,"Number of orders placed","Customer frequency"
customer_profiles,avg_order_value,Float64,"Average order value","Customer value metrics"
customer_profiles,rfm_segment,String,"Champions/Loyal/At Risk/etc - RFM segmentation","Customer segmentation queries"
customer_profiles,recency_score,UInt8,"1-5, how recently ordered","Churn risk"
customer_profiles,frequency_score,UInt8,"1-5, how often orders","Purchase frequency"
customer_profiles,monetary_score,UInt8,"1-5, how much spent","Customer value"
customer_profiles,days_since_last_order,UInt32,"Days since last purchase","Churn detection"
customer_profiles,total_refunds,UInt32,"Number of refunds","Return/refund analysis"
customer_profiles,refund_rate,Float64,"Refunds / Total orders","Problem customer identification"

products_master,product_name,String,"Product display name","Product performance, bestsellers"
products_master,total_revenue,Float64,"All-time product revenue","Product ranking"
products_master,total_orders,UInt32,"Times ordered","Product popularity"
products_master,product_categories,Array(String),"Product categories - use ARRAY JOIN","Category analysis"
products_master,product_brand,String,"Brand/vendor","Brand performance"
products_master,status,String,"active/inactive","Filter for active products"

klaviyo_orders,order_value,Float64,"Total order value","Revenue analysis"
klaviyo_orders,is_first_order,UInt8,"1 = first-time customer","New vs returning revenue"
klaviyo_orders,discount_code,String,"Applied discount code","Discount effectiveness"
klaviyo_orders,shipping_state,String,"State abbreviation","Geographic analysis"
klaviyo_orders,order_date,Date,"Order date - use for time filtering","Date range queries"

product_affinity_matrix,first_product_name,String,"Product A in 'often bought together'","Cross-sell recommendations"
product_affinity_matrix,second_product_name,String,"Product B","Bundle opportunities"
product_affinity_matrix,lift_score,Float64,">1.0 = products bought together more than random","Recommendation strength"
product_affinity_matrix,customers_bought_both,UInt32,"Number of customers who bought both","Confidence in recommendation"
```

### Common Query Patterns for Email Questions

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL-SPECIFIC QUERY PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EMAIL_QUERY_PATTERNS = {
  // Pattern 1: Account-level email health
  email_account_overview: {
    user_asks: ["How is my email program?", "Email performance summary", "Email health"],
    table: "account_metrics_daily",
    query: `
      SELECT
        SUM(email_revenue) as total_email_revenue,
        SUM(campaign_revenue) as campaign_revenue,
        SUM(flow_revenue) as flow_revenue,
        SUM(email_recipients) as total_recipients,
        SUM(campaigns_sent) as total_campaigns,
        AVG(email_opens / NULLIF(email_delivered, 0)) * 100 as avg_open_rate_pct,
        SUM(email_clicks) / NULLIF(SUM(email_delivered), 0) * 100 as avg_click_rate_pct
      FROM account_metrics_daily
      WHERE klaviyo_public_id = '{id}'
        AND date >= today() - 30
    `,
    response_should_include: [
      "Total revenue comparison (campaigns vs flows)",
      "Average open/click rates with benchmark comparison",
      "Number of sends and recipients"
    ]
  },

  // Pattern 2: Top performing campaigns
  top_campaigns: {
    user_asks: ["Best campaigns", "Top performing emails", "Which campaigns worked"],
    table: "campaign_statistics",
    query: `
      SELECT
        campaign_name,
        send_channel,
        SUM(conversion_value) as revenue,
        SUM(recipients) as total_recipients,
        AVG(open_rate) / 100 as avg_open_rate_pct,
        AVG(click_rate) / 100 as avg_click_rate_pct,
        AVG(conversion_rate) / 100 as avg_conversion_rate_pct,
        COUNT(DISTINCT date) as times_sent
      FROM campaign_statistics
      WHERE klaviyo_public_id = '{id}'
        AND date >= today() - 30
        AND send_channel = 'email'  -- or remove for all channels
      GROUP BY campaign_name, send_channel
      ORDER BY revenue DESC
      LIMIT 10
    `,
    important_notes: [
      "Remember to divide rate fields by 100!",
      "Group by campaign_name to aggregate multiple sends",
      "Include send_channel in results to distinguish email/sms"
    ]
  },

  // Pattern 3: Deliverability check
  deliverability_health: {
    user_asks: ["Deliverability issues?", "Bounce rate", "Email problems"],
    table: "campaign_statistics",
    query: `
      SELECT
        AVG(delivery_rate) / 100 as avg_delivery_rate_pct,
        AVG(bounce_rate) / 100 as avg_bounce_rate_pct,
        AVG(spam_complaint_rate) / 100 as avg_spam_rate_pct,
        AVG(unsubscribe_rate) / 100 as avg_unsub_rate_pct,
        SUM(bounced_or_failed) as total_bounces,
        SUM(spam_complaints) as total_spam_complaints,
        SUM(recipients) as total_recipients
      FROM campaign_statistics
      WHERE klaviyo_public_id = '{id}'
        AND date >= today() - 30
        AND send_channel = 'email'
    `,
    benchmark_comparison: {
      delivery_rate: "> 95% is good",
      bounce_rate: "< 2% is good",
      spam_rate: "< 0.1% is good",
      unsub_rate: "< 0.5% is acceptable"
    }
  },

  // Pattern 4: Campaign vs Flow comparison
  campaign_vs_flow_performance: {
    user_asks: ["Campaigns vs flows", "Automations vs broadcasts"],
    tables: ["campaign_statistics", "flow_statistics"],
    query: `
      -- Campaigns
      SELECT
        'Campaigns' as type,
        COUNT(DISTINCT campaign_id) as count,
        SUM(conversion_value) as revenue,
        SUM(recipients) as recipients,
        AVG(open_rate) / 100 as avg_open_rate,
        AVG(conversion_rate) / 100 as avg_conversion_rate
      FROM campaign_statistics
      WHERE klaviyo_public_id = '{id}'
        AND date >= today() - 30
        AND send_channel = 'email'

      UNION ALL

      -- Flows
      SELECT
        'Flows' as type,
        COUNT(DISTINCT flow_id) as count,
        SUM(conversion_value) as revenue,
        SUM(recipients) as recipients,
        AVG(open_rate) / 100 as avg_open_rate,
        AVG(conversion_rate) / 100 as avg_conversion_rate
      FROM flow_statistics
      WHERE klaviyo_public_id = '{id}'
        AND date >= today() - 30
        AND send_channel = 'email'
    `
  },

  // Pattern 5: Engagement trends over time
  engagement_trends: {
    user_asks: ["Engagement over time", "Open rate trend", "Email performance trend"],
    table: "campaign_daily_aggregates",
    query: `
      SELECT
        date,
        total_campaigns,
        email_open_rate as open_rate_pct,
        email_click_rate as click_rate_pct,
        email_click_to_open_rate as cto_rate_pct,
        total_conversion_value as revenue
      FROM campaign_daily_aggregates
      WHERE klaviyo_public_id = '{id}'
        AND date >= today() - 90
      ORDER BY date DESC
    `,
    note: "campaign_daily_aggregates stores rates as actual percentages (not encoded!)"
  },

  // Pattern 6: Specific campaign details
  campaign_detail: {
    user_asks: ["Tell me about [campaign name]", "How did [campaign] perform"],
    table: "campaign_statistics",
    query: `
      SELECT
        campaign_name,
        date,
        send_channel,
        recipients,
        delivered,
        opens_unique,
        clicks_unique,
        open_rate / 100 as open_rate_pct,
        click_rate / 100 as click_rate_pct,
        click_to_open_rate / 100 as cto_rate_pct,
        conversion_rate / 100 as conversion_rate_pct,
        conversions,
        conversion_value as revenue,
        average_order_value as aov
      FROM campaign_statistics
      WHERE klaviyo_public_id = '{id}'
        AND campaign_name ILIKE '%{campaign_name}%'
      ORDER BY date DESC
    `,
    note: "Use ILIKE for case-insensitive partial matching"
  }
};
```

### Email-Specific Response Guidelines

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI RESPONSE GUIDELINES FOR EMAIL QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EMAIL_RESPONSE_GUIDELINES = {
  always_include: [
    "Benchmark comparison (vs industry average)",
    "Account average comparison (this vs historical)",
    "Clear distinction between campaigns and flows when relevant",
    "Actionable insights and recommendations"
  ],

  formatting_rules: {
    percentages: "Always show as X.X% (divide encoded values by 100)",
    currency: "Show as $X,XXX.XX with thousand separators",
    large_numbers: "Use K/M for thousands/millions (15K recipients, $1.2M revenue)",
    dates: "Format as 'Last 30 days' or 'Jan 1 - Jan 31'"
  },

  interpretation_help: {
    good_open_rate: "> 18% for ecommerce",
    good_click_rate: "> 2.5% for ecommerce",
    good_conversion_rate: "> 1.5% for ecommerce",
    concerning_bounce_rate: "> 5%",
    concerning_spam_rate: "> 0.1%"
  },

  common_user_confusion: {
    "campaigns vs emails": "Clarify that 'campaigns' means one-time sends, 'emails' includes flows",
    "attributed vs conversion": "Default to conversion_value unless they specifically ask about attribution",
    "opens vs unique opens": "Always use opens_unique for rates and percentages",
    "total revenue vs email revenue": "Clarify: email_revenue is subset of total_revenue"
  },

  suggested_follow_ups: {
    after_top_campaigns: [
      "Would you like to see deliverability metrics for these campaigns?",
      "Want to compare this to last month's top campaigns?",
      "Should I show the customer segments that received these?"
    ],
    after_poor_performance: [
      "Would you like me to identify which specific campaigns had issues?",
      "Want to see if deliverability problems are affecting this?",
      "Should I check your list health metrics?"
    ],
    after_good_performance: [
      "Want to see which customer segments performed best?",
      "Should I analyze which products drove this revenue?",
      "Would you like flow performance for comparison?"
    ]
  }
};
```

---

## Token Usage & Cost Breakdown

| Stage | Model | Tokens | Cost | Latency |
|-------|-------|--------|------|---------|
| Intent Classification | Haiku | 200 | $0.0002 | 0.3s |
| Data Fetching | None (DB) | 0 | $0 | 0.5s |
| Context Building | None | 0 | $0 | 0.1s |
| Response Generation | Sonnet 4.5 | 2,500 | $0.015 | 2s |
| **Total** | | **2,700** | **$0.015** | **~3s** |

**vs. Naive Approach:**
- Sending all 47 tables with 30 days of data
- Token usage: 100,000+
- Cost: $0.60+ per query
- Would hit context limits frequently
- Slow, expensive, unreliable

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create `/lib/ai/metrics-definitions.ts` with all metrics
- [ ] Set up ClickHouse client in `/lib/clickhouse/client.ts`
- [ ] Set up Redis/Upstash for caching
- [ ] Build `IntentClassifier` service
- [ ] Build `SmartDataFetcher` with query templates

### Phase 2: Context & Caching (Week 2)
- [ ] Implement `AIContextBuilder` with 3-tier caching
- [ ] Create account summary cache warming
- [ ] Build metric definition cache
- [ ] Add cache invalidation on data updates

### Phase 3: Response Generation (Week 3)
- [ ] Build `AIResponseGenerator`
- [ ] Create system prompt with examples
- [ ] Add conversation history handling
- [ ] Implement follow-up question suggestions

### Phase 4: API & Testing (Week 4)
- [ ] Build `/app/api/ai/chat/route.ts` endpoint
- [ ] Add authentication & rate limiting
- [ ] Test with 50+ real queries
- [ ] Monitor token usage and costs
- [ ] Add debug mode for SQL inspection

### Phase 5: Frontend Integration
- [ ] Build chat UI component
- [ ] Add streaming responses (optional)
- [ ] Implement conversation history UI
- [ ] Add suggested questions UI
- [ ] Show loading states and errors

### Phase 6: Advanced Features (Ongoing)
- [ ] Anomaly detection (pre-computed)
- [ ] Trend analysis with forecasting
- [ ] Automated insights generation
- [ ] Multi-turn conversation memory
- [ ] Export to reports/dashboards

---

## Example Interactions

### Example 1: Campaign Performance

**User:** "What are my best campaigns this month?"

**System Flow:**
1. **Intent**: `campaign_performance`, `last_30_days`, top 10
2. **Query**: `SELECT campaign_name, SUM(conversion_value), AVG(open_rate) FROM campaign_statistics WHERE ...`
3. **Results**: 10 rows, 3 columns (~500 tokens)

**AI Response:**
```
Your top 10 campaigns this month by revenue:

1. **Spring Sale Email** - $15,450
   - Open rate: 24% (above your 23% average)
   - Click rate: 3.2%

2. **Welcome Series #3** - $12,300
   - Open rate: 31% (⭐ 35% above average)
   - Click rate: 4.1%

...

**Key Insights:**
- Your Welcome Series significantly outperforms promotional campaigns
- Campaigns sent on Tuesday have 18% higher open rates
- Consider A/B testing subject lines for the Spring Sale format

**Suggested next steps:**
- View flow performance to see full Welcome Series impact
- Analyze customer segments receiving these campaigns
- Check discount usage on Spring Sale purchases
```

---

### Example 2: Customer Churn

**User:** "Show me customers at risk of churning"

**System Flow:**
1. **Intent**: `churn_analysis`, `all_time`, top 50
2. **Query**: `SELECT customer_email, total_revenue, days_since_last_order FROM customer_profiles WHERE rfm_segment IN ('At Risk', 'Cannot Lose Them') ...`
3. **Results**: 50 rows, 5 columns (~800 tokens)

**AI Response:**
```
You have 47 high-value customers at risk of churning:

**Top 5 At-Risk Customers:**

1. john@example.com
   - LTV: $3,245
   - Last order: 127 days ago
   - Segment: Cannot Lose Them

2. sarah@example.com
   - LTV: $2,890
   - Last order: 94 days ago
   - Segment: At Risk

...

**Recommended Actions:**
1. **Immediate win-back campaigns** for "Cannot Lose Them" segment (12 customers, $28,450 total LTV)
2. **Discount offers** for "At Risk" segment (35 customers)
3. **Product recommendations** based on past purchases

**Would you like me to:**
- Show their favorite products for personalized outreach?
- Create a list for a Klaviyo win-back flow?
- Analyze what caused the drop-off?
```

---

## Performance Monitoring

### Metrics to Track

1. **Token Usage**
   - Average tokens per query
   - Token usage by query type
   - Cache hit rates

2. **Cost Metrics**
   - Cost per query
   - Daily/monthly total costs
   - Cost by user/account

3. **Latency Metrics**
   - Total response time
   - Time per stage (intent, fetch, generate)
   - P50, P95, P99 latencies

4. **Quality Metrics**
   - User satisfaction ratings
   - Follow-up question engagement
   - Query success rate

---

## Security & Best Practices

### Authentication
- Require valid API key or session token
- Validate `klaviyo_public_id` belongs to authenticated user
- Rate limit per user (e.g., 50 queries/hour)

### SQL Injection Prevention
- ALWAYS use parameterized queries
- Validate and sanitize all inputs
- Never interpolate user input directly into SQL

### Data Privacy
- Only return data for authenticated account
- Log queries for audit purposes
- Implement data retention policies

### Error Handling
- Graceful degradation when cache unavailable
- Fallback queries if ClickHouse slow
- User-friendly error messages

---

## Conclusion

This architecture provides:
- ✅ **Industry-standard** approach (Shopify/Google/Amplitude pattern)
- ✅ **Token-efficient** (~2,500 vs 100,000+)
- ✅ **Cost-effective** ($0.015 vs $0.60+ per query)
- ✅ **Fast** (2-3s vs 10-30s)
- ✅ **Maintainable** (semantic layer makes updates easy)
- ✅ **Scalable** (multi-tier caching)

Ready to implement? Start with Phase 1 and build incrementally!

---

**Last Updated:** 2025-01-22
**Version:** 2.0 - Next.js Implementation Guide

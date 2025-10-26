/**
 * AI Agent Tool Definitions for Wizel AI Assistant
 * These tools enable the AI to query ClickHouse, access on-screen context, and check permissions
 */

export const WIZEL_AI_TOOLS = [
  {
    name: "get_on_screen_data",
    description: "Get data currently visible on the user's screen from WIZEL_AI context. Use this when user asks about 'visible', 'on screen', or 'current' data.",
    input_schema: {
      type: "object",
      properties: {
        data_type: {
          type: "string",
          enum: ["campaigns", "metrics", "stores", "date_range", "filters", "all"],
          description: "Type of on-screen data to retrieve"
        }
      },
      required: ["data_type"]
    }
  },
  {
    name: "query_clickhouse",
    description: "Query ClickHouse for campaign statistics, analytics, and performance metrics. ALL campaign and analytics data is in ClickHouse. Use this to answer questions about historical data, trends, and comparisons.",
    input_schema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: [
            "campaign_statistics",
            "flow_statistics",
            "account_metrics_daily",
            "customer_profiles",
            "products_master",
            "klaviyo_orders",
            "segment_statistics",
            "form_statistics",
            "brand_performance",
            "product_repurchase_stats"
          ],
          description: "ClickHouse table to query"
        },
        store_public_ids: {
          type: "array",
          items: { type: "string" },
          description: "User's store public IDs (will be converted to klaviyo_public_ids automatically)"
        },
        filters: {
          type: "object",
          description: "Query filters",
          properties: {
            date_start: { type: "string", format: "date" },
            date_end: { type: "string", format: "date" },
            campaign_channel: {
              type: "string",
              enum: ["email", "sms", "push"]
            },
            min_recipients: { type: "number" },
            min_open_rate: { type: "number" },
            min_revenue: { type: "number" }
          }
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metrics to return (e.g., ['recipients', 'open_rate', 'conversion_value'])"
        },
        aggregation: {
          type: "string",
          enum: ["none", "sum", "avg", "max", "min", "count"],
          description: "How to aggregate results"
        },
        limit: {
          type: "number",
          description: "Max rows to return (default 50)"
        },
        order_by: {
          type: "string",
          description: "Column to sort by (DESC)"
        }
      },
      required: ["table", "store_public_ids"]
    }
  },
  {
    name: "get_user_accessible_stores",
    description: "Get list of stores the current user has access to based on their permissions. Always call this first before querying data to ensure you only access authorized stores.",
    input_schema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "analyze_performance",
    description: "Trigger deep performance analysis using specialized Klaviyo analysis prompts. Use this when the user asks for performance reviews, updates, summaries, comparisons, or wants to understand how their campaigns/flows/stores are doing. This tool provides store-specific, campaign-specific insights with actionable recommendations.",
    input_schema: {
      type: "object",
      properties: {
        time_range: {
          type: "string",
          enum: ["yesterday", "today", "past_7_days", "past_14_days", "past_30_days", "past_90_days", "custom"],
          description: "Time period to analyze. Use past_7_days for recent performance, past_30_days or past_90_days for strategic analysis."
        },
        custom_days: {
          type: "number",
          description: "Number of days to analyze if time_range is 'custom'. Optional."
        },
        focus_area: {
          type: "string",
          enum: ["all", "campaigns", "flows", "stores_comparison", "revenue", "engagement"],
          description: "What aspect to focus the analysis on. Use 'all' for comprehensive review."
        },
        user_question: {
          type: "string",
          description: "The user's original question to help contextualize the analysis"
        }
      },
      required: ["time_range", "user_question"]
    }
  }
];

/**
 * ClickHouse Schema Definitions
 *
 * Complete schema for all ClickHouse tables used in AI marketing analysis
 * Based on click_house_Schema.csv
 */

export const CLICKHOUSE_TABLES = {
  // Account-level daily metrics
  ACCOUNT_METRICS_DAILY: 'account_metrics_daily',

  // Campaign analytics
  CAMPAIGN_STATISTICS: 'campaign_statistics',
  CAMPAIGN_DAILY_AGGREGATES: 'campaign_daily_aggregates',

  // Flow analytics
  FLOW_STATISTICS: 'flow_statistics',
  FLOW_METADATA: 'flow_metadata',

  // Customer analytics
  CUSTOMER_PROFILES: 'customer_profiles',
  BUYER_SEGMENTS_ANALYSIS: 'buyer_segments_analysis',
  CUSTOMER_FIRST_ORDERS_CACHE: 'customer_first_orders_cache',
  CUSTOMER_LTV_PREDICTIONS: 'customer_ltv_predictions',

  // Product analytics
  PRODUCTS_MASTER: 'products_master',
  FIRST_PURCHASE_LTV_ANALYSIS: 'first_purchase_ltv_analysis',
  PRODUCT_AFFINITY_MATRIX: 'product_affinity_matrix',
  PRODUCT_DISCOUNT_ANALYSIS: 'product_discount_analysis',
  NEW_CUSTOMER_PRODUCTS: 'new_customer_products',

  // Segment analytics
  SEGMENT_STATISTICS: 'segment_statistics',
  SEGMENT_METADATA: 'segment_metadata',

  // Form analytics
  FORM_STATISTICS: 'form_statistics',
  FORM_METADATA: 'form_metadata',

  // Orders
  KLAVIYO_ORDERS: 'klaviyo_orders',
  KLAVIYO_ORDER_LINE_ITEMS: 'klaviyo_order_line_items',

  // Discount analytics
  DISCOUNT_USAGE_ANALYTICS: 'discount_usage_analytics',
  DISCOUNT_DEPENDENCY: 'discount_dependency',

  // Brand performance
  BRAND_PERFORMANCE: 'brand_performance',
  TAG_PERFORMANCE: 'tag_performance',
};

/**
 * Table schema definitions with column types
 */
export const TABLE_SCHEMAS = {
  [CLICKHOUSE_TABLES.ACCOUNT_METRICS_DAILY]: {
    table: 'account_metrics_daily',
    description: 'Daily aggregated account metrics across all channels',
    columns: {
      date: { type: 'Date', description: 'Metric date' },
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      store_public_ids: { type: 'Array(String)', description: 'Associated store IDs' },
      total_orders: { type: 'UInt32', description: 'Total orders' },
      total_revenue: { type: 'Float64', description: 'Total revenue' },
      avg_order_value: { type: 'Float64', description: 'Average order value' },
      unique_customers: { type: 'UInt32', description: 'Unique customers' },
      new_customers: { type: 'UInt32', description: 'New customers' },
      returning_customers: { type: 'UInt32', description: 'Returning customers' },
      campaigns_sent: { type: 'UInt32', description: 'Campaigns sent' },
      campaign_recipients: { type: 'UInt32', description: 'Campaign recipients' },
      campaign_revenue: { type: 'Float64', description: 'Campaign revenue' },
      flow_revenue: { type: 'Float64', description: 'Flow revenue' },
      email_revenue: { type: 'Float64', description: 'Email revenue' },
      sms_revenue: { type: 'Float64', description: 'SMS revenue' },
      email_recipients: { type: 'UInt32', description: 'Email recipients' },
      sms_recipients: { type: 'UInt32', description: 'SMS recipients' },
      email_opens: { type: 'Int32', description: 'Email opens' },
      email_clicks: { type: 'UInt32', description: 'Email clicks' },
      sms_clicks: { type: 'UInt32', description: 'SMS clicks' },
    },
    requiredFilters: ['klaviyo_public_id'],
    dateColumn: 'date',
  },

  [CLICKHOUSE_TABLES.CAMPAIGN_STATISTICS]: {
    table: 'campaign_statistics',
    description: 'Campaign performance statistics by date and campaign',
    columns: {
      date: { type: 'Date', description: 'Campaign date' },
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      campaign_id: { type: 'String', description: 'Campaign ID' },
      campaign_name: { type: 'String', description: 'Campaign name' },
      campaign_message_id: { type: 'String', description: 'Campaign message ID' },
      send_channel: { type: 'String', description: 'Send channel (email, sms, push)' },
      store_public_ids: { type: 'Array(String)', description: 'Associated store IDs' },
      recipients: { type: 'UInt32', description: 'Recipients' },
      delivered: { type: 'UInt32', description: 'Delivered' },
      opens: { type: 'UInt32', description: 'Opens (total)' },
      opens_unique: { type: 'UInt32', description: 'Unique opens' },
      clicks: { type: 'UInt32', description: 'Clicks (total)' },
      clicks_unique: { type: 'UInt32', description: 'Unique clicks' },
      conversions: { type: 'UInt32', description: 'Conversions' },
      conversion_value: { type: 'Float64', description: 'Conversion value' },
      average_order_value: { type: 'Float64', description: 'Average order value' },
      revenue_per_recipient: { type: 'Float64', description: 'Revenue per recipient' },
      delivery_rate: { type: 'UInt16', description: 'Delivery rate (0-10000 = 0-100%)' },
      open_rate: { type: 'UInt16', description: 'Open rate (0-10000 = 0-100%)' },
      click_rate: { type: 'UInt16', description: 'Click rate (0-10000 = 0-100%)' },
      click_to_open_rate: { type: 'UInt16', description: 'CTOR (0-10000 = 0-100%)' },
      conversion_rate: { type: 'UInt16', description: 'Conversion rate (0-10000 = 0-100%)' },
      bounce_rate: { type: 'UInt16', description: 'Bounce rate (0-10000 = 0-100%)' },
      unsubscribe_rate: { type: 'UInt16', description: 'Unsubscribe rate (0-10000 = 0-100%)' },
      spam_complaint_rate: { type: 'UInt16', description: 'Spam rate (0-10000 = 0-100%)' },
      bounced: { type: 'UInt32', description: 'Bounced' },
      unsubscribes: { type: 'UInt32', description: 'Unsubscribes' },
      spam_complaints: { type: 'UInt32', description: 'Spam complaints' },
      tag_names: { type: 'Array(String)', description: 'Campaign tags' },
    },
    requiredFilters: ['klaviyo_public_id'],
    dateColumn: 'date',
    rateColumns: ['delivery_rate', 'open_rate', 'click_rate', 'click_to_open_rate', 'conversion_rate', 'bounce_rate', 'unsubscribe_rate', 'spam_complaint_rate'],
  },

  [CLICKHOUSE_TABLES.FLOW_STATISTICS]: {
    table: 'flow_statistics',
    description: 'Flow (automation) performance statistics',
    columns: {
      date: { type: 'Date', description: 'Flow date' },
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      flow_id: { type: 'String', description: 'Flow ID' },
      flow_name: { type: 'String', description: 'Flow name' },
      flow_message_id: { type: 'String', description: 'Flow message ID' },
      flow_message_name: { type: 'String', description: 'Flow message name' },
      send_channel: { type: 'String', description: 'Send channel (email, sms, push)' },
      store_public_ids: { type: 'Array(String)', description: 'Associated store IDs' },
      recipients: { type: 'UInt32', description: 'Recipients' },
      delivered: { type: 'UInt32', description: 'Delivered' },
      opens_unique: { type: 'UInt32', description: 'Unique opens' },
      clicks_unique: { type: 'UInt32', description: 'Unique clicks' },
      conversions: { type: 'UInt32', description: 'Conversions' },
      conversion_value: { type: 'Float64', description: 'Conversion value' },
      average_order_value: { type: 'Float64', description: 'Average order value' },
      revenue_per_recipient: { type: 'Float64', description: 'Revenue per recipient' },
      open_rate: { type: 'Float64', description: 'Open rate (decimal)' },
      click_rate: { type: 'Float64', description: 'Click rate (decimal)' },
      conversion_rate: { type: 'Float64', description: 'Conversion rate (decimal)' },
      tag_names: { type: 'Array(String)', description: 'Flow tags' },
    },
    requiredFilters: ['klaviyo_public_id'],
    dateColumn: 'date',
  },

  [CLICKHOUSE_TABLES.CUSTOMER_PROFILES]: {
    table: 'customer_profiles',
    description: 'Customer profiles with RFM segmentation',
    columns: {
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      customer_email: { type: 'String', description: 'Customer email' },
      total_orders: { type: 'UInt32', description: 'Total orders' },
      total_revenue: { type: 'Float64', description: 'Total revenue' },
      avg_order_value: { type: 'Float64', description: 'Average order value' },
      first_order_date: { type: 'Date', description: 'First order date' },
      last_order_date: { type: 'Date', description: 'Last order date' },
      days_since_last_order: { type: 'UInt32', description: 'Days since last order' },
      orders_last_30_days: { type: 'UInt32', description: 'Orders in last 30 days' },
      revenue_last_30_days: { type: 'Float64', description: 'Revenue in last 30 days' },
      recency_score: { type: 'UInt8', description: 'Recency score (1-5)' },
      frequency_score: { type: 'UInt8', description: 'Frequency score (1-5)' },
      monetary_score: { type: 'UInt8', description: 'Monetary score (1-5)' },
      rfm_segment: { type: 'String', description: 'RFM segment' },
      favorite_product: { type: 'String', description: 'Favorite product' },
      favorite_category: { type: 'String', description: 'Favorite category' },
      favorite_brand: { type: 'String', description: 'Favorite brand' },
    },
    requiredFilters: ['klaviyo_public_id'],
  },

  [CLICKHOUSE_TABLES.BUYER_SEGMENTS_ANALYSIS]: {
    table: 'buyer_segments_analysis',
    description: 'Buyer segments analysis (1x, 2x, 3x+ buyers)',
    columns: {
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      buyer_segment: { type: 'String', description: 'Buyer segment (1x, 2x, 3x+)' },
      customer_count: { type: 'UInt32', description: 'Customer count' },
      total_revenue: { type: 'Float64', description: 'Total revenue' },
      avg_order_value: { type: 'Float64', description: 'Average order value' },
      avg_ltv: { type: 'Float64', description: 'Average LTV' },
      pct_of_customers: { type: 'Float64', description: 'Percentage of customers' },
      pct_of_revenue: { type: 'Float64', description: 'Percentage of revenue' },
      avg_days_between_orders: { type: 'Float64', description: 'Average days between orders' },
    },
    requiredFilters: ['klaviyo_public_id'],
  },

  [CLICKHOUSE_TABLES.PRODUCTS_MASTER]: {
    table: 'products_master',
    description: 'Product catalog with performance metrics',
    columns: {
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      product_id: { type: 'String', description: 'Product ID' },
      product_name: { type: 'String', description: 'Product name' },
      sku: { type: 'String', description: 'SKU' },
      product_brand: { type: 'String', description: 'Product brand' },
      product_categories: { type: 'Array(String)', description: 'Product categories' },
      store_public_ids: { type: 'Array(String)', description: 'Associated store IDs' },
      total_revenue: { type: 'Float64', description: 'Total revenue' },
      total_orders: { type: 'UInt32', description: 'Total orders' },
      unique_customers: { type: 'UInt32', description: 'Unique customers' },
      avg_price: { type: 'Float64', description: 'Average price' },
      first_sold_date: { type: 'Date', description: 'First sold date' },
      last_sold_date: { type: 'Date', description: 'Last sold date' },
    },
    requiredFilters: ['klaviyo_public_id'],
  },

  [CLICKHOUSE_TABLES.FIRST_PURCHASE_LTV_ANALYSIS]: {
    table: 'first_purchase_ltv_analysis',
    description: 'LTV analysis by first purchase product',
    columns: {
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      first_product_id: { type: 'String', description: 'First product ID' },
      first_product_name: { type: 'String', description: 'First product name' },
      first_product_category: { type: 'String', description: 'First product category' },
      first_product_brand: { type: 'String', description: 'First product brand' },
      cohort_month: { type: 'Date', description: 'Cohort month' },
      customers_acquired: { type: 'UInt32', description: 'Customers acquired' },
      avg_first_order_value: { type: 'Float64', description: 'Average first order value' },
      avg_ltv_30d: { type: 'Float64', description: 'Average LTV at 30 days' },
      avg_ltv_90d: { type: 'Float64', description: 'Average LTV at 90 days' },
      avg_ltv_365d: { type: 'Float64', description: 'Average LTV at 365 days' },
      avg_ltv_lifetime: { type: 'Float64', description: 'Average lifetime LTV' },
      repeat_purchase_rate_30d: { type: 'Float64', description: 'Repeat purchase rate at 30 days' },
      repeat_purchase_rate_90d: { type: 'Float64', description: 'Repeat purchase rate at 90 days' },
      avg_days_to_second_order: { type: 'Float64', description: 'Average days to second order' },
    },
    requiredFilters: ['klaviyo_public_id'],
  },

  [CLICKHOUSE_TABLES.SEGMENT_STATISTICS]: {
    table: 'segment_statistics',
    description: 'Segment statistics and performance',
    columns: {
      date: { type: 'Date', description: 'Date' },
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      segment_id: { type: 'String', description: 'Segment ID' },
      segment_name: { type: 'String', description: 'Segment name' },
      store_public_ids: { type: 'Array(String)', description: 'Associated store IDs' },
      members_count: { type: 'UInt32', description: 'Member count' },
      new_members: { type: 'UInt32', description: 'New members' },
      removed_members: { type: 'UInt32', description: 'Removed members' },
      conversion_value: { type: 'Float64', description: 'Conversion value' },
    },
    requiredFilters: ['klaviyo_public_id'],
    dateColumn: 'date',
  },

  [CLICKHOUSE_TABLES.KLAVIYO_ORDERS]: {
    table: 'klaviyo_orders',
    description: 'Order transactions',
    columns: {
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      store_public_ids: { type: 'Array(String)', description: 'Associated store IDs' },
      order_id: { type: 'String', description: 'Order ID' },
      customer_email: { type: 'String', description: 'Customer email' },
      order_value: { type: 'Float64', description: 'Order value' },
      order_date: { type: 'Date', description: 'Order date' },
      order_timestamp: { type: 'DateTime64(3)', description: 'Order timestamp' },
      is_first_order: { type: 'UInt8', description: 'Is first order (1=yes, 0=no)' },
      discount_code: { type: 'String', description: 'Discount code' },
      discount_amount: { type: 'Float64', description: 'Discount amount' },
    },
    requiredFilters: ['klaviyo_public_id'],
    dateColumn: 'order_date',
  },

  [CLICKHOUSE_TABLES.DISCOUNT_USAGE_ANALYTICS]: {
    table: 'discount_usage_analytics',
    description: 'Discount usage and effectiveness analysis',
    columns: {
      klaviyo_public_id: { type: 'String', description: 'Klaviyo account ID' },
      analysis_date: { type: 'Date', description: 'Analysis date' },
      total_orders: { type: 'UInt32', description: 'Total orders' },
      orders_with_discount: { type: 'UInt32', description: 'Orders with discount' },
      discount_usage_rate: { type: 'Float64', description: 'Discount usage rate' },
      avg_discount_percentage: { type: 'Float64', description: 'Average discount percentage' },
      first_order_discount_rate: { type: 'Float64', description: 'First order discount rate' },
      avg_ltv_with_first_discount: { type: 'Float64', description: 'Average LTV with first discount' },
      avg_ltv_without_first_discount: { type: 'Float64', description: 'Average LTV without first discount' },
    },
    requiredFilters: ['klaviyo_public_id'],
    dateColumn: 'analysis_date',
  },
};

/**
 * Common query patterns for each table
 */
export const COMMON_QUERIES = {
  CAMPAIGN_PERFORMANCE: {
    description: 'Top campaigns by revenue',
    table: CLICKHOUSE_TABLES.CAMPAIGN_STATISTICS,
    template: `
      SELECT
        campaign_name,
        send_channel,
        SUM(conversion_value) as total_revenue,
        SUM(recipients) as total_recipients,
        SUM(conversions) as total_conversions,
        AVG(open_rate) / 100.0 as avg_open_rate,
        AVG(click_rate) / 100.0 as avg_click_rate
      FROM {table}
      WHERE klaviyo_public_id IN ({klaviyo_ids})
        AND date >= {start_date}
        AND date <= {end_date}
      GROUP BY campaign_name, send_channel
      ORDER BY total_revenue DESC
      LIMIT {limit}
    `,
  },

  DAILY_METRICS: {
    description: 'Daily account metrics',
    table: CLICKHOUSE_TABLES.ACCOUNT_METRICS_DAILY,
    template: `
      SELECT
        date,
        total_revenue,
        total_orders,
        avg_order_value,
        unique_customers,
        new_customers,
        returning_customers
      FROM {table}
      WHERE klaviyo_public_id IN ({klaviyo_ids})
        AND date >= {start_date}
        AND date <= {end_date}
      ORDER BY date ASC
    `,
  },

  BUYER_SEGMENTS: {
    description: 'Buyer segment analysis',
    table: CLICKHOUSE_TABLES.BUYER_SEGMENTS_ANALYSIS,
    template: `
      SELECT
        buyer_segment,
        customer_count,
        total_revenue,
        avg_order_value,
        avg_ltv,
        pct_of_customers,
        pct_of_revenue,
        avg_days_between_orders
      FROM {table}
      WHERE klaviyo_public_id IN ({klaviyo_ids})
      ORDER BY total_revenue DESC
    `,
  },

  PRODUCT_PERFORMANCE: {
    description: 'Top performing products',
    table: CLICKHOUSE_TABLES.PRODUCTS_MASTER,
    template: `
      SELECT
        product_name,
        product_brand,
        total_revenue,
        total_orders,
        unique_customers,
        avg_price
      FROM {table}
      WHERE klaviyo_public_id IN ({klaviyo_ids})
      ORDER BY total_revenue DESC
      LIMIT {limit}
    `,
  },

  FIRST_PURCHASE_LTV: {
    description: 'LTV by first purchase product',
    table: CLICKHOUSE_TABLES.FIRST_PURCHASE_LTV_ANALYSIS,
    template: `
      SELECT
        first_product_name,
        first_product_category,
        customers_acquired,
        avg_first_order_value,
        avg_ltv_30d,
        avg_ltv_90d,
        avg_ltv_365d,
        repeat_purchase_rate_30d,
        avg_days_to_second_order
      FROM {table}
      WHERE klaviyo_public_id IN ({klaviyo_ids})
      ORDER BY avg_ltv_365d DESC
      LIMIT {limit}
    `,
  },
};

/**
 * Get table schema
 */
export function getTableSchema(tableName) {
  return TABLE_SCHEMAS[tableName] || null;
}

/**
 * Get all available tables
 */
export function getAllTables() {
  return Object.keys(TABLE_SCHEMAS);
}

/**
 * Check if table requires permission filtering
 */
export function requiresPermissionFilter(tableName) {
  const schema = TABLE_SCHEMAS[tableName];
  return schema?.requiredFilters?.includes('klaviyo_public_id') || false;
}

/**
 * Get rate columns for a table (need division by 100)
 */
export function getRateColumns(tableName) {
  const schema = TABLE_SCHEMAS[tableName];
  return schema?.rateColumns || [];
}

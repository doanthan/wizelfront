# Data Model Documentation - Complete ClickHouse Architecture

## Overview
The system uses a hybrid architecture with MongoDB for metadata/configuration and ClickHouse for analytics. **ALL 12 ClickHouse tables are ReplacingMergeTree (RMT)** as of 2025-09-18.

**Critical**: Always use `FINAL` modifier in queries for correct deduplication.

---

## ClickHouse Tables (12 RMT Tables)

### 1. campaign_statistics
**Engine**: ReplacingMergeTree(updated_at)
**Purpose**: Email/SMS campaign performance metrics
**Update Frequency**: Every 15 minutes via cron_sync
**Primary Key**: `(klaviyo_public_id, campaign_id, date)`

```sql
CREATE TABLE campaign_statistics (
    -- Identifiers
    klaviyo_public_id String,
    campaign_id String,
    campaign_name String,
    send_channel String,  -- 'email', 'sms', 'push'
    date Date,

    -- Delivery Metrics
    recipients Float64,
    delivered Float64,
    bounced Float64,
    failed Float64,

    -- Engagement Metrics
    opens Float64,
    opens_unique Float64,
    clicks Float64,
    clicks_unique Float64,

    -- Conversion Metrics
    conversions Float64,
    conversion_uniques Float64,
    conversion_value Float64,

    -- List Health Metrics
    unsubscribes Float64,

    -- Rate Metrics (stored as percentages)
    open_rate_pct Float64,
    click_rate_pct Float64,
    conversion_rate_pct Float64,
    unsubscribe_rate_pct Float64,
    bounce_rate_pct Float64,
    delivery_rate_pct Float64,

    -- Version column for RMT
    updated_at DateTime
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (klaviyo_public_id, campaign_id, date)
```

### 2. flow_statistics
**Engine**: ReplacingMergeTree(updated_at)
**Purpose**: Automated flow/drip campaign performance
**Update Frequency**: Every 15 minutes via cron_sync
**Primary Key**: `(klaviyo_public_id, flow_id, flow_message_id, date)`

```sql
CREATE TABLE flow_statistics (
    -- Identifiers
    klaviyo_public_id String,
    flow_id String,
    flow_name String,
    flow_message_id String,
    flow_message_name String,
    send_channel String,
    date Date,

    -- Delivery Metrics
    recipients Float64,
    delivered Float64,
    bounced Float64,
    failed Float64,

    -- Engagement Metrics
    opens Float64,
    opens_unique Float64,
    clicks Float64,
    clicks_unique Float64,

    -- Conversion Metrics
    conversions Float64,
    conversion_uniques Float64,
    conversion_value Float64,

    -- List Health Metrics
    unsubscribes Float64,

    -- Rate Metrics (stored as percentages)
    open_rate_pct Float64,
    click_rate_pct Float64,
    conversion_rate_pct Float64,
    unsubscribe_rate_pct Float64,
    bounce_rate_pct Float64,
    delivery_rate_pct Float64,

    -- Version column for RMT
    updated_at DateTime
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (klaviyo_public_id, flow_id, flow_message_id, date)
```

### 3. form_statistics
**Engine**: ReplacingMergeTree(updated_at)
**Purpose**: Form submission and conversion tracking
**Update Frequency**: Every 15 minutes via cron_sync
**Primary Key**: `(klaviyo_public_id, form_id, date)`

```sql
CREATE TABLE form_statistics (
    -- Identifiers
    klaviyo_public_id String,
    form_id String,
    form_name String,
    date Date,

    -- Engagement Metrics
    viewed_form Float64,
    viewed_form_uniques Float64,
    submits Float64,
    submits_unique Float64,  -- Note: API field is submits_unique, not submits_uniques
    qualified_form Float64,
    qualified_form_uniques Float64,

    -- Version column for RMT
    updated_at DateTime
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (klaviyo_public_id, form_id, date)
```

### 4. segment_statistics
**Engine**: ReplacingMergeTree(updated_at)
**Purpose**: Customer segment size and growth tracking
**Update Frequency**: Every 15 minutes via cron_sync
**Primary Key**: `(klaviyo_public_id, segment_id, date)`

```sql
CREATE TABLE segment_statistics (
    -- Identifiers
    klaviyo_public_id String,
    segment_id String,
    segment_name String,
    date Date,

    -- Membership Metrics
    total_members Int64,
    new_members Int64,
    removed_members Int64,
    daily_change Int64,

    -- Version column for RMT
    updated_at DateTime
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (klaviyo_public_id, segment_id, date)
```

### 5. klaviyo_orders
**Engine**: ReplacingMergeTree(inserted_at)
**Purpose**: Order transaction data from Placed Order events
**Update Frequency**: Every 15 minutes via cron_sync
**Primary Key**: `(klaviyo_public_id, order_id)`

```sql
CREATE TABLE klaviyo_orders (
    -- Identifiers
    klaviyo_public_id String,
    order_id String,
    customer_id String,
    customer_email String,

    -- Order Details
    order_value Decimal(10, 2),
    order_date Date,
    order_timestamp DateTime64(3),
    item_count UInt32,
    product_count UInt32,

    -- Customer Context
    is_first_order UInt8,
    order_count_for_customer UInt32,
    days_since_last_order Int32,

    -- Channel & Location
    channel String DEFAULT 'web',
    device_type String,
    shipping_city String,
    shipping_state String,
    shipping_country String,
    shipping_zip String,

    -- Discounts
    discount_amount Decimal(10, 2),
    discount_code String,
    discount_type String,

    -- Customer Attributes at Order Time
    customer_tags Array(String),
    customer_total_spent Decimal(10, 2),
    customer_order_count UInt32,

    -- UTM Tracking
    utm_source String,
    utm_medium String,
    utm_campaign String,

    -- Metadata
    synced_at DateTime,
    inserted_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(inserted_at)
ORDER BY (klaviyo_public_id, order_id)
```

### 6. klaviyo_order_line_items
**Engine**: ReplacingMergeTree(inserted_at)
**Purpose**: Order line item details
**Update Frequency**: Every 15 minutes via cron_sync
**Primary Key**: `(klaviyo_public_id, order_id, line_item_id)`

```sql
CREATE TABLE klaviyo_order_line_items (
    -- Identifiers
    klaviyo_public_id String,
    order_id String,
    line_item_id String,
    product_id String,
    variant_id String,

    -- Product Info
    product_name String,
    product_brand String,
    sku String,
    collections Array(String),
    product_type String,

    -- Quantities & Pricing
    quantity UInt32,
    unit_price Decimal(10, 2),
    line_total Decimal(10, 2),

    -- Discounts
    discount_amount Decimal(10, 2),
    discount_per_item Decimal(10, 2),

    -- Metadata
    synced_at DateTime,
    inserted_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(inserted_at)
ORDER BY (klaviyo_public_id, order_id, line_item_id)
```

### 7. refund_cancelled_orders
**Engine**: ReplacingMergeTree(inserted_at)
**Purpose**: Refund and cancellation event tracking
**Update Frequency**: Every 15 minutes via cron_sync
**Primary Key**: `(klaviyo_public_id, event_id, customer_id)`

```sql
CREATE TABLE refund_cancelled_orders (
    -- Identifiers
    klaviyo_public_id String,
    event_id String,
    event_timestamp DateTime64(3),
    event_type String,  -- 'refund' or 'cancelled'

    -- Original Order Reference
    original_order_id String,
    original_order_timestamp DateTime64(3),

    -- Customer Information
    customer_id String,
    customer_email String,

    -- Refund/Cancellation Details
    refund_amount Decimal(10, 2),
    refund_reason String,
    refund_currency String DEFAULT 'USD',

    -- Line Item Details (if partial refund)
    line_items_affected Array(String),
    products_affected Array(String),
    quantities_refunded Array(UInt32),

    -- Klaviyo Event Metadata
    metric_id String,
    metric_name String,
    profile_id String,

    -- Additional Properties
    event_properties String,  -- JSON string
    profile_properties String, -- JSON string

    -- Store Identification
    store_public_ids Array(String),

    -- Sync Metadata
    synced_at DateTime,
    inserted_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(inserted_at)
ORDER BY (klaviyo_public_id, event_id, customer_id)
```

### 8. customer_profiles
**Engine**: ReplacingMergeTree(last_updated)
**Purpose**: Customer LTV and RFM analysis
**Update Frequency**: Every hour via cron_aggregates
**Primary Key**: `(klaviyo_public_id, customer_email)`

```sql
CREATE TABLE customer_profiles (
    -- Identifiers
    klaviyo_public_id String,
    customer_email String,
    customer_id String,

    -- Order Metrics
    total_orders UInt32,
    total_revenue Decimal(10, 2),
    total_refunds Decimal(10, 2),
    net_revenue Decimal(10, 2),  -- revenue - refunds
    avg_order_value Decimal(10, 2),

    -- Time Metrics
    first_order_date Date,
    last_order_date Date,
    days_since_last_order UInt32,
    avg_days_between_orders Float32,

    -- RFM Scoring
    recency_score UInt8,      -- 1-5 (5 = most recent)
    frequency_score UInt8,     -- 1-5 (5 = most frequent)
    monetary_score UInt8,      -- 1-5 (5 = highest value)
    rfm_score String,         -- Combined "555" format
    rfm_segment String,       -- Champions, Loyal, At Risk, etc.

    -- Product Preferences
    favorite_category String,
    favorite_brand String,
    categories_purchased Array(String),
    brands_purchased Array(String),
    unique_products_purchased UInt32,

    -- Behavior Metrics
    discount_usage_rate Float32,
    avg_discount_amount Decimal(10, 2),
    weekend_buyer UInt8,
    preferred_order_hour UInt8,

    -- Retention
    churn_risk_score Float32,
    customer_age_days UInt32,

    -- Version column
    last_updated DateTime
) ENGINE = ReplacingMergeTree(last_updated)
ORDER BY (klaviyo_public_id, customer_email)
```

### 9. products_master
**Engine**: ReplacingMergeTree(last_updated)
**Purpose**: Product catalog with performance metrics
**Update Frequency**: Every hour via cron_aggregates
**Primary Key**: `(klaviyo_public_id, product_id)`

```sql
CREATE TABLE products_master (
    -- Identifiers
    klaviyo_public_id String,
    product_id String,
    product_name String,

    -- Product Details
    sku String,
    brand String,
    category String,
    collections Array(String),
    tags Array(String),

    -- Pricing
    avg_price Decimal(10, 2),
    min_price Decimal(10, 2),
    max_price Decimal(10, 2),

    -- Sales Metrics (30/60/90 day windows)
    revenue_30d Decimal(10, 2),
    revenue_60d Decimal(10, 2),
    revenue_90d Decimal(10, 2),
    quantity_sold_30d UInt32,
    quantity_sold_60d UInt32,
    quantity_sold_90d UInt32,
    unique_customers_30d UInt32,
    unique_customers_60d UInt32,
    unique_customers_90d UInt32,

    -- Performance Metrics
    conversion_rate Float32,
    repurchase_rate Float32,
    avg_units_per_order Float32,
    revenue_per_customer Decimal(10, 2),

    -- Temporal Metrics
    first_sold_date Date,
    last_sold_date Date,
    days_on_market UInt32,
    velocity_score Float32,

    -- Rankings
    revenue_rank UInt32,
    quantity_rank UInt32,

    -- Discounts
    discount_rate Float32,
    avg_discount_amount Decimal(10, 2),

    -- Version column
    last_updated DateTime
) ENGINE = ReplacingMergeTree(last_updated)
ORDER BY (klaviyo_public_id, product_id)
```

### 10. product_relationships_optimized
**Engine**: ReplacingMergeTree(calculated_at)
**Purpose**: Market basket analysis and product affinities
**Update Frequency**: Every 4 hours via cron_aggregates
**Primary Key**: `(klaviyo_public_id, product_a, product_b)`

```sql
CREATE TABLE product_relationships_optimized (
    -- Identifiers
    klaviyo_public_id String,
    product_a String,
    product_b String,

    -- Product Names
    product_a_name String,
    product_b_name String,

    -- Relationship Metrics
    co_purchase_count UInt32,
    confidence Float32,        -- P(B|A) - probability of B given A
    lift Float32,              -- How much more likely together
    support Float32,           -- P(A and B)

    -- Temporal
    first_co_purchase Date,
    last_co_purchase Date,

    -- Relationship Type
    relationship_type String,  -- 'frequently_bought', 'substitute', 'complement'

    -- Version column
    calculated_at DateTime
) ENGINE = ReplacingMergeTree(calculated_at)
ORDER BY (klaviyo_public_id, product_a, product_b)
```

### 11. campaign_daily_aggregates
**Engine**: ReplacingMergeTree(processed_at)
**Purpose**: Pre-computed daily campaign performance
**Update Frequency**: Every 15 minutes via cron_aggregates
**Primary Key**: `(klaviyo_public_id, date, send_channel)`

```sql
CREATE TABLE campaign_daily_aggregates (
    -- Dimensions
    klaviyo_public_id String,
    date Date,
    send_channel String,  -- 'email', 'sms', 'push'

    -- Campaign Metrics
    total_campaigns UInt32,
    campaigns_sent Array(String),

    -- Volume Metrics
    total_recipients UInt64,
    total_delivered UInt64,
    total_opens UInt64,
    total_clicks UInt64,
    total_conversions UInt64,

    -- Revenue Metrics
    total_revenue Decimal(10, 2),
    avg_revenue_per_campaign Decimal(10, 2),
    avg_revenue_per_recipient Decimal(10, 2),

    -- Performance Metrics
    avg_open_rate Float32,
    avg_click_rate Float32,
    avg_conversion_rate Float32,

    -- Best/Worst Performers
    best_campaign_id String,
    best_campaign_name String,
    best_campaign_revenue Decimal(10, 2),
    worst_campaign_id String,
    worst_campaign_name String,
    worst_campaign_revenue Decimal(10, 2),

    -- Tag Analysis
    top_tags Array(String),
    tag_performance Map(String, Float64),  -- tag -> revenue

    -- Version column
    processed_at DateTime
) ENGINE = ReplacingMergeTree(processed_at)
ORDER BY (klaviyo_public_id, date, send_channel)
```

### 12. account_metrics_daily
**Engine**: ReplacingMergeTree(timestamp)
**Purpose**: Account-level daily performance rollup
**Update Frequency**: Every 15 minutes via cron_aggregates
**Primary Key**: `(klaviyo_public_id, date)`

```sql
CREATE TABLE account_metrics_daily (
    -- Dimensions
    klaviyo_public_id String,
    date Date,

    -- Revenue Metrics
    total_revenue Decimal(10, 2),
    email_revenue Decimal(10, 2),
    sms_revenue Decimal(10, 2),
    flow_revenue Decimal(10, 2),
    campaign_revenue Decimal(10, 2),

    -- Order Metrics
    total_orders UInt32,
    email_orders UInt32,
    sms_orders UInt32,
    avg_order_value Decimal(10, 2),

    -- Customer Metrics
    unique_customers UInt32,
    new_customers UInt32,
    repeat_customers UInt32,
    new_customer_revenue Decimal(10, 2),
    repeat_customer_revenue Decimal(10, 2),

    -- Engagement Metrics
    total_emails_sent UInt64,
    total_sms_sent UInt64,
    total_opens UInt64,
    total_clicks UInt64,

    -- Efficiency Metrics
    revenue_per_email Decimal(10, 2),
    revenue_per_sms Decimal(10, 2),
    revenue_per_recipient Decimal(10, 2),

    -- Growth Metrics (vs previous period)
    revenue_growth_pct Float32,
    order_growth_pct Float32,
    customer_growth_pct Float32,

    -- Version column
    timestamp DateTime
) ENGINE = ReplacingMergeTree(timestamp)
ORDER BY (klaviyo_public_id, date)
```

---

## MongoDB Collections

### 1. stores Collection
Primary store configuration and integration settings.

```javascript
{
  _id: ObjectId("..."),
  name: "Store Name",
  public_id: "store_abc123",

  // Klaviyo Integration (Critical)
  klaviyo_integration: {
    status: "active",
    public_id: "XqkVGb",  // Klaviyo account ID

    // OAuth Authentication
    oauth_token: "access_token_...",
    refresh_token: "refresh_token_...",
    token_expires_at: ISODate("2025-02-01T00:00:00Z"),

    // Sync Tracking
    is_updating_dashboard: false,
    campaign_values_last_update: ISODate("2025-09-18T10:00:00Z"),
    segment_values_last_update: ISODate("2025-09-18T11:00:00Z"),
    flow_values_last_update: ISODate("2025-09-18T12:00:00Z"),
    form_values_last_update: ISODate("2025-09-18T13:00:00Z"),
    placed_order_last_update: ISODate("2025-09-18T14:00:00Z")
  }
}
```

### 2. klaviyo_syncs Collection
Sync status tracking for incremental updates.

```javascript
{
  _id: ObjectId("..."),
  klaviyo_public_id: "XqkVGb",
  sync_type: "cron_sync",

  // Timestamp tracking for each data type
  campaigns_last_sync: ISODate("2025-09-18T15:00:00Z"),
  flows_last_sync: ISODate("2025-09-18T15:05:00Z"),
  forms_last_sync: ISODate("2025-09-18T15:10:00Z"),
  segments_last_sync: ISODate("2025-09-18T15:15:00Z"),
  events_last_sync: ISODate("2025-09-18T15:20:00Z"),
  aggregates_last_sync: ISODate("2025-09-18T15:25:00Z"),

  // Aggregation specific timestamps
  campaign_aggregates_last_run: ISODate("2025-09-18T15:00:00Z"),
  customer_profiles_last_run: ISODate("2025-09-18T14:00:00Z"),
  product_analytics_last_run: ISODate("2025-09-18T14:00:00Z"),
  product_relationships_last_run: ISODate("2025-09-18T12:00:00Z"),

  updated_at: ISODate("2025-09-18T15:25:00Z")
}
```

### 3. campaignstats Collection
Campaign performance metrics (legacy, being phased out).

```javascript
{
  _id: ObjectId("..."),
  klaviyo_public_id: "XqkVGb",
  store_public_ids: ["store_abc123"],

  groupings: {
    send_channel: "email",
    campaign_id: "01HJKL...",
    campaign_message_id: "01HJKM..."
  },

  // Metadata
  campaign_name: "Holiday Sale 2024",
  subject: "50% Off Everything!",
  tag_names: ["holiday", "sale"],

  // Performance statistics
  statistics: {
    recipients: 10000,
    delivered: 9800,
    opens_unique: 3000,
    clicks_unique: 1000,
    conversions: 150,
    conversion_value: 15000.00
  },

  updated_at: ISODate("2025-09-18T15:00:00Z")
}
```

---

## Data Flow Architecture

### 1. Data Collection Pipeline (cron_sync)
```
Every 15 minutes:
Klaviyo API → Transform → ClickHouse RMT Tables
                      ↘ MongoDB (campaignstats only)
```

### 2. Aggregation Pipeline (cron_aggregates)
```
Every 15 min:  Campaign/Account daily aggregates
Every hour:    Customer profiles, Product analytics
Every 4 hours: Product relationships (market basket)
```

### 3. Query Pattern with RMT
```sql
-- ALWAYS use FINAL for deduplication
SELECT * FROM table_name FINAL WHERE conditions;

-- Aggregations with FINAL
SELECT sum(metric) FROM table_name FINAL GROUP BY dimension;

-- Joins require FINAL on both tables
FROM table1 FINAL t1
JOIN table2 FINAL t2 ON t1.id = t2.id;
```

---

## Key Relationships

### Primary Keys
- **MongoDB**: `_id` (ObjectId) and `public_id`/`klaviyo_public_id`
- **ClickHouse**: Composite keys using `klaviyo_public_id` + entity IDs

### Foreign Key Relationships
```
stores.klaviyo_integration.public_id → *.klaviyo_public_id
klaviyo_orders.order_id → klaviyo_order_line_items.order_id
klaviyo_orders.customer_email → customer_profiles.customer_email
products_master.product_id → product_relationships_optimized.product_a/b
campaign_statistics.campaign_id → campaign_daily_aggregates.campaigns_sent[]
```

---

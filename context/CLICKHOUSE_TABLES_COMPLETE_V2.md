# ClickHouse Tables Complete Reference - 100% ReplacingMergeTree Architecture

**Last Updated**: 2025-09-22
**Database**: `default` @ kis8xv8y1f.us-east-1.aws.clickhouse.cloud
**API Endpoint**: `/api/v2/reports/full_sync`
**Total Tables**: 12 production tables (**ALL ReplacingMergeTree**)
**Query Performance**: <100ms for aggregated data, <500ms for raw queries
**Critical**: **ALWAYS use `FINAL` modifier in ALL queries**

## 🆕 Recent Updates (September 2025)

### Channel Revenue Tracking (Added to `account_metrics_daily`)
- ✅ **Email revenue breakdown**: `email_revenue`, `campaign_email_revenue`, `flow_email_revenue`
- ✅ **SMS revenue breakdown**: `sms_revenue`, `campaign_sms_revenue`, `flow_sms_revenue`
- ✅ **Push revenue breakdown**: `push_revenue`, `campaign_push_revenue`, `flow_push_revenue`
- ✅ **Channel performance metrics**: Recipients, delivered, clicks per channel

### Product Categorization (Added to `klaviyo_order_line_items`)
- ✅ **Product categories**: `product_categories` Array(String) - Supports multiple categories per product
- ✅ **Product brand**: `product_brand` String - Brand tracking for analysis

### Critical Fix: Column Order in INSERT Statements
- ⚠️ **Always use explicit column names** in INSERT statements to prevent data corruption
- ⚠️ **Without explicit columns**, values can end up in wrong columns (e.g., email revenue as SMS)

## 🚀 Migration Complete (2025-09-18)
**ALL TABLES ARE NOW ReplacingMergeTree (RMT)**

As confirmed in ClickHouse Cloud console, every table in the system now uses ReplacingMergeTree:
- ✅ All 12 tables successfully migrated to RMT
- **Migration Scripts**:
  - `/scripts/migrate_tables_to_replacingmergetree.py` (initial 6 tables)
  - `/scripts/migrate_segment_statistics_to_rmt.py` (segment_statistics)
- **Key Change**: Always use `FINAL` modifier in queries for correct deduplication
- **Backup Tables**: May exist with `_backup_YYYYMMDD_HHMMSS` suffix (can be dropped after verification)

## 🎯 **CRITICAL**: Updated Table Architecture (2025-09-18)

**CONFIRMED: ALL 12 TABLES NOW USE ReplacingMergeTree:**

| Table | Engine | Version Column | Purpose |
|-------|--------|----------------|----------|
| `account_metrics_daily` | RMT | `updated_at` | Daily account-level aggregations |
| `campaign_daily_aggregates` | RMT | `updated_at` | Pre-computed campaign metrics |
| `campaign_statistics` | RMT | `updated_at` | 15-min campaign performance updates |
| `customer_profiles` | RMT | Various | Customer LTV and RFM analysis |
| `flow_statistics` | RMT | `updated_at` | 15-min flow performance updates |
| `form_statistics` | RMT | `updated_at` | 15-min form performance updates |
| `klaviyo_order_line_items` | RMT | `inserted_at` | Order line item details |
| `klaviyo_orders` | RMT | `inserted_at` | Order transactions |
| `product_relationships_optimized` | RMT | Various | Product affinity analysis |
| `products_master` | RMT | Various | Product catalog and metrics |
| `refund_cancelled_orders` | RMT | `inserted_at` | Refund and cancellation events |
| `segment_statistics` | RMT | `updated_at` | 15-min segment membership updates |

**Key Concept**: Always use `FINAL` modifier when querying ANY table to ensure proper deduplication.

## 📋 Complete Table List (As of 2025-09-18)

✅ **ALL 12 TABLES ARE ReplacingMergeTree:**

### 🔴 Golden Rule: ALWAYS Use FINAL
```sql
-- ❌ WRONG - Returns duplicates
SELECT * FROM any_table WHERE condition;

-- ✅ CORRECT - Returns deduplicated data
SELECT * FROM any_table FINAL WHERE condition;
```

1. `account_metrics_daily` - RMT
2. `campaign_daily_aggregates` - RMT
3. `campaign_statistics` - RMT
4. `customer_profiles` - RMT
5. `flow_statistics` - RMT
6. `form_statistics` - RMT
7. `klaviyo_order_line_items` - RMT
8. `klaviyo_orders` - RMT
9. `product_relationships_optimized` - RMT
10. `products_master` - RMT
11. `refund_cancelled_orders` - RMT
12. `segment_statistics` - RMT

## 📋 Table of Contents
1. [🏗️ Table Engine Strategy](#-table-engine-strategy)
2. [🛒 Transaction Tables](#-transaction-tables) - Orders, Line Items, Refunds
3. [📧 Marketing Performance Tables](#-marketing-performance-tables) - Campaigns, Flows, Forms, Segments
4. [📊 Analytics Tables](#-analytics-tables) - Customer Profiles, Products, Relationships
5. [📈 Aggregation Tables](#-aggregation-tables) - Daily Metrics, Real-time Data
6. [🚀 Next.js Integration Examples](#-nextjs-integration-examples)
7. [⚡ Performance & Query Patterns](#-performance--query-patterns)

---

## 🏗️ Table Engine Strategy

### Quick RMT Query Patterns
```sql
-- Simple SELECT
SELECT * FROM table_name FINAL WHERE ...;

-- Aggregations
SELECT sum(column) FROM table_name FINAL GROUP BY ...;

-- JOINs (FINAL on both)
FROM table1 FINAL t1 JOIN table2 FINAL t2 ON ...;

-- INSERT with version
INSERT INTO table (..., version_col) VALUES (..., now());

-- CTEs with FINAL
WITH cte AS (SELECT * FROM table FINAL WHERE ...)
SELECT * FROM cte;
```

### Engine Types & Usage Patterns

| Category | Tables | Version Column | Query Method |
|----------|--------|----------------|---------------|
| **Marketing Stats** (4) | campaign, flow, form, segment | `updated_at` | `FINAL` |
| **Order Data** (3) | orders, line_items, refunds | `inserted_at` | `FINAL` |
| **Aggregations** (3) | account_metrics, campaign_daily, customer_profiles | Various | `FINAL` |
| **Product Analytics** (2) | products_master, product_relationships | Various | `FINAL` |
| **Total: 12 RMT Tables** | All tables | Per table | Always `FINAL` |

### 🎯 New Simplified Architecture Benefits

With the addition of `campaign_daily_aggregates`:
1. **10x Faster Queries**: Pre-aggregated data eliminates complex nested queries
2. **No ERROR 184**: Avoids illegal nested aggregation errors
3. **Simpler Code**: Direct JOINs instead of CTEs with argMax
4. **More Metrics**: Channel breakdowns, best performers, tag analysis
5. **Cost Savings**: Less ClickHouse compute per dashboard load

### ⏺ Critical: Universal ReplacingMergeTree Query Patterns

The following tables use **ReplacingMergeTree** and receive new rows every 15 minutes:
- `campaign_statistics` (version: `updated_at`)
- `flow_statistics` (version: `updated_at`)
- `form_statistics` (version: `updated_at`)
- `segment_statistics` (version: `updated_at`) ✅ Migrated 2025-09-18

#### ✅ Correct Query Patterns:

**For Campaign Statistics (using FINAL for deduplication):**
```sql
-- CORRECT: Get latest values per campaign using FINAL
SELECT
    date,
    campaign_id,
    campaign_name,
    recipients,
    delivered,
    opens,
    clicks,
    conversion_value as revenue
FROM campaign_statistics FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String};

-- For daily aggregation (simplified with FINAL):
SELECT
    date,
    count(distinct campaign_id) as total_campaigns,
    sum(recipients) as total_recipients,
    sum(conversion_value) as total_revenue
FROM campaign_statistics FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String}
GROUP BY date;
```

**For Flow Statistics (using FINAL for deduplication):**
```sql
-- CORRECT: Get latest values per flow message using FINAL
SELECT
    date,
    flow_id,
    flow_name,
    flow_message_id,
    flow_message_name,
    recipients,
    delivered,
    opens_unique as opens,
    clicks_unique as clicks,
    conversion_value as revenue
FROM flow_statistics FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String};

-- For daily flow aggregation (simplified with FINAL):
SELECT
    date,
    flow_id,
    flow_name,
    count(distinct flow_message_id) as active_messages,
    sum(recipients) as total_recipients,
    sum(conversion_value) as total_revenue
FROM flow_statistics FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String}
GROUP BY date, flow_id, flow_name;
```

**For Form Statistics (using FINAL for deduplication):**
```sql
-- CORRECT: Get latest values per form using FINAL
SELECT
    date,
    form_id,
    form_name,
    submits,
    submits_unique as unique_submits,
    conversion_value as revenue
FROM form_statistics FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String};
```

**For Segment Statistics (using FINAL for deduplication):**
```sql
-- CORRECT: Get latest values per segment using FINAL
SELECT
    date,
    segment_id,
    segment_name,
    members_count as member_count,
    conversion_value as revenue
FROM segment_statistics FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String};
```

#### ❌ Common Mistakes to Avoid:
```sql
-- WRONG: Without FINAL, may get duplicate records
SELECT recipients FROM campaign_statistics;

-- CORRECT: Use FINAL to get deduplicated latest version
SELECT recipients FROM campaign_statistics FINAL;

-- For aggregations, always use FINAL:
SELECT sum(recipients) FROM campaign_statistics FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String}
GROUP BY date;

-- Or use pre-aggregated tables:
SELECT total_campaigns, email_recipients + sms_recipients as total_recipients
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {klaviyo_public_id:String} AND date = today();
```

#### Impact on Aggregations:
When these tables feed into `campaign_daily_aggregates` and `account_metrics_daily`:
1. **First**: Query with `FINAL` to get deduplicated records
2. **Then**: Aggregate the deduplicated values
3. **Result**: Accurate metrics with ReplacingMergeTree's automatic deduplication

### Why This Architecture?

```sql
-- Marketing Stats: Multiple updates per day, automatic deduplication
SELECT
    flow_id,
    recipients as current_recipients,
    conversion_value as current_revenue
FROM flow_statistics FINAL  -- FINAL ensures latest version
WHERE date = today();

-- Account Metrics: One record per day, RMT handles deduplication
SELECT total_revenue, total_orders
FROM account_metrics_daily FINAL  -- FINAL gets deduplicated version
WHERE date = today();
```

---

## 🛒 Transaction Tables

### 1. `klaviyo_orders`
**Engine**: ReplacingMergeTree (version: `inserted_at`)
**Purpose**: Core transactional data for all order analytics
**Update Frequency**: Every 30 minutes (incremental) or on-demand (full)
**Row Count**: ~2,000+ orders
**Primary Key**: `(klaviyo_public_id, order_id)`

#### Key Fields for Frontend:
```javascript
// KlaviyoOrder object structure
{
  klaviyo_public_id: '',     // Store identifier
  order_id: '',              // Unique order ID
  customer_email: '',        // Customer identifier
  order_value: 0,            // Total order amount
  order_timestamp: new Date(), // When order was placed
  is_first_order: 1,         // New customer flag (0 or 1)
  discount_amount: 0,        // Discount applied
  channel: ''                // Sales channel
}
```

#### Common Queries:
```sql
-- Daily Revenue for Line Chart
SELECT
  toDate(order_timestamp) as date,
  SUM(order_value) as revenue,
  COUNT(*) as orders,
  COUNT(DISTINCT customer_email) as customers
FROM klaviyo_orders
WHERE klaviyo_public_id = {storeId:String}
  AND order_timestamp >= {startDate:DateTime}
  AND order_timestamp <= {endDate:DateTime}
GROUP BY date
ORDER BY date ASC;

-- New vs Returning Customer Split
SELECT
  IF(is_first_order = 1, 'New', 'Returning') as customer_type,
  COUNT(*) as order_count,
  SUM(order_value) as revenue,
  AVG(order_value) as avg_order_value
FROM klaviyo_orders
WHERE klaviyo_public_id = {storeId:String}
  AND toDate(order_timestamp) >= today() - 30
GROUP BY customer_type;
```

### 2. `klaviyo_order_line_items`
**Engine**: ReplacingMergeTree (version: `inserted_at`)
**Purpose**: Product-level order details with category and brand tracking
**Update Frequency**: Synced with orders
**Row Count**: ~6,500+ line items
**Primary Key**: `(klaviyo_public_id, order_id, product_id)`

#### Key Fields for Frontend (UPDATED):
```javascript
// OrderLineItem object structure
{
  klaviyo_public_id: '',     // Store identifier
  order_id: '',              // Parent order ID
  product_id: '',            // Product SKU/ID
  product_name: '',          // Product display name
  quantity: 0,               // Units ordered
  unit_price: 0,             // Price per unit
  line_total: 0,             // quantity * unit_price
  discount_amount: 0,        // Line item discount

  // 🚨 NEW: Category and Brand Fields (added 2025-09)
  product_categories: [],    // Array of category strings (e.g., ['Electronics', 'Phones'])
  product_brand: '',         // Brand name (e.g., 'Apple', 'Samsung')

  order_timestamp: new Date(), // When order was placed
  inserted_at: new Date()     // Version timestamp for RMT
}
```

#### Common Queries:
```sql
-- Top Selling Products with Brand
SELECT
  product_name,
  product_brand,
  SUM(quantity) as units_sold,
  SUM(line_total) as revenue,
  COUNT(DISTINCT order_id) as order_count,
  AVG(unit_price) as avg_price
FROM klaviyo_order_line_items FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND inserted_at >= today() - 30
GROUP BY product_name, product_brand
ORDER BY revenue DESC
LIMIT 10;

-- Category Performance Analysis
SELECT
  arrayJoin(product_categories) as category,
  COUNT(DISTINCT order_id) as orders,
  SUM(quantity) as units_sold,
  SUM(line_total) as revenue,
  AVG(unit_price) as avg_price
FROM klaviyo_order_line_items FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND inserted_at >= today() - 30
  AND length(product_categories) > 0
GROUP BY category
ORDER BY revenue DESC;

-- Brand Performance Comparison
SELECT
  product_brand,
  COUNT(DISTINCT product_id) as unique_products,
  COUNT(DISTINCT order_id) as order_count,
  SUM(quantity) as units_sold,
  SUM(line_total) as revenue,
  AVG(line_total / quantity) as avg_selling_price
FROM klaviyo_order_line_items FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND inserted_at >= today() - 90
  AND product_brand != ''
GROUP BY product_brand
ORDER BY revenue DESC
LIMIT 20;
```

### 3. `refund_cancelled_orders`
**Engine**: ReplacingMergeTree (version: `inserted_at`)
**Purpose**: Track refunds and cancellations
**Update Frequency**: With events sync
**Row Count**: Variable based on refund rate
**Primary Key**: `(klaviyo_public_id, event_id)`

#### Common Queries:
```sql
-- Refund Rate Analysis
WITH order_totals AS (
  SELECT
    COUNT(*) as total_orders,
    SUM(order_value) as total_revenue
  FROM klaviyo_orders
  WHERE klaviyo_public_id = {storeId:String}
    AND order_timestamp >= today() - 30
),
refund_totals AS (
  SELECT
    COUNT(DISTINCT original_order_id) as refunded_orders,
    SUM(refund_amount) as total_refunded
  FROM refund_cancelled_orders
  WHERE klaviyo_public_id = {storeId:String}
    AND event_timestamp >= today() - 30
)
SELECT
  o.total_orders,
  o.total_revenue,
  r.refunded_orders,
  r.total_refunded,
  r.refunded_orders * 100.0 / o.total_orders as refund_rate,
  r.total_refunded * 100.0 / o.total_revenue as refund_value_rate
FROM order_totals o, refund_totals r;
```

---

## 📧 Marketing Performance Tables

> **⚠️ IMPORTANT**: ALL tables in the system now use **ReplacingMergeTree** engines. Marketing stats receive **new rows every 15 minutes**. ALWAYS use the `FINAL` modifier in ALL queries to ensure correct deduplication.

### 4. `campaign_statistics`
**Engine**: ReplacingMergeTree (version: `updated_at`, 15-minute updates)
**Purpose**: Email/SMS campaign performance metrics
**Update Frequency**: Every 15 minutes (new records)
**Row Count**: Variable based on campaign frequency
**Primary Key**: `(klaviyo_public_id, campaign_id, date)`
**Deduplication**: Use `argMax(column, updated_at)` in queries

#### Key Fields for Frontend:
```javascript
// CampaignStats object structure
{
  campaign_id: '',           // Campaign identifier
  campaign_name: '',         // Campaign name
  date: new Date(),          // Metric date
  recipients: 0,             // Total sent
  opens_unique: 0,           // Unique opens
  clicks_unique: 0,          // Unique clicks
  conversions: 0,            // Purchases attributed
  conversion_value: 0,       // Revenue attributed
  open_rate_pct: 0,          // opens/recipients * 100
  click_rate_pct: 0,         // clicks/recipients * 100
  conversion_rate_pct: 0,    // conversions/recipients * 100
  updated_at: new Date()     // Last update timestamp
}
```

#### Dashboard Queries:
```sql
-- Get Latest Campaign Performance (automatic deduplication with FINAL)
SELECT
  campaign_id,
  campaign_name,
  send_channel as channel,
  recipients,
  delivered,
  opens_unique as unique_opens,
  clicks_unique as unique_clicks,
  conversions,
  conversion_value as revenue,
  unsubscribes,
  date as sent_date,
  updated_at as last_updated
FROM campaign_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
ORDER BY sent_date DESC, revenue DESC;

-- Campaign Performance by Channel
SELECT
  send_channel as channel,
  count(DISTINCT campaign_id) as campaign_count,
  sum(recipients) as total_recipients,
  sum(delivered) as total_delivered,
  sum(conversions) as total_conversions,
  sum(conversion_value) as total_revenue,
  avg(open_rate_pct) as avg_open_rate,
  avg(click_rate_pct) as avg_click_rate
FROM campaign_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
GROUP BY channel;

-- Today's Campaign Performance (Real-time)
SELECT
  campaign_id,
  campaign_name,
  recipients,
  conversion_value as revenue,
  conversions,
  updated_at as last_updated
FROM campaign_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date = today()
ORDER BY revenue DESC;
```

### 5. `flow_statistics`
**Engine**: ReplacingMergeTree (version: `updated_at`, 15-minute updates)
**Purpose**: Automated flow/drip campaign performance
**Update Frequency**: Every 15 minutes (new records)
**Row Count**: ~2,000+ flow message stats
**Primary Key**: `(klaviyo_public_id, flow_id, flow_message_id, date)`
**Deduplication**: Use `argMax(column, updated_at)` in queries

#### Key Fields for Frontend:
```javascript
// FlowStats object structure
{
  flow_id: '',               // Flow identifier
  flow_name: '',             // Flow display name
  flow_message_id: '',       // Message step in flow
  flow_message_name: '',     // Message display name
  date: new Date(),          // Metric date
  recipients: 0,             // Messages sent
  opens_unique: 0,           // Unique opens
  clicks_unique: 0,          // Unique clicks
  conversions: 0,            // Purchases
  conversion_value: 0,       // Revenue
  updated_at: new Date()     // Last update timestamp
}
```

#### Dashboard Queries:
```sql
-- Get Today's Flow Performance (Real-time Dashboard)
SELECT
  flow_id,
  flow_name,
  recipients,
  delivered,
  opens_unique as unique_opens,
  clicks_unique as unique_clicks,
  conversions,
  conversion_value as revenue,
  -- Calculate rates from latest values
  open_rate_pct / 100.0 as open_rate,
  click_rate_pct / 100.0 as click_rate,
  conversion_rate_pct / 100.0 as conversion_rate,
  updated_at as last_updated
FROM flow_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date = today()
ORDER BY revenue DESC;

-- Flow Performance Over Time (7/30/90 days)
WITH daily_stats AS (
    SELECT
        date,
        flow_id,
        any(flow_name) as flow_name,
        argMax(recipients, updated_at) as recipients,
        argMax(delivered, updated_at) as delivered,
        argMax(opens_unique, updated_at) as opens,
        argMax(clicks_unique, updated_at) as clicks,
        argMax(conversions, updated_at) as conversions,
        argMax(conversion_value, updated_at) as revenue
    FROM flow_statistics
    WHERE klaviyo_public_id = {storeId:String}
      AND date >= today() - {days:UInt32}
      AND date <= today()
    GROUP BY date, flow_id
)
SELECT
    flow_id,
    flow_name,
    sum(recipients) as total_recipients,
    sum(delivered) as total_delivered,
    sum(opens) as total_opens,
    sum(clicks) as total_clicks,
    sum(conversions) as total_conversions,
    sum(revenue) as total_revenue,
    -- Calculate aggregate rates
    if(sum(delivered) > 0, sum(opens) / sum(delivered), 0) as open_rate,
    if(sum(delivered) > 0, sum(clicks) / sum(delivered), 0) as click_rate,
    if(sum(delivered) > 0, sum(conversions) / sum(delivered), 0) as conversion_rate,
    if(sum(conversions) > 0, sum(revenue) / sum(conversions), 0) as avg_order_value
FROM daily_stats
GROUP BY flow_id, flow_name
ORDER BY total_revenue DESC;

-- Daily Flow Trend (for Charts)
SELECT
    date,
    sum(recipients) as daily_recipients,
    sum(conversions) as daily_conversions,
    sum(conversion_value) as daily_revenue
FROM flow_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
  AND date <= today()
GROUP BY date
ORDER BY date ASC;

-- Top Performing Flow Messages
SELECT
    flow_id,
    flow_message_id,
    any(flow_name) as flow_name,
    any(flow_message_name) as message_name,
    argMax(recipients, updated_at) as recipients,
    argMax(conversion_value, updated_at) as revenue,
    argMax(conversions, updated_at) as conversions,
    if(argMax(recipients, updated_at) > 0,
       argMax(conversion_value, updated_at) / argMax(recipients, updated_at), 0) as revenue_per_recipient
FROM flow_statistics
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 7
GROUP BY flow_id, flow_message_id
ORDER BY revenue DESC
LIMIT 10;
```

### 6. `form_statistics`
**Engine**: MergeTree (immutable, 15-minute updates)
**Purpose**: Form/popup conversion tracking
**Update Frequency**: Every 15 minutes (new records)
**Row Count**: ~300+ form performance records
**Primary Key**: `(klaviyo_public_id, form_id, date)`
**Deduplication**: Use `argMax(column, updated_at)` in queries

#### Key Fields for Frontend:
```javascript
// FormStats object structure
{
  form_id: '',              // Form identifier
  form_name: '',            // Form display name
  date: new Date(),         // Metric date
  viewed_form: 0,           // Form impressions
  submits: 0,               // Form submissions
  submit_rate: 0,           // Conversion rate
  updated_at: new Date()    // Last update timestamp
}
```

#### Dashboard Queries (with argMax):
```sql
-- Get Active Form Performance
SELECT
    form_id,
    any(form_name) as form_name,
    argMax(viewed_form, updated_at) as total_views,
    argMax(viewed_form_uniques, updated_at) as unique_views,
    argMax(submits, updated_at) as total_submits,
    argMax(submit_rate, updated_at) as submit_rate,
    max(updated_at) as last_updated
FROM form_statistics
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 7
GROUP BY form_id
ORDER BY total_submits DESC;

-- Form Conversion Funnel
SELECT
    form_id,
    any(form_name) as form_name,
    argMax(viewed_form_uniques, updated_at) as viewed,
    argMax(qualified_form_uniques, updated_at) as qualified,
    argMax(submitted_form_step_uniques, updated_at) as submitted,
    -- Calculate funnel rates
    if(argMax(viewed_form_uniques, updated_at) > 0,
       argMax(qualified_form_uniques, updated_at) / argMax(viewed_form_uniques, updated_at), 0) as qualification_rate,
    if(argMax(qualified_form_uniques, updated_at) > 0,
       argMax(submitted_form_step_uniques, updated_at) / argMax(qualified_form_uniques, updated_at), 0) as submission_rate
FROM form_statistics
WHERE klaviyo_public_id = {storeId:String}
  AND date = today()
GROUP BY form_id;
```

### 7. `segment_statistics`
**Engine**: ReplacingMergeTree (version: `updated_at`, 15-minute updates)
**Purpose**: Customer segment size and growth tracking
**Update Frequency**: Every 15 minutes (new records)
**Row Count**: ~13,000+ segment snapshots
**Primary Key**: `(klaviyo_public_id, segment_id, date)`
**Deduplication**: Use `FINAL` modifier in queries

#### Key Fields for Frontend:
```javascript
// SegmentStats object structure
{
  segment_id: '',           // Segment identifier
  segment_name: '',         // Segment display name
  date: new Date(),         // Snapshot date
  total_members: 0,         // Current segment size
  new_members: 0,           // Daily additions
  removed_members: 0,       // Daily removals
  daily_change: 0,          // Net change
  updated_at: new Date()    // Last update timestamp
}
```

#### Dashboard Queries:
```sql
-- Get Current Segment Sizes (automatic deduplication with FINAL)
SELECT
    segment_id,
    segment_name,
    total_members as current_members,
    new_members as new_today,
    removed_members as removed_today,
    daily_change as net_change,
    updated_at as last_updated
FROM segment_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date = today()
ORDER BY current_members DESC;

-- Segment Growth Trend
SELECT
    date,
    segment_id,
    segment_name,
    total_members as members,
    daily_change
FROM segment_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
  AND segment_id IN {segment_ids:Array(String)}
ORDER BY date ASC, segment_id;
```

---

## 📊 Analytics Tables

### 8. `customer_profiles`
**Engine**: ReplacingMergeTree (use FINAL in queries)
**Purpose**: Customer lifetime value and RFM segmentation
**Update Frequency**: On aggregation run
**Row Count**: ~1,600+ unique customers
**Primary Key**: `(klaviyo_public_id, customer_email)`

#### Key Fields for Frontend:
```javascript
// CustomerProfile object structure
{
  customer_email: '',              // Customer identifier
  total_orders: 0,                 // Lifetime order count
  total_revenue: 0,                // Lifetime value
  avg_order_value: 0,              // Average order size
  first_order_date: new Date(),    // Acquisition date
  last_order_date: new Date(),     // Last purchase
  days_since_last_order: 0,        // Recency in days

  // RFM Scoring
  recency_score: 5,                // 1-5 (5 = most recent)
  frequency_score: 5,              // 1-5 (5 = most frequent)
  monetary_score: 5,               // 1-5 (5 = highest value)
  rfm_segment: '',                 // "Champions", "At Risk", etc.

  // Product behavior
  unique_products_purchased: 0,
  favorite_product: '',
  favorite_category: '',

  // Time-based metrics
  orders_last_30_days: 0,
  revenue_last_30_days: 0,

  // Refund tracking (simplified - amounts removed)
  total_refunds: 0,                // Count of refunds
  total_refund_amount: 0,          // Total refunded amount
  net_revenue: 0,                  // revenue - refunds (key metric!)
  net_orders: 0,                   // orders - cancelled orders
  refund_rate: 0,                  // refunds/orders percentage
  refunds_last_30_days: 0,         // Recent refund count
  refunds_last_60_days: 0,         // 60-day refund count
  refunds_last_90_days: 0          // 90-day refund count
}
```

#### Dashboard Queries (with FINAL):
```sql
-- RFM Segment Distribution
SELECT
  rfm_segment,
  COUNT(*) as customer_count,
  AVG(total_revenue) as avg_ltv,
  AVG(total_orders) as avg_orders,
  AVG(days_since_last_order) as avg_recency,
  SUM(total_revenue) as total_segment_value
FROM customer_profiles FINAL
WHERE klaviyo_public_id = {storeId:String}
GROUP BY rfm_segment
ORDER BY total_segment_value DESC;

-- At-Risk High-Value Customers
SELECT
  customer_email,
  rfm_segment,
  total_revenue,
  days_since_last_order,
  last_order_date,
  total_orders
FROM customer_profiles FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND rfm_segment IN ('At Risk', 'Can''t Lose Them', 'About to Sleep')
  AND total_revenue > 500
ORDER BY total_revenue DESC
LIMIT 50;
```

### 9. `campaign_daily_aggregates` ✨ NEW
**Engine**: ReplacingMergeTree (use FINAL in queries)
**Purpose**: Pre-aggregated campaign metrics by day for fast dashboard queries
**Update Frequency**: After each campaign sync
**Row Count**: One row per day with campaign activity
**Primary Key**: `(klaviyo_public_id, date)`

#### Key Fields for Frontend:
```javascript
// CampaignDailyAggregate object structure
{
  date: new Date(),
  klaviyo_public_id: '',

  // Campaign counts
  total_campaigns: 0,               // Total campaigns sent
  email_campaigns: 0,               // Email campaign count
  sms_campaigns: 0,                 // SMS campaign count

  // Email metrics
  email_recipients: 0,              // Total email recipients
  email_delivered: 0,               // Emails delivered
  email_bounced: 0,                 // Emails bounced
  email_opens: 0,                   // Total opens
  email_opens_unique: 0,            // Unique opens
  email_clicks: 0,                  // Total clicks
  email_clicks_unique: 0,           // Unique clicks
  email_unsubscribes: 0,            // Unsubscriptions

  // Email rates (0-1 scale)
  email_delivery_rate: 0,           // delivered/recipients
  email_open_rate: 0,               // opens_unique/delivered
  email_click_rate: 0,              // clicks_unique/delivered
  email_click_to_open_rate: 0,      // clicks_unique/opens_unique

  // SMS metrics
  sms_recipients: 0,                // Total SMS recipients
  sms_delivered: 0,                 // SMS delivered
  sms_clicks: 0,                    // SMS link clicks
  sms_clicks_unique: 0,             // Unique SMS clicks

  // SMS rates
  sms_delivery_rate: 0,             // delivered/recipients
  sms_click_rate: 0,                // clicks_unique/delivered

  // Conversion metrics
  total_conversions: 0,             // Total conversions
  total_conversion_value: 0,        // Revenue from campaigns
  avg_conversion_rate: 0,           // Average conversion %
  revenue_per_recipient: 0,         // RPR metric

  // Best/worst performers
  best_performing_campaign_id: '',
  best_performing_campaign_name: '',
  best_performing_campaign_revenue: 0,
  worst_performing_campaign_id: '',
  worst_performing_campaign_name: '',

  // Tag analysis
  top_tags: []                      // Most used tags
}
```

#### Dashboard Queries (FAST - Pre-aggregated):
```sql
-- 90-day campaign performance trend
SELECT
  date,
  total_campaigns,
  email_recipients + sms_recipients as total_recipients,
  total_conversion_value as revenue,
  avg_conversion_rate * 100 as conversion_rate_pct,
  revenue_per_recipient
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 90
ORDER BY date;

-- Channel comparison over time
SELECT
  toStartOfWeek(date) as week,
  sum(email_campaigns) as email_count,
  sum(sms_campaigns) as sms_count,
  avg(email_open_rate) * 100 as avg_email_open_rate,
  avg(sms_click_rate) * 100 as avg_sms_click_rate,
  sum(total_conversion_value) as total_revenue
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 90
GROUP BY week
ORDER BY week DESC;

-- Monthly attribution summary (for dashboard cards)
SELECT
  sum(total_campaigns) as campaigns_sent,
  sum(email_recipients + sms_recipients) as total_reach,
  sum(total_conversions) as attributed_orders,
  sum(total_conversion_value) as attributed_revenue,
  avg(avg_conversion_rate) * 100 as overall_conversion_rate,
  sum(total_conversion_value) / sum(email_recipients + sms_recipients) as overall_rpr
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30;

-- Best performing campaigns this month
SELECT
  best_performing_campaign_name,
  best_performing_campaign_revenue,
  date
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
  AND best_performing_campaign_revenue > 0
ORDER BY best_performing_campaign_revenue DESC
LIMIT 10;
```

#### Why This Table Exists:
1. **Eliminates ERROR 184**: No nested aggregations needed
2. **10x Faster Queries**: Pre-computed aggregates vs. scanning millions of rows
3. **Simpler Frontend Code**: Direct queries without complex CTEs
4. **Real-time Updates**: Refreshed after each campaign sync
5. **Perfect for Dashboards**: Optimized for time-series charts and KPI cards

### 10. `products_master`
**Engine**: ReplacingMergeTree (use FINAL in queries)
**Purpose**: Product performance analytics
**Update Frequency**: Daily with aggregations
**Row Count**: All unique products
**Primary Key**: `(klaviyo_public_id, product_id)`

#### Dashboard Queries (with FINAL):
```sql
-- Product Performance Matrix
SELECT
  product_name,
  total_revenue,
  total_orders,
  unique_customers,
  avg_price,
  CASE
    WHEN total_revenue > (SELECT quantile(0.8)(total_revenue) FROM products_master FINAL WHERE klaviyo_public_id = {storeId:String})
      AND total_orders > (SELECT quantile(0.8)(total_orders) FROM products_master FINAL WHERE klaviyo_public_id = {storeId:String})
    THEN 'Star'
    WHEN total_orders > (SELECT quantile(0.8)(total_orders) FROM products_master FINAL WHERE klaviyo_public_id = {storeId:String})
    THEN 'Popular'
    WHEN total_revenue > (SELECT quantile(0.8)(total_revenue) FROM products_master FINAL WHERE klaviyo_public_id = {storeId:String})
    THEN 'High Value'
    ELSE 'Standard'
  END as product_category
FROM products_master FINAL
WHERE klaviyo_public_id = {storeId:String}
ORDER BY total_revenue DESC;
```

### 10. `product_relationships_optimized`
**Engine**: ReplacingMergeTree (use FINAL in queries)
**Purpose**: Market basket analysis for cross-sell
**Update Frequency**: Daily with aggregations
**Row Count**: Product pair combinations
**Primary Key**: `(klaviyo_public_id, product_id_1, product_id_2)`

#### Dashboard Queries (with FINAL):
```sql
-- Cross-sell Recommendations
SELECT
  p1.product_name as product,
  p2.product_name as recommend_with,
  pr.confidence * 100 as confidence_pct,
  pr.lift,
  pr.co_purchase_count as frequency
FROM product_relationships_optimized pr FINAL
JOIN products_master p1 FINAL ON pr.product_id_1 = p1.product_id
  AND pr.klaviyo_public_id = p1.klaviyo_public_id
JOIN products_master p2 FINAL ON pr.product_id_2 = p2.product_id
  AND pr.klaviyo_public_id = p2.klaviyo_public_id
WHERE pr.klaviyo_public_id = {storeId:String}
  AND pr.lift > 2  -- Products bought together 2x more than random
  AND pr.confidence > 0.3  -- 30% of customers who buy A also buy B
ORDER BY pr.lift DESC
LIMIT 20;
```

---

## 📈 Aggregation Tables

### 11. `campaign_daily_aggregates` ✅ NEW
**Engine**: ReplacingMergeTree (use FINAL in queries)
**Purpose**: Pre-aggregated campaign metrics by day for ultra-fast queries
**Update Frequency**: During aggregation sync (processes all campaign_statistics updates)
**Row Count**: One row per day with campaigns
**Primary Key**: `(klaviyo_public_id, date)`
**Benefits**: Eliminates complex nested aggregations, prevents ERROR 184, 10x faster queries

> **Why This Table?**: Campaign statistics receive updates every 15 minutes. This table pre-computes daily totals using `argMax()` to get latest values, making dashboard queries simple and fast.

#### Key Fields:
```javascript
// CampaignDailyAggregates object structure
{
  date: new Date(),
  klaviyo_public_id: '',

  // Campaign counts
  total_campaigns: 0,
  email_campaigns: 0,
  sms_campaigns: 0,

  // Email metrics
  email_recipients: 0,
  email_delivered: 0,
  email_opens_unique: 0,
  email_clicks_unique: 0,
  email_open_rate: 0,
  email_click_rate: 0,

  // SMS metrics
  sms_recipients: 0,
  sms_delivered: 0,
  sms_clicks_unique: 0,
  sms_click_rate: 0,

  // Conversion metrics
  total_conversions: 0,
  total_conversion_value: 0,
  avg_order_value: 0,
  revenue_per_recipient: 0,

  // Performance
  best_performing_campaign_id: '',
  best_performing_campaign_revenue: 0,
  top_tags: []
}
```

#### Dashboard Queries:
```sql
-- Get today's campaign performance
SELECT *
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date = today();

-- Campaign channel comparison
SELECT
  date,
  email_campaigns,
  email_recipients,
  email_open_rate * 100 as email_open_pct,
  email_click_rate * 100 as email_click_pct,
  sms_campaigns,
  sms_recipients,
  sms_click_rate * 100 as sms_click_pct,
  total_conversion_value as revenue
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
ORDER BY date;

-- Best performing campaigns
SELECT
  date,
  best_performing_campaign_id,
  best_performing_campaign_revenue,
  total_campaigns,
  avg_order_value
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 7
  AND best_performing_campaign_revenue > 0
ORDER BY best_performing_campaign_revenue DESC;
```

### 12. `account_metrics_daily`
**Engine**: ReplacingMergeTree (use FINAL in queries)
**Purpose**: Pre-aggregated daily metrics for fast dashboards
**Update Frequency**: Every 30 minutes (replaces today's record)
**Row Count**: One row per day with orders
**Primary Key**: `(klaviyo_public_id, date)`
**Now Simplified**: Uses `campaign_daily_aggregates` for campaign metrics

> **Note**: This table uses RMT because it stores **one record per day** that gets **replaced** every 30 minutes with updated totals.

#### Key Fields for Frontend:
```javascript
// DailyMetrics object structure - ACTUAL FIELDS IN TABLE
{
  date: new Date(),               // Aggregation date
  klaviyo_public_id: '',          // Store identifier
  store_public_ids: [],           // Associated store IDs
  total_orders: 0,                // Daily order count
  total_revenue: 0,               // Daily revenue
  avg_order_value: 0,             // Average order size (NOT 'average_order_value'!)
  unique_customers: 0,            // Unique buyers
  unique_products_sold: 0,        // Distinct products sold
  total_quantity_sold: 0,         // Total units sold
  new_customers: 0,               // First-time buyers
  returning_customers: 0,         // Repeat buyers
  revenue_7d_ago: 0,              // Revenue 7 days ago
  revenue_30d_ago: 0,             // Revenue 30 days ago
  orders_7d_ago: 0,               // Orders 7 days ago
  orders_30d_ago: 0,              // Orders 30 days ago
  campaigns_sent: 0,              // Number of campaigns sent
  campaign_recipients: 0,         // Total campaign recipients
  campaign_revenue: 0,            // Total campaign revenue
  flow_revenue: 0,                // Total flow revenue

  // 🚨 NEW: Channel Revenue Fields (now included in main table!)
  // Channel-specific campaign revenue
  campaign_email_revenue: 0,      // Revenue from email campaigns
  campaign_sms_revenue: 0,        // Revenue from SMS campaigns
  campaign_push_revenue: 0,       // Revenue from push campaigns

  // Channel-specific flow revenue
  flow_email_revenue: 0,          // Revenue from email flows/automations
  flow_sms_revenue: 0,            // Revenue from SMS flows
  flow_push_revenue: 0,           // Revenue from push flows

  // Combined channel totals
  email_revenue: 0,               // Total email revenue (campaigns + flows)
  sms_revenue: 0,                 // Total SMS revenue (campaigns + flows)
  push_revenue: 0,                // Total push revenue (campaigns + flows)

  // Channel performance metrics
  email_recipients: 0,            // Total email recipients
  sms_recipients: 0,              // Total SMS recipients
  push_recipients: 0,             // Total push recipients
  email_delivered: 0,             // Total emails delivered
  sms_delivered: 0,               // Total SMS delivered
  push_delivered: 0,              // Total push delivered
  email_clicks: 0,                // Total email clicks
  sms_clicks: 0,                  // Total SMS clicks
  push_clicks: 0,                 // Total push clicks

  last_updated: new Date(),       // Last update timestamp
  updated_at: new Date()          // Version timestamp for RMT
}
```

#### Dashboard Queries (with FINAL):
```sql
-- Get Today's Account Metrics (Real-time)
SELECT *
FROM account_metrics_daily FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date = today();

-- Account Metrics Trend (CORRECTED FIELD NAMES)
SELECT
    date,
    total_revenue,
    total_orders,
    avg_order_value,  -- NOT 'average_order_value' or 'aov'!
    unique_customers,
    unique_products_sold,
    total_quantity_sold,
    new_customers,
    returning_customers,
    campaigns_sent,
    campaign_recipients,
    campaign_revenue,
    flow_revenue
FROM account_metrics_daily FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
ORDER BY date ASC;

-- 🚨 NEW: Channel Revenue Queries (now in main table!)
-- Channel Revenue Breakdown for Dashboard
SELECT
    date,
    total_revenue,
    email_revenue,
    sms_revenue,
    push_revenue,
    campaign_email_revenue,
    flow_email_revenue,
    campaign_sms_revenue,
    flow_sms_revenue,
    -- Calculate channel percentages
    if(total_revenue > 0, email_revenue * 100 / total_revenue, 0) as email_pct,
    if(total_revenue > 0, sms_revenue * 100 / total_revenue, 0) as sms_pct,
    if(total_revenue > 0, push_revenue * 100 / total_revenue, 0) as push_pct
FROM account_metrics_daily FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
ORDER BY date ASC;

-- Channel Performance Metrics
SELECT
    date,
    -- Email metrics
    email_recipients,
    email_delivered,
    email_clicks,
    if(email_recipients > 0, email_revenue / email_recipients, 0) as email_revenue_per_recipient,
    if(email_delivered > 0, email_clicks * 100 / email_delivered, 0) as email_click_rate,

    -- SMS metrics
    sms_recipients,
    sms_delivered,
    sms_clicks,
    if(sms_recipients > 0, sms_revenue / sms_recipients, 0) as sms_revenue_per_recipient,
    if(sms_delivered > 0, sms_clicks * 100 / sms_delivered, 0) as sms_click_rate,

    -- Channel efficiency comparison
    if(email_recipients > 0 AND sms_recipients > 0,
       (sms_revenue / sms_recipients) / (email_revenue / email_recipients), 0) as sms_vs_email_efficiency
FROM account_metrics_daily FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 7
ORDER BY date DESC;

-- KPI Cards with Comparisons
WITH current_period AS (
  SELECT
    SUM(total_revenue) as revenue,
    SUM(total_orders) as orders,
    SUM(unique_customers) as customers,
    AVG(avg_order_value) as aov  -- CORRECT: avg_order_value NOT 'average_order_value'!
  FROM account_metrics_daily FINAL
  WHERE klaviyo_public_id = {storeId:String}
    AND date >= today() - 7
    AND date <= today()
),
previous_period AS (
  SELECT
    SUM(total_revenue) as revenue,
    SUM(total_orders) as orders,
    SUM(unique_customers) as customers,
    AVG(avg_order_value) as aov  -- CORRECT: avg_order_value
  FROM account_metrics_daily FINAL
  WHERE klaviyo_public_id = {storeId:String}
    AND date >= today() - 14
    AND date < today() - 7
)
SELECT
  c.revenue as current_revenue,
  p.revenue as previous_revenue,
  (c.revenue - p.revenue) / p.revenue * 100 as revenue_change,
  c.orders as current_orders,
  p.orders as previous_orders,
  (c.orders - p.orders) / p.orders * 100 as order_change,
  c.customers as current_customers,
  c.aov as current_aov
FROM current_period c, previous_period p;
```

---

## 🔗 Cross-Table Aggregations

### 🎯 SIMPLIFIED: Using Pre-Aggregated Tables

#### Total Marketing Attribution (NEW - Using campaign_daily_aggregates)
```sql
-- SIMPLE: Direct query to pre-aggregated table
SELECT
    date,
    total_conversion_value as campaign_revenue,
    total_conversions as campaign_conversions,
    email_recipients + sms_recipients as total_reach,
    revenue_per_recipient
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 30
ORDER BY date;
```

#### CURRENT METHOD (Simple with RMT + FINAL):
```sql
WITH
flow_revenue AS (
    SELECT
        date,
        'flow' as source,
        sum(conversion_value) as revenue,
        sum(conversions) as conversions
    FROM flow_statistics FINAL  -- Just use FINAL
    WHERE klaviyo_public_id = {storeId:String}
      AND date >= today() - 30
    GROUP BY date
),
campaign_revenue AS (
    SELECT
        date,
        'campaign' as source,
        sum(conversion_value) as revenue,
        sum(conversions) as conversions
    FROM campaign_statistics FINAL  -- Just use FINAL
    WHERE klaviyo_public_id = {storeId:String}
      AND date >= today() - 30
    GROUP BY date
)
SELECT
    date,
    sum(revenue) as total_attributed_revenue,
    sum(conversions) as total_conversions,
    sumIf(revenue, source = 'flow') as flow_revenue,
    sumIf(revenue, source = 'campaign') as campaign_revenue
FROM (
    SELECT * FROM flow_revenue
    UNION ALL
    SELECT * FROM campaign_revenue
)
GROUP BY date
ORDER BY date ASC;
```

### Email vs SMS Performance (Using campaign_daily_aggregates)
```sql
-- SIMPLE: Get channel breakdown from pre-aggregated table
SELECT
    date,
    email_campaigns,
    email_recipients,
    email_open_rate * 100 as email_open_pct,
    email_click_rate * 100 as email_click_pct,
    sms_campaigns,
    sms_recipients,
    sms_click_rate * 100 as sms_click_pct,
    total_conversion_value
FROM campaign_daily_aggregates FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - 7
ORDER BY date;
```

### Email vs SMS Performance (CURRENT METHOD with RMT):
```sql
WITH combined_stats AS (
    SELECT
        'flow' as type,
        send_channel as channel,
        recipients,
        conversion_value as revenue
    FROM flow_statistics FINAL  -- Simple with FINAL
    WHERE klaviyo_public_id = {storeId:String}
      AND date >= today() - 7

    UNION ALL

    SELECT
        'campaign' as type,
        send_channel as channel,
        recipients,
        conversion_value as revenue
    FROM campaign_statistics FINAL  -- Simple with FINAL
    WHERE klaviyo_public_id = {storeId:String}
      AND date >= today() - 7
)
SELECT
    channel,
    count(*) as message_count,
    sum(recipients) as total_recipients,
    sum(revenue) as total_revenue,
    if(sum(recipients) > 0, sum(revenue) / sum(recipients), 0) as revenue_per_recipient
FROM combined_stats
GROUP BY channel;
```

---

## 🚀 Next.js Integration Examples

### 1. Dashboard API Route with Engine-Aware Queries
```javascript
// app/api/dashboard/metrics/route.js
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request) {
  const storeId = request.nextUrl.searchParams.get('storeId');
  const period = request.nextUrl.searchParams.get('period') || '7';

  const client = getClickHouseClient();

  // Get multiple metrics in parallel
  const [accountMetrics, flowStats, campaignStats] = await Promise.all([
    // Account metrics (RMT - use FINAL)
    client.query({
      query: `
        SELECT
          SUM(total_revenue) as total,
          AVG(aov) as aov,
          SUM(total_orders) as orders
        FROM account_metrics_daily FINAL
        WHERE klaviyo_public_id = {storeId:String}
          AND date >= today() - {period:UInt32}
      `,
      query_params: { storeId, period: parseInt(period) }
    }),

    // Flow stats (MT - use argMax)
    client.query({
      query: `
        SELECT
          flow_id,
          any(flow_name) as flow_name,
          sum(argMax(conversion_value, updated_at)) as revenue
        FROM flow_statistics
        WHERE klaviyo_public_id = {storeId:String}
          AND date >= today() - {period:UInt32}
        GROUP BY flow_id
        ORDER BY revenue DESC
        LIMIT 5
      `,
      query_params: { storeId, period: parseInt(period) }
    }),

    // Campaign stats (NEW - use pre-aggregated table)
    client.query({
      query: `
        SELECT
          date,
          total_campaigns,
          total_conversion_value as revenue,
          email_open_rate * 100 as email_open_pct,
          sms_click_rate * 100 as sms_click_pct,
          best_performing_campaign_id
        FROM campaign_daily_aggregates FINAL
        WHERE klaviyo_public_id = {storeId:String}
          AND date >= today() - {period:UInt32}
        ORDER BY date DESC
      `,
      query_params: { storeId, period: parseInt(period) }
    })
  ]);

  return Response.json({
    account: await accountMetrics.json(),
    topFlows: await flowStats.json(),
    topCampaigns: await campaignStats.json()
  });
}
```

### 2. Real-time Component with argMax
```jsx
// components/Dashboard/RealTimeFlowMetrics.jsx
import { useQuery } from '@tanstack/react-query';

export function RealTimeFlowMetrics({ storeId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['flow-metrics-realtime', storeId],
    queryFn: async () => {
      const res = await fetch(`/api/flows/realtime?storeId=${storeId}`);
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute for real-time
  });

  if (isLoading) return <div>Loading real-time metrics...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.flows?.map((flow) => (
        <div key={flow.flow_id} className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium">{flow.flow_name}</h3>
          <p className="text-2xl font-bold">${flow.revenue?.toFixed(2)}</p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(flow.last_updated).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### 3. API Route for Real-time Today's Metrics
```javascript
// app/api/flows/realtime/route.js
export async function GET(request) {
  const storeId = request.nextUrl.searchParams.get('storeId');
  const client = getClickHouseClient();

  // Get today's flow performance with latest values
  const result = await client.query({
    query: `
      SELECT
        flow_id,
        any(flow_name) as flow_name,
        argMax(recipients, updated_at) as recipients,
        argMax(conversion_value, updated_at) as revenue,
        argMax(conversions, updated_at) as conversions,
        max(updated_at) as last_updated
      FROM flow_statistics
      WHERE klaviyo_public_id = {storeId:String}
        AND date = today()
      GROUP BY flow_id
      ORDER BY revenue DESC
    `,
    query_params: { storeId }
  });

  return Response.json({
    flows: await result.json(),
    timestamp: new Date().toISOString()
  });
}
```

---

## ⚡ Performance & Query Patterns

### 1. Engine-Specific Query Optimization

```sql
-- ✅ Marketing Stats (MergeTree): Use argMax for latest values
SELECT
    flow_id,
    argMax(recipients, updated_at) as current_recipients
FROM flow_statistics
WHERE date = today()
GROUP BY flow_id;

-- ✅ Account Metrics (RMT): Use FINAL for deduplication
SELECT total_revenue
FROM account_metrics_daily FINAL
WHERE date = today();

-- ✅ Analytics (RMT): Use FINAL for latest customer data
SELECT customer_email, total_revenue
FROM customer_profiles FINAL
WHERE rfm_segment = 'Champions';
```

### 2. Performance Rules

```sql
-- ✅ Always filter by klaviyo_public_id first (partition key)
WHERE klaviyo_public_id = 'XqkVGb' AND date >= today() - 7

-- ✅ Use specific date ranges
WHERE date >= today() - 30 AND date <= today()

-- ✅ Limit data for real-time widgets
WHERE date = today()  -- For today-only widgets

-- ❌ Avoid broad date ranges for real-time queries
WHERE date > '2020-01-01'  -- Too broad
```

### 3. Debugging Queries

```sql
-- Check Data Freshness
SELECT
    'flow_statistics' as table_name,
    max(updated_at) as last_updated,
    count(*) as todays_records
FROM flow_statistics
WHERE date = today()

UNION ALL

SELECT
    'campaign_statistics' as table_name,
    max(updated_at) as last_updated,
    count(*) as todays_records
FROM campaign_statistics
WHERE date = today();

-- Verify Deduplication is Working
SELECT
    flow_id,
    date,
    count(*) as versions,
    min(updated_at) as first_update,
    max(updated_at) as last_update
FROM flow_statistics
WHERE klaviyo_public_id = {storeId:String}
  AND date = today()
GROUP BY flow_id, date
HAVING versions > 1
ORDER BY versions DESC;
```

### 4. Caching Strategy
```javascript
// lib/cache.js
import { unstable_cache } from 'next/cache';

// Real-time data: Short cache (5 minutes)
export const getCachedRealTimeMetrics = unstable_cache(
  async (storeId) => {
    return fetchTodaysMetrics(storeId);
  },
  ['realtime-metrics'],
  {
    revalidate: 300, // 5 minutes
    tags: ['metrics', 'realtime']
  }
);

// Historical data: Longer cache (1 hour)
export const getCachedHistoricalMetrics = unstable_cache(
  async (storeId, days) => {
    return fetchHistoricalMetrics(storeId, days);
  },
  ['historical-metrics'],
  {
    revalidate: 3600, // 1 hour
    tags: ['metrics', 'historical']
  }
);
```

---

## 🔐 Security & RMT Best Practices

### 1. Parameterized Queries with FINAL
```javascript
// ✅ CORRECT - Parameterized + FINAL
const result = await client.query({
  query: 'SELECT * FROM orders FINAL WHERE klaviyo_public_id = {storeId:String}',
  query_params: { storeId: userInput }
});

// ❌ WRONG - Missing FINAL and concatenation
const result = await client.query({
  query: `SELECT * FROM orders WHERE klaviyo_public_id = '${userInput}'`
});
```

### 2. INSERT Best Practices
```javascript
// ✅ CORRECT - Include version column
const result = await client.insert({
  table: 'customer_profiles',
  values: [{
    email: 'user@example.com',
    total_orders: 5,
    last_updated: new Date()  // Version column
  }]
});

// ❌ WRONG - Missing version column
const result = await client.insert({
  table: 'customer_profiles',
  values: [{
    email: 'user@example.com',
    total_orders: 5
    // Missing last_updated
  }]
});
```

### 2. Access Control
```javascript
// middleware.js
export async function middleware(request) {
  const session = await getSession(request);
  const storeId = request.nextUrl.searchParams.get('storeId');

  if (!session.stores.includes(storeId)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
```

---

## 🔍 Troubleshooting Guide

### Common Issues

1. **No data showing**: Check `klaviyo_public_id` filter and sync status
2. **Slow queries**: Use aggregated tables, add time filters, check engine types
3. **Incorrect metrics**: Ensure ALL queries use `FINAL` modifier (all tables are RMT)
4. **Missing real-time data**: Check if 15-minute sync is running
5. **Duplicate data showing**: Add `FINAL` modifier to your queries

### Engine-Specific Debugging
```sql
-- Check table engines
SELECT
    table,
    engine,
    engine_full
FROM system.tables
WHERE database = currentDatabase()
  AND table IN ('flow_statistics', 'campaign_statistics', 'account_metrics_daily');

-- Check for duplicate versions (RMT deduplication)
SELECT
    'Without FINAL' as query_type,
    count(*) as row_count
FROM campaign_statistics
WHERE date = today()
UNION ALL
SELECT
    'With FINAL' as query_type,
    count(*) as row_count
FROM campaign_statistics FINAL
WHERE date = today();
```

---

## 🚨 CORRECT FIELD NAMES - FRONTEND MUST USE THESE

### ⚠️ Common Field Name Errors to Avoid:

| Table | WRONG (causes error) | CORRECT (use this!) | Notes |
|-------|---------------------|---------------------|-------|
| `account_metrics_daily` | `average_order_value` | `avg_order_value` | Frontend error fixed |
| `account_metrics_daily` | `aov` | `avg_order_value` | No 'aov' column exists |
| `account_metrics_daily` | `new_customer_revenue` | (doesn't exist) | Use `new_customers` count instead |
| `account_metrics_daily` | `repeat_customer_revenue` | (doesn't exist) | Use `returning_customers` count |
| `segment_statistics` | `profile_count` | `total_members` | Frontend error fixed |
| `segment_statistics` | `members_count` | `total_members` | Use consistent naming |

### ✅ Correct Query Examples for Frontend

#### Get Account Metrics (WORKING):
```sql
-- CORRECT - Uses actual field names
SELECT
    sum(total_orders) as total_orders,
    sum(total_revenue) as total_revenue,
    avg(avg_order_value) as avg_order_value,  -- NOT 'average_order_value'!
    sum(unique_customers) as unique_customers,
    sum(new_customers) as new_customers_count,
    sum(returning_customers) as returning_customers_count
FROM account_metrics_daily FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date >= today() - {days:UInt32}
```

#### Get Segment Statistics (WORKING):
```sql
-- CORRECT - Uses 'total_members' not 'profile_count'
SELECT
    countDistinct(segment_id) as total_segments,
    sum(total_members) as total_profiles  -- NOT 'profile_count'!
FROM segment_statistics FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date = (
    SELECT max(date)
    FROM segment_statistics FINAL
    WHERE klaviyo_public_id = {storeId:String}
  )
```

#### Get Today's Complete Metrics:
```sql
-- All fields that actually exist
SELECT
    date,
    klaviyo_public_id,
    store_public_ids,
    total_orders,
    total_revenue,
    avg_order_value,      -- NOT 'average_order_value' or 'aov'
    unique_customers,
    unique_products_sold,
    total_quantity_sold,
    new_customers,
    returning_customers,
    revenue_7d_ago,
    revenue_30d_ago,
    orders_7d_ago,
    orders_30d_ago,
    campaigns_sent,
    campaign_recipients,
    campaign_revenue,
    flow_revenue,
    last_updated,
    updated_at
FROM account_metrics_daily FINAL
WHERE klaviyo_public_id = {storeId:String}
  AND date = today()
```

---

**Implementation Status**: ALL 12 tables are now **ReplacingMergeTree** with automatic deduplication.

## 🔴 CRITICAL REMINDERS:

**ALWAYS use `FINAL` modifier on EVERY query** - No exceptions!

```sql
-- ❌ WRONG - May return duplicates
SELECT * FROM any_table WHERE ...;

-- ✅ CORRECT - Returns deduplicated data
SELECT * FROM any_table FINAL WHERE ...;
```

**Remember**:
- ALL tables: **ReplacingMergeTree** → ALWAYS use `FINAL`
- INSERT operations: ALWAYS include version column
- JOINs: Use `FINAL` on BOTH tables
- Subqueries/CTEs: Use `FINAL` inside them too
- Performance: Filter by partition keys when possible

## 🚨 CRITICAL: Column Order in INSERT Statements

### The Problem
ClickHouse uses **positional insertion** when column names are not specified in INSERT statements. This can cause severe data corruption where values end up in wrong columns.

### Common Symptoms of Column Mismatch
- **Email revenue appearing as SMS revenue** or vice versa
- **Push revenue showing non-zero values** when no push channel exists
- **Email metrics (delivered, recipients, clicks) showing as 0** despite having data
- **Channel metrics appearing in wrong columns**
- **Flow revenue showing inflated values** (e.g., 175+ million instead of hundreds)

### The Solution: ALWAYS Use Explicit Column Names

```sql
-- ✅ CORRECT: Explicit column names ensure data integrity
INSERT INTO account_metrics_daily (
    date, klaviyo_public_id, store_public_ids, total_orders, total_revenue,
    avg_order_value, unique_customers, unique_products_sold, total_quantity_sold,
    new_customers, returning_customers, revenue_7d_ago, revenue_30d_ago,
    orders_7d_ago, orders_30d_ago, campaigns_sent, campaign_recipients,
    campaign_revenue, flow_revenue, campaign_email_revenue, campaign_sms_revenue,
    campaign_push_revenue, flow_email_revenue, flow_sms_revenue, flow_push_revenue,
    email_revenue, sms_revenue, push_revenue, email_recipients, sms_recipients,
    push_recipients, email_delivered, sms_delivered, push_delivered,
    email_clicks, sms_clicks, push_clicks, last_updated, updated_at
)
SELECT
    -- columns in EXACT same order as specified above
    date, klaviyo_public_id, [], total_orders, total_revenue,
    avg_order_value, unique_customers, unique_products_sold, total_quantity_sold,
    new_customers, returning_customers, revenue_7d_ago, revenue_30d_ago,
    orders_7d_ago, orders_30d_ago, campaigns_sent, campaign_recipients,
    campaign_revenue, flow_revenue, campaign_email_revenue, campaign_sms_revenue,
    campaign_push_revenue, flow_email_revenue, flow_sms_revenue, flow_push_revenue,
    email_revenue, sms_revenue, push_revenue, email_recipients, sms_recipients,
    push_recipients, email_delivered, sms_delivered, push_delivered,
    email_clicks, sms_clicks, push_clicks, now64(), now()
FROM ...

-- ❌ WRONG: Positional insertion causes data corruption
INSERT INTO account_metrics_daily
SELECT ... -- Values can end up in wrong columns!
```

### Critical for These Tables
This is especially important for tables with many columns:
- `account_metrics_daily` (40+ columns including channel-specific metrics)
- `campaign_daily_aggregates` (45+ columns with detailed performance metrics)
- `customer_profiles` (30+ columns with LTV and RFM metrics)
- `products_master` (25+ columns with product analytics)

### Channel Revenue Column Structure in account_metrics_daily

The `account_metrics_daily` table has specific columns for channel revenue tracking:

| Column | Position | Purpose |
|--------|----------|---------|
| `campaign_revenue` | 18 | Total campaign revenue (all channels) |
| `flow_revenue` | 19 | Total flow revenue (all channels) |
| `campaign_email_revenue` | 20 | Campaign revenue from email channel |
| `campaign_sms_revenue` | 21 | Campaign revenue from SMS channel |
| `campaign_push_revenue` | 22 | Campaign revenue from push channel |
| `flow_email_revenue` | 23 | Flow revenue from email channel |
| `flow_sms_revenue` | 24 | Flow revenue from SMS channel |
| `flow_push_revenue` | 25 | Flow revenue from push channel |
| `email_revenue` | 26 | Combined email revenue (campaigns + flows) |
| `sms_revenue` | 27 | Combined SMS revenue (campaigns + flows) |
| `push_revenue` | 28 | Combined push revenue (campaigns + flows) |

### Best Practices
1. **ALWAYS specify column names** in INSERT statements
2. **Match SELECT column order** exactly to the INSERT column list
3. **Test with LIMIT 1** first when debugging column issues
4. **Use DESCRIBE TABLE** to verify column order before INSERT
5. **Add ALTER TABLE ADD COLUMN IF NOT EXISTS** for missing columns

**Quick Reference**:
```sql
-- SELECT template
SELECT ... FROM table FINAL WHERE ...;

-- JOIN template
FROM table1 FINAL t1 JOIN table2 FINAL t2 ON ...;

-- INSERT template with explicit columns
INSERT INTO table (col1, col2, col3, version_column)
SELECT col1, col2, col3, now() FROM ...;

-- Aggregation template
SELECT ... FROM table FINAL GROUP BY ...;
```
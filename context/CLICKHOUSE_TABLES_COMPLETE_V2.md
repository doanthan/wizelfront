# ClickHouse Tables Complete Reference - V2 Architecture

⚠️ **CRITICAL: Column Name Reference Guide** ⚠️
```
CORRECT NAME          ❌ WRONG NAME (will cause errors)
-----------------------------------------------------
delivery_rate         ❌ delivery_rate_pct
open_rate            ❌ open_rate_pct
click_rate           ❌ click_rate_pct
conversion_rate      ❌ conversion_rate_pct
bounce_rate          ❌ bounce_rate_pct
unsubscribe_rate     ❌ unsubscribe_rate_pct
product_name         ❌ product_title
updated_at           ❌ timestamp
customer_email       ✅ (both customer_email and customer_id exist)
shipping_amount      ✅ (not shipping_cost)
sku                  ✅ (Item ID from Shopify - field in klaviyo_order_line_items, products_master)
first_product_sku    ✅ (First product SKU in first_purchase_ltv_analysis only)
line_actual          ❌ (REMOVED - use: line_total - discount_amount)
```

**Last Updated**: 2025-10-01 - Added SKU fields to product analytics tables
**Database**: `default` @ kis8xv8y1f.us-east-1.aws.clickhouse.cloud
**API Endpoints**: `/api/v2/reports/aggregates_sync`, `/api/v2/reports/full_sync`
**Total Tables**: 28 production tables (ReplacingMergeTree for statistics)
**Query Performance**: <50ms for aggregated data, <100ms for raw queries
**Architecture**: **V2 ReplacingMergeTree - FINAL pattern for statistics tables**

## 🔥 V2 Architecture Update (September 2025)

### Complete V2 Aggregation System
- ✅ **28 production tables** with comprehensive schema coverage
- ✅ **V2 Full Sync orchestration** - Campaign, Flow, Form, Segment, Order sync
- ✅ **Enhanced channel revenue tracking** - Email, SMS, Push breakdown
- ✅ **Advanced analytics pipeline** - Customer LTV, product cohorts, discount analysis
- ✅ **ReplacingMergeTree optimization** - Automatic deduplication with FINAL pattern
- ✅ **95% cost reduction** - Minimal data scanning with optimized queries

### V2 Query Patterns - QUICK REFERENCE

**⚠️ MOST IMPORTANT PATTERNS:**

```sql
-- 1. account_metrics_daily (updated every 30 min)
SELECT * FROM account_metrics_daily
WHERE klaviyo_public_id = 'XYZ' AND date >= today() - 30
ORDER BY date DESC, updated_at DESC
LIMIT 1 BY date  -- Gets latest version of each day

-- 2. Statistics tables (campaign/flow/form/segment)
SELECT argMax(recipients, updated_at) as recipients
FROM campaign_statistics
WHERE klaviyo_public_id = 'XYZ'
GROUP BY campaign_id

-- 3. Analytics tables (ReplacingMergeTree)
SELECT * FROM buyer_segments_analysis FINAL
WHERE klaviyo_public_id = 'XYZ'

-- 4. Transaction tables (klaviyo_orders)
SELECT * FROM klaviyo_orders
WHERE klaviyo_public_id = 'XYZ'
```

**Pattern Summary:**
1. **Statistics Tables (15min updates)**: Use `argMax(column, updated_at)` pattern
2. **Daily Metrics Tables**: Use `ORDER BY date DESC, updated_at DESC LIMIT 1 BY date`
3. **Transaction Tables**: Direct queries (klaviyo_orders, klaviyo_order_line_items)
4. **Analytics Tables**: Use `FINAL` for ReplacingMergeTree tables

## 🎯 Complete Table Architecture (28 Tables)

**Table Distribution by Purpose:**
- **Transaction Tables (2)**: Orders and line items - immutable transactional data
- **Marketing Statistics (7)**: Campaign, flow, form, segment stats - 15-min updates with argMax pattern
- **Aggregated Tables (3)**: Daily metrics and campaign aggregates - pre-computed for fast queries
- **Analytics Tables (13)**: Customer profiles, product analysis, LTV predictions - complex analytics
- **Metadata Tables (3)**: Flow, form, segment metadata - fast dropdown population
- **System Tables (1)**: Sync tracking and orchestration

| Table | Engine | Query Pattern | Primary Purpose | Update Frequency |
|-------|--------|---------------|-----------------|------------------|
| **TRANSACTION TABLES** |
| `klaviyo_orders` | MergeTree | Direct query | Order transactions | Every 30 minutes |
| `klaviyo_order_line_items` | MergeTree | Direct query | Line item details with discounts | Every 30 minutes |
| **MARKETING STATISTICS** |
| `campaign_statistics` | MergeTree | `argMax(column, updated_at)` | Campaign performance | Every 15 minutes |
| `campaign_statistics_new` | MergeTree | `argMax(column, updated_at)` | Enhanced campaign stats | Every 15 minutes |
| `flow_statistics` | MergeTree | `argMax(column, updated_at)` | Flow automation performance | Every 15 minutes |
| `form_statistics` | MergeTree | `argMax(column, updated_at)` | Form/popup performance | Every 15 minutes |
| `segment_statistics` | MergeTree | `argMax(column, updated_at)` | Segment growth tracking | Every 15 minutes |
| `flow_metadata` | MergeTree | Direct query | Flow catalog for dropdowns | During sync |
| `form_metadata` | MergeTree | Direct query | Form catalog for dropdowns | During sync |
| `segment_metadata` | MergeTree | Direct query | Segment catalog for dropdowns | During sync |
| **AGGREGATED TABLES** |
| `account_metrics_daily` | MergeTree | `ORDER BY updated_at DESC LIMIT 1` | Daily account-level KPIs | Every 30 minutes |
| `campaign_daily_aggregates` | MergeTree | `ORDER BY updated_at DESC LIMIT 1` | Campaign performance by day | During aggregation |
| **ANALYTICS TABLES** |
| `customer_profiles` | ReplacingMergeTree | `FROM table FINAL` | Customer LTV and RFM analysis | During aggregation |
| `products_master` | ReplacingMergeTree | `FROM table FINAL` | Product performance analytics | During aggregation |
| `product_discount_analysis` | ReplacingMergeTree | `FROM table FINAL` | Discount effectiveness analysis | During aggregation |
| `customer_ltv_predictions` | ReplacingMergeTree | `FROM table FINAL` | ML-based LTV predictions | During LTV analysis |
| `first_purchase_ltv` | ReplacingMergeTree | `FROM table FINAL` | First product LTV impact | During LTV analysis |
| `first_purchase_ltv_analysis` | ReplacingMergeTree | `FROM table FINAL` | Enhanced first product analysis | During LTV analysis |
| `product_cohorts` | ReplacingMergeTree | `FROM table FINAL` | Product retention cohorts | During cohort analysis |
| `product_entry_cohorts` | ReplacingMergeTree | `FROM table FINAL` | Entry product cohort tracking | During cohort analysis |
| `product_relationships_optimized` | ReplacingMergeTree | `FROM table FINAL` | Product co-purchase analysis | During aggregation |
| `discount_dependency` | ReplacingMergeTree | `FROM table FINAL` | Customer discount dependency | During discount analysis |
| `refund_cancelled_orders` | MergeTree | Direct query | Refund and cancellation events | During refund sync |
| `buyer_segments_analysis` | ReplacingMergeTree | `FROM table FINAL` | Customer segment analytics | During analytics dashboard |
| `product_ltv_analysis` | ReplacingMergeTree | `FROM table FINAL` | Product LTV breakdown | During analytics dashboard |
| `discount_usage_analytics` | ReplacingMergeTree | `FROM table FINAL` | Discount effectiveness metrics | During analytics dashboard |
| `new_customer_products` | ReplacingMergeTree | `FROM table FINAL` | Best products for new customers | During analytics dashboard |
| `product_affinity_matrix` | ReplacingMergeTree | `FROM table FINAL` | Product recommendation engine | During analytics dashboard |
| **SYSTEM TABLES** |
| `klaviyo_syncs` | MergeTree | Direct query | Sync status and orchestration | Real-time |

---

## 🚀 JavaScript/Next.js Dashboard Integration Guide

### ClickHouse Client Setup

```javascript
// lib/clickhouse.js
import { createClient } from '@clickhouse/client'

const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  database: process.env.CLICKHOUSE_DATABASE,
})

export default clickhouse
```

### Essential Dashboard Query Functions

```javascript
// lib/dashboard-queries.js
import clickhouse from './clickhouse'

// Account Overview Dashboard
export async function getAccountOverview(klaviyoPublicId, days = 30) {
  const query = `
    WITH latest_metrics AS (
      SELECT *
      FROM account_metrics_daily
      WHERE klaviyo_public_id = {klaviyo_id:String}
        AND date >= today() - {days:UInt32}
      ORDER BY date DESC, updated_at DESC
      LIMIT 1 BY date
    )
    SELECT
      SUM(total_revenue) as total_revenue,
      SUM(total_orders) as total_orders,
      AVG(avg_order_value) as avg_order_value,
      SUM(unique_customers) as unique_customers,
      SUM(email_revenue) as email_revenue,
      SUM(sms_revenue) as sms_revenue,
      SUM(push_revenue) as push_revenue,
      SUM(new_customers) as new_customers,
      SUM(returning_customers) as returning_customers
    FROM latest_metrics
  `

  const result = await clickhouse.query({
    query,
    query_params: { klaviyo_id: klaviyoPublicId, days: days }
  })
  return result.json()
}

// Customer Segments Dashboard
export async function getCustomerSegments(klaviyoPublicId) {
  const query = `
    SELECT
      buyer_segment,
      customer_count,
      total_revenue,
      avg_order_value,
      avg_ltv,
      pct_of_customers,
      pct_of_revenue
    FROM buyer_segments_analysis FINAL
    WHERE klaviyo_public_id = {klaviyo_id:String}
    ORDER BY total_revenue DESC
  `

  const result = await clickhouse.query({
    query,
    query_params: { klaviyo_id: klaviyoPublicId }
  })
  return result.json()
}

// Product Performance Dashboard
export async function getProductPerformance(klaviyoPublicId, limit = 20) {
  const query = `
    SELECT
      product_id,
      product_name,
      total_revenue,
      total_orders,
      unique_customers,
      avg_price
    FROM product_ltv_analysis FINAL
    WHERE klaviyo_public_id = {klaviyo_id:String}
    ORDER BY total_revenue DESC
    LIMIT {limit:UInt32}
  `

  const result = await clickhouse.query({
    query,
    query_params: { klaviyo_id: klaviyoPublicId, limit: limit }
  })
  return result.json()
}

// Product Recommendations
export async function getProductRecommendations(klaviyoPublicId, productId) {
  const query = `
    SELECT
      first_product_id,
      first_product_name,
      second_product_id,
      second_product_name,
      probability_of_second * 100 as recommendation_score,
      customers_bought_both
    FROM product_affinity_matrix FINAL
    WHERE klaviyo_public_id = {klaviyo_id:String}
      AND first_product_id = {product_id:String}
      AND probability_of_second > 0.1
    ORDER BY probability_of_second DESC
    LIMIT 10
  `

  const result = await clickhouse.query({
    query,
    query_params: { klaviyo_id: klaviyoPublicId, product_id: productId }
  })
  return result.json()
}

// Campaign Performance
export async function getCampaignPerformance(klaviyoPublicId, days = 30) {
  const query = `
    WITH campaign_stats AS (
      SELECT
        campaign_id,
        argMax(campaign_name, updated_at) as campaign_name,
        argMax(send_channel, updated_at) as channel,
        argMax(recipients, updated_at) as recipients,
        argMax(conversion_value, updated_at) as revenue,
        argMax(open_rate, updated_at) / 100.0 as open_rate,
        argMax(click_rate, updated_at) / 100.0 as click_rate
      FROM campaign_statistics
      WHERE klaviyo_public_id = {klaviyo_id:String}
        AND date >= today() - {days:UInt32}
      GROUP BY campaign_id
    )
    SELECT * FROM campaign_stats
    WHERE recipients > 0
    ORDER BY revenue DESC
  `

  const result = await clickhouse.query({
    query,
    query_params: { klaviyo_id: klaviyoPublicId, days: days }
  })
  return result.json()
}

// Daily Trend Data (for charts)
export async function getDailyTrend(klaviyoPublicId, days = 30) {
  const query = `
    SELECT
      date,
      total_revenue,
      total_orders,
      avg_order_value,
      unique_customers,
      email_revenue,
      sms_revenue,
      push_revenue,
      new_customers,
      returning_customers
    FROM account_metrics_daily
    WHERE klaviyo_public_id = {klaviyo_id:String}
      AND date >= today() - {days:UInt32}
    ORDER BY date DESC, updated_at DESC
    LIMIT 1 BY date
    ORDER BY date ASC
  `

  const result = await clickhouse.query({
    query,
    query_params: { klaviyo_id: klaviyoPublicId, days }
  })
  return result.json()
}

// Today's Metrics
export async function getTodayMetrics(klaviyoPublicId) {
  const query = `
    SELECT
      date,
      total_revenue,
      total_orders,
      avg_order_value,
      unique_customers,
      email_revenue,
      sms_revenue,
      push_revenue,
      email_delivered,
      email_opens,
      campaigns_sent,
      new_customers,
      returning_customers
    FROM account_metrics_daily
    WHERE klaviyo_public_id = {klaviyo_id:String}
      AND date = today()
    ORDER BY updated_at DESC
    LIMIT 1
  `

  const result = await clickhouse.query({
    query,
    query_params: { klaviyo_id: klaviyoPublicId }
  })

  const data = result.json()
  return data.length > 0 ? data[0] : null
}
```

### Next.js API Route Example

```javascript
// pages/api/dashboard/overview.js
import { getAccountOverview } from '../../../lib/dashboard-queries'

export default async function handler(req, res) {
  const { klaviyo_public_id, days = 30 } = req.query

  if (!klaviyo_public_id) {
    return res.status(400).json({ message: 'klaviyo_public_id is required' })
  }

  try {
    const data = await getAccountOverview(klaviyo_public_id, parseInt(days))
    res.status(200).json({ success: true, data: data[0] || {} })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

### React Component Example

```javascript
// components/dashboard/OverviewCards.js
import { useEffect, useState } from 'react'

export default function OverviewCards({ klaviyoPublicId, days = 30 }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/dashboard/overview?klaviyo_public_id=${klaviyoPublicId}&days=${days}`
        )
        const result = await response.json()
        if (result.success) setData(result.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [klaviyoPublicId, days])

  if (loading) return <div>Loading...</div>
  if (!data) return <div>No data available</div>

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Total Revenue</h3>
        <p className="text-3xl font-bold text-green-600">{formatCurrency(data.total_revenue)}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Total Orders</h3>
        <p className="text-3xl font-bold text-blue-600">{data.total_orders?.toLocaleString()}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Avg Order Value</h3>
        <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.avg_order_value)}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold">Customers</h3>
        <p className="text-3xl font-bold text-orange-600">{data.unique_customers?.toLocaleString()}</p>
      </div>
    </div>
  )
}
```

### TypeScript Interfaces

```typescript
// types/dashboard.ts
export interface AccountOverview {
  total_revenue: number
  total_orders: number
  avg_order_value: number
  unique_customers: number
  email_revenue: number
  sms_revenue: number
  push_revenue: number
  new_customers: number
  returning_customers: number
}

export interface CustomerSegment {
  buyer_segment: string
  customer_count: number
  total_revenue: number
  avg_order_value: number
  avg_ltv: number
  pct_of_customers: number
  pct_of_revenue: number
}

export interface ProductPerformance {
  product_id: string
  sku: string  // Item ID/SKU from Shopify
  product_name: string
  total_revenue: number
  total_orders: number
  unique_customers: number
  avg_price: number
}

export interface ProductRecommendation {
  first_product_id: string
  first_product_name: string
  second_product_id: string
  second_product_name: string
  recommendation_score: number
  customers_bought_both: number
}
```

## 🎯 Key Tables for Dashboard Development

### 1. account_metrics_daily
**Core business metrics by date**

**⚠️ CRITICAL:** This table is updated every 30 minutes. Always use `ORDER BY date DESC, updated_at DESC LIMIT 1 BY date` to get the latest version of each day.

**Pattern 1: Aggregate Multiple Days (Dashboard Totals)**
```sql
-- Get totals for last 30 days
WITH latest_metrics AS (
  SELECT *
  FROM account_metrics_daily
  WHERE klaviyo_public_id = 'XYZ'
    AND date >= today() - 30
  ORDER BY date DESC, updated_at DESC
  LIMIT 1 BY date  -- Gets latest version of each day
)
SELECT
  SUM(total_revenue) as total_revenue,
  SUM(total_orders) as total_orders,
  AVG(avg_order_value) as avg_order_value,
  SUM(unique_customers) as unique_customers,
  SUM(email_revenue) as email_revenue,
  SUM(sms_revenue) as sms_revenue,
  SUM(push_revenue) as push_revenue,
  SUM(new_customers) as new_customers,
  SUM(returning_customers) as returning_customers
FROM latest_metrics
```

**Pattern 2: Daily Trend Data (For Charts)**
```sql
-- Get daily values for charting
SELECT
  date,
  total_revenue,
  total_orders,
  avg_order_value,
  unique_customers,
  email_revenue,
  sms_revenue,
  new_customers,
  returning_customers
FROM account_metrics_daily
WHERE klaviyo_public_id = 'XYZ'
  AND date >= today() - 30
ORDER BY date DESC, updated_at DESC
LIMIT 1 BY date
ORDER BY date ASC  -- Final sort for chronological charts
```

**Pattern 3: Single Day (Today's Metrics)**
```sql
-- Get today's latest metrics
SELECT
  date,
  total_revenue,
  total_orders,
  avg_order_value,
  unique_customers,
  email_revenue,
  email_delivered,
  email_opens,
  campaigns_sent
FROM account_metrics_daily
WHERE klaviyo_public_id = 'XYZ'
  AND date = today()
ORDER BY updated_at DESC
LIMIT 1
```

### 2. buyer_segments_analysis
**Customer behavior insights (1x, 2x, 3x+ buyers)**
```sql
SELECT buyer_segment, customer_count, total_revenue, avg_ltv, pct_of_customers
FROM buyer_segments_analysis FINAL
WHERE klaviyo_public_id = 'XYZ'
```

### 3. product_ltv_analysis
**Product performance and LTV breakdown**
```sql
SELECT
    product_id,
    sku,  -- Item ID/SKU from Shopify
    product_name,
    customers_bought_once,
    customers_bought_twice,
    customers_bought_3plus,
    ltv_from_single_buyers,
    ltv_from_repeat_buyers
FROM product_ltv_analysis FINAL
WHERE klaviyo_public_id = 'XYZ'
ORDER BY total_revenue DESC
```

### 4. product_affinity_matrix
**Product recommendation engine**
```sql
SELECT
    first_product_id,
    first_product_name,
    second_product_id,
    second_product_name,
    probability_of_second,
    customers_bought_both
FROM product_affinity_matrix FINAL
WHERE klaviyo_public_id = 'XYZ'
    AND probability_of_second > 0.1
ORDER BY probability_of_second DESC
```

### 5. refund_cancelled_orders
**Refund and cancellation events tracking**
```sql
SELECT
    event_id,
    customer_email,
    order_id,
    refund_amount,
    event_timestamp,
    event_type,  -- 'Refund' or 'Cancelled Order'
    products_affected,  -- Array of product IDs (Shopify numeric)
    line_items_affected,
    refund_reason
FROM refund_cancelled_orders
WHERE klaviyo_public_id = 'XYZ'
    AND event_timestamp >= today() - 30
ORDER BY event_timestamp DESC
```

**Use Cases:**
- Track refunds by product ID
- Calculate net revenue (revenue - refunds) by product
- Identify products with high refund rates

### 6. campaign_statistics
**Campaign performance with argMax pattern**
```sql
SELECT campaign_id,
       argMax(campaign_name, updated_at) as campaign_name,
       argMax(recipients, updated_at) as recipients,
       argMax(conversion_value, updated_at) as revenue
FROM campaign_statistics
WHERE klaviyo_public_id = 'XYZ' AND date >= today() - 30
GROUP BY campaign_id
```

## 🔧 Query Patterns Quick Reference

### Table-Specific Patterns

| Table Type | Engine | Query Pattern | Example |
|------------|--------|---------------|---------|
| **Statistics** | MergeTree | `argMax(column, updated_at)` | `argMax(recipients, updated_at)` |
| **Daily Metrics** | MergeTree | `ORDER BY date DESC, updated_at DESC LIMIT 1 BY date` | See account_metrics_daily examples above |
| **Analytics** | ReplacingMergeTree | `FROM table FINAL` | `FROM buyer_segments_analysis FINAL` |
| **Aggregated** | MergeTree | `LIMIT 1 BY date` | `ORDER BY date DESC LIMIT 1 BY date` |
| **Transaction** | MergeTree | Direct query | `FROM klaviyo_orders WHERE...` |

### ⚠️ Common Mistakes to Avoid

#### ❌ account_metrics_daily Mistakes

```sql
-- ❌ WRONG: Missing updated_at sort (gets random version)
SELECT * FROM account_metrics_daily
WHERE klaviyo_public_id = 'XYZ'
  AND date >= today() - 30
LIMIT 1 BY date

-- ❌ WRONG: No LIMIT 1 BY date (gets all versions)
SELECT * FROM account_metrics_daily
WHERE klaviyo_public_id = 'XYZ'
  AND date >= today() - 30
ORDER BY date DESC

-- ❌ WRONG: Missing date sort (wrong chronological order)
SELECT * FROM account_metrics_daily
WHERE klaviyo_public_id = 'XYZ'
  AND date >= today() - 30
ORDER BY updated_at DESC
LIMIT 1 BY date

-- ✅ CORRECT: Both sorted properly
SELECT * FROM account_metrics_daily
WHERE klaviyo_public_id = 'XYZ'
  AND date >= today() - 30
ORDER BY date DESC, updated_at DESC
LIMIT 1 BY date
```

#### ❌ Statistics Tables Mistakes

```sql
-- ❌ WRONG: Direct query without argMax
SELECT recipients FROM campaign_statistics

-- ❌ WRONG: Can't nest aggregate functions
SELECT sum(argMax(recipients, updated_at)) FROM campaign_statistics

-- ✅ CORRECT: Use subquery pattern
SELECT sum(recipients_latest)
FROM (
  SELECT argMax(recipients, updated_at) as recipients_latest
  FROM campaign_statistics
  GROUP BY campaign_id
)
```

#### ❌ Analytics Tables Mistakes

```sql
-- ❌ WRONG: Missing FINAL keyword
SELECT * FROM buyer_segments_analysis
WHERE klaviyo_public_id = 'XYZ'

-- ✅ CORRECT: Always use FINAL
SELECT * FROM buyer_segments_analysis FINAL
WHERE klaviyo_public_id = 'XYZ'
```

---

## 🏢 Context7 ClickHouse Best Practices

### **High-Performance Table Architecture**

Based on Context7's enterprise-grade analytics requirements, these tables implement advanced ClickHouse optimization patterns:

#### 1. **Statistics Tables - 15-Minute Update Pattern**
**Tables**: `campaign_statistics`, `flow_statistics`, `form_statistics`, `segment_statistics`

```sql
-- ✅ CONTEXT7 PATTERN: Always use argMax for latest values
SELECT
  campaign_id,
  argMax(campaign_name, updated_at) as campaign_name,
  argMax(recipients, updated_at) as recipients_latest,
  argMax(conversion_value, updated_at) as revenue_latest,
  argMax(open_rate, updated_at) / 100.0 as open_rate_decimal
FROM campaign_statistics
WHERE klaviyo_public_id = {id:String}
  AND date >= today() - {days:UInt32}
GROUP BY campaign_id
```

**Why**: These tables receive multiple updates per day (every 15 minutes). The `argMax(column, updated_at)` pattern ensures you always get the latest values without duplicate processing.

#### 2. **Analytics Tables - ReplacingMergeTree with FINAL**
**Tables**: `buyer_segments_analysis`, `product_ltv_analysis`, `discount_usage_analytics`, `product_affinity_matrix`, `new_customer_products`

```sql
-- ✅ CONTEXT7 PATTERN: Always use FINAL for analytics tables
SELECT
  buyer_segment,
  customer_count,
  total_revenue,
  avg_ltv,
  pct_of_customers
FROM buyer_segments_analysis FINAL
WHERE klaviyo_public_id = {id:String}
ORDER BY total_revenue DESC
```

**Why**: These tables use ReplacingMergeTree for efficient updates. FINAL ensures you get deduplicated, latest data for accurate analytics.

#### 3. **Daily Metrics - LIMIT 1 BY Pattern**
**Table**: `account_metrics_daily`

```sql
-- ✅ CONTEXT7 PATTERN: Get latest daily metrics efficiently
WITH latest_metrics AS (
  SELECT *
  FROM account_metrics_daily
  WHERE klaviyo_public_id = {id:String}
    AND date >= today() - {days:UInt32}
  ORDER BY date DESC, updated_at DESC
  LIMIT 1 BY date  -- ✅ Critical for performance
)
SELECT
  date,
  total_revenue,
  total_orders,
  avg_order_value,
  email_revenue,
  sms_revenue,
  push_revenue
FROM latest_metrics
ORDER BY date DESC
```

**Why**: Multiple updates per day require `LIMIT 1 BY date` to get the latest version of each day's metrics efficiently.

#### 4. **Transaction Tables - Direct Query Optimization**
**Tables**: `klaviyo_orders`, `klaviyo_order_line_items`

```sql
-- ✅ CONTEXT7 PATTERN: Efficient transaction queries with proper indexing
SELECT
  order_id,
  customer_email,
  order_value,
  order_timestamp,
  item_count
FROM klaviyo_orders
WHERE klaviyo_public_id = {id:String}
  AND order_timestamp >= {start_date:DateTime64}
  AND order_timestamp < {end_date:DateTime64}
  AND customer_email != ''
  AND customer_email NOT LIKE '%@anonymous.local%'
ORDER BY order_timestamp DESC
LIMIT {limit:UInt32}
```

**Why**: Direct queries on immutable transaction data with proper filtering for performance and data quality.

### **Context7 Query Optimization Strategies**

#### 1. **Channel Revenue Aggregation**
```sql
-- ✅ ENTERPRISE PATTERN: Complete channel revenue tracking
WITH campaign_revenue AS (
  SELECT
    date,
    SUM(IF(channel = 'email', argMax(conversion_value, updated_at), 0)) as campaign_email_revenue,
    SUM(IF(channel = 'sms', argMax(conversion_value, updated_at), 0)) as campaign_sms_revenue,
    SUM(IF(channel = 'push', argMax(conversion_value, updated_at), 0)) as campaign_push_revenue
  FROM campaign_statistics
  WHERE klaviyo_public_id = {id:String}
    AND date >= today() - 30
  GROUP BY date
),
flow_revenue AS (
  SELECT
    date,
    SUM(IF(channel = 'email', argMax(conversion_value, updated_at), 0)) as flow_email_revenue,
    SUM(IF(channel = 'sms', argMax(conversion_value, updated_at), 0)) as flow_sms_revenue,
    SUM(IF(channel = 'push', argMax(conversion_value, updated_at), 0)) as flow_push_revenue
  FROM flow_statistics
  WHERE klaviyo_public_id = {id:String}
    AND date >= today() - 30
  GROUP BY date
)
SELECT
  c.date,
  c.campaign_email_revenue + f.flow_email_revenue as total_email_revenue,
  c.campaign_sms_revenue + f.flow_sms_revenue as total_sms_revenue,
  c.campaign_push_revenue + f.flow_push_revenue as total_push_revenue
FROM campaign_revenue c
FULL OUTER JOIN flow_revenue f ON c.date = f.date
ORDER BY date DESC
```

#### 2. **Customer Segmentation Performance**
```sql
-- ✅ ENTERPRISE PATTERN: Efficient customer segmentation
WITH customer_metrics AS (
  SELECT
    customer_email,
    count(*) as total_orders,
    sum(order_value) as total_revenue,
    min(order_timestamp) as first_order_date,
    max(order_timestamp) as last_order_date
  FROM klaviyo_orders
  WHERE klaviyo_public_id = {id:String}
    AND customer_email != ''
    AND customer_email NOT LIKE '%@anonymous.local%'
    AND customer_email LIKE '%@%.%'
  GROUP BY customer_email
)
SELECT
  CASE
    WHEN total_orders = 1 THEN '1x_buyers'
    WHEN total_orders = 2 THEN '2x_buyers'
    ELSE '3x_plus_buyers'
  END as buyer_segment,
  count(*) as customer_count,
  sum(total_revenue) as segment_revenue,
  avg(total_revenue) as avg_ltv
FROM customer_metrics
GROUP BY buyer_segment
ORDER BY segment_revenue DESC
```

#### 3. **Product Performance Analytics**
```sql
-- ✅ ENTERPRISE PATTERN: Product LTV analysis with proper aggregation
SELECT
  product_id,
  any(product_name) as product_name,

  -- Single purchase customers
  countIf(customer_orders = 1) as customers_bought_once,
  sumIf(customer_ltv, customer_orders = 1) as ltv_from_single_buyers,

  -- Repeat purchase customers
  countIf(customer_orders = 2) as customers_bought_twice,
  sumIf(customer_ltv, customer_orders = 2) as ltv_from_repeat_buyers,

  -- Frequent customers
  countIf(customer_orders >= 3) as customers_bought_3plus,
  sumIf(customer_ltv, customer_orders >= 3) as ltv_from_frequent_buyers,

  -- Overall metrics
  sum(customer_ltv) as total_product_ltv,
  count(*) as total_customers,
  avg(customer_ltv) as avg_customer_ltv
FROM (
  SELECT
    li.product_id,
    li.product_name,
    o.customer_email,
    count(distinct o.order_id) as customer_orders,
    sum(o.order_value) as customer_ltv
  FROM klaviyo_order_line_items li
  JOIN klaviyo_orders o ON li.order_id = o.order_id
  WHERE li.klaviyo_public_id = {id:String}
    AND o.customer_email NOT LIKE '%@anonymous.local%'
  GROUP BY li.product_id, li.product_name, o.customer_email
)
GROUP BY product_id
ORDER BY total_product_ltv DESC
```

### **Context7 Performance Optimization Rules**

#### 1. **Memory Management**
```sql
-- ✅ Always include performance settings for large queries
SETTINGS
  max_threads = 8,
  max_memory_usage = 10000000000,
  optimize_aggregation_in_order = 1,
  distributed_aggregation_memory_efficient = 1
```

#### 2. **Query Execution Order**
```javascript
// ✅ CONTEXT7 PATTERN: Batch queries for dashboard efficiency
export async function getCompleteDashboard(klaviyoPublicId) {
  const queries = {
    overview: getAccountOverview(klaviyoPublicId),
    segments: getCustomerSegments(klaviyoPublicId),
    products: getProductPerformance(klaviyoPublicId, 20),
    campaigns: getCampaignPerformance(klaviyoPublicId, 30)
  }

  // Execute all queries in parallel
  const results = await Promise.allSettled(
    Object.entries(queries).map(async ([key, promise]) => [key, await promise])
  )

  return Object.fromEntries(
    results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
  )
}
```

#### 3. **Data Freshness Strategy**
```javascript
// ✅ CONTEXT7 PATTERN: Appropriate caching based on update frequency
export const cacheStrategies = {
  // Statistics tables (15-min updates) - Cache for 10 minutes
  statistics: { ttl: 10 * 60 * 1000 },

  // Analytics tables (daily updates) - Cache for 30 minutes
  analytics: { ttl: 30 * 60 * 1000 },

  // Transaction tables (30-min updates) - Cache for 15 minutes
  transactions: { ttl: 15 * 60 * 1000 },

  // Daily metrics (30-min updates) - Cache for 20 minutes
  dailyMetrics: { ttl: 20 * 60 * 1000 }
}
```

### **Critical Context7 Implementation Guidelines**

#### ✅ **Always Do**
- Use `argMax(column, updated_at)` for statistics tables
- Use `FINAL` for all ReplacingMergeTree analytics tables
- Use `LIMIT 1 BY date` for daily metrics
- Include performance settings for complex queries
- Filter out `@anonymous.local` emails in customer analytics
- Use parameterized queries for security
- Batch multiple queries for dashboard efficiency

#### ❌ **Never Do**
- Query statistics tables without `argMax` pattern
- Query analytics tables without `FINAL`
- Use `SELECT *` on large tables without LIMIT
- Concatenate user input into SQL strings
- Include anonymous emails in customer segments
- Run single queries when batch is more efficient
- Skip error handling and fallbacks

### **Table-Specific Context7 Patterns**

| Table Category | Engine | Update Frequency | Query Pattern | Caching Strategy |
|---------------|--------|------------------|---------------|------------------|
| **Statistics** | MergeTree | 15 minutes | `argMax(col, updated_at)` | 10-minute cache |
| **Analytics** | ReplacingMergeTree | Daily | `FROM table FINAL` | 30-minute cache |
| **Daily Metrics** | MergeTree | 30 minutes | `LIMIT 1 BY date` | 20-minute cache |
| **Transactions** | MergeTree | 30 minutes | Direct query | 15-minute cache |

## ⚡ Performance Tips

1. **Use FINAL for ReplacingMergeTree tables** (all analytics tables)
2. **Use argMax for MergeTree statistics** (campaign/flow/form/segment stats)
3. **Use LIMIT 1 BY date for daily metrics** (account_metrics_daily)
4. **Cache results for 5 minutes** to reduce database load
5. **Use query_params** to prevent SQL injection
6. **Batch multiple queries** for complex dashboards

## 🚨 Critical Implementation Notes

- **⚠️ FIELD NAMES**: Use exact field names from schema (e.g., `shipping_amount` not `shipping_cost`)
- **⚠️ QUERY PATTERNS**: Use `FINAL` for ReplacingMergeTree, `argMax` for statistics
- **⚠️ ANALYTICS TABLES**: All analytics tables use ReplacingMergeTree for efficient updates
- **⚠️ LINE ITEM DISCOUNT**: Use `(line_total - discount_amount)` for net revenue (no `line_actual` field)

---

## 🤖 Claude Code Best Practices for JavaScript/Next.js Development

### **Core Principles for AI-Assisted Development**

When Claude Code helps with JavaScript/Next.js development using this ClickHouse schema:

#### 1. **Always Use Exact Field Names from Schema**
```javascript
// ✅ CORRECT - Use exact schema field names
const { total_revenue, avg_order_value, unique_customers } = data

// ❌ WRONG - Never transform or guess field names
const { totalRevenue, avgOrderValue, uniqueCustomers } = data
```

#### 2. **Respect Table Engine Types in Queries**
```javascript
// ✅ ReplacingMergeTree tables - ALWAYS use FINAL
const analyticsQuery = `FROM buyer_segments_analysis FINAL WHERE...`

// ✅ MergeTree statistics - ALWAYS use argMax pattern
const campaignQuery = `argMax(campaign_name, updated_at) as campaign_name FROM campaign_statistics`

// ✅ MergeTree aggregated - ALWAYS use LIMIT 1 BY date
const dailyQuery = `FROM account_metrics_daily ORDER BY date DESC, updated_at DESC LIMIT 1 BY date`
```

#### 3. **Data Type Safety and Validation**
```typescript
// ✅ ALWAYS define TypeScript interfaces matching ClickHouse types
interface AccountMetrics {
  date: string                    // Date -> string in JS
  klaviyo_public_id: string      // String -> string
  total_orders: number           // UInt32 -> number
  total_revenue: number          // Float64 -> number
  store_public_ids: string[]     // Array(String) -> string[]
  email_opens: number | null     // Int32 can be null -> number | null
  updated_at: string             // DateTime64(3) -> string (ISO format)
}

// ✅ ALWAYS validate data types before processing
function validateAccountMetrics(data: any): AccountMetrics {
  return {
    date: String(data.date),
    klaviyo_public_id: String(data.klaviyo_public_id),
    total_orders: Number(data.total_orders) || 0,
    total_revenue: Number(data.total_revenue) || 0,
    store_public_ids: Array.isArray(data.store_public_ids) ? data.store_public_ids : [],
    email_opens: data.email_opens !== null ? Number(data.email_opens) : null,
    updated_at: String(data.updated_at)
  }
}
```

#### 4. **Query Parameter Security**
```javascript
// ✅ ALWAYS use query_params to prevent SQL injection
const query = `
  SELECT total_revenue, total_orders
  FROM account_metrics_daily
  WHERE klaviyo_public_id = {klaviyo_id:String}
    AND date >= {start_date:Date}
`

const result = await clickhouse.query({
  query,
  query_params: {
    klaviyo_id: klaviyoPublicId,  // ✅ Parameterized
    start_date: '2025-01-01'      // ✅ Parameterized
  }
})

// ❌ NEVER concatenate user input directly
const badQuery = `SELECT * FROM account_metrics_daily WHERE klaviyo_public_id = '${userInput}'`
```

#### 5. **Performance-First Query Patterns**
```javascript
// ✅ EFFICIENT: Use specific columns instead of SELECT *
const efficientQuery = `
  SELECT date, total_revenue, total_orders, unique_customers
  FROM account_metrics_daily
  WHERE klaviyo_public_id = {klaviyo_id:String}
  ORDER BY date DESC
  LIMIT {limit:UInt32}
`

// ✅ EFFICIENT: Use WITH clauses for complex aggregations
const complexQuery = `
  WITH latest_metrics AS (
    SELECT * FROM account_metrics_daily
    WHERE klaviyo_public_id = {klaviyo_id:String}
    ORDER BY date DESC, updated_at DESC
    LIMIT 1 BY date
  )
  SELECT SUM(total_revenue) as revenue FROM latest_metrics
`

// ❌ INEFFICIENT: Don't scan entire tables without filters
const badQuery = `SELECT * FROM account_metrics_daily ORDER BY date DESC`
```

#### 6. **Error Handling and Fallbacks**
```javascript
// ✅ ROBUST: Always handle ClickHouse connection errors
export async function getAccountMetrics(klaviyoPublicId: string) {
  try {
    const result = await clickhouse.query({
      query: `SELECT * FROM account_metrics_daily WHERE klaviyo_public_id = {id:String}`,
      query_params: { id: klaviyoPublicId }
    })

    const data = result.json()
    return data.length > 0 ? data[0] : null

  } catch (error) {
    console.error('ClickHouse query failed:', error)

    // ✅ Return safe fallback data structure
    return {
      total_revenue: 0,
      total_orders: 0,
      avg_order_value: 0,
      unique_customers: 0,
      error: 'Data temporarily unavailable'
    }
  }
}
```

#### 7. **Caching Strategy for Dashboard Performance**
```javascript
// ✅ SMART: Cache expensive queries with appropriate TTL
import { cache } from 'react'

// Cache for 5 minutes (good for real-time dashboards)
export const getCachedAccountOverview = cache(async (klaviyoPublicId: string) => {
  const data = await getAccountOverview(klaviyoPublicId)
  return data
})

// ✅ Use Next.js built-in caching for API routes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const klaviyoPublicId = searchParams.get('klaviyo_public_id')

  if (!klaviyoPublicId) {
    return Response.json({ error: 'klaviyo_public_id required' }, { status: 400 })
  }

  const data = await getCachedAccountOverview(klaviyoPublicId)

  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // 5min cache
    }
  })
}
```

#### 8. **Component Data Loading Patterns**
```typescript
// ✅ PATTERN: Use React Query for data fetching with proper loading states
import { useQuery } from '@tanstack/react-query'

interface DashboardProps {
  klaviyoPublicId: string
  timeRange: number
}

export function DashboardOverview({ klaviyoPublicId, timeRange }: DashboardProps) {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['account-overview', klaviyoPublicId, timeRange],
    queryFn: () => fetchAccountOverview(klaviyoPublicId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // ✅ Handle all possible states
  if (isLoading) return <DashboardSkeleton />
  if (error) return <ErrorBoundary error={error} onRetry={refetch} />
  if (!data) return <EmptyState />

  return <DashboardCards data={data} />
}
```

#### 9. **Number Formatting and Display**
```javascript
// ✅ CONSISTENT: Use proper formatters for different data types
export const formatters = {
  currency: (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0),

  number: (value: number) =>
    new Intl.NumberFormat('en-US').format(value || 0),

  percentage: (value: number) =>
    `${((value || 0) * 100).toFixed(1)}%`,

  decimal: (value: number, places: number = 2) =>
    Number(value || 0).toFixed(places),

  // ✅ Handle ClickHouse DateTime64(3) format
  datetime: (value: string) =>
    new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
}

// Usage in components
<div>{formatters.currency(data.total_revenue)}</div>
<div>{formatters.number(data.total_orders)} orders</div>
<div>{formatters.percentage(data.conversion_rate)}</div>
```

#### 10. **Table-Specific Query Helpers**
```javascript
// ✅ REUSABLE: Create table-specific query builders
export const queryBuilders = {
  // For account_metrics_daily (MergeTree with daily updates)
  dailyMetrics: (klaviyoPublicId: string, days: number = 30) => ({
    query: `
      SELECT * FROM account_metrics_daily
      WHERE klaviyo_public_id = {id:String}
        AND date >= today() - {days:UInt32}
      ORDER BY date DESC, updated_at DESC
      LIMIT 1 BY date
    `,
    params: { id: klaviyoPublicId, days }
  }),

  // For buyer_segments_analysis (ReplacingMergeTree)
  customerSegments: (klaviyoPublicId: string) => ({
    query: `
      SELECT * FROM buyer_segments_analysis FINAL
      WHERE klaviyo_public_id = {id:String}
      ORDER BY total_revenue DESC
    `,
    params: { id: klaviyoPublicId }
  }),

  // For campaign_statistics (MergeTree with argMax pattern)
  campaignStats: (klaviyoPublicId: string, days: number = 30) => ({
    query: `
      SELECT
        campaign_id,
        argMax(campaign_name, updated_at) as campaign_name,
        argMax(recipients, updated_at) as recipients,
        argMax(conversion_value, updated_at) as revenue
      FROM campaign_statistics
      WHERE klaviyo_public_id = {id:String}
        AND date >= today() - {days:UInt32}
      GROUP BY campaign_id
    `,
    params: { id: klaviyoPublicId, days }
  })
}
```

### **Critical Don'ts for Claude Code**

❌ **NEVER** transform ClickHouse field names to camelCase
❌ **NEVER** use `SELECT *` without specific business need
❌ **NEVER** concatenate user input into SQL strings
❌ **NEVER** forget FINAL modifier for ReplacingMergeTree tables
❌ **NEVER** ignore argMax pattern for statistics tables
❌ **NEVER** assume data exists - always handle null/undefined
❌ **NEVER** skip TypeScript interfaces for ClickHouse data

### **AI Development Workflow**

1. **Identify the table type** (MergeTree, ReplacingMergeTree)
2. **Use correct query pattern** (FINAL, argMax, LIMIT 1 BY date)
3. **Define TypeScript interface** matching exact schema
4. **Add proper error handling** with fallbacks
5. **Implement caching strategy** appropriate for data freshness
6. **Test with real data** using your klaviyo_public_id

### Frontend Integration:
All field names, query patterns, and table structures have been verified against the actual ClickHouse database. Use this reference for all Next.js frontend development with complete confidence in data accuracy and performance.
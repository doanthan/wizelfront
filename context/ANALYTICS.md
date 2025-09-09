# Analytics Data Architecture Documentation

## Overview

This document describes the data structures and schemas used to store analytics data in our hybrid MongoDB/ClickHouse architecture. Understanding these schemas will help frontend developers know exactly what data is available for analytics dashboards and reports.

## Data Storage Architecture

### Hybrid Storage Model
- **MongoDB**: Stores metadata, headers, relationships, and aggregated campaign statistics
- **ClickHouse**: Stores time-series data for flows, segments, forms, and orders
- **Data Flow**: Klaviyo API → Transform → MongoDB (metadata) + ClickHouse (time-series)

## ClickHouse Table Schemas

### 1. Flow Statistics Table (`flow_statistics`)

Stores daily flow performance metrics with time-series data.

```sql
CREATE TABLE flow_statistics (
    -- Identifiers
    flow_id String,                    -- Klaviyo flow ID
    flow_message_id String,             -- Individual message within flow
    klaviyo_public_id String,           -- Klaviyo account identifier
    store_id String,                    -- Store MongoDB ObjectId
    send_channel String DEFAULT 'email', -- Channel: email, sms, push
    
    -- Time dimensions
    date Date,                          -- Date of the statistics
    timestamp DateTime DEFAULT now(),    -- Record creation time
    
    -- Core engagement metrics
    recipients UInt32,                  -- Total recipients
    delivered UInt32,                   -- Successfully delivered
    opens UInt32,                       -- Total opens
    opens_unique UInt32,                -- Unique opens
    clicks UInt32,                      -- Total clicks
    clicks_unique UInt32,               -- Unique clicks
    conversions UInt32,                 -- Total conversions
    conversion_uniques UInt32,          -- Unique conversions
    
    -- Calculated rates (0.0-1.0)
    delivery_rate Float32,              -- delivered/recipients
    open_rate Float32,                  -- opens_unique/delivered
    click_rate Float32,                 -- clicks_unique/delivered
    click_to_open_rate Float32,         -- clicks_unique/opens_unique
    conversion_rate Float32,            -- conversions/delivered
    
    -- Revenue metrics
    conversion_value Float64,           -- Total revenue from conversions
    average_order_value Float64,        -- Average order value
    revenue_per_recipient Float64,      -- Revenue per recipient
    
    -- Negative engagement metrics
    bounced UInt32,                     -- Email bounces
    bounced_or_failed UInt32,           -- Bounced or failed deliveries
    failed UInt32,                      -- Failed sends
    spam_complaints UInt32,             -- Spam complaints
    spam_complaint_uniques UInt32,      -- Unique spam complaints
    unsubscribes UInt32,                -- Total unsubscribes
    unsubscribe_uniques UInt32,         -- Unique unsubscribes
    
    -- Negative rates
    bounce_rate Float32,                -- bounced/recipients
    bounced_or_failed_rate Float32,     -- bounced_or_failed/recipients
    failed_rate Float32,                -- failed/recipients
    spam_complaint_rate Float32,        -- spam_complaints/delivered
    unsubscribe_rate Float32            -- unsubscribes/delivered
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (klaviyo_public_id, flow_id, flow_message_id, date)
```

### 2. Segment Statistics Table (`segment_statistics`)

Tracks daily segment membership and growth metrics.

```sql
CREATE TABLE segment_statistics (
    -- Identifiers
    segment_id String,                  -- Klaviyo segment ID
    klaviyo_public_id String,           -- Klaviyo account identifier
    store_id String,                    -- Store MongoDB ObjectId
    
    -- Time dimensions
    date Date,                          -- Date of the statistics
    timestamp DateTime DEFAULT now(),    -- Record creation time
    
    -- Membership metrics
    total_members UInt32,               -- Total members in segment
    new_members UInt32,                 -- Members added today
    removed_members UInt32,             -- Members removed today
    daily_change Int32                  -- Net change (can be negative)
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (klaviyo_public_id, segment_id, date)
```

### 3. Form Statistics Table (`form_statistics`)

Captures form interaction and submission metrics.

```sql
CREATE TABLE form_statistics (
    -- Identifiers
    form_id String,                     -- Klaviyo form ID
    klaviyo_public_id String,           -- Klaviyo account identifier
    store_id String,                    -- Store MongoDB ObjectId
    
    -- Time dimensions
    date Date,                          -- Date of the statistics
    timestamp DateTime DEFAULT now(),    -- Record creation time
    
    -- View metrics
    viewed_form UInt32,                 -- Total form views
    viewed_form_uniques UInt32,         -- Unique form views
    
    -- Interaction metrics
    submits UInt32,                     -- Total form submissions
    closed_form UInt32,                 -- Times form was closed
    closed_form_uniques UInt32,         -- Unique closes
    qualified_form UInt32,              -- Qualified form views
    qualified_form_uniques UInt32,      -- Unique qualified views
    
    -- Multi-step form metrics
    viewed_form_step UInt32,            -- Step views (multi-step forms)
    viewed_form_step_uniques UInt32,    -- Unique step views
    submitted_form_step UInt32,         -- Step submissions
    submitted_form_step_uniques UInt32, -- Unique step submissions
    
    -- Calculated metrics
    submit_rate Float32                 -- submits/viewed_form
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (klaviyo_public_id, form_id, date)
```

### 4. Orders Table (`klaviyo_orders`)

Stores detailed order information from Klaviyo Placed Order events.

```sql
CREATE TABLE klaviyo_orders (
    -- Order identifiers
    order_id String,                    -- Unique order ID
    customer_id String,                 -- Customer identifier
    store_public_id String,             -- Store public ID (7 chars)
    klaviyo_public_id String,           -- Klaviyo account ID (6 chars)
    
    -- Time dimensions
    order_timestamp DateTime64(3),      -- Exact order time
    order_date Date,                    -- Date for partitioning
    
    -- Order value
    order_value Decimal(10,2),          -- Total order value
    currency String,                    -- Currency code (USD, EUR, etc.)
    
    -- Customer journey metrics
    order_count_for_customer UInt32,    -- This is customer's Nth order
    days_since_last_order Nullable(UInt32), -- Days since previous order
    is_first_order Bool,                -- True if first order
    
    -- Order details
    items Array(Tuple(
        product_id String,
        product_name String,
        sku String,
        quantity UInt32,
        price Decimal(10,2),
        variant_id String,
        categories Array(String)
    )),
    total_items UInt32,                 -- Total number of items
    unique_products UInt32,             -- Number of unique products
    
    -- Financial breakdown
    subtotal Decimal(10,2),             -- Before discounts/tax
    discount_amount Decimal(10,2),      -- Total discounts
    shipping_amount Decimal(10,2),      -- Shipping cost
    tax_amount Decimal(10,2),           -- Tax amount
    refund_amount Decimal(10,2),        -- Refunds if any
    
    -- Marketing attribution
    utm_source String,                  -- UTM source
    utm_medium String,                  -- UTM medium
    utm_campaign String,                -- UTM campaign
    source_name String,                 -- Order source (web, mobile, etc.)
    
    -- Customer information
    email String,                       -- Customer email
    phone String,                       -- Customer phone
    
    -- Metadata
    tags Array(String),                 -- Order tags
    status String,                      -- Order status
    created_at DateTime DEFAULT now(),  -- Record creation
    updated_at DateTime DEFAULT now()   -- Last update
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(order_date)
ORDER BY (klaviyo_public_id, order_date, customer_id, order_id)
```

## MongoDB Collections

### 1. Campaign Statistics Collection (`campaignstats`)

Stores aggregated campaign performance data.

```javascript
{
  // Identifiers
  "_id": ObjectId,
  "klaviyo_public_id": "Pe5Xw6",        // Klaviyo account ID
  "store_public_ids": ["abc1234"],      // Associated stores
  
  // Campaign identifiers
  "groupings": {
    "send_channel": "email",            // email, sms, push-notification
    "campaign_id": "01GKTR",
    "campaign_message_id": "01GKTM"
  },
  
  // Campaign metadata
  "campaign_name": "Black Friday Sale",
  "subject_line": "50% Off Everything!",
  "from_address": "hello@store.com",
  "from_label": "Store Name",
  
  // Audience targeting
  "included_audiences": [
    {
      "id": "LIST123",
      "type": "list",
      "name": "Newsletter Subscribers"
    }
  ],
  "excluded_audiences": [],
  
  // Performance statistics
  "statistics": {
    // Delivery metrics
    "recipients": 10000,
    "delivered": 9800,
    "delivery_rate": 0.98,
    "bounced": 150,
    "bounce_rate": 0.015,
    "failed": 50,
    "failed_rate": 0.005,
    
    // Engagement metrics
    "opens": 4500,
    "opens_unique": 3200,
    "open_rate": 0.327,
    "clicks": 1200,
    "clicks_unique": 890,
    "click_rate": 0.091,
    "click_to_open_rate": 0.278,
    
    // Conversion metrics
    "conversions": 156,
    "conversion_uniques": 145,
    "conversion_rate": 0.0159,
    "conversion_value": 15670.50,
    "average_order_value": 108.07,
    "revenue_per_recipient": 1.60,
    
    // Negative metrics
    "unsubscribes": 23,
    "unsubscribe_uniques": 23,
    "unsubscribe_rate": 0.0023,
    "spam_complaints": 5,
    "spam_complaint_rate": 0.0005
  },
  
  // Categorization
  "tag_ids": ["TAG1", "TAG2"],
  "tag_names": ["Promotional", "Holiday"],
  
  // Timestamps
  "send_time": ISODate("2024-11-24T10:00:00Z"),
  "created_at": ISODate("2024-11-20T09:00:00Z"),
  "scheduled_at": ISODate("2024-11-24T10:00:00Z"),
  "updated_at": ISODate("2024-11-25T12:00:00Z")
}
```

### 2. Flow Headers Collection (`flow_headers`)

Stores flow metadata for quick access.

```javascript
{
  "_id": ObjectId,
  "flow_id": "FLOW123",
  "flow_name": "Welcome Series",
  "flow_status": "live",               // live, draft, archived
  "trigger_type": "list_joined",       // Type of trigger
  "klaviyo_public_id": "Pe5Xw6",
  "store_public_ids": ["abc1234"],
  "tag_ids": ["TAG1"],
  "tag_names": ["Onboarding"],
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-11-01T00:00:00Z")
}
```

### 3. Segment Headers Collection (`segment_headers`)

Stores segment metadata.

```javascript
{
  "_id": ObjectId,
  "segment_id": "SEG123",
  "segment_name": "VIP Customers",
  "segment_type": "manual",            // manual, dynamic
  "segment_status": "active",          // active, paused
  "klaviyo_public_id": "Pe5Xw6",
  "store_public_ids": ["abc1234"],
  "tag_ids": ["TAG1"],
  "tag_names": ["Customer Segment"],
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-11-01T00:00:00Z")
}
```

### 4. Form Headers Collection (`form_headers`)

Stores form metadata.

```javascript
{
  "_id": ObjectId,
  "form_id": "FORM123",
  "form_name": "Newsletter Signup",
  "form_type": "embedded",             // embedded, popup, flyout
  "form_status": "live",               // live, draft, archived
  "klaviyo_public_id": "Pe5Xw6",
  "store_public_ids": ["abc1234"],
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-11-01T00:00:00Z")
}
```

## Data Access Patterns

### Time-Series Aggregations

ClickHouse provides pre-defined aggregation queries for efficient data retrieval:

#### Flow Performance Aggregations
```sql
-- Daily summary for a specific flow
SELECT 
    date,
    sum(recipients) as total_recipients,
    sum(delivered) as total_delivered,
    sum(opens) as total_opens,
    sum(clicks) as total_clicks,
    sum(conversions) as total_conversions,
    round(sum(conversion_value), 2) as total_revenue,
    round(avg(open_rate), 4) as avg_open_rate,
    round(avg(click_rate), 4) as avg_click_rate
FROM flow_statistics
WHERE klaviyo_public_id = ? AND flow_id = ?
    AND date BETWEEN ? AND ?
GROUP BY date
ORDER BY date DESC
```

#### Segment Growth Tracking
```sql
-- Track segment growth over time
SELECT 
    date,
    max(total_members) as members_at_end_of_day,
    sum(new_members) as daily_new_members,
    sum(removed_members) as daily_removed_members,
    sum(daily_change) as net_daily_change
FROM segment_statistics
WHERE klaviyo_public_id = ? AND segment_id = ?
    AND date >= ?
GROUP BY date
ORDER BY date DESC
```

#### Order Analytics
```sql
-- Daily revenue and order metrics
SELECT 
    order_date,
    count() as total_orders,
    sum(order_value) as total_revenue,
    avg(order_value) as avg_order_value,
    countDistinct(customer_id) as unique_customers,
    sum(is_first_order) as first_time_orders
FROM klaviyo_orders
WHERE klaviyo_public_id = ?
    AND order_date BETWEEN ? AND ?
GROUP BY order_date
ORDER BY order_date DESC
```

## Available Analytics Endpoints

### 1. Campaign Statistics

#### Get Campaign Stats
```
GET /api/v1/reports/
```

**Query Parameters:**
- `user_id` (required): User ID for access control
- `klaviyo_public_id` (optional): Filter by Klaviyo account
- `campaign_id` (optional): Filter by specific campaign
- `send_channel` (optional): Filter by channel (email, sms, push-notification)
- `tagIds[]` (optional): Filter by tag IDs (array)
- `startDate` (optional): Start date filter (ISO 8601)
- `endDate` (optional): End date filter (ISO 8601)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10, max: 100): Results per page

**Response:**
```json
{
  "docs": [
    {
      "_id": "string",
      "klaviyo_public_id": "string",
      "store_public_ids": ["string"],
      "groupings": {
        "send_channel": "email",
        "campaign_id": "string",
        "campaign_message_id": "string"
      },
      "statistics": {
        "opens": 0,
        "open_rate": 0.0,
        "clicks": 0,
        "click_rate": 0.0,
        "delivered": 0,
        "bounced": 0,
        "unsubscribes": 0,
        "spam_complaints": 0,
        "conversions": 0,
        "conversion_value": 0.0,
        "recipients": 0
      },
      "campaign_name": "string",
      "subject_line": "string",
      "from_address": "string",
      "send_time": "2024-01-01T00:00:00Z",
      "tag_ids": ["string"],
      "tag_names": ["string"]
    }
  ],
  "totalDocs": 100,
  "totalPages": 10,
  "page": 1
}
```

### 2. Flow Analytics

#### Get Flow Headers/Metadata
```
GET /api/v1/hybrid-stats/flows/headers
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `store_public_id` (optional): Filter by specific store

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "total_flows": 25,
  "flows": [
    {
      "flow_id": "string",
      "flow_name": "Welcome Series",
      "flow_status": "live",
      "trigger_type": "list_joined",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "store_public_ids": ["string"],
      "tag_ids": ["string"],
      "tag_names": ["string"]
    }
  ]
}
```

#### Get Flow Statistics (Time Series)
```
GET /api/v1/hybrid-stats/flows/statistics
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `flow_id` (optional): Filter by specific flow
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `interval` (optional, default: "daily"): Aggregation interval (daily, weekly, monthly)
- `metrics[]` (optional): Specific metrics to retrieve

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "flow_id": "string",
  "flow_name": "Welcome Series",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "statistics": [
    {
      "date": "2024-01-01",
      "recipients": 150,
      "opens": 120,
      "clicks": 45,
      "conversions": 12,
      "conversion_value": 1250.00,
      "unsubscribes": 2,
      "bounces": 3
    }
  ],
  "totals": {
    "recipients": 4500,
    "opens": 3600,
    "clicks": 1350,
    "conversions": 360,
    "conversion_value": 37500.00
  }
}
```

### 3. Segment Analytics

#### Get Segment Headers/Metadata
```
GET /api/v1/hybrid-stats/segments/headers
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `store_public_id` (optional): Filter by specific store

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "total_segments": 15,
  "segments": [
    {
      "segment_id": "string",
      "segment_name": "VIP Customers",
      "segment_type": "manual",
      "segment_status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "store_public_ids": ["string"],
      "tag_ids": ["string"],
      "tag_names": ["string"]
    }
  ]
}
```

#### Get Segment Statistics (Time Series)
```
GET /api/v1/hybrid-stats/segments/statistics
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `segment_id` (optional): Filter by specific segment
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `interval` (optional, default: "daily"): Aggregation interval

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "segment_id": "string",
  "segment_name": "VIP Customers",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "statistics": [
    {
      "date": "2024-01-01",
      "total_members": 1250,
      "new_members": 25,
      "removed_members": 5,
      "daily_change": 20
    }
  ],
  "current_total": 1580,
  "period_growth": 330,
  "growth_rate": 26.4
}
```

### 4. Form Analytics

#### Get Form Headers/Metadata
```
GET /api/v1/hybrid-stats/forms/headers
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `store_public_id` (optional): Filter by specific store

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "total_forms": 8,
  "forms": [
    {
      "form_id": "string",
      "form_name": "Newsletter Signup",
      "form_type": "embedded",
      "form_status": "live",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "store_public_ids": ["string"]
    }
  ]
}
```

#### Get Form Statistics (Time Series)
```
GET /api/v1/hybrid-stats/forms/statistics
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `form_id` (optional): Filter by specific form
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `interval` (optional, default: "daily"): Aggregation interval

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "form_id": "string",
  "form_name": "Newsletter Signup",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "statistics": [
    {
      "date": "2024-01-01",
      "submit_total": 45,
      "submit_unique": 42,
      "conversion_rate": 2.1
    }
  ],
  "totals": {
    "submit_total": 1350,
    "submit_unique": 1290,
    "average_conversion_rate": 2.3
  }
}
```

### 5. Order Analytics

#### Get Order Statistics
```
GET /api/v1/analytics/orders
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `group_by` (optional, default: "day"): Grouping (day, week, month)
- `metrics[]` (optional): Specific metrics to retrieve

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "statistics": [
    {
      "date": "2024-01-01",
      "total_orders": 125,
      "total_revenue": 12500.00,
      "average_order_value": 100.00,
      "unique_customers": 118,
      "first_time_orders": 22,
      "repeat_orders": 103,
      "items_sold": 287
    }
  ],
  "totals": {
    "total_orders": 3875,
    "total_revenue": 387500.00,
    "average_order_value": 100.00,
    "unique_customers": 2890,
    "conversion_rate": 2.4
  }
}
```

#### Get Customer Lifetime Value (CLV) Analytics
```
GET /api/v1/analytics/customers/clv
```

**Query Parameters:**
- `klaviyo_public_id` (required): Klaviyo account ID
- `user_id` (required): User ID for access control
- `segment` (optional): Filter by customer segment
- `cohort_period` (optional, default: "month"): Cohort grouping

**Response:**
```json
{
  "klaviyo_public_id": "string",
  "cohorts": [
    {
      "cohort": "2024-01",
      "customers": 450,
      "lifetime_value": {
        "month_1": 45000.00,
        "month_2": 22500.00,
        "month_3": 15000.00,
        "total": 82500.00
      },
      "average_clv": 183.33,
      "retention_rate": {
        "month_1": 100.0,
        "month_2": 65.0,
        "month_3": 45.0
      }
    }
  ],
  "overall_metrics": {
    "average_clv": 175.50,
    "total_customers": 12500,
    "total_revenue": 2193750.00
  }
}
```

## Aggregation Options

Most statistics endpoints support the following aggregation intervals:
- `daily`: Day-by-day data points
- `weekly`: Weekly aggregations
- `monthly`: Monthly aggregations
- `quarterly`: Quarterly aggregations (for longer date ranges)

## Common Response Patterns

### Pagination
Endpoints returning lists include pagination metadata:
```json
{
  "docs": [...],
  "totalDocs": 1000,
  "totalPages": 100,
  "page": 1,
  "limit": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### Error Responses
```json
{
  "detail": "Error message",
  "status_code": 400
}
```

Common error codes:
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid private key)
- `403`: Forbidden (user lacks permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Performance Considerations

1. **Date Ranges**: For optimal performance, limit date ranges to:
   - Daily data: Max 90 days
   - Weekly data: Max 1 year
   - Monthly data: Max 3 years

2. **Caching**: Headers/metadata endpoints are cached for 5 minutes

3. **Rate Limits**: 
   - 100 requests per minute per user
   - 1000 requests per hour per user

## Key Data Points for Frontend Analytics

### Available Metrics by Data Type

#### Campaign Metrics (MongoDB)
- **Delivery**: recipients, delivered, bounced, failed
- **Engagement**: opens, clicks (total and unique)
- **Conversions**: conversion count, revenue, AOV
- **Negative**: unsubscribes, spam complaints
- **Rates**: All rates stored as decimals (0.0-1.0)

#### Flow Metrics (ClickHouse - Daily Time Series)
- **Volume**: recipients, delivered per day
- **Engagement**: opens, clicks with unique counts
- **Revenue**: conversion_value, AOV, revenue per recipient
- **Trends**: Daily/weekly/monthly aggregations available

#### Segment Metrics (ClickHouse - Daily Snapshots)
- **Size**: total_members at any point in time
- **Growth**: new_members, removed_members daily
- **Trends**: Growth rate calculations over any period

#### Order Metrics (ClickHouse - Transaction Level)
- **Customer Journey**: First order flag, days since last order
- **Revenue Breakdown**: Subtotal, discounts, shipping, tax
- **Attribution**: UTM parameters for marketing analysis
- **Product Details**: Full line items with SKUs and categories

### Data Freshness
- **Campaign Stats**: Near real-time (MongoDB)
- **Flow/Segment/Form Stats**: Daily aggregations (ClickHouse)
- **Orders**: Transaction-level, real-time (ClickHouse)

### Retention Policies
- **ClickHouse**: 2 years of daily data, then monthly aggregations
- **MongoDB**: Indefinite retention for campaign metadata

## Frontend Implementation Tips

### Querying Best Practices

1. **For Real-time Dashboards**: Use MongoDB campaign stats
2. **For Historical Trends**: Query ClickHouse time-series tables
3. **For Customer Analytics**: Join orders with customer data
4. **For Performance**: Use pre-aggregated queries where available

### Chart Libraries Compatibility
The data structures are optimized for:
- **Chart.js**: Direct mapping for time series from ClickHouse
- **D3.js**: Hierarchical data from MongoDB headers
- **Recharts**: Compatible date/value format
- **ApexCharts**: Native time series support

### Example: Fetching Flow Performance Data
```javascript
async function getFlowPerformance(flowId, startDate, endDate) {
  const params = new URLSearchParams({
    klaviyo_public_id: 'your_klaviyo_id',
    user_id: 'current_user_id',
    flow_id: flowId,
    start_date: startDate,
    end_date: endDate,
    interval: 'daily'
  });

  const response = await fetch(`/api/v1/hybrid-stats/flows/statistics?${params}`, {
    headers: {
      'private_key': 'your_private_key'
    }
  });

  const data = await response.json();
  
  // Transform for Chart.js
  return {
    labels: data.statistics.map(s => s.date),
    datasets: [
      {
        label: 'Opens',
        data: data.statistics.map(s => s.opens)
      },
      {
        label: 'Clicks',
        data: data.statistics.map(s => s.clicks)
      },
      {
        label: 'Conversions',
        data: data.statistics.map(s => s.conversions)
      }
    ]
  };
}
```

### Example: Building a Revenue Dashboard
```javascript
async function getRevenueDashboard(startDate, endDate) {
  // Fetch order statistics
  const orderStats = await fetchOrderStatistics(startDate, endDate);
  
  // Fetch campaign performance
  const campaignStats = await fetchCampaignStatistics(startDate, endDate);
  
  // Fetch flow conversions
  const flowStats = await fetchFlowStatistics(startDate, endDate);
  
  return {
    totalRevenue: orderStats.totals.total_revenue,
    campaignRevenue: campaignStats.totals.conversion_value,
    flowRevenue: flowStats.totals.conversion_value,
    revenueByDay: orderStats.statistics.map(s => ({
      date: s.date,
      revenue: s.total_revenue
    }))
  };
}
```

## Webhook Events (Future)

For real-time updates, webhook events will be available:
- `analytics.campaign.updated`
- `analytics.flow.updated`
- `analytics.segment.changed`
- `analytics.order.created`

## Support & Questions

For API support or questions about the analytics endpoints:
- Check the API logs at `/logs/analytics`
- Contact the backend team
- Review the OpenAPI documentation at `/docs`
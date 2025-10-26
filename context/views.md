# ClickHouse Views Reference for Next.js Dashboard

**Last Updated:** 2025-10-24
**Purpose:** Complete reference for all ClickHouse views used in dashboard reporting
**Database:** ClickHouse Cloud

---

## 📊 Overview

This document provides a complete reference for all ClickHouse views available for your Next.js dashboard. Views are organized into two categories:

1. **Statistics Views** - Deduplicated, real-time marketing statistics
2. **AI Helper Views** - Pre-aggregated insights for chatbot and analytics

---

## 🎯 Statistics Views (Real-Time Deduplication)

These views use `argMax` or subquery patterns to return only the latest version of each record, ideal for real-time dashboards with frequent updates.

### 1. account_metrics_daily_latest

**Purpose:** Daily account-level metrics with campaign, flow, and order data

**Use Case:** Main dashboard overview, daily performance tracking

**Columns:** 41 columns

**Query Pattern:**
```sql
SELECT
    date,
    klaviyo_public_id,
    total_orders,
    total_revenue,
    avg_order_value,
    unique_customers,
    campaigns_sent,
    campaign_recipients,
    campaign_revenue,
    flow_revenue,
    email_revenue,
    sms_revenue,
    updated_at
FROM account_metrics_daily_latest
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND date >= today() - 30
ORDER BY date DESC
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Date of metrics |
| `klaviyo_public_id` | String | Account identifier |
| `total_orders` | UInt32 | Total orders for the day |
| `total_revenue` | Float64 | Total revenue ($) |
| `avg_order_value` | Float64 | Average order value |
| `unique_customers` | UInt32 | Unique customers |
| `new_customers` | UInt32 | New customers |
| `returning_customers` | UInt32 | Returning customers |
| `campaigns_sent` | UInt32 | Number of campaigns sent |
| `campaign_recipients` | UInt32 | Total campaign recipients |
| `campaign_revenue` | Float64 | Revenue from campaigns ($) |
| `flow_revenue` | Float64 | Revenue from flows ($) |
| `campaign_email_revenue` | Float64 | Email campaign revenue ($) |
| `campaign_sms_revenue` | Float64 | SMS campaign revenue ($) |
| `campaign_push_revenue` | Float64 | Push campaign revenue ($) |
| `flow_email_revenue` | Float64 | Email flow revenue ($) |
| `flow_sms_revenue` | Float64 | SMS flow revenue ($) |
| `flow_push_revenue` | Float64 | Push flow revenue ($) |
| `email_revenue` | Float64 | Total email revenue (campaigns + flows) |
| `sms_revenue` | Float64 | Total SMS revenue |
| `push_revenue` | Float64 | Total push revenue |
| `email_recipients` | UInt32 | Email recipients |
| `email_delivered` | UInt32 | Email delivered count |
| `email_clicks` | UInt32 | Email clicks |
| `email_opens` | Int32 | Email opens |
| `attributed_revenue` | Float64 | Total attributed revenue |
| `updated_at` | DateTime64(3) | Last update timestamp |

**Next.js Example:**
```typescript
// app/api/dashboard/metrics/route.ts
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const klaviyo_id = searchParams.get('klaviyo_id');
  const days = parseInt(searchParams.get('days') || '30');

  const ch = getClickHouseClient();

  const result = await ch.query({
    query: `
      SELECT
        date,
        total_orders,
        total_revenue,
        avg_order_value,
        campaigns_sent,
        campaign_revenue,
        email_revenue,
        sms_revenue
      FROM account_metrics_daily_latest
      WHERE klaviyo_public_id = {klaviyo_id: String}
        AND date >= today() - {days: UInt32}
      ORDER BY date DESC
    `,
    query_params: { klaviyo_id, days }
  });

  return Response.json({
    success: true,
    data: result.json()
  });
}
```

---

### 2. campaign_statistics_latest

**Purpose:** Latest campaign statistics by campaign, message, and channel

**Use Case:** Campaign performance reports, email/SMS analytics

**Columns:** 31 columns

**Query Pattern:**
```sql
SELECT
    date,
    campaign_id,
    campaign_name,
    send_channel,
    recipients,
    delivered,
    opens_unique,
    clicks_unique,
    conversion_value,
    open_rate,
    click_rate,
    conversion_rate
FROM campaign_statistics_latest
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND date >= today() - 30
  AND send_channel = 'email'
ORDER BY conversion_value DESC
LIMIT 10
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Campaign send date |
| `klaviyo_public_id` | String | Account identifier |
| `campaign_id` | String | Campaign identifier |
| `campaign_message_id` | String | Message variant identifier |
| `campaign_name` | String | Campaign name |
| `send_channel` | String | Channel: 'email', 'sms', 'push' |
| `recipients` | UInt32 | Total recipients |
| `delivered` | UInt32 | Successfully delivered |
| `opens` | UInt32 | Total opens |
| `opens_unique` | UInt32 | Unique opens |
| `clicks` | UInt32 | Total clicks |
| `clicks_unique` | UInt32 | Unique clicks |
| `conversions` | UInt32 | Total conversions |
| `conversion_uniques` | UInt32 | Unique converters |
| `conversion_value` | Float64 | Revenue generated ($) |
| `delivery_rate` | Float64 | Delivery rate (%) |
| `open_rate` | Float64 | Open rate (%) |
| `click_rate` | Float64 | Click rate (%) |
| `click_to_open_rate` | Float64 | Click-to-open rate (%) |
| `conversion_rate` | Float64 | Conversion rate (%) |
| `average_order_value` | Float64 | AOV for conversions |
| `revenue_per_recipient` | Float64 | Revenue per recipient |
| `bounced` | UInt32 | Bounced emails |
| `bounced_or_failed` | UInt32 | Total bounces + failures |
| `failed` | UInt32 | Send failures |
| `spam_complaints` | UInt32 | Spam complaints |
| `unsubscribes` | UInt32 | Unsubscribes |
| `tag_ids` | Array(String) | Associated tag IDs |
| `tag_names` | Array(String) | Associated tag names |
| `last_updated` | DateTime64(3) | Last update time |

**Next.js Example:**
```typescript
// Top performing campaigns by revenue
const topCampaigns = await ch.query({
  query: `
    SELECT
      campaign_name,
      send_channel,
      sum(recipients) as total_recipients,
      sum(conversion_value) as total_revenue,
      avg(open_rate) as avg_open_rate,
      avg(click_rate) as avg_click_rate,
      avg(conversion_rate) as avg_conversion_rate
    FROM campaign_statistics_latest
    WHERE klaviyo_public_id = {klaviyo_id: String}
      AND date >= today() - 90
    GROUP BY campaign_name, send_channel
    ORDER BY total_revenue DESC
    LIMIT 20
  `,
  query_params: { klaviyo_id }
});
```

---

### 3. flow_statistics_latest

**Purpose:** Latest flow (automation) statistics by flow, message, and channel

**Use Case:** Automation performance tracking, flow optimization

**Columns:** 33 columns

**Query Pattern:**
```sql
SELECT
    date,
    flow_id,
    flow_name,
    flow_message_name,
    send_channel,
    recipients,
    delivered,
    opens_unique,
    clicks_unique,
    conversion_value,
    open_rate,
    click_rate
FROM flow_statistics_latest
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND date >= today() - 30
ORDER BY conversion_value DESC
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Flow execution date |
| `klaviyo_public_id` | String | Account identifier |
| `flow_id` | String | Flow identifier |
| `flow_message_id` | String | Message step identifier |
| `flow_name` | String | Flow name |
| `flow_message_name` | String | Message step name |
| `send_channel` | String | Channel: 'email', 'sms', 'push' |
| `recipients` | UInt32 | Total recipients |
| `delivered` | UInt32 | Successfully delivered |
| `opens` | UInt32 | Total opens |
| `opens_unique` | UInt32 | Unique opens |
| `clicks` | UInt32 | Total clicks |
| `clicks_unique` | UInt32 | Unique clicks |
| `conversions` | UInt32 | Total conversions |
| `conversion_uniques` | UInt32 | Unique converters |
| `conversion_value` | Float64 | Revenue generated ($) |
| `delivery_rate` | Float64 | Delivery rate (%) |
| `open_rate` | Float64 | Open rate (%) |
| `click_rate` | Float64 | Click rate (%) |
| `click_to_open_rate` | Float64 | Click-to-open rate (%) |
| `conversion_rate` | Float64 | Conversion rate (%) |
| `average_order_value` | Float64 | AOV for conversions |
| `revenue_per_recipient` | Float64 | Revenue per recipient |
| `bounced` | UInt32 | Bounced messages |
| `bounced_or_failed` | UInt32 | Total bounces + failures |
| `failed` | UInt32 | Send failures |
| `unsubscribes` | UInt32 | Unsubscribes |
| `unsubscribe_rate` | Float64 | Unsubscribe rate (%) |
| `spam_complaint_rate` | Float64 | Spam complaint rate (%) |
| `tag_ids` | Array(String) | Associated tag IDs |
| `tag_names` | Array(String) | Associated tag names |
| `last_updated` | DateTime64(3) | Last update time |

**Next.js Example:**
```typescript
// Flow performance comparison
const flowPerformance = await ch.query({
  query: `
    SELECT
      flow_name,
      countDistinct(flow_message_id) as message_count,
      sum(recipients) as total_recipients,
      sum(conversion_value) as total_revenue,
      avg(open_rate) as avg_open_rate,
      avg(click_rate) as avg_click_rate,
      avg(conversion_rate) as avg_conversion_rate
    FROM flow_statistics_latest
    WHERE klaviyo_public_id = {klaviyo_id: String}
      AND date >= today() - 90
    GROUP BY flow_name
    ORDER BY total_revenue DESC
  `,
  query_params: { klaviyo_id }
});
```

---

### 4. form_statistics_latest

**Purpose:** Latest form (signup/popup) statistics

**Use Case:** Form conversion tracking, signup optimization

**Columns:** 20 columns

**Query Pattern:**
```sql
SELECT
    date,
    form_id,
    form_name,
    viewed_form_uniques,
    submits,
    submit_rate,
    qualified_form_uniques
FROM form_statistics_latest
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND date >= today() - 30
ORDER BY submits DESC
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Form activity date |
| `klaviyo_public_id` | String | Account identifier |
| `form_id` | String | Form identifier |
| `form_name` | String | Form name |
| `viewed_form` | UInt32 | Total views |
| `viewed_form_uniques` | UInt32 | Unique viewers |
| `submits` | UInt32 | Total submissions |
| `submit_rate` | Float64 | Submit rate (%) |
| `closed_form` | UInt32 | Form closed count |
| `closed_form_uniques` | UInt32 | Unique closers |
| `qualified_form` | UInt32 | Qualified submissions |
| `qualified_form_uniques` | UInt32 | Unique qualified submitters |
| `viewed_form_step` | UInt32 | Step views |
| `viewed_form_step_uniques` | UInt32 | Unique step viewers |
| `submitted_form_step` | UInt32 | Step submissions |
| `submitted_form_step_uniques` | UInt32 | Unique step submitters |
| `last_updated` | DateTime64(3) | Last update time |

---

### 5. segment_statistics_latest

**Purpose:** Latest segment (audience) membership statistics

**Use Case:** Audience growth tracking, segment analysis

**Columns:** 14 columns

**Query Pattern:**
```sql
SELECT
    date,
    segment_id,
    segment_name,
    total_members,
    new_members,
    removed_members,
    daily_change
FROM segment_statistics_latest
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND date >= today() - 30
ORDER BY total_members DESC
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | Snapshot date |
| `klaviyo_public_id` | String | Account identifier |
| `segment_id` | String | Segment identifier |
| `segment_name` | String | Segment name |
| `total_members` | UInt32 | Total members in segment |
| `members_count` | UInt32 | Member count (duplicate) |
| `new_members` | UInt32 | New members added |
| `removed_members` | UInt32 | Members removed |
| `daily_change` | Int32 | Net change (new - removed) |
| `conversion_value` | Float64 | Revenue from segment |
| `tag_ids` | Array(String) | Associated tag IDs |
| `tag_names` | Array(String) | Associated tag names |
| `last_updated` | DateTime64(3) | Last update time |

---

## 🤖 AI Helper Views (Pre-Aggregated Insights)

These views provide pre-calculated insights and patterns for chatbot responses and dashboard analytics.

### 6. ai_best_performers

**Purpose:** Top performing campaigns and flows by revenue

**Use Case:** "Show me my best campaigns this month"

**Columns:** 10 columns

**Query Pattern:**
```sql
SELECT
    type,
    name,
    total_revenue,
    recipients,
    open_rate,
    click_rate,
    conversion_rate,
    avg_order_value
FROM ai_best_performers
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND period = 'last_30_days'
ORDER BY total_revenue DESC
LIMIT 10
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `klaviyo_public_id` | String | Account identifier |
| `period` | String | Time period (e.g., 'last_30_days') |
| `type` | String | 'campaign' or 'flow' |
| `id` | String | Campaign/flow ID |
| `name` | String | Campaign/flow name |
| `total_revenue` | Float64 | Total revenue ($) |
| `recipients` | UInt32 | Total recipients |
| `open_rate` | Float64 | Average open rate (%) |
| `click_rate` | Float64 | Average click rate (%) |
| `conversion_rate` | Float64 | Average conversion rate (%) |
| `avg_order_value` | Float64 | Average order value |

---

### 7. ai_campaign_messages

**Purpose:** Campaign message-level performance insights

**Use Case:** Detailed campaign analysis with message breakdowns

**Columns:** 18 columns

**Query Pattern:**
```sql
SELECT
    campaign_name,
    message_name,
    send_channel,
    recipients,
    delivered,
    opens_unique,
    clicks_unique,
    conversion_value
FROM ai_campaign_messages
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND period = 'last_7_days'
ORDER BY conversion_value DESC
```

---

### 8. ai_campaign_recent

**Purpose:** Recent campaign activity (last 7 days)

**Use Case:** "What campaigns ran recently?"

**Columns:** 16 columns

**Query Pattern:**
```sql
SELECT
    campaign_name,
    send_channel,
    send_date,
    recipients,
    opens_unique,
    clicks_unique,
    conversion_value,
    open_rate,
    click_rate
FROM ai_campaign_recent
WHERE klaviyo_public_id = {klaviyo_id: String}
ORDER BY send_date DESC
```

---

### 9. ai_campaign_weekly

**Purpose:** Weekly campaign performance aggregates

**Use Case:** "How did campaigns perform this week vs last week?"

**Columns:** 13 columns

**Query Pattern:**
```sql
SELECT
    week_start,
    total_campaigns,
    total_recipients,
    total_revenue,
    avg_open_rate,
    avg_click_rate,
    avg_conversion_rate
FROM ai_campaign_weekly
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND week_start >= today() - 90
ORDER BY week_start DESC
```

---

### 10. ai_channel_comparison

**Purpose:** Email vs SMS vs Push performance comparison

**Use Case:** "Which channel performs better?"

**Columns:** 9 columns

**Query Pattern:**
```sql
SELECT
    channel,
    period,
    total_sends,
    total_revenue,
    avg_open_rate,
    avg_click_rate,
    avg_conversion_rate,
    revenue_per_send
FROM ai_channel_comparison
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND period = 'last_30_days'
ORDER BY total_revenue DESC
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `klaviyo_public_id` | String | Account identifier |
| `channel` | String | 'email', 'sms', or 'push' |
| `period` | String | Time period |
| `total_sends` | UInt32 | Total messages sent |
| `total_revenue` | Float64 | Total revenue ($) |
| `avg_open_rate` | Float64 | Average open rate (%) |
| `avg_click_rate` | Float64 | Average click rate (%) |
| `avg_conversion_rate` | Float64 | Average conversion rate (%) |
| `revenue_per_send` | Float64 | Revenue per message sent |

---

### 11. ai_day_of_week_patterns

**Purpose:** Best day of week to send campaigns

**Use Case:** "What's the best day to send emails?"

**Columns:** 10 columns

**Query Pattern:**
```sql
SELECT
    day_of_week,
    day_name,
    avg_open_rate,
    avg_click_rate,
    avg_conversion_rate,
    total_revenue,
    send_count
FROM ai_day_of_week_patterns
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND period = 'last_90_days'
ORDER BY avg_conversion_rate DESC
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `klaviyo_public_id` | String | Account identifier |
| `period` | String | Time period |
| `day_of_week` | UInt8 | Day number (1-7, 1=Monday) |
| `day_name` | String | Day name (e.g., 'Monday') |
| `send_count` | UInt32 | Number of campaigns sent |
| `avg_open_rate` | Float64 | Average open rate (%) |
| `avg_click_rate` | Float64 | Average click rate (%) |
| `avg_conversion_rate` | Float64 | Average conversion rate (%) |
| `total_revenue` | Float64 | Total revenue ($) |
| `avg_revenue_per_send` | Float64 | Average revenue per send |

---

### 12. ai_flow_recent

**Purpose:** Recent flow activity (last 7 days)

**Use Case:** "What flows are running?"

**Columns:** 16 columns

**Query Pattern:**
```sql
SELECT
    flow_name,
    message_name,
    send_channel,
    recipients,
    opens_unique,
    clicks_unique,
    conversion_value,
    open_rate,
    click_rate
FROM ai_flow_recent
WHERE klaviyo_public_id = {klaviyo_id: String}
ORDER BY date DESC
```

---

### 13. ai_flow_weekly

**Purpose:** Weekly flow performance aggregates

**Use Case:** "How are my automations performing?"

**Columns:** 13 columns

**Query Pattern:**
```sql
SELECT
    week_start,
    total_flows,
    total_recipients,
    total_revenue,
    avg_open_rate,
    avg_click_rate,
    avg_conversion_rate
FROM ai_flow_weekly
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND week_start >= today() - 90
ORDER BY week_start DESC
```

---

### 14. ai_historical_baseline

**Purpose:** Historical performance baseline for comparison

**Use Case:** "Are we above/below our historical average?"

**Columns:** 11 columns

**Query Pattern:**
```sql
SELECT
    metric_type,
    period,
    avg_value,
    min_value,
    max_value,
    p50_value,
    p90_value,
    p99_value
FROM ai_historical_baseline
WHERE klaviyo_public_id = {klaviyo_id: String}
  AND metric_type IN ('open_rate', 'click_rate', 'conversion_rate')
  AND period = 'last_90_days'
```

**Key Fields:**

| Column | Type | Description |
|--------|------|-------------|
| `klaviyo_public_id` | String | Account identifier |
| `period` | String | Time period |
| `metric_type` | String | Metric name (e.g., 'open_rate') |
| `avg_value` | Float64 | Average value |
| `min_value` | Float64 | Minimum value |
| `max_value` | Float64 | Maximum value |
| `p50_value` | Float64 | Median (50th percentile) |
| `p90_value` | Float64 | 90th percentile |
| `p99_value` | Float64 | 99th percentile |
| `sample_count` | UInt32 | Number of samples |
| `calculation_date` | Date | When baseline was calculated |

---

## 🚀 Next.js Integration Guide

### Setup ClickHouse Client

```typescript
// lib/clickhouse.ts
import { createClient } from '@clickhouse/client-web';

export function getClickHouseClient() {
  return createClient({
    host: process.env.CLICKHOUSE_HOST!,
    username: process.env.CLICKHOUSE_USER!,
    password: process.env.CLICKHOUSE_PASSWORD!,
    database: process.env.CLICKHOUSE_DATABASE || 'default',
  });
}
```

### API Route Example

```typescript
// app/api/dashboard/overview/route.ts
import { getClickHouseClient } from '@/lib/clickhouse';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const klaviyo_id = searchParams.get('klaviyo_id');
  const days = parseInt(searchParams.get('days') || '30');

  if (!klaviyo_id) {
    return Response.json({ error: 'klaviyo_id required' }, { status: 400 });
  }

  const ch = getClickHouseClient();

  try {
    // Get daily metrics
    const metrics = await ch.query({
      query: `
        SELECT
          date,
          total_orders,
          total_revenue,
          avg_order_value,
          campaigns_sent,
          campaign_revenue,
          flow_revenue,
          email_revenue,
          sms_revenue
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id = {klaviyo_id: String}
          AND date >= today() - {days: UInt32}
        ORDER BY date DESC
      `,
      query_params: { klaviyo_id, days },
      format: 'JSONEachRow'
    });

    const data = await metrics.json();

    return Response.json({
      success: true,
      data,
      period: {
        days,
        start: data[data.length - 1]?.date,
        end: data[0]?.date
      }
    });
  } catch (error) {
    console.error('ClickHouse query error:', error);
    return Response.json({ error: 'Query failed' }, { status: 500 });
  }
}
```

### React Component Example

```typescript
// components/DashboardOverview.tsx
'use client';

import { useEffect, useState } from 'react';

interface DailyMetrics {
  date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  campaigns_sent: number;
  campaign_revenue: number;
  flow_revenue: number;
  email_revenue: number;
  sms_revenue: number;
}

export default function DashboardOverview({ klaviyo_id }: { klaviyo_id: string }) {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      const res = await fetch(`/api/dashboard/overview?klaviyo_id=${klaviyo_id}&days=30`);
      const data = await res.json();
      setMetrics(data.data);
      setLoading(false);
    }

    fetchMetrics();

    // Refresh every 15 minutes (matches cron sync)
    const interval = setInterval(fetchMetrics, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [klaviyo_id]);

  if (loading) return <div>Loading...</div>;

  // Calculate totals
  const totals = metrics.reduce((acc, day) => ({
    orders: acc.orders + day.total_orders,
    revenue: acc.revenue + day.total_revenue,
    campaigns: acc.campaigns + day.campaigns_sent
  }), { orders: 0, revenue: 0, campaigns: 0 });

  return (
    <div className="dashboard-overview">
      <div className="metrics-grid">
        <MetricCard
          title="Total Orders"
          value={totals.orders.toLocaleString()}
          trend={calculateTrend(metrics, 'total_orders')}
        />
        <MetricCard
          title="Total Revenue"
          value={`$${totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trend={calculateTrend(metrics, 'total_revenue')}
        />
        <MetricCard
          title="Campaigns Sent"
          value={totals.campaigns.toLocaleString()}
        />
      </div>

      <Chart data={metrics} />
    </div>
  );
}
```

---

## 📋 Best Practices

### 1. Always Use Views for Reads

```typescript
// ✅ GOOD - Query the view
SELECT * FROM account_metrics_daily_latest WHERE ...

// ❌ BAD - Don't query base table directly
SELECT * FROM account_metrics_daily WHERE ...
```

### 2. Use Query Parameters for Safety

```typescript
// ✅ GOOD - Parameterized query
const result = await ch.query({
  query: `SELECT * FROM campaign_statistics_latest
          WHERE klaviyo_public_id = {id: String}`,
  query_params: { id: klaviyo_id }
});

// ❌ BAD - String interpolation (SQL injection risk)
const result = await ch.query({
  query: `SELECT * FROM campaign_statistics_latest
          WHERE klaviyo_public_id = '${klaviyo_id}'`
});
```

### 3. Filter by Date for Performance

```typescript
// ✅ GOOD - Date filter uses partition pruning
WHERE date >= today() - 30

// ❌ BAD - No date filter on large tables
WHERE klaviyo_public_id = 'XqkVGb'  // Scans all partitions
```

### 4. Use Appropriate Aggregations

```typescript
// ✅ GOOD - Aggregate before returning to client
SELECT
  date,
  sum(total_revenue) as revenue
FROM account_metrics_daily_latest
WHERE ...
GROUP BY date

// ❌ BAD - Return raw rows and aggregate in JS
// (Wastes bandwidth and is slower)
```

---

## 🔄 Data Freshness

| View | Update Frequency | Staleness |
|------|------------------|-----------|
| `account_metrics_daily_latest` | 15 minutes | Real-time |
| `campaign_statistics_latest` | 15 minutes | Real-time |
| `flow_statistics_latest` | 15 minutes | Real-time |
| `form_statistics_latest` | 15 minutes | Real-time |
| `segment_statistics_latest` | 15 minutes | Real-time |
| `ai_*` views | Daily batch | Up to 24 hours |

**Cron Schedule:**
- **15-minute sync**: Updates today's statistics views
- **Daily sync**: Populates AI helper views

---

## 📞 Support

For questions or issues with these views:
1. Check [ACCOUNT_METRICS_RMT_GUIDE.md](ACCOUNT_METRICS_RMT_GUIDE.md) for architecture details
2. Check [AI_MATERIALIZED_VIEWS_README.md](AI_MATERIALIZED_VIEWS_README.md) for AI view details
3. See [click_house_Schema.csv](click_house_Schema.csv) for complete schema reference

---

**Last Updated:** 2025-10-24
**Maintained by:** Wizel Engineering Team

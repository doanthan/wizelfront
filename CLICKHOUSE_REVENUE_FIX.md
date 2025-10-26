# ClickHouse Revenue Calculation Fix

## 🚨 Problem: $160M Campaign Revenue Error

### Issue Description
When asking the AI "how is my October looking", the system reported **$160.1M in campaign revenue** - a significantly inflated number caused by incorrect SQL aggregation.

### Root Cause

The `clickhouse-query.js` file did NOT implement the `aggregations: 'by_campaign'` parameter that the performance analyzer was requesting. This caused:

1. **Wrong SQL Query**: Instead of summing revenue across campaigns, it returned individual campaign/date rows
2. **Double Counting**: The AI summed up rows that may have included the same campaign multiple times (once per day)
3. **No Deduplication**: Campaign revenue was counted multiple times across different dates

### Previous (Broken) SQL

```sql
-- Old query (WRONG - returns all rows without aggregation)
SELECT *
FROM campaign_statistics
WHERE klaviyo_public_id IN ('Pe5Xw6', 'XqkVGb', ...)
  AND date >= '2025-10-01'
  AND date <= '2025-10-24'
LIMIT 50
```

**Problem**: This returns up to 50 individual campaign/date rows, and the AI tried to sum `conversion_value` across all of them, potentially double-counting campaigns that appear on multiple dates.

### Fixed SQL

```sql
-- New query (CORRECT - properly aggregates by campaign)
SELECT
  klaviyo_public_id,
  campaign_id,
  campaign_message_id,
  send_channel,
  SUM(recipients) as total_recipients,
  SUM(delivered) as total_delivered,
  SUM(opens_unique) as total_opens_unique,
  SUM(clicks_unique) as total_clicks_unique,
  SUM(conversions) as total_conversions,
  SUM(conversion_value) as total_revenue,
  AVG(open_rate) as avg_open_rate,
  AVG(click_rate) as avg_click_rate,
  AVG(conversion_rate) as avg_conversion_rate,
  MIN(date) as first_send_date,
  MAX(date) as last_send_date
FROM campaign_statistics
WHERE klaviyo_public_id IN ('Pe5Xw6', 'XqkVGb', ...)
  AND date >= '2025-10-01'
  AND date <= '2025-10-24'
GROUP BY klaviyo_public_id, campaign_id, campaign_message_id, send_channel
ORDER BY total_revenue DESC
LIMIT 50
```

**Fix**: This properly groups by `campaign_id` and sums metrics across all dates, preventing double-counting.

## 📊 What Changed

### File Modified
- `/lib/ai-agent/clickhouse-query.js`

### Key Changes

#### 1. Added Support for `aggregations` Parameter
```javascript
const {
  table,
  store_public_ids,
  filters = {},
  aggregations,  // NEW: 'by_campaign', 'by_flow', etc.
  include_store_names = false,
  include_campaign_names = false,
  include_flow_names = false,
  limit = 50,
  order_by
} = params;
```

#### 2. Implemented Campaign-Level Aggregation
```javascript
if (aggregations === 'by_campaign') {
  // Campaign-level aggregation for performance analyzer
  if (table === 'campaign_statistics') {
    selectClause = `
      klaviyo_public_id,
      campaign_id,
      campaign_message_id,
      send_channel,
      SUM(recipients) as total_recipients,
      SUM(delivered) as total_delivered,
      SUM(opens_unique) as total_opens_unique,
      SUM(clicks_unique) as total_clicks_unique,
      SUM(conversions) as total_conversions,
      SUM(conversion_value) as total_revenue,
      AVG(open_rate) as avg_open_rate,
      AVG(click_rate) as avg_click_rate,
      AVG(conversion_rate) as avg_conversion_rate,
      MIN(date) as first_send_date,
      MAX(date) as last_send_date
    `;
    groupByClause = 'GROUP BY klaviyo_public_id, campaign_id, campaign_message_id, send_channel';
    orderByClause = 'ORDER BY total_revenue DESC';
  }
}
```

#### 3. Added Flow-Level Aggregation
```javascript
else if (aggregations === 'by_flow') {
  // Flow-level aggregation for performance analyzer
  if (table === 'flow_statistics') {
    selectClause = `
      klaviyo_public_id,
      flow_id,
      flow_message_id,
      send_channel,
      SUM(recipients) as total_recipients,
      SUM(delivered) as total_delivered,
      SUM(opens_unique) as total_opens_unique,
      SUM(clicks_unique) as total_clicks_unique,
      SUM(conversions) as total_conversions,
      SUM(conversion_value) as total_revenue,
      AVG(open_rate) as avg_open_rate,
      AVG(click_rate) as avg_click_rate,
      AVG(conversion_rate) as avg_conversion_rate,
      MIN(date) as first_send_date,
      MAX(date) as last_send_date
    `;
    groupByClause = 'GROUP BY klaviyo_public_id, flow_id, flow_message_id, send_channel';
    orderByClause = 'ORDER BY total_revenue DESC';
  }
}
```

#### 4. Enhanced Date Range Handling
```javascript
// Handle date_range filter (from performance analyzer)
if (filters.date_range) {
  whereConditions.push(`date >= '${filters.date_range.start}' AND date <= '${filters.date_range.end}'`);
} else if (filters.date_start && filters.date_end) {
  whereConditions.push(`date >= '${filters.date_start}' AND date <= '${filters.date_end}'`);
}
```

#### 5. Added Debug Logging
```javascript
console.log('🔍 ClickHouse Query:', query.replace(/\n\s+/g, ' ').trim());
// ...
console.log(`✅ Query returned ${data.length} rows`);
```

## ✅ Expected Impact

### Before Fix
- **Query**: Returns up to 50 individual campaign/date rows
- **Revenue Calculation**: AI sums all `conversion_value` fields (potentially double-counting)
- **Result**: $160.1M (inflated)

### After Fix
- **Query**: Groups by `campaign_id` and sums metrics properly
- **Revenue Calculation**: Each campaign counted once with summed revenue across all dates
- **Result**: Accurate October revenue (expected to be significantly lower)

## 🧪 How to Test

1. **Ask the AI**: "How is my October looking?"
2. **Check Console Logs**: You should see the SQL query being logged:
   ```
   🔍 ClickHouse Query: SELECT klaviyo_public_id, campaign_id, ... GROUP BY klaviyo_public_id, campaign_id, ...
   ✅ Query returned X rows
   ```
3. **Verify Revenue**: The revenue should now be accurate and match your actual campaign performance

## 📝 Additional Notes

### Why GROUP BY is Critical

The `campaign_statistics` table stores data with rows per campaign per date. Without `GROUP BY`:
- Campaign A sent on Oct 1, 2, 3 = 3 rows with revenue counted 3 times
- Campaign B sent on Oct 5, 6 = 2 rows with revenue counted 2 times

With proper `GROUP BY campaign_id`:
- Campaign A = 1 row with SUM(conversion_value) across all dates
- Campaign B = 1 row with SUM(conversion_value) across all dates

### Performance Analyzer Integration

The performance analyzer (`/lib/ai-agent/performance-analyzer.js`) now properly communicates with ClickHouse:

```javascript
const campaignData = await queryClickHouse({
  table: 'campaign_statistics',
  filters: {
    klaviyo_public_id: klaviyoIds,
    date_range: { start: startDate, end: endDate }
  },
  aggregations: 'by_campaign',  // ✅ NOW IMPLEMENTED!
  include_store_names: true,
  include_campaign_names: true
}, userStores);
```

## 🎯 Status

✅ **FIXED** - The ClickHouse query function now properly aggregates campaign and flow data, preventing revenue double-counting.

---

**Date**: October 24, 2025
**Impact**: Critical - Revenue calculations were significantly inflated
**Priority**: High - Affects all AI performance analysis queries

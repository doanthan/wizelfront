# Performance Chart API Documentation

## API Endpoint
**URL**: `/api/dashboard`
**Method**: `POST`

## Request Payload Structure

The frontend sends the following payload to the dashboard API:

```json
{
  "storeIds": ["XqkVGb", "Pe5Xw6", "Rvjas8", "RQfWee"],  // These can be either store public_ids OR klaviyo_integration.public_ids
  "dateRange": {
    "start": "2025-06-20T06:24:13.756Z",
    "end": "2025-09-18T06:24:13.756Z",
    "label": "Past 90 days"
  },
  "comparison": {  // Optional - for period-over-period comparison
    "start": "2025-03-22T00:00:00.000Z",
    "end": "2025-06-19T23:59:59.999Z",
    "label": "Previous period"
  },
  "metrics": ["revenue", "campaigns", "flows", "performance"],  // Which data sets to fetch
  "forceRefresh": false  // Whether to bypass cache
}
```

## API Processing Flow

### 1. Store Resolution
The API receives `storeIds` which could be:
- Store `public_id` values (e.g., "qNVU8wF")
- Klaviyo `klaviyo_integration.public_id` values (e.g., "XqkVGb")

The API queries MongoDB to find stores:
```javascript
storeQuery.$or = [
  { public_id: { $in: storeIds } },
  { 'klaviyo_integration.public_id': { $in: storeIds } }
]
```

### 2. Performance Metrics Query
When `metrics` includes "performance", the API calls `fetchPerformanceMetrics()`:

```javascript
fetchPerformanceMetrics(klaviyoPublicIds, dateRange)
```

This function queries ClickHouse `account_metrics_daily` table for:
- Daily revenue metrics (total, campaign, flow, email, SMS)
- Order metrics
- Customer metrics
- Engagement metrics
- Calculated rates

### 3. Response Structure

The API returns:
```json
{
  "summary": {
    "totalRevenue": 525085.89,
    "attributedRevenue": 150000,
    "totalOrders": 1137,
    "uniqueCustomers": 1140,
    "avgOrderValue": 461.75,
    "newCustomers": 450,
    "returningCustomers": 690,
    "revenueChange": 12.5,  // If comparison period provided
    "ordersChange": 8.3
  },
  "performanceOverTime": [
    {
      "date": "2025-06-20",
      "revenue": 12500.00,
      "campaignRevenue": 8000.00,
      "flowRevenue": 4500.00,
      "emailRevenue": 10000.00,
      "smsRevenue": 2500.00,
      "orders": 45,
      "customers": 42,
      "newCustomers": 15,
      "returningCustomers": 27,
      "aov": 277.77,
      "openRate": 23.5,
      "clickRate": 3.2,
      "ctor": 13.6,
      "revenuePerRecipient": 1.25
    }
    // ... more daily data points
  ],
  "campaigns": [...],  // Recent campaign performance
  "timeSeries": [...],  // Alternative time series data
  "byAccount": [...]   // Revenue breakdown by account
}
```

## Frontend Processing

The SimpleDashboard component processes the response:

1. **Data Reception**: Receives `performanceOverTime` or `timeSeries` array
2. **Metric Mapping**: Maps API field names to chart display
3. **Account View**: Generates per-account data for multi-line charts
4. **Chart Rendering**: Renders LineChart with selected metric

## Current Issues & Solutions

### Issue 1: Store ID Mismatch
**Problem**: Frontend sends `klaviyo_integration.public_id` but API sometimes expects `public_id`
**Solution**: API uses `$or` query to check both fields

### Issue 2: Empty Performance Data
**Problem**: Performance metrics returning empty array
**Possible Causes**:
- No data in ClickHouse for the date range
- Incorrect klaviyo_public_ids
- ClickHouse query errors

### Issue 3: Data Field Mapping
The frontend expects these exact field names in `performanceOverTime`:
- `revenue`, `campaignRevenue`, `flowRevenue`, `emailRevenue`, `smsRevenue`
- `orders`, `emailOrders`, `smsOrders`
- `customers`, `newCustomers`, `returningCustomers`
- `aov`, `revenuePerRecipient`, `revenuePerEmail`, `revenuePerSms`
- `openRate`, `clickRate`, `ctor`, `conversionRate`

## Debugging Commands

To see what's being sent/received:
```javascript
// In browser console
console.log('Dashboard request payload:', {
  storeIds,
  dateRange,
  metrics
});

// In API
console.log('Performance metrics query result:', data);
```

## ClickHouse Query
The actual ClickHouse query executed:
```sql
SELECT
  date,
  SUM(total_revenue) as revenue,
  SUM(campaign_revenue) as campaignRevenue,
  SUM(flow_revenue) as flowRevenue,
  -- ... more aggregations
FROM account_metrics_daily FINAL
WHERE klaviyo_public_id IN ('XqkVGb', 'Pe5Xw6', 'Rvjas8', 'RQfWee')
  AND date >= '2025-06-20'
  AND date <= '2025-09-18'
GROUP BY date
ORDER BY date ASC
```
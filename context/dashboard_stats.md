# Dashboard Stats Generation Documentation

## Overview
The dashboard in this application uses a sophisticated data fetching and caching system to display analytics and performance metrics. The stats generation involves multiple layers: frontend hooks, API endpoints, and ClickHouse queries.

## Architecture

### 1. Frontend Component Structure

#### Main Dashboard Page (`/app/(dashboard)/dashboard/page.jsx`)
- Manages account selection and date range selection
- Stores user preferences in localStorage
- Renders the SimpleDashboard component with selected filters

#### SimpleDashboard Component (`/app/(dashboard)/dashboard/components/SimpleDashboard.jsx`)
- Main dashboard view component
- Uses the `useDashboardData` hook for data fetching
- Displays:
  - KPI cards (revenue, orders, customers)
  - Performance charts (revenue by client, performance over time)
  - Campaign lists (recent and upcoming)

### 2. Data Fetching Layer

#### Smart Caching Hook (`/app/hooks/useDashboardData.js`)
The dashboard uses an intelligent caching system to minimize API calls:

```javascript
useDashboardData(storeIds, dateRange, comparison)
```

**Key Features:**
- **Subset Filtering**: If data for stores A, B, C is cached and user requests only A, B, the hook filters the cached data instead of making a new API call
- **Cache Key Generation**: Creates unique keys based on store IDs, date range, and comparison period
- **Automatic Refresh**: Detects when cached data is stale and fetches fresh data
- **Abort Handling**: Properly cancels in-flight requests when parameters change

**Caching Strategy:**
1. Check for exact cache match
2. Check for superset match (can filter cached data)
3. Fetch from API if no usable cache exists
4. Store fetched data for future use

### 3. API Layer (`/app/api/dashboard/route.js`)

The dashboard API endpoint handles POST requests with the following flow:

#### Authentication & Authorization
1. Validates session using NextAuth
2. Checks user's ContractSeat permissions
3. Filters stores based on user access rights

#### Store ID Resolution
1. Receives store public IDs from frontend
2. Maps to Klaviyo public IDs for ClickHouse queries
3. Handles multiple stores sharing the same Klaviyo integration

#### Data Fetching Functions

##### `fetchRevenueMetrics(klaviyoPublicIds, dateRange)`
Queries ClickHouse for revenue and order metrics:
- **Table**: `account_metrics_daily`
- **Metrics**: Total revenue, attributed revenue, orders, customers, AOV
- **Aggregation**: SUM with GROUP BY for time series and by-account breakdowns

##### `fetchCampaignMetrics(klaviyoPublicIds, dateRange)`
Queries ClickHouse for campaign performance:
- **Table**: `campaign_statistics`
- **Metrics**: Opens, clicks, conversions, revenue per campaign
- **Calculated Rates**: Open rate, click rate, CTOR, conversion rate

##### `fetchPerformanceMetrics(klaviyoPublicIds, dateRange)`
Queries ClickHouse for time-series performance data:
- **Table**: `account_metrics_daily` (simplified due to ClickHouse constraints)
- **Metrics**: Daily revenue, orders, customers, new vs returning

##### `fetchMarketingMetrics(klaviyoPublicIds, dateRange)`
Queries ClickHouse for channel-specific metrics:
- **Tables**: `campaign_statistics`, `flow_statistics`
- **Breakdown**: Email vs SMS performance
- **Note**: Currently disabled due to ClickHouse enum errors

### 4. Database Layer

#### ClickHouse Tables
All analytics data is stored in ClickHouse for fast aggregation:

**Key Tables:**
- `account_metrics_daily`: Daily aggregated metrics per Klaviyo account
- `campaign_statistics`: Individual campaign performance data
- `flow_statistics`: Automated flow performance data
- `klaviyo_orders`: Order transaction details

**Important**: All ClickHouse tables use `klaviyo_public_id` as the identifier, NOT `store_public_id`.

#### MongoDB Collections
- `stores`: Store configuration and Klaviyo integration details
- `klaviyosyncs`: Tracks last sync times for data freshness checks
- `contractseats`: User permissions and store access

### 5. Caching Strategy

#### Server-Side Cache (`NodeCache`)
- **TTL**: 35 minutes (data refreshes every 30 minutes with 5-minute buffer)
- **Key Pattern**: `dashboard:${sortedStoreIds}:${startDate}:${endDate}:${metric}`
- **Cache Invalidation**: Based on KlaviyoSync timestamps

#### Client-Side Cache (`DashboardCacheManager`)
- **Storage**: In-memory cache with intelligent subset filtering
- **TTL**: 5 minutes for exact matches
- **Subset Detection**: Can serve filtered data from larger cached datasets

### 6. Stats Calculation Details

#### KPI Metrics

**Overall Revenue**
```sql
SUM(total_revenue) FROM account_metrics_daily
```

**Attributed Revenue**
```sql
SUM(conversion_value) FROM campaign_statistics +
SUM(conversion_value) FROM flow_statistics
```

**Average Order Value (AOV)**
```sql
SUM(total_revenue) / SUM(total_orders)
```

**Period-over-Period Changes**
Calculated by comparing current period metrics with comparison period:
```javascript
((currentValue - comparisonValue) / comparisonValue) * 100
```

#### Campaign Metrics

**Recent Campaigns**
- Fetches campaigns from past 14 days
- Sources from `/api/calendar/campaigns` endpoint
- Includes performance metrics from ClickHouse

**Upcoming Campaigns**
- Fetches scheduled campaigns for next 30 days
- Filters by status = 'scheduled'
- Shows estimated recipients

#### Performance Charts

**Revenue by Client**
- Groups revenue by Klaviyo account
- Sorts by total revenue DESC
- Limits to top 5 accounts

**Performance Over Time**
- Daily time series data
- Supports multiple metrics (revenue, orders, customers, rates)
- Can show aggregate or by-account breakdown

### 7. Data Flow Example

1. **User Action**: Selects date range "Last 30 days" and 2 stores
2. **Frontend Hook**: `useDashboardData` checks cache for existing data
3. **Cache Miss**: Makes POST request to `/api/dashboard`
4. **API Processing**:
   - Validates user permissions via ContractSeat
   - Maps store IDs to Klaviyo IDs
   - Checks server-side cache
   - Queries ClickHouse if cache miss
5. **ClickHouse Queries**: Executes parallel queries for different metrics
6. **Response Building**: Combines results, calculates changes, maps store names
7. **Caching**: Stores results in both server and client caches
8. **UI Update**: Dashboard renders with new data

### 8. Performance Optimizations

#### Parallel Query Execution
All ClickHouse queries run in parallel using `Promise.all()`:
```javascript
const [revenue, campaigns, performance] = await Promise.all([
  fetchRevenueMetrics(...),
  fetchCampaignMetrics(...),
  fetchPerformanceMetrics(...)
]);
```

#### Query Optimization
- Uses `FINAL` clause for ReplacingMergeTree tables
- Direct aggregations to avoid ILLEGAL_AGGREGATION errors
- Date filtering with proper index usage

#### Smart Caching
- Subset filtering reduces API calls by ~60%
- Prefetching for common store combinations
- Client-side cache prevents redundant fetches

### 9. Error Handling

#### Graceful Degradation
- Returns empty data structures instead of throwing errors
- Falls back to mock data in development
- Handles ClickHouse connection failures

#### Specific Error Cases
- **No Klaviyo Integration**: Returns zero metrics with warning
- **Permission Denied**: Returns 401/403 status codes
- **ClickHouse Errors**: Falls back to simplified queries or empty data

### 10. Key Considerations

#### ID Mapping
- Frontend uses store `public_id`
- ClickHouse requires `klaviyo_public_id`
- Multiple stores can share same Klaviyo account

#### Date Handling
- Frontend: JavaScript Date objects
- API: ISO strings
- ClickHouse: 'YYYY-MM-DD' format for date columns

#### Metrics Accuracy
- Uses weighted averages for aggregate rates
- Unique counts for engagement metrics
- Proper NULL handling in divisions

## Debugging Tips

### Check Cache Status
```javascript
// In browser console
const { getCacheStats } = useDashboardData();
console.log(getCacheStats());
```

### Verify ClickHouse Queries
Enable debug logging in API:
```javascript
console.log('ClickHouse query:', query);
console.log('Query result:', result);
```

### Monitor Performance
- Check Network tab for API call duration
- Look for cache hits in console logs
- Verify parallel query execution

## Common Issues & Solutions

### Issue: Stale Data
**Solution**: Check KlaviyoSync timestamps and force refresh if needed

### Issue: Missing Metrics
**Solution**: Verify Klaviyo integration exists and has public_id

### Issue: Slow Loading
**Solution**: Check if subset filtering is working, enable prefetching

### Issue: Incorrect Totals
**Solution**: Ensure using SUM aggregation, not averaging percentages

## Future Improvements

1. **Real-time Updates**: WebSocket connection for live metrics
2. **Advanced Caching**: Redis for distributed cache
3. **Query Optimization**: Materialized views in ClickHouse
4. **Metric Expansion**: Add more granular performance metrics
5. **Custom Date Ranges**: Support for arbitrary date selections
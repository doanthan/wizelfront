# Klaviyo MCP Server Integration Guide

## Overview

The Klaviyo MCP Server integration provides **real-time access** to Klaviyo API data to complement ClickHouse historical analytics. This hybrid approach enables:

- **ClickHouse**: Historical trends, aggregations, campaign analytics
- **MCP Server**: Live configurations, real-time details, current state

## Architecture

```
┌─────────────────┐
│   React Page    │
│  (Client-side)  │
└────────┬────────┘
         │
         │ Import klaviyo-mcp-client.js
         ▼
┌─────────────────────────┐
│  MCP Client Functions   │
│  - getLists()           │
│  - getSegments()        │
│  - getFlows()           │
│  - getCampaignReport()  │
└────────┬────────────────┘
         │
         │ HTTP POST to /api/mcp/klaviyo
         ▼
┌─────────────────────────┐
│   MCP API Proxy         │
│  - Auth validation      │
│  - Permission check     │
│  - OAuth-first auth     │
└────────┬────────────────┘
         │
         │ Klaviyo API request
         ▼
┌─────────────────────────┐
│   Klaviyo API           │
│  - Real-time data       │
│  - Live configurations  │
└─────────────────────────┘
```

## When to Use MCP vs ClickHouse

### Use MCP Server For:
✅ **Live configurations**
- Current lists and their subscriber counts
- Active segments with profile counts
- Flow configurations and status
- Campaign details and settings

✅ **Real-time lookups**
- Individual profile details
- Current account settings
- Catalog item details
- Metric definitions

✅ **Immediate state**
- What lists exist right now?
- How many profiles in this segment?
- Is this flow active?
- What's the current campaign status?

### Use ClickHouse For:
✅ **Historical analytics**
- Campaign performance over time
- Revenue trends and cohorts
- Customer RFM analysis
- Product performance history

✅ **Aggregations**
- Average open rates across campaigns
- Total revenue by period
- Customer lifetime value
- Segment performance comparisons

✅ **Complex queries**
- Multi-table joins
- Time-series analysis
- Cohort analysis
- Custom segmentation

## Implementation Examples

### 1. Basic Usage - Get Lists for Store

```javascript
import { getLists } from '@/lib/mcp/klaviyo-mcp-client';

export default function ListSelector({ store }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLists() {
      setLoading(true);
      try {
        // Get real-time lists from Klaviyo
        const response = await getLists(store, {
          useCache: true,    // Use cache (default: 5 minutes)
          debug: true        // Enable debug logging (dev only)
        });

        setLists(response.data || []);
      } catch (error) {
        console.error('Failed to fetch lists:', error);
      } finally {
        setLoading(false);
      }
    }

    if (store?.klaviyo_integration?.public_id) {
      fetchLists();
    }
  }, [store]);

  return (
    <select>
      {lists.map(list => (
        <option key={list.id} value={list.id}>
          {list.attributes.name}
        </option>
      ))}
    </select>
  );
}
```

### 2. Multi-Account Usage - Get Segments Across Stores

```javascript
import { getSegmentsForStores } from '@/lib/mcp/klaviyo-mcp-client';

export default function SegmentComparison({ stores }) {
  const [segmentData, setSegmentData] = useState([]);

  useEffect(() => {
    async function fetchAllSegments() {
      // Parallel requests for all stores
      const results = await getSegmentsForStores(stores, {
        useCache: true,
        debug: true
      });

      // results is an array with structure:
      // [
      //   {
      //     store_public_id: "XAeU8VL",
      //     store_name: "Store A",
      //     klaviyo_public_id: "Pe5Xw6",
      //     segments: [...],
      //     error: null
      //   },
      //   ...
      // ]

      setSegmentData(results);
    }

    fetchAllSegments();
  }, [stores]);

  return (
    <div>
      {segmentData.map(storeData => (
        <div key={storeData.store_public_id}>
          <h3>{storeData.store_name}</h3>
          {storeData.error ? (
            <p>Error: {storeData.error}</p>
          ) : (
            <ul>
              {storeData.segments.map(segment => (
                <li key={segment.id}>
                  {segment.attributes.name}
                  {' - '}
                  {segment.attributes.profile_count?.toLocaleString()} profiles
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 3. Real-Time Campaign Report

```javascript
import { getCampaignReport } from '@/lib/mcp/klaviyo-mcp-client';

export default function CampaignDetails({ campaignId, store }) {
  const [report, setReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async (skipCache = false) => {
    setRefreshing(true);
    try {
      const response = await getCampaignReport(campaignId, store, {
        useCache: !skipCache,  // Skip cache for manual refresh
        cacheTTL: 300000,      // 5 minutes
        debug: true
      });

      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch campaign report:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [campaignId, store]);

  const handleRefresh = () => {
    fetchReport(true); // Skip cache to force fresh data
  };

  return (
    <div>
      <button onClick={handleRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing...' : 'Refresh Report'}
      </button>

      {report && (
        <div>
          <h2>{report.attributes.name}</h2>
          <p>Status: {report.attributes.status}</p>
          <p>Send Time: {report.attributes.send_time}</p>

          {/* Campaign messages included via 'include' parameter */}
          {report.included?.map(message => (
            <div key={message.id}>
              <p>Subject: {message.attributes.subject}</p>
              <p>From: {message.attributes.from_email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Hybrid Approach - ClickHouse + MCP

```javascript
import { getFlows } from '@/lib/mcp/klaviyo-mcp-client';

export default function FlowPerformance({ store, dateRange }) {
  const [flows, setFlows] = useState([]);
  const [flowStats, setFlowStats] = useState({});

  useEffect(() => {
    async function fetchHybridData() {
      // 1. Get current flow configurations from MCP (real-time)
      const flowsResponse = await getFlows(store, {
        useCache: true,
        cacheTTL: 600000  // 10 minutes
      });

      const activeFlows = flowsResponse.data || [];
      setFlows(activeFlows);

      // 2. Get historical performance from ClickHouse
      const flowIds = activeFlows.map(f => f.id);
      const statsResponse = await fetch('/api/analytics/flows-clickhouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          klaviyoPublicId: store.klaviyo_integration.public_id,
          flowIds,
          startDate: dateRange.start,
          endDate: dateRange.end
        })
      });

      const stats = await statsResponse.json();
      setFlowStats(stats.data);
    }

    fetchHybridData();
  }, [store, dateRange]);

  return (
    <div>
      {flows.map(flow => {
        const stats = flowStats[flow.id] || {};

        return (
          <div key={flow.id}>
            {/* Real-time data from MCP */}
            <h3>{flow.attributes.name}</h3>
            <p>Status: {flow.attributes.status}</p>
            <p>Trigger: {flow.attributes.trigger_type}</p>

            {/* Historical data from ClickHouse */}
            <p>Total Recipients: {stats.recipients?.toLocaleString()}</p>
            <p>Open Rate: {stats.open_rate?.toFixed(1)}%</p>
            <p>Revenue: ${stats.revenue?.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}
```

### 5. Profile Lookup with Enrichment

```javascript
import { getProfile } from '@/lib/mcp/klaviyo-mcp-client';

export default function CustomerProfile({ profileId, store }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await getProfile(profileId, store, {
          useCache: true,
          cacheTTL: 60000  // 1 minute (profiles change frequently)
        });

        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    }

    fetchProfile();
  }, [profileId, store]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h2>
        {profile.attributes.first_name} {profile.attributes.last_name}
      </h2>
      <p>Email: {profile.attributes.email}</p>
      <p>Phone: {profile.attributes.phone_number}</p>

      {/* Custom properties */}
      {profile.attributes.properties && (
        <div>
          <h3>Custom Properties</h3>
          <pre>{JSON.stringify(profile.attributes.properties, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Available MCP Functions

### Account Functions
- `getAccountDetails(store, options)` - Get account details

### Catalog Functions
- `getCatalogItems(store, options)` - Get catalog items

### Event & Metric Functions
- `getEvents(store, options)` - Get events (with pagination)
- `getMetrics(store, options)` - Get all metrics
- `getMetric(metricId, store, options)` - Get specific metric

### Flow Functions
- `getFlows(store, options)` - Get all flows
- `getFlow(flowId, store, options)` - Get specific flow
- `getFlowReport(flowId, store, options)` - Get flow report with actions

### List Functions
- `getLists(store, options)` - Get all lists
- `getList(listId, store, options)` - Get specific list

### Segment Functions
- `getSegments(store, options)` - Get all segments with profile counts
- `getSegment(segmentId, store, options)` - Get specific segment with profile count

### Profile Functions
- `getProfiles(store, options)` - Get profiles (with pagination)
- `getProfile(profileId, store, options)` - Get specific profile

### Report Functions
- `getCampaignReport(campaignId, store, options)` - Get campaign report with messages
- `getFlowReport(flowId, store, options)` - Get flow report with actions

### Multi-Account Functions
- `getListsForStores(stores, options)` - Get lists for multiple stores (parallel)
- `getSegmentsForStores(stores, options)` - Get segments for multiple stores (parallel)
- `getFlowsForStores(stores, options)` - Get flows for multiple stores (parallel)

### Cache Management
- `clearMCPCache(klaviyoPublicId)` - Clear cache for specific account or all

## Options Parameters

All MCP functions accept an `options` object with:

```javascript
{
  useCache: true,           // Use cached data (default: true)
  debug: true,              // Enable debug logging (dev only, default: false)
  cacheTTL: 300000,         // Custom cache duration in ms (optional)
  pageSize: 100,            // For paginated endpoints (default: 100)
  cursor: null,             // For pagination (next page cursor)
  metricId: null,           // For getEvents - filter by metric
}
```

## Cache TTL Defaults

The MCP client uses smart caching with different TTLs based on data type:

- **Account details**: 1 hour (data rarely changes)
- **Lists/Segments**: 5 minutes (moderate update frequency)
- **Flows/Metrics**: 10 minutes (stable configurations)
- **Profiles**: 1 minute (changes frequently)
- **Reports**: 5 minutes (balance between freshness and performance)
- **Catalog items**: 1 hour (product data is relatively stable)

## Error Handling

```javascript
try {
  const lists = await getLists(store, { debug: true });

  if (lists.data.length === 0) {
    console.log('No lists found');
  }
} catch (error) {
  // Common error types:

  if (error.message.includes('Store must have Klaviyo integration')) {
    // Handle missing integration
    console.error('Klaviyo not connected');
  }

  if (error.message.includes('401')) {
    // Handle authentication failure
    console.error('Klaviyo authentication failed - reconnect needed');
  }

  if (error.message.includes('429')) {
    // Handle rate limiting
    console.error('Rate limit exceeded - try again later');
  }

  if (error.message.includes('404')) {
    // Handle not found
    console.error('Resource not found in Klaviyo');
  }

  // Generic error handling
  console.error('MCP request failed:', error.message);
}
```

## Pagination Example

```javascript
import { getProfiles } from '@/lib/mcp/klaviyo-mcp-client';

async function fetchAllProfiles(store) {
  let allProfiles = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const response = await getProfiles(store, {
      pageSize: 100,
      cursor: cursor,
      useCache: false  // Don't cache during bulk fetch
    });

    allProfiles = allProfiles.concat(response.data);

    // Check if there's a next page
    cursor = response.links?.next
      ? new URL(response.links.next).searchParams.get('page[cursor]')
      : null;

    hasMore = !!cursor;

    console.log(`Fetched ${allProfiles.length} profiles so far...`);
  }

  return allProfiles;
}
```

## Integration with AI Context

When using MCP data in AI context, structure it properly:

```javascript
import { useAI } from "@/app/contexts/ai-context";
import { getSegments } from '@/lib/mcp/klaviyo-mcp-client';

export default function SegmentAnalytics({ store }) {
  const { updateAIState } = useAI();
  const [segments, setSegments] = useState([]);

  useEffect(() => {
    async function fetchAndUpdateAI() {
      // Fetch real-time segment data
      const response = await getSegments(store, {
        useCache: true,
        debug: true
      });

      const segmentData = response.data || [];
      setSegments(segmentData);

      // Update AI context with real-time data
      updateAIState({
        currentPage: '/segments',
        pageType: 'segment_analytics',
        selectedStores: [{
          value: store.public_id,
          label: store.name,
          klaviyo_id: store.klaviyo_integration?.public_id
        }],
        realTimeData: {
          source: 'mcp_server',
          segments: segmentData.map(seg => ({
            id: seg.id,
            name: seg.attributes.name,
            profile_count: seg.attributes.profile_count,
            created: seg.attributes.created,
            updated: seg.attributes.updated
          }))
        },
        insights: {
          total_segments: segmentData.length,
          total_profiles: segmentData.reduce((sum, s) =>
            sum + (s.attributes.profile_count || 0), 0
          ),
          largest_segment: segmentData.reduce((max, s) =>
            (s.attributes.profile_count || 0) > (max?.attributes?.profile_count || 0)
              ? s
              : max
          , null)
        }
      });
    }

    if (store?.klaviyo_integration?.public_id) {
      fetchAndUpdateAI();
    }

    return () => updateAIState({ currentPage: null, realTimeData: null });
  }, [store, updateAIState]);

  // Component render...
}
```

## Best Practices

### 1. Use Cache Wisely
- Enable cache for repeated reads (list selectors, dashboards)
- Disable cache for manual refresh actions
- Use custom TTL for time-sensitive data

### 2. Handle Permissions
- Always pass the full `store` object (contains klaviyo_integration)
- The API proxy validates permissions automatically
- Users only see data for stores they have access to

### 3. Combine with ClickHouse
- MCP for current state and configurations
- ClickHouse for historical trends and aggregations
- Join data by matching IDs (flow_id, campaign_id, etc.)

### 4. Multi-Account Patterns
- Use parallel request functions (`getListsForStores()`)
- Handle per-store errors gracefully
- Display errors alongside successful results

### 5. Debug Mode
- Enable `debug: true` during development
- Automatically disabled in production (NODE_ENV check)
- Provides detailed request/response logging

### 6. Rate Limiting
- Respect Klaviyo's rate limits (10 req/sec burst, 150 req/min steady)
- Use caching to reduce API calls
- Batch multi-account requests with parallel helpers

## Testing

### Test MCP API Proxy Health
```bash
curl http://localhost:3000/api/mcp/klaviyo?test=true
```

Response:
```json
{
  "status": "ok",
  "message": "Klaviyo MCP API proxy is running",
  "endpoints": ["get_lists", "get_segments", ...],
  "timestamp": "2025-10-20T..."
}
```

### Test MCP Client Function
```javascript
import { getLists, clearMCPCache } from '@/lib/mcp/klaviyo-mcp-client';

// Clear cache before testing
clearMCPCache();

// Test with debug enabled
const lists = await getLists(store, {
  debug: true,
  useCache: false
});

console.log('Fetched lists:', lists.data);
```

## Troubleshooting

### Issue: "Store must have Klaviyo integration configured"
**Solution**: Ensure the store has `klaviyo_integration.public_id` set

### Issue: "Access denied"
**Solution**: Verify user has the store in their `contract_seats[].store_access`

### Issue: "401 Unauthorized"
**Solution**: Klaviyo OAuth token expired - reconnect the account

### Issue: "429 Rate limited"
**Solution**: Enable caching or reduce request frequency

### Issue: Empty response data
**Solution**: Check if the Klaviyo account actually has the requested resources

## Summary

The MCP integration provides a powerful complement to ClickHouse analytics:

✅ **Real-time data** - Current state of lists, segments, flows, profiles
✅ **Permission-aware** - Automatic validation of user access
✅ **OAuth-first** - Secure authentication with automatic refresh
✅ **Smart caching** - Reduces API calls and improves performance
✅ **Multi-account** - Parallel requests across multiple stores
✅ **Error handling** - Graceful degradation and clear error messages
✅ **Debug mode** - Detailed logging for development

Use MCP when you need **what exists right now**, use ClickHouse when you need **how it performed over time**.

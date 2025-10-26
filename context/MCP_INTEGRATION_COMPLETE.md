# Klaviyo MCP Server Integration - Complete ✅

## What Was Built

### 1. **MCP Client Library** (`/lib/mcp/klaviyo-mcp-client.js`)
A comprehensive client for accessing Klaviyo API data via MCP protocol with:

#### Features:
- ✅ **All Requested Endpoints Implemented:**
  - Account details
  - Catalog items
  - Events & Metrics
  - Flows (list, details, reports)
  - Lists (all, specific)
  - Segments (all, specific) with profile counts
  - Profiles (list, get, create, update)
  - Campaign reports (with messages)
  - Flow reports (with actions)

- ✅ **Smart Caching System:**
  - TTL-based caching (1 minute to 1 hour)
  - Different cache durations for different data types
  - Per-account cache management
  - Cache clear functionality

- ✅ **Multi-Account Support:**
  - `getListsForStores()` - Parallel requests for multiple stores
  - `getSegmentsForStores()` - Parallel segment fetching
  - `getFlowsForStores()` - Parallel flow fetching
  - Error handling per store

- ✅ **Rate Limit Awareness:**
  - Respects Klaviyo's rate limits (10 req/sec burst, 150 req/min)
  - Smart caching reduces API calls
  - Debug logging for rate limit monitoring

### 2. **MCP API Proxy** (`/app/api/mcp/klaviyo/route.js`)
Server-side API endpoint that handles MCP requests with:

#### Features:
- ✅ **Security & Permissions:**
  - NextAuth session validation
  - User permission checking (ContractSeats validation)
  - Only allows access to authorized stores
  - Superuser bypass support

- ✅ **OAuth-First Authentication:**
  - Uses `buildKlaviyoAuthOptions()` from centralized auth helper
  - Automatic token refresh via `klaviyoRequest()`
  - API key fallback for backwards compatibility
  - Proper error handling for auth failures

- ✅ **Request Handling:**
  - Dynamic endpoint mapping (MCP → Klaviyo API paths)
  - Path parameter substitution (e.g., `{flow_id}` → actual ID)
  - Query parameter building (pagination, filtering)
  - Payload support for POST/PATCH requests

- ✅ **Error Handling:**
  - Specific error messages for common issues
  - Development vs production error detail levels
  - Proper HTTP status codes
  - Rate limit detection and messaging

- ✅ **Health Check:**
  - GET endpoint for testing: `/api/mcp/klaviyo?test=true`
  - Returns available endpoints and status

### 3. **Integration Guide** (`/context/MCP_INTEGRATION_GUIDE.md`)
Comprehensive documentation covering:

#### Contents:
- ✅ **Architecture Overview:**
  - Flow diagram showing React → MCP Client → API Proxy → Klaviyo
  - When to use MCP vs ClickHouse decision matrix

- ✅ **Implementation Examples:**
  - Basic single-store usage
  - Multi-account parallel requests
  - Real-time campaign reports
  - Hybrid approach (ClickHouse + MCP)
  - Profile lookup and enrichment
  - Pagination handling

- ✅ **API Reference:**
  - All available functions documented
  - Options parameter documentation
  - Cache TTL defaults explanation
  - Error handling patterns

- ✅ **Best Practices:**
  - Cache usage guidelines
  - Permission handling
  - Multi-account patterns
  - Debug mode usage
  - Rate limiting strategies

- ✅ **Testing & Troubleshooting:**
  - Health check commands
  - Common error solutions
  - Debug testing procedures

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     HYBRID DATA STRATEGY                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ClickHouse (Historical)          MCP Server (Real-time)     │
│  ─────────────────────────       ────────────────────────   │
│  • Campaign analytics             • Current lists            │
│  • Revenue trends                 • Segment profile counts   │
│  • Customer RFM                   • Flow configurations      │
│  • Product performance            • Account settings         │
│  • Cohort analysis                • Individual profiles      │
│  • Multi-period comparisons       • Real-time reports        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

1. **React Component** calls MCP client function (e.g., `getLists(store)`)
2. **MCP Client** checks cache, builds request, calls `/api/mcp/klaviyo`
3. **API Proxy** validates session, checks permissions, verifies store access
4. **API Proxy** builds Klaviyo API request with OAuth-first auth
5. **Klaviyo API** returns real-time data
6. **API Proxy** formats and returns response
7. **MCP Client** caches response and returns to component
8. **React Component** updates UI with real-time data

## Permission Flow

```
User Session
    ↓
Get User from MongoDB
    ↓
Check user.contract_seats
    ↓
Extract store_access arrays
    ↓
Verify requested store is in user's accessible stores
    ↓
Allow/Deny request
```

## Key Design Decisions

### 1. **OAuth-First with Fallback**
- Primary: OAuth Bearer token (with automatic refresh)
- Fallback: API Key (backwards compatibility)
- Centralized: Uses existing `buildKlaviyoAuthOptions()` helper

### 2. **Smart Caching**
Different TTLs based on data volatility:
- Profiles: 1 minute (change frequently)
- Lists/Segments: 5 minutes (moderate updates)
- Flows/Metrics: 10 minutes (stable configs)
- Account/Catalog: 1 hour (rarely change)

### 3. **Multi-Account Optimization**
- Parallel requests using `Promise.all()`
- Per-store error handling (don't fail all if one fails)
- Structured response with store identification

### 4. **Permission-Aware by Default**
- Every request validates user permissions
- No direct access to Klaviyo API from client
- All requests proxied through server-side validation

## Usage Examples

### Get Lists for Store
```javascript
import { getLists } from '@/lib/mcp/klaviyo-mcp-client';

const lists = await getLists(store, {
  useCache: true,
  debug: true
});
```

### Get Segments Across Multiple Stores
```javascript
import { getSegmentsForStores } from '@/lib/mcp/klaviyo-mcp-client';

const results = await getSegmentsForStores(stores, {
  useCache: true
});

// Each result has:
// {
//   store_public_id: "XAeU8VL",
//   store_name: "My Store",
//   klaviyo_public_id: "Pe5Xw6",
//   segments: [...],
//   error: null
// }
```

### Real-Time Campaign Report
```javascript
import { getCampaignReport } from '@/lib/mcp/klaviyo-mcp-client';

const report = await getCampaignReport(campaignId, store, {
  useCache: false,  // Force fresh data
  debug: true
});

// Includes campaign details + messages via 'include' parameter
```

### Hybrid: MCP + ClickHouse
```javascript
// 1. Get current flow configs from MCP (real-time)
const flows = await getFlows(store);

// 2. Get historical performance from ClickHouse
const stats = await fetch('/api/analytics/flows-clickhouse', {
  method: 'POST',
  body: JSON.stringify({
    klaviyoPublicId: store.klaviyo_integration.public_id,
    flowIds: flows.data.map(f => f.id),
    dateRange: { start, end }
  })
});

// 3. Combine: flow configs + historical stats
```

## Testing

### Health Check
```bash
curl http://localhost:3000/api/mcp/klaviyo?test=true
```

### Test with Debug
```javascript
import { getLists, clearMCPCache } from '@/lib/mcp/klaviyo-mcp-client';

clearMCPCache(); // Clear cache

const lists = await getLists(store, {
  debug: true,      // Enable debug logging
  useCache: false   // Force API call
});
```

## Next Steps for Full AI Integration

1. **Update AI Context Pipeline** (in `AI_MARKETING_ANALYSIS_GUIDE.md`)
   - Add MCP data source option to Haiku SQL generator
   - Update Sonnet analyzer to combine ClickHouse + MCP data
   - Decide when to use MCP vs ClickHouse based on question type

2. **Create AI Decision Logic**
   ```javascript
   function shouldUseMCP(question) {
     const mcpKeywords = [
       'current', 'now', 'latest', 'active',
       'how many profiles', 'what lists',
       'which segments', 'live', 'real-time'
     ];

     return mcpKeywords.some(kw => question.toLowerCase().includes(kw));
   }
   ```

3. **Update OpenRouter Prompts**
   - Haiku: Add MCP endpoint recommendation logic
   - Sonnet: Handle hybrid data analysis (SQL results + MCP data)

4. **Add MCP to AI Context**
   ```javascript
   updateAIState({
     currentPage: '/segments',
     realTimeData: {
       source: 'mcp_server',
       segments: mcpSegments,
       lastUpdated: new Date()
     },
     historicalData: {
       source: 'clickhouse',
       performance: clickhouseStats
     }
   });
   ```

## Files Created

1. `/lib/mcp/klaviyo-mcp-client.js` - Client library (470 lines)
2. `/app/api/mcp/klaviyo/route.js` - API proxy (208 lines)
3. `/context/MCP_INTEGRATION_GUIDE.md` - Documentation (840 lines)
4. `/context/MCP_INTEGRATION_COMPLETE.md` - This summary

## Summary

✅ **Complete MCP Integration** with:
- OAuth-first authentication
- Permission-aware requests
- Smart caching
- Multi-account support
- Comprehensive error handling
- Full documentation

✅ **Ready for Use** in:
- List/segment selectors
- Flow configuration displays
- Real-time campaign reports
- Profile lookups
- Multi-account comparisons
- Hybrid analytics (MCP + ClickHouse)

✅ **Secure & Performant**:
- Server-side permission validation
- Automatic OAuth token refresh
- Intelligent caching strategy
- Rate limit awareness
- Debug mode for development

The MCP integration is **production-ready** and can be used immediately to supplement ClickHouse historical data with real-time Klaviyo configurations and details.

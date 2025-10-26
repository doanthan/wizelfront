# Haiku Data Flow: Where to Feed Input Data

## Overview

Haiku receives data through **two main channels**:
1. **Context Object** - On-screen data, stores, date ranges
2. **System Prompt** - Instructions and available context

## 🔄 Complete Data Flow

```
User Page → AI Context → detectIntentWithHaiku() → Haiku AI → Decision
    ↓           ↓                    ↓
Dashboard   setAIState()     systemPrompt with context
Calendar    updateAIState()  + user query
```

## 📊 1. On-Screen Data (AI Context)

### Where It's Set

Pages update the AI context using `updateAIState()`:

**Example: Dashboard** (`/app/(dashboard)/dashboard/page.jsx`)

```javascript
import { useAI } from "@/app/contexts/ai-context";

export default function DashboardPage() {
  const { updateAIState } = useAI();

  // Update AI context when data changes
  useEffect(() => {
    updateAIState({
      currentPage: '/dashboard',
      pageTitle: 'Dashboard',
      pageType: 'dashboard',

      // Selected stores
      selectedStores: selectedStoresData, // [{ value, label, klaviyo_id }]
      selectedKlaviyoIds: klaviyoIds,

      // Date range
      dateRange: {
        start: dateRangeSelection.ranges?.main?.start,
        end: dateRangeSelection.ranges?.main?.end,
        preset: dateRangeSelection.period,
        comparison: dateRangeSelection.ranges?.comparison
      },

      // On-screen data (aggregated only!)
      data: {
        summary: {
          totalRevenue: 125000,
          totalOrders: 450,
          avgOrderValue: 277.78
        },
        topCampaigns: topCampaigns.slice(0, 5), // Top 5 only
        timeSeries: dailyMetrics // Aggregated daily data
      }
    });
  }, [selectedAccounts, dateRangeSelection, dashboardData]);
}
```

### What Data to Include

**✅ DO Include:**
- **Aggregated metrics**: Totals, averages, counts
- **Top performers**: Top 5-10 items only
- **Summary statistics**: Revenue, orders, rates
- **Time-series data**: Daily/weekly aggregates (max 90 points)
- **Store metadata**: Store names, IDs, selected stores
- **Date ranges**: Current period, comparison period

**❌ DON'T Include:**
- Raw campaign arrays (100+ items)
- Complete customer lists
- Detailed order history
- Large datasets (>50KB)

## 🤖 2. Haiku Intent Detection

### Current Implementation

**File:** `/lib/ai/intent-detection-haiku.js`

```javascript
export async function detectIntentWithHaiku(query, context = {}, options = {}) {
  // Extract context data
  const hasOnScreenContext = context?.aiState?.data_context != null;
  const currentPage = context?.aiState?.currentPage || 'unknown';

  // Build system prompt with context
  const systemPrompt = `You are an intelligent query router...

  CONTEXT:
  - Current page: ${currentPage}
  - Has on-screen data: ${hasOnScreenContext ? 'YES' : 'NO'}

  ${context?.aiState?.selectedStores ?
    `- Selected stores: ${context.aiState.selectedStores.map(s => s.label).join(', ')}`
    : ''}

  ${context?.aiState?.dateRange ?
    `- Date range: ${context.aiState.dateRange.preset}`
    : ''}
  `;

  // Call Haiku
  const response = await makeOpenRouterRequest({
    model: 'anthropic/claude-haiku-4.5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Classify: "${query}"` }
    ]
  });
}
```

## 🏪 3. Store Name Extraction with Context

### Enhanced Implementation

**File:** `/lib/ai/intent-detection-haiku.js` → `extractStoreNamesWithHaiku()`

```javascript
export async function extractStoreNamesWithHaiku(query, userAccessibleStores = []) {
  const systemPrompt = `You are a store name extractor...

  ${userAccessibleStores.length > 0 ? `
  USER'S ACCESSIBLE STORES:
  ${userAccessibleStores.map(s => `- ${s.name}`).join('\n')}
  ` : ''}

  Extract specific store names from the query.
  `;

  const response = await makeOpenRouterRequest({
    model: 'anthropic/claude-haiku-4.5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract: "${query}"` }
    ]
  });
}
```

**Where Store Data is Passed:**

**File:** `/lib/ai/store-resolver.js` → `getStoresForQuery()`

```javascript
export async function getStoresForQuery(query, user, context = {}) {
  // Get user's accessible stores
  const userAccessibleStores = await getUserAccessibleStores(user);
  // Returns: [{ public_id, name, hasKlaviyo, klaviyo_id }]

  // Pass to Haiku for context
  const resolution = await needsStoreResolution(query, userAccessibleStores);

  // Haiku now knows:
  // - User's query: "How is Acme going?"
  // - User's stores: ["Acme Store", "Store B", "My Boutique"]
  // - Can intelligently extract "Acme" and match to "Acme Store"
}
```

## 📝 How to Add More Context to Haiku

### Option 1: Enhance System Prompt (Recommended)

**Location:** `/lib/ai/intent-detection-haiku.js` → `detectIntentWithHaiku()`

```javascript
const systemPrompt = `You are an intelligent query router...

CONTEXT:
- Current page: ${currentPage}
- Has on-screen data: ${hasOnScreenContext ? 'YES' : 'NO'}

${context?.aiState?.selectedStores?.length > 0 ? `
SELECTED STORES:
${context.aiState.selectedStores.map(s => `- ${s.label} (${s.klaviyo_id})`).join('\n')}
` : ''}

${context?.aiState?.dateRange ? `
DATE RANGE:
- Period: ${context.aiState.dateRange.preset}
- Start: ${context.aiState.dateRange.start}
- End: ${context.aiState.dateRange.end}
` : ''}

${context?.aiState?.data?.summary ? `
ON-SCREEN METRICS:
- Total Revenue: $${context.aiState.data.summary.totalRevenue}
- Total Orders: ${context.aiState.data.summary.totalOrders}
- Campaigns: ${context.aiState.data.summary.totalCampaigns}
` : ''}

${context?.aiState?.data?.topCampaigns?.length > 0 ? `
TOP CAMPAIGNS VISIBLE:
${context.aiState.data.topCampaigns.slice(0, 3).map(c =>
  `- ${c.name}: $${c.revenue} revenue, ${c.openRate}% open rate`
).join('\n')}
` : ''}
`;
```

### Option 2: Pass as Function Parameter

```javascript
// In your API route or component
const intent = await detectIntentWithHaiku(query, {
  aiState: {
    currentPage: '/dashboard',
    selectedStores: stores,
    dateRange: dateRange,
    data: {
      summary: summaryMetrics,
      topCampaigns: topCampaigns.slice(0, 5)
    }
  }
});
```

## 🎯 Best Practices

### 1. Keep Context Small
- Max 2-3KB of context data
- Aggregate before passing
- Top 5-10 items max

### 2. Structure for Readability
```javascript
// ✅ GOOD - Structured and concise
ON-SCREEN METRICS:
- Revenue: $125K (+12%)
- Orders: 450 (+8%)
- Open Rate: 23.5%

// ❌ BAD - Raw data dump
metrics: {"totalRevenue":125000,"revenueChange":12.5,"totalOrders":450,...}
```

### 3. Relevant Context Only
- Intent detection: Page type, date range
- Store extraction: User's accessible stores
- Tier 1 chat: Full on-screen data

### 4. Update Context on Data Changes

```javascript
// Update when data changes
useEffect(() => {
  if (campaignData && stores) {
    updateAIState({
      data: {
        summary: calculateSummary(campaignData),
        topCampaigns: campaignData.slice(0, 5)
      }
    });
  }
}, [campaignData, stores]);
```

## 📊 Context Size Guidelines

| Context Type | Max Size | Example |
|--------------|----------|---------|
| Store list | 1KB | 50 stores |
| Summary metrics | 500B | 10 metrics |
| Top campaigns | 2KB | 5 campaigns |
| Time-series | 5KB | 90 daily points |
| **Total** | **10KB** | Per request |

## 🔍 Debugging Context

### View Context in Browser Console

```javascript
import { useAI } from '@/app/contexts/ai-context';

const { aiState } = useAI();
console.log('Current AI Context:', aiState);
console.log('Context size:', JSON.stringify(aiState).length, 'bytes');
```

### Server-Side Logging

```javascript
// In /app/api/chat/ai/route.js
console.log('🔍 Haiku Context:', {
  page: context?.aiState?.currentPage,
  stores: context?.aiState?.selectedStores?.length,
  hasData: !!context?.aiState?.data,
  dataSize: JSON.stringify(context?.aiState?.data || {}).length
});
```

## 🚀 Example: Full Data Flow

### Step 1: User on Dashboard
```javascript
// Dashboard loads data
const dashboardData = await fetchDashboardData();

// Update AI context
updateAIState({
  currentPage: '/dashboard',
  selectedStores: [
    { value: 'XAeU8VL', label: 'Acme Store', klaviyo_id: 'XqkVGb' }
  ],
  data: {
    summary: {
      totalRevenue: 125000,
      totalOrders: 450
    }
  }
});
```

### Step 2: User Asks Question
```javascript
// User: "How is Acme going?"
const query = "How is Acme going?";
```

### Step 3: AI Chat Route
```javascript
// /app/api/chat/ai/route.js
const { message, context } = await request.json();

// context = { aiState: { currentPage, selectedStores, data } }
```

### Step 4: Intent Detection
```javascript
const intent = await detectIntentWithHaiku(message, context);
// Haiku sees:
// - Query: "How is Acme going?"
// - Page: /dashboard
// - Stores: Acme Store
// - Has data: YES
// Decision: Tier 2 (SQL query for "Acme Store")
```

### Step 5: Store Resolution
```javascript
const { stores } = await getStoresForQuery(message, user, context);
// Extracts "Acme" → Resolves to "Acme Store"
// Returns Store document with klaviyo_public_id
```

### Step 6: Query ClickHouse
```javascript
const klaviyoIds = stores.map(s => s.klaviyo_integration.public_id);
// Query ClickHouse with specific store's klaviyo_public_id
```

## 🎉 Result

Haiku now has:
- ✅ User's query
- ✅ Current page context
- ✅ Selected stores
- ✅ On-screen summary data
- ✅ Date range
- ✅ User's accessible stores list

This enables intelligent routing and store name extraction! 🚀

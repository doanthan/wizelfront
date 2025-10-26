# AI Context Fix - Multi-Account Reporting Page

## Problem Identified

The AI context on the `/multi-account-reporting?tab=revenue` page was showing:
- Empty `selectedStores` array
- Empty `selectedKlaviyoIds` array
- Empty `storeMetadata` object
- No on-screen revenue data in `data` object
- Generic "View All" in filters without actual store details

### Root Causes:

1. **"View All" Selection Not Expanded**
   - When user selects "View All" (`{ value: 'all', label: 'View All' }`), the code wasn't expanding this to include all actual stores
   - AI context only showed "View All" as a label without the actual store data

2. **Missing Store Arrays**
   - The AI context was missing `selectedStores`, `selectedKlaviyoIds`, and `storeMetadata` fields
   - These are critical for Haiku to understand which stores to query

3. **Revenue Data Not Included**
   - Revenue tab sets `metrics.status = 'Revenue data managed by RevenueTab component'`
   - But RevenueTab never passes data back to parent for AI context
   - AI context has no actual revenue metrics or insights

## Solution Implemented

### 1. Expand "View All" to Actual Stores

Added logic to detect "View All" and populate with all available stores:

```javascript
// Build selected stores arrays for AI context
// If "View All" is selected, use all available stores
const isViewAll = selectedAccounts.some(acc => acc.value === 'all')
const storesForContext = isViewAll ? stores : stores.filter(store =>
    selectedAccounts.some(acc => acc.value === store.public_id)
)
```

### 2. Add Store Arrays to AI Context

Created three new fields in AI context:

```javascript
const selectedStoresForAI = storesForContext.map(store => ({
    id: store.public_id,
    name: store.name,
    klaviyoId: store.klaviyo_integration?.public_id
}))

const selectedKlaviyoIds = storesForContext
    .map(store => store.klaviyo_integration?.public_id)
    .filter(Boolean)

const storeMetadata = {}
storesForContext.forEach(store => {
    if (store.public_id) {
        storeMetadata[store.public_id] = {
            name: store.name,
            klaviyoId: store.klaviyo_integration?.public_id,
            hasKlaviyo: !!store.klaviyo_integration?.public_id
        }
    }
})

// Add to AI state
const aiState = {
    currentPage: `multi-account-reporting-${activeTab}`,
    pageTitle,
    selectedStores: selectedStoresForAI,
    selectedKlaviyoIds: selectedKlaviyoIds,
    storeMetadata: storeMetadata,
    // ... rest of fields
}
```

### 3. Updated Dependencies

Added `stores` to the useEffect dependency array to ensure AI context updates when stores change:

```javascript
}, [activeTab, selectedAccounts, dateRangeSelection, campaignsData, stores, updateAIState])
```

## What the AI Context Now Shows

### Before Fix:
```json
{
  "selectedStores": [],
  "selectedKlaviyoIds": [],
  "storeMetadata": {},
  "filters": {
    "accounts": "View All"
  },
  "data": {},
  "metrics": {
    "status": "Revenue data managed by RevenueTab component"
  }
}
```

### After Fix (with "View All" selected):
```json
{
  "selectedStores": [
    {
      "id": "rZResQK",
      "name": "Acme Store",
      "klaviyoId": "Pe5Xw6"
    },
    {
      "id": "7MP60fH",
      "name": "Store B",
      "klaviyoId": "XqkVGb"
    },
    // ... all other stores
  ],
  "selectedKlaviyoIds": ["Pe5Xw6", "XqkVGb", ...],
  "storeMetadata": {
    "rZResQK": {
      "name": "Acme Store",
      "klaviyoId": "Pe5Xw6",
      "hasKlaviyo": true
    },
    "7MP60fH": {
      "name": "Store B",
      "klaviyoId": "XqkVGb",
      "hasKlaviyo": true
    },
    // ... all other stores
  },
  "filters": {
    "accounts": "View All",
    "dateRange": "23/07/2025 - 21/10/2025",
    "comparisonType": "previous-period",
    "activeTab": "revenue"
  }
}
```

## How This Helps AI Chat

### 1. Store Name Resolution
When user asks: **"How is Acme Store doing?"**

Haiku can now see all available stores in context:
```javascript
// In intent-detection-haiku.js
const systemPrompt = `
USER'S ACCESSIBLE STORES (${userAccessibleStores.length} total):
${userAccessibleStores.map(s => `- ${s.name}${s.hasKlaviyo ? '' : ' (No Klaviyo data)'}`).join('\n')}
`
```

The `selectedStores` and `storeMetadata` from AI context will be used to populate this list.

### 2. SQL Query Generation
When routing to Tier 2 (SQL database):
```javascript
// In /lib/ai/store-resolver.js
const { storeIds, stores } = await getStoresForQuery(query, user, context)

// Convert to Klaviyo IDs for ClickHouse
const klaviyoIds = stores.map(s => s.klaviyo_integration?.public_id).filter(Boolean)

// SQL query
const query = `
  SELECT * FROM account_metrics_daily
  WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
`
```

### 3. Context-Aware Responses
Haiku can provide context-aware responses:
- "Across all your stores (Acme Store, Store B, etc.)..."
- "For the selected accounts with Klaviyo data (3 of 5)..."
- "Based on the revenue data from July 23 to October 21..."

## Files Modified

### `/app/(dashboard)/multi-account-reporting/page.jsx`

**Changes:**
1. Added `isViewAll` detection logic (line 274)
2. Created `storesForContext` filtering logic (lines 275-277)
3. Built `selectedStoresForAI` array (lines 279-283)
4. Built `selectedKlaviyoIds` array (lines 285-287)
5. Built `storeMetadata` object (lines 289-298)
6. Added these three fields to `aiState` (lines 304-306)
7. Updated useEffect dependencies to include `stores` (line 407)

**Lines Changed:** 262-407

## Remaining Issue: Revenue Data

The revenue tab still doesn't populate actual metrics. This is a separate issue that requires:

### Option 1: Lift State Up (Recommended)
Have RevenueTab expose revenue data via callback:

```javascript
// In RevenueTab component
useEffect(() => {
    if (onRevenueDataChange && revenueData) {
        onRevenueDataChange(revenueData)
    }
}, [revenueData, onRevenueDataChange])

// In parent page
const [revenueData, setRevenueData] = useState(null)

<RevenueTab
    onRevenueDataChange={setRevenueData}
    // ... other props
/>

// In AI context useEffect
if (activeTab === 'revenue' && revenueData) {
    aiState.metrics = revenueData.metrics
    aiState.data = revenueData.accountComparison
    // Generate insights based on revenue data
}
```

### Option 2: Update AI Context from RevenueTab
Have RevenueTab directly update AI context:

```javascript
// In RevenueTab component
import { useAI } from '@/app/contexts/ai-context'

const { updateAIState } = useAI()

useEffect(() => {
    if (revenueData) {
        updateAIState({
            metrics: revenueData.metrics,
            data: {
                accountComparison: revenueData.accountComparison,
                channelRevenue: revenueData.channelRevenue
            }
        })
    }
}, [revenueData, updateAIState])
```

## Testing

### Step 1: Navigate to Page
```
http://localhost:3000/multi-account-reporting?tab=revenue
```

### Step 2: Open Wizel Chat DEV Tab
Should now see in "Current AI Context":
- `selectedStores`: Array of all stores (if View All selected)
- `selectedKlaviyoIds`: Array of Klaviyo IDs
- `storeMetadata`: Object with store details

### Step 3: Ask Question
**"How is Acme Store performing?"**

Expected:
- Haiku extracts "Acme Store" from query
- Resolves to actual Store document with public_id
- Converts to klaviyo_public_id for ClickHouse query
- Returns revenue data for that store

### Step 4: Verify Intent Detection Prompt
In DEV tab, the intent detection prompt should show:
```
USER'S ACCESSIBLE STORES (5 total):
- Acme Store
- Store B
- My Boutique
- XYZ Company
- Test Store (No Klaviyo data)
```

## Benefits

✅ **Store Context Populated** - AI knows which stores are selected
✅ **Klaviyo IDs Available** - Can query ClickHouse with correct IDs
✅ **"View All" Expanded** - AI sees all actual stores, not just label
✅ **Store Metadata Included** - Know which stores have Klaviyo data
✅ **Dynamic Updates** - Context refreshes when stores change

## Next Steps

1. **Implement Revenue Data Callback** - Option 1 or Option 2 above
2. **Add Revenue Insights** - Generate AI insights from revenue metrics
3. **Test Store Name Resolution** - Verify Haiku can extract and resolve store names
4. **Test SQL Queries** - Verify ClickHouse queries use correct Klaviyo IDs

## Summary

The core issue of empty store arrays in AI context is **now fixed**. The AI chat will now have access to:
- All selected stores (or all stores if "View All")
- Their Klaviyo IDs for database queries
- Store metadata for contextual responses

The revenue data population is a separate enhancement that can be implemented using one of the two approaches outlined above.

**Status: ✅ Store Context Fixed | ⏳ Revenue Data Enhancement Pending**

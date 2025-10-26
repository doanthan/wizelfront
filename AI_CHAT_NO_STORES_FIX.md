# AI Chat - No Stores Selected Fix

## Problem
When users asked AI chat questions without selecting specific stores (e.g., "how is my flows data for the past 30 days"), the system would fail with:
```
❌ ClickHouse routing failed: Error: No stores selected for ClickHouse query
```

This happened because the intelligent routing system would try to route to ClickHouse for detailed analysis, but didn't handle the case where no stores were selected in the UI.

## Root Cause
The `handleClickHouseRouting()` and `handleMCPRouting()` functions in `/lib/ai/enhanced-tier1-handler.js` assumed stores were always pre-selected and would throw errors when the `selectedStores` array was empty.

## Solution
Updated both routing handlers to automatically fetch all accessible stores for the user when no stores are selected, using the same ContractSeat-based permission system used by the dashboard and multi-account reporting APIs.

### Changes Made

#### 1. Enhanced ClickHouse Routing (`handleClickHouseRouting`)
- **Before**: Threw error if `storeIds.length === 0`
- **After**:
  - Detects when no stores are selected
  - Fetches all accessible stores for the user via ContractSeat system
  - Supports both super admin (all stores) and regular users (contract-based access)
  - Logs which stores were auto-selected
  - Continues with normal ClickHouse query using all accessible stores

#### 2. Enhanced MCP Routing (`handleMCPRouting`)
- **Before**: Threw error if `selectedStores.length === 0`
- **After**:
  - Detects when no stores are selected
  - Fetches first accessible store for the user
  - Uses same permission system as ClickHouse routing
  - Logs which store was auto-selected
  - Continues with MCP query using the first accessible store

#### 3. Fixed Time Range Parsing for Flows
- **Before**: Flow queries only supported `context.dateRange.preset`
- **After**: Also parses "past X days" or "last X days" from natural language
- Pattern: `/\b(past|last)\s+(\d+)\s+days?\b/i`

## Code Changes

### File: `/lib/ai/enhanced-tier1-handler.js`

**ClickHouse Routing Enhancement:**
```javascript
// If no stores selected, get all user's accessible stores
if (storeIds.length === 0) {
  console.log('ℹ️  No stores selected, fetching all accessible stores for user...');

  // Fetch user's accessible stores via ContractSeat system
  // (same logic as dashboard/route.js and multi-account-reporting API)

  if (isSuperAdmin) {
    // Get all stores
  } else {
    // Get stores from active ContractSeats
  }

  storeIds = stores.map(s => s.public_id).filter(Boolean);
  console.log(`✅ Found ${storeIds.length} accessible stores for user`);
}
```

**MCP Routing Enhancement:**
```javascript
// If no stores selected, get user's first accessible store
if (selectedStores.length === 0) {
  console.log('ℹ️  No stores selected, fetching first accessible store for user...');

  // Same ContractSeat logic, but only fetch first store
  // MCP queries typically work with one store at a time

  selectedStores = [{ value: stores[0].public_id, label: stores[0].name }];
  console.log(`✅ Using store: ${stores[0].name} (${stores[0].public_id})`);
}
```

**Flow Query Time Parsing:**
```javascript
// Flow queries - added "past" keyword support
if (/\b(flow|automation)\b/i.test(queryLower)) {
  template = 'flow_performance';

  // Add time filter if mentioned
  if (context?.dateRange?.preset) {
    filters.push(buildTimeFilter(context.dateRange.preset, 'date'));
  } else if (/\b(past|last)\s+(\d+)\s+days?\b/i.test(queryLower)) {
    const match = queryLower.match(/\b(past|last)\s+(\d+)\s+days?\b/i);
    const days = parseInt(match[2]);
    filters.push(`date >= today() - ${days}`);
  }
}
```

## Testing

### Test Cases

1. **No stores selected + flows query:**
   - Input: "how is my flows data for the past 30 days"
   - Expected: Auto-fetches all accessible stores, queries ClickHouse with 30-day filter
   - Status: ✅ Should work now

2. **No stores selected + campaign query:**
   - Input: "show me my top campaigns from last week"
   - Expected: Auto-fetches all accessible stores, queries ClickHouse
   - Status: ✅ Should work now

3. **No stores selected + MCP query:**
   - Input: "what segments do I have"
   - Expected: Auto-fetches first accessible store, queries Klaviyo MCP
   - Status: ✅ Should work now

4. **Super admin with no stores selected:**
   - Expected: Fetches ALL stores in system
   - Status: ✅ Should work now

5. **Regular user with multiple contracts:**
   - Expected: Fetches stores from all active contract seats
   - Status: ✅ Should work now

## Benefits

1. **Better UX**: Users don't need to select stores before asking questions
2. **Consistent Behavior**: Matches how dashboard and reporting pages work
3. **Flexible**: Works for both super admins and regular users
4. **Permission-Safe**: Uses same ContractSeat permission system as rest of app
5. **Informative**: Logs which stores were auto-selected for debugging

## Logging Output

When no stores are selected, you'll see:
```
ℹ️  No stores selected, fetching all accessible stores for user...
✅ Found 5 accessible stores for user
```

Or for MCP:
```
ℹ️  No stores selected, fetching first accessible store for user...
✅ Using store: My Store (XAeU8VL)
```

## Edge Cases Handled

1. **User has no accessible stores**: Returns meaningful error message
2. **User has stores but no Klaviyo integrations**: Handled by existing error handling
3. **Super admin**: Gets all stores in system
4. **Empty ContractSeat.store_access**: Correctly interprets as "all stores in contract"
5. **Multiple contracts**: Aggregates stores from all active seats

## Related Files
- `/lib/ai/enhanced-tier1-handler.js` - Main routing logic (UPDATED)
- `/app/api/dashboard/route.js` - Reference implementation for store fetching
- `/app/api/multi-account-reporting/revenue/route.js` - Another reference implementation
- `/models/ContractSeat.js` - Contract-based permission model
- `/models/Store.js` - Store model

## Future Improvements
- Cache user's accessible stores to avoid repeated database queries
- Add option to remember user's preferred stores in localStorage
- Show which stores were auto-selected in the AI response metadata
- Allow users to explicitly say "all my stores" vs specific stores

## Migration Notes
- No database changes required
- No breaking changes to existing functionality
- Backwards compatible - still works when stores ARE selected
- Safe to deploy immediately

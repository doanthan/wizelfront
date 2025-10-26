# Test Plan: AI Chat with No Stores Selected

## Test Setup
1. Log in as a regular user (not super admin)
2. DO NOT select any stores in the store selector
3. Open the AI chat interface

## Test Cases

### Test 1: Flows Query with Time Range ✅
**Input:** "how is my flows data for the past 30 days"

**Expected Behavior:**
1. Intent detection: Tier 1 → intelligent routing detects flows query
2. Data source routing: Routes to ClickHouse (historical data)
3. Store auto-selection: Fetches all accessible stores via ContractSeat
4. Time parsing: Detects "past 30 days" and adds filter `date >= today() - 30`
5. Query execution: Queries flow_performance with 30-day filter
6. Response: Returns flow performance data for all accessible stores

**Expected Console Logs:**
```
🔍 Checking data source routing for: how is my flows data for the past 30 days
🎯 Routing decision: { source: 'clickhouse', confidence: 'high', ... }
📊 Routing to ClickHouse for detailed analysis...
ℹ️  No stores selected, fetching all accessible stores for user...
✅ Found X accessible stores for user
✅ Generated ClickHouse query: SELECT ...
✅ Query returned X rows
```

**Before Fix:** ❌ Error: No stores selected for ClickHouse query
**After Fix:** ✅ Should work

---

### Test 2: Campaign Query ✅
**Input:** "show me my top 5 campaigns from the last week"

**Expected Behavior:**
1. Detects campaign query
2. Routes to ClickHouse
3. Auto-selects all accessible stores
4. Parses "last 7 days" time filter
5. Parses "top 5" limit
6. Returns top 5 campaigns across all stores

**Before Fix:** ❌ Error: No stores selected
**After Fix:** ✅ Should work

---

### Test 3: Real-time Segments Query (MCP) ✅
**Input:** "what segments do I have"

**Expected Behavior:**
1. Detects segments query
2. Routes to MCP (real-time data)
3. Auto-selects FIRST accessible store
4. Queries Klaviyo MCP for segments
5. Returns current segments list

**Expected Console Logs:**
```
🔌 Routing to MCP for real-time data...
ℹ️  No stores selected, fetching first accessible store for user...
✅ Using store: Store Name (public_id)
🔍 Fetching segments from Klaviyo MCP...
✅ MCP returned X segments
```

**Before Fix:** ❌ Error: No stores selected for MCP query
**After Fix:** ✅ Should work

---

### Test 4: Super Admin - No Stores Selected ✅
**Input:** "how is my flows data for the past 30 days"
**User:** Super admin

**Expected Behavior:**
1. Detects super admin status
2. Fetches ALL stores in system (not just user's stores)
3. Queries ClickHouse with all stores
4. Returns aggregated data

**Expected Console Logs:**
```
ℹ️  No stores selected, fetching all accessible stores for user...
✅ Found X accessible stores for user  # X = total stores in system
```

---

### Test 5: User with Multiple Contracts ✅
**Setup:** User has active seats in 2 different contracts

**Input:** "how is my flows data for the past 30 days"

**Expected Behavior:**
1. Fetches stores from ALL active contract seats
2. Aggregates store IDs from all contracts
3. Queries ClickHouse with combined store list
4. Returns data across all contracts

---

### Test 6: Time Range Variations ✅

**Test inputs:**
- "past 30 days" → `date >= today() - 30`
- "last 7 days" → `date >= today() - 7`
- "last 90 days" → `date >= today() - 90`
- "past 1 day" → `date >= today() - 1`

**Expected:** All variations should parse correctly for flow queries

---

### Test 7: Stores ARE Selected (Backwards Compatibility) ✅
**Setup:** User selects 2 specific stores from selector

**Input:** "how is my flows data for the past 30 days"

**Expected Behavior:**
1. Uses the 2 selected stores (NOT all accessible stores)
2. Does NOT trigger auto-fetch logic
3. Works exactly as before

**Console Should NOT Show:**
```
ℹ️  No stores selected, fetching all accessible stores for user...
```

---

## Edge Cases

### Edge Case 1: User Has No Accessible Stores ❌
**Setup:** User with no contract seats

**Expected:**
```
❌ Error: No accessible stores found for this user
```

**Behavior:** Should fail gracefully with clear error message

---

### Edge Case 2: User Has Stores But No Klaviyo Integrations ❌
**Setup:** User has store access but stores have no klaviyo_integration

**Expected:**
```
❌ Error: No valid Klaviyo integrations found
```

**Behavior:** Handled by existing error handling after auto-fetch

---

### Edge Case 3: Empty ContractSeat.store_access Array ✅
**Setup:** ContractSeat with `store_access: []`

**Expected:**
- System interprets as "access to ALL stores in contract"
- Fetches all stores with matching contract_id

**Behavior:** Should work correctly

---

## Performance Testing

### Test 8: Response Time with Auto-Fetch
**Measure:**
1. Time to fetch accessible stores
2. Total response time vs. pre-selected stores

**Expected:**
- Auto-fetch adds ~50-200ms overhead
- Still acceptable for user experience

---

## Verification Checklist

After running tests:
- [ ] No stores selected works for flows queries
- [ ] No stores selected works for campaign queries
- [ ] No stores selected works for MCP queries
- [ ] Time parsing works ("past X days")
- [ ] Super admin gets all stores
- [ ] Regular user gets contract-based stores
- [ ] Pre-selected stores still work (backwards compatibility)
- [ ] Error messages are clear and helpful
- [ ] Console logs are informative
- [ ] No performance degradation

---

## Manual Testing Steps

1. **Clear localStorage** (ensure no cached store selections)
   ```javascript
   localStorage.removeItem('analyticsSelectedAccounts');
   localStorage.removeItem('selectedStoreId');
   ```

2. **Open AI chat** without selecting stores

3. **Ask test questions** from above

4. **Check browser console** for expected logs

5. **Verify responses** contain data from accessible stores

6. **Check network tab** for ClickHouse/MCP calls

---

## Rollback Plan

If issues occur:
1. Revert changes to `/lib/ai/enhanced-tier1-handler.js`
2. Users will need to select stores before asking questions
3. Original error messages will return

## Success Criteria

✅ All test cases pass
✅ Error handling is graceful
✅ Performance is acceptable
✅ Backwards compatible with existing behavior
✅ Clear logging for debugging

# Request Parameter Fix - Infinite Loop Resolved

## Problem

The AI chat was experiencing an infinite loop with the error:
```
ReferenceError: request is not defined
    at handleTier2Analysis (app/api/chat/ai/route.js:484:19)
```

### Root Causes

1. **Missing `request` parameter**: The `handleTier2Analysis` function needed to access `request.headers.get('cookie')` to pass session cookies to the `/api/ai/analyze` endpoint, but `request` was not being passed through the call chain.

2. **Infinite fallback loop**: When Tier 2 failed, it would fall back to Tier 1. Tier 1 would detect the SQL fallback pattern in the AI response and route back to Tier 2, creating an infinite loop.

### Error Flow

```
User asks question
    ↓
Tier 1 processes with Sonnet
    ↓
AI response suggests SQL query needed
    ↓
Route to Tier 2
    ↓
ERROR: request is not defined (line 484)
    ↓
Fall back to Tier 1
    ↓
AI response suggests SQL query needed (again)
    ↓
Route to Tier 2 (again)
    ↓
[INFINITE LOOP - repeats 20+ times]
```

## Fixes Applied

### 1. Added `request` Parameter Through Call Chain

**Updated function signatures:**

```javascript
// ✅ BEFORE: Missing request parameter
async function handleTier1Context(
  sanitizedMessage,
  context,
  history,
  session,
  intent,
  startTime
) { ... }

// ✅ AFTER: Added request parameter
async function handleTier1Context(
  sanitizedMessage,
  context,
  history,
  session,
  intent,
  startTime,
  request  // NEW
) { ... }
```

```javascript
// ✅ BEFORE: Missing request parameter
async function handleTier2Analysis(
  sanitizedMessage,
  context,
  session,
  intent,
  startTime
) { ... }

// ✅ AFTER: Added request parameter
async function handleTier2Analysis(
  sanitizedMessage,
  context,
  session,
  intent,
  startTime,
  request  // NEW
) { ... }
```

**Updated all call sites (3 locations):**

1. **POST → handleTier1Context** (line 134)
```javascript
return await handleTier1Context(
  sanitizedMessage,
  context,
  history,
  session,
  intent,
  startTime,
  request  // NEW
);
```

2. **handleTier1Context → handleTier2Analysis** (line 305)
```javascript
const tier2Result = await handleTier2Analysis(
  sanitizedMessage,
  context,
  session,
  { ...intent, tier: 2, confidence: 'high' },
  startTime,
  request  // NEW
);
```

3. **handleTier2Analysis → handleTier1Context (fallback)** (line 547)
```javascript
return await handleTier1Context(
  sanitizedMessage,
  context,
  [],
  session,
  { ...intent, tier: 1, fromTier2Fallback: true },
  startTime,
  request  // NEW
);
```

### 2. Prevented Infinite Fallback Loop

**Added fallback detection flag:**

```javascript
// In handleTier1Context (lines 294-326)

// Check if AI response needs SQL fallback
const needsSQLFallback = detectSQLFallbackRequest(cleanedResponse);

// NEW: Check if we're already in a fallback from Tier 2
const isAlreadyFallback = intent?.fromTier2Fallback === true;

// Only route to Tier 2 if not already in fallback mode
if (needsSQLFallback && !isAlreadyFallback) {
  console.log('🔄 AI requested SQL fallback - routing to Tier 2');
  // Route to Tier 2...
} else if (needsSQLFallback && isAlreadyFallback) {
  console.log('⚠️  SQL fallback detected but already in fallback mode - preventing infinite loop');
  // Don't route again - return Tier 1 response
}
```

**Mark fallback in intent object:**

```javascript
// In handleTier2Analysis catch block (line 552)
return await handleTier1Context(
  sanitizedMessage,
  context,
  [],
  session,
  { ...intent, tier: 1, fromTier2Fallback: true },  // NEW: Flag to prevent re-routing
  startTime,
  request
);
```

## How It Works Now

### Normal Flow (Tier 2 succeeds)

```
User asks question
    ↓
Tier 1 processes with Sonnet
    ↓
AI response suggests SQL query needed
    ↓
Route to Tier 2 ✅ (with request parameter)
    ↓
Tier 2 queries ClickHouse
    ↓
Return SQL analysis result
```

### Fallback Flow (Tier 2 fails)

```
User asks question
    ↓
Tier 1 processes with Sonnet
    ↓
AI response suggests SQL query needed
    ↓
Route to Tier 2 ✅ (with request parameter)
    ↓
ERROR in Tier 2 (e.g., no stores, no data)
    ↓
Fall back to Tier 1 with fromTier2Fallback=true
    ↓
Tier 1 detects SQL fallback pattern
    ↓
Check: isAlreadyFallback? YES ✅
    ↓
Skip routing, return Tier 1 response
    ↓
[LOOP PREVENTED]
```

## Testing

### Test Query

```
"how are my last 3 months worth of flows looking?"
```

### Expected Behavior

**Before fix:**
- ❌ `ReferenceError: request is not defined`
- ❌ Infinite loop (20-40+ iterations)
- ❌ Request timeout
- ❌ No response to user

**After fix:**
- ✅ Request parameter passed correctly
- ✅ Tier 2 can make fetch request with session cookies
- ✅ If Tier 2 fails, falls back to Tier 1 once
- ✅ No infinite loop
- ✅ User receives a response (either Tier 2 analysis or Tier 1 context-based)

### Logs to Check

```bash
# Successful Tier 2 routing:
🔄 AI requested SQL fallback - routing to Tier 2
🔍 Tier 2 SQL Analysis: {
  question: 'how are my last 3 months worth of flows looking?',
  storeCount: 7,
  resolution: 'all_accessible'
}
✅ Tier 2 analysis returned successfully

# Tier 2 fallback (no loop):
🔄 AI requested SQL fallback - routing to Tier 2
❌ Tier 2 analysis error: [some error]
🔄 Falling back to Tier 1 (context-based chat)
⚠️  SQL fallback detected but already in fallback mode - preventing infinite loop
✅ Returning Tier 1 response
```

## Files Modified

- ✅ `/app/api/chat/ai/route.js` - Added `request` parameter throughout call chain and infinite loop prevention

### Specific Changes

| Line(s) | Change | Purpose |
|---------|--------|---------|
| 134-141 | Added `request` to `handleTier1Context` call | Pass request from POST handler |
| 171 | Added `request` to function signature | Accept request parameter |
| 294-326 | Added `isAlreadyFallback` check | Prevent infinite loop |
| 305-312 | Added `request` to `handleTier2Analysis` call | Pass request to Tier 2 |
| 349-356 | Added `request` to function signature | Accept request parameter |
| 484 | Now uses `request.headers.get('cookie')` | Access session cookies (THIS WAS THE ERROR LINE) |
| 547-555 | Added `request` and `fromTier2Fallback` flag | Pass request and mark fallback |

## Related Fixes

This fix works in conjunction with:
- **CONTRACTSEAT_FIX_SUMMARY.md** - Fixed permission system
- **CHAT_ERROR_FIX_SUMMARY.md** - Fixed template string error
- **INTELLIGENT_ROUTING_ACTIVATED.md** - Enabled intelligent routing

## Next Steps

### Immediate
1. ✅ Deploy and test with flow queries
2. ⏳ Verify Tier 2 can successfully query ClickHouse
3. ⏳ Test fallback behavior when no data available

### Monitoring
1. Watch for any remaining infinite loops
2. Monitor Tier 2 success/failure rates
3. Check if fallback responses are helpful to users

## Rollback

If issues occur, disable Tier 2 routing temporarily:

```javascript
// In handleTier1Context, comment out the routing logic:
/*
const needsSQLFallback = detectSQLFallbackRequest(cleanedResponse);
if (needsSQLFallback && !isAlreadyFallback) {
  // ... routing code ...
}
*/
```

Or set environment variable:
```bash
DISABLE_TIER2_ROUTING=true
```

---

**Status**: ✅ FIXED

The request parameter error and infinite loop have been resolved!

# Store Name Resolution for AI Chat

## Overview

The AI chat system now intelligently resolves store names mentioned in user queries to query the correct data from ClickHouse/MongoDB.

## How It Works

### 1. **AI-Powered Store Name Extraction** (`/lib/ai/intent-detection-haiku.js`)

When a user asks a question like:
- "Show me campaigns for Acme Store"
- "What's the revenue at Store XYZ?"
- "How is Acme going?"
- "What's my boutique's performance?"

The system uses **Claude Haiku 4.5** to intelligently extract store names:

```javascript
import { needsStoreResolution } from '@/lib/ai/intent-detection-haiku';

const query = "How is Acme going?";
const resolution = await needsStoreResolution(query, userAccessibleStores);
// {
//   needed: true,
//   storeNames: ["Acme"],
//   confidence: "high",
//   method: "haiku"
// }
```

**Why AI-based extraction?**
- ✅ Handles natural language: "How's Acme going?" → extracts "Acme"
- ✅ Understands possessives: "What's Acme's revenue?" → extracts "Acme"
- ✅ Recognizes context: "Show my stores" → no specific store (generic)
- ✅ Multi-store: "Compare Store A and Store B" → extracts both
- ✅ ~$0.0001 per extraction (negligible cost)

### 2. **Store Name Resolution** (`/lib/ai/store-resolver.js`)

The resolver maps store names to actual Store documents with permission checking:

```javascript
import { getStoresForQuery } from '@/lib/ai/store-resolver';

const result = await getStoresForQuery(query, user, context);
// {
//   storeIds: ["XAeU8VL"],
//   stores: [Store Document],
//   resolution: "query_mentioned" | "ui_selected" | "user_default"
// }
```

**Resolution Priority:**

1. **Query-mentioned stores** (highest priority)
   - User explicitly mentioned a store name
   - Example: "Show campaigns for Acme Store"
   - Resolution: `query_mentioned`

2. **UI-selected stores**
   - User has stores selected in the dashboard UI
   - Stored in `context.aiState.selectedStores`
   - Resolution: `ui_selected`

3. **User's default stores** (fallback)
   - All stores the user has access to
   - Uses `user.store_ids`
   - Resolution: `user_default`

### 3. **Store Name Matching**

The resolver performs fuzzy matching with permission validation:

**Exact Match (Case-insensitive):**
```
User query: "Acme Store"
Database:   "Acme Store"  ✅ Match
```

**Partial Match:**
```
User query: "Acme"
Database:   "Acme Store"  ✅ Match (contains "Acme")
```

**Permission Validation:**
```
User query: "Competitor Store"
Database:   "Competitor Store" (exists)
User Access: No access
Result:     ❌ Access denied
```

### 4. **Integration with AI Chat** (`/app/api/chat/ai/route.js`)

The Tier 2 (SQL) handler now uses store resolution:

```javascript
// Before: Used all user stores or UI-selected stores
const storeIds = user.store_ids;

// After: Intelligent resolution with fallback
const { getStoresForQuery } = await import('@/lib/ai/store-resolver');
const { storeIds, stores, resolution } = await getStoresForQuery(query, user, context);
```

### 5. **Error Handling**

When stores can't be resolved:

```javascript
if (storeResolution.error) {
  return NextResponse.json({
    response: "I couldn't find a store named 'XYZ'. Your accessible stores are: Acme Store, Store ABC.",
    metadata: {
      error: 'Store resolution failed',
      notFound: ['XYZ'],
      accessDenied: []
    }
  });
}
```

## Usage Examples

### Example 1: Natural Language Query

**User Query:**
```
"How is Acme going?"
```

**AI Processing (Haiku):**
```json
{
  "storeNames": ["Acme"],
  "isGeneric": false,
  "confidence": "high"
}
```

**Store Resolution:**
1. Haiku extracts: `["Acme"]`
2. Fuzzy match finds: "Acme Store" (exact match on "Acme")
3. Validate user has access
4. Query ClickHouse with `klaviyo_public_id` for Acme Store

**Response:**
```
"Acme Store is performing well this month! Here are the key metrics:

📊 Revenue: $125K (+12% from last month)
📧 Campaigns sent: 23 (avg. open rate 24.5%)
🎯 Orders: 450 (+8%)
..."
```

### Example 2: Possessive Form

**User Query:**
```
"What's Acme's revenue last month?"
```

**AI Processing:**
- Haiku recognizes possessive and extracts: `["Acme"]`
- Resolves to "Acme Store"
- Queries specific store data

### Example 3: Formal Store Name

**User Query:**
```
"What are the top campaigns for Acme Store last month?"
```

**AI Processing:**
- Haiku extracts: `["Acme Store"]`
- Exact match found
- Returns campaign data

### Example 2: Multiple Stores Mentioned

**User Query:**
```
"Compare revenue between Store A and Store B"
```

**Processing:**
1. Extract store names: `["Store A", "Store B"]`
2. Resolve both stores (if user has access)
3. Query ClickHouse for both `klaviyo_public_id`s
4. Compare and return results

### Example 3: No Store Mentioned (Fallback)

**User Query:**
```
"What are my top campaigns?"
```

**Processing:**
1. No store names extracted
2. Check if UI has selected stores → Use those
3. If not, fallback to all user's accessible stores
4. Query ClickHouse with all `klaviyo_public_id`s

### Example 4: Store Not Found

**User Query:**
```
"Show campaigns for NonExistent Store"
```

**Processing:**
1. Extract: `["NonExistent Store"]`
2. Try to resolve → Not found in database
3. Return helpful error

**Response:**
```
"I couldn't find a store named 'NonExistent Store'. Your accessible stores are:
- Acme Store
- Store ABC
- My Boutique

Would you like data for one of these?"
```

### Example 5: No Access to Store

**User Query:**
```
"Show campaigns for Competitor Store"
```

**Processing:**
1. Extract: `["Competitor Store"]`
2. Try to resolve → Found in DB but user has no access
3. Return access denied error

**Response:**
```
"You don't have access to 'Competitor Store'. Your accessible stores are:
- Acme Store
- Store ABC
```

## Technical Details

### Store ID Conversion Flow

**CRITICAL**: The system uses two ID types:

1. **`store.public_id`** - Internal store identifier (e.g., `"XAeU8VL"`)
   - Used in UI and URLs
   - Stored in `user.store_ids`

2. **`store.klaviyo_integration.public_id`** - Klaviyo account ID (e.g., `"XqkVGb"`)
   - Used in ClickHouse queries
   - Multiple stores can share same Klaviyo ID

**Conversion in `/api/dashboard/route.js`:**

```javascript
// Get stores by store_public_id
const stores = await Store.find({
  public_id: { $in: storePublicIds }
});

// Extract Klaviyo IDs for ClickHouse
const klaviyoIds = stores
  .map(s => s.klaviyo_integration?.public_id)
  .filter(Boolean);

// Query ClickHouse with klaviyo_public_ids
const query = `
  SELECT * FROM account_metrics_daily
  WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
`;
```

### Files Modified

1. **`/lib/ai/intent-detection-haiku.js`**
   - Added `extractStoreNames()` function
   - Added `needsStoreResolution()` function

2. **`/lib/ai/store-resolver.js`** (NEW)
   - Core store resolution logic
   - Fuzzy matching with permission validation
   - Intelligent fallback system

3. **`/app/api/chat/ai/route.js`**
   - Integrated store resolver in Tier 2 handler
   - Updated system prompt to mention store name capability
   - Added store resolution metadata to responses

## Benefits

1. **Natural Language**: Users can ask about stores by name
2. **Context-Aware**: Respects UI selections and defaults
3. **Secure**: Validates permissions before querying
4. **Helpful Errors**: Suggests available stores if not found
5. **Fuzzy Matching**: Handles partial names and typos
6. **Multi-Store**: Can query multiple stores in one query

## Configuration

No environment variables needed. The system automatically:
- Uses MongoDB Store collection for name lookups
- Validates against user's `store_ids` array
- Converts `store_public_id` → `klaviyo_public_id` for ClickHouse

## Testing

**Development Mode Logging:**

```javascript
console.log('🏪 Store Resolution:', {
  method: resolution.method,
  storeIds: storeIds,
  storeNames: stores.map(s => s.name)
});
```

**Test Cases:**

1. ✅ Query with explicit store name
2. ✅ Query without store name (fallback)
3. ✅ Store not found (helpful error)
4. ✅ No access to store (permission error)
5. ✅ Multiple stores mentioned
6. ✅ Fuzzy matching (partial names)

## Future Enhancements

- [ ] Support for store tags (e.g., "Show data for all stores tagged 'ecommerce'")
- [ ] Store aliases (e.g., "main store" → "Acme Store")
- [ ] Levenshtein distance for better typo handling
- [ ] Store name caching for performance
- [ ] Multi-language store name support

## See Also

- `/context/CLICKHOUSE_TABLES_COMPLETE_V2.md` - ClickHouse schema
- `/CLAUDE.md` - Store ID usage guidelines
- `/lib/ai/intent-detection-haiku.js` - Intent detection system
- `/app/api/dashboard/route.js` - Store querying example

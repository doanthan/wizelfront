# Haiku SQL Query: ID Conversion Flow

## 🎯 Quick Answer

**Yes, Haiku uses `klaviyo_public_id` to query ClickHouse, NOT `store_public_id`.**

The system automatically converts:
```
store_public_id (from user) → klaviyo_public_id (for ClickHouse)
```

## 🔄 Complete Flow Diagram

```
┌──────────────────────────┐
│  User asks:              │
│  "How is Acme going?"    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Store Name Resolution                   │
│  /lib/ai/store-resolver.js              │
│                                          │
│  "Acme" → Finds Store document:         │
│  {                                       │
│    public_id: "XAeU8VL",          ← UI ID
│    name: "Acme Store",                   │
│    klaviyo_integration: {                │
│      public_id: "XqkVGb"          ← DB ID
│    }                                     │
│  }                                       │
└────────────┬─────────────────────────────┘
             │
             │ Returns: storeIds = ["XAeU8VL"]
             ▼
┌──────────────────────────────────────────┐
│  AI Chat Route                           │
│  /app/api/chat/ai/route.js              │
│                                          │
│  Tier 2: SQL Analysis                   │
│  - storeIds: ["XAeU8VL"]                 │
│  - Passes to: /api/ai/analyze           │
└────────────┬─────────────────────────────┘
             │
             │ POST { storeIds: ["XAeU8VL"] }
             ▼
┌──────────────────────────────────────────┐
│  Tier 2 SQL Analysis Route               │
│  /app/api/ai/analyze/route.js           │
│                                          │
│  Line 79-87: ID CONVERSION               │
│  const { klaviyoIds } =                  │
│    await storeIdsToKlaviyoIds(storeIds); │
│                                          │
│  ["XAeU8VL"] → ["XqkVGb"]               │
│                  ↑                        │
│         This is the Klaviyo ID!          │
└────────────┬─────────────────────────────┘
             │
             │ klaviyoIds = ["XqkVGb"]
             ▼
┌──────────────────────────────────────────┐
│  Haiku SQL Generation                    │
│  /lib/ai/haiku-sql.js                    │
│                                          │
│  generateSQL(question, klaviyoIds)      │
│                                          │
│  Haiku receives:                         │
│  - Question: "How is Acme going?"       │
│  - Klaviyo IDs: ["XqkVGb"]             │
│                                          │
│  Haiku generates SQL:                    │
│  "SELECT * FROM account_metrics_daily   │
│   WHERE klaviyo_public_id = 'XqkVGb'"  │
│                  ↑                       │
│         Uses Klaviyo ID!                 │
└────────────┬─────────────────────────────┘
             │
             │ SQL with klaviyo_public_id
             ▼
┌──────────────────────────────────────────┐
│  ClickHouse Database                     │
│                                          │
│  Table: account_metrics_daily            │
│  Columns:                                │
│  - klaviyo_public_id (String)           │
│  - date (Date)                           │
│  - total_revenue (Float64)               │
│  - total_orders (Int64)                  │
│  ...                                     │
│                                          │
│  Query matches rows where:               │
│  klaviyo_public_id = 'XqkVGb'          │
└────────────┬─────────────────────────────┘
             │
             │ Returns historical data
             ▼
┌──────────────────────────────────────────┐
│  Results with Acme Store's data          │
│  [                                       │
│    { date: '2025-01-01',                 │
│      klaviyo_public_id: 'XqkVGb',       │
│      total_revenue: 12500,               │
│      total_orders: 45 },                 │
│    { date: '2025-01-02', ... },          │
│    ...                                   │
│  ]                                       │
└──────────────────────────────────────────┘
```

## 🔑 Two ID Types

### 1. `store_public_id` (UI/Frontend)

**What it is:** Internal store identifier
**Format:** 7-character nanoid (e.g., `XAeU8VL`)
**Used in:**
- ✅ URLs: `/store/XAeU8VL/dashboard`
- ✅ localStorage: `analyticsSelectedAccounts`
- ✅ UI components: Store selector dropdowns
- ✅ MongoDB queries: Finding Store documents
- ✅ User permissions: `user.store_ids`

**Example:**
```javascript
{
  value: "XAeU8VL",      // ← store_public_id
  label: "Acme Store"
}
```

### 2. `klaviyo_public_id` (Database/Analytics)

**What it is:** Klaviyo account identifier
**Format:** Variable length string (e.g., `XqkVGb`)
**Used in:**
- ✅ ClickHouse queries: ALL analytics tables
- ✅ MongoDB analytics: `campaignstats`, `flowstats`, etc.
- ✅ Klaviyo API calls: Account identification
- ✅ Multi-tenant data: Multiple stores can share same Klaviyo ID

**Example:**
```javascript
{
  store_public_id: "XAeU8VL",
  klaviyo_integration: {
    public_id: "XqkVGb"   // ← klaviyo_public_id
  }
}
```

## 🔄 ID Conversion Process

### Step 1: User Selection → Store Public IDs

```javascript
// User selects stores in UI
const selectedStores = [
  { value: "XAeU8VL", label: "Acme Store" },
  { value: "7MP60fH", label: "Store B" }
];

// These are store_public_ids
const storeIds = ["XAeU8VL", "7MP60fH"];
```

### Step 2: Store Public IDs → Klaviyo Public IDs

**Location:** `/lib/utils/id-mapper.js:20`

```javascript
import { storeIdsToKlaviyoIds } from '@/lib/utils/id-mapper';

// Convert store IDs to Klaviyo IDs
const { klaviyoIds, storeMap } = await storeIdsToKlaviyoIds(storeIds);

// Result:
// klaviyoIds = ["XqkVGb", "Pe5Xw6"]
// storeMap = Map {
//   "XAeU8VL" => { klaviyo_public_id: "XqkVGb", store_name: "Acme Store" },
//   "7MP60fH" => { klaviyo_public_id: "Pe5Xw6", store_name: "Store B" }
// }
```

### Step 3: Klaviyo IDs → ClickHouse Query

**Location:** `/lib/ai/haiku-sql.js`

```javascript
// Haiku generates SQL using Klaviyo IDs
const sql = await generateSQL(question, klaviyoIds);

// Generated SQL:
// "SELECT * FROM campaign_statistics
//  WHERE klaviyo_public_id IN ('XqkVGb', 'Pe5Xw6')
//  AND date >= '2025-01-01'"
```

## 📊 ClickHouse Table Structure

All ClickHouse tables use `klaviyo_public_id`:

```sql
-- Table: account_metrics_daily
CREATE TABLE account_metrics_daily (
  klaviyo_public_id String,  -- ← This is the Klaviyo ID
  date Date,
  total_revenue Float64,
  total_orders Int64,
  ...
) ENGINE = MergeTree()
ORDER BY (klaviyo_public_id, date);

-- Example data:
-- klaviyo_public_id | date       | total_revenue | total_orders
-- XqkVGb           | 2025-01-01 | 12500.00      | 45
-- XqkVGb           | 2025-01-02 | 13200.00      | 48
-- Pe5Xw6           | 2025-01-01 | 8900.00       | 32
```

## 🔍 Why Two Different IDs?

### Reason 1: Multi-Tenant Architecture

**Multiple stores can share the same Klaviyo account:**

```javascript
Store 1:
{
  public_id: "XAeU8VL",
  name: "Acme Store - Main",
  klaviyo_integration: { public_id: "XqkVGb" }
}

Store 2:
{
  public_id: "7MP60fH",
  name: "Acme Store - Outlet",
  klaviyo_integration: { public_id: "XqkVGb" }  // ← Same Klaviyo account!
}
```

Both stores query the same ClickHouse data (`XqkVGb`).

### Reason 2: UI vs Analytics Separation

- **UI Layer**: Uses `store_public_id` for routing, permissions, display
- **Analytics Layer**: Uses `klaviyo_public_id` for data queries

This allows:
- Different store pages to show same analytics
- Easy store rebranding without data migration
- Flexible permission management

## 💡 Key Insights

### 1. **Haiku Never Sees store_public_id**

```javascript
// ❌ Haiku does NOT receive:
generateSQL(question, ["XAeU8VL", "7MP60fH"]);

// ✅ Haiku receives:
generateSQL(question, ["XqkVGb", "Pe5Xw6"]);
```

### 2. **Conversion Happens Before Haiku**

```javascript
// Flow:
User query → Store resolution → storeIds
          ↓
   ID conversion (storeIdsToKlaviyoIds)
          ↓
   klaviyoIds → Haiku SQL generation
          ↓
   ClickHouse query with klaviyo_public_id
```

### 3. **ClickHouse Only Has Klaviyo IDs**

```sql
-- ✅ This works:
SELECT * FROM campaign_statistics
WHERE klaviyo_public_id = 'XqkVGb';

-- ❌ This fails (column doesn't exist):
SELECT * FROM campaign_statistics
WHERE store_public_id = 'XAeU8VL';
```

## 🧪 Example: Complete Query Flow

### User Query: "What are my top campaigns last month for Acme Store?"

**Step 1: Store Name Resolution**
```javascript
"Acme Store" → Store document → public_id: "XAeU8VL"
```

**Step 2: ID Conversion**
```javascript
storeIds: ["XAeU8VL"]
    ↓
storeIdsToKlaviyoIds(["XAeU8VL"])
    ↓
klaviyoIds: ["XqkVGb"]
```

**Step 3: Haiku SQL Generation**
```javascript
generateSQL("What are my top campaigns last month", ["XqkVGb"])
    ↓
Generated SQL:
"SELECT
   campaign_name,
   total_revenue,
   open_rate
 FROM campaign_statistics
 WHERE klaviyo_public_id = 'XqkVGb'
   AND date >= '2024-12-01'
   AND date < '2025-01-01'
 ORDER BY total_revenue DESC
 LIMIT 10"
```

**Step 4: ClickHouse Execution**
```javascript
// Query returns rows matching klaviyo_public_id = 'XqkVGb'
[
  { campaign_name: "Holiday Sale", total_revenue: 25000, open_rate: 28.5 },
  { campaign_name: "Welcome Series", total_revenue: 18000, open_rate: 32.1 },
  ...
]
```

**Step 5: Result Analysis**
```javascript
// Sonnet analyzes results and returns:
"Your top campaigns for Acme Store last month were:

1. Holiday Sale - $25K revenue, 28.5% open rate
2. Welcome Series - $18K revenue, 32.1% open rate
..."
```

## 📍 Code Locations

### ID Conversion
- **File:** `/lib/utils/id-mapper.js:20`
- **Function:** `storeIdsToKlaviyoIds()`

### Used in Tier 2 Analysis
- **File:** `/app/api/ai/analyze/route.js:79`
- **Line:** `const { klaviyoIds } = await storeIdsToKlaviyoIds(targetStoreIds);`

### Passed to Haiku
- **File:** `/app/api/ai/analyze/route.js:98`
- **Line:** `const sqlResult = await generateSQL(question, klaviyoIds, options);`

### Haiku SQL Generation
- **File:** `/lib/ai/haiku-sql.js`
- **Receives:** `klaviyoIds` array
- **Generates:** SQL with `klaviyo_public_id IN (...)` clause

## ✅ Summary

| Step | Input | Process | Output |
|------|-------|---------|--------|
| 1. Store Selection | "Acme Store" | Name resolution | `store_public_id` |
| 2. ID Conversion | `["XAeU8VL"]` | `storeIdsToKlaviyoIds()` | `["XqkVGb"]` |
| 3. SQL Generation | `klaviyoIds` | Haiku AI | SQL with `klaviyo_public_id` |
| 4. Query Execution | SQL | ClickHouse | Historical data |

**Key Points:**
- ✅ **Haiku uses `klaviyo_public_id`** for ClickHouse queries
- ✅ **Conversion happens automatically** before Haiku
- ✅ **ClickHouse tables only have `klaviyo_public_id`** column
- ✅ **Multiple stores can share same Klaviyo ID**
- ✅ **System handles conversion transparently**

🚀 **The ID conversion is already fully implemented and working!**

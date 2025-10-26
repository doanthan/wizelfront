# AI Store Context - Tiered Implementation

## Overview

The AI Store Context Builder provides intelligent, tiered context for your AI chatbot based on the number of stores being analyzed. This ensures optimal token usage while providing rich qualitative and quantitative context.

## Quick Start

```javascript
import { buildStoreContext, buildSystemPrompt } from '@/lib/ai-store-context';

// In your AI chatbot route
const stores = await Store.find({ public_id: { $in: storeIds } })
    .select('public_id name store_description adaptive_rfm_config');

const storeContext = buildStoreContext(stores, userMessage);
const systemPrompt = buildSystemPrompt(storeContext);

// Send to Claude with systemPrompt
```

## Tiered Context Modes

### 🎯 Mode 1: Single Store (1 store)
**Context Level**: Full detailed context
**Tokens**: ~1,000
**Includes**:
- Complete store description (summary, industry, region, demographic)
- Marketing strengths and unique traits
- Full performance metrics (customers, AOV, repeat rate, LTV)
- Business stage and model type

**Example**:
```javascript
storeIds: ["XqkVGb"]
// Returns: { mode: 'single', store: { ...full context } }
```

---

### 👥 Mode 2: Small Group (2-5 stores)
**Context Level**: Full context for all stores
**Tokens**: ~3,000-5,000
**Includes**: Full detailed context for each store

**Example**:
```javascript
storeIds: ["XqkVGb", "7MP60fH", "rZResQK"]
// Returns: { mode: 'small_group', stores: [...full contexts] }
```

---

### 📊 Mode 3: Medium Group (6-20 stores)
**Context Level**: Full context for all OR filtered subset
**Tokens**: ~4,000-8,000

**Behavior**:
- If no filter: Full context for all
- If query mentions stores: Full context for mentioned, summary for rest
- If query filters (top/bottom N): Full context for filtered, summary for rest

**Example**:
```javascript
// 15 stores total
message: "Analyze my bottom 3 performing stores"
// Returns: {
//   mode: 'filtered',
//   focus_stores: [3 stores with full context],
//   other_stores: [12 stores with summary]
// }
```

---

### 🏢 Mode 4: Large Filtered (20+ stores with filter)
**Context Level**: Full context for filtered stores, minimal for rest
**Tokens**: ~5,500

**Example**:
```javascript
// 25 stores total
message: "What's working for my top 5 revenue generators?"
// Returns: {
//   mode: 'large_filtered',
//   focus_stores: [5 stores with full context],
//   all_stores_summary: [25 stores with minimal context]
// }
```

---

### 📋 Mode 5: Large Summary (20+ stores, no filter)
**Context Level**: Minimal context only
**Tokens**: ~2,000
**Includes**: Store ID, name, industry, basic metrics only

**Example**:
```javascript
// 30 stores, generic question
message: "Give me portfolio insights"
// Returns: {
//   mode: 'large_summary',
//   stores: [30 minimal contexts],
//   note: 'Please specify which stores to analyze'
// }
```

## Context Levels Explained

### 📝 Full Context (~800 tokens per store)
```javascript
{
  store_id: "XqkVGb",
  name: "Premium Supplements",

  // Qualitative (from store_description)
  summary: "Premium supplement brand...",
  industry: "Health & Wellness - Supplements",
  region: "Australia",
  demographic: { age: "25-40", gender: "Women", income: "Affluent" },
  strengths: ["Strong flows", "High engagement"],
  stage: "Well-established brand",
  unique_traits: ["Third-party testing", "Sustainability focus"],
  estimated_ltv: { average_value: 400, purchases: 2.8 },

  // Quantitative (from RFM)
  performance: {
    total_customers: 2272,
    total_orders: 2453,
    avg_order_value: 112.93,
    repeat_rate: 7.22,
    orders_per_customer: 1.08,
    business_model: "low_repeat"
  }
}
```

### 📊 Summary Context (~150 tokens per store)
```javascript
{
  store_id: "XqkVGb",
  name: "Premium Supplements",
  industry: "Health & Wellness",
  stage: "Well-established",
  metrics: {
    customers: 2272,
    aov: 112.93,
    repeat_rate: 7.22,
    model: "low_repeat"
  }
}
```

### 📌 Minimal Context (~50 tokens per store)
```javascript
{
  id: "XqkVGb",
  name: "Premium Supplements",
  industry: "Health & Wellness",
  customers: 2272,
  aov: 112.93,
  repeat_rate: 7.22
}
```

## Smart Filtering

The context builder automatically detects intent and filters stores:

### 🔻 Bottom Performers
**Triggers**: "bottom", "worst", "lowest", "underperforming"
**Sorts by**: Revenue (AOV × Total Orders), ascending

```javascript
"Help me with my 3 worst performing stores"
// Selects bottom 3 by revenue
```

### 🔺 Top Performers
**Triggers**: "top", "best", "highest", "leading"
**Sorts by**: Revenue (AOV × Total Orders), descending

```javascript
"What's working for my top 5 stores?"
// Selects top 5 by revenue
```

### 🔄 Low Repeat Rate
**Triggers**: "low repeat", "high churn", "poor retention"
**Sorts by**: Repeat rate, ascending

```javascript
"Which stores have retention problems?"
// Selects stores with lowest repeat rates
```

### 💎 High AOV / Premium
**Triggers**: "high aov", "premium", "luxury", "expensive"
**Sorts by**: Average Order Value, descending

```javascript
"Retention strategies for my premium brands?"
// Selects stores with highest AOV
```

### 🏷️ Mentioned Stores
**Detects**: Store names or IDs in the query
**Prioritizes**: Mentioned stores get full context

```javascript
"How is Premium Supplements and Athletic Wear doing?"
// Extracts both store names, gives full context
```

## Token Budgets by Scenario

| Scenario | Stores | Mode | Tokens | Notes |
|----------|--------|------|--------|-------|
| Single store | 1 | single | ~1,000 | Full context |
| Small team | 3 | small_group | ~3,000 | Full for all |
| Agency portfolio | 15 | filtered | ~4,000 | Full for 5, summary for 10 |
| Large agency | 25 (filtered) | large_filtered | ~5,500 | Full for 5, minimal for 20 |
| Large agency | 30 (no filter) | large_summary | ~2,000 | Minimal for all |
| Enterprise | 50+ | large_summary | ~3,500 | Minimal, asks to specify |

## Integration Example

```javascript
// app/api/ai/chat/route.js
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildStoreContext, buildSystemPrompt } from '@/lib/ai-store-context';

export async function POST(request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, storeIds } = await request.json();

    await connectToDatabase();
    const stores = await Store.find({
        public_id: { $in: storeIds }
    }).select('public_id name store_description adaptive_rfm_config');

    // 🎯 Build intelligent tiered context
    const storeContext = buildStoreContext(stores, message);
    const systemPrompt = buildSystemPrompt(storeContext);

    // Send to Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: message }]
        })
    });

    return NextResponse.json(await response.json());
}
```

## Benefits

✅ **Automatic Scaling**: Handles 1-100+ stores intelligently
✅ **Token Efficient**: Uses 2k-6k tokens regardless of portfolio size
✅ **Smart Filtering**: Auto-detects intent (top/bottom/mentioned stores)
✅ **Rich Context**: Combines qualitative (store_description) + quantitative (RFM)
✅ **Agency-Friendly**: Perfect for multi-store portfolios
✅ **Personalized**: Industry, demographic, and business stage context

## Files

- **Implementation**: `/lib/ai-store-context.js`
- **Example Usage**: `/lib/ai-store-context-example.js`
- **Documentation**: This file

## Next Steps

1. ✅ Store model has `store_description` field
2. ✅ Tiered context builder created
3. 🔲 Populate `store_description` for existing stores (AI analysis or manual)
4. 🔲 Integrate into AI chatbot routes
5. 🔲 Test with different portfolio sizes

---

**Pro Tip**: The system automatically adapts to portfolio size. You don't need to change anything when a client adds more stores!

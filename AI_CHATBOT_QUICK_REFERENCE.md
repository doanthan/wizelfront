# AI Chatbot Quick Reference

## 🎯 Use the Two-Tier System

```javascript
POST /api/ai/chat-tiered
```

**Flow**: User Query → Haiku (identifies stores) → Sonnet (analyzes with tiered context)

## 📊 What Haiku Detects

| User Says | Haiku Identifies |
|-----------|------------------|
| "How is Premium Supplements doing?" | Store by name |
| "Check on the supplement powerhouse" | Store by nickname |
| "Analyze XqkVGb and 7MP60fH" | Stores by ID |
| "My Australian brands" | Stores by region |
| "My bottom 3 performers" | Bottom 3 by revenue |
| "My top 5 stores" | Top 5 by revenue |
| "Which stores need retention help?" | Lowest repeat rates |
| "My premium brands" | Highest AOV stores |

## 🔢 Context Modes (Automatic)

| Stores Identified | Mode | Context | Tokens |
|-------------------|------|---------|--------|
| 1 | single | Full detail | ~1,000 |
| 2-5 | small_group | Full for all | ~3,000 |
| 6-20 | medium/filtered | Full or summary | ~4,000 |
| 20+ (filtered) | large_filtered | Full for 5, minimal for rest | ~5,500 |
| 20+ (no filter) | large_summary | Minimal, asks to specify | ~2,000 |

## 💰 Cost Per Query

| Scenario | Tokens | Cost |
|----------|--------|------|
| 1 store identified | ~1,400 | $0.004 |
| 3 stores identified | ~2,800 | $0.008 |
| 5 stores identified | ~4,400 | $0.013 |
| 20+ stores (generic) | ~2,400 | $0.007 |

**vs Traditional (30 stores, all context): ~24,000 tokens, $0.072**

## 🚀 Example Usage

```javascript
// Frontend
const response = await fetch('/api/ai/chat-tiered', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userInput,
    storeIds: allUserStores.map(s => s.public_id)
  })
});

const result = await response.json();

// Show which stores were analyzed
console.log(`Analyzed: ${result.stores_analyzed.identified_stores}`);
console.log(`Filter: ${result.stores_analyzed.filter_type}`);
console.log(`Confidence: ${result.stores_analyzed.confidence}`);

// Display AI response
displayMessage(result.message);
```

## 🧪 Test Queries

```javascript
// Specific store by name
"How is Premium Supplements performing?"

// Specific stores by nickname
"Update me on the supplement powerhouse and the fitness brand"

// Regional filter
"What's working for my Australian brands?"

// Performance filter
"Help me improve my bottom 3 performing stores"

// Top performers
"What's the secret to my top 5 revenue generators?"

// Retention issues
"Which stores have low repeat purchase rates?"

// Premium/luxury
"Retention strategies for my premium brands?"

// Generic (will ask for clarification)
"Give me portfolio insights"
```

## 📋 Response Structure

```javascript
{
  // AI's answer
  "message": "Your Australian supplement brands...",

  // Which stores were identified
  "stores_analyzed": {
    "identified_stores": ["XqkVGb", "7MP60fH"],
    "filter_type": "specific",
    "filter_count": 2,
    "confidence": "high",
    "reasoning": "Matched Australia + Supplements"
  },

  // Context metadata
  "context": {
    "mode": "small_group",
    "total_available": 30,
    "stores_in_context": 2,
    "estimated_tokens": "~1,600"
  },

  // Token usage
  "usage": {
    "haiku_tokens": "~400",
    "sonnet_input_tokens": 1653,
    "sonnet_output_tokens": 847,
    "total_input_tokens": 2053
  }
}
```

## 🛠️ Store Fields Required

Ensure stores have:

```javascript
// Required for identification
{
  public_id: String,
  name: String,

  // Optional but improves identification
  store_description: {
    store_nickname: String,      // "The Supplement Powerhouse"
    primary_industry: String,    // "Health & Wellness - Supplements"
    region: String,              // "Australia"
    summary: String,             // For context
    // ... other fields
  },

  // Required for filtering
  adaptive_rfm_config: {
    business_characteristics: {
      total_customers: Number,
      total_orders: Number,
      avg_order_value: Number,
      repeat_purchase_pct: Number
      // ... other metrics
    }
  }
}
```

## 🎯 Best Practices

1. **Always pass ALL user's stores to the endpoint**
   - Haiku will filter them automatically
   - Don't pre-filter on the frontend

2. **Show which stores were analyzed**
   - Display `stores_analyzed.identified_stores`
   - Show `stores_analyzed.reasoning`

3. **Handle "Please specify" responses**
   - When `filter_type === 'all'` and many stores
   - Prompt user to be more specific

4. **Monitor confidence scores**
   - Log when `confidence === 'low'`
   - May indicate unclear query

5. **Set store nicknames**
   - Helps Haiku identify stores naturally
   - e.g., "the supplement brand" → store_nickname

## 🔍 Debugging

```javascript
// Check what Haiku identified
console.log('Haiku identified:', response.stores_analyzed);

// Check context mode
console.log('Context mode:', response.context.mode);

// Check token usage
console.log('Total tokens:', response.usage.total_input_tokens);

// Check confidence
if (response.stores_analyzed.confidence === 'low') {
  console.warn('Low confidence - query may be unclear');
}
```

## 📁 Files

- `/lib/ai-store-identifier.js` - Haiku identification
- `/lib/ai-store-context.js` - Context builder
- `/app/api/ai/chat-tiered/route.js` - Endpoint
- `/HAIKU_SONNET_TIERED_SYSTEM.md` - Full docs

---

**Quick Start**: Use `/api/ai/chat-tiered` with user's message and all their store IDs. Haiku handles the rest! 🚀

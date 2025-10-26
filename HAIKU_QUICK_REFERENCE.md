# Haiku Quick Reference: Feeding Data

## 🎯 Quick Answer

**Q: Where do I feed data to Haiku?**

**A: In the `systemPrompt` parameter when calling Haiku:**

```javascript
const systemPrompt = `You are a store name extractor...

USER'S ACCESSIBLE STORES:
${userAccessibleStores.map(s => `- ${s.name}`).join('\n')}

Extract store names from the query.`;

await makeOpenRouterRequest({
  model: 'anthropic/claude-haiku-4.5',
  messages: [
    { role: 'system', content: systemPrompt }, // ← Data goes here
    { role: 'user', content: userQuery }
  ]
});
```

## 📍 Two Places Haiku Gets Data

### 1. **Intent Detection** (`detectIntentWithHaiku`)

**File:** `/lib/ai/intent-detection-haiku.js:28`

```javascript
export async function detectIntentWithHaiku(query, context = {}, options = {}) {
  // Extract from context
  const hasOnScreenContext = context?.aiState?.data_context != null;
  const currentPage = context?.aiState?.currentPage || 'unknown';

  // Build system prompt with context
  const systemPrompt = `...
  CONTEXT:
  - Current page: ${currentPage}
  - Has on-screen data: ${hasOnScreenContext ? 'YES' : 'NO'}
  - Selected stores: ${context.aiState.selectedStores.map(s => s.label).join(', ')}
  - Date range: ${context.aiState.dateRange.preset}
  `;
}
```

**Add more data here:**
```javascript
// Add on-screen metrics
${context?.aiState?.data?.summary ? `
ON-SCREEN METRICS:
- Revenue: $${context.aiState.data.summary.totalRevenue}
- Orders: ${context.aiState.data.summary.totalOrders}
` : ''}

// Add top campaigns
${context?.aiState?.data?.topCampaigns ? `
TOP CAMPAIGNS:
${context.aiState.data.topCampaigns.slice(0, 3).map(c =>
  `- ${c.name}: ${c.openRate}% open`
).join('\n')}
` : ''}
```

### 2. **Store Name Extraction** (`extractStoreNamesWithHaiku`)

**File:** `/lib/ai/intent-detection-haiku.js:300`

```javascript
export async function extractStoreNamesWithHaiku(query, userAccessibleStores = []) {
  const systemPrompt = `You are a store name extractor...

  ${userAccessibleStores.length > 0 ? `
  USER'S ACCESSIBLE STORES:
  ${userAccessibleStores.map(s => `- ${s.name}`).join('\n')}
  ` : ''}
  `;
}
```

**Add more store context:**
```javascript
${userAccessibleStores.length > 0 ? `
USER'S ACCESSIBLE STORES:
${userAccessibleStores.map(s =>
  `- ${s.name} (${s.hasKlaviyo ? 'Active' : 'No Klaviyo'})`
).join('\n')}

Total stores: ${userAccessibleStores.length}
` : ''}
```

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│  Dashboard Page │
│  /dashboard     │
└────────┬────────┘
         │ updateAIState()
         ▼
┌─────────────────────────┐
│    AI Context           │
│  - selectedStores       │
│  - dateRange            │
│  - data.summary         │
│  - data.topCampaigns    │
└────────┬────────────────┘
         │ passed as 'context' param
         ▼
┌─────────────────────────┐
│  detectIntentWithHaiku  │
│  (intent-detection)     │
└────────┬────────────────┘
         │ builds systemPrompt
         ▼
┌─────────────────────────┐
│  Haiku 4.5 AI Model     │
│  Receives:              │
│  - System prompt (data) │
│  - User query           │
└────────┬────────────────┘
         │ returns decision
         ▼
┌─────────────────────────┐
│  AI Response            │
│  - Tier decision        │
│  - Extracted stores     │
│  - Confidence           │
└─────────────────────────┘
```

## 📝 Practical Examples

### Example 1: Add User's Recent Activity

**Before:**
```javascript
const systemPrompt = `You are a query router...

CONTEXT:
- Current page: ${currentPage}
`;
```

**After:**
```javascript
const systemPrompt = `You are a query router...

CONTEXT:
- Current page: ${currentPage}
${context?.aiState?.recentActivity ? `
- Recent activity: User viewed ${context.aiState.recentActivity.campaignsViewed} campaigns
- Last action: ${context.aiState.recentActivity.lastAction}
` : ''}
`;
```

### Example 2: Add Performance Benchmarks

```javascript
const systemPrompt = `...

${context?.aiState?.benchmarks ? `
INDUSTRY BENCHMARKS:
- Avg Open Rate: ${context.aiState.benchmarks.avgOpenRate}%
- Avg Click Rate: ${context.aiState.benchmarks.avgClickRate}%
- User is performing: ${context.aiState.benchmarks.userPerformance}
` : ''}
`;
```

### Example 3: Add Currently Visible Data

```javascript
const systemPrompt = `...

${context?.aiState?.data?.topCampaigns?.length > 0 ? `
CURRENTLY VISIBLE CAMPAIGNS:
${context.aiState.data.topCampaigns.map((c, i) =>
  `${i+1}. ${c.name} - $${c.revenue.toLocaleString()}, ${c.openRate}% open, ${c.recipients} sent`
).join('\n')}

User can see these campaigns on screen right now.
` : ''}
`;
```

## ⚙️ Where to Set AI Context

### In Any Page Component

```javascript
import { useAI } from '@/app/contexts/ai-context';

export default function MyPage() {
  const { updateAIState } = useAI();

  useEffect(() => {
    updateAIState({
      currentPage: '/my-page',
      selectedStores: stores,
      data: {
        summary: { revenue: 125000, orders: 450 },
        topCampaigns: campaigns.slice(0, 5)
      }
    });

    // Cleanup on unmount
    return () => updateAIState({ currentPage: null });
  }, [stores, campaigns]);
}
```

### Context Structure

```javascript
aiState = {
  // Page info
  currentPage: '/dashboard',
  pageTitle: 'Dashboard',
  pageType: 'dashboard',

  // Store selection
  selectedStores: [
    { value: 'XAeU8VL', label: 'Acme Store', klaviyo_id: 'XqkVGb' }
  ],

  // Date range
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
    preset: 'last30days'
  },

  // On-screen data (keep small!)
  data: {
    summary: { totalRevenue: 125000, totalOrders: 450 },
    topCampaigns: [...], // Max 5-10 items
    timeSeries: [...]    // Max 90 points
  }
}
```

## 🎨 Formatting Tips

### ✅ Good Formatting

```javascript
SELECTED STORES:
- Acme Store (Active)
- Store B (No Klaviyo)
- My Boutique (Active)

Total: 3 stores
```

### ❌ Bad Formatting

```javascript
stores: [{"value":"XAeU8VL","label":"Acme Store","klaviyo_id":"XqkVGb"},...]
```

### Best Practices

1. **Use bullet points** for lists
2. **Keep it concise** - no raw JSON
3. **Human-readable** - like talking to a human
4. **Structured sections** - use headers
5. **Limit items** - top 5-10 max

## 🔍 Debugging

### Check what Haiku sees:

```javascript
// In /lib/ai/intent-detection-haiku.js
console.log('🤖 Haiku System Prompt:', systemPrompt);

// Check length
console.log('Prompt size:', systemPrompt.length, 'chars');
```

### Optimal Size

- **System prompt**: 500-1500 chars
- **User query**: 50-500 chars
- **Total tokens**: 200-500 tokens
- **Cost**: ~$0.0001-0.0003

## 📚 See Also

- [HAIKU_DATA_FLOW.md](./HAIKU_DATA_FLOW.md) - Complete data flow documentation
- [STORE_NAME_RESOLUTION.md](./STORE_NAME_RESOLUTION.md) - Store resolution guide
- [/app/contexts/ai-context.jsx](./app/contexts/ai-context.jsx) - AI Context structure
- [/lib/ai/intent-detection-haiku.js](./lib/ai/intent-detection-haiku.js) - Implementation

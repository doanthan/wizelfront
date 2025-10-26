# DEV Tab: Viewing AI Prompts & Context

## 🎯 What You're Seeing vs What You Want

### Current DEV Tab Shows:
```json
{
  "currentPage": "/dashboard",
  "pageTitle": "Dashboard",
  "pageType": "dashboard",
  "selectedStores": [],
  ...
}
```
This is the **AI Context** - the data being passed around.

### What You Want to See:
1. **Intent Detection Prompt** (3-tier routing system sent to Haiku)
2. **Final System Prompt** (sent to Haiku/Sonnet for the actual response)
3. **Store Resolution Details** (if applicable)

## 🔍 Where the Prompts Are

### 1. Intent Detection Prompt (3-Tier Routing)

**Location:** `/lib/ai/intent-detection-haiku.js:33`

**What Haiku sees:**
```
You are an intelligent query router for a marketing analytics platform.

**TIER 1 - On-Screen Context (CHEAPEST, FASTEST)**
Use when: Question is about data currently visible on screen
Examples: "What's this number?", "Explain this metric"

**TIER 2 - SQL Database Query (ANALYTICAL)**
Use when: Question requires historical data analysis
Examples: "Top 10 campaigns last month", "Revenue trends"

**TIER 3 - Real-Time MCP API (CURRENT STATE)**
Use when: Question requires live Klaviyo data
Examples: "How many profiles in VIP segment right now?"

CONTEXT:
- Current page: /dashboard
- Has on-screen data: YES/NO
- Selected stores: Store A, Store B
- Date range: last90days

Classify: "What's my open rate?"
```

### 2. Tier 1 System Prompt (Context-Based)

**Location:** `/app/api/chat/ai/route.js:487`

**What Haiku/Sonnet sees:**
```
You are Wizel, a marketing analytics specialist...

# Your Role
You're a marketing analyst helping users understand their email marketing performance...

# Current User Context
- User: John Doe
- Current Page: dashboard
- Selected Accounts: Store A, Store B

# Analytics Context
(Your on-screen dashboard data here)

# Response Guidelines
1. Be Direct: Lead with the answer
2. Focus on Action: Provide clear next steps
...
```

## 📊 How to See the Full Prompts

### Option 1: Browser Console (Recommended)

**Step 1:** Open Developer Tools
- Press `F12` or `Cmd+Option+I` (Mac)

**Step 2:** Go to Console tab

**Step 3:** Ask a question in the chat

**Step 4:** Look for these logs:

```javascript
// Intent Detection
🎯 Intent Detection (Haiku-powered): {
  tier: 2,
  confidence: "high",
  reason: "Historical analytical query",
  method: "haiku",
  cost: "$0.000120"
}

// Store Resolution (if store names mentioned)
🏪 Resolving store names from query (Haiku): {
  storeNames: ["Acme"],
  confidence: "high",
  method: "haiku"
}

// Tier 2 SQL Analysis
🔍 Tier 2 SQL Analysis: {
  question: "What's Acme's revenue?",
  storeCount: 1,
  resolution: "query_mentioned",
  storeNames: ["Acme Store"]
}
```

### Option 2: Enhanced DEV Tab (Coming Soon)

I'll add a **"Prompts" section** to the DEV tab that shows:
- Intent detection prompt
- Final system prompt
- Full context being passed

### Option 3: Enable Verbose Logging

**Add this to your code temporarily:**

```javascript
// In /lib/ai/intent-detection-haiku.js:28
export async function detectIntentWithHaiku(query, context = {}, options = {}) {
  const systemPrompt = `...`;

  // ADD THIS:
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 INTENT DETECTION PROMPT:', systemPrompt);
  }

  const response = await makeOpenRouterRequest(...);
}
```

```javascript
// In /app/api/chat/ai/route.js:487
function buildSystemPrompt(context, user) {
  const prompt = `You are Wizel...`;

  // ADD THIS:
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 TIER 1 SYSTEM PROMPT:', prompt);
  }

  return prompt;
}
```

## 🛠️ Quick Fix: Add Prompt Viewer to DEV Tab

Let me create an enhanced DEV tab component:

### File: `/app/components/ai/wizel-chat.jsx`

Add a new tab section:

```jsx
// In the DEV tab content area, add:
<Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 mt-4">
  <CardContent className="p-4">
    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
      System Prompts (Development Only)
    </h4>

    {/* Intent Detection Prompt */}
    <div className="mb-4">
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        1. Intent Detection (3-Tier Routing)
      </h5>
      <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-gray-900 dark:text-gray-100 max-h-60">
        {`You are an intelligent query router...

**TIER 1 - On-Screen Context**
**TIER 2 - SQL Database Query**
**TIER 3 - Real-Time MCP API**

CONTEXT:
- Current page: ${aiContext?.currentPage || 'unknown'}
- Has on-screen data: ${aiContext?.data ? 'YES' : 'NO'}
- Selected stores: ${aiContext?.selectedStores?.map(s => s.label).join(', ') || 'none'}

Classify: "[Your question here]"`}
      </pre>
    </div>

    {/* Tier 1 System Prompt */}
    <div>
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        2. Tier 1 System Prompt (Context-Based)
      </h5>
      <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-gray-900 dark:text-gray-100 max-h-60">
        {`You are Wizel, a marketing analytics specialist...

# Current User Context
- Current Page: ${aiContext?.pageType || 'dashboard'}
- Selected Accounts: ${aiContext?.selectedStores?.map(s => s.label).join(', ') || 'none'}

# Analytics Context
${aiContext?.data ? JSON.stringify(aiContext.data, null, 2) : 'No data available'}

# Response Guidelines
1. Be Direct: Lead with the answer
2. Focus on Action: Provide clear next steps
...`}
      </pre>
    </div>
  </CardContent>
</Card>
```

## 🎨 Visual Example

### What You'll See in Console:

```
🎯 Intent Detection (Haiku-powered): {
  tier: 1,
  confidence: "high",
  reason: "Question about visible on-screen metric",
  method: "haiku",
  cost: "$0.000089",
  executionTime: "234ms"
}

🤖 Tier 1 (Context): {
  query: "What's my open rate?",
  selectedModel: "anthropic/claude-haiku-4.5",
  actualModel: "anthropic/claude-haiku-4.5",
  usedFallback: false,
  reasoning: "Simple query - cost-optimized with Haiku",
  executionTime: "891ms"
}
```

### What You'll See in Response Metadata:

```json
{
  "response": "Your current open rate is 23.5%...",
  "metadata": {
    "tier": 1,
    "tierName": "Context-based",
    "model": "anthropic/claude-haiku-4.5",
    "confidence": "high",
    "executionTime": "1125ms"
  },
  "_debug": {
    "intent": {
      "tier": 1,
      "confidence": "high",
      "reason": "..."
    },
    "modelConfig": {
      "model": "anthropic/claude-haiku-4.5",
      "reasoning": "Simple query - cost-optimized"
    },
    "systemPrompt": "You are Wizel, a marketing analytics specialist...",
    "contextSize": 2456,
    "hasOnScreenData": true
  }
}
```

## 🚀 Next Steps

I'll create an enhanced DEV tab that shows:

1. ✅ **Intent Detection Section**
   - Shows the 3-tier routing prompt
   - Shows what tier was selected
   - Shows confidence and reasoning

2. ✅ **System Prompt Section**
   - Shows the actual prompt sent to AI
   - Shows what model was used
   - Shows context size

3. ✅ **Store Resolution Section** (if applicable)
   - Shows extracted store names
   - Shows resolved stores
   - Shows Klaviyo IDs used

4. ✅ **Request/Response Flow**
   - Timeline of what happened
   - Token usage
   - Costs

Would you like me to implement this enhanced DEV tab now?

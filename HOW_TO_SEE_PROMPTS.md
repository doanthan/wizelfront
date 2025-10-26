# How to See AI Prompts in Your Chat

## ✅ Changes Made

I've added detailed logging to show you **exactly what prompts are sent to Haiku** at each step.

## 🚀 How to See the Prompts

### Step 1: Open Browser Console

1. Open your dashboard at `http://localhost:3000/dashboard`
2. Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
3. Click the **Console** tab

### Step 2: Ask a Question

Type a question in the chat, like:
- "What's my open rate?"
- "How is Acme going?"
- "Show me top campaigns last month"

### Step 3: See the Prompts in Console

You'll now see detailed logs like this:

```
📝 INTENT DETECTION PROMPT TO HAIKU:
System Prompt (first 800 chars): You are an intelligent query router for a marketing analytics platform.

Your job is to classify user questions into 3 tiers:

**TIER 1 - On-Screen Context (CHEAPEST, FASTEST)**
Use when: Question is about data currently visible on screen
Examples:
- "What's this number?"
- "Explain this metric"
- "What's my current open rate?"
...

User Prompt: Classify this user question:

"What's my open rate?"

Return only JSON.

Full prompt length: 1247 characters

🎯 Intent Detection (Haiku-powered): {
  tier: 1,
  confidence: 'high',
  reason: 'Question about visible on-screen metric',
  method: 'haiku',
  cost: '$0.000089',
  executionTime: '234ms'
}

📝 TIER 1 SYSTEM PROMPT TO AI:
Prompt (first 800 chars): You are Wizel, a marketing analytics specialist focused on Klaviyo data analysis.

# Your Role
You're a marketing analyst helping users understand their email marketing performance. You have direct access to their dashboard data and provide insights based on what you see in their account.

# CRITICAL: Response Format
When providing lists or bullet points, you MUST use these exact markers:

**Core Analysis Icons:**
- [CHECK] Positive results
- [TREND] Upward trends
- [DOWN] Declining metrics
- [WARNING] Issues requiring attention
...

Full prompt length: 1853 characters
Selected model: anthropic/claude-haiku-4.5
```

## 📊 What You'll See

### 1. Intent Detection Prompt (3-Tier Routing)

This is **what Haiku sees first** to decide which tier to use:

```
You are an intelligent query router...

**TIER 1 - On-Screen Context**
**TIER 2 - SQL Database Query**
**TIER 3 - Real-Time MCP API**

CONTEXT:
- Current page: /dashboard
- Has on-screen data: YES
- Selected stores: Store A, Store B
- Date range: last90days

Classify: "What's my open rate?"
```

**Result:**
```
🎯 Intent Detection: tier 1, confidence: high
```

### 2. Tier 1 System Prompt (The Actual Prompt)

This is **what the AI sees to answer your question**:

```
You are Wizel, a marketing analytics specialist...

# Current User Context
- User: John Doe
- Current Page: dashboard
- Selected Accounts: Acme Store, Store B

# Analytics Context
{dashboard data here}

# Response Guidelines
1. Be Direct
2. Focus on Action
...
```

### 3. Store Resolution (If Applicable)

If you mention a store name:

```
🏪 Resolving store names from query (Haiku): {
  storeNames: ['Acme'],
  confidence: 'high',
  method: 'haiku'
}

🔍 Tier 2 SQL Analysis: {
  storeCount: 1,
  resolution: 'query_mentioned',
  storeNames: ['Acme Store'],
  klaviyoIds: ['XqkVGb']
}
```

## 🎯 Example: Complete Flow

### Question: "What's my open rate?"

**Console Output:**

```javascript
// 1. Intent Detection
📝 INTENT DETECTION PROMPT TO HAIKU:
System Prompt: You are an intelligent query router...
  **TIER 1 - On-Screen Context**
  **TIER 2 - SQL Database Query**
  **TIER 3 - Real-Time MCP API**
User Prompt: "What's my open rate?"

🎯 Intent Detection: {
  tier: 1,  // ← Decided to use Tier 1
  confidence: "high",
  reason: "Question about visible metric"
}

// 2. Tier 1 Prompt
📝 TIER 1 SYSTEM PROMPT TO AI:
Prompt: You are Wizel, a marketing analytics specialist...
  # Your Role: Help users understand email marketing
  # Current Context: dashboard, Store A, Store B
  # Analytics Context: {revenue: 125000, orders: 450, ...}

🤖 Tier 1 Response: {
  model: "anthropic/claude-haiku-4.5",
  executionTime: "891ms"
}

// 3. Response
✅ "Your current open rate is 23.5%, which is above the..."
```

### Question: "How is Acme going?"

**Console Output:**

```javascript
// 1. Intent Detection
📝 INTENT DETECTION PROMPT: ...
🎯 Intent Detection: { tier: 2, confidence: "high" }

// 2. Store Name Extraction
📝 STORE EXTRACTION PROMPT TO HAIKU:
  USER'S ACCESSIBLE STORES:
  - Acme Store
  - Store B
  - Fashion Hub
  Extract: "How is Acme going?"

🏪 Store Resolution: {
  storeNames: ["Acme"],
  resolved: "Acme Store",
  klaviyoId: "XqkVGb"
}

// 3. SQL Generation
🔍 Tier 2: Generating SQL for Acme Store
  klaviyoIds: ["XqkVGb"]
  SQL: SELECT * FROM account_metrics_daily WHERE...

// 4. Response
✅ "Acme Store is performing well! Revenue: $125K (+12%)..."
```

## 🔧 What's in Each Log

### `📝 INTENT DETECTION PROMPT TO HAIKU`
- Shows the 3-tier routing system prompt
- Shows your question being classified
- **This is step 1** - routing decision

### `🎯 Intent Detection (Haiku-powered)`
- Shows which tier was selected
- Shows confidence level
- Shows reasoning

### `📝 TIER 1 SYSTEM PROMPT TO AI`
- Shows the actual prompt used to answer
- Shows user context, stores, date range
- **This is step 2** - actual response generation

### `🏪 Resolving store names`
- Shows extracted store names (if any)
- Shows resolution to Store documents
- Shows Klaviyo IDs for querying

### `🔍 Tier 2 SQL Analysis`
- Shows SQL being generated
- Shows which stores are being queried
- Shows ClickHouse query details

## ✅ Summary

**Before:** You only saw AI context JSON
**Now:** You see:
1. ✅ Intent detection prompt (3-tier system)
2. ✅ Tier decision with reasoning
3. ✅ Actual system prompt used
4. ✅ Store resolution details
5. ✅ SQL queries (if Tier 2)
6. ✅ Model selection and timing

**All prompts are logged to browser console in development mode!** 🎉

## 🎨 Clean Up Logs

The logs are only shown in **development mode** (`NODE_ENV=development`). In production, they're automatically disabled.

To disable logs temporarily:
```bash
# In your terminal
export NODE_ENV=production
npm run dev
```

To enable again:
```bash
export NODE_ENV=development
npm run dev
```

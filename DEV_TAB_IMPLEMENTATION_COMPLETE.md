# DEV Tab Prompt Viewer - Implementation Complete ✅

## Overview

The DEV tab in Wizel Chat now displays the exact prompts sent to Haiku AI for intent detection and context-based responses. This allows developers to see exactly what the AI receives when processing user questions.

## What Was Implemented

### 1. **Intent Detection Prompt Display**
Shows the full 3-tier routing system prompt sent to Haiku 4.5 for classifying user queries.

**Features:**
- ✅ Shows current page context
- ✅ Displays whether on-screen data is available
- ✅ Lists selected stores
- ✅ Shows date range if applicable
- ✅ Explains all 3 tiers (On-Screen Context, SQL Database, Real-Time MCP)
- ✅ Copy button to clipboard
- ✅ Updates dynamically based on current page state

### 2. **Last System Prompt Display**
Shows the actual system prompt sent to the AI model when a Tier 1 question is answered.

**Features:**
- ✅ Only appears after asking a question
- ✅ Shows the full system prompt with all context
- ✅ Copy button to clipboard
- ✅ Updates with each new question asked

### 3. **Sample User Message Display**
Shows what the user message would look like when sent to Haiku.

**Features:**
- ✅ Editable sample question input
- ✅ Shows how context is bundled with the question
- ✅ Copy button to clipboard

### 4. **Current AI Context Display**
Shows the raw AI context object from the current page.

**Features:**
- ✅ JSON formatted display
- ✅ Shows all available context data
- ✅ Helpful message when no context available
- ✅ Copy button to clipboard

## Files Modified

### `/app/components/ai/wizel-chat.jsx`

**Changes:**
1. Added `lastPrompts` state to parent WizelChat component
2. Updated `sendMessage()` to capture `_debug.prompts` from API responses
3. Updated `DevContextViewer` component to accept `lastPrompts` as prop
4. Created new `buildIntentDetectionPrompt()` function showing 3-tier routing
5. Updated UI to display 4 sections:
   - Intent Detection Prompt (3-Tier Routing)
   - Last System Prompt Used (Tier 1) - only shown after asking questions
   - Sample User Message
   - Current AI Context

**Code Added:**
```javascript
// Parent component
const [lastPrompts, setLastPrompts] = useState(null);

// In sendMessage function
if (data._debug?.prompts) {
  setLastPrompts(data._debug.prompts);
}

// Pass to DevContextViewer
<DevContextViewer aiContext={getAIContext()} lastPrompts={lastPrompts} />

// Updated function signature
function DevContextViewer({ aiContext, lastPrompts }) {
  // ... implementation
}
```

### `/app/api/chat/ai/route.js`

**Already Completed in Previous Session:**
- Added `_debug.prompts` object to API responses in development mode
- Includes `systemPrompt`, `userMessage`, `contextSize`, and `hasOnScreenData`

**No Additional Changes Needed** - The API already returns the prompts we need!

### `/lib/ai/intent-detection-haiku.js`

**Already Completed in Previous Session:**
- Removed console.log statements
- AI-based store name extraction using Haiku
- System uses `needsStoreResolution()` with user's accessible stores

**No Additional Changes Needed** - This file already works correctly!

## How It Works

### Data Flow:

```
1. User asks question in chat
   ↓
2. sendMessage() calls /api/chat/ai
   ↓
3. API processes question:
   - Runs intent detection (Haiku)
   - Routes to appropriate tier
   - Returns response + _debug.prompts (dev mode)
   ↓
4. sendMessage() captures _debug.prompts
   ↓
5. setLastPrompts(data._debug.prompts)
   ↓
6. DevContextViewer displays prompts in DEV tab
```

### What You See in the DEV Tab:

#### **Intent Detection Prompt**
Shows the prompt that classifies questions into Tier 1, 2, or 3:

```
You are an intelligent query router for a marketing analytics platform.

Your job is to classify user questions into 3 tiers:

**TIER 1 - On-Screen Context (CHEAPEST, FASTEST)**
Use when: Question is about data currently visible on screen
Examples:
- "What's this number?"
- "Explain this metric"
✅ User HAS on-screen context available

**TIER 2 - SQL Database Query (ANALYTICAL)**
Use when: Question requires historical data analysis, trends, or comparisons
Examples:
- "What were my top 10 campaigns last month?"
- "Show me revenue trends over the last quarter"

**TIER 3 - Real-Time MCP API (CURRENT STATE)**
Use when: Question requires live/current Klaviyo configuration or state
Examples:
- "How many profiles are in my VIP segment right now?"
- "What flows are currently active?"

CONTEXT:
- Current page: /dashboard
- Has on-screen data: YES
- Selected stores: Acme Store, Store B
- Date range: last_30_days

User question: "What's my open rate?"

Return JSON only:
{
  "tier": 1 | 2 | 3,
  "confidence": "low" | "medium" | "high",
  "reason": "Brief explanation of why this tier"
}
```

#### **Last System Prompt Used**
Shows the actual prompt used for Tier 1 responses (only appears after asking a question):

```
You are an intelligent marketing analytics AI assistant...

CURRENT CONTEXT:
- Page: /dashboard
- Data available: YES

ON-SCREEN DATA:
{
  "summary": {
    "totalRevenue": 125000,
    "totalOrders": 450,
    "avgOpenRate": 23.5
  }
}

USER QUESTION: "What's my open rate?"

Provide insights based on the on-screen data above.
```

## Testing the Implementation

### Step 1: Open Wizel Chat
1. Navigate to any reporting page (Dashboard, Calendar, etc.)
2. Click the Wizel chat button
3. Click the "DEV" tab

### Step 2: View Intent Detection Prompt
- Scroll through the "Intent Detection Prompt (3-Tier Routing)" section
- Should show current page context, selected stores, date range
- Click "Copy" button to copy prompt

### Step 3: Ask a Question
1. Switch back to "AI" tab
2. Ask a question like "What's my open rate?"
3. Wait for response
4. Switch back to "DEV" tab

### Step 4: View Last System Prompt
- New section "Last System Prompt Used (Tier 1)" should now appear
- Shows the full system prompt sent to the AI model
- Includes all on-screen context data
- Click "Copy" button to copy prompt

### Step 5: Test Sample Question
1. Change the sample question in the input box
2. Watch the "Intent Detection Prompt" update with new question
3. Watch the "Sample User Message" update

## What Gets Displayed vs. What Doesn't

### ✅ DISPLAYED in DEV Tab:
- Intent detection prompt (always)
- Current AI context (always)
- Sample user message (always)
- Last system prompt used for Tier 1 (after asking questions)

### ❌ NOT DISPLAYED in DEV Tab:
- Console logs (removed per user request)
- Raw API responses
- Tier 2 SQL queries (not part of prompts)
- Tier 3 MCP requests (not part of prompts)

### 📝 ONLY IN DEVELOPMENT MODE:
- The entire DEV tab only appears when `NEXT_PUBLIC_NODE_ENV=development`
- API only returns `_debug.prompts` in development mode
- Production builds won't show any of this data

## Key Features

### 🎯 Real-Time Updates
- Intent detection prompt updates as you navigate pages
- Shows current context (stores, date ranges, on-screen data)
- Changes based on what's visible on the current page

### 📋 Copy to Clipboard
- Every prompt section has a "Copy" button
- Useful for debugging and prompt engineering
- Can paste into AI tools for testing

### 🔍 Context-Aware
- Shows whether on-screen data is available
- Lists selected stores
- Displays date ranges
- Indicates page type

### 🎨 Clean UI
- Matches Wizel design system
- Dark mode compatible
- Responsive layout
- Scrollable sections

## Environment Variables

**Required:**
```bash
NEXT_PUBLIC_NODE_ENV=development
```

**When `NEXT_PUBLIC_NODE_ENV=production`:**
- DEV tab is hidden completely
- No debug data is sent from API
- No performance impact

## Debugging Tips

### Not Seeing Last System Prompt?
- Make sure you've asked at least one question
- Check that the question was routed to Tier 1 (on-screen context)
- Look for error messages in the browser console

### Intent Detection Prompt Not Updating?
- Navigate to a different page to see context change
- Select different stores in multi-account reporting
- Change date ranges

### API Not Returning Debug Data?
1. Check `NEXT_PUBLIC_NODE_ENV=development` in `.env`
2. Restart the Next.js dev server
3. Check browser Network tab for `/api/chat/ai` response
4. Look for `_debug` object in response JSON

## Next Steps / Future Enhancements

**Potential Additions:**
- [ ] Show Tier 2 SQL queries in DEV tab
- [ ] Show Tier 3 MCP requests in DEV tab
- [ ] Add prompt performance metrics (tokens, time)
- [ ] Export prompts to file
- [ ] Prompt versioning/history
- [ ] A/B test different prompts
- [ ] Show intent detection confidence scores

## Documentation References

- [STORE_NAME_RESOLUTION.md](./STORE_NAME_RESOLUTION.md) - Store name extraction implementation
- [HAIKU_DATA_FLOW.md](./HAIKU_DATA_FLOW.md) - How data flows to Haiku
- [HAIKU_QUICK_REFERENCE.md](./HAIKU_QUICK_REFERENCE.md) - Quick reference for feeding data to Haiku

## Summary

✅ **Complete** - The DEV tab now shows exactly what prompts are sent to Haiku AI for intent detection and Tier 1 responses. Users can see the 3-tier routing system, current context, and actual prompts used - all in a clean, copyable UI format.

**No console logging** - Everything is displayed in the UI as requested.

**Development-only** - Won't impact production performance or expose debug data.

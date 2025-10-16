# Wizel AI Chat Implementation Guide

## Overview

The Wizel AI Chat system provides context-aware marketing analytics assistance using intelligent model routing between Claude Sonnet 4.5 and Gemini 2.5 Pro for optimal cost and performance.

## Architecture

### Security First Design

**✅ System prompts are NEVER exposed to users**
- User queries go in the `user` message
- Instructions, context, and guidelines go in the `system` prompt (server-side only)
- Users only see AI responses, never internal prompts

### Intelligent Model Routing with Automatic Fallback

The system automatically selects the best AI model and **falls back to the alternative if the primary fails**:

| Query Type | Primary Model | Fallback Model | Cost |
|------------|---------------|----------------|------|
| Complex analytical ("why", "how", "compare") | Claude Sonnet 4.5 | → Gemini 2.5 Pro | $3/M → $1.25/M |
| Simple factual ("what's my open rate") | Gemini 2.5 Pro | → Claude Sonnet 4.5 | $1.25/M → $3/M |
| Large context (>30K chars) | Gemini 2.5 Pro | → Claude Sonnet 4.5 | $1.25/M → $3/M |
| Strategic ("recommend", "should I") | Claude Sonnet 4.5 | → Gemini 2.5 Pro | $3/M → $1.25/M |

**Fallback Logic:**
- If Claude Sonnet 4.5 fails → Automatically retry with Gemini 2.5 Pro
- If Gemini 2.5 Pro fails → Automatically retry with Claude Sonnet 4.5
- Only fails if BOTH models are unavailable

## Setup

### 1. Get OpenRouter API Key

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Create an API key at https://openrouter.ai/keys
3. Add to your `.env.local`:

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
NEXT_PUBLIC_APP_URL=https://wizel.ai
```

### 2. Environment Variables

Required variables in `.env.local`:

```bash
# OpenRouter API (for AI Chat)
OPENROUTER_API_KEY=your_key_here

# App URL (for OpenRouter attribution)
NEXT_PUBLIC_APP_URL=https://wizel.ai

# NextAuth (for user authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

## How It Works

### 1. User Interaction Flow

```
User asks question
    ↓
ChatWidget captures message + page context
    ↓
POST /api/chat/ai
    ↓
Determine optimal model (Claude vs Gemini)
    ↓
Build system prompt (NEVER sent to user)
    ↓
Call OpenRouter API
    ↓
Return AI response to user
```

### 2. Context System

The AI receives comprehensive context from your existing `ai-context.jsx`:

- **Page context**: Current page type (dashboard, campaigns, flows, etc.)
- **User context**: Selected accounts, date ranges
- **Metrics**: All visible KPIs and performance data
- **Insights**: Auto-generated insights and recommendations
- **History**: Last 5 chat messages for continuity

### 3. Example Request/Response

**User Query:**
```
"Why is my open rate declining?"
```

**What happens internally:**

1. **Model Selection**:
   - Query contains "why" → complexity indicator
   - Routes to **Claude Sonnet 4.5** for analytical reasoning

2. **System Prompt** (NEVER shown to user):
   ```
   You are Wizel, expert Klaviyo marketing analytics assistant...

   Current User Context:
   - User: John Doe
   - Page: dashboard
   - Selected Accounts: Store A, Store B
   - Date Range: Past 90 days

   Analytics Context:
   - Open Rate: 18.5% (down 3.2% from previous period)
   - Industry Average: 21.33%
   - Top Campaign: "Summer Sale" (25% open rate)
   - Worst Campaign: "Weekly Newsletter" (12% open rate)

   [... detailed guidelines ...]
   ```

3. **User Message** (sent to AI):
   ```
   "Why is my open rate declining?"
   ```

4. **AI Response** (returned to user):
   ```
   Your open rate has declined from 21.7% to 18.5% over the past 90 days—a 3.2 percentage point drop.

   Looking at your data, I can see three main factors:

   1. **Subject Line Fatigue**: Your "Weekly Newsletter" campaigns (12% open rate) are
      significantly underperforming your promotional campaigns like "Summer Sale" (25% open rate).
      This suggests generic subject lines aren't resonating.

   2. **Send Frequency**: You've increased from 2 to 4 emails per week, which can lead to
      subscriber fatigue and lower engagement.

   3. **List Quality**: Your bounce rate has increased to 3.5%, indicating some list decay.

   📊 **Immediate Actions:**
   - A/B test subject lines for your newsletter (expected +5-10% open rate)
   - Reduce frequency to 2-3 emails/week for 2 weeks and monitor
   - Clean your list (remove hard bounces and inactive subscribers >90 days)

   Would you like me to analyze which specific campaigns are driving this decline?
   ```

## Cost Optimization

### Estimated Costs

Based on 1000 queries/month:

```
Simple queries (60%):  600 × ~2K tokens = 1.2M tokens × $1.25/M = $1.50
Complex queries (40%): 400 × ~2K tokens = 0.8M tokens × $3.00/M = $2.40
───────────────────────────────────────────────────────────────────
Total: ~$4/month
```

### Model Selection Logic with Fallback

The system intelligently routes queries with automatic fallback:

```javascript
// Routes to Claude Sonnet 4.5 ($3/M) → Falls back to Gemini 2.5 Pro if Claude fails
"Why is campaign X performing better than Y?"
"How can I improve my conversion rate?"
"What strategy should I use for Q4?"
"Compare my accounts and recommend next steps"

// Routes to Gemini 2.5 Pro ($1.25/M) → Falls back to Claude Sonnet 4.5 if Gemini fails
"What's my open rate?"
"Show me top campaigns"
"How many campaigns did I send?"
"What's my total revenue?"
```

**Fallback Benefits:**
- 🛡️ **Reliability**: No single point of failure
- 🚀 **Uptime**: If one model is down/overloaded, automatically use the other
- 💰 **Cost-aware**: Falls back intelligently (premium ↔ economical)
- 🔍 **Transparent**: Logs show when fallback was used

## API Reference

### POST `/api/chat/ai`

**Request Body:**
```json
{
  "message": "Why is my open rate declining?",
  "context": {
    "aiState": { /* current page state */ },
    "formattedContext": "# Analytics Context..."
  },
  "history": [
    { "type": "user", "content": "Previous message..." },
    { "type": "ai", "content": "Previous response..." }
  ]
}
```

**Response:**
```json
{
  "response": "Your open rate has declined from...",
  "_meta": {  // Only in development
    "model": "anthropic/claude-sonnet-4.5",
    "reasoning": "Complex analytical query requiring deep reasoning",
    "contextSize": 1250
  }
}
```

## Monitoring & Debugging

### Development Mode

In development, you'll see detailed logs:

```bash
# Successful request with primary model
🎯 Attempting primary model: anthropic/claude-sonnet-4.5
🤖 AI Chat: {
  query: 'Why is my open rate declining?...',
  selectedModel: 'anthropic/claude-sonnet-4.5',
  actualModel: 'anthropic/claude-sonnet-4.5',
  usedFallback: false,
  reasoning: 'Complex analytical query requiring deep reasoning',
  contextTokens: 3200,
  responseTokens: 450
}

# Request with fallback (if primary fails)
🎯 Attempting primary model: anthropic/claude-sonnet-4.5
⚠️ Primary model (anthropic/claude-sonnet-4.5) failed: AI API request failed: 503
🔄 Falling back to: google/gemini-2.5-pro
🔄 Fallback used: anthropic/claude-sonnet-4.5 → google/gemini-2.5-pro
🤖 AI Chat: {
  query: 'Why is my open rate declining?...',
  selectedModel: 'anthropic/claude-sonnet-4.5',
  actualModel: 'google/gemini-2.5-pro',
  usedFallback: true,
  attemptedModel: 'anthropic/claude-sonnet-4.5',
  fallbackModel: 'google/gemini-2.5-pro',
  reasoning: 'Complex analytical query requiring deep reasoning',
  contextTokens: 3200,
  responseTokens: 450
}
```

### Production Mode

Logs are minimal for security:
- No system prompts logged
- No sensitive context data
- Fallback usage tracked (for monitoring)
- Only error tracking

## Integration with Existing System

### Your AI Context System

The implementation **works perfectly** with your existing `ai-context.jsx`:

```javascript
// In ChatWidget.jsx (already implemented)
const aiContext = getAIContext();

const pageContext = {
  url: window.location.pathname,
  aiState: aiContext.aiState,
  formattedContext: aiContext.formattedContext  // ✅ Already formatted!
};

// Send to API
fetch('/api/chat/ai', {
  method: 'POST',
  body: JSON.stringify({ message, context: pageContext, history })
});
```

### No Changes Needed

Your existing context system is **already optimal**:
- ✅ Aggregates large datasets intelligently
- ✅ Generates strategic insights automatically
- ✅ Formats context beautifully for AI
- ✅ Handles multi-account data efficiently

## Best Practices

### 1. Context Management

**✅ DO:**
- Use your existing `aggregateCampaignsForAI()` helper
- Send summary statistics, not raw data
- Include top 5-10 items only
- Provide formatted context from `getAIContext()`

**❌ DON'T:**
- Send entire campaign arrays (900+ items)
- Include raw time-series data
- Pass unformatted MongoDB documents
- Send sensitive API keys or credentials

### 2. Response Quality

The AI is configured to:
- Reference specific numbers from the user's screen
- Compare to industry benchmarks
- Provide actionable recommendations
- Explain WHY, not just WHAT
- Keep responses concise and scannable

### 3. Security

**System prompts are protected:**
- Only sent to OpenRouter API (server-side)
- Never included in responses
- Not accessible via browser DevTools
- Not logged in production

## Troubleshooting

### "OPENROUTER_API_KEY not configured"

**Solution:** Add your API key to `.env.local`:
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### "Unauthorized" (401 error)

**Solution:** User not logged in. Ensure NextAuth session exists.

### AI responses are generic

**Solution:** Check that page context is being set correctly:
```javascript
// In your page component
useEffect(() => {
  updateAIState({
    pageType: 'campaigns',
    data: aggregateCampaignsForAI(campaigns),
    metrics: { /* ... */ }
  });
}, [campaigns]);
```

### Context too large (>1M tokens)

**Solution:** Use aggregation helpers:
```javascript
// ✅ CORRECT
const aggregated = aggregateCampaignsForAI(allCampaigns);
updateAIState({ data: aggregated });

// ❌ WRONG
updateAIState({ data: { campaigns: allCampaigns } });
```

## Future Enhancements

### 1. Function Calling (Advanced)

Add AI tools to fetch data on-demand:

```javascript
const tools = [
  {
    name: "get_campaign_details",
    description: "Fetch detailed campaign data",
    parameters: { campaign_id: "string" }
  }
];
```

### 2. Streaming Responses

Stream AI responses for better UX:

```javascript
const response = await fetch('/api/chat/ai', {
  method: 'POST',
  body: JSON.stringify({ message, context, stream: true })
});

const reader = response.body.getReader();
// Display tokens as they arrive
```

### 3. Conversation Memory

Store conversations in database for:
- Cross-session continuity
- User preference learning
- Conversation analytics

### 4. Custom Model Fine-tuning

Fine-tune models on your specific:
- Industry terminology
- Brand voice
- Common query patterns

## Support

### Questions?

- Check the [OpenRouter Docs](https://openrouter.ai/docs)
- Review your `ai-context.jsx` implementation
- Check browser console for `🤖 AI Chat:` logs (dev mode)

### Cost Tracking

Monitor usage at: https://openrouter.ai/activity

### Model Performance

Compare models at: https://openrouter.ai/rankings

## Summary

✅ **What's Implemented:**
- Secure system prompt architecture (never exposed to users)
- Intelligent model routing (Claude vs Gemini)
- Integration with existing AI context system
- Cost optimization (<$5/month for 1000 queries)
- Development debugging tools

✅ **What You Need to Do:**
1. Add `OPENROUTER_API_KEY` to `.env.local`
2. Test with some queries
3. Monitor costs on OpenRouter dashboard
4. Adjust model routing thresholds as needed

**Your AI chat is ready to use! 🎉**

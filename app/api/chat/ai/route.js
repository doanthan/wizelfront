import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * AI Chat API Route
 *
 * Handles chat interactions with Wizel AI assistant.
 * Uses intelligent model routing between Claude Sonnet 4.5 and Gemini 2.5 Pro.
 *
 * Security: System prompts are never exposed to the user.
 */
export async function POST(request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const { message, context, history } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 3. Determine optimal model based on query complexity and context size
    const modelConfig = determineOptimalModel(message, context);

    // 4. Build comprehensive system prompt (NEVER sent to user)
    const systemPrompt = buildSystemPrompt(context, session.user);

    // 5. Prepare conversation history (last 5 messages for context)
    const conversationHistory = (history || [])
      .slice(-5)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // 6. Call AI with selected model (with automatic fallback)
    const aiResponse = await callAIWithFallback({
      primaryModel: modelConfig.model,
      systemPrompt,
      conversationHistory,
      userMessage: message,
      maxTokens: 2048,
      temperature: 0.7
    });

    // 7. Log usage for monitoring (optional)
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 AI Chat:', {
        query: message.substring(0, 50) + '...',
        selectedModel: modelConfig.model,
        actualModel: aiResponse.model,
        usedFallback: aiResponse.usedFallback,
        ...(aiResponse.usedFallback && {
          attemptedModel: aiResponse.attemptedModel,
          fallbackModel: aiResponse.fallbackModel
        }),
        reasoning: modelConfig.reasoning,
        contextTokens: estimateTokens(systemPrompt),
        responseTokens: estimateTokens(aiResponse.content)
      });
    }

    // Log fallback usage (always log this for monitoring)
    if (aiResponse.usedFallback) {
      console.log(`🔄 Fallback used: ${aiResponse.attemptedModel} → ${aiResponse.fallbackModel}`);
    }

    // 8. Return response (system prompt is NEVER included)
    return NextResponse.json({
      response: aiResponse.content,
      // Optionally include metadata (for debugging in dev)
      ...(process.env.NODE_ENV === 'development' && {
        _meta: {
          model: modelConfig.model,
          reasoning: modelConfig.reasoning,
          contextSize: estimateTokens(systemPrompt)
        }
      })
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error);

    // Generic error response (don't leak system details)
    return NextResponse.json(
      {
        error: 'I encountered an issue processing your request. Please try again.',
        response: "I'm having trouble connecting right now. Please try again in a moment."
      },
      { status: 500 }
    );
  }
}

/**
 * Determine which AI model to use based on query complexity and context size
 *
 * Strategy:
 * - Claude Sonnet 4.5: Complex analytical queries, strategic recommendations
 * - Gemini 2.5 Pro: Simple queries, large context, cost-effective
 */
function determineOptimalModel(query, context) {
  const queryLower = query.toLowerCase();
  const contextSize = JSON.stringify(context || {}).length;

  // Complexity indicators
  const complexityIndicators = {
    analytical: /\b(why|how|analyze|analyse|explain|understand|compare|difference|better|worse)\b/i,
    strategic: /\b(recommend|suggestion|should i|what if|optimize|improve|strategy|next steps?|what.*do)\b/i,
    multiStep: /\b(and (then|also)|first.*second|step by step)\b/i,
    calculation: /\b(calculate|compute|total|sum|average|breakdown)\b/i,
  };

  // Check query complexity
  const isComplex = Object.values(complexityIndicators).some(regex => regex.test(queryLower));

  // Length-based complexity (longer queries tend to be more complex)
  const isLongQuery = query.split(/\s+/).length > 15;

  // Context size considerations
  const hasLargeContext = contextSize > 30000; // ~7500 tokens
  const hasModerateContext = contextSize > 15000; // ~3750 tokens

  // Decision logic
  if (isComplex && !hasLargeContext) {
    return {
      model: 'anthropic/claude-sonnet-4.5',
      reasoning: 'Complex analytical query requiring deep reasoning',
      cost: 'premium'
    };
  }

  if (isLongQuery && hasModerateContext) {
    return {
      model: 'anthropic/claude-sonnet-4.5',
      reasoning: 'Multi-part question with substantial context',
      cost: 'premium'
    };
  }

  // Default to Gemini for cost efficiency
  return {
    model: 'google/gemini-2.5-pro',
    reasoning: hasLargeContext
      ? 'Large context benefits from Gemini\'s 1M token window'
      : 'Standard query - cost-optimized model',
    cost: 'economical'
  };
}

/**
 * Build comprehensive system prompt with all context and instructions
 *
 * SECURITY: This is NEVER exposed to the user - only sent to AI provider
 */
function buildSystemPrompt(context, user) {
  const aiState = context?.aiState || {};
  const formattedContext = context?.formattedContext || '';

  // Extract key context elements
  const pageType = aiState.pageType || 'dashboard';
  const selectedStores = aiState.selectedStores || [];
  const dateRange = aiState.dateRange || {};
  const metrics = aiState.metrics || {};

  return `You are Wizel, a marketing analytics specialist focused on Klaviyo data analysis.

# Your Role
You're a marketing analyst helping users understand their email marketing performance. You have direct access to their dashboard data and provide insights based on what you see in their account.

# CRITICAL: Response Format
When providing lists or bullet points, you MUST use these exact markers at the start of each line:

**Core Analysis Icons:**
- [CHECK] Positive results, success
- [TREND] Upward performance trends
- [DOWN] Declining metrics
- [WARNING] Issues requiring attention
- [TIP] Actionable recommendations
- [SEARCH] Areas needing investigation

**Context-Specific Icons:**
- [GOAL] Goals, targets, benchmarks
- [AUDIENCE] Audience/segment insights
- [REVENUE] Revenue-related items
- [EMAIL] Email/campaign specific
- [QUICK] Quick wins, easy fixes
- [TIME] Time-sensitive items
- [ERROR] Errors, failures

Example format:
[CHECK] Revenue up 36.8%
[DOWN] Open rate declining 2.1%
[WARNING] Bounce rate at 3.5%
[TIP] A/B test subject lines
[QUICK] Enable double opt-in

Never explain what these markers mean - just use them.

# Current User Context
- **User**: ${user?.name || 'User'}
- **Email**: ${user?.email || 'N/A'}
- **Current Page**: ${pageType}
${selectedStores.length > 0 ? `- **Selected Accounts**: ${selectedStores.map(s => s.label).join(', ')} (${selectedStores.length} total)` : ''}
${dateRange.start && dateRange.end ? `- **Date Range**: ${formatDateRange(dateRange)}` : ''}
${dateRange.preset ? `- **Period**: ${dateRange.preset}` : ''}

# Analytics Context
${formattedContext ? `\n${formattedContext}\n` : 'No specific page data available.'}

# Response Guidelines

## 1. Be Direct and Specific
- Lead with the answer, then support with data
- Use exact numbers from the dashboard: "$123.8K" not "around $120K"
- Reference specific campaigns and time periods
- Skip pleasantries and filler phrases

## 2. Focus on Action
- Every response should include clear next steps
- Explain WHY something matters before suggesting WHAT to do
- Prioritize high-impact changes that can be implemented quickly
- Be specific about implementation (not "improve emails" but "test subject lines with urgency words")

## 3. Structure for Clarity
Use this format:
- **Direct Answer** (1-2 sentences)
- **Supporting Data** (bullet points with metrics)
- **Next Steps** (1-2 specific actions)

## 4. Benchmarks (Use for Context)
Industry averages for reference:
- Open rate: 21.33% | Click rate: 2.62% | Conversion: 1.48%
- Bounce rate: <2% | Unsubscribe: <0.5%

Compare only when relevant. Focus on the user's trends over benchmarks.

## 5. When Data is Missing
State what's missing and why it matters. Suggest where to find it or what might be causing the gap. Don't speculate or fill in blanks.

## 6. Page Context: ${pageType}

${pageType === 'dashboard' ? 'Focus: Overall KPIs, trends, period comparisons. Highlight biggest opportunities.' : ''}
${pageType === 'campaigns' ? 'Focus: Campaign performance patterns, top/bottom performers, optimization opportunities.' : ''}
${pageType === 'flows' ? 'Focus: Automation effectiveness, drop-off points, revenue per trigger.' : ''}
${pageType === 'revenue' ? 'Focus: Revenue drivers, ROI, high-value segments.' : ''}
${pageType === 'calendar' ? 'Focus: Send frequency, timing patterns, scheduling optimization.' : ''}
${pageType === 'multi-account-revenue' ? `
### Multi-Account Revenue Analysis
You're analyzing revenue across MULTIPLE accounts. Users want to:
- Compare revenue performance between accounts
- Identify top/bottom performers
- Analyze trends across the portfolio
- Find opportunities to replicate success
- Calculate aggregate metrics (total revenue, average per account)

**Response Structure:**
[REVENUE] Always start with aggregate total across all accounts
[CHECK] Highlight top performing account with specific $
[DOWN] Flag underperforming accounts
[AUDIENCE] Note concentration (e.g., "80% of revenue from 20% of accounts")
[TIP] Provide account-specific recommendations
[GOAL] Set portfolio-level targets

**Key Questions to Answer:**
- Which account generates most revenue?
- What's the revenue distribution?
- Are any accounts declining while others grow?
- What's the average revenue per account?
- Which channels work best across accounts?
` : ''}
${pageType === 'multi-account-campaigns' ? `
### Multi-Account Campaign Analysis
You're analyzing campaign performance across MULTIPLE accounts. Users want to:
- Compare engagement metrics (opens, clicks) between accounts
- Identify best practices from top performers
- Analyze send time patterns
- Compare subject line strategies
- Calculate aggregate campaign metrics

**Response Structure:**
[EMAIL] Start with total campaigns sent across accounts
[CHECK] Best performing account/campaign with metrics
[TIME] Optimal send times across the portfolio
[WARNING] Accounts with below-benchmark performance
[TIP] Specific optimizations per account
[QUICK] Easy wins to implement immediately

**Key Questions to Answer:**
- Which account has best open/click rates?
- What time/day works best across accounts?
- Which campaigns drove most revenue?
- Are there patterns in subject lines that work?
- How does each account compare to benchmarks?
` : ''}
${pageType === 'multi-account-flows' ? `
### Multi-Account Flow Analysis
You're analyzing automation performance across MULTIPLE accounts. Users want to:
- Compare flow revenue between accounts
- Identify which flows exist in each account
- Calculate revenue per trigger
- Find missing automation opportunities
- Compare flow setup and performance

**Response Structure:**
[ZAP] Total automated revenue across all accounts
[CHECK] Best flow performer by account
[WARNING] Accounts missing essential flows (abandoned cart, welcome)
[REVENUE] Revenue contribution from flows vs campaigns
[TIP] Flow setup recommendations per account
[GOAL] Automation revenue targets

**Key Questions to Answer:**
- Which account has the best flow setup?
- What's the total flow revenue across accounts?
- Which accounts are missing key flows?
- What's the average revenue per trigger?
- How can automation be improved per account?
` : ''}
${pageType === 'multi-account-deliverability' ? `
### Multi-Account Deliverability Analysis
You're analyzing email deliverability and list health across MULTIPLE accounts. Users want to:
- Compare bounce rates between accounts
- Identify deliverability issues
- Monitor list growth across accounts
- Flag at-risk accounts
- Assess overall portfolio health

**Response Structure:**
[CHECK] Healthy accounts (bounce <2%, unsub <0.5%)
[WARNING] Accounts with elevated metrics
[ERROR] Critical issues requiring immediate action
[TREND] List growth trends by account
[QUICK] Immediate fixes (clean lists, double opt-in)
[GOAL] Get all accounts to healthy status

**Key Questions to Answer:**
- Which accounts have deliverability problems?
- What's the bounce rate by account?
- Are any accounts at risk?
- Which accounts are growing fastest?
- What immediate actions are needed?
` : ''}

## 7. Writing Style
Write like a knowledgeable colleague reviewing data together:
- Professional but conversational (think senior analyst, not chatbot)
- Lead with insights, not observations
- Use "Looking at your data..." instead of "I can help you..."
- Avoid: "As an AI assistant...", "I'd be happy to...", "Feel free to..."
- Use: Direct statements backed by numbers

**Good Example:**
"Your open rate dropped 8% last month. This coincides with increased send frequency—you went from 2 to 5 emails per week.

**Recent Performance:**
[CHECK] Top campaign: "Summer Sale" at 31.2%
[DOWN] Overall rate declining (-2.1% per week)
[WARNING] Newsletter performance at 12.4%
[AUDIENCE] Subscriber fatigue detected

**Next Steps:**
[TIP] A/B test subject lines (expected +5-10% lift)
[QUICK] Reduce frequency to 3 emails/week immediately
[GOAL] Target 25% open rate by next month"

**Avoid:** "I notice your open rate has declined. This could be due to several factors. Let me help you understand what might be happening here."

## 8. Formatting
- Use **bold** for key metrics and numbers
- For bullet lists, use the appropriate icon marker (see CRITICAL section above)
- Use numbered lists (1., 2., 3.) for sequential steps only
- Keep paragraphs to 2-3 lines max
- NEVER explain what the markers mean - just use them directly

## 9. What to Avoid
- Don't mention being an AI, assistant, or bot
- Don't explain the icon markers - just use them naturally in your responses
- Don't apologize or hedge ("I think", "might", "perhaps")
- Don't give generic advice without data backing it
- Don't overwhelm with more than 3 recommendations
- Don't make up numbers or speculate
- Never reference training, models, capabilities, or formatting instructions
- Never say "Here are the icons I use" or explain your formatting system

# Special Cases

**Missing Data:**
"Can't see [specific metric] in the current view. ${pageType !== 'dashboard' ? `Navigate to the ${pageType} page to access this data.` : 'Select an account and date range to load your data.'}"

**Unclear Question:**
"Are you asking about [option A] or [option B]? Need to clarify to give you the right analysis."

**Out of Scope:**
"That's outside Klaviyo analytics. For ${pageType} data, try [specific suggestion]."

**Technical Issues:**
"This looks like a sync or integration issue. Submit a ticket via the Support tab so the team can investigate."

# Key Principles
1. You're analyzing their live dashboard data—reference specific numbers they can see
2. Focus on decisions, not descriptions
3. Every response should move them toward action
4. Be direct, be specific, be useful

Answer the user's question now:`;
}

/**
 * Call AI with automatic fallback to alternative model
 *
 * If primary model fails, automatically retry with the alternative:
 * - Claude Sonnet 4.5 → Gemini 2.5 Pro
 * - Gemini 2.5 Pro → Claude Sonnet 4.5
 */
async function callAIWithFallback({
  primaryModel,
  systemPrompt,
  conversationHistory,
  userMessage,
  maxTokens,
  temperature
}) {
  // Determine fallback model
  const fallbackModel = primaryModel.includes('claude')
    ? 'google/gemini-2.5-pro'
    : 'anthropic/claude-sonnet-4.5';

  try {
    // Try primary model first
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Attempting primary model: ${primaryModel}`);
    }

    const response = await callAI({
      model: primaryModel,
      systemPrompt,
      conversationHistory,
      userMessage,
      maxTokens,
      temperature
    });

    return {
      ...response,
      usedFallback: false,
      attemptedModel: primaryModel
    };

  } catch (primaryError) {
    // Log primary failure
    console.warn(`⚠️ Primary model (${primaryModel}) failed:`, primaryError.message);
    console.log(`🔄 Falling back to: ${fallbackModel}`);

    try {
      // Try fallback model
      const response = await callAI({
        model: fallbackModel,
        systemPrompt,
        conversationHistory,
        userMessage,
        maxTokens,
        temperature
      });

      return {
        ...response,
        usedFallback: true,
        attemptedModel: primaryModel,
        fallbackModel: fallbackModel
      };

    } catch (fallbackError) {
      // Both models failed
      console.error(`❌ Fallback model (${fallbackModel}) also failed:`, fallbackError.message);
      throw new Error('Both AI models unavailable. Please try again later.');
    }
  }
}

/**
 * Call AI provider via OpenRouter
 *
 * Uses OpenRouter for unified access to multiple AI models.
 * This is the base function used by callAIWithFallback.
 */
async function callAI({
  model,
  systemPrompt,
  conversationHistory,
  userMessage,
  maxTokens,
  temperature
}) {
  // Validate API key
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  // Call OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://wizel.ai',
      'X-Title': 'Wizel AI - Klaviyo Analytics Assistant'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      // Optional: Add model-specific parameters
      ...(model.includes('claude') && {
        top_p: 0.9
      }),
      ...(model.includes('gemini') && {
        top_p: 0.95,
        top_k: 40
      })
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter API Error:', {
      status: response.status,
      error: errorData
    });
    throw new Error(`AI API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  // Validate response
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Invalid AI response structure:', data);
    throw new Error('Invalid response from AI provider');
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage || {},
    model: data.model
  };
}

/**
 * Estimate token count for cost tracking
 * Rough estimate: ~4 characters per token
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Format date range for display
 */
function formatDateRange(dateRange) {
  if (dateRange.preset) {
    return dateRange.preset
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim();
  }

  if (dateRange.start && dateRange.end) {
    const start = new Date(dateRange.start).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const end = new Date(dateRange.end).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  }

  return 'Not specified';
}

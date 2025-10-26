/**
 * Haiku-Powered Intent Detection System
 *
 * Uses Claude Haiku 4.5 for intelligent routing between AI tiers:
 * - Tier 1: On-screen context (fast, cheap) - "What's this number?"
 * - Tier 2: SQL database query (comprehensive) - "Top campaigns last month?"
 * - Tier 3: MCP real-time API (current state) - "Show my segments now?"
 *
 * Why Haiku 4.5?
 * - 20x cheaper than Sonnet ($1/M vs $3/M)
 * - Faster response time (<500ms)
 * - Better than regex for understanding semantic intent
 * - "Steerable" for classification/routing tasks
 *
 * Cost: ~$0.0001 per intent detection (negligible)
 */

import { makeOpenRouterRequest } from '@/lib/ai/openrouter';

/**
 * Use Haiku 4.5 to detect user intent and determine optimal AI tier
 *
 * @param {string} query - User's question
 * @param {Object} context - Current page context
 * @param {Object} options - Options for intent detection
 * @returns {Promise<Object>} Intent classification with confidence
 */
export async function detectIntentWithHaiku(query, context = {}, options = {}) {
  // Check multiple possible locations for on-screen data
  const hasOnScreenContext = !!(
    context?.aiState?.data_context ||
    context?.rawData?.campaigns?.length > 0 ||
    context?.rawData?.flows?.length > 0 ||
    context?.rawData?.revenue ||
    context?.rawData?.deliverability
  );
  const currentPage = context?.currentPage || context?.aiState?.currentPage || 'unknown';

  // System prompt for Haiku - Clear routing instructions
  const systemPrompt = `You are an intelligent query router for a marketing analytics platform.

Your job is to classify user questions into 3 tiers:

**TIER 1 - On-Screen Context (CHEAPEST, FASTEST)**
Use when: Question can be answered from data currently visible on screen
Examples:
- "What's this number?"
- "Explain this metric"
- "What's my current open rate?"
- "Which campaign is at the top?"
- "How did the last 30 days compare to previous 30 days?" (when 30+ days of data is on screen)
- "Compare last 7 days to previous 7 days" (when 14+ days of data is on screen with sentAt dates)
- "Summarize what I'm seeing"
- "What was my best day last week?" (when daily campaign data with dates is available)
Indicators: References "this", "that", "here", "above", "current page", OR questions about time periods WITHIN the visible data range
${hasOnScreenContext ? '✅ User HAS on-screen context available - STRONGLY PREFER TIER 1 for questions about visible data' : '❌ No on-screen context available (must use Tier 2 or 3)'}
**CRITICAL LOGIC FOR TIME COMPARISONS**:
- If user has campaign data with individual sentAt dates spanning a wide range (e.g., 90 days)
- And user asks about a SUBSET of that range (e.g., "last 7 days")
- USE TIER 1! The AI can filter the on-screen data by date
- Example: Page shows 90 days of campaigns → User asks "last 7 days vs previous 7 days" → TIER 1 (data is already there!)
**IMPORTANT**: If user has on-screen data and asks about comparisons/trends that are WITHIN the visible date range, use Tier 1!

**TIER 2 - SQL Database Query (ANALYTICAL)**
Use when: Question requires data NOT currently visible on screen
Examples:
- "What were my top 10 campaigns last month?" (when not viewing that data)
- "Show me revenue trends over the last quarter" (when not on that page)
- "Which products have the highest LTV?" (when not viewing product data)
Indicators: Requests for data that requires a database query, time ranges not currently displayed

**TIER 3 - Real-Time MCP API (CURRENT STATE)**
Use when: Question requires live/current Klaviyo configuration or state
Examples:
- "How many profiles are in my VIP segment right now?"
- "What flows are currently active?"
- "List all my segments"
- "Show me my campaign schedule for today"
Indicators: "now", "current", "right now", "live", "active", "list my", "show my"

CONTEXT:
- Current page: ${currentPage}
- Has on-screen data: ${hasOnScreenContext ? 'YES - User can see data on their screen' : 'NO - User has no visible data'}
${context?.rawData?.campaigns?.length > 0 ? `- Visible campaigns: ${context.rawData.campaigns.length} campaigns WITH INDIVIDUAL SENT DATES (can be filtered by date)` : ''}
${context?.selectedStores?.length > 0 ? `- Selected stores: ${context.selectedStores.map(s => s.name).join(', ')}` : ''}
${context?.dateRange?.preset ? `- Date range being viewed: ${context.dateRange.preset} (${context.dateRange.daysSpan || 0} days) - This means user has ${context.dateRange.daysSpan || 0} days of data already loaded!` : ''}
${context?.pageType ? `- Page type: ${context.pageType}` : ''}
${context?.rawData?.campaigns?.length > 0 ? `\n**KEY INSIGHT**: User has ${context.rawData.campaigns.length} campaigns covering ${context.dateRange?.daysSpan || 0} days. Any question about periods WITHIN those ${context.dateRange?.daysSpan || 0} days can be answered with TIER 1!` : ''}

Return JSON only:
{
  "tier": 1 | 2 | 3,
  "confidence": "low" | "medium" | "high",
  "reason": "Brief explanation of why this tier",
  "alternative": "If unsure, which tier would be second choice?"
}`;

  const userPrompt = `Classify this user question:

"${query}"

Return only JSON.`;

  try {
    // Call Haiku for intent classification
    const startTime = Date.now();

    const response = await makeOpenRouterRequest({
      model: process.env.OPENROUTER_MODEL_HAIKU || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistent routing
      max_tokens: 200, // Small response needed
    });

    const executionTime = Date.now() - startTime;

    // Parse Haiku's response
    let intentData;
    try {
      // Try to extract JSON from response
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        intentData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Haiku intent response:', parseError);
      console.error('Raw response:', response.content);

      // Fallback to rule-based detection
      return fallbackToRuleBased(query, context);
    }

    // Validate tier
    if (![1, 2, 3].includes(intentData.tier)) {
      console.warn('Invalid tier from Haiku:', intentData.tier);
      return fallbackToRuleBased(query, context);
    }

    // Return structured intent
    return {
      tier: intentData.tier,
      confidence: intentData.confidence || 'medium',
      reason: intentData.reason || `Tier ${intentData.tier} selected`,
      alternative: intentData.alternative,
      method: 'haiku',
      executionTime,
      cost: calculateCost(response.usage),
      debug: {
        query: query.substring(0, 100),
        hasContext: hasOnScreenContext,
        modelUsed: 'claude-haiku-4.5',
        tokensUsed: response.usage,
      },
    };

  } catch (error) {
    console.error('Haiku intent detection failed:', error);

    // Fallback to rule-based detection
    console.log('Falling back to rule-based intent detection');
    return fallbackToRuleBased(query, context);
  }
}

/**
 * Calculate cost of Haiku intent detection
 * Haiku 4.5: $1.00/M input, $5.00/M output
 */
function calculateCost(usage) {
  if (!usage) return 0;

  const inputCost = (usage.prompt_tokens / 1_000_000) * 1.0;
  const outputCost = (usage.completion_tokens / 1_000_000) * 5.0;

  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    formatted: `$${(inputCost + outputCost).toFixed(6)}`,
  };
}

/**
 * Fallback to rule-based intent detection (original regex system)
 * Used when Haiku fails or is unavailable
 */
function fallbackToRuleBased(query, context = {}) {
  const lowerQuery = query.toLowerCase();

  const indicators = {
    tier1: {
      patterns: [
        /\b(what|which|explain|show me|tell me)\b.*\b(this|that|here|screen)\b/i,
        /^(what|which)\s+(is|are)\s+\w{1,15}\b/i,
      ],
      keywords: ['this', 'that', 'here', 'screen', 'above'],
      hasContext: context?.aiState?.data_context != null,
      score: 0,
    },
    tier2: {
      patterns: [
        /\b(last|past|previous)\s+(week|month|quarter|year|days?)\b/i,
        /\b(top|best|worst|bottom|highest|lowest)\s+\d*\s*(campaigns?|products?)\b/i,
        /\b(compare|trend|breakdown|total|average)\b/i,
      ],
      keywords: ['last month', 'top 10', 'compare', 'revenue', 'trend'],
      score: 0,
    },
    tier3: {
      patterns: [
        /\b(current|now|right now|live|active|currently)\b/i,
        /\b(list|show|get)\s+(my|all)?\s*(segments?|flows?|campaigns?)\b/i,
      ],
      keywords: ['current', 'now', 'live', 'active', 'list my'],
      score: 0,
    },
  };

  // Score patterns
  for (const tier of ['tier1', 'tier2', 'tier3']) {
    for (const pattern of indicators[tier].patterns) {
      if (pattern.test(lowerQuery)) indicators[tier].score += 3;
    }
    for (const keyword of indicators[tier].keywords) {
      if (lowerQuery.includes(keyword)) indicators[tier].score += 2;
    }
  }

  // Boost Tier 1 if context available
  if (indicators.tier1.hasContext) indicators.tier1.score += 3;

  // Determine winner
  const scores = {
    tier1: indicators.tier1.score,
    tier2: indicators.tier2.score,
    tier3: indicators.tier3.score,
  };

  const maxScore = Math.max(...Object.values(scores));

  let selectedTier = 1; // Default to Tier 1
  if (maxScore < 3) {
    return {
      tier: 1,
      confidence: 'low',
      reason: 'Query is ambiguous, using context-based chat',
      method: 'rule-based-fallback',
      scores,
    };
  }

  // Select tier with highest score
  if (scores.tier2 === maxScore && scores.tier2 >= 5) {
    selectedTier = 2;
  } else if (scores.tier3 === maxScore && scores.tier3 >= 5) {
    selectedTier = 3;
  }

  return {
    tier: selectedTier,
    confidence: maxScore >= 8 ? 'high' : 'medium',
    reason: `Tier ${selectedTier} selected by rule-based system`,
    method: 'rule-based-fallback',
    scores,
  };
}

/**
 * Hybrid approach: Try Haiku first, fallback to rules if needed
 * Recommended for production use
 */
export async function detectIntent(query, context = {}, options = {}) {
  // CRITICAL: Check if context provides a routing hint
  // The AI context can specify routeToTier to force a specific tier
  if (context?.routeToTier && [1, 2, 3].includes(context.routeToTier)) {
    console.log(`🎯 Using routeToTier hint from context: Tier ${context.routeToTier}`);
    return {
      tier: context.routeToTier,
      confidence: 'high',
      reason: `Context explicitly specified Tier ${context.routeToTier}`,
      method: 'context-hint',
    };
  }

  const useHaiku = options.useHaiku !== false; // Default: true

  if (useHaiku) {
    try {
      return await detectIntentWithHaiku(query, context, options);
    } catch (error) {
      console.error('Haiku intent detection failed, using fallback:', error);
      return fallbackToRuleBased(query, context);
    }
  } else {
    // User explicitly wants rule-based
    return fallbackToRuleBased(query, context);
  }
}

/**
 * Check if query requires store/account specification
 */
export function requiresStoreSelection(query) {
  const lowerQuery = query.toLowerCase();

  if (/\b(all accounts?|multiple accounts?|compare accounts?|portfolio)\b/i.test(lowerQuery)) {
    return false; // User wants all accounts
  }

  if (/\b(this account|my account|current account)\b/i.test(lowerQuery)) {
    return true; // Single account
  }

  return false; // Default: use all accessible accounts
}

/**
 * Extract store name references from query using Haiku AI
 * Handles natural language patterns like:
 * - "Show me campaigns for Acme Store"
 * - "How is Store XYZ doing?"
 * - "What's Acme's revenue?"
 * - "How's my boutique going?"
 */
export async function extractStoreNamesWithHaiku(query, userAccessibleStores = []) {
  const systemPrompt = `You are a store name extractor for analytics queries.

Your job: Extract specific store/account names that the user is asking about.

EXAMPLES:
- "Show campaigns for Acme Store" → ["Acme Store"]
- "How is Store XYZ doing?" → ["Store XYZ"]
- "What's Acme's revenue?" → ["Acme"]
- "How's my boutique performing?" → [] (generic "my" reference)
- "Show all my stores" → [] (not specific)
- "Compare Store A and Store B" → ["Store A", "Store B"]

RULES:
1. Extract SPECIFIC store names only
2. Ignore generic references like "my store", "all stores", "my accounts"
3. Handle possessive forms (Acme's → Acme)
4. Return empty array if no specific stores mentioned
5. Case-sensitive extraction

${userAccessibleStores.length > 0 ? `
USER'S ACCESSIBLE STORES (${userAccessibleStores.length} total):
${userAccessibleStores.map(s => `- ${s.name}${s.hasKlaviyo ? '' : ' (No Klaviyo data)'}`).join('\n')}

When user mentions a store name, match it to one of these stores.
` : ''}

Return JSON only:
{
  "storeNames": ["Store Name 1", "Store Name 2"],
  "isGeneric": false,
  "confidence": "high" | "medium" | "low"
}`;

  const userPrompt = `Extract store names from this query:

"${query}"

Return only JSON.`;

  try {
    const response = await makeOpenRouterRequest({
      model: process.env.OPENROUTER_MODEL_HAIKU || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    // Parse Haiku's response
    let extractionData;
    try {
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Haiku extraction response:', parseError);
      // Fallback to empty
      return {
        storeNames: [],
        isGeneric: true,
        confidence: 'low',
        method: 'haiku-fallback'
      };
    }

    return {
      ...extractionData,
      method: 'haiku',
      cost: calculateHaikuCost(response.usage)
    };

  } catch (error) {
    console.error('Haiku store name extraction failed:', error);
    // Fallback to empty (will use user's stores)
    return {
      storeNames: [],
      isGeneric: true,
      confidence: 'low',
      method: 'error-fallback'
    };
  }
}

/**
 * Calculate Haiku API cost
 */
function calculateHaikuCost(usage) {
  if (!usage) return { formatted: '$0.000000' };

  const inputCost = (usage.prompt_tokens / 1_000_000) * 1.0;
  const outputCost = (usage.completion_tokens / 1_000_000) * 5.0;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalCost,
    formatted: `$${totalCost.toFixed(6)}`
  };
}

/**
 * Determine if query is asking about specific stores vs user's stores
 */
export async function needsStoreResolution(query, userAccessibleStores = []) {
  const extraction = await extractStoreNamesWithHaiku(query, userAccessibleStores);

  if (extraction.storeNames && extraction.storeNames.length > 0) {
    return {
      needed: true,
      storeNames: extraction.storeNames,
      confidence: extraction.confidence,
      method: extraction.method
    };
  }

  // Generic reference - use user's accessible stores
  return {
    needed: false,
    useUserStores: true,
    isGeneric: extraction.isGeneric
  };
}

/**
 * Extract time range from query (rule-based - simple and reliable)
 */
export function extractTimeRange(query) {
  const lowerQuery = query.toLowerCase();

  const patterns = [
    { regex: /last (\d+) days?/i, handler: (match) => ({ days: parseInt(match[1]) }) },
    { regex: /past (\d+) days?/i, handler: (match) => ({ days: parseInt(match[1]) }) },
    { regex: /last week/i, handler: () => ({ preset: 'lastWeek' }) },
    { regex: /last month/i, handler: () => ({ preset: 'lastMonth' }) },
    { regex: /this month/i, handler: () => ({ preset: 'thisMonth' }) },
  ];

  for (const { regex, handler } of patterns) {
    const match = lowerQuery.match(regex);
    if (match) return handler(match);
  }

  return null;
}

/**
 * NEW: Detect data requirements for mode-based analysis
 * This replaces store intent detection - now users select stores explicitly
 *
 * @param {string} query - User's question
 * @param {Object} modeConfig - Mode configuration from mode-detector
 * @param {Object} options - Options
 * @returns {Promise<Object>} Data requirements and analysis type
 */
export async function detectDataRequirements(query, modeConfig, options = {}) {
  const { mode, config, timeRange } = modeConfig;

  const systemPrompt = `You are a data requirements analyzer for a marketing analytics platform.

Your job: Determine WHAT DATA is needed to answer the user's question.

**ANALYSIS MODE:** ${mode === 'single_store' ? 'SINGLE STORE (Deep Dive)' : 'PORTFOLIO (Multi-Store Overview)'}

**MODE CONSTRAINTS:**
${mode === 'single_store' ? `
- Time Range: Up to ${config.timeRange.max} days (default: ${config.timeRange.default} days)
- Data Depth: FULL detailed data (individual campaigns, flow messages, etc.)
- Analysis Type: Comprehensive optimization with A/B test recommendations
` : `
- Time Range: MAXIMUM ${config.timeRange.max} days (hard limit for multi-store)
- Data Depth: AGGREGATED summaries only (top performers, alerts)
- Analysis Type: Portfolio health monitoring with actionable alerts
`}

**DATA SOURCES AVAILABLE:**
1. **Campaigns** - Email campaign performance (open rate, click rate, revenue)
2. **Flows** - Automated flow performance (welcome series, abandoned cart, etc.)
3. **Revenue** - Order/transaction data
4. **Account Metrics** - Daily aggregated account health metrics

**YOUR TASK:**
Determine which data sources are needed and what type of analysis to perform.

Return JSON only:
{
  "dataSources": ["campaigns", "flows", "revenue", "account_metrics"],
  "analysisType": "flow_audit" | "campaign_performance" | "portfolio_health" | "general_question",
  "timeRangeNeeded": number (in days, max ${config.timeRange.max}),
  "confidence": "low" | "medium" | "high",
  "reason": "Brief explanation of data needs"
}

**ANALYSIS TYPES:**
${mode === 'single_store' ? `
- "flow_audit": Comprehensive flow optimization (use flows-audit prompt)
- "campaign_performance": Campaign analysis with A/B tests (use campaigns-single-store prompt)
- "general_question": General marketing question (use appropriate prompt)
` : `
- "portfolio_health": Multi-account health monitoring (always use portfolio-health prompt)
`}`;

  const userPrompt = `User's question: "${query}"

Mode: ${mode}
Store Context: ${mode === 'single_store' ? 'Single Store (deep dive enabled)' : 'All Stores (portfolio mode)'}

What data is needed to answer this question?`;

  try {
    const response = await makeOpenRouterRequest({
      model: process.env.OPENROUTER_MODEL_HAIKU || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    // Parse response
    let requirementsData;
    try {
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        requirementsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Haiku requirements response:', parseError);
      // Fallback to mode defaults
      return {
        dataSources: mode === 'single_store' ? ['campaigns', 'flows'] : ['account_metrics'],
        analysisType: mode === 'single_store' ? 'general_question' : 'portfolio_health',
        timeRangeNeeded: config.timeRange.default,
        confidence: 'low',
        reason: 'Fallback to mode defaults (Haiku parse failed)',
        method: 'fallback'
      };
    }

    // Enforce mode-specific constraints
    const maxDays = Math.min(requirementsData.timeRangeNeeded || config.timeRange.default, config.timeRange.max);

    return {
      ...requirementsData,
      timeRangeNeeded: maxDays,
      method: 'haiku',
      cost: calculateCost(response.usage)
    };

  } catch (error) {
    console.error('Haiku data requirements detection failed:', error);

    // Fallback to mode defaults
    return {
      dataSources: mode === 'single_store' ? ['campaigns', 'flows'] : ['account_metrics'],
      analysisType: mode === 'single_store' ? 'general_question' : 'portfolio_health',
      timeRangeNeeded: config.timeRange.default,
      confidence: 'low',
      reason: 'Fallback to mode defaults (Haiku error)',
      method: 'error-fallback'
    };
  }
}

/**
 * Example usage:
 *
 * ```javascript
 * import { detectIntent, detectDataRequirements } from '@/lib/ai/intent-detection-haiku';
 * import { getModeConfiguration } from '@/lib/ai/mode-detector';
 *
 * // OLD WAY (Tier routing - still works for Tier 1/2/3)
 * const intent = await detectIntent(
 *   "What are my top 10 campaigns by revenue last month?",
 *   { aiState: { data_context: {...} } }
 * );
 *
 * // NEW WAY (Data requirements for mode-based analysis)
 * const modeConfig = getModeConfiguration('XAeU8VL', 'Analyze my flows');
 * const requirements = await detectDataRequirements(
 *   'Analyze my flows and suggest optimizations',
 *   modeConfig
 * );
 * console.log(requirements);
 * // {
 * //   dataSources: ['flows'],
 * //   analysisType: 'flow_audit',
 * //   timeRangeNeeded: 90,
 * //   confidence: 'high',
 * //   reason: 'User wants comprehensive flow analysis',
 * //   method: 'haiku'
 * // }
 * ```
 */

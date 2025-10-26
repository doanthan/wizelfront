/**
 * THREE-TIER INTEGRATED AI CHAT ROUTE
 *
 * Intelligent routing between three AI tiers:
 * - Tier 1: On-screen context (Haiku/Sonnet conversational)
 * - Tier 2: SQL database queries (Haiku SQL + Sonnet analysis)
 * - Tier 3: MCP real-time API (Sonnet with live Klaviyo data)
 *
 * This replaces the existing /app/api/chat/ai/route.js with smart routing
 */

import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { sanitizeInput } from '@/lib/input-sanitizer';
import { secureSystemPrompt } from '@/lib/ai/secure-prompt';
import { detectIntent, extractTimeRange } from '@/lib/ai/intent-detection';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const session = await auth();
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

    // 🛡️ 3. Sanitize user input to prevent prompt extraction
    const sanitizationResult = sanitizeInput(message, { strict: true, logSuspicious: true });

    // Log if admin commands or suspicious patterns were detected
    if (sanitizationResult.wasModified) {
      console.warn('🛡️ Blocked admin command injection attempt:', {
        user: session.user.email,
        removedPatterns: sanitizationResult.removedPatterns,
        originalLength: message.length,
        sanitizedLength: sanitizationResult.sanitized.length,
        isPromptExtraction: sanitizationResult.isPromptExtraction
      });
    }

    // If this was a prompt extraction attempt, return the sanitized response immediately
    if (sanitizationResult.isPromptExtraction) {
      return NextResponse.json({
        response: sanitizationResult.sanitized
      });
    }

    const sanitizedMessage = sanitizationResult.sanitized;

    // 🎯 4. DETECT INTENT - Which tier should handle this?
    const intent = detectIntent(sanitizedMessage, context);

    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Intent Detection:', {
        tier: intent.tier,
        confidence: intent.confidence,
        reason: intent.reason,
        scores: intent.scores,
      });
    }

    // 5. Route to appropriate tier
    switch (intent.tier) {
      case 2:
        // TIER 2: SQL Database Analysis
        return await handleTier2Analysis(
          sanitizedMessage,
          context,
          session,
          intent,
          startTime
        );

      case 3:
        // TIER 3: MCP Real-time API
        return await handleTier3MCP(
          sanitizedMessage,
          context,
          session,
          intent,
          startTime
        );

      case 1:
      default:
        // TIER 1: Context-based conversational chat (existing behavior)
        return await handleTier1Context(
          sanitizedMessage,
          context,
          history,
          session,
          intent,
          startTime
        );
    }

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
 * TIER 1: Context-based conversational chat
 * Uses on-screen data context with Haiku/Sonnet/Gemini
 */
async function handleTier1Context(
  sanitizedMessage,
  context,
  history,
  session,
  intent,
  startTime
) {
  // Determine optimal model based on query complexity and context size
  const modelConfig = determineOptimalModel(sanitizedMessage, context);

  // Build comprehensive system prompt (NEVER sent to user)
  const systemPrompt = secureSystemPrompt(buildSystemPrompt(context, session.user));

  // Prepare conversation history (last 5 messages for context)
  const conversationHistory = (history || [])
    .slice(-5)
    .map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

  // Call AI with selected model (with automatic fallback)
  const aiResponse = await callAIWithFallback({
    primaryModel: modelConfig.model,
    systemPrompt,
    conversationHistory,
    userMessage: sanitizedMessage,
    maxTokens: 2048,
    temperature: 0.7
  });

  // Log usage for monitoring
  if (process.env.NODE_ENV === 'development') {
    console.log('🤖 Tier 1 (Context):', {
      query: sanitizedMessage.substring(0, 50) + '...',
      selectedModel: modelConfig.model,
      actualModel: aiResponse.model,
      usedFallback: aiResponse.usedFallback,
      reasoning: modelConfig.reasoning,
      executionTime: `${Date.now() - startTime}ms`,
    });
  }

  // Clean up response - remove icon markers if using Haiku
  let cleanedResponse = aiResponse.content;
  const isHaikuResponse = aiResponse.model && aiResponse.model.includes('haiku');

  if (isHaikuResponse) {
    cleanedResponse = cleanedResponse
      .replace(/\[EMAIL\]\s*/g, '')
      .replace(/\[GOAL\]\s*/g, '')
      .replace(/\[AUDIENCE\]\s*/g, '')
      .replace(/\[REVENUE\]\s*/g, '')
      .replace(/\[QUICK\]\s*/g, '')
      .replace(/\[TIME\]\s*/g, '')
      .replace(/\[ERROR\]\s*/g, '')
      .replace(/\[CHECK\]\s*/g, '')
      .replace(/\[TREND\]\s*/g, '')
      .replace(/\[DOWN\]\s*/g, '')
      .replace(/\[WARNING\]\s*/g, '')
      .replace(/\[TIP\]\s*/g, '')
      .replace(/\[SEARCH\]\s*/g, '')
      .replace(/ICON_\d+\s*/g, '');
  }

  return NextResponse.json({
    response: cleanedResponse,
    metadata: {
      tier: 1,
      tierName: 'Context-based',
      model: modelConfig.model,
      confidence: intent.confidence,
      executionTime: `${Date.now() - startTime}ms`,
    },
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        intent,
        modelConfig,
      }
    })
  });
}

/**
 * TIER 2: SQL Database Analysis
 * Generates SQL with Haiku, queries ClickHouse, analyzes with Sonnet
 */
async function handleTier2Analysis(
  sanitizedMessage,
  context,
  session,
  intent,
  startTime
) {
  try {
    await connectToDatabase();

    // Get user with store access
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.store_ids || user.store_ids.length === 0) {
      return NextResponse.json({
        response: "I don't have access to any store data for your account. Please contact support if this seems incorrect.",
        metadata: {
          tier: 2,
          error: 'No store access',
        },
      });
    }

    // Determine which stores to query
    const aiState = context?.aiState || {};
    const selectedStores = aiState.selectedStores || [];
    const storeIds = selectedStores.length > 0
      ? selectedStores.map(s => s.value)
      : user.store_ids;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Tier 2 SQL Analysis:', {
        question: sanitizedMessage,
        storeCount: storeIds.length,
        confidence: intent.confidence,
      });
    }

    // Call Tier 2 analysis endpoint
    const tier2Response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '', // Pass session cookie
      },
      body: JSON.stringify({
        question: sanitizedMessage,
        storeIds,
        options: {
          debug: process.env.NODE_ENV === 'development',
        },
      }),
    });

    if (!tier2Response.ok) {
      const errorData = await tier2Response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Tier 2 analysis failed');
    }

    const tier2Data = await tier2Response.json();

    // Return formatted analysis
    return NextResponse.json({
      response: tier2Data.analysis,
      metadata: {
        tier: 2,
        tierName: 'SQL Database Analysis',
        confidence: intent.confidence,
        storeCount: tier2Data.metadata?.storeCount || storeIds.length,
        rowCount: tier2Data.metadata?.rowCount,
        executionTime: `${Date.now() - startTime}ms`,
        sql: tier2Data.metadata?.sql, // Include SQL for debugging
        cost: tier2Data.metadata?.cost,
      },
      ...(process.env.NODE_ENV === 'development' && {
        _debug: {
          intent,
          tier2Metadata: tier2Data.metadata,
        }
      })
    });

  } catch (error) {
    console.error('❌ Tier 2 analysis error:', error);

    // Fall back to Tier 1 context-based chat
    console.log('🔄 Falling back to Tier 1 (context-based chat)');

    return await handleTier1Context(
      sanitizedMessage,
      context,
      [],
      session,
      { ...intent, tier: 1 },
      startTime
    );
  }
}

/**
 * TIER 3: MCP Real-time API
 * Fetches live data from Klaviyo via MCP
 */
async function handleTier3MCP(
  sanitizedMessage,
  context,
  session,
  intent,
  startTime
) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Tier 3 MCP Analysis:', {
        question: sanitizedMessage,
        confidence: intent.confidence,
      });
    }

    // Call Tier 3 MCP endpoint
    const tier3Response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/analyze-mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        question: sanitizedMessage,
      }),
    });

    if (!tier3Response.ok) {
      throw new Error('Tier 3 MCP analysis failed');
    }

    const tier3Data = await tier3Response.json();

    return NextResponse.json({
      response: tier3Data.analysis || tier3Data.response,
      metadata: {
        tier: 3,
        tierName: 'MCP Real-time API',
        confidence: intent.confidence,
        executionTime: `${Date.now() - startTime}ms`,
      },
      ...(process.env.NODE_ENV === 'development' && {
        _debug: {
          intent,
        }
      })
    });

  } catch (error) {
    console.error('❌ Tier 3 MCP error:', error);

    // Fall back to Tier 1
    console.log('🔄 Falling back to Tier 1 (context-based chat)');

    return await handleTier1Context(
      sanitizedMessage,
      context,
      [],
      session,
      { ...intent, tier: 1 },
      startTime
    );
  }
}

/**
 * Determine which AI model to use based on query complexity and context size
 * (Tier 1 only - Tier 2/3 have their own model selection)
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

  const isComplex = Object.values(complexityIndicators).some(regex => regex.test(queryLower));
  const isLongQuery = query.split(/\s+/).length > 15;
  const hasLargeContext = contextSize > 30000;
  const hasModerateContext = contextSize > 15000;

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

  if (hasLargeContext) {
    return {
      model: 'google/gemini-2.5-pro',
      reasoning: 'Large context benefits from Gemini\'s 1M token window',
      cost: 'economical'
    };
  }

  // Default: Haiku for simple queries
  return {
    model: 'anthropic/claude-haiku-4.5',
    reasoning: 'Simple query - cost-optimized with Haiku',
    cost: 'minimal'
  };
}

/**
 * Build system prompt for Tier 1 context-based chat
 * (Tier 2/3 build their own prompts)
 */
function buildSystemPrompt(context, user) {
  const aiState = context?.aiState || {};
  const formattedContext = context?.formattedContext || '';

  const pageType = aiState.pageType || 'dashboard';
  const selectedStores = aiState.selectedStores || [];
  const dateRange = aiState.dateRange || {};

  return `You are Wizel, a marketing analytics specialist focused on Klaviyo data analysis.

# Your Role
You're a marketing analyst helping users understand their email marketing performance. You have direct access to their dashboard data and provide insights based on what you see in their account.

# CRITICAL: Response Format
When providing lists or bullet points, you MUST use these exact markers:

**Core Analysis Icons:**
- [CHECK] Positive results
- [TREND] Upward trends
- [DOWN] Declining metrics
- [WARNING] Issues requiring attention
- [TIP] Actionable recommendations
- [SEARCH] Areas needing investigation

**Context-Specific Icons:**
- [GOAL] Goals, targets
- [AUDIENCE] Audience insights
- [REVENUE] Revenue-related
- [EMAIL] Email/campaign specific
- [QUICK] Quick wins
- [TIME] Time-sensitive items

IMPORTANT: ONLY use the exact markers shown above. NEVER use ICON_0, ICON_1, etc.

# Current User Context
- **User**: ${user?.name || 'User'}
- **Current Page**: ${pageType}
${selectedStores.length > 0 ? `- **Selected Accounts**: ${selectedStores.map(s => s.label).join(', ')}` : ''}

# Analytics Context
${formattedContext || 'No specific page data available.'}

# Response Guidelines
1. **Be Direct**: Lead with the answer, use exact numbers
2. **Focus on Action**: Provide clear next steps
3. **Structure for Clarity**: Direct answer → Data → Next steps
4. **Benchmarks**: Open 21%, Click 2.6%, Conversion 1.5%

Answer the user's question now:`;
}

/**
 * Call AI with automatic fallback
 */
async function callAIWithFallback({
  primaryModel,
  systemPrompt,
  conversationHistory,
  userMessage,
  maxTokens,
  temperature
}) {
  let fallbackModel;
  if (primaryModel.includes('haiku')) {
    fallbackModel = 'anthropic/claude-sonnet-4.5';
  } else if (primaryModel.includes('sonnet')) {
    fallbackModel = 'google/gemini-2.5-pro';
  } else {
    fallbackModel = null;
  }

  try {
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
    console.warn(`⚠️ Primary model (${primaryModel}) failed:`, primaryError.message);

    if (!fallbackModel) {
      throw new Error('AI service temporarily unavailable');
    }

    console.log(`🔄 Falling back to: ${fallbackModel}`);

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
  }
}

/**
 * Call AI provider via OpenRouter
 */
async function callAI({
  model,
  systemPrompt,
  conversationHistory,
  userMessage,
  maxTokens,
  temperature
}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Build messages array with system/user roles
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

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
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`AI API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from AI provider');
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage || {},
    model: data.model
  };
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

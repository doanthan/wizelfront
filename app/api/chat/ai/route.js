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
import { detectIntent, extractTimeRange } from '@/lib/ai/intent-detection-haiku';
import { handleTier1WithIntelligentRouting } from '@/lib/ai/enhanced-tier1-handler';
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
    // Now uses Haiku 4.5 for intelligent semantic routing (~$0.0001/query)

    // Debug: Log what context we're passing to intent detection
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Context passed to intent detection:', {
        hasRawData: !!context?.rawData,
        campaignsCount: context?.rawData?.campaigns?.length || 0,
        hasAiState: !!context?.aiState,
        pageType: context?.pageType || context?.aiState?.currentPage,
        selectedStoresCount: context?.selectedStores?.length || 0,
        dateRange: context?.dateRange?.preset,
        contextKeys: Object.keys(context || {})
      });
    }

    const intent = await detectIntent(sanitizedMessage, context);

    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Intent Detection (Haiku-powered):', {
        tier: intent.tier,
        confidence: intent.confidence,
        reason: intent.reason,
        method: intent.method, // 'haiku' or 'rule-based-fallback'
        cost: intent.cost?.formatted || 'N/A',
        executionTime: intent.executionTime ? `${intent.executionTime}ms` : 'N/A',
      });
    }

    // Store intent detection details for dev debugging
    const intentDetectionDebug = {
      query: sanitizedMessage,
      tier: intent.tier,
      confidence: intent.confidence,
      reason: intent.reason,
      method: intent.method,
      hasOnScreenContext: context?.aiState?.data_context != null,
      currentPage: context?.aiState?.currentPage || 'unknown',
      selectedStores: context?.aiState?.selectedStores || [],
      dateRange: context?.aiState?.dateRange?.preset || 'unknown'
    };

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
          startTime,
          request
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
 * NOW WITH INTELLIGENT ROUTING to ClickHouse/MCP when needed
 */
async function handleTier1Context(
  sanitizedMessage,
  context,
  history,
  session,
  intent,
  startTime,
  request
) {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🆕 NEW: Intelligent Data Source Routing
  // Automatically routes to ClickHouse or MCP when summary data insufficient
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {
    const routingDecision = await handleTier1WithIntelligentRouting(
      sanitizedMessage,
      context,
      history,
      session
    );

    if (routingDecision.shouldRoute) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔀 Intelligent Routing: ${routingDecision.destination}`, {
          reason: routingDecision.routing.reason,
          confidence: routingDecision.routing.confidence,
          method: routingDecision.routing.method,
        });
      }

      // Execute the routed handler (ClickHouse or MCP)
      const routedResult = await routingDecision.handler();

      return NextResponse.json({
        response: routedResult.response,
        metadata: {
          ...routedResult.metadata,
          routedFrom: 'tier1',
          routingReason: routingDecision.routing.reason,
          routingConfidence: routingDecision.routing.confidence,
        },
        ...(process.env.NODE_ENV === 'development' && {
          _debug: {
            routing: routingDecision.routing,
            originalTier: 1,
            routedTo: routingDecision.destination,
          }
        })
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Using summary data (no routing needed)');
    }

  } catch (routingError) {
    console.error('⚠️  Intelligent routing failed, continuing with standard Tier 1:', routingError);
    // Continue with standard Tier 1 below
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Standard Tier 1 handling (when routing not needed or failed)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    maxTokens: 32000, // Large limit for detailed analysis and comparisons
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

  // Clean up response - remove icon markers and ICON_N patterns from ALL models
  let cleanedResponse = aiResponse.content;

  // Always clean ICON_N patterns (they sometimes appear despite instructions)
  cleanedResponse = cleanedResponse
    .replace(/\*\s*ICON_\d+\s*/g, '* ')    // Remove * ICON_0, * ICON_1, etc. (in lists)
    .replace(/ICON_\d+\s*/g, '')           // Remove ICON_0, ICON_1, etc.
    .replace(/\[ICON_\d+\]\s*/g, '')       // Remove [ICON_0], [ICON_1], etc.
    .replace(/__ICON_\d+__\s*/g, '');      // Remove __ICON_0__, __ICON_1__, etc.

  // Also remove the icon markers themselves (frontend will render proper icons)
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
      .replace(/\[SEARCH\]\s*/g, '');
  }

  // 🔍 DETECT SQL FALLBACK REQUEST
  // Check if AI response indicates it needs to query the database
  // BUT: Don't route to Tier 2 if we're already in a fallback from Tier 2 (prevent infinite loop)
  const needsSQLFallback = detectSQLFallbackRequest(cleanedResponse);
  const isAlreadyFallback = intent?.fromTier2Fallback === true;

  if (needsSQLFallback && !isAlreadyFallback) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 AI requested SQL fallback - routing to Tier 2');
    }

    // Route to Tier 2 for SQL analysis
    try {
      const tier2Result = await handleTier2Analysis(
        sanitizedMessage,
        context,
        session,
        { ...intent, tier: 2, confidence: 'high' },
        startTime,
        request
      );

      // Return Tier 2 result with note about fallback
      return tier2Result;
    } catch (error) {
      console.error('❌ SQL fallback failed, returning Tier 1 response:', error);
      // If SQL fallback fails, return the original Tier 1 response
    }
  } else if (needsSQLFallback && isAlreadyFallback) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  SQL fallback detected but already in fallback mode - preventing infinite loop');
    }
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
        prompts: {
          systemPrompt: systemPrompt, // Full system prompt
          userMessage: sanitizedMessage,
          contextSize: JSON.stringify(context || {}).length,
          hasOnScreenData: !!context?.aiState?.data_context
        }
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
  startTime,
  request
) {
  try {
    await connectToDatabase();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({
        response: "User account not found. Please contact support.",
        metadata: {
          tier: 2,
          error: 'User not found',
        },
      });
    }

    // Get user's accessible stores via ContractSeat
    const Store = (await import('@/models/Store')).default;
    const ContractSeat = (await import('@/models/ContractSeat')).default;

    let accessibleStores = [];

    // Check if user is super admin
    if (user.is_super_user) {
      // Super admin can access all stores
      accessibleStores = await Store.find({ is_deleted: { $ne: true } })
        .select('public_id name klaviyo_integration')
        .lean();
    } else {
      // Get stores via ContractSeat permissions
      const userSeats = await ContractSeat.find({
        user_id: user._id,
        status: 'active'
      }).lean();

      const accessibleStoreIds = [];

      for (const seat of userSeats) {
        if (!seat.store_access || seat.store_access.length === 0) {
          // Empty store_access means access to ALL stores in the contract
          const contractStores = await Store.find({
            contract_id: seat.contract_id,
            is_deleted: { $ne: true }
          }).select('_id').lean();

          accessibleStoreIds.push(...contractStores.map(s => s._id));
        } else {
          // Specific store access
          accessibleStoreIds.push(...seat.store_access);
        }
      }

      // Remove duplicates
      const uniqueStoreIds = [...new Set(accessibleStoreIds.map(id => id.toString()))];

      if (uniqueStoreIds.length === 0) {
        return NextResponse.json({
          response: "I don't have access to any store data for your account. Please contact support if this seems incorrect.",
          metadata: {
            tier: 2,
            error: 'No store access',
          },
        });
      }

      // Get store details
      accessibleStores = await Store.find({
        _id: { $in: uniqueStoreIds },
        is_deleted: { $ne: true }
      }).select('public_id name klaviyo_integration').lean();
    }

    if (accessibleStores.length === 0) {
      return NextResponse.json({
        response: "I don't have access to any store data for your account. Please contact support if this seems incorrect.",
        metadata: {
          tier: 2,
          error: 'No accessible stores',
        },
      });
    }

    // 🏪 INTELLIGENT STORE RESOLUTION
    // Priority: 1) UI-selected stores, 2) Stores from context, 3) All accessible stores

    let storesToQuery = [];
    let resolution = 'all_accessible';

    // Check if context has selected stores
    if (context?.selectedStores && context.selectedStores.length > 0) {
      const selectedStoreIds = context.selectedStores.map(s => s.value || s.id);
      storesToQuery = accessibleStores.filter(s => selectedStoreIds.includes(s.public_id));
      resolution = 'ui_selected';
    } else if (context?.aiState?.selectedStores && context.aiState.selectedStores.length > 0) {
      const selectedStoreIds = context.aiState.selectedStores.map(s => s.value || s.id);
      storesToQuery = accessibleStores.filter(s => selectedStoreIds.includes(s.public_id));
      resolution = 'context_selected';
    } else {
      // Use all accessible stores
      storesToQuery = accessibleStores;
      resolution = 'all_accessible';
    }

    if (storesToQuery.length === 0) {
      return NextResponse.json({
        response: "I couldn't determine which stores to query. Please select stores from the dashboard.",
        metadata: {
          tier: 2,
          error: 'No stores to query',
        },
      });
    }

    // Filter to only stores with Klaviyo integration
    const storesWithKlaviyo = storesToQuery.filter(s => s.klaviyo_integration?.public_id);

    if (storesWithKlaviyo.length === 0) {
      return NextResponse.json({
        response: "None of your stores have Klaviyo integration set up yet. Please connect your Klaviyo account to analyze your marketing data.",
        metadata: {
          tier: 2,
          error: 'No Klaviyo integration',
          totalStores: storesToQuery.length,
        },
      });
    }

    const storeIds = storesWithKlaviyo.map(s => s.public_id);
    const stores = storesWithKlaviyo;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Tier 2 SQL Analysis:', {
        question: sanitizedMessage,
        storeCount: storeIds.length,
        resolution: resolution,
        storeNames: stores.map(s => s.name),
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
      console.error('❌ Tier 2 API returned error:', {
        status: tier2Response.status,
        statusText: tier2Response.statusText,
        errorData
      });
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
        storeResolution: resolution, // How stores were resolved
        queriedStores: stores.map(s => s.name), // Which stores were queried
        rowCount: tier2Data.metadata?.rowCount,
        executionTime: `${Date.now() - startTime}ms`,
        sql: tier2Data.metadata?.sql, // Include SQL for debugging
        cost: tier2Data.metadata?.cost,
      },
      ...(process.env.NODE_ENV === 'development' && {
        _debug: {
          intent,
          storeResolution: {
            method: resolution,
            storeIds,
            storeNames: stores.map(s => s.name)
          },
          tier2Metadata: tier2Data.metadata,
        }
      })
    });

  } catch (error) {
    console.error('❌ Tier 2 analysis error:', error);

    // Fall back to Tier 1 context-based chat
    console.log('🔄 Falling back to Tier 1 (context-based chat)');

    // Mark this as a fallback from Tier 2 to prevent infinite loop
    return await handleTier1Context(
      sanitizedMessage,
      context,
      [],
      session,
      { ...intent, tier: 1, fromTier2Fallback: true },
      startTime,
      request
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

  // Decision logic - PRIORITY ORDER MATTERS!
  // 1. Complex analytical queries → Sonnet (even with large context)
  if (isComplex) {
    return {
      model: 'anthropic/claude-sonnet-4.5',
      reasoning: 'Complex analytical query requiring deep reasoning',
      cost: 'premium'
    };
  }

  // 2. Long multi-part queries → Sonnet
  if (isLongQuery && hasModerateContext) {
    return {
      model: 'anthropic/claude-sonnet-4.5',
      reasoning: 'Multi-part question with substantial context',
      cost: 'premium'
    };
  }

  // 3. Large context but simple query → Gemini (1M token window)
  if (hasLargeContext) {
    return {
      model: 'google/gemini-2.5-pro',
      reasoning: 'Large context benefits from Gemini\'s 1M token window',
      cost: 'economical'
    };
  }

  // 4. Default: Haiku for simple queries
  return {
    model: 'anthropic/claude-haiku-4.5',
    reasoning: 'Simple query - cost-optimized with Haiku',
    cost: 'minimal'
  };
}

/**
 * Format raw data for AI consumption
 */
function formatRawDataForAI(rawData, context) {
  let formatted = '';

  // Format campaigns data
  if (rawData.campaigns?.length > 0) {
    const campaigns = rawData.campaigns.slice(0, 20); // Limit to first 20 for token efficiency
    formatted += `\n## Campaign Data (${rawData.campaigns.length} campaigns total, showing top 20)\n\n`;
    formatted += `Date Range: ${context?.dateRange?.preset || 'last 90 days'} (${context?.dateRange?.daysSpan || 90} days)\n`;
    formatted += `Selected Stores: ${context?.selectedStores?.map(s => s.name).join(', ') || 'All stores'}\n\n`;

    formatted += `| Campaign | Type | Recipients | Open Rate | Click Rate | Revenue | Sent Date |\n`;
    formatted += `|----------|------|------------|-----------|------------|---------|----------|\n`;

    campaigns.forEach(c => {
      formatted += `| ${c.name?.substring(0, 40) || 'Unnamed'} | ${c.channel || c.type} | ${c.recipients?.toLocaleString() || 0} | ${c.openRate?.toFixed(1) || 0}% | ${c.clickRate?.toFixed(1) || 0}% | $${(c.revenue || 0).toFixed(2)} | ${new Date(c.sentAt).toLocaleDateString()} |\n`;
    });

    // Separate campaigns by channel for accurate statistics
    const emailCampaigns = rawData.campaigns.filter(c => c.channel === 'email' || c.type === 'email');
    const smsCampaigns = rawData.campaigns.filter(c => c.channel === 'sms' || c.type === 'sms');

    // Calculate channel-specific stats
    const totalRevenue = rawData.campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);

    formatted += `\n**Summary Statistics:**\n`;
    formatted += `- Total Campaigns: ${rawData.campaigns.length} (${emailCampaigns.length} email, ${smsCampaigns.length} SMS)\n`;
    formatted += `- Total Revenue: $${totalRevenue.toLocaleString()}\n`;

    // Email campaign stats (these track opens and clicks)
    if (emailCampaigns.length > 0) {
      const emailAvgOpenRate = emailCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / emailCampaigns.length;
      const emailAvgClickRate = emailCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / emailCampaigns.length;
      formatted += `\n**Email Campaigns (${emailCampaigns.length}):**\n`;
      formatted += `- Average Open Rate: ${emailAvgOpenRate.toFixed(1)}%\n`;
      formatted += `- Average Click Rate: ${emailAvgClickRate.toFixed(1)}%\n`;
    }

    // SMS campaign stats (only track clicks, not opens)
    if (smsCampaigns.length > 0) {
      const smsAvgClickRate = smsCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / smsCampaigns.length;
      formatted += `\n**SMS Campaigns (${smsCampaigns.length}):**\n`;
      formatted += `- Average Click Rate: ${smsAvgClickRate.toFixed(1)}%\n`;
      formatted += `- Note: SMS campaigns don't track open rates (this is normal behavior)\n`;
    }
  }

  // Format revenue data - check if revenue is an array with period data
  if (rawData.revenue && Array.isArray(rawData.revenue) && rawData.revenue.length > 0) {
    formatted += `\n## Revenue Data by Period (${rawData.revenue.length} periods)\n\n`;

    formatted += `| Period | Overall Revenue | Attributed Revenue | Total Orders | Attributed Orders |\n`;
    formatted += `|--------|----------------|-------------------|--------------|------------------|\n`;

    rawData.revenue.forEach(r => {
      formatted += `| ${r.period} | $${(r.overallRevenue || 0).toLocaleString()} | $${(r.attributedRevenue || 0).toLocaleString()} | ${(r.totalOrders || 0).toLocaleString()} | ${(r.attributedOrders || 0).toLocaleString()} |\n`;
    });

    // Add summary if metrics are available
    if (rawData.metrics) {
      formatted += `\n**Summary Metrics:**\n`;
      formatted += `- Total Revenue: $${(rawData.metrics.totalRevenue || 0).toLocaleString()}\n`;
      formatted += `- Attributed Revenue: $${(rawData.metrics.attributedRevenue || 0).toLocaleString()}\n`;
      formatted += `- Total Orders: ${(rawData.metrics.totalOrders || 0).toLocaleString()}\n`;
      formatted += `- Attributed Orders: ${(rawData.metrics.attributedOrders || 0).toLocaleString()}\n`;
      if (rawData.metrics.averageOrderValue) {
        formatted += `- Average Order Value: $${(rawData.metrics.averageOrderValue || 0).toFixed(2)}\n`;
      }
      if (rawData.metrics.conversionRate !== undefined) {
        formatted += `- Conversion Rate: ${(rawData.metrics.conversionRate || 0).toFixed(2)}%\n`;
      }
      if (rawData.metrics.revenuePerRecipient !== undefined) {
        formatted += `- Revenue per Recipient: $${(rawData.metrics.revenuePerRecipient || 0).toFixed(2)}\n`;
      }
    }
  } else if (rawData.revenue && typeof rawData.revenue === 'object' && !Array.isArray(rawData.revenue)) {
    // Fallback for old format where revenue is an object
    formatted += `\n## Revenue Data\n\n`;
    formatted += `- Total Revenue: $${(rawData.revenue.total || 0).toLocaleString()}\n`;
    formatted += `- Attributed Revenue: $${(rawData.revenue.attributed || 0).toLocaleString()}\n`;
  } else if (rawData.metrics) {
    // If no revenue array but metrics exist, show metrics
    formatted += `\n## Revenue Metrics\n\n`;
    formatted += `- Total Revenue: $${(rawData.metrics.totalRevenue || 0).toLocaleString()}\n`;
    formatted += `- Attributed Revenue: $${(rawData.metrics.attributedRevenue || 0).toLocaleString()}\n`;
    formatted += `- Total Orders: ${(rawData.metrics.totalOrders || 0).toLocaleString()}\n`;
    formatted += `- Attributed Orders: ${(rawData.metrics.attributedOrders || 0).toLocaleString()}\n`;
    if (rawData.metrics.averageOrderValue) {
      formatted += `- Average Order Value: $${(rawData.metrics.averageOrderValue || 0).toFixed(2)}\n`;
    }
  }

  // Format flows data
  if (rawData.flows?.length > 0) {
    formatted += `\n## Flow Data (${rawData.flows.length} flows)\n\n`;
    // Add flow summary
  }

  return formatted || 'No detailed data available on this page.';
}

/**
 * Format summary context for AI (NEW: uses summaryData, not rawData)
 * This builds formatted context from the optimized summary structure
 */
function formatSummaryContext(context) {
  let formatted = '';
  const { summaryData, dateRange, selectedStores, pageType } = context;

  if (!summaryData) {
    return 'No data available.';
  }

  // Dashboard KPIs
  if (summaryData.dashboard) {
    const d = summaryData.dashboard;
    formatted += `\n## Dashboard KPIs\n\n`;
    formatted += `**Overall Performance:**\n`;
    formatted += `- Total Revenue: $${(d.totalRevenue || 0).toLocaleString()}\n`;
    formatted += `- Attributed Revenue: $${(d.attributedRevenue || 0).toLocaleString()}\n`;
    formatted += `- Total Orders: ${(d.totalOrders || 0).toLocaleString()}\n`;
    formatted += `- Active Customers: ${(d.uniqueCustomers || 0).toLocaleString()}\n`;
    if (d.avgOrderValue) {
      formatted += `- Average Order Value: $${d.avgOrderValue.toFixed(2)}\n`;
    }
    if (d.revenueChange !== undefined) {
      formatted += `- Revenue Change: ${d.revenueChange > 0 ? '+' : ''}${d.revenueChange.toFixed(1)}%\n`;
    }
    formatted += '\n';
  }

  // Campaign Summary
  if (summaryData.campaigns && summaryData.campaigns.total > 0) {
    const c = summaryData.campaigns;
    formatted += `## Campaign Summary (${c.total} total campaigns)\n\n`;

    if (c.summaryStats) {
      formatted += `**Overall Stats:**\n`;
      formatted += `- Total Recipients: ${(c.summaryStats.totalSent || 0).toLocaleString()}\n`;
      formatted += `- Avg Open Rate: ${(c.summaryStats.avgOpenRate || 0).toFixed(1)}%\n`;
      formatted += `- Avg Click Rate: ${(c.summaryStats.avgClickRate || 0).toFixed(2)}%\n`;
      formatted += `- Total Revenue: $${(c.summaryStats.totalRevenue || 0).toLocaleString()}\n\n`;
    }

    if (c.topPerformers && c.topPerformers.length > 0) {
      formatted += `**Top ${c.topPerformers.length} Campaigns by Revenue:**\n`;
      c.topPerformers.forEach((campaign, i) => {
        const name = campaign.name?.substring(0, 50) || 'Unnamed';
        const revenue = campaign.revenue || 0;
        const openRate = campaign.openRate?.toFixed(1) || '0.0';
        const clickRate = campaign.clickRate?.toFixed(2) || '0.00';
        formatted += `${i + 1}. ${name}\n`;
        formatted += `   - Recipients: ${(campaign.recipients || 0).toLocaleString()}, Open: ${openRate}%, Click: ${clickRate}%, Revenue: $${revenue.toLocaleString()}\n`;
      });
      formatted += '\n';
    }
  }

  // Flow Summary
  if (summaryData.flows && summaryData.flows.total > 0) {
    const f = summaryData.flows;
    formatted += `## Flow Summary (${f.total} total flows)\n\n`;

    if (f.summaryStats) {
      formatted += `**Overall Stats:**\n`;
      formatted += `- Total Revenue: $${(f.summaryStats.totalRevenue || 0).toLocaleString()}\n`;
      formatted += `- Avg Conversion: ${(f.summaryStats.avgConversion || 0).toFixed(2)}%\n\n`;
    }

    if (f.topPerformers && f.topPerformers.length > 0) {
      formatted += `**Top ${f.topPerformers.length} Flows by Revenue:**\n`;
      f.topPerformers.forEach((flow, i) => {
        const name = flow.name?.substring(0, 50) || 'Unnamed';
        formatted += `${i + 1}. ${name} (${flow.status || 'active'})\n`;
        formatted += `   - Triggers: ${(flow.triggers || 0).toLocaleString()}, Conv: ${(flow.conversionRate || 0).toFixed(2)}%, Revenue: $${(flow.revenue || 0).toLocaleString()}\n`;
      });
      formatted += '\n';
    }
  }

  // Account Breakdowns
  if (summaryData.byAccount && summaryData.byAccount.length > 0) {
    formatted += `## Performance by Account\n\n`;
    summaryData.byAccount.forEach(account => {
      formatted += `**${account.name || account.storeName}:**\n`;
      formatted += `- Revenue: $${(account.revenue || 0).toLocaleString()}`;
      if (account.revenueChange !== undefined) {
        formatted += ` (${account.revenueChange > 0 ? '+' : ''}${account.revenueChange.toFixed(1)}%)`;
      }
      formatted += '\n';
      if (account.campaigns !== undefined || account.recipients !== undefined) {
        formatted += `- Campaigns: ${account.campaigns || 0}, Recipients: ${(account.recipients || 0).toLocaleString()}\n`;
      }
      formatted += '\n';
    });
  }

  // Time Series Info
  if (summaryData.timeSeries && summaryData.timeSeries.length > 0) {
    formatted += `## Trend Data\n\n`;
    formatted += `Time series data available (${summaryData.timeSeries.length} sampled points for trend analysis)\n\n`;
  }

  // Context info
  if (dateRange) {
    formatted += `## Selected Date Range\n`;
    formatted += `- Period: ${dateRange.preset || 'custom'} (${dateRange.daysSpan || 'N/A'} days)\n\n`;
  }

  if (selectedStores && selectedStores.length > 0) {
    formatted += `## Selected Accounts\n`;
    formatted += `${selectedStores.map(s => `- ${s.label || s.name}`).join('\n')}\n\n`;
  }

  return formatted || 'No detailed data available on this page.';
}

/**
 * Build system prompt for Tier 1 context-based chat
 * (Tier 2/3 build their own prompts)
 */
function buildSystemPrompt(context, user) {
  // Use the pre-formatted context from AI context provider
  // This is already optimized with summary data (not raw data)
  let formattedContext = context?.formattedContext || '';

  // If no pre-formatted context, build from summaryData (NOT rawData!)
  if (!formattedContext && context?.summaryData) {
    // Build a summary context from the available data
    formattedContext = formatSummaryContext(context);
  }

  const pageType = context?.pageType || 'dashboard';
  const selectedStores = context?.selectedStores || [];
  const dateRange = context?.dateRange || {};

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

**CRITICAL FORMAT RULES:**
1. **Icons**: ONLY use these EXACT markers: [CHECK], [TREND], [DOWN], [WARNING], [TIP], [SEARCH], [GOAL], [AUDIENCE], [REVENUE], [EMAIL], [QUICK], [TIME]
   - NEVER use: ICON_0, ICON_1, ICON_2, * ICON_0, __ICON_0__, or ANY numbered icon pattern
   - NEVER use: emojis like ✅, 📈, ⚠️, 💡, etc. (they will be converted to icons)
   - NEVER create custom icon markers

2. **Markdown**: Use MINIMAL markdown for formatting
   - Bold: Use **text** for emphasis on important points
   - Lists: Use - for bullet points ONLY (bullet symbol will be auto-styled)
   - NEVER use headers (#, ##, ###) - just use bold text instead
   - NEVER use --- separators (they create visual clutter)
   - NEVER use * for bullets (use - only)
   - Keep formatting clean and simple

3. **Email Service References**:
   - NEVER refer to "your email service provider" or "contact your ESP"
   - We are Wizel.ai - we provide the analytics and insights
   - If there's a data issue, say "contact Wizel support" or "there may be a tracking issue"
   - NEVER suggest users contact Klaviyo or any other external service

# Current User Context
- **User**: ${user?.name || 'User'}
- **Current Page**: ${pageType}
${selectedStores.length > 0 ? `- **Selected Accounts**: ${selectedStores.map(s => s.label).join(', ')}` : ''}

# Store/Account References
When users mention specific store names in their questions:
- I can query data for those specific stores by name
- Example: "Show me campaigns for Acme Store" will query only Acme Store's data
- If a store name isn't found, I'll let the user know which stores are available
- If no store is mentioned, I'll use the currently selected accounts or all accessible accounts

# Analytics Context
${formattedContext || 'No specific page data available.'}

# CRITICAL: Handling Missing Data
**When summary data is insufficient to answer the user's question:**

1. **Check Summary Data First**: Look at the summary statistics, top performers, and aggregated metrics provided
2. **If Data Not Available**: Tell the user you need to query the database for detailed analysis
3. **SQL Fallback Response Format**:
   "I need to query the database for detailed information about [specific data]. Let me analyze your [campaigns/flows/segments] data from ClickHouse to give you accurate insights."

4. **Then Return**: A response indicating you'll route to SQL (Tier 2)

**Examples:**

User: "Show me all campaigns with less than 10% open rate in the last 90 days"
Response: "I can see campaign summary data, but to filter and analyze campaigns below 10% open rate, I need to query your full campaign database. Let me pull that detailed data from ClickHouse for you."

User: "What were my top 20 campaigns by revenue last month?"
Response: "I can see your top campaigns in the current summary, but to get the full top 20 for last month specifically, I need to run a database query. Let me analyze your complete campaign data from ClickHouse."

User: "Compare my email vs SMS campaign performance over the last quarter"
Response: "To give you an accurate breakdown of email vs SMS performance over 3 months, I need to query your full campaign database by channel. Let me pull that analysis from ClickHouse."

**When Summary Data IS Sufficient:**
- Current page metrics and totals
- Top 10 performers visible
- Basic trends and patterns
- Account-level comparisons (when byAccount data is available)
- Questions about visible data on screen

# Revenue Analysis Guidelines

**CRITICAL: Recognize Available Revenue Data**

When users ask questions about performance, metrics, trends, or insights, ALWAYS check for revenue data first:

1. **Check for Revenue Data Availability:**
   - Look for revenue arrays with period-by-period data
   - Look for metrics objects with totalRevenue, attributedRevenue, orders, etc.
   - Revenue data is VALID even when campaigns and flows arrays are empty

2. **Revenue-Focused Queries:**
   When users ask general questions like "What are the key findings?", "How am I performing?", or "What's trending?":
   - If revenue data is available, analyze it FIRST
   - Provide insights on revenue trends, growth rates, attribution percentages
   - Break down by period, show trends over time
   - Calculate daily/weekly averages
   - Identify peaks and valleys in the data

3. **Account-Specific Analysis (CRITICAL FOR AGENCIES):**
   - Users can ask about specific accounts by name (e.g., "How is Balmain performing?")
   - Users can ask about all accounts together (e.g., "What are my overall key findings?")
   - **When multiple accounts are selected, PROVIDE BOTH:**
     a) Aggregate insights across all accounts
     b) **Individual breakdown for EACH store/account** (agencies need per-store data)
   - Highlight top-performing accounts and underperforming accounts
   - **Each store is UNIQUE** - agencies need actionable insights for each client
   - Format per-store data clearly with store names as headers

4. **Example Revenue Analysis Structure:**
   - **Overall Performance:** Total revenue, attributed revenue, growth rate
   - **Trend Analysis:** Period-over-period changes, identify patterns
   - **Attribution Breakdown:** Campaign vs Flow revenue, Email vs SMS
   - **Order Metrics:** Total orders, AOV, revenue per recipient
   - **Key Insights:** Notable spikes, declines, or trends worth highlighting

5. **When Revenue Data IS Available:**
   - NEVER say "I don't see the data" if revenue arrays or metrics exist
   - Use the revenue data to provide meaningful insights
   - Focus on actionable findings and trends
   - Highlight both positive performance and areas for improvement

6. **Multi-Channel Attribution:**
   - When showing attribution data, break down by:
     - Campaign vs Flow revenue
     - Email vs SMS revenue
     - Attribution percentage (what % of total revenue is attributed to marketing)
   - Help users understand which channels are driving revenue

**Example Good Response - Single Store (when revenue data exists):**
"Looking at your revenue performance over the past 90 days, here are the key findings:

**Overall Performance:**
- Total Revenue: $254,769
- Attributed Revenue: $14,233 (5.6% attribution rate)
- Total Orders: 1,062 orders
- Average Order Value: $239.90

**Revenue Trends:**
- Strongest period: 01/09/2025 with $84,675 (11.2% attribution)
- Notable spike in attributed revenue on 01/09 ($9,467)
- Most recent period (01/10) shows $74,571 in revenue

**Attribution Breakdown:**
- Flow Revenue: Consistently driving the majority of attributed revenue
- Email Revenue: Contributing $8,851 in the strongest period
- SMS Revenue: Contributing $616 in the strongest period

**Key Insights:**
- [TREND] Revenue up 25.4% compared to previous period
- [REVENUE] 01/09 had the highest attribution at 11.2% - analyze what campaigns/flows performed well that day
- [WARNING] Attribution dropped to 1.6% on 01/10 - investigate why marketing impact decreased"

**Example Good Response - Multiple Stores (AGENCIES NEED THIS):**
"Here's the performance breakdown across your 3 stores:

**Aggregate Overview (All Stores Combined):**
- Total Revenue: $458,332
- Attributed Revenue: $28,456 (6.2% attribution rate)
- Total Orders: 1,924 orders
- Average Order Value: $238.24

**Individual Store Performance:**

**Store 1: Acme Boutique**
- Revenue: $186,420 | Orders: 782 | AOV: $238.44
- Attributed Revenue: $12,340 (6.6% attribution) - **Above average** [CHECK]
- Open Rate: 28.5% | Click Rate: 3.2%
- [TIP] Strong email performance - consider increasing send frequency

**Store 2: Fashion Forward**
- Revenue: $142,890 | Orders: 598 | AOV: $238.98
- Attributed Revenue: $8,576 (6.0% attribution) - **Average** [GOAL]
- Open Rate: 24.1% | Click Rate: 2.8%
- [WARNING] Click rate below benchmark (2.6%) - review call-to-action placement

**Store 3: Trendy Threads**
- Revenue: $129,022 | Orders: 544 | AOV: $237.17
- Attributed Revenue: $7,540 (5.8% attribution) - **Needs improvement** [DOWN]
- Open Rate: 21.8% | Click Rate: 2.4%
- [QUICK] Implement abandoned cart flow to increase attribution

**Store Comparison Insights:**
- [TREND] Acme Boutique leading with 40.7% of total revenue
- [REVENUE] All stores have similar AOV (~$238) - good consistency
- [TIP] Fashion Forward has highest AOV - share winning product strategies across stores
- [WARNING] Trendy Threads needs flow optimization - 12% below top performer"

# Page-Specific Analysis Guidelines

**Current Page Type: ${pageType}**

${pageType === 'revenue' ? `
**You are on the REVENUE page** - Focus your analysis on:
- Total revenue and attributed revenue metrics
- Revenue attribution percentages (what % of revenue comes from marketing)
- Period-over-period revenue trends and growth rates
- Channel breakdown (Campaign vs Flow, Email vs SMS)
- Order metrics (total orders, AOV, revenue per recipient)
- Revenue performance by account/store
- Identify revenue peaks, valleys, and trends
- When users ask general questions, prioritize revenue insights

**Default Focus:** Unless specifically asked about campaigns or flows, analyze the revenue data available.
` : ''}

${pageType === 'campaigns' ? `
**You are on the CAMPAIGNS page** - Focus your analysis on:
- Campaign performance metrics (open rates, click rates, CTR)
- Campaign revenue and conversion performance
- Individual campaign details (name, subject, send date, recipients)
- Compare campaign performance against benchmarks (Open: 21%, Click: 2.6%)
- Identify top-performing campaigns and underperformers
- Provide actionable recommendations for campaign optimization
- Analyze campaign trends over time

**CRITICAL for Multi-Store Analysis:**
When multiple stores are selected, ALWAYS provide:
1. **Aggregate campaign insights** across all stores
2. **Per-store campaign performance** - agencies need to see which campaigns work for which clients
3. **Store comparison** - identify which stores have strongest/weakest campaign performance
4. **Actionable recommendations PER STORE** - each store may need different strategies

**Example Multi-Store Campaign Response:**
"Campaign Performance Across 3 Stores:

**Aggregate Metrics:**
- 45 campaigns sent | Avg Open Rate: 25.8% | Avg Click Rate: 2.9%

**Store-by-Store Analysis:**

**Store A: Acme Boutique**
- 18 campaigns | Open Rate: 28.5% | Click Rate: 3.4%
- Top Campaign: 'Summer Sale' (34% open, $4.2K revenue)
- [CHECK] Outperforming benchmarks - replicate subject line strategy

**Store B: Fashion Forward**
- 15 campaigns | Open Rate: 24.2% | Click Rate: 2.7%
- Top Campaign: 'New Arrivals' (27% open, $2.8K revenue)
- [GOAL] At benchmark - test more urgency in subject lines

**Store C: Trendy Threads**
- 12 campaigns | Open Rate: 21.5% | Click Rate: 2.1%
- Top Campaign: 'Flash Sale' (25% open, $1.9K revenue)
- [WARNING] Below benchmark - review list health and segmentation"

**Default Focus:** When users ask questions, prioritize campaign-specific insights and metrics.
` : ''}

${pageType === 'flows' ? `
**You are on the FLOWS page** - Focus your analysis on:
- Flow performance metrics (triggers, recipients, revenue)
- Flow-specific open rates and click rates
- Flow revenue contribution and ROI
- Individual flow details and performance
- Flow optimization opportunities
- Compare active vs inactive flows
- Identify high-performing automation sequences

**CRITICAL for Multi-Store Flow Analysis:**
When multiple stores are selected, ALWAYS provide:
1. **Aggregate flow performance** across all stores
2. **Per-store flow analysis** - each store may have different flows or same flows performing differently
3. **Flow gap analysis** - identify which stores are missing high-value flows
4. **Store-specific recommendations** - different stores need different automation strategies

**Example Multi-Store Flow Response:**
"Flow Performance Analysis Across 3 Stores:

**Aggregate Overview:**
- Total Flow Revenue: $156,420
- Active Flows: 18 | Avg Conversion Rate: 3.8%

**Store-by-Store Flow Analysis:**

**Store A: Acme Boutique**
- Active Flows: 7 | Flow Revenue: $68,340 (43.7% of total)
- Top Flow: Abandoned Cart ($45.2K, 4.5% conversion)
- [CHECK] All core flows active and performing well
- [TIP] Consider adding post-purchase upsell flow

**Store B: Fashion Forward**
- Active Flows: 6 | Flow Revenue: $52,180 (33.4% of total)
- Top Flow: Welcome Series ($28.4K, 3.9% conversion)
- [WARNING] Missing abandoned cart flow - **high priority**
- [QUICK] Implement Browse Abandonment (potential +$15K/month)

**Store C: Trendy Threads**
- Active Flows: 5 | Flow Revenue: $35,900 (23.0% of total)
- Top Flow: Win Back ($18.2K, 2.8% conversion)
- [DOWN] Only 5 active flows vs 7 in top performer
- [TIP] Add Welcome Series and Abandoned Cart flows immediately

**Cross-Store Flow Insights:**
- [REVENUE] Abandoned Cart flow in Store A generates 3x more than Store C's best flow
- [GOAL] Implement Store A's flow strategy across all stores
- [QUICK] Store B and C could add +$40K/month with missing flows"

**Default Focus:** When users ask questions, prioritize flow-specific insights and automation performance.
` : ''}

${pageType === 'deliverability' ? `
**You are on the DELIVERABILITY page** - Focus your analysis on:
- Email deliverability metrics (delivery rate, bounce rate, spam rate)
- List health indicators
- Unsubscribe rates and trends
- Spam complaint rates
- Deliverability health scores
- Identify deliverability issues requiring attention
- Provide recommendations for improving email deliverability

**Default Focus:** When users ask questions, prioritize deliverability health and inbox placement insights.
` : ''}

# Time Period Comparison Analysis
When users ask to compare time periods (e.g., "last 7 days vs previous 7 days", "this week vs last week", "this month vs last month"):

**CRITICAL: Use Daily-Level Granularity When Available**
1. If daily campaign data is provided (campaigns with individual sent dates), break down the comparison day-by-day
2. Show trends over time, not just aggregate totals
3. Identify specific days with notable performance (highest/lowest revenue, spikes, drops)
4. Calculate daily averages and highlight variations

**Example Analysis Structure:**
- Overall Period Comparison: Total metrics for each period
- Daily Breakdown: Revenue/sends per day, identify patterns (weekday vs weekend, specific dates with spikes)
- Trend Analysis: Is performance improving day-over-day? Are there consistent patterns?
- Key Insights: Which specific days drove the difference? What changed?

**What to Calculate:**
- Total metrics per period (revenue, campaigns, recipients)
- Daily averages (avg revenue/day, avg recipients/day)
- Day-over-day growth rates
- Identify outlier days (e.g., "Oct 10 generated 2x the avg daily revenue")
- Efficiency metrics (revenue per recipient, conversion rates)

**Example:**
User: "How was my last 7 days compared to previous 7 days?"

Good Response:
"Last 7 Days (Oct 14-20): $12.5K revenue from 8 campaigns
Previous 7 Days (Oct 7-13): $9.2K revenue from 6 campaigns

Daily Breakdown:
- Oct 15 was your strongest day: $3.2K (Email Newsletter campaign to 12K recipients)
- Oct 18-19 weekend: Only $800 combined (expected lower weekend engagement)
- Previous period's peak was Oct 10: $2.8K

Key Insights:
- Revenue up 36% overall, but efficiency mixed
- You sent 33% more campaigns in recent period
- Revenue per campaign: $1,562 (recent) vs $1,533 (previous) - minimal change
- Best-performing campaign types: Email newsletters to engaged segments"

Bad Response:
"You had higher revenue in the last 7 days. Send more campaigns!"

# Response Guidelines
1. **Be Direct**: Lead with the answer, use exact numbers
2. **Focus on Action**: Provide clear next steps
3. **Structure for Clarity**: Direct answer → Data → Next steps
4. **Benchmarks**: Open 21%, Click 2.6%, Conversion 1.5%
5. **Use Daily Data**: When available, show day-by-day breakdowns for time comparisons
6. **Greeting**: ONLY greet once at the start of your response. NEVER use multiple greetings like "Hey there!" followed by "Hi". Just use ONE friendly greeting like "Hey there! I'd love to help..."

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

/**
 * Detect if AI response indicates it needs SQL database query
 * Returns true if AI says it needs to query the database
 */
function detectSQLFallbackRequest(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'string') return false;

  const sqlIndicators = [
    // Direct mentions of needing database
    /need to query.*database/i,
    /query.*full.*database/i,
    /pull.*data.*clickhouse/i,
    /analyze.*complete.*data/i,
    /run.*database query/i,

    // Mentions of detailed/full data needed
    /need.*detailed.*data/i,
    /full.*campaign.*database/i,
    /complete.*campaign.*data/i,
    /detailed.*analysis.*clickhouse/i,

    // Specific data requests beyond summary
    /get.*full.*top \d+/i,
    /filter.*all.*campaigns/i,
    /breakdown.*all.*campaigns/i,
    /analyze.*all.*flows/i,
  ];

  // Check if any SQL indicator pattern matches
  return sqlIndicators.some(pattern => pattern.test(aiResponse));
}

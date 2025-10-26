/**
 * Tier 2: Two-Stage SQL Analysis Route
 *
 * Stage 1: Haiku generates ClickHouse SQL from natural language
 * Stage 2: Sonnet analyzes query results and provides insights
 *
 * Flow:
 * 1. User asks question in natural language
 * 2. Convert store IDs to Klaviyo IDs (permission filtering)
 * 3. Haiku 4.5 generates secure SQL query
 * 4. Execute SQL query on ClickHouse
 * 5. Sonnet 4.5 analyzes results (falls back to Gemini 2.5 Pro if needed)
 * 6. Return analysis to user
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import { getUserAccessibleStores } from '@/lib/ai-agent/permissions';
import { storeIdsToKlaviyoIds } from '@/lib/utils/id-mapper';
import { generateSQL } from '@/lib/ai/haiku-sql';
import { analyzeMarketingData } from '@/lib/ai/sonnet-analysis';
import { CostTracker } from '@/lib/utils/cost-tracker';
import { sanitizeInput } from '@/lib/input-sanitizer';
import { getClickHouseClient } from '@/lib/clickhouse';

export async function POST(request) {
  const startTime = Date.now();
  const costTracker = new CostTracker();

  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Get user's accessible stores via ContractSeat system
    console.log('🔍 Getting accessible stores for user:', user._id);
    const accessibleStores = await getUserAccessibleStores(user._id);
    console.log('📊 Accessible stores with Klaviyo integration:', accessibleStores.length);

    if (accessibleStores.length === 0) {
      console.warn('⚠️ No stores with Klaviyo integration found for user:', {
        userId: user._id,
        userEmail: user.email,
        message: 'User has stores but none have Klaviyo connector installed'
      });
      return NextResponse.json({
        error: 'No stores with Klaviyo integration found. Please connect your Klaviyo account to analyze your marketing data.',
        details: 'You have stores, but none of them have the Klaviyo connector set up yet.'
      }, { status: 400 }); // 400 instead of 403 - it's a data availability issue, not permission
    }

    const accessibleStoreIds = accessibleStores.map(s => s.public_id);

    // 3. Parse and sanitize request
    const body = await request.json();
    const {
      question: rawQuestion,
      storeIds: rawStoreIds = [],
      options = {},
    } = body;

    // Sanitize inputs (critical security measure)
    const questionResult = sanitizeInput(rawQuestion);
    const question = typeof questionResult === 'string' ? questionResult : questionResult.sanitized;

    // Extract sanitized strings from sanitizeInput results
    const storeIds = Array.isArray(rawStoreIds)
      ? rawStoreIds.map(id => {
          const result = sanitizeInput(id);
          return typeof result === 'string' ? result : result.sanitized;
        })
      : [];

    if (!question) {
      return NextResponse.json({
        error: 'Question is required',
      }, { status: 400 });
    }

    // 4. Determine which stores to query (default: all user stores)
    const targetStoreIds = storeIds.length > 0 ? storeIds : accessibleStoreIds;

    console.log('🔍 Permission check:', {
      targetStoreIds,
      accessibleStoreIds,
      targetCount: targetStoreIds.length,
      accessibleCount: accessibleStoreIds.length
    });

    // Validate user has access to requested stores
    const unauthorizedStores = targetStoreIds.filter(
      id => !accessibleStoreIds.includes(id)
    );

    console.log('🔍 Unauthorized stores found:', unauthorizedStores.length);

    if (unauthorizedStores.length > 0) {
      console.error('❌ Permission denied:', {
        unauthorizedStores,
        targetStoreIds,
        accessibleStoreIds,
        message: 'User requested stores they do not have access to'
      });
      return NextResponse.json({
        error: 'Access denied to some stores',
        unauthorizedStores,
        debug: {
          requested: targetStoreIds,
          accessible: accessibleStoreIds
        }
      }, { status: 403 });
    }

    // 5. Convert store IDs to Klaviyo IDs (CRITICAL for ClickHouse queries)
    const { klaviyoIds, storeMap, errors: idErrors } = await storeIdsToKlaviyoIds(targetStoreIds);

    if (klaviyoIds.length === 0) {
      return NextResponse.json({
        error: 'No valid Klaviyo integrations found',
        details: idErrors,
      }, { status: 400 });
    }

    // Log warnings about missing integrations
    if (idErrors.length > 0) {
      console.warn('⚠️  ID mapping warnings:', idErrors);
    }

    // 5. Stage 1: Generate SQL using Haiku 4.5
    console.log('🔍 Generating SQL for:', question);
    console.log('🎯 Klaviyo IDs:', klaviyoIds);

    const sqlResult = await generateSQL(question, klaviyoIds, {
      costTracker,
      debug: process.env.NODE_ENV === 'development',
    });

    console.log('✅ SQL generated:', sqlResult.sql);
    console.log('⚠️  Validation warnings:', sqlResult.validation.warnings);

    // 6. Execute SQL query on ClickHouse
    console.log('📊 Executing ClickHouse query...');

    let queryResults;
    try {
      const clickhouse = getClickHouseClient();
      const result = await clickhouse.query({
        query: sqlResult.sql,
        format: 'JSONEachRow',
      });

      queryResults = await result.json();

      console.log(`✅ Query returned ${queryResults.length} rows`);

    } catch (error) {
      console.error('❌ ClickHouse query failed:', error);
      return NextResponse.json({
        error: 'Query execution failed',
        details: error.message,
        sql: sqlResult.sql, // Include SQL for debugging
      }, { status: 500 });
    }

    // 7. Stage 2: Analyze results using Sonnet 4.5 (with Gemini fallback)
    console.log('🤖 Analyzing results with Sonnet...');

    // Build context for analysis
    const storeNames = Array.from(storeMap.values()).map(s => s.store_name);
    const analysisContext = {
      storeNames,
      dataSource: 'clickhouse',
      userExpertise: user.expertise_level || 'intermediate',
    };

    const analysisResult = await analyzeMarketingData(
      question,
      sqlResult.sql,
      queryResults,
      analysisContext,
      true // Enable Gemini fallback
    );

    console.log('✅ Analysis complete');

    // 8. Calculate total execution time
    const totalTime = Date.now() - startTime;

    // 9. Get cost summary
    const costSummary = costTracker.getSummary();

    // 10. Return comprehensive response
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        question,
        storeCount: targetStoreIds.length,
        stores: storeNames,
        klaviyoIds,
        rowCount: queryResults.length,
        executionTime: `${totalTime}ms`,
        cost: {
          total: costSummary.totalCost,
          byTier: costSummary.byTier,
          byModel: costSummary.byModel,
        },
        sql: sqlResult.sql,
        tables: sqlResult.tables,
        warnings: [
          ...(sqlResult.validation.warnings || []),
          ...(idErrors.length > 0 ? idErrors : []),
        ],
      },
    });

  } catch (error) {
    console.error('❌ Tier 2 analysis error:', error);

    const totalTime = Date.now() - startTime;
    const costSummary = costTracker.getSummary();

    return NextResponse.json({
      error: 'Analysis failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      metadata: {
        executionTime: `${totalTime}ms`,
        cost: costSummary.totalCost,
      },
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check service status
 */
export async function GET(request) {
  return NextResponse.json({
    service: 'AI Analysis (Tier 2)',
    status: 'ready',
    description: 'Two-stage SQL analysis: Haiku generates SQL, Sonnet analyzes results',
    tier: 2,
    models: {
      sqlGeneration: 'anthropic/claude-haiku-4.5',
      analysis: 'anthropic/claude-sonnet-4.5',
      fallback: 'google/gemini-2.5-pro',
    },
    capabilities: [
      'Natural language to SQL conversion',
      'Secure ClickHouse query generation',
      'Permission-aware filtering (klaviyo_public_id)',
      'Advanced data analysis with business insights',
      'Automatic fallback to Gemini',
      'Cost tracking and optimization',
    ],
  });
}

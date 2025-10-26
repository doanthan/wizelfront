/**
 * SQL Generation Only Route
 *
 * Generates ClickHouse SQL queries from natural language
 * without executing them or analyzing results.
 *
 * Useful for:
 * - Previewing SQL before execution
 * - Learning SQL query patterns
 * - Custom query execution pipelines
 * - Testing SQL generation quality
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import { getUserAccessibleStores } from '@/lib/ai-agent/permissions';
import { storeIdsToKlaviyoIds } from '@/lib/utils/id-mapper';
import { generateSQL, generateSQLWithRetry } from '@/lib/ai/haiku-sql';
import { CostTracker } from '@/lib/utils/cost-tracker';
import { sanitizeInput } from '@/lib/input-sanitizer';
import { estimateQueryComplexity } from '@/lib/db/validation';

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
    const accessibleStores = await getUserAccessibleStores(user._id);

    if (accessibleStores.length === 0) {
      return NextResponse.json({
        error: 'No stores with Klaviyo integration found. Please connect your Klaviyo account to generate queries.',
        details: 'You have stores, but none of them have the Klaviyo connector set up yet.'
      }, { status: 400 });
    }

    const accessibleStoreIds = accessibleStores.map(s => s.public_id);

    // 3. Parse and sanitize request
    const body = await request.json();
    const {
      question: rawQuestion,
      storeIds: rawStoreIds = [],
      options = {},
    } = body;

    // Sanitize inputs
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

    const {
      withRetry = true,
      maxRetries = 2,
      debug = false,
    } = options;

    // 4. Determine which stores to query
    const targetStoreIds = storeIds.length > 0 ? storeIds : accessibleStoreIds;

    // Validate permissions
    const unauthorizedStores = targetStoreIds.filter(
      id => !accessibleStoreIds.includes(id)
    );

    if (unauthorizedStores.length > 0) {
      return NextResponse.json({
        error: 'Access denied to some stores',
        unauthorizedStores,
      }, { status: 403 });
    }

    // 5. Convert store IDs to Klaviyo IDs
    const { klaviyoIds, storeMap, errors: idErrors } = await storeIdsToKlaviyoIds(targetStoreIds);

    if (klaviyoIds.length === 0) {
      return NextResponse.json({
        error: 'No valid Klaviyo integrations found',
        details: idErrors,
      }, { status: 400 });
    }

    // 5. Generate SQL query
    console.log('🔍 Generating SQL for:', question);
    console.log('🎯 Klaviyo IDs:', klaviyoIds);

    let sqlResult;
    if (withRetry) {
      sqlResult = await generateSQLWithRetry(question, klaviyoIds, {
        costTracker,
        debug: debug || process.env.NODE_ENV === 'development',
        maxRetries,
      });
    } else {
      sqlResult = await generateSQL(question, klaviyoIds, {
        costTracker,
        debug: debug || process.env.NODE_ENV === 'development',
      });
    }

    // 6. Estimate query complexity
    const complexity = estimateQueryComplexity(sqlResult.sql);

    // 7. Build store context
    const storeNames = Array.from(storeMap.values()).map(s => s.store_name);

    // 8. Calculate execution time
    const totalTime = Date.now() - startTime;

    // 9. Get cost summary
    const costSummary = costTracker.getSummary();

    // 10. Return SQL with metadata
    return NextResponse.json({
      success: true,
      sql: sqlResult.sql,
      metadata: {
        question,
        storeCount: targetStoreIds.length,
        stores: storeNames,
        klaviyoIds,
        tables: sqlResult.tables,
        complexity: {
          level: complexity.complexity,
          reasons: complexity.reasons,
        },
        validation: {
          valid: sqlResult.validation.valid,
          warnings: sqlResult.validation.warnings || [],
        },
        executionTime: `${totalTime}ms`,
        cost: {
          total: costSummary.totalCost,
          model: 'anthropic/claude-haiku-4.5',
          tokens: {
            input: sqlResult.usage.prompt_tokens,
            output: sqlResult.usage.completion_tokens,
            total: sqlResult.usage.total_tokens,
          },
        },
        warnings: [
          ...(sqlResult.validation.warnings || []),
          ...(idErrors.length > 0 ? idErrors : []),
        ],
      },
    });

  } catch (error) {
    console.error('❌ SQL generation error:', error);

    const totalTime = Date.now() - startTime;
    const costSummary = costTracker.getSummary();

    return NextResponse.json({
      error: 'SQL generation failed',
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
    service: 'SQL Generation',
    status: 'ready',
    description: 'Generate ClickHouse SQL queries from natural language using Haiku 4.5',
    model: 'anthropic/claude-haiku-4.5',
    capabilities: [
      'Natural language to SQL conversion',
      'Multi-table query support',
      'Secure query validation',
      'Permission-aware filtering',
      'Complexity estimation',
      'Rate column handling',
      'Automatic retry on failure',
    ],
    usage: {
      endpoint: 'POST /api/ai/sql-generate',
      body: {
        question: 'Natural language question',
        storeIds: ['store1', 'store2'], // Optional, defaults to all user stores
        options: {
          withRetry: true, // Optional, default: true
          maxRetries: 2, // Optional, default: 2
          debug: false, // Optional, default: false
        },
      },
    },
  });
}

/**
 * Streaming Analysis Route
 *
 * Two-stage analysis with Server-Sent Events (SSE) streaming
 * for real-time user feedback as analysis is generated
 */

import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import { getUserAccessibleStores } from '@/lib/ai-agent/permissions';
import { storeIdsToKlaviyoIds } from '@/lib/utils/id-mapper';
import { generateSQL } from '@/lib/ai/haiku-sql';
import { analyzeMarketingDataStream } from '@/lib/ai/sonnet-analysis';
import { CostTracker } from '@/lib/utils/cost-tracker';
import { sanitizeInput } from '@/lib/input-sanitizer';
import { getClickHouseClient } from '@/lib/clickhouse';

export async function POST(request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // 2. Get user's accessible stores via ContractSeat system
    const accessibleStores = await getUserAccessibleStores(user._id);

    if (accessibleStores.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No stores with Klaviyo integration found. Please connect your Klaviyo account to analyze your marketing data.',
          details: 'You have stores, but none of them have the Klaviyo connector set up yet.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const accessibleStoreIds = accessibleStores.map(s => s.public_id);

    // 3. Parse and sanitize request
    const body = await request.json();
    const {
      question: rawQuestion,
      storeIds: rawStoreIds = [],
    } = body;

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
      return new Response('Question is required', { status: 400 });
    }

    // 4. Setup streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const costTracker = new CostTracker();
        const startTime = Date.now();

        try {
          // Helper to send SSE events
          const sendEvent = (event, data) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          // Send initial status
          sendEvent('status', { message: 'Validating permissions...' });

          // 5. Determine target stores
          const targetStoreIds = storeIds.length > 0 ? storeIds : accessibleStoreIds;

          const unauthorizedStores = targetStoreIds.filter(
            id => !accessibleStoreIds.includes(id)
          );

          if (unauthorizedStores.length > 0) {
            sendEvent('error', {
              message: 'Access denied to some stores',
              unauthorizedStores,
            });
            controller.close();
            return;
          }

          // 6. Convert store IDs to Klaviyo IDs
          sendEvent('status', { message: 'Resolving store integrations...' });

          const { klaviyoIds, storeMap, errors: idErrors } = await storeIdsToKlaviyoIds(targetStoreIds);

          if (klaviyoIds.length === 0) {
            sendEvent('error', {
              message: 'No valid Klaviyo integrations found',
              details: idErrors,
            });
            controller.close();
            return;
          }

          // 6. Generate SQL
          sendEvent('status', { message: 'Generating SQL query...' });

          const sqlResult = await generateSQL(question, klaviyoIds, {
            costTracker,
            debug: false,
          });

          sendEvent('sql', {
            sql: sqlResult.sql,
            tables: sqlResult.tables,
            warnings: sqlResult.validation.warnings,
          });

          // 7. Execute query
          sendEvent('status', { message: 'Querying database...' });

          let queryResults;
          try {
            const clickhouse = getClickHouseClient();
            const result = await clickhouse.query({
              query: sqlResult.sql,
              format: 'JSONEachRow',
            });

            queryResults = await result.json();

            sendEvent('query_complete', {
              rowCount: queryResults.length,
            });

          } catch (error) {
            sendEvent('error', {
              message: 'Query execution failed',
              details: error.message,
            });
            controller.close();
            return;
          }

          // 8. Stream analysis results
          sendEvent('status', { message: 'Analyzing results...' });

          const storeNames = Array.from(storeMap.values()).map(s => s.store_name);
          const analysisContext = {
            storeNames,
            dataSource: 'clickhouse',
            userExpertise: user.expertise_level || 'intermediate',
          };

          // Create streaming analysis
          const analysisStream = await analyzeMarketingDataStream(
            question,
            sqlResult.sql,
            queryResults,
            analysisContext,
            true // Enable Gemini fallback
          );

          // Stream chunks as they arrive
          for await (const chunk of analysisStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              sendEvent('analysis_chunk', { content });
            }
          }

          // 9. Send completion event with metadata
          const totalTime = Date.now() - startTime;
          const costSummary = costTracker.getSummary();

          sendEvent('complete', {
            metadata: {
              question,
              storeCount: targetStoreIds.length,
              stores: storeNames,
              rowCount: queryResults.length,
              executionTime: `${totalTime}ms`,
              cost: {
                total: costSummary.totalCost,
                byTier: costSummary.byTier,
              },
            },
          });

          controller.close();

        } catch (error) {
          console.error('❌ Streaming analysis error:', error);

          const sendEvent = (event, data) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          sendEvent('error', {
            message: 'Analysis failed',
            details: error.message,
          });

          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Stream setup error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to initialize stream',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET endpoint to check service status
 */
export async function GET(request) {
  return new Response(
    JSON.stringify({
      service: 'Streaming AI Analysis (Tier 2)',
      status: 'ready',
      description: 'Server-Sent Events (SSE) streaming for real-time analysis feedback',
      tier: 2,
      streaming: true,
      events: [
        { name: 'status', description: 'Progress updates' },
        { name: 'sql', description: 'Generated SQL query' },
        { name: 'query_complete', description: 'Query execution complete' },
        { name: 'analysis_chunk', description: 'Streaming analysis content' },
        { name: 'complete', description: 'Analysis complete with metadata' },
        { name: 'error', description: 'Error occurred' },
      ],
      usage: {
        endpoint: 'POST /api/ai/stream-analysis',
        body: {
          question: 'Natural language question',
          storeIds: ['store1', 'store2'], // Optional
        },
        clientUsage: `
// Client-side usage
const eventSource = new EventSource('/api/ai/stream-analysis');

eventSource.addEventListener('status', (event) => {
  const data = JSON.parse(event.data);
  console.log('Status:', data.message);
});

eventSource.addEventListener('analysis_chunk', (event) => {
  const data = JSON.parse(event.data);
  appendToUI(data.content); // Stream to UI
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Complete:', data.metadata);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Error:', data.message);
  eventSource.close();
});
        `,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

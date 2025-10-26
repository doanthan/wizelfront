/**
 * AI Chatbot with Two-Tier Architecture
 *
 * Tier 1 (Haiku): Fast, cheap store identification from user query
 * Tier 2 (Sonnet): Deep analysis with appropriate context level
 *
 * Flow:
 * 1. User asks: "How are my Australian supplement brands doing?"
 * 2. Haiku identifies: Stores matching "Australian" + "supplement"
 * 3. Sonnet analyzes: With full context for identified stores
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { identifyAndBuildContext } from '@/lib/ai-store-identifier';

export async function POST(request) {
    try {
        // 1. Authenticate user
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get request data
        const { message, storeIds, conversationHistory = [] } = await request.json();

        if (!message) {
            return NextResponse.json({
                error: 'Missing required field: message'
            }, { status: 400 });
        }

        if (!storeIds || storeIds.length === 0) {
            return NextResponse.json({
                error: 'Missing required field: storeIds'
            }, { status: 400 });
        }

        // 3. Fetch all available stores with full data
        await connectToDatabase();
        const availableStores = await Store.find({
            public_id: { $in: storeIds },
            is_deleted: { $ne: true }
        }).select('public_id name store_description adaptive_rfm_config');

        if (availableStores.length === 0) {
            return NextResponse.json({
                error: 'No valid stores found'
            }, { status: 404 });
        }

        console.log(`📊 User has access to ${availableStores.length} stores`);

        // 4. TIER 1: Use Haiku to identify which stores are relevant
        console.log('🔍 Haiku analyzing query to identify stores...');
        const tieredContext = await identifyAndBuildContext(message, availableStores);

        console.log(`✅ Haiku identified ${tieredContext.identification.count} stores (${tieredContext.identification.filterType})`);
        console.log(`📝 Reasoning: ${tieredContext.identification.reasoning}`);
        console.log(`🎯 Context mode: ${tieredContext.metadata.context_mode}`);

        // 5. TIER 2: Use Sonnet with appropriately tiered context
        console.log('🧠 Sending to Sonnet with tiered context...');

        const sonnetResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                system: tieredContext.systemPrompt,
                messages: [
                    // Include conversation history if provided
                    ...conversationHistory,
                    {
                        role: 'user',
                        content: message
                    }
                ]
            })
        });

        if (!sonnetResponse.ok) {
            const errorText = await sonnetResponse.text();
            throw new Error(`Sonnet API error: ${sonnetResponse.statusText} - ${errorText}`);
        }

        const result = await sonnetResponse.json();

        // 6. Return response with metadata
        return NextResponse.json({
            // AI response
            message: result.content[0].text,

            // Store identification metadata
            stores_analyzed: {
                identified_stores: tieredContext.identification.storeIds,
                filter_type: tieredContext.identification.filterType,
                filter_count: tieredContext.identification.count,
                confidence: tieredContext.identification.confidence,
                reasoning: tieredContext.identification.reasoning
            },

            // Context metadata
            context: {
                mode: tieredContext.metadata.context_mode,
                total_available: tieredContext.metadata.total_available_stores,
                stores_in_context: tieredContext.metadata.stores_analyzed,
                estimated_tokens: tieredContext.metadata.sonnet_context_tokens
            },

            // Token usage
            usage: {
                haiku_tokens: '~300-500 (identification)',
                sonnet_input_tokens: result.usage.input_tokens,
                sonnet_output_tokens: result.usage.output_tokens,
                total_input_tokens: result.usage.input_tokens + 400 // ~400 for Haiku
            },

            // Model info
            models_used: {
                identifier: 'claude-3-5-haiku-20241022',
                analyzer: 'claude-3-5-sonnet-20241022'
            }
        });

    } catch (error) {
        console.error('❌ AI Chat Error:', error);
        return NextResponse.json({
            error: 'Failed to process chat request',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Example requests and responses
 */

// Example 1: Specific store by nickname
// Request: {
//   message: "How is the supplement brand doing?",
//   storeIds: ["XqkVGb", "7MP60fH", "rZResQK", ...25 stores]
// }
// Haiku identifies: ["XqkVGb"] (matches "supplement brand" nickname)
// Sonnet gets: Full context for 1 store (mode: 'single')
// Total tokens: ~1,400 (400 Haiku + 1,000 Sonnet context)

// Example 2: Bottom performers from large portfolio
// Request: {
//   message: "Help me fix my 3 worst performing stores",
//   storeIds: [...30 store IDs]
// }
// Haiku identifies: Bottom 3 by revenue
// Sonnet gets: Full context for 3 stores (mode: 'small_group')
// Total tokens: ~2,800 (400 Haiku + 2,400 Sonnet context)

// Example 3: Regional filter
// Request: {
//   message: "What's working for my Australian brands?",
//   storeIds: [...25 store IDs]
// }
// Haiku identifies: All stores with region="Australia" (e.g., 4 stores)
// Sonnet gets: Full context for 4 stores (mode: 'small_group')
// Total tokens: ~3,600 (400 Haiku + 3,200 Sonnet context)

// Example 4: Generic question with many stores
// Request: {
//   message: "Give me portfolio insights",
//   storeIds: [...40 store IDs]
// }
// Haiku identifies: All 40 stores
// Sonnet gets: Minimal context for all (mode: 'large_summary')
// Total tokens: ~2,400 (400 Haiku + 2,000 Sonnet context)
// Response includes: "Please specify which stores to analyze"

// Example 5: Top performers
// Request: {
//   message: "What's the secret to my top 5 revenue generators?",
//   storeIds: [...20 store IDs]
// }
// Haiku identifies: Top 5 by revenue
// Sonnet gets: Full context for 5 stores (mode: 'small_group')
// Total tokens: ~4,400 (400 Haiku + 4,000 Sonnet context)

/**
 * Example: How to use the AI Store Context Builder in your chatbot
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildStoreContext, buildSystemPrompt } from '@/lib/ai-store-context';

/**
 * Example AI Chatbot Route
 * Path: /app/api/ai/chat/route.js
 */
export async function POST(request) {
    try {
        // 1. Authenticate user
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get request data
        const { message, storeIds } = await request.json();

        if (!message || !storeIds || storeIds.length === 0) {
            return NextResponse.json({
                error: 'Missing required fields: message, storeIds'
            }, { status: 400 });
        }

        // 3. Fetch stores with store_description and RFM data
        await connectToDatabase();
        const stores = await Store.find({
            public_id: { $in: storeIds },
            is_deleted: { $ne: true }
        }).select('public_id name store_description adaptive_rfm_config');

        if (stores.length === 0) {
            return NextResponse.json({
                error: 'No valid stores found'
            }, { status: 404 });
        }

        // 4. Build intelligent tiered context
        const storeContext = buildStoreContext(stores, message);
        const systemPrompt = buildSystemPrompt(storeContext);

        // 5. Send to Claude with context
        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: message }
                ]
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`Claude API error: ${aiResponse.statusText}`);
        }

        const result = await aiResponse.json();

        // 6. Return response with context metadata
        return NextResponse.json({
            message: result.content[0].text,
            context: {
                mode: storeContext.mode,
                stores_analyzed: storeContext.focus_stores?.length || storeContext.stores?.length || 0,
                total_stores: storeContext.total_stores || stores.length
            },
            usage: result.usage
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({
            error: 'Failed to process chat request',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Example Usage Scenarios
 */

// Scenario 1: Single store analysis
const singleStoreRequest = {
    message: "How can I improve retention for this store?",
    storeIds: ["XqkVGb"]
};
// Result: Full detailed context (mode: 'single')
// Tokens: ~1,000

// Scenario 2: Small portfolio (3 stores)
const smallPortfolioRequest = {
    message: "Compare the marketing strategies across these stores",
    storeIds: ["XqkVGb", "7MP60fH", "rZResQK"]
};
// Result: Full context for all 3 stores (mode: 'small_group')
// Tokens: ~3,000

// Scenario 3: Medium portfolio with filter (15 stores)
const mediumFilteredRequest = {
    message: "What strategies should I use for my bottom 3 performing stores?",
    storeIds: ["XqkVGb", "7MP60fH", "rZResQK", /* ...12 more stores */]
};
// Result: Full context for bottom 3, summary for other 12 (mode: 'filtered')
// Tokens: ~4,000

// Scenario 4: Large portfolio (25 stores) - no filter
const largeUnfilteredRequest = {
    message: "Give me an overview of my portfolio",
    storeIds: [/* 25 store IDs */]
};
// Result: Minimal context for all, asks user to specify (mode: 'large_summary')
// Tokens: ~2,000

// Scenario 5: Large portfolio (25 stores) - with filter
const largeFilteredRequest = {
    message: "Analyze the top 5 revenue generators in my portfolio",
    storeIds: [/* 25 store IDs */]
};
// Result: Full context for top 5, minimal for others (mode: 'large_filtered')
// Tokens: ~5,500

/**
 * Token Budget by Mode
 */
const tokenBudgets = {
    'single': '~1,000 tokens',           // 1 store, full context
    'small_group': '~3,000 tokens',      // 2-5 stores, full context
    'medium_group': '~8,000 tokens',     // 6-20 stores, full context
    'filtered': '~4,000 tokens',         // 6-20 stores, filtered
    'large_filtered': '~5,500 tokens',   // 20+ stores, filtered
    'large_summary': '~2,000 tokens'     // 20+ stores, minimal
};

/**
 * Example: How to handle different query types
 */

// Query Type 1: Performance comparison
const queryComparison = "Compare the repeat purchase rates across all stores";
// Context builder will: Provide full context for all stores if ≤5, otherwise summary

// Query Type 2: Specific store mention
const queryMention = "What's working well for Premium Supplements store?";
// Context builder will: Extract "Premium Supplements" and give it full context

// Query Type 3: Bottom performers
const queryBottom = "Help me improve my 3 worst performing stores";
// Context builder will: Sort by revenue, select bottom 3, give full context

// Query Type 4: High AOV stores
const queryHighAOV = "What retention strategies work for my premium brands?";
// Context builder will: Filter for high AOV stores, give full context

// Query Type 5: Specific metric
const queryMetric = "Which stores have low repeat rates?";
// Context builder will: Sort by repeat rate (ascending), select top 5, give full context

/**
 * Testing the context builder
 */
async function testContextBuilder() {
    // Mock stores data
    const mockStores = [
        {
            public_id: 'XqkVGb',
            name: 'Premium Supplements',
            store_description: {
                summary: 'Premium supplement brand targeting health-conscious millennials',
                primary_industry: 'Health & Wellness - Supplements',
                region: 'Australia',
                primary_demographic: {
                    age_range: '25-40 year old millennials',
                    gender_focus: 'Primarily women',
                    income_level: 'Affluent consumers'
                },
                marketing_strengths: ['Strong email flows', 'High engagement rates'],
                business_stage: 'Well-established brand with mature marketing'
            },
            adaptive_rfm_config: {
                business_characteristics: {
                    total_customers: 2272,
                    total_orders: 2453,
                    avg_order_value: 112.93,
                    repeat_purchase_pct: 7.22,
                    avg_orders_per_customer: 1.08,
                    detected_template: 'low_repeat'
                }
            }
        },
        // Add more mock stores...
    ];

    // Test different scenarios
    console.log('=== Test 1: Single Store ===');
    const singleContext = buildStoreContext([mockStores[0]], "How can I improve retention?");
    console.log(JSON.stringify(singleContext, null, 2));

    console.log('\n=== Test 2: Bottom 3 Performers ===');
    const filteredContext = buildStoreContext(mockStores, "Analyze my bottom 3 performing stores");
    console.log(JSON.stringify(filteredContext, null, 2));

    console.log('\n=== Test 3: System Prompt ===');
    const systemPrompt = buildSystemPrompt(singleContext);
    console.log(systemPrompt);
}

// Run tests (uncomment to test)
// testContextBuilder();

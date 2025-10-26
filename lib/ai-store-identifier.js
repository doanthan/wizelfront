/**
 * AI Store Identifier using Claude Haiku
 * Fast, cheap store identification from user queries (nicknames, IDs, descriptions)
 */

/**
 * Use Haiku to identify which stores the user is referring to
 * @param {String} userQuery - The user's message/question
 * @param {Array} availableStores - All stores user has access to
 * @returns {Object} - { mentionedStoreIds: [], filterType: 'top'|'bottom'|'all'|'specific', filterCount: 3 }
 */
export async function identifyMentionedStores(userQuery, availableStores) {
    if (!availableStores || availableStores.length === 0) {
        return { mentionedStoreIds: [], filterType: 'none', filterCount: 0 };
    }

    // Build store reference list for Haiku
    const storeReferenceList = availableStores.map(store => {
        const desc = store.store_description || {};
        const rfm = store.adaptive_rfm_config?.business_characteristics || {};

        return {
            store_id: store.public_id,
            name: store.name,
            nickname: desc.store_nickname,
            industry: desc.primary_industry,
            region: desc.region,
            metrics: {
                customers: rfm.total_customers,
                aov: rfm.avg_order_value,
                repeat_rate: rfm.repeat_purchase_pct,
                revenue: (rfm.avg_order_value || 0) * (rfm.total_orders || 0)
            }
        };
    });

    // Call Haiku for fast, cheap store identification
    const haikuResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 500,
            temperature: 0, // Deterministic for classification
            system: buildHaikuSystemPrompt(storeReferenceList),
            messages: [
                {
                    role: 'user',
                    content: userQuery
                }
            ]
        })
    });

    if (!haikuResponse.ok) {
        console.error('Haiku API error:', await haikuResponse.text());
        // Fallback to all stores if Haiku fails
        return {
            mentionedStoreIds: availableStores.map(s => s.public_id),
            filterType: 'all',
            filterCount: availableStores.length,
            error: 'Haiku classification failed, using all stores'
        };
    }

    const result = await haikuResponse.json();
    const haikuText = result.content[0].text;

    // Parse Haiku's response
    return parseHaikuResponse(haikuText, availableStores);
}

/**
 * Build Haiku's system prompt for store identification
 */
function buildHaikuSystemPrompt(storeReferenceList) {
    return `You are a store identifier. Your job is to identify which stores the user is asking about and what filter to apply.

AVAILABLE STORES:
${storeReferenceList.map((store, i) => `${i + 1}. ID: ${store.store_id}
   Name: ${store.name}
   Nickname: ${store.nickname || 'None'}
   Industry: ${store.industry || 'Unknown'}
   Region: ${store.region || 'Unknown'}
   Metrics: ${store.metrics.customers || 0} customers, $${store.metrics.aov?.toFixed(2) || 0} AOV, ${store.metrics.repeat_rate?.toFixed(1) || 0}% repeat, $${store.metrics.revenue?.toFixed(0) || 0} revenue`).join('\n\n')}

INSTRUCTIONS:
1. Identify which stores the user is asking about (by name, nickname, ID, or description)
2. Determine if they want a filter applied (top N, bottom N, all, specific stores)
3. Respond ONLY in this JSON format:

{
  "mentioned_store_ids": ["store_id1", "store_id2"],
  "filter_type": "specific|top|bottom|all|low_repeat|high_aov",
  "filter_count": 3,
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation"
}

FILTER TYPES:
- "specific": User mentioned specific store names/nicknames/IDs
- "top": User wants top N performers (by revenue)
- "bottom": User wants bottom N performers (by revenue)
- "all": User asking about all stores generally
- "low_repeat": User wants stores with low repeat rates
- "high_aov": User wants stores with high AOV/premium brands
- "none": Cannot determine which stores

EXAMPLES:
Query: "How is Premium Supplements doing?"
Response: {"mentioned_store_ids": ["XqkVGb"], "filter_type": "specific", "filter_count": 1, "confidence": "high", "reasoning": "User mentioned Premium Supplements by name"}

Query: "Analyze my bottom 3 performing stores"
Response: {"mentioned_store_ids": [], "filter_type": "bottom", "filter_count": 3, "confidence": "high", "reasoning": "User wants bottom 3 by revenue"}

Query: "What's working for my top 5 revenue generators?"
Response: {"mentioned_store_ids": [], "filter_type": "top", "filter_count": 5, "confidence": "high", "reasoning": "User wants top 5 by revenue"}

Query: "Give me insights on all my stores"
Response: {"mentioned_store_ids": [], "filter_type": "all", "filter_count": ${storeReferenceList.length}, "confidence": "high", "reasoning": "User wants all stores"}

Query: "How are my Australian brands performing?"
Response: {"mentioned_store_ids": ["store_ids_in_Australia"], "filter_type": "specific", "filter_count": N, "confidence": "high", "reasoning": "User filtering by region: Australia"}

Query: "Which stores need better retention?"
Response: {"mentioned_store_ids": [], "filter_type": "low_repeat", "filter_count": 5, "confidence": "medium", "reasoning": "User wants stores with retention issues"}

Respond ONLY with valid JSON. No additional text.`;
}

/**
 * Parse Haiku's JSON response
 */
function parseHaikuResponse(haikuText, availableStores) {
    try {
        // Extract JSON from response (in case Haiku adds extra text)
        const jsonMatch = haikuText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in Haiku response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate response structure
        if (!parsed.filter_type) {
            throw new Error('Invalid Haiku response: missing filter_type');
        }

        // Handle filter types
        let finalStoreIds = [];

        if (parsed.filter_type === 'specific' && parsed.mentioned_store_ids?.length > 0) {
            // Use specifically mentioned stores
            finalStoreIds = parsed.mentioned_store_ids;
        } else if (parsed.filter_type === 'top') {
            // Get top N performers by revenue
            finalStoreIds = getTopPerformers(availableStores, parsed.filter_count || 5);
        } else if (parsed.filter_type === 'bottom') {
            // Get bottom N performers by revenue
            finalStoreIds = getBottomPerformers(availableStores, parsed.filter_count || 3);
        } else if (parsed.filter_type === 'low_repeat') {
            // Get stores with lowest repeat rates
            finalStoreIds = getLowRepeatStores(availableStores, parsed.filter_count || 5);
        } else if (parsed.filter_type === 'high_aov') {
            // Get stores with highest AOV
            finalStoreIds = getHighAOVStores(availableStores, parsed.filter_count || 5);
        } else if (parsed.filter_type === 'all') {
            // All stores
            finalStoreIds = availableStores.map(s => s.public_id);
        }

        return {
            mentionedStoreIds: finalStoreIds,
            filterType: parsed.filter_type,
            filterCount: finalStoreIds.length,
            confidence: parsed.confidence || 'medium',
            reasoning: parsed.reasoning || 'No reasoning provided',
            rawResponse: parsed
        };

    } catch (error) {
        console.error('Error parsing Haiku response:', error);
        console.error('Haiku response:', haikuText);

        // Fallback: return all stores
        return {
            mentionedStoreIds: availableStores.map(s => s.public_id),
            filterType: 'all',
            filterCount: availableStores.length,
            confidence: 'low',
            reasoning: 'Parse error, defaulting to all stores',
            error: error.message
        };
    }
}

/**
 * Get top N performers by revenue
 */
function getTopPerformers(stores, count = 5) {
    return stores
        .map(store => {
            const rfm = store.adaptive_rfm_config?.business_characteristics;
            const revenue = (rfm?.avg_order_value || 0) * (rfm?.total_orders || 0);
            return { store, revenue };
        })
        .sort((a, b) => b.revenue - a.revenue) // Descending
        .slice(0, count)
        .map(item => item.store.public_id);
}

/**
 * Get bottom N performers by revenue
 */
function getBottomPerformers(stores, count = 3) {
    return stores
        .map(store => {
            const rfm = store.adaptive_rfm_config?.business_characteristics;
            const revenue = (rfm?.avg_order_value || 0) * (rfm?.total_orders || 0);
            return { store, revenue };
        })
        .sort((a, b) => a.revenue - b.revenue) // Ascending
        .slice(0, count)
        .map(item => item.store.public_id);
}

/**
 * Get stores with lowest repeat rates
 */
function getLowRepeatStores(stores, count = 5) {
    return stores
        .map(store => {
            const rfm = store.adaptive_rfm_config?.business_characteristics;
            const repeatRate = rfm?.repeat_purchase_pct || 0;
            return { store, repeatRate };
        })
        .sort((a, b) => a.repeatRate - b.repeatRate) // Ascending
        .slice(0, count)
        .map(item => item.store.public_id);
}

/**
 * Get stores with highest AOV
 */
function getHighAOVStores(stores, count = 5) {
    return stores
        .map(store => {
            const rfm = store.adaptive_rfm_config?.business_characteristics;
            const aov = rfm?.avg_order_value || 0;
            return { store, aov };
        })
        .sort((a, b) => b.aov - a.aov) // Descending
        .slice(0, count)
        .map(item => item.store.public_id);
}

/**
 * Main function: Haiku identifies stores, then build context for Sonnet
 * @param {String} userQuery - User's question
 * @param {Array} availableStores - All stores user has access to
 * @returns {Object} - { identifiedStoreIds, storeContext, mode, metadata }
 */
export async function identifyAndBuildContext(userQuery, availableStores) {
    // Step 1: Use Haiku to identify which stores are mentioned
    const identification = await identifyMentionedStores(userQuery, availableStores);

    // Step 2: Filter stores based on Haiku's identification
    const relevantStores = availableStores.filter(store =>
        identification.mentionedStoreIds.includes(store.public_id)
    );

    // Step 3: Build appropriate context based on number of identified stores
    const { buildStoreContext, buildSystemPrompt } = await import('./ai-store-context.js');
    const storeContext = buildStoreContext(relevantStores, userQuery);
    const systemPrompt = buildSystemPrompt(storeContext);

    return {
        // Haiku identification results
        identification: {
            storeIds: identification.mentionedStoreIds,
            filterType: identification.filterType,
            count: identification.filterCount,
            confidence: identification.confidence,
            reasoning: identification.reasoning
        },

        // Sonnet context
        storeContext: storeContext,
        systemPrompt: systemPrompt,

        // Metadata
        metadata: {
            total_available_stores: availableStores.length,
            stores_analyzed: relevantStores.length,
            context_mode: storeContext.mode,
            haiku_tokens_used: '~300-500', // Estimated
            sonnet_context_tokens: estimateTokens(storeContext)
        }
    };
}

/**
 * Estimate token count for context
 */
function estimateTokens(storeContext) {
    switch (storeContext.mode) {
        case 'single': return '~1,000';
        case 'small_group': return `~${storeContext.stores?.length * 800 || 3000}`;
        case 'medium_group': return `~${storeContext.stores?.length * 500 || 5000}`;
        case 'filtered': return '~4,000';
        case 'large_filtered': return '~5,500';
        case 'large_summary': return '~2,000';
        default: return 'Unknown';
    }
}

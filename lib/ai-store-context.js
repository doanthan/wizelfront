/**
 * AI Store Context Builder
 * Provides intelligent, tiered context for AI chatbot based on number of stores
 */

/**
 * Build intelligent store context for AI
 * @param {Array} stores - Array of Store documents
 * @param {String} userQuery - User's question/message
 * @returns {Object} Formatted context for AI
 */
export function buildStoreContext(stores, userQuery = '') {
    if (!stores || stores.length === 0) {
        return { stores: [], note: 'No stores available' };
    }

    // Single store: Full detailed context
    if (stores.length === 1) {
        return {
            mode: 'single',
            store: buildFullContext(stores[0])
        };
    }

    // 2-5 stores: Full context for all
    if (stores.length <= 5) {
        return {
            mode: 'small_group',
            stores: stores.map(buildFullContext)
        };
    }

    // 6-20 stores: Smart filtering with full context for focus stores
    if (stores.length <= 20) {
        const mentioned = extractMentionedStores(userQuery, stores);
        const filtered = filterStoresByQuery(userQuery, stores);

        // User mentioned specific stores
        if (mentioned.length > 0 && mentioned.length <= 5) {
            return {
                mode: 'filtered',
                focus_stores: mentioned.map(buildFullContext),
                other_stores: stores
                    .filter(s => !mentioned.some(m => m.public_id === s.public_id))
                    .map(buildSummaryContext),
                total_stores: stores.length
            };
        }

        // Query filtered stores (e.g., "bottom 3 performers")
        if (filtered.length > 0 && filtered.length <= 5) {
            return {
                mode: 'filtered',
                focus_stores: filtered.map(buildFullContext),
                other_stores: stores
                    .filter(s => !filtered.some(f => f.public_id === s.public_id))
                    .map(buildSummaryContext),
                filter_applied: extractFilterType(userQuery),
                total_stores: stores.length
            };
        }

        // No clear filter: Full context for all
        return {
            mode: 'medium_group',
            stores: stores.map(buildFullContext)
        };
    }

    // 20+ stores: Summary only unless filtered
    const mentioned = extractMentionedStores(userQuery, stores);
    const filtered = filterStoresByQuery(userQuery, stores);

    if (mentioned.length > 0 && mentioned.length <= 5) {
        return {
            mode: 'large_filtered',
            focus_stores: mentioned.map(buildFullContext),
            all_stores_summary: stores.map(buildMinimalContext),
            total_stores: stores.length
        };
    }

    if (filtered.length > 0 && filtered.length <= 5) {
        return {
            mode: 'large_filtered',
            focus_stores: filtered.map(buildFullContext),
            all_stores_summary: stores.map(buildMinimalContext),
            filter_applied: extractFilterType(userQuery),
            total_stores: stores.length
        };
    }

    // Too many stores, no clear filter
    return {
        mode: 'large_summary',
        stores: stores.map(buildMinimalContext),
        total_stores: stores.length,
        note: 'Please specify which stores to analyze for detailed insights.'
    };
}

/**
 * Build full context for a store (use for ≤5 focus stores)
 */
function buildFullContext(store) {
    const desc = store.store_description || {};
    const rfm = store.adaptive_rfm_config?.business_characteristics || {};

    return {
        store_id: store.public_id,
        name: store.name,

        // Qualitative context
        summary: desc.summary,
        industry: desc.primary_industry,
        region: desc.region,
        nickname: desc.store_nickname,
        demographic: {
            age: desc.primary_demographic?.age_range,
            gender: desc.primary_demographic?.gender_focus,
            income: desc.primary_demographic?.income_level
        },
        strengths: desc.marketing_strengths,
        stage: desc.business_stage,
        unique_traits: desc.unique_characteristics,
        estimated_ltv: desc.ai_estimated_customer_ltv,

        // Quantitative metrics
        performance: {
            total_customers: rfm.total_customers,
            total_orders: rfm.total_orders,
            avg_order_value: rfm.avg_order_value,
            repeat_rate: rfm.repeat_purchase_pct,
            orders_per_customer: rfm.avg_orders_per_customer,
            business_model: rfm.detected_template
        }
    };
}

/**
 * Build summary context (use for 6-20 stores, background context)
 */
function buildSummaryContext(store) {
    const desc = store.store_description || {};
    const rfm = store.adaptive_rfm_config?.business_characteristics || {};

    return {
        store_id: store.public_id,
        name: store.name,
        industry: desc.primary_industry,
        stage: desc.business_stage,
        metrics: {
            customers: rfm.total_customers,
            aov: rfm.avg_order_value,
            repeat_rate: rfm.repeat_purchase_pct,
            model: rfm.detected_template
        }
    };
}

/**
 * Build minimal context (use for 20+ stores)
 */
function buildMinimalContext(store) {
    const desc = store.store_description || {};
    const rfm = store.adaptive_rfm_config?.business_characteristics || {};

    return {
        id: store.public_id,
        name: store.name,
        industry: desc.primary_industry,
        customers: rfm.total_customers,
        aov: rfm.avg_order_value,
        repeat_rate: rfm.repeat_purchase_pct
    };
}

/**
 * Extract stores mentioned by name or ID in the query
 */
function extractMentionedStores(query, stores) {
    const mentioned = [];
    const lowerQuery = query.toLowerCase();

    for (const store of stores) {
        const storeName = store.name.toLowerCase();
        const storeId = store.public_id.toLowerCase();

        if (lowerQuery.includes(storeName) || lowerQuery.includes(storeId)) {
            mentioned.push(store);
        }
    }

    return mentioned;
}

/**
 * Filter stores based on query intent (top/bottom performers, etc.)
 */
function filterStoresByQuery(query, stores) {
    const lowerQuery = query.toLowerCase();

    // Calculate revenue for each store
    const storesWithRevenue = stores.map(store => {
        const rfm = store.adaptive_rfm_config?.business_characteristics;
        const revenue = (rfm?.avg_order_value || 0) * (rfm?.total_orders || 0);
        return { store, revenue };
    });

    // "bottom N" or "worst performing"
    if (lowerQuery.match(/bottom|worst|lowest|underperforming/)) {
        const count = extractNumber(query) || 3;
        return storesWithRevenue
            .sort((a, b) => a.revenue - b.revenue) // Ascending
            .slice(0, count)
            .map(item => item.store);
    }

    // "top N" or "best performing"
    if (lowerQuery.match(/top|best|highest|leading/)) {
        const count = extractNumber(query) || 3;
        return storesWithRevenue
            .sort((a, b) => b.revenue - a.revenue) // Descending
            .slice(0, count)
            .map(item => item.store);
    }

    // "low repeat rate" or "high churn"
    if (lowerQuery.match(/low repeat|high churn|poor retention/)) {
        const count = extractNumber(query) || 5;
        return stores
            .sort((a, b) => {
                const aRate = a.adaptive_rfm_config?.business_characteristics?.repeat_purchase_pct || 0;
                const bRate = b.adaptive_rfm_config?.business_characteristics?.repeat_purchase_pct || 0;
                return aRate - bRate; // Ascending
            })
            .slice(0, count);
    }

    // "high AOV" or "premium stores"
    if (lowerQuery.match(/high aov|premium|expensive|luxury/)) {
        const count = extractNumber(query) || 5;
        return stores
            .sort((a, b) => {
                const aAov = a.adaptive_rfm_config?.business_characteristics?.avg_order_value || 0;
                const bAov = b.adaptive_rfm_config?.business_characteristics?.avg_order_value || 0;
                return bAov - aAov; // Descending
            })
            .slice(0, count);
    }

    return [];
}

/**
 * Extract filter type from query
 */
function extractFilterType(query) {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.match(/bottom|worst|lowest/)) return 'Bottom performers';
    if (lowerQuery.match(/top|best|highest/)) return 'Top performers';
    if (lowerQuery.match(/low repeat|poor retention/)) return 'Low repeat rate';
    if (lowerQuery.match(/high aov|premium/)) return 'High AOV stores';
    return 'Custom filter';
}

/**
 * Extract number from query (e.g., "bottom 3" -> 3)
 */
function extractNumber(query) {
    const match = query.match(/\b(\d+)\b/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Build system prompt with store context
 */
export function buildSystemPrompt(storeContext) {
    const { mode } = storeContext;

    switch (mode) {
        case 'single':
            return buildSingleStorePrompt(storeContext.store);

        case 'small_group':
            return buildSmallGroupPrompt(storeContext.stores);

        case 'medium_group':
            return buildMediumGroupPrompt(storeContext.stores);

        case 'filtered':
            return buildFilteredPrompt(
                storeContext.focus_stores,
                storeContext.other_stores,
                storeContext.filter_applied
            );

        case 'large_filtered':
            return buildLargeFilteredPrompt(
                storeContext.focus_stores,
                storeContext.all_stores_summary,
                storeContext.filter_applied
            );

        case 'large_summary':
            return buildLargeSummaryPrompt(storeContext.stores);

        default:
            return 'You are Wizel, an expert marketing strategist for Klaviyo e-commerce brands.';
    }
}

// Prompt builders for each mode
function buildSingleStorePrompt(store) {
    return `You are Wizel, an expert marketing strategist for Klaviyo e-commerce brands.

STORE CONTEXT: ${store.name} (${store.store_id})

📝 Overview:
${store.summary || 'No description available'}

🎯 Target Market:
- Industry: ${store.industry || 'Not specified'}
- Region: ${store.region || 'Not specified'}
- Demographic: ${store.demographic?.age || 'N/A'}, ${store.demographic?.gender || 'N/A'}, ${store.demographic?.income || 'N/A'}
- Business Stage: ${store.stage || 'Not specified'}

💪 Strengths: ${store.strengths?.join(', ') || 'Not specified'}
⭐ Unique Traits: ${store.unique_traits?.join(', ') || 'Not specified'}

📊 Performance Metrics:
- ${store.performance.total_customers || 0} customers
- $${store.performance.avg_order_value?.toFixed(2) || 0} AOV
- ${store.performance.repeat_rate?.toFixed(1) || 0}% repeat rate
- ${store.performance.orders_per_customer?.toFixed(2) || 0} orders/customer
- Business Model: ${store.performance.business_model || 'unknown'}

💰 Estimated LTV: $${store.estimated_ltv?.average_value || 'N/A'} (${store.estimated_ltv?.average_purchases || 'N/A'} purchases)

Provide personalized insights and recommendations based on this store's unique characteristics and performance.`;
}

function buildSmallGroupPrompt(stores) {
    return `You are Wizel, an expert marketing strategist for Klaviyo e-commerce brands.

ANALYZING ${stores.length} STORES:

${stores.map((store, i) => `
${i + 1}. ${store.name} (${store.store_id})
   "${store.summary || 'No description'}"

   Industry: ${store.industry} | Region: ${store.region} | Stage: ${store.stage}
   Target: ${store.demographic?.age}, ${store.demographic?.gender}, ${store.demographic?.income}

   Performance: ${store.performance.total_customers} customers, $${store.performance.avg_order_value?.toFixed(2)} AOV, ${store.performance.repeat_rate?.toFixed(1)}% repeat
   Model: ${store.performance.business_model}
`).join('\n')}

Provide comparative insights and store-specific recommendations.`;
}

function buildMediumGroupPrompt(stores) {
    return `You are Wizel, an expert marketing strategist for Klaviyo e-commerce brands.

ANALYZING ${stores.length} STORES (Medium Portfolio):

${stores.map((store, i) => `${i + 1}. ${store.name}: ${store.industry}, ${store.performance.total_customers} customers, $${store.performance.avg_order_value?.toFixed(2)} AOV`).join('\n')}

Provide portfolio-level insights. Mention specific stores by name when giving recommendations.`;
}

function buildFilteredPrompt(focusStores, otherStores, filterApplied) {
    return `You are Wizel, an expert marketing strategist for Klaviyo e-commerce brands.

${filterApplied ? `FILTER APPLIED: ${filterApplied}\n` : ''}
FOCUS STORES (${focusStores.length}):

${focusStores.map((store, i) => `
${i + 1}. ${store.name} (${store.store_id})
   ${store.summary || 'No description'}

   Industry: ${store.industry} | Stage: ${store.stage}
   Performance: ${store.performance.total_customers} customers, $${store.performance.avg_order_value?.toFixed(2)} AOV, ${store.performance.repeat_rate?.toFixed(1)}% repeat
`).join('\n')}

OTHER STORES (${otherStores.length}):
${otherStores.map(s => `- ${s.name}: ${s.industry}, ${s.metrics.customers} customers, $${s.metrics.aov?.toFixed(2)} AOV`).join('\n')}

Focus your analysis on the primary stores unless specifically asked about others.`;
}

function buildLargeFilteredPrompt(focusStores, allStoresSummary, filterApplied) {
    return `You are Wizel, an expert marketing strategist for Klaviyo e-commerce brands.

PORTFOLIO: ${allStoresSummary.length} total stores
${filterApplied ? `ANALYZING: ${filterApplied}\n` : ''}

FOCUS STORES (${focusStores.length}):
${focusStores.map((store, i) => `${i + 1}. ${store.name}: ${store.industry}, ${store.performance.total_customers} customers, $${store.performance.avg_order_value?.toFixed(2)} AOV, ${store.performance.repeat_rate?.toFixed(1)}% repeat`).join('\n')}

ALL STORES (Quick Reference):
${allStoresSummary.map(s => `- ${s.name}: ${s.industry}, ${s.customers} customers`).join('\n')}

Focus analysis on the selected stores. Reference other stores only when relevant.`;
}

function buildLargeSummaryPrompt(stores) {
    return `You are Wizel, an expert marketing strategist for Klaviyo e-commerce brands.

LARGE PORTFOLIO: ${stores.length} stores

${stores.map(s => `- ${s.name} (${s.id}): ${s.industry}, ${s.customers} customers, $${s.aov?.toFixed(2)} AOV, ${s.repeat_rate?.toFixed(1)}% repeat`).join('\n')}

Please specify which stores to analyze for detailed insights. I can help with:
- Top/bottom N performers
- Specific store names or IDs
- Stores by industry or performance metrics`;
}

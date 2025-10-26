/**
 * AI API Cost Tracker
 *
 * Tracks API costs across different AI providers (OpenRouter, Anthropic, Google)
 * for monitoring and cost optimization
 */

/**
 * Pricing per 1M tokens (as of Jan 2025)
 * Update these values as pricing changes
 */
const PRICING = {
  // Anthropic via OpenRouter
  'anthropic/claude-sonnet-4.5': {
    input: 3.0,    // $3.00 per 1M input tokens
    output: 15.0,  // $15.00 per 1M output tokens
  },
  'anthropic/claude-haiku-4.5': {
    input: 0.25,   // $0.25 per 1M input tokens
    output: 1.25,  // $1.25 per 1M output tokens
  },

  // Google via OpenRouter
  'google/gemini-2.5-pro': {
    input: 1.25,   // $1.25 per 1M input tokens
    output: 5.0,   // $5.00 per 1M output tokens
  },

  // Anthropic Direct SDK
  'claude-sonnet-4.5': {
    input: 3.0,
    output: 15.0,
  },
  'claude-haiku-4.5': {
    input: 0.25,
    output: 1.25,
  },
};

/**
 * Calculate cost for a single API call
 *
 * @param {string} model - Model name
 * @param {number} inputTokens - Input token count
 * @param {number} outputTokens - Output token count
 * @returns {{ cost: number, inputCost: number, outputCost: number, model: string }}
 */
export function calculateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model];

  if (!pricing) {
    console.warn(`Unknown model pricing: ${model}`);
    return {
      cost: 0,
      inputCost: 0,
      outputCost: 0,
      model,
      warning: 'Unknown model - cost not calculated',
    };
  }

  // Cost in dollars
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cost = inputCost + outputCost;

  return {
    cost: parseFloat(cost.toFixed(6)),
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    model,
  };
}

/**
 * Format cost for display
 *
 * @param {number} cost - Cost in dollars
 * @returns {string} - Formatted cost string
 */
export function formatCost(cost) {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(3)}m`; // Show in millicents for tiny costs
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Estimate tokens for text (rough approximation)
 * Real tokenization depends on the model, this is just an estimate
 *
 * @param {string} text - Text to estimate
 * @returns {number} - Estimated token count
 */
export function estimateTokens(text) {
  if (!text) return 0;

  // Rough estimate: ~4 characters per token on average
  // This varies by model and language, but it's good enough for estimates
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost before making API call
 *
 * @param {string} model - Model name
 * @param {string} inputText - Input text/prompt
 * @param {number} estimatedOutputTokens - Estimated output tokens (default: 500)
 * @returns {{ estimatedCost: number, inputTokens: number, outputTokens: number }}
 */
export function estimateCost(model, inputText, estimatedOutputTokens = 500) {
  const inputTokens = estimateTokens(inputText);
  const { cost } = calculateCost(model, inputTokens, estimatedOutputTokens);

  return {
    estimatedCost: cost,
    inputTokens,
    outputTokens: estimatedOutputTokens,
  };
}

/**
 * Cost tracking for a session or batch of requests
 */
export class CostTracker {
  constructor() {
    this.calls = [];
    this.totalCost = 0;
  }

  /**
   * Track an API call
   *
   * @param {Object} call - Call details
   * @param {string} call.model - Model name
   * @param {number} call.inputTokens - Input token count
   * @param {number} call.outputTokens - Output token count
   * @param {string} call.tier - Tier name (e.g., 'tier1', 'tier2', 'tier3')
   * @param {string} call.operation - Operation type (e.g., 'sql_generation', 'analysis')
   */
  track(call) {
    const cost = calculateCost(call.model, call.inputTokens, call.outputTokens);

    const trackedCall = {
      timestamp: new Date(),
      ...call,
      ...cost,
    };

    this.calls.push(trackedCall);
    this.totalCost += cost.cost;
  }

  /**
   * Get summary statistics
   *
   * @returns {Object} - Summary statistics
   */
  getSummary() {
    if (this.calls.length === 0) {
      return {
        totalCalls: 0,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        averageCost: 0,
        byModel: {},
        byTier: {},
      };
    }

    const summary = {
      totalCalls: this.calls.length,
      totalCost: parseFloat(this.totalCost.toFixed(6)),
      totalInputTokens: this.calls.reduce((sum, c) => sum + c.inputTokens, 0),
      totalOutputTokens: this.calls.reduce((sum, c) => sum + c.outputTokens, 0),
      averageCost: parseFloat((this.totalCost / this.calls.length).toFixed(6)),
      byModel: {},
      byTier: {},
    };

    // Group by model
    for (const call of this.calls) {
      if (!summary.byModel[call.model]) {
        summary.byModel[call.model] = {
          calls: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      summary.byModel[call.model].calls++;
      summary.byModel[call.model].cost += call.cost;
      summary.byModel[call.model].inputTokens += call.inputTokens;
      summary.byModel[call.model].outputTokens += call.outputTokens;
    }

    // Group by tier
    for (const call of this.calls) {
      const tier = call.tier || 'unknown';
      if (!summary.byTier[tier]) {
        summary.byTier[tier] = {
          calls: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      summary.byTier[tier].calls++;
      summary.byTier[tier].cost += call.cost;
      summary.byTier[tier].inputTokens += call.inputTokens;
      summary.byTier[tier].outputTokens += call.outputTokens;
    }

    // Round costs in summaries
    for (const model in summary.byModel) {
      summary.byModel[model].cost = parseFloat(summary.byModel[model].cost.toFixed(6));
    }
    for (const tier in summary.byTier) {
      summary.byTier[tier].cost = parseFloat(summary.byTier[tier].cost.toFixed(6));
    }

    return summary;
  }

  /**
   * Get detailed call history
   *
   * @returns {Array} - Array of tracked calls
   */
  getHistory() {
    return this.calls;
  }

  /**
   * Reset tracker
   */
  reset() {
    this.calls = [];
    this.totalCost = 0;
  }

  /**
   * Export to JSON
   *
   * @returns {string} - JSON string
   */
  toJSON() {
    return JSON.stringify({
      summary: this.getSummary(),
      history: this.calls,
    }, null, 2);
  }
}

/**
 * Example usage:
 *
 * ```javascript
 * const tracker = new CostTracker();
 *
 * // Track Tier 1 call (Haiku)
 * tracker.track({
 *   model: 'anthropic/claude-haiku-4.5',
 *   inputTokens: 250,
 *   outputTokens: 100,
 *   tier: 'tier1',
 *   operation: 'context_query',
 * });
 *
 * // Track Tier 2 call (Haiku SQL + Sonnet analysis)
 * tracker.track({
 *   model: 'anthropic/claude-haiku-4.5',
 *   inputTokens: 500,
 *   outputTokens: 200,
 *   tier: 'tier2',
 *   operation: 'sql_generation',
 * });
 * tracker.track({
 *   model: 'anthropic/claude-sonnet-4.5',
 *   inputTokens: 800,
 *   outputTokens: 600,
 *   tier: 'tier2',
 *   operation: 'analysis',
 * });
 *
 * // Get summary
 * console.log(tracker.getSummary());
 * // {
 * //   totalCalls: 3,
 * //   totalCost: 0.012345,
 * //   byTier: {
 * //     tier1: { calls: 1, cost: 0.000125 },
 * //     tier2: { calls: 2, cost: 0.012220 }
 * //   },
 * //   ...
 * // }
 * ```
 */

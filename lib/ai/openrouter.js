/**
 * OpenRouter Client with Multi-Model Support using Vercel AI SDK
 *
 * Supports:
 * - Claude Haiku 4.5 (SQL generation)
 * - Claude Sonnet 4.5 (primary analysis)
 * - Google Gemini 2.5 Pro (fallback analysis)
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, streamText } from 'ai';

export const MODELS = {
  HAIKU: process.env.OPENROUTER_MODEL_HAIKU || 'anthropic/claude-haiku-4.5',
  SONNET: process.env.OPENROUTER_MODEL_SONNET || 'anthropic/claude-sonnet-4.5',
  GEMINI: process.env.OPENROUTER_MODEL_GEMINI || 'google/gemini-2.5-pro',
};

export const COSTS = {
  [MODELS.HAIKU]: { input: 1, output: 5 },        // per million tokens
  [MODELS.SONNET]: { input: 3, output: 15 },
  [MODELS.GEMINI]: { input: 1.25, output: 5 },   // Gemini pricing
};

class OpenRouterClient {
  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    // Create OpenRouter provider instance
    this.provider = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      headers: {
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'Wizel.ai Marketing Intelligence Platform',
      },
    });

    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Chat completion with automatic fallback support
   */
  async chat({
    model,
    messages,
    tools,
    temperature = 0.7,
    maxTokens = 4096,
    stream = false,
    enableFallback = true,
    fallbackModel = null
  }) {
    const startTime = Date.now();

    try {
      // Get the model instance
      const modelInstance = this.provider(model, {
        usage: {
          include: true, // Enable usage tracking
        },
      });

      let response;

      if (stream) {
        // Use streamText for streaming responses
        response = await streamText({
          model: modelInstance,
          messages,
          tools,
          temperature,
          maxTokens,
        });
      } else {
        // Use generateText for non-streaming responses
        response = await generateText({
          model: modelInstance,
          messages,
          tools,
          temperature,
          maxTokens,
        });
      }

      const duration = Date.now() - startTime;

      // Log usage if available
      if (!stream && response.usage) {
        this.logUsage(model, response.usage, duration);
      }

      return response;

    } catch (error) {
      console.error(`❌ ${model} API Error:`, error.message);

      // If fallback enabled and we have a fallback model, try it
      if (enableFallback && (fallbackModel || this._getDefaultFallback(model))) {
        const fallback = fallbackModel || this._getDefaultFallback(model);
        console.log(`🔄 Falling back to ${fallback}...`);

        try {
          const modelInstance = this.provider(fallback, {
            usage: {
              include: true,
            },
          });

          let response;

          if (stream) {
            response = await streamText({
              model: modelInstance,
              messages,
              tools,
              temperature,
              maxTokens,
            });
          } else {
            response = await generateText({
              model: modelInstance,
              messages,
              tools,
              temperature,
              maxTokens,
            });
          }

          const duration = Date.now() - startTime;

          if (!stream && response.usage) {
            this.logUsage(fallback, response.usage, duration, true);
          }

          return response;

        } catch (fallbackError) {
          console.error(`❌ Fallback ${fallback} also failed:`, fallbackError.message);
          throw new Error(`Both primary (${model}) and fallback (${fallback}) models failed`);
        }
      }

      throw new Error(`OpenRouter Error: ${error.message}`);
    }
  }

  /**
   * Get default fallback model
   */
  _getDefaultFallback(model) {
    const fallbacks = {
      [MODELS.SONNET]: MODELS.GEMINI,  // Sonnet → Gemini
      [MODELS.GEMINI]: MODELS.SONNET,  // Gemini → Sonnet (if Gemini is primary)
    };
    return fallbacks[model] || null;
  }

  /**
   * Log usage and cost
   */
  logUsage(model, usage, duration, isFallback = false) {
    const cost = this.calculateCost(model, usage);
    const prefix = isFallback ? '🔄 [FALLBACK]' : '🤖';

    // Handle both Vercel AI SDK usage format and OpenAI format
    const totalTokens = usage.totalTokens || usage.total_tokens || 0;

    console.log(
      `${prefix} [${model}] Tokens: ${totalTokens} | Cost: $${cost.toFixed(4)} | Time: ${duration}ms`
    );

    // Log OpenRouter-specific usage if available
    if (usage.providerMetadata?.openrouter) {
      const orUsage = usage.providerMetadata.openrouter;
      console.log(`  💰 OpenRouter Cost: $${orUsage.cost || 0}`);
    }
  }

  /**
   * Calculate cost based on model and token usage
   */
  calculateCost(model, usage) {
    const pricing = COSTS[model];
    if (!pricing) return 0;

    // Handle both Vercel AI SDK and OpenAI token formats
    const promptTokens = usage.promptTokens || usage.prompt_tokens || 0;
    const completionTokens = usage.completionTokens || usage.completion_tokens || 0;

    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }
}

export const openrouter = new OpenRouterClient();

/**
 * Legacy compatibility function for existing code
 * Wraps the new Vercel AI SDK-based client
 */
export async function makeOpenRouterRequest({
  model,
  messages,
  temperature = 0.7,
  max_tokens = 4096,
  tools = undefined,
  stream = false
}) {
  try {
    const response = await openrouter.chat({
      model,
      messages,
      temperature,
      maxTokens: max_tokens, // Convert max_tokens to maxTokens
      tools,
      stream,
      enableFallback: false // Legacy function doesn't use fallback
    });

    // Return in the expected format for legacy code
    if (stream) {
      return response; // Return the stream directly
    }

    // For non-streaming, extract the content
    return {
      content: response.text,
      usage: response.usage,
      model: model
    };

  } catch (error) {
    console.error('makeOpenRouterRequest error:', error);
    throw error;
  }
}

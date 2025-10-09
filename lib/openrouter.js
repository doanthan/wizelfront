/**
 * OpenRouter API Helper Library
 *
 * Provides unified interface for text and image generation using OpenRouter API
 * Supports Claude, OpenAI, Gemini, and image generation models
 *
 * @docs https://openrouter.ai/docs/api-reference
 */

// Model configurations with their specific capabilities
// Updated: January 2025 with latest models
const MODELS = {
  // Claude models (Anthropic) - Best for nuanced, thoughtful responses
  CLAUDE: {
    // Claude 4.5 series (Latest - Recommended)
    SONNET_4_5: 'anthropic/claude-sonnet-4.5',          // Claude Sonnet 4.5 (RECOMMENDED - Best balance)

    // Claude 4 series
    OPUS_4_1: 'anthropic/claude-opus-4.1',              // Claude Opus 4.1 (latest)
    OPUS_4: 'anthropic/claude-opus-4',                  // Claude Opus 4.0
    SONNET_4: 'anthropic/claude-sonnet-4',              // Claude Sonnet 4.0

    // Claude 3.x series
    SONNET_3_7: 'anthropic/claude-3.7-sonnet',          // Claude 3.7 Sonnet
    SONNET_3_5: 'anthropic/claude-3.5-sonnet',          // Claude 3.5 Sonnet (widely used)
    HAIKU_3_5: 'anthropic/claude-3.5-haiku',            // Claude 3.5 Haiku (fast)
    OPUS_3: 'anthropic/claude-3-opus',                  // Claude 3 Opus (powerful)
    HAIKU_3: 'anthropic/claude-3-haiku',                // Claude 3 Haiku

    // Legacy models
    CLAUDE_2_1: 'anthropic/claude-2.1',
    CLAUDE_2: 'anthropic/claude-2',
    INSTANT: 'anthropic/claude-instant-1.2'
  },

  // OpenAI models - Industry standard, great for general tasks
  OPENAI: {
    // GPT-4o series (Omni - Latest flagship)
    GPT_4O: 'openai/gpt-4o',                           // GPT-4o (latest omni model)
    GPT_4O_MINI: 'openai/gpt-4o-mini',                 // GPT-4o mini (efficient)

    // GPT-4 series
    GPT_4_TURBO: 'openai/gpt-4-turbo',                 // GPT-4 Turbo (128k context)
    GPT_4_TURBO_PREVIEW: 'openai/gpt-4-turbo-preview', // GPT-4 Turbo Preview
    GPT_4: 'openai/gpt-4',                             // GPT-4 base
    GPT_4_32K: 'openai/gpt-4-32k',                     // GPT-4 with 32k context

    // GPT-3.5 series
    GPT_3_5_TURBO: 'openai/gpt-3.5-turbo',             // GPT-3.5 Turbo (fast, cheap)
    GPT_3_5_TURBO_16K: 'openai/gpt-3.5-turbo-16k',     // GPT-3.5 Turbo 16k context

    // O1 reasoning models
    O1_PREVIEW: 'openai/o1-preview',                   // O1 Preview (advanced reasoning)
    O1_MINI: 'openai/o1-mini'                          // O1 Mini (faster reasoning)
  },

  // Google Gemini models - Strong multimodal capabilities
  GEMINI: {
    // Gemini 2.5 series (Latest - January 2025)
    PRO_2_5: 'google/gemini-2.5-pro',                  // Gemini 2.5 Pro (RECOMMENDED - Most powerful)
    FLASH_2_5_IMAGE: 'google/gemini-2.5-flash-image',  // Gemini 2.5 Flash Image (RECOMMENDED - Vision)
    FLASH_2_5: 'google/gemini-2.5-flash',              // Gemini 2.5 Flash (Fast & efficient)

    // Gemini 2.0 series (December 2024/January 2025)
    FLASH_2_0: 'google/gemini-2.0-flash',              // Gemini 2.0 Flash (fast, efficient)
    FLASH_2_0_EXP: 'google/gemini-2.0-flash-exp',      // Gemini 2.0 Flash Experimental

    // Gemini 1.5 series (Stable)
    PRO_1_5: 'google/gemini-pro-1.5',                  // Gemini 1.5 Pro (powerful)
    PRO_1_5_LATEST: 'google/gemini-1.5-pro-latest',    // Gemini 1.5 Pro Latest
    FLASH_1_5: 'google/gemini-flash-1.5',              // Gemini 1.5 Flash (fast)
    FLASH_1_5_LATEST: 'google/gemini-1.5-flash-latest',// Gemini 1.5 Flash Latest

    // Gemini 1.0 series
    PRO: 'google/gemini-pro',                          // Gemini Pro base
    PRO_VISION: 'google/gemini-pro-vision',            // Gemini Pro with vision

    // Experimental/Preview models (2.5 series)
    FLASH_2_5_IMAGE_PREVIEW: 'google/gemini-2.5-flash-image-preview', // Gemini 2.5 Flash Image Preview
    FLASH_2_5_PREVIEW: 'google/gemini-2.5-flash-preview',             // Gemini 2.5 Flash Preview
    PRO_2_5_PREVIEW: 'google/gemini-2.5-pro-preview',                 // Gemini 2.5 Pro Preview
    ULTRA: 'google/gemini-ultra'                       // Gemini Ultra (if available)
  },

  // Image generation models
  IMAGE: {
    DALL_E_3: 'openai/dall-e-3',                       // DALL-E 3 (highest quality)
    DALL_E_2: 'openai/dall-e-2',                       // DALL-E 2
    STABLE_DIFFUSION_XL: 'stability-ai/sdxl',          // Stable Diffusion XL
    STABLE_DIFFUSION_3: 'stability-ai/stable-diffusion-3', // SD3 (if available)
    MIDJOURNEY: 'midjourney/midjourney',               // Midjourney (if available)
  },

  // Meta Llama models - Open source, powerful
  META: {
    LLAMA_3_1_405B: 'meta-llama/llama-3.1-405b',       // Llama 3.1 405B (largest)
    LLAMA_3_1_70B: 'meta-llama/llama-3.1-70b',         // Llama 3.1 70B
    LLAMA_3_1_8B: 'meta-llama/llama-3.1-8b',           // Llama 3.1 8B
    LLAMA_3_70B: 'meta-llama/llama-3-70b',             // Llama 3 70B
    LLAMA_3_8B: 'meta-llama/llama-3-8b',               // Llama 3 8B
  },

  // Mistral models - Efficient and cost-effective
  MISTRAL: {
    LARGE_2: 'mistralai/mistral-large-2',              // Mistral Large 2 (latest)
    LARGE: 'mistralai/mistral-large',                  // Mistral Large
    MEDIUM: 'mistralai/mistral-medium',                // Mistral Medium
    SMALL: 'mistralai/mistral-small',                  // Mistral Small
    MIXTRAL_8X22B: 'mistralai/mixtral-8x22b',          // Mixtral 8x22B
    MIXTRAL_8X7B: 'mistralai/mixtral-8x7b',            // Mixtral 8x7B
    CODESTRAL: 'mistralai/codestral'                   // Codestral (code-focused)
  }
};

// Default configuration
const DEFAULT_CONFIG = {
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  stream: false
};

/**
 * OpenRouter API Client Class
 */
class OpenRouterClient {
  constructor(apiKey = process.env.OPENROUTER_API_KEY) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY in your .env file');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'Wizel Dashboard'
    };
  }

  /**
   * Generate text completion using specified model
   *
   * @param {string} prompt - The prompt or message to send
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Response from OpenRouter API
   */
  async generateText(prompt, options = {}) {
    const {
      model = MODELS.OPENAI.GPT_3_5_TURBO,
      messages = null,
      temperature = DEFAULT_CONFIG.temperature,
      max_tokens = DEFAULT_CONFIG.max_tokens,
      top_p = DEFAULT_CONFIG.top_p,
      frequency_penalty = DEFAULT_CONFIG.frequency_penalty,
      presence_penalty = DEFAULT_CONFIG.presence_penalty,
      stream = DEFAULT_CONFIG.stream,
      system = null,
      ...additionalOptions
    } = options;

    try {
      // Prepare messages array
      let messageArray = messages;

      if (!messageArray) {
        messageArray = [];

        // Add system message if provided
        if (system) {
          messageArray.push({ role: 'system', content: system });
        }

        // Add user message
        messageArray.push({ role: 'user', content: prompt });
      }

      const requestBody = {
        model,
        messages: messageArray,
        temperature,
        max_tokens,
        top_p,
        frequency_penalty,
        presence_penalty,
        stream,
        ...additionalOptions
      };

      console.log('📤 OpenRouter request:', {
        model,
        messageCount: messageArray.length,
        temperature,
        max_tokens
      });

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`OpenRouter API error: ${error.error?.message || error.error || response.statusText}`);
      }

      const data = await response.json();

      console.log('✅ OpenRouter response:', {
        model: data.model,
        usage: data.usage,
        finishReason: data.choices?.[0]?.finish_reason
      });

      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        raw: data
      };

    } catch (error) {
      console.error('❌ OpenRouter API error:', error);
      throw error;
    }
  }

  /**
   * Generate text using Claude models
   *
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Response from Claude model
   */
  async generateWithClaude(prompt, options = {}) {
    const defaultModel = options.model || MODELS.CLAUDE.SONNET_4_5;  // Updated to Sonnet 4.5 (recommended)

    return this.generateText(prompt, {
      ...options,
      model: defaultModel,
      // Claude-specific optimizations
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096
    });
  }

  /**
   * Generate text using OpenAI models
   *
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Response from OpenAI model
   */
  async generateWithOpenAI(prompt, options = {}) {
    const defaultModel = options.model || MODELS.OPENAI.GPT_4O;  // Updated to latest GPT-4o

    return this.generateText(prompt, {
      ...options,
      model: defaultModel,
      // OpenAI-specific optimizations
      temperature: options.temperature ?? 0.8,
      max_tokens: options.max_tokens ?? 2048
    });
  }

  /**
   * Generate text using Gemini models
   *
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Response from Gemini model
   */
  async generateWithGemini(prompt, options = {}) {
    const defaultModel = options.model || MODELS.GEMINI.FLASH_2_5;  // Updated to latest Gemini 2.5 Flash

    return this.generateText(prompt, {
      ...options,
      model: defaultModel,
      // Gemini-specific optimizations
      temperature: options.temperature ?? 0.9,
      max_tokens: options.max_tokens ?? 2048
    });
  }

  /**
   * Generate image using image generation models
   *
   * @param {string} prompt - The image generation prompt
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} - Response with image data
   */
  async generateImage(prompt, options = {}) {
    const {
      model = MODELS.IMAGE.DALL_E_3,
      size = '1024x1024',
      quality = 'standard',
      n = 1,
      style = 'natural',
      ...additionalOptions
    } = options;

    try {
      console.log('🎨 OpenRouter image generation request:', {
        model,
        size,
        quality,
        promptLength: prompt.length
      });

      // For DALL-E models, use the images endpoint
      if (model.includes('dall-e')) {
        const requestBody = {
          model,
          prompt,
          size,
          quality,
          n,
          style,
          ...additionalOptions
        };

        const response = await fetch(`${this.baseURL}/images/generations`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(`OpenRouter Image API error: ${error.error?.message || error.error || response.statusText}`);
        }

        const data = await response.json();

        console.log('✅ OpenRouter image response:', {
          model,
          imageCount: data.data?.length || 0
        });

        return {
          images: data.data || [],
          model,
          raw: data
        };
      } else {
        // For other models, use the chat completions endpoint with image generation prompt
        const result = await this.generateText(
          `Generate an image with the following description: ${prompt}`,
          {
            model,
            max_tokens: 1024,
            ...additionalOptions
          }
        );

        return {
          content: result.content,
          model,
          raw: result.raw
        };
      }

    } catch (error) {
      console.error('❌ OpenRouter Image API error:', error);
      throw error;
    }
  }

  /**
   * Stream text generation response
   *
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Configuration options
   * @param {Function} onChunk - Callback for each chunk received
   * @returns {Promise<string>} - Complete response text
   */
  async streamText(prompt, options = {}, onChunk = () => {}) {
    const streamOptions = {
      ...options,
      stream: true
    };

    try {
      const messages = options.messages || [{ role: 'user', content: prompt }];

      if (options.system && !options.messages) {
        messages.unshift({ role: 'system', content: options.system });
      }

      const requestBody = {
        model: options.model || MODELS.OPENAI.GPT_3_5_TURBO,
        messages,
        temperature: options.temperature ?? DEFAULT_CONFIG.temperature,
        max_tokens: options.max_tokens ?? DEFAULT_CONFIG.max_tokens,
        stream: true
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`OpenRouter Stream API error: ${error.error?.message || error.error || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                fullContent += content;
                onChunk(content, fullContent);
              }
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      return fullContent;

    } catch (error) {
      console.error('❌ OpenRouter Stream error:', error);
      throw error;
    }
  }

  /**
   * Get available models from OpenRouter
   *
   * @returns {Promise<Array>} - List of available models
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('❌ Failed to fetch OpenRouter models:', error);
      throw error;
    }
  }

  /**
   * Get model pricing and details
   *
   * @param {string} modelId - The model ID to get details for
   * @returns {Promise<Object>} - Model details including pricing
   */
  async getModelDetails(modelId) {
    try {
      const models = await this.getAvailableModels();
      return models.find(m => m.id === modelId) || null;

    } catch (error) {
      console.error('❌ Failed to fetch model details:', error);
      throw error;
    }
  }
}

// Export singleton instance and class
let clientInstance = null;

/**
 * Get or create OpenRouter client instance
 *
 * @param {string} apiKey - Optional API key (uses env variable if not provided)
 * @returns {OpenRouterClient} - OpenRouter client instance
 */
export function getOpenRouterClient(apiKey) {
  if (!clientInstance || apiKey) {
    clientInstance = new OpenRouterClient(apiKey);
  }
  return clientInstance;
}

// Export models configuration
export { MODELS };

// Export convenience functions
export async function generateText(prompt, options = {}) {
  const client = getOpenRouterClient();
  return client.generateText(prompt, options);
}

export async function generateWithClaude(prompt, options = {}) {
  const client = getOpenRouterClient();
  return client.generateWithClaude(prompt, options);
}

export async function generateWithOpenAI(prompt, options = {}) {
  const client = getOpenRouterClient();
  return client.generateWithOpenAI(prompt, options);
}

export async function generateWithGemini(prompt, options = {}) {
  const client = getOpenRouterClient();
  return client.generateWithGemini(prompt, options);
}

export async function generateImage(prompt, options = {}) {
  const client = getOpenRouterClient();
  return client.generateImage(prompt, options);
}

export async function streamText(prompt, options = {}, onChunk) {
  const client = getOpenRouterClient();
  return client.streamText(prompt, options, onChunk);
}

// Export default client
export default OpenRouterClient;
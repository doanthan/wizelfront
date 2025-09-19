/**
 * OpenRouter API Usage Examples
 *
 * Before using, make sure to set OPENROUTER_API_KEY in your .env file
 * Get your API key from: https://openrouter.ai/keys
 */

import {
  generateText,
  generateWithClaude,
  generateWithOpenAI,
  generateWithGemini,
  generateImage,
  streamText,
  getOpenRouterClient,
  MODELS
} from './openrouter';

// ===========================================
// BASIC TEXT GENERATION EXAMPLES
// ===========================================

/**
 * Example 1: Simple text generation with default model
 */
async function basicTextGeneration() {
  try {
    const result = await generateText('What is the capital of France?');
    console.log('Response:', result.content);
    console.log('Tokens used:', result.usage);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 2: Generate with Claude (Anthropic)
 */
async function generateWithClaudeExample() {
  try {
    const result = await generateWithClaude(
      'Write a haiku about coding',
      {
        model: MODELS.CLAUDE.SONNET_3_5, // Optional: specify exact model
        temperature: 0.9,
        max_tokens: 100
      }
    );
    console.log('Claude says:', result.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Generate with OpenAI GPT-4
 */
async function generateWithGPT4Example() {
  try {
    const result = await generateWithOpenAI(
      'Explain quantum computing in simple terms',
      {
        model: MODELS.OPENAI.GPT_4_TURBO,
        temperature: 0.7,
        max_tokens: 500
      }
    );
    console.log('GPT-4 explains:', result.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Generate with Google Gemini
 */
async function generateWithGeminiExample() {
  try {
    const result = await generateWithGemini(
      'Create a recipe for chocolate chip cookies',
      {
        model: MODELS.GEMINI.PRO,
        temperature: 0.8
      }
    );
    console.log('Gemini recipe:', result.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===========================================
// ADVANCED EXAMPLES
// ===========================================

/**
 * Example 5: Multi-turn conversation
 */
async function conversationExample() {
  try {
    const messages = [
      { role: 'system', content: 'You are a helpful marketing assistant.' },
      { role: 'user', content: 'I need help with an email campaign' },
      { role: 'assistant', content: 'I\'d be happy to help with your email campaign! What type of campaign are you planning?' },
      { role: 'user', content: 'A Black Friday promotion for our e-commerce store' }
    ];

    const result = await generateText(null, {
      messages,
      model: MODELS.CLAUDE.SONNET_3_5,
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('Assistant response:', result.content);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 6: Streaming response
 */
async function streamingExample() {
  try {
    console.log('Streaming response:');

    const fullResponse = await streamText(
      'Write a short story about a robot learning to paint',
      {
        model: MODELS.OPENAI.GPT_4_TURBO,
        temperature: 0.9
      },
      (chunk, fullText) => {
        // This callback is called for each chunk received
        process.stdout.write(chunk); // Print each chunk as it arrives
      }
    );

    console.log('\n\nFull response:', fullResponse);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 7: Image generation with DALL-E 3
 */
async function imageGenerationExample() {
  try {
    const result = await generateImage(
      'A futuristic city with flying cars and neon lights at sunset, cyberpunk style',
      {
        model: MODELS.IMAGE.DALL_E_3,
        size: '1024x1024',
        quality: 'hd',
        n: 1
      }
    );

    console.log('Generated images:', result.images);
    // Each image object contains: { url: 'https://...', revised_prompt: '...' }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===========================================
// PRACTICAL USE CASES
// ===========================================

/**
 * Example 8: Generate marketing copy
 */
async function generateMarketingCopy() {
  const client = getOpenRouterClient();

  try {
    const result = await client.generateText(
      'Create compelling ad copy for our new organic coffee subscription service',
      {
        model: MODELS.CLAUDE.SONNET_3_5,
        system: 'You are an expert copywriter specializing in subscription services. Create engaging, conversion-focused copy.',
        temperature: 0.8,
        max_tokens: 500
      }
    );

    return result.content;
  } catch (error) {
    console.error('Error generating marketing copy:', error);
    throw error;
  }
}

/**
 * Example 9: Analyze campaign performance
 */
async function analyzeCampaignData(campaignData) {
  try {
    const prompt = `
      Analyze the following email campaign performance data and provide insights:

      ${JSON.stringify(campaignData, null, 2)}

      Please provide:
      1. Key performance indicators analysis
      2. Strengths and weaknesses
      3. Actionable recommendations for improvement
    `;

    const result = await generateWithClaude(prompt, {
      model: MODELS.CLAUDE.OPUS_3,
      temperature: 0.3, // Lower temperature for analytical tasks
      max_tokens: 1500
    });

    return result.content;
  } catch (error) {
    console.error('Error analyzing campaign:', error);
    throw error;
  }
}

/**
 * Example 10: Generate email subject lines
 */
async function generateEmailSubjectLines(productDescription, targetAudience) {
  try {
    const prompt = `
      Generate 10 compelling email subject lines for:
      Product: ${productDescription}
      Target Audience: ${targetAudience}

      Focus on high open rates and include variety (questions, urgency, personalization, etc.)
    `;

    const result = await generateText(prompt, {
      model: MODELS.OPENAI.GPT_4_TURBO,
      temperature: 0.9,
      max_tokens: 500
    });

    // Parse the response to extract subject lines
    const lines = result.content.split('\n').filter(line => line.trim());
    return lines;
  } catch (error) {
    console.error('Error generating subject lines:', error);
    throw error;
  }
}

/**
 * Example 11: Get available models and their pricing
 */
async function checkAvailableModels() {
  const client = getOpenRouterClient();

  try {
    const models = await client.getAvailableModels();

    console.log('Available models:');
    models.forEach(model => {
      console.log(`- ${model.id}`);
      console.log(`  Context: ${model.context_length} tokens`);
      console.log(`  Pricing: $${model.pricing.prompt}/1K prompt, $${model.pricing.completion}/1K completion`);
    });
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

// ===========================================
// ERROR HANDLING
// ===========================================

/**
 * Example 12: Comprehensive error handling
 */
async function robustGeneration() {
  try {
    const result = await generateText('Tell me a joke', {
      model: MODELS.OPENAI.GPT_3_5_TURBO,
      temperature: 0.9,
      max_tokens: 100
    });

    return result.content;
  } catch (error) {
    // Handle different error types
    if (error.message.includes('API key')) {
      console.error('API key not configured. Please set OPENROUTER_API_KEY in .env');
    } else if (error.message.includes('rate limit')) {
      console.error('Rate limit exceeded. Please wait and try again.');
    } else if (error.message.includes('model not found')) {
      console.error('Model not available. Please check model ID.');
    } else {
      console.error('Unexpected error:', error);
    }

    // Return fallback or throw
    return null;
  }
}

// ===========================================
// EXPORT EXAMPLES FOR USE IN YOUR APP
// ===========================================

export {
  basicTextGeneration,
  generateWithClaudeExample,
  generateWithGPT4Example,
  generateWithGeminiExample,
  conversationExample,
  streamingExample,
  imageGenerationExample,
  generateMarketingCopy,
  analyzeCampaignData,
  generateEmailSubjectLines,
  checkAvailableModels,
  robustGeneration
};

// ===========================================
// RUN EXAMPLES (if executed directly)
// ===========================================

if (require.main === module) {
  console.log('Running OpenRouter examples...\n');

  // Uncomment to run examples
  // basicTextGeneration();
  // generateWithClaudeExample();
  // streamingExample();
  // imageGenerationExample();
  // checkAvailableModels();
}
# OpenRouter API Guide

Comprehensive guide for using OpenRouter's unified AI API in the Wizel application.

## Table of Contents

- [Quick Start](#quick-start)
- [Recommended Models](#recommended-models)
- [Helper Methods Reference](#helper-methods-reference)
- [Model Specifications](#model-specifications)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Pricing & Usage](#pricing--usage)

---

## Quick Start

### Setup

1. **Add API Key to Environment Variables**

```bash
# .env.local
OPENROUTER_API_KEY=sk_or_v1_xxxxxxxxxxxxxxxxxxxxx
```

2. **Import the Helper Library**

```javascript
import {
  getOpenRouterClient,
  generateWithClaude,
  generateWithGemini,
  MODELS
} from '@/lib/openrouter';
```

3. **Make Your First Request**

```javascript
// Simple text generation
const response = await generateWithClaude('What is the capital of France?');
console.log(response.content); // "Paris is the capital of France..."
```

---

## Recommended Models

Based on your requirements, here are the **three recommended models**:

### 1. **Claude Sonnet 4.5** (`anthropic/claude-sonnet-4.5`)

**Best for**: Complex reasoning, extended thinking, code generation, analysis

```javascript
import { generateWithClaude, MODELS } from '@/lib/openrouter';

const response = await generateWithClaude('Explain quantum computing in simple terms', {
  model: MODELS.CLAUDE.SONNET_4_5,
  max_tokens: 4096,
  temperature: 0.7
});

console.log(response.content);
```

**Key Features:**
- ✅ Extended reasoning capabilities
- ✅ Excellent code generation
- ✅ Strong analytical thinking
- ✅ Large context window (200K tokens)
- ✅ Supports reasoning with `effort` parameter

**Pricing:** ~$3/1M prompt tokens, ~$15/1M completion tokens

---

### 2. **Gemini 2.5 Pro** (`google/gemini-2.5-pro`)

**Best for**: Multimodal tasks, long context, fast responses, JSON output

```javascript
import { generateWithGemini, MODELS } from '@/lib/openrouter';

// Text generation with JSON output
const response = await generateWithGemini('List 5 colors with hex codes', {
  model: MODELS.GEMINI.PRO_2_5,
  response_format: { type: 'json_object' },
  max_tokens: 2048
});

console.log(JSON.parse(response.content));
```

**Key Features:**
- ✅ Very long context (2M tokens)
- ✅ Multimodal (text + images)
- ✅ Fast inference
- ✅ Structured output support
- ✅ Cost-effective

**Pricing:** ~$1.25/1M prompt tokens, ~$5/1M completion tokens

---

### 3. **Gemini 2.5 Flash Image** (`google/gemini-2.5-flash-image`)

**Best for**: Vision tasks, image analysis, OCR, visual understanding

```javascript
import { getOpenRouterClient, MODELS } from '@/lib/openrouter';

const client = getOpenRouterClient();

// Analyze an image
const response = await client.generateText(
  'Describe this image in detail',
  {
    model: MODELS.GEMINI.FLASH_2_5_IMAGE,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe this image in detail'
          },
          {
            type: 'image_url',
            image_url: {
              url: 'https://example.com/image.jpg',
              detail: 'high'
            }
          }
        ]
      }
    ]
  }
);

console.log(response.content);
```

**Key Features:**
- ✅ Vision + language understanding
- ✅ Image analysis and OCR
- ✅ Fast inference (Flash model)
- ✅ Cost-effective for vision tasks
- ✅ Supports multiple images per request

**Pricing:** ~$0.075/1M prompt tokens, ~$0.30/1M completion tokens

---

## Helper Methods Reference

### Basic Text Generation

#### `generateText(prompt, options)`

The core method for all text generation.

```javascript
import { generateText, MODELS } from '@/lib/openrouter';

const response = await generateText('Write a haiku about coding', {
  model: MODELS.CLAUDE.SONNET_4_5,
  temperature: 0.9,
  max_tokens: 200,
  system: 'You are a creative poet.'
});

console.log(response.content);
console.log('Tokens used:', response.usage);
```

**Options:**
- `model` (string): Model identifier from `MODELS` constant
- `temperature` (number, 0-2): Randomness (0 = deterministic, 2 = very creative)
- `max_tokens` (number): Maximum tokens to generate
- `system` (string): System message to set behavior
- `messages` (array): For multi-turn conversations
- `top_p` (number, 0-1): Nucleus sampling
- `frequency_penalty` (number): Reduce repetition
- `presence_penalty` (number): Encourage new topics

---

### Provider-Specific Methods

#### `generateWithClaude(prompt, options)`

Optimized for Claude models with intelligent defaults.

```javascript
import { generateWithClaude, MODELS } from '@/lib/openrouter';

// Uses Claude Sonnet 4.5 by default
const response = await generateWithClaude('Explain async/await in JavaScript');

// Or specify a different Claude model
const responseHaiku = await generateWithClaude('Quick summary of React hooks', {
  model: MODELS.CLAUDE.HAIKU_3_5,  // Faster, cheaper
  max_tokens: 500
});
```

**Default Settings:**
- Model: `CLAUDE.SONNET_4_5`
- Temperature: `0.7`
- Max Tokens: `4096`

---

#### `generateWithGemini(prompt, options)`

Optimized for Gemini models with intelligent defaults.

```javascript
import { generateWithGemini, MODELS } from '@/lib/openrouter';

// Uses Gemini 2.5 Flash by default
const response = await generateWithGemini('Summarize this article...');

// Use Pro model for more complex tasks
const complexResponse = await generateWithGemini('Analyze this codebase structure', {
  model: MODELS.GEMINI.PRO_2_5,
  max_tokens: 8000
});
```

**Default Settings:**
- Model: `MODELS.GEMINI.FLASH_2_5`
- Temperature: `0.9`
- Max Tokens: `2048`

---

#### `generateWithOpenAI(prompt, options)`

Optimized for OpenAI models.

```javascript
import { generateWithOpenAI, MODELS } from '@/lib/openrouter';

// Uses GPT-4o by default
const response = await generateWithOpenAI('Write a product description for a smartwatch');

// Use GPT-3.5 for faster, cheaper responses
const quickResponse = await generateWithOpenAI('Translate to Spanish: Hello world', {
  model: MODELS.OPENAI.GPT_3_5_TURBO
});
```

**Default Settings:**
- Model: `MODELS.OPENAI.GPT_4O`
- Temperature: `0.8`
- Max Tokens: `2048`

---

### Streaming Responses

#### `streamText(prompt, options, onChunk)`

Stream responses token-by-token for real-time UX.

```javascript
import { getOpenRouterClient, MODELS } from '@/lib/openrouter';

const client = getOpenRouterClient();

let fullResponse = '';

await client.streamText(
  'Write a long story about a space adventure',
  {
    model: MODELS.CLAUDE.SONNET_4_5,
    max_tokens: 4000
  },
  (chunk, accumulated) => {
    process.stdout.write(chunk); // Print each chunk as it arrives
    fullResponse = accumulated; // Get full response so far
  }
);

console.log('\n\nFinal response:', fullResponse);
```

**Use Cases:**
- ✅ Chat interfaces
- ✅ Real-time content generation
- ✅ Long-form writing
- ✅ Better user experience for slow requests

---

### Image Generation

#### `generateImage(prompt, options)`

Generate images using DALL-E or other image models.

```javascript
import { generateImage, MODELS } from '@/lib/openrouter';

const response = await generateImage(
  'A futuristic cityscape at sunset with flying cars',
  {
    model: MODELS.IMAGE.DALL_E_3,
    size: '1024x1024',
    quality: 'hd',
    style: 'vivid'
  }
);

console.log('Image URL:', response.images[0].url);
```

**Options:**
- `size`: `'256x256'`, `'512x512'`, `'1024x1024'`, `'1792x1024'`, `'1024x1792'`
- `quality`: `'standard'` or `'hd'`
- `style`: `'natural'` or `'vivid'`
- `n`: Number of images to generate (1-10)

---

### Multi-Turn Conversations

Build context across multiple messages.

```javascript
import { generateText, MODELS } from '@/lib/openrouter';

const messages = [
  {
    role: 'system',
    content: 'You are a helpful coding assistant.'
  },
  {
    role: 'user',
    content: 'How do I create a React component?'
  },
  {
    role: 'assistant',
    content: 'To create a React component, you can use...'
  },
  {
    role: 'user',
    content: 'Can you show me an example with hooks?'
  }
];

const response = await generateText('', {
  model: MODELS.CLAUDE.SONNET_4_5,
  messages
});

console.log(response.content);
```

---

### Vision/Image Analysis

Analyze images with vision models.

```javascript
import { getOpenRouterClient, MODELS } from '@/lib/openrouter';

const client = getOpenRouterClient();

// Single image analysis
const response = await client.generateText('What objects are in this image?', {
  model: MODELS.GEMINI.FLASH_2_5_IMAGE,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What objects are in this image?' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://example.com/photo.jpg',
            detail: 'high' // or 'low', 'auto'
          }
        }
      ]
    }
  ]
});

console.log(response.content);

// Multiple images
const multiImageResponse = await client.generateText('Compare these two images', {
  model: MODELS.GEMINI.FLASH_2_5_IMAGE,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Compare these two images' },
        { type: 'image_url', image_url: { url: 'https://example.com/image1.jpg' } },
        { type: 'image_url', image_url: { url: 'https://example.com/image2.jpg' } }
      ]
    }
  ]
});
```

**Supported Image Formats:**
- URLs: `https://...` or `http://...`
- Base64 data URIs: `data:image/jpeg;base64,...`
- Supported types: JPEG, PNG, GIF, WebP

---

## Model Specifications

### Claude Sonnet 4.5

| Feature | Specification |
|---------|---------------|
| **Model ID** | `anthropic/claude-sonnet-4.5` |
| **Context Window** | 200,000 tokens |
| **Max Output** | 4,096 tokens |
| **Strengths** | Reasoning, code, analysis, extended thinking |
| **Weaknesses** | Higher cost, slower than Flash models |
| **Best For** | Complex tasks requiring deep analysis |

**Example Use Cases:**
- Code review and debugging
- Research paper analysis
- Complex data analysis
- Strategic planning
- Technical writing

```javascript
// Extended reasoning example
import { generateWithClaude, MODELS } from '@/lib/openrouter';

const response = await generateWithClaude(
  'Design a distributed system architecture for a social media platform with 100M users',
  {
    model: MODELS.CLAUDE.SONNET_4_5,
    max_tokens: 4096,
    temperature: 0.7
  }
);
```

---

### Gemini 2.5 Pro

| Feature | Specification |
|---------|---------------|
| **Model ID** | `google/gemini-2.5-pro` |
| **Context Window** | 2,000,000 tokens |
| **Max Output** | 8,192 tokens |
| **Strengths** | Long context, multimodal, speed, JSON output |
| **Weaknesses** | Sometimes less nuanced than Claude |
| **Best For** | Large documents, multimodal tasks, structured output |

**Example Use Cases:**
- Document summarization
- Data extraction
- Structured data generation
- Long context analysis
- Multimodal understanding

```javascript
// Structured JSON output example
import { generateWithGemini, MODELS } from '@/lib/openrouter';

const response = await generateWithGemini(
  'Extract product information from this text and return as JSON',
  {
    model: MODELS.GEMINI.PRO_2_5,
    response_format: { type: 'json_object' },
    max_tokens: 2048
  }
);

const productData = JSON.parse(response.content);
```

---

### Gemini 2.5 Flash Image

| Feature | Specification |
|---------|---------------|
| **Model ID** | `google/gemini-2.5-flash-image` |
| **Context Window** | 1,000,000 tokens |
| **Max Output** | 8,192 tokens |
| **Strengths** | Vision, speed, cost-effective, OCR |
| **Weaknesses** | Less powerful than Pro for text-only |
| **Best For** | Image analysis, OCR, visual understanding |

**Example Use Cases:**
- Product image analysis
- OCR for documents
- Visual content moderation
- Image captioning
- Design feedback

```javascript
// OCR example
import { getOpenRouterClient, MODELS } from '@/lib/openrouter';

const client = getOpenRouterClient();

const response = await client.generateText('Extract all text from this image', {
  model: MODELS.GEMINI.FLASH_2_5_IMAGE,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Extract all text from this image' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/document.jpg' }
        }
      ]
    }
  ]
});

console.log('Extracted text:', response.content);
```

---

## Advanced Features

### Usage Tracking

Track token usage and costs for all requests.

```javascript
import { generateWithClaude } from '@/lib/openrouter';

const response = await generateWithClaude('Explain machine learning');

console.log('Usage:', {
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  total_tokens: response.usage.total_tokens
});

// Calculate approximate cost
const promptCost = (response.usage.prompt_tokens / 1_000_000) * 3.00;  // $3/1M tokens
const completionCost = (response.usage.completion_tokens / 1_000_000) * 15.00;  // $15/1M tokens
const totalCost = promptCost + completionCost;

console.log(`Estimated cost: $${totalCost.toFixed(4)}`);
```

---

### Temperature Control

Control creativity vs consistency.

```javascript
// Deterministic output (good for code, data extraction)
const factual = await generateWithClaude('What is 2+2?', {
  temperature: 0
});

// Balanced (good for general use)
const balanced = await generateWithClaude('Write a product description', {
  temperature: 0.7
});

// Creative (good for content creation, brainstorming)
const creative = await generateWithClaude('Write a creative story', {
  temperature: 1.5
});
```

**Temperature Guidelines:**
- `0.0 - 0.3`: Factual, deterministic (code, math, data)
- `0.4 - 0.7`: Balanced (general use)
- `0.8 - 1.2`: Creative (writing, brainstorming)
- `1.3 - 2.0`: Very creative (experimental, artistic)

---

### Error Handling

```javascript
import { generateWithClaude } from '@/lib/openrouter';

try {
  const response = await generateWithClaude('Your prompt', {
    max_tokens: 4000
  });

  console.log(response.content);

} catch (error) {
  if (error.message.includes('rate limit')) {
    console.error('Rate limit exceeded. Please try again later.');
  } else if (error.message.includes('insufficient credits')) {
    console.error('Insufficient OpenRouter credits.');
  } else {
    console.error('OpenRouter error:', error.message);
  }
}
```

---

### Response Caching (Pro Tip)

For repeated queries with same context, use semantic caching:

```javascript
// Cache key generation
function getCacheKey(prompt, model) {
  return `openrouter:${model}:${prompt.substring(0, 100)}`;
}

// Check cache before making request
const cacheKey = getCacheKey(prompt, model);
let response = await redis.get(cacheKey);

if (!response) {
  response = await generateWithClaude(prompt);
  await redis.set(cacheKey, JSON.stringify(response), 'EX', 3600); // 1 hour TTL
}
```

---

## Best Practices

### 1. **Choose the Right Model**

```javascript
// ❌ DON'T use expensive models for simple tasks
const response = await generateWithClaude('Translate: Hello', {
  model: MODELS.CLAUDE.OPUS_4_1  // Overkill!
});

// ✅ DO use appropriate models
const response = await generateWithGemini('Translate: Hello', {
  model: MODELS.GEMINI.FLASH_2_5  // Fast and cheap
});
```

---

### 2. **Optimize Prompts**

```javascript
// ❌ DON'T use vague prompts
const bad = await generateWithClaude('Write about marketing');

// ✅ DO use specific, structured prompts
const good = await generateWithClaude(
  'Write a 3-paragraph email marketing campaign for a new eco-friendly water bottle. ' +
  'Target audience: environmentally-conscious millennials. ' +
  'Key benefits: BPA-free, keeps drinks cold for 24 hours, supports ocean cleanup.'
);
```

---

### 3. **Use System Messages**

```javascript
// ❌ DON'T include behavior instructions in every prompt
const response = await generateWithClaude(
  'You are a professional copywriter. Write a tagline for a coffee shop.'
);

// ✅ DO use system messages for consistent behavior
const response = await generateText('Write a tagline for a coffee shop', {
  model: MODELS.CLAUDE.SONNET_4_5,
  system: 'You are a professional copywriter specializing in F&B brands.'
});
```

---

### 4. **Batch Similar Requests**

```javascript
// ❌ DON'T make sequential requests
for (const product of products) {
  const desc = await generateWithClaude(`Write description for ${product.name}`);
}

// ✅ DO batch requests with Promise.all
const descriptions = await Promise.all(
  products.map(product =>
    generateWithClaude(`Write description for ${product.name}`)
  )
);
```

---

### 5. **Handle Streaming Properly**

```javascript
// ✅ Stream for better UX on long responses
const client = getOpenRouterClient();

let buffer = '';

await client.streamText(
  'Write a comprehensive guide to Next.js',
  { model: MODELS.CLAUDE.SONNET_4_5 },
  (chunk) => {
    buffer += chunk;
    // Update UI in real-time
    updateUI(buffer);
  }
);
```

---

## Pricing & Usage

### Cost Comparison (per 1M tokens)

| Model | Prompt Cost | Completion Cost | Best For |
|-------|-------------|-----------------|----------|
| **Claude Sonnet 4.5** | $3.00 | $15.00 | Complex reasoning, code |
| **Gemini 2.5 Pro** | $1.25 | $5.00 | Long context, multimodal |
| **Gemini 2.5 Flash Image** | $0.075 | $0.30 | Vision, fast tasks |
| GPT-4o | $2.50 | $10.00 | General purpose |
| GPT-3.5 Turbo | $0.50 | $1.50 | Simple tasks |

### Usage Optimization Tips

1. **Use cheaper models for simple tasks**
   ```javascript
   // Simple task → cheap model
   const quickSummary = await generateWithGemini('Summarize in 1 sentence');
   ```

2. **Set appropriate max_tokens**
   ```javascript
   // Limit tokens for short responses
   const response = await generateWithClaude('What is React?', {
     max_tokens: 200  // Don't generate more than needed
   });
   ```

3. **Cache frequently used responses**
4. **Use streaming to cancel early if needed**
5. **Monitor usage with OpenRouter dashboard**

---

## Troubleshooting

### Common Issues

#### 1. **"Invalid API Key" Error**

```javascript
// ❌ Check your .env file
OPENROUTER_API_KEY=sk_or_v1_your_actual_key_here

// ✅ Ensure key is loaded properly
console.log('API Key loaded:', process.env.OPENROUTER_API_KEY ? 'Yes' : 'No');
```

#### 2. **Rate Limit Exceeded**

```javascript
// Implement exponential backoff
async function generateWithRetry(prompt, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateWithClaude(prompt, options);
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

#### 3. **Token Limit Exceeded**

```javascript
// Truncate long prompts
function truncatePrompt(text, maxTokens = 100000) {
  // Approximate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  return text.length > maxChars ? text.substring(0, maxChars) : text;
}

const response = await generateWithGemini(truncatePrompt(longText), {
  model: MODELS.GEMINI.PRO_2_5  // 2M token context
});
```

---

## Quick Reference

### Import Statement
```javascript
import {
  getOpenRouterClient,
  generateText,
  generateWithClaude,
  generateWithGemini,
  generateWithOpenAI,
  generateImage,
  streamText,
  MODELS
} from '@/lib/openrouter';
```

### Recommended Models
```javascript
MODELS.CLAUDE.SONNET_4_5           // Best reasoning & code
MODELS.GEMINI.PRO_2_5              // Best for long context
MODELS.GEMINI.FLASH_2_5_IMAGE      // Best for vision
```

### Basic Usage
```javascript
// Simple completion
const response = await generateWithClaude('Your prompt');

// With options
const response = await generateWithClaude('Your prompt', {
  temperature: 0.7,
  max_tokens: 2000
});

// Streaming
const client = getOpenRouterClient();
await client.streamText('Your prompt', {}, (chunk) => {
  console.log(chunk);
});
```

---

**Last Updated:** January 2025
**Library Version:** 2.0
**OpenRouter API Version:** v1

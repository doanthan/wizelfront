import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversation = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check for OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Prepare messages for OpenRouter API
    const messages = [];

    // Add system message
    messages.push({
      role: "system",
      content: "You are Grok, a helpful AI assistant created by xAI. You are witty, insightful, and have a sense of humor. Provide helpful and informative responses while maintaining your distinctive personality."
    });

    // Add conversation history (only user and assistant messages)
    conversation.forEach(msg => {
      if (msg.type === "user") {
        messages.push({
          role: "user",
          content: msg.content
        });
      } else if (msg.type === "grok") {
        messages.push({
          role: "assistant",
          content: msg.content
        });
      }
    });

    // Add current message
    messages.push({
      role: "user",
      content: message
    });

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'Wizel Frontend - Grok Chat'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4-fast:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        body: errorText
      });

      // Handle specific error cases
      if (openRouterResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenRouter API key' },
          { status: 401 }
        );
      }

      if (openRouterResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (openRouterResponse.status === 402) {
        return NextResponse.json(
          { error: 'Insufficient credits. Please check your OpenRouter account.' },
          { status: 402 }
        );
      }

      throw new Error(`OpenRouter API error: ${openRouterResponse.status} ${errorText}`);
    }

    const data = await openRouterResponse.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Grok');
    }

    const response = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      response: response,
      usage: data.usage,
      model: 'x-ai/grok-4-fast:free',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in Grok chat API:', error);

    // Don't expose internal errors to client
    const errorMessage = error.message.includes('OpenRouter API error')
      ? 'Failed to get response from Grok. Please try again.'
      : 'Internal server error. Please try again later.';

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
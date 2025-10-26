/**
 * Smart Performance Analyzer for Klaviyo AI Chat
 *
 * Intelligently detects user intent for performance analysis
 * and fetches appropriate date range data from ClickHouse
 */

import Anthropic from '@anthropic-ai/sdk';
import { queryClickHouse } from './clickhouse-query';
import { readFile } from 'fs/promises';
import path from 'path';

// Cache prompts on module load
let SEVEN_DAY_PROMPT = null;
let NINETY_DAY_PROMPT = null;

async function loadPrompts() {
  if (!SEVEN_DAY_PROMPT) {
    SEVEN_DAY_PROMPT = await readFile(
      path.join(process.cwd(), 'context/AI-context/klaviyo_7day_analysis_prompt.md'),
      'utf8'
    );
  }
  if (!NINETY_DAY_PROMPT) {
    NINETY_DAY_PROMPT = await readFile(
      path.join(process.cwd(), 'context/AI-context/klaviyo_analysis_prompt.md'),
      'utf8'
    );
  }
  return { SEVEN_DAY_PROMPT, NINETY_DAY_PROMPT };
}

/**
 * Detect if user's message is asking for performance analysis
 */
export function isPerformanceQuery(message) {
  const performanceKeywords = [
    // Time-based
    'this week', 'last week', 'past week', 'past 7 days',
    'this month', 'last month', 'past month', 'past 30 days',
    'yesterday', 'today', 'recent', 'lately', 'recently',
    'last 90 days', 'past 90 days', 'quarter', 'quarterly',

    // Analysis requests
    'how did', 'how is', 'how are', 'how have',
    'what happened', 'why did', 'analyze', 'analysis',
    'performance', 'performing', 'performed',
    'show me', 'tell me about', 'give me',

    // Updates and summaries
    'update', 'summary', 'overview', 'status',
    'report', 'snapshot', 'check', 'review',
    'look at', 'looking at', 'see how', 'breakdown',

    // Comparison
    'compare', 'comparison', 'which store', 'which is better',
    'best', 'worst', 'top', 'bottom', 'leading', 'lagging',

    // Account references
    'account', 'accounts', 'store', 'stores',
    'my campaigns', 'my flows', 'my performance',

    // Metrics
    'revenue', 'sales', 'open rate', 'click rate',
    'campaigns', 'flows', 'emails', 'conversions',
    'orders', 'customers', 'subscribers',

    // Issues/opportunities
    'drop', 'dropped', 'increase', 'increased', 'decline',
    'underperform', 'overperform', 'issue', 'problem',
    'opportunity', 'improve', 'fix', 'optimize', 'boost',
    'trend', 'trending', 'growing', 'falling'
  ];

  const lowerMessage = message.toLowerCase();
  return performanceKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Intelligently parse date range from user's message
 * Returns: { start: Date, end: Date, days: number, label: string }
 */
export function parseDateRange(message) {
  const today = new Date();
  const lowerMessage = message.toLowerCase();

  // Yesterday
  if (lowerMessage.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      start: yesterday,
      end: yesterday,
      days: 1,
      label: 'yesterday',
      type: '7day' // Use 7-day prompt for daily analysis
    };
  }

  // Today
  if (lowerMessage.includes('today')) {
    return {
      start: today,
      end: today,
      days: 1,
      label: 'today',
      type: '7day'
    };
  }

  // Last 7 days / This week / Past week
  if (
    lowerMessage.includes('last 7 days') ||
    lowerMessage.includes('past 7 days') ||
    lowerMessage.includes('this week') ||
    lowerMessage.includes('last week') ||
    lowerMessage.includes('past week')
  ) {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return {
      start: sevenDaysAgo,
      end: today,
      days: 7,
      label: 'past 7 days',
      type: '7day'
    };
  }

  // Last 14 days / Two weeks
  if (
    lowerMessage.includes('last 14 days') ||
    lowerMessage.includes('past 14 days') ||
    lowerMessage.includes('two weeks') ||
    lowerMessage.includes('2 weeks')
  ) {
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return {
      start: fourteenDaysAgo,
      end: today,
      days: 14,
      label: 'past 14 days',
      type: '7day' // Still recent enough for 7-day prompt
    };
  }

  // Last 30 days / This month / Past month
  if (
    lowerMessage.includes('last 30 days') ||
    lowerMessage.includes('past 30 days') ||
    lowerMessage.includes('this month') ||
    lowerMessage.includes('last month') ||
    lowerMessage.includes('past month')
  ) {
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      start: thirtyDaysAgo,
      end: today,
      days: 30,
      label: 'past 30 days',
      type: '90day' // Use 90-day prompt for longer trends
    };
  }

  // Last 90 days / Quarter / Quarterly
  if (
    lowerMessage.includes('last 90 days') ||
    lowerMessage.includes('past 90 days') ||
    lowerMessage.includes('quarter') ||
    lowerMessage.includes('quarterly')
  ) {
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return {
      start: ninetyDaysAgo,
      end: today,
      days: 90,
      label: 'past 90 days',
      type: '90day'
    };
  }

  // Default: Past 7 days for unspecified time ranges
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 7);
  return {
    start: defaultStart,
    end: today,
    days: 7,
    label: 'past 7 days (default)',
    type: '7day'
  };
}

/**
 * Format date for ClickHouse query (YYYY-MM-DD)
 */
function formatDateForQuery(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Fetch performance data from ClickHouse based on date range
 */
async function fetchPerformanceData(userStores, dateRange) {
  const klaviyoIds = userStores
    .map(s => s.klaviyo_integration?.public_id)
    .filter(Boolean);

  if (klaviyoIds.length === 0) {
    throw new Error('No Klaviyo integrations found for user stores');
  }

  const startDate = formatDateForQuery(dateRange.start);
  const endDate = formatDateForQuery(dateRange.end);

  console.log(`📊 Fetching performance data: ${startDate} to ${endDate} (${dateRange.days} days)`);

  // Query campaigns
  const campaignData = await queryClickHouse({
    table: 'campaign_statistics',
    filters: {
      klaviyo_public_id: klaviyoIds,
      date_range: { start: startDate, end: endDate }
    },
    aggregations: 'by_campaign', // Group by campaign with store names
    include_store_names: true,
    include_campaign_names: true
  }, userStores);

  // Query flows
  const flowData = await queryClickHouse({
    table: 'flow_statistics',
    filters: {
      klaviyo_public_id: klaviyoIds,
      date_range: { start: startDate, end: endDate }
    },
    aggregations: 'by_flow',
    include_store_names: true,
    include_flow_names: true
  }, userStores);

  return {
    campaigns: campaignData.data || [],
    flows: flowData.data || [],
    metadata: {
      start_date: startDate,
      end_date: endDate,
      days: dateRange.days,
      stores_count: userStores.length,
      campaigns_count: campaignData.data?.length || 0,
      flows_count: flowData.data?.length || 0
    }
  };
}

/**
 * Main performance analysis handler
 * @param {string} message - User's question
 * @param {Array} userStores - User's accessible stores
 * @param {Object} context - On-screen context
 * @param {Array} conversationHistory - Chat history
 * @param {Object} providedDateRange - Optional pre-parsed date range from Haiku
 */
export async function handlePerformanceAnalysis(message, userStores, context, conversationHistory, providedDateRange = null) {
  try {
    // 1. Use provided date range (from Haiku) or parse from message
    const dateRange = providedDateRange || parseDateRange(message);
    console.log(`🎯 Date range for analysis:`, dateRange);

    // 2. Fetch data from ClickHouse
    const performanceData = await fetchPerformanceData(userStores, dateRange);

    // 3. Load appropriate prompt based on date range
    const { SEVEN_DAY_PROMPT, NINETY_DAY_PROMPT } = await loadPrompts();
    const systemPrompt = dateRange.type === '7day' ? SEVEN_DAY_PROMPT : NINETY_DAY_PROMPT;

    // 4. Build analysis input
    const analysisInput = {
      analysis_type: dateRange.type === '7day' ? '7_day_performance_review' : '90_day_performance_audit',
      period: {
        start_date: performanceData.metadata.start_date,
        end_date: performanceData.metadata.end_date,
        days: dateRange.days,
        label: dateRange.label
      },
      stores: userStores.map(s => ({
        store_id: s.public_id,
        store_name: s.name,
        klaviyo_id: s.klaviyo_integration?.public_id
      })),
      campaigns: performanceData.campaigns,
      flows: performanceData.flows,
      user_question: message,
      on_screen_context: context || {}
    };

    // 5. Build context-aware prompt
    let contextNote = '';
    if (context?.page_type) {
      contextNote = `\n\n**User's Current View:** The user is on the ${context.page_type} page.`;

      if (context.page_type === 'campaigns' && context.data_context?.campaigns) {
        contextNote += `\nThey are currently viewing these campaigns on screen. Prioritize insights about these visible campaigns:\n${JSON.stringify(context.data_context.campaigns, null, 2)}`;
      }

      if (context.page_type === 'calendar' && context.data_context?.selected_date) {
        contextNote += `\nThey are looking at ${context.data_context.selected_date} on the calendar. Focus on campaigns/flows around this date.`;
      }
    }

    // 6. Call Claude with appropriate prompt
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const urgencyNote = dateRange.type === '7day'
      ? '\n\nIMPORTANT: Focus on THIS WEEK\'s priorities and immediate action items. Use store names, campaign names, and flow names in your response.'
      : '\n\nIMPORTANT: Provide strategic insights and 1-3 month recommendations. Use store names, campaign names, and flow names in your response.';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: dateRange.type === '7day' ? 8000 : 16000,
      system: systemPrompt,
      messages: [
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: `The user asked: "${message}"${contextNote}${urgencyNote}

Here is the performance data for ${dateRange.label}:

${JSON.stringify(analysisInput, null, 2)}

Provide focused insights answering their question. Reference specific store names, campaign names, and flow names.`
        }
      ]
    });

    const finalResponse = response.content.find(block => block.type === "text");
    const responseText = finalResponse?.text || "I couldn't analyze the performance data.";

    // 7. Return structured response
    return {
      response: responseText,
      data: {
        analysis_type: dateRange.type === '7day' ? '7_day_performance' : '90_day_performance',
        date_range: {
          start: performanceData.metadata.start_date,
          end: performanceData.metadata.end_date,
          days: dateRange.days,
          label: dateRange.label
        },
        stores_analyzed: userStores.length,
        campaigns_analyzed: performanceData.metadata.campaigns_count,
        flows_analyzed: performanceData.metadata.flows_count,
        prompt_used: dateRange.type === '7day' ? 'Focused 7-Day Analysis' : 'Strategic 90-Day Analysis'
      },
      toolsUsed: [
        dateRange.type === '7day' ? '7-Day Performance Analysis' : '90-Day Strategic Analysis',
        'ClickHouse',
        `${dateRange.days} days of data`
      ],
      conversationHistory: [
        ...conversationHistory.slice(-8),
        { role: 'user', content: message },
        { role: 'assistant', content: responseText }
      ]
    };

  } catch (error) {
    console.error('❌ Performance analysis error:', error);

    // Return helpful error message
    return {
      response: `I encountered an issue analyzing performance data: ${error.message}. Please ensure your stores have Klaviyo integrations configured.`,
      data: {
        error: error.message,
        analysis_type: 'error'
      },
      toolsUsed: ['Error Handler'],
      conversationHistory: [
        ...conversationHistory.slice(-8),
        { role: 'user', content: message },
        { role: 'assistant', content: `Error: ${error.message}` }
      ]
    };
  }
}

/**
 * Helper: Extract date range context from on-screen data
 */
export function extractDateRangeFromContext(context) {
  if (!context) return null;

  // Check if context has explicit date range
  if (context.dateRange) {
    return {
      start: new Date(context.dateRange.start),
      end: new Date(context.dateRange.end),
      days: context.dateRange.daysSpan || 7,
      label: context.dateRange.preset || 'custom range',
      type: context.dateRange.daysSpan <= 14 ? '7day' : '90day'
    };
  }

  return null;
}

/**
 * Marketing Data Analysis with Sonnet 4.5 (Gemini 2.5 Pro fallback)
 *
 * Provides deep marketing insights from ClickHouse or MCP data
 * with automatic fallback to Gemini if Sonnet fails
 */

import { openrouter, MODELS } from './openrouter';

/**
 * Analyze marketing data with Claude Sonnet 4.5 (with Gemini fallback)
 *
 * @param {string} question - User's marketing question
 * @param {string} sqlQuery - The SQL query that was executed (or 'MCP' for MCP data)
 * @param {array} data - Retrieved data from ClickHouse or MCP
 * @param {object} context - Additional context (user info, business goals, etc.)
 * @param {boolean} enableFallback - Enable Gemini fallback (default: true)
 */
export async function analyzeMarketingData(
  question,
  sqlQuery,
  data,
  context = {},
  enableFallback = true
) {
  const systemPrompt = buildAnalysisSystemPrompt(context);
  const dataSummary = generateDataSummary(data);
  const userPrompt = buildAnalysisPrompt(question, sqlQuery, data, dataSummary, context);

  try {
    const response = await openrouter.chat({
      model: MODELS.SONNET,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 4096,
      enableFallback,
      fallbackModel: MODELS.GEMINI
    });

    // Vercel AI SDK returns response.text (not response.choices[0].message.content)
    return response.text;

  } catch (error) {
    console.error('❌ Both Sonnet and Gemini failed:', error);
    throw new Error('AI analysis unavailable - both primary and fallback models failed');
  }
}

/**
 * Stream analysis results for better UX (with fallback)
 */
export async function analyzeMarketingDataStream(
  question,
  sqlQuery,
  data,
  context = {},
  enableFallback = true
) {
  const systemPrompt = buildAnalysisSystemPrompt(context);
  const dataSummary = generateDataSummary(data);
  const userPrompt = buildAnalysisPrompt(question, sqlQuery, data, dataSummary, context);

  try {
    const stream = await openrouter.chat({
      model: MODELS.SONNET,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 4096,
      stream: true,
      enableFallback,
      fallbackModel: MODELS.GEMINI
    });

    return stream;

  } catch (error) {
    console.error('❌ Stream analysis failed:', error);
    throw new Error('AI analysis stream unavailable');
  }
}

function buildAnalysisSystemPrompt(context) {
  const {
    storeNames = [],
    industry = 'E-commerce',
    businessGoals = '',
    currentStrategy = '',
    constraints = '',
    userExpertise = 'intermediate',
    dataSource = 'clickhouse', // 'clickhouse' or 'mcp'
    benchmark = null  // NEW: Industry benchmark data
  } = context;

  const dataSourceNote = dataSource === 'mcp'
    ? '- Data Source: Klaviyo MCP Server (Real-time, Live Data)\n- Focus on CURRENT state and immediate actions'
    : '- Data Source: ClickHouse (Historical Analytics)\n- Focus on trends, patterns, and strategic insights';

  // Build benchmark context if available
  let benchmarkSection = '';
  if (benchmark && benchmark.benchmarks) {
    const b = benchmark.benchmarks;
    benchmarkSection = `

📊 INDUSTRY BENCHMARK CONTEXT (${benchmark.vertical}):
${b.campaigns ? `
Campaign Benchmarks:
- Open Rate: Median ${b.campaigns.openRate?.median || 'N/A'} | Top 10%: ${b.campaigns.openRate?.top10 || 'N/A'}
- Click Rate: Median ${b.campaigns.clickRate?.median || 'N/A'} | Top 10%: ${b.campaigns.clickRate?.top10 || 'N/A'}
- CTOR: Median ${b.campaigns.ctor?.median || 'N/A'} | Top 10%: ${b.campaigns.ctor?.top10 || 'N/A'}
` : ''}
${benchmark.your_performance?.campaigns ? `
Store Performance vs Industry:
${Object.keys(benchmark.your_performance.campaigns).map(metric => {
  const perf = benchmark.your_performance.campaigns[metric];
  return `- ${metric}: ${perf.value} (${perf.percentile}) - ${perf.vs_median} vs median`;
}).join('\n')}
` : ''}
Industry Insights for ${benchmark.vertical}:
${benchmark.industry_insights?.slice(0, 5).map(insight => `- ${insight}`).join('\n') || '- No specific insights available'}

IMPORTANT: Reference these benchmarks when providing recommendations. Cite specific numbers.
Example: "Your 42% open rate is performing ABOVE the ${benchmark.vertical} median of ${b.campaigns?.openRate?.median || 'N/A'}"`;
  }

  return `You are a senior marketing analyst specializing in e-commerce and email/SMS marketing analytics for Wizel.ai.

BUSINESS CONTEXT:
${storeNames.length > 0 ? `- Analyzing: ${storeNames.join(', ')}` : ''}
- Industry: ${industry}
${businessGoals ? `- Business Goals: ${businessGoals}` : ''}
${currentStrategy ? `- Current Strategy: ${currentStrategy}` : ''}
${constraints ? `- Constraints: ${constraints}` : ''}
- User Expertise: ${userExpertise}
${dataSourceNote}${benchmarkSection}

YOUR EXPERTISE:
- Multi-account marketing analytics and performance optimization
- Customer segmentation and lifecycle marketing
- Campaign performance optimization and A/B testing
- LTV (Lifetime Value) optimization and retention strategies
- Product marketing, cross-sell, and upsell opportunities
- Channel mix optimization (email, SMS, push)
- Discount strategy and price optimization
- ROI-focused recommendations with quantified impact
- Permission-aware insights (only analyzing accessible stores)

ANALYSIS APPROACH:
- Data-driven with specific numbers, percentages, and comparisons
- Focus on actionable insights that can be implemented immediately
- Quantify expected impact whenever possible
- Consider both quick wins (0-7 days) and strategic initiatives (30-90 days)
- Reference industry benchmarks when applicable (e.g., email open rates, conversion rates)
- Identify opportunities AND risks
- Adjust technical complexity based on user expertise level

OUTPUT FORMAT (use this exact markdown structure):

# 📊 Executive Summary
[2-3 sentences with the single most critical insight and recommended action]

## 🔍 Key Findings
- **Finding 1**: [Specific metric with number/percentage and comparison]
- **Finding 2**: [Specific metric with number/percentage and comparison]
- **Finding 3**: [Specific metric with number/percentage and comparison]
- **Finding 4**: [Additional finding if relevant]

## 🎯 Strategic Insights
[2-3 paragraphs explaining WHY these findings matter and what they reveal about customer behavior, market position, or operational effectiveness]

## ✅ Immediate Actions (Next 7 Days)
1. **[Action Name]**: [Specific implementation steps]
   - **Expected Impact**: [Quantified outcome like "+$5K revenue" or "+15% conversion rate"]
   - **Effort**: [Low/Medium/High]
   - **Dependencies**: [What's needed to execute]

2. **[Action Name]**: [Specific implementation steps]
   - **Expected Impact**: [Quantified outcome]
   - **Effort**: [Low/Medium/High]
   - **Dependencies**: [What's needed]

## 🚀 30-Day Roadmap
**Week 1-2:**
- [Initiative with specific tasks]
- [Initiative with specific tasks]

**Week 3-4:**
- [Initiative with specific tasks]
- [Initiative with specific tasks]

## 💡 Campaign Concepts
**Campaign 1: "[Campaign Name]"**
- **Audience**: [Specific segment with size]
- **Offer**: [Specific offer/message]
- **Channel**: [Email/SMS/Multi-channel]
- **Expected ROI**: [Ratio or percentage based on data]
- **Timeline**: [When to launch]

**Campaign 2: "[Campaign Name]"**
- [Same structure]

## 📈 Success Metrics
- **Primary KPI**: [Main metric to track with target]
- **Secondary KPIs**:
  - [Supporting metric 1 with target]
  - [Supporting metric 2 with target]
  - [Supporting metric 3 with target]
- **Review Frequency**: [Daily/Weekly/Monthly with specific days]
- **Alert Thresholds**: [When to investigate or adjust strategy]

## ⚠️ Risks & Considerations
- [Risk 1 and mitigation strategy]
- [Risk 2 and mitigation strategy]

## 🏆 Benchmark Comparison
[Compare user's metrics to industry standards when relevant]

TONE: Professional yet conversational, confident but not arrogant, specific over vague. Adjust technical depth based on user expertise.`;
}

function buildAnalysisPrompt(question, sqlQuery, data, summary, context) {
  const dataPreview = data.slice(0, 50);
  const hasMore = data.length > 50;

  const { storeNames = [], dateRange = null, dataSource = 'clickhouse' } = context;

  const querySection = sqlQuery === 'MCP'
    ? `REAL-TIME DATA SOURCE:\nKlaviyo MCP Server (live API data)\n`
    : `SQL QUERY EXECUTED:\n\`\`\`sql\n${sqlQuery}\n\`\`\`\n`;

  return `USER QUESTION:
${question}

${storeNames.length > 0 ? `ANALYZED STORES:\n${storeNames.join(', ')}\n` : ''}
${dateRange ? `DATE RANGE:\n${dateRange.start} to ${dateRange.end}\n` : ''}

${querySection}

DATA SUMMARY:
${summary}

DATA PREVIEW (showing ${dataPreview.length} of ${data.length} total rows):
\`\`\`json
${JSON.stringify(dataPreview, null, 2)}
\`\`\`
${hasMore ? `\n... and ${data.length - 50} more rows not shown` : ''}

Provide a comprehensive marketing analysis following the exact format specified in your system prompt. Be specific, quantitative, and actionable. Focus on insights that can drive immediate business value for these specific stores.`;
}

function generateDataSummary(data) {
  if (!data || data.length === 0) {
    return 'No data available for analysis.';
  }

  const summaryParts = [`📊 Dataset Overview:\n- Total Records: ${data.length.toLocaleString()}`];

  // Collect numeric columns
  const numericStats = {};

  data.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        if (!numericStats[key]) {
          numericStats[key] = [];
        }
        numericStats[key].push(value);
      }
    });
  });

  // Calculate statistics for numeric columns (limit to top 10 most important)
  const sortedColumns = Object.entries(numericStats)
    .sort((a, b) => {
      // Prioritize revenue/money columns
      const aIsMoney = a[0].toLowerCase().includes('revenue') || a[0].toLowerCase().includes('value');
      const bIsMoney = b[0].toLowerCase().includes('revenue') || b[0].toLowerCase().includes('value');
      if (aIsMoney && !bIsMoney) return -1;
      if (!aIsMoney && bIsMoney) return 1;
      // Then by sum (total impact)
      const aSum = a[1].reduce((sum, val) => sum + val, 0);
      const bSum = b[1].reduce((sum, val) => sum + val, 0);
      return bSum - aSum;
    })
    .slice(0, 10);

  sortedColumns.forEach(([column, values]) => {
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      summaryParts.push(`
📈 ${column}:
  • Total: ${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
  • Average: ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
  • Median: ${median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
  • Range: ${min.toLocaleString()} to ${max.toLocaleString()}`);
    }
  });

  // Sample categorical columns (limit to 5)
  const categoricalSample = {};
  data.slice(0, 100).forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length < 100) {
        if (!categoricalSample[key]) {
          categoricalSample[key] = new Set();
        }
        categoricalSample[key].add(value);
      }
    });
  });

  Object.entries(categoricalSample)
    .slice(0, 5)
    .forEach(([column, uniqueValues]) => {
      if (uniqueValues.size > 0 && uniqueValues.size <= 20) {
        summaryParts.push(`
📁 ${column}: ${uniqueValues.size} unique values
  • Sample: ${Array.from(uniqueValues).slice(0, 5).join(', ')}`);
      }
    });

  return summaryParts.join('\n');
}

export default {
  analyzeMarketingData,
  analyzeMarketingDataStream
};

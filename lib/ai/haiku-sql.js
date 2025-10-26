/**
 * Haiku SQL Generator
 *
 * Uses Claude Haiku 4.5 (fast, cheap) to generate ClickHouse SQL queries
 * from natural language questions
 */

import { makeOpenRouterRequest } from './openrouter';
import { TABLE_SCHEMAS, CLICKHOUSE_TABLES, COMMON_QUERIES } from '@/lib/db/schema-clickhouse';
import { validateQuery } from '@/lib/db/validation';
import { buildKlaviyoIdFilter } from '@/lib/utils/id-mapper';
import { CostTracker } from '@/lib/utils/cost-tracker';

const HAIKU_MODEL = 'anthropic/claude-haiku-4.5';

/**
 * Build comprehensive schema context for SQL generation
 *
 * @param {string[]} tables - Relevant table names
 * @returns {string} - Schema context
 */
function buildSchemaContext(tables) {
  let context = '# Available ClickHouse Tables\n\n';

  for (const tableName of tables) {
    const schema = TABLE_SCHEMAS[tableName];
    if (!schema) continue;

    context += `## ${schema.table}\n`;
    context += `${schema.description}\n\n`;
    context += '**Columns:**\n';

    for (const [colName, colDef] of Object.entries(schema.columns)) {
      context += `- \`${colName}\` (${colDef.type}): ${colDef.description}\n`;
    }

    if (schema.requiredFilters) {
      context += `\n**Required Filters:** ${schema.requiredFilters.join(', ')}\n`;
    }

    if (schema.dateColumn) {
      context += `**Date Column:** ${schema.dateColumn}\n`;
    }

    if (schema.rateColumns && schema.rateColumns.length > 0) {
      context += `**Rate Columns (0-10000 scale):** ${schema.rateColumns.join(', ')}\n`;
      context += `*Note: Rate columns are stored as integers 0-10000 representing 0-100%. Divide by 100 for percentages.*\n`;
    }

    context += '\n';
  }

  return context;
}

/**
 * Build example queries context
 *
 * @returns {string} - Example queries
 */
function buildExamplesContext() {
  let context = '# Example Queries\n\n';

  for (const [name, query] of Object.entries(COMMON_QUERIES)) {
    context += `## ${name}\n`;
    context += `${query.description}\n\n`;
    context += '```sql\n';
    context += query.template.trim();
    context += '\n```\n\n';
  }

  return context;
}

/**
 * Build system prompt for SQL generation
 *
 * @param {string[]} relevantTables - Relevant table names
 * @param {string[]} klaviyoIds - Klaviyo IDs for filtering
 * @returns {string} - System prompt
 */
function buildSystemPrompt(relevantTables, klaviyoIds) {
  const schemaContext = buildSchemaContext(relevantTables);
  const examplesContext = buildExamplesContext();

  return `You are an expert ClickHouse SQL query generator for Klaviyo marketing analytics.

Your task is to generate **secure**, **efficient** SQL queries based on natural language questions.

${schemaContext}

${examplesContext}

# Query Generation Rules

## CRITICAL SECURITY RULES

1. **ALWAYS include klaviyo_public_id filter** - Every query MUST filter by klaviyo_public_id
2. **Only SELECT queries** - Never generate INSERT, UPDATE, DELETE, DROP, or any other destructive operation
3. **Use provided Klaviyo IDs** - Must filter by: ${klaviyoIds.map(id => `'${id}'`).join(', ')}
4. **Add LIMIT clause** - Always include a sensible LIMIT (default: 100)

## SQL Best Practices

1. **Use proper aggregations** - For averages across campaigns, use weighted averages
2. **Handle rate columns** - Rate columns are stored as 0-10000, divide by 100 for percentages
3. **Date filtering** - Use proper date comparison with DATE column
4. **Efficient joins** - Only join when necessary, prefer single-table queries
5. **Clear column aliases** - Use descriptive aliases for calculated columns

## Query Structure

\`\`\`sql
SELECT
  [columns with proper formatting]
FROM [table]
WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(', ')})
  AND [additional filters]
[GROUP BY if aggregating]
[ORDER BY for sorting]
LIMIT [reasonable limit]
\`\`\`

## Response Format

Return ONLY the SQL query, no explanations or markdown. Just the raw SQL.

If you cannot generate a query (e.g., question is ambiguous), respond with:
ERROR: [clear explanation of why query cannot be generated]

## Example Transformations

**Question:** "What are my top 5 campaigns by revenue last month?"

**SQL:**
\`\`\`sql
SELECT
  campaign_name,
  SUM(conversion_value) as total_revenue,
  SUM(recipients) as total_recipients,
  AVG(open_rate) / 100.0 as avg_open_rate
FROM campaign_statistics
WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(', ')})
  AND date >= toDate(now()) - INTERVAL 1 MONTH
  AND date < toDate(now())
GROUP BY campaign_name
ORDER BY total_revenue DESC
LIMIT 5
\`\`\`

**Question:** "Show me daily revenue trends for the last 30 days"

**SQL:**
\`\`\`sql
SELECT
  date,
  total_revenue,
  total_orders,
  avg_order_value
FROM account_metrics_daily
WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(', ')})
  AND date >= toDate(now()) - INTERVAL 30 DAY
ORDER BY date ASC
LIMIT 100
\`\`\`

Remember: Security first, efficiency second, accuracy third.`;
}

/**
 * Determine relevant tables for the question
 *
 * @param {string} question - User question
 * @returns {string[]} - Relevant table names
 */
function determineRelevantTables(question) {
  const lowerQuestion = question.toLowerCase();
  const tables = [];

  // Campaign-related
  if (lowerQuestion.includes('campaign') || lowerQuestion.includes('email') || lowerQuestion.includes('sms')) {
    tables.push(CLICKHOUSE_TABLES.CAMPAIGN_STATISTICS);
    tables.push(CLICKHOUSE_TABLES.CAMPAIGN_DAILY_AGGREGATES);
  }

  // Flow-related
  if (lowerQuestion.includes('flow') || lowerQuestion.includes('automation')) {
    tables.push(CLICKHOUSE_TABLES.FLOW_STATISTICS);
  }

  // Customer-related
  if (lowerQuestion.includes('customer') || lowerQuestion.includes('buyer') || lowerQuestion.includes('segment')) {
    tables.push(CLICKHOUSE_TABLES.CUSTOMER_PROFILES);
    tables.push(CLICKHOUSE_TABLES.BUYER_SEGMENTS_ANALYSIS);
  }

  // Product-related
  if (lowerQuestion.includes('product') || lowerQuestion.includes('item') || lowerQuestion.includes('sku')) {
    tables.push(CLICKHOUSE_TABLES.PRODUCTS_MASTER);
    tables.push(CLICKHOUSE_TABLES.FIRST_PURCHASE_LTV_ANALYSIS);
  }

  // Order-related
  if (lowerQuestion.includes('order') || lowerQuestion.includes('purchase') || lowerQuestion.includes('transaction')) {
    tables.push(CLICKHOUSE_TABLES.KLAVIYO_ORDERS);
  }

  // Revenue/metrics-related
  if (lowerQuestion.includes('revenue') || lowerQuestion.includes('metric') || lowerQuestion.includes('daily') || lowerQuestion.includes('trend')) {
    tables.push(CLICKHOUSE_TABLES.ACCOUNT_METRICS_DAILY);
  }

  // Discount-related
  if (lowerQuestion.includes('discount') || lowerQuestion.includes('coupon') || lowerQuestion.includes('promo')) {
    tables.push(CLICKHOUSE_TABLES.DISCOUNT_USAGE_ANALYTICS);
  }

  // Segment-related
  if (lowerQuestion.includes('segment') || lowerQuestion.includes('list')) {
    tables.push(CLICKHOUSE_TABLES.SEGMENT_STATISTICS);
  }

  // Form-related
  if (lowerQuestion.includes('form') || lowerQuestion.includes('signup')) {
    tables.push(CLICKHOUSE_TABLES.FORM_STATISTICS);
  }

  // If no specific tables identified, include core analytics tables
  if (tables.length === 0) {
    tables.push(CLICKHOUSE_TABLES.ACCOUNT_METRICS_DAILY);
    tables.push(CLICKHOUSE_TABLES.CAMPAIGN_STATISTICS);
    tables.push(CLICKHOUSE_TABLES.CUSTOMER_PROFILES);
  }

  return [...new Set(tables)]; // Remove duplicates
}

/**
 * Generate SQL query using Haiku
 *
 * @param {string} question - Natural language question
 * @param {string[]} klaviyoIds - Klaviyo IDs for filtering
 * @param {Object} options - Options
 * @param {CostTracker} options.costTracker - Cost tracker instance
 * @param {boolean} options.debug - Enable debug logging
 * @returns {Promise<{ sql: string, tables: string[], cost: Object, validation: Object }>}
 */
export async function generateSQL(question, klaviyoIds, options = {}) {
  const { costTracker, debug = false } = options;

  if (!question || !klaviyoIds || klaviyoIds.length === 0) {
    throw new Error('Question and Klaviyo IDs are required');
  }

  // Determine relevant tables
  const relevantTables = determineRelevantTables(question);

  if (debug) {
    console.log('🎯 Relevant tables:', relevantTables);
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(relevantTables, klaviyoIds);

  // Build user prompt
  const userPrompt = `Generate a ClickHouse SQL query for this question:

"${question}"

Remember:
- Filter by klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(', ')})
- Use proper rate column handling (divide by 100)
- Add appropriate LIMIT
- Return ONLY the SQL query`;

  // Call Haiku via OpenRouter
  const response = await makeOpenRouterRequest({
    model: HAIKU_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1, // Low temperature for consistent SQL generation
    max_tokens: 1000,
  });

  // Extract SQL from response
  let sql = response.content.trim();

  // Check for error response
  if (sql.startsWith('ERROR:')) {
    throw new Error(sql.replace('ERROR:', '').trim());
  }

  // Clean up SQL (remove markdown code blocks if present)
  sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();

  // Validate the generated SQL
  const validation = validateQuery(sql, klaviyoIds);

  if (!validation.valid) {
    throw new Error(`Generated SQL failed validation: ${validation.error}`);
  }

  // Use sanitized SQL
  const finalSQL = validation.sanitized;

  // Track cost
  if (costTracker) {
    costTracker.track({
      model: HAIKU_MODEL,
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      tier: 'tier2',
      operation: 'sql_generation',
    });
  }

  if (debug) {
    console.log('📝 Generated SQL:', finalSQL);
    console.log('⚠️  Warnings:', validation.warnings);
    console.log('💰 Cost:', response.cost);
  }

  return {
    sql: finalSQL,
    tables: validation.tables || relevantTables,
    cost: response.cost,
    validation,
    usage: response.usage,
  };
}

/**
 * Generate SQL with retry on validation failure
 *
 * @param {string} question - Natural language question
 * @param {string[]} klaviyoIds - Klaviyo IDs for filtering
 * @param {Object} options - Options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 2)
 * @returns {Promise<Object>} - SQL generation result
 */
export async function generateSQLWithRetry(question, klaviyoIds, options = {}) {
  const { maxRetries = 2, ...otherOptions } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateSQL(question, klaviyoIds, otherOptions);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        console.warn(`SQL generation attempt ${attempt} failed, retrying...`, error.message);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  throw new Error(`SQL generation failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Example usage:
 *
 * ```javascript
 * import { generateSQL } from '@/lib/ai/haiku-sql';
 * import { CostTracker } from '@/lib/utils/cost-tracker';
 *
 * const tracker = new CostTracker();
 *
 * const result = await generateSQL(
 *   "What are my top 10 campaigns by revenue last month?",
 *   ['Pe5Xw6', 'XqkVGb'],
 *   { costTracker: tracker, debug: true }
 * );
 *
 * console.log('SQL:', result.sql);
 * console.log('Cost:', result.cost);
 * console.log('Total cost:', tracker.getSummary().totalCost);
 * ```
 */

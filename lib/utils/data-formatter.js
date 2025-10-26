/**
 * Data Formatting for AI Analysis
 *
 * Formats ClickHouse query results for AI consumption and analysis
 */

import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { getRateColumns } from '@/lib/db/schema-clickhouse';

/**
 * Format ClickHouse query results for AI
 *
 * Converts raw query results into a human-readable format that AI can easily analyze
 *
 * @param {Array} rows - Query result rows
 * @param {string} tableName - Source table name
 * @returns {Object} - Formatted data for AI
 */
export function formatForAI(rows, tableName) {
  if (!rows || rows.length === 0) {
    return {
      rowCount: 0,
      summary: 'No data found',
      data: [],
    };
  }

  // Get rate columns that need conversion (stored as 0-10000, need to divide by 100)
  const rateColumns = getRateColumns(tableName);

  // Format each row
  const formattedRows = rows.map(row => {
    const formatted = {};

    for (const [key, value] of Object.entries(row)) {
      // Handle rate columns (convert 0-10000 to percentage)
      if (rateColumns.includes(key)) {
        formatted[key] = value / 100; // Convert to actual percentage
        continue;
      }

      // Handle dates
      if (value instanceof Date || key.includes('date') || key.includes('timestamp')) {
        formatted[key] = value;
        continue;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        formatted[key] = value;
        continue;
      }

      // Handle numbers
      if (typeof value === 'number') {
        formatted[key] = value;
        continue;
      }

      // Everything else (strings, nulls, etc.)
      formatted[key] = value;
    }

    return formatted;
  });

  // Generate summary statistics
  const summary = generateSummary(formattedRows, tableName);

  return {
    rowCount: rows.length,
    summary,
    data: formattedRows,
    table: tableName,
  };
}

/**
 * Generate summary statistics for the dataset
 *
 * @param {Array} rows - Formatted rows
 * @param {string} tableName - Table name
 * @returns {string} - Human-readable summary
 */
function generateSummary(rows, tableName) {
  if (rows.length === 0) {
    return 'No data';
  }

  const summaryParts = [`${rows.length} rows`];

  // Detect common columns and add relevant summaries
  const firstRow = rows[0];
  const columns = Object.keys(firstRow);

  // Revenue-related summary
  if (columns.includes('total_revenue') || columns.includes('conversion_value')) {
    const revenueKey = columns.includes('total_revenue') ? 'total_revenue' : 'conversion_value';
    const totalRevenue = rows.reduce((sum, row) => sum + (row[revenueKey] || 0), 0);
    summaryParts.push(`Total revenue: ${formatCurrency(totalRevenue)}`);
  }

  // Order/recipient summary
  if (columns.includes('total_orders')) {
    const totalOrders = rows.reduce((sum, row) => sum + (row.total_orders || 0), 0);
    summaryParts.push(`${formatNumber(totalOrders)} orders`);
  } else if (columns.includes('recipients')) {
    const totalRecipients = rows.reduce((sum, row) => sum + (row.recipients || 0), 0);
    summaryParts.push(`${formatNumber(totalRecipients)} recipients`);
  }

  // Customer summary
  if (columns.includes('unique_customers') || columns.includes('customer_count')) {
    const customerKey = columns.includes('unique_customers') ? 'unique_customers' : 'customer_count';
    const totalCustomers = rows.reduce((sum, row) => sum + (row[customerKey] || 0), 0);
    summaryParts.push(`${formatNumber(totalCustomers)} customers`);
  }

  // Date range
  if (columns.includes('date')) {
    const dates = rows.map(r => new Date(r.date)).filter(d => !isNaN(d));
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      summaryParts.push(`${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
    }
  }

  return summaryParts.join(', ');
}

/**
 * Format data as a table for AI to read
 *
 * @param {Array} rows - Data rows
 * @param {number} maxRows - Maximum rows to include (default: 20)
 * @returns {string} - Formatted table string
 */
export function formatAsTable(rows, maxRows = 20) {
  if (!rows || rows.length === 0) {
    return 'No data';
  }

  const displayRows = rows.slice(0, maxRows);
  const columns = Object.keys(displayRows[0]);

  // Build header
  let table = columns.join(' | ') + '\n';
  table += columns.map(() => '---').join(' | ') + '\n';

  // Build rows
  for (const row of displayRows) {
    const values = columns.map(col => {
      const value = row[col];

      // Format different types
      if (value === null || value === undefined) {
        return '-';
      }

      if (typeof value === 'number') {
        // Check if it's currency-related
        if (col.includes('revenue') || col.includes('value') || col.includes('price')) {
          return formatCurrency(value);
        }
        // Check if it's a percentage
        if (col.includes('rate') || col.includes('pct_')) {
          return formatPercentage(value);
        }
        // Regular number
        return formatNumber(value);
      }

      if (Array.isArray(value)) {
        return value.length > 0 ? value.slice(0, 3).join(', ') : '-';
      }

      return String(value);
    });

    table += values.join(' | ') + '\n';
  }

  if (rows.length > maxRows) {
    table += `\n... and ${rows.length - maxRows} more rows`;
  }

  return table;
}

/**
 * Format data as JSON for AI
 *
 * @param {Array} rows - Data rows
 * @param {number} maxRows - Maximum rows to include
 * @returns {string} - JSON string
 */
export function formatAsJSON(rows, maxRows = 50) {
  if (!rows || rows.length === 0) {
    return JSON.stringify({ data: [], count: 0 });
  }

  const displayRows = rows.slice(0, maxRows);

  return JSON.stringify({
    data: displayRows,
    count: rows.length,
    truncated: rows.length > maxRows,
  }, null, 2);
}

/**
 * Format data for chart visualization
 *
 * @param {Array} rows - Data rows
 * @param {Object} config - Chart configuration
 * @param {string} config.xAxis - X-axis column
 * @param {string[]} config.yAxis - Y-axis columns
 * @param {string} config.type - Chart type (line, bar, pie)
 * @returns {Object} - Chart data
 */
export function formatForChart(rows, config) {
  const { xAxis, yAxis, type = 'line' } = config;

  if (!rows || rows.length === 0) {
    return { type, data: [] };
  }

  const chartData = rows.map(row => {
    const point = {
      name: row[xAxis],
    };

    for (const metric of yAxis) {
      point[metric] = row[metric];
    }

    return point;
  });

  return {
    type,
    data: chartData,
    xAxis,
    yAxis,
  };
}

/**
 * Create a summary for AI context
 *
 * @param {Array} rows - Data rows
 * @param {string} tableName - Table name
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted summary for AI
 */
export function createAISummary(rows, tableName, options = {}) {
  const {
    maxRows = 10,
    includeTable = true,
    includeStats = true,
  } = options;

  if (!rows || rows.length === 0) {
    return `No data found in ${tableName}`;
  }

  let summary = `## Data from ${tableName}\n\n`;

  // Add statistics
  if (includeStats) {
    const stats = generateSummary(rows, tableName);
    summary += `**Summary:** ${stats}\n\n`;
  }

  // Add table
  if (includeTable) {
    summary += formatAsTable(rows, maxRows);
  }

  return summary;
}

/**
 * Format insights for AI to present to user
 *
 * @param {Object} insights - Insights object from AI analysis
 * @returns {string} - Formatted insights
 */
export function formatInsights(insights) {
  if (!insights) {
    return 'No insights available';
  }

  let formatted = '';

  if (insights.keyFindings) {
    formatted += '**Key Findings:**\n';
    for (const finding of insights.keyFindings) {
      formatted += `- ${finding}\n`;
    }
    formatted += '\n';
  }

  if (insights.trends) {
    formatted += '**Trends:**\n';
    for (const trend of insights.trends) {
      formatted += `- ${trend}\n`;
    }
    formatted += '\n';
  }

  if (insights.recommendations) {
    formatted += '**Recommendations:**\n';
    for (const rec of insights.recommendations) {
      formatted += `- ${rec}\n`;
    }
    formatted += '\n';
  }

  return formatted;
}

/**
 * Compress large datasets for AI (reduce token usage)
 *
 * @param {Array} rows - Data rows
 * @param {Object} options - Compression options
 * @returns {Object} - Compressed data
 */
export function compressForAI(rows, options = {}) {
  const {
    maxRows = 50,
    samplingStrategy = 'top', // 'top', 'sample', 'aggregate'
    aggregateBy = null,
  } = options;

  if (!rows || rows.length <= maxRows) {
    return { data: rows, compressed: false };
  }

  let compressed = [];

  switch (samplingStrategy) {
    case 'top':
      // Take top N rows (assume already sorted)
      compressed = rows.slice(0, maxRows);
      break;

    case 'sample':
      // Randomly sample N rows
      compressed = sampleRows(rows, maxRows);
      break;

    case 'aggregate':
      // Aggregate by a column if specified
      if (aggregateBy) {
        compressed = aggregateRows(rows, aggregateBy, maxRows);
      } else {
        compressed = rows.slice(0, maxRows);
      }
      break;

    default:
      compressed = rows.slice(0, maxRows);
  }

  return {
    data: compressed,
    compressed: true,
    originalCount: rows.length,
    compressedCount: compressed.length,
    strategy: samplingStrategy,
  };
}

/**
 * Sample rows randomly
 */
function sampleRows(rows, count) {
  const sampled = [];
  const step = Math.floor(rows.length / count);

  for (let i = 0; i < rows.length && sampled.length < count; i += step) {
    sampled.push(rows[i]);
  }

  return sampled;
}

/**
 * Aggregate rows by a column
 */
function aggregateRows(rows, groupBy, maxGroups) {
  const groups = {};

  // Group rows
  for (const row of rows) {
    const key = row[groupBy];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  }

  // Aggregate each group
  const aggregated = [];
  const groupKeys = Object.keys(groups).slice(0, maxGroups);

  for (const key of groupKeys) {
    const group = groups[key];
    const agg = { [groupBy]: key };

    // Sum numeric columns
    const numericColumns = Object.keys(group[0]).filter(
      col => typeof group[0][col] === 'number'
    );

    for (const col of numericColumns) {
      agg[col] = group.reduce((sum, row) => sum + row[col], 0);
    }

    agg._rowCount = group.length;
    aggregated.push(agg);
  }

  return aggregated;
}

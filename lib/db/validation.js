/**
 * SQL Security Validation
 *
 * Validates SQL queries for security and correctness before execution
 */

import { TABLE_SCHEMAS, CLICKHOUSE_TABLES, getAllTables } from './schema-clickhouse.js';

/**
 * Dangerous SQL keywords that should not appear in user-generated queries
 */
const DANGEROUS_KEYWORDS = [
  'DROP',
  'DELETE',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'REPLACE',
  'INSERT',
  'UPDATE',
  'GRANT',
  'REVOKE',
  'EXEC',
  'EXECUTE',
  'INFORMATION_SCHEMA',
  'SYSTEM',
  'ADMIN',
  'USER',
  'PASSWORD',
];

/**
 * SQL injection patterns
 */
const INJECTION_PATTERNS = [
  /;.*(-{2}|\/\*)/,          // Comment injection
  /UNION\s+SELECT/i,          // Union-based injection
  /OR\s+1\s*=\s*1/i,          // Tautology
  /AND\s+1\s*=\s*1/i,         // Tautology
  /'.*OR.*'/i,                // String-based tautology
  /--/,                       // SQL comment
  /\/\*/,                     // Multi-line comment
  /\bxp_cmdshell\b/i,         // Command execution
  /\bEXEC\(/i,                // Execute command
];

/**
 * Validate SQL query for security
 *
 * @param {string} sql - SQL query to validate
 * @returns {{ valid: boolean, error?: string, warnings?: string[] }}
 */
export function validateSQL(sql) {
  const warnings = [];

  if (!sql || typeof sql !== 'string') {
    return { valid: false, error: 'SQL query must be a non-empty string' };
  }

  // Check for dangerous keywords
  const upperSQL = sql.toUpperCase();
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (upperSQL.includes(keyword)) {
      return {
        valid: false,
        error: `Dangerous keyword detected: ${keyword}. Only SELECT queries are allowed.`,
      };
    }
  }

  // Check for SQL injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sql)) {
      return {
        valid: false,
        error: `Potential SQL injection pattern detected: ${pattern.toString()}`,
      };
    }
  }

  // Must start with SELECT
  if (!upperSQL.trim().startsWith('SELECT')) {
    return {
      valid: false,
      error: 'Query must start with SELECT. Only read operations are allowed.',
    };
  }

  // Check for multiple statements (semicolon followed by non-whitespace)
  if (/;\s*\S/.test(sql)) {
    return {
      valid: false,
      error: 'Multiple SQL statements not allowed. Only single SELECT queries are permitted.',
    };
  }

  // Warn if no WHERE clause (performance concern)
  if (!upperSQL.includes('WHERE')) {
    warnings.push('Query has no WHERE clause - this may return large result sets');
  }

  // Warn if no LIMIT clause
  if (!upperSQL.includes('LIMIT')) {
    warnings.push('Query has no LIMIT clause - consider adding one for performance');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate that query only accesses allowed tables
 *
 * @param {string} sql - SQL query to validate
 * @returns {{ valid: boolean, error?: string, tables?: string[] }}
 */
export function validateTables(sql) {
  const allowedTables = getAllTables();
  const upperSQL = sql.toUpperCase();

  // Extract table names from FROM and JOIN clauses
  const fromMatches = upperSQL.match(/FROM\s+(\w+)/gi) || [];
  const joinMatches = upperSQL.match(/JOIN\s+(\w+)/gi) || [];
  const matches = [...fromMatches, ...joinMatches];

  const usedTables = matches
    .map(match => match.replace(/FROM\s+|JOIN\s+/i, '').trim().toLowerCase())
    .filter(Boolean);

  if (usedTables.length === 0) {
    return {
      valid: false,
      error: 'No tables found in query',
    };
  }

  // Check each table is in allowed list
  for (const table of usedTables) {
    if (!allowedTables.includes(table)) {
      return {
        valid: false,
        error: `Table "${table}" is not in the allowed table list`,
      };
    }
  }

  return {
    valid: true,
    tables: usedTables,
  };
}

/**
 * Validate that query includes required filters (e.g., klaviyo_public_id)
 *
 * @param {string} sql - SQL query to validate
 * @param {string[]} klaviyoIds - Required Klaviyo IDs to filter by
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRequiredFilters(sql, klaviyoIds) {
  if (!klaviyoIds || klaviyoIds.length === 0) {
    return {
      valid: false,
      error: 'No Klaviyo IDs provided for filtering',
    };
  }

  const upperSQL = sql.toUpperCase();

  // Check if query includes klaviyo_public_id filter
  if (!upperSQL.includes('KLAVIYO_PUBLIC_ID')) {
    return {
      valid: false,
      error: 'Query must include klaviyo_public_id filter for security',
    };
  }

  // Verify all provided IDs are in the query
  const missingIds = klaviyoIds.filter(id => !sql.includes(id));
  if (missingIds.length > 0) {
    return {
      valid: false,
      error: `Query must filter by all provided Klaviyo IDs. Missing: ${missingIds.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize SQL query (add safety limits if missing)
 *
 * @param {string} sql - SQL query to sanitize
 * @param {number} maxLimit - Maximum LIMIT value (default: 10000)
 * @returns {string} - Sanitized SQL query
 */
export function sanitizeSQL(sql, maxLimit = 10000) {
  let sanitized = sql.trim();

  // Remove trailing semicolon if present
  if (sanitized.endsWith(';')) {
    sanitized = sanitized.slice(0, -1).trim();
  }

  // Add LIMIT if not present
  if (!sanitized.toUpperCase().includes('LIMIT')) {
    sanitized += ` LIMIT ${maxLimit}`;
  } else {
    // Ensure LIMIT doesn't exceed maxLimit
    sanitized = sanitized.replace(
      /LIMIT\s+(\d+)/i,
      (match, limit) => {
        const limitNum = parseInt(limit, 10);
        return `LIMIT ${Math.min(limitNum, maxLimit)}`;
      }
    );
  }

  return sanitized;
}

/**
 * Comprehensive SQL validation
 *
 * @param {string} sql - SQL query to validate
 * @param {string[]} klaviyoIds - Required Klaviyo IDs to filter by
 * @returns {{ valid: boolean, error?: string, warnings?: string[], sanitized?: string }}
 */
export function validateQuery(sql, klaviyoIds) {
  // Step 1: Basic SQL security validation
  const sqlValidation = validateSQL(sql);
  if (!sqlValidation.valid) {
    return sqlValidation;
  }

  // Step 2: Table access validation
  const tableValidation = validateTables(sql);
  if (!tableValidation.valid) {
    return tableValidation;
  }

  // Step 3: Required filters validation
  const filterValidation = validateRequiredFilters(sql, klaviyoIds);
  if (!filterValidation.valid) {
    return filterValidation;
  }

  // Step 4: Sanitize query
  const sanitized = sanitizeSQL(sql);

  return {
    valid: true,
    sanitized,
    warnings: sqlValidation.warnings,
    tables: tableValidation.tables,
  };
}

/**
 * Validate column names in query
 *
 * @param {string} sql - SQL query
 * @param {string} tableName - Table name to validate against
 * @returns {{ valid: boolean, error?: string, invalidColumns?: string[] }}
 */
export function validateColumns(sql, tableName) {
  const schema = TABLE_SCHEMAS[tableName];
  if (!schema) {
    return {
      valid: false,
      error: `Unknown table: ${tableName}`,
    };
  }

  const allowedColumns = Object.keys(schema.columns);

  // Extract column names from SELECT clause
  const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
  if (!selectMatch) {
    return {
      valid: false,
      error: 'Could not parse SELECT clause',
    };
  }

  const selectClause = selectMatch[1];

  // Skip validation if using SELECT *
  if (selectClause.trim() === '*') {
    return { valid: true };
  }

  // Extract individual column references (simplified parsing)
  const columnRefs = selectClause
    .split(',')
    .map(col => {
      // Remove aggregations, aliases, and functions
      const cleaned = col
        .replace(/\b(SUM|AVG|COUNT|MAX|MIN|ROUND)\s*\(/gi, '')
        .replace(/\)/g, '')
        .replace(/\s+as\s+.*/i, '')
        .trim();
      return cleaned.split('.').pop(); // Get column name after dot
    })
    .filter(Boolean);

  // Check each column exists in schema
  const invalidColumns = columnRefs.filter(
    col => !allowedColumns.includes(col.toLowerCase()) && col !== '*'
  );

  if (invalidColumns.length > 0) {
    return {
      valid: false,
      error: `Invalid columns for table ${tableName}`,
      invalidColumns,
    };
  }

  return { valid: true };
}

/**
 * Estimate query complexity (for cost estimation)
 *
 * @param {string} sql - SQL query
 * @returns {{ complexity: 'low' | 'medium' | 'high', reasons: string[] }}
 */
export function estimateQueryComplexity(sql) {
  const upperSQL = sql.toUpperCase();
  const reasons = [];
  let score = 0;

  // Check for joins
  const joinCount = (upperSQL.match(/JOIN/g) || []).length;
  if (joinCount > 0) {
    score += joinCount * 2;
    reasons.push(`${joinCount} JOIN operations`);
  }

  // Check for subqueries
  const subqueryCount = (upperSQL.match(/\(SELECT/g) || []).length;
  if (subqueryCount > 0) {
    score += subqueryCount * 3;
    reasons.push(`${subqueryCount} subqueries`);
  }

  // Check for aggregations
  const aggFunctions = ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN', 'GROUP BY'];
  const aggCount = aggFunctions.filter(fn => upperSQL.includes(fn)).length;
  if (aggCount > 0) {
    score += aggCount;
    reasons.push(`${aggCount} aggregation functions`);
  }

  // Check for DISTINCT
  if (upperSQL.includes('DISTINCT')) {
    score += 2;
    reasons.push('DISTINCT operation');
  }

  // Check for LIMIT
  if (!upperSQL.includes('LIMIT')) {
    score += 3;
    reasons.push('No LIMIT clause');
  }

  // Determine complexity
  let complexity = 'low';
  if (score >= 8) {
    complexity = 'high';
  } else if (score >= 4) {
    complexity = 'medium';
  }

  return { complexity, reasons };
}

import { createClient } from '@clickhouse/client';

let clickhouseClient = null;

/**
 * Get or create a ClickHouse client connection
 * SOC2: CC6.2 Secure Connection | ISO 27001: A.13.1 Network Security
 */
export function getClickHouseClient() {
  if (!clickhouseClient) {
    const config = {
      url: process.env.CLICKHOUSE_SECURE === 'true' 
        ? `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || 8443}`
        : `http://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || 8123}`,
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD,
      database: process.env.CLICKHOUSE_DATABASE || 'default',
      application: 'wizel_app',
      clickhouse_settings: {
        // Enable query profiling for monitoring
        log_queries: 1,
        // Set reasonable timeout
        max_execution_time: 30,
        // Enable compression for better performance
        enable_http_compression: 1,
      },
      // Connection pool settings
      max_open_connections: 10,
      request_timeout: 30000, // 30 seconds
      compression: {
        request: true,
        response: true,
      },
    };

    clickhouseClient = createClient(config);
  }

  return clickhouseClient;
}

/**
 * Test ClickHouse connection
 */
export async function testConnection() {
  try {
    const client = getClickHouseClient();
    const result = await client.query({
      query: 'SELECT 1 as test',
      format: 'JSONEachRow',
    });
    
    const data = await result.json();
    return { success: true, data };
  } catch (error) {
    console.error('ClickHouse connection test failed:', error);
    return { 
      success: false, 
      error: error.message || 'Connection failed',
      details: error.toString()
    };
  }
}

/**
 * Get all tables with their metadata
 */
export async function getTables() {
  try {
    const client = getClickHouseClient();
    
    // Get all tables with their metadata
    const result = await client.query({
      query: `
        SELECT 
          database,
          name as table_name,
          engine,
          total_rows,
          total_bytes,
          formatReadableSize(total_bytes) as size_readable,
          formatReadableQuantity(total_rows) as rows_readable,
          metadata_modification_time,
          create_table_query
        FROM system.tables
        WHERE database NOT IN ('system', 'information_schema', 'INFORMATION_SCHEMA')
        ORDER BY database, table_name
      `,
      format: 'JSONEachRow',
    });
    
    const tables = await result.json();
    return { success: true, tables };
  } catch (error) {
    console.error('Failed to get tables:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch tables',
      tables: []
    };
  }
}

/**
 * Get detailed statistics for a specific table
 */
export async function getTableStats(database, tableName) {
  try {
    const client = getClickHouseClient();
    
    // Get column information
    const columnsResult = await client.query({
      query: `
        SELECT 
          name,
          type,
          data_compressed_bytes,
          data_uncompressed_bytes,
          formatReadableSize(data_compressed_bytes) as compressed_size,
          formatReadableSize(data_uncompressed_bytes) as uncompressed_size,
          marks_bytes
        FROM system.columns
        WHERE database = '${database}' AND table = '${tableName}'
        ORDER BY position
      `,
      format: 'JSONEachRow',
    });
    
    // Get partition information
    const partitionsResult = await client.query({
      query: `
        SELECT 
          partition,
          partition_id,
          rows,
          bytes_on_disk,
          formatReadableSize(bytes_on_disk) as size_readable,
          formatReadableQuantity(rows) as rows_readable,
          min_date,
          max_date
        FROM system.parts
        WHERE database = '${database}' AND table = '${tableName}' AND active
        ORDER BY partition
      `,
      format: 'JSONEachRow',
    });
    
    // Get sample data (first 10 rows)
    const sampleResult = await client.query({
      query: `SELECT * FROM ${database}.${tableName} LIMIT 10`,
      format: 'JSONEachRow',
    });
    
    const columns = await columnsResult.json();
    const partitions = await partitionsResult.json();
    const sampleData = await sampleResult.json();
    
    return { 
      success: true, 
      columns,
      partitions,
      sampleData
    };
  } catch (error) {
    console.error(`Failed to get stats for ${database}.${tableName}:`, error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch table stats',
      columns: [],
      partitions: [],
      sampleData: []
    };
  }
}

/**
 * Get system metrics and health
 */
export async function getSystemMetrics() {
  try {
    const client = getClickHouseClient();
    
    // Get system metrics
    const metricsResult = await client.query({
      query: `
        SELECT 
          metric,
          value,
          description
        FROM system.metrics
        WHERE metric IN (
          'Query', 'Merge', 'ReplicatedFetch', 'ReplicatedSend',
          'MemoryTracking', 'DiskSpaceReservedForMerge',
          'BackgroundPoolTask', 'BackgroundMovePoolTask'
        )
        ORDER BY metric
      `,
      format: 'JSONEachRow',
    });
    
    // Get uptime and version
    const uptimeResult = await client.query({
      query: `
        SELECT 
          version() as version,
          uptime() as uptime_seconds,
          formatReadableTimeDelta(uptime()) as uptime_readable,
          now() as server_time
      `,
      format: 'JSONEachRow',
    });
    
    // Get current queries
    const queriesResult = await client.query({
      query: `
        SELECT 
          query_id,
          user,
          elapsed,
          formatReadableTimeDelta(elapsed) as elapsed_readable,
          rows_read,
          formatReadableQuantity(rows_read) as rows_readable,
          bytes_read,
          formatReadableSize(bytes_read) as bytes_readable,
          memory_usage,
          formatReadableSize(memory_usage) as memory_readable,
          query
        FROM system.processes
        WHERE query NOT LIKE '%system.processes%'
        ORDER BY elapsed DESC
        LIMIT 10
      `,
      format: 'JSONEachRow',
    });
    
    const metrics = await metricsResult.json();
    const uptime = await uptimeResult.json();
    const queries = await queriesResult.json();
    
    return { 
      success: true, 
      metrics,
      uptime: uptime[0] || {},
      activeQueries: queries
    };
  } catch (error) {
    console.error('Failed to get system metrics:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch system metrics',
      metrics: [],
      uptime: {},
      activeQueries: []
    };
  }
}

/**
 * Execute a custom query (with safety checks)
 */
export async function executeQuery(query, format = 'JSONEachRow') {
  try {
    // Basic safety check - only allow SELECT queries in test environment
    const normalizedQuery = query.trim().toUpperCase();
    if (!normalizedQuery.startsWith('SELECT') && !normalizedQuery.startsWith('SHOW') && !normalizedQuery.startsWith('DESCRIBE')) {
      throw new Error('Only SELECT, SHOW, and DESCRIBE queries are allowed in test mode');
    }
    
    const client = getClickHouseClient();
    const result = await client.query({
      query,
      format,
    });
    
    const data = await result.json();
    return { success: true, data };
  } catch (error) {
    console.error('Query execution failed:', error);
    return { 
      success: false, 
      error: error.message || 'Query execution failed',
      data: []
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const client = getClickHouseClient();
    
    const result = await client.query({
      query: `
        SELECT 
          database,
          count() as table_count,
          sum(total_rows) as total_rows,
          formatReadableQuantity(sum(total_rows)) as total_rows_readable,
          sum(total_bytes) as total_bytes,
          formatReadableSize(sum(total_bytes)) as total_size_readable
        FROM system.tables
        WHERE database NOT IN ('system', 'information_schema', 'INFORMATION_SCHEMA')
        GROUP BY database
        ORDER BY total_bytes DESC
      `,
      format: 'JSONEachRow',
    });
    
    const databases = await result.json();
    return { success: true, databases };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch database stats',
      databases: []
    };
  }
}

/**
 * Close the ClickHouse connection
 */
export async function closeConnection() {
  if (clickhouseClient) {
    await clickhouseClient.close();
    clickhouseClient = null;
  }
}
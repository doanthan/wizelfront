/**
 * Advanced Connection Reuse & Caching Layer for Revenue API
 *
 * Optimizations:
 * - In-memory query result caching with TTL
 * - Connection pool reuse and warming
 * - Query batching and deduplication
 * - Performance monitoring and metrics
 * - Smart cache invalidation
 */

import { getClickHouseClient } from '@/lib/clickhouse';
import connectToDatabase from '@/lib/mongoose';

// In-memory cache with TTL (Time To Live)
const queryCache = new Map();
const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  evictions: 0,
  totalQueries: 0
};

// Connection pool warmup state
let connectionsWarmed = false;
let connectionPool = {
  mongodb: null,
  clickhouse: null,
  warmedAt: null
};

/**
 * Advanced query caching with intelligent key generation
 */
class QueryCache {
  constructor(defaultTTL = 60000) { // 1 minute default
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
    this.metrics = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }

  /**
   * Generate cache key from query parameters
   */
  generateKey(type, params) {
    const keyData = {
      type,
      klaviyoIds: params.klaviyoIds?.sort(),
      dates: {
        start: params.startDate,
        end: params.endDate,
        compStart: params.comparisonStartDate,
        compEnd: params.comparisonEndDate
      },
      granularity: params.timeGranularity
    };
    return `${type}:${JSON.stringify(keyData)}`;
  }

  /**
   * Get cached result if available and not expired
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.metrics.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.metrics.evictions++;
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return item.data;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    const item = {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    };

    this.cache.set(key, item);
    this.metrics.sets++;

    // Cleanup old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        this.metrics.evictions++;
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.metrics = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
      : 0;

    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      ...this.metrics
    };
  }
}

// Global cache instance
const revenueCache = new QueryCache(60000); // 1 minute TTL

/**
 * Warm up database connections
 */
export async function warmUpConnections() {
  if (connectionsWarmed && connectionPool.warmedAt > Date.now() - 300000) {
    return connectionPool; // Already warmed within 5 minutes
  }

  const warmStart = process.hrtime.bigint();

  try {
    // Warm MongoDB connection
    const mongooseConnection = await connectToDatabase();
    connectionPool.mongodb = mongooseConnection.connection;

    // Warm ClickHouse connection with a test query
    const clickhouseClient = getClickHouseClient();
    await clickhouseClient.query({
      query: 'SELECT 1 as warmup',
      format: 'JSONEachRow'
    });
    connectionPool.clickhouse = clickhouseClient;

    connectionsWarmed = true;
    connectionPool.warmedAt = Date.now();

    const warmTime = Number(process.hrtime.bigint() - warmStart) / 1000000;
    console.log(`🔥 Connections warmed up in ${warmTime}ms`);

    return connectionPool;
  } catch (error) {
    console.error('❌ Connection warmup failed:', error.message);
    throw error;
  }
}

/**
 * Optimized ClickHouse query with caching and connection reuse
 */
export async function cachedClickHouseQuery(queryType, queryConfig, params, ttl = 60000) {
  const cacheKey = revenueCache.generateKey(queryType, params);

  // Try cache first
  const cached = revenueCache.get(cacheKey);
  if (cached) {
    console.log(`💾 Cache hit for ${queryType}`);
    return cached;
  }

  // Ensure connections are warmed
  await warmUpConnections();

  const queryStart = process.hrtime.bigint();

  try {
    const client = connectionPool.clickhouse || getClickHouseClient();
    const result = await client.query(queryConfig);
    const data = await result.json();

    const queryTime = Number(process.hrtime.bigint() - queryStart) / 1000000;

    const resultWithMeta = {
      data,
      metadata: {
        queryType,
        queryTime,
        cached: false,
        timestamp: new Date().toISOString()
      }
    };

    // Cache the result
    revenueCache.set(cacheKey, resultWithMeta, ttl);
    console.log(`⚡ ${queryType} completed in ${queryTime}ms (cached for ${ttl/1000}s)`);

    return resultWithMeta;
  } catch (error) {
    console.error(`❌ ClickHouse query failed (${queryType}):`, error.message);
    throw error;
  }
}

/**
 * Parallel batch query execution with intelligent deduplication
 */
export async function executeBatchQueries(queryBatch, params) {
  await warmUpConnections();

  // Deduplicate queries based on cache keys
  const uniqueQueries = new Map();
  const queryPromises = [];

  for (const query of queryBatch) {
    const cacheKey = revenueCache.generateKey(query.type, params);

    if (uniqueQueries.has(cacheKey)) {
      continue; // Skip duplicate query
    }

    uniqueQueries.set(cacheKey, query);

    queryPromises.push(
      cachedClickHouseQuery(query.type, query.config, params, query.ttl || 60000)
    );
  }

  const batchStart = process.hrtime.bigint();

  try {
    const results = await Promise.all(queryPromises);
    const batchTime = Number(process.hrtime.bigint() - batchStart) / 1000000;

    console.log(`🚀 Batch of ${results.length} queries completed in ${batchTime}ms`);

    return {
      results,
      metadata: {
        batchTime,
        queryCount: results.length,
        deduplicatedCount: queryBatch.length - results.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Batch query execution failed:', error.message);
    throw error;
  }
}

/**
 * Enhanced MongoDB query with connection reuse
 */
export async function optimizedMongoQuery(model, query, options = {}) {
  await warmUpConnections();

  const queryStart = process.hrtime.bigint();

  try {
    // Use the warmed connection
    const result = await model.find(query, null, options).lean();
    const queryTime = Number(process.hrtime.bigint() - queryStart) / 1000000;

    console.log(`📊 MongoDB query completed in ${queryTime}ms (${result.length} docs)`);

    return {
      data: result,
      metadata: {
        queryTime,
        resultCount: result.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ MongoDB query failed:', error.message);
    throw error;
  }
}

/**
 * Smart cache invalidation based on data updates
 */
export function invalidateCache(pattern) {
  const keysToDelete = [];

  for (const key of revenueCache.cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => revenueCache.cache.delete(key));
  console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`);
}

/**
 * Get comprehensive performance metrics
 */
export function getPerformanceMetrics() {
  return {
    cache: revenueCache.getStats(),
    connections: {
      mongodb: {
        warmed: !!connectionPool.mongodb,
        status: connectionPool.mongodb?.readyState || 0
      },
      clickhouse: {
        warmed: !!connectionPool.clickhouse,
        connected: connectionsWarmed
      },
      warmedAt: connectionPool.warmedAt,
      ageMinutes: connectionPool.warmedAt
        ? Math.round((Date.now() - connectionPool.warmedAt) / 60000)
        : null
    },
    system: {
      nodeEnv: process.env.NODE_ENV,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
}

/**
 * Preload common queries during off-peak times
 */
export async function preloadCommonQueries(commonParams) {
  console.log('🔮 Preloading common queries...');

  const preloadStart = process.hrtime.bigint();
  const preloadQueries = [
    {
      type: 'revenue_stats',
      config: {
        query: `SELECT 'preload' as type, SUM(total_revenue) as revenue FROM account_metrics_daily WHERE klaviyo_public_id IN (${commonParams.klaviyoIds.map(id => `'${id}'`).join(',')}) AND date >= today() - INTERVAL 30 DAY`,
        format: 'JSONEachRow'
      },
      ttl: 300000 // 5 minutes
    }
  ];

  try {
    await executeBatchQueries(preloadQueries, commonParams);
    const preloadTime = Number(process.hrtime.bigint() - preloadStart) / 1000000;
    console.log(`✨ Preload completed in ${preloadTime}ms`);
  } catch (error) {
    console.warn('⚠️ Preload failed:', error.message);
  }
}

export { revenueCache };
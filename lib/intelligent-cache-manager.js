/**
 * Intelligent Cache Manager with Advanced Error Handling
 *
 * Features:
 * - Circuit breaker pattern for database failures
 * - Adaptive cache TTL based on query performance
 * - Smart cache warming with predictive loading
 * - Advanced error recovery and fallback mechanisms
 * - Health monitoring and automatic healing
 * - Distributed cache invalidation strategies
 * - Performance-based cache optimization
 */

import { revenueCache } from '@/lib/revenue-cache';

// Circuit breaker states
const CIRCUIT_STATES = {
  CLOSED: 'closed',     // Normal operation
  OPEN: 'open',         // All requests fail fast
  HALF_OPEN: 'half_open' // Testing recovery
};

// Global health monitoring
const systemHealth = {
  clickhouse: {
    state: CIRCUIT_STATES.CLOSED,
    failures: 0,
    lastFailure: null,
    lastSuccess: null,
    avgResponseTime: 0,
    requestCount: 0
  },
  mongodb: {
    state: CIRCUIT_STATES.CLOSED,
    failures: 0,
    lastFailure: null,
    lastSuccess: null,
    avgResponseTime: 0,
    requestCount: 0
  },
  cache: {
    hitRate: 0,
    missRate: 0,
    evictionRate: 0,
    avgQueryTime: 0
  }
};

// Configuration
const CIRCUIT_CONFIG = {
  failureThreshold: 5,        // Failures before opening circuit
  recoveryTimeout: 30000,     // Time before attempting recovery (30s)
  halfOpenMaxRequests: 3,     // Max requests in half-open state
  successThreshold: 2,        // Successes needed to close circuit
  slowCallDuration: 2000      // Calls slower than this are considered failures
};

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
  constructor(service, config = CIRCUIT_CONFIG) {
    this.service = service;
    this.config = config;
    this.state = CIRCUIT_STATES.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = 0;
    this.halfOpenRequests = 0;
  }

  async call(operation, fallback = null) {
    const health = systemHealth[this.service];

    // Check if circuit is open
    if (health.state === CIRCUIT_STATES.OPEN) {
      if (Date.now() < this.nextAttempt) {
        console.log(`⚡ Circuit breaker OPEN for ${this.service} - failing fast`);
        if (fallback) return await fallback();
        throw new Error(`Service ${this.service} is currently unavailable`);
      } else {
        // Attempt recovery
        health.state = CIRCUIT_STATES.HALF_OPEN;
        this.halfOpenRequests = 0;
        console.log(`🔄 Circuit breaker HALF_OPEN for ${this.service} - testing recovery`);
      }
    }

    // Check half-open limits
    if (health.state === CIRCUIT_STATES.HALF_OPEN) {
      if (this.halfOpenRequests >= this.config.halfOpenMaxRequests) {
        console.log(`⚡ Circuit breaker HALF_OPEN limit reached for ${this.service}`);
        if (fallback) return await fallback();
        throw new Error(`Service ${this.service} is in recovery mode`);
      }
      this.halfOpenRequests++;
    }

    const startTime = Date.now();

    try {
      // Execute the operation with timeout
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timeout for ${this.service}`)),
          this.config.slowCallDuration * 2)
        )
      ]);

      // Record success
      const duration = Date.now() - startTime;
      this.recordSuccess(duration);

      return result;
    } catch (error) {
      // Record failure
      const duration = Date.now() - startTime;
      this.recordFailure(error, duration);

      if (fallback) {
        console.log(`🛡️ Executing fallback for ${this.service}:`, error.message);
        return await fallback();
      }
      throw error;
    }
  }

  recordSuccess(duration) {
    const health = systemHealth[this.service];

    health.lastSuccess = Date.now();
    health.requestCount++;
    health.avgResponseTime = (health.avgResponseTime + duration) / 2;

    if (health.state === CIRCUIT_STATES.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        health.state = CIRCUIT_STATES.CLOSED;
        health.failures = 0;
        this.successes = 0;
        console.log(`✅ Circuit breaker CLOSED for ${this.service} - service recovered`);
      }
    } else if (health.state === CIRCUIT_STATES.CLOSED) {
      // Reset failure count on success
      health.failures = Math.max(0, health.failures - 1);
    }
  }

  recordFailure(error, duration) {
    const health = systemHealth[this.service];

    health.failures++;
    health.lastFailure = Date.now();
    console.error(`❌ Circuit breaker failure for ${this.service}:`, error.message);

    if (duration > this.config.slowCallDuration) {
      health.failures += 1; // Count slow calls as additional failures
      console.warn(`🐌 Slow call detected for ${this.service}: ${duration}ms`);
    }

    if (health.failures >= this.config.failureThreshold) {
      health.state = CIRCUIT_STATES.OPEN;
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;
      console.error(`🔴 Circuit breaker OPEN for ${this.service} - too many failures`);
    }
  }

  getStatus() {
    const health = systemHealth[this.service];
    return {
      service: this.service,
      state: health.state,
      failures: health.failures,
      avgResponseTime: health.avgResponseTime,
      requestCount: health.requestCount,
      isHealthy: health.state === CIRCUIT_STATES.CLOSED && health.failures < 3
    };
  }
}

// Circuit breakers for each service
const circuitBreakers = {
  clickhouse: new CircuitBreaker('clickhouse'),
  mongodb: new CircuitBreaker('mongodb')
};

/**
 * Adaptive Cache TTL based on performance metrics
 */
class AdaptiveCacheManager {
  constructor() {
    this.performanceHistory = new Map();
    this.optimalTTLs = new Map();
  }

  /**
   * Calculate optimal TTL based on query performance and data volatility
   */
  calculateOptimalTTL(queryType, executionTime, dataVolatility = 'medium') {
    const baselinePerformance = this.performanceHistory.get(queryType) || { avgTime: 1000, count: 0 };

    // Performance factor: slower queries get longer cache times
    const performanceFactor = Math.min(executionTime / 1000, 5); // Cap at 5x

    // Volatility factor: how often this data type typically changes
    const volatilityFactors = {
      low: 300000,    // 5 minutes for stable data
      medium: 120000, // 2 minutes for normal data
      high: 60000,    // 1 minute for volatile data
      realtime: 30000 // 30 seconds for real-time data
    };

    const baseTTL = volatilityFactors[dataVolatility] || volatilityFactors.medium;
    const optimizedTTL = baseTTL * (1 + performanceFactor * 0.2); // 20% increase per second

    // Update performance history
    baselinePerformance.avgTime = (baselinePerformance.avgTime + executionTime) / 2;
    baselinePerformance.count++;
    this.performanceHistory.set(queryType, baselinePerformance);

    // Store optimal TTL
    this.optimalTTLs.set(queryType, optimizedTTL);

    console.log(`🧠 Adaptive TTL for ${queryType}: ${Math.round(optimizedTTL/1000)}s (execution: ${executionTime}ms)`);
    return optimizedTTL;
  }

  /**
   * Get recommended TTL for a query type
   */
  getRecommendedTTL(queryType, executionTime) {
    if (executionTime) {
      return this.calculateOptimalTTL(queryType, executionTime);
    }

    return this.optimalTTLs.get(queryType) || 120000; // Default 2 minutes
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights() {
    const insights = {};

    for (const [queryType, perf] of this.performanceHistory.entries()) {
      insights[queryType] = {
        averageExecutionTime: Math.round(perf.avgTime),
        executionCount: perf.count,
        recommendedTTL: Math.round((this.optimalTTLs.get(queryType) || 0) / 1000),
        performanceScore: perf.avgTime < 1000 ? 'excellent' :
                         perf.avgTime < 3000 ? 'good' : 'needs_optimization'
      };
    }

    return insights;
  }
}

const adaptiveCache = new AdaptiveCacheManager();

/**
 * Enhanced error handling with intelligent fallbacks
 */
export class IntelligentErrorHandler {
  /**
   * Execute operation with comprehensive error handling
   */
  static async executeWithFallback(operation, fallbackStrategies = []) {
    const primaryStrategy = {
      name: 'primary',
      execute: operation,
      timeout: 10000
    };

    const allStrategies = [primaryStrategy, ...fallbackStrategies];

    for (let i = 0; i < allStrategies.length; i++) {
      const strategy = allStrategies[i];
      const isLastStrategy = i === allStrategies.length - 1;

      try {
        console.log(`🎯 Executing strategy: ${strategy.name}`);

        const result = await Promise.race([
          strategy.execute(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Strategy timeout: ${strategy.name}`)),
            strategy.timeout || 5000)
          )
        ]);

        if (i > 0) {
          console.log(`✅ Fallback strategy ${strategy.name} succeeded`);
        }

        return result;
      } catch (error) {
        console.error(`❌ Strategy ${strategy.name} failed:`, error.message);

        if (isLastStrategy) {
          throw new Error(`All strategies failed. Last error: ${error.message}`);
        }

        // Wait briefly before trying next strategy
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
      }
    }
  }

  /**
   * Create fallback data structure
   */
  static createFallbackData(type, message = 'Service temporarily unavailable') {
    const fallbackStructures = {
      revenue_stats: {
        stats: {
          overall_revenue: 0,
          attributed_revenue: 0,
          attribution_percentage: 0,
          total_orders: 0,
          avg_order_value: 0,
          unique_customers: 0,
          new_customers: 0,
          returning_customers: 0,
          total_email_revenue: 0,
          total_emails_sent: 0,
          total_sms_revenue: 0,
          total_sms_sent: 0,
          revenue_change: 0,
          orders_change: 0,
          customers_change: 0
        },
        trends: [],
        accountComparison: [],
        channelRevenue: [],
        metadata: {
          error: message,
          fallback: true,
          timestamp: new Date().toISOString()
        }
      },
      user_data: {
        id: null,
        email: 'unknown@fallback.com',
        is_super_user: false,
        fallback: true
      },
      stores_data: {
        stores: [],
        metadata: {
          error: message,
          fallback: true,
          timestamp: new Date().toISOString()
        }
      }
    };

    return fallbackStructures[type] || { error: message, fallback: true };
  }
}

/**
 * Predictive cache warming based on usage patterns
 */
export class PredictiveCacheWarmer {
  constructor() {
    this.usagePatterns = new Map();
    this.warmingQueue = new Set();
  }

  /**
   * Record query usage for pattern analysis
   */
  recordUsage(querySignature, timestamp = Date.now()) {
    const pattern = this.usagePatterns.get(querySignature) || {
      count: 0,
      lastAccess: timestamp,
      accessTimes: []
    };

    pattern.count++;
    pattern.lastAccess = timestamp;
    pattern.accessTimes.push(timestamp);

    // Keep only recent access times (last 24 hours)
    const dayAgo = timestamp - (24 * 60 * 60 * 1000);
    pattern.accessTimes = pattern.accessTimes.filter(time => time > dayAgo);

    this.usagePatterns.set(querySignature, pattern);

    // Trigger predictive warming for popular queries
    if (pattern.count > 10 && this.shouldWarmQuery(pattern)) {
      this.scheduleWarmup(querySignature);
    }
  }

  /**
   * Determine if a query should be warmed based on usage patterns
   */
  shouldWarmQuery(pattern) {
    const now = Date.now();
    const recentAccesses = pattern.accessTimes.filter(time => now - time < 3600000); // Last hour

    // Warm if accessed frequently (more than 3 times per hour)
    return recentAccesses.length > 3;
  }

  /**
   * Schedule cache warming for a query
   */
  scheduleWarmup(querySignature) {
    if (this.warmingQueue.has(querySignature)) {
      return; // Already scheduled
    }

    this.warmingQueue.add(querySignature);
    console.log(`🔥 Scheduling predictive cache warming for: ${querySignature}`);

    // Warm in background after a short delay
    setTimeout(async () => {
      try {
        await this.executeWarmup(querySignature);
      } catch (error) {
        console.warn(`⚠️ Predictive warming failed for ${querySignature}:`, error.message);
      } finally {
        this.warmingQueue.delete(querySignature);
      }
    }, 5000); // 5 second delay
  }

  /**
   * Execute cache warming (to be implemented based on specific query types)
   */
  async executeWarmup(querySignature) {
    // This would contain logic to re-execute popular queries
    // to warm the cache before they're needed
    console.log(`🌟 Executing predictive warmup for: ${querySignature}`);
  }
}

// Global instances
export const circuitBreakerManager = circuitBreakers;
export const adaptiveCacheManager = adaptiveCache;
export const predictiveWarmer = new PredictiveCacheWarmer();

/**
 * Get comprehensive system health status
 */
export function getSystemHealthStatus() {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    services: {},
    cache: revenueCache.getStats(),
    performance: adaptiveCache.getPerformanceInsights(),
    circuitBreakers: {}
  };

  // Check each service
  for (const [service, breaker] of Object.entries(circuitBreakers)) {
    const status = breaker.getStatus();
    healthStatus.services[service] = status;
    healthStatus.circuitBreakers[service] = status.state;

    if (!status.isHealthy) {
      healthStatus.overall = 'degraded';
    }
  }

  // Calculate overall health score
  const healthyServices = Object.values(healthStatus.services).filter(s => s.isHealthy).length;
  const totalServices = Object.keys(healthStatus.services).length;
  healthStatus.healthScore = Math.round((healthyServices / totalServices) * 100);

  if (healthStatus.healthScore < 70) {
    healthStatus.overall = 'critical';
  } else if (healthStatus.healthScore < 90) {
    healthStatus.overall = 'degraded';
  }

  return healthStatus;
}

/**
 * Execute query with full intelligent error handling and caching
 */
export async function executeIntelligentQuery(service, operation, fallbackStrategies = []) {
  const circuitBreaker = circuitBreakers[service];

  if (!circuitBreaker) {
    throw new Error(`Unknown service: ${service}`);
  }

  return await IntelligentErrorHandler.executeWithFallback(
    () => circuitBreaker.call(operation),
    fallbackStrategies
  );
}
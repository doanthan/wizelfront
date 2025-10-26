/**
 * Benchmark Service
 *
 * Provides utilities for fetching, comparing, and generating insights
 * from industry benchmark data for AI chatbot integration
 */

import Benchmark from '@/models/Benchmark';
import connectToDatabase from '@/lib/mongoose';

/**
 * Get benchmark for a store's vertical
 * @param {Object} store - Store document with vertical field
 * @param {Number} year - Optional year (defaults to latest)
 * @returns {Promise<Object|null>} Benchmark document or null
 */
export async function getBenchmarkForStore(store, year = null) {
  if (!store || !store.vertical) {
    return null;
  }

  await connectToDatabase();

  const vertical = store.vertical || 'ecommerce_general';
  return await Benchmark.getActiveBenchmark(vertical, year);
}

/**
 * Compare store metrics to benchmark
 * @param {Object} storeMetrics - Store's actual metrics
 * @param {Object} benchmark - Benchmark data
 * @returns {Object} Comparison results
 */
export function compareStoreToBenchmark(storeMetrics, benchmark) {
  if (!benchmark) {
    return { error: 'No benchmark data available' };
  }

  return Benchmark.comparePerformance(storeMetrics, benchmark);
}

/**
 * Generate AI-friendly insights from benchmark comparison
 * @param {Object} store - Store document
 * @param {Object} storeMetrics - Store's actual metrics
 * @param {Object} benchmark - Benchmark data
 * @returns {Object} Formatted insights for AI context
 */
export function getBenchmarkInsightsForAI(store, storeMetrics, benchmark) {
  if (!benchmark) {
    return null;
  }

  const comparison = compareStoreToBenchmark(storeMetrics, benchmark);

  if (comparison.error) {
    return null;
  }

  const insights = {
    vertical: benchmark.display_name,
    vertical_key: benchmark.vertical,
    version: benchmark.version,

    // Store's performance
    your_performance: {},

    // Benchmark medians and top performers
    benchmarks: {},

    // Improvement opportunities
    opportunities: identifyOpportunities(comparison, benchmark),

    // Industry-specific insights
    industry_insights: benchmark.insights || []
  };

  // Format campaign metrics
  if (storeMetrics.campaigns && comparison.campaigns) {
    insights.your_performance.campaigns = {};
    insights.benchmarks.campaigns = {};

    ['openRate', 'clickRate', 'ctor', 'conversionRate'].forEach(metric => {
      if (storeMetrics.campaigns[metric] !== undefined && comparison.campaigns[metric]) {
        const comp = comparison.campaigns[metric];
        insights.your_performance.campaigns[metric] = {
          value: `${storeMetrics.campaigns[metric]}%`,
          percentile: comp.percentile,
          vs_median: `${comp.vs_median_pct > 0 ? '+' : ''}${comp.vs_median_pct}%`
        };

        if (benchmark.campaigns[metric]) {
          insights.benchmarks.campaigns[metric] = {
            median: `${benchmark.campaigns[metric].median}%`,
            top10: `${benchmark.campaigns[metric].top10}%`
          };
        }
      }
    });
  }

  // Format flow metrics
  if (storeMetrics.flows && comparison.flows) {
    insights.your_performance.flows = {};
    insights.benchmarks.flows = {};

    Object.keys(storeMetrics.flows).forEach(flowType => {
      if (comparison.flows[flowType]) {
        insights.your_performance.flows[flowType] = {};
        insights.benchmarks.flows[flowType] = {};

        ['openRate', 'clickRate', 'conversionRate', 'rpr'].forEach(metric => {
          const flowMetric = storeMetrics.flows[flowType][metric];
          const comp = comparison.flows[flowType][metric];

          if (flowMetric !== undefined && comp) {
            insights.your_performance.flows[flowType][metric] = {
              value: metric === 'rpr' ? `$${flowMetric}` : `${flowMetric}%`,
              percentile: comp.percentile
            };

            if (benchmark.flows[flowType] && benchmark.flows[flowType][metric]) {
              const benchMetric = benchmark.flows[flowType][metric];
              insights.benchmarks.flows[flowType][metric] = {
                median: metric === 'rpr' ? `$${benchMetric.median}` : `${benchMetric.median}%`,
                top10: metric === 'rpr' ? `$${benchMetric.top10}` : `${benchMetric.top10}%`
              };
            }
          }
        });
      }
    });
  }

  return insights;
}

/**
 * Identify improvement opportunities based on comparison
 * @param {Object} comparison - Comparison results from compareStoreToBenchmark
 * @param {Object} benchmark - Benchmark data
 * @returns {Array} List of opportunities
 */
function identifyOpportunities(comparison, benchmark) {
  const opportunities = [];

  // Check campaign metrics
  if (comparison.campaigns) {
    Object.keys(comparison.campaigns).forEach(metric => {
      const perf = comparison.campaigns[metric];

      if (!perf || !perf.percentile) return;

      // If below median or in bottom 25%, flag as opportunity
      if (perf.percentile === 'below_median' || perf.percentile === 'bottom25') {
        opportunities.push({
          area: 'campaigns',
          metric,
          current: perf.actual,
          median: perf.median,
          top10: perf.top10,
          gap_to_top10: `${perf.vs_top10_pct}%`,
          priority: perf.percentile === 'bottom25' ? 'high' : 'medium',
          recommendation: getRecommendation('campaign', metric, benchmark)
        });
      }
    });
  }

  // Check flow metrics
  if (comparison.flows) {
    Object.keys(comparison.flows).forEach(flowType => {
      const flow = comparison.flows[flowType];

      Object.keys(flow).forEach(metric => {
        const perf = flow[metric];

        if (!perf || !perf.percentile) return;

        if (perf.percentile === 'below_median' || perf.percentile === 'bottom25') {
          opportunities.push({
            area: 'flows',
            flow_type: flowType,
            metric,
            current: perf.actual,
            median: perf.median,
            top10: perf.top10,
            gap_to_top10: `${perf.vs_top10_pct}%`,
            priority: perf.percentile === 'bottom25' ? 'high' : 'medium',
            recommendation: getRecommendation('flow', metric, benchmark, flowType)
          });
        }
      });
    });
  }

  return opportunities;
}

/**
 * Get vertical-specific recommendation for improvement
 * @param {String} area - 'campaign' or 'flow'
 * @param {String} metric - Metric name
 * @param {Object} benchmark - Benchmark data
 * @param {String} flowType - Flow type (if area is 'flow')
 * @returns {String} Recommendation text
 */
function getRecommendation(area, metric, benchmark, flowType = null) {
  const vertical = benchmark.vertical || '';
  const recommendations = {
    campaign: {
      openRate: `Review subject lines and sender name. For ${benchmark.display_name}, ${findInsight(benchmark.insights, 'open', 'subject', 'engagement')}`,
      clickRate: `Improve email content and CTAs. ${findInsight(benchmark.insights, 'click', 'engagement', 'content')}`,
      ctor: `Optimize email body content to convert opens into clicks. ${findInsight(benchmark.insights, 'click', 'CTOR', 'engagement')}`,
      conversionRate: `Strengthen conversion funnel and landing pages. ${findInsight(benchmark.insights, 'conversion', 'purchase')}`
    },
    flow: {
      openRate: `Test send timing and refine flow triggers for ${flowType || 'this flow'}`,
      clickRate: `Enhance flow email content with personalized product recommendations`,
      conversionRate: `Add urgency elements and simplify checkout process in ${flowType || 'flow'}`,
      rpr: `Increase ${flowType || 'flow'} RPR by segmenting audience and personalizing offers`
    }
  };

  return recommendations[area]?.[metric] || `Focus on improving ${metric} performance`;
}

/**
 * Find relevant insight from benchmark insights array
 * @param {Array} insights - Array of insight strings
 * @param {...String} keywords - Keywords to search for
 * @returns {String} Matching insight or empty string
 */
function findInsight(insights, ...keywords) {
  if (!insights || !Array.isArray(insights)) return '';

  const found = insights.find(insight => {
    const lower = insight.toLowerCase();
    return keywords.some(keyword => lower.includes(keyword.toLowerCase()));
  });

  return found || '';
}

/**
 * Get all verticals grouped by category
 * @returns {Promise<Object>} Verticals grouped by category
 */
export async function getVerticalsByCategory() {
  await connectToDatabase();

  const benchmarks = await Benchmark.find({ is_active: true })
    .select('vertical display_name category')
    .sort({ category: 1, display_name: 1 })
    .lean();

  const grouped = {};

  benchmarks.forEach(b => {
    const cat = b.category || 'other';

    if (!grouped[cat]) {
      grouped[cat] = [];
    }

    grouped[cat].push({
      value: b.vertical,
      label: b.display_name
    });
  });

  return grouped;
}

/**
 * Get list of all active verticals (flat list)
 * @returns {Promise<Array>} Array of {value, label} objects
 */
export async function getAllVerticals() {
  await connectToDatabase();

  const benchmarks = await Benchmark.find({ is_active: true })
    .select('vertical display_name')
    .sort({ display_name: 1 })
    .lean();

  return benchmarks.map(b => ({
    value: b.vertical,
    label: b.display_name
  }));
}

/**
 * Calculate overall performance score (0-100)
 * @param {Object} comparison - Comparison results
 * @returns {Number} Score from 0-100
 */
export function calculatePerformanceScore(comparison) {
  if (!comparison || comparison.error) {
    return null;
  }

  const scores = [];

  // Score campaigns
  if (comparison.campaigns) {
    Object.values(comparison.campaigns).forEach(metric => {
      if (metric && metric.percentile) {
        scores.push(percentileToScore(metric.percentile));
      }
    });
  }

  // Score flows (if available)
  if (comparison.flows) {
    Object.values(comparison.flows).forEach(flow => {
      Object.values(flow).forEach(metric => {
        if (metric && metric.percentile) {
          scores.push(percentileToScore(metric.percentile));
        }
      });
    });
  }

  if (scores.length === 0) {
    return null;
  }

  // Calculate average score
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Math.round(avgScore);
}

/**
 * Convert percentile string to numeric score
 * @param {String} percentile - Percentile classification
 * @returns {Number} Score from 0-100
 */
function percentileToScore(percentile) {
  const scoreMap = {
    'top10': 95,
    'top25': 80,
    'above_median': 65,
    'below_median': 40,
    'bottom25': 20
  };

  return scoreMap[percentile] || 50;
}

export default {
  getBenchmarkForStore,
  compareStoreToBenchmark,
  getBenchmarkInsightsForAI,
  getVerticalsByCategory,
  getAllVerticals,
  calculatePerformanceScore
};

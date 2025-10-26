import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import mongoose from "mongoose";
import { createClient } from '@clickhouse/client';

/**
 * Email Marketing Insights API
 *
 * Provides advanced analytics for email marketing optimization:
 * 1. Email Fatigue Risk Dashboard - Unsubscribe, bounce, spam complaint trends
 * 2. Sending Frequency vs. Engagement - Correlation between send frequency and performance
 * 3. Revenue Efficiency Breakdown - Funnel analysis (open → click → conversion → AOV)
 * 4. Segment Performance Comparison - Audience/tag-based performance analysis
 */

export const GET = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store, user, role } = request;

    // Check if user has analytics view permissions
    if (!role?.permissions?.analytics?.view_all && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view analytics' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Get date range from query params (default to last 30 days)
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const defaultEnd = now;

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate'))
      : defaultStart;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate'))
      : defaultEnd;

    // Get previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = startDate;

    // Check if Klaviyo is connected
    if (!store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: 'Klaviyo not connected to this store'
      }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration.public_id;
    const db = mongoose.connection.db;
    const campaignStatsCollection = db.collection('campaignstats');

    // Initialize ClickHouse client
    const clickhouse = createClient({
      host: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || '8443'}`,
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD,
    });

    // Fetch all campaigns for both periods
    const allCampaigns = await campaignStatsCollection
      .find({
        klaviyo_public_id: klaviyoPublicId,
        'statistics.recipients': { $gt: 0 },
        send_time: {
          $gte: previousStart,
          $lte: endDate
        }
      })
      .sort({ send_time: 1 })
      .toArray();

    console.log(`[Email Insights] Found ${allCampaigns.length} campaigns for analysis`);

    // Split campaigns into current and previous periods
    const currentPeriodCampaigns = allCampaigns.filter(c => {
      const sendTime = new Date(c.send_time);
      return sendTime >= startDate && sendTime <= endDate;
    });

    const previousPeriodCampaigns = allCampaigns.filter(c => {
      const sendTime = new Date(c.send_time);
      return sendTime >= previousStart && sendTime < previousEnd;
    });

    // ============================================
    // 1. EMAIL FATIGUE RISK DASHBOARD
    // ============================================
    const fatigueRiskData = await generateFatigueRiskData(
      currentPeriodCampaigns,
      previousPeriodCampaigns,
      startDate,
      endDate
    );

    // ============================================
    // 2. SENDING FREQUENCY VS. ENGAGEMENT
    // ============================================
    const sendingFrequencyData = await generateSendingFrequencyData(
      allCampaigns,
      clickhouse,
      klaviyoPublicId,
      startDate,
      endDate,
      previousStart
    );

    // ============================================
    // 3. REVENUE EFFICIENCY BREAKDOWN
    // ============================================
    const revenueEfficiencyData = await generateRevenueEfficiencyData(
      currentPeriodCampaigns,
      previousPeriodCampaigns
    );

    // ============================================
    // 4. SEGMENT PERFORMANCE COMPARISON
    // ============================================
    const segmentPerformanceData = await generateSegmentPerformanceData(
      currentPeriodCampaigns
    );

    return NextResponse.json({
      fatigueRisk: fatigueRiskData,
      sendingFrequency: sendingFrequencyData,
      revenueEfficiency: revenueEfficiencyData,
      segmentPerformance: segmentPerformanceData,
      dateRange: {
        start: startDate,
        end: endDate,
        previousStart,
        previousEnd
      },
      metadata: {
        totalCampaigns: currentPeriodCampaigns.length,
        previousPeriodCampaigns: previousPeriodCampaigns.length
      }
    });

  } catch (error) {
    console.error('[Email Insights] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email insights data', details: error.message },
      { status: 500 }
    );
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate Email Fatigue Risk Dashboard Data
 * Tracks unsubscribe rate, bounce rate, and spam complaint rate over time
 */
async function generateFatigueRiskData(currentCampaigns, previousCampaigns, startDate, endDate) {
  // Group campaigns by week for trend analysis
  const weeklyData = {};

  const allCampaigns = [...previousCampaigns, ...currentCampaigns];

  allCampaigns.forEach(campaign => {
    if (!campaign.send_time) return;

    const date = new Date(campaign.send_time);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        date: weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        weekStart: weekStart,
        unsubscribes: 0,
        bounces: 0,
        spamComplaints: 0,
        delivered: 0,
        recipients: 0
      };
    }

    const stats = campaign.statistics || {};
    weeklyData[weekKey].unsubscribes += stats.unsubscribes || 0;
    weeklyData[weekKey].bounces += stats.bounced || 0;
    weeklyData[weekKey].spamComplaints += stats.spam_complaints || 0;
    weeklyData[weekKey].delivered += stats.delivered || stats.recipients || 0;
    weeklyData[weekKey].recipients += stats.recipients || 0;
  });

  // Calculate rates and sort
  const trendData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart - b.weekStart)
    .map(week => {
      const { weekStart, delivered, ...rest } = week;
      return {
        ...rest,
        unsubscribeRate: delivered > 0 ? (rest.unsubscribes / delivered) * 100 : 0,
        bounceRate: delivered > 0 ? (rest.bounces / delivered) * 100 : 0,
        spamComplaintRate: delivered > 0 ? (rest.spamComplaints / delivered) * 100 : 0
      };
    });

  // Calculate current vs previous period summary
  const currentPeriodStats = calculateFatigueStats(currentCampaigns);
  const previousPeriodStats = calculateFatigueStats(previousCampaigns);

  // Calculate risk score (0-100, higher = more risk)
  const riskScore = calculateFatigueRiskScore(currentPeriodStats);

  return {
    trendData,
    summary: {
      current: currentPeriodStats,
      previous: previousPeriodStats,
      riskScore,
      riskLevel: getRiskLevel(riskScore)
    }
  };
}

/**
 * Calculate fatigue statistics for a set of campaigns
 */
function calculateFatigueStats(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return {
      unsubscribes: 0,
      bounces: 0,
      spamComplaints: 0,
      delivered: 0,
      unsubscribeRate: 0,
      bounceRate: 0,
      spamComplaintRate: 0
    };
  }

  const totals = campaigns.reduce((acc, campaign) => {
    const stats = campaign.statistics || {};
    return {
      unsubscribes: acc.unsubscribes + (stats.unsubscribes || 0),
      bounces: acc.bounces + (stats.bounced || 0),
      spamComplaints: acc.spamComplaints + (stats.spam_complaints || 0),
      delivered: acc.delivered + (stats.delivered || stats.recipients || 0)
    };
  }, { unsubscribes: 0, bounces: 0, spamComplaints: 0, delivered: 0 });

  return {
    ...totals,
    unsubscribeRate: totals.delivered > 0 ? (totals.unsubscribes / totals.delivered) * 100 : 0,
    bounceRate: totals.delivered > 0 ? (totals.bounces / totals.delivered) * 100 : 0,
    spamComplaintRate: totals.delivered > 0 ? (totals.spamComplaints / totals.delivered) * 100 : 0
  };
}

/**
 * Calculate fatigue risk score (0-100)
 * Based on industry benchmarks:
 * - Unsubscribe rate > 0.5% = warning
 * - Bounce rate > 2% = warning
 * - Spam complaint rate > 0.1% = critical
 */
function calculateFatigueRiskScore(stats) {
  let score = 0;

  // Unsubscribe rate component (max 40 points)
  if (stats.unsubscribeRate > 1.0) score += 40;
  else if (stats.unsubscribeRate > 0.5) score += 25;
  else if (stats.unsubscribeRate > 0.25) score += 10;

  // Bounce rate component (max 30 points)
  if (stats.bounceRate > 5) score += 30;
  else if (stats.bounceRate > 2) score += 20;
  else if (stats.bounceRate > 1) score += 10;

  // Spam complaint rate component (max 30 points) - most critical
  if (stats.spamComplaintRate > 0.1) score += 30;
  else if (stats.spamComplaintRate > 0.05) score += 15;
  else if (stats.spamComplaintRate > 0.01) score += 5;

  return Math.min(score, 100);
}

/**
 * Get risk level label based on score
 */
function getRiskLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'warning';
  if (score >= 20) return 'caution';
  return 'healthy';
}

/**
 * Generate Sending Frequency vs. Engagement Data
 * Shows correlation between campaigns sent per week and engagement metrics
 */
async function generateSendingFrequencyData(allCampaigns, clickhouse, klaviyoPublicId, startDate, endDate, previousStart) {
  // Group by week and calculate both frequency and engagement
  const weeklyData = {};

  allCampaigns.forEach(campaign => {
    if (!campaign.send_time) return;

    const date = new Date(campaign.send_time);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        date: weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        weekStart: weekStart,
        campaignCount: 0,
        opens: 0,
        clicks: 0,
        unsubscribes: 0,
        delivered: 0,
        recipients: 0,
        revenue: 0
      };
    }

    const stats = campaign.statistics || {};
    weeklyData[weekKey].campaignCount += 1;
    weeklyData[weekKey].opens += stats.opens_unique || 0;
    weeklyData[weekKey].clicks += stats.clicks_unique || 0;
    weeklyData[weekKey].unsubscribes += stats.unsubscribes || 0;
    weeklyData[weekKey].delivered += stats.delivered || stats.recipients || 0;
    weeklyData[weekKey].recipients += stats.recipients || 0;
    weeklyData[weekKey].revenue += stats.conversion_value || 0;
  });

  // Calculate rates and sort
  const trendData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart - b.weekStart)
    .map(week => {
      const { weekStart, delivered, recipients, ...rest } = week;
      return {
        ...rest,
        openRate: delivered > 0 ? (rest.opens / delivered) * 100 : 0,
        clickRate: delivered > 0 ? (rest.clicks / delivered) * 100 : 0,
        unsubscribeRate: delivered > 0 ? (rest.unsubscribes / delivered) * 100 : 0,
        revenuePerRecipient: recipients > 0 ? rest.revenue / recipients : 0
      };
    });

  // Calculate correlation between frequency and engagement
  const correlation = calculateFrequencyCorrelation(trendData);

  return {
    trendData,
    correlation,
    insights: generateFrequencyInsights(trendData, correlation)
  };
}

/**
 * Calculate correlation between sending frequency and engagement metrics
 */
function calculateFrequencyCorrelation(data) {
  if (data.length < 3) return null;

  // Simple correlation calculation for campaign count vs. open rate
  const frequencies = data.map(d => d.campaignCount);
  const openRates = data.map(d => d.openRate);
  const unsubscribeRates = data.map(d => d.unsubscribeRate);

  return {
    frequencyVsOpenRate: calculateCorrelationCoefficient(frequencies, openRates),
    frequencyVsUnsubscribeRate: calculateCorrelationCoefficient(frequencies, unsubscribeRates),
    avgFrequency: frequencies.reduce((a, b) => a + b, 0) / frequencies.length,
    avgOpenRate: openRates.reduce((a, b) => a + b, 0) / openRates.length,
    avgUnsubscribeRate: unsubscribeRates.reduce((a, b) => a + b, 0) / unsubscribeRates.length
  };
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelationCoefficient(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Generate insights from frequency analysis
 */
function generateFrequencyInsights(data, correlation) {
  if (!correlation || data.length < 3) {
    return {
      message: 'Insufficient data for frequency analysis',
      recommendations: []
    };
  }

  const insights = [];
  const recommendations = [];

  // Analyze frequency vs. open rate correlation
  if (correlation.frequencyVsOpenRate < -0.3) {
    insights.push('Strong negative correlation: More sends = Lower open rates');
    recommendations.push('Reduce sending frequency to improve engagement');
    recommendations.push('Segment your audience and send more targeted campaigns');
  } else if (correlation.frequencyVsOpenRate > 0.3) {
    insights.push('Positive correlation: More sends = Higher open rates');
    recommendations.push('Your audience is engaged - maintain or slightly increase frequency');
  } else {
    insights.push('No strong correlation between frequency and open rates');
    recommendations.push('Focus on content quality and segmentation rather than frequency');
  }

  // Analyze unsubscribe rate trend
  if (correlation.frequencyVsUnsubscribeRate > 0.5) {
    insights.push('CRITICAL: High correlation between send frequency and unsubscribes');
    recommendations.push('URGENT: Reduce sending frequency immediately');
    recommendations.push('Implement preference center to let subscribers control frequency');
  } else if (correlation.frequencyVsUnsubscribeRate > 0.3) {
    insights.push('Warning: Increased sending is causing some unsubscribes');
    recommendations.push('Consider reducing frequency or improving targeting');
  }

  // Optimal frequency recommendation
  const weeksAboveAvg = data.filter(d => d.campaignCount > correlation.avgFrequency);
  const weeksAvgOpenRate = weeksAboveAvg.length > 0
    ? weeksAboveAvg.reduce((sum, d) => sum + d.openRate, 0) / weeksAboveAvg.length
    : 0;

  if (weeksAvgOpenRate < correlation.avgOpenRate * 0.9) {
    recommendations.push(`Optimal frequency appears to be around ${Math.floor(correlation.avgFrequency)} campaigns per week`);
  }

  return {
    message: insights.join('. '),
    recommendations
  };
}

/**
 * Generate Revenue Efficiency Breakdown Data
 * Shows the funnel: Open Rate × Click Rate × Conversion Rate × AOV = Revenue per Recipient
 */
async function generateRevenueEfficiencyData(currentCampaigns, previousCampaigns) {
  // Calculate funnel metrics for current period
  const currentFunnel = calculateRevenueFunnel(currentCampaigns);
  const previousFunnel = calculateRevenueFunnel(previousCampaigns);

  // Calculate week-over-week trends
  const weeklyFunnelData = calculateWeeklyFunnelBreakdown(currentCampaigns);

  return {
    current: currentFunnel,
    previous: previousFunnel,
    weeklyTrend: weeklyFunnelData,
    bottleneck: identifyBottleneck(currentFunnel, previousFunnel),
    insights: generateRevenueInsights(currentFunnel, previousFunnel)
  };
}

/**
 * Calculate revenue funnel metrics
 */
function calculateRevenueFunnel(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return {
      delivered: 0,
      opensUnique: 0,
      clicksUnique: 0,
      conversions: 0,
      revenue: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      revenuePerRecipient: 0
    };
  }

  const totals = campaigns.reduce((acc, campaign) => {
    const stats = campaign.statistics || {};
    return {
      delivered: acc.delivered + (stats.delivered || stats.recipients || 0),
      opensUnique: acc.opensUnique + (stats.opens_unique || 0),
      clicksUnique: acc.clicksUnique + (stats.clicks_unique || 0),
      conversions: acc.conversions + (stats.conversions || 0),
      revenue: acc.revenue + (stats.conversion_value || 0)
    };
  }, { delivered: 0, opensUnique: 0, clicksUnique: 0, conversions: 0, revenue: 0 });

  const openRate = totals.delivered > 0 ? (totals.opensUnique / totals.delivered) * 100 : 0;
  const clickRate = totals.delivered > 0 ? (totals.clicksUnique / totals.delivered) * 100 : 0;
  const conversionRate = totals.delivered > 0 ? (totals.conversions / totals.delivered) * 100 : 0;
  const averageOrderValue = totals.conversions > 0 ? totals.revenue / totals.conversions : 0;
  const revenuePerRecipient = totals.delivered > 0 ? totals.revenue / totals.delivered : 0;

  return {
    ...totals,
    openRate,
    clickRate,
    conversionRate,
    averageOrderValue,
    revenuePerRecipient
  };
}

/**
 * Calculate weekly funnel breakdown
 */
function calculateWeeklyFunnelBreakdown(campaigns) {
  const weeklyData = {};

  campaigns.forEach(campaign => {
    if (!campaign.send_time) return;

    const date = new Date(campaign.send_time);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        date: weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        weekStart: weekStart,
        delivered: 0,
        opensUnique: 0,
        clicksUnique: 0,
        conversions: 0,
        revenue: 0
      };
    }

    const stats = campaign.statistics || {};
    weeklyData[weekKey].delivered += stats.delivered || stats.recipients || 0;
    weeklyData[weekKey].opensUnique += stats.opens_unique || 0;
    weeklyData[weekKey].clicksUnique += stats.clicks_unique || 0;
    weeklyData[weekKey].conversions += stats.conversions || 0;
    weeklyData[weekKey].revenue += stats.conversion_value || 0;
  });

  return Object.values(weeklyData)
    .sort((a, b) => a.weekStart - b.weekStart)
    .map(week => {
      const { weekStart, ...rest } = week;
      const openRate = rest.delivered > 0 ? (rest.opensUnique / rest.delivered) * 100 : 0;
      const clickRate = rest.delivered > 0 ? (rest.clicksUnique / rest.delivered) * 100 : 0;
      const conversionRate = rest.delivered > 0 ? (rest.conversions / rest.delivered) * 100 : 0;
      const aov = rest.conversions > 0 ? rest.revenue / rest.conversions : 0;
      const rpr = rest.delivered > 0 ? rest.revenue / rest.delivered : 0;

      return {
        ...rest,
        openRate,
        clickRate,
        conversionRate,
        averageOrderValue: aov,
        revenuePerRecipient: rpr
      };
    });
}

/**
 * Identify the biggest bottleneck in the funnel
 */
function identifyBottleneck(current, previous) {
  const changes = {
    openRate: ((current.openRate - previous.openRate) / previous.openRate) * 100,
    clickRate: ((current.clickRate - previous.clickRate) / previous.clickRate) * 100,
    conversionRate: ((current.conversionRate - previous.conversionRate) / previous.conversionRate) * 100,
    aov: ((current.averageOrderValue - previous.averageOrderValue) / previous.averageOrderValue) * 100
  };

  // Find the metric with the largest negative change
  const bottlenecks = Object.entries(changes)
    .filter(([_, change]) => change < 0)
    .sort(([_, a], [__, b]) => a - b);

  if (bottlenecks.length === 0) {
    return {
      metric: 'none',
      change: 0,
      message: 'All funnel metrics are improving'
    };
  }

  const [metric, change] = bottlenecks[0];

  const messages = {
    openRate: 'Open Rate is the biggest bottleneck - focus on subject lines and send times',
    clickRate: 'Click Rate is the biggest bottleneck - improve email content and CTAs',
    conversionRate: 'Conversion Rate is the biggest bottleneck - optimize landing pages and offers',
    aov: 'Average Order Value is declining - consider upsell/cross-sell strategies'
  };

  return {
    metric,
    change,
    message: messages[metric]
  };
}

/**
 * Generate insights from revenue efficiency analysis
 */
function generateRevenueInsights(current, previous) {
  const insights = [];
  const recommendations = [];

  // RPR analysis
  const rprChange = previous.revenuePerRecipient > 0
    ? ((current.revenuePerRecipient - previous.revenuePerRecipient) / previous.revenuePerRecipient) * 100
    : 0;

  if (rprChange < -20) {
    insights.push(`Revenue per Recipient declined ${Math.abs(rprChange).toFixed(1)}% - significant drop in efficiency`);
    recommendations.push('Urgent: Review segmentation and audience targeting');
    recommendations.push('Exclude unengaged subscribers to improve metrics');
  } else if (rprChange < -10) {
    insights.push(`Revenue per Recipient declined ${Math.abs(rprChange).toFixed(1)}%`);
    recommendations.push('Review recent campaign targeting and content quality');
  } else if (rprChange > 10) {
    insights.push(`Revenue per Recipient improved ${rprChange.toFixed(1)}% - great progress!`);
  }

  // Funnel component analysis
  if (current.openRate < 15) {
    insights.push('Open rate is below industry average (15-25%)');
    recommendations.push('A/B test subject lines and sender names');
    recommendations.push('Review send times for better engagement');
  }

  if (current.clickRate < 2) {
    insights.push('Click rate is below industry average (2-5%)');
    recommendations.push('Improve email content and call-to-action buttons');
    recommendations.push('Ensure mobile-friendly design');
  }

  if (current.conversionRate < 1) {
    insights.push('Conversion rate is below industry average (1-3%)');
    recommendations.push('Optimize landing pages and checkout process');
    recommendations.push('Consider personalized product recommendations');
  }

  return {
    message: insights.join('. ') || 'All metrics are performing well',
    recommendations: recommendations.length > 0 ? recommendations : ['Continue current strategies']
  };
}

/**
 * Generate Segment Performance Comparison Data
 * Compares performance across different audiences/segments/tags
 */
async function generateSegmentPerformanceData(campaigns) {
  // Group campaigns by segments/tags
  const segmentData = {};
  const tagData = {};

  campaigns.forEach(campaign => {
    // Process included audiences
    const audiences = campaign.included_audiences || [];
    audiences.forEach(audience => {
      const segmentKey = `${audience.type}:${audience.id}`;
      if (!segmentData[segmentKey]) {
        segmentData[segmentKey] = {
          id: audience.id,
          name: audience.name || 'Unknown Segment',
          type: audience.type || 'segment',
          campaigns: 0,
          delivered: 0,
          opensUnique: 0,
          clicksUnique: 0,
          conversions: 0,
          revenue: 0,
          unsubscribes: 0
        };
      }

      const stats = campaign.statistics || {};
      segmentData[segmentKey].campaigns += 1;
      segmentData[segmentKey].delivered += stats.delivered || stats.recipients || 0;
      segmentData[segmentKey].opensUnique += stats.opens_unique || 0;
      segmentData[segmentKey].clicksUnique += stats.clicks_unique || 0;
      segmentData[segmentKey].conversions += stats.conversions || 0;
      segmentData[segmentKey].revenue += stats.conversion_value || 0;
      segmentData[segmentKey].unsubscribes += stats.unsubscribes || 0;
    });

    // Process tags
    const tags = campaign.tagNames || [];
    tags.forEach(tag => {
      if (!tagData[tag]) {
        tagData[tag] = {
          tag,
          campaigns: 0,
          delivered: 0,
          opensUnique: 0,
          clicksUnique: 0,
          conversions: 0,
          revenue: 0
        };
      }

      const stats = campaign.statistics || {};
      tagData[tag].campaigns += 1;
      tagData[tag].delivered += stats.delivered || stats.recipients || 0;
      tagData[tag].opensUnique += stats.opens_unique || 0;
      tagData[tag].clicksUnique += stats.clicks_unique || 0;
      tagData[tag].conversions += stats.conversions || 0;
      tagData[tag].revenue += stats.conversion_value || 0;
    });
  });

  // Calculate rates and sort by performance
  const segments = Object.values(segmentData)
    .map(segment => {
      const openRate = segment.delivered > 0 ? (segment.opensUnique / segment.delivered) * 100 : 0;
      const clickRate = segment.delivered > 0 ? (segment.clicksUnique / segment.delivered) * 100 : 0;
      const conversionRate = segment.delivered > 0 ? (segment.conversions / segment.delivered) * 100 : 0;
      const unsubscribeRate = segment.delivered > 0 ? (segment.unsubscribes / segment.delivered) * 100 : 0;
      const revenuePerRecipient = segment.delivered > 0 ? segment.revenue / segment.delivered : 0;

      return {
        ...segment,
        openRate,
        clickRate,
        conversionRate,
        unsubscribeRate,
        revenuePerRecipient
      };
    })
    .sort((a, b) => b.revenuePerRecipient - a.revenuePerRecipient);

  const tags = Object.values(tagData)
    .map(tag => {
      const openRate = tag.delivered > 0 ? (tag.opensUnique / tag.delivered) * 100 : 0;
      const clickRate = tag.delivered > 0 ? (tag.clicksUnique / tag.delivered) * 100 : 0;
      const conversionRate = tag.delivered > 0 ? (tag.conversions / tag.delivered) * 100 : 0;
      const revenuePerRecipient = tag.delivered > 0 ? tag.revenue / tag.delivered : 0;

      return {
        ...tag,
        openRate,
        clickRate,
        conversionRate,
        revenuePerRecipient
      };
    })
    .sort((a, b) => b.revenuePerRecipient - a.revenuePerRecipient);

  // Identify top and bottom performers
  const topPerformers = segments.slice(0, 5);
  const bottomPerformers = segments.slice(-5).reverse();

  // Identify fatigued segments (high unsubscribe rate)
  const fatiguedSegments = segments
    .filter(s => s.unsubscribeRate > 0.5)
    .sort((a, b) => b.unsubscribeRate - a.unsubscribeRate)
    .slice(0, 5);

  return {
    segments,
    tags,
    topPerformers,
    bottomPerformers,
    fatiguedSegments,
    insights: generateSegmentInsights(segments, fatiguedSegments)
  };
}

/**
 * Generate insights from segment analysis
 */
function generateSegmentInsights(segments, fatiguedSegments) {
  const insights = [];
  const recommendations = [];

  if (segments.length === 0) {
    return {
      message: 'No segment data available for analysis',
      recommendations: ['Ensure campaigns are tagged with segments for better tracking']
    };
  }

  // Performance variance
  if (segments.length >= 2) {
    const topRPR = segments[0].revenuePerRecipient;
    const bottomRPR = segments[segments.length - 1].revenuePerRecipient;
    const variance = topRPR > 0 ? ((topRPR - bottomRPR) / topRPR) * 100 : 0;

    if (variance > 50) {
      insights.push(`Large performance variance: Top segment generates ${variance.toFixed(0)}% more RPR than bottom segment`);
      recommendations.push('Focus more budget on high-performing segments');
      recommendations.push('Analyze what makes top segments successful and replicate');
    }
  }

  // Fatigued segments
  if (fatiguedSegments.length > 0) {
    insights.push(`${fatiguedSegments.length} segments showing signs of fatigue (high unsubscribe rates)`);
    recommendations.push('Rest fatigued segments: exclude them from campaigns for 2-4 weeks');
    recommendations.push('Re-engage with win-back campaigns and special offers');

    fatiguedSegments.forEach(seg => {
      recommendations.push(`Consider resting: ${seg.name} (${seg.unsubscribeRate.toFixed(2)}% unsubscribe rate)`);
    });
  }

  // Low performers
  const lowPerformers = segments.filter(s => s.openRate < 10);
  if (lowPerformers.length > 0) {
    insights.push(`${lowPerformers.length} segments with very low open rates (<10%)`);
    recommendations.push('Review list quality for low-performing segments');
    recommendations.push('Consider re-permission campaigns or list cleaning');
  }

  return {
    message: insights.join('. ') || 'Segment performance is balanced',
    recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring segment performance']
  };
}

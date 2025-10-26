import { NextResponse } from "next/server";
import { withStoreAccess } from '@/middleware/storeAccess';
import { createClient } from '@clickhouse/client';

/**
 * GET /api/store/[storePublicId]/report/campaigns/health
 *
 * Calculates Email List Health Score (0-100) based on:
 * - RPR Trend (40%): Revenue Per Recipient vs 6-month baseline
 * - Volume Trend (20%): Send volume changes
 * - Engagement Trend (20%): Open/click rate changes
 * - Efficiency Trend (20%): Revenue efficiency vs send volume
 */
export const GET = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check permissions
    if (!role?.permissions?.analytics?.view_all && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view analytics' },
        { status: 403 }
      );
    }

    // Check Klaviyo integration
    if (!store.klaviyo_integration?.public_id) {
      return NextResponse.json({
        error: 'Klaviyo not connected to this store'
      }, { status: 404 });
    }

    const klaviyoPublicId = store.klaviyo_integration.public_id;

    // Initialize ClickHouse client
    const clickhouse = createClient({
      url: `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || '8443'}`,
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD,
    });

    // Calculate dates
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query: Get 6-month email campaign metrics history from campaign_statistics
    // Aggregate by date to get daily totals
    const metricsQuery = `
      SELECT
        date,
        sum(conversion_value) as campaign_email_revenue,
        sum(recipients) as email_recipients,
        sum(delivered) as email_delivered,
        sum(opens_unique) as email_opens,
        sum(clicks_unique) as email_clicks,
        count(DISTINCT campaign_id) as campaigns_sent
      FROM campaign_statistics_latest
      WHERE klaviyo_public_id = {klaviyoId:String}
        AND send_channel = 'email'
        AND date >= {startDate:Date}
        AND date <= {endDate:Date}
      GROUP BY date
      HAVING sum(recipients) > 0
      ORDER BY date ASC
    `;

    const metricsResult = await clickhouse.query({
      query: metricsQuery,
      query_params: {
        klaviyoId: klaviyoPublicId,
        startDate: sixMonthsAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      format: 'JSONEachRow'
    });

    const metricsData = await metricsResult.json();

    if (!metricsData || metricsData.length === 0) {
      return NextResponse.json({
        fatigueScore: 0,
        status: 'no_data',
        message: 'Not enough historical data to calculate health score',
        scoreBreakdown: {
          rprTrend: 0,
          volumeTrend: 0,
          engagementTrend: 0,
          efficiency: 0
        }
      });
    }

    // Calculate metrics for each day
    const dailyMetrics = metricsData.map(day => {
      const revenue = parseFloat(day.campaign_email_revenue || 0);
      const recipients = parseInt(day.email_recipients || 0);
      const delivered = parseInt(day.email_delivered || 0);
      const opens = parseInt(day.email_opens || 0);
      const clicks = parseInt(day.email_clicks || 0);

      return {
        date: day.date,
        revenue,
        recipients,
        delivered,
        rpr: recipients > 0 ? revenue / recipients : 0,
        engagement: delivered > 0 ? (opens + clicks) / delivered : 0,
        campaignsSent: parseInt(day.campaigns_sent || 0)
      };
    });

    // Split into baseline (first 5 months) and current period (last 30 days)
    const baselineData = dailyMetrics.filter(d => {
      const date = new Date(d.date);
      return date >= sixMonthsAgo && date < thirtyDaysAgo;
    });

    const currentData = dailyMetrics.filter(d => {
      const date = new Date(d.date);
      return date >= thirtyDaysAgo;
    });

    if (baselineData.length === 0 || currentData.length === 0) {
      return NextResponse.json({
        fatigueScore: 0,
        status: 'insufficient_data',
        message: 'Need at least 6 months of data to calculate health score',
        scoreBreakdown: {
          rprTrend: 0,
          volumeTrend: 0,
          engagementTrend: 0,
          efficiency: 0
        }
      });
    }

    // Calculate baseline averages
    const baselineAvg = {
      rpr: baselineData.reduce((sum, d) => sum + d.rpr, 0) / baselineData.length,
      recipients: baselineData.reduce((sum, d) => sum + d.recipients, 0) / baselineData.length,
      engagement: baselineData.reduce((sum, d) => sum + d.engagement, 0) / baselineData.length,
      revenue: baselineData.reduce((sum, d) => sum + d.revenue, 0) / baselineData.length
    };

    // Calculate current period averages
    const currentAvg = {
      rpr: currentData.reduce((sum, d) => sum + d.rpr, 0) / currentData.length,
      recipients: currentData.reduce((sum, d) => sum + d.recipients, 0) / currentData.length,
      engagement: currentData.reduce((sum, d) => sum + d.engagement, 0) / currentData.length,
      revenue: currentData.reduce((sum, d) => sum + d.revenue, 0) / currentData.length
    };

    // 1. RPR Trend Score (40% weight)
    // Higher is better - we want RPR to be at or above baseline
    const rprTrendScore = baselineAvg.rpr > 0
      ? Math.min(100, Math.max(0, (currentAvg.rpr / baselineAvg.rpr) * 100))
      : 0;

    // 2. Volume Trend Score (20% weight)
    // Penalize excessive volume increases (diminishing returns)
    const volumeChangePercent = baselineAvg.recipients > 0
      ? ((currentAvg.recipients - baselineAvg.recipients) / baselineAvg.recipients) * 100
      : 0;

    let volumeTrendScore = 100;
    if (volumeChangePercent > 50) {
      // Sending 50%+ more emails is likely causing fatigue
      volumeTrendScore = Math.max(0, 100 - (volumeChangePercent - 50));
    } else if (volumeChangePercent > 20) {
      // 20-50% increase: slightly concerning
      volumeTrendScore = Math.max(70, 100 - (volumeChangePercent - 20));
    }

    // 3. Engagement Trend Score (20% weight)
    // Higher engagement is better
    const engagementTrendScore = baselineAvg.engagement > 0
      ? Math.min(100, Math.max(0, (currentAvg.engagement / baselineAvg.engagement) * 100))
      : 0;

    // 4. Efficiency Score (20% weight)
    // Revenue should grow proportionally or better than volume
    const revenueChangePercent = baselineAvg.revenue > 0
      ? ((currentAvg.revenue - baselineAvg.revenue) / baselineAvg.revenue) * 100
      : 0;

    let efficiencyScore = 100;
    if (volumeChangePercent > 0) {
      // If volume increased, revenue should increase at least as much
      const efficiencyRatio = revenueChangePercent / volumeChangePercent;
      if (efficiencyRatio < 0.5) {
        // Revenue growing less than half as fast as volume = bad
        efficiencyScore = Math.max(0, efficiencyRatio * 100);
      } else if (efficiencyRatio < 1) {
        // Revenue growing slower than volume = concerning
        efficiencyScore = Math.min(100, 50 + (efficiencyRatio * 50));
      }
      // If efficiencyRatio >= 1, keep score at 100
    }

    // Calculate final weighted fatigue score
    const fatigueScore = (
      rprTrendScore * 0.40 +
      volumeTrendScore * 0.20 +
      engagementTrendScore * 0.20 +
      efficiencyScore * 0.20
    );

    // Determine status
    let status = 'healthy';
    if (fatigueScore < 40) status = 'critical';
    else if (fatigueScore < 60) status = 'warning';
    else if (fatigueScore < 80) status = 'caution';

    // Generate recommendations
    const recommendations = [];
    if (rprTrendScore < 70) {
      recommendations.push('RPR is declining - consider reducing send frequency or improving targeting');
    }
    if (volumeTrendScore < 70) {
      recommendations.push('Send volume has increased significantly - monitor for list fatigue');
    }
    if (engagementTrendScore < 70) {
      recommendations.push('Engagement is declining - focus on re-engagement campaigns');
    }
    if (efficiencyScore < 70) {
      recommendations.push('Revenue growth not keeping pace with volume - improve campaign quality');
    }
    if (recommendations.length === 0) {
      recommendations.push('Email marketing performance is healthy - maintain current strategy');
    }

    // Prepare trend data for charts
    const trends = {
      rprHistory: dailyMetrics.map(d => ({
        date: d.date,
        value: d.rpr,
        baseline: baselineAvg.rpr
      })),
      volumeHistory: dailyMetrics.map(d => ({
        date: d.date,
        value: d.recipients,
        baseline: baselineAvg.recipients
      })),
      engagementHistory: dailyMetrics.map(d => ({
        date: d.date,
        value: d.engagement,
        baseline: baselineAvg.engagement
      })),
      revenueHistory: dailyMetrics.map(d => ({
        date: d.date,
        value: d.revenue,
        baseline: baselineAvg.revenue
      }))
    };

    return NextResponse.json({
      fatigueScore: Math.round(fatigueScore * 10) / 10,
      status,
      scoreBreakdown: {
        rprTrend: Math.round(rprTrendScore * 10) / 10,
        volumeTrend: Math.round(volumeTrendScore * 10) / 10,
        engagementTrend: Math.round(engagementTrendScore * 10) / 10,
        efficiency: Math.round(efficiencyScore * 10) / 10
      },
      percentChanges: {
        rpr: baselineAvg.rpr > 0 ? ((currentAvg.rpr - baselineAvg.rpr) / baselineAvg.rpr) * 100 : 0,
        volume: volumeChangePercent,
        engagement: baselineAvg.engagement > 0 ? ((currentAvg.engagement - baselineAvg.engagement) / baselineAvg.engagement) * 100 : 0,
        revenue: revenueChangePercent
      },
      recommendations,
      trends,
      baseline: {
        avgRPR: baselineAvg.rpr,
        avgRecipients: baselineAvg.recipients,
        avgEngagement: baselineAvg.engagement,
        avgRevenue: baselineAvg.revenue
      },
      current: {
        avgRPR: currentAvg.rpr,
        avgRecipients: currentAvg.recipients,
        avgEngagement: currentAvg.engagement,
        avgRevenue: currentAvg.revenue
      }
    });

  } catch (error) {
    console.error('[Campaign Health API] Error:', error);
    return NextResponse.json({
      error: 'Failed to calculate email health score',
      details: error.message
    }, { status: 500 });
  }
});

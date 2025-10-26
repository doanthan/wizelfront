"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info, DollarSign } from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import MorphingLoader from '@/app/components/ui/loading';

/**
 * Revenue Efficiency Analysis
 *
 * Multi-metric chart with dual Y-axis:
 * Left Y-axis: Per-Campaign Revenue (green bars - color coded above/below average)
 * Right Y-axis: Revenue per Recipient (blue line), AOV (purple line)
 * X-axis: Time (chronological campaign send dates)
 *
 * Shows individual campaign performance and efficiency trends over time
 */
export default function RevenueEfficiencyTrend({ campaigns, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-sky-blue" />
            Revenue Efficiency Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <MorphingLoader size="medium" showText={true} text="Calculating efficiency metrics..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-sky-blue" />
            Revenue Efficiency Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <Info className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No campaign data available for the selected period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort campaigns by send time
  const sortedCampaigns = [...campaigns]
    .filter(c => c.send_time)
    .sort((a, b) => new Date(a.send_time) - new Date(b.send_time));

  // Calculate per-campaign and efficiency metrics
  const efficiencyData = sortedCampaigns.map((campaign, index) => {
    const stats = campaign.statistics || {};
    const revenue = stats.conversion_value || 0;
    const recipients = stats.recipients || 0;
    const aov = stats.average_order_value || 0;
    const rpr = stats.revenue_per_recipient || 0;

    return {
      date: new Date(campaign.send_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: campaign.send_time,
      campaignRevenue: revenue,
      revenuePerRecipient: rpr, // Keep original for calculations
      rprPer100: rpr * 100, // Convert to "per 100 recipients" for visualization ($0.22 → $22)
      aov: aov,
      recipients,
      campaignName: campaign.campaign_name || campaign.name || 'Unnamed Campaign'
    };
  });

  // Calculate totals and averages
  const totalRevenue = efficiencyData.reduce((sum, d) => sum + d.campaignRevenue, 0);
  const totalRecipients = efficiencyData.reduce((sum, d) => sum + d.recipients, 0);
  const avgRevenue = totalRevenue / efficiencyData.length;
  const maxRevenue = Math.max(...efficiencyData.map(d => d.campaignRevenue));
  const minRevenue = Math.min(...efficiencyData.map(d => d.campaignRevenue));
  const topPerformer = efficiencyData.reduce((max, d) => d.campaignRevenue > max.campaignRevenue ? d : max, efficiencyData[0]);

  // Calculate trends for recommendations
  const midPoint = Math.floor(efficiencyData.length / 2);
  const firstHalf = efficiencyData.slice(0, midPoint);
  const secondHalf = efficiencyData.slice(midPoint);

  const avgRPRFirstHalf = firstHalf.reduce((sum, d) => sum + d.revenuePerRecipient, 0) / firstHalf.length;
  const avgRPRSecondHalf = secondHalf.reduce((sum, d) => sum + d.revenuePerRecipient, 0) / secondHalf.length;
  const rprTrend = avgRPRSecondHalf - avgRPRFirstHalf;
  const rprTrendPercent = avgRPRFirstHalf > 0 ? (rprTrend / avgRPRFirstHalf) * 100 : 0;

  const avgAOVFirstHalf = firstHalf.reduce((sum, d) => sum + d.aov, 0) / firstHalf.length;
  const avgAOVSecondHalf = secondHalf.reduce((sum, d) => sum + d.aov, 0) / secondHalf.length;
  const aovTrend = avgAOVSecondHalf - avgAOVFirstHalf;
  const aovTrendPercent = avgAOVFirstHalf > 0 ? (aovTrend / avgAOVFirstHalf) * 100 : 0;

  const volumeFirstHalf = firstHalf.reduce((sum, d) => sum + d.recipients, 0);
  const volumeSecondHalf = secondHalf.reduce((sum, d) => sum + d.recipients, 0);
  const volumeGrowthPercent = volumeFirstHalf > 0 ? ((volumeSecondHalf - volumeFirstHalf) / volumeFirstHalf) * 100 : 0;

  const revenueFirstHalf = firstHalf.reduce((sum, d) => sum + d.campaignRevenue, 0);
  const revenueSecondHalf = secondHalf.reduce((sum, d) => sum + d.campaignRevenue, 0);
  const revenueGrowthPercent = revenueFirstHalf > 0 ? ((revenueSecondHalf - revenueFirstHalf) / revenueFirstHalf) * 100 : 0;

  // Find efficiency sweet spot (best RPR)
  const bestRPR = efficiencyData.reduce((max, d) => d.revenuePerRecipient > max.revenuePerRecipient ? d : max, efficiencyData[0]);

  // Calculate min/max for right Y-axis (RPR per 100 and AOV) for proper scaling
  const allRightAxisValues = efficiencyData.flatMap(d => [d.rprPer100, d.aov]);
  const minRightAxis = Math.min(...allRightAxisValues);
  const maxRightAxis = Math.max(...allRightAxisValues);

  // Add 10% padding to min/max for better visualization
  const rightAxisPadding = (maxRightAxis - minRightAxis) * 0.1;
  const rightAxisDomain = [
    Math.max(0, minRightAxis - rightAxisPadding),
    maxRightAxis + rightAxisPadding
  ];

  // Generate AI-powered recommendations
  const generateRecommendations = () => {
    const recommendations = [];

    // CRITICAL: Revenue decoupling from volume
    if (volumeGrowthPercent > 20 && revenueGrowthPercent < volumeGrowthPercent / 2) {
      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Revenue Growth Decoupling Detected',
        description: `Email volume increased ${formatPercentage(volumeGrowthPercent)} but revenue only up ${formatPercentage(revenueGrowthPercent)}. You're sending more but earning less per email - classic list fatigue.`,
        actions: [
          `Reduce send frequency by ${Math.round((volumeGrowthPercent - revenueGrowthPercent) / 2)}% immediately`,
          'Focus on higher-value segments (past purchasers, engaged users)',
          'Implement re-engagement campaign before continuing high volume',
          'Analyze campaign quality - prioritize quality over quantity',
          'Consider 48-hour minimum gap between campaigns'
        ]
      });
    }

    // WARNING: RPR declining
    if (rprTrendPercent < -10) {
      recommendations.push({
        severity: 'warning',
        icon: TrendingDown,
        title: 'Revenue Per Recipient Declining',
        description: `RPR dropped ${formatPercentage(Math.abs(rprTrendPercent))} from ${formatCurrency(avgRPRFirstHalf)} to ${formatCurrency(avgRPRSecondHalf)}. Each email is becoming less profitable.`,
        actions: [
          'Audit recent campaigns for discount overuse',
          'Reduce promotional frequency, add educational content',
          'Segment list to send relevant offers (past purchase behavior)',
          'Test higher-value products in campaigns',
          'Review send times - may be missing engaged windows'
        ]
      });
    }

    // WARNING: AOV declining
    if (aovTrendPercent < -15) {
      const discountCampaigns = sortedCampaigns.filter(c =>
        (c.campaign_name || c.name || '').toLowerCase().includes('sale') ||
        (c.campaign_name || c.name || '').toLowerCase().includes('discount') ||
        (c.campaign_name || c.name || '').toLowerCase().includes('%')
      );

      recommendations.push({
        severity: 'warning',
        icon: TrendingDown,
        title: 'Average Order Value Declining',
        description: `AOV decreased ${formatPercentage(Math.abs(aovTrendPercent))} from ${formatCurrency(avgAOVFirstHalf)} to ${formatCurrency(avgAOVSecondHalf)}. Over-discounting or wrong product mix likely.`,
        actions: [
          discountCampaigns.length > sortedCampaigns.length * 0.4 ? `Reduce discount campaigns (${discountCampaigns.length}/${sortedCampaigns.length} campaigns have discounts)` : 'Review recent discount strategy',
          'Add product bundles to increase basket size',
          'Test free shipping threshold above current AOV',
          'Upsell complementary products in emails',
          'Promote higher-margin items more prominently'
        ]
      });
    }

    // SUCCESS: RPR improving
    if (rprTrendPercent > 15) {
      recommendations.push({
        severity: 'success',
        icon: TrendingUp,
        title: 'Revenue Per Recipient Improving',
        description: `RPR increased ${formatPercentage(rprTrendPercent)} from ${formatCurrency(avgRPRFirstHalf)} to ${formatCurrency(avgRPRSecondHalf)}. Your optimization efforts are working!`,
        actions: [
          'Document recent changes to replicate success',
          'Maintain current send frequency and segmentation',
          'Consider slight volume increase (10-15%) to scale',
          'Share success metrics with stakeholders'
        ]
      });
    }

    // INSIGHT: Efficiency sweet spot
    if (bestRPR && bestRPR.revenuePerRecipient > avgRPRSecondHalf * 1.5) {
      // Find campaigns around that date to understand frequency
      const bestRPRIndex = efficiencyData.indexOf(bestRPR);
      const windowCampaigns = efficiencyData.slice(Math.max(0, bestRPRIndex - 3), Math.min(efficiencyData.length, bestRPRIndex + 4));
      const avgFrequency = windowCampaigns.length / 7; // campaigns per week

      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Efficiency Sweet Spot Identified',
        description: `Best RPR of ${formatCurrency(bestRPR.revenuePerRecipient)} achieved on ${new Date(bestRPR.fullDate).toLocaleDateString()}. Pattern analysis shows ~${avgFrequency.toFixed(1)} campaigns/week during this period.`,
        actions: [
          `Target ${Math.round(avgFrequency)} campaigns per week for optimal efficiency`,
          `Analyze "${bestRPR.campaignName}" for winning elements`,
          'Replicate this campaign timing and structure',
          'Monitor if current frequency differs from sweet spot'
        ]
      });
    }

    // OPPORTUNITY: Plateau detection
    const recentRevenue = efficiencyData.slice(-5).reduce((sum, d) => sum + d.campaignRevenue, 0);
    const previousRevenue = efficiencyData.slice(-10, -5).reduce((sum, d) => sum + d.campaignRevenue, 0);
    const plateauChange = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    if (Math.abs(plateauChange) < 5 && efficiencyData.length >= 10) {
      recommendations.push({
        severity: 'warning',
        icon: TrendingDown,
        title: 'Revenue Plateau Detected',
        description: `Revenue growth has stalled (${formatPercentage(plateauChange)} change in recent campaigns). New strategies needed.`,
        actions: [
          'Test new audience segments not yet targeted',
          'Launch win-back campaign for inactive subscribers',
          'Introduce new product categories in campaigns',
          'A/B test radical email redesigns',
          'Consider SMS or other channel expansion'
        ]
      });
    }

    // SUCCESS: Strong overall efficiency
    if (avgRPRSecondHalf > 1.5 && aovTrendPercent > -5) {
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Strong Revenue Efficiency',
        description: `Current RPR of ${formatCurrency(avgRPRSecondHalf)} is industry-leading. AOV stable at ${formatCurrency(avgAOVSecondHalf)}.`,
        actions: [
          'Current strategy is working - maintain course',
          'Document best practices for team training',
          'Test 10-15% volume increase to scale profitably',
          'Share success case study internally'
        ]
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Count recommendations by severity
  const criticalCount = recommendations.filter(r => r.severity === 'critical').length;
  const warningCount = recommendations.filter(r => r.severity === 'warning').length;
  const successCount = recommendations.filter(r => r.severity === 'success').length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.date}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 max-w-[250px] truncate" title={data.campaignName}>{data.campaignName}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="text-sm text-gray-600 dark:text-gray-400">Campaign Revenue:</span>
            <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(data.campaignRevenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-sm text-gray-600 dark:text-gray-400">Rev Per 100 Recipients:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(data.rprPer100)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-sm text-gray-600 dark:text-gray-400">Average Order Value:</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">{formatCurrency(data.aov)}</span>
          </div>
          <div className="flex items-center justify-between gap-8 text-xs pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-500">Actual RPR:</span>
            <span className="text-gray-500 dark:text-gray-500">{formatCurrency(data.revenuePerRecipient)}</span>
          </div>
          <div className="flex items-center justify-between gap-8 pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Recipients:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatNumber(data.recipients)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-sky-blue" />
            Revenue Efficiency Analysis
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">Efficiency Metrics</p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li><strong>Campaign Revenue:</strong> Revenue per campaign - identify top performers (left axis, bars)</li>
                      <li><strong>Rev Per 100:</strong> Revenue generated per 100 email recipients - profitability metric (right axis, blue line)</li>
                      <li><strong>AOV:</strong> Average order value - basket size per order (right axis, purple line)</li>
                    </ul>
                    <p className="text-xs mt-2 pt-2 border-t text-gray-600 dark:text-gray-400">
                      Green bars = above average revenue. Declining Rev Per 100 = list fatigue.
                    </p>
                    <p className="text-xs mt-2 pt-2 border-t text-gray-900 dark:text-white font-semibold">
                      How to Use:
                    </p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li>• Green bars = high-performing campaigns to replicate</li>
                      <li>• Orange bars = underperformers needing improvement</li>
                      <li>• Blue line trending down = list fatigue, reduce frequency</li>
                      <li>• Purple line trending down = over-discounting or wrong product mix</li>
                    </ul>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={rprTrend >= 0 ? 'success' : 'destructive'} className={rprTrend >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}>
              RPR: {rprTrend >= 0 ? '+' : ''}{formatPercentage(rprTrendPercent)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Dual Y-Axis Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#10b981"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                label={{ value: 'Campaign Revenue', angle: -90, position: 'insideLeft', style: { fill: '#10b981' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#60A5FA"
                style={{ fontSize: '12px' }}
                domain={rightAxisDomain}
                tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                label={{ value: 'RPR per 100 / AOV', angle: 90, position: 'insideRight', style: { fill: '#60A5FA' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Per-Campaign Revenue - Green/Red bars */}
              <Bar
                yAxisId="left"
                dataKey="campaignRevenue"
                name="Campaign Revenue"
                radius={[4, 4, 0, 0]}
              >
                {efficiencyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.campaignRevenue >= avgRevenue ? '#10b981' : '#f59e0b'}
                    fillOpacity={entry.campaignRevenue >= avgRevenue ? 0.8 : 0.6}
                  />
                ))}
              </Bar>

              {/* Revenue Per 100 Recipients - Blue line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rprPer100"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Revenue Per 100 Recipients"
              />

              {/* Average Order Value - Purple line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="aov"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ r: 4 }}
                strokeDasharray="5 5"
                name="AOV"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Revenue</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</div>
            <div className={`text-xs flex items-center gap-1 mt-1 ${revenueGrowthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowthPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercentage(Math.abs(revenueGrowthPercent))}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg RPR</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(avgRPRSecondHalf)}</div>
            <div className={`text-xs flex items-center gap-1 mt-1 ${rprTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {rprTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercentage(Math.abs(rprTrendPercent))}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg AOV</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(avgAOVSecondHalf)}</div>
            <div className={`text-xs flex items-center gap-1 mt-1 ${aovTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {aovTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercentage(Math.abs(aovTrendPercent))}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Volume Growth</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatPercentage(volumeGrowthPercent)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatNumber(totalRecipients)} total
            </div>
          </div>
        </div>

        {/* Revenue Optimization Insights */}
        {recommendations.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-blue" />
                Revenue Optimization Insights
              </h4>
              <div className="flex items-center gap-2">
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalCount} Critical
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="warning" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                    {warningCount} Warning{warningCount > 1 ? 's' : ''}
                  </Badge>
                )}
                {successCount > 0 && (
                  <Badge variant="success" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {successCount} Success
                  </Badge>
                )}
              </div>
            </div>

            {recommendations.map((rec, idx) => (
              <Alert
                key={idx}
                variant={rec.severity === 'critical' ? 'destructive' : 'default'}
                className={
                  rec.severity === 'warning' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' :
                  rec.severity === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' :
                  ''
                }
              >
                <rec.icon className="h-4 w-4" />
                <AlertTitle className="text-gray-900 dark:text-white">{rec.title}</AlertTitle>
                <AlertDescription className="text-gray-900 dark:text-gray-100">
                  <p className="mb-2">{rec.description}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Action Items:</p>
                    <ul className="space-y-1">
                      {rec.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-900 dark:text-gray-100">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-sky-blue" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

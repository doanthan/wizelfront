"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { TrendingUp, AlertCircle, Target, CheckCircle2, Info, Zap } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, Cell
} from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import MorphingLoader from '@/app/components/ui/loading';

/**
 * Campaign ROI & Performance Matrix
 *
 * Scatter plot showing:
 * X-axis: Click Rate (%)
 * Y-axis: Conversion Rate (%)
 * Bubble size: Revenue
 * Color: Campaign type (Email vs SMS)
 *
 * Quadrants:
 * - Top Right: High performers (high click + high conversion)
 * - Top Left: High engagement, low conversion (landing page issues)
 * - Bottom Right: Low engagement, high conversion (improve copy)
 * - Bottom Left: Underperformers (pause/re-evaluate)
 */
export default function CampaignROIMatrix({ campaigns, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-sky-blue" />
            Campaign ROI & Performance Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <MorphingLoader size="medium" showText={true} text="Analyzing campaign performance..." />
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
            <Target className="h-5 w-5 text-sky-blue" />
            Campaign ROI & Performance Matrix
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

  // Transform campaign data for scatter plot
  const scatterData = campaigns
    .filter(c => c.statistics?.click_rate !== undefined && c.statistics?.conversion_rate !== undefined)
    .map(campaign => {
      const stats = campaign.statistics || {};
      return {
        x: (stats.click_rate || 0) * 100, // Click Rate %
        y: (stats.conversion_rate || 0) * 100, // Conversion Rate %
        z: stats.conversion_value || 100, // Revenue (for bubble size)
        name: campaign.campaign_name || campaign.name || 'Unnamed Campaign',
        type: campaign.send_channel || 'email',
        conversions: stats.conversions || 0,
        clicks: stats.clicks_unique || stats.clicks || 0,
        recipients: stats.recipients || 0,
        revenue: stats.conversion_value || 0
      };
    });

  // Calculate averages for quadrant lines
  const avgClickRate = scatterData.reduce((sum, d) => sum + d.x, 0) / scatterData.length;
  const avgConversionRate = scatterData.reduce((sum, d) => sum + d.y, 0) / scatterData.length;

  // Categorize campaigns into quadrants
  const topRight = scatterData.filter(d => d.x >= avgClickRate && d.y >= avgConversionRate); // High performers
  const topLeft = scatterData.filter(d => d.x < avgClickRate && d.y >= avgConversionRate); // High conversion, low clicks
  const bottomRight = scatterData.filter(d => d.x >= avgClickRate && d.y < avgConversionRate); // High clicks, low conversion
  const bottomLeft = scatterData.filter(d => d.x < avgClickRate && d.y < avgConversionRate); // Underperformers

  // Find outliers
  const topPerformer = scatterData.reduce((max, d) => {
    const score = d.x * d.y * d.z; // Combined score
    return score > (max.x * max.y * max.z) ? d : max;
  }, scatterData[0] || {});

  const revenueOutlier = scatterData.reduce((max, d) => d.z > max.z ? d : max, scatterData[0] || {});

  // Generate AI-powered recommendations
  const generateRecommendations = () => {
    const recommendations = [];

    // SUCCESS: Top performers found
    if (topRight.length > 0) {
      const bestCampaign = topRight.reduce((max, d) => (d.x + d.y) > (max.x + max.y) ? d : max);
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Top Performers Identified',
        description: `${topRight.length} campaign${topRight.length > 1 ? 's' : ''} in top-right quadrant (high engagement + high conversion). "${bestCampaign.name}" leads with ${formatPercentage(bestCampaign.x)} click rate and ${formatPercentage(bestCampaign.y)} conversion rate.`,
        actions: [
          `Analyze "${bestCampaign.name}" for winning elements: subject line, offer, CTA placement`,
          'Replicate this campaign structure for similar audience segments',
          `A/B test variations of this successful pattern`,
          'Document this as a template for future campaigns'
        ]
      });
    }

    // CRITICAL: Engagement gap (high clicks, low conversions)
    if (bottomRight.length >= 3) {
      const avgRevenueLost = bottomRight.reduce((sum, d) => sum + (d.clicks * avgConversionRate / 100 * 50), 0); // Estimated lost revenue
      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Engagement Gap - High Interest, Poor Conversion',
        description: `${bottomRight.length} campaigns have above-average clicks (${formatPercentage(avgClickRate)}) but below-average conversions (${formatPercentage(avgConversionRate)}). Estimated lost revenue: ${formatCurrency(avgRevenueLost)}.`,
        actions: [
          'Audit landing pages for load time (target: <3 seconds)',
          'Review checkout flow for friction points (form length, required fields)',
          'Ensure landing page messaging matches email promise',
          'Add exit-intent popups with limited-time offers',
          'Test different landing page layouts and CTAs'
        ]
      });
    }

    // WARNING: Low engagement, good conversion (improve email copy)
    if (topLeft.length >= 2) {
      recommendations.push({
        severity: 'warning',
        icon: Target,
        title: 'Low Engagement Despite Good Conversions',
        description: `${topLeft.length} campaigns have strong conversions but below-average clicks. The offer works - your email creative doesn't.`,
        actions: [
          'A/B test subject lines with urgency and personalization',
          'Improve preview text to complement subject line',
          'Add dynamic content based on past purchase behavior',
          'Test different CTA button colors and copy',
          'Reduce email length - focus on single clear offer'
        ]
      });
    }

    // CRITICAL: Underperformers (bottom-left quadrant)
    if (bottomLeft.length >= 5) {
      const worstPerformers = bottomLeft
        .sort((a, b) => (a.x + a.y) - (b.x + b.y))
        .slice(0, 3)
        .map(d => d.name);

      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Underperforming Campaigns Require Action',
        description: `${bottomLeft.length} campaigns in bottom 25% for both engagement and conversion. These are actively hurting list health and ROI.`,
        actions: [
          `Pause similar campaigns immediately: ${worstPerformers.join(', ')}`,
          'Analyze audience segments - are you targeting the wrong people?',
          'Review send frequency - may be causing list fatigue',
          'Consider list re-engagement campaign before continuing',
          'Test with smaller segment before scaling'
        ]
      });
    }

    // INSIGHT: Revenue outlier analysis
    if (revenueOutlier && revenueOutlier.z > scatterData.reduce((sum, d) => sum + d.z, 0) / scatterData.length * 2) {
      recommendations.push({
        severity: 'success',
        icon: Zap,
        title: 'Revenue Outlier Detected',
        description: `"${revenueOutlier.name}" generated ${formatCurrency(revenueOutlier.z)} - significantly above average despite ${formatPercentage(revenueOutlier.x)} click rate and ${formatPercentage(revenueOutlier.y)} conversion rate.`,
        actions: [
          'Analyze what made this campaign uniquely profitable (timing, product, segment)',
          'Check if high-value customers were specifically targeted',
          'Review product mix - was there a high AOV item promoted?',
          'Replicate this campaign with similar high-value segments'
        ]
      });
    }

    // OPPORTUNITY: Benchmark comparison
    const avgClickRatePercent = avgClickRate;
    const avgConversionRatePercent = avgConversionRate;

    if (avgClickRatePercent < 2) {
      recommendations.push({
        severity: 'warning',
        icon: Target,
        title: 'Below Industry Benchmark - Click Rates',
        description: `Average click rate is ${formatPercentage(avgClickRatePercent)} (industry average: 2-3%). Significant improvement opportunity.`,
        actions: [
          'Test personalized subject lines with recipient name or company',
          'Segment list by engagement level and send different content',
          'Add urgency to subject lines (24-hour sales, limited stock)',
          'Use preview text effectively - don\'t repeat subject line',
          'Test sending from a person\'s name instead of company name'
        ]
      });
    }

    if (avgConversionRatePercent < 1 && scatterData.length >= 5) {
      recommendations.push({
        severity: 'warning',
        icon: AlertCircle,
        title: 'Below Industry Benchmark - Conversion Rates',
        description: `Average conversion rate is ${formatPercentage(avgConversionRatePercent)} (industry average: 1-2%). Landing page optimization needed.`,
        actions: [
          'Add social proof (reviews, testimonials) to landing pages',
          'Implement countdown timers for limited-time offers',
          'Simplify checkout to 2 steps maximum',
          'Offer guest checkout option',
          'Add live chat support on high-traffic landing pages'
        ]
      });
    }

    // SUCCESS: Above benchmark performance
    if (avgClickRatePercent > 3 && avgConversionRatePercent > 2) {
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Exceeding Industry Benchmarks',
        description: `Average click rate: ${formatPercentage(avgClickRatePercent)} (industry: 2-3%), conversion rate: ${formatPercentage(avgConversionRatePercent)} (industry: 1-2%). Outstanding performance!`,
        actions: [
          'Document current best practices for onboarding new team members',
          'Share success metrics with stakeholders',
          'Consider scaling winning campaigns to larger segments',
          'Test slight volume increase (10-15%) to expand reach without hurting metrics'
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
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.name}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
            <Badge variant="outline" className={data.type === 'sms' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}>
              {data.type === 'sms' ? 'SMS' : 'Email'}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm text-gray-600 dark:text-gray-400">Click Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.x)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.y)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm text-gray-600 dark:text-gray-400">Revenue:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(data.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm text-gray-600 dark:text-gray-400">Conversions:</span>
            <span className="font-medium text-gray-900 dark:text-white">{data.conversions}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-sm text-gray-600 dark:text-gray-400">Recipients:</span>
            <span className="font-medium text-gray-900 dark:text-white">{data.recipients}</span>
          </div>
        </div>
      </div>
    );
  };

  // Colors for different campaign types
  const getColor = (type) => {
    return type === 'sms' ? '#8B5CF6' : '#60A5FA'; // vivid-violet for SMS, sky-blue for email
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-sky-blue" />
            Campaign ROI & Performance Matrix
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">Performance Quadrants</p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li><strong>Top Right:</strong> High performers - replicate these</li>
                      <li><strong>Top Left:</strong> High conversion, low clicks - improve email copy</li>
                      <li><strong>Bottom Right:</strong> High clicks, low conversion - fix landing pages</li>
                      <li><strong>Bottom Left:</strong> Underperformers - pause and re-evaluate</li>
                    </ul>
                    <p className="text-xs mt-2 pt-2 border-t text-gray-900 dark:text-white font-semibold">
                      How to Use:
                    </p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li>• Each bubble = one campaign</li>
                      <li>• Bubble size = revenue generated</li>
                      <li>• Click any bubble to see campaign details</li>
                      <li>• Focus on replicating top-right quadrant campaigns</li>
                    </ul>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              Email
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
              SMS
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scatter Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="x"
                name="Click Rate"
                unit="%"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Click Rate (%)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Conversion Rate"
                unit="%"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 1000]} name="Revenue" />
              <Tooltip content={<CustomTooltip />} />

              {/* Average lines to create quadrants */}
              {avgClickRate && (
                <>
                  <line
                    x1={`${avgClickRate}%`}
                    y1="0"
                    x2={`${avgClickRate}%`}
                    y2="100%"
                    stroke="#9ca3af"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                  />
                  <line
                    x1="0"
                    y1={`${avgConversionRate}%`}
                    x2="100%"
                    y2={`${avgConversionRate}%`}
                    stroke="#9ca3af"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                  />
                </>
              )}

              <Scatter name="Campaigns" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.type)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quadrant Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{topRight.length}</div>
            <div className="text-xs text-green-600 dark:text-green-500">Top Performers</div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{bottomRight.length}</div>
            <div className="text-xs text-orange-600 dark:text-orange-500">High Clicks, Low Conv.</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{topLeft.length}</div>
            <div className="text-xs text-blue-600 dark:text-blue-500">Low Clicks, High Conv.</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{bottomLeft.length}</div>
            <div className="text-xs text-red-600 dark:text-red-500">Underperformers</div>
          </div>
        </div>

        {/* Performance Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-blue" />
                Performance Recommendations
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

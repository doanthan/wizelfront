"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Filter, TrendingUp, AlertCircle, CheckCircle2, Info, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
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
 * Revenue Attribution Funnel
 *
 * Funnel visualization showing:
 * Recipients → Delivered → Opened → Clicked → Converted → Revenue
 *
 * Shows conversion drop-off at each stage with actionable recommendations
 */
export default function RevenueAttributionFunnel({ campaigns, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-sky-blue" />
            Revenue Attribution Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <MorphingLoader size="medium" showText={true} text="Building attribution funnel..." />
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
            <Filter className="h-5 w-5 text-sky-blue" />
            Revenue Attribution Funnel
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

  // Aggregate funnel metrics across all campaigns
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.statistics?.recipients || 0), 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.statistics?.delivered || 0), 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + (c.statistics?.opens_unique || c.statistics?.opens || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.statistics?.clicks_unique || c.statistics?.clicks || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.statistics?.conversions || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.statistics?.conversion_value || 0), 0);

  // Build funnel data
  const funnelData = [
    {
      stage: 'Recipients',
      value: totalRecipients,
      percentage: 100,
      dropOff: 0,
      color: '#60A5FA' // sky-blue
    },
    {
      stage: 'Delivered',
      value: totalDelivered,
      percentage: totalRecipients > 0 ? (totalDelivered / totalRecipients) * 100 : 0,
      dropOff: totalRecipients - totalDelivered,
      color: '#34D399' // success green
    },
    {
      stage: 'Opened',
      value: totalOpens,
      percentage: totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0,
      dropOff: totalDelivered - totalOpens,
      color: '#10B981' // green
    },
    {
      stage: 'Clicked',
      value: totalClicks,
      percentage: totalRecipients > 0 ? (totalClicks / totalRecipients) * 100 : 0,
      dropOff: totalOpens - totalClicks,
      color: '#8B5CF6' // vivid-violet
    },
    {
      stage: 'Converted',
      value: totalConversions,
      percentage: totalRecipients > 0 ? (totalConversions / totalRecipients) * 100 : 0,
      dropOff: totalClicks - totalConversions,
      color: '#7C3AED' // deep-purple
    }
  ];

  // Calculate stage-to-stage conversion rates
  const deliveryRate = totalRecipients > 0 ? (totalDelivered / totalRecipients) * 100 : 0;
  const openRate = totalDelivered > 0 ? (totalOpens / totalDelivered) * 100 : 0;
  const clickToOpenRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
  const clickToConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const overallConversionRate = totalRecipients > 0 ? (totalConversions / totalRecipients) * 100 : 0;

  // Find biggest drop-off
  const dropOffs = [
    { stage: 'Delivery', rate: 100 - deliveryRate, value: totalRecipients - totalDelivered },
    { stage: 'Open', rate: 100 - openRate, value: totalDelivered - totalOpens },
    { stage: 'Click', rate: 100 - clickToOpenRate, value: totalOpens - totalClicks },
    { stage: 'Conversion', rate: 100 - clickToConversionRate, value: totalClicks - totalConversions }
  ];

  const biggestDropOff = dropOffs.reduce((max, current) => current.rate > max.rate ? current : max);

  // Calculate potential revenue lost
  const avgRevenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;
  const potentialConversionsFromClicks = totalClicks * 0.02; // 2% industry benchmark
  const potentialRevenueLost = (potentialConversionsFromClicks - totalConversions) * avgRevenuePerConversion;

  // Generate AI-powered recommendations
  const generateRecommendations = () => {
    const recommendations = [];

    // CRITICAL: Biggest bottleneck
    if (biggestDropOff.stage === 'Delivery' && biggestDropOff.rate > 5) {
      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Deliverability Crisis - Immediate Action Required',
        description: `${formatPercentage(biggestDropOff.rate)} of emails are not being delivered (${formatNumber(biggestDropOff.value)} emails). This is severely impacting revenue potential.`,
        actions: [
          'Run immediate list hygiene - remove hard bounces within 24 hours',
          'Check domain/IP reputation on MXToolbox.com',
          'Verify SPF, DKIM, and DMARC records are properly configured',
          'Contact ESP to investigate delivery issues',
          'Implement double opt-in to prevent future deliverability problems'
        ]
      });
    } else if (biggestDropOff.stage === 'Open' && biggestDropOff.rate > 75) {
      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Biggest Bottleneck: Email Opens',
        description: `${formatPercentage(biggestDropOff.rate)} drop-off from Delivered → Opened. Only ${formatPercentage(openRate)} open rate - emails aren't being read.`,
        actions: [
          'A/B test subject lines with personalization ({{firstName}}, {{company}})',
          'Add urgency: "Last chance", "Ending tonight", "24 hours only"',
          'Use curiosity gap: Ask questions instead of statements',
          'Test sending from a person\'s name (e.g., "Sarah from Company") vs company name',
          'Optimize send time - test mornings (9-11am) vs afternoons (2-4pm)',
          'Clean inactive subscribers (no opens in 90 days)'
        ]
      });
    } else if (biggestDropOff.stage === 'Click' && biggestDropOff.rate > 80) {
      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Biggest Bottleneck: Email Engagement',
        description: `${formatPercentage(biggestDropOff.rate)} drop-off from Opened → Clicked. People open but don't engage - content relevance issue.`,
        actions: [
          'Simplify email to single clear CTA (remove multiple competing CTAs)',
          'Make CTA button larger and use contrasting color',
          'Add personalized product recommendations based on past purchases',
          'Use dynamic content blocks based on user segments',
          'Improve email copy - focus on benefits not features',
          'Test different CTA copy: "Shop Now" vs "Get My Discount" vs "See Collection"'
        ]
      });
    } else if (biggestDropOff.stage === 'Conversion' && biggestDropOff.rate > 90) {
      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Biggest Bottleneck: Landing Page Conversion',
        description: `${formatPercentage(biggestDropOff.rate)} drop-off from Clicked → Converted. ${formatCurrency(potentialRevenueLost)} in potential revenue lost.`,
        actions: [
          'Audit landing page load time (target: <2 seconds) - use Google PageSpeed Insights',
          'Ensure landing page message matches email promise exactly',
          'Simplify checkout to 2 steps maximum',
          'Add exit-intent popup with 10% discount for abandoners',
          'Implement abandoned cart email within 1 hour of abandonment',
          'Add trust signals: reviews, testimonials, money-back guarantee',
          'Offer guest checkout (don\'t force account creation)'
        ]
      });
    }

    // WARNING: Below benchmark open rate
    if (openRate < 20) {
      recommendations.push({
        severity: 'warning',
        icon: AlertCircle,
        title: 'Below Benchmark: Open Rate',
        description: `Open rate is ${formatPercentage(openRate)} (industry average: 20-25%). Subject lines need work.`,
        actions: [
          'Analyze top 3 best-performing subject lines and identify patterns',
          'Test emojis in subject lines (📧 💰 🎉) for visual interest',
          'Keep subject lines under 50 characters for mobile',
          'Use preview text effectively - don\'t repeat subject line',
          'Segment by engagement and send different subject lines to each group'
        ]
      });
    }

    // WARNING: Below benchmark CTOR
    if (clickToOpenRate < 15) {
      recommendations.push({
        severity: 'warning',
        icon: Zap,
        title: 'Below Benchmark: Click-to-Open Rate',
        description: `Only ${formatPercentage(clickToOpenRate)} of openers click (industry average: 15-20%). Email content not compelling enough.`,
        actions: [
          'Use scarcity: "Only 10 left" or "Sale ends in 24 hours"',
          'Add countdown timer GIFs for urgency',
          'Show social proof: "1,247 customers bought this today"',
          'Use "above the fold" CTA - visible without scrolling',
          'Test image-heavy vs text-heavy layouts'
        ]
      });
    }

    // OPPORTUNITY: Revenue recovery potential
    if (potentialRevenueLost > totalRevenue * 0.2 && totalClicks > 100) {
      recommendations.push({
        severity: 'warning',
        icon: TrendingUp,
        title: 'Revenue Recovery Opportunity',
        description: `${formatCurrency(potentialRevenueLost)} in potential revenue could be recovered by improving conversion from ${formatPercentage(clickToConversionRate)} to 2% (industry benchmark).`,
        actions: [
          `Focus on landing page optimization - ${formatNumber(totalClicks - totalConversions)} engaged users didn't convert`,
          'Add live chat or chatbot to answer pre-purchase questions',
          'Implement 1-click checkout for returning customers',
          'Test offering payment plans for high-ticket items',
          'Add limited-time free shipping offer'
        ]
      });
    }

    // SUCCESS: Strong overall conversion
    if (overallConversionRate > 1) {
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Strong Overall Conversion Rate',
        description: `${formatPercentage(overallConversionRate)} overall conversion rate exceeds industry average (0.5-1%). Great job!`,
        actions: [
          'Document what\'s working - subject lines, email structure, offer types',
          'Maintain current strategy and test incremental improvements',
          'Consider scaling winning campaigns to larger segments',
          'Share success metrics with team and stakeholders'
        ]
      });
    }

    // INSIGHT: Deliverability health
    if (deliveryRate > 97 && deliveryRate < 100) {
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Excellent Deliverability',
        description: `${formatPercentage(deliveryRate)} delivery rate is industry-leading. Your list hygiene practices are working.`,
        actions: [
          'Continue current list cleaning practices',
          'Maintain double opt-in for new subscribers',
          'Share deliverability best practices with team'
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
        <p className="font-semibold text-gray-900 dark:text-white mb-3">{data.stage}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="text-sm text-gray-600 dark:text-gray-400">Count:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatNumber(data.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-sm text-gray-600 dark:text-gray-400">% of Recipients:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.percentage)}</span>
          </div>
          {data.dropOff > 0 && (
            <div className="flex items-center justify-between gap-8 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-red-600 dark:text-red-400">Drop-off:</span>
              <span className="font-medium text-red-700 dark:text-red-400">{formatNumber(data.dropOff)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-sky-blue" />
            Revenue Attribution Funnel
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">Attribution Funnel</p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li><strong>Recipients:</strong> Total emails sent</li>
                      <li><strong>Delivered:</strong> Successfully delivered (not bounced)</li>
                      <li><strong>Opened:</strong> Unique opens</li>
                      <li><strong>Clicked:</strong> Unique clicks</li>
                      <li><strong>Converted:</strong> Purchases made</li>
                    </ul>
                    <p className="text-xs mt-2 pt-2 border-t text-gray-900 dark:text-white font-semibold">
                      How to Use:
                    </p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li>• Identify your biggest drop-off stage</li>
                      <li>• Compare stage-to-stage conversion rates</li>
                      <li>• Focus optimization on the weakest stage</li>
                      <li>• Check recommendations below for specific actions</li>
                    </ul>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-gray-900 dark:text-gray-100">
              {formatPercentage(overallConversionRate)} Overall
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Funnel Bar Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                type="category"
                dataKey="stage"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="percentage"
                  position="right"
                  formatter={(value) => formatPercentage(value)}
                  style={{ fontSize: '12px', fill: '#374151' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Conversion Rates */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Delivery Rate</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatPercentage(deliveryRate)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatNumber(totalDelivered)} / {formatNumber(totalRecipients)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Open Rate</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatPercentage(openRate)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatNumber(totalOpens)} / {formatNumber(totalDelivered)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">CTOR</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatPercentage(clickToOpenRate)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatNumber(totalClicks)} / {formatNumber(totalOpens)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Click → Conv</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatPercentage(clickToConversionRate)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {formatNumber(totalConversions)} / {formatNumber(totalClicks)}
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="mt-4 p-4 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg border border-sky-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue Generated</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Revenue / Conversion</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(avgRevenuePerConversion)}</div>
            </div>
          </div>
        </div>

        {/* Optimization Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-blue" />
                Optimization Recommendations
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

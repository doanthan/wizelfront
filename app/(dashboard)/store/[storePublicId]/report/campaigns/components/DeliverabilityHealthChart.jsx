"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { TrendingUp, AlertTriangle, AlertCircle, CheckCircle2, Info, Shield } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatNumber, formatPercentage } from '@/lib/utils';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import MorphingLoader from '@/app/components/ui/loading';

/**
 * Deliverability Health Dashboard
 *
 * Stacked area chart showing:
 * - Delivered (success green)
 * - Bounced (warning orange)
 * - Spam Complaints (danger red)
 * - Unsubscribes (gray)
 *
 * Provides AI-powered recommendations based on deliverability metrics
 */
export default function DeliverabilityHealthChart({ campaigns, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-blue" />
            Deliverability Health Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <MorphingLoader size="medium" showText={true} text="Analyzing deliverability..." />
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
            <Shield className="h-5 w-5 text-sky-blue" />
            Deliverability Health Dashboard
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

  // Transform campaign data for deliverability chart
  const deliverabilityData = campaigns
    .filter(c => c.send_time)
    .sort((a, b) => new Date(a.send_time) - new Date(b.send_time))
    .map(campaign => {
      const stats = campaign.statistics || {};
      const recipients = stats.recipients || 0;
      const delivered = stats.delivered || 0;
      const bounced = Math.max(0, recipients - delivered);
      const spamComplaints = Math.max(0, Math.round((stats.spam_complaint_rate || 0) * recipients));
      const unsubscribes = Math.max(0, Math.round((stats.unsubscribe_rate || 0) * recipients));

      return {
        date: new Date(campaign.send_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: campaign.send_time,
        delivered: delivered || 0,
        bounced: bounced || 0,
        spamComplaints: spamComplaints || 0,
        unsubscribes: unsubscribes || 0,
        deliveryRate: stats.delivery_rate || 0,
        bounceRate: stats.bounce_rate || 0,
        spamRate: stats.spam_complaint_rate || 0,
        unsubscribeRate: stats.unsubscribe_rate || 0,
        campaignName: campaign.campaign_name || campaign.name || 'Unknown Campaign'
      };
    })
    .filter(data =>
      // Filter out any data points with invalid values
      data.date &&
      data.fullDate &&
      (data.delivered >= 0 || data.bounced >= 0 || data.spamComplaints >= 0 || data.unsubscribes >= 0)
    );

  // Debug: Log the data structure
  console.log('[DeliverabilityChart] Processed data:', {
    dataLength: deliverabilityData.length,
    sampleData: deliverabilityData.slice(0, 2),
    allDataKeys: deliverabilityData.length > 0 ? Object.keys(deliverabilityData[0]) : []
  });

  // Calculate aggregate metrics for recommendations
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.statistics?.recipients || 0), 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.statistics?.delivered || 0), 0);
  const avgDeliveryRate = totalRecipients > 0 ? totalDelivered / totalRecipients : 0;

  const avgBounceRate = campaigns.reduce((sum, c) => sum + (c.statistics?.bounce_rate || 0), 0) / campaigns.length;
  const avgSpamRate = campaigns.reduce((sum, c) => sum + (c.statistics?.spam_complaint_rate || 0), 0) / campaigns.length;
  const avgUnsubscribeRate = campaigns.reduce((sum, c) => sum + (c.statistics?.unsubscribe_rate || 0), 0) / campaigns.length;

  // Trend analysis - compare first half vs second half
  const midPoint = Math.floor(campaigns.length / 2);
  const firstHalf = campaigns.slice(0, midPoint);
  const secondHalf = campaigns.slice(midPoint);

  const firstHalfDeliveryRate = firstHalf.reduce((sum, c) => sum + (c.statistics?.delivery_rate || 0), 0) / firstHalf.length;
  const secondHalfDeliveryRate = secondHalf.reduce((sum, c) => sum + (c.statistics?.delivery_rate || 0), 0) / secondHalf.length;
  const deliveryTrend = secondHalfDeliveryRate - firstHalfDeliveryRate;

  const firstHalfSpamRate = firstHalf.reduce((sum, c) => sum + (c.statistics?.spam_complaint_rate || 0), 0) / firstHalf.length;
  const secondHalfSpamRate = secondHalf.reduce((sum, c) => sum + (c.statistics?.spam_complaint_rate || 0), 0) / secondHalf.length;

  // Generate AI-powered recommendations
  const generateRecommendations = () => {
    const recommendations = [];

    // CRITICAL: Spam rate check
    if (avgSpamRate > 0.003) { // 0.3%
      recommendations.push({
        severity: 'critical',
        icon: AlertTriangle,
        title: 'CRITICAL: High Spam Complaint Rate',
        description: `Average spam rate is ${formatPercentage(avgSpamRate * 100)} (safe threshold: <0.1%). Your domain reputation is at risk with major ESPs.`,
        actions: [
          'Review recent campaigns for purchased lists or unclear unsubscribe links',
          'Implement double opt-in for all new subscribers immediately',
          'Add clear "why you received this" text to all email footers',
          'Consider pausing campaigns for 48 hours to prevent further damage'
        ]
      });
    } else if (avgSpamRate > 0.001) { // 0.1%
      recommendations.push({
        severity: 'warning',
        icon: AlertCircle,
        title: 'Spam Rate Above Safe Threshold',
        description: `Spam complaints at ${formatPercentage(avgSpamRate * 100)} (safe: <0.1%). Monitor closely to avoid ESP reputation damage.`,
        actions: [
          'Review email content for spam trigger words',
          'Ensure unsubscribe link is visible and functional',
          'Add preference center to reduce spam complaints'
        ]
      });
    }

    // WARNING: Bounce rate check
    if (avgBounceRate > 0.05) { // 5%
      recommendations.push({
        severity: 'critical',
        icon: AlertTriangle,
        title: 'Critical Bounce Rate Detected',
        description: `Bounce rate is ${formatPercentage(avgBounceRate * 100)} (healthy: <2%). Immediate list cleaning required.`,
        actions: [
          'Remove all hard bounces immediately',
          'Run email verification on entire list within 48 hours',
          'Implement real-time email verification at signup',
          'Create re-engagement campaign for soft bounces'
        ]
      });
    } else if (avgBounceRate > 0.02) { // 2%
      recommendations.push({
        severity: 'warning',
        icon: AlertCircle,
        title: 'Bounce Rate Above Threshold',
        description: `Current bounce rate: ${formatPercentage(avgBounceRate * 100)} (healthy: <2%). List hygiene needed.`,
        actions: [
          'Schedule weekly list cleaning to remove hard bounces',
          'Verify email addresses at signup point',
          'Run win-back campaign for inactive subscribers'
        ]
      });
    }

    // WARNING: Unsubscribe rate check
    if (avgUnsubscribeRate > 0.005) { // 0.5%
      recommendations.push({
        severity: 'warning',
        icon: AlertCircle,
        title: 'High Unsubscribe Rate',
        description: `Unsubscribe rate is ${formatPercentage(avgUnsubscribeRate * 100)} (good: <0.3%). Content or frequency issues likely.`,
        actions: [
          'Survey unsubscribers to understand reasons',
          'Reduce send frequency by 25-30%',
          'Add email preference center to let users choose frequency',
          'Segment list to send more relevant content'
        ]
      });
    }

    // TREND: Deliverability improving
    if (deliveryTrend > 0.02 && avgDeliveryRate > 0.95) {
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Deliverability Improving',
        description: `Delivery rate increased by ${formatPercentage(deliveryTrend * 100)} and now at ${formatPercentage(avgDeliveryRate * 100)}. Great progress!`,
        actions: [
          'Maintain current list hygiene practices',
          'Continue double opt-in for new subscribers',
          'Document what changed to replicate success'
        ]
      });
    }

    // TREND: Deliverability declining
    if (deliveryTrend < -0.02) {
      recommendations.push({
        severity: 'warning',
        icon: TrendingUp,
        title: 'Deliverability Declining',
        description: `Delivery rate dropped by ${formatPercentage(Math.abs(deliveryTrend) * 100)}. Address before it worsens.`,
        actions: [
          'Run immediate list hygiene - remove bounces',
          'Check for blacklisting on MXToolbox.com',
          'Warm up IP if sending volume increased recently',
          'Review recent content changes that may trigger spam filters'
        ]
      });
    }

    // OPPORTUNITY: Good deliverability
    if (avgDeliveryRate > 0.97 && avgSpamRate < 0.001 && avgBounceRate < 0.02) {
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Excellent Deliverability Health',
        description: `Delivery rate: ${formatPercentage(avgDeliveryRate * 100)}, Spam: ${formatPercentage(avgSpamRate * 100)}, Bounce: ${formatPercentage(avgBounceRate * 100)}. Industry-leading performance!`,
        actions: [
          'Your current practices are working - maintain them',
          'Consider slight volume increase (10-15%) to expand reach',
          'Document your deliverability best practices',
          'Share success metrics with stakeholders'
        ]
      });
    }

    // SPIKE DETECTION: Recent spam spike
    if (secondHalfSpamRate > firstHalfSpamRate * 2 && secondHalfSpamRate > 0.001) {
      recommendations.push({
        severity: 'critical',
        icon: AlertTriangle,
        title: 'Spam Complaint Spike Detected',
        description: `Spam rate doubled in recent campaigns (from ${formatPercentage(firstHalfSpamRate * 100)} to ${formatPercentage(secondHalfSpamRate * 100)}).`,
        actions: [
          'Review last 5 campaigns for new list sources or content changes',
          'Pause any new list acquisitions immediately',
          'Send re-permission campaign to recent additions',
          'Investigate if unsubscribe process is working correctly'
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
    const total = data.delivered + data.bounced + data.spamComplaints + data.unsubscribes;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.date}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{data.campaignName}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Delivered
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatNumber(data.delivered)} ({formatPercentage(data.deliveryRate * 100)})
            </span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              Bounced
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatNumber(data.bounced)} ({formatPercentage(data.bounceRate * 100)})
            </span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              Spam
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatNumber(data.spamComplaints)} ({formatPercentage(data.spamRate * 100)})
            </span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              Unsubscribed
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatNumber(data.unsubscribes)} ({formatPercentage(data.unsubscribeRate * 100)})
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Recipients</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(total)}</span>
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
            <Shield className="h-5 w-5 text-sky-blue" />
            Deliverability Health Dashboard
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">Deliverability Metrics</p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li><strong>Delivered:</strong> Successfully delivered emails (target: &gt;97%)</li>
                      <li><strong>Bounced:</strong> Failed delivery attempts (healthy: &lt;2%)</li>
                      <li><strong>Spam:</strong> Marked as spam by recipients (safe: &lt;0.1%)</li>
                      <li><strong>Unsubscribed:</strong> Opted out (good: &lt;0.3%)</li>
                    </ul>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-gray-900 dark:text-gray-100">
              Avg Delivery: {formatPercentage(avgDeliveryRate * 100)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Line Chart showing delivery rates - More stable than AreaChart */}
        <div className="h-96">
          {deliverabilityData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-600 dark:text-gray-400">No deliverability data available</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deliverabilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => formatPercentage(value * 100)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                dataKey="deliveryRate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Delivery Rate"
              />
              <Line
                yAxisId="left"
                dataKey="bounceRate"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Bounce Rate"
              />
              <Line
                yAxisId="left"
                dataKey="spamRate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Spam Rate"
              />
              <Line
                yAxisId="left"
                dataKey="unsubscribeRate"
                stroke="#6b7280"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Unsubscribe Rate"
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Deliverability Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-blue" />
                Deliverability Recommendations
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

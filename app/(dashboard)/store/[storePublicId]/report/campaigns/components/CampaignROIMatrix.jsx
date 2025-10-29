"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { TrendingUp, AlertCircle, Target, CheckCircle2, Info, Zap, MessageSquare, Image as ImageIcon, Users, MousePointer, DollarSign, Eye } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, Cell, ReferenceArea
} from 'recharts';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
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
  const [smsContent, setSmsContent] = useState({}); // Cache for SMS content
  const [tooltipData, setTooltipData] = useState(null); // Independent tooltip data
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const closeTimeoutRef = useRef(null);
  const chartRef = useRef(null);
  const activeDataRef = useRef(null); // Track currently active data to prevent loops

  // Fetch SMS content directly from CDN (CORS configured on R2)
  const fetchSmsContent = async (campaign) => {
    // Check if already cached
    if (smsContent[campaign.name]) {
      return smsContent[campaign.name];
    }

    // Check if SMS preview URL exists
    if (!campaign.preview_sms_url) {
      return null;
    }

    try {
      // Fetch directly from R2 CDN (CORS enabled)
      const response = await fetch(campaign.preview_sms_url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'text/plain, */*'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch SMS content:', response.status);
        return null;
      }

      const text = await response.text();

      // Cache the content
      setSmsContent(prev => ({
        ...prev,
        [campaign.name]: text
      }));

      return text;
    } catch (error) {
      console.error('Error fetching SMS content:', error);
      return null;
    }
  };

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
        x: stats.click_rate || 0, // Click Rate % (already in percentage format)
        y: stats.conversion_rate || 0, // Conversion Rate % (already in percentage format)
        z: stats.conversion_value || stats.revenue || 100, // Revenue (for bubble size)
        name: campaign.campaign_name || campaign.name || 'Unnamed Campaign',
        type: campaign.type || campaign.send_channel || 'email', // Use campaign.type from API
        conversions: stats.conversions || 0,
        clicks: stats.clicks_unique || stats.clicks || 0,
        recipients: stats.recipients || 0,
        revenue: stats.conversion_value || stats.revenue || 0,
        opens: stats.opens_unique || stats.opens || 0,
        openRate: stats.open_rate || 0,
        // Preview URLs
        preview_image_url: campaign.preview_image_url,
        preview_sms_url: campaign.preview_sms_url,
        subject: campaign.subject
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
      const isEmail = bestCampaign.type === 'email';
      const isSMS = bestCampaign.type === 'sms';

      // Channel-specific action items
      const channelSpecificActions = [];
      if (isEmail) {
        channelSpecificActions.push(
          `Analyze "${bestCampaign.name}" for winning elements: subject line, preview text, offer details, CTA placement`,
          'Review email design layout and visual hierarchy',
          'Check timing and day of week for optimal engagement'
        );
      } else if (isSMS) {
        channelSpecificActions.push(
          `Analyze "${bestCampaign.name}" for winning elements: message copy, timing, offer clarity`,
          'Review message length and link placement',
          'Check send timing for optimal response rates'
        );
      }

      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Top Performers Identified',
        description: `${topRight.length} campaign${topRight.length > 1 ? 's' : ''} in top-right quadrant (high engagement + high conversion). "${bestCampaign.name}" (${isEmail ? 'Email' : 'SMS'}) leads with ${formatPercentage(bestCampaign.x)} click rate and ${formatPercentage(bestCampaign.y)} conversion rate.`,
        actions: [
          ...channelSpecificActions,
          'Replicate this campaign structure for similar audience segments',
          `A/B test variations of this successful pattern`,
          'Document this as a template for future campaigns'
        ]
      });
    }

    // CRITICAL: Engagement gap (high clicks, low conversions)
    if (bottomRight.length >= 3) {
      const avgRevenueLost = bottomRight.reduce((sum, d) => sum + (d.clicks * avgConversionRate / 100 * 50), 0); // Estimated lost revenue
      const emailCount = bottomRight.filter(d => d.type === 'email').length;
      const smsCount = bottomRight.filter(d => d.type === 'sms').length;

      const channelActions = [];
      if (emailCount > 0) {
        channelActions.push('Email campaigns: Ensure landing page messaging matches email promise and subject line');
      }
      if (smsCount > 0) {
        channelActions.push('SMS campaigns: Verify link destination is mobile-optimized with fast load times');
      }

      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Engagement Gap - High Interest, Poor Conversion',
        description: `${bottomRight.length} campaigns (${emailCount} email, ${smsCount} SMS) have above-average clicks (${formatPercentage(avgClickRate)}) but below-average conversions (${formatPercentage(avgConversionRate)}). Estimated lost revenue: ${formatCurrency(avgRevenueLost)}.`,
        actions: [
          ...channelActions,
          'Audit landing pages for load time (target: <3 seconds)',
          'Review checkout flow for friction points (form length, required fields)',
          'Add exit-intent popups with limited-time offers',
          'Test different landing page layouts and CTAs'
        ]
      });
    }

    // WARNING: Low engagement, good conversion (improve creative)
    if (topLeft.length >= 2) {
      const emailCount = topLeft.filter(d => d.type === 'email').length;
      const smsCount = topLeft.filter(d => d.type === 'sms').length;

      const channelActions = [];
      if (emailCount > 0) {
        channelActions.push(
          'Email campaigns: A/B test subject lines with urgency and personalization',
          'Email campaigns: Improve preview text to complement subject line',
          'Email campaigns: Test different CTA button colors and copy'
        );
      }
      if (smsCount > 0) {
        channelActions.push(
          'SMS campaigns: Test different message opening hooks and urgency triggers',
          'SMS campaigns: Optimize message length (aim for <160 characters)',
          'SMS campaigns: A/B test send timing for higher open rates'
        );
      }

      recommendations.push({
        severity: 'warning',
        icon: Target,
        title: 'Low Engagement Despite Good Conversions',
        description: `${topLeft.length} campaigns (${emailCount} email, ${smsCount} SMS) have strong conversions but below-average clicks. The offer works - your creative needs improvement.`,
        actions: [
          ...channelActions,
          'Add dynamic content based on past purchase behavior',
          'Focus messaging on single clear offer'
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
      const isEmail = revenueOutlier.type === 'email';
      const isSMS = revenueOutlier.type === 'sms';

      const channelActions = [];
      if (isEmail) {
        channelActions.push('Email-specific: Review subject line, preview text, and design elements that drove revenue');
      } else if (isSMS) {
        channelActions.push('SMS-specific: Analyze message copy, timing, and urgency factors that drove revenue');
      }

      recommendations.push({
        severity: 'success',
        icon: Zap,
        title: 'Revenue Outlier Detected',
        description: `"${revenueOutlier.name}" (${isEmail ? 'Email' : 'SMS'}) generated ${formatCurrency(revenueOutlier.z)} - significantly above average despite ${formatPercentage(revenueOutlier.x)} click rate and ${formatPercentage(revenueOutlier.y)} conversion rate.`,
        actions: [
          ...channelActions,
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
      const emailCount = scatterData.filter(d => d.type === 'email').length;
      const smsCount = scatterData.filter(d => d.type === 'sms').length;

      const channelActions = [];
      if (emailCount > 0) {
        channelActions.push(
          'Email campaigns: Test personalized subject lines with recipient name or company',
          'Email campaigns: Use preview text effectively - don\'t repeat subject line',
          'Email campaigns: Test sending from a person\'s name instead of company name'
        );
      }
      if (smsCount > 0) {
        channelActions.push(
          'SMS campaigns: Lead with value proposition in first 20 characters',
          'SMS campaigns: Include clear call-to-action with shortened link',
          'SMS campaigns: Test send timing (avoid early morning/late night)'
        );
      }

      recommendations.push({
        severity: 'warning',
        icon: Target,
        title: 'Below Industry Benchmark - Click Rates',
        description: `Average click rate is ${formatPercentage(avgClickRatePercent)} (industry average: 2-3% email, 10-15% SMS). Significant improvement opportunity.`,
        actions: [
          ...channelActions,
          'Segment list by engagement level and send different content',
          'Add urgency to messaging (24-hour sales, limited stock)'
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

  // Lightweight Recharts tooltip - only captures data and position
  const DataCaptureTooltip = ({ active, payload, coordinate }) => {
    useEffect(() => {
      if (active && payload && payload.length > 0 && coordinate) {
        const data = payload[0].payload;
        const dataKey = `${data.name}_${coordinate.x}_${coordinate.y}`;

        // Only update if data actually changed
        if (activeDataRef.current !== dataKey) {
          activeDataRef.current = dataKey;

          // Clear any pending close timeout
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }

          // Update tooltip data and position
          setTooltipData(data);
          setTooltipPosition({ x: coordinate.x, y: coordinate.y });
          setIsTooltipVisible(true);

          // Prefetch SMS content if needed
          if (data.type === 'sms' && data.preview_sms_url && !smsContent[data.name]) {
            fetchSmsContent(data);
          }
        }
      } else if (!active && activeDataRef.current !== null) {
        activeDataRef.current = null;

        // Start delayed closing when bubble hover ends
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = setTimeout(() => {
          setIsTooltipVisible(false);
          setTooltipData(null);
        }, 500); // 500ms delay
      }
    }, [active, payload, coordinate]);

    return null; // Don't render anything - we use our custom tooltip
  };

  // Independent custom tooltip with preview
  const renderCustomTooltip = () => {
    if (!isTooltipVisible || !tooltipData) return null;

    const data = tooltipData;

    const hasEmailPreview = data.preview_image_url;
    const hasSMSPreview = data.type === 'sms' && data.preview_sms_url;
    const hasPreview = hasEmailPreview || hasSMSPreview;

    // Position tooltip to top-right of the bubble
    const tooltipStyle = {
      position: 'absolute',
      left: `${tooltipPosition.x + 20}px`,
      top: `${tooltipPosition.y - 20}px`,
      transform: 'translateY(-100%)',
      minWidth: hasPreview ? '320px' : '280px',
      maxWidth: '380px',
      maxHeight: hasPreview ? '600px' : 'auto',
      overflowY: hasPreview ? 'auto' : 'visible',
      overflowX: 'hidden',
      scrollBehavior: 'smooth',
      zIndex: 1000,
      pointerEvents: 'auto' // Allow mouse interaction
    };

    return (
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl campaign-preview-scroll"
        style={tooltipStyle}
        onMouseEnter={() => {
          // Cancel any pending close timeout
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
          setIsTooltipVisible(true);
        }}
        onMouseLeave={() => {
          // Start close timer when leaving tooltip
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
          }
          closeTimeoutRef.current = setTimeout(() => {
            setIsTooltipVisible(false);
            setTooltipData(null);
          }, 500); // 500ms delay
        }}
      >
        <style jsx>{`
          .campaign-preview-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .campaign-preview-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .campaign-preview-scroll::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          .campaign-preview-scroll::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
          .dark .campaign-preview-scroll::-webkit-scrollbar-thumb {
            background: #4b5563;
          }
          .dark .campaign-preview-scroll::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
        `}</style>
        {/* Campaign Info Header - Sticky at top */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
            {data.name}
          </div>
          {data.subject && (
            <div className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
              {data.subject}
            </div>
          )}
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={data.type === 'sms' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}>
              {data.type === 'sms' ? 'SMS' : 'Email'}
            </Badge>
            {hasPreview && (
              <ImageIcon className="h-3 w-3 text-gray-400" title="Preview available" />
            )}
          </div>

          {/* Quick Stats - More Compact */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">{formatNumber(data.recipients)}</span>
            </div>
            {data.type === 'email' && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.openRate)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MousePointer className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.x)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.y)}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(data.revenue)}</span>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {hasPreview && (
          <div>
            {/* SMS Preview */}
            {hasSMSPreview ? (
              <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="p-4">
                  {/* SMS Message Bubble */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm shadow-md p-4 max-w-[280px]">
                    {smsContent[data.name] ? (
                      <>
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
                          {smsContent[data.name]}
                        </div>
                        {/* Character count */}
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                          {smsContent[data.name].length} characters
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        Loading SMS content...
                      </div>
                    )}
                  </div>
                  {/* SMS indicator */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-3 w-3" />
                    <span>SMS Message</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Email Preview - Scrollable full preview */
              hasEmailPreview && (
                <div className="relative bg-gray-50 dark:bg-gray-800">
                  <div className="relative">
                    <img
                      src={data.preview_image_url}
                      alt={`Preview of ${data.name}`}
                      className="w-full h-auto object-cover object-top"
                      style={{
                        maxHeight: 'none',
                        minHeight: '400px' // Show more content for scrolling
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="hidden items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm"
                      style={{ display: 'none' }}
                    >
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Preview not available</p>
                      </div>
                    </div>
                  </div>
                  {/* Scroll indicator at bottom - subtle hint */}
                  <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent pointer-events-none flex items-center justify-center">
                    <div className="text-xs text-gray-400 dark:text-gray-500">Scroll for more</div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
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
        <div className="h-[500px] relative" ref={chartRef}>
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
              <ZAxis type="number" dataKey="z" range={[60, 200]} name="Revenue" />
              <Tooltip
                content={<DataCaptureTooltip />}
                cursor={{ strokeDasharray: '3 3' }}
                wrapperStyle={{ visibility: 'hidden' }} // Hide Recharts tooltip, we render our own
                allowEscapeViewBox={{ x: true, y: true }}
              />

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

              <Scatter
                name="Campaigns"
                data={scatterData}
                onMouseEnter={(data) => {
                  // Prefetch SMS content when hovering over SMS campaigns
                  if (data && data.type === 'sms' && data.preview_sms_url && !smsContent[data.name]) {
                    fetchSmsContent(data);
                  }
                }}
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColor(entry.type)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Independent custom tooltip - rendered outside Recharts */}
          {renderCustomTooltip()}
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

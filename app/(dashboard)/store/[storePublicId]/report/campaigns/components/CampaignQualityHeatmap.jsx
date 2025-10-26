"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info, Award } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell
} from 'recharts';
import { formatPercentage } from '@/lib/utils';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import MorphingLoader from '@/app/components/ui/loading';

/**
 * Campaign Quality Score Heatmap
 *
 * Time-based heatmap showing campaign quality scores:
 * Quality Score = Delivery(20%) + Open(25%) + CTOR(25%) + Conversion(20%) + (100-Spam)(10%)
 *
 * Color scale: Red (0-40) → Orange (40-60) → Yellow (60-80) → Green (80-100)
 *
 * Identifies temporal patterns and quality trends
 */
export default function CampaignQualityHeatmap({ campaigns, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-sky-blue" />
            Campaign Quality Score Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <MorphingLoader size="medium" showText={true} text="Calculating quality scores..." />
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
            <Award className="h-5 w-5 text-sky-blue" />
            Campaign Quality Score Heatmap
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

  // Calculate quality score for a campaign
  const calculateQualityScore = (campaign) => {
    const stats = campaign.statistics || {};

    const deliveryScore = (stats.delivery_rate || 0) * 20; // Max 20 points
    const openScore = (stats.open_rate || 0) * 25; // Max 25 points

    // CTOR (Click-to-Open Rate)
    const ctor = (stats.opens_unique || stats.opens) > 0
      ? ((stats.clicks_unique || stats.clicks || 0) / (stats.opens_unique || stats.opens)) * 25
      : 0; // Max 25 points

    const conversionScore = (stats.conversion_rate || 0) * 20; // Max 20 points
    const spamScore = (1 - (stats.spam_complaint_rate || 0)) * 10; // Max 10 points (inverse of spam rate)

    return Math.min(100, deliveryScore + openScore + ctor + conversionScore + spamScore);
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green - Excellent
    if (score >= 60) return '#fbbf24'; // Yellow - Good
    if (score >= 40) return '#f97316'; // Orange - Fair
    return '#ef4444'; // Red - Poor
  };

  // Get score label
  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  // Transform campaigns into heatmap data with day of week and hour grouping
  const heatmapData = campaigns
    .filter(c => c.send_time)
    .map(campaign => {
      const sendDate = new Date(campaign.send_time);
      const dayOfWeek = sendDate.toLocaleDateString('en-US', { weekday: 'short' });
      const hour = sendDate.getHours();
      const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      const score = calculateQualityScore(campaign);

      return {
        date: sendDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: campaign.send_time,
        dayOfWeek,
        hour,
        timeSlot,
        score,
        color: getScoreColor(score),
        label: getScoreLabel(score),
        name: campaign.campaign_name || campaign.name || 'Unnamed Campaign',
        // Include component scores for tooltip
        deliveryRate: (campaign.statistics?.delivery_rate || 0) * 100,
        openRate: (campaign.statistics?.open_rate || 0) * 100,
        ctor: (campaign.statistics?.opens_unique || campaign.statistics?.opens) > 0
          ? ((campaign.statistics?.clicks_unique || campaign.statistics?.clicks || 0) / (campaign.statistics?.opens_unique || campaign.statistics?.opens)) * 100
          : 0,
        conversionRate: (campaign.statistics?.conversion_rate || 0) * 100,
        spamRate: (campaign.statistics?.spam_complaint_rate || 0) * 100,
        // Add x, y for scatter plot (day index and time)
        dayIndex: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayOfWeek),
        timeIndex: ['Morning', 'Afternoon', 'Evening'].indexOf(timeSlot)
      };
    })
    .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

  // Calculate average scores by day of week
  const dayOfWeekStats = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
    const dayCampaigns = heatmapData.filter(d => d.dayOfWeek === day);
    const avgScore = dayCampaigns.length > 0
      ? dayCampaigns.reduce((sum, d) => sum + d.score, 0) / dayCampaigns.length
      : 0;
    return { day, avgScore, count: dayCampaigns.length };
  });

  // Calculate average scores by time slot
  const timeSlotStats = ['Morning', 'Afternoon', 'Evening'].map(slot => {
    const slotCampaigns = heatmapData.filter(d => d.timeSlot === slot);
    const avgScore = slotCampaigns.length > 0
      ? slotCampaigns.reduce((sum, d) => sum + d.score, 0) / slotCampaigns.length
      : 0;
    return { slot, avgScore, count: slotCampaigns.length };
  });

  // Find best and worst performing days/times
  const bestDay = dayOfWeekStats.reduce((max, d) => d.avgScore > max.avgScore ? d : max, dayOfWeekStats[0] || { day: 'N/A', avgScore: 0 });
  const worstDay = dayOfWeekStats.reduce((min, d) => d.count > 0 && d.avgScore < min.avgScore ? d : min, dayOfWeekStats.find(d => d.count > 0) || { day: 'N/A', avgScore: 100 });

  const bestTime = timeSlotStats.reduce((max, t) => t.avgScore > max.avgScore ? t : max, timeSlotStats[0] || { slot: 'N/A', avgScore: 0 });
  const worstTime = timeSlotStats.reduce((min, t) => t.count > 0 && t.avgScore < min.avgScore ? t : min, timeSlotStats.find(t => t.count > 0) || { slot: 'N/A', avgScore: 100 });

  // Calculate trend - first half vs second half
  const midPoint = Math.floor(heatmapData.length / 2);
  const firstHalf = heatmapData.slice(0, midPoint);
  const secondHalf = heatmapData.slice(midPoint);

  const avgScoreFirstHalf = firstHalf.reduce((sum, d) => sum + d.score, 0) / (firstHalf.length || 1);
  const avgScoreSecondHalf = secondHalf.reduce((sum, d) => sum + d.score, 0) / (secondHalf.length || 1);
  const scoreTrend = avgScoreSecondHalf - avgScoreFirstHalf;

  // Find consecutive low-quality campaigns
  let consecutiveLowCount = 0;
  let maxConsecutiveLow = 0;
  heatmapData.forEach(d => {
    if (d.score < 60) {
      consecutiveLowCount++;
      maxConsecutiveLow = Math.max(maxConsecutiveLow, consecutiveLowCount);
    } else {
      consecutiveLowCount = 0;
    }
  });

  // Campaign frequency analysis
  const campaignsByFrequency = {};
  heatmapData.forEach((campaign, index) => {
    if (index > 0 && heatmapData[index - 1]) {
      const prevDate = new Date(heatmapData[index - 1].fullDate);
      const currDate = new Date(campaign.fullDate);
      const hoursDiff = (currDate - prevDate) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        campaignsByFrequency['<24h'] = (campaignsByFrequency['<24h'] || 0) + 1;
      } else if (hoursDiff < 48) {
        campaignsByFrequency['24-48h'] = (campaignsByFrequency['24-48h'] || 0) + 1;
      } else {
        campaignsByFrequency['>48h'] = (campaignsByFrequency['>48h'] || 0) + 1;
      }
    }
  });

  const highFrequencyCampaigns = campaignsByFrequency['<24h'] || 0;

  // Generate AI-powered recommendations
  const generateRecommendations = () => {
    const recommendations = [];

    // INSIGHT: Best send time
    if (bestDay.count > 0 && worstDay.count > 0 && bestDay.avgScore - worstDay.avgScore > 15) {
      recommendations.push({
        severity: 'success',
        icon: Calendar,
        title: 'Optimal Send Day Identified',
        description: `${bestDay.day} campaigns score ${bestDay.avgScore.toFixed(1)}/100 on average (${bestDay.count} campaigns), vs ${worstDay.day} at ${worstDay.avgScore.toFixed(1)}/100.`,
        actions: [
          `Schedule major campaigns for ${bestDay.day} to maximize quality metrics`,
          `Avoid ${worstDay.day} sends or test different content/timing`,
          'A/B test same campaign on both days to confirm pattern',
          `Consider ${bestDay.day} ${bestTime.slot.toLowerCase()} as premium send window`
        ]
      });
    }

    // INSIGHT: Best time slot
    if (bestTime.count > 0 && worstTime.count > 0 && bestTime.avgScore - worstTime.avgScore > 10) {
      recommendations.push({
        severity: 'success',
        icon: CheckCircle2,
        title: 'Optimal Send Time Identified',
        description: `${bestTime.slot} sends score ${bestTime.avgScore.toFixed(1)}/100 vs ${worstTime.slot} at ${worstTime.avgScore.toFixed(1)}/100. Time of day matters!`,
        actions: [
          `Schedule all major campaigns for ${bestTime.slot.toLowerCase()} sends`,
          `Test ${bestTime.slot} sends on different days to find optimal combination`,
          `Avoid ${worstTime.slot.toLowerCase()} unless testing new segments`
        ]
      });
    }

    // WARNING: Quality decline trend
    if (scoreTrend < -10) {
      recommendations.push({
        severity: 'critical',
        icon: TrendingDown,
        title: 'Quality Decline Detected',
        description: `Campaign quality dropped ${Math.abs(scoreTrend).toFixed(1)} points from ${avgScoreFirstHalf.toFixed(1)} to ${avgScoreSecondHalf.toFixed(1)}. Recent campaigns underperforming.`,
        actions: [
          'Review recent campaign changes (new segments, content types, frequency)',
          'Check if list hygiene has been maintained',
          'Analyze if send frequency increased recently',
          'Consider pause and re-engagement campaign',
          'Return to strategies from higher-scoring period'
        ]
      });
    }

    // WARNING: Consecutive low quality
    if (maxConsecutiveLow >= 5) {
      recommendations.push({
        severity: 'warning',
        icon: AlertCircle,
        title: 'Consecutive Low-Quality Campaigns',
        description: `${maxConsecutiveLow} consecutive campaigns scored below 60/100. Pattern indicates systemic issue, not isolated problem.`,
        actions: [
          'Implement immediate quality review before next campaign',
          'All campaigns were sent too close together - list fatigue likely',
          'Review list segmentation - may be targeting wrong audiences',
          'Pause campaigns for 72 hours and run re-engagement sequence',
          'Add quality gate: campaigns must score >60 in preview before sending'
        ]
      });
    }

    // WARNING: High frequency impact
    if (highFrequencyCampaigns > heatmapData.length * 0.3 && heatmapData.length > 1) {
      const highFreqCampaigns = heatmapData.filter((_, i) => {
        if (i === 0) return false;
        if (!heatmapData[i-1]) return false;
        const hoursDiff = (new Date(heatmapData[i].fullDate) - new Date(heatmapData[i-1].fullDate)) / (1000 * 60 * 60);
        return hoursDiff < 24;
      });

      const avgScoreHighFreq = highFreqCampaigns.length > 0
        ? highFreqCampaigns.reduce((sum, d) => sum + d.score, 0) / highFreqCampaigns.length
        : 0;

      const lowFreqCampaigns = heatmapData.filter((_, i) => {
        if (i === 0) return true;
        if (!heatmapData[i-1]) return true;
        const hoursDiff = (new Date(heatmapData[i].fullDate) - new Date(heatmapData[i-1].fullDate)) / (1000 * 60 * 60);
        return hoursDiff >= 48;
      });

      const avgScoreLowFreq = lowFreqCampaigns.length > 0
        ? lowFreqCampaigns.reduce((sum, d) => sum + d.score, 0) / lowFreqCampaigns.length
        : 0;

      if (avgScoreLowFreq - avgScoreHighFreq > 10) {
        recommendations.push({
          severity: 'warning',
          icon: AlertCircle,
          title: 'Campaign Frequency Impacting Quality',
          description: `${highFrequencyCampaigns} campaigns sent within 24 hours of previous campaign score ${avgScoreHighFreq.toFixed(1)}/100 vs ${avgScoreLowFreq.toFixed(1)}/100 for spaced campaigns.`,
          actions: [
            'Implement 48-hour minimum gap between campaigns',
            'Current send frequency is hurting quality metrics',
            'Reduce campaign volume by 40-50% immediately',
            'Focus on quality over quantity - fewer, better campaigns',
            'Test 3-4 campaigns per week maximum'
          ]
        });
      }
    }

    // SUCCESS: Quality improving
    if (scoreTrend > 10) {
      recommendations.push({
        severity: 'success',
        icon: TrendingUp,
        title: 'Campaign Quality Improving',
        description: `Quality scores increased ${scoreTrend.toFixed(1)} points from ${avgScoreFirstHalf.toFixed(1)} to ${avgScoreSecondHalf.toFixed(1)}. Recent optimizations working!`,
        actions: [
          'Document recent changes that drove improvement',
          'Maintain current strategy and iterate incrementally',
          'Share success metrics and learnings with team',
          'Consider slight volume increase (10%) to test scalability'
        ]
      });
    }

    // INSIGHT: High overall quality
    if (avgScoreSecondHalf >= 75) {
      recommendations.push({
        severity: 'success',
        icon: Award,
        title: 'Excellent Campaign Quality',
        description: `Average quality score of ${avgScoreSecondHalf.toFixed(1)}/100 is industry-leading. Your campaigns are well-optimized.`,
        actions: [
          'Current practices are working - maintain them',
          'Document best practices for team training and onboarding',
          'Consider case study for marketing/sales materials',
          'Test small experiments to push even higher'
        ]
      });
    }

    // WARNING: Low average quality
    if (avgScoreSecondHalf < 50 && heatmapData.length >= 5) {
      recommendations.push({
        severity: 'critical',
        icon: AlertCircle,
        title: 'Low Average Campaign Quality',
        description: `Average score of ${avgScoreSecondHalf.toFixed(1)}/100 is below acceptable threshold (60+). Multiple issues need attention.`,
        actions: [
          'Pause all campaigns for 48-72 hours',
          'Run comprehensive list hygiene - remove bounces and inactive subscribers',
          'Review and improve email content quality',
          'Implement double opt-in to improve future list quality',
          'Start with small test segments (5-10%) before full sends',
          'Consider consulting email deliverability expert'
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
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {data.date} - {data.dayOfWeek} {data.timeSlot}
        </p>

        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Quality Score:</span>
            <span className={`text-xl font-bold`} style={{ color: data.color }}>
              {data.score.toFixed(1)}/100
            </span>
          </div>
          <div className="text-xs text-center mt-1" style={{ color: data.color }}>
            {data.label}
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-8">
            <span className="text-gray-600 dark:text-gray-400">Delivery Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.deliveryRate)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-gray-600 dark:text-gray-400">Open Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.openRate)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-gray-600 dark:text-gray-400">CTOR:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.ctor)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-gray-600 dark:text-gray-400">Conversion Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.conversionRate)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-gray-600 dark:text-gray-400">Spam Rate:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercentage(data.spamRate)}</span>
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
            <Award className="h-5 w-5 text-sky-blue" />
            Campaign Quality Score Heatmap
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">Quality Score Formula</p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li><strong>Delivery Rate:</strong> 20% weight</li>
                      <li><strong>Open Rate:</strong> 25% weight</li>
                      <li><strong>CTOR:</strong> 25% weight</li>
                      <li><strong>Conversion Rate:</strong> 20% weight</li>
                      <li><strong>Spam Safety:</strong> 10% weight (inverse of spam rate)</li>
                    </ul>
                    <div className="text-xs mt-2 pt-2 border-t space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                        <span className="text-gray-600 dark:text-gray-400">80-100: Excellent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
                        <span className="text-gray-600 dark:text-gray-400">60-79: Good</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
                        <span className="text-gray-600 dark:text-gray-400">40-59: Fair</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                        <span className="text-gray-600 dark:text-gray-400">0-39: Poor</span>
                      </div>
                    </div>
                    <p className="text-xs mt-2 pt-2 border-t text-gray-900 dark:text-white font-semibold">
                      How to Use:
                    </p>
                    <ul className="text-xs space-y-1 text-gray-900 dark:text-gray-100">
                      <li>• Larger bubbles = higher quality campaigns</li>
                      <li>• Colors indicate quality tier (green=excellent, red=poor)</li>
                      <li>• Identify patterns: which days/times consistently perform better?</li>
                      <li>• Focus on replicating green campaigns and avoiding red patterns</li>
                    </ul>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={scoreTrend >= 0 ? 'success' : 'destructive'} className={scoreTrend >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}>
              {scoreTrend >= 0 ? '+' : ''}{scoreTrend.toFixed(1)} pts
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scatter Plot Heatmap */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="category"
                dataKey="date"
                name="Date"
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                type="category"
                dataKey="timeSlot"
                name="Time"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <ZAxis type="number" dataKey="score" range={[200, 800]} name="Quality Score" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={heatmapData}>
                {heatmapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Performance by Day/Time Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Performing Days */}
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Best Performance
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Best Day:</span>
                <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {bestDay.day} - {bestDay.avgScore.toFixed(1)}/100
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Best Time:</span>
                <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {bestTime.slot} - {bestTime.avgScore.toFixed(1)}/100
                </Badge>
              </div>
            </div>
          </div>

          {/* Worst Performing Days */}
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Areas for Improvement
            </h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Worst Day:</span>
                <Badge variant="destructive">
                  {worstDay.day} - {worstDay.avgScore.toFixed(1)}/100
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Worst Time:</span>
                <Badge variant="destructive">
                  {worstTime.slot} - {worstTime.avgScore.toFixed(1)}/100
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Quality</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{avgScoreSecondHalf.toFixed(1)}</div>
            <div className={`text-xs flex items-center gap-1 mt-1 ${scoreTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scoreTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(scoreTrend).toFixed(1)} pts
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Excellent</div>
            <div className="text-2xl font-bold text-green-600">
              {heatmapData.filter(d => d.score >= 80).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">80+ score</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Good</div>
            <div className="text-2xl font-bold text-yellow-600">
              {heatmapData.filter(d => d.score >= 60 && d.score < 80).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">60-79 score</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Needs Work</div>
            <div className="text-2xl font-bold text-red-600">
              {heatmapData.filter(d => d.score < 60).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">&lt;60 score</div>
          </div>
        </div>

        {/* Quality Insights & Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-blue" />
                Quality Insights & Recommendations
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

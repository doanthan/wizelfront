"use client";

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, Target, DollarSign, Users, Award,
  Activity, BarChart3,
  MousePointer, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { cn, formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Line,
  ReferenceLine
} from 'recharts';

// Performance scoring metrics
const PERFORMANCE_METRICS = [
  {
    id: 'revenue-efficiency',
    name: 'Revenue Efficiency ($/Recipient & $/Click)',
    description: 'Revenue generated per email sent and per click received',
    icon: DollarSign,
    color: '#10b981',
    primary: 'revenuePerRecipient',
    secondary: 'revenuePerClick',
    calculation: 'Higher values indicate better monetization'
  },
  {
    id: 'engagement-quality',
    name: 'Engagement Quality (Click/Open & Conv/Click)',
    description: 'Quality of engagement through the funnel',
    icon: Activity,
    color: '#3b82f6',
    primary: 'clickToOpenRate',
    secondary: 'conversionRate',
    calculation: 'Shows how engaged users convert'
  },
  {
    id: 'volume-performance',
    name: 'Volume vs Performance',
    description: 'Balance between reach and engagement',
    icon: Users,
    color: '#8b5cf6',
    primary: 'recipients',
    secondary: 'openRate',
    calculation: 'Identifies over/under-mailing patterns'
  },
  {
    id: 'conversion-funnel',
    name: 'Full Funnel (Opens → Clicks → Conversions)',
    description: 'Performance at each stage of the customer journey',
    icon: Target,
    color: '#f59e0b',
    primary: 'opens',
    secondary: 'conversions',
    calculation: 'Tracks funnel effectiveness'
  },
  {
    id: 'customer-value',
    name: 'Customer Value (AOV & Conv Rate)',
    description: 'Quality and value of acquired customers',
    icon: Award,
    color: '#ec4899',
    primary: 'averageOrderValue',
    secondary: 'conversionRate',
    calculation: 'Higher AOV with good conversion = premium customers'
  },
  {
    id: 'list-health',
    name: 'List Health (Engagement vs Unsubscribes)',
    description: 'Balance of engagement against list churn',
    icon: Mail,
    color: '#06b6d4',
    primary: 'clickRate',
    secondary: 'unsubscribeRate',
    calculation: 'High engagement with low unsubs = healthy list'
  },
  {
    id: 'campaign-roi',
    name: 'Campaign ROI (Revenue per Campaign)',
    description: 'Average revenue generated per campaign sent',
    icon: BarChart3,
    color: '#f97316',
    primary: 'revenuePerCampaign',
    secondary: 'campaigns',
    calculation: 'Shows campaign effectiveness'
  },
  {
    id: 'click-quality',
    name: 'Click Quality ($/Click & Conv/Click)',
    description: 'Value and conversion rate of clicks',
    icon: MousePointer,
    color: '#a855f7',
    primary: 'revenuePerClick',
    secondary: 'clickToConversionRate',
    calculation: 'Identifies high-intent traffic'
  }
];

// Calculate dynamic benchmarks from account data
const calculateBenchmarks = (accounts) => {
  if (!accounts || accounts.length === 0) {
    return {
      avg: {},
      median: {},
      best: {},
      percentiles: {}
    };
  }

  const metrics = [
    'revenue', 'openRate', 'clickRate', 'conversionRate',
    'revenuePerRecipient', 'revenuePerClick', 'averageOrderValue',
    'clickToOpenRate', 'unsubscribeRate', 'recipients',
    'revenuePerCampaign', 'clickToConversionRate'
  ];

  const benchmarks = {
    avg: {},
    median: {},
    best: {},
    percentiles: {
      p25: {},
      p50: {},
      p75: {},
      p90: {}
    }
  };

  metrics.forEach(metric => {
    const values = accounts
      .map(a => a[metric] || 0)
      .filter(v => v > 0)
      .sort((a, b) => a - b);

    if (values.length > 0) {
      // Average
      benchmarks.avg[metric] = values.reduce((sum, v) => sum + v, 0) / values.length;

      // Median
      const mid = Math.floor(values.length / 2);
      benchmarks.median[metric] = values.length % 2
        ? values[mid]
        : (values[mid - 1] + values[mid]) / 2;

      // Best (top value)
      benchmarks.best[metric] = values[values.length - 1];

      // Percentiles
      benchmarks.percentiles.p25[metric] = values[Math.floor(values.length * 0.25)];
      benchmarks.percentiles.p50[metric] = benchmarks.median[metric];
      benchmarks.percentiles.p75[metric] = values[Math.floor(values.length * 0.75)];
      benchmarks.percentiles.p90[metric] = values[Math.floor(values.length * 0.90)];
    }
  });

  return benchmarks;
};

// Calculate relative performance score
const calculateRelativeScore = (account, accounts, metric, benchmarkType = 'percentile') => {
  const benchmarks = calculateBenchmarks(accounts);

  if (benchmarkType === 'percentile') {
    // Score based on percentile ranking
    const relevantMetrics = [];

    if (metric.primary) {
      const value = account[metric.primary] || 0;
      const values = accounts
        .map(a => a[metric.primary] || 0)
        .filter(v => v > 0)
        .sort((a, b) => a - b);

      if (values.length > 0) {
        const rank = values.filter(v => v <= value).length;
        const percentile = (rank / values.length) * 100;
        relevantMetrics.push(percentile);
      }
    }

    if (metric.secondary) {
      const value = account[metric.secondary] || 0;
      const values = accounts
        .map(a => a[metric.secondary] || 0)
        .filter(v => v > 0)
        .sort((a, b) => {
          // Inverse for negative metrics like unsubscribe rate
          if (metric.secondary === 'unsubscribeRate') {
            return b - a;
          }
          return a - b;
        });

      if (values.length > 0) {
        const rank = values.filter(v => {
          if (metric.secondary === 'unsubscribeRate') {
            return v >= value; // Lower is better
          }
          return v <= value;
        }).length;
        const percentile = (rank / values.length) * 100;
        relevantMetrics.push(percentile);
      }
    }

    // Average of percentiles
    return relevantMetrics.length > 0
      ? Math.round(relevantMetrics.reduce((sum, p) => sum + p, 0) / relevantMetrics.length)
      : 50;
  }

  // Score based on comparison to average
  let score = 50; // Base score

  if (metric.primary && benchmarks.avg[metric.primary]) {
    const ratio = account[metric.primary] / benchmarks.avg[metric.primary];
    score += (ratio - 1) * 25; // +/- 25 points per 100% difference from avg
  }

  if (metric.secondary && benchmarks.avg[metric.secondary]) {
    const ratio = account[metric.secondary] / benchmarks.avg[metric.secondary];
    if (metric.secondary === 'unsubscribeRate') {
      score -= (ratio - 1) * 25; // Inverse for negative metrics
    } else {
      score += (ratio - 1) * 25;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

// Get performance tier based on percentile
const getPerformanceTier = (score) => {
  if (score >= 80) return {
    tier: 'Top Performer',
    color: '#10b981',
    icon: CheckCircle,
    description: 'Top 20% of accounts'
  };
  if (score >= 60) return {
    tier: 'Above Average',
    color: '#3b82f6',
    icon: TrendingUp,
    description: 'Better than most'
  };
  if (score >= 40) return {
    tier: 'Average',
    color: '#f59e0b',
    icon: Activity,
    description: 'Middle of the pack'
  };
  if (score >= 20) return {
    tier: 'Below Average',
    color: '#fb923c',
    icon: AlertTriangle,
    description: 'Room for improvement'
  };
  return {
    tier: 'Needs Attention',
    color: '#ef4444',
    icon: TrendingDown,
    description: 'Bottom 20% - Focus here'
  };
};

// Format metric value for display
const formatMetricValue = (value, key) => {
  if (!value && value !== 0) return 'N/A';
  if (key === 'revenue' || key === 'averageOrderValue' || key.includes('revenue')) {
    return formatCurrency(value);
  }
  if (key.includes('Rate') || key.includes('rate')) {
    return formatPercentage(value);
  }
  if (key === 'recipients' || key === 'opens' || key === 'clicks' || key === 'conversions') {
    return formatNumber(value);
  }
  return typeof value === 'number' ? value.toFixed(2) : value;
};

export default function AccountPerformanceChart({
  accountData = []
}) {
  const [selectedMetric, setSelectedMetric] = useState(PERFORMANCE_METRICS[0]);
  const [viewMode, setViewMode] = useState('scorecard'); // scorecard, comparison, scatter, radar
  const [sortBy, setSortBy] = useState('score-desc');
  const [benchmarkType] = useState('percentile'); // percentile, average
  const [showDetails, setShowDetails] = useState(false);

  // Calculate dynamic benchmarks
  const benchmarks = useMemo(() => {
    return calculateBenchmarks(accountData);
  }, [accountData]);

  // Calculate scores for all accounts
  const scoredAccounts = useMemo(() => {
    return accountData.map(account => {
      const scores = {};
      let totalScore = 0;

      PERFORMANCE_METRICS.forEach(metric => {
        const score = calculateRelativeScore(account, accountData, metric, benchmarkType);
        scores[metric.id] = score;
        totalScore += score;
      });

      const avgScore = Math.round(totalScore / PERFORMANCE_METRICS.length);
      const selectedScore = scores[selectedMetric.id];
      const tier = getPerformanceTier(selectedScore);

      return {
        ...account,
        scores,
        selectedScore,
        overallScore: avgScore,
        tier,
        percentileRank: Math.round((accountData.filter(a =>
          (a[selectedMetric.primary] || 0) <= (account[selectedMetric.primary] || 0)
        ).length / accountData.length) * 100)
      };
    });
  }, [accountData, selectedMetric, benchmarkType]);

  // Sort accounts based on selection
  const sortedAccounts = useMemo(() => {
    const accounts = [...scoredAccounts];
    switch(sortBy) {
      case 'score-desc':
        return accounts.sort((a, b) => b.selectedScore - a.selectedScore);
      case 'score-asc':
        return accounts.sort((a, b) => a.selectedScore - b.selectedScore);
      case 'name':
        return accounts.sort((a, b) => (a.accountName || '').localeCompare(b.accountName || ''));
      case 'revenue':
        return accounts.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
      case 'percentile':
        return accounts.sort((a, b) => b.percentileRank - a.percentileRank);
      default:
        return accounts;
    }
  }, [scoredAccounts, sortBy]);

  // Prepare data for different visualizations
  const chartData = useMemo(() => {
    if (viewMode === 'scatter') {
      return sortedAccounts.map(account => ({
        x: account.revenuePerRecipient || 0,
        y: account.revenuePerClick || 0,
        z: account.revenue || 0,
        name: account.accountName,
        score: account.selectedScore,
        fill: account.tier.color
      }));
    }

    if (viewMode === 'radar') {
      // Prepare radar chart data for top 5 accounts
      return PERFORMANCE_METRICS.slice(0, 6).map(metric => {
        const dataPoint = {
          metric: metric.name.split(' (')[0] // Shorter names for radar
        };
        sortedAccounts.slice(0, 5).forEach(account => {
          dataPoint[account.accountName] = account.scores[metric.id];
        });
        return dataPoint;
      });
    }

    // Default bar chart data
    return sortedAccounts.map(account => ({
      name: account.accountName,
      score: account.selectedScore,
      revenue: account.revenue,
      [selectedMetric.primary]: account[selectedMetric.primary],
      [selectedMetric.secondary]: account[selectedMetric.secondary],
      fill: account.tier.color,
      percentile: account.percentileRank
    }));
  }, [sortedAccounts, viewMode, selectedMetric]);

  const MetricIcon = selectedMetric.icon;

  // Get insights
  const insights = useMemo(() => {
    if (sortedAccounts.length === 0) return null;

    const topPerformer = sortedAccounts[0];
    const bottomPerformer = sortedAccounts[sortedAccounts.length - 1];
    const avgScore = sortedAccounts.reduce((sum, a) => sum + a.selectedScore, 0) / sortedAccounts.length;

    return {
      top: topPerformer,
      bottom: bottomPerformer,
      avgScore: Math.round(avgScore),
      spread: topPerformer.selectedScore - bottomPerformer.selectedScore,
      topMetric: Object.entries(topPerformer.scores).reduce((max, [key, value]) =>
        value > max.value ? { metric: key, value } : max,
        { metric: '', value: 0 }
      )
    };
  }, [sortedAccounts]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex items-start gap-3">
            <MetricIcon className="h-6 w-6 mt-1" style={{ color: selectedMetric.color }} />
            <div>
              <CardTitle>Campaign Performance by Account</CardTitle>
              <CardDescription className="mt-1">
                Account-level metrics comparison across your stores
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scorecard">Scorecard View</SelectItem>
                <SelectItem value="comparison">Bar Comparison</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
                <SelectItem value="radar">Radar Chart</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By Selector */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-desc">Best Performance</SelectItem>
                <SelectItem value="score-asc">Needs Improvement</SelectItem>
                <SelectItem value="name">Account Name</SelectItem>
                <SelectItem value="revenue">Total Revenue</SelectItem>
                <SelectItem value="percentile">Percentile Rank</SelectItem>
              </SelectContent>
            </Select>

            {/* Metric Selector */}
            <Select
              value={selectedMetric.id}
              onValueChange={(value) => {
                const metric = PERFORMANCE_METRICS.find(m => m.id === value);
                if (metric) setSelectedMetric(metric);
              }}
            >
              <SelectTrigger className="w-[380px]">
                <SelectValue placeholder="Select metric..." />
              </SelectTrigger>
              <SelectContent>
                {PERFORMANCE_METRICS.map(metric => {
                  const Icon = metric.icon;
                  return (
                    <SelectItem key={metric.id} value={metric.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: metric.color }} />
                        <span>{metric.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Performance Insights Alert */}
        {insights && (
          <Alert className="mt-4 border-sky-200 bg-sky-50 dark:bg-sky-900/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-1">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">What this shows:</strong> {selectedMetric.description}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">How to interpret:</strong> {selectedMetric.calculation}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Action to take:</strong> Focus on accounts with {insights.spread > 40 ? 'red/orange' : 'yellow'} scores.
                  {insights.top.accountName} is your best performer ({insights.top.selectedScore}%).
                  {insights.spread > 50 && ` Apply their strategies to ${insights.bottom.accountName} (${insights.bottom.selectedScore}%).`}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Performance Score Summary */}
        <div className="px-6 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                {selectedMetric.name} Scores
              </h4>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-1">How Scoring Works</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Compares {selectedMetric.primary?.replace(/([A-Z])/g, ' $1').toLowerCase()} and {selectedMetric.secondary?.replace(/([A-Z])/g, ' $1').toLowerCase()} to account averages
                      </p>
                    </div>
                    <div className="border-t pt-3">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Score Ranges</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-green-500"></div>
                          <span className="text-sm">70-100%: Excellent - Top performers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-yellow-500"></div>
                          <span className="text-sm">40-69%: Good - Room for improvement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-red-500"></div>
                          <span className="text-sm">0-39%: Needs attention - Priority optimization</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="text-xs text-gray-900 dark:text-gray-400">
              Click scores to see details
            </div>
          </div>

          {/* Score badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {sortedAccounts.map((account, index) => (
              <button
                key={account.accountId || index}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105",
                  account.selectedScore >= 70
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : account.selectedScore >= 40
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                <span>{account.accountName}:</span>
                <span className="font-bold">{account.selectedScore}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* View: Scorecard */}
        {viewMode === 'scorecard' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedAccounts.map((account, index) => {
                const TierIcon = account.tier.icon;
                const rank = index + 1;
                const isTop = rank <= 3;

                return (
                  <div
                    key={account.accountId || index}
                    className="relative bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: account.tier.color }}
                  >
                    {/* Rank Badge */}
                    {isTop && (
                      <div className="absolute -top-2 -left-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md",
                          rank === 1 && "bg-yellow-500",
                          rank === 2 && "bg-gray-400",
                          rank === 3 && "bg-orange-600"
                        )}>
                          #{rank}
                        </div>
                      </div>
                    )}

                    {/* Score Badge */}
                    <div className="absolute -top-2 -right-2">
                      <div
                        className="rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-sm shadow-lg"
                        style={{ backgroundColor: account.tier.color }}
                      >
                        {account.selectedScore}
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="space-y-3">
                      <div className="pr-12 pl-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {account.accountName}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          <TierIcon className="h-4 w-4" style={{ color: account.tier.color }} />
                          <span className="text-sm" style={{ color: account.tier.color }}>
                            {account.tier.tier}
                          </span>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-300">Revenue</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(account.revenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-300">
                            {selectedMetric.primary?.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatMetricValue(account[selectedMetric.primary], selectedMetric.primary)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-300">
                            {selectedMetric.secondary?.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatMetricValue(account[selectedMetric.secondary], selectedMetric.secondary)}
                          </span>
                        </div>
                      </div>

                      {/* Performance vs Average */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-300">vs Average</span>
                          <span className="text-xs text-sky-600">
                            Percentile: {account.percentileRank}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          {selectedMetric.primary && benchmarks.avg[selectedMetric.primary] > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-300 w-20 truncate">
                                {selectedMetric.primary.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, (account[selectedMetric.primary] / benchmarks.avg[selectedMetric.primary]) * 50)}%`,
                                    backgroundColor: account[selectedMetric.primary] >= benchmarks.avg[selectedMetric.primary] ? '#10b981' : '#f59e0b'
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium w-12 text-right text-gray-900 dark:text-gray-300">
                                {account[selectedMetric.primary] >= benchmarks.avg[selectedMetric.primary] ? '+' : ''}
                                {Math.round(((account[selectedMetric.primary] / benchmarks.avg[selectedMetric.primary]) - 1) * 100)}%
                              </span>
                            </div>
                          )}

                          {selectedMetric.secondary && benchmarks.avg[selectedMetric.secondary] > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-900 dark:text-gray-300 w-20 truncate">
                                {selectedMetric.secondary.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, (account[selectedMetric.secondary] / benchmarks.avg[selectedMetric.secondary]) * 50)}%`,
                                    backgroundColor:
                                      selectedMetric.secondary === 'unsubscribeRate'
                                        ? (account[selectedMetric.secondary] <= benchmarks.avg[selectedMetric.secondary] ? '#10b981' : '#ef4444')
                                        : (account[selectedMetric.secondary] >= benchmarks.avg[selectedMetric.secondary] ? '#10b981' : '#f59e0b')
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium w-12 text-right text-gray-900 dark:text-gray-300">
                                {selectedMetric.secondary === 'unsubscribeRate'
                                  ? (account[selectedMetric.secondary] <= benchmarks.avg[selectedMetric.secondary] ? '-' : '+')
                                  : (account[selectedMetric.secondary] >= benchmarks.avg[selectedMetric.secondary] ? '+' : '')
                                }
                                {Math.round(((account[selectedMetric.secondary] / benchmarks.avg[selectedMetric.secondary]) - 1) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View: Bar Comparison */}
        {viewMode === 'comparison' && (
          <div className="p-6">
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: 'Performance Score (%)', angle: -90, position: 'insideLeft' }}
                />
                {selectedMetric.secondary && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                    tickFormatter={(value) => formatMetricValue(value, selectedMetric.secondary).replace('$', '')}
                  />
                )}
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;

                    return (
                      <div className="bg-white dark:bg-gray-900 p-3 border rounded shadow-lg">
                        <p className="font-semibold mb-2">{label}</p>
                        <div className="space-y-1 text-sm">
                          <p className="flex justify-between gap-4">
                            <span>Score:</span>
                            <span className="font-bold" style={{ color: data.fill }}>{data.score}%</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span>Percentile:</span>
                            <span>{data.percentile}%</span>
                          </p>
                          {selectedMetric.primary && (
                            <p className="flex justify-between gap-4">
                              <span>{selectedMetric.primary.replace(/([A-Z])/g, ' $1')}:</span>
                              <span>{formatMetricValue(data[selectedMetric.primary], selectedMetric.primary)}</span>
                            </p>
                          )}
                          {selectedMetric.secondary && (
                            <p className="flex justify-between gap-4">
                              <span>{selectedMetric.secondary.replace(/([A-Z])/g, ' $1')}:</span>
                              <span>{formatMetricValue(data[selectedMetric.secondary], selectedMetric.secondary)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />

                {/* Reference lines for performance tiers */}
                <ReferenceLine
                  y={80}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: "Top 20%", position: "left" }}
                  yAxisId="left"
                />
                <ReferenceLine
                  y={60}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  label={{ value: "Above Avg", position: "left" }}
                  yAxisId="left"
                />
                <ReferenceLine
                  y={40}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: "Average", position: "left" }}
                  yAxisId="left"
                />
                <ReferenceLine
                  y={20}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: "Bottom 20%", position: "left" }}
                  yAxisId="left"
                />

                <Bar yAxisId="left" dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="score" position="top" formatter={(value) => `${value}%`} />
                </Bar>

                {selectedMetric.secondary && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={selectedMetric.secondary}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    name={selectedMetric.secondary.replace(/([A-Z])/g, ' $1')}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* View: Scatter Plot */}
        {viewMode === 'scatter' && (
          <div className="p-6">
            <ResponsiveContainer width="100%" height={450}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Revenue per Recipient"
                  label={{ value: '$/Recipient', position: 'insideBottom', offset: -10 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Revenue per Click"
                  label={{ value: '$/Click', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <ZAxis
                  type="number"
                  dataKey="z"
                  name="Total Revenue"
                  range={[50, 400]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;

                    return (
                      <div className="bg-white dark:bg-gray-900 p-3 border rounded shadow-lg">
                        <p className="font-semibold mb-2">{data.name}</p>
                        <div className="space-y-1 text-sm">
                          <p>Score: <span className="font-bold" style={{ color: data.fill }}>{data.score}%</span></p>
                          <p>$/Recipient: {formatCurrency(data.x)}</p>
                          <p>$/Click: {formatCurrency(data.y)}</p>
                          <p>Revenue: {formatCurrency(data.z)}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  name="Accounts"
                  data={chartData}
                  fill="#8884d8"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
                {/* Add average lines */}
                <ReferenceLine
                  x={benchmarks.avg.revenuePerRecipient}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label="Avg $/Recipient"
                />
                <ReferenceLine
                  y={benchmarks.avg.revenuePerClick}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label="Avg $/Click"
                />
              </ScatterChart>
            </ResponsiveContainer>

            {/* Quadrant explanation */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded bg-green-50 dark:bg-green-900/20">
                <strong className="text-green-700 dark:text-green-400">Top Right:</strong> Star Performers
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  High $/recipient and $/click - your best accounts
                </p>
              </div>
              <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20">
                <strong className="text-blue-700 dark:text-blue-400">Top Left:</strong> Click Optimizers
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  High $/click but low $/recipient - improve open rates
                </p>
              </div>
              <div className="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20">
                <strong className="text-yellow-700 dark:text-yellow-400">Bottom Right:</strong> Volume Players
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  High $/recipient but low $/click - improve targeting
                </p>
              </div>
              <div className="p-3 rounded bg-red-50 dark:bg-red-900/20">
                <strong className="text-red-700 dark:text-red-400">Bottom Left:</strong> Need Focus
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Below average on both - requires strategy review
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View: Radar Chart */}
        {viewMode === 'radar' && (
          <div className="p-6">
            <ResponsiveContainer width="100%" height={450}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                />
                {sortedAccounts.slice(0, 5).map((account, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
                  return (
                    <Radar
                      key={account.accountId || index}
                      name={account.accountName}
                      dataKey={account.accountName}
                      stroke={colors[index]}
                      fill={colors[index]}
                      fillOpacity={0.3}
                    />
                  );
                })}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>

            {/* Top 5 accounts performance summary */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
              {sortedAccounts.slice(0, 5).map((account, index) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
                return (
                  <div key={account.accountId || index} className="p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index] }} />
                      <span className="text-xs font-semibold truncate">{account.accountName}</span>
                    </div>
                    <p className="text-xs text-gray-900 dark:text-gray-400">
                      Overall: {account.overallScore}%
                    </p>
                    <p className="text-xs text-gray-900 dark:text-gray-500">
                      Best: {Object.entries(account.scores).reduce((max, [key, value]) =>
                        value > max.value ? { metric: key, value } : max,
                        { metric: '', value: 0 }
                      ).metric.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Average Metrics Reference */}
        <div className="border-t bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-300">
              Account Averages (Your Benchmark)
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {showDetails && benchmarks.avg && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Avg Open Rate:</span>
                <span className="ml-2 font-medium">{formatPercentage(benchmarks.avg.openRate || 0)}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Avg Click Rate:</span>
                <span className="ml-2 font-medium">{formatPercentage(benchmarks.avg.clickRate || 0)}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Avg Conv Rate:</span>
                <span className="ml-2 font-medium">{formatPercentage(benchmarks.avg.conversionRate || 0)}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Avg AOV:</span>
                <span className="ml-2 font-medium">{formatCurrency(benchmarks.avg.averageOrderValue || 0)}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Avg $/Recipient:</span>
                <span className="ml-2 font-medium">{formatCurrency(benchmarks.avg.revenuePerRecipient || 0)}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Avg $/Click:</span>
                <span className="ml-2 font-medium">{formatCurrency(benchmarks.avg.revenuePerClick || 0)}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Avg Unsub Rate:</span>
                <span className="ml-2 font-medium">{formatPercentage(benchmarks.avg.unsubscribeRate || 0)}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-900 dark:text-gray-400">Total Accounts:</span>
                <span className="ml-2 font-medium">{accountData.length}</span>
              </div>
            </div>
          )}

          {!showDetails && (
            <p className="text-xs text-gray-900 dark:text-gray-400 mt-2">
              Scores compare each account to the average of all {accountData.length} accounts in your portfolio
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
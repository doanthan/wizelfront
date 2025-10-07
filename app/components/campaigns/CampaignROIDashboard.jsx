"use client";

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Info, Filter, Download,
  PieChart, BarChart3, Activity, Zap, Award, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { cn, formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  ReferenceArea,
  Treemap
} from 'recharts';

// Calculate campaign costs (you'd replace with actual cost data)
const estimateCampaignCost = (campaign) => {
  const stats = campaign.statistics || {};
  const channel = campaign.groupings?.send_channel || 'email';

  let baseCost = 0;
  if (channel === 'email') {
    baseCost = (stats.recipients || 0) * 0.001; // $0.001 per email
  } else if (channel === 'sms') {
    baseCost = (stats.recipients || 0) * 0.02; // $0.02 per SMS
  } else if (channel === 'push') {
    baseCost = (stats.recipients || 0) * 0.0001; // $0.0001 per push
  }

  // Add estimated creative/labor costs
  const laborCost = 50; // $50 per campaign for creation
  const platformFee = baseCost * 0.1; // 10% platform fee

  return baseCost + laborCost + platformFee;
};

// Calculate ROI metrics for campaigns
const calculateROIMetrics = (campaigns) => {
  return campaigns.map(campaign => {
    const stats = campaign.statistics || {};
    const revenue = stats.conversion_value || 0;
    const cost = estimateCampaignCost(campaign);
    const profit = revenue - cost;
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      ...campaign,
      cost,
      revenue,
      profit,
      roi,
      profitMargin,
      breakEvenPoint: cost > 0 ? Math.ceil(cost / (stats.average_order_value || 1)) : 0,
      paybackDays: revenue > 0 ? Math.ceil((cost / revenue) * 30) : null,
      revenuePerDollar: cost > 0 ? revenue / cost : 0,
      costPerConversion: stats.conversion_uniques > 0 ? cost / stats.conversion_uniques : 0,
      isProfitable: profit > 0
    };
  });
};

// Get ROI tier
const getROITier = (roi) => {
  if (roi >= 1000) return { label: 'Exceptional', color: '#10b981', icon: Award };
  if (roi >= 500) return { label: 'Excellent', color: '#3b82f6', icon: TrendingUp };
  if (roi >= 200) return { label: 'Good', color: '#06b6d4', icon: Activity };
  if (roi >= 100) return { label: 'Average', color: '#f59e0b', icon: BarChart3 };
  if (roi >= 0) return { label: 'Break-even', color: '#fb923c', icon: AlertTriangle };
  return { label: 'Loss', color: '#ef4444', icon: TrendingDown };
};

// Custom tooltip for scatter plot
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-900 p-3 border rounded shadow-lg">
      <p className="font-semibold mb-2">{data.name}</p>
      <div className="space-y-1 text-sm">
        <p>Revenue: {formatCurrency(data.x)}</p>
        <p>Cost: {formatCurrency(data.y)}</p>
        <p>ROI: {data.z.toFixed(0)}%</p>
        <p>Profit: {formatCurrency(data.profit)}</p>
      </div>
    </div>
  );
};

// Custom treemap content
const CustomTreemapContent = ({ x, y, width, height, name, value, roi }) => {
  const tier = getROITier(roi);
  const fontSize = width > 100 ? 12 : 10;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: tier.color,
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 0.8
        }}
      />
      {width > 50 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 10}
            fill="#fff"
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="bold"
          >
            {name.length > 15 ? name.substring(0, 15) + '...' : name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 5}
            fill="#fff"
            textAnchor="middle"
            fontSize={fontSize - 2}
          >
            {formatCurrency(value)}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 18}
            fill="#fff"
            textAnchor="middle"
            fontSize={fontSize - 2}
          >
            ROI: {roi.toFixed(0)}%
          </text>
        </>
      )}
    </g>
  );
};

export default function CampaignROIDashboard({ campaigns = [], stores = [], dateRange = null }) {
  const [viewMode, setViewMode] = useState('overview'); // overview, profitability, comparison, breakdown
  const [sortBy, setSortBy] = useState('roi-desc');
  const [filterProfitable, setFilterProfitable] = useState('all'); // all, profitable, unprofitable

  // Calculate ROI metrics for all campaigns
  const campaignsWithROI = useMemo(() => {
    return calculateROIMetrics(campaigns);
  }, [campaigns]);

  // Filter campaigns based on profitability
  const filteredCampaigns = useMemo(() => {
    if (filterProfitable === 'profitable') {
      return campaignsWithROI.filter(c => c.isProfitable);
    }
    if (filterProfitable === 'unprofitable') {
      return campaignsWithROI.filter(c => !c.isProfitable);
    }
    return campaignsWithROI;
  }, [campaignsWithROI, filterProfitable]);

  // Sort campaigns
  const sortedCampaigns = useMemo(() => {
    const sorted = [...filteredCampaigns];
    switch (sortBy) {
      case 'roi-desc':
        return sorted.sort((a, b) => b.roi - a.roi);
      case 'roi-asc':
        return sorted.sort((a, b) => a.roi - b.roi);
      case 'profit-desc':
        return sorted.sort((a, b) => b.profit - a.profit);
      case 'revenue-desc':
        return sorted.sort((a, b) => b.revenue - a.revenue);
      default:
        return sorted;
    }
  }, [filteredCampaigns, sortBy]);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const totalRevenue = campaignsWithROI.reduce((sum, c) => sum + c.revenue, 0);
    const totalCost = campaignsWithROI.reduce((sum, c) => sum + c.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const overallROI = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
    const profitableCampaigns = campaignsWithROI.filter(c => c.isProfitable).length;
    const avgROI = campaignsWithROI.reduce((sum, c) => sum + c.roi, 0) / (campaignsWithROI.length || 1);

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      overallROI,
      profitableCampaigns,
      totalCampaigns: campaignsWithROI.length,
      profitableRate: (profitableCampaigns / (campaignsWithROI.length || 1)) * 100,
      avgROI,
      avgRevenuePerDollar: totalCost > 0 ? totalRevenue / totalCost : 0
    };
  }, [campaignsWithROI]);

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (viewMode === 'breakdown') {
      // Group by channel for breakdown
      const channelData = {};
      campaignsWithROI.forEach(c => {
        const channel = c.groupings?.send_channel || 'email';
        if (!channelData[channel]) {
          channelData[channel] = {
            channel,
            revenue: 0,
            cost: 0,
            profit: 0,
            campaigns: 0
          };
        }
        channelData[channel].revenue += c.revenue;
        channelData[channel].cost += c.cost;
        channelData[channel].profit += c.profit;
        channelData[channel].campaigns++;
      });

      return Object.values(channelData).map(d => ({
        ...d,
        roi: d.cost > 0 ? ((d.revenue - d.cost) / d.cost) * 100 : 0
      }));
    }

    // Top 10 campaigns for bar chart
    return sortedCampaigns.slice(0, 10).map(c => ({
      name: c.campaign_name?.substring(0, 30) || 'Unnamed',
      revenue: c.revenue,
      cost: c.cost,
      profit: c.profit,
      roi: c.roi,
      fill: getROITier(c.roi).color
    }));
  }, [sortedCampaigns, campaignsWithROI, viewMode]);

  // Scatter plot data
  const scatterData = useMemo(() => {
    return campaignsWithROI.map(c => ({
      x: c.revenue,
      y: c.cost,
      z: c.roi,
      name: c.campaign_name || 'Unnamed',
      profit: c.profit,
      fill: getROITier(c.roi).color
    }));
  }, [campaignsWithROI]);

  // Treemap data for profit visualization
  const treemapData = useMemo(() => {
    return campaignsWithROI
      .filter(c => c.revenue > 0)
      .map(c => ({
        name: c.campaign_name?.substring(0, 20) || 'Unnamed',
        value: c.revenue,
        profit: c.profit,
        roi: c.roi
      }));
  }, [campaignsWithROI]);

  const tier = getROITier(aggregateMetrics.overallROI);
  const TierIcon = tier.icon;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign ROI & Profitability</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track return on investment and profit margins across campaigns
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="profitability">Profitability</SelectItem>
              <SelectItem value="comparison">Comparison</SelectItem>
              <SelectItem value="breakdown">Breakdown</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roi-desc">ROI: High to Low</SelectItem>
              <SelectItem value="roi-asc">ROI: Low to High</SelectItem>
              <SelectItem value="profit-desc">Profit: High to Low</SelectItem>
              <SelectItem value="revenue-desc">Revenue: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProfitable} onValueChange={setFilterProfitable}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="profitable">Profitable Only</SelectItem>
              <SelectItem value="unprofitable">Unprofitable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{formatCurrency(aggregateMetrics.totalRevenue)}</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">From {aggregateMetrics.totalCampaigns} campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{formatCurrency(aggregateMetrics.totalCost)}</p>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ${aggregateMetrics.avgRevenuePerDollar.toFixed(2)} per $1 spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className={cn(
                "text-2xl font-bold",
                aggregateMetrics.totalProfit > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(aggregateMetrics.totalProfit)}
              </p>
              {aggregateMetrics.totalProfit > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>
            <Progress
              value={aggregateMetrics.profitableRate}
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card className={cn("border-2", tier.color === '#10b981' ? "border-green-500" : tier.color === '#ef4444' ? "border-red-500" : "")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold" style={{ color: tier.color }}>
                {aggregateMetrics.overallROI.toFixed(0)}%
              </p>
              <TierIcon className="h-4 w-4" style={{ color: tier.color }} />
            </div>
            <Badge variant="outline" className="mt-1" style={{ borderColor: tier.color, color: tier.color }}>
              {tier.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{aggregateMetrics.profitableRate.toFixed(0)}%</p>
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {aggregateMetrics.profitableCampaigns}/{aggregateMetrics.totalCampaigns} profitable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View: Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Campaigns by ROI */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Campaigns by ROI</CardTitle>
              <CardDescription>Best performing campaigns by return on investment</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value, name) => {
                      if (name === 'roi') return `${value.toFixed(0)}%`;
                      return formatCurrency(value);
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="profit" fill="#10b981" name="Profit" />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ROI Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Distribution</CardTitle>
              <CardDescription>Campaign distribution across ROI tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { tier: 'Exceptional (1000%+)', min: 1000, max: Infinity },
                  { tier: 'Excellent (500-999%)', min: 500, max: 999 },
                  { tier: 'Good (200-499%)', min: 200, max: 499 },
                  { tier: 'Average (100-199%)', min: 100, max: 199 },
                  { tier: 'Break-even (0-99%)', min: 0, max: 99 },
                  { tier: 'Loss (< 0%)', min: -Infinity, max: -1 }
                ].map(range => {
                  const count = campaignsWithROI.filter(c =>
                    c.roi >= range.min && c.roi <= range.max
                  ).length;
                  const percentage = (count / campaignsWithROI.length) * 100;
                  const tierInfo = getROITier((range.min + range.max) / 2);

                  return (
                    <div key={range.tier}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{range.tier}</span>
                        <span className="text-sm text-gray-600">{count} campaigns</span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-6"
                        style={{ backgroundColor: '#e5e7eb' }}
                      >
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: tierInfo.color
                          }}
                        />
                      </Progress>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View: Profitability - Scatter Plot */}
      {viewMode === 'profitability' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Cost Analysis</CardTitle>
            <CardDescription>
              Each bubble represents a campaign. Size indicates ROI percentage.
              The diagonal line represents break-even point.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Revenue"
                  label={{ value: 'Revenue ($)', position: 'insideBottom', offset: -10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Cost"
                  label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <RechartsTooltip content={<CustomTooltip />} />
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: Math.max(...scatterData.map(d => d.x)), y: Math.max(...scatterData.map(d => d.x)) }]}
                  stroke="#999"
                  strokeDasharray="3 3"
                  label="Break-even"
                />
                <Scatter name="Campaigns" data={scatterData} fill="#8884d8">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 rounded bg-green-50 dark:bg-green-900/20">
                <strong className="text-green-700 dark:text-green-400">Above Line:</strong>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Profitable campaigns - Revenue exceeds cost
                </p>
              </div>
              <div className="p-3 rounded bg-red-50 dark:bg-red-900/20">
                <strong className="text-red-700 dark:text-red-400">Below Line:</strong>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Unprofitable campaigns - Cost exceeds revenue
                </p>
              </div>
              <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20">
                <strong className="text-blue-700 dark:text-blue-400">Bubble Size:</strong>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Larger bubbles = Higher ROI percentage
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View: Comparison - Top vs Bottom Performers */}
      {viewMode === 'comparison' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Performers */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top 5 Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {sortedCampaigns.slice(0, 5).map((campaign, index) => {
                    const tier = getROITier(campaign.roi);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-800">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {campaign.campaign_name?.substring(0, 40) || 'Unnamed Campaign'}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-600">
                              Revenue: {formatCurrency(campaign.revenue)}
                            </span>
                            <span className="text-xs text-gray-600">
                              Profit: {formatCurrency(campaign.profit)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: tier.color }}>
                            {campaign.roi.toFixed(0)}%
                          </p>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: tier.color, color: tier.color }}>
                            {tier.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bottom 5 Performers */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-900/20">
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Bottom 5 Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {sortedCampaigns.slice(-5).reverse().map((campaign, index) => {
                    const tier = getROITier(campaign.roi);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-800">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {campaign.campaign_name?.substring(0, 40) || 'Unnamed Campaign'}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-600">
                              Revenue: {formatCurrency(campaign.revenue)}
                            </span>
                            <span className="text-xs text-red-600">
                              Loss: {formatCurrency(Math.abs(campaign.profit))}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: tier.color }}>
                            {campaign.roi.toFixed(0)}%
                          </p>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: tier.color, color: tier.color }}>
                            {tier.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Differences */}
          <Alert className="border-sky-200 bg-sky-50 dark:bg-sky-900/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Key Insights:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Top performers average {(sortedCampaigns.slice(0, 5).reduce((sum, c) => sum + c.roi, 0) / 5).toFixed(0)}% ROI vs bottom 5 at {(sortedCampaigns.slice(-5).reduce((sum, c) => sum + c.roi, 0) / 5).toFixed(0)}%</li>
                <li>• Best campaign generates ${(sortedCampaigns[0]?.revenuePerDollar || 0).toFixed(2)} per $1 spent</li>
                <li>• {aggregateMetrics.profitableCampaigns} profitable campaigns driving {formatCurrency(campaignsWithROI.filter(c => c.isProfitable).reduce((sum, c) => sum + c.revenue, 0))} in revenue</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* View: Breakdown by Channel/Tag */}
      {viewMode === 'breakdown' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ROI Breakdown by Channel</CardTitle>
              <CardDescription>Performance comparison across different channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis yAxisId="left" label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'ROI (%)', angle: 90, position: 'insideRight' }} />
                  <RechartsTooltip
                    formatter={(value, name) => {
                      if (name === 'roi' || name.includes('%')) return `${value.toFixed(0)}%`;
                      return formatCurrency(value);
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar yAxisId="left" dataKey="cost" fill="#ef4444" name="Cost" />
                  <Bar yAxisId="left" dataKey="profit" fill="#10b981" name="Profit" />
                  <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 6 }} name="ROI %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Treemap visualization of revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution Treemap</CardTitle>
              <CardDescription>Visual representation of revenue contribution by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <Treemap
                  data={treemapData}
                  dataKey="value"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="#8884d8"
                  content={<CustomTreemapContent />}
                />
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            ROI Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">
                What's Working:
              </h4>
              <ul className="space-y-1 text-sm">
                {aggregateMetrics.overallROI > 200 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Strong overall ROI of {aggregateMetrics.overallROI.toFixed(0)}%</span>
                  </li>
                )}
                {aggregateMetrics.profitableRate > 70 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>High success rate with {aggregateMetrics.profitableRate.toFixed(0)}% profitable campaigns</span>
                  </li>
                )}
                {sortedCampaigns[0]?.roi > 1000 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Top campaign achieving exceptional {sortedCampaigns[0].roi.toFixed(0)}% ROI</span>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-red-700 dark:text-red-400">
                Areas to Improve:
              </h4>
              <ul className="space-y-1 text-sm">
                {aggregateMetrics.profitableRate < 50 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>Only {aggregateMetrics.profitableRate.toFixed(0)}% of campaigns are profitable</span>
                  </li>
                )}
                {campaignsWithROI.filter(c => c.roi < 0).length > 5 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>{campaignsWithROI.filter(c => c.roi < 0).length} campaigns operating at a loss</span>
                  </li>
                )}
                {aggregateMetrics.avgRevenuePerDollar < 3 && (
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span>Revenue per dollar spent (${aggregateMetrics.avgRevenuePerDollar.toFixed(2)}) could be improved</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Action Items:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export ROI Report
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Analyze Unprofitable Campaigns
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
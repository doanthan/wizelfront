"use client";

import React, { useState, useMemo } from 'react';
import {
  Mail, MessageSquare, Bell, Smartphone, TrendingUp, TrendingDown,
  DollarSign, Users, ShoppingCart, Target, Percent, MousePointer,
  Eye, Send, AlertCircle, Info, ChevronRight
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
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ComposedChart,
  Line,
  Area,
  PieChart,
  Pie,
  Sector
} from 'recharts';

// Channel configuration
const CHANNELS = {
  email: {
    name: 'Email',
    icon: Mail,
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  sms: {
    name: 'SMS',
    icon: MessageSquare,
    color: '#10b981',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  push: {
    name: 'Push',
    icon: Bell,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: Smartphone,
    color: '#06b6d4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  }
};

// Calculate channel metrics from campaign data
const calculateChannelMetrics = (campaigns) => {
  const channelData = {};

  campaigns.forEach(campaign => {
    const channel = campaign.groupings?.send_channel || 'email';

    if (!channelData[channel]) {
      channelData[channel] = {
        channel,
        campaigns: 0,
        recipients: 0,
        delivered: 0,
        opens: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        costs: 0, // Would need cost data
        orders: 0,
        unsubscribes: 0,
        bounces: 0
      };
    }

    const stats = campaign.statistics || {};
    const data = channelData[channel];

    data.campaigns++;
    data.recipients += stats.recipients || 0;
    data.delivered += stats.delivered || 0;
    data.opens += stats.opens_unique || 0;
    data.clicks += stats.clicks_unique || 0;
    data.conversions += stats.conversion_uniques || 0;
    data.revenue += stats.conversion_value || 0;
    data.orders += stats.conversion_uniques || 0;
    data.unsubscribes += stats.unsubscribe_uniques || 0;
    data.bounces += stats.bounced || 0;

    // Estimate costs (you'd replace with actual cost data)
    if (channel === 'email') {
      data.costs += (stats.recipients || 0) * 0.001; // $0.001 per email
    } else if (channel === 'sms') {
      data.costs += (stats.recipients || 0) * 0.02; // $0.02 per SMS
    } else if (channel === 'push') {
      data.costs += (stats.recipients || 0) * 0.0001; // $0.0001 per push
    }
  });

  // Calculate rates and derived metrics
  Object.values(channelData).forEach(data => {
    data.openRate = data.delivered > 0 ? (data.opens / data.delivered) * 100 : 0;
    data.clickRate = data.delivered > 0 ? (data.clicks / data.delivered) * 100 : 0;
    data.conversionRate = data.delivered > 0 ? (data.conversions / data.delivered) * 100 : 0;
    data.clickToOpenRate = data.opens > 0 ? (data.clicks / data.opens) * 100 : 0;
    data.unsubscribeRate = data.delivered > 0 ? (data.unsubscribes / data.delivered) * 100 : 0;
    data.bounceRate = data.recipients > 0 ? (data.bounces / data.recipients) * 100 : 0;
    data.revenuePerRecipient = data.recipients > 0 ? data.revenue / data.recipients : 0;
    data.revenuePerClick = data.clicks > 0 ? data.revenue / data.clicks : 0;
    data.averageOrderValue = data.orders > 0 ? data.revenue / data.orders : 0;
    data.roi = data.costs > 0 ? ((data.revenue - data.costs) / data.costs) * 100 : 0;
    data.profitMargin = data.revenue > 0 ? ((data.revenue - data.costs) / data.revenue) * 100 : 0;
  });

  return Object.values(channelData);
};

// Custom active shape for pie chart
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-2xl font-bold">
        {formatCurrency(payload.revenue)}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#666" className="text-sm">
        {payload.channel.toUpperCase()}
      </text>
      <text x={cx} y={cy} dy={35} textAnchor="middle" fill="#999" className="text-xs">
        {formatPercentage(payload.revenueShare)} of total
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

export default function ChannelPerformanceReport({ campaigns = [], stores = [], dateRange = null }) {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewMode, setViewMode] = useState('overview'); // overview, comparison, efficiency, engagement
  const [activeChannelIndex, setActiveChannelIndex] = useState(0);

  // Calculate channel metrics
  const channelMetrics = useMemo(() => {
    const metrics = calculateChannelMetrics(campaigns);
    const totalRevenue = metrics.reduce((sum, ch) => sum + ch.revenue, 0);

    // Add revenue share
    return metrics.map(ch => ({
      ...ch,
      revenueShare: totalRevenue > 0 ? (ch.revenue / totalRevenue) * 100 : 0
    }));
  }, [campaigns]);

  // Get best performing channel
  const bestChannel = useMemo(() => {
    if (channelMetrics.length === 0) return null;

    const sorted = [...channelMetrics].sort((a, b) => {
      switch (selectedMetric) {
        case 'revenue':
          return b.revenue - a.revenue;
        case 'roi':
          return b.roi - a.roi;
        case 'conversionRate':
          return b.conversionRate - a.conversionRate;
        case 'engagement':
          return (b.openRate + b.clickRate) - (a.openRate + a.clickRate);
        default:
          return b.revenue - a.revenue;
      }
    });

    return sorted[0];
  }, [channelMetrics, selectedMetric]);

  // Prepare data for different visualizations
  const chartData = useMemo(() => {
    if (viewMode === 'efficiency') {
      return channelMetrics.map(ch => ({
        channel: CHANNELS[ch.channel]?.name || ch.channel,
        'Revenue per $1 Spent': ch.costs > 0 ? ch.revenue / ch.costs : 0,
        'Cost per Conversion': ch.conversions > 0 ? ch.costs / ch.conversions : 0,
        'ROI %': ch.roi,
        color: CHANNELS[ch.channel]?.color || '#666'
      }));
    }

    if (viewMode === 'engagement') {
      return channelMetrics.map(ch => ({
        channel: CHANNELS[ch.channel]?.name || ch.channel,
        'Open Rate': ch.openRate,
        'Click Rate': ch.clickRate,
        'Conversion Rate': ch.conversionRate,
        'CTOR': ch.clickToOpenRate,
        color: CHANNELS[ch.channel]?.color || '#666'
      }));
    }

    // Default comparison view
    return channelMetrics.map(ch => ({
      channel: CHANNELS[ch.channel]?.name || ch.channel,
      revenue: ch.revenue,
      campaigns: ch.campaigns,
      recipients: ch.recipients,
      conversions: ch.conversions,
      roi: ch.roi,
      color: CHANNELS[ch.channel]?.color || '#666'
    }));
  }, [channelMetrics, viewMode]);

  // Prepare pie chart data for revenue distribution
  const pieData = useMemo(() => {
    return channelMetrics.map(ch => ({
      ...ch,
      name: CHANNELS[ch.channel]?.name || ch.channel,
      value: ch.revenue,
      fill: CHANNELS[ch.channel]?.color || '#666'
    }));
  }, [channelMetrics]);

  const metricOptions = [
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'roi', label: 'ROI', icon: TrendingUp },
    { value: 'conversionRate', label: 'Conversion Rate', icon: ShoppingCart },
    { value: 'engagement', label: 'Engagement', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Channel Performance Comparison</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Compare performance across different communication channels
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="comparison">Comparison</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Primary metric" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map(option => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Best Channel Alert */}
      {bestChannel && (
        <Alert className="border-sky-200 bg-sky-50 dark:bg-sky-900/20">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>{CHANNELS[bestChannel.channel]?.name || bestChannel.channel}</strong> is your best performing channel
            {selectedMetric === 'revenue' && ` with ${formatCurrency(bestChannel.revenue)} in revenue`}
            {selectedMetric === 'roi' && ` with ${formatPercentage(bestChannel.roi / 100)} ROI`}
            {selectedMetric === 'conversionRate' && ` with ${formatPercentage(bestChannel.conversionRate)} conversion rate`}
            {selectedMetric === 'engagement' && ` with ${formatPercentage(bestChannel.openRate)}% open rate and ${formatPercentage(bestChannel.clickRate)}% click rate`}
          </AlertDescription>
        </Alert>
      )}

      {/* View: Overview - Channel Cards */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channelMetrics.map((channel, index) => {
            const config = CHANNELS[channel.channel] || {};
            const Icon = config.icon || Mail;

            return (
              <Card
                key={channel.channel}
                className={cn(
                  "relative overflow-hidden hover:shadow-lg transition-all cursor-pointer",
                  config.borderColor
                )}
              >
                <div className={cn("absolute inset-0 opacity-5", config.bgColor)} />

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: config.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {channel.campaigns} campaigns
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: config.color, color: config.color }}
                    >
                      {formatPercentage(channel.revenueShare)} share
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 relative">
                  {/* Revenue & ROI */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Revenue</p>
                      <p className="text-lg font-bold">{formatCurrency(channel.revenue)}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(channel.revenuePerRecipient)}/recipient
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">ROI</p>
                      <p className="text-lg font-bold" style={{ color: channel.roi > 0 ? '#10b981' : '#ef4444' }}>
                        {channel.roi > 0 ? '+' : ''}{formatNumber(channel.roi)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        ${channel.costs > 0 ? (channel.revenue / channel.costs).toFixed(2) : '0'}/$1
                      </p>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="space-y-1.5 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Open Rate</span>
                      <span className="text-sm font-medium">{formatPercentage(channel.openRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Click Rate</span>
                      <span className="text-sm font-medium">{formatPercentage(channel.clickRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Conv Rate</span>
                      <span className="text-sm font-medium">{formatPercentage(channel.conversionRate)}</span>
                    </div>
                  </div>

                  {/* Volume Metrics */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Sent</p>
                      <p className="text-sm font-medium">{formatNumber(channel.recipients)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Clicked</p>
                      <p className="text-sm font-medium">{formatNumber(channel.clicks)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Orders</p>
                      <p className="text-sm font-medium">{formatNumber(channel.conversions)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View: Comparison - Side by side charts */}
      {viewMode === 'comparison' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Distribution Pie */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution by Channel</CardTitle>
              <CardDescription>Click on segments to see details</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    activeIndex={activeChannelIndex}
                    activeShape={renderActiveShape}
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveChannelIndex(index)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Metrics</CardTitle>
              <CardDescription>Key metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value, name) => {
                      if (name === 'revenue') return formatCurrency(value);
                      if (name === 'roi') return `${value.toFixed(1)}%`;
                      return formatNumber(value);
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                  <Bar dataKey="campaigns" fill="#8b5cf6" name="Campaigns" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View: Efficiency - ROI and Cost Analysis */}
      {viewMode === 'efficiency' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Cost Efficiency Analysis</CardTitle>
              <CardDescription>ROI and cost effectiveness by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis yAxisId="left" label={{ value: 'Revenue per $1', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'ROI %', angle: 90, position: 'insideRight' }} />
                  <RechartsTooltip
                    formatter={(value, name) => {
                      if (name.includes('$')) return `$${value.toFixed(2)}`;
                      if (name.includes('%')) return `${value.toFixed(1)}%`;
                      return value.toFixed(2);
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Revenue per $1 Spent" fill="#10b981" />
                  <Line yAxisId="right" type="monotone" dataKey="ROI %" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Cost & Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Channel</th>
                      <th className="text-right p-2">Total Cost</th>
                      <th className="text-right p-2">Total Revenue</th>
                      <th className="text-right p-2">Profit</th>
                      <th className="text-right p-2">Margin %</th>
                      <th className="text-right p-2">Cost/Conv</th>
                      <th className="text-right p-2">Rev/$1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelMetrics.map(ch => {
                      const config = CHANNELS[ch.channel];
                      const profit = ch.revenue - ch.costs;

                      return (
                        <tr key={ch.channel} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: config?.color }} />
                              <span>{config?.name || ch.channel}</span>
                            </div>
                          </td>
                          <td className="text-right p-2">{formatCurrency(ch.costs)}</td>
                          <td className="text-right p-2 font-medium">{formatCurrency(ch.revenue)}</td>
                          <td className={cn("text-right p-2 font-bold", profit > 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(profit)}
                          </td>
                          <td className="text-right p-2">{formatPercentage(ch.profitMargin)}</td>
                          <td className="text-right p-2">
                            {formatCurrency(ch.conversions > 0 ? ch.costs / ch.conversions : 0)}
                          </td>
                          <td className="text-right p-2 font-medium">
                            ${ch.costs > 0 ? (ch.revenue / ch.costs).toFixed(2) : '0'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-50 dark:bg-gray-800">
                      <td className="p-2">Total</td>
                      <td className="text-right p-2">
                        {formatCurrency(channelMetrics.reduce((sum, ch) => sum + ch.costs, 0))}
                      </td>
                      <td className="text-right p-2">
                        {formatCurrency(channelMetrics.reduce((sum, ch) => sum + ch.revenue, 0))}
                      </td>
                      <td className="text-right p-2 text-green-600">
                        {formatCurrency(channelMetrics.reduce((sum, ch) => sum + (ch.revenue - ch.costs), 0))}
                      </td>
                      <td className="text-right p-2" colSpan="3">
                        Overall ROI: {formatNumber(
                          channelMetrics.reduce((sum, ch) => sum + ch.costs, 0) > 0
                            ? ((channelMetrics.reduce((sum, ch) => sum + ch.revenue, 0) - channelMetrics.reduce((sum, ch) => sum + ch.costs, 0)) / channelMetrics.reduce((sum, ch) => sum + ch.costs, 0)) * 100
                            : 0
                        )}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View: Engagement - Funnel metrics */}
      {viewMode === 'engagement' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Funnel by Channel</CardTitle>
              <CardDescription>Open, click, and conversion rates comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip formatter={(value) => `${value.toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="Open Rate" fill="#3b82f6" />
                  <Bar dataKey="Click Rate" fill="#10b981" />
                  <Bar dataKey="Conversion Rate" fill="#f59e0b" />
                  <Bar dataKey="CTOR" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channelMetrics.map(ch => {
              const config = CHANNELS[ch.channel];
              const Icon = config?.icon || Mail;
              const engagementScore = (ch.openRate * 0.3 + ch.clickRate * 0.4 + ch.conversionRate * 0.3);

              return (
                <Card key={ch.channel} className={cn("border-2", config?.borderColor)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" style={{ color: config?.color }} />
                        <CardTitle className="text-lg">{config?.name || ch.channel}</CardTitle>
                      </div>
                      <Badge variant={engagementScore > 10 ? "success" : engagementScore > 5 ? "warning" : "destructive"}>
                        Score: {engagementScore.toFixed(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Funnel visualization */}
                      <div className="space-y-2">
                        <div className="relative">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Delivered</span>
                            <span className="text-xs font-medium">{formatNumber(ch.delivered)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2 mt-1">
                            <div className="bg-blue-500 h-2 rounded" style={{ width: '100%' }} />
                          </div>
                        </div>

                        <div className="relative pl-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Opened</span>
                            <span className="text-xs font-medium">{formatNumber(ch.opens)} ({formatPercentage(ch.openRate)})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2 mt-1">
                            <div className="bg-green-500 h-2 rounded" style={{ width: `${ch.openRate}%` }} />
                          </div>
                        </div>

                        <div className="relative pl-8">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Clicked</span>
                            <span className="text-xs font-medium">{formatNumber(ch.clicks)} ({formatPercentage(ch.clickRate)})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2 mt-1">
                            <div className="bg-yellow-500 h-2 rounded" style={{ width: `${ch.clickRate}%` }} />
                          </div>
                        </div>

                        <div className="relative pl-12">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Converted</span>
                            <span className="text-xs font-medium">{formatNumber(ch.conversions)} ({formatPercentage(ch.conversionRate)})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2 mt-1">
                            <div className="bg-purple-500 h-2 rounded" style={{ width: `${ch.conversionRate}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Key metrics */}
                      <div className="pt-3 border-t space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">CTOR</span>
                          <span className="font-medium">{formatPercentage(ch.clickToOpenRate)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Unsub Rate</span>
                          <span className="font-medium">{formatPercentage(ch.unsubscribeRate)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Channel Strategy Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelMetrics.map(ch => {
              const config = CHANNELS[ch.channel];
              const recommendations = [];

              if (ch.roi < 100) {
                recommendations.push({ type: 'warning', text: 'Low ROI - review targeting and costs' });
              }
              if (ch.openRate < 15 && ch.channel === 'email') {
                recommendations.push({ type: 'warning', text: 'Low open rate - improve subject lines' });
              }
              if (ch.clickRate < 2 && ch.channel === 'email') {
                recommendations.push({ type: 'warning', text: 'Low click rate - optimize content and CTAs' });
              }
              if (ch.conversionRate < 1) {
                recommendations.push({ type: 'warning', text: 'Low conversions - review landing pages' });
              }
              if (ch.roi > 500) {
                recommendations.push({ type: 'success', text: 'Excellent ROI - consider scaling' });
              }
              if (ch.unsubscribeRate > 0.5) {
                recommendations.push({ type: 'danger', text: 'High unsubscribe rate - reduce frequency' });
              }

              if (recommendations.length === 0) {
                recommendations.push({ type: 'info', text: 'Performance is stable' });
              }

              return (
                <div key={ch.channel} className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: config?.color }} />
                    {config?.name || ch.channel}
                  </h4>
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className={cn(
                      "text-xs p-2 rounded flex items-start gap-2",
                      rec.type === 'success' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                      rec.type === 'warning' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                      rec.type === 'danger' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                      rec.type === 'info' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span>{rec.text}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Users, AlertTriangle, TrendingUp, Star, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { formatPercentage, formatCurrency } from '@/lib/utils';
import { useState } from 'react';

/**
 * Segment Performance Comparison Component
 *
 * Shows performance across different audiences/segments/tags:
 * - Top performers
 * - Bottom performers
 * - Fatigued segments (high unsubscribe rates)
 * - Detailed metrics table
 */
export default function SegmentPerformanceComparison({ data, loading }) {
  const [view, setView] = useState('segments'); // 'segments' or 'tags'
  const [sortBy, setSortBy] = useState('revenuePerRecipient'); // Metric to sort by

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Segment Performance Comparison
          </CardTitle>
          <CardDescription>Loading segment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (!data.segments && !data.tags)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Segment Performance Comparison
          </CardTitle>
          <CardDescription>
            No segment data available. Ensure campaigns are tagged with segments for tracking.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { segments = [], tags = [], topPerformers = [], bottomPerformers = [], fatiguedSegments = [], insights } = data;

  // Get current view data
  const currentData = view === 'segments' ? segments : tags;

  // Sort data by selected metric
  const sortedData = [...currentData].sort((a, b) => {
    return b[sortBy] - a[sortBy];
  });

  // Prepare chart data (top 10 for visualization)
  const chartData = sortedData.slice(0, 10).map(item => ({
    name: item.name || item.tag || 'Unknown',
    revenuePerRecipient: item.revenuePerRecipient,
    openRate: item.openRate,
    clickRate: item.clickRate,
    conversionRate: item.conversionRate,
    unsubscribeRate: item.unsubscribeRate || 0
  }));

  // Color scale for bars based on performance
  const getBarColor = (value, index) => {
    if (index === 0) return '#10B981'; // Best performer - green
    if (index >= chartData.length - 2) return '#EF4444'; // Worst performers - red
    return '#60A5FA'; // Middle performers - blue
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Segment Performance Comparison
            </CardTitle>
            <CardDescription>
              Identify which audiences drive the most value and which need attention
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-deep-purple" />
            <div className="flex gap-1">
              <button
                onClick={() => setView('segments')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'segments'
                    ? 'bg-sky-blue text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Segments ({segments.length})
              </button>
              <button
                onClick={() => setView('tags')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'tags'
                    ? 'bg-sky-blue text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Tags ({tags.length})
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {/* Top Performer */}
          {topPerformers.length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Top Performer
                </div>
              </div>
              <div className="font-bold text-gray-900 dark:text-white truncate" title={topPerformers[0].name}>
                {topPerformers[0].name}
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(topPerformers[0].revenuePerRecipient)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Revenue per recipient
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {formatPercentage(topPerformers[0].openRate)} open
                </span>
                <span className="text-gray-600 dark:text-gray-400">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatPercentage(topPerformers[0].clickRate)} click
                </span>
              </div>
            </div>
          )}

          {/* Bottom Performer */}
          {bottomPerformers.length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Needs Attention
                </div>
              </div>
              <div className="font-bold text-gray-900 dark:text-white truncate" title={bottomPerformers[0].name}>
                {bottomPerformers[0].name}
              </div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(bottomPerformers[0].revenuePerRecipient)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Revenue per recipient
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {formatPercentage(bottomPerformers[0].openRate)} open
                </span>
                <span className="text-gray-600 dark:text-gray-400">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatPercentage(bottomPerformers[0].clickRate)} click
                </span>
              </div>
            </div>
          )}

          {/* Fatigued Segments */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Fatigued Segments
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {fatiguedSegments.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              High unsubscribe rate (&gt;0.5%)
            </div>
            {fatiguedSegments.length > 0 && (
              <div className="mt-2">
                <Badge variant="warning" className="text-xs">
                  Action required
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Fatigued Segments Alert */}
        {fatiguedSegments.length > 0 && (
          <div className="mb-6 p-4 rounded-lg border-l-4 bg-orange-50 border-orange-500 dark:bg-orange-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {fatiguedSegments.length} Segment{fatiguedSegments.length > 1 ? 's' : ''} Showing Email Fatigue
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  These segments have high unsubscribe rates and should be rested or re-engaged with special campaigns
                </p>
                <div className="mt-3 space-y-1">
                  {fatiguedSegments.slice(0, 3).map((seg, i) => (
                    <div key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{seg.name}</span>
                      <Badge variant="destructive" className="text-xs">
                        {formatPercentage(seg.unsubscribeRate)} unsub rate
                      </Badge>
                    </div>
                  ))}
                  {fatiguedSegments.length > 3 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      + {fatiguedSegments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="revenuePerRecipient">Revenue per Recipient</option>
            <option value="openRate">Open Rate</option>
            <option value="clickRate">Click Rate</option>
            <option value="conversionRate">Conversion Rate</option>
            <option value="delivered">Recipients</option>
          </select>
        </div>

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Top 10 {view === 'segments' ? 'Segments' : 'Tags'} by {sortBy.replace(/([A-Z])/g, ' $1')}
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  type="number"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => {
                    if (sortBy === 'revenuePerRecipient') return formatCurrency(value).replace('$', '');
                    if (sortBy.includes('Rate')) return `${value.toFixed(1)}%`;
                    return value.toLocaleString();
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  width={90}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{
                    color: '#111827'
                  }}
                  formatter={(value, name) => {
                    if (name === 'revenuePerRecipient') return [formatCurrency(value), 'Revenue per Recipient'];
                    if (name.includes('Rate')) return [`${value.toFixed(2)}%`, name];
                    return [value.toLocaleString(), name];
                  }}
                />

                <Bar dataKey={sortBy} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry[sortBy], index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed Table */}
        {currentData.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              All {view === 'segments' ? 'Segments' : 'Tags'} - Detailed Metrics
            </h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      {view === 'segments' ? 'Segment' : 'Tag'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Campaigns
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Recipients
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Open Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Click Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Conv. Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Revenue/Recip
                    </th>
                    {view === 'segments' && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Unsub Rate
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedData.slice(0, 20).map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        <div className="max-w-[200px] truncate" title={item.name || item.tag}>
                          {item.name || item.tag}
                        </div>
                        {item.type && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {item.type}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {item.campaigns}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {item.delivered.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatPercentage(item.openRate)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatPercentage(item.clickRate)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatPercentage(item.conversionRate)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.revenuePerRecipient)}
                      </td>
                      {view === 'segments' && (
                        <td className="px-4 py-3 text-right">
                          <span className={
                            item.unsubscribeRate > 0.5
                              ? 'text-red-600 font-semibold'
                              : 'text-gray-900 dark:text-white'
                          }>
                            {formatPercentage(item.unsubscribeRate || 0)}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedData.length > 20 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                Showing top 20 of {sortedData.length} {view === 'segments' ? 'segments' : 'tags'}
              </div>
            )}
          </div>
        )}

        {/* Insights and Recommendations */}
        {insights && insights.recommendations && insights.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Segment Optimization Recommendations
            </h4>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {insights.message}
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mt-3">
              {insights.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty State */}
        {currentData.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No {view === 'segments' ? 'segment' : 'tag'} data available
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ensure your campaigns include {view === 'segments' ? 'audience segments' : 'tags'} for tracking
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

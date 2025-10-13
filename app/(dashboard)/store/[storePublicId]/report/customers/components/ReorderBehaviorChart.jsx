"use client";

import React from 'react';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { TrendingUp, Clock, AlertCircle, Target, Info } from 'lucide-react';
import MorphingLoader from '@/app/components/ui/loading';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";

const COLORS = ['#10B981', '#60A5FA', '#F59E0B', '#EF4444', '#6B7280'];

// Chart Info Component
const ChartInfo = ({ title, description }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="inline-flex items-center justify-center ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <Info className="h-4 w-4 text-gray-900 dark:text-gray-400" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-900 dark:text-gray-300">{description}</p>
      </div>
    </PopoverContent>
  </Popover>
);

export default function ReorderBehaviorChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader size="large" showText={true} text="Analyzing reorder behavior..." />
      </div>
    );
  }

  if (!data || data.status === 'insufficient_data') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-yellow-200 mb-1">Insufficient Data</h3>
            <p className="text-gray-900 dark:text-yellow-300">
              Not enough repeat customers to analyze reorder behavior. You need at least a few customers with 2+ orders to generate insights.
            </p>
            <p className="text-sm text-gray-900 dark:text-yellow-400 mt-2">
              Once you have more repeat customers, this tab will show:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-900 dark:text-yellow-400 mt-1 ml-2">
              <li>Average reorder time and purchase cycles</li>
              <li>Customer reorder distribution and patterns</li>
              <li>List of overdue customers for win-back campaigns</li>
              <li>Recommended timing for follow-up emails</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Important Context Alert */}
      {data.customer_breakdown && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-blue-200 mb-1">Analysis Scope</h3>
              <p className="text-sm text-gray-900 dark:text-blue-300">
                This analysis is based on <span className="font-bold">{formatNumber(data.customer_breakdown.repeat_customers)} customers ({data.customer_breakdown.repeat_percentage}%)</span> who have made 2+ purchases.
                The remaining <span className="font-bold">{formatNumber(data.customer_breakdown.one_time_customers)} customers ({data.customer_breakdown.one_time_percentage}%)</span> have only purchased once and represent a key retention opportunity.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Summary Cards - Minimalist Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Typical Reorder Cycle</p>
            <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.median_reorder_days}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">days between purchases</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Purchase Frequency</p>
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">
            {data.summary.business_type.replace('_', ' ')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{data.summary.median_reorder_days <= 60 ? 'repurchase often' : 'longer cycle'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Win-Back Window</p>
            <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Day {data.summary.recommended_followup_day}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">optimal campaign timing</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">High-Priority Win-Backs</p>
            <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data.overdue_customers.count)}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{data.overdue_customers.percentage}% of repeat customers</p>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-sky-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-sky-blue" />
          Actionable Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.actionable_insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-gray-900 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-lg">{insight.charAt(0)}</span>
              <span>{insight.substring(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reorder Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Reorder Distribution</h4>
            <ChartInfo
              title="Purchase Cycle Distribution"
              description="Shows what percentage of customers fall into each reorder time bucket. Fast reorderers are your most engaged customers."
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.reorder_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({percentage}) => `${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="percentage"
                nameKey="label"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {data.reorder_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                formatter={(value) => value}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Percentage Breakdown</h4>
            <ChartInfo
              title="Reorder Time Buckets"
              description="Visual breakdown of customer reorder times. Each bucket represents a quartile of your customer base."
            />
          </div>
          <div className="space-y-4">
            {data.reorder_distribution.map((bucket, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900 dark:text-gray-300">{bucket.label}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{bucket.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                  <div
                    className="h-6 rounded-full flex items-center justify-end px-2 text-white text-xs font-bold"
                    style={{
                      width: `${bucket.percentage}%`,
                      backgroundColor: COLORS[idx],
                    }}
                  >
                    {bucket.percentage > 5 && `${bucket.percentage}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quartile Statistics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Quartile Statistics</h4>
          <ChartInfo
            title="Statistical Breakdown"
            description="Q1 (25th percentile), Median (50th), Q3 (75th), and P95 (95th) show the range of customer reorder times."
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-gray-900 dark:text-green-300">Q1 (Fast)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.q1_25th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-green-400">25th percentile</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-900 dark:text-blue-300">Median</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.median_50th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-blue-400">50th percentile</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-gray-900 dark:text-orange-300">Q3 (Slow)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.q3_75th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-orange-400">75th percentile</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-gray-900 dark:text-red-300">P95 (Very Slow)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.p95_95th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-red-400">95th percentile</p>
          </div>
        </div>
      </div>

      {/* Product Repurchase Recommendations */}
      {data.product_repurchase_recommendations && data.product_repurchase_recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                Top Products Usually Reordered
              </h4>
              <ChartInfo
                title="Product Repurchase Patterns"
                description="Products that customers frequently reorder, sorted by total repurchases. Use these insights to create targeted reminder campaigns at optimal timing to encourage repeat purchases."
              />
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Top {data.product_repurchase_recommendations.length} products
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Product Name</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Type</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Typical Reorder Cycle</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Recommended Reminder</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Total Repurchases</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Repeat Customers</th>
                </tr>
              </thead>
              <tbody>
                {data.product_repurchase_recommendations.map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-sm font-medium max-w-xs truncate" title={product.product_name}>
                      {product.product_name}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                        {product.product_type}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                      {product.median_repurchase_days} days
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Day {product.recommended_reminder_day}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm font-semibold">
                      {formatNumber(product.total_repurchases)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                      {formatNumber(product.repeat_customers)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

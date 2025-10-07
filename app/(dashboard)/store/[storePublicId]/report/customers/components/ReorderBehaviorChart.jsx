"use client";

import { formatNumber, formatCurrency } from '@/lib/utils';
import { TrendingUp, Clock, AlertCircle, Target, Info } from 'lucide-react';
import MorphingLoader from '@/app/components/ui/loading';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
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
        <p className="text-gray-900 dark:text-yellow-200">Not enough repeat customers to analyze reorder behavior. Need at least a few customers with 2+ orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Gradient Modern Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-blue-200">Median Reorder Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.summary.median_reorder_days}</p>
              <p className="text-xs text-gray-900 dark:text-blue-300 mt-1">days</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-green-200">Business Type</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 capitalize">
                {data.summary.business_type.replace('_', ' ')}
              </p>
              <p className="text-xs text-gray-900 dark:text-green-300 mt-1">purchase cycle</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-purple-200">Recommended Follow-up</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Day {data.summary.recommended_followup_day}</p>
              <p className="text-xs text-gray-900 dark:text-purple-300 mt-1">send reminder email</p>
            </div>
            <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg border-2 border-red-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-red-200">Overdue Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.overdue_customers.percentage}%</p>
              <p className="text-xs text-gray-900 dark:text-red-300 mt-1">{formatNumber(data.overdue_customers.count)} customers</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" />
          💡 Actionable Insights
        </h3>
        <ul className="space-y-2">
          {data.actionable_insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
              <span className="text-lg flex-shrink-0">{insight.split(' ')[0]}</span>
              <span>{insight.substring(insight.indexOf(' ') + 1)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reorder Distribution - Gradient Modern Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Reorder Distribution</h4>
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
                  border: '2px solid #60A5FA',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Percentage Breakdown</h4>
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

      {/* Quartile Statistics - Gradient Modern Style */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Quartile Statistics</h4>
          <ChartInfo
            title="Statistical Breakdown"
            description="Q1 (25th percentile), Median (50th), Q3 (75th), and P95 (95th) show the range of customer reorder times."
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-900 dark:text-green-300">Q1 (Fast)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.q1_25th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-green-400">25th percentile</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-900 dark:text-blue-300">Median</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.median_50th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-blue-400">50th percentile</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-sm text-gray-900 dark:text-orange-300">Q3 (Slow)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.q3_75th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-orange-400">75th percentile</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-gray-900 dark:text-red-300">P95 (Very Slow)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.quartile_stats.p95_95th_percentile}</p>
            <p className="text-xs text-gray-900 dark:text-red-400">95th percentile</p>
          </div>
        </div>
      </div>

      {/* Overdue Customers Table - Gradient Modern Style */}
      {data.overdue_customers.customers && data.overdue_customers.customers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              ⚠️ Overdue Customers ({formatNumber(data.overdue_customers.count)})
            </h4>
            <ChartInfo
              title="Customers Past Expected Reorder Time"
              description="These customers have exceeded the median reorder time. Perfect candidates for win-back campaigns or reminder emails."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Customer Email</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Last Order</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Days Since Order</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Days Overdue</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Total Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.overdue_customers.customers.slice(0, 10).map((customer, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{customer.customer_email}</td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{customer.last_order_date}</td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{customer.days_since_last_order} days</td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        +{customer.days_overdue} days
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{customer.total_orders}</td>
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

"use client";

import { formatNumber, formatCurrency } from '@/lib/utils';
import { Users, TrendingUp, AlertCircle, Info } from 'lucide-react';
import MorphingLoader from '@/app/components/ui/loading';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

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

function getSegmentColor(segment) {
  const colors = {
    'Champions': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Loyal Customers': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Potential Loyalists': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'Recent Customers': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Promising': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'Need Attention': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'About to Sleep': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'At Risk': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Cannot Lose Them': 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200',
    'Hibernating': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'Lost': 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-200',
  };
  return colors[segment] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

export default function RFMSegmentChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader size="large" showText={true} text="Loading customer segments..." />
      </div>
    );
  }

  // Ensure data is an array - handle both array and object with data property
  const segments = Array.isArray(data) ? data : (data?.data || []);

  console.log('RFM Segment data:', segments);
  console.log('First segment total_revenue:', segments[0]?.total_revenue, typeof segments[0]?.total_revenue);
  console.log('First segment median_revenue:', segments[0]?.median_revenue, typeof segments[0]?.median_revenue);

  if (!segments || segments.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-gray-900 dark:text-yellow-200">No customer segment data available. Make sure the customer_profiles table is populated in ClickHouse.</p>
      </div>
    );
  }

  // Calculate summary stats - convert string counts to numbers
  const highValueCustomers = segments
    .filter(s => ['Champions', 'Loyal Customers', 'Potential Loyalists'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  const atRiskCustomers = segments
    .filter(s => ['Need Attention', 'About to Sleep', 'At Risk', 'Cannot Lose Them', 'Cannot Lose'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  const lostCustomers = segments
    .filter(s => ['Lost', 'Hibernating'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  const totalRevenue = segments.reduce((sum, s) => sum + parseFloat(s.total_revenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards - Gradient Modern Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-green-200">High Value Segments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatNumber(highValueCustomers)}</p>
              <p className="text-xs text-gray-900 dark:text-green-300 mt-1">Champions, Loyal, Potential</p>
            </div>
            <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-yellow-200">At Risk Segments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatNumber(atRiskCustomers)}</p>
              <p className="text-xs text-gray-900 dark:text-yellow-300 mt-1">Need win-back campaigns</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg border-2 border-red-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-red-200">Lost/Hibernating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatNumber(lostCustomers)}</p>
              <p className="text-xs text-gray-900 dark:text-red-300 mt-1">Re-engagement needed</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-blue-200">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-900 dark:text-blue-300 mt-1">All segments</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Dual-Axis Chart - Gradient Modern Style */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Segments Overview</h4>
          <ChartInfo
            title="RFM Segmentation"
            description="RFM (Recency, Frequency, Monetary) segments classify customers based on their purchase behavior. Champions are your best customers, while at-risk segments need urgent re-engagement. Revenue shown as bars (left axis), customer count as line (right axis)."
          />
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={segments}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#059669" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
            <XAxis
              dataKey="rfm_segment"
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fill: '#111827', fontSize: 11 }}
              className="dark:[&>g>text]:fill-gray-100"
              stroke="#6B7280"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#111827', fontSize: 12 }}
              className="dark:[&>g>text]:fill-gray-100"
              tickFormatter={(value) => formatCurrency(value).replace('$', '$')}
              label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#111827', className: 'dark:fill-gray-100' }}
              stroke="#6B7280"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#111827', fontSize: 12 }}
              className="dark:[&>g>text]:fill-gray-100"
              tickFormatter={(value) => formatNumber(value)}
              label={{ value: 'Customers', angle: 90, position: 'insideRight', fill: '#111827', className: 'dark:fill-gray-100' }}
              stroke="#6B7280"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid #60A5FA',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => {
                if (name === 'Total Revenue') return formatCurrency(value);
                if (name === 'Customers') return formatNumber(parseInt(value));
                return value;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 600 }} />
            <Bar yAxisId="left" dataKey="total_revenue" fill="url(#revenueGradient)" name="Total Revenue" radius={[8, 8, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="customer_count" stroke="#60A5FA" strokeWidth={3} dot={{ r: 5, fill: '#60A5FA', strokeWidth: 2, stroke: '#fff' }} name="Customers" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table - Gradient Modern Style */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Segment Breakdown</h4>
          <ChartInfo
            title="Segment Metrics"
            description="Detailed metrics for each customer segment. Using median (50th percentile) instead of average to avoid distortion from outliers. Median revenue and days inactive are more representative of typical customer behavior."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Segment</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Customers</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Total Revenue</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Avg Revenue/Customer</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">AOV</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Total Orders</th>
                <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Median Days Inactive</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(segment.rfm_segment)}`}>
                      {segment.rfm_segment}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatNumber(parseInt(segment.customer_count || 0))}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                    ${Number(segment.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                    {(() => {
                      const totalRevenue = Number(segment.total_revenue || 0);
                      const customerCount = parseInt(segment.customer_count || 0);
                      const avgRevenuePerCustomer = customerCount > 0 ? totalRevenue / customerCount : 0;
                      return `$${avgRevenuePerCustomer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">
                    {(() => {
                      const totalRevenue = Number(segment.total_revenue || 0);
                      const totalOrders = parseInt(segment.total_orders || 0);
                      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                      return `$${aov.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatNumber(parseInt(segment.total_orders || 0))}</td>
                  <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{Math.round(Number(segment.median_days_since_last_order || segment.avg_days_since_last_order || 0))} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

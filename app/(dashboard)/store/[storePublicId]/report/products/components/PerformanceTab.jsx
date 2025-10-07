"use client";

import { useState } from 'react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Chart Info Component
const ChartInfo = ({ title, description }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="inline-flex items-center justify-center ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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

export default function PerformanceTab({ data, dateRange }) {
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' or 'quantity'

  if (!data?.topProducts?.length) {
    return <div className="text-gray-900 dark:text-gray-300">No product performance data available</div>;
  }

  const hasComparison = data.summary?.revenue_change !== null && data.summary?.revenue_change !== undefined;

  // Calculate period labels
  const getPeriodLabel = (start, end) => {
    if (!start || !end) return '';
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  const currentPeriodLabel = dateRange?.ranges?.main
    ? getPeriodLabel(dateRange.ranges.main.start, dateRange.ranges.main.end)
    : '30d';

  const previousPeriodLabel = dateRange?.ranges?.comparison
    ? getPeriodLabel(dateRange.ranges.comparison.start, dateRange.ranges.comparison.end)
    : '30d';

  return (
    <div className="space-y-6">
      {/* Summary Cards - Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(data.summary?.total_revenue || 0)}
            </div>
            {hasComparison ? (
              <div className="space-y-1">
                <p className={`text-xs flex items-center gap-1 ${data.summary.revenue_change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {data.summary.revenue_change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(data.summary.revenue_change).toFixed(1)}% from last period
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Previous: {formatCurrency(data.summary.comparison_revenue || 0)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
            )}
          </CardContent>
        </Card>

        {/* Units Sold Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Units Sold</CardTitle>
            <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatNumber(data.summary?.units_sold || 0)}
            </div>
            {hasComparison ? (
              <div className="space-y-1">
                <p className={`text-xs flex items-center gap-1 ${data.summary.units_change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {data.summary.units_change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(data.summary.units_change).toFixed(1)}% from last period
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Previous: {formatNumber(data.summary.comparison_units || 0)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
            )}
          </CardContent>
        </Card>

        {/* Avg Product AOV Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Product AOV</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(data.summary?.avg_aov || 0)}
            </div>
            {hasComparison ? (
              <div className="space-y-1">
                <p className={`text-xs flex items-center gap-1 ${data.summary.aov_change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {data.summary.aov_change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(data.summary.aov_change).toFixed(1)}% from last period
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Previous: {formatCurrency(data.summary.comparison_aov || 0)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">No comparison data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Top 20 Products by {chartMetric === 'revenue' ? 'Revenue' : 'Quantity Sold'}
            </h4>
            <ChartInfo
              title={`Top Products by ${chartMetric === 'revenue' ? 'Revenue' : 'Quantity Sold'}`}
              description={chartMetric === 'revenue'
                ? "Shows your highest-grossing products ranked by total revenue in the selected date range. Use this to identify your star performers and focus marketing efforts accordingly."
                : "Shows your best-selling products ranked by total quantity sold in the selected date range. Use this to identify popular items and manage inventory levels."}
            />
          </div>
          <div className="w-40">
            <Select value={chartMetric} onValueChange={setChartMetric}>
              <SelectTrigger className="h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="quantity">Quantity Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.topProducts.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="product_name"
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fill: '#111827', fontSize: 11 }}
              className="dark:[&>g>text]:fill-gray-100"
            />
            <YAxis
              tick={{ fill: '#111827' }}
              className="dark:[&>g>text]:fill-gray-100"
              tickFormatter={(value) => {
                if (chartMetric === 'revenue') {
                  return formatCurrency(value).replace('$', '');
                }
                return formatNumber(value);
              }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name.includes('revenue') || name.includes('Revenue')) {
                  return formatCurrency(value);
                }
                return formatNumber(value);
              }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            {/* Current Period */}
            <Bar
              dataKey={chartMetric === 'revenue' ? 'total_revenue' : 'total_quantity'}
              fill="#60A5FA"
              name={chartMetric === 'revenue' ? 'Current Revenue' : 'Current Quantity'}
              radius={[4, 4, 0, 0]}
            />
            {/* Previous Period (if available) */}
            {hasComparison && (
              <Bar
                dataKey={chartMetric === 'revenue' ? 'comparison_revenue' : 'comparison_quantity'}
                fill="#9CA3AF"
                name={chartMetric === 'revenue' ? 'Previous Revenue' : 'Previous Quantity'}
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Trend</h4>
          <ChartInfo
            title="Daily Revenue Trend"
            description="Tracks daily product revenue over time. Look for patterns, spikes (successful campaigns), and dips (inventory issues or seasonality). The shaded area shows revenue volume."
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis dataKey="date" tick={{ fill: '#111827', fontSize: 11 }} className="dark:[&>g>text]:fill-gray-100" />
            <YAxis
              tick={{ fill: '#111827' }}
              className="dark:[&>g>text]:fill-gray-100"
              tickFormatter={(value) => formatCurrency(value).replace('$', '')}
            />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Area type="monotone" dataKey="revenue" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* New Products */}
      {data?.newProducts && data.newProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">New Products (Last 90 Days)</h4>
            <ChartInfo
              title="New Product Launches"
              description="Products that had their first sale within the last 90 days. Monitor their early performance to identify quick winners or products that need marketing support."
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.newProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fill: '#111827' }} className="dark:[&>g>text]:fill-gray-100" tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
              <YAxis dataKey="product_name" type="category" width={150} tick={{ fill: '#111827', fontSize: 11 }} className="dark:[&>g>text]:fill-gray-100" />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue Since Launch" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Declining Products */}
      {hasComparison && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Bottom 20 Products by Revenue Change</h4>
            <ChartInfo
              title="Products with Largest Revenue Decline"
              description={`Shows the 20 products with the largest absolute revenue decline comparing current period vs previous period. This helps identify products losing significant revenue regardless of percentage. Investigate causes: seasonality, competition, quality issues, or product lifecycle stage.`}
            />
          </div>
          {data?.decliningProducts && data.decliningProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Product</th>
                    <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Recent ({currentPeriodLabel})</th>
                    <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Previous ({previousPeriodLabel})</th>
                    <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Change</th>
                    <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Change %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.decliningProducts.map((product, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{product.product_name}</td>
                      <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatCurrency(product.recent_revenue)}</td>
                      <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatCurrency(product.previous_revenue)}</td>
                      <td className="text-right py-3 px-4">
                        <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                          {formatCurrency(product.revenue_change)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          {product.decline_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-full p-3 mb-4">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Great News!</h5>
              <p className="text-gray-900 dark:text-gray-300 text-center max-w-md">
                No products are experiencing revenue declines in the selected period.
                All products are maintaining or improving their performance.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#2563EB', '#7C3AED', '#34D399'];

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

export default function FinancialTab({ data }) {
  const hasDiscountData = data?.discountComparison?.length > 0;
  const hasRefundData = data?.refundRates?.length > 0 || data?.netRevenue?.length > 0;

  if (!hasDiscountData && !hasRefundData) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-gray-900 dark:text-yellow-200">No financial data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discount Summary Cards */}
      {hasDiscountData && data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 dark:text-red-200">Est. Revenue Lost to Discounts</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(data.summary?.revenue_lost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 dark:text-yellow-200">Average Discount</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.summary?.avg_discount?.toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Discounted vs Full Price Revenue */}
      {hasDiscountData && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue: Discounted vs Full Price</h4>
            <ChartInfo
              title="Discount Revenue Breakdown"
              description="Compares revenue from discounted vs full-price sales for each product. High discount revenue may indicate price sensitivity or over-reliance on promotions."
            />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.discountComparison.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={120} tick={{ fill: '#111827', fontSize: 11 }}  className="dark:[>&>g>text]:fill-gray-100" />
              <YAxis tick={{ fill: '#111827' }} className="dark:[>&>g>text]:fill-gray-100" tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue_with_discount" fill="#EF4444" name="Discounted Revenue" />
              <Bar dataKey="revenue_without_discount" fill="#10B981" name="Full Price Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Discount Distribution */}
      {data?.discountDistribution && data.discountDistribution.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Discount Distribution</h4>
              <ChartInfo
                title="Discount Range Breakdown"
                description="Shows how your sales are distributed across different discount ranges. Helps identify if you're over-discounting or if most sales are at full price."
              />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.discountDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.range}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.discountDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Discount Stats */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Discount Statistics</h4>
            <div className="space-y-4">
              {data.discountDistribution.map((range, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-900 dark:text-gray-300">{range.range}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(range.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-sky-blue to-vivid-violet h-2 rounded-full"
                      style={{
                        width: `${(parseFloat(range.revenue) / Math.max(...data.discountDistribution.map(d => parseFloat(d.revenue)))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refund Summary Cards */}
      {data?.refundSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 dark:text-red-200">Total Refunded</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(data.refundSummary.total_refunded)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 dark:text-yellow-200">Avg Refund Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.refundSummary.avg_refund_rate}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 dark:text-orange-200">Problem Products</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.refundSummary.problem_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Gross vs Net Revenue */}
      {data?.netRevenue && data.netRevenue.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Gross vs Net Revenue (After Refunds)</h4>
            <ChartInfo
              title="Revenue Impact of Refunds"
              description="Compares gross revenue (before refunds) with net revenue (after refunds). Large gaps indicate products with quality or satisfaction issues."
            />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.netRevenue.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={120} tick={{ fill: '#111827', fontSize: 11 }}  className="dark:[>&>g>text]:fill-gray-100" />
              <YAxis tick={{ fill: '#111827' }} className="dark:[>&>g>text]:fill-gray-100" tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="gross_revenue" fill="#60A5FA" name="Gross Revenue" />
              <Bar dataKey="net_revenue" fill="#10B981" name="Net Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Problem Products */}
      {data?.problemProducts && data.problemProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Problem Products (Refund Rate &gt; 10%)</h4>
            <ChartInfo
              title="High Refund Products"
              description="Products with refund rates exceeding 10%. Investigate quality issues, misleading descriptions, sizing problems, or customer expectation mismatches."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Product</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Refund Rate</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.problemProducts.map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{product.product_name}</td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {product.refund_rate}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatCurrency(product.refund_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quality Products */}
      {data?.qualityProducts && data.qualityProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Quality Products (Refund Rate &lt; 5%)</h4>
            <ChartInfo
              title="Low Refund Products"
              description="High-revenue products with refund rates below 5%. These are your quality stars with strong customer satisfaction. Highlight in marketing and use as benchmarks."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Product</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Revenue</th>
                  <th className="text-right py-3 px-4 text-gray-900 dark:text-white text-sm font-semibold">Refund Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.qualityProducts.map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{product.product_name}</td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-gray-300 text-sm">{formatCurrency(product.revenue)}</td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {product.refund_rate}%
                      </span>
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

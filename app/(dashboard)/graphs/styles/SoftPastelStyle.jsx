"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils";

export default function SoftPastelStyle() {
  // Sample data for RFM segments with pastel colors
  const segmentData = [
    { name: 'Champions', customers: 850, revenue: 125000, color: '#A7F3D0' },
    { name: 'Loyal', customers: 1240, revenue: 89000, color: '#BFDBFE' },
    { name: 'Potential', customers: 2100, revenue: 54000, color: '#DDD6FE' },
    { name: 'At Risk', customers: 890, revenue: 34000, color: '#FED7AA' },
    { name: 'Lost', customers: 450, revenue: 12000, color: '#FECACA' },
  ];

  // Time series data
  const timeSeriesData = [
    { month: 'Jan', revenue: 45000, orders: 234, openRate: 23.5 },
    { month: 'Feb', revenue: 52000, orders: 289, openRate: 25.2 },
    { month: 'Mar', revenue: 48000, orders: 256, openRate: 24.1 },
    { month: 'Apr', revenue: 61000, orders: 312, openRate: 27.3 },
    { month: 'May', revenue: 58000, orders: 298, openRate: 26.8 },
    { month: 'Jun', revenue: 67000, orders: 345, openRate: 28.9 },
  ];

  // Metrics cards data with pastel colors
  const metrics = [
    { title: 'Total Revenue', value: '$331K', change: '+12.5%', icon: DollarSign, color: '#10B981', bg: '#D1FAE5' },
    { title: 'Total Customers', value: '5.5K', change: '+8.2%', icon: Users, color: '#3B82F6', bg: '#DBEAFE' },
    { title: 'Avg Order Value', value: '$192', change: '+5.1%', icon: Target, color: '#8B5CF6', bg: '#EDE9FE' },
    { title: 'Engagement Rate', value: '26.0%', change: '+3.4%', icon: TrendingUp, color: '#F59E0B', bg: '#FEF3C7' },
  ];

  // Soft tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg shadow-md p-3">
          <p className="font-medium text-gray-900 dark:text-white mb-1 text-xs">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-gray-700 dark:text-gray-300">
              <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
              <span className="font-medium">{entry.name.includes('Rate') ? formatPercentage(entry.value) : entry.name.includes('revenue') ? formatCurrency(entry.value) : formatNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards - Soft Pastel Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl" style={{ backgroundColor: metric.bg }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4" style={{ color: metric.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {metric.value}
                </div>
                <p className="text-xs font-medium mt-1" style={{ color: metric.color }}>
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart - Soft Gradient */}
        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="pastelRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#DDD6FE" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" opacity={0.5} />
                <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#93C5FD" strokeWidth={2} fill="url(#pastelRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Pastel Bars */}
        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" opacity={0.5} />
                <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="customers" radius={[8, 8, 0, 0]}>
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Gentle Lines */}
        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Orders & Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" opacity={0.5} />
                <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis yAxisId="left" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#93C5FD" strokeWidth={3} dot={{ fill: '#93C5FD', r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="openRate" stroke="#C4B5FD" strokeWidth={3} dot={{ fill: '#C4B5FD', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Soft Colors */}
        <Card className="border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Design Notes */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-300 to-purple-300"></div>
            Soft Pastel Style - Design Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-900 dark:text-gray-300 space-y-2">
          <p>• <strong>Colors:</strong> Pastel palette (#A7F3D0 emerald, #BFDBFE blue, #DDD6FE purple, #FED7AA orange, #FECACA red)</p>
          <p>• <strong>Backgrounds:</strong> Soft gradient backgrounds on cards (from-X-50 to-Y-50)</p>
          <p>• <strong>Typography:</strong> Medium font-weights (400-500), gentle contrast</p>
          <p>• <strong>Borders:</strong> Thin borders with matching pastel colors, rounded corners (rounded-xl)</p>
          <p>• <strong>Charts:</strong> Soft gradients, white strokes on bars/pie slices, gentle grid lines</p>
          <p>• <strong>Use Case:</strong> Wellness apps, lifestyle dashboards, creative portfolios, user-friendly interfaces</p>
        </CardContent>
      </Card>
    </div>
  );
}

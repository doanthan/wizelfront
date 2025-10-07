"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils";

export default function MinimalistCleanStyle() {
  // Sample data for RFM segments
  const segmentData = [
    { name: 'Champions', customers: 850, revenue: 125000, color: '#6B7280' },
    { name: 'Loyal', customers: 1240, revenue: 89000, color: '#6B7280' },
    { name: 'Potential', customers: 2100, revenue: 54000, color: '#6B7280' },
    { name: 'At Risk', customers: 890, revenue: 34000, color: '#6B7280' },
    { name: 'Lost', customers: 450, revenue: 12000, color: '#6B7280' },
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

  // Metrics cards data
  const metrics = [
    { title: 'Total Revenue', value: '$331K', change: '+12.5%', icon: DollarSign },
    { title: 'Total Customers', value: '5.5K', change: '+8.2%', icon: Users },
    { title: 'Avg Order Value', value: '$192', change: '+5.1%', icon: Target },
    { title: 'Engagement Rate', value: '26.0%', change: '+3.4%', icon: TrendingUp },
  ];

  // Simple tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded p-2 text-xs">
          <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-gray-700 dark:text-gray-300">
              {entry.name}: <span className="font-medium">{entry.name.includes('Rate') ? formatPercentage(entry.value) : entry.name.includes('revenue') ? formatCurrency(entry.value) : formatNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards - Clean and Simple */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metric.value}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart - Clean Lines */}
        <Card className="border border-gray-300 dark:border-gray-600">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6B7280" strokeWidth={2} fill="#F3F4F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Monochrome */}
        <Card className="border border-gray-300 dark:border-gray-600">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="customers" fill="#6B7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Dual Tone */}
        <Card className="border border-gray-300 dark:border-gray-600">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Orders & Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '11px' }} />
                <YAxis yAxisId="left" stroke="#6B7280" style={{ fontSize: '11px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#374151" strokeWidth={2} dot={{ fill: '#374151', r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="openRate" stroke="#6B7280" strokeWidth={2} dot={{ fill: '#6B7280', r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Grayscale */}
        <Card className="border border-gray-300 dark:border-gray-600">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#6B7280"
                  dataKey="revenue"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {segmentData.map((entry, index) => {
                    const grays = ['#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];
                    return <Cell key={`cell-${index}`} fill={grays[index]} />;
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Design Notes */}
      <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            Minimalist Clean Style - Design Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-900 dark:text-gray-300 space-y-2">
          <p>• <strong>Colors:</strong> Monochrome palette using gray scale (#374151 to #D1D5DB)</p>
          <p>• <strong>Borders:</strong> Single-pixel borders with subtle hover states</p>
          <p>• <strong>Typography:</strong> Medium font-weights (400-500), smaller font sizes (11-14px)</p>
          <p>• <strong>Spacing:</strong> Generous whitespace, clean separation with border dividers</p>
          <p>• <strong>Charts:</strong> No gradients or shadows, simple fills and strokes</p>
          <p>• <strong>Use Case:</strong> Professional reports, data-focused dashboards, print-friendly designs</p>
        </CardContent>
      </Card>
    </div>
  );
}

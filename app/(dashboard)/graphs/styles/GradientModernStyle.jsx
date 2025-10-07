"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils";

export default function GradientModernStyle() {
  // Sample data for RFM segments
  const segmentData = [
    { name: 'Champions', customers: 850, revenue: 125000, color: '#10B981' },
    { name: 'Loyal', customers: 1240, revenue: 89000, color: '#60A5FA' },
    { name: 'Potential', customers: 2100, revenue: 54000, color: '#8B5CF6' },
    { name: 'At Risk', customers: 890, revenue: 34000, color: '#F59E0B' },
    { name: 'Lost', customers: 450, revenue: 12000, color: '#EF4444' },
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
    { title: 'Total Revenue', value: '$331K', change: '+12.5%', icon: DollarSign, gradient: 'from-green-400 to-emerald-600' },
    { title: 'Total Customers', value: '5.5K', change: '+8.2%', icon: Users, gradient: 'from-sky-blue to-royal-blue' },
    { title: 'Avg Order Value', value: '$192', change: '+5.1%', icon: Target, gradient: 'from-vivid-violet to-deep-purple' },
    { title: 'Engagement Rate', value: '26.0%', change: '+3.4%', icon: TrendingUp, gradient: 'from-amber-400 to-orange-600' },
  ];

  // Custom tooltip with gradient background
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border-2 border-sky-blue shadow-xl rounded-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-900 dark:text-gray-300">
              <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
              <span className="font-semibold">{entry.name.includes('Rate') ? formatPercentage(entry.value) : entry.name.includes('revenue') ? formatCurrency(entry.value) : formatNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-2 border-transparent hover:border-sky-blue transition-all hover:shadow-lg">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.gradient}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metric.value}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart with Gradient Fill */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#60A5FA" strokeWidth={3} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart with Gradient Bars */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentData}>
                <defs>
                  {segmentData.map((segment, index) => (
                    <linearGradient key={index} id={`bar-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={segment.color} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={segment.color} stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="customers" radius={[8, 8, 0, 0]}>
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#bar-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart with Multiple Gradients */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Orders & Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#60A5FA" strokeWidth={3} dot={{ fill: '#60A5FA', r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="openRate" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart with Shadow */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
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
                  fill="#8884d8"
                  dataKey="revenue"
                  style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))' }}
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
      <Card className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-sky-blue">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-sky-blue flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-sky-blue to-vivid-violet"></div>
            Gradient Modern Style - Design Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-900 dark:text-gray-300 space-y-2">
          <p>• <strong>Gradients:</strong> Linear gradients on cards, chart fills, and metric icons</p>
          <p>• <strong>Shadows:</strong> Elevation using box-shadow with hover effects (shadow-lg hover:shadow-xl)</p>
          <p>• <strong>Colors:</strong> Brand colors (Sky Blue #60A5FA, Vivid Violet #8B5CF6) with semantic accents</p>
          <p>• <strong>Borders:</strong> 2px borders with hover states that highlight in sky-blue</p>
          <p>• <strong>Typography:</strong> Bold font-weights for emphasis, gradient backgrounds on headers</p>
          <p>• <strong>Use Case:</strong> Modern SaaS dashboards, marketing analytics, high-impact presentations</p>
        </CardContent>
      </Card>
    </div>
  );
}

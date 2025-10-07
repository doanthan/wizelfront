"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/utils";

export default function BoldCorporateStyle() {
  // Sample data for RFM segments with bold corporate colors
  const segmentData = [
    { name: 'Champions', customers: 850, revenue: 125000, color: '#1E40AF' },
    { name: 'Loyal', customers: 1240, revenue: 89000, color: '#2563EB' },
    { name: 'Potential', customers: 2100, revenue: 54000, color: '#3B82F6' },
    { name: 'At Risk', customers: 890, revenue: 34000, color: '#60A5FA' },
    { name: 'Lost', customers: 450, revenue: 12000, color: '#93C5FD' },
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

  // Metrics cards data with bold colors
  const metrics = [
    { title: 'Total Revenue', value: '$331K', change: '+12.5%', icon: DollarSign, color: '#059669', bg: '#D1FAE5' },
    { title: 'Total Customers', value: '5.5K', change: '+8.2%', icon: Users, color: '#2563EB', bg: '#DBEAFE' },
    { title: 'Avg Order Value', value: '$192', change: '+5.1%', icon: Target, color: '#7C3AED', bg: '#EDE9FE' },
    { title: 'Engagement Rate', value: '26.0%', change: '+3.4%', icon: TrendingUp, color: '#DC2626', bg: '#FEE2E2' },
  ];

  // Professional tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white border-2 border-blue-600 shadow-2xl rounded p-3">
          <p className="font-bold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between gap-4 text-sm">
              <span className="text-gray-300">{entry.name}:</span>
              <span className="font-bold text-white">{entry.name.includes('Rate') ? formatPercentage(entry.value) : entry.name.includes('revenue') ? formatCurrency(entry.value) : formatNumber(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards - Bold Corporate Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="border-l-4 shadow-md hover:shadow-lg transition-shadow" style={{ borderLeftColor: metric.color }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  {metric.title}
                </CardTitle>
                <div className="p-2 rounded" style={{ backgroundColor: metric.bg }}>
                  <Icon className="h-5 w-5" style={{ color: metric.color }} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                  {metric.value}
                </div>
                <p className="text-xs font-semibold mt-1" style={{ color: metric.color }}>
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart - Bold Fill */}
        <Card className="border-t-4 border-t-blue-600 shadow-md">
          <CardHeader className="bg-slate-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" strokeWidth={1} />
                <XAxis dataKey="month" stroke="#1F2937" style={{ fontSize: '12px', fontWeight: '600' }} />
                <YAxis stroke="#1F2937" style={{ fontSize: '12px', fontWeight: '600' }} tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Strong Colors */}
        <Card className="border-t-4 border-t-blue-600 shadow-md">
          <CardHeader className="bg-slate-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" strokeWidth={1} />
                <XAxis dataKey="name" stroke="#1F2937" style={{ fontSize: '12px', fontWeight: '600' }} />
                <YAxis stroke="#1F2937" style={{ fontSize: '12px', fontWeight: '600' }} tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="customers" radius={[6, 6, 0, 0]}>
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Professional Dual Lines */}
        <Card className="border-t-4 border-t-blue-600 shadow-md">
          <CardHeader className="bg-slate-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Orders & Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" strokeWidth={1} />
                <XAxis dataKey="month" stroke="#1F2937" style={{ fontSize: '12px', fontWeight: '600' }} />
                <YAxis yAxisId="left" stroke="#1F2937" style={{ fontSize: '12px', fontWeight: '600' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#1F2937" style={{ fontSize: '12px', fontWeight: '600' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }} />
                <Line yAxisId="right" type="monotone" dataKey="openRate" stroke="#DC2626" strokeWidth={3} dot={{ fill: '#DC2626', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Bold Segmentation */}
        <Card className="border-t-4 border-t-blue-600 shadow-md">
          <CardHeader className="bg-slate-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
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
                  stroke="#FFFFFF"
                  strokeWidth={3}
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
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 uppercase tracking-wide">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            Bold Corporate Style - Design Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-900 dark:text-gray-300 space-y-2">
          <p>• <strong>Colors:</strong> Strong, saturated blues (#1E40AF to #3B82F6) with accent colors for categories</p>
          <p>• <strong>Typography:</strong> Bold/extrabold fonts (600-800), uppercase titles with letter-spacing</p>
          <p>• <strong>Borders:</strong> Thick top borders (4px) on cards, 2-3px stroke widths on charts</p>
          <p>• <strong>Headers:</strong> Light gray backgrounds (#F8FAFC) with bottom borders for clear section separation</p>
          <p>• <strong>Visual Weight:</strong> High contrast, strong shadows, prominent chart elements</p>
          <p>• <strong>Use Case:</strong> Executive dashboards, financial reports, corporate presentations, annual reports</p>
        </CardContent>
      </Card>
    </div>
  );
}

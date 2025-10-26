"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { AlertTriangle } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import EmailHealthScoreCard from './EmailHealthScoreCard';

/**
 * Email Fatigue Analysis Chart
 *
 * Shows correlation between email volume and revenue performance
 * - Bar: Email Campaign Revenue (monthly)
 * - Line (green): Email Deliveries
 * - Line (blue): Revenue Per Recipient (RPR)
 *
 * Highlights fatigue points where deliveries increase but RPR decreases
 */
export default function EmailFatigueChart({ healthData, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Fatigue Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData || !healthData.trends) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Fatigue Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data - combine all trends by date
  const chartData = healthData.trends.rprHistory.map((rprPoint, index) => {
    const volumePoint = healthData.trends.volumeHistory[index];
    const revenuePoint = healthData.trends.revenueHistory[index];

    // Detect fatigue points: volume increased but RPR decreased
    const prevIndex = Math.max(0, index - 30); // Compare to 30 days ago
    const prevRpr = healthData.trends.rprHistory[prevIndex];
    const prevVolume = healthData.trends.volumeHistory[prevIndex];

    const rprChange = prevRpr ? ((rprPoint.value - prevRpr.value) / prevRpr.value) * 100 : 0;
    const volumeChange = prevVolume ? ((volumePoint.value - prevVolume.value) / prevVolume.value) * 100 : 0;

    // Fatigue point: volume up 20%+ and RPR down 10%+
    const isFatiguePoint = volumeChange > 20 && rprChange < -10;

    // Format date for display
    const date = new Date(rprPoint.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return {
      date: monthYear,
      fullDate: rprPoint.date,
      revenue: revenuePoint?.value || 0,
      deliveries: volumePoint?.value || 0,
      rpr: rprPoint.value || 0,
      rprBaseline: rprPoint.baseline || 0,
      isFatiguePoint
    };
  });

  // Group by month for cleaner display
  const monthlyData = [];
  const monthMap = new Map();

  chartData.forEach(day => {
    if (!monthMap.has(day.date)) {
      monthMap.set(day.date, {
        date: day.date,
        revenue: 0,
        deliveries: 0,
        rprSum: 0,
        rprCount: 0,
        hasFatiguePoint: false
      });
    }

    const month = monthMap.get(day.date);
    month.revenue += day.revenue;
    month.deliveries += day.deliveries;
    month.rprSum += day.rpr;
    month.rprCount += 1;
    if (day.isFatiguePoint) month.hasFatiguePoint = true;
  });

  monthMap.forEach((month) => {
    monthlyData.push({
      ...month,
      rpr: month.rprCount > 0 ? month.rprSum / month.rprCount : 0
    });
  });

  // Take last 6 months for cleaner visualization
  const last6Months = monthlyData.slice(-6);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(data.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Deliveries:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatNumber(data.deliveries)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">RPR:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(data.rpr)}
              </span>
            </div>
            {data.hasFatiguePoint && (
              <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Potential fatigue point</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Email Fatigue / Over-Sending Analysis
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Correlation between send volume and revenue performance over 6 months
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={last6Months} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />

            {/* X-Axis */}
            <XAxis
              dataKey="date"
              tick={{ fill: '#111827', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />

            {/* Left Y-Axis (Revenue) */}
            <YAxis
              yAxisId="left"
              tick={{ fill: '#111827', fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value).replace('$', '')}
              label={{ value: 'Revenue', angle: -90, position: 'insideLeft', style: { fill: '#111827' } }}
            />

            {/* Right Y-Axis (Deliveries & RPR) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#111827', fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value)}
              label={{ value: 'Deliveries / RPR', angle: 90, position: 'insideRight', style: { fill: '#111827' } }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {/* Bar for Revenue */}
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="Email Campaign Revenue"
              fill="#C4B5FD"
              opacity={0.8}
              radius={[4, 4, 0, 0]}
            />

            {/* Line for Deliveries */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="deliveries"
              name="Email Deliveries"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
            />

            {/* Line for RPR */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rpr"
              name="Revenue Per Recipient"
              stroke="#60A5FA"
              strokeWidth={3}
              dot={{ fill: '#60A5FA', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              strokeDasharray="5 5"
            />

            {/* Reference line for baseline RPR */}
            {healthData.baseline?.avgRPR && (
              <ReferenceLine
                yAxisId="right"
                y={healthData.baseline.avgRPR}
                stroke="#9CA3AF"
                strokeDasharray="3 3"
                label={{
                  value: 'Baseline RPR',
                  position: 'insideTopRight',
                  fill: '#6B7280',
                  fontSize: 12
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Email List Health Score - moved here from above */}
        <div className="mt-6">
          <EmailHealthScoreCard healthData={healthData} loading={loading} />
        </div>

        {/* Insights Section */}
        {healthData.recommendations && healthData.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Insights & Recommendations:
            </h4>
            <ul className="text-sm space-y-1">
              {healthData.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

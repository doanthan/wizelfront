"use client";

import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import {
  TrendingUp, AlertCircle, Info, CheckCircle, AlertTriangle,
  Target, Clock, Users, DollarSign, Activity
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
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

const SEGMENT_COLORS = {
  'Champions': '#10B981',
  'Loyal Customers': '#60A5FA',
  'About to Sleep': '#F59E0B',
  'At Risk': '#EF4444',
  'Cannot Lose': '#DC2626',
  'Lost': '#6B7280',
};

export default function AdaptiveRFMOverview({ adaptiveData, segmentData }) {
  if (!adaptiveData || !segmentData) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-gray-900 dark:text-yellow-200">Loading RFM segment analysis...</p>
      </div>
    );
  }

  const {
    characteristics,
    calculated_criteria,
    thresholds,
    template_used,
    data_quality
  } = adaptiveData;

  // Prepare segment data for pie chart
  const segmentChartData = segmentData.map(seg => ({
    name: seg.rfm_segment,
    value: parseInt(seg.customer_count || 0),
    revenue: parseFloat(seg.total_revenue || 0)
  }));

  // Calculate key segment groups
  const highValueSegments = segmentData
    .filter(s => ['Champions', 'Loyal Customers', 'Potential Loyalists'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  const atRiskSegments = segmentData
    .filter(s => ['Need Attention', 'About to Sleep', 'At Risk', 'Cannot Lose'].includes(s.rfm_segment))
    .reduce((sum, s) => sum + parseInt(s.customer_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Business Model Overview - Gradient Modern Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Business Template */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-purple-200 mb-2">Business Model</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                template_used === 'low_repeat'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : template_used === 'high_repeat'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {template_used === 'low_repeat' ? 'Low Repeat' : template_used === 'high_repeat' ? 'High Repeat' : 'Medium Repeat'}
              </span>
            </div>
            <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xs text-gray-900 dark:text-purple-300">
            {characteristics?.one_time_buyer_percentage?.toFixed(1)}% one-time buyers
          </div>
        </div>

        {/* High Value Customers */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-green-200">High Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatNumber(highValueSegments)}</p>
              <p className="text-xs text-gray-900 dark:text-green-300 mt-1">Champions + Loyal</p>
            </div>
            <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* At Risk Customers */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-yellow-200">At Risk</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatNumber(atRiskSegments)}</p>
              <p className="text-xs text-gray-900 dark:text-yellow-300 mt-1">Need win-back</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        {/* Purchase Cycle */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-blue-200">Purchase Cycle</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {characteristics?.median_inter_purchase_days || 'N/A'}
              </p>
              <p className="text-xs text-gray-900 dark:text-blue-300 mt-1">days (median)</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* RFM Segment Distribution - Gradient Modern Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Segment Distribution</h4>
            <ChartInfo
              title="RFM Segments"
              description="Your customers are automatically classified into segments based on Recency, Frequency, and Monetary value. Focus on Champions and Loyal customers for retention, and At Risk segments for win-back campaigns."
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {segmentChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.name] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatNumber(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #60A5FA',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Segment Action Matrix */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-4 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Recommended Actions by Segment</h4>
            <ChartInfo
              title="Segment Strategy"
              description="Each segment requires different marketing strategies. Champions need VIP treatment, At Risk customers need urgent re-engagement, and Lost customers may need aggressive discounts."
            />
          </div>
          <div className="space-y-3">
            {segmentData.slice(0, 6).map((seg, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: SEGMENT_COLORS[seg.rfm_segment] || '#94A3B8' }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{seg.rfm_segment}</div>
                    <div className="text-xs text-gray-900 dark:text-gray-400">{formatNumber(parseInt(seg.customer_count))} customers</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(parseFloat(seg.total_revenue))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adaptive Thresholds Timeline - Gradient Modern Style */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center mb-6 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Adaptive Recency Thresholds
          </h4>
          <ChartInfo
            title="Business-Specific Thresholds"
            description={`These thresholds are optimized for ${template_used.replace('_', ' ')} businesses. Customers move from "Hot" to "Lost" based on days since last order. Your median purchase cycle is ${characteristics?.median_inter_purchase_days} days.`}
          />
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600">
            <div className="text-xs font-medium text-gray-900 dark:text-green-300 mb-1">🔥 Hot</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0-{thresholds?.hot}</div>
            <div className="text-xs text-gray-900 dark:text-green-400 mt-1">days</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600">
            <div className="text-xs font-medium text-gray-900 dark:text-blue-300 mb-1">💙 Warm</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds?.hot + 1}-{thresholds?.warm}</div>
            <div className="text-xs text-gray-900 dark:text-blue-400 mt-1">days</div>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600">
            <div className="text-xs font-medium text-gray-900 dark:text-yellow-300 mb-1">😐 Cool</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds?.warm + 1}-{thresholds?.cool}</div>
            <div className="text-xs text-gray-900 dark:text-yellow-400 mt-1">days</div>
          </div>
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600">
            <div className="text-xs font-medium text-gray-900 dark:text-orange-300 mb-1">⚠️ At Risk</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds?.cool + 1}-{thresholds?.at_risk}</div>
            <div className="text-xs text-gray-900 dark:text-orange-400 mt-1">days</div>
          </div>
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600">
            <div className="text-xs font-medium text-gray-900 dark:text-red-300 mb-1">😴 Lost</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{thresholds?.at_risk + 1}+</div>
            <div className="text-xs text-gray-900 dark:text-red-400 mt-1">days</div>
          </div>
        </div>
      </div>

      {/* Frequency Criteria - Gradient Modern Style */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center mb-6 pb-3 border-b-2 border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-900/20 dark:to-purple-900/20 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Frequency & Monetary Criteria
          </h4>
          <ChartInfo
            title="Auto-Adjusted Thresholds"
            description="These criteria define what makes a customer a Champion or Loyal customer. They're automatically adjusted based on your business model and actual customer distribution."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Champion Criteria */}
          <div className="p-5 rounded-lg border-2 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-gray-900 dark:text-white">🏆 Champion Customers</h5>
              {calculated_criteria?.frequency?.champion?.adjusted && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Auto-Adjusted
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-300">
                  <strong>{calculated_criteria?.frequency?.champion?.min_orders || 0}+</strong> orders
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-300">
                  <strong>${calculated_criteria?.monetary?.champion?.min_revenue?.toFixed(2) || 0}+</strong> lifetime revenue
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-900 dark:text-gray-400">Customers meeting criteria:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {calculated_criteria?.frequency?.champion?.pct_customers_meeting?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Loyal Criteria */}
          <div className="p-5 rounded-lg border-2 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-gray-900 dark:text-white">💎 Loyal Customers</h5>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-300">
                  <strong>{calculated_criteria?.frequency?.loyal?.min_orders || 0}+</strong> orders
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-gray-300">
                  <strong>${calculated_criteria?.monetary?.loyal?.min_revenue?.toFixed(2) || 0}+</strong> lifetime revenue
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-900 dark:text-gray-400">Customers meeting criteria:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {calculated_criteria?.frequency?.loyal?.pct_customers_meeting?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Quality */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          📊 Data Quality Metrics
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-900 dark:text-gray-400">Total Customers</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatNumber(data_quality?.total_customers || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-900 dark:text-gray-400">Repeat Buyers</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatNumber(data_quality?.repeat_sample_size || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-900 dark:text-gray-400">Data Sufficiency</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {data_quality?.is_sufficient ? '✅ Yes' : '⚠️ Limited'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

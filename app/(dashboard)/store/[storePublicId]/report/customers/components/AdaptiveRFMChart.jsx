"use client";

import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import {
  TrendingUp, AlertCircle, Info, CheckCircle, AlertTriangle,
  Target, Clock, Users, DollarSign, Activity, RefreshCw, Settings
} from 'lucide-react';
import MorphingLoader from '@/app/components/ui/loading';
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, LineChart, Line
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

// Health indicator component
const HealthIndicator = ({ isHealthy, percentage, expectedRange }) => {
  const inRange = percentage >= expectedRange[0] && percentage <= expectedRange[1];

  return (
    <div className="flex items-center gap-2">
      {inRange ? (
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      )}
      <span className="text-xs text-gray-900 dark:text-gray-300">
        {percentage.toFixed(1)}% (expected: {expectedRange[0]}-{expectedRange[1]}%)
      </span>
    </div>
  );
};

// Template badge component
const TemplateBadge = ({ template }) => {
  const templates = {
    'low_repeat': {
      label: 'Low Repeat',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      description: 'High consideration purchases, long cycles'
    },
    'medium_repeat': {
      label: 'Medium Repeat',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      description: 'Building loyalty, seasonal patterns'
    },
    'high_repeat': {
      label: 'High Repeat',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      description: 'Consumables, subscriptions, short cycles'
    }
  };

  const config = templates[template] || templates['medium_repeat'];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className={`px-3 py-1 rounded-full text-sm font-medium cursor-help ${config.color}`}>
          {config.label}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
        <p className="text-xs text-gray-900 dark:text-gray-300">{config.description}</p>
      </PopoverContent>
    </Popover>
  );
};

export default function AdaptiveRFMChart({ data, loading, onRecalculate }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader size="large" showText={true} text="Loading Adaptive RFM analysis..." />
      </div>
    );
  }

  // Handle needs calculation state
  if (!data || data.needsCalculation) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
        <Target className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Adaptive RFM Not Calculated Yet
        </h3>
        <p className="text-gray-900 dark:text-blue-200 mb-6">
          Run the Adaptive RFM v3.0 analysis to get intelligent, auto-adjusted customer segmentation
          based on your unique business model.
        </p>
        <Button
          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
          onClick={onRecalculate}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Calculate Adaptive RFM
        </Button>
      </div>
    );
  }

  const {
    characteristics,
    calculated_criteria,
    validation,
    thresholds,
    template_used,
    has_override,
    needs_recalculation,
    last_calculated,
    data_quality
  } = data;

  // Prepare recency threshold data for visualization
  const recencyData = [
    { zone: 'Hot', days: thresholds?.hot || 30, color: '#10B981', description: 'Active buyers' },
    { zone: 'Warm', days: thresholds?.warm || 60, color: '#60A5FA', description: 'Recent customers' },
    { zone: 'Cool', days: thresholds?.cool || 90, color: '#F59E0B', description: 'Cooling off' },
    { zone: 'At Risk', days: thresholds?.at_risk || 180, color: '#EF4444', description: 'Need attention' },
    { zone: 'Lost', days: thresholds?.lost || 365, color: '#6B7280', description: 'Re-engage' }
  ];

  // Prepare criteria distribution data
  const frequencyCriteria = calculated_criteria?.frequency || {};
  const monetaryCriteria = calculated_criteria?.monetary || {};

  const criteriaData = [
    {
      tier: 'Champion',
      min_orders: frequencyCriteria.champion?.min_orders || 0,
      min_revenue: monetaryCriteria.champion?.min_revenue || 0,
      pct_meeting: frequencyCriteria.champion?.pct_customers_meeting || 0,
      is_healthy: frequencyCriteria.champion?.is_healthy,
      adjusted: frequencyCriteria.champion?.adjusted
    },
    {
      tier: 'Loyal',
      min_orders: frequencyCriteria.loyal?.min_orders || 0,
      min_revenue: monetaryCriteria.loyal?.min_revenue || 0,
      pct_meeting: frequencyCriteria.loyal?.pct_customers_meeting || 0,
      is_healthy: frequencyCriteria.loyal?.is_healthy,
      adjusted: frequencyCriteria.loyal?.adjusted
    },
    {
      tier: 'Active',
      min_orders: frequencyCriteria.active?.min_orders || 1,
      min_revenue: monetaryCriteria.active?.min_revenue || 0,
      pct_meeting: frequencyCriteria.active?.pct_customers_meeting || 0,
      is_healthy: frequencyCriteria.active?.is_healthy,
      adjusted: frequencyCriteria.active?.adjusted
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with recalculate button */}
      {needs_recalculation && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-gray-900 dark:text-yellow-200">
              RFM criteria last calculated {new Date(last_calculated).toLocaleDateString()}.
              Recalculate for updated insights.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRecalculate}
            className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
        </div>
      )}

      {/* Business Characteristics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Template & Confidence */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-gray-900 dark:text-purple-200 mb-2">Business Template</p>
              <TemplateBadge template={template_used} />
            </div>
            <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-900 dark:text-purple-300">Confidence</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {formatPercentage((characteristics?.confidence_score || 0) * 100)}
              </span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-900/30 rounded-full h-2">
              <div
                className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full"
                style={{ width: `${(characteristics?.confidence_score || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* One-time Buyer Percentage */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 dark:text-blue-200">One-Time Buyers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatPercentage(characteristics?.one_time_buyer_percentage || 0)}
              </p>
              <p className="text-xs text-gray-900 dark:text-blue-300 mt-1">of customer base</p>
            </div>
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Purchase Cycle */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900 dark:text-green-200">Median Purchase Cycle</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {characteristics?.median_inter_purchase_days || 'N/A'}
              </p>
              <p className="text-xs text-gray-900 dark:text-green-300 mt-1">days between orders</p>
            </div>
            <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* RFM Criteria with Explainability */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Auto-Adjusted RFM Criteria
            </h4>
            <ChartInfo
              title="Adaptive Criteria"
              description="These criteria are automatically calculated and validated based on your actual customer data. Green checkmarks indicate healthy distributions. Adjusted thresholds include explanations."
            />
          </div>
          {has_override && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Custom Override
            </span>
          )}
        </div>

        {/* Criteria Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {criteriaData.map((criteria, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-lg border-2 ${
                criteria.is_healthy
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-900 dark:text-white">{criteria.tier}</h5>
                {criteria.adjusted && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Auto-Adjusted
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-300">
                    <strong>{criteria.min_orders}+</strong> orders
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-900 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-300">
                    <strong>${criteria.min_revenue.toFixed(2)}+</strong> revenue
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <HealthIndicator
                    isHealthy={criteria.is_healthy}
                    percentage={criteria.pct_meeting}
                    expectedRange={
                      idx === 0 ? [2, 8] :
                      idx === 1 ? [5, 15] :
                      [35, 45]
                    }
                  />
                </div>
              </div>

              {/* Adjustment reason tooltip */}
              {criteria.adjusted && frequencyCriteria[criteria.tier.toLowerCase()]?.adjustment_reason && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-900 dark:text-blue-200">
                  <Info className="h-3 w-3 inline mr-1" />
                  {frequencyCriteria[criteria.tier.toLowerCase()].adjustment_reason}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Criteria Distribution Chart */}
        <div className="mt-6">
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Customer Distribution Across Tiers
          </h5>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={criteriaData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="tier"
                tick={{ fill: '#111827' }}
                className="dark:[&>g>text]:fill-gray-100"
              />
              <YAxis
                tick={{ fill: '#111827' }}
                className="dark:[&>g>text]:fill-gray-100"
                tickFormatter={(value) => `${value}%`}
                label={{ value: '% of Customers', angle: -90, position: 'insideLeft', fill: '#111827', className: 'dark:fill-gray-100' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <Bar dataKey="pct_meeting" name="% Meeting Criteria">
                {criteriaData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.is_healthy ? '#10B981' : '#F59E0B'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recency Thresholds Timeline */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recency Thresholds
          </h4>
          <ChartInfo
            title="Adaptive Recency Zones"
            description="These day-based thresholds are calculated from your actual customer purchase intervals. They define when customers transition from 'Hot' to 'At Risk' based on YOUR business cycle."
          />
        </div>

        {/* Visual Timeline */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recencyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                type="number"
                tick={{ fill: '#111827' }}
                className="dark:[&>g>text]:fill-gray-100"
                label={{ value: 'Days Since Last Order', position: 'bottom', fill: '#111827', className: 'dark:fill-gray-100' }}
              />
              <YAxis
                type="category"
                dataKey="zone"
                tick={{ fill: '#111827' }}
                className="dark:[&>g>text]:fill-gray-100"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value, name, props) => [
                  `0-${value} days: ${props.payload.description}`,
                  props.payload.zone
                ]}
              />
              <Bar dataKey="days" name="Days">
                {recencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Threshold Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {recencyData.map((zone, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: `${zone.color}15`,
                borderLeft: `4px solid ${zone.color}`
              }}
            >
              <div className="text-xs font-medium text-gray-900 dark:text-gray-300 mb-1">
                {zone.zone}
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {idx === 0 ? `0-${zone.days}` : `${recencyData[idx - 1].days + 1}-${zone.days}`}
              </div>
              <div className="text-xs text-gray-900 dark:text-gray-400 mt-1">days</div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Health Dashboard */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Validation & Health
          </h4>
          <ChartInfo
            title="Distribution Health Check"
            description="The system validates that criteria produce healthy customer distributions. Warnings indicate potential issues that may need manual review."
          />
        </div>

        {/* Overall Health Status */}
        <div className={`p-4 rounded-lg mb-4 ${
          validation?.distribution_healthy
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center gap-3">
            {validation?.distribution_healthy ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            )}
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {validation?.distribution_healthy
                  ? '✅ All criteria are healthy'
                  : '⚠️ Some criteria need review'}
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-300">
                Distributions are {validation?.distribution_healthy ? 'within' : 'outside'} expected ranges
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Warnings
            </h5>
            <ul className="space-y-2">
              {validation.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-gray-900 dark:text-yellow-200 flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {validation?.recommendations && validation.recommendations.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Recommendations
            </h5>
            <ul className="space-y-2">
              {validation.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-gray-900 dark:text-blue-200 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">💡</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Data Quality Metrics */}
      {data_quality && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            📊 Data Quality Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-gray-900 dark:text-gray-400">Total Customers</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(data_quality.total_customers)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-900 dark:text-gray-400">Repeat Sample Size</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(data_quality.repeat_sample_size)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-900 dark:text-gray-400">Total Orders</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatNumber(data_quality.total_orders)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-900 dark:text-gray-400">Data Range</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {data_quality.date_range_days} days
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-900 dark:text-gray-400">Data Sufficient</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {data_quality.is_sufficient ? '✅ Yes' : '⚠️ No'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from 'react';
import AccountPerformanceChart from './AccountPerformanceChart';

// Sample data matching your screenshot accounts
const DEMO_ACCOUNT_DATA = [
  {
    accountId: 'shopify_001',
    accountName: 'Shopify',
    revenue: 285000,
    averageOrderValue: 125,
    openRate: 24.5,
    clickRate: 3.8,
    conversionRate: 2.4,
    revenuePerRecipient: 0.21,
    revenuePerClick: 5.50,
    clickToOpenRate: 15.5,
    clickToConversionRate: 63.2,
    unsubscribeRate: 0.18,
    recipients: 1357000,
    opens: 332465,
    clicks: 51766,
    conversions: 2280,
    campaigns: 45,
    revenuePerCampaign: 6333.33
  },
  {
    accountId: 'balmain_001',
    accountName: 'balmain',
    revenue: 98500,
    averageOrderValue: 320,
    openRate: 15.2,
    clickRate: 1.8,
    conversionRate: 0.9,
    revenuePerRecipient: 0.08,
    revenuePerClick: 4.20,
    clickToOpenRate: 11.8,
    clickToConversionRate: 50.0,
    unsubscribeRate: 0.35,
    recipients: 1231250,
    opens: 187150,
    clicks: 22163,
    conversions: 308,
    campaigns: 28,
    revenuePerCampaign: 3517.86
  },
  {
    accountId: 'nike_001',
    accountName: 'Nike Sports',
    revenue: 456000,
    averageOrderValue: 180,
    openRate: 28.3,
    clickRate: 4.2,
    conversionRate: 3.1,
    revenuePerRecipient: 0.28,
    revenuePerClick: 6.80,
    clickToOpenRate: 14.8,
    clickToConversionRate: 73.8,
    unsubscribeRate: 0.12,
    recipients: 1628000,
    opens: 460724,
    clicks: 68376,
    conversions: 50468,
    campaigns: 52,
    revenuePerCampaign: 8769.23
  },
  {
    accountId: 'zara_001',
    accountName: 'Zara Fashion',
    revenue: 342000,
    averageOrderValue: 95,
    openRate: 19.8,
    clickRate: 2.9,
    conversionRate: 2.2,
    revenuePerRecipient: 0.15,
    revenuePerClick: 5.10,
    clickToOpenRate: 14.6,
    clickToConversionRate: 75.9,
    unsubscribeRate: 0.22,
    recipients: 2280000,
    opens: 451440,
    clicks: 66120,
    conversions: 50160,
    campaigns: 38,
    revenuePerCampaign: 9000.00
  },
  {
    accountId: 'sephora_001',
    accountName: 'Sephora Beauty',
    revenue: 512000,
    averageOrderValue: 110,
    openRate: 31.2,
    clickRate: 4.8,
    conversionRate: 3.5,
    revenuePerRecipient: 0.32,
    revenuePerClick: 6.90,
    clickToOpenRate: 15.4,
    clickToConversionRate: 72.9,
    unsubscribeRate: 0.15,
    recipients: 1600000,
    opens: 499200,
    clicks: 76800,
    conversions: 56000,
    campaigns: 48,
    revenuePerCampaign: 10666.67
  },
  {
    accountId: 'walmart_001',
    accountName: 'Walmart',
    revenue: 892000,
    averageOrderValue: 65,
    openRate: 17.5,
    clickRate: 2.1,
    conversionRate: 1.8,
    revenuePerRecipient: 0.12,
    revenuePerClick: 5.70,
    clickToOpenRate: 12.0,
    clickToConversionRate: 85.7,
    unsubscribeRate: 0.28,
    recipients: 7433000,
    opens: 1300775,
    clicks: 156093,
    conversions: 133794,
    campaigns: 62,
    revenuePerCampaign: 14387.10
  },
  {
    accountId: 'bestbuy_001',
    accountName: 'Best Buy',
    revenue: 678000,
    averageOrderValue: 420,
    openRate: 22.1,
    clickRate: 3.2,
    conversionRate: 1.9,
    revenuePerRecipient: 0.24,
    revenuePerClick: 7.80,
    clickToOpenRate: 14.5,
    clickToConversionRate: 59.4,
    unsubscribeRate: 0.16,
    recipients: 2825000,
    opens: 624325,
    clicks: 90400,
    conversions: 53675,
    campaigns: 42,
    revenuePerCampaign: 16142.86
  },
  {
    accountId: 'target_001',
    accountName: 'Target',
    revenue: 445000,
    averageOrderValue: 78,
    openRate: 20.5,
    clickRate: 3.0,
    conversionRate: 2.5,
    revenuePerRecipient: 0.18,
    revenuePerClick: 6.10,
    clickToOpenRate: 14.6,
    clickToConversionRate: 83.3,
    unsubscribeRate: 0.20,
    recipients: 2472000,
    opens: 506760,
    clicks: 74160,
    conversions: 61800,
    campaigns: 40,
    revenuePerCampaign: 11125.00
  }
];

export default function AccountPerformanceDemo() {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Account Performance Chart Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compare performance across all your accounts with dynamic benchmarking
          </p>
        </div>

        {/* Demo Chart */}
        <AccountPerformanceChart
          accountData={DEMO_ACCOUNT_DATA}
        />

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🎯 Relative Scoring
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Each account is scored based on how it performs compared to your portfolio average
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              📊 Multiple Views
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scorecard, bar chart, scatter plot, and radar views for different insights
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              💡 Clear Rankings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See where each account ranks in percentiles and identify top/bottom performers
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            How Performance Scoring Works
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Dynamic Benchmarking</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Calculates averages from all your accounts</li>
                <li>• Updates in real-time as data changes</li>
                <li>• No fixed industry benchmarks needed</li>
                <li>• Adapts to your specific portfolio</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Percentile Rankings</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Top 20% (80-100): Excellent performers</li>
                <li>• Top 40% (60-79): Above average</li>
                <li>• Middle (40-59): Average performance</li>
                <li>• Bottom 40% (20-39): Below average</li>
                <li>• Bottom 20% (0-19): Needs immediate attention</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Try These Features:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• <strong>Switch view modes</strong> to see different visualizations of the same data</li>
            <li>• <strong>Change metrics</strong> to score accounts on different performance dimensions</li>
            <li>• <strong>Sort accounts</strong> by score, revenue, or percentile ranking</li>
            <li>• <strong>Scorecard view</strong> shows at-a-glance performance with visual indicators</li>
            <li>• <strong>Scatter plot</strong> reveals strategic positioning in 2D space</li>
            <li>• <strong>Radar chart</strong> compares top 5 accounts across all metrics</li>
            <li>• <strong>Show details</strong> to see the calculated averages for your portfolio</li>
          </ul>
        </div>

        {/* Key Metrics Explained */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics Explained
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Revenue Efficiency</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">$/Recipient & $/Click - How well you monetize interactions</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Engagement Quality</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Click/Open & Conv/Click - Quality of your engaged audience</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-1">List Health</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Engagement vs Unsubscribes - Long-term sustainability</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">Campaign ROI</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Revenue per Campaign - Overall effectiveness</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
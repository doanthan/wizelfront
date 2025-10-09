"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Mail,
  MessageSquare,
  ChevronsUpDown,
  Store,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// Sample data generators
const generateAccountData = () => [
  { account: 'Store Alpha', totalRevenue: 145680, orders: 456, aov: 319.56, campaignRevenue: 89000, flowRevenue: 56680, emailCTR: 3.2, returnRate: 45.678, newCustomers: 123, returningCustomers: 103, campaignsSent: 24, attributedRevenuePerRecipient: 12.45, totalRevenuePerRecipient: 23.87 },
  { account: 'Store Beta', totalRevenue: 98320, orders: 312, aov: 315.13, campaignRevenue: 52000, flowRevenue: 46320, emailCTR: 2.8, returnRate: 38.234, newCustomers: 156, returningCustomers: 95, campaignsSent: 18, attributedRevenuePerRecipient: 9.34, totalRevenuePerRecipient: 18.56 },
  { account: 'Store Gamma', totalRevenue: 234590, orders: 678, aov: 345.91, campaignRevenue: 145000, flowRevenue: 89590, emailCTR: 4.1, returnRate: 52.341, newCustomers: 234, returningCustomers: 257, campaignsSent: 32, attributedRevenuePerRecipient: 15.67, totalRevenuePerRecipient: 28.92 },
  { account: 'Store Delta', totalRevenue: 67890, orders: 189, aov: 359.21, campaignRevenue: 34000, flowRevenue: 33890, emailCTR: 2.1, returnRate: 29.876, newCustomers: 98, returningCustomers: 42, campaignsSent: 12, attributedRevenuePerRecipient: 8.23, totalRevenuePerRecipient: 16.45 },
];

const generateCampaignData = () => [
  { name: 'Black Friday Sale', status: 'sent', recipients: 12450, openRate: 28.5, revenue: 45680 },
  { name: 'Holiday Gift Guide', status: 'sent', recipients: 8920, openRate: 31.2, revenue: 32100 },
  { name: 'New Year Special', status: 'scheduled', recipients: 15600, openRate: 0, revenue: 0 },
  { name: 'Winter Clearance', status: 'sent', recipients: 11230, openRate: 24.8, revenue: 28900 },
  { name: 'Valentine\'s Day', status: 'scheduled', recipients: 9800, openRate: 0, revenue: 0 },
];

const generateComparisonData = () => [
  { name: 'Total Revenue', current: 487000, previous: 423000, type: 'currency' },
  { name: 'Orders', current: 1635, previous: 1489, type: 'number' },
  { name: 'Average Order Value', current: 297.85, previous: 284.12, type: 'currency' },
  { name: 'Email Campaigns', current: 86, previous: 78, type: 'number' },
  { name: 'New Customers', current: 611, previous: 548, type: 'number' },
];

const generateChannelData = () => {
  const emailTotal = 389000;
  const emailOrders = 1245;
  const smsTotal = 98000;
  const smsOrders = 390;
  const totalRevenue = emailTotal + smsTotal;

  return {
    email: {
      total: emailTotal,
      orders: emailOrders,
      percent: (emailTotal / totalRevenue) * 100,
      campaigns: { revenue: 234000, orders: 756, percent: (234000 / totalRevenue) * 100 },
      flows: { revenue: 155000, orders: 489, percent: (155000 / totalRevenue) * 100 },
    },
    sms: {
      total: smsTotal,
      orders: smsOrders,
      percent: (smsTotal / totalRevenue) * 100,
    }
  };
};

const generateSegmentData = () => [
  {
    name: 'Champions',
    description: 'High value, frequent buyers',
    customers: { current: 234, previous: 215 },
    revenue: { current: 145000, previous: 132000 },
    orders: { current: 678, previous: 625 },
    engagementScore: 92
  },
  {
    name: 'Loyal Customers',
    description: 'Regular purchasers',
    customers: { current: 412, previous: 389 },
    revenue: { current: 198000, previous: 182000 },
    orders: { current: 1123, previous: 1050 },
    engagementScore: 78
  },
  {
    name: 'At Risk',
    description: 'Declining engagement',
    customers: { current: 189, previous: 198 },
    revenue: { current: 45000, previous: 51000 },
    orders: { current: 234, previous: 267 },
    engagementScore: 32
  },
  {
    name: 'Need Attention',
    description: 'Low recent activity',
    customers: { current: 267, previous: 245 },
    revenue: { current: 67000, previous: 63000 },
    orders: { current: 389, previous: 370 },
    engagementScore: 45
  },
];

const generateStoreData = () => [
  {
    name: "Downtown Flagship",
    location: "New York, NY",
    lastMonthSales: 285000,
    thisMonthSales: 312000,
    change: 9.5,
    trend: "up",
    lastMonthFootfall: 12500,
    thisMonthFootfall: 13800,
    footfallChange: 10.4,
    conversionRate: 22.6,
  },
  {
    name: "West Coast Hub",
    location: "San Francisco, CA",
    lastMonthSales: 198000,
    thisMonthSales: 215000,
    change: 8.6,
    trend: "up",
    lastMonthFootfall: 9800,
    thisMonthFootfall: 10500,
    footfallChange: 7.1,
    conversionRate: 20.5,
  },
  {
    name: "Midwest Center",
    location: "Chicago, IL",
    lastMonthSales: 156000,
    thisMonthSales: 148000,
    change: -5.1,
    trend: "down",
    lastMonthFootfall: 8200,
    thisMonthFootfall: 7800,
    footfallChange: -4.9,
    conversionRate: 19.0,
  },
  {
    name: "Southern Branch",
    location: "Austin, TX",
    lastMonthSales: 142000,
    thisMonthSales: 168000,
    change: 18.3,
    trend: "up",
    lastMonthFootfall: 7500,
    thisMonthFootfall: 8900,
    footfallChange: 18.7,
    conversionRate: 18.9,
  },
  {
    name: "East Coast Outlet",
    location: "Boston, MA",
    lastMonthSales: 124000,
    thisMonthSales: 135000,
    change: 8.9,
    trend: "up",
    lastMonthFootfall: 6800,
    thisMonthFootfall: 7200,
    footfallChange: 5.9,
    conversionRate: 18.8,
  },
];

export default function TablesStyle() {
  const accountData = generateAccountData();
  const campaignData = generateCampaignData();
  const comparisonData = generateComparisonData();
  const channelData = generateChannelData();
  const segmentData = generateSegmentData();
  const storeData = generateStoreData();

  // Sorting state for first table
  const [sortField, setSortField] = useState('totalRevenue');
  const [sortDirection, setSortDirection] = useState('desc');

  // Sorting state for store performance table
  const [storeSortKey, setStoreSortKey] = useState(null);
  const [storeSortDirection, setStoreSortDirection] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleStoreSort = (key) => {
    if (storeSortKey === key) {
      if (storeSortDirection === "asc") {
        setStoreSortDirection("desc");
      } else if (storeSortDirection === "desc") {
        setStoreSortKey(null);
        setStoreSortDirection(null);
      } else {
        setStoreSortDirection("asc");
      }
    } else {
      setStoreSortKey(key);
      setStoreSortDirection("asc");
    }
  };

  const sortedStoreData = useMemo(() => {
    const data = [...storeData];
    if (!storeSortKey || !storeSortDirection) return data;

    return data.sort((a, b) => {
      let aValue = a[storeSortKey];
      let bValue = b[storeSortKey];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (storeSortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [storeData, storeSortKey, storeSortDirection]);

  const StoreSortIcon = ({ columnKey }) => {
    if (storeSortKey !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    if (storeSortDirection === "asc") {
      return <ArrowUp className="h-3 w-3 text-blue-600" />;
    }
    return <ArrowDown className="h-3 w-3 text-blue-600" />;
  };

  const sortedAccountData = useMemo(() => {
    return [...accountData].sort((a, b) => {
      let aValue = a[sortField] || 0;
      let bValue = b[sortField] || 0;

      if (sortField === 'account') {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [accountData, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalRevenue = accountData.reduce((sum, acc) => sum + acc.totalRevenue, 0);
    const totalOrders = accountData.reduce((sum, acc) => sum + acc.orders, 0);
    const totalCampaignRevenue = accountData.reduce((sum, acc) => sum + acc.campaignRevenue, 0);
    const totalFlowRevenue = accountData.reduce((sum, acc) => sum + acc.flowRevenue, 0);
    const totalCampaigns = accountData.reduce((sum, acc) => sum + acc.campaignsSent, 0);
    const totalNewCustomers = accountData.reduce((sum, acc) => sum + acc.newCustomers, 0);
    const totalReturningCustomers = accountData.reduce((sum, acc) => sum + acc.returningCustomers, 0);

    return {
      totalRevenue,
      totalOrders,
      avgAOV: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalCampaignRevenue,
      totalFlowRevenue,
      totalCampaigns,
      totalNewCustomers,
      totalReturningCustomers,
      avgReturnRate: (totalNewCustomers + totalReturningCustomers) > 0
        ? (totalReturningCustomers / (totalNewCustomers + totalReturningCustomers)) * 100
        : 0,
      avgEmailCTR: accountData.reduce((sum, acc) => sum + acc.emailCTR, 0) / accountData.length,
      avgAttributedRevenuePerRecipient: accountData.reduce((sum, acc) => sum + acc.attributedRevenuePerRecipient, 0) / accountData.length,
      avgTotalRevenuePerRecipient: accountData.reduce((sum, acc) => sum + acc.totalRevenuePerRecipient, 0) / accountData.length,
    };
  }, [accountData]);

  return (
    <div className="space-y-8">
      {/* Table 1: Basic Sortable Data Table */}
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-gray-900 dark:text-white">1. Sortable Account Performance Table</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Click column headers to sort. Includes totals row at bottom.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th
                    className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('account')}
                  >
                    <div className="flex items-center gap-1">
                      Account
                      <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('totalRevenue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Revenue
                      <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('orders')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Orders
                      <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('aov')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      AOV
                      <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort('emailCTR')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Email CTR
                      <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAccountData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-50">
                      {row.account}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-50 font-medium">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {formatNumber(row.orders)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {formatCurrency(row.aov)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                      {formatPercentage(row.emailCTR)}
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                  <td className="py-3 px-2 text-gray-900 dark:text-gray-50">Total</td>
                  <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-50">
                    {formatCurrency(totals.totalRevenue)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-50">
                    {formatNumber(totals.totalOrders)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-50">
                    {formatCurrency(totals.avgAOV)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-50">
                    {formatPercentage(totals.avgEmailCTR)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Store Performance Table */}
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Store Performance</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Multi-location comparison: This month vs last month
            </p>
          </div>
          <Store className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th
                    className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => handleStoreSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Store
                      <StoreSortIcon columnKey="name" />
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => handleStoreSort("thisMonthSales")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Sales Comparison
                      <StoreSortIcon columnKey="thisMonthSales" />
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => handleStoreSort("thisMonthFootfall")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Footfall
                      <StoreSortIcon columnKey="thisMonthFootfall" />
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => handleStoreSort("conversionRate")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Conversion
                      <StoreSortIcon columnKey="conversionRate" />
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStoreData.map((store, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.name}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-6">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{store.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ${store.thisMonthSales.toLocaleString()}
                          </span>
                          {store.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            from ${store.lastMonthSales.toLocaleString()}
                          </span>
                          <span
                            className={`text-xs font-medium ${store.trend === "up" ? "text-green-600" : "text-red-600"}`}
                          >
                            ({store.change > 0 ? "+" : ""}
                            {store.change}%)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-right space-y-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block">
                          {store.thisMonthFootfall.toLocaleString()}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            was {store.lastMonthFootfall.toLocaleString()}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              store.footfallChange > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ({store.footfallChange > 0 ? "+" : ""}
                            {store.footfallChange}%)
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20">
                        <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                          {store.conversionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {store.trend === "up" ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">Exceeding Target</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs font-medium text-red-700 dark:text-red-400">Below Target</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 2: Status Table with Icons */}
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-gray-900 dark:text-white">2. Campaign Status Table with Icons</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Compact table with status badges and icons for visual clarity.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-gray-50">Campaign</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-900 dark:text-gray-50">Status</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-900 dark:text-gray-50">Recipients</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-900 dark:text-gray-50">Open Rate</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-900 dark:text-gray-50">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {campaignData.map((campaign, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-sky-blue" />
                        <span className="font-medium text-gray-900 dark:text-gray-50">
                          {campaign.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === 'sent'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {campaign.status === 'sent' ? 'Sent' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                      {formatNumber(campaign.recipients)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                      {campaign.openRate > 0 ? formatPercentage(campaign.openRate) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right font-medium text-gray-900 dark:text-gray-50">
                      {campaign.revenue > 0 ? formatCurrency(campaign.revenue) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 3: Comparison Table with Trends */}
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-gray-900 dark:text-white">3. Period-over-Period Comparison Table</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Shows current vs previous period with trend indicators.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Metric</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Current Period</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Previous Period</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Change</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((metric, index) => {
                  const change = ((metric.current - metric.previous) / metric.previous) * 100;
                  const isPositive = change > 0;

                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-50">
                        {metric.name}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-900 dark:text-gray-50 font-medium">
                        {metric.type === 'currency' ? formatCurrency(metric.current) : formatNumber(metric.current)}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">
                        {metric.type === 'currency' ? formatCurrency(metric.previous) : formatNumber(metric.previous)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className={`inline-flex items-center gap-1 font-medium ${
                          isPositive
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-red-600 dark:text-red-500'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatPercentage(Math.abs(change))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 4: Nested/Grouped Data Table */}
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-gray-900 dark:text-white">4. Channel Revenue Breakdown (Nested)</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Hierarchical data showing parent and child categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Channel</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Revenue</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Orders</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Email Channel Group */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-sky-50 dark:bg-sky-900/20">
                  <td className="py-3 px-2 font-bold text-gray-900 dark:text-gray-50">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-sky-blue" />
                      Email Marketing
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900 dark:text-gray-50">
                    {formatCurrency(channelData.email.total)}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900 dark:text-gray-50">
                    {formatNumber(channelData.email.orders)}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900 dark:text-gray-50">
                    {formatPercentage(channelData.email.percent)}
                  </td>
                </tr>
                {/* Email Sub-channels */}
                <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="py-2 px-2 pl-8 text-gray-700 dark:text-gray-200">
                    Campaigns
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                    {formatCurrency(channelData.email.campaigns.revenue)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                    {formatNumber(channelData.email.campaigns.orders)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                    {formatPercentage(channelData.email.campaigns.percent)}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="py-2 px-2 pl-8 text-gray-700 dark:text-gray-200">
                    Flows
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                    {formatCurrency(channelData.email.flows.revenue)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                    {formatNumber(channelData.email.flows.orders)}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-700 dark:text-gray-200">
                    {formatPercentage(channelData.email.flows.percent)}
                  </td>
                </tr>

                {/* SMS Channel Group */}
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                  <td className="py-3 px-2 font-bold text-gray-900 dark:text-gray-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      SMS Marketing
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900 dark:text-gray-50">
                    {formatCurrency(channelData.sms.total)}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900 dark:text-gray-50">
                    {formatNumber(channelData.sms.orders)}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900 dark:text-gray-50">
                    {formatPercentage(channelData.sms.percent)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Table 5: Multi-Level Metric Table */}
      <Card className="border border-gray-300 dark:border-gray-600">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-gray-900 dark:text-white">5. Customer Segmentation with Sub-Metrics</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Shows primary and secondary metrics with progress bars.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Segment</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Customers</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Revenue</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Orders</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-900 dark:text-gray-50">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {segmentData.map((segment, index) => {
                  const customersChange = ((segment.customers.current - segment.customers.previous) / segment.customers.previous) * 100;
                  const revenueChange = ((segment.revenue.current - segment.revenue.previous) / segment.revenue.previous) * 100;
                  const ordersChange = ((segment.orders.current - segment.orders.previous) / segment.orders.previous) * 100;

                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="font-medium text-gray-900 dark:text-gray-50">
                          {segment.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {segment.description}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center justify-center gap-1">
                            {formatNumber(segment.customers.current)}
                            {customersChange !== 0 && (
                              customersChange > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                              )
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            was {formatNumber(segment.customers.previous)}{' '}
                            <span className={customersChange > 0 ? 'text-green-600 dark:text-green-500' : customersChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-400'}>
                              ({customersChange > 0 ? '+' : ''}{customersChange.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center justify-center gap-1">
                            {formatCurrency(segment.revenue.current)}
                            {revenueChange !== 0 && (
                              revenueChange > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                              )
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            from {formatCurrency(segment.revenue.previous)}{' '}
                            <span className={revenueChange > 0 ? 'text-green-600 dark:text-green-500' : revenueChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-400'}>
                              ({revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center justify-center gap-1">
                            {formatNumber(segment.orders.current)}
                            {ordersChange !== 0 && (
                              ordersChange > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                              )
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            was {formatNumber(segment.orders.previous)}{' '}
                            <span className={ordersChange > 0 ? 'text-green-600 dark:text-green-500' : ordersChange < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-400'}>
                              ({ordersChange > 0 ? '+' : ''}{ordersChange.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-1">
                            {segment.engagementScore}%
                          </div>
                          <div className="h-2 w-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <div
                              className={`h-full transition-all ${
                                segment.engagementScore > 75 ? 'bg-green-500' :
                                segment.engagementScore > 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${segment.engagementScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Design Notes */}
      <Card className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-sky-blue dark:border-sky-blue/50">
        <CardHeader>
          <CardTitle className="text-sky-blue">Table Design Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Text Color Hierarchy</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-200 space-y-1">
              <li>• <strong>Headers:</strong> text-gray-900 dark:text-gray-50 (highest contrast)</li>
              <li>• <strong>Primary values:</strong> text-gray-900 dark:text-gray-50 font-medium</li>
              <li>• <strong>Secondary values:</strong> text-gray-700 dark:text-gray-200</li>
              <li>• <strong>Meta info:</strong> text-gray-600 dark:text-gray-400</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Interactive Elements</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-200 space-y-1">
              <li>• <strong>Sortable columns:</strong> Add cursor-pointer and hover:bg-gray-50</li>
              <li>• <strong>Row hover:</strong> hover:bg-gray-50 dark:hover:bg-gray-900/50</li>
              <li>• <strong>Sort icons:</strong> Use ChevronsUpDown from lucide-react</li>
              <li>• <strong>Transitions:</strong> Always include transition-colors for smooth interactions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Border Patterns</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-200 space-y-1">
              <li>• <strong>Card borders:</strong> border border-gray-300 dark:border-gray-600</li>
              <li>• <strong>Header row:</strong> border-b border-gray-200 dark:border-gray-700</li>
              <li>• <strong>Body rows:</strong> border-b border-gray-100 dark:border-gray-800</li>
              <li>• <strong>Totals row:</strong> border-t-2 border-gray-300 dark:border-gray-600</li>
              <li>• <strong>Group headers:</strong> border-b border-gray-200 with bg tint</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Design Principles Compliance</h4>
            <ul className="text-sm text-gray-900 dark:text-gray-200 space-y-1">
              <li>• ✅ Never use text-gray-100 for dark mode primary text (use text-gray-50)</li>
              <li>• ✅ Never use text-muted or low-contrast grays for primary content</li>
              <li>• ✅ Always include transition-colors on interactive elements</li>
              <li>• ✅ Card headers should have border-b for visual separation</li>
              <li>• ✅ Use proper spacing with pt-6 on CardContent after bordered headers</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

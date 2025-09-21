"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage, formatPercentageChange } from '@/lib/utils';
import MorphingLoader from '@/app/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Package, RefreshCw, Percent, Mail,
  Target, Award, Activity, Eye, MousePointer,
  ArrowUp, ArrowDown, Calendar, ChevronRight
} from 'lucide-react';

const COLORS = ['#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export default function StoreRevenueReportPage() {
  const router = useRouter();
  const params = useParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [storePublicId, setStorePublicId] = useState(null);

  // Get storePublicId from params
  useEffect(() => {
    async function getStoreId() {
      const resolvedParams = await params;
      setStorePublicId(resolvedParams.storePublicId);
    }
    getStoreId();
  }, [params]);

  // Calculate default dates dynamically
  const getDefaultDateRange = () => {
    const now = new Date();
    const past90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const past180Days = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    return {
      period: "last90",
      comparisonType: "previous-period",
      ranges: {
        main: {
          start: past90Days,
          end: now,
          label: "Past 90 days"
        },
        comparison: {
          start: past180Days,
          end: past90Days,
          label: "Previous 90 days"
        }
      }
    };
  };

  const [dateRangeSelection, setDateRangeSelection] = useState(getDefaultDateRange());

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('revenueReportDateRange');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.ranges?.main) {
          parsed.ranges.main.start = new Date(parsed.ranges.main.start);
          parsed.ranges.main.end = new Date(parsed.ranges.main.end);
        }
        if (parsed.ranges?.comparison) {
          parsed.ranges.comparison.start = new Date(parsed.ranges.comparison.start);
          parsed.ranges.comparison.end = new Date(parsed.ranges.comparison.end);
        }
        setDateRangeSelection(parsed);
      }
    } catch (e) {
      console.warn('Failed to load date range from localStorage:', e);
    }
  }, []);

  // Get current store from stores list
  const currentStore = useMemo(() => {
    if (!stores || !storePublicId) return null;
    return stores.find(s => s.public_id === storePublicId);
  }, [stores, storePublicId]);

  // Handle date range changes from the date selector
  const handleDateRangeChange = (newDateRangeSelection) => {
    console.log('Revenue Report: Date range changed', newDateRangeSelection);
    setDateRangeSelection(newDateRangeSelection);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        const dateRangeToSave = {
          ...newDateRangeSelection,
          ranges: {
            main: {
              start: newDateRangeSelection.ranges?.main?.start?.toISOString(),
              end: newDateRangeSelection.ranges?.main?.end?.toISOString(),
              label: newDateRangeSelection.ranges?.main?.label
            },
            comparison: newDateRangeSelection.ranges?.comparison ? {
              start: newDateRangeSelection.ranges.comparison.start?.toISOString(),
              end: newDateRangeSelection.ranges.comparison.end?.toISOString(),
              label: newDateRangeSelection.ranges.comparison.label
            } : null
          }
        };
        localStorage.setItem('revenueReportDateRange', JSON.stringify(dateRangeToSave));
      } catch (e) {
        console.warn('Failed to save date range to localStorage:', e);
      }
    }
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      // Navigate to new store's revenue report
      router.push(`/store/${newStoreId}/report/revenue`);
    }
  };

  // Fetch report data when storeId or date range changes
  useEffect(() => {
    if (!isLoadingStores && storePublicId && stores && stores.length > 0) {
      fetchReportData();
    }
  }, [storePublicId, dateRangeSelection, stores, isLoadingStores]);

  const fetchReportData = async () => {
    if (!storePublicId) return;

    try {
      setLoading(true);
      setError(null);

      // Calculate days from date range
      const days = dateRangeSelection.ranges?.main ?
        Math.ceil((dateRangeSelection.ranges.main.end - dateRangeSelection.ranges.main.start) / (1000 * 60 * 60 * 24)) :
        90;

      const response = await fetch(
        `/api/analytics/revenue-report?days=${days}&storeId=${storePublicId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch revenue report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentage change
  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate metric card data
  const getMetricCardData = () => {
    if (!reportData) return [];

    const {
      overall_revenue,
      attributed_revenue,
      total_orders,
      unique_customers,
      avg_order_value,
      new_customers,
      returning_customers,
      repeat_rate,
      previous_period
    } = reportData;

    return [
      {
        title: "Overall Revenue",
        value: formatCurrency(overall_revenue || 0),
        change: getPercentageChange(overall_revenue, previous_period?.overall_revenue),
        icon: DollarSign,
        color: "text-sky-blue"
      },
      {
        title: "Attributed Revenue",
        value: formatCurrency(attributed_revenue || 0),
        change: getPercentageChange(attributed_revenue, previous_period?.attributed_revenue),
        icon: Target,
        color: "text-vivid-violet",
        subtitle: reportData.attributed_percentage ?
          `${formatPercentage(reportData.attributed_percentage)} of total` : null
      },
      {
        title: "Total Orders",
        value: formatNumber(total_orders || 0),
        change: getPercentageChange(total_orders, previous_period?.total_orders),
        icon: ShoppingCart,
        color: "text-deep-purple"
      },
      {
        title: "Unique Customers",
        value: formatNumber(unique_customers || 0),
        change: getPercentageChange(unique_customers, previous_period?.unique_customers),
        icon: Users,
        color: "text-royal-blue"
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(avg_order_value || 0),
        change: getPercentageChange(avg_order_value, previous_period?.avg_order_value),
        icon: Package,
        color: "text-green-600"
      },
      {
        title: "New Customers",
        value: formatNumber(new_customers || 0),
        change: getPercentageChange(new_customers, previous_period?.new_customers),
        icon: Users,
        color: "text-orange-600"
      },
      {
        title: "Returning Customers",
        value: formatNumber(returning_customers || 0),
        subtitle: repeat_rate ? `${formatPercentage(repeat_rate)} repeat rate` : null,
        icon: RefreshCw,
        color: "text-purple-600"
      },
      {
        title: "Email Performance",
        value: reportData.brand?.total_campaigns ?
          `${reportData.brand.total_campaigns} campaigns` : "0 campaigns",
        subtitle: reportData.brand?.active_flows ?
          `${reportData.brand.active_flows} active flows` : null,
        icon: Mail,
        color: "text-blue-600"
      }
    ];
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader
          size="large"
          showText={true}
          text="Loading revenue report..."
        />
      </div>
    );
  }

  const metricCards = getMetricCardData();

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-gray dark:text-white">
            Revenue Report
          </h2>
          <p className="text-sm text-slate-gray dark:text-gray-400">
            Deep-dive analytics for {currentStore?.name || 'store'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Single Store Selector */}
          <Select
            value={storePublicId || ''}
            onValueChange={handleStoreChange}
            disabled={isLoadingStores || !stores || stores.length === 0}
          >
            <SelectTrigger className="w-[200px]">
              <Store className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select a store">
                {currentStore?.name || 'Select store'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stores && stores.map(store => (
                <SelectItem key={store.public_id} value={store.public_id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      store.klaviyo_integration?.public_id ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {store.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Selector */}
          <DateRangeSelector
            onDateRangeChange={handleDateRangeChange}
            storageKey="revenueReportDateRange"
            showComparison={true}
            initialDateRange={dateRangeSelection}
          />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hover:bg-sky-tint/50 transition-all"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Error loading revenue data: {error}
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        {/* Metrics Grid - matching SimpleDashboard style */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.change !== undefined && card.change !== 0 && (
                  <p className={`text-xs flex items-center ${
                    card.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change > 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(Math.abs(card.change))} from last period
                  </p>
                )}
                {card.subtitle && (
                  <p className="text-xs text-slate-gray dark:text-gray-400 mt-1">
                    {card.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Attribution Breakdown */}
        {reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Attribution Breakdown</CardTitle>
              <CardDescription>
                Channel performance for {reportData.brand?.name || currentStore?.name || 'this store'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-sky-blue" />
                      <span className="text-sm">Email Campaigns</span>
                    </div>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-blue to-vivid-violet"
                      style={{ width: '42%' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-vivid-violet" />
                      <span className="text-sm">Automated Flows</span>
                    </div>
                    <span className="text-sm font-medium">38%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-vivid-violet to-deep-purple"
                      style={{ width: '38%' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-deep-purple" />
                      <span className="text-sm">SMS & Other</span>
                    </div>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-deep-purple to-royal-blue"
                      style={{ width: '20%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Brand Info */}
              {reportData?.brand && (
                <div className="mt-6 pt-6 border-t flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-gray dark:text-gray-400">Active Segments</p>
                    <p className="text-lg font-semibold">{reportData.brand.segments || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-gray dark:text-gray-400">Total Campaigns</p>
                    <p className="text-lg font-semibold">{reportData.brand.total_campaigns || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-gray dark:text-gray-400">Active Flows</p>
                    <p className="text-lg font-semibold">{reportData.brand.active_flows || 0}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, ChevronDown } from "lucide-react";
import MorphingLoader from '@/app/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

// Import tab components
import OverviewTab from "@/app/components/revenue-report/overview-tab";
import TotalSalesTab from "@/app/components/revenue-report/total-sales-tab";
import LtvTab from "@/app/components/revenue-report/ltv-tab";
import ApvTab from "@/app/components/revenue-report/apv-tab";
import RepeatCustomersTab from "@/app/components/revenue-report/repeat-customers-tab";
import SampleTab from "@/app/components/revenue-report/sample-tab";
import Sample2Tab from "@/app/components/revenue-report/sample-2-tab";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/app/components/ui/select";

export default function StoreRevenueReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Get storePublicId directly from params - no need for state or async
  const storePublicId = params.storePublicId;

  // Get the current tab from URL or default to 'overview'
  const currentTab = searchParams.get('tab') || 'overview';

  // Function to handle tab changes
  const handleTabChange = (value) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value === 'overview') {
      newParams.delete('tab'); // Remove tab param for overview (default)
    } else {
      newParams.set('tab', value);
    }
    const queryString = newParams.toString();
    router.push(`/store/${storePublicId}/report/revenue${queryString ? `?${queryString}` : ''}`);
  };

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
    } catch (error) {
      console.error('Error loading saved date range:', error);
    }
  }, []);

  const handleDateRangeChange = (newDateRange) => {
    setDateRangeSelection(newDateRange);
    // Save to localStorage
    localStorage.setItem('revenueReportDateRange', JSON.stringify(newDateRange));
  };

  const currentStore = useMemo(() => {
    return stores?.find(s => s.public_id === storePublicId);
  }, [stores, storePublicId]);

  const handleStoreChange = (newStoreId) => {
    router.push(`/store/${newStoreId}/report/revenue`);
  };

  // Fetch revenue report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate days from date range
      const days = dateRangeSelection.ranges?.main ?
        Math.ceil((dateRangeSelection.ranges.main.end - dateRangeSelection.ranges.main.start) / (1000 * 60 * 60 * 24)) :
        90;

      // Try optimized ClickHouse API first (uses aggregated tables)
      let response = await fetch(
        `/api/analytics/revenue-report-clickhouse-optimized?days=${days}&storeId=${storePublicId}`,
        { credentials: 'include' }
      );

      // Fallback to standard ClickHouse API if optimized fails
      if (!response.ok) {
        console.log('Optimized API failed, trying standard ClickHouse...');
        response = await fetch(
          `/api/analytics/revenue-report-clickhouse?days=${days}&storeId=${storePublicId}`,
          { credentials: 'include' }
        );
      }

      // Final fallback to MongoDB if ClickHouse fails
      if (!response.ok) {
        console.log('ClickHouse failed, falling back to MongoDB...');
        response = await fetch(
          `/api/analytics/revenue-report?days=${days}&storeId=${storePublicId}`,
          { credentials: 'include' }
        );
      }

      if (!response.ok) {
        throw new Error('Failed to fetch revenue report from any source');
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

  // Fetch data when dependencies change
  useEffect(() => {
    if (!isLoadingStores && storePublicId && stores?.length > 0) {
      fetchReportData();
    }
  }, [storePublicId, dateRangeSelection, stores, isLoadingStores]);

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

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Revenue Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Deep-dive analytics for {currentStore?.name || 'store'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Store Selector - matching DateRangeSelector style */}
          <Select
            value={storePublicId || ''}
            onValueChange={handleStoreChange}
            disabled={isLoadingStores || !stores || stores.length === 0}
          >
            <SelectTrigger className="h-9 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-[200px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-gray-500" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {currentStore?.name || 'Select store'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </SelectTrigger>
            <SelectContent align="end" className="w-[250px]">
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

      {/* Main Content with Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full max-w-[800px] grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="total-sales">Total Sales</TabsTrigger>
          <TabsTrigger value="ltv">LTV</TabsTrigger>
          <TabsTrigger value="apv">APV</TabsTrigger>
          <TabsTrigger value="repeat">Repeat Customers</TabsTrigger>
          <TabsTrigger value="sample">Sample</TabsTrigger>
          <TabsTrigger value="sample-2">Sample 2</TabsTrigger>
        </TabsList>

        {/* Tab Contents using imported components */}
        <TabsContent value="overview">
          <OverviewTab reportData={reportData} currentStore={currentStore} />
        </TabsContent>

        <TabsContent value="total-sales">
          <TotalSalesTab reportData={reportData} />
        </TabsContent>

        <TabsContent value="ltv">
          <LtvTab reportData={reportData} />
        </TabsContent>

        <TabsContent value="apv">
          <ApvTab reportData={reportData} />
        </TabsContent>

        <TabsContent value="repeat">
          <RepeatCustomersTab reportData={reportData} />
        </TabsContent>

        <TabsContent value="sample">
          <SampleTab reportData={reportData} />
        </TabsContent>

        <TabsContent value="sample-2">
          <Sample2Tab reportData={reportData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
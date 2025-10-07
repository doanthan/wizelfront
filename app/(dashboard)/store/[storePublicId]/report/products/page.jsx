"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, Info, TrendingUp, Users, DollarSign } from "lucide-react";
import MorphingLoader from '@/app/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

// Import tab components
import PerformanceTab from './components/PerformanceTab';
import BehaviorTab from './components/BehaviorTab';
import FinancialTab from './components/FinancialTab';

// API Service Functions
const fetchProductAnalytics = async (storeId, startDate, endDate, comparisonStart = null, comparisonEnd = null) => {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    _t: Date.now()
  });

  // Add comparison dates if provided
  if (comparisonStart && comparisonEnd) {
    params.append('comparison_start', comparisonStart);
    params.append('comparison_end', comparisonEnd);
  }

  const response = await fetch(`/api/store/${storeId}/products/analytics?${params}`, {
    cache: 'no-store'
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error('📊 Analytics API: Failed to parse JSON response', e);
    throw new Error('Invalid JSON response from analytics API');
  }

  if (!response.ok) {
    console.error('📊 Analytics API error:', { status: response.status, data });
    throw new Error(data.error || `Failed to fetch analytics (${response.status})`);
  }
  return data;
};

const fetchProductBehavior = async (storeId) => {
  const response = await fetch(`/api/store/${storeId}/products/behavior`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch behavior');
  }
  return data;
};

const fetchProductFinancial = async (storeId, startDate, endDate) => {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    _t: Date.now()
  });
  const response = await fetch(`/api/store/${storeId}/products/financial?${params}`, {
    cache: 'no-store'
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error('💸 Financial API: Failed to parse JSON response', e);
    throw new Error('Invalid JSON response from financial API');
  }

  if (!response.ok) {
    console.error('💸 Financial API error:', { status: response.status, data });
    throw new Error(data.error || `Failed to fetch financial (${response.status})`);
  }
  return data;
};

export default function ProductsReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storePublicId, setStorePublicId] = useState(null);

  // Get active tab from URL or default to 'performance'
  const activeTab = searchParams.get('tab') || 'performance';

  // Consolidated state from 3 API endpoints
  const [analyticsData, setAnalyticsData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [financialData, setFinancialData] = useState(null);

  // Get storePublicId from params
  useEffect(() => {
    async function getStoreId() {
      const resolvedParams = await params;
      setStorePublicId(resolvedParams.storePublicId);
    }
    getStoreId();
  }, [params]);

  // Calculate default dates (last 30 days)
  const getDefaultDateRange = () => {
    const now = new Date();
    const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const past60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    return {
      period: "last30",
      comparisonType: "previous-period",
      ranges: {
        main: {
          start: past30Days,
          end: now,
          label: "Past 30 days"
        },
        comparison: {
          start: past60Days,
          end: past30Days,
          label: "Previous 30 days"
        }
      }
    };
  };

  const [dateRangeSelection, setDateRangeSelection] = useState(getDefaultDateRange());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current store
  const currentStore = useMemo(() => {
    if (!stores || !storePublicId) return null;
    return stores.find(s => s.public_id === storePublicId);
  }, [stores, storePublicId]);

  // Handle date range changes
  const handleDateRangeChange = (newDateRangeSelection) => {
    setDateRangeSelection(newDateRangeSelection);
  };

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      router.push(`/store/${newStoreId}/report/products`);
    }
  };

  // Create stable date strings to prevent infinite loops
  const dateKey = useMemo(() => {
    if (!dateRangeSelection?.ranges?.main) return '';
    return `${dateRangeSelection.ranges.main.start.toISOString()}_${dateRangeSelection.ranges.main.end.toISOString()}`;
  }, [dateRangeSelection?.ranges?.main?.start, dateRangeSelection?.ranges?.main?.end]);

  // Load data when store or dates change
  useEffect(() => {
    if (!storePublicId || !dateRangeSelection?.ranges?.main) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const startDate = dateRangeSelection.ranges.main.start.toISOString();
        const endDate = dateRangeSelection.ranges.main.end.toISOString();

        // Get comparison dates if available
        const comparisonStart = dateRangeSelection.ranges.comparison?.start?.toISOString();
        const comparisonEnd = dateRangeSelection.ranges.comparison?.end?.toISOString();

        // Only 3 API calls instead of 10!
        const [analytics, behavior, financial] = await Promise.all([
          fetchProductAnalytics(storePublicId, startDate, endDate, comparisonStart, comparisonEnd).catch(err => ({ error: err.message })),
          fetchProductBehavior(storePublicId).catch(err => ({ error: err.message })),
          fetchProductFinancial(storePublicId, startDate, endDate).catch(err => ({ error: err.message }))
        ]);

        setAnalyticsData(analytics);
        setBehaviorData(behavior);
        setFinancialData(financial);
      } catch (error) {
        console.error('Error loading product reports:', error);
        setAnalyticsData({ error: error.message });
        setBehaviorData({ error: error.message });
        setFinancialData({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storePublicId, dateKey]);

  const tabs = [
    {
      id: 'performance',
      label: 'Performance & Analytics',
      icon: TrendingUp,
    },
    {
      id: 'behavior',
      label: 'Customer Behavior',
      icon: Users,
    },
    {
      id: 'financial',
      label: 'Financial Insights',
      icon: DollarSign,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader size="large" showText={true} text="Loading product analytics..." />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Product Analytics</h2>
          <p className="text-gray-900 dark:text-gray-400">Comprehensive product performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={storePublicId || ""} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-[240px] h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Store className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {stores?.map((store) => (
                <SelectItem key={store.public_id} value={store.public_id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeSelector
            value={dateRangeSelection}
            onDateRangeChange={handleDateRangeChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', tab.id);
                  router.push(url.pathname + url.search);
                }}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-sky-blue text-sky-blue'
                    : 'text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'performance' && <PerformanceTab data={analyticsData} dateRange={dateRangeSelection} />}
        {activeTab === 'behavior' && <BehaviorTab data={behaviorData} />}
        {activeTab === 'financial' && <FinancialTab data={financialData} />}
      </div>

      {/* Footer with insights */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Key Insights
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Use these reports to identify top-performing products, optimize pricing and promotions,
          improve cross-sell strategies, and detect quality issues before they impact brand reputation.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon, Store, Users, RefreshCw, Target, TrendingUp } from "lucide-react";
import MorphingLoader from '@/app/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

// Import tab components
import MergedRFMSegments from './components/MergedRFMSegments';
import ReorderBehaviorChart from './components/ReorderBehaviorChart';

export default function CustomersReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { stores, isLoadingStores, selectStore } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [storePublicId, setStorePublicId] = useState(null);

  // Get active tab from URL query parameter, default to 'segments'
  const tabFromUrl = searchParams.get('page') || 'segments';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Consolidated state
  const [segmentData, setSegmentData] = useState(null);
  const [reorderData, setReorderData] = useState(null);
  const [adaptiveRFMData, setAdaptiveRFMData] = useState(null);
  const [error, setError] = useState(null);

  // Get storePublicId from params
  useEffect(() => {
    async function getStoreId() {
      const resolvedParams = await params;
      setStorePublicId(resolvedParams.storePublicId);
    }
    getStoreId();
  }, [params]);

  // Sync active tab with URL parameter
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam && pageParam !== activeTab) {
      setActiveTab(pageParam);
    }
  }, [searchParams]);

  // Get current store
  const currentStore = useMemo(() => {
    if (!stores || !storePublicId) return null;
    return stores.find(s => s.public_id === storePublicId);
  }, [stores, storePublicId]);

  // Handle store selection change
  const handleStoreChange = (newStoreId) => {
    if (newStoreId && newStoreId !== storePublicId) {
      // Update the store context to synchronize with sidebar
      selectStore(newStoreId);
      // Preserve the current page parameter when changing stores
      const currentPage = searchParams.get('page');
      const url = currentPage
        ? `/store/${newStoreId}/report/customers?page=${currentPage}`
        : `/store/${newStoreId}/report/customers`;
      router.push(url);
    }
  };

  // Handle tab change with URL update
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Update URL with page parameter
    const url = `/store/${storePublicId}/report/customers?page=${tabId}`;
    router.push(url, { scroll: false }); // scroll: false prevents page jump
  };

  // Handle RFM recalculation
  const handleRecalculate = async () => {
    if (!storePublicId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Calculating Adaptive RFM for store:', storePublicId);

      // Call Next.js API which calls Python backend
      const response = await fetch(`/api/store/${storePublicId}/customers/calculate-rfm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to calculate Adaptive RFM');
      }

      console.log('Adaptive RFM calculation result:', result);

      // Reload the adaptive RFM data
      const dataResponse = await fetch(`/api/store/${storePublicId}/customers/adaptive-rfm`);
      const data = await dataResponse.json();
      setAdaptiveRFMData(data);

      // Show success message (you can add a toast notification here)
      console.log('✅ Adaptive RFM calculated successfully!');

    } catch (error) {
      console.error('Error calculating RFM:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data when store changes
  useEffect(() => {
    if (!storePublicId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Loading customer data for store:', storePublicId);

        // Load all datasets in parallel
        const [segments, reorder, adaptiveRFM] = await Promise.all([
          fetch(`/api/store/${storePublicId}/customers/segments`)
            .then(res => res.json())
            .catch(err => {
              console.error('Segments API error:', err);
              return { error: err.message };
            }),
          fetch(`/api/store/${storePublicId}/customers/reorder-behavior`)
            .then(res => res.json())
            .catch(err => {
              console.error('Reorder API error:', err);
              return { error: err.message };
            }),
          fetch(`/api/store/${storePublicId}/customers/adaptive-rfm`)
            .then(res => res.json())
            .catch(err => {
              console.error('Adaptive RFM API error:', err);
              return { error: err.message };
            })
        ]);

        console.log('Segments response:', segments);
        console.log('Reorder response:', reorder);
        console.log('Adaptive RFM response:', adaptiveRFM);

        setSegmentData(segments.success ? segments.segments : null);
        setReorderData(reorder.status === 'success' ? reorder : null);
        // Always set adaptive RFM data, even if it needs calculation
        setAdaptiveRFMData(adaptiveRFM);
      } catch (error) {
        console.error('Error loading customer reports:', error);
        setError(error.message);
        setSegmentData(null);
        setReorderData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storePublicId]);

  const tabs = [
    {
      id: 'segments',
      label: 'RFM Segments',
      icon: Users,
    },
    {
      id: 'reorder',
      label: 'Reorder Behavior',
      icon: RefreshCw,
    },
  ];

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Customer Analytics</h3>
          <p className="text-gray-900 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Customer Analytics</h2>
          <p className="text-gray-900 dark:text-gray-400">RFM segmentation and customer behavior insights</p>
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
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
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
        {activeTab === 'segments' && (
          <MergedRFMSegments
            segmentData={segmentData}
            adaptiveData={adaptiveRFMData}
            loading={loading}
          />
        )}
        {activeTab === 'reorder' && <ReorderBehaviorChart data={reorderData} loading={loading} />}
      </div>

      {/* Footer with insights */}
      <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          {activeTab === 'segments' ? (
            <>
              <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>About RFM Segmentation</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>About Reorder Behavior</span>
            </>
          )}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {activeTab === 'segments' ? (
            <>
              RFM (Recency, Frequency, Monetary) segmentation uses adaptive thresholds that automatically detect your business model
              and calculate optimal customer segmentation criteria. The system adapts recency zones based on your actual customer
              purchase cycles and uses absolute thresholds (e.g., "3+ orders") with auto-validation and explainability.
            </>
          ) : (
            <>
              Reorder behavior analysis shows typical purchase cycles and helps you time win-back campaigns perfectly.
              Identify overdue customers who are past their expected reorder window.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

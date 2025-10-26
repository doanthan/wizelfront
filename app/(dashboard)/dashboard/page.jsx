"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useStores } from "@/app/contexts/store-context";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon } from "lucide-react";
import MorphingLoader from "@/app/components/ui/loading";

// Import dashboard components
import SimpleDashboard from "./components/SimpleDashboard";
import RecentCampaigns from "./components/RecentCampaigns";
import UpcomingCampaigns from "./components/UpcomingCampaigns";
import GetStarted from "./components/GetStarted";
import { useAI } from "@/app/contexts/ai-context";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const { updateAIState } = useAI();
  const [mounted, setMounted] = useState(false);

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
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [allKnownAccounts, setAllKnownAccounts] = useState({});

  // NEW: State for campaigns data to pass to SimpleDashboard
  const [recentCampaignsData, setRecentCampaignsData] = useState([]);
  const [upcomingCampaignsData, setUpcomingCampaignsData] = useState([]);

  // Redirect to homepage if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // DEBUG: Track store changes in dashboard
  useEffect(() => {
    console.log('🎯 Dashboard: Component mounted, stores:', {
      stores_length: stores?.length || 'undefined',
      stores_type: Array.isArray(stores) ? 'array' : typeof stores,
      isLoadingStores,
      stores_sample: stores?.slice(0, 2)?.map(s => ({
        name: s.name,
        public_id: s.public_id,
        klaviyo_integration: !!s.klaviyo_integration
      })) || 'none'
    });
  }, [stores, isLoadingStores]);

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('analyticsDateRange');
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
      // If no saved date range, the default from getDefaultDateRange() will be used
    } catch (e) {
      console.warn('Failed to load analytics date range from localStorage:', e);
    }
  }, []);

  // Load selected accounts from localStorage after mount
  useEffect(() => {
    const savedAccounts = localStorage.getItem('analyticsSelectedAccounts');
    console.log('Loading analytics accounts from localStorage:', savedAccounts);
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove duplicates based on value property
          const uniqueAccounts = parsed.filter((account, index, self) =>
            index === self.findIndex(a => a.value === account.value)
          );
          console.log('Parsed accounts:', parsed.length, 'Unique accounts:', uniqueAccounts.length);

          // Filter out 'all' option
          const validAccounts = uniqueAccounts.filter(a => a.value !== 'all');
          setSelectedAccounts(validAccounts);
        }
      } catch (e) {
        console.error('Error parsing saved accounts:', e);
        localStorage.removeItem('analyticsSelectedAccounts');
      }
    }
  }, []);

  // Load known accounts from localStorage after mount
  useEffect(() => {
    const savedKnown = localStorage.getItem('analyticsKnownAccounts');
    if (savedKnown) {
      try {
        setAllKnownAccounts(JSON.parse(savedKnown));
      } catch (e) {
        console.error('Error parsing known accounts:', e);
      }
    }
  }, []);
  
  // Compute available accounts reactively from stores
  const availableAccounts = useMemo(() => {
    if (!stores || stores.length === 0) {
      return [];
    }

    // Build accounts from stores - each store is an account
    const accounts = [];
    const tagsSet = new Set();

    stores.forEach(store => {
      // Add store as an account using store's public_id
      const hasKlaviyo = store.klaviyo_integration?.public_id;
      accounts.push({
        value: store.public_id || store._id,
        label: `${store.name}${hasKlaviyo ? '' : ' (No Klaviyo)'}`,
        klaviyo: store.klaviyo_integration?.public_id,
        storeTags: store.storeTags || [],
        hasKlaviyo: !!hasKlaviyo
      });

      // Collect all unique tags
      if (store.storeTags && Array.isArray(store.storeTags)) {
        store.storeTags.forEach(tag => tagsSet.add(tag));
      }
    });

    // Add tag groupings at the beginning
    const tagAccounts = Array.from(tagsSet).map(tag => ({
      value: `tag:${tag}`,
      label: `${tag} (Tag)`,
      isTag: true
    }));

    const currentAccounts = [...tagAccounts, ...accounts];

    // Update known accounts with any new ones
    const newKnownAccounts = { ...allKnownAccounts };
    let hasNewAccounts = false;
    currentAccounts.forEach(account => {
      if (!newKnownAccounts[account.value]) {
        newKnownAccounts[account.value] = account;
        hasNewAccounts = true;
      }
    });

    if (hasNewAccounts) {
      setAllKnownAccounts(newKnownAccounts);
      if (typeof window !== 'undefined') {
        localStorage.setItem('analyticsKnownAccounts', JSON.stringify(newKnownAccounts));
      }
    }

    return currentAccounts;
  }, [stores, allKnownAccounts]);

  // Validate selected accounts when available accounts change
  useEffect(() => {
    // Only run validation after stores have loaded
    if (!stores || isLoadingStores) {
      return;
    }

    if (availableAccounts.length === 0 && stores.length === 0) {
      return;
    }

    // Validate current selections against available accounts
    const validAccountValues = new Set(availableAccounts.map(a => a.value));

    setSelectedAccounts(prev => {
      const invalidSelections = prev.filter(sa => !validAccountValues.has(sa.value));
      if (invalidSelections.length > 0) {
        console.log('Found invalid account selections:', invalidSelections);
        // Filter out invalid selections
        const validSelections = prev.filter(sa => validAccountValues.has(sa.value));
        localStorage.setItem('analyticsSelectedAccounts', JSON.stringify(validSelections));
        return validSelections;
      }
      return prev;
    });
  }, [availableAccounts, stores, isLoadingStores]);

  // Update AI context when key data changes
  useEffect(() => {
    if (isLoadingStores || !stores || stores.length === 0) return;

    // Map selected accounts to include store data
    const selectedStoresData = selectedAccounts
      .map(acc => {
        const store = stores.find(s => s.public_id === acc.value);
        if (!store) return null;
        return {
          value: store.public_id,
          label: store.name,
          klaviyo_id: store.klaviyo_integration?.public_id
        };
      })
      .filter(Boolean);

    updateAIState({
      currentPage: '/dashboard',
      pageTitle: 'Dashboard',
      pageType: 'dashboard',
      selectedStores: selectedStoresData,
      selectedKlaviyoIds: selectedStoresData
        .map(s => s.klaviyo_id)
        .filter(Boolean),
      dateRange: {
        start: dateRangeSelection.ranges?.main?.start || null,
        end: dateRangeSelection.ranges?.main?.end || null,
        preset: dateRangeSelection.period || 'last90',
        comparison: dateRangeSelection.ranges?.comparison || null
      }
    });

    // Clean up on unmount
    return () => updateAIState({ currentPage: null, selectedStores: [], dateRange: {} });
  }, [selectedAccounts, dateRangeSelection, stores, isLoadingStores, updateAIState]);

  // Handle date range changes from the date selector
  const handleDateRangeChange = (newDateRangeSelection) => {
    console.log('📅 Dashboard: Date range changed', {
      old: dateRangeSelection,
      new: newDateRangeSelection,
      timestamp: new Date().toISOString(),
      actualDates: {
        start: newDateRangeSelection?.ranges?.main?.start,
        end: newDateRangeSelection?.ranges?.main?.end
      }
    });

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
        localStorage.setItem('analyticsDateRange', JSON.stringify(dateRangeToSave));
      } catch (e) {
        console.warn('Failed to save analytics date range to localStorage:', e);
      }
    }
  };

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingLoader size="large" showText={true} text="Loading dashboard..." />
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  // Show Get Started page if no stores
  if (!isLoadingStores && (!stores || stores.length === 0)) {
    return <GetStarted />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-gray dark:text-white">Dashboard</h2>
          <p className="text-sm text-slate-gray dark:text-gray-400">Cross-account analytics and performance insights</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <DateRangeSelector
            onDateRangeChange={handleDateRangeChange}
            storageKey="analyticsDateRange"
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

      {/* Main Dashboard Content */}
      <div className="space-y-4">
        <SimpleDashboard
          selectedAccounts={selectedAccounts}
          dateRangeSelection={dateRangeSelection}
          stores={stores}
          recentCampaignsData={recentCampaignsData}
          upcomingCampaignsData={upcomingCampaignsData}
        />

        {/* Campaigns Section - Recent and Upcoming side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentCampaigns
            stores={stores}
            onCampaignsLoad={setRecentCampaignsData}
          />
          <UpcomingCampaigns
            stores={stores}
            onCampaignsLoad={setUpcomingCampaignsData}
          />
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useMemo } from "react";
import { useStores } from "@/app/contexts/store-context";
import { AccountSelector } from "@/app/components/ui/account-selector";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon } from "lucide-react";

// Import dashboard component
import SimpleDashboard from "./components/SimpleDashboard";

export default function DashboardPage() {
  const { stores, isLoadingStores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
  
  // Account selection state
  const [selectedAccounts, setSelectedAccounts] = useState([{ value: 'all', label: 'View All' }]);
  
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
          setSelectedAccounts(uniqueAccounts);
        }
      } catch (e) {
        console.error('Error parsing saved accounts:', e);
      }
    }
  }, []);
  
  // Keep track of all accounts ever seen (for smart persistence)
  const [allKnownAccounts, setAllKnownAccounts] = useState({});
  
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
  
  
  // Handle date range changes from the date selector
  const handleDateRangeChange = (newDateRangeSelection) => {
    console.log('Dashboard: Date range changed', newDateRangeSelection);
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
  
  return (
    <div className="flex-1 space-y-4 p-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-gray dark:text-white">Dashboard</h2>
          <p className="text-sm text-neutral-gray dark:text-gray-400">Cross-account analytics and performance insights</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Account Selector */}
          <div className="w-40">
            <AccountSelector
              accounts={availableAccounts}
              value={selectedAccounts}
              onChange={(newValue) => {
                console.log('Dashboard account selection changed:', newValue);
                // Remove duplicates before saving
                const uniqueValue = newValue.filter((account, index, self) =>
                  index === self.findIndex(a => a.value === account.value)
                );
                // Update state
                setSelectedAccounts(uniqueValue);
                // Save to localStorage with analytics-specific key
                localStorage.setItem('analyticsSelectedAccounts', JSON.stringify(uniqueValue));
              }}
            />
          </div>

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
        />
      </div>
    </div>
  );
}
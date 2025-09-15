"use client";

import { useState, useEffect, useMemo } from "react";
import { useStores } from "@/app/contexts/store-context";
import { AccountSelector } from "@/app/components/ui/account-selector";
import { DateRangeSelector } from "@/app/components/ui/date-range-selector";
import { useTheme } from "@/app/contexts/theme-context";
import { Button } from "@/app/components/ui/button";
import { Sun, Moon } from "lucide-react";

// Import tab components
import RevenueTab from "./components/RevenueTab";

export default function DashboardPage() {
  const { stores } = useStores();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [dateRangeSelection, setDateRangeSelection] = useState({
    period: "last90",
    comparisonType: "previous-period",
    ranges: {
      main: {
        start: new Date('2025-06-11T00:00:00.000Z'),
        end: new Date('2025-09-09T00:00:00.000Z'),
        label: "Past 90 days"
      },
      comparison: {
        start: new Date('2025-03-14T00:00:00.000Z'),
        end: new Date('2025-06-11T00:00:00.000Z'),
        label: "Previous Period"
      }
    }
  });
  
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
      } else {
        // Set dynamic dates after mount
        const now = new Date();
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const last180Days = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        
        setDateRangeSelection({
          period: "last90",
          comparisonType: "previous-period",
          ranges: {
            main: {
              start: last90Days,
              end: now,
              label: "Past 90 days"
            },
            comparison: {
              start: last180Days,
              end: last90Days,
              label: "Previous Period"
            }
          }
        });
      }
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
          setSelectedAccounts(parsed);
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
    
    // Build current accounts from stores
    const accountsMap = new Map();
    stores
      .filter(store => store.klaviyo_integration?.public_id || store.klaviyo_integration?.public_key)
      .forEach(store => {
        // Prioritize public_id over public_key (public_id is the correct field)
        const value = store.klaviyo_integration?.public_id || store.klaviyo_integration?.public_key;
        const label = store.klaviyo_integration?.account?.data?.[0]?.attributes?.contact_information?.organization_name || 
                    store.klaviyo_integration?.account_name || 
                    store.name;
        if (!accountsMap.has(value)) {
          accountsMap.set(value, {
            value,
            label,
            klaviyo: store.klaviyo_integration?.account?.data?.[0]?.attributes?.contact_information?.organization_name || 
                    store.klaviyo_integration?.account_name
          });
        }
      });
    
    const currentAccounts = Array.from(accountsMap.values());
    
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Cross-account analytics and performance insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Account Selector */}
          <AccountSelector
            accounts={availableAccounts}
            value={selectedAccounts}
            onChange={(newValue) => {
              console.log('Dashboard account selection changed:', newValue);
              // Update state
              setSelectedAccounts(newValue);
              // Save to localStorage with analytics-specific key
              localStorage.setItem('analyticsSelectedAccounts', JSON.stringify(newValue));
            }}
          />
          
          {/* Date Range Selector */}
          <DateRangeSelector 
            onDateRangeChange={handleDateRangeChange}
            storageKey="analyticsDateRange"
            showComparison={true}
            initialDateRange={dateRangeSelection}
          />
          
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2 border-neutral-gray/30 hover:border-sky-blue hover:bg-sky-tint/50 transition-all"
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
            <span className="hidden sm:inline">
              {mounted && theme === "dark" ? "Light" : "Dark"} Mode
            </span>
          </Button>
        </div>
      </div>
      
      {/* Main Charts - Only Revenue Tab */}
      <div className="space-y-4">
        <RevenueTab 
          selectedAccounts={selectedAccounts}
          dateRangeSelection={dateRangeSelection}
          stores={stores}
        />
      </div>
    </div>
  );
}
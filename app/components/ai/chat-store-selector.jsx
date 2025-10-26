"use client";

import { useState, useEffect, useRef } from 'react';
import { useStores } from '@/app/contexts/store-context';
import { Check, ChevronDown, Store, Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChatStoreSelector - Store selection component for AI chat
 * SINGLE-SELECT: User can choose "All Stores" or ONE specific store for AI context
 * Uses the same store data as the bottom-left sidebar selector
 * NOTE: This selector is INDEPENDENT of the bottom-left sidebar store selector
 * - Chat selector: Controls which store's data the AI can access
 * - Sidebar selector: Controls which store page you're viewing
 */
export default function ChatStoreSelector({ value, onChange, className }) {
  const { stores, isLoadingStores } = useStores();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Get selected store ID (null/undefined for "all")
  const selectedStoreId = value || null;
  const isAllStoresSelected = !selectedStoreId;

  // Calculate display text
  const getDisplayText = () => {
    if (isAllStoresSelected) {
      return 'All Stores';
    }

    const store = stores.find(s => s.public_id === selectedStoreId);
    return store?.name || 'Unknown Store';
  };

  // Select a specific store
  const selectStore = (storePublicId) => {
    onChange(storePublicId);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Select all stores
  const selectAll = () => {
    onChange(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter stores based on search query
  const filteredStores = stores.filter(store => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      store.name?.toLowerCase().includes(query) ||
      store.public_id?.toLowerCase().includes(query)
    );
  });

  // Get store display info
  const getStoreInfo = (store) => {
    const hasKlaviyo = !!store.klaviyo_integration?.public_id;
    return {
      name: store.name,
      publicId: store.public_id,
      klaviyoPublicId: store.klaviyo_integration?.public_id,
      hasKlaviyo,
      icon: store.parent_store_id ? Store : Building2
    };
  };

  if (isLoadingStores) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        className
      )}>
        <Store className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading stores...</span>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        className
      )}>
        <Store className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">No stores available</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isAllStoresSelected ? (
            <Building2 className="h-4 w-4 text-sky-blue flex-shrink-0" />
          ) : (
            <Store className="h-4 w-4 text-vivid-violet flex-shrink-0" />
          )}
          <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 flex-shrink-0 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Menu - Opens UPWARD */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-80 flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-blue/50"
              />
            </div>
          </div>

          {/* Store List - Scrollable */}
          <div className="overflow-y-auto flex-1">
            {/* All Stores Option */}
            <button
              onClick={selectAll}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-b border-gray-200 dark:border-gray-700",
                isAllStoresSelected && "bg-sky-50 dark:bg-sky-900/20"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Building2 className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isAllStoresSelected ? "text-sky-blue" : "text-gray-400"
                )} />
                <span className={cn(
                  "truncate",
                  isAllStoresSelected
                    ? "text-sky-blue font-medium"
                    : "text-gray-900 dark:text-gray-100"
                )}>
                  All Stores
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  ({stores.length})
                </span>
              </div>
              {isAllStoresSelected && (
                <Check className="h-4 w-4 text-sky-blue flex-shrink-0" />
              )}
            </button>

            {/* Individual Store Options */}
            {filteredStores.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                No stores found
              </div>
            ) : (
              filteredStores.map((store) => {
            const storeInfo = getStoreInfo(store);
            const isSelected = selectedStoreId === storeInfo.publicId;
            const StoreIcon = storeInfo.icon;

            return (
              <button
                key={storeInfo.publicId}
                onClick={() => selectStore(storeInfo.publicId)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors",
                  isSelected && "bg-purple-50 dark:bg-purple-900/20"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <StoreIcon className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isSelected ? "text-vivid-violet" : "text-gray-400"
                  )} />
                  <span className={cn(
                    "truncate",
                    isSelected
                      ? "text-vivid-violet font-medium"
                      : "text-gray-900 dark:text-gray-100"
                  )}>
                    {storeInfo.name}
                  </span>
                  {!storeInfo.hasKlaviyo && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex-shrink-0">
                      (No Klaviyo)
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-vivid-violet flex-shrink-0" />
                )}
              </button>
            );
          })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { Filter, Check, X, Store, Tag, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";

const FILTER_CATEGORIES = {
  stores: {
    label: "Stores",
    icon: Store,
    options: [
      { value: "store-1", label: "Fashion Boutique" },
      { value: "store-2", label: "Tech Haven" },
      { value: "store-3", label: "Home Essentials" },
      { value: "store-4", label: "Beauty Corner" },
      { value: "store-5", label: "Sports Zone" },
    ]
  },
  performance: {
    label: "Performance",
    icon: TrendingUp,
    options: [
      { value: "high-revenue", label: "High Revenue (>$10k)" },
      { value: "medium-revenue", label: "Medium Revenue ($1k-$10k)" },
      { value: "low-revenue", label: "Low Revenue (<$1k)" },
      { value: "growing", label: "Growing (>20% increase)" },
      { value: "declining", label: "Declining (>20% decrease)" },
    ]
  },
  categories: {
    label: "Categories",
    icon: Tag,
    options: [
      { value: "email", label: "Email Campaigns" },
      { value: "sms", label: "SMS Campaigns" },
      { value: "flows", label: "Automated Flows" },
      { value: "segments", label: "Customer Segments" },
      { value: "forms", label: "Sign-up Forms" },
    ]
  },
  timeframe: {
    label: "Timeframe",
    icon: Calendar,
    options: [
      { value: "today", label: "Today" },
      { value: "yesterday", label: "Yesterday" },
      { value: "this-week", label: "This Week" },
      { value: "last-week", label: "Last Week" },
      { value: "this-month", label: "This Month" },
      { value: "last-month", label: "Last Month" },
    ]
  }
};

export function FilterDropdown({ 
  onFilterChange,
  className 
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState({
    stores: [],
    performance: [],
    categories: [],
    timeframe: []
  });

  const totalActiveFilters = Object.values(selectedFilters).flat().length;

  const handleFilterToggle = (category, value) => {
    setSelectedFilters(prev => {
      const currentFilters = prev[category] || [];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(f => f !== value)
        : [...currentFilters, value];
      
      return {
        ...prev,
        [category]: newFilters
      };
    });
  };

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange(selectedFilters);
    }
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedFilters({
      stores: [],
      performance: [],
      categories: [],
      timeframe: []
    });
    if (onFilterChange) {
      onFilterChange({
        stores: [],
        performance: [],
        categories: [],
        timeframe: []
      });
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 border-neutral-gray/30 hover:border-sky-blue hover:bg-sky-tint/50 transition-all relative",
            totalActiveFilters > 0 && "border-sky-blue bg-sky-tint/20",
            className
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {totalActiveFilters > 0 && (
            <Badge 
              variant="default" 
              className="ml-1 h-5 px-1.5 text-xs bg-sky-blue text-white"
            >
              {totalActiveFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg" 
        align="end"
      >
        <div className="p-4 bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-auto p-1 text-xs hover:bg-sky-tint/50"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Filter Categories */}
          <div className="space-y-4">
            {Object.entries(FILTER_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              const activeCount = selectedFilters[key]?.length || 0;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <Label className="text-sm font-medium">
                      {category.label}
                    </Label>
                    {activeCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto h-5 px-1.5 text-xs"
                      >
                        {activeCount}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {category.options.map(option => (
                      <div 
                        key={option.value} 
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={option.value}
                          checked={selectedFilters[key]?.includes(option.value) || false}
                          onCheckedChange={() => handleFilterToggle(key, option.value)}
                          className="data-[state=checked]:bg-sky-blue data-[state=checked]:border-sky-blue"
                        />
                        <label
                          htmlFor={option.value}
                          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-sky-blue transition-colors"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* Selected Filters Summary */}
          {totalActiveFilters > 0 && (
            <>
              <div className="mb-3">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Active filters ({totalActiveFilters})
                </Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(selectedFilters).map(([category, filters]) =>
                    filters.map(filter => {
                      const categoryData = FILTER_CATEGORIES[category];
                      const option = categoryData.options.find(o => o.value === filter);
                      return (
                        <Badge
                          key={`${category}-${filter}`}
                          variant="secondary"
                          className="text-xs px-2 py-0.5 bg-sky-tint/50 hover:bg-sky-tint text-gray-700 dark:text-gray-300"
                        >
                          {option?.label}
                          <button
                            onClick={() => handleFilterToggle(category, filter)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              size="sm"
              className="flex-1 bg-sky-blue hover:bg-royal-blue text-white font-semibold transition-all"
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 border-neutral-gray/30 hover:bg-sky-tint/50 transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
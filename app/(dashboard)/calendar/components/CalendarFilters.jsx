"use client";

import { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp, X, Check, Store, Tag, Mail, MessageSquare, Bell } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { cn } from '@/lib/utils';
import { getStoreColor } from '@/lib/calendar-colors';

export const CalendarFilters = ({
  stores,
  selectedStores,
  setSelectedStores,
  selectedChannels,
  setSelectedChannels,
  selectedTags,
  setSelectedTags,
  selectedStatuses,
  setSelectedStatuses,
  availableTags,
  showStoreDropdown,
  setShowStoreDropdown,
  loadingStores
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Channel options
  const channelOptions = [
    { value: 'email', label: 'Email', color: 'text-blue-600' },
    { value: 'sms', label: 'SMS', color: 'text-green-600' },
    { value: 'push-notification', label: 'Push', color: 'text-purple-600' }
  ];

  // Status options
  const statusOptions = [
    { value: 'sent', label: 'Sent', color: 'text-gray-600' },
    { value: 'scheduled', label: 'Scheduled', color: 'text-sky-blue' },
    { value: 'draft', label: 'Draft', color: 'text-yellow-600' }
  ];

  const handleStoreToggle = (storeId) => {
    setSelectedStores(prev => {
      const newStores = prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId];
      console.log('Store toggle:', { prev, newStores, storeId });
      return newStores;
    });
  };

  const handleChannelToggle = (channel) => {
    setSelectedChannels(prev => {
      if (prev.includes(channel)) {
        return prev.filter(c => c !== channel);
      } else {
        return [...prev, channel];
      }
    });
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleStatusToggle = (status) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const clearAllFilters = () => {
    setSelectedStores([]);
    setSelectedChannels([]);
    setSelectedTags([]);
    setSelectedStatuses([]);
  };

  const hasActiveFilters = selectedStores.length > 0 || 
                          selectedChannels.length > 0 || 
                          selectedTags.length > 0 || 
                          selectedStatuses.length > 0;

  // Count total active filters
  const totalActiveFilters = selectedStores.length + selectedChannels.length + selectedTags.length + selectedStatuses.length;

  return (
    <div className="flex items-center gap-2">
      {/* Filters Button with Active Filter Display */}
      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 bg-white dark:bg-gray-800 hover:bg-sky-tint dark:hover:bg-gray-700 transition-all border-gray-200 dark:border-gray-600",
              hasActiveFilters && "border-sky-blue bg-gradient-to-r from-sky-tint to-lilac-mist/30 dark:from-gray-800 dark:to-gray-700 shadow-sm"
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">
              {hasActiveFilters ? `Filters (${totalActiveFilters})` : "Filters"}
            </span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg" align="start">
          <div className="space-y-4">
            {/* Stores */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Stores</h4>
                {selectedStores.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setSelectedStores([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {loadingStores ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-blue"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading stores...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stores.map(store => {
                    const isSelected = selectedStores.includes(store.public_id);
                    const storeColor = getStoreColor(store.id || store._id);
                    return (
                      <Badge
                        key={store.public_id}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected 
                            ? "bg-gradient-to-r from-sky-blue to-vivid-violet border-transparent" 
                            : "hover:bg-sky-tint/30 dark:hover:bg-gray-700"
                        )}
                        onClick={() => handleStoreToggle(store.public_id)}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full mr-1",
                          storeColor.bg
                        )} />
                        {store.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Channels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Channels</h4>
                {selectedChannels.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setSelectedChannels([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {channelOptions.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-sky-tint dark:hover:bg-gray-800 p-1 rounded transition-colors"
                  >
                    <Checkbox
                      checked={selectedChannels.includes(option.value)}
                      onCheckedChange={() => handleChannelToggle(option.value)}
                    />
                    <span className={cn("text-sm", option.color)}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Tags</h4>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setSelectedTags([])}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedTags.includes(tag) 
                          ? "bg-gradient-to-r from-vivid-violet to-deep-purple border-transparent" 
                          : "hover:bg-lilac-mist/30 dark:hover:bg-gray-700"
                      )}
                      onClick={() => handleTagToggle(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Status</h4>
                {selectedStatuses.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setSelectedStatuses([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {statusOptions.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-sky-tint dark:hover:bg-gray-800 p-1 rounded transition-colors"
                  >
                    <Checkbox
                      checked={selectedStatuses.includes(option.value)}
                      onCheckedChange={() => handleStatusToggle(option.value)}
                    />
                    <span className={cn("text-sm", option.color)}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-all"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
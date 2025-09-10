"use client";

import { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp, X, Check, Store, Tag } from 'lucide-react';
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
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
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

  return (
    <div className="flex items-center gap-2">
      {/* Store Selector */}
      <Popover open={showStoreDropdown} onOpenChange={setShowStoreDropdown}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 min-w-[150px] justify-between",
              selectedStores.length > 0 && "border-sky-blue bg-sky-tint/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="text-sm">
                {loadingStores
                  ? "Loading stores..."
                  : selectedStores.length === 0 
                    ? "All Stores" 
                    : selectedStores.length === 1
                      ? stores.find(s => s.public_id === selectedStores[0])?.name || "1 Store"
                      : `${selectedStores.length} Stores`
                }
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          {loadingStores ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-blue"></div>
              <span className="ml-2 text-sm text-gray-500">Loading stores...</span>
            </div>
          ) : (
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedStores([])}
            >
              <Check className={cn(
                "h-4 w-4 mr-2",
                selectedStores.length === 0 ? "opacity-100" : "opacity-0"
              )} />
              All Stores
            </Button>
            {stores.map(store => {
              const isSelected = selectedStores.includes(store.public_id);
              const storeColor = getStoreColor(store.id || store._id);
              return (
                <Button
                  key={store.public_id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    isSelected && "bg-sky-tint/50"
                  )}
                  onClick={() => handleStoreToggle(store.public_id)}
                >
                  <Check className={cn(
                    "h-4 w-4 mr-2",
                    isSelected ? "opacity-100" : "opacity-0"
                  )} />
                  <div className={cn(
                    "w-3 h-3 rounded-full mr-2",
                    storeColor.bg,
                    storeColor.border,
                    "border-2"
                  )} />
                  {store.name}
                </Button>
              );
            })}
          </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Filters Button */}
      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              hasActiveFilters && "border-sky-blue bg-sky-tint/50"
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">
              {hasActiveFilters ? `Filters (${
                selectedChannels.length + selectedTags.length + selectedStatuses.length
              })` : "Filters"}
            </span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
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
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
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
                      className="cursor-pointer"
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
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
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
                className="w-full"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          {selectedStores.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedStores.length} store{selectedStores.length > 1 ? 's' : ''}
            </Badge>
          )}
          {selectedChannels.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedChannels.length} channel{selectedChannels.length > 1 ? 's' : ''}
            </Badge>
          )}
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}
            </Badge>
          )}
          {selectedStatuses.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedStatuses.length} status{selectedStatuses.length > 1 ? 'es' : ''}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Filter, Mail, MessageSquare, Bell, Clock, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { MultiSelect } from '@/app/components/ui/multi-select';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/lib/utils';

export const FilterCard = ({
  stores = [],
  campaigns = [],
  selectedStores,
  setSelectedStores,
  selectedChannels,
  setSelectedChannels,
  selectedTags,
  setSelectedTags,
  selectedStatuses,
  setSelectedStatuses,
  className
}) => {

  // Extract unique tags from campaigns
  const availableTags = useMemo(() => {
    const tags = new Set();
    campaigns.forEach(campaign => {
      if (campaign.tags?.length > 0) {
        campaign.tags.forEach(tag => tags.add(tag));
      }
      if (campaign.tagNames?.length > 0) {
        campaign.tagNames.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [campaigns]);

  // Store options for multi-select
  const storeOptions = useMemo(() =>
    stores.map(store => ({
      value: store.public_id,
      label: store.name,
      color: store.color // If you have store colors
    }))
  , [stores]);

  // Channel options
  const channelOptions = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'push-notification', label: 'Push', icon: Bell }
  ];

  // Status options
  const statusOptions = [
    { value: 'sent', label: 'Sent', icon: CheckCircle },
    { value: 'Scheduled', label: 'Scheduled', icon: Clock },
    { value: 'Draft', label: 'Draft', icon: FileText },
    { value: 'Sending', label: 'Sending', icon: RefreshCw }
  ];

  // Tag options
  const tagOptions = useMemo(() =>
    availableTags.map(tag => ({
      value: tag,
      label: tag
    }))
  , [availableTags]);

  // Convert selected arrays to multi-select format
  const selectedStoreOptions = useMemo(() =>
    selectedStores.map(id => {
      const store = stores.find(s => s.public_id === id);
      return store ? { value: id, label: store.name } : null;
    }).filter(Boolean)
  , [selectedStores, stores]);

  const selectedChannelOptions = useMemo(() =>
    selectedChannels.map(channel => {
      const option = channelOptions.find(c => c.value === channel);
      return option ? { value: channel, label: option.label } : null;
    }).filter(Boolean)
  , [selectedChannels]);

  const selectedStatusOptions = useMemo(() =>
    selectedStatuses.map(status => {
      const option = statusOptions.find(s => s.value === status);
      return option ? { value: status, label: option.label } : null;
    }).filter(Boolean)
  , [selectedStatuses]);

  const selectedTagOptions = useMemo(() =>
    selectedTags.map(tag => ({ value: tag, label: tag }))
  , [selectedTags]);

  // Handle changes
  const handleStoreChange = (options) => {
    setSelectedStores(options.map(opt => opt.value));
  };

  const handleChannelChange = (options) => {
    setSelectedChannels(options.map(opt => opt.value));
  };

  const handleStatusChange = (options) => {
    setSelectedStatuses(options.map(opt => opt.value));
  };

  const handleTagChange = (options) => {
    setSelectedTags(options.map(opt => opt.value));
  };

  // Check if any filters are active
  const hasActiveFilters = selectedStores.length > 0 ||
                          selectedChannels.length > 0 ||
                          selectedTags.length > 0 ||
                          selectedStatuses.length > 0;

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedStores([]);
    setSelectedChannels([]);
    setSelectedTags([]);
    setSelectedStatuses([]);
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      {/* Ultra-thin header */}
      <div className="px-4 py-2 bg-gradient-to-r from-sky-tint/20 to-lilac-mist/20 dark:from-gray-800 dark:to-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-sky-blue" />
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Filters</h3>
            {hasActiveFilters && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-blue/10 text-sky-blue font-medium">
                Active
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter content - always visible */}
      <div className="p-3 space-y-3 bg-white dark:bg-gray-900">
          {/* Filter dropdowns in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Stores dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Stores
              </label>
              <MultiSelect
                options={storeOptions}
                value={selectedStoreOptions}
                onChange={handleStoreChange}
                placeholder="All stores"
                className="text-sm"
              />
            </div>

            {/* Channels dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Channels
              </label>
              <MultiSelect
                options={channelOptions}
                value={selectedChannelOptions}
                onChange={handleChannelChange}
                placeholder="All channels"
                className="text-sm"
              />
            </div>

            {/* Status dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
              </label>
              <MultiSelect
                options={statusOptions}
                value={selectedStatusOptions}
                onChange={handleStatusChange}
                placeholder="All statuses"
                className="text-sm"
              />
            </div>

            {/* Tags dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Tags
              </label>
              <MultiSelect
                options={tagOptions}
                value={selectedTagOptions}
                onChange={handleTagChange}
                placeholder="All tags"
                className="text-sm"
                disabled={tagOptions.length === 0}
              />
            </div>
          </div>

      </div>
    </div>
  );
};
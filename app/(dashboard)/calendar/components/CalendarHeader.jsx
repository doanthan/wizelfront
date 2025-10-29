"use client";

import { Plus, CalendarDays, CalendarRange, CalendarClock, ChevronLeft, ChevronRight, GitCompare, RefreshCw, Calendar, Table } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const CalendarHeader = ({
  date,
  setDate,
  view,
  setView,
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
  setShowCampaignModal,
  selectedForComparison,
  setShowCompareModal,
  futureLoading,
  pastLoading,
  loading,
  loadingStores,
  onRefresh,
  displayMode,
  setDisplayMode
}) => {
  const navigateDate = (direction) => {
    const newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setDate(newDate);
  };

  const goToToday = () => {
    setDate(new Date());
  };

  const getDateRangeText = () => {
    if (view === 'month') {
      return format(date, 'MMMM yyyy');
    } else if (view === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(-1)}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="px-3"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(1)}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date Display */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getDateRangeText()}
        </h2>

        {/* Loading Indicators */}
        <div className="flex items-center gap-4">
          {pastLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-blue"></div>
              <span>Loading past campaigns...</span>
            </div>
          )}
          
          {futureLoading && (
            <div className="flex items-center gap-2 text-sm text-sky-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-vivid-violet"></div>
              <span>Loading scheduled campaigns...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={pastLoading || futureLoading}
            className="p-2"
            title="Refresh campaigns"
          >
            <RefreshCw className={`h-4 w-4 ${(pastLoading || futureLoading) ? 'animate-spin' : ''}`} />
          </Button>
        )}

        {/* Display Mode Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={displayMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDisplayMode('calendar')}
            className={cn(
              "gap-1.5",
              displayMode === 'calendar'
                ? "bg-sky-blue hover:bg-royal-blue text-white"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant={displayMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setDisplayMode('table')}
            className={cn(
              "gap-1.5",
              displayMode === 'table'
                ? "bg-sky-blue hover:bg-royal-blue text-white"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            <Table className="h-4 w-4" />
            Performance Table
          </Button>
        </div>

        {/* View Selector */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('month')}
            className={view === 'month' ? 'bg-sky-blue hover:bg-royal-blue' : ''}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('week')}
            className={view === 'week' ? 'bg-sky-blue hover:bg-royal-blue' : ''}
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('day')}
            className={view === 'day' ? 'bg-sky-blue hover:bg-royal-blue' : ''}
          >
            <CalendarClock className="h-4 w-4 mr-2" />
            Day
          </Button>
        </div>

        {/* Compare Button */}
        {selectedForComparison.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCompareModal(true)}
            className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple"
          >
            <GitCompare className="h-4 w-4 mr-2" />
            Compare ({selectedForComparison.length})
          </Button>
        )}

        {/* New Campaign Button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowCampaignModal(true)}
          className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>
    </div>
  );
};
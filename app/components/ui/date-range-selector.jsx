"use client";

import * as React from "react";
import { format, subDays, startOfWeek, startOfMonth, endOfDay, isAfter, isBefore } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Label } from "@/app/components/ui/label";

const TIME_PERIODS = [
  { value: "today", label: "Today" },
  { value: "week-to-date", label: "Week-to-date" },
  { value: "month-to-date", label: "Month-to-date" },
  { value: "last7", label: "Past 7 days" },
  { value: "last30", label: "Past 30 days" },
  { value: "last60", label: "Past 60 days" },
  { value: "last90", label: "Past 90 days" },
  { value: "custom", label: "Custom" },
];

const COMPARISON_PERIODS = [
  { value: "previous-period", label: "Previous period" },
  { value: "previous-year", label: "Previous year" },
];

export function DateRangeSelector({ 
  onDateChange,
  onDateRangeChange, // Accept both prop names for backward compatibility
  className,
  showComparison = true,
  storageKey,
  initialDateRange
}) {
  const [open, setOpen] = React.useState(false);
  const [timePeriod, setTimePeriod] = React.useState(
    initialDateRange?.period || "last30"
  );
  const [comparisonPeriod, setComparisonPeriod] = React.useState(
    initialDateRange?.comparisonType || "previous-period"
  );
  const [dateRange, setDateRange] = React.useState(() => {
    if (initialDateRange?.ranges?.main) {
      return {
        from: initialDateRange.ranges.main.start,
        to: initialDateRange.ranges.main.end,
      };
    }
    // Default to last 30 days - use current date, not future
    const endDate = endOfDay(new Date());
    const startDate = subDays(endDate, 29);
    return {
      from: startDate,
      to: endDate,
    };
  });
  const [customDateRange, setCustomDateRange] = React.useState({
    from: null,
    to: null,
  });
  const [calendarSelection, setCalendarSelection] = React.useState('from'); // Track which date is being selected
  const [showCustomCalendar, setShowCustomCalendar] = React.useState(false);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Notify parent component when Apply is clicked
  const notifyDateChange = React.useCallback(() => {
    if (!dateRange.from || !dateRange.to) return;
    
    // Always calculate comparison range
    const daysDiff = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24));
    let comparisonRange = null;

    if (showComparison) {
      if (comparisonPeriod === "previous-period") {
        comparisonRange = {
          from: subDays(dateRange.from, daysDiff + 1),
          to: subDays(dateRange.from, 1),
          start: subDays(dateRange.from, daysDiff + 1),
          end: subDays(dateRange.from, 1),
          label: "Previous Period"
        };
      } else if (comparisonPeriod === "previous-year") {
        // Create previous year dates by subtracting exactly 365 days (or 366 for leap years)
        // This ensures we maintain the same time of day and handle edge cases properly
        const previousYearFrom = new Date(dateRange.from);
        const previousYearTo = new Date(dateRange.to);

        previousYearFrom.setFullYear(dateRange.from.getFullYear() - 1);
        previousYearTo.setFullYear(dateRange.to.getFullYear() - 1);

        comparisonRange = {
          from: previousYearFrom,
          to: previousYearTo,
          start: previousYearFrom,
          end: previousYearTo,
          label: "Previous Year"
        };
      }
    }

    const dateSelection = {
      period: timePeriod,
      comparisonType: comparisonPeriod,
      ranges: {
        main: {
          from: dateRange.from,
          to: dateRange.to,
          start: dateRange.from,
          end: dateRange.to,
          label: TIME_PERIODS.find(p => p.value === timePeriod)?.label || "Selected Period"
        },
        comparison: comparisonRange
      }
    };

    // Save to localStorage if storageKey provided
    if (storageKey && typeof window !== 'undefined') {
      try {
        const dataToSave = {
          ...dateSelection,
          ranges: {
            main: {
              start: dateSelection.ranges.main.start.toISOString(),
              end: dateSelection.ranges.main.end.toISOString(),
              label: dateSelection.ranges.main.label
            },
            comparison: dateSelection.ranges.comparison ? {
              start: dateSelection.ranges.comparison.start.toISOString(),
              end: dateSelection.ranges.comparison.end.toISOString(),
              label: dateSelection.ranges.comparison.label
            } : null
          }
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (e) {
        console.warn('Failed to save date range to localStorage:', e);
      }
    }

    // Call the appropriate callback
    if (onDateRangeChange) {
      onDateRangeChange(dateSelection);
    } else if (onDateChange) {
      // Legacy format for backward compatibility
      onDateChange({ 
        primary: dateRange, 
        comparison: comparisonRange,
        period: timePeriod,
        comparisonType: comparisonPeriod
      });
    }
  }, [dateRange, comparisonPeriod, showComparison, timePeriod, onDateChange, onDateRangeChange, storageKey]);

  // Calculate date range based on selected period
  React.useEffect(() => {
    // Skip if we have initial date range values
    if (initialDateRange?.ranges?.main && timePeriod === initialDateRange.period) {
      return;
    }
    
    const today = endOfDay(new Date());
    let newRange = { from: today, to: today };

    switch (timePeriod) {
      case "today":
        newRange = {
          from: new Date(today.setHours(0, 0, 0, 0)),
          to: today,
        };
        break;
      case "week-to-date":
        newRange = {
          from: startOfWeek(today, { weekStartsOn: 0 }),
          to: today,
        };
        break;
      case "month-to-date":
        newRange = {
          from: startOfMonth(today),
          to: today,
        };
        break;
      case "last7":
        newRange = {
          from: subDays(today, 6),
          to: today,
        };
        break;
      case "last30":
        newRange = {
          from: subDays(today, 29),
          to: today,
        };
        break;
      case "last60":
        newRange = {
          from: subDays(today, 59),
          to: today,
        };
        break;
      case "last90":
        newRange = {
          from: subDays(today, 89),
          to: today,
        };
        break;
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          newRange = customDateRange;
        }
        break;
    }

    setDateRange(newRange);
  }, [timePeriod, customDateRange, initialDateRange]);

  // Call notifyDateChange on initial mount
  React.useEffect(() => {
    if (!hasInitialized && dateRange.from && dateRange.to) {
      notifyDateChange();
      setHasInitialized(true);
    }
  }, [dateRange, hasInitialized, notifyDateChange]);

  const handleApply = () => {
    notifyDateChange();
    setOpen(false);
    setShowCustomCalendar(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setShowCustomCalendar(false);
    // Reset to last saved state if needed
  };

  const formatDateRangeDisplay = () => {
    if (!dateRange.from || !dateRange.to) return "Select date range";
    
    const fromStr = format(dateRange.from, "MMM d, yyyy");
    const toStr = format(dateRange.to, "MMM d, yyyy");
    
    if (fromStr === toStr) {
      return fromStr;
    }
    
    return `${fromStr} - ${toStr}`;
  };

  const getComparisonText = () => {
    if (!showComparison) return "";
    
    if (comparisonPeriod === "previous-period") {
      const daysDiff = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) + 1;
      if (daysDiff === 1) return "Compared to yesterday";
      if (daysDiff === 7) return "Compared to previous 7 days";
      if (daysDiff === 30) return "Compared to previous 30 days";
      if (daysDiff === 60) return "Compared to previous 60 days";
      if (daysDiff === 90) return "Compared to previous 90 days";
      return `Compared to previous ${daysDiff} days`;
    }
    
    return "Compared to previous year";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 border-neutral-gray/30 hover:border-sky-blue hover:bg-sky-tint/50 transition-all",
            !dateRange && "text-gray-600 dark:text-gray-400",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="text-sm">{TIME_PERIODS.find(p => p.value === timePeriod)?.label || "Select period"}</span>
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg" align="start">
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
          {/* Time Period Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time period</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-10"
                >
                  <span className="text-gray-900 dark:text-white">{TIME_PERIODS.find(p => p.value === timePeriod)?.label}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {TIME_PERIODS.map((period) => (
                  <DropdownMenuItem
                    key={period.value}
                    onClick={() => {
                      setTimePeriod(period.value);
                      if (period.value === "custom") {
                        setShowCustomCalendar(true);
                      }
                    }}
                    className="flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <span>{period.label}</span>
                    {timePeriod === period.value && (
                      <Check className="h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Custom Date Range Picker */}
          {timePeriod === "custom" && showCustomCalendar && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select date range</Label>
              
              {/* Side by Side Calendars */}
              <div className="grid grid-cols-2 gap-4">
                {/* From Calendar */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">From</Label>
                    <button
                      onClick={() => setCalendarSelection('from')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md text-sm text-left transition-all",
                        calendarSelection === 'from' 
                          ? "border-sky-blue bg-sky-tint/20 font-medium" 
                          : "border-gray-300 bg-white dark:bg-gray-800 hover:border-sky-blue/50"
                      )}
                    >
                      <span className="text-gray-900 dark:text-white">
                        {customDateRange?.from ? format(customDateRange.from, "MMM dd, yyyy") : "Select start date"}
                      </span>
                    </button>
                  </div>
                  <div className="border rounded-lg p-2 bg-white dark:bg-gray-900">
                    <Calendar
                      mode="single"
                      selected={customDateRange?.from}
                      onSelect={(date) => {
                        if (date) {
                          setCustomDateRange(prev => ({
                            from: date,
                            to: prev?.to && date <= prev.to ? prev.to : date
                          }));
                          // Auto-advance to "to" selection if from is selected
                          setCalendarSelection('to');
                        }
                      }}
                      className="rounded-md"
                      disabled={(date) => {
                        // Disable future dates and dates after "to" if set
                        return date > new Date() || 
                               date < new Date('2020-01-01') ||
                               (customDateRange?.to && date > customDateRange.to)
                      }}
                      modifiers={{
                        selected: customDateRange?.from,
                        range_middle: customDateRange?.from && customDateRange?.to ? 
                          (date) => date > customDateRange.from && date < customDateRange.to : undefined,
                        range_end: customDateRange?.to
                      }}
                      modifiersClassNames={{
                        selected: 'bg-sky-blue text-white font-bold',
                        range_middle: 'bg-sky-tint dark:bg-sky-blue/20 text-sky-blue dark:text-sky-blue',
                        range_end: 'bg-vivid-violet text-white font-bold'
                      }}
                    />
                  </div>
                </div>
                
                {/* To Calendar */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">To</Label>
                    <button
                      onClick={() => setCalendarSelection('to')}
                      className={cn(
                        "w-full px-3 py-2 border rounded-md text-sm text-left transition-all",
                        calendarSelection === 'to' 
                          ? "border-vivid-violet bg-lilac-mist/20 font-medium" 
                          : "border-gray-300 bg-white dark:bg-gray-800 hover:border-vivid-violet/50"
                      )}
                    >
                      <span className="text-gray-900 dark:text-white">
                        {customDateRange?.to ? format(customDateRange.to, "MMM dd, yyyy") : "Select end date"}
                      </span>
                    </button>
                  </div>
                  <div className="border rounded-lg p-2 bg-white dark:bg-gray-900">
                    <Calendar
                      mode="single"
                      selected={customDateRange?.to}
                      onSelect={(date) => {
                        if (date) {
                          setCustomDateRange(prev => ({
                            from: prev?.from && date >= prev.from ? prev.from : date,
                            to: date
                          }));
                        }
                      }}
                      className="rounded-md"
                      disabled={(date) => {
                        // Disable future dates and dates before "from" if set
                        return date > new Date() || 
                               date < new Date('2020-01-01') ||
                               (customDateRange?.from && date < customDateRange.from)
                      }}
                      modifiers={{
                        selected: customDateRange?.to,
                        range_middle: customDateRange?.from && customDateRange?.to ? 
                          (date) => date > customDateRange.from && date < customDateRange.to : undefined,
                        range_start: customDateRange?.from
                      }}
                      modifiersStyles={{
                        selected: { 
                          backgroundColor: '#8B5CF6',
                          color: 'white',
                          fontWeight: 'bold'
                        },
                        range_middle: {
                          backgroundColor: '#E0F2FE',
                          color: '#1e40af'
                        },
                        range_start: {
                          backgroundColor: '#60A5FA',
                          color: 'white',
                          fontWeight: 'bold'
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* Comparison Period Section */}
          {showComparison && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comparison period</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10"
                  >
                    <span className="text-gray-900 dark:text-white">{COMPARISON_PERIODS.find(p => p.value === comparisonPeriod)?.label}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  {COMPARISON_PERIODS.map((period) => (
                    <DropdownMenuItem
                      key={period.value}
                      onClick={() => setComparisonPeriod(period.value)}
                      className="flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      <span>{period.label}</span>
                      {comparisonPeriod === period.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApply}
              size="sm"
              className="flex-1 bg-sky-blue hover:bg-royal-blue text-white font-semibold transition-all"
            >
              Apply
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
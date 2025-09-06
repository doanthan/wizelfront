"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"

const Calendar = React.forwardRef(({ 
  selected,
  onSelect,
  disabled,
  className,
  minDate,
  maxDate,
  mode = "single", // "single" or "range"
  showOutsideDays = true,
  ...props 
}, ref) => {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (selected) {
      const date = mode === "range" && selected.from ? selected.from : selected
      return date instanceof Date ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date()
    }
    return new Date()
  })

  const [hoveredDate, setHoveredDate] = React.useState(null)
  const [rangeSelection, setRangeSelection] = React.useState(() => {
    if (mode === "range" && selected) {
      return { from: selected.from || null, to: selected.to || null }
    }
    return { from: null, to: null }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay()

  // Generate calendar days
  const days = []

  // Previous month's trailing days
  const prevMonth = new Date(currentYear, currentMonthIndex, 0)
  const prevMonthDays = prevMonth.getDate()
  const prevMonthYear = prevMonth.getFullYear()
  const prevMonthIndex = prevMonth.getMonth()
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      date: new Date(prevMonthYear, prevMonthIndex, prevMonthDays - i),
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonthIndex, day),
    })
  }

  // Next month's leading days
  const totalDays = days.length
  const remainingDays = totalDays <= 35 ? 35 - totalDays : 42 - totalDays
  
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      day,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonthIndex + 1, day),
    })
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + direction)
      return newMonth
    })
  }

  const navigateYear = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      newMonth.setFullYear(prev.getFullYear() + direction)
      return newMonth
    })
  }

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    if (mode === "single") {
      onSelect?.(today)
    }
  }

  const isDateDisabled = (date) => {
    if (disabled && typeof disabled === "function") {
      return disabled(date)
    }
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const isDateSelected = (date) => {
    if (mode === "single") {
      if (!selected) return false
      return (
        date.getDate() === selected.getDate() &&
        date.getMonth() === selected.getMonth() &&
        date.getFullYear() === selected.getFullYear()
      )
    } else if (mode === "range") {
      const { from, to } = rangeSelection
      if (!from) return false
      
      const isFrom = from && (
        date.getDate() === from.getDate() &&
        date.getMonth() === from.getMonth() &&
        date.getFullYear() === from.getFullYear()
      )
      
      const isTo = to && (
        date.getDate() === to.getDate() &&
        date.getMonth() === to.getMonth() &&
        date.getFullYear() === to.getFullYear()
      )
      
      return isFrom || isTo
    }
    return false
  }

  const isDateInRange = (date) => {
    if (mode !== "range") return false
    const { from, to } = rangeSelection
    
    if (!from || !to) {
      // While selecting range, show preview with hovered date
      if (from && hoveredDate) {
        const start = from < hoveredDate ? from : hoveredDate
        const end = from < hoveredDate ? hoveredDate : from
        return date > start && date < end
      }
      return false
    }
    
    return date > from && date < to
  }

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleDateClick = (date, isCurrentMonth) => {
    if (!showOutsideDays && !isCurrentMonth) return
    if (isDateDisabled(date)) return

    if (mode === "single") {
      onSelect?.(date)
    } else if (mode === "range") {
      if (!rangeSelection.from || (rangeSelection.from && rangeSelection.to)) {
        // Start new range selection
        setRangeSelection({ from: date, to: null })
        onSelect?.({ from: date, to: null })
      } else {
        // Complete range selection
        const from = rangeSelection.from
        const to = date
        if (from <= to) {
          setRangeSelection({ from, to })
          onSelect?.({ from, to })
        } else {
          setRangeSelection({ from: to, to: from })
          onSelect?.({ from: to, to: from })
        }
      }
    }
  }

  React.useEffect(() => {
    if (mode === "range" && selected) {
      setRangeSelection({ from: selected.from || null, to: selected.to || null })
    }
  }, [selected, mode])

  return (
    <div 
      ref={ref}
      className={cn(
        "p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm",
        className
      )} 
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button
            onClick={() => navigateYear(-1)}
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-50 hover:opacity-100"
            type="button"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-3 w-3" />
            <ChevronLeft className="h-3 w-3 -ml-2" />
          </Button>
          <Button
            onClick={() => navigateMonth(-1)}
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-50 hover:opacity-100"
            type="button"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {monthNames[currentMonthIndex]} {currentYear}
          </h2>
          <Button
            onClick={goToToday}
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-50 hover:opacity-100"
            type="button"
            aria-label="Go to today"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => navigateMonth(1)}
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-50 hover:opacity-100"
            type="button"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigateYear(1)}
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-50 hover:opacity-100"
            type="button"
            aria-label="Next year"
          >
            <ChevronRight className="h-3 w-3 -mr-2" />
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((day) => (
          <div 
            key={day} 
            className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((dayObj, index) => {
          const { day, isCurrentMonth, date } = dayObj
          const isDisabled = isDateDisabled(date)
          const isSelected = isDateSelected(date)
          const isTodayDate = isToday(date)
          const isInRange = isDateInRange(date)
          const isRangeStart = mode === "range" && rangeSelection.from && 
            date.getTime() === rangeSelection.from.getTime()
          const isRangeEnd = mode === "range" && rangeSelection.to && 
            date.getTime() === rangeSelection.to.getTime()

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date, isCurrentMonth)}
              onMouseEnter={() => mode === "range" && setHoveredDate(date)}
              onMouseLeave={() => mode === "range" && setHoveredDate(null)}
              disabled={isDisabled}
              type="button"
              className={cn(
                "h-9 w-full flex items-center justify-center text-sm relative transition-all duration-150",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "focus:z-10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                
                // Visibility
                !showOutsideDays && !isCurrentMonth && "invisible",
                
                // Text color
                isCurrentMonth 
                  ? "text-gray-900 dark:text-gray-100" 
                  : "text-gray-400 dark:text-gray-600",
                
                // Today
                isTodayDate && !isSelected && "font-semibold text-sky-600 dark:text-sky-400",
                
                // Selected
                isSelected && "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 font-semibold",
                
                // Range selection
                isInRange && !isSelected && "bg-sky-100 dark:bg-sky-900/30",
                isRangeStart && "rounded-l-md",
                isRangeEnd && "rounded-r-md",
                isSelected && !isRangeStart && !isRangeEnd && mode === "range" && "rounded-none",
                
                // Disabled
                isDisabled && "text-gray-300 dark:text-gray-700 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent opacity-50",
              )}
              aria-label={`${monthNames[date.getMonth()]} ${day}, ${date.getFullYear()}`}
              aria-selected={isSelected}
              aria-disabled={isDisabled}
            >
              <time dateTime={date.toISOString().split('T')[0]}>
                {day}
              </time>
              {/* Today indicator */}
              {isTodayDate && (
                <span 
                  className={cn(
                    "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                    isSelected ? "bg-white" : "bg-sky-600 dark:bg-sky-400"
                  )}
                  aria-label="Today"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Range selection info */}
      {mode === "range" && rangeSelection.from && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {rangeSelection.to ? (
              <span>
                {rangeSelection.from.toLocaleDateString()} - {rangeSelection.to.toLocaleDateString()}
              </span>
            ) : (
              <span>Select end date...</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

Calendar.displayName = "Calendar"

export { Calendar }

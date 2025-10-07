"use client"

import * as React from "react"
import { Check, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { Badge } from "@/app/components/ui/badge"
import { Checkbox } from "@/app/components/ui/checkbox"

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select items...",
  className,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  // Handle selection changes
  const handleSelect = (option) => {
    const isViewAll = option.value === 'all'
    const currentlySelected = value.some(v => v.value === option.value)
    
    if (isViewAll) {
      // If selecting View All, clear other selections
      onChange(currentlySelected ? [] : [option])
    } else {
      // Check if View All is currently selected
      const hasViewAll = value.some(v => v.value === 'all')
      
      if (hasViewAll) {
        // Replace View All with the specific selection
        onChange([option])
      } else {
        // Toggle the specific option
        if (currentlySelected) {
          const newValue = value.filter(v => v.value !== option.value)
          onChange(newValue.length > 0 ? newValue : [{ value: 'all', label: 'View All' }])
        } else {
          onChange([...value, option])
        }
      }
    }
  }

  // Handle removing a selected item
  const handleRemove = (optionToRemove, e) => {
    e.stopPropagation()
    const newValue = value.filter(v => v.value !== optionToRemove.value)
    onChange(newValue.length > 0 ? newValue : [{ value: 'all', label: 'View All' }])
  }

  // Clear all selections
  const handleClear = (e) => {
    e.stopPropagation()
    onChange([{ value: 'all', label: 'View All' }])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-auto min-h-[36px] px-3 py-1.5 font-normal",
            "border-gray-300 dark:border-gray-700",
            "hover:border-gray-400 dark:hover:border-gray-600",
            "focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20",
            !value?.length && "text-gray-600 dark:text-gray-400",
            className
          )}
        >
          <div className="flex items-center gap-1 flex-1 overflow-hidden min-w-0">
            {value?.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap py-0.5">
                {value.slice(0, 2).map((item) => (
                  <Badge
                    key={item.value}
                    variant="secondary"
                    className="h-5 px-1.5 py-0 text-xs bg-sky-tint dark:bg-sky-900/30 text-sky-blue dark:text-sky-400 border border-sky-blue/20 dark:border-sky-blue/30 flex items-center gap-1 shrink-0"
                  >
                    <span className="truncate max-w-[100px]">{item.label}</span>
                    <X
                      onClick={(e) => handleRemove(item, e)}
                      className="h-3 w-3 hover:text-royal-blue cursor-pointer shrink-0"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleRemove(item, e)
                        }
                      }}
                    />
                  </Badge>
                ))}
                {value.length > 2 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0">
                    +{value.length - 2} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value?.length > 0 && (
              <X
                onClick={handleClear}
                className="h-4 w-4 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer shrink-0"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClear(e)
                  }
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg [&]:bg-white dark:[&]:bg-gray-800"
        align="start"
        sideOffset={4}
      >
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800">
          <div className="p-2" role="listbox" aria-multiselectable="true">
            {filteredOptions.length === 0 ? (
              <div className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.some(v => v.value === option.value)
                const isDisabled = option.isDisabled
                
                return (
                  <div
                    key={option.value}
                    onClick={() => !isDisabled && handleSelect(option)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                        e.preventDefault()
                        handleSelect(option)
                      }
                    }}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={isDisabled ? -1 : 0}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer",
                      "text-gray-900 dark:text-gray-100",
                      "hover:bg-gray-50 dark:hover:bg-gray-700",
                      isSelected && "bg-sky-50 dark:bg-gray-700 font-medium text-sky-blue dark:text-sky-400",
                      isDisabled && "opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      className="h-4 w-4 pointer-events-none"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-left">
                      {option.label}
                    </span>
                    {option.value === 'all' && (
                      <Badge variant="outline" className="text-xs">
                        All
                      </Badge>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
        {value?.length > 0 && (
          <div className="p-2 border-t bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{value.length} selected</span>
              <button
                onClick={() => {
                  onChange([{ value: 'all', label: 'View All' }])
                  setOpen(false)
                }}
                className="text-sky-blue hover:text-royal-blue"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
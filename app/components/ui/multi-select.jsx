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
            "w-full justify-between h-9 px-3 font-normal",
            "border-gray-300 dark:border-gray-700",
            "hover:border-gray-400 dark:hover:border-gray-600",
            "focus:border-sky-blue focus:ring-2 focus:ring-sky-blue/20",
            !value?.length && "text-gray-600 dark:text-gray-400",
            className
          )}
        >
          <div className="flex items-center gap-1 flex-1 overflow-hidden">
            {value?.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                {value.slice(0, 2).map((item) => (
                  <Badge
                    key={item.value}
                    variant="secondary"
                    className="h-5 px-2 py-0 text-xs bg-sky-tint text-sky-blue border-sky-blue/20"
                  >
                    {item.label}
                    <button
                      onClick={(e) => handleRemove(item, e)}
                      className="ml-1 hover:text-royal-blue"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {value.length > 2 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    +{value.length - 2} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500 text-xs">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {value?.length > 0 && (
              <button
                onClick={handleClear}
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-0" 
        align="start"
      >
        <div className="p-2 border-b">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-blue focus:border-sky-blue"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <div className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.some(v => v.value === option.value)
                const isDisabled = option.isDisabled
                
                return (
                  <button
                    key={option.value}
                    onClick={() => !isDisabled && handleSelect(option)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-gray-100 dark:hover:bg-gray-800",
                      isSelected && "bg-sky-tint/50 text-sky-blue",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 text-left">
                      {option.label}
                    </span>
                    {option.value === 'all' && (
                      <Badge variant="outline" className="text-xs">
                        All
                      </Badge>
                    )}
                  </button>
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
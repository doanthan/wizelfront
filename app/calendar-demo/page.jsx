'use client'

import { useState } from 'react'
import { Calendar } from '@/app/components/ui/calendar'
import { Card } from '@/app/components/ui/card'
import { Label } from '@/app/components/ui/label'
import { format } from 'date-fns'

export default function CalendarDemoPage() {
  const [singleDate, setSingleDate] = useState(new Date())
  const [rangeDate, setRangeDate] = useState({ from: null, to: null })
  const [disabledDate, setDisabledDate] = useState(null)
  
  // Custom disabled dates function
  const isWeekend = (date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }
  
  const isPastDate = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Professional Calendar Component
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A feature-rich, accessible, and customizable calendar component
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Single Date Selection */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Single Date Selection
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click any date to select it
              </p>
            </div>
            
            <Calendar
              mode="single"
              selected={singleDate}
              onSelect={setSingleDate}
              className="rounded-md border"
            />
            
            {singleDate && (
              <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                <Label className="text-sm font-medium text-sky-900 dark:text-sky-100">
                  Selected Date:
                </Label>
                <p className="text-sm text-sky-700 dark:text-sky-300 mt-1">
                  {format(singleDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )}
          </Card>

          {/* Range Selection */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Date Range Selection
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to select start and end dates
              </p>
            </div>
            
            <Calendar
              mode="range"
              selected={rangeDate}
              onSelect={setRangeDate}
              className="rounded-md border"
            />
            
            {rangeDate.from && (
              <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                <Label className="text-sm font-medium text-sky-900 dark:text-sky-100">
                  Selected Range:
                </Label>
                <p className="text-sm text-sky-700 dark:text-sky-300 mt-1">
                  {rangeDate.from && format(rangeDate.from, 'MMM d, yyyy')}
                  {rangeDate.to && ` - ${format(rangeDate.to, 'MMM d, yyyy')}`}
                  {rangeDate.from && rangeDate.to && (
                    <span className="ml-2 text-sky-600 dark:text-sky-400">
                      ({Math.ceil((rangeDate.to - rangeDate.from) / (1000 * 60 * 60 * 24)) + 1} days)
                    </span>
                  )}
                </p>
              </div>
            )}
          </Card>

          {/* Disabled Weekends */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Disabled Weekends
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Weekends are disabled for selection
              </p>
            </div>
            
            <Calendar
              mode="single"
              selected={disabledDate}
              onSelect={setDisabledDate}
              disabled={isWeekend}
              className="rounded-md border"
            />
            
            {disabledDate && (
              <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                <Label className="text-sm font-medium text-sky-900 dark:text-sky-100">
                  Selected Date:
                </Label>
                <p className="text-sm text-sky-700 dark:text-sky-300 mt-1">
                  {format(disabledDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )}
          </Card>

          {/* Future Dates Only */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Future Dates Only
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Past dates are disabled
              </p>
            </div>
            
            <Calendar
              mode="single"
              selected={null}
              onSelect={(date) => console.log('Selected:', date)}
              disabled={isPastDate}
              className="rounded-md border"
            />
          </Card>

          {/* Min/Max Date Range */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Limited Date Range
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only dates within the next 30 days are selectable
              </p>
            </div>
            
            <Calendar
              mode="single"
              selected={null}
              onSelect={(date) => console.log('Selected:', date)}
              minDate={new Date()}
              maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              className="rounded-md border"
            />
          </Card>

          {/* Hide Outside Days */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Hide Outside Days
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Days from other months are hidden
              </p>
            </div>
            
            <Calendar
              mode="single"
              selected={null}
              onSelect={(date) => console.log('Selected:', date)}
              showOutsideDays={false}
              className="rounded-md border"
            />
          </Card>
        </div>

        {/* Features List */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Calendar Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Single & Range Selection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Support for both single date and date range selection modes
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Keyboard Navigation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full keyboard support with focus management
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Year Navigation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quick navigation by month and year
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Date Constraints</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Support for min/max dates and custom disabled logic
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Beautiful dark mode support out of the box
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Accessibility</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ARIA labels and screen reader support
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Today Indicator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visual indicator for today's date with quick navigation
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Hover Preview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Range selection preview on hover
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Customizable</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fully customizable with Tailwind CSS classes
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
"use client";

import React from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';

export const CalendarSkeleton = ({ view = 'month' }) => {
  if (view === 'month') {
    return (
      <div className="space-y-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold py-2 text-gray-600 dark:text-gray-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid skeleton */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 min-h-[120px] p-2"
            >
              <div className="space-y-2">
                {/* Date number */}
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-8" />
                </div>
                {/* Campaign placeholders */}
                {i % 3 === 0 && (
                  <div className="space-y-1">
                    <Skeleton className="h-7 w-full rounded" />
                    {i % 6 === 0 && (
                      <Skeleton className="h-7 w-full rounded" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'week') {
    return (
      <div className="space-y-4">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="text-center text-xs font-semibold py-2"></div>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-16 mx-auto mb-1" />
              <Skeleton className="h-5 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700">
          {Array.from({ length: 24 }, (_, hour) => (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div className="bg-white dark:bg-gray-900 p-2 text-xs text-gray-500 text-right">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              {/* Day columns */}
              {Array.from({ length: 7 }, (_, day) => (
                <div key={`${hour}-${day}`} className="bg-white dark:bg-gray-900 min-h-[60px] p-1 border-b border-gray-100 dark:border-gray-800">
                  {(hour === 9 || hour === 14) && day % 2 === 0 && (
                    <Skeleton className="h-6 w-full rounded" />
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Day view skeleton
  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="text-center mb-4">
        <Skeleton className="h-8 w-48 mx-auto" />
      </div>

      {/* Time slots */}
      <div className="space-y-2">
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="flex gap-4 items-start">
            {/* Time label */}
            <div className="w-20 text-xs text-gray-500 text-right py-2">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            {/* Content area */}
            <div className="flex-1 min-h-[60px] border-b border-gray-100 dark:border-gray-800 py-2">
              {(hour === 9 || hour === 11 || hour === 14 || hour === 16) && (
                <Skeleton className="h-12 w-full max-w-lg rounded" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarSkeleton;
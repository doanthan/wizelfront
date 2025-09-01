"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const ChartContainer = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-neutral-gray bg-white p-6 shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
ChartContainer.displayName = "ChartContainer";

const ChartHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between mb-4", className)}
    {...props}
  />
));
ChartHeader.displayName = "ChartHeader";

const ChartTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold text-slate-gray",
      className
    )}
    {...props}
  />
));
ChartTitle.displayName = "ChartTitle";

const ChartDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-gray", className)}
    {...props}
  />
));
ChartDescription.displayName = "ChartDescription";

const ChartContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full", className)}
    {...props}
  />
));
ChartContent.displayName = "ChartContent";

const ChartLegend = React.forwardRef(({ className, items = [], ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap gap-4 mt-4", className)}
    {...props}
  >
    {items.map((item, index) => (
      <div key={index} className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-sm text-slate-gray">{item.label}</span>
      </div>
    ))}
  </div>
));
ChartLegend.displayName = "ChartLegend";

const chartColors = {
  primary: "#60A5FA",
  secondary: "#8B5CF6",
  accent: "#7C3AED",
  growth: "#22C55E",
  drop: "#EF4444",
  neutral: "#94A3B8",
};

const gradientColors = {
  blueToViolet: {
    from: "#60A5FA",
    to: "#8B5CF6",
  },
  royalToDeep: {
    from: "#2563EB",
    to: "#7C3AED",
  },
};

export {
  ChartContainer,
  ChartHeader,
  ChartTitle,
  ChartDescription,
  ChartContent,
  ChartLegend,
  chartColors,
  gradientColors,
};
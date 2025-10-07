# Dashboard Charts & Statistics Design Guide

## Overview

This document defines the standard patterns for all dashboard metric cards, statistics displays, and data visualizations across the Wizel platform. Use this as the base reference for implementing any dashboard or reporting interface.

**Reference Styles**: See `/context/CHART_DESIGN_PRINCIPLES.md` for chart style variations
**Live Demo**: View chart styles at [http://localhost:3000/graphs](http://localhost:3000/graphs)
**Recommended Style**: **Combined** (Minimalist cards + Gradient Modern charts)

---

## Metric Cards - Standard Pattern

### Basic Structure

**Purpose**: Display key performance indicators (KPIs) with period-over-period comparison

**Required Elements**:
1. **Metric Title**: What is being measured
2. **Current Value**: Primary metric (large, bold)
3. **Change Indicator**: Percentage change with color coding
4. **Previous Period Value**: Context for comparison
5. **Icon**: Visual identifier for metric type

### Standard Implementation

```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";

export function MetricCard({
  title,
  currentValue,
  previousValue,
  format = "number",
  icon: Icon
}) {
  // Calculate change
  const change = previousValue > 0
    ? ((currentValue - previousValue) / previousValue) * 100
    : 0;

  const isPositive = change >= 0;
  const isNegative = change < 0;

  // Format values based on type
  const formatValue = (value) => {
    if (format === "currency") return formatCurrency(value);
    if (format === "percentage") return formatPercentage(value);
    return formatNumber(value);
  };

  return (
    <Card className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {formatValue(currentValue)}
        </div>

        {/* Change Indicator with Color Coding */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            isPositive ? 'text-green-600 dark:text-green-400' :
            isNegative ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isPositive && '+'}
            {change.toFixed(1)}%
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            from last period
          </span>
        </div>

        {/* Previous Period Value */}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Previous: {formatValue(previousValue)}
        </p>
      </CardContent>
    </Card>
  );
}
```

### Usage Example

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard
    title="Total Revenue"
    currentValue={331000}
    previousValue={294600}
    format="currency"
    icon={DollarSign}
  />

  <MetricCard
    title="Total Customers"
    currentValue={5500}
    previousValue={5080}
    format="number"
    icon={Users}
  />

  <MetricCard
    title="Avg Order Value"
    currentValue={192}
    previousValue={182.60}
    format="currency"
    icon={Target}
  />

  <MetricCard
    title="Engagement Rate"
    currentValue={26.0}
    previousValue={25.14}
    format="percentage"
    icon={TrendingUp}
  />
</div>
```

---

## Color Coding Standards

### Change Indicators

**CRITICAL**: Always use semantic colors for percentage changes

#### Positive Changes (Green)
```scss
// Light mode
$positive-text: #059669;      // green-600
$positive-bg: #D1FAE5;         // green-50

// Dark mode
$positive-text-dark: #34D399;  // green-400
$positive-bg-dark: rgba(52, 211, 153, 0.1);
```

**Implementation**:
```jsx
<span className="text-green-600 dark:text-green-400 font-semibold">
  +12.5%
</span>
```

#### Negative Changes (Red)
```scss
// Light mode
$negative-text: #DC2626;       // red-600
$negative-bg: #FEE2E2;          // red-50

// Dark mode
$negative-text-dark: #F87171;  // red-400
$negative-bg-dark: rgba(248, 113, 113, 0.1);
```

**Implementation**:
```jsx
<span className="text-red-600 dark:text-red-400 font-semibold">
  -8.2%
</span>
```

#### Neutral/No Change (Gray)
```scss
$neutral-text: #6B7280;        // gray-500
$neutral-text-dark: #9CA3AF;   // gray-400
```

**Implementation**:
```jsx
<span className="text-gray-600 dark:text-gray-400 font-semibold">
  0.0%
</span>
```

### Icons for Trend Direction

**Always include visual indicators alongside color**:

```jsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Positive change
{change > 0 && (
  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
    <TrendingUp className="h-3 w-3" />
    <span>+{change.toFixed(1)}%</span>
  </div>
)}

// Negative change
{change < 0 && (
  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
    <TrendingDown className="h-3 w-3" />
    <span>{change.toFixed(1)}%</span>
  </div>
)}

// No change
{change === 0 && (
  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
    <Minus className="h-3 w-3" />
    <span>0.0%</span>
  </div>
)}
```

---

## Metric Card Variations

### 1. Minimalist Card (Recommended for Dashboards)

**Characteristics**:
- Clean borders (1px)
- No gradients or heavy shadows
- Monochrome icons
- Clear typography hierarchy

```jsx
<Card className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
      Total Revenue
    </CardTitle>
    <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      $331K
    </div>
    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-2">
      +12.5% from last period
    </p>
    <p className="text-xs text-gray-500 mt-1">
      Previous: $294.6K
    </p>
  </CardContent>
</Card>
```

### 2. Gradient Accent Card

**When to Use**: Marketing dashboards, high-impact presentations

```jsx
<Card className="relative overflow-hidden border-2 border-transparent hover:border-sky-blue transition-all hover:shadow-lg">
  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 opacity-5"></div>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
      Total Revenue
    </CardTitle>
    <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600">
      <DollarSign className="h-4 w-4 text-white" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      $331K
    </div>
    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
      <TrendingUp className="h-3 w-3" />
      +12.5% from last period
    </p>
    <p className="text-xs text-gray-500 mt-1">
      Previous: $294.6K
    </p>
  </CardContent>
</Card>
```

### 3. Corporate Card with Left Border

**When to Use**: Executive dashboards, financial reports

```jsx
<Card className="border-l-4 shadow-md hover:shadow-lg transition-shadow"
      style={{ borderLeftColor: '#059669' }}>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
      Total Revenue
    </CardTitle>
    <div className="p-2 rounded" style={{ backgroundColor: '#D1FAE5' }}>
      <DollarSign className="h-5 w-5 text-green-600" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
      $331K
    </div>
    <p className="text-xs font-semibold text-green-600 mt-2">
      +12.5% from last period
    </p>
    <p className="text-xs text-gray-500 mt-1">
      Previous: $294.6K
    </p>
  </CardContent>
</Card>
```

---

## Period Comparison Patterns

### Time Period Selector

**Standard Implementation**:

```jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Calendar } from "lucide-react";

export function PeriodSelector({ period, onChange }) {
  return (
    <Select value={period} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <Calendar className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Today vs Yesterday</SelectItem>
        <SelectItem value="week">This Week vs Last Week</SelectItem>
        <SelectItem value="month">This Month vs Last Month</SelectItem>
        <SelectItem value="quarter">This Quarter vs Last Quarter</SelectItem>
        <SelectItem value="year">This Year vs Last Year</SelectItem>
        <SelectItem value="custom">Custom Range</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### Comparison Label Format

**Standard Pattern**:
```jsx
// Dynamic comparison text based on period
const getComparisonLabel = (period) => {
  const labels = {
    today: 'from yesterday',
    week: 'from last week',
    month: 'from last month',
    quarter: 'from last quarter',
    year: 'from last year',
    custom: 'from previous period'
  };
  return labels[period] || 'from last period';
};

// Usage
<p className="text-xs text-gray-600 dark:text-gray-400">
  +12.5% {getComparisonLabel(selectedPeriod)}
</p>
```

---

## Typography Standards for Metrics

### Font Sizes

```scss
// Card title
$metric-title: 0.875rem;     // text-sm (14px)

// Primary metric value
$metric-value: 1.5rem;       // text-2xl (24px)
$metric-value-large: 1.875rem; // text-3xl (30px) - for emphasis

// Change indicator
$change-text: 0.75rem;       // text-xs (12px)

// Previous value label
$previous-label: 0.75rem;    // text-xs (12px)
```

### Font Weights

```scss
// Card title
$title-weight: 500;          // font-medium

// Metric value
$value-weight: 700;          // font-bold
$value-weight-heavy: 800;    // font-extrabold (corporate style)

// Change indicator
$change-weight: 600;         // font-semibold

// Previous value
$previous-weight: 400;       // font-normal
```

### Implementation

```jsx
// Standard metric card typography
<CardTitle className="text-sm font-medium">Title</CardTitle>
<div className="text-2xl font-bold">$331K</div>
<p className="text-xs font-semibold">+12.5%</p>
<p className="text-xs text-gray-500">Previous: $294.6K</p>

// Corporate/emphasis style
<CardTitle className="text-sm font-semibold uppercase tracking-wide">Title</CardTitle>
<div className="text-3xl font-extrabold">$331K</div>
```

---

## Data Formatting Requirements

### CRITICAL: Always Use Centralized Formatters

**Import from `/lib/utils.js`**:

```javascript
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatPercentageChange
} from '@/lib/utils';
```

### Format Functions

#### formatNumber(value)
```javascript
formatNumber(856)       // "856"
formatNumber(1200)      // "1.2K"
formatNumber(1034567)   // "1.03M"
formatNumber(2450000000) // "2.45B"
```

#### formatCurrency(value)
```javascript
formatCurrency(12.34)     // "$12.34"
formatCurrency(1200)      // "$1.2K"
formatCurrency(1034567)   // "$1.03M"
```

#### formatPercentage(value)
```javascript
formatPercentage(12.345)  // "12.3%"
formatPercentage(0.5)     // "0.5%"
formatPercentage(100)     // "100.0%"
```

#### formatPercentageChange(change)
```javascript
formatPercentageChange(12.5)   // "+12.5%"
formatPercentageChange(-8.2)   // "-8.2%"
formatPercentageChange(0)      // "0.0%"
```

### Usage in Components

```jsx
// Metric value
<div className="text-2xl font-bold">
  {formatCurrency(currentValue)}
</div>

// Change indicator
<p className="text-xs font-semibold text-green-600">
  {formatPercentageChange(change)} from last period
</p>

// Previous value
<p className="text-xs text-gray-500">
  Previous: {formatCurrency(previousValue)}
</p>
```

---

## Responsive Grid Layouts

### Standard Metric Grid

```jsx
// 4-column metric grid (responsive)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard {...metric1} />
  <MetricCard {...metric2} />
  <MetricCard {...metric3} />
  <MetricCard {...metric4} />
</div>
```

**Breakpoints**:
- **Mobile (< 640px)**: 1 column
- **Tablet (640px - 1024px)**: 2 columns
- **Desktop (> 1024px)**: 4 columns

### Alternative Layouts

```jsx
// 3-column grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 6-column grid (2 rows)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

// Mixed layout (large + small cards)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">
    {/* Large featured metric */}
  </div>
  <div className="space-y-4">
    {/* Stacked smaller metrics */}
  </div>
</div>
```

---

## Complete Dashboard Example

### Full Implementation

```jsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { DollarSign, Users, Target, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import MorphingLoader from '@/app/components/ui/loading';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/metrics?period=${period}`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader size="large" text="Loading dashboard..." />
      </div>
    );
  }

  const calculateChange = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const MetricCard = ({ title, current, previous, format, icon: Icon }) => {
    const change = calculateChange(current, previous);
    const isPositive = change >= 0;

    const formatValue = (value) => {
      if (format === 'currency') return formatCurrency(value);
      if (format === 'percentage') return formatPercentage(value);
      return formatNumber(value);
    };

    return (
      <Card className="border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatValue(current)}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive && '+'}{change.toFixed(1)}%
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              from last {period}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Previous: {formatValue(previous)}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          current={metrics.revenue.current}
          previous={metrics.revenue.previous}
          format="currency"
          icon={DollarSign}
        />
        <MetricCard
          title="Total Customers"
          current={metrics.customers.current}
          previous={metrics.customers.previous}
          format="number"
          icon={Users}
        />
        <MetricCard
          title="Avg Order Value"
          current={metrics.aov.current}
          previous={metrics.aov.previous}
          format="currency"
          icon={Target}
        />
        <MetricCard
          title="Engagement Rate"
          current={metrics.engagement.current}
          previous={metrics.engagement.previous}
          format="percentage"
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}
```

---

## API Response Format

### Standard Metrics API Response

```json
{
  "period": "month",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "previousStartDate": "2024-12-01",
  "previousEndDate": "2024-12-31",
  "metrics": {
    "revenue": {
      "current": 331000,
      "previous": 294600,
      "change": 12.35,
      "changeType": "positive"
    },
    "customers": {
      "current": 5500,
      "previous": 5080,
      "change": 8.27,
      "changeType": "positive"
    },
    "aov": {
      "current": 192.00,
      "previous": 182.60,
      "change": 5.15,
      "changeType": "positive"
    },
    "engagement": {
      "current": 26.0,
      "previous": 25.14,
      "change": 3.42,
      "changeType": "positive"
    }
  }
}
```

### API Endpoint Pattern

```javascript
// /app/api/dashboard/metrics/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';

  // Calculate date ranges
  const { current, previous } = calculateDateRanges(period);

  // Fetch metrics
  const currentMetrics = await fetchMetrics(current.start, current.end);
  const previousMetrics = await fetchMetrics(previous.start, previous.end);

  // Calculate changes
  const metrics = {
    revenue: {
      current: currentMetrics.revenue,
      previous: previousMetrics.revenue,
      change: calculateChange(currentMetrics.revenue, previousMetrics.revenue),
    },
    // ... other metrics
  };

  return NextResponse.json({ metrics, period });
}
```

---

## Loading States

### Skeleton Loaders for Metrics

```jsx
import { Skeleton } from "@/app/components/ui/skeleton";

export function MetricCardSkeleton() {
  return (
    <Card className="border border-gray-300 dark:border-gray-600">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

// Usage
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCardSkeleton />
    <MetricCardSkeleton />
    <MetricCardSkeleton />
    <MetricCardSkeleton />
  </div>
) : (
  <MetricsGrid metrics={metrics} />
)}
```

---

## Accessibility Requirements

### Screen Reader Support

```jsx
<Card aria-label={`${title} metric card`}>
  <CardHeader>
    <CardTitle id={`${title}-title`}>
      {title}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div
      className="text-2xl font-bold"
      aria-labelledby={`${title}-title`}
      aria-describedby={`${title}-change`}
    >
      {formatValue(current)}
    </div>
    <p
      id={`${title}-change`}
      className="text-xs"
      aria-live="polite"
    >
      {change >= 0 ? 'Increased' : 'Decreased'} by {Math.abs(change).toFixed(1)}% from previous period
    </p>
  </CardContent>
</Card>
```

### Color Independence

**NEVER rely on color alone** - always include icons or text:

```jsx
// ✅ CORRECT - Icon + Color + Text
<div className="flex items-center gap-1 text-green-600">
  <TrendingUp className="h-3 w-3" />
  <span>+12.5% increase</span>
</div>

// ❌ WRONG - Color only
<span className="text-green-600">+12.5%</span>
```

---

## Common Metric Types

### Revenue Metrics
```jsx
<MetricCard
  title="Total Revenue"
  icon={DollarSign}
  format="currency"
  semantic="positive-is-good"
/>
```

### Customer Metrics
```jsx
<MetricCard
  title="Total Customers"
  icon={Users}
  format="number"
  semantic="positive-is-good"
/>

<MetricCard
  title="Churn Rate"
  icon={UserMinus}
  format="percentage"
  semantic="negative-is-good"  // Red when increasing
/>
```

### Engagement Metrics
```jsx
<MetricCard
  title="Open Rate"
  icon={Eye}
  format="percentage"
  semantic="positive-is-good"
/>

<MetricCard
  title="Click Rate"
  icon={MousePointer}
  format="percentage"
  semantic="positive-is-good"
/>
```

### Performance Metrics
```jsx
<MetricCard
  title="Conversion Rate"
  icon={Target}
  format="percentage"
  semantic="positive-is-good"
/>

<MetricCard
  title="Avg Response Time"
  icon={Clock}
  format="duration"
  semantic="negative-is-good"  // Red when increasing
/>
```

---

## Design Checklist

Before implementing dashboard metrics:

- [ ] Use centralized formatters from `/lib/utils.js`
- [ ] Include previous period value for context
- [ ] Color-code changes (green=positive, red=negative)
- [ ] Add trend icons (TrendingUp/TrendingDown)
- [ ] Show percentage change with proper sign (+/-)
- [ ] Include "from last period" label
- [ ] Use proper semantic colors based on metric type
- [ ] Implement loading states with MorphingLoader
- [ ] Add skeleton loaders for metric cards
- [ ] Test in both light and dark modes
- [ ] Verify WCAG AA contrast ratios
- [ ] Include proper ARIA labels
- [ ] Make responsive (1/2/4 column grid)
- [ ] Handle edge cases (zero division, null values)

---

## Version History

- **v1.0** (2025-10-07): Initial dashboard charts and statistics guide

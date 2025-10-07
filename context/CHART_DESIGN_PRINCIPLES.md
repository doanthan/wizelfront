# Chart Design Principles & Style Guide

## Overview

This document defines the chart and data visualization design principles for the Wizel platform. We provide 4 distinct chart styles that can be applied consistently across dashboards and reporting interfaces.

**Live Demo**: View all styles at [http://localhost:3000/graphs](http://localhost:3000/graphs)

---

## Design Philosophy

### Core Principles

1. **Clarity First**: Charts should communicate data clearly and accurately
2. **Consistent Formatting**: Use centralized formatters from `/lib/utils.js`
3. **Accessibility**: Meet WCAG AA standards (4.5:1 contrast minimum)
4. **Responsive Design**: Charts adapt to all screen sizes (min-h-[300px])
5. **Dark Mode Support**: All charts work in both light and dark themes

### When to Use Charts

- **Trends Over Time**: Line charts, area charts
- **Comparisons**: Bar charts, grouped bars
- **Proportions**: Pie charts, donut charts
- **Distributions**: Histograms, scatter plots
- **Relationships**: Scatter plots, bubble charts

---

## Chart Style Guide

We offer 4 distinct chart design styles, each optimized for different use cases:

### 1. Gradient Modern 🎨

**Best For**: Modern SaaS dashboards, marketing analytics, high-impact presentations

**Characteristics**:
- Vibrant gradients on charts and cards
- Elevation with shadows (shadow-lg, hover:shadow-xl)
- Brand colors: Sky Blue (#60A5FA) to Vivid Violet (#8B5CF6)
- Bold visual hierarchy with 2px borders
- Gradient backgrounds on metric cards and headers

**Color Palette**:
```scss
// Primary gradients
$gradient-revenue: linear-gradient(180deg, #60A5FA 0%, #8B5CF6 100%);
$gradient-engagement: linear-gradient(180deg, #F59E0B 0%, #DC2626 100%);

// Card gradients
$gradient-header: linear-gradient(90deg, #E0F2FE 0%, #EDE9FE 100%);

// Metric card gradients
$green-gradient: from-green-400 to-emerald-600;
$blue-gradient: from-sky-blue to-royal-blue;
$purple-gradient: from-vivid-violet to-deep-purple;
$amber-gradient: from-amber-400 to-orange-600;
```

**Typography**:
- Card titles: text-lg font-semibold
- Metric values: text-2xl font-bold
- Axis labels: text-xs
- Chart data: font-semibold for emphasis

**Implementation Example**:
```jsx
<Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl">
  <CardHeader className="bg-gradient-to-r from-sky-50 to-purple-50">
    <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <Area fill="url(#revenueGradient)" stroke="#60A5FA" strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

### 2. Minimalist Clean 📊

**Best For**: Professional reports, data-focused dashboards, print-friendly designs

**Characteristics**:
- Monochrome gray palette (#374151 to #D1D5DB)
- Clean single-pixel borders
- No gradients or heavy shadows
- Maximum focus on data
- Generous whitespace

**Color Palette**:
```scss
// Grayscale palette
$gray-900: #111827;  // Primary text
$gray-700: #374151;  // Chart primary
$gray-600: #4B5563;  // Chart secondary
$gray-500: #6B7280;  // Tertiary elements
$gray-400: #9CA3AF;  // Disabled/meta
$gray-300: #D1D5DB;  // Borders/grid
$gray-200: #E5E7EB;  // Subtle borders
$gray-100: #F3F4F6;  // Light fills
```

**Typography**:
- Card titles: text-lg font-medium (not bold)
- Metric values: text-2xl font-bold
- Axis labels: text-xs (11px)
- Clean hierarchy with minimal emphasis

**Implementation Example**:
```jsx
<Card className="border border-gray-300">
  <CardHeader className="border-b border-gray-200">
    <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
        <Area
          dataKey="revenue"
          stroke="#6B7280"
          strokeWidth={2}
          fill="#F3F4F6"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

### 3. Bold Corporate 💼

**Best For**: Executive dashboards, financial reports, corporate presentations, annual reports

**Characteristics**:
- Strong saturated colors (#1E40AF to #3B82F6)
- Bold/extrabold typography (600-800 weights)
- Uppercase titles with letter-spacing
- Thick borders (4px top borders on cards)
- High contrast and visual weight

**Color Palette**:
```scss
// Corporate blue scale
$navy-900: #1E3A8A;  // Darkest
$navy-800: #1E40AF;  // Very dark
$blue-700: #1D4ED8;  // Dark
$blue-600: #2563EB;  // Primary
$blue-500: #3B82F6;  // Standard
$blue-400: #60A5FA;  // Light
$blue-300: #93C5FD;  // Very light

// Semantic accents
$green-600: #059669;  // Success/revenue
$red-600: #DC2626;    // Alerts/losses
$purple-600: #7C3AED; // Engagement
```

**Typography**:
- Card titles: text-lg font-bold uppercase tracking-wide
- Metric values: text-3xl font-extrabold
- Axis labels: text-xs font-semibold
- High contrast, professional hierarchy

**Implementation Example**:
```jsx
<Card className="border-t-4 border-t-blue-600 shadow-md">
  <CardHeader className="bg-slate-50 border-b-2 border-gray-200">
    <CardTitle className="text-lg font-bold uppercase tracking-wide">
      Revenue Trend
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-6">
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" strokeWidth={1} />
        <Area
          dataKey="revenue"
          stroke="#2563EB"
          strokeWidth={3}
          fill="#3B82F6"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

### 4. Soft Pastel 🌸

**Best For**: Wellness apps, lifestyle dashboards, creative portfolios, user-friendly interfaces

**Characteristics**:
- Pastel color palette (50-200 range)
- Soft gradient backgrounds on cards
- Rounded corners (rounded-xl)
- Gentle, calming aesthetic
- White strokes on chart elements

**Color Palette**:
```scss
// Pastel palette
$emerald-200: #A7F3D0;  // Soft green
$blue-200: #BFDBFE;     // Soft blue
$purple-200: #DDD6FE;   // Soft purple
$orange-200: #FED7AA;   // Soft orange
$red-200: #FECACA;      // Soft red
$pink-200: #FBCFE8;     // Soft pink

// Background gradients
$pastel-blue: from-blue-50 to-purple-50;
$pastel-pink: from-pink-50 to-purple-50;
$pastel-amber: from-amber-50 to-orange-50;
$pastel-green: from-green-50 to-teal-50;
```

**Typography**:
- Card titles: text-lg font-medium
- Metric values: text-2xl font-semibold (not bold)
- Axis labels: text-xs
- Soft, approachable hierarchy

**Implementation Example**:
```jsx
<Card className="border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
  <CardHeader>
    <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
  </CardHeader>
  <CardContent className="pt-2">
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="pastelRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.6}/>
            <stop offset="95%" stopColor="#DDD6FE" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <Area
          dataKey="revenue"
          stroke="#93C5FD"
          strokeWidth={2}
          fill="url(#pastelRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

## Common Chart Components

### Metric Cards (KPI Cards)

**Purpose**: Display key performance indicators (KPIs) with context

We provide **two distinct KPI card styles** to match different dashboard aesthetics:

---

#### Style 1: Minimalist KPI Cards (Default)

**Best For**: Professional dashboards, clean interfaces, maximum data focus

**Characteristics**:
- Default card borders (1px)
- No background gradients
- Subtle gray icons
- Clean, unobtrusive design
- Small titles (text-sm)
- Standard metric size (text-2xl)

**Implementation**:
```jsx
{/* Minimalist KPI Card - Used in Dashboard */}
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <div className="flex items-center gap-2">
      <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Overall Revenue
      </CardTitle>
      <UITooltip>
        <TooltipTrigger>
          <InfoCircledIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold mb-1">Overall Revenue</p>
          <p className="text-sm">Total revenue from all orders in the selected period.</p>
        </TooltipContent>
      </UITooltip>
    </div>
    <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {formatCurrency(value)}
    </div>
    <p className="text-xs flex items-center gap-1 text-green-600 dark:text-green-500">
      <ArrowUp className="h-3 w-3" />
      12.5% from last period
    </p>
  </CardContent>
</Card>
```

**Key Features**:
- Clean, professional appearance
- Maximum focus on the metric value
- Minimal visual weight
- Perfect for data-heavy dashboards
- Works well with many cards on screen

**Visual Specs**:
- Border: `border` (1px default)
- Shadow: None (default)
- Header: No background color
- Title: `text-sm font-medium`
- Icon: `h-4 w-4 text-gray-600`
- Metric: `text-2xl font-bold`
- Change: `text-xs` with green/red

---

#### Style 2: Gradient Modern KPI Cards

**Best For**: Marketing dashboards, analytics pages, report pages, feature-rich interfaces

**Characteristics**:
- Thick borders (2px)
- Gradient headers (sky-50 to purple-50)
- Elevated shadows (shadow-lg, hover:shadow-xl)
- Colorful brand icons
- Larger titles (text-lg)
- Bigger metrics (text-3xl font-extrabold)

**Implementation**:
```jsx
{/* Gradient Modern KPI Card - Used in Customer Reports */}
<Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
    <div className="flex items-center gap-2">
      <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
        Overall Revenue
      </CardTitle>
      <UITooltip>
        <TooltipTrigger>
          <InfoCircledIcon className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-2 border-sky-blue bg-white dark:bg-gray-900">
          <p className="font-semibold mb-1">Overall Revenue</p>
          <p className="text-sm">Total revenue from all orders in the selected period.</p>
        </TooltipContent>
      </UITooltip>
    </div>
    <DollarSign className="h-5 w-5 text-sky-blue" />
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
      {formatCurrency(value)}
    </div>
    <p className="text-sm font-medium flex items-center gap-1 text-green-600 dark:text-green-500">
      <ArrowUp className="h-4 w-4" />
      12.5% from last period
    </p>
  </CardContent>
</Card>
```

**Key Features**:
- Eye-catching, premium appearance
- Brand colors integrated throughout
- Interactive hover states
- Perfect for marketing/analytics pages
- Creates visual hierarchy

**Visual Specs**:
- Border: `border-2 border-gray-200`
- Shadow: `shadow-lg hover:shadow-xl transition-shadow`
- Header: `bg-gradient-to-r from-sky-50 to-purple-50`
- Title: `text-lg font-bold`
- Icon: `h-5 w-5 text-sky-blue` (brand colors)
- Metric: `text-3xl font-extrabold`
- Change: `text-sm font-medium` with green/red

**Brand Icon Colors**:
```jsx
// Different brand colors for each metric type
<DollarSign className="h-5 w-5 text-sky-blue" />      // Revenue metrics
<Target className="h-5 w-5 text-vivid-violet" />      // Attribution
<ShoppingCart className="h-5 w-5 text-royal-blue" />  // Orders
<Users className="h-5 w-5 text-deep-purple" />        // Customers
```

---

#### When to Use Each Style

| Context | Card Style | Rationale |
|---------|-----------|-----------|
| **Main Dashboard** | Minimalist | Clean, professional, many cards visible |
| **Customer Reports** | Gradient Modern | Feature-rich, detailed analysis pages |
| **Revenue Reports** | Gradient Modern | Marketing-focused, visually engaging |
| **Product Analytics** | Gradient Modern | Data storytelling, insights focus |
| **Executive Summary** | Minimalist | Professional, print-friendly |
| **Real-time Monitoring** | Minimalist | Maximum data density |
| **Campaign Performance** | Gradient Modern | Brand-aligned, eye-catching |
| **Multi-Account View** | Minimalist | Clean comparison across accounts |

**Grid Layout** (applies to both styles):
- Desktop (lg): 4 columns
- Tablet (md): 2 columns
- Mobile: 1 column
- Gap: gap-4 (16px)

### Custom Tooltips

**Purpose**: Show detailed information on hover

**Standard Pattern**:
```jsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border-2 border-sky-blue shadow-xl rounded-lg p-3">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
            <span className="font-semibold">
              {formatValue(entry.value, entry.name)}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
```

**Tooltip Styling**:
- Solid background (white/gray-800)
- Border matching chart style
- Shadow for elevation
- Rounded corners (rounded-lg)

### Chart Axes

**X-Axis (Time/Categories)**:
```jsx
<XAxis
  dataKey="month"
  stroke="#6B7280"
  style={{ fontSize: '12px' }}
/>
```

**Y-Axis (Values)**:
```jsx
<YAxis
  stroke="#6B7280"
  style={{ fontSize: '12px' }}
  tickFormatter={(value) => formatNumber(value)}
/>
```

**Grid Lines**:
```jsx
<CartesianGrid
  strokeDasharray="3 3"
  stroke="#E5E7EB"
  opacity={0.5}
/>
```

---

## Data Formatting

### CRITICAL: Always Use Centralized Formatters

**Import from `/lib/utils.js`**:
```javascript
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
```

### Number Formatting

**formatNumber(value)**:
- `856` → `856`
- `1,200` → `1.2K`
- `1,034,567` → `1.03M`
- `2,450,000,000` → `2.45B`

**Usage**:
```jsx
<YAxis tickFormatter={formatNumber} />
<div>{formatNumber(totalCustomers)}</div>
```

### Currency Formatting

**formatCurrency(value)**:
- `12.34` → `$12.34`
- `1,200` → `$1.2K`
- `1,034,567` → `$1.03M`

**Usage**:
```jsx
<YAxis tickFormatter={(value) => formatCurrency(value).replace('$', '')} />
<div>{formatCurrency(revenue)}</div>
```

### Percentage Formatting

**formatPercentage(value)**:
- `12.345` → `12.3%`
- `0.5` → `0.5%`

**Usage**:
```jsx
<div>{formatPercentage(openRate)}</div>
```

---

## Responsive Design

### Chart Sizing

**Minimum Height**: `min-h-[300px]` for all charts

**Responsive Container**:
```jsx
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    {/* Chart content */}
  </AreaChart>
</ResponsiveContainer>
```

### Grid Layouts

**Two-Column Layout**:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card>{/* Chart 1 */}</Card>
  <Card>{/* Chart 2 */}</Card>
</div>
```

**Four-Column Metrics**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>{/* Metric 1 */}</Card>
  <Card>{/* Metric 2 */}</Card>
  <Card>{/* Metric 3 */}</Card>
  <Card>{/* Metric 4 */}</Card>
</div>
```

### Breakpoints

- **Mobile**: < 640px - Stack all charts vertically
- **Tablet**: 640px - 1024px - 2 columns for charts, 2 columns for metrics
- **Desktop**: > 1024px - Full grid layouts

---

## Chart Type Guidelines

### Line Charts

**When to Use**:
- Time series data
- Trends over time
- Multiple metrics comparison

**Best Practices**:
- Max 3-4 lines per chart
- Use stroke width 2-3px
- Include data points (dots) with r=4-5
- Use distinct colors for each line

**Example**:
```jsx
<LineChart data={timeSeriesData}>
  <Line
    dataKey="orders"
    stroke="#60A5FA"
    strokeWidth={3}
    dot={{ fill: '#60A5FA', r: 4 }}
  />
</LineChart>
```

### Area Charts

**When to Use**:
- Single metric over time
- Emphasize volume/magnitude
- Show cumulative values

**Best Practices**:
- Use gradients for fill (5% to 95% opacity)
- Stroke width 2-3px
- opacity 0.1-0.3 for fill

**Example**:
```jsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
    </linearGradient>
  </defs>
  <Area fill="url(#gradient)" stroke="#60A5FA" />
</AreaChart>
```

### Bar Charts

**When to Use**:
- Category comparisons
- Ranking data
- Discrete values

**Best Practices**:
- Radius [8, 8, 0, 0] for rounded tops
- Use distinct colors for segments
- Include spacing between bars

**Example**:
```jsx
<BarChart data={segmentData}>
  <Bar dataKey="customers" radius={[8, 8, 0, 0]}>
    {segmentData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Bar>
</BarChart>
```

### Pie Charts

**When to Use**:
- Show proportions (max 5-7 slices)
- Part-to-whole relationships
- Revenue/customer distribution

**Best Practices**:
- Max 7 slices (combine smaller into "Other")
- Use semantic colors
- Include percentage labels
- Add white stroke for separation

**Example**:
```jsx
<PieChart>
  <Pie
    data={data}
    cx="50%"
    cy="50%"
    outerRadius={100}
    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
    stroke="#FFFFFF"
    strokeWidth={2}
  >
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
</PieChart>
```

---

## Color Usage

### Semantic Colors

**Success/Positive** (Revenue, Growth):
```scss
$green-500: #10B981;
$emerald-600: #059669;
```

**Warning/Caution** (At Risk):
```scss
$amber-500: #F59E0B;
$orange-500: #F97316;
```

**Danger/Negative** (Churn, Losses):
```scss
$red-500: #EF4444;
$red-600: #DC2626;
```

**Info/Neutral** (Metrics):
```scss
$blue-500: #3B82F6;
$sky-500: #60A5FA;
```

### RFM Segment Colors

**Standard Palette**:
```javascript
const SEGMENT_COLORS = {
  'Champions': '#10B981',      // Green
  'Loyal Customers': '#60A5FA', // Blue
  'Potential Loyalists': '#8B5CF6', // Purple
  'Recent Customers': '#34D399',    // Emerald
  'Promising': '#A78BFA',          // Light purple
  'Need Attention': '#FBBF24',     // Amber
  'About to Sleep': '#F59E0B',     // Orange
  'At Risk': '#EF4444',            // Red
  'Cannot Lose': '#DC2626',        // Dark red
  'Hibernating': '#9CA3AF',        // Gray
  'Lost': '#6B7280',               // Dark gray
};
```

---

## Accessibility

### Color Contrast

**WCAG AA Requirements**:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Testing**:
- Use browser DevTools Color Picker
- Test in both light and dark modes
- Never use color alone to convey information

### Alternative Text

**Chart Descriptions**:
```jsx
<div role="img" aria-label="Line chart showing revenue trend from January to June">
  <ResponsiveContainer>
    <LineChart>
      {/* Chart content */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

---

## Performance Optimization

### Data Sampling

For large datasets (>1000 points):
```javascript
// Sample data for performance
const sampledData = data.filter((_, index) => index % 10 === 0);
```

### Lazy Loading

```jsx
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('./Chart'), {
  loading: () => <MorphingLoader size="medium" />,
  ssr: false,
});
```

### Memoization

```jsx
const chartData = useMemo(() => {
  return processData(rawData);
}, [rawData]);
```

---

## Style Selection Guide

| Use Case | Recommended Style | Rationale |
|----------|------------------|-----------|
| Marketing Dashboard | Gradient Modern | Eye-catching, brand-forward |
| Financial Report | Bold Corporate | Professional, high contrast |
| Executive Summary | Bold Corporate | Clear hierarchy, authoritative |
| Customer Analytics | Gradient Modern | Engaging, visually appealing |
| Technical Documentation | Minimalist Clean | Focus on data, print-friendly |
| Wellness App | Soft Pastel | Calming, approachable |
| Creative Portfolio | Soft Pastel | Artistic, gentle |
| Data Science Report | Minimalist Clean | Maximum data clarity |

---

## Implementation Checklist

When creating new charts:

- [ ] Choose appropriate chart type for data
- [ ] Select design style (Gradient/Minimalist/Corporate/Pastel)
- [ ] Use centralized formatters from `/lib/utils.js`
- [ ] Implement custom tooltip with proper formatting
- [ ] Add responsive grid layout
- [ ] Test in both light and dark modes
- [ ] Verify WCAG AA contrast ratios
- [ ] Add loading states with MorphingLoader
- [ ] Include proper ARIA labels
- [ ] Test on mobile, tablet, and desktop

---

## Resources

- **Live Demo**: [http://localhost:3000/graphs](http://localhost:3000/graphs)
- **Design System**: `/context/design-principles.md`
- **Formatter Utilities**: `/lib/utils.js`
- **Recharts Documentation**: [https://recharts.org](https://recharts.org)
- **WCAG Guidelines**: [https://www.w3.org/WAI/WCAG21/quickref/](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Version History

- **v1.0** (2025-10-07): Initial chart design principles with 4 style variations

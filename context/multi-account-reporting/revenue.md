# Multi-Account Reporting - Revenue Tab Implementation

## Overview
The Revenue tab provides comprehensive revenue analytics across multiple Klaviyo accounts, enabling performance marketers to analyze email/SMS marketing effectiveness, attribution, and ROI at both aggregate and account-specific levels.

## Key Features

### 1. Main KPI Cards (Top Row)
Four primary metric cards displaying aggregate performance across all selected accounts:

#### Overall Revenue
- **Value**: Total revenue from all sources
- **Change Indicator**: Green/red arrow with percentage change vs comparison period
- **Display**: Inline change percentage next to value

#### Attributed Revenue
- **Value**: Revenue directly attributed to email/SMS marketing (Campaign + Flow revenue)
- **Subtitle**: Shows percentage of total revenue
- **Change Indicator**: Percentage change vs comparison period
- **Purpose**: Highlights marketing channel impact

#### Total Orders
- **Value**: Count of all orders
- **Subtitle**: AOV (Average Order Value) calculation
- **Change Indicator**: Order volume trend
- **Calculation**: AOV = Total Revenue ÷ Total Orders

#### Unique Customers
- **Value**: Total unique customers
- **Subtitle**: Breakdown of new vs returning customers
- **Change Indicator**: Customer growth trend
- **Segmentation**: Shows acquisition vs retention metrics

### 2. Channel Performance Cards (Second Row)
Three cards focused on channel-specific efficiency metrics:

#### Revenue per Email
- **Calculation**: Total Email Revenue ÷ Total Email Recipients
- **Subtitle**: Shows total emails sent
- **Info Icon**: Clickable popover with:
  - Formula explanation
  - Calculation methodology
  - Actual data breakdown (e.g., "$12,096.90 ÷ 4,565 emails = $2.65")
- **Purpose**: Email channel ROI metric

#### Revenue per SMS
- **Calculation**: Total SMS Revenue ÷ Total SMS Recipients
- **Subtitle**: Shows total SMS sent
- **Info Icon**: Detailed calculation popover
- **Purpose**: SMS channel ROI metric

#### Revenue per Recipient
- **Calculation**: Total Attributed Revenue ÷ Total Recipients (all channels)
- **Subtitle**: Shows total recipients across channels
- **Info Icon**: Comprehensive calculation details
- **Purpose**: Overall marketing efficiency metric

### 3. Revenue Trends Chart
Interactive line chart with multiple view options:

#### View Modes (Dropdown Selectors)
1. **Revenue Overview**: Overall vs Attributed Revenue comparison
2. **Channel Breakdown**: Email vs SMS vs Total Revenue
3. **Campaign vs Flow**: Source-based revenue attribution
4. **Attribution %**: Attribution percentage over time

#### Time Granularity Options
- Daily
- Weekly
- Monthly

#### Chart Features
- Responsive container with automatic resizing
- Hover tooltips showing exact values
- Legend for line identification
- Grid lines for easier reading
- Currency formatting on Y-axis

### 4. Account Performance Comparison Table

#### Column Structure
All columns are sortable with visual indicators (up/down arrows):

1. **Account**: Store/account name
2. **Revenue**: Total revenue with currency formatting
3. **Orders**: Order count with number formatting
4. **AOV**: Average order value
5. **Campaign Rev**: Revenue from campaigns
6. **Flow Rev**: Revenue from automated flows
7. **Email CTR**: Click-through rate percentage
8. **New vs Return**:
   - Return rate percentage (3 decimal precision)
   - Count breakdown (new/returning)
9. **Campaigns**: Number of campaigns sent
10. **Attr Rev/Recipient**: Attributed revenue per recipient
11. **Total Rev/Recipient**: Total revenue per recipient

#### Sorting Functionality
- Click column headers to sort
- Chevron icons indicate sortable columns
- Default sort: Total Revenue (descending)
- Maintains sort state during data updates

#### Total Row (Footer)
Aggregate calculations across all accounts:
- **Visual**: Bold font, gray background, thick top border
- **Calculations**:
  - Sum totals for revenue, orders, campaigns
  - Weighted averages for AOV, CTR, revenue per recipient
  - Combined customer counts
- **Purpose**: Quick overview of total performance

## Data Architecture

### API Endpoint
`/api/dashboard/multi-account-revenue`

#### Query Parameters
- `storeIds`: Comma-separated store IDs or 'all'
- `startDate`: ISO date string for period start
- `endDate`: ISO date string for period end
- `comparisonStartDate`: Comparison period start
- `comparisonEndDate`: Comparison period end
- `timeGranularity`: 'daily', 'weekly', or 'monthly'

### Data Sources
1. **ClickHouse Tables**:
   - `account_metrics_daily`: Primary source for aggregated metrics
   - Uses CTE (Common Table Expression) pattern for data freshness
   - LIMIT 1 BY clause ensures latest data per date

2. **MongoDB**:
   - Store metadata and naming
   - Klaviyo integration mapping

### ID Mapping
- **Store Public ID**: Internal identifier (e.g., "XAeU8VL")
- **Klaviyo Public ID**: Klaviyo account identifier (e.g., "XqkVGb")
- Critical: Must map store IDs to Klaviyo IDs for ClickHouse queries

## Performance Optimizations

### 1. Parallel Data Fetching
- All accounts data fetched independently of selection
- Allows instant filtering without re-fetching
- Background refresh on date range changes

### 2. Memoization
- `sortedAccountComparison`: Memoized sorting logic
- `sortedAllAccountComparison`: Separate memo for all accounts
- `totals`: Memoized aggregate calculations
- Prevents unnecessary recalculations on re-renders

### 3. ClickHouse Optimizations
- Uses latest data via ORDER BY and LIMIT BY
- Aggregations done in database where possible
- JavaScript calculations only for derived metrics

## Key Calculations

### Revenue Attribution
```javascript
attributed_revenue = campaign_revenue + flow_revenue
attribution_percentage = (attributed_revenue / total_revenue) * 100
```

### Recipients Calculation
```javascript
total_recipients = email_recipients + sms_recipients + push_recipients
```

### Revenue per Recipient
Two distinct metrics:
1. **Attributed**: `attributed_revenue / total_recipients`
2. **Total**: `total_revenue / total_recipients`

### Weighted Averages for Totals
- **AOV**: `total_revenue / total_orders` (not average of AOVs)
- **CTR**: `total_clicks / total_delivered * 100`
- **Return Rate**: `returning_customers / (new + returning) * 100`

## UI/UX Design Patterns

### Color Scheme
- **Positive changes**: Green (`text-green-600`)
- **Negative changes**: Red (`text-red-600`)
- **Icons removed**: Clean, data-focused interface
- **Subtle accents**: Gray backgrounds for headers/totals

### Interactive Elements
- **Hover states**: All clickable elements have hover effects
- **Tooltips**: Info icons reveal calculation details
- **Sorting indicators**: Small, subtle chevron icons
- **Loading states**: MorphingLoader component during data fetch

### Responsive Design
- Grid layouts adapt to screen size
- Table has horizontal scroll on mobile
- Charts resize automatically
- Cards stack on small screens

## State Management

### Local State
```javascript
- timeGranularity: Chart time grouping
- revenueMetric: Chart view type
- sortField/sortDirection: Table sorting
- isLoadingData: Loading states
```

### Props from Parent
```javascript
- selectedAccounts: Active account selection
- dateRangeSelection: Date range and comparison
- stores: Store metadata
- isLoading: Parent loading state
```

### LocalStorage
- Preserves user preferences between sessions
- Account selections
- Date range preferences

## Error Handling
- Graceful fallbacks for missing data
- Empty state handling
- Network error recovery
- Invalid date handling

## Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance

## Future Enhancement Opportunities
1. Export functionality for reports
2. Drill-down into specific campaigns
3. Custom metric calculations
4. Saved view templates
5. Automated insights/recommendations
6. Predictive analytics integration

## Testing Considerations
- Unit tests for calculation functions
- Integration tests for API endpoints
- E2E tests for sorting/filtering
- Performance benchmarks for large datasets
- Accessibility audits

This implementation provides a comprehensive, performant, and user-friendly revenue analytics experience for multi-account Klaviyo reporting, designed specifically for performance marketers who need quick insights and detailed analysis capabilities.
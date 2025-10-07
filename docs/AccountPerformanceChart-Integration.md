# Account Performance Chart - Integration Guide

## Overview
The `AccountPerformanceChart` component provides advanced performance visualization and scoring for ecommerce email marketing campaigns. It uses dynamic benchmarking to compare accounts against each other, providing relative performance scores without requiring industry-specific benchmarks.

## Key Features

### 1. **Multiple Visualization Modes**
- **Scorecard View**: Visual cards showing performance scores, tier ratings, and key metrics
- **Bar Comparison**: Traditional bar chart with performance tiers and reference lines
- **Scatter Plot**: 2D analysis of revenue efficiency ($/email vs $/click)
- **Radar Chart**: Multi-dimensional performance comparison across metrics

### 2. **Dynamic Benchmarking**
The component automatically calculates benchmarks from your account data:
- Averages across all accounts
- Median values for balanced comparison
- Percentile rankings (25th, 50th, 75th, 90th)
- Best performer identification

### 3. **Performance Scoring System**
Eight key performance metrics designed for marketers:
- **Revenue Efficiency**: $/recipient and $/click performance
- **Engagement Quality**: Click-through and conversion rates
- **Volume vs Performance**: Balance between reach and engagement
- **Conversion Funnel**: Effectiveness at each stage
- **Customer Value**: AOV and lifetime value indicators
- **List Health**: Engagement vs unsubscribes balance
- **Campaign ROI**: Revenue per campaign
- **Click Quality**: Value and conversion rate of clicks

### 4. **Visual Performance Tiers**
- **Top Performer (80-100%)**: Green - Top 20% of accounts
- **Above Average (60-79%)**: Blue - Better than most
- **Average (40-59%)**: Yellow - Middle of the pack
- **Below Average (20-39%)**: Orange - Room for improvement
- **Needs Attention (0-19%)**: Red - Bottom 20% requiring focus

## Integration Steps

### 1. Import the Component

```jsx
import AccountPerformanceChart from '@/app/components/campaigns/AccountPerformanceChart';
```

### 2. Prepare Account Data

The component expects account data in this format:

```javascript
const accountData = [
  {
    accountId: 'store_123',
    accountName: 'Store Name',

    // Revenue metrics
    revenue: 125000,
    averageOrderValue: 150,

    // Engagement metrics
    openRate: 22.5,  // as percentage
    clickRate: 3.2,   // as percentage
    conversionRate: 2.1,  // as percentage

    // Efficiency metrics
    revenuePerRecipient: 0.18,  // in dollars
    revenuePerClick: 6.50,  // in dollars

    // Funnel metrics
    clickToOpenRate: 14.2,  // as percentage
    clickToConversionRate: 65.6,  // as percentage

    // List metrics
    unsubscribeRate: 0.22,  // as percentage

    // Volume metrics
    recipients: 450000,
    opens: 101250,
    clicks: 14400,
    conversions: 945,
    campaigns: 42,

    // Calculated metrics
    revenuePerCampaign: 2976.19
  },
  // ... more accounts
];
```

### 3. Add to CampaignsTab

Replace the existing performance comparison section:

```jsx
// In CampaignsTab.jsx

{/* Replace existing "Campaign Performance by Account" card with: */}
<AccountPerformanceChart
  accountData={accountComparisonData}
  dateRange={dateRangeSelection}  // optional
/>
```

### 4. Data Transformation

If your existing data structure differs, transform it:

```javascript
// Transform existing accountComparisonData
const transformedData = accountComparisonData.map(account => ({
  accountId: account.accountId,
  accountName: account.accountName,

  // Map existing fields
  revenue: account.revenue,
  openRate: account.openRate,
  clickRate: account.clickRate,
  conversionRate: account.conversionRate,
  unsubscribeRate: account.unsubscribeRate || 0.25,

  // Calculate derived metrics
  averageOrderValue: account.averageOrderValue || (account.revenue / account.conversions),
  revenuePerRecipient: account.revenuePerRecipient || (account.revenue / account.recipients),
  revenuePerClick: account.revenuePerClick || (account.revenue / account.clicks),
  clickToOpenRate: account.clickToOpenRate || ((account.clicks / account.opens) * 100),
  clickToConversionRate: account.clickToConversionRate || ((account.conversions / account.clicks) * 100),
  revenuePerCampaign: account.revenuePerCampaign || (account.revenue / account.campaigns),

  // Volume metrics
  recipients: account.recipients || account.delivered,
  opens: account.opens || account.opensUnique,
  clicks: account.clicks || account.clicksUnique,
  conversions: account.conversions || account.conversionUniques,
  campaigns: account.campaigns || 1
}));

<AccountPerformanceChart accountData={transformedData} />
```

## Usage Examples

### Basic Implementation
```jsx
<AccountPerformanceChart
  accountData={accountData}
/>
```

### With Date Range Context
```jsx
<AccountPerformanceChart
  accountData={accountData}
  dateRange={{
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  }}
/>
```

### With Filtered Data
```jsx
// Show only active accounts with significant volume
const activeAccounts = accountData.filter(account =>
  account.recipients > 10000 && account.revenue > 1000
);

<AccountPerformanceChart
  accountData={activeAccounts}
/>
```

## How Scoring Works

### Dynamic Benchmark Calculation

The component automatically calculates benchmarks from your data:

1. **Averages**: Mean values across all accounts
2. **Percentiles**: 25th, 50th (median), 75th, and 90th percentiles
3. **Best Values**: Top performer for each metric

### Percentile-Based Scoring

Each account receives a score (0-100) based on its percentile ranking:

```
Score = (Rank / Total Accounts) * 100

Where Rank = number of accounts performing worse than this account
```

### Example:
- 8 accounts total
- Your account has $/click of $6.50
- 6 other accounts have lower $/click
- Your percentile score = (7/8) * 100 = 87.5%

### Multi-Metric Scoring

When a metric has multiple components (e.g., Revenue Efficiency uses both $/recipient and $/click):
1. Calculate percentile for each component
2. Average the percentiles
3. Result is the overall metric score

## Performance Insights

### Scorecard View
Best for: Quick daily checks
- Visual cards with color-coded performance tiers
- Top 3 accounts get rank badges (#1, #2, #3)
- Shows performance vs average with progress bars
- Percentile ranking displayed for context

### Bar Comparison View
Best for: Comparing all accounts at once
- Bars colored by performance tier
- Reference lines at 20%, 40%, 60%, 80%
- Optional secondary metric on right Y-axis
- Hover for detailed tooltips

### Scatter Plot View
Best for: Strategic analysis
- X-axis: $/Recipient (list quality)
- Y-axis: $/Click (engagement quality)
- Bubble size: Total revenue
- Quadrants show strategic positioning

### Radar Chart View
Best for: Multi-dimensional comparison
- Compares top 5 accounts
- Shows performance across 6 key metrics
- Identifies strengths and weaknesses
- Overall score summary for each account

## Best Practices

### 1. Data Quality
- Ensure all percentage values are in percentage format (not decimals)
- Revenue values should be in the same currency
- Handle missing data with sensible defaults or filter out incomplete records

### 2. Performance Optimization
- Limit to 20-30 accounts for optimal rendering
- For larger datasets, consider pagination or pre-filtering
- Cache calculated benchmarks if data doesn't change frequently

### 3. Interpretation Guidelines
- **Focus on red/orange accounts** - These need immediate attention
- **Study green accounts** - Identify what they're doing right
- **Use scatter plot** - Find accounts with similar profiles
- **Check radar chart** - See if accounts have consistent strengths

## Troubleshooting

### Common Issues

1. **All scores showing 50%**:
   - Check that account data includes all required metrics
   - Verify data values are numeric and not strings
   - Ensure at least 3 accounts for meaningful comparison

2. **Incorrect percentile rankings**:
   - Verify percentage values are in correct format (25 not 0.25 for 25%)
   - Check that revenue metrics are consistent (all in same currency)

3. **Chart rendering issues**:
   - Verify Recharts is installed: `npm install recharts`
   - Check ResponsiveContainer has defined height
   - Ensure account names are unique for proper chart keys

### Data Validation

Use this function to validate your data before passing to the component:

```javascript
function validateAccountData(accounts) {
  const requiredFields = [
    'accountId', 'accountName', 'revenue',
    'openRate', 'clickRate', 'conversionRate'
  ];

  return accounts.every(account => {
    // Check required fields exist
    const hasRequired = requiredFields.every(field =>
      account[field] !== undefined && account[field] !== null
    );

    // Check numeric values
    const hasValidNumbers = [
      'revenue', 'openRate', 'clickRate', 'conversionRate'
    ].every(field => typeof account[field] === 'number');

    return hasRequired && hasValidNumbers;
  });
}
```

## Migration from Old Chart

To migrate from the existing bar chart:

1. Keep existing data fetching logic
2. Transform data to include calculated metrics
3. Replace chart component
4. Remove any fixed benchmark references

The new component is backward-compatible with existing data structures when properly transformed.

## API Reference

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| accountData | Array | Yes | Array of account objects with metrics |
| dateRange | Object | No | Date range context for display |

### Account Data Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| accountId | string | Yes | Unique identifier |
| accountName | string | Yes | Display name |
| revenue | number | Yes | Total revenue |
| openRate | number | Yes | Email open rate (%) |
| clickRate | number | Yes | Email click rate (%) |
| conversionRate | number | Yes | Conversion rate (%) |
| revenuePerRecipient | number | No | Revenue per email sent |
| revenuePerClick | number | No | Revenue per click |
| averageOrderValue | number | No | Average order value |
| clickToOpenRate | number | No | Click-to-open rate (%) |
| unsubscribeRate | number | No | Unsubscribe rate (%) |
| recipients | number | No | Total recipients |
| campaigns | number | No | Number of campaigns |

## Future Enhancements

Potential features for future versions:
- Historical score tracking over time
- Export functionality for reports
- Custom metric definitions
- Score trend analysis
- Automated recommendations based on patterns
- Cohort analysis capabilities
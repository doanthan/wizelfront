# AI Context Usage Guide - Handling Large Datasets

## Problem: 900 Campaigns Don't Fit in Context

When you have **900 campaigns across 20 accounts over 90 days**, sending all raw data to Claude would:
- ❌ Use ~150,000 tokens (75% of context window)
- ❌ Make responses slow
- ❌ Risk hitting context limits
- ❌ Include mostly redundant data

## Solution: Smart Aggregation

Use the `aggregateCampaignsForAI()` helper function to reduce 900 campaigns down to ~5,000 tokens (97% reduction).

---

## Quick Start

### 1. Import the Aggregation Functions

```javascript
import { useAI, aggregateCampaignsForAI, aggregateFlowsForAI } from '@/app/contexts/ai-context';
```

### 2. Fetch Your Data (All 900 Campaigns)

```javascript
const [campaigns, setCampaigns] = useState([]);

useEffect(() => {
  async function loadData() {
    // Fetch ALL campaigns (can be 900+ items)
    const response = await fetch('/api/analytics/campaigns-clickhouse?accountIds=...');
    const data = await response.json();

    setCampaigns(data.campaigns); // Keep for UI display
  }

  loadData();
}, []);
```

### 3. Aggregate Before Sending to AI

```javascript
const { updateAIState } = useAI();

useEffect(() => {
  if (campaigns.length === 0) return;

  // 🚀 Aggregate 900 campaigns into AI-friendly summary
  const aggregatedData = aggregateCampaignsForAI(campaigns);

  // Update AI context with ONLY aggregated data
  updateAIState({
    pageType: 'campaigns',
    pageTitle: 'Multi-Account Campaign Performance',
    data: aggregatedData, // This is now compact!

    metrics: {
      primary: {
        totalRevenue: aggregatedData.aggregated.totalRevenue,
        openRate: aggregatedData.aggregated.avgOpenRate,
        clickRate: aggregatedData.aggregated.avgClickRate,
        conversionRate: aggregatedData.aggregated.avgConversionRate,
      },

      campaigns: {
        totalCampaigns: aggregatedData.summary.totalCampaigns,
        bestSendDay: aggregatedData.aggregated.bestSendDay,
        bestSendTime: aggregatedData.aggregated.bestSendHour,
      },
    },

    campaigns: {
      topPerformers: aggregatedData.topCampaigns.slice(0, 5),
      sendTimeAnalysis: {
        bestDay: aggregatedData.aggregated.bestSendDay,
        bestTime: aggregatedData.aggregated.bestSendHour,
      },
    },
  });
}, [campaigns, updateAIState]);
```

---

## What Gets Aggregated?

### ❌ Don't Send to AI:
- All 900 raw campaign objects
- Full recipient lists
- Individual click/open events
- Complete campaign histories

### ✅ Do Send to AI:

#### 1. **Top Performers Only** (10 campaigns)
```javascript
topCampaigns: [
  { name: "Black Friday Sale", revenue: 125678.50, openRate: 0.3456 },
  { name: "Cyber Monday", revenue: 98754.20, openRate: 0.2987 },
  // ... top 10 only
]
```

#### 2. **Aggregated Totals**
```javascript
aggregated: {
  totalCampaigns: 897,
  totalRevenue: 3456789.50,
  avgOpenRate: 0.2398,
  avgClickRate: 0.0295,
  bestSendDay: "Tuesday",
  bestSendHour: "14:00"
}
```

#### 3. **Time Series** (max 90 daily points or 13 weekly points)
```javascript
timeSeries: {
  daily: [
    { date: "2024-11-01", campaigns: 12, revenue: 23456.70 },
    { date: "2024-11-02", campaigns: 15, revenue: 34567.80 },
    // ... max 90 days
  ],
  weekly: [
    { week: "2024-11-03", campaigns: 89, revenue: 187654.30 },
    // ... max 13 weeks
  ]
}
```

#### 4. **Distributions** (aggregated by category)
```javascript
distributions: {
  byDay: {
    "Monday": { campaigns: 128, revenue: 487654.30, avgOpenRate: 0.2256 },
    "Tuesday": { campaigns: 156, revenue: 678901.20, avgOpenRate: 0.2421 },
    // ... 7 days total
  },

  byHour: {
    "10": { campaigns: 89, revenue: 267890.50 },
    "14": { campaigns: 98, revenue: 345678.90 },
    // ... 24 hours
  }
}
```

---

## Complete Example Component

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useAI, aggregateCampaignsForAI } from '@/app/contexts/ai-context';

export default function CampaignsTab() {
  const { updateAIState } = useAI();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch ALL campaigns
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch('/api/analytics/campaigns-clickhouse?accountIds=...');
        const data = await response.json();
        setCampaigns(data.campaigns); // Could be 900+ campaigns
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, []);

  // 2. Aggregate and send to AI context
  useEffect(() => {
    if (campaigns.length === 0) return;

    // 🚀 Aggregate 900 campaigns into compact summary
    const aggregatedData = aggregateCampaignsForAI(campaigns);

    // Calculate period-over-period comparison
    const currentRevenue = aggregatedData.aggregated.totalRevenue;
    const previousRevenue = 2987654.30; // From previous period
    const revenueChange = (currentRevenue - previousRevenue) / previousRevenue;

    // Update AI context
    updateAIState({
      currentPage: '/multi-account-reporting',
      pageTitle: 'Multi-Account Campaign Performance',
      pageType: 'campaigns',

      dateRange: {
        start: '2024-11-01',
        end: '2025-01-31',
        preset: 'last90days',
        seasonalContext: 'holiday-to-post-holiday',
      },

      data: aggregatedData, // Compact, AI-friendly format

      metrics: {
        primary: {
          totalRevenue: aggregatedData.aggregated.totalRevenue,
          totalRecipients: aggregatedData.aggregated.totalRecipients,
          openRate: aggregatedData.aggregated.avgOpenRate,
          clickRate: aggregatedData.aggregated.avgClickRate,
          conversionRate: aggregatedData.aggregated.avgConversionRate,
        },

        comparisons: {
          revenue: {
            current: currentRevenue,
            previous: previousRevenue,
            change: revenueChange,
            trend: revenueChange > 0 ? 'up' : 'down',
          },
        },

        campaigns: {
          totalCampaigns: aggregatedData.summary.totalCampaigns,
          avgCampaignsPerWeek: aggregatedData.summary.totalCampaigns / 13,
          bestSendDay: aggregatedData.aggregated.bestSendDay,
          bestSendTime: aggregatedData.aggregated.bestSendHour,
        },
      },

      campaigns: {
        topPerformers: aggregatedData.topCampaigns.slice(0, 5),
        sendTimeAnalysis: {
          bestDay: aggregatedData.aggregated.bestSendDay,
          bestTime: aggregatedData.aggregated.bestSendHour,
          insights: `${aggregatedData.aggregated.bestSendDay} ${aggregatedData.aggregated.bestSendHour} campaigns outperform average`,
        },
      },

      insights: {
        automated: [
          `${aggregatedData.summary.totalCampaigns} campaigns analyzed over 90 days`,
          `${aggregatedData.topCampaigns[0]?.name} is your top performer with $${(aggregatedData.topCampaigns[0]?.revenue / 1000).toFixed(1)}K revenue`,
          `${aggregatedData.aggregated.bestSendDay} ${aggregatedData.aggregated.bestSendHour} is your best send time`,
        ],
      },
    });
  }, [campaigns, updateAIState]);

  return (
    <div>
      {/* Your campaign table/chart UI here */}
      {/* Display all 900 campaigns in the UI */}
      {campaigns.map(campaign => (
        <div key={campaign.campaign_id}>
          {campaign.campaign_name}
        </div>
      ))}
    </div>
  );
}
```

---

## Data Size Comparison

| Approach | Data Size | Token Usage | Context % |
|----------|-----------|-------------|-----------|
| **Raw 900 campaigns** | ~2.5MB | ~150,000 tokens | 75% |
| **Aggregated data** | ~10KB | ~5,000 tokens | 2.5% |
| **Savings** | 99.6% smaller | 97% fewer tokens | ✅ |

---

## What the AI Can Still Answer

Even with aggregated data, your AI can answer:

### Revenue Questions
- ✅ "What's my total revenue this quarter?"
- ✅ "How does this compare to last quarter?"
- ✅ "What's my best performing campaign?"

### Send Time Optimization
- ✅ "When is the best time to send campaigns?"
- ✅ "Which day of the week performs best?"
- ✅ "Should I send on weekends?"

### Performance Analysis
- ✅ "How are my open rates trending?"
- ✅ "What's my average click rate?"
- ✅ "Which campaigns need improvement?"

### Strategic Insights
- ✅ "What patterns do you see in my data?"
- ✅ "What opportunities should I focus on?"
- ✅ "How can I improve my ROI?"

### What the AI Can't Answer (without full data)
- ❌ "Show me campaign #456's exact recipient list"
- ❌ "What was the subject line of the campaign sent on Nov 15 at 3:47 PM?"
- ❌ "List all campaigns with 'sale' in the name"

**Solution**: For specific campaign lookups, query your database directly instead of asking the AI.

---

## Performance Tips

### 1. **Aggregate Client-Side**
```javascript
// ✅ Good - Aggregate once after fetching
const aggregated = aggregateCampaignsForAI(campaigns);
updateAIState({ data: aggregated });
```

```javascript
// ❌ Bad - Sending raw data
updateAIState({ data: { campaigns } }); // Too large!
```

### 2. **Update Only When Data Changes**
```javascript
useEffect(() => {
  const aggregated = aggregateCampaignsForAI(campaigns);
  updateAIState({ data: aggregated });
}, [campaigns]); // Only when campaigns change
```

### 3. **Clear Context on Unmount**
```javascript
useEffect(() => {
  return () => {
    updateAIState({ data: null }); // Clear on unmount
  };
}, []);
```

---

## Advanced: Custom Aggregations

You can create custom aggregation functions for specific needs:

```javascript
export function aggregateCampaignsBySegment(campaigns) {
  const bySegment = {};

  campaigns.forEach(campaign => {
    const segment = campaign.segment_name || 'All Subscribers';

    if (!bySegment[segment]) {
      bySegment[segment] = {
        campaigns: 0,
        revenue: 0,
        recipients: 0,
        opens: 0,
      };
    }

    bySegment[segment].campaigns += 1;
    bySegment[segment].revenue += campaign.revenue || 0;
    bySegment[segment].recipients += campaign.recipients || 0;
    bySegment[segment].opens += campaign.opens_unique || 0;
  });

  // Calculate rates
  Object.keys(bySegment).forEach(segment => {
    const data = bySegment[segment];
    data.openRate = data.recipients > 0 ? data.opens / data.recipients : 0;
    data.revenuePerRecipient = data.recipients > 0 ? data.revenue / data.recipients : 0;
  });

  return bySegment;
}
```

---

## Summary

✅ **Always use `aggregateCampaignsForAI()` for large datasets**
✅ **Send only top performers, totals, and distributions**
✅ **Max 90 daily or 13 weekly time series points**
✅ **97% reduction in token usage**
✅ **AI still gets full marketing intelligence**

❌ **Never send raw campaign arrays to AI context**
❌ **Never send individual recipient data**
❌ **Never send more than needed**

---

## Questions?

See the example files:
- `/context/ai-context-optimized-example.json` - See what aggregated data looks like
- `/app/contexts/ai-context.jsx` - View the aggregation functions
- `/context/ai-context-example.json` - Compare to non-optimized version
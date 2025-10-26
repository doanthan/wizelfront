# Benchmark System Documentation

## Overview

The Benchmark System provides industry-standard performance metrics for email and SMS campaigns, allowing stores to compare their performance against vertical-specific benchmarks.

## Models

### Benchmark Model (`/models/Benchmark.js`)

Stores industry benchmark data organized by vertical, year, and version.

**Key Fields:**
- `vertical` - Industry category (health_beauty, fashion_apparel, etc.)
- `year` - Benchmark year (2024-2030)
- `version` - Quarterly version (e.g., "2025-Q1")
- `campaigns` - Campaign performance benchmarks (openRate, clickRate, conversionRate, rpr)
- `flows` - Flow-specific benchmarks (abandonedCart, welcome, browseAbandonment, etc.)
- `sms` - SMS performance benchmarks
- `insights` - Contextual insights for AI analysis
- `is_active` - Whether this benchmark is currently active

**Supported Verticals:**
1. `health_beauty` - Cosmetics, skincare, supplements, wellness
2. `fashion_apparel` - Clothing, shoes, accessories
3. `food_beverage` - Food, drinks, supplements
4. `home_garden` - Furniture, decor, gardening
5. `electronics` - Tech, gadgets, consumer electronics
6. `sports_fitness` - Athletic wear, equipment, nutrition
7. `jewelry_accessories` - Jewelry, watches, luxury goods
8. `general_retail` - Mixed/general e-commerce

### Store Model Updates (`/models/Store.js`)

Added fields to support benchmark relationships:

```javascript
vertical: {
  type: String,
  enum: ['health_beauty', 'fashion_apparel', 'food_beverage', ...],
  default: 'general_retail',
  index: true
},

aov: {
  type: Number,
  min: 0,
  default: null
}
```

## Usage Examples

### 1. Get Benchmark for a Store

```javascript
import Store from '@/models/Store';
import Benchmark from '@/models/Benchmark';

// Get store with its benchmark
const store = await Store.findOne({ public_id: 'XAeU8VL' });
const benchmark = await store.getBenchmark();

console.log('Store:', store.name);
console.log('Vertical:', store.vertical);
console.log('Campaign open rate benchmark:', benchmark.campaigns.openRate);
```

### 2. Compare Store Performance to Benchmark

```javascript
// Calculate store metrics from ClickHouse data
const storeMetrics = {
  campaigns: {
    openRate: 42.5,    // Store's actual open rate
    clickRate: 3.2,    // Store's actual click rate
    conversionRate: 5.1,
    rpr: 0.95
  },
  flows: {
    abandonedCart: {
      openRate: 55.0,
      clickRate: 8.5,
      conversionRate: 4.2,
      rpr: 15.5
    }
  },
  sms: {
    clickRate: 10.5,
    rpr: 0.75
  }
};

// Compare to benchmark
const comparison = await store.compareToBenchmark(storeMetrics);

console.log('Campaign Open Rate Comparison:');
console.log('  Actual:', comparison.campaigns.openRate.actual);
console.log('  Median:', comparison.campaigns.openRate.median);
console.log('  Top 10%:', comparison.campaigns.openRate.top10);
console.log('  Percentile:', comparison.campaigns.openRate.percentile);
console.log('  vs Median:', comparison.campaigns.openRate.vs_median_pct + '%');
```

**Sample Output:**
```
Campaign Open Rate Comparison:
  Actual: 42.5
  Median: 39.5
  Top 10%: 54.0
  Percentile: above_median
  vs Median: +7.6%
```

### 3. Get All Active Benchmarks

```javascript
import Benchmark from '@/models/Benchmark';

// Get all active benchmarks for 2025
const benchmarks = await Benchmark.getAllActiveBenchmarks(2025);

benchmarks.forEach(b => {
  console.log(`${b.vertical}: ${b.campaigns.openRate.median}% open rate`);
});
```

### 4. Create New Benchmark

```javascript
import Benchmark from '@/models/Benchmark';

const newBenchmark = await Benchmark.create({
  vertical: 'sports_fitness',
  year: 2025,
  version: '2025-Q2',
  campaigns: {
    openRate: { median: 38.0, top10: 52.0, top25: 43.0, bottom25: 31.0 },
    clickRate: { median: 2.1, top10: 5.5, top25: 3.0, bottom25: 1.2 },
    conversionRate: { median: 4.5, top10: 8.5, top25: 6.0, bottom25: 2.8 },
    rpr: { median: 0.22, top10: 1.1, top25: 0.5, bottom25: 0.09, currency: 'USD' }
  },
  flows: {
    abandonedCart: {
      openRate: { median: 52.0, top10: 70.0, top25: 60.0, bottom25: 44.0 },
      clickRate: { median: 7.2, top10: 14.0, top25: 10.0, bottom25: 5.0 },
      conversionRate: { median: 4.0, top10: 7.5, top25: 5.5, bottom25: 2.5 },
      rpr: { median: 5.5, top10: 28.0, top25: 12.0, bottom25: 2.8, currency: 'USD' }
    },
    welcome: {
      openRate: { median: 53.0, top10: 69.0, top25: 61.0, bottom25: 45.0 },
      clickRate: { median: 5.8, top10: 12.5, top25: 8.0, bottom25: 4.0 },
      conversionRate: { median: 3.5, top10: 7.0, top25: 5.0, bottom25: 2.0 },
      rpr: { median: 3.8, top10: 11.5, top25: 6.5, bottom25: 1.8, currency: 'USD' }
    }
  },
  sms: {
    clickRate: { median: 6.5, top10: 15.0, top25: 9.5, bottom25: 4.0 },
    conversionRate: { median: 4.2, top10: 9.0, top25: 6.0, bottom25: 2.5 },
    rpr: { median: 0.18, top10: 1.2, top25: 0.52, bottom25: 0.08, currency: 'USD' }
  },
  insights: [
    'Sports & fitness shows strong SMS engagement',
    'Post-workout timing drives higher conversion rates',
    'Supplement replenishment flows outperform equipment sales'
  ],
  data_source: {
    provider: 'Klaviyo',
    sample_size: 1800,
    data_collection_period: {
      start: new Date('2025-01-01'),
      end: new Date('2025-03-31')
    }
  },
  is_active: true
});

console.log('✅ Created benchmark:', newBenchmark.version);
```

### 5. Deprecate Old Benchmark

```javascript
// When releasing a new quarterly version
const oldBenchmark = await Benchmark.findOne({
  vertical: 'health_beauty',
  version: '2024-Q4'
});

await oldBenchmark.deprecate();
console.log('✅ Deprecated old benchmark');
```

## Seeding Benchmark Data

Run the seed script to populate initial benchmark data:

```bash
node scripts/seed-benchmarks.js
```

This will:
1. Clear existing benchmarks
2. Insert benchmark data for 3 verticals (health_beauty, fashion_apparel, general_retail)
3. Display summary of inserted data

## API Integration

### Example API Endpoint: Get Store Benchmark Comparison

```javascript
// /app/api/store/[storePublicId]/benchmark/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storePublicId } = await params;

    await connectToDatabase();
    const store = await Store.findOne({ public_id: storePublicId });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get benchmark
    const benchmark = await store.getBenchmark();

    if (!benchmark) {
      return NextResponse.json({
        error: 'No benchmark available',
        vertical: store.vertical
      }, { status: 404 });
    }

    return NextResponse.json({
      store: {
        id: store.public_id,
        name: store.name,
        vertical: store.vertical
      },
      benchmark: {
        version: benchmark.version,
        campaigns: benchmark.campaigns,
        flows: benchmark.flows,
        sms: benchmark.sms,
        insights: benchmark.insights
      }
    });

  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## AI Chat Integration

The AI can now provide contextual benchmark comparisons:

```javascript
// In AI system prompt
const systemPrompt = `
...
Store Context:
- Store: ${store.name}
- Vertical: ${store.vertical}
- AOV: $${store.aov}

Benchmark Data Available:
${JSON.stringify(benchmark, null, 2)}

When analyzing performance:
1. Compare actual metrics to benchmark medians
2. Identify top 10% opportunities
3. Provide vertical-specific recommendations
4. Reference insights from benchmark data
...
`;
```

**Example AI Response:**
```
Your campaign open rate of 42.5% is performing ABOVE the health & beauty median
of 39.5%, putting you in the top 25-50% of brands in your vertical. However,
there's still opportunity to reach the top 10% benchmark of 54.0% by:

1. Improving subject line personalization
2. Optimizing send times based on customer behavior
3. Segmenting campaigns by product category

Your abandoned cart flow RPR of $15.50 is exceptional - you're in the TOP 10%
for health & beauty (median: $4.50). This is a key strength to maintain!
```

## Database Indexes

The Benchmark model includes these indexes for performance:

```javascript
// Single field indexes
{ vertical: 1 }
{ year: -1 }
{ is_active: 1 }

// Compound indexes
{ vertical: 1, year: -1, is_active: 1 }
{ version: 1, is_active: 1 }

// Unique constraint (only one active benchmark per vertical per year)
{ vertical: 1, year: 1, is_active: 1 } // unique
```

## Metric Definitions

### Campaign Metrics
- **Open Rate**: Unique opens / Recipients delivered (%)
- **Click Rate**: Unique clicks / Recipients delivered (%)
- **Conversion Rate**: Conversions / Recipients delivered (%)
- **RPR (Revenue Per Recipient)**: Total revenue / Recipients delivered ($)

### Percentiles
- **Top 10%**: Best performing 10% of brands
- **Top 25%**: Best performing 25% of brands
- **Median**: 50th percentile (middle of distribution)
- **Bottom 25%**: Lower performing 25% of brands

### Flow Types
- **abandonedCart**: Triggered when cart is abandoned
- **welcome**: New subscriber welcome series
- **browseAbandonment**: Product view without add-to-cart
- **postPurchase**: Cross-sell/upsell after purchase
- **winback**: Re-engage inactive customers
- **backInStock**: Notify when product available
- **priceDropAlert**: Price reduction notifications
- **birthdaySeries**: Birthday/anniversary campaigns

## Versioning Strategy

Benchmarks use quarterly versioning:
- **2025-Q1**: January - March 2025
- **2025-Q2**: April - June 2025
- **2025-Q3**: July - September 2025
- **2025-Q4**: October - December 2025

When releasing a new version:
1. Create new benchmark with updated `version`
2. Set `is_active: true`
3. Deprecate old benchmark (set `is_active: false`)
4. Maintain old benchmarks for historical analysis

## Currency Support

All RPR (Revenue Per Recipient) metrics support multiple currencies:
- USD (default)
- EUR
- GBP
- AUD
- CAD
- NZD

Store AOV and benchmark RPR should use the same currency for accurate comparisons.

## Best Practices

1. **Set Store Vertical**: Always set the `vertical` field when creating stores
2. **Update AOV**: Keep `aov` field updated for accurate RPR comparisons
3. **Quarterly Updates**: Update benchmarks quarterly with fresh data
4. **Sample Size**: Ensure benchmark data has sufficient sample size (>1000 brands)
5. **Regional Variations**: Consider creating regional benchmark variants if performance varies significantly by geography

## Future Enhancements

Potential future additions:
- Regional benchmark variants (US, EU, APAC)
- Device-specific benchmarks (mobile vs desktop)
- Day-of-week / time-of-day benchmarks
- Seasonal adjustment factors
- Customer segment benchmarks (new vs returning)
- Product category sub-benchmarks within verticals

---

**Status**: ✅ Production Ready
**Created**: October 24, 2025
**Version**: 1.0

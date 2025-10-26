# 🏪 Store Vertical Setup Guide

## Overview

This guide explains how to set up industry verticals for your stores so they can use the benchmark system for AI-driven marketing insights.

## Current Status

✅ **59 industry benchmarks** are installed in MongoDB
⚠️ **Your stores need vertical classification** to use benchmarks

## Quick Start - Set All Stores to One Vertical

If all your stores are in the same industry, use the bulk update script:

```bash
# Set all stores to general e-commerce
node scripts/bulk-set-vertical.js ecommerce_general

# Set all stores to health & beauty
node scripts/bulk-set-vertical.js ecommerce_health_beauty

# Set all stores to restaurants
node scripts/bulk-set-vertical.js restaurants
```

This updates all stores at once. See [BENCHMARK_REFERENCE_LIST.md](BENCHMARK_REFERENCE_LIST.md) for the full list of vertical keys.

## Advanced Options

### 1. Interactive Classification (Recommended)

Guide through each store and choose the best vertical:

```bash
node scripts/update-store-verticals.js
```

**What it does:**
- Shows each store with name and description
- Suggests a vertical based on keywords
- Lets you accept, skip, or enter a custom vertical
- Updates stores one by one

**Example output:**
```
📦 Balmain Beauty (sCJa76p)
   Description: Premium skincare and cosmetics
   Current: (not set)
   Suggested: ecommerce_skincare - Skincare

   Action [a]ccept / [s]kip / [c]ustom / [q]uit: a

✅ Updated: Balmain Beauty (sCJa76p)
   (not set) → ecommerce_skincare (Skincare)
```

### 2. Auto-Classify All Stores

Let the script automatically classify stores based on their names and descriptions:

```bash
node scripts/update-store-verticals.js --auto
```

**Classification logic:**
- Scans store name and description for keywords
- Matches to most appropriate vertical
- Updates all stores automatically
- Falls back to `ecommerce_general` if unsure

### 3. Update Single Store

Update a specific store:

```bash
node scripts/update-store-verticals.js --store=sCJa76p --vertical=ecommerce_skincare
```

## Available Verticals

### E-commerce (42 verticals)

**Apparel & Fashion:**
- `ecommerce_activewear` - Activewear
- `ecommerce_fast_fashion` - Fast Fashion
- `ecommerce_footwear` - Footwear
- `ecommerce_hats` - Hats
- `ecommerce_swimwear` - Swimwear
- `ecommerce_maternity_children's_clothes` - Maternity & Children's Clothes
- `e-commerce_apparel_accessories` - E-commerce (Apparel and Accessories)

**Health & Beauty:**
- `ecommerce_skincare` - Skincare
- `ecommerce_makeup` - Makeup
- `ecommerce_haircare` - Haircare
- `ecommerce_fragrance` - Fragrance
- `ecommerce_supplements` - Supplements
- `ecommerce_dental_products` - Dental Products
- `ecommerce_eyewear` - Eyewear
- `ecommerce_fitness_wellness` - Fitness and Wellness
- `e-commerce_health_beauty` - E-commerce (Health and Beauty)

**Product Categories:**
- `ecommerce_electronics` - E-commerce (Electronics)
- `ecommerce_food_beverage` - E-commerce (Food and Beverage)
- `ecommerce_jewelry` - E-commerce (Jewelry)
- `ecommerce_home_garden` - E-commerce (Home and Garden)
- `ecommerce_hardware_home_improvement` - Hardware and Home Improvement
- `ecommerce_automotive` - E-commerce (Automotive)
- `ecommerce_toys_hobbies` - E-commerce (Toys and Hobbies)
- `ecommerce_sporting_goods` - E-commerce (Sporting Goods)
- `ecommerce_office_supplies` - E-commerce (Office Supplies)
- `ecommerce_mass_merchant` - E-commerce (Mass Merchant)
- `ecommerce_specialty` - E-commerce (Specialty)
- `ecommerce_other` - Other
- `ecommerce_general` - E-commerce (General)

### Services (10 verticals)

**B2B:**
- `agency_marketing_consulting` - Agency, Marketing, and Consulting
- `software_saas` - Software and SaaS

**Hospitality:**
- `restaurants` - Restaurants
- `travel` - Travel
- `events_entertainment` - Events and Entertainment

**Other Services:**
- `education` - Education
- `banking_finance_insurance` - Banking, Finance, and Insurance
- `real_estate_construction` - Real Estate and Construction
- `telecommunications` - Telecommunications
- `wellness_fitness_services` - Wellness and Fitness Services

**Nonprofit:**
- `nonprofit` - Non-profit

**Government:**
- `politics_government` - Politics and Government

## Verification

Check which verticals are set:

```bash
node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const stats = await mongoose.connection.db.collection('stores')
      .aggregate([
        { \$group: { _id: '\$vertical', count: { \$sum: 1 } } },
        { \$sort: { count: -1 } }
      ]).toArray();

    console.log('Store Verticals:');
    stats.forEach(s => console.log(\`  \${s._id || '(not set)'}: \${s.count}\`));

    await mongoose.connection.close();
    process.exit(0);
  });
"
```

## How It Works

### 1. Store Model

Each store has a `vertical` field:

```javascript
{
  public_id: "sCJa76p",
  name: "Balmain Beauty",
  vertical: "ecommerce_skincare",  // 👈 Links to benchmark
  // ... other fields
}
```

### 2. Benchmark Lookup

When the AI analyzes a store:

```javascript
import { getBenchmarkForStore } from '@/lib/benchmark-service';

const store = await Store.findOne({ public_id: 'sCJa76p' });
const benchmark = await getBenchmarkForStore(store);

// Returns benchmark with:
// - Industry averages (open rate, click rate, CTOR)
// - Top 10% benchmarks
// - Vertical-specific insights
```

### 3. AI Integration

The benchmark data is automatically included in the AI system prompt:

```
📊 INDUSTRY BENCHMARK CONTEXT (Skincare):
Campaign Benchmarks:
- Open Rate: Median 38% | Top 10%: 55%
- Click Rate: Median 1.05% | Top 10%: 3.6%
- CTOR: Median 4.3% | Top 10%: 10%

Industry Insights for Skincare:
- Conversion is driven by visual, trust-building content
- High engagement on automated flows
- Educational sequences perform well
```

## Troubleshooting

### "Invalid vertical" error

Make sure you're using the exact vertical key from [BENCHMARK_REFERENCE_LIST.md](BENCHMARK_REFERENCE_LIST.md).

**Common mistakes:**
- ❌ `skincare` (missing prefix)
- ❌ `Ecommerce_Skincare` (wrong capitalization)
- ✅ `ecommerce_skincare` (correct)

### Stores not getting benchmarks

1. Check if vertical is set:
   ```bash
   node -e "
   const mongoose = require('mongoose');
   require('dotenv').config({ path: '.env.local' });
   mongoose.connect(process.env.MONGODB_URI).then(async () => {
     const store = await mongoose.connection.db.collection('stores')
       .findOne({ public_id: 'YOUR_STORE_ID' });
     console.log('Vertical:', store.vertical);
     await mongoose.connection.close();
   });
   "
   ```

2. Verify benchmark exists for that vertical:
   ```bash
   node -e "
   const mongoose = require('mongoose');
   require('dotenv').config({ path: '.env.local' });
   mongoose.connect(process.env.MONGODB_URI).then(async () => {
     const benchmark = await mongoose.connection.db.collection('benchmarks')
       .findOne({ vertical: 'ecommerce_skincare', is_active: true });
     console.log('Benchmark:', benchmark ? 'Found' : 'Not found');
     await mongoose.connection.close();
   });
   "
   ```

## Best Practices

1. **Be Specific**: Choose the most specific vertical that matches your store
   - ✅ `ecommerce_skincare` (specific) over `ecommerce_health_beauty` (general)
   - ✅ `ecommerce_activewear` (specific) over `e-commerce_apparel_accessories` (general)

2. **Use Auto-Classify First**: Let the script suggest verticals, then review and adjust

3. **Keep Updated**: If a store changes its product focus, update the vertical

4. **Check AI Responses**: After setting verticals, test the AI to ensure it's using benchmarks

## Example Workflow

```bash
# 1. Review available verticals
cat BENCHMARK_REFERENCE_LIST.md

# 2. Run interactive classification
node scripts/update-store-verticals.js

# 3. Or bulk set all stores
node scripts/bulk-set-vertical.js ecommerce_general

# 4. Verify updates
node -e "..." # (see verification command above)

# 5. Test AI with a store
# The AI should now reference industry benchmarks in its responses
```

## Support

- Full vertical list: [BENCHMARK_REFERENCE_LIST.md](BENCHMARK_REFERENCE_LIST.md)
- Benchmark system docs: [BENCHMARK_IMPLEMENTATION_COMPLETE.md](BENCHMARK_IMPLEMENTATION_COMPLETE.md)
- 59 verticals across 11 categories available

---

**Need help?** The scripts will guide you through the process interactively!

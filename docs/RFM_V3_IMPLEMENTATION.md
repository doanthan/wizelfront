# RFM V3.0 Implementation Summary

## Overview
Successfully implemented Adaptive RFM V3.0 configuration in the Store model with comprehensive fields for business characteristics, calculated criteria, validation, and user overrides.

## Schema Structure

### 1. Business Characteristics
Captures the business profile to determine RFM template:
- `total_customers`: Total customer count
- `total_orders`: Total order count
- `one_time_buyer_pct`: Percentage of one-time buyers
- `repeat_purchase_pct`: Percentage of repeat purchasers
- `avg_orders_per_customer`: Average orders per customer
- `median_inter_purchase_days`: Median days between purchases
- `avg_order_value`: Average order value
- `detected_template`: Business template (low_repeat, medium_repeat, high_repeat)
- `confidence_score`: Template detection confidence (0-1)

### 2. Calculated Criteria

#### Frequency (Absolute Thresholds)
- **Champion**: min_orders, baseline_used, adjusted, adjustment_reason, pct_customers_meeting, expected_range, is_healthy
- **Loyal**: min_orders, baseline_used, adjusted, adjustment_reason, pct_customers_meeting, expected_range, is_healthy
- **Active**: min_orders, pct_customers_meeting

#### Monetary (Percentile-based)
- **Champion**: min_revenue, percentile_used (0.90), pct_customers_meeting
- **Loyal**: min_revenue, percentile_used (0.75), pct_customers_meeting
- **Active**: min_revenue, percentile_used (0.60), pct_customers_meeting

#### Recency (Inter-purchase based)
- `hot`: 30 days (default)
- `warm`: 60 days (default)
- `cool`: 90 days (default)
- `at_risk`: 180 days (default)
- `lost`: 365 days (default)
- `calculation_method`: "inter_purchase_intervals" or "default"

### 3. Segment Preview
Map of segment names to:
- `count`: Number of customers in segment
- `percentage`: Percentage of total customers
- `criteria`: Human-readable criteria string

### 4. Validation Results
- `distribution_healthy`: Boolean indicating healthy distribution
- `warnings`: Array of warning messages
- `recommendations`: Array of recommendations
- `confidence_score`: Overall confidence (0-1)

### 5. User Overrides
Allows manual adjustment of calculated criteria:
- `enabled`: Boolean to enable/disable overrides
- `frequency.champion_min_orders`: Override for champion frequency
- `frequency.loyal_min_orders`: Override for loyal frequency
- `monetary.champion_min_revenue`: Override for champion revenue
- `monetary.loyal_min_revenue`: Override for loyal revenue
- `metadata.modified_by`: User who made the override
- `metadata.modified_at`: Timestamp of override
- `metadata.reason`: Reason for override

## Instance Methods

### `getRFMCriteria()`
Returns complete RFM configuration including version, characteristics, criteria, validation, and overrides.

```javascript
const criteria = store.getRFMCriteria();
// Returns: { version, business_characteristics, calculated_criteria, segment_preview, validation, overrides, last_updated }
```

### `needsRFMRecalculation()`
Checks if RFM needs recalculation (older than 30 days or never calculated).

```javascript
if (store.needsRFMRecalculation()) {
  // Trigger RFM recalculation
}
```

### `getSegmentCriteria(segmentName)`
Gets criteria for a specific segment from the preview.

```javascript
const champCriteria = store.getSegmentCriteria('Champions');
// Returns: { count, percentage, criteria }
```

### `hasRFMOverrides()`
Checks if store has user overrides applied.

```javascript
const hasOverrides = store.hasRFMOverrides();
// Returns: true/false
```

### `getRFMSegmentDefinition(segmentName)`
Gets detailed segment definition with current thresholds (including overrides).

```javascript
const champDef = store.getRFMSegmentDefinition('Champions');
// Returns: { frequency, monetary, recency, description }
```

### `getBusinessTemplate()`
Gets business template information and key metrics.

```javascript
const template = store.getBusinessTemplate();
// Returns: { template, confidence, metrics: {...} }
```

### `updateRFMConfig(configUpdate)`
Updates RFM configuration (used by calculation engine).

```javascript
await store.updateRFMConfig({
  business_characteristics: {...},
  calculated_criteria: {...},
  segment_preview: new Map([...]),
  validation: {...}
});
```

### `applyRFMOverrides(overrides, userId, reason)`
Applies user overrides to RFM criteria.

```javascript
await store.applyRFMOverrides(
  {
    frequency: { champion_min_orders: 7, loyal_min_orders: 4 },
    monetary: { champion_min_revenue: 750, loyal_min_revenue: 400 }
  },
  userId,
  'Adjusting for seasonal patterns'
);
```

### `removeRFMOverrides()`
Removes user overrides and reverts to calculated criteria.

```javascript
await store.removeRFMOverrides();
```

### `getRFMHealthStatus()`
Gets RFM health status with warnings and recommendations.

```javascript
const health = store.getRFMHealthStatus();
// Returns: { healthy, confidence, warnings: [], recommendations: [] }
```

## Static Methods

### `Store.findByRFMTemplate(template)`
Finds all stores with a specific RFM template.

```javascript
const mediumRepeatStores = await Store.findByRFMTemplate('medium_repeat');
```

### `Store.findNeedingRFMRecalculation()`
Finds all stores that need RFM recalculation.

```javascript
const storesNeedingUpdate = await Store.findNeedingRFMRecalculation();
```

### `Store.getRFMStatistics()`
Gets aggregate RFM statistics across all stores.

```javascript
const stats = await Store.getRFMStatistics();
// Returns: { total_stores, templates: {...}, avg_confidence, stores_with_overrides }
```

## Indexes

Added three indexes for efficient RFM queries:
1. `adaptive_rfm_config.calculation_date` (descending)
2. `adaptive_rfm_config.business_characteristics.detected_template`
3. `adaptive_rfm_config.last_updated` (descending)

## Example Usage

### 1. Calculate and Save RFM Configuration

```javascript
const store = await Store.findOne({ public_id: 'ABC1234' });

// Calculate RFM (this would be done by your RFM calculation engine)
const rfmData = await calculateRFMForStore(store);

// Update store with calculated RFM
await store.updateRFMConfig({
  business_characteristics: rfmData.characteristics,
  calculated_criteria: rfmData.criteria,
  segment_preview: rfmData.segments,
  validation: rfmData.validation
});
```

### 2. Get RFM Segment Definitions

```javascript
const store = await Store.findOne({ public_id: 'ABC1234' });

// Get all segment definitions
const segments = ['Champions', 'Loyal Customers', 'Active Customers', 'At Risk', 'Lost'];
const definitions = segments.map(name => ({
  name,
  ...store.getRFMSegmentDefinition(name)
}));

console.log(definitions);
```

### 3. Apply Custom Overrides

```javascript
const store = await Store.findOne({ public_id: 'ABC1234' });

// Store owner wants to adjust thresholds
await store.applyRFMOverrides(
  {
    frequency: {
      champion_min_orders: 8,  // Increase from calculated 5
      loyal_min_orders: 4       // Increase from calculated 3
    },
    monetary: {
      champion_min_revenue: 1000,  // Increase from calculated $500
      loyal_min_revenue: 500        // Increase from calculated $300
    }
  },
  req.user._id,
  'Adjusting for luxury product category'
);

// Now segment definitions will use overridden values
const champDef = store.getRFMSegmentDefinition('Champions');
console.log(champDef.frequency); // 8 (overridden)
console.log(champDef.monetary);  // 1000 (overridden)
```

### 4. Monitor RFM Health

```javascript
const store = await Store.findOne({ public_id: 'ABC1234' });

const health = store.getRFMHealthStatus();

if (!health.healthy) {
  console.log('⚠️ RFM Health Issues:');
  health.warnings.forEach(w => console.log(`  - ${w}`));

  console.log('💡 Recommendations:');
  health.recommendations.forEach(r => console.log(`  - ${r}`));
}
```

### 5. Find Stores Needing Updates

```javascript
// Find all stores that need RFM recalculation
const storesNeedingUpdate = await Store.findNeedingRFMRecalculation();

console.log(`Found ${storesNeedingUpdate.length} stores needing RFM recalculation`);

// Queue them for background processing
for (const store of storesNeedingUpdate) {
  await queueRFMCalculation(store.public_id);
}
```

### 6. Get Platform-Wide RFM Statistics

```javascript
const stats = await Store.getRFMStatistics();

console.log('RFM Platform Statistics:');
console.log(`  Total stores with RFM: ${stats.total_stores}`);
console.log(`  Low repeat: ${stats.templates.low_repeat}`);
console.log(`  Medium repeat: ${stats.templates.medium_repeat}`);
console.log(`  High repeat: ${stats.templates.high_repeat}`);
console.log(`  Average confidence: ${(stats.avg_confidence * 100).toFixed(1)}%`);
console.log(`  Stores with overrides: ${stats.stores_with_overrides}`);
```

## RFM Segment Definitions

The system supports 5 standard RFM segments:

### 1. Champions
- **Frequency**: Highest threshold (e.g., 5+ orders)
- **Monetary**: Top 10% (90th percentile)
- **Recency**: Very recent (≤30 days)
- **Description**: "High frequency, high spend, recent purchases"

### 2. Loyal Customers
- **Frequency**: Medium-high threshold (e.g., 3+ orders)
- **Monetary**: Top 25% (75th percentile)
- **Recency**: Recent (≤60 days)
- **Description**: "Regular buyers with good lifetime value"

### 3. Active Customers
- **Frequency**: Low-medium threshold (e.g., 2+ orders)
- **Monetary**: Top 40% (60th percentile)
- **Recency**: Moderately recent (≤90 days)
- **Description**: "Recent purchasers, building loyalty"

### 4. At Risk
- **Frequency**: Same as Active
- **Monetary**: Same as Active
- **Recency**: 90-180 days
- **Description**: "Previously active, now becoming inactive"

### 5. Lost
- **Frequency**: Any
- **Monetary**: Any
- **Recency**: >180 days
- **Description**: "No recent purchases, need re-engagement"

## Business Templates

The system detects three business templates based on customer behavior:

### Low Repeat (65%+ one-time buyers)
- Typical: Luxury goods, high-ticket items, infrequent purchases
- Frequency thresholds: Lower (e.g., Champion = 3 orders)
- Focus: Acquisition and first purchase conversion

### Medium Repeat (35-65% one-time buyers)
- Typical: Fashion, electronics, seasonal products
- Frequency thresholds: Standard (e.g., Champion = 5 orders)
- Focus: Balanced acquisition and retention

### High Repeat (35%+ repeat buyers)
- Typical: Consumables, subscriptions, frequent purchases
- Frequency thresholds: Higher (e.g., Champion = 8 orders)
- Focus: Retention and increasing purchase frequency

## Next Steps

1. **Create RFM Calculation Engine**: Build the engine that calculates these values from customer data
2. **Create RFM API Endpoints**: Build REST APIs to access and update RFM configuration
3. **Create RFM UI Components**: Build dashboard components to visualize and manage RFM segments
4. **Implement Background Jobs**: Set up cron jobs to automatically recalculate RFM for stores
5. **Create Klaviyo Segment Sync**: Sync RFM segments to Klaviyo for campaign targeting

## Testing

Run the test file to verify the implementation:

```bash
node test-rfm-model.js
```

All 10 tests should pass, demonstrating:
- RFM recalculation checking
- Configuration updates
- Criteria retrieval
- Segment definitions
- Business template analysis
- Health status monitoring
- User override application/removal
- Static method functionality

## Files Modified

- `/models/Store.js`: Added RFM V3.0 schema fields and methods
- `/test-rfm-model.js`: Comprehensive test suite for RFM functionality

## Documentation

- This file: `/docs/RFM_V3_IMPLEMENTATION.md`

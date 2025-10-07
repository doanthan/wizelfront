# Adaptive RFM - 3-Mode Auto-Detection System (v3.0)

## Overview

The Adaptive RFM v3.0 system automatically detects your business model and calculates optimal criteria based on actual customer purchase behavior:

1. **Recency Thresholds** - Dynamic day-based zones (Hot/Warm/Cool/At Risk/Lost)
2. **Frequency Criteria** - Absolute order counts (3+ orders) with auto-validation
3. **Monetary Criteria** - Revenue percentiles adapted by business model
4. **Complete Explainability** - Every criteria includes `adjustment_reason` for dashboard

**Key Innovation:** Instead of using the same thresholds for all stores:
- **Recency**: Perfume stores get 30-day Hot, supplement stores get 14-day Hot (from inter-purchase intervals)
- **Frequency**: Absolute thresholds like "3+ orders" (not confusing "top 5%" percentiles)
- **Auto-Validation**: System checks if thresholds produce healthy distributions (2-8% champions expected)
- **Auto-Adjustment**: Lowers 3→2 if too few meet criteria, raises 3→4 if too many
- **Explainability**: Dashboard can display WHY each criteria was chosen

## What's New in v3.0 🎉

✅ **Absolute Frequency Thresholds** - "3+ orders" instead of confusing "top 5%" percentiles
✅ **Auto-Validation & Adjustment** - System validates thresholds produce healthy distributions
✅ **Complete Explainability** - Every criteria includes `adjustment_reason`, `pct_customers_meeting`, `is_healthy`
✅ **User Override System** - Power users can manually adjust with audit trail
✅ **Dashboard-Ready Output** - Structured JSON with all fields needed for UI display
✅ **MongoDB Integration** - Saves to `stores.adaptive_rfm_config` for persistence

## How V3.0 Works

### Absolute Thresholds with Auto-Validation

Instead of confusing percentiles, v3.0 uses **absolute order counts**:

```json
{
  "champion_frequency": {
    "min_orders": 2,
    "baseline_used": 3,
    "adjusted": true,
    "adjustment_reason": "Only 0.8% met baseline (3+ orders), lowered to 2+ for meaningful segment",
    "pct_customers_meeting": 7.6,
    "expected_range": [2.0, 8.0],
    "is_healthy": true
  }
}
```

**Key Features:**
- Clear thresholds: "2+ orders" (not "top 5%")
- Auto-validation: Checks if threshold produces healthy distribution
- Auto-adjustment: Raises/lowers threshold if needed
- Explainability: Every criteria includes human-readable `adjustment_reason`

---

## The 3 Business Templates

### Template 1: Low-Repeat (80%+ one-time buyers)

**Best for:** Furniture, High-end Jewelry, Perfume, Wedding items, Luxury goods

**Characteristics:**
- 80%+ customers buy only once
- Long purchase cycles (6+ months)
- High consideration purchases
- Naturally low repeat rates

**v3.0 Baseline Criteria:**
- **Champion Frequency**: 3+ orders (expects 2-8% of customers)
- **Loyal Frequency**: 2+ orders (expects 5-15% of customers)
- **Champion Monetary**: Top 10% revenue (90th percentile)
- **Loyal Monetary**: Top 25% revenue (75th percentile)

**Recency Thresholds:**
- Hot: 0-30 days
- Warm: 31-90 days
- Cool: 91-180 days
- At Risk: 181-365 days
- Lost: 365+ days

**Segment Focus:** Converting one-timers to repeat buyers, identifying high-value prospects

---

### Template 2: Medium-Repeat (40-80% one-time buyers)

**Best for:** Fashion, Beauty, Accessories, Home goods, General retail

**Characteristics:**
- 40-80% one-time buyers
- Medium purchase cycles (2-6 months)
- Building loyalty is key
- Seasonal patterns common

**v3.0 Baseline Criteria:**
- **Champion Frequency**: 5+ orders (expects 5-15% of customers)
- **Loyal Frequency**: 3+ orders (expects 15-30% of customers)
- **Champion Monetary**: Top 15% revenue (85th percentile)
- **Loyal Monetary**: Top 30% revenue (70th percentile)

**Recency Thresholds:**
- Hot: 0-30 days
- Warm: 31-60 days
- Cool: 61-90 days
- At Risk: 91-180 days
- Lost: 180+ days

**Segment Focus:** Loyalty programs, increasing purchase frequency

---

### Template 3: High-Repeat (<40% one-time buyers)

**Best for:** Supplements, Pet food, Coffee, Consumables, Subscriptions

**Characteristics:**
- <40% one-time buyers (60%+ repeat!)
- Short purchase cycles (1-2 months)
- Predictable consumption
- Subscription patterns

**v3.0 Baseline Criteria:**
- **Champion Frequency**: 6+ orders (expects 15-25% of customers)
- **Loyal Frequency**: 4+ orders (expects 30-50% of customers)
- **Champion Monetary**: Top 20% revenue (80th percentile)
- **Loyal Monetary**: Top 35% revenue (65th percentile)

**Recency Thresholds:**
- Hot: 0-21 days
- Warm: 22-45 days
- Cool: 46-90 days
- At Risk: 91-180 days
- Lost: 180+ days

**Segment Focus:** Retention, subscription optimization, preventing churn

---

## How It Works

### Step 1: Data Collection
```python
# Fetches ALL orders for the brand
- customer_email
- order_timestamp
- order_value
```

### Step 2: Business Characteristic Analysis

The system calculates these **AUTO_DETECTED_VARIABLES**:

```python
# Business Model Metrics
one_time_buyer_percentage: float      # Primary detection signal
repeat_purchase_rate: float
avg_orders_per_customer: float

# Purchase Cycle (MOST IMPORTANT!)
median_inter_purchase_days: int       # Middle of repeat buyer cycle
p25_inter_purchase_days: int          # Fast repeat buyers (25th percentile)
p75_inter_purchase_days: int          # Slow repeat buyers (75th percentile)
p90_inter_purchase_days: int          # Slowest repeat buyers (90th percentile)

# Revenue Patterns
avg_order_value: float
median_order_value: float
aov_std_deviation: float              # High variance = multi-category

# Temporal Patterns
is_seasonal: bool                     # >60% orders in 3-month window
peak_months: list                     # [11, 12] for holiday brands

# Subscription Indicators
has_subscription_pattern: bool        # Consistent 28-32 day intervals
subscription_percentage: float

# Data Quality
total_customers: int
total_orders: int
repeat_purchase_sample_size: int      # Need 30+ for good thresholds
data_date_range_days: int
```

### Step 3: Template Detection

```python
# Primary signal: One-time buyer percentage
if one_time_pct >= 80:
    template = LOW_REPEAT
    confidence = 0.9
elif one_time_pct <= 40:
    template = HIGH_REPEAT
    confidence = 0.9
else:
    template = MEDIUM_REPEAT
    confidence = 0.7

# Refine with inter-purchase data
if median_inter_purchase_days > 180:  # Very long cycle
    template = LOW_REPEAT
    confidence = 0.95
elif median_inter_purchase_days < 45:  # Very short cycle
    template = HIGH_REPEAT
    confidence = 0.95
```

### Step 4: Threshold Calculation

**From Inter-Purchase Intervals (when data is sufficient):**

```python
# LOW_REPEAT template
hot = min(30, p25)                    # Before 25th percentile
warm = min(90, p50)                   # Around median
cool = min(180, p75)                  # Beyond 75th percentile
at_risk = min(365, p90 * 1.2)        # Beyond 90th percentile
lost = max(365, p90 * 1.8)           # Way beyond normal cycle

# MEDIUM_REPEAT template
hot = min(30, p25 * 0.8)             # More aggressive
warm = min(60, p50 * 0.8)
cool = min(120, p75 * 0.9)
at_risk = min(270, p90)
lost = max(365, p90 * 1.5)

# HIGH_REPEAT template
hot = min(21, p25 * 0.7)             # Very aggressive
warm = min(45, p50 * 0.7)
cool = min(90, p75 * 0.8)
at_risk = min(180, p90 * 0.9)
lost = max(270, p90 * 1.3)
```

**Why percentiles?**
- p25: The fastest 25% of repeat buyers
- p50 (median): Typical repeat buyer timing
- p75: The slower 75% of repeat buyers
- p90: The slowest 90% of repeat buyers

If you mark customers as "lost" before p90, you're giving up on 10% of your actual repeat buyers!

### Step 5: Adjustments

**Seasonality Adjustment:**
```python
if is_seasonal:
    at_risk *= 1.2  # Extend by 20%
    lost *= 1.2     # Don't mark as lost too soon
```

**Subscription Adjustment:**
```python
if has_subscription_pattern:
    # Tighten thresholds to catch subscription lapses faster
    hot *= 0.7
    warm *= 0.7
    cool *= 0.7
```

### Step 6: Validation

The system checks the customer distribution across zones:

```
Hot (0-30d):        2,450 (24.5%) ████████████
Warm (31-60d):      1,890 (18.9%) █████████
Cool (61-90d):      1,234 (12.3%) ██████
At Risk (91-180d):  2,100 (21.0%) ██████████
Lost (180d+):       2,326 (23.3%) ███████████

✅ Distribution is healthy (max 25% in any zone)
```

**Healthy Distribution:** No single zone has >60% of customers

### Step 7: Segment Assignment

Segments are assigned based on:
1. **Template** (low/medium/high repeat)
2. **Recency zone** (hot/warm/cool/at_risk/lost)
3. **Order count** (1 vs 2+ orders)
4. **Revenue** (high-value flag)

**Example segments for LOW_REPEAT:**
- VIP Repeat Buyers (2+ orders, hot recency)
- New Stars (1 order, high value, hot recency)
- Recent First-Time (1 order, hot/warm recency)
- Cooling Off (1 order, cool recency)
- At Risk First-Time (1 order, at risk recency)
- Lost (1 order, lost recency)
- Repeat Buyers (2+ orders, warm/cool recency)
- At Risk Repeat (2+ orders, beyond cool)

---

## V3.0: Absolute Thresholds with Auto-Validation

### The Problem with Percentiles (v2.0)

In v2.0, we used percentile-based frequency thresholds:

```python
# v2.0 approach
champion_frequency_percentile = 0.95  # Top 5%
```

**What actually happened:**
- Perfume store with 87% one-time buyers
- "Top 5%" meant 5% of the top repeat buyers
- Result: Only **0.2%** of total customers were champions
- Dashboard showed: "Champion criteria: top 5%" (confusing!)
- Users asked: "Why do I only have 20 champions out of 10,000 customers?"

### The v3.0 Solution: Absolute Thresholds

Instead of percentiles, we use **absolute order counts** with validation:

```python
# v3.0 approach
champion_min_orders = 3  # Baseline: need 3+ orders
```

**What happens:**
1. System checks: How many customers actually have 3+ orders?
2. If only 0.8% meet it → **Too exclusive, adjust down to 2+ orders**
3. If 15% meet it → **Too inclusive, adjust up to 4+ orders**
4. Document the adjustment with `adjustment_reason`

### Baseline Criteria by Template

```python
BASELINE_ABSOLUTE_CRITERIA = {
    'LOW_REPEAT': {
        'champion_min_orders': 3,        # Expect 2-8% meet this
        'loyal_min_orders': 2,           # Expect 5-15% meet this
        'champion_monetary_pct': 90,     # Top 10% revenue
        'loyal_monetary_pct': 75,        # Top 25% revenue
    },
    'MEDIUM_REPEAT': {
        'champion_min_orders': 5,        # Expect 5-15% meet this
        'loyal_min_orders': 3,           # Expect 15-30% meet this
        'champion_monetary_pct': 85,     # Top 15% revenue
        'loyal_monetary_pct': 70,        # Top 30% revenue
    },
    'HIGH_REPEAT': {
        'champion_min_orders': 6,        # Expect 15-25% meet this
        'loyal_min_orders': 4,           # Expect 30-50% meet this
        'champion_monetary_pct': 80,     # Top 20% revenue
        'loyal_monetary_pct': 65,        # Top 35% revenue
    }
}
```

### Auto-Validation Logic

For each frequency threshold, the system:

1. **Calculates actual percentage meeting baseline**:
```python
champion_baseline = 3  # orders
pct_meeting = (customers_with_3plus_orders / total_customers) * 100
# Result: 0.8%
```

2. **Compares against expected range**:
```python
expected_range = (2.0, 8.0)  # LOW_REPEAT champion range
if pct_meeting < 2.0:  # Too few!
    # Adjust threshold DOWN
elif pct_meeting > 8.0:  # Too many!
    # Adjust threshold UP
```

3. **Auto-adjusts with explanation**:
```python
if pct_meeting < expected_min:
    adjusted_threshold = max(2, baseline - 1)
    adjustment_reason = f"Only {pct_meeting:.1f}% met baseline ({baseline}+ orders), lowered to {adjusted_threshold}+ for meaningful segment"
elif pct_meeting > expected_max:
    adjusted_threshold = baseline + 1
    adjustment_reason = f"{pct_meeting:.1f}% met baseline ({baseline}+ orders), raised to {adjusted_threshold}+ to keep champions exclusive"
else:
    adjusted_threshold = baseline
    adjustment_reason = f"{pct_meeting:.1f}% meet criteria ({baseline}+ orders), within healthy range"
```

4. **Validates adjusted threshold**:
```python
# Re-check with adjusted threshold
new_pct_meeting = (customers_with_adjusted_orders / total_customers) * 100
is_healthy = expected_min <= new_pct_meeting <= expected_max
```

### Complete Criteria Output

Every frequency/monetary criteria includes:

```python
@dataclass
class FrequencyCriteria:
    min_orders: int                      # Final threshold (e.g., 2)
    baseline_used: int                   # Starting baseline (e.g., 3)
    adjusted: bool                       # Was adjustment needed?
    adjustment_reason: str               # Human-readable explanation
    pct_customers_meeting: float         # Actual % meeting criteria (e.g., 7.6%)
    expected_range: Tuple[float, float]  # Healthy range (e.g., 2.0-8.0%)
    is_healthy: bool                     # Is final % in expected range?
```

### Real Example: Perfume Store

**Step 1: Apply Baseline**
```json
{
  "template": "LOW_REPEAT",
  "champion_baseline": 3,
  "customers_with_3plus_orders": 82,
  "total_customers": 10000,
  "pct_meeting_baseline": 0.82
}
```

**Step 2: Validate Against Expected Range**
```json
{
  "expected_range": [2.0, 8.0],
  "actual_pct": 0.82,
  "status": "TOO_LOW",
  "action": "LOWER_THRESHOLD"
}
```

**Step 3: Adjust Down**
```json
{
  "new_threshold": 2,
  "customers_with_2plus_orders": 760,
  "new_pct_meeting": 7.6
}
```

**Step 4: Final Validation**
```json
{
  "champion_frequency": {
    "min_orders": 2,
    "baseline_used": 3,
    "adjusted": true,
    "adjustment_reason": "Only 0.8% met baseline (3+ orders), lowered to 2+ for meaningful segment",
    "pct_customers_meeting": 7.6,
    "expected_range": [2.0, 8.0],
    "is_healthy": true
  }
}
```

### Monetary Criteria (Still Percentile-Based)

Monetary criteria use percentiles because:
- Revenue distributions are highly skewed (Pareto principle)
- Absolute dollar amounts vary wildly across verticals
- "Top 10%" is universally understood

```python
@dataclass
class MonetaryCriteria:
    min_revenue: float                   # Dollar threshold (e.g., $450.00)
    percentile_used: float               # Percentile (e.g., 0.90 = 90th)
    pct_customers_meeting: float         # Actual % meeting (should ≈ 10%)
    expected_range: Tuple[float, float]  # Expected range (e.g., 8.0-12.0%)
    is_healthy: bool                     # Is distribution normal?
```

### User Override System

Power users can manually adjust any criteria:

```python
@dataclass
class UserOverride:
    enabled: bool
    frequency_overrides: Optional[Dict[str, int]]  # {"champion_min_orders": 4}
    monetary_overrides: Optional[Dict[str, float]]  # {"champion_percentile": 0.95}
    modified_by: str                                # User ID or email
    modified_at: datetime
    reason: str                                     # "Our luxury customers need 4+ orders"
```

**Override Process:**
1. User calls `/api/v2/adaptive-rfm/v3/override` with new criteria
2. System applies override WITHOUT validation (user knows best)
3. Saves to `stores.adaptive_rfm_config.overrides`
4. Tracks metadata (who, when, why)

**Override Output:**
```json
{
  "champion_frequency": {
    "min_orders": 4,
    "baseline_used": 3,
    "adjusted": true,
    "adjustment_reason": "User override: Our luxury customers need 4+ orders (modified by admin@example.com on 2025-10-07)",
    "pct_customers_meeting": 3.2,
    "expected_range": [2.0, 8.0],
    "is_healthy": true
  }
}
```

### Validation Result

The complete validation output includes:

```python
@dataclass
class ValidationResult:
    distribution_healthy: bool           # Are all criteria within expected ranges?
    warnings: List[str]                  # ["Only 3.2% champions (expected 5-15%)"]
    recommendations: List[str]           # ["Consider lowering champion threshold to 3 orders"]
```

**Example Output:**
```json
{
  "validation": {
    "distribution_healthy": true,
    "warnings": [],
    "recommendations": [
      "Champion distribution (7.6%) is healthy",
      "Loyal distribution (18.3%) is healthy",
      "Consider reviewing thresholds monthly as data grows"
    ]
  }
}
```

---

## API Endpoints

### V3.0 Endpoints

#### 1. Calculate V3.0 RFM with Validation

```bash
POST /api/v2/adaptive-rfm/v3/calculate
```

**Request:**
```json
{
  "klaviyo_public_id": "XqkVGb",
  "return_json_only": false,     // true = preview without saving to MongoDB
  "force_template": null          // Optional: override auto-detection
}
```

**Response:**
```json
{
  "success": true,
  "version": "3.0",
  "klaviyo_public_id": "XqkVGb",
  "characteristics": {
    "one_time_buyer_percentage": 87.2,
    "detected_template": "low_repeat",
    "confidence_score": 0.95
  },
  "calculated_criteria": {
    "frequency": {
      "champion": {
        "min_orders": 2,
        "baseline_used": 3,
        "adjusted": true,
        "adjustment_reason": "Only 0.8% met baseline (3+ orders), lowered to 2+ for meaningful segment",
        "pct_customers_meeting": 7.6,
        "expected_range": [2.0, 8.0],
        "is_healthy": true
      },
      "loyal": {
        "min_orders": 2,
        "baseline_used": 2,
        "adjusted": false,
        "adjustment_reason": "12.3% meet criteria (2+ orders), within healthy range",
        "pct_customers_meeting": 12.3,
        "expected_range": [5.0, 15.0],
        "is_healthy": true
      }
    },
    "monetary": {
      "champion": {
        "min_revenue": 450.00,
        "percentile_used": 0.90,
        "pct_customers_meeting": 10.2,
        "expected_range": [8.0, 12.0],
        "is_healthy": true
      },
      "loyal": {
        "min_revenue": 250.00,
        "percentile_used": 0.75,
        "pct_customers_meeting": 24.8,
        "expected_range": [20.0, 30.0],
        "is_healthy": true
      }
    }
  },
  "validation": {
    "distribution_healthy": true,
    "warnings": [],
    "recommendations": [
      "Champion distribution (7.6%) is healthy",
      "Loyal distribution (12.3%) is healthy",
      "Consider reviewing thresholds monthly as data grows"
    ]
  },
  "thresholds": {
    "hot": 30,
    "warm": 90,
    "cool": 180,
    "at_risk": 365,
    "lost": 730
  }
}
```

#### 2. Override Criteria (Power Users)

```bash
POST /api/v2/adaptive-rfm/v3/override
```

**Request:**
```json
{
  "klaviyo_public_id": "XqkVGb",
  "frequency_overrides": {
    "champion_min_orders": 4,      // Force 4+ orders for champions
    "loyal_min_orders": 3           // Force 3+ orders for loyal
  },
  "monetary_overrides": {
    "champion_percentile": 0.95,   // Force top 5% revenue
    "loyal_percentile": 0.80       // Force top 20% revenue
  },
  "modified_by": "admin@example.com",
  "reason": "Our luxury brand needs stricter champion criteria"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Criteria overridden successfully",
  "calculated_criteria": {
    "frequency": {
      "champion": {
        "min_orders": 4,
        "baseline_used": 3,
        "adjusted": true,
        "adjustment_reason": "User override: Our luxury brand needs stricter champion criteria (modified by admin@example.com on 2025-10-07)",
        "pct_customers_meeting": 3.2,
        "expected_range": [2.0, 8.0],
        "is_healthy": true
      }
    }
  },
  "override_metadata": {
    "enabled": true,
    "modified_by": "admin@example.com",
    "modified_at": "2025-10-07T14:32:00",
    "reason": "Our luxury brand needs stricter champion criteria"
  }
}
```

#### 3. Get Current V3.0 Criteria

```bash
GET /api/v2/adaptive-rfm/v3/criteria/{klaviyo_public_id}
```

**Response:**
```json
{
  "success": true,
  "version": "3.0",
  "klaviyo_public_id": "XqkVGb",
  "calculated_criteria": { /* same as calculate response */ },
  "validation": { /* validation result */ },
  "has_override": false,
  "last_calculated": "2025-10-07T10:30:00"
}
```

#### 4. Get Business Characteristics

```bash
GET /api/v2/adaptive-rfm/characteristics/{klaviyo_public_id}
```

Returns complete business analysis with template detection details.

#### 5. Get Template Info

```bash
GET /api/v2/adaptive-rfm/template-info
```

Returns documentation about all 3 templates (LOW_REPEAT, MEDIUM_REPEAT, HIGH_REPEAT).

---

## Python CLI Usage

### Test Single Store (Auto-Detect)
```bash
python test_adaptive_rfm.py XqkVGb
```

Output:
```
🧪 TESTING ADAPTIVE RFM FOR: XqkVGb
================================================================================

📊 ANALYZING BUSINESS CHARACTERISTICS
================================================================================
   One-time buyers: 75.3%
   Repeat purchase rate: 24.7%
   Avg orders/customer: 1.42

📈 Inter-Purchase Intervals (from 2,470 intervals):
   25th percentile: 35 days
   Median (50th):   87 days
   75th percentile: 156 days
   90th percentile: 287 days

🎯 Detected Template: MEDIUM-REPEAT
   Confidence: 85%

🎯 CALCULATING OPTIMAL THRESHOLDS
================================================================================
Using template: MEDIUM-REPEAT
✅ Sufficient data (2,470 intervals)

✨ Calculated Thresholds:
   Hot (Recent):     0-30 days
   Warm (Active):    31-70 days
   Cool (Cooling):   71-140 days
   At Risk:          141-287 days
   Lost:             288+ days

🔍 VALIDATING THRESHOLDS
================================================================================
Zone            Count      Percentage
----------------------------------------
Hot             2,450      24.5% ████████████
Warm            1,890      18.9% █████████
Cool            1,234      12.3% ██████
At Risk         2,100      21.0% ██████████
Lost            2,326      23.3% ███████████

✅ Distribution is healthy (max 25% in any zone)

🏷️  ASSIGNING CUSTOMER SEGMENTS
Using template: MEDIUM-REPEAT
================================================================================

Segment                        Count    Percentage
-------------------------------------------------------
Recent First-Time              1,805    18.1% █████████
VIP Repeat Buyers                890     8.9% ████
Cooling Off                    1,102    11.0% █████
Loyal Customers                  654     6.5% ███
...

✅ ANALYSIS COMPLETE
✅ Configuration saved to MongoDB
```

### Force Specific Template
```bash
python test_adaptive_rfm.py XqkVGb low_repeat
```

### Compare All Templates
```bash
python test_adaptive_rfm.py compare XqkVGb
```

Output:
```
📊 TEMPLATE COMPARISON
================================================================================

Metric                    Low-Repeat      Medium-Repeat   High-Repeat
---------------------------------------------------------------------------
Hot                       30d             28d             21d
Warm                      90d             70d             45d
Cool                      180d            140d            90d
At Risk                   365d            287d            180d
Lost                      730d            430d            270d

📝 RECOMMENDATION:
   Auto-detected template: MEDIUM-REPEAT
   Based on: 75.3% one-time buyers

💡 Use the auto-detected template for best results!
```

### Batch Analyze Multiple Stores
```bash
python test_adaptive_rfm.py batch XqkVGb pE5xw6 abc123
```

---

## Integration with Existing RFM

### Current System (RFM.md)
- **Percentile-based scoring** (5-point scale)
- **11 standard segments** (Champions, Loyal, etc.)
- Works for ALL verticals
- Uses relative scoring within each store

### Adaptive RFM Addition
- **Dynamic recency thresholds** (what "recent" means)
- **3 business templates** (low/medium/high repeat)
- **Auto-detection** of business model
- **Calculated from actual data** (inter-purchase intervals)

### How They Work Together

**Option 1: Use Adaptive Thresholds for Segment Boundaries**

Instead of using percentile-based recency scoring, use adaptive thresholds:

```python
# OLD: Percentile-based
recency_score = 5 if recency <= p20 else 4 if recency <= p40 else ...

# NEW: Adaptive threshold-based
recency_score = 5 if recency <= adaptive_thresholds.hot else \
                4 if recency <= adaptive_thresholds.warm else \
                3 if recency <= adaptive_thresholds.cool else \
                2 if recency <= adaptive_thresholds.at_risk else 1
```

**Option 2: Parallel Systems**

1. **Standard RFM** (percentile): For comparing customers within a store
2. **Adaptive RFM** (thresholds): For understanding business health and lifecycle stages

---

## Edge Cases Handled

### 1. Insufficient Data (<30 repeat purchases)

**Solution:** Use industry defaults based on AOV and template

```python
if repeat_purchase_sample_size < 30:
    logger.warning("Limited data, using defaults")
    thresholds = get_default_thresholds(template, avg_aov)
```

### 2. Seasonal Businesses (Holiday decorations, winter coats)

**Solution:** Extend "at risk" and "lost" thresholds by 20%

```python
if is_seasonal:
    at_risk *= 1.2
    lost *= 1.2
```

### 3. Subscription + One-Time Mix

**Solution:** Detect subscription pattern and tighten thresholds

```python
if has_subscription_pattern:
    hot *= 0.7  # Catch subscription lapses faster
    warm *= 0.7
    cool *= 0.7
```

### 4. Multi-Category Stores (T-shirts + Winter coats)

**Detection:** High AOV standard deviation

**Future Enhancement:** Calculate thresholds per product category

### 5. Very Long Cycles (Furniture, 2+ year repurchase)

**Solution:** Cap thresholds at reasonable maximums

```python
at_risk = min(730, calculated_at_risk)  # Cap at 2 years
lost = min(1095, calculated_lost)       # Cap at 3 years
```

---

## Data Storage

### MongoDB (`stores` collection) - V3.0 Schema

```javascript
{
  "public_id": "XqkVGb",
  "adaptive_rfm_config": {
    "version": "3.0",
    "last_updated": "2025-10-07T10:30:00",

    // Business characteristics (same as v2.0)
    "business_characteristics": {
      "one_time_buyer_percentage": 87.2,
      "detected_template": "low_repeat",
      "confidence_score": 0.95,
      "median_inter_purchase_days": 156,
      "avg_order_value": 245.50,
      // ... other metrics
    },

    // V3.0: Absolute criteria with explainability
    "calculated_criteria": {
      "frequency": {
        "champion": {
          "min_orders": 2,
          "baseline_used": 3,
          "adjusted": true,
          "adjustment_reason": "Only 0.8% met baseline (3+ orders), lowered to 2+ for meaningful segment",
          "pct_customers_meeting": 7.6,
          "expected_range": [2.0, 8.0],
          "is_healthy": true
        },
        "loyal": {
          "min_orders": 2,
          "baseline_used": 2,
          "adjusted": false,
          "adjustment_reason": "12.3% meet criteria (2+ orders), within healthy range",
          "pct_customers_meeting": 12.3,
          "expected_range": [5.0, 15.0],
          "is_healthy": true
        },
        "active": {
          "min_orders": 1,
          "baseline_used": 1,
          "adjusted": false,
          "adjustment_reason": "All customers with 1+ order are considered active",
          "pct_customers_meeting": 100.0,
          "expected_range": [90.0, 100.0],
          "is_healthy": true
        }
      },
      "monetary": {
        "champion": {
          "min_revenue": 450.00,
          "percentile_used": 0.90,
          "pct_customers_meeting": 10.2,
          "expected_range": [8.0, 12.0],
          "is_healthy": true
        },
        "loyal": {
          "min_revenue": 250.00,
          "percentile_used": 0.75,
          "pct_customers_meeting": 24.8,
          "expected_range": [20.0, 30.0],
          "is_healthy": true
        },
        "active": {
          "min_revenue": 100.00,
          "percentile_used": 0.60,
          "pct_customers_meeting": 39.5,
          "expected_range": [35.0, 45.0],
          "is_healthy": true
        }
      }
    },

    // Validation result
    "validation": {
      "distribution_healthy": true,
      "warnings": [],
      "recommendations": [
        "Champion distribution (7.6%) is healthy",
        "Loyal distribution (12.3%) is healthy",
        "Consider reviewing thresholds monthly as data grows"
      ]
    },

    // Recency thresholds (same as v2.0)
    "thresholds": {
      "hot": 30,
      "warm": 90,
      "cool": 180,
      "at_risk": 365,
      "lost": 730
    },

    // V3.0: User override system
    "overrides": {
      "enabled": false,
      "frequency": {
        "champion_min_orders": null,
        "loyal_min_orders": null,
        "active_min_orders": null
      },
      "monetary": {
        "champion_percentile": null,
        "loyal_percentile": null,
        "active_percentile": null
      },
      "metadata": {
        "modified_by": null,
        "modified_at": null,
        "reason": null
      }
    },

    // Template used
    "template_used": "low_repeat",

    // Data quality metrics
    "data_quality": {
      "total_customers": 10000,
      "repeat_sample_size": 1280,
      "is_sufficient": true,
      "total_orders": 11280,
      "date_range_days": 730
    }
  }
}
```

### MongoDB Schema (Mongoose Model)

Complete schema definition from [Store.model.js](../Store.model.js):

```javascript
const AdaptiveRFMConfigSchema = new Schema({
  version: {
    type: String,
    enum: ["1.0", "2.0", "3.0"],
    default: "3.0"
  },

  last_updated: {
    type: Date,
    default: Date.now
  },

  business_characteristics: {
    one_time_buyer_percentage: { type: Number, default: 0 },
    detected_template: {
      type: String,
      enum: ["low_repeat", "medium_repeat", "high_repeat"],
      default: null
    },
    confidence_score: { type: Number, default: 0 },
    median_inter_purchase_days: { type: Number, default: null },
    avg_order_value: { type: Number, default: 0 },
    // ... other characteristics
  },

  calculated_criteria: {
    frequency: {
      champion: {
        min_orders: { type: Number, default: null },
        baseline_used: { type: Number, default: null },
        adjusted: { type: Boolean, default: false },
        adjustment_reason: { type: String, default: null },
        pct_customers_meeting: { type: Number, default: 0 },
        expected_range: [{ type: Number }],
        is_healthy: { type: Boolean, default: true }
      },
      loyal: { /* same structure */ },
      active: { /* same structure */ }
    },
    monetary: {
      champion: {
        min_revenue: { type: Number, default: null },
        percentile_used: { type: Number, default: null },
        pct_customers_meeting: { type: Number, default: 0 },
        expected_range: [{ type: Number }],
        is_healthy: { type: Boolean, default: true }
      },
      loyal: { /* same structure */ },
      active: { /* same structure */ }
    }
  },

  validation: {
    distribution_healthy: { type: Boolean, default: true },
    warnings: [{ type: String }],
    recommendations: [{ type: String }]
  },

  thresholds: {
    hot: { type: Number, default: 30 },
    warm: { type: Number, default: 60 },
    cool: { type: Number, default: 90 },
    at_risk: { type: Number, default: 180 },
    lost: { type: Number, default: 365 }
  },

  overrides: {
    enabled: { type: Boolean, default: false },
    frequency: {
      champion_min_orders: { type: Number, default: null },
      loyal_min_orders: { type: Number, default: null },
      active_min_orders: { type: Number, default: null }
    },
    monetary: {
      champion_percentile: { type: Number, default: null },
      loyal_percentile: { type: Number, default: null },
      active_percentile: { type: Number, default: null }
    },
    metadata: {
      modified_by: { type: ObjectId, ref: "User", default: null },
      modified_at: { type: Date, default: null },
      reason: { type: String, default: null }
    }
  },

  template_used: {
    type: String,
    enum: ["low_repeat", "medium_repeat", "high_repeat"],
    default: null
  },

  data_quality: {
    total_customers: { type: Number, default: 0 },
    repeat_sample_size: { type: Number, default: 0 },
    is_sufficient: { type: Boolean, default: false },
    total_orders: { type: Number, default: 0 },
    date_range_days: { type: Number, default: 0 }
  }
});

// Helper methods
StoreSchema.methods.getRFMCriteria = function() {
  if (!this.adaptive_rfm_config || this.adaptive_rfm_config.version !== "3.0") {
    return null;
  }
  return {
    version: this.adaptive_rfm_config.version,
    calculated_criteria: this.adaptive_rfm_config.calculated_criteria,
    validation: this.adaptive_rfm_config.validation,
    has_override: this.adaptive_rfm_config.overrides.enabled
  };
};

StoreSchema.methods.needsRFMRecalculation = function() {
  if (!this.adaptive_rfm_config || !this.adaptive_rfm_config.last_updated) {
    return true;
  }
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.adaptive_rfm_config.last_updated < thirtyDaysAgo;
};

StoreSchema.methods.hasRFMOverride = function() {
  return this.adaptive_rfm_config?.overrides?.enabled || false;
};
```

### MongoDB (`rfm_config_history` collection)

Same structure as above, but stores historical snapshots for tracking changes over time. Used for:
- Monthly comparison: "Did thresholds change?"
- Override audit trail: "Who changed what and when?"
- Distribution health tracking: "Are champions growing or shrinking?"

---

## Maintenance

### Monthly Recalculation

Thresholds should be recalculated monthly as your data grows:

```bash
POST /api/v2/adaptive-rfm/recalculate-thresholds
```

**Why monthly?**
- Purchase patterns evolve
- Sample size increases
- Seasonality becomes clearer
- More accurate thresholds

### Monitoring

Watch for:
- **Confidence score drops** - Data quality issues
- **Template changes** - Business model shifting
- **Unbalanced distributions** - Threshold adjustments needed
- **Sample size growth** - Can move from defaults to calculated thresholds

---

## Dashboard Integration (V3.0)

### Displaying Explainability in UI

The v3.0 system is designed for dashboard display with complete explainability:

**Champion Criteria Card:**
```jsx
// React/Next.js component
function ChampionCriteriaCard({ criteria }) {
  const { champion_frequency, champion_monetary } = criteria.calculated_criteria;

  return (
    <Card>
      <CardHeader>
        <h3>Champion Customers</h3>
        <Badge variant={champion_frequency.is_healthy ? "success" : "warning"}>
          {champion_frequency.pct_customers_meeting}% of customers
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="criteria-row">
          <span className="label">Frequency:</span>
          <span className="value">
            {champion_frequency.min_orders}+ orders
            {champion_frequency.adjusted && (
              <Tooltip content={champion_frequency.adjustment_reason}>
                <Icon name="info" />
              </Tooltip>
            )}
          </span>
        </div>

        <div className="criteria-row">
          <span className="label">Monetary:</span>
          <span className="value">
            ${champion_monetary.min_revenue}+ lifetime value
            (top {(1 - champion_monetary.percentile_used) * 100}%)
          </span>
        </div>

        <Alert variant="info">
          <AlertIcon />
          <AlertTitle>Why these criteria?</AlertTitle>
          <AlertDescription>
            {champion_frequency.adjustment_reason}
          </AlertDescription>
        </Alert>

        <HealthIndicator
          current={champion_frequency.pct_customers_meeting}
          expected={champion_frequency.expected_range}
          label="Champion Distribution"
        />
      </CardContent>
    </Card>
  );
}
```

**Validation Warnings Display:**
```jsx
function ValidationWarnings({ validation }) {
  if (validation.distribution_healthy && validation.warnings.length === 0) {
    return (
      <Alert variant="success">
        <CheckIcon />
        <span>All RFM criteria are healthy</span>
      </Alert>
    );
  }

  return (
    <div className="validation-section">
      {validation.warnings.map((warning, i) => (
        <Alert key={i} variant="warning">
          <WarningIcon />
          <span>{warning}</span>
        </Alert>
      ))}

      {validation.recommendations.map((rec, i) => (
        <Alert key={i} variant="info">
          <InfoIcon />
          <span>{rec}</span>
        </Alert>
      ))}
    </div>
  );
}
```

**Criteria Comparison Table:**
```jsx
function CriteriaComparisonTable({ criteria }) {
  const tiers = ['champion', 'loyal', 'active'];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tier</TableHead>
          <TableHead>Min Orders</TableHead>
          <TableHead>Min Revenue</TableHead>
          <TableHead>% Meeting</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tiers.map(tier => {
          const freq = criteria.calculated_criteria.frequency[tier];
          const mon = criteria.calculated_criteria.monetary[tier];

          return (
            <TableRow key={tier}>
              <TableCell className="font-bold">{tier}</TableCell>
              <TableCell>
                {freq.min_orders}+
                {freq.adjusted && <Badge>Adjusted</Badge>}
              </TableCell>
              <TableCell>${mon.min_revenue.toFixed(2)}+</TableCell>
              <TableCell>
                {freq.pct_customers_meeting.toFixed(1)}%
                <Progress
                  value={freq.pct_customers_meeting}
                  max={freq.expected_range[1]}
                  className="mt-1"
                />
              </TableCell>
              <TableCell>
                {freq.is_healthy ? (
                  <Badge variant="success">Healthy</Badge>
                ) : (
                  <Badge variant="warning">Needs Review</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

**User Override Form:**
```jsx
function OverrideCriteriaForm({ klaviyoPublicId, currentCriteria }) {
  const [overrides, setOverrides] = useState({
    champion_min_orders: currentCriteria.champion_frequency.min_orders,
    loyal_min_orders: currentCriteria.loyal_frequency.min_orders,
  });
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/v2/adaptive-rfm/v3/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        klaviyo_public_id: klaviyoPublicId,
        frequency_overrides: overrides,
        modified_by: user.email,
        reason: reason
      })
    });

    const result = await response.json();
    // Show success message and updated criteria
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField>
        <Label>Champion Min Orders</Label>
        <Input
          type="number"
          value={overrides.champion_min_orders}
          onChange={(e) => setOverrides({
            ...overrides,
            champion_min_orders: parseInt(e.target.value)
          })}
        />
        <FormDescription>
          Current: {currentCriteria.champion_frequency.min_orders} orders
          (affects {currentCriteria.champion_frequency.pct_customers_meeting}% of customers)
        </FormDescription>
      </FormField>

      <FormField>
        <Label>Reason for Override</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you overriding the auto-calculated criteria?"
          required
        />
      </FormField>

      <Button type="submit">Apply Override</Button>
    </Form>
  );
}
```

### Fetching v3.0 Data

**On Page Load:**
```typescript
// Load criteria for display
async function loadRFMCriteria(klaviyoPublicId: string) {
  const response = await fetch(
    `/api/v2/adaptive-rfm/v3/criteria/${klaviyoPublicId}`
  );

  if (!response.ok) {
    throw new Error('Failed to load RFM criteria');
  }

  const data = await response.json();

  // Check if needs recalculation (last updated > 30 days ago)
  const lastUpdated = new Date(data.last_calculated);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (lastUpdated < thirtyDaysAgo) {
    // Show banner: "RFM criteria are outdated. Recalculate?"
    return { ...data, needs_recalculation: true };
  }

  return data;
}
```

**Recalculate Button:**
```typescript
async function recalculateRFM(klaviyoPublicId: string) {
  const response = await fetch('/api/v2/adaptive-rfm/v3/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      klaviyo_public_id: klaviyoPublicId,
      return_json_only: false  // Save to MongoDB
    })
  });

  const result = await response.json();

  if (result.success) {
    // Show success toast
    // Reload criteria display
    return result;
  }
}
```

**Preview Before Save:**
```typescript
async function previewRFMChanges(klaviyoPublicId: string) {
  const response = await fetch('/api/v2/adaptive-rfm/v3/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      klaviyo_public_id: klaviyoPublicId,
      return_json_only: true  // DON'T save, just preview
    })
  });

  const result = await response.json();

  // Show modal with new criteria
  // User can confirm or cancel
  return result;
}
```

---

## Examples by Vertical

### Perfume Store (Low-Repeat) - V3.0 Output

```json
{
  "version": "3.0",
  "characteristics": {
    "one_time_buyer_percentage": 87.2,
    "detected_template": "low_repeat",
    "confidence_score": 0.95,
    "median_inter_purchase_days": 156
  },
  "calculated_criteria": {
    "frequency": {
      "champion": {
        "min_orders": 2,
        "baseline_used": 3,
        "adjusted": true,
        "adjustment_reason": "Only 0.8% met baseline (3+ orders), lowered to 2+ for meaningful segment",
        "pct_customers_meeting": 7.6,
        "expected_range": [2.0, 8.0],
        "is_healthy": true
      },
      "loyal": {
        "min_orders": 2,
        "baseline_used": 2,
        "adjusted": false,
        "adjustment_reason": "12.3% meet criteria (2+ orders), within healthy range",
        "pct_customers_meeting": 12.3,
        "expected_range": [5.0, 15.0],
        "is_healthy": true
      }
    },
    "monetary": {
      "champion": {
        "min_revenue": 450.00,
        "percentile_used": 0.90,
        "pct_customers_meeting": 10.2,
        "expected_range": [8.0, 12.0],
        "is_healthy": true
      }
    }
  },
  "thresholds": {
    "hot": 30,
    "warm": 90,
    "cool": 180,
    "at_risk": 365,
    "lost": 730
  },
  "validation": {
    "distribution_healthy": true,
    "warnings": [],
    "recommendations": [
      "Champion distribution (7.6%) is healthy",
      "Loyal distribution (12.3%) is healthy"
    ]
  }
}
```

**Key Insights:**
- Auto-adjusted champion threshold from 3→2 orders (too few customers met baseline)
- Loyal criteria at 2+ orders is healthy (12.3% meet it)
- Champion monetary at $450+ (top 10% revenue)
- Focus: Converting first-timers, identifying high-LTV customers

---

### Fashion Brand (Medium-Repeat) - V3.0 Output

```json
{
  "version": "3.0",
  "characteristics": {
    "one_time_buyer_percentage": 62.4,
    "detected_template": "medium_repeat",
    "confidence_score": 0.82,
    "median_inter_purchase_days": 73
  },
  "calculated_criteria": {
    "frequency": {
      "champion": {
        "min_orders": 5,
        "baseline_used": 5,
        "adjusted": false,
        "adjustment_reason": "11.2% meet criteria (5+ orders), within healthy range",
        "pct_customers_meeting": 11.2,
        "expected_range": [5.0, 15.0],
        "is_healthy": true
      },
      "loyal": {
        "min_orders": 3,
        "baseline_used": 3,
        "adjusted": false,
        "adjustment_reason": "22.8% meet criteria (3+ orders), within healthy range",
        "pct_customers_meeting": 22.8,
        "expected_range": [15.0, 30.0],
        "is_healthy": true
      }
    },
    "monetary": {
      "champion": {
        "min_revenue": 850.00,
        "percentile_used": 0.85,
        "pct_customers_meeting": 14.8,
        "expected_range": [12.0, 18.0],
        "is_healthy": true
      }
    }
  },
  "thresholds": {
    "hot": 28,
    "warm": 58,
    "cool": 115,
    "at_risk": 230,
    "lost": 345
  },
  "validation": {
    "distribution_healthy": true,
    "warnings": [],
    "recommendations": [
      "Champion distribution (11.2%) is healthy",
      "Loyal distribution (22.8%) is healthy"
    ]
  }
}
```

**Key Insights:**
- No adjustment needed - baseline criteria already healthy
- Champion at 5+ orders (11.2% of customers)
- Loyal at 3+ orders (22.8% of customers)
- Champion monetary at $850+ (top 15% revenue)
- Focus: Building loyalty, seasonal campaigns

---

### Supplement Brand (High-Repeat) - V3.0 Output

```json
{
  "version": "3.0",
  "characteristics": {
    "one_time_buyer_percentage": 28.3,
    "detected_template": "high_repeat",
    "confidence_score": 0.91,
    "median_inter_purchase_days": 32,
    "has_subscription_pattern": true
  },
  "calculated_criteria": {
    "frequency": {
      "champion": {
        "min_orders": 7,
        "baseline_used": 6,
        "adjusted": true,
        "adjustment_reason": "32.1% met baseline (6+ orders), raised to 7+ to keep champions exclusive",
        "pct_customers_meeting": 18.9,
        "expected_range": [15.0, 25.0],
        "is_healthy": true
      },
      "loyal": {
        "min_orders": 4,
        "baseline_used": 4,
        "adjusted": false,
        "adjustment_reason": "42.5% meet criteria (4+ orders), within healthy range",
        "pct_customers_meeting": 42.5,
        "expected_range": [30.0, 50.0],
        "is_healthy": true
      }
    },
    "monetary": {
      "champion": {
        "min_revenue": 320.00,
        "percentile_used": 0.80,
        "pct_customers_meeting": 19.8,
        "expected_range": [16.0, 24.0],
        "is_healthy": true
      }
    }
  },
  "thresholds": {
    "hot": 17,
    "warm": 38,
    "cool": 75,
    "at_risk": 150,
    "lost": 225
  },
  "validation": {
    "distribution_healthy": true,
    "warnings": [],
    "recommendations": [
      "Champion distribution (18.9%) is healthy",
      "Loyal distribution (42.5%) is healthy",
      "Subscription pattern detected - thresholds tightened by 30%"
    ]
  }
}
```

**Key Insights:**
- Auto-adjusted champion threshold from 6→7 orders (too many customers met baseline)
- Loyal criteria at 4+ orders is healthy (42.5% meet it)
- Champion monetary at $320+ (top 20% revenue)
- Subscription pattern detected - recency thresholds tightened
- Focus: Subscription optimization, retention

---

## Key Advantages

### V3.0 Improvements

✅ **Absolute Thresholds**: "3+ orders" instead of confusing "top 5%" percentiles
✅ **Auto-Validation**: System validates thresholds produce healthy distributions
✅ **Complete Explainability**: Every criteria includes `adjustment_reason` for dashboard
✅ **User Override System**: Power users can manually adjust with audit trail
✅ **Dashboard-Ready**: Structured JSON with all fields needed for UI display
✅ **MongoDB Integration**: Saves to `stores.adaptive_rfm_config` with helper methods

### Core Features (All Versions)

✅ **Adaptive**: Learns from YOUR data, not generic defaults
✅ **Scalable**: Auto-detects template for thousands of brands
✅ **Validated**: Checks distributions to ensure quality
✅ **Fallback-safe**: Uses industry defaults when data is sparse
✅ **Template-aware**: Different logic for different business models
✅ **Production-ready**: Save/load configurations, track history

---

## Files

### Python Backend

- **Service:** [services/adaptive_rfm_service.py](../services/adaptive_rfm_service.py)
  - Lines 172-209: `BASELINE_ABSOLUTE_CRITERIA` configuration
  - Lines 827-1049: `calculate_absolute_criteria_with_validation()` v3.0 logic
  - Lines 1602-1755: `run_v3_analysis()` pipeline

- **Router:** [routers/adaptive_rfm.py](../routers/adaptive_rfm.py)
  - Lines 368-581: V3.0 API endpoints (`/v3/calculate`, `/v3/override`, `/v3/criteria`)

- **Test:** `test_adaptive_rfm.py` (v2.0 tests)

### MongoDB

- **Model:** [Store.model.js](../Store.model.js)
  - Lines 236-400: `adaptive_rfm_config` schema (v3.0)
  - Lines 682-750: Helper methods (`getRFMCriteria()`, `needsRFMRecalculation()`)

### Documentation

- **This File:** `context/ADAPTIVE_RFM.md`
- **V3.0 Implementation Guide:** `ADAPTIVE_RFM_V3_IMPLEMENTATION.md`
- **V3.0 Quick Start:** `ADAPTIVE_RFM_V3_QUICK_START.md`

---

## Next Steps

### For v3.0 Implementation

1. **Calculate v3.0 criteria** for your stores:
```bash
POST /api/v2/adaptive-rfm/v3/calculate
{"klaviyo_public_id": "XqkVGb", "return_json_only": false}
```

2. **Integrate MongoDB model** - Add `adaptive_rfm_config` to your Store schema

3. **Build dashboard UI** - Use the React/Next.js components above to display:
   - Champion/Loyal/Active criteria cards
   - Adjustment reason explanations
   - Validation warnings and recommendations
   - User override form (power users)

4. **Set up monthly recalculation** - Auto-run `/v3/calculate` every 30 days

5. **Monitor distribution health** - Check `validation.distribution_healthy` regularly


---

## FAQ

**Q: Should I use percentile-based RFM or adaptive thresholds?**

A: Both! Use percentile-based for scoring customers relative to each other (who's better/worse), and adaptive thresholds for understanding lifecycle stages (who's at risk of churning).

**Q: How often should I recalculate?**

A: Monthly for most brands. More frequently if you're growing fast or have seasonal patterns. The system includes `needsRFMRecalculation()` helper method to check if recalculation is needed.

**Q: What if the auto-calculated thresholds don't match my business?**

A: Use the user override system:
```bash
POST /api/v2/adaptive-rfm/v3/override
{
  "frequency_overrides": {"champion_min_orders": 4},
  "modified_by": "admin@example.com",
  "reason": "Our luxury brand needs stricter criteria"
}
```

All overrides are tracked with audit trail (who, when, why).

**Q: What if my confidence score is low?**

A: Low confidence (<0.7) means either:
- Insufficient data (<30 repeat purchases)
- Your business is between templates (e.g., 50% one-timers)
- Mixed purchase patterns

Solution: Use the auto-detected template and recalculate as data grows.

**Q: Can I preview criteria before saving?**

A: Yes! Use `return_json_only: true` to preview without saving to MongoDB:
```bash
POST /api/v2/adaptive-rfm/v3/calculate
{"klaviyo_public_id": "XqkVGb", "return_json_only": true}
```

**Q: How do I show the adjustment reason on my dashboard?**

A: Every criteria includes `adjustment_reason` field:
```jsx
<Tooltip content={criteria.champion_frequency.adjustment_reason}>
  <Icon name="info" />
</Tooltip>
```

**Q: What if too many customers meet the champion criteria?**

A: The system auto-adjusts! If >8% meet baseline for LOW_REPEAT template, it raises the threshold by 1 order and documents the reason in `adjustment_reason`.

**Q: What about B2B or wholesale?**

A: The current system is optimized for B2C e-commerce. B2B needs completely different logic (relationship-based, not transaction-frequency-based).

---

**🚀 Ready to get started with v3.0?**

```bash
# Test v3.0 calculation
curl -X POST https://your-api.com/api/v2/adaptive-rfm/v3/calculate \
  -H "Content-Type: application/json" \
  -d '{"klaviyo_public_id": "YourKlaviyoID", "return_json_only": false}'
```

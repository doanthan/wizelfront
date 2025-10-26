# AI Chatbot Query Templates for Marketing Analysis

**Date:** 2025-10-23
**Purpose:** SQL query templates for AI chatbot to analyze Klaviyo campaign/flow performance
**Database:** ClickHouse with materialized views

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Campaign Performance Queries](#campaign-performance-queries)
3. [Flow Performance Queries](#flow-performance-queries)
4. [Comparison & Trend Queries](#comparison--trend-queries)
5. [Channel Performance Queries](#channel-performance-queries)
6. [Pattern Detection Queries](#pattern-detection-queries)
7. [Multi-Store Queries](#multi-store-queries)
8. [Marketing Language Mappings](#marketing-language-mappings)

---

## Quick Reference

### Available Materialized Views

| View Name | Purpose | Update Frequency | Token Cost |
|-----------|---------|------------------|------------|
| `campaign_ai_summary` | Daily campaign metrics with trends | Daily | ~15 tokens/row |
| `flow_ai_summary` | Daily flow metrics with trends | Daily | ~15 tokens/row |
| `campaign_weekly_rollup` | Weekly campaign aggregates | Daily | ~10 tokens/row |
| `flow_weekly_rollup` | Weekly flow aggregates | Daily | ~10 tokens/row |
| `channel_performance_daily` | Channel comparison | Daily | ~8 tokens/row |

### Available Helper Views (Read-Only)

| View Name | Time Window | Use Case |
|-----------|-------------|----------|
| `ai_campaign_recent` | Last 7 days | "this week" queries |
| `ai_flow_recent` | Last 7 days | "this week" queries |
| `ai_campaign_weekly` | Weeks 2-4 | "last month" queries |
| `ai_flow_weekly` | Weeks 2-4 | "last month" queries |
| `ai_historical_baseline` | 90+ days (monthly) | "historical trend" queries |
| `ai_channel_comparison` | All time | "email vs SMS" queries |
| `ai_best_performers` | Last 30 days | "top campaigns" queries |
| `ai_day_of_week_patterns` | Last 90 days | "best send day" queries |

---

## Campaign Performance Queries

### Query 1: "How are my campaigns performing this week?"

```sql
SELECT
    campaign_name,
    send_channel,
    date,
    revenue,
    open_rate_pct,
    click_rate_pct,
    recipients,
    wow_revenue_change_pct,
    vs_account_revenue_pct,
    performance_label,
    data_freshness
FROM ai_campaign_recent
WHERE klaviyo_public_id = '{klaviyo_id}'
ORDER BY revenue DESC
LIMIT 10;
```

**Marketing Language Output:**
```
Top Campaigns This Week:

1. "Fall Sale - Final Hours" (Friday, Oct 20)
   • Revenue: $12,450 (+18% vs last week)
   • Open Rate: 34.2% (23% above your average)
   • Performance: Excellent

2. "New Arrivals Alert" (Wednesday, Oct 18)
   • Revenue: $8,920 (+12% vs last week)
   • Open Rate: 31.5% (15% above your average)
   • Performance: Good
```

---

### Query 2: "What were my top 10 campaigns by revenue last month?"

```sql
SELECT
    campaign_name,
    send_channel,
    sum(total_revenue) as total_revenue,
    avg(avg_open_rate_pct) as avg_open_rate,
    avg(avg_click_rate_pct) as avg_click_rate,
    count() as weeks_active,
    max(best_day_revenue) as best_single_day
FROM ai_campaign_weekly
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND week_start_date >= toMonday(today()) - 28
GROUP BY campaign_name, send_channel
ORDER BY total_revenue DESC
LIMIT 10;
```

**Marketing Language Output:**
```
Top 10 Campaigns - Last Month:

1. Black Friday Email - $45,680
   • Avg Open Rate: 38.5%
   • Best Day: $18,920 (Nov 25)
   • Sent across 4 weeks

2. Cyber Monday SMS - $32,450
   • Avg Click Rate: 12.3%
   • Best Day: $15,230 (Nov 28)
```

---

### Query 3: "Show me campaigns with less than 15% open rate in last 90 days"

```sql
SELECT
    campaign_name,
    send_channel,
    avg(open_rate * 100) as avg_open_rate_pct,
    count() as times_sent,
    sum(recipients) as total_recipients,
    sum(conversion_value) as total_revenue,
    account_avg_open_rate * 100 as account_average_pct,
    performance_label
FROM campaign_ai_summary
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND date >= today() - 90
  AND open_rate * 100 < 15
GROUP BY campaign_name, send_channel, account_avg_open_rate, performance_label
ORDER BY times_sent DESC;
```

**Marketing Language Output:**
```
⚠️ Underperforming Campaigns (Last 90 Days):

1. "Daily Deals Newsletter"
   • Avg Open Rate: 12.3% (vs account avg: 28.5%)
   • Sent 23 times
   • Status: Needs Attention

Recommendation: Review subject lines and send time, consider re-engagement campaign
```

---

## Flow Performance Queries

### Query 4: "What flows are generating the most revenue?"

```sql
SELECT
    flow_name,
    send_channel,
    sum(revenue) as total_revenue,
    avg(open_rate_pct) as avg_open_rate,
    avg(click_rate_pct) as avg_click_rate,
    avg(conversion_rate_pct) as avg_conversion_rate,
    count() as active_days,
    performance_label
FROM ai_flow_recent
WHERE klaviyo_public_id = '{klaviyo_id}'
GROUP BY flow_name, send_channel, performance_label
ORDER BY total_revenue DESC;
```

**Marketing Language Output:**
```
Top Revenue-Generating Flows (Last 7 Days):

1. Abandoned Cart Recovery - $8,340
   • Channel: Email
   • Avg Conversion Rate: 5.2%
   • Performance: Excellent
   • Active: 7 days

2. Welcome Series - $5,180
   • Channel: Email
   • Avg Open Rate: 42.3%
   • Performance: Good
```

---

### Query 5: "Compare abandoned cart flow performance across all my stores"

```sql
SELECT
    klaviyo_public_id,
    flow_name,
    send_channel,
    sum(total_revenue) as total_revenue,
    avg(avg_open_rate_pct) as avg_open_rate,
    avg(avg_conversion_rate_pct) as avg_conversion_rate,
    count() as weeks_active
FROM flow_weekly_rollup
WHERE flow_name LIKE '%Abandoned%Cart%'
  AND week_start_date >= toMonday(today()) - 28
GROUP BY klaviyo_public_id, flow_name, send_channel
ORDER BY total_revenue DESC;
```

**Marketing Language Output:**
```
Abandoned Cart Flow Performance (Multi-Store):

Store A (XqkVGb):
• Revenue: $18,920
• Open Rate: 38.5%
• Conversion: 5.8%
• Status: Top Performer

Store B (Pe5Xw6):
• Revenue: $12,340
• Open Rate: 32.1%
• Conversion: 4.2%
• Status: Good

Insight: Store A's flow performs 53% better than Store B
Recommendation: Audit Store B's flow timing and incentives
```

---

## Comparison & Trend Queries

### Query 6: "Compare last 7 days vs previous 7 days"

```sql
WITH current_period AS (
    SELECT
        sum(revenue) as revenue,
        count() as campaigns_sent,
        avg(open_rate_pct) as avg_open_rate,
        avg(click_rate_pct) as avg_click_rate
    FROM ai_campaign_recent
    WHERE klaviyo_public_id = '{klaviyo_id}'
      AND date >= today() - 7
),
previous_period AS (
    SELECT
        sum(conversion_value) as revenue,
        count() as campaigns_sent,
        avg(open_rate * 100) as avg_open_rate,
        avg(click_rate * 100) as avg_click_rate
    FROM campaign_ai_summary
    WHERE klaviyo_public_id = '{klaviyo_id}'
      AND date >= today() - 14
      AND date < today() - 7
)
SELECT
    current_period.revenue as current_revenue,
    previous_period.revenue as previous_revenue,
    ((current_period.revenue - previous_period.revenue) / previous_period.revenue) * 100 as revenue_change_pct,

    current_period.campaigns_sent as current_campaigns,
    previous_period.campaigns_sent as previous_campaigns,

    current_period.avg_open_rate as current_open_rate,
    previous_period.avg_open_rate as previous_open_rate,
    current_period.avg_open_rate - previous_period.avg_open_rate as open_rate_change_pts

FROM current_period, previous_period;
```

**Marketing Language Output:**
```
📊 Week-over-Week Performance:

Current Period (Oct 15-21):
• Revenue: $58,920 (+36% vs previous week)
• Campaigns: 8 (+2 campaigns)
• Avg Open Rate: 32.5% (+4.2 percentage points)

Previous Period (Oct 8-14):
• Revenue: $43,230
• Campaigns: 6
• Avg Open Rate: 28.3%

Trend: Strong upward momentum
```

---

### Query 7: "Show me revenue trends week-over-week"

```sql
SELECT
    week_start_date,
    sum(total_revenue) as weekly_revenue,
    avg(avg_open_rate_pct) as avg_open_rate,
    count(DISTINCT campaign_id) as unique_campaigns,
    avg(wow_revenue_change_pct) as wow_change_pct
FROM campaign_weekly_rollup
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND week_start_date >= toMonday(today()) - 84  -- Last 12 weeks
GROUP BY week_start_date
ORDER BY week_start_date DESC;
```

**Marketing Language Output:**
```
Weekly Revenue Trends (Last 12 Weeks):

Week of Oct 16: $28,450 (+18% vs prior week)
Week of Oct 9:  $24,120 (+5% vs prior week)
Week of Oct 2:  $22,980 (-3% vs prior week)
Week of Sep 25: $23,680 (+12% vs prior week)

Average Weekly Revenue: $24,807
Trend: Growing (+8% overall)
```

---

## Channel Performance Queries

### Query 8: "Compare email vs SMS vs push performance"

```sql
SELECT
    send_channel,
    revenue_last_7d,
    open_rate_last_7d_pct,
    click_rate_last_7d_pct,
    revenue_last_30d,
    pct_of_total_revenue,

    -- Calculate revenue per send
    revenue_last_7d / nullif(total_sends_7d, 0) as revenue_per_send_7d

FROM (
    SELECT
        send_channel,
        sum(if(date >= today() - 7, total_revenue, 0)) as revenue_last_7d,
        avg(if(date >= today() - 7, avg_open_rate, NULL)) * 100 as open_rate_last_7d_pct,
        avg(if(date >= today() - 7, avg_click_rate, NULL)) * 100 as click_rate_last_7d_pct,
        sum(if(date >= today() - 30, total_revenue, 0)) as revenue_last_30d,
        sum(if(date >= today() - 7, total_sends, 0)) as total_sends_7d,
        avg(pct_of_total_revenue) as pct_of_total_revenue
    FROM channel_performance_daily
    WHERE klaviyo_public_id = '{klaviyo_id}'
    GROUP BY send_channel
)
ORDER BY revenue_last_7d DESC;
```

**Marketing Language Output:**
```
Channel Performance Comparison:

📧 Email:
• Last 7 Days: $41,230 (70% of revenue)
• Open Rate: 28.5%
• Click Rate: 3.2%
• Revenue/Send: $5,154

📱 SMS:
• Last 7 Days: $17,690 (30% of revenue)
• Click Rate: 12.3% (3.8x higher than email!)
• Revenue/Send: $8,845 (71% higher than email)

Insight: SMS has higher engagement and ROI per send
Recommendation: Increase SMS frequency for high-value segments
```

---

## Pattern Detection Queries

### Query 9: "What day of week performs best for campaigns?"

```sql
SELECT
    day_name,
    day_of_week,
    is_weekend,
    total_sends,
    avg_open_rate_pct,
    avg_click_rate_pct,
    avg_revenue,
    total_revenue,

    -- Rank by revenue
    rank() OVER (ORDER BY avg_revenue DESC) as revenue_rank

FROM ai_day_of_week_patterns
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND source = 'campaign'
ORDER BY avg_revenue DESC;
```

**Marketing Language Output:**
```
Best Send Days (Last 90 Days):

1. 🏆 Friday
   • Avg Revenue: $9,450
   • Avg Open Rate: 32.1%
   • Total Sends: 12
   • Weekend: No

2. Sunday
   • Avg Revenue: $8,920
   • Avg Open Rate: 31.5%
   • Total Sends: 8
   • Weekend: Yes (+15% vs weekday average)

3. Tuesday
   • Avg Revenue: $7,340
   • Avg Open Rate: 29.8%
   • Total Sends: 15

Recommendation: Focus on Friday and weekend sends for maximum revenue
```

---

### Query 10: "Detect performance anomalies"

```sql
SELECT
    date,
    campaign_name,
    send_channel,
    open_rate * 100 as open_rate_pct,
    ma_7day_open_rate * 100 as seven_day_avg_pct,
    (open_rate - ma_7day_open_rate) * 100 as deviation_pts,
    conversion_value as revenue,
    performance_label,
    is_anomaly
FROM campaign_ai_summary
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND date >= today() - 30
  AND is_anomaly = 1
ORDER BY date DESC;
```

**Marketing Language Output:**
```
⚠️ Performance Anomalies Detected (Last 30 Days):

Oct 15 - "Flash Sale Email"
• Open Rate: 45.2% (+12.3 pts vs 7-day avg)
• Deviation: Significantly above normal
• Status: Excellent
• Note: Spike due to high-urgency subject line

Oct 8 - "Weekly Newsletter"
• Open Rate: 15.3% (-13.2 pts vs 7-day avg)
• Deviation: Significantly below normal
• Status: Needs Attention
• Action Required: Review deliverability and list health
```

---

## Multi-Store Queries

### Query 11: "Compare all stores by revenue attribution"

```sql
SELECT
    klaviyo_public_id,
    sum(revenue) as total_revenue,
    avg(open_rate_pct) as avg_open_rate,
    avg(click_rate_pct) as avg_click_rate,
    count(DISTINCT CASE WHEN type = 'campaign' THEN name END) as unique_campaigns,
    count(DISTINCT CASE WHEN type = 'flow' THEN name END) as unique_flows,

    -- Performance classification
    CASE
        WHEN avg(open_rate_pct) > 30 THEN 'Top Performer'
        WHEN avg(open_rate_pct) > 25 THEN 'Above Average'
        WHEN avg(open_rate_pct) > 20 THEN 'Average'
        ELSE 'Needs Attention'
    END as performance_tier

FROM ai_best_performers
WHERE date >= today() - 30
GROUP BY klaviyo_public_id
ORDER BY total_revenue DESC;
```

**Marketing Language Output:**
```
Multi-Store Performance (Last 30 Days):

1. Store A (XqkVGb) - Top Performer
   • Revenue: $98,450
   • Avg Open Rate: 32.5%
   • Active Campaigns: 15
   • Active Flows: 7

2. Store B (Pe5Xw6) - Above Average
   • Revenue: $72,180
   • Avg Open Rate: 28.3%
   • Active Campaigns: 12
   • Active Flows: 5

3. Store C (Rvjas8) - Needs Attention
   • Revenue: $45,230
   • Avg Open Rate: 18.2%
   • Active Campaigns: 8
   • Active Flows: 3
   • Recommendation: Full audit needed
```

---

## Marketing Language Mappings

### Metric Translations

| Technical Term | Marketing Language |
|----------------|-------------------|
| `open_rate * 100` | "X% of recipients opened" |
| `click_rate * 100` | "X% clicked through" |
| `conversion_rate * 100` | "X% conversion rate" |
| `wow_revenue_change_pct` | "Up/Down X% vs last week" |
| `vs_account_revenue_pct` | "X% above/below your average" |
| `ma_7day_open_rate` | "7-day average" |
| `is_high_performer = 1` | "Top performer" |
| `is_low_performer = 1` | "Needs attention" |
| `performance_label` | Direct use: "Excellent", "Good", "Average", "Needs Attention" |

### Performance Labels

```sql
CASE
    WHEN open_rate > account_avg_open_rate * 1.3 THEN 'Excellent'
    WHEN open_rate > account_avg_open_rate * 1.1 THEN 'Good'
    WHEN open_rate < account_avg_open_rate * 0.8 THEN 'Needs Attention'
    ELSE 'Average'
END as performance_label
```

**AI Output Examples:**

- **Excellent**: "This campaign is a star performer! 🌟"
- **Good**: "Above average performance"
- **Average**: "On par with your typical results"
- **Needs Attention**: "This campaign needs optimization"

---

## Query Response Format for AI

### Template Structure

```python
{
    "current_period": {
        "data": [...],
        "summary": {
            "total_revenue": 58920,
            "avg_open_rate_pct": 32.5,
            "campaigns_sent": 8
        }
    },
    "baselines": {
        "30_day_average": {
            "revenue": 24807,
            "open_rate_pct": 28.3
        },
        "best_day": {
            "date": "2025-10-15",
            "revenue": 12450,
            "campaign": "Flash Sale Email"
        },
        "worst_day": {
            "date": "2025-10-08",
            "revenue": 3420
        }
    },
    "trends": {
        "wow_change_pct": 36.3,
        "direction": "up",
        "momentum": "strong"
    },
    "insights": [
        "Friday sends generate 23% more revenue",
        "SMS click rate is 3.8x higher than email",
        "Weekend campaigns show 15% higher engagement"
    ],
    "recommendations": [
        "Increase Friday send frequency",
        "Test Saturday evening sends",
        "Scale SMS to 30-35% of campaign mix"
    ]
}
```

---

## Token Optimization Strategy

### Adaptive Time Windows

```python
# For "this week" queries
SELECT * FROM ai_campaign_recent  # ~7 rows → 105 tokens

# For "last month" queries
SELECT * FROM ai_campaign_weekly  # ~4 rows → 40 tokens

# For "last quarter" queries
SELECT * FROM ai_historical_baseline  # ~3 rows → 30 tokens

# Total: ~175 tokens vs 12,000 tokens without views (98.5% reduction!)
```

---

## Best Practices for AI Integration

1. **Always include `klaviyo_public_id` filter** - Multi-tenant security
2. **Use helper views for common queries** - Faster, less tokens
3. **Limit results with `LIMIT`** - Prevent token overflow
4. **Pre-calculate comparisons** - Don't ask AI to do math
5. **Include `performance_label`** - Ready-made marketing language
6. **Use `data_freshness`** - Let AI tell user when data was updated

---

## Customer & RFM Queries

### Query 12: "Break down my customers by buyer segment (1x, 2x, 3x+)"

```sql
SELECT
    buyer_segment,
    customer_count,
    total_revenue,
    avg_order_value,
    avg_ltv,
    pct_of_customers,
    pct_of_revenue,
    avg_days_between_orders
FROM buyer_segments_analysis
WHERE klaviyo_public_id = '{klaviyo_id}'
ORDER BY total_revenue DESC;
```

**Marketing Language Output:**
```
Customer Buyer Segments:

**1x Buyers (One-Time Purchasers):**
• Count: 2,845 customers (58.2% of total)
• Revenue: $186,420 (40.7% of total)
• Avg LTV: $65.53
• Status: Largest segment, focus on conversion to repeat

**2x Buyers (Two-Time Purchasers):**
• Count: 1,234 customers (25.3%)
• Revenue: $142,890 (31.2%)
• Avg LTV: $115.80
• Avg Days Between Orders: 45
• Status: Prime candidates for loyalty programs

**3x+ Buyers (Loyal Customers):**
• Count: 806 customers (16.5%)
• Revenue: $129,022 (28.1%)
• Avg LTV: $160.10 (2.4x higher than 1x buyers!)
• Status: VIP segment, highest lifetime value

**Key Insight:** 41.8% of customers make repeat purchases
**Opportunity:** Converting 10% of 1x to 2x buyers = +$18,600 revenue
```

---

### Query 13: "Show me RFM segment distribution"

```sql
SELECT
    rfm_segment,
    count() as customer_count,
    sum(total_revenue) as segment_revenue,
    avg(total_revenue) as avg_customer_ltv,
    avg(total_orders) as avg_orders,
    avg(days_since_last_order) as avg_recency,

    -- Percentage of total
    count() / (SELECT count() FROM customer_profiles WHERE klaviyo_public_id = '{klaviyo_id}') * 100 as pct_of_customers,
    sum(total_revenue) / (SELECT sum(total_revenue) FROM customer_profiles WHERE klaviyo_public_id = '{klaviyo_id}') * 100 as pct_of_revenue

FROM customer_profiles
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND rfm_segment != ''
GROUP BY rfm_segment
ORDER BY segment_revenue DESC;
```

**Marketing Language Output:**
```
RFM Customer Segmentation:

**Champions (High R, F, M):**
• Customers: 412 (8.4% of base)
• Revenue: $89,450 (19.5% of total)
• Avg LTV: $217
• Avg Recency: 12 days (very recent!)
• Action: Reward loyalty, exclusive offers

**Loyal Customers:**
• Customers: 623 (12.8%)
• Revenue: $72,180 (15.7%)
• Avg LTV: $116
• Action: Upsell premium products

**At Risk:**
• Customers: 234 (4.8%)
• Revenue: $18,920 (4.1%)
• Avg Recency: 89 days ⚠️
• Action: Win-back campaign urgently needed

**Hibernating:**
• Customers: 567 (11.6%)
• Avg Recency: 180+ days
• Action: Re-engagement series or sunset

**Recommendation:** Focus on "At Risk" segment - win back 20% = +$3,800 revenue
```

---

### Query 14: "What's the LTV of my 3x+ buyers vs 1x buyers?"

```sql
WITH buyer_ltv AS (
    SELECT
        CASE
            WHEN total_orders = 1 THEN '1x Buyer'
            WHEN total_orders = 2 THEN '2x Buyer'
            WHEN total_orders >= 3 THEN '3x+ Buyer'
        END as buyer_type,
        count() as customer_count,
        avg(total_revenue) as avg_ltv,
        sum(total_revenue) as total_revenue,
        avg(total_orders) as avg_orders,
        avg(avg_order_value) as avg_aov
    FROM customer_profiles
    WHERE klaviyo_public_id = '{klaviyo_id}'
    GROUP BY buyer_type
)
SELECT
    buyer_type,
    customer_count,
    avg_ltv,
    total_revenue,
    avg_orders,
    avg_aov,

    -- vs 1x buyer benchmark
    (avg_ltv / (SELECT avg_ltv FROM buyer_ltv WHERE buyer_type = '1x Buyer') - 1) * 100 as ltv_vs_1x_pct

FROM buyer_ltv
ORDER BY avg_ltv DESC;
```

**Marketing Language Output:**
```
Buyer Segment LTV Comparison:

**3x+ Buyers:**
• Avg LTV: $160.10
• 144% higher than 1x buyers 🎉
• Avg Orders: 4.2
• Avg AOV: $38.12

**2x Buyers:**
• Avg LTV: $115.80
• 77% higher than 1x buyers
• Avg Orders: 2.0
• Avg AOV: $57.90

**1x Buyers:**
• Avg LTV: $65.53 (baseline)
• Avg Orders: 1.0
• Avg AOV: $65.53

**Key Insight:** Each additional purchase increases LTV by ~$50
**Action:** Focus on 1x → 2x conversion (2,845 customers × $50 = $142K opportunity)
```

---

### Query 15: "Show me customer retention trends"

```sql
SELECT
    toStartOfMonth(first_order_date) as cohort_month,
    count() as total_customers,
    countIf(total_orders > 1) as repeat_customers,
    countIf(total_orders > 1) / count() * 100 as repeat_rate_pct,
    avg(total_revenue) as avg_ltv,
    avg(total_orders) as avg_orders,
    avg(days_since_last_order) as avg_recency
FROM customer_profiles
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND first_order_date >= today() - 365
GROUP BY cohort_month
ORDER BY cohort_month DESC;
```

**Marketing Language Output:**
```
Customer Retention by Cohort (Last 12 Months):

Oct 2024 Cohort:
• New Customers: 245
• Repeat Rate: 28.5% (early, 3 weeks in)
• Avg LTV: $72.30

Sep 2024 Cohort:
• New Customers: 312
• Repeat Rate: 38.1%
• Avg LTV: $95.20
• Trend: +9.6 pts vs Aug

Aug 2024 Cohort:
• New Customers: 289
• Repeat Rate: 41.2%
• Avg LTV: $118.50

Insight: Repeat rate stabilizes at ~40% after 60 days
Target: Get Oct cohort to 40% by Day 60 = +28 repeat customers
```

---

## Product Performance Queries

### Query 16: "What are my top 20 products by revenue?"

```sql
SELECT
    product_id,
    sku,
    product_name,
    product_category,
    vendor as brand,

    total_revenue,
    total_orders,
    unique_customers,
    avg_price,

    -- Performance metrics
    repurchase_rate,
    avg_days_between_purchases,

    -- Ranking
    row_number() OVER (ORDER BY total_revenue DESC) as revenue_rank

FROM products_master
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND total_revenue > 0
ORDER BY total_revenue DESC
LIMIT 20;
```

**Marketing Language Output:**
```
Top 20 Products by Revenue:

1. Classic White Tee (TS-001)
   • Revenue: $45,680 | Orders: 892
   • Avg Price: $51.20
   • Unique Customers: 823
   • Repurchase Rate: 18.5% (strong!)
   • Category: Tops

2. Denim Jacket - Blue (DJ-002)
   • Revenue: $38,920 | Orders: 234
   • Avg Price: $166.30
   • Unique Customers: 218
   • Repurchase Rate: 12.3%
   • Category: Outerwear

[...18 more products]

**Insights:**
• Top 20 products = 68% of total revenue
• Tops category dominates (6 of top 20)
• Products with 15%+ repurchase rate are top performers
```

---

### Query 17: "Which products have the highest customer lifetime value?"

```sql
SELECT
    p.product_id,
    p.sku,
    p.product_name,
    any(p.product_categories) as product_category,

    -- First purchase impact
    fpl.customers_acquired as customers_who_started_here,
    fpl.avg_ltv_lifetime as first_purchase_ltv,
    fpl.repeat_purchase_rate_90d as conversion_to_repeat_pct,

    -- Overall product metrics
    p.total_revenue,
    p.unique_customers,

    -- LTV impact score
    (fpl.avg_ltv_lifetime / (SELECT avg(avg_ltv_lifetime) FROM first_purchase_ltv_analysis WHERE klaviyo_public_id = '{klaviyo_id}') - 1) * 100 as ltv_vs_avg_pct

FROM products_master p
LEFT JOIN first_purchase_ltv_analysis fpl ON p.klaviyo_public_id = fpl.klaviyo_public_id
    AND p.product_id = fpl.first_product_id
WHERE p.klaviyo_public_id = '{klaviyo_id}'
  AND fpl.customers_acquired > 10  -- Min sample size
ORDER BY fpl.avg_ltv_lifetime DESC
LIMIT 20;
```

**Marketing Language Output:**
```
Products with Highest Customer LTV Impact:

**Best Entry Products (Drive Highest Lifetime Value):**

1. Premium Starter Kit
   • First Purchase LTV: $245.60
   • 156% above average first purchase LTV 🎯
   • Customers who started here: 89
   • Repeat Purchase Rate: 67.4%
   • Insight: Gateway product to loyalty

2. Classic White Tee
   • First Purchase LTV: $198.30
   • 130% above average
   • Customers who started here: 342
   • Repeat Purchase Rate: 58.2%

**Recommendation:** Feature these products in:
• Welcome series
• First-purchase discounts
• Acquisition campaigns
```

---

### Query 18: "Show me products frequently bought together"

```sql
SELECT
    first_product_id,
    any(first_product_name) as product_a_name,
    second_product_id,
    any(second_product_name) as product_b_name,

    customers_bought_both as co_purchase_count,
    confidence_score,
    lift_score,

    -- % of product A buyers who also buy product B
    probability_of_second * 100 as cross_sell_rate_pct,

    -- Additional useful metrics
    avg_days_between_purchases,
    avg_second_purchase_value

FROM product_affinity_matrix
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND customers_bought_both >= 10  -- Min occurrences
  AND confidence_score >= 0.20  -- At least 20% confidence
ORDER BY lift_score DESC
LIMIT 20;
```

**Marketing Language Output:**
```
Product Affinity - Cross-Sell Opportunities:

**Strong Pairings:**

1. Classic White Tee → Basic Black Jeans
   • Cross-Sell Rate: 42.5%
   • Co-Purchases: 156 times
   • Lift Score: 2.8x (strong correlation!)
   • Action: Bundle offer or post-purchase upsell

2. Denim Jacket → White Sneakers
   • Cross-Sell Rate: 38.2%
   • Co-Purchases: 89 times
   • Lift Score: 2.3x

3. Leather Bag → Sunglasses
   • Cross-Sell Rate: 31.4%
   • Co-Purchases: 67 times

**Recommendations:**
• Create "Complete the Look" bundles
• Add to post-purchase flows
• Feature in "You Might Also Like" sections
```

---

### Query 19: "What products are most dependent on discounts?"

```sql
SELECT
    p.product_id,
    p.sku,
    p.product_name,
    any(p.product_categories) as product_category,

    p.total_orders,
    p.total_revenue,

    pda.total_orders_with_discount as orders_with_discount,
    pda.total_orders_without_discount as orders_without_discount,
    pda.discount_dependency_score,

    -- Calculate discount dependency %
    pda.total_orders_with_discount / p.total_orders * 100 as pct_sold_with_discount,

    -- Revenue impact
    pda.revenue_per_unit_with_discount as avg_price_with_discount,
    pda.revenue_per_unit_without_discount as avg_price_without_discount,
    pda.avg_discount_percentage as avg_discount_pct,

    -- Additional insights
    pda.repeat_rate_full_price,
    pda.repeat_rate_discounted,
    pda.revenue_lost_to_discounts

FROM products_master p
LEFT JOIN product_discount_analysis pda
    ON p.klaviyo_public_id = pda.klaviyo_public_id
    AND p.product_id = pda.product_id
WHERE p.klaviyo_public_id = '{klaviyo_id}'
  AND p.total_orders >= 20
ORDER BY pda.discount_dependency_score DESC
LIMIT 20;
```

**Marketing Language Output:**
```
Discount Dependency Analysis:

**High Dependency (Reduce Discounts):**

1. Classic White Tee
   • Sold with Discount: 12.3%
   • Dependency Score: Low ✅
   • Avg Discount: 15%
   • Action: Reduce discount frequency - product sells well full price

2. Basic Black Jeans
   • Sold with Discount: 18.5%
   • Dependency: Low
   • Action: Test removing discounts

**Medium Dependency:**

3. Denim Jacket
   • Sold with Discount: 34.2%
   • Dependency: Medium
   • Action: Strategic discounts only (seasonal, clearance)

**High Dependency (Need Discounts):**

15. Winter Coat
   • Sold with Discount: 67.8%
   • Dependency: High ⚠️
   • Avg Discount: 28%
   • Action: Consider pricing strategy or product positioning

**Opportunity:** Reduce discounts on top 10 products (only 12-15% dependency) = +$8,500 margin
```

---

## Account Overview Queries

### Query 20: "Show me daily revenue trends for last 30 days"

```sql
SELECT
    date,
    total_orders,
    total_revenue,
    avg_order_value,
    unique_customers,
    new_customers,
    returning_customers,

    -- Attribution
    attributed_revenue,
    attributed_revenue / total_revenue * 100 as attribution_rate_pct,

    -- Channel breakdown
    email_revenue,
    sms_revenue,
    push_revenue,

    -- vs previous period
    (total_revenue - revenue_7d_ago) / revenue_7d_ago * 100 as wow_revenue_change_pct

FROM account_metrics_daily
WHERE klaviyo_public_id = '{klaviyo_id}'
  AND date >= today() - 30
ORDER BY date DESC;
```

**Marketing Language Output:**
```
Daily Performance - Last 30 Days:

Recent Highlights:

Oct 20 (Friday):
• Revenue: $24,568
• Orders: 103
• AOV: $238.52
• Attribution: 8.6% (above avg!)
• Trend: +18% vs previous Friday

Oct 19 (Thursday):
• Revenue: $19,450
• Attribution: 7.2%

Oct 18 (Wednesday):
• Revenue: $18,230
• Attribution: 6.8%

**30-Day Totals:**
• Revenue: $458,332
• Orders: 1,924
• Avg Attribution: 6.2%

**Trends:**
• Weekends performing 23% better than weekdays
• Friday is best day (avg $22,340)
• Attribution improving (+1.2 pts vs prior 30 days)
```

---

**Last Updated:** 2025-10-23
**Version:** 1.1 - Added RFM, Customer, and Product Queries
**Maintained by:** Wizel Engineering Team

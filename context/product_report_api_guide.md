# Product Reports API Implementation Guide

## Optimized API Strategy

Instead of 10 separate endpoints, consolidate into **3 main endpoints** that return everything needed:

### 1. `/api/store/{store_id}/products/analytics` (Main Dashboard Data)
**Use:** Performance, Lifecycle, Velocity, Revenue Efficiency
**Returns:** Core product metrics and trends

### 2. `/api/store/{store_id}/products/behavior` (Customer Behavior)
**Use:** Repurchase, Customer Preferences, Affinity Analysis
**Returns:** How customers interact with products

### 3. `/api/store/{store_id}/products/financial` (Financial Metrics)
**Use:** Discount Impact, Quality Signals (refunds)
**Returns:** Financial performance and quality metrics

---

## API Endpoint #1: Product Analytics Dashboard

**Endpoint:** `GET /api/store/{store_id}/products/analytics`

**Query Params:**
- `start_date` (required)
- `end_date` (required)
- `limit` (optional, default 20)

### ClickHouse Queries Needed

#### 1. Product Performance (Top Products)
```sql
SELECT
    product_id,
    product_name,
    product_brand,
    product_categories,
    SUM(line_total) as total_revenue,
    SUM(quantity) as total_quantity,
    COUNT(DISTINCT customer_email) as unique_customers,
    COUNT(DISTINCT order_id) as total_orders,
    AVG(unit_price) as avg_price,
    MIN(unit_price) as min_price,
    MAX(unit_price) as max_price
FROM klaviyo_order_line_items
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND order_date BETWEEN {start_date} AND {end_date}
GROUP BY product_id, product_name, product_brand, product_categories
ORDER BY total_revenue DESC
LIMIT {limit}
```

#### 2. Revenue Trend (Daily)
```sql
SELECT
    order_date as date,
    SUM(line_total) as revenue,
    SUM(quantity) as units_sold,
    COUNT(DISTINCT product_id) as unique_products
FROM klaviyo_order_line_items
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND order_date BETWEEN {start_date} AND {end_date}
GROUP BY order_date
ORDER BY order_date
```

#### 3. Product Lifecycle (New vs Declining)
```sql
-- New Products (first sold in last 90 days)
SELECT
    product_id,
    product_name,
    first_sold_date,
    SUM(line_total) as revenue,
    dateDiff('day', first_sold_date, today()) as days_live
FROM (
    SELECT
        product_id,
        product_name,
        MIN(order_date) as first_sold_date,
        SUM(line_total) as line_total
    FROM klaviyo_order_line_items
    WHERE klaviyo_public_id = {klaviyo_public_id}
    GROUP BY product_id, product_name
) as product_first_sales
WHERE first_sold_date >= today() - INTERVAL 90 DAY
GROUP BY product_id, product_name, first_sold_date
ORDER BY revenue DESC
LIMIT 10

-- Declining Products (compare last 30d to previous 30d)
WITH recent_sales AS (
    SELECT
        product_id,
        product_name,
        SUM(CASE WHEN order_date >= today() - INTERVAL 30 DAY THEN line_total ELSE 0 END) as recent_revenue,
        SUM(CASE WHEN order_date BETWEEN today() - INTERVAL 60 DAY AND today() - INTERVAL 30 DAY THEN line_total ELSE 0 END) as previous_revenue
    FROM klaviyo_order_line_items
    WHERE klaviyo_public_id = {klaviyo_public_id}
        AND order_date >= today() - INTERVAL 60 DAY
    GROUP BY product_id, product_name
)
SELECT
    product_id,
    product_name,
    recent_revenue,
    previous_revenue,
    ROUND(((recent_revenue - previous_revenue) / previous_revenue) * 100, 2) as decline_rate
FROM recent_sales
WHERE previous_revenue > 0
    AND recent_revenue < previous_revenue
    AND decline_rate < -20  -- declining by 20%+
ORDER BY decline_rate ASC
LIMIT 10
```

#### 4. Growth Trends
```sql
WITH monthly_sales AS (
    SELECT
        product_id,
        product_name,
        toStartOfMonth(order_date) as month,
        SUM(line_total) as revenue
    FROM klaviyo_order_line_items
    WHERE klaviyo_public_id = {klaviyo_public_id}
        AND order_date >= today() - INTERVAL 180 DAY
    GROUP BY product_id, product_name, toStartOfMonth(order_date)
),
growth_calc AS (
    SELECT
        product_id,
        product_name,
        revenue,
        lag(revenue, 1) OVER (PARTITION BY product_id ORDER BY month) as prev_month_revenue
    FROM monthly_sales
)
SELECT
    product_id,
    product_name,
    AVG(revenue) as avg_monthly_revenue,
    AVG(CASE WHEN prev_month_revenue > 0 THEN ((revenue - prev_month_revenue) / prev_month_revenue) * 100 ELSE 0 END) as avg_growth_rate
FROM growth_calc
GROUP BY product_id, product_name
HAVING avg_monthly_revenue > 100  -- filter out low volume
ORDER BY avg_growth_rate DESC
LIMIT 20
```

#### 5. Inventory Velocity
```sql
SELECT
    product_id,
    product_name,
    SUM(quantity) as total_units_sold,
    COUNT(DISTINCT order_date) as days_with_sales,
    ROUND(SUM(quantity) / COUNT(DISTINCT order_date), 2) as units_per_day,
    SUM(line_total) / COUNT(DISTINCT order_date) as revenue_per_day
FROM klaviyo_order_line_items
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND order_date BETWEEN {start_date} AND {end_date}
GROUP BY product_id, product_name
ORDER BY units_per_day DESC
LIMIT 20
```

#### 6. Revenue Efficiency (without cost data)
```sql
WITH product_totals AS (
    SELECT SUM(line_total) as total_revenue
    FROM klaviyo_order_line_items
    WHERE klaviyo_public_id = {klaviyo_public_id}
        AND order_date BETWEEN {start_date} AND {end_date}
)
SELECT
    p.product_id,
    p.product_name,
    SUM(p.line_total) as revenue,
    ROUND((SUM(p.line_total) / pt.total_revenue) * 100, 2) as revenue_share_pct,
    AVG(p.unit_price) as avg_price,
    SUM(CASE WHEN p.discount_amount = 0 THEN p.line_total ELSE 0 END) as full_price_revenue,
    SUM(CASE WHEN p.discount_amount > 0 THEN p.line_total ELSE 0 END) as discounted_revenue
FROM klaviyo_order_line_items p
CROSS JOIN product_totals pt
WHERE p.klaviyo_public_id = {klaviyo_public_id}
    AND p.order_date BETWEEN {start_date} AND {end_date}
GROUP BY p.product_id, p.product_name, pt.total_revenue
ORDER BY revenue DESC
LIMIT 20
```

### Response Format
```json
{
  "topProducts": [...],
  "revenueTrend": [...],
  "summary": {
    "total_revenue": 125000.50,
    "units_sold": 3450,
    "avg_aov": 36.23
  },
  "growthTrends": [...],
  "newProducts": [...],
  "decliningProducts": [...],
  "velocityMetrics": [...],
  "fastMovers": [...],
  "slowMovers": [...],
  "revenueContribution": [...],
  "pricePoints": [...]
}
```

---

## API Endpoint #2: Product Behavior Analytics

**Endpoint:** `GET /api/store/{store_id}/products/behavior`

**Query Params:** None (or optional limit)

### ClickHouse Queries Needed

#### 1. Product Repurchase Rates
```sql
WITH customer_product_purchases AS (
    SELECT
        customer_email,
        product_id,
        product_name,
        COUNT(DISTINCT order_id) as purchase_count
    FROM klaviyo_order_line_items
    WHERE klaviyo_public_id = {klaviyo_public_id}
    GROUP BY customer_email, product_id, product_name
)
SELECT
    product_id,
    product_name,
    COUNT(DISTINCT customer_email) as total_customers,
    COUNT(DISTINCT CASE WHEN purchase_count >= 2 THEN customer_email END) as repeat_customers,
    ROUND((COUNT(DISTINCT CASE WHEN purchase_count >= 2 THEN customer_email END) / COUNT(DISTINCT customer_email)) * 100, 2) as repurchase_rate
FROM customer_product_purchases
GROUP BY product_id, product_name
HAVING total_customers >= 10  -- minimum customers filter
ORDER BY repurchase_rate DESC
LIMIT 20
```

#### 2. Customer LTV by Product
```sql
SELECT
    first_product_id as product_id,
    first_product_name as product_name,
    AVG(avg_ltv_90d) as avg_ltv,
    COUNT(*) as customers_acquired
FROM first_purchase_ltv_analysis
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND avg_ltv_90d > 0
GROUP BY first_product_id, first_product_name
ORDER BY avg_ltv DESC
LIMIT 10
```

#### 3. Days Between Repurchases
```sql
WITH product_purchases AS (
    SELECT
        customer_email,
        product_id,
        product_name,
        order_date,
        lag(order_date, 1) OVER (PARTITION BY customer_email, product_id ORDER BY order_date) as prev_purchase_date
    FROM klaviyo_order_line_items
    WHERE klaviyo_public_id = {klaviyo_public_id}
)
SELECT
    product_id,
    product_name,
    AVG(dateDiff('day', prev_purchase_date, order_date)) as avg_days_between_purchases
FROM product_purchases
WHERE prev_purchase_date IS NOT NULL
GROUP BY product_id, product_name
HAVING COUNT(*) >= 5  -- at least 5 repurchases
ORDER BY avg_days_between_purchases ASC
LIMIT 20
```

#### 4. Product Affinity (Frequently Bought Together)
```sql
SELECT
    first_product_name as product_1,
    second_product_name as product_2,
    customers_bought_both as co_purchases,
    ROUND(lift_score, 2) as lift_score,
    ROUND(confidence_score * 100, 2) as confidence
FROM product_affinity_matrix
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND lift_score > 1.5  -- meaningful affinity
    AND customers_bought_both >= 5
ORDER BY lift_score DESC, customers_bought_both DESC
LIMIT 20
```

#### 5. Affinity Matrix for Scatter Plot
```sql
SELECT
    CONCAT(first_product_name, ' + ', second_product_name) as product_pair,
    ROUND(confidence_score * 100, 2) as confidence,
    ROUND(lift_score, 2) as lift
FROM product_affinity_matrix
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND customers_bought_both >= 3
ORDER BY lift_score DESC
LIMIT 50
```

#### 6. New vs Returning Customer Preferences
```sql
SELECT
    li.product_id,
    li.product_name,
    SUM(CASE WHEN o.is_first_order = 1 THEN li.line_total ELSE 0 END) as new_customer_revenue,
    SUM(CASE WHEN o.is_first_order = 0 THEN li.line_total ELSE 0 END) as returning_customer_revenue,
    COUNT(DISTINCT CASE WHEN o.is_first_order = 1 THEN o.customer_email END) as new_customers,
    COUNT(DISTINCT CASE WHEN o.is_first_order = 0 THEN o.customer_email END) as returning_customers
FROM klaviyo_order_line_items li
JOIN klaviyo_orders o ON li.order_id = o.order_id AND li.klaviyo_public_id = o.klaviyo_public_id
WHERE li.klaviyo_public_id = {klaviyo_public_id}
GROUP BY li.product_id, li.product_name
ORDER BY (new_customer_revenue + returning_customer_revenue) DESC
LIMIT 20
```

#### 7. Retention Rate by Entry Product
```sql
SELECT
    first_product_id as product_id,
    first_product_name as product_name,
    AVG(repeat_purchase_rate_90d) * 100 as retention_rate,
    COUNT(*) as customers_acquired
FROM first_purchase_ltv_analysis
WHERE klaviyo_public_id = {klaviyo_public_id}
GROUP BY first_product_id, first_product_name
HAVING customers_acquired >= 10
ORDER BY retention_rate DESC
LIMIT 20
```

### Response Format
```json
{
  "repurchaseRates": [...],
  "ltvByProduct": [...],
  "daysBetweenPurchases": [...],
  "topPairs": [...],
  "affinityMatrix": [...],
  "preferences": [...],
  "retentionByProduct": [...],
  "acquisitionProducts": [...],
  "retentionProducts": [...]
}
```

---

## API Endpoint #3: Product Financial Metrics

**Endpoint:** `GET /api/store/{store_id}/products/financial`

**Query Params:**
- `start_date` (required)
- `end_date` (required)

### ClickHouse Queries Needed

#### 1. Discount Impact Comparison
```sql
SELECT
    product_id,
    product_name,
    SUM(CASE WHEN discount_amount > 0 THEN line_total ELSE 0 END) as revenue_with_discount,
    SUM(CASE WHEN discount_amount = 0 THEN line_total ELSE 0 END) as revenue_without_discount,
    COUNT(CASE WHEN discount_amount > 0 THEN 1 END) as orders_with_discount,
    COUNT(CASE WHEN discount_amount = 0 THEN 1 END) as orders_without_discount
FROM klaviyo_order_line_items
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND order_date BETWEEN {start_date} AND {end_date}
GROUP BY product_id, product_name
ORDER BY (revenue_with_discount + revenue_without_discount) DESC
LIMIT 20
```

#### 2. Discount Dependency Score
```sql
SELECT
    product_id,
    product_name,
    discount_dependency_score,
    repeat_rate_full_price,
    repeat_rate_discounted,
    revenue_lost_to_discounts
FROM product_discount_analysis
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND analysis_end_date >= {start_date}
ORDER BY discount_dependency_score DESC
LIMIT 20
```

#### 3. Discount Distribution
```sql
SELECT
    CASE
        WHEN discount_percentage = 0 THEN 'Full Price'
        WHEN discount_percentage <= 10 THEN '1-10%'
        WHEN discount_percentage <= 20 THEN '11-20%'
        WHEN discount_percentage <= 30 THEN '21-30%'
        ELSE '30%+'
    END as discount_range,
    COUNT(*) as count,
    SUM(line_total) as revenue
FROM klaviyo_order_line_items
WHERE klaviyo_public_id = {klaviyo_public_id}
    AND order_date BETWEEN {start_date} AND {end_date}
    AND discount_percentage IS NOT NULL
GROUP BY discount_range
ORDER BY
    CASE discount_range
        WHEN 'Full Price' THEN 0
        WHEN '1-10%' THEN 1
        WHEN '11-20%' THEN 2
        WHEN '21-30%' THEN 3
        ELSE 4
    END
```

#### 4. Quality Signals - Refund Rates
```sql
WITH product_refunds AS (
    SELECT
        product_id,
        product_name,
        SUM(line_total) as gross_revenue,
        COUNT(DISTINCT order_id) as total_orders
    FROM klaviyo_order_line_items
    WHERE klaviyo_public_id = {klaviyo_public_id}
        AND order_date BETWEEN {start_date} AND {end_date}
    GROUP BY product_id, product_name
),
refund_data AS (
    SELECT
        arrayJoin(products_affected) as product_name,
        SUM(refund_amount) as total_refunded,
        COUNT(*) as refund_count
    FROM refund_cancelled_orders
    WHERE klaviyo_public_id = {klaviyo_public_id}
        AND event_timestamp BETWEEN {start_date} AND {end_date}
    GROUP BY product_name
)
SELECT
    pr.product_id,
    pr.product_name,
    pr.gross_revenue,
    COALESCE(rd.total_refunded, 0) as refund_amount,
    pr.gross_revenue - COALESCE(rd.total_refunded, 0) as net_revenue,
    ROUND((COALESCE(rd.total_refunded, 0) / pr.gross_revenue) * 100, 2) as refund_rate
FROM product_refunds pr
LEFT JOIN refund_data rd ON pr.product_name = rd.product_name
WHERE pr.gross_revenue > 100  -- minimum revenue filter
ORDER BY refund_rate DESC
LIMIT 20
```

#### 5. Problem Products (High Refund)
```sql
-- Same as above but filter WHERE refund_rate > 10
-- ORDER BY refund_rate DESC
```

#### 6. Quality Products (Low Refund)
```sql
-- Same as #4 but filter WHERE refund_rate < 5 AND gross_revenue > 1000
-- ORDER BY gross_revenue DESC
```

#### 7. Channel Attribution
```sql
-- This requires joining events with orders to get attribution
-- For now, use a simplified version based on available data

WITH campaign_orders AS (
    SELECT
        li.product_id,
        li.product_name,
        CASE
            WHEN cs.send_channel = 'email' THEN cs.conversion_value
            ELSE 0
        END as campaign_email_revenue,
        CASE
            WHEN cs.send_channel = 'sms' THEN cs.conversion_value
            ELSE 0
        END as campaign_sms_revenue
    FROM campaign_statistics cs
    JOIN klaviyo_order_line_items li ON li.klaviyo_public_id = cs.klaviyo_public_id
    WHERE cs.klaviyo_public_id = {klaviyo_public_id}
        AND cs.date BETWEEN {start_date} AND {end_date}
),
flow_orders AS (
    SELECT
        li.product_id,
        li.product_name,
        CASE
            WHEN fs.send_channel = 'email' THEN fs.conversion_value
            ELSE 0
        END as flow_email_revenue,
        CASE
            WHEN fs.send_channel = 'sms' THEN fs.conversion_value
            ELSE 0
        END as flow_sms_revenue
    FROM flow_statistics fs
    JOIN klaviyo_order_line_items li ON li.klaviyo_public_id = fs.klaviyo_public_id
    WHERE fs.klaviyo_public_id = {klaviyo_public_id}
        AND fs.date BETWEEN {start_date} AND {end_date}
)
SELECT
    product_id,
    product_name,
    SUM(campaign_email_revenue) as campaign_email,
    SUM(campaign_sms_revenue) as campaign_sms,
    SUM(flow_email_revenue) as flow_email,
    SUM(flow_sms_revenue) as flow_sms
FROM (
    SELECT * FROM campaign_orders
    UNION ALL
    SELECT * FROM flow_orders
)
GROUP BY product_id, product_name
ORDER BY (campaign_email + campaign_sms + flow_email + flow_sms) DESC
LIMIT 20
```

### Response Format
```json
{
  "discountComparison": [...],
  "dependencyScores": [...],
  "discountDistribution": [...],
  "summary": {
    "revenue_lost": 5432.10,
    "avg_discount": 12.50
  },
  "refundRates": [...],
  "netRevenue": [...],
  "problemProducts": [...],
  "qualityProducts": [...],
  "summary": {
    "total_refunded": 2340.50,
    "avg_refund_rate": 3.2,
    "problem_count": 5
  },
  "byChannel": [...],
  "channelDistribution": [...]
}
```

---

## Implementation Notes

### 1. **Consolidation Benefits**
- Reduces API calls from 10 to 3
- Decreases latency (parallel processing on backend)
- Better caching strategy
- Simplified frontend state management

### 2. **Performance Optimization**
- Use `LIMIT` on all queries (top 20 products is usually enough)
- Add date range filters to reduce data scanned
- Consider materializing complex queries into aggregation tables
- Cache results for 5-15 minutes

### 3. **Error Handling**
```python
# Return partial data if some queries fail
try:
    top_products = execute_query(query1)
except Exception as e:
    logger.error(f"Top products query failed: {e}")
    top_products = []

return {
    "topProducts": top_products,
    "revenueTrend": revenue_trend,
    # ... etc
}
```

### 4. **Missing Tables/Data Workarounds**
- **Channel Attribution**: If you can't join events properly, omit this section initially
- **Product Affinity**: Use the existing `product_affinity_matrix` table
- **LTV Data**: Use `first_purchase_ltv_analysis` table
- **Refunds**: Use `refund_cancelled_orders` table

### 5. **Frontend Data Transformation**
Some charts need data reshaped on frontend:

```javascript
// Example: Transform for acquisition vs retention products
const acquisitionProducts = preferencesData.preferences
  .sort((a, b) => b.new_customers - a.new_customers)
  .slice(0, 5)
  .map(p => ({
    name: p.product_name,
    new_customers: p.new_customers
  }));

const retentionProducts = preferencesData.retentionByProduct
  .sort((a, b) => b.retention_rate - a.retention_rate)
  .slice(0, 5)
  .map(p => ({
    name: p.product_name,
    repurchase_rate: p.retention_rate
  }));
```

---

## FastAPI Implementation Pattern

```python
from fastapi import APIRouter, Depends
from datetime import date

router = APIRouter()

@router.get("/api/store/{store_public_id}/products/analytics")
async def get_product_analytics(
    store_public_id: str,
    start_date: date,
    end_date: date,
    limit: int = 20
):
    # Get klaviyo_public_id from store
    klaviyo_id = get_klaviyo_id(store_public_id)

    # Run all queries in parallel
    results = await asyncio.gather(
        execute_query(top_products_query),
        execute_query(revenue_trend_query),
        execute_query(new_products_query),
        # ... etc
    )

    return {
        "topProducts": results[0],
        "revenueTrend": results[1],
        # ... format response
    }
```

---

## Summary

**3 API endpoints instead of 10:**
1. `/products/analytics` - Performance, Lifecycle, Velocity, Efficiency
2. `/products/behavior` - Repurchase, Affinity, Customer Preferences
3. `/products/financial` - Discounts, Refunds, Quality Signals

Each endpoint runs 5-7 queries in parallel and returns consolidated JSON for multiple charts.

**Estimated Implementation Time:**
- Backend (FastAPI + ClickHouse): 4-6 hours
- Testing & optimization: 2-3 hours
- Total: ~1 day of development

This approach is much more efficient than 10 separate endpoints!

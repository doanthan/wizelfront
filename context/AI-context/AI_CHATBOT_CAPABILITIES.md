# Wizel AI Chat Assistant - Complete Capabilities Documentation

**Last Updated**: October 2025
**Version**: 3.0 (Three-Tier Intelligent Routing System)

---

## 🎯 Executive Summary

Wizel AI is an **intelligent multi-store marketing analytics chatbot** that answers ad-hoc questions about Klaviyo marketing performance across multiple stores simultaneously. It's designed for **agencies managing multiple clients** and **multi-brand businesses** to quickly analyze campaigns, flows, revenue, products, customer segments, and RFM groups.

### Key Capabilities
- **Multi-Store Analysis**: Query data across multiple Klaviyo accounts simultaneously
- **Natural Language**: Ask questions in plain English, no SQL required
- **Intelligent Routing**: Automatically routes queries to the optimal data source (on-screen context, SQL database, or real-time API)
- **Real-Time Insights**: Access to up-to-date campaign performance, revenue trends, and customer behavior
- **Customer Segmentation**: RFM (Recency, Frequency, Monetary) analysis, buyer segments (1x, 2x, 3x+ buyers)
- **Product Analytics**: Product performance, LTV analysis, discount effectiveness, cross-sell recommendations

---

## 🏗️ System Architecture

### Three-Tier Intelligent Routing System

The AI chatbot uses a **three-tier routing architecture** to provide the most efficient and accurate responses:

```
User Question
     ↓
Intent Detection (Haiku AI)
     ↓
┌─────────────┬──────────────┬─────────────┐
│   TIER 1    │    TIER 2    │   TIER 3    │
│  On-Screen  │  SQL Database│  Real-Time  │
│   Context   │    Query     │   API (MCP) │
└─────────────┴──────────────┴─────────────┘
```

#### **Tier 1: On-Screen Context (Fastest, Cheapest)**
- **Use Case**: Questions about data currently visible on the dashboard
- **Examples**:
  - "What's my current open rate?"
  - "Which campaign is performing best?"
  - "Compare last 7 days to previous 7 days" (when data is visible)
  - "Summarize what I'm seeing"
  - "What was my best day last week?"
- **Data Source**: Pre-loaded summary data from the current page
- **Response Time**: <500ms
- **Model**: Claude Haiku 4.5 / Sonnet 4.5 / Gemini 2.5 Pro (auto-selected based on complexity)
- **Cost**: ~$0.0001 per query

#### **Tier 2: SQL Database Query (Comprehensive)**
- **Use Case**: Questions requiring data NOT currently visible on screen
- **Examples**:
  - "What were my top 10 campaigns last month?"
  - "Show me revenue trends over the last quarter"
  - "Which products have the highest LTV?"
  - "Compare email vs SMS performance"
  - "Show me all campaigns with less than 10% open rate"
- **Data Source**: ClickHouse analytics database with AI materialized views
- **Response Time**: 1-3 seconds
- **Process**:
  1. Haiku 4.5 generates SQL query from natural language
  2. Execute query on ClickHouse database
  3. Sonnet 4.5 analyzes results and provides insights
- **Cost**: ~$0.001-0.005 per query

#### **Tier 3: Real-Time MCP API (Current State)**
- **Use Case**: Questions requiring live Klaviyo configuration or real-time state
- **Examples**:
  - "How many profiles are in my VIP segment right now?"
  - "What flows are currently active?"
  - "List all my segments"
  - "Show me my campaign schedule for today"
- **Data Source**: Live Klaviyo API via Model Context Protocol (MCP)
- **Response Time**: 2-5 seconds
- **Model**: Sonnet 4.5 with live API access
- **Cost**: ~$0.005-0.01 per query

### Intent Detection (Haiku-Powered)

The system uses **Claude Haiku 4.5** to intelligently detect user intent and route queries to the optimal tier:

- **Semantic Understanding**: Goes beyond regex to understand user intent
- **Context-Aware**: Considers what data is currently visible on screen
- **Cost-Optimized**: ~$0.0001 per intent detection (negligible)
- **Automatic Fallback**: Falls back to rule-based detection if Haiku fails

---

## 📊 Data Sources & Tables

### ClickHouse Database Architecture (Production Tables)

The AI has access to a comprehensive ClickHouse analytics database with production tables:

#### **Transaction Tables (2)**
- `klaviyo_orders` - Order transactions with customer data
- `klaviyo_order_line_items` - Line item details with discounts and product data

#### **Marketing Statistics Tables (7)**
- `campaign_statistics` - Campaign performance (15-min updates)
- `flow_statistics` - Flow automation performance
- `form_statistics` - Form/popup performance
- `segment_statistics` - Segment growth tracking
- `flow_metadata` - Flow catalog for dropdowns
- `form_metadata` - Form catalog for dropdowns
- `segment_metadata` - Segment catalog for dropdowns

#### **Aggregated Tables (1)**
- `account_metrics_daily` - Daily account-level KPIs (updated every 30 min)

#### **Analytics Tables (19)**
- `customer_profiles` - Customer LTV and RFM analysis
- `buyer_segments_analysis` - Customer segment analytics (1x, 2x, 3x+ buyers)
- `customer_ltv_predictions` - ML-based LTV predictions
- `discount_dependency` - Customer discount dependency
- `refund_cancelled_orders` - Refund and cancellation events
- `products_master` - Product performance analytics
- `product_ltv_analysis` - Product LTV breakdown
- `product_discount_analysis` - Discount effectiveness analysis
- `product_cohorts` - Product retention cohorts (by cohort month)
- `product_entry_cohorts` - Entry product cohort tracking with retention curves
- `product_affinity_matrix` - Product recommendation engine (cross-sell/upsell)
- `product_relationships_optimized` - Product co-purchase analysis
- `new_customer_products` - Best products for new customer acquisition
- `first_purchase_ltv` - First product LTV impact
- `first_purchase_ltv_analysis` - Enhanced first product analysis with cohorts
- `discount_usage_analytics` - Discount effectiveness by customer segment
- `brand_performance` - Brand-level analytics and performance
- `product_type_performance` - Product type analytics
- `tag_performance` - Product tag analytics

#### **Metadata Tables (3)**
- `flow_metadata` - Flow definitions
- `form_metadata` - Form definitions
- `segment_metadata` - Segment definitions

#### **System Tables (1)**
- `klaviyo_syncs` - Sync status and orchestration

### Data Update Frequency
- **Statistics Tables**: Every 15 minutes
- **Daily Metrics**: Every 30 minutes
- **Transaction Tables**: Every 30 minutes
- **Analytics Tables**: Daily aggregation

---

## 🎤 Question Types & Examples

### 1. Campaign Performance

**What it can answer:**
- Campaign metrics (opens, clicks, CTR, conversions)
- Revenue attribution by campaign
- Campaign comparison and ranking
- Channel performance (Email vs SMS vs Push)
- Time-based analysis (daily, weekly, monthly trends)

**Example Questions:**
```
✅ "What were my top 10 campaigns by revenue last month?"
✅ "Show me all campaigns with less than 15% open rate in the last 90 days"
✅ "Compare email vs SMS campaign performance for last quarter"
✅ "Which campaigns generated the most revenue this week?"
✅ "What's my average open rate across all campaigns?"
✅ "Show me campaign performance by day for the last 30 days"
```

**Response Example:**
```markdown
Here are your top 10 campaigns by revenue last month:

1. Black Friday Email - Nov 25, 2024
   - Recipients: 45,230
   - Open Rate: 34.2% (above benchmark)
   - Click Rate: 5.8% (above benchmark)
   - Revenue: $128,450

2. Cyber Monday SMS - Nov 28, 2024
   - Recipients: 18,900
   - Click Rate: 12.3%
   - Revenue: $87,230

[...8 more campaigns]

**Key Insights:**
- Email campaigns averaging 28.5% open rate (benchmark: 21%)
- SMS campaigns showing 3.2x higher click rates
- Weekend sends generating 45% more revenue than weekdays
- Recommendation: Increase SMS frequency for high-value segments
```

### 2. Flow Performance

**What it can answer:**
- Flow automation metrics (triggers, conversions, revenue)
- Flow comparison across stores
- Flow-specific performance analysis
- Abandoned cart and browse abandonment metrics
- Welcome series and post-purchase flow analysis

**Example Questions:**
```
✅ "What flows are generating the most revenue?"
✅ "Compare abandoned cart flow performance across all my stores"
✅ "Which flows have the highest conversion rates?"
✅ "Show me welcome series performance for new subscribers"
✅ "How much revenue did my post-purchase flow generate last month?"
✅ "Which stores are missing abandoned cart flows?"
```

**Response Example:**
```markdown
Flow Revenue Analysis (Last 30 Days):

**Aggregate Performance:**
- Total Flow Revenue: $245,680
- Active Flows: 18
- Avg Conversion Rate: 3.8%

**Top 3 Flows by Revenue:**

1. Abandoned Cart Recovery (Email)
   - Revenue: $89,340 (36.4% of total)
   - Triggers: 12,450
   - Conversion Rate: 5.2%
   - Present in: 5/5 stores

2. Welcome Series (Email)
   - Revenue: $52,180 (21.2% of total)
   - Triggers: 8,920
   - Conversion Rate: 4.1%
   - Present in: 5/5 stores

3. Browse Abandonment (Email + SMS)
   - Revenue: $38,920 (15.8% of total)
   - Triggers: 15,670
   - Conversion Rate: 2.8%
   - Present in: 3/5 stores

**Store Comparison:**
- Store A: $98,450 (40% of total) - All flows active
- Store B: $72,180 (29% of total) - Missing browse abandonment
- Store C: $45,230 (18% of total) - Only 3/7 recommended flows active

**Recommendations:**
- Implement browse abandonment in Store B (potential +$18K/month)
- Activate post-purchase flow in Store C (potential +$12K/month)
```

### 3. Revenue & Attribution

**What it can answer:**
- Total revenue and attributed revenue
- Revenue by channel (Email, SMS, Push)
- Revenue by source (Campaigns vs Flows)
- Revenue trends and growth rates
- Average order value (AOV) analysis
- Revenue per recipient metrics

**Example Questions:**
```
✅ "What's my total revenue and attribution rate for last 30 days?"
✅ "Compare revenue from campaigns vs flows"
✅ "Show me revenue trends by day for the last quarter"
✅ "What's my average order value and how has it changed?"
✅ "Break down revenue by channel (email, SMS, push)"
✅ "Which store has the highest revenue attribution?"
```

**Response Example:**
```markdown
Revenue Performance (Last 30 Days):

**Overall Metrics:**
- Total Revenue: $458,332
- Attributed Revenue: $28,456 (6.2% attribution rate)
- Total Orders: 1,924
- Average Order Value: $238.24

**Revenue by Source:**
- Flow Revenue: $18,450 (64.8% of attributed)
- Campaign Revenue: $10,006 (35.2% of attributed)

**Revenue by Channel:**
- Email: $20,120 (70.7%)
- SMS: $6,840 (24.0%)
- Push: $1,496 (5.3%)

**Trend Analysis:**
- Revenue up 18.5% vs previous 30 days
- Attribution rate improved from 5.4% to 6.2%
- AOV increased by $12.50 (5.5% growth)

**Top Revenue Days:**
1. Oct 15: $24,568 (8.6% attribution)
2. Oct 22: $19,450 (7.2% attribution)
3. Oct 29: $18,230 (6.8% attribution)

**Insights:**
- Weekend revenue 23% higher than weekdays
- Email continues to be primary revenue driver
- SMS showing strong ROI with 12.3% click rates
```

### 4. Product Performance

**What it can answer:**
- Product revenue and sales volume
- Product LTV analysis
- Best-selling products
- Product discount effectiveness
- Cross-sell and upsell opportunities
- First purchase product analysis
- Product affinity and recommendations

**Example Questions:**
```
✅ "What are my top 20 products by revenue?"
✅ "Which products have the highest customer lifetime value?"
✅ "Show me products frequently bought together"
✅ "What products do first-time customers buy most?"
✅ "Which products are most dependent on discounts?"
✅ "What's the best entry product for new customers?"
✅ "Recommend complementary products for [Product X]"
```

**Response Example:**
```markdown
Top 20 Products by Revenue (Last 90 Days):

1. Classic White Tee (SKU: TS-001)
   - Revenue: $45,680
   - Orders: 892
   - Unique Customers: 823
   - Average Price: $51.20
   - Customer LTV: $156.40
   - Discount Dependency: Low (12% of sales with discount)

2. Denim Jacket - Blue (SKU: DJ-002)
   - Revenue: $38,920
   - Orders: 234
   - Unique Customers: 218
   - Average Price: $166.30
   - Customer LTV: $412.80
   - Discount Dependency: Medium (34% of sales with discount)

[...18 more products]

**Product Insights:**

**Best Entry Products (for new customers):**
- Classic White Tee: 18.5% of new customers
- Basic Black Jeans: 12.3% of new customers
- Customers who buy Classic White Tee first have 2.3x higher LTV

**Product Affinity (Cross-Sell Opportunities):**
- Classic White Tee → Basic Black Jeans (42% probability)
- Denim Jacket → White Sneakers (38% probability)
- Leather Bag → Sunglasses (31% probability)

**Discount Effectiveness:**
- High performers don't need discounts (Classic White Tee only 12%)
- Seasonal items benefit most from discounts (Winter Coat 67%)
- Recommendation: Reduce discounts on top 10 products
```

### 5. Customer Segmentation & RFM

**What it can answer:**
- Buyer segments (1x, 2x, 3x+ buyers)
- RFM (Recency, Frequency, Monetary) analysis
- Customer lifetime value (LTV) predictions
- Customer retention and churn analysis
- New vs returning customer metrics
- Segment growth and trends

**Example Questions:**
```
✅ "Break down my customers by buyer segment (1x, 2x, 3x+)"
✅ "What's the LTV of my 3x+ buyers vs 1x buyers?"
✅ "Show me RFM segment distribution"
✅ "How many new vs returning customers last month?"
✅ "What percentage of customers become repeat buyers?"
✅ "Which customer segment generates the most revenue?"
✅ "Show me customer retention trends"
```

**Response Example:**
```markdown
Customer Segmentation Analysis (All Stores):

**Buyer Segments:**

**1x Buyers (One-Time Purchasers):**
- Customers: 2,845 (58.2% of total)
- Total Revenue: $186,420 (40.7% of total)
- Average Order Value: $65.53
- Average LTV: $65.53

**2x Buyers (Two-Time Purchasers):**
- Customers: 1,234 (25.3% of total)
- Total Revenue: $142,890 (31.2% of total)
- Average Order Value: $57.90
- Average LTV: $115.80

**3x+ Buyers (Loyal Customers):**
- Customers: 806 (16.5% of total)
- Total Revenue: $129,022 (28.1% of total)
- Average Order Value: $53.30
- Average LTV: $160.10

**RFM Segments:**
- Champions (High R, F, M): 412 customers | $89,450 revenue
- Loyal Customers: 623 customers | $72,180 revenue
- At Risk: 234 customers | $18,920 revenue
- Hibernating: 567 customers | $12,340 revenue

**Key Insights:**
- 41.8% of customers make repeat purchases (industry avg: 32%)
- 3x+ buyers have 2.4x higher LTV than 1x buyers
- Average time to second purchase: 45 days
- Retention rate after 2nd purchase: 65%

**Recommendations:**
- Focus on converting 1x to 2x buyers (potential +$95K revenue)
- Re-activate "At Risk" segment with win-back campaign
- Implement loyalty program for 3x+ buyers
```

### 6. Multi-Store & Account Comparison

**What it can answer:**
- Performance comparison across multiple stores
- Store-specific metrics and trends
- Cross-store benchmarking
- Individual store analysis within agency portfolios

**Example Questions:**
```
✅ "Compare campaign performance across all my stores"
✅ "Which store has the highest open rate?"
✅ "Show me revenue by store for last month"
✅ "Compare flow performance across Store A and Store B"
✅ "Which store is missing key automation flows?"
✅ "Rank my stores by revenue attribution"
```

**Response Example:**
```markdown
Multi-Store Performance Comparison (Last 30 Days):

**Aggregate Overview:**
- Total Revenue: $458,332
- Total Orders: 1,924
- Combined Attribution: 6.2%

**Individual Store Performance:**

**Store 1: Premium Boutique**
- Revenue: $186,420 (40.7%) | Orders: 782
- Attribution: 6.8% - **Above average**
- Open Rate: 28.5% | Click Rate: 3.2%
- Active Flows: 7/7 recommended
- Top Campaign: "Fall Collection Launch" - $12,450 revenue
- **Status**: ✅ All systems performing well

**Store 2: Fast Fashion Co**
- Revenue: $142,890 (31.2%) | Orders: 598
- Attribution: 6.0% - **Average**
- Open Rate: 24.1% | Click Rate: 2.8%
- Active Flows: 5/7 recommended (Missing: Browse Abandonment, Post-Purchase)
- Top Campaign: "Weekend Flash Sale" - $8,920 revenue
- **Status**: ⚠️ Missing 2 key flows (potential +$18K/month)

**Store 3: Luxury Brand**
- Revenue: $129,022 (28.1%) | Orders: 544
- Attribution: 5.4% - **Below average**
- Open Rate: 21.8% | Click Rate: 2.4%
- Active Flows: 4/7 recommended
- Top Campaign: "VIP Early Access" - $6,780 revenue
- **Status**: 🚨 Significant optimization needed

**Store Comparison Insights:**
- Store 1 outperforming by 26% in attribution
- Store 3 has highest AOV ($237) but lowest volume
- All stores have similar 3x+ buyer percentage (16-18%)
- SMS adoption varies: Store 1 (45%), Store 2 (28%), Store 3 (12%)

**Recommendations by Store:**
- **Store 1**: Maintain current strategy, test premium product upsells
- **Store 2**: Implement missing flows immediately (quick wins)
- **Store 3**: Full audit needed - improve list health, increase send frequency
```

### 7. Time-Based Comparisons

**What it can answer:**
- Period-over-period comparisons
- Trend analysis (daily, weekly, monthly)
- Seasonal performance patterns
- Growth rate calculations
- Year-over-year comparisons

**Example Questions:**
```
✅ "Compare last 7 days vs previous 7 days"
✅ "Show me revenue trends week-over-week"
✅ "How did last month compare to the month before?"
✅ "What's my growth rate over the last quarter?"
✅ "Compare this year's Q4 to last year's Q4"
✅ "Show me day-by-day performance for last 30 days"
```

**Response Example:**
```markdown
Period Comparison: Last 7 Days vs Previous 7 Days

**Current Period (Oct 15-21, 2024):**
- Revenue: $58,920
- Orders: 247
- Campaigns Sent: 8
- Average Daily Revenue: $8,417

**Previous Period (Oct 8-14, 2024):**
- Revenue: $43,230
- Orders: 189
- Campaigns Sent: 6
- Average Daily Revenue: $6,176

**Period-over-Period Changes:**
- Revenue: +36.3% ($15,690 increase)
- Orders: +30.7% (+58 orders)
- Average Order Value: +4.3% ($238 → $248)
- Campaigns: +33.3% (+2 campaigns)

**Daily Breakdown:**

**Current Period Best Days:**
1. Oct 15 (Sun): $12,450 - "Flash Sale Email" to 15K recipients
2. Oct 18 (Wed): $10,890 - "Mid-Week Special" to 12K recipients
3. Oct 20 (Fri): $9,780 - "Weekend Preview" to 18K recipients

**Previous Period Best Days:**
1. Oct 10 (Tue): $8,920
2. Oct 12 (Thu): $7,450
3. Oct 14 (Sat): $6,890

**Key Insights:**
- Sunday campaigns performing 39% better than weekdays
- Revenue per campaign improved from $7,205 to $7,365
- New abandoned cart flow contributed $4,230 (7.2% of period revenue)
- SMS campaigns in current period drove 28% higher click rates

**What Changed:**
- Added Sunday send slot (high performer)
- Activated abandoned cart flow (Oct 12)
- Increased SMS mix from 15% to 25% of sends
- Improved subject line testing (A/B tested all campaigns)

**Recommendations:**
- Continue Sunday send strategy
- Test Saturday evening sends (data suggests strong performance)
- Scale SMS to 30-35% of campaign mix
```

### 8. Deliverability & List Health

**What it can answer:**
- Email deliverability metrics
- Bounce rates and types
- Spam complaint rates
- Unsubscribe trends
- List growth and churn

**Example Questions:**
```
✅ "What's my average deliverability rate?"
✅ "Show me bounce rates by campaign"
✅ "How many spam complaints did I get last month?"
✅ "What's my unsubscribe rate trend?"
✅ "Which campaigns have the highest bounce rates?"
```

### 9. Forms & Sign-Ups

**What it can answer:**
- Form performance metrics
- Sign-up sources and attribution
- Form conversion rates
- Pop-up effectiveness

**Example Questions:**
```
✅ "Which sign-up forms are performing best?"
✅ "Show me conversion rates for all my pop-ups"
✅ "How many new subscribers did I get from each form?"
✅ "Compare form performance across stores"
```

### 10. Product Cohort Analysis & Retention

**What it can answer:**
- Product retention cohorts by month
- Entry product cohort tracking with retention curves
- Customer retention by first product purchased
- LTV progression by entry product (30d, 60d, 90d, 180d, 365d)
- Payback period by entry product
- Category expansion rates
- Cross-sell patterns from entry products

**Example Questions:**
```
✅ "Which products have the best retention cohorts?"
✅ "What's the 90-day retention rate for customers who bought [Product X] first?"
✅ "Show me LTV progression by entry product"
✅ "Which first products lead to the highest lifetime value?"
✅ "What's the payback period for customers acquired through each product?"
✅ "How does retention differ by entry product category?"
✅ "Show me month-over-month retention curves by product cohort"
✅ "Which entry products lead to the most category expansion?"
```

**Response Example:**
```markdown
Product Entry Cohort Analysis (Last 12 Months):

**Top 5 Entry Products by LTV (12-Month Cohorts):**

1. Premium Starter Kit (SKU: PSK-001)
   - New Customers: 342
   - Avg First Order Value: $89.50
   - 30-day LTV: $102.30 (1.14x first order)
   - 90-day LTV: $156.80 (1.75x first order)
   - 12-month LTV: $389.20 (4.35x first order)
   - Month 3 Retention: 45.3%
   - Month 12 Retention: 28.4%
   - Payback Period: 18 days
   - Category Expansion Rate: 2.8 categories/customer

2. Basic Tee Bundle (SKU: BTB-002)
   - New Customers: 892
   - Avg First Order Value: $34.90
   - 30-day LTV: $38.20 (1.09x)
   - 90-day LTV: $78.50 (2.25x)
   - 12-month LTV: $186.40 (5.34x)
   - Month 3 Retention: 38.7%
   - Month 12 Retention: 22.1%
   - Payback Period: 14 days
   - Category Expansion Rate: 1.9 categories/customer

3. Denim Jacket - Blue (SKU: DJ-003)
   - New Customers: 156
   - Avg First Order Value: $168.00
   - 30-day LTV: $172.50 (1.03x)
   - 90-day LTV: $245.80 (1.46x)
   - 12-month LTV: $412.30 (2.45x)
   - Month 3 Retention: 34.6%
   - Month 12 Retention: 18.9%
   - Payback Period: 35 days
   - Category Expansion Rate: 1.4 categories/customer

**Key Insights:**

**Best Entry Products for LTV:**
- Premium Starter Kit: Highest 12-month LTV multiplier (4.35x)
- Basic Tee Bundle: Highest volume + strong LTV multiplier (5.34x)
- Lower-priced entry products show better LTV multiples

**Retention Patterns:**
- Month 1-3: Critical period - 30-50% retention
- Month 3-12: Stabilization - 18-28% long-term retention
- Products with >40% month-3 retention show 2.5x better 12-month LTV

**Cross-Sell Opportunities:**
- Premium Starter Kit buyers expand to 2.8 categories (highest)
- Top cross-sell from PSK: Accessories (68%), Footwear (42%), Denim (34%)
- Basic Tee buyers most likely to add: Bottoms (56%), Outerwear (28%)

**Recommendations:**
- Focus acquisition budget on Premium Starter Kit (best long-term LTV)
- Promote Basic Tee Bundle for volume (high LTV multiple + fast payback)
- Create dedicated onboarding flow for new customers (high-risk period: month 1-3)
- Build cross-sell campaigns: Accessories for PSK buyers, Bottoms for Tee buyers
```

---

### 11. Product Affinity & Cross-Sell Recommendations

**What it can answer:**
- Products frequently bought together
- Cross-sell probability by product pair
- Lift scores for product recommendations
- Confidence scores for recommendations
- Time between product purchases
- Revenue potential from second purchases
- Affinity patterns by buyer segment (1x, 2x, 3x+)

**Example Questions:**
```
✅ "What products are frequently bought together?"
✅ "If a customer buys [Product X], what should I recommend next?"
✅ "Show me the strongest product affinities with high confidence scores"
✅ "What's the probability someone who bought [Product A] will buy [Product B]?"
✅ "Which product pairs have the highest lift scores?"
✅ "How long do customers wait between buying complementary products?"
✅ "What cross-sell recommendations work best for 1x buyers?"
✅ "Show me high-value cross-sell opportunities (>$100 second purchase)"
```

**Response Example:**
```markdown
Product Affinity Analysis - Cross-Sell Recommendations:

**Top 10 Product Pairs by Probability:**

1. Classic White Tee → Basic Black Jeans
   - Customers who bought both: 387
   - Total White Tee buyers: 892
   - Probability: 43.4%
   - Lift Score: 2.8 (2.8x more likely than random)
   - Confidence Score: 0.89 (high reliability)
   - Avg days between purchases: 18 days
   - Avg second purchase value: $78.50
   - Total revenue from second purchase: $30,385
   - Affinity by segment:
     • 1x buyers: 38.2%
     • 2x buyers: 45.7%
     • 3x+ buyers: 52.1%

2. Denim Jacket → White Sneakers
   - Customers who bought both: 142
   - Total Denim Jacket buyers: 234
   - Probability: 60.7%
   - Lift Score: 4.2 (highly correlated)
   - Confidence Score: 0.91
   - Avg days between purchases: 12 days
   - Avg second purchase value: $124.30
   - Total revenue from second purchase: $17,651
   - Affinity by segment:
     • 1x buyers: 52.3%
     • 2x buyers: 63.8%
     • 3x+ buyers: 68.9%

3. Leather Bag → Sunglasses
   - Probability: 31.2% | Lift: 3.1 | Confidence: 0.84
   - Avg days between: 8 days | Avg value: $89.90

[...7 more product pairs]

**Strategic Cross-Sell Opportunities:**

**High-Probability Recommendations (>40%):**
- Denim Jacket → White Sneakers (60.7%)
- Premium Starter Kit → Accessories Bundle (48.3%)
- Classic White Tee → Basic Black Jeans (43.4%)

**High-Value Recommendations (Avg >$100):**
- Leather Bag → Designer Wallet ($156.80)
- Winter Coat → Wool Scarf Set ($142.30)
- Running Shoes → Performance Socks Bundle ($118.90)

**Fast Follow-Up Recommendations (<14 days):**
- Leather Bag → Sunglasses (8 days)
- Denim Jacket → White Sneakers (12 days)
- Fitness Leggings → Sports Bra (10 days)

**Segment-Specific Insights:**
- 3x+ buyers show 1.4x higher affinity across all product pairs
- 1x buyers respond best to low-price cross-sells (<$60)
- 2x buyers are the "sweet spot" for mid-range upsells ($60-$120)

**Recommendations:**
1. **Automated Post-Purchase Flows:**
   - Send Denim Jacket buyers a White Sneakers offer within 5-10 days
   - Send White Tee buyers a Black Jeans offer within 10-15 days

2. **On-Site Product Recommendations:**
   - Show "Frequently Bought Together" for top 20 pairs
   - Use lift scores to prioritize recommendations

3. **Email Cross-Sell Campaigns:**
   - Create segment-specific campaigns (1x vs 3x+ different offers)
   - Target high-probability pairs (>40%) first

4. **Revenue Potential:**
   - Implementing top 10 cross-sell flows: Estimated +$85K/month
   - Optimizing timing (within avg days window): +15% conversion
```

---

### 12. Brand & Category Performance Analysis

**What it can answer:**
- Brand-level revenue and performance metrics
- Product type/category performance
- Tag-based product grouping analytics
- Brand customer LTV comparison
- Repeat customer rates by brand
- Revenue per product by brand/type/tag
- Active vs total products by brand

**Example Questions:**
```
✅ "Which brands generate the most revenue?"
✅ "Compare brand performance by customer LTV"
✅ "Show me repeat purchase rates by brand"
✅ "What product types are performing best?"
✅ "Which product tags drive the most revenue?"
✅ "What's the average order value by brand?"
✅ "Show me revenue per product for each brand"
✅ "Which brands have the highest customer retention?"
✅ "Compare active vs total products by brand"
```

**Response Example:**
```markdown
Brand Performance Analysis (All Time):

**Top 5 Brands by Revenue:**

1. **Nike**
   - Total Products: 142 | Active: 128 (90.1%)
   - Total Revenue: $458,920
   - Total Orders: 2,847
   - Avg Order Value: $161.20
   - Unique Customers: 1,923
   - Customer LTV: $238.60
   - Repeat Customer Rate: 34.2%
   - Revenue per Product: $3,232
   - Avg Product Price: $89.50
   - Total Quantity Sold: 5,127

2. **Adidas**
   - Total Products: 98 | Active: 89 (90.8%)
   - Total Revenue: $342,180
   - Total Orders: 2,134
   - Avg Order Value: $160.30
   - Unique Customers: 1,456
   - Customer LTV: $235.00
   - Repeat Customer Rate: 32.8%
   - Revenue per Product: $3,492
   - Avg Product Price: $92.30

3. **Lululemon**
   - Total Products: 67 | Active: 64 (95.5%)
   - Total Revenue: $289,450
   - Total Orders: 1,578
   - Avg Order Value: $183.50
   - Unique Customers: 1,234
   - Customer LTV: $234.60
   - Repeat Customer Rate: 38.9%
   - Revenue per Product: $4,320
   - Avg Product Price: $118.90

[...2 more brands]

**Product Type Performance:**

1. **Footwear**
   - Total Products: 187
   - Revenue: $645,230 (28.3% of total)
   - Orders: 3,842
   - AOV: $167.90
   - Unique Customers: 2,845
   - Customer LTV: $226.80
   - Revenue per Product: $3,451
   - Avg Product Price: $124.50

2. **Apparel - Tops**
   - Revenue: $523,180 (22.9%)
   - AOV: $89.20
   - Customer LTV: $198.40

3. **Accessories**
   - Revenue: $412,890 (18.1%)
   - AOV: $56.30
   - Customer LTV: $167.50

**Tag Performance (Top 10):**

1. "bestseller" tag
   - Products: 42
   - Revenue: $189,450
   - Revenue per Product: $4,511

2. "new-arrival" tag
   - Products: 68
   - Revenue: $145,230
   - Revenue per Product: $2,136

3. "sale" tag
   - Products: 156
   - Revenue: $98,340
   - Revenue per Product: $630

**Key Insights:**

**Brand Analysis:**
- Lululemon: Highest repeat rate (38.9%) + highest AOV ($183.50)
- Nike: Highest volume (5,127 units sold) + most customers (1,923)
- Premium brands (>$150 avg) show 1.3x higher LTV

**Product Type Insights:**
- Footwear dominates revenue (28.3%) with highest AOV
- Accessories are volume drivers (low price, high frequency)
- Apparel-Tops have best balance of volume + LTV

**Merchandising Insights:**
- "bestseller" tag products: 7x higher revenue per product
- "sale" tag underperforming: Only $630/product (test ending sales?)
- Active product rate varies: 85-95% (consider pruning inactive SKUs)

**Recommendations:**
1. Expand Lululemon catalog (highest repeat rate + AOV)
2. Bundle accessories with footwear (complementary AOV levels)
3. Audit "sale" tagged products (low revenue per product)
4. Focus marketing on "bestseller" products (7x higher performance)
5. Deactivate or promote non-performing SKUs (10-15% inactive)
```

---

### 13. First Purchase Optimization & New Customer Analysis

**What it can answer:**
- Best products for first-time customers
- New customer acquisition products
- Repurchase rates by first product
- Days to second purchase by first product
- LTV progression for first-time buyers (30d, 60d, 90d)
- Product ranking for new customer acquisition
- First purchase LTV analysis by product and cohort

**Example Questions:**
```
✅ "What products do first-time customers buy most?"
✅ "Which products lead to the highest repurchase rates?"
✅ "What's the average time to second purchase by first product?"
✅ "Show me new customer products ranked by repurchase rate"
✅ "Which first products lead to the highest 90-day LTV?"
✅ "Compare first purchase products by LTV and retention"
✅ "What percentage of first orders does each product represent?"
✅ "Show me the best entry products for customer acquisition"
```

**Response Example:**
```markdown
First Purchase & New Customer Product Analysis:

**Top 10 Products for New Customer Acquisition (Last 90 Days):**

1. **Classic White Tee (SKU: TS-001)**
   - New Customer Purchases: 892 (18.5% of all first orders)
   - New Customer Revenue: $31,122
   - Avg Quantity per Order: 1.8 units
   - Customers Who Repurchased: 342 (38.3%)
   - Repurchase Rate: 38.3%
   - Avg Days to Second Purchase: 24 days
   - 30-day LTV: $38.20
   - 60-day LTV: $64.80
   - 90-day LTV: $78.50
   - Rank by Purchases: #1
   - Rank by Revenue: #3
   - Rank by Repurchase Rate: #5

2. **Premium Starter Kit (SKU: PSK-001)**
   - New Customer Purchases: 342 (7.1% of first orders)
   - New Customer Revenue: $30,618
   - Avg Quantity per Order: 1.0 units
   - Customers Who Repurchased: 155 (45.3%)
   - Repurchase Rate: 45.3%
   - Avg Days to Second Purchase: 18 days
   - 30-day LTV: $102.30
   - 60-day LTV: $134.50
   - 90-day LTV: $156.80
   - Rank by Purchases: #4
   - Rank by Revenue: #4
   - Rank by Repurchase Rate: #1

3. **Basic Black Jeans (SKU: BJ-002)**
   - New Customer Purchases: 567 (11.8%)
   - New Customer Revenue: $39,690
   - Repurchase Rate: 32.1%
   - Avg Days to Second Purchase: 32 days
   - 90-day LTV: $92.40
   - Rank by Repurchase Rate: #8

[...7 more products]

**First Purchase LTV Analysis by Product & Cohort:**

**September 2024 Cohort:**

1. Premium Starter Kit
   - Customers Acquired: 45
   - Avg First Order Value: $89.50
   - 30-day LTV: $106.20
   - 90-day LTV: $178.30
   - 180-day LTV: $256.40
   - Lifetime LTV: $389.20

2. Classic White Tee
   - Customers Acquired: 156
   - Avg First Order Value: $34.90
   - 30-day LTV: $42.10
   - 90-day LTV: $89.50
   - 180-day LTV: $142.30
   - Lifetime LTV: $186.40

**Key Insights:**

**Best Entry Products for Different Goals:**

**For High Volume:**
- Classic White Tee: 892 new customers (18.5% of first orders)
- Basic Black Jeans: 567 new customers (11.8%)
- Simple Tote Bag: 423 new customers (8.8%)

**For High Repurchase Rate:**
- Premium Starter Kit: 45.3% repurchase
- Subscription Box: 42.8% repurchase
- Basic Tee Bundle: 38.3% repurchase

**For High LTV:**
- Premium Starter Kit: $156.80 at 90 days (4.35x lifetime multiplier)
- Subscription Box: $142.30 at 90 days (3.89x multiplier)
- Denim Jacket: $128.50 at 90 days (2.45x multiplier)

**For Fast Second Purchase:**
- Subscription Box: 12 days average
- Premium Starter Kit: 18 days average
- Classic White Tee: 24 days average

**Conversion Strategy by Product:**
- Low-price entry (<$40): High volume, moderate LTV (Classic Tee, Simple Tote)
- Mid-price entry ($40-$100): Balanced volume + LTV (Basic Jeans, Tee Bundle)
- High-price entry (>$100): Lower volume, highest LTV (Premium Kit, Jacket)

**Recommendations:**

1. **Acquisition Campaigns:**
   - Focus on Classic White Tee for volume (18.5% of first orders)
   - Promote Premium Starter Kit for quality (45.3% repurchase)
   - Test bundle offers (combine volume + LTV strengths)

2. **Post-Purchase Automation:**
   - Premium Kit buyers: Send follow-up offer at day 12-15 (before 18-day avg)
   - White Tee buyers: Send second offer at day 18-20 (before 24-day avg)
   - Target non-repurchasers at day 30 with win-back campaign

3. **Product Optimization:**
   - Create more "starter kits" (highest repurchase + LTV)
   - Bundle low-price items to increase AOV (Tee + Jeans = higher LTV)
   - Reduce SKU count for products <5% of first orders

4. **Revenue Potential:**
   - Improving repurchase rate from 35% → 40%: +$125K/year
   - Reducing days to second purchase by 5 days: +$45K/year
   - Promoting Premium Kit (2x higher LTV): +$89K/year
```

---

### 14. Discount Effectiveness & Customer Dependency

**What it can answer:**
- Overall discount usage rates
- Discount effectiveness by customer segment (1x, 2x, 3x+)
- LTV comparison: customers acquired with vs without discounts
- Retention rates with vs without first-order discounts
- Top discount codes by usage and revenue
- Discount dependency analysis
- First-order discount impact on lifetime value

**Example Questions:**
```
✅ "What percentage of orders use discounts?"
✅ "Do customers acquired with discounts have lower LTV?"
✅ "Show me discount usage by customer segment (1x, 2x, 3x+)"
✅ "What's the retention rate for customers who got a first-order discount?"
✅ "Which discount codes are most effective?"
✅ "How much are we giving away in discounts?"
✅ "Compare LTV of customers acquired with vs without discounts"
✅ "What's the average discount percentage?"
✅ "Are my customers discount-dependent?"
```

**Response Example:**
```markdown
Discount Usage & Effectiveness Analysis (Last 90 Days):

**Overall Discount Metrics:**

- Total Orders: 5,847
- Orders with Discount: 1,924 (32.9%)
- Discount Usage Rate: 32.9%
- Avg Discount Amount: $18.50
- Avg Discount Percentage: 21.3%
- Total Discounts Given: $35,594
- Analysis Date: Oct 23, 2024

**First-Order Discount Impact:**

- Total First Orders: 1,456
- First Orders with Discount: 892 (61.3%)
- First Order Discount Rate: 61.3%
- Avg First-Order Discount: 23.8%

**LTV Comparison (Acquired with vs without discount):**

**With First-Order Discount:**
- Avg First Order LTV: $89.20
- Retention Rate (to 2nd purchase): 28.4%
- 30-day LTV: $94.50
- 90-day LTV: $142.30
- Lifetime LTV: $186.40

**Without First-Order Discount:**
- Avg First Order LTV: $124.80
- Retention Rate (to 2nd purchase): 42.7%
- 30-day LTV: $138.90
- 90-day LTV: $234.50
- Lifetime LTV: $312.80

**LTV Delta:**
- Customers acquired WITHOUT discount have 1.68x higher lifetime LTV
- Retention rate 1.5x better without first-order discount
- BUT: 61.3% of new customers only buy because of discount (acquisition trade-off)

**Discount Usage by Customer Segment:**

**1x Buyers (One-Time Purchasers):**
- Discount Usage: 58.3%
- Avg Discount: 24.2%
- Revenue Lost to Discounts: $18,920

**2x Buyers (Two Purchases):**
- Discount Usage: 38.7%
- Avg Discount: 19.8%
- Revenue Lost to Discounts: $8,450

**3x+ Buyers (Loyal Customers):**
- Discount Usage: 18.9%
- Avg Discount: 14.3%
- Revenue Lost to Discounts: $4,230

**Key Insight:** 1x buyers are 3x more discount-dependent than loyal customers.

**Top Discount Codes (Last 90 Days):**

1. **WELCOME20**
   - Usage: 456 orders
   - Avg Discount: $17.50 (20% off)
   - Total Discount Given: $7,980
   - Repurchase Rate: 24.1%
   - 90-day LTV: $128.40

2. **FIRSTORDER**
   - Usage: 342 orders
   - Avg Discount: $22.30 (25% off)
   - Total Discount Given: $7,627
   - Repurchase Rate: 22.8%
   - 90-day LTV: $112.30

3. **FLASH30**
   - Usage: 289 orders
   - Avg Discount: $31.20 (30% off)
   - Total Discount Given: $9,017
   - Repurchase Rate: 18.3%
   - 90-day LTV: $89.50

[...more discount codes]

**Discount Effectiveness Analysis:**

**Best Discount Strategy (by LTV):**
- WELCOME20: Best balance (24.1% repurchase, $128 LTV)
- Lower discount % (20%) outperforms higher discounts (30%)
- Codes >25% show significantly worse retention

**Worst Discount Strategy:**
- FLASH30: Lowest repurchase (18.3%), lowest LTV ($89.50)
- Deep discounts (>25%) attract one-time buyers only

**Discount Dependency Score by Segment:**
- 1x Buyers: 58.3% → HIGH dependency
- 2x Buyers: 38.7% → MODERATE dependency
- 3x+ Buyers: 18.9% → LOW dependency

**Key Insights:**

1. **First-Order Discounts Hurt Long-Term LTV:**
   - Without discount: $312.80 lifetime LTV
   - With discount: $186.40 lifetime LTV (-40.4%)
   - Trade-off: More volume, lower quality

2. **Discount Depth Matters:**
   - 20% discount: 24.1% repurchase, $128 LTV
   - 30% discount: 18.3% repurchase, $89 LTV
   - Sweet spot: 15-20% for new customers

3. **Customer Quality Inverse to Discount:**
   - 1x buyers: 58.3% use discounts (low quality)
   - 3x+ buyers: 18.9% use discounts (high quality)
   - Loyal customers don't need discounts

4. **Revenue Impact:**
   - Total discounts given: $35,594 (last 90 days)
   - Estimated revenue loss from over-discounting: $12,340
   - Potential recovery from discount optimization: $8,920

**Recommendations:**

1. **Reduce First-Order Discount Depth:**
   - Change WELCOME20 from 20% → 15%
   - Remove FLASH30 entirely (worst performer)
   - Test value-based offers (free shipping instead of %)

2. **Segment-Based Discount Strategy:**
   - Never discount to 3x+ buyers (they don't need it)
   - Use small discounts (10-15%) for 2x buyers only
   - Reserve deep discounts (20%+) for win-back campaigns only

3. **Optimize for LTV, Not Volume:**
   - Acquisition without discount: 1.68x higher LTV
   - Test reducing first-order discount to 10-15%
   - Focus on product value, not price discounting

4. **Expected Impact:**
   - Reducing avg discount from 21.3% → 15%: Save $18K/quarter
   - Improving repurchase rate by 5%: Add $42K/quarter
   - Total potential gain: $60K/quarter
```

---

### 15. Strategic Insights & Recommendations

**What it can answer:**
- Optimization opportunities
- Benchmark comparisons
- Best practices and recommendations
- Gap analysis (missing flows, underperforming segments)

**Example Questions:**
```
✅ "What are my biggest optimization opportunities?"
✅ "How do my metrics compare to industry benchmarks?"
✅ "What flows am I missing that I should implement?"
✅ "Where should I focus to increase revenue?"
✅ "What's working well and what needs improvement?"
```

---

## 🎯 Use Cases by Role

### For Agencies Managing Multiple Clients

**Client Performance Review:**
```
"Compare all client stores by revenue attribution last month"
"Which client has the strongest email performance?"
"Show me which clients are missing key automation flows"
```

**Portfolio Optimization:**
```
"What's the average open rate across all clients?"
"Which clients have the highest growth rate?"
"Identify underperforming clients that need attention"
```

**Strategy Development:**
```
"What strategies are working best across high-performing clients?"
"Compare abandoned cart flow performance across all clients"
"Which products are best sellers across the portfolio?"
```

### For Multi-Brand Businesses

**Brand Comparison:**
```
"Compare revenue performance across all brands"
"Which brand has the highest customer LTV?"
"Show me campaign performance by brand"
```

**Cross-Brand Insights:**
```
"What products sell well across all brands?"
"Compare flow automation maturity across brands"
"Which brand has the best customer retention?"
```

**Resource Allocation:**
```
"Which brand needs the most optimization work?"
"Where should we focus marketing spend?"
"What's the ROI by brand?"
```

### For Individual Store Operators

**Daily Operations:**
```
"How am I performing today vs yesterday?"
"What's my revenue so far this week?"
"Which campaigns sent today?"
```

**Campaign Planning:**
```
"What were my best-performing subject lines last month?"
"When is the best day/time to send campaigns?"
"Which audience segments convert best?"
```

**Growth Strategy:**
```
"What's my customer retention rate?"
"Which products should I promote more?"
"How can I improve my abandoned cart recovery?"
```

---

## 🔐 Security & Permissions

### Multi-Tenant Data Isolation

- **Store-Level Permissions**: Users can only query data for stores they have access to
- **Contract Seat System**: Access managed through Contract/Seat permissions
- **Klaviyo ID Filtering**: All queries automatically filtered by `klaviyo_public_id`
- **Input Sanitization**: All user inputs sanitized to prevent SQL injection
- **Prompt Protection**: System prompts secured against extraction attempts

### Permission Model

```javascript
User → ContractSeat → Store Access → Klaviyo Integration → Data
```

- Super admins: Access to all stores
- Regular users: Access via ContractSeat grants
- Empty store_access array = access to ALL stores in contract
- Specific store_access array = access to only listed stores

---

## 💾 Database Architecture for AI Chatbot

### Recommended Database Schema

To power the AI chatbot's multi-store analytics capabilities, you need the following database architecture:

#### **1. Core Tables (Already Implemented)**

**ClickHouse Analytics Database** (28 tables)
- Transaction tables: `klaviyo_orders`, `klaviyo_order_line_items`
- Marketing statistics: `campaign_statistics`, `flow_statistics`, `form_statistics`, `segment_statistics`
- Daily aggregates: `account_metrics_daily`, `campaign_daily_aggregates`
- Customer analytics: `customer_profiles`, `buyer_segments_analysis`, `customer_ltv_predictions`
- Product analytics: `products_master`, `product_ltv_analysis`, `product_affinity_matrix`, `product_discount_analysis`
- RFM analysis: Built into `customer_profiles` table

#### **2. MongoDB Collections (For User/Store Management)**

```javascript
// Store model
{
  public_id: "XAeU8VL",              // Store identifier
  name: "Store Name",
  klaviyo_integration: {
    public_id: "XqkVGb",             // Klaviyo account ID (for ClickHouse queries)
    apiKey: "pk_xxxxx",
    oauth_token: "Bearer...",
    // ...other integration fields
  },
  contract_id: ObjectId,             // Associated contract
  is_deleted: false
}

// User model
{
  email: "user@example.com",
  name: "User Name",
  is_super_user: false,              // Admin access
  // ...other user fields
}

// ContractSeat model (Permission Management)
{
  user_id: ObjectId,                 // User reference
  contract_id: ObjectId,             // Contract reference
  store_access: [],                  // Empty = all stores, or specific store IDs
  status: "active"
}
```

#### **3. Required Data Fields for AI Chatbot**

**Campaign Data:**
```sql
campaign_id, campaign_name, send_channel (email/sms/push), recipients,
opens_unique, clicks_unique, conversion_value, open_rate, click_rate,
send_date, klaviyo_public_id, store_public_ids
```

**Flow Data:**
```sql
flow_id, flow_name, channel, trigger_count, conversions, conversion_value,
conversion_rate, status (active/paused), klaviyo_public_id
```

**Revenue Data:**
```sql
order_id, customer_email, order_value, order_timestamp, item_count,
attributed_revenue, attribution_source (campaign/flow),
attribution_channel (email/sms/push), klaviyo_public_id
```

**Customer Data:**
```sql
customer_email, total_orders, total_revenue, first_order_date,
last_order_date, avg_order_value, buyer_segment (1x/2x/3x+),
rfm_score (recency/frequency/monetary), klaviyo_public_id
```

**Product Data:**
```sql
product_id, sku, product_name, total_revenue, total_orders,
unique_customers, avg_price, ltv_analysis, discount_dependency,
klaviyo_public_id
```

**RFM Segments:**
```sql
customer_email, recency_score (1-5), frequency_score (1-5),
monetary_score (1-5), rfm_segment (Champions/Loyal/At Risk/etc),
segment_revenue, last_purchase_date, klaviyo_public_id
```

#### **4. Data Update Strategy**

**Real-Time Updates (15-30 minutes):**
- Campaign statistics
- Flow statistics
- Daily metrics
- Order transactions

**Daily Aggregation:**
- Customer LTV predictions
- Product analytics
- RFM segmentation
- Buyer segment analysis

**Weekly Aggregation:**
- Product affinity matrix
- Cross-sell recommendations
- Discount effectiveness

#### **5. Query Optimization**

**Indexes Required:**
```sql
-- Primary indexes (already in ClickHouse schema)
klaviyo_public_id, date, campaign_id, flow_id, product_id, customer_email

-- Composite indexes for common queries
(klaviyo_public_id, date)
(klaviyo_public_id, campaign_id, date)
(klaviyo_public_id, customer_email)
(klaviyo_public_id, product_id)
```

**Query Patterns:**
- Statistics tables: Use `argMax(column, updated_at)` for latest values
- Analytics tables: Use `FINAL` for ReplacingMergeTree tables
- Daily metrics: Use `ORDER BY date DESC, updated_at DESC LIMIT 1 BY date`
- Transaction tables: Direct queries with proper filtering

---

## 🚀 Performance Characteristics

### Response Times
- **Tier 1 (On-Screen)**: <500ms
- **Tier 2 (SQL)**: 1-3 seconds
- **Tier 3 (Real-Time API)**: 2-5 seconds

### Cost Per Query
- **Tier 1**: ~$0.0001 (Haiku-based)
- **Tier 2**: ~$0.001-0.005 (Haiku SQL + Sonnet analysis)
- **Tier 3**: ~$0.005-0.01 (Sonnet with MCP)
- **Intent Detection**: ~$0.0001 (negligible)

### Data Freshness
- Campaign/Flow stats: Updated every 15 minutes
- Daily metrics: Updated every 30 minutes
- Transaction data: Updated every 30 minutes
- Analytics aggregates: Updated daily

### Scalability
- **Concurrent Users**: Supports 100+ simultaneous queries
- **Store Limit**: No practical limit (tested with 50+ stores)
- **Data Volume**: Handles millions of transactions efficiently
- **Query Performance**: <100ms for most ClickHouse queries

---

## 🎨 UI Integration

### Chat Widget Location
- **Bottom-right corner** of dashboard (persistent across all pages)
- **Floating button** when collapsed
- **Expandable panel** (400px width) when open
- **Context-aware**: Automatically provides on-screen data

### User Experience
1. User types question in natural language
2. AI detects intent and routes to optimal tier
3. Loading indicator shows processing
4. Response appears with formatted insights
5. Follow-up questions encouraged
6. Conversation history maintained

### Response Formatting
- **Markdown support**: Headers, lists, bold, tables
- **Icon markers**: Visual indicators for insights ([CHECK], [TREND], [WARNING])
- **Number formatting**: Currency, percentages, large numbers
- **Structured data**: Tables and charts where appropriate
- **Action items**: Clear recommendations

---

## 🔮 Future Enhancements

### Planned Features
1. **Predictive Analytics**: "Predict next month's revenue" using ML models
2. **Automated Recommendations**: Proactive suggestions based on performance
3. **Anomaly Detection**: Automatic alerts for unusual patterns
4. **Cohort Analysis**: "Show me retention by acquisition month"
5. **A/B Test Analysis**: "Compare A/B test results for last campaign"
6. **Customer Journey Mapping**: Visualize customer paths to purchase
7. **Competitive Benchmarking**: Compare against industry standards
8. **Custom Metrics**: User-defined KPIs and calculations

### Technical Roadmap
- [ ] Add GPT-4 Turbo as alternative model option
- [ ] Implement streaming responses for faster UX
- [ ] Add voice input support
- [ ] Create embeddable widget for external sites
- [ ] Build API for programmatic access
- [ ] Add export functionality (PDF, CSV)

---

## 📝 Implementation Checklist

To implement this AI chatbot, you need:

### Backend Infrastructure
- [ ] ClickHouse database with 31 production tables
- [ ] MongoDB for user/store management
- [ ] OpenRouter API account (for AI models)
- [ ] Klaviyo API integration (OAuth preferred)
- [ ] Next.js API routes for:
  - `/api/chat/ai` - Main chat endpoint
  - `/api/ai/analyze` - Tier 2 SQL analysis
  - `/api/ai/analyze-mcp` - Tier 3 real-time API

### AI Components
- [ ] Intent detection system (Haiku-powered)
- [ ] SQL generation engine (Haiku → ClickHouse)
- [ ] Analysis engine (Sonnet/Gemini)
- [ ] Context management system
- [ ] Input sanitization and security

### Frontend Components
- [ ] Chat widget UI component
- [ ] AI context provider (React Context)
- [ ] Message history management
- [ ] Loading states and error handling
- [ ] Response formatting and rendering

### Security & Permissions
- [ ] User authentication (Auth.js v5)
- [ ] Permission system (ContractSeat model)
- [ ] Store-level data filtering
- [ ] Input sanitization
- [ ] Rate limiting

### Data Pipeline
- [ ] Klaviyo data sync (every 15-30 minutes)
- [ ] Daily aggregation jobs
- [ ] Analytics table updates
- [ ] RFM segment calculations

---

## 🎓 Best Practices

### For Users

**Asking Better Questions:**
- Be specific about time ranges: "last 30 days" vs "last month"
- Name stores explicitly: "for Store A" vs "for all my stores"
- Ask follow-up questions to dig deeper
- Request comparisons for context: "vs previous period"

**Getting More Value:**
- Use the chatbot for quick ad-hoc analysis
- Ask "why" questions to understand trends
- Request recommendations for optimization
- Compare across stores to find best practices

### For Developers

**Optimizing Performance:**
- Cache frequent queries (5-minute TTL)
- Use ClickHouse query parameters (prevent SQL injection)
- Implement proper error handling and fallbacks
- Monitor AI costs and optimize tier routing

**Maintaining Accuracy:**
- Keep ClickHouse schema up-to-date
- Validate data quality regularly
- Test intent detection accuracy
- Monitor false routing rates

---

## 📊 Success Metrics

### User Engagement
- Average queries per user per day
- Query success rate (% of questions answered)
- User satisfaction (thumbs up/down)
- Feature adoption rate

### Performance Metrics
- Average response time by tier
- Query cost per user
- Error rate and types
- Tier routing accuracy

### Business Impact
- Time saved vs manual analysis
- Insights acted upon
- Revenue impact of recommendations
- User retention and engagement

---

## 🆘 Support & Documentation

For more information:
- **Technical Documentation**: `/context/AI_CHAT.md`
- **Database Schema**: `/context/CLICKHOUSE_TABLES_COMPLETE_V2.md`
- **Intent Detection**: `/lib/ai/intent-detection-haiku.js`
- **SQL Generation**: `/lib/ai/haiku-sql.js`
- **Analysis Engine**: `/lib/ai/sonnet-analysis.js`

---

**Last Updated**: October 2025
**Version**: 3.0 - Three-Tier Intelligent Routing System
**Maintained by**: Wizel Engineering Team

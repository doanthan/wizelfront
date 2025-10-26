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
- **Data Source**: ClickHouse analytics database (28 production tables)
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

### ClickHouse Database Architecture (28 Production Tables)

The AI has access to a comprehensive ClickHouse analytics database with 28 production tables:

#### **Transaction Tables (2)**
- `klaviyo_orders` - Order transactions with customer data
- `klaviyo_order_line_items` - Line item details with discounts and product data

#### **Marketing Statistics Tables (7)**
- `campaign_statistics` - Campaign performance (15-min updates)
- `campaign_statistics_new` - Enhanced campaign stats
- `flow_statistics` - Flow automation performance
- `form_statistics` - Form/popup performance
- `segment_statistics` - Segment growth tracking
- `flow_metadata` - Flow catalog for dropdowns
- `form_metadata` - Form catalog for dropdowns
- `segment_metadata` - Segment catalog for dropdowns

#### **Aggregated Tables (3)**
- `account_metrics_daily` - Daily account-level KPIs (updated every 30 min)
- `campaign_daily_aggregates` - Campaign performance by day

#### **Analytics Tables (13)**
- `customer_profiles` - Customer LTV and RFM analysis
- `products_master` - Product performance analytics
- `product_discount_analysis` - Discount effectiveness analysis
- `customer_ltv_predictions` - ML-based LTV predictions
- `first_purchase_ltv` - First product LTV impact
- `first_purchase_ltv_analysis` - Enhanced first product analysis
- `product_cohorts` - Product retention cohorts
- `product_entry_cohorts` - Entry product cohort tracking
- `product_relationships_optimized` - Product co-purchase analysis
- `discount_dependency` - Customer discount dependency
- `refund_cancelled_orders` - Refund and cancellation events
- `buyer_segments_analysis` - Customer segment analytics (1x, 2x, 3x+ buyers)
- `product_ltv_analysis` - Product LTV breakdown
- `discount_usage_analytics` - Discount effectiveness metrics
- `new_customer_products` - Best products for new customers
- `product_affinity_matrix` - Product recommendation engine

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

### 10. Strategic Insights & Recommendations

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
- [ ] ClickHouse database with 28 production tables
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

# Multi-Account Reporting - AI Analysis Prompts

## Overview
This document defines specialized AI prompts for each multi-account reporting page to help users compare data, identify patterns, and get actionable insights across multiple Klaviyo/Shopify accounts.

---

## 1. REVENUE TAB

### Page Context
Users can compare revenue metrics across multiple accounts including:
- Overall revenue vs attributed revenue
- Revenue trends over time (daily, weekly, monthly)
- Account-by-account comparison
- Revenue by channel (email, SMS, campaigns, flows)
- Average order value (AOV)
- Orders and customers

### Specialized Analysis Capabilities

**Account Comparison Queries:**
```
"Which account generates the most revenue?"
"Compare revenue performance across my accounts"
"Show me the best and worst performing accounts"
"Which accounts improved the most this period?"
```

**Trend Analysis:**
```
"Is my revenue growing or declining?"
"What's the trend across all accounts?"
"Which month had the highest revenue?"
"Are any accounts declining while others grow?"
```

**Channel Performance:**
```
"Which channel drives the most revenue?"
"Compare email vs SMS revenue"
"How much revenue comes from automated flows?"
"What percentage is attributed vs overall?"
```

**Strategic Insights:**
```
"What's my average order value by account?"
"Which accounts have the highest AOV?"
"How can I increase attributed revenue?"
"What should I focus on to grow revenue?"
```

### AI Response Format for Revenue Tab

When analyzing revenue data, structure responses like this:

```
**Revenue Performance Summary:**
[REVENUE] Total: $X across Y accounts
[TREND] Up/Down Z% from previous period
[CHECK] Top performer: [Account] at $X
[DOWN] Lowest performer: [Account] at $X

**Key Insights:**
[GOAL] Average revenue per account: $X
[AUDIENCE] X% of revenue from Y% of accounts (80/20 rule)
[EMAIL] Email channel contributing X%
[QUICK] Biggest opportunity: [specific action]

**Recommendations:**
1. [TIP] [Account-specific action]
2. [TIP] [Channel optimization]
3. [GOAL] Target: $X by [timeframe]
```

---

## 2. CAMPAIGNS TAB

### Page Context
Users can analyze campaign performance across accounts including:
- Campaign list with key metrics (opens, clicks, revenue)
- Send time optimization matrix
- Account performance comparison
- Campaign details with preview
- Engagement metrics (open rate, click rate, CTOR)
- Revenue per campaign

### Specialized Analysis Capabilities

**Cross-Account Campaign Analysis:**
```
"Which account has the best campaign performance?"
"Compare open rates across accounts"
"Show me the highest revenue campaigns"
"Which account sends the most campaigns?"
```

**Timing Analysis:**
```
"What's the best time to send campaigns?"
"Which day of week performs best?"
"Compare morning vs afternoon sends"
"Are weekends better than weekdays?"
```

**Content & Subject Line Insights:**
```
"Which campaign had the highest open rate?"
"What subject lines work best?"
"Compare campaigns with similar subjects"
"Which campaigns drove the most revenue?"
```

**Engagement Patterns:**
```
"What's the average open rate across accounts?"
"Which accounts have the best click rates?"
"Is CTOR improving or declining?"
"How does engagement compare to benchmarks?"
```

### AI Response Format for Campaigns Tab

```
**Campaign Performance Overview:**
[EMAIL] Total campaigns: X across Y accounts
[CHECK] Average open rate: Z% (vs 21.3% benchmark)
[TREND] Click rate trending [up/down] X%
[REVENUE] Total campaign revenue: $X

**Top Performers:**
[CHECK] Best campaign: "[Name]" - $X revenue, Y% open rate
[CHECK] Top account: [Account] - Z campaigns, $X total
[TIME] Optimal send time: [Day] at [Time]

**Areas for Improvement:**
[DOWN] [Account] underperforming at X% open rate
[WARNING] [Account] click rate below 2% benchmark
[AUDIENCE] Subscriber fatigue detected in [account]

**Action Plan:**
[QUICK] Replicate "[Campaign]" format for [Account]
[TIP] Test [Day] sends for [Account]
[GOAL] Target 25% open rate across all accounts
[TIME] Implement before next major send
```

---

## 3. FLOWS TAB

### Page Context
Users can analyze automation/flow performance across accounts including:
- Flow list with trigger types (abandoned cart, welcome, etc.)
- Revenue per trigger
- Flow engagement metrics
- Cross-account flow comparison
- Flow message performance

### Specialized Analysis Capabilities

**Flow Performance Comparison:**
```
"Which flow generates the most revenue?"
"Compare abandoned cart performance across accounts"
"Which account has the best welcome series?"
"Show me flow revenue by account"
```

**Flow Optimization:**
```
"Are my flows performing well?"
"Which flows need improvement?"
"What's the average revenue per trigger?"
"Which flow messages have low engagement?"
```

**Account-Specific Flow Analysis:**
```
"Does [Account] have all essential flows?"
"Which account is missing flows?"
"Compare flow setup across accounts"
"Who has the best flow configuration?"
```

**ROI & Efficiency:**
```
"What's my ROI from automated flows?"
"How much revenue comes from automations?"
"Which flows are most efficient?"
"Calculate flow revenue vs campaign revenue"
```

### AI Response Format for Flows Tab

```
**Flow Performance Summary:**
[ZAP] Total automated revenue: $X
[CHECK] Top flow: [Flow name] - $X revenue
[TREND] Flow revenue [up/down] Y% from last period
[AUDIENCE] Average revenue per trigger: $Z

**Account Comparison:**
[CHECK] Best flow setup: [Account] with X active flows
[WARNING] [Account] missing key flows (abandoned cart, welcome)
[REVENUE] [Account] generates $X from flows (Y% of total)

**Flow-Specific Insights:**
[EMAIL] Welcome series: $X average per subscriber
[EMAIL] Abandoned cart: Z% conversion rate
[DOWN] [Flow] underperforming in [Account]
[CHECK] [Flow] consistently strong across accounts

**Optimization Opportunities:**
[QUICK] Add abandoned cart flow to [Account] (expected +$X)
[TIP] Extend welcome series from 3 to 5 emails
[GOAL] Target $X monthly flow revenue
[SEARCH] Review drop-off in [Flow] at message 3
```

---

## 4. DELIVERABILITY TAB

### Page Context
Users can monitor email deliverability and list health across accounts including:
- Bounce rates (hard and soft)
- Spam complaints
- Unsubscribe rates
- List growth and churn
- Engagement quality metrics
- Domain reputation indicators

### Specialized Analysis Capabilities

**List Health Monitoring:**
```
"How is my deliverability across accounts?"
"Which account has the highest bounce rate?"
"Are my unsubscribe rates healthy?"
"Compare list quality across accounts"
```

**Deliverability Issues:**
```
"Do I have any deliverability problems?"
"Which account needs attention?"
"Are spam complaints increasing?"
"What's causing high bounce rates?"
```

**List Growth Analysis:**
```
"Which account is growing fastest?"
"Compare subscriber acquisition across accounts"
"What's my net list growth?"
"Who has the healthiest list?"
```

**Risk Assessment:**
```
"Am I at risk for deliverability issues?"
"Which metrics are concerning?"
"How do I compare to best practices?"
"What needs immediate action?"
```

### AI Response Format for Deliverability Tab

```
**Deliverability Health Check:**
[CHECK] Overall status: [Healthy/Needs Attention/Critical]
[WARNING] X accounts have elevated bounce rates
[CHECK] Y accounts within healthy ranges
[TREND] List growth: [up/down] Z% this period

**Account-Specific Status:**
[CHECK] [Account]: All metrics healthy
[WARNING] [Account]: Bounce rate at X% (threshold: 2%)
[ERROR] [Account]: Spam complaints above 0.1%
[CHECK] [Account]: Strong engagement, low churn

**Critical Issues:**
[ERROR] [Account] hard bounce rate: X% (CRITICAL - above 2%)
[WARNING] [Account] unsubscribe rate: Y% (elevated)
[TIME] Immediate action needed for [Account]

**List Growth:**
[TREND] [Account] growing at X subscribers/day
[DOWN] [Account] net negative growth (losing subs)
[AUDIENCE] [Account] has highest engagement quality

**Action Plan:**
1. [QUICK] Clean [Account] list - remove hard bounces immediately
2. [TIP] Implement double opt-in for [Account]
3. [TIP] Send re-engagement campaign to [Account] inactive subs
4. [GOAL] Get all accounts under 2% bounce rate by [date]
5. [SEARCH] Investigate spam complaints in [Account] - check content
```

---

## CROSS-TAB INSIGHTS

### Holistic Account Analysis

When users ask questions that span multiple tabs:

```
"Give me a complete picture of [Account]"
"Which account is performing best overall?"
"What's my biggest opportunity across all accounts?"
"Compare [Account A] vs [Account B] across all metrics"
```

**Response Format:**

```
**Complete Performance Analysis: [Account Name]**

**Revenue (tab: revenue):**
[REVENUE] $X total revenue (Y% of portfolio)
[TREND] [Up/Down] Z% from previous period
[GOAL] AOV: $X (vs portfolio average: $Y)

**Campaigns (tab: campaigns):**
[EMAIL] X campaigns sent
[CHECK] Open rate: Y% (vs benchmark: 21.3%)
[DOWN] Click rate: Z% (needs improvement)
[REVENUE] Campaign revenue: $X

**Flows (tab: flows):**
[ZAP] Flow revenue: $X (Y% of account revenue)
[CHECK] Abandoned cart: $X recovery rate
[WARNING] Missing welcome series optimization

**Deliverability (tab: deliverability):**
[CHECK] Bounce rate: X% (healthy)
[CHECK] Unsubscribe rate: Y% (healthy)
[TREND] List growing at Z subs/day

**Overall Assessment:**
[CHECK] Strong: [what's working]
[WARNING] Needs attention: [what needs work]
[QUICK] Quick win: [specific action]
[GOAL] Next milestone: [specific target]

**Recommended Focus:**
1. [TIP] [Highest impact action]
2. [TIP] [Secondary priority]
3. [GOAL] [Specific measurable goal]
```

---

## COMPARISON QUERIES

### Multi-Account Benchmarking

When users ask to compare accounts:

```
"Rank my accounts by performance"
"Show me the best and worst performers"
"Which accounts need the most work?"
"Create a performance matrix"
```

**Response Format:**

```
**Multi-Account Performance Matrix:**

**Top Performers (Tier 1):**
1. [ACCOUNT] [Account A]
   [REVENUE] $X revenue
   [CHECK] 28% open rate
   [CHECK] Healthy deliverability
   [ZAP] Strong flow automation

2. [ACCOUNT] [Account B]
   [REVENUE] $X revenue
   [CHECK] 25% open rate
   [WARNING] Could improve flows

**Mid-Range (Tier 2):**
3. [ACCOUNT] [Account C]
   [TREND] Growing steadily
   [WARNING] Below benchmark open rates
   [TIP] Opportunity: optimize send times

**Needs Attention (Tier 3):**
4. [ACCOUNT] [Account D]
   [DOWN] Revenue declining 15%
   [ERROR] Deliverability issues
   [WARNING] Missing key flows
   [QUICK] Priority actions required

**Performance Rankings:**
- Revenue: [List accounts ranked]
- Engagement: [List accounts ranked]
- Growth: [List accounts ranked]
- Automation: [List accounts ranked]

**Strategic Recommendations:**
[TIP] Replicate [Account A] strategy to [Account D]
[QUICK] Fix deliverability issues in [Account D] immediately
[GOAL] Bring all accounts to Tier 1 within 90 days
[SEARCH] Deep dive into [Account C] campaign strategy
```

---

## PROMPT INTEGRATION RULES

### When to Use Each Tab's Context

1. **Revenue Tab Context** - Use when:
   - User mentions "revenue", "money", "sales", "AOV"
   - Comparing financial performance
   - Asking about growth or decline in dollars

2. **Campaigns Tab Context** - Use when:
   - User mentions "campaigns", "emails sent", "opens", "clicks"
   - Asking about subject lines, content, timing
   - Comparing engagement metrics

3. **Flows Tab Context** - Use when:
   - User mentions "flows", "automation", "abandoned cart", "welcome"
   - Asking about triggers, automated revenue
   - Comparing flow setup or performance

4. **Deliverability Tab Context** - Use when:
   - User mentions "bounces", "spam", "unsubscribes", "list health"
   - Asking about deliverability issues
   - Comparing list quality or growth

5. **Cross-Tab Context** - Use when:
   - User asks for "complete picture", "overall performance"
   - Comparing multiple metrics simultaneously
   - Strategic planning questions

### Response Length Guidelines

- **Simple queries** (1 metric): 3-5 bullet points
- **Account comparison** (2-3 accounts): 6-8 bullet points with rankings
- **Comprehensive analysis**: 10-12 bullet points across categories
- **Strategic planning**: Include goals, timeline, expected impact

### Always Include

1. **Specific numbers** from the visible data
2. **Account names** when comparing
3. **Actionable recommendations** (at least 1)
4. **Benchmarks** when available (industry averages)
5. **Icons** for visual structure ([CHECK], [WARNING], [TIP], etc.)
6. **Priority level** for actions (QUICK wins vs long-term goals)

---

## EXAMPLE INTERACTIONS

### Example 1: Revenue Comparison
**User:** "Which account makes the most money?"

**AI Response:**
```
Looking at your revenue across all accounts:

[REVENUE] Top earner: **Balmain** at **$45.2K** (38% of total revenue)
[REVENUE] Second: **Store B** at **$32.1K** (27% of total)
[REVENUE] Third: **Store C** at **$28.5K** (24% of total)

[TREND] Balmain growing +15% month-over-month
[CHECK] Average order value: $67 (highest in portfolio)
[EMAIL] 42% of revenue from automated flows

[TIP] Replicate Balmain's flow strategy to other accounts
[GOAL] Target: Bring Store B to $40K by next quarter
```

### Example 2: Campaign Performance
**User:** "How are my campaigns performing?"

**AI Response:**
```
Campaign performance across your accounts:

**Aggregate Metrics:**
[EMAIL] 47 campaigns sent this month
[CHECK] Average open rate: **23.8%** (above 21.3% benchmark)
[DOWN] Click rate: **2.1%** (below 2.6% benchmark)
[REVENUE] Total campaign revenue: **$89.4K**

**Account Breakdown:**
[CHECK] Balmain: 28% open rate, $32K revenue
[WARNING] Store B: 18% open rate, needs optimization
[CHECK] Store C: 25% open rate, strong engagement

**Send Time Analysis:**
[TIME] Tuesday 10 AM: Best performing (31% open rate)
[DOWN] Friday afternoon: Worst (15% open rate)

**Next Steps:**
[QUICK] Shift Store B sends to Tuesday mornings
[TIP] A/B test subject lines for accounts under 20% open rate
[GOAL] Target: 25% open rate across all accounts
```

### Example 3: Cross-Account Strategy
**User:** "What should I focus on to grow revenue?"

**AI Response:**
```
**Revenue Growth Strategy Across Accounts:**

**Biggest Opportunities:**

1. **Flow Automation (Quick Win - Expected +$15K/month)**
   [QUICK] Store B missing abandoned cart flow
   [QUICK] Store C welcome series only 2 emails (extend to 5)
   [REVENUE] Expected impact: +$12-18K monthly

2. **Campaign Optimization (Medium-term - Expected +$8K/month)**
   [TIP] Improve Store B open rates from 18% to 25%
   [TIP] Optimize send times (use Tuesday 10 AM)
   [REVENUE] Expected impact: +$6-10K monthly

3. **List Growth (Long-term - Expected +$20K/month)**
   [AUDIENCE] Store C growing at 50 subs/day (keep momentum)
   [WARNING] Store B flat growth - needs lead generation
   [GOAL] Double Store B list in 90 days

**Implementation Priority:**
[TIME] Week 1: Set up abandoned cart flows
[TIME] Week 2-3: Optimize campaign sends
[TIME] Week 4+: Focus on list growth

**Expected Total Impact: +$35-45K monthly within 90 days**
```

---

## TECHNICAL NOTES FOR AI IMPLEMENTATION

1. **Always reference the current tab** in responses
2. **Use exact metrics** from the aiState context
3. **Account names** should match exactly as shown in UI
4. **Color-code insights** with appropriate icons
5. **Time periods** should reference the selected date range
6. **Comparisons** should be relative to previous period or benchmarks
7. **Never make up numbers** - only use data from context
8. **Prioritize actionability** - every response needs next steps

---

This document serves as the comprehensive guide for AI responses across all multi-account reporting pages. Update system prompts to include the relevant tab context based on the current page.

# Multi-Store Per-Store Analysis Enhancement

## Problem
When agencies or users with multiple stores asked the AI chat questions about their performance, the AI would provide only **aggregated** insights across all stores. This wasn't helpful for agencies managing multiple clients who need **individual store breakdowns** to implement store-specific strategies.

### Example of Missing Functionality:
**User Question:** "How are my flows performing for the past 30 days?"

**Before (Aggregated Only):**
```
Total Flow Revenue: $156,420
Active Flows: 18
Average Conversion Rate: 3.8%
```

**After (Per-Store Breakdown):**
```
Flow Performance Across 3 Stores:

Store A: Acme Boutique
- Flow Revenue: $68,340 (43.7% of total)
- 7 active flows | Top: Abandoned Cart ($45.2K)
- [CHECK] All core flows performing well

Store B: Fashion Forward  
- Flow Revenue: $52,180 (33.4% of total)
- 6 active flows | Top: Welcome Series ($28.4K)
- [WARNING] Missing abandoned cart flow - add immediately

Store C: Trendy Threads
- Flow Revenue: $35,900 (23.0% of total)
- 5 active flows | Top: Win Back ($18.2K)
- [TIP] Add Welcome Series and Abandoned Cart
```

## Why This Matters

### For Agencies:
- **Each store is a different client** with unique needs
- **Different performance** requires different strategies
- **Actionable insights per client** - not just aggregate numbers
- **Identify gaps** - which stores are missing high-value flows/campaigns
- **Cross-store learning** - replicate winners across clients

### For Multi-Brand Companies:
- **Each store/brand has different audiences**
- **Different product strategies** need different marketing
- **Compare performance** across brands/regions
- **Budget allocation** - invest more in what works per store

## Solution Implemented

### File Modified
- `/app/api/chat/ai/route.js` - Enhanced system prompt (Lines 1048-1248)

### Changes Made

#### 1. Enhanced Account-Specific Analysis Instructions (Line 1048-1056)

**Added:**
```javascript
3. **Account-Specific Analysis (CRITICAL FOR AGENCIES):**
   - Users can ask about specific accounts by name
   - Users can ask about all accounts together
   - **When multiple accounts are selected, PROVIDE BOTH:**
     a) Aggregate insights across all stores
     b) **Individual breakdown for EACH store/account** (agencies need per-store data)
   - Highlight top-performing accounts and underperforming accounts
   - **Each store is UNIQUE** - agencies need actionable insights for each client
   - Format per-store data clearly with store names as headers
```

#### 2. Added Multi-Store Response Example (Line 1102-1135)

Provided a comprehensive example showing:
- Aggregate overview (total metrics)
- Individual store performance with specific metrics
- Store comparison insights
- Per-store recommendations with action items

**Example Structure:**
```markdown
**Aggregate Overview (All Stores Combined):**
- Total metrics across all stores

**Individual Store Performance:**

**Store 1: [Name]**
- Key metrics | Performance indicators
- [ICON] Actionable insight specific to this store

**Store 2: [Name]**
- Key metrics | Performance indicators
- [ICON] Store-specific recommendation

**Store Comparison Insights:**
- Cross-store trends
- Winners to replicate
- Gaps to address
```

#### 3. Campaign Page Multi-Store Instructions (Line 1165-1193)

**Added for Campaigns:**
- Aggregate campaign insights across stores
- Per-store campaign performance breakdown
- Store comparison (strongest/weakest performers)
- Actionable recommendations PER STORE

**Example Response Pattern:**
```
Campaign Performance Across 3 Stores:

**Store A: Acme Boutique**
- 18 campaigns | Open: 28.5% | Click: 3.4%
- [CHECK] Outperforming - replicate strategy

**Store B: Fashion Forward**
- 15 campaigns | Open: 24.2% | Click: 2.7%
- [GOAL] At benchmark - test urgency

**Store C: Trendy Threads**
- 12 campaigns | Open: 21.5% | Click: 2.1%
- [WARNING] Below benchmark - review segmentation
```

#### 4. Flow Page Multi-Store Instructions (Line 1208-1245)

**Added for Flows:**
- Aggregate flow performance
- Per-store flow analysis (flows perform differently per store)
- Flow gap analysis (which stores missing key flows)
- Store-specific recommendations

**Key Insights Enabled:**
- Identify which stores are missing high-value flows
- Compare same flow performance across stores
- Calculate revenue potential from missing flows
- Cross-store flow strategy replication

## Impact

### What AI Will Now Do:

#### When User Asks About Multiple Stores:

1. **First: Aggregate Overview**
   - Total metrics across all selected stores
   - Overall trends and performance

2. **Then: Individual Store Breakdowns**
   - Store name as header
   - Key metrics specific to that store
   - Performance vs benchmarks
   - Store-specific insights with icons

3. **Finally: Cross-Store Insights**
   - Which store is performing best/worst
   - Gaps to address per store
   - Strategies to replicate across stores
   - Revenue opportunities per store

#### Example Use Cases:

**Use Case 1: Agency with 5 Clients**
- Question: "How are my flows performing?"
- Response: Shows each client's flow performance individually
- Value: Can report to each client separately with their data

**Use Case 2: Multi-Brand Company**
- Question: "Show me campaign performance across all brands"
- Response: Breaks down by brand with comparisons
- Value: Identify which brand needs campaign optimization

**Use Case 3: Regional Stores**
- Question: "Which stores have the best email engagement?"
- Response: Ranks stores and explains why
- Value: Allocate marketing budget to best performers

## Data Already Available

The AI context (`build-system-context.js`) already includes:
- `allAccountsBreakdown` - Full metrics for ALL stores (Line 46-52)
- `selectedStores` - List of stores being analyzed
- `byAccount` - Per-account data from summaryData
- `timeSeriesByAccount` - Granular time series per store

**This enhancement teaches the AI HOW to USE this data effectively!**

## Expected Behavior Examples

### Example 1: Revenue Query
**User:** "What are my key findings for the past 90 days?"

**AI Response (NEW):**
```
Here's your performance across 4 stores:

**Aggregate Overview:**
- Total Revenue: $892,450
- Avg Attribution: 6.4%
- Total Orders: 3,748

**Individual Store Performance:**

**Store A: Premium Boutique**
- Revenue: $342,120 (38.3%)
- Attribution: 8.2% [CHECK] Leading performer
- [TIP] Replicate email strategy to other stores

**Store B: Budget Line**
- Revenue: $228,340 (25.6%)
- Attribution: 5.1% [GOAL] Below average
- [QUICK] Implement abandoned cart flow

**Store C: Accessories**
- Revenue: $186,990 (20.9%)
- Attribution: 6.8% [CHECK] Strong performance
- [TIP] Consider increasing send frequency

**Store D: Seasonal**
- Revenue: $135,000 (15.1%)
- Attribution: 4.9% [WARNING] Underperforming
- [WARNING] Review list health and segmentation
```

### Example 2: Flow Gap Analysis
**User:** "Are all my stores using abandoned cart flows?"

**AI Response (NEW):**
```
**Flow Gap Analysis Across Your Stores:**

**Stores WITH Abandoned Cart:**
- Store A: $45.2K revenue (4.5% conversion) [CHECK]
- Store C: $28.4K revenue (3.8% conversion) [CHECK]

**Stores MISSING Abandoned Cart:**
- Store B: [WARNING] High-priority - implement immediately
- Store D: [WARNING] Estimated potential: +$35K/month

**Recommendation:**
[QUICK] Implement abandoned cart flow in Stores B and D
- Use Store A's flow as template (highest performing)
- Estimated combined revenue impact: +$50K/month
```

### Example 3: Campaign Comparison
**User:** "Which store has the best campaign performance?"

**AI Response (NEW):**
```
**Campaign Performance Rankings:**

**1. Store A: Fashion Forward** [CHECK]
- Open Rate: 32.4% (54% above benchmark)
- Click Rate: 4.1% (58% above benchmark)
- Top Campaign: "Weekend Flash Sale" (42% open)
- [TIP] Share subject line strategy with other stores

**2. Store C: Trendy Boutique** [GOAL]
- Open Rate: 26.8% (28% above benchmark)
- Click Rate: 3.2% (23% above benchmark)
- [CHECK] Solid performance, room to reach Store A level

**3. Store B: Budget Basics** [WARNING]
- Open Rate: 19.2% (9% below benchmark)
- Click Rate: 2.1% (19% below benchmark)
- [WARNING] Review list quality and segmentation
- [QUICK] A/B test subject lines from Store A

**Key Insight:**
[REVENUE] Store A's campaign strategy could lift Store B's revenue by +$18K/month if replicated
```

## Testing Scenarios

### Test 1: Multi-Store Revenue Analysis ✅
**Input:** "How is my revenue doing?"
**Expected:** Aggregate + per-store breakdown + comparisons

### Test 2: Flow Gap Identification ✅
**Input:** "What flows should I implement?"
**Expected:** Per-store flow status + missing flows + revenue potential

### Test 3: Campaign Performance Comparison ✅
**Input:** "Which campaigns are performing best?"
**Expected:** Per-store campaign metrics + rankings + insights

### Test 4: Store-Specific Query ✅
**Input:** "How is Acme Boutique performing?"
**Expected:** Detailed analysis for just that store

### Test 5: Cross-Store Strategy ✅
**Input:** "What can Store B learn from Store A?"
**Expected:** Comparison + specific strategies to replicate

## Benefits Summary

### For Users:
- ✅ See individual store performance, not just totals
- ✅ Get store-specific actionable recommendations
- ✅ Identify which stores need attention
- ✅ Compare stores to find best practices

### For Agencies:
- ✅ Report to each client with their specific data
- ✅ Identify cross-client opportunities
- ✅ Prioritize which clients need help
- ✅ Demonstrate value per client

### For Multi-Brand Companies:
- ✅ Compare brand/region performance
- ✅ Allocate budget based on performance
- ✅ Replicate winning strategies across brands
- ✅ Identify underperforming brands needing investment

## Implementation Notes

- ✅ No changes to data structure (uses existing context)
- ✅ No API changes required
- ✅ Only prompt engineering enhancements
- ✅ Works with existing AI models (Sonnet, Haiku)
- ✅ Backward compatible (still works for single store)

## Next Steps

1. **Test with real multi-store data**
2. **Gather agency feedback**
3. **Add visual store comparisons** (charts showing store rankings)
4. **Export per-store reports** (individual PDFs per client)

---

**Status:** ✅ IMPLEMENTED
**Impact:** HIGH - Critical for agencies and multi-brand users
**Risk:** LOW - Prompt-only change, easily reversible

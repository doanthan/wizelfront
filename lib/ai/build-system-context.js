/**
 * Build System Context for Haiku Tier Detection
 * Generates formatted context string based on current page and AI state
 */

import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

/**
 * Build system context for Dashboard page
 */
export function buildDashboardSystemContext(aiState) {
  if (!aiState || aiState.pageType !== 'dashboard') {
    return null;
  }

  // ✅ NEW: Use summaryData structure instead of old metrics/byAccount
  const { selectedStores, dateRange, summaryData, performanceChart, userAccessStores, rawData } = aiState;

  // Extract dashboard metrics from summaryData
  const dashboard = summaryData?.dashboard || {};
  const byAccount = summaryData?.byAccount || rawData?.byAccount || [];
  const campaigns = summaryData?.campaigns || {};
  const timeSeries = summaryData?.timeSeries || rawData?.timeSeries || [];
  const timeSeriesByAccount = rawData?.timeSeriesByAccount || [];

  // Format ALL selected stores with klaviyo_public_id
  const selectedStoresList = selectedStores?.length > 0
    ? selectedStores.map((s, i) => `  ${i + 1}. ${s.label} (Store ID: ${s.value}, Klaviyo ID: ${s.klaviyo_id || 'Not Connected'})`).join('\n')
    : '  No stores selected';

  // Format ALL user access stores
  const userAccessStoresList = userAccessStores?.length > 0
    ? userAccessStores.map((s, i) => `  ${i + 1}. ${s.storeName} (Store ID: ${s.storePublicId}, Klaviyo ID: ${s.klaviyoPublicId || 'Not Connected'})`).join('\n')
    : '  No stores available';

  // ✅ NEW: Format visible metrics from summaryData.dashboard
  const visibleMetrics = [
    `  - Total Revenue: ${formatCurrency(dashboard.totalRevenue || 0)} (${dashboard.revenueChange >= 0 ? '+' : ''}${dashboard.revenueChange?.toFixed(1) || 0}%)`,
    `  - Attributed Revenue: ${formatCurrency(dashboard.attributedRevenue || 0)}`,
    `  - Total Orders: ${formatNumber(dashboard.totalOrders || 0)} (${dashboard.ordersChange >= 0 ? '+' : ''}${dashboard.ordersChange?.toFixed(1) || 0}%)`,
    `  - Active Customers: ${formatNumber(dashboard.uniqueCustomers || 0)} (${dashboard.customersChange >= 0 ? '+' : ''}${dashboard.customersChange?.toFixed(1) || 0}%)`,
    `  - Average Order Value: ${formatCurrency(dashboard.avgOrderValue || 0)}`
  ].join('\n');

  // ✅ NEW: Format ALL stores from summaryData.byAccount
  const allAccountsBreakdown = byAccount?.map((acc, i) => {
    const recipientBreakdown = acc.emailRecipients && acc.smsRecipients
      ? ` (${formatNumber(acc.emailRecipients)} emails + ${formatNumber(acc.smsRecipients)} SMS)`
      : '';
    const storeName = acc.name || acc.storeName || 'Unknown Store';
    return `  ${i + 1}. ${storeName}: ${formatCurrency(acc.revenue || 0)} (${formatNumber(acc.orders || 0)} orders)\n     Recipients: ${formatNumber(acc.recipients || 0)}${recipientBreakdown}\n     Open Rate: ${formatPercentage(acc.openRate || 0)}, Click Rate: ${formatPercentage(acc.clickRate || 0)}, CTOR: ${formatPercentage(acc.ctor || 0)}\n     Rev/Recipient: ${formatCurrency(acc.revenuePerRecipient || 0)}, AOV: ${formatCurrency(acc.avgOrderValue || 0)}`;
  }).join('\n') || '  No store data available';

  // ✅ NEW: Format campaigns from summaryData.campaigns or rawData
  const recentCampaignsData = rawData?.campaigns || [];
  const allRecentCampaignsList = recentCampaignsData?.map((c, i) => {
    const sendDate = c.send_time ? new Date(c.send_time).toLocaleDateString() : 'N/A';
    const stats = c.statistics || {};
    return `  ${i + 1}. "${c.campaign_name}" - ${c.send_channel} - ${sendDate}\n     Recipients: ${formatNumber(stats.recipients || 0)} | Opens: ${formatPercentage(stats.open_rate || 0)} | Clicks: ${formatPercentage(stats.click_rate || 0)} | Revenue: ${formatCurrency(stats.conversion_value || 0)}`;
  }).join('\n') || '  No recent campaigns';

  // Format ALL upcoming campaigns (not limited)
  const upcomingCampaignsData = rawData?.upcomingCampaigns || [];
  const allUpcomingCampaignsList = upcomingCampaignsData?.map((c, i) => {
    const sendDate = c.send_time ? new Date(c.send_time).toLocaleDateString() : 'N/A';
    return `  ${i + 1}. "${c.campaign_name}" - ${c.send_channel} - Scheduled: ${sendDate}`;
  }).join('\n') || '  No upcoming campaigns scheduled';

  // Format available performance metrics
  const availableMetricsList = performanceChart?.availableMetrics?.map(m => `    - ${m.label}`).join('\n') || '    - Total Revenue\n    - Orders\n    - Customers';

  // Format time series by account data (granular data for each store over time)
  const timeSeriesByAccountSummary = timeSeriesByAccount?.length > 0
    ? (() => {
        // Group by klaviyo_public_id to get unique stores
        const storeDataMap = {};
        timeSeriesByAccount.forEach(row => {
          if (!storeDataMap[row.klaviyo_public_id]) {
            storeDataMap[row.klaviyo_public_id] = {
              klaviyoId: row.klaviyo_public_id,
              dataPoints: 0,
              dateRange: { first: row.date, last: row.date }
            };
          }
          storeDataMap[row.klaviyo_public_id].dataPoints += 1;
          storeDataMap[row.klaviyo_public_id].dateRange.last = row.date;
        });

        // Build summary string
        const storeSummaries = Object.values(storeDataMap).map((store, i) =>
          `  ${i + 1}. Klaviyo ID: ${store.klaviyoId} - ${store.dataPoints} data points (${store.dateRange.first} to ${store.dateRange.last})`
        );

        return `  Total Data Points: ${timeSeriesByAccount.length}\n  Stores with Time Series Data: ${Object.keys(storeDataMap).length}\n${storeSummaries.join('\n')}\n  Fields per data point: date, klaviyo_public_id, revenue, attributedRevenue, orders, customers, aov, openRate, clickRate`;
      })()
    : '  No by-account time series data available';

  // Determine if data is for full year or custom range
  // ✅ NEW: Changed from daysDuration to daysSpan
  const daysDuration = dateRange?.daysSpan || dateRange?.daysDuration || 0;
  const isFullYear = daysDuration >= 350 && daysDuration <= 380;
  const isCustomRange = dateRange?.preset === 'custom';
  const tierGuidance = isFullYear || (isCustomRange && daysDuration > 90)
    ? '\n⚠️ NOTE: This data covers MORE than 90 days. User questions about other time periods will likely require TIER 2 (ClickHouse).'
    : '\n✅ NOTE: This data covers the selected period. Questions within this timeframe can use TIER 1 (on-screen context).';


  // Build the system context string
  return `<system_context>
You are a reporting assistant helping users understand their e-commerce and email marketing data.

<current_page>
Page: Dashboard Overview
Date Range: ${dateRange?.formatted || 'N/A'} (${daysDuration} days)${tierGuidance}
${dateRange?.comparison ? `Comparison Period: ${dateRange.comparison.formatted}` : ''}
Viewing: All Accounts (${selectedStores?.length || 0} stores selected)
</current_page>

<visible_data>
The user can currently see on their dashboard:

KPI CARDS (4 cards with period-over-period comparisons):
${visibleMetrics}

ACCOUNT PERFORMANCE TABLE (ALL stores with full metrics):
${allAccountsBreakdown}

SELECTED STORES (stores currently being analyzed):
${selectedStoresList}

USER ACCESS STORES (all stores user has analytics access to):
${userAccessStoresList}

PERFORMANCE OVER TIME CHART:
  Current View: ${performanceChart?.currentView === 'by-account' ? 'By Account (separate lines per store)' : 'Aggregate (all stores combined)'}
  Current Metric: ${performanceChart?.currentMetric || 'revenue'}
  Available Metrics (dropdown options):
${availableMetricsList}

  Aggregate Time Series: ${timeSeries?.length || 0} data points (full date range)
  - Fields: date, revenue, attributedRevenue, orders, customers, aov, openRate, clickRate

  By-Account Time Series (granular data per store over time):
${timeSeriesByAccountSummary}

RECENT CAMPAIGNS (past 14 days, ALL campaigns sent):
  Total Campaigns: ${recentCampaignsData?.length || 0}
${allRecentCampaignsList}

UPCOMING CAMPAIGNS (ALL scheduled campaigns):
  Total Scheduled: ${upcomingCampaignsData?.length || 0}
${allUpcomingCampaignsList}
</visible_data>

<available_tools>
You have access to:
- clickhouse_query: Query detailed historical analytics (campaigns, flows, customer segments, products, revenue trends)
- klaviyo_mcp: Query real-time Klaviyo data (current segments, active flows, live subscriber counts, account settings)
</available_tools>

<instructions>
1. TIER 1 (Instant): First try to answer using <visible_data> if the information is available on screen
2. TIER 2 (Analysis): If the user needs deeper analysis, historical trends, comparisons, or data not visible, use clickhouse_query
3. TIER 3 (Real-time): If the user asks about current state ("right now", "active", "how many profiles"), use klaviyo_mcp
4. Always specify account context when querying (use store names from SELECTED STORES list)
5. Be conversational and proactive - suggest related insights
6. When showing numbers, maintain consistency with what's visible on screen
7. For multi-store queries, reference stores by their names (e.g., "Store A", "My Main Store")
8. All campaigns from past 14 days are visible - no need to query for campaign lists within this timeframe
9. All stores and their metrics are visible - use SELECTED STORES for current analysis, USER ACCESS STORES for full store list
</instructions>

<context_notes>
- Dashboard shows AGGREGATED metrics across ALL selected stores
- By-account breakdown shows ALL stores (not limited to top 5)
- Period comparisons show % change vs previous period
- Users may ask about specific stores by name - match against SELECTED STORES or USER ACCESS STORES lists
- Store IDs are provided for both internal (Store ID) and Klaviyo (Klaviyo ID) references
- All granular data powering tables and charts is included in this context
- Recent campaigns include ALL campaigns from past 14 days (not limited to 5)
- Time series includes full date range data (not just last 30 days)
</context_notes>
</system_context>`;
}

/**
 * Build system context for Multi-Account Reporting page
 */
export function buildMultiAccountReportingSystemContext(aiState) {
  if (!aiState || aiState.pageType !== 'campaigns' && aiState.pageType !== 'revenue') {
    return null;
  }

  const { selectedStores, dateRange, revenue, campaigns } = aiState;

  const storesList = selectedStores?.length > 0
    ? selectedStores.map((s, i) => `  ${i + 1}. ${s.label} (ID: ${s.value})`).join('\n')
    : '  All Accounts';

  // For revenue page
  if (aiState.pageType === 'revenue' && revenue) {
    const revenueMetrics = [
      `  - Overall Revenue: ${formatCurrency(revenue.overall_revenue || 0)}`,
      `  - Attributed Revenue: ${formatCurrency(revenue.attributed_revenue || 0)}`,
      `  - Total Orders: ${formatNumber(revenue.total_orders || 0)}`,
      `  - Average Order Value: ${formatCurrency(revenue.avg_order_value || 0)}`,
      `  - Attribution Rate: ${formatPercentage(revenue.attribution_rate || 0)}`
    ].join('\n');

    return `<system_context>
You are a reporting assistant helping users understand their e-commerce revenue and attribution data.

<current_page>
Page: Multi-Account Revenue Report
Accounts: ${selectedStores?.map(s => s.label).join(', ') || 'All Accounts'}
Date Range: ${dateRange?.formatted || 'N/A'}
</current_page>

<visible_data>
The user can currently see:

REVENUE METRICS:
${revenueMetrics}

SELECTED STORES:
${storesList}

REVENUE BY PERIOD CHART:
- Shows revenue trends over time by account or aggregate
- Includes overall revenue and attributed revenue (from campaigns/flows)
</visible_data>

<available_tools>
- clickhouse_query: Detailed revenue analysis, attribution breakdowns, customer segments
- klaviyo_mcp: Real-time campaign and flow data
</available_tools>

<instructions>
1. Answer from <visible_data> first when possible (TIER 1)
2. Use clickhouse_query for deeper revenue analysis (TIER 2)
3. Use klaviyo_mcp for real-time campaign/flow data (TIER 3)
4. Focus on revenue attribution, trends, and insights
</instructions>
</system_context>`;
  }

  // For campaigns page
  if (aiState.pageType === 'campaigns' && campaigns) {
    const topCampaigns = campaigns?.slice(0, 5).map((c, i) =>
      `  ${i + 1}. "${c.campaign_name}": ${formatCurrency(c.revenue || 0)} revenue, ${formatPercentage(c.open_rate || 0)} open rate`
    ).join('\n') || '  No campaigns visible';

    return `<system_context>
You are a reporting assistant helping users understand their email and SMS campaign performance.

<current_page>
Page: Multi-Account Campaign Performance
Accounts: ${selectedStores?.map(s => s.label).join(', ') || 'All Accounts'}
Date Range: ${dateRange?.formatted || 'N/A'}
</current_page>

<visible_data>
The user can currently see:

TOP CAMPAIGNS (by revenue):
${topCampaigns}

SELECTED STORES:
${storesList}

CAMPAIGN METRICS VISIBLE:
- Campaign names, send dates, channels (email/SMS)
- Revenue, open rates, click rates, conversion rates
- Recipients, deliverability metrics
</visible_data>

<available_tools>
- clickhouse_query: Detailed campaign analysis, performance comparisons, historical trends
- klaviyo_mcp: Real-time campaign configurations, upcoming campaigns
</available_tools>

<instructions>
1. Answer from <visible_data> for campaigns shown on screen (TIER 1)
2. Use clickhouse_query for campaign analysis beyond visible data (TIER 2)
3. Use klaviyo_mcp for upcoming campaigns or current campaign settings (TIER 3)
</instructions>
</system_context>`;
  }

  return null;
}

/**
 * Build system context for Calendar page
 */
export function buildCalendarSystemContext(aiState) {
  if (!aiState || aiState.pageType !== 'calendar') {
    return null;
  }

  const { selectedStores, dateRange, recentCampaigns, upcomingCampaigns } = aiState;

  const recentList = recentCampaigns?.slice(0, 5).map((c, i) =>
    `  ${i + 1}. "${c.campaign_name}" - ${c.send_channel} - Sent: ${new Date(c.send_time).toLocaleDateString()}`
  ).join('\n') || '  No recent campaigns';

  const upcomingList = upcomingCampaigns?.slice(0, 5).map((c, i) =>
    `  ${i + 1}. "${c.campaign_name}" - ${c.send_channel} - Scheduled: ${new Date(c.send_time).toLocaleDateString()}`
  ).join('\n') || '  No upcoming campaigns';

  return `<system_context>
You are a reporting assistant helping users plan and review their marketing calendar.

<current_page>
Page: Marketing Calendar
Accounts: ${selectedStores?.map(s => s.label).join(', ') || 'All Accounts'}
Viewing: ${dateRange?.formatted || 'Current month'}
</current_page>

<visible_data>
The user can currently see:

RECENT CAMPAIGNS (last 5 sent):
${recentList}

UPCOMING CAMPAIGNS (next 5 scheduled):
${upcomingList}

CALENDAR VIEW:
- Visual calendar showing campaign send dates
- Color-coded by campaign type (email/SMS)
- Click on dates to see campaign details
</visible_data>

<available_tools>
- clickhouse_query: Historical campaign performance, trend analysis
- klaviyo_mcp: Real-time campaign schedules, draft campaigns, upcoming sends
</available_tools>

<instructions>
1. Answer about visible recent/upcoming campaigns from <visible_data> (TIER 1)
2. Use clickhouse_query for historical campaign analysis (TIER 2)
3. Use klaviyo_mcp for real-time campaign schedules and drafts (TIER 3)
4. Suggest scheduling gaps and optimal send times based on data
</instructions>
</system_context>`;
}

/**
 * Main function to build system context based on page type
 */
export function buildSystemContext(aiState) {
  if (!aiState || !aiState.pageType) {
    return null;
  }

  switch (aiState.pageType) {
    case 'dashboard':
      return buildDashboardSystemContext(aiState);
    case 'revenue':
    case 'campaigns':
    case 'flows':
    case 'deliverability':
      return buildMultiAccountReportingSystemContext(aiState);
    case 'calendar':
      return buildCalendarSystemContext(aiState);
    default:
      return null;
  }
}

/**
 * Format system context for display in dev tab
 * Returns a more human-readable version
 */
export function formatSystemContextForDisplay(aiState) {
  const context = buildSystemContext(aiState);
  if (!context) return 'No context available';

  // Return the raw context - it's already well-formatted
  return context;
}

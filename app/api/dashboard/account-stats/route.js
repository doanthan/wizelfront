import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import { getClickHouseClient } from "@/lib/clickhouse";

/**
 * Account Statistics API - Per-account metrics for dashboard table
 * Fetches detailed statistics for each account from ClickHouse
 */

// Format date for ClickHouse (YYYY-MM-DD)
const formatDate = (date) => {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const User = require('@/models/User').default;
    const user = await User.findOne({ email: session.user.email });
    const isSuperAdmin = user?.is_super_user === true;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const requestedStoreIds = searchParams.get('stores')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const compareStartDate = searchParams.get('compareStartDate');
    const compareEndDate = searchParams.get('compareEndDate');

    console.log('📊 Account Stats API Request:', {
      timestamp: new Date().toISOString(),
      requestedStoreIds,
      dateRange: { startDate, endDate },
      comparison: { compareStartDate, compareEndDate },
      isSuperAdmin
    });

    // Determine which stores to fetch based on user permissions
    let stores = [];

    if (requestedStoreIds.length === 0) {
      return NextResponse.json({ accounts: [] });
    }

    // Get specific requested stores (but verify permissions)
    let storeQuery = {
      public_id: { $in: requestedStoreIds },
      is_deleted: { $ne: true }
    };

    if (!isSuperAdmin) {
      // For regular users, verify they have access via ContractSeat
      const ContractSeat = require('@/models/ContractSeat').default;

      const userSeats = await ContractSeat.find({
        user_id: user._id,
        status: 'active'
      }).lean();

      let accessibleStoreIds = [];
      for (const seat of userSeats) {
        if (!seat.store_access || seat.store_access.length === 0) {
          // Empty store_access means access to ALL stores in the contract
          const contractStores = await Store.find({
            contract_id: seat.contract_id,
            public_id: { $in: requestedStoreIds },
            is_deleted: { $ne: true }
          }).select('_id').lean();

          accessibleStoreIds.push(...contractStores.map(s => s._id));
        } else {
          // Check specific store access
          const specificStores = await Store.find({
            _id: { $in: seat.store_access },
            public_id: { $in: requestedStoreIds },
            is_deleted: { $ne: true }
          }).select('_id').lean();

          accessibleStoreIds.push(...specificStores.map(s => s._id));
        }
      }

      // Remove duplicates and update query
      accessibleStoreIds = [...new Set(accessibleStoreIds.map(id => id.toString()))];
      storeQuery._id = { $in: accessibleStoreIds };
    }

    stores = await Store.find(storeQuery)
      .select('public_id name klaviyo_integration')
      .lean();

    console.log('📊 Accessible stores found:', stores.length);

    // Extract klaviyo public IDs
    const storeMap = new Map();
    stores.forEach(store => {
      if (store.klaviyo_integration?.public_id) {
        storeMap.set(store.klaviyo_integration.public_id, {
          storePublicId: store.public_id,
          storeName: store.name,
          hasKlaviyo: true
        });
      } else {
        // Store without Klaviyo integration - return empty stats
        storeMap.set(store.public_id, {
          storePublicId: store.public_id,
          storeName: store.name,
          hasKlaviyo: false
        });
      }
    });

    const klaviyoPublicIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    if (klaviyoPublicIds.length === 0) {
      // Return stores with empty stats
      const accounts = Array.from(storeMap.values()).map(store => ({
        ...store,
        emailsSent: 0,
        smsSent: 0,
        opens: 0,
        clicks: 0,
        openRate: 0,
        clickRate: 0,
        revenue: 0,
        orders: 0,
        aov: 0,
        revenuePerRecipient: 0
      }));

      return NextResponse.json({ accounts });
    }

    // Fetch statistics from ClickHouse
    const accountStats = await fetchAccountStatistics(
      klaviyoPublicIds,
      storeMap,
      { start: startDate, end: endDate },
      { start: compareStartDate, end: compareEndDate }
    );

    return NextResponse.json({ accounts: accountStats });
  } catch (error) {
    console.error('Account Stats API Error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to fetch account statistics', details: error.message },
      { status: 500 }
    );
  }
}

async function fetchAccountStatistics(klaviyoPublicIds, storeMap, dateRange, comparisonRange) {
  const client = getClickHouseClient();

  // Format dates for ClickHouse
  const currentStart = formatDate(dateRange.start) || formatDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const currentEnd = formatDate(dateRange.end) || formatDate(new Date());
  const compareStart = formatDate(comparisonRange?.start);
  const compareEnd = formatDate(comparisonRange?.end);

  console.log('🔍 Fetching account stats from ClickHouse:', {
    klaviyoIds: klaviyoPublicIds,
    currentPeriod: { currentStart, currentEnd },
    comparisonPeriod: { compareStart, compareEnd }
  });

  const klaviyoIdList = klaviyoPublicIds.map(id => `'${id}'`).join(',');

  try {
    // Query account_metrics_daily for per-account statistics with comparison
    const accountStatsQuery = `
      WITH
      current_period AS (
        SELECT
          klaviyo_public_id,
          sum(email_delivered + email_recipients) as emails_sent,
          sum(sms_delivered + sms_recipients) as sms_sent,
          sum(email_opens) as opens,
          sum(email_clicks + sms_clicks) as clicks,
          sum(total_revenue) as revenue,
          sum(attributed_revenue) as attributed_revenue,
          sum(total_orders) as orders,
          if(sum(total_orders) > 0, sum(total_revenue) / sum(total_orders), 0) as aov,
          if(sum(email_delivered) > 0, (sum(email_opens) * 100.0 / sum(email_delivered)), 0) as open_rate,
          if(sum(email_delivered) > 0, (sum(email_clicks) * 100.0 / sum(email_delivered)), 0) as click_rate,
          if(sum(email_opens) > 0, (sum(email_clicks) * 100.0 / sum(email_opens)), 0) as ctor,
          if((sum(email_delivered) + sum(sms_delivered)) > 0,
             sum(total_revenue) / (sum(email_delivered) + sum(sms_delivered)),
             0) as revenue_per_recipient
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoIdList})
          AND date >= '${currentStart}'
          AND date <= '${currentEnd}'
        GROUP BY klaviyo_public_id
      ),
      comparison_period AS (
        SELECT
          klaviyo_public_id,
          sum(email_delivered + email_recipients) as emails_sent,
          sum(sms_delivered + sms_recipients) as sms_sent,
          sum(email_opens) as opens,
          sum(email_clicks + sms_clicks) as clicks,
          sum(total_revenue) as revenue,
          sum(attributed_revenue) as attributed_revenue,
          sum(total_orders) as orders,
          if(sum(total_orders) > 0, sum(total_revenue) / sum(total_orders), 0) as aov,
          if(sum(email_delivered) > 0, (sum(email_opens) * 100.0 / sum(email_delivered)), 0) as open_rate,
          if(sum(email_delivered) > 0, (sum(email_clicks) * 100.0 / sum(email_delivered)), 0) as click_rate,
          if(sum(email_opens) > 0, (sum(email_clicks) * 100.0 / sum(email_opens)), 0) as ctor,
          if((sum(email_delivered) + sum(sms_delivered)) > 0,
             sum(total_revenue) / (sum(email_delivered) + sum(sms_delivered)),
             0) as revenue_per_recipient
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoIdList})
          ${compareStart && compareEnd ? `AND date >= '${compareStart}' AND date <= '${compareEnd}'` : 'AND 0=1'}
        GROUP BY klaviyo_public_id
      )
      SELECT
        c.klaviyo_public_id,
        c.emails_sent,
        c.sms_sent,
        c.opens,
        c.clicks,
        c.revenue,
        c.attributed_revenue,
        c.orders,
        c.aov,
        c.open_rate,
        c.click_rate,
        c.ctor,
        c.revenue_per_recipient,

        -- Previous period values
        p.revenue as previous_revenue,
        p.attributed_revenue as previous_attributed_revenue,
        p.emails_sent as previous_emails_sent,
        p.sms_sent as previous_sms_sent,
        p.opens as previous_opens,
        p.clicks as previous_clicks,
        p.open_rate as previous_open_rate,
        p.click_rate as previous_click_rate,
        p.ctor as previous_ctor,
        p.revenue_per_recipient as previous_revenue_per_recipient,

        -- Percentage changes
        if(p.revenue > 0, ((c.revenue - p.revenue) * 100.0 / p.revenue), if(c.revenue > 0, 999999, 0)) as revenue_change,
        if(p.attributed_revenue > 0, ((c.attributed_revenue - p.attributed_revenue) * 100.0 / p.attributed_revenue), if(c.attributed_revenue > 0, 999999, 0)) as attributed_revenue_change,
        if(p.emails_sent > 0, ((c.emails_sent - p.emails_sent) * 100.0 / p.emails_sent), if(c.emails_sent > 0, 999999, 0)) as emails_sent_change,
        if(p.sms_sent > 0, ((c.sms_sent - p.sms_sent) * 100.0 / p.sms_sent), if(c.sms_sent > 0, 999999, 0)) as sms_sent_change,
        if(p.open_rate > 0, ((c.open_rate - p.open_rate) * 100.0 / p.open_rate), 0) as open_rate_change,
        if(p.click_rate > 0, ((c.click_rate - p.click_rate) * 100.0 / p.click_rate), 0) as click_rate_change,
        if(p.ctor > 0, ((c.ctor - p.ctor) * 100.0 / p.ctor), 0) as ctor_change,
        if(p.revenue_per_recipient > 0, ((c.revenue_per_recipient - p.revenue_per_recipient) * 100.0 / p.revenue_per_recipient), if(c.revenue_per_recipient > 0, 999999, 0)) as revenue_per_recipient_change
      FROM current_period c
      LEFT JOIN comparison_period p ON c.klaviyo_public_id = p.klaviyo_public_id
      ORDER BY c.revenue DESC
    `;

    console.log('🚀 Executing account stats query with comparison...');
    const result = await client.query({
      query: accountStatsQuery,
      format: 'JSONEachRow'
    });

    const statsData = await result.json();

    console.log('✅ Account stats query results:', {
      accountCount: statsData.length
    });

    // Map results to store information
    const accounts = statsData.map(stat => {
      const storeInfo = storeMap.get(stat.klaviyo_public_id);
      return {
        storePublicId: storeInfo?.storePublicId,
        storeName: storeInfo?.storeName || 'Unknown Store',
        hasKlaviyo: storeInfo?.hasKlaviyo !== false,
        klaviyoPublicId: stat.klaviyo_public_id,
        emailsSent: parseInt(stat.emails_sent) || 0,
        smsSent: parseInt(stat.sms_sent) || 0,
        totalRecipients: (parseInt(stat.emails_sent) || 0) + (parseInt(stat.sms_sent) || 0),
        opens: parseInt(stat.opens) || 0,
        clicks: parseInt(stat.clicks) || 0,
        openRate: parseFloat(stat.open_rate) || 0,
        clickRate: parseFloat(stat.click_rate) || 0,
        revenue: parseFloat(stat.revenue) || 0,
        attributedRevenue: parseFloat(stat.attributed_revenue) || 0,
        orders: parseInt(stat.orders) || 0,
        aov: parseFloat(stat.aov) || 0,
        revenuePerRecipient: parseFloat(stat.revenue_per_recipient) || 0,
        ctor: parseFloat(stat.ctor) || 0,

        // Previous period values
        previousRevenue: parseFloat(stat.previous_revenue) || 0,
        previousAttributedRevenue: parseFloat(stat.previous_attributed_revenue) || 0,
        previousEmailsSent: parseInt(stat.previous_emails_sent) || 0,
        previousSmsSent: parseInt(stat.previous_sms_sent) || 0,
        previousOpens: parseInt(stat.previous_opens) || 0,
        previousClicks: parseInt(stat.previous_clicks) || 0,
        previousOpenRate: parseFloat(stat.previous_open_rate) || 0,
        previousClickRate: parseFloat(stat.previous_click_rate) || 0,
        previousCtor: parseFloat(stat.previous_ctor) || 0,
        previousRevenuePerRecipient: parseFloat(stat.previous_revenue_per_recipient) || 0,

        // Percentage changes (capped at 999% for display purposes)
        revenueChange: Math.min(parseFloat(stat.revenue_change) || 0, 999),
        attributedRevenueChange: Math.min(parseFloat(stat.attributed_revenue_change) || 0, 999),
        emailsSentChange: Math.min(parseFloat(stat.emails_sent_change) || 0, 999),
        smsSentChange: Math.min(parseFloat(stat.sms_sent_change) || 0, 999),
        openRateChange: parseFloat(stat.open_rate_change) || 0,
        clickRateChange: parseFloat(stat.click_rate_change) || 0,
        ctorChange: parseFloat(stat.ctor_change) || 0,
        revenuePerRecipientChange: Math.min(parseFloat(stat.revenue_per_recipient_change) || 0, 999)
      };
    });

    // Add stores without data (no Klaviyo or no data in period)
    storeMap.forEach((storeInfo, klaviyoId) => {
      if (!accounts.find(a => a.klaviyoPublicId === klaviyoId)) {
        accounts.push({
          storePublicId: storeInfo.storePublicId,
          storeName: storeInfo.storeName,
          hasKlaviyo: storeInfo.hasKlaviyo,
          klaviyoPublicId: klaviyoId,
          emailsSent: 0,
          smsSent: 0,
          totalRecipients: 0,
          opens: 0,
          clicks: 0,
          openRate: 0,
          clickRate: 0,
          revenue: 0,
          attributedRevenue: 0,
          orders: 0,
          aov: 0,
          revenuePerRecipient: 0,
          ctor: 0,
          previousRevenue: 0,
          previousAttributedRevenue: 0,
          previousEmailsSent: 0,
          previousSmsSent: 0,
          previousOpens: 0,
          previousClicks: 0,
          previousOpenRate: 0,
          previousClickRate: 0,
          previousCtor: 0,
          previousRevenuePerRecipient: 0,
          revenueChange: 0,
          attributedRevenueChange: 0,
          emailsSentChange: 0,
          smsSentChange: 0,
          openRateChange: 0,
          clickRateChange: 0,
          ctorChange: 0,
          revenuePerRecipientChange: 0
        });
      }
    });

    return accounts;
  } catch (error) {
    console.error('ClickHouse Account Stats Query Error:', error);
    throw error;
  }
}

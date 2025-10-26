import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Store from "@/models/Store";
import { getClickHouseClient } from "@/lib/clickhouse";
import { formatCurrency, formatNumber, formatPercentage, formatPercentageChange } from "@/lib/utils";

/**
 * Multi-Account Revenue Dashboard API - Pure ClickHouse Implementation
 * Fetches all revenue metrics and trends from ClickHouse using account_metrics_daily table
 * v4 - Complete ClickHouse implementation following CLICKHOUSE_TABLES_COMPLETE_V2.md guide
 */

export async function GET(request) {
  try {
    console.log('Multi-account revenue API called');

    const session = await auth();
    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Session user:', session.user.email);

    await connectToDatabase();

    // Import User model to check super admin status
    const User = require('@/models/User').default;
    const user = await User.findOne({ email: session.user.email });
    const isSuperAdmin = user?.is_super_user === true;

    if (!user) {
      console.log('User not found for email:', session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('User found:', !!user, 'Is super admin:', isSuperAdmin);

    const { searchParams } = new URL(request.url);
    const storeIds = searchParams.get('storeIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const comparisonStartDate = searchParams.get('comparisonStartDate');
    const comparisonEndDate = searchParams.get('comparisonEndDate');
    const comparisonType = searchParams.get('comparisonType') || 'previous-period';
    const timeGranularity = searchParams.get('timeGranularity') || 'daily';

    console.log('📊 Multi-Account Revenue API Request Parameters:');
    console.log('  - storeIds:', storeIds);
    console.log('  - startDate:', startDate);
    console.log('  - endDate:', endDate);
    console.log('  - comparisonStartDate:', comparisonStartDate);
    console.log('  - comparisonEndDate:', comparisonEndDate);
    console.log('  - comparisonType:', comparisonType);
    console.log('  - timeGranularity:', timeGranularity);

    // If "all" is selected or no stores, get all stores for the user
    let klaviyoPublicIds = [];
    let stores = [];

    if (storeIds.length === 0 || storeIds.includes('all')) {
      // Get all stores based on user type
      if (isSuperAdmin) {
        // Super admin can see all stores
        stores = await Store.find({
          is_deleted: { $ne: true }
        }).select('klaviyo_integration.public_id name public_id').lean();
      } else {
        // Regular user - use ContractSeat system (same as Store API)
        const ContractSeat = require('@/models/ContractSeat').default;

        // Get user's active contract seats
        const userSeats = await ContractSeat.find({
          user_id: user._id,
          status: 'active'
        }).lean();

        console.log(`User has ${userSeats.length} active ContractSeats`);

        let accessibleStoreIds = [];

        for (const seat of userSeats) {
          console.log(`Checking seat for contract ${seat.contract_id}, store_access array length: ${seat.store_access?.length || 0}`);

          if (!seat.store_access || seat.store_access.length === 0) {
            // Empty store_access means access to ALL stores in the contract
            const contractStores = await Store.find({
              contract_id: seat.contract_id,
              is_deleted: { $ne: true }
            }).select('_id public_id name').lean();

            console.log(`Contract ${seat.contract_id} has ${contractStores.length} stores`);

            for (const store of contractStores) {
              console.log(`Store ${store.public_id}: hasAccess=true, store_access.length=${seat.store_access?.length || 0}`);
              accessibleStoreIds.push(store._id);
            }
          } else {
            // User has specific store access
            accessibleStoreIds.push(...seat.store_access);
          }
        }

        // Remove duplicates
        accessibleStoreIds = [...new Set(accessibleStoreIds.map(id => id.toString()))];

        console.log(`User stores found via ContractSeat system: ${accessibleStoreIds.length}`);

        if (accessibleStoreIds.length === 0) {
          console.log('No accessible stores found via ContractSeat system');
          stores = [];
        } else {
          stores = await Store.find({
            _id: { $in: accessibleStoreIds },
            is_deleted: { $ne: true }
          }).select('klaviyo_integration.public_id name public_id').lean();

          console.log(`Accessible store public_ids: [${stores.map(s => `'${s.public_id}'`).join(', ')}]`);
          console.log(`Returning stores: ${stores.length}`);
        }
      }

      // Log each store's Klaviyo integration status
      stores.forEach(store => {
        const hasKlaviyo = !!store.klaviyo_integration?.public_id;
        console.log(`Store ${store.public_id} (${store.name}): hasKlaviyo=${hasKlaviyo}, klaviyo_id=${store.klaviyo_integration?.public_id || 'none'}`);
      });

      klaviyoPublicIds = stores
        .filter(store => store.klaviyo_integration?.public_id)
        .map(store => store.klaviyo_integration.public_id);

      console.log(`Klaviyo public IDs found: [${klaviyoPublicIds.join(', ')}]`);
    } else {
      // Get specific stores - also need to use ContractSeat system for non-super admins
      let storeQuery = {
        public_id: { $in: storeIds },
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
              public_id: { $in: storeIds },
              is_deleted: { $ne: true }
            }).select('_id').lean();

            accessibleStoreIds.push(...contractStores.map(s => s._id));
          } else {
            // Check specific store access
            const specificStores = await Store.find({
              _id: { $in: seat.store_access },
              public_id: { $in: storeIds },
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
        .select('klaviyo_integration.public_id name public_id')
        .lean();

      klaviyoPublicIds = stores
        .filter(store => store.klaviyo_integration?.public_id)
        .map(store => store.klaviyo_integration.public_id);
    }

    if (klaviyoPublicIds.length === 0) {
      console.log('No klaviyo public IDs found - returning empty data structure');
      return NextResponse.json({
        stats: {
          overall_revenue: 0,
          attributed_revenue: 0,
          attribution_percentage: 0,
          total_orders: 0,
          avg_order_value: 0,
          unique_customers: 0,
          new_customers: 0,
          returning_customers: 0,
          total_email_revenue: 0,
          total_emails_sent: 0,
          revenue_per_email: 0,
          total_sms_revenue: 0,
          total_sms_sent: 0,
          revenue_per_sms: 0,
          total_channel_revenue: 0,
          total_recipients: 0,
          revenue_per_recipient: 0,
          revenue_change: 0,
          orders_change: 0,
          customers_change: 0
        },
        trends: [],
        accountComparison: [],
        channelRevenue: [],
        metadata: {
          storeCount: stores.length,
          message: "No stores with Klaviyo integration found",
          dateRange: {
            start: startDate || 'Last 90 days',
            end: endDate || 'Today'
          }
        }
      });
    }

    console.log('Found klaviyoPublicIds:', klaviyoPublicIds);
    console.log('📊 DEBUG: Date range details:');
    console.log('  - Start date:', startDate);
    console.log('  - End date:', endDate);
    console.log('  - Expected days:', startDate && endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1 : '~90 days');
    console.log('  - Number of accounts:', klaviyoPublicIds.length);

    const client = getClickHouseClient();
    console.log('ClickHouse client created');

    // Build date filters
    const mainDateFilter = startDate && endDate
      ? `AND date >= '${startDate}' AND date <= '${endDate}'`
      : `AND date >= today() - INTERVAL 90 DAY`;

    const comparisonDateFilter = comparisonStartDate && comparisonEndDate
      ? `AND date >= '${comparisonStartDate}' AND date <= '${comparisonEndDate}'`
      : `AND date >= today() - INTERVAL 180 DAY AND date < today() - INTERVAL 90 DAY`;

    console.log('📅 Date Filters:');
    console.log('  - Main period filter:', mainDateFilter);
    console.log('  - Comparison period filter:', comparisonDateFilter);

    // Use ClickHouse best practices - avoid subqueries with aggregations
    console.log('Building ClickHouse queries using best practices...');

    // Current Period Query - Use CTE to get latest metrics first, then aggregate
    const currentPeriodQuery = `
      WITH latest_metrics AS (
        SELECT *
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        ORDER BY date DESC, updated_at DESC
        LIMIT 1 BY klaviyo_public_id, date
      )
      SELECT
        SUM(total_revenue) as overall_revenue,
        SUM(campaign_revenue) as campaign_revenue,
        SUM(flow_revenue) as flow_revenue,
        SUM(total_orders) as total_orders,
        SUM(unique_customers) as unique_customers,
        SUM(new_customers) as new_customers,
        SUM(returning_customers) as returning_customers,
        SUM(email_revenue) as total_email_revenue,
        SUM(sms_revenue) as total_sms_revenue,
        SUM(push_revenue) as total_push_revenue,
        -- Separate aggregations - calculations will be done in JavaScript
        SUM(email_revenue) as sum_email_revenue,
        SUM(email_recipients) as sum_email_recipients,
        SUM(sms_revenue) as sum_sms_revenue,
        SUM(sms_recipients) as sum_sms_recipients,
        -- Provide individual sums for JavaScript calculations
        SUM(email_recipients) as total_emails_sent,
        SUM(sms_recipients) as total_sms_sent,
        SUM(push_recipients) as total_push_sent,
        COUNT(DISTINCT date) as days_in_period
      FROM latest_metrics
    `;

    console.log('🔍 Current Period Query:');
    console.log(currentPeriodQuery);

    // Add debug query to check for data duplication
    const debugQuery = `
      SELECT
        klaviyo_public_id,
        COUNT(*) as total_rows,
        COUNT(DISTINCT date) as unique_dates,
        MIN(date) as earliest_date,
        MAX(date) as latest_date,
        AVG(email_recipients) as avg_daily_email,
        AVG(sms_recipients) as avg_daily_sms
      FROM account_metrics_daily_latest
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        ${mainDateFilter}
      GROUP BY klaviyo_public_id
      ORDER BY klaviyo_public_id
    `;

    console.log('🔍 Debug Query for Data Investigation:');
    console.log(debugQuery);

    // Comparison Period Query - Use CTE pattern for consistency
    const comparisonPeriodQuery = `
      WITH previous_metrics AS (
        SELECT *
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${comparisonDateFilter}
        ORDER BY date DESC, updated_at DESC
        LIMIT 1 BY klaviyo_public_id, date
      )
      SELECT
        SUM(total_revenue) as previous_revenue,
        SUM(campaign_revenue) as previous_campaign_revenue,
        SUM(flow_revenue) as previous_flow_revenue,
        SUM(total_orders) as previous_orders,
        SUM(unique_customers) as previous_customers
      FROM previous_metrics
    `;

    // Revenue Trends Query - Use CTE for latest metrics, then aggregate by period
    const aggregationPeriod = timeGranularity === 'daily' ? 'toString(date)'
      : timeGranularity === 'weekly' ? 'toString(toStartOfWeek(date))'
      : 'toString(toStartOfMonth(date))';

    const revenueTrendQuery = `
      WITH latest_daily_metrics AS (
        SELECT *
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        ORDER BY date DESC, updated_at DESC
        LIMIT 1 BY klaviyo_public_id, date
      )
      SELECT
        ${aggregationPeriod} as period,
        SUM(total_revenue) as overall_revenue,
        SUM(campaign_revenue) as campaign_revenue,
        SUM(flow_revenue) as flow_revenue,
        SUM(email_revenue) as email_revenue,
        SUM(sms_revenue) as sms_revenue,
        SUM(push_revenue) as push_revenue
      FROM latest_daily_metrics
      GROUP BY period
      ORDER BY period ASC
    `;

    // Account Comparison Query - Simple aggregations only, calculations in JS
    const accountComparisonQuery = `
      WITH account_latest_metrics AS (
        SELECT *
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        ORDER BY date DESC, updated_at DESC
        LIMIT 1 BY klaviyo_public_id, date
      )
      SELECT
        klaviyo_public_id,
        COUNT(DISTINCT date) as days_with_data,
        SUM(total_revenue) as total_revenue,
        SUM(total_orders) as total_orders,
        SUM(unique_customers) as unique_customers,
        SUM(campaign_revenue) as campaign_revenue,
        SUM(flow_revenue) as flow_revenue,
        SUM(email_revenue) as email_revenue,
        SUM(sms_revenue) as sms_revenue,
        SUM(email_recipients) as email_recipients,
        SUM(sms_recipients) as sms_recipients,
        SUM(push_recipients) as push_recipients,
        SUM(new_customers) as new_customers_total,
        SUM(returning_customers) as returning_customers_total,
        SUM(campaigns_sent) as campaigns_sent,
        SUM(email_clicks) as email_clicks,
        SUM(email_delivered) as email_delivered
      FROM account_latest_metrics
      GROUP BY klaviyo_public_id
      ORDER BY total_revenue DESC
    `;

    // Channel Revenue Queries - Simple aggregations only, calculations in JS
    const emailChannelQuery = `
      WITH email_metrics AS (
        SELECT *
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        ORDER BY date DESC, updated_at DESC
        LIMIT 1 BY klaviyo_public_id, date
      )
      SELECT
        'Email' as channel,
        SUM(email_revenue) as revenue,
        SUM(email_recipients) as recipients,
        SUM(email_delivered) as delivered,
        SUM(email_clicks) as clicks
      FROM email_metrics
    `;

    const smsChannelQuery = `
      WITH sms_metrics AS (
        SELECT *
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        ORDER BY date DESC, updated_at DESC
        LIMIT 1 BY klaviyo_public_id, date
      )
      SELECT
        'SMS' as channel,
        SUM(sms_revenue) as revenue,
        SUM(sms_recipients) as recipients,
        SUM(sms_delivered) as delivered,
        SUM(sms_clicks) as clicks
      FROM sms_metrics
    `;

    const pushChannelQuery = `
      WITH push_metrics AS (
        SELECT *
        FROM account_metrics_daily_latest
        WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
          ${mainDateFilter}
        ORDER BY date DESC, updated_at DESC
        LIMIT 1 BY klaviyo_public_id, date
      )
      SELECT
        'Push' as channel,
        SUM(push_revenue) as revenue,
        SUM(push_recipients) as recipients,
        SUM(push_delivered) as delivered,
        SUM(push_clicks) as clicks
      FROM push_metrics
    `;

    // Execute all queries separately to avoid aggregation issues
    console.log('Executing ClickHouse queries...');

    // First run debug query to investigate data
    const debugResult = await client.query({ query: debugQuery, format: 'JSONEachRow' });
    const debugData = await debugResult.json();
    console.log('🔍 Debug Results - Data per Account:');
    debugData.forEach(account => {
      console.log(`  Account ${account.klaviyo_public_id}:`);
      console.log(`    - Total rows: ${account.total_rows}`);
      console.log(`    - Unique dates: ${account.unique_dates}`);
      console.log(`    - Date range: ${account.earliest_date} to ${account.latest_date}`);
      console.log(`    - Avg daily email: ${Math.round(account.avg_daily_email)}`);
      console.log(`    - Avg daily SMS: ${Math.round(account.avg_daily_sms)}`);
    });

    const [currentResult, comparisonResult, trendResult, accountResult, emailResult, smsResult, pushResult] = await Promise.all([
      client.query({ query: currentPeriodQuery, format: 'JSONEachRow' }),
      client.query({ query: comparisonPeriodQuery, format: 'JSONEachRow' }),
      client.query({ query: revenueTrendQuery, format: 'JSONEachRow' }),
      client.query({ query: accountComparisonQuery, format: 'JSONEachRow' }),
      client.query({ query: emailChannelQuery, format: 'JSONEachRow' }),
      client.query({ query: smsChannelQuery, format: 'JSONEachRow' }),
      client.query({ query: pushChannelQuery, format: 'JSONEachRow' })
    ]);

    const currentStats = await currentResult.json();
    const comparisonStats = await comparisonResult.json();
    const trends = await trendResult.json();
    const accountComparison = await accountResult.json();
    console.log('📊 Account Comparison Raw Data (first account):', accountComparison[0]);
    const emailChannel = await emailResult.json();
    const smsChannel = await smsResult.json();
    const pushChannel = await pushResult.json();

    // Combine channel results and sort by revenue, add calculations in JS
    const channelRevenue = [...emailChannel, ...smsChannel, ...pushChannel].map(channel => ({
      ...channel,
      revenue_per_recipient: (channel.recipients > 0) ? (channel.revenue / channel.recipients) : 0,
      delivery_rate_pct: (channel.recipients > 0) ? ((channel.delivered / channel.recipients) * 100) : 0
    })).sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

    // Calculate derived metrics in JavaScript (not ClickHouse)
    const attributed_revenue = (currentStats[0]?.campaign_revenue || 0) + (currentStats[0]?.flow_revenue || 0);

    // Recipients represent total message volume over the period (as per ClickHouse docs)
    // But we'll provide both total volume and average daily for context
    const days_in_period = parseInt(currentStats[0]?.days_in_period) || 1;
    const total_emails_sent = parseInt(currentStats[0]?.total_emails_sent) || 0;
    const total_sms_sent = parseInt(currentStats[0]?.total_sms_sent) || 0;
    const total_push_sent = parseInt(currentStats[0]?.total_push_sent) || 0;

    // Total message volume (what ClickHouse docs recommend) - NOW USING PROPER ADDITION
    const total_recipients = total_emails_sent + total_sms_sent + total_push_sent;

    // Average daily recipients (more intuitive for revenue per recipient)
    const avg_daily_recipients = total_recipients / days_in_period;

    // Calculate ratios safely
    const revenue_per_email = (currentStats[0]?.sum_email_recipients || 0) > 0
      ? (currentStats[0]?.sum_email_revenue || 0) / currentStats[0].sum_email_recipients
      : 0;

    const revenue_per_sms = (currentStats[0]?.sum_sms_recipients || 0) > 0
      ? (currentStats[0]?.sum_sms_revenue || 0) / currentStats[0].sum_sms_recipients
      : 0;

    // Combine current and comparison stats
    const stats = {
      ...currentStats[0],
      ...comparisonStats[0],
      // Calculate derived fields in JavaScript
      attributed_revenue: attributed_revenue,
      attribution_percentage: currentStats[0]?.overall_revenue > 0
        ? (attributed_revenue / currentStats[0].overall_revenue) * 100
        : 0,
      avg_order_value: currentStats[0]?.total_orders > 0
        ? (currentStats[0]?.overall_revenue || 0) / currentStats[0].total_orders
        : 0,
      // Recipients totals - show total message sends over period for "Revenue per Recipient"
      total_recipients: total_recipients,
      total_emails_sent: total_emails_sent,
      total_sms_sent: total_sms_sent,
      total_push_sent: total_push_sent,
      // Calculate ratios in JavaScript
      revenue_per_email: revenue_per_email,
      revenue_per_sms: revenue_per_sms,
      // Calculate revenue per recipient using total recipients over period
      revenue_per_recipient: total_recipients > 0 ? attributed_revenue / total_recipients : 0,
      // Calculate percentage changes
      revenue_change: comparisonStats[0]?.previous_revenue > 0
        ? ((currentStats[0]?.overall_revenue || 0) - (comparisonStats[0]?.previous_revenue || 0)) / comparisonStats[0].previous_revenue * 100
        : 0,
      orders_change: comparisonStats[0]?.previous_orders > 0
        ? ((currentStats[0]?.total_orders || 0) - (comparisonStats[0]?.previous_orders || 0)) / comparisonStats[0].previous_orders * 100
        : 0,
      customers_change: comparisonStats[0]?.previous_customers > 0
        ? ((currentStats[0]?.unique_customers || 0) - (comparisonStats[0]?.previous_customers || 0)) / comparisonStats[0].previous_customers * 100
        : 0,
      // Add attributed revenue change calculation
      attributed_revenue_change: ((comparisonStats[0]?.previous_campaign_revenue || 0) + (comparisonStats[0]?.previous_flow_revenue || 0)) > 0
        ? (attributed_revenue - ((comparisonStats[0]?.previous_campaign_revenue || 0) + (comparisonStats[0]?.previous_flow_revenue || 0))) / ((comparisonStats[0]?.previous_campaign_revenue || 0) + (comparisonStats[0]?.previous_flow_revenue || 0)) * 100
        : 0
    };

    console.log('📊 Query Results:');
    console.log('  - Overall Revenue:', currentStats[0]?.overall_revenue);
    console.log('  - Campaign Revenue:', currentStats[0]?.campaign_revenue);
    console.log('  - Days in period:', currentStats[0]?.days_in_period);
    console.log('  - Total emails sent (sum):', currentStats[0]?.total_emails_sent);
    console.log('  - Total SMS sent (sum):', currentStats[0]?.total_sms_sent);
    console.log('  - Total recipients (CORRECTED):', total_recipients);
    console.log('  - Average daily recipients:', Math.round(avg_daily_recipients));
    console.log('  - Breakdown:');
    console.log('    * Email recipients (total):', total_emails_sent, '→ daily avg:', Math.round(total_emails_sent / days_in_period));
    console.log('    * SMS recipients (total):', total_sms_sent, '→ daily avg:', Math.round(total_sms_sent / days_in_period));
    console.log('    * Push recipients (total):', total_push_sent, '→ daily avg:', Math.round(total_push_sent / days_in_period));
    console.log('  - Flow Revenue:', currentStats[0]?.flow_revenue);
    console.log('  - Total Orders:', currentStats[0]?.total_orders);
    console.log('  - Trends data points:', trends.length);
    console.log('  - Account comparison:', accountComparison.length);
    console.log('  - Channel revenue data:', channelRevenue.length);

    // Map klaviyo IDs back to store names for account comparison
    // Add JavaScript calculations that were previously done in SQL to avoid aggregation errors
    const accountComparisonWithNames = accountComparison.map(account => {
      const store = stores.find(s => s.klaviyo_integration?.public_id === account.klaviyo_public_id);

      // Calculate derived metrics in JavaScript (not SQL) to avoid ClickHouse aggregation issues
      const attributed_revenue = parseFloat(account.campaign_revenue || 0) + parseFloat(account.flow_revenue || 0);
      const total_recipients = parseInt(account.email_recipients || 0) + parseInt(account.sms_recipients || 0) + parseInt(account.push_recipients || 0);

      // Debug logging for recipients issue
      if (store?.name === 'balmain') {
        console.log('🔍 DEBUG balmain recipients:', {
          email_recipients: account.email_recipients,
          sms_recipients: account.sms_recipients,
          push_recipients: account.push_recipients,
          total_recipients: total_recipients,
          total_revenue: account.total_revenue,
          revenue_per_recipient: total_recipients > 0 ? (parseFloat(account.total_revenue) / total_recipients) : 0
        });
      }

      return {
        ...account,
        account_name: store?.name || account.klaviyo_public_id,
        // Add calculated fields that were causing SQL aggregation errors
        attributed_revenue: attributed_revenue,
        total_recipients: total_recipients, // Include the total_recipients field
        revenue_per_email: (parseInt(account.email_recipients) > 0) ? (parseFloat(account.email_revenue) / parseInt(account.email_recipients)) : 0,
        revenue_per_sms: (parseInt(account.sms_recipients) > 0) ? (parseFloat(account.sms_revenue) / parseInt(account.sms_recipients)) : 0,
        avg_order_value: (parseInt(account.total_orders) > 0) ? (parseFloat(account.total_revenue) / parseInt(account.total_orders)) : 0,
        // Keep both metrics for performance marketing analysis
        attributed_revenue_per_recipient: (total_recipients > 0) ? (attributed_revenue / total_recipients) : 0,
        total_revenue_per_recipient: (total_recipients > 0) ? (parseFloat(account.total_revenue) / total_recipients) : 0,
        revenue_per_recipient: (total_recipients > 0) ? (attributed_revenue / total_recipients) : 0, // Keep for backwards compatibility
        attribution_percentage: (account.total_revenue > 0) ? (attributed_revenue / account.total_revenue * 100) : 0,
        // Add return rate calculation for New vs Return display (with high precision)
        total_customers: (account.new_customers_total || 0) + (account.returning_customers_total || 0),
        return_rate: ((account.new_customers_total || 0) + (account.returning_customers_total || 0)) > 0
          ? parseFloat((((account.returning_customers_total || 0) / ((account.new_customers_total || 0) + (account.returning_customers_total || 0))) * 100).toFixed(3))
          : 0
      };
    });

    // Format the response
    const response = {
      stats: stats || {
        overall_revenue: 0,
        attributed_revenue: 0,
        attribution_percentage: 0,
        total_orders: 0,
        avg_order_value: 0,
        unique_customers: 0,
        new_customers: 0,
        returning_customers: 0,
        total_email_revenue: 0,
        total_emails_sent: 0,
        revenue_per_email: 0,
        total_sms_revenue: 0,
        total_sms_sent: 0,
        revenue_per_sms: 0,
        total_channel_revenue: 0,
        total_recipients: 0,
        revenue_per_recipient: 0,
        revenue_change: 0,
        orders_change: 0,
        customers_change: 0
      },
      trends: trends.map(trend => {
        const trend_attributed_revenue = (parseFloat(trend.campaign_revenue) || 0) + (parseFloat(trend.flow_revenue) || 0);
        return {
          ...trend,
          period: new Date(trend.period).toISOString(),
          // Calculate attributed_revenue and attribution_percentage for each trend point
          attributed_revenue: trend_attributed_revenue,
          attribution_percentage: trend.overall_revenue > 0
            ? (trend_attributed_revenue / trend.overall_revenue) * 100
            : 0
        };
      }),
      accountComparison: accountComparisonWithNames,
      channelRevenue: channelRevenue,
      metadata: {
        storeCount: stores.length,
        dateRange: {
          start: startDate || 'Last 90 days',
          end: endDate || 'Today'
        },
        comparisonRange: {
          start: comparisonStartDate || 'Previous 90 days',
          end: comparisonEndDate || '90 days ago'
        }
      }
    };

    console.log('Sending response with stats:', response.stats);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Multi-account revenue API error:', error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch revenue data",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
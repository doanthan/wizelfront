import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';
import { getClickHouseClient } from '@/lib/clickhouse';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    const { searchParams } = new URL(request.url);
    const storePublicIds = searchParams.get('stores')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const viewMode = searchParams.get('viewMode') || 'flows'; // 'flows' or 'messages'

    if (!startDate || !endDate) {
      return NextResponse.json({
        error: 'Start date and end date are required'
      }, { status: 400 });
    }

    // Convert store public IDs to Klaviyo public IDs
    let klaviyoIds = [];
    let storeMapping = {};

    if (storePublicIds.length > 0 && !storePublicIds.includes('all')) {
      console.log('Converting store public IDs to Klaviyo IDs for flows:', storePublicIds);

      // Find all stores with these public IDs
      const stores = await db.collection('stores').find({
        public_id: { $in: storePublicIds },
        is_deleted: { $ne: true }
      }).toArray();

      console.log(`Found ${stores.length} stores out of ${storePublicIds.length} requested`);

      // Build mapping and extract Klaviyo IDs
      stores.forEach(store => {
        const klaviyoId = store.klaviyo_integration?.public_id;
        storeMapping[store.public_id] = {
          name: store.name,
          klaviyoId: klaviyoId || null
        };

        if (klaviyoId) {
          klaviyoIds.push(klaviyoId);
        }

        console.log(`  Store: ${store.name} (${store.public_id}) → Klaviyo: ${klaviyoId || 'NOT CONFIGURED'}`);
      });

      if (klaviyoIds.length === 0) {
        console.log('WARNING: No stores have Klaviyo integration configured');
        return NextResponse.json({
          flows: [],
          dailyStats: [],
          aggregateStats: {
            totalFlows: 0,
            totalRecipients: 0,
            totalRevenue: 0,
            avgOpenRate: 0,
            avgClickRate: 0,
            avgConversionRate: 0
          },
          metadata: {
            totalFlows: 0,
            dateRange: { startDate, endDate },
            stores: 0
          }
        });
      }
    } else {
      // If no specific stores selected, get all stores with Klaviyo integration
      console.log('No specific stores selected, fetching all stores with Klaviyo integration');

      const allStores = await db.collection('stores').find({
        'klaviyo_integration.public_id': { $ne: null },
        is_deleted: { $ne: true }
      }).toArray();

      allStores.forEach(store => {
        const klaviyoId = store.klaviyo_integration?.public_id;
        storeMapping[store.public_id] = {
          name: store.name,
          klaviyoId: klaviyoId || null
        };

        if (klaviyoId) {
          klaviyoIds.push(klaviyoId);
        }
      });

      console.log(`Found ${klaviyoIds.length} stores with Klaviyo integration`);
    }

    // Get ClickHouse client
    const client = getClickHouseClient();

    // Build WHERE clause for filtering
    const whereConditions = [];
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    console.log(`Date conversion: ${startDate} → ${formattedStartDate}, ${endDate} → ${formattedEndDate}`);

    whereConditions.push(`date >= '${formattedStartDate}'`);
    whereConditions.push(`date <= '${formattedEndDate}'`);

    if (klaviyoIds.length > 0) {
      const klaviyoIdList = klaviyoIds.map(id => `'${id}'`).join(',');
      whereConditions.push(`klaviyo_public_id IN (${klaviyoIdList})`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Create reverse mapping from klaviyo_public_id to store info (needed for both flows and messages)
    const klaviyoToStoreMapping = {};
    Object.entries(storeMapping).forEach(([storePublicId, storeInfo]) => {
      if (storeInfo.klaviyoId) {
        klaviyoToStoreMapping[storeInfo.klaviyoId] = {
          storePublicId,
          storeName: storeInfo.name
        };
      }
    });

    // If viewMode is 'messages', query message-level data instead
    if (viewMode === 'messages') {
      // Query for message-level statistics
      // Use argMax pattern as recommended by ClickHouse docs
      const messagesQuery = `
        SELECT
          flow_message_id,
          argMax(flow_message_name, updated_at) as flow_message_name,
          flow_id,
          argMax(flow_name, updated_at) as flow_name,
          klaviyo_public_id,
          argMax(send_channel, updated_at) as send_channel,
          argMax(tag_names, updated_at) as tag_names,
          SUM(recipients) as total_recipients,
          SUM(delivered) as total_delivered,
          SUM(opens_unique) as total_opens,
          SUM(clicks_unique) as total_clicks,
          SUM(conversion_uniques) as total_conversions,
          SUM(conversion_value) as total_revenue,
          SUM(bounced) as total_bounced,
          SUM(unsubscribe_uniques) as total_unsubscribes,
          MIN(date) as first_send_date,
          MAX(date) as last_send_date,
          COUNT(DISTINCT date) as active_days
        FROM flow_statistics
        WHERE ${whereClause}
          AND flow_message_id != ''
        GROUP BY flow_message_id, flow_id, klaviyo_public_id
        HAVING flow_message_name != ''
        ORDER BY total_revenue DESC
      `;

      console.log('Executing ClickHouse query for flow messages...');
      console.log('Messages query:', messagesQuery);
      const messagesResult = await client.query({ query: messagesQuery, format: 'JSONEachRow' });
      const messagesData = await messagesResult.json();

      console.log(`Found ${messagesData.length} flow messages`);
      if (messagesData.length > 0) {
        console.log('Sample message data:', JSON.stringify(messagesData[0], null, 2));
        console.log('Recipients field type:', typeof messagesData[0].total_recipients);
        console.log('Recipients value:', messagesData[0].total_recipients);
      }

      // Map store names to messages and calculate metrics
      const messagesWithMetrics = messagesData.map(message => {
        const storeInfo = klaviyoToStoreMapping[message.klaviyo_public_id] || {};

        // Convert string numbers to actual numbers (ClickHouse returns UInt32 as strings)
        const totalRecipients = Number(message.total_recipients) || 0;
        const totalDelivered = Number(message.total_delivered) || 0;
        const totalOpens = Number(message.total_opens) || 0;
        const totalClicks = Number(message.total_clicks) || 0;
        const totalConversions = Number(message.total_conversions) || 0;
        const totalRevenue = Number(message.total_revenue) || 0;
        const totalBounced = Number(message.total_bounced) || 0;
        const totalUnsubscribes = Number(message.total_unsubscribes) || 0;

        // Calculate metrics
        const openRate = totalDelivered > 0
          ? (totalOpens / totalDelivered) * 100 : 0;
        const clickRate = totalDelivered > 0
          ? (totalClicks / totalDelivered) * 100 : 0;
        const conversionRate = totalDelivered > 0
          ? (totalConversions / totalDelivered) * 100 : 0;
        const bounceRate = totalRecipients > 0
          ? (totalBounced / totalRecipients) * 100 : 0;
        const unsubscribeRate = totalRecipients > 0
          ? (totalUnsubscribes / totalRecipients) * 100 : 0;
        const revenuePerRecipient = totalRecipients > 0
          ? totalRevenue / totalRecipients : 0;
        const averageOrderValue = totalConversions > 0
          ? totalRevenue / totalConversions : 0;

        return {
          flow_message_id: message.flow_message_id,
          flow_message_name: message.flow_message_name,
          flow_id: message.flow_id,
          flow_name: message.flow_name,
          klaviyo_public_id: message.klaviyo_public_id,
          store_name: storeInfo.storeName || 'Unknown Store',
          store_public_id: storeInfo.storePublicId,
          send_channel: message.send_channel || 'email',
          tag_names: message.tag_names || [],
          first_send_date: message.first_send_date,
          last_send_date: message.last_send_date,
          active_days: message.active_days,
          // Raw metrics (converted to numbers)
          recipients: totalRecipients,
          delivered: totalDelivered,
          opens_unique: totalOpens,
          clicks_unique: totalClicks,
          conversion_uniques: totalConversions,
          conversion_value: totalRevenue,
          bounced: totalBounced,
          unsubscribe_uniques: totalUnsubscribes,
          // Calculated metrics
          open_rate: openRate,
          click_rate: clickRate,
          conversion_rate: conversionRate,
          bounce_rate: bounceRate,
          unsubscribe_rate: unsubscribeRate,
          revenue_per_recipient: revenuePerRecipient,
          average_order_value: averageOrderValue
        };
      });

      return NextResponse.json({
        messages: messagesWithMetrics,
        metadata: {
          totalMessages: messagesWithMetrics.length,
          dateRange: { startDate: formattedStartDate, endDate: formattedEndDate },
          stores: Object.keys(storeMapping).length,
          viewMode: 'messages'
        },
        dataSource: 'clickhouse'
      });
    }

    // Query 1: Get flow metadata - using MergeTree pattern with argMax for latest values
    const flowsQuery = `
      SELECT
        flow_id,
        argMax(flow_name, updated_at) as flow_name,
        klaviyo_public_id,
        argMax(send_channel, updated_at) as send_channel,
        COUNT(DISTINCT date) as active_days,
        MIN(date) as first_activity,
        MAX(date) as last_activity,
        SUM(recipients) as total_recipients_all_time,
        SUM(conversion_value) as total_revenue_all_time
      FROM flow_statistics
      WHERE ${whereClause}
      GROUP BY flow_id, klaviyo_public_id
      ORDER BY total_revenue_all_time DESC
    `;

    // Query 2: Get daily flow statistics - SharedMergeTree doesn't support FINAL
    const statsQuery = `
      SELECT
        date,
        klaviyo_public_id,
        flow_id,
        flow_name,
        send_channel,
        recipients,
        delivered,
        opens,
        opens_unique,
        clicks,
        clicks_unique,
        conversions,
        conversion_uniques,
        conversion_value,
        average_order_value,
        revenue_per_recipient,
        bounced,
        unsubscribes,
        unsubscribe_uniques,
        open_rate,
        click_rate,
        conversion_rate,
        bounce_rate,
        unsubscribe_rate
      FROM flow_statistics
      WHERE ${whereClause}
      ORDER BY date DESC, flow_name
    `;

    // Query 3: Get aggregate stats across all flows - SharedMergeTree doesn't support FINAL
    const aggregateQuery = `
      SELECT
        COUNT(DISTINCT flow_id) as total_flows,
        SUM(recipients) as total_recipients,
        SUM(delivered) as total_delivered,
        SUM(opens_unique) as total_opens,
        SUM(clicks_unique) as total_clicks,
        SUM(conversion_uniques) as total_conversions,
        SUM(conversion_value) as total_revenue,
        SUM(bounced) as total_bounced,
        SUM(unsubscribe_uniques) as total_unsubscribes
      FROM flow_statistics
      WHERE ${whereClause}
    `;

    // Execute all queries in parallel
    console.log('Executing ClickHouse queries for flows...');
    const [flowsResult, statsResult, aggregateResult] = await Promise.all([
      client.query({ query: flowsQuery, format: 'JSONEachRow' }),
      client.query({ query: statsQuery, format: 'JSONEachRow' }),
      client.query({ query: aggregateQuery, format: 'JSONEachRow' })
    ]);

    // Parse results
    const flowsData = await flowsResult.json();
    const statsData = await statsResult.json();
    const aggregateData = await aggregateResult.json();

    console.log(`Found ${flowsData.length} unique flows`);
    console.log(`Found ${statsData.length} daily stat records`);

    // Map store names to flows
    const flowsWithStoreNames = flowsData.map(flow => {
      const storeInfo = klaviyoToStoreMapping[flow.klaviyo_public_id] || {};

      // Determine trigger type from flow name (heuristic)
      let triggerType = 'custom';
      const flowNameLower = flow.flow_name.toLowerCase();
      if (flowNameLower.includes('welcome') || flowNameLower.includes('signup')) {
        triggerType = 'signup';
      } else if (flowNameLower.includes('abandon') && flowNameLower.includes('cart')) {
        triggerType = 'checkout_started';
      } else if (flowNameLower.includes('post') && flowNameLower.includes('purchase')) {
        triggerType = 'placed_order';
      } else if (flowNameLower.includes('browse') || flowNameLower.includes('view')) {
        triggerType = 'viewed_product';
      } else if (flowNameLower.includes('win') && flowNameLower.includes('back')) {
        triggerType = 'last_order_date';
      } else if (flowNameLower.includes('birthday')) {
        triggerType = 'birthday';
      }

      return {
        flow_id: flow.flow_id,
        flow_name: flow.flow_name,
        klaviyo_public_id: flow.klaviyo_public_id,
        store_name: storeInfo.storeName || 'Unknown Store',
        store_public_id: storeInfo.storePublicId,
        trigger_type: triggerType,
        status: 'active', // Flows in statistics are assumed active
        send_channel: flow.send_channel || 'email',
        total_messages: flow.active_days, // Approximate based on active days
        created_at: flow.first_activity,
        updated_at: flow.last_activity,
        last_activity: flow.last_activity,
        is_active: 1,
        total_recipients: flow.total_recipients_all_time,
        total_revenue: flow.total_revenue_all_time
      };
    });

    // Process daily stats to add store names
    const dailyStatsWithStoreNames = statsData.map(stat => {
      const storeInfo = klaviyoToStoreMapping[stat.klaviyo_public_id] || {};
      return {
        ...stat,
        store_name: storeInfo.storeName || 'Unknown Store',
        store_public_id: storeInfo.storePublicId,
        // Convert rate values from 0-100 to decimal for consistency
        open_rate: stat.open_rate / 100,
        click_rate: stat.click_rate / 100,
        conversion_rate: stat.conversion_rate / 100,
        bounce_rate: stat.bounce_rate / 100,
        unsubscribe_rate: stat.unsubscribe_rate / 100
      };
    });

    // Calculate aggregate statistics
    const aggregate = aggregateData[0] || {};
    const aggregateStats = {
      totalFlows: aggregate.total_flows || 0,
      totalRecipients: aggregate.total_recipients || 0,
      totalDelivered: aggregate.total_delivered || 0,
      totalOpens: aggregate.total_opens || 0,
      totalClicks: aggregate.total_clicks || 0,
      totalConversions: aggregate.total_conversions || 0,
      totalRevenue: aggregate.total_revenue || 0,
      totalBounced: aggregate.total_bounced || 0,
      totalUnsubscribes: aggregate.total_unsubscribes || 0,

      // Calculate weighted average rates
      avgOpenRate: aggregate.total_delivered > 0
        ? (aggregate.total_opens / aggregate.total_delivered) * 100 : 0,
      avgClickRate: aggregate.total_delivered > 0
        ? (aggregate.total_clicks / aggregate.total_delivered) * 100 : 0,
      avgConversionRate: aggregate.total_delivered > 0
        ? (aggregate.total_conversions / aggregate.total_delivered) * 100 : 0,
      avgBounceRate: aggregate.total_recipients > 0
        ? (aggregate.total_bounced / aggregate.total_recipients) * 100 : 0,
      avgUnsubscribeRate: aggregate.total_recipients > 0
        ? (aggregate.total_unsubscribes / aggregate.total_recipients) * 100 : 0,
      revenuePerRecipient: aggregate.total_recipients > 0
        ? aggregate.total_revenue / aggregate.total_recipients : 0,
      avgOrderValue: aggregate.total_conversions > 0
        ? aggregate.total_revenue / aggregate.total_conversions : 0
    };

    return NextResponse.json({
      flows: flowsWithStoreNames,
      dailyStats: dailyStatsWithStoreNames,
      aggregateStats,
      metadata: {
        totalFlows: flowsWithStoreNames.length,
        totalDataPoints: dailyStatsWithStoreNames.length,
        dateRange: { startDate: formattedStartDate, endDate: formattedEndDate },
        stores: Object.keys(storeMapping).length
      },
      dataSource: 'clickhouse'
    });

  } catch (error) {
    console.error('Error fetching flows data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flows data', details: error.message },
      { status: 500 }
    );
  }
}
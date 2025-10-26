import { getClickHouseClient } from '@/lib/clickhouse';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';

/**
 * Universal ClickHouse query function for AI agent
 * Handles store ID conversion and permission filtering
 */
export async function queryClickHouse(params, userStores) {
  const {
    table,
    store_public_ids,
    filters = {},
    metrics = ['*'],
    aggregation = 'none',
    aggregations,  // NEW: 'by_campaign', 'by_flow', etc.
    include_store_names = false,
    include_campaign_names = false,
    include_flow_names = false,
    limit = 50,
    order_by
  } = params;

  // Step 1: Convert klaviyo_public_id filter from performance analyzer
  await connectToDatabase();

  let klaviyoIds = [];

  if (filters.klaviyo_public_id) {
    // Performance analyzer passes klaviyo IDs directly
    klaviyoIds = Array.isArray(filters.klaviyo_public_id)
      ? filters.klaviyo_public_id
      : [filters.klaviyo_public_id];
  } else if (store_public_ids) {
    // Step 2: Validate user has access to requested stores
    const accessibleStoreIds = store_public_ids.filter(id =>
      userStores.some(s => s.public_id === id)
    );

    if (accessibleStoreIds.length === 0) {
      return {
        error: "You don't have access to any of the requested stores",
        accessible_stores: userStores.map(s => ({ id: s.public_id, name: s.name }))
      };
    }

    // Convert store_public_ids to klaviyo_public_ids for ClickHouse
    const stores = await Store.find({
      public_id: { $in: accessibleStoreIds }
    }).lean();

    klaviyoIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);
  } else {
    // Use all user stores
    klaviyoIds = userStores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);
  }

  if (klaviyoIds.length === 0) {
    return { error: "No valid Klaviyo integrations found for requested stores" };
  }

  // Step 3: Build ClickHouse query based on aggregation type
  const client = getClickHouseClient();

  let query;
  let selectClause;
  let groupByClause = '';
  let orderByClause = order_by ? `ORDER BY ${order_by} DESC` : '';

  // Handle date_range filter (from performance analyzer)
  const whereConditions = [
    `klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})`
  ];

  if (filters.date_range) {
    whereConditions.push(`date >= '${filters.date_range.start}' AND date <= '${filters.date_range.end}'`);
  } else if (filters.date_start && filters.date_end) {
    whereConditions.push(`date >= '${filters.date_start}' AND date <= '${filters.date_end}'`);
  }

  if (filters.campaign_channel) {
    whereConditions.push(`send_channel = '${filters.campaign_channel}'`);
  }

  if (filters.min_recipients) {
    whereConditions.push(`recipients >= ${filters.min_recipients}`);
  }

  if (filters.min_open_rate) {
    whereConditions.push(`open_rate >= ${filters.min_open_rate}`);
  }

  if (filters.min_revenue) {
    whereConditions.push(`conversion_value >= ${filters.min_revenue}`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handle different aggregation types
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (aggregations === 'by_campaign') {
    // Campaign-level aggregation for performance analyzer
    if (table === 'campaign_statistics') {
      selectClause = `
        klaviyo_public_id,
        campaign_id,
        campaign_message_id,
        send_channel,
        SUM(recipients) as total_recipients,
        SUM(delivered) as total_delivered,
        SUM(opens_unique) as total_opens_unique,
        SUM(clicks_unique) as total_clicks_unique,
        SUM(conversions) as total_conversions,
        SUM(conversion_value) as total_revenue,
        AVG(open_rate) as avg_open_rate,
        AVG(click_rate) as avg_click_rate,
        AVG(conversion_rate) as avg_conversion_rate,
        MIN(date) as first_send_date,
        MAX(date) as last_send_date
      `;
      groupByClause = 'GROUP BY klaviyo_public_id, campaign_id, campaign_message_id, send_channel';
      orderByClause = 'ORDER BY total_revenue DESC';
    }
  } else if (aggregations === 'by_flow') {
    // Flow-level aggregation for performance analyzer
    if (table === 'flow_statistics') {
      selectClause = `
        klaviyo_public_id,
        flow_id,
        flow_message_id,
        send_channel,
        SUM(recipients) as total_recipients,
        SUM(delivered) as total_delivered,
        SUM(opens_unique) as total_opens_unique,
        SUM(clicks_unique) as total_clicks_unique,
        SUM(conversions) as total_conversions,
        SUM(conversion_value) as total_revenue,
        AVG(open_rate) as avg_open_rate,
        AVG(click_rate) as avg_click_rate,
        AVG(conversion_rate) as avg_conversion_rate,
        MIN(date) as first_send_date,
        MAX(date) as last_send_date
      `;
      groupByClause = 'GROUP BY klaviyo_public_id, flow_id, flow_message_id, send_channel';
      orderByClause = 'ORDER BY total_revenue DESC';
    }
  } else if (aggregation !== 'none') {
    // Legacy aggregation support
    selectClause = metrics
      .map(m => `${aggregation}(${m}) as ${m}_${aggregation}`)
      .join(', ') + ', klaviyo_public_id';
    groupByClause = 'GROUP BY klaviyo_public_id';
  } else {
    // No aggregation - return raw rows
    selectClause = metrics.join(', ');
  }

  // Build final query
  query = `
    SELECT ${selectClause}
    FROM ${table}
    WHERE ${whereConditions.join(' AND ')}
    ${groupByClause}
    ${orderByClause}
    LIMIT ${limit}
  `;

  console.log('🔍 ClickHouse Query:', query.replace(/\n\s+/g, ' ').trim());

  // Step 4: Execute query
  const result = await client.query({
    query: query,
    format: 'JSONEachRow',
  });

  const data = await result.json();

  console.log(`✅ Query returned ${data.length} rows`);

  // Step 5: Enrich results with store names
  const stores = await Store.find({
    'klaviyo_integration.public_id': { $in: klaviyoIds }
  }).lean();

  const enrichedData = data.map(row => {
    const store = stores.find(s =>
      s.klaviyo_integration?.public_id === row.klaviyo_public_id
    );

    return {
      ...row,
      store_name: store?.name || 'Unknown Store',
      store_public_id: store?.public_id || null
    };
  });

  return {
    data: enrichedData,
    query_info: {
      table,
      stores_queried: stores.map(s => s.name),
      total_rows: enrichedData.length,
      aggregation: aggregations || aggregation,
      filters_applied: Object.keys(filters),
      date_range: filters.date_range || null
    }
  };
}

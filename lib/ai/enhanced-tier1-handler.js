/**
 * Enhanced Tier 1 Handler with Intelligent Data Source Routing
 *
 * This enhances the standard Tier 1 context-based chat with:
 * 1. Smart detection when summary data is insufficient
 * 2. Automatic routing to ClickHouse for detailed queries
 * 3. Automatic routing to MCP for real-time queries
 * 4. Seamless fallback handling
 *
 * Flow:
 * User Query → Tier 1 Start → Check Summary Data Sufficiency
 *   ├─ Sufficient → Answer from Summary
 *   ├─ Insufficient + Historical → Route to ClickHouse
 *   └─ Insufficient + Real-time → Route to MCP
 */

import { routeDataSource, buildRoutingContext } from '@/lib/ai/data-source-router';
import { buildSemanticQuery, buildTimeFilter } from '@/lib/ai/clickhouse-semantic-layer';
import { fetchMCPData, detectMCPDataType } from '@/lib/ai/klaviyo-mcp-connector';
import { getClickHouseClient } from '@/lib/clickhouse';
import { analyzeMarketingData } from '@/lib/ai/sonnet-analysis';
import { storeIdsToKlaviyoIds } from '@/lib/utils/id-mapper';

/**
 * Enhanced Tier 1 handler with intelligent routing
 */
export async function handleTier1WithIntelligentRouting(
  sanitizedMessage,
  context,
  history,
  session,
  options = {}
) {
  const startTime = Date.now();

  try {
    // Step 1: Analyze summary data sufficiency
    const summaryData = context?.summaryData || context?.aiState?.summaryData;
    const routingContext = buildRoutingContext(context?.aiState || context);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Checking data source routing for:', sanitizedMessage.substring(0, 60));
    }

    // Step 2: Determine optimal data source
    const routing = await routeDataSource(sanitizedMessage, summaryData, routingContext);

    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Routing decision:', {
        source: routing.source,
        confidence: routing.confidence,
        reason: routing.reason,
        method: routing.method,
      });
    }

    // Step 3: Route to appropriate handler
    switch (routing.source) {
      case 'summary':
        // Answer from summary data (standard Tier 1)
        return {
          shouldRoute: false,
          routing,
          message: 'Answering from summary data',
        };

      case 'clickhouse':
        // Route to ClickHouse for detailed analysis
        return {
          shouldRoute: true,
          destination: 'clickhouse',
          routing,
          handler: async () => await handleClickHouseRouting(
            sanitizedMessage,
            context,
            session,
            routing,
            startTime
          ),
        };

      case 'mcp':
        // Route to MCP for real-time data
        return {
          shouldRoute: true,
          destination: 'mcp',
          routing,
          handler: async () => await handleMCPRouting(
            sanitizedMessage,
            context,
            session,
            routing,
            startTime
          ),
        };

      default:
        // Unknown source - default to summary
        return {
          shouldRoute: false,
          routing,
          message: 'Defaulting to summary data',
        };
    }

  } catch (error) {
    console.error('❌ Enhanced routing failed:', error);

    // Fallback to standard Tier 1
    return {
      shouldRoute: false,
      error: error.message,
      message: 'Routing failed, using standard Tier 1',
    };
  }
}

/**
 * Handle ClickHouse routing for detailed queries
 */
async function handleClickHouseRouting(
  query,
  context,
  session,
  routing,
  startTime
) {
  console.log('📊 Routing to ClickHouse for detailed analysis...');

  try {
    // Get store IDs from context
    let selectedStores = context?.selectedStores || context?.aiState?.selectedStores || [];
    let storeIds = selectedStores.map(s => s.value || s.id);

    // If no stores selected, get all user's accessible stores
    if (storeIds.length === 0) {
      console.log('ℹ️  No stores selected, fetching all accessible stores for user...');

      // Import models
      const Store = (await import('@/models/Store')).default;
      const User = (await import('@/models/User')).default;
      const ContractSeat = (await import('@/models/ContractSeat')).default;
      const connectToDatabase = (await import('@/lib/mongoose')).default;

      await connectToDatabase();

      // Get user from session
      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        throw new Error('User not found');
      }

      const isSuperAdmin = user?.is_super_user === true;
      let stores = [];

      if (isSuperAdmin) {
        // Super admin can see all stores
        stores = await Store.find({
          is_deleted: { $ne: true }
        }).select('public_id name klaviyo_integration').lean();
      } else {
        // Regular user - use ContractSeat system
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
              is_deleted: { $ne: true }
            }).select('_id').lean();

            accessibleStoreIds.push(...contractStores.map(s => s._id));
          } else {
            // User has specific store access
            accessibleStoreIds.push(...seat.store_access);
          }
        }

        // Remove duplicates
        accessibleStoreIds = [...new Set(accessibleStoreIds.map(id => id.toString()))];

        if (accessibleStoreIds.length === 0) {
          throw new Error('No accessible stores found for this user');
        }

        stores = await Store.find({
          _id: { $in: accessibleStoreIds },
          is_deleted: { $ne: true }
        }).select('public_id name klaviyo_integration').lean();
      }

      // Extract store public IDs
      storeIds = stores.map(s => s.public_id).filter(Boolean);

      if (storeIds.length === 0) {
        throw new Error('No stores with valid public_id found');
      }

      console.log(`✅ Found ${storeIds.length} accessible stores for user`);
    }

    // Convert store IDs to Klaviyo IDs
    const { klaviyoIds, storeMap, errors } = await storeIdsToKlaviyoIds(storeIds);

    if (klaviyoIds.length === 0) {
      throw new Error('No valid Klaviyo integrations found');
    }

    // Determine query intent and build semantic query
    const semanticQuery = await buildClickHouseQueryFromNL(query, klaviyoIds, context);

    console.log('✅ Generated ClickHouse query:', semanticQuery.sql);

    // Execute query
    const clickhouse = getClickHouseClient();
    const queryResults = await clickhouse.query({
      query: semanticQuery.sql,
      format: 'JSONEachRow',
    });

    const resultSet = await queryResults.json();

    console.log(`✅ Query returned ${resultSet.length} rows`);

    // Analyze results with Sonnet
    const storeNames = Array.from(storeMap.values()).map(s => s.store_name);
    const analysisContext = {
      storeNames,
      dataSource: 'clickhouse',
      userExpertise: 'intermediate',
    };

    const analysis = await analyzeMarketingData(
      query,
      semanticQuery.sql,
      resultSet,
      analysisContext,
      true // Enable Gemini fallback
    );

    const executionTime = Date.now() - startTime;

    return {
      response: analysis,
      metadata: {
        tier: 2, // ClickHouse routing from Tier 1
        tierName: 'ClickHouse (routed from summary)',
        source: 'clickhouse',
        routing,
        storeCount: klaviyoIds.length,
        stores: storeNames,
        rowCount: resultSet.length,
        executionTime: `${executionTime}ms`,
        sql: semanticQuery.sql,
      },
    };

  } catch (error) {
    console.error('❌ ClickHouse routing failed:', error);
    throw error;
  }
}

/**
 * Handle MCP routing for real-time queries
 */
async function handleMCPRouting(
  query,
  context,
  session,
  routing,
  startTime
) {
  console.log('🔌 Routing to MCP for real-time data...');

  try {
    // Get store from context
    let selectedStores = context?.selectedStores || context?.aiState?.selectedStores || [];

    // If no stores selected, get user's first accessible store
    if (selectedStores.length === 0) {
      console.log('ℹ️  No stores selected, fetching first accessible store for user...');

      // Import models
      const Store = (await import('@/models/Store')).default;
      const User = (await import('@/models/User')).default;
      const ContractSeat = (await import('@/models/ContractSeat')).default;
      const connectToDatabase = (await import('@/lib/mongoose')).default;

      await connectToDatabase();

      // Get user from session
      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        throw new Error('User not found');
      }

      const isSuperAdmin = user?.is_super_user === true;
      let stores = [];

      if (isSuperAdmin) {
        // Super admin can see all stores
        stores = await Store.find({
          is_deleted: { $ne: true }
        }).select('public_id name klaviyo_integration').limit(1).lean();
      } else {
        // Regular user - use ContractSeat system
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
              is_deleted: { $ne: true }
            }).select('_id').limit(1).lean();

            accessibleStoreIds.push(...contractStores.map(s => s._id));
            break; // Just get first contract's first store
          } else {
            // User has specific store access - get first one
            accessibleStoreIds.push(seat.store_access[0]);
            break;
          }
        }

        if (accessibleStoreIds.length === 0) {
          throw new Error('No accessible stores found for this user');
        }

        stores = await Store.find({
          _id: { $in: accessibleStoreIds },
          is_deleted: { $ne: true }
        }).select('public_id name klaviyo_integration').limit(1).lean();
      }

      if (stores.length === 0) {
        throw new Error('No accessible stores found');
      }

      // Convert to selectedStores format
      selectedStores = [{ value: stores[0].public_id, label: stores[0].name }];
      console.log(`✅ Using store: ${stores[0].name} (${stores[0].public_id})`);
    }

    // For MCP, typically query one store at a time
    const primaryStore = selectedStores[0];

    // Get full store object from database
    const Store = (await import('@/models/Store')).default;
    const store = await Store.findOne({ public_id: primaryStore.value || primaryStore.id });

    if (!store) {
      throw new Error('Store not found');
    }

    // Detect which MCP data type is needed
    const dataType = detectMCPDataType(query);

    console.log(`🔍 Fetching ${dataType} from Klaviyo MCP...`);

    // Fetch real-time data
    const mcpResult = await fetchMCPData(dataType, store, { limit: 100 });

    console.log(`✅ MCP returned ${mcpResult.total} ${dataType}`);

    // Format response for AI analysis
    const formattedData = formatMCPDataForAI(mcpResult, dataType);

    // Analyze with Sonnet
    const analysis = await analyzeMCPData(query, formattedData, dataType);

    const executionTime = Date.now() - startTime;

    return {
      response: analysis,
      metadata: {
        tier: 3, // MCP routing from Tier 1
        tierName: 'MCP Real-time (routed from summary)',
        source: 'klaviyo-mcp',
        routing,
        dataType,
        resultCount: mcpResult.total,
        executionTime: `${executionTime}ms`,
        fetchedAt: mcpResult.fetchedAt,
      },
    };

  } catch (error) {
    console.error('❌ MCP routing failed:', error);
    throw error;
  }
}

/**
 * Build ClickHouse query from natural language using semantic layer
 */
async function buildClickHouseQueryFromNL(query, klaviyoIds, context) {
  // Detect query intent (campaigns, flows, revenue, etc.)
  const queryLower = query.toLowerCase();

  let template = null;
  let filters = [];

  // Campaign queries
  if (/\b(campaign|email|newsletter)\b/i.test(queryLower)) {
    template = 'campaign_performance';

    // Add time filter if mentioned
    if (context?.dateRange?.preset) {
      filters.push(buildTimeFilter(context.dateRange.preset, 'date'));
    } else if (/\blast\s+(\d+)\s+days?\b/i.test(queryLower)) {
      const match = queryLower.match(/last\s+(\d+)\s+days?/i);
      const days = parseInt(match[1]);
      filters.push(`date >= today() - ${days}`);
    }

    // Detect custom limit
    const limitMatch = queryLower.match(/\b(top|best)\s+(\d+)\b/i);
    const limit = limitMatch ? parseInt(limitMatch[2]) : 10;

    return buildSemanticQuery({
      template,
      klaviyoIds,
      filters,
      limit,
    });
  }

  // Flow queries
  if (/\b(flow|automation)\b/i.test(queryLower)) {
    template = 'flow_performance';

    // Add time filter if mentioned
    if (context?.dateRange?.preset) {
      filters.push(buildTimeFilter(context.dateRange.preset, 'date'));
    } else if (/\b(past|last)\s+(\d+)\s+days?\b/i.test(queryLower)) {
      const match = queryLower.match(/\b(past|last)\s+(\d+)\s+days?\b/i);
      const days = parseInt(match[2]);
      filters.push(`date >= today() - ${days}`);
    }

    const limitMatch = queryLower.match(/\b(top|best)\s+(\d+)\b/i);
    const limit = limitMatch ? parseInt(limitMatch[2]) : 10;

    return buildSemanticQuery({
      template,
      klaviyoIds,
      filters,
      limit,
    });
  }

  // Revenue queries
  if (/\b(revenue|sales|orders)\b/i.test(queryLower)) {
    template = 'revenue_breakdown';

    if (context?.dateRange?.preset) {
      filters.push(buildTimeFilter(context.dateRange.preset, 'order_timestamp'));
    }

    return buildSemanticQuery({
      template,
      klaviyoIds,
      filters,
      limit: 90,
    });
  }

  // Default to campaign performance
  return buildSemanticQuery({
    template: 'campaign_performance',
    klaviyoIds,
    filters,
    limit: 20,
  });
}

/**
 * Format MCP data for AI analysis
 */
function formatMCPDataForAI(mcpResult, dataType) {
  let formatted = `# Real-time ${dataType} data from Klaviyo\n\n`;
  formatted += `Fetched at: ${mcpResult.fetchedAt}\n`;
  formatted += `Total ${dataType}: ${mcpResult.total}\n\n`;

  switch (dataType) {
    case 'segments':
      if (mcpResult.segments && mcpResult.segments.length > 0) {
        formatted += '| Segment Name | Profile Count | Status | Created |\n';
        formatted += '|--------------|---------------|--------|----------|\n';
        mcpResult.segments.forEach(seg => {
          formatted += `| ${seg.name} | ${seg.profileCount?.toLocaleString() || 0} | ${seg.isActive ? 'Active' : 'Inactive'} | ${new Date(seg.createdAt).toLocaleDateString()} |\n`;
        });
      }
      break;

    case 'flows':
      if (mcpResult.flows && mcpResult.flows.length > 0) {
        formatted += '| Flow Name | Status | Trigger Type | Created |\n';
        formatted += '|-----------|--------|--------------|----------|\n';
        mcpResult.flows.forEach(flow => {
          formatted += `| ${flow.name} | ${flow.status} | ${flow.triggerType} | ${new Date(flow.createdAt).toLocaleDateString()} |\n`;
        });
      }
      break;

    case 'campaigns':
      if (mcpResult.campaigns && mcpResult.campaigns.length > 0) {
        formatted += '| Campaign Name | Status | Scheduled At | Channel |\n';
        formatted += '|---------------|--------|--------------|----------|\n';
        mcpResult.campaigns.forEach(camp => {
          formatted += `| ${camp.name} | ${camp.status} | ${new Date(camp.scheduledAt).toLocaleString()} | ${camp.channel} |\n`;
        });
      }
      break;
  }

  return formatted;
}

/**
 * Analyze MCP data with Sonnet
 */
async function analyzeMCPData(query, formattedData, dataType) {
  // For now, return formatted data
  // TODO: Integrate with Sonnet for intelligent analysis
  return `Based on the real-time ${dataType} data from Klaviyo:\n\n${formattedData}`;
}

/**
 * Example integration into main chat route:
 *
 * ```javascript
 * // In handleTier1Context function:
 *
 * // Before calling AI, check if we should route
 * const routingDecision = await handleTier1WithIntelligentRouting(
 *   sanitizedMessage,
 *   context,
 *   history,
 *   session
 * );
 *
 * if (routingDecision.shouldRoute) {
 *   console.log(`🔀 Routing to ${routingDecision.destination}...`);
 *   return await routingDecision.handler();
 * }
 *
 * // Otherwise, continue with standard Tier 1 handling...
 * ```
 */

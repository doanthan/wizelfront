/**
 * Klaviyo MCP (Model Context Protocol) Connector
 *
 * Provides real-time access to Klaviyo data via MCP tools
 * Use for queries requiring current/live state:
 * - Segment profile counts (real-time)
 * - Active flow status
 * - Current campaign schedule
 * - List memberships
 * - Template configurations
 */

import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

/**
 * MCP Data Types
 */
export const MCPDataType = {
  SEGMENTS: 'segments',
  FLOWS: 'flows',
  CAMPAIGNS: 'campaigns',
  LISTS: 'lists',
  FORMS: 'forms',
  TEMPLATES: 'templates',
  PROFILES: 'profiles',
};

/**
 * Fetch real-time segment data from Klaviyo
 */
export async function fetchRealtimeSegments(store, options = {}) {
  const authOptions = buildKlaviyoAuthOptions(store);

  try {
    // Fetch segments with profile counts using additional-fields
    const segments = await klaviyoRequest('GET', 'segments', {
      ...authOptions,
      params: {
        'additional-fields[segment]': 'profile_count',
        'page[size]': options.limit || 100,
      },
      debug: process.env.NODE_ENV === 'development',
    });

    if (!segments || !segments.data) {
      return {
        segments: [],
        total: 0,
        error: null,
      };
    }

    // Transform to simplified format
    const transformedSegments = segments.data.map(seg => ({
      id: seg.id,
      name: seg.attributes.name,
      profileCount: seg.attributes.profile_count,
      createdAt: seg.attributes.created,
      updatedAt: seg.attributes.updated,
      isStarred: seg.attributes.is_starred,
      isActive: seg.attributes.is_active,
    }));

    return {
      segments: transformedSegments,
      total: transformedSegments.length,
      fetchedAt: new Date().toISOString(),
      source: 'klaviyo-mcp',
    };

  } catch (error) {
    console.error('Failed to fetch real-time segments:', error);
    return {
      segments: [],
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Fetch real-time flow data from Klaviyo
 */
export async function fetchRealtimeFlows(store, options = {}) {
  const authOptions = buildKlaviyoAuthOptions(store);

  try {
    const flows = await klaviyoRequest('GET', 'flows', {
      ...authOptions,
      params: {
        'page[size]': options.limit || 100,
      },
      debug: process.env.NODE_ENV === 'development',
    });

    if (!flows || !flows.data) {
      return {
        flows: [],
        total: 0,
        error: null,
      };
    }

    // Transform to simplified format
    const transformedFlows = flows.data.map(flow => ({
      id: flow.id,
      name: flow.attributes.name,
      status: flow.attributes.status, // 'live', 'draft', 'manual'
      triggerType: flow.attributes.trigger_type,
      createdAt: flow.attributes.created,
      updatedAt: flow.attributes.updated,
      archived: flow.attributes.archived,
    }));

    return {
      flows: transformedFlows,
      total: transformedFlows.length,
      fetchedAt: new Date().toISOString(),
      source: 'klaviyo-mcp',
    };

  } catch (error) {
    console.error('Failed to fetch real-time flows:', error);
    return {
      flows: [],
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Fetch scheduled campaigns (upcoming sends)
 */
export async function fetchScheduledCampaigns(store, options = {}) {
  const authOptions = buildKlaviyoAuthOptions(store);

  try {
    const campaigns = await klaviyoRequest('GET', 'campaigns', {
      ...authOptions,
      params: {
        'filter': 'equals(status,"scheduled")',
        'page[size]': options.limit || 50,
        'sort': 'scheduled_at',
      },
      debug: process.env.NODE_ENV === 'development',
    });

    if (!campaigns || !campaigns.data) {
      return {
        campaigns: [],
        total: 0,
        error: null,
      };
    }

    // Transform to simplified format
    const transformedCampaigns = campaigns.data.map(camp => ({
      id: camp.id,
      name: camp.attributes.name,
      status: camp.attributes.status,
      scheduledAt: camp.attributes.scheduled_at,
      channel: camp.attributes.channel,
      audienceCount: camp.attributes.audiences?.included?.length || 0,
    }));

    return {
      campaigns: transformedCampaigns,
      total: transformedCampaigns.length,
      fetchedAt: new Date().toISOString(),
      source: 'klaviyo-mcp',
    };

  } catch (error) {
    console.error('Failed to fetch scheduled campaigns:', error);
    return {
      campaigns: [],
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Fetch real-time list data from Klaviyo
 */
export async function fetchRealtimeLists(store, options = {}) {
  const authOptions = buildKlaviyoAuthOptions(store);

  try {
    const lists = await klaviyoRequest('GET', 'lists', {
      ...authOptions,
      params: {
        'additional-fields[list]': 'profile_count',
        'page[size]': options.limit || 100,
      },
      debug: process.env.NODE_ENV === 'development',
    });

    if (!lists || !lists.data) {
      return {
        lists: [],
        total: 0,
        error: null,
      };
    }

    // Transform to simplified format
    const transformedLists = lists.data.map(list => ({
      id: list.id,
      name: list.attributes.name,
      profileCount: list.attributes.profile_count,
      createdAt: list.attributes.created,
      updatedAt: list.attributes.updated,
    }));

    return {
      lists: transformedLists,
      total: transformedLists.length,
      fetchedAt: new Date().toISOString(),
      source: 'klaviyo-mcp',
    };

  } catch (error) {
    console.error('Failed to fetch real-time lists:', error);
    return {
      lists: [],
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Fetch real-time forms data from Klaviyo
 */
export async function fetchRealtimeForms(store, options = {}) {
  const authOptions = buildKlaviyoAuthOptions(store);

  try {
    const forms = await klaviyoRequest('GET', 'forms', {
      ...authOptions,
      params: {
        'page[size]': options.limit || 100,
      },
      debug: process.env.NODE_ENV === 'development',
    });

    if (!forms || !forms.data) {
      return {
        forms: [],
        total: 0,
        error: null,
      };
    }

    // Transform to simplified format
    const transformedForms = forms.data.map(form => ({
      id: form.id,
      name: form.attributes.name,
      status: form.attributes.status,
      createdAt: form.attributes.created,
      updatedAt: form.attributes.updated,
    }));

    return {
      forms: transformedForms,
      total: transformedForms.length,
      fetchedAt: new Date().toISOString(),
      source: 'klaviyo-mcp',
    };

  } catch (error) {
    console.error('Failed to fetch real-time forms:', error);
    return {
      forms: [],
      total: 0,
      error: error.message,
    };
  }
}

/**
 * Route MCP data request to appropriate fetcher
 */
export async function fetchMCPData(dataType, store, options = {}) {
  switch (dataType) {
    case MCPDataType.SEGMENTS:
      return await fetchRealtimeSegments(store, options);

    case MCPDataType.FLOWS:
      return await fetchRealtimeFlows(store, options);

    case MCPDataType.CAMPAIGNS:
      return await fetchScheduledCampaigns(store, options);

    case MCPDataType.LISTS:
      return await fetchRealtimeLists(store, options);

    case MCPDataType.FORMS:
      return await fetchRealtimeForms(store, options);

    default:
      throw new Error(`Unknown MCP data type: ${dataType}`);
  }
}

/**
 * Determine which MCP data type is needed based on query
 * (Can be enhanced with Haiku AI for better detection)
 */
export function detectMCPDataType(query) {
  const queryLower = query.toLowerCase();

  if (/\bsegment/i.test(queryLower)) {
    return MCPDataType.SEGMENTS;
  }

  if (/\bflow/i.test(queryLower)) {
    return MCPDataType.FLOWS;
  }

  if (/\b(scheduled|upcoming)\s+campaign/i.test(queryLower)) {
    return MCPDataType.CAMPAIGNS;
  }

  if (/\blist/i.test(queryLower)) {
    return MCPDataType.LISTS;
  }

  if (/\bform/i.test(queryLower)) {
    return MCPDataType.FORMS;
  }

  // Default to segments (most common real-time query)
  return MCPDataType.SEGMENTS;
}

/**
 * Example usage:
 *
 * ```javascript
 * import { fetchMCPData, MCPDataType } from '@/lib/ai/klaviyo-mcp-connector';
 *
 * // Fetch real-time segment data
 * const result = await fetchMCPData(
 *   MCPDataType.SEGMENTS,
 *   store,
 *   { limit: 50 }
 * );
 *
 * console.log(result);
 * // {
 * //   segments: [
 * //     { id: '...', name: 'VIP Customers', profileCount: 1234, ... },
 * //     { id: '...', name: 'At Risk', profileCount: 567, ... },
 * //   ],
 * //   total: 45,
 * //   fetchedAt: '2025-01-22T...',
 * //   source: 'klaviyo-mcp'
 * // }
 * ```
 */

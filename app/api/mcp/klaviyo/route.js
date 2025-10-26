/**
 * Klaviyo MCP Server API Proxy
 *
 * Handles MCP protocol requests to Klaviyo API with:
 * - Permission validation (user can only access their authorized stores)
 * - OAuth-first authentication with automatic token refresh
 * - Rate limiting and error handling
 * - Response formatting for client consumption
 */

import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Store from "@/models/Store";
import { NextResponse } from "next/server";
import { klaviyoRequest } from "@/lib/klaviyo-api";

/**
 * MCP endpoint to Klaviyo API path mapping
 */
const MCP_ENDPOINT_MAPPING = {
  // Accounts
  get_account_details: { method: 'GET', path: 'accounts' },

  // Catalogs
  get_catalog_items: { method: 'GET', path: 'catalog-items' },

  // Events & Metrics
  get_events: { method: 'GET', path: 'events' },
  get_metrics: { method: 'GET', path: 'metrics' },
  get_metric: { method: 'GET', path: 'metrics/{metric_id}' },

  // Flows
  get_flows: { method: 'GET', path: 'flows' },
  get_flow: { method: 'GET', path: 'flows/{flow_id}' },

  // Lists & Segments
  get_lists: { method: 'GET', path: 'lists' },
  get_list: { method: 'GET', path: 'lists/{list_id}' },
  get_segments: { method: 'GET', path: 'segments', queryParams: { 'additional-fields[segment]': 'profile_count' } },
  get_segment: { method: 'GET', path: 'segments/{segment_id}', queryParams: { 'additional-fields[segment]': 'profile_count' } },

  // Profiles
  get_profiles: { method: 'GET', path: 'profiles' },
  get_profile: { method: 'GET', path: 'profiles/{profile_id}' },
  create_profile: { method: 'POST', path: 'profiles' },
  update_profile: { method: 'PATCH', path: 'profiles/{profile_id}' },

  // Reporting
  get_campaign_report: { method: 'GET', path: 'campaigns/{campaign_id}', queryParams: { 'include': 'campaign-messages' } },
  get_flow_report: { method: 'GET', path: 'flows/{flow_id}', queryParams: { 'include': 'flow-actions' } },
};

/**
 * POST /api/mcp/klaviyo
 *
 * Handles MCP requests to Klaviyo API
 *
 * Request body:
 * {
 *   endpoint: string,          // MCP endpoint name (e.g., 'get_lists')
 *   params: object,            // Parameters for the endpoint
 *   klaviyoPublicId: string,   // Klaviyo account public ID
 *   authOptions: object        // Authentication options (OAuth token or API key)
 * }
 */
export async function POST(request) {
  try {
    // 1. Authentication - Auth.js v5
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { endpoint, params = {}, klaviyoPublicId, authOptions } = body;

    if (!endpoint || !klaviyoPublicId) {
      return NextResponse.json(
        { error: "Missing required fields: endpoint, klaviyoPublicId" },
        { status: 400 }
      );
    }

    // 3. Validate endpoint exists
    const endpointConfig = MCP_ENDPOINT_MAPPING[endpoint];
    if (!endpointConfig) {
      return NextResponse.json(
        { error: `Unknown MCP endpoint: ${endpoint}` },
        { status: 400 }
      );
    }

    // 4. Connect to database and get user
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 5. Get store and validate permissions
    const store = await Store.findOne({
      'klaviyo_integration.public_id': klaviyoPublicId,
      is_deleted: { $ne: true }
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or Klaviyo integration not configured" },
        { status: 404 }
      );
    }

    // 6. Permission check - user must have access to this store
    const hasAccess = user.contract_seats?.some(seat =>
      seat.store_access?.includes(store.public_id)
    ) || user.is_super_user;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied - You don't have permission to access this store" },
        { status: 403 }
      );
    }

    // 7. Build Klaviyo API path
    let apiPath = endpointConfig.path;

    // Replace path parameters (e.g., {flow_id} -> abc123)
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{${key}}`;
      if (apiPath.includes(placeholder)) {
        apiPath = apiPath.replace(placeholder, value);
      }
    }

    // 8. Build query parameters
    const queryParams = new URLSearchParams();

    // Add default query params from endpoint config
    if (endpointConfig.queryParams) {
      for (const [key, value] of Object.entries(endpointConfig.queryParams)) {
        queryParams.append(key, value);
      }
    }

    // Add pagination and filtering params
    if (params.page_size) {
      queryParams.append('page[size]', params.page_size);
    }
    if (params.page_cursor) {
      queryParams.append('page[cursor]', params.page_cursor);
    }
    if (params.filter) {
      queryParams.append('filter', params.filter);
    }

    // Add query string to path if exists
    const queryString = queryParams.toString();
    if (queryString) {
      apiPath += `?${queryString}`;
    }

    // 9. Make Klaviyo API request
    const response = await klaviyoRequest(
      endpointConfig.method,
      apiPath,
      {
        ...authOptions,
        payload: (endpointConfig.method === 'POST' || endpointConfig.method === 'PATCH')
          ? params.payload
          : undefined,
        debug: process.env.NODE_ENV === 'development'
      }
    );

    // 10. Return formatted response
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ MCP API Error:', {
      message: error.message,
      stack: error.stack
    });

    // Handle specific error types
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: "Klaviyo authentication failed - Please reconnect your account" },
        { status: 401 }
      );
    }

    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: "Rate limit exceeded - Please try again in a few moments" },
        { status: 429 }
      );
    }

    if (error.message.includes('404')) {
      return NextResponse.json(
        { error: "Resource not found in Klaviyo" },
        { status: 404 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to fetch data from Klaviyo",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/klaviyo?test=true
 *
 * Health check endpoint to verify MCP server is accessible
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const isTest = searchParams.get('test') === 'true';

  if (isTest) {
    return NextResponse.json({
      status: 'ok',
      message: 'Klaviyo MCP API proxy is running',
      endpoints: Object.keys(MCP_ENDPOINT_MAPPING),
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json(
    { error: "GET method not supported - Use POST for MCP requests" },
    { status: 405 }
  );
}

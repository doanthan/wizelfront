# ClickHouse Integration Guide for Wizel Dashboard

## 📋 Table of Contents
- [Connection Details](#connection-details)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [API Route Implementation](#api-route-implementation)
- [React Hooks](#react-hooks)
- [Dashboard Components](#dashboard-components)
- [Query Service](#query-service)
- [Security Best Practices](#security-best-practices)
- [Testing](#testing)

## 🔧 Connection Details

Your ClickHouse instance is hosted on AWS ClickHouse Cloud with the following details:

```
Host: kis8xv8y1f.us-east-1.aws.clickhouse.cloud
Database: default
Username: default
Password: kivR_vYaWBs8B
Port: 8443 (HTTPS)
SSL: true (required for AWS ClickHouse Cloud)
```

## 🚀 API Endpoints

### Main Reporting Endpoint

#### `/api/report` - Account Dashboard Reporting
**Method**: GET

**Description**: Fetches reporting data from ClickHouse, aggregating by `klaviyo_public_key` for multi-store reporting.

**Query Parameters**:
- `startDate` (optional): Start date in YYYY-MM-DD format (default: 90 days ago)
- `endDate` (optional): End date in YYYY-MM-DD format (default: today)
- `storeIds` (optional): Comma-separated list of store public IDs
- `type` (optional): Report type - `dashboard`, `campaigns`, `flows`, `performance` (default: dashboard)
- `metric` (optional): Specific metric to query (default: revenue)

**Example Requests**:
```javascript
// Dashboard overview for last 30 days
GET /api/report?startDate=2025-08-15&endDate=2025-09-15&type=dashboard

// Campaign performance for specific stores
GET /api/report?storeIds=store1,store2&type=campaigns

// Flow metrics for all user's stores
GET /api/report?type=flows

// Account performance rankings
GET /api/report?type=performance
```

**Response Structure** (Dashboard Type):
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 125000.50,
      "attributedRevenue": 98000.25,
      "attributionRate": 78.4,
      "totalOrders": 450,
      "aov": 277.78,
      "yoyGrowth": 23.5
    },
    "channels": {
      "email": {
        "revenue": 75000,
        "recipients": 12000,
        "revenuePerRecipient": 6.25
      },
      "sms": {
        "revenue": 23000,
        "recipients": 5000,
        "revenuePerRecipient": 4.60
      },
      "overall": {
        "revenuePerRecipient": 5.42
      }
    }
  },
  "metadata": {
    "startDate": "2025-08-15",
    "endDate": "2025-09-15",
    "storeCount": 3,
    "reportType": "dashboard"
  }
}
```

### Superuser Endpoints

#### `/api/superuser/clickhouse` - ClickHouse Admin Interface
**Method**: GET, POST

**Description**: Superuser-only endpoint for ClickHouse monitoring and management.

**GET Parameters**:
- `action`: `overview`, `test`, `tables`, `table-stats`, `system-metrics`, `database-stats` (default: overview)
- `database` (for table-stats): Database name
- `table` (for table-stats): Table name

**POST Body**:
```json
{
  "query": "SELECT * FROM system.tables LIMIT 10"
}
```

**Example Requests**:
```javascript
// Get overview
GET /api/superuser/clickhouse?action=overview

// Get table statistics
GET /api/superuser/clickhouse?action=table-stats&database=analytics&table=orders

// Execute custom query (SELECT/SHOW/DESCRIBE only)
POST /api/superuser/clickhouse
{
  "query": "SELECT COUNT(*) FROM analytics.orders"
}
```

## 📦 Installation

Install the official ClickHouse client for Node.js:

```bash
npm install @clickhouse/client
# or
yarn add @clickhouse/client
# or
pnpm add @clickhouse/client
```

## 🔐 Environment Setup

Create or update `.env.local` in your Next.js project root:

```env
# ClickHouse Configuration
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=kivR_vYaWBs8B
CLICKHOUSE_HOST=kis8xv8y1f.us-east-1.aws.clickhouse.cloud
CLICKHOUSE_PORT=8443
CLICKHOUSE_DATABASE=default
CLICKHOUSE_SECURE=true
```

**⚠️ IMPORTANT:** 
- Never expose `CLICKHOUSE_USER` and `CLICKHOUSE_PASSWORD` in client-side code
- Only use `NEXT_PUBLIC_*` prefixed variables for non-sensitive configuration
- Always access the database through API routes

## 🛡️ API Route Implementation

### App Router Implementation

Create `app/api/clickhouse/query/route.ts`:

```typescript
// app/api/clickhouse/query/route.ts
import { createClient } from '@clickhouse/client';
import { NextRequest, NextResponse } from 'next/server';

// Initialize ClickHouse client
const client = createClient({
  host: process.env.CLICKHOUSE_SECURE === 'true' 
    ? `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || 8443}`
    : `http://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || 8123}`,
  database: process.env.CLICKHOUSE_DATABASE || 'default',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
  // Important for AWS ClickHouse Cloud
  clickhouse_settings: {
    max_result_rows: '10000',
  },
});

// POST method for complex queries
export async function POST(request: NextRequest) {
  try {
    const { query, params = {} } = await request.json();

    // Validate query (add your own validation logic)
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query' },
        { status: 400 }
      );
    }

    // Security: Basic query validation (expand as needed)
    const forbiddenKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
    const queryUpper = query.toUpperCase();
    for (const keyword of forbiddenKeywords) {
      if (queryUpper.includes(keyword)) {
        return NextResponse.json(
          { error: `Forbidden operation: ${keyword}` },
          { status: 403 }
        );
      }
    }

    // Execute query
    const result = await client.query({
      query,
      format: 'JSONEachRow',
      query_params: params,
    });

    const data = await result.json();

    return NextResponse.json({
      success: true,
      data,
      rows: data.length,
      query: process.env.NODE_ENV === 'development' ? query : undefined,
    });

  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json(
      { 
        error: 'Query failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// GET method for simple queries
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const table = searchParams.get('table');
  const limit = searchParams.get('limit') || '100';

  if (!table) {
    return NextResponse.json(
      { error: 'Table parameter required' },
      { status: 400 }
    );
  }

  // Whitelist allowed tables
  const allowedTables = [
    'klaviyo_orders',
    'klaviyo_order_line_items',
    'klaviyo_customer_summary',
    'flow_statistics',
    'form_statistics',
    'segment_statistics'
  ];

  if (!allowedTables.includes(table)) {
    return NextResponse.json(
      { error: 'Invalid table name' },
      { status: 403 }
    );
  }

  try {
    const result = await client.query({
      query: `SELECT * FROM ${table} LIMIT ${parseInt(limit)}`,
      format: 'JSONEachRow',
    });

    const data = await result.json();

    return NextResponse.json({
      success: true,
      data,
      rows: data.length,
      table,
    });

  } catch (error) {
    console.error('ClickHouse query error:', error);
    return NextResponse.json(
      { 
        error: 'Query failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
```

### Pages Router Implementation (Alternative)

If using Pages Router, create `pages/api/clickhouse/query.ts`:

```typescript
// pages/api/clickhouse/query.ts
import { createClient } from '@clickhouse/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const client = createClient({
  host: process.env.CLICKHOUSE_SECURE === 'true' 
    ? `https://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || 8443}`
    : `http://${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT || 8123}`,
  database: process.env.CLICKHOUSE_DATABASE || 'default',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, params = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }

    const result = await client.query({
      query,
      format: 'JSONEachRow',
      query_params: params,
    });

    const data = await result.json();

    return res.status(200).json({
      success: true,
      data,
      rows: data.length,
    });

  } catch (error) {
    console.error('ClickHouse query error:', error);
    return res.status(500).json({
      error: 'Query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

## 🎨 React Hooks

### Custom Hook for ClickHouse Queries

Create `hooks/useClickHouse.ts`:

```typescript
// hooks/useClickHouse.ts
import { useState, useEffect, useCallback } from 'react';

interface QueryResult<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseClickHouseOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any[]) => void;
  onError?: (error: string) => void;
}

export function useClickHouseQuery<T = any>(
  query: string,
  params?: Record<string, any>,
  options?: UseClickHouseOptions
): QueryResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    enabled = true, 
    refetchInterval, 
    onSuccess, 
    onError 
  } = options || {};

  const fetchData = useCallback(async () => {
    if (!enabled || !query) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clickhouse/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, params }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        onSuccess?.(result.data);
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [query, params, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();

    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for mutations (INSERT, UPDATE, etc.)
export function useClickHouseMutation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (
    query: string, 
    params?: Record<string, any>
  ): Promise<{ success: boolean; data?: T[]; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clickhouse/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, params }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Mutation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
```

## 📊 Dashboard Components

### Orders Dashboard Component

Create `components/OrdersDashboard.tsx`:

```tsx
// components/OrdersDashboard.tsx
'use client';

import { useClickHouseQuery } from '@/hooks/useClickHouse';
import { useState } from 'react';

interface Order {
  order_id: string;
  customer_id: string;
  order_timestamp: string;
  order_value: number;
  currency: string;
  channel: string;
  item_count: number;
  is_first_order: boolean;
  customer_tags: string[];
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  unique_customers: number;
  avg_order_value: number;
}

export default function OrdersDashboard() {
  const [dateRange, setDateRange] = useState(7); // days
  
  // Query for order list
  const ordersQuery = `
    SELECT 
      order_id,
      customer_id,
      order_timestamp,
      order_value,
      currency,
      channel,
      item_count,
      is_first_order,
      customer_tags
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${dateRange} DAY
    ORDER BY order_timestamp DESC
    LIMIT 100
  `;

  // Query for statistics
  const statsQuery = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(order_value) as total_revenue,
      COUNT(DISTINCT customer_id) as unique_customers,
      AVG(order_value) as avg_order_value
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${dateRange} DAY
  `;

  const { 
    data: orders, 
    loading: ordersLoading, 
    error: ordersError, 
    refetch: refetchOrders 
  } = useClickHouseQuery<Order>(ordersQuery);

  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError 
  } = useClickHouseQuery<OrderStats>(statsQuery);

  const loading = ordersLoading || statsLoading;
  const error = ordersError || statsError;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading data: {error}
      </div>
    );
  }

  const statsData = stats?.[0] || {
    total_orders: 0,
    total_revenue: 0,
    unique_customers: 0,
    avg_order_value: 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Orders Dashboard</h1>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button 
            onClick={refetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {statsData.total_orders.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${statsData.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Unique Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {statsData.unique_customers.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Order Value</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${statsData.avg_order_value.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders?.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="truncate w-32" title={order.customer_id}>
                      {order.customer_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.order_timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {order.currency} {order.order_value.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.item_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {order.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.is_first_order && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        First Order
                      </span>
                    )}
                    {order.customer_tags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {order.customer_tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

## 📈 Query Service

### Reusable Query Library

Create `lib/clickhouse-queries.ts`:

```typescript
// lib/clickhouse-queries.ts

export const clickhouseQueries = {
  // Order Analytics
  getOrderStats: (days: number = 30) => `
    SELECT 
      COUNT(*) as total_orders,
      COUNT(DISTINCT customer_id) as unique_customers,
      SUM(order_value) as total_revenue,
      AVG(order_value) as avg_order_value,
      MAX(order_value) as max_order_value,
      MIN(order_value) as min_order_value,
      SUM(CASE WHEN is_first_order THEN 1 ELSE 0 END) as first_time_orders,
      SUM(item_count) as total_items_sold
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
  `,

  getOrdersByDay: (days: number = 30) => `
    SELECT 
      toDate(order_timestamp) as date,
      COUNT(*) as orders,
      SUM(order_value) as revenue,
      COUNT(DISTINCT customer_id) as customers,
      AVG(order_value) as avg_order_value
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
    GROUP BY date
    ORDER BY date DESC
  `,

  getOrdersByHour: (days: number = 7) => `
    SELECT 
      toHour(order_timestamp) as hour,
      COUNT(*) as orders,
      SUM(order_value) as revenue
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
    GROUP BY hour
    ORDER BY hour
  `,

  getTopProducts: (limit: number = 10, days: number = 30) => `
    SELECT 
      product_id,
      product_name,
      COUNT(*) as order_count,
      SUM(quantity) as total_quantity,
      SUM(line_total) as total_revenue,
      AVG(unit_price) as avg_price
    FROM klaviyo_order_line_items
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
    GROUP BY product_id, product_name
    ORDER BY total_revenue DESC
    LIMIT ${limit}
  `,

  getTopCollections: (limit: number = 10, days: number = 30) => `
    SELECT 
      arrayJoin(collections) as collection,
      COUNT(*) as product_count,
      SUM(line_total) as total_revenue
    FROM klaviyo_order_line_items
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
      AND length(collections) > 0
    GROUP BY collection
    ORDER BY total_revenue DESC
    LIMIT ${limit}
  `,

  getCustomerSegments: () => `
    SELECT 
      CASE 
        WHEN order_count = 1 THEN 'New Customers'
        WHEN order_count BETWEEN 2 AND 5 THEN 'Regular Customers'
        WHEN order_count BETWEEN 6 AND 10 THEN 'Loyal Customers'
        ELSE 'VIP Customers'
      END as segment,
      COUNT(*) as customer_count,
      SUM(lifetime_value) as total_lifetime_value,
      AVG(lifetime_value) as avg_lifetime_value,
      AVG(order_count) as avg_orders_per_customer
    FROM klaviyo_customer_summary
    GROUP BY segment
    ORDER BY avg_lifetime_value DESC
  `,

  getCustomerRetention: (months: number = 12) => `
    WITH first_orders AS (
      SELECT 
        customer_id,
        MIN(order_timestamp) as first_order_date
      FROM klaviyo_orders
      GROUP BY customer_id
    ),
    cohorts AS (
      SELECT 
        customer_id,
        toYYYYMM(first_order_date) as cohort_month
      FROM first_orders
      WHERE first_order_date > now() - INTERVAL ${months} MONTH
    ),
    subsequent_orders AS (
      SELECT 
        o.customer_id,
        c.cohort_month,
        toYYYYMM(o.order_timestamp) as order_month
      FROM klaviyo_orders o
      JOIN cohorts c ON o.customer_id = c.customer_id
    )
    SELECT 
      cohort_month,
      COUNT(DISTINCT CASE WHEN order_month = cohort_month THEN customer_id END) as month_0,
      COUNT(DISTINCT CASE WHEN order_month = cohort_month + 1 THEN customer_id END) as month_1,
      COUNT(DISTINCT CASE WHEN order_month = cohort_month + 2 THEN customer_id END) as month_2,
      COUNT(DISTINCT CASE WHEN order_month = cohort_month + 3 THEN customer_id END) as month_3
    FROM subsequent_orders
    GROUP BY cohort_month
    ORDER BY cohort_month DESC
  `,

  // Campaign Performance
  getCampaignPerformance: (days: number = 30) => `
    SELECT 
      date,
      SUM(recipients) as total_recipients,
      SUM(opens_unique) as total_opens,
      SUM(clicks_unique) as total_clicks,
      SUM(conversions) as total_conversions,
      AVG(open_rate) as avg_open_rate,
      AVG(click_rate) as avg_click_rate,
      AVG(conversion_rate) as avg_conversion_rate,
      SUM(conversion_value) as total_conversion_value
    FROM flow_statistics
    WHERE date > now() - INTERVAL ${days} DAY
    GROUP BY date
    ORDER BY date DESC
  `,

  getFlowPerformance: () => `
    SELECT 
      flow_id,
      COUNT(DISTINCT flow_message_id) as message_count,
      SUM(recipients) as total_recipients,
      AVG(open_rate) as avg_open_rate,
      AVG(click_rate) as avg_click_rate,
      AVG(conversion_rate) as avg_conversion_rate,
      SUM(conversion_value) as total_revenue
    FROM flow_statistics
    WHERE date > now() - INTERVAL 30 DAY
    GROUP BY flow_id
    ORDER BY total_revenue DESC
  `,

  getFormPerformance: (days: number = 30) => `
    SELECT 
      form_id,
      SUM(viewed_form) as total_views,
      SUM(submits) as total_submits,
      AVG(submit_rate) as avg_submit_rate,
      SUM(viewed_form_uniques) as unique_viewers
    FROM form_statistics
    WHERE date > now() - INTERVAL ${days} DAY
    GROUP BY form_id
    ORDER BY total_submits DESC
  `,

  getSegmentGrowth: (days: number = 30) => `
    SELECT 
      segment_id,
      date,
      total_members,
      daily_change,
      new_members,
      removed_members
    FROM segment_statistics
    WHERE date > now() - INTERVAL ${days} DAY
    ORDER BY date DESC, total_members DESC
  `,

  // Revenue Analytics
  getRevenueByChannel: (days: number = 30) => `
    SELECT 
      channel,
      COUNT(*) as order_count,
      SUM(order_value) as total_revenue,
      AVG(order_value) as avg_order_value,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
    GROUP BY channel
    ORDER BY total_revenue DESC
  `,

  getDiscountImpact: (days: number = 30) => `
    SELECT 
      CASE 
        WHEN discount_code IS NOT NULL THEN 'With Discount'
        ELSE 'No Discount'
      END as discount_status,
      COUNT(*) as order_count,
      SUM(order_value) as total_revenue,
      AVG(order_value) as avg_order_value,
      SUM(discount_amount) as total_discount_given
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
    GROUP BY discount_status
  `,

  // Geographic Analytics
  getRevenueByLocation: (days: number = 30) => `
    SELECT 
      shipping_country,
      shipping_state,
      COUNT(*) as order_count,
      SUM(order_value) as total_revenue,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM klaviyo_orders
    WHERE order_timestamp > now() - INTERVAL ${days} DAY
      AND shipping_country IS NOT NULL
    GROUP BY shipping_country, shipping_state
    ORDER BY total_revenue DESC
    LIMIT 50
  `,
};

// Type-safe query executor
export async function executeQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  const response = await fetch('/api/clickhouse/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, params }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Query failed');
  }

  const result = await response.json();
  return result.data;
}
```

## 🔒 Security Best Practices

### 1. Environment Variables
- **Never** commit `.env.local` to version control
- Add `.env.local` to `.gitignore`
- Use different credentials for development and production

### 2. API Route Security
```typescript
// Add authentication middleware
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Continue with query execution...
}
```

### 3. Query Validation
```typescript
// Query validator utility
export function validateQuery(query: string): { valid: boolean; error?: string } {
  // Check for dangerous operations
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /TRUNCATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /CREATE\s+TABLE/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+.*\s+SET/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return { 
        valid: false, 
        error: `Dangerous operation detected: ${pattern}` 
      };
    }
  }

  // Check query length
  if (query.length > 10000) {
    return { valid: false, error: 'Query too long' };
  }

  return { valid: true };
}
```

### 4. Rate Limiting
```typescript
// Simple rate limiting implementation
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number>({
  max: 500,
  ttl: 1000 * 60, // 1 minute
});

export function rateLimit(userId: string, limit: number = 10): boolean {
  const current = rateLimitCache.get(userId) || 0;
  
  if (current >= limit) {
    return false; // Rate limit exceeded
  }
  
  rateLimitCache.set(userId, current + 1);
  return true;
}

// Use in API route
if (!rateLimit(session.user.id)) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

## 🧪 Testing

### Connection Test Component

Create `components/TestConnection.tsx`:

```tsx
// components/TestConnection.tsx
'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
}

export default function TestConnection() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const tests = [
    {
      name: 'Connection Test',
      query: 'SELECT 1 as test, version() as version'
    },
    {
      name: 'Orders Count',
      query: 'SELECT COUNT(*) as count FROM klaviyo_orders'
    },
    {
      name: 'Recent Orders',
      query: 'SELECT COUNT(*) as count FROM klaviyo_orders WHERE order_timestamp > now() - INTERVAL 1 DAY'
    },
    {
      name: 'Tables List',
      query: "SELECT name FROM system.tables WHERE database = 'wizel'"
    }
  ];

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    for (const test of tests) {
      try {
        const response = await fetch('/api/clickhouse/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: test.query })
        });
        
        const data = await response.json();
        
        setResults(prev => [...prev, {
          success: data.success,
          data: data.data,
          error: data.error,
          timestamp: new Date().toISOString(),
          ...test
        }]);
      } catch (error) {
        setResults(prev => [...prev, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          ...test
        }]);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">ClickHouse Connection Test</h2>
        
        <button 
          onClick={runTests}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Running Tests...' : 'Run Connection Tests'}
        </button>
        
        {results.length > 0 && (
          <div className="mt-6 space-y-4">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{result.name}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Query: <code className="bg-gray-100 px-1 py-0.5 rounded">{result.query}</code>
                </div>
                
                {result.success ? (
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                ) : (
                  <div className="text-red-600 text-sm">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Test in Development

1. Start your Next.js development server:
```bash
npm run dev
```

2. Navigate to your test page
3. Check the browser console for any errors
4. Verify the network tab shows successful API calls

## 🚀 Deployment Considerations

### Production Environment Variables

For production deployment (Vercel, Netlify, etc.), add these environment variables:

```env
CLICKHOUSE_HOST=kis8xv8y1f.us-east-1.aws.clickhouse.cloud
CLICKHOUSE_DATABASE=default
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=kivR_vYaWBs8B
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
```

### Vercel Deployment

```json
// vercel.json
{
  "env": {
    "CLICKHOUSE_HOST": "@clickhouse_host",
    "CLICKHOUSE_DATABASE": "@clickhouse_database",
    "CLICKHOUSE_USER": "@clickhouse_user",
    "CLICKHOUSE_PASSWORD": "@clickhouse_password",
    "CLICKHOUSE_PORT": "@clickhouse_port",
    "CLICKHOUSE_SECURE": "@clickhouse_secure"
  }
}
```

### Performance Optimization

1. **Connection Pooling**: The ClickHouse client handles connection pooling automatically
2. **Query Caching**: Consider implementing Redis or in-memory caching for frequently accessed data
3. **Pagination**: Always paginate large result sets
4. **Materialized Views**: Create materialized views in ClickHouse for complex aggregations

## 📚 Additional Resources

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [ClickHouse Node.js Client](https://github.com/ClickHouse/clickhouse-js)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React Query](https://tanstack.com/query) - Alternative data fetching library

## 🐛 Troubleshooting

### Common Issues and Solutions

1. **SSL Certificate Errors**
   - Add `verify: false` to client configuration for development
   - Use proper certificates in production

2. **CORS Errors**
   - Ensure API routes are properly configured
   - Check Next.js middleware configuration

3. **Query Timeout**
   - Increase timeout in ClickHouse client settings
   - Optimize queries with proper indexes

4. **Memory Issues with Large Results**
   - Use streaming for large datasets
   - Implement pagination
   - Limit result set size

## 📈 Database Schema

### Main Analytics Tables

The ClickHouse database contains the following tables for analytics:

#### `analytics.orders`
- Primary key: `klaviyo_public_key`
- Contains order data aggregated by Klaviyo integration
- Used for revenue, order counts, and customer analytics

#### `analytics.campaign_stats`
- Primary key: `klaviyo_public_key`
- Campaign performance metrics (opens, clicks, conversions)
- Aggregated by campaign and date

#### `analytics.flow_stats`
- Primary key: `klaviyo_public_key`
- Flow automation performance data
- Completion rates and revenue attribution

#### `analytics.segment_stats`
- Primary key: `klaviyo_public_key`
- Customer segment growth and engagement metrics

### Key Aggregation Pattern

**IMPORTANT**: All analytics queries must aggregate by `klaviyo_public_key` to support multi-store reporting:

```sql
-- Example: Get revenue for multiple stores
SELECT 
  klaviyo_public_key,
  SUM(revenue) as total_revenue
FROM analytics.orders
WHERE klaviyo_public_key IN ('key1', 'key2', 'key3')
  AND date >= '2025-01-01'
GROUP BY klaviyo_public_key
```

---

**Last Updated**: September 2025  
**Version**: 2.0.0  
**Connection**: AWS ClickHouse Cloud (kis8xv8y1f.us-east-1.aws.clickhouse.cloud)
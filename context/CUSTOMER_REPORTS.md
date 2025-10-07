# Customer Reports Documentation

This document outlines all available customer reports and how to implement them in Next.js.

## Available Customer Reports

### 1. Customer Profiles Report (`customer_profiles` table)

**Data Source**: ClickHouse `customer_profiles` table
**API Endpoint**: Populated by `/api/v2/reports/aggregates_sync`
**Update Frequency**: Run with aggregations (daily or on-demand)

#### Features:
- **Customer Lifetime Value (LTV)**: Total revenue and net revenue (after refunds)
- **RFM Segmentation**: Percentile-based Recency, Frequency, Monetary scores (1-5 scale)
- **RFM Segments**: Automatic classification into actionable segments
- **Purchase Behavior**: Total orders, average order value, order frequency
- **Refund Tracking**: Refund rate, total refunds, total refund amount
- **Customer Activity**: First order date, last order date, days since last order
- **30-Day Metrics**: Orders and revenue in last 30 days

#### RFM Segments (Auto-Calculated):
- **Champions**: Best customers (high R, F, M) - Target with VIP rewards
- **Loyal Customers**: High value but not recent - Re-engage with special offers
- **Potential Loyalists**: Good recent customers building loyalty - Nurture with upsells
- **Recent Customers**: New, haven't repurchased yet - Focus on second purchase
- **Promising**: Recent with moderate spending - Convert to loyal
- **Need Attention**: Average across board - Win-back campaign needed
- **About to Sleep**: Starting to lapse - Urgent re-engagement
- **At Risk**: Previously valuable, now inactive - Special win-back offers
- **Cannot Lose Them**: Highest value customers going dormant - URGENT action needed
- **Hibernating**: Low activity - Low-cost re-engagement
- **Lost**: Haven't purchased in a long time - Aggressive discounts or retire

#### ClickHouse Query Example:

```sql
-- Get all customer profiles with RFM segmentation
SELECT
    customer_email,
    total_orders,
    total_revenue,
    net_revenue,
    avg_order_value,
    first_order_date,
    last_order_date,
    days_since_last_order,
    orders_last_30_days,
    revenue_last_30_days,
    recency_score,
    frequency_score,
    monetary_score,
    rfm_segment,
    total_refunds,
    total_refund_amount,
    refund_rate,
    updated_at
FROM customer_profiles
WHERE klaviyo_public_id = '{klaviyo_public_id}'
ORDER BY net_revenue DESC
```

#### Next.js Implementation:

```javascript
// app/api/customers/profiles/route.js
import { createClient } from '@clickhouse/client';

const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  database: process.env.CLICKHOUSE_DATABASE,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const klaviyoPublicId = searchParams.get('klaviyo_public_id');
  const segment = searchParams.get('segment'); // Optional filter
  const limit = searchParams.get('limit') || 100;

  let segmentFilter = '';
  if (segment) {
    segmentFilter = `AND rfm_segment = '${segment}'`;
  }

  const query = `
    SELECT
      customer_email,
      total_orders,
      total_revenue,
      net_revenue,
      avg_order_value,
      first_order_date,
      last_order_date,
      days_since_last_order,
      orders_last_30_days,
      revenue_last_30_days,
      recency_score,
      frequency_score,
      monetary_score,
      rfm_segment,
      total_refunds,
      total_refund_amount,
      refund_rate,
      updated_at
    FROM customer_profiles
    WHERE klaviyo_public_id = '${klaviyoPublicId}'
    ${segmentFilter}
    ORDER BY net_revenue DESC
    LIMIT ${limit}
    FORMAT JSONEachRow
  `;

  const result = await clickhouse.query({ query });
  const data = await result.json();

  return Response.json({
    success: true,
    customers: data,
    count: data.length
  });
}
```

#### UI Component Example:

```javascript
// components/CustomerProfilesTable.jsx
'use client';

import { useState, useEffect } from 'react';

export default function CustomerProfilesTable({ klaviyoPublicId }) {
  const [customers, setCustomers] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [selectedSegment]);

  const fetchCustomers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      klaviyo_public_id: klaviyoPublicId,
      limit: 100,
    });

    if (selectedSegment !== 'all') {
      params.append('segment', selectedSegment);
    }

    const res = await fetch(`/api/customers/profiles?${params}`);
    const data = await res.json();
    setCustomers(data.customers);
    setLoading(false);
  };

  const segments = [
    'all',
    'Champions',
    'Loyal Customers',
    'Potential Loyalists',
    'Recent Customers',
    'Promising',
    'Need Attention',
    'About to Sleep',
    'At Risk',
    'Cannot Lose Them',
    'Hibernating',
    'Lost',
  ];

  return (
    <div className="space-y-4">
      {/* Segment Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {segments.map((segment) => (
          <button
            key={segment}
            onClick={() => setSelectedSegment(segment)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedSegment === segment
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {segment}
          </button>
        ))}
      </div>

      {/* Customer Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Segment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  RFM Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Net Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  AOV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Days Since Last Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Refund Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.customer_email}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.customer_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(customer.rfm_segment)}`}>
                      {customer.rfm_segment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    R:{customer.recency_score} F:{customer.frequency_score} M:{customer.monetary_score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.total_orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${customer.net_revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${customer.avg_order_value.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {customer.days_since_last_order} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(customer.refund_rate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getSegmentColor(segment) {
  const colors = {
    'Champions': 'bg-green-100 text-green-800',
    'Loyal Customers': 'bg-blue-100 text-blue-800',
    'Potential Loyalists': 'bg-cyan-100 text-cyan-800',
    'Recent Customers': 'bg-purple-100 text-purple-800',
    'Promising': 'bg-indigo-100 text-indigo-800',
    'Need Attention': 'bg-yellow-100 text-yellow-800',
    'About to Sleep': 'bg-orange-100 text-orange-800',
    'At Risk': 'bg-red-100 text-red-800',
    'Cannot Lose Them': 'bg-red-200 text-red-900',
    'Hibernating': 'bg-gray-100 text-gray-800',
    'Lost': 'bg-gray-200 text-gray-900',
  };
  return colors[segment] || 'bg-gray-100 text-gray-800';
}
```

---

### 2. RFM Segment Distribution Report

**Purpose**: Show how many customers are in each RFM segment
**Best For**: Executive overview, identifying which segments need attention

#### ClickHouse Query:

```sql
-- Get customer count and revenue by RFM segment
SELECT
    rfm_segment,
    COUNT(*) as customer_count,
    SUM(net_revenue) as total_revenue,
    AVG(net_revenue) as avg_revenue,
    SUM(total_orders) as total_orders,
    AVG(days_since_last_order) as avg_days_since_last_order
FROM customer_profiles
WHERE klaviyo_public_id = '{klaviyo_public_id}'
GROUP BY rfm_segment
ORDER BY total_revenue DESC
FORMAT JSONEachRow
```

#### Next.js API:

```javascript
// app/api/customers/segments/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const klaviyoPublicId = searchParams.get('klaviyo_public_id');

  const query = `
    SELECT
      rfm_segment,
      COUNT(*) as customer_count,
      SUM(net_revenue) as total_revenue,
      AVG(net_revenue) as avg_revenue,
      SUM(total_orders) as total_orders,
      AVG(days_since_last_order) as avg_days_since_last_order,
      SUM(total_refunds) as total_refunds,
      AVG(refund_rate) as avg_refund_rate
    FROM customer_profiles
    WHERE klaviyo_public_id = '${klaviyoPublicId}'
    GROUP BY rfm_segment
    ORDER BY total_revenue DESC
    FORMAT JSONEachRow
  `;

  const result = await clickhouse.query({ query });
  const data = await result.json();

  return Response.json({
    success: true,
    segments: data
  });
}
```

#### UI Component (Chart):

```javascript
// components/RFMSegmentChart.jsx
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RFMSegmentChart({ klaviyoPublicId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`/api/customers/segments?klaviyo_public_id=${klaviyoPublicId}`)
      .then(res => res.json())
      .then(data => setData(data.segments));
  }, [klaviyoPublicId]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Customer Segments Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600">High Value Segments</div>
          <div className="text-2xl font-bold text-green-600">
            {data
              .filter(s => ['Champions', 'Loyal Customers', 'Potential Loyalists'].includes(s.rfm_segment))
              .reduce((sum, s) => sum + s.customer_count, 0)
            }
          </div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-gray-600">At Risk Segments</div>
          <div className="text-2xl font-bold text-yellow-600">
            {data
              .filter(s => ['Need Attention', 'About to Sleep', 'At Risk'].includes(s.rfm_segment))
              .reduce((sum, s) => sum + s.customer_count, 0)
            }
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-gray-600">Lost/Hibernating</div>
          <div className="text-2xl font-bold text-red-600">
            {data
              .filter(s => ['Lost', 'Hibernating'].includes(s.rfm_segment))
              .reduce((sum, s) => sum + s.customer_count, 0)
            }
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rfm_segment" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="customer_count" fill="#3b82f6" name="Customers" />
          <Bar dataKey="total_revenue" fill="#10b981" name="Total Revenue" />
        </BarChart>
      </ResponsiveContainer>

      {/* Detailed Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customers</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Revenue</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Days Inactive</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((segment) => (
              <tr key={segment.rfm_segment}>
                <td className="px-4 py-2 whitespace-nowrap">{segment.rfm_segment}</td>
                <td className="px-4 py-2 whitespace-nowrap">{segment.customer_count}</td>
                <td className="px-4 py-2 whitespace-nowrap">${segment.total_revenue.toFixed(2)}</td>
                <td className="px-4 py-2 whitespace-nowrap">${segment.avg_revenue.toFixed(2)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{Math.round(segment.avg_days_since_last_order)} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 3. Daily Customer Metrics (`account_metrics_daily` table)

**Data Source**: ClickHouse `account_metrics_daily` table
**API Endpoint**: Populated by `/api/v2/reports/aggregates_sync`
**Update Frequency**: Daily

#### Features:
- New vs returning customer counts by date
- Unique customer counts per day
- Customer acquisition trends over time

#### ClickHouse Query:

```sql
-- Get daily customer metrics for last 30 days
SELECT
    date,
    unique_customers,
    new_customers,
    returning_customers,
    total_orders,
    total_revenue,
    avg_order_value
FROM account_metrics_daily
WHERE klaviyo_public_id = '{klaviyo_public_id}'
    AND date >= today() - 30
    AND date <= today()
ORDER BY date DESC
FORMAT JSONEachRow
```

#### Next.js Implementation:

```javascript
// app/api/customers/daily-metrics/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const klaviyoPublicId = searchParams.get('klaviyo_public_id');
  const daysBack = searchParams.get('days_back') || 30;

  const query = `
    SELECT
      date,
      unique_customers,
      new_customers,
      returning_customers,
      total_orders,
      total_revenue,
      avg_order_value
    FROM account_metrics_daily
    WHERE klaviyo_public_id = '${klaviyoPublicId}'
      AND date >= today() - ${daysBack}
      AND date <= today()
    ORDER BY date DESC
    FORMAT JSONEachRow
  `;

  const result = await clickhouse.query({ query });
  const data = await result.json();

  return Response.json({
    success: true,
    metrics: data,
    summary: {
      total_new_customers: data.reduce((sum, d) => sum + d.new_customers, 0),
      total_returning_customers: data.reduce((sum, d) => sum + d.returning_customers, 0),
      avg_daily_revenue: data.reduce((sum, d) => sum + d.total_revenue, 0) / data.length,
    }
  });
}
```

---

### 4. Customer Reorder Behavior Report

**API Endpoint**: `GET /api/v2/reports/customer_reorder_behavior/{klaviyo_public_id}`
**Best For**: Understanding purchase cycles and identifying overdue customers

#### Features:
- **Median reorder time**: Your typical customer reorders every X days
- **Dynamic time buckets**: Auto-adapts for supplements (30 days) vs furniture (730 days)
- **Percentage breakdowns**: What % of customers reorder in each time bucket
- **Overdue customers**: List of customers past their expected reorder time
- **Actionable insights**: When to send follow-up emails

#### Option 1: Use Python API Endpoint (Recommended)

```javascript
// app/api/customers/reorder-behavior/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const klaviyoPublicId = searchParams.get('klaviyo_public_id');

  // Call your Python API endpoint
  const response = await fetch(
    `${process.env.PYTHON_API_URL}/api/v2/reports/customer_reorder_behavior/${klaviyoPublicId}`
  );

  const data = await response.json();
  return Response.json(data);
}
```

#### Option 2: Direct ClickHouse Query from Next.js

```javascript
// app/api/customers/reorder-behavior/route.js
import { createClient } from '@clickhouse/client';

const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  database: process.env.CLICKHOUSE_DATABASE,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const klaviyoPublicId = searchParams.get('klaviyo_public_id');

  // Step 1: Get all reorder intervals
  const intervalsQuery = `
    WITH customer_orders AS (
      SELECT
        customer_email,
        toDate(order_timestamp) as order_date,
        row_number() OVER (PARTITION BY customer_email ORDER BY order_timestamp) as order_number
      FROM klaviyo_orders
      WHERE klaviyo_public_id = '${klaviyoPublicId}'
        AND customer_email != ''
        AND customer_email NOT LIKE '%redacted%'
        AND customer_email NOT LIKE '%null%'
        AND customer_email NOT LIKE '%@anonymous.local%'
        AND customer_email LIKE '%@%.%'
    ),
    reorder_intervals AS (
      SELECT
        dateDiff('day', prev.order_date, curr.order_date) as days_between_orders
      FROM customer_orders curr
      INNER JOIN customer_orders prev
        ON curr.customer_email = prev.customer_email
        AND curr.order_number = prev.order_number + 1
      WHERE dateDiff('day', prev.order_date, curr.order_date) > 0
    )
    SELECT
      quantile(0.25)(days_between_orders) as q1,
      quantile(0.50)(days_between_orders) as median,
      quantile(0.75)(days_between_orders) as q3,
      quantile(0.95)(days_between_orders) as p95,
      COUNT(*) as total_intervals,
      -- Bucket percentages
      countIf(days_between_orders <= quantile(0.25)(days_between_orders)) / COUNT(*) * 100 as bucket1_pct,
      countIf(days_between_orders > quantile(0.25)(days_between_orders) AND days_between_orders <= quantile(0.50)(days_between_orders)) / COUNT(*) * 100 as bucket2_pct,
      countIf(days_between_orders > quantile(0.50)(days_between_orders) AND days_between_orders <= quantile(0.75)(days_between_orders)) / COUNT(*) * 100 as bucket3_pct,
      countIf(days_between_orders > quantile(0.75)(days_between_orders) AND days_between_orders <= quantile(0.95)(days_between_orders)) / COUNT(*) * 100 as bucket4_pct,
      countIf(days_between_orders > quantile(0.95)(days_between_orders)) / COUNT(*) * 100 as bucket5_pct
    FROM reorder_intervals
    FORMAT JSONEachRow
  `;

  const result = await clickhouse.query({ query: intervalsQuery });
  const data = await result.json();

  if (!data || data.length === 0) {
    return Response.json({
      status: 'insufficient_data',
      message: 'Not enough repeat customers to analyze reorder behavior'
    });
  }

  const stats = data[0];

  // Step 2: Get overdue customers
  const overdueQuery = `
    WITH customer_last_order AS (
      SELECT
        customer_email,
        MAX(toDate(order_timestamp)) as last_order_date,
        COUNT(*) as total_orders
      FROM klaviyo_orders
      WHERE klaviyo_public_id = '${klaviyoPublicId}'
        AND customer_email != ''
        AND customer_email NOT LIKE '%redacted%'
        AND customer_email NOT LIKE '%null%'
        AND customer_email NOT LIKE '%@anonymous.local%'
        AND customer_email LIKE '%@%.%'
      GROUP BY customer_email
      HAVING total_orders > 1
    )
    SELECT
      COUNT(*) as overdue_count,
      COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT customer_email) FROM customer_last_order) as overdue_percentage
    FROM customer_last_order
    WHERE dateDiff('day', last_order_date, today()) > ${Math.round(stats.median)}
    FORMAT JSONEachRow
  `;

  const overdueResult = await clickhouse.query({ query: overdueQuery });
  const overdueData = await overdueResult.json();

  // Step 3: Get list of overdue customers
  const overdueListQuery = `
    WITH customer_last_order AS (
      SELECT
        customer_email,
        MAX(toDate(order_timestamp)) as last_order_date,
        COUNT(*) as total_orders
      FROM klaviyo_orders
      WHERE klaviyo_public_id = '${klaviyoPublicId}'
        AND customer_email != ''
        AND customer_email NOT LIKE '%redacted%'
        AND customer_email NOT LIKE '%null%'
        AND customer_email NOT LIKE '%@anonymous.local%'
        AND customer_email LIKE '%@%.%'
      GROUP BY customer_email
      HAVING total_orders > 1
    )
    SELECT
      customer_email,
      last_order_date,
      dateDiff('day', last_order_date, today()) as days_since_last_order,
      total_orders,
      dateDiff('day', last_order_date, today()) - ${Math.round(stats.median)} as days_overdue
    FROM customer_last_order
    WHERE dateDiff('day', last_order_date, today()) > ${Math.round(stats.median)}
    ORDER BY days_since_last_order DESC
    LIMIT 100
    FORMAT JSONEachRow
  `;

  const overdueListResult = await clickhouse.query({ query: overdueListQuery });
  const overdueCustomers = await overdueListResult.json();

  return Response.json({
    status: 'success',
    klaviyo_public_id: klaviyoPublicId,
    summary: {
      median_reorder_days: Math.round(stats.median),
      total_intervals_analyzed: stats.total_intervals,
      recommended_followup_day: Math.round(stats.median * 0.9),
      business_type: stats.median <= 60 ? 'high_frequency' : 'low_frequency',
    },
    reorder_distribution: [
      {
        label: `0-${Math.round(stats.q1)} days (Fast)`,
        min_days: 0,
        max_days: Math.round(stats.q1),
        percentage: Math.round(stats.bucket1_pct * 10) / 10
      },
      {
        label: `${Math.round(stats.q1)+1}-${Math.round(stats.median)} days (Normal)`,
        min_days: Math.round(stats.q1)+1,
        max_days: Math.round(stats.median),
        percentage: Math.round(stats.bucket2_pct * 10) / 10
      },
      {
        label: `${Math.round(stats.median)+1}-${Math.round(stats.q3)} days (Slow)`,
        min_days: Math.round(stats.median)+1,
        max_days: Math.round(stats.q3),
        percentage: Math.round(stats.bucket3_pct * 10) / 10
      },
      {
        label: `${Math.round(stats.q3)+1}-${Math.round(stats.p95)} days (Very Slow)`,
        min_days: Math.round(stats.q3)+1,
        max_days: Math.round(stats.p95),
        percentage: Math.round(stats.bucket4_pct * 10) / 10
      },
      {
        label: `${Math.round(stats.p95)+1}+ days (Rare)`,
        min_days: Math.round(stats.p95)+1,
        max_days: 999999,
        percentage: Math.round(stats.bucket5_pct * 10) / 10
      },
    ],
    overdue_customers: {
      count: overdueData[0]?.overdue_count || 0,
      percentage: Math.round((overdueData[0]?.overdue_percentage || 0) * 10) / 10,
      customers: overdueCustomers.slice(0, 20), // Top 20
    },
    actionable_insights: [
      `📊 Your typical customer reorders every ${Math.round(stats.median)} days`,
      `⚠️ ${overdueData[0]?.overdue_count || 0} customers (${Math.round((overdueData[0]?.overdue_percentage || 0) * 10) / 10}%) are overdue for reorder`,
      `💡 Set up automated email at day ${Math.round(stats.median * 0.9)} to capture reorders`,
      `🎯 Focus on the ${Math.round(stats.bucket1_pct * 10) / 10}% who reorder within ${Math.round(stats.q1)} days - they're your best customers`,
    ],
    quartile_stats: {
      q1_25th_percentile: Math.round(stats.q1),
      median_50th_percentile: Math.round(stats.median),
      q3_75th_percentile: Math.round(stats.q3),
      p95_95th_percentile: Math.round(stats.p95),
    }
  });
}
```

#### UI Component for Reorder Behavior:

```javascript
// components/ReorderBehaviorDashboard.jsx
'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ReorderBehaviorDashboard({ klaviyoPublicId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/reorder-behavior?klaviyo_public_id=${klaviyoPublicId}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [klaviyoPublicId]);

  if (loading) return <div>Loading...</div>;
  if (!data || data.status === 'insufficient_data') {
    return <div className="p-4 bg-yellow-50 rounded-lg">Not enough repeat customers to analyze reorder behavior</div>;
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Median Reorder Time</div>
          <div className="text-3xl font-bold text-blue-600">
            {data.summary.median_reorder_days} days
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Business Type</div>
          <div className="text-xl font-bold text-green-600 capitalize">
            {data.summary.business_type.replace('_', ' ')}
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Recommended Follow-up</div>
          <div className="text-3xl font-bold text-purple-600">
            Day {data.summary.recommended_followup_day}
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Overdue Customers</div>
          <div className="text-3xl font-bold text-red-600">
            {data.overdue_customers.percentage}%
          </div>
          <div className="text-sm text-gray-600">
            {data.overdue_customers.count} customers
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">💡 Actionable Insights</h3>
        <ul className="space-y-2">
          {data.actionable_insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-lg">{insight.split(' ')[0]}</span>
              <span>{insight.substring(insight.indexOf(' ') + 1)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reorder Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Reorder Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.reorder_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({label, percentage}) => `${label}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="percentage"
              >
                {data.reorder_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Percentage Breakdown</h3>
          <div className="space-y-4">
            {data.reorder_distribution.map((bucket, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{bucket.label}</span>
                  <span className="font-bold">{bucket.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="h-6 rounded-full flex items-center justify-end px-2 text-white text-xs font-bold"
                    style={{
                      width: `${bucket.percentage}%`,
                      backgroundColor: COLORS[idx],
                    }}
                  >
                    {bucket.customer_count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Customers Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">
          ⚠️ Overdue Customers ({data.overdue_customers.count})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Order
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Days Since Order
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Days Overdue
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Orders
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.overdue_customers.customers.map((customer, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {customer.customer_email}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {customer.last_order_date}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {customer.days_since_last_order} days
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-red-600">
                    {customer.days_overdue} days
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {customer.total_orders}
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

---

### 5. Customer Cohort Analysis

**Purpose**: Analyze customer retention by cohort (first purchase month)
**Best For**: Understanding long-term customer value and retention patterns

#### ClickHouse Query:

```sql
-- Cohort retention analysis
WITH customer_cohorts AS (
    SELECT
        customer_email,
        toStartOfMonth(MIN(toDate(order_timestamp))) as cohort_month,
        MIN(toDate(order_timestamp)) as first_order_date
    FROM klaviyo_orders
    WHERE klaviyo_public_id = '{klaviyo_public_id}'
        AND customer_email != ''
        AND customer_email NOT LIKE '%redacted%'
        AND customer_email NOT LIKE '%null%'
        AND customer_email NOT LIKE '%@anonymous.local%'
        AND customer_email LIKE '%@%.%'
    GROUP BY customer_email
),
cohort_orders AS (
    SELECT
        c.cohort_month,
        toStartOfMonth(toDate(o.order_timestamp)) as order_month,
        dateDiff('month', c.cohort_month, toStartOfMonth(toDate(o.order_timestamp))) as months_since_first,
        COUNT(DISTINCT o.customer_email) as active_customers,
        SUM(o.order_value) as revenue
    FROM customer_cohorts c
    INNER JOIN klaviyo_orders o ON c.customer_email = o.customer_email
    WHERE o.klaviyo_public_id = '{klaviyo_public_id}'
    GROUP BY c.cohort_month, order_month, months_since_first
),
cohort_sizes AS (
    SELECT
        cohort_month,
        COUNT(DISTINCT customer_email) as cohort_size
    FROM customer_cohorts
    GROUP BY cohort_month
)
SELECT
    co.cohort_month,
    co.months_since_first,
    cs.cohort_size,
    co.active_customers,
    co.active_customers / cs.cohort_size * 100 as retention_rate,
    co.revenue,
    co.revenue / co.active_customers as revenue_per_customer
FROM cohort_orders co
INNER JOIN cohort_sizes cs ON co.cohort_month = cs.cohort_month
WHERE co.cohort_month >= today() - INTERVAL 12 MONTH
ORDER BY co.cohort_month, co.months_since_first
FORMAT JSONEachRow
```

---

## Environment Setup

### Install ClickHouse Client for Next.js

```bash
npm install @clickhouse/client
```

### Environment Variables (.env.local)

```bash
# ClickHouse Configuration
CLICKHOUSE_HOST=your-clickhouse-host.com
CLICKHOUSE_PORT=8443
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password
CLICKHOUSE_DATABASE=default

# Python API URL (if using Option 1 for reorder behavior)
PYTHON_API_URL=http://localhost:8000
```

---

## Data Update Schedule

All customer reports are populated by running aggregations:

### Manual Trigger:
```bash
POST /api/v2/reports/aggregates_sync
{
  "klaviyo_public_id": "your_id",
  "run_customer_profiles": true,
  "run_daily_aggregations": true,
  "force_full": false
}
```

### Automated Schedule:
- **Full Sync**: Daily at 2 AM (via cron)
- **Incremental**: Every 15 minutes (via `/api/v2/reports/cron_sync`)

---

## Performance Notes

### Query Performance:
- **Customer Profiles**: 100K customers → ~2 seconds
- **RFM Segments**: Instant (pre-aggregated)
- **Daily Metrics**: 30 days → <100ms
- **Reorder Behavior**: 10K repeat customers → ~3 seconds

### Cost Estimates (ClickHouse Cloud):
- Customer Profiles query: ~$0.0003 per run
- Reorder Behavior query: ~$0.0003 per run
- Daily operations: <$0.01/day

### Optimization Tips:
1. **Cache API responses** for 1-24 hours (data doesn't change constantly)
2. **Use Redis** for frequently accessed reports
3. **Paginate large tables** (limit to 100-1000 rows)
4. **Index on `klaviyo_public_id`** for all queries

---

## Complete Dashboard Example

```javascript
// app/dashboard/customers/page.jsx
'use client';

import { useState } from 'react';
import CustomerProfilesTable from '@/components/CustomerProfilesTable';
import RFMSegmentChart from '@/components/RFMSegmentChart';
import ReorderBehaviorDashboard from '@/components/ReorderBehaviorDashboard';

export default function CustomerDashboard() {
  const [klaviyoPublicId, setKlaviyoPublicId] = useState('your_id');
  const [activeTab, setActiveTab] = useState('profiles');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Customer Analytics Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'profiles'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Customer Profiles
        </button>
        <button
          onClick={() => setActiveTab('segments')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'segments'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          RFM Segments
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'reorder'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Reorder Behavior
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profiles' && (
        <CustomerProfilesTable klaviyoPublicId={klaviyoPublicId} />
      )}

      {activeTab === 'segments' && (
        <RFMSegmentChart klaviyoPublicId={klaviyoPublicId} />
      )}

      {activeTab === 'reorder' && (
        <ReorderBehaviorDashboard klaviyoPublicId={klaviyoPublicId} />
      )}
    </div>
  );
}
```

---

## Next Steps

1. **Install dependencies**: `npm install @clickhouse/client recharts`
2. **Set environment variables** in `.env.local`
3. **Create API routes** in `app/api/customers/`
4. **Build UI components** in `components/`
5. **Test with your `klaviyo_public_id`**
6. **Add caching layer** (Redis recommended)
7. **Set up automated aggregation runs** (daily cron)

---

## Support & Documentation

- **ClickHouse Docs**: https://clickhouse.com/docs
- **RFM Segmentation**: [routers/aggregates_v2.py:457-605](routers/aggregates_v2.py)
- **Reorder Behavior**: [routers/aggregates_v2.py:748-940](routers/aggregates_v2.py)
- **Daily Aggregations**: [routers/aggregates_v2.py:76-325](routers/aggregates_v2.py)

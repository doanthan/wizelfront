import { createClient } from '@clickhouse/client';

// Your ClickHouse connection details
const client = createClient({
  url: 'https://kis8xv8y1f.us-east-1.aws.clickhouse.cloud:8443',
  username: 'default',
  password: 'kivR_vYaWBs8B',
  database: 'default',
});

async function testClickHouse() {
  try {
    console.log('🔍 Testing ClickHouse connection...\n');

    // Test 1: Check what tables exist
    console.log('1️⃣ Available tables:');
    const tablesResult = await client.query({
      query: "SHOW TABLES",
      format: 'JSONEachRow'
    });
    const tables = await tablesResult.json();
    console.log('Tables:', tables.map(t => t.name));
    console.log('\n');

    // Test 2: Check date range in account_metrics_daily
    console.log('2️⃣ Date range in account_metrics_daily:');
    const dateRangeResult = await client.query({
      query: `
        SELECT
          min(date) as min_date,
          max(date) as max_date,
          count(DISTINCT date) as total_days,
          count(DISTINCT klaviyo_public_id) as total_accounts
        FROM account_metrics_daily
      `,
      format: 'JSONEachRow'
    });
    const dateRange = (await dateRangeResult.json())[0];
    console.log('Date range:', dateRange);
    console.log('\n');

    // Test 3: Get data for specific date ranges
    const testRanges = [
      { start: '2025-09-18', end: '2025-09-24', label: '7 days' },
      { start: '2025-06-27', end: '2025-09-24', label: '90 days' }
    ];

    for (const range of testRanges) {
      console.log(`3️⃣ Testing ${range.label} (${range.start} to ${range.end}):`);

      const result = await client.query({
        query: `
          SELECT
            count(*) as row_count,
            sum(total_revenue) as total_revenue,
            sum(total_orders) as total_orders,
            sum(unique_customers) as unique_customers,
            count(DISTINCT date) as days_with_data
          FROM account_metrics_daily
          WHERE date >= '${range.start}'
            AND date <= '${range.end}'
            AND klaviyo_public_id IN ('XqkVGb', 'Pe5Xw6', 'VZdSUY')
        `,
        format: 'JSONEachRow'
      });

      const data = (await result.json())[0];
      console.log(`Result:`, data);
      console.log('\n');
    }

    // Test 4: Show sample of actual data
    console.log('4️⃣ Sample data from account_metrics_daily:');
    const sampleResult = await client.query({
      query: `
        SELECT
          date,
          klaviyo_public_id,
          total_revenue,
          total_orders,
          unique_customers
        FROM account_metrics_daily
        WHERE klaviyo_public_id IN ('XqkVGb', 'Pe5Xw6', 'VZdSUY')
        ORDER BY date DESC
        LIMIT 5
      `,
      format: 'JSONEachRow'
    });
    const sampleData = await sampleResult.json();
    console.table(sampleData);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
    process.exit();
  }
}

testClickHouse();
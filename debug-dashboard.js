// Debug script to test dashboard data flow
import { getClickHouseClient } from './lib/clickhouse.js';
import connectToDatabase from './lib/mongoose.js';
import Store from './models/Store.js';

console.log('🐛 Dashboard Debug Script Starting...');

// Test 1: ClickHouse Connection
async function testClickHouse() {
  console.log('\n📊 Testing ClickHouse Connection...');
  try {
    const client = getClickHouseClient();
    const result = await client.query({
      query: 'SELECT 1 as test',
      format: 'JSONEachRow'
    });
    const data = await result.json();
    console.log('✅ ClickHouse connected successfully:', data);

    // Test ClickHouse tables
    const tablesResult = await client.query({
      query: 'SHOW TABLES',
      format: 'JSONEachRow'
    });
    const tables = await tablesResult.json();
    console.log('📋 Available tables:', tables.map(t => t.name));

    return true;
  } catch (error) {
    console.error('❌ ClickHouse connection failed:', error.message);
    return false;
  }
}

// Test 2: MongoDB Connection and Stores
async function testMongoDB() {
  console.log('\n🍃 Testing MongoDB Connection and Stores...');
  try {
    await connectToDatabase();
    console.log('✅ MongoDB connected successfully');

    const stores = await Store.find({})
      .select('name public_id klaviyo_integration')
      .lean();

    console.log(`📊 Found ${stores.length} stores in database:`);
    stores.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.name}`);
      console.log(`     - public_id: ${store.public_id}`);
      console.log(`     - klaviyo_integration: ${store.klaviyo_integration ? 'YES' : 'NO'}`);
      if (store.klaviyo_integration?.public_id) {
        console.log(`     - klaviyo_public_id: ${store.klaviyo_integration.public_id}`);
      }
    });

    const storesWithKlaviyo = stores.filter(s => s.klaviyo_integration?.public_id);
    console.log(`🎹 Stores with Klaviyo integration: ${storesWithKlaviyo.length}/${stores.length}`);

    return { stores, storesWithKlaviyo };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return { stores: [], storesWithKlaviyo: [] };
  }
}

// Test 3: ClickHouse Data
async function testClickHouseData(klaviyoPublicIds) {
  if (!klaviyoPublicIds || klaviyoPublicIds.length === 0) {
    console.log('\n⚠️ No Klaviyo public IDs to test ClickHouse data');
    return;
  }

  console.log('\n📈 Testing ClickHouse Data...');
  try {
    const client = getClickHouseClient();

    // Test account_metrics_daily
    const accountMetricsQuery = `
      SELECT COUNT(*) as count, MIN(date) as min_date, MAX(date) as max_date
      FROM account_metrics_daily FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
    `;

    const accountResult = await client.query({
      query: accountMetricsQuery,
      format: 'JSONEachRow'
    });
    const accountData = await accountResult.json();
    console.log('📊 account_metrics_daily:', accountData[0]);

    // Test recent data
    const recentQuery = `
      SELECT
        klaviyo_public_id,
        date,
        total_revenue,
        total_orders,
        unique_customers
      FROM account_metrics_daily FINAL
      WHERE klaviyo_public_id IN (${klaviyoPublicIds.map(id => `'${id}'`).join(',')})
        AND date >= today() - INTERVAL 7 DAY
      ORDER BY date DESC
      LIMIT 10
    `;

    const recentResult = await client.query({
      query: recentQuery,
      format: 'JSONEachRow'
    });
    const recentData = await recentResult.json();
    console.log('📅 Recent 7 days data:', recentData);

  } catch (error) {
    console.error('❌ ClickHouse data test failed:', error.message);
  }
}

// Run all tests
async function runDebug() {
  const clickHouseOk = await testClickHouse();
  const { stores, storesWithKlaviyo } = await testMongoDB();

  if (clickHouseOk && storesWithKlaviyo.length > 0) {
    const klaviyoIds = storesWithKlaviyo.map(s => s.klaviyo_integration.public_id);
    await testClickHouseData(klaviyoIds);
  }

  console.log('\n🏁 Debug Complete!');
  console.log('\n🔍 Summary:');
  console.log(`   - ClickHouse: ${clickHouseOk ? '✅' : '❌'}`);
  console.log(`   - MongoDB Stores: ${stores.length} found`);
  console.log(`   - Klaviyo Integrations: ${storesWithKlaviyo.length} found`);

  if (storesWithKlaviyo.length === 0) {
    console.log('\n❗ ISSUE IDENTIFIED: No stores have Klaviyo integrations!');
    console.log('   This is likely why the dashboard shows zero data.');
    console.log('   Stores need klaviyo_integration.public_id to query ClickHouse.');
  }
}

runDebug().catch(console.error);
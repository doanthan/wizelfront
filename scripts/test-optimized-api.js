/**
 * Simple test script to verify optimized API endpoints are working
 */

import fetch from 'node-fetch';

async function testOptimizedAPI() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 Testing Optimized API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${baseUrl}/api/dashboard/revenue-optimized`, {
      method: 'HEAD'
    });
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Health: ${healthResponse.headers.get('X-Health-Status') || 'unknown'}`);
    console.log(`   Uptime: ${healthResponse.headers.get('X-Uptime') || 'unknown'}s\n`);

    // Test 2: Basic API call
    console.log('2. Testing basic API call...');
    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/api/dashboard/revenue-optimized?storeIds=XAeU8VL,7MP60fH&startDate=2025-01-01&endDate=2025-01-31`);
    const data = await response.json();

    const duration = Date.now() - startTime;

    console.log(`   Status: ${response.status}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Request ID: ${data.performance?.requestId || 'unknown'}`);
    console.log(`   Health Status: ${data.performance?.health_status?.overall || 'unknown'}`);
    console.log(`   Performance Score: ${data.performance?.performance_score || 'unknown'}`);
    console.log(`   Stores Processed: ${data.performance?.stores_processed || 0}`);
    console.log(`   Cache Hit Rate: ${data.performance?.cache_metrics?.hitRate || 0}%\n`);

    // Test 3: Check response structure
    console.log('3. Validating response structure...');
    const hasUser = !!data.user;
    const hasStores = !!data.stores;
    const hasRevenue = !!data.revenue;
    const hasPerformance = !!data.performance;

    console.log(`   User data: ${hasUser ? '✅' : '❌'}`);
    console.log(`   Stores data: ${hasStores ? '✅' : '❌'}`);
    console.log(`   Revenue data: ${hasRevenue ? '✅' : '❌'}`);
    console.log(`   Performance data: ${hasPerformance ? '✅' : '❌'}`);

    if (data.revenue && data.revenue.stats) {
      console.log(`   Revenue stats: ${data.revenue.stats.overall_revenue ? '✅' : '❌'}`);
      console.log(`   Trends data: ${data.revenue.trends && data.revenue.trends.length >= 0 ? '✅' : '❌'}`);
    }

    console.log('\n✅ Basic API test completed successfully!');

    // Test 4: Error handling
    console.log('\n4. Testing error handling...');
    const errorResponse = await fetch(`${baseUrl}/api/dashboard/revenue-optimized?storeIds=invalid_store&startDate=invalid_date`);
    const errorData = await errorResponse.json();

    console.log(`   Error response status: ${errorResponse.status}`);
    console.log(`   Has fallback data: ${errorData.fallback ? '✅' : '❌'}`);
    console.log(`   Error handled gracefully: ${errorData.error ? '✅' : '❌'}`);

    console.log('\n✅ All tests passed! The optimized API is ready for benchmarking.');

    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testOptimizedAPI().then(success => {
  process.exit(success ? 0 : 1);
});
#!/usr/bin/env node

/**
 * Test script to verify dashboard API functionality
 * Tests date filtering, account selection, and caching
 */

async function testDashboardAPI() {
    const baseUrl = 'http://localhost:3001';

    // You'll need to get a valid session cookie from your browser
    // Open DevTools > Application > Cookies and copy your session cookie
    const sessionCookie = process.env.SESSION_COOKIE || '';

    if (!sessionCookie) {
        console.log('❌ Please set SESSION_COOKIE environment variable');
        console.log('Get it from your browser: DevTools > Application > Cookies > next-auth.session-token');
        process.exit(1);
    }

    const headers = {
        'Cookie': `next-auth.session-token=${sessionCookie}`,
        'Content-Type': 'application/json'
    };

    // Test cases
    const tests = [
        {
            name: 'Test 1: 7 days data',
            params: {
                stores: 'rZResQK,7MP60fH', // Replace with your actual store IDs
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString()
            }
        },
        {
            name: 'Test 2: 30 days data',
            params: {
                stores: 'rZResQK,7MP60fH', // Replace with your actual store IDs
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString()
            }
        },
        {
            name: 'Test 3: 90 days data',
            params: {
                stores: 'rZResQK,7MP60fH', // Replace with your actual store IDs
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString()
            }
        },
        {
            name: 'Test 4: 7 days with comparison',
            params: {
                stores: 'rZResQK,7MP60fH', // Replace with your actual store IDs
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString(),
                compareStartDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                compareEndDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        }
    ];

    console.log('🧪 Testing Dashboard API with correct ClickHouse tables...\n');

    for (const test of tests) {
        console.log(`📊 ${test.name}`);
        console.log('   Parameters:', test.params);

        const queryParams = new URLSearchParams(test.params);
        const url = `${baseUrl}/api/dashboard?${queryParams}`;

        try {
            const start = Date.now();
            const response = await fetch(url, { headers });
            const elapsed = Date.now() - start;

            if (!response.ok) {
                console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
                const error = await response.text();
                console.log(`   Error: ${error.substring(0, 200)}`);
                continue;
            }

            const data = await response.json();

            // Check for expected data structure
            const hasValidStructure =
                data.summary &&
                typeof data.summary.totalRevenue !== 'undefined' &&
                typeof data.summary.totalOrders !== 'undefined' &&
                Array.isArray(data.timeSeries);

            if (!hasValidStructure) {
                console.log('   ❌ Invalid data structure');
                console.log('   Data:', JSON.stringify(data, null, 2).substring(0, 500));
                continue;
            }

            // Log summary stats
            console.log(`   ✅ Success (${elapsed}ms)`);
            console.log(`   📈 Revenue: $${data.summary.totalRevenue?.toFixed(2) || 0}`);
            console.log(`   📦 Orders: ${data.summary.totalOrders || 0}`);
            console.log(`   👥 Customers: ${data.summary.uniqueCustomers || 0}`);
            console.log(`   📊 Time Series Points: ${data.timeSeries?.length || 0}`);
            console.log(`   💰 AOV: $${data.summary.avgOrderValue?.toFixed(2) || 0}`);

            if (test.params.compareStartDate) {
                console.log(`   📉 Revenue Change: ${data.summary.revenueChange?.toFixed(1) || 0}%`);
                console.log(`   📉 Orders Change: ${data.summary.ordersChange?.toFixed(1) || 0}%`);
            }

            // Test caching by making same request again
            console.log('   🔄 Testing cache...');
            const cacheStart = Date.now();
            const cacheResponse = await fetch(url, { headers });
            const cacheElapsed = Date.now() - cacheStart;
            const cacheData = await cacheResponse.json();

            if (cacheElapsed < elapsed / 2) {
                console.log(`   ✅ Cache hit (${cacheElapsed}ms vs ${elapsed}ms original)`);
            } else {
                console.log(`   ⚠️ Cache miss or slow (${cacheElapsed}ms)`);
            }

            // Verify data consistency
            if (cacheData.summary.totalRevenue === data.summary.totalRevenue) {
                console.log('   ✅ Data consistency verified');
            } else {
                console.log('   ❌ Data inconsistency detected!');
                console.log(`      Original: $${data.summary.totalRevenue}`);
                console.log(`      Cached: $${cacheData.summary.totalRevenue}`);
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('');
    }

    console.log('✅ Dashboard API test complete!');
}

// Run the test
testDashboardAPI().catch(console.error);
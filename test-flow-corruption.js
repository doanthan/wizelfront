#!/usr/bin/env node

/**
 * Test script for flow revenue corruption debugging
 * Usage: node test-flow-corruption.js [klaviyo_public_id] [date]
 *
 * This script tests the debugging endpoint to identify corrupt flow_revenue data
 */

const https = require('https');
const http = require('http');

const DEFAULT_KLAVIYO_ID = 'test'; // Default test ID
const DEFAULT_DATE = '2025-09-22'; // Date with suspected corruption
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com'
  : 'http://localhost:3000';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 3000),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testFlowCorruption() {
  const klaviyoPublicId = process.argv[2] || DEFAULT_KLAVIYO_ID;
  const date = process.argv[3] || DEFAULT_DATE;

  console.log('🔍 Testing Flow Revenue Corruption');
  console.log('==================================');
  console.log(`Klaviyo Public ID: ${klaviyoPublicId}`);
  console.log(`Target Date: ${date}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  try {
    // Test 1: Basic debug endpoint
    console.log('📊 Test 1: Basic Corruption Analysis');
    console.log('------------------------------------');

    const debugUrl = `${BASE_URL}/api/debug/flow-revenue-corruption?klaviyo_public_id=${klaviyoPublicId}&date=${date}`;
    console.log(`Calling: ${debugUrl}`);

    const debugResponse = await makeRequest(debugUrl);

    if (debugResponse.status !== 200) {
      console.error(`❌ Debug endpoint failed with status ${debugResponse.status}`);
      console.error('Response:', debugResponse.data);
      return;
    }

    const debug = debugResponse.data;
    console.log(`✅ Debug endpoint successful`);
    console.log(`   Tests run: ${debug.debug.tests.length}`);
    console.log(`   Passed: ${debug.summary.passed_tests}`);
    console.log(`   Failed: ${debug.summary.failed_tests}`);
    console.log('');

    // Analyze results
    const suspiciousTest = debug.debug.tests.find(t => t.name === 'Suspicious Revenue Values');
    if (suspiciousTest && suspiciousTest.success) {
      const { count, max_value, suspicious_records } = suspiciousTest.data;
      console.log(`🚨 Suspicious Values Found: ${count}`);
      console.log(`   Max Value: $${max_value?.toLocaleString()}`);

      if (suspicious_records && suspicious_records.length > 0) {
        console.log('   Top Suspicious Records:');
        suspicious_records.slice(0, 5).forEach((record, i) => {
          console.log(`   ${i + 1}. ${record.date} - ${record.flow_name || 'Unknown'}: $${record.conversion_value?.toLocaleString()}`);
        });
      }
      console.log('');
    }

    const distributionTest = debug.debug.tests.find(t => t.name === 'Revenue Value Distribution');
    if (distributionTest && distributionTest.success) {
      const { daily_distribution } = distributionTest.data;
      console.log('📈 Daily Distribution Summary:');
      daily_distribution.slice(0, 7).forEach(day => {
        const corruptionRate = day.total_records > 0 ? (day.extreme_high_count / day.total_records * 100).toFixed(1) : 0;
        console.log(`   ${day.date}: ${day.extreme_high_count}/${day.record_count} corrupt (${corruptionRate}%) - Max: $${day.max_value?.toLocaleString()}`);
      });
      console.log('');
    }

    const typeTest = debug.debug.tests.find(t => t.name === 'Data Type and Overflow Analysis');
    if (typeTest && typeTest.success) {
      const typeData = typeTest.data;
      console.log('🔢 Data Type Analysis:');
      console.log(`   conversion_value type: ${typeData.conversion_value_type}`);
      console.log(`   Exact corrupt count (3516885528): ${typeData.exact_corrupt_count}`);
      console.log(`   Int32 overflow count: ${typeData.int32_overflow_count}`);
      console.log(`   Uint32 overflow count: ${typeData.uint32_overflow_count}`);
      console.log('');
    }

    // Test 2: Fix analysis mode
    console.log('🔧 Test 2: Fix Analysis Mode');
    console.log('----------------------------');

    const fixUrl = `${BASE_URL}/api/debug/flow-revenue-corruption?klaviyo_public_id=${klaviyoPublicId}&date=${date}&fix=true`;
    console.log(`Calling: ${fixUrl}`);

    const fixResponse = await makeRequest(fixUrl);

    if (fixResponse.status === 200) {
      const fixData = fixResponse.data;
      const fixTest = fixData.debug.tests.find(t => t.name === 'Fix Analysis (Read-Only)');

      if (fixTest && fixTest.success) {
        const { records_to_fix, total_corrupted_value, total_corrected_value } = fixTest.data;
        console.log(`✅ Fix analysis successful`);
        console.log(`   Records to fix: ${records_to_fix}`);
        console.log(`   Total corrupted value: $${total_corrupted_value?.toLocaleString()}`);
        console.log(`   Total corrected value: $${total_corrected_value?.toLocaleString()}`);
        console.log(`   Savings: $${(total_corrupted_value - total_corrected_value)?.toLocaleString()}`);
      }
    } else {
      console.log(`⚠️  Fix analysis failed with status ${fixResponse.status}`);
    }
    console.log('');

    // Test 3: Recommendations
    console.log('💡 Recommendations:');
    console.log('------------------');
    debug.summary.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    console.log('');

    console.log('✅ Flow corruption analysis complete');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Review the corruption patterns identified above');
    console.log('2. Check the Klaviyo API data source for data quality issues');
    console.log('3. Implement bounds checking in ETL process');
    console.log('4. Consider running the fix operation after validation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testFlowCorruption().catch(console.error);
}

module.exports = { testFlowCorruption };
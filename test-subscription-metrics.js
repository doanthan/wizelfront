// Test script to check what metrics exist in Klaviyo account
// Run with: node test-subscription-metrics.js

const https = require('https');

const apiKey = 'pk_631a1490133175006c3390fd6425e6946a';
const API_REVISION = '2025-07-15';

async function testMetrics() {
  try {
    console.log('Fetching metrics from Klaviyo...\n');

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'a.klaviyo.com',
        path: '/api/metrics',
        method: 'GET',
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'revision': API_REVISION,
          'Accept': 'application/vnd.api+json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log(`Total metrics found: ${data.data.length}\n`);

    // Filter for subscription-related metrics
    const subscriptionMetrics = data.data.filter(metric => {
      const name = metric.attributes.name.toLowerCase();
      return name.includes('subscrib') || name.includes('email') || name.includes('sms');
    });

    console.log('=== SUBSCRIPTION-RELATED METRICS ===\n');
    subscriptionMetrics.forEach(metric => {
      console.log(`Name: ${metric.attributes.name}`);
      console.log(`ID: ${metric.id}`);
      console.log(`Integration: ${metric.attributes.integration?.name || 'None'} (${metric.attributes.integration?.key || 'N/A'})`);
      console.log(`Category: ${metric.attributes.integration?.category || 'N/A'}`);
      console.log('---');
    });

    // Check specifically for the 4 metrics we're looking for
    console.log('\n=== CHECKING FOR SPECIFIC METRICS ===\n');

    const targetMetrics = [
      'Subscribed to Email Marketing',
      'Unsubscribed from Email Marketing',
      'Subscribed to SMS Marketing',
      'Unsubscribed from SMS Marketing'
    ];

    targetMetrics.forEach(targetName => {
      const found = data.data.find(m => m.attributes.name === targetName);
      if (found) {
        console.log(`✅ ${targetName}`);
        console.log(`   ID: ${found.id}`);
        console.log(`   Integration: ${found.attributes.integration?.name || 'None'} (key: ${found.attributes.integration?.key || 'N/A'})`);
      } else {
        console.log(`❌ ${targetName} - NOT FOUND`);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMetrics();

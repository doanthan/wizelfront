/**
 * Utility script to diagnose and fix stores with missing klaviyo_public_id
 *
 * Run with: node scripts/fix-klaviyo-ids.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Store = require('../models/Store').default;

    // Find all stores
    const allStores = await Store.find({
      is_deleted: { $ne: true }
    }).select('public_id name klaviyo_integration');

    console.log(`\n📊 Total stores: ${allStores.length}`);

    // Categorize stores
    const withKlaviyoId = [];
    const withoutKlaviyoId = [];
    const noIntegration = [];

    allStores.forEach(store => {
      if (!store.klaviyo_integration) {
        noIntegration.push(store);
      } else if (store.klaviyo_integration.public_id) {
        withKlaviyoId.push(store);
      } else {
        withoutKlaviyoId.push(store);
      }
    });

    console.log(`\n✅ Stores with Klaviyo ID: ${withKlaviyoId.length}`);
    console.log(`⚠️  Stores missing Klaviyo ID: ${withoutKlaviyoId.length}`);
    console.log(`❌ Stores with no integration: ${noIntegration.length}`);

    // Show stores with Klaviyo ID
    if (withKlaviyoId.length > 0) {
      console.log('\n✅ Stores with Klaviyo Integration:');
      withKlaviyoId.forEach(store => {
        console.log(`  - ${store.name} (${store.public_id})`);
        console.log(`    Klaviyo ID: ${store.klaviyo_integration.public_id}`);
      });
    }

    // Show stores missing Klaviyo ID
    if (withoutKlaviyoId.length > 0) {
      console.log('\n⚠️  Stores Missing Klaviyo ID:');
      withoutKlaviyoId.forEach(store => {
        console.log(`  - ${store.name} (${store.public_id})`);
        console.log(`    Has API Key: ${!!store.klaviyo_integration?.apiKey}`);
        console.log(`    Has OAuth: ${!!store.klaviyo_integration?.oauth_token}`);
      });

      console.log('\n💡 To fix these stores:');
      console.log('   1. Go to each store\'s settings');
      console.log('   2. Click "Connect Klaviyo" or "Reconnect"');
      console.log('   3. Complete the OAuth flow');
      console.log('   4. The public_id will be automatically set');
    }

    // Show stores with no integration
    if (noIntegration.length > 0) {
      console.log('\n❌ Stores with No Integration:');
      noIntegration.forEach(store => {
        console.log(`  - ${store.name} (${store.public_id})`);
      });

      console.log('\n💡 To set up these stores:');
      console.log('   1. Go to store settings');
      console.log('   2. Click "Connect Klaviyo"');
      console.log('   3. Complete the OAuth or API key setup');
    }

    // Check for duplicate Klaviyo IDs
    const klaviyoIdMap = new Map();
    withKlaviyoId.forEach(store => {
      const klaviyoId = store.klaviyo_integration.public_id;
      if (!klaviyoIdMap.has(klaviyoId)) {
        klaviyoIdMap.set(klaviyoId, []);
      }
      klaviyoIdMap.get(klaviyoId).push(store);
    });

    const duplicates = Array.from(klaviyoIdMap.entries()).filter(([_, stores]) => stores.length > 1);

    if (duplicates.length > 0) {
      console.log('\n🔄 Duplicate Klaviyo IDs Found:');
      duplicates.forEach(([klaviyoId, stores]) => {
        console.log(`  Klaviyo ID: ${klaviyoId}`);
        stores.forEach(store => {
          console.log(`    - ${store.name} (${store.public_id})`);
        });
      });

      console.log('\n💡 This is normal if:');
      console.log('   - Multiple stores share the same Klaviyo account');
      console.log('   - Different brands/locations use one Klaviyo account');
      console.log('   - This allows analytics aggregation across stores');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Stores: ${allStores.length}`);
    console.log(`Ready for Analytics: ${withKlaviyoId.length} (${((withKlaviyoId.length / allStores.length) * 100).toFixed(1)}%)`);
    console.log(`Needs Klaviyo ID: ${withoutKlaviyoId.length}`);
    console.log(`Needs Integration: ${noIntegration.length}`);
    console.log(`Shared Klaviyo Accounts: ${duplicates.length}`);
    console.log('='.repeat(60));

    // Auto-fix option (commented out for safety)
    // Uncomment this if you want to automatically extract Klaviyo IDs from API keys
    /*
    if (withoutKlaviyoId.length > 0) {
      console.log('\n🔧 Auto-fix option available (currently disabled)');
      console.log('   Uncomment the auto-fix code in scripts/fix-klaviyo-ids.js');
      console.log('   This will attempt to extract Klaviyo public IDs from API keys');

      // Example auto-fix code:
      // for (const store of withoutKlaviyoId) {
      //   if (store.klaviyo_integration?.apiKey) {
      //     const klaviyoId = extractKlaviyoIdFromApiKey(store.klaviyo_integration.apiKey);
      //     if (klaviyoId) {
      //       store.klaviyo_integration.public_id = klaviyoId;
      //       await store.save();
      //       console.log(`✅ Fixed: ${store.name} -> ${klaviyoId}`);
      //     }
      //   }
      // }
    }
    */

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

main();

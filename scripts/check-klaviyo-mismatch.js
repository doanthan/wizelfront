#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(dirname(__dirname), '.env') });

async function checkKlaviyoMismatch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get all stores with their Klaviyo IDs
    const stores = await db.collection('stores').find(
      { is_deleted: { $ne: true } },
      {
        projection: {
          name: 1,
          public_id: 1,
          'klaviyo_integration.public_id': 1
        }
      }
    ).toArray();

    console.log('\n📦 STORES AND THEIR KLAVIYO IDs:');
    console.log('=================================');
    stores.forEach(store => {
      console.log(`Store: ${store.name}`);
      console.log(`  Store Public ID: ${store.public_id}`);
      console.log(`  Klaviyo Public ID: ${store.klaviyo_integration?.public_id || 'NOT SET'}`);
    });

    // Get unique Klaviyo IDs from campaign data
    const campaigns = await db.collection('campaignstats').distinct('klaviyo_public_id');

    console.log('\n📊 KLAVIYO IDs IN CAMPAIGN DATA:');
    console.log('=================================');
    campaigns.forEach(id => {
      console.log(`  ${id}`);
    });

    // Check for mismatches
    const storeKlaviyoIds = stores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);

    console.log('\n⚠️  MISMATCH ANALYSIS:');
    console.log('=================================');

    const campaignsNotInStores = campaigns.filter(id => !storeKlaviyoIds.includes(id));
    if (campaignsNotInStores.length > 0) {
      console.log('Campaign Klaviyo IDs not matched to any store:');
      campaignsNotInStores.forEach(id => {
        console.log(`  ❌ ${id} - has campaign data but no store configured`);
      });
    }

    const storesWithoutCampaigns = storeKlaviyoIds.filter(id => !campaigns.includes(id));
    if (storesWithoutCampaigns.length > 0) {
      console.log('\nStore Klaviyo IDs without campaign data:');
      storesWithoutCampaigns.forEach(id => {
        console.log(`  ⚠️  ${id} - store configured but no campaigns found`);
      });
    }

    // Count campaigns per Klaviyo ID
    console.log('\n📈 CAMPAIGN COUNTS BY KLAVIYO ID:');
    console.log('=================================');
    for (const klaviyoId of campaigns) {
      const count = await db.collection('campaignstats').countDocuments({
        klaviyo_public_id: klaviyoId
      });
      console.log(`  ${klaviyoId}: ${count} campaigns`);
    }

    // SUGGESTION: Update a store to use the XqkVGb Klaviyo ID
    if (campaignsNotInStores.includes('XqkVGb') && stores.length > 0) {
      console.log('\n💡 FIX SUGGESTION:');
      console.log('=================================');
      console.log('You have campaign data for Klaviyo ID "XqkVGb" but no store is configured with this ID.');
      console.log(`Consider updating one of your stores to use this Klaviyo ID.`);
      console.log(`\nExample: Update the first store (${stores[0].name}) to use XqkVGb:`);
      console.log(`\nawait db.collection('stores').updateOne(`);
      console.log(`  { public_id: '${stores[0].public_id}' },`);
      console.log(`  { $set: { 'klaviyo_integration.public_id': 'XqkVGb' } }`);
      console.log(`);`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkKlaviyoMismatch();
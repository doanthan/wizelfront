#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(dirname(__dirname), '.env') });

async function updateStoreKlaviyoId() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // The Klaviyo ID that has campaign data
    const KLAVIYO_ID_WITH_DATA = 'XqkVGb';

    // Find a store to update (preferably one without a Klaviyo ID)
    const storeToUpdate = await db.collection('stores').findOne({
      $or: [
        { 'klaviyo_integration.public_id': null },
        { 'klaviyo_integration.public_id': { $exists: false } },
        { public_id: 'XAeU8VL' } // The store you showed in the example
      ],
      is_deleted: { $ne: true }
    });

    if (!storeToUpdate) {
      console.log('No suitable store found to update');
      return;
    }

    console.log(`\n📦 Store to update: ${storeToUpdate.name} (${storeToUpdate.public_id})`);
    console.log(`Current Klaviyo ID: ${storeToUpdate.klaviyo_integration?.public_id || 'NOT SET'}`);

    // Update the store with the Klaviyo ID that has data
    const result = await db.collection('stores').updateOne(
      { _id: storeToUpdate._id },
      {
        $set: {
          'klaviyo_integration.public_id': KLAVIYO_ID_WITH_DATA,
          'klaviyo_integration.status': 'connected'
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`\n✅ Successfully updated store "${storeToUpdate.name}"`);
      console.log(`   Store Public ID: ${storeToUpdate.public_id}`);
      console.log(`   New Klaviyo ID: ${KLAVIYO_ID_WITH_DATA}`);

      // Verify the campaigns are now accessible
      const campaignCount = await db.collection('campaignstats').countDocuments({
        klaviyo_public_id: KLAVIYO_ID_WITH_DATA
      });

      console.log(`\n📊 This store now has access to ${campaignCount} campaigns`);
    } else {
      console.log('⚠️  Store was not updated (possibly already had this ID)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Ask for confirmation
console.log('⚠️  This script will update a store to use Klaviyo ID: XqkVGb');
console.log('This will connect the store to the existing campaign data.');
console.log('\nPress Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  updateStoreKlaviyoId();
}, 3000);
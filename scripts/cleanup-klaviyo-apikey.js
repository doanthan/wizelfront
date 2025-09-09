#!/usr/bin/env node

/**
 * Script to clean up duplicate API key fields in klaviyo_integration
 * Removes the legacy 'api_key' field and keeps only 'apiKey'
 */

const mongoose = require('mongoose');
const Store = require('../models/Store');
require('dotenv').config();

async function cleanupApiKeys() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all stores with klaviyo_integration
    const stores = await Store.find({
      'klaviyo_integration.status': 'connected'
    });

    console.log(`Found ${stores.length} stores with Klaviyo integration`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const store of stores) {
      try {
        const integration = store.klaviyo_integration;
        
        // Check if there's a duplicate api_key field
        if (integration.api_key) {
          console.log(`\nProcessing store: ${store.name} (${store.public_id})`);
          
          // If apiKey doesn't exist but api_key does, copy it
          if (!integration.apiKey && integration.api_key) {
            console.log(`  - Copying api_key to apiKey`);
            integration.apiKey = integration.api_key;
          }
          
          // Remove the api_key field
          console.log(`  - Removing duplicate api_key field`);
          delete integration.api_key;
          
          // Use MongoDB update to unset the field
          await Store.updateOne(
            { _id: store._id },
            { 
              $set: { 'klaviyo_integration.apiKey': integration.apiKey },
              $unset: { 'klaviyo_integration.api_key': '' }
            }
          );
          
          updatedCount++;
          console.log(`  ✓ Updated successfully`);
        }
      } catch (error) {
        console.error(`  ✗ Error updating store ${store.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total stores processed: ${stores.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Verify the cleanup
    const storesWithDuplicate = await Store.find({
      'klaviyo_integration.api_key': { $exists: true }
    }).countDocuments();

    if (storesWithDuplicate > 0) {
      console.log(`\n⚠️  Warning: ${storesWithDuplicate} stores still have api_key field`);
    } else {
      console.log('\n✓ All duplicate api_key fields have been removed');
    }

  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
cleanupApiKeys().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
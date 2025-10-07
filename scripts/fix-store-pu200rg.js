/**
 * Fix Store Pu200rg configuration
 * 1. Update URL to correct Shopify store
 * 2. Display the correct brand ID for idea-generator
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import connectToDatabase from '../lib/mongoose.js';
import Store from '../models/Store.js';
import BrandSettings from '../models/Brand.js';
import mongoose from 'mongoose';

async function fixStore() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    // Find the store
    const store = await Store.findOne({ public_id: 'Pu200rg' });
    if (!store) {
      console.error('❌ Store Pu200rg not found!');
      process.exit(1);
    }

    console.log(`\n📦 Store: ${store.name}`);
    console.log(`   Current URL: ${store.url}`);
    console.log(`   Shopify Domain: ${store.shopify_domain || 'Not set'}`);

    // Find the default brand
    const brand = await BrandSettings.findOne({
      store_public_id: 'Pu200rg',
      isDefault: true
    });

    if (!brand) {
      console.error('❌ No default brand found for store!');
      process.exit(1);
    }

    console.log(`\n🎨 Default Brand: ${brand.brandName}`);
    console.log(`   Brand ID: ${brand._id}`);
    console.log(`   Slug: ${brand.slug}`);
    console.log(`   Website URL: ${brand.websiteUrl}`);

    // Suggest the correct URLs
    console.log('\n🔧 Suggested Fixes:');
    console.log('\n1. IDEA GENERATOR URL:');
    console.log(`   ✅ Use this URL: http://localhost:3000/store/Pu200rg/idea-generator?brand=${brand._id}`);

    console.log('\n2. STORE URL UPDATE:');
    if (brand.websiteUrl && brand.websiteUrl.includes('shopify')) {
      console.log(`   ✅ Update store URL to: ${brand.websiteUrl}`);
      console.log(`\n   Would you like to update the store URL to match the brand? (Run with --update flag)`);
    } else if (brand.websiteUrl) {
      console.log(`   ⚠️  Brand website: ${brand.websiteUrl}`);
      console.log(`   ⚠️  This doesn't appear to be a Shopify store URL.`);
      console.log(`   💡 You need to set the correct Shopify store URL (e.g., https://yourstorename.myshopify.com)`);
    }

    // Check if --update flag is provided
    const shouldUpdate = process.argv.includes('--update');

    if (shouldUpdate && brand.websiteUrl && brand.websiteUrl !== store.url) {
      console.log('\n🔄 Updating store URL...');
      store.url = brand.websiteUrl;

      // Extract Shopify domain if it's a .myshopify.com URL
      if (brand.websiteUrl.includes('.myshopify.com')) {
        const domain = brand.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        store.shopify_domain = domain;
        console.log(`   Setting shopify_domain: ${domain}`);
      }

      await store.save();
      console.log('✅ Store URL updated successfully!');
    }

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

fixStore();
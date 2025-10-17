/**
 * Migration Script: Create Default Brands for Existing Stores
 *
 * This script creates a default brand for any store that doesn't have one.
 * Run with: node scripts/create-default-brands.js
 */

import connectToDatabase from '../lib/mongoose.js';
import Store from '../models/Store.js';
import BrandSettings from '../models/Brand.js';

async function createDefaultBrands() {
  try {
    console.log('🔄 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Get all active stores
    const stores = await Store.find({ is_deleted: { $ne: true } });
    console.log(`📊 Found ${stores.length} stores`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const store of stores) {
      try {
        // Check if store already has a default brand
        const existingBrand = await BrandSettings.findOne({
          store_id: store._id,
          isDefault: true
        });

        if (existingBrand) {
          console.log(`⏭️  Store "${store.name}" (${store.public_id}) already has a default brand`);

          // Check if slug is missing and fix it
          if (!existingBrand.slug && existingBrand.name) {
            existingBrand.slug = await existingBrand.generateSlug(existingBrand.name);
            await existingBrand.save();
            console.log(`   ✓ Fixed missing slug: "${existingBrand.slug}"`);
          }

          skipped++;
          continue;
        }

        // Create default brand
        const brand = await BrandSettings.create({
          store_id: store._id,
          store_public_id: store.public_id,
          brandName: 'Default Brand',
          name: 'Default Brand',
          isDefault: true,
          isActive: true,
          createdBy: store.created_by || null,
          updatedBy: store.created_by || null,
          primaryColor: [{ hex: '#000000', name: 'Black' }],
          buttonTextColor: '#FFFFFF',
          emailFallbackFont: 'Arial'
        });

        console.log(`✅ Created default brand for store "${store.name}" (${store.public_id}) - slug: "${brand.slug}"`);
        created++;

      } catch (storeError) {
        console.error(`❌ Error processing store "${store.name}" (${store.public_id}):`, storeError.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n✨ Migration complete!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
createDefaultBrands();

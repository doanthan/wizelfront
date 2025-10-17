/**
 * Diagnostic Script: Check Default Brands
 */

import connectToDatabase from '../lib/mongoose.js';
import BrandSettings from '../models/Brand.js';

async function checkBrands() {
  try {
    await connectToDatabase();
    console.log('✅ Connected to database\n');

    const brands = await BrandSettings.find({ isDefault: true });

    console.log(`Found ${brands.length} default brands:\n`);

    for (const brand of brands) {
      console.log(`Store: ${brand.store_public_id || 'N/A'}`);
      console.log(`  - _id: ${brand._id}`);
      console.log(`  - name: "${brand.name || 'EMPTY'}"`);
      console.log(`  - brandName: "${brand.brandName || 'EMPTY'}"`);
      console.log(`  - slug: "${brand.slug || 'EMPTY'}"`);
      console.log(`  - isDefault: ${brand.isDefault}`);
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBrands();

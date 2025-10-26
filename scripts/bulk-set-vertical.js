/**
 * Bulk Set Store Vertical (Simple Version)
 *
 * Quick script to set all stores to a default vertical
 *
 * Usage:
 *   node scripts/bulk-set-vertical.js ecommerce_general
 *   node scripts/bulk-set-vertical.js ecommerce_health_beauty
 *   node scripts/bulk-set-vertical.js restaurants
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const vertical = process.argv[2];

if (!vertical) {
  console.error('❌ Usage: node scripts/bulk-set-vertical.js <vertical_key>');
  console.error('   Example: node scripts/bulk-set-vertical.js ecommerce_general');
  console.error('\n   See BENCHMARK_REFERENCE_LIST.md for valid vertical keys');
  process.exit(1);
}

async function bulkSetVertical() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Verify vertical exists in benchmarks
    const benchmark = await mongoose.connection.db.collection('benchmarks')
      .findOne({ vertical, is_active: true });

    if (!benchmark) {
      console.error(`❌ Invalid vertical: ${vertical}`);
      console.error('   See BENCHMARK_REFERENCE_LIST.md for valid vertical keys\n');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📊 Benchmark found: ${benchmark.display_name} (${benchmark.category})\n`);

    // Count stores
    const storeCount = await mongoose.connection.db.collection('stores')
      .countDocuments({});

    console.log(`Setting vertical for ${storeCount} stores to: ${vertical}\n`);

    // Update all stores
    const result = await mongoose.connection.db.collection('stores')
      .updateMany(
        {},
        { $set: { vertical } }
      );

    console.log(`✅ Updated ${result.modifiedCount} stores`);
    console.log(`   Vertical: ${vertical}`);
    console.log(`   Benchmark: ${benchmark.display_name}\n`);

    // Show sample stores
    const samples = await mongoose.connection.db.collection('stores')
      .find({})
      .limit(5)
      .project({ public_id: 1, name: 1, vertical: 1 })
      .toArray();

    console.log('📦 Sample stores:');
    samples.forEach(s => {
      console.log(`   ${s.name} (${s.public_id}): ${s.vertical}`);
    });

    await mongoose.connection.close();
    console.log('\n👋 Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

bulkSetVertical();

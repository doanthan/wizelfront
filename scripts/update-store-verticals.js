/**
 * Update Store Verticals Script
 *
 * Interactive script to classify and update store verticals for benchmark matching
 *
 * Usage:
 *   node scripts/update-store-verticals.js                    # Interactive mode
 *   node scripts/update-store-verticals.js --auto             # Auto-classify all stores
 *   node scripts/update-store-verticals.js --set-all=VALUE   # Set all stores to a vertical
 *   node scripts/update-store-verticals.js --store=ID --vertical=KEY  # Update single store
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Import models
import Store from '../models/Store.js';
import Benchmark from '../models/Benchmark.js';

// Parse command line arguments
const args = process.argv.slice(2);
const isAuto = args.includes('--auto');
const setAllArg = args.find(arg => arg.startsWith('--set-all='));
const storeArg = args.find(arg => arg.startsWith('--store='));
const verticalArg = args.find(arg => arg.startsWith('--vertical='));

// Load benchmark reference
const refPath = path.join(__dirname, '..', 'benchmark-reference.json');
let benchmarkRef = null;

if (fs.existsSync(refPath)) {
  benchmarkRef = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
}

console.log('🏪 Store Vertical Update Script\n');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Get all available verticals
async function getAvailableVerticals() {
  const benchmarks = await Benchmark.find({ is_active: true })
    .select('vertical display_name category')
    .sort({ category: 1, display_name: 1 })
    .lean();

  return benchmarks;
}

// Simple AI-like classification based on store name and description
function autoClassifyStore(store) {
  const name = (store.name || '').toLowerCase();
  const desc = (store.short_description || '').toLowerCase();
  const combined = `${name} ${desc}`;

  // E-commerce classifications
  if (combined.match(/\b(beauty|cosmetic|makeup|skincare|facial|serum)\b/)) {
    return 'ecommerce_skincare';
  }
  if (combined.match(/\b(supplement|vitamin|protein|nutrition|wellness)\b/)) {
    return 'ecommerce_supplements';
  }
  if (combined.match(/\b(fashion|apparel|clothing|wear|dress|shirt)\b/)) {
    return 'e-commerce_apparel_accessories';
  }
  if (combined.match(/\b(activewear|fitness|gym|athletic|sportswear)\b/)) {
    return 'ecommerce_activewear';
  }
  if (combined.match(/\b(jewelry|jewellery|necklace|ring|bracelet)\b/)) {
    return 'ecommerce_jewelry';
  }
  if (combined.match(/\b(electronic|tech|gadget|device|computer)\b/)) {
    return 'ecommerce_electronics';
  }
  if (combined.match(/\b(food|beverage|drink|snack|coffee|tea)\b/)) {
    return 'ecommerce_food_beverage';
  }
  if (combined.match(/\b(home|furniture|decor|garden|plant)\b/)) {
    return 'ecommerce_home_garden';
  }
  if (combined.match(/\b(toy|game|hobby|puzzle|collectible)\b/)) {
    return 'ecommerce_toys_hobbies';
  }
  if (combined.match(/\b(shoe|boot|sneaker|footwear)\b/)) {
    return 'ecommerce_footwear';
  }
  if (combined.match(/\b(fragrance|perfume|cologne|scent)\b/)) {
    return 'ecommerce_fragrance';
  }
  if (combined.match(/\b(hair|shampoo|conditioner|haircare)\b/)) {
    return 'ecommerce_haircare';
  }

  // Service-based classifications
  if (combined.match(/\b(restaurant|cafe|dining|bistro)\b/)) {
    return 'restaurants';
  }
  if (combined.match(/\b(travel|hotel|vacation|tourism)\b/)) {
    return 'travel';
  }
  if (combined.match(/\b(software|saas|app|platform|cloud)\b/)) {
    return 'software_saas';
  }
  if (combined.match(/\b(agency|marketing|consulting|advertis)\b/)) {
    return 'agency_marketing_consulting';
  }
  if (combined.match(/\b(education|school|course|learn|training)\b/)) {
    return 'education';
  }
  if (combined.match(/\b(nonprofit|charity|foundation|donation)\b/)) {
    return 'nonprofit';
  }

  // Default fallback
  return 'ecommerce_general';
}

// Update single store
async function updateStore(storeId, vertical, dryRun = false) {
  const store = await Store.findOne({ public_id: storeId });

  if (!store) {
    console.error(`❌ Store not found: ${storeId}`);
    return false;
  }

  // Verify vertical exists
  const benchmark = await Benchmark.findOne({ vertical, is_active: true });

  if (!benchmark) {
    console.error(`❌ Invalid vertical: ${vertical}`);
    console.log('   Run: node scripts/generate-benchmark-list.js for valid verticals');
    return false;
  }

  const oldVertical = store.vertical || '(not set)';

  if (dryRun) {
    console.log(`   Would update: ${store.name} (${storeId})`);
    console.log(`   ${oldVertical} → ${vertical} (${benchmark.display_name})`);
    return true;
  }

  store.vertical = vertical;
  await store.save();

  console.log(`✅ Updated: ${store.name} (${storeId})`);
  console.log(`   ${oldVertical} → ${vertical} (${benchmark.display_name})`);

  return true;
}

// Interactive mode - show stores and let user choose verticals
async function interactiveMode() {
  const stores = await Store.find({}).select('public_id name vertical short_description').lean();

  if (stores.length === 0) {
    console.log('No stores found in database.');
    return;
  }

  const verticals = await getAvailableVerticals();

  console.log(`Found ${stores.length} stores\n`);
  console.log('Available verticals by category:\n');

  // Group verticals by category for display
  const byCategory = {};
  verticals.forEach(v => {
    if (!byCategory[v.category]) byCategory[v.category] = [];
    byCategory[v.category].push(v);
  });

  Object.keys(byCategory).sort().forEach((cat, idx) => {
    console.log(`${idx + 1}. ${cat.toUpperCase()} (${byCategory[cat].length} options)`);
  });

  console.log('\nStores to classify:\n');

  let updated = 0;
  let skipped = 0;

  for (const store of stores) {
    const suggested = autoClassifyStore(store);
    const suggestedBenchmark = verticals.find(v => v.vertical === suggested);

    console.log(`\n📦 ${store.name} (${store.public_id})`);
    if (store.short_description) {
      console.log(`   Description: ${store.short_description}`);
    }
    console.log(`   Current: ${store.vertical || '(not set)'}`);
    console.log(`   Suggested: ${suggested} - ${suggestedBenchmark?.display_name || 'Unknown'}`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('   Action [a]ccept / [s]kip / [c]ustom / [q]uit: ', resolve);
    });

    rl.close();

    const choice = answer.toLowerCase().trim();

    if (choice === 'q') {
      console.log('\n👋 Exiting...');
      break;
    }

    if (choice === 's') {
      skipped++;
      continue;
    }

    if (choice === 'a') {
      await updateStore(store.public_id, suggested);
      updated++;
      continue;
    }

    if (choice === 'c') {
      console.log('\nEnter vertical key (or press Enter to skip):');
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const customVertical = await new Promise(resolve => {
        rl2.question('Vertical key: ', resolve);
      });

      rl2.close();

      if (customVertical.trim()) {
        await updateStore(store.public_id, customVertical.trim());
        updated++;
      } else {
        skipped++;
      }
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

// Auto mode - classify all stores automatically
async function autoMode() {
  const stores = await Store.find({}).select('public_id name vertical short_description').lean();

  console.log(`Found ${stores.length} stores to auto-classify\n`);

  let updated = 0;
  let errors = 0;

  for (const store of stores) {
    try {
      const vertical = autoClassifyStore(store);
      const success = await updateStore(store.public_id, vertical);

      if (success) {
        updated++;
      } else {
        errors++;
      }
    } catch (error) {
      console.error(`❌ Error updating ${store.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Auto-classification complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
}

// Set all stores to a specific vertical
async function setAllMode(vertical) {
  // Verify vertical exists
  const benchmark = await Benchmark.findOne({ vertical, is_active: true });

  if (!benchmark) {
    console.error(`❌ Invalid vertical: ${vertical}`);
    console.log('   Run: node scripts/generate-benchmark-list.js for valid verticals');
    return;
  }

  const stores = await Store.find({}).select('public_id name').lean();

  console.log(`Setting all ${stores.length} stores to: ${vertical} (${benchmark.display_name})\n`);

  const result = await Store.updateMany(
    {},
    { $set: { vertical } }
  );

  console.log(`✅ Updated ${result.modifiedCount} stores to ${vertical}`);
}

// Single store update mode
async function singleStoreMode(storeId, vertical) {
  await updateStore(storeId, vertical);
}

// Main execution
async function main() {
  await connectDB();

  try {
    // Single store update
    if (storeArg && verticalArg) {
      const storeId = storeArg.split('=')[1];
      const vertical = verticalArg.split('=')[1];
      await singleStoreMode(storeId, vertical);
    }
    // Set all stores
    else if (setAllArg) {
      const vertical = setAllArg.split('=')[1];
      await setAllMode(vertical);
    }
    // Auto mode
    else if (isAuto) {
      await autoMode();
    }
    // Interactive mode (default)
    else {
      await interactiveMode();
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB\n');
  }
}

main();

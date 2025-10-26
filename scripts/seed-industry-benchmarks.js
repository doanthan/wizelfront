/**
 * Seed Industry Benchmarks Script
 *
 * Imports merged benchmark data into MongoDB
 *
 * Usage:
 *   node scripts/seed-industry-benchmarks.js           # Import benchmarks
 *   node scripts/seed-industry-benchmarks.js --clear   # Clear existing and import
 *   node scripts/seed-industry-benchmarks.js --dry-run # Preview without importing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Import Benchmark model
import Benchmark from '../models/Benchmark.js';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const clearExisting = args.includes('--clear');

console.log('🌱 Industry Benchmark Seeding Script\n');

if (dryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made\n');
}

if (clearExisting) {
  console.log('🗑️  CLEAR MODE - Existing benchmarks will be deleted\n');
}

// Load merged benchmarks
const mergedPath = path.join(__dirname, 'benchmarks-merged.json');

if (!fs.existsSync(mergedPath)) {
  console.error('❌ Error: benchmarks-merged.json not found!');
  console.error('   Run: node scripts/merge-benchmarks.js first\n');
  process.exit(1);
}

const benchmarks = JSON.parse(fs.readFileSync(mergedPath, 'utf-8'));

console.log(`📊 Loaded ${benchmarks.length} benchmarks from merged file\n`);

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Validate benchmark data
function validateBenchmark(benchmark) {
  const errors = [];

  if (!benchmark.vertical) {
    errors.push('Missing vertical field');
  }

  if (!benchmark.display_name) {
    errors.push('Missing display_name field');
  }

  if (!benchmark.year) {
    errors.push('Missing year field');
  }

  if (!benchmark.version) {
    errors.push('Missing version field');
  }

  if (!benchmark.campaigns || Object.keys(benchmark.campaigns).length === 0) {
    errors.push('Missing or empty campaigns data');
  }

  return errors;
}

// Main seeding function
async function seedBenchmarks() {
  try {
    await connectDB();

    // Validate all benchmarks first
    console.log('🔍 Validating benchmark data...\n');

    let validCount = 0;
    const invalidBenchmarks = [];

    benchmarks.forEach((benchmark, index) => {
      const errors = validateBenchmark(benchmark);

      if (errors.length > 0) {
        invalidBenchmarks.push({
          index,
          vertical: benchmark.vertical || 'unknown',
          errors
        });
      } else {
        validCount++;
      }
    });

    console.log(`✅ Valid benchmarks: ${validCount}`);

    if (invalidBenchmarks.length > 0) {
      console.log(`⚠️  Invalid benchmarks: ${invalidBenchmarks.length}\n`);
      invalidBenchmarks.forEach(({ index, vertical, errors }) => {
        console.log(`   [${index}] ${vertical}:`);
        errors.forEach(err => console.log(`      - ${err}`));
      });
      console.log();
    }

    if (validCount === 0) {
      console.error('❌ No valid benchmarks to import. Exiting.\n');
      process.exit(1);
    }

    if (dryRun) {
      console.log('✅ Dry run complete. No changes made.\n');
      process.exit(0);
    }

    // Clear existing benchmarks if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing benchmarks...');
      const deleteResult = await Benchmark.deleteMany({});
      console.log(`   Deleted ${deleteResult.deletedCount} existing benchmarks\n`);
    }

    // Import benchmarks
    console.log('📥 Importing benchmarks to MongoDB...\n');

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const benchmark of benchmarks) {
      const errors = validateBenchmark(benchmark);

      if (errors.length > 0) {
        continue;  // Skip invalid benchmarks
      }

      try {
        // Upsert benchmark (update if exists, insert if new)
        const result = await Benchmark.updateOne(
          {
            vertical: benchmark.vertical,
            year: benchmark.year,
            version: benchmark.version
          },
          {
            $set: {
              ...benchmark,
              updated_at: new Date()
            }
          },
          {
            upsert: true
          }
        );

        if (result.upsertedCount > 0) {
          insertedCount++;
        } else if (result.modifiedCount > 0) {
          updatedCount++;
        }

        // Progress indicator
        if ((insertedCount + updatedCount) % 10 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        errorCount++;
        console.error(`\n❌ Error importing ${benchmark.vertical}: ${error.message}`);
      }
    }

    console.log('\n');
    console.log('✅ Import complete!\n');
    console.log('📊 Summary:');
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${insertedCount + updatedCount}\n`);

    // Verify import
    const totalInDB = await Benchmark.countDocuments({ is_active: true });
    console.log(`✅ Active benchmarks in database: ${totalInDB}\n`);

    // Show category breakdown
    const categoryBreakdown = await Benchmark.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Benchmarks by Category:');
    categoryBreakdown.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count}`);
    });
    console.log();

    console.log('🎉 Seeding complete! Benchmarks ready for use.\n');

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run the seeding
seedBenchmarks();

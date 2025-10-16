// Script to remove the public_id index from users collection
// Run with: node scripts/remove-user-publicid-index.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function removePublicIdIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // List all indexes
    console.log('\n📋 Current indexes on users collection:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if public_id index exists
    const publicIdIndex = indexes.find(idx => idx.name === 'public_id_1');

    if (publicIdIndex) {
      console.log('\n🗑️  Dropping public_id_1 index...');
      await usersCollection.dropIndex('public_id_1');
      console.log('✅ Successfully removed public_id_1 index');
    } else {
      console.log('\n⚠️  No public_id_1 index found');
    }

    // List indexes after removal
    console.log('\n📋 Indexes after removal:');
    const newIndexes = await usersCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removePublicIdIndex();

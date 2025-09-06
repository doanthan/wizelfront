#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🗑️  Starting database cleanup...\n');

async function clearDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📦 Working with database: ${dbName}`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections\n`);

    // Drop each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🗑️  Dropping collection: ${collectionName}`);
      await mongoose.connection.db.collection(collectionName).drop();
      console.log(`✅ Dropped: ${collectionName}`);
    }

    console.log('\n🎉 Database cleared successfully!\n');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  clearDatabase();
}

export { clearDatabase };
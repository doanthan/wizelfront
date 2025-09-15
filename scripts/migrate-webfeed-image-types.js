#!/usr/bin/env node

/**
 * Migration script to update existing webfeed items from 'image' type to 'image_html'
 * Run with: node scripts/migrate-webfeed-image-types.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function migrate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Get the WebFeed collection
    const db = mongoose.connection.db;
    const collection = db.collection('webfeeds');
    
    // Find all webfeeds with items that have type 'image'
    const webfeeds = await collection.find({
      'items.type': 'image'
    }).toArray();
    
    console.log(`Found ${webfeeds.length} webfeeds with 'image' type items to migrate`);
    
    // Update each webfeed
    for (const webfeed of webfeeds) {
      const updatedItems = webfeed.items.map(item => {
        if (item.type === 'image') {
          // Convert 'image' to 'image_html' (since it was generating HTML before)
          return { ...item, type: 'image_html' };
        }
        return item;
      });
      
      // Update the document
      await collection.updateOne(
        { _id: webfeed._id },
        { $set: { items: updatedItems } }
      );
      
      console.log(`Updated webfeed: ${webfeed.name} (${webfeed._id})`);
    }
    
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrate();
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixDuplicateIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('Connected to MongoDB');

    const collections = ['stores', 'roles', 'users'];
    
    for (const collectionName of collections) {
      console.log(`\nChecking indexes for ${collectionName}...`);
      
      const collection = mongoose.connection.collection(collectionName);
      
      // Get all indexes
      const indexes = await collection.listIndexes().toArray();
      
      console.log(`Found ${indexes.length} indexes:`);
      
      // Group indexes by their keys to find duplicates
      const indexMap = new Map();
      
      indexes.forEach(index => {
        // Skip the _id index
        if (index.name === '_id_') return;
        
        const keyString = JSON.stringify(index.key);
        
        if (!indexMap.has(keyString)) {
          indexMap.set(keyString, []);
        }
        indexMap.get(keyString).push(index);
      });
      
      // Find and remove duplicates
      for (const [keyString, indexList] of indexMap) {
        if (indexList.length > 1) {
          console.log(`\nFound duplicate indexes for keys: ${keyString}`);
          
          // Keep the first one, drop the rest
          for (let i = 1; i < indexList.length; i++) {
            console.log(`  Dropping duplicate index: ${indexList[i].name}`);
            try {
              await collection.dropIndex(indexList[i].name);
              console.log(`  ✓ Dropped ${indexList[i].name}`);
            } catch (error) {
              console.log(`  ✗ Failed to drop ${indexList[i].name}: ${error.message}`);
            }
          }
        }
      }
    }
    
    console.log('\n✓ Duplicate index cleanup complete');
    
  } catch (error) {
    console.error('Error fixing duplicate indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
fixDuplicateIndexes();
import mongoose from 'mongoose';
import Store from '../models/Store.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkPublicIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all stores
    const stores = await Store.find({}).select('name public_id url owner_id contract_id').lean();
    
    console.log(`\n📊 Total stores: ${stores.length}`);
    
    if (stores.length > 0) {
      console.log('\n📦 Stores with public_ids:');
      stores.forEach((store, index) => {
        console.log(`\n${index + 1}. ${store.name}`);
        console.log('   ID:', store._id);
        console.log('   Public ID:', store.public_id || '❌ MISSING');
        console.log('   URL:', store.url);
        console.log('   Owner:', store.owner_id);
        console.log('   Contract:', store.contract_id);
      });
      
      // Count stores without public_id
      const missingPublicId = stores.filter(s => !s.public_id).length;
      if (missingPublicId > 0) {
        console.log(`\n⚠️  ${missingPublicId} stores are missing public_id`);
        console.log('Creating public_ids for stores without them...');
        
        // Update stores without public_id
        for (const store of stores.filter(s => !s.public_id)) {
          const storeDoc = await Store.findById(store._id);
          await storeDoc.save(); // This should trigger the pre-save hook
          console.log(`✅ Generated public_id for ${storeDoc.name}: ${storeDoc.public_id}`);
        }
      }
    } else {
      console.log('\n❌ No stores found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🔍 Checking store public IDs...\n');
checkPublicIds();
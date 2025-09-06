import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixStoreOwnership() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    const storesCollection = db.collection('stores');
    
    // Find the user
    const user = await usersCollection.findOne({ 
      email: 'doanthan@gmail.com' 
    });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user:', user.name, '(', user._id, ')');
    
    // Get all stores
    const stores = await storesCollection.find({
      is_deleted: { $ne: true }
    }).toArray();
    
    console.log(`\nFound ${stores.length} stores to update`);
    
    let updatedCount = 0;
    
    // Update each store to have correct user_id
    for (const store of stores) {
      console.log(`\nUpdating store: ${store.name}`);
      console.log(`  Old user_id: ${store.user_id}`);
      
      const result = await storesCollection.updateOne(
        { _id: store._id },
        { 
          $set: { 
            user_id: user._id,
            created_by: user._id,
            updated_at: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`  ✓ Updated to user_id: ${user._id}`);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} stores`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🔧 Fixing store ownership to match current user...\n');
fixStoreOwnership();
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixUserId() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    const storesCollection = db.collection('stores');
    
    // Get the correct user
    const correctUser = await usersCollection.findOne({ 
      email: 'doanthan@gmail.com' 
    });
    
    if (!correctUser) {
      console.error('❌ User not found!');
      return;
    }
    
    const correctUserId = correctUser._id.toString();
    console.log('\n✅ Correct user found:');
    console.log('  ID:', correctUserId);
    console.log('  Email:', correctUser.email);
    console.log('  Name:', correctUser.name);
    
    // Check for any duplicate users with the same email
    const allUsers = await usersCollection.find({ 
      email: 'doanthan@gmail.com' 
    }).toArray();
    
    console.log(`\n📊 Found ${allUsers.length} user(s) with email doanthan@gmail.com`);
    
    if (allUsers.length > 1) {
      console.log('\n⚠️  Multiple users found with same email! Listing all:');
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user._id}`);
      });
    }
    
    // Update all stores to use the correct user ID
    const stores = await storesCollection.find({}).toArray();
    console.log(`\n📦 Checking ${stores.length} stores...`);
    
    for (const store of stores) {
      let needsUpdate = false;
      const updates = {};
      
      // Check if user_id needs fixing
      if (store.user_id && store.user_id !== correctUserId) {
        console.log(`\n  Fixing store "${store.name}":`);
        console.log(`    Old user_id: ${store.user_id}`);
        console.log(`    New user_id: ${correctUserId}`);
        updates.user_id = correctUserId;
        needsUpdate = true;
      }
      
      // Check if created_by needs fixing
      if (store.created_by && store.created_by !== correctUserId) {
        console.log(`    Old created_by: ${store.created_by}`);
        console.log(`    New created_by: ${correctUserId}`);
        updates.created_by = correctUserId;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const result = await storesCollection.updateOne(
          { _id: store._id },
          { $set: updates }
        );
        console.log(`    ✅ Updated: ${result.modifiedCount} document(s)`);
      }
    }
    
    console.log('\n✅ User ID fix complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🔧 Fixing user IDs...\n');
fixUserId();
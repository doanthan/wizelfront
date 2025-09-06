import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkStores() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const storesCollection = db.collection('stores');
    const usersCollection = db.collection('users');
    
    // Get all stores
    const stores = await storesCollection.find({ 
      is_deleted: { $ne: true } 
    }).toArray();
    
    console.log(`\nTotal stores in database: ${stores.length}`);
    
    if (stores.length > 0) {
      console.log('\nStores list:');
      stores.forEach(store => {
        console.log(`  - ${store.name} (${store._id})`);
        console.log(`    URL: ${store.url}`);
        console.log(`    Created by: ${store.user_id || store.created_by}`);
        console.log(`    Contract: ${store.contract_id}`);
      });
    }
    
    // Check user permissions
    const user = await usersCollection.findOne({ 
      email: 'doanthan@gmail.com' 
    });
    
    if (user) {
      console.log(`\nUser ${user.email} permissions:`);
      console.log(`  - Is Super Admin: ${user.is_super_admin || false}`);
      console.log(`  - Store permissions count: ${user.store_permissions?.length || 0}`);
      
      if (user.store_permissions?.length > 0) {
        console.log('\n  Store access:');
        user.store_permissions.forEach(sp => {
          const store = stores.find(s => s._id.toString() === sp.store_id.toString());
          console.log(`    - ${store?.name || sp.store_id}: ${sp.role}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
checkStores();
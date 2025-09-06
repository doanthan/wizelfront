import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkUserPermissions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    
    // Find the user
    const user = await usersCollection.findOne({ 
      email: 'doanthan@gmail.com' 
    });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('\nUser:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Is Super Admin:', user.is_super_admin || false);
    console.log('\nStore permissions count:', user.store_permissions?.length || 0);
    
    if (user.store_permissions?.length > 0) {
      console.log('\nStore permissions:');
      user.store_permissions.forEach(sp => {
        console.log(`  - ${sp.store_name || sp.store_id}: ${sp.role}`);
        console.log(`    Permissions:`, Object.keys(sp.permissions || {}).filter(k => sp.permissions[k]).join(', '));
      });
    } else {
      console.log('\nNo store permissions found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
checkUserPermissions();
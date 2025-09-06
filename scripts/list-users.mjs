import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    
    console.log(`\n📊 Total users in database: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Users list:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'No name'}`);
        console.log('   ID:', user._id);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Is Super Admin:', user.is_super_admin || false);
        console.log('   Store Permissions:', user.store_permissions?.length || 0);
        console.log('   Created At:', user.createdAt);
      });
    } else {
      console.log('\n❌ No users found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🔍 Listing all users in database...\n');
listUsers();
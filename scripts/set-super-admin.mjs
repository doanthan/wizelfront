import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setSuperAdmin() {
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
      console.error('❌ User not found!');
      return;
    }
    
    console.log('\n✅ User found:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  ID:', user._id);
    console.log('  Role:', user.role);
    console.log('  Is Super Admin:', user.is_super_admin);
    
    // Update user to be super admin
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          is_super_admin: true,
          role: 'super_admin',
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ User has been set as super admin');
    } else {
      console.log('\n⚠️  No changes made (user might already be super admin)');
    }
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    console.log('\n📋 Updated user status:');
    console.log('  Role:', updatedUser.role);
    console.log('  Is Super Admin:', updatedUser.is_super_admin);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🔧 Setting user as super admin...\n');
setSuperAdmin();
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkUserSuper() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the user
    const user = await User.findOne({ email: 'doanthan@gmail.com' });
    
    if (user) {
      console.log('\n📋 User details:');
      console.log('  ID:', user._id);
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Is Super User:', user.is_super_user);
      console.log('  Super User Role:', user.super_user_role);
      console.log('  Store Permissions:', user.store_permissions?.length || 0);
      
      // Update to make super admin
      if (!user.is_super_user) {
        console.log('\n🔧 Updating user to super admin...');
        user.is_super_user = true;
        user.super_user_role = 'SUPER_ADMIN';
        await user.save();
        console.log('✅ User is now super admin');
      } else {
        console.log('\n✅ User is already super admin');
      }
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🔍 Checking user super admin status...\n');
checkUserSuper();
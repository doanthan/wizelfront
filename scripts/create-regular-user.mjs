import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

async function createRegularUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'doanthan@gmail.com';
    const password = '123123123';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('⚠️  User already exists with email:', email);
      console.log('Current user details:');
      console.log('  - Name:', existingUser.name);
      console.log('  - Role:', existingUser.role);
      console.log('  - Is Super User:', existingUser.is_super_user);
      
      // Reset to regular user
      console.log('\n🔄 Resetting user to regular (non-super) user...');
      existingUser.role = 'user';
      existingUser.is_super_user = false;
      existingUser.super_user_role = undefined;
      existingUser.super_user_permissions = [];
      existingUser.super_user_created_at = undefined;
      existingUser.super_user_created_by = undefined;
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      
      await existingUser.save();
      console.log('✅ User reset to regular user with new password');
    } else {
      // Create new user
      console.log('📝 Creating new regular user...');
      
      const newUser = new User({
        name: 'Doan Than',
        email: email,
        password: password, // Will be hashed by pre-save hook
        role: 'user', // Regular user role
        is_super_user: false,
        stores: [],
        store_permissions: [],
        createdAt: new Date()
      });
      
      await newUser.save();
      console.log('✅ New regular user created successfully!');
      console.log('\n📋 User details:');
      console.log('  - Email:', email);
      console.log('  - Password:', password);
      console.log('  - Role:', newUser.role);
      console.log('  - Is Super User:', false);
    }
    
    console.log('\n🔐 Login credentials:');
    console.log('  Email: doanthan@gmail.com');
    console.log('  Password: 123123123');
    console.log('\n✨ User can now sign in as a regular user at http://localhost:3003/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🚀 Creating regular user account...\n');
createRegularUser();
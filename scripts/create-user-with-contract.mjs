import mongoose from 'mongoose';
import User from '../models/User.js';
import Contract from '../models/Contract.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

async function createUserWithContract() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'doanthan@gmail.com';
    const password = '123123123';
    const name = 'Doan Than';
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('⚠️  User already exists with email:', email);
      console.log('Current user details:');
      console.log('  - Name:', user.name);
      console.log('  - Role:', user.role);
      console.log('  - Has Contract:', !!user.primary_contract_id);
      
      if (!user.primary_contract_id) {
        console.log('\n📄 User exists but has no contract. Creating contract...');
      } else {
        console.log('  - Contract ID:', user.primary_contract_id);
        
        // Reset to regular user but keep contract
        console.log('\n🔄 Resetting user to regular (non-super) user but keeping contract...');
        user.role = 'user';
        user.is_super_user = false;
        user.super_user_role = undefined;
        user.super_user_permissions = [];
        user.super_user_created_at = undefined;
        user.super_user_created_by = undefined;
        
        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        await user.save();
        console.log('✅ User reset to regular user with existing contract');
        
        const contract = await Contract.findById(user.primary_contract_id);
        console.log('\n📋 Contract details:');
        console.log('  - Name:', contract.name);
        console.log('  - Type:', contract.contract_type);
        console.log('  - Active:', contract.is_active);
        console.log('  - Max Stores:', contract.max_stores);
        console.log('  - Max Users:', contract.max_users);
        
        await mongoose.disconnect();
        console.log('\n🔐 Login credentials:');
        console.log('  Email: doanthan@gmail.com');
        console.log('  Password: 123123123');
        console.log('\n✨ User can now sign in at http://localhost:3003/login');
        console.log('👋 Disconnected from MongoDB');
        return;
      }
    } else {
      // Create new user
      console.log('📝 Creating new user...');
      
      user = new User({
        name: name,
        email: email,
        password: password, // Will be hashed by pre-save hook
        role: 'user', // Regular user role
        is_super_user: false,
        stores: [],
        store_permissions: [],
        contract_access: [],
        createdAt: new Date()
      });
      
      await user.save();
      console.log('✅ New user created successfully!');
    }
    
    // Create contract for the user (new user or existing without contract)
    console.log('\n📄 Creating contract for user...');
    
    const contract = new Contract({
      name: `${name}'s Contract`,
      billing_email: email,
      owner_id: user._id,
      stripe_customer_id: 'cus_' + Date.now(), // Mock Stripe ID for now
      contract_type: 'individual',
      max_stores: 3, // Allow 3 stores
      max_users: 5,  // Allow 5 users
      features_enabled: ['stores', 'analytics', 'campaigns', 'ai_basic', 'reports'],
      ai_credits_balance: 100, // Give some starter credits
      ai_credits_purchased: 100
    });
    
    await contract.save();
    
    console.log('✅ Contract created successfully!');
    console.log('  - Contract ID:', contract._id);
    console.log('  - Type:', contract.contract_type);
    console.log('  - Max Stores:', contract.max_stores);
    console.log('  - Max Users:', contract.max_users);
    
    // Update user with contract reference
    user.primary_contract_id = contract._id;
    user.contract_access = [{
      contract_id: contract._id,
      role: 'owner',
      added_at: new Date()
    }];
    
    await user.save();
    console.log('✅ User linked to contract!');
    
    console.log('\n📋 Final user details:');
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Contract ID:', user.primary_contract_id);
    console.log('  - Is Super User:', user.is_super_user);
    
    console.log('\n📊 Contract summary:');
    console.log('  - Type:', contract.contract_type);
    console.log('  - Active:', contract.is_active);
    console.log('  - Can create', contract.max_stores, 'stores');
    console.log('  - Can add', contract.max_users, 'users');
    console.log('  - AI Credits:', contract.ai_credits_balance);
    
    console.log('\n🔐 Login credentials:');
    console.log('  Email: doanthan@gmail.com');
    console.log('  Password: 123123123');
    console.log('\n✨ User can now sign in at http://localhost:3003/login');
    console.log('   They have a contract and can create up to', contract.max_stores, 'stores!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🚀 Creating user with contract (as if they just signed up)...\n');
createUserWithContract();
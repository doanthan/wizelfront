#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Contract from '../models/Contract.js';
import ContractSeat from '../models/ContractSeat.js';
import Store from '../models/Store.js';
import Role from '../models/Role.js';

// Load environment variables
dotenv.config();

console.log('🚀 Setting up fresh test data...\n');

async function setupTestData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create system roles
    console.log('📋 Creating system roles...');
    const roles = await Role.createSystemRoles();
    console.log(`✅ Created ${roles.length} system roles\n`);

    // Step 2: Create a test user
    console.log('👤 Creating test user: doanthan@gmail.com');
    
    const user = new User({
      name: 'Doan Than',
      email: 'doanthan@gmail.com',
      password: '123123123', // Let the User model's pre-save hook handle hashing
      status: 'active',
      timezone: 'America/New_York'
    });
    
    await user.save();
    console.log(`✅ Created user: ${user.email} (ID: ${user._id})\n`);

    // Step 3: Create a contract for the user
    console.log('💼 Creating test contract...');
    const contract = new Contract({
      contract_name: "Doan's Test Contract",
      billing_email: user.email,
      owner_id: user._id,
      billing_contact_id: user._id,
      stripe_customer_id: `test_cus_${Date.now()}`,
      status: 'active'
    });
    
    await contract.save();
    console.log(`✅ Created contract: ${contract.contract_name} (ID: ${contract._id})\n`);

    // Step 4: Set user's personal contract
    user.personal_contract_id = contract._id;
    await user.save();

    // Step 5: Create ContractSeat for the user
    console.log('🪑 Creating ContractSeat...');
    const ownerRole = roles.find(role => role.name === 'owner');
    
    const seat = new ContractSeat({
      contract_id: contract._id,
      user_id: user._id,
      seat_type: 'included',
      default_role_id: ownerRole._id,
      invited_by: user._id,
      status: 'active'
    });
    
    await seat.save();
    console.log(`✅ Created ContractSeat (ID: ${seat._id})\n`);

    // Step 6: Update user's active seats
    user.addSeat(contract._id, contract.contract_name, seat._id);
    await user.save();

    // Step 7: Create a test store
    console.log('🏪 Creating test store...');
    const store = new Store({
      name: 'Test Store',
      url: 'https://teststore.myshopify.com',
      owner_id: user._id,
      contract_id: contract._id,
      billing_email: user.email,
      platform: 'shopify',
      subscription_status: 'trialing',
      timezone: 'America/New_York',
      currency: 'USD'
    });
    
    await store.save();
    console.log(`✅ Created store: ${store.name} (ID: ${store._id}, Public ID: ${store.public_id})\n`);

    // Step 8: Grant store access via ContractSeat
    seat.grantStoreAccess(store._id, ownerRole._id, user._id);
    await seat.save();

    // Step 9: Sync store team members
    await store.syncTeamMembers();

    console.log('📊 Setup Summary:');
    console.log(`   - User: ${user.email}`);
    console.log(`   - Contract: ${contract.contract_name}`);
    console.log(`   - Store: ${store.name} (${store.public_id})`);
    console.log(`   - Roles: ${roles.length} system roles`);
    console.log('\n✅ Test setup completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestData();
}

export { setupTestData };
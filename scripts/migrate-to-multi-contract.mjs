#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Contract from '../models/Contract.js';
import ContractSeat from '../models/ContractSeat.js';
import Store from '../models/Store.js';
import Role from '../models/Role.js';

// Load environment variables
dotenv.config();

console.log('🚀 Starting migration to multi-contract architecture...\n');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function createSystemRoles() {
  console.log('📋 Creating system roles...');
  
  try {
    const roles = await Role.createSystemRoles();
    console.log(`✅ Created/updated ${roles.length} system roles:`);
    roles.forEach(role => {
      console.log(`   - ${role.display_name} (Level ${role.level})`);
    });
    return roles;
  } catch (error) {
    console.error('❌ Error creating system roles:', error);
    throw error;
  }
}

async function migrateContracts() {
  console.log('\n💼 Migrating contracts to new schema...');
  
  try {
    const contracts = await Contract.find({});
    let migrated = 0;
    
    for (const contract of contracts) {
      let needsUpdate = false;
      
      // Add public_id if missing
      if (!contract.public_id) {
        const { generateNanoid } = await import('../lib/nanoid-generator.js');
        contract.public_id = await generateNanoid(8);
        needsUpdate = true;
      }
      
      // Migrate to new structure
      if (!contract.contract_name && contract.name) {
        contract.contract_name = contract.name;
        needsUpdate = true;
      }
      
      // Set billing_contact_id to owner_id if missing
      if (!contract.billing_contact_id && contract.owner_id) {
        contract.billing_contact_id = contract.owner_id;
        needsUpdate = true;
      }
      
      // Migrate stores structure
      if (!contract.stores && (contract.max_stores || contract.current_stores_count !== undefined)) {
        contract.stores = {
          max_allowed: contract.max_stores || 1,
          price_per_additional: 29,
          active_count: contract.current_stores_count || 0
        };
        needsUpdate = true;
      }
      
      // Migrate AI credits structure
      if (!contract.ai_credits && (contract.ai_credits_balance !== undefined || contract.ai_credits_purchased !== undefined)) {
        contract.ai_credits = {
          monthly_included: 100,
          current_balance: contract.ai_credits_balance || 0,
          rollover_enabled: false,
          purchased_packages: [],
          usage_history: []
        };
        needsUpdate = true;
      }
      
      // Set subscription structure
      if (!contract.subscription) {
        contract.subscription = {
          status: 'trialing',
          tier: 'starter',
          price_per_month: 0,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        };
        needsUpdate = true;
      }
      
      // Set features structure
      if (!contract.features) {
        contract.features = {
          white_label: false,
          api_access: false,
          sso_enabled: false,
          advanced_analytics: false,
          priority_support: false
        };
        needsUpdate = true;
      }
      
      // Set status
      if (!contract.status) {
        contract.status = contract.is_active ? 'active' : 'suspended';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await contract.save();
        migrated++;
      }
    }
    
    console.log(`✅ Migrated ${migrated} contracts`);
    return contracts;
  } catch (error) {
    console.error('❌ Error migrating contracts:', error);
    throw error;
  }
}

async function migrateUsers() {
  console.log('\n👤 Migrating users to new schema...');
  
  try {
    const users = await User.find({});
    let migrated = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Add public_id if missing
      if (!user.public_id) {
        const { generateNanoid } = await import('../lib/nanoid-generator.js');
        user.public_id = await generateNanoid(7);
        needsUpdate = true;
      }
      
      // Set personal_contract_id from primary_contract_id
      if (!user.personal_contract_id && user.primary_contract_id) {
        user.personal_contract_id = user.primary_contract_id;
        needsUpdate = true;
      }
      
      // Initialize active_seats array
      if (!user.active_seats) {
        user.active_seats = [];
        needsUpdate = true;
      }
      
      // Add default values for new fields
      if (!user.status) {
        user.status = 'active';
        needsUpdate = true;
      }
      
      if (!user.notification_preferences) {
        user.notification_preferences = {
          email_campaigns: true,
          email_mentions: true,
          email_approvals: true,
          email_weekly_reports: false,
          push_notifications: true
        };
        needsUpdate = true;
      }
      
      if (!user.timezone) {
        user.timezone = 'America/New_York';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        migrated++;
      }
    }
    
    console.log(`✅ Migrated ${migrated} users`);
    return users;
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
}

async function createContractSeats(users, roles) {
  console.log('\n🪑 Creating ContractSeats for existing users...');
  
  try {
    const ownerRole = roles.find(role => role.name === 'owner');
    const adminRole = roles.find(role => role.name === 'admin');
    
    if (!ownerRole) {
      throw new Error('Owner role not found');
    }
    
    let seatsCreated = 0;
    
    for (const user of users) {
      // Create seat for personal contract
      if (user.personal_contract_id || user.primary_contract_id) {
        const contractId = user.personal_contract_id || user.primary_contract_id;
        
        // Check if seat already exists
        const existingSeat = await ContractSeat.findOne({
          contract_id: contractId,
          user_id: user._id
        });
        
        if (!existingSeat) {
          // Get contract to determine role
          const contract = await Contract.findById(contractId);
          let roleToAssign = ownerRole;
          
          // If user is owner of the contract, give them owner role
          if (contract && contract.owner_id.toString() === user._id.toString()) {
            roleToAssign = ownerRole;
          } else {
            // Otherwise, give them admin role if they're super user, else owner (for their own contract)
            roleToAssign = user.is_super_user ? adminRole : ownerRole;
          }
          
          const seat = new ContractSeat({
            contract_id: contractId,
            user_id: user._id,
            seat_type: 'included',
            default_role_id: roleToAssign._id,
            store_access: [], // Will be populated from existing store permissions
            invited_by: user._id, // Self-invited for migration
            invited_at: user.createdAt || new Date(),
            accepted_at: user.createdAt || new Date(),
            status: 'active'
          });
          
          await seat.save();
          
          // Update user's active_seats
          const contractName = contract ? contract.contract_name || contract.name : `${user.name}'s Contract`;
          user.addSeat(contractId, contractName, seat._id);
          await user.save();
          
          seatsCreated++;
        }
      }
      
      // Create seats for contracts they have access to through contract_access
      if (user.contract_access && user.contract_access.length > 0) {
        for (const access of user.contract_access) {
          const existingSeat = await ContractSeat.findOne({
            contract_id: access.contract_id,
            user_id: user._id
          });
          
          if (!existingSeat) {
            // Map legacy role to new role
            let roleToAssign = ownerRole;
            if (access.role === 'admin') {
              roleToAssign = adminRole;
            } else if (access.role === 'member') {
              roleToAssign = roles.find(role => role.name === 'viewer') || ownerRole;
            }
            
            const seat = new ContractSeat({
              contract_id: access.contract_id,
              user_id: user._id,
              seat_type: 'additional',
              default_role_id: roleToAssign._id,
              store_access: [],
              invited_by: user._id, // Self-invited for migration
              invited_at: access.added_at || new Date(),
              accepted_at: access.added_at || new Date(),
              status: 'active'
            });
            
            await seat.save();
            
            // Update user's active_seats
            const contract = await Contract.findById(access.contract_id);
            const contractName = contract ? contract.contract_name || contract.name : 'Unknown Contract';
            user.addSeat(access.contract_id, contractName, seat._id);
            await user.save();
            
            seatsCreated++;
          }
        }
      }
    }
    
    console.log(`✅ Created ${seatsCreated} ContractSeats`);
  } catch (error) {
    console.error('❌ Error creating ContractSeats:', error);
    throw error;
  }\n}\n\nasync function migrateStorePermissions(roles) {\n  console.log('\n🏪 Migrating store permissions to ContractSeats...');\n  \n  try {\n    const stores = await Store.find({ is_active: true, isActive: true });\n    const users = await User.find({});\n    let permissionsMigrated = 0;\n    \n    for (const user of users) {\n      // Migrate store_permissions to ContractSeat store_access\n      if (user.store_permissions && user.store_permissions.length > 0) {\n        for (const storePermission of user.store_permissions) {\n          const store = stores.find(s => s._id.toString() === storePermission.store_id.toString());\n          if (!store) continue;\n          \n          // Find user's seat for this store's contract\n          const seat = await ContractSeat.findOne({\n            contract_id: store.contract_id,\n            user_id: user._id,\n            status: 'active'\n          });\n          \n          if (seat) {\n            // Map legacy role to new role\n            let roleToAssign = roles.find(role => role.name === 'viewer');\n            \n            if (storePermission.role === 'owner') {\n              roleToAssign = roles.find(role => role.name === 'owner');\n            } else if (storePermission.role === 'admin') {\n              roleToAssign = roles.find(role => role.name === 'admin');\n            } else if (storePermission.role === 'manager') {\n              roleToAssign = roles.find(role => role.name === 'manager');\n            } else if (storePermission.role === 'creator') {\n              roleToAssign = roles.find(role => role.name === 'creator');\n            } else if (storePermission.role === 'reviewer') {\n              roleToAssign = roles.find(role => role.name === 'reviewer');\n            }\n            \n            // Add store access to seat\n            seat.grantStoreAccess(\n              store._id, \n              roleToAssign._id, \n              storePermission.granted_by || user._id\n            );\n            \n            await seat.save();\n            permissionsMigrated++;\n          }\n        }\n      }\n      \n      // Migrate legacy stores array\n      if (user.stores && user.stores.length > 0) {\n        for (const storeAccess of user.stores) {\n          const store = stores.find(s => s._id.toString() === storeAccess.store_id.toString());\n          if (!store) continue;\n          \n          // Find user's seat for this store's contract\n          const seat = await ContractSeat.findOne({\n            contract_id: store.contract_id,\n            user_id: user._id,\n            status: 'active'\n          });\n          \n          if (seat && !seat.hasStoreAccess(store._id)) {\n            // Map legacy role to new role\n            let roleToAssign = roles.find(role => role.name === 'viewer');\n            \n            if (storeAccess.role === 'owner') {\n              roleToAssign = roles.find(role => role.name === 'owner');\n            } else if (storeAccess.role === 'admin') {\n              roleToAssign = roles.find(role => role.name === 'admin');\n            } else if (storeAccess.role === 'creator') {\n              roleToAssign = roles.find(role => role.name === 'creator');\n            }\n            \n            // Add store access to seat\n            seat.grantStoreAccess(\n              store._id, \n              roleToAssign._id, \n              storeAccess.invited_by || user._id\n            );\n            \n            await seat.save();\n            permissionsMigrated++;\n          }\n        }\n      }\n    }\n    \n    console.log(`✅ Migrated ${permissionsMigrated} store permissions`);\n  } catch (error) {\n    console.error('❌ Error migrating store permissions:', error);\n    throw error;\n  }\n}\n\nasync function syncStoreTeamMembers() {\n  console.log('\n👥 Syncing store team members...');\n  \n  try {\n    const stores = await Store.find({ is_active: true, isActive: true });\n    let storesSynced = 0;\n    \n    for (const store of stores) {\n      // Add public_id if missing\n      if (!store.public_id) {\n        const { generateNanoid } = await import('../lib/nanoid-generator.js');\n        store.public_id = await generateNanoid(7);\n      }\n      \n      // Set is_active if missing\n      if (store.is_active === undefined) {\n        store.is_active = store.isActive !== false;\n      }\n      \n      // Sync team members from ContractSeats\n      await store.syncTeamMembers();\n      storesSynced++;\n    }\n    \n    console.log(`✅ Synced ${storesSynced} stores`);\n  } catch (error) {\n    console.error('❌ Error syncing store team members:', error);\n    throw error;\n  }\n}\n\nasync function validateMigration() {\n  console.log('\n🔍 Validating migration...');\n  \n  try {\n    const userCount = await User.countDocuments({});\n    const contractCount = await Contract.countDocuments({});\n    const seatCount = await ContractSeat.countDocuments({});\n    const storeCount = await Store.countDocuments({ is_active: true, isActive: true });\n    const roleCount = await Role.countDocuments({ is_system_role: true });\n    \n    console.log('📊 Migration Summary:');\n    console.log(`   - Users: ${userCount}`);\n    console.log(`   - Contracts: ${contractCount}`);\n    console.log(`   - ContractSeats: ${seatCount}`);\n    console.log(`   - Active Stores: ${storeCount}`);\n    console.log(`   - System Roles: ${roleCount}`);\n    \n    // Check for users without seats\n    const usersWithoutSeats = await User.find({\n      $or: [\n        { active_seats: { $size: 0 } },\n        { active_seats: { $exists: false } }\n      ],\n      status: 'active'\n    });\n    \n    if (usersWithoutSeats.length > 0) {\n      console.log(`⚠️  Found ${usersWithoutSeats.length} active users without seats:`);\n      usersWithoutSeats.forEach(user => {\n        console.log(`   - ${user.email} (${user._id})`);\n      });\n    }\n    \n    // Check for contracts without seats\n    const contractsWithoutSeats = await Contract.aggregate([\n      {\n        $lookup: {\n          from: 'contractseats',\n          localField: '_id',\n          foreignField: 'contract_id',\n          as: 'seats'\n        }\n      },\n      {\n        $match: {\n          status: 'active',\n          seats: { $size: 0 }\n        }\n      }\n    ]);\n    \n    if (contractsWithoutSeats.length > 0) {\n      console.log(`⚠️  Found ${contractsWithoutSeats.length} active contracts without seats`);\n    }\n    \n    console.log('\\n✅ Migration validation completed!');\n    \n  } catch (error) {\n    console.error('❌ Error during validation:', error);\n    throw error;\n  }\n}\n\nasync function runMigration() {\n  try {\n    await connectToDatabase();\n    \n    // Step 1: Create system roles\n    const roles = await createSystemRoles();\n    \n    // Step 2: Migrate contracts\n    const contracts = await migrateContracts();\n    \n    // Step 3: Migrate users\n    const users = await migrateUsers();\n    \n    // Step 4: Create ContractSeats\n    await createContractSeats(users, roles);\n    \n    // Step 5: Migrate store permissions\n    await migrateStorePermissions(roles);\n    \n    // Step 6: Sync store team members\n    await syncStoreTeamMembers();\n    \n    // Step 7: Validate migration\n    await validateMigration();\n    \n    console.log('\\n🎉 Migration completed successfully!\\n');\n    \n  } catch (error) {\n    console.error('\\n💥 Migration failed:', error);\n    process.exit(1);\n  } finally {\n    await mongoose.disconnect();\n    console.log('👋 Disconnected from MongoDB');\n  }\n}\n\n// Handle command line execution\nif (import.meta.url === `file://${process.argv[1]}`) {\n  runMigration();\n}\n\nexport { runMigration };
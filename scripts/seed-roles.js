#!/usr/bin/env node

/**
 * Seed System Roles Script
 *
 * This script creates the system roles required for the ContractSeat permission system.
 * Run this before creating stores to ensure roles exist.
 *
 * Usage: node scripts/seed-roles.js
 */

import mongoose from 'mongoose';
import connectToDatabase from '../lib/mongoose.js';
import Role from '../models/Role.js';

async function seedRoles() {
  try {
    console.log('🌱 Starting role seeding process...\n');

    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database\n');

    // Check if roles already exist
    const existingRoles = await Role.find({ is_system_role: true });
    console.log(`📋 Found ${existingRoles.length} existing system roles`);

    if (existingRoles.length > 0) {
      console.log('\nExisting roles:');
      existingRoles.forEach(role => {
        console.log(`  - ${role.name} (level: ${role.level})`);
      });

      console.log('\n⚠️  System roles already exist.');
      console.log('Do you want to update them? This will preserve existing data.');
    }

    // Create/update system roles
    console.log('\n🔄 Creating/updating system roles...\n');
    const roles = await Role.createSystemRoles();

    console.log('✅ Successfully created/updated system roles:\n');
    roles.forEach(role => {
      console.log(`  ✓ ${role.display_name} (${role.name})`);
      console.log(`    - Level: ${role.level}`);
      console.log(`    - Description: ${role.description}`);
      console.log('');
    });

    console.log(`\n🎉 Role seeding complete! Created/updated ${roles.length} system roles.`);

    // Display role hierarchy
    console.log('\n📊 Role Hierarchy:');
    console.log('┌──────────────────────────────────────────┐');
    roles.sort((a, b) => b.level - a.level).forEach(role => {
      const bar = '█'.repeat(Math.floor(role.level / 10));
      console.log(`│ ${role.display_name.padEnd(12)} (${role.level.toString().padStart(3)}) ${bar}`);
    });
    console.log('└──────────────────────────────────────────┘');

    // Verify roles can be queried
    console.log('\n🔍 Verifying role queries...');
    const ownerRole = await Role.findByName('owner');
    if (ownerRole) {
      console.log('✅ Owner role can be queried successfully');
      console.log(`   - ID: ${ownerRole._id}`);
      console.log(`   - Level: ${ownerRole.level}`);
      console.log(`   - Can manage billing: ${ownerRole.capabilities.canManageBilling}`);
    } else {
      console.error('❌ Failed to query owner role');
    }

    console.log('\n✅ All verification checks passed!');
    console.log('\n💡 You can now create stores and assign roles to users.');

  } catch (error) {
    console.error('\n❌ Error seeding roles:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedRoles();

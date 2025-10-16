/**
 * Migration Script: Cleanup Deprecated User Fields
 *
 * This script removes deprecated fields from User documents that have been
 * replaced by the ContractSeat permission system.
 *
 * Deprecated fields being removed:
 * - stores[] - Now in ContractSeat.store_access
 * - role (global) - Now in ContractSeat.default_role_id
 * - contract_access[] - Replaced by active_seats[]
 * - store_permissions[] - Now in ContractSeat.store_access
 * - store_ids[] - Can be queried from ContractSeat
 *
 * Fields being kept:
 * - active_seats[] - Core of new permission system
 * - primary_contract_id - For personal contract reference
 * - is_super_user, super_user_permissions - Super admin system
 * - All profile/preference fields
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Direct MongoDB connection (bypass lib/mongoose.js)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env file');
  process.exit(1);
}

async function cleanupDeprecatedUserFields() {
  try {
    console.log('🚀 Starting User model cleanup...\n');

    // Connect directly to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Access Users collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      let hasDeprecatedFields = false;
      const fieldsToRemove = [];

      // Check for deprecated fields
      if (user.stores && user.stores.length > 0) {
        fieldsToRemove.push('stores');
        hasDeprecatedFields = true;
      }

      if (user.role && !user.is_super_user) {
        // Keep role for super users, remove for normal users
        fieldsToRemove.push('role');
        hasDeprecatedFields = true;
      }

      if (user.contract_access && user.contract_access.length > 0) {
        fieldsToRemove.push('contract_access');
        hasDeprecatedFields = true;
      }

      if (user.store_permissions && user.store_permissions.length > 0) {
        fieldsToRemove.push('store_permissions');
        hasDeprecatedFields = true;
      }

      if (user.store_ids && user.store_ids.length > 0) {
        fieldsToRemove.push('store_ids');
        hasDeprecatedFields = true;
      }

      if (hasDeprecatedFields) {
        console.log(`🔧 Cleaning up user: ${user.email}`);
        console.log(`   Removing fields: ${fieldsToRemove.join(', ')}`);

        // Build $unset object dynamically
        const unsetFields = {};
        if (user.stores) unsetFields.stores = '';
        if (user.role && !user.is_super_user) unsetFields.role = '';
        if (user.contract_access) unsetFields.contract_access = '';
        if (user.store_permissions) unsetFields.store_permissions = '';
        if (user.store_ids) unsetFields.store_ids = '';

        // Use MongoDB $unset to remove fields
        await usersCollection.updateOne(
          { _id: user._id },
          { $unset: unsetFields }
        );

        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n✅ Cleanup completed!');
    console.log(`   Updated: ${updatedCount} users`);
    console.log(`   Skipped: ${skippedCount} users (already clean)`);
    console.log('\n📝 Summary of changes:');
    console.log('   - Removed: stores[]');
    console.log('   - Removed: role (except super users)');
    console.log('   - Removed: contract_access[]');
    console.log('   - Removed: store_permissions[]');
    console.log('   - Removed: store_ids[]');
    console.log('\n   Kept: active_seats[], primary_contract_id, super user fields');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupDeprecatedUserFields()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default cleanupDeprecatedUserFields;

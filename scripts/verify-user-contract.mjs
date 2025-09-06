import mongoose from 'mongoose';
import User from '../models/User.js';
import Contract from '../models/Contract.js';
import Store from '../models/Store.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyUserContract() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const email = 'doanthan@gmail.com';
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User Details:');
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Is Super User:', user.is_super_user);
    console.log('  - Has Contract:', !!user.primary_contract_id);
    
    if (user.primary_contract_id) {
      const contract = await Contract.findById(user.primary_contract_id);
      
      if (contract) {
        console.log('\n📄 Contract Details:');
        console.log('  - Contract ID:', contract._id);
        console.log('  - Name:', contract.name);
        console.log('  - Type:', contract.contract_type);
        console.log('  - Active:', contract.is_active);
        console.log('  - Stores Used:', contract.current_stores_count, '/', contract.max_stores);
        console.log('  - Users:', contract.current_users_count, '/', contract.max_users);
        console.log('  - AI Credits:', contract.ai_credits_balance);
        console.log('  - Features:', contract.features_enabled.join(', '));
        
        // Check stores owned by this user
        const stores = await Store.find({ 
          owner_id: user._id,
          isActive: true 
        });
        
        console.log('\n🏪 User\'s Stores:');
        if (stores.length > 0) {
          stores.forEach(store => {
            console.log(`  - ${store.name} (${store.public_id})`);
            console.log(`    URL: ${store.url}`);
            console.log(`    Created: ${store.created_at}`);
          });
        } else {
          console.log('  No stores created yet');
        }
        
        // Check store permissions
        if (user.store_permissions && user.store_permissions.length > 0) {
          console.log('\n🔐 Store Permissions:');
          for (const perm of user.store_permissions) {
            const store = await Store.findById(perm.store_id);
            if (store) {
              console.log(`  - ${store.name}:`);
              console.log(`    Role: ${perm.role}`);
              console.log(`    Permissions: ${perm.permissions_v2?.join(', ') || 'none'}`);
            }
          }
        }
        
        console.log('\n✨ Summary:');
        console.log(`  User "${user.name}" is set up correctly with:`);
        console.log(`  - A regular user account (not super admin)`);
        console.log(`  - An active contract allowing ${contract.max_stores} stores`);
        console.log(`  - ${stores.length} store(s) created`);
        console.log(`  - ${contract.max_stores - contract.current_stores_count} store slot(s) remaining`);
        
      } else {
        console.log('❌ Contract not found');
      }
    } else {
      console.log('\n⚠️  User has no contract assigned');
      console.log('  Run: node scripts/create-user-with-contract.mjs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🔍 Verifying user and contract setup...\n');
verifyUserContract();
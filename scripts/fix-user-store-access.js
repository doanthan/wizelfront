import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import User from '../models/User.js';
import Store from '../models/Store.js';
import ContractSeat from '../models/ContractSeat.js';
import Contract from '../models/Contract.js';
import Role from '../models/Role.js';

async function fixUserStoreAccess() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user by email (change this to your email)
    const userEmail = process.env.USER_EMAIL || 'doanthan@gmail.com'; // Change this to your email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error(`User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (${user._id})`);

    // Find all stores with Klaviyo integration
    const stores = await Store.find({
      is_deleted: { $ne: true },
      'klaviyo_integration.public_id': { $exists: true, $ne: null }
    });

    console.log(`Found ${stores.length} stores with Klaviyo integration`);
    stores.forEach(s => {
      console.log(`  - ${s.name} (${s.public_id}) - Klaviyo: ${s.klaviyo_integration?.public_id}`);
    });

    // Check if user has a contract
    let contract = await Contract.findOne({ owner_id: user._id });

    if (!contract) {
      // Create a personal contract for the user
      console.log('Creating personal contract for user...');
      contract = await Contract.create({
        owner_id: user._id,
        name: `${user.name || user.email}'s Contract`,
        type: 'personal',
        status: 'active',
        billing: {
          status: 'active',
          plan: 'pro',
          billing_cycle: 'monthly'
        },
        stores: stores.map(s => s._id)
      });
      console.log('Contract created:', contract._id);
    } else {
      console.log('Found existing contract:', contract._id);
      // Update contract to include all stores
      contract.stores = stores.map(s => s._id);
      await contract.save();
      console.log('Updated contract with all stores');
    }

    // Find or create the owner role
    let ownerRole = await Role.findOne({ name: 'owner' });
    if (!ownerRole) {
      console.log('Creating owner role...');
      ownerRole = await Role.create({
        name: 'owner',
        level: 100,
        description: 'Full control over the contract',
        permissions: {
          stores: { create: true, edit: true, delete: true, manage_integrations: true },
          campaigns: { create: true, edit_own: true, edit_all: true, approve: true, send: true, delete_all: true },
          ai: { generate_content: true, use_premium_models: true, unlimited_regenerations: true },
          brands: { create: true, edit: true, delete: true },
          team: { invite_users: true, remove_users: true, manage_roles: true, manage_store_access: true },
          analytics: { view_own: true, view_all: true, export: true, view_financial: true },
          billing: { view: true, manage: true, purchase_credits: true }
        }
      });
    }

    // Check if ContractSeat exists
    let seat = await ContractSeat.findOne({
      user_id: user._id,
      contract_id: contract._id
    });

    if (!seat) {
      // Create ContractSeat with access to all stores
      console.log('Creating ContractSeat with store access...');
      seat = await ContractSeat.create({
        contract_id: contract._id,
        user_id: user._id,
        default_role_id: ownerRole._id,
        store_access: stores.map(store => ({
          store_id: store._id,
          role_id: ownerRole._id,
          granted_by: user._id,
          granted_at: new Date()
        })),
        status: 'active',
        invited_by: user._id,
        activated_at: new Date()
      });
      console.log('ContractSeat created with access to', stores.length, 'stores');
    } else {
      // Update existing seat with store access
      console.log('Updating existing ContractSeat...');
      seat.store_access = stores.map(store => ({
        store_id: store._id,
        role_id: ownerRole._id,
        granted_by: user._id,
        granted_at: new Date()
      }));
      seat.status = 'active';
      seat.default_role_id = ownerRole._id;
      await seat.save();
      console.log('ContractSeat updated with access to', stores.length, 'stores');
    }

    // Update user's store_ids as a fallback
    user.store_ids = stores.map(s => s._id);
    user.is_super_user = true; // Set as super user for full access
    await user.save();
    console.log('Updated user.store_ids and set as super user');

    // Verify the setup
    const verificationSeat = await ContractSeat.findOne({
      user_id: user._id,
      status: 'active'
    }).populate('default_role_id');

    console.log('\n✅ Setup Complete!');
    console.log('User:', user.email);
    console.log('Contract:', contract._id);
    console.log('ContractSeat:', seat._id);
    console.log('Role:', ownerRole.name);
    console.log('Store Access:', seat.store_access.length, 'stores');
    console.log('User is_super_user:', user.is_super_user);
    console.log('\nStores with access:');
    stores.forEach(s => {
      console.log(`  ✓ ${s.name} (${s.public_id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
fixUserStoreAccess();
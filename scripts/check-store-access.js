// Script to check store access for a user
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Store schema (simplified)
const storeSchema = new mongoose.Schema({
  public_id: String,
  name: String,
  owner_id: mongoose.Schema.Types.ObjectId,
  contract_id: mongoose.Schema.Types.ObjectId,
  klaviyo_integration: Object,
  users: Array,
  shared_with: Array,
  team_members: Array
}, { strict: false });

const Store = mongoose.model('Store', storeSchema);

// User schema
const userSchema = new mongoose.Schema({
  email: String,
  is_super_user: Boolean,
  super_admin: Boolean
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function checkStoreAccess() {
  await connectDB();

  try {
    const storeId = '68d3031a3931e58f598461a5';
    const storePublicId = '7MP60fH';
    const userId = '68d1b4bc3e25dd334e051698';

    console.log('\n=== Checking Store Access ===\n');
    console.log('Store ID:', storeId);
    console.log('Store Public ID:', storePublicId);
    console.log('User ID:', userId);
    console.log('\n');

    // Find the store
    const store = await Store.findById(storeId);
    if (!store) {
      console.log('❌ Store not found!');
      return;
    }

    console.log('✅ Store found:', {
      _id: store._id.toString(),
      public_id: store.public_id,
      name: store.name,
      owner_id: store.owner_id?.toString(),
      contract_id: store.contract_id?.toString(),
      klaviyo_integration: store.klaviyo_integration ? {
        public_id: store.klaviyo_integration.public_id,
        hasApiKey: !!store.klaviyo_integration.apiKey,
        hasOAuth: !!store.klaviyo_integration.oauth_token
      } : null
    });

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('\n✅ User found:', {
      _id: user._id.toString(),
      email: user.email,
      is_super_user: user.is_super_user,
      super_admin: user.super_admin
    });

    // Check ownership
    console.log('\n=== Access Check Results ===\n');

    const isOwner = store.owner_id?.toString() === userId;
    console.log(`1. Is Owner: ${isOwner ? '✅ YES' : '❌ NO'}`);
    if (!isOwner) {
      console.log(`   Store owner: ${store.owner_id?.toString()}`);
      console.log(`   Your user ID: ${userId}`);
    }

    const isSuperUser = user.is_super_user || user.super_admin;
    console.log(`2. Is Super User/Admin: ${isSuperUser ? '✅ YES' : '❌ NO'}`);

    // Check if user is in the store's users array
    const inUsersArray = store.users?.some(u =>
      u.userId?.toString() === userId || u.user_id?.toString() === userId
    );
    console.log(`3. In Store Users Array: ${inUsersArray ? '✅ YES' : '❌ NO'}`);

    // Check if user is in shared_with array
    const inSharedWith = store.shared_with?.some(s =>
      s.user?.toString() === userId
    );
    console.log(`4. In Shared With: ${inSharedWith ? '✅ YES' : '❌ NO'}`);

    // Check team_members
    const inTeamMembers = store.team_members?.some(tm =>
      tm.user_id?.toString() === userId
    );
    console.log(`5. In Team Members: ${inTeamMembers ? '✅ YES' : '❌ NO'}`);

    // Final verdict
    console.log('\n=== FINAL VERDICT ===\n');
    const hasAccess = isOwner || isSuperUser || inUsersArray || inSharedWith || inTeamMembers;
    if (hasAccess) {
      console.log('✅ USER HAS ACCESS TO THIS STORE');
      if (isOwner) console.log('   Reason: User is the store owner');
      if (isSuperUser) console.log('   Reason: User is a super admin');
      if (inUsersArray) console.log('   Reason: User is in store users array');
      if (inSharedWith) console.log('   Reason: User is in shared_with array');
      if (inTeamMembers) console.log('   Reason: User is in team_members array');
    } else {
      console.log('❌ USER DOES NOT HAVE ACCESS TO THIS STORE');
      console.log('\nTo fix this, you can:');
      console.log('1. Update the store owner_id to your user ID');
      console.log('2. Make yourself a super admin');
      console.log('3. Add yourself to the store users/team');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkStoreAccess();
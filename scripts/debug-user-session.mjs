import mongoose from 'mongoose';
import User from '../models/User.js';
import Contract from '../models/Contract.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugUserSession() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check the user we created
    const email = 'doanthan@gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      console.log('Available users:');
      const allUsers = await User.find({}).select('email name _id');
      allUsers.forEach(u => console.log(`  - ${u.email} (ID: ${u._id})`));
      return;
    }
    
    console.log('👤 User Found:');
    console.log('  - ID:', user._id);
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Has Contract ID:', !!user.primary_contract_id);
    
    if (user.primary_contract_id) {
      const contract = await Contract.findById(user.primary_contract_id);
      if (contract) {
        console.log('\n📄 Contract Found:');
        console.log('  - Contract ID:', contract._id);
        console.log('  - Name:', contract.name);
        console.log('  - Owner ID:', contract.owner_id);
        console.log('  - Max Stores:', contract.max_stores);
        console.log('  - Current Stores:', contract.current_stores_count);
        console.log('  - Active:', contract.is_active);
      } else {
        console.log('\n❌ Contract not found for ID:', user.primary_contract_id);
      }
    } else {
      console.log('\n⚠️  User has no contract - this may be causing the error');
    }
    
    // Check if there are any stores for this user
    const Store = (await import('../models/Store.js')).default;
    const stores = await Store.find({ owner_id: user._id });
    console.log('\n🏪 User\'s Stores:', stores.length);
    stores.forEach(store => {
      console.log(`  - ${store.name} (${store._id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
console.log('🔍 Debugging user session...\n');
debugUserSession();
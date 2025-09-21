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

async function listUsersWithStores() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}).select('email name store_ids is_super_user');

    console.log(`\nFound ${users.length} total users`);
    console.log('\n=== ALL Users ===\n');

    for (const user of users) {
      // Show all users, not just those with store access
        console.log(`📧 Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Store IDs: ${user.store_ids?.length || 0} stores`);
        console.log(`   Super User: ${user.is_super_user ? '✅ Yes' : '❌ No'}`);

        // Check ContractSeats
        const seats = await ContractSeat.find({ user_id: user._id, status: 'active' });
        console.log(`   Active ContractSeats: ${seats.length}`);

        if (seats.length > 0) {
          for (const seat of seats) {
            console.log(`     - Seat: ${seat._id}`);
            console.log(`       Store Access: ${seat.store_access?.length || 0} stores`);
          }
        }
        console.log('---');
    }

    // Also find stores with Klaviyo
    console.log('\n=== Stores with Klaviyo Integration ===\n');
    const stores = await Store.find({
      is_deleted: { $ne: true },
      'klaviyo_integration.public_id': { $exists: true, $ne: null }
    }).select('name public_id klaviyo_integration.public_id');

    stores.forEach(store => {
      console.log(`🏪 ${store.name}`);
      console.log(`   Public ID: ${store.public_id}`);
      console.log(`   Klaviyo ID: ${store.klaviyo_integration?.public_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
listUsersWithStores();
// Script to find all stores with a specific Klaviyo integration
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
}, { strict: false });

const Store = mongoose.model('Store', storeSchema);

async function findStoresWithKlaviyo() {
  await connectDB();

  try {
    const klaviyoPublicId = 'Pe5Xw6';

    console.log(`\n=== Finding all stores with Klaviyo ID: ${klaviyoPublicId} ===\n`);

    // Find all stores with this Klaviyo integration
    const stores = await Store.find({
      'klaviyo_integration.public_id': klaviyoPublicId
    });

    console.log(`Found ${stores.length} store(s) with this Klaviyo integration:\n`);

    stores.forEach((store, index) => {
      console.log(`Store ${index + 1}:`);
      console.log(`  ID: ${store._id}`);
      console.log(`  Public ID: ${store.public_id}`);
      console.log(`  Name: ${store.name}`);
      console.log(`  Owner ID: ${store.owner_id}`);
      console.log(`  Contract ID: ${store.contract_id}`);
      console.log(`  Klaviyo Public ID: ${store.klaviyo_integration?.public_id}`);
      console.log(`  Has API Key: ${!!store.klaviyo_integration?.apiKey}`);
      console.log(`  Is Active: ${store.is_active !== false && store.isActive !== false}`);
      console.log('---');
    });

    if (stores.length > 1) {
      console.log('\n⚠️  WARNING: Multiple stores share the same Klaviyo integration!');
      console.log('This could cause permission issues when accessing campaigns.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findStoresWithKlaviyo();
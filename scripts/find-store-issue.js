// Script to debug the store issue
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

async function debugStoreIssue() {
  await connectDB();

  try {
    const problematicStoreId = '68c3aafb7fd409a3846a22a5';
    const problematicOwnerId = '68b6755c2621be8a2070395d';

    console.log('\n=== Debugging Store Issue ===\n');

    // Find the problematic store
    const problemStore = await Store.findById(problematicStoreId);
    if (problemStore) {
      console.log('Found problematic store:');
      console.log(`  ID: ${problemStore._id}`);
      console.log(`  Public ID: ${problemStore.public_id}`);
      console.log(`  Name: ${problemStore.name}`);
      console.log(`  Owner ID: ${problemStore.owner_id}`);
      console.log(`  Klaviyo Public ID: ${problemStore.klaviyo_integration?.public_id}`);
      console.log(`  Has API Key: ${!!problemStore.klaviyo_integration?.apiKey}`);
      console.log('');
    }

    // Find all stores owned by the problematic owner
    const storesOwnedByOther = await Store.find({ owner_id: problematicOwnerId });
    console.log(`\nFound ${storesOwnedByOther.length} stores owned by ${problematicOwnerId}:`);
    storesOwnedByOther.forEach(store => {
      console.log(`  - ${store.name} (${store.public_id}) - Klaviyo: ${store.klaviyo_integration?.public_id || 'none'}`);
    });

    // Find all stores with similar names
    const similarStores = await Store.find({ name: /asdasdsa/i });
    console.log(`\nFound ${similarStores.length} stores with name containing 'asdasdsa':`);
    similarStores.forEach(store => {
      console.log(`  - ${store.name} (${store.public_id}) - Owner: ${store.owner_id} - Klaviyo: ${store.klaviyo_integration?.public_id || 'none'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugStoreIssue();
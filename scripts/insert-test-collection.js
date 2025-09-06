// Script to insert a test collection for debugging
const mongoose = require('mongoose');
require('dotenv').config();

async function insertTestCollection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collectionsCollection = db.collection('collections');
    
    // Insert a test collection for store oERwhWN
    const testCollection = {
      store_public_id: 'oERwhWN',
      shopify_collection_id: 'test-001',
      title: 'Test Collection',
      handle: 'test-collection',
      body_html: '<p>This is a test collection</p>',
      products_count: 5,
      status: 'active',
      sync_status: 'synced',
      url_link: 'https://example.com/collections/test',
      domain: 'example.com',
      published_at: new Date(),
      shopify_updated_at: new Date(),
      last_synced_at: new Date(),
      marketing: {
        tagline: 'Test tagline',
        description: 'Test description',
        key_benefits: ['Benefit 1', 'Benefit 2'],
        target_audience: 'Test audience',
        campaign_focus: null,
        campaign_performance: {
          total_emails_sent: 0,
          avg_open_rate: 0,
          avg_click_rate: 0,
          last_updated: null
        }
      },
      shopify_image: {
        src: 'https://example.com/image.jpg',
        alt: 'Test image'
      },
      collection_type: 'custom',
      sort_order: 'alpha-asc',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Check if collection already exists
    const existing = await collectionsCollection.findOne({
      store_public_id: 'oERwhWN',
      title: 'Test Collection'
    });

    if (existing) {
      console.log('Test collection already exists');
    } else {
      const result = await collectionsCollection.insertOne(testCollection);
      console.log('Test collection inserted:', result.insertedId);
    }

    // Count total collections for this store
    const count = await collectionsCollection.countDocuments({
      store_public_id: 'oERwhWN'
    });
    console.log(`Total collections for store oERwhWN: ${count}`);

    // List all collections
    const allCollections = await collectionsCollection.find({
      store_public_id: 'oERwhWN'
    }).toArray();
    
    console.log('\nAll collections for store oERwhWN:');
    allCollections.forEach(col => {
      console.log(`- ${col.title} (${col.shopify_collection_id})`);
    });

    await mongoose.connection.close();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

insertTestCollection();
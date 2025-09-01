import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global;

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

/**
 * Get the MongoDB database instance
 * @param {string} dbName - Optional database name (defaults to MONGODB_DB env var)
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDatabase(dbName) {
  const client = await clientPromise;
  return client.db(dbName || process.env.MONGODB_DB || 'wizel');
}

/**
 * Get a MongoDB collection
 * @param {string} collectionName - The name of the collection
 * @param {string} dbName - Optional database name
 * @returns {Promise<import('mongodb').Collection>}
 */
export async function getCollection(collectionName, dbName) {
  const db = await getDatabase(dbName);
  return db.collection(collectionName);
}

/**
 * Test the MongoDB connection
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  try {
    const client = await clientPromise;
    await client.db().admin().ping();
    console.log('✅ Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}
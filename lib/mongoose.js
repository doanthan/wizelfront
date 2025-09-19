import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Connection options
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
};

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose
 * @returns {Promise<typeof mongoose>}
 */
async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, options).then((mongoose) => {
      console.log('✅ Mongoose connected to MongoDB');
      return mongoose;
    }).catch((error) => {
      console.error('❌ Mongoose connection failed:', error);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Event listeners for connection monitoring - only set them once
if (process.env.NODE_ENV === 'development' && !global.mongooseListenersSet) {
  global.mongooseListenersSet = true;
  
  // Increase max listeners to avoid warnings
  mongoose.connection.setMaxListeners(20);
  
  mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('👋 Mongoose connection closed through app termination');
    process.exit(0);
  });
}

export default connectToDatabase;

/**
 * Check if mongoose is connected
 * @returns {boolean}
 */
export function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection status
 * @returns {string}
 */
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

/**
 * Close the database connection
 * @returns {Promise<void>}
 */
export async function disconnect() {
  if (cached.conn) {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
  }
}
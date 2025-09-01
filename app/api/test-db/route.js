import { NextResponse } from 'next/server';
import connectToDatabase, { getConnectionStatus, isConnected } from '@/lib/mongoose';

/**
 * GET /api/test-db
 * Test database connection and return status
 */
export async function GET() {
  try {
    // Test Mongoose connection
    let mongooseConnected = isConnected();
    
    if (!mongooseConnected) {
      await connectToDatabase();
      mongooseConnected = isConnected();
    }
    
    const status = getConnectionStatus();
    
    // Get database info if connected
    let dbInfo = null;
    if (mongooseConnected) {
      const mongoose = await connectToDatabase();
      const admin = mongoose.connection.db.admin();
      const serverStatus = await admin.serverStatus();
      
      dbInfo = {
        host: serverStatus.host,
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections,
      };
    }
    
    return NextResponse.json({
      success: true,
      connection: {
        connected: mongooseConnected,
        status: status
      },
      database: dbInfo,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB || 'wizel'
      },
      message: mongooseConnected ? 'Database connected successfully' : 'Database connection failed'
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection test failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          code: error.code,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}
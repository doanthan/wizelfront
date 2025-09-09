# MongoDB & Mongoose Integration Guide

## Overview
This project uses **Mongoose** (ODM) for MongoDB operations, not the native MongoDB driver. This guide outlines the correct patterns and common pitfalls to avoid.

## Database Connection Files

### 📁 `/lib/mongoose.js` - PRIMARY CONNECTION (✅ USE THIS)
**Purpose**: Main database connection using Mongoose ODM
**Exports**: 
- `connectToDatabase()` - Primary connection function
- `isConnected()` - Check connection status
- `getConnectionStatus()` - Get current status
- `disconnect()` - Close connection

```javascript
// ✅ CORRECT - Use for all API routes with models
import connectToDatabase from '@/lib/mongoose';

export async function GET() {
  await connectToDatabase();
  // Your Mongoose model operations...
}
```

### 📁 `/lib/mongodb.js` - CLIENT PROMISE (⚠️ SPECIFIC USE)
**Purpose**: Raw MongoDB client connection
**Exports**: `clientPromise` (MongoDB client promise)
**Use Case**: Direct MongoDB operations without Mongoose models

```javascript
// ⚠️ ONLY use for raw MongoDB operations
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db("your-database");
  // Raw MongoDB operations...
}
```

## Model Architecture

### Model Files Location
```
/models/
├── User.js          - User accounts and permissions
├── Store.js         - Store/account management
├── CampaignStat.js  - Email campaign analytics
├── Brand.js         - Brand information
├── Role.js          - User roles and permissions
└── Contract.js      - Contract and seat management
```

### Model Import Pattern
```javascript
// ✅ CORRECT - Models work with mongoose connection
import CampaignStat from '@/models/CampaignStat';
import User from '@/models/User';
import Store from '@/models/Store';
```

## API Route Patterns

### Standard API Route Structure
```javascript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongoose'; // ✅ CORRECT IMPORT
import YourModel from '@/models/YourModel';

export async function GET(request) {
  try {
    // 1. Connect to database
    await connectToDatabase();
    
    // 2. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Your business logic
    const results = await YourModel.find({});
    
    // 4. Return response
    return NextResponse.json({ data: results });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Permission System Integration

### Using Model Access Control
```javascript
// ✅ Models have built-in access control methods
const { results, total } = await CampaignStat.searchWithAccessControl(
  session.user.id,
  searchQuery,
  options
);

// ✅ Check user permissions
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
const canView = hasPermission(userAccess, PERMISSIONS.VIEW_ANALYTICS);
```

## Common Import Errors & Fixes

### ❌ WRONG: Importing from mongodb.js for model operations
```javascript
import connectToDatabase from '@/lib/mongodb'; // ❌ WRONG - This doesn't export a function
```

### ✅ CORRECT: Importing from mongoose.js for model operations
```javascript
import connectToDatabase from '@/lib/mongoose'; // ✅ CORRECT - Has the function
```

### ❌ WRONG: Using models without connection
```javascript
export async function GET() {
  // Missing database connection
  const results = await CampaignStat.find({}); // Will fail
}
```

### ✅ CORRECT: Connect before using models
```javascript
export async function GET() {
  await connectToDatabase(); // ✅ Connect first
  const results = await CampaignStat.find({}); // Now works
}
```

## Model-Specific Patterns

### CampaignStat Model
```javascript
// ✅ Use the access control method
const { results } = await CampaignStat.searchWithAccessControl(
  userId,
  searchQuery,
  {
    limit: 100,
    sort: { send_time: -1 },
    dateRange: { from: startDate, to: endDate }
  }
);
```

### User Model
```javascript
// ✅ Populate related stores
const user = await User.findById(userId).populate('stores.store_id');
```

### Store Model
```javascript
// ✅ Find by public ID
const store = await Store.findOne({ public_id: storePublicId });
```

## Environment Variables

### Required MongoDB Environment Variables
```bash
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Connection Options (in mongoose.js)
```javascript
const options = {
  maxPoolSize: 10,         // Maximum connections
  minPoolSize: 5,          // Minimum connections  
  serverSelectionTimeoutMS: 5000,  // Timeout for server selection
  socketTimeoutMS: 45000,  // Socket timeout
  family: 4,               // Use IPv4
};
```

## Debugging Database Issues

### Check Connection Status
```javascript
import { isConnected, getConnectionStatus } from '@/lib/mongoose';

console.log('Connected:', isConnected());
console.log('Status:', getConnectionStatus());
```

### Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `(0, _lib_mongodb__WEBPACK_IMPORTED_MODULE_4__.default) is not a function` | Wrong import from mongodb.js | Import from mongoose.js instead |
| `MongooseError: Operation failed` | No database connection | Call `await connectToDatabase()` first |
| `ValidationError` | Model validation failed | Check model schema requirements |
| `CastError` | Invalid ObjectId format | Validate ID format before queries |
| `MongoNetworkError` | Network connectivity | Check MONGODB_URI and network |

### Logging Database Operations
```javascript
// Enable mongoose debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}
```

## Performance Best Practices

### 1. Connection Pooling
- Use the shared connection from mongoose.js
- Don't create multiple connections
- Connection is cached globally

### 2. Query Optimization
```javascript
// ✅ Use lean() for read-only data
const campaigns = await CampaignStat.find({}).lean();

// ✅ Select only needed fields
const campaigns = await CampaignStat.find({}).select('name date statistics');

// ✅ Use indexes effectively
CampaignStatSchema.index({ klaviyo_public_id: 1, send_time: -1 });
```

### 3. Error Handling
```javascript
try {
  await connectToDatabase();
  // Database operations
} catch (error) {
  if (error.name === 'MongoNetworkError') {
    // Handle network errors
  } else if (error.name === 'ValidationError') {
    // Handle validation errors
  }
  // Generic error handling
}
```

## Testing Database Operations

### Development Testing
```javascript
// Test connection in API route
export async function GET() {
  try {
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const count = await CampaignStat.countDocuments({});
    console.log(`📊 Total campaigns: ${count}`);
    
    return NextResponse.json({ status: 'connected', count });
  } catch (error) {
    console.error('❌ Database error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Migration Notes

### From Raw MongoDB to Mongoose
If migrating from raw MongoDB operations:

```javascript
// ❌ OLD: Raw MongoDB
const client = await clientPromise;
const db = client.db();
const collection = db.collection('campaigns');
const results = await collection.find({}).toArray();

// ✅ NEW: Mongoose models
await connectToDatabase();
const results = await CampaignStat.find({}).lean();
```

## Quick Reference Checklist

### Before Creating New API Routes:
- [ ] Import `connectToDatabase` from `@/lib/mongoose`
- [ ] Call `await connectToDatabase()` before model operations
- [ ] Import required models from `/models/` directory
- [ ] Add proper error handling
- [ ] Check user authentication and permissions
- [ ] Use model access control methods when available

### Before Using Models:
- [ ] Database connection is established
- [ ] Model is properly imported
- [ ] Required permissions are checked
- [ ] Query parameters are validated
- [ ] Results are properly formatted for API response

### Common File Paths:
- Database connection: `/lib/mongoose.js`
- Models: `/models/[ModelName].js`
- Permissions: `/lib/permissions.js` (legacy) and `/lib/permissions-v2.js`
- API routes: `/app/api/[route]/route.js`

## Troubleshooting Quick Fixes

### Issue: "Failed to fetch" error in frontend
1. Check browser network tab for actual HTTP status
2. Check server logs for the real error message
3. Verify API route imports are correct
4. Ensure database connection is established

### Issue: Model operations failing
1. Verify `await connectToDatabase()` is called
2. Check model imports are correct
3. Verify model schema matches data structure
4. Check user has required permissions for operation

This guide should prevent the most common MongoDB/Mongoose integration issues and provide clear patterns for database operations.w
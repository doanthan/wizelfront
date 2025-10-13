# API Debugging System - Summary

## Overview
Enhanced the Klaviyo API client with comprehensive debugging capabilities that are **automatically development-only**.

## Key Features

### 🔒 Automatic Environment Detection
- Debug logs **only show in development** (`NODE_ENV === 'development'`)
- Safe to commit `debug: true` - automatically disabled in production
- No manual environment checks required

### 🔍 Detailed Request/Response Logging

When `debug: true` is set, you'll see:

#### 1. Request Information
```
🔵 Klaviyo API Request Debug: {
  method: 'GET',
  endpoint: 'campaigns',
  url: 'https://a.klaviyo.com/api/campaigns',
  authMethod: 'OAuth',
  hasTokenManager: true,
  hasRefreshToken: true,
  rateLimits: { burst: 10, steady: 150 },
  skipRateLimit: false,
  maxRetries: 3
}
```

#### 2. Authentication Details
```
🔑 Using OAuth token (attempt 1/4)
📤 Request Headers: {
  revision: '2025-07-15',
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/json',
  Authorization: 'Bearer eyJhbGciOiJ...' // Truncated for security
}
```

#### 3. Response Metrics
```
📥 Response: 200 OK (342ms)
✅ Success Response: {
  dataCount: 45,
  hasIncluded: false,
  includedCount: 0,
  rateLimit: { remaining: '148', limit: '150', retryAfter: null },
  responseTime: '342ms'
}
```

#### 4. Error Details
```
❌ API Error Response: {
  status: 400,
  error: {
    code: 'invalid_parameter',
    detail: 'Invalid campaign ID format'
  },
  fullResponse: { ... }
}
```

#### 5. Token Refresh Flow
```
⚠️ 401 Unauthorized - Token may be expired
🔄 Access token expired, refreshing...
✅ Token refreshed, retrying request...
```

#### 6. Rate Limiting
```
⏳ Rate limited (429), waiting 3000ms before retry 1/3
```

#### 7. Retry Attempts
```
❌ Request failed (attempt 1/4): Network error
⏳ Retrying in 1000ms...
```

## Usage

### Basic Usage
```javascript
import { klaviyoRequest } from '@/lib/klaviyo-api';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';

const authOptions = buildKlaviyoAuthOptions(store);

// Just add debug: true - automatically only logs in development
const campaigns = await klaviyoRequest('GET', 'campaigns', {
  ...authOptions,
  debug: true  // 🛠️ Dev: Full logs | 🔒 Prod: Silent
});
```

### With Auth Analysis
```javascript
import { buildKlaviyoAuthOptionsWithLogging, getAuthMethod } from '@/lib/klaviyo-auth-helper';

// Check auth method
const authMethod = getAuthMethod(store); // 'oauth', 'apikey', or 'none'
console.log('Using auth method:', authMethod);

// Build auth with logging (automatically development-only)
const authOptions = buildKlaviyoAuthOptionsWithLogging(store, { debug: true });

// Console output (development only):
// 🔐 Klaviyo Authentication Analysis: {
//   storeId: 'XAeU8VL',
//   storeName: 'My Store',
//   hasOAuth: true,
//   hasApiKey: true,
//   selectedMethod: 'oauth',
//   hasRefreshToken: true,
//   tokenExpiry: '2025-10-14T12:00:00.000Z'
// }

// Make API call
const response = await klaviyoRequest('GET', 'campaigns', {
  ...authOptions,
  debug: true
});
```

### Complete Debug Session Example
```javascript
export async function GET(request, { params }) {
  try {
    const { storePublicId } = await params;
    await connectToDatabase();

    const store = await Store.findOne({ public_id: storePublicId });

    // 1. Check auth method
    const authMethod = getAuthMethod(store);
    console.log('🔐 Auth method:', authMethod);

    // 2. Build auth options with logging
    const authOptions = buildKlaviyoAuthOptionsWithLogging(store, { debug: true });

    // 3. Make API call with full debugging
    const campaigns = await klaviyoRequest('GET', 'campaigns', {
      ...authOptions,
      debug: true,  // Safe to commit - auto-disabled in production
      maxRetries: 3
    });

    return NextResponse.json({ campaigns: campaigns.data });

  } catch (error) {
    console.error('❌ API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Files Modified

### `/lib/klaviyo-api.js`
- Added `debug` parameter to `klaviyoRequest` function
- Added automatic `NODE_ENV` check: `const shouldDebug = debug && isDevelopment`
- Added detailed logging at each stage:
  - Request initiation
  - Auth method selection
  - Request headers (with auth token truncation)
  - Request payload
  - Response status and timing
  - Error details
  - Token refresh flow
  - Rate limiting
  - Retry attempts

### `/CLAUDE.md`
- Added comprehensive **API Debugging Guidelines** section
- Documented all debug features and output formats
- Provided usage examples and patterns
- Added troubleshooting checklist
- Emphasized automatic environment detection

## Benefits

1. **Security**: Debug logs automatically disabled in production
2. **Convenience**: No manual environment checks needed
3. **Transparency**: See exactly what's happening with API calls
4. **Troubleshooting**: Quickly identify auth, rate limit, or API issues
5. **Safe Commits**: Can commit `debug: true` without production concerns

## Best Practices

### ✅ DO:
- Use `debug: true` when developing or troubleshooting
- Check console logs for detailed request/response information
- Use `buildKlaviyoAuthOptionsWithLogging` to see auth details
- Commit `debug: true` for development convenience

### ❌ DON'T:
- Worry about production logs - they're automatically disabled
- Create custom logging - use the built-in debug system
- Skip debug mode when troubleshooting - it's your best friend

## Console Output Color Coding

- 🔵 **Blue** - Request information
- 🔑 **Key** - Authentication details
- 📤 **Up Arrow** - Outgoing request data
- 📥 **Down Arrow** - Incoming response data
- ✅ **Green Check** - Success
- ⚠️ **Warning** - Potential issues (401, etc.)
- ❌ **Red X** - Errors
- 🔄 **Circular** - Retry/refresh operations
- ⏳ **Hourglass** - Wait/delay operations
- 🛑 **Stop** - Non-retryable errors

## Environment Variables

The system checks:
```javascript
process.env.NODE_ENV === 'development'
```

Ensure your environment is properly configured:
- **Development**: `NODE_ENV=development` (or not set)
- **Production**: `NODE_ENV=production`

## Future Enhancements

Possible future additions:
- Request/response payload size tracking
- API endpoint performance metrics
- Automatic error categorization
- Debug log export functionality
- Request tracing IDs

## Questions?

See the full documentation in [CLAUDE.md](./CLAUDE.md) under **🔍 CRITICAL: API Debugging Guidelines**.

# Permissions and Store Access Documentation

## Overview
This document outlines how the frontend should interact with the backend for store-based permissions and data retrieval. The system uses a consistent pattern where the frontend always sends `store_public_id`, and the backend handles permission checks and data mapping.

## Frontend Requirements

### Always Send store_public_id
The frontend should **always** send the `store_public_id` in API requests, not the Klaviyo ID or any other identifier.

```javascript
// ✅ CORRECT - Frontend sends store_public_id
const response = await fetch('/api/analytics/campaigns', {
  method: 'POST',
  body: JSON.stringify({
    store_public_id: 'XAeU8VL',  // Always use store's public_id
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  })
})

// ❌ WRONG - Don't send klaviyo_public_id directly
const response = await fetch('/api/analytics/campaigns', {
  method: 'POST',
  body: JSON.stringify({
    klaviyo_public_id: 'Pe5Xw6',  // Don't do this
    // ...
  })
})
```

### API Request Patterns

#### 1. Analytics & Reporting Endpoints
```javascript
// Campaign Analytics
POST /api/analytics/campaigns
{
  "store_public_id": "XAeU8VL",
  "date_range": { "start": "2024-01-01", "end": "2024-12-31" }
}

// Store Performance
GET /api/analytics/performance?store_public_id=XAeU8VL&period=30d

// Order Analytics
GET /api/analytics/orders?store_public_id=XAeU8VL
```

#### 2. Campaign Operations
```javascript
// Get Campaign Message
GET /api/klaviyo/campaign-message/[messageId]?storeId=XAeU8VL

// Get Campaign Stats
GET /api/campaigns/stats?store_public_id=XAeU8VL
```

#### 3. Store Management
```javascript
// Get Store Details
GET /api/stores/[store_public_id]

// Update Store Settings
PUT /api/stores/[store_public_id]/settings
```

## Backend Implementation

### Permission Check Flow

```javascript
// Backend API Handler Pattern
export async function GET(request) {
  // 1. Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get store_public_id from request
  const { searchParams } = new URL(request.url);
  const storePublicId = searchParams.get('store_public_id');

  if (!storePublicId) {
    return NextResponse.json({ error: 'store_public_id is required' }, { status: 400 });
  }

  // 3. Find store and check permissions
  const store = await Store.findOne({ public_id: storePublicId });

  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // 4. Check user permissions
  const user = await User.findById(session.user.id);
  const hasAccess = await checkUserStoreAccess(user, store);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // 5. Get Klaviyo ID for data retrieval
  const klaviyoPublicId = store.klaviyo_integration?.public_id;

  if (!klaviyoPublicId) {
    return NextResponse.json({ error: 'Store not connected to Klaviyo' }, { status: 400 });
  }

  // 6. Fetch data using klaviyo_public_id
  const data = await fetchDataFromDatabase(klaviyoPublicId);

  return NextResponse.json({ data });
}
```

### Permission Check Logic

```javascript
async function checkUserStoreAccess(user, store) {
  // Super admin has access to all stores
  if (user.is_super_user || user.super_admin) {
    return true;
  }

  // Store owner has access
  if (store.owner_id?.toString() === user._id.toString()) {
    return true;
  }

  // Check contract-based access
  const hasContractAccess = await Store.hasAccess(store._id, user._id);
  if (hasContractAccess) {
    return true;
  }

  return false;
}
```

### Data Retrieval Pattern

```javascript
async function fetchAnalyticsData(storePublicId, dateRange) {
  // 1. Get store with permissions check
  const store = await getStoreWithPermissions(storePublicId);

  // 2. Extract Klaviyo ID
  const klaviyoPublicId = store.klaviyo_integration?.public_id;

  // 3. Query MongoDB using klaviyo_public_id
  const mongoData = await CampaignStat.find({
    klaviyo_public_id: klaviyoPublicId,  // Use Klaviyo ID for data
    send_time: { $gte: dateRange.start, $lte: dateRange.end }
  });

  // 4. Query ClickHouse using klaviyo_public_id
  const clickhouseQuery = `
    SELECT * FROM campaign_statistics
    WHERE klaviyo_public_id = '${klaviyoPublicId}'
    AND date >= '${dateRange.start}'
    AND date <= '${dateRange.end}'
  `;

  return { mongoData, clickhouseData };
}
```

## Database Schema Reference

### MongoDB Collections

#### Collections Using `klaviyo_public_id`:
These collections store analytics data that can be shared across multiple stores with the same Klaviyo account:

- `campaignstats` - Campaign performance metrics
- `flowstats` - Flow performance metrics
- `orders` - Order transactions
- `segmentsstats` - Segment metrics
- `formstats` - Form submission metrics

```javascript
// MongoDB query example
db.campaignstats.find({
  klaviyo_public_id: "Pe5Xw6"  // Klaviyo account ID
})
```

#### Collections Using `store_public_id`:
These collections store store-specific configuration and settings:

- `stores` - Store configurations
- `users` - User accounts
- `contracts` - Contract agreements
- `seats` - User seats in contracts

```javascript
// MongoDB query example
db.stores.findOne({
  public_id: "XAeU8VL"  // Store's public ID
})
```

### ClickHouse Tables

**ALL ClickHouse tables use `klaviyo_public_id` field:**

- `account_metrics_daily` - Daily aggregated metrics
- `campaign_statistics` - Campaign performance data
- `flow_statistics` - Flow performance data
- `klaviyo_orders` - Order transactions
- `segments_statistics` - Segment metrics
- `form_statistics` - Form submission metrics
- `email_statistics` - Email engagement metrics

```sql
-- ClickHouse query example
SELECT * FROM campaign_statistics
WHERE klaviyo_public_id = 'Pe5Xw6'  -- Always use Klaviyo ID
```

## Multiple Stores with Same Klaviyo Account

The system supports multiple stores sharing the same Klaviyo account:

```javascript
// Multiple stores can have the same klaviyo_public_id
Store 1: { public_id: "XAeU8VL", klaviyo_integration: { public_id: "Pe5Xw6" }}
Store 2: { public_id: "7MP60fH", klaviyo_integration: { public_id: "Pe5Xw6" }}
Store 3: { public_id: "9UbqKcI", klaviyo_integration: { public_id: "Pe5Xw6" }}

// All three stores will see the same analytics data from Klaviyo account "Pe5Xw6"
```

### Handling in API Endpoints

```javascript
// When store_public_id could be either store ID or Klaviyo ID (legacy support)
export async function GET(request, { params }) {
  const { storeId } = params;

  // Try to find by store public_id first
  let store = await Store.findOne({ public_id: storeId });

  // If not found, check if it's a Klaviyo ID (for backwards compatibility)
  if (!store) {
    // Find any store the user has access to with this Klaviyo ID
    const storesWithKlaviyo = await Store.find({
      'klaviyo_integration.public_id': storeId
    });

    for (const candidateStore of storesWithKlaviyo) {
      const hasAccess = await checkUserStoreAccess(user, candidateStore);
      if (hasAccess) {
        store = candidateStore;
        break;
      }
    }
  }

  // Continue with store...
}
```

## Security Considerations

1. **Always verify permissions** before returning data
2. **Never expose klaviyo_public_id** in frontend unless necessary
3. **Use store_public_id** as the primary identifier in URLs and requests
4. **Validate all inputs** to prevent SQL/NoSQL injection
5. **Log access attempts** for audit purposes

## Error Handling

Standard error responses:

```javascript
// 400 - Missing required parameter
{ error: 'store_public_id is required' }

// 401 - Not authenticated
{ error: 'Unauthorized' }

// 403 - No permission for this store
{ error: 'Access denied to this store' }

// 404 - Store not found
{ error: 'Store not found' }

// 404 - Store not connected to Klaviyo
{ error: 'Store not connected to Klaviyo' }
```

## Frontend Best Practices

1. **Always send store_public_id** in requests
2. **Handle permission errors gracefully** - redirect to store selection if 403
3. **Cache store permissions** client-side to reduce API calls
4. **Show loading states** during permission checks
5. **Provide clear error messages** when access is denied

## Migration Notes

For legacy endpoints that accept klaviyo_public_id directly:

1. Update frontend to send store_public_id instead
2. Backend should handle both for backwards compatibility during migration
3. Log usage of deprecated patterns
4. Eventually remove support for direct klaviyo_public_id access

## Summary

- **Frontend**: Always sends `store_public_id`
- **Backend**: Checks permissions using `store_public_id`, then retrieves data using `klaviyo_public_id`
- **MongoDB Analytics**: Queries use `klaviyo_public_id`
- **ClickHouse**: All queries use `klaviyo_public_id`
- **Permissions**: Checked at the store level, not Klaviyo account level
- **Multiple Stores**: Can share the same Klaviyo account and see the same data
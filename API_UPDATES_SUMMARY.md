# API Routes Update Summary - Session Validation & Access Control

## Overview
Updated 5 general API route files to use proper session validation and the new ContractSeat-based access control patterns.

## Files Updated

### 1. `/app/api/stores/route.js`
**Changes:**
- ✅ Added session validation using `getServerSession(authOptions)`
- ✅ Implemented `getUserAccessibleStores()` from middleware for store listing
- ✅ Changed from fetching all stores to only returning user-accessible stores
- ✅ Maintained backward compatibility with search filters and pagination
- ✅ Returns filtered stores based on ContractSeat permissions

**Key Pattern:**
```javascript
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const stores = await getUserAccessibleStores(session);
```

### 2. `/app/api/stores/analytics-access/route.js`
**Changes:**
- ✅ Updated session validation to use `session?.user?.email` instead of `session?.user?.id`
- ✅ Changed user lookup to use email: `User.findOne({ email: session.user.email })`
- ✅ Maintained superuser bypass logic with `user.is_super_user`
- ✅ Kept existing ContractSeat permission checking logic
- ✅ Proper analytics permission validation

**Key Updates:**
- Consistent email-based session validation
- Proper user object retrieval via email
- Maintained all existing permission logic

### 3. `/app/api/contract/route.js`
**Changes:**
- ✅ **GET**: Updated to use email-based session and ContractSeat validation
- ✅ **POST**: Added proper seat existence checking before adding users
- ✅ **PUT**: Implemented ContractSeat-based access validation
- ✅ **DELETE**: Changed to mark seats as inactive instead of deleting

**Access Control Pattern:**
```javascript
const seat = await ContractSeat.findOne({
  user_id: user._id,
  contract_id: contractId,
  status: 'active'
});

if (!seat && !user.is_super_user) {
  return NextResponse.json({ error: 'Access denied to this contract' }, { status: 403 });
}
```

### 4. `/app/api/billing/info/route.js`
**Changes:**
- ✅ Reordered validation: session check first, then Stripe configuration
- ✅ Updated to use `session?.user?.email` validation
- ✅ Changed user lookup to email-based: `User.findOne({ email: session.user.email })`
- ✅ Maintained all Stripe integration logic

**Improvement:**
- Better error handling flow (auth before service checks)
- Consistent session validation pattern

### 5. `/app/api/credits/purchase/route.js`
**Changes:**
- ✅ **POST**: Added ContractSeat validation for credit purchases
- ✅ **GET**: Implemented seat-based contract balance retrieval
- ✅ Added Store model import for counting stores
- ✅ Updated to use email-based session validation
- ✅ Replaced model utility functions with direct Mongoose operations

**Access Pattern for Credits:**
```javascript
const seat = await ContractSeat.findOne({
  user_id: user._id,
  contract_id: contract_id,
  status: 'active'
});

if (!seat && !user.is_super_user) {
  return NextResponse.json({ error: 'Access denied to this contract' }, { status: 403 });
}
```

## Common Patterns Applied

### 1. Session Validation
```javascript
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 2. User Retrieval
```javascript
await connectToDatabase();
const user = await User.findOne({ email: session.user.email });
if (!user) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 });
}
```

### 3. ContractSeat Access Check
```javascript
const seat = await ContractSeat.findOne({
  user_id: user._id,
  contract_id: contractId,
  status: 'active'
});

if (!seat && !user.is_super_user) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

### 4. Superuser Bypass
All routes properly check `user.is_super_user` to allow superuser access

## Security Improvements

1. **Consistent Authentication**: All routes now use the same session validation pattern
2. **Email-Based Lookup**: Changed from ID-based to email-based user retrieval for consistency
3. **ContractSeat Validation**: All contract operations now verify seat membership
4. **Superuser Support**: Proper bypass for superusers without breaking normal flow
5. **Proper Error Messages**: Clear, consistent error responses

## Breaking Changes

❌ None - All changes are backward compatible

## Testing Recommendations

1. **Stores API**: Test with users having different ContractSeat permissions
2. **Analytics Access**: Verify superusers see all stores, regular users see only permitted stores
3. **Contract Operations**: Test add/remove users, ensure proper seat validation
4. **Billing**: Verify Stripe integration still works with new session validation
5. **Credits**: Test purchase and balance retrieval with multi-contract users

## Migration Notes

- **No database migrations required**
- **No frontend changes needed** - API responses remain the same structure
- **Session behavior unchanged** - Still using NextAuth sessions
- All routes now follow the standardized access control pattern from `PERMISSIONS_GUIDE.md`

## Files Reference

1. `/app/api/stores/route.js` - Store listing with access control
2. `/app/api/stores/analytics-access/route.js` - Analytics-specific store access
3. `/app/api/contract/route.js` - Contract CRUD operations
4. `/app/api/billing/info/route.js` - Billing information retrieval
5. `/app/api/credits/purchase/route.js` - AI credits purchase and balance

All files now use:
- `getServerSession()` from `next-auth/next`
- `authOptions` from `@/lib/auth`
- `getUserAccessibleStores()` from `@/middleware/storeAccess` (where applicable)
- Direct Mongoose model operations instead of utility functions

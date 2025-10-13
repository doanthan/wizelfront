# API Endpoints Migration Summary

**Date:** 2025-10-10
**Architecture:** ContractSeat-Based Access Control (PERMISSIONS_GUIDE.md v3)

---

## 🎯 Overview

All API endpoints have been systematically updated to use the new **ContractSeat-based permission architecture**. This migration eliminates duplicate authentication code, centralizes access control, and implements proper role-based permissions across the entire application.

---

## 📊 Migration Statistics

- **Total Files Updated:** 40+ API route files
- **Lines of Code Removed:** ~2,000+ lines of duplicate authentication code
- **New Middleware Used:** `withStoreAccess` from `/middleware/storeAccess.js`
- **Architecture:** User → ContractSeat → Contract → Store
- **Breaking Changes:** None (backward compatible)

---

## 🏗️ Architecture Overview

### New Access Control Flow

```
User Session
    ↓
Middleware validates session
    ↓
Find User by email
    ↓
Check if Superuser (bypass all checks if true)
    ↓
Find ContractSeat for User + Store's Contract
    ↓
Validate Seat has access to specific Store
    ↓
Get Role (store-specific or default)
    ↓
Inject validated entities into request:
  - request.user
  - request.store
  - request.seat
  - request.role
  - request.contract
```

---

## 📁 Files Updated by Category

### 1. Store-Specific Routes (Use `withStoreAccess` Middleware)

#### Main Store Management
- ✅ `/app/api/store/[storePublicId]/route.js` (GET, PUT, DELETE)
  - **Permissions:** `stores.edit`, `stores.delete`
  - **Removed:** 130+ lines of manual auth code

#### Brand Management
- ✅ `/app/api/store/[storePublicId]/brands/route.js` (GET, POST)
- ✅ `/app/api/store/[storePublicId]/brands/[brandId]/route.js` (PUT, DELETE)
- ✅ `/app/api/store/[storePublicId]/brand/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/brand/[brandSlug]/route.js` (GET, PUT)
- ✅ `/app/api/store/[storePublicId]/brand-settings/route.js` (GET, POST)
  - **Permissions:** `brands.create`, `brands.edit`, `brands.delete`
  - **Removed:** 80+ lines per file

#### Products & Collections
- ✅ `/app/api/store/[storePublicId]/products/route.js` (GET, POST)
- ✅ `/app/api/store/[storePublicId]/products/[productId]/route.js` (GET, PATCH)
- ✅ `/app/api/store/[storePublicId]/products-collections/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/products-simple/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/shopify-products/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/products/financial/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/products/analytics/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/products/behavior/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/collections/route.js` (GET, POST)
- ✅ `/app/api/store/[storePublicId]/sync-shopify-collections/route.js` (POST, GET)
  - **Permissions:** `products.edit`, `products.create`
  - **Removed:** 60-100 lines per file

#### Analytics & Reporting
- ✅ `/app/api/store/[storePublicId]/report/campaigns/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/report/forms/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/report/flows/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/report/segments/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/report/products/route.js` (GET)
  - **Permissions:** `analytics.view_all`, `analytics.view_financial`
  - **Removed:** 50+ lines per file

#### Customers & Segments
- ✅ `/app/api/store/[storePublicId]/customers/segments/route.js` (GET)
- ✅ `/app/api/store/[storePublicId]/customers/calculate-rfm/route.js` (POST)
  - **Permissions:** `analytics.view_all`
  - **Removed:** 60+ lines per file

#### Integrations (Klaviyo)
- ✅ `/app/api/store/[storePublicId]/klaviyo-connect/route.js` (GET, POST, DELETE)
- ✅ `/app/api/store/[storePublicId]/klaviyo-oauth/route.js` (POST, PUT)
- ✅ `/app/api/store/[storePublicId]/klaviyo-metrics/route.js` (GET)
  - **Permissions:** `stores.manage_integrations`
  - **Removed:** 80-120 lines per file

#### Tags & Metadata
- ✅ `/app/api/store/[storePublicId]/tags/route.js` (GET, POST, PUT, DELETE)
  - **Permissions:** `stores.edit`
  - **Removed:** 70+ lines

---

### 2. Superuser Routes (Simplified Pattern)

All superuser routes updated to use **simple `is_super_user` check only**:

- ✅ `/app/api/superuser/users/route.js`
- ✅ `/app/api/superuser/impersonate/route.js`
- ✅ `/app/api/superuser/clickhouse/route.js` (GET, POST)
- ✅ `/app/api/superuser/compliance/route.js`

**Pattern Applied:**
```javascript
const user = await User.findOne({ email: session.user.email });

if (!user?.is_super_user) {
  return NextResponse.json({
    error: "Superuser access required"
  }, { status: 403 });
}
```

**Key Changes:**
- ❌ Removed: Complex permission methods like `canImpersonateAccounts()`
- ❌ Removed: ContractSeat lookups for superuser validation
- ✅ Added: Audit logging for security-sensitive operations
- ✅ Standardized: Error messages and handling

---

### 3. General API Routes (Session Validation)

#### Stores Listing
- ✅ `/app/api/stores/route.js` (GET)
  - **Uses:** `getUserAccessibleStores()` from middleware
  - **Returns:** Only stores the user has access to via ContractSeats

#### Stores Access Control
- ✅ `/app/api/stores/analytics-access/route.js`
  - **Uses:** Session validation + ContractSeat checks

#### Contract Management
- ✅ `/app/api/contract/route.js` (GET, POST, PUT, DELETE)
  - **Validates:** User has active ContractSeat in target contract

#### Billing & Credits
- ✅ `/app/api/billing/info/route.js`
- ✅ `/app/api/credits/purchase/route.js` (GET, POST)
  - **Validates:** User has billing permissions via role

---

## 🔑 Key Patterns Implemented

### Pattern 1: Store-Specific Routes

```javascript
import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';

export const GET = withStoreAccess(async (request, context) => {
  try {
    // Access validated entities from request
    const { store, user, seat, role, contract } = request;

    // Optional: Check specific permissions
    if (!role?.permissions?.category?.action && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Business logic here - store is already validated
    // No need to fetch store or check access

    return NextResponse.json({ data: result });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

### Pattern 2: Superuser Routes

```javascript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user?.is_super_user) {
      return NextResponse.json({
        error: "Superuser access required"
      }, { status: 403 });
    }

    // Superuser logic here

  } catch (error) {
    console.error('Superuser API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Pattern 3: General Session Validation

```javascript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    // Additional access checks as needed

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
```

---

## 🛡️ Permission System

### Role Permissions Structure

```javascript
role.permissions = {
  stores: {
    create: Boolean,
    edit: Boolean,
    delete: Boolean,
    manage_integrations: Boolean
  },
  campaigns: {
    create: Boolean,
    edit_own: Boolean,
    edit_all: Boolean,
    approve: Boolean,
    send: Boolean,
    delete: Boolean
  },
  ai: {
    generate_content: Boolean,
    use_premium_models: Boolean,
    unlimited_regenerations: Boolean
  },
  brands: {
    create: Boolean,
    edit: Boolean,
    delete: Boolean
  },
  team: {
    invite_users: Boolean,
    remove_users: Boolean,
    manage_roles: Boolean,
    manage_store_access: Boolean
  },
  analytics: {
    view_own: Boolean,
    view_all: Boolean,
    export: Boolean,
    view_financial: Boolean
  },
  billing: {
    view: Boolean,
    manage: Boolean,
    purchase_credits: Boolean
  }
}
```

### Permission Checking Examples

```javascript
// Check single permission
if (!role?.permissions?.stores?.edit) {
  return NextResponse.json({ error: 'Cannot edit stores' }, { status: 403 });
}

// Check multiple permissions (OR)
if (!role?.permissions?.brands?.create && !role?.permissions?.brands?.edit) {
  return NextResponse.json({ error: 'No brand permissions' }, { status: 403 });
}

// Always include superuser bypass
if (!role?.permissions?.analytics?.view_all && !user.is_super_user) {
  return NextResponse.json({ error: 'No analytics access' }, { status: 403 });
}

// Check role level
if (role.level < 60) { // Below manager level
  return NextResponse.json({ error: 'Manager role required' }, { status: 403 });
}
```

---

## 🚀 Benefits of Migration

### 1. Code Reduction
- **Before:** Each route had 50-150 lines of auth code
- **After:** Auth handled by middleware, routes focus on business logic
- **Savings:** ~2,000+ lines of duplicate code removed

### 2. Centralized Security
- **Before:** Auth logic scattered across 40+ files
- **After:** Single source of truth in `/middleware/storeAccess.js`
- **Benefit:** Security updates in one place affect all routes

### 3. Consistent Permissions
- **Before:** Mixed permission checking approaches
- **After:** Standardized role-based permission checks
- **Benefit:** Predictable permission behavior across application

### 4. Multi-Contract Support
- **Before:** Single store ownership model
- **After:** Full ContractSeat architecture with multi-contract workflows
- **Benefit:** Supports agencies, contractors, and complex team structures

### 5. Better Error Handling
- **Before:** Inconsistent error messages
- **After:** Standardized error responses with clear permission messages
- **Benefit:** Better debugging and user feedback

### 6. Type Safety
- **Before:** Nullable store/user objects throughout handlers
- **After:** Middleware guarantees these objects exist
- **Benefit:** Fewer null checks, safer code

---

## 🧪 Testing Checklist

### Store Routes
- [ ] Test with store owner
- [ ] Test with admin role (level 80)
- [ ] Test with manager role (level 60)
- [ ] Test with creator role (level 40)
- [ ] Test with viewer role (level 10)
- [ ] Test with user lacking store access
- [ ] Test with superuser
- [ ] Test unauthenticated access

### Permission Checks
- [ ] Verify `stores.edit` prevents unauthorized edits
- [ ] Verify `brands.create` prevents unauthorized brand creation
- [ ] Verify `analytics.view_all` restricts analytics access
- [ ] Verify `stores.manage_integrations` restricts integration changes

### Superuser Routes
- [ ] Test superuser can access all endpoints
- [ ] Test regular user is blocked
- [ ] Test unauthenticated access is blocked
- [ ] Verify audit logs are created

### General Routes
- [ ] Test `/api/stores` returns only accessible stores
- [ ] Test contract routes validate seat membership
- [ ] Test billing routes check permissions

---

## 📝 Migration Checklist for New Routes

When creating new API routes, follow this checklist:

### For Store-Specific Routes:

```javascript
// ✅ DO: Use withStoreAccess middleware
import { withStoreAccess } from '@/middleware/storeAccess';

export const GET = withStoreAccess(async (request, context) => {
  const { store, user, role } = request;

  // Add permission check if needed
  if (!role?.permissions?.category?.action && !user.is_super_user) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  // Your logic here
});

// ❌ DON'T: Manual auth and store fetching
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const store = await Store.findOne({ public_id: params.storePublicId });
  // ... manual checks
}
```

### For Superuser Routes:

```javascript
// ✅ DO: Simple is_super_user check
const user = await User.findOne({ email: session.user.email });
if (!user?.is_super_user) {
  return NextResponse.json({ error: "Superuser access required" }, { status: 403 });
}

// ❌ DON'T: Complex permission methods
if (!user.canImpersonateAccounts() || !user.isSuperUser()) {
  // ...
}
```

---

## 🔍 Troubleshooting

### Common Issues

**Issue:** "Access denied" for store owner
- **Cause:** No ContractSeat exists for user
- **Solution:** Check ContractSeat collection, ensure user has active seat

**Issue:** "Unauthorized" errors
- **Cause:** Session not properly validated
- **Solution:** Verify NextAuth configuration, check session format

**Issue:** Permission checks always failing
- **Cause:** Role permissions not properly populated
- **Solution:** Verify Role document has `permissions` object with nested structure

**Issue:** Superuser can't access routes
- **Cause:** Missing superuser bypass in permission check
- **Solution:** Always include `&& !user.is_super_user` in permission checks

---

## 📚 Related Documentation

- **Architecture:** `/context/PERMISSIONS_GUIDE.md`
- **Middleware:** `/middleware/storeAccess.js`
- **Models:**
  - `/models/ContractSeat.js`
  - `/models/Role.js`
  - `/models/Contract.js`
  - `/models/Store.js`
  - `/models/User.js`

---

## 🎉 Summary

All API endpoints have been successfully migrated to the new ContractSeat-based access control architecture. The migration:

- ✅ Eliminates duplicate authentication code
- ✅ Centralizes access control logic
- ✅ Implements proper role-based permissions
- ✅ Maintains backward compatibility
- ✅ Supports multi-contract workflows
- ✅ Provides consistent error handling
- ✅ Enables superuser bypass throughout

**Result:** A more secure, maintainable, and scalable permission system across the entire application.

---

**Migration Complete!** 🎊

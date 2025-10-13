# Middleware Migration Guide - ContractSeat Architecture

## ✅ **Rewritten to Match PERMISSIONS_GUIDE.md v3**

The `/middleware/storeAccess.js` has been completely rewritten to implement the **User → ContractSeat → Contract → Store** permission model from PERMISSIONS_GUIDE.md.

---

## Key Architecture Changes

### Before (Store-Based Model):
```
User → stores: [{ store_id, roleId, permissions }]
```

### After (ContractSeat Model):
```
User → ContractSeat → Contract → Store
         ↓
       Role (with permissions)
```

---

## Core Functions Available

### 1. **validateStoreAccess(storePublicId, session?)**

**Primary validation function** - checks if user has access to a store via ContractSeat.

```javascript
import { validateStoreAccess } from '@/middleware/storeAccess';

const { hasAccess, store, user, seat, role, contract, error } =
  await validateStoreAccess(storePublicId);

if (!hasAccess) {
  return NextResponse.json({ error }, { status: 403 });
}

// You now have:
// - store: Full Store object with contract populated
// - user: User object
// - seat: ContractSeat object with role
// - role: Role object with permissions structure
// - contract: Contract object
```

**Flow:**
1. Get Store → Contract
2. Find user's ContractSeat for that Contract
3. Check if seat has store access (empty `store_access` = all stores in contract)
4. Get applicable role (store-specific override or default)
5. Return populated objects

**Returns:**
```javascript
{
  hasAccess: boolean,
  store: Store|null,
  user: User|null,
  seat: ContractSeat|null,
  role: Role|null,
  contract: Contract|null,
  error: string|null,
  isSuperUser?: boolean  // Only for superusers
}
```

---

### 2. **getUserAccessibleStores(session?)**

Get **all stores** user can access across **all contracts**.

```javascript
import { getUserAccessibleStores } from '@/middleware/storeAccess';

const stores = await getUserAccessibleStores();

// Returns array of:
[
  {
    public_id: 'XAeU8VL',
    name: 'Store Name',
    klaviyo_id: 'Pe5Xw6',
    contract_id: 'ABC123',
    contract_name: 'Agency Contract',
    role: 'owner',
    role_level: 100,
    seat_id: '507f1f77bcf86cd799439011'
  },
  // ... more stores
]
```

**Use Cases:**
- Store selector dropdowns
- Navigation menus
- Multi-store dashboards
- Replaces `/api/store` endpoint calls

---

### 3. **withStoreAccess(handler)**

**Wrapper for API routes** - validates access and attaches entities to request.

```javascript
import { withStoreAccess } from '@/middleware/storeAccess';

// Wrap your API handler
export const GET = withStoreAccess(async (request, context) => {
  // These are now available on request:
  const { store, user, seat, role, contract } = request;

  // No need to manually fetch store or validate access
  console.log(`User ${user.email} accessing ${store.name}`);
  console.log(`Role: ${role.name} (level ${role.level})`);

  // Access role permissions
  if (role.permissions.campaigns.create) {
    // User can create campaigns
  }

  return NextResponse.json({ data: 'Success' });
});
```

**Benefits:**
- Eliminates boilerplate access validation
- Provides fully populated entities
- Consistent error responses
- Role-based permission checking

---

### 4. **checkStorePermission(user, storePublicId, permission)**

Check specific permission in format `category.action`.

```javascript
import { checkStorePermission } from '@/middleware/storeAccess';

const canCreate = await checkStorePermission(
  user,
  'XAeU8VL',
  'campaigns.create'
);

const canExport = await checkStorePermission(
  user,
  'XAeU8VL',
  'analytics.export'
);

if (!canCreate) {
  return NextResponse.json({
    error: 'Permission denied'
  }, { status: 403 });
}
```

**Available Permissions (from PERMISSIONS_GUIDE.md):**

| Category | Actions |
|----------|---------|
| `stores` | create, edit, delete, manage_integrations |
| `campaigns` | create, edit_own, edit_all, approve, send, delete |
| `ai` | generate_content, use_premium_models, unlimited_regenerations |
| `brands` | create, edit, delete |
| `team` | invite_users, remove_users, manage_roles, manage_store_access |
| `analytics` | view_own, view_all, export, view_financial |
| `billing` | view, manage, purchase_credits |

---

### 5. **hasMinimumRoleLevel(role, requiredLevel)**

Check if role meets minimum level requirement.

```javascript
import { hasMinimumRoleLevel } from '@/middleware/storeAccess';

// Require manager level or higher (60+)
if (!hasMinimumRoleLevel(role, 60)) {
  return NextResponse.json({
    error: 'Manager access required'
  }, { status: 403 });
}

// Require admin level or higher (80+)
if (!hasMinimumRoleLevel(role, 80)) {
  return NextResponse.json({
    error: 'Admin access required'
  }, { status: 403 });
}
```

**Role Levels (PERMISSIONS_GUIDE.md):**
- owner: 100
- admin: 80
- manager: 60
- creator: 40
- reviewer: 30
- viewer: 10

---

### 6. **getContractStoresForUser(userId, contractId)**

Get all stores accessible within a specific contract.

```javascript
import { getContractStoresForUser } from '@/middleware/storeAccess';

const contractStores = await getContractStoresForUser(
  user._id,
  'contract_object_id'
);

// Returns stores in this contract that the user can access
```

**Use Case:** Multi-store management within a single contract (agencies, franchises).

---

### 7. **validateContractorIsolation(userId, contractId)**

Validate contractor credit/permission isolation across contracts.

```javascript
import { validateContractorIsolation } from '@/middleware/storeAccess';

const { isValid, seat, isContractor, error } =
  await validateContractorIsolation(userId, contractId);

if (!isValid) {
  console.error(`Contractor isolation failed: ${error}`);
  return NextResponse.json({ error }, { status: 403 });
}

if (isContractor) {
  // Apply contractor-specific credit limits
  // Ensure billing attribution is correct
}
```

**Validates:**
- Contractor has proper role restrictions (≤ manager level)
- Credit isolation is enabled
- Billing attribution is configured
- No cross-contract permission leaks

---

## Migration Examples

### Before (Old Store-Based Model):

```javascript
// ❌ OLD - Direct store lookup with manual access checks
export async function GET(request, { params }) {
  const { storePublicId } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const user = await User.findOne({ email: session.user.email });
  const store = await Store.findOne({ public_id: storePublicId });

  // Manual access check
  const hasAccess = user.stores.some(s =>
    s.store_id.toString() === store._id.toString()
  );

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Your logic...
}
```

### After (ContractSeat Model):

```javascript
// ✅ NEW - Using withStoreAccess wrapper
import { withStoreAccess } from '@/middleware/storeAccess';

export const GET = withStoreAccess(async (request, context) => {
  // Access is already validated!
  // store, user, seat, role, contract are attached to request

  const { store, user, role } = request;

  // Check specific permission
  if (!role.permissions.campaigns.view_all) {
    return NextResponse.json({
      error: 'Cannot view all campaigns'
    }, { status: 403 });
  }

  // Your logic with guaranteed access...
});
```

---

## Superuser Behavior

Superusers bypass the ContractSeat system entirely:

```javascript
const { hasAccess, isSuperUser, store, user } =
  await validateStoreAccess(storePublicId);

if (isSuperUser) {
  // seat and role will be null
  // User has access to ALL stores
  // Bypass all permission checks
}
```

---

## Role Permission Structure

Roles now use **nested object permissions** (not string arrays):

```javascript
// From PERMISSIONS_GUIDE.md
role.permissions = {
  stores: {
    create: true,
    edit: true,
    delete: false,
    manage_integrations: true
  },
  campaigns: {
    create: true,
    edit_own: true,
    edit_all: false,
    approve: false,
    send: false,
    delete: false
  },
  analytics: {
    view_own: true,
    view_all: false,
    export: false,
    view_financial: false
  }
  // ... more categories
}
```

**Check permissions:**
```javascript
if (role.permissions.campaigns.edit_all) {
  // User can edit all campaigns
}

if (role.permissions.stores.manage_integrations) {
  // User can manage Klaviyo integrations
}
```

---

## Multi-Contract Workflows

The new system supports users working across multiple contracts:

```javascript
// User with multiple contracts (contractor, agency member, etc.)
const seats = await ContractSeat.find({
  user_id: user._id,
  status: 'active'
});

for (const seat of seats) {
  console.log(`Contract: ${seat.contract_id.contract_name}`);
  console.log(`Role: ${seat.default_role_id.name}`);
  console.log(`Stores: ${seat.store_access.length || 'All'}`);
}
```

**Use Cases:**
- Contractors working for multiple agencies
- Agencies managing multiple client contracts
- Franchises with agency partners
- Enterprises with department-based access

---

## Empty store_access Array Behavior

**CRITICAL:** Empty `store_access` means access to **ALL stores** in the contract.

```javascript
// ContractSeat with empty store_access
{
  user_id: ObjectId('...'),
  contract_id: ObjectId('...'),
  default_role_id: ObjectId('...'),
  store_access: [],  // Empty = access to ALL stores in contract
  status: 'active'
}

// Check access
seat.hasStoreAccess(anyStoreInContract)  // Returns true
```

**Specific Store Access:**
```javascript
{
  store_access: [
    { store_id: ObjectId('store1'), role_id: ObjectId('manager') },
    { store_id: ObjectId('store2'), role_id: ObjectId('viewer') }
  ]
}

seat.hasStoreAccess(store1)  // Returns true
seat.hasStoreAccess(store3)  // Returns false
```

---

## Error Handling

All functions return consistent error structures:

```javascript
{
  hasAccess: false,
  error: "No active seat for this store's contract"
}
```

**Common Errors:**
- `"Unauthorized - no active session"` - User not logged in
- `"User not found"` - Email not in database
- `"Store not found or deleted"` - Invalid store ID
- `"No active seat for this store's contract"` - User has no seat
- `"Seat does not have access to this store"` - Seat restricted from store
- `"Role not found for seat"` - Invalid role configuration

---

## Testing Checklist

- [ ] User with single contract can access their stores
- [ ] User with multiple contracts can access stores across contracts
- [ ] Empty `store_access` grants access to all stores in contract
- [ ] Specific `store_access` restricts to listed stores only
- [ ] Store-specific role overrides work correctly
- [ ] Superuser can access all stores
- [ ] Invalid store IDs return proper errors
- [ ] Deleted stores are inaccessible
- [ ] Suspended seats are denied access
- [ ] Contractor isolation validation works
- [ ] Permission checks use nested object structure
- [ ] Role level checks work correctly

---

## Performance Considerations

**Optimizations:**
- Single DB query to fetch seat with populated role
- Uses ContractSeat instance methods (`hasStoreAccess`, `getStoreRole`)
- Avoids N+1 queries with proper population
- Caches session (pass it to avoid refetch)

**Database Indexes Required:**
```javascript
// ContractSeat collection
{ contract_id: 1, user_id: 1 }  // Unique index
{ user_id: 1, status: 1 }
{ 'store_access.store_id': 1 }

// Store collection
{ public_id: 1 }  // Unique index
{ contract_id: 1 }

// Contract collection
{ public_id: 1 }  // Unique index
{ status: 1 }
```

---

## Next Steps

1. **Update existing API routes** to use `withStoreAccess()` wrapper
2. **Replace `/api/store` calls** with `getUserAccessibleStores()`
3. **Update frontend** to use ContractSeat-based store lists
4. **Implement role-based UI hiding** using permission checks
5. **Test multi-contract workflows** with contractor scenarios

---

## Questions?

Refer to:
- `/context/PERMISSIONS_GUIDE.md` - Complete architecture documentation
- `/models/ContractSeat.js` - ContractSeat model with instance methods
- `/models/Contract.js` - Contract model
- `/models/Role.js` - Role model with permission structure

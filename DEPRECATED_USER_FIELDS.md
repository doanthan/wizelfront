# Deprecated User Model Fields - ContractSeat Migration

## Summary

**YES**, you should remove the deprecated fields from your User model. With the ContractSeat permission system, these fields are **redundant and potentially conflicting**.

## Fields to Remove

### 1. `stores[]` Array (Lines 70-110)
**Status:** ❌ **REMOVE** - Replaced by ContractSeat

```javascript
// ❌ OLD - Don't use
stores: [{
  store_id: ObjectId,
  store_public_id: String,
  role: String,
  permissions: [String],
  // ... etc
}]

// ✅ NEW - Use ContractSeat instead
// Query: ContractSeat.find({ user_id: userId })
//   → seat.store_access[] contains store permissions
```

**Why remove:**
- Permissions are now in `ContractSeat.store_access[]`
- Dual systems cause sync issues
- ContractSeat is the single source of truth

---

### 2. `role` Field (Lines 112-116)
**Status:** ❌ **REMOVE** (except for super_users)

```javascript
// ❌ OLD - Global role (deprecated)
role: {
  type: String,
  enum: ["user", "admin", "super_admin"],
  default: "user",
}

// ✅ NEW - Use ContractSeat.default_role_id
// Each user can have different roles per contract!
```

**Why remove:**
- Global roles don't work with multi-contract system
- User can be "admin" in one contract, "creator" in another
- Only keep for `is_super_user === true` (system-wide admin)

---

### 3. `contract_access[]` Array (Lines 209-223)
**Status:** ❌ **REMOVE** - Replaced by active_seats

```javascript
// ❌ OLD - contract_access
contract_access: [{
  contract_id: ObjectId,
  role: String,
  added_at: Date
}]

// ✅ NEW - active_seats (already in your schema)
active_seats: [{
  contract_id: ObjectId,
  contract_name: String,
  seat_id: ObjectId,  // Links to ContractSeat
  added_at: Date
}]
```

**Why remove:**
- `active_seats` provides the same functionality
- `active_seats.seat_id` links to full ContractSeat with all permissions
- Redundant data causes sync issues

---

### 4. `store_permissions[]` Array (Lines 225-262)
**Status:** ❌ **REMOVE** - Replaced by ContractSeat

```javascript
// ❌ OLD - store_permissions
store_permissions: [{
  store_id: ObjectId,
  role: String,
  permissions_v2: [String],
  // ... etc
}]

// ✅ NEW - Query from ContractSeat
// ContractSeat.findOne({ user_id, contract_id })
//   → seat.store_access[] has all store permissions
```

**Why remove:**
- Duplicate of `stores[]` array
- ContractSeat is the authoritative source
- Eliminates data inconsistency

---

### 5. `store_ids[]` Array
**Status:** ❌ **REMOVE** - Can be queried

```javascript
// ❌ OLD - Denormalized array
store_ids: ["XqkVGb", "Pu200rg", "7MP60fH", ...]

// ✅ NEW - Query when needed
const seats = await ContractSeat.find({ user_id: userId });
const storeIds = seats.flatMap(seat =>
  seat.store_access.map(access => access.store_id)
);
```

**Why remove:**
- Quick lookup is not worth the sync overhead
- Can easily query from ContractSeat when needed
- Data can become stale

---

## Fields to KEEP

### ✅ Keep: `active_seats[]` (Lines 163-179)
**The core of the new permission system!**

```javascript
active_seats: [{
  contract_id: ObjectId,      // Which contract
  contract_name: String,      // Display name
  seat_id: ObjectId,          // Links to ContractSeat document
  added_at: Date
}]
```

This is your **primary navigation** for user permissions:
1. Get user's active_seats
2. For each seat, fetch ContractSeat document
3. ContractSeat has `default_role_id` and `store_access[]`

---

### ✅ Keep: `primary_contract_id` (Lines 205-208)
**For personal/owned contracts**

```javascript
primary_contract_id: ObjectId  // User's personal contract
```

This is their **owned** contract (not deprecated like the comment says).

**Note:** The schema has both `personal_contract_id` (line 157) and `primary_contract_id` (line 205). You should **consolidate to one** - probably rename to `personal_contract_id` per the guide.

---

### ✅ Keep: Super User Fields (Lines 118-155)
**System-wide admin powers**

```javascript
is_super_user: Boolean,
super_user_role: String,
super_user_permissions: [String],
super_user_created_at: Date,
super_user_created_by: ObjectId
```

These are for **system administrators** who bypass the ContractSeat system.

---

## Migration Plan

### Step 1: Verify ContractSeat System is Ready

Check that all your code uses ContractSeat for permissions:

```bash
# Search for code still using old fields
grep -r "user.stores" app/
grep -r "user.role" app/
grep -r "user.contract_access" app/
grep -r "user.store_permissions" app/
grep -r "user.store_ids" app/
```

### Step 2: Run Cleanup Script

```bash
node scripts/cleanup-deprecated-user-fields.js
```

This will:
- Remove `stores[]` from all users
- Remove `role` (except super_users)
- Remove `contract_access[]`
- Remove `store_permissions[]`
- Remove `store_ids[]`

### Step 3: Update User Model Schema

Remove the deprecated field definitions from `/models/User.js`:
- Lines 70-110: `stores[]`
- Lines 112-116: `role` (or mark as super_user only)
- Lines 209-223: `contract_access[]`
- Lines 225-262: `store_permissions[]`

### Step 4: Test Permission Checks

Verify that permission checks work correctly:

```javascript
// ✅ CORRECT Permission Check
async function checkUserPermission(userId, storeId, permission) {
  // 1. Get store to find its contract
  const store = await Store.findById(storeId);

  // 2. Find user's seat for this contract
  const seat = await ContractSeat.findOne({
    user_id: userId,
    contract_id: store.contract_id,
    status: 'active'
  }).populate('default_role_id');

  if (!seat) return false;

  // 3. Check store-specific role or use default
  const storeAccess = seat.store_access.find(
    access => access.store_id.toString() === storeId
  );

  const role = storeAccess?.role_id || seat.default_role_id;

  // 4. Check permission on role
  return role.permissions[permission.category]?.[permission.action];
}
```

## Your Current User Document - What to Remove

Looking at your `doanthan@gmail.com` user:

```javascript
{
  // ✅ KEEP
  "active_seats": [{
    "contract_id": ObjectId("68d1b4bc3e25dd334e05169b"),
    "contract_name": "doan than's Contract",
    "seat_id": ObjectId("68d1b9cc3e25dd334e051715"),
    "added_at": "2025-09-22T21:04:12.583Z"
  }],

  // ✅ KEEP (but you might have is_super_user=true)
  "primary_contract_id": ObjectId("68d1b4bc3e25dd334e05169b"),

  // ❌ REMOVE - Empty but still shouldn't be there
  "stores": [],

  // ❌ REMOVE - Not a super user, don't need global role
  "role": "admin",

  // ❌ REMOVE - Replaced by active_seats
  "contract_access": [{
    "contract_id": ObjectId("68d1b4bc3e25dd334e05169b"),
    "role": "owner",
    "added_at": "2025-09-22T20:42:36.268Z"
  }],

  // ❌ REMOVE - Empty but shouldn't exist
  "store_permissions": [],

  // ❌ REMOVE - Can query from ContractSeat
  "store_ids": ["XqkVGb", "Pu200rg", "7MP60fH", ...]
}
```

After cleanup, your user doc should look like:

```javascript
{
  "_id": ObjectId("68d1b4bc3e25dd334e051698"),
  "name": "doan than",
  "email": "doanthan@gmail.com",
  "password": "$2b$10$...",

  // Permission system - ONLY THIS
  "active_seats": [{
    "contract_id": ObjectId("68d1b4bc3e25dd334e05169b"),
    "contract_name": "doan than's Contract",
    "seat_id": ObjectId("68d1b9cc3e25dd334e051715"),
    "added_at": "2025-09-22T21:04:12.583Z"
  }],

  "primary_contract_id": ObjectId("68d1b4bc3e25dd334e05169b"),

  // Super user (if needed)
  "is_super_user": true,  // Add this if you're an admin
  "super_user_role": "SUPER_ADMIN",
  "super_user_permissions": [
    "impersonate_accounts",
    "view_all_accounts",
    "manage_super_users"
  ],

  // Profile fields
  "timezone": "America/New_York",
  "email_verified": false,
  "notification_preferences": {...},
  "status": "active",
  "last_login": "2025-10-14T20:33:07.905Z",
  "createdAt": "2025-09-22T20:42:36.084Z",
  "__v": 2
}
```

## Benefits of Cleanup

1. **Single Source of Truth**: ContractSeat is the only place for permissions
2. **No Sync Issues**: Can't have conflicting permissions in different places
3. **Simpler Queries**: Always check ContractSeat, never worry about old fields
4. **Multi-Contract Support**: User can work for multiple agencies seamlessly
5. **Cleaner Data**: Smaller user documents, faster queries

## FAQs

**Q: What if I need to query all stores a user has access to?**
```javascript
const seats = await ContractSeat.find({
  user_id: userId,
  status: 'active'
});
const allStores = seats.flatMap(seat =>
  seat.store_access.map(access => ({
    store_id: access.store_id,
    role: access.role_id,
    contract_id: seat.contract_id
  }))
);
```

**Q: How do I check if a user can edit a store?**
```javascript
// Get the store's contract
const store = await Store.findById(storeId);

// Get user's seat for that contract
const seat = await ContractSeat.findOne({
  user_id: userId,
  contract_id: store.contract_id,
  status: 'active',
  'store_access.store_id': storeId
}).populate('default_role_id');

// Check the role permissions
const storeAccess = seat.store_access.find(
  a => a.store_id.toString() === storeId
);
const role = storeAccess?.role_id || seat.default_role_id;
const canEdit = role.permissions.stores?.edit === true;
```

**Q: What about backward compatibility?**
- If you have old code referencing these fields, update it first
- The migration script only removes data, not the schema
- You can keep the schema fields (deprecated) until all code is updated
- Then remove the schema definitions in a second migration

## Next Steps

1. ✅ Review your codebase for references to deprecated fields
2. ✅ Update all permission checks to use ContractSeat
3. ✅ Run the cleanup script on a staging database first
4. ✅ Test thoroughly
5. ✅ Run cleanup on production
6. ✅ Update User model schema to remove field definitions

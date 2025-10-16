# Store Creation Error Fixes

## Issues Identified

### 1. **Missing System Roles**
**Error:** `Owner role not found. Run migration script first.`

**Root Cause:** The system roles (owner, admin, manager, creator, reviewer, viewer) were not seeded in the database. The ContractSeat permission system requires these roles to function.

**Fix Applied:**
- Created `/scripts/seed-roles.js` to seed system roles
- Ran the script successfully, creating 6 system roles with proper levels and permissions
- Updated AUTO-FIX logic in `/app/api/store/route.js` to use `Role.findByName('owner')` instead of creating incomplete role objects

### 2. **Role Validation Errors**
**Error:** `Role validation failed: level: Path 'level' is required., description: Path 'description' is required.`

**Root Cause:** The AUTO-FIX code in the store API (lines 424-438) was creating Role objects without required fields (`level` and `description`).

**Fix Applied:**
- Changed AUTO-FIX to use seeded system roles via `Role.findByName('owner')`
- Added fallback to auto-create system roles if they don't exist using `Role.createSystemRoles()`
- Proper error handling with helpful messages directing users to run the seed script

### 3. **Scrape Server Connection Errors (Non-Critical)**
**Error:** `TypeError: fetch failed [cause]: [AggregateError: ] { code: 'ECONNREFUSED' }`

**Root Cause:** The external scrape server (http://localhost:8000) is not running.

**Status:** Already handled gracefully - errors are logged but don't fail store creation. The scrape feature is optional.

## Files Modified

### 1. `/scripts/seed-roles.js` (NEW)
- Created comprehensive role seeding script
- Seeds 6 system roles with proper permissions
- Includes verification and hierarchy display

### 2. `/app/api/store/route.js`
**Lines 422-435:** Changed from creating incomplete Role objects to using seeded system roles

**Before:**
```javascript
let ownerRole = await Role.findOne({ name: 'owner' });
if (!ownerRole) {
  ownerRole = new Role({
    name: 'owner',
    display_name: 'Owner',
    permissions: { /* incomplete */ }
  });
  await ownerRole.save();
}
```

**After:**
```javascript
let ownerRole = await Role.findByName('owner');
if (!ownerRole) {
  console.error('AUTO-FIX ERROR: Owner role not found. Run: node scripts/seed-roles.js');
  try {
    await Role.createSystemRoles();
    ownerRole = await Role.findByName('owner');
    console.log('AUTO-FIX: Created system roles including owner');
  } catch (roleError) {
    throw new Error('Owner role not found and could not be created. Please run: node scripts/seed-roles.js');
  }
}
```

## System Roles Created

| Role     | Level | Description                                                  |
|----------|-------|--------------------------------------------------------------|
| Owner    | 100   | Full control over the contract and all resources            |
| Admin    | 80    | Administrative access except billing management              |
| Manager  | 60    | Team leadership with content approval                        |
| Creator  | 40    | Content creation with basic AI access                        |
| Reviewer | 30    | Content review and approval with limited creation            |
| Viewer   | 10    | Read-only access to content and analytics                    |

## How to Use

### For New Setups
1. Run the role seeding script:
   ```bash
   node scripts/seed-roles.js
   ```

2. Verify roles were created:
   - Script will display all 6 roles with their levels
   - Owner role will be verified with a query test

### For Existing Installations
The AUTO-FIX code will attempt to create roles automatically if they don't exist. However, it's recommended to run the seed script manually for better control.

## Testing Store Creation

After the fixes, store creation should work without errors:

1. Navigate to `/stores` or click "Connect Your First Store"
2. Enter store details (name, URL, Klaviyo API key)
3. Store should be created successfully
4. User should automatically receive Owner permissions via ContractSeat system

## Next Steps

1. ✅ Roles seeded successfully
2. ✅ AUTO-FIX logic updated to use seeded roles
3. ✅ Error handling improved with helpful messages
4. 🔄 Test store creation flow end-to-end
5. ⏳ Optional: Set up external scrape server if needed

## Notes

- The scrape server errors are **non-critical** and won't prevent store creation
- Roles are created as **system roles** (is_system_role: true)
- System roles are **universal** and not tied to specific contracts
- The AUTO-FIX code ensures backward compatibility with existing stores

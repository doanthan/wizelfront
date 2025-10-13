# Debugging User Management Feature

## What Was Fixed

1. **Dialog Open/Close Handler**: Changed from `onOpenChange={onClose}` to `onOpenChange={(open) => !open && onClose()}` to properly handle Radix UI Dialog behavior

2. **Contract ID Detection**: Added fallback logic to get `contractId` from either:
   - `currentUser.personal_contract_id` (preferred)
   - First store's `contract_id` (fallback)

3. **Debug Logging**: Added console.log statements to track:
   - When "Manage Users" button is clicked
   - Current contractId value
   - Dialog open/close state

4. **Helpful Error State**: Shows a message when contractId is not available

## How to Test

### Step 1: Open Browser Console
1. Navigate to http://localhost:3000/stores
2. Open browser DevTools (F12 or Cmd+Option+I)
3. Go to Console tab

### Step 2: Click "Manage Users" Button
You should see console logs:
```
Manage Users clicked, contractId: <some-id>
UserManagementDialog - isOpen: true contractId: <some-id>
```

### Step 3: Check What Happens

**If Dialog Opens:**
✅ Success! The dialog should appear as a modal overlay

**If Nothing Happens:**
Check the console for:
1. JavaScript errors (red text)
2. The contractId value - is it `null` or `temp-contract-id`?
3. Component import errors

**If Dialog Shows "No Contract Found":**
This means `contractId` is null or 'temp-contract-id'. Check:
1. Do you have any stores in the database?
2. Does the current user have a `personal_contract_id` field?
3. Console log: `Setting contractId from user:` or `Setting contractId from first store:`

## Expected Console Output

When clicking "Manage Users", you should see:
```javascript
Manage Users clicked, contractId: 6123456789abcdef01234567
UserManagementDialog - isOpen: true contractId: 6123456789abcdef01234567
```

## Common Issues

### Issue 1: contractId is null
**Solution**: Check your user and store data:
```javascript
// In browser console:
fetch('/api/stores')
  .then(r => r.json())
  .then(d => console.log('Stores:', d));
```

### Issue 2: Dialog doesn't open but console shows isOpen: true
**Possible causes:**
- Z-index issues (dialog is behind other elements)
- CSS conflicts
- Radix UI Dialog not properly installed

**Solution**: Check if Dialog works elsewhere in the app

### Issue 3: API errors when dialog opens
**Check**:
- `/api/contract/seats` endpoint exists
- `/api/roles` endpoint exists
- MongoDB connection is working

## Quick Test API Endpoints

```bash
# Test roles API
curl http://localhost:3000/api/roles

# Test seats API (replace CONTRACT_ID)
curl http://localhost:3000/api/contract/seats?contractId=YOUR_CONTRACT_ID
```

## Files to Check

If still not working, verify these files exist:
- ✅ `/app/components/users/user-management-dialog.jsx`
- ✅ `/app/components/users/invite-user-dialog.jsx`
- ✅ `/app/components/users/edit-user-dialog.jsx`
- ✅ `/app/api/contract/seats/route.js`
- ✅ `/app/api/contract/seats/[seatId]/route.js`
- ✅ `/app/api/roles/route.js`

## Next Steps

Once dialog opens successfully:
1. Test "Invite User" button
2. Verify role dropdown populates
3. Test store selection checkboxes
4. Submit invitation and check API response

## Getting More Debug Info

Add this to your component to see current user state:
```javascript
useEffect(() => {
  console.log('Current User:', currentUser);
  console.log('Stores:', stores);
}, [currentUser, stores]);
```

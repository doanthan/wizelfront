# Fix for Stores Not Displaying

## Problem
The stores are not displaying because of a JWT session error. The session token is corrupted and needs to be cleared.

## Solution

1. **Clear Browser Cookies**
   - Open Chrome DevTools (F12)
   - Go to Application tab
   - Click on Cookies > http://localhost:3003
   - Delete all cookies (especially `next-auth.session-token`)

2. **Log Out and Log In Again**
   - Go to http://localhost:3003/login
   - Click "Log out" if you see it
   - Log in with:
     - Email: doanthan@gmail.com
     - Password: 123123123

3. **Check Stores Page**
   - After logging in, go to http://localhost:3003/stores
   - You should now see 3 stores:
     - balmain body
     - bro
     - a brand new store

## What Was Fixed

1. **User Super Admin Status**: Set `is_super_admin: true` for the user
2. **ObjectId Parsing**: Fixed getUserById to handle different ID formats
3. **Store Context**: Updated to return all stores for authenticated users
4. **Debug Logging**: Added comprehensive logging to track issues

## Verify Everything Works

Run this command to check the database:
```bash
node scripts/check-stores.mjs
```

This should show:
- 3 stores in the database
- User with super admin status
- Store permissions for each store

## If Still Not Working

1. Check browser console for errors
2. Check server logs for "STORE API DEBUG" messages
3. Verify stores exist: `curl http://localhost:3003/api/playwright`
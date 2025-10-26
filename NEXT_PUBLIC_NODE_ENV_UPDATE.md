# NEXT_PUBLIC_NODE_ENV Update Summary

## Issue
The DEV tab in Wizel chat wasn't showing because `process.env.NODE_ENV` doesn't work in client-side components in Next.js.

## Solution
Updated all client-side code to use `NEXT_PUBLIC_NODE_ENV` instead of `NODE_ENV`.

## Files Updated

### 1. **Client-Side Components**

#### `/app/components/ai/wizel-chat.jsx`
```javascript
// BEFORE
const isDev = process.env.NODE_ENV === 'development';

// AFTER
const isDev = process.env.NEXT_PUBLIC_NODE_ENV === 'development';
```

#### `/app/providers/posthog.js`
```javascript
// BEFORE
if (process.env.NODE_ENV === 'development') {
  posthog.debug();
}

// AFTER
if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
  posthog.debug();
}
```

#### `/app/(dashboard)/store/[storePublicId]/email-builder1/page.jsx`
```javascript
// BEFORE
if (process.env.NODE_ENV === 'development' && retryCount >= 2) {

// AFTER
if (process.env.NEXT_PUBLIC_NODE_ENV === 'development' && retryCount >= 2) {
```

### 2. **Environment Configuration**

#### `.env.example`
Added new environment variable at the top:
```bash
# Environment Configuration
# Set to 'development' to enable dev-only features (DEV tab in Wizel chat, debug logging, etc.)
NEXT_PUBLIC_NODE_ENV=development
```

## Important Notes

### Why NEXT_PUBLIC_NODE_ENV?

1. **Client-Side Access**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
2. **NODE_ENV Limitation**: `process.env.NODE_ENV` is only available server-side in Next.js
3. **Security**: Since this only controls UI features (not API keys), it's safe to expose

### Server-Side vs Client-Side

**Server-Side Code** (API routes, getServerSideProps, etc.):
- ✅ Can use `process.env.NODE_ENV`
- ✅ Not exposed to browser
- ✅ Examples: `/lib/klaviyo-api.js`, `/lib/mongoose.js`

**Client-Side Code** (React components marked with "use client"):
- ❌ Cannot use `process.env.NODE_ENV`
- ✅ Must use `process.env.NEXT_PUBLIC_NODE_ENV`
- ✅ Examples: `/app/components/ai/wizel-chat.jsx`, `/app/providers/posthog.js`

## Files NOT Changed (Server-Side)

The following files still use `process.env.NODE_ENV` because they're server-side only:

### API Routes
- `/app/api/ai/ask-context/route.js`
- `/app/api/ai/analyze-mcp/route.js`
- `/app/api/mcp/klaviyo/route.js`
- `/app/api/stores/route.js`
- `/app/api/chat/ai/route.js`
- And other API routes...

### Library Files
- `/lib/klaviyo-api.js` - Server-side Klaviyo API calls
- `/lib/klaviyo-auth-helper.js` - Server-side auth helper
- `/lib/mongoose.js` - Database connection
- `/lib/model-registry.js` - Model loading
- `/lib/db-utils.js` - Database utilities

**These files are correct as-is** because they only run on the server.

## How to Enable DEV Tab

### Option 1: Add to .env file
```bash
# Add this line to your .env file
NEXT_PUBLIC_NODE_ENV=development
```

### Option 2: Add to .env.local file
```bash
# Create or edit .env.local
NEXT_PUBLIC_NODE_ENV=development
```

### After Adding the Variable
1. **Restart your dev server**: `npm run dev`
2. **Hard refresh your browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. **Open Wizel chat**: Click the sparkle icon in bottom right
4. **See DEV tab**: Orange "DEV" tab should appear next to "Support"

## Verification Checklist

- [x] Updated client-side components to use NEXT_PUBLIC_NODE_ENV
- [x] Added NEXT_PUBLIC_NODE_ENV to .env.example
- [x] Documented server-side vs client-side usage
- [x] Created migration guide
- [ ] User adds NEXT_PUBLIC_NODE_ENV=development to .env
- [ ] User restarts dev server
- [ ] User sees DEV tab in Wizel chat

## Production Safety

In production:
- Set `NEXT_PUBLIC_NODE_ENV=production` or omit it entirely
- DEV tab will be hidden
- Debug logging will be disabled
- Development bypasses will be disabled

## Testing

### Test 1: DEV Tab Visibility
```bash
# .env or .env.local
NEXT_PUBLIC_NODE_ENV=development

# Expected: DEV tab shows in Wizel chat (orange tab)
```

### Test 2: Production Mode
```bash
# .env or .env.local
NEXT_PUBLIC_NODE_ENV=production

# Expected: DEV tab hidden in Wizel chat
```

### Test 3: PostHog Debug
```bash
# .env or .env.local
NEXT_PUBLIC_NODE_ENV=development

# Expected: PostHog debug messages in console
```

## Common Issues

### Issue: DEV tab still not showing
**Solution**:
1. Check that you added the variable to `.env` or `.env.local`
2. Restart your dev server (`npm run dev`)
3. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
4. Check browser console for the value: `console.log(process.env.NEXT_PUBLIC_NODE_ENV)`

### Issue: Variable undefined in browser
**Solution**:
1. Ensure variable starts with `NEXT_PUBLIC_`
2. Restart dev server (Next.js only loads env vars on startup)
3. Check that `.env` file is in the root directory

### Issue: Works in dev but not production
**Solution**:
1. This is expected! DEV tab should only show in development
2. Set `NEXT_PUBLIC_NODE_ENV=production` in production environment
3. Or omit the variable entirely in production

## Related Documentation

- `/DEV_TAB_IMPLEMENTATION.md` - DEV tab feature documentation
- `/context/AI_MARKETING_ANALYSIS_GUIDE.md` - Complete AI system guide
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

## Summary

**What Changed:**
- ✅ 3 client-side files updated to use `NEXT_PUBLIC_NODE_ENV`
- ✅ 1 environment file updated with new variable
- ✅ ~30 server-side files unchanged (correctly using `NODE_ENV`)

**What You Need to Do:**
1. Add `NEXT_PUBLIC_NODE_ENV=development` to your `.env` file
2. Restart your dev server
3. Refresh your browser
4. Enjoy the DEV tab! 🎉

# Vercel Deployment Guide - Auth.js v5

## 🚨 Critical Environment Variables

Your Auth.js setup requires these environment variables to be set in Vercel:

### Required Variables

```bash
# Auth.js Configuration (CRITICAL!)
NEXTAUTH_URL=https://www.wizel.ai
NEXTAUTH_SECRET=your-production-secret-here

# Auth.js v5 also accepts these alternative names
AUTH_URL=https://www.wizel.ai
AUTH_SECRET=your-production-secret-here

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
MONGODB_URI=your-mongodb-connection-string

# Other required variables
KLAVIYO_REVISION=2025-07-15
NEXT_PUBLIC_KLAVIYO_REVISION=2025-07-15
```

---

## 🔧 Setting Environment Variables in Vercel

### Option 1: Via Vercel Dashboard

1. Go to your project: https://vercel.com/your-username/wizelfront
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `NEXTAUTH_URL`
   - **Value**: `https://www.wizel.ai`
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**
5. Repeat for all variables

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add NEXTAUTH_URL production
# Enter: https://www.wizel.ai

vercel env add NEXTAUTH_SECRET production
# Enter: your-secret-key

vercel env add AUTH_URL production
# Enter: https://www.wizel.ai

vercel env add AUTH_SECRET production
# Enter: your-secret-key

# Add other variables...
```

---

## 🔑 Generating NEXTAUTH_SECRET

You need a secure random secret for production. Generate one using:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

**Example output:**
```
wJZ8VqK4lP9mN2cX5tR7yU8vB6nM3aQ1sD4fG5hJ7kL9
```

⚠️ **NEVER commit this to Git!** Only add it to Vercel environment variables.

---

## 📋 Complete Environment Variables Checklist

Add these to Vercel (copy from your `.env` file):

### Authentication (CRITICAL)
- [ ] `NEXTAUTH_URL` = `https://www.wizel.ai`
- [ ] `NEXTAUTH_SECRET` = (generate new secret for production)
- [ ] `AUTH_URL` = `https://www.wizel.ai` (Auth.js v5 alternative)
- [ ] `AUTH_SECRET` = (same as NEXTAUTH_SECRET)

### Google OAuth (if using)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

### Database
- [ ] `MONGODB_URI`

### Klaviyo
- [ ] `KLAVIYO_REVISION`
- [ ] `NEXT_PUBLIC_KLAVIYO_REVISION`
- [ ] `KLAVIYO_CLIENT_ID` (if using)
- [ ] `KLAVIYO_CLIENT_SECRET` (if using)

### ClickHouse (if using)
- [ ] `CLICKHOUSE_HOST`
- [ ] `CLICKHOUSE_USER`
- [ ] `CLICKHOUSE_PASSWORD`
- [ ] `CLICKHOUSE_DATABASE`

### AWS S3 (if using)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `AWS_S3_BUCKET`

### Stripe (if using)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### Email (Resend)
- [ ] `RESEND_API_KEY`

### Other
- [ ] `NODE_ENV` = `production`

---

## 🐛 Troubleshooting 404 Error

### Issue: `/api/auth/session` returns 404

**Causes:**
1. ✅ **Missing `NEXTAUTH_URL`** - Most common!
2. ✅ **Missing `NEXTAUTH_SECRET`**
3. ❌ Auth route not deployed properly
4. ❌ Build failed silently

### Quick Fix:

1. **Set environment variables in Vercel:**
   ```bash
   NEXTAUTH_URL=https://www.wizel.ai
   NEXTAUTH_SECRET=your-generated-secret
   ```

2. **Redeploy:**
   ```bash
   # Via CLI
   vercel --prod

   # Or via Dashboard
   # Go to Deployments → click "Redeploy"
   ```

3. **Verify the route exists:**
   - Check: `https://www.wizel.ai/api/auth/providers`
   - Should return JSON, not HTML 404

---

## 🔍 Verifying Environment Variables

### Check if variables are set:

```bash
# Via Vercel CLI
vercel env ls

# Should show:
# NEXTAUTH_URL    Production, Preview, Development
# NEXTAUTH_SECRET Production, Preview, Development
# etc.
```

### Test Auth Routes:

```bash
# Providers endpoint (should work without auth)
curl https://www.wizel.ai/api/auth/providers

# Expected response:
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    ...
  },
  "credentials": {
    "id": "credentials",
    "name": "credentials",
    "type": "credentials"
  }
}

# Session endpoint
curl https://www.wizel.ai/api/auth/session

# Expected response (when not logged in):
{"user":null}
```

---

## 🚀 Deployment Steps

### 1. Set Environment Variables
```bash
# Add all required variables in Vercel Dashboard
# Settings → Environment Variables
```

### 2. Update Google OAuth (if using)
```
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth Client ID
3. Add to "Authorized redirect URIs":
   - https://www.wizel.ai/api/auth/callback/google
4. Save
```

### 3. Deploy
```bash
# Option A: Git push (auto-deploy)
git add .
git commit -m "Add Auth.js v5 with environment variables"
git push

# Option B: Manual deploy
vercel --prod
```

### 4. Verify Deployment
```bash
# Check build logs
vercel logs

# Test auth endpoints
curl https://www.wizel.ai/api/auth/providers
curl https://www.wizel.ai/api/auth/session
```

---

## 📝 Vercel Configuration File

Create or update `vercel.json`:

```json
{
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXTAUTH_URL": "https://www.wizel.ai",
    "NODE_ENV": "production"
  }
}
```

⚠️ **Don't put secrets in `vercel.json`!** Use Vercel Dashboard for `NEXTAUTH_SECRET`.

---

## 🔐 Security Checklist

- [ ] Generated new `NEXTAUTH_SECRET` for production (not same as dev)
- [ ] All secrets added via Vercel Dashboard (not in code)
- [ ] Google OAuth redirect URI updated for production
- [ ] `NEXTAUTH_URL` matches your domain exactly
- [ ] No sensitive data in `vercel.json` or committed files
- [ ] `.env` file is in `.gitignore`

---

## 🎯 Quick Fix Commands

```bash
# 1. Set critical variables
vercel env add NEXTAUTH_URL production
# Value: https://www.wizel.ai

vercel env add NEXTAUTH_SECRET production
# Value: (paste your generated secret)

# 2. Redeploy
vercel --prod

# 3. Check logs
vercel logs --follow

# 4. Test
curl https://www.wizel.ai/api/auth/providers
```

---

## ⚠️ Common Mistakes

### ❌ Wrong `NEXTAUTH_URL`
```bash
# WRONG
NEXTAUTH_URL=http://www.wizel.ai  # Missing https://
NEXTAUTH_URL=https://wizel.ai     # Missing www.
NEXTAUTH_URL=www.wizel.ai         # Missing protocol

# CORRECT
NEXTAUTH_URL=https://www.wizel.ai
```

### ❌ Missing Variables for Environments
Make sure to add variables to **all environments**:
- ✅ Production
- ✅ Preview
- ✅ Development

### ❌ Not Redeploying After Adding Variables
After adding environment variables, you **MUST redeploy**:
```bash
vercel --prod
```

---

## 📊 Deployment Verification

After deployment, verify these URLs work:

1. **Auth Providers:** https://www.wizel.ai/api/auth/providers
   - Should return JSON with provider info

2. **Auth Session:** https://www.wizel.ai/api/auth/session
   - Should return `{"user":null}` when not logged in

3. **Login Page:** https://www.wizel.ai/login
   - Should load without console errors

4. **CSRF Token:** https://www.wizel.ai/api/auth/csrf
   - Should return JSON with `csrfToken`

---

## 🆘 Still Not Working?

### Check Vercel Build Logs:

1. Go to: https://vercel.com/your-project/deployments
2. Click latest deployment
3. Check "Building" logs for errors
4. Look for TypeScript or build errors

### Check Function Logs:

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs --since 1h
```

### Common Errors in Logs:

```bash
# Missing environment variable
Error: NEXTAUTH_SECRET environment variable is not set

# Wrong URL
Error: Invalid NEXTAUTH_URL

# MongoDB connection failed
Error: connect ECONNREFUSED (check MONGODB_URI)
```

---

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ `/api/auth/providers` returns JSON (not 404)
3. ✅ `/api/auth/session` returns JSON (not 404)
4. ✅ Login page loads without console errors
5. ✅ You can log in successfully
6. ✅ Session persists after page refresh

---

## 📚 Additional Resources

- [Auth.js Environment Variables](https://authjs.dev/getting-started/deployment#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js 15 Deployment](https://nextjs.org/docs/deployment)

---

**Need help?** Check the build logs and function logs in Vercel Dashboard!

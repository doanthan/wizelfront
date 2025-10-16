# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Wizel AI application.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your application running locally (default: http://localhost:3000)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Wizel AI")
5. Click "Create"

## Step 2: Enable Google+ API (Optional)

While not strictly required for OAuth, it's good practice:

1. In your Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" at the top
3. Select "OAuth client ID"
4. If prompted, configure the OAuth consent screen first:
   - Click "Configure Consent Screen"
   - Select "External" user type
   - Fill in the required fields:
     - App name: `Wizel AI`
     - User support email: Your email
     - Developer contact email: Your email
   - Click "Save and Continue"
   - Skip the "Scopes" step (click "Save and Continue")
   - Add test users if needed (your email)
   - Click "Save and Continue"

5. Back to creating OAuth client ID:
   - Application type: "Web application"
   - Name: "Wizel AI Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"

6. Copy your Client ID and Client Secret (you'll need these next)

## Step 4: Configure Environment Variables

1. Open your `.env` file in the project root
2. Add or update these variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

3. To generate a secure `NEXTAUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

## Step 5: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/register`

3. You should see a "Sign up with Google" button

4. Click it and test the OAuth flow

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes - they matter!

### Error: "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen
- Add your email as a test user in the OAuth consent screen

### Google Sign-in button doesn't work
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly in `.env`
- Restart your development server after adding environment variables
- Check browser console for errors

### Users created via Google OAuth can't sign in
- This shouldn't happen as the system creates accounts automatically
- Check the MongoDB database to verify the user was created
- Look for `oauth_provider: 'google'` field in the user document

## Production Deployment

When deploying to production:

1. Add your production domain to:
   - Authorized JavaScript origins
   - Authorized redirect URIs (e.g., `https://yourdomain.com/api/auth/callback/google`)

2. Update your `.env` for production:
```bash
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
```

3. Consider creating separate OAuth credentials for development and production

## Security Notes

- Never commit your `.env` file to version control
- Keep your `GOOGLE_CLIENT_SECRET` confidential
- Rotate credentials if they're ever exposed
- Use different credentials for development and production
- Regularly review authorized domains in Google Console

## User Experience Flow

1. User clicks "Sign up with Google" on register page
2. User is redirected to Google's OAuth consent screen
3. User grants permission
4. Google redirects back to your app with authorization code
5. NextAuth exchanges code for user info
6. System creates new user account automatically (if first time)
7. User is logged in and redirected to dashboard

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)

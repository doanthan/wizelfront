import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';

// OAuth callback endpoint
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    // Verify state and extract storePublicId
    let stateData;
    let storePublicId;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      storePublicId = stateData.storePublicId;
    } catch (e) {
      // Can't redirect without storePublicId, so return error
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/store/${storePublicId}/klaviyo-connect?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/store/${storePublicId}/klaviyo-connect?error=Missing authorization code or state`
      );
    }

    await connectToDatabase();

    // Find the store
    const store = await Store.findOne({ 
      public_id: storePublicId,
      is_deleted: { $ne: true }
    });

    if (!store) {
      console.error('Store not found:', storePublicId);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/store/${storePublicId}/klaviyo-connect?error=Store not found`
      );
    }
    
    console.log('Store found:', {
      storeId: store.public_id,
      hasKlaviyoIntegration: !!store.klaviyo_integration,
      currentStatus: store.klaviyo_integration?.status
    });

    // Exchange authorization code for tokens
    const tokenUrl = 'https://a.klaviyo.com/oauth/token';
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      code_verifier: stateData.code_verifier,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/store/klaviyo-oauth/callback`
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.WIZEL_KLAVIYO_ID}:${process.env.WIZEL_KLAVIYO_SECRET}`).toString('base64')}`
      },
      body: tokenBody
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/store/${storePublicId}/klaviyo-connect?error=Failed to exchange authorization code`
      );
    }

    const tokenData = await tokenResponse.json();
    
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    });

    // Get account info using the new token
    const accountResponse = await fetch('https://a.klaviyo.com/api/accounts/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
        'revision': '2024-10-15'
      }
    });

    let accountInfo = {};
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      if (accountData.data && accountData.data.length > 0) {
        const account = accountData.data[0];
        accountInfo = {
          id: account.id,
          test_account: account.attributes.test_account,
          contact_information: account.attributes.contact_information,
          locale: account.attributes.locale,
          timezone: account.attributes.timezone,
          preferred_currency: account.attributes.preferred_currency,
          public_api_key: account.attributes.public_api_key
        };
      }
    }

    // Calculate token expiration (typically 1 hour from now)
    const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour
    const tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));

    // Update store with OAuth tokens - use set() to ensure Mongoose tracks changes
    store.set('klaviyo_integration.status', 'connected');
    store.set('klaviyo_integration.oauth_token', tokenData.access_token);
    store.set('klaviyo_integration.refresh_token', tokenData.refresh_token);
    store.set('klaviyo_integration.token_expires_at', tokenExpiresAt);
    store.set('klaviyo_integration.auth_type', 'oauth');
    store.set('klaviyo_integration.public_id', accountInfo.public_api_key || accountInfo.id);
    store.set('klaviyo_integration.connected_at', new Date());
    store.set('klaviyo_integration.account', accountInfo);
    
    // Clear legacy API key if present
    store.set('klaviyo_integration.apiKey', null);

    // Mark the entire path as modified to ensure Mongoose saves it
    store.markModified('klaviyo_integration');

    await store.save();
    
    console.log('OAuth tokens saved:', {
      storeId: store.public_id,
      hasOAuthToken: !!store.klaviyo_integration.oauth_token,
      hasRefreshToken: !!store.klaviyo_integration.refresh_token,
      authType: store.klaviyo_integration.auth_type
    });

    // Redirect back to klaviyo-connect page to continue with metric selection
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/store/${storePublicId}/klaviyo-connect?success=true&step=metric`
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    // Try to extract storePublicId from state for redirect
    try {
      const { searchParams } = new URL(request.url);
      const state = searchParams.get('state');
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const storePublicId = stateData.storePublicId;
        if (storePublicId) {
          return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/store/${storePublicId}/klaviyo-connect?error=An unexpected error occurred`
          );
        }
      }
    } catch (e) {
      // Ignore state parsing errors
    }
    // If we can't get storePublicId, return JSON error
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
}
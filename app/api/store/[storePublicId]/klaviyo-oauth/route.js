import { NextResponse } from 'next/server';
import { withStoreAccess } from '@/middleware/storeAccess';
import crypto from 'crypto';

// Helper function to generate PKCE challenge
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

// Initiate OAuth flow
export const POST = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check if user has integration management permissions
    if (!role?.permissions?.stores?.manage_integrations && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage integrations' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { storePublicId } = params;
    
    // Generate PKCE challenge
    const { verifier, challenge } = generatePKCE();
    
    // Create state parameter with store info and PKCE verifier
    const stateData = {
      storePublicId,
      userId: user._id.toString(),
      code_verifier: verifier,
      timestamp: Date.now()
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // Define scopes needed for your application
    const scopes = [
      'accounts:read',
      'campaigns:read',
      'campaigns:write',
      'data-privacy:read',
      'events:read',
      'events:write',
      'flows:read',
      'flows:write',
      'images:read',
      'images:write',
      'lists:read',
      'lists:write',
      'metrics:read',
      'profiles:read',
      'profiles:write',
      'segments:read',
      'segments:write',
      'tags:read',
      'tags:write',
      'templates:read',
      'templates:write',
      'webhooks:read',
      'webhooks:write'
    ];
    
    // Build authorization URL
    const authUrl = new URL('https://www.klaviyo.com/oauth/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', process.env.WIZEL_KLAVIYO_ID);
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/api/store/klaviyo-oauth/callback`);
    authUrl.searchParams.append('scope', scopes.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    return NextResponse.json({
      authUrl: authUrl.toString(),
      success: true
    });

  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
});

// Refresh OAuth token
export const PUT = withStoreAccess(async (request, context) => {
  try {
    const { store, user, role } = request;

    // Check if user has integration management permissions
    if (!role?.permissions?.stores?.manage_integrations && !user.is_super_user) {
      return NextResponse.json(
        { error: 'Insufficient permissions to manage integrations' },
        { status: 403 }
      );
    }

    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
    }

    // Exchange refresh token for new access token
    const tokenUrl = 'https://a.klaviyo.com/oauth/token';
    const tokenBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
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
      console.error('Token refresh error:', errorData);
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Calculate new expiration
    const expiresIn = tokenData.expires_in || 3600;
    const tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenExpiresAt,
      success: true
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
});
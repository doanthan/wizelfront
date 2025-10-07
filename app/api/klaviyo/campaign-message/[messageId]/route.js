import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchKlaviyoCampaignMessage } from '@/lib/klaviyo';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import Store from '@/models/Store';
import CampaignStat from '@/models/CampaignStat';
import connectToDatabase from '@/lib/mongoose';

export async function GET(request, { params }) {
  try {
    console.log('🚀 Campaign message API called:', { url: request.url });
    await connectToDatabase();
    
    // Get the message ID from params
    const { messageId } = await params;
    console.log('📧 Message ID from params:', messageId);
    
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get storeId from query parameter (required)
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    console.log('🏪 Store ID from query:', storeId);
    
    if (!storeId) {
      console.log('❌ No store ID provided');
      return NextResponse.json({ 
        error: 'Store ID is required' 
      }, { status: 400 });
    }

    // 3. Find the store - try multiple approaches
    // The storeId could be either a store public_id or a klaviyo_public_id
    let store = null;

    // First try: Find by store public_id
    console.log('🔍 Looking for store with public_id:', storeId);
    store = await Store.findOne({
      public_id: storeId
    });

    // Second try: If not found and storeId looks like a Klaviyo ID, find ANY store the user has access to with this Klaviyo ID
    if (!store) {
      console.log('🔍 Store not found by public_id, looking for stores with klaviyo_public_id:', storeId);

      // Find all stores with this Klaviyo integration
      const storesWithKlaviyo = await Store.find({
        'klaviyo_integration.public_id': storeId
      });

      console.log(`📊 Found ${storesWithKlaviyo.length} store(s) with Klaviyo ID: ${storeId}`);

      // Check if user is super admin first (has access to all stores)
      const User = (await import('@/models/User')).default;
      const user = await User.findById(session.user.id);
      const isSuperUser = user?.is_super_user || user?.super_admin;

      // Find the first store the user has access to
      for (const candidateStore of storesWithKlaviyo) {
        const isOwner = candidateStore.owner_id?.toString() === session.user.id;
        const hasAccess = isSuperUser || await Store.hasAccess(candidateStore._id, session.user.id);

        console.log(`  Checking store ${candidateStore.public_id} (${candidateStore.name}):`, {
          isOwner,
          hasAccess,
          isSuperUser
        });

        if (isOwner || hasAccess) {
          store = candidateStore;
          console.log(`  ✅ User has access to this store`);
          break;
        }
      }
    }

    if (!store) {
      console.log('❌ No accessible store found for:', storeId);
      return NextResponse.json({
        error: 'Store not found or access denied'
      }, { status: 404 });
    }
    
    console.log('✅ Store found:', {
      id: store._id.toString(),
      name: store.name,
      public_id: store.public_id,
      klaviyo_public_id: store.klaviyo_integration?.public_id
    });
    
    // Optional: Try to find campaign in database for additional metadata
    let campaign = await CampaignStat.findOne({
      'groupings.campaign_message_id': messageId
    });

    // Check if store has Klaviyo authentication (OAuth or API key)
    if (!store.klaviyo_integration || (!store.klaviyo_integration.apiKey && !store.klaviyo_integration.oauth_token)) {
      console.log('Klaviyo integration details:', {
        hasIntegration: !!store.klaviyo_integration,
        hasApiKey: !!store.klaviyo_integration?.apiKey,
        hasOAuth: !!store.klaviyo_integration?.oauth_token,
        publicId: store.klaviyo_integration?.public_id
      });
      return NextResponse.json({ 
        error: 'Klaviyo authentication not configured for this store' 
      }, { status: 404 });
    }

    // 4. Check user has access to this store
    console.log('🔐 Checking store access:', {
      storeId: store._id.toString(),
      storeName: store.name,
      storeOwnerId: store.owner_id?.toString(),
      storeContractId: store.contract_id?.toString(),
      userId: session.user.id,
      userEmail: session.user.email
    });

    // Get user details for admin check
    const User = (await import('@/models/User')).default;
    const user = await User.findById(session.user.id);

    console.log('👤 User details:', {
      userId: session.user.id,
      userEmail: session.user.email,
      isSuperAdmin: user?.super_admin,
      isAdmin: user?.is_super_user
    });

    // Permission check hierarchy:
    // 1. Super admin/super user - always has access
    // 2. Store owner - always has access to their own store
    // 3. Contract-based access via Store.hasAccess

    let hasAccess = false;
    let accessReason = '';

    // Check 1: Super admin or super user
    if (user?.super_admin || user?.is_super_user) {
      hasAccess = true;
      accessReason = 'admin privileges';
      console.log('✅ Access granted via admin privileges');
    }
    // Check 2: Store owner (IMPORTANT: Compare as strings)
    else if (store.owner_id && store.owner_id.toString() === session.user.id.toString()) {
      hasAccess = true;
      accessReason = 'store owner';
      console.log('✅ Access granted - user is store owner');
      console.log('Owner check details:', {
        storeOwnerId: store.owner_id.toString(),
        sessionUserId: session.user.id.toString(),
        matches: store.owner_id.toString() === session.user.id.toString()
      });
    }
    // Check 3: Contract-based access
    else {
      const contractAccess = await Store.hasAccess(store._id, session.user.id);
      if (contractAccess) {
        hasAccess = true;
        accessReason = 'contract seat access';
        console.log('✅ Access granted via contract seat');
      } else {
        console.log('❌ No access via contract system');
      }
    }

    if (!hasAccess) {
      console.log('❌ Access denied - user has no privileges to this store', {
        storeOwnerId: store.owner_id?.toString(),
        userId: session.user.id.toString(),
        isOwner: store.owner_id?.toString() === session.user.id.toString(),
        hasContractAccess: false
      });
      return NextResponse.json({
        error: 'You do not have permission to access this store'
      }, { status: 403 });
    }

    console.log(`✅ Access granted via: ${accessReason}`);

    // 5. Build OAuth-first authentication options
    const klaviyoAuthOptions = buildKlaviyoAuthOptions(store);
    
    // 6. Fetch from Klaviyo API using OAuth-first approach
    console.log('📡 Fetching campaign message from Klaviyo API:', {
      messageId,
      hasOAuth: !!store.klaviyo_integration?.oauth_token,
      hasApiKey: !!store.klaviyo_integration?.apiKey
    });

    let campaignMessage;
    try {
      campaignMessage = await fetchKlaviyoCampaignMessage(
        messageId,
        klaviyoAuthOptions
      );
    } catch (fetchError) {
      console.error('❌ Failed to fetch from Klaviyo:', {
        error: fetchError.message,
        messageId,
        storePublicId: store.public_id,
        klaviyoPublicId: store.klaviyo_integration?.public_id
      });

      // Check for specific error messages from Klaviyo
      const errorMessage = fetchError.message?.toLowerCase() || '';

      // Handle "does not exist" errors - campaign message deleted from Klaviyo
      if (errorMessage.includes('does not exist') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('404')) {

        console.log('📝 Campaign message not found in Klaviyo - might be deleted or a draft');

        // Try to get campaign info from MongoDB for basic details
        let campaignInfo = {};
        try {
          const CampaignStat = require('@/models/CampaignStat').default;
          const campaign = await CampaignStat.findOne({
            'groupings.campaign_message_id': messageId
          });

          if (campaign) {
            campaignInfo = {
              name: campaign.campaign_name,
              subject: campaign.subject_line,
              channel: campaign.groupings?.send_channel || 'email'
            };
          }
        } catch (e) {
          console.log('Could not fetch campaign info from MongoDB:', e.message);
        }

        return NextResponse.json({
          success: true,
          data: {
            channel: campaignInfo.channel || 'email',
            html: `<div style="padding: 40px; text-align: center; background: #f9f9f9; border-radius: 8px;">
                    <div style="color: #666; margin-bottom: 20px;">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto;">
                        <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                        <polyline points="3 10 12 15 21 10"></polyline>
                      </svg>
                    </div>
                    <h3 style="color: #333; margin: 10px 0;">Preview Not Available</h3>
                    <p style="color: #666; margin: 10px 0; font-size: 14px;">
                      ${campaignInfo.name || 'This campaign'}
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                      The campaign content is no longer available in Klaviyo.<br/>
                      It may have been deleted or is an older campaign.
                    </p>
                  </div>`,
            text: 'Campaign preview not available - content no longer exists in Klaviyo',
            subject: campaignInfo.subject || 'Campaign',
            campaignName: campaignInfo.name || 'Campaign',
            isDraft: true
          }
        });
      }

      throw fetchError;
    }

    // 7. Extract template HTML and metadata
    const template = campaignMessage.included?.find(item => item.type === 'template');
    const messageData = campaignMessage.data;

    // 8. Check if this is an SMS campaign and return appropriate data
    const channel = messageData?.attributes?.channel || 
                   messageData?.attributes?.definition?.channel ||
                   campaign?.groupings?.send_channel || 
                   'email';
    
    console.log('Campaign channel:', channel);
    console.log('Message attributes:', messageData?.attributes);
    console.log('Campaign from DB:', campaign);
    
    if (channel === 'sms') {
      console.log('🔍 Processing SMS campaign message');
      console.log('Message attributes:', JSON.stringify(messageData?.attributes, null, 2));
      
      // SMS-Specific Processing - extract fields following the specified format
      const body = messageData?.attributes?.definition?.content?.body ||
                   messageData?.attributes?.content?.body ||
                   messageData?.attributes?.body || 
                   campaign?.content?.body ||  // Check campaign from DB
                   '';

      const mediaUrl = messageData?.attributes?.definition?.content?.media_url ||
                       messageData?.attributes?.content?.media_url ||
                       campaign?.content?.media_url || // Check campaign from DB
                       null;

      console.log('📱 SMS Body extracted:', body);
      console.log('🖼️ SMS Media URL:', mediaUrl);
      
      // If no body found in message data, try to get it from template
      let finalBody = body;
      if (!finalBody && template) {
        console.log('Checking template for SMS content...');
        finalBody = template?.attributes?.body || template?.attributes?.text || '';
        console.log('Body from template:', finalBody);
      }

      const responseData = {
        success: true,
        data: {
          type: 'sms',
          channel: 'sms',
          body: finalBody,
          mediaUrl: mediaUrl,
          rawBody: finalBody,
          text: finalBody, // Add text field as fallback
          messageId: messageId,
          campaignName: campaign?.campaign_name || messageData?.attributes?.name || '',
          fromPhone: messageData?.attributes?.definition?.content?.from_number || 
                     messageData?.attributes?.from_number || '',
        }
      };
      
      console.log('✅ Returning SMS response:', JSON.stringify(responseData, null, 2));
      return NextResponse.json(responseData);
    }
    
    // 9. Return formatted response for email
    const emailResponse = {
      success: true,
      data: {
        channel: 'email',
        html: template?.attributes?.html || '',
        text: template?.attributes?.text || '',
        subject: messageData?.attributes?.definition?.content?.subject || campaign?.subject_line || '',
        previewText: messageData?.attributes?.definition?.content?.preview_text || '',
        fromEmail: messageData?.attributes?.definition?.content?.from_email || campaign?.from_address || '',
        fromLabel: messageData?.attributes?.definition?.content?.from_label || campaign?.from_label || '',
        replyToEmail: messageData?.attributes?.definition?.content?.reply_to_email || '',
        templateId: template?.id || '',
        templateName: template?.attributes?.name || '',
        messageId: messageId,
        campaignName: campaign?.campaign_name || messageData?.attributes?.definition?.label || messageData?.attributes?.name || ''
      }
    };
    
    console.log('Email response data:', {
      fromEmail: emailResponse.data.fromEmail,
      fromLabel: emailResponse.data.fromLabel,
      subject: emailResponse.data.subject
    });
    
    return NextResponse.json(emailResponse);

  } catch (error) {
    const { searchParams } = new URL(request.url);
    // Get messageId from already awaited params
    const { messageId } = await params;

    console.error('Error fetching campaign message:', {
      error: error.message,
      stack: error.stack,
      messageId: messageId,
      storeId: searchParams?.get('storeId'),
      fullError: error
    });

    // Check for specific error types
    const errorMessageLower = error.message?.toLowerCase() || '';

    if (errorMessageLower.includes('401') || errorMessageLower.includes('unauthorized')) {
      return NextResponse.json({
        error: 'Klaviyo authentication failed. Please reconnect your Klaviyo account.'
      }, { status: 401 });
    }

    // Handle "does not exist" errors from Klaviyo API
    if (errorMessageLower.includes('does not exist') ||
        errorMessageLower.includes('404') ||
        errorMessageLower.includes('not found')) {
      return NextResponse.json({
        error: 'Campaign message not found in Klaviyo. It may have been deleted or is no longer available.',
        messageId: messageId
      }, { status: 404 });
    }

    // Generic server error with more details
    return NextResponse.json({
      error: 'A server error occurred.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
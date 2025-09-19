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

    // 3. Find the store by the provided storeId
    // The storeId is likely a klaviyo_public_id (e.g., "SwiuXz")
    console.log('🔍 Looking for store with klaviyo_public_id:', storeId);
    let store = await Store.findOne({
      'klaviyo_integration.public_id': storeId
    });
    
    // If not found by klaviyo_public_id, try by store public_id
    if (!store) {
      console.log('🔍 Store not found by klaviyo_public_id, trying store public_id:', storeId);
      store = await Store.findOne({
        public_id: storeId
      });
    }

    if (!store) {
      console.log('❌ Store not found by either ID:', storeId);
      return NextResponse.json({ 
        error: 'Store not found' 
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

    // 4. Check user has access to this store - simplified check using Store model
    console.log('🔐 Checking store access:', {
      storeId: store._id.toString(),
      storeName: store.name,
      userId: session.user.id,
      userEmail: session.user.email
    });
    
    // Get user details first to understand their permissions
    const User = (await import('@/models/User')).default;
    const user = await User.findById(session.user.id);
    
    console.log('👤 User details:', {
      userId: session.user.id,
      userEmail: session.user.email,
      isSuperAdmin: user?.super_admin,
      isAdmin: user?.is_super_user,
      userStoreIds: user?.store_ids,
      userStores: user?.stores?.map(s => ({ 
        store_id: s.store_id?.toString(),
        role: s.role 
      }))
    });
    
    const hasAccess = await Store.hasAccess(store._id, session.user.id);
    
    console.log('🔐 Store access result:', hasAccess);
    
    if (!hasAccess) {
      console.log('🔐 Access check failed, checking admin privileges');
      
      // Check if user is super admin or super user
      if (user?.super_admin || user?.is_super_user) {
        console.log('🔐 Access granted via admin privileges:', {
          super_admin: user.super_admin,
          is_super_user: user.is_super_user
        });
      } else {
        console.log('❌ Access denied - no admin privileges or store access');
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else {
      console.log('🔐 Access granted via store access check');
    }

    // 5. Build OAuth-first authentication options
    const klaviyoAuthOptions = buildKlaviyoAuthOptions(store);
    
    // 6. Fetch from Klaviyo API using OAuth-first approach
    const campaignMessage = await fetchKlaviyoCampaignMessage(
      messageId,
      klaviyoAuthOptions
    );

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
    console.error('Error fetching campaign message:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch campaign message' 
    }, { status: 500 });
  }
}
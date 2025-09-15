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
    await connectToDatabase();
    
    // Get the message ID from params
    const { messageId } = await params;
    
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
    
    if (!storeId) {
      return NextResponse.json({ 
        error: 'Store ID is required' 
      }, { status: 400 });
    }

    // 3. Find the store by the provided storeId
    // The storeId is likely a klaviyo_public_id (e.g., "SwiuXz")
    let store = await Store.findOne({
      'klaviyo_integration.public_id': storeId
    });
    
    // If not found by klaviyo_public_id, try by store public_id
    if (!store) {
      store = await Store.findOne({
        public_id: storeId
      });
    }

    if (!store) {
      return NextResponse.json({ 
        error: 'Store not found' 
      }, { status: 404 });
    }
    
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
    const hasAccess = await Store.hasAccess(store._id, session.user.id);
    
    if (!hasAccess) {
      // Also check if user is super admin
      const User = (await import('@/models/User')).default;
      const user = await User.findById(session.user.id);
      
      console.log('Access check failed:', {
        userId: session.user.id,
        storeId: store._id.toString(),
        userStores: user.stores?.map(s => s.store_id?.toString()),
        isSuperAdmin: user.super_admin
      });
      
      if (!user.super_admin) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
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
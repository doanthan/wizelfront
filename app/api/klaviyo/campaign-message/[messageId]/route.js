import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchKlaviyoCampaignMessage } from '@/lib/klaviyo';
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

    if (!store.klaviyo_integration?.apiKey) {
      console.log('Klaviyo integration details:', {
        hasIntegration: !!store.klaviyo_integration,
        hasApiKey: !!store.klaviyo_integration?.apiKey,
        publicId: store.klaviyo_integration?.public_id
      });
      return NextResponse.json({ 
        error: 'Klaviyo API key not configured for this store' 
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

    // 5. Fetch from Klaviyo API
    const campaignMessage = await fetchKlaviyoCampaignMessage(
      messageId,
      store.klaviyo_integration.apiKey
    );

    // 6. Extract template HTML and metadata
    const template = campaignMessage.included?.find(item => item.type === 'template');
    const messageData = campaignMessage.data;

    // 7. Check if this is an SMS campaign and return appropriate data
    const channel = messageData?.attributes?.channel || 
                   messageData?.attributes?.definition?.channel ||
                   campaign?.groupings?.send_channel || 
                   'email';
    
    console.log('Campaign channel:', channel);
    console.log('Message attributes:', messageData?.attributes);
    console.log('Campaign from DB:', campaign);
    
    if (channel === 'sms') {
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

      console.log('SMS Body extracted:', body);
      console.log('SMS Media URL:', mediaUrl);
      console.log('Full campaign message data:', JSON.stringify(campaignMessage.data, null, 2));

      const responseData = {
        success: true,
        data: {
          type: 'sms',
          body: body,
          mediaUrl: mediaUrl,
          rawBody: body,
          messageId: messageId,
          campaignName: campaign?.campaign_name || messageData?.attributes?.name || '',
          fromPhone: messageData?.attributes?.definition?.content?.from_number || '',
          channel: 'sms'
        }
      };
      
      console.log('Returning SMS response:', responseData);
      return NextResponse.json(responseData);
    }
    
    // 8. Return formatted response for email
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
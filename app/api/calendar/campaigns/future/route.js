import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchScheduledCampaignsForStores } from '@/lib/klaviyo';

// GET - Fetch FUTURE campaigns from Klaviyo API
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeIds = searchParams.get('storeIds');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    // Get user's accessible stores
    const Store = (await import('@/models/Store')).default;
    const User = (await import('@/models/User')).default;
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all accessible stores
    const allStores = await Store.findByUser(session.user.id);
    let accessibleStores = allStores;
    
    // Filter stores if specific ones are selected
    if (storeIds && storeIds !== 'all') {
      const selectedKlaviyoIds = storeIds.split(',').filter(Boolean);
      accessibleStores = allStores.filter(store => 
        selectedKlaviyoIds.includes(store.klaviyo_integration?.public_id)
      );
    }

    // Only get stores with API keys
    const storesWithApiKeys = accessibleStores.filter(s => s.klaviyo_integration?.apiKey);
    
    if (storesWithApiKeys.length === 0) {
      return NextResponse.json({ 
        campaigns: [], 
        total: 0,
        message: 'No stores with Klaviyo API keys configured' 
      });
    }

    const now = new Date();
    const requestedStartDate = new Date(startDate);
    const requestedEndDate = new Date(endDate);
    
    // Use full date range to include past drafts
    const klaviyoStartDate = requestedStartDate;
    
    try {
      
      // Set timeout for API calls (20 seconds for sequential calls)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Klaviyo API timeout')), 20000)
      );
      
      const klaviyoPromise = fetchScheduledCampaignsForStores(
        storesWithApiKeys, 
        klaviyoStartDate, 
        requestedEndDate
      );
      
      const futureCampaigns = await Promise.race([klaviyoPromise, timeoutPromise]);
      
      // Format future campaigns for calendar display
      const formattedCampaigns = futureCampaigns.map(campaign => {
        
        // Extract channel - use _channel field added during fetch
        let channel = campaign._channel || 'email';
        
        // Map mobile_push to push-notification for consistency
        if (channel === 'mobile_push') {
          channel = 'push-notification';
        }
        
        // Use send_time as the primary date for calendar display (when campaign will be sent)
        // Fall back to scheduled_at (when it was scheduled) or send_strategy.datetime (planned send time for drafts)
        const displayDate = campaign.attributes?.send_time || 
                           campaign.attributes?.scheduled_at || 
                           campaign.attributes?.send_strategy?.datetime ||
                           campaign.attributes?.created_at;
        
        // Determine status based on campaign attributes and date
        const status = campaign.attributes?.status;
        const campaignDate = new Date(displayDate);
        const isPastDate = campaignDate < now;
        
        // Only mark as scheduled if it's actually in the future or currently sending
        // Past drafts should not be marked as scheduled
        const isScheduled = !isPastDate && (status === 'Draft' || status === 'Scheduled' || status === 'Sending' || status === 'Queued without Recipients');
        
        // Extract store info from campaign object
        const storePublicId = campaign.storeInfo?.publicId;
        const klaviyoPublicId = campaign.storeInfo?.klaviyoPublicId;
        
        // Extract from_email from campaign message if available
        // The included data is attached as _included from the fetchFutureCampaigns function
        const messageId = campaign.relationships?.['campaign-messages']?.data?.[0]?.id;
        const messageData = campaign._included?.find(item =>
          item.type === 'campaign-message' &&
          item.id === messageId
        );
        
        // Try multiple possible locations for from_email - matching what works in campaign-message route
        const fromEmail = messageData?.attributes?.definition?.content?.from_email ||
                         messageData?.attributes?.render_options?.from_email ||
                         messageData?.attributes?.from_email ||
                         campaign.attributes?.from_email ||
                         campaign.attributes?.from_address ||
                         '';
        
        const fromLabel = messageData?.attributes?.definition?.content?.from_label ||
                         messageData?.attributes?.render_options?.from_label ||
                         messageData?.attributes?.from_label ||
                         campaign.attributes?.from_label ||
                         '';
        
        return {
          id: `future-${campaign.id}`,
          campaignId: campaign.id,
          messageId: campaign.relationships?.['campaign-messages']?.data?.[0]?.id || null,
          name: campaign.attributes?.name || 'Unnamed Campaign',
          subject: campaign.attributes?.subject || '',
          date: displayDate,
          channel: channel,
          status: isPastDate ? 'cancelled' : (isScheduled ? 'scheduled' : status),
          isScheduled: isScheduled,
          performance: {
            recipients: 0,
            delivered: 0,
            openRate: 0,
            opens: 0,
            opensUnique: 0,
            clickRate: 0,
            clicks: 0,
            clicksUnique: 0,
            conversionRate: 0,
            conversions: 0,
            revenue: 0,
            averageOrderValue: 0,
            bounced: 0,
            failed: 0,
            unsubscribes: 0,
            spamComplaints: 0,
            bounceRate: 0,
            unsubscribeRate: 0,
            spamComplaintRate: 0,
            clickToOpenRate: 0,
            revenuePerRecipient: 0,
          },
          tags: campaign.attributes?.tags || [],
          storeIds: storePublicId ? [storePublicId] : [],
          storeName: campaign.storeInfo?.name || 'Unknown Store',
          klaviyo_public_id: klaviyoPublicId,
          fromAddress: fromEmail,
          fromLabel: fromLabel,
          audiences: campaign.attributes?.audiences || {
            included: [],
            excluded: []
          },
          // Add Klaviyo campaign fields for scheduled campaigns
          scheduled_at: campaign.attributes?.scheduled_at,
          send_time: campaign.attributes?.send_time,
          send_strategy: campaign.attributes?.send_strategy,
          send_options: campaign.attributes?.send_options,
          tracking_options: campaign.attributes?.tracking_options,
          estimated_recipients: campaign.attributes?.estimated_recipients,
          recipients: campaign.attributes?.estimated_recipients || 0 // For display
        };
      });


      return NextResponse.json({
        campaigns: formattedCampaigns,
        total: formattedCampaigns.length
      });
      
    } catch (error) {
      console.warn('Error fetching future campaigns:', error.message);
      
      // Return empty array instead of error to allow calendar to still show past campaigns
      return NextResponse.json({
        campaigns: [],
        total: 0,
        error: error.message
      });
    }

  } catch (error) {
    console.error('Future campaigns fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch future campaigns' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CampaignStat from '@/models/CampaignStat';
import connectToDatabase from '@/lib/mongoose';
import { fetchScheduledCampaignsForStores } from '@/lib/klaviyo';

// GET - Fetch campaign stats for calendar
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeIds = searchParams.get('storeIds'); // Changed to handle multiple stores
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');

    const options = {
      limit: 1000, // Get all campaigns for calendar view
      sort: { send_time: -1 },
    };

    // Get user's accessible Klaviyo IDs
    const User = (await import('@/models/User')).default;
    const Store = (await import('@/models/Store')).default;
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all accessible stores
    const allStores = await Store.findByUser(session.user.id);
    let accessibleStores = allStores;
    const accessibleKlaviyoIds = [];
    
    // Filter stores if specific ones are selected
    if (storeIds && storeIds !== 'all') {
      const selectedKlaviyoIds = storeIds.split(',').filter(Boolean);
      accessibleStores = allStores.filter(store => 
        selectedKlaviyoIds.includes(store.klaviyo_integration?.public_id)
      );
      accessibleKlaviyoIds.push(...selectedKlaviyoIds);
    } else {
      // Get all accessible Klaviyo IDs
      for (const store of accessibleStores) {
        if (store.klaviyo_integration?.public_id) {
          accessibleKlaviyoIds.push(store.klaviyo_integration.public_id);
        }
      }
    }

    if (accessibleKlaviyoIds.length === 0) {
      return NextResponse.json({ campaigns: [], total: 0 });
    }

    // Initialize arrays for both types of campaigns
    let historicalCampaigns = [];
    let futureCampaigns = [];
    const now = new Date();
    const requestedStartDate = new Date(startDate);
    const requestedEndDate = new Date(endDate);

    // PART 1: Fetch PAST campaigns from MongoDB (only if date range includes past)
    if (requestedStartDate <= now) {
      try {
        console.log('Fetching historical campaigns from MongoDB...');
        
        // Build the query for past campaigns
        const query = {
          klaviyo_public_id: { $in: accessibleKlaviyoIds }
        };

        // Add date filter for send_time (up to current date)
        if (startDate && endDate) {
          query.send_time = {
            $gte: new Date(startDate),
            $lte: now // Cap at current time for historical
          };
        }

        // Add channel filter
        if (channel && channel !== 'all') {
          query['groupings.send_channel'] = channel;
        }

        // Add search filter
        if (search) {
          query.$or = [
            { campaign_name: { $regex: search, $options: 'i' } },
            { subject_line: { $regex: search, $options: 'i' } }
          ];
        }

        // Execute the query for historical campaigns
        const campaignsFromDB = await CampaignStat.find(query)
          .sort({ send_time: -1 })
          .limit(1000)
          .lean();

        // Filter results to ensure they have send_time
        historicalCampaigns = campaignsFromDB.filter(campaign => campaign.send_time);
        console.log(`Found ${historicalCampaigns.length} historical campaigns from MongoDB`);
        
      } catch (error) {
        console.error('Error fetching historical campaigns:', error);
        // Continue without historical campaigns if MongoDB fails
      }
    } else {
      console.log('Skipping MongoDB (viewing only future dates)');
    }

    // PART 2: Fetch Draft/Scheduled campaigns from Klaviyo API (including past drafts)
    // Always fetch if we have stores with API keys, as drafts can be in the past
    if (accessibleStores.some(s => s.klaviyo_integration?.apiKey)) {
      try {
        console.log('Fetching draft/scheduled campaigns from Klaviyo API...');
        
        // Use the full requested date range to include past drafts
        const klaviyoStartDate = requestedStartDate;
        const klaviyoEndDate = requestedEndDate;
        
        // Increase timeout to account for 3 sequential API calls with delays
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Klaviyo API timeout')), 10000) // 10 second timeout
        );
        
        const klaviyoPromise = fetchScheduledCampaignsForStores(
          accessibleStores, 
          klaviyoStartDate, 
          klaviyoEndDate
        );
        
        const scheduledCampaigns = await Promise.race([klaviyoPromise, timeoutPromise]);
        futureCampaigns = scheduledCampaigns;
        console.log(`Found ${futureCampaigns.length} future campaigns from Klaviyo`);
        
      } catch (error) {
        console.warn('Error fetching future campaigns:', error.message);
        // Continue without future campaigns if API fails or times out
      }
    } else {
      console.log('Skipping Klaviyo API (viewing only past dates or no API keys)');
    }

    // Format historical campaigns for calendar display
    const formattedHistorical = historicalCampaigns.map(campaign => ({
      id: campaign._id,
      campaignId: campaign.groupings?.campaign_id,
      messageId: campaign.groupings?.campaign_message_id,
      name: campaign.campaign_name || 'Unnamed Campaign',
      subject: campaign.subject_line,
      date: campaign.send_time || campaign.scheduled_at || campaign.created_at,
      channel: campaign.groupings?.send_channel || 'email',
      performance: {
        recipients: campaign.statistics?.recipients || 0,
        delivered: campaign.statistics?.delivered || campaign.statistics?.recipients || 0,
        openRate: campaign.statistics?.open_rate || 0,
        opens: campaign.statistics?.opens || 0,
        opensUnique: campaign.statistics?.opens_unique || 0,
        clickRate: campaign.statistics?.click_rate || 0,
        clicks: campaign.statistics?.clicks || 0,
        clicksUnique: campaign.statistics?.clicks_unique || 0,
        conversionRate: campaign.statistics?.conversion_rate || 0,
        conversions: campaign.statistics?.conversions || 0,
        revenue: campaign.statistics?.conversion_value || 0,
        averageOrderValue: campaign.statistics?.average_order_value || 0,
        bounced: campaign.statistics?.bounced || 0,
        failed: campaign.statistics?.failed || 0,
        unsubscribes: campaign.statistics?.unsubscribes || 0,
        spamComplaints: campaign.statistics?.spam_complaints || 0,
        bounceRate: campaign.statistics?.bounce_rate || 0,
        unsubscribeRate: campaign.statistics?.unsubscribe_rate || 0,
        spamComplaintRate: campaign.statistics?.spam_complaint_rate || 0,
        clickToOpenRate: campaign.statistics?.click_to_open_rate || 0,
        revenuePerRecipient: campaign.statistics?.revenue_per_recipient || 0,
      },
      tags: campaign.tagNames || [],
      storeIds: campaign.store_public_ids || [],
      fromAddress: campaign.from_address,
      audiences: {
        included: campaign.included_audiences || [],
        excluded: campaign.excluded_audiences || []
      }
    }));

    // Format future campaigns for calendar display
    const formattedFuture = futureCampaigns.map(campaign => {
      // Extract channel - use _channel field added during fetch, or try to extract from messages
      let channel = campaign._channel || 'email';
      
      // Map mobile_push to push-notification for consistency
      if (channel === 'mobile_push') {
        channel = 'push-notification';
      }
      
      // Try to get channel from relationships data if not set
      if (!campaign._channel && campaign.relationships?.['campaign-messages']?.data?.[0]) {
        const messageData = campaign.relationships['campaign-messages'].data[0];
        if (messageData.attributes?.channel) {
          channel = messageData.attributes.channel;
        }
      }
      
      // Use scheduled_at as the primary date for calendar display
      const displayDate = campaign.attributes?.scheduled_at || 
                         campaign.attributes?.send_time || 
                         campaign.attributes?.created_at;
      
      // Determine status based on campaign attributes
      const status = campaign.attributes?.status;
      const isScheduled = status === 'Draft' || status === 'Scheduled' || 
                         Boolean(campaign.attributes?.send_time || campaign.attributes?.scheduled_at);
      
      return {
        id: `future-${campaign.id}`,
        campaignId: campaign.id,
        messageId: campaign.relationships?.['campaign-messages']?.data?.[0]?.id || null,
        name: campaign.attributes?.name || 'Unnamed Campaign',
        subject: campaign.attributes?.subject || '',
        date: displayDate,
        channel: channel,
        status: isScheduled ? 'scheduled' : status,
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
        storeIds: [campaign.storeInfo?.publicId] || [],
        storeName: campaign.storeInfo?.name || 'Unknown Store',
        klaviyo_public_id: campaign.storeInfo?.klaviyoPublicId, // Match historical format
        fromAddress: campaign.attributes?.from_email || '',
        audiences: {
          included: campaign.attributes?.audiences?.included || [],
          excluded: campaign.attributes?.audiences?.excluded || []
        }
      };
    });

    // Combine historical and future campaigns
    const allCampaigns = [...formattedHistorical, ...formattedFuture];
    
    // Apply additional filters to combined campaigns
    let finalCampaigns = allCampaigns;
    
    if (search) {
      finalCampaigns = allCampaigns.filter(campaign =>
        campaign.name?.toLowerCase().includes(search.toLowerCase()) ||
        campaign.subject?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (channel && channel !== 'all') {
      finalCampaigns = finalCampaigns.filter(campaign => campaign.channel === channel);
    }

    // Sort by date (most recent first)
    finalCampaigns.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('Campaign summary:', {
      historical: formattedHistorical.length,
      scheduled: formattedFuture.length,
      total: finalCampaigns.length,
      sampleHistorical: formattedHistorical.slice(0, 2).map(c => ({ id: c.id, name: c.name, klaviyo_public_id: c.klaviyo_public_id })),
      sampleFuture: formattedFuture.slice(0, 2).map(c => ({ id: c.id, name: c.name, klaviyo_public_id: c.klaviyo_public_id }))
    });

    return NextResponse.json({
      campaigns: finalCampaigns,
      total: finalCampaigns.length,
      historical: formattedHistorical.length,
      scheduled: formattedFuture.length
    });

  } catch (error) {
    console.error('Campaign stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign stats' },
      { status: 500 }
    );
  }
}
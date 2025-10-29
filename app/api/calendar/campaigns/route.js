import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import CampaignStat from '@/models/CampaignStat';
import connectToDatabase from '@/lib/mongoose';
import { fetchScheduledCampaignsForStores } from '@/lib/klaviyo';

// GET - Fetch campaign stats for calendar
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeIds = searchParams.get('storeIds'); // Changed to handle multiple stores
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // New parameter for status filtering

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
      // CRITICAL: storeIds parameter contains store_public_ids (not klaviyo_public_ids)
      // Must convert store_public_ids to klaviyo_public_ids for querying MongoDB
      const selectedStorePublicIds = storeIds.split(',').filter(Boolean);

      // Filter stores by store public_id
      accessibleStores = allStores.filter(store =>
        selectedStorePublicIds.includes(store.public_id)
      );

      // Extract klaviyo_public_ids from the filtered stores
      for (const store of accessibleStores) {
        if (store.klaviyo_integration?.public_id) {
          accessibleKlaviyoIds.push(store.klaviyo_integration.public_id);
        }
      }

      console.log('[Calendar API] Store ID conversion:', {
        receivedStoreIds: selectedStorePublicIds,
        matchedStores: accessibleStores.map(s => ({
          public_id: s.public_id,
          klaviyo_id: s.klaviyo_integration?.public_id
        })),
        klaviyoIdsForQuery: accessibleKlaviyoIds
      });

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
        
      } catch (error) {
        console.error('Error fetching historical campaigns:', error);
        // Continue without historical campaigns if MongoDB fails
      }
    }

    // PART 2: Fetch Draft/Scheduled campaigns from Klaviyo API (only for future/scheduled campaigns)
    // Only fetch future campaigns if date range includes future dates
    if (requestedEndDate > now && accessibleStores.some(s => s.klaviyo_integration?.apiKey || s.klaviyo_integration?.oauth_token)) {
      try {
        console.log('[Calendar API] Fetching future campaigns from Klaviyo API...');
        console.log('[Calendar API] Status filter:', status);
        console.log('[Calendar API] Accessible stores:', accessibleStores.map(s => ({
          name: s.name,
          public_id: s.public_id,
          klaviyo_id: s.klaviyo_integration?.public_id,
          has_auth: !!(s.klaviyo_integration?.apiKey || s.klaviyo_integration?.oauth_token)
        })));

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
          klaviyoEndDate,
        );

        const scheduledCampaigns = await Promise.race([klaviyoPromise, timeoutPromise]);
        console.log('[Calendar API] Received future campaigns:', scheduledCampaigns.length);
        console.log('[Calendar API] Sample campaign:', scheduledCampaigns[0] ? {
          id: scheduledCampaigns[0].id,
          name: scheduledCampaigns[0].attributes?.name,
          audiences: scheduledCampaigns[0].attributes?.audiences,
          status: scheduledCampaigns[0].attributes?.status
        } : 'No campaigns');

        futureCampaigns = scheduledCampaigns;

      } catch (error) {
        console.warn('Error fetching future campaigns:', error.message);
        // Continue without future campaigns if API fails or times out
      }
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
      // Keep statistics at the top level for CampaignsTable compatibility
      statistics: {
        recipients: campaign.statistics?.recipients || 0,
        recipients_delivered: campaign.statistics?.delivered || campaign.statistics?.recipients || 0,
        open_rate: campaign.statistics?.open_rate || 0,
        opens: campaign.statistics?.opens || 0,
        opens_unique: campaign.statistics?.opens_unique || 0,
        opensUnique: campaign.statistics?.opens_unique || 0, // Alias for compatibility
        click_rate: campaign.statistics?.click_rate || 0,
        clicks: campaign.statistics?.clicks || 0,
        clicks_unique: campaign.statistics?.clicks_unique || 0,
        clicksUnique: campaign.statistics?.clicks_unique || 0, // Alias for compatibility
        conversion_rate: campaign.statistics?.conversion_rate || 0,
        conversions: campaign.statistics?.conversions || 0,
        attributed_revenue: campaign.statistics?.conversion_value || 0,
        revenue: campaign.statistics?.conversion_value || 0, // Alias for compatibility
        average_order_value: campaign.statistics?.average_order_value || 0,
        bounced: campaign.statistics?.bounced || 0,
        failed: campaign.statistics?.failed || 0,
        unsubscribes: campaign.statistics?.unsubscribes || 0,
        spam_complaints: campaign.statistics?.spam_complaints || 0,
        bounce_rate: campaign.statistics?.bounce_rate || 0,
        unsubscribe_rate: campaign.statistics?.unsubscribe_rate || 0,
        spam_complaint_rate: campaign.statistics?.spam_complaint_rate || 0,
        click_to_open_rate: campaign.statistics?.click_to_open_rate || 0,
        revenue_per_recipient: campaign.statistics?.revenue_per_recipient || 0,
      },
      tags: campaign.tagNames || [],
      storeIds: campaign.store_public_ids || [],
      store_public_ids: campaign.store_public_ids || [],
      klaviyo_public_id: campaign.klaviyo_public_id,
      fromAddress: campaign.from_address,
      audiences: {
        included: campaign.included_audiences || [],
        excluded: campaign.excluded_audiences || []
      },
      // Preview URLs (for stored previews from Cloudflare R2)
      preview_image_html: campaign.preview_image_html || null,
      preview_image_url: campaign.preview_image_url || null,
      preview_sms_url: campaign.preview_sms_url || null,
      preview_generated_at: campaign.preview_generated_at || null,
      // Also include groupings for easier access to send_channel
      groupings: campaign.groupings
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

      // Use send_time as the primary date for calendar display (when campaign will actually send)
      const displayDate = campaign.attributes?.send_time ||
                         campaign.attributes?.scheduled_at ||
                         campaign.attributes?.created_at;

      // Determine status based on campaign attributes
      const status = campaign.attributes?.status;
      const isScheduled = status === 'Scheduled' || status === 'Sending' ||
                         Boolean(campaign.attributes?.send_time || campaign.attributes?.scheduled_at);

      console.log(`[Calendar API] Formatting campaign ${campaign.id}:`, {
        name: campaign.attributes?.name,
        audiences: campaign.attributes?.audiences,
        raw_campaign: campaign
      });

      return {
        id: `future-${campaign.id}`,
        campaignId: campaign.id,
        messageId: campaign.relationships?.['campaign-messages']?.data?.[0]?.id || null,
        name: campaign.attributes?.name || 'Unnamed Campaign',
        subject: campaign.attributes?.subject || '',
        date: displayDate,
        channel: channel,
        status: status,  // Pass through the actual status
        isScheduled: isScheduled,
        // Keep statistics at the top level for consistency with historical campaigns
        statistics: {
          recipients: campaign.attributes?.estimated_recipients || 0,
          recipients_delivered: 0,
          open_rate: 0,
          opens: 0,
          opens_unique: 0,
          opensUnique: 0,
          click_rate: 0,
          clicks: 0,
          clicks_unique: 0,
          clicksUnique: 0,
          conversion_rate: 0,
          conversions: 0,
          attributed_revenue: 0,
          revenue: 0,
          average_order_value: 0,
          bounced: 0,
          failed: 0,
          unsubscribes: 0,
          spam_complaints: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0,
          spam_complaint_rate: 0,
          click_to_open_rate: 0,
          revenue_per_recipient: 0,
        },
        tags: campaign.attributes?.tags || [],
        storeIds: [campaign.storeInfo?.publicId] || [],
        store_public_ids: [campaign.storeInfo?.publicId] || [],
        store_public_id: campaign.storeInfo?.publicId,  // Singular field for backward compatibility
        storeName: campaign.storeInfo?.name || 'Unknown Store',
        klaviyo_public_id: campaign.storeInfo?.klaviyoPublicId, // Match historical format
        fromAddress: campaign.attributes?.from_email || '',
        audiences: campaign.attributes?.audiences || campaign.audiences || {
          included: [],
          excluded: []
        },
        // Add Klaviyo campaign fields for scheduled campaigns
        scheduled_at: campaign.attributes?.scheduled_at,
        send_time: campaign.attributes?.send_time,
        send_strategy: campaign.attributes?.send_strategy,
        send_options: campaign.attributes?.send_options,
        tracking_options: campaign.attributes?.tracking_options,
        estimated_recipients: campaign.attributes?.estimated_recipients
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
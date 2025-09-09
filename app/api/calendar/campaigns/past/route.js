import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CampaignStat from '@/models/CampaignStat';
import connectToDatabase from '@/lib/mongoose';

// GET - Fetch PAST campaign stats from MongoDB
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
    const storeIds = searchParams.get('storeIds');
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');

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
      console.log('Received storeIds parameter:', storeIds);
      console.log('Split into selectedKlaviyoIds:', selectedKlaviyoIds);
      
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
    
    console.log('Accessible Klaviyo IDs for query:', accessibleKlaviyoIds);

    if (accessibleKlaviyoIds.length === 0) {
      return NextResponse.json({ campaigns: [], total: 0 });
    }

    const now = new Date();
    
    // Build the query for past campaigns
    const query = {
      klaviyo_public_id: { $in: accessibleKlaviyoIds }
    };

    // Add date filter for send_time (cap at current time for historical)
    if (startDate && endDate) {
      query.send_time = {
        $gte: new Date(startDate),
        $lte: new Date(endDate) < now ? new Date(endDate) : now
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

    console.log('MongoDB query:', JSON.stringify(query, null, 2));
    
    // Execute the query for historical campaigns
    const historicalCampaigns = await CampaignStat.find(query)
      .sort({ send_time: -1 })
      .limit(1000)
      .lean();

    console.log('Found historical campaigns:', historicalCampaigns.length);
    
    // Filter results to ensure they have send_time
    const filteredHistorical = historicalCampaigns.filter(campaign => campaign.send_time);
    
    console.log('Filtered campaigns with send_time:', filteredHistorical.length);

    // Format historical campaigns for calendar display
    const formattedCampaigns = filteredHistorical.map(campaign => {
      // Find the store for this campaign
      const store = accessibleStores.find(s => 
        s.klaviyo_integration?.public_id === campaign.klaviyo_public_id
      );
      
      return {
        id: campaign._id,
        campaignId: campaign.groupings?.campaign_id,
        messageId: campaign.groupings?.campaign_message_id,
        name: campaign.campaign_name || 'Unnamed Campaign',
        subject: campaign.subject_line,
        date: campaign.send_time || campaign.scheduled_at || campaign.created_at,
        channel: campaign.groupings?.send_channel || 'email',
        status: 'sent', // Past campaigns from MongoDB are always sent
        isScheduled: false, // Past campaigns are not scheduled
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
        storeIds: campaign.store_public_ids && campaign.store_public_ids.length > 0 
          ? campaign.store_public_ids 
          : (store?.public_id ? [store.public_id] : []),
        storeName: store?.name || 'Unknown Store',
        klaviyo_public_id: campaign.klaviyo_public_id,
        fromAddress: campaign.from_address,
        audiences: {
          included: campaign.included_audiences || [],
          excluded: campaign.excluded_audiences || []
        }
      };
    });

    console.log('Past campaigns summary:', {
      total: formattedCampaigns.length,
      dateRange: { startDate, endDate },
      stores: accessibleKlaviyoIds.length
    });

    return NextResponse.json({
      campaigns: formattedCampaigns,
      total: formattedCampaigns.length
    });

  } catch (error) {
    console.error('Past campaign stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past campaign stats' },
      { status: 500 }
    );
  }
}
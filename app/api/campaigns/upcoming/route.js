import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/lib/mongoose';
import { fetchScheduledCampaignsForStores } from '@/lib/klaviyo';

// GET - Fetch upcoming scheduled campaigns from Klaviyo API only
export async function GET(request) {
  try {
    await connectToDatabase();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's accessible stores with API keys
    const User = (await import('@/models/User')).default;
    const Store = (await import('@/models/Store')).default;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all accessible stores with Klaviyo integration
    const allStores = await Store.findByUser(session.user.id);
    const accessibleStores = allStores.filter(store =>
      store.klaviyo_integration?.apiKey || store.klaviyo_integration?.oauth_token
    );

    if (accessibleStores.length === 0) {
      return NextResponse.json({ campaigns: [], total: 0 });
    }

    try {
      // Fetch only scheduled/sending campaigns from Klaviyo API
      const scheduledCampaigns = await fetchScheduledCampaignsForStores(
        accessibleStores,
        null, // No start date - get all scheduled
        null, // No end date - get all scheduled
        'scheduled' // Only scheduled status campaigns
      );

      // Filter campaigns to only future ones with proper status
      const filteredCampaigns = scheduledCampaigns.filter(campaign => {
        // Use send_time first, then scheduled_at for comparison
        const campaignDate = new Date(
          campaign.attributes?.send_time ||
          campaign.attributes?.scheduled_at ||
          campaign.date ||
          campaign.send_time ||
          campaign.scheduled_at
        );

        const isFuture = campaignDate > new Date();

        // Check if campaign has scheduled, sending, or queued without recipients status
        const status = campaign.attributes?.status || campaign.status;
        const isScheduledStatus = status === 'Scheduled' ||
                                 status === 'Sending' 

        return isFuture && isScheduledStatus;
      });

      // Format campaigns for display
      const formattedCampaigns = filteredCampaigns.map(campaign => ({
        id: `upcoming-${campaign.id}`,
        campaignId: campaign.id,
        messageId: campaign.relationships?.['campaign-messages']?.data?.[0]?.id ||
                   campaign.messageId ||
                   campaign.message_id ||
                   null,
        name: campaign.attributes?.name || campaign.name || 'Unnamed Campaign',
        date: campaign.attributes?.send_time ||
              campaign.attributes?.scheduled_at ||
              campaign.date ||
              campaign.send_time ||
              campaign.scheduled_at,
        channel: campaign._channel || campaign.channel || 'email',
        status: campaign.attributes?.status || campaign.status || 'Scheduled',
        isScheduled: true,
        // Store info
        storeName: campaign.storeInfo?.name || 'Unknown Store',
        klaviyo_public_id: campaign.storeInfo?.klaviyoPublicId,
        store_public_ids: campaign.store_public_ids || [campaign.storeInfo?.publicId],
        // Klaviyo campaign fields
        scheduled_at: campaign.attributes?.scheduled_at || campaign.scheduled_at,
        send_time: campaign.attributes?.send_time || campaign.send_time,
        estimated_recipients: campaign.attributes?.estimated_recipients || 0,
        audiences: campaign.attributes?.audiences || campaign.audiences || {
          included: [],
          excluded: []
        }
      }));

      return NextResponse.json({
        campaigns: formattedCampaigns,
        total: formattedCampaigns.length
      });

    } catch (error) {
      console.warn('Error fetching upcoming campaigns:', error.message);
      return NextResponse.json({ campaigns: [], total: 0 });
    }

  } catch (error) {
    console.error('Upcoming campaigns fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming campaigns' },
      { status: 500 }
    );
  }
}
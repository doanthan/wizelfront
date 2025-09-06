import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CampaignStat from '@/models/CampaignStat';
import connectToDatabase from '@/lib/mongoose';

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
    const storeId = searchParams.get('storeId');
    const channel = searchParams.get('channel');
    const search = searchParams.get('search');

    const options = {
      limit: 1000, // Get all campaigns for calendar view
      sort: { send_time: -1 },
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      options.dateRange = {
        from: new Date(startDate),
        to: new Date(endDate)
      };
    }

    // Build query
    let query = search || '';
    
    const { results } = await CampaignStat.searchWithAccessControl(
      session.user.id,
      query,
      options
    );

    // Filter by store if specified
    let filteredResults = results;
    if (storeId && storeId !== 'all') {
      filteredResults = results.filter(campaign => 
        campaign.store_public_ids?.includes(storeId)
      );
    }

    // Filter by channel if specified
    if (channel && channel !== 'all') {
      filteredResults = filteredResults.filter(campaign => 
        campaign.groupings?.send_channel === channel
      );
    }

    // Format campaigns for calendar display
    const formattedCampaigns = filteredResults.map(campaign => ({
      id: campaign._id,
      name: campaign.campaign_name || 'Unnamed Campaign',
      subject: campaign.subject_line,
      date: campaign.send_time || campaign.scheduled_at || campaign.created_at,
      channel: campaign.groupings?.send_channel || 'email',
      performance: {
        recipients: campaign.statistics?.recipients || 0,
        openRate: campaign.statistics?.open_rate || 0,
        clickRate: campaign.statistics?.click_rate || 0,
        conversionRate: campaign.statistics?.conversion_rate || 0,
        revenue: campaign.statistics?.conversion_value || 0,
      },
      tags: campaign.tagNames || [],
      storeIds: campaign.store_public_ids || [],
      fromAddress: campaign.from_address,
      audiences: {
        included: campaign.included_audiences || [],
        excluded: campaign.excluded_audiences || []
      }
    }));

    return NextResponse.json({
      campaigns: formattedCampaigns,
      total: filteredResults.length
    });

  } catch (error) {
    console.error('Campaign stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign stats' },
      { status: 500 }
    );
  }
}
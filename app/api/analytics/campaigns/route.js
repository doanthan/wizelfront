import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountIds = searchParams.get('accountIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeIds = searchParams.get('storeIds')?.split(',').filter(Boolean) || [];

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Start date and end date are required' 
      }, { status: 400 });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    
    // Build query
    const query = {
      send_time: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Add account filtering if specific accounts selected
    if (accountIds.length > 0 && !accountIds.includes('all')) {
      query.klaviyo_public_id = { $in: accountIds };
    }

    // Add store filtering if provided
    if (storeIds.length > 0 && !storeIds.includes('all')) {
      query.store_public_ids = { $in: storeIds };
    }

    console.log('Campaign query:', JSON.stringify(query, null, 2));
    console.log('Account IDs:', accountIds);
    console.log('Store IDs:', storeIds);

    // First, let's check what campaigns exist in the database
    const sampleCampaigns = await db
      .collection('campaignstats')
      .find({})
      .limit(5)
      .toArray();
    
    console.log('Sample campaigns in DB:', sampleCampaigns.map(c => ({
      klaviyo_public_id: c.klaviyo_public_id,
      send_time: c.send_time,
      campaign_name: c.campaign_name
    })));

    // Fetch campaigns from database - using correct collection name
    const campaigns = await db
      .collection('campaignstats')  // MongoDB collection names are typically lowercase
      .find(query)
      .sort({ send_time: -1 })
      .toArray();
    
    console.log(`Found ${campaigns.length} campaigns matching query`);

    // Transform campaigns to match frontend expectations
    const transformedCampaigns = campaigns.map(campaign => ({
      id: campaign.groupings?.campaign_message_id || campaign._id.toString(),
      campaignId: campaign.groupings?.campaign_id,
      name: campaign.campaign_name || 'Untitled Campaign',
      subject: campaign.subject_line || '',
      type: campaign.groupings?.send_channel || 'email',
      status: campaign.send_time ? 'sent' : 'draft',
      
      // Core metrics from statistics
      recipients: campaign.statistics?.recipients || 0,
      delivered: campaign.statistics?.delivered || 0,
      
      // Opens
      opensUnique: campaign.statistics?.opens_unique || 0,
      opensTotal: campaign.statistics?.opens || 0,
      openRate: (campaign.statistics?.open_rate || 0) * 100, // Convert to percentage
      
      // Clicks
      clicksUnique: campaign.statistics?.clicks_unique || 0,
      clicksTotal: campaign.statistics?.clicks || 0,
      clickRate: (campaign.statistics?.click_rate || 0) * 100,
      clickToOpenRate: (campaign.statistics?.click_to_open_rate || 0) * 100,
      
      // Conversions and Revenue
      conversions: campaign.statistics?.conversions || 0,
      conversionUniques: campaign.statistics?.conversion_uniques || 0,
      conversionRate: (campaign.statistics?.conversion_rate || 0) * 100,
      revenue: campaign.statistics?.conversion_value || 0,
      averageOrderValue: campaign.statistics?.average_order_value || 0,
      revenuePerRecipient: campaign.statistics?.revenue_per_recipient || 0,
      
      // Delivery metrics
      bounced: campaign.statistics?.bounced || 0,
      bounceRate: (campaign.statistics?.bounce_rate || 0) * 100,
      failed: campaign.statistics?.failed || 0,
      failedRate: (campaign.statistics?.failed_rate || 0) * 100,
      deliveryRate: (campaign.statistics?.delivery_rate || 0) * 100,
      
      // Unsubscribes
      unsubscribes: campaign.statistics?.unsubscribes || 0,
      unsubscribeRate: (campaign.statistics?.unsubscribe_rate || 0) * 100,
      
      // Spam complaints
      spamComplaints: campaign.statistics?.spam_complaints || 0,
      spamComplaintRate: (campaign.statistics?.spam_complaint_rate || 0) * 100,
      
      // Metadata
      sentAt: campaign.send_time || campaign.scheduled_at || new Date(),
      createdAt: campaign.created_at || new Date(),
      updatedAt: campaign.updated_at || new Date(),
      
      // Account and store info
      accountId: campaign.klaviyo_public_id,
      storeIds: campaign.store_public_ids || [],
      
      // Audiences
      includedAudiences: campaign.included_audiences || [],
      excludedAudiences: campaign.excluded_audiences || [],
      
      // Tags
      tagIds: campaign.tagIds || [],
      tagNames: campaign.tagNames || [],
      
      // Additional fields
      fromAddress: campaign.from_address || '',
      fromLabel: campaign.from_label || ''
    }));

    // Calculate aggregate statistics
    const aggregateStats = {
      totalCampaigns: transformedCampaigns.length,
      totalRecipients: transformedCampaigns.reduce((sum, c) => sum + c.recipients, 0),
      totalDelivered: transformedCampaigns.reduce((sum, c) => sum + c.delivered, 0),
      totalOpens: transformedCampaigns.reduce((sum, c) => sum + c.opensUnique, 0),
      totalClicks: transformedCampaigns.reduce((sum, c) => sum + c.clicksUnique, 0),
      totalConversions: transformedCampaigns.reduce((sum, c) => sum + c.conversionUniques, 0),
      totalRevenue: transformedCampaigns.reduce((sum, c) => sum + c.revenue, 0),
      
      // Calculate weighted averages for rates
      averageOpenRate: 0,
      averageClickRate: 0,
      averageConversionRate: 0,
      averageRevenuePerRecipient: 0
    };

    // Calculate weighted averages
    if (aggregateStats.totalDelivered > 0) {
      aggregateStats.averageOpenRate = (aggregateStats.totalOpens / aggregateStats.totalDelivered) * 100;
      aggregateStats.averageClickRate = (aggregateStats.totalClicks / aggregateStats.totalDelivered) * 100;
      aggregateStats.averageConversionRate = (aggregateStats.totalConversions / aggregateStats.totalDelivered) * 100;
      aggregateStats.averageRevenuePerRecipient = aggregateStats.totalRevenue / aggregateStats.totalDelivered;
    }

    // Group campaigns by date for chart data
    const chartData = {};
    transformedCampaigns.forEach(campaign => {
      const date = new Date(campaign.sentAt).toISOString().split('T')[0];
      if (!chartData[date]) {
        chartData[date] = {
          date,
          campaigns: 0,
          recipients: 0,
          delivered: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        };
      }
      
      chartData[date].campaigns++;
      chartData[date].recipients += campaign.recipients;
      chartData[date].delivered += campaign.delivered;
      chartData[date].opens += campaign.opensUnique;
      chartData[date].clicks += campaign.clicksUnique;
      chartData[date].conversions += campaign.conversionUniques;
      chartData[date].revenue += campaign.revenue;
    });

    // Convert chart data to array and calculate rates
    const chartDataArray = Object.values(chartData).map(day => ({
      ...day,
      openRate: day.delivered > 0 ? (day.opens / day.delivered) * 100 : 0,
      clickRate: day.delivered > 0 ? (day.clicks / day.delivered) * 100 : 0,
      conversionRate: day.delivered > 0 ? (day.conversions / day.delivered) * 100 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json({
      campaigns: transformedCampaigns,
      aggregateStats,
      chartData: chartDataArray,
      totalCount: transformedCampaigns.length,
      dateRange: { startDate, endDate },
      filters: { accountIds, storeIds }
    });

  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch campaign analytics',
      details: error.message 
    }, { status: 500 });
  }
}
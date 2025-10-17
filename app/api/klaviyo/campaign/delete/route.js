import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function DELETE(request) {
  try {
    const { campaignId, storeId } = await request.json();

    if (!campaignId || !storeId) {
      return NextResponse.json(
        { error: 'Campaign ID and Store ID are required' },
        { status: 400 }
      );
    }

    // Verify user session
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find store with the given klaviyo_public_id
    const store = await Store.findOne({
      'klaviyo_integration.public_id': storeId
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Build OAuth-first authentication options
    const authOpts = buildKlaviyoAuthOptions(store);

    try {
      // First, we need to get the campaign to check its status
      const campaignResponse = await klaviyoRequest(
        'GET',
        `campaigns/${campaignId}`,
        authOpts
      );

      if (!campaignResponse?.data) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }

      const campaign = campaignResponse.data;
      const status = campaign.attributes?.status;

      // Check if campaign is scheduled
      if (status !== 'Scheduled' && status !== 'Draft') {
        return NextResponse.json(
          { error: 'Only scheduled or draft campaigns can be deleted' },
          { status: 400 }
        );
      }

      // For scheduled campaigns, we need to cancel them first
      if (status === 'Scheduled') {
        // Create a cancel job to revert the campaign back to draft
        const cancelResponse = await klaviyoRequest(
          'POST',
          'campaign-send-jobs',
          {
            ...authOpts,
            payload: {
              data: {
                type: 'campaign-send-job',
                attributes: {
                  campaign_id: campaignId
                }
              }
            }
          }
        );

        if (cancelResponse?.data?.id) {
          // Update the job to cancel it
          await klaviyoRequest(
            'PATCH',
            `campaign-send-jobs/${cancelResponse.data.id}`,
            {
              ...authOpts,
              payload: {
                data: {
                  type: 'campaign-send-job',
                  id: cancelResponse.data.id,
                  attributes: {
                    status: 'cancelled'
                  }
                }
              }
            }
          );
        }
      }

      // Now delete the campaign
      // Note: Klaviyo API doesn't have a direct DELETE endpoint for campaigns
      // The best we can do is archive it or cancel it
      // Let's update the campaign to archived state
      const archiveResponse = await klaviyoRequest(
        'PATCH',
        `campaigns/${campaignId}`,
        {
          ...authOpts,
          payload: {
            data: {
              type: 'campaign',
              id: campaignId,
              attributes: {
                archived: true,
                name: `[DELETED] ${campaign.attributes.name}`
              }
            }
          }
        }
      );

      console.log('Campaign archived successfully:', campaignId);

      return NextResponse.json({
        success: true,
        message: 'Campaign deleted successfully',
        data: {
          campaignId,
          archived: true
        }
      });

    } catch (apiError) {
      console.error('Klaviyo API error:', apiError);

      // If it's a 404, the campaign might not exist
      if (apiError.message?.includes('404')) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: apiError.message || 'Failed to delete campaign' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Campaign delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
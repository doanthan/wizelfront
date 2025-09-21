import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function PATCH(request) {
  try {
    const { campaignId, storeId, updates } = await request.json();

    if (!campaignId || !storeId || !updates) {
      return NextResponse.json(
        { error: 'Campaign ID, Store ID, and updates are required' },
        { status: 400 }
      );
    }

    // Verify user session
    const session = await getServerSession(authOptions);
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
      // Build the update payload based on the updates provided
      const updatePayload = {
        data: {
          type: 'campaign',
          id: campaignId,
          attributes: {}
        }
      };

      // Update campaign name
      if (updates.name) {
        updatePayload.data.attributes.name = updates.name;
      }

      // Update audiences
      if (updates.included_audiences || updates.excluded_audiences) {
        updatePayload.data.attributes.audiences = {
          included: updates.included_audiences || [],
          excluded: updates.excluded_audiences || []
        };
      }

      // Update send options
      if (updates.use_smart_sending !== undefined || updates.ignore_unsubscribes !== undefined) {
        updatePayload.data.attributes.send_options = {
          use_smart_sending: updates.use_smart_sending !== false,
          ignore_unsubscribes: updates.ignore_unsubscribes || false
        };
      }

      // Update tracking options
      if (updates.is_tracking_opens !== undefined ||
          updates.is_tracking_clicks !== undefined ||
          updates.is_add_utm !== undefined) {

        updatePayload.data.attributes.tracking_options = {
          is_tracking_opens: updates.is_tracking_opens !== false,
          is_tracking_clicks: updates.is_tracking_clicks !== false,
          is_add_utm: updates.is_add_utm || false,
          utm_params: []
        };

        // Add UTM parameters if UTM tracking is enabled
        if (updates.is_add_utm) {
          const utmParams = [];

          if (updates.utm_source) {
            utmParams.push({
              name: 'utm_source',
              value: updates.utm_source
            });
          }

          if (updates.utm_medium) {
            utmParams.push({
              name: 'utm_medium',
              value: updates.utm_medium
            });
          }

          if (updates.utm_campaign) {
            utmParams.push({
              name: 'utm_campaign',
              value: updates.utm_campaign
            });
          }

          updatePayload.data.attributes.tracking_options.utm_params = utmParams;
        }
      }

      // Update send strategy (schedule time)
      if (updates.send_time) {
        updatePayload.data.attributes.send_strategy = {
          method: 'static',
          options_static: {
            datetime: updates.send_time,
            is_local: updates.is_local || false,
            send_past_recipients_immediately: false
          }
        };
      }

      console.log('Updating campaign with payload:', JSON.stringify(updatePayload, null, 2));

      // Send the update request to Klaviyo
      const response = await klaviyoRequest(
        'PATCH',
        `campaigns/${campaignId}`,
        {
          ...authOpts,
          payload: updatePayload
        }
      );

      console.log('Campaign updated successfully:', campaignId);

      // If schedule time was updated and campaign was scheduled, we might need to reschedule
      if (updates.send_time && response?.data?.attributes?.status === 'Scheduled') {
        // Cancel the existing schedule
        const cancelJobResponse = await klaviyoRequest(
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

        if (cancelJobResponse?.data?.id) {
          // Cancel the job
          await klaviyoRequest(
            'PATCH',
            `campaign-send-jobs/${cancelJobResponse.data.id}`,
            {
              ...authOpts,
              payload: {
                data: {
                  type: 'campaign-send-job',
                  id: cancelJobResponse.data.id,
                  attributes: {
                    status: 'cancelled'
                  }
                }
              }
            }
          );

          // Create a new send job with the updated schedule
          await klaviyoRequest(
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
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Campaign updated successfully',
        data: response?.data || { campaignId }
      });

    } catch (apiError) {
      console.error('Klaviyo API error:', apiError);

      // Handle specific API errors
      if (apiError.message?.includes('404')) {
        return NextResponse.json(
          { error: 'Campaign not found' },
          { status: 404 }
        );
      }

      if (apiError.message?.includes('400')) {
        return NextResponse.json(
          { error: 'Invalid update parameters. Please check your inputs.' },
          { status: 400 }
        );
      }

      if (apiError.message?.includes('409')) {
        return NextResponse.json(
          { error: 'Campaign cannot be updated in its current state' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: apiError.message || 'Failed to update campaign' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Campaign update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
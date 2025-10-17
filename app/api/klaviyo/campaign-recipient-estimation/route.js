import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import connectToDatabase from '@/lib/mongoose';
import Store from '@/models/Store';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let campaignId = searchParams.get('campaignId');
    const storeId = searchParams.get('storeId');

    if (!campaignId || !storeId) {
      return NextResponse.json(
        { error: 'Campaign ID and Store ID are required' },
        { status: 400 }
      );
    }

    // Strip any prefixes like 'upcoming-' or 'future-' from the campaign ID
    if (campaignId.startsWith('upcoming-')) {
      campaignId = campaignId.replace('upcoming-', '');
    } else if (campaignId.startsWith('future-')) {
      campaignId = campaignId.replace('future-', '');
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
      // First try to get existing estimation
      const estimation = await klaviyoRequest(
        'GET',
        `campaign-recipient-estimations/${campaignId}`,
        authOpts
      );

      // Extract the recipient count from the response
      let recipientCount = 0;
      if (estimation?.data?.attributes?.estimated_recipient_count !== undefined) {
        recipientCount = estimation.data.attributes.estimated_recipient_count;
      }

      return NextResponse.json({
        success: true,
        data: {
          estimated_recipient_count: recipientCount,
          campaign_id: campaignId,
          status: 'complete',
          last_updated: new Date().toISOString()
        }
      });
    } catch (apiError) {
      // If estimation doesn't exist or is out of date, trigger a job
      console.log('Estimation not found or out of date, triggering job...');

      // For scheduled campaigns that haven't been sent yet, recipient estimation might not be available
      if (apiError.message?.includes('404') || apiError.message?.includes('No results')) {
        console.log('Campaign recipient estimation not available for this campaign');

        // Return 0 for campaigns where estimation isn't available
        return NextResponse.json({
          success: true,
          data: {
            estimated_recipient_count: 0,
            campaign_id: campaignId,
            status: 'not_available',
            message: 'Recipient estimation not available for this campaign',
            last_updated: new Date().toISOString()
          }
        });
      }

      try {
        // Trigger a new recipient estimation job
        const jobResponse = await klaviyoRequest(
          'POST',
          'campaign-recipient-estimation-jobs',
          {
            ...authOpts,
            payload: {
              data: {
                type: 'campaign-recipient-estimation-job',
                attributes: {
                  id: campaignId
                }
              }
            }
          }
        );

        const jobId = jobResponse?.data?.id;

        if (!jobId) {
          throw new Error('Failed to get job ID from response');
        }

        // Poll the job status up to 5 times with 2 second intervals
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            // Check job status
            const jobStatus = await klaviyoRequest(
              'GET',
              `campaign-recipient-estimation-jobs/${jobId}`,
              authOpts
            );

            const status = jobStatus?.data?.attributes?.status;

            if (status === 'complete') {
              // Job complete, try to get the estimation
              const finalEstimation = await klaviyoRequest(
                'GET',
                `campaign-recipient-estimations/${campaignId}`,
                authOpts
              );

              let recipientCount = 0;
              if (finalEstimation?.data?.attributes?.estimated_recipient_count !== undefined) {
                recipientCount = finalEstimation.data.attributes.estimated_recipient_count;
              }

              return NextResponse.json({
                success: true,
                data: {
                  estimated_recipient_count: recipientCount,
                  campaign_id: campaignId,
                  status: 'complete',
                  last_updated: new Date().toISOString()
                }
              });
            } else if (status === 'failed' || status === 'cancelled') {
              throw new Error(`Job ${status}`);
            }

            attempts++;
          } catch (pollError) {
            console.error('Error polling job status:', pollError);

            // If it's a 404, the job might not exist or be invalid
            if (pollError.message?.includes('404') || pollError.message?.includes('No results')) {
              console.log('Job not found or invalid, stopping polling');
              break; // Exit the polling loop
            }

            attempts++;
          }
        }

        // If we've exhausted attempts, return pending status
        return NextResponse.json({
          success: true,
          data: {
            estimated_recipient_count: 0,
            campaign_id: campaignId,
            status: 'processing',
            job_id: jobId,
            last_updated: new Date().toISOString(),
            note: 'Estimation is being calculated, please try again in a few seconds'
          }
        });

      } catch (jobError) {
        console.error('Error with estimation job:', jobError);
        // Return 0 as fallback
        return NextResponse.json({
          success: true,
          data: {
            estimated_recipient_count: 0,
            campaign_id: campaignId,
            status: 'error',
            error: 'Could not retrieve estimation',
            last_updated: new Date().toISOString()
          }
        });
      }
    }
  } catch (error) {
    console.error('Campaign recipient estimation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
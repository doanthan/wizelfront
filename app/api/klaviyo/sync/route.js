import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import KlaviyoSync from '@/models/KlaviyoSync';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';

// GET - Get sync status for a Klaviyo account
export async function GET(request) {
    try {
        await connectToDatabase();
        
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const klaviyoId = searchParams.get('klaviyoId');
        const storeId = searchParams.get('storeId');

        if (!klaviyoId && !storeId) {
            return NextResponse.json(
                { error: 'Either klaviyoId or storeId is required' },
                { status: 400 }
            );
        }

        let syncRecord;

        if (klaviyoId) {
            // Get sync record by Klaviyo ID
            syncRecord = await KlaviyoSync.findOne({ klaviyo_public_id: klaviyoId });
        } else {
            // Get sync record by store ID
            const store = await Store.findOne({
                $or: [
                    { _id: storeId },
                    { public_id: storeId }
                ]
            });

            if (!store) {
                return NextResponse.json({ error: 'Store not found' }, { status: 404 });
            }

            if (!store.klaviyo_integration?.public_id) {
                return NextResponse.json(
                    { error: 'Store does not have Klaviyo integration' },
                    { status: 400 }
                );
            }

            syncRecord = await KlaviyoSync.findOne({
                klaviyo_public_id: store.klaviyo_integration.public_id
            });
        }

        if (!syncRecord) {
            return NextResponse.json(
                { error: 'Sync record not found' },
                { status: 404 }
            );
        }

        // Check if sync is needed
        const needsSync = {
            campaigns: syncRecord.needsSync('campaigns', 24),
            segments: syncRecord.needsSync('segments', 24),
            flows: syncRecord.needsSync('flows', 48),
            forms: syncRecord.needsSync('forms', 48),
            overall: syncRecord.needsSync('all', 24)
        };

        // Get date ranges for next sync
        const nextSyncDateRanges = syncRecord.getSyncDateRanges('all');

        return NextResponse.json({
            syncRecord: {
                klaviyo_public_id: syncRecord.klaviyo_public_id,
                store_public_ids: syncRecord.store_public_ids,
                is_updating_dashboard: syncRecord.is_updating_dashboard,
                campaign_values_last_update: syncRecord.campaign_values_last_update,
                segment_series_last_update: syncRecord.segment_series_last_update,
                flow_series_last_update: syncRecord.flow_series_last_update,
                form_series_last_update: syncRecord.form_series_last_update,
                last_full_sync: syncRecord.last_full_sync,
                status: syncRecord.status,
                total_campaigns_synced: syncRecord.total_campaigns_synced,
                total_segments_synced: syncRecord.total_segments_synced,
                total_flows_synced: syncRecord.total_flows_synced,
                total_forms_synced: syncRecord.total_forms_synced,
                account_info: syncRecord.account_info,
                needsSync,
                nextSyncDateRanges
            }
        });

    } catch (error) {
        console.error('Error fetching sync status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sync status' },
            { status: 500 }
        );
    }
}

// POST - Start a sync operation
export async function POST(request) {
    try {
        await connectToDatabase();
        
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { klaviyoId, storeId, syncType = 'all' } = body;

        if (!klaviyoId && !storeId) {
            return NextResponse.json(
                { error: 'Either klaviyoId or storeId is required' },
                { status: 400 }
            );
        }

        let syncRecord;
        let store;

        if (storeId) {
            // Get store and its Klaviyo ID
            store = await Store.findOne({
                $or: [
                    { _id: storeId },
                    { public_id: storeId }
                ]
            });

            if (!store) {
                return NextResponse.json({ error: 'Store not found' }, { status: 404 });
            }

            if (!store.klaviyo_integration?.public_id) {
                return NextResponse.json(
                    { error: 'Store does not have Klaviyo integration' },
                    { status: 400 }
                );
            }

            // Find or create sync record
            syncRecord = await KlaviyoSync.findOrCreateByKlaviyoId(
                store.klaviyo_integration.public_id,
                {
                    store_id: store._id,
                    store_public_id: store.public_id
                }
            );
        } else {
            // Get sync record by Klaviyo ID
            syncRecord = await KlaviyoSync.findOne({ klaviyo_public_id: klaviyoId });
            
            if (!syncRecord) {
                return NextResponse.json(
                    { error: 'Sync record not found. Please provide a storeId to create one.' },
                    { status: 404 }
                );
            }
        }

        // Check if already syncing
        if (syncRecord.is_updating_dashboard) {
            return NextResponse.json(
                { 
                    message: 'Sync already in progress',
                    syncRecord: {
                        klaviyo_public_id: syncRecord.klaviyo_public_id,
                        is_updating_dashboard: true,
                        status: syncRecord.status
                    }
                },
                { status: 202 }
            );
        }

        // Get the date ranges for incremental sync
        const dateRanges = syncRecord.getSyncDateRanges(syncType);
        
        // Start the sync (returns the from dates)
        const syncFromDates = await syncRecord.startSync(syncType);

        // Here you would trigger your actual sync process
        // For example, calling your report server or background job
        if (process.env.REPORT_SERVER_URL) {
            try {
                const syncPayload = {
                    klaviyo_public_id: syncRecord.klaviyo_public_id,
                    store_public_ids: syncRecord.store_public_ids,
                    sync_type: syncType,
                    date_ranges: dateRanges,
                    // Include the from dates for the sync
                    sync_from: {
                        campaigns: syncFromDates.campaigns?.toISOString(),
                        segments: syncFromDates.segments?.toISOString(),
                        flows: syncFromDates.flows?.toISOString(),
                        forms: syncFromDates.forms?.toISOString()
                    }
                };

                console.log('Starting incremental sync with date ranges:', dateRanges);

                const reportResponse = await fetch(
                    `${process.env.REPORT_SERVER_URL}/api/v1/reports/sync`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(syncPayload)
                    }
                );

                if (!reportResponse.ok) {
                    console.error('Report server sync failed:', await reportResponse.text());
                    await syncRecord.logError('report_server', 'Failed to trigger sync on report server');
                }
            } catch (error) {
                console.error('Error calling report server:', error);
                await syncRecord.logError('report_server', error.message);
            }
        }

        return NextResponse.json({
            message: 'Sync started successfully',
            syncRecord: {
                klaviyo_public_id: syncRecord.klaviyo_public_id,
                store_public_ids: syncRecord.store_public_ids,
                is_updating_dashboard: syncRecord.is_updating_dashboard,
                status: syncRecord.status,
                syncType
            }
        });

    } catch (error) {
        console.error('Error starting sync:', error);
        return NextResponse.json(
            { error: 'Failed to start sync' },
            { status: 500 }
        );
    }
}

// PUT - Update sync status (called by report server or background job)
export async function PUT(request) {
    try {
        await connectToDatabase();
        
        // This endpoint might be called by your report server
        // You might want to use a different auth method here
        const body = await request.json();
        const { 
            klaviyoId, 
            syncType = 'all', 
            status,
            stats,
            error 
        } = body;

        if (!klaviyoId) {
            return NextResponse.json(
                { error: 'klaviyoId is required' },
                { status: 400 }
            );
        }

        const syncRecord = await KlaviyoSync.findOne({ 
            klaviyo_public_id: klaviyoId 
        });

        if (!syncRecord) {
            return NextResponse.json(
                { error: 'Sync record not found' },
                { status: 404 }
            );
        }

        if (status === 'completed') {
            // Complete the sync with stats
            await syncRecord.completeSync(syncType, stats || {});
        } else if (status === 'error' && error) {
            // Log error
            await syncRecord.logError(error.type || 'unknown', error.message || 'Unknown error');
        } else if (status === 'in_progress') {
            // Update as still in progress
            syncRecord.is_updating_dashboard = true;
            await syncRecord.save();
        }

        return NextResponse.json({
            message: 'Sync status updated',
            syncRecord: {
                klaviyo_public_id: syncRecord.klaviyo_public_id,
                is_updating_dashboard: syncRecord.is_updating_dashboard,
                status: syncRecord.status
            }
        });

    } catch (error) {
        console.error('Error updating sync status:', error);
        return NextResponse.json(
            { error: 'Failed to update sync status' },
            { status: 500 }
        );
    }
}
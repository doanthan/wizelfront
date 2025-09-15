import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StoreStatSync from '@/models/StoreStatSync';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';

// GET - Get sync status for a store or all stores
export async function GET(request) {
    try {
        await connectToDatabase();
        
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const klaviyoId = searchParams.get('klaviyoId');
        const syncType = searchParams.get('syncType'); // Check specific sync type
        const hoursOld = parseInt(searchParams.get('hoursOld') || '24');

        if (storeId) {
            // Get sync status for specific store
            const store = await Store.findOne({
                $or: [
                    { _id: storeId },
                    { public_id: storeId }
                ]
            });

            if (!store || !store.klaviyo_integration?.public_id) {
                return NextResponse.json({ error: 'Store not found or no Klaviyo integration' }, { status: 404 });
            }

            const syncRecord = await StoreStatSync.getSyncStatus(store.klaviyo_integration.public_id);
            
            return NextResponse.json({
                store: {
                    public_id: store.public_id,
                    name: store.name,
                    klaviyo_public_id: store.klaviyo_integration.public_id
                },
                syncStatus: syncRecord
            });

        } else if (klaviyoId) {
            // Get sync status for specific Klaviyo account
            const syncRecord = await StoreStatSync.getSyncStatus(klaviyoId);
            
            return NextResponse.json({
                klaviyo_public_id: klaviyoId,
                syncStatus: syncRecord
            });

        } else if (syncType) {
            // Get all stores that need syncing for a specific type
            const storesNeedingSync = await StoreStatSync.getStoresNeedingSync(syncType, hoursOld);
            
            return NextResponse.json({
                syncType,
                hoursOld,
                storesNeedingSync: storesNeedingSync.map(record => ({
                    klaviyo_public_id: record.klaviyo_public_id,
                    lastSync: record[syncType],
                    lastError: record.lastError
                }))
            });

        } else {
            // Get all sync records
            const allSyncRecords = await StoreStatSync.find({}).sort({ updatedAt: -1 }).limit(50);
            
            return NextResponse.json({
                syncRecords: allSyncRecords
            });
        }

    } catch (error) {
        console.error('Error fetching store stat sync status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sync status' },
            { status: 500 }
        );
    }
}

// POST - Update sync status for a store
export async function POST(request) {
    try {
        await connectToDatabase();
        
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { 
            storeId, 
            klaviyoId, 
            syncType, 
            status = 'completed', 
            error = null,
            timestamp = new Date()
        } = body;

        let klaviyoPublicId = klaviyoId;

        // Get klaviyoId from storeId if not provided
        if (!klaviyoPublicId && storeId) {
            const store = await Store.findOne({
                $or: [
                    { _id: storeId },
                    { public_id: storeId }
                ]
            });

            if (!store || !store.klaviyo_integration?.public_id) {
                return NextResponse.json(
                    { error: 'Store not found or no Klaviyo integration' }, 
                    { status: 404 }
                );
            }

            klaviyoPublicId = store.klaviyo_integration.public_id;
        }

        if (!klaviyoPublicId) {
            return NextResponse.json(
                { error: 'Either storeId or klaviyoId is required' },
                { status: 400 }
            );
        }

        if (status === 'error' && error) {
            // Record error
            const syncRecord = await StoreStatSync.recordError(klaviyoPublicId, error);
            
            return NextResponse.json({
                message: 'Error recorded',
                klaviyo_public_id: klaviyoPublicId,
                syncRecord
            });

        } else if (status === 'completed' && syncType) {
            // Update successful sync
            if (syncType === 'all') {
                // Full sync
                const syncRecord = await StoreStatSync.updateFullSync(klaviyoPublicId, new Date(timestamp));
                
                return NextResponse.json({
                    message: 'Full sync status updated',
                    klaviyo_public_id: klaviyoPublicId,
                    syncRecord
                });
                
            } else {
                // Individual sync type
                const validSyncTypes = ['campaignStats', 'flowStats', 'segmentStats', 'formStats', 'orderStats'];
                
                if (!validSyncTypes.includes(syncType)) {
                    return NextResponse.json(
                        { error: `Invalid syncType. Must be one of: ${validSyncTypes.join(', ')}` },
                        { status: 400 }
                    );
                }

                const syncRecord = await StoreStatSync.updateSyncStatus(
                    klaviyoPublicId, 
                    syncType, 
                    new Date(timestamp)
                );
                
                return NextResponse.json({
                    message: `${syncType} sync status updated`,
                    klaviyo_public_id: klaviyoPublicId,
                    syncRecord
                });
            }
        } else {
            return NextResponse.json(
                { error: 'Invalid status or missing required fields' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Error updating store stat sync:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update sync status' },
            { status: 500 }
        );
    }
}

// DELETE - Reset sync status for a store (useful for testing)
export async function DELETE(request) {
    try {
        await connectToDatabase();
        
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const klaviyoId = searchParams.get('klaviyoId');

        let klaviyoPublicId = klaviyoId;

        if (!klaviyoPublicId && storeId) {
            const store = await Store.findOne({
                $or: [
                    { _id: storeId },
                    { public_id: storeId }
                ]
            });

            if (!store || !store.klaviyo_integration?.public_id) {
                return NextResponse.json(
                    { error: 'Store not found or no Klaviyo integration' }, 
                    { status: 404 }
                );
            }

            klaviyoPublicId = store.klaviyo_integration.public_id;
        }

        if (!klaviyoPublicId) {
            return NextResponse.json(
                { error: 'Either storeId or klaviyoId is required' },
                { status: 400 }
            );
        }

        // Delete the sync record
        const deleted = await StoreStatSync.findOneAndDelete({ 
            klaviyo_public_id: klaviyoPublicId 
        });

        return NextResponse.json({
            message: 'Sync record deleted',
            klaviyo_public_id: klaviyoPublicId,
            deleted: !!deleted
        });

    } catch (error) {
        console.error('Error deleting store stat sync:', error);
        return NextResponse.json(
            { error: 'Failed to delete sync record' },
            { status: 500 }
        );
    }
}
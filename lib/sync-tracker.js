/**
 * Sync Tracker Utility
 * Helper functions for tracking sync completion times in StoreStatSync
 */

import StoreStatSync from '@/models/StoreStatSync';

/**
 * Mark a specific sync type as completed
 * @param {string} klaviyoPublicId - The Klaviyo public ID
 * @param {string} syncType - One of: 'campaignStats', 'flowStats', 'segmentStats', 'formStats', 'orderStats'
 * @param {Date} timestamp - Optional timestamp, defaults to now
 */
export async function markSyncCompleted(klaviyoPublicId, syncType, timestamp = new Date()) {
  try {
    const result = await StoreStatSync.updateSyncStatus(klaviyoPublicId, syncType, timestamp);
    console.log(`✅ ${syncType} sync completed for ${klaviyoPublicId} at ${timestamp.toISOString()}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to mark ${syncType} sync completed for ${klaviyoPublicId}:`, error.message);
    throw error;
  }
}

/**
 * Mark a full sync as completed (all sync types)
 * @param {string} klaviyoPublicId - The Klaviyo public ID
 * @param {Date} timestamp - Optional timestamp, defaults to now
 */
export async function markFullSyncCompleted(klaviyoPublicId, timestamp = new Date()) {
  try {
    const result = await StoreStatSync.updateFullSync(klaviyoPublicId, timestamp);
    console.log(`✅ Full sync completed for ${klaviyoPublicId} at ${timestamp.toISOString()}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to mark full sync completed for ${klaviyoPublicId}:`, error.message);
    throw error;
  }
}

/**
 * Record a sync error
 * @param {string} klaviyoPublicId - The Klaviyo public ID
 * @param {string} errorMessage - The error message
 */
export async function recordSyncError(klaviyoPublicId, errorMessage) {
  try {
    const result = await StoreStatSync.recordError(klaviyoPublicId, errorMessage);
    console.error(`❌ Sync error recorded for ${klaviyoPublicId}: ${errorMessage}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to record sync error for ${klaviyoPublicId}:`, error.message);
    throw error;
  }
}

/**
 * Check if a sync is needed for a store
 * @param {string} klaviyoPublicId - The Klaviyo public ID
 * @param {string} syncType - One of: 'campaignStats', 'flowStats', 'segmentStats', 'formStats', 'orderStats'
 * @param {number} hoursOld - How many hours old before sync is needed
 * @returns {boolean} - True if sync is needed
 */
export async function isSyncNeeded(klaviyoPublicId, syncType, hoursOld = 24) {
  try {
    const syncRecord = await StoreStatSync.getSyncStatus(klaviyoPublicId);
    
    if (!syncRecord || !syncRecord[syncType]) {
      return true; // Never synced
    }
    
    const lastSyncTime = new Date(syncRecord[syncType]);
    const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));
    
    return lastSyncTime < cutoffTime;
  } catch (error) {
    console.error(`Error checking if sync is needed for ${klaviyoPublicId}:`, error.message);
    return true; // Assume sync is needed on error
  }
}

/**
 * Get sync status for multiple stores
 * @param {string[]} klaviyoPublicIds - Array of Klaviyo public IDs
 * @returns {Object} - Map of klaviyoPublicId to sync status
 */
export async function getBatchSyncStatus(klaviyoPublicIds) {
  try {
    const syncRecords = await StoreStatSync.find({
      klaviyo_public_id: { $in: klaviyoPublicIds }
    });
    
    const statusMap = {};
    syncRecords.forEach(record => {
      statusMap[record.klaviyo_public_id] = {
        campaignStats: record.campaignStats,
        flowStats: record.flowStats,
        segmentStats: record.segmentStats,
        formStats: record.formStats,
        orderStats: record.orderStats,
        lastFullSync: record.lastFullSync,
        lastError: record.lastError
      };
    });
    
    return statusMap;
  } catch (error) {
    console.error('Error getting batch sync status:', error.message);
    return {};
  }
}

/**
 * Example usage in your sync process
 */
export class SyncTracker {
  constructor(klaviyoPublicId) {
    this.klaviyoPublicId = klaviyoPublicId;
    this.startTime = new Date();
  }
  
  async startSync(syncType) {
    console.log(`🔄 Starting ${syncType} sync for ${this.klaviyoPublicId}...`);
    this.currentSyncType = syncType;
    this.syncStartTime = new Date();
  }
  
  async completeSync(syncType = this.currentSyncType) {
    if (!syncType) {
      throw new Error('Sync type must be specified');
    }
    
    const duration = Date.now() - this.syncStartTime.getTime();
    console.log(`⏱️  ${syncType} sync took ${duration}ms`);
    
    return await markSyncCompleted(this.klaviyoPublicId, syncType);
  }
  
  async completeFullSync() {
    const duration = Date.now() - this.startTime.getTime();
    console.log(`⏱️  Full sync took ${duration}ms`);
    
    return await markFullSyncCompleted(this.klaviyoPublicId);
  }
  
  async recordError(errorMessage) {
    return await recordSyncError(this.klaviyoPublicId, errorMessage);
  }
}

// Usage examples:

/*
// Simple usage:
await markSyncCompleted('klaviyo_public_123', 'campaignStats');
await markFullSyncCompleted('klaviyo_public_123');

// With error handling:
try {
  // Your sync logic here...
  await markSyncCompleted(klaviyoId, 'campaignStats');
} catch (error) {
  await recordSyncError(klaviyoId, error.message);
  throw error;
}

// Using the SyncTracker class:
const tracker = new SyncTracker('klaviyo_public_123');

try {
  await tracker.startSync('campaignStats');
  // Your campaign sync logic...
  await tracker.completeSync();
  
  await tracker.startSync('flowStats');
  // Your flow sync logic...
  await tracker.completeSync();
  
  // Mark full sync as completed
  await tracker.completeFullSync();
} catch (error) {
  await tracker.recordError(error.message);
  throw error;
}

// Check if sync is needed:
if (await isSyncNeeded(klaviyoId, 'campaignStats', 24)) {
  // Perform sync...
}
*/
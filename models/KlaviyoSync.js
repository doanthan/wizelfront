import mongoose from "mongoose";

const KlaviyoSyncSchema = new mongoose.Schema({
    // Klaviyo account public ID (primary identifier)
    klaviyo_public_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    // Array of store public IDs that use this Klaviyo account
    store_public_ids: [{
        type: String,
        trim: true
    }],
    
    // Array of store ObjectIds for reference
    store_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    }],
    
    // Sync status flags
    is_updating_dashboard: {
        type: Boolean,
        default: false
    },
    
    // Last update timestamps for different data types
    // Default to Jan 1, 2014 for initial full sync
    campaign_values_last_update: {
        type: Date,
        default: () => new Date('2014-01-01T00:00:00.000Z')
    },
    
    segment_series_last_update: {
        type: Date,
        default: () => new Date('2014-01-01T00:00:00.000Z')
    },
    
    flow_series_last_update: {
        type: Date,
        default: () => new Date('2014-01-01T00:00:00.000Z')
    },
    
    form_series_last_update: {
        type: Date,
        default: () => new Date('2014-01-01T00:00:00.000Z')
    },
    
    // Additional sync metadata
    last_full_sync: {
        type: Date,
        default: null
    },
    
    sync_errors: [{
        error_type: String,
        error_message: String,
        occurred_at: Date,
        resolved: {
            type: Boolean,
            default: false
        }
    }],
    

    // Account information (cached from Klaviyo)
    account_info: {
        test_account: { type: Boolean, default: false },
        organization_name: String,
        timezone: String,
        currency: String,
        industry: String,
        locale: String
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ["active", "paused", "error", "inactive"],
        default: "active"
    },
    
    created_at: {
        type: Date,
        default: Date.now
    },
    
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
KlaviyoSyncSchema.pre("save", function(next) {
    this.updated_at = Date.now();
    next();
});

// Static method to find or create sync record for a Klaviyo account
KlaviyoSyncSchema.statics.findOrCreateByKlaviyoId = async function(klaviyoPublicId, storeData = {}) {
    let syncRecord = await this.findOne({ klaviyo_public_id: klaviyoPublicId });
    
    if (!syncRecord) {
        syncRecord = new this({
            klaviyo_public_id: klaviyoPublicId,
            store_public_ids: storeData.store_public_id ? [storeData.store_public_id] : [],
            store_ids: storeData.store_id ? [storeData.store_id] : []
        });
        await syncRecord.save();
    } else {
        // Add store to existing record if not already present
        let updated = false;
        
        if (storeData.store_public_id && !syncRecord.store_public_ids.includes(storeData.store_public_id)) {
            syncRecord.store_public_ids.push(storeData.store_public_id);
            updated = true;
        }
        
        if (storeData.store_id && !syncRecord.store_ids.some(id => id.toString() === storeData.store_id.toString())) {
            syncRecord.store_ids.push(storeData.store_id);
            updated = true;
        }
        
        if (updated) {
            await syncRecord.save();
        }
    }
    
    return syncRecord;
};

// Method to start a sync operation
// Returns the date range for the sync (from last sync to now)
KlaviyoSyncSchema.methods.startSync = async function(syncType = 'all') {
    this.is_updating_dashboard = true;
    
    // Store the current timestamps before updating (for incremental sync)
    const syncFromDates = {
        campaigns: this.campaign_values_last_update,
        segments: this.segment_series_last_update,
        flows: this.flow_series_last_update,
        forms: this.form_series_last_update
    };
    
    // Don't update timestamps here - wait for successful completion
    // Just mark as syncing
    await this.save();
    
    return syncFromDates;
};

// Method to complete a sync operation
// Updates timestamps to current time after successful sync
KlaviyoSyncSchema.methods.completeSync = async function(syncType = 'all', stats = {}, syncEndTime = null) {
    this.is_updating_dashboard = false;
    
    // Use provided sync end time or current time
    const now = syncEndTime || new Date();
    
    // Update timestamps for successful sync
    // This becomes the starting point for the next incremental sync
    if (syncType === 'all' || syncType === 'campaigns') {
        this.campaign_values_last_update = now;
    }
    if (syncType === 'all' || syncType === 'segments') {
        this.segment_series_last_update = now;
    }
    if (syncType === 'all' || syncType === 'flows') {
        this.flow_series_last_update = now;
    }
    if (syncType === 'all' || syncType === 'forms') {
        this.form_series_last_update = now;
    }
    
    if (syncType === 'all') {
        this.last_full_sync = now;
    }
    
    // Update statistics if provided
    if (stats.campaigns !== undefined) {
        this.total_campaigns_synced = stats.campaigns;
    }
    if (stats.segments !== undefined) {
        this.total_segments_synced = stats.segments;
    }
    if (stats.flows !== undefined) {
        this.total_flows_synced = stats.flows;
    }
    if (stats.forms !== undefined) {
        this.total_forms_synced = stats.forms;
    }
    
    return this.save();
};

// Method to log sync error
KlaviyoSyncSchema.methods.logError = async function(errorType, errorMessage) {
    this.sync_errors.push({
        error_type: errorType,
        error_message: errorMessage,
        occurred_at: new Date(),
        resolved: false
    });
    
    this.status = 'error';
    this.is_updating_dashboard = false;
    
    return this.save();
};

// Method to clear resolved errors
KlaviyoSyncSchema.methods.clearResolvedErrors = async function() {
    this.sync_errors = this.sync_errors.filter(error => !error.resolved);
    
    if (this.sync_errors.length === 0) {
        this.status = 'active';
    }
    
    return this.save();
};

// Method to add a store to this Klaviyo account
KlaviyoSyncSchema.methods.addStore = async function(storePublicId, storeId) {
    let updated = false;
    
    if (storePublicId && !this.store_public_ids.includes(storePublicId)) {
        this.store_public_ids.push(storePublicId);
        updated = true;
    }
    
    if (storeId && !this.store_ids.some(id => id.toString() === storeId.toString())) {
        this.store_ids.push(storeId);
        updated = true;
    }
    
    if (updated) {
        return this.save();
    }
    
    return this;
};

// Method to remove a store from this Klaviyo account
KlaviyoSyncSchema.methods.removeStore = async function(storePublicId, storeId) {
    let updated = false;
    
    if (storePublicId) {
        const index = this.store_public_ids.indexOf(storePublicId);
        if (index > -1) {
            this.store_public_ids.splice(index, 1);
            updated = true;
        }
    }
    
    if (storeId) {
        this.store_ids = this.store_ids.filter(id => id.toString() !== storeId.toString());
        updated = true;
    }
    
    if (updated) {
        return this.save();
    }
    
    return this;
};

// Method to get sync date ranges for incremental sync
KlaviyoSyncSchema.methods.getSyncDateRanges = function(syncType = 'all') {
    const now = new Date();
    const ranges = {};
    
    if (syncType === 'campaigns' || syncType === 'all') {
        ranges.campaigns = {
            from: this.campaign_values_last_update,
            to: now
        };
    }
    
    if (syncType === 'segments' || syncType === 'all') {
        ranges.segments = {
            from: this.segment_series_last_update,
            to: now
        };
    }
    
    if (syncType === 'flows' || syncType === 'all') {
        ranges.flows = {
            from: this.flow_series_last_update,
            to: now
        };
    }
    
    if (syncType === 'forms' || syncType === 'all') {
        ranges.forms = {
            from: this.form_series_last_update,
            to: now
        };
    }
    
    return ranges;
};

// Method to check if sync is needed
KlaviyoSyncSchema.methods.needsSync = function(syncType = 'all', hoursThreshold = 24) {
    const now = new Date();
    const threshold = hoursThreshold * 60 * 60 * 1000; // Convert hours to milliseconds
    
    if (syncType === 'campaigns' || syncType === 'all') {
        if (!this.campaign_values_last_update || 
            (now - this.campaign_values_last_update) > threshold) {
            return true;
        }
    }
    
    if (syncType === 'segments' || syncType === 'all') {
        if (!this.segment_series_last_update || 
            (now - this.segment_series_last_update) > threshold) {
            return true;
        }
    }
    
    if (syncType === 'flows' || syncType === 'all') {
        if (!this.flow_series_last_update || 
            (now - this.flow_series_last_update) > threshold) {
            return true;
        }
    }
    
    if (syncType === 'forms' || syncType === 'all') {
        if (!this.form_series_last_update || 
            (now - this.form_series_last_update) > threshold) {
            return true;
        }
    }
    
    return false;
};

// Indexes for better query performance
// klaviyo_public_id already has a unique index from the field definition
KlaviyoSyncSchema.index({ store_public_ids: 1 });
KlaviyoSyncSchema.index({ store_ids: 1 });
KlaviyoSyncSchema.index({ status: 1 });
KlaviyoSyncSchema.index({ is_updating_dashboard: 1 });

// Prevent model recompilation in development
let KlaviyoSync;

if (mongoose.models && mongoose.models.KlaviyoSync) {
    KlaviyoSync = mongoose.models.KlaviyoSync;
} else {
    KlaviyoSync = mongoose.model("KlaviyoSync", KlaviyoSyncSchema);
}

export default KlaviyoSync;
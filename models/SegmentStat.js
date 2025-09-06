import mongoose from "mongoose";
import User from "./User";
import Store from "./Store";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

const SegmentStatSchema = new mongoose.Schema({
    // Klaviyo public ID as primary identifier
    klaviyo_public_id: { type: String, required: true, index: true },
    
    // Store public IDs that use this Klaviyo account
    store_public_ids: {
        type: [String],
        default: []
    },
    
    // Segment identifiers and metadata
    segment_id: { type: String, required: true, index: true },
    segment_name: { type: String },
    segment_definition: { type: String },
    segment_type: { type: String }, // "dynamic", "static", etc.
    segment_status: { type: String, default: "active" }, // "active", "paused", "archived"
    segment_archived: { type: Boolean, default: false },
    segment_created: { type: Date },
    segment_updated: { type: Date },
    
    // Additional metadata
    is_active: { type: Boolean, default: true },
    is_processing: { type: Boolean, default: false },
    member_count_last_update: { type: Date },
    
    // Tags
    tagIds: [{ type: String }],
    tagNames: [{ type: String }],
    
    // Timestamps
    last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for uniqueness
SegmentStatSchema.index({ klaviyo_public_id: 1, segment_id: 1 }, { unique: true });

// Additional indexes for efficient queries
SegmentStatSchema.index({ klaviyo_public_id: 1 });
SegmentStatSchema.index({ store_public_ids: 1 });
SegmentStatSchema.index({ segment_id: 1 });
SegmentStatSchema.index({ store_public_ids: 1, last_updated: -1 });
SegmentStatSchema.index({ segment_archived: 1 });
SegmentStatSchema.index({ segment_status: 1 });

// Static method for multi-account search with access control
SegmentStatSchema.statics.searchWithAccessControl = async function (userId, query, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { createdAt: -1 },
        dateRange = null,
        requiredPermission = PERMISSIONS.VIEW_ANALYTICS // Default to analytics view permission
    } = options;

    // Get user's accessible stores with permission check
    const user = await User.findById(userId);
    if (!user) return { results: [], total: 0 };

    // Filter stores based on granular permissions
    const accessibleStores = [];
    for (const storePermission of user.store_permissions || []) {
        if (hasPermission(storePermission.permissions_v2, requiredPermission)) {
            accessibleStores.push(storePermission);
        }
    }

    if (accessibleStores.length === 0) {
        return { results: [], total: 0 };
    }

    // Get Klaviyo public IDs from accessible stores
    const accessibleKlaviyoIds = [];
    for (const storePermission of accessibleStores) {
        if (storePermission.store_id) {
            const store = await Store.findById(storePermission.store_id);
            if (store && store.integrations?.klaviyo?.account?.id) {
                accessibleKlaviyoIds.push(store.integrations.klaviyo.account.id);
            }
        }
    }

    if (accessibleKlaviyoIds.length === 0) {
        return { results: [], total: 0 };
    }

    // Build search query
    const searchQuery = {
        klaviyo_public_id: { $in: accessibleKlaviyoIds }
    };

    // Add text search
    if (query && query.text && query.text.trim()) {
        const text = query.text;
        searchQuery.$or = [
            { segment_name: { $regex: text, $options: 'i' } },
            { segment_type: { $regex: text, $options: 'i' } },
            { segment_definition: { $regex: text, $options: 'i' } }
        ];
    }

    // Add date range filter
    if (dateRange && dateRange.from && dateRange.to) {
        searchQuery.createdAt = {
            $gte: new Date(dateRange.from),
            $lte: new Date(dateRange.to)
        };
    }

    // Execute search with pagination
    const results = await this.find(searchQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await this.countDocuments(searchQuery);

    return { results, total };
};

// Static method for bulk upsert segment stats
SegmentStatSchema.statics.bulkUpsertSegmentStats = async function (segmentStats) {
    if (!Array.isArray(segmentStats) || segmentStats.length === 0) {
        return { modified: 0, upserted: 0 };
    }

    const operations = [];
    
    for (const stat of segmentStats) {
        // Remove statistics data if present (it goes to ClickHouse)
        const { statistics, date_times, ...cleanStat } = stat;
        
        // Ensure required fields
        if (!cleanStat.klaviyo_public_id || !cleanStat.segment_id) {
            continue;
        }

        operations.push({
            updateOne: {
                filter: {
                    klaviyo_public_id: cleanStat.klaviyo_public_id,
                    segment_id: cleanStat.segment_id
                },
                update: {
                    $set: {
                        ...cleanStat,
                        last_updated: new Date(),
                        updatedAt: new Date()
                    }
                },
                upsert: true
            }
        });
    }

    if (operations.length === 0) {
        return { modified: 0, upserted: 0 };
    }

    try {
        const result = await this.bulkWrite(operations, { ordered: false });
        return {
            modified: result.modifiedCount || 0,
            upserted: result.upsertedCount || 0
        };
    } catch (error) {
        console.error('Error in bulkUpsertSegmentStats:', error);
        throw error;
    }
};

// Instance method to check if segment is accessible by user
SegmentStatSchema.methods.isAccessibleByUser = async function (userId, requiredPermission = PERMISSIONS.VIEW_ANALYTICS) {
    const user = await User.findById(userId);
    if (!user) return false;

    // Check if user has access to any store that uses this Klaviyo account
    for (const storePermission of user.store_permissions || []) {
        if (hasPermission(storePermission.permissions_v2, requiredPermission)) {
            const store = await Store.findById(storePermission.store_id);
            if (store && store.integrations?.klaviyo?.account?.id === this.klaviyo_public_id) {
                return true;
            }
        }
    }

    return false;
};

// Pre-save middleware to update timestamps
SegmentStatSchema.pre('save', function (next) {
    this.last_updated = new Date();
    next();
});

const SegmentStat = mongoose.models.SegmentStat || mongoose.model('SegmentStat', SegmentStatSchema);

export default SegmentStat;
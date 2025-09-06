import mongoose from "mongoose";
import User from "./User";
import Store from "./Store";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";



const FlowStatSchema = new mongoose.Schema({
    klaviyo_public_id: { type: String, required: true },
    
    // Store public IDs that use this Klaviyo account
    store_public_ids: {
        type: [String],
        default: []
    },
    
    flow_id: { type: String, required: true, index: true },
    flow_message_id: { type: String, required: true, index: true }, // Add flow_message_id field
    flow_name: { type: String },
    flow_message_name: { type: String },
    flow_message_subject: { type: String },
    flow_status: { type: String },
    flow_archived: { type: Boolean, default: false },
    flow_created: { type: Date },
    flow_updated: { type: Date },
    flow_trigger_type: { type: String },
    send_channel: { type: String, required: true },
    tagIds: [{ type: String }],
    tagNames: [{ type: String }],
    last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for efficient queries
FlowStatSchema.index({ klaviyo_public_id: 1, flow_id: 1, flow_message_id: 1, send_channel: 1 }, { unique: true });

// Index for date-based queries
FlowStatSchema.index({ date_times: 1 });
FlowStatSchema.index({ klaviyo_public_id: 1, flow_id: 1 });
FlowStatSchema.index({ store_public_ids: 1 });
FlowStatSchema.index({ store_public_ids: 1, last_updated: -1 });

// Static method for multi-account search with access control
FlowStatSchema.statics.searchWithAccessControl = async function (userId, query, options = {}) {
    const {
        limit = 50,
        skip = 0,
        sort = { created_at: -1 },
        dateRange = null,
        requiredPermission = PERMISSIONS.VIEW_ANALYTICS // Default to analytics view permission
    } = options

    // Get user's accessible stores with permission check
    const user = await User.findById(userId)
    if (!user) return { results: [], total: 0 }

    // Filter stores based on granular permissions
    const accessibleStores = user.stores.filter(storeAccess =>
        hasPermission(storeAccess, requiredPermission)
    )

    if (accessibleStores.length === 0) {
        return { results: [], total: 0 }
    }

    // Get Klaviyo public IDs from accessible stores
    const accessibleKlaviyoIds = []
    for (const storeAccess of accessibleStores) {
        if (storeAccess.store_id) {
            const store = await Store.findById(storeAccess.store_id)
            if (store?.klaviyo_integration?.public_id) {
                accessibleKlaviyoIds.push(store.klaviyo_integration.public_id)
            }
        }
    }

    if (accessibleKlaviyoIds.length === 0) {
        return { results: [], total: 0 }
    }

    // Build search query
    const searchQuery = {
        klaviyo_public_id: { $in: accessibleKlaviyoIds }
    }

    // Add text search
    if (query && query.trim()) {
        searchQuery.$or = [
            { flow_name: { $regex: query, $options: "i" } },
            { flow_trigger_type: { $regex: query, $options: "i" } },
            { klaviyo_public_id: { $regex: query, $options: "i" } }
        ]
    }

    // Add date range filter
    if (dateRange) {
        searchQuery.created_at = {
            $gte: dateRange.from,
            $lte: dateRange.to
        }
    }

    // Execute search with pagination
    const [results, total] = await Promise.all([
        this.find(searchQuery)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(searchQuery)
    ])

    return { results, total }
}



// Static method to bulk upsert flow stats
FlowStatSchema.statics.bulkUpsertFlowStats = async function (flowStats) {
    const operations = flowStats.map(stat => ({
        updateOne: {
            filter: {
                klaviyo_public_id: stat.klaviyo_public_id,
                flow_id: stat.flow_id,
                flow_message_id: stat.flow_message_id,
                send_channel: stat.send_channel
            },
            update: { $set: stat },
            upsert: true
        }
    }));

    const result = await this.bulkWrite(operations);
    return result;
};

export default mongoose.models.FlowStat || mongoose.model("FlowStat", FlowStatSchema);


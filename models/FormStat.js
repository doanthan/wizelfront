import mongoose from "mongoose";
import User from "./User";
import Store from "./Store";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";

const FormStatSchema = new mongoose.Schema({
    // Klaviyo public ID as primary identifier
    klaviyo_public_id: { type: String, required: true, index: true },
    
    // Store public IDs that use this Klaviyo account
    store_public_ids: {
        type: [String],
        default: []
    },
    
    // Form identifiers and metadata
    form_id: { type: String, required: true, index: true },
    form_name: { type: String },
    form_type: { type: String }, // "popup", "embedded", "flyout", "fullscreen"
    form_status: { type: String, default: "active" }, // "active", "paused", "draft", "archived"
    form_placement: { type: String }, // where the form appears on site
    form_archived: { type: Boolean, default: false },
    form_created: { type: Date },
    form_updated: { type: Date },
    
    // Form settings
    form_version: { type: Number, default: 1 },
    display_type: { type: String },
    target_device: { type: String }, // "desktop", "mobile", "all"
    success_message: { type: String },
    submit_button_text: { type: String },
    
    // Tags
    tagIds: [{ type: String }],
    tagNames: [{ type: String }],
    
    // Timestamps
    last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for uniqueness
FormStatSchema.index({ klaviyo_public_id: 1, form_id: 1 }, { unique: true });

// Additional indexes for efficient queries
FormStatSchema.index({ klaviyo_public_id: 1 });
FormStatSchema.index({ store_public_ids: 1 });
FormStatSchema.index({ form_id: 1 });
FormStatSchema.index({ store_public_ids: 1, last_updated: -1 });
FormStatSchema.index({ form_archived: 1 });
FormStatSchema.index({ form_status: 1 });
FormStatSchema.index({ form_type: 1 });

// Static method for multi-account search with access control
FormStatSchema.statics.searchWithAccessControl = async function (userId, query, options = {}) {
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
            { form_name: { $regex: text, $options: 'i' } },
            { form_type: { $regex: text, $options: 'i' } },
            { form_placement: { $regex: text, $options: 'i' } },
            { success_message: { $regex: text, $options: 'i' } }
        ];
    }

    // Add form type filter
    if (query && query.form_type) {
        searchQuery.form_type = query.form_type;
    }

    // Add status filter
    if (query && query.form_status) {
        searchQuery.form_status = query.form_status;
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

// Static method for bulk upsert form stats
FormStatSchema.statics.bulkUpsertFormStats = async function (formStats) {
    if (!Array.isArray(formStats) || formStats.length === 0) {
        return { modified: 0, upserted: 0 };
    }

    const operations = [];
    
    for (const stat of formStats) {
        // Remove statistics data if present (it goes to ClickHouse)
        const { statistics, date_times, ...cleanStat } = stat;
        
        // Ensure required fields
        if (!cleanStat.klaviyo_public_id || !cleanStat.form_id) {
            continue;
        }

        operations.push({
            updateOne: {
                filter: {
                    klaviyo_public_id: cleanStat.klaviyo_public_id,
                    form_id: cleanStat.form_id
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
        console.error('Error in bulkUpsertFormStats:', error);
        throw error;
    }
};

// Instance method to check if form is accessible by user
FormStatSchema.methods.isAccessibleByUser = async function (userId, requiredPermission = PERMISSIONS.VIEW_ANALYTICS) {
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

// Static method to get form statistics by type
FormStatSchema.statics.getFormStatsByType = async function (klaviyoPublicId, formType) {
    const query = { klaviyo_public_id: klaviyoPublicId };
    if (formType) {
        query.form_type = formType;
    }
    
    return await this.find(query)
        .sort({ last_updated: -1 })
        .lean();
};

// Static method to get active forms
FormStatSchema.statics.getActiveForms = async function (klaviyoPublicIds) {
    return await this.find({
        klaviyo_public_id: { $in: klaviyoPublicIds },
        form_status: 'active',
        form_archived: false
    })
    .sort({ form_created: -1 })
    .lean();
};

// Pre-save middleware to update timestamps
FormStatSchema.pre('save', function (next) {
    this.last_updated = new Date();
    next();
});

const FormStat = mongoose.models.FormStat || mongoose.model('FormStat', FormStatSchema);

export default FormStat;
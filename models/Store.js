import mongoose from "mongoose"
import { ObjectId } from "mongodb"
import { customAlphabet } from "nanoid"
import { isValidObjectId } from "mongoose"

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 7)

const StoreSchema = new mongoose.Schema({
    shopify_domain: {
        type: String,
        trim: true,
    },
    url: {
        type: String,
        trim: true,
    },
    name: {
        type: String,
        trim: true,
        required: true,
    },
    public_id: {
        type: String,
        trim: true,
        unique: true,
    },
    owner_id: {
        type: ObjectId,
        ref: "User",
        required: true,
    },
    // New unified users array that combines owner and shared users
    users: [{
        userId: {
            type: ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: ["owner", "admin", "creator", "member"],
            required: true,
        },
        permissions: {
            canEditStore: { type: Boolean, default: false },
            canEditBrand: { type: Boolean, default: false },
            canEditContent: { type: Boolean, default: false },
            canApproveContent: { type: Boolean, default: false },
            canViewAnalytics: { type: Boolean, default: false },
            canManageIntegrations: { type: Boolean, default: false },
            canManageUsers: { type: Boolean, default: false },
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
        addedBy: {
            type: ObjectId,
            ref: "User",
        }
    }],
    shared_with: [{
        user: {
            type: ObjectId,
            ref: "User",
            required: true,
        },
        permissions: [{
            type: String,
            enum: [
                "view",
                "edit",
                "delete"
            ],
            default: ["view"]
        }],
        shared_at: {
            type: Date,
            default: Date.now,
        },
        shared_by: {
            type: ObjectId,
            ref: "User",
            required: true,
        }
    }],
    brands: [{
        _id: {
            type: ObjectId,
            ref: "BrandSettings",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
        }
    }],
    shopify_store_id: {
        type: String,
        trim: true,
    },
    tagNames: {
        type: Array,
        default: [],
    },
    // Content tagging system
    template_tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    field_tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    campaign_tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    universal_content_tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    shopify_integration: {
        status: { type: String, enum: ["connected", "disconnected", "error"], default: "disconnected" },
        access_token: { type: String, default: null }, // should be encrypted in production
        webhook_secret: { type: String, default: null },
        installed_at: { type: Date, default: null },
        last_sync: { type: Date, default: null },
        sync_status: { type: String, default: null },
        scopes: [{ type: String }],
    },
    klaviyo_integration: {
        status: { type: String, enum: ["connected", "disconnected", "error", "not_configured"], default: "not_configured" },
        public_id: { type: String, default: null },
        conversion_type: { type: String, default: "value" },
        conversion_metric_id: { type: String, default: null },
        apiKey: { type: String, default: null }, // should be encrypted in production
        connected_at: { type: Date, default: null },
        account: { type: mongoose.Schema.Types.Mixed, default: {} },
        is_updating_dashboard: {
            type: Boolean,
            default: false,
        },
        campaign_values_last_update: {
            type: Date,
            default: null,
        },
        segment_series_last_update: {
            type: Date,
            default: null,
        },
        flow_series_last_update: {
            type: Date,
            default: null,
        },
        form_series_last_update:{
            default: null,
        }
    },
    subscription: {
        plan_id: { type: String, default: null },
        status: { type: String, default: null },
        trial_ends_at: { type: Date, default: null },
        billing_cycle_anchor: { type: Date, default: null },
    },
    settings: {
        timezone: { type: String, default: null },
        currency: { type: String, default: 'USD' },
        conversion_rate: { 
            type: Number, 
            default: 1.0,
            min: 0,
            // Conversion rate to USD - e.g., 0.75 for EUR means 1 EUR = 0.75 USD
            // This allows dashboard to show all values in a common currency
        },
        email_sending_preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },

    // Soft delete fields
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: ObjectId,
        ref: "User",
        default: null
    }
})

// Automatically update `updated_at` on save
StoreSchema.pre("save", function (next) {
    this.updated_at = Date.now()
    next()
})

// Generate a unique public_id before saving a new store
StoreSchema.pre("save", async function (next) {
    if (this.isNew && !this.public_id) {
        let uniqueId = nanoid()
        let existingStore = await this.constructor.findOne({ public_id: uniqueId })
        while (existingStore) {
            uniqueId = nanoid()
            existingStore = await this.constructor.findOne({ public_id: uniqueId })
        }
        this.public_id = uniqueId
    }

    // Automatically add owner to users array when creating new store
    if (this.isNew && this.owner_id) {
        this.users = [{
            userId: this.owner_id,
            role: "owner",
            permissions: {
                canEditStore: true,
                canEditBrand: true,
                canEditContent: true,
                canApproveContent: true,
                canViewAnalytics: true,
                canManageIntegrations: true,
                canManageUsers: true,
            },
            addedAt: new Date()
        }]
    }

    next()
})

// Indexes for better query performance
StoreSchema.index({ owner_id: 1 })
StoreSchema.index({ shopify_domain: 1 })
StoreSchema.index({ "shared_with.user": 1 })
StoreSchema.index({ "users.userId": 1 })

// Static method to find stores by user
StoreSchema.statics.findByUser = function (userId) {
    return this.find({
        $or: [
            { owner_id: userId },
            { "shared_with.user": userId },
            { "users.userId": userId }
        ]
    })
}

// Static method to find store by ID or public ID
StoreSchema.statics.findByIdOrPublicId = async function (storeIdentifier) {
    const isPublicId = storeIdentifier?.length === 7;

    if (isPublicId) {
        return await this.findOne({ public_id: storeIdentifier, isActive: true });
    } else {
        return await this.findOne({ _id: storeIdentifier, isActive: true });
    }
}

// Static method to check if user has access to store
StoreSchema.statics.hasAccess = async function (storeIdentifier, userId, requiredPermission = "view") {
    const isPublicId = storeIdentifier?.length === 7;
    let store;

    if (isPublicId) {
        store = await this.findOne({ public_id: storeIdentifier });
    } else {
        store = await this.findById(storeIdentifier);
    }

    if (!store) return false

    // Check if user is owner
    if (store.owner_id.toString() === userId.toString()) return true

    // Check if user has shared access with required permission
    const sharedAccess = store.shared_with.find(
        share => share.user.toString() === userId.toString() &&
            share.permissions.includes(requiredPermission)
    )

    return !!sharedAccess
}

StoreSchema.statics.findByIdOrPublicIdAndUpdate = function (id, update, options) {
    let query;
    if (isValidObjectId(id)) {
        query = { $and: [{ isActive: true }, { $or: [{ _id: id }, { public_id: id }] }] };
    } else {
        query = { public_id: id, isActive: true };
    }
    return this.findOneAndUpdate(query, update, options);
};

export default mongoose.models.Store || mongoose.model("Store", StoreSchema)

import mongoose from "mongoose"
import { ObjectId } from "mongodb"
import { generateNanoid } from '../lib/nanoid-generator.js'
import { isValidObjectId } from "mongoose"

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
        trim: true
    },
    owner_id: {
        type: ObjectId,
        ref: "User",
        required: true,
    },
    contract_id: {
        type: ObjectId,
        ref: "Contract",
        required: true
    },
    
    // Hierarchy (for franchises and multi-location stores)
    parent_store_id: {
        type: ObjectId,
        ref: "Store",
        default: null
    },
    hierarchy_settings: {
        inherit_templates: {
            type: Boolean,
            default: false
        },
        inherit_brand_settings: {
            type: Boolean,
            default: false
        },
        location_identifier: {
            type: String,
            trim: true
        }
    },
    // Quick access team list (denormalized from ContractSeats)
    team_members: [{
        seat_id: {
            type: ObjectId,
            ref: "ContractSeat",
            required: true
        },
        user_id: {
            type: ObjectId,
            ref: "User",
            required: true
        },
        role_id: {
            type: ObjectId,
            ref: "Role",
            required: true
        },
        permission_overrides: {
            type: Map,
            of: Boolean,
            default: new Map()
        }
    }],
    
    // Legacy users array for backward compatibility
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
    // Legacy shared_with array for backward compatibility
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
            type: Date,
            default: null,
        }
    },
    // Stripe Billing (per store)
    stripe_customer_id: {
        type: String,
        trim: true,
    },
    stripe_subscription_id: {
        type: String,
        trim: true,
    },
    subscription_status: {
        type: String,
        enum: ['active', 'cancelled', 'past_due', 'trialing'],
        default: 'trialing',
    },
    subscription_tier: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'pro',
    },
    billing_email: {
        type: String,
        trim: true,
    },
    trial_ends_at: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
    // Scraping job tracking
    scrape_job_id: {
        type: String,
        trim: true,
    },
    scrape_status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
    },
    scrape_completed_at: {
        type: Date,
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

    // Status
    is_active: {
        type: Boolean,
        default: true
    },
    
    // Legacy soft delete fields for backward compatibility
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: ObjectId,
        ref: "User",
        default: null
    },
    is_deleted: {
        type: Boolean,
        default: false
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
        this.public_id = await generateNanoid(7);
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
StoreSchema.index({ public_id: 1 }, { unique: true });
StoreSchema.index({ owner_id: 1 });
StoreSchema.index({ contract_id: 1 });
StoreSchema.index({ parent_store_id: 1 });
StoreSchema.index({ shopify_domain: 1 });
StoreSchema.index({ "shared_with.user": 1 });
StoreSchema.index({ "users.userId": 1 });
StoreSchema.index({ "team_members.user_id": 1 });
StoreSchema.index({ "team_members.seat_id": 1 });
StoreSchema.index({ is_active: 1, isActive: 1 });
StoreSchema.index({ is_deleted: 1 });

// Static method to find stores by user (updated for ContractSeat architecture)
StoreSchema.statics.findByUser = function (userId) {
    return this.find({
        $or: [
            { owner_id: userId },
            { "shared_with.user": userId },
            { "users.userId": userId },
            { "team_members.user_id": userId }
        ],
        is_deleted: { $ne: true } // Exclude soft-deleted stores
    });
};

// Static method to find stores by contract
StoreSchema.statics.findByContract = function (contractId) {
    return this.find({
        contract_id: contractId,
        is_deleted: { $ne: true } // Exclude soft-deleted stores
    });
};

// Static method to find stores accessible to user via ContractSeats
StoreSchema.statics.findByUserSeats = async function (userId) {
    const ContractSeat = mongoose.model('ContractSeat');
    
    // Find all active seats for the user
    const seats = await ContractSeat.find({ 
        user_id: userId, 
        status: 'active' 
    });
    
    if (!seats.length) return [];
    
    // Get all contract IDs the user has access to
    const contractIds = seats.map(seat => seat.contract_id);
    
    // Find all stores in those contracts (excluding soft-deleted stores)
    const stores = await this.find({
        contract_id: { $in: contractIds },
        is_deleted: { $ne: true }
    });
    
    // Filter stores based on seat-specific access
    const accessibleStores = [];
    
    for (const store of stores) {
        for (const seat of seats) {
            if (seat.contract_id.toString() === store.contract_id.toString()) {
                // Check if user has specific store access or default contract access
                const hasStoreAccess = seat.store_access.some(access => 
                    access.store_id.toString() === store._id.toString()
                );
                
                // If no specific store restrictions, they have access to all stores in the contract
                if (hasStoreAccess || seat.store_access.length === 0) {
                    accessibleStores.push(store);
                    break;
                }
            }
        }
    }
    
    return accessibleStores;
};

// Static method to find store by ID or public ID
StoreSchema.statics.findByIdOrPublicId = async function (storeIdentifier) {
    const isPublicId = storeIdentifier?.length === 7;

    if (isPublicId) {
        return await this.findOne({ public_id: storeIdentifier, isActive: true });
    } else {
        return await this.findOne({ _id: storeIdentifier, isActive: true });
    }
}

// Static method to check if user has access to store (updated for ContractSeat architecture)
StoreSchema.statics.hasAccess = async function (storeIdentifier, userId, requiredPermission = "view") {
    const isPublicId = storeIdentifier?.length === 7;
    let store;

    if (isPublicId) {
        store = await this.findOne({ public_id: storeIdentifier, is_active: true, isActive: true });
    } else {
        store = await this.findById(storeIdentifier);
    }

    if (!store || !store.is_active || !store.isActive) return false;

    // Check if user is owner
    if (store.owner_id.toString() === userId.toString()) return true;

    // Check via ContractSeat system
    const ContractSeat = mongoose.model('ContractSeat');
    const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id,
        status: 'active'
    });
    
    if (seat) {
        // Check if user has specific access to this store
        const hasStoreAccess = seat.hasStoreAccess(store._id);
        if (hasStoreAccess || seat.store_access.length === 0) {
            return true;
        }
    }

    // Fall back to legacy permission checks
    const sharedAccess = store.shared_with.find(
        share => share.user.toString() === userId.toString() &&
            share.permissions.includes(requiredPermission)
    );
    
    const userAccess = store.users.find(
        user => user.userId.toString() === userId.toString()
    );

    return !!(sharedAccess || userAccess);
};

StoreSchema.statics.findByIdOrPublicIdAndUpdate = function (id, update, options) {
    let query;
    if (isValidObjectId(id)) {
        query = { $and: [{ isActive: true, is_active: true }, { $or: [{ _id: id }, { public_id: id }] }] };
    } else {
        query = { public_id: id, isActive: true, is_active: true };
    }
    return this.findOneAndUpdate(query, update, options);
};

// Method to sync team members from ContractSeats
StoreSchema.methods.syncTeamMembers = async function() {
    const ContractSeat = mongoose.model('ContractSeat');
    
    // Find all seats for this store's contract that have access to this store
    const seats = await ContractSeat.find({
        contract_id: this.contract_id,
        status: 'active',
        $or: [
            { 'store_access.store_id': this._id },
            { 'store_access': { $size: 0 } } // Users with default access to all stores
        ]
    }).populate('user_id default_role_id');
    
    // Update team_members array
    this.team_members = seats.map(seat => {
        const storeAccess = seat.store_access.find(access => 
            access.store_id.toString() === this._id.toString()
        );
        
        return {
            seat_id: seat._id,
            user_id: seat.user_id._id,
            role_id: storeAccess?.role_id || seat.default_role_id,
            permission_overrides: storeAccess?.permission_overrides || new Map()
        };
    });
    
    return this.save();
};

// Method to add team member (creates ContractSeat access)
StoreSchema.methods.addTeamMember = async function(userId, roleId, grantedBy) {
    const ContractSeat = mongoose.model('ContractSeat');
    
    // Find user's seat in the contract
    let seat = await ContractSeat.findOne({
        contract_id: this.contract_id,
        user_id: userId,
        status: 'active'
    });
    
    if (!seat) {
        throw new Error('User must be added to the contract first');
    }
    
    // Grant store access
    seat.grantStoreAccess(this._id, roleId, grantedBy);
    await seat.save();
    
    // Sync team members
    await this.syncTeamMembers();
    
    return this;
};

// Method to remove team member
StoreSchema.methods.removeTeamMember = async function(userId) {
    const ContractSeat = mongoose.model('ContractSeat');
    
    const seat = await ContractSeat.findOne({
        contract_id: this.contract_id,
        user_id: userId,
        status: 'active'
    });
    
    if (seat) {
        seat.revokeStoreAccess(this._id);
        await seat.save();
        
        // Sync team members
        await this.syncTeamMembers();
    }
    
    return this;
};

// Method to get hierarchical stores (children)
StoreSchema.methods.getChildStores = function() {
    return this.constructor.find({
        parent_store_id: this._id,
        is_active: true,
        isActive: true
    });
};

// Method to get parent store
StoreSchema.methods.getParentStore = function() {
    if (!this.parent_store_id) return null;
    return this.constructor.findById(this.parent_store_id);
};

// Prevent model recompilation in development
let Store;

if (mongoose.models && mongoose.models.Store) {
  Store = mongoose.models.Store;
} else {
  Store = mongoose.model("Store", StoreSchema);
}

export default Store;

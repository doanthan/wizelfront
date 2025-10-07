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
    // Store tags for grouping/filtering in reporting
    storeTags: [{
        type: String,
        trim: true,
    }],
    // Content tagging system
    template_tags: [{
        type: String,
        trim: true,
    }],
        segment_tags: [{
        type: String,
        trim: true,
    }],
        flow_tags: [{
        type: String,
        trim: true,
    }],
    campaign_tags: [{
        type: String,
        trim: true,
    }],
    universal_content_tags: [{
        type: String,
        trim: true,
    }],
    // Shopify Platform Flag
    isShopify: {
        type: Boolean,
        default: false
    },
    // Shopify Collections Data
    shopifyCollections: {
        type: [{
            id: String,
            handle: String,
            title: String,
            updated_at: String,
            body_html: String,
            published_at: String,
            sort_order: String,
            template_suffix: String,
            products_count: Number,
            collection_type: String,
            published_scope: String,
            admin_graphql_api_id: String,
            image: {
                created_at: String,
                alt: String,
                width: Number,
                height: Number,
                src: String
            },
            rules: [{
                column: String,
                relation: String,
                condition: String
            }],
            disjunctive: Boolean
        }],
        default: []
    },
    shopifyCollectionsUpdatedAt: {
        type: Date,
        default: null
    },
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
        reporting_metric_id: { type: String, default: null },
        refund_metric_ids: [{ type: String }], // Array of metric IDs for cancelled/refunded orders
        apiKey: { type: String, default: null }, // Legacy API key (pk_*)
        // OAuth fields
        oauth_token: { type: String, default: null }, // OAuth access token
        refresh_token: { type: String, default: null }, // OAuth refresh token
        token_expires_at: { type: Date, default: null }, // Token expiration timestamp
        auth_type: { type: String, enum: ["api_key", "oauth"], default: null }, // Track auth method
        connected_at: { type: Date, default: null },
        account: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // ========================================================================
    // ADAPTIVE RFM V3.0 CONFIGURATION
    // ========================================================================
    adaptive_rfm_config: {
        version: {
            type: String,
            enum: ["1.0", "2.0", "3.0"],
            default: "3.0"
        },
        calculation_date: {
            type: Date,
            default: null
        },

        // Business Characteristics
        business_characteristics: {
            total_customers: { type: Number, default: 0 },
            total_orders: { type: Number, default: 0 },
            one_time_buyer_pct: { type: Number, default: 0 },
            repeat_purchase_pct: { type: Number, default: 0 },
            avg_orders_per_customer: { type: Number, default: 0 },
            median_inter_purchase_days: { type: Number, default: null },
            avg_order_value: { type: Number, default: 0 },
            detected_template: {
                type: String,
                enum: ["low_repeat", "medium_repeat", "high_repeat"],
                default: null
            },
            confidence_score: { type: Number, default: 0, min: 0, max: 1 }
        },

        // Calculated Criteria (V3.0)
        calculated_criteria: {
            // Frequency (Absolute Thresholds)
            frequency: {
                champion: {
                    min_orders: { type: Number, default: null },
                    baseline_used: { type: Number, default: null },
                    adjusted: { type: Boolean, default: false },
                    adjustment_reason: { type: String, default: null },
                    pct_customers_meeting: { type: Number, default: 0 },
                    expected_range: [{ type: Number }], // [min, max]
                    is_healthy: { type: Boolean, default: true }
                },
                loyal: {
                    min_orders: { type: Number, default: null },
                    baseline_used: { type: Number, default: null },
                    adjusted: { type: Boolean, default: false },
                    adjustment_reason: { type: String, default: null },
                    pct_customers_meeting: { type: Number, default: 0 },
                    expected_range: [{ type: Number }],
                    is_healthy: { type: Boolean, default: true }
                },
                active: {
                    min_orders: { type: Number, default: null },
                    pct_customers_meeting: { type: Number, default: 0 }
                }
            },

            // Monetary (Percentile-based)
            monetary: {
                champion: {
                    min_revenue: { type: Number, default: 0 },
                    percentile_used: { type: Number, default: 0.90 },
                    pct_customers_meeting: { type: Number, default: 0 }
                },
                loyal: {
                    min_revenue: { type: Number, default: 0 },
                    percentile_used: { type: Number, default: 0.75 },
                    pct_customers_meeting: { type: Number, default: 0 }
                },
                active: {
                    min_revenue: { type: Number, default: 0 },
                    percentile_used: { type: Number, default: 0.60 },
                    pct_customers_meeting: { type: Number, default: 0 }
                }
            },

            // Recency (Inter-purchase based)
            recency: {
                hot: { type: Number, default: 30 },
                warm: { type: Number, default: 60 },
                cool: { type: Number, default: 90 },
                at_risk: { type: Number, default: 180 },
                lost: { type: Number, default: 365 },
                calculation_method: {
                    type: String,
                    enum: ["inter_purchase_intervals", "default"],
                    default: "inter_purchase_intervals"
                }
            }
        },

        // Segment Preview
        segment_preview: {
            type: Map,
            of: {
                count: { type: Number, default: 0 },
                percentage: { type: Number, default: 0 },
                criteria: { type: String, default: "" }
            },
            default: {}
        },

        // Validation Results
        validation: {
            distribution_healthy: { type: Boolean, default: true },
            warnings: [{ type: String }],
            recommendations: [{ type: String }],
            confidence_score: { type: Number, default: 1.0, min: 0, max: 1 }
        },

        // User Overrides
        overrides: {
            enabled: { type: Boolean, default: false },
            frequency: {
                champion_min_orders: { type: Number, default: null },
                loyal_min_orders: { type: Number, default: null }
            },
            monetary: {
                champion_min_revenue: { type: Number, default: null },
                loyal_min_revenue: { type: Number, default: null }
            },
            metadata: {
                modified_by: { type: ObjectId, ref: "User", default: null },
                modified_at: { type: Date, default: null },
                reason: { type: String, default: null }
            }
        },

        last_updated: { type: Date, default: null }
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
// V3.0 RFM indexes
StoreSchema.index({ "adaptive_rfm_config.calculation_date": -1 });
StoreSchema.index({ "adaptive_rfm_config.business_characteristics.detected_template": 1 });
StoreSchema.index({ "adaptive_rfm_config.last_updated": -1 });

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

// Static method to find stores by user (legacy)
StoreSchema.statics.findByUser = async function(userId) {
    if (!userId) return [];
    
    try {
        // Find stores where user_id matches or where user is in team_members
        const stores = await this.find({
            $and: [
                { is_deleted: { $ne: true } },
                {
                    $or: [
                        { user_id: userId },
                        { 'team_members.user_id': userId }
                    ]
                }
            ]
        });
        
        return stores;
    } catch (error) {
        console.error('Error in findByUser:', error);
        return [];
    }
};

// Static method to find stores by user seats (ContractSeat system)
StoreSchema.statics.findByUserSeats = async function(userId) {
    if (!userId) return [];
    
    try {
        const ContractSeat = mongoose.models.ContractSeat || require('./ContractSeat').default;
        
        // Find all contract seats for this user
        const seats = await ContractSeat.find({ user_id: userId }).lean();
        
        if (!seats || seats.length === 0) {
            return [];
        }
        
        // Get all store IDs from the user's seats
        const storeIds = [];
        seats.forEach(seat => {
            if (seat.stores && Array.isArray(seat.stores)) {
                seat.stores.forEach(storeAccess => {
                    if (storeAccess.store_id) {
                        storeIds.push(storeAccess.store_id);
                    }
                });
            }
        });
        
        if (storeIds.length === 0) {
            return [];
        }
        
        // Find all stores matching these IDs
        const stores = await this.find({
            _id: { $in: storeIds },
            is_deleted: { $ne: true }
        });
        
        return stores;
    } catch (error) {
        console.error('Error in findByUserSeats:', error);
        return [];
    }
};

// ========================================================================
// V3.0 RFM HELPER METHODS
// ========================================================================

// Get RFM criteria with explainability
StoreSchema.methods.getRFMCriteria = function() {
    if (!this.adaptive_rfm_config || this.adaptive_rfm_config.version !== "3.0") {
        return null;
    }

    return {
        version: this.adaptive_rfm_config.version,
        business_characteristics: this.adaptive_rfm_config.business_characteristics,
        calculated_criteria: this.adaptive_rfm_config.calculated_criteria,
        segment_preview: this.adaptive_rfm_config.segment_preview,
        validation: this.adaptive_rfm_config.validation,
        overrides: this.adaptive_rfm_config.overrides,
        last_updated: this.adaptive_rfm_config.last_updated
    };
};

// Check if RFM needs recalculation (older than 30 days)
StoreSchema.methods.needsRFMRecalculation = function() {
    if (!this.adaptive_rfm_config || !this.adaptive_rfm_config.last_updated) {
        return true;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.adaptive_rfm_config.last_updated < thirtyDaysAgo;
};

// Get segment criteria for a specific segment
StoreSchema.methods.getSegmentCriteria = function(segmentName) {
    if (!this.adaptive_rfm_config || !this.adaptive_rfm_config.segment_preview) {
        return null;
    }

    return this.adaptive_rfm_config.segment_preview.get(segmentName);
};

// Check if store has RFM overrides applied
StoreSchema.methods.hasRFMOverrides = function() {
    return this.adaptive_rfm_config?.overrides?.enabled === true;
};

// Get RFM segment definition for a given segment name
StoreSchema.methods.getRFMSegmentDefinition = function(segmentName) {
    if (!this.adaptive_rfm_config?.calculated_criteria) {
        return null;
    }

    const criteria = this.adaptive_rfm_config.calculated_criteria;
    const overrides = this.adaptive_rfm_config.overrides?.enabled ? this.adaptive_rfm_config.overrides : null;

    // Build segment definition based on segment name
    const definitions = {
        'Champions': {
            frequency: overrides?.frequency?.champion_min_orders || criteria.frequency.champion.min_orders,
            monetary: overrides?.monetary?.champion_min_revenue || criteria.monetary.champion.min_revenue,
            recency: criteria.recency.hot,
            description: 'High frequency, high spend, recent purchases'
        },
        'Loyal Customers': {
            frequency: overrides?.frequency?.loyal_min_orders || criteria.frequency.loyal.min_orders,
            monetary: overrides?.monetary?.loyal_min_revenue || criteria.monetary.loyal.min_revenue,
            recency: criteria.recency.warm,
            description: 'Regular buyers with good lifetime value'
        },
        'Active Customers': {
            frequency: criteria.frequency.active.min_orders,
            monetary: criteria.monetary.active.min_revenue,
            recency: criteria.recency.cool,
            description: 'Recent purchasers, building loyalty'
        },
        'At Risk': {
            frequency: criteria.frequency.active.min_orders,
            monetary: criteria.monetary.active.min_revenue,
            recency: criteria.recency.at_risk,
            description: 'Previously active, now becoming inactive'
        },
        'Lost': {
            frequency: null,
            monetary: null,
            recency: criteria.recency.lost,
            description: 'No recent purchases, need re-engagement'
        }
    };

    return definitions[segmentName] || null;
};

// Get business template information
StoreSchema.methods.getBusinessTemplate = function() {
    if (!this.adaptive_rfm_config?.business_characteristics) {
        return null;
    }

    const chars = this.adaptive_rfm_config.business_characteristics;

    return {
        template: chars.detected_template,
        confidence: chars.confidence_score,
        metrics: {
            total_customers: chars.total_customers,
            total_orders: chars.total_orders,
            repeat_rate: chars.repeat_purchase_pct,
            avg_orders_per_customer: chars.avg_orders_per_customer,
            median_days_between_purchases: chars.median_inter_purchase_days,
            avg_order_value: chars.avg_order_value
        }
    };
};

// Update RFM configuration (used by calculation engine)
StoreSchema.methods.updateRFMConfig = async function(configUpdate) {
    if (!this.adaptive_rfm_config) {
        this.adaptive_rfm_config = {};
    }

    // Merge the update
    Object.assign(this.adaptive_rfm_config, configUpdate);

    // Update timestamps
    this.adaptive_rfm_config.last_updated = new Date();
    this.adaptive_rfm_config.calculation_date = new Date();

    return this.save();
};

// Apply user overrides to RFM criteria
StoreSchema.methods.applyRFMOverrides = async function(overrides, userId, reason) {
    if (!this.adaptive_rfm_config) {
        throw new Error('RFM config not initialized');
    }

    this.adaptive_rfm_config.overrides = {
        enabled: true,
        frequency: overrides.frequency || {},
        monetary: overrides.monetary || {},
        metadata: {
            modified_by: userId,
            modified_at: new Date(),
            reason: reason || 'Manual override'
        }
    };

    return this.save();
};

// Remove user overrides and revert to calculated criteria
StoreSchema.methods.removeRFMOverrides = async function() {
    if (!this.adaptive_rfm_config) {
        return this;
    }

    this.adaptive_rfm_config.overrides = {
        enabled: false,
        frequency: {},
        monetary: {},
        metadata: {
            modified_by: null,
            modified_at: null,
            reason: null
        }
    };

    return this.save();
};

// Get RFM health status
StoreSchema.methods.getRFMHealthStatus = function() {
    if (!this.adaptive_rfm_config?.validation) {
        return {
            healthy: false,
            reason: 'RFM not configured'
        };
    }

    const validation = this.adaptive_rfm_config.validation;

    return {
        healthy: validation.distribution_healthy,
        confidence: validation.confidence_score,
        warnings: validation.warnings || [],
        recommendations: validation.recommendations || []
    };
};

// Static method to find stores by RFM template
StoreSchema.statics.findByRFMTemplate = function(template) {
    return this.find({
        "adaptive_rfm_config.business_characteristics.detected_template": template,
        is_deleted: { $ne: true }
    });
};

// Static method to find stores needing RFM recalculation
StoreSchema.statics.findNeedingRFMRecalculation = function() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return this.find({
        $or: [
            { "adaptive_rfm_config.last_updated": { $exists: false } },
            { "adaptive_rfm_config.last_updated": null },
            { "adaptive_rfm_config.last_updated": { $lt: thirtyDaysAgo } }
        ],
        is_deleted: { $ne: true }
    });
};

// Static method to get RFM statistics across all stores
StoreSchema.statics.getRFMStatistics = async function() {
    const stores = await this.find({
        "adaptive_rfm_config.version": "3.0",
        is_deleted: { $ne: true }
    });

    const templates = {
        low_repeat: 0,
        medium_repeat: 0,
        high_repeat: 0
    };

    let totalConfidence = 0;
    let storesWithOverrides = 0;

    stores.forEach(store => {
        const template = store.adaptive_rfm_config?.business_characteristics?.detected_template;
        if (template) {
            templates[template]++;
        }

        totalConfidence += store.adaptive_rfm_config?.business_characteristics?.confidence_score || 0;

        if (store.hasRFMOverrides()) {
            storesWithOverrides++;
        }
    });

    return {
        total_stores: stores.length,
        templates: templates,
        avg_confidence: stores.length > 0 ? totalConfidence / stores.length : 0,
        stores_with_overrides: storesWithOverrides
    };
};

// Prevent model recompilation in development
let Store;

if (mongoose.models && mongoose.models.Store) {
  Store = mongoose.models.Store;
} else {
  Store = mongoose.model("Store", StoreSchema);
}

export default Store;

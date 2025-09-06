import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { ObjectId } from "mongodb"
import { generateNanoid } from '../lib/nanoid-generator.js'


const IntegrationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["shopify", "klaviyo"],
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: String,
    scope: String,
    storeUrl: String, // For Shopify
    apiKey: String,
    expiresAt: Date,
    metadata: {
        type: Map,
        of: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please add a valid email"],
    },
    password: {
        type: String,
        required: [true, "Please add a password"],
        minlength: 6,
        select: false,
    },
    stores: [{
        _id: false,
        store_id: ObjectId,
        store_public_id: String,
        role: {
            type: String,
            enum: [
                'owner',           // Level 100 - Full control
                'admin',           // Level 90  - Administrative
                'manager',         // Level 80  - Team management
                'brand_guardian',  // Level 70  - Brand protection
                'creator',         // Level 60  - Content creation
                'publisher',       // Level 50  - Direct publishing
                'reviewer',        // Level 40  - Content review
                'analyst',         // Level 30  - Data analysis
                'viewer',          // Level 20  - Read-only
                'guest'           // Level 10  - Limited access
            ],
            default: 'viewer'
        },
        permissions: [String], // Feature:action format permissions (e.g., 'templates:edit')
        data_scope: {
            type: String,
            enum: ['global', 'organization', 'assigned_accounts', 'own_account', 'specific_items'],
            default: 'assigned_accounts'
        },
        approval_level: {
            type: String,
            enum: ["none", "draft", "pending", "approved"],
            default: "none"
        },
        can_approve_others: {
            type: Boolean,
            default: false
        },
        joined_at: {
            type: Date,
            default: Date.now
        },
        invited_by: ObjectId // user_id who invited them
    }],
    // Global user role (deprecated - use store-specific roles)
    role: {
        type: String,
        enum: ["user", "admin", "super_admin"],
        default: "user",
    },
    // Super user fields - System-wide administration
    is_super_user: {
        type: Boolean,
        default: false
    },
    super_user_role: {
        type: String,
        enum: [
            "SUPER_ADMIN",        // Full system access
            "TECHNICAL_SUPPORT",  // Debug and technical issues
            "CUSTOMER_SUCCESS",   // Customer support and onboarding
            "SALES",             // Sales and demo access
            "BILLING_SUPPORT"     // Billing and payment issues
        ]
    },
    super_user_permissions: [{
        type: String,
        enum: [
            "impersonate_accounts",
            "view_all_accounts",
            "access_customer_data",
            "debug_customer_issues",
            "manage_super_users",
            "billing_access",
            "technical_support",
            "customer_success",
            "sales_access",
            "system_configuration",
            "database_access",
            "api_management"
        ]
    }],
    super_user_created_at: {
        type: Date
    },
    super_user_created_by: {
        type: ObjectId,
        ref: 'User'
    },
    // Multi-Contract Architecture
    personal_contract_id: {
        type: ObjectId,
        ref: 'Contract'
    },
    
    // Quick access to all seats (denormalized for performance)
    active_seats: [{
        contract_id: {
            type: ObjectId,
            ref: 'Contract',
            required: true
        },
        contract_name: String, // For display purposes
        seat_id: {
            type: ObjectId,
            ref: 'ContractSeat',
            required: true
        },
        added_at: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Profile fields
    avatar_url: String,
    timezone: {
        type: String,
        default: 'America/New_York'
    },
    phone: String,
    
    // Authentication fields
    email_verified: {
        type: Boolean,
        default: false
    },
    
    // Preferences
    notification_preferences: {
        email_campaigns: { type: Boolean, default: true },
        email_mentions: { type: Boolean, default: true },
        email_approvals: { type: Boolean, default: true },
        email_weekly_reports: { type: Boolean, default: false },
        push_notifications: { type: Boolean, default: true }
    },
    
    // Legacy Contract Relations (deprecated - use active_seats instead)
    primary_contract_id: {
        type: ObjectId,
        ref: 'Contract'
    },
    contract_access: [{
        contract_id: {
            type: ObjectId,
            ref: 'Contract'
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        },
        added_at: {
            type: Date,
            default: Date.now
        }
    }],
    // Store permissions V2 - Feature:Action format
    store_permissions: [{
        store_id: {
            type: ObjectId,
            ref: 'Store'
        },
        role: {
            type: String,
            enum: [
                'owner',           // Level 100
                'admin',           // Level 90
                'manager',         // Level 80
                'brand_guardian',  // Level 70
                'creator',         // Level 60
                'publisher',       // Level 50
                'reviewer',        // Level 40
                'analyst',         // Level 30
                'viewer',          // Level 20
                'guest'           // Level 10
            ],
            default: 'viewer'
        },
        permissions_v2: [{
            type: String  // Feature:action format (e.g., 'templates:edit', 'campaigns:approve')
        }],
        data_scope: {
            type: String,
            enum: ['global', 'organization', 'assigned_accounts', 'own_account', 'specific_items'],
            default: 'assigned_accounts'
        },
        granted_by: {
            type: ObjectId,
            ref: 'User'
        },
        granted_at: {
            type: Date,
            default: Date.now
        }
    }],
    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    
    // Additional fields
    last_login: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
})


// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next()
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex")

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

    return resetToken
}

// Enhanced method using the new permission system with performance monitoring
UserSchema.methods.hasStoreAccess = function (storeId, requiredPermission = 'view') {
    const startTime = process.hrtime.bigint();

    // Check if user is super user first
    if (this.is_super_user || this.super_user_role === 'SUPER_ADMIN') {
        return true; // Super users have access to everything
    }

    const isPublicId = storeId?.length === 7;

    // Check new store_permissions structure
    const storePermission = this.store_permissions?.find(perm => {
        if (isPublicId) {
            // TODO: Add store_public_id to store_permissions
            return false;
        }
        return perm.store_id?.toString() === storeId?.toString();
    });

    // Also check legacy stores array
    const storeAccess = this.stores?.find(store => {
        if (isPublicId) {
            return store.store_public_id === storeId;
        }
        return store.store_id?.toString() === storeId?.toString();
    });

    if (!storePermission && !storeAccess) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Log slow permission checks (over 1ms)
        if (duration > 1) {
            console.warn(`Slow permission check: ${duration.toFixed(2)}ms for user ${this._id}, store ${storeId}`);
        }

        return false;
    }

    // Check permissions based on role and specific permissions
    let hasAccess = false;
    
    if (storePermission) {
        // Check new permission structure
        if (storePermission.permissions_v2?.includes('*:*')) {
            hasAccess = true;
        } else if (requiredPermission && storePermission.permissions_v2) {
            // Check for specific permission in feature:action format
            hasAccess = storePermission.permissions_v2.includes(requiredPermission) ||
                       storePermission.permissions_v2.includes(`*:${requiredPermission.split(':')[1]}`) ||
                       storePermission.permissions_v2.includes(`${requiredPermission.split(':')[0]}:*`);
        }
        
        // Check role-based access
        if (!hasAccess && storePermission.role) {
            const roleHierarchy = {
                'owner': 100,
                'admin': 90,
                'manager': 80,
                'brand_guardian': 70,
                'creator': 60,
                'publisher': 50,
                'reviewer': 40,
                'analyst': 30,
                'viewer': 20,
                'guest': 10
            };
            
            const userRoleLevel = roleHierarchy[storePermission.role] || 0;
            
            // Basic permission checks based on role level
            if (requiredPermission === 'view') {
                hasAccess = userRoleLevel >= 10; // Guest and above can view
            } else if (requiredPermission === 'edit' || requiredPermission === 'create') {
                hasAccess = userRoleLevel >= 60; // Creator and above can edit/create
            } else if (requiredPermission === 'delete') {
                hasAccess = userRoleLevel >= 80; // Manager and above can delete
            } else if (requiredPermission === 'manage') {
                hasAccess = userRoleLevel >= 90; // Admin and above can manage
            }
        }
    }
    
    // Fall back to legacy stores array
    if (!hasAccess && storeAccess) {
        hasAccess = true; // Legacy structure implies access
    }

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Log slow permission checks (over 1ms)
    if (duration > 1) {
        console.warn(`Slow permission check: ${duration.toFixed(2)}ms for user ${this._id}, store ${storeId}`);
    }

    return hasAccess;
};

// Method for content-specific permissions
UserSchema.methods.hasContentAccess = function (storeId, requiredPermission) {
    // Super users have all content access
    if (this.is_super_user || this.super_user_role === 'SUPER_ADMIN') {
        return true;
    }

    const isPublicId = storeId?.length === 7;

    // Check new store_permissions structure
    const storePermission = this.store_permissions?.find(perm => {
        if (isPublicId) {
            return false; // TODO: Add public_id support
        }
        return perm.store_id?.toString() === storeId?.toString();
    });

    if (!storePermission) {
        // Fall back to legacy stores array
        const storeAccess = this.stores?.find(store => {
            if (isPublicId) {
                return store.store_public_id === storeId;
            }
            return store.store_id?.toString() === storeId?.toString();
        });
        
        return !!storeAccess; // If they have any access, allow content access
    }

    // Check content-specific permissions
    if (storePermission.permissions_v2?.includes('*:*')) {
        return true;
    }
    
    if (storePermission.permissions_v2?.includes(`content:${requiredPermission}`)) {
        return true;
    }
    
    // Check role-based content access
    const roleContentAccess = {
        'owner': true,
        'admin': true,
        'manager': true,
        'brand_guardian': true,
        'creator': requiredPermission !== 'delete' && requiredPermission !== 'approve',
        'publisher': requiredPermission !== 'delete',
        'reviewer': requiredPermission === 'view' || requiredPermission === 'approve',
        'analyst': requiredPermission === 'view',
        'viewer': requiredPermission === 'view',
        'guest': requiredPermission === 'view'
    };
    
    return roleContentAccess[storePermission.role] || false;
};

// Method to check if user can approve content
UserSchema.methods.canApproveContent = function (storeId) {
    // Super users can approve anything
    if (this.is_super_user || this.super_user_role === 'SUPER_ADMIN') {
        return true;
    }

    const isPublicId = storeId?.length === 7;

    // Check new store_permissions structure
    const storePermission = this.store_permissions?.find(perm => {
        if (isPublicId) {
            return false; // TODO: Add public_id support
        }
        return perm.store_id?.toString() === storeId?.toString();
    });

    if (!storePermission) {
        // Fall back to legacy stores array
        const storeAccess = this.stores?.find(store => {
            if (isPublicId) {
                return store.store_public_id === storeId;
            }
            return store.store_id?.toString() === storeId?.toString();
        });
        
        // Legacy check - owners and admins can approve
        return storeAccess?.role === 'owner' || storeAccess?.role === 'admin';
    }

    // Check explicit approval permission
    if (storePermission.permissions_v2?.includes('*:*') ||
        storePermission.permissions_v2?.includes('*:approve') ||
        storePermission.permissions_v2?.includes('content:approve') ||
        storePermission.permissions_v2?.includes('campaigns:approve')) {
        return true;
    }
    
    // Role-based approval rights
    const rolesWithApprovalRights = [
        'owner',           // Level 100
        'admin',           // Level 90
        'manager',         // Level 80
        'brand_guardian',  // Level 70
        'reviewer'         // Level 40 - specifically for reviewing
    ];
    
    return rolesWithApprovalRights.includes(storePermission.role);
};

// Method to get user's approval level for a store
UserSchema.methods.getApprovalLevel = function (storeId) {
    // Super users have highest approval level
    if (this.is_super_user || this.super_user_role === 'SUPER_ADMIN') {
        return 'approved';
    }

    const isPublicId = storeId?.length === 7;

    // Check new store_permissions structure
    const storePermission = this.store_permissions?.find(perm => {
        if (isPublicId) {
            return false; // TODO: Add public_id support
        }
        return perm.store_id?.toString() === storeId?.toString();
    });

    if (!storePermission) {
        // Fall back to legacy stores array
        const storeAccess = this.stores?.find(store => {
            if (isPublicId) {
                return store.store_public_id === storeId;
            }
            return store.store_id?.toString() === storeId?.toString();
        });
        
        if (!storeAccess) return 'none';
        
        // Legacy approval levels
        return storeAccess.approval_level || 'none';
    }

    // Use approval_level from stores array if available
    const storeAccess = this.stores?.find(store => {
        if (isPublicId) {
            return store.store_public_id === storeId;
        }
        return store.store_id?.toString() === storeId?.toString();
    });
    
    if (storeAccess?.approval_level) {
        return storeAccess.approval_level;
    }
    
    // Default approval levels based on role
    const roleApprovalLevels = {
        'owner': 'approved',
        'admin': 'approved',
        'manager': 'approved',
        'brand_guardian': 'approved',
        'publisher': 'approved',
        'reviewer': 'pending',
        'creator': 'draft',
        'analyst': 'none',
        'viewer': 'none',
        'guest': 'none'
    };
    
    return roleApprovalLevels[storePermission.role] || 'none';
};

// Method to check if content requires approval for this user
UserSchema.methods.requiresApproval = function (storeId) {
    // Super users don't require approval
    if (this.is_super_user || this.super_user_role === 'SUPER_ADMIN') {
        return false;
    }

    const isPublicId = storeId?.length === 7;

    // Check new store_permissions structure
    const storePermission = this.store_permissions?.find(perm => {
        if (isPublicId) {
            return false; // TODO: Add public_id support
        }
        return perm.store_id?.toString() === storeId?.toString();
    });

    if (!storePermission) {
        // Fall back to legacy stores array
        const storeAccess = this.stores?.find(store => {
            if (isPublicId) {
                return store.store_public_id === storeId;
            }
            return store.store_id?.toString() === storeId?.toString();
        });
        
        if (!storeAccess) return true; // No access = requires approval
        
        // Legacy check - creators require approval
        return storeAccess.role === 'creator';
    }

    // Roles that require approval for their content
    const rolesRequiringApproval = [
        'creator',    // Level 60 - explicitly requires approval
        'analyst',    // Level 30 - limited to viewing
        'viewer',     // Level 20 - read-only
        'guest'       // Level 10 - limited access
    ];
    
    return rolesRequiringApproval.includes(storePermission.role);
};

// Super user methods
UserSchema.methods.isSuperUser = function () {
    return this.is_super_user === true || this.super_user_role;
};

UserSchema.methods.hasSuperUserPermission = function (permission) {
    if (!this.isSuperUser()) return false;

    return this.super_user_permissions.includes(permission);
};

UserSchema.methods.canImpersonateAccounts = function () {
    return this.hasSuperUserPermission('impersonate_accounts');
};

UserSchema.methods.canManageSuperUsers = function () {
    return this.hasSuperUserPermission('manage_super_users');
};

// Static method to find super users
UserSchema.statics.findSuperUsers = function () {
    return this.find({ is_super_user: true }).select('name email super_user_role super_user_created_at');
};

// Static method to find users by super user role
UserSchema.statics.findBySuperUserRole = function (role) {
    return this.find({ super_user_role: role }).select('name email super_user_permissions');
};

// Static method to find user with store access and permission check
UserSchema.statics.findWithStoreAccess = async function (userId, storeId, requiredPermission = 'view') {
    const user = await this.findById(userId);
    if (!user) return null;

    // Check if user has access to the store with the required permission
    if (user.hasStoreAccess(storeId, requiredPermission)) {
        return user;
    }

    return null;
};

// Multi-Contract Architecture Methods
UserSchema.methods.getActiveSeats = async function() {
    const ContractSeat = mongoose.model('ContractSeat');
    return await ContractSeat.findByUser(this._id);
};

UserSchema.methods.getSeatForContract = async function(contractId) {
    const ContractSeat = mongoose.model('ContractSeat');
    return await ContractSeat.findUserSeatForContract(this._id, contractId);
};

UserSchema.methods.hasAccessToStore = async function(storeId, requiredPermission = 'view') {
    // Super users have access to everything
    if (this.is_super_user || this.super_user_role === 'SUPER_ADMIN') {
        return true;
    }
    
    const ContractSeat = mongoose.model('ContractSeat');
    const seat = await ContractSeat.findUserAccessToStore(this._id, storeId);
    
    if (!seat) {
        // Fall back to legacy permission check for backward compatibility
        return this.hasStoreAccess(storeId, requiredPermission);
    }
    
    // Check if user has specific access to this store
    if (!seat.hasStoreAccess(storeId)) {
        return false;
    }
    
    // Get the role for this store (store-specific or default)
    const roleId = seat.getStoreRole(storeId);
    
    // TODO: Implement role-based permission checking
    // For now, return true if they have access
    return true;
};

UserSchema.methods.addSeat = function(contractId, contractName, seatId) {
    // Check if seat already exists
    const existingSeat = this.active_seats.find(seat => 
        seat.contract_id.toString() === contractId.toString()
    );
    
    if (existingSeat) {
        // Update existing seat
        existingSeat.seat_id = seatId;
        existingSeat.contract_name = contractName;
    } else {
        // Add new seat
        this.active_seats.push({
            contract_id: contractId,
            contract_name: contractName,
            seat_id: seatId,
            added_at: new Date()
        });
    }
};

UserSchema.methods.removeSeat = function(contractId) {
    this.active_seats = this.active_seats.filter(seat => 
        seat.contract_id.toString() !== contractId.toString()
    );
};

UserSchema.methods.getAccessibleContracts = function() {
    return this.active_seats.map(seat => ({
        contract_id: seat.contract_id,
        contract_name: seat.contract_name,
        seat_id: seat.seat_id,
        added_at: seat.added_at
    }));
};

// Static methods for multi-contract architecture
UserSchema.statics.findByContractSeat = function(contractId) {
    return this.find({ 
        'active_seats.contract_id': contractId,
        status: 'active'
    }).populate('active_seats.contract_id active_seats.seat_id');
};

UserSchema.statics.findWithAccessToStore = async function(storeId) {
    const ContractSeat = mongoose.model('ContractSeat');
    const Store = mongoose.model('Store');
    
    // Get the store to find its contract
    const store = await Store.findById(storeId);
    if (!store) return [];
    
    // Find all seats that have access to this store
    const seats = await ContractSeat.find({
        contract_id: store.contract_id,
        status: 'active',
        $or: [
            { 'store_access.store_id': storeId },
            { 'store_access': { $size: 0 } } // Users with default access to all stores in contract
        ]
    }).populate('user_id');
    
    return seats.map(seat => seat.user_id).filter(user => user);
};

// Indexes for multi-contract architecture
// Note: User model doesn't have a public_id field - removed erroneous index
UserSchema.index({ personal_contract_id: 1 });
UserSchema.index({ 'active_seats.contract_id': 1 });
UserSchema.index({ 'active_seats.seat_id': 1 });
UserSchema.index({ status: 1 });

// Indexes for super user queries
UserSchema.index({ is_super_user: 1, super_user_role: 1 });
UserSchema.index({ super_user_permissions: 1 });

// Prevent model recompilation in development
let User;

if (mongoose.models && mongoose.models.User) {
  User = mongoose.models.User;
} else {
  User = mongoose.model("User", UserSchema);
}

export default User;



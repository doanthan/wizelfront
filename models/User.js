import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { ObjectId } from "mongodb"
import {
    PERMISSIONS,
    hasPermission,
    hasLegacyPermission,
    hasContentPermission,
    canApproveContent,
    getApprovalLevel,
    requiresApproval
} from "@/lib/permissions"


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
        role: String, // owner, admin, member, creator
        permissions: [String], // granular permissions
        content_permissions: [String], // content-specific permissions
        approval_level: {
            type: String,
            enum: ["none", "draft", "pending", "approved"],
            default: "none"
        },
        can_approve_others: {
            type: Boolean,
            default: false
        },
        joined_at: Date,
        invited_by: ObjectId // user_id who invited them
    }],
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    // Super user fields
    is_super_user: {
        type: Boolean,
        default: false,
        index: true
    },
    super_user_role: {
        type: String,
        enum: ["SUPER_ADMIN", "TECHNICAL_SUPPORT", "CUSTOMER_SUCCESS", "SALES"],
        index: true
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
            "sales_access"
        ]
    }],
    super_user_created_at: {
        type: Date
    },
    super_user_created_by: {
        type: ObjectId,
        ref: 'User'
    },
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
UserSchema.methods.hasStoreAccess = function (storeId, requiredPermission = PERMISSIONS.VIEW) {
    const startTime = process.hrtime.bigint();

    const isPublicId = storeId?.length === 7;

    const storeAccess = this.stores.find(store => {
        if (isPublicId) {
            return store.store_public_id === storeId;
        }
        return store.store_id.toString() === storeId.toString();
    });

    if (!storeAccess) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Log slow permission checks (over 1ms)
        if (duration > 1) {
            console.warn(`Slow permission check: ${duration.toFixed(2)}ms for user ${this._id}, store ${storeId}`);
        }

        return false;
    }

    // Use the comprehensive permission checking from permissions.js
    const result = hasPermission(storeAccess, requiredPermission);

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Log slow permission checks (over 1ms)
    if (duration > 1) {
        console.warn(`Slow permission check: ${duration.toFixed(2)}ms for user ${this._id}, store ${storeId}`);
    }

    return result;
};

// Method for content-specific permissions
UserSchema.methods.hasContentAccess = function (storeId, requiredPermission) {
    const isPublicId = storeId?.length === 7;

    const storeAccess = this.stores.find(store => {
        if (isPublicId) {
            return store.store_public_id === storeId;
        }
        return store.store_id.toString() === storeId.toString();
    });

    if (!storeAccess) return false;

    return hasContentPermission(storeAccess, requiredPermission);
};

// Method to check if user can approve content
UserSchema.methods.canApproveContent = function (storeId) {
    const isPublicId = storeId?.length === 7;

    const storeAccess = this.stores.find(store => {
        if (isPublicId) {
            return store.store_public_id === storeId;
        }
        return store.store_id.toString() === storeId.toString();
    });

    if (!storeAccess) return false;

    return canApproveContent(storeAccess);
};

// Method to get user's approval level for a store
UserSchema.methods.getApprovalLevel = function (storeId) {
    const isPublicId = storeId?.length === 7;

    const storeAccess = this.stores.find(store => {
        if (isPublicId) {
            return store.store_public_id === storeId;
        }
        return store.store_id.toString() === storeId.toString();
    });

    if (!storeAccess) return "none";

    return getApprovalLevel(storeAccess);
};

// Method to check if content requires approval for this user
UserSchema.methods.requiresApproval = function (storeId) {
    const isPublicId = storeId?.length === 7;

    const storeAccess = this.stores.find(store => {
        if (isPublicId) {
            return store.store_public_id === storeId;
        }
        return store.store_id.toString() === storeId.toString();
    });

    if (!storeAccess) return true;

    return requiresApproval(storeAccess);
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
UserSchema.statics.findWithStoreAccess = async function (userId, storeId, requiredPermission = PERMISSIONS.VIEW) {
    const user = await this.findById(userId);
    if (!user) return null;

    // Check if user has access to the store with the required permission
    if (user.hasStoreAccess(storeId, requiredPermission)) {
        return user;
    }

    return null;
};

// Indexes for super user queries
UserSchema.index({ is_super_user: 1, super_user_role: 1 });
UserSchema.index({ super_user_permissions: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema)

export default User



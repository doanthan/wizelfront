import mongoose from "mongoose"
import { ObjectId } from "mongodb"

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Role name is required"],
        trim: true,
        // Remove global unique constraint - will add compound index below
    },
    display_name: {
        type: String,
        required: [true, "Display name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    store_id: {
        type: ObjectId,
        ref: "Store",
        required: true,
    },
    store_public_id: {
        type: String,
        required: true,
    },
    created_by: {
        type: ObjectId,
        ref: "User",
        required: true,
    },
    is_system_role: {
        type: Boolean,
        default: false, // true for built-in roles like owner, admin, member, creator
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    permissions: [{
        type: String,
        required: true,
    }],
    content_permissions: [{
        type: String,
        required: true,
    }],
    approval_level: {
        type: String,
        enum: ["none", "draft", "pending", "approved"],
        default: "none"
    },
    can_approve_others: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Map,
        of: String,
        default: new Map()
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    }
})

// Automatically update `updated_at` on save
RoleSchema.pre("save", function (next) {
    this.updated_at = Date.now()
    next()
})

// Indexes for better query performance
RoleSchema.index({ store_id: 1 })
RoleSchema.index({ store_public_id: 1 })
RoleSchema.index({ is_system_role: 1 })
RoleSchema.index({ is_active: 1 })

// Static method to find roles by store
RoleSchema.statics.findByStore = function (store_id) {
    return this.find({
        store_id: store_id,
        is_active: true
    }).sort({ created_at: -1 })
}

// Static method to find system roles
RoleSchema.statics.findSystemRoles = function () {
    return this.find({
        is_system_role: true,
        is_active: true
    })
}

// Static method to find custom roles by store
RoleSchema.statics.findCustomRolesByStore = function (store_id) {
    return this.find({
        store_id: store_id,
        is_system_role: false,
        is_active: true
    }).sort({ created_at: -1 })
}

// Static method to find role by name and store
RoleSchema.statics.findByNameAndStore = function (name, store_id) {
    return this.findOne({
        name: name,
        store_id: store_id,
        is_active: true
    })
}

// Static method to create system roles for a store
RoleSchema.statics.createSystemRoles = async function (store_id, storePublicId, createdBy) {
    const systemRoles = [
        {
            name: 'owner',
            display_name: 'Owner',
            description: 'Full access to everything',
            store_id: store_id,
            store_public_id: storePublicId,
            created_by: createdBy,
            is_system_role: true,
            permissions: ['view', 'edit', 'delete', 'view_store', 'edit_store', 'delete_store', 'manage_members', 'view_analytics', 'create_content', 'edit_content', 'delete_content', 'publish_content', 'approve_content', 'create_templates', 'edit_templates', 'delete_templates', 'use_templates', 'create_campaigns', 'edit_campaigns', 'delete_campaigns', 'schedule_campaigns', 'manage_integrations', 'view_integrations'],
            content_permissions: ['create_content', 'edit_content', 'delete_content', 'publish_content', 'approve_content', 'create_templates', 'edit_templates', 'delete_templates', 'use_templates', 'create_campaigns', 'edit_campaigns', 'delete_campaigns', 'schedule_campaigns'],
            approval_level: 'approved',
            can_approve_others: true
        },
        {
            name: 'admin',
            display_name: 'Admin',
            description: 'Can manage members and approve content',
            store_id: store_id,
            store_public_id: storePublicId,
            created_by: createdBy,
            is_system_role: true,
            permissions: ['view', 'edit', 'delete', 'view_store', 'edit_store', 'manage_members', 'view_analytics', 'create_content', 'edit_content', 'delete_content', 'publish_content', 'approve_content', 'create_templates', 'edit_templates', 'delete_templates', 'use_templates', 'create_campaigns', 'edit_campaigns', 'delete_campaigns', 'schedule_campaigns', 'manage_integrations', 'view_integrations'],
            content_permissions: ['create_content', 'edit_content', 'delete_content', 'publish_content', 'approve_content', 'create_templates', 'edit_templates', 'delete_templates', 'use_templates', 'create_campaigns', 'edit_campaigns', 'delete_campaigns', 'schedule_campaigns'],
            approval_level: 'approved',
            can_approve_others: true
        },
        {
            name: 'creator',
            display_name: 'Creator',
            description: 'Can create content and templates, requires approval',
            store_id: store_id,
            store_public_id: storePublicId,
            created_by: createdBy,
            is_system_role: true,
            permissions: ['view', 'view_store', 'view_analytics', 'create_content', 'edit_content', 'create_templates', 'edit_templates', 'use_templates', 'create_campaigns', 'edit_campaigns'],
            content_permissions: ['create_content', 'edit_content', 'create_templates', 'edit_templates', 'use_templates', 'create_campaigns', 'edit_campaigns'],
            approval_level: 'pending',
            can_approve_others: false
        },
        {
            name: 'member',
            display_name: 'Member',
            description: 'Read-only access, can use templates',
            store_id: store_id,
            store_public_id: storePublicId,
            created_by: createdBy,
            is_system_role: true,
            permissions: ['view', 'view_store', 'view_analytics', 'use_templates'],
            content_permissions: ['use_templates'],
            approval_level: 'none',
            can_approve_others: false
        }
    ]

    // Create all system roles
    const createdRoles = []
    for (const roleData of systemRoles) {
        try {
            // Check if role already exists for this store
            const existingRole = await this.findOne({
                name: roleData.name,
                store_id: store_id
            })
            
            if (existingRole) {
                console.log(`Role ${roleData.name} already exists for store ${store_id}, skipping...`)
                createdRoles.push(existingRole)
            } else {
                const role = new this(roleData)
                await role.save()
                createdRoles.push(role)
            }
        } catch (error) {
            if (error.code === 11000) {
                console.log(`Role ${roleData.name} already exists for store ${store_id}, continuing...`)
                // Try to fetch the existing role
                const existingRole = await this.findOne({
                    name: roleData.name,
                    store_id: store_id
                })
                if (existingRole) {
                    createdRoles.push(existingRole)
                }
            } else {
                throw error
            }
        }
    }

    return createdRoles
}

// Instance method to check if role has permission
RoleSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission)
}

// Instance method to check if role has content permission
RoleSchema.methods.hasContentPermission = function (permission) {
    return this.content_permissions.includes(permission)
}

// Instance method to check if role can approve content
RoleSchema.methods.canApproveContent = function () {
    return this.can_approve_others || this.name === 'owner' || this.name === 'admin'
}

// Instance method to get role configuration
RoleSchema.methods.getRoleConfig = function () {
    return {
        name: this.name,
        permissions: this.permissions,
        content_permissions: this.content_permissions,
        approval_level: this.approval_level,
        can_approve_others: this.can_approve_others,
        description: this.description,
        isCustom: !this.is_system_role
    }
}

// Create compound unique index - role names should be unique within each store
RoleSchema.index({ name: 1, store_id: 1 }, { unique: true })

export default mongoose.models.Role || mongoose.model("Role", RoleSchema) 
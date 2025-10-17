import mongoose from "mongoose"
import { ObjectId } from "mongodb"
import { generateNanoid } from '../lib/nanoid-generator.js'

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Role name is required"],
        trim: true,
        validate: {
            validator: function(v) {
                // System roles must match predefined values
                if (this.is_system_role === true) {
                    return ['owner', 'admin', 'manager', 'creator', 'reviewer', 'viewer'].includes(v);
                }
                // Custom roles can be anything (lowercase alphanumeric with underscores)
                return /^[a-z0-9_]+$/.test(v);
            },
            message: function(props) {
                if (this.is_system_role === true) {
                    return `System role name must be one of: owner, admin, manager, creator, reviewer, viewer`;
                }
                return `Custom role name must be lowercase alphanumeric with underscores only`;
            }
        }
    },
    display_name: {
        type: String,
        required: [true, "Display name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    
    is_system_role: {
        type: Boolean,
        default: true
    },
    contract_id: {
        type: ObjectId,
        ref: "Contract",
        default: null
    },
    
    // Universal permissions structure
    permissions: {
        stores: {
            create: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            manage_integrations: { type: Boolean, default: false }
        },
        campaigns: {
            create: { type: Boolean, default: false },
            edit_own: { type: Boolean, default: false },
            edit_all: { type: Boolean, default: false },
            approve: { type: Boolean, default: false },
            send: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        ai: {
            generate_content: { type: Boolean, default: false },
            use_premium_models: { type: Boolean, default: false },
            unlimited_regenerations: { type: Boolean, default: false }
        },
        brands: {
            create: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        },
        team: {
            invite_users: { type: Boolean, default: false },
            remove_users: { type: Boolean, default: false },
            manage_roles: { type: Boolean, default: false },
            manage_store_access: { type: Boolean, default: false }
        },
        analytics: {
            view_own: { type: Boolean, default: false },
            view_all: { type: Boolean, default: false },
            export: { type: Boolean, default: false },
            view_financial: { type: Boolean, default: false }
        },
        billing: {
            view: { type: Boolean, default: false },
            manage: { type: Boolean, default: false },
            purchase_credits: { type: Boolean, default: false }
        }
    },
    
    // Special capabilities
    capabilities: {
        canManageBilling: { type: Boolean, default: false },
        canDeleteContract: { type: Boolean, default: false },
        canCreateStores: { type: Boolean, default: false },
        creditLimits: {
            type: String,
            enum: ['unlimited', 'high', 'medium', 'low'],
            default: 'medium'
        },
        requiresApproval: { type: Boolean, default: false }
    },
    
    // Legacy fields for backward compatibility
    store_id: {
        type: ObjectId,
        ref: "Store",
        default: null
    },
    store_public_id: {
        type: String,
        default: null
    },
    created_by: {
        type: ObjectId,
        ref: "User",
        default: null
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    legacy_permissions: [{
        type: String
    }],
    content_permissions: [{
        type: String
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
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Automatically update `updated_at` on save
RoleSchema.pre("save", function (next) {
    this.updated_at = Date.now()
    next()
})

// Compound unique index for system roles (name must be unique for system roles)
RoleSchema.index({ name: 1, is_system_role: 1 }, { 
  unique: true,
  partialFilterExpression: { is_system_role: true }
});

// Index for custom roles (name + contract_id must be unique)
RoleSchema.index({ name: 1, contract_id: 1 }, { 
  unique: true,
  partialFilterExpression: { is_system_role: false }
});

// Legacy indexes for backward compatibility
RoleSchema.index({ store_id: 1 });
RoleSchema.index({ store_public_id: 1 });
RoleSchema.index({ level: 1 });
RoleSchema.index({ is_system_role: 1 });
RoleSchema.index({ is_active: 1 });

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

// Static method to create universal system roles
RoleSchema.statics.createSystemRoles = async function() {
  const systemRoles = [
    {
      name: 'owner',
      display_name: 'Owner',
      description: 'Full control over the contract and all resources',
      level: 100,
      permissions: {
        stores: { create: true, edit: true, delete: true, manage_integrations: true },
        campaigns: { create: true, edit_own: true, edit_all: true, approve: true, send: true, delete: true },
        ai: { generate_content: true, use_premium_models: true, unlimited_regenerations: true },
        brands: { create: true, edit: true, delete: true },
        team: { invite_users: true, remove_users: true, manage_roles: true, manage_store_access: true },
        analytics: { view_own: true, view_all: true, export: true, view_financial: true },
        billing: { view: true, manage: true, purchase_credits: true }
      },
      capabilities: {
        canManageBilling: true,
        canDeleteContract: true,
        canCreateStores: true,
        creditLimits: 'unlimited',
        requiresApproval: false
      },
      approval_level: 'approved',
      can_approve_others: true
    },
    {
      name: 'admin',
      display_name: 'Admin',
      description: 'Administrative access with most permissions except billing management',
      level: 80,
      permissions: {
        stores: { create: true, edit: true, delete: false, manage_integrations: true },
        campaigns: { create: true, edit_own: true, edit_all: true, approve: true, send: true, delete: false },
        ai: { generate_content: true, use_premium_models: true, unlimited_regenerations: false },
        brands: { create: true, edit: true, delete: false },
        team: { invite_users: true, remove_users: true, manage_roles: true, manage_store_access: true },
        analytics: { view_own: true, view_all: true, export: true, view_financial: false },
        billing: { view: true, manage: false, purchase_credits: true }
      },
      capabilities: {
        canManageBilling: false,
        canDeleteContract: false,
        canCreateStores: false,
        creditLimits: 'high',
        requiresApproval: false
      },
      approval_level: 'approved',
      can_approve_others: true
    },
    {
      name: 'manager',
      display_name: 'Manager',
      description: 'Team leadership with content approval and team management',
      level: 60,
      permissions: {
        stores: { create: false, edit: true, delete: false, manage_integrations: false },
        campaigns: { create: true, edit_own: true, edit_all: true, approve: true, send: true, delete: false },
        ai: { generate_content: true, use_premium_models: false, unlimited_regenerations: false },
        brands: { create: true, edit: true, delete: false },
        team: { invite_users: true, remove_users: false, manage_roles: false, manage_store_access: true },
        analytics: { view_own: true, view_all: true, export: true, view_financial: false },
        billing: { view: false, manage: false, purchase_credits: false }
      },
      capabilities: {
        canManageBilling: false,
        canDeleteContract: false,
        canCreateStores: false,
        creditLimits: 'medium',
        requiresApproval: false
      },
      approval_level: 'approved',
      can_approve_others: true
    },
    {
      name: 'creator',
      display_name: 'Creator',
      description: 'Content creation with basic AI access',
      level: 40,
      permissions: {
        stores: { create: false, edit: false, delete: false, manage_integrations: false },
        campaigns: { create: true, edit_own: true, edit_all: false, approve: false, send: false, delete: false },
        ai: { generate_content: true, use_premium_models: false, unlimited_regenerations: false },
        brands: { create: false, edit: false, delete: false },
        team: { invite_users: false, remove_users: false, manage_roles: false, manage_store_access: false },
        analytics: { view_own: true, view_all: false, export: false, view_financial: false },
        billing: { view: false, manage: false, purchase_credits: false }
      },
      capabilities: {
        canManageBilling: false,
        canDeleteContract: false,
        canCreateStores: false,
        creditLimits: 'medium',
        requiresApproval: true
      },
      approval_level: 'pending',
      can_approve_others: false
    },
    {
      name: 'reviewer',
      display_name: 'Reviewer',
      description: 'Content review and approval with limited creation',
      level: 30,
      permissions: {
        stores: { create: false, edit: false, delete: false, manage_integrations: false },
        campaigns: { create: false, edit_own: false, edit_all: false, approve: true, send: false, delete: false },
        ai: { generate_content: false, use_premium_models: false, unlimited_regenerations: false },
        brands: { create: false, edit: false, delete: false },
        team: { invite_users: false, remove_users: false, manage_roles: false, manage_store_access: false },
        analytics: { view_own: false, view_all: true, export: false, view_financial: false },
        billing: { view: false, manage: false, purchase_credits: false }
      },
      capabilities: {
        canManageBilling: false,
        canDeleteContract: false,
        canCreateStores: false,
        creditLimits: 'low',
        requiresApproval: false
      },
      approval_level: 'none',
      can_approve_others: true
    },
    {
      name: 'viewer',
      display_name: 'Viewer',
      description: 'Read-only access to content and analytics',
      level: 10,
      permissions: {
        stores: { create: false, edit: false, delete: false, manage_integrations: false },
        campaigns: { create: false, edit_own: false, edit_all: false, approve: false, send: false, delete: false },
        ai: { generate_content: false, use_premium_models: false, unlimited_regenerations: false },
        brands: { create: false, edit: false, delete: false },
        team: { invite_users: false, remove_users: false, manage_roles: false, manage_store_access: false },
        analytics: { view_own: false, view_all: true, export: false, view_financial: false },
        billing: { view: false, manage: false, purchase_credits: false }
      },
      capabilities: {
        canManageBilling: false,
        canDeleteContract: false,
        canCreateStores: false,
        creditLimits: 'low',
        requiresApproval: false
      },
      approval_level: 'none',
      can_approve_others: false
    }
  ];

  // Create roles if they don't exist
  const createdRoles = [];
  for (const roleData of systemRoles) {
    try {
      const role = await this.findOneAndUpdate(
        { name: roleData.name, is_system_role: true },
        roleData,
        { upsert: true, new: true }
      );
      createdRoles.push(role);
    } catch (error) {
      console.error(`Error creating system role ${roleData.name}:`, error);
    }
  }

  return createdRoles;
};

// Legacy method for backward compatibility
RoleSchema.statics.createSystemRolesForStore = async function (store_id, storePublicId, createdBy) {
    // For backward compatibility, create legacy store-specific roles
    // This method is deprecated and should be replaced with the new system
    console.warn('createSystemRolesForStore is deprecated. Use createSystemRoles instead.');
    return await this.createSystemRoles();
};

// Static method to get system roles
RoleSchema.statics.getSystemRoles = function() {
  return this.find({ is_system_role: true }).sort({ level: -1 });
};

// Static method to find role by name
RoleSchema.statics.findByName = function(name, contractId = null) {
  const query = { name };
  if (contractId) {
    query.contract_id = contractId;
    query.is_system_role = false;
  } else {
    query.is_system_role = true;
  }
  return this.findOne(query);
};

// Static method to get available roles for a contract
RoleSchema.statics.getAvailableRoles = function(contractId) {
  return this.find({
    $or: [
      { is_system_role: true },
      { contract_id: contractId, is_system_role: false }
    ]
  }).sort({ level: -1 });
};

// Instance method to check if role has specific permission (new system)
RoleSchema.methods.hasPermission = function(category, action) {
  if (this.permissions && this.permissions[category]) {
    return this.permissions[category][action] === true;
  }
  
  // Fall back to legacy permission checking
  if (this.legacy_permissions && this.legacy_permissions.includes) {
    return this.legacy_permissions.includes(`${category}:${action}`) || 
           this.legacy_permissions.includes(action);
  }
  
  return false;
};

// Instance method for legacy permission checking
RoleSchema.methods.hasLegacyPermission = function (permission) {
    return this.legacy_permissions && this.legacy_permissions.includes(permission);
};

// Instance method to check if role has content permission (legacy)
RoleSchema.methods.hasContentPermission = function (permission) {
    return this.content_permissions && this.content_permissions.includes(permission);
};

// Instance method to check if role can manage another role
RoleSchema.methods.canManageRole = function(otherRole) {
  return this.level > otherRole.level;
};

// Instance method to check if role can approve content
RoleSchema.methods.canApproveContent = function () {
    // New system check
    if (this.permissions && this.permissions.campaigns) {
        return this.permissions.campaigns.approve === true;
    }
    
    // Legacy system check
    return this.can_approve_others || this.name === 'owner' || this.name === 'admin';
};

// Instance method to get role capabilities summary
RoleSchema.methods.getCapabilitiesSummary = function() {
  const permissionList = [];
  
  if (this.permissions && typeof this.permissions === 'object') {
    for (const [category, actions] of Object.entries(this.permissions)) {
      if (typeof actions === 'object' && actions !== null) {
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed) {
            permissionList.push(`${category}:${action}`);
          }
        }
      }
    }
  }
  
  return {
    name: this.name,
    display_name: this.display_name,
    level: this.level,
    permissions: permissionList,
    capabilities: this.capabilities,
    requiresApproval: this.capabilities?.requiresApproval || false
  };
};

// Legacy method for backward compatibility
RoleSchema.methods.getRoleConfig = function () {
    return {
        name: this.name,
        permissions: this.legacy_permissions || [],
        content_permissions: this.content_permissions || [],
        approval_level: this.approval_level,
        can_approve_others: this.can_approve_others,
        description: this.description,
        isCustom: !this.is_system_role
    };
};

// Method to create custom role based on system role
RoleSchema.statics.createCustomRole = async function(contractId, baseRoleName, customName, customPermissions = {}) {
  const baseRole = await this.findByName(baseRoleName);
  if (!baseRole) {
    throw new Error(`Base role '${baseRoleName}' not found`);
  }
  
  // Merge base permissions with custom overrides
  const permissions = JSON.parse(JSON.stringify(baseRole.permissions)); // Deep copy
  for (const [category, actions] of Object.entries(customPermissions)) {
    if (permissions[category]) {
      permissions[category] = { ...permissions[category], ...actions };
    }
  }
  
  const customRole = new this({
    name: customName,
    display_name: customName.charAt(0).toUpperCase() + customName.slice(1),
    description: `Custom role based on ${baseRole.display_name}`,
    level: baseRole.level - 1, // Slightly lower level than base role
    is_system_role: false,
    contract_id: contractId,
    permissions: permissions,
    capabilities: { ...baseRole.capabilities }
  });
  
  return await customRole.save();
};

// Legacy compound unique index for backward compatibility
RoleSchema.index({ name: 1, store_id: 1 }, { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { store_id: { $exists: true } }
});

// Force model recompilation to pick up schema changes
let Role;

try {
  // Delete existing model if it exists to force recompilation
  if (mongoose.models && mongoose.models.Role) {
    delete mongoose.models.Role;
  }
  Role = mongoose.model("Role", RoleSchema);
} catch (error) {
  // If model already exists, use it
  Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);
}

export default Role; 
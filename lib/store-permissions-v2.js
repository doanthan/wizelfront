import User from '@/models/User';
import {
  ROLE_DEFINITIONS,
  PERMISSION_BUNDLES,
  hasPermission,
  checkPermissions,
  getRolePermissions,
  getRoleCapabilities,
  canPerformAction,
  FEATURES,
  ACTIONS,
} from './permissions-v2';

export class StorePermissionsV2 {
  /**
   * Convert old role to new permission system
   */
  static convertRoleToPermissions(role) {
    const roleDefinition = ROLE_DEFINITIONS[role];
    if (!roleDefinition) {
      // Default to viewer if role not found
      return ROLE_DEFINITIONS.viewer.permissions;
    }
    return roleDefinition.permissions;
  }

  /**
   * Convert old permission flags to new feature:action format
   */
  static convertOldPermissions(oldPermissions) {
    const newPermissions = [];
    
    // Map old flags to new permissions
    const mappings = {
      canEditStore: ['settings:edit', 'settings:manage'],
      canManageUsers: ['accounts:manage', 'accounts:edit', 'accounts:create', 'accounts:delete'],
      canViewAnalytics: ['analytics:view'],
      canCreateCampaigns: ['campaigns:create'],
      canManageIntegrations: ['settings:manage'],
      canDeleteStore: ['settings:delete', 'billing:manage'],
      canManageBilling: ['billing:manage', 'billing:edit'],
      canExportData: ['analytics:export'],
      canViewRevenue: ['analytics:view', 'dashboard:view'],
      canEditSettings: ['settings:edit'],
      canManageWebhooks: ['settings:manage'],
      canAccessAPI: ['settings:manage'],
    };
    
    Object.entries(oldPermissions).forEach(([flag, value]) => {
      if (value && mappings[flag]) {
        newPermissions.push(...mappings[flag]);
      }
    });
    
    // Remove duplicates
    return [...new Set(newPermissions)];
  }

  /**
   * Check if user has specific permission for a store
   */
  static async userHasPermission(userId, storeId, permission) {
    const storePermissions = await UserModel.getUserStorePermissions(userId, storeId);
    
    if (!storePermissions) {
      return false;
    }
    
    // Get user's permissions for this store
    let permissions = storePermissions.permissions_v2 || [];
    
    // If no v2 permissions, convert from old system
    if (permissions.length === 0 && storePermissions.role) {
      permissions = this.convertRoleToPermissions(storePermissions.role);
    } else if (permissions.length === 0 && storePermissions.permissions) {
      permissions = this.convertOldPermissions(storePermissions.permissions);
    }
    
    // Check permission
    return hasPermission(permission, permissions);
  }

  /**
   * Check if user can perform action on feature for a store
   */
  static async userCanPerformAction(userId, storeId, feature, action) {
    const permission = `${feature}:${action}`;
    return this.userHasPermission(userId, storeId, permission);
  }

  /**
   * Get all permissions for a user in a store
   */
  static async getUserStorePermissions(userId, storeId) {
    const storePermissions = await UserModel.getUserStorePermissions(userId, storeId);
    
    if (!storePermissions) {
      return null;
    }
    
    // Get permissions_v2 or convert from old system
    let permissions = storePermissions.permissions_v2 || [];
    
    if (permissions.length === 0) {
      if (storePermissions.role) {
        permissions = this.convertRoleToPermissions(storePermissions.role);
      } else if (storePermissions.permissions) {
        permissions = this.convertOldPermissions(storePermissions.permissions);
      }
    }
    
    return {
      role: storePermissions.role,
      permissions: permissions,
      dataScope: storePermissions.data_scope || ROLE_DEFINITIONS[storePermissions.role]?.dataScope || 'own_account',
      capabilities: getRoleCapabilities(storePermissions.role),
      grantedBy: storePermissions.granted_by,
      grantedAt: storePermissions.granted_at,
    };
  }

  /**
   * Grant store access to a user with new permission system
   */
  static async grantStoreAccess(userId, storeId, role, grantedBy, customPermissions = null) {
    // Get permissions for the role
    let permissions = customPermissions || getRolePermissions(role);
    const roleDefinition = ROLE_DEFINITIONS[role];
    
    if (!permissions || permissions.length === 0) {
      throw new Error(`Invalid role: ${role}`);
    }
    
    // Prepare the permission object
    const permissionData = {
      store_id: storeId,
      role: role,
      permissions_v2: permissions,
      data_scope: roleDefinition?.dataScope || 'own_account',
      // Keep old permissions for backward compatibility
      permissions: this.convertPermissionsToOldFlags(permissions),
      granted_by: grantedBy,
      granted_at: new Date(),
    };
    
    return await UserModel.addStorePermissionV2(userId, permissionData);
  }

  /**
   * Update user's role in a store with new permissions
   */
  static async updateUserRole(userId, storeId, newRole, customPermissions = null) {
    const permissions = customPermissions || getRolePermissions(newRole);
    const roleDefinition = ROLE_DEFINITIONS[newRole];
    
    if (!permissions || permissions.length === 0) {
      throw new Error(`Invalid role: ${newRole}`);
    }
    
    const updateData = {
      role: newRole,
      permissions_v2: permissions,
      data_scope: roleDefinition?.dataScope || 'own_account',
      // Keep old permissions for backward compatibility
      permissions: this.convertPermissionsToOldFlags(permissions),
    };
    
    return await UserModel.updateStorePermission(userId, storeId, updateData);
  }

  /**
   * Grant specific permissions without changing role
   */
  static async grantPermissions(userId, storeId, permissions) {
    const currentPermissions = await this.getUserStorePermissions(userId, storeId);
    
    if (!currentPermissions) {
      throw new Error('User has no access to this store');
    }
    
    // Merge new permissions with existing
    const updatedPermissions = [...new Set([...currentPermissions.permissions, ...permissions])];
    
    return await UserModel.updateStorePermission(userId, storeId, {
      permissions_v2: updatedPermissions,
      permissions: this.convertPermissionsToOldFlags(updatedPermissions),
    });
  }

  /**
   * Revoke specific permissions without changing role
   */
  static async revokePermissions(userId, storeId, permissions) {
    const currentPermissions = await this.getUserStorePermissions(userId, storeId);
    
    if (!currentPermissions) {
      throw new Error('User has no access to this store');
    }
    
    // Remove specified permissions
    const updatedPermissions = currentPermissions.permissions.filter(p => !permissions.includes(p));
    
    return await UserModel.updateStorePermission(userId, storeId, {
      permissions_v2: updatedPermissions,
      permissions: this.convertPermissionsToOldFlags(updatedPermissions),
    });
  }

  /**
   * Check multiple permissions at once
   */
  static async checkPermissions(userId, storeId, permissions) {
    const storePermissions = await this.getUserStorePermissions(userId, storeId);
    
    if (!storePermissions) {
      return permissions.reduce((acc, perm) => {
        acc[perm] = false;
        return acc;
      }, {});
    }
    
    return checkPermissions(permissions, storePermissions.permissions);
  }

  /**
   * Apply permission bundle to user
   */
  static async applyPermissionBundle(userId, storeId, bundleName, grantedBy) {
    const bundle = PERMISSION_BUNDLES[bundleName];
    
    if (!bundle) {
      throw new Error(`Invalid permission bundle: ${bundleName}`);
    }
    
    const permissionData = {
      store_id: storeId,
      role: 'custom',
      bundle: bundleName,
      permissions_v2: bundle.permissions,
      data_scope: bundle.dataScope,
      permissions: this.convertPermissionsToOldFlags(bundle.permissions),
      granted_by: grantedBy,
      granted_at: new Date(),
    };
    
    return await UserModel.addStorePermissionV2(userId, permissionData);
  }

  /**
   * Convert new permissions to old flag format for backward compatibility
   */
  static convertPermissionsToOldFlags(permissions) {
    const flags = {
      canEditStore: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canCreateCampaigns: false,
      canManageIntegrations: false,
      canDeleteStore: false,
      canManageBilling: false,
      canExportData: false,
      canViewRevenue: false,
      canEditSettings: false,
      canManageWebhooks: false,
      canAccessAPI: false,
    };
    
    // Map new permissions to old flags
    permissions.forEach(permission => {
      if (permission === '*:*') {
        // Grant all permissions
        Object.keys(flags).forEach(key => {
          flags[key] = true;
        });
        return;
      }
      
      // Specific mappings
      if (hasPermission('settings:edit', [permission])) flags.canEditStore = true;
      if (hasPermission('settings:edit', [permission])) flags.canEditSettings = true;
      if (hasPermission('accounts:manage', [permission])) flags.canManageUsers = true;
      if (hasPermission('analytics:view', [permission])) flags.canViewAnalytics = true;
      if (hasPermission('analytics:view', [permission])) flags.canViewRevenue = true;
      if (hasPermission('campaigns:create', [permission])) flags.canCreateCampaigns = true;
      if (hasPermission('settings:manage', [permission])) flags.canManageIntegrations = true;
      if (hasPermission('settings:manage', [permission])) flags.canManageWebhooks = true;
      if (hasPermission('settings:manage', [permission])) flags.canAccessAPI = true;
      if (hasPermission('settings:delete', [permission])) flags.canDeleteStore = true;
      if (hasPermission('billing:manage', [permission])) flags.canManageBilling = true;
      if (hasPermission('analytics:export', [permission])) flags.canExportData = true;
    });
    
    return flags;
  }

  /**
   * Get available features for user in store
   */
  static async getUserFeatures(userId, storeId) {
    const permissions = await this.getUserStorePermissions(userId, storeId);
    
    if (!permissions) {
      return [];
    }
    
    const features = new Set();
    
    permissions.permissions.forEach(permission => {
      const [feature] = permission.split(':');
      if (feature && feature !== '*') {
        features.add(feature);
      }
    });
    
    // If user has *:*, they can access all features
    if (permissions.permissions.includes('*:*')) {
      Object.values(FEATURES).forEach(feature => features.add(feature));
    }
    
    return Array.from(features);
  }

  /**
   * Get available actions for a feature
   */
  static async getUserFeatureActions(userId, storeId, feature) {
    const permissions = await this.getUserStorePermissions(userId, storeId);
    
    if (!permissions) {
      return [];
    }
    
    const actions = new Set();
    
    // Check for wildcard permissions
    if (permissions.permissions.includes('*:*') || permissions.permissions.includes(`${feature}:*`)) {
      return Object.values(ACTIONS);
    }
    
    // Check specific permissions
    permissions.permissions.forEach(permission => {
      const [permFeature, action] = permission.split(':');
      if (permFeature === feature && action) {
        actions.add(action);
      }
    });
    
    return Array.from(actions);
  }
}
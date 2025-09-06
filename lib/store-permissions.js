import User from '../models/User.js';
import ContractSeat from '../models/ContractSeat.js';
import Store from '../models/Store.js';
import Role from '../models/Role.js';
import connectToDatabase from './mongoose.js';

export class StorePermissions {
  // Role hierarchy (higher number = more permissions) - mapped to new universal roles
  static ROLE_HIERARCHY = {
    viewer: 10,
    reviewer: 30, 
    creator: 40,
    manager: 60,
    admin: 80,
    owner: 100
  };

  // Legacy role mapping
  static LEGACY_ROLE_MAPPING = {
    editor: 'creator',
    member: 'viewer'
  };

  // Permission mapping from new role permissions to legacy permission names
  static PERMISSION_MAPPING = {
    canEditStore: ['stores.edit'],
    canManageUsers: ['team.invite_users', 'team.remove_users', 'team.manage_roles'],
    canViewAnalytics: ['analytics.view_own', 'analytics.view_all'],
    canCreateCampaigns: ['campaigns.create'],
    canManageIntegrations: ['stores.manage_integrations'],
    canDeleteStore: ['stores.delete'],
    canManageBilling: ['billing.manage'],
    canExportData: ['analytics.export']
  };

  /**
   * Check if user has specific permission for a store (updated for ContractSeat system)
   */
  static async userHasPermission(userId, storeId, permission) {
    try {
      await connectToDatabase();
      
      // Check if user is super admin
      const user = await User.findById(userId);
      if (user?.is_super_user || user?.super_user_role === 'SUPER_ADMIN') {
        return true;
      }
      
      // Get store to find contract
      const store = await Store.findById(storeId);
      if (!store) return false;
      
      // Find user's seat for this store's contract
      const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id,
        status: 'active'
      }).populate('default_role_id');
      
      if (!seat) {
        // Fall back to legacy permission check
        return await this._checkLegacyPermission(userId, storeId, permission);
      }
      
      // Check if user has specific store access
      const storeAccess = seat.store_access.find(access => 
        access.store_id.toString() === storeId.toString()
      );
      
      // If no specific store access but they have a seat, check default access
      if (!storeAccess && seat.store_access.length > 0) {
        return false; // User has restricted store access and this store isn't included
      }
      
      // Get the role to check (store-specific or default)
      const roleToCheck = storeAccess?.role_id ? 
        await Role.findById(storeAccess.role_id) : 
        seat.default_role_id;
      
      if (!roleToCheck) return false;
      
      // Check permission using new role system
      return this._checkRolePermission(roleToCheck, permission);
      
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  /**
   * Check if user has minimum role for a store (updated for ContractSeat system)
   */
  static async userHasMinimumRole(userId, storeId, requiredRole) {
    try {
      await connectToDatabase();
      
      // Map legacy role names
      const mappedRole = this.LEGACY_ROLE_MAPPING[requiredRole] || requiredRole;
      
      // Check if user is super admin
      const user = await User.findById(userId);
      if (user?.is_super_user || user?.super_user_role === 'SUPER_ADMIN') {
        return true;
      }
      
      // Get store to find contract
      const store = await Store.findById(storeId);
      if (!store) return false;
      
      // Find user's seat for this store's contract
      const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id,
        status: 'active'
      }).populate('default_role_id');
      
      if (!seat) {
        // Fall back to legacy role check
        return await this._checkLegacyRole(userId, storeId, requiredRole);
      }
      
      // Get the role to check
      const storeAccess = seat.store_access.find(access => 
        access.store_id.toString() === storeId.toString()
      );
      
      const roleToCheck = storeAccess?.role_id ? 
        await Role.findById(storeAccess.role_id) : 
        seat.default_role_id;
      
      if (!roleToCheck) return false;
      
      const userRoleLevel = roleToCheck.level || 0;
      const requiredRoleLevel = this.ROLE_HIERARCHY[mappedRole] || 999;
      
      return userRoleLevel >= requiredRoleLevel;
      
    } catch (error) {
      console.error('Error checking minimum role:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user in a store (updated for ContractSeat system)
   */
  static async getUserStorePermissions(userId, storeId) {
    try {
      await connectToDatabase();
      
      // Check if user is super admin
      const user = await User.findById(userId);
      if (user?.is_super_user || user?.super_user_role === 'SUPER_ADMIN') {
        return {
          role: 'owner',
          permissions: this.ROLE_PERMISSIONS?.owner || {},
          grantedBy: null,
          grantedAt: new Date(),
          isSuper: true
        };
      }
      
      // Get store to find contract
      const store = await Store.findById(storeId);
      if (!store) return null;
      
      // Find user's seat for this store's contract
      const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id,
        status: 'active'
      }).populate('default_role_id');
      
      if (!seat) {
        // Fall back to legacy permissions
        return await this._getLegacyUserPermissions(userId, storeId);
      }
      
      // Get store-specific access or default
      const storeAccess = seat.store_access.find(access => 
        access.store_id.toString() === storeId.toString()
      );
      
      const roleToUse = storeAccess?.role_id ? 
        await Role.findById(storeAccess.role_id) : 
        seat.default_role_id;
      
      if (!roleToUse) return null;
      
      // Convert new role permissions to legacy format
      const legacyPermissions = this._convertToLegacyPermissions(roleToUse);
      
      return {
        role: roleToUse.name,
        permissions: legacyPermissions,
        grantedBy: storeAccess?.access_granted_by || seat.invited_by,
        grantedAt: storeAccess?.access_granted_at || seat.created_at,
        roleLevel: roleToUse.level
      };
      
    } catch (error) {
      console.error('Error getting user store permissions:', error);
      return null;
    }
  }

  /**
   * Grant store access to a user (updated for ContractSeat system)
   */
  static async grantStoreAccess(userId, storeId, role, grantedBy) {
    try {
      await connectToDatabase();
      
      // Map legacy role names
      const mappedRole = this.LEGACY_ROLE_MAPPING[role] || role;
      
      // Get the role object
      const roleObj = await Role.findByName(mappedRole);
      if (!roleObj) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      // Get store to find contract
      const store = await Store.findById(storeId);
      if (!store) {
        throw new Error('Store not found');
      }
      
      // Find or create user's seat for this contract
      let seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id
      });
      
      if (!seat) {
        // Create new seat if user doesn't have one for this contract
        seat = new ContractSeat({
          contract_id: store.contract_id,
          user_id: userId,
          seat_type: 'additional',
          default_role_id: roleObj._id,
          invited_by: grantedBy,
          status: 'active'
        });
      }
      
      // Grant store access
      seat.grantStoreAccess(storeId, roleObj._id, grantedBy);
      await seat.save();
      
      // Update user's active seats if needed
      const user = await User.findById(userId);
      if (user) {
        const contract = await Contract.findById(store.contract_id);
        user.addSeat(store.contract_id, contract?.contract_name || 'Unknown Contract', seat._id);
        await user.save();
      }
      
      // Sync store team members
      await store.syncTeamMembers();
      
      return {
        role: mappedRole,
        permissions: this._convertToLegacyPermissions(roleObj),
        grantedBy: grantedBy,
        grantedAt: new Date()
      };
      
    } catch (error) {
      console.error('Error granting store access:', error);
      throw error;
    }
  }

  /**
   * Update user's role in a store (updated for ContractSeat system)
   */
  static async updateUserRole(userId, storeId, newRole) {
    try {
      await connectToDatabase();
      
      // Map legacy role names
      const mappedRole = this.LEGACY_ROLE_MAPPING[newRole] || newRole;
      
      // Get the role object
      const roleObj = await Role.findByName(mappedRole);
      if (!roleObj) {
        throw new Error(`Invalid role: ${newRole}`);
      }
      
      // Get store to find contract
      const store = await Store.findById(storeId);
      if (!store) {
        throw new Error('Store not found');
      }
      
      // Find user's seat
      const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id,
        status: 'active'
      });
      
      if (!seat) {
        throw new Error('User does not have access to this contract');
      }
      
      // Update store access role
      const storeAccess = seat.store_access.find(access => 
        access.store_id.toString() === storeId.toString()
      );
      
      if (storeAccess) {
        storeAccess.role_id = roleObj._id;
        storeAccess.access_granted_at = new Date();
      } else {
        // If no specific store access, update default role for this contract
        seat.default_role_id = roleObj._id;
      }
      
      await seat.save();
      
      // Sync store team members
      await store.syncTeamMembers();
      
      return {
        role: mappedRole,
        permissions: this._convertToLegacyPermissions(roleObj)
      };
      
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Revoke store access from a user (updated for ContractSeat system)
   */
  static async revokeStoreAccess(userId, storeId) {
    try {
      await connectToDatabase();
      
      // Get store to find contract
      const store = await Store.findById(storeId);
      if (!store) {
        throw new Error('Store not found');
      }
      
      // Find user's seat
      const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id,
        status: 'active'
      });
      
      if (!seat) {
        // Fall back to legacy removal
        return await this._removeLegacyPermission(userId, storeId);
      }
      
      // Revoke store access
      seat.revokeStoreAccess(storeId);
      await seat.save();
      
      // Sync store team members
      await store.syncTeamMembers();
      
      return true;
      
    } catch (error) {
      console.error('Error revoking store access:', error);
      throw error;
    }
  }

  /**
   * Check multiple permissions at once (updated for ContractSeat system)
   */
  static async checkPermissions(userId, storeId, permissions) {
    try {
      const results = {};
      
      for (const permission of permissions) {
        results[permission] = await this.userHasPermission(userId, storeId, permission);
      }
      
      return results;
      
    } catch (error) {
      console.error('Error checking multiple permissions:', error);
      return permissions.reduce((acc, perm) => {
        acc[perm] = false;
        return acc;
      }, {});
    }
  }
  
  // Helper methods for new role system
  
  /**
   * Check if a role has a specific permission
   */
  static _checkRolePermission(role, permission) {
    const permissionPaths = this.PERMISSION_MAPPING[permission];
    if (!permissionPaths) return false;
    
    for (const path of permissionPaths) {
      const [category, action] = path.split('.');
      if (role.permissions?.[category]?.[action] === true) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Convert new role permissions to legacy format
   */
  static _convertToLegacyPermissions(role) {
    const legacyPermissions = {};
    
    for (const [legacyPerm, newPaths] of Object.entries(this.PERMISSION_MAPPING)) {
      legacyPermissions[legacyPerm] = newPaths.some(path => {
        const [category, action] = path.split('.');
        return role.permissions?.[category]?.[action] === true;
      });
    }
    
    return legacyPermissions;
  }
  
  // Legacy fallback methods
  
  /**
   * Check legacy permission system
   */
  static async _checkLegacyPermission(userId, storeId, permission) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;
      
      return user.hasStoreAccess(storeId, permission);
    } catch (error) {
      console.error('Error checking legacy permission:', error);
      return false;
    }
  }
  
  /**
   * Check legacy role system
   */
  static async _checkLegacyRole(userId, storeId, requiredRole) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;
      
      // Check store_permissions array
      const storePermission = user.store_permissions?.find(perm => 
        perm.store_id.toString() === storeId.toString()
      );
      
      if (storePermission) {
        const userRoleLevel = this.ROLE_HIERARCHY[storePermission.role] || 0;
        const requiredRoleLevel = this.ROLE_HIERARCHY[requiredRole] || 999;
        return userRoleLevel >= requiredRoleLevel;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking legacy role:', error);
      return false;
    }
  }
  
  /**
   * Get legacy user permissions
   */
  static async _getLegacyUserPermissions(userId, storeId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      
      const storePermission = user.store_permissions?.find(perm => 
        perm.store_id.toString() === storeId.toString()
      );
      
      if (storePermission) {
        return {
          role: storePermission.role,
          permissions: this.ROLE_PERMISSIONS[storePermission.role] || {},
          grantedBy: storePermission.granted_by,
          grantedAt: storePermission.granted_at,
          isLegacy: true
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting legacy permissions:', error);
      return null;
    }
  }
  
  /**
   * Remove legacy permission
   */
  static async _removeLegacyPermission(userId, storeId) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;
      
      user.store_permissions = user.store_permissions?.filter(perm => 
        perm.store_id.toString() !== storeId.toString()
      );
      
      await user.save();
      return true;
    } catch (error) {
      console.error('Error removing legacy permission:', error);
      return false;
    }
  }
}
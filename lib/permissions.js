// Legacy permissions bridge for backward compatibility
import { FEATURES, ACTIONS, hasPermission as hasPermissionV2 } from './permissions-v2';

// Legacy permission constants mapped to new system
export const PERMISSIONS = {
  VIEW_ANALYTICS: 'analytics:view',
  VIEW_CAMPAIGNS: 'campaigns:view',
  CREATE_CAMPAIGNS: 'campaigns:create',
  EDIT_CAMPAIGNS: 'campaigns:edit',
  DELETE_CAMPAIGNS: 'campaigns:delete',
  VIEW_DASHBOARD: 'dashboard:view',
  VIEW_TEMPLATES: 'templates:view',
  CREATE_TEMPLATES: 'templates:create',
  EDIT_TEMPLATES: 'templates:edit',
  DELETE_TEMPLATES: 'templates:delete',
  VIEW_CONTENT: 'content:view',
  CREATE_CONTENT: 'content:create',
  EDIT_CONTENT: 'content:edit',
  DELETE_CONTENT: 'content:delete',
  VIEW_ACCOUNTS: 'accounts:view',
  MANAGE_ACCOUNTS: 'accounts:manage',
  VIEW_SETTINGS: 'settings:view',
  MANAGE_SETTINGS: 'settings:manage',
  VIEW_BILLING: 'billing:view',
  MANAGE_BILLING: 'billing:manage',
};

// Legacy hasPermission function for compatibility
export function hasPermission(userAccess, requiredPermission) {
  // If userAccess has permissions array, use it directly
  if (userAccess && Array.isArray(userAccess.permissions)) {
    return hasPermissionV2(requiredPermission, userAccess.permissions);
  }
  
  // If userAccess has the permission directly as a property
  if (userAccess && userAccess[requiredPermission]) {
    return true;
  }
  
  // Check if it's a permission string and user has it
  if (typeof userAccess === 'object' && userAccess.permissions) {
    return hasPermissionV2(requiredPermission, userAccess.permissions);
  }
  
  // Fallback: assume no permission
  return false;
}

// Re-export new system for those who want to use it
export { FEATURES, ACTIONS, hasPermission as hasPermissionV2 } from './permissions-v2';
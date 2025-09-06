/**
 * Permission System v2 - Feature × Action Matrix
 * 8 Features × 9 Actions = 72 possible permissions
 */

// ============= FEATURES (8) =============
export const FEATURES = {
  DASHBOARD: 'dashboard',
  TEMPLATES: 'templates',
  CAMPAIGNS: 'campaigns',
  CONTENT: 'content',
  ANALYTICS: 'analytics',
  ACCOUNTS: 'accounts',
  SETTINGS: 'settings',
  BILLING: 'billing',
};

// ============= ACTIONS (9) =============
export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  PUBLISH: 'publish',
  EXPORT: 'export',
  MANAGE: 'manage',
  DISTRIBUTE: 'distribute',
};

// ============= ROLE DEFINITIONS =============
export const ROLE_DEFINITIONS = {
  // Level 100 - Full Control
  owner: {
    level: 100,
    name: 'Owner',
    permissions: ['*:*'], // All permissions
    dataScope: 'global',
    capabilities: {
      canManageSubAccounts: true,
      canCreateSubAccounts: true,
      canDeleteAccount: true,
      canManageBilling: true,
      canViewAllData: true,
      canOverrideRestrictions: true,
    },
  },

  // Level 90 - Administrative
  admin: {
    level: 90,
    name: 'Admin',
    permissions: [
      'dashboard:*',
      'templates:*',
      'campaigns:*',
      'content:*',
      'analytics:*',
      'accounts:*',
      'settings:*',
      'billing:view',
    ],
    dataScope: 'organization',
    capabilities: {
      canManageSubAccounts: true,
      canViewAllData: true,
      canManageIntegrations: true,
    },
  },

  // Level 80 - Management
  manager: {
    level: 80,
    name: 'Manager',
    permissions: [
      'dashboard:view',
      'templates:*',
      'campaigns:*',
      'content:*',
      'analytics:view',
      'analytics:export',
      'accounts:view',
      'accounts:edit',
      'settings:view',
    ],
    dataScope: 'assigned_accounts',
    capabilities: {
      canApproveContent: true,
      canAssignWork: true,
      canManageTeam: true,
      canDistributeTemplates: true,
    },
  },

  // Level 70 - Brand Guardian
  brand_guardian: {
    level: 70,
    name: 'Brand Guardian',
    permissions: [
      'dashboard:view',
      'templates:view',
      'templates:edit',
      'templates:approve',
      'templates:distribute',
      'campaigns:view',
      'campaigns:approve',
      'content:view',
      'content:approve',
      'analytics:view',
    ],
    dataScope: 'organization',
    capabilities: {
      canLockTemplates: true,
      canEnforceBrandStandards: true,
      canApproveContent: true,
    },
  },

  // Level 60 - Content Creator
  creator: {
    level: 60,
    name: 'Creator',
    permissions: [
      'dashboard:view',
      'templates:view',
      'templates:create',
      'templates:edit',
      'campaigns:create',
      'campaigns:edit',
      'content:create',
      'content:edit',
      'analytics:view',
    ],
    dataScope: 'assigned_accounts',
    capabilities: {
      canCreateContent: true,
      requiresApproval: true,
    },
  },

  // Level 50 - Publisher
  publisher: {
    level: 50,
    name: 'Publisher',
    permissions: [
      'dashboard:view',
      'templates:view',
      'campaigns:view',
      'campaigns:publish',
      'content:view',
      'content:publish',
      'analytics:view',
    ],
    dataScope: 'assigned_accounts',
    capabilities: {
      canPublishContent: true,
      requiresApproval: false,
    },
  },

  // Level 40 - Reviewer
  reviewer: {
    level: 40,
    name: 'Reviewer',
    permissions: [
      'dashboard:view',
      'templates:view',
      'campaigns:view',
      'campaigns:approve',
      'content:view',
      'content:approve',
      'analytics:view',
    ],
    dataScope: 'assigned_accounts',
    capabilities: {
      canApproveContent: true,
      canRequestChanges: true,
    },
  },

  // Level 30 - Analyst
  analyst: {
    level: 30,
    name: 'Analyst',
    permissions: [
      'dashboard:view',
      'campaigns:view',
      'content:view',
      'analytics:*',
    ],
    dataScope: 'assigned_accounts',
    capabilities: {
      canExportData: true,
      canCreateReports: true,
    },
  },

  // Level 20 - Viewer
  viewer: {
    level: 20,
    name: 'Viewer',
    permissions: [
      'dashboard:view',
      'templates:view',
      'campaigns:view',
      'content:view',
      'analytics:view',
    ],
    dataScope: 'assigned_accounts',
    capabilities: {
      readOnlyAccess: true,
    },
  },

  // Level 10 - Guest
  guest: {
    level: 10,
    name: 'Guest',
    permissions: [
      'dashboard:view',
      'content:view',
    ],
    dataScope: 'specific_items',
    capabilities: {
      limitedAccess: true,
      timeRestricted: true,
    },
  },
};

// ============= PERMISSION BUNDLES =============
export const PERMISSION_BUNDLES = {
  // Agency bundles
  AGENCY_OWNER: {
    name: 'Agency Owner',
    permissions: ['*:*'],
    dataScope: 'global',
  },
  
  AGENCY_MANAGER: {
    name: 'Agency Manager',
    permissions: [
      'accounts:*',
      'templates:*',
      'campaigns:*',
      'content:*',
      'analytics:view',
      'analytics:export',
    ],
    dataScope: 'assigned_accounts',
  },

  CLIENT_MANAGER: {
    name: 'Client Manager',
    permissions: [
      'accounts:view',
      'accounts:edit',
      'templates:distribute',
      'campaigns:approve',
      'analytics:view',
      'analytics:export',
      'content:approve',
    ],
    dataScope: 'assigned_accounts',
  },

  // Franchise bundles
  FRANCHISOR: {
    name: 'Franchisor',
    permissions: ['*:*'],
    dataScope: 'global',
  },

  REGIONAL_MANAGER: {
    name: 'Regional Manager',
    permissions: [
      'dashboard:view',
      'templates:distribute',
      'campaigns:approve',
      'content:approve',
      'analytics:*',
      'accounts:view',
      'accounts:edit',
    ],
    dataScope: 'assigned_accounts',
  },

  FRANCHISEE: {
    name: 'Franchisee',
    permissions: [
      'dashboard:view',
      'templates:view',
      'campaigns:create',
      'campaigns:edit',
      'content:create',
      'content:edit',
      'analytics:view',
    ],
    dataScope: 'own_account',
  },

  // Enterprise bundles
  EXECUTIVE: {
    name: 'Executive',
    permissions: [
      'dashboard:view',
      'analytics:*',
      'billing:view',
    ],
    dataScope: 'global',
  },

  DEPARTMENT_HEAD: {
    name: 'Department Head',
    permissions: [
      'dashboard:view',
      'templates:*',
      'campaigns:*',
      'content:*',
      'analytics:*',
      'accounts:view',
      'accounts:edit',
    ],
    dataScope: 'department',
  },

  TEAM_LEAD: {
    name: 'Team Lead',
    permissions: [
      'dashboard:view',
      'templates:create',
      'templates:edit',
      'campaigns:create',
      'campaigns:edit',
      'campaigns:approve',
      'content:*',
      'analytics:view',
    ],
    dataScope: 'team',
  },
};

// ============= DATA SCOPES =============
export const DATA_SCOPES = {
  SYSTEM: 'system',           // Level 999 - Entire system
  GLOBAL: 'global',           // Level 100 - All data in organization
  ORGANIZATION: 'organization', // Level 90 - All org data
  ASSIGNED_ACCOUNTS: 'assigned_accounts', // Level 70 - Specific accounts
  DEPARTMENT: 'department',    // Level 50 - Department data
  TEAM: 'team',               // Level 40 - Team members' data
  OWN_ACCOUNT: 'own_account',  // Level 30 - Single account
  OWN_CONTENT: 'own_content',  // Level 20 - Created content only
  SPECIFIC_ITEMS: 'specific_items', // Level 10 - Shared items only
};

// ============= HELPER FUNCTIONS =============

/**
 * Check if a user has a specific permission
 * @param {string} permission - Format: "feature:action" (e.g., "templates:edit")
 * @param {Array} userPermissions - User's permission array
 * @returns {boolean}
 */
export function hasPermission(permission, userPermissions = []) {
  // Super permission
  if (userPermissions.includes('*:*')) return true;
  
  // Direct permission
  if (userPermissions.includes(permission)) return true;
  
  // Wildcard feature permission (e.g., "templates:*")
  const [feature] = permission.split(':');
  if (userPermissions.includes(`${feature}:*`)) return true;
  
  return false;
}

/**
 * Check multiple permissions at once
 * @param {Array} permissions - Array of permissions to check
 * @param {Array} userPermissions - User's permission array
 * @returns {Object} Object with permission results
 */
export function checkPermissions(permissions, userPermissions = []) {
  const results = {};
  permissions.forEach(permission => {
    results[permission] = hasPermission(permission, userPermissions);
  });
  return results;
}

/**
 * Get permissions for a role
 * @param {string} roleId - Role identifier
 * @returns {Array} Array of permissions
 */
export function getRolePermissions(roleId) {
  const role = ROLE_DEFINITIONS[roleId];
  return role ? role.permissions : [];
}

/**
 * Get role capabilities
 * @param {string} roleId - Role identifier
 * @returns {Object} Role capabilities
 */
export function getRoleCapabilities(roleId) {
  const role = ROLE_DEFINITIONS[roleId];
  return role ? role.capabilities : {};
}

/**
 * Check if user can perform action on feature
 * @param {string} feature - Feature name
 * @param {string} action - Action name
 * @param {Array} userPermissions - User's permission array
 * @returns {boolean}
 */
export function canPerformAction(feature, action, userPermissions = []) {
  const permission = `${feature}:${action}`;
  return hasPermission(permission, userPermissions);
}

/**
 * Get all available permissions
 * @returns {Array} Array of all possible permissions
 */
export function getAllPermissions() {
  const permissions = [];
  Object.values(FEATURES).forEach(feature => {
    Object.values(ACTIONS).forEach(action => {
      permissions.push(`${feature}:${action}`);
    });
  });
  return permissions;
}

/**
 * Parse permission string
 * @param {string} permission - Format: "feature:action"
 * @returns {Object} { feature, action }
 */
export function parsePermission(permission) {
  const [feature, action] = permission.split(':');
  return { feature, action };
}

/**
 * Create permission string
 * @param {string} feature - Feature name
 * @param {string} action - Action name
 * @returns {string} Permission string
 */
export function createPermission(feature, action) {
  return `${feature}:${action}`;
}

/**
 * Check if role can manage another role
 * @param {string} managerRoleId - Manager's role ID
 * @param {string} targetRoleId - Target role ID
 * @returns {boolean}
 */
export function canManageRole(managerRoleId, targetRoleId) {
  const managerRole = ROLE_DEFINITIONS[managerRoleId];
  const targetRole = ROLE_DEFINITIONS[targetRoleId];
  
  if (!managerRole || !targetRole) return false;
  
  // Can only manage roles with lower level
  return managerRole.level > targetRole.level;
}

/**
 * Filter features based on permissions
 * @param {Array} userPermissions - User's permission array
 * @returns {Array} Array of accessible features
 */
export function getAccessibleFeatures(userPermissions = []) {
  const features = new Set();
  
  userPermissions.forEach(permission => {
    const { feature } = parsePermission(permission);
    if (feature && feature !== '*') {
      features.add(feature);
    }
  });
  
  // If user has *:*, they can access all features
  if (userPermissions.includes('*:*')) {
    Object.values(FEATURES).forEach(feature => features.add(feature));
  }
  
  return Array.from(features);
}

/**
 * Get actions available for a feature
 * @param {string} feature - Feature name
 * @param {Array} userPermissions - User's permission array
 * @returns {Array} Array of available actions
 */
export function getFeatureActions(feature, userPermissions = []) {
  const actions = new Set();
  
  // Check for wildcard permissions
  if (userPermissions.includes('*:*') || userPermissions.includes(`${feature}:*`)) {
    return Object.values(ACTIONS);
  }
  
  // Check specific permissions
  userPermissions.forEach(permission => {
    const parsed = parsePermission(permission);
    if (parsed.feature === feature) {
      actions.add(parsed.action);
    }
  });
  
  return Array.from(actions);
}
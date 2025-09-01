// Comprehensive permissions configuration
export const FEATURES = {
  DASHBOARD: 'dashboard',
  STORES: 'stores',
  CALENDAR: 'calendar',
  MULTI_ACCOUNT: 'multi_account',
  REPORTS: 'reports',
  EMAIL_BUILDER: 'email_builder',
  ANALYTICS: 'analytics',
  CAMPAIGNS: 'campaigns',
  FLOWS: 'flows',
  FORMS: 'forms',
  SEGMENTS: 'segments',
  SETTINGS: 'settings',
  USERS: 'users',
  BILLING: 'billing',
  PERMISSIONS: 'permissions'
};

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  PUBLISH: 'publish',
  EXPORT: 'export',
  IMPORT: 'import',
  SHARE: 'share',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  MANAGE: 'manage'
};

// Data scope determines what data users can access
export const DATA_SCOPES = {
  GLOBAL: 'global',           // Access all data across organization
  ORGANIZATION: 'organization', // Access organization-level data
  DEPARTMENT: 'department',     // Access department data
  TEAM: 'team',                // Access team data
  ASSIGNED: 'assigned',        // Access only assigned items
  OWN: 'own'                   // Access only own created items
};

// Pre-configured role templates
export const ROLE_TEMPLATES = {
  // Super Admin - Full system access
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Complete system access with all permissions',
    level: 0, // Highest level
    dataScope: DATA_SCOPES.GLOBAL,
    permissions: ['*:*'], // Wildcard for all permissions
    dashboardAccess: {
      overview: true,
      stores: true,
      calendar: true,
      multiAccount: true,
      reports: true,
      emailBuilder: true,
      analytics: true,
      campaigns: true,
      flows: true,
      settings: true,
      users: true,
      billing: true,
      permissions: true
    },
    isSystem: true,
    canManageRoles: true,
    canViewAuditLogs: true,
    canImpersonate: true
  },

  // Organization Admin
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    description: 'Organization administrator with broad access',
    level: 1,
    dataScope: DATA_SCOPES.ORGANIZATION,
    permissions: [
      `${FEATURES.DASHBOARD}:*`,
      `${FEATURES.STORES}:*`,
      `${FEATURES.CALENDAR}:*`,
      `${FEATURES.MULTI_ACCOUNT}:*`,
      `${FEATURES.REPORTS}:*`,
      `${FEATURES.EMAIL_BUILDER}:*`,
      `${FEATURES.ANALYTICS}:*`,
      `${FEATURES.CAMPAIGNS}:*`,
      `${FEATURES.FLOWS}:*`,
      `${FEATURES.USERS}:${ACTIONS.VIEW}`,
      `${FEATURES.USERS}:${ACTIONS.EDIT}`,
      `${FEATURES.SETTINGS}:${ACTIONS.VIEW}`,
      `${FEATURES.SETTINGS}:${ACTIONS.EDIT}`
    ],
    dashboardAccess: {
      overview: true,
      stores: true,
      calendar: true,
      multiAccount: true,
      reports: true,
      emailBuilder: true,
      analytics: true,
      campaigns: true,
      flows: true,
      settings: true,
      users: true,
      billing: false,
      permissions: false
    },
    canManageRoles: false,
    canViewAuditLogs: true,
    canImpersonate: false
  },

  // Manager Role
  MANAGER: {
    id: 'manager',
    name: 'Manager',
    description: 'Manage teams and approve content',
    level: 2,
    dataScope: DATA_SCOPES.DEPARTMENT,
    permissions: [
      `${FEATURES.DASHBOARD}:${ACTIONS.VIEW}`,
      `${FEATURES.STORES}:${ACTIONS.VIEW}`,
      `${FEATURES.STORES}:${ACTIONS.EDIT}`,
      `${FEATURES.CALENDAR}:*`,
      `${FEATURES.MULTI_ACCOUNT}:${ACTIONS.VIEW}`,
      `${FEATURES.REPORTS}:*`,
      `${FEATURES.EMAIL_BUILDER}:*`,
      `${FEATURES.ANALYTICS}:${ACTIONS.VIEW}`,
      `${FEATURES.ANALYTICS}:${ACTIONS.EXPORT}`,
      `${FEATURES.CAMPAIGNS}:*`,
      `${FEATURES.FLOWS}:${ACTIONS.VIEW}`,
      `${FEATURES.FLOWS}:${ACTIONS.EDIT}`,
      `${FEATURES.FLOWS}:${ACTIONS.APPROVE}`
    ],
    dashboardAccess: {
      overview: true,
      stores: true,
      calendar: true,
      multiAccount: true,
      reports: true,
      emailBuilder: true,
      analytics: true,
      campaigns: true,
      flows: true,
      settings: false,
      users: false,
      billing: false,
      permissions: false
    },
    canManageRoles: false,
    canViewAuditLogs: false,
    canImpersonate: false
  },

  // Editor Role
  EDITOR: {
    id: 'editor',
    name: 'Editor',
    description: 'Create and edit content',
    level: 3,
    dataScope: DATA_SCOPES.TEAM,
    permissions: [
      `${FEATURES.DASHBOARD}:${ACTIONS.VIEW}`,
      `${FEATURES.STORES}:${ACTIONS.VIEW}`,
      `${FEATURES.CALENDAR}:${ACTIONS.VIEW}`,
      `${FEATURES.CALENDAR}:${ACTIONS.CREATE}`,
      `${FEATURES.CALENDAR}:${ACTIONS.EDIT}`,
      `${FEATURES.EMAIL_BUILDER}:${ACTIONS.VIEW}`,
      `${FEATURES.EMAIL_BUILDER}:${ACTIONS.CREATE}`,
      `${FEATURES.EMAIL_BUILDER}:${ACTIONS.EDIT}`,
      `${FEATURES.CAMPAIGNS}:${ACTIONS.VIEW}`,
      `${FEATURES.CAMPAIGNS}:${ACTIONS.CREATE}`,
      `${FEATURES.CAMPAIGNS}:${ACTIONS.EDIT}`,
      `${FEATURES.ANALYTICS}:${ACTIONS.VIEW}`,
      `${FEATURES.REPORTS}:${ACTIONS.VIEW}`
    ],
    dashboardAccess: {
      overview: true,
      stores: true,
      calendar: true,
      multiAccount: false,
      reports: true,
      emailBuilder: true,
      analytics: true,
      campaigns: true,
      flows: false,
      settings: false,
      users: false,
      billing: false,
      permissions: false
    },
    canManageRoles: false,
    canViewAuditLogs: false,
    canImpersonate: false
  },

  // Viewer Role
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    description: 'View-only access to reports and analytics',
    level: 4,
    dataScope: DATA_SCOPES.ASSIGNED,
    permissions: [
      `${FEATURES.DASHBOARD}:${ACTIONS.VIEW}`,
      `${FEATURES.STORES}:${ACTIONS.VIEW}`,
      `${FEATURES.CALENDAR}:${ACTIONS.VIEW}`,
      `${FEATURES.REPORTS}:${ACTIONS.VIEW}`,
      `${FEATURES.ANALYTICS}:${ACTIONS.VIEW}`,
      `${FEATURES.CAMPAIGNS}:${ACTIONS.VIEW}`
    ],
    dashboardAccess: {
      overview: true,
      stores: true,
      calendar: true,
      multiAccount: false,
      reports: true,
      emailBuilder: false,
      analytics: true,
      campaigns: true,
      flows: false,
      settings: false,
      users: false,
      billing: false,
      permissions: false
    },
    canManageRoles: false,
    canViewAuditLogs: false,
    canImpersonate: false
  },

  // Guest Role
  GUEST: {
    id: 'guest',
    name: 'Guest',
    description: 'Limited view-only access',
    level: 5,
    dataScope: DATA_SCOPES.OWN,
    permissions: [
      `${FEATURES.DASHBOARD}:${ACTIONS.VIEW}`,
      `${FEATURES.ANALYTICS}:${ACTIONS.VIEW}`
    ],
    dashboardAccess: {
      overview: true,
      stores: false,
      calendar: false,
      multiAccount: false,
      reports: false,
      emailBuilder: false,
      analytics: true,
      campaigns: false,
      flows: false,
      settings: false,
      users: false,
      billing: false,
      permissions: false
    },
    canManageRoles: false,
    canViewAuditLogs: false,
    canImpersonate: false
  }
};

// Organization-specific role mappings
export const ORGANIZATION_ROLES = {
  AGENCY: {
    AGENCY_OWNER: {
      ...ROLE_TEMPLATES.SUPER_ADMIN,
      id: 'agency_owner',
      name: 'Agency Owner',
      description: 'Full control over agency and all client accounts'
    },
    ACCOUNT_MANAGER: {
      ...ROLE_TEMPLATES.MANAGER,
      id: 'account_manager',
      name: 'Account Manager',
      description: 'Manage specific client accounts',
      dataScope: DATA_SCOPES.ASSIGNED
    },
    CREATIVE: {
      ...ROLE_TEMPLATES.EDITOR,
      id: 'creative',
      name: 'Creative',
      description: 'Create content for client accounts'
    },
    ANALYST: {
      ...ROLE_TEMPLATES.VIEWER,
      id: 'analyst',
      name: 'Analyst',
      description: 'View and analyze client data',
      permissions: [
        ...ROLE_TEMPLATES.VIEWER.permissions,
        `${FEATURES.ANALYTICS}:${ACTIONS.EXPORT}`,
        `${FEATURES.REPORTS}:${ACTIONS.EXPORT}`
      ]
    }
  },

  FRANCHISE: {
    CORPORATE_ADMIN: {
      ...ROLE_TEMPLATES.SUPER_ADMIN,
      id: 'corporate_admin',
      name: 'Corporate Administrator',
      description: 'Full control over franchise system'
    },
    BRAND_GUARDIAN: {
      ...ROLE_TEMPLATES.ADMIN,
      id: 'brand_guardian',
      name: 'Brand Guardian',
      description: 'Protect brand consistency across locations',
      permissions: [
        ...ROLE_TEMPLATES.ADMIN.permissions,
        `${FEATURES.EMAIL_BUILDER}:${ACTIONS.LOCK}`,
        `${FEATURES.EMAIL_BUILDER}:${ACTIONS.UNLOCK}`
      ]
    },
    REGIONAL_MANAGER: {
      ...ROLE_TEMPLATES.MANAGER,
      id: 'regional_manager',
      name: 'Regional Manager',
      description: 'Manage multiple franchise locations',
      dataScope: DATA_SCOPES.DEPARTMENT
    },
    LOCATION_OWNER: {
      ...ROLE_TEMPLATES.EDITOR,
      id: 'location_owner',
      name: 'Location Owner',
      description: 'Manage individual franchise location',
      dataScope: DATA_SCOPES.OWN
    },
    LOCATION_STAFF: {
      ...ROLE_TEMPLATES.VIEWER,
      id: 'location_staff',
      name: 'Location Staff',
      description: 'Staff member at franchise location'
    }
  },

  ENTERPRISE: {
    ENTERPRISE_ADMIN: {
      ...ROLE_TEMPLATES.SUPER_ADMIN,
      id: 'enterprise_admin',
      name: 'Enterprise Administrator',
      description: 'Full system administration'
    },
    DEPARTMENT_HEAD: {
      ...ROLE_TEMPLATES.ADMIN,
      id: 'department_head',
      name: 'Department Head',
      description: 'Manage department operations',
      dataScope: DATA_SCOPES.DEPARTMENT
    },
    TEAM_LEAD: {
      ...ROLE_TEMPLATES.MANAGER,
      id: 'team_lead',
      name: 'Team Lead',
      description: 'Manage team members and approve work',
      dataScope: DATA_SCOPES.TEAM
    },
    CONTRIBUTOR: {
      ...ROLE_TEMPLATES.EDITOR,
      id: 'contributor',
      name: 'Contributor',
      description: 'Create and edit content'
    },
    STAKEHOLDER: {
      ...ROLE_TEMPLATES.VIEWER,
      id: 'stakeholder',
      name: 'Stakeholder',
      description: 'View reports and analytics'
    }
  }
};

// Permission helper functions
export function createPermission(feature, action) {
  return `${feature}:${action}`;
}

export function hasPermission(userPermissions, feature, action) {
  // Check for super admin wildcard
  if (userPermissions.includes('*:*')) return true;
  
  // Check for feature wildcard
  if (userPermissions.includes(`${feature}:*`)) return true;
  
  // Check for specific permission
  return userPermissions.includes(createPermission(feature, action));
}

export function hasAnyPermission(userPermissions, requiredPermissions) {
  return requiredPermissions.some(permission => {
    const [feature, action] = permission.split(':');
    return hasPermission(userPermissions, feature, action);
  });
}

export function hasAllPermissions(userPermissions, requiredPermissions) {
  return requiredPermissions.every(permission => {
    const [feature, action] = permission.split(':');
    return hasPermission(userPermissions, feature, action);
  });
}

export function filterByDataScope(items, userScope, userId, userTeamId, userDepartmentId) {
  switch (userScope) {
    case DATA_SCOPES.GLOBAL:
      return items;
    
    case DATA_SCOPES.ORGANIZATION:
      return items.filter(item => item.organizationId === userDepartmentId);
    
    case DATA_SCOPES.DEPARTMENT:
      return items.filter(item => item.departmentId === userDepartmentId);
    
    case DATA_SCOPES.TEAM:
      return items.filter(item => item.teamId === userTeamId);
    
    case DATA_SCOPES.ASSIGNED:
      return items.filter(item => 
        item.assignedTo?.includes(userId) || 
        item.createdBy === userId
      );
    
    case DATA_SCOPES.OWN:
      return items.filter(item => item.createdBy === userId);
    
    default:
      return [];
  }
}

// Dashboard section permissions mapping
export const DASHBOARD_SECTIONS = {
  overview: {
    feature: FEATURES.DASHBOARD,
    requiredActions: [ACTIONS.VIEW],
    title: 'Dashboard',
    path: '/dashboard'
  },
  stores: {
    feature: FEATURES.STORES,
    requiredActions: [ACTIONS.VIEW],
    title: 'Stores',
    path: '/stores'
  },
  calendar: {
    feature: FEATURES.CALENDAR,
    requiredActions: [ACTIONS.VIEW],
    title: 'Calendar',
    path: '/dashboard/calendar'
  },
  multiAccount: {
    feature: FEATURES.MULTI_ACCOUNT,
    requiredActions: [ACTIONS.VIEW],
    title: 'Multi Account',
    path: '/dashboard/accounts',
    children: {
      revenue: {
        feature: FEATURES.ANALYTICS,
        requiredActions: [ACTIONS.VIEW],
        title: 'Revenue',
        path: '/dashboard/accounts/revenue'
      },
      campaigns: {
        feature: FEATURES.CAMPAIGNS,
        requiredActions: [ACTIONS.VIEW],
        title: 'Campaigns',
        path: '/dashboard/accounts/campaigns'
      },
      flows: {
        feature: FEATURES.FLOWS,
        requiredActions: [ACTIONS.VIEW],
        title: 'Flows',
        path: '/dashboard/accounts/flows'
      }
    }
  },
  reports: {
    feature: FEATURES.REPORTS,
    requiredActions: [ACTIONS.VIEW],
    title: 'Account Reports',
    path: '/dashboard/reports'
  },
  emailBuilder: {
    feature: FEATURES.EMAIL_BUILDER,
    requiredActions: [ACTIONS.VIEW],
    title: 'Email Builder',
    path: '/dashboard/email-builder'
  },
  settings: {
    feature: FEATURES.SETTINGS,
    requiredActions: [ACTIONS.VIEW],
    title: 'Settings',
    path: '/dashboard/settings'
  },
  users: {
    feature: FEATURES.USERS,
    requiredActions: [ACTIONS.VIEW],
    title: 'Users',
    path: '/dashboard/users'
  },
  permissions: {
    feature: FEATURES.PERMISSIONS,
    requiredActions: [ACTIONS.VIEW],
    title: 'Permissions',
    path: '/permissions'
  }
};

// Audit log event types
export const AUDIT_EVENTS = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGE: 'auth.password_change',
  
  // Permissions
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',
  ROLE_ASSIGNED: 'role.assigned',
  ROLE_REMOVED: 'role.removed',
  
  // Data access
  DATA_VIEWED: 'data.viewed',
  DATA_EXPORTED: 'data.exported',
  DATA_CREATED: 'data.created',
  DATA_UPDATED: 'data.updated',
  DATA_DELETED: 'data.deleted',
  
  // System
  IMPERSONATION_START: 'system.impersonation_start',
  IMPERSONATION_END: 'system.impersonation_end',
  SETTINGS_CHANGED: 'system.settings_changed'
};
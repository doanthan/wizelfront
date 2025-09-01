/**
 * Unified Permission System
 * 
 * A single permission system that works for all organization types:
 * - Individual businesses
 * - Agencies with clients
 * - Franchises with franchisees
 * - Any parent-child organizational structure
 */

// =====================================================
// CORE PERMISSIONS (Universal)
// =====================================================

export const PERMISSIONS = {
    // View Permissions
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_CONTENT: 'view_content',
    VIEW_TEMPLATES: 'view_templates',
    VIEW_CAMPAIGNS: 'view_campaigns',
    VIEW_ANALYTICS: 'view_analytics',
    VIEW_SETTINGS: 'view_settings',
    VIEW_BILLING: 'view_billing',
    VIEW_AUDIT_LOG: 'view_audit_log',
    VIEW_ALL_ACCOUNTS: 'view_all_accounts',       // See all sub-accounts
    
    // Content Management
    CREATE_CONTENT: 'create_content',
    EDIT_CONTENT: 'edit_content',
    DELETE_CONTENT: 'delete_content',
    PUBLISH_CONTENT: 'publish_content',
    APPROVE_CONTENT: 'approve_content',
    LOCK_CONTENT: 'lock_content',                 // Prevent editing
    ARCHIVE_CONTENT: 'archive_content',
    
    // Template Management  
    CREATE_TEMPLATES: 'create_templates',
    EDIT_TEMPLATES: 'edit_templates',
    DELETE_TEMPLATES: 'delete_templates',
    USE_TEMPLATES: 'use_templates',
    APPROVE_TEMPLATES: 'approve_templates',
    LOCK_TEMPLATES: 'lock_templates',             // Lock for sub-accounts
    DISTRIBUTE_TEMPLATES: 'distribute_templates',  // Push to sub-accounts
    
    // Campaign Management
    CREATE_CAMPAIGNS: 'create_campaigns',
    EDIT_CAMPAIGNS: 'edit_campaigns',
    DELETE_CAMPAIGNS: 'delete_campaigns',
    SCHEDULE_CAMPAIGNS: 'schedule_campaigns',
    SEND_CAMPAIGNS: 'send_campaigns',
    PAUSE_CAMPAIGNS: 'pause_campaigns',
    CLONE_CAMPAIGNS: 'clone_campaigns',
    
    // Account Management
    MANAGE_TEAM: 'manage_team',                   // Add/remove team members
    MANAGE_ROLES: 'manage_roles',                 // Assign roles
    MANAGE_SUB_ACCOUNTS: 'manage_sub_accounts',   // Manage child accounts
    CREATE_SUB_ACCOUNTS: 'create_sub_accounts',   // Create new sub-accounts
    DELETE_SUB_ACCOUNTS: 'delete_sub_accounts',   // Remove sub-accounts
    SET_RESTRICTIONS: 'set_restrictions',         // Set limits/restrictions
    
    // Settings & Configuration
    EDIT_SETTINGS: 'edit_settings',
    EDIT_BRAND: 'edit_brand',
    MANAGE_INTEGRATIONS: 'manage_integrations',
    MANAGE_BILLING: 'manage_billing',
    EXPORT_DATA: 'export_data',
    
    // Advanced Permissions
    OVERRIDE_RESTRICTIONS: 'override_restrictions', // Bypass locked elements
    TRANSFER_OWNERSHIP: 'transfer_ownership',
    DELETE_ACCOUNT: 'delete_account',
}

// =====================================================
// ORGANIZATION TYPES (for context/labeling)
// =====================================================

export const ORGANIZATION_TYPES = {
    INDIVIDUAL: {
        name: 'individual',
        display_name: 'Individual Business',
        sub_account_label: null,
        member_label: 'Team Member',
    },
    AGENCY: {
        name: 'agency',
        display_name: 'Agency',
        sub_account_label: 'Client',
        member_label: 'Contractor',
    },
    FRANCHISE: {
        name: 'franchise',
        display_name: 'Franchise',
        sub_account_label: 'Franchisee',
        member_label: 'Location Staff',
    },
    ENTERPRISE: {
        name: 'enterprise',
        display_name: 'Enterprise',
        sub_account_label: 'Division',
        member_label: 'Employee',
    },
}

// =====================================================
// UNIFIED ROLES (work for any organization type)
// =====================================================

export const ROLES = {
    OWNER: {
        id: 'owner',
        name: 'Owner',
        description: 'Full control over the organization and all sub-accounts',
        level: 100,
        permissions: Object.values(PERMISSIONS), // All permissions
        dataScope: DATA_SCOPES.GLOBAL,
        customizable: false,
        canManageSubAccounts: true,
        canBeAssignedTo: ['root_account'],
    },
    
    ADMIN: {
        id: 'admin',
        name: 'Administrator',
        description: 'Manage organization settings and team members',
        level: 90,
        permissions: Object.values(PERMISSIONS).filter(p => 
            !['DELETE_ACCOUNT', 'TRANSFER_OWNERSHIP'].includes(p)
        ),
        dataScope: DATA_SCOPES.ORGANIZATION,
        customizable: true,
        canManageSubAccounts: true,
        canBeAssignedTo: ['root_account', 'sub_account'],
    },
    
    MANAGER: {
        id: 'manager',
        name: 'Manager',
        description: 'Manage content, campaigns, and approve work',
        level: 70,
        dataScope: DATA_SCOPES.ASSIGNED_ACCOUNTS,
        permissions: [
            // View permissions
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_CONTENT,
            PERMISSIONS.VIEW_TEMPLATES,
            PERMISSIONS.VIEW_CAMPAIGNS,
            PERMISSIONS.VIEW_ANALYTICS,
            PERMISSIONS.VIEW_SETTINGS,
            PERMISSIONS.VIEW_ALL_ACCOUNTS,
            
            // Content management
            PERMISSIONS.CREATE_CONTENT,
            PERMISSIONS.EDIT_CONTENT,
            PERMISSIONS.DELETE_CONTENT,
            PERMISSIONS.APPROVE_CONTENT,
            PERMISSIONS.ARCHIVE_CONTENT,
            
            // Template management
            PERMISSIONS.CREATE_TEMPLATES,
            PERMISSIONS.EDIT_TEMPLATES,
            PERMISSIONS.USE_TEMPLATES,
            PERMISSIONS.APPROVE_TEMPLATES,
            PERMISSIONS.DISTRIBUTE_TEMPLATES,
            
            // Campaign management
            PERMISSIONS.CREATE_CAMPAIGNS,
            PERMISSIONS.EDIT_CAMPAIGNS,
            PERMISSIONS.DELETE_CAMPAIGNS,
            PERMISSIONS.SCHEDULE_CAMPAIGNS,
            PERMISSIONS.SEND_CAMPAIGNS,
            PERMISSIONS.PAUSE_CAMPAIGNS,
            
            // Limited admin
            PERMISSIONS.MANAGE_TEAM,
            PERMISSIONS.EDIT_BRAND,
        ],
        customizable: true,
        canManageSubAccounts: true,
        canBeAssignedTo: ['root_account', 'sub_account'],
    },
    
    CREATOR: {
        id: 'creator',
        name: 'Content Creator',
        description: 'Create and edit content and campaigns',
        level: 50,
        dataScope: DATA_SCOPES.OWN_ACCOUNT,
        permissions: [
            // View permissions
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_CONTENT,
            PERMISSIONS.VIEW_TEMPLATES,
            PERMISSIONS.VIEW_CAMPAIGNS,
            PERMISSIONS.VIEW_ANALYTICS,
            
            // Content creation
            PERMISSIONS.CREATE_CONTENT,
            PERMISSIONS.EDIT_CONTENT,
            PERMISSIONS.USE_TEMPLATES,
            
            // Campaign creation
            PERMISSIONS.CREATE_CAMPAIGNS,
            PERMISSIONS.EDIT_CAMPAIGNS,
            PERMISSIONS.SCHEDULE_CAMPAIGNS,
        ],
        customizable: true,
        canManageSubAccounts: false,
        canBeAssignedTo: ['root_account', 'sub_account', 'external'],
    },
    
    REVIEWER: {
        id: 'reviewer',
        name: 'Reviewer',
        description: 'Review and approve content without editing',
        level: 40,
        dataScope: DATA_SCOPES.ASSIGNED_ACCOUNTS,
        permissions: [
            // View permissions
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_CONTENT,
            PERMISSIONS.VIEW_TEMPLATES,
            PERMISSIONS.VIEW_CAMPAIGNS,
            PERMISSIONS.VIEW_ANALYTICS,
            
            // Approval only
            PERMISSIONS.APPROVE_CONTENT,
            PERMISSIONS.APPROVE_TEMPLATES,
        ],
        customizable: true,
        canManageSubAccounts: false,
        canBeAssignedTo: ['root_account', 'sub_account'],
    },
    
    VIEWER: {
        id: 'viewer',
        name: 'Viewer',
        description: 'View-only access to content and analytics',
        level: 10,
        dataScope: DATA_SCOPES.OWN_ACCOUNT,
        permissions: [
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_CONTENT,
            PERMISSIONS.VIEW_TEMPLATES,
            PERMISSIONS.VIEW_CAMPAIGNS,
            PERMISSIONS.VIEW_ANALYTICS,
        ],
        customizable: true,
        canManageSubAccounts: false,
        canBeAssignedTo: ['root_account', 'sub_account', 'external'],
    },
    
    // Special role for sub-account owners (clients/franchisees)
    SUB_ACCOUNT_OWNER: {
        id: 'sub_account_owner',
        name: 'Account Owner', // Label changes based on org type
        description: 'Owner of a sub-account with limited autonomy',
        level: 60,
        dataScope: DATA_SCOPES.OWN_ACCOUNT, // Can only see their own account data
        permissions: [
            // Full view access
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_CONTENT,
            PERMISSIONS.VIEW_TEMPLATES,
            PERMISSIONS.VIEW_CAMPAIGNS,
            PERMISSIONS.VIEW_ANALYTICS,
            PERMISSIONS.VIEW_SETTINGS,
            PERMISSIONS.VIEW_BILLING,
            
            // Content management (with restrictions)
            PERMISSIONS.CREATE_CONTENT,
            PERMISSIONS.EDIT_CONTENT,
            PERMISSIONS.DELETE_CONTENT,
            PERMISSIONS.USE_TEMPLATES,
            
            // Campaign management
            PERMISSIONS.CREATE_CAMPAIGNS,
            PERMISSIONS.EDIT_CAMPAIGNS,
            PERMISSIONS.SCHEDULE_CAMPAIGNS,
            PERMISSIONS.SEND_CAMPAIGNS,
            
            // Limited admin
            PERMISSIONS.MANAGE_TEAM,
            PERMISSIONS.EDIT_SETTINGS,
            PERMISSIONS.EDIT_BRAND,
        ],
        customizable: true,
        canManageSubAccounts: false,
        canBeAssignedTo: ['sub_account'],
    },
    
    // Custom role template
    CUSTOM: {
        id: 'custom',
        name: 'Custom Role',
        description: 'Create a custom role with specific permissions',
        level: 0, // Set during creation
        dataScope: null, // Set during creation
        permissions: [], // Selected during creation
        customizable: true,
        canManageSubAccounts: false,
        canBeAssignedTo: ['root_account', 'sub_account', 'external'],
    },
}

// =====================================================
// PERMISSION GROUPS (for UI organization)
// =====================================================

export const PERMISSION_GROUPS = {
    viewing: {
        label: 'Viewing',
        icon: 'eye',
        permissions: [
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.VIEW_CONTENT,
            PERMISSIONS.VIEW_TEMPLATES,
            PERMISSIONS.VIEW_CAMPAIGNS,
            PERMISSIONS.VIEW_ANALYTICS,
            PERMISSIONS.VIEW_SETTINGS,
            PERMISSIONS.VIEW_BILLING,
            PERMISSIONS.VIEW_AUDIT_LOG,
            PERMISSIONS.VIEW_ALL_ACCOUNTS,
        ],
    },
    content: {
        label: 'Content',
        icon: 'file-text',
        permissions: [
            PERMISSIONS.CREATE_CONTENT,
            PERMISSIONS.EDIT_CONTENT,
            PERMISSIONS.DELETE_CONTENT,
            PERMISSIONS.PUBLISH_CONTENT,
            PERMISSIONS.APPROVE_CONTENT,
            PERMISSIONS.LOCK_CONTENT,
            PERMISSIONS.ARCHIVE_CONTENT,
        ],
    },
    templates: {
        label: 'Templates',
        icon: 'layout',
        permissions: [
            PERMISSIONS.CREATE_TEMPLATES,
            PERMISSIONS.EDIT_TEMPLATES,
            PERMISSIONS.DELETE_TEMPLATES,
            PERMISSIONS.USE_TEMPLATES,
            PERMISSIONS.APPROVE_TEMPLATES,
            PERMISSIONS.LOCK_TEMPLATES,
            PERMISSIONS.DISTRIBUTE_TEMPLATES,
        ],
    },
    campaigns: {
        label: 'Campaigns',
        icon: 'send',
        permissions: [
            PERMISSIONS.CREATE_CAMPAIGNS,
            PERMISSIONS.EDIT_CAMPAIGNS,
            PERMISSIONS.DELETE_CAMPAIGNS,
            PERMISSIONS.SCHEDULE_CAMPAIGNS,
            PERMISSIONS.SEND_CAMPAIGNS,
            PERMISSIONS.PAUSE_CAMPAIGNS,
            PERMISSIONS.CLONE_CAMPAIGNS,
        ],
    },
    management: {
        label: 'Management',
        icon: 'users',
        permissions: [
            PERMISSIONS.MANAGE_TEAM,
            PERMISSIONS.MANAGE_ROLES,
            PERMISSIONS.MANAGE_SUB_ACCOUNTS,
            PERMISSIONS.CREATE_SUB_ACCOUNTS,
            PERMISSIONS.DELETE_SUB_ACCOUNTS,
            PERMISSIONS.SET_RESTRICTIONS,
        ],
    },
    settings: {
        label: 'Settings',
        icon: 'settings',
        permissions: [
            PERMISSIONS.EDIT_SETTINGS,
            PERMISSIONS.EDIT_BRAND,
            PERMISSIONS.MANAGE_INTEGRATIONS,
            PERMISSIONS.MANAGE_BILLING,
            PERMISSIONS.EXPORT_DATA,
        ],
    },
    advanced: {
        label: 'Advanced',
        icon: 'shield',
        permissions: [
            PERMISSIONS.OVERRIDE_RESTRICTIONS,
            PERMISSIONS.TRANSFER_OWNERSHIP,
            PERMISSIONS.DELETE_ACCOUNT,
        ],
    },
}

// =====================================================
// DATA SCOPES (control what data users can access)
// =====================================================

export const DATA_SCOPES = {
    GLOBAL: {
        id: 'global',
        name: 'Global Access',
        description: 'Can view data across all accounts and sub-accounts',
        level: 100,
    },
    ORGANIZATION: {
        id: 'organization',
        name: 'Organization Wide',
        description: 'Can view data for the entire organization',
        level: 90,
    },
    ASSIGNED_ACCOUNTS: {
        id: 'assigned_accounts',
        name: 'Assigned Accounts Only',
        description: 'Can only view data for specifically assigned accounts',
        level: 70,
    },
    OWN_ACCOUNT: {
        id: 'own_account',
        name: 'Own Account Only',
        description: 'Can only view data for their own account/location',
        level: 50,
    },
    OWN_CONTENT: {
        id: 'own_content',
        name: 'Own Content Only',
        description: 'Can only view content they created',
        level: 30,
    },
    DEPARTMENT: {
        id: 'department',
        name: 'Department Only',
        description: 'Can only view data for their department',
        level: 40,
    },
    TEAM: {
        id: 'team',
        name: 'Team Only',
        description: 'Can only view data for their team members',
        level: 35,
    },
}

// =====================================================
// RESTRICTIONS (can be applied to any role)
// =====================================================

export const RESTRICTIONS = {
    CANNOT_EDIT_LOCKED: {
        id: 'cannot_edit_locked',
        name: 'Cannot Edit Locked Elements',
        description: 'Cannot modify templates or content marked as locked',
    },
    REQUIRES_APPROVAL: {
        id: 'requires_approval',
        name: 'Requires Approval',
        description: 'All content must be approved before publishing',
    },
    OWN_CONTENT_ONLY: {
        id: 'own_content_only',
        name: 'Own Content Only',
        description: 'Can only edit content they created',
    },
    TIME_LIMITED: {
        id: 'time_limited',
        name: 'Time Limited Access',
        description: 'Access expires after specified time',
    },
    IP_RESTRICTED: {
        id: 'ip_restricted',
        name: 'IP Restricted',
        description: 'Can only access from approved IP addresses',
    },
    READ_ONLY_ANALYTICS: {
        id: 'read_only_analytics',
        name: 'Read-Only Analytics',
        description: 'Can view but not export analytics data',
    },
    SCOPED_DATA_ACCESS: {
        id: 'scoped_data_access',
        name: 'Scoped Data Access',
        description: 'Data access limited to assigned scope',
    },
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get display name for role based on organization type
 */
export function getRoleDisplayName(roleId, orgType = 'individual') {
    const role = ROLES[roleId.toUpperCase()]
    if (!role) return roleId
    
    // Special handling for sub-account owner
    if (roleId === 'sub_account_owner') {
        const org = ORGANIZATION_TYPES[orgType.toUpperCase()]
        if (org?.sub_account_label) {
            return `${org.sub_account_label} Owner`
        }
    }
    
    return role.name
}

/**
 * Get appropriate roles for organization type
 */
export function getAvailableRoles(orgType, accountType = 'root') {
    const availableRoles = []
    
    Object.values(ROLES).forEach(role => {
        // Check if role can be assigned to this account type
        if (role.canBeAssignedTo.includes(accountType)) {
            availableRoles.push({
                ...role,
                displayName: getRoleDisplayName(role.id, orgType)
            })
        }
    })
    
    return availableRoles.sort((a, b) => b.level - a.level)
}

/**
 * Check if user has permission
 */
export function hasPermission(user, permission, context = {}) {
    // Owner always has all permissions
    if (user.role === 'owner') return true
    
    // Check if permission is in user's role permissions
    const role = ROLES[user.role.toUpperCase()]
    if (!role) return false
    
    // Check base role permissions
    if (role.permissions.includes(permission)) {
        // Check restrictions
        if (user.restrictions?.includes('cannot_edit_locked') && 
            context.isLocked && 
            permission.includes('EDIT')) {
            return false
        }
        
        if (user.restrictions?.includes('own_content_only') && 
            context.ownerId && 
            context.ownerId !== user.id) {
            return false
        }
        
        return true
    }
    
    // Check custom permissions
    return user.customPermissions?.includes(permission) || false
}

/**
 * Check if user can manage another user
 */
export function canManageUser(manager, targetUser) {
    const managerRole = ROLES[manager.role.toUpperCase()]
    const targetRole = ROLES[targetUser.role.toUpperCase()]
    
    if (!managerRole || !targetRole) return false
    
    // Check hierarchy
    if (managerRole.level <= targetRole.level) return false
    
    // Check permission
    return hasPermission(manager, PERMISSIONS.MANAGE_TEAM)
}

/**
 * Get permissions for a role with customizations
 */
export function getRolePermissions(roleId, customPermissions = [], restrictions = []) {
    const role = ROLES[roleId.toUpperCase()]
    if (!role) return []
    
    // Start with base permissions
    let permissions = [...role.permissions]
    
    // Add custom permissions
    if (customPermissions.length > 0) {
        permissions = [...new Set([...permissions, ...customPermissions])]
    }
    
    // Apply restrictions (remove conflicting permissions)
    if (restrictions.includes('cannot_edit_locked')) {
        permissions = permissions.filter(p => !p.includes('LOCK'))
    }
    
    if (restrictions.includes('requires_approval')) {
        permissions = permissions.filter(p => p !== PERMISSIONS.PUBLISH_CONTENT)
    }
    
    return permissions
}

/**
 * Validate role assignment
 */
export function validateRoleAssignment(assigner, roleId, targetAccountType) {
    const assignerRole = ROLES[assigner.role.toUpperCase()]
    const targetRole = ROLES[roleId.toUpperCase()]
    
    if (!assignerRole || !targetRole) return false
    
    // Check if assigner can manage roles
    if (!hasPermission(assigner, PERMISSIONS.MANAGE_ROLES)) return false
    
    // Check if role can be assigned to target account type
    if (!targetRole.canBeAssignedTo.includes(targetAccountType)) return false
    
    // Check hierarchy - can't assign role equal or higher than own
    if (targetRole.level >= assignerRole.level) return false
    
    return true
}

/**
 * Get user's data scope
 */
export function getUserDataScope(user, store) {
    const role = ROLES[user.role?.toUpperCase()]
    if (!role) return DATA_SCOPES.OWN_CONTENT
    
    // Check for custom data scope
    if (user.dataScope) {
        return DATA_SCOPES[user.dataScope.toUpperCase()] || role.dataScope
    }
    
    return role.dataScope || DATA_SCOPES.OWN_ACCOUNT
}

/**
 * Check if user can access specific data
 */
export function canAccessData(user, targetData, store) {
    const userScope = getUserDataScope(user, store)
    
    // Global scope can access everything
    if (userScope.id === 'global') return true
    
    // Organization scope can access everything in the organization
    if (userScope.id === 'organization' && targetData.organization_id === store.organization_id) {
        return true
    }
    
    // Assigned accounts scope
    if (userScope.id === 'assigned_accounts') {
        return user.assignedAccounts?.includes(targetData.account_id) || 
               targetData.account_id === user.account_id
    }
    
    // Own account scope
    if (userScope.id === 'own_account') {
        return targetData.account_id === user.account_id ||
               targetData.store_id === user.store_id
    }
    
    // Own content scope
    if (userScope.id === 'own_content') {
        return targetData.created_by === user.id ||
               targetData.owner_id === user.id
    }
    
    // Department scope
    if (userScope.id === 'department') {
        return targetData.department_id === user.department_id
    }
    
    // Team scope
    if (userScope.id === 'team') {
        return user.team_members?.includes(targetData.created_by)
    }
    
    return false
}

/**
 * Get data filter for database queries
 */
export function getDataFilter(user, store) {
    const scope = getUserDataScope(user, store)
    
    switch (scope.id) {
        case 'global':
            return {} // No filter, see everything
            
        case 'organization':
            return { organization_id: store.organization_id }
            
        case 'assigned_accounts':
            return { 
                $or: [
                    { account_id: { $in: user.assignedAccounts || [] } },
                    { account_id: user.account_id },
                    { store_id: { $in: user.assignedStores || [] } }
                ]
            }
            
        case 'own_account':
            return { 
                $or: [
                    { account_id: user.account_id },
                    { store_id: user.store_id },
                    { store_id: store._id }
                ]
            }
            
        case 'own_content':
            return { 
                $or: [
                    { created_by: user.id },
                    { owner_id: user.id }
                ]
            }
            
        case 'department':
            return { department_id: user.department_id }
            
        case 'team':
            return { created_by: { $in: user.team_members || [user.id] } }
            
        default:
            return { created_by: user.id } // Safest default
    }
}

/**
 * Get accessible store IDs for a user
 */
export function getAccessibleStores(user, allStores) {
    const scope = getUserDataScope(user, user.currentStore)
    
    switch (scope.id) {
        case 'global':
            return allStores.map(s => s._id)
            
        case 'organization':
            return allStores
                .filter(s => s.organization_id === user.currentStore.organization_id)
                .map(s => s._id)
            
        case 'assigned_accounts':
            return user.assignedStores || [user.store_id]
            
        case 'own_account':
            return [user.store_id]
            
        default:
            return [user.store_id]
    }
}

/**
 * Check if user can view analytics for a specific account
 */
export function canViewAccountAnalytics(user, targetAccountId, store) {
    // First check if user has analytics permission
    if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
        return false
    }
    
    const scope = getUserDataScope(user, store)
    
    // Check based on scope
    switch (scope.id) {
        case 'global':
        case 'organization':
            return true
            
        case 'assigned_accounts':
            return user.assignedAccounts?.includes(targetAccountId) ||
                   targetAccountId === user.account_id
            
        case 'own_account':
            return targetAccountId === user.account_id ||
                   targetAccountId === store._id.toString()
            
        default:
            return false
    }
}

/**
 * Get analytics aggregation level for user
 */
export function getAnalyticsAggregationLevel(user, store) {
    const scope = getUserDataScope(user, store)
    
    switch (scope.id) {
        case 'global':
            return 'global' // See everything, can aggregate across organizations
            
        case 'organization':
            return 'organization' // Can aggregate across all accounts in org
            
        case 'assigned_accounts':
            return 'multi_account' // Can aggregate assigned accounts only
            
        case 'own_account':
            return 'single_account' // Can only see own account data
            
        default:
            return 'content_only' // Can only see individual content metrics
    }
}

/**
 * Apply data scope to query
 */
export function applyScopeToQuery(query, user, store) {
    const filter = getDataFilter(user, store)
    return { ...query, ...filter }
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission) {
    const descriptions = {
        [PERMISSIONS.VIEW_DASHBOARD]: 'Access the main dashboard',
        [PERMISSIONS.VIEW_CONTENT]: 'View all content and materials',
        [PERMISSIONS.VIEW_TEMPLATES]: 'View email templates',
        [PERMISSIONS.VIEW_CAMPAIGNS]: 'View email campaigns',
        [PERMISSIONS.VIEW_ANALYTICS]: 'View analytics and reports',
        [PERMISSIONS.VIEW_SETTINGS]: 'View account settings',
        [PERMISSIONS.VIEW_BILLING]: 'View billing information',
        [PERMISSIONS.VIEW_AUDIT_LOG]: 'View activity logs',
        [PERMISSIONS.VIEW_ALL_ACCOUNTS]: 'View all sub-accounts',
        [PERMISSIONS.CREATE_CONTENT]: 'Create new content',
        [PERMISSIONS.EDIT_CONTENT]: 'Edit existing content',
        [PERMISSIONS.DELETE_CONTENT]: 'Delete content',
        [PERMISSIONS.PUBLISH_CONTENT]: 'Publish content without approval',
        [PERMISSIONS.APPROVE_CONTENT]: 'Approve content for publishing',
        [PERMISSIONS.LOCK_CONTENT]: 'Lock content from editing',
        [PERMISSIONS.ARCHIVE_CONTENT]: 'Archive old content',
        [PERMISSIONS.CREATE_TEMPLATES]: 'Create new templates',
        [PERMISSIONS.EDIT_TEMPLATES]: 'Edit existing templates',
        [PERMISSIONS.DELETE_TEMPLATES]: 'Delete templates',
        [PERMISSIONS.USE_TEMPLATES]: 'Use templates in campaigns',
        [PERMISSIONS.APPROVE_TEMPLATES]: 'Approve template changes',
        [PERMISSIONS.LOCK_TEMPLATES]: 'Lock templates from editing',
        [PERMISSIONS.DISTRIBUTE_TEMPLATES]: 'Push templates to sub-accounts',
        [PERMISSIONS.CREATE_CAMPAIGNS]: 'Create new campaigns',
        [PERMISSIONS.EDIT_CAMPAIGNS]: 'Edit existing campaigns',
        [PERMISSIONS.DELETE_CAMPAIGNS]: 'Delete campaigns',
        [PERMISSIONS.SCHEDULE_CAMPAIGNS]: 'Schedule campaign sending',
        [PERMISSIONS.SEND_CAMPAIGNS]: 'Send campaigns immediately',
        [PERMISSIONS.PAUSE_CAMPAIGNS]: 'Pause active campaigns',
        [PERMISSIONS.CLONE_CAMPAIGNS]: 'Duplicate campaigns',
        [PERMISSIONS.MANAGE_TEAM]: 'Add and remove team members',
        [PERMISSIONS.MANAGE_ROLES]: 'Assign roles to users',
        [PERMISSIONS.MANAGE_SUB_ACCOUNTS]: 'Manage sub-accounts',
        [PERMISSIONS.CREATE_SUB_ACCOUNTS]: 'Create new sub-accounts',
        [PERMISSIONS.DELETE_SUB_ACCOUNTS]: 'Delete sub-accounts',
        [PERMISSIONS.SET_RESTRICTIONS]: 'Set limits and restrictions',
        [PERMISSIONS.EDIT_SETTINGS]: 'Modify account settings',
        [PERMISSIONS.EDIT_BRAND]: 'Edit brand settings',
        [PERMISSIONS.MANAGE_INTEGRATIONS]: 'Connect external services',
        [PERMISSIONS.MANAGE_BILLING]: 'Manage payment methods',
        [PERMISSIONS.EXPORT_DATA]: 'Export account data',
        [PERMISSIONS.OVERRIDE_RESTRICTIONS]: 'Bypass locked elements',
        [PERMISSIONS.TRANSFER_OWNERSHIP]: 'Transfer account ownership',
        [PERMISSIONS.DELETE_ACCOUNT]: 'Permanently delete account',
    }
    
    return descriptions[permission] || permission
}

// Export everything
export default {
    PERMISSIONS,
    ORGANIZATION_TYPES,
    ROLES,
    PERMISSION_GROUPS,
    DATA_SCOPES,
    RESTRICTIONS,
    getRoleDisplayName,
    getAvailableRoles,
    hasPermission,
    canManageUser,
    getRolePermissions,
    validateRoleAssignment,
    getPermissionDescription,
    getUserDataScope,
    canAccessData,
    getDataFilter,
    getAccessibleStores,
    canViewAccountAnalytics,
    getAnalyticsAggregationLevel,
    applyScopeToQuery,
}
/**
 * Permissions V2 - Simplified, Scalable Permission System
 * 
 * Designed for:
 * - Agencies managing multiple clients
 * - Enterprises with departments/divisions  
 * - Franchises with location control
 * 
 * Key Features:
 * - Use-case driven permission bundles
 * - Simple 3-tier model (Feature → Action → Scope)
 * - Optimized for performance with caching
 * - Clear approval workflows
 * - Template inheritance and locking
 */

// =====================================================
// SIMPLIFIED FEATURE-BASED PERMISSIONS
// =====================================================

export const FEATURES = {
    // Core Features (what can they access?)
    DASHBOARD: 'dashboard',
    TEMPLATES: 'templates',
    CAMPAIGNS: 'campaigns',
    CONTENT: 'content',
    ANALYTICS: 'analytics',
    ACCOUNTS: 'accounts',
    SETTINGS: 'settings',
    BILLING: 'billing',
}

export const ACTIONS = {
    // Universal Actions (what can they do?)
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    APPROVE: 'approve',
    PUBLISH: 'publish',
    LOCK: 'lock',
    DISTRIBUTE: 'distribute',
    EXPORT: 'export',
}

// Combine Feature + Action for permissions
export function createPermission(feature, action) {
    return `${feature}:${action}`
}

// =====================================================
// PERMISSION BUNDLES (Use-Case Driven)
// =====================================================

export const PERMISSION_BUNDLES = {
    // Agency Client Manager Bundle
    AGENCY_CLIENT_MANAGER: {
        name: 'Client Manager',
        description: 'Manage client accounts and oversee their campaigns',
        permissions: [
            'accounts:view',
            'accounts:edit',
            'templates:view',
            'templates:distribute',
            'campaigns:view',
            'campaigns:approve',
            'analytics:view',
            'analytics:export',
            'content:view',
            'content:approve',
        ],
        dataScope: 'assigned_accounts',
    },
    
    // Franchise Brand Guardian Bundle
    FRANCHISE_BRAND_GUARDIAN: {
        name: 'Brand Guardian',
        description: 'Protect brand consistency across all locations',
        permissions: [
            'templates:view',
            'templates:create',
            'templates:lock',
            'templates:distribute',
            'content:view',
            'content:approve',
            'campaigns:approve',
            'analytics:view',
        ],
        dataScope: 'organization',
        restrictions: ['cannot_be_overridden'],
    },
    
    // Enterprise Creative Team Bundle
    ENTERPRISE_CREATIVE: {
        name: 'Creative Team',
        description: 'Create and edit content within guidelines',
        permissions: [
            'templates:view',
            'templates:create',
            'templates:edit',
            'content:view',
            'content:create',
            'content:edit',
            'campaigns:create',
            'campaigns:edit',
        ],
        dataScope: 'department',
        restrictions: ['requires_approval', 'cannot_edit_locked'],
    },
    
    // Location Manager Bundle (Franchise)
    LOCATION_MANAGER: {
        name: 'Location Manager',
        description: 'Manage local campaigns within brand guidelines',
        permissions: [
            'dashboard:view',
            'templates:view',
            'campaigns:create',
            'campaigns:edit',
            'campaigns:publish',
            'content:create',
            'content:edit',
            'analytics:view',
        ],
        dataScope: 'own_account',
        restrictions: ['cannot_edit_locked', 'template_compliance'],
    },
    
    // Analytics Viewer Bundle
    ANALYTICS_VIEWER: {
        name: 'Analytics Viewer',
        description: 'View reports across assigned accounts',
        permissions: [
            'dashboard:view',
            'analytics:view',
            'analytics:export',
            'campaigns:view',
        ],
        dataScope: 'assigned_accounts',
        restrictions: ['read_only'],
    },
}

// =====================================================
// APPROVAL WORKFLOW SYSTEM
// =====================================================

export const APPROVAL_WORKFLOW = {
    STAGES: {
        DRAFT: 'draft',
        SUBMITTED: 'submitted',
        IN_REVIEW: 'in_review',
        CHANGES_REQUESTED: 'changes_requested',
        APPROVED: 'approved',
        PUBLISHED: 'published',
        REJECTED: 'rejected',
    },
    
    PERMISSIONS: {
        SUBMIT_FOR_REVIEW: 'workflow:submit',
        REQUEST_CHANGES: 'workflow:request_changes',
        APPROVE_CONTENT: 'workflow:approve',
        REJECT_CONTENT: 'workflow:reject',
        BYPASS_APPROVAL: 'workflow:bypass',
        PUBLISH_APPROVED: 'workflow:publish',
    },
    
    // Define approval chains for different organization types
    CHAINS: {
        AGENCY: ['creator', 'account_manager', 'client'],
        FRANCHISE: ['location', 'regional', 'corporate'],
        ENTERPRISE: ['creator', 'manager', 'department_head'],
    },
}

// =====================================================
// TEMPLATE LOCKING SYSTEM
// =====================================================

export const TEMPLATE_CONTROLS = {
    LOCK_LEVELS: {
        UNLOCKED: 'unlocked',           // Fully editable
        CONTENT_LOCKED: 'content_locked', // Can't change text/images
        LAYOUT_LOCKED: 'layout_locked',   // Can't change structure
        FULLY_LOCKED: 'fully_locked',     // No changes allowed
        BRAND_LOCKED: 'brand_locked',     // Only brand elements locked
    },
    
    PERMISSIONS: {
        LOCK_TEMPLATE: 'template:lock',
        UNLOCK_TEMPLATE: 'template:unlock',
        OVERRIDE_LOCK: 'template:override_lock',
        DISTRIBUTE_LOCKED: 'template:distribute_locked',
        FORK_TEMPLATE: 'template:fork',
    },
    
    // What elements can be locked
    LOCKABLE_ELEMENTS: {
        HEADER: 'header',
        FOOTER: 'footer',
        BRAND_COLORS: 'brand_colors',
        FONTS: 'fonts',
        LOGO: 'logo',
        LEGAL_TEXT: 'legal_text',
        SOCIAL_LINKS: 'social_links',
    },
}

// =====================================================
// CROSS-ACCOUNT REPORTING
// =====================================================

export const REPORTING = {
    SCOPES: {
        INDIVIDUAL: 'individual',         // Single account metrics
        COMPARISON: 'comparison',         // Compare multiple accounts
        AGGREGATED: 'aggregated',         // Combined metrics
        HIERARCHICAL: 'hierarchical',     // Parent-child rollup
        BENCHMARKING: 'benchmarking',     // Compare against averages
    },
    
    PERMISSIONS: {
        VIEW_OWN_METRICS: 'analytics:view_own',
        VIEW_ACCOUNT_METRICS: 'analytics:view_account',
        VIEW_ROLLUP_METRICS: 'analytics:view_rollup',
        VIEW_COMPARISON: 'analytics:view_comparison',
        CREATE_CUSTOM_REPORTS: 'analytics:create_reports',
        SHARE_REPORTS: 'analytics:share_reports',
    },
    
    // Pre-built report templates
    TEMPLATES: {
        AGENCY_CLIENT_OVERVIEW: 'agency_client_overview',
        FRANCHISE_LOCATION_PERFORMANCE: 'franchise_performance',
        ENTERPRISE_DEPARTMENT_SUMMARY: 'department_summary',
        CAMPAIGN_EFFECTIVENESS: 'campaign_effectiveness',
        BRAND_COMPLIANCE_REPORT: 'brand_compliance',
    },
}

// =====================================================
// SMART ROLE SYSTEM
// =====================================================

export const SMART_ROLES = {
    // Agency Roles
    AGENCY_OWNER: {
        id: 'agency_owner',
        name: 'Agency Owner',
        bundle: 'AGENCY_CLIENT_MANAGER',
        additionalPermissions: ['billing:*', 'accounts:*', 'settings:*'],
        dataScope: 'global',
        canManageClients: true,
    },
    
    AGENCY_ACCOUNT_MANAGER: {
        id: 'agency_account_manager',
        name: 'Account Manager',
        bundle: 'AGENCY_CLIENT_MANAGER',
        dataScope: 'assigned_accounts',
        canManageClients: false,
    },
    
    // Franchise Roles
    FRANCHISE_CORPORATE: {
        id: 'franchise_corporate',
        name: 'Corporate Admin',
        bundle: 'FRANCHISE_BRAND_GUARDIAN',
        additionalPermissions: ['accounts:*', 'settings:*'],
        dataScope: 'global',
        canLockTemplates: true,
    },
    
    FRANCHISE_LOCATION_OWNER: {
        id: 'franchise_location_owner',
        name: 'Franchisee',
        bundle: 'LOCATION_MANAGER',
        dataScope: 'own_account',
        mustUseLockedTemplates: true,
    },
    
    // Enterprise Roles
    ENTERPRISE_ADMIN: {
        id: 'enterprise_admin',
        name: 'Enterprise Admin',
        permissions: ['*:*'], // All permissions
        dataScope: 'global',
    },
    
    ENTERPRISE_DEPARTMENT_HEAD: {
        id: 'enterprise_dept_head',
        name: 'Department Head',
        bundle: 'AGENCY_CLIENT_MANAGER',
        dataScope: 'department',
        canApprove: true,
    },
    
    ENTERPRISE_CONTRIBUTOR: {
        id: 'enterprise_contributor',
        name: 'Contributor',
        bundle: 'ENTERPRISE_CREATIVE',
        dataScope: 'team',
        requiresApproval: true,
    },
}

// =====================================================
// PERFORMANCE OPTIMIZATIONS
// =====================================================

export const PERFORMANCE = {
    // Cache configuration
    CACHE: {
        PERMISSION_TTL: 300, // 5 minutes
        ROLE_TTL: 600,       // 10 minutes
        SCOPE_TTL: 300,      // 5 minutes
    },
    
    // Database indexes needed
    INDEXES: [
        { collection: 'users', fields: ['_id', 'roleId'] },
        { collection: 'roles', fields: ['_id', 'storeId'] },
        { collection: 'stores', fields: ['_id', 'organization_id', 'parent_store_id'] },
        { collection: 'content', fields: ['store_id', 'created_by', 'status'] },
    ],
    
    // Precomputed permission sets
    PRECOMPUTE: {
        ON_ROLE_CHANGE: true,
        ON_USER_LOGIN: true,
        BACKGROUND_REFRESH: true,
    },
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if user has permission (with caching)
 */
const permissionCache = new Map()

export async function hasPermission(user, permission, context = {}) {
    // Check cache first
    const cacheKey = `${user.id}:${permission}:${JSON.stringify(context)}`
    if (permissionCache.has(cacheKey)) {
        const cached = permissionCache.get(cacheKey)
        if (cached.expires > Date.now()) {
            return cached.result
        }
    }
    
    // Perform actual permission check
    const result = await performPermissionCheck(user, permission, context)
    
    // Cache the result
    permissionCache.set(cacheKey, {
        result,
        expires: Date.now() + (PERFORMANCE.CACHE.PERMISSION_TTL * 1000)
    })
    
    return result
}

/**
 * Actual permission checking logic
 */
async function performPermissionCheck(user, permission, context) {
    // Get user's role and permissions
    const role = await getUserRole(user)
    if (!role) return false
    
    // Check if permission exists in role
    if (role.permissions.includes(permission) || role.permissions.includes('*:*')) {
        // Check restrictions
        if (context.isLocked && role.restrictions?.includes('cannot_edit_locked')) {
            return false
        }
        
        if (context.requiresApproval && !role.canApprove) {
            return false
        }
        
        // Check data scope
        return checkDataScope(user, role, context)
    }
    
    return false
}

/**
 * Check data scope access
 */
function checkDataScope(user, role, context) {
    const scope = role.dataScope || 'own_account'
    
    switch (scope) {
        case 'global':
            return true
            
        case 'organization':
            return context.organizationId === user.organizationId
            
        case 'assigned_accounts':
            return user.assignedAccounts?.includes(context.accountId)
            
        case 'department':
            return context.departmentId === user.departmentId
            
        case 'team':
            return user.teamMembers?.includes(context.userId)
            
        case 'own_account':
        default:
            return context.accountId === user.accountId
    }
}

/**
 * Get optimized data filter for queries
 */
export function getDataFilter(user, role) {
    const scope = role.dataScope || 'own_account'
    
    // Use indexed fields for better performance
    switch (scope) {
        case 'global':
            return {}
            
        case 'organization':
            return { organization_id: user.organizationId }
            
        case 'assigned_accounts':
            return { store_id: { $in: user.assignedStores || [user.storeId] } }
            
        case 'department':
            return { department_id: user.departmentId }
            
        case 'own_account':
        default:
            return { store_id: user.storeId }
    }
}

/**
 * Get user's effective role (with bundle expansion)
 */
export async function getUserRole(user) {
    // This would fetch from database in real implementation
    const roleConfig = SMART_ROLES[user.roleId]
    if (!roleConfig) return null
    
    // Expand bundle permissions
    let permissions = []
    if (roleConfig.bundle) {
        const bundle = PERMISSION_BUNDLES[roleConfig.bundle]
        permissions = [...bundle.permissions]
    }
    
    // Add additional permissions
    if (roleConfig.additionalPermissions) {
        permissions = [...permissions, ...roleConfig.additionalPermissions]
    }
    
    // Handle wildcard permissions
    if (roleConfig.permissions) {
        permissions = roleConfig.permissions
    }
    
    return {
        ...roleConfig,
        permissions,
    }
}

/**
 * Check if user can approve at workflow stage
 */
export function canApproveAtStage(user, workflowStage, orgType) {
    const chain = APPROVAL_WORKFLOW.CHAINS[orgType]
    if (!chain) return false
    
    const stageIndex = chain.indexOf(workflowStage)
    const userStageIndex = chain.indexOf(user.approvalLevel)
    
    return userStageIndex > stageIndex
}

/**
 * Check if template element is locked
 */
export function isElementLocked(template, element) {
    if (template.lockLevel === TEMPLATE_CONTROLS.LOCK_LEVELS.FULLY_LOCKED) {
        return true
    }
    
    if (template.lockedElements?.includes(element)) {
        return true
    }
    
    return false
}

/**
 * Get available actions for user on resource
 */
export async function getAvailableActions(user, resource, resourceType) {
    const actions = []
    const features = FEATURES[resourceType.toUpperCase()]
    
    if (!features) return actions
    
    for (const action of Object.values(ACTIONS)) {
        const permission = createPermission(features, action)
        if (await hasPermission(user, permission, { resourceId: resource._id })) {
            actions.push(action)
        }
    }
    
    return actions
}

/**
 * Clear permission cache for user
 */
export function clearUserPermissionCache(userId) {
    for (const key of permissionCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
            permissionCache.delete(key)
        }
    }
}

/**
 * Initialize permission system
 */
export async function initializePermissions() {
    // Create database indexes
    console.log('Creating permission system indexes...')
    
    // Precompute common permission sets
    console.log('Precomputing permission sets...')
    
    // Start cache refresh interval
    setInterval(() => {
        // Clear expired cache entries
        const now = Date.now()
        for (const [key, value] of permissionCache.entries()) {
            if (value.expires < now) {
                permissionCache.delete(key)
            }
        }
    }, 60000) // Every minute
    
    console.log('Permission system initialized')
}

// Export main interface
export default {
    FEATURES,
    ACTIONS,
    PERMISSION_BUNDLES,
    SMART_ROLES,
    APPROVAL_WORKFLOW,
    TEMPLATE_CONTROLS,
    REPORTING,
    hasPermission,
    getUserRole,
    getDataFilter,
    canApproveAtStage,
    isElementLocked,
    getAvailableActions,
    clearUserPermissionCache,
    initializePermissions,
    createPermission,
}
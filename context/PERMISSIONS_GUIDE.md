# Permission System Guide v2 - Standardized

## Overview

Our permission system uses **standardized, organization-agnostic roles** that work seamlessly across:

- **Agencies** managing clients, franchises, or enterprises
- **Franchises** working with agencies or managing locations  
- **Enterprises** using agencies or managing departments
- **Hybrid Organizations** combining any of the above
- **Super Users** for system administration

The same role system adapts to any organizational structure through context-aware labeling.

## Core Concepts

### 1. Three-Tier Permission Model

```
Feature → Action → Scope
```

- **Features** (10): What can they access?
- **Actions** (10): What can they do?
- **Scopes** (9): What data can they see?

### 2. Permission Format

Permissions follow a simple `feature:action` format:

```javascript
'templates:edit'     // Can edit templates
'campaigns:approve'  // Can approve campaigns
'analytics:export'   // Can export analytics
'*:*'               // All permissions (owner/super user)
'templates:*'       // All template actions
```

### 3. Features & Actions

**Features:**
- `dashboard` - Main dashboard
- `templates` - Email templates
- `campaigns` - Email campaigns
- `content` - Content management
- `analytics` - Reports and metrics
- `accounts` - User management
- `settings` - Configuration
- `billing` - Payment and plans
- `integrations` - Third-party connections
- `brands` - Brand management

**Actions:**
- `view` - Read access
- `create` - Create new items
- `edit` - Modify existing items
- `delete` - Remove items
- `approve` - Approve content/campaigns
- `publish` - Publish without approval
- `lock` - Lock items from editing
- `distribute` - Share across accounts
- `export` - Export data
- `manage` - Full management access

## Standardized Roles (Universal)

The system uses standardized roles that work across all organization types. The same role can be labeled differently based on context:

### Core Roles (Level-Based Hierarchy)

| Role | Level | Purpose | Key Capabilities | Data Scope |
|------|-------|---------|-----------------|------------|
| **owner** | 100 | Full control | All permissions (*:*), manage billing, delete account | Global |
| **admin** | 90 | Administrative | All except delete account, manage integrations | Organization |
| **manager** | 80 | Team management | Approve content, manage teams, distribute templates | Assigned Accounts |
| **brand_guardian** | 70 | Brand protection | Lock templates, enforce standards, approve content | Organization |
| **creator** | 60 | Content creation | Create/edit content, requires approval | Assigned Accounts |
| **publisher** | 50 | Direct publishing | Create/publish without approval | Assigned Accounts |
| **reviewer** | 40 | Content review | Approve/reject content, request changes | Assigned Accounts |
| **analyst** | 30 | Data analysis | View/export analytics, create reports | Assigned Accounts |
| **viewer** | 20 | Read-only | View dashboards and content | Assigned Accounts |
| **guest** | 10 | Limited | View specific shared items only | Specific Items |

### Context-Specific Labels

The same standardized role gets different labels based on organization type:

#### In Agency Context:
- owner → "Agency Owner"
- admin → "Agency Admin"
- manager → "Account Manager"
- brand_guardian → "Brand Manager"
- creator → "Creative"
- publisher → "Campaign Manager"
- reviewer → "Client Success"
- analyst → "Data Analyst"
- viewer → "Client Viewer"
- guest → "Client Guest"

#### In Franchise Context:
- owner → "Franchisor"
- admin → "Corporate Admin"
- manager → "Regional Manager"
- brand_guardian → "Brand Control"
- creator → "Location Manager"
- publisher → "Franchisee"
- reviewer → "Quality Control"
- analyst → "Performance Analyst"
- viewer → "Location Viewer"
- guest → "Vendor"

#### In Enterprise Context:
- owner → "Executive"
- admin → "IT Admin"
- manager → "Department Head"
- brand_guardian → "Brand Team"
- creator → "Content Creator"
- publisher → "Marketing Lead"
- reviewer → "Compliance"
- analyst → "Business Analyst"
- viewer → "Employee"
- guest → "Contractor"

#### In Hybrid Context (Agency + Franchise):
- owner → "Master Account"
- admin → "Partner Admin"
- manager → "Partner Manager"
- brand_guardian → "Brand Control"
- creator → "Content Partner"
- publisher → "Local Partner"
- reviewer → "Quality Assurance"
- analyst → "Partner Analyst"
- viewer → "Partner Viewer"
- guest → "Vendor"

### Super User Role

| Role | Level | Key Permissions | Special Abilities |
|------|-------|----------------|-------------------|
| **super_user** | 999 | All permissions (*:*) | View as any account, Bypass all restrictions, Access all audit logs, Debug mode, System maintenance |

## Role Capabilities

### Permission Breakdown by Role

#### Owner (Level 100)
```javascript
permissions: ['*:*'] // All permissions
capabilities: {
    canManageSubAccounts: true,
    canCreateSubAccounts: true,
    canDeleteAccount: true,
    canManageBilling: true,
    canViewAllData: true,
    canOverrideRestrictions: true
}
```

#### Admin (Level 90)
```javascript
permissions: [
    'dashboard:*', 'templates:*', 'campaigns:*',
    'content:*', 'analytics:*', 'accounts:*',
    'settings:*', 'integrations:*', 'brands:*'
]
capabilities: {
    canManageSubAccounts: true,
    canViewAllData: true,
    canManageIntegrations: true // Admin only!
}
```

#### Manager (Level 80)
```javascript
permissions: [
    'dashboard:view', 'templates:*', 'campaigns:*',
    'content:*', 'analytics:view', 'analytics:export',
    'accounts:view', 'accounts:edit', 'brands:*'
]
capabilities: {
    canApproveContent: true,
    canAssignWork: true,
    canManageTeam: true,
    canDistributeTemplates: true
}
```

#### Creator (Level 60)
```javascript
permissions: [
    'dashboard:view', 'templates:view', 'templates:create',
    'templates:edit', 'campaigns:create', 'campaigns:edit',
    'content:create', 'content:edit', 'analytics:view'
]
capabilities: {
    canCreateContent: true,
    requiresApproval: true // Key restriction
}
```

## Data Scopes

Control what data users can access:

| Scope | Level | Description | Use Case |
|-------|-------|-------------|----------|
| **system** | 999 | Entire system | Super users only |
| **global** | 100 | All data in organization | Owners |
| **organization** | 90 | All org data | Admins, Brand Guardians |
| **assigned_accounts** | 70 | Specific accounts | Managers, Creators |
| **department** | 50 | Department data | Department heads |
| **team** | 40 | Team members' data | Team leads |
| **own_account** | 30 | Single account | Publishers, Locations |
| **own_content** | 20 | Created content only | Contributors |
| **specific_items** | 10 | Shared items only | Guests |

## Organization Flexibility

### Agency Working with Franchise

```javascript
// Agency manages franchise marketing
Agency Owner → owner role in Franchise system
Account Manager → manager role for franchise locations
Creative → creator role with brand restrictions
Brand Guardian → ensures franchise compliance
```

### Enterprise Using Agency

```javascript
// Enterprise hires agency
Executive → owner role, oversees agency
Department Head → manager role, coordinates with agency
Agency → creator/publisher roles in enterprise
Agency can't access integrations (admin only)
```

### Franchise with Agency Support

```javascript
// Franchise uses agency for marketing
Franchisor → owner role, full control
Agency Manager → manager role for locations
Agency Creative → creator role with restrictions
Brand Guardian → maintains brand standards
```

## Email Approval Workflows

### Workflow Stages
```
DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED
              ↓
      CHANGES_REQUESTED → (back to DRAFT)
```

### Approval Requirements by Role

| Role | Needs Approval | Can Approve Others |
|------|---------------|-------------------|
| owner | No | Yes |
| admin | No | Yes |
| manager | No | Yes |
| brand_guardian | No | Yes |
| publisher | No | No |
| creator | **Yes** | No |
| reviewer | N/A | Yes |
| Others | Yes | No |

### Organization-Specific Approval Chains

**Agency Workflow:**
1. Creator creates (DRAFT)
2. Manager reviews (IN_REVIEW)
3. Client (viewer) approves (APPROVED)
4. Publisher publishes (PUBLISHED)

**Franchise Workflow:**
1. Creator (location) creates (DRAFT)
2. Manager (regional) reviews (IN_REVIEW)
3. Brand Guardian approves (APPROVED)
4. Auto-publishes (PUBLISHED)

**Enterprise Workflow:**
1. Creator creates (DRAFT)
2. Reviewer checks (IN_REVIEW)
3. Manager approves (APPROVED)
4. Publisher publishes (PUBLISHED)

## Template Locking System

### Lock Levels

| Level | Description | What's Locked | Who Can Lock |
|-------|-------------|---------------|--------------|
| **Unlocked** | Fully editable | Nothing | Anyone |
| **Content Locked** | Structure only | Text, Images | Manager+ |
| **Layout Locked** | Content only | Structure, Sections | Manager+ |
| **Brand Locked** | Brand elements only | Logo, Colors, Fonts | Brand Guardian |
| **Fully Locked** | No changes | Everything | Admin/Owner |

### Lock Permissions by Role

| Role | Can Lock | Can Edit Locked | Can Override |
|------|----------|-----------------|--------------|
| owner | Yes | Yes | Yes |
| admin | Yes | Yes | Yes |
| manager | Yes | No | No |
| brand_guardian | Yes | Yes | No |
| creator | No | No | No |
| publisher | No | No | No |

## Integration Access (Admin Only)

**Only these roles can view/manage integrations:**
- `owner` (Level 100)
- `admin` (Level 90)
- `super_user` (Level 999)

All other roles are restricted from integration access for security.

## Cross-Account Reporting

### Report Access by Role

| Role | Individual | Comparison | Aggregated | Export |
|------|-----------|------------|------------|--------|
| owner | ✓ | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ | ✓ |
| manager | ✓ | ✓ | ✓ | ✓ |
| analyst | ✓ | ✓ | ✓ | ✓ |
| creator | ✓ | ✗ | ✗ | ✗ |
| viewer | ✓ | ✗ | ✗ | ✗ |

### Pre-built Report Templates

```javascript
// Available based on organization context
AGENCY_REPORTS: [
    'Client Performance Overview',
    'Campaign ROI by Client',
    'Monthly Client Summary'
]

FRANCHISE_REPORTS: [
    'Location Performance Ranking',
    'Brand Compliance Score',
    'Regional Comparisons'
]

ENTERPRISE_REPORTS: [
    'Department Summary',
    'Team Productivity',
    'Approval Bottlenecks'
]
```

## Implementation Examples

### Checking Permissions

```javascript
import { hasPermission, STANDARD_ROLES } from '@/lib/permissions-v2-standardized'

// Simple permission check
const canEdit = await hasPermission(user, 'templates:edit', {
    accountId: template.accountId,
    isLocked: template.isLocked
})

// Check role level
const userRole = STANDARD_ROLES[user.roleId]
if (userRole.level >= 80) {
    // Manager or above
}

// Get role display name for UI
const displayName = getRoleDisplayName('manager', 'AGENCY')
// Returns: "Account Manager"
```

### Applying Data Filters

```javascript
import { getDataFilter } from '@/lib/permissions-v2-standardized'

// Get filter based on user's scope
const role = STANDARD_ROLES[user.roleId]
const filter = getDataFilter(user, role)

// Apply to database query
const campaigns = await Campaign.find({
    ...filter,
    status: 'active'
})
```

### Role Assignment

```javascript
// Assign role to user based on organization context
const assignRole = (user, roleId, orgContext) => {
    user.roleId = roleId // Standard role ID
    user.roleDisplayName = getRoleDisplayName(roleId, orgContext)
    user.dataScope = STANDARD_ROLES[roleId].dataScope
    
    // Set capabilities
    const capabilities = STANDARD_ROLES[roleId].capabilities
    user.requiresApproval = capabilities.requiresApproval || false
    user.canApproveOthers = capabilities.canApproveContent || false
}

// Example: Agency adding a creative
assignRole(newUser, 'creator', 'AGENCY')
// User gets 'creator' role, displays as "Creative"
```

### Managing Hybrid Organizations

```javascript
// Agency working with franchise
const agencyInFranchise = {
    organizationType: 'AGENCY_FRANCHISE',
    parentOrg: franchiseId,
    users: [
        { roleId: 'owner', display: 'Master Account' },
        { roleId: 'manager', display: 'Partner Manager' },
        { roleId: 'creator', display: 'Content Partner' }
    ]
}

// Check permissions in hybrid context
const canManage = await hasPermission(user, 'accounts:manage', {
    orgContext: 'AGENCY_FRANCHISE',
    parentOrg: franchiseId,
    subAccount: locationId
})
```

## Restrictions

Restrictions can be applied to any role to limit capabilities:

| Restriction | Description | Commonly Applied To |
|------------|-------------|-------------------|
| `cannot_edit_locked` | Cannot modify locked items | creator, publisher |
| `requires_approval` | Must get approval to publish | creator |
| `brand_compliance` | Must use approved assets | creator, publisher |
| `time_limited` | Access expires | guest, viewer |
| `ip_restricted` | IP whitelist enforced | admin, manager |
| `read_only_analytics` | Can't export data | viewer, guest |

## Migration from Old System

### Automatic Role Mapping

```javascript
// Old system → New standardized roles
const migration = {
    // Direct mappings (same name)
    'owner': 'owner',
    'admin': 'admin',
    'creator': 'creator',
    
    // Renamed for clarity
    'member': 'viewer',
    
    // Organization-specific to standard
    'agency_owner': 'owner',
    'agency_account_manager': 'manager',
    'franchise_corporate': 'owner',
    'franchise_location_owner': 'publisher',
    'enterprise_admin': 'admin',
    'enterprise_contributor': 'creator'
}
```

### Running Migration

```javascript
import { migrateToStandardRoles } from '@/lib/permissions-migration'

await migrateToStandardRoles({
    preserveContext: true, // Keep organization labels
    mapCustomRoles: true,  // Map custom roles to nearest standard
    backup: true           // Backup before migration
})
```

## Performance Optimizations

### Caching Strategy
- Permission checks: 5-minute TTL
- Role definitions: 10-minute TTL
- Data scopes: 5-minute TTL
- Context labels: Session-based

### Required Database Indexes
```javascript
// Users
{ 'stores.roleId': 1 }
{ 'isSuperUser': 1 }

// Stores
{ organization_type: 1 }
{ parent_store_id: 1 }

// Content
{ store_id: 1, created_by: 1 }
{ lock_level: 1 }
```

## Best Practices

### 1. Use Standard Roles
Always use the standard role system rather than creating custom roles. The 11 standard roles cover 99% of use cases.

### 2. Set Organization Context
Always specify organization context for proper role labeling:
```javascript
getRoleDisplayName(roleId, 'AGENCY') // Not just roleId
```

### 3. Leverage Role Levels
Use role levels for hierarchy checks:
```javascript
if (userRole.level > targetRole.level) {
    // Can manage target user
}
```

### 4. Apply Appropriate Restrictions
Add restrictions rather than creating new roles:
```javascript
user.restrictions = ['requires_approval', 'brand_compliance']
```

### 5. Cache Permission Checks
The system automatically caches, but batch checks when possible:
```javascript
const permissions = await checkMultiplePermissions(user, [
    'templates:edit',
    'campaigns:create',
    'content:approve'
])
```

## Security Considerations

### Admin-Only Features
- **Integrations**: Only owner/admin roles
- **Billing**: Only owner role
- **Account Deletion**: Only owner role
- **User Management**: Manager level and above

### Super User Security
- Require 2FA for super users
- IP whitelist enforcement
- Session monitoring
- Comprehensive audit logging
- Regular access reviews

### Permission Escalation Prevention
```javascript
// Users can only assign roles lower than their own
function canAssignRole(assigner, targetRoleId) {
    const assignerRole = STANDARD_ROLES[assigner.roleId]
    const targetRole = STANDARD_ROLES[targetRoleId]
    return assignerRole.level > targetRole.level
}
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Permission denied" | Missing required permission | Check user's roleId and level |
| "Cannot view integrations" | Not admin/owner role | Only Level 90+ can access |
| "Cannot edit locked template" | Insufficient level | Need brand_guardian or higher |
| "Cannot approve content" | Role can't approve | Need reviewer, manager, or higher |
| "Data not visible" | Wrong data scope | Check assignedAccounts array |

### Debug Checklist
```javascript
console.log("User role:", user.roleId)
console.log("Role level:", STANDARD_ROLES[user.roleId].level)
console.log("Data scope:", user.dataScope)
console.log("Organization context:", user.organizationType)
console.log("Can approve:", user.canApproveOthers)
console.log("Requires approval:", user.requiresApproval)
```

## API Reference

### Core Functions

```javascript
// Permission checking
hasPermission(user, permission, context)

// Role management
getRoleDisplayName(roleId, orgContext)
getAvailableRoles(orgContext, includeCustom)
getRoleCapabilities(roleId)

// Data filtering
getDataFilter(user, role)

// User management
canManageUser(manager, targetUser)
canAssignRole(assigner, targetRoleId)

// Special checks
canAccessIntegrations(user, context)
requiresApproval(roleId, restrictions)

// Super user functions
isSuperUser(user)
viewAsAccount(superUser, targetAccountId)
exitViewAsMode(superUser)
```

### Constants

```javascript
STANDARD_ROLES = {
    owner, admin, manager, brand_guardian,
    creator, publisher, reviewer, analyst,
    viewer, guest, custom, super_user
}

ORGANIZATION_CONTEXTS = {
    AGENCY, FRANCHISE, ENTERPRISE, AGENCY_FRANCHISE
}

DATA_SCOPES = {
    system, global, organization, assigned_accounts,
    department, team, own_account, own_content, specific_items
}

RESTRICTIONS = {
    cannot_edit_locked, requires_approval, brand_compliance,
    time_limited, ip_restricted, read_only_analytics
}
```

## Future Enhancements

1. **Dynamic Role Creation** - UI for creating custom roles from standard templates
2. **Permission Analytics** - Track which permissions are most used
3. **Role Recommendations** - AI suggests best role based on usage patterns
4. **Temporary Permissions** - Grant time-limited elevated access
5. **Cross-Organization Federation** - Share permissions across organizations
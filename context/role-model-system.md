# Role Model System v2

## Overview

The Role Model System v2 provides a simplified, scalable permission system designed for three primary organization types:
- **Agencies** managing multiple client accounts
- **Franchises** with brand protection and location control  
- **Enterprises** with department/division structures
- **Super Users** with system-wide administrative access

The system uses a **Feature → Action → Scope** model that's easier to understand and manage than traditional role-based systems.

## Architecture

### Core Models

1. **Role Model** (`/models/Role.js`)
   - Stores role definitions with permission bundles
   - Supports smart roles with context-aware permissions
   - Includes data scopes and restrictions

2. **User Model** (`/models/User.js`)
   - References roles via `roleId`
   - Supports super user flag for system administrators
   - Maintains assigned accounts for cross-account access

3. **Store Model** (`/models/Store.js`)
   - Defines organization type (agency, franchise, enterprise)
   - Supports parent-child relationships for sub-accounts
   - Includes template locking and brand controls

### Permission Structure

```
Feature (8) × Action (9) = 72 possible permissions
```

**Features:**
- Dashboard, Templates, Campaigns, Content, Analytics, Accounts, Settings, Billing

**Actions:**
- View, Create, Edit, Delete, Approve, Publish, Lock, Distribute, Export

**Format:** `feature:action` (e.g., `templates:edit`, `campaigns:approve`)

## Standardized Roles (Universal System)

### Core Roles - Work Across All Organization Types

| Role ID | Name | Level | Description | Data Scope | Key Capabilities |
|---------|------|-------|-------------|------------|------------------|
| **owner** | Owner | 100 | Full control over account | Global | All permissions, billing, account deletion |
| **admin** | Administrator | 90 | Administrative control | Organization | All except billing & deletion |
| **manager** | Manager | 80 | Team & content management | Assigned Accounts | Approve, distribute, manage teams |
| **brand_guardian** | Brand Guardian | 70 | Brand consistency control | Organization | Lock templates, enforce standards |
| **creator** | Creator | 60 | Content creation | Assigned Accounts | Create/edit, requires approval |
| **publisher** | Publisher | 50 | Direct publishing rights | Assigned Accounts | Publish without approval |
| **reviewer** | Reviewer | 40 | Content approval only | Assigned Accounts | Review and approve |
| **analyst** | Analyst | 30 | Data analysis | Assigned Accounts | View/export analytics |
| **viewer** | Viewer | 20 | Read-only access | Assigned Accounts | View only |
| **guest** | Guest | 10 | Limited access | Specific Items | View shared items |

### Organization Context Mapping

The same role gets different display labels based on the organization context:

```javascript
// Role display varies by context
getRoleDisplayName('manager', 'AGENCY')     // "Account Manager"
getRoleDisplayName('manager', 'FRANCHISE')  // "Regional Manager"
getRoleDisplayName('manager', 'ENTERPRISE') // "Department Head"

// But the permissions remain the same
const role = STANDARD_ROLES['manager'] // Same permissions regardless
```

### Flexible Organization Support

#### Agency Working with Franchise:
- Agency Owner (owner) manages Franchise Account
- Account Manager (manager) handles franchise locations
- Creative (creator) develops franchise content
- Brand Guardian ensures franchise compliance

#### Enterprise Using Agency:
- Executive (owner) oversees agency relationship
- Department Head (manager) coordinates with agency
- Agency has Creator role in enterprise system
- Agency Publisher can deploy to enterprise

#### Franchise with Agency Support:
- Franchisor (owner) grants agency access
- Agency Manager gets manager role
- Agency Creative gets creator role
- Franchise Brand Guardian maintains control

### Super User Role

| Role | Description | Permissions | Special Abilities |
|------|------------|-------------|-------------------|
| **super_user** | System admin | `*:*` (all) | View as any account, Bypass all restrictions, System maintenance |

## Permission Bundles

Instead of managing individual permissions, use pre-configured bundles:

### Agency Client Manager Bundle
```javascript
{
    name: 'Client Manager',
    permissions: [
        'accounts:view',
        'accounts:edit',
        'templates:distribute',
        'campaigns:approve',
        'analytics:view',
        'analytics:export',
        'content:approve'
    ],
    dataScope: 'assigned_accounts'
}
```

### Franchise Brand Guardian Bundle
```javascript
{
    name: 'Brand Guardian',
    permissions: [
        'templates:create',
        'templates:lock',
        'templates:distribute',
        'content:approve',
        'campaigns:approve',
        'analytics:view'
    ],
    dataScope: 'organization',
    restrictions: ['cannot_be_overridden']
}
```

### Location Manager Bundle
```javascript
{
    name: 'Location Manager',
    permissions: [
        'dashboard:view',
        'templates:view',
        'campaigns:create',
        'campaigns:publish',
        'content:create',
        'analytics:view'
    ],
    dataScope: 'own_account',
    restrictions: ['cannot_edit_locked', 'template_compliance']
}
```

## Data Scopes

Control what data users can access:

| Scope | Level | Description | Use Case |
|-------|-------|-------------|----------|
| **Global** | 100 | All data across system | Super users, Owners |
| **Organization** | 90 | All org data | Corporate admins |
| **Assigned Accounts** | 70 | Specific accounts only | Account managers |
| **Department** | 50 | Department data | Department heads |
| **Team** | 40 | Team members' data | Team leads |
| **Own Account** | 30 | Single account | Location owners |
| **Own Content** | 20 | Created content only | Contributors |

## Approval Workflows

### Workflow Stages
```
DRAFT → SUBMITTED → IN_REVIEW → APPROVED → PUBLISHED
              ↓
      CHANGES_REQUESTED
```

### Organization-Specific Chains

**Agency:** Creator → Account Manager → Client → Published
**Franchise:** Location → Regional → Corporate → Published  
**Enterprise:** Contributor → Team Lead → Dept Head → Published

## Template Locking

### Lock Levels

| Level | What's Locked | Use Case |
|-------|--------------|-----------|
| **Unlocked** | Nothing | General templates |
| **Content Locked** | Text, Images | Layout templates |
| **Layout Locked** | Structure | Content updates |
| **Brand Locked** | Brand elements | Franchise templates |
| **Fully Locked** | Everything | Compliance templates |

### Lockable Elements
- Header, Footer, Logo, Brand Colors, Fonts, Legal Text, Social Links

## Database Schema

### Role Collection
```javascript
{
    _id: ObjectId,
    roleId: String,              // Unique identifier (e.g., 'agency_owner')
    name: String,                // Display name
    description: String,         
    bundle: String,              // Permission bundle reference
    permissions: [String],       // Array of 'feature:action' strings
    dataScope: String,           // Data access level
    restrictions: [String],      // Applied restrictions
    customizable: Boolean,       
    canManageSubAccounts: Boolean,
    canBeAssignedTo: [String],   // ['root_account', 'sub_account']
    store_id: ObjectId,          // Store reference
    is_system_role: Boolean,     
    created_at: Date,
    updated_at: Date
}
```

### User Collection Updates
```javascript
{
    _id: ObjectId,
    email: String,
    isSuperUser: Boolean,        // Super user flag
    stores: [{
        store_id: ObjectId,
        roleId: String,          // Reference to Role
        dataScope: String,       // User-specific override
        restrictions: [String],  // User-specific restrictions
        assignedAccounts: [ObjectId], // For cross-account access
        assignedStores: [ObjectId],
        customPermissions: [String], // Additional permissions
        approvalLevel: String,
        canApproveOthers: Boolean,
        joined_at: Date
    }]
}
```

### Store Collection Updates
```javascript
{
    _id: ObjectId,
    name: String,
    organization_type: String,   // 'agency', 'franchise', 'enterprise'
    account_type: String,        // 'root_account', 'sub_account'
    parent_store_id: ObjectId,   // For sub-accounts
    organization_id: String,     // Organization identifier
    locked_elements: {           // For franchise brand protection
        templates: [ObjectId],
        brandAssets: Map
    },
    permission_version: String,  // 'v2' for new system
    users: [{
        userId: ObjectId,
        roleId: String,          // Reference to Role
        addedAt: Date,
        addedBy: ObjectId
    }]
}
```

## API Endpoints

### Role Management
- `GET /api/store/[storeId]/roles` - List roles
- `POST /api/store/[storeId]/roles` - Create role
- `PUT /api/store/[storeId]/roles/[roleId]` - Update role
- `DELETE /api/store/[storeId]/roles/[roleId]` - Delete role

### Permission Checking
- `GET /api/permissions/check` - Check specific permission
- `GET /api/permissions/actions` - Get available actions for resource
- `GET /api/permissions/data-filter` - Get data scope filter

### Super User Operations
- `POST /api/super/view-as` - View as another account
- `POST /api/super/exit-view-as` - Exit view-as mode
- `GET /api/super/audit-logs` - Access all audit logs
- `POST /api/super/override` - Override restrictions

## Implementation Examples

### Checking Permissions
```javascript
import { hasPermission } from '@/lib/permissions-v2'

// Simple check
const canEdit = await hasPermission(user, 'templates:edit', {
    accountId: template.accountId,
    isLocked: template.isLocked
})

// Super user bypass
if (user.isSuperUser) {
    return true // Always allow
}
```

### Applying Data Filters
```javascript
import { getDataFilter } from '@/lib/permissions-v2'

// Get filter based on user's scope
const filter = getDataFilter(user, role)

// Apply to database query
const campaigns = await Campaign.find({
    ...filter,
    status: 'active'
})
```

### Template Locking
```javascript
import { isElementLocked, TEMPLATE_CONTROLS } from '@/lib/permissions-v2'

// Check if element is locked
if (isElementLocked(template, 'header')) {
    if (!user.isSuperUser) {
        throw new Error('Cannot edit locked header')
    }
}

// Lock template for franchises
template.lockLevel = TEMPLATE_CONTROLS.LOCK_LEVELS.BRAND_LOCKED
template.lockedElements = ['header', 'footer', 'logo']
```

### Super User View-As
```javascript
// Enable view-as mode
if (user.isSuperUser) {
    session.viewingAs = {
        accountId: targetAccountId,
        originalUser: user._id,
        superUserMode: true
    }
    
    // Log action
    await AuditLog.create({
        user: user._id,
        action: 'SUPER_USER_VIEW_AS',
        target: targetAccountId
    })
}
```

## Migration Guide

### From Old System to v2

1. **Identify Organization Type**
```javascript
// Analyze existing structure
if (store.has_multiple_clients) {
    store.organization_type = 'agency'
} else if (store.is_franchise) {
    store.organization_type = 'franchise'
} else {
    store.organization_type = 'enterprise'
}
```

2. **Map Old Roles to New**
```javascript
const roleMapping = {
    'owner': 'agency_owner',        // or franchise_corporate, enterprise_admin
    'admin': 'agency_account_manager',
    'creator': 'enterprise_contributor',
    'member': 'analytics_viewer'
}
```

3. **Run Migration**
```javascript
import { runMigration } from '@/lib/permissions-migration'

await runMigration(db, {
    backup: true,
    orgType: 'agency',
    identifySuperUsers: true
})
```

## Performance Optimizations

### Caching
- Permission checks: 5-minute TTL
- Role definitions: 10-minute TTL
- Data scopes: 5-minute TTL
- Super user status: Session-based

### Required Indexes
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

### 1. Use Smart Roles
Don't create custom permissions unless necessary. Use pre-configured bundles.

### 2. Leverage Data Scopes
Let the system handle data filtering based on scope rather than manual checks.

### 3. Audit Super User Actions
Always log when super users perform sensitive operations.

### 4. Cache Strategically
Use the built-in caching to improve performance.

### 5. Regular Reviews
Periodically review role assignments and permissions.

## Security Considerations

### Super User Security
- Require 2FA for super users
- IP whitelist for super user access
- Session monitoring and timeout
- Comprehensive audit logging
- Regular security reviews

### Permission Escalation Prevention
- Only super users can create other super users
- Role changes require appropriate permissions
- All permission changes are logged
- Regular audit of permission changes

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| User can't see content | Check data scope and assigned accounts |
| Permission check slow | Verify indexes and cache configuration |
| Locked template edited | Check lock level and super user status |
| Approval workflow stuck | Verify approval chain configuration |
| Super user can't view-as | Check session and audit logs |

## Future Enhancements

1. **AI-Powered Permission Suggestions** - Recommend roles based on usage patterns
2. **Permission Analytics** - Track permission usage and optimize
3. **Dynamic Scopes** - Time-based or condition-based scopes
4. **Federated Permissions** - Cross-organization permission sharing
5. **Permission Marketplace** - Share role templates across organizations

## Support

For additional help:
- Review examples in `/lib/permissions-implementation-example.js`
- Check API documentation for permission endpoints
- Contact system administrator for role changes
- Submit feature requests for new permission types
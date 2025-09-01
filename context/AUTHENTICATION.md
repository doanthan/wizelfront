# Authentication & Authorization Documentation (v2)

## Overview

This application uses a simplified, scalable permission system (v2) that supports:
- JWT-based authentication via NextAuth.js
- Feature-based permissions (Feature → Action → Scope model)
- Smart roles for agencies, franchises, and enterprises
- Data scope filtering for multi-account management
- Super user system for administrative access

## Core Concepts

### Permission Format
Permissions follow a `feature:action` format:
- `templates:edit` - Can edit templates
- `campaigns:approve` - Can approve campaigns
- `analytics:export` - Can export analytics
- `*:*` - Super user with all permissions

### Features & Actions
```javascript
FEATURES: dashboard, templates, campaigns, content, analytics, accounts, settings, billing, integrations
ACTIONS: view, create, edit, delete, approve, publish, lock, distribute, export
```

## Authentication Flow

### 1. User Login
Users authenticate using NextAuth.js with JWT tokens. The authentication configuration is located in `/app/api/auth/[...nextauth]/route.js`.

### 2. Token Validation
```javascript
import { getUserFromToken } from "@/lib/auth-utils"

// In API route
const { user, error } = await getUserFromToken(request)
if (error) {
    return NextResponse.json({ error: error }, { status: 401 })
}
```

## Authorization Model (v2)

### User Schema (Updated)
```javascript
stores: [{
    store_id: ObjectId,
    store_public_id: String,
    roleId: String,                    // Smart role ID (e.g., 'agency_owner')
    dataScope: String,                 // Data access level
    assignedAccounts: [ObjectId],      // Cross-account access
    assignedStores: [ObjectId],         // Accessible stores
    customPermissions: [String],       // Additional permissions
    restrictions: [String],            // Applied restrictions
    organization_type: String,         // agency, franchise, enterprise
}]
```

### Standardized Roles (Organization-Agnostic)

These roles work across all organization types (agencies, franchises, enterprises, and hybrids):

| Role ID | Name | Level | Purpose | Key Permissions |
|---------|------|-------|---------|-----------------|
| **owner** | Owner | 100 | Full control | All permissions (*:*) |
| **admin** | Administrator | 90 | Admin control | All except delete account |
| **manager** | Manager | 80 | Team & content management | Manage, approve, distribute |
| **brand_guardian** | Brand Guardian | 70 | Brand consistency | Lock templates, enforce standards |
| **creator** | Creator | 60 | Content creation | Create/edit, requires approval |
| **publisher** | Publisher | 50 | Direct publishing | Create/publish without approval |
| **reviewer** | Reviewer | 40 | Content approval | Review and approve only |
| **analyst** | Analyst | 30 | Data analysis | View and export analytics |
| **viewer** | Viewer | 20 | Read-only | View content and dashboards |
| **guest** | Guest | 10 | Limited access | View specific shared items |
| **super_user** | Super User | 999 | System admin | Bypass all restrictions |

#### Role Context Labels

The same role can have different display names based on organization context:

**Agency Context:**
- owner → "Agency Owner"
- manager → "Account Manager"  
- creator → "Creative"
- reviewer → "Client Success"

**Franchise Context:**
- owner → "Franchisor"
- manager → "Regional Manager"
- creator → "Location Manager"
- publisher → "Franchisee"

**Enterprise Context:**
- owner → "Executive"
- manager → "Department Head"
- creator → "Content Creator"
- brand_guardian → "Brand Team"

**Hybrid (Agency + Franchise):**
- owner → "Master Account"
- manager → "Partner Manager"
- creator → "Content Partner"
- publisher → "Local Partner"

### Data Scopes
- **global** - All data across system
- **organization** - All organizational data
- **assigned_accounts** - Specific assigned accounts only
- **department** - Department data only
- **team** - Team members' data
- **own_account** - Single account only
- **own_content** - Only content user created

## Permission Checking (v2)

### Using the New Permission System

```javascript
import { hasPermission, getDataFilter, canAccessIntegrations } from "@/lib/permissions-v2"

export async function GET(request) {
    try {
        await connectToDatabase()
        
        // Get authenticated user
        const { user, error } = await getUserFromToken(request)
        if (error) {
            return NextResponse.json({ error: error }, { status: 401 })
        }
        
        // Parse parameters
        const { searchParams } = new URL(request.url)
        const storeId = searchParams.get("storeId")
        
        // Check permission using v2 system
        const canView = await hasPermission(user, 'campaigns:view', {
            storeId: storeId,
            accountId: storeId
        })
        
        if (!canView) {
            return NextResponse.json(
                { error: "You don't have permission to view campaigns" },
                { status: 403 }
            )
        }
        
        // Get user's role and data filter
        const role = await getUserRole(user)
        const dataFilter = getDataFilter(user, role)
        
        // Apply data scope filtering
        const campaigns = await Campaign.find({
            ...dataFilter,
            status: 'active'
        })
        
        return NextResponse.json({ campaigns })
    } catch (error) {
        console.error("Error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
```

### Integration Access (Admin Only)

```javascript
// Only admins can view integrations
export async function GET(request) {
    const { user, error } = await getUserFromToken(request)
    if (error) return NextResponse.json({ error }, { status: 401 })
    
    const canAccess = await canAccessIntegrations(user, {
        storeId: request.query.storeId
    })
    
    if (!canAccess) {
        return NextResponse.json(
            { error: "Only administrators can view integrations" },
            { status: 403 }
        )
    }
    
    // Proceed with integration data...
}
```

### Approval Workflow

```javascript
import { canApproveAtStage, APPROVAL_WORKFLOW } from "@/lib/permissions-v2"

// Check if user can approve at current stage
const canApprove = canApproveAtStage(user, campaign.stage, 'agency')

if (!canApprove) {
    return NextResponse.json(
        { error: "Cannot approve at this workflow stage" },
        { status: 403 }
    )
}

campaign.stage = APPROVAL_WORKFLOW.STAGES.APPROVED
campaign.approvedBy = user.id
```

### Template Locking (Franchise)

```javascript
import { isElementLocked, TEMPLATE_CONTROLS } from "@/lib/permissions-v2"

// Check if template element is locked
if (isElementLocked(template, 'header')) {
    if (!user.isSuperUser) {
        return NextResponse.json(
            { error: "Cannot edit locked header" },
            { status: 403 }
        )
    }
}
```

## Super User System (v2)

### Super User Capabilities
```javascript
// Check if user is super user
if (user.isSuperUser) {
    // Bypass all permission checks
    // Access all data without filters
    // Can view as any account
    return true
}

// View as another account
import { viewAsAccount, exitViewAsMode } from "@/lib/permissions-v2"

if (user.isSuperUser) {
    const session = viewAsAccount(user, targetAccountId)
    // All subsequent queries use target account context
}
```

### Super User API Endpoints
```javascript
// Super user only endpoint
export async function POST(request) {
    const { user, error } = await getUserFromToken(request)
    if (error) return NextResponse.json({ error }, { status: 401 })
    
    if (!user.isSuperUser) {
        return NextResponse.json(
            { error: "Super user access required" },
            { status: 403 }
        )
    }
    
    // Log super user action
    await AuditLog.create({
        user: user._id,
        action: 'SUPER_USER_ACTION',
        details: request.body,
        timestamp: new Date()
    })
    
    // Proceed with super user operation...
}
```

## API Endpoint Protection Examples

### 1. Campaign Management
```javascript
// GET /api/campaigns
export async function GET(request) {
    const { user } = await getUserFromToken(request)
    
    // Check view permission
    if (!await hasPermission(user, 'campaigns:view', context)) {
        return NextResponse.json({ error: "Cannot view campaigns" }, { status: 403 })
    }
    
    // Apply data filtering based on user's scope
    const filter = getDataFilter(user, await getUserRole(user))
    const campaigns = await Campaign.find(filter)
    
    return NextResponse.json({ campaigns })
}

// POST /api/campaigns
export async function POST(request) {
    const { user } = await getUserFromToken(request)
    
    // Check create permission
    if (!await hasPermission(user, 'campaigns:create', context)) {
        return NextResponse.json({ error: "Cannot create campaigns" }, { status: 403 })
    }
    
    // Check if requires approval
    const role = await getUserRole(user)
    if (role.requiresApproval) {
        campaign.status = 'pending_approval'
    }
    
    // Create campaign...
}
```

### 2. Template Management
```javascript
// PUT /api/templates/:id/lock
export async function PUT(request) {
    const { user } = await getUserFromToken(request)
    
    // Only certain roles can lock templates
    if (!await hasPermission(user, 'templates:lock', context)) {
        return NextResponse.json({ error: "Cannot lock templates" }, { status: 403 })
    }
    
    const template = await Template.findById(request.params.id)
    template.lockLevel = TEMPLATE_CONTROLS.LOCK_LEVELS.BRAND_LOCKED
    template.lockedElements = ['header', 'footer', 'logo']
    
    await template.save()
}
```

### 3. Analytics & Reporting
```javascript
// GET /api/analytics/export
export async function GET(request) {
    const { user } = await getUserFromToken(request)
    
    // Check export permission
    if (!await hasPermission(user, 'analytics:export', context)) {
        return NextResponse.json({ error: "Cannot export analytics" }, { status: 403 })
    }
    
    // Get data based on user's scope
    const role = await getUserRole(user)
    const filter = getDataFilter(user, role)
    
    // Different aggregation based on scope
    if (role.dataScope === 'global') {
        // Export all data
    } else if (role.dataScope === 'assigned_accounts') {
        // Export only assigned accounts
    } else {
        // Export only own account
    }
}
```

### 4. Integration Management (Admin Only)
```javascript
// GET /api/integrations
export async function GET(request) {
    const { user } = await getUserFromToken(request)
    
    // Check integration access (admin only)
    if (!await canAccessIntegrations(user, context)) {
        return NextResponse.json(
            { error: "Only administrators can view integrations" },
            { status: 403 }
        )
    }
    
    // Return integration data...
}

// POST /api/integrations/klaviyo/connect
export async function POST(request) {
    const { user } = await getUserFromToken(request)
    
    // Check if user can manage integrations
    if (!await hasPermission(user, 'integrations:edit', context)) {
        return NextResponse.json(
            { error: "Cannot manage integrations" },
            { status: 403 }
        )
    }
    
    // Connect integration...
}
```

### 5. User Management
```javascript
// PUT /api/store/:storeId/members/:userId/role
export async function PUT(request) {
    const { user } = await getUserFromToken(request)
    const { roleId } = await request.json()
    
    // Check if user can manage team
    if (!await hasPermission(user, 'accounts:edit', context)) {
        return NextResponse.json(
            { error: "Cannot manage team members" },
            { status: 403 }
        )
    }
    
    // Update user's role
    const targetUser = await User.findById(request.params.userId)
    const storeAccess = targetUser.stores.find(s => 
        s.store_id.toString() === request.params.storeId
    )
    
    if (storeAccess) {
        storeAccess.roleId = roleId
        await targetUser.save()
    }
    
    return NextResponse.json({ success: true })
}
```

## Middleware for Route Protection

### Permission Middleware
```javascript
import { hasPermission } from '@/lib/permissions-v2'

export function requirePermission(permission) {
    return async (request, response, next) => {
        const { user, error } = await getUserFromToken(request)
        
        if (error) {
            return response.status(401).json({ error: "Unauthorized" })
        }
        
        const context = {
            storeId: request.params.storeId || request.query.storeId,
            accountId: request.params.accountId,
        }
        
        if (!await hasPermission(user, permission, context)) {
            return response.status(403).json({ 
                error: `Permission denied: ${permission} required` 
            })
        }
        
        // Add user's data filter to request
        request.dataFilter = getDataFilter(user, await getUserRole(user))
        
        next()
    }
}

// Usage in routes
app.get('/api/campaigns', 
    requirePermission('campaigns:view'), 
    getCampaigns
)

app.post('/api/templates/:id/lock', 
    requirePermission('templates:lock'), 
    lockTemplate
)

app.get('/api/integrations', 
    requirePermission('integrations:view'), 
    getIntegrations
)
```

## Security Best Practices

1. **Always use the permission system** - Never bypass permission checks
2. **Apply data filters** - Use `getDataFilter()` for all queries
3. **Check integration access** - Only admins should access integrations
4. **Log super user actions** - Audit all super user activities
5. **Validate context** - Always pass proper context to permission checks
6. **Cache permission checks** - The system automatically caches for 5 minutes
7. **Use smart roles** - Don't create custom permissions unless necessary

## Common Permission Patterns

### Read Operations
```javascript
await hasPermission(user, 'feature:view', context)
```

### Write Operations
```javascript
await hasPermission(user, 'feature:create', context)
await hasPermission(user, 'feature:edit', context)
await hasPermission(user, 'feature:delete', context)
```

### Approval Operations
```javascript
await hasPermission(user, 'feature:approve', context)
canApproveAtStage(user, stage, orgType)
```

### Administrative Operations
```javascript
await hasPermission(user, 'accounts:edit', context)
await hasPermission(user, 'settings:edit', context)
await canAccessIntegrations(user, context)
```

## API Response Standards

### Success Response
```javascript
{
    success: true,
    data: {...},
    meta: {
        scope: user.dataScope,
        permissions: user.permissions
    }
}
```

### Permission Denied Response
```javascript
{
    error: "Permission denied",
    required: "campaigns:edit",
    userRole: "agency_creative",
    details: "Creative role cannot edit campaigns"
}
```

### Data Filtered Response
```javascript
{
    data: [...], // Filtered based on user's scope
    meta: {
        totalRecords: 100,
        visibleRecords: 25,
        scope: "assigned_accounts",
        filters: ["account_id", "store_id"]
    }
}
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Permission denied" | Missing required permission | Check user's roleId and permissions |
| "Cannot view integrations" | Not an admin role | Only admin roles can access integrations |
| "Cannot edit locked template" | Template is locked | Check if user has override permission or is super user |
| "Data not visible" | Data scope filtering | Check user's dataScope and assignedAccounts |
| "Cannot approve" | Wrong workflow stage | Verify user's approval level matches stage |

### Debug Checklist
```javascript
console.log("User role:", user.roleId)
console.log("Data scope:", user.dataScope)
console.log("Assigned accounts:", user.assignedAccounts)
console.log("Is super user:", user.isSuperUser)
console.log("Can access integrations:", await canAccessIntegrations(user))
```


## Performance Considerations

1. **Permission Caching** - 5-minute TTL, automatic invalidation
2. **Database Indexes** - Ensure indexes on roleId, dataScope, store_id
3. **Batch Permission Checks** - Check multiple permissions in one call
4. **Precomputed Filters** - Data filters are cached per user session

## Future Enhancements

1. **Dynamic Permissions** - Time-based or condition-based permissions
2. **Permission Analytics** - Track which permissions are most used
3. **API Rate Limiting** - Per-role rate limits
4. **Federated Permissions** - Cross-organization permission sharing
5. **AI Permission Suggestions** - Recommend roles based on usage
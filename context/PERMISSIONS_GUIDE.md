# Permission System Guide v3 - Universal Multi-Contract Architecture

## Overview

Our permission system is built around **universal roles** and **multi-contract support**, designed for modern work patterns where:

- **Content creators** can work for multiple agencies simultaneously
- **Agencies** can manage multiple client contracts
- **Franchises** can work with agencies while maintaining brand control
- **Enterprises** can use agencies or manage internal teams
- **Users** can have different roles across different contracts

The system uses a **Contract-Seat-Role** model that eliminates organization-type restrictions and provides maximum flexibility.

## Core Architecture

### 1. Four-Entity Model

```
User ↔ ContractSeat ↔ Contract ↔ Store
         ↓
        Role
```

- **User**: The person (email, profile, global settings)
- **Contract**: The billing/subscription entity (who pays)
- **ContractSeat**: The relationship between User and Contract (permissions, access)
- **Store**: Where the work happens (campaigns, content, brands)
- **Role**: Universal permissions that work across all contract types

### 2. Multi-Contract Support

A single user can have multiple seats across different contracts:

```javascript
// Example: Sarah works for 3 different agencies
User: sarah@example.com
├── ContractSeat in "Digital Agency" (role: creator)
├── ContractSeat in "Brand Studio" (role: manager) 
└── ContractSeat in "Marketing Co" (role: reviewer)
```

### 3. Universal Permission Structure

All permissions are organized into logical feature groups:

```javascript
permissions: {
    stores: { create, edit, delete, manage_integrations },
    campaigns: { create, edit_own, edit_all, approve, send, delete },
    ai: { generate_content, use_premium_models, unlimited_regenerations },
    brands: { create, edit, delete },
    team: { invite_users, remove_users, manage_roles, manage_store_access },
    analytics: { view_own, view_all, export, view_financial },
    billing: { view, manage, purchase_credits }
}
```

## Universal Role System

The system uses **6 core roles** that work across all contract types - whether it's an individual, agency, enterprise, or franchise. No more organization-specific roles!

### Core Roles (Level-Based Hierarchy)

| Role | Level | Purpose | Key Capabilities | Typical Use Cases |
|------|-------|---------|-----------------|-------------------|
| **owner** | 100 | Full control | All permissions, billing management, contract deletion | Contract owner, CEO, Franchisor |
| **admin** | 80 | Administrative | Most permissions except billing/deletion | IT admin, Operations manager |
| **manager** | 60 | Team leadership | Approve content, manage team, assign roles | Account manager, Team lead, Regional manager |
| **creator** | 40 | Content creation | Create/edit content, basic AI access | Content creator, Designer, Copywriter |
| **reviewer** | 30 | Content approval | Review and approve content, limited creation | QA lead, Brand guardian, Compliance |
| **viewer** | 10 | Read-only access | View content and analytics only | Client stakeholder, Intern, External viewer |

### Detailed Role Capabilities

#### Owner (Level 100)
```javascript
permissions: {
    stores: { create: true, edit: true, delete: true, manage_integrations: true },
    campaigns: { create: true, edit_own: true, edit_all: true, approve: true, send: true, delete_all: true },
    ai: { generate_content: true, use_premium_models: true, unlimited_regenerations: true },
    brands: { create: true, edit: true, delete: true },
    team: { invite_users: true, remove_users: true, manage_roles: true, manage_store_access: true },
    analytics: { view_own: true, view_all: true, export: true, view_financial: true },
    billing: { view: true, manage: true, purchase_credits: true }
}
capabilities: {
    canManageBilling: true,
    canDeleteContract: true,
    canCreateStores: true,
    creditLimits: "unlimited"
}
```

#### Admin (Level 80)
```javascript
permissions: {
    stores: { create: true, edit: true, delete: false, manage_integrations: true },
    campaigns: { create: true, edit_own: true, edit_all: true, approve: true, send: true, delete_all: false },
    ai: { generate_content: true, use_premium_models: true, unlimited_regenerations: false },
    brands: { create: true, edit: true, delete: false },
    team: { invite_users: true, remove_users: true, manage_roles: true, manage_store_access: true },
    analytics: { view_own: true, view_all: true, export: true, view_financial: false },
    billing: { view: true, manage: false, purchase_credits: true }
}
```

#### Manager (Level 60)
```javascript
permissions: {
    stores: { create: false, edit: true, delete: false, manage_integrations: false },
    campaigns: { create: true, edit_own: true, edit_all: true, approve: true, send: true, delete_own: true },
    ai: { generate_content: true, use_premium_models: false, unlimited_regenerations: false },
    brands: { create: true, edit: true, delete: false },
    team: { invite_users: true, remove_users: false, manage_roles: false, manage_store_access: true },
    analytics: { view_own: true, view_all: true, export: true, view_financial: false },
    billing: { view: false, manage: false, purchase_credits: false }
}
```

#### Creator (Level 40)
```javascript
permissions: {
    stores: { create: false, edit: false, delete: false, manage_integrations: false },
    campaigns: { create: true, edit_own: true, edit_all: false, approve: false, send: false, delete_own: true },
    ai: { generate_content: true, use_premium_models: false, unlimited_regenerations: false },
    brands: { create: false, edit: false, delete: false },
    team: { invite_users: false, remove_users: false, manage_roles: false, manage_store_access: false },
    analytics: { view_own: true, view_all: false, export: false, view_financial: false },
    billing: { view: false, manage: false, purchase_credits: false }
}
requiresApproval: true
```

#### Reviewer (Level 30)
```javascript
permissions: {
    stores: { create: false, edit: false, delete: false, manage_integrations: false },
    campaigns: { create: false, edit_own: false, edit_all: false, approve: true, send: false, delete: false },
    ai: { generate_content: false, use_premium_models: false, unlimited_regenerations: false },
    brands: { create: false, edit: false, delete: false },
    team: { invite_users: false, remove_users: false, manage_roles: false, manage_store_access: false },
    analytics: { view_own: false, view_all: true, export: false, view_financial: false },
    billing: { view: false, manage: false, purchase_credits: false }
}
```

#### Viewer (Level 10)
```javascript
permissions: {
    stores: { create: false, edit: false, delete: false, manage_integrations: false },
    campaigns: { create: false, edit_own: false, edit_all: false, approve: false, send: false, delete: false },
    ai: { generate_content: false, use_premium_models: false, unlimited_regenerations: false },
    brands: { create: false, edit: false, delete: false },
    team: { invite_users: false, remove_users: false, manage_roles: false, manage_store_access: false },
    analytics: { view_own: false, view_all: true, export: false, view_financial: false },
    billing: { view: false, manage: false, purchase_credits: false }
}
```

## Multi-Contract Use Cases

### Scenario 1: Content Creator Working for Multiple Agencies

**User**: Sarah Johnson (sarah@creative.com)
- **ContractSeat 1**: Digital Marketing Agency → Role: `creator`
- **ContractSeat 2**: Brand Studio Co → Role: `manager`  
- **ContractSeat 3**: Startup Incubator → Role: `reviewer`

Sarah can switch between contracts and access different stores/campaigns based on her role in each contract. Her AI credit limits are tracked separately per seat.

### Scenario 2: Agency Managing Multiple Client Contracts

**Contract Owner**: Digital Marketing Agency
- **Client Contract A**: E-commerce Brand → Agency team has `admin` roles
- **Client Contract B**: Restaurant Chain → Agency team has `manager` roles
- **Client Contract C**: Tech Startup → Limited to `creator` roles

The same agency team members can have different permission levels for different clients based on the service agreements.

### Scenario 3: Franchise with Agency Support

**Master Contract**: Franchise Corporate
- **Corporate Team**: `owner` and `admin` roles
- **Regional Managers**: `manager` roles
- **Agency Partner**: `creator` role with brand restrictions

**Location Contracts**: Individual franchise locations
- **Franchisees**: `manager` role in their own location
- **Agency Partner**: `creator` role across selected locations
- **Corporate Brand Team**: `reviewer` role for brand compliance

### Scenario 4: Enterprise with Departments

**Enterprise Contract**: Large Corporation
- **IT Admin**: `admin` role across all stores
- **Marketing Heads**: `manager` roles for their department stores
- **Content Team**: `creator` roles
- **External Agency**: `creator` role with approval requirements

## Database Schema

The new multi-contract architecture uses four main collections:

### 1. User Collection
```javascript
{
    _id: ObjectId,
    email: String,                    // Unique identifier
    name: String,
    public_id: String,                // 7-char nanoid for public references
    
    // Authentication
    password_hash: String,
    email_verified: Boolean,
    last_login: Date,
    
    // Profile
    avatar_url: String,
    timezone: String,
    phone: String,
    
    // Personal contract (if they own one)
    personal_contract_id: ObjectId,   // Ref: Contract
    
    // Quick access to all seats (denormalized)
    active_seats: [{
        contract_id: ObjectId,        // Ref: Contract
        contract_name: String,        // For display
        seat_id: ObjectId,           // Ref: ContractSeat
        added_at: Date
    }],
    
    // Preferences
    notification_preferences: {...},
    
    status: String,                  // active, inactive, suspended
    created_at: Date,
    updated_at: Date
}
```

### 2. Contract Collection
```javascript
{
    _id: ObjectId,
    public_id: String,               // Unique contract identifier
    contract_name: String,           // "Acme Agency", "John's Stores"
    
    // Ownership
    owner_id: ObjectId,              // Ref: User (who pays)
    billing_contact_id: ObjectId,    // Ref: User
    parent_contract_id: ObjectId,    // For hierarchies (optional)
    
    // Billing
    stripe_customer_id: String,
    billing_email: String,
    subscription: {
        stripe_subscription_id: String,
        status: String,              // active, cancelled, past_due, trialing
        tier: String,                // starter, growth, pro, enterprise
        price_per_month: Number,
        trial_ends_at: Date
    },
    
    // Limits
    stores: {
        max_allowed: Number,
        price_per_additional: Number,
        active_count: Number
    },
    
    // AI Credits
    ai_credits: {
        monthly_included: Number,
        current_balance: Number,
        rollover_enabled: Boolean,
        purchased_packages: [...]
    },
    
    // Features
    features: {
        white_label: Boolean,
        custom_domain: String,
        api_access: Boolean,
        sso_enabled: Boolean
    },
    
    status: String,                  // active, suspended, cancelled
    created_at: Date,
    updated_at: Date
}
```

### 3. ContractSeat Collection (New!)
```javascript
{
    _id: ObjectId,
    contract_id: ObjectId,           // Ref: Contract
    user_id: ObjectId,               // Ref: User
    
    // Seat details
    seat_type: String,               // included, additional, complimentary
    default_role_id: ObjectId,       // Ref: Role
    
    // Store-specific access
    store_access: [{
        store_id: ObjectId,          // Ref: Store
        role_id: ObjectId,           // Can override default role per store
        permission_overrides: Map,    // Specific overrides
        assigned_brands: [ObjectId],  // Brand restrictions
        access_granted_at: Date,
        access_granted_by: ObjectId
    }],
    
    // Credit limits for this seat
    credit_limits: {
        daily_limit: Number,
        monthly_limit: Number,
        used_this_month: Number,
        used_today: Number
    },
    
    // Status
    invited_by: ObjectId,            // Who invited this user
    invited_at: Date,
    accepted_at: Date,
    status: String,                  // pending, active, suspended, revoked
    
    // Activity tracking
    last_active_at: Date,
    total_campaigns_created: Number,
    total_content_generated: Number,
    
    created_at: Date,
    updated_at: Date
}
```

### 4. Store Collection
```javascript
{
    _id: ObjectId,
    name: String,
    public_id: String,               // 7-char nanoid
    
    // Contract association
    contract_id: ObjectId,           // Ref: Contract (required)
    
    // Hierarchy (for franchises)
    parent_store_id: ObjectId,       // Optional parent store
    hierarchy_settings: {
        inherit_templates: Boolean,
        inherit_brand_settings: Boolean,
        location_identifier: String   // "NYC-001"
    },
    
    // Quick access team list (denormalized from ContractSeats)
    team_members: [{
        seat_id: ObjectId,           // Ref: ContractSeat
        user_id: ObjectId,           // Ref: User
        role_id: ObjectId,           // Current role for this store
        permission_overrides: Map
    }],
    
    // Store owner (denormalized)
    owner_id: ObjectId,              // Ref: User
    
    // Integrations & settings
    integrations: {...},
    brands: [...],
    settings: {...},
    
    is_active: Boolean,
    created_at: Date,
    updated_at: Date
}
```

### 5. Role Collection (Simplified)
```javascript
{
    _id: ObjectId,
    name: String,                    // owner, admin, manager, creator, reviewer, viewer
    display_name: String,
    description: String,
    level: Number,                   // 100, 80, 60, 40, 30, 10
    
    is_system_role: Boolean,         // true for standard roles
    contract_id: ObjectId,           // null for system roles, set for custom roles
    
    // Universal permissions structure
    permissions: {
        stores: { create: Boolean, edit: Boolean, delete: Boolean, manage_integrations: Boolean },
        campaigns: { create: Boolean, edit_own: Boolean, edit_all: Boolean, approve: Boolean, send: Boolean, delete: Boolean },
        ai: { generate_content: Boolean, use_premium_models: Boolean, unlimited_regenerations: Boolean },
        brands: { create: Boolean, edit: Boolean, delete: Boolean },
        team: { invite_users: Boolean, remove_users: Boolean, manage_roles: Boolean, manage_store_access: Boolean },
        analytics: { view_own: Boolean, view_all: Boolean, export: Boolean, view_financial: Boolean },
        billing: { view: Boolean, manage: Boolean, purchase_credits: Boolean }
    },
    
    created_at: Date,
    updated_at: Date
}
```

## Implementation Examples

### Checking User Access in New System

```javascript
// Check if user has access to a specific store
async function checkUserStoreAccess(userId, storeId, requiredPermission) {
    // Find user's seat for this store's contract
    const store = await Store.findById(storeId);
    const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: store.contract_id,
        status: 'active',
        'store_access.store_id': storeId
    }).populate('default_role_id');
    
    if (!seat) return false;
    
    // Check store-specific role or fall back to default role
    const storeAccess = seat.store_access.find(access => 
        access.store_id.toString() === storeId
    );
    
    const roleToCheck = storeAccess?.role_id || seat.default_role_id;
    
    // Check permission
    return roleToCheck.permissions[requiredPermission.category]?.[requiredPermission.action];
}

// Usage
const canEdit = await checkUserStoreAccess(userId, storeId, {
    category: 'campaigns',
    action: 'edit_all'
});
```

### Managing Multi-Contract Users

```javascript
// Get all contracts user has access to
async function getUserContracts(userId) {
    const user = await User.findById(userId).populate('active_seats');
    return user.active_seats.map(seat => ({
        contract_id: seat.contract_id,
        contract_name: seat.contract_name,
        role: seat.default_role_id,
        seat_status: seat.status
    }));
}

// Switch user context to different contract
async function switchUserContext(userId, contractId) {
    const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: contractId,
        status: 'active'
    }).populate(['default_role_id', 'contract_id']);
    
    if (!seat) throw new Error('No access to this contract');
    
    return {
        contract: seat.contract_id,
        role: seat.default_role_id,
        stores: seat.store_access,
        credit_limits: seat.credit_limits
    };
}
```

### AI Credit Management Per Seat

```javascript
// Check and consume AI credits for specific seat
async function consumeAICredits(userId, contractId, creditsNeeded) {
    const seat = await ContractSeat.findOne({
        user_id: userId,
        contract_id: contractId,
        status: 'active'
    });
    
    // Check seat-specific limits
    if (seat.credit_limits.daily_limit && 
        seat.credit_limits.used_today + creditsNeeded > seat.credit_limits.daily_limit) {
        throw new Error('Daily credit limit exceeded for this seat');
    }
    
    // Check contract-level balance
    const contract = await Contract.findById(contractId);
    if (contract.ai_credits.current_balance < creditsNeeded) {
        throw new Error('Contract has insufficient AI credits');
    }
    
    // Consume credits
    contract.ai_credits.current_balance -= creditsNeeded;
    seat.credit_limits.used_today += creditsNeeded;
    seat.credit_limits.used_this_month += creditsNeeded;
    
    await Promise.all([contract.save(), seat.save()]);
    
    return {
        consumed: creditsNeeded,
        remaining_contract: contract.ai_credits.current_balance,
        remaining_daily: seat.credit_limits.daily_limit - seat.credit_limits.used_today
    };
}
```

## Key Benefits of New Architecture

### ✅ **Multi-Contract Support**
- **Content creators** can work for multiple agencies simultaneously
- **Agencies** can manage client contracts with different permission levels
- **Franchises** can grant agency partners access while maintaining control

### ✅ **Universal Role System**
- **No more organization-type restrictions** - same roles work everywhere
- **Consistent permissions** whether you're individual, agency, enterprise, or franchise
- **Simplified management** with only 6 core roles instead of dozens

### ✅ **Flexible Access Control**
- **Per-store role overrides** - different permissions for different stores within same contract
- **Credit limits per seat** - prevent contractors from exhausting shared pools  
- **Brand-level restrictions** - limit access to specific brands within stores

### ✅ **Better Billing Control**
- **Seat-based billing** - pay per active user across all contracts
- **AI credit tracking** - monitor usage per seat and per contract
- **Hierarchical contracts** - parent-child relationships for complex organizations

## Migration Guide

### Step 1: Create New Collections
```javascript
// Create the new ContractSeat collection
db.createCollection('contractseats');
db.contractseats.createIndex({ contract_id: 1, user_id: 1 }, { unique: true });
db.contractseats.createIndex({ user_id: 1 });
db.contractseats.createIndex({ status: 1 });
```

### Step 2: Migrate Existing Data
```javascript
// For each existing user with a personal contract:
// 1. Keep their User record
// 2. Keep their Contract record  
// 3. Create a new ContractSeat linking them
// 4. Update Store references

// Example migration script:
async function migrateToMultiContractSystem() {
    const users = await User.find({ primary_contract_id: { $exists: true } });
    
    for (const user of users) {
        // Create ContractSeat for their own contract
        await ContractSeat.create({
            contract_id: user.primary_contract_id,
            user_id: user._id,
            seat_type: 'included',
            default_role_id: await Role.findOne({ name: 'owner' })._id,
            store_access: [], // Will be populated from existing stores
            invited_by: user._id,
            invited_at: user.created_at,
            accepted_at: user.created_at,
            status: 'active'
        });
        
        // Update user's active_seats
        user.active_seats = [{
            contract_id: user.primary_contract_id,
            contract_name: `${user.name}'s Contract`,
            seat_id: newSeat._id,
            added_at: user.created_at
        }];
        
        await user.save();
    }
}
```

### Step 3: Update Application Logic
- Replace direct user → store relationships with user → seat → store
- Implement contract switching in UI
- Add seat-based AI credit tracking
- Update permission checks to use new ContractSeat model

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

## Per-Store Permissions System

### Overview
Users can have different permissions for each store they have access to. This allows flexible multi-tenant scenarios where a user might be:
- **Owner** of their own stores
- **Admin** of a client's store  
- **Editor** of a partner's store
- **Viewer** of a shared analytics dashboard

### Store Permission Structure
```javascript
{
  "store_permissions": [
    {
      "store_id": ObjectId,
      "role": "owner" | "admin" | "editor" | "viewer",
      "permissions": {
        "canEditStore": boolean,
        "canManageUsers": boolean,
        "canViewAnalytics": boolean,
        "canCreateCampaigns": boolean,
        "canManageIntegrations": boolean,
        "canDeleteStore": boolean,
        "canManageBilling": boolean,
        "canExportData": boolean
      },
      "granted_by": ObjectId,
      "granted_at": Date
    }
  ]
}
```

### Store Role Definitions

#### Store Owner
- Full control over store
- Can delete store
- Manage billing and subscriptions
- Grant/revoke access to other users

#### Store Admin  
- Manage store settings
- Manage users and permissions
- Create/edit campaigns
- Cannot delete store or manage billing

#### Store Editor
- Create and edit content
- View analytics
- Cannot manage users or integrations

#### Store Viewer
- Read-only access
- View analytics and reports
- Cannot make any changes

### Permission Checking for Stores
```javascript
// Check specific permission
const canEdit = await StorePermissions.userHasPermission(
  userId, 
  storeId, 
  'canEditStore'
);

// Check minimum role level
const isAtLeastEditor = await StorePermissions.userHasMinimumRole(
  userId,
  storeId,
  'editor'
);

// Get all permissions
const permissions = await StorePermissions.getUserStorePermissions(
  userId,
  storeId
);
```

### API Route Protection
```javascript
// In API routes
const canManage = await StorePermissions.userHasPermission(
  session.user.id,
  storeId,
  'canManageUsers'
);

if (!canManage) {
  return NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

### Managing Store Access
```javascript
// Grant store access to a user
await StorePermissions.grantStoreAccess(
  userId,
  storeId,
  'admin', // role
  grantedByUserId
);

// Update existing role
await StorePermissions.updateUserRole(userId, storeId, 'editor');

// Revoke access
await StorePermissions.revokeStoreAccess(userId, storeId);
```

### Migration Scripts
- `scripts/migrate-user-permissions.mjs` - Migrate existing users to per-store permissions
- `scripts/grant-full-access.mjs` - Grant super admin full access to all stores

### Super Admin Access
The user `doanthan@gmail.com` has been configured as a super admin with:
- Full owner permissions to ALL stores
- `is_super_admin: true` flag
- Role: `super_admin`
- All permissions enabled for every store

To grant similar access to another user, run:
```bash
node scripts/grant-full-access.mjs
```

## Contractor Multi-Contract Validation System

### Contractor Definition
A **contractor** is a user who:
- Works for multiple agencies/clients simultaneously
- Has `isolated_credits: true` in their ContractSeats
- Cannot share credits/usage between different contracts
- Requires separate billing attribution per contract

### Critical Contractor Scenarios Validation

#### 1. Credit Isolation Enforcement
```javascript
// Validate contractor cannot use Agency A's credits for Agency B's work
async function validateContractorCreditIsolation(userId, contractId, operation) {
    const seat = await ContractSeat.findUserSeatForContract(userId, contractId);
    
    // Critical: Ensure contractor seat has isolation enabled
    if (!seat.credit_limits.isolated_credits) {
        throw new Error('Contractor seat must have isolated_credits=true');
    }
    
    // Validate credits available for THIS contract only
    const creditsNeeded = getOperationCost(operation);
    const canConsume = seat.canConsumeCredits(creditsNeeded);
    
    if (!canConsume) {
        throw new Error(`Contractor exceeded credit limit for ${contractId}`);
    }
    
    return seat;
}
```

#### 2. Cross-Contract Permission Validation
```javascript
// Ensure contractor role in Contract A doesn't affect permissions in Contract B
async function validateContractorPermissionIsolation(userId) {
    const allSeats = await ContractSeat.findByUser(userId);
    
    // Critical: Each seat must be independent
    for (const seat of allSeats) {
        // Contractor cannot have 'owner' or 'admin' role in any contract
        const role = await Role.findById(seat.default_role_id);
        if (role.level > 60 && seat.credit_limits.isolated_credits) {
            throw new Error(`Contractor cannot have ${role.name} role across multiple contracts`);
        }
        
        // Validate store access is properly scoped
        for (const storeAccess of seat.store_access) {
            const store = await Store.findById(storeAccess.store_id);
            if (store.contract_id.toString() !== seat.contract_id.toString()) {
                throw new Error('Store access contract mismatch - security violation');
            }
        }
    }
    
    return true;
}
```

#### 3. Billing Attribution Accuracy
```javascript
// Ensure all contractor actions are billed to correct contract
async function validateContractorBilling(userId, actionDetails) {
    const { contractId, storeId, operation, creditsUsed } = actionDetails;
    
    // Get contractor's seat for this specific contract
    const seat = await ContractSeat.findUserSeatForContract(userId, contractId);
    
    // Critical validations
    const validations = [
        // 1. Seat exists and is active for this contract
        () => seat && seat.status === 'active',
        
        // 2. Contractor billing attribution is correct
        () => seat.credit_limits.billing_attribution.contract_pays === true,
        
        // 3. Credits are isolated (no cross-contract sharing)
        () => seat.credit_limits.isolated_credits === true,
        
        // 4. Store belongs to this contract
        async () => {
            const store = await Store.findById(storeId);
            return store.contract_id.toString() === contractId;
        },
        
        // 5. Contractor has sufficient credits for THIS contract
        () => seat.canConsumeCredits(creditsUsed),
        
        // 6. API usage tracking is properly attributed
        () => seat.usage_tracking.api_endpoints.length >= 0 // Structure exists
    ];
    
    for (const validation of validations) {
        if (!(await validation())) {
            throw new Error('Contractor billing validation failed');
        }
    }
    
    return true;
}
```

#### 4. Multi-Agency Contractor Workflow Validation
```javascript
// Validate contractor can work seamlessly across multiple agencies
async function validateMultiAgencyContractorWorkflow(contractorUserId) {
    const contractorSeats = await ContractSeat.findByUser(contractorUserId);
    
    const validation = {
        totalContracts: contractorSeats.length,
        isolatedSeats: 0,
        properRoles: 0,
        validBilling: 0,
        errors: []
    };
    
    for (const seat of contractorSeats) {
        const role = await Role.findById(seat.default_role_id);
        
        // 1. Validate credit isolation
        if (seat.credit_limits.isolated_credits) {
            validation.isolatedSeats++;
        } else {
            validation.errors.push(`Seat ${seat._id} missing credit isolation`);
        }
        
        // 2. Validate role restrictions (no owner/admin for contractors)
        if (role.level <= 60) { // manager or below
            validation.properRoles++;
        } else {
            validation.errors.push(`Contractor has ${role.name} role in contract ${seat.contract_id}`);
        }
        
        // 3. Validate billing setup
        if (seat.credit_limits.billing_attribution.contract_pays && 
            seat.credit_limits.billing_attribution.overage_rate > 0) {
            validation.validBilling++;
        } else {
            validation.errors.push(`Invalid billing setup for seat ${seat._id}`);
        }
        
        // 4. Validate store access scoping
        for (const storeAccess of seat.store_access) {
            const store = await Store.findById(storeAccess.store_id);
            if (store.contract_id.toString() !== seat.contract_id.toString()) {
                validation.errors.push(`Store access security violation in seat ${seat._id}`);
            }
        }
    }
    
    // Final validation
    const isValid = validation.errors.length === 0 &&
                   validation.isolatedSeats === validation.totalContracts &&
                   validation.properRoles === validation.totalContracts &&
                   validation.validBilling === validation.totalContracts;
    
    return { isValid, validation };
}
```

### Enterprise Multi-Department Seat Management

#### Bulk Seat Operations for Large Organizations
```javascript
// Create multiple seats with proper billing distribution
async function createEnterpriseBulkSeats(contractId, userDetails, departmentConfig) {
    const contract = await Contract.findById(contractId);
    const createdSeats = [];
    
    for (const userDetail of userDetails) {
        // Determine seat cost based on department
        const department = departmentConfig[userDetail.department];
        const seatCost = department.cost_per_seat_per_month;
        
        const seat = new ContractSeat({
            contract_id: contractId,
            user_id: userDetail.userId,
            seat_type: userDetail.isIncluded ? 'included' : 'additional',
            default_role_id: userDetail.roleId,
            credit_limits: {
                daily_limit: department.daily_credit_limit,
                monthly_limit: department.monthly_credit_limit,
                isolated_credits: userDetail.isContractor || false,
                billing_attribution: {
                    contract_pays: true,
                    seat_cost_per_month: seatCost,
                    overage_rate: department.overage_rate
                }
            },
            invited_by: userDetail.invitedBy,
            status: 'active'
        });
        
        await seat.save();
        createdSeats.push(seat);
        
        // Update contract billing
        if (seat.seat_type === 'additional') {
            contract.billing.additional_seats_cost += seatCost;
        }
    }
    
    await contract.save();
    return createdSeats;
}
```

#### Department-Level Credit Pool Management
```javascript
// Manage credit pools per department within enterprise
async function manageDepartmentCreditPools(contractId, departmentId, creditAllocation) {
    const departmentSeats = await ContractSeat.find({
        contract_id: contractId,
        'store_access.department_id': departmentId,
        status: 'active'
    });
    
    const totalCreditsNeeded = departmentSeats.reduce((sum, seat) => 
        sum + seat.credit_limits.monthly_limit, 0
    );
    
    if (totalCreditsNeeded > creditAllocation) {
        // Distribute credits proportionally
        const ratio = creditAllocation / totalCreditsNeeded;
        
        for (const seat of departmentSeats) {
            seat.credit_limits.monthly_limit = Math.floor(
                seat.credit_limits.monthly_limit * ratio
            );
            await seat.save();
        }
    }
    
    return { allocated: creditAllocation, distributed: totalCreditsNeeded };
}
```

## Invitation System - User Onboarding Flow

### Overview
The invitation system provides a secure, two-path approach to adding users to contracts:
- **New Users**: Receive invitation email with signup link and token-based authentication
- **Existing Users**: Automatically granted access and notified via email

### Invitation Architecture

```
Invitation Flow:
┌─────────────────────────────────────────────────────────┐
│  Admin Invites User                                     │
└─────────────────┬───────────────────────────────────────┘
                  │
          ┌───────▼────────┐
          │ User exists?   │
          └───┬────────┬───┘
              │        │
        YES   │        │   NO
              │        │
    ┌─────────▼──┐  ┌─▼─────────────┐
    │ Is Active? │  │ Create User   │
    └─┬────────┬─┘  │ (inactive)    │
      │        │    └─┬─────────────┘
  YES │        │ NO   │
      │        │      │
┌─────▼──┐  ┌──▼──────▼─────────────┐
│Activate│  │Generate Token          │
│Seat    │  │Create Pending Seat     │
│Send    │  │Send Invitation Email   │
│Notify  │  └──┬────────────────────┘
└────────┘     │
               │  User clicks link
               │
        ┌──────▼──────────┐
        │ /accept-invite  │
        │ Set Password    │
        │ Activate Seat   │
        │ Activate User   │
        └─────────────────┘
```

### Database Schema Extensions

#### ContractSeat Invitation Fields
```javascript
{
    // Existing fields...

    // Invitation tracking
    invitation_token: String,              // SHA256 hashed token (sparse index)
    invitation_token_expires: Date,        // 7-day expiration
    invitation_method: String,             // 'new_user' | 'existing_user'
    invitation_email: String,              // Email invitation was sent to
    invitation_sent_at: Date,              // Timestamp of invitation
    invited_by: ObjectId,                  // Ref: User who sent invitation

    // Activation
    activated_at: Date,                    // When seat was activated

    // Status
    status: String                         // 'pending' | 'active' | 'suspended' | 'revoked'
}
```

### API Endpoints

#### POST /api/contract/seats
**Purpose**: Invite a new user or add existing user to contract

**Required Permission**: `team.invite_users` (manager+ role)

**Request Body**:
```javascript
{
    contractId: ObjectId,     // Contract to add user to
    email: String,            // User email (lowercase)
    roleId: ObjectId,         // Role to assign
    storeAccess: [{           // Optional store-specific access
        store_id: ObjectId,
        role_id: ObjectId     // Optional store-specific role
    }]
}
```

**Response**:
```javascript
{
    success: true,
    seat: ContractSeat,
    invitationMethod: 'new_user' | 'existing_user',
    message: String
}
```

**Behavior**:
1. **New User Path** (`invitationMethod: 'new_user'`):
   - Creates inactive User account
   - Generates cryptographically secure invitation token (hashed)
   - Creates ContractSeat with `status: 'pending'`
   - Sends invitation email with `/accept-invite?token=xxx` link
   - Token expires in 7 days

2. **Existing Active User Path** (`invitationMethod: 'existing_user'`):
   - Uses existing User account
   - Creates ContractSeat with `status: 'active'`
   - Immediately adds to user's `active_seats` array
   - Sends notification email
   - User has immediate access

3. **Existing Inactive User Path** (treated as new user):
   - Uses existing User account
   - Generates invitation token
   - Creates pending ContractSeat
   - Sends invitation email

**Email Templates**:
- **New User**: `invitations@wizel.ai` - Subject: "[Name] invited you to join [Contract] on Wizel.ai"
- **Existing User**: `notifications@wizel.ai` - Subject: "You've been added to [Contract] on Wizel.ai"

#### GET /api/invitations/accept?token=xxx
**Purpose**: Validate invitation token and return invitation details

**Authentication**: Public (token-based)

**Response**:
```javascript
{
    valid: true,
    invitation: {
        email: String,
        contractName: String,
        roleName: String,
        invitedBy: String,
        storeNames: [String],
        hasStoreRestrictions: Boolean
    }
}
```

**Error Responses**:
- `404`: Token not found or already used
- `400`: Token expired (> 7 days old)

#### POST /api/invitations/accept
**Purpose**: Accept invitation and create account

**Authentication**: Public (token-based)

**Request Body**:
```javascript
{
    token: String,        // Invitation token from email
    password: String,     // New password (min 8 chars)
    name: String          // User's full name
}
```

**Response**:
```javascript
{
    success: true,
    message: "Account created successfully! You can now log in.",
    user: {
        email: String,
        name: String
    }
}
```

**Process**:
1. Validates token against hashed version in database
2. Checks token expiration (< 7 days old)
3. Updates User account:
   - Sets bcrypt hashed password
   - Sets status to 'active'
   - Updates name if provided
4. Activates ContractSeat:
   - Changes status from 'pending' to 'active'
   - Sets `activated_at` timestamp
   - Clears invitation token (one-time use)
5. Adds seat to User's `active_seats` array
6. Returns success, redirects to login

### Security Features

#### Token Security
```javascript
// Token generation (lib/invitation-token.js)
{
    token: crypto.randomBytes(32).toString('hex'),           // 64-char hex (sent in email)
    hashedToken: crypto.createHash('sha256').update(token),  // Stored in database
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
}
```

**Security Measures**:
1. **Hashed Storage**: Only SHA256 hash stored in database
2. **Single Use**: Token cleared after acceptance
3. **Expiration**: 7-day validity window
4. **Sparse Index**: Efficient lookups without full table scan
5. **HTTPS Only**: Tokens only sent over encrypted connections
6. **Rate Limiting**: Prevent brute force attacks

#### Permission Checks
```javascript
// Who can invite users
const canInvite = userSeat.default_role_id.permissions.team.invite_users;

// Role level requirements
{
    owner: true,      // Level 100
    admin: true,      // Level 80
    manager: true,    // Level 60
    creator: false,   // Level 40
    reviewer: false,  // Level 30
    viewer: false     // Level 10
}
```

### UI Components

#### InviteUserDialog
**Location**: `/app/components/users/invite-user-dialog.jsx`

**Features**:
- Email validation with real-time feedback
- Role selection with permission preview
- Optional store-specific access control
- Seat usage tracking and warnings
- Context-aware success messages:
  - "Invitation Sent" for new users
  - "User Added" for existing users

**Seat Limit Validation**:
```javascript
if (seatUsage.remaining === 0) {
    // Show "No Seats Available" banner
    // Disable "Send Invitation" button
    // Prompt to upgrade plan
}
```

#### Accept Invitation Page
**Location**: `/app/(dashboard)/accept-invite/page.jsx`

**Features**:
- Token validation on page load
- Pre-populated invitation details display:
  - Email (read-only)
  - Contract name
  - Assigned role
  - Store access (if restricted)
  - Inviter name
- Password setup form:
  - Password visibility toggle
  - Confirmation field
  - 8-character minimum requirement
- Success animation with auto-redirect
- Branded gradient design matching Wizel.ai style

### Email Templates

#### New User Invitation
**From**: `invitations@wizel.ai`
**Subject**: `{invitedBy} invited you to join {contractName} on Wizel.ai`

**Content**:
- Personalized greeting
- Invitation details card:
  - Role assignment
  - Store access (if applicable)
  - Inviter name
- Prominent "Accept Invitation & Create Account" CTA button
- Clickable invitation link
- 7-day expiration notice
- Wizel.ai branding with gradient header

#### Existing User Notification
**From**: `notifications@wizel.ai`
**Subject**: `You've been added to {contractName} on Wizel.ai`

**Content**:
- Personalized greeting
- Access details card:
  - Role assignment
  - Store access
  - Inviter name
- "Go to Dashboard" CTA button
- Direct login link
- Contact information for questions

### Testing Scenarios

#### Scenario 1: New User Invitation Flow
```bash
# 1. Admin invites newuser@example.com
POST /api/contract/seats
{
    contractId: "contract123",
    email: "newuser@example.com",
    roleId: "creator_role_id"
}

# Response: invitationMethod = 'new_user'

# 2. User receives email with token link
# 3. User clicks link → /accept-invite?token=abc123...

GET /api/invitations/accept?token=abc123...
# Returns invitation details

# 4. User submits signup form
POST /api/invitations/accept
{
    token: "abc123...",
    password: "SecurePass123",
    name: "John Smith"
}

# 5. User account created, seat activated
# 6. Redirect to /login
```

#### Scenario 2: Existing Active User Addition
```bash
# 1. Admin invites existinguser@example.com
POST /api/contract/seats
{
    contractId: "contract123",
    email: "existinguser@example.com",
    roleId: "manager_role_id"
}

# Response: invitationMethod = 'existing_user'

# 2. User receives notification email
# 3. Seat immediately active
# 4. User can access contract on next login
```

#### Scenario 3: Token Expiration
```bash
# 1. User receives invitation
# 2. Waits > 7 days
# 3. Attempts to accept invitation

GET /api/invitations/accept?token=expired123
# Returns: 400 - "Token expired"

# 4. Admin must resend invitation (creates new token)
```

### Error Handling

#### Common Error Cases
| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| "Token expired" | 400 | > 7 days since invitation | Resend invitation |
| "Invalid token" | 404 | Token not found/already used | Check email link |
| "User already has seat" | 400 | Duplicate invitation | Remove old seat first |
| "No seats available" | 403 | Contract seat limit reached | Upgrade plan |
| "Permission denied" | 403 | Inviter lacks team.invite_users | Need manager+ role |

### Monitoring & Analytics

#### Track Invitation Metrics
```javascript
// Invitation acceptance rate
const acceptanceRate =
    (activeSeats / totalInvitations) * 100;

// Average time to accept
const avgAcceptanceTime =
    avg(activated_at - invitation_sent_at);

// Expired invitations
const expiredInvites = ContractSeat.count({
    status: 'pending',
    invitation_token_expires: { $lt: new Date() }
});
```

#### Audit Logging
```javascript
{
    event: 'invitation_sent',
    user_id: invitedBy,
    target_email: email,
    contract_id: contractId,
    role_id: roleId,
    invitation_method: 'new_user' | 'existing_user',
    timestamp: new Date()
}

{
    event: 'invitation_accepted',
    user_id: newUserId,
    contract_id: contractId,
    seat_id: seatId,
    time_to_accept_hours: hours,
    timestamp: new Date()
}
```

### Best Practices

#### For Administrators
1. **Set appropriate roles**: Don't over-permission new users
2. **Use store restrictions**: Limit access to relevant stores only
3. **Monitor seat usage**: Track remaining seats before inviting
4. **Resend expired invitations**: Check pending seats regularly

#### For Developers
1. **Always validate tokens**: Check hash match + expiration
2. **Clear tokens after use**: Prevent replay attacks
3. **Log invitation events**: Track acceptance rates and issues
4. **Email delivery monitoring**: Ensure emails reach users
5. **Test both paths**: New user and existing user flows

### Migration Notes

#### Updating Existing Seats
```javascript
// Add invitation tracking to existing seats
await ContractSeat.updateMany(
    { invitation_token: { $exists: false } },
    {
        $set: {
            invitation_method: 'existing_user',
            activated_at: new Date()
        }
    }
);
```

#### Indexes Required
```javascript
// Ensure these indexes exist
ContractSeat.index({ invitation_token: 1 }, { sparse: true });
ContractSeat.index({ contract_id: 1, status: 1 });
ContractSeat.index({ invitation_token_expires: 1 }, {
    expireAfterSeconds: 0,  // Auto-cleanup
    partialFilterExpression: {
        status: 'pending',
        invitation_token: { $exists: true }
    }
});
```

### Related API Routes

- `GET /api/contract/seats?contractId=xxx` - List all seats
- `PATCH /api/contract/seats/[seatId]` - Update user role/access
- `DELETE /api/contract/seats/[seatId]` - Remove user from contract
- `GET /api/roles?contractId=xxx` - Get available roles
- `POST /api/invitations/resend` - Resend invitation (future enhancement)

## Future Enhancements

1. **Dynamic Role Creation** - UI for creating custom roles from standard templates
2. **Permission Analytics** - Track which permissions are most used
3. **Role Recommendations** - AI suggests best role based on usage patterns
4. **Temporary Permissions** - Grant time-limited elevated access
5. **Cross-Organization Federation** - Share permissions across organizations
6. **NEW: Contractor Management Dashboard** - Monitor contractor activity across all contracts
7. **NEW: Department-Level Analytics** - Track usage and costs per enterprise department
8. **NEW: Automated Seat Optimization** - AI-powered seat allocation recommendations
9. **NEW: Invitation Resend API** - Regenerate tokens for expired invitations
10. **NEW: Bulk User Import** - CSV upload for multiple user invitations
11. **NEW: Custom Invitation Templates** - Branded email templates per contract
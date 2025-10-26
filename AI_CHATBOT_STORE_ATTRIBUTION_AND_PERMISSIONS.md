# AI Chatbot Store Attribution & Analytics Permissions - Implementation Summary

**Date**: October 23, 2025
**Version**: 1.0

---

## 🎯 Overview

This document summarizes the implementation of two critical features for the Wizel AI chatbot:

1. **Store Attribution in Responses** - Always reference which store/account data belongs to
2. **Analytics Permission Enforcement** - Only users with analytics permissions can access the chatbot

---

## 📝 Feature 1: Store Attribution in AI Responses

### Problem Statement

In multi-store environments where users manage 5-20+ accounts simultaneously, AI responses mentioning campaigns, flows, products, or other account-specific data were ambiguous. Users couldn't easily tell which account the data belonged to.

### Solution

**Required Format**: All account-specific references MUST include store context:
```
Campaign/Flow/Product Name (Store Name, store_public_id)
```

### Implementation

#### Updated File: `/context/AI-context/AI_CHATBOT_CAPABILITIES.md`

Added a new critical section (lines 22-59) titled **"🚨 CRITICAL: Store Attribution Requirements"** that includes:

**Required Format Examples:**
```markdown
✅ CORRECT - Clear store attribution:
- "Black Friday Sale - Nov 25" (Premium Boutique, XAeU8VL)
- Abandoned Cart Flow (Fast Fashion Co, 7MP60fH)
- Classic White Tee (Luxury Brand, zp7vNlc)

❌ WRONG - Missing store context:
- "Black Friday Sale - Nov 25"
- Abandoned Cart Flow
- Classic White Tee
```

**Implementation Guidelines:**
- Every campaign mention → Include (Store Name, store_public_id)
- Every flow reference → Include (Store Name, store_public_id)
- Every product listing → Include (Store Name, store_public_id)
- Every segment mention → Include (Store Name, store_public_id)
- Summary statistics → Group by store with clear labels
- Comparisons → Always show which stores are being compared

#### Updated Response Examples

All response examples throughout the document were updated to demonstrate proper store attribution:

**Campaign Performance** (Line 218-242):
```markdown
1. Black Friday Email - Nov 25, 2024 (Premium Boutique, XAeU8VL)
   - Recipients: 45,230
   - Open Rate: 34.2% (above benchmark)
   - Revenue: $128,450
```

**Flow Performance** (Line 275-300):
```markdown
1. Abandoned Cart Recovery (Email) - (Premium Boutique, XAeU8VL)
   - Revenue: $89,340 (36.4% of total)
   - Also active in: Fast Fashion Co (7MP60fH), Luxury Brand (zp7vNlc)
```

**Multi-Store Comparison** (Line 512-545):
```markdown
**Premium Boutique (XAeU8VL)**
- Revenue: $186,420 (40.7%)
- Top Campaign: "Fall Collection Launch" (XAeU8VL) - $12,450 revenue
```

**Product Affinity** (Line 770-800):
```markdown
1. Classic White Tee → Basic Black Jeans (Premium Boutique, XAeU8VL)
   - Probability: 43.4%
   - Customers who bought both: 387
```

### Why This Matters

1. **Multi-Store Context**: Users often manage 5-20+ stores simultaneously
2. **Clear Attribution**: Prevents confusion about which account data belongs to
3. **Actionable Insights**: Users know exactly which store needs attention
4. **Agency Management**: Essential for agencies managing multiple client accounts

---

## 🔐 Feature 2: Analytics Permission Enforcement

### Problem Statement

The AI chatbot was accessible to all users regardless of their role permissions. This meant users without analytics permissions (like some creator roles) could potentially query analytics data they shouldn't have access to.

### Solution

Enforce the analytics permission system from `/context/PERMISSIONS_GUIDE.md` to ensure only users with proper analytics permissions can access the chatbot.

### Implementation

#### Updated File: `/lib/ai-agent/permissions.js`

**Major Changes:**

1. **Enhanced `getUserAccessibleStores()` function** (Lines 12-106):
   - Now checks analytics permissions from user's role
   - Filters out users WITHOUT `view_own` OR `view_all` permissions
   - Returns analytics_permissions object for each store
   - Upgrades permissions if user has multiple seats with different access levels

**Critical Permission Check:**
```javascript
// Skip users without any analytics permissions
if (!analyticsPermissions.view_own && !analyticsPermissions.view_all) {
  console.warn('⚠️ Seat has no analytics permissions:', seat._id);
  continue; // User won't see this store in chatbot
}
```

**Enhanced Return Format:**
```javascript
{
  public_id: "XAeU8VL",
  name: "Premium Boutique",
  klaviyo_public_id: "Pe5Xw6",
  user_role: "manager",
  analytics_permissions: {
    view_own: true,
    view_all: true,
    export: true,
    view_financial: false
  }
}
```

2. **Added `validateStoreAnalyticsAccess()` function** (Lines 108-128):
   - Validates if user can access specific stores via chatbot
   - Returns: `{ hasAccess, allowedStores, deniedStores }`
   - Used for multi-store queries to prevent unauthorized access

3. **Added `getStoreAnalyticsPermissions()` function** (Lines 130-141):
   - Gets specific analytics permissions for a single store
   - Returns permissions object or null if no access
   - Used for permission-specific features (export, financial data)

#### Updated File: `/context/AI-context/AI_CHATBOT_CAPABILITIES.md`

**Added Security & Permissions Section** (Lines 1384-1500):

**Analytics Permission Requirements Table:**

| Role | view_own | view_all | export | view_financial | Chatbot Access |
|------|----------|----------|--------|----------------|----------------|
| **owner** | ✓ | ✓ | ✓ | ✓ | ✅ Full Access |
| **admin** | ✓ | ✓ | ✓ | ✗ | ✅ Full Access |
| **manager** | ✓ | ✓ | ✓ | ✗ | ✅ Full Access |
| **creator** | ✓ | ✗ | ✗ | ✗ | ⚠️ Limited (own data only) |
| **reviewer** | ✗ | ✓ | ✗ | ✗ | ✅ View All |
| **viewer** | ✗ | ✓ | ✗ | ✗ | ✅ View All |

**Permission Enforcement Rules:**
1. **getUserAccessibleStores()** filters stores by analytics permissions
2. Users WITHOUT `view_own` OR `view_all` are excluded from chatbot
3. Creators with `view_own` can only see their own content (limited chatbot use)
4. Managers, Reviewers, Viewers with `view_all` can query across all stores
5. Only roles with `export` permission can export chatbot responses (future feature)

**Permission Validation Functions Documentation:**

Documented three new permission validation functions with examples:

```javascript
// Check if user can access chatbot at all
const userStores = await getUserAccessibleStores(session.user.id);
if (userStores.length === 0) {
  return NextResponse.json({
    error: 'No analytics access. Please contact your administrator.'
  }, { status: 403 });
}

// Validate multi-store query
const requestedStores = ['XAeU8VL', '7MP60fH', 'zp7vNlc'];
const validation = await validateStoreAnalyticsAccess(session.user.id, requestedStores);
if (!validation.hasAccess) {
  return NextResponse.json({
    error: `Access denied to stores: ${validation.deniedStores.join(', ')}`
  }, { status: 403 });
}

// Check specific permission for export
const permissions = await getStoreAnalyticsPermissions(session.user.id, 'XAeU8VL');
if (!permissions?.export) {
  return NextResponse.json({
    error: 'Export permission required'
  }, { status: 403 });
}
```

---

## 🔄 How The System Works

### Permission Flow

```
User Login
    ↓
Get Active ContractSeats
    ↓
For Each Seat:
  - Get Role → Extract Analytics Permissions
  - Check: view_own OR view_all?
    ↓ NO → Skip this seat
    ↓ YES
  - Get Accessible Stores in Contract
  - Check: hasStoreAccess()?
    ↓ YES
  - Add to accessible stores with permissions
    ↓
Filter: Only stores with Klaviyo integration
    ↓
Return: Stores with analytics_permissions object
```

### Multi-Contract Permission Handling

The system properly handles users with multiple contract seats:

```javascript
// User has 2 seats with different permissions:
Seat 1 (Contract A): viewer role (view_all: true)
Seat 2 (Contract B): manager role (view_all: true, export: true)

// Result: User can access stores from both contracts
// Stores from Contract A: Can view, cannot export
// Stores from Contract B: Can view AND export
```

### Permission Upgrade Logic

If a user has multiple seats granting access to the same store with different permission levels, the system automatically upgrades to the highest permission:

```javascript
// User has 2 seats for same store:
Seat 1: creator role (view_own: true)
Seat 2: manager role (view_all: true, export: true)

// Result: Manager permissions win
analytics_permissions: {
  view_own: true,
  view_all: true,    // Upgraded from creator
  export: true,       // Upgraded from creator
  view_financial: false
}
```

---

## 📊 Impact & Benefits

### Store Attribution Impact

**Before:**
```markdown
Top campaign: "Black Friday Sale" - $128,450 revenue
```
❌ User doesn't know which of their 15 stores this belongs to

**After:**
```markdown
Top campaign: "Black Friday Sale" (Premium Boutique, XAeU8VL) - $128,450 revenue
```
✅ User immediately knows this is Premium Boutique's campaign

### Permission Enforcement Impact

**Before:**
- Any user could potentially query analytics via chatbot
- No validation of analytics permissions
- Security risk for sensitive financial data

**After:**
- Only users with analytics permissions can access chatbot
- Automatic filtering at the permission layer
- Each store includes granular permission details
- Future-ready for export and financial data restrictions

---

## 🧪 Testing Scenarios

### Scenario 1: Manager with Multiple Stores

**User**: manager@agency.com
**Role**: manager (view_all: true, export: true)
**Stores**: Premium Boutique (XAeU8VL), Fast Fashion Co (7MP60fH)

**Expected Behavior:**
1. Both stores appear in `getUserAccessibleStores()`
2. Both stores include full analytics_permissions
3. All chatbot responses include store attribution
4. User can query across both stores simultaneously

### Scenario 2: Creator with Limited Access

**User**: creator@agency.com
**Role**: creator (view_own: true, view_all: false)
**Stores**: Premium Boutique (XAeU8VL)

**Expected Behavior:**
1. Store appears in `getUserAccessibleStores()`
2. analytics_permissions.view_all = false
3. Chatbot may show limited functionality
4. Can only see own created content

### Scenario 3: User Without Analytics Access

**User**: nopermission@agency.com
**Role**: custom role (view_own: false, view_all: false)
**Stores**: Premium Boutique (XAeU8VL)

**Expected Behavior:**
1. `getUserAccessibleStores()` returns empty array
2. Chatbot shows: "No analytics access. Please contact your administrator."
3. User cannot access any chatbot functionality

### Scenario 4: Multi-Store Query Validation

**User**: manager@agency.com
**Accessible Stores**: XAeU8VL, 7MP60fH
**Requests Query For**: XAeU8VL, 7MP60fH, zp7vNlc (3rd store not accessible)

**Expected Behavior:**
```javascript
const validation = await validateStoreAnalyticsAccess(userId, ['XAeU8VL', '7MP60fH', 'zp7vNlc']);

// Result:
{
  hasAccess: false,
  allowedStores: ['XAeU8VL', '7MP60fH'],
  deniedStores: ['zp7vNlc']
}

// API returns 403: "Access denied to stores: zp7vNlc"
```

---

## 🔒 Security Considerations

### 1. Permission Validation at Multiple Layers

- **Database Layer**: `getUserAccessibleStores()` filters by permissions
- **API Layer**: `/api/ai/chat/route.js` validates user stores
- **Query Layer**: ClickHouse queries filtered by klaviyo_public_ids

### 2. Audit Trail

All permission checks are logged:
```javascript
console.log('🔍 [getUserAccessibleStores] Role:', role?.name, 'Analytics:', analyticsPermissions);
console.warn('⚠️ [getUserAccessibleStores] Seat has no analytics permissions:', seat._id);
```

### 3. Fail-Safe Defaults

- No analytics permissions = No chatbot access
- Unknown permissions = Treated as no access
- Missing role = Defaults to viewer (minimal permissions)

### 4. Future-Ready for Financial Data

The `view_financial` permission is tracked but not yet enforced. This allows for future implementation of financial data restrictions without changing the permission structure.

---

## 📚 Related Documentation

- **Permissions Guide**: `/context/PERMISSIONS_GUIDE.md`
- **AI Chatbot Capabilities**: `/context/AI-context/AI_CHATBOT_CAPABILITIES.md`
- **ContractSeat Model**: `/models/ContractSeat.js`
- **Role Model**: `/models/Role.js`
- **Permission Functions**: `/lib/ai-agent/permissions.js`

---

## 🚀 Future Enhancements

### Short-term (Next Sprint)

1. **Export Permission Enforcement**
   - Add validation for `analytics_permissions.export`
   - Restrict export features to users with export permission

2. **Financial Data Filtering**
   - Implement `view_financial` permission checks
   - Hide revenue/financial data from users without permission

### Medium-term (Next Quarter)

1. **Per-Store Permission UI**
   - Visual indicator in chatbot showing which stores user can access
   - Permission level badges (View Only, Full Access, etc.)

2. **Permission Audit Dashboard**
   - Track who accessed what data via chatbot
   - Analytics permission usage reports

3. **View_Own Implementation**
   - Filter chatbot results to only show content created by user
   - "Creator Mode" for limited analytics access

---

## ✅ Implementation Checklist

- [x] Add store attribution requirement to AI capabilities doc
- [x] Update all response examples with store context
- [x] Enhance `getUserAccessibleStores()` with analytics filtering
- [x] Add `validateStoreAnalyticsAccess()` function
- [x] Add `getStoreAnalyticsPermissions()` function
- [x] Document analytics permission enforcement
- [x] Create implementation summary document
- [ ] Update AI system prompt to always include store attribution
- [ ] Add frontend indicators for analytics permissions
- [ ] Implement export permission validation
- [ ] Implement financial data filtering
- [ ] Add analytics permission tests

---

## 🆘 Troubleshooting

### Issue: User can't access chatbot despite having store access

**Check:**
1. Does user's role have `view_own` OR `view_all` set to true?
2. Is the ContractSeat status 'active'?
3. Does the store have a valid `klaviyo_integration.public_id`?

**Debug:**
```javascript
const userStores = await getUserAccessibleStores(userId);
console.log('Accessible stores:', userStores.length);
console.log('Analytics permissions:', userStores.map(s => s.analytics_permissions));
```

### Issue: Store attribution not showing in responses

**Check:**
1. Is the AI system prompt including the store attribution requirement?
2. Are the response examples in the prompt showing proper attribution?
3. Is the `WIZEL_AI` context including store_public_ids?

**Debug:**
Check the system prompt sent to the AI model includes the store attribution guidelines.

---

**Last Updated**: October 23, 2025
**Maintained by**: Wizel Engineering Team

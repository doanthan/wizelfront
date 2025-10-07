# AI Assistant Instructions

## Project Overview - Multi-Account Klaviyo Reporting Platform

This is a **multi-account Klaviyo reporting tool** that hosts and manages multiple Klaviyo account API keys. Key characteristics:

- **Multi-Account Architecture**: The platform manages multiple Klaviyo accounts, each with their own API keys

## 🎨 CRITICAL: Text Color Guidelines

### **NEVER use gray text in light mode**
**IMPORTANT**: For optimal readability on this platform, NEVER use gray text colors in light mode.

**Text Color Rules:**
```css
/* ✅ CORRECT - Use near-black text in light mode */
text-gray-900  /* #111827 - Primary text in light mode */
text-gray-800  /* #1f2937 - Secondary text if needed */

/* ❌ WRONG - Never use these in light mode */
text-gray-700  /* Too light */
text-gray-600  /* Too light */
text-gray-500  /* Too light */
text-gray-400  /* Way too light */
text-muted     /* Never use */
```

**Implementation Pattern:**
```jsx
// ✅ CORRECT - High contrast text
<span className="text-gray-900 dark:text-gray-100">Primary Text</span>
<p className="text-gray-900 dark:text-gray-300">Content Text</p>

// ❌ WRONG - Low contrast gray text
<span className="text-gray-600 dark:text-gray-400">Hard to read</span>
<p className="text-muted">Never do this</p>
```

**Key Points:**
- Always use `text-gray-900` (#111827) for primary text in light mode
- For secondary text, use `text-gray-800` (#1f2937) minimum
- Dark mode can use lighter grays (text-gray-300, text-gray-400)
- This ensures maximum readability and accessibility

## MongoDB Connection Method

### IMPORTANT: Correct MongoDB Connection
**Always use the Mongoose connection from `/lib/mongoose.js`:**

```javascript
// ✅ CORRECT - Using Mongoose
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request) {
  await connectToDatabase();
  const db = mongoose.connection.db;
  
  // Now you can use db.collection('collectionName')
  const campaigns = await db.collection('campaignMessages').find({}).toArray();
}
```

```javascript
// ❌ WRONG - Don't use this
import { connectToDatabase } from '@/lib/mongodb';
const { db } = await connectToDatabase();
```

### Using Mongoose Models
For existing models, use the Mongoose ORM:

```javascript
import connectToDatabase from '@/lib/mongoose';
import CampaignStat from '@/models/CampaignStat';

export async function GET(request) {
  await connectToDatabase();
  
  // Use Mongoose models
  const campaigns = await CampaignStat.find({ /* query */ });
}
```

### Direct MongoDB Collection Access
When you need direct collection access (for collections without models):

```javascript
import connectToDatabase from '@/lib/mongoose';
import mongoose from 'mongoose';

export async function GET(request) {
  await connectToDatabase();
  const db = mongoose.connection.db;
  
  // Access collections directly
  const collection = db.collection('campaignMessages');
  const results = await collection.find({ /* query */ }).toArray();
}
```

## Project Overview
This is a modern web application built with Next.js, React, and Tailwind CSS. The project follows a specific design system and coding standards that must be maintained.

## 🚨 CRITICAL: Store ID Usage Guidelines

### Store ID vs Klaviyo ID Mapping

**CRITICAL DISTINCTION**: The application uses two different ID systems:
1. **`store.public_id`** (e.g., "XAeU8VL") - Internal store identifier used in the UI and MongoDB
2. **`store.klaviyo_integration.public_id`** - Klaviyo account ID used in ClickHouse reporting tables

**IMPORTANT**: When querying ClickHouse for reporting data:
1. First get the store's `klaviyo_integration.public_id` from the Store document
2. Use this Klaviyo ID (not the store's public_id) for all ClickHouse queries
3. If `klaviyo_integration.public_id` is null, the store has no Klaviyo data

**Example Store Structure**:
```javascript
{
  "public_id": "XAeU8VL",           // Store's internal ID (used in UI)
  "name": "My Store",
  "klaviyo_integration": {
    "public_id": "XqkVGb",          // Klaviyo account ID (used in ClickHouse)
    "apiKey": "pk_xxxxx",
    // ... other fields
  }
}
```

**CRITICAL Conversion Logic - Always Required for ClickHouse**:
```javascript
// STEP 1: When receiving store IDs from UI/API request, they are store_public_ids
const storePublicIds = ["XAeU8VL", "7MP60fH"];  // From UI/request params

// STEP 2: MUST convert store_public_ids to klaviyo_public_ids for ClickHouse
const stores = await Store.find({
  public_id: { $in: storePublicIds }
});

// STEP 3: Extract the Klaviyo IDs for ClickHouse queries
const klaviyoIds = stores
  .map(store => store.klaviyo_integration?.public_id)
  .filter(Boolean);  // Remove nulls

// STEP 4: Use klaviyo_public_ids in ClickHouse query
const query = `
  SELECT * FROM campaign_statistics
  WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
`;

// ⚠️ COMMON ERROR: Using store_public_id directly in ClickHouse
// ❌ WRONG - This will return no data!
const query = `
  SELECT * FROM campaign_statistics
  WHERE klaviyo_public_id = '${storePublicId}'  // WRONG! This is a store ID, not Klaviyo ID!
`;
```

**Conversion Pattern for API Endpoints**:
```javascript
// In API routes that query ClickHouse
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const storePublicIds = searchParams.get('accountIds')?.split(',') || [];

  // ALWAYS convert store IDs to Klaviyo IDs
  await connectToDatabase();
  const stores = await Store.find({
    public_id: { $in: storePublicIds },
    is_deleted: { $ne: true }
  });

  const klaviyoIds = stores
    .map(store => store.klaviyo_integration?.public_id)
    .filter(Boolean);

  if (klaviyoIds.length === 0) {
    // No valid Klaviyo integrations - return empty data
    return NextResponse.json({ campaigns: [] });
  }

  // Now query ClickHouse with klaviyo_public_ids
  const clickhouseQuery = `
    SELECT * FROM campaign_statistics
    WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
  `;
}
```

### 🚨 CRITICAL: localStorage Must Use store_public_ids

**CRITICAL BUG PREVENTION**: The application's localStorage MUST store `store_public_ids`, NOT `klaviyo_public_ids`:

```javascript
// ✅ CORRECT - localStorage contains store_public_ids
localStorage.setItem('analyticsSelectedAccounts', JSON.stringify([
  { value: 'rZResQK', label: 'Store Name 1' },  // store_public_id
  { value: '7MP60fH', label: 'Store Name 2' }   // store_public_id
]));

// ❌ WRONG - localStorage contains klaviyo_public_ids (causes infinite loops!)
localStorage.setItem('analyticsSelectedAccounts', JSON.stringify([
  { value: 'Pe5Xw6', label: 'Store Name 1' },   // klaviyo_public_id - WRONG!
  { value: 'XqkVGb', label: 'Store Name 2' }    // klaviyo_public_id - WRONG!
]));
```

**Why This Matters:**
1. **API Contract**: All API endpoints expect `accountIds` parameter to contain `store_public_ids`
2. **Conversion Flow**: APIs convert `store_public_ids` → `klaviyo_public_ids` for ClickHouse
3. **Multiple Stores**: Multiple stores can share the same `klaviyo_public_id`
4. **Infinite Loops**: Wrong IDs cause API to find 0 stores → empty responses → infinite retries

**Common localStorage Keys That Must Use store_public_ids:**
- `analyticsSelectedAccounts` - Account selector for multi-account reporting
- `selectedStoreId` - Currently selected store
- `recentStoreIds` - Recently accessed stores

**Account Selector Implementation Pattern:**
```javascript
// ✅ CORRECT - Store selector saves store_public_ids
const handleStoreSelect = (selectedStores) => {
  const accountsForStorage = selectedStores.map(store => ({
    value: store.public_id,        // Use store_public_id
    label: store.name,
    klaviyo_id: store.klaviyo_integration?.public_id  // For reference only
  }));

  localStorage.setItem('analyticsSelectedAccounts', JSON.stringify(accountsForStorage));
};

// ❌ WRONG - Don't save klaviyo_public_ids
const handleStoreSelect = (selectedStores) => {
  const accountsForStorage = selectedStores.map(store => ({
    value: store.klaviyo_integration?.public_id,  // WRONG! Don't use klaviyo ID
    label: store.name
  }));

  localStorage.setItem('analyticsSelectedAccounts', JSON.stringify(accountsForStorage));
};
```

**Example ID Mappings:**
- `Pe5Xw6` (klaviyo_public_id) → `rZResQK`, `7MP60fH` (store_public_ids)
- `XqkVGb` (klaviyo_public_id) → `zp7vNlc`, `Pu200rg` (store_public_ids)

**Debugging localStorage Issues:**
```javascript
// Check what's currently in localStorage
const stored = JSON.parse(localStorage.getItem('analyticsSelectedAccounts') || '[]');
console.log('Stored accounts:', stored);

// Clear invalid klaviyo IDs if found
const invalidKlaviyoIds = ['Pe5Xw6', 'XqkVGb'];
const hasInvalid = stored.some(acc => invalidKlaviyoIds.includes(acc.value));
if (hasInvalid) {
  localStorage.removeItem('analyticsSelectedAccounts');
  console.log('Cleared invalid klaviyo IDs from localStorage');
}
```

### ClickHouse Tables - Always Use `klaviyo_public_id`

**IMPORTANT**: ALL ClickHouse tables use `klaviyo_public_id` (string) as the primary identifier:

#### ClickHouse Tables (all use `klaviyo_public_id`):
- **Analytics/Metrics Tables:**
  - `account_metrics_daily` - Daily aggregated metrics
  - `campaign_statistics` - Campaign performance data
  - `flow_statistics` - Flow performance data
  - `klaviyo_orders` - Order transactions
  - `segments_statistics` - Segment metrics
  - `form_statistics` - Form submission metrics
  - `email_statistics` - Email engagement metrics
  
**Field Name**: Always `klaviyo_public_id` (not `store_public_id`)
**Data Type**: String
**Reason**: ClickHouse stores are identified by their Klaviyo integration public ID

#### MongoDB Collections:
##### Use `klaviyo_public_id` for:
- **Analytics Data Collections:**
  - `orders` collection
  - `campaignstats` collection  
  - `flowstats` collection
  - `segmentsstats` collection
  - `formstats` collection
  
**Reason**: Multiple Store records can share the same Klaviyo integration for analytics. This allows different accounts/stores to view analytics from the same Klaviyo account.

##### Use `store_public_id` (Store's public ID) for:
- **All other MongoDB operations:**
  - User permissions
  - Store settings
  - Store management
  - UI filtering/display
  - Store selection
  - Non-analytics collections
  
**Example:**
```javascript
// ✅ CORRECT - ClickHouse query with klaviyo_public_id
const query = `
  SELECT * FROM account_metrics_daily 
  WHERE klaviyo_public_id = '${klaviyoPublicId}'
`;

// ✅ CORRECT - MongoDB analytics query
const campaignStats = await CampaignStat.find({
  klaviyo_public_id: store.klaviyo_integration.public_id
});

// ✅ CORRECT - Store management in MongoDB
const userStores = await Store.find({
  public_id: { $in: user.store_ids }
});

// ❌ WRONG - Don't use store_public_id for ClickHouse
const query = `
  SELECT * FROM account_metrics_daily 
  WHERE store_public_id = '${storeId}'  // This field doesn't exist!
`;

// ❌ WRONG - Don't use store_public_id for analytics
const campaignStats = await CampaignStat.find({
  store_public_id: store.public_id // This won't find the data!
});
```

**Key Points**:
- ALL ClickHouse tables use `klaviyo_public_id` field (string type)
- MongoDB analytics collections use `klaviyo_public_id`
- MongoDB store/user collections use `store_public_id`
- Always check which ID type to use before querying!

### 📅 CRITICAL: Calendar Data Sources

**IMPORTANT**: The `/calendar` page should use MongoDB exclusively for past campaigns, NOT ClickHouse:

#### Calendar Data Strategy:
```javascript
// ✅ CORRECT - Calendar should use MongoDB CampaignStat model
import CampaignStat from '@/models/CampaignStat';

// For calendar past campaigns - use MongoDB
const pastCampaigns = await CampaignStat.find({
  klaviyo_public_id: { $in: klaviyoIds },
  send_time: {
    $gte: startDate,
    $lte: endDate
  }
});

// ❌ WRONG - Don't use ClickHouse for calendar campaigns
const response = await fetch('/api/analytics/campaigns-clickhouse');
```

#### Why MongoDB for Calendar:
- **Complete Campaign Data**: MongoDB has full campaign details (name, subject, recipients, etc.)
- **Proper Campaign Names**: ClickHouse `campaign_statistics` often has NULL/empty `campaign_name` fields
- **Store Mapping**: MongoDB campaigns have `store_public_ids` arrays for proper store association
- **Real-time Updates**: Campaign data is fresher in MongoDB than aggregated ClickHouse data

#### Calendar API Endpoints:
- **Past Campaigns**: `/api/calendar/campaigns` (MongoDB CampaignStat model)
- **Upcoming Campaigns**: `/api/calendar/campaigns` with `status=scheduled` (MongoDB CampaignStat model)
- **Analytics/Metrics**: Use ClickHouse only for performance aggregations, not campaign lists

#### Example Calendar Query:
```javascript
// ✅ CORRECT - Calendar campaign fetch
const campaigns = await CampaignStat.find({
  klaviyo_public_id: { $in: ['Pe5Xw6', 'XqkVGb'] },
  send_time: {
    $gte: new Date('2025-01-01'),
    $lte: new Date('2025-01-31')
  }
}).sort({ send_time: -1 });

// Each campaign will have:
// - campaign_name: "Email Campaign - Jan 13, 2025, 7:32 PM"
// - store_public_ids: ["qNVU8wF", "zp7vNlc"]
// - klaviyo_public_id: "XqkVGb"
// - statistics: { recipients, opens, clicks, etc. }
```

**Remember**: ClickHouse is for analytics aggregations, MongoDB is for individual campaign data!

## 🔐 CRITICAL: Klaviyo API Configuration

### **IMPORTANT: Klaviyo API Revision**

**ALWAYS use `process.env.KLAVIYO_REVISION` for ALL Klaviyo API calls**

The application MUST use the KLAVIYO_REVISION environment variable for all Klaviyo API calls:
- **Required**: Always use `process.env.KLAVIYO_REVISION`
- **Never hardcode revision values** - the revision must come from the environment variable
- The revision header must be included in ALL Klaviyo API requests
- The revision is required for features like `additional-fields[segment]=profile_count`
- The current value in .env is `2025-07-15` but this should never be hardcoded

```javascript
// ✅ CORRECT - Using the environment variable
const API_REVISION = process.env.KLAVIYO_REVISION;

// ✅ CORRECT - With a fallback that matches .env
const API_REVISION = process.env.KLAVIYO_REVISION || '2025-07-15';

// ❌ WRONG - Don't hardcode revision dates
const API_REVISION = '2025-07-15'; // WRONG - use process.env!
const API_REVISION = '2024-10-15'; // WRONG - use process.env!
const API_REVISION = '2023-10-15'; // WRONG - use process.env!
```

## 🔐 CRITICAL: Klaviyo OAuth-First Authentication

### **IMPORTANT: Klaviyo API Revision Header**

**All Klaviyo API calls MUST include the revision header. Use the environment variable:**
```javascript
// Use NEXT_PUBLIC_KLAVIYO_REVISION for client/server compatibility
const API_REVISION = process.env.NEXT_PUBLIC_KLAVIYO_REVISION || '2025-07-15';
```

**Environment Variable Configuration:**
```bash
# In .env file
NEXT_PUBLIC_KLAVIYO_REVISION=2025-07-15
```

### **IMPORTANT: Always Use OAuth-First with Automatic Fallback**

**The application MUST follow this authentication priority for ALL Klaviyo API calls:**

### Authentication Priority Order:
```
1. OAuth Bearer Token (Preferred)
   ↓ (if token expired)
2. Automatic Refresh Token (Retry OAuth)
   ↓ (if refresh fails or no OAuth available)
3. API Key Fallback (Legacy support)
   ↓ (if no API key)
4. Authentication Error
```

### ✅ CORRECT Implementation Pattern:

```javascript
// Always use the centralized auth helper
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

export async function GET(request) {
  await connectToDatabase();
  
  // Get store with klaviyo_integration
  const store = await Store.findOne({ public_id: storeId });
  
  // Build OAuth-first authentication options
  // This automatically handles: OAuth → Refresh → API Key fallback
  const authOptions = buildKlaviyoAuthOptions(store);
  
  // Make API call - will automatically retry with refresh token if needed
  const campaigns = await klaviyoRequest('GET', 'campaigns', authOptions);
  
  return NextResponse.json({ data: campaigns });
}
```

### ❌ WRONG Patterns to Avoid:

```javascript
// ❌ NEVER pass API key directly - bypasses OAuth
const campaignMessage = await fetchKlaviyoCampaignMessage(
  messageId,
  store.klaviyo_integration.apiKey  // WRONG!
);

// ❌ NEVER make direct fetch calls - no OAuth support
const response = await fetch('https://a.klaviyo.com/api/campaigns', {
  headers: {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,  // WRONG!
  }
});

// ❌ NEVER check only for API key
if (!store.klaviyo_integration?.apiKey) {  // WRONG!
  return NextResponse.json({ error: 'No API key' }, { status: 404 });
}
```

### ✅ CORRECT Authentication Check:

```javascript
// Check for OAuth OR API key
if (!store.klaviyo_integration || 
    (!store.klaviyo_integration.apiKey && !store.klaviyo_integration.oauth_token)) {
  return NextResponse.json({ 
    error: 'Klaviyo authentication not configured' 
  }, { status: 404 });
}

### Store Integration Fields:
```javascript
klaviyo_integration: {
  // OAuth fields (preferred)
  oauth_token: "Bearer_token_here",        // Current access token
  refresh_token: "Refresh_token_here",     // For automatic refresh
  token_expires_at: Date,                  // Token expiration
  
  // API Key (fallback only)
  apiKey: "pk_xxxxx",                      // Legacy API key
  
  // Store identifier
  public_id: "store_klaviyo_id"
}
```

### Remember:
- **ALWAYS** use `buildKlaviyoAuthOptions(store)` to build auth options
- **NEVER** pass API keys directly to functions
- **ALWAYS** check for both OAuth and API key when validating auth
- The system will **automatically** handle token refresh and fallback

## 🔐 CRITICAL: Superuser API Guidelines

### **IMPORTANT: Superuser API Authentication**

**All superuser functionality should use `/api/superuser/*` endpoints with simplified authentication:**

```javascript
// ✅ CORRECT - Superuser API pattern
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Simple superuser check - ignore complex roles/permissions
    const user = await User.findOne({ email: session.user.email });
    
    if (!user?.is_super_user) {
      return NextResponse.json({ 
        error: "Superuser access required" 
      }, { status: 403 });
    }

    // Your superuser logic here...
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Superuser API error:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
```

### **Key Principles for Superuser APIs:**
1. **Simple Permission Check**: Only check `user.is_super_user === true`
2. **Ignore Complex Roles**: Don't use `canImpersonateAccounts()` or other complex permission methods
3. **Centralized Pattern**: All superuser APIs should follow the same authentication pattern
4. **Security Logging**: Log superuser actions for audit purposes
5. **Error Consistency**: Use consistent error messages across all superuser endpoints

### **Superuser API Endpoints:**
- `/api/superuser/users` - User management and listing
- `/api/superuser/impersonate` - User impersonation token generation
- `/api/superuser/support` - Support ticket management  
- `/api/superuser/system` - System health and monitoring
- `/api/superuser/*` - All other superuser functionality

### **Example Usage:**
```javascript
// ❌ WRONG - Complex permission checking
if (!requestingUser?.isSuperUser() || !requestingUser?.canImpersonateAccounts()) {
  return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
}

// ✅ CORRECT - Simple superuser check
if (!user?.is_super_user) {
  return NextResponse.json({ error: "Superuser access required" }, { status: 403 });
}
```

## 🤖 CRITICAL: Wizel AI Chat Integration

### **IMPORTANT: AI Context Management for Chat Assistant**

**The application includes Wizel, an AI chat assistant that can analyze on-screen data and provide insights. For this to work effectively, reporting and analytics pages MUST provide context data.**

### **Implementation Pattern:**

```javascript
// ✅ CORRECT - Provide AI context on reporting/analytics pages
"use client";

import { useAI } from "@/app/contexts/ai-context";
import { useEffect } from "react";

export default function ReportingPage() {
  const { setAIState } = useAI();
  
  // Update AI context whenever data changes
  useEffect(() => {
    const WIZEL_AI = {
      page_type: "campaign_analytics",
      current_view: "performance_metrics",
      data_context: {
        campaigns: campaignData,
        date_range: { start: startDate, end: endDate },
        selected_metrics: ["open_rate", "click_rate", "revenue"],
        active_filters: activeFilters,
        comparison_mode: isComparing,
        summary_stats: {
          total_campaigns: 45,
          avg_open_rate: 23.5,
          total_revenue: 125000,
          top_performer: "Black Friday Campaign"
        }
      },
      available_actions: [
        "compare_campaigns",
        "export_data",
        "drill_down",
        "change_date_range"
      ],
      insights: {
        trends: "Open rates increasing 5% week-over-week",
        anomalies: "Unusual spike in clicks on Tuesday",
        recommendations: "Consider A/B testing subject lines"
      }
    };
    
    setAIState(WIZEL_AI);
    
    // Cleanup on unmount
    return () => setAIState(null);
  }, [campaignData, startDate, endDate, activeFilters]);
  
  // Rest of your component...
}
```

### **Required WIZEL_AI State Structure:**

Every reporting/analytics page should provide a `WIZEL_AI` object with:

```javascript
const WIZEL_AI = {
  // Page identification
  page_type: string,        // "dashboard", "campaign_analytics", "store_performance", etc.
  current_view: string,     // "overview", "details", "comparison", etc.
  
  // Core data context
  data_context: {
    // Include relevant data being displayed
    // This should be a summary, not entire datasets
    [key]: any              // Flexible based on page type
  },
  
  // User actions available
  available_actions: [],    // What can the user do on this page
  
  // Pre-calculated insights (optional)
  insights: {
    trends: string,
    anomalies: string,
    recommendations: string
  },
  
  // Metadata
  last_updated: Date,
  user_context: {
    selected_store: string,
    active_filters: [],
    view_preferences: {}
  }
};
```

### **Pages That MUST Implement WIZEL_AI Context:**

1. **Dashboard Pages** (`/dashboard`, `/superuser`)
   - Current metrics and KPIs
   - Recent activity and trends
   - Active alerts or issues

2. **Analytics Pages** (`/calendar`, `/multi-account-reporting`)
   - Campaign performance data
   - Date ranges and comparisons
   - Selected metrics and filters

3. **Store Pages** (`/store/[id]/*`)
   - Store-specific metrics
   - Product/collection data
   - Integration status

4. **Reporting Pages**
   - Any page showing charts/graphs
   - Performance metrics
   - Comparison views

### **Example Implementations:**

**Campaign Calendar Page:**
```javascript
const WIZEL_AI = {
  page_type: "campaign_calendar",
  current_view: "month",
  data_context: {
    visible_campaigns: visibleCampaigns.map(c => ({
      name: c.name,
      date: c.send_date,
      type: c.type,
      status: c.status,
      metrics: c.key_metrics
    })),
    selected_date: selectedDate,
    month_summary: {
      total_campaigns: 23,
      email_campaigns: 18,
      sms_campaigns: 5
    }
  },
  available_actions: ["view_details", "compare", "export", "create_new"],
  insights: {
    trends: "Tuesdays show 25% higher engagement",
    recommendations: "Gap in SMS campaigns next week"
  }
};
```

**Store Performance Page:**
```javascript
const WIZEL_AI = {
  page_type: "store_analytics",
  current_view: "performance_overview",
  data_context: {
    store_name: store.name,
    period: "last_30_days",
    revenue: { total: 45000, trend: "+12%" },
    orders: { count: 234, aov: 192.31 },
    top_products: topProducts.slice(0, 5),
    campaigns: { active: 3, scheduled: 7 }
  },
  available_actions: ["drill_down", "export", "compare_periods"],
  insights: {
    trends: "Revenue up 12% from last period",
    anomalies: "Spike in orders on weekends"
  }
};
```

### **Best Practices:**

1. **Update on Data Changes**: Always update WIZEL_AI when data changes
2. **Summarize Data**: Don't pass entire datasets, provide summaries
3. **Include User Context**: Selected filters, date ranges, etc.
4. **Clean on Unmount**: Set to null when leaving the page
5. **Avoid Sensitive Data**: Don't include passwords, API keys, etc.

### **Benefits:**

- **Contextual AI Responses**: Wizel can answer questions about visible data
- **Smart Insights**: AI can identify trends and anomalies
- **Action Suggestions**: Recommend next steps based on current view
- **Better User Experience**: Natural conversation about on-screen data

### **Testing AI Context:**

```javascript
// In browser console, check if context is set:
const { getAIContext } = useAI();
console.log('Current AI Context:', getAIContext());
```

## 🔐 CRITICAL: Klaviyo Authentication Guidelines

### OAuth-First Authentication Approach

**IMPORTANT**: All Klaviyo API calls MUST use the OAuth-first authentication approach. The application supports both OAuth Bearer tokens and API keys, with OAuth being the preferred method.

#### Always Use the Centralized Authentication Helper

**✅ CORRECT - Using the OAuth-first helper:**

```javascript
import { klaviyoRequest } from '@/lib/klaviyo-api';
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';

export async function GET(request) {
  await connectToDatabase();
  
  // Get store with klaviyo_integration
  const store = await Store.findOne({ public_id: storeId });
  
  // Build OAuth-first authentication options
  const authOptions = buildKlaviyoAuthOptions(store);
  
  // Make API call using centralized function
  const campaigns = await klaviyoRequest('GET', 'campaigns', authOptions);
  
  return NextResponse.json({ data: campaigns });
}
```

**❌ WRONG - Don't use direct fetch calls:**

```javascript
// ❌ Don't do this anymore
const response = await fetch('https://a.klaviyo.com/api/campaigns', {
  headers: {
    'Authorization': `Klaviyo-API-Key ${store.klaviyo_integration.apiKey}`,
    // ...
  }
});
```

#### Authentication Priority Order

The system automatically tries authentication methods in this order:

1. **OAuth Bearer Token (Preferred)**: Uses `oauth_token` with automatic refresh via `refresh_token`
2. **API Key Fallback**: Uses `apiKey` for backwards compatibility

#### Store Integration Fields

Your Store model's `klaviyo_integration` object should contain:

```javascript
// OAuth fields (preferred)
oauth_token: "Bearer_token_here"           // Current access token
refresh_token: "Refresh_token_here"        // For automatic token refresh
token_expires_at: Date                     // Token expiration timestamp

// API Key (fallback)
apiKey: "pk_xxxxx"                        // Traditional API key

// Environment variables required for OAuth
KLAVIYO_CLIENT_ID=your_client_id
KLAVIYO_CLIENT_SECRET=your_client_secret
```

#### Common Usage Patterns

**For API Routes:**
```javascript
import { klaviyoRequest } from '@/lib/klaviyo-api';
import { buildKlaviyoAuthOptionsWithLogging } from '@/lib/klaviyo-auth-helper';

export async function POST(request) {
  // Build auth options with debug logging
  const authOptions = buildKlaviyoAuthOptionsWithLogging(store, { debug: true });
  
  // Make authenticated API call
  const result = await klaviyoRequest('POST', 'web-feeds', {
    ...authOptions,
    payload: feedData
  });
}
```

**For Background Jobs/Utilities:**
```javascript
import { buildKlaviyoAuthOptions } from '@/lib/klaviyo-auth-helper';
import { klaviyoRequest } from '@/lib/klaviyo-api';

// In utility functions like /lib/klaviyo.js
export async function fetchKlaviyoCampaigns(authOptions) {
  return await klaviyoRequest('GET', 'campaigns', authOptions);
}

// When calling the utility
const authOptions = buildKlaviyoAuthOptions(store);
const campaigns = await fetchKlaviyoCampaigns(authOptions);
```

#### Automatic Token Refresh

The system automatically handles token refresh:
- Tokens are refreshed when they expire (with 5-minute buffer)
- Failed requests due to expired tokens trigger automatic refresh and retry
- Refresh tokens are updated when new ones are provided by Klaviyo

#### Error Handling

```javascript
try {
  const authOptions = buildKlaviyoAuthOptions(store);
  const data = await klaviyoRequest('GET', 'campaigns', authOptions);
} catch (error) {
  if (error.message.includes('No valid Klaviyo authentication')) {
    // Handle missing/invalid credentials
    return NextResponse.json({ error: 'Klaviyo not configured' }, { status: 400 });
  }
  
  if (error.message.includes('401')) {
    // Handle authentication failures
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Handle other API errors
  throw error;
}
```


When updating existing code:
1. Replace direct `fetch()` calls with `klaviyoRequest()`
2. Replace API key parameters with `authOptions` from `buildKlaviyoAuthOptions()`
3. Remove manual header construction and error handling
4. Test with both OAuth and API key configurations

**Always use the centralized functions - never make direct Klaviyo API calls!**

## IMPORTANT: Design System Reference

### 🎨 ALWAYS CHECK DESIGN PRINCIPLES
**Before creating or modifying ANY UI components, you MUST:**
1. Read and follow `/context/design-principles.md`
2. Use the defined color palette from the design principles
3. Follow the typography system specified
4. Maintain consistent spacing and sizing
5. Adhere to the component patterns established

## Color Palette Reference
The application uses a specific color scheme defined in `/context/design-principles.md`:

### Primary Colors
- **Sky Blue (#60A5FA)** - Main brand color for buttons, links, highlights
- **Royal Blue (#2563EB)** - Stronger CTAs, active states, hover
- **Vivid Violet (#8B5CF6)** - Secondary CTAs, key accents  
- **Deep Purple (#7C3AED)** - Brand highlights, gradients

### Supporting Colors
- **Lilac Mist (#C4B5FD)** - Hover states, light backgrounds
- **Sky Tint (#E0F2FE)** - Subtle accents, backgrounds
- **Neutral Gray (#475569)** - Borders, secondary text
- **Slate Gray (#1e293b)** - Primary text, headings

### Key Files to Reference
- `/context/design-principles.md` - Complete design system documentation
- `/context/analytics.md` - Analytics implementation guidelines and metrics calculations
- `/app/globals.css` - Global styles and CSS variables
- `/tailwind.config.js` - Tailwind configuration with custom colors
- `/app/components/ui/` - Existing UI components to maintain consistency

## Component Guidelines

### When Creating New Components
1. **Check existing components first** in `/app/components/ui/`
2. **Use the established patterns** from similar components
3. **Follow the color system** - never use arbitrary color values
4. **Maintain consistent spacing** using the defined spacing scale
5. **Include all interactive states**: hover, focus, active, disabled
6. **Ensure accessibility** with proper ARIA labels and keyboard navigation

### Button Patterns & Gradients
```jsx
// Primary button with gradient (preferred for main CTAs)
<Button 
  className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-md hover:shadow-lg transition-all"
>
  Primary Action
</Button>

// Secondary button - solid color
<Button variant="secondary">Secondary Action</Button>

// Standard solid button
<Button className="bg-sky-blue hover:bg-royal-blue text-white">
  Standard Action
</Button>
```

### Gradient Usage Guidelines
Use gradients from the design system for:
- **Primary CTAs**: New, Create, Save buttons
- **Header backgrounds**: `bg-gradient-to-r from-sky-50 to-purple-50`
- **Special states**: Today's date, active selections
- **Feature highlights**: Premium or new features

```jsx
// Header with subtle gradient
<div className="bg-gradient-to-r from-sky-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
  {/* Header content */}
</div>

// Primary gradient button
<Button className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple">
  New Campaign
</Button>

// Special highlight element
<div className="bg-gradient-to-br from-sky-tint to-lilac-mist border-2 border-sky-blue">
  {/* Today's date or special content */}
</div>
```

### Typography
- Font: **Roboto** (already configured)
- Headings: Use `font-bold` or `font-extrabold` 
- Body text: Use `text-neutral-gray` for secondary text
- Always maintain proper hierarchy

### Icons
- **ALWAYS use Lucide React icons** instead of emojis for professional consistency
- **CRITICAL: NEVER use emojis in the planner or any UI components** - Always use Lucide icons
- Import icons from `lucide-react`: `import { IconName } from 'lucide-react'`
- Standard icon size: `h-4 w-4` (16px) for inline icons, `h-5 w-5` (20px) for headers
- Apply semantic colors: `text-blue-600` for email, `text-green-600` for SMS, `text-purple-600` for notifications
- Use consistent icon patterns across similar features

```jsx
// ✅ CORRECT - Lucide React icons
import { Mail, MessageSquare, Bell, Users } from 'lucide-react';

<Mail className="h-4 w-4 text-blue-600" />
<MessageSquare className="h-4 w-4 text-green-600" />
<Bell className="h-4 w-4 text-purple-600" />

// ❌ WRONG - Don't use emojis in UI
<span>📧</span>
<span>💬</span>
<span>🔔</span>
```

### Popovers and Overlays
- **ALWAYS ensure popovers have solid backgrounds** - Never allow transparency issues
- **Use explicit background classes** for all popover content to prevent visual glitches
- **Include proper borders and shadows** for better visual separation

```jsx
// ✅ CORRECT - Solid background with proper styling
<PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
  {/* Content */}
</PopoverContent>

// ❌ WRONG - Missing background classes (can cause transparency)
<PopoverContent className="w-80 p-4">
  {/* Content */}
</PopoverContent>
```

## Analytics Implementation Guidelines

### 📊 ALWAYS CHECK ANALYTICS DOCUMENTATION
**When implementing ANY analytics features, metrics, or calculations, you MUST:**
1. **Read and follow `/context/analytics.md` or context/CLICKHOUSE_TABLES_COMPLETE_V2.md** for proper metric calculations
2. **Use weighted averages** for aggregate metrics (not simple averages)
3. **Calculate rates correctly** using unique counts where appropriate
4. **Follow established naming conventions** for metrics
5. **Ensure consistent metric definitions** across the application

### Key Analytics Concepts
- **Open Rate**: Unique opens / Recipients delivered
- **Click Rate**: Unique clicks / Recipients delivered  
- **CTOR (Click-to-Open Rate)**: Unique clicks / Unique opens
- **Conversion Rate**: Conversions / Recipients delivered
- **AOV (Average Order Value)**: Total revenue / Number of orders
- **Revenue per Recipient**: Total revenue / Recipients delivered

### Calculating Aggregate Metrics
```javascript
// ✅ CORRECT - Weighted average for open rate
const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipients, 0);
const totalOpens = campaigns.reduce((sum, c) => sum + c.opensUnique, 0);
const avgOpenRate = (totalOpens / totalRecipients) * 100;

// ❌ WRONG - Simple average of percentages
const avgOpenRate = campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length;
```

## 📊 CRITICAL: Number Formatting Standards

### **ALWAYS use centralized formatting functions from `/lib/utils.js`**

**For all analytics and reporting components, use the standardized number formatting functions to ensure consistency and readability across large datasets.**

### Available Formatting Functions

#### `formatNumber(value)`
Formats numbers with appropriate suffixes for better readability:
- `856` → `856`
- `1,200` → `1.2K`
- `1,034,567` → `1.03M`
- `2,450,000,000` → `2.45B`

#### `formatCurrency(value)`
Formats currency values with appropriate suffixes:
- `12.34` → `$12.34`
- `1,200` → `$1.2K`
- `1,034,567` → `$1.03M`
- `2,450,000,000` → `$2.45B`

#### `formatPercentage(value)`
Formats percentage values:
- `12.345` → `12.3%`

#### `formatPercentageChange(change)`
Formats percentage changes with proper signs:
- `12.5` → `+12.5%`
- `-8.2` → `-8.2%`
- `0` → `0%`

### Usage Guidelines

```javascript
// ✅ CORRECT - Import and use centralized formatting
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

// In your component
const revenue = 1034567;
const recipients = 45300;
const openRate = 23.456;

return (
  <div>
    <span>Revenue: {formatCurrency(revenue)}</span> {/* Shows: $1.03M */}
    <span>Recipients: {formatNumber(recipients)}</span> {/* Shows: 45.3K */}
    <span>Open Rate: {formatPercentage(openRate)}</span> {/* Shows: 23.5% */}
  </div>
);
```

```javascript
// ❌ WRONG - Don't create custom formatting
const revenue = 1034567;
const formatted = value >= 1000000 ? `$${(value/1000000).toFixed(1)}M` : `$${value}`; // Inconsistent!
```

### Chart Formatting
For Recharts components, use the centralized functions in tickFormatter and tooltip formatters:

```javascript
// ✅ CORRECT - Chart axis formatting
<YAxis 
  tickFormatter={(value) => {
    if (metricType === 'currency') {
      return formatCurrency(value).replace('$', ''); // Remove $ for axis
    }
    if (metricType === 'percentage') {
      return formatPercentage(value);
    }
    return formatNumber(value);
  }}
/>

// ✅ CORRECT - Tooltip formatting
<Tooltip 
  formatter={(value, name) => {
    if (name.includes('revenue')) return formatCurrency(value);
    if (name.includes('Rate')) return formatPercentage(value);
    return formatNumber(value);
  }}
/>
```

### Why This Matters
1. **Consistency**: All numbers across the application display uniformly
2. **Readability**: Large numbers (1M+) are much easier to read than 7+ digit numbers
3. **Maintainability**: Changes to formatting logic happen in one place
4. **Performance**: Centralized functions are optimized and cached

### Migration Notes
- **Replace all inline number formatting** with centralized functions
- **Update chart tickFormatter functions** to use the new formatters
- **Test all analytics displays** to ensure numbers show correctly
- **Verify tooltip and axis formatting** in all charts

## Code Quality Standards

### Before Making Changes
1. **Read relevant documentation** in `/context/` folder
2. **For analytics: ALWAYS check `/context/analytics.md`** first
3. **Check existing patterns** in similar components
4. **Maintain consistency** with the established codebase
5. **Test responsiveness** across different screen sizes
6. **Verify dark mode** compatibility

### Component Structure
```jsx
"use client"; // If using client-side features

import { cn } from "@/lib/utils"; // For className merging
import { ComponentDependencies } from "@/app/components/ui/...";

// Follow existing component patterns
```

## Next.js Specific Guidelines

### IMPORTANT: Always use `await` with params for server components in Next.js 15+
In Next.js 15 and later, route parameters are now asynchronous. Always await params before using them:

```javascript
// ❌ WRONG - Don't access params directly
export default function Page({ params }) {
  const id = params.id; // This will cause errors in Next.js 15+
}

// ✅ CORRECT - Always await params
export default async function Page({ params }) {
  const { id } = await params; // Proper async handling
  // Now you can use id safely
}

// ✅ For API routes
export async function GET(request, { params }) {
  const { id } = await params; // Always await params in API routes too
  // Your API logic here
}

// ✅ For generateMetadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `Page for ${slug}`
  };
}
```

### Why This Matters
- Next.js 15+ made params asynchronous for performance optimization
- Direct access without await will result in runtime errors
- This applies to all route handlers, pages, and metadata functions

## File Organization
```
/app
  /components
    /ui         # Reusable UI components
  /hooks        # Custom React hooks
  /(routes)     # Page routes
/lib           # Utility functions
/context       # Documentation and context files
/public        # Static assets
```

## Testing Checklist
Before completing any UI task:
- [ ] Colors match the design system
- [ ] Component follows existing patterns
- [ ] Responsive design works properly
- [ ] Dark mode is supported
- [ ] Accessibility requirements are met
- [ ] Code follows project conventions

## Common Commands
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run lint    # Run linting
```

## Important Notes
1. **NEVER use hex colors directly** - use the Tailwind class names or CSS variables
2. **ALWAYS maintain consistency** with existing components
3. **REFERENCE `/context/design-principles.md`** for any design decisions
4. **USE the component library** in `/app/components/ui/` as the source of truth
5. **FOLLOW the established patterns** rather than creating new ones
6. **ALWAYS use centralized number formatting** from `/lib/utils.js` for all analytics displays
7. **AVOID low-contrast text** - Never use `text-neutral-gray`, `text-muted`, or similar low-contrast colors for primary content. Use `text-gray-900 dark:text-gray-100` for main text and `text-gray-600 dark:text-gray-400` for secondary text to ensure readability

## 🔄 CRITICAL: Loading States and Skeletons

### **IMPORTANT: ALL API calls and data fetching MUST use proper loading states**

**Always use the MorphingLoader component from `/app/components/ui/loading.jsx` for ALL loading states in the application.**

### Loading State Implementation Pattern

```javascript
// ✅ CORRECT - Import and use MorphingLoader for loading states
import MorphingLoader from '@/app/components/ui/loading';
import { Skeleton } from '@/app/components/ui/skeleton';

export default function Component() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // For full-page loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MorphingLoader
          size="large"
          showText={true}
          text="Loading campaigns..."
        />
      </div>
    );
  }

  // For inline loading (smaller components)
  if (loadingItem) {
    return <MorphingLoader size="small" showThemeText={false} />;
  }

  // For skeleton loading (when layout is known)
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }
}
```

### When to Use Each Loading Pattern

#### 1. **MorphingLoader** - For API calls and data fetching
Use for any async operations, API calls, or when waiting for data:
```javascript
// ✅ Page-level loading
<div className="flex items-center justify-center min-h-screen">
  <MorphingLoader size="xlarge" />
</div>

// ✅ Section loading
<div className="bg-white rounded-lg p-8 min-h-[300px] flex items-center justify-center">
  <MorphingLoader size="medium" showText={true} text="Fetching data..." />
</div>

// ✅ Button/inline loading
<button disabled={isLoading}>
  {isLoading ? <MorphingLoader size="small" showThemeText={false} /> : 'Save'}
</button>
```

#### 2. **Skeleton** - For content placeholders
Use when you know the structure of the content being loaded:
```javascript
// ✅ List skeleton
{loading ? (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
) : (
  <ActualListContent />
)}

// ✅ Card skeleton
{loading ? (
  <div className="grid grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <Skeleton key={i} className="h-48 rounded-lg" />
    ))}
  </div>
) : (
  <ActualCards />
)}
```

### Size Guidelines for MorphingLoader

- **`small`** (32x32px): Buttons, inline elements, small cards
- **`medium`** (60x60px): Card sections, modals, default size
- **`large`** (80x80px): Page sections, large modals
- **`xlarge`** (96x96px): Full-page loading, initial app load

### Custom Loading Messages

For context-specific loading, provide relevant messages:
```javascript
// ✅ Context-aware messages
<MorphingLoader
  size="medium"
  customThemeTexts={[
    "Analyzing campaign performance...",
    "Calculating open rates...",
    "Processing click data...",
    "Generating insights..."
  ]}
  textDuration={2500}
/>
```

### Loading State Checklist

Before implementing any data fetching:
- [ ] Import MorphingLoader from `/app/components/ui/loading`
- [ ] Add loading state variable
- [ ] Show MorphingLoader during fetch
- [ ] Use appropriate size for context
- [ ] Add descriptive text for long operations
- [ ] Consider skeleton for known layouts
- [ ] Handle error states appropriately

### Common Patterns

```javascript
// ❌ WRONG - No loading state
const data = await fetch('/api/data');
setData(data);

// ❌ WRONG - Generic spinner or custom loader
<div className="animate-spin">Loading...</div>

// ✅ CORRECT - MorphingLoader with proper state management
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    setData(data);
  } catch (error) {
    setError(error);
  } finally {
    setLoading(false);
  }
};

// In render
{loading && (
  <div className="flex justify-center p-8">
    <MorphingLoader size="medium" showText={true} text="Loading data..." />
  </div>
)}
```

### Why This Matters

1. **Consistency**: Uniform loading experience across the app
2. **User Feedback**: Clear indication that something is happening
3. **Brand Identity**: The MorphingLoader includes brand colors and personality
4. **Accessibility**: Proper loading states improve screen reader experience
5. **Performance Perception**: Good loading states make the app feel faster

### Migration Notes

- Replace all custom spinners with MorphingLoader
- Add loading states to all async operations
- Use skeletons for lists and grids where structure is known
- Test loading states by throttling network in DevTools

## Design Principles Priority
When in doubt about any UI decision:
1. First check `/context/design-principles.md`
2. Then check existing components for patterns
3. Finally, ask for clarification if needed

Remember: Consistency is more important than perfection. Follow the established design system!
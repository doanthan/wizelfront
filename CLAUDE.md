# AI Assistant Instructions

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

### When to Use Klaviyo's Public Key vs Store Public ID

**IMPORTANT**: The application uses different ID types depending on the data being queried:

#### Use `klaviyo_public_id` (Klaviyo's public key) for:
- **Analytics Data Collections:**
  - `orders` collection
  - `campaignstats` collection  
  - `flowstats` collection
  - `segmentsstats` collection
  - `formstats` collection
  
**Reason**: Multiple Store records can share the same Klaviyo integration for analytics. This allows different accounts/stores to view analytics from the same Klaviyo account.

#### Use `store_public_id` (Store's public ID) for:
- **All other operations:**
  - User permissions
  - Store settings
  - Store management
  - UI filtering/display
  - Store selection
  - Non-analytics collections
  
**Example:**
```javascript
// ✅ CORRECT - Querying analytics data
const campaignStats = await CampaignStat.find({
  klaviyo_public_id: store.klaviyo_integration.public_id
});

// ✅ CORRECT - Store management
const userStores = await Store.find({
  public_id: { $in: user.store_ids }
});

// ❌ WRONG - Don't use store_public_id for analytics
const campaignStats = await CampaignStat.find({
  store_public_id: store.public_id // This won't find the data!
});
```

**Key Point**: Always check which ID type a MongoDB collection uses before querying! Analytics collections use `klaviyo_public_id`, everything else uses `store_public_id`.

## 🔐 CRITICAL: Klaviyo OAuth-First Authentication

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
```

### Key Benefits of OAuth-First:
1. **Better Security**: OAuth tokens can be revoked and have limited scope
2. **Automatic Refresh**: Tokens refresh automatically when expired
3. **No Manual Token Management**: System handles all token lifecycle
4. **Fallback Support**: Seamlessly falls back to API key if OAuth fails
5. **Future-Proof**: OAuth is Klaviyo's preferred authentication method

### Required Environment Variables for OAuth:
```bash
WIZEL_KLAVIYO_ID=your_oauth_client_id
WIZEL_KLAVIYO_SECRET=your_oauth_client_secret
```

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

#### Key Benefits of OAuth-First Approach

1. **Better Security**: OAuth tokens can be revoked and have limited scope
2. **Automatic Refresh**: No need to manually handle token expiration
3. **Future-Proof**: OAuth is Klaviyo's preferred authentication method
4. **Rate Limiting**: Centralized rate limiting and retry logic
5. **Consistent Error Handling**: Unified error handling across all API calls

#### Migration Notes

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
- Headings: Use `font-bold` or `font-extrabold` with `text-slate-gray`
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
1. **Read and follow `/context/analytics.md`** for proper metric calculations
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

### IMPORTANT: Always use `await` with params in Next.js 15+
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

## 🛡️ SOC2 & ISO 27001 Compliance Implementation

### **Lightweight Compliance System with Minimal Overhead**

The application includes a compliance system designed for SOC2 Type II and ISO 27001 certification with minimal performance impact.

### Compliance Levels

Set via `COMPLIANCE_LEVEL` environment variable:

- **`none`**: No compliance features (development only)
- **`basic`**: Critical actions only (minimal overhead ~1-2%)
- **`standard`**: Enhanced logging and monitoring (~3-5% overhead)
- **`full`**: Complete audit trail and monitoring (~5-10% overhead)

### Key Components

#### 1. Security Headers Middleware (`/middleware.js`)
- Implements all required SOC2 CC6.2 security headers
- Lightweight audit logging for critical actions
- No performance impact (just adds headers)
- Automatic CSRF protection

#### 2. Audit Logging System
- **Model**: `/models/AuditLog.js`
- **API**: `/api/compliance/audit-log`
- Tracks only critical actions in basic mode:
  - Authentication events
  - Data modifications
  - Permission changes
  - Payment attempts
- Automatic 7-year retention (SOC2 requirement)
- Async logging to avoid blocking

#### 3. Compliance Dashboard (`/superuser/compliance`)
- Real-time compliance score
- Security control status
- Audit log viewer
- Incident tracking
- Export compliance reports

### Environment Variables

```bash
# Compliance Level
COMPLIANCE_LEVEL=basic  # none, basic, standard, full

# Audit Settings
AUDIT_LOGGING=true
AUDIT_RETENTION_DAYS=2555  # 7 years

# Security Settings
RATE_LIMITING=true
SESSION_TIMEOUT=3600  # 1 hour
ENCRYPT_DATA=true
MASK_PII=true

# Monitoring (optional)
MONITORING_ENABLED=true
PERFORMANCE_MONITORING=false  # Enable only if needed
SENTRY_DSN=your_sentry_dsn  # For error tracking

# Compliance Reporting
COMPLIANCE_EMAILS=security@company.com,compliance@company.com
```

### Critical Actions Logged (Basic Mode)

Only these actions are logged in basic mode to minimize overhead:

```javascript
const CRITICAL_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_IMPERSONATION',
  'DATA_EXPORT',
  'STORE_DELETE',
  'PAYMENT_ATTEMPT',
  'PERMISSION_CHANGE',
  'API_KEY_CREATE',
  'API_KEY_REVOKE',
  'FAILED_LOGIN',
  'UNAUTHORIZED_ACCESS'
];
```

### Compliance Checklist

#### SOC2 Type II Controls
- ✅ **CC6.1**: Logical Access Controls (NextAuth)
- ✅ **CC6.2**: Security Headers (Middleware)
- ✅ **CC6.3**: Registration & Authorization
- ✅ **CC7.1**: System Monitoring (Audit Logs)
- ✅ **CC7.2**: Security Incident Monitoring
- ✅ **CC8.1**: Change Management (Git)
- ⚠️ **A1.2**: System Availability (Needs uptime monitoring)
- ⚠️ **C1.1**: Data Confidentiality (Partial encryption)

#### ISO 27001 Controls
- ✅ **A.9**: Access Control (RBAC implemented)
- ✅ **A.10**: Cryptography (Encryption available)
- ✅ **A.12**: Operations Security (Audit logging)
- ✅ **A.13**: Communications Security (HTTPS, headers)
- ✅ **A.16**: Incident Management (Dashboard)
- ⚠️ **A.14**: Secure Development (Needs SAST/DAST)
- ⚠️ **A.17**: Business Continuity (Needs DR plan)

### Performance Impact

| Feature | Basic Mode | Standard Mode | Full Mode |
|---------|------------|---------------|-----------|
| Security Headers | <0.1% | <0.1% | <0.1% |
| Critical Audit Logs | 0.5-1% | 2-3% | 5-7% |
| Rate Limiting | 0.2% | 0.2% | 0.2% |
| Encryption | 1-2% | 2-3% | 3-5% |
| **Total Overhead** | **~2%** | **~5%** | **~10%** |

### Usage Examples

#### Manually Log an Audit Event
```javascript
import AuditLog from '@/models/AuditLog';

await AuditLog.logAction({
  action: 'CUSTOM_ACTION',
  userId: user._id,
  userEmail: user.email,
  ip: request.ip,
  metadata: { additional: 'data' }
});
```

#### Check Compliance Status
```javascript
import { getComplianceStatus } from '@/lib/compliance-config';

const status = getComplianceStatus();
console.log(`Compliance Score: ${status.overall}%`);
```

#### Export Compliance Report
```javascript
// GET /api/superuser/compliance?type=report&days=30
const report = await fetch('/api/superuser/compliance?type=report');
```

### Best Practices

1. **Start with Basic Mode** - Minimal overhead, covers critical requirements
2. **Monitor Performance** - Check impact before increasing compliance level
3. **Regular Audits** - Review audit logs weekly via dashboard
4. **Incident Response** - Document and track all security incidents
5. **Keep Documentation** - Update security policies as features change

### Certification Readiness

With this implementation, you can demonstrate:
- ✅ Audit trail of all critical actions
- ✅ Security headers and protections
- ✅ Access control and authentication
- ✅ Monitoring and alerting capabilities
- ✅ Data retention policies
- ✅ Incident management process

For full SOC2/ISO27001 certification, you'll also need:
- Security policies and procedures documentation
- Employee training records
- Vendor management processes
- Business continuity plan
- Annual penetration testing
- Risk assessment documentation

## Design Principles Priority
When in doubt about any UI decision:
1. First check `/context/design-principles.md`
2. Then check existing components for patterns
3. Finally, ask for clarification if needed

Remember: Consistency is more important than perfection. Follow the established design system!
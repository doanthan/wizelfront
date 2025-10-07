# Wizel - Multi-Account Klaviyo Reporting Platform

## Project Overview

Wizel is a comprehensive **multi-account Klaviyo reporting and analytics platform** that enables users to manage, analyze, and optimize multiple Klaviyo email marketing accounts from a single unified interface. The platform provides advanced analytics, campaign calendar views, multi-account reporting, and AI-powered insights.

### Core Value Proposition
- **Multi-Account Management**: Host and manage multiple Klaviyo account API keys and OAuth integrations
- **Unified Analytics**: Aggregate and compare performance across multiple Klaviyo accounts
- **Advanced Reporting**: Deep dive into campaign, flow, segment, and revenue analytics
- **Campaign Planning**: Visual calendar interface for scheduling and managing campaigns
- **AI Assistant**: Built-in Wizel AI chat assistant for contextual insights and recommendations

---

## Technical Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui component library
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **State Management**: React Context API + localStorage

### Backend
- **Framework**: Next.js API Routes (App Router)
- **Authentication**: NextAuth.js with custom providers
- **Primary Database**: MongoDB (Mongoose ORM)
- **Analytics Database**: ClickHouse for high-performance analytics
- **Session Management**: JWT tokens with NextAuth

### External Integrations
- **Klaviyo API**: OAuth 2.0 + API Key fallback
- **Shopify API**: Store and collection syncing
- **OpenAI API**: AI chat assistant (Wizel)

### Infrastructure
- **Hosting**: Vercel (likely)
- **Database Hosting**: MongoDB Atlas + ClickHouse Cloud
- **Environment**: Node.js 18+

---

## Architecture Overview

### Multi-Tenant Architecture

```
User Account
  ├── Multiple Stores (public_id)
  │   ├── Store Settings
  │   ├── Klaviyo Integration (klaviyo_integration.public_id)
  │   │   ├── OAuth Token (preferred)
  │   │   └── API Key (fallback)
  │   └── Shopify Integration (optional)
  │
  └── Permissions
      ├── Store Access (store_ids array)
      ├── Role-based Access
      └── Superuser Flag
```

### Database Architecture

#### MongoDB Collections
- **users**: User accounts, permissions, roles
- **stores**: Store configurations, integrations
- **campaignMessages**: Full campaign message data
- **campaignstats**: Campaign performance metrics
- **flowstats**: Flow performance metrics
- **segmentsstats**: Segment metrics
- **formstats**: Form submission metrics
- **orders**: Transaction data

#### ClickHouse Tables (High-Performance Analytics)
- **campaign_statistics**: Aggregated campaign metrics
- **flow_statistics**: Flow performance data
- **klaviyo_orders**: Order transactions
- **account_metrics_daily**: Daily aggregated account metrics
- **segments_statistics**: Segment performance
- **form_statistics**: Form submissions
- **email_statistics**: Email engagement

### Critical ID Mapping System

**Two-Tier ID System:**

1. **Store ID (`store.public_id`)**:
   - Internal identifier for stores (e.g., "XAeU8VL")
   - Used in UI, localStorage, user permissions
   - One-to-many relationship with Klaviyo accounts

2. **Klaviyo ID (`store.klaviyo_integration.public_id`)**:
   - Klaviyo account identifier (e.g., "XqkVGb")
   - Used in ALL ClickHouse queries
   - Used in MongoDB analytics collections
   - Multiple stores can share same Klaviyo ID

**Critical Flow:**
```javascript
// UI/localStorage stores: store_public_ids ["XAeU8VL", "7MP60fH"]
//           ↓
// API receives: store_public_ids
//           ↓
// API converts: store_public_ids → klaviyo_public_ids
//           ↓
// ClickHouse query: klaviyo_public_ids ["XqkVGb", "Pe5Xw6"]
```

---

## Key Features & Modules

### 1. Dashboard (`/dashboard`)
- Multi-store overview metrics
- Recent campaigns list
- Upcoming campaigns preview
- Revenue trends and key KPIs
- Quick actions and navigation

**Components:**
- `SimpleDashboard.jsx`: Main dashboard view
- `RecentCampaigns.jsx`: Recent campaign list
- `UpcomingCampaigns.jsx`: Scheduled campaigns
- `store-selector-enhanced.jsx`: Store selection dropdown

### 2. Campaign Calendar (`/calendar`)
- Monthly/weekly calendar view of campaigns
- Past and scheduled campaigns
- Campaign statistics inline
- Filtering by store, type, status
- Campaign details modal

**Key Files:**
- `page.jsx`: Main calendar page
- `CalendarHeader.jsx`: Navigation and filters
- `CalendarTileContent.jsx`: Individual day rendering
- `CampaignStats.jsx`: Inline metrics display
- `ScheduledCampaignModal.jsx`: Campaign details overlay

**Data Sources:**
- **Past Campaigns**: MongoDB `campaignMessages` + `campaignstats`
- **Scheduled Campaigns**: Klaviyo API `/api/campaigns?filter=equals(status,'scheduled')`
- **Metrics**: MongoDB `campaignstats` (NOT ClickHouse for campaign lists)

### 3. Multi-Account Reporting (`/multi-account-reporting`)
- Cross-account performance comparison
- Campaign, flow, revenue, deliverability analytics
- Tabbed interface for different report types
- Advanced filtering and date range selection
- Export capabilities

**Components:**
- `CampaignsTab.jsx`: Campaign performance across accounts
- `FlowsTab.jsx`: Flow analytics
- `RevenueTab.jsx`: Revenue tracking and attribution
- `DeliverabilityTab.jsx`: Email deliverability metrics

**Data Sources:**
- ClickHouse for aggregated analytics
- MongoDB for detailed campaign data
- Real-time Klaviyo API for current metrics

### 4. Store Management (`/store/[storePublicId]`)
- Individual store dashboard
- Shopify collections sync
- Store settings and configuration
- Integration management

### 5. Wizel AI Chat Assistant
- Contextual chat interface
- Page-aware insights and recommendations
- Campaign analysis and suggestions
- Natural language querying of data

**Implementation:**
- `ai-context.js`: Context provider
- Components set `WIZEL_AI` state with page data
- OpenAI API integration for responses

---

## Authentication & Authorization

### Authentication Flow

1. **OAuth-First Approach** (Preferred)
   ```javascript
   store.klaviyo_integration = {
     oauth_token: "Bearer_xxx",
     refresh_token: "Refresh_xxx",
     token_expires_at: Date
   }
   ```

2. **API Key Fallback** (Legacy)
   ```javascript
   store.klaviyo_integration = {
     apiKey: "pk_xxxxx"
   }
   ```

3. **Automatic Token Refresh**
   - Tokens refreshed 5 minutes before expiration
   - Failed requests trigger automatic refresh + retry
   - Handled by `klaviyo-auth-helper.js`

### Authorization Levels

1. **Regular User**
   - Access to assigned stores (`user.store_ids`)
   - Role-based permissions within stores
   - Cannot access other users' stores

2. **Superuser** (`user.is_super_user = true`)
   - Full access to all stores
   - User management capabilities
   - System configuration access
   - Impersonation abilities

### Key Files
- `/lib/klaviyo-auth-helper.js`: OAuth-first authentication
- `/lib/klaviyo-api.js`: Centralized Klaviyo API calls
- `/lib/auth.js`: NextAuth configuration
- `/api/superuser/*`: Superuser-only endpoints

---

## API Structure

### API Route Organization

```
/api
  /auth
    /signup
    /[...nextauth]
  /analytics
    /campaigns
    /campaigns-clickhouse
    /revenue-report-clickhouse
    /revenue-report-clickhouse-optimized
  /calendar
    /campaigns
  /campaigns
    /recent
    /upcoming
  /dashboard
    /route.js
    /multi-account-revenue
    /recent-campaigns
    /revenue-complete
  /klaviyo
    /campaign-message/[messageId]
    /campaign-recipient-estimation
    /campaign/[campaignId]
  /multi-account-reporting
    /campaigns
    /flows
    /revenue
    /deliverability
  /store
    /[storePublicId]
      /collections
      /klaviyo-connect
      /sync-shopify-collections
  /superuser
    /users
    /impersonate
```

### API Patterns

#### Standard API Route Structure
```javascript
export async function GET(request) {
  // 1. Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Database connection
  await connectToDatabase();

  // 3. User lookup and permissions
  const user = await User.findOne({ email: session.user.email });

  // 4. Store access validation
  const store = await Store.findOne({
    public_id: storeId,
    _id: { $in: user.store_ids }
  });

  // 5. Data fetching (MongoDB + ClickHouse)
  // 6. Response formatting
  return NextResponse.json({ data });
}
```

#### ClickHouse Query Pattern
```javascript
// CRITICAL: Always convert store_public_ids to klaviyo_public_ids
const storePublicIds = searchParams.get('accountIds')?.split(',') || [];

const stores = await Store.find({
  public_id: { $in: storePublicIds }
});

const klaviyoIds = stores
  .map(store => store.klaviyo_integration?.public_id)
  .filter(Boolean);

// Now query ClickHouse with klaviyo_public_ids
const query = `
  SELECT * FROM campaign_statistics
  WHERE klaviyo_public_id IN (${klaviyoIds.map(id => `'${id}'`).join(',')})
  AND date >= '${startDate}'
  AND date <= '${endDate}'
`;
```

---

## Frontend Architecture

### Component Organization

```
/app
  /components
    /ui                      # shadcn/ui components
      /button.jsx
      /card.jsx
      /skeleton.jsx
      /loading.jsx           # MorphingLoader component
      /date-range-selector.jsx
      /multi-select.jsx
    /campaigns
      /CampaignDetailsModal.jsx
      /CampaignROIDashboard.jsx
      /AccountPerformanceChart.jsx
    /dashboard
      /store-selector-enhanced.jsx
  /contexts
    /ai-context.jsx          # AI assistant context
  /hooks
    /useCampaignData.js
    /useDashboardData.js
  /(dashboard)               # Dashboard routes
    /dashboard
    /calendar
    /multi-account-reporting
    /store/[storePublicId]
```

### Design System

**Color Palette:**
- **Sky Blue (#60A5FA)**: Primary brand color
- **Royal Blue (#2563EB)**: Strong CTAs
- **Vivid Violet (#8B5CF6)**: Secondary accents
- **Deep Purple (#7C3AED)**: Gradients

**Typography:**
- Font: Roboto
- Light mode text: `text-gray-900` (NEVER gray-600 or lighter)
- Dark mode text: `text-gray-100`

**Component Patterns:**
- Always use Lucide React icons (NEVER emojis)
- Gradients for primary CTAs: `bg-gradient-to-r from-sky-blue to-vivid-violet`
- MorphingLoader for all loading states
- Skeletons for content placeholders

### Data Fetching Patterns

```javascript
// Client-side data fetching
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/endpoint?param=value');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependencies]);

// Show loading state
if (loading) {
  return <MorphingLoader size="large" showText={true} text="Loading..." />;
}
```

### localStorage Usage

**Critical Rules:**
1. ALWAYS store `store_public_ids` (NOT `klaviyo_public_ids`)
2. Format: `[{ value: 'store_public_id', label: 'Store Name' }]`

**Common Keys:**
- `analyticsSelectedAccounts`: Multi-select account filter
- `selectedStoreId`: Current store context
- `recentStoreIds`: Recently accessed stores

---

## Key Workflows

### Campaign Creation & Scheduling
1. User creates campaign in Klaviyo (external)
2. Webhook/sync updates MongoDB `campaignMessages`
3. Calendar displays scheduled campaigns
4. Campaign sends → stats collected in `campaignstats`
5. Data synced to ClickHouse for analytics

### Multi-Account Reporting
1. User selects stores via multi-select
2. Store IDs saved to localStorage
3. API receives `accountIds` (store_public_ids)
4. API converts to `klaviyoIds` (klaviyo_public_ids)
5. ClickHouse query with `klaviyoIds`
6. Results aggregated and returned
7. Frontend displays charts and tables

### Store Onboarding
1. User creates account → User document
2. User creates Store → Store document with unique `public_id`
3. User connects Klaviyo → OAuth flow or API key
4. System validates credentials
5. Initial data sync (campaigns, flows, orders)
6. Store appears in user's store list

### AI Assistant Context
1. User navigates to analytics page
2. Component sets `WIZEL_AI` state with page data
3. User asks question in chat
4. Context sent to OpenAI API
5. Response generated with awareness of visible data
6. User can drill down or take actions

---

## Data Models

### User Model (MongoDB)
```javascript
{
  email: String,
  name: String,
  store_ids: [ObjectId],      // References to Store documents
  is_super_user: Boolean,
  created_at: Date,
  last_login: Date
}
```

### Store Model (MongoDB)
```javascript
{
  public_id: String,          // "XAeU8VL" - Internal ID
  name: String,
  klaviyo_integration: {
    public_id: String,        // "XqkVGb" - Klaviyo account ID
    oauth_token: String,
    refresh_token: String,
    token_expires_at: Date,
    apiKey: String            // Fallback
  },
  shopify_integration: {
    shop_domain: String,
    access_token: String
  },
  is_deleted: Boolean,
  created_at: Date
}
```

### CampaignStat Model (MongoDB)
```javascript
{
  campaign_id: String,
  klaviyo_public_id: String,  // *** Uses Klaviyo ID ***
  store_public_ids: [String], // For multi-store mapping
  campaign_name: String,
  subject_line: String,
  send_time: Date,
  status: String,
  statistics: {
    recipients: Number,
    opensUnique: Number,
    clicksUnique: Number,
    conversions: Number,
    revenue: Number
  }
}
```

### ClickHouse Schema (campaign_statistics)
```sql
CREATE TABLE campaign_statistics (
  klaviyo_public_id String,  -- *** Always klaviyo_public_id ***
  campaign_id String,
  campaign_name String,
  date Date,
  recipients UInt32,
  opens_unique UInt32,
  clicks_unique UInt32,
  conversions UInt32,
  revenue Decimal(18,2)
) ENGINE = MergeTree()
ORDER BY (klaviyo_public_id, date, campaign_id);
```

---

## Performance Optimizations

### Caching Strategy
- **Dashboard Cache**: 5-minute TTL for dashboard metrics
- **Campaign Cache**: Cached per date range in MongoDB
- **localStorage**: Selected stores and filters cached client-side

### ClickHouse Optimization
- Pre-aggregated daily metrics
- Efficient date range filtering
- Proper indexing on `klaviyo_public_id` + `date`

### Frontend Optimization
- Code splitting with Next.js dynamic imports
- Lazy loading of charts and heavy components
- Debounced search and filter inputs
- Memoized expensive calculations

---

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://...
CLICKHOUSE_HOST=https://...
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=xxx
CLICKHOUSE_DATABASE=default

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Klaviyo
KLAVIYO_CLIENT_ID=xxx
KLAVIYO_CLIENT_SECRET=xxx
NEXT_PUBLIC_KLAVIYO_REVISION=2025-07-15

# OpenAI (Wizel AI)
OPENAI_API_KEY=sk-xxx

# Shopify
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
```

---

## Development Guidelines

### Code Quality Standards
1. **Always read `/context/design-principles.md`** before UI work
2. **Always read `/context/analytics.md`** for metric calculations
3. Use centralized formatting from `/lib/utils.js`
4. Follow OAuth-first authentication patterns
5. Never use gray text in light mode (`text-gray-900` minimum)

### Testing Checklist
- [ ] Authentication works for both OAuth and API key
- [ ] Store ID conversion (store_id → klaviyo_id) is correct
- [ ] localStorage stores `store_public_ids` (not klaviyo_ids)
- [ ] Loading states use MorphingLoader
- [ ] Numbers formatted with centralized functions
- [ ] Responsive design on mobile/tablet
- [ ] Dark mode works properly

### Common Pitfalls to Avoid
❌ Using `store_public_id` in ClickHouse queries
❌ Storing `klaviyo_public_ids` in localStorage
❌ Making direct Klaviyo API calls without OAuth helper
❌ Using ClickHouse for campaign lists (use MongoDB)
❌ Low-contrast text colors (`text-gray-600`)
❌ Emojis in UI (use Lucide icons)
❌ Custom number formatting (use `/lib/utils.js`)
❌ Missing loading states

---

## Future Roadmap & Considerations

### Planned Features
- [ ] A/B test analysis and comparison
- [ ] Predictive send-time optimization
- [ ] Advanced segmentation builder
- [ ] Template library and management
- [ ] Mobile app (React Native)
- [ ] Webhook management UI
- [ ] Advanced role-based access control
- [ ] White-label capabilities

### Technical Debt
- [ ] Migrate remaining API key-only endpoints to OAuth-first
- [ ] Consolidate duplicate analytics endpoints
- [ ] Standardize error handling across API routes
- [ ] Add comprehensive API rate limiting
- [ ] Implement comprehensive audit logging
- [ ] Add end-to-end testing suite

### Scalability Considerations
- Multi-region ClickHouse deployment
- Redis caching layer for hot data
- Background job queue for heavy processing
- GraphQL layer for complex queries
- Microservices architecture for specific modules

---

## Support & Documentation

### Key Documentation Files
- `/context/design-principles.md`: UI/UX design system
- `/context/analytics.md`: Metric definitions and calculations
- `/context/CLICKHOUSE_TABLES_COMPLETE_V2.md`: ClickHouse schema
- `/context/CALENDAR.md`: Calendar implementation details
- `/CLAUDE.md`: AI assistant instructions

### Getting Help
- Check existing documentation first
- Review similar components for patterns
- Test with both OAuth and API key auth
- Verify ID mapping (store_id vs klaviyo_id)
- Check browser console for frontend errors
- Review API logs for backend issues

---

## Conclusion

Wizel is a sophisticated multi-account Klaviyo reporting platform with complex data architecture, robust authentication, and a modern tech stack. The key to working with this codebase is understanding:

1. **The dual-ID system**: store_public_id (UI) vs klaviyo_public_id (data)
2. **OAuth-first authentication** with automatic fallback
3. **MongoDB + ClickHouse** hybrid architecture
4. **Design system consistency** across all components
5. **AI context awareness** for intelligent assistance

By following the established patterns and guidelines, developers can maintain consistency and reliability while building new features and improving existing functionality.
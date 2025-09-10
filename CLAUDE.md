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

## Design Principles Priority
When in doubt about any UI decision:
1. First check `/context/design-principles.md`
2. Then check existing components for patterns
3. Finally, ask for clarification if needed

Remember: Consistency is more important than perfection. Follow the established design system!
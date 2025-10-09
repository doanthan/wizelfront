# Design Principles - Email Builder Application

## Core Philosophy

This email builder application follows a **professional, intuitive, and efficient** design philosophy. We prioritize speed of use, clarity of interface, and powerful functionality wrapped in an approachable UI.

## Application UI Design System

### Color Palette

#### Primary Brand Colors
```scss
// Application brand colors
$sky-blue: #60A5FA;       // Main brand color - buttons, links, highlights
$royal-blue: #2563EB;     // Stronger CTAs, active states, hover
$vivid-violet: #8B5CF6;   // Secondary CTA, key accents
$deep-purple: #7C3AED;    // Brand highlights, gradients

// Supporting Colors
$lilac-mist: #C4B5FD;     // Hover states, light backgrounds
$sky-tint: #E0F2FE;       // Subtle accents, backgrounds
$neutral-gray: #475569;   // Borders, secondary text
$slate-gray: #1e293b;     // Primary text, headings

// Data Visualization & States
$success: #34D399;  // Emerald-400
$warning: #FBBF24;  // Amber-400  
$danger: #F87171;   // Red-400
$info: #60A5FA;     // Sky-500 (your brand)

// Background & Surface Colors
$pure-white: #FFFFFF;     // Main backgrounds
$cool-gray: #F1F5F9;      // Cards, panels, neutral zones
```

### Gradient System

```scss
// Primary Gradients - For buttons and key CTAs
$gradient-primary: linear-gradient(135deg, #60A5FA 0%, #8B5CF6 100%);     // Sky blue to vivid violet
$gradient-primary-hover: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); // Royal blue to deep purple

// Subtle Gradients - For headers and backgrounds
$gradient-header: linear-gradient(90deg, #E0F2FE 0%, #C4B5FD 100%);       // Sky tint to lilac mist
$gradient-header-dark: linear-gradient(90deg, #1f2937 0%, #1f2937 100%);  // Consistent dark mode

// Special Purpose Gradients
$gradient-today: linear-gradient(135deg, #E0F2FE 0%, #C4B5FD 100%);       // Calendar today highlight
$gradient-today-dark: linear-gradient(135deg, #1E3A8A 0%, #4C1D95 100%);  // Dark mode today

// Success/Warning/Danger Gradients
$gradient-success: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
$gradient-warning: linear-gradient(135deg, #F59E0B 0%, #DC2626 100%);
$gradient-danger: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
```

### Gradient Usage Guidelines

#### Primary Action Buttons
```css
/* Standard primary button with gradient */
.btn-primary {
  background: linear-gradient(135deg, #60A5FA 0%, #8B5CF6 100%);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
  box-shadow: 0 10px 25px -5px rgba(96, 165, 250, 0.25);
}
```

#### Header Sections
```css
/* Subtle gradient for header areas */
.header-section {
  background: linear-gradient(90deg, #E0F2FE 0%, #C4B5FD 100%);
}

/* Dark mode */
.dark .header-section {
  background: linear-gradient(90deg, #1f2937 0%, #374151 100%);
}
```

#### Special Elements
```css
/* Calendar today indicator */
.calendar-today {
  background: linear-gradient(135deg, #E0F2FE 0%, #C4B5FD 100%);
  border: 2px solid #60A5FA;
}
```

### When to Use Gradients
1. **Primary CTAs**: New Campaign, Create, Save buttons
2. **Header Sections**: Page headers, navigation bars
3. **Special States**: Today's date, active selections
4. **Feature Highlights**: Premium features, new features
5. **Empty States**: Placeholder backgrounds

### When NOT to Use Gradients
1. **Body Text**: Never on readable content
2. **Form Inputs**: Keep inputs clean and simple
3. **Data Tables**: Maintain readability
4. **Small UI Elements**: Icons, badges (unless specifically designed)
```

### Typography System

```scss
// Font families
$font-sans: 'Inter', system-ui, -apple-system, sans-serif;
$font-mono: 'JetBrains Mono', 'SF Mono', monospace;

// Font sizes
$text-xs: 0.75rem;     // 12px - metadata, labels
$text-sm: 0.875rem;    // 14px - secondary text
$text-base: 1rem;      // 16px - body text
$text-lg: 1.125rem;    // 18px - large body
$text-xl: 1.25rem;     // 20px - section headers
$text-2xl: 1.5rem;     // 24px - page titles
$text-3xl: 1.875rem;   // 30px - main headers

// Font weights
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;

// Line heights
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.625;
```

### Spacing System

```scss
// Base unit: 4px grid
$spacing-unit: 4px;

// Spacing scale
$space-0: 0;
$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
$space-10: 40px;
$space-12: 48px;
$space-16: 64px;
$space-20: 80px;
```

## Interface Layout Principles

### Three-Panel Architecture
- **Left Panel (280px)**: Component library, always visible
- **Center Canvas (flexible)**: Main editing area, min-width 600px
- **Right Panel (320px)**: Properties panel, collapsible

### Panel Behavior
- **Responsive Collapsing**: Right panel auto-collapses under 1280px viewport
- **Persistent State**: Panel positions saved in localStorage
- **Smooth Transitions**: 300ms slide animations for panel show/hide
- **Focus Management**: Keyboard shortcuts to jump between panels (Cmd+1, Cmd+2, Cmd+3)

### Navigation Hierarchy
```
Top Bar (60px)
├── Logo & Brand (left)
├── Document Title (center)
└── User Actions (right)
    ├── Save Status
    ├── Preview
    ├── Share
    └── User Menu

Left Sidebar
├── Quick Add (primary action)
├── Components
│   ├── Basic
│   ├── Layout
│   └── Advanced
├── Templates
└── Universal Blocks

Right Panel
├── Component Properties
├── Styling Options
└── Advanced Settings
```

## Component Library Design

### Component Card Design
```scss
.component-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid $gray-200;
  transition: all 200ms ease-out;
  
  &:hover {
    border-color: $sky-blue;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  &.is-dragging {
    opacity: 0.5;
    cursor: grabbing;
  }
}
```

### Quick Add Modal
- **Grid Layout**: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Visual Previews**: 16:9 aspect ratio thumbnails
- **Category Tabs**: Horizontal scrollable tabs
- **Instant Search**: Filter templates as you type
- **Hover Preview**: Larger preview on hover with details

## Layout & Spacing Principles

### Page Headers
**Dashboard pages should use compact headers to maximize content space and maintain visual consistency with the application sidebar.**

#### Compact Dashboard Header Style
```scss
// Dashboard & Admin Page Headers
.dashboard-header {
  padding: 1.5rem 2rem 1rem; // Reduced top/bottom padding (24px top, 16px bottom)

  // Title styling
  .page-title {
    font-size: 1.875rem;      // 30px - Large but not oversized
    font-weight: 700;          // Bold
    line-height: 1.2;          // Tight line height
    margin-bottom: 0.25rem;    // Minimal space below title
  }

  // Subtitle/description
  .page-description {
    font-size: 0.875rem;       // 14px - Compact
    color: $neutral-gray;
    margin: 0;                 // No extra margin
  }

  // Header actions (buttons, selectors) aligned to the right
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
}
```

#### Implementation Pattern
```jsx
// Standard compact header for dashboard pages
<div className="flex-1 space-y-4 p-8 pt-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-sm text-muted-foreground">Cross-account analytics</p>
    </div>
    <div className="flex items-center gap-4">
      {/* Action buttons, selectors, etc. */}
    </div>
  </div>
  {/* Page content */}
</div>
```

**Key Principles:**
- **Vertical Economy**: Use `pt-6` (1.5rem) top padding instead of larger values
- **Tight Spacing**: Minimal gap between title and description
- **Aligned Actions**: Keep controls at the same height as the title
- **Consistent Height**: Match the visual height of the Wizel sidebar header
- **Apply To**: All pages in `/(dashboard)` folder, `/superuser` routes, and admin panels

## Canvas Design Principles

### Visual Feedback
- **Drop Zones**: Sky blue dashed borders with 40% opacity background
- **Hover States**: Sky blue outline on hoverable elements
- **Selection State**: 2px solid sky blue border with resize handles
- **Drag Ghost**: Semi-transparent copy follows cursor
- **Invalid Drop**: Red border with shake animation

### Empty States
```
┌─────────────────────────────────┐
│                                 │
│        [Icon: Layout]           │
│                                 │
│    Start building your email    │
│                                 │
│  Drag components from the left  │
│   or use Quick Add templates    │
│                                 │
│     [Button: Quick Add]         │
│                                 │
└─────────────────────────────────┘
```

## Interactive Elements

### Button Hierarchy
```scss
// Primary CTA - Most important actions
.btn-primary {
  background: $sky-blue;
  color: white;
  padding: 10px 20px;
  font-weight: 600;
  
  &:hover {
    background: $royal-blue;
  }
}

// Secondary - Supporting actions
.btn-secondary {
  background: $vivid-violet;
  color: white;
  border: none;
  
  &:hover {
    background: $deep-purple;
  }
}

// Ghost - Tertiary actions
.btn-ghost {
  background: transparent;
  color: $slate-gray;
  
  &:hover {
    background: $sky-tint;
  }
}

// Danger - Destructive actions
.btn-danger {
  background: $danger;
  color: white;
  
  &:hover {
    background: darken($danger, 10%);
  }
}
```

### Card Layouts

#### Modern Dashboard Card Design
**IMPORTANT: Use the dashboard card style for consistency across all metric cards**

```scss
// Dashboard Metric Cards Pattern (matches /dashboard)
.metric-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 16px 8px;  // pb-2 equivalent
    space-y: 0;

    .card-title {
      font-size: 14px;        // text-sm
      font-weight: 500;       // font-medium
      color: #111827;         // text-gray-900 dark:text-gray-100
      .dark & {
        color: #F3F4F6;       // gray-100
      }
    }

    .card-icon {
      width: 16px;           // h-4 w-4
      height: 16px;
      color: #6B7280;        // text-gray-600 dark:text-gray-400
      .dark & {
        color: #9CA3AF;      // gray-400
      }
    }
  }

  .card-content {
    padding: 0 16px 16px;    // No top padding

    .metric-value {
      font-size: 24px;        // text-2xl
      font-weight: 700;       // font-bold
      color: #111827;         // text-gray-900 dark:text-gray-100
      line-height: 1.2;
      .dark & {
        color: #F3F4F6;       // gray-100
      }
    }

    .metric-description {
      font-size: 12px;        // text-xs
      color: #6B7280;         // text-gray-600 dark:text-gray-400
      margin-top: 4px;
      .dark & {
        color: #9CA3AF;       // gray-400
      }
    }
  }
}

// Dark mode adjustments
.dark .metric-card {
  background: #111827;      // gray-900
  border-color: #374151;    // gray-700
}
```

#### ❌ AVOID: Old Border-Left Card Style
```scss
// DON'T USE: This creates visual inconsistency
.card-old-style {
  border-left: 4px solid #color;  // Creates inconsistent spacing
  .card-content {
    padding: 16px;                 // Single padding value looks cramped
  }
}
```

#### ✅ USE: Dashboard Card Structure
```jsx
// Correct implementation matching dashboard
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
      Metric Name
    </CardTitle>
    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {formatValue(value)}
    </div>
    <p className="text-xs text-gray-600 dark:text-gray-400">
      descriptive text
    </p>
  </CardContent>
</Card>
```

#### Card Component Guidelines
```scss
// CRITICAL: Prevent content overflow in cards
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;  // Always include gap to prevent badges from touching content

  .card-content-area {
    flex: 1;
    min-width: 0;  // Critical for text truncation

    .card-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .card-badge {
    flex-shrink: 0;  // Prevent badge from shrinking
  }
}

// Store Cards Pattern
.store-card {
  padding: 24px;

  .header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 16px;

    .store-info {
      flex: 1;
      min-width: 0;  // Enable truncation
      display: flex;
      gap: 12px;

      .icon-container {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
      }

      .text-content {
        flex: 1;
        min-width: 0;

        h3, p {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .status-badge {
      flex-shrink: 0;  // Never shrink badges
    }
  }
}
```

### Form Controls

#### Input Field Specifications
```scss
// CRITICAL: Text must be clearly visible
.input-field {
  height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #E5E7EB;  // gray-200
  
  // Typography - MUST have strong contrast
  font-size: 14px;
  font-weight: 400;
  color: #111827;              // gray-900 - NEVER lighter than this
  
  // Background
  background: #FFFFFF;
  
  // Placeholder - visible but secondary
  &::placeholder {
    color: #9CA3AF;           // gray-500 - minimum for AA compliance
    font-weight: 400;
  }
  
  // Focus state
  &:focus {
    border-color: #60A5FA;    // sky-blue
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    outline: none;
  }
  
  // Error state
  &.error {
    border-color: #EF4444;    // red-500
    background: #FEF2F2;      // red-50
  }
  
  // Disabled state
  &:disabled {
    background: #F9FAFB;      // gray-50
    color: #9CA3AF;           // gray-500
    cursor: not-allowed;
    opacity: 0.7;
  }
}

// Dark mode adjustments
.dark .input-field {
  background: #030712;        // gray-950
  border-color: #374151;      // gray-700
  color: #FFFFFF;             // white - MUST be pure white for contrast
  
  &::placeholder {
    color: #6B7280;           // gray-500
  }
  
  &:focus {
    border-color: #60A5FA;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }
  
  &.error {
    border-color: #EF4444;
    background: #1F0808;
  }
  
  &:disabled {
    background: #111827;      // gray-900
    border-color: #1F2937;    // gray-800
    color: #6B7280;
  }
}
```

#### Labels and Help Text
```scss
.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #111827;             // gray-900
  margin-bottom: 4px;
  
  // Required indicator
  .required {
    color: #EF4444;           // red-500
    margin-left: 4px;
  }
}

.help-text {
  font-size: 12px;
  color: #6B7280;             // gray-500
  margin-top: 4px;
}

.error-message {
  font-size: 12px;
  color: #DC2626;             // red-600
  margin-top: 4px;
}

// Dark mode
.dark {
  .form-label {
    color: #F3F4F6;           // gray-100
  }
  
  .help-text {
    color: #9CA3AF;           // gray-400
  }
  
  .error-message {
    color: #F87171;           // red-400
  }
}
```

#### Text Contrast Requirements
- **Input text**: Minimum 7:1 contrast ratio with background
- **Placeholder text**: Minimum 4.5:1 contrast ratio
- **Label text**: Minimum 4.5:1 contrast ratio
- **Error messages**: Minimum 4.5:1 contrast ratio
- **Never use**: Colors lighter than gray-900 (#111827) for input text in light mode
- **Never use**: Colors darker than pure white (#FFFFFF) for input text in dark mode

## Iconography

### Icon System Standards
- **Primary Library**: **Lucide React** - MUST be used for all UI icons (consistent 24x24 grid)
- **Installation**: `npm install lucide-react`
- **Import Pattern**: `import { IconName } from 'lucide-react'`
- **Stroke Width**: 1.5px for regular icons, 2px for emphasis/headers
- **Colors**: Semantic coloring based on context
- **Interactive Icons**: Scale 1.1x on hover with 200ms transition
- **Size Standards**: `h-4 w-4` (16px) for inline, `h-5 w-5` (20px) for headers, `h-6 w-6` (24px) for prominent actions

### Semantic Color Mapping
```jsx
// Communication channels
<Mail className="h-4 w-4 text-blue-600" />        // Email
<MessageSquare className="h-4 w-4 text-green-600" /> // SMS
<Bell className="h-4 w-4 text-purple-600" />      // Notifications

// User metrics
<Users className="h-4 w-4 text-blue-600" />       // Recipients
<Eye className="h-4 w-4 text-green-600" />        // Open rates
<MousePointer className="h-4 w-4 text-yellow-600" /> // Click rates
<ShoppingCart className="h-4 w-4 text-purple-600" /> // Conversions
<DollarSign className="h-5 w-5 text-green-600" />  // Revenue

// Actions
<Plus className="h-4 w-4" />                       // Add/Create
<Filter className="h-4 w-4" />                     // Filter
<Search className="h-4 w-4" />                     // Search
```

### Icon Usage Rules
1. **Never use emojis** in professional UI - always use Lucide React icons
2. **Consistent sizing** - use Tailwind classes: h-4 w-4, h-5 w-5, h-6 w-6
3. **Semantic coloring** - match icon colors to their functional meaning
4. **Import optimization** - only import icons you use to reduce bundle size
5. **Accessibility** - icons should have semantic meaning, not just decoration

### Common Icons Reference
```jsx
// Actions
import { Plus, Trash, Copy, Edit, Eye, Download, Filter } from 'lucide-react';

// Navigation  
import { ChevronRight, ChevronDown, Menu, X, ArrowLeft } from 'lucide-react';

// Communication
import { Mail, MessageSquare, Bell, Phone } from 'lucide-react';

// Analytics
import { Users, Eye, MousePointer, ShoppingCart, DollarSign } from 'lucide-react';

// States
import { Check, AlertCircle, XCircle, Info, Loader } from 'lucide-react';
```

### Implementation Pattern
```jsx
// ✅ CORRECT - Professional icon usage
import { Mail, Users } from 'lucide-react';

function CampaignCard({ campaign }) {
  return (
    <div className="flex items-center gap-2">
      <Mail className="h-4 w-4 text-blue-600" />
      <span>{campaign.channel}</span>
      <Users className="h-4 w-4 text-neutral-gray" />
      <span>{campaign.recipients}</span>
    </div>
  );
}

// ❌ WRONG - Don't use emojis
function CampaignCard({ campaign }) {
  return (
    <div>
      <span>📧 {campaign.channel}</span>
      <span>👥 {campaign.recipients}</span>
    </div>
  );
}
```

## Dropdown & Popover Guidelines

### CRITICAL: Always Use Solid Backgrounds

**Never use transparent or semi-transparent backgrounds for dropdowns, popovers, or overlays.** This causes readability issues and unprofessional appearance.

#### Dropdown/Popover Styling Rules

```scss
// ✅ CORRECT - Solid backgrounds with proper contrast
.dropdown-content {
  background: #FFFFFF;  // Pure white in light mode
  border: 1px solid #E5E7EB;  // Gray-200 border
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.dark .dropdown-content {
  background: #1F2937;  // Gray-800 in dark mode
  border: 1px solid #374151;  // Gray-700 border
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

// ❌ WRONG - Transparent backgrounds
.dropdown-content {
  background: rgba(255, 255, 255, 0.8);  // NO! Causes visibility issues
  backdrop-filter: blur(10px);  // Avoid for dropdowns
}
```

#### Text Contrast Rules

```scss
// ✅ CORRECT - High contrast text
.dropdown-item {
  color: #111827;  // Gray-900 for primary text
}

.dropdown-item-secondary {
  color: #6B7280;  // Gray-500 for secondary text
}

.dark .dropdown-item {
  color: #F9FAFB;  // Gray-50 in dark mode
}

// ❌ WRONG - Low contrast text
.dropdown-item {
  color: #9CA3AF;  // text-muted/gray-400 - Too light!
}
```

#### Implementation Examples

```jsx
// ✅ CORRECT - Multi-select with solid backgrounds
<PopoverContent className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
  <div className="space-y-2">
    {options.map(option => (
      <div className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
        <Checkbox />
        <span className="ml-2 text-gray-900 dark:text-gray-100">{option.label}</span>
      </div>
    ))}
  </div>
</PopoverContent>

// ❌ WRONG - Transparent with poor contrast
<PopoverContent className="w-full p-2 bg-white/80 backdrop-blur">
  <div className="text-muted">{/* Poor visibility */}</div>
</PopoverContent>
```

## Motion & Animation

### Timing Functions
```scss
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in: cubic-bezier(0.4, 0, 1, 1);

// Duration scales
$duration-75: 75ms;    // Micro interactions
$duration-150: 150ms;  // Small transitions
$duration-200: 200ms;  // Default transitions
$duration-300: 300ms;  // Panel slides
$duration-500: 500ms;  // Page transitions
```

### Animation Patterns
- **Hover Effects**: Scale, shadow, color change (200ms)
- **Panel Slides**: Transform translateX (300ms ease-in-out)
- **Modal Entry**: Fade + scale from 0.95 to 1 (200ms)
- **Loading States**: Pulse animation for skeletons
- **Drag Feedback**: Immediate response, no delay

## Responsive Design

### Breakpoints
```scss
$mobile: 640px;
$tablet: 768px;
$desktop: 1024px;
$wide: 1280px;
$ultrawide: 1536px;
```

### Mobile Adaptations
- **Single Column**: Stack all panels vertically
- **Bottom Sheet Modals**: Slide up from bottom on mobile
- **Touch Targets**: Minimum 44x44px tap areas
- **Swipe Gestures**: Swipe to delete, drag to reorder
- **Simplified UI**: Hide advanced features on mobile

## Loading & Performance

### Loading States
```html
<!-- Skeleton loader example -->
<div class="skeleton">
  <div class="skeleton-line w-full h-4 mb-2"></div>
  <div class="skeleton-line w-3/4 h-4 mb-2"></div>
  <div class="skeleton-line w-1/2 h-4"></div>
</div>
```

### Performance Metrics
- **Time to Interactive**: < 2 seconds
- **First Contentful Paint**: < 1 second
- **Drag Response Time**: < 100ms
- **Save Operation**: < 500ms
- **Template Load**: < 300ms

## Accessibility Standards

### Keyboard Navigation
- **Tab Order**: Logical left-to-right, top-to-bottom
- **Focus Indicators**: 2px sky blue outline with 2px offset
- **Skip Links**: Hidden skip to main content link
- **Shortcuts**: Document all keyboard shortcuts

### Screen Reader Support
- **ARIA Labels**: All interactive elements labeled
- **Live Regions**: Announce dynamic changes
- **Semantic HTML**: Use proper heading hierarchy
- **Alt Text**: Required for all images

### Color Accessibility
- **Contrast Ratios**: AA standard minimum (4.5:1)
- **Color Independence**: Never use color alone to convey information
- **Focus Visibility**: Clear focus indicators for keyboard users

## 🚨 CRITICAL: Text Contrast Guidelines

### NEVER Use Low-Contrast Text
**IMPORTANT: The following text colors provide insufficient contrast and should NEVER be used for primary content:**

```scss
// ❌ FORBIDDEN - Low contrast colors
.text-muted        // Too light - fails contrast standards
.text-gray-400     // Only for disabled/placeholder text
.text-gray-500     // Only for secondary/meta text
.text-neutral-gray // Acceptable only for secondary text, never primary

// ❌ WRONG - Examples of poor contrast
color: #9CA3AF;    // gray-400 - Too light for body text
color: #6B7280;    // gray-500 - Too light for primary content
color: #8B8B8B;    // Any mid-gray - Insufficient contrast
```

### ✅ REQUIRED: High-Contrast Text Colors
**Use these colors for optimal readability:**

```scss
// ✅ CORRECT - High contrast text colors
.text-gray-900     // Primary text in light mode
.text-gray-100     // Primary text in dark mode
.text-slate-900    // Alternative primary text
.text-black        // Maximum contrast when needed

// Light Mode Text Hierarchy
primary-text: #111827;    // gray-900 - Main content
secondary-text: #374151;  // gray-700 - Supporting content
meta-text: #6B7280;      // gray-500 - Timestamps, labels only

// Dark Mode Text Hierarchy
primary-text: #F9FAFB;    // gray-50 - Main content
secondary-text: #E5E7EB;  // gray-200 - Supporting content
meta-text: #9CA3AF;      // gray-400 - Timestamps, labels only
```

### Text Usage Rules
1. **Primary Content**: Always use `text-gray-900 dark:text-gray-100`
2. **Secondary Content**: Use `text-gray-700 dark:text-gray-200`
3. **Meta Information**: Use `text-gray-600 dark:text-gray-400` (timestamps, labels)
4. **Disabled/Placeholder**: Use `text-gray-500 dark:text-gray-500` only
5. **Never**: Use `text-muted` or any color lighter than gray-600 for readable content

### Contrast Testing
All text must meet these standards:
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text (18px+)**: 3:1 minimum contrast ratio
- **Interactive elements**: 3:1 minimum contrast ratio with background
- **Focus indicators**: 3:1 minimum contrast ratio with background

## Error Handling

### Error State Design
```scss
.error-message {
  color: $danger;
  font-size: $text-sm;
  margin-top: $space-1;
  display: flex;
  align-items: center;
  gap: $space-2;
  
  .icon {
    width: 16px;
    height: 16px;
  }
}
```

### Error Patterns
- **Inline Validation**: Show errors next to fields
- **Toast Notifications**: Temporary alerts for system errors
- **Error Boundaries**: Graceful component failure handling
- **Retry Mechanisms**: Allow users to retry failed operations

## Dark Mode & Light Mode Best Practices

### Core Principles
1. **Consistency First**: Both modes should feel like the same application
2. **Accessibility Always**: Meet WCAG AA standards in both modes
3. **User Control**: Allow manual override of system preferences
4. **Performance**: Theme switching should be instant with no layout shift

### Light Mode Color System
```scss
// Light Mode Palette
$light-bg: #FFFFFF;           // Pure white backgrounds
$light-surface: #F8FAFC;      // Slightly off-white for cards
$light-surface-alt: #F1F5F9;  // Alternative surface (gray-100)
$light-border: #E2E8F0;       // Subtle borders (gray-200)
$light-border-strong: #CBD5E1; // Stronger borders (gray-300)

// Text hierarchy in light mode
$light-text-primary: #0F172A;   // Near black for high contrast (gray-900)
$light-text-secondary: #475569; // Secondary text (gray-600)
$light-text-muted: #64748B;     // Muted/disabled text (gray-500)
$light-text-placeholder: #94A3B8; // Placeholder text (gray-400)

// Interactive states
$light-hover-bg: #F1F5F9;     // Hover backgrounds (gray-100)
$light-active-bg: #E2E8F0;    // Active/pressed states (gray-200)
$light-focus-ring: #60A5FA;   // Sky blue focus rings
```

### Dark Mode Color System
```scss
// Dark Mode Palette
$dark-bg: #0A0A0B;            // Near black background
$dark-surface: #18181B;       // Elevated surfaces (gray-900)
$dark-surface-alt: #27272A;   // Alternative surface (gray-800)
$dark-border: #3F3F46;        // Subtle borders (gray-700)
$dark-border-strong: #52525B; // Stronger borders (gray-600)

// Text hierarchy in dark mode
$dark-text-primary: #FAFAFA;    // Near white for contrast (gray-50)
$dark-text-secondary: #E4E4E7;  // Secondary text (gray-200)
$dark-text-muted: #A1A1AA;      // Muted text (gray-400)
$dark-text-placeholder: #71717A; // Placeholder text (gray-500)

// Interactive states
$dark-hover-bg: #27272A;      // Hover backgrounds (gray-800)
$dark-active-bg: #3F3F46;     // Active states (gray-700)
$dark-focus-ring: #60A5FA;    // Sky blue focus rings (same as light)
```

### Brand Colors Adaptation
```scss
// Brand colors that work in both modes
$universal-sky-blue: #60A5FA;    // Works in both modes
$universal-royal-blue: #2563EB;  // Works in both modes

// Light mode brand usage
$light-primary: #2563EB;         // Royal blue for primary actions
$light-primary-hover: #1D4ED8;   // Darker on hover
$light-accent: #8B5CF6;          // Vivid violet accents

// Dark mode brand adjustments
$dark-primary: #60A5FA;          // Sky blue for better contrast
$dark-primary-hover: #93BBFC;    // Lighter on hover
$dark-accent: #A78BFA;           // Lighter violet for visibility
```

### Contrast Requirements

#### Text Contrast Ratios
```scss
// WCAG AA Compliance (minimum 4.5:1 for normal text, 3:1 for large text)

// Light Mode Contrasts
- Primary text on white: 15.8:1 ✓ (exceeds AAA)
- Secondary text on white: 7.5:1 ✓ (exceeds AA)
- Muted text on white: 4.7:1 ✓ (meets AA)

// Dark Mode Contrasts  
- Primary text on black: 15.3:1 ✓ (exceeds AAA)
- Secondary text on black: 13.1:1 ✓ (exceeds AAA)
- Muted text on black: 6.1:1 ✓ (exceeds AA)

// Interactive Elements (minimum 3:1)
- Buttons: 4.5:1 minimum in both modes
- Links: 4.5:1 minimum in both modes
- Icons: 3:1 minimum for UI icons
```

### Implementation Best Practices

#### 1. CSS Variables Strategy
```css
:root {
  /* Light mode (default) */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --border: #E2E8F0;
  --shadow: rgba(0, 0, 0, 0.1);
}

.dark {
  /* Dark mode overrides */
  --bg-primary: #0A0A0B;
  --bg-secondary: #18181B;
  --text-primary: #FAFAFA;
  --text-secondary: #E4E4E7;
  --border: #3F3F46;
  --shadow: rgba(0, 0, 0, 0.3);
}
```

#### 2. Component Patterns
```jsx
// Good: Semantic color usage
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

// Better: Using Tailwind's built-in dark mode
<div className="bg-background text-foreground">

// Best: Component-level abstraction
<Card variant="surface" tone="primary">
```

#### 3. Image & Media Handling
```scss
// Reduce brightness of images in dark mode
.dark img:not([data-no-dim]) {
  filter: brightness(0.8);
}

// Invert icons that need it
.dark .icon-invert {
  filter: invert(1);
}

// Use different images for each mode when needed
picture {
  source[media="(prefers-color-scheme: dark)"] {
    // Dark mode optimized image
  }
}
```

#### 4. Shadow Adjustments
```scss
// Light mode shadows
.light-shadow {
  box-shadow: 
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

// Dark mode shadows (more subtle)
.dark-shadow {
  box-shadow: 
    0 1px 3px 0 rgba(0, 0, 0, 0.3),
    0 1px 2px 0 rgba(0, 0, 0, 0.2);
}

// Colored shadows for elevation
.elevated-card {
  // Light mode: colored tint
  box-shadow: 0 4px 6px -1px rgba(96, 165, 250, 0.1);
  
  // Dark mode: darker shadow
  .dark & {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  }
}
```

### Transition Between Modes

#### Smooth Theme Switching
```css
/* Apply transitions only to color properties */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Disable transitions during theme switch to prevent flash */
.theme-transitioning * {
  transition: none !important;
}
```

#### JavaScript Implementation
```javascript
// Theme switcher with transition control
function toggleTheme() {
  document.documentElement.classList.add('theme-transitioning');
  
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  
  // Re-enable transitions after theme change
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 0);
}
```

### Special Considerations

#### 1. Charts & Data Visualization
```scss
// Use color schemes that work in both modes
$chart-colors-universal: (
  primary: #60A5FA,   // Sky blue
  success: #34D399,   // Emerald
  warning: #FBBF24,   // Amber
  danger: #F87171,    // Red
  info: #A78BFA,      // Violet
);

// Adjust opacity for backgrounds
.chart-area {
  // Light mode: 20% opacity
  fill: rgba(96, 165, 250, 0.2);
  
  // Dark mode: 30% opacity for better visibility
  .dark & {
    fill: rgba(96, 165, 250, 0.3);
  }
}
```

#### 2. Form Controls
```scss
// Input fields
.form-input {
  // Light mode
  background: white;
  border: 1px solid #E2E8F0;
  color: #0F172A;
  
  &::placeholder {
    color: #94A3B8;
  }
  
  // Dark mode
  .dark & {
    background: #18181B;
    border-color: #3F3F46;
    color: #FAFAFA;
    
    &::placeholder {
      color: #71717A;
    }
  }
}
```

#### 3. Status Indicators
```scss
// Ensure status colors work in both modes
.status {
  &.success {
    // Light: darker green on light bg
    color: #059669;
    background: #D1FAE5;
    
    // Dark: lighter green on dark bg
    .dark & {
      color: #34D399;
      background: rgba(52, 211, 153, 0.1);
    }
  }
  
  &.error {
    // Light: darker red on light bg
    color: #DC2626;
    background: #FEE2E2;
    
    // Dark: lighter red on dark bg
    .dark & {
      color: #F87171;
      background: rgba(248, 113, 113, 0.1);
    }
  }
}
```

### Testing Checklist

#### Functionality Tests
- [ ] Theme persists across page refreshes
- [ ] Theme toggle works without JavaScript errors
- [ ] System preference detection works correctly
- [ ] No flash of incorrect theme on page load
- [ ] All interactive elements remain visible and functional

#### Visual Tests
- [ ] Text is readable in both modes (check contrast)
- [ ] Focus indicators are visible in both modes
- [ ] Hover states are distinguishable
- [ ] Disabled states are clear but not invisible
- [ ] Charts and graphs are legible
- [ ] Images don't appear washed out or too bright

#### Accessibility Tests
- [ ] Screen reader announces theme changes
- [ ] Keyboard navigation works identically in both modes
- [ ] Color is not the only indicator of state
- [ ] All text meets WCAG contrast requirements
- [ ] Focus indicators meet 3:1 contrast ratio

#### Performance Tests
- [ ] Theme switching completes in < 100ms
- [ ] No layout shift during theme change
- [ ] CSS file size is optimized (< 50KB gzipped for theme styles)
- [ ] Theme preference loads before first paint

### Common Pitfalls to Avoid

1. **Don't use pure black (#000000)** in dark mode - use #0A0A0B or #0F0F10
2. **Don't use pure white (#FFFFFF)** text in dark mode - use #FAFAFA or #F9FAFB
3. **Don't forget hover/focus states** - they need different colors in each mode
4. **Don't use the same shadows** - dark mode needs subtler shadows
5. **Don't neglect disabled states** - they should be visible but clearly inactive
6. **Don't hardcode colors** - always use CSS variables or utility classes
7. **Don't forget about print styles** - always use light mode for printing
8. **Don't ignore OS preferences** - respect prefers-color-scheme by default
9. **Don't make dramatic color changes** - maintain brand consistency
10. **Don't sacrifice usability for aesthetics** - contrast is more important than looking cool

## Design Tokens

### Component Tokens
```javascript
export const tokens = {
  // Border radius
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  
  // Z-index scale
  zIndex: {
    dropdown: 1000,
    modal: 2000,
    popover: 3000,
    tooltip: 4000,
    toast: 5000
  }
}
```

## Toast Notifications

### IMPORTANT: Use the Correct Toast Implementation
**Always use the custom toast component from `/app/components/ui/toast.jsx`**
- **DO NOT** use `react-hot-toast` or other external toast libraries
- **DO** use the toast hook: `import { useToast } from "@/app/components/ui/use-toast"`
- **DO** include the Toaster component: `import { Toaster } from "@/app/components/ui/toaster"`
- **DO** follow this pattern:

```jsx
// ✅ CORRECT - Using the custom toast
import { useToast } from "@/app/components/ui/use-toast";

export function MyComponent() {
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Success",
      description: "Your action was completed successfully",
    });
  };
}
```

```jsx
// ❌ WRONG - Don't use react-hot-toast
import { toast } from 'react-hot-toast';
toast.success('Message'); // Don't use this!
```

### Toast Variants
- **Default**: General notifications
- **Destructive**: Error messages
- **Success**: Positive confirmations (use green styling)

## Quality Checklist

### Before Shipping Features
- [ ] Works on all supported browsers (Chrome, Firefox, Safari, Edge)
- [ ] Responsive from 320px to 4K displays
- [ ] Keyboard navigable
- [ ] Screen reader tested
- [ ] Dark mode compatible
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Performance profiled
- [ ] Animations respect prefers-reduced-motion
- [ ] Documentation updated
- [ ] Uses correct toast implementation from `/components/ui/toast`

## Design Don'ts

- **Don't** use more than 3 font sizes in one view
- **Don't** create custom colors outside the palette
- **Don't** use animations longer than 500ms
- **Don't** hide important actions in menus
- **Don't** use light gray text on white backgrounds
- **Don't** make clickable areas smaller than 32x32px
- **Don't** use tooltips on mobile
- **Don't** autoplay videos or animations
- **Don't** use system fonts for branding
- **Don't** break established patterns without strong justification

## Conclusion

These principles ensure our email builder application provides a professional, efficient, and delightful user experience. The interface should feel fast, responsive, and intuitive while handling complex email creation tasks with ease.
# AI Assistant Instructions

## Project Overview
This is a modern web application built with Next.js, React, and Tailwind CSS. The project follows a specific design system and coding standards that must be maintained.

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

## Code Quality Standards

### Before Making Changes
1. **Read relevant documentation** in `/context/` folder
2. **Check existing patterns** in similar components
3. **Maintain consistency** with the established codebase
4. **Test responsiveness** across different screen sizes
5. **Verify dark mode** compatibility

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

## Design Principles Priority
When in doubt about any UI decision:
1. First check `/context/design-principles.md`
2. Then check existing components for patterns
3. Finally, ask for clarification if needed

Remember: Consistency is more important than perfection. Follow the established design system!
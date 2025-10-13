# Email Builder - Route-Specific Styling

## Overview

This email builder has its own CSS file that **only applies to this route** and won't affect the rest of the application.

## Files

- **`email-builder.css`** - Route-specific CSS variables and styles
- **`email-builder.module.css`** - CSS modules for component-specific styles
- **`EmailBuilder.jsx`** - Main component that imports the route CSS

## How It Works

1. **CSS Import** - The `email-builder.css` file is imported at the top of `EmailBuilder.jsx`:
   ```javascript
   import "./email-builder.css";
   ```

2. **Scoped Container** - All styles are scoped within `.email-builder-container`:
   ```jsx
   <div className="email-builder-container">
     {/* Email builder content */}
   </div>
   ```

3. **CSS Variables** - Custom CSS variables for the email builder:
   - Brand colors (sky-blue, royal-blue, vivid-violet, etc.)
   - Typography scale
   - Spacing system
   - Shadows and animations
   - Theme tokens (light/dark mode)

## Customization

To customize the email builder styles, edit `/app/store/[storePublicId]/email-builder/email-builder.css`.

### Example: Changing Button Styles

```css
.email-builder-container .btn-primary {
  background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 8px 20px -8px rgba(96, 165, 250, 0.35);
}

.email-builder-container .btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  transform: translateY(-1px);
}
```

### Example: Changing Colors

```css
:root {
  --color-sky-blue: #60a5fa;
  --color-royal-blue: #2563eb;
  --color-vivid-violet: #8b5cf6;
  /* Adjust any color variables here */
}
```

## Benefits

✅ **Isolation** - Styles don't leak to other routes
✅ **Maintainability** - Easy to update email builder styles independently
✅ **Performance** - CSS only loads for this specific route
✅ **Dark Mode** - Built-in dark mode support with CSS variables
✅ **Accessibility** - Includes `prefers-reduced-motion` support

## CSS Class Names

Use these classes within the email-builder-container:

- `.btn` - Base button class
- `.btn-primary` - Primary gradient button
- `.btn-secondary` - Secondary violet button
- `.btn-ghost` - Transparent button
- `.btn-danger` - Red danger button
- `.icon` - Icon sizing

## Dark Mode

Dark mode is automatically applied when the user has dark mode enabled:

```css
.dark {
  --bg-primary: #0a0a0b;
  --text-primary: #f9fafb;
  /* Dark mode overrides */
}
```

## Notes

- This CSS **only** applies to `/store/[storePublicId]/email-builder`
- The rest of your app uses the global Tailwind CSS styles
- Both styling systems can coexist without conflicts

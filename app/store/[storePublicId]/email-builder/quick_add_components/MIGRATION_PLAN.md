# Quick Add Components Migration Plan

## Overview
Currently, all Quick Add components are defined in `/constants.js` as a large array. This migration will move them into the `/quick_add_components/` folder structure for better organization and maintainability.

## Current State

### Components in constants.js (21 total):

#### Headers (2)
- `header-logo-nav` - Logo + Nav Links
- `header-centered` - Centered Logo

#### Content (3)
- `content-image-text` - Image + Text Card
- `content-two-column-article` - Two Column Article
- `content-text-block` - Text Content Block

#### Features/Heroes (3)
- `feature-hero-image` - Hero Feature Card
- `feature-three-column` - Three Feature Grid
- `feature-icon-list` - Feature List

#### CTAs (3)
- `cta-centered-button` - Centered CTA
- `cta-banner` - Promotional Banner
- `cta-two-button` - Two Button CTA

#### Products/Ecommerce (3)
- `ecommerce-product-card` - Product Card
- `ecommerce-three-products` - Product Grid
- `ecommerce-discount-badge` - Sale Announcement

#### Transactional (3)
- `transactional-order-confirm` - Order Confirmation
- `transactional-shipping` - Shipping Update
- `transactional-receipt` - Payment Receipt

#### Footers (3)
- `footer-social-links` - Social Links Footer
- `footer-company-info` - Company Info Footer
- `footer-minimal` - Minimal Footer

#### Social (needs creation)
- To be added

#### Testimonials (needs creation)
- To be added

## Target Structure

```
quick_add_components/
├── headers/
│   ├── logo-nav.js
│   └── centered-logo.js
├── heroes/
│   ├── hero-image.js
│   ├── three-column.js
│   └── icon-list.js
├── content/
│   ├── image-text.js
│   ├── two-column-article.js
│   └── text-block.js
├── cta/
│   ├── centered-button.js
│   ├── banner.js
│   └── two-button.js
├── products/
│   ├── product-card.js
│   ├── three-products.js
│   └── discount-badge.js
├── transactional/ (future use)
│   ├── order-confirm.js
│   ├── shipping.js
│   └── receipt.js
├── footers/
│   ├── social-links.js
│   ├── company-info.js
│   └── minimal.js
├── social/ (to be created)
│   └── (future components)
├── testimonials/ (to be created)
│   └── (future components)
└── index.js (exports all components)
```

## Component File Format

Each component file should export an object with this structure:

```javascript
import styles from '../email-builder.module.css';

export default {
  id: "component-id",
  name: "Component Display Name",
  category: "header", // or hero, content, cta, product, footer, etc.
  description: "Brief description",

  // Preview render function (same as current renderPreview)
  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      {/* Preview JSX */}
    </div>
  ),

  // Function that generates blocks (replaces static blocks array)
  generateBlocks: (brandData = {}) => {
    // Extract brand styles (if needed)
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#000000';
    const fontFamily = brandData.customFontFamily || 'Arial';

    // Return the blocks array
    return [
      {
        type: "section",
        overrides: {
          padding: 24,
          backgroundColor: primaryColor
        },
        children: [
          // ... child blocks
        ]
      }
    ];
  }
};
```

## Migration Steps

### Phase 1: Setup (Completed ✅)
- [x] Create folder structure
- [x] Create README.md
- [x] Create index.js template

### Phase 2: Extract and Convert Components

For each component:
1. Find the component definition in constants.js
2. Extract the `renderPreview` function (keep as-is)
3. Convert the `blocks` array into a `generateBlocks` function
4. Add to the appropriate category folder
5. Export from index.js

### Phase 3: Update System Integration

1. Update `quick_add_components/index.js`:
   - Import all components
   - Export by category
   - Provide helper functions

2. Update `QuickAddModal.jsx`:
   - Import from `quick_add_components/index.js` instead of `constants.js`
   - Pass `brandData` to components when needed
   - Handle the new structure

3. Update `constants.js`:
   - Remove `quickAddCategories` export
   - Keep other constants (library, CANVAS_BLOCK_TYPE, etc.)

4. Update `EmailBuilder.jsx` or parent component:
   - Pass brand data to QuickAddModal
   - Use new component structure

### Phase 4: Testing

1. Test Quick Add modal opens correctly
2. Verify all categories show components
3. Test inserting each component type
4. Verify brand styles are applied (when implemented)
5. Check responsive behavior

## Benefits of This Migration

1. **Better Organization**: Components grouped by type in separate files
2. **Easier Maintenance**: Each component in its own file
3. **Brand Integration Ready**: generateBlocks can accept brand data
4. **Reusability**: Components can be imported individually
5. **Scalability**: Easy to add new components
6. **Type Safety**: Easier to add TypeScript later
7. **Testing**: Individual components can be tested in isolation

## Notes

- The current components have static `blocks` arrays
- The new format uses `generateBlocks(brandData)` functions
- For now, we can keep the blocks static inside generateBlocks
- Later, we can add brand data integration to dynamically style components
- The `renderPreview` functions stay exactly the same (they use CSS classes)

## Status

- [x] Folder structure created
- [x] README.md written
- [x] Migration plan documented
- [ ] Components extracted (0/21)
- [ ] Index.js updated
- [ ] QuickAddModal.jsx updated
- [ ] constants.js cleaned up
- [ ] Testing completed

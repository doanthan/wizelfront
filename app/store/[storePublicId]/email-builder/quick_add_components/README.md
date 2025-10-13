# Quick Add Components

This folder contains all the Quick Add template components for the email builder.

## Purpose

Each file in this folder represents a reusable email template component that:
- Takes brand styles from `brand.json`
- Applies brand colors, fonts, and styling automatically
- Can be inserted into the email builder via the Quick Add modal
- Is customizable after insertion

## File Structure

Components are organized by category:

```
quick_add_components/
├── README.md                    # This file
├── index.js                     # Exports all components
├── headers/
│   ├── logo-nav.js             # Logo + Navigation
│   ├── centered-logo.js        # Centered logo header
│   └── minimal-header.js       # Minimal header
├── heroes/
│   ├── image-text-cta.js       # Hero with image, text, and CTA
│   ├── gradient-hero.js        # Gradient background hero
│   └── split-hero.js           # Split layout hero
├── content/
│   ├── two-column.js           # Two column layout
│   ├── three-column.js         # Three column layout
│   └── text-image.js           # Text with image
├── products/
│   ├── product-grid.js         # Product grid layout
│   ├── featured-product.js     # Single featured product
│   └── product-row.js          # Horizontal product row
├── cta/
│   ├── centered-cta.js         # Centered call-to-action
│   ├── gradient-cta.js         # Gradient CTA block
│   └── split-cta.js            # Split CTA layout
├── footers/
│   ├── full-footer.js          # Complete footer with links
│   ├── simple-footer.js        # Simple copyright footer
│   └── social-footer.js        # Footer with social links
├── social/
│   ├── social-icons.js         # Social media icons
│   └── social-follow.js        # Social follow section
└── testimonials/
    ├── single-testimonial.js   # Single testimonial
    └── testimonial-grid.js     # Grid of testimonials
```

## Component Format

Each component file should export an object with this structure:

```javascript
export default {
  id: "unique-component-id",
  name: "Component Display Name",
  category: "header", // header, hero, content, product, cta, footer, social, testimonial
  description: "Brief description of what this component does",

  // Function that returns the preview JSX for the Quick Add modal
  renderPreview: (styles) => (
    <div className={styles.quickAddPreviewShell}>
      {/* Preview markup */}
    </div>
  ),

  // Function that takes brand data and returns the block structure
  generateBlocks: (brandData) => {
    // Extract brand styles
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#000000';
    const fontFamily = brandData.customFontFamily || 'Arial';
    const buttonBg = brandData.buttonBackgroundColor || '#000000';

    // Return block structure with brand styles applied
    return [
      {
        type: "section",
        overrides: {
          padding: 24,
          backgroundColor: primaryColor
        },
        children: [
          {
            type: "text",
            overrides: {
              content: "Your content here",
              fontFamily: fontFamily,
              fontSize: 24
            }
          }
        ]
      }
    ];
  }
};
```

## Usage

Components are imported and used by the Quick Add modal system:

```javascript
import { getAllComponents } from './quick_add_components';

// Get all components with brand data applied
const components = getAllComponents(brandData);
```

## Adding a New Component

1. Create a new file in the appropriate category folder
2. Follow the component format above
3. Export the component object
4. Add the export to `index.js`
5. The component will automatically appear in the Quick Add modal

## Brand Data Integration

Components receive the full brand data object which includes:

- `primaryColor` - Array of primary colors
- `secondaryColors` - Array of secondary colors
- `customFontFamily` - Brand font family
- `emailFallbackFont` - Fallback font for emails
- `buttonBackgroundColor` - Default button background
- `buttonTextColor` - Default button text color
- `buttonBorderRadius` - Button border radius
- `brandFontColor` - Default text color
- `cssStyles` - Complete CSS styles object

See `SampleBrand.json` for the complete brand data structure.

# Brand Styles System

## Overview

The Brand Styles system allows you to store comprehensive brand design systems scraped from websites. These brand styles can be used to automatically generate on-brand email templates, ensuring consistency across all marketing communications.

## Collection: `brand_styles`

### Purpose
- Store complete brand design systems (colors, typography, spacing, components)
- Generate CSS variables and email-ready styles
- Support for web scraping and manual entry
- Multi-tenant support (per-user, per-store, or public/shared)

## Data Structure

### Core Fields

#### Brand Identity
```javascript
{
  brandName: "Nike",
  websiteUrl: "https://www.nike.com",
  scrapedAt: ISODate("2025-01-08T10:30:00Z"),
  lastUpdated: ISODate("2025-01-08T10:30:00Z")
}
```

#### Color System
```javascript
colors: {
  primary: "#111111",
  secondary: "#757575",
  accent: "#FF6B00",
  success: "#28a745",
  warning: "#ffc107",
  error: "#dc3545",

  background: {
    light: "#ffffff",
    dark: "#111111",
    muted: "#f7f7f7"
  },

  text: {
    primary: "#111111",
    secondary: "#757575",
    link: "#111111"
  },

  palette: [
    { name: "black", value: "#111111", usage: "primary" }
  ]
}
```

#### Typography System
```javascript
typography: {
  fontFamilies: {
    primary: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    heading: "'Trade Gothic', Arial, sans-serif"
  },

  fontSize: {
    xs: 12, sm: 14, base: 16, lg: 20, xl: 24
  },

  fontWeight: {
    normal: 400, medium: 500, bold: 700
  }
}
```

#### Component Styles
```javascript
components: {
  button: {
    primary: {
      backgroundColor: "#111111",
      color: "#ffffff",
      borderRadius: 30,
      fontSize: 16,
      paddingX: 24,
      paddingY: 12
    }
  },

  heading: {
    h1: {
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 1.2
    }
  }
}
```

#### Email Defaults
```javascript
emailDefaults: {
  maxWidth: 600,
  backgroundColor: "#f7f7f7",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: 16,
  lineHeight: 1.6
}
```

## API Endpoints

### List Brand Styles
```javascript
GET /api/brand-styles

Query Parameters:
- storeId: Filter by store ID
- industry: Filter by industry
- public: Include public styles (true/false)

Response:
{
  success: true,
  brandStyles: [...],
  count: 2
}
```

### Create Brand Style
```javascript
POST /api/brand-styles

Body: BrandStyle object

Response:
{
  success: true,
  brandStyle: {...},
  message: "Brand style created successfully"
}
```

### Get Single Brand Style
```javascript
GET /api/brand-styles/[id]

Response:
{
  success: true,
  brandStyle: {...}
}
```

### Update Brand Style
```javascript
PUT /api/brand-styles/[id]

Body: Partial BrandStyle object

Response:
{
  success: true,
  brandStyle: {...},
  message: "Brand style updated successfully"
}
```

### Delete Brand Style
```javascript
DELETE /api/brand-styles/[id]

Response:
{
  success: true,
  message: "Brand style deleted successfully"
}
```

### Generate Styles
```javascript
GET /api/brand-styles/[id]/styles?format=both

Query Parameters:
- format: 'css' | 'email' | 'both'

Response:
{
  success: true,
  brandName: "Nike",
  cssVariables: {
    "--brand-primary": "#111111",
    "--font-primary": "'Helvetica Neue', Helvetica, Arial, sans-serif"
  },
  cssString: ":root {\n  --brand-primary: #111111;\n  ...\n}",
  emailStyles: {
    body: { backgroundColor: "#f7f7f7", ... },
    button: { primary: { ... } }
  }
}
```

## Model Methods

### Instance Methods

#### `toCSSVariables()`
Generates CSS custom properties for the brand
```javascript
const brandStyle = await BrandStyle.findById(id);
const cssVars = brandStyle.toCSSVariables();
// Returns: { "--brand-primary": "#111111", ... }
```

#### `getEmailStyles()`
Returns inline styles ready for email templates
```javascript
const emailStyles = brandStyle.getEmailStyles();
// Returns: { body: {...}, container: {...}, button: {...} }
```

#### `isComplete()`
Checks if brand style has minimum required data
```javascript
if (brandStyle.isComplete()) {
  // Ready to use for template generation
}
```

### Static Methods

#### `findByUser(userId)`
Get all brand styles for a user
```javascript
const styles = await BrandStyle.findByUser(userId);
```

#### `findByStore(storeId)`
Get brand styles for a specific store
```javascript
const styles = await BrandStyle.findByStore(storeId);
```

#### `findPublic()`
Get all public/shared brand styles
```javascript
const publicStyles = await BrandStyle.findPublic();
```

#### `findByIndustry(industry)`
Find brand styles by industry
```javascript
const retailStyles = await BrandStyle.findByIndustry("Athletic Apparel");
```

## Usage Examples

### Example 1: Create Brand Style from Scraped Data
```javascript
const brandStyle = new BrandStyle({
  brandName: "Nike",
  websiteUrl: "https://www.nike.com",
  userId: user._id,
  colors: {
    primary: "#111111",
    secondary: "#757575",
    // ... other colors
  },
  typography: {
    fontFamilies: {
      primary: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    }
  },
  metadata: {
    scrapedFrom: ["https://www.nike.com"],
    confidence: 0.95,
    industry: "Athletic Apparel"
  }
});

await brandStyle.save();
```

### Example 2: Generate Email Template Styles
```javascript
const brandStyle = await BrandStyle.findById(brandId);
const emailStyles = brandStyle.getEmailStyles();

// Use in email template
const emailHTML = `
  <body style="background-color: ${emailStyles.body.backgroundColor}; font-family: ${emailStyles.body.fontFamily};">
    <div style="max-width: ${emailStyles.container.maxWidth}px; margin: 0 auto;">
      <h1 style="font-size: ${emailStyles.heading.h1.fontSize}px; color: ${emailStyles.heading.h1.color};">
        Welcome to Our Brand
      </h1>
      <a href="#" style="background-color: ${emailStyles.button.primary.backgroundColor}; color: ${emailStyles.button.primary.color}; padding: ${emailStyles.button.primary.padding}; text-decoration: none; display: inline-block; border-radius: ${emailStyles.button.primary.borderRadius}px;">
        Shop Now
      </a>
    </div>
  </body>
`;
```

### Example 3: Apply Brand to Web Application
```javascript
const brandStyle = await BrandStyle.findByStore(storeId);
const cssVars = brandStyle.toCSSVariables();

// Generate CSS
const styleSheet = `
:root {
${Object.entries(cssVars).map(([key, value]) => `  ${key}: ${value};`).join('\n')}
}

.btn-primary {
  background-color: var(--brand-primary);
  color: var(--brand-text-inverse);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
}
`;
```

### Example 4: Client-Side Fetching
```javascript
// Fetch brand styles for current user
const response = await fetch('/api/brand-styles?public=true');
const { brandStyles } = await response.json();

// Get specific brand's styles
const stylesResponse = await fetch(`/api/brand-styles/${brandId}/styles?format=email`);
const { emailStyles } = await stylesResponse.json();
```

## Seeding Sample Data

Run the seed script to populate sample brand styles:

```bash
node scripts/seed-brand-styles.js
```

This will create sample brand styles for:
- Nike (Athletic Apparel)
- Apple (Technology)

## Use Cases

### 1. Email Template Generation
Automatically generate on-brand email templates using stored brand styles

### 2. Multi-Brand Support
Support multiple brands within a single platform (agencies, enterprises)

### 3. Brand Consistency
Ensure all marketing materials match the brand's design system

### 4. Template Marketplace
Create a marketplace of pre-styled templates based on popular brands

### 5. Web Scraping Integration
Automatically scrape brand styles from websites for quick setup

## Metadata & Versioning

### Confidence Score
```javascript
metadata: {
  confidence: 0.95  // 0.0 - 1.0 scale
}
```
- 0.9-1.0: High confidence (manually verified)
- 0.7-0.9: Medium confidence (scraped and reviewed)
- 0.5-0.7: Low confidence (scraped only)
- 0.0-0.5: Very low confidence (incomplete data)

### Version Tracking
```javascript
metadata: {
  version: 1,
  manualOverrides: true
}
```
Version increments on each update, manualOverrides flag indicates human edits

## Security Considerations

1. **User Ownership**: Brand styles are tied to specific users
2. **Public Styles**: Can be made public for sharing across platform
3. **Soft Delete**: Deleted styles are marked `isActive: false`
4. **Access Control**: Users can only modify their own styles

## Best Practices

### 1. Complete Color Palettes
Always include primary, secondary, and semantic colors (success, warning, error)

### 2. Font Fallbacks
Provide web-safe font fallbacks in fontFamily strings
```javascript
fontFamilies: {
  primary: "'Brand Font', 'Helvetica Neue', Arial, sans-serif"
}
```

### 3. Email-Safe Styles
Use inline styles for email, avoid CSS classes or external stylesheets

### 4. Responsive Sizing
Use relative units (em, rem) where possible, but pixels for email

### 5. High Confidence Data
Manually verify scraped data before using in production templates

## Future Enhancements

- [ ] Automatic web scraper integration
- [ ] Brand style diff/comparison tool
- [ ] Template preview with brand styles applied
- [ ] Export to Figma/Sketch
- [ ] Import from design tools (Figma, Adobe XD)
- [ ] AI-powered brand detection
- [ ] Dark mode support for email templates
- [ ] Accessibility contrast checker

## Related Models

- **Store**: Brand styles can be linked to specific stores
- **User**: Each brand style has an owner
- **EmailTemplate**: Templates can reference brand styles

## Support

For questions or issues with the Brand Styles system, contact the development team or refer to the main documentation.

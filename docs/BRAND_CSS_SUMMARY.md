# Brand CSS Field - Quick Reference

## Overview
All brand styling is stored in the `css` field of the Brand model (BrandSettings). This provides a clean, comprehensive structure for all visual design elements.

## Quick Structure

```javascript
{
  name: "My Brand",
  store_public_id: "ABC123",

  css: {
    colors: { primary, secondary, accent, backgrounds, text, borders },
    typography: { fontFamilies, fontSize, fontWeight, lineHeight },
    spacing: { xs, sm, md, lg, xl, 2xl, 3xl, 4xl },
    borderRadius: { none, sm, base, md, lg, xl },
    shadows: { sm, base, md, lg, xl },
    components: {
      button: { primary, secondary, outline },
      heading: { h1, h2, h3, h4, h5, h6 },
      text: { body, small, caption },
      link: { color, hover },
      card: { background, border, padding }
    },
    email: {
      maxWidth, backgroundColor, optimized, blocks
    },
    rules: { CSS rules from scraping },
    metadata: { confidence, sources, version }
  }
}
```

## Helper Methods

```javascript
// Get CSS custom properties
brand.getCssVariables()
// → { '--brand-primary': '#000', '--spacing-md': '16px', ... }

// Get email-optimized styles
brand.getEmailStyles()
// → { body: {...}, container: {...}, heading: {...}, button: {...} }

// Check if CSS is complete
brand.hasCssStyles()
// → true/false

// Get font family with fallbacks
brand.getFontFamily()
// → "'Georgia', Arial, sans-serif"
```

## Example Usage

```javascript
// Create brand with CSS
const brand = new Brand({
  name: "Acme Corp",
  store_public_id: "ABC123",
  css: {
    colors: { primary: "#0066cc" },
    typography: { fontFamilies: { primary: "Arial" } },
    email: { maxWidth: 600 }
  }
});

// Use in email template
const styles = brand.getEmailStyles();
const html = `
  <div style="background: ${styles.body.backgroundColor}">
    <h1 style="color: ${styles.heading.h1.color}">Title</h1>
    <a style="background: ${styles.button.primary.backgroundColor}">
      Button
    </a>
  </div>
`;
```

## Key Points

1. ✅ **Single Field** - All styling in `css` field
2. ✅ **No Migration Needed** - Fresh start, no legacy support
3. ✅ **Helper Methods** - Use getCssVariables() and getEmailStyles()
4. ✅ **Email Optimized** - Built-in email client support
5. ✅ **Flexible** - Accommodates any styling data
6. ✅ **Metadata** - Track confidence and sources

## Documentation

See [BRAND_CSS_STRUCTURE.md](./BRAND_CSS_STRUCTURE.md) for complete documentation with examples and API patterns.

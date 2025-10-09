# Brand CSS Structure Guide

## Overview

All brand styling is stored in the `css` field within the `Brand` model (BrandSettings). This provides a clean, comprehensive structure for managing all visual design and styling information.

## Brand Document Structure

```javascript
{
  name: "My Brand",
  brandName: "My Brand",
  store_public_id: "ABC123",
  // ... other brand identity fields ...

  // All styling contained in css field
  css: {
    colors: { /* color system */ },
    typography: { /* typography system */ },
    spacing: { /* spacing scale */ },
    borderRadius: { /* border radius values */ },
    shadows: { /* shadow definitions */ },
    components: { /* component-specific styles */ },
    email: { /* email-specific settings */ },
    rules: { /* raw CSS rules */ },
    metadata: { /* scraping/confidence data */ }
  }
}
```

## CSS Field Structure

### 1. Colors System
Complete color palette including brand colors, semantic colors, text colors, backgrounds, and borders.

```javascript
css: {
  colors: {
    // Primary brand colors
    primary: "#000000",
    secondary: "#666666",
    accent: "#0066cc",

    // Semantic colors
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8",

    // Background variations
    background: {
      light: "#ffffff",
      dark: "#000000",
      muted: "#f7f7f7",
      canvas: "#fafafa"
    },

    // Text colors
    text: {
      primary: "#000000",
      secondary: "#666666",
      muted: "#999999",
      inverse: "#ffffff",
      link: "#0066cc",
      linkHover: "#004499"
    },

    // Border colors
    border: {
      primary: "#e5e5e5",
      secondary: "#cccccc",
      focus: "#0066cc"
    },

    // Extended color palette
    palette: [
      { name: "Brand Blue", value: "#0066cc", usage: "primary" },
      { name: "Light Gray", value: "#f5f5f5", usage: "background" }
    ],

    // Extracted colors from scraping
    extracted: {
      primary: ["#0066cc", "#004499"],
      text: ["#000000", "#666666"],
      background: ["#ffffff", "#f7f7f7"]
    }
  }
}
```

### 2. Typography System
Complete typography scale including fonts, sizes, weights, line heights, and letter spacing.

```javascript
css: {
  typography: {
    // Font families
    fontFamilies: {
      primary: "Arial, Helvetica, sans-serif",
      secondary: "Georgia, serif",
      heading: "Georgia, serif",
      body: "Arial, sans-serif",
      mono: "Courier New, monospace"
    },

    // Font sizes (in pixels)
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      md: 18,
      lg: 20,
      xl: 24,
      "2xl": 28,
      "3xl": 32,
      "4xl": 36,
      "5xl": 42,
      "6xl": 48
    },

    // Font weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900
    },

    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
      loose: 1.8
    },

    // Letter spacing
    letterSpacing: {
      tight: "-0.5px",
      normal: "0px",
      wide: "0.5px",
      wider: "1px"
    },

    // Scraped heading styles
    headings: {
      h1: { fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
      h2: { fontSize: 28, fontWeight: 700, lineHeight: 1.3 },
      h3: { fontSize: 24, fontWeight: 600, lineHeight: 1.4 }
    }
  }
}
```

### 3. Spacing & Layout
Spacing scale, border radius values, and shadow definitions.

```javascript
css: {
  // Spacing scale (in pixels)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
    "3xl": 64,
    "4xl": 96,
    commonPaddings: ["8px", "16px", "24px"],
    commonMargins: ["0", "8px", "16px"]
  },

  // Border radius values
  borderRadius: {
    none: 0,
    sm: 2,
    base: 4,
    md: 6,
    lg: 8,
    xl: 12,
    "2xl": 16,
    full: 9999,
    pill: "50px"
  },

  // Shadow definitions
  shadows: {
    none: "none",
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.15)"
  }
}
```

### 4. Component Styles
Styles for buttons, headings, text, links, cards, and other UI components.

```javascript
css: {
  components: {
    // Button styles
    button: {
      primary: {
        backgroundColor: "#0066cc",
        color: "#ffffff",
        borderRadius: 4,
        fontSize: 16,
        fontWeight: 500,
        paddingX: 24,
        paddingY: 12,
        borderWidth: 0,
        hoverBackgroundColor: "#0052a3",
        hoverColor: "#ffffff"
      },
      secondary: {
        backgroundColor: "#666666",
        color: "#ffffff",
        // ... similar structure
      },
      outline: { /* outline button styles */ },
      ghost: { /* ghost button styles */ }
    },

    // Scraped button styles (from website)
    buttons: [
      { selector: ".btn-primary", styles: { /* ... */ } },
      { selector: ".cta-button", styles: { /* ... */ } }
    ],

    // Heading styles
    heading: {
      h1: {
        fontSize: 32,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.5px",
        color: "#000000"
      },
      h2: { /* h2 styles */ },
      h3: { /* h3 styles */ }
    },

    // Text styles
    text: {
      body: {
        fontSize: 16,
        lineHeight: 1.6,
        color: "#000000",
        fontWeight: 400
      },
      small: { fontSize: 14, lineHeight: 1.5 },
      caption: { fontSize: 12, lineHeight: 1.4 }
    },

    // Link styles
    link: {
      color: "#0066cc",
      textDecoration: "underline",
      hoverColor: "#004499",
      fontWeight: 400
    },

    // Scraped link styles
    links: [
      { selector: "a.nav-link", styles: { /* ... */ } }
    ],

    // Card styles
    card: {
      backgroundColor: "#ffffff",
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: "#e5e5e5",
      shadow: "0 2px 4px rgba(0,0,0,0.1)"
    },

    // Scraped card styles
    cards: [
      { selector: ".product-card", styles: { /* ... */ } }
    ],

    // Other component styles
    section: { paddingY: 48, paddingX: 24 },
    headers: { /* scraped header styles */ },
    forms: { /* scraped form styles */ },
    testimonials: [ /* scraped testimonial styles */ ],
    segments: [ /* scraped segment styles */ ],
    heroes: [ /* scraped hero section styles */ ]
  }
}
```

### 5. Email-Specific Styles
Email template settings and optimized component styles for email clients.

```javascript
css: {
  email: {
    // Email container defaults
    maxWidth: 600,
    backgroundColor: "#f7f7f7",
    contentBackgroundColor: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: 16,
    lineHeight: 1.6,
    textColor: "#000000",
    linkColor: "#0066cc",
    padding: 20,

    // Email-optimized component styles
    optimized: {
      button: {
        backgroundColor: "#0066cc",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "4px",
        textDecoration: "none",
        display: "inline-block"
      },
      heading: {
        fontSize: "24px",
        fontWeight: 700,
        color: "#000000",
        margin: "0 0 16px 0"
      },
      paragraph: {
        fontSize: "16px",
        lineHeight: "1.6",
        margin: "0 0 16px 0"
      }
    },

    // Reusable email block templates
    blocks: [
      {
        type: "hero",
        styles: {
          backgroundColor: "#0066cc",
          padding: "48px 24px",
          textAlign: "center"
        }
      },
      {
        type: "product-grid",
        styles: {
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px"
        }
      }
    ]
  }
}
```

### 6. Raw CSS Rules & Metadata
Raw CSS rules extracted from website and metadata about scraping.

```javascript
css: {
  // Raw CSS rules
  rules: {
    buttons: [
      {
        selector: ".btn-primary",
        properties: {
          "background-color": "#0066cc",
          "border-radius": "4px",
          "padding": "12px 24px"
        }
      }
    ],
    links: [ /* link CSS rules */ ],
    variables: {
      "--primary-color": "#0066cc",
      "--secondary-color": "#666666"
    },
    importantSelectors: [
      { selector: ".hero", importance: "high" }
    ]
  },

  // Metadata about CSS
  metadata: {
    scrapedFrom: [
      "https://example.com",
      "https://example.com/about"
    ],
    confidence: 0.95, // 0-1 confidence score
    version: 1,
    lastUpdated: "2025-01-15T10:30:00Z",
    manualOverrides: false
  }
}
```

## Helper Methods

### getCssVariables()
Extracts CSS custom properties from the brand's css field.

```javascript
const brand = await Brand.findOne({ store_public_id: "ABC123" });
const cssVars = brand.getCssVariables();

// Returns:
{
  '--brand-primary': '#0066cc',
  '--brand-secondary': '#666666',
  '--brand-accent': '#ff6b6b',
  '--text-primary': '#000000',
  '--text-link': '#0066cc',
  '--bg-light': '#ffffff',
  '--font-primary': 'Arial, Helvetica, sans-serif',
  '--spacing-xs': '4px',
  '--spacing-sm': '8px',
  '--spacing-md': '16px',
  '--radius-base': '4px',
  '--radius-lg': '8px'
}
```

### getEmailStyles()
Generates inline styles optimized for email clients.

```javascript
const emailStyles = brand.getEmailStyles();

// Returns:
{
  body: {
    backgroundColor: '#f7f7f7',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#000000',
    margin: 0,
    padding: 0
  },
  container: {
    maxWidth: '600px',
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px'
  },
  heading: {
    h1: {
      fontSize: '32px',
      fontWeight: 700,
      color: '#000000',
      lineHeight: 1.2,
      margin: '0 0 16px 0'
    },
    h2: { /* ... */ }
  },
  button: {
    primary: {
      backgroundColor: '#0066cc',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '4px',
      textDecoration: 'none',
      display: 'inline-block',
      fontWeight: 500,
      fontSize: '16px'
    }
  },
  link: {
    color: '#0066cc',
    textDecoration: 'underline'
  }
}
```

### hasCssStyles()
Checks if brand has complete CSS styling information.

```javascript
if (brand.hasCssStyles()) {
  // Brand has complete CSS styling
  const styles = brand.getEmailStyles();
} else {
  // Use default styling
  const defaultColor = '#000000';
}
```

### getFontFamily()
Gets primary font family with fallbacks.

```javascript
const fontFamily = brand.getFontFamily();
// Returns: "'Georgia', Arial, sans-serif"
```

## Usage Examples

### Creating a Brand with CSS Styles

```javascript
const brand = new Brand({
  name: "Acme Corp",
  brandName: "Acme Corp",
  store_public_id: "ABC123",

  css: {
    colors: {
      primary: "#0066cc",
      secondary: "#666666",
      accent: "#ff6b6b",
      background: {
        light: "#ffffff",
        dark: "#1a1a1a"
      },
      text: {
        primary: "#000000",
        secondary: "#666666",
        link: "#0066cc"
      }
    },

    typography: {
      fontFamilies: {
        primary: "Arial, sans-serif",
        heading: "Georgia, serif"
      },
      fontSize: {
        base: 16,
        lg: 20,
        xl: 24
      }
    },

    spacing: {
      sm: 8,
      md: 16,
      lg: 24
    },

    components: {
      button: {
        primary: {
          backgroundColor: "#0066cc",
          color: "#ffffff",
          borderRadius: 4,
          paddingX: 24,
          paddingY: 12
        }
      }
    },

    email: {
      maxWidth: 600,
      backgroundColor: "#f7f7f7"
    }
  }
});

await brand.save();
```

### Using CSS Styles in Email Templates

```javascript
const brand = await Brand.findOne({ store_public_id: storeId });
const emailStyles = brand.getEmailStyles();

const emailHTML = `
  <div style="background-color: ${emailStyles.body.backgroundColor}">
    <div style="
      max-width: ${emailStyles.container.maxWidth};
      background-color: ${emailStyles.container.backgroundColor};
      margin: ${emailStyles.container.margin};
      padding: ${emailStyles.container.padding};
    ">
      <h1 style="
        font-size: ${emailStyles.heading.h1.fontSize};
        font-weight: ${emailStyles.heading.h1.fontWeight};
        color: ${emailStyles.heading.h1.color};
      ">
        Welcome to Our Store
      </h1>

      <a href="https://store.com" style="
        background-color: ${emailStyles.button.primary.backgroundColor};
        color: ${emailStyles.button.primary.color};
        padding: ${emailStyles.button.primary.padding};
        border-radius: ${emailStyles.button.primary.borderRadius};
        text-decoration: ${emailStyles.button.primary.textDecoration};
        display: ${emailStyles.button.primary.display};
      ">
        Shop Now
      </a>
    </div>
  </div>
`;
```

### Using CSS Variables in React

```javascript
const brand = await Brand.findOne({ store_public_id: storeId });
const cssVars = brand.getCssVariables();

export default function BrandedComponent() {
  return (
    <div style={cssVars}>
      <h1 style={{ color: 'var(--brand-primary)' }}>
        Welcome
      </h1>
      <button style={{
        backgroundColor: 'var(--brand-primary)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-base)'
      }}>
        Click Me
      </button>
    </div>
  );
}
```

## API Endpoints

### Get Brand CSS
```javascript
// GET /api/brands/[id]/css
export async function GET(request, { params }) {
  const { id } = await params;
  const brand = await Brand.findById(id);

  return NextResponse.json({
    css: brand.css || {},
    cssVariables: brand.getCssVariables(),
    emailStyles: brand.getEmailStyles()
  });
}
```

### Update Brand CSS
```javascript
// PUT /api/brands/[id]/css
export async function PUT(request, { params }) {
  const { id } = await params;
  const cssUpdate = await request.json();

  const brand = await Brand.findById(id);
  brand.css = { ...brand.css, ...cssUpdate };
  await brand.save();

  return NextResponse.json({
    success: true,
    css: brand.css
  });
}
```

## Benefits

1. **Single Source of Truth** - All styling in one field
2. **Flexible Structure** - Accommodates any styling data
3. **Type Safety** - Well-defined schema with defaults
4. **Email Optimized** - Built-in email styling support
5. **Easy to Query** - Simple MongoDB queries
6. **Extendable** - Easy to add new style categories
7. **Scraped Data Support** - Can store extracted styles from websites
8. **Metadata Tracking** - Confidence scores and source tracking

## Best Practices

1. **Always set defaults** - Define reasonable defaults in the schema
2. **Use helper methods** - Leverage getCssVariables() and getEmailStyles()
3. **Validate colors** - Ensure hex colors are properly formatted
4. **Document units** - Always specify units (px, em, rem)
5. **Test email styles** - Verify styles work across email clients
6. **Version control** - Use metadata.version for tracking changes
7. **Track sources** - Record where styles were scraped from
8. **Set confidence** - Use metadata.confidence to track data quality

/**
 * Seed Script for Brand Styles
 *
 * This script populates the brand_styles collection with sample brand data
 * Run with: node scripts/seed-brand-styles.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import model
const BrandStyle = require('../models/BrandStyle');

const sampleBrands = [
  {
    // Nike Brand Style
    brandName: "Nike",
    websiteUrl: "https://www.nike.com",

    colors: {
      primary: "#111111",
      secondary: "#757575",
      accent: "#FF6B00",
      success: "#28a745",
      warning: "#ffc107",
      error: "#dc3545",
      info: "#17a2b8",

      background: {
        light: "#ffffff",
        dark: "#111111",
        muted: "#f7f7f7",
        canvas: "#fafafa"
      },

      text: {
        primary: "#111111",
        secondary: "#757575",
        muted: "#8d8d8d",
        inverse: "#ffffff",
        link: "#111111",
        linkHover: "#757575"
      },

      border: {
        primary: "#e5e5e5",
        secondary: "#cccccc",
        focus: "#111111"
      },

      palette: [
        { name: "black", value: "#111111", usage: "primary" },
        { name: "white", value: "#ffffff", usage: "background" },
        { name: "orange", value: "#FF6B00", usage: "accent" },
        { name: "gray-dark", value: "#757575", usage: "secondary" },
        { name: "gray-light", value: "#f7f7f7", usage: "background-muted" }
      ]
    },

    typography: {
      fontFamilies: {
        primary: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        secondary: "Arial, Helvetica, sans-serif",
        heading: "'Trade Gothic', Arial, sans-serif",
        body: "'Helvetica Neue', Helvetica, sans-serif",
        mono: "'Courier New', Courier, monospace"
      },

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

      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        black: 900
      },

      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.6,
        loose: 1.8
      },

      letterSpacing: {
        tight: "-0.5px",
        normal: "0px",
        wide: "0.5px",
        wider: "1px"
      }
    },

    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      "2xl": 48,
      "3xl": 64,
      "4xl": 96
    },

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

    shadows: {
      none: "none",
      sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
      base: "0 1px 3px rgba(0, 0, 0, 0.1)",
      md: "0 4px 6px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
      xl: "0 20px 25px rgba(0, 0, 0, 0.15)"
    },

    components: {
      button: {
        primary: {
          backgroundColor: "#111111",
          color: "#ffffff",
          borderRadius: 30,
          fontSize: 16,
          fontWeight: 500,
          paddingX: 24,
          paddingY: 12,
          borderWidth: 0,
          hoverBackgroundColor: "#333333"
        },
        secondary: {
          backgroundColor: "transparent",
          color: "#111111",
          borderRadius: 30,
          fontSize: 16,
          fontWeight: 500,
          paddingX: 24,
          paddingY: 12,
          borderWidth: 1,
          borderColor: "#e5e5e5",
          hoverBackgroundColor: "#f7f7f7"
        },
        outline: {
          backgroundColor: "transparent",
          color: "#111111",
          borderRadius: 30,
          fontSize: 16,
          fontWeight: 500,
          paddingX: 24,
          paddingY: 12,
          borderWidth: 1,
          borderColor: "#111111"
        }
      },

      heading: {
        h1: {
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: "-0.5px",
          color: "#111111"
        },
        h2: {
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.2,
          color: "#111111"
        },
        h3: {
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1.3,
          color: "#111111"
        },
        h4: {
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1.4,
          color: "#111111"
        }
      },

      text: {
        body: {
          fontSize: 16,
          lineHeight: 1.6,
          color: "#757575",
          fontWeight: 400
        },
        small: {
          fontSize: 14,
          lineHeight: 1.5,
          color: "#8d8d8d",
          fontWeight: 400
        }
      },

      link: {
        color: "#111111",
        textDecoration: "underline",
        hoverColor: "#757575",
        fontWeight: 400
      },

      card: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 24,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        shadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      },

      section: {
        paddingY: 48,
        paddingX: 24,
        backgroundColor: "#ffffff"
      }
    },

    branding: {
      logoUrl: "https://www.nike.com/logo.svg",
      logoWidth: 60,
      logoHeight: 24,
      favicon: "https://www.nike.com/favicon.ico",
      brandmark: "https://www.nike.com/swoosh.svg",
      logoAltText: "Nike"
    },

    emailDefaults: {
      maxWidth: 600,
      backgroundColor: "#f7f7f7",
      contentBackgroundColor: "#ffffff",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: 16,
      lineHeight: 1.6,
      textColor: "#757575",
      linkColor: "#111111",
      padding: 20
    },

    metadata: {
      scrapedFrom: ["https://www.nike.com", "https://www.nike.com/product", "https://www.nike.com/checkout"],
      confidence: 0.95,
      manualOverrides: false,
      version: 1,
      tags: ["sports", "athletic", "retail", "apparel"],
      industry: "Athletic Apparel",
      notes: "Premium athletic brand with minimalist design system"
    },

    isActive: true,
    isPublic: true
  },

  {
    // Apple Brand Style
    brandName: "Apple",
    websiteUrl: "https://www.apple.com",

    colors: {
      primary: "#000000",
      secondary: "#86868b",
      accent: "#0071e3",
      success: "#30d158",
      warning: "#ff9f0a",
      error: "#ff3b30",
      info: "#0071e3",

      background: {
        light: "#ffffff",
        dark: "#000000",
        muted: "#fbfbfd",
        canvas: "#f5f5f7"
      },

      text: {
        primary: "#1d1d1f",
        secondary: "#6e6e73",
        muted: "#86868b",
        inverse: "#ffffff",
        link: "#0071e3",
        linkHover: "#0077ed"
      },

      border: {
        primary: "#d2d2d7",
        secondary: "#e8e8ed",
        focus: "#0071e3"
      },

      palette: [
        { name: "black", value: "#000000", usage: "primary" },
        { name: "white", value: "#ffffff", usage: "background" },
        { name: "blue", value: "#0071e3", usage: "accent" },
        { name: "gray", value: "#86868b", usage: "secondary" }
      ]
    },

    typography: {
      fontFamilies: {
        primary: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        heading: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Helvetica, Arial, sans-serif",
        body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif"
      },

      fontSize: {
        xs: 12,
        sm: 14,
        base: 17,
        md: 19,
        lg: 21,
        xl: 24,
        "2xl": 28,
        "3xl": 32,
        "4xl": 40,
        "5xl": 48,
        "6xl": 56
      },

      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        black: 900
      },

      lineHeight: {
        tight: 1.1,
        normal: 1.47,
        relaxed: 1.6,
        loose: 1.8
      },

      letterSpacing: {
        tight: "-0.022em",
        normal: "0",
        wide: "0.011em",
        wider: "0.022em"
      }
    },

    components: {
      button: {
        primary: {
          backgroundColor: "#0071e3",
          color: "#ffffff",
          borderRadius: 12,
          fontSize: 17,
          fontWeight: 400,
          paddingX: 22,
          paddingY: 13,
          borderWidth: 0,
          hoverBackgroundColor: "#0077ed"
        },
        secondary: {
          backgroundColor: "transparent",
          color: "#0071e3",
          borderRadius: 12,
          fontSize: 17,
          fontWeight: 400,
          paddingX: 22,
          paddingY: 13,
          borderWidth: 1,
          borderColor: "#0071e3",
          hoverBackgroundColor: "rgba(0, 113, 227, 0.05)"
        }
      },

      heading: {
        h1: {
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.07,
          letterSpacing: "-0.022em",
          color: "#1d1d1f"
        },
        h2: {
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.022em",
          color: "#1d1d1f"
        }
      },

      text: {
        body: {
          fontSize: 17,
          lineHeight: 1.47,
          color: "#1d1d1f",
          fontWeight: 400
        },
        small: {
          fontSize: 14,
          lineHeight: 1.43,
          color: "#6e6e73",
          fontWeight: 400
        }
      }
    },

    emailDefaults: {
      maxWidth: 600,
      backgroundColor: "#f5f5f7",
      contentBackgroundColor: "#ffffff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: 17,
      lineHeight: 1.47,
      textColor: "#1d1d1f",
      linkColor: "#0071e3"
    },

    metadata: {
      scrapedFrom: ["https://www.apple.com"],
      confidence: 0.92,
      version: 1,
      tags: ["technology", "premium", "minimalist"],
      industry: "Technology",
      notes: "Clean, minimalist design with focus on typography"
    },

    isActive: true,
    isPublic: true
  }
];

async function seedBrandStyles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing brand styles (optional - comment out to keep existing)
    // await BrandStyle.deleteMany({});
    // console.log('🗑️  Cleared existing brand styles');

    // Insert sample brands
    const inserted = await BrandStyle.insertMany(sampleBrands);
    console.log(`✅ Inserted ${inserted.length} brand styles`);

    // Log the created brands
    inserted.forEach(brand => {
      console.log(`   - ${brand.brandName} (ID: ${brand._id})`);
    });

    console.log('\n✅ Seeding complete!');

  } catch (error) {
    console.error('❌ Error seeding brand styles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed script
if (require.main === module) {
  seedBrandStyles();
}

module.exports = { seedBrandStyles, sampleBrands };

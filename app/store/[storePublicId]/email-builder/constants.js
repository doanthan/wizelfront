import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Box,
  CheckCircle,
  ChevronsRight,
  CreditCard,
  FileText,
  Gift,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Layout,
  Layers,
  Link,
  List,
  ListOrdered,
  Mail,
  Minus,
  Package,
  Repeat,
  Send,
  ShoppingCart,
  Sparkles,
  Square,
  Star,
  Target,
  Type,
  TrendingUp,
  Truck,
  Users,
  Zap
} from "lucide-react";
import styles from "./email-builder.module.css";

export const CANVAS_BLOCK_TYPE = "application/x-aurora-block";
export const CATEGORY_ORDER = ["Layout", "Basic", "Advanced"];
export const THEME_KEY = "aurora-theme";
export const PANEL_KEY = "aurora-properties-open";

export const library = [
  {
    type: "section",
    title: "Section",
    description: "Container for content",
    category: "Layout",
    icon: Layers,
    defaultOverrides: {
      content: "Section container",
      padding: 24,
      background: "transparent",
      alignment: "center"
    }
  },
  {
    type: "columns",
    title: "Columns",
    description: "Multi-column layout",
    category: "Layout",
    icon: Layout,
    defaultOverrides: {
      columns: 2,
      columnSizes: "equal",
      content: "Column 1\nColumn 2",
      padding: 16,
      fontSize: 18
    }
  },
  {
    type: "text",
    title: "Text",
    description: "Enhanced email text",
    category: "Basic",
    icon: Type,
    defaultOverrides: {
      content: "Write your email content here. This text block supports proper spacing and formatting for professional emails.",
      fontSize: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      textColor: "#2d3748",
      padding: 20,
      alignment: "left",
      lineHeight: 1.6,
      letterSpacing: 0,
      // Mobile optimization
      mobileOptimized: true,
      mobileFontSize: 16, // Minimum recommended for mobile readability
      mobileLineHeight: 1.5,
      mobilePadding: 16
    }
  },
  {
    type: "button",
    title: "Button",
    description: "Primary call to action",
    category: "Basic",
    icon: Square,
    defaultOverrides: {
      content: "Click Here",
      alignment: "center",
      backgroundColor: "#007bff",
      textColor: "#ffffff",
      fontSize: 16,
      fontWeight: "500",
      fontFamily: "Arial, Helvetica, sans-serif",
      borderRadius: 4,
      borderWidth: 0,
      borderColor: "#007bff",
      buttonPaddingX: 24,
      buttonPaddingY: 12,
      padding: 16,
      buttonUrl: "#",
      buttonTarget: "_blank",
      blockPaddingTop: 20,
      blockPaddingBottom: 20,
      blockPaddingLeft: 36,
      blockPaddingRight: 36,
      minWidth: 120
    }
  },
  {
    type: "image",
    title: "Image",
    description: "Hero imagery",
    category: "Basic",
    icon: ImageIcon,
    defaultOverrides: {
      imageUrl: "/img.png",
      padding: 0,
      content: "Illustration showcasing email layout"
    }
  },
  {
    type: "divider",
    title: "Divider",
    description: "Two-tone section divider",
    category: "Basic",
    icon: Minus,
    defaultOverrides: {
      padding: 0,
      dividerStyle: "two-tone",
      dividerColor: "#94A3B8",
      dividerColorTop: "#6366F1",
      dividerColorBottom: "#FFFFFF",
      dividerHeight: 50,
      dividerWidth: 100, // percentage
      content: ""
    }
  }
];

export const quickAddCategories = [
  {
    id: "header",
    title: "Header",
    description: "Top section elements",
    icon: Heading1,
    components: [
      {
        id: "header-logo-nav",
        name: "Logo + Nav Links",
        description: "Brand mark on the left with top navigation links",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div className={styles.previewRow}>
              <div className={`${styles.previewChip} ${styles.previewChipStrong}`}>Logo</div>
              <div className={styles.previewInlineGroup}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 24, background: "#ffffff" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "YOUR BRAND | Home • Shop • About • Contact",
                  fontSize: 16,
                  padding: 0,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      },
      {
        id: "header-centered",
        name: "Centered Logo",
        description: "Centered brand with optional tagline",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div className={`${styles.previewRow} ${styles.previewRowCenter}`}>
              <div className={`${styles.previewChip} ${styles.previewChipStrong}`}>Logo</div>
            </div>
            <div className={`${styles.previewRow} ${styles.previewRowCenter}`}>
              <span style={{ fontSize: 10, opacity: 0.6 }}>tagline</span>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "YOUR BRAND",
                  alignment: "center",
                  fontSize: 28,
                  fontWeight: "bold",
                  padding: 8
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Elevating your experience",
                  alignment: "center",
                  fontSize: 14,
                  padding: 0,
                  textColor: "#6c757d"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "content",
    title: "Content",
    description: "Articles and text blocks",
    icon: FileText,
    components: [
      {
        id: "content-image-text",
        name: "Image + Text Card",
        description: "Image above with text content below",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div className={styles.previewBlock} style={{ height: 40, background: "#e9ecef" }} />
            <div style={{ padding: "8px 4px" }}>
              <div style={{ height: 8, background: "#495057", width: "80%", marginBottom: 4, borderRadius: 2 }} />
              <div style={{ height: 4, background: "#adb5bd", width: "100%", marginBottom: 2, borderRadius: 1 }} />
              <div style={{ height: 4, background: "#adb5bd", width: "90%", borderRadius: 1 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 24, background: "#ffffff" },
            children: [
              {
                type: "image",
                overrides: {
                  imageUrl: "/img.png",
                  padding: 0,
                  content: "Featured image"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Your Headline Here",
                  fontSize: 24,
                  fontWeight: "bold",
                  padding: 16,
                  alignment: "left"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Add your article content here. This layout works great for newsletters, blog updates, and feature announcements.",
                  fontSize: 16,
                  padding: 0,
                  alignment: "left",
                  textColor: "#495057"
                }
              }
            ]
          }
        ]
      },
      {
        id: "content-two-column-article",
        name: "Two Column Article",
        description: "Side-by-side image and text",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div className={styles.previewRow}>
              <div className={styles.previewBlock} style={{ width: "45%", height: 50, background: "#e9ecef" }} />
              <div style={{ width: "55%", paddingLeft: 4 }}>
                <div style={{ height: 6, background: "#495057", width: "90%", marginBottom: 3, borderRadius: 2 }} />
                <div style={{ height: 3, background: "#adb5bd", width: "100%", marginBottom: 2, borderRadius: 1 }} />
                <div style={{ height: 3, background: "#adb5bd", width: "85%", borderRadius: 1 }} />
              </div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 24, background: "#ffffff" },
            children: [
              {
                type: "columns",
                overrides: {
                  columns: 2,
                  columnSizes: "50-50",
                  padding: 0
                },
                children: [
                  {
                    type: "image",
                    overrides: {
                      imageUrl: "/img.png",
                      padding: 0
                    }
                  },
                  {
                    type: "text",
                    overrides: {
                      content: "Article Title\n\nYour article content goes here with a compelling description that engages readers.",
                      fontSize: 16,
                      padding: 16,
                      alignment: "left"
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "content-text-block",
        name: "Text Content Block",
        description: "Simple formatted text section",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ padding: 8 }}>
              <div style={{ height: 8, background: "#495057", width: "70%", marginBottom: 6, borderRadius: 2 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "100%", marginBottom: 2, borderRadius: 1 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "95%", marginBottom: 2, borderRadius: 1 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "85%", borderRadius: 1 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Section Title\n\nYour content goes here. Use this for announcements, updates, or any text-based communication.",
                  fontSize: 16,
                  padding: 0,
                  alignment: "left"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "feature",
    title: "Feature",
    description: "Highlight key features",
    icon: Sparkles,
    components: [
      {
        id: "feature-hero-image",
        name: "Hero Feature Card",
        description: "Large image with overlay text (like Game On example)",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 12, borderRadius: 4 }}>
            <div style={{ color: "white", fontSize: 8, marginBottom: 4, opacity: 0.9 }}>Discover</div>
            <div style={{ color: "white", fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>BIG BOLD<br/>HEADLINE</div>
            <div style={{ height: 12, background: "rgba(255,255,255,0.9)", borderRadius: 2, width: 40 }} />
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: {
              padding: 0,
              background: "#2d3748"
            },
            children: [
              {
                type: "image",
                overrides: {
                  imageUrl: "/img.png",
                  padding: 0,
                  content: "Hero background image"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Unlock pro tips, premium gear, and training to level up your game!",
                  fontSize: 16,
                  padding: 24,
                  alignment: "left",
                  textColor: "#ffffff",
                  background: "rgba(0,0,0,0.3)"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "GAME ON, PLAY BOLD",
                  fontSize: 42,
                  fontWeight: "bold",
                  padding: 24,
                  alignment: "left",
                  textColor: "#ffffff"
                }
              },
              {
                type: "button",
                overrides: {
                  content: "Get Started",
                  backgroundColor: "#ffffff",
                  textColor: "#2d3748",
                  fontSize: 18,
                  fontWeight: "600",
                  borderRadius: 8,
                  buttonPaddingX: 32,
                  buttonPaddingY: 16,
                  padding: 24,
                  alignment: "left"
                }
              }
            ]
          }
        ]
      },
      {
        id: "feature-three-column",
        name: "Three Feature Grid",
        description: "Three features side by side",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div className={styles.previewRow}>
              <div style={{ width: "32%", textAlign: "center" }}>
                <div className={styles.previewChip} style={{ margin: "0 auto 4px" }}>✓</div>
                <div style={{ height: 3, background: "#495057", margin: "0 auto 2px", width: "80%", borderRadius: 1 }} />
              </div>
              <div style={{ width: "32%", textAlign: "center" }}>
                <div className={styles.previewChip} style={{ margin: "0 auto 4px" }}>✓</div>
                <div style={{ height: 3, background: "#495057", margin: "0 auto 2px", width: "80%", borderRadius: 1 }} />
              </div>
              <div style={{ width: "32%", textAlign: "center" }}>
                <div className={styles.previewChip} style={{ margin: "0 auto 4px" }}>✓</div>
                <div style={{ height: 3, background: "#495057", margin: "0 auto 2px", width: "80%", borderRadius: 1 }} />
              </div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#ffffff" },
            children: [
              {
                type: "columns",
                overrides: {
                  columns: 3,
                  columnSizes: "equal",
                  padding: 0
                },
                children: [
                  {
                    type: "text",
                    overrides: {
                      content: "✓\n\nFeature One\n\nDescribe your first key feature here.",
                      fontSize: 16,
                      padding: 16,
                      alignment: "center"
                    }
                  },
                  {
                    type: "text",
                    overrides: {
                      content: "✓\n\nFeature Two\n\nDescribe your second key feature here.",
                      fontSize: 16,
                      padding: 16,
                      alignment: "center"
                    }
                  },
                  {
                    type: "text",
                    overrides: {
                      content: "✓\n\nFeature Three\n\nDescribe your third key feature here.",
                      fontSize: 16,
                      padding: 16,
                      alignment: "center"
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "feature-icon-list",
        name: "Feature List",
        description: "Vertical list of features with icons",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ padding: 4 }}>
              <div className={styles.previewRow} style={{ marginBottom: 4 }}>
                <div className={styles.previewChip}>✓</div>
                <div style={{ flex: 1, height: 4, background: "#495057", borderRadius: 1, marginLeft: 4 }} />
              </div>
              <div className={styles.previewRow} style={{ marginBottom: 4 }}>
                <div className={styles.previewChip}>✓</div>
                <div style={{ flex: 1, height: 4, background: "#495057", borderRadius: 1, marginLeft: 4 }} />
              </div>
              <div className={styles.previewRow}>
                <div className={styles.previewChip}>✓</div>
                <div style={{ flex: 1, height: 4, background: "#495057", borderRadius: 1, marginLeft: 4 }} />
              </div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 24, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "✓ Premium Quality Materials\n✓ Free Shipping Worldwide\n✓ 30-Day Money Back Guarantee",
                  fontSize: 16,
                  padding: 16,
                  alignment: "left",
                  lineHeight: 1.8
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "call-to-action",
    title: "Call to action",
    description: "Drive conversions",
    icon: Target,
    components: [
      {
        id: "cta-centered-button",
        name: "Centered CTA",
        description: "Headline with centered button",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ height: 8, background: "#495057", width: "70%", margin: "0 auto 6px", borderRadius: 2 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "90%", margin: "0 auto 8px", borderRadius: 1 }} />
              <div style={{ height: 16, background: "#007bff", width: 60, margin: "0 auto", borderRadius: 3 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 48, background: "#ffffff" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Ready to Get Started?",
                  fontSize: 32,
                  fontWeight: "bold",
                  padding: 8,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Join thousands of satisfied customers today.",
                  fontSize: 18,
                  padding: 8,
                  alignment: "center",
                  textColor: "#6c757d"
                }
              },
              {
                type: "button",
                overrides: {
                  content: "Start Free Trial",
                  backgroundColor: "#007bff",
                  textColor: "#ffffff",
                  fontSize: 18,
                  fontWeight: "600",
                  borderRadius: 8,
                  buttonPaddingX: 40,
                  buttonPaddingY: 16,
                  padding: 16,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      },
      {
        id: "cta-banner",
        name: "Promotional Banner",
        description: "Full-width promo with button",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell} style={{ background: "#28a745", padding: 8 }}>
            <div style={{ color: "white", fontSize: 10, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>Limited Offer</div>
            <div style={{ height: 12, background: "rgba(255,255,255,0.9)", borderRadius: 2, margin: "0 auto", width: 40 }} />
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#28a745" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "🎉 Special Offer: Save 30% Today!",
                  fontSize: 24,
                  fontWeight: "bold",
                  padding: 8,
                  alignment: "center",
                  textColor: "#ffffff"
                }
              },
              {
                type: "button",
                overrides: {
                  content: "Claim Offer",
                  backgroundColor: "#ffffff",
                  textColor: "#28a745",
                  fontSize: 16,
                  fontWeight: "600",
                  borderRadius: 6,
                  buttonPaddingX: 32,
                  buttonPaddingY: 12,
                  padding: 16,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      },
      {
        id: "cta-two-button",
        name: "Two Button CTA",
        description: "Primary and secondary actions",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ height: 6, background: "#495057", width: "60%", margin: "0 auto 8px", borderRadius: 2 }} />
              <div className={styles.previewRow} style={{ justifyContent: "center", gap: 4 }}>
                <div style={{ height: 14, background: "#007bff", width: 35, borderRadius: 3 }} />
                <div style={{ height: 14, background: "#e9ecef", width: 35, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Choose Your Plan",
                  fontSize: 28,
                  fontWeight: "bold",
                  padding: 16,
                  alignment: "center"
                }
              },
              {
                type: "columns",
                overrides: {
                  columns: 2,
                  columnSizes: "50-50",
                  padding: 0
                },
                children: [
                  {
                    type: "button",
                    overrides: {
                      content: "Get Started",
                      backgroundColor: "#007bff",
                      textColor: "#ffffff",
                      fontSize: 16,
                      borderRadius: 6,
                      buttonPaddingX: 28,
                      buttonPaddingY: 12,
                      padding: 8,
                      alignment: "center"
                    }
                  },
                  {
                    type: "button",
                    overrides: {
                      content: "Learn More",
                      backgroundColor: "#ffffff",
                      textColor: "#007bff",
                      fontSize: 16,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: "#007bff",
                      buttonPaddingX: 28,
                      buttonPaddingY: 12,
                      padding: 8,
                      alignment: "center"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "e-commerce",
    title: "E-Commerce",
    description: "Products and pricing",
    icon: ShoppingCart,
    components: [
      {
        id: "ecommerce-product-card",
        name: "Product Card",
        description: "Image, title, price, and CTA button",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div className={styles.previewBlock} style={{ height: 45, background: "#e9ecef" }} />
            <div style={{ padding: "6px 4px" }}>
              <div style={{ height: 6, background: "#495057", width: "70%", marginBottom: 3, borderRadius: 2 }} />
              <div style={{ height: 8, background: "#28a745", width: "30%", marginBottom: 4, borderRadius: 2, fontWeight: "bold" }} />
              <div style={{ height: 12, background: "#007bff", borderRadius: 2 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 24, background: "#ffffff" },
            children: [
              {
                type: "image",
                overrides: {
                  imageUrl: "/img.png",
                  padding: 0,
                  content: "Product image"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Premium Product Name",
                  fontSize: 20,
                  fontWeight: "bold",
                  padding: 12,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "$99.99",
                  fontSize: 28,
                  fontWeight: "bold",
                  padding: 8,
                  alignment: "center",
                  textColor: "#28a745"
                }
              },
              {
                type: "button",
                overrides: {
                  content: "Add to Cart",
                  backgroundColor: "#007bff",
                  textColor: "#ffffff",
                  fontSize: 16,
                  fontWeight: "600",
                  borderRadius: 6,
                  buttonPaddingX: 32,
                  buttonPaddingY: 12,
                  padding: 12,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      },
      {
        id: "ecommerce-three-products",
        name: "Product Grid",
        description: "Three products side by side",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div className={styles.previewRow} style={{ gap: 2 }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: 30, background: "#e9ecef", marginBottom: 2 }} />
                <div style={{ height: 4, background: "#495057", marginBottom: 2, borderRadius: 1 }} />
                <div style={{ height: 4, background: "#28a745", width: "60%", borderRadius: 1 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 30, background: "#e9ecef", marginBottom: 2 }} />
                <div style={{ height: 4, background: "#495057", marginBottom: 2, borderRadius: 1 }} />
                <div style={{ height: 4, background: "#28a745", width: "60%", borderRadius: 1 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 30, background: "#e9ecef", marginBottom: 2 }} />
                <div style={{ height: 4, background: "#495057", marginBottom: 2, borderRadius: 1 }} />
                <div style={{ height: 4, background: "#28a745", width: "60%", borderRadius: 1 }} />
              </div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 24, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Featured Products",
                  fontSize: 28,
                  fontWeight: "bold",
                  padding: 16,
                  alignment: "center"
                }
              },
              {
                type: "columns",
                overrides: {
                  columns: 3,
                  columnSizes: "equal",
                  padding: 0
                },
                children: [
                  {
                    type: "text",
                    overrides: {
                      content: "Product 1\n$49.99",
                      fontSize: 16,
                      padding: 12,
                      alignment: "center"
                    }
                  },
                  {
                    type: "text",
                    overrides: {
                      content: "Product 2\n$59.99",
                      fontSize: 16,
                      padding: 12,
                      alignment: "center"
                    }
                  },
                  {
                    type: "text",
                    overrides: {
                      content: "Product 3\n$69.99",
                      fontSize: 16,
                      padding: 12,
                      alignment: "center"
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "ecommerce-discount-badge",
        name: "Sale Announcement",
        description: "Promotional discount banner",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell} style={{ background: "#dc3545", padding: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "white", fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>SALE</div>
              <div style={{ color: "white", fontSize: 8 }}>Up to 50% OFF</div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 40, background: "#dc3545" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "🔥 FLASH SALE",
                  fontSize: 36,
                  fontWeight: "bold",
                  padding: 8,
                  alignment: "center",
                  textColor: "#ffffff"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Up to 50% OFF on selected items",
                  fontSize: 20,
                  padding: 8,
                  alignment: "center",
                  textColor: "#ffffff"
                }
              },
              {
                type: "button",
                overrides: {
                  content: "Shop Now",
                  backgroundColor: "#ffffff",
                  textColor: "#dc3545",
                  fontSize: 18,
                  fontWeight: "600",
                  borderRadius: 8,
                  buttonPaddingX: 40,
                  buttonPaddingY: 16,
                  padding: 16,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "transactional",
    title: "Transactional",
    description: "Orders and receipts",
    icon: CreditCard,
    components: [
      {
        id: "transactional-order-confirm",
        name: "Order Confirmation",
        description: "Order summary with details",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ padding: 8 }}>
              <div style={{ height: 8, background: "#28a745", width: "50%", marginBottom: 6, borderRadius: 2, display: "flex", alignItems: "center" }}>✓</div>
              <div style={{ height: 4, background: "#495057", width: "90%", marginBottom: 3, borderRadius: 1 }} />
              <div style={{ height: 4, background: "#adb5bd", width: "70%", marginBottom: 4, borderRadius: 1 }} />
              <div style={{ background: "#f8f9fa", padding: 4, borderRadius: 2, marginTop: 4 }}>
                <div style={{ height: 3, background: "#495057", width: "60%", marginBottom: 2, borderRadius: 1 }} />
                <div style={{ height: 3, background: "#adb5bd", width: "50%", borderRadius: 1 }} />
              </div>
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#ffffff" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "✓ Order Confirmed",
                  fontSize: 28,
                  fontWeight: "bold",
                  padding: 8,
                  alignment: "center",
                  textColor: "#28a745"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Thank you for your order! Your order #12345 has been confirmed and will be shipped soon.",
                  fontSize: 16,
                  padding: 16,
                  alignment: "center",
                  textColor: "#495057"
                }
              },
              {
                type: "section",
                overrides: { padding: 24, background: "#f8f9fa" },
                children: [
                  {
                    type: "text",
                    overrides: {
                      content: "Order Details\n\nOrder Number: #12345\nDate: January 1, 2025\nTotal: $99.99",
                      fontSize: 16,
                      padding: 0,
                      alignment: "left"
                    }
                  }
                ]
              },
              {
                type: "button",
                overrides: {
                  content: "Track Order",
                  backgroundColor: "#007bff",
                  textColor: "#ffffff",
                  fontSize: 16,
                  fontWeight: "600",
                  borderRadius: 6,
                  buttonPaddingX: 32,
                  buttonPaddingY: 12,
                  padding: 16,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      },
      {
        id: "transactional-shipping",
        name: "Shipping Update",
        description: "Package tracking notification",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>📦</div>
              <div style={{ height: 6, background: "#495057", width: "70%", margin: "0 auto 4px", borderRadius: 2 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "90%", margin: "0 auto", borderRadius: 1 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#ffffff" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "📦",
                  fontSize: 48,
                  padding: 16,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Your Order Has Shipped!",
                  fontSize: 24,
                  fontWeight: "bold",
                  padding: 8,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Your package is on its way. Track your shipment to see delivery updates.",
                  fontSize: 16,
                  padding: 16,
                  alignment: "center",
                  textColor: "#6c757d"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Tracking Number: 1Z999AA10123456784",
                  fontSize: 14,
                  padding: 8,
                  alignment: "center",
                  fontFamily: "'Courier New', Courier, monospace",
                  background: "#f8f9fa"
                }
              },
              {
                type: "button",
                overrides: {
                  content: "Track Package",
                  backgroundColor: "#007bff",
                  textColor: "#ffffff",
                  fontSize: 16,
                  fontWeight: "600",
                  borderRadius: 6,
                  buttonPaddingX: 32,
                  buttonPaddingY: 12,
                  padding: 16,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      },
      {
        id: "transactional-receipt",
        name: "Payment Receipt",
        description: "Invoice and payment details",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ padding: 8 }}>
              <div style={{ height: 6, background: "#495057", width: "60%", marginBottom: 6, borderRadius: 2 }} />
              <div style={{ background: "#f8f9fa", padding: 6, borderRadius: 2, marginBottom: 4 }}>
                <div style={{ height: 3, background: "#495057", width: "70%", marginBottom: 2, borderRadius: 1 }} />
                <div style={{ height: 3, background: "#adb5bd", width: "60%", marginBottom: 2, borderRadius: 1 }} />
                <div style={{ height: 3, background: "#adb5bd", width: "50%", borderRadius: 1 }} />
              </div>
              <div style={{ height: 6, background: "#28a745", width: "40%", borderRadius: 2, fontWeight: "bold" }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#ffffff" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Payment Receipt",
                  fontSize: 28,
                  fontWeight: "bold",
                  padding: 16,
                  alignment: "center"
                }
              },
              {
                type: "section",
                overrides: { padding: 24, background: "#f8f9fa" },
                children: [
                  {
                    type: "text",
                    overrides: {
                      content: "Invoice #INV-2025-001\n\nItem 1: $49.99\nItem 2: $29.99\nShipping: $9.99\n\nSubtotal: $79.98\nTax: $7.20\nTotal: $97.17",
                      fontSize: 16,
                      padding: 0,
                      alignment: "left",
                      fontFamily: "'Courier New', Courier, monospace"
                    }
                  }
                ]
              },
              {
                type: "text",
                overrides: {
                  content: "✓ Payment Successful",
                  fontSize: 20,
                  fontWeight: "bold",
                  padding: 16,
                  alignment: "center",
                  textColor: "#28a745"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "footer",
    title: "Footer",
    description: "Bottom section elements",
    icon: Layers,
    components: [
      {
        id: "footer-social-links",
        name: "Social + Unsubscribe",
        description: "Social icons with legal links",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div className={styles.previewInlineGroup} style={{ marginBottom: 6, justifyContent: "center" }}>
                <span style={{ fontSize: 12 }}>f</span>
                <span style={{ fontSize: 12 }}>t</span>
                <span style={{ fontSize: 12 }}>in</span>
              </div>
              <div style={{ height: 2, background: "#adb5bd", width: "100%", marginBottom: 3, borderRadius: 1 }} />
              <div style={{ height: 2, background: "#adb5bd", width: "80%", margin: "0 auto", borderRadius: 1 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#2d3748" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Follow Us: Facebook | Twitter | LinkedIn | Instagram",
                  fontSize: 14,
                  padding: 16,
                  alignment: "center",
                  textColor: "#ffffff"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "© 2025 Your Company. All rights reserved.\n\n1234 Street Name, City, State 12345\n\nUnsubscribe | Preferences | Privacy Policy",
                  fontSize: 12,
                  padding: 16,
                  alignment: "center",
                  textColor: "#a0aec0",
                  lineHeight: 1.8
                }
              }
            ]
          }
        ]
      },
      {
        id: "footer-company-info",
        name: "Company Details",
        description: "Address and contact information",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ padding: 8 }}>
              <div style={{ height: 6, background: "#495057", width: "50%", marginBottom: 4, borderRadius: 2 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "90%", marginBottom: 2, borderRadius: 1 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "80%", marginBottom: 2, borderRadius: 1 }} />
              <div style={{ height: 3, background: "#adb5bd", width: "70%", borderRadius: 1 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 32, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Your Company Name",
                  fontSize: 20,
                  fontWeight: "bold",
                  padding: 8,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "1234 Business Street\nCity, State 12345\nUnited States\n\nEmail: hello@company.com\nPhone: (555) 123-4567",
                  fontSize: 14,
                  padding: 16,
                  alignment: "center",
                  textColor: "#6c757d",
                  lineHeight: 1.8
                }
              }
            ]
          }
        ]
      },
      {
        id: "footer-minimal",
        name: "Minimal Footer",
        description: "Simple copyright and links",
        renderPreview: () => (
          <div className={styles.quickAddPreviewShell}>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ height: 3, background: "#adb5bd", width: "70%", margin: "0 auto 3px", borderRadius: 1 }} />
              <div style={{ height: 2, background: "#dee2e6", width: "50%", margin: "0 auto", borderRadius: 1 }} />
            </div>
          </div>
        ),
        blocks: [
          {
            type: "section",
            overrides: { padding: 24, background: "#ffffff" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "© 2025 Company Name. All rights reserved.\n\nPrivacy Policy | Terms of Service | Unsubscribe",
                  fontSize: 12,
                  padding: 8,
                  alignment: "center",
                  textColor: "#adb5bd"
                }
              }
            ]
          }
        ]
      }
    ]
  }
];

export const blockLabels = {
  section: "Section",
  columns: "Columns",
  text: "Text",
  headline: "Headline",
  paragraph: "Paragraph",
  button: "Button",
  image: "Image",
  divider: "Divider",
  "image-table": "Image Table"
};

export const fontSizeOptions = [
  { label: "12px", value: 12 },
  { label: "14px", value: 14 },
  { label: "16px", value: 16 },
  { label: "18px", value: 18 },
  { label: "20px", value: 20 },
  { label: "22px", value: 22 },
  { label: "24px", value: 24 },
  { label: "28px", value: 28 },
  { label: "32px", value: 32 },
  { label: "36px", value: 36 },
  { label: "42px", value: 42 },
  { label: "48px", value: 48 },
];

export const emailSafeFonts = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Palatino", value: "Palatino, 'Palatino Linotype', serif" },
  { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
];

export const defaultQuickAddCategory = quickAddCategories[0];
export const defaultQuickAddItem = defaultQuickAddCategory.components[0];
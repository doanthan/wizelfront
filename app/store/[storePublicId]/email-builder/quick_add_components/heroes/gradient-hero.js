/**
 * Gradient Hero Component
 *
 * A hero section with gradient background and centered text + CTA
 */

export default {
  id: "hero-gradient",
  name: "Gradient Hero",
  category: "hero",
  description: "Hero section with gradient background and centered content",

  renderPreview: (styles) => (
    <div className={styles.quickAddPreviewShell} style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: 24
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div className={styles.previewChip} style={{
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          marginBottom: 8
        }}>
          Headline
        </div>
        <div style={{
          fontSize: 10,
          marginBottom: 8,
          opacity: 0.9
        }}>
          Supporting text
        </div>
        <div className={`${styles.previewChip} ${styles.previewChipStrong}`} style={{
          background: 'white',
          color: '#667eea'
        }}>
          Button
        </div>
      </div>
    </div>
  ),

  generateBlocks: (brandData) => {
    // Extract brand styles
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#667eea';
    const buttonBg = brandData.buttonBackgroundColor || '#ffffff';
    const buttonText = brandData.buttonTextColor || primaryColor;
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, sans-serif';

    return [
      {
        type: "section",
        overrides: {
          padding: 60,
          backgroundColor: primaryColor,
        },
        children: [
          {
            type: "text",
            overrides: {
              content: "Welcome to " + (brandData.brandName || "Our Store"),
              fontSize: 36,
              fontWeight: 700,
              textColor: "#ffffff",
              fontFamily: fontFamily,
              alignment: "center",
            },
          },
          {
            type: "text",
            overrides: {
              content: brandData.brandTagline || "Discover amazing products and exclusive deals",
              fontSize: 18,
              textColor: "#ffffff",
              fontFamily: fontFamily,
              alignment: "center",
            },
          },
          {
            type: "button",
            overrides: {
              text: "Shop Now",
              url: brandData.websiteUrl || "#",
              backgroundColor: buttonBg,
              textColor: buttonText,
              fontFamily: fontFamily,
              alignment: "center",
              borderRadius: brandData.buttonBorderRadius || 50,
            },
          },
        ],
      },
    ];
  },
};

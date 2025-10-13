import styles from '../../email-builder.module.css';

export default {
  id: "cta-centered-button",
  name: "Centered CTA",
  category: "cta",
  description: "Headline with centered button",

  renderPreview: (brandData = {}) => {
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#085B92';
    const buttonBg = brandData.css?.components?.buttons?.[0]?.styles?.['background-color'] || primaryColor;
    const buttonText = brandData.css?.components?.buttons?.[0]?.styles?.color || '#ffffff';
    const buttonRadius = parseInt(brandData.css?.components?.buttons?.[0]?.styles?.['border-radius']) || 8;
    const sectionBg = brandData.secondaryColors?.[0]?.hex || '#ffffff';
    const buttonLabel = brandData.css?.components?.buttons?.[0]?.example?.split('.')[0] || 'Shop Now';

    return (
      <div className={styles.quickAddPreviewShell} style={{ background: sectionBg }}>
        <div style={{ textAlign: "center", padding: 8 }}>
          <div style={{ height: 8, background: "#495057", width: "70%", margin: "0 auto 6px", borderRadius: 2 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "90%", margin: "0 auto 8px", borderRadius: 1 }} />
          <div
            style={{
              height: 16,
              background: buttonBg,
              color: buttonText,
              width: 60,
              margin: "0 auto",
              borderRadius: `${Math.min(buttonRadius / 2, 8)}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 600
            }}
          >
            {buttonLabel}
          </div>
        </div>
      </div>
    );
  },

  generateBlocks: (brandData = {}) => {
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#085B92';
    const buttonBg = brandData.css?.components?.buttons?.[0]?.styles?.['background-color'] || primaryColor;
    const buttonText = brandData.css?.components?.buttons?.[0]?.styles?.color || '#ffffff';
    const buttonRadius = parseInt(brandData.css?.components?.buttons?.[0]?.styles?.['border-radius']) || brandData.buttonBorderRadius || 8;
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, Helvetica, sans-serif';

    // Parse button padding
    let paddingX = 40;
    let paddingY = 16;
    const buttonPadding = brandData.css?.components?.buttons?.[0]?.styles?.padding;
    if (buttonPadding) {
      const paddingParts = buttonPadding.split(' ');
      if (paddingParts.length === 2) {
        paddingY = parseInt(paddingParts[0]) || 16;
        paddingX = parseInt(paddingParts[1]) || 40;
      }
    }

    // Get brand-specific CTA text or use defaults
    const headlineText = "Ready to Get Started?";
    const subheadText = "Join thousands of satisfied customers today.";
    const buttonCTA = brandData.css?.components?.buttons?.[0]?.example || "Shop Now";

    return [
      {
        type: "section",
        overrides: {
          padding: 48,
          backgroundColor: brandData.secondaryColors?.[0]?.hex || "#ffffff"
        },
        children: [
          {
            type: "text",
            overrides: {
              content: headlineText,
              fontSize: 32,
              fontWeight: "bold",
              padding: 8,
              alignment: "center",
              fontFamily: fontFamily,
              textColor: brandData.brandFontColor || primaryColor
            }
          },
          {
            type: "text",
            overrides: {
              content: subheadText,
              fontSize: 18,
              padding: 8,
              alignment: "center",
              fontFamily: fontFamily,
              textColor: brandData.brandFontColor || "#6c757d"
            }
          },
          {
            type: "button",
            overrides: {
              content: buttonCTA,
              backgroundColor: buttonBg,
              textColor: buttonText,
              fontSize: parseInt(brandData.css?.components?.buttons?.[0]?.styles?.['font-size']) || 18,
              fontWeight: brandData.css?.components?.buttons?.[0]?.styles?.['font-weight'] || "600",
              fontFamily: fontFamily,
              borderRadius: buttonRadius,
              buttonPaddingX: paddingX,
              buttonPaddingY: paddingY,
              padding: 16,
              alignment: "center"
            }
          }
        ]
      }
    ];
  }
};

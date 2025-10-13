import styles from '../../email-builder.module.css';

export default {
  id: "header-centered",
  name: "Centered Logo",
  category: "header",
  description: "Centered brand with optional tagline",

  renderPreview: (brandData = {}) => {
    const logoUrl = brandData.logo?.primary_logo_url || brandData.scrapedLogoUrl;
    const brandName = brandData.brandName || brandData.name || 'Logo';
    const tagline = brandData.brandTagline || 'tagline';
    const headerBg = brandData.headerBackgroundColor || brandData.secondaryColors?.[0]?.hex || '#f8f9fa';

    return (
      <div className={styles.quickAddPreviewShell} style={{ background: headerBg }}>
        <div className={`${styles.previewRow} ${styles.previewRowCenter}`}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              style={{
                maxWidth: '80px',
                maxHeight: '30px',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div className={`${styles.previewChip} ${styles.previewChipStrong}`}>{brandName}</div>
          )}
        </div>
        <div className={`${styles.previewRow} ${styles.previewRowCenter}`}>
          <span style={{ fontSize: 10, opacity: 0.6 }}>{tagline}</span>
        </div>
      </div>
    );
  },

  generateBlocks: (brandData = {}) => {
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#085B92';
    const headerBgColor = brandData.headerBackgroundColor || brandData.secondaryColors?.[0]?.hex || '#FFFAF4';
    const brandName = brandData.brandName || brandData.name || 'YOUR BRAND';
    const tagline = brandData.brandTagline || 'Elevating your experience';
    const logoUrl = brandData.logo?.primary_logo_url || brandData.scrapedLogoUrl;
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, Helvetica, sans-serif';

    const blocks = [
      {
        type: "section",
        overrides: {
          padding: 32,
          backgroundColor: headerBgColor
        },
        children: []
      }
    ];

    // Add logo if available, otherwise use brand name
    if (logoUrl) {
      blocks[0].children.push({
        type: "image",
        overrides: {
          imageUrl: logoUrl,  // Use imageUrl instead of src
          content: brandData.logo?.logo_alt_text || brandName, // Alt text goes in content
          alignment: brandData.logoAlignment || "center",
          padding: 8
        }
      });
    } else {
      blocks[0].children.push({
        type: "text",
        overrides: {
          content: brandName,
          alignment: "center",
          fontSize: 28,
          fontWeight: "bold",
          padding: 8,
          fontFamily: fontFamily,
          textColor: brandData.brandFontColor || primaryColor
        }
      });
    }

    // Add tagline if available
    if (tagline) {
      blocks[0].children.push({
        type: "text",
        overrides: {
          content: tagline,
          alignment: "center",
          fontSize: 14,
          padding: 0,
          fontFamily: fontFamily,
          textColor: brandData.brandFontColor || "#6c757d"
        }
      });
    }

    return blocks;
  }
};

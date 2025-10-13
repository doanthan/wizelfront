import styles from '../../email-builder.module.css';

export default {
  id: "header-logo-nav",
  name: "Logo + Nav Links",
  category: "header",
  description: "Brand mark on the left with top navigation links",

  renderPreview: (brandData = {}) => {
    const logoUrl = brandData.logo?.primary_logo_url || brandData.scrapedLogoUrl;
    const brandName = brandData.brandName || brandData.name || 'Logo';
    const headerBg = brandData.headerBackgroundColor || brandData.secondaryColors?.[0]?.hex || '#ffffff';
    const headerLinks = brandData.headerLinks || [];
    const linkText = headerLinks.length > 0
      ? headerLinks.slice(0, 3).map(link => link.text.replace('.', '')).join(' • ')
      : 'Home • Shop • About';

    return (
      <div className={styles.quickAddPreviewShell} style={{ background: headerBg }}>
        <div className={styles.previewRow} style={{ justifyContent: 'center', gap: '8px', flexDirection: 'column' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              style={{
                maxWidth: '60px',
                maxHeight: '24px',
                objectFit: 'contain',
                marginBottom: '4px'
              }}
            />
          ) : (
            <div className={`${styles.previewChip} ${styles.previewChipStrong}`}>{brandName}</div>
          )}
          <div style={{ fontSize: 9, opacity: 0.7, textAlign: 'center' }}>
            {linkText}
          </div>
        </div>
      </div>
    );
  },

  generateBlocks: (brandData = {}) => {
    const headerBgColor = brandData.headerBackgroundColor || brandData.secondaryColors?.[0]?.hex || '#ffffff';
    const brandName = brandData.brandName || brandData.name || 'YOUR BRAND';
    const logoUrl = brandData.logo?.primary_logo_url || brandData.scrapedLogoUrl;
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, Helvetica, sans-serif';

    // Get header links from brand data
    const headerLinks = brandData.headerLinks || [];
    const linkText = headerLinks.length > 0
      ? headerLinks.map(link => link.text.replace('.', '')).join(' • ')
      : 'Home • Shop • About • Contact';

    const blocks = [
      {
        type: "section",
        overrides: { padding: 24, backgroundColor: headerBgColor },
        children: []
      }
    ];

    // Build content with logo/brand name and navigation
    let headerContent = '';

    if (logoUrl) {
      // If there's a logo, add it as an image block first, then nav links
      blocks[0].children.push({
        type: "image",
        overrides: {
          imageUrl: logoUrl,  // Use imageUrl instead of src
          content: brandData.logo?.logo_alt_text || brandName, // Alt text goes in content
          alignment: "center",
          padding: 4
        }
      });

      // Add nav links below logo
      blocks[0].children.push({
        type: "text",
        overrides: {
          content: linkText,
          fontSize: 14,
          padding: 8,
          alignment: "center",
          fontFamily: fontFamily,
          textColor: brandData.brandFontColor || "#4e4451"
        }
      });
    } else {
      // No logo, combine brand name with nav links
      headerContent = `${brandName} | ${linkText}`;
      blocks[0].children.push({
        type: "text",
        overrides: {
          content: headerContent,
          fontSize: 16,
          padding: 0,
          alignment: "center",
          fontFamily: fontFamily,
          textColor: brandData.brandFontColor || "#000000"
        }
      });
    }

    return blocks;
  }
};

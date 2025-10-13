import styles from '../../email-builder.module.css';

export default {
  id: "footer-minimal",
  name: "Minimal Footer",
  category: "footer",
  description: "Simple copyright and links",

  renderPreview: (brandData = {}) => {
    const brandName = brandData.brandName || brandData.name || 'Company';
    const footerBg = brandData.secondaryColors?.[0]?.hex || '#ffffff';
    const currentYear = new Date().getFullYear();

    return (
      <div className={styles.quickAddPreviewShell} style={{ background: footerBg }}>
        <div style={{ textAlign: "center", padding: 8 }}>
          <div style={{
            fontSize: 8,
            color: "#adb5bd",
            marginBottom: 3
          }}>
            © {currentYear} {brandName}
          </div>
          <div style={{ height: 2, background: "#dee2e6", width: "50%", margin: "0 auto", borderRadius: 1 }} />
        </div>
      </div>
    );
  },

  generateBlocks: (brandData = {}) => {
    const brandName = brandData.brandName || brandData.name || 'Company Name';
    const currentYear = new Date().getFullYear();
    const footerBg = brandData.secondaryColors?.[0]?.hex || '#ffffff';
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, Helvetica, sans-serif';

    const footerText = `© ${currentYear} ${brandName}. All rights reserved.\n\nPrivacy Policy | Terms of Service | Unsubscribe`;

    return [
      {
        type: "section",
        overrides: { padding: 24, backgroundColor: footerBg },
        children: [
          {
            type: "text",
            overrides: {
              content: footerText,
              fontSize: 12,
              padding: 8,
              alignment: "center",
              fontFamily: fontFamily,
              textColor: "#adb5bd"
            }
          }
        ]
      }
    ];
  }
};

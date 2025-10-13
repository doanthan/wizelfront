import styles from '../../email-builder.module.css';

export default {
  id: "footer-company-info",
  name: "Company Details",
  category: "footer",
  description: "Address and contact information",

  renderPreview: (brandData = {}) => {
    const brandName = brandData.brandName || brandData.name || 'Company Name';
    const footerBg = brandData.secondaryColors?.[0]?.hex || '#f8f9fa';

    return (
      <div className={styles.quickAddPreviewShell} style={{ background: footerBg }}>
        <div style={{ padding: 8, textAlign: 'center' }}>
          <div style={{
            fontSize: 10,
            fontWeight: 'bold',
            marginBottom: 4,
            color: brandData.brandFontColor || '#495057'
          }}>
            {brandName}
          </div>
          <div style={{ height: 3, background: "#adb5bd", width: "90%", margin: "0 auto 2px", borderRadius: 1 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "80%", margin: "0 auto 2px", borderRadius: 1 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "70%", margin: "0 auto", borderRadius: 1 }} />
        </div>
      </div>
    );
  },

  generateBlocks: (brandData = {}) => {
    const brandName = brandData.brandName || brandData.name || 'Your Company Name';
    const address = brandData.footerAddress || '1234 Business Street, City, State 12345, United States';
    const footerBg = brandData.secondaryColors?.[0]?.hex || '#f8f9fa';
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#085B92';
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, Helvetica, sans-serif';

    // Build contact info
    const contactInfo = `${address}\n\nEmail: hello@company.com\nPhone: (555) 123-4567`;

    return [
      {
        type: "section",
        overrides: { padding: 32, backgroundColor: footerBg },
        children: [
          {
            type: "text",
            overrides: {
              content: brandName,
              fontSize: 20,
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
              content: contactInfo,
              fontSize: 14,
              padding: 16,
              alignment: "center",
              fontFamily: fontFamily,
              textColor: brandData.brandFontColor || "#6c757d",
              lineHeight: 1.8
            }
          }
        ]
      }
    ];
  }
};

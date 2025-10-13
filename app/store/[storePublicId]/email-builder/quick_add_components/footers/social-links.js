import styles from '../../email-builder.module.css';

export default {
  id: "footer-social-links",
  name: "Social + Unsubscribe",
  category: "footer",
  description: "Social icons with legal links",

  renderPreview: (brandData = {}) => {
    const footerBg = brandData.secondaryColors?.[1]?.hex || '#2d3748';
    const socialLinks = brandData.socialLinks || [];
    const socialIcons = socialLinks.slice(0, 3).map(link => {
      if (link.platform === 'facebook' || link.platform === 'Facebook') return 'f';
      if (link.platform === 'instagram' || link.platform === 'Instagram') return 'i';
      if (link.platform === 'twitter' || link.platform === 'Twitter' || link.platform === 'X') return 'x';
      if (link.platform === 'tiktok' || link.platform === 'TikTok') return 'T';
      return link.platform?.[0] || '•';
    });

    return (
      <div className={styles.quickAddPreviewShell} style={{ background: footerBg }}>
        <div style={{ textAlign: "center", padding: 8 }}>
          <div className={styles.previewInlineGroup} style={{ marginBottom: 6, justifyContent: "center" }}>
            {socialIcons.length > 0 ? (
              socialIcons.map((icon, i) => (
                <span key={i} style={{ fontSize: 12, color: '#fff' }}>{icon}</span>
              ))
            ) : (
              <>
                <span style={{ fontSize: 12, color: '#fff' }}>f</span>
                <span style={{ fontSize: 12, color: '#fff' }}>t</span>
                <span style={{ fontSize: 12, color: '#fff' }}>i</span>
              </>
            )}
          </div>
          <div style={{ height: 2, background: "#a0aec0", width: "100%", marginBottom: 3, borderRadius: 1 }} />
          <div style={{ height: 2, background: "#a0aec0", width: "80%", margin: "0 auto", borderRadius: 1 }} />
        </div>
      </div>
    );
  },

  generateBlocks: (brandData = {}) => {
    const primaryColor = brandData.primaryColor?.[0]?.hex || '#085B92';
    const footerBg = brandData.secondaryColors?.[1]?.hex || '#2d3748';
    const brandName = brandData.brandName || brandData.name || 'Your Company';
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, Helvetica, sans-serif';

    // Build social links text from brand data
    const socialLinks = brandData.socialLinks || [];
    const socialText = socialLinks.length > 0
      ? `Follow Us: ${socialLinks.map(link => link.name).join(' | ')}`
      : 'Follow Us: Facebook | Twitter | LinkedIn | Instagram';

    // Build footer address and legal text
    const address = brandData.footerAddress || '1234 Street Name, City, State 12345';
    const currentYear = new Date().getFullYear();
    const footerLegal = `© ${currentYear} ${brandName}. All rights reserved.\n\n${address}\n\nUnsubscribe | Preferences | Privacy Policy`;

    return [
      {
        type: "section",
        overrides: { padding: 32, backgroundColor: footerBg },
        children: [
          {
            type: "text",
            overrides: {
              content: socialText,
              fontSize: 14,
              padding: 16,
              alignment: "center",
              fontFamily: fontFamily,
              textColor: "#ffffff"
            }
          },
          {
            type: "text",
            overrides: {
              content: footerLegal,
              fontSize: 12,
              padding: 16,
              alignment: "center",
              fontFamily: fontFamily,
              textColor: "#a0aec0",
              lineHeight: 1.8
            }
          }
        ]
      }
    ];
  }
};

/**
 * Social Footer Component
 *
 * A footer with social media icons and copyright text
 */

export default {
  id: "footer-social",
  name: "Social Footer",
  category: "footer",
  description: "Footer with social media links and copyright",

  renderPreview: (styles) => (
    <div className={styles.quickAddPreviewShell} style={{
      background: "#f3f4f6",
      padding: 16,
      textAlign: 'center'
    }}>
      <div className={styles.previewInlineGroup} style={{
        marginBottom: 8,
        justifyContent: 'center'
      }}>
        <span style={{ width: 20, height: 20 }} />
        <span style={{ width: 20, height: 20 }} />
        <span style={{ width: 20, height: 20 }} />
        <span style={{ width: 20, height: 20 }} />
      </div>
      <div style={{ fontSize: 9, opacity: 0.6 }}>© 2024 Company Name</div>
    </div>
  ),

  generateBlocks: (brandData) => {
    // Extract brand styles
    const footerBg = brandData.secondaryColors?.[0]?.hex || '#f3f4f6';
    const textColor = brandData.brandFontColor || '#6b7280';
    const fontFamily = brandData.customFontFamily
      ? `${brandData.customFontFamily}, ${brandData.emailFallbackFont || 'Arial'}, sans-serif`
      : brandData.emailFallbackFont || 'Arial, sans-serif';

    // Build social links text
    const socialLinks = [];
    if (brandData.socialFacebook) socialLinks.push('[Facebook](' + brandData.socialFacebook + ')');
    if (brandData.socialInstagram) socialLinks.push('[Instagram](' + brandData.socialInstagram + ')');
    if (brandData.socialTwitterX) socialLinks.push('[Twitter](' + brandData.socialTwitterX + ')');
    if (brandData.socialLinkedIn) socialLinks.push('[LinkedIn](' + brandData.socialLinkedIn + ')');

    const socialText = socialLinks.length > 0
      ? socialLinks.join(' | ')
      : 'Follow us on social media';

    const footerText = brandData.footerAddress || `© ${new Date().getFullYear()} ${brandData.brandName || 'Company Name'}. All rights reserved.`;

    return [
      {
        type: "section",
        overrides: {
          padding: 32,
          backgroundColor: footerBg,
        },
        children: [
          {
            type: "text",
            overrides: {
              content: socialText,
              fontSize: 14,
              textColor: textColor,
              fontFamily: fontFamily,
              alignment: "center",
            },
          },
          {
            type: "divider",
            overrides: {
              dividerStyle: "line",
              dividerColor: textColor,
              dividerHeight: 1,
              dividerWidth: 50,
            },
          },
          {
            type: "text",
            overrides: {
              content: footerText,
              fontSize: 12,
              textColor: textColor,
              fontFamily: fontFamily,
              alignment: "center",
            },
          },
        ],
      },
    ];
  },
};

import styles from '../../email-builder.module.css';

export default {
  id: "cta-banner",
  name: "Promotional Banner",
  category: "cta",
  description: "Full-width promo with button",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell} style={{ background: "#28a745", padding: 8 }}>
      <div style={{ color: "white", fontSize: 10, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>Limited Offer</div>
      <div style={{ height: 12, background: "rgba(255,255,255,0.9)", borderRadius: 2, margin: "0 auto", width: 40 }} />
    </div>
  ),

  generateBlocks: (brandData = {}) => {
    return [
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
    ];
  }
};

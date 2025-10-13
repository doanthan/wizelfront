import styles from '../../email-builder.module.css';

export default {
  id: "ecommerce-discount-badge",
  name: "Sale Announcement",
  category: "product",
  description: "Promotional discount banner",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell} style={{ background: "#dc3545", padding: 8 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "white", fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>SALE</div>
        <div style={{ color: "white", fontSize: 8 }}>Up to 50% OFF</div>
      </div>
    </div>
  ),

  generateBlocks: (brandData = {}) => {
    return [
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
    ];
  }
};

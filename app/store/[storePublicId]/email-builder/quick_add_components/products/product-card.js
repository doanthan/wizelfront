import styles from '../../email-builder.module.css';

export default {
  id: "ecommerce-product-card",
  name: "Product Card",
  category: "product",
  description: "Image, title, price, and CTA button",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div className={styles.previewBlock} style={{ height: 45, background: "#e9ecef" }} />
      <div style={{ padding: "6px 4px" }}>
        <div style={{ height: 6, background: "#495057", width: "70%", marginBottom: 3, borderRadius: 2 }} />
        <div style={{ height: 8, background: "#28a745", width: "30%", marginBottom: 4, borderRadius: 2, fontWeight: "bold" }} />
        <div style={{ height: 12, background: "#007bff", borderRadius: 2 }} />
      </div>
    </div>
  ),

  generateBlocks: (brandData = {}) => {
    return [
      {
        type: "section",
        overrides: { padding: 24, background: "#ffffff" },
        children: [
          {
            type: "image",
            overrides: {
              imageUrl: "/img.png",
              padding: 0,
              content: "Product image"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Premium Product Name",
              fontSize: 20,
              fontWeight: "bold",
              padding: 12,
              alignment: "center"
            }
          },
          {
            type: "text",
            overrides: {
              content: "$99.99",
              fontSize: 28,
              fontWeight: "bold",
              padding: 8,
              alignment: "center",
              textColor: "#28a745"
            }
          },
          {
            type: "button",
            overrides: {
              content: "Add to Cart",
              backgroundColor: "#007bff",
              textColor: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              borderRadius: 6,
              buttonPaddingX: 32,
              buttonPaddingY: 12,
              padding: 12,
              alignment: "center"
            }
          }
        ]
      }
    ];
  }
};

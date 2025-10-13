import styles from '../../email-builder.module.css';

export default {
  id: "transactional-order-confirm",
  name: "Order Confirmation",
  category: "transactional",
  description: "Order summary with details",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div style={{ padding: 8 }}>
        <div style={{ height: 8, background: "#28a745", width: "50%", marginBottom: 6, borderRadius: 2, display: "flex", alignItems: "center" }}>✓</div>
        <div style={{ height: 4, background: "#495057", width: "90%", marginBottom: 3, borderRadius: 1 }} />
        <div style={{ height: 4, background: "#adb5bd", width: "70%", marginBottom: 4, borderRadius: 1 }} />
        <div style={{ background: "#f8f9fa", padding: 4, borderRadius: 2, marginTop: 4 }}>
          <div style={{ height: 3, background: "#495057", width: "60%", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "50%", borderRadius: 1 }} />
        </div>
      </div>
    </div>
  ),

  generateBlocks: (brandData = {}) => {
    return [
      {
        type: "section",
        overrides: { padding: 32, background: "#ffffff" },
        children: [
          {
            type: "text",
            overrides: {
              content: "✓ Order Confirmed",
              fontSize: 28,
              fontWeight: "bold",
              padding: 8,
              alignment: "center",
              textColor: "#28a745"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Thank you for your order! Your order #12345 has been confirmed and will be shipped soon.",
              fontSize: 16,
              padding: 16,
              alignment: "center",
              textColor: "#495057"
            }
          },
          {
            type: "section",
            overrides: { padding: 24, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Order Details\n\nOrder Number: #12345\nDate: January 1, 2025\nTotal: $99.99",
                  fontSize: 16,
                  padding: 0,
                  alignment: "left"
                }
              }
            ]
          },
          {
            type: "button",
            overrides: {
              content: "Track Order",
              backgroundColor: "#007bff",
              textColor: "#ffffff",
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

import styles from '../../email-builder.module.css';

export default {
  id: "transactional-shipping",
  name: "Shipping Update",
  category: "transactional",
  description: "Package tracking notification",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div style={{ textAlign: "center", padding: 8 }}>
        <div style={{ fontSize: 20, marginBottom: 4 }}>📦</div>
        <div style={{ height: 6, background: "#495057", width: "70%", margin: "0 auto 4px", borderRadius: 2 }} />
        <div style={{ height: 3, background: "#adb5bd", width: "90%", margin: "0 auto", borderRadius: 1 }} />
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
              content: "📦",
              fontSize: 48,
              padding: 16,
              alignment: "center"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Your Order Has Shipped!",
              fontSize: 24,
              fontWeight: "bold",
              padding: 8,
              alignment: "center"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Your package is on its way. Track your shipment to see delivery updates.",
              fontSize: 16,
              padding: 16,
              alignment: "center",
              textColor: "#6c757d"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Tracking Number: 1Z999AA10123456784",
              fontSize: 14,
              padding: 8,
              alignment: "center",
              fontFamily: "'Courier New', Courier, monospace",
              background: "#f8f9fa"
            }
          },
          {
            type: "button",
            overrides: {
              content: "Track Package",
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

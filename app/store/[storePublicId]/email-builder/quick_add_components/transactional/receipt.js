import styles from '../../email-builder.module.css';

export default {
  id: "transactional-receipt",
  name: "Payment Receipt",
  category: "transactional",
  description: "Invoice and payment details",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div style={{ padding: 8 }}>
        <div style={{ height: 6, background: "#495057", width: "60%", marginBottom: 6, borderRadius: 2 }} />
        <div style={{ background: "#f8f9fa", padding: 6, borderRadius: 2, marginBottom: 4 }}>
          <div style={{ height: 3, background: "#495057", width: "70%", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "60%", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "50%", borderRadius: 1 }} />
        </div>
        <div style={{ height: 6, background: "#28a745", width: "40%", borderRadius: 2, fontWeight: "bold" }} />
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
              content: "Payment Receipt",
              fontSize: 28,
              fontWeight: "bold",
              padding: 16,
              alignment: "center"
            }
          },
          {
            type: "section",
            overrides: { padding: 24, background: "#f8f9fa" },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Invoice #INV-2025-001\n\nItem 1: $49.99\nItem 2: $29.99\nShipping: $9.99\n\nSubtotal: $79.98\nTax: $7.20\nTotal: $97.17",
                  fontSize: 16,
                  padding: 0,
                  alignment: "left",
                  fontFamily: "'Courier New', Courier, monospace"
                }
              }
            ]
          },
          {
            type: "text",
            overrides: {
              content: "✓ Payment Successful",
              fontSize: 20,
              fontWeight: "bold",
              padding: 16,
              alignment: "center",
              textColor: "#28a745"
            }
          }
        ]
      }
    ];
  }
};

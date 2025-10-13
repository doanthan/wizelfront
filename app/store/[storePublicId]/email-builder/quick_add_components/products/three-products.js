import styles from '../../email-builder.module.css';

export default {
  id: "ecommerce-three-products",
  name: "Product Grid",
  category: "product",
  description: "Three products side by side",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div className={styles.previewRow} style={{ gap: 2 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 30, background: "#e9ecef", marginBottom: 2 }} />
          <div style={{ height: 4, background: "#495057", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 4, background: "#28a745", width: "60%", borderRadius: 1 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 30, background: "#e9ecef", marginBottom: 2 }} />
          <div style={{ height: 4, background: "#495057", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 4, background: "#28a745", width: "60%", borderRadius: 1 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 30, background: "#e9ecef", marginBottom: 2 }} />
          <div style={{ height: 4, background: "#495057", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 4, background: "#28a745", width: "60%", borderRadius: 1 }} />
        </div>
      </div>
    </div>
  ),

  generateBlocks: (brandData = {}) => {
    return [
      {
        type: "section",
        overrides: { padding: 24, background: "#f8f9fa" },
        children: [
          {
            type: "text",
            overrides: {
              content: "Featured Products",
              fontSize: 28,
              fontWeight: "bold",
              padding: 16,
              alignment: "center"
            }
          },
          {
            type: "columns",
            overrides: {
              columns: 3,
              columnSizes: "equal",
              padding: 0
            },
            children: [
              {
                type: "text",
                overrides: {
                  content: "Product 1\n$49.99",
                  fontSize: 16,
                  padding: 12,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Product 2\n$59.99",
                  fontSize: 16,
                  padding: 12,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Product 3\n$69.99",
                  fontSize: 16,
                  padding: 12,
                  alignment: "center"
                }
              }
            ]
          }
        ]
      }
    ];
  }
};

import styles from '../../email-builder.module.css';

export default {
  id: "cta-two-button",
  name: "Two Button CTA",
  category: "cta",
  description: "Primary and secondary actions",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div style={{ textAlign: "center", padding: 8 }}>
        <div style={{ height: 6, background: "#495057", width: "60%", margin: "0 auto 8px", borderRadius: 2 }} />
        <div className={styles.previewRow} style={{ justifyContent: "center", gap: 4 }}>
          <div style={{ height: 14, background: "#007bff", width: 35, borderRadius: 3 }} />
          <div style={{ height: 14, background: "#e9ecef", width: 35, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  ),

  generateBlocks: (brandData = {}) => {
    return [
      {
        type: "section",
        overrides: { padding: 32, background: "#f8f9fa" },
        children: [
          {
            type: "text",
            overrides: {
              content: "Choose Your Plan",
              fontSize: 28,
              fontWeight: "bold",
              padding: 16,
              alignment: "center"
            }
          },
          {
            type: "columns",
            overrides: {
              columns: 2,
              columnSizes: "50-50",
              padding: 0
            },
            children: [
              {
                type: "button",
                overrides: {
                  content: "Get Started",
                  backgroundColor: "#007bff",
                  textColor: "#ffffff",
                  fontSize: 16,
                  borderRadius: 6,
                  buttonPaddingX: 28,
                  buttonPaddingY: 12,
                  padding: 8,
                  alignment: "center"
                }
              },
              {
                type: "button",
                overrides: {
                  content: "Learn More",
                  backgroundColor: "#ffffff",
                  textColor: "#007bff",
                  fontSize: 16,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: "#007bff",
                  buttonPaddingX: 28,
                  buttonPaddingY: 12,
                  padding: 8,
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

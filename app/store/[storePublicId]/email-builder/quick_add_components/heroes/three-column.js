import styles from '../../email-builder.module.css';

export default {
  id: "feature-three-column",
  name: "Three Feature Grid",
  category: "hero",
  description: "Three features side by side",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div className={styles.previewRow}>
        <div style={{ width: "32%", textAlign: "center" }}>
          <div className={styles.previewChip} style={{ margin: "0 auto 4px" }}>✓</div>
          <div style={{ height: 3, background: "#495057", margin: "0 auto 2px", width: "80%", borderRadius: 1 }} />
        </div>
        <div style={{ width: "32%", textAlign: "center" }}>
          <div className={styles.previewChip} style={{ margin: "0 auto 4px" }}>✓</div>
          <div style={{ height: 3, background: "#495057", margin: "0 auto 2px", width: "80%", borderRadius: 1 }} />
        </div>
        <div style={{ width: "32%", textAlign: "center" }}>
          <div className={styles.previewChip} style={{ margin: "0 auto 4px" }}>✓</div>
          <div style={{ height: 3, background: "#495057", margin: "0 auto 2px", width: "80%", borderRadius: 1 }} />
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
                  content: "✓\n\nFeature One\n\nDescribe your first key feature here.",
                  fontSize: 16,
                  padding: 16,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "✓\n\nFeature Two\n\nDescribe your second key feature here.",
                  fontSize: 16,
                  padding: 16,
                  alignment: "center"
                }
              },
              {
                type: "text",
                overrides: {
                  content: "✓\n\nFeature Three\n\nDescribe your third key feature here.",
                  fontSize: 16,
                  padding: 16,
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

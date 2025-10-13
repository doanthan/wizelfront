import styles from '../../email-builder.module.css';

export default {
  id: "feature-icon-list",
  name: "Feature List",
  category: "hero",
  description: "Vertical list of features with icons",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div style={{ padding: 4 }}>
        <div className={styles.previewRow} style={{ marginBottom: 4 }}>
          <div className={styles.previewChip}>✓</div>
          <div style={{ flex: 1, height: 4, background: "#495057", borderRadius: 1, marginLeft: 4 }} />
        </div>
        <div className={styles.previewRow} style={{ marginBottom: 4 }}>
          <div className={styles.previewChip}>✓</div>
          <div style={{ flex: 1, height: 4, background: "#495057", borderRadius: 1, marginLeft: 4 }} />
        </div>
        <div className={styles.previewRow}>
          <div className={styles.previewChip}>✓</div>
          <div style={{ flex: 1, height: 4, background: "#495057", borderRadius: 1, marginLeft: 4 }} />
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
              content: "✓ Premium Quality Materials\n✓ Free Shipping Worldwide\n✓ 30-Day Money Back Guarantee",
              fontSize: 16,
              padding: 16,
              alignment: "left",
              lineHeight: 1.8
            }
          }
        ]
      }
    ];
  }
};

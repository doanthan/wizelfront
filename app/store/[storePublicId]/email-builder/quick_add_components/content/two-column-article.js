import styles from '../../email-builder.module.css';

export default {
  id: "content-two-column-article",
  name: "Two Column Article",
  category: "content",
  description: "Side-by-side image and text",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div className={styles.previewRow}>
        <div className={styles.previewBlock} style={{ width: "45%", height: 50, background: "#e9ecef" }} />
        <div style={{ width: "55%", paddingLeft: 4 }}>
          <div style={{ height: 6, background: "#495057", width: "90%", marginBottom: 3, borderRadius: 2 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "100%", marginBottom: 2, borderRadius: 1 }} />
          <div style={{ height: 3, background: "#adb5bd", width: "85%", borderRadius: 1 }} />
        </div>
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
            type: "columns",
            overrides: {
              columns: 2,
              columnSizes: "50-50",
              padding: 0
            },
            children: [
              {
                type: "image",
                overrides: {
                  imageUrl: "/img.png",
                  padding: 0
                }
              },
              {
                type: "text",
                overrides: {
                  content: "Article Title\n\nYour article content goes here with a compelling description that engages readers.",
                  fontSize: 16,
                  padding: 16,
                  alignment: "left"
                }
              }
            ]
          }
        ]
      }
    ];
  }
};

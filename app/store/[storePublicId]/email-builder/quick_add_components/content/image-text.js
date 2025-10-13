import styles from '../../email-builder.module.css';

export default {
  id: "content-image-text",
  name: "Image + Text Card",
  category: "content",
  description: "Image above with text content below",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div className={styles.previewBlock} style={{ height: 40, background: "#e9ecef" }} />
      <div style={{ padding: "8px 4px" }}>
        <div style={{ height: 8, background: "#495057", width: "80%", marginBottom: 4, borderRadius: 2 }} />
        <div style={{ height: 4, background: "#adb5bd", width: "100%", marginBottom: 2, borderRadius: 1 }} />
        <div style={{ height: 4, background: "#adb5bd", width: "90%", borderRadius: 1 }} />
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
              content: "Featured image"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Your Headline Here",
              fontSize: 24,
              fontWeight: "bold",
              padding: 16,
              alignment: "left"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Add your article content here. This layout works great for newsletters, blog updates, and feature announcements.",
              fontSize: 16,
              padding: 0,
              alignment: "left",
              textColor: "#495057"
            }
          }
        ]
      }
    ];
  }
};

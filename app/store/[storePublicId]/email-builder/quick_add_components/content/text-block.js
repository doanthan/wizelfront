import styles from '../../email-builder.module.css';

export default {
  id: "content-text-block",
  name: "Text Content Block",
  category: "content",
  description: "Simple formatted text section",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell}>
      <div style={{ padding: 8 }}>
        <div style={{ height: 8, background: "#495057", width: "70%", marginBottom: 6, borderRadius: 2 }} />
        <div style={{ height: 3, background: "#adb5bd", width: "100%", marginBottom: 2, borderRadius: 1 }} />
        <div style={{ height: 3, background: "#adb5bd", width: "95%", marginBottom: 2, borderRadius: 1 }} />
        <div style={{ height: 3, background: "#adb5bd", width: "85%", borderRadius: 1 }} />
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
              content: "Section Title\n\nYour content goes here. Use this for announcements, updates, or any text-based communication.",
              fontSize: 16,
              padding: 0,
              alignment: "left"
            }
          }
        ]
      }
    ];
  }
};

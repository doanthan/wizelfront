import styles from '../../email-builder.module.css';

export default {
  id: "feature-hero-image",
  name: "Hero Feature Card",
  category: "hero",
  description: "Large image with overlay text (like Game On example)",

  renderPreview: () => (
    <div className={styles.quickAddPreviewShell} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 12, borderRadius: 4 }}>
      <div style={{ color: "white", fontSize: 8, marginBottom: 4, opacity: 0.9 }}>Discover</div>
      <div style={{ color: "white", fontSize: 12, fontWeight: "bold", marginBottom: 6 }}>BIG BOLD<br/>HEADLINE</div>
      <div style={{ height: 12, background: "rgba(255,255,255,0.9)", borderRadius: 2, width: 40 }} />
    </div>
  ),

  generateBlocks: (brandData = {}) => {
    return [
      {
        type: "section",
        overrides: {
          padding: 0,
          background: "#2d3748"
        },
        children: [
          {
            type: "image",
            overrides: {
              imageUrl: "/img.png",
              padding: 0,
              content: "Hero background image"
            }
          },
          {
            type: "text",
            overrides: {
              content: "Unlock pro tips, premium gear, and training to level up your game!",
              fontSize: 16,
              padding: 24,
              alignment: "left",
              textColor: "#ffffff",
              background: "rgba(0,0,0,0.3)"
            }
          },
          {
            type: "text",
            overrides: {
              content: "GAME ON, PLAY BOLD",
              fontSize: 42,
              fontWeight: "bold",
              padding: 24,
              alignment: "left",
              textColor: "#ffffff"
            }
          },
          {
            type: "button",
            overrides: {
              content: "Get Started",
              backgroundColor: "#ffffff",
              textColor: "#2d3748",
              fontSize: 18,
              fontWeight: "600",
              borderRadius: 8,
              buttonPaddingX: 32,
              buttonPaddingY: 16,
              padding: 24,
              alignment: "left"
            }
          }
        ]
      }
    ];
  }
};

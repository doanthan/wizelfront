# Claude Code Best Practices: AI-Powered Email Template Builder

## 🎯 Core Principles for Drag-and-Drop Excellence

### 1. Visual Feedback is Everything
- **Hover states**: Elements should subtly highlight when hoverable (scale: 1.02, shadow, or border)
- **Drag preview**: Show a semi-transparent ghost of the element being dragged
- **Drop zones**: Clearly indicate valid drop areas with dashed borders or colored highlights
- **Cursor changes**: Use `grab` cursor on hover, `grabbing` while dragging
- **Real-time preview**: Update the email preview instantly as changes are made

### 2. Intuitive Interaction Patterns
```javascript
// Example: Smooth drag implementation
const dragConfig = {
  onDragStart: (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
    // Store drag data
  },
  onDragOver: (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Show drop indicator line
  },
  onDrop: (e) => {
    e.preventDefault();
    // Smooth animation to final position
  }
};
```

## 📧 Email Design Best Practices

### Layout Structure
1. **Maximum width**: 600-650px for optimal rendering across clients
2. **Single column on mobile**: Stack elements vertically below 480px
3. **Table-based layout**: Use tables for consistent rendering (yes, still in 2025!)
4. **Modular sections**: Header, hero, content blocks, CTA, footer

### Typography Guidelines
```css
/* Safe email fonts */
font-family: Arial, Helvetica, sans-serif;
/* Fallback stack */
font-family: 'Custom Font', Arial, sans-serif;

/* Optimal sizes */
h1: 24-30px
h2: 20-24px
h3: 18-20px
body: 14-16px
small: 12-14px

/* Line height: 1.4-1.6 for readability */
```

### Color & Contrast
- **Background**: Light colors (#ffffff, #f4f4f4) for readability
- **Text**: Dark colors with 4.5:1 contrast ratio minimum
- **CTAs**: High contrast, brand colors, minimum 44x44px touch target
- **Links**: Underlined and colored differently from body text

## 🔧 Playwright Testing Strategies

### Visual Regression Testing
```javascript
// Test drag and drop functionality
await page.locator('[data-testid="component-text"]').dragTo(
  page.locator('[data-testid="drop-zone-1"]')
);

// Verify element moved
await expect(page.locator('[data-testid="drop-zone-1"]'))
  .toContainText('Expected content');

// Screenshot comparison
await expect(page).toHaveScreenshot('email-template.png', {
  maxDiffPixels: 100
});
```

### Interaction Testing Checklist
- [ ] Drag initiates within 100ms
- [ ] Drop zones highlight on drag over
- [ ] **Smart guides appear on element alignment**
- [ ] **Pixel measurements display between elements**
- [ ] **Elements snap to guides within 5px threshold**
- [ ] **Equal spacing detection highlights matching gaps**
- [ ] Elements snap to grid (8px recommended)
- [ ] Undo/redo works for all actions
- [ ] Keyboard navigation (Tab, Arrow keys)
- [ ] Touch gestures on mobile devices
- [ ] **Grid overlay appears while dragging**
- [ ] **Measurements update in real-time**

## 🎨 Component Library Essentials

### Must-Have Email Components
1. **Text Block**: Rich text editor with formatting
2. **Image**: With alt text and responsive sizing
3. **Button/CTA**: Customizable colors, padding, borders
4. **Spacer/Divider**: Adjustable height/style
5. **Columns**: 2-3 column layouts
6. **Social Icons**: Pre-styled, linked icons
7. **Header/Footer**: Reusable templates

### Component Properties Panel
```javascript
// Each component should expose:
const componentProps = {
  padding: { top, right, bottom, left },
  margin: { top, bottom },
  backgroundColor: colorPicker,
  borderRadius: slider(0-20px),
  alignment: ['left', 'center', 'right'],
  mobile: {
    hide: boolean,
    stack: boolean,
    fontSize: override
  }
};
```

## 🚀 Performance Optimization

### Smooth Animations
```css
/* Use transform for smooth movement */
.dragging {
  transition: transform 0.2s ease;
  will-change: transform;
}

/* GPU acceleration */
.drag-preview {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Debouncing & Throttling
```javascript
// Throttle drag events
const throttledDragOver = throttle((e) => {
  updateDropIndicator(e);
}, 16); // 60fps

// Debounce saves
const debouncedSave = debounce(() => {
  saveTemplate();
}, 500);
```

## 🔍 Accessibility Requirements

### Keyboard Support
- **Tab**: Navigate between elements
- **Space/Enter**: Select element
- **Arrow keys**: Move selected element
- **Delete**: Remove selected element
- **Ctrl+Z/Cmd+Z**: Undo
- **Ctrl+Y/Cmd+Y**: Redo

### Screen Reader Support
```html
<div 
  role="application"
  aria-label="Email template editor"
>
  <div 
    draggable="true"
    role="button"
    aria-label="Text block component. Press space to select, then use arrow keys to move"
    tabindex="0"
  >
</div>
```

## 📱 Mobile/Responsive Considerations

### Touch Interactions
- **Long press**: Initiate drag on mobile
- **Touch targets**: Minimum 44x44px
- **Pinch to zoom**: For precise editing
- **Swipe to delete**: With confirmation

### Preview Modes
```javascript
const previewModes = {
  desktop: { width: 650, label: 'Desktop' },
  tablet: { width: 480, label: 'Tablet' },
  mobile: { width: 320, label: 'Mobile' }
};
```

## ✅ Testing with Playwright

### Critical User Flows
```javascript
// 1. Create new email from template
await page.click('[data-testid="template-blank"]');
await expect(page.locator('.editor-canvas')).toBeVisible();

// 2. Add and configure component
await page.dragAndDrop(
  '[data-testid="component-image"]',
  '.editor-canvas'
);
await page.click('[data-testid="properties-panel"]');
await page.fill('[name="imageUrl"]', 'https://example.com/image.jpg');

// 3. Test responsive preview
await page.click('[data-testid="preview-mobile"]');
await expect(page.locator('.preview-frame'))
  .toHaveCSS('width', '320px');

// 4. Export and validate HTML
await page.click('[data-testid="export-html"]');
const html = await page.locator('[data-testid="html-output"]').innerText();
expect(html).toContain('<!DOCTYPE html>');
```

## 🎯 UX Quick Wins

### Smart Defaults
- Pre-populate with brand colors
- Auto-save every 30 seconds
- Suggested layouts based on content type
- Smart spacing (automatically add padding)

### Helper Features
- **Alignment guides**: Show when elements align
- **Smart snapping**: Snap to grid and other elements
- **Quick actions**: Duplicate, delete, move up/down buttons
- **Contextual help**: Tooltips for first-time users

### Error Prevention
```javascript
// Prevent invalid operations
const validateDrop = (source, target) => {
  // Can't drop container inside itself
  if (source.contains(target)) return false;
  
  // Can't exceed nesting depth
  if (getNestingDepth(target) > 3) return false;
  
  return true;
};
```

## 📊 Analytics to Track

### User Behavior Metrics
- Time to first component drop
- Most used components
- Average editing session length
- Undo/redo frequency
- Export format preferences

### Performance Metrics
- Initial load time < 2s
- Drag response time < 100ms
- Save operation < 500ms
- Preview generation < 1s

## 🔄 State Management

### Undo/Redo Implementation
```javascript
class HistoryManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
  }
  
  push(state) {
    // Remove future history on new action
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(state);
    this.currentIndex++;
  }
  
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
  }
  
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
  }
}
```

## 🎁 Bonus: AI Integration Points

### Smart Suggestions
- Auto-complete subject lines
- Content tone adjustment
- A/B test variant generation
- Accessibility warnings
- Email client compatibility checks

### AI Commands for Claude Code
```markdown
# In claude.md
## Email Optimization
- "Optimize this email for mobile Gmail app"
- "Check contrast ratios for accessibility"
- "Generate 3 subject line variants"
- "Convert this design to dark mode"
- "Add fallback fonts for Outlook"

## Image Editing Commands
- "Remove background from selected image"
- "Crop image to square with face centered"
- "Apply duotone effect with brand colors"
- "Create fashion flashback layout with annotations"
- "Add torn paper edge effect"
- "Generate 3-panel collage from uploaded images"
- "Apply vintage filter to match aesthetic"
- "Create shape mask for image (circle/hexagon/custom)"
- "Add handwritten annotation with arrow pointing to element"
- "Resize image to 600px width maintaining aspect ratio"
```

---

## 📋 Implementation Checklist

- [ ] Implement smooth drag and drop with visual feedback
- [ ] Add all essential email components
- [ ] Set up responsive preview modes
- [ ] Implement undo/redo functionality
- [ ] Add keyboard navigation
- [ ] Create Playwright tests for critical paths
- [ ] Optimize for 60fps animations
- [ ] Add auto-save functionality
- [ ] Implement export to HTML/MJML
- [ ] Add accessibility features
- [ ] Set up analytics tracking
- [ ] Create onboarding tooltips
- [ ] Test across email clients

Remember: The best drag-and-drop editor feels invisible - users should focus on creating great emails, not fighting with the interface!
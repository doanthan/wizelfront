# Email Builder Properties Architecture

## Component Hierarchy

```
EmailBuilder
    │
    ├── LeftPanel (Component Library)
    │
    ├── EmailCanvas (Drag & Drop Canvas)
    │
    └── PropertiesPanel (Smart Container) ← YOU ARE HERE
            │
            ├── SectionProperties
            │   ├── Background image controls
            │   ├── Background color picker
            │   ├── Border controls
            │   ├── Padding slider
            │   └── Content alignment buttons
            │
            ├── ImageProperties
            │   ├── Action buttons (Edit, Replace, AI, Slice)
            │   ├── Alt text & Link inputs
            │   ├── Image URL input
            │   ├── Alignment buttons
            │   ├── SpacingControl (Figma-style)
            │   ├── Background color picker
            │   └── Border controls
            │
            ├── TextProperties
            │   ├── Font family dropdown
            │   ├── Text color picker
            │   ├── Font size slider
            │   ├── Line height slider
            │   ├── Letter spacing slider
            │   ├── Block background color
            │   └── Mobile text presets
            │
            ├── ButtonProperties
            │   ├── Tabs (Styles / Display)
            │   ├── Button text & link
            │   ├── Typography controls
            │   ├── Text formatting buttons
            │   ├── Background & border radius
            │   ├── Width options (fit/full)
            │   ├── Alignment buttons
            │   ├── Internal padding
            │   ├── Collapsible sections
            │   │   ├── Border
            │   │   ├── Drop shadow
            │   │   └── Block background
            │   └── Block padding & mobile toggle
            │
            ├── DividerProperties
            │   ├── Style dropdown (10 variants)
            │   ├── Color pickers (top/bottom or single)
            │   ├── Height slider
            │   ├── Width slider
            │   └── Spacing slider
            │
            └── CommonProperties
                └── Padding slider (shared control)
```

## Data Flow

```
User Interaction
    ↓
PropertiesPanel receives:
  - selectedBlock (current block data)
  - updateBlock (callback to update block)
  - brandColors (from BrandContext)
  - onImageUrlChange, onEditImage, onSpliceAndLink (image-specific)
    ↓
PropertiesPanel determines block type:
  - selectedBlock.type === "section" → SectionProperties
  - selectedBlock.type === "image" → ImageProperties
  - selectedBlock.type === "button" → ButtonProperties
  - etc.
    ↓
Property Component renders controls
    ↓
User modifies property
    ↓
onChange handler calls: updateBlock(blockId, { property: newValue })
    ↓
EmailBuilder updates blocks state
    ↓
EmailCanvas re-renders with updated block
```

## Props Flow

### PropertiesPanel Props
```typescript
{
  propertiesRef: React.RefObject<HTMLElement>
  selectedBlock: Block | null
  isPropertiesFloating: boolean
  isPropertiesOpen: boolean
  onToggleProperties: () => void
  updateBlock: (id: string, updates: Partial<Block>) => void
  onImageUrlChange: (url: string) => void
  propertiesPanelClassName: string
  onEditImage?: (id: string, url: string) => void
  onSpliceAndLink?: (id: string, url: string) => void
}
```

### Shared Props (passed to all property components)
```typescript
{
  selectedBlock: Block
  updateBlock: (id: string, updates: Partial<Block>) => void
  brandColors: BrandColor[]
}
```

### Image-Specific Props
```typescript
{
  onImageUrlChange: (url: string) => void
  onEditImage?: (id: string, url: string) => void
  onSpliceAndLink?: (id: string, url: string) => void
}
```

## Block Type to Component Mapping

| Block Type | Component | Lines | Key Features |
|------------|-----------|-------|--------------|
| `section` | SectionProperties | 180 | Background, borders, padding, alignment |
| `image` | ImageProperties | 809 | Edit, slice, spacing, borders |
| `image-table` | ImageProperties | 809 | Info display, spliced image handling |
| `text` | TextProperties | 178 | Typography, presets |
| `paragraph` | TextProperties | 178 | Typography, presets |
| `headline` | TextProperties | 178 | Typography, presets |
| `button` | ButtonProperties | 397 | Tabs, styles, display, collapsible sections |
| `divider` | DividerProperties | 131 | 10 style variants, colors, dimensions |

## Special Components

### SpacingControl (in ImageProperties)
A Figma-style spacing control with:
- Unified mode: Horizontal/Vertical inputs (linked)
- Individual mode: Top/Right/Bottom/Left inputs (granular)
- Toggle button to switch modes
- Visual icons for each direction

### ColorPicker (shared utility)
Imported from `../ColorPicker.jsx`:
- Hex input support
- Brand color presets
- Position control (top/bottom)
- Dark mode support

### BrandContext
Provides brand colors via:
```javascript
const { getBrandColors } = useBrand();
const brandColors = getBrandColors();
```

## Adding New Block Types

To add properties for a new block type (e.g., `video`):

1. **Create the component:**
```bash
touch app/store/[storePublicId]/email-builder/properties/VideoProperties.jsx
```

2. **Implement the component:**
```jsx
import React from 'react';
import styles from '../email-builder.module.css';

const VideoProperties = ({ selectedBlock, updateBlock, brandColors }) => {
  return (
    <fieldset>
      <legend>Video Settings</legend>
      {/* Your controls here */}
    </fieldset>
  );
};

export default VideoProperties;
```

3. **Import in PropertiesPanel:**
```jsx
import VideoProperties from './properties/VideoProperties';
```

4. **Add conditional rendering:**
```jsx
{selectedBlock.type === "video" && (
  <VideoProperties
    selectedBlock={selectedBlock}
    updateBlock={updateBlock}
    brandColors={brandColors}
  />
)}
```

## CSS Classes

All property components use classes from `email-builder.module.css`:
- `.inputField` - Input fields and selects
- `.formLabel` - Labels for inputs
- `.rangeValue` - Display value for range sliders
- `.alignmentButtons` - Container for alignment buttons
- `.alignButton` - Individual alignment button
- `.alignButtonActive` - Active alignment button state
- `.compactButton` - Compact action buttons (Image Properties)
- `.outlinePrimaryButton` - Primary outline buttons
- `.buttonTabs` - Tab container (Button Properties)
- `.buttonTab` - Individual tab
- `.buttonTabActive` - Active tab state
- `.collapsibleSection` - Collapsible section container
- `.collapsibleHeader` - Collapsible section header
- `.collapsibleContent` - Collapsible section content

## Testing Strategy

### Unit Tests (Recommended)
```javascript
import { render, fireEvent } from '@testing-library/react';
import SectionProperties from './SectionProperties';

test('updates background color', () => {
  const mockUpdateBlock = jest.fn();
  const mockBlock = { id: '1', type: 'section', backgroundColor: '#ffffff' };

  const { container } = render(
    <SectionProperties
      selectedBlock={mockBlock}
      updateBlock={mockUpdateBlock}
      brandColors={[]}
    />
  );

  // Test color picker interaction
  // Assert mockUpdateBlock was called with correct args
});
```

### Integration Tests
1. Mount EmailBuilder with test blocks
2. Select a block
3. Verify correct property component renders
4. Simulate user interactions
5. Assert block state updates correctly

### E2E Tests
1. Open email builder in browser
2. Add blocks of each type
3. Verify properties panel shows correct controls
4. Modify properties
5. Verify visual changes on canvas

## Performance Considerations

### Code Splitting
- Each property component is a separate module
- Next.js automatically code-splits dynamic imports
- Only the needed property component is loaded per block type

### Memoization Opportunities
```jsx
// In PropertiesPanel
const PropertyComponent = useMemo(() => {
  switch (selectedBlock?.type) {
    case 'section': return SectionProperties;
    case 'image': return ImageProperties;
    // etc.
  }
}, [selectedBlock?.type]);
```

### Render Optimization
- Property components are "dumb" (no internal state)
- Only re-render when props change
- Use `React.memo` for expensive components

## Future Improvements

1. **TypeScript Migration**
   - Add proper types for all props
   - Create Block type interfaces
   - Type-safe updateBlock function

2. **Accessibility Enhancements**
   - Add ARIA labels to all controls
   - Keyboard navigation support
   - Screen reader announcements

3. **Internationalization**
   - Extract all strings to i18n files
   - Support multiple languages
   - RTL layout support

4. **Advanced Features**
   - Undo/redo support
   - Property presets
   - Bulk editing
   - Property copying between blocks

5. **Performance**
   - Virtual scrolling for long property lists
   - Lazy loading of heavy components (ColorPicker)
   - Debounced updates for sliders

---

**Last Updated**: October 14, 2025
**Version**: 2.0 (Modular Architecture)

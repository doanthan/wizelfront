# Properties Panel Components

Modular property editor components for different block types in the Email Builder.

## Architecture

The Properties Panel has been refactored from a single 940-line monolithic component into **7 focused, maintainable modules**:

```
properties/
├── CommonProperties.jsx      # Shared spacing/padding controls
├── SectionProperties.jsx     # Section block properties
├── ImageProperties.jsx       # Image block properties
├── TextProperties.jsx        # Text/paragraph/headline properties
├── ButtonProperties.jsx      # Button block properties
├── DividerProperties.jsx     # Divider block properties
└── README.md                 # This file
```

The main `PropertiesPanel.jsx` (150 lines) acts as a **smart container** that:
1. Determines which property component to render based on `selectedBlock.type`
2. Passes shared props (`updateBlock`, `brandColors`, etc.)
3. Handles the panel's layout, toggle, and empty states

## Component Breakdown

### CommonProperties.jsx (24 lines)
**Purpose**: Shared spacing/padding controls used by most blocks

**Used by**: text, paragraph, headline, image (not button/section/divider)

**Controls**:
- Padding slider (0-80px)

---

### SectionProperties.jsx (185 lines)
**Purpose**: Container block properties

**Controls**:
- Background image (URL, size, position, repeat)
- Background color
- Border (width, style, color)
- Padding (inner spacing)
- Content alignment (left/center/right)

---

### ImageProperties.jsx (130 lines)
**Purpose**: Image and image-table block properties

**Controls**:
- Edit Image button (opens image editor)
- Splice & Link button (image slicing tool)
- Image URL input
- Alt text input
- Special indicators for spliced images

**Special handling**:
- Shows different UI for `image` vs `image-table` types
- Displays info badge for spliced images

---

### TextProperties.jsx (75 lines)
**Purpose**: Typography controls for text-based blocks

**Used by**: text, paragraph, headline

**Controls**:
- Font family dropdown (email-safe fonts)
- Font size slider (12-48px)
- Line height slider (1.0-3.0)
- Letter spacing slider (-2 to 10px)
- Text color picker

---

### ButtonProperties.jsx (430 lines)
**Purpose**: Comprehensive button styling and behavior

**Features**:
- **Two tabs**: Styles / Display
- **Styles tab**:
  - Button text & link
  - Font size & color
  - Text formatting (Bold/Italic/Underline/Strikethrough)
  - Background color & border radius
  - Button width (fit/full)
  - Alignment (left/center/right)
  - Internal padding (X/Y)
  - Collapsible sections:
    - Border controls
    - Drop shadow controls
    - Block background color
  - Block padding (top/bottom/left/right)
  - Mobile full-width toggle
- **Display tab**: Future settings

---

### DividerProperties.jsx (115 lines)
**Purpose**: Visual divider styling

**Controls**:
- Style dropdown (10 two-tone variants)
- Color pickers:
  - Two-tone: Top + Bottom colors
  - Single: Single color
- Height slider (20-200px)
- Width slider (10-100%)
- Spacing slider (0-60px)

---

## Benefits of Modular Structure

### ✅ Maintainability
- Each file is focused on a single block type
- Easy to find and update specific controls
- Clear separation of concerns

### ✅ Reusability
- Components can be composed differently
- Common patterns (ColorPicker, sliders) are reused
- Shared controls extracted to CommonProperties

### ✅ Performance
- Only relevant code is loaded per block type
- Smaller bundle size per component
- Faster hot module replacement in development

### ✅ Scalability
- Easy to add new block types (just create new property component)
- Can split ButtonProperties further if needed
- Clear pattern to follow for new contributors

### ✅ Testing
- Each component can be unit tested independently
- Mock props are simpler to create
- Easier to test edge cases

## Usage Example

```jsx
import PropertiesPanel from './PropertiesPanel';

<PropertiesPanel
  selectedBlock={selectedBlock}
  updateBlock={updateBlock}
  onImageUrlChange={handleImageUrlChange}
  onEditImage={handleEditImage}
  onSpliceAndLink={handleSpliceAndLink}
  // ... other props
/>
```

The PropertiesPanel automatically renders the correct property component:

```jsx
// When selectedBlock.type === 'section'
<SectionProperties ... />

// When selectedBlock.type === 'image'
<ImageProperties ... />

// When selectedBlock.type === 'button'
<ButtonProperties ... />

// etc.
```

## Adding New Block Types

To add properties for a new block type:

1. **Create the component**:
   ```bash
   touch app/email-builder/properties/YourBlockProperties.jsx
   ```

2. **Follow the pattern**:
   ```jsx
   import React from 'react';
   import styles from '../email-builder.module.css';

   const YourBlockProperties = ({ selectedBlock, updateBlock, brandColors }) => {
     return (
       <fieldset>
         <legend>Your Block</legend>
         {/* Your controls here */}
       </fieldset>
     );
   };

   export default YourBlockProperties;
   ```

3. **Import in PropertiesPanel.jsx**:
   ```jsx
   import YourBlockProperties from './properties/YourBlockProperties';
   ```

4. **Add conditional rendering**:
   ```jsx
   {selectedBlock.type === "yourblock" && (
     <YourBlockProperties
       selectedBlock={selectedBlock}
       updateBlock={updateBlock}
       brandColors={brandColors}
     />
   )}
   ```

## Design Principles

- **Props over state**: Properties receive data via props, don't manage their own state
- **Controlled inputs**: All form inputs are controlled via `updateBlock` callback
- **Consistent styling**: Use classes from `email-builder.module.css`
- **Brand integration**: Pass `brandColors` for ColorPicker components
- **Accessibility**: Include proper labels, legends, and ARIA attributes

## File Size Comparison

**Before refactoring**:
- PropertiesPanel.jsx: **940 lines** ❌

**After refactoring**:
- PropertiesPanel.jsx: **150 lines** ✅
- CommonProperties.jsx: 24 lines
- SectionProperties.jsx: 185 lines
- ImageProperties.jsx: 130 lines
- TextProperties.jsx: 75 lines
- ButtonProperties.jsx: 430 lines
- DividerProperties.jsx: 115 lines

**Total**: 1,109 lines (includes JSDoc comments and proper spacing)

The slight increase in total lines is due to:
- Better documentation (JSDoc comments)
- Cleaner separation (fewer nested conditionals)
- Import statements (7 files vs 1)

But now each file is **focused, testable, and maintainable**!

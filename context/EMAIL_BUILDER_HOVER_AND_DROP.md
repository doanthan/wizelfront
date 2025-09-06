# Product Requirements Document: Hover States & Component Drop System
## Email Template Builder V2 - Interaction Patterns

### Executive Summary
This document details the sophisticated hover state management and drag-and-drop functionality implemented in the template-builder-v2 email editor. These patterns enable a seamless, intuitive editing experience with visual feedback and intelligent drop zones that guide users through email template creation.

---

## 1. Architecture Overview

### Core Technologies
- **React 19** with hooks for state management
- **react-dnd** (HTML5Backend) for drag-and-drop functionality
- **CSS-in-JS** for dynamic styling
- **Debounced state updates** for performance optimization

### Key Components
1. **EmailCanvas** - Main canvas orchestrator
2. **DropZone** - Intelligent drop indicators
3. **Section** - Email sections with hover controls
4. **SectionControls** - Contextual action toolbar
5. **ComponentPanel** - Draggable component source
6. **ContentElement** - Individual content pieces

---

## 2. Hover State Management

### 2.1 Section Hover System

#### Detection Mechanism
```javascript
// Vertical bounds tracking with extended hit area
const sectionBounds = {
  top: rect.top - 10,     // 10px padding above
  bottom: rect.bottom + 10, // 10px padding below
  left: rect.left - 60,    // Extended left for controls
  right: rect.right + 10   // 10px padding right
}
```

#### State Flow
1. **Mouse enters section bounds** → Trigger hover state
2. **Hover state activated** → Show SectionControls
3. **Mouse moves to controls** → Maintain hover via "invisible bridge"
4. **Mouse leaves extended bounds** → Start 200ms hide timer
5. **Timer expires** → Hide controls (unless mouse returned)

#### Key Features
- **Single active section**: Only one section shows controls at a time
- **Invisible bridge**: 54px wide invisible area connects section to controls
- **Smart boundaries**: Controls area extends hit zone for easier access
- **Graceful transitions**: 200ms fade animations for smooth UX

### 2.2 Control Visibility Rules

#### Show Controls When:
- Mouse is within section vertical bounds
- Mouse is over controls themselves
- Mouse is in the invisible bridge area
- User is interacting with control buttons

#### Hide Controls When:
- Mouse leaves extended bounds for >200ms
- Another section becomes active
- User starts dragging components
- User clicks outside section

### 2.3 Visual Feedback States

```css
/* Default state */
.section { 
  border: 2px solid transparent;
  transition: all 200ms ease;
}

/* Hover state */
.section.hovered {
  border-color: #e5e7eb;
  background: rgba(249, 245, 255, 0.3);
}

/* Selected state */
.section.selected {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
```

---

## 3. Advanced Drag and Drop System (Dashboard Email Builder Implementation)

### 3.1 Architecture Overview

The dashboard email builder uses a sophisticated custom drag-drop system that provides superior performance and user experience compared to traditional react-dnd implementations.

#### Core Components
- **DragDropManager** - Central state management for drag operations
- **DragDropProvider** - Context provider for drag state
- **DraggableBlock** - Wrapper for draggable elements
- **DropZone** - Intelligent drop target components
- **DragOverlay** - Visual feedback during drag

### 3.2 Drop Zone Variants

The system implements multiple drop zone variants for different contexts:

#### 1. Canvas Drop Zone (`variant="canvas"`)
```javascript
// Empty canvas state
<DropZone
  id="email-canvas-empty"
  accepts={['component', 'section']}
  variant="canvas"
  showIndicator={true}
  indicatorText="Drop component here"
  className="min-h-[400px]"
>
```
- **Appearance**: Clean, no borders
- **Background**: Subtle purple tint on hover (bg-purple-50/30)
- **Min Height**: 100px (400px for empty state)
- **Use Case**: Empty email canvas

#### 2. Edge Drop Zone (`variant="edge"`)
```javascript
<DropZone
  id="drop-zone-top"
  accepts={['component', 'section']}
  position={{ index: 0, location: 'top' }}
  variant="edge"
  indicatorText="Add to top"
/>
```
- **Default State**: Hidden (height: 0)
- **Active State**: 8px height with -4px margin (creates hit area)
- **Hover State**: 24px height, gradient background, dashed border
- **Animations**: Smooth 200ms transitions
- **Use Case**: Top/bottom of email

#### 3. Between Drop Zone (`variant="between"`)
```javascript
<DropZone
  id={`drop-zone-between-${index}`}
  accepts={['component', 'section']}
  position={{ index: index + 1, location: 'between' }}
  variant="between"
/>
```
- **Default State**: Hidden (height: 0)
- **Active State**: 8px height with -4px margin
- **Hover State**: 20px height, purple background
- **Z-Index**: 30 (above content)
- **Use Case**: Between sections

#### 4. Minimal Drop Zone (`variant="minimal"`)
```javascript
<DropZone
  variant="minimal"
  className="opacity-0 hover:opacity-100"
/>
```
- **Default State**: Fully transparent
- **Hover State**: Visible with opacity transition
- **Use Case**: Subtle drop areas

### 3.3 Drop Zone State Management

#### State Variables
```javascript
const {
  setNodeRef,      // DOM ref setter
  attributes,      // Accessibility attributes
  isOver,         // Mouse is over drop zone
  isActive,       // Drag operation is active
  isValidTarget,  // Can accept current drag item
  isDropTarget    // Is the active drop target
} = useDroppable({
  id,
  accepts,
  data,
  disabled,
  onDrop
})
```

#### Dynamic Rendering
```javascript
// Only render edge/between zones when dragging
if (!isActive && (variant === 'edge' || variant === 'between')) {
  return null
}

// Make invisible but interactive when not hovering
const dropZoneStyle = {
  ...style,
  ...((variant === 'edge' || variant === 'between') && isActive && !isOver && {
    opacity: 0,
    cursor: 'pointer'
  })
}
```

### 3.4 DragDropManager Implementation

#### Registration System
```javascript
class DragDropManager {
  registerDropTarget(id, config) {
    this.dropTargets.set(id, {
      id,
      element: config.element,
      accepts: config.accepts || [],
      data: config.data || {},
      onDragEnter: config.onDragEnter,
      onDragLeave: config.onDragLeave,
      onDragOver: config.onDragOver,
      onDrop: config.onDrop,
      isActive: false
    })
  }
}
```

#### Collision Detection
```javascript
findDropTargetAtPoint(x, y) {
  const targetsAtPoint = []
  
  // Find all targets containing the point
  for (const [id, target] of this.dropTargets) {
    const rect = target.element.getBoundingClientRect()
    if (x >= rect.left && x <= rect.right && 
        y >= rect.top && y <= rect.bottom) {
      targetsAtPoint.push({ target, rect })
    }
  }
  
  // Prefer smallest (most specific) target
  if (targetsAtPoint.length > 1) {
    targetsAtPoint.sort((a, b) => {
      const areaA = (a.rect.right - a.rect.left) * (a.rect.bottom - a.rect.top)
      const areaB = (b.rect.right - b.rect.left) * (b.rect.bottom - b.rect.top)
      return areaA - areaB
    })
  }
  
  return targetsAtPoint[0]?.target || null
}
```

#### Drop Validation
```javascript
canDrop(dropTarget, dragType) {
  if (!dropTarget || !dropTarget.accepts) return false
  return dropTarget.accepts.includes(dragType) || 
         dropTarget.accepts.includes('*')
}
```

### 3.5 Component Integration

#### EmailEditor Canvas Rendering
```javascript
// Empty canvas
{sections.length === 0 ? (
  <DropZone
    key="empty-canvas-dropzone"
    id="email-canvas-empty"
    accepts={['component', 'section']}
    variant="canvas"
    onDrop={({ item }) => {
      handleCanvasDropRef.current?.(item, { 
        targetId: 'canvas', 
        position: 'end' 
      })
    }}
  />
) : (
  <div className="relative">
    {/* Top drop zone - only visible when dragging */}
    {dragState?.isDragging && (
      <DropZone
        id="drop-zone-top"
        accepts={['component', 'section']}
        position={{ index: 0, location: 'top' }}
        variant="edge"
        indicatorText="Add to top"
        onDrop={({ item }) => {
          handleCanvasDropRef.current?.(item, { 
            position: 'between', 
            index: 0 
          })
        }}
      />
    )}
    
    {/* Render sections */}
    {sections.map((section, index) => (
      <div key={section.id}>
        <EmailSectionPreview section={section} />
        
        {/* Between drop zones - only visible when dragging */}
        {dragState?.isDragging && index < sections.length - 1 && (
          <DropZone
            id={`drop-zone-between-${index}`}
            accepts={['component', 'section']}
            position={{ index: index + 1 }}
            variant="between"
            onDrop={({ item }) => {
              handleCanvasDropRef.current?.(item, { 
                position: 'between', 
                index: index + 1 
              })
            }}
          />
        )}
      </div>
    ))}
    
    {/* Bottom drop zone */}
    {dragState?.isDragging && (
      <DropZone
        id="drop-zone-bottom"
        accepts={['component', 'section']}
        position={{ index: sections.length }}
        variant="edge"
        indicatorText="Add to bottom"
      />
    )}
  </div>
)}
```

### 3.6 Auto-Scroll System

#### Hook Implementation
```javascript
useAutoScroll(canvasRef, {
  threshold: 150,  // Distance from edge to trigger scroll
  maxSpeed: 20,    // Maximum scroll speed
  vertical: true,  // Enable vertical scrolling
  horizontal: false // Disable horizontal scrolling
})
```

#### Scroll Behavior
- Activates when dragging near canvas edges
- Progressive speed based on distance from edge
- Smooth scrolling with RAF-based updates
- Automatic cleanup on drag end

### 3.7 Text Editing Conflict Resolution

Prevents drag operations when editing text:
```javascript
const textEditingResolver = useTextEditingConflictResolver()

// Disable dragging when editing
const isDraggingDisabled = isLocked || isEditing

// In DraggableBlock
canDrag: !textEditingResolver?.editingElementId
```

### 3.8 Performance Optimizations

#### 1. Conditional Rendering
- Drop zones only render when `dragState.isDragging` is true
- Reduces DOM nodes and improves performance

#### 2. Event Delegation
- Single document-level drag handler
- Efficient event propagation

#### 3. Memoization
```javascript
const EmailSectionPreviewV2 = memo(({ ... }) => {
  // Component implementation
})
```

#### 4. Smart Re-renders
- Only affected drop zones update during drag
- Optimistic UI updates

### 3.9 Visual Feedback System

#### Drop Zone Indicators
```javascript
const renderIndicator = () => {
  if (!showIndicator || !isActive) return null
  if (!isOver) return null

  return (
    <div className={variantStyles.indicator}>
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
        <Plus className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-600">
          {indicatorText}
        </span>
      </div>
    </div>
  )
}
```

#### Styling Classes
```css
.drop-zone-valid { /* Valid drop target */ }
.drop-zone-active { /* Active drop zone */ }
.drop-zone-over { /* Mouse over drop zone */ }
```

### 3.10 Drop Handler Implementation

#### Unified Drop Handler
```javascript
const handleCanvasDrop = async (item, dropInfo) => {
  const { position, index, targetId } = dropInfo
  
  // Determine item type
  if (item.universalContentId) {
    // Handle universal content
    await loadUniversalContent(item)
  } else if (item.componentType) {
    // Create new section from component
    const newSection = createNewSection(item.componentType)
    insertSection(newSection, index)
  } else if (item.type === 'section') {
    // Move existing section
    moveSection(item.id, index)
  }
  
  // Post-drop actions
  setSelectedSection(newSection)
  if (item.componentType === 'image' && !item.imageUrl) {
    openImageSelectionModal()
  }
}
```

### 3.11 Special Features

#### 1. Universal Content Support
```javascript
if (dragData?.item?.universalContentId) {
  await handleCanvasDrop(dragData.item, {
    targetId: sectionId,
    position: 'between',
    index: calculateIndex(sectionId, position)
  })
}
```

#### 2. Nested Drop Support
- Column layouts with internal drop zones
- Table cell drop targets
- Recursive section handling

#### 3. Smart Drop Positioning
- Calculates optimal insertion point
- Handles edge cases (first/last position)
- Maintains section order integrity

---

## 4. Section Controls

### 4.1 Control Button Layout

```
┌─────────────┐
│  ▲ Add Above │ 36x36px buttons
├─────────────┤
│  ⊡ Duplicate │ 3px gap between
├─────────────┤
│  ▼ Add Below │ White background
├─────────────┤
│  ⊞ Columns  │ Hover: Purple tint
├─────────────┤
│  🗑 Delete   │ Delete: Red tint
└─────────────┘
```

### 4.2 Control Positioning

- **Position**: Absolute, left: -46px from section
- **Alignment**: Top of section (top: 0)
- **Z-index**: 1000 (above content)
- **Container**: White rounded box with shadow

### 4.3 Interactive Features

#### Button Hover States
```javascript
onHover: {
  borderColor: '#8b5cf6',
  color: '#8b5cf6',
  background: '#f9f5ff'
}

onHoverDelete: {
  borderColor: '#ef4444',
  color: '#ef4444',
  background: '#fef2f2'
}
```

#### Column Layout Selector
- Inline dropdown on Columns button click
- Shows 1-col, 2-col, 3-col visual options
- Active state highlighting
- Auto-closes on selection

---

## 5. Performance Optimizations

### 5.1 Debouncing & Throttling

- **Hover state changes**: 200ms debounce
- **Drag position updates**: RAF-based throttling
- **Section re-renders**: Memoized with React.memo
- **Drop zone visibility**: CSS-only transitions

### 5.2 State Management

```javascript
// Minimize re-renders with selective updates
setSections(prevSections => {
  const newSections = [...prevSections]
  // Surgical updates only
  newSections[index] = updatedSection
  return newSections
})
```

### 5.3 Event Delegation

- Single document-level mouse tracker
- Shared drag state via context
- Optimized boundary calculations cached

---

## 6. Implementation Guide for New Project

### 6.1 Required Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1",
    "lucide-react": "^0.263.1"
  }
}
```

### 6.2 Core Setup

```javascript
// 1. Wrap app with DnD Provider
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

<DndProvider backend={HTML5Backend}>
  <YourEmailBuilder />
</DndProvider>

// 2. Create drag source
const [{ isDragging }, drag] = useDrag(() => ({
  type: 'component',
  item: { componentType: 'text' }
}))

// 3. Create drop target
const [{ isOver }, drop] = useDrop(() => ({
  accept: 'component',
  drop: (item) => handleDrop(item)
}))
```

### 6.3 Key Implementation Patterns

#### Hover State Manager
```javascript
const useHoverState = (elementRef) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const hideTimeout = useRef(null)
  
  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimeout.current)
    setIsHovered(true)
    setShowControls(true)
  }, [])
  
  const handleMouseLeave = useCallback(() => {
    hideTimeout.current = setTimeout(() => {
      setIsHovered(false)
      setShowControls(false)
    }, 200)
  }, [])
  
  return { isHovered, showControls, handleMouseEnter, handleMouseLeave }
}
```

#### Drop Zone Component
```javascript
const DropZone = ({ index, onDrop, isDragging }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item) => onDrop(item, index),
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true })
    })
  }))
  
  return (
    <div 
      ref={drop}
      className={`
        drop-zone 
        ${isDragging ? 'hit-area' : ''} 
        ${isOver ? 'active' : ''}
      `}
    >
      {isOver && <div className="drop-indicator">Drop here</div>}
    </div>
  )
}
```

---

## 7. Critical Implementation Details

### 7.1 Z-Index Hierarchy
```css
.email-canvas: 1
.section: 10
.drop-zone: 50
.section-hover-overlay: 100
.dragging-element: 500
.section-controls: 1000
.modals: 2000
```

### 7.2 Mouse Event Flow
1. Document captures all mouse moves
2. Sections check bounds independently
3. Active section monopolizes control display
4. Drop zones activate based on drag state

### 7.3 State Synchronization
- Canvas maintains `hoveredSection` and `activeSectionControls`
- Sections report hover via callbacks
- Only one section can be "active" at a time
- Drop zones coordinate through parent canvas

### 7.4 Accessibility Considerations
- Keyboard navigation support (Tab/Arrow keys)
- ARIA labels for all controls
- Focus management during drag operations
- Screen reader announcements for drops

---

## 8. Testing Checklist

### Hover States
- [ ] Section hover triggers on mouse enter
- [ ] Controls appear within 200ms
- [ ] Only one section shows controls
- [ ] Controls stay visible when hovering them
- [ ] Controls hide after leaving bounds
- [ ] Invisible bridge maintains hover

### Drag and Drop
- [ ] Components drag from panel
- [ ] Drop zones appear when dragging
- [ ] Drop zones show correct states
- [ ] Elements insert at correct position
- [ ] Sections can be reordered
- [ ] Drag preview shows correctly
- [ ] Drop cancellation handled

### Performance
- [ ] No lag during hover transitions
- [ ] Smooth drag operations
- [ ] Quick drop zone updates
- [ ] Efficient re-renders

---

## 9. Common Pitfalls & Solutions

### Issue: Controls flicker when moving mouse
**Solution**: Implement invisible bridge between section and controls

### Issue: Multiple sections show controls
**Solution**: Track single `activeSectionControls` state at canvas level

### Issue: Drop zones not appearing
**Solution**: Ensure `isDraggingGlobal` state propagates to all drop zones

### Issue: Hover state stuck
**Solution**: Add cleanup in useEffect with timeout clearing

### Issue: Drag preview incorrect
**Solution**: Use `preview` ref from useDrag for custom preview

---

## 10. Future Enhancements

### Planned Features
1. **Magnetic snapping** - Elements snap to grid
2. **Multi-select** - Select multiple sections
3. **Keyboard shortcuts** - Copy/paste sections
4. **Undo/redo** - Full history management
5. **Nested drop zones** - Drop within columns
6. **Animation presets** - Hover/click animations
7. **Touch support** - Mobile editing capability

### Performance Improvements
1. Virtual scrolling for long emails
2. Lazy loading for heavy components
3. Web Workers for drag calculations
4. Optimistic UI updates

---

## Conclusion

This hover and drop system creates an intuitive, responsive email editing experience. The combination of intelligent hover states, visual feedback, and smooth animations makes complex email creation feel effortless. The architecture is modular and performant, suitable for scaling to production environments.

For implementation support or questions, refer to the source code in `/app/test/template-builder-v2/` or contact the development team.
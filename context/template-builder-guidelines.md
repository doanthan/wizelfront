# Template Builder V2 - Enterprise Email Builder Guidelines

## 🎯 Vision
Create the most intuitive, powerful email builder that empowers marketers to create beautiful, high-converting emails faster than Klaviyo or Omnisend - without needing any technical knowledge.

## ✨ Implementation Best Practices (Based on Current Code)

### Architecture Patterns
1. **Component-Based Architecture** - Modular, reusable components (EmailCanvas, Section, ContentElement)
2. **Local Data Service** - Offline-first with localStorage for templates
3. **Enhanced Drag-and-Drop System** - Custom DragDropManager with HTML5 drag events
4. **Portal Pattern** - Use portals for modals and floating toolbars
5. **Custom Hooks** - useHoverState for sophisticated hover management

### Latest Implementation Updates (V3 Email Canvas)

#### Advanced Drag-and-Drop Architecture
```javascript
// Centralized drag state management
const dragDropManager = {
  // Singleton pattern for global drag state
  dragState: null,
  subscribers: new Set(),
  dropTargets: new Map(),
  
  // Methods for coordinating drag operations
  startDrag: (item, type) => { /* Sets global drag state */ },
  endDrag: () => { /* Clears drag state and notifies subscribers */ },
  registerDropTarget: (id, config) => { /* Registers drop zones */ },
  handleDrop: () => { /* Executes drop action */ }
};
```

#### Sophisticated Hover State Management
```javascript
// Invisible bridge pattern for section controls
const hoverStateManagement = {
  // Extended hover area for better UX
  invisibleBridge: {
    width: '54px',
    position: 'left',
    purpose: 'Maintain hover state when moving to controls'
  },
  
  // Smart timeout management
  hoverDelays: {
    show: 0, // Instant show
    hide: 200, // 200ms delay before hiding
    mouseTracking: true // Track mouse position for intelligent hiding
  },
  
  // Visual feedback
  hoverIndicators: {
    border: '2px solid purple-500',
    background: 'purple-50/30',
    controls: 'floating-left-panel'
  }
};
```

#### Drop Zone Variants System
```javascript
const dropZoneVariants = {
  // Canvas drop zone - main empty state
  canvas: {
    minHeight: '100px',
    showAlways: true,
    indicator: 'centered-message'
  },
  
  // Edge drop zones - top/bottom of canvas
  edge: {
    height: 'dynamic (2px idle, 6px active)',
    visibility: 'only-when-dragging',
    animation: 'smooth-expand'
  },
  
  // Between sections drop zones
  between: {
    height: 'dynamic (2px idle, 5px active)',
    visibility: 'only-when-dragging',
    positioning: 'between-sections'
  },
  
  // Minimal drop zones - subtle indicators
  minimal: {
    opacity: 'subtle',
    noIndicatorText: true
  }
};
```

#### Auto-Scroll During Drag
```javascript
const autoScrollSystem = {
  // Scroll zones near canvas edges
  threshold: 150, // px from edge
  maxSpeed: 20, // px per frame
  
  // Smooth scrolling calculation
  scrollBehavior: {
    acceleration: 'linear',
    direction: 'bidirectional',
    framerate: 60 // 16ms intervals
  }
};
```

#### Section Controls Architecture
```javascript
const sectionControls = {
  // Floating control panel
  position: 'absolute-left',
  offset: '-46px',
  
  // Available actions
  controls: [
    'add-above',
    'move-up',
    'duplicate',
    'change-layout', // With sub-menu for columns
    'move-down',
    'add-below',
    'delete'
  ],
  
  // Layout selector dropdown
  layoutOptions: {
    '1-column': { icon: 'Square', columns: 1 },
    '2-columns': { icon: 'Columns2', columns: 2 },
    '3-columns': { icon: 'Columns3', columns: 3 }
  }
};
```

#### Native HTML5 Drag Event Handling
```javascript
// Dual system for maximum compatibility
const dragEventHandling = {
  // Custom DragDropManager for advanced features
  customManager: {
    purpose: 'State management and coordination',
    features: ['hover-states', 'drop-validation', 'visual-feedback']
  },
  
  // Native HTML5 for browser compatibility
  nativeEvents: {
    dragstart: 'Set dataTransfer with component data',
    dragover: 'Prevent default for valid drops',
    drop: 'Parse dataTransfer and create sections',
    dataTransfer: {
      types: ['componenttype', 'text/plain'],
      effectAllowed: 'copy'
    }
  }
};
```

### Bug Fixes and Improvements

#### Fixed Issues
1. **Drag-and-drop connectivity** - Connected sidebar components to canvas drop zones
2. **Data transfer compatibility** - Added multiple dataTransfer types for browser support
3. **Drop zone positioning** - Store position data in DOM attributes
4. **Circular dependencies** - Resolved useCallback and useEffect dependencies
5. **Duplicate declarations** - Fixed generateId function scope issues

#### Performance Optimizations
1. **Conditional drop zone rendering** - Edge/between zones only render when dragging
2. **Debounced hover states** - 200ms delay prevents flickering
3. **RequestAnimationFrame scrolling** - Smooth 60fps auto-scroll
4. **Memoized callbacks** - Prevent unnecessary re-renders

## ⚡ CRITICAL: Visual-First Design Requirements

### NO Multiple Input Fields - Everything Visual
❌ **NEVER DO THIS:**
- Multiple input boxes for padding (top, right, bottom, left)
- Separate fields for vertical/horizontal spacing
- Text inputs for sizes and dimensions
- Confusing number inputs

✅ **ALWAYS DO THIS:**
- **Visual Box Model** - Interactive diagram like browser DevTools
- **Drag-to-Adjust** - Drag handles directly on elements
- **Visual Presets** - One-click spacing options (Tight, Normal, Spacious)
- **In-Canvas Controls** - Adjust padding/margins right on the element
- **Smart Defaults** - Single click for common values

### Visual Control Requirements
1. **Padding/Spacing** - Visual box model with draggable sides
2. **Image Resizing** - 8-point handles with aspect ratio lock
3. **Column Widths** - Drag dividers between columns
4. **Mobile Stacking** - Visual drag-to-reorder interface
5. **Colors** - Visual swatches, not hex inputs
6. **Shadows/Borders** - Visual builders with live preview

## 🚀 Core Principles for Marketer Success

### 1. Zero Learning Curve
- **Intuitive drag-and-drop** - If a marketer can't figure it out in 30 seconds, redesign it
- **Smart defaults** - Every element should look professional immediately
- **Visual feedback** - Show exactly what will happen before they do it
- **Contextual help** - Tooltips and hints where marketers need them
- **VISUAL CONTROLS ONLY** - No confusing input fields, everything must be visual and draggable

### 2. Speed to Beautiful
- **One-click templates** - Pre-designed sections ready to use
- **Quick Add panel** - Most-used components at their fingertips
- **Smart suggestions** - AI-powered "what goes well here" recommendations
- **Brand consistency** - Automatic brand application to all elements

### 3. Marketer-Centric Features

#### Quick Add Library
```javascript
// Categories marketers actually use
const quickAddCategories = {
  'Hero Sections': ['Welcome Hero', 'Sale Hero', 'Product Launch Hero'],
  'Products': ['Single Product', 'Product Grid', 'Featured Product'],
  'Social Proof': ['Reviews', 'Testimonials', 'Social Feed'],
  'Promotions': ['Discount Banner', 'Countdown Timer', 'Coupon Code'],
  'Content': ['Article Preview', 'Blog Grid', 'Video Section'],
  'CTAs': ['Button Group', 'Shop Now Bar', 'Multi-CTA']
}
```

#### Smart Content Blocks
- **Dynamic product recommendations** - Pull from store catalog
- **Personalization tokens** - {{first_name}}, {{last_purchase}}, etc.
- **Conditional content** - Show/hide based on segments
- **Live countdown timers** - Urgency that actually works in email

## 📊 Enterprise Features That Matter

### 1. Template Management
```javascript
const templateFeatures = {
  // Save as reusable template
  saveAsTemplate: true,
  
  // Template categories
  categories: ['Promotional', 'Welcome Series', 'Abandoned Cart', 'Newsletter'],
  
  // Version control
  versionHistory: true,
  autoSave: true,
  
  // Sharing & permissions
  teamSharing: true,
  approvalWorkflow: true,
  
  // Template analytics
  performanceTracking: true
}
```

### 2. Brand Control System

#### Instant Brand Application
```javascript
const brandSystem = {
  // Multiple brands per account
  multiBrand: true,
  
  // Brand switcher
  brandSwitcher: {
    position: 'topBar',
    showPreview: true,    // Show brand colors/logo in dropdown
    instantApply: true,   // Apply immediately on selection
    preserveLayout: true, // Keep layout, just swap brand elements
    
    // What changes when brand switches
    brandElements: {
      logos: 'instant',
      colors: 'animated', // Smooth transition
      fonts: 'instant',
      spacing: 'preserve',
      content: 'preserve'
    }
  },
  
  // Brand lock - prevent off-brand changes
  brandLock: {
    enabled: false, // Can be toggled
    elements: {
      colors: true,
      fonts: true,
      logos: true,
      spacing: false
    },
    override: 'adminOnly' // Who can override
  },
  
  // Smart brand application
  smartBranding: {
    // Automatic replacements
    replacements: {
      '{{BRAND_NAME}}': 'brand.name',
      '{{BRAND_LOGO}}': 'brand.logo.primary',
      '{{BRAND_LOGO_DARK}}': 'brand.logo.dark',
      '{{PRIMARY_COLOR}}': 'brand.colors.primary',
      '{{SECONDARY_COLOR}}': 'brand.colors.secondary',
      '{{ACCENT_COLOR}}': 'brand.colors.accent',
      '{{FONT_HEADING}}': 'brand.fonts.heading',
      '{{FONT_BODY}}': 'brand.fonts.body'
    },
    
    // Component-specific branding
    componentBranding: {
      button: {
        background: 'brand.colors.primary',
        text: 'brand.colors.buttonText',
        borderRadius: 'brand.style.borderRadius'
      },
      header: {
        background: 'brand.colors.headerBg',
        logo: 'brand.logo.primary'
      },
      footer: {
        background: 'brand.colors.footerBg',
        text: 'brand.colors.footerText'
      }
    }
  },
  
  // Brand templates
  brandTemplates: {
    autoTag: true,        // Tag templates with brand
    brandSpecific: true,  // Some templates only for certain brands
    autoAdapt: true      // Adapt any template to selected brand
  }
}
```

#### Brand Data Structure (MongoDB Schema)
```javascript
// Actual brand object from MongoDB
const brandSchema = {
  _id: ObjectId,
  store_id: ObjectId,
  store_public_id: String,
  name: String,           // Internal name
  brandName: String,      // Display name
  slug: String,
  
  // Brand Identity
  brandTagline: String,
  brandVoice: [String],     // e.g., ["Authentic", "Conversational"]
  brandPersonality: [String], // e.g., ["Down-to-earth", "Rebellious"]
  coreValues: [String],
  originStory: String,
  missionStatement: String,
  uniqueValueProposition: String,
  
  // Visual Identity - CRITICAL FOR COLOR PICKER
  primaryColor: [{
    hex: String,          // e.g., "#085b92"
    name: String,         // e.g., "Primary Color 1"
    _id: ObjectId
  }],
  
  secondaryColors: [{
    hex: String,          // e.g., "#4e4451"
    name: String,         // e.g., "Secondary Color 1"
    _id: ObjectId
  }],
  
  brandFontColor: String,  // e.g., "#000000"
  emailFallbackFont: String, // e.g., "Arial"
  
  // Button Styling
  buttonBackgroundColor: String, // Usually matches primaryColor[0].hex
  buttonTextColor: String,
  buttonBorderRadius: Number,
  buttonPadding: Number,
  buttonShadowIntensity: Number,
  buttonSize: String,
  buttonStyle: String,      // e.g., "solid", "gradient"
  buttonEffect: String,     // e.g., "gradient"
  
  // Logo Configuration
  logo: {
    primary_logo_url: String,
    logo_alt_text: String,
    logo_type: String,
    brand_name: String
  },
  logoAlignment: String,   // e.g., "center"
  
  // Header/Footer
  headerStyle: String,
  headerBackgroundColor: String,
  headerLinks: [Object],
  socialLinks: [{
    platform: String,
    name: String,
    icon: String,
    handle: String,
    url: String,
    _id: ObjectId
  }],
  socialIconStyle: String,
  
  // Target Audience
  targetAudienceAge: [String],
  targetAudienceGender: [String],
  customerPainPoints: [String],
  customerAspirations: [String],
  geographicFocus: [String],
  
  // Products & Categories
  mainProductCategories: [String],
  bestsellingProducts: [String],
  uniqueSellingPoints: String,
  featuredCollection: String,
  
  // Email Strategy
  emailFrequency: String,
  contentPriority: [String],
  primaryCampaignObjective: String,
  secondaryObjectives: [String],
  
  // Trust & Social Proof
  trustBadgeStyle: String,
  selectedBenefits: [{
    id: String,
    name: String,
    icon: String,
    description: String,
    _id: ObjectId
  }],
  
  // Status
  isActive: Boolean,
  isDefault: Boolean,
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}

// Example brand colors extraction for color picker
const extractBrandColors = (brand) => {
  const colors = [];
  
  // Add primary colors
  if (brand.primaryColor?.length > 0) {
    brand.primaryColor.forEach(color => {
      colors.push({
        hex: color.hex,
        name: color.name || 'Primary',
        type: 'primary'
      });
    });
  }
  
  // Add secondary colors
  if (brand.secondaryColors?.length > 0) {
    brand.secondaryColors.forEach(color => {
      colors.push({
        hex: color.hex,
        name: color.name || 'Secondary',
        type: 'secondary'
      });
    });
  }
  
  // Add button color if different
  if (brand.buttonBackgroundColor && 
      !colors.find(c => c.hex === brand.buttonBackgroundColor)) {
    colors.push({
      hex: brand.buttonBackgroundColor,
      name: 'Button',
      type: 'button'
    });
  }
  
  // Add text colors
  if (brand.brandFontColor) {
    colors.push({
      hex: brand.brandFontColor,
      name: 'Text',
      type: 'text'
    });
  }
  
  if (brand.buttonTextColor && 
      !colors.find(c => c.hex === brand.buttonTextColor)) {
    colors.push({
      hex: brand.buttonTextColor,
      name: 'Button Text',
      type: 'text'
    });
  }
  
  return colors;
};
  
  // Typography
  fonts: {
    heading: {
      family: 'Montserrat, Arial, sans-serif',
      weight: '700',
      sizes: {
        h1: '36px',
        h2: '28px',
        h3: '24px'
      }
    },
    body: {
      family: 'Open Sans, Arial, sans-serif',
      weight: '400',
      size: '16px',
      lineHeight: '1.6'
    }
  },
  
  // Style preferences
  style: {
    borderRadius: '8px',
    buttonStyle: 'rounded', // 'square', 'rounded', 'pill'
    shadowIntensity: 'medium',
    spacing: 'comfortable' // 'compact', 'comfortable', 'spacious'
  },
  
  // Content defaults
  content: {
    tagline: 'Your Brand Tagline',
    footer: '© 2024 Brand Name. All rights reserved.',
    socialLinks: {
      facebook: 'url',
      instagram: 'url',
      twitter: 'url'
    }
  }
}
```

### 3. Content Intelligence
- **Subject line AI** - Suggest high-performing subject lines
- **Preview text optimizer** - Maximize open rates
- **Content scoring** - Rate emails for engagement potential
- **Accessibility checker** - Ensure ADA compliance
- **Spam score checker** - Avoid the promotions tab

## 🎨 User Experience Excellence

### Advanced Preview System

#### 1. Multi-Device Preview
```javascript
const previewSystem = {
  // Device types with accurate dimensions
  devices: {
    desktop: {
      name: 'Desktop',
      width: 1920,
      viewportWidth: 600, // Email width
      icon: '🖥️',
      description: 'Gmail, Outlook Desktop'
    },
    mobile: {
      name: 'iPhone 14',
      width: 390,
      height: 844,
      icon: '📱',
      description: 'Apple Mail, Gmail App'
    },
    tablet: {
      name: 'iPad',
      width: 768,
      height: 1024,
      icon: '📱',
      description: 'Tablet Mail Apps'
    },
    watch: {
      name: 'Apple Watch',
      width: 162,
      height: 197,
      icon: '⌚',
      description: 'Smartwatch Preview'
    }
  },
  
  // Email client preview
  emailClients: {
    gmail: { light: true, dark: true },
    outlook: { light: true, dark: true },
    appleMail: { light: true, dark: true },
    yahoo: { light: true, dark: false },
    androidMail: { light: true, dark: true }
  },
  
  // Preview modes
  modes: {
    splitScreen: true, // Side-by-side desktop/mobile
    deviceFrame: true, // Show device bezels
    scrollSync: true,  // Sync scroll between previews
    realTime: true     // Live preview updates
  }
}
```

#### 2. Dark Mode Excellence
```javascript
const darkModeFeatures = {
  // Automatic dark mode conversion
  autoConversion: {
    enabled: true,
    preserveBrand: true,
    
    // Smart color inversion
    colorMapping: {
      '#ffffff': '#1a1a1a', // White to dark
      '#000000': '#ffffff', // Black to white
      // Brand colors stay consistent
    },
    
    // Element-specific rules
    elements: {
      backgrounds: 'invert',
      text: 'invert',
      images: 'preserve',
      logos: 'switchToDarkVersion',
      buttons: 'adjustContrast'
    }
  },
  
  // Preview options
  preview: {
    toggle: 'instant',
    sideBySide: true,
    clientSpecific: true, // Show how each client handles dark mode
    autoDetect: true      // Use system preference
  },
  
  // Brand dark mode settings
  brandDarkMode: {
    separateLogos: true,  // Light/dark logo versions
    colorPalettes: true,  // Light/dark color schemes
    autoGenerate: true    // AI-generate dark version
  }
}
```

#### 3. Canvas Behavior
```javascript
const canvasFeatures = {
  // True WYSIWYG
  exactRendering: true,
  
  // Zoom controls
  zoomControls: {
    levels: ['25%', '50%', '75%', '100%', '125%', '150%', '200%'],
    fitToScreen: true,
    pinchToZoom: true,
    keyboardShortcuts: {
      zoomIn: 'Cmd+Plus',
      zoomOut: 'Cmd+Minus',
      reset: 'Cmd+0'
    }
  },
  
  // Live preview panel
  livePreview: {
    position: 'right', // Or 'bottom', 'floating'
    resizable: true,
    collapsible: true,
    instantUpdate: true
  },
  
  // Grid and guides
  visualAids: {
    snapToGrid: true,
    gridSize: [10, 20, 30],
    alignmentGuides: true,
    rulers: true,
    margins: true
  }
}
```

#### 2. Visual Inline Editing
```javascript
const inlineEditing = {
  // Click to edit text
  directTextEdit: true,
  
  // Image replacement
  dragDropImages: true,
  oneClickReplace: true,
  
  // Quick formatting toolbar
  floatingToolbar: true,
  
  // Link management
  smartLinkSuggestions: true,
  utmAutoTagging: true,
  
  // Visual padding controls
  paddingHandles: {
    enabled: true,
    type: 'visual', // Visual box model, not input fields
    showOnHover: true,
    dragToAdjust: true,
    snapToGrid: [0, 8, 16, 24, 32, 48, 64],
    symmetricMode: true, // Link opposite sides
    showPixelValue: true // Show px while dragging
  },
  
  // Image resizing
  imageResizing: {
    handles: 'corners-and-sides', // 8 resize handles
    maintainAspectRatio: true,
    smartCrop: true,
    dragToResize: true,
    percentageMode: true,
    responsiveBreakpoints: true
  }
}
```

#### 3. Visual Properties Panel
```javascript
const propertiesPanel = {
  // Grouped settings
  groups: ['Content', 'Style', 'Layout', 'Advanced'],
  
  // Visual controls only - NO multiple input fields
  visualControls: {
    padding: 'boxModel', // Visual box model diagram
    margin: 'boxModel',
    borders: 'visualPicker',
    shadows: 'visualBuilder',
    colors: 'swatchGrid'
  },
  
  // Presets
  quickStyles: ['Primary', 'Secondary', 'Minimal', 'Bold'],
  
  // Mobile-specific settings
  mobileOverrides: true,
  
  // One-click adjustments
  quickActions: {
    spacing: [0, 8, 16, 24, 32, 48], // px buttons
    alignment: ['left', 'center', 'right'],
    width: ['25%', '50%', '75%', '100%', 'Auto']
  }
}
```

## 🎯 Visual Editing Excellence

### Padding & Spacing Controls

#### Visual Box Model (NOT Input Fields)
```javascript
const paddingControls = {
  // Visual box model in properties panel
  boxModelDiagram: {
    type: 'interactive-diagram',
    display: 'always-visible',
    
    // Visual representation like browser DevTools
    layout: {
      margin: {
        color: '#f4a460',
        draggable: true,
        linkedSides: true // Toggle to link/unlink sides
      },
      border: {
        color: '#ffd700',
        draggable: false, // Separate border controls
      },
      padding: {
        color: '#90ee90',
        draggable: true,
        linkedSides: true
      },
      content: {
        color: '#87ceeb',
        showDimensions: true
      }
    },
    
    // Drag behavior
    dragBehavior: {
      showValue: true, // Show "24px" while dragging
      snapPoints: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80],
      smoothDrag: true,
      multiTouch: true // Pinch to adjust all sides
    },
    
    // Quick presets below diagram
    presets: {
      'None': { all: 0 },
      'Tight': { all: 8 },
      'Normal': { all: 16 },
      'Comfortable': { vertical: 24, horizontal: 32 },
      'Spacious': { all: 48 }
    }
  },
  
  // In-canvas padding handles
  canvasHandles: {
    showOnHover: true,
    visualIndicators: {
      top: { color: 'blue', handle: 'horizontal-bar' },
      right: { color: 'blue', handle: 'vertical-bar' },
      bottom: { color: 'blue', handle: 'horizontal-bar' },
      left: { color: 'blue', handle: 'vertical-bar' }
    },
    
    // Drag to adjust directly on canvas
    dragAdjustment: {
      enabled: true,
      showGuides: true, // Alignment guides
      showMeasurements: true, // "24px" tooltip
      symmetricMode: 'shift-key', // Hold shift for symmetric
      fineControl: 'alt-key' // Hold alt for 1px increments
    }
  }
}
```

#### Smart Spacing System
```javascript
const spacingSystem = {
  // Visual spacing adjustments
  betweenElements: {
    type: 'drag-handle', // Drag handle between elements
    visualBar: true, // Show blue bar between elements
    quickPresets: [0, 8, 16, 24, 32], // Quick click options
    dragToAdjust: true
  },
  
  // Section spacing
  sectionSpacing: {
    visualHandles: 'top-and-bottom',
    presetButtons: true, // Quick spacing buttons
    autoCollapse: true // Remove spacing with double-click
  },
  
  // Column gaps
  columnGaps: {
    visualIndicator: true,
    dragToAdjust: true,
    uniformGaps: true, // Keep gaps equal
    responsiveGaps: true // Different gaps for mobile
  }
}
```

### Image & Media Controls

#### Visual Image Resizing
```javascript
const imageControls = {
  // Resize handles directly on image
  resizeHandles: {
    visible: 'on-select', // Show when image selected
    handlePositions: [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ],
    
    // Resize behavior
    behavior: {
      maintainAspectRatio: true, // Default on
      shiftToToggle: true, // Shift to toggle aspect ratio
      showDimensions: true, // Show "600 × 400" while resizing
      percentageMode: true, // Show "100%" option
      
      // Smart snapping
      snapToSizes: ['25%', '33%', '50%', '66%', '75%', '100%'],
      snapToColumns: true, // Snap to column widths
      
      // Constraints
      minWidth: 50,
      maxWidth: '100%',
      responsiveScaling: true
    }
  },
  
  // Quick image tools overlay
  imageOverlay: {
    showOnHover: true,
    tools: [
      { icon: 'crop', action: 'smartCrop' },
      { icon: 'replace', action: 'replaceImage' },
      { icon: 'link', action: 'addLink' },
      { icon: 'alt', action: 'editAltText' },
      { icon: 'effects', action: 'imageEffects' }
    ]
  },
  
  // Focal point for mobile cropping
  focalPoint: {
    enabled: true,
    visualPicker: true, // Click to set focal point
    presets: ['center', 'face-detect', 'top', 'bottom']
  }
}
```

### Component-Specific Visual Controls

#### Button Visual Editor
```javascript
const buttonVisualControls = {
  // Padding adjustment
  paddingControl: {
    type: 'visual-handles',
    showOnSelect: true,
    
    // Visual padding indicators
    handles: {
      horizontal: {
        left: true,
        right: true,
        linked: true, // Adjust both sides together
        color: 'blue',
        dragToAdjust: true
      },
      vertical: {
        top: true,
        bottom: true,
        linked: true,
        color: 'blue',
        dragToAdjust: true
      }
    },
    
    // Quick presets bar
    quickPresets: {
      position: 'above-button',
      options: [
        { label: 'S', padding: '8px 16px' },
        { label: 'M', padding: '12px 24px' },
        { label: 'L', padding: '16px 32px' },
        { label: 'XL', padding: '20px 40px' }
      ]
    }
  },
  
  // Border radius visual control
  borderRadius: {
    type: 'corner-handles',
    visualHandles: true, // Drag corners to adjust radius
    presets: ['square', 'rounded', 'pill'],
    symmetricMode: true
  }
}
```

#### Text Component Visual Controls
```javascript
const textVisualControls = {
  // Line height visual adjustment
  lineHeight: {
    type: 'visual-slider',
    showPreview: true, // Live preview
    visualGuides: true, // Show line height guides
    presets: ['Tight', 'Normal', 'Relaxed', 'Loose']
  },
  
  // Letter spacing
  letterSpacing: {
    type: 'visual-drag',
    showIndicators: true, // Visual spacing indicators
    presets: ['Normal', 'Wide', 'Wider']
  },
  
  // Text alignment
  alignment: {
    type: 'visual-buttons',
    position: 'floating-toolbar',
    options: ['left', 'center', 'right', 'justify']
  }
}
```

### Mobile Stacking Controls

#### Visual Column Stacking
```javascript
const mobileStackingControls = {
  // Visual stacking order
  stackingOrder: {
    type: 'drag-to-reorder',
    visualPreview: true, // Show preview while dragging
    
    // Visual indicators
    interface: {
      showNumbers: true, // 1, 2, 3 badges
      dragHandles: true, // Grip handles for dragging
      previewMode: 'ghost', // Ghost preview while dragging
      
      // Quick actions
      quickReverse: true, // One-click reverse order
      hideOnMobile: true, // Toggle visibility per column
    }
  },
  
  // Breakpoint preview
  breakpointPreview: {
    type: 'visual-slider',
    showWidth: true, // "480px" indicator
    livePreview: true, // Preview changes as sliding
    snapPoints: [320, 375, 414, 480, 768]
  }
}
```

### Component Library Excellence

#### Essential Marketing Components
1. **Heroes**
   - Full-width image hero
   - Split hero (image + text)
   - Video thumbnail hero
   - Countdown hero

2. **Products**
   - Single product showcase
   - Product carousel
   - Product grid (2, 3, 4 columns)
   - Product with reviews

3. **Social Proof**
   - Star ratings
   - Customer testimonials
   - Instagram feed
   - Review carousel

4. **Urgency & Scarcity**
   - Countdown timers
   - Stock indicators
   - Limited time badges
   - Flash sale banners

5. **Personalization**
   - Dynamic product recommendations
   - Recently viewed items
   - Abandoned cart recovery
   - Personalized offers

6. **Navigation**
   - Menu bar
   - Category pills
   - Breadcrumbs
   - Footer with social icons

## 🔧 Technical Implementation

### Component Structure
```javascript
// Every component must have
interface EmailComponent {
  // Unique identifier
  id: string;
  
  // Display name for marketers
  displayName: string;
  
  // Category for organization
  category: 'hero' | 'product' | 'content' | 'cta' | 'social';
  
  // Preview thumbnail
  thumbnail: string;
  
  // Marketer-friendly description
  description: string;
  
  // Default content with smart placeholders
  defaultContent: {
    desktop: HTMLString;
    mobile: HTMLString;
  };
  
  // Customizable properties
  properties: PropertySchema[];
  
  // Performance impact
  loadTime: 'instant' | 'fast' | 'moderate';
  
  // Email client support
  compatibility: ClientSupport[];
}
```

### Drag and Drop Excellence
```javascript
const dragDropFeatures = {
  // Visual feedback
  ghostPreview: true,
  dropZoneHighlight: true,
  invalidDropIndicator: true,
  
  // Smart insertion
  autoSpacing: true,
  intelligentPlacement: true,
  
  // Multi-select
  multiSelectDrag: true,
  
  // Keyboard support
  keyboardShortcuts: {
    duplicate: 'Cmd+D',
    delete: 'Delete',
    undo: 'Cmd+Z',
    redo: 'Cmd+Shift+Z'
  }
}
```

### Performance Standards
```javascript
const performanceTargets = {
  // Load time
  initialLoad: '<2s',
  templateSwitch: '<500ms',
  componentAdd: '<100ms',
  
  // Responsiveness
  dragLatency: '<16ms',
  typingLatency: '<50ms',
  
  // Auto-save
  autoSaveInterval: '30s',
  autoSaveSpeed: '<200ms'
}
```

## 🖥️ Advanced Preview Interface

### Preview Toolbar
```javascript
const previewToolbar = {
  // Location
  position: 'top', // Sticky top bar
  
  // Device selector
  deviceSelector: {
    type: 'dropdown', // or 'tabs'
    showIcon: true,
    showDimensions: true,
    customDevices: true, // Allow custom dimensions
    
    // Quick access devices
    quickAccess: ['Desktop', 'iPhone', 'Gmail Dark']
  },
  
  // Dark mode toggle
  darkModeToggle: {
    type: 'switch',
    showLabel: true,
    position: 'center',
    animateTransition: true
  },
  
  // Email client selector
  clientSelector: {
    grouped: true, // Group by platform
    showCompatibility: true, // Show support warnings
    favorites: ['Gmail', 'Outlook', 'Apple Mail']
  },
  
  // View options
  viewOptions: {
    splitView: {
      enabled: true,
      layouts: ['50/50', '70/30', '30/70'],
      orientation: ['vertical', 'horizontal']
    },
    fullscreen: true,
    pictureInPicture: true, // Floating preview window
    scrollSync: true
  },
  
  // Tools
  tools: {
    ruler: true,
    colorPicker: true,
    accessibilityChecker: true,
    loadTimeIndicator: true
  }
}
```

### Preview Modes
```javascript
const previewModes = {
  // Standard preview
  standard: {
    name: 'Editor Preview',
    description: 'Real-time preview as you edit',
    features: ['instant', 'interactive']
  },
  
  // Test send preview
  testSend: {
    name: 'Test Send',
    description: 'Send actual email to test addresses',
    features: ['realEmail', 'multipleAddresses', 'trackOpens']
  },
  
  // Inbox preview
  inboxPreview: {
    name: 'Inbox Preview',
    description: 'See how email appears in inbox list',
    showSubject: true,
    showPreviewText: true,
    showSender: true,
    showTimestamp: true
  },
  
  // Client-specific preview
  clientSpecific: {
    name: 'Email Client Preview',
    description: 'Accurate rendering per client',
    clients: {
      gmail: {
        versions: ['Web', 'iOS', 'Android'],
        quirks: ['No background images', 'Limited CSS']
      },
      outlook: {
        versions: ['2019', '365', 'Web'],
        quirks: ['Table-based layout required', 'Limited spacing']
      },
      appleMail: {
        versions: ['macOS', 'iOS'],
        quirks: ['Best CSS support', 'Dark mode auto']
      }
    }
  },
  
  // Accessibility preview
  accessibilityPreview: {
    name: 'Accessibility Check',
    description: 'View with screen reader simulation',
    features: ['altText', 'colorContrast', 'readingOrder']
  }
}
```

### Live Preview Features
```javascript
const livePreviewFeatures = {
  // Real-time updates
  updates: {
    debounce: 100, // ms delay before updating
    smooth: true,  // Animate changes
    highlight: true // Highlight changed elements
  },
  
  // Interactive elements
  interactive: {
    links: 'preview', // Show link destination on hover
    buttons: 'highlight',
    images: 'showAltOnHover'
  },
  
  // Preview annotations
  annotations: {
    personalization: {
      show: true,
      style: 'highlight', // or 'tooltip'
      color: '#ffd700'
    },
    dynamicContent: {
      show: true,
      style: 'border',
      color: '#00ff00'
    },
    conditionalContent: {
      show: true,
      style: 'overlay',
      showConditions: true
    }
  },
  
  // Performance indicators
  performance: {
    loadTime: true,
    imageOptimization: true,
    codeWeight: true,
    spamScore: true
  }
}
```

## 📱 Mobile-First Design

### Responsive Controls
```javascript
const responsiveFeatures = {
  // Breakpoints
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024
  },
  
  // Mobile-specific settings
  mobileSettings: {
    fontSize: true,
    padding: true,
    columnStacking: true,
    hideOnMobile: true
  },
  
  // Preview modes
  previewModes: {
    sideBySide: true,
    deviceFrame: true,
    actualSize: true
  }
}
```

### Mobile Optimization
- **Automatic text resizing** - Ensure readability
- **Touch-friendly CTAs** - Minimum 44px tap targets
- **Single column fallback** - Stack columns on mobile
- **Image optimization** - Responsive images with proper sizing
- **Simplified navigation** - Hamburger menus for mobile

## 🎯 Conversion Optimization Tools

### Built-in Best Practices
1. **CTA Optimization**
   - Above-the-fold placement checker
   - Contrast ratio validator
   - Multiple CTA warnings
   - Button size recommendations

2. **Content Hierarchy**
   - F-pattern layout suggestions
   - Scanability score
   - Reading time estimate
   - Cognitive load indicator

3. **Engagement Boosters**
   - Interactive element suggestions
   - Personalization opportunities
   - Social proof placement
   - Urgency element recommendations

## 🔄 Workflow Integration

### Team Collaboration
```javascript
const collaborationFeatures = {
  // Real-time collaboration
  simultaneousEditing: true,
  presenceIndicators: true,
  
  // Comments & feedback
  inlineComments: true,
  versionComments: true,
  
  // Approval workflow
  approvalStages: ['Draft', 'Review', 'Approved', 'Scheduled'],
  rolePermissions: true,
  
  // Asset management
  sharedAssetLibrary: true,
  brandAssetLock: true
}
```

### Platform Integrations
- **ESP Integration** - Direct send to Klaviyo, Mailchimp, etc.
- **E-commerce** - Shopify, WooCommerce product sync
- **Analytics** - Google Analytics, Segment tracking
- **Asset Libraries** - Unsplash, Getty Images, GIPHY
- **URL Shorteners** - Bitly, Rebrandly integration
- **Translation** - Multi-language support

## 📈 Analytics & Insights

### Performance Tracking
```javascript
const analyticsFeatures = {
  // Email performance
  metrics: ['opens', 'clicks', 'conversions', 'revenue'],
  
  // Heatmaps
  clickHeatmap: true,
  scrollDepth: true,
  
  // A/B testing
  splitTesting: {
    subjects: true,
    content: true,
    sendTime: true
  },
  
  // Recommendations
  aiInsights: true,
  competitorBenchmarks: true
}
```

## 🚫 Common Pitfalls to Avoid

### Marketer Pain Points to Solve
1. **Complex interfaces** - Keep it simple and visual
2. **Hidden features** - Make everything discoverable
3. **Slow performance** - Every millisecond counts
4. **Breaking changes** - Preserve work at all costs
5. **Confusing terminology** - Use marketer language, not dev speak
6. **Limited templates** - Provide extensive, quality templates
7. **Poor mobile experience** - Mobile must be perfect
8. **Inflexible designs** - Allow customization without complexity

## ✅ Success Metrics

### Key Performance Indicators
- **Time to first email**: <5 minutes
- **Template creation time**: 50% faster than Klaviyo
- **User satisfaction**: >4.8/5 stars
- **Support tickets**: <5% of users need help
- **Template reuse rate**: >70%
- **Mobile responsiveness**: 100% of templates
- **Accessibility score**: WCAG AA compliant

## 🎓 Onboarding Excellence

### First-Time User Experience
1. **Interactive tutorial** - Build first email while learning
2. **Template wizard** - Answer 3 questions, get perfect template
3. **Smart defaults** - Everything looks good out of the box
4. **Progress indicators** - Show how close to sending
5. **Success celebration** - Celebrate their first email

### Help & Support
```javascript
const supportFeatures = {
  // In-app help
  contextualTooltips: true,
  videoTutorials: true,
  searchableHelp: true,
  
  // AI assistance
  aiChatSupport: true,
  contentSuggestions: true,
  
  // Community
  templateGallery: true,
  communityForum: true,
  
  // Expert help
  liveChat: true,
  designServices: true
}
```

## 🔮 Future Roadmap

### Next-Gen Features
1. **AI Content Generation** - Complete emails from prompts
2. **Predictive Performance** - Know success before sending
3. **Voice Commands** - "Add a product grid with our top sellers"
4. **Auto-optimization** - Self-improving templates
5. **Cross-channel** - Email to SMS/Push adaptation
6. **Behavioral triggers** - Smart automation suggestions

---

*Last Updated: Current Session*
*Version: 3.0 - Enterprise Marketer Edition*
*Goal: Best-in-class email builder that delights marketers*

## Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)
- [x] Core drag-and-drop system (V3 with DragDropManager)
- [x] Basic component library
- [x] WYSIWYG canvas (V3 with enhanced features)
- [x] Brand system
- [ ] Save/load functionality
- [x] Quick Add panel (V4 with hover states)
- [ ] Template library
- [ ] Inline editing
- [ ] Mobile preview
- [ ] Properties panel

### Completed Features (Current Implementation)
- [x] Enhanced drag-and-drop with visual feedback
- [x] Sophisticated hover state management with invisible bridge
- [x] Multiple drop zone variants (canvas, edge, between, minimal)
- [x] Section controls with layout options
- [x] Auto-scroll during drag operations
- [x] Native HTML5 drag event compatibility
- [x] Quick Add panel with 2-panel layout and smart hover



### Phase 2: Intelligence (Weeks 7-8)
- [ ] AI suggestions
- [ ] Performance scoring
- [ ] Auto-optimization
- [ ] Smart templates
- [ ] Predictive analytics

## 📝 Text Editing Best Practices for Enterprise SaaS

### Critical Focus Management Principles

#### 1. Stable Element References
```javascript
// NEVER: Re-render elements during editing
const TextEditor = ({ element }) => {
  // BAD: Key changes cause focus loss
  return <div key={element.id + element.content}>...</div>
}

// ALWAYS: Use stable references
const TextEditor = ({ element }) => {
  const elementIdRef = useRef(element.id); // Stable reference
  return <div key={elementIdRef.current}>...</div>
}
```

#### 2. Debounced Updates
```javascript
// Prevent rapid re-renders that cause cursor jumping
const handleContentChange = () => {
  // Clear any pending update
  if (updateTimeoutRef.current) {
    clearTimeout(updateTimeoutRef.current);
  }
  
  // Debounce updates to parent
  updateTimeoutRef.current = setTimeout(() => {
    onUpdate(updatedElement);
  }, 100); // 100ms debounce prevents cursor jump
}
```

#### 3. Focus Restoration Pattern
```javascript
// Save and restore cursor position during updates
const saveCursorPosition = () => {
  const sel = window.getSelection();
  const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  return range ? {
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    startContainer: range.startContainer,
    endContainer: range.endContainer
  } : null;
};

const restoreCursorPosition = (position) => {
  if (!position) return;
  
  requestAnimationFrame(() => {
    try {
      const newRange = document.createRange();
      newRange.setStart(position.startContainer, position.startOffset);
      newRange.setEnd(position.endContainer, position.endOffset);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(newRange);
    } catch (e) {
      // Graceful fallback
    }
  });
};
```

#### 4. Proper useEffect Dependencies
```javascript
// CRITICAL: Don't re-focus on every render
useEffect(() => {
  if (isEditing && editorRef.current) {
    requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      const isAlreadyFocused = editorRef.current.contains(activeElement);
      
      if (!isAlreadyFocused) {
        editorRef.current.focus();
        // Place cursor at end only if newly focusing
      }
    });
  }
}, [isEditing]); // NOT [isEditing, element] - avoid re-focusing
```

### Rich Text Editor Requirements

#### Visual Toolbar Positioning
```javascript
const toolbarPositioning = {
  // Smart positioning to avoid overlap
  calculatePosition: () => {
    const cursorY = getCursorPosition();
    const viewportHeight = window.innerHeight;
    const toolbarHeight = 60;
    
    // Position above or below based on space
    if (cursorY > toolbarHeight + 50) {
      return { top: cursorY - toolbarHeight - 20, placement: 'above' };
    } else if (viewportHeight - cursorY > toolbarHeight + 50) {
      return { top: cursorY + 40, placement: 'below' };
    } else {
      return { top: 20, placement: 'fixed' };
    }
  },
  
  // Smooth transitions
  transition: 'top 0.15s ease',
  
  // Stay visible during editing
  hideDelay: 200,
  showOnFocus: true
};
```

#### Multi-Instance Text Editing
```javascript
// Prevent focus stealing between multiple text editors
const MultiTextEnvironment = {
  // Each editor manages its own state
  isolation: {
    separateRefs: true,
    independentFocus: true,
    noGlobalListeners: true
  },
  
  // Async updates to prevent conflicts
  updateStrategy: {
    async: true,
    debounced: true,
    queueUpdates: false // Process immediately after debounce
  },
  
  // Clear visual feedback
  activeIndicators: {
    outline: '2px solid #8b5cf6',
    outlineOffset: '2px',
    toolbar: 'per-instance'
  }
};
```

### Performance Optimizations

#### 1. ContentEditable Best Practices
```javascript
// Minimize DOM mutations
const efficientTextHandling = {
  // Only update if content actually changed
  shouldUpdate: (oldHtml, newHtml) => oldHtml !== newHtml,
  
  // Use innerHTML efficiently
  updateContent: (element, html) => {
    if (element.innerHTML !== html) {
      element.innerHTML = html;
    }
  },
  
  // Prevent unnecessary re-renders
  memoization: {
    useCallback: true,
    useMemo: true,
    React.memo: true
  }
};
```

#### 2. Event Handler Optimization
```javascript
// Efficient event handling
const optimizedEvents = {
  // Debounce input events
  onInput: debounce(handleInput, 100),
  
  // Throttle selection changes
  onSelectionChange: throttle(updateToolbar, 50),
  
  // Batch DOM reads
  onMouseUp: () => {
    requestAnimationFrame(() => {
      updateToolbarState();
      updateToolbarPosition();
    });
  }
};
```

### Testing Text Editors

#### Comprehensive Playwright Tests
```javascript
// Essential test scenarios for text editing
const textEditorTests = [
  {
    name: 'Focus retention during typing',
    test: async (page) => {
      // Type continuously and verify focus doesn't jump
      for (let char of 'ABCDEFGHIJKLMNOP') {
        await page.keyboard.type(char);
        const focusIndex = await getFocusedElementIndex(page);
        expect(focusIndex).toBe(0); // Should stay in first element
      }
    }
  },
  
  {
    name: 'Multiple text blocks independence',
    test: async (page) => {
      // Edit multiple blocks and verify isolation
      await editTextBlock(page, 0, 'First block');
      await editTextBlock(page, 1, 'Second block');
      const contents = await getAllTextContents(page);
      expect(contents[0]).toContain('First block');
      expect(contents[1]).toContain('Second block');
    }
  },
  
  {
    name: 'Toolbar visibility and positioning',
    test: async (page) => {
      await focusTextEditor(page);
      const toolbarVisible = await page.isVisible('.text-toolbar');
      expect(toolbarVisible).toBe(true);
    }
  },
  
  {
    name: 'Rapid switching between editors',
    test: async (page) => {
      // Quickly switch focus between editors
      for (let i = 0; i < 5; i++) {
        await page.locator('.text-content').nth(0).dblclick();
        await page.keyboard.type(`[${i}]`);
        await page.locator('.text-content').nth(1).dblclick();
        await page.keyboard.type(`[${i}]`);
      }
      // Verify no content mixing
    }
  }
];
```

### User Experience Guidelines

#### Double-Click to Edit
```javascript
const doubleClickEditing = {
  // Clear visual hints
  hoverState: {
    outline: '1px dashed rgba(139, 92, 246, 0.3)',
    tooltip: 'Double-click to edit',
    cursor: 'text'
  },
  
  // Instant activation
  activationDelay: 0,
  
  // Clear edit mode indicators
  editingState: {
    outline: '2px solid #8b5cf6',
    background: '#fafafa',
    showToolbar: true
  }
};
```

#### Save on Blur Pattern
```javascript
const saveOnBlur = {
  // Auto-save when clicking outside
  onBlur: () => {
    handleContentChange();
    setTimeout(() => {
      if (!document.activeElement?.closest('.text-toolbar')) {
        setShowToolbar(false);
        onStopEditing?.();
      }
    }, 200); // Delay allows toolbar interaction
  },
  
  // Visual feedback
  savingIndicator: {
    show: true,
    message: 'Saving...',
    duration: 500
  }
};
```

### Common Pitfalls to Avoid

#### ❌ DON'T DO THIS
```javascript
// 1. Don't update element in useEffect dependencies
useEffect(() => {
  // This causes infinite re-focusing
}, [element]); // BAD!

// 2. Don't use synchronous parent updates
onUpdate(updatedElement); // Causes immediate re-render

// 3. Don't use element properties as keys
<div key={element.content}>...</div> // Key changes = focus loss

// 4. Don't forget to cleanup timeouts
// Memory leaks from uncleaned timeouts
```

#### ✅ DO THIS INSTEAD
```javascript
// 1. Minimize useEffect dependencies
useEffect(() => {
  // Only re-run when editing state changes
}, [isEditing]); // GOOD!

// 2. Use async updates
setTimeout(() => onUpdate(updatedElement), 0); // Defer update

// 3. Use stable keys
const idRef = useRef(element.id);
<div key={idRef.current}>...</div> // Stable key

// 4. Always cleanup
useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);
```

### Accessibility Requirements

#### Keyboard Navigation
```javascript
const keyboardSupport = {
  // Standard shortcuts
  shortcuts: {
    'Ctrl+B': 'bold',
    'Ctrl+I': 'italic',
    'Ctrl+U': 'underline',
    'Ctrl+Z': 'undo',
    'Ctrl+Y': 'redo',
    'Tab': 'indent',
    'Shift+Tab': 'outdent'
  },
  
  // Focus management
  tabOrder: {
    toolbar: 'accessible',
    content: 'natural',
    navigation: 'logical'
  },
  
  // Screen reader support
  ariaLabels: {
    editor: 'Text editor',
    toolbar: 'Formatting toolbar',
    buttons: 'descriptive'
  }
};
```

## 🏆 Production-Ready Best Practices (From Current Implementation)

### Quick Add Component Implementation
```javascript
// Best practice from your ComponentPanel
const quickAddImplementation = {
  // Preset components ready to drop
  presets: [
    'Header', 'Hero', 'Text Block', 'Image', 
    'Button', 'Divider', 'Spacer', 'Footer'
  ],
  
  // Visual preview on hover
  preview: {
    showOnHover: true,
    displayThumbnail: true,
    showDescription: true
  },
  
  // Instant drop behavior
  dropBehavior: {
    createSection: 'automatic',
    applyDefaults: 'smart-defaults',
    brandAware: true
  }
}
```

### State Management Excellence
```javascript
// Centralized state management pattern from page.js
const stateArchitecture = {
  // Top-level state in page component
  sections: useState([]),           // Main content structure
  selectedElement: useState(null),  // Active selection
  selectedBrand: useState(null),    // Brand context
  isDarkMode: useState(false),      // Theme state
  
  // Pass down as props for predictable data flow
  propagation: 'top-down',
  updates: 'callback-based',
  persistence: 'localStorage'
}
```

### Drag & Drop Excellence
```javascript
// Smart drop zone handling from EmailCanvas
const dropZoneStrategy = {
  // Multiple drop zone types
  types: ['component', 'section', 'element'],
  
  // Nested drop handling
  handleDrop: (item, monitor) => {
    const didDrop = monitor.didDrop()
    if (didDrop) return // Prevent double drops
    
    // Smart index calculation for insertion
    const adjustedIndex = oldIndex < newIndex ? newIndex - 1 : newIndex
  },
  
  // Visual feedback during drag
  dragStates: {
    isDraggingGlobal: boolean,
    isDraggingElement: boolean,
    draggedOverIndex: number,
    hoveredSection: id
  }
}
```

### Component Communication Pattern
```javascript
// Clean prop drilling from your implementation
const componentHierarchy = {
  'TemplateBuilderV2': {
    manages: ['global state', 'brand context', 'templates'],
    children: {
      'TopBar': { handles: 'save/load/navigation' },
      'ComponentPanel': { handles: 'component library' },
      'EmailCanvas': { 
        handles: 'section management',
        children: {
          'Section': { 
            handles: 'layout/content',
            children: {
              'ContentElement': { handles: 'individual elements' }
            }
          }
        }
      },
      'ComprehensivePropertiesPanel': { handles: 'element editing' }
    }
  }
}
```

### Visual Properties Panel Best Practices
```javascript
// From VisualPropertiesPanel.js
const visualControls = {
  // Box Model Editor with drag handles
  boxModel: {
    implementation: 'interactive-drag',
    feedback: 'real-time',
    values: 'visual-display'
  },
  
  // Smart parsing and formatting
  valueParsing: {
    input: 'flexible (20, 20px, 20 20, etc)',
    output: 'standardized (20px 20px 20px 20px)',
    display: 'simplified (show single value when uniform)'
  },
  
  // Visual feedback patterns
  interactions: {
    hover: 'highlight-handle',
    drag: 'show-guide-lines',
    release: 'smooth-transition'
  }
}
```

### Inline Text Editor Excellence
```javascript
// From InlineTextEditor.js
const textEditingPatterns = {
  // Email-safe font management
  fonts: {
    categories: ['System', 'Serif', 'Sans-Serif', 'Modern'],
    fallbacks: 'always-include',
    emailSafe: true
  },
  
  // Toolbar positioning logic
  toolbarPosition: {
    calculation: 'relative-to-viewport',
    placement: 'above-or-below',
    collision: 'auto-adjust'
  },
  
  // History management
  undo: {
    stack: 'maintain-history-array',
    index: 'track-current-position',
    limit: 50
  },
  
  // Focus management
  focusHandling: {
    autoFocus: 'on-edit-start',
    maintainFocus: 'during-toolbar-interaction',
    blurSave: 'auto-save-on-blur'
  }
}
```

### Modal Management Pattern
```javascript
// From component implementations
const modalPatterns = {
  // Column Layout Modal
  confirmationFlow: {
    trigger: 'user-action',
    state: 'pending-data',
    confirm: 'apply-changes',
    cancel: 'reset-state'
  },
  
  // Image Selection Modal
  asyncLoading: {
    loading: 'show-skeleton',
    error: 'graceful-fallback',
    success: 'smooth-transition'
  }
}
```

### Performance Optimizations
```javascript
// Observed optimizations in your code
const performancePatterns = {
  // Debounced updates
  textUpdates: {
    strategy: 'setTimeout',
    delay: 0, // Next tick
    batch: true
  },
  
  // Ref management
  refs: {
    editorRef: 'DOM-manipulation',
    toolbarRef: 'positioning',
    canvasRef: 'drop-zone-calculations'
  },
  
  // Event cleanup
  cleanup: {
    timeouts: 'clear-on-unmount',
    listeners: 'remove-on-destroy',
    subscriptions: 'unsubscribe'
  }
}
```

### Local Storage Service Pattern
```javascript
// From localDataService implementation
const storagePattern = {
  // Key namespacing
  keys: {
    templates: 'templateBuilder_templates',
    brand: 'templateBuilder_brandConfig',
    prefix: 'templateBuilder_'
  },
  
  // Data structure
  template: {
    id: 'unique-identifier',
    name: 'user-friendly-name',
    sections: 'content-array',
    timestamp: 'ISO-string',
    brand: 'brand-reference'
  },
  
  // Error handling
  fallbacks: {
    parse: 'return-empty-array',
    save: 'console-error',
    load: 'return-defaults'
  }
}
```

### Section Controls Best Practice
```javascript
// From Section component pattern
const sectionControls = {
  // Hover state management
  visibility: {
    show: 'on-hover-or-active',
    hide: 'on-mouse-leave',
    persist: 'when-menu-open'
  },
  
  // Action buttons
  actions: [
    { icon: 'Move', action: 'drag-handle' },
    { icon: 'Copy', action: 'duplicate-section' },
    { icon: 'Settings', action: 'open-properties' },
    { icon: 'Trash', action: 'delete-with-confirm' }
  ],
  
  // Positioning
  placement: 'absolute-top-right',
  zIndex: 'above-content'
}
```

### Component ID Management
```javascript
// Unique ID generation pattern from your code
const idGeneration = {
  // Consistent ID format
  format: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Examples from implementation
  section: 'section-1699123456-abc123xyz',
  element: 'element-1699123456-def456uvw',
  
  // Ensures uniqueness across
  uniqueness: {
    timestamp: Date.now(),
    random: 'alphanumeric-suffix',
    prefix: 'component-type'
  }
}
```

### Error Handling Patterns
```javascript
// Graceful error handling from your implementation
const errorHandling = {
  // API fallbacks
  brandLoading: {
    try: 'fetch-from-api',
    catch: 'use-default-brand',
    default: {
      id: "test-brand-001",
      name: "Test Brand",
      colors: { primary: "#8b5cf6", secondary: "#ec4899" }
    }
  },
  
  // Storage errors
  localStorage: {
    try: 'parse-json',
    catch: 'return-empty-array',
    log: 'console.error'
  },
  
  // User feedback
  feedback: {
    success: 'alert-or-toast',
    error: 'user-friendly-message',
    loading: 'visual-indicator'
  }
}
```

### Testing Checklist for Template Builder V2
```javascript
// Critical test scenarios based on implementation
const testScenarios = [
  {
    category: 'Drag & Drop',
    tests: [
      'Drop component from panel to canvas',
      'Reorder sections by dragging',
      'Drop between existing sections',
      'Cancel drag operation',
      'Drop on invalid target'
    ]
  },
  {
    category: 'Text Editing',
    tests: [
      'Double-click to edit text',
      'Type continuously without focus loss',
      'Apply formatting (bold, italic, etc)',
      'Change font family and size',
      'Save on blur',
      'Undo/redo operations'
    ]
  },
  {
    category: 'Visual Controls',
    tests: [
      'Drag box model handles',
      'Use color picker',
      'Adjust spacing presets',
      'Toggle mobile preview',
      'Switch dark mode'
    ]
  },
  {
    category: 'Template Management',
    tests: [
      'Save template locally',
      'Load saved template',
      'Delete template',
      'Name template',
      'Handle storage errors'
    ]
  },
  {
    category: 'Section Controls',
    tests: [
      'Show controls on hover',
      'Duplicate section',
      'Delete section',
      'Open properties panel',
      'Move section up/down'
    ]
  }
]
```

### Mobile Responsiveness Pattern
```javascript
// Mobile handling from your implementation
const mobileStrategy = {
  // Breakpoints
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024
  },
  
  // Preview modes
  preview: {
    devices: ['desktop', 'tablet', 'mobile'],
    realTime: true,
    orientation: ['portrait', 'landscape']
  },
  
  // Stack control
  mobileStacking: {
    columns: 'vertical-stack',
    order: 'draggable',
    spacing: 'adjustable'
  }
}
```

### Email-Specific Considerations

#### Email Client Compatibility
```javascript
const emailCompatibility = {
  // Use table-based layouts for Outlook
  outlookFallback: true,
  
  // Inline styles for Gmail
  inlineStyles: true,
  
  // Avoid unsupported CSS
  avoidFeatures: [
    'position: fixed',
    'transform',
    'animation',
    'flexbox (for Outlook)'
  ],
  
  // Font stacks for reliability
  fontFallbacks: 'Arial, Helvetica, sans-serif'
};
```

### Performance Metrics

#### Text Editor Performance Targets
- **Typing latency**: <50ms from keystroke to screen
- **Focus switch**: <100ms between text blocks
- **Toolbar appearance**: <100ms after focus
- **Content save**: <200ms after blur
- **Undo/redo**: Instant (<16ms)
- **Format application**: <50ms
- **Multiple editors**: Support 20+ without lag

---

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
- [ ] Elements snap to grid (8px recommended)
- [ ] Undo/redo works for all actions
- [ ] Keyboard navigation (Tab, Arrow keys)
- [ ] Touch gestures on mobile devices

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
- "Optimize this email for mobile Gmail app"
- "Check contrast ratios for accessibility"
- "Generate 3 subject line variants"
- "Convert this design to dark mode"
- "Add fallback fonts for Outlook"
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
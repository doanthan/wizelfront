"use client"

import { useState, useEffect, useRef } from 'react'
import { 
  Bold, Italic, Underline, Link, List, ListOrdered, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, Highlighter, Strikethrough,
  Quote, RemoveFormatting, Undo, Redo, ChevronDown
} from 'lucide-react'
import Portal from './Portal'
import { ColorPicker } from '../ui/color-picker'
import { useBrandColors } from '../../hooks/useBrandColors'

// Email-safe web fonts that work across all email clients
const EMAIL_SAFE_FONTS = [
  // System Fonts (100% safe)
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif', category: 'Sans-Serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif', category: 'Sans-Serif' },
  { name: 'Verdana', value: 'Verdana, Geneva, sans-serif', category: 'Sans-Serif' },
  { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif', category: 'Sans-Serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif', category: 'Sans-Serif' },
  { name: 'Geneva', value: 'Geneva, Tahoma, sans-serif', category: 'Sans-Serif' },
  
  // Serif Fonts (100% safe)
  { name: 'Georgia', value: 'Georgia, serif', category: 'Serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'Serif' },
  { name: 'Times', value: 'Times, "Times New Roman", serif', category: 'Serif' },
  { name: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', category: 'Serif' },
  { name: 'Book Antiqua', value: '"Book Antiqua", Palatino, serif', category: 'Serif' },
  { name: 'Garamond', value: 'Garamond, serif', category: 'Serif' },
  
  // Monospace Fonts (100% safe)
  { name: 'Courier New', value: '"Courier New", Courier, monospace', category: 'Monospace' },
  { name: 'Courier', value: 'Courier, "Courier New", monospace', category: 'Monospace' },
  { name: 'Lucida Console', value: '"Lucida Console", Monaco, monospace', category: 'Monospace' },
  { name: 'Monaco', value: 'Monaco, "Lucida Console", monospace', category: 'Monospace' },
  
  // Modern Web Fonts (with fallbacks)
  { name: 'Segoe UI', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', category: 'Modern' },
  { name: 'Roboto', value: 'Roboto, "Helvetica Neue", Arial, sans-serif', category: 'Modern' },
  { name: 'Open Sans', value: '"Open Sans", Arial, sans-serif', category: 'Modern' },
  { name: 'Lato', value: 'Lato, "Helvetica Neue", Arial, sans-serif', category: 'Modern' },
  { name: 'Montserrat', value: 'Montserrat, "Helvetica Neue", Arial, sans-serif', category: 'Modern' },
  { name: 'Poppins', value: 'Poppins, "Helvetica Neue", Arial, sans-serif', category: 'Modern' },
  { name: 'Inter', value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', category: 'Modern' },
  { name: 'Playfair Display', value: '"Playfair Display", Georgia, serif', category: 'Modern Serif' },
  { name: 'Raleway', value: 'Raleway, "Helvetica Neue", Arial, sans-serif', category: 'Modern' },
  { name: 'Work Sans', value: '"Work Sans", Arial, sans-serif', category: 'Modern' },
]

// Font sizes for email
const FONT_SIZES = [
  '10px', '11px', '12px', '13px', '14px', '15px', '16px', '18px', 
  '20px', '22px', '24px', '26px', '28px', '30px', '32px', '36px', 
  '40px', '44px', '48px', '54px', '60px', '72px'
]

// Line heights
const LINE_HEIGHTS = [
  { label: 'Single', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.25', value: '1.25' },
  { label: '1.5', value: '1.5' },
  { label: 'Double', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3', value: '3' }
]

export default function InlineTextEditor({ 
  element, 
  onUpdate, 
  selectedBrand,
  isEditing,
  onStopEditing 
}) {
  const editorRef = useRef(null)
  const toolbarRef = useRef(null)
  const updateTimeoutRef = useRef(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [hideToolbar, setHideToolbar] = useState(false) // Show toolbar by default when editing
  const [selectedText, setSelectedText] = useState('')
  const [currentFont, setCurrentFont] = useState('Arial, Helvetica, sans-serif')
  const [currentFontSize, setCurrentFontSize] = useState('16px')
  const [currentColor, setCurrentColor] = useState('#000000')
  const [currentBgColor, setCurrentBgColor] = useState('transparent')
  const [showFontDropdown, setShowFontDropdown] = useState(false)
  const [showSizeDropdown, setShowSizeDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 150, placement: 'above' })
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const sizeTriggerRef = useRef(null)
  const fontTriggerRef = useRef(null)
  
  // Get brand colors
  const brandColors = useBrandColors(selectedBrand)
  
  // Active formatting states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    orderedList: false,
    unorderedList: false
  })

  // Get brand fonts if available
  const getBrandFonts = () => {
    if (!selectedBrand) return []
    
    const brandFonts = []
    
    // Add primary font
    if (selectedBrand.fonts?.primary || selectedBrand.brandFont) {
      brandFonts.push({
        name: 'Brand Primary',
        value: selectedBrand.fonts?.primary || selectedBrand.brandFont,
        category: 'Brand'
      })
    }
    
    // Add secondary font
    if (selectedBrand.fonts?.secondary) {
      brandFonts.push({
        name: 'Brand Secondary',
        value: selectedBrand.fonts.secondary,
        category: 'Brand'
      })
    }
    
    // Add heading font
    if (selectedBrand.fonts?.heading || selectedBrand.headingFont) {
      brandFonts.push({
        name: 'Brand Heading',
        value: selectedBrand.fonts?.heading || selectedBrand.headingFont,
        category: 'Brand'
      })
    }
    
    // Add body font
    if (selectedBrand.fonts?.body || selectedBrand.bodyFont) {
      brandFonts.push({
        name: 'Brand Body',
        value: selectedBrand.fonts?.body || selectedBrand.bodyFont,
        category: 'Brand'
      })
    }
    
    return brandFonts
  }

  const allFonts = [...getBrandFonts(), ...EMAIL_SAFE_FONTS]

  // Calculate dropdown position based on trigger button
  const calculateDropdownPosition = (triggerRef) => {
    if (!triggerRef.current) return { top: 0, left: 0 }
    
    const rect = triggerRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 4, // 4px gap below button
      left: rect.left
    }
  }

  // Calculate smart toolbar position
  const updateToolbarPosition = () => {
    if (!editorRef.current || hideToolbar) return
    
    const editorRect = editorRef.current.getBoundingClientRect()
    const selection = window.getSelection()
    
    // Try to get selection bounds for more accurate positioning
    let targetRect = editorRect
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0)
      targetRect = range.getBoundingClientRect()
    }
    
    const viewportHeight = window.innerHeight
    const toolbarHeight = 60 // Approximate toolbar height
    const offset = 10 // Gap between toolbar and text
    
    // Smart positioning logic
    let position = {}
    
    // Check if there's space above the text
    if (targetRect.top > toolbarHeight + offset + 50) {
      // Place toolbar above the text
      position = {
        top: targetRect.top - toolbarHeight - offset,
        placement: 'above'
      }
    } 
    // Check if there's space below the text
    else if (viewportHeight - targetRect.bottom > toolbarHeight + offset + 50) {
      // Place toolbar below the text
      position = {
        top: targetRect.bottom + offset,
        placement: 'below'
      }
    } 
    // If no good space, float at top of viewport
    else {
      const headerHeight = 80 // Account for top header
      position = {
        top: headerHeight + offset,
        placement: 'fixed-top'
      }
    }
    
    setToolbarPosition(position)
  }

  // Initialize editor content and focus when editing starts
  useEffect(() => {
    // Only set initial content when first editing, not on every element change
    if (isEditing && editorRef.current) {
      // Only initialize content once when first starting to edit
      // The content updates will be handled through the contentEditable itself
      if (!editorRef.current.hasAttribute('data-initialized')) {
        if (element?.properties?.content) {
          editorRef.current.innerHTML = element.properties.content
        }
        editorRef.current.setAttribute('data-initialized', 'true')
        
        // Auto-focus when entering edit mode for the first time
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (!editorRef.current) return
          
          editorRef.current.focus()
          // Place cursor at the end
          const range = document.createRange()
          const sel = window.getSelection()
          if (editorRef.current.childNodes.length > 0) {
            range.selectNodeContents(editorRef.current)
            range.collapse(false)
            sel.removeAllRanges()
            sel.addRange(range)
          }
          // Update toolbar position after focus
          setTimeout(updateToolbarPosition, 100)
        })
      }
    }
  }, [isEditing]) // Remove element from dependencies to prevent re-focusing on every update

  // Update toolbar position when toolbar visibility changes or editing starts
  useEffect(() => {
    if (isEditing || showToolbar) {
      // Ensure toolbar shows when editing
      setShowToolbar(true)
      // Update position after a short delay to ensure DOM is ready
      setTimeout(() => {
        updateToolbarPosition()
      }, 50)
    }
  }, [isEditing, showToolbar])

  // Update toolbar position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isEditing && showToolbar && !hideToolbar) {
        updateToolbarPosition()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [isEditing, showToolbar, hideToolbar])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside of any dropdown or trigger
      if (
        showSizeDropdown &&
        !sizeTriggerRef.current?.contains(e.target) &&
        !e.target.closest('.portal-dropdown')
      ) {
        setShowSizeDropdown(false)
      }
      if (
        showFontDropdown &&
        !fontTriggerRef.current?.contains(e.target) &&
        !e.target.closest('.font-dropdown')
      ) {
        setShowFontDropdown(false)
      }
    }

    if (showSizeDropdown || showFontDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSizeDropdown, showFontDropdown])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Save content to history for undo/redo
  const saveToHistory = (content) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(content)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Handle content changes
  const handleContentChange = (skipUpdate = false) => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML
      
      // Only update if content actually changed
      if (newHtml === element.properties?.content) return
      
      saveToHistory(newHtml)
      
      // Update the element with new content
      const updatedElement = {
        ...element,
        properties: {
          ...element.properties,
          content: newHtml,
          // Preserve any formatting applied
          fontFamily: currentFont,
          fontSize: currentFontSize,
          color: currentColor,
          textAlign: element.properties?.textAlign || 'left'
        }
      }
      
      if (!skipUpdate) {
        // Clear any pending update
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        
        // Debounce the update to prevent rapid re-renders
        // Increased debounce time and removed cursor restoration to prevent flicker
        updateTimeoutRef.current = setTimeout(() => {
          onUpdate(updatedElement)
        }, 300) // Increased to 300ms for smoother typing
      }
    }
  }

  // Text formatting commands
  const formatText = (command, value = null) => {
    // Ensure editor has focus before executing command
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.focus()
      
      // Restore selection if we had one
      const selection = window.getSelection()
      if (selection.rangeCount === 0 && editorRef.current.lastRange) {
        selection.addRange(editorRef.current.lastRange)
      }
    }
    
    // Execute the command
    document.execCommand(command, false, value)
    
    // For toggle commands, ensure format carries forward
    if (['bold', 'italic', 'underline', 'strikeThrough'].includes(command)) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0 && selection.isCollapsed) {
        // If no text is selected, create a formatting anchor for future text
        const range = selection.getRangeAt(0)
        const span = document.createElement('span')
        
        // Apply the formatting to the span
        if (command === 'bold') span.style.fontWeight = document.queryCommandState('bold') ? 'bold' : 'normal'
        if (command === 'italic') span.style.fontStyle = document.queryCommandState('italic') ? 'italic' : 'normal'
        if (command === 'underline') span.style.textDecoration = document.queryCommandState('underline') ? 'underline' : 'none'
        if (command === 'strikeThrough') span.style.textDecoration = document.queryCommandState('strikeThrough') ? 'line-through' : 'none'
        
        span.innerHTML = '\u200B' // Zero-width space
        range.insertNode(span)
        range.selectNodeContents(span)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
    
    // Update content
    handleContentChange()
    
    // Update toolbar state to reflect changes
    setTimeout(updateToolbarState, 10)
  }

  // Apply font
  const applyFont = (fontValue) => {
    formatText('fontName', fontValue)
    setCurrentFont(fontValue)
    setShowFontDropdown(false)
  }

  // Apply text color
  const applyColor = (color) => {
    formatText('foreColor', color)
    setCurrentColor(color)
    handleContentChange()
  }

  // Apply background color (highlight)
  const applyBackgroundColor = (color) => {
    formatText('hiliteColor', color)
    setCurrentBgColor(color)
    handleContentChange()
  }

  // Apply font size
  const applyFontSize = (size) => {
    const selection = window.getSelection()
    
    // Ensure editor has focus
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.focus()
      // Restore selection if we had one
      if (selection.rangeCount === 0 && editorRef.current.lastRange) {
        selection.addRange(editorRef.current.lastRange)
      }
    }
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      
      // If there's selected text, wrap it in a span with the font size
      if (!range.collapsed) {
        // Save the selection
        const selectedContent = range.extractContents()
        
        // Clean up nested spans with font-size to avoid multiple layers
        const tempDiv = document.createElement('div')
        tempDiv.appendChild(selectedContent)
        const nestedSpans = tempDiv.querySelectorAll('span[style*="font-size"]')
        nestedSpans.forEach(span => {
          while (span.firstChild) {
            span.parentNode.insertBefore(span.firstChild, span)
          }
          span.remove()
        })
        
        const span = document.createElement('span')
        span.style.fontSize = size
        span.appendChild(tempDiv.firstChild || document.createTextNode(''))
        range.insertNode(span)
        
        // Restore selection to the newly formatted text
        range.selectNodeContents(span)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // No selection - apply to future typing
        // Create a new span for future text
        const span = document.createElement('span')
        span.style.fontSize = size
        span.innerHTML = '\u200B' // Zero-width space to maintain cursor position
        range.insertNode(span)
        
        // Move cursor inside the span
        range.selectNodeContents(span)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
    
    handleContentChange()
    setCurrentFontSize(size)
    setShowSizeDropdown(false)
    
    // Update toolbar state
    setTimeout(updateToolbarState, 10)
  }

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:', 'https://')
    if (url) {
      formatText('createLink', url)
    }
  }

  // Remove formatting
  const removeFormatting = () => {
    formatText('removeFormat')
    formatText('formatBlock', 'p')
  }

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      if (editorRef.current) {
        editorRef.current.innerHTML = history[historyIndex - 1]
      }
    }
  }

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      if (editorRef.current) {
        editorRef.current.innerHTML = history[historyIndex + 1]
      }
    }
  }

  // Update toolbar state based on selection
  const updateToolbarState = () => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      setSelectedText(range.toString())
      
      // Get the element at cursor position
      let element = null
      if (range.commonAncestorContainer.nodeType === 3) { // Text node
        element = range.commonAncestorContainer.parentElement
      } else {
        element = range.commonAncestorContainer
      }
      
      // Get current styles at cursor
      if (element) {
        const styles = window.getComputedStyle(element)
        setCurrentFont(styles.fontFamily)
        setCurrentFontSize(styles.fontSize)
        setCurrentColor(styles.color)
        
        // Update active format states
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikethrough: document.queryCommandState('strikeThrough'),
          alignLeft: document.queryCommandState('justifyLeft'),
          alignCenter: document.queryCommandState('justifyCenter'),
          alignRight: document.queryCommandState('justifyRight'),
          alignJustify: document.queryCommandState('justifyFull'),
          orderedList: document.queryCommandState('insertOrderedList'),
          unorderedList: document.queryCommandState('insertUnorderedList')
        })
      }
    }
  }

  // Preset text colors
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#F0E68C', '#4B0082',
    selectedBrand?.colors?.primary,
    selectedBrand?.colors?.secondary,
    selectedBrand?.colors?.accent,
    selectedBrand?.colors?.text
  ].filter(Boolean)

  return (
    <div className="inline-text-editor">
      {/* Floating Toolbar - Hidden when hideToolbar is true */}
      {(showToolbar || isEditing) && !hideToolbar && (
        <div 
          ref={toolbarRef}
          className="text-toolbar-container"
          style={{ top: `${toolbarPosition.top}px` }}
        >
          <div className="text-toolbar compact">
          {/* Font Selection */}
          <div className="toolbar-group">
            <button
              ref={fontTriggerRef}
              className="toolbar-dropdown-trigger compact"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Close other dropdowns
                setShowSizeDropdown(false)
                setShowColorPicker(false)
                setShowBgColorPicker(false)
                setShowFontDropdown(!showFontDropdown)
              }}
              onMouseDown={(e) => {
                e.preventDefault() // Prevent focus loss
              }}
              title="Font Family"
            >
              <Type size={14} />
              <ChevronDown size={10} />
            </button>
            
            {showFontDropdown && (
              <div 
                className="toolbar-dropdown font-dropdown"
                onMouseDown={(e) => e.preventDefault()}
              >
                {Object.entries(
                  allFonts.reduce((acc, font) => {
                    if (!acc[font.category]) acc[font.category] = []
                    acc[font.category].push(font)
                    return acc
                  }, {})
                ).map(([category, fonts]) => (
                  <div key={category} className="font-category">
                    <div className="category-label">{category}</div>
                    {fonts.map(font => (
                      <button
                        key={font.value}
                        className="font-option"
                        style={{ fontFamily: font.value }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFont(font.value)}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="toolbar-group">
            <button
              ref={sizeTriggerRef}
              className="toolbar-dropdown-trigger compact size-trigger"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Close other dropdowns
                setShowFontDropdown(false)
                setShowColorPicker(false)
                setShowBgColorPicker(false)
                const newState = !showSizeDropdown
                setShowSizeDropdown(newState)
                if (newState) {
                  setDropdownPosition(calculateDropdownPosition(sizeTriggerRef))
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault() // Prevent focus loss
              }}
              title="Font Size"
            >
              <span className="size-label">{parseInt(currentFontSize)}</span>
              <ChevronDown size={10} />
            </button>
          </div>

          {/* Basic Formatting */}
          <div className="toolbar-group">
            <button
              className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
              onClick={() => formatText('bold')}
              onMouseDown={(e) => e.preventDefault()}
              title="Bold (Ctrl+B)"
            >
              <Bold size={14} />
            </button>
            <button
              className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
              onClick={() => formatText('italic')}
              onMouseDown={(e) => e.preventDefault()}
              title="Italic (Ctrl+I)"
            >
              <Italic size={14} />
            </button>
            <button
              className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`}
              onClick={() => formatText('underline')}
              onMouseDown={(e) => e.preventDefault()}
              title="Underline (Ctrl+U)"
            >
              <Underline size={14} />
            </button>
            <button
              className={`toolbar-btn ${activeFormats.strikethrough ? 'active' : ''}`}
              onClick={() => formatText('strikeThrough')}
              onMouseDown={(e) => e.preventDefault()}
              title="Strikethrough"
            >
              <Strikethrough size={14} />
            </button>
          </div>

          {/* Text Alignment */}
          <div className="toolbar-group">
            <button
              className={`toolbar-btn ${activeFormats.alignLeft ? 'active' : ''}`}
              onClick={() => formatText('justifyLeft')}
              onMouseDown={(e) => e.preventDefault()}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              className={`toolbar-btn ${activeFormats.alignCenter ? 'active' : ''}`}
              onClick={() => formatText('justifyCenter')}
              onMouseDown={(e) => e.preventDefault()}
              title="Align Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              className={`toolbar-btn ${activeFormats.alignRight ? 'active' : ''}`}
              onClick={() => formatText('justifyRight')}
              onMouseDown={(e) => e.preventDefault()}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
            <button
              className={`toolbar-btn ${activeFormats.alignJustify ? 'active' : ''}`}
              onClick={() => formatText('justifyFull')}
              onMouseDown={(e) => e.preventDefault()}
              title="Justify"
            >
              <AlignJustify size={14} />
            </button>
          </div>

          {/* Lists */}
          <div className="toolbar-group">
            <button
              className={`toolbar-btn ${activeFormats.unorderedList ? 'active' : ''}`}
              onClick={() => formatText('insertUnorderedList')}
              onMouseDown={(e) => e.preventDefault()}
              title="Bullet List"
            >
              <List size={14} />
            </button>
            <button
              className={`toolbar-btn ${activeFormats.orderedList ? 'active' : ''}`}
              onClick={() => formatText('insertOrderedList')}
              onMouseDown={(e) => e.preventDefault()}
              title="Numbered List"
            >
              <ListOrdered size={14} />
            </button>
          </div>

          {/* Colors */}
          <div className="toolbar-group color-group">
            <ColorPicker
              value={currentColor}
              onChange={applyColor}
              onChangeComplete={handleContentChange}
              brandColors={brandColors}
              trigger="compact"
              className="text-color-picker"
              presets={['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00']}
            />
            
            <ColorPicker
              value={currentBgColor}
              onChange={applyBackgroundColor}
              onChangeComplete={handleContentChange}
              brandColors={brandColors}
              trigger="compact"
              className="bg-color-picker"
              presets={['transparent', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFA500']}
            />
          </div>

          {/* Link & Special */}
          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={insertLink}
              title="Insert Link"
            >
              <Link size={14} />
            </button>
            <button
              className="toolbar-btn"
              onClick={() => formatText('formatBlock', 'blockquote')}
              title="Quote"
            >
              <Quote size={14} />
            </button>
            <button
              className="toolbar-btn"
              onClick={removeFormatting}
              title="Clear Formatting"
            >
              <RemoveFormatting size={14} />
            </button>
          </div>

          {/* Actions */}
          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo size={14} />
            </button>
            <button
              className="toolbar-btn"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <Redo size={14} />
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Show hint when toolbar is hidden - only if user explicitly hides it */}
      {isEditing && hideToolbar && (
        <div className="toolbar-hidden-hint">
          Press Ctrl/Cmd+H to show formatting toolbar
        </div>
      )}
      
      {/* Editable Content */}
      <div
        ref={editorRef}
        contentEditable={isEditing}
        className={`text-content-editable ${isEditing ? 'editing' : ''}`}
        onFocus={() => {
          setShowToolbar(true)
          // Place cursor at the end if no selection
          if (window.getSelection().rangeCount === 0) {
            const range = document.createRange()
            const sel = window.getSelection()
            range.selectNodeContents(editorRef.current)
            range.collapse(false)
            sel.removeAllRanges()
            sel.addRange(range)
          }
          // Update toolbar state on focus
          setTimeout(updateToolbarState, 10)
        }}
        onBlur={() => {
          handleContentChange()
          // Clear initialization flag when editing stops
          if (editorRef.current) {
            editorRef.current.removeAttribute('data-initialized')
          }
          setTimeout(() => {
            if (!document.activeElement?.closest('.text-toolbar')) {
              setShowToolbar(false)
              onStopEditing?.()
            }
          }, 200)
        }}
        onInput={(e) => {
          // Only handle content change, don't update toolbar position on every keystroke
          handleContentChange()
        }}
        onMouseUp={(e) => {
          // Save current selection range
          const selection = window.getSelection()
          if (selection.rangeCount > 0) {
            editorRef.current.lastRange = selection.getRangeAt(0).cloneRange()
          }
          updateToolbarState()
          updateToolbarPosition()
        }}
        onKeyUp={(e) => {
          // Save current selection range
          const selection = window.getSelection()
          if (selection.rangeCount > 0) {
            editorRef.current.lastRange = selection.getRangeAt(0).cloneRange()
          }
          updateToolbarState()
          updateToolbarPosition()
        }}
        onKeyDown={(e) => {
          // Handle keyboard shortcuts
          if (e.metaKey || e.ctrlKey) {
            switch(e.key) {
              case 'a':
                // Ensure Ctrl+A selects all content properly
                e.preventDefault()
                const range = document.createRange()
                const sel = window.getSelection()
                range.selectNodeContents(editorRef.current)
                sel.removeAllRanges()
                sel.addRange(range)
                break
              case 'b':
                e.preventDefault()
                formatText('bold')
                break
              case 'i':
                e.preventDefault()
                formatText('italic')
                break
              case 'u':
                e.preventDefault()
                formatText('underline')
                break
              case 'h':
                // Ctrl/Cmd + H to toggle toolbar visibility
                e.preventDefault()
                setHideToolbar(!hideToolbar)
                break
              case 'z':
                if (e.shiftKey) {
                  e.preventDefault()
                  redo()
                } else {
                  e.preventDefault()
                  undo()
                }
                break
            }
          }
          // Press Escape to hide toolbar temporarily
          if (e.key === 'Escape') {
            setShowToolbar(false)
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (isEditing) {
            editorRef.current?.focus()
          }
        }}
        style={{
          fontFamily: element?.properties?.fontFamily || currentFont,
          fontSize: element?.properties?.fontSize || currentFontSize,
          color: element?.properties?.color || currentColor,
          textAlign: element?.properties?.textAlign || 'left',
          lineHeight: element?.properties?.lineHeight || '1.5',
          padding: '16px',
          minHeight: '40px',
          outline: isEditing ? '2px solid #8b5cf6' : 'none',
          outlineOffset: '2px'
        }}
        suppressContentEditableWarning={true}
      >
        {/* Content will be set via innerHTML */}
      </div>

      {/* Portal-rendered dropdowns */}
      {showSizeDropdown && (
        <Portal>
          <div 
            className="portal-dropdown size-dropdown"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              zIndex: 2147483647, // Maximum z-index value
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              maxHeight: '300px',
              overflowY: 'auto',
              minWidth: '150px'
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {FONT_SIZES.map(size => (
              <button
                key={size}
                className="size-option"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFontSize(size)}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none'
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </Portal>
      )}

      <style jsx>{`
        .inline-text-editor {
          position: relative;
        }

        .text-toolbar-container {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          max-width: 90%;
          z-index: 2147483647; /* Maximum z-index value */
          transition: all 0.2s ease;
          animation: slideIn 0.3s ease;
          pointer-events: auto;
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
          }
        }
        
        .toolbar-hidden-hint {
          position: fixed;
          top: 90px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 2147483646; /* Just below maximum */
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .text-toolbar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.1);
          padding: 4px;
          display: flex;
          flex-wrap: nowrap;
          gap: 2px;
          overflow: visible;
          pointer-events: auto;
          position: relative;
          z-index: 2147483647; /* Maximum z-index value */
        }

        .text-toolbar.compact {
          padding: 3px;
          gap: 0;
        }

        .toolbar-group {
          display: flex;
          gap: 2px;
          padding: 0 4px;
          border-right: 1px solid #e5e7eb;
          position: relative;
          align-items: center;
          overflow: visible !important;
          z-index: auto;
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .toolbar-btn {
          padding: 4px;
          background: white;
          border: 1px solid transparent;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          min-width: 26px;
          height: 26px;
        }

        .toolbar-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .toolbar-btn:active,
        .toolbar-btn.active {
          background: #8b5cf6;
          color: white;
        }

        .toolbar-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .toolbar-dropdown-trigger {
          padding: 4px 6px;
          background: white;
          border: 1px solid transparent;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 12px;
          color: #4b5563;
          transition: all 0.15s;
          height: 26px;
        }

        .toolbar-dropdown-trigger.compact {
          padding: 3px 5px;
          min-width: 32px;
        }

        .toolbar-dropdown-trigger:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .current-font {
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .size-trigger {
          min-width: 45px;
        }

        .size-label {
          font-size: 11px;
          font-weight: 500;
        }

        .toolbar-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          max-height: 300px;
          overflow-y: auto;
          z-index: 2147483647; /* Maximum z-index value */
          min-width: 150px;
        }

        .font-dropdown {
          width: 250px;
        }

        .font-category {
          padding: 4px 0;
        }

        .category-label {
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
        }

        .font-option,
        .size-option {
          display: block;
          width: 100%;
          padding: 8px 12px;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .font-option:hover,
        .size-option:hover {
          background: #f3f4f6;
        }

        .color-btn {
          position: relative;
        }

        .color-indicator {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 3px;
          border-radius: 2px;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .text-content-editable {
          min-height: 40px;
          cursor: text;
          transition: all 0.2s;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .text-content-editable.editing {
          background: #fafafa;
        }

        .text-content-editable:focus {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }

        /* Ensure links are styled properly */
        .text-content-editable a {
          color: #8b5cf6;
          text-decoration: underline;
        }

        /* List styles */
        .text-content-editable ul,
        .text-content-editable ol {
          margin: 10px 0;
          padding-left: 30px;
        }

        .text-content-editable blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 10px 0;
          color: #6b7280;
        }

        .text-content-editable pre {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }
      `}</style>
    </div>
  )
}
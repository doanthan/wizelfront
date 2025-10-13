import React, { useRef, useEffect } from 'react';

const TextBlock = ({
  block,
  isEditing,
  onUpdate,
  onStartEdit,
  onEndEdit,
  showToolbar,
  hideToolbar,
  contentEditableRef
}) => {
  const editableRef = useRef(null);

  // Register ref with parent's contentEditableRefs map
  useEffect(() => {
    if (editableRef.current && contentEditableRef) {
      contentEditableRef(editableRef.current);
    }
  }, [contentEditableRef]);

  // Handle entering edit mode
  useEffect(() => {
    if (isEditing && editableRef.current) {
      // Set initial content preserving spaces
      const content = block.content || '';

      // Use innerHTML to preserve formatting
      editableRef.current.innerHTML = content.replace(/\n/g, '<br>');

      // Focus and place cursor at end
      editableRef.current.focus();

      // Place cursor at the end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      // Show toolbar
      if (showToolbar) {
        const rect = editableRef.current.getBoundingClientRect();
        showToolbar({
          top: rect.top - 60,
          left: rect.left + rect.width / 2
        });
      }
    }
  }, [isEditing]); // Only depend on isEditing

  const handleInput = (e) => {
    if (!editableRef.current) return;

    // Get the innerHTML to preserve line breaks
    const html = e.target.innerHTML;

    // Convert BR tags to newlines for storage
    const newContent = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove any other HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    // Update parent
    if (onUpdate) {
      onUpdate(block.id, { content: newContent });
    }
  };

  const handleKeyDown = (e) => {
    // Handle Escape key
    if (e.key === 'Escape') {
      e.preventDefault();
      if (onEndEdit) onEndEdit();
      if (hideToolbar) hideToolbar();
      return;
    }

    // Handle Enter key for new lines
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default to control the behavior

      // Insert a line break
      document.execCommand('insertHTML', false, '<br><br>');

      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      e.currentTarget.dispatchEvent(inputEvent);
      return;
    }

    // Always prevent default space behavior to avoid auto-corrections
    if (e.key === ' ') {
      e.preventDefault();

      // Insert space manually
      document.execCommand('insertText', false, ' ');

      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      e.currentTarget.dispatchEvent(inputEvent);
      return;
    }
  };

  const handleBlur = () => {
    // Save content on blur
    if (editableRef.current) {
      const html = editableRef.current.innerHTML;
      const finalContent = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

      if (onUpdate) {
        onUpdate(block.id, { content: finalContent });
      }
    }

    if (onEndEdit) onEndEdit();
    if (hideToolbar) hideToolbar();
  };

  const handleClick = (e) => {
    // Single click should allow selection to bubble up to parent
    // Don't stop propagation - let the parent wrapper handle selection
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing && onStartEdit) {
      onStartEdit(block.id);
    }
  };

  // Enhanced text styles for better email appearance with mobile optimization
  const baseFontSize = block.fontSize || 16;
  const mobileFontSize = Math.max(baseFontSize, 16); // Ensure minimum 16px on mobile

  const textStyle = {
    fontSize: `${baseFontSize}px`,
    fontFamily: block.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: block.textColor || '#2d3748',
    textAlign: block.alignment || 'left',
    lineHeight: block.lineHeight || 1.6,
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : '0',
    padding: `${block.padding || 16}px`,
    margin: '0',
    minHeight: '24px',
    cursor: isEditing ? 'text' : 'pointer',
    outline: 'none',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    WebkitUserSelect: isEditing ? 'text' : 'none',
    userSelect: isEditing ? 'text' : 'none',
    // Mobile optimization - use max-width for responsive sizing
    maxWidth: '100%',
    // Prevent text from being too small on mobile
    WebkitTextSizeAdjust: '100%',
    msTextSizeAdjust: '100%'
  };

  return (
    <div
      ref={editableRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      data-placeholder="Double-click to edit text"
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={textStyle}
      spellCheck="false"
      autoCorrect="off"
      autoCapitalize="off"
      autoComplete="off"
      data-text-replacement="false"
      data-smart-quotes="false"
      data-smart-dashes="false"
      dangerouslySetInnerHTML={!isEditing ? {
        __html: (block.content || 'Double-click to edit text')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      } : undefined}
    />
  );
};

export default TextBlock;
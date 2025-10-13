// CRITICAL FIX FOR TEXT EDITING
// This shows the corrected renderBlockContent function

const renderBlockContent = (block) => {
  const textStyle = {
    textAlign: block.alignment,
    fontSize: `${block.fontSize}px`,
    padding: `${block.padding}px`,
    lineHeight: block.lineHeight || (block.type === "paragraph" ? 1.6 : 1.3),
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
    fontFamily: block.fontFamily || "Arial, Helvetica, sans-serif",
    color: block.textColor || "inherit",
    margin: 0,
    direction: 'ltr',
    unicodeBidi: 'normal',
    // Ensure text is editable properly
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    outline: editingBlockId === block.id ? '2px solid rgba(96, 165, 250, 0.5)' : 'none',
    outlineOffset: '2px',
    cursor: editingBlockId === block.id ? 'text' : 'pointer'
  };

  switch (block.type) {
    case "paragraph":
    case "text":
      return (
        <p
          ref={(el) => {
            if (el) contentEditableRefs.current.set(block.id, el);
            else contentEditableRefs.current.delete(block.id);
          }}
          contentEditable={editingBlockId === block.id}
          suppressContentEditableWarning
          style={textStyle}
          onClick={(e) => {
            // Single click to select
            if (editingBlockId !== block.id) {
              setSelectedId(block.id);
            }
          }}
          onDoubleClick={(e) => {
            // Double click to edit
            e.preventDefault();
            e.stopPropagation();
            setEditingBlockId(block.id);

            // Ensure content is preserved
            setTimeout(() => {
              const el = contentEditableRefs.current.get(block.id);
              if (el) {
                // Only set text if element is empty
                if (!el.textContent || el.textContent.trim() === '') {
                  el.textContent = block.content.replace(/<[^>]*>/g, '');
                }
                el.focus();

                // Show toolbar
                const rect = el.getBoundingClientRect();
                setTextToolbarPosition({
                  top: rect.top - 80, // Above text with margin
                  left: rect.left + rect.width / 2,
                });
                setIsTextToolbarVisible(true);
              }
            }, 10);
          }}
          onInput={(e) => {
            // Update content as user types
            const newContent = e.target.textContent || '';
            updateBlock(block.id, { content: newContent, isHtml: false });
          }}
          onBlur={(e) => {
            // Save on blur
            const newContent = e.target.textContent || '';
            updateBlock(block.id, { content: newContent, isHtml: false });
            setEditingBlockId(null);
            setIsTextToolbarVisible(false);
          }}
          onKeyDown={(e) => {
            // Handle special keys
            if (e.key === 'Escape') {
              e.preventDefault();
              e.target.blur();
              return;
            }

            // Allow spaces and all normal typing
            // Don't prevent default for Space, arrows, etc.

            // Handle text formatting shortcuts
            if (e.ctrlKey || e.metaKey) {
              switch(e.key) {
                case 'b':
                  e.preventDefault();
                  document.execCommand('bold');
                  break;
                case 'i':
                  e.preventDefault();
                  document.execCommand('italic');
                  break;
                case 'u':
                  e.preventDefault();
                  document.execCommand('underline');
                  break;
              }
            }
          }}
          onPaste={(e) => {
            // Handle paste to strip formatting
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
        >
          {editingBlockId !== block.id ? block.content : null}
        </p>
      );

    // Similar fix for headline...
    case "headline":
      return (
        <h3
          ref={(el) => {
            if (el) contentEditableRefs.current.set(block.id, el);
            else contentEditableRefs.current.delete(block.id);
          }}
          contentEditable={editingBlockId === block.id}
          suppressContentEditableWarning
          style={textStyle}
          onClick={(e) => {
            if (editingBlockId !== block.id) {
              setSelectedId(block.id);
            }
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditingBlockId(block.id);

            setTimeout(() => {
              const el = contentEditableRefs.current.get(block.id);
              if (el) {
                if (!el.textContent || el.textContent.trim() === '') {
                  el.textContent = block.content.replace(/<[^>]*>/g, '');
                }
                el.focus();

                const rect = el.getBoundingClientRect();
                setTextToolbarPosition({
                  top: rect.top - 80,
                  left: rect.left + rect.width / 2,
                });
                setIsTextToolbarVisible(true);
              }
            }, 10);
          }}
          onInput={(e) => {
            const newContent = e.target.textContent || '';
            updateBlock(block.id, { content: newContent, isHtml: false });
          }}
          onBlur={(e) => {
            const newContent = e.target.textContent || '';
            updateBlock(block.id, { content: newContent, isHtml: false });
            setEditingBlockId(null);
            setIsTextToolbarVisible(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.target.blur();
              return;
            }

            if (e.ctrlKey || e.metaKey) {
              switch(e.key) {
                case 'b':
                  e.preventDefault();
                  document.execCommand('bold');
                  break;
                case 'i':
                  e.preventDefault();
                  document.execCommand('italic');
                  break;
                case 'u':
                  e.preventDefault();
                  document.execCommand('underline');
                  break;
              }
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
        >
          {editingBlockId !== block.id ? block.content : null}
        </h3>
      );

    // ... rest of cases
  }
};
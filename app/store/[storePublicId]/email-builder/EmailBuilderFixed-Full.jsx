// Text block rendering with fixes for double toolbar and editing issues
const renderTextBlock = (block) => {
  return (
    <p
      ref={(el) => {
        if (el) contentEditableRefs.current.set(block.id, el);
        else contentEditableRefs.current.delete(block.id);
      }}
      contentEditable={editingBlockId === block.id}
      suppressContentEditableWarning
      style={{
        textAlign: block.alignment,
        fontSize: `${block.fontSize}px`,
        padding: `${block.padding}px`,
        lineHeight: block.lineHeight || 1.6,
        letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
        fontFamily: block.fontFamily || "Arial, Helvetica, sans-serif",
        color: block.textColor || "inherit",
        margin: 0,
        direction: 'ltr',
        unicodeBidi: 'normal',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        outline: editingBlockId === block.id ? '2px solid rgba(96, 165, 250, 0.5)' : 'none',
        outlineOffset: '2px',
        cursor: editingBlockId === block.id ? 'text' : 'pointer'
      }}
      onClick={(e) => {
        if (editingBlockId !== block.id) {
          setSelectedId(block.id);
        }
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingBlockId(block.id);
        setIsTextToolbarVisible(false); // Hide first to prevent duplicates

        setTimeout(() => {
          const el = contentEditableRefs.current.get(block.id);
          if (el) {
            // Set the text content from the block
            el.textContent = block.content.replace(/<[^>]*>/g, '');
            el.focus();

            // Position toolbar only once
            const rect = el.getBoundingClientRect();
            setTextToolbarPosition({
              top: Math.max(10, rect.top - 80),
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
      data-block-id={block.id}
    >
      {editingBlockId !== block.id ? (
        <span dangerouslySetInnerHTML={{
          __html: block.isHtml
            ? block.content
            : block.content.replace(/\n/g, '<br>').replace(/\s{2,}/g, ' ')
        }} />
      ) : null}
    </p>
  );
};

// Heading block rendering with same fixes
const renderHeadingBlock = (block) => {
  return (
    <h3
      ref={(el) => {
        if (el) contentEditableRefs.current.set(block.id, el);
        else contentEditableRefs.current.delete(block.id);
      }}
      contentEditable={editingBlockId === block.id}
      suppressContentEditableWarning
      style={{
        textAlign: block.alignment,
        fontSize: `${block.fontSize}px`,
        padding: `${block.padding}px`,
        lineHeight: block.lineHeight || 1.3,
        letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
        fontFamily: block.fontFamily || "Arial, Helvetica, sans-serif",
        color: block.textColor || "inherit",
        margin: 0,
        direction: 'ltr',
        unicodeBidi: 'normal',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        outline: editingBlockId === block.id ? '2px solid rgba(96, 165, 250, 0.5)' : 'none',
        outlineOffset: '2px',
        cursor: editingBlockId === block.id ? 'text' : 'pointer'
      }}
      onClick={(e) => {
        if (editingBlockId !== block.id) {
          setSelectedId(block.id);
        }
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingBlockId(block.id);
        setIsTextToolbarVisible(false); // Hide first to prevent duplicates

        setTimeout(() => {
          const el = contentEditableRefs.current.get(block.id);
          if (el) {
            // Set the text content from the block
            el.textContent = block.content.replace(/<[^>]*>/g, '');
            el.focus();

            // Position toolbar only once
            const rect = el.getBoundingClientRect();
            setTextToolbarPosition({
              top: Math.max(10, rect.top - 80),
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
      data-block-id={block.id}
    >
      {editingBlockId !== block.id ? (
        <span dangerouslySetInnerHTML={{
          __html: block.isHtml
            ? block.content
            : block.content.replace(/\n/g, '<br>').replace(/\s{2,}/g, ' ')
        }} />
      ) : null}
    </h3>
  );
};
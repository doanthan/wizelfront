import React from 'react';
import { Copy, Trash2, Layers, Edit2 } from 'lucide-react';
import { assignDragData } from './utils';
import styles from './email-builder.module.css';
import TextBlock from './TextBlock';
import ButtonWithPaddingHandles from './ButtonWithPaddingHandles';
import ImageTableBlock from './ImageTableBlock';
import DividerBlock from './DividerBlock';

const BlockRenderer = ({
  block,
  selectedId,
  editingBlockId,
  dragOverSectionId,
  contentEditableRefs,
  updateBlock,
  setSelectedId,
  setEditingBlockId,
  setIsTextToolbarVisible,
  setTextToolbarPosition,
  setDragOverSectionId,
  setDragContext,
  handleDropInSection,
  handleDragEnd,
  handleDuplicateBlockInSection,
  handleDeleteBlockFromSection
}) => {
  const getTextStyle = (block) => ({
    textAlign: block.alignment,
    fontSize: `${block.fontSize}px`,
    padding: `${block.padding}px`,
    lineHeight: block.lineHeight || (block.type === "paragraph" ? 1.6 : 1.3),
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
    fontFamily: block.fontFamily || "Arial, Helvetica, sans-serif",
    color: block.textColor || "inherit",
    margin: 0
  });

  const renderSectionBlock = () => {
    const isSpliced = block.isSpliced === true;
    const sectionStyle = {
      padding: isSpliced ? '0' : `${block.padding ?? 24}px`,
      backgroundColor: block.backgroundColor || 'transparent',
      borderRadius: isSpliced ? '0' : 'var(--radius-md)',
      border: block.borderWidth
        ? `${block.borderWidth}px ${block.borderStyle || 'solid'} ${block.borderColor || '#000000'}`
        : (isSpliced ? 'none' : '1px dashed rgba(148, 163, 184, 0.3)'),
      minHeight: isSpliced ? 'auto' : '120px',
      textAlign: block.contentAlign || 'center'
    };

    // Add background image if specified
    if (block.backgroundImage) {
      sectionStyle.backgroundImage = `url(${block.backgroundImage})`;
      sectionStyle.backgroundSize = block.backgroundSize || 'cover';
      sectionStyle.backgroundPosition = block.backgroundPosition || 'center';
      sectionStyle.backgroundRepeat = block.backgroundRepeat || 'no-repeat';
    }

    return (
    <div
      className={`${styles.sectionBlock} ${dragOverSectionId === block.id ? styles.dragOver : ''}`}
      style={sectionStyle}
      onClick={(e) => {
        // Select section when clicking on padding/border area, but not on children
        const target = e.target;
        const currentTarget = e.currentTarget;

        // If clicking directly on the section container or the sectionContent wrapper
        if (target === currentTarget || target.dataset?.sectionArea === 'content') {
          e.stopPropagation();
          setSelectedId(block.id);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverSectionId(block.id);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setDragOverSectionId(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDropInSection(e, block.id);
        setDragOverSectionId(null);
      }}
    >
      {block.children && block.children.length > 0 ? (
        <div
          className={styles.sectionContent}
          data-section-area="content"
          style={isSpliced ? { gap: '0', display: 'flex', flexDirection: 'column' } : {}}
          onClick={(e) => {
            // Click on gap between children selects the section
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              setSelectedId(block.id);
            }
          }}
        >
          {block.children.map((childBlock, childIndex) => (
            <div
              key={childBlock.id}
              className={`${styles.canvasBlock} ${styles.blockWrapper} ${styles.sectionChildBlock} ${childBlock.id === selectedId ? styles.selected : ''}`}
              style={{
                position: 'relative',
                ...(isSpliced && { margin: 0, padding: 0, border: 'none' })
              }}
              draggable={!isSpliced}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(childBlock.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (childBlock.type === "text" || childBlock.type === "paragraph" || childBlock.type === "headline") {
                  setEditingBlockId(childBlock.id);
                  setTimeout(() => {
                    const el = contentEditableRefs.current.get(childBlock.id);
                    if (el) {
                      // Set initial content using textContent
                      if (childBlock.content && childBlock.content !== 'Click to edit text') {
                        el.textContent = childBlock.content;
                      } else {
                        el.textContent = '';
                      }

                      // Focus and place cursor at end
                      el.focus();
                      const selection = window.getSelection();
                      const range = document.createRange();
                      if (el.childNodes.length > 0) {
                        range.selectNodeContents(el);
                        range.collapse(false);
                      } else {
                        range.setStart(el, 0);
                        range.setEnd(el, 0);
                      }
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }, 50);
                }
              }}
              onDragStart={(e) => {
                e.stopPropagation();
                const payload = {
                  source: "section",
                  id: childBlock.id,
                  sectionId: block.id,
                  index: childIndex
                };
                e.dataTransfer.effectAllowed = "move";
                assignDragData(e, payload);
                setDragContext(payload);
              }}
              onDragEnd={handleDragEnd}
            >
              {childBlock.id === selectedId && (
                <div className={styles.rightFloatingPanel}>
                  {(childBlock.type === "text" || childBlock.type === "paragraph" || childBlock.type === "headline") && (
                    <button
                      type="button"
                      className={styles.panelActionButton}
                      aria-label="Edit text"
                      title="Double-click to edit text"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBlockId(childBlock.id);
                        setTimeout(() => {
                          const el = contentEditableRefs.current.get(childBlock.id);
                          if (el) {
                            if (childBlock.content && childBlock.content !== 'Click to edit text') {
                              el.textContent = childBlock.content;
                            } else {
                              el.textContent = '';
                            }
                            el.focus();
                            const selection = window.getSelection();
                            const range = document.createRange();
                            if (el.childNodes.length > 0) {
                              range.selectNodeContents(el);
                              range.collapse(false);
                            } else {
                              range.setStart(el, 0);
                              range.setEnd(el, 0);
                            }
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }, 50);
                      }}
                    >
                      <Edit2 className="icon" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.panelActionButton}
                    aria-label="Duplicate block"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateBlockInSection(block.id, childBlock);
                    }}
                  >
                    <Copy className="icon" />
                  </button>
                  <button
                    type="button"
                    className={styles.panelActionButton}
                    aria-label="Delete block"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBlockFromSection(block.id, childBlock.id);
                    }}
                  >
                    <Trash2 className="icon" />
                  </button>
                </div>
              )}
              <BlockRenderer
                block={childBlock}
                selectedId={selectedId}
                editingBlockId={editingBlockId}
                dragOverSectionId={dragOverSectionId}
                contentEditableRefs={contentEditableRefs}
                updateBlock={updateBlock}
                setSelectedId={setSelectedId}
                setEditingBlockId={setEditingBlockId}
                setIsTextToolbarVisible={setIsTextToolbarVisible}
                setTextToolbarPosition={setTextToolbarPosition}
                setDragOverSectionId={setDragOverSectionId}
                setDragContext={setDragContext}
                handleDropInSection={handleDropInSection}
                handleDragEnd={handleDragEnd}
                handleDuplicateBlockInSection={handleDuplicateBlockInSection}
                handleDeleteBlockFromSection={handleDeleteBlockFromSection}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100px',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(block.id);
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Layers className="icon" style={{ width: '24px', height: '24px', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Section Container</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>Drop content blocks here</p>
          </div>
        </div>
      )}
    </div>
  );
  };


  const renderImageBlock = () => {
    // Support individual padding values (top, right, bottom, left)
    const paddingTop = block.paddingTop ?? block.padding ?? 0;
    const paddingRight = block.paddingRight ?? block.padding ?? 0;
    const paddingBottom = block.paddingBottom ?? block.padding ?? 0;
    const paddingLeft = block.paddingLeft ?? block.padding ?? 0;

    // Support individual margin values
    const marginTop = block.marginTop ?? 0;
    const marginRight = block.marginRight ?? 0;
    const marginBottom = block.marginBottom ?? 0;
    const marginLeft = block.marginLeft ?? 0;

    // Get image width percentage (default 100%)
    const imageWidth = block.imageWidth || 100;

    // Background color for image area
    const imageBackgroundColor = block.imageBackgroundColor || 'transparent';

    // Border settings
    const borderWidth = block.borderWidth || 0;
    const borderStyle = block.borderStyle || 'solid';
    const borderColor = block.borderColor || '#000000';
    const borderRadius = block.borderRadius || 0;

    const imageElement = (
      <img
        src={block.imageUrl || "/img.png"}
        alt={block.content || ""}
        style={{
          width: `${imageWidth}%`,
          maxWidth: "100%",
          height: "auto",
          display: "block",
          margin: block.alignment === 'center' ? '0 auto' : (block.alignment === 'right' ? '0 0 0 auto' : '0'),
          padding: 0,
          // Border
          border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : '0',
          borderRadius: borderRadius > 0 ? `${borderRadius}px` : '0',
          // Email client compatibility
          outline: "none",
          textDecoration: "none",
          msInterpolationMode: "bicubic",
          verticalAlign: "top"
        }}
      />
    );

    return (
      <div style={{
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        textAlign: block.alignment || 'center',
        maxWidth: "100%",
        margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        lineHeight: 0,
        backgroundColor: imageBackgroundColor
      }}>
        {block.linkUrl ? (
          <a href={block.linkUrl} style={{ display: 'block', lineHeight: 0 }}>
            {imageElement}
          </a>
        ) : (
          imageElement
        )}
      </div>
    );
  };

  const renderButtonBlock = () => {
    // Mobile-optimized button with email-safe HTML structure
    const buttonStyles = {
      backgroundColor: block.backgroundColor || "#007bff",
      color: block.textColor || "white",
      fontSize: `${block.fontSize || 16}px`,
      fontFamily: block.fontFamily || "Arial, Helvetica, sans-serif",
      fontWeight: block.fontWeight || "500",
      textDecoration: "none",
      borderRadius: `${block.borderRadius || 4}px`,
      border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || block.backgroundColor || "#007bff"}` : "none",
      padding: `${block.buttonPaddingY || 12}px ${block.buttonPaddingX || 24}px`,
      display: "inline-block",
      textAlign: "center",
      cursor: "pointer",
      lineHeight: "1.2",
      minWidth: block.minWidth ? `${block.minWidth}px` : "auto",
      maxWidth: "100%",
      wordWrap: "break-word",
      // Mobile optimizations
      minHeight: "44px", // Apple's recommended touch target size
      boxSizing: "border-box",
      // Email client compatibility
      msoLineHeightRule: "exactly",
      msoPaddingAlt: "0px",
      msoTextRaiseAlt: "0px"
    };

    const containerStyles = {
      padding: `${block.padding || 16}px`,
      textAlign: block.alignment || "left",
      lineHeight: "1"
    };

    const cellStyles = {
      backgroundColor: block.backgroundColor || "#007bff",
      borderRadius: `${block.borderRadius || 4}px`,
      border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || block.backgroundColor || "#007bff"}` : "none",
      display: "inline-block",
      verticalAlign: "top"
    };

    return (
      <div style={containerStyles}>
        {/* Table-based structure for better email client support */}
        <table
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{
            border: "none",
            borderCollapse: "collapse",
            margin: "0 auto",
            display: block.alignment === "center" ? "table" : "inline-table"
          }}
        >
          <tr>
            <td style={cellStyles}>
              <a
                href={block.buttonUrl || "#"}
                target={block.buttonTarget || "_blank"}
                rel="noopener noreferrer"
                style={buttonStyles}
                role="button"
              >
                {block.content || "Click Here"}
              </a>
            </td>
          </tr>
        </table>

        {/* VML fallback for Outlook */}
        {/*[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                     href="${block.buttonUrl || "#"}"
                     style="height:${(block.buttonPaddingY || 12) * 2 + (block.fontSize || 16) * 1.2}px;
                            v-text-anchor:middle;
                            width:${Math.max(block.minWidth || 0, block.content ? block.content.length * 8 + (block.buttonPaddingX || 24) * 2 : 100)}px;"
                     arcsize="${Math.min(50, ((block.borderRadius || 4) / Math.max(block.buttonPaddingY || 12, 1)) * 100)}%"
                     stroke="f"
                     fillcolor="${block.backgroundColor || "#007bff"}">
          <w:anchorlock/>
          <center style="color:${block.textColor || "white"};
                         font-family:${block.fontFamily || "Arial, Helvetica, sans-serif"};
                         font-size:${block.fontSize || 16}px;
                         font-weight:${block.fontWeight || "500"};">
            ${block.content || "Click Here"}
          </center>
        </v:roundrect>
        <![endif]*/}
      </div>
    );
  };

  const renderDividerBlock = () => (
    <DividerBlock block={block} />
  );

  const renderColumnsBlock = () => {
    const numColumns = block.columns || 2;
    const widths = block.columnWidths || Array(numColumns).fill(100 / numColumns);
    const columnChildren = block.columnChildren || Array(numColumns).fill(null).map(() => []);
    const [dragOverColumnIndex, setDragOverColumnIndex] = React.useState(null);
    const isSpliced = block.isSpliced === true;

    const handleRemoveColumn = (columnIndex) => {
      if (numColumns <= 1) return; // Don't allow removing the last column

      const newWidths = widths.filter((_, idx) => idx !== columnIndex);
      const newColumnChildren = columnChildren.filter((_, idx) => idx !== columnIndex);

      // Redistribute widths proportionally
      const totalRemovedWidth = widths[columnIndex];
      const remainingTotal = 100 - totalRemovedWidth;
      const redistributedWidths = newWidths.map(w => (w / remainingTotal) * 100);

      updateBlock(block.id, {
        columns: numColumns - 1,
        columnWidths: redistributedWidths,
        columnChildren: newColumnChildren
      });
    };

    const handleDropInColumn = (e, columnIndex) => {
      e.preventDefault();
      e.stopPropagation();

      const dragData = JSON.parse(e.dataTransfer.getData("application/x-aurora-block"));

      if (dragData.source === "library") {
        // Create a new block from library
        const { createBlock } = require('./utils');
        const newBlock = createBlock(dragData.type);

        // Remove padding for blocks inside columns
        if (newBlock.padding !== undefined) {
          newBlock.padding = 0;
        }
        if (newBlock.blockPaddingTop !== undefined) {
          newBlock.blockPaddingTop = 0;
          newBlock.blockPaddingBottom = 0;
          newBlock.blockPaddingLeft = 0;
          newBlock.blockPaddingRight = 0;
        }

        const newColumnChildren = [...columnChildren];
        newColumnChildren[columnIndex] = [...(newColumnChildren[columnIndex] || []), newBlock];

        updateBlock(block.id, {
          columnChildren: newColumnChildren
        });
      }

      setDragOverColumnIndex(null);
    };

    return (
      <div
        style={{
          padding: isSpliced ? '0' : `${block.padding ?? 16}px`,
          display: 'flex',
          gap: isSpliced ? '0' : '12px',
          minHeight: isSpliced ? 'auto' : '120px',
          overflow: 'visible'
        }}
      >
        {widths.map((width, idx) => {
          const columnBlocks = columnChildren[idx] || [];
          const isEmpty = columnBlocks.length === 0;

          return (
            <div
              key={idx}
              style={{
                flex: isSpliced
                  ? `0 0 ${width}%`
                  : `0 0 calc(${width}% - ${(12 * (numColumns - 1)) / numColumns}px)`,
                border: isSpliced
                  ? 'none'
                  : `2px dashed ${dragOverColumnIndex === idx ? 'rgba(59, 130, 246, 0.5)' : 'rgba(148, 163, 184, 0.3)'}`,
                borderRadius: isSpliced ? '0' : 'var(--radius-md)',
                padding: isSpliced ? '0' : '16px',
                backgroundColor: isSpliced
                  ? 'transparent'
                  : (dragOverColumnIndex === idx ? 'rgba(96, 165, 250, 0.05)' : 'rgba(241, 245, 249, 0.3)'),
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: isSpliced ? '0' : '8px',
                color: 'var(--text-muted)',
                minHeight: isSpliced ? 'auto' : '100px',
                transition: 'all 0.2s ease',
                overflow: 'visible'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverColumnIndex(idx);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDragOverColumnIndex(null);
                }
              }}
              onDrop={(e) => handleDropInColumn(e, idx)}
            >
              {numColumns > 1 && !isSpliced && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveColumn(idx);
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    color: 'rgb(239, 68, 68)',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                  aria-label="Remove column"
                  title="Remove this column"
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                </button>
              )}

              {isEmpty ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>Drop content here</p>
                </div>
              ) : (
                columnBlocks.map((childBlock, childIndex) => (
                  <div
                    key={childBlock.id}
                    className={`${styles.canvasBlock} ${styles.blockWrapper} ${childBlock.id === selectedId ? styles.selected : ''}`}
                    style={{
                      background: isSpliced ? 'transparent' : 'white',
                      borderRadius: isSpliced ? '0' : '4px',
                      cursor: 'pointer',
                      position: 'relative',
                      margin: isSpliced ? 0 : undefined,
                      padding: isSpliced ? 0 : undefined,
                      border: isSpliced ? 'none' : undefined,
                      lineHeight: isSpliced ? 0 : undefined
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(childBlock.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (childBlock.type === "text" || childBlock.type === "paragraph" || childBlock.type === "headline") {
                        setEditingBlockId(childBlock.id);
                        setTimeout(() => {
                          const el = contentEditableRefs.current.get(childBlock.id);
                          if (el) {
                            if (childBlock.content && childBlock.content !== 'Click to edit text') {
                              el.textContent = childBlock.content;
                            } else {
                              el.textContent = '';
                            }
                            el.focus();
                            const selection = window.getSelection();
                            const range = document.createRange();
                            if (el.childNodes.length > 0) {
                              range.selectNodeContents(el);
                              range.collapse(false);
                            } else {
                              range.setStart(el, 0);
                              range.setEnd(el, 0);
                            }
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }, 50);
                      }
                    }}
                  >
                    {childBlock.id === selectedId && (
                      <div className={styles.rightFloatingPanel}>
                        {(childBlock.type === "text" || childBlock.type === "paragraph" || childBlock.type === "headline") && (
                          <button
                            type="button"
                            className={styles.panelActionButton}
                            aria-label="Edit text"
                            title="Double-click to edit text"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBlockId(childBlock.id);
                              setTimeout(() => {
                                const el = contentEditableRefs.current.get(childBlock.id);
                                if (el) {
                                  if (childBlock.content && childBlock.content !== 'Click to edit text') {
                                    el.textContent = childBlock.content;
                                  } else {
                                    el.textContent = '';
                                  }
                                  el.focus();
                                  const selection = window.getSelection();
                                  const range = document.createRange();
                                  if (el.childNodes.length > 0) {
                                    range.selectNodeContents(el);
                                    range.collapse(false);
                                  } else {
                                    range.setStart(el, 0);
                                    range.setEnd(el, 0);
                                  }
                                  selection.removeAllRanges();
                                  selection.addRange(range);
                                }
                              }, 50);
                            }}
                          >
                            <Edit2 className="icon" />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.panelActionButton}
                          aria-label="Duplicate block"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newBlock = { ...childBlock, id: require('./utils').createId() };
                            const newColumnChildren = [...columnChildren];
                            newColumnChildren[idx] = [...(newColumnChildren[idx] || [])];
                            newColumnChildren[idx].splice(childIndex + 1, 0, newBlock);
                            updateBlock(block.id, { columnChildren: newColumnChildren });
                          }}
                        >
                          <Copy className="icon" />
                        </button>
                        <button
                          type="button"
                          className={styles.panelActionButton}
                          aria-label="Delete block"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newColumnChildren = [...columnChildren];
                            newColumnChildren[idx] = (newColumnChildren[idx] || []).filter(b => b.id !== childBlock.id);
                            updateBlock(block.id, { columnChildren: newColumnChildren });
                            setSelectedId(null);
                          }}
                        >
                          <Trash2 className="icon" />
                        </button>
                      </div>
                    )}
                    <BlockRenderer
                      block={childBlock}
                      selectedId={selectedId}
                      editingBlockId={editingBlockId}
                      dragOverSectionId={dragOverSectionId}
                      contentEditableRefs={contentEditableRefs}
                      updateBlock={updateBlock}
                      setSelectedId={setSelectedId}
                      setEditingBlockId={setEditingBlockId}
                      setIsTextToolbarVisible={setIsTextToolbarVisible}
                      setTextToolbarPosition={setTextToolbarPosition}
                      setDragOverSectionId={setDragOverSectionId}
                      setDragContext={setDragContext}
                      handleDropInSection={handleDropInSection}
                      handleDragEnd={handleDragEnd}
                      handleDuplicateBlockInSection={handleDuplicateBlockInSection}
                      handleDeleteBlockFromSection={handleDeleteBlockFromSection}
                    />
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    );
  };

  switch (block.type) {
    case "section":
      return renderSectionBlock();
    case "columns":
      return renderColumnsBlock();
    case "headline":
      return (
        <TextBlock
          block={block}
          isEditing={editingBlockId === block.id}
          onUpdate={updateBlock}
          onStartEdit={setEditingBlockId}
          onEndEdit={() => {
            setEditingBlockId(null);
            setIsTextToolbarVisible(false);
          }}
          showToolbar={(position) => {
            setTextToolbarPosition(position);
            setIsTextToolbarVisible(true);
          }}
          hideToolbar={() => {
            setIsTextToolbarVisible(false);
          }}
          contentEditableRef={(el) => {
            if (el) contentEditableRefs.current.set(block.id, el);
            else contentEditableRefs.current.delete(block.id);
          }}
        />
      );
    case "paragraph":
      return (
        <TextBlock
          block={block}
          isEditing={editingBlockId === block.id}
          onUpdate={updateBlock}
          onStartEdit={setEditingBlockId}
          onEndEdit={() => {
            setEditingBlockId(null);
            setIsTextToolbarVisible(false);
          }}
          showToolbar={(position) => {
            setTextToolbarPosition(position);
            setIsTextToolbarVisible(true);
          }}
          hideToolbar={() => {
            setIsTextToolbarVisible(false);
          }}
          contentEditableRef={(el) => {
            if (el) contentEditableRefs.current.set(block.id, el);
            else contentEditableRefs.current.delete(block.id);
          }}
        />
      );
    case "text":
      return (
        <TextBlock
          block={block}
          isEditing={editingBlockId === block.id}
          onUpdate={updateBlock}
          onStartEdit={setEditingBlockId}
          onEndEdit={() => {
            setEditingBlockId(null);
            setIsTextToolbarVisible(false);
          }}
          showToolbar={(position) => {
            setTextToolbarPosition(position);
            setIsTextToolbarVisible(true);
          }}
          hideToolbar={() => {
            setIsTextToolbarVisible(false);
          }}
          contentEditableRef={(el) => {
            if (el) contentEditableRefs.current.set(block.id, el);
            else contentEditableRefs.current.delete(block.id);
          }}
        />
      );
    case "image":
      return renderImageBlock();
    case "button":
      return (
        <ButtonWithPaddingHandles
          block={block}
          updateBlock={updateBlock}
          isSelected={selectedId === block.id}
        />
      );
    case "divider":
      return renderDividerBlock();
    case "image-table":
      return (
        <ImageTableBlock
          block={block}
          isSelected={selectedId === block.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(block.id);
          }}
        />
      );
    default:
      return (
        <TextBlock
          block={block}
          isEditing={editingBlockId === block.id}
          onUpdate={updateBlock}
          onStartEdit={setEditingBlockId}
          onEndEdit={() => {
            setEditingBlockId(null);
            setIsTextToolbarVisible(false);
          }}
          showToolbar={(position) => {
            setTextToolbarPosition(position);
            setIsTextToolbarVisible(true);
          }}
          hideToolbar={() => {
            setIsTextToolbarVisible(false);
          }}
          contentEditableRef={(el) => {
            if (el) contentEditableRefs.current.set(block.id, el);
            else contentEditableRefs.current.delete(block.id);
          }}
        />
      );
  }
};

export default BlockRenderer;
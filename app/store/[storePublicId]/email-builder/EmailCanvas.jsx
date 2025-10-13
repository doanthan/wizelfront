import React from 'react';
import { Layout, Plus, Copy, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './email-builder.module.css';

const EmailCanvas = ({
  canvasRef,
  blocks,
  selectedId,
  selectedBlockIndex,
  parentContainer,
  parentContainerIndex,
  isDraggingOver,
  dragContext,
  activeDropIndex,
  isQuickAddOpen,
  draggingBlockId,
  editingBlockId,
  contentEditableRefs,
  canvasInnerClassName,
  registerBlockRef,
  blockRefs,
  onCanvasDragEnter,
  onCanvasDragOver,
  onCanvasDragLeave,
  onCanvasDrop,
  onDropAtIndex,
  onSelectBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlockUp,
  onMoveBlockDown,
  onQuickAddOpen,
  onCanvasBlockDragStart,
  onDragEnd,
  setEditingBlockId,
  setActiveDropIndex,
  renderBlockContent
}) => {
  const isCanvasEmpty = blocks.length === 0;

  // Handler to select section/columns by clicking on canvas margins at the same height
  const handleCanvasClick = (e) => {
    // Only process clicks on the canvas stage or viewport itself, not on blocks
    const target = e.target;
    const className = typeof target.className === 'string' ? target.className : target.className?.baseVal || '';
    const isCanvasElement =
      target.id === 'canvas-stage' ||
      className.includes('canvasViewport') ||
      className.includes('canvasViewportInner');

    if (!isCanvasElement) {
      return;
    }

    const clickY = e.clientY;

    // Find which section/columns block is at this Y coordinate
    for (const block of blocks) {
      if (block.type !== 'section' && block.type !== 'columns') continue;

      const element = blockRefs.current.get(block.id);
      if (!element) continue;

      const rect = element.getBoundingClientRect();

      // Check if click Y is within this block's vertical bounds
      if (clickY >= rect.top && clickY <= rect.bottom) {
        e.stopPropagation();
        onSelectBlock(block.id)();
        return;
      }
    }
  };

  return (
    <section className={styles.canvas} aria-label="Email canvas">
      <div
        id="canvas-stage"
        className={`${styles.canvasStage} ${isDraggingOver ? styles.canvasStageActive : ""}`}
        ref={canvasRef}
        tabIndex={-1}
        onClick={handleCanvasClick}
        onDragEnter={onCanvasDragEnter}
        onDragOver={onCanvasDragOver}
        onDragLeave={onCanvasDragLeave}
        onDrop={onCanvasDrop}
      >
        <div className={`${styles.canvasViewport} ${isDraggingOver ? styles.canvasViewportActive : ""}`}>
          <div className={canvasInnerClassName}>
            {isCanvasEmpty ? (
              <div className={`${styles.emptyState} ${dragContext ? styles.emptyStateActive : ""}`}>
                {dragContext ? (
                  <div className={styles.emptyStateDropPrompt}>
                    <Plus className={styles.emptyStateDropIcon} aria-hidden />
                    <span>Release to add this block</span>
                  </div>
                ) : (
                  <>
                    <Layout className={styles.emptyIcon} aria-hidden />
                    <h3>Start building your email</h3>
                    <p>Drag components from the left or open Quick add to jump start your layout</p>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={onQuickAddOpen}
                      aria-expanded={isQuickAddOpen}
                    >
                      Quick add
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Top dropzone */}
                {dragContext && (
                  <div
                    className={`${styles.dropzone} ${activeDropIndex === 0 ? styles.dropzoneActive : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropIndex(0);
                    }}
                    onDrop={(e) => onDropAtIndex(e, 0)}
                  >
                    <div className={styles.dropzoneIndicator}>
                      <Plus className="icon" />
                      <span>Drop here</span>
                    </div>
                  </div>
                )}

                {blocks.map((block, index) => {
                  const blockClassName = [
                    styles.canvasBlock,
                    block.id === selectedId ? styles.selected : "",
                    draggingBlockId === block.id ? styles.blockDragging : ""
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <React.Fragment key={block.id}>
                      <div
                        className={`${blockClassName} ${styles.blockWrapper}`}
                        draggable
                        ref={registerBlockRef(block.id)}
                        onDragStart={onCanvasBlockDragStart(block, index)}
                        onDragEnd={onDragEnd}
                        onClick={(block.type === 'section' || block.type === 'columns') ? undefined : onSelectBlock(block.id)}
                        onDoubleClick={(e) => {
                          if (block.type === "text" || block.type === "paragraph" || block.type === "headline") {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingBlockId(block.id);
                            setTimeout(() => {
                              const el = contentEditableRefs.current.get(block.id);
                              if (el) {
                                if (!el.innerText || el.innerText.trim() === '') {
                                  el.innerText = block.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
                                }
                                el.focus();
                              }
                            }, 50);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`${block.type} block`}
                        aria-pressed={block.id === selectedId}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelectBlock(block.id)();
                          }
                        }}
                      >
                        {/* Left floating panel for container blocks - show when block is selected OR when a child inside it is selected */}
                        {(block.id === selectedId || (parentContainer && parentContainer.id === block.id)) && (block.type === 'section' || block.type === 'columns') && (
                          <div className={styles.leftFloatingPanel}>
                            <div className={styles.panelLabel}>
                              {block.type === 'section' ? 'SECTION' : 'COLUMNS'}
                            </div>
                            <div className={styles.panelActions}>
                              {index > 0 && (
                                <button
                                  type="button"
                                  className={styles.panelActionButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveBlockUp();
                                  }}
                                  aria-label="Move up"
                                  title="Move up"
                                >
                                  <ChevronUp className="icon" />
                                </button>
                              )}
                              {index < blocks.length - 1 && (
                                <button
                                  type="button"
                                  className={styles.panelActionButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveBlockDown();
                                  }}
                                  aria-label="Move down"
                                  title="Move down"
                                >
                                  <ChevronDown className="icon" />
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.panelActionButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateBlock(block);
                                }}
                                aria-label="Duplicate"
                                title="Duplicate"
                              >
                                <Copy className="icon" />
                              </button>
                              <button
                                type="button"
                                className={styles.panelActionButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteBlock(block.id);
                                }}
                                aria-label="Delete"
                                title="Delete"
                              >
                                <Trash2 className="icon" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Section indicator on the left */}
                        {block.type === 'section' && (
                          <div className={styles.sectionIndicator}>
                            <span>Section</span>
                          </div>
                        )}
                        {block.id === selectedId && block.type !== 'section' && block.type !== 'columns' && (
                          <div className={styles.rightFloatingPanel}>
                            {(block.type === "text" || block.type === "paragraph" || block.type === "headline") && (
                              <button
                                type="button"
                                className={styles.panelActionButton}
                                aria-label="Edit text"
                                title="Double-click to edit text"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditingBlockId(block.id);
                                  setTimeout(() => {
                                    const el = contentEditableRefs.current.get(block.id);
                                    if (el) {
                                      if (!el.innerText || el.innerText.trim() === '') {
                                        el.innerText = block.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
                                      }
                                      el.focus();
                                    }
                                  }, 50);
                                }}
                                style={{
                                  background: editingBlockId === block.id ? "rgba(96, 165, 250, 0.2)" : undefined
                                }}
                              >
                                <Edit2 className="icon" />
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.panelActionButton}
                              aria-label="Duplicate block"
                              onClick={(event) => {
                                event.stopPropagation();
                                onDuplicateBlock(block);
                              }}
                            >
                              <Copy className="icon" />
                            </button>
                            <button
                              type="button"
                              className={styles.panelActionButton}
                              aria-label="Delete block"
                              onClick={(event) => {
                                event.stopPropagation();
                                onDeleteBlock(block.id);
                              }}
                            >
                              <Trash2 className="icon" />
                            </button>
                          </div>
                        )}
                        {renderBlockContent(block)}
                      </div>

                      {/* Dropzone between blocks */}
                      {dragContext && index < blocks.length - 1 && (
                        <div
                          className={`${styles.dropzone} ${activeDropIndex === index + 1 ? styles.dropzoneActive : ""}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setActiveDropIndex(index + 1);
                          }}
                          onDrop={(e) => onDropAtIndex(e, index + 1)}
                        >
                          <div className={styles.dropzoneIndicator}>
                            <Plus className="icon" />
                            <span>Drop here</span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Bottom dropzone */}
                {dragContext && blocks.length > 0 && (
                  <div
                    className={`${styles.dropzone} ${activeDropIndex === blocks.length ? styles.dropzoneActive : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setActiveDropIndex(blocks.length);
                    }}
                    onDrop={(e) => onDropAtIndex(e, blocks.length)}
                  >
                    <div className={styles.dropzoneIndicator}>
                      <Plus className="icon" />
                      <span>Drop here</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmailCanvas;
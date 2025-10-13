import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './email-builder.module.css';

const ButtonWithPaddingHandles = ({ block, updateBlock, isSelected }) => {
  const [isDragging, setIsDragging] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialPadding, setInitialPadding] = useState({});
  const [tempPadding, setTempPadding] = useState({});
  const [isHovering, setIsHovering] = useState(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  // Get block padding values with defaults
  const blockPaddingTop = tempPadding.top !== undefined ? tempPadding.top : (block.blockPaddingTop || 9);
  const blockPaddingBottom = tempPadding.bottom !== undefined ? tempPadding.bottom : (block.blockPaddingBottom || 18);
  const blockPaddingLeft = tempPadding.left !== undefined ? tempPadding.left : (block.blockPaddingLeft || 36);
  const blockPaddingRight = tempPadding.right !== undefined ? tempPadding.right : (block.blockPaddingRight || 36);

  const handleMouseDown = (side) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(side);
    setDragStartY(e.clientY);
    setDragStartX(e.clientX);
    setInitialPadding({
      top: block.blockPaddingTop || 9,
      bottom: block.blockPaddingBottom || 18,
      left: block.blockPaddingLeft || 36,
      right: block.blockPaddingRight || 36
    });
    document.body.style.cursor = side === 'top' || side === 'bottom' ? 'ns-resize' : 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const updatePaddingSmooth = useCallback((side, value) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setTempPadding(prev => ({ ...prev, [side]: value }));
      updateBlock(block.id, { [`blockPadding${side.charAt(0).toUpperCase() + side.slice(1)}`]: value });
    });
  }, [block.id, updateBlock]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - dragStartY;
      const deltaX = e.clientX - dragStartX;

      if (isDragging === 'top') {
        // Dragging down increases top padding (pushes button down)
        const newPadding = Math.max(0, Math.min(200, initialPadding.top + deltaY));
        updatePaddingSmooth('top', Math.round(newPadding));
      } else if (isDragging === 'bottom') {
        // Dragging down increases bottom padding (pushes button up)
        const newPadding = Math.max(0, Math.min(200, initialPadding.bottom + deltaY));
        updatePaddingSmooth('bottom', Math.round(newPadding));
      } else if (isDragging === 'left') {
        // Dragging right increases left padding (pushes button right)
        const newPadding = Math.max(0, Math.min(200, initialPadding.left + deltaX));
        updatePaddingSmooth('left', Math.round(newPadding));
      } else if (isDragging === 'right') {
        // Dragging left increases right padding (pushes button left)
        const newPadding = Math.max(0, Math.min(200, initialPadding.right - deltaX));
        updatePaddingSmooth('right', Math.round(newPadding));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      setTempPadding({});
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartY, dragStartX, initialPadding, updatePaddingSmooth]);

  const buttonStyles = {
    backgroundColor: block.backgroundColor || "#007bff",
    color: block.textColor || "#ffffff",
    fontSize: `${block.fontSize || 16}px`,
    fontFamily: block.fontFamily || "Arial, Helvetica, sans-serif",
    fontWeight: block.fontWeight || "500",
    fontStyle: block.fontStyle || "normal",
    textDecoration: block.textDecoration || "none",
    borderRadius: `${block.borderRadius || 4}px`,
    border: block.borderWidth ?
      `${block.borderWidth}px ${block.borderStyle || 'solid'} ${block.borderColor || block.backgroundColor || "#007bff"}` :
      "none",
    padding: `${block.buttonPaddingY || 12}px ${block.buttonPaddingX || 24}px`,
    display: "inline-block",
    textAlign: "center",
    cursor: "pointer",
    minWidth: block.buttonWidth === 'full' ? '100%' : 'auto',
    boxShadow: block.dropShadow ?
      `${block.shadowX || 0}px ${block.shadowY || 4}px ${block.shadowBlur || 8}px rgba(0,0,0,${block.shadowOpacity || 0.1})` :
      'none',
    position: 'relative',
    zIndex: 2
  };

  const containerStyles = {
    padding: `${blockPaddingTop}px ${blockPaddingRight}px ${blockPaddingBottom}px ${blockPaddingLeft}px`,
    textAlign: block.alignment || "center",
    position: 'relative',
    background: isSelected ? `linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(59, 130, 246, 0.2))` : (block.blockBackgroundColor || 'transparent'),
    display: 'block'
  };

  return (
    <div
      ref={containerRef}
      style={containerStyles}
      className={styles.buttonBlockContainer}
    >
      {isSelected && (
        <>
          {/* Top padding handle */}
          <div
            className={`${styles.paddingHandle} ${styles.paddingHandleTop} ${isDragging === 'top' ? styles.paddingHandleActive : ''} ${isHovering === 'top' ? styles.paddingHandleHover : ''}`}
            onMouseDown={handleMouseDown('top')}
            onMouseEnter={() => setIsHovering('top')}
            onMouseLeave={() => setIsHovering(null)}
          >
            <div className={styles.paddingHandleBar} />
            <span className={`${styles.paddingValue} ${isDragging === 'top' || isHovering === 'top' ? styles.paddingValueVisible : ''}`}>
              {blockPaddingTop}px
            </span>
          </div>

          {/* Bottom padding handle */}
          <div
            className={`${styles.paddingHandle} ${styles.paddingHandleBottom} ${isDragging === 'bottom' ? styles.paddingHandleActive : ''} ${isHovering === 'bottom' ? styles.paddingHandleHover : ''}`}
            onMouseDown={handleMouseDown('bottom')}
            onMouseEnter={() => setIsHovering('bottom')}
            onMouseLeave={() => setIsHovering(null)}
          >
            <div className={styles.paddingHandleBar} />
            <span className={`${styles.paddingValue} ${isDragging === 'bottom' || isHovering === 'bottom' ? styles.paddingValueVisible : ''}`}>
              {blockPaddingBottom}px
            </span>
          </div>

          {/* Left padding handle */}
          <div
            className={`${styles.paddingHandle} ${styles.paddingHandleLeft} ${isDragging === 'left' ? styles.paddingHandleActive : ''} ${isHovering === 'left' ? styles.paddingHandleHover : ''}`}
            onMouseDown={handleMouseDown('left')}
            onMouseEnter={() => setIsHovering('left')}
            onMouseLeave={() => setIsHovering(null)}
          >
            <div className={styles.paddingHandleBar} />
            <span className={`${styles.paddingValue} ${isDragging === 'left' || isHovering === 'left' ? styles.paddingValueVisible : ''}`}>
              {blockPaddingLeft}px
            </span>
          </div>

          {/* Right padding handle */}
          <div
            className={`${styles.paddingHandle} ${styles.paddingHandleRight} ${isDragging === 'right' ? styles.paddingHandleActive : ''} ${isHovering === 'right' ? styles.paddingHandleHover : ''}`}
            onMouseDown={handleMouseDown('right')}
            onMouseEnter={() => setIsHovering('right')}
            onMouseLeave={() => setIsHovering(null)}
          >
            <div className={styles.paddingHandleBar} />
            <span className={`${styles.paddingValue} ${isDragging === 'right' || isHovering === 'right' ? styles.paddingValueVisible : ''}`}>
              {blockPaddingRight}px
            </span>
          </div>

          {/* Visual padding overlay - white center box */}
          <div className={`${styles.paddingOverlay} ${isDragging ? styles.paddingOverlayActive : ''}`} style={{
            top: `${blockPaddingTop}px`,
            bottom: `${blockPaddingBottom}px`,
            left: `${blockPaddingLeft}px`,
            right: `${blockPaddingRight}px`,
            pointerEvents: 'none',
            transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'white',
            boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.3)'
          }} />

          {/* Padding area indicators */}
          <div className={styles.paddingAreaTop} style={{
            height: `${blockPaddingTop}px`,
            top: 0,
            left: 0,
            right: 0
          }} />
          <div className={styles.paddingAreaBottom} style={{
            height: `${blockPaddingBottom}px`,
            bottom: 0,
            left: 0,
            right: 0
          }} />
          <div className={styles.paddingAreaLeft} style={{
            width: `${blockPaddingLeft}px`,
            top: 0,
            bottom: 0,
            left: 0
          }} />
          <div className={styles.paddingAreaRight} style={{
            width: `${blockPaddingRight}px`,
            top: 0,
            bottom: 0,
            right: 0
          }} />
        </>
      )}

      <a
        href={block.buttonUrl || "#"}
        target={block.buttonTarget || "_blank"}
        rel="noopener noreferrer"
        style={buttonStyles}
        role="button"
        onClick={(e) => e.preventDefault()} // Prevent navigation in editor
      >
        {block.content || "Click Here"}
      </a>
    </div>
  );
};

export default ButtonWithPaddingHandles;
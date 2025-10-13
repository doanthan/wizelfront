import React from 'react';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, List, ListOrdered, Link } from 'lucide-react';
import { emailSafeFonts, fontSizeOptions } from './constants';
import styles from './email-builder.module.css';

const TextToolbar = ({
  isVisible,
  textToolbarRef,
  textToolbarPosition,
  editingBlockId,
  currentTextStyles,
  onCommand,
  onFontChange,
  onFontSizeChange,
  onColorChange
}) => {
  if (!isVisible || !editingBlockId) return null;

  return (
    <div
      ref={textToolbarRef}
      className={styles.textToolbar}
      style={{
        top: Math.max(10, textToolbarPosition.top) + "px",
        left: `${textToolbarPosition.left}px`,
      }}
      onMouseDown={(e) => {
        // Prevent the toolbar from causing the block to be deselected
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={(e) => {
        // Also prevent click propagation
        e.stopPropagation();
      }}
    >
      {/* Font Family Dropdown */}
      <select
        className={styles.toolbarSelect}
        value={currentTextStyles.fontFamily || "Arial, Helvetica, sans-serif"}
        onChange={(e) => {
          e.stopPropagation();
          onFontChange(e.target.value);
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {emailSafeFonts.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      {/* Font Size Dropdown */}
      <select
        className={styles.toolbarSelect}
        style={{ width: "70px" }}
        value={currentTextStyles.fontSize || "16"}
        onChange={(e) => {
          e.stopPropagation();
          onFontSizeChange(e.target.value);
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {fontSizeOptions.map((size) => (
          <option key={size.value} value={size.value}>
            {size.label}
          </option>
        ))}
      </select>

      {/* Text Color */}
      <input
        type="color"
        value={currentTextStyles.color || "#000000"}
        onChange={(e) => {
          e.stopPropagation();
          onColorChange(e.target.value);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={styles.colorInput}
      />

      {/* Divider */}
      <div className={styles.toolbarDivider} />

      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => onCommand('bold')}
        className={`${styles.toolbarButton} ${currentTextStyles.bold ? styles.toolbarButtonActive : ''}`}
        title="Bold"
      >
        <Bold size={14} />
      </button>

      <button
        type="button"
        onClick={() => onCommand('italic')}
        className={`${styles.toolbarButton} ${currentTextStyles.italic ? styles.toolbarButtonActive : ''}`}
        title="Italic"
      >
        <Italic size={14} />
      </button>

      <button
        type="button"
        onClick={() => onCommand('underline')}
        className={`${styles.toolbarButton} ${currentTextStyles.underline ? styles.toolbarButtonActive : ''}`}
        title="Underline"
      >
        <Underline size={14} />
      </button>

      <button
        type="button"
        onClick={() => onCommand('strikeThrough')}
        className={`${styles.toolbarButton} ${currentTextStyles.strikeThrough ? styles.toolbarButtonActive : ''}`}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </button>

      {/* Divider */}
      <div className={styles.toolbarDivider} />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => onCommand('justifyLeft')}
        className={`${styles.toolbarButton} ${currentTextStyles.textAlign === 'left' ? styles.toolbarButtonActive : ''}`}
        title="Align Left"
      >
        <AlignLeft size={14} />
      </button>

      <button
        type="button"
        onClick={() => onCommand('justifyCenter')}
        className={`${styles.toolbarButton} ${currentTextStyles.textAlign === 'center' ? styles.toolbarButtonActive : ''}`}
        title="Align Center"
      >
        <AlignCenter size={14} />
      </button>

      <button
        type="button"
        onClick={() => onCommand('justifyRight')}
        className={`${styles.toolbarButton} ${currentTextStyles.textAlign === 'right' ? styles.toolbarButtonActive : ''}`}
        title="Align Right"
      >
        <AlignRight size={14} />
      </button>

      {/* Divider */}
      <div className={styles.toolbarDivider} />

      {/* Lists */}
      <button
        type="button"
        onClick={() => onCommand('insertUnorderedList')}
        className={styles.toolbarButton}
        title="Bullet List"
      >
        <List size={14} />
      </button>

      <button
        type="button"
        onClick={() => onCommand('insertOrderedList')}
        className={styles.toolbarButton}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </button>

      {/* Link */}
      <button
        type="button"
        onClick={() => {
          const url = prompt('Enter the URL:');
          if (url) {
            onCommand('createLink', url);
          }
        }}
        className={styles.toolbarButton}
        title="Insert Link"
      >
        <Link size={14} />
      </button>
    </div>
  );
};

export default TextToolbar;
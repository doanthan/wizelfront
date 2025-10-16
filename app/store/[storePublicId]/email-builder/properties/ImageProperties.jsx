import React, { useState } from 'react';
import ColorPicker from '../ColorPicker';
import styles from '../email-builder.module.css';

/**
 * SpacingControl - Figma-style spacing control with linked values
 */
const SpacingControl = ({ label, top, right, bottom, left, onChange }) => {
  const [showIndividual, setShowIndividual] = useState(false);

  const handleHorizontalChange = (value) => {
    // Allow empty string for clearing the input
    if (value === '') {
      onChange({
        top,
        bottom,
        left: 0,
        right: 0
      });
      return;
    }
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      onChange({
        top,
        bottom,
        left: numValue,
        right: numValue
      });
    }
  };

  const handleVerticalChange = (value) => {
    // Allow empty string for clearing the input
    if (value === '') {
      onChange({
        left,
        right,
        top: 0,
        bottom: 0
      });
      return;
    }
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      onChange({
        left,
        right,
        top: numValue,
        bottom: numValue
      });
    }
  };

  const handleIndividualChange = (side, value) => {
    // Allow empty string for clearing the input
    if (value === '') {
      onChange({
        top,
        right,
        bottom,
        left,
        [side]: 0
      });
      return;
    }
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      onChange({
        top,
        right,
        bottom,
        left,
        [side]: numValue
      });
    }
  };

  // Calculate horizontal and vertical values
  const horizontalSame = left === right;
  const verticalSame = top === bottom;
  // Only show value if they're the same, otherwise leave empty for user to type
  const horizontalValue = horizontalSame ? String(left) : '';
  const verticalValue = verticalSame ? String(top) : '';

  return (
    <fieldset style={{ marginBottom: '16px', border: 'none', padding: 0 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <legend style={{
          padding: 0,
          margin: 0,
          fontSize: '13px',
          fontWeight: '500',
          color: '#374151'
        }}>
          {label}
        </legend>
        <button
          type="button"
          onClick={() => setShowIndividual(!showIndividual)}
          style={{
            background: showIndividual ? '#3B82F6' : 'transparent',
            border: '1px solid #D1D5DB',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: showIndividual ? 'white' : '#6B7280',
            transition: 'all 0.2s',
            borderRadius: '4px'
          }}
          title={showIndividual ? 'Show unified padding' : 'Show individual padding'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="12" height="12" rx="1" />
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
        </button>
      </div>

      {!showIndividual ? (
        // Unified control - horizontal and vertical
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px'
        }}>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={horizontalValue}
              onChange={(e) => handleHorizontalChange(e.target.value)}
              placeholder="Mixed"
              min="0"
              max="200"
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                fontSize: '13px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#6B7280"
              strokeWidth="1.5"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="5" y1="8" x2="5" y2="5" />
              <line x1="11" y1="8" x2="11" y2="11" />
            </svg>
            <span style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              color: '#9CA3AF',
              pointerEvents: 'none'
            }}>
              px
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={verticalValue}
              onChange={(e) => handleVerticalChange(e.target.value)}
              placeholder="Mixed"
              min="0"
              max="200"
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                fontSize: '13px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#6B7280"
              strokeWidth="1.5"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <line x1="8" y1="2" x2="8" y2="14" />
              <line x1="8" y1="5" x2="11" y2="5" />
              <line x1="8" y1="11" x2="5" y2="11" />
            </svg>
            <span style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              color: '#9CA3AF',
              pointerEvents: 'none'
            }}>
              px
            </span>
          </div>
        </div>
      ) : (
        // Individual controls - Top/Bottom in first row, Left/Right in second row
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {/* Top and Bottom row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={top}
                onChange={(e) => handleIndividualChange('top', e.target.value)}
                min="0"
                max="200"
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="#6B7280"
                strokeWidth="1.5"
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              >
                <line x1="8" y1="12" x2="8" y2="4" />
                <polyline points="5,7 8,4 11,7" />
              </svg>
              <span style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                color: '#9CA3AF',
                pointerEvents: 'none'
              }}>
                px
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={bottom}
                onChange={(e) => handleIndividualChange('bottom', e.target.value)}
                min="0"
                max="200"
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="#6B7280"
                strokeWidth="1.5"
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              >
                <line x1="8" y1="4" x2="8" y2="12" />
                <polyline points="5,9 8,12 11,9" />
              </svg>
              <span style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                color: '#9CA3AF',
                pointerEvents: 'none'
              }}>
                px
              </span>
            </div>
          </div>

          {/* Left and Right row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
          }}>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={left}
                onChange={(e) => handleIndividualChange('left', e.target.value)}
                min="0"
                max="200"
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="#6B7280"
                strokeWidth="1.5"
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              >
                <line x1="12" y1="8" x2="4" y2="8" />
                <polyline points="7,5 4,8 7,11" />
              </svg>
              <span style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                color: '#9CA3AF',
                pointerEvents: 'none'
              }}>
                px
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={right}
                onChange={(e) => handleIndividualChange('right', e.target.value)}
                min="0"
                max="200"
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  fontSize: '13px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="#6B7280"
                strokeWidth="1.5"
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              >
                <line x1="4" y1="8" x2="12" y2="8" />
                <polyline points="9,5 12,8 9,11" />
              </svg>
              <span style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                color: '#9CA3AF',
                pointerEvents: 'none'
              }}>
                px
              </span>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
};

/**
 * ImageProperties - Properties panel for Image blocks
 * Controls: Image URL, alt text, Edit Image button, Splice & Link, spacing controls
 */
const ImageProperties = ({ selectedBlock, updateBlock, onImageUrlChange, onEditImage, onSpliceAndLink, brandColors }) => {
  return (
    <>
      <fieldset>
        {selectedBlock.type === "image-table" && (
          <legend>Image Table</legend>
        )}

        {selectedBlock.type === "image" && onEditImage && selectedBlock.imageUrl && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <button
                type="button"
                className={styles.compactButton}
                onClick={() => onEditImage(selectedBlock.id, selectedBlock.imageUrl)}
                style={{ flex: 1 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Edit
              </button>

              <button
                type="button"
                className={styles.compactButton}
                onClick={() => {/* TODO: Implement replace image functionality */}}
                style={{ flex: 1 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Replace
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={styles.compactButton}
                onClick={() => {/* TODO: Implement AI image functionality */}}
                style={{ flex: 1 }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                AI
              </button>

              {onSpliceAndLink && !selectedBlock.isSpliced && (
                <button
                  type="button"
                  className={styles.compactButton}
                  onClick={() => onSpliceAndLink(selectedBlock.id, selectedBlock.imageUrl)}
                  style={{ flex: 1 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 11V6l11 7-11 7v-5" />
                    <rect x="2" y="3" width="6" height="18" rx="1" />
                  </svg>
                  Slice
                </button>
              )}
            </div>
          </div>
        )}

        {selectedBlock.type === "image" && selectedBlock.isSpliced && (
          <div style={{
            padding: '10px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '6px',
            marginBottom: '12px',
            fontSize: '12px',
            color: '#6366F1'
          }}>
            💡 Part of a spliced section
          </div>
        )}

        {selectedBlock.type === "image-table" && (
          <div style={{
            padding: '10px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '6px',
            marginBottom: '12px',
            fontSize: '12px',
            color: '#3B82F6'
          }}>
            Spliced image table with {selectedBlock.imageTableData?.rows?.reduce((sum, row) => sum + row.cells.length, 0) || 0} blocks
          </div>
        )}

        {selectedBlock.type === "image" && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label
                className={styles.formLabel}
                htmlFor="prop-image-alt"
                style={{ fontSize: '11px', marginBottom: '4px' }}
              >
                Alt Text
              </label>
              <input
                id="prop-image-alt"
                className={styles.inputField}
                type="text"
                value={selectedBlock.content || ""}
                onChange={(event) => updateBlock(selectedBlock.id, { content: event.target.value })}
                placeholder="Describe the image"
                style={{ fontSize: '12px', padding: '6px 8px', marginBottom: '8px' }}
              />

              <label
                className={styles.formLabel}
                htmlFor="prop-image-link"
                style={{ fontSize: '11px', marginBottom: '4px' }}
              >
                Link
              </label>
              <input
                id="prop-image-link"
                className={styles.inputField}
                type="url"
                value={selectedBlock.linkUrl || ""}
                onChange={(event) => updateBlock(selectedBlock.id, { linkUrl: event.target.value })}
                placeholder="https://"
                style={{ fontSize: '12px', padding: '6px 8px', marginBottom: '8px' }}
              />

              <label
                className={styles.formLabel}
                htmlFor="prop-image-url"
                style={{ fontSize: '11px', marginBottom: '4px' }}
              >
                Image URL
              </label>
              <input
                id="prop-image-url"
                className={styles.inputField}
                type="url"
                value={selectedBlock.imageUrl ?? ""}
                onChange={(event) => onImageUrlChange(event.target.value)}
                placeholder="https://"
                style={{ fontSize: '12px', padding: '6px 8px' }}
              />
            </div>
          </>
        )}
      </fieldset>

      {selectedBlock.type === "image" && (
        <>
          <fieldset>
            <legend>Image Settings</legend>

            <label className={styles.formLabel} htmlFor="prop-image-width">
              Width
            </label>
            <input
              id="prop-image-width"
              type="range"
              min={10}
              max={100}
              value={selectedBlock.imageWidth || 100}
              onChange={(event) => updateBlock(selectedBlock.id, { imageWidth: Number(event.target.value) })}
            />
            <div className={styles.rangeValue}>{selectedBlock.imageWidth || 100}%</div>

            <label className={styles.formLabel} htmlFor="prop-image-align">
              Alignment
            </label>
            <div className={styles.alignmentButtons}>
              <button
                type="button"
                className={`${styles.alignButton} ${selectedBlock.alignment === 'left' ? styles.alignButtonActive : ''}`}
                onClick={() => updateBlock(selectedBlock.id, { alignment: 'left' })}
                aria-label="Align left"
              >
                ⬅
              </button>
              <button
                type="button"
                className={`${styles.alignButton} ${(!selectedBlock.alignment || selectedBlock.alignment === 'center') ? styles.alignButtonActive : ''}`}
                onClick={() => updateBlock(selectedBlock.id, { alignment: 'center' })}
                aria-label="Align center"
              >
                ↔
              </button>
              <button
                type="button"
                className={`${styles.alignButton} ${selectedBlock.alignment === 'right' ? styles.alignButtonActive : ''}`}
                onClick={() => updateBlock(selectedBlock.id, { alignment: 'right' })}
                aria-label="Align right"
              >
                ➡
              </button>
            </div>
          </fieldset>

          <SpacingControl
            label="Padding"
            top={selectedBlock.paddingTop ?? 0}
            right={selectedBlock.paddingRight ?? 0}
            bottom={selectedBlock.paddingBottom ?? 0}
            left={selectedBlock.paddingLeft ?? 0}
            onChange={(values) => updateBlock(selectedBlock.id, {
              paddingTop: values.top,
              paddingRight: values.right,
              paddingBottom: values.bottom,
              paddingLeft: values.left
            })}
          />

          <fieldset style={{ marginBottom: '16px' }}>
            <legend style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Image area background color
            </legend>
            <ColorPicker
              value={selectedBlock.imageBackgroundColor || "#FFFFFF"}
              onChange={(color) => updateBlock(selectedBlock.id, { imageBackgroundColor: color })}
              label="Background color"
              showHexInput={true}
              position="bottom"
              brandColors={brandColors}
            />
          </fieldset>

          <fieldset>
            <legend>Border</legend>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
              <input
                type="number"
                className={styles.inputField}
                value={selectedBlock.borderWidth || 0}
                onChange={(event) => updateBlock(selectedBlock.id, { borderWidth: Number(event.target.value) })}
                min="0"
                max="20"
                placeholder="Width"
                style={{ flex: 1 }}
              />
              <span>px</span>
            </div>

            {selectedBlock.borderWidth > 0 && (
              <>
                <label className={styles.formLabel}>Border style</label>
                <select
                  className={styles.inputField}
                  value={selectedBlock.borderStyle || 'solid'}
                  onChange={(event) => updateBlock(selectedBlock.id, { borderStyle: event.target.value })}
                  style={{ marginBottom: "8px" }}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>

                <label className={styles.formLabel}>Border color</label>
                <ColorPicker
                  value={selectedBlock.borderColor || "#000000"}
                  onChange={(color) => updateBlock(selectedBlock.id, { borderColor: color })}
                  label="Border color"
                  showHexInput={true}
                  position="bottom"
                  brandColors={brandColors}
                />

                <label className={styles.formLabel}>Border radius</label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={selectedBlock.borderRadius || 0}
                  onChange={(event) => updateBlock(selectedBlock.id, { borderRadius: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{selectedBlock.borderRadius || 0}px</div>
              </>
            )}
          </fieldset>
        </>
      )}
    </>
  );
};

export default ImageProperties;

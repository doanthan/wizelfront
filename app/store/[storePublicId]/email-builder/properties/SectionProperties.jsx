import React from 'react';
import ColorPicker from '../ColorPicker';
import styles from '../email-builder.module.css';

/**
 * SectionProperties - Properties panel for Section blocks
 * Controls: Background image, colors, borders, padding, alignment
 */
const SectionProperties = ({ selectedBlock, updateBlock, brandColors }) => {
  return (
    <>
      <fieldset>
        <legend>Background image</legend>
        <label className={styles.formLabel} htmlFor="prop-bg-image-url">
          Image URL
        </label>
        <input
          id="prop-bg-image-url"
          className={styles.inputField}
          type="url"
          value={selectedBlock.backgroundImage ?? ""}
          onChange={(event) => updateBlock(selectedBlock.id, { backgroundImage: event.target.value })}
          placeholder="https://"
        />

        {selectedBlock.backgroundImage && (
          <>
            <label className={styles.formLabel} htmlFor="prop-bg-size">
              Background size
            </label>
            <select
              id="prop-bg-size"
              className={styles.inputField}
              value={selectedBlock.backgroundSize || 'cover'}
              onChange={(event) => updateBlock(selectedBlock.id, { backgroundSize: event.target.value })}
            >
              <option value="cover">Fill</option>
              <option value="contain">Fit</option>
              <option value="auto">Original size</option>
            </select>

            <label className={styles.formLabel} htmlFor="prop-bg-position">
              Background position
            </label>
            <select
              id="prop-bg-position"
              className={styles.inputField}
              value={selectedBlock.backgroundPosition || 'center'}
              onChange={(event) => updateBlock(selectedBlock.id, { backgroundPosition: event.target.value })}
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>

            <label className={styles.formLabel} htmlFor="prop-bg-repeat">
              Background repeat
            </label>
            <select
              id="prop-bg-repeat"
              className={styles.inputField}
              value={selectedBlock.backgroundRepeat || 'no-repeat'}
              onChange={(event) => updateBlock(selectedBlock.id, { backgroundRepeat: event.target.value })}
            >
              <option value="no-repeat">None</option>
              <option value="repeat">Tile</option>
              <option value="repeat-x">Tile horizontally</option>
              <option value="repeat-y">Tile vertically</option>
            </select>
          </>
        )}
      </fieldset>

      <fieldset>
        <legend>Section color</legend>
        <label className={styles.formLabel} htmlFor="prop-bg-color">
          Background color
        </label>
        <ColorPicker
          value={selectedBlock.backgroundColor || "#ffffff"}
          onChange={(color) => updateBlock(selectedBlock.id, { backgroundColor: color })}
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
            <select
              className={styles.inputField}
              value={selectedBlock.borderStyle || 'solid'}
              onChange={(event) => updateBlock(selectedBlock.id, { borderStyle: event.target.value })}
              style={{ marginBottom: "8px" }}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
            <ColorPicker
              value={selectedBlock.borderColor || "#000000"}
              onChange={(color) => updateBlock(selectedBlock.id, { borderColor: color })}
              label="Border color"
              showHexInput={true}
              position="bottom"
              brandColors={brandColors}
            />
          </>
        )}
      </fieldset>

      <fieldset>
        <legend>Padding</legend>
        <label className={styles.formLabel} htmlFor="prop-section-padding">
          Inner spacing
        </label>
        <input
          id="prop-section-padding"
          type="range"
          min={0}
          max={100}
          value={selectedBlock.padding || 24}
          onChange={(event) => updateBlock(selectedBlock.id, { padding: Number(event.target.value) })}
        />
        <div className={styles.rangeValue}>{selectedBlock.padding || 24}px</div>
      </fieldset>

      <fieldset>
        <legend>Content alignment</legend>
        <div className={styles.alignmentButtons}>
          <button
            type="button"
            className={`${styles.alignButton} ${selectedBlock.contentAlign === 'left' ? styles.alignButtonActive : ''}`}
            onClick={() => updateBlock(selectedBlock.id, { contentAlign: 'left' })}
            aria-label="Align left"
          >
            ⬅
          </button>
          <button
            type="button"
            className={`${styles.alignButton} ${(!selectedBlock.contentAlign || selectedBlock.contentAlign === 'center') ? styles.alignButtonActive : ''}`}
            onClick={() => updateBlock(selectedBlock.id, { contentAlign: 'center' })}
            aria-label="Align center"
          >
            ↔
          </button>
          <button
            type="button"
            className={`${styles.alignButton} ${selectedBlock.contentAlign === 'right' ? styles.alignButtonActive : ''}`}
            onClick={() => updateBlock(selectedBlock.id, { contentAlign: 'right' })}
            aria-label="Align right"
          >
            ➡
          </button>
        </div>
      </fieldset>
    </>
  );
};

export default SectionProperties;

import React from 'react';
import ColorPicker from '../ColorPicker';
import styles from '../email-builder.module.css';

/**
 * ButtonProperties - Properties panel for Button blocks
 * Controls: Text, link, styling, border, shadow, padding (with tabs)
 */
const ButtonProperties = ({ selectedBlock, updateBlock, brandColors }) => {
  return (
    <>
      {/* Tabs */}
      <div className={styles.buttonTabs}>
        <button
          type="button"
          className={`${styles.buttonTab} ${(!selectedBlock.activeTab || selectedBlock.activeTab === 'styles') ? styles.buttonTabActive : ''}`}
          onClick={() => updateBlock(selectedBlock.id, { activeTab: 'styles' })}
        >
          Styles
        </button>
        <button
          type="button"
          className={`${styles.buttonTab} ${selectedBlock.activeTab === 'display' ? styles.buttonTabActive : ''}`}
          onClick={() => updateBlock(selectedBlock.id, { activeTab: 'display' })}
        >
          Display
        </button>
      </div>

      {/* Styles Tab Content */}
      {(!selectedBlock.activeTab || selectedBlock.activeTab === 'styles') && (
        <>
          <fieldset className={styles.buttonSection}>
            <legend>Button text</legend>
            <label className={styles.formLabel}>Text</label>
            <input
              className={styles.inputField}
              type="text"
              value={selectedBlock.content || ""}
              onChange={(event) => updateBlock(selectedBlock.id, { content: event.target.value })}
              placeholder="BOOK YOUR HOLIDAY"
            />

            <label className={styles.formLabel}>Link address</label>
            <input
              className={styles.inputField}
              type="url"
              value={selectedBlock.buttonUrl || ""}
              onChange={(event) => updateBlock(selectedBlock.id, { buttonUrl: event.target.value })}
              placeholder="https://"
            />

            <select
              className={styles.inputField}
              value={selectedBlock.buttonTarget || "_self"}
              onChange={(event) => updateBlock(selectedBlock.id, { buttonTarget: event.target.value })}
            >
              <option value="_self">Same window</option>
              <option value="_blank">New window</option>
            </select>

            <div className={styles.textFormatting}>
              <div className={styles.textFormattingRow}>
                <input
                  type="number"
                  className={styles.fontSizeInput}
                  value={selectedBlock.fontSize || 15}
                  onChange={(event) => updateBlock(selectedBlock.id, { fontSize: Number(event.target.value) })}
                  min="10"
                  max="48"
                />
                <span className={styles.unitLabel}>px</span>
                <ColorPicker
                  value={selectedBlock.textColor || "#372C1E"}
                  onChange={(color) => updateBlock(selectedBlock.id, { textColor: color })}
                  label="Text Color"
                  showHexInput={true}
                  position="bottom"
                  brandColors={brandColors}
                />
              </div>
              <div className={styles.textFormattingButtons}>
                <button
                  type="button"
                  className={`${styles.formatButton} ${selectedBlock.fontWeight === '700' ? styles.formatButtonActive : ''}`}
                  onClick={() => updateBlock(selectedBlock.id, { fontWeight: selectedBlock.fontWeight === '700' ? '400' : '700' })}
                  aria-label="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  className={`${styles.formatButton} ${selectedBlock.fontStyle === 'italic' ? styles.formatButtonActive : ''}`}
                  onClick={() => updateBlock(selectedBlock.id, { fontStyle: selectedBlock.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  aria-label="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  className={`${styles.formatButton} ${selectedBlock.textDecoration === 'underline' ? styles.formatButtonActive : ''}`}
                  onClick={() => updateBlock(selectedBlock.id, { textDecoration: selectedBlock.textDecoration === 'underline' ? 'none' : 'underline' })}
                  aria-label="Underline"
                >
                  <u>U</u>
                </button>
                <button
                  type="button"
                  className={`${styles.formatButton} ${selectedBlock.textDecoration === 'line-through' ? styles.formatButtonActive : ''}`}
                  onClick={() => updateBlock(selectedBlock.id, { textDecoration: selectedBlock.textDecoration === 'line-through' ? 'none' : 'line-through' })}
                  aria-label="Strikethrough"
                >
                  <s>S</s>
                </button>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.buttonSection}>
            <legend>Style</legend>
            <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ColorPicker
                value={selectedBlock.backgroundColor || "#DAE2CB"}
                onChange={(color) => updateBlock(selectedBlock.id, { backgroundColor: color })}
                label="Background Color"
                showHexInput={true}
                position="bottom"
                brandColors={brandColors}
              />
              <input
                type="number"
                className={styles.radiusInput}
                value={selectedBlock.borderRadius || 50}
                onChange={(event) => updateBlock(selectedBlock.id, { borderRadius: Number(event.target.value) })}
                min="0"
                max="50"
              />
              <span className={styles.unitLabel}>px</span>
            </div>

            <div className={styles.buttonWidthOptions}>
              <button
                type="button"
                className={`${styles.widthOption} ${selectedBlock.buttonWidth !== 'full' ? styles.widthOptionActive : ''}`}
                onClick={() => updateBlock(selectedBlock.id, { buttonWidth: 'fit' })}
              >
                Fit to text
              </button>
              <button
                type="button"
                className={`${styles.widthOption} ${selectedBlock.buttonWidth === 'full' ? styles.widthOptionActive : ''}`}
                onClick={() => updateBlock(selectedBlock.id, { buttonWidth: 'full' })}
              >
                Full width
              </button>
            </div>

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
                className={`${styles.alignButton} ${selectedBlock.alignment === 'center' ? styles.alignButtonActive : ''}`}
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

            <div className={styles.paddingControls}>
              <div className={styles.paddingControl}>
                <input
                  type="number"
                  className={styles.paddingInput}
                  value={selectedBlock.buttonPaddingX || 15}
                  onChange={(event) => updateBlock(selectedBlock.id, { buttonPaddingX: Number(event.target.value) })}
                  min="0"
                  max="50"
                />
                <span className={styles.unitLabel}>px</span>
              </div>
              <div className={styles.paddingControl}>
                <input
                  type="number"
                  className={styles.paddingInput}
                  value={selectedBlock.buttonPaddingY || 35}
                  onChange={(event) => updateBlock(selectedBlock.id, { buttonPaddingY: Number(event.target.value) })}
                  min="0"
                  max="50"
                />
                <span className={styles.unitLabel}>px</span>
              </div>
            </div>
          </fieldset>

          {/* Collapsible Sections */}
          <details className={styles.collapsibleSection}>
            <summary className={styles.collapsibleHeader}>
              <span>Border</span>
              <span className={styles.expandIcon}>+</span>
            </summary>
            <div className={styles.collapsibleContent}>
              <div className={styles.borderControls}>
                <input
                  type="number"
                  className={styles.borderWidthInput}
                  value={selectedBlock.borderWidth || 0}
                  onChange={(event) => updateBlock(selectedBlock.id, { borderWidth: Number(event.target.value) })}
                  min="0"
                  max="10"
                />
                <span className={styles.unitLabel}>px</span>
                <select
                  className={styles.borderStyleSelect}
                  value={selectedBlock.borderStyle || 'solid'}
                  onChange={(event) => updateBlock(selectedBlock.id, { borderStyle: event.target.value })}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
                <input
                  type="color"
                  value={selectedBlock.borderColor || "#000000"}
                  onChange={(event) => updateBlock(selectedBlock.id, { borderColor: event.target.value })}
                  className={styles.colorPickerSmall}
                />
              </div>
            </div>
          </details>

          <details className={styles.collapsibleSection}>
            <summary className={styles.collapsibleHeader}>
              <span>Drop shadow</span>
              <span className={styles.expandIcon}>+</span>
            </summary>
            <div className={styles.collapsibleContent}>
              <div className={styles.shadowControls}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedBlock.dropShadow || false}
                    onChange={(event) => updateBlock(selectedBlock.id, { dropShadow: event.target.checked })}
                  />
                  Enable shadow
                </label>
                {selectedBlock.dropShadow && (
                  <>
                    <div className={styles.shadowInputs}>
                      <input
                        type="number"
                        placeholder="X"
                        value={selectedBlock.shadowX || 0}
                        onChange={(event) => updateBlock(selectedBlock.id, { shadowX: Number(event.target.value) })}
                        className={styles.shadowInput}
                      />
                      <input
                        type="number"
                        placeholder="Y"
                        value={selectedBlock.shadowY || 4}
                        onChange={(event) => updateBlock(selectedBlock.id, { shadowY: Number(event.target.value) })}
                        className={styles.shadowInput}
                      />
                      <input
                        type="number"
                        placeholder="Blur"
                        value={selectedBlock.shadowBlur || 8}
                        onChange={(event) => updateBlock(selectedBlock.id, { shadowBlur: Number(event.target.value) })}
                        className={styles.shadowInput}
                      />
                      <input
                        type="color"
                        value={selectedBlock.shadowColor || "#000000"}
                        onChange={(event) => updateBlock(selectedBlock.id, { shadowColor: event.target.value })}
                        className={styles.colorPickerSmall}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </details>

          <details className={styles.collapsibleSection}>
            <summary className={styles.collapsibleHeader}>
              <span>Block background color</span>
              <span className={styles.expandIcon}>+</span>
            </summary>
            <div className={styles.collapsibleContent}>
              <ColorPicker
                value={selectedBlock.blockBackgroundColor || "#ffffff"}
                onChange={(color) => updateBlock(selectedBlock.id, { blockBackgroundColor: color })}
                label="Block Background Color"
                showHexInput={true}
                position="bottom"
                brandColors={brandColors}
              />
            </div>
          </details>

          <fieldset className={styles.buttonSection}>
            <legend>Block padding</legend>
            <div className={styles.paddingControls}>
              <div className={styles.paddingControl}>
                <label className={styles.paddingIcon}>↕</label>
                <input
                  type="number"
                  className={styles.paddingInput}
                  value={selectedBlock.blockPaddingTop || 9}
                  onChange={(event) => updateBlock(selectedBlock.id, { blockPaddingTop: Number(event.target.value) })}
                  min="0"
                  max="100"
                />
                <span className={styles.unitLabel}>px</span>
              </div>
              <div className={styles.paddingControl}>
                <label className={styles.paddingIcon}>↕</label>
                <input
                  type="number"
                  className={styles.paddingInput}
                  value={selectedBlock.blockPaddingBottom || 18}
                  onChange={(event) => updateBlock(selectedBlock.id, { blockPaddingBottom: Number(event.target.value) })}
                  min="0"
                  max="100"
                />
                <span className={styles.unitLabel}>px</span>
              </div>
            </div>
            <div className={styles.paddingControls}>
              <div className={styles.paddingControl}>
                <label className={styles.paddingIcon}>↔</label>
                <input
                  type="number"
                  className={styles.paddingInput}
                  value={selectedBlock.blockPaddingLeft || 36}
                  onChange={(event) => updateBlock(selectedBlock.id, { blockPaddingLeft: Number(event.target.value) })}
                  min="0"
                  max="100"
                />
                <span className={styles.unitLabel}>px</span>
              </div>
              <div className={styles.paddingControl}>
                <label className={styles.paddingIcon}>↔</label>
                <input
                  type="number"
                  className={styles.paddingInput}
                  value={selectedBlock.blockPaddingRight || 36}
                  onChange={(event) => updateBlock(selectedBlock.id, { blockPaddingRight: Number(event.target.value) })}
                  min="0"
                  max="100"
                />
                <span className={styles.unitLabel}>px</span>
              </div>
            </div>
            <div className={styles.mobileToggle}>
              <label>Full width on mobile</label>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={selectedBlock.fullWidthMobile || false}
                  onChange={(event) => updateBlock(selectedBlock.id, { fullWidthMobile: event.target.checked })}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </fieldset>
        </>
      )}

      {/* Display Tab Content */}
      {selectedBlock.activeTab === 'display' && (
        <fieldset className={styles.buttonSection}>
          <legend>Display Settings</legend>
          <p>Display settings will be implemented here</p>
        </fieldset>
      )}
    </>
  );
};

export default ButtonProperties;

import React from 'react';
import { ChevronsRight } from 'lucide-react';
import { blockLabels, emailSafeFonts } from './constants';
import ColorPicker from './ColorPicker';
import { useBrand } from './BrandContext';
import styles from './email-builder.module.css';

const PropertiesPanel = ({
  propertiesRef,
  selectedBlock,
  isPropertiesFloating,
  isPropertiesOpen,
  onToggleProperties,
  updateBlock,
  onImageUrlChange,
  propertiesPanelClassName,
  onEditImage,
  onSpliceAndLink
}) => {
  const { getBrandColors } = useBrand();
  const brandColors = getBrandColors();

  return (
    <aside
      className={propertiesPanelClassName}
      aria-label="Component properties"
      ref={propertiesRef}
      tabIndex={-1}
    >
      {isPropertiesFloating && (
        <button
          className={styles.propertiesToggle}
          type="button"
          onClick={onToggleProperties}
          aria-expanded={isPropertiesOpen}
          aria-label={isPropertiesOpen ? "Collapse properties" : "Expand properties"}
        >
          <ChevronsRight
            className={`${styles.panelToggleIcon} ${isPropertiesOpen ? styles.panelToggleIconOpen : ""} icon`}
          />
        </button>
      )}
      <div className={styles.propertiesContent}>
        {!selectedBlock ? (
          <div className={styles.propertiesEmpty}>
            <h3>No block selected</h3>
            <p>Select a component on the canvas to edit its content and style.</p>
          </div>
        ) : (
          <>
            {selectedBlock && selectedBlock.type !== "button" && selectedBlock.type !== "image" && (
              <div className={styles.propertiesHeading}>
                <span className={styles.propertiesBadge}>{blockLabels[selectedBlock.type] ?? "Component"}</span>
                <p>
                  {(selectedBlock.type === "text" || selectedBlock.type === "paragraph" || selectedBlock.type === "headline")
                    ? "Double-click the text to edit directly with rich formatting options, or use the fields below."
                    : "Edit content, spacing, and alignment for this block."}
                </p>
              </div>
            )}

            {selectedBlock && selectedBlock.type === "image" && (
              <div className={styles.propertiesHeading}>
                <span className={styles.propertiesBadge}>Image</span>
              </div>
            )}

            <form className={styles.propertiesForm} onSubmit={(event) => event.preventDefault()}>

            {selectedBlock.type === "section" && (
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
            )}

            {(selectedBlock.type === "image" || selectedBlock.type === "image-table") && (
              <>
                {selectedBlock.type === "image" && (
                  <>
                    {/* Action Buttons at Top */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      {onEditImage && selectedBlock.imageUrl && (
                        <button
                          type="button"
                          className={styles.outlinePrimaryButton}
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
                          Edit Image
                        </button>
                      )}

                      {onSpliceAndLink && selectedBlock.imageUrl && !selectedBlock.isSpliced && (
                        <button
                          type="button"
                          className={styles.outlinePrimaryButton}
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
                          Splice & Link
                        </button>
                      )}
                    </div>

                    {selectedBlock.isSpliced && (
                      <div style={{
                        padding: '10px 12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        💡 This image is part of a spliced section
                      </div>
                    )}

                    {/* Compact URL and Alt Text Inputs */}
                    <fieldset style={{ marginBottom: '16px' }}>
                      <legend>Image source</legend>
                      <input
                        className={styles.inputField}
                        type="url"
                        value={selectedBlock.imageUrl ?? ""}
                        onChange={(event) => onImageUrlChange(event.target.value)}
                        placeholder="Image URL (https://...)"
                        style={{ fontSize: '13px', marginBottom: '8px' }}
                      />
                      <input
                        className={styles.inputField}
                        type="text"
                        value={selectedBlock.content || ""}
                        onChange={(event) => updateBlock(selectedBlock.id, { content: event.target.value })}
                        placeholder="Alt text (describe the image)"
                        style={{ fontSize: '13px' }}
                      />
                    </fieldset>

                    {/* Alignment */}
                    <fieldset style={{ marginBottom: '16px' }}>
                      <legend>Alignment</legend>
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

                    {/* Enterprise Padding Controls */}
                    <fieldset style={{ marginBottom: '16px' }}>
                      <legend>Padding</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Top</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.paddingTop ?? selectedBlock.padding ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { paddingTop: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Right</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.paddingRight ?? selectedBlock.padding ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { paddingRight: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Bottom</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.paddingBottom ?? selectedBlock.padding ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { paddingBottom: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Left</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.paddingLeft ?? selectedBlock.padding ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { paddingLeft: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                      </div>
                    </fieldset>

                    {/* Enterprise Margin Controls */}
                    <fieldset style={{ marginBottom: '16px' }}>
                      <legend>Margin</legend>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Top</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.marginTop ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { marginTop: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Right</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.marginRight ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { marginRight: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Bottom</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.marginBottom ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { marginBottom: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                        <div>
                          <label className={styles.formLabel} style={{ fontSize: '11px', marginBottom: '4px' }}>Left</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              className={styles.inputField}
                              value={selectedBlock.marginLeft ?? 0}
                              onChange={(event) => updateBlock(selectedBlock.id, { marginLeft: Number(event.target.value) })}
                              min="0"
                              max="100"
                              style={{ fontSize: '13px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>px</span>
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  </>
                )}

                {selectedBlock.type === "image-table" && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
                      This is a spliced image table with {selectedBlock.imageTableData?.rows?.reduce((sum, row) => sum + row.cells.length, 0) || 0} blocks.
                    </p>
                  </div>
                )}
              </>
            )}

            {selectedBlock.type === "divider" && (
              <fieldset>
                <legend>Divider</legend>
                <label className={styles.formLabel} htmlFor="prop-divider-style">
                  Style
                </label>
                <select
                  id="prop-divider-style"
                  className={styles.inputField}
                  value={selectedBlock.dividerStyle || "two-tone"}
                  onChange={(event) => updateBlock(selectedBlock.id, { dividerStyle: event.target.value })}
                >
                  <option value="two-tone">Two-Tone (Straight)</option>
                  <option value="two-tone-light-wave">Two-Tone Light Wave</option>
                  <option value="two-tone-wave">Two-Tone Wave</option>
                  <option value="two-tone-curve">Two-Tone Curve</option>
                  <option value="two-tone-slant">Two-Tone Slant</option>
                  <option value="two-tone-light-zigzag">Two-Tone Light Zigzag</option>
                  <option value="two-tone-zigzag">Two-Tone Zigzag</option>
                  <option value="two-tone-paint">Two-Tone Paint Stroke</option>
                  <option value="two-tone-drip">Two-Tone Drip</option>
                  <option value="two-tone-clouds">Two-Tone Clouds</option>
                </select>

                {(selectedBlock.dividerStyle === "two-tone" ||
                  selectedBlock.dividerStyle === "two-tone-wave" ||
                  selectedBlock.dividerStyle === "two-tone-light-wave" ||
                  selectedBlock.dividerStyle === "two-tone-curve" ||
                  selectedBlock.dividerStyle === "two-tone-slant" ||
                  selectedBlock.dividerStyle === "two-tone-light-zigzag" ||
                  selectedBlock.dividerStyle === "two-tone-zigzag" ||
                  selectedBlock.dividerStyle === "two-tone-paint" ||
                  selectedBlock.dividerStyle === "two-tone-drip" ||
                  selectedBlock.dividerStyle === "two-tone-clouds") ? (
                  <>
                    <label className={styles.formLabel} htmlFor="prop-divider-color-top">
                      Top Color
                    </label>
                    <ColorPicker
                      value={selectedBlock.dividerColorTop || "#6366F1"}
                      onChange={(color) => updateBlock(selectedBlock.id, { dividerColorTop: color })}
                      label="Top Color"
                      showHexInput={true}
                      position="bottom"
                      brandColors={brandColors}
                    />

                    <label className={styles.formLabel} htmlFor="prop-divider-color-bottom">
                      Bottom Color
                    </label>
                    <ColorPicker
                      value={selectedBlock.dividerColorBottom || "#FFFFFF"}
                      onChange={(color) => updateBlock(selectedBlock.id, { dividerColorBottom: color })}
                      label="Bottom Color"
                      showHexInput={true}
                      position="bottom"
                      brandColors={brandColors}
                    />
                  </>
                ) : (
                  <>
                    <label className={styles.formLabel} htmlFor="prop-divider-color">
                      Color
                    </label>
                    <ColorPicker
                      value={selectedBlock.dividerColor || "#E5E7EB"}
                      onChange={(color) => updateBlock(selectedBlock.id, { dividerColor: color })}
                      label="Color"
                      showHexInput={true}
                      position="bottom"
                      brandColors={brandColors}
                    />
                  </>
                )}

                <label className={styles.formLabel} htmlFor="prop-divider-height">
                  Height
                </label>
                <input
                  id="prop-divider-height"
                  type="range"
                  min={20}
                  max={200}
                  value={selectedBlock.dividerHeight || 100}
                  onChange={(event) => updateBlock(selectedBlock.id, { dividerHeight: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{selectedBlock.dividerHeight || 100}px</div>

                <label className={styles.formLabel} htmlFor="prop-divider-width">
                  Width
                </label>
                <input
                  id="prop-divider-width"
                  type="range"
                  min={10}
                  max={100}
                  value={selectedBlock.dividerWidth || 100}
                  onChange={(event) => updateBlock(selectedBlock.id, { dividerWidth: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{selectedBlock.dividerWidth || 100}%</div>

                <label className={styles.formLabel} htmlFor="prop-divider-padding">
                  Spacing
                </label>
                <input
                  id="prop-divider-padding"
                  type="range"
                  min={0}
                  max={60}
                  value={selectedBlock.padding || 0}
                  onChange={(event) => updateBlock(selectedBlock.id, { padding: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{selectedBlock.padding || 0}px</div>
              </fieldset>
            )}

            {selectedBlock && selectedBlock.type !== "divider" && selectedBlock.type !== "image" && selectedBlock.type !== "image-table" && selectedBlock.type !== "button" && (
              <fieldset>
                <legend>Typography</legend>
                <label className={styles.formLabel} htmlFor="prop-font-family">
                  Font Family
                </label>
                <select
                  id="prop-font-family"
                  className={styles.inputField}
                  value={selectedBlock.fontFamily || "Arial, Helvetica, sans-serif"}
                  onChange={(event) => updateBlock(selectedBlock.id, { fontFamily: event.target.value })}
                >
                  {emailSafeFonts.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>

                <label className={styles.formLabel} htmlFor="prop-font-size">
                  Font size
                </label>
                <input
                  id="prop-font-size"
                  type="range"
                  min={12}
                  max={48}
                  value={selectedBlock.fontSize || 16}
                  onChange={(event) => updateBlock(selectedBlock.id, { fontSize: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{selectedBlock.fontSize || 16}px</div>

                <label className={styles.formLabel} htmlFor="prop-line-height">
                  Line Height
                </label>
                <input
                  id="prop-line-height"
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={selectedBlock.lineHeight || 1.6}
                  onChange={(event) => updateBlock(selectedBlock.id, { lineHeight: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{(selectedBlock.lineHeight || 1.6).toFixed(1)}</div>

                <label className={styles.formLabel} htmlFor="prop-letter-spacing">
                  Letter Spacing
                </label>
                <input
                  id="prop-letter-spacing"
                  type="range"
                  min={-2}
                  max={10}
                  step={0.5}
                  value={selectedBlock.letterSpacing || 0}
                  onChange={(event) => updateBlock(selectedBlock.id, { letterSpacing: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{selectedBlock.letterSpacing || 0}px</div>

                <label className={styles.formLabel} htmlFor="prop-text-color">
                  Text Color
                </label>
                <ColorPicker
                  value={selectedBlock.textColor || "#000000"}
                  onChange={(color) => updateBlock(selectedBlock.id, { textColor: color })}
                  label="Text Color"
                  showHexInput={true}
                  position="bottom"
                  brandColors={brandColors}
                />
              </fieldset>
            )}

            {selectedBlock && selectedBlock.type === "button" && (
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
            )}

            {selectedBlock && selectedBlock.type !== "button" && selectedBlock.type !== "image" && selectedBlock.type !== "image-table" && (
              <fieldset>
                <legend>Spacing & Layout</legend>
                <label className={styles.formLabel} htmlFor="prop-padding">
                  Padding
                </label>
                <input
                  id="prop-padding"
                  type="range"
                  min={0}
                  max={80}
                  value={selectedBlock.padding || 0}
                  onChange={(event) => updateBlock(selectedBlock.id, { padding: Number(event.target.value) })}
                />
                <div className={styles.rangeValue}>{selectedBlock.padding || 0}px</div>
              </fieldset>
            )}

            </form>
          </>
        )}
      </div>
    </aside>
  );
};

export default PropertiesPanel;
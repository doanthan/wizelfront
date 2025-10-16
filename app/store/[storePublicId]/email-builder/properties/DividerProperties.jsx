import React from 'react';
import ColorPicker from '../ColorPicker';
import styles from '../email-builder.module.css';

/**
 * DividerProperties - Properties panel for Divider blocks
 * Controls: Style, colors, height, width, spacing
 */
const DividerProperties = ({ selectedBlock, updateBlock, brandColors }) => {
  const isTwoToneStyle =
    selectedBlock.dividerStyle === "two-tone" ||
    selectedBlock.dividerStyle === "two-tone-wave" ||
    selectedBlock.dividerStyle === "two-tone-light-wave" ||
    selectedBlock.dividerStyle === "two-tone-curve" ||
    selectedBlock.dividerStyle === "two-tone-slant" ||
    selectedBlock.dividerStyle === "two-tone-light-zigzag" ||
    selectedBlock.dividerStyle === "two-tone-zigzag" ||
    selectedBlock.dividerStyle === "two-tone-paint" ||
    selectedBlock.dividerStyle === "two-tone-drip" ||
    selectedBlock.dividerStyle === "two-tone-clouds";

  return (
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

      {isTwoToneStyle ? (
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
  );
};

export default DividerProperties;

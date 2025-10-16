import React from 'react';
import styles from '../email-builder.module.css';

/**
 * CommonProperties - Shared spacing and layout controls for most block types
 * Used by: text, paragraph, headline, image (not button or divider)
 */
const CommonProperties = ({ selectedBlock, updateBlock }) => {
  return (
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
  );
};

export default CommonProperties;

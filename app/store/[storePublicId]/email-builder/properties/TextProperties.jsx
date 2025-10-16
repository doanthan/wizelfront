import React from 'react';
import ColorPicker from '../ColorPicker';
import { emailSafeFonts } from '../constants';
import styles from '../email-builder.module.css';

/**
 * TextProperties - Properties panel for Text, Paragraph, and Headline blocks
 * Controls: Typography (font, size, line height, letter spacing, color)
 */
const TextProperties = ({ selectedBlock, updateBlock, brandColors }) => {
  // Mobile text block presets
  const applyPreset = (preset) => {
    updateBlock(selectedBlock.id, preset);
  };

  // Mobile-optimized text presets with padding for better readability on small screens
  const presets = [
    {
      name: 'Large Heading',
      settings: {
        fontSize: 28,
        lineHeight: 1.2,
        letterSpacing: -0.5,
        fontFamily: 'Georgia, Times, "Times New Roman", serif',
        padding: 20 // Mobile-friendly padding
      }
    },
    {
      name: 'Heading',
      settings: {
        fontSize: 22,
        lineHeight: 1.3,
        letterSpacing: 0,
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: 16 // Mobile-friendly padding
      }
    },
    {
      name: 'Body Text',
      settings: {
        fontSize: 16,
        lineHeight: 1.6,
        letterSpacing: 0,
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: 12 // Mobile-friendly padding
      }
    },
    {
      name: 'Small Text',
      settings: {
        fontSize: 14,
        lineHeight: 1.5,
        letterSpacing: 0,
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: 10 // Mobile-friendly padding
      }
    }
  ];

  return (
    <fieldset>
      <select
        id="prop-font-family"
        className={styles.inputField}
        value={selectedBlock.fontFamily || "Arial, Helvetica, sans-serif"}
        onChange={(event) => updateBlock(selectedBlock.id, { fontFamily: event.target.value })}
        style={{ marginBottom: '12px' }}
      >
        {emailSafeFonts.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

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

      <label className={styles.formLabel} htmlFor="prop-block-bg-color">
        Block background color
      </label>
      <ColorPicker
        value={selectedBlock.blockBackgroundColor || "#FFFFFF"}
        onChange={(color) => updateBlock(selectedBlock.id, { blockBackgroundColor: color })}
        label="Block background color"
        showHexInput={true}
        position="bottom"
        brandColors={brandColors}
      />

      {/* Mobile Text Presets */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className={styles.formLabel} style={{ marginBottom: 0 }}>
            Mobile Text Presets
          </label>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </div>
        <p style={{
          fontSize: '11px',
          color: '#6B7280',
          marginBottom: '12px',
          lineHeight: '1.4'
        }}>
          Optimized for mobile devices with proper sizing and padding
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {presets.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applyPreset(preset.settings)}
              style={{
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontWeight: '600' }}>{preset.name}</span>
              <span style={{
                fontSize: '10px',
                color: '#9CA3AF',
                lineHeight: '1.2'
              }}>
                {preset.settings.fontSize}px · {preset.settings.padding}px pad
              </span>
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  );
};

export default TextProperties;

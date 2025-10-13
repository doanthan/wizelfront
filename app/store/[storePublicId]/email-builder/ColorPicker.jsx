import React, { useState, useEffect, useRef } from 'react';
import { Pipette } from 'lucide-react';
import styles from './color-picker.module.css';

const ColorPicker = ({
  value = '#000000',
  onChange,
  label = 'Color',
  showHexInput = true,
  position = 'bottom', // 'top', 'bottom', 'left', 'right'
  brandColors = [] // Pass brand colors from parent component
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(value);
  const [recentColors, setRecentColors] = useState([]);
  const [activeTab, setActiveTab] = useState('picker'); // 'picker', 'recent', 'brand'
  const pickerRef = useRef(null);
  const colorInputRef = useRef(null);

  // Default brand colors if none provided (fallback)
  const defaultBrandColors = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EF4444', // Red
  ];

  const colors = brandColors.length > 0 ? brandColors : defaultBrandColors;

  // Load recent colors from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('aurora-recent-colors');
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load recent colors:', e);
      }
    }
  }, []);

  // Update local color when prop changes
  useEffect(() => {
    setLocalColor(value);
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle color change from native picker
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setLocalColor(newColor);
    onChange(newColor);
    addToRecentColors(newColor);
  };

  // Handle hex input change
  const handleHexChange = (e) => {
    let hex = e.target.value;
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    // Validate hex format
    if (/^#[0-9A-F]{0,6}$/i.test(hex)) {
      setLocalColor(hex);
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        onChange(hex);
        // Don't add to recents on every keystroke, only when complete
      }
    }
  };

  // Handle hex input blur (when user is done typing)
  const handleHexBlur = (e) => {
    let hex = e.target.value;
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      addToRecentColors(hex);
    }
  };

  // Add color to recent colors
  const addToRecentColors = (color) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== color);
      const updated = [color, ...filtered].slice(0, 7);
      localStorage.setItem('aurora-recent-colors', JSON.stringify(updated));
      return updated;
    });
  };

  // Select a preset color
  const selectPresetColor = (color) => {
    setLocalColor(color);
    onChange(color);
    addToRecentColors(color);
    setIsOpen(false);
  };

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(localColor);

  return (
    <div className={styles.colorPickerWrapper} ref={pickerRef}>
      {/* Color trigger button */}
      <div className={styles.colorInputGroup}>
        <button
          type="button"
          className={styles.colorSwatch}
          style={{ backgroundColor: localColor }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Choose ${label}`}
        >
          <span className={styles.colorSwatchInner} />
        </button>

        {showHexInput && (
          <input
            type="text"
            value={localColor.toUpperCase()}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            className={styles.hexInput}
            placeholder="#000000"
            maxLength={7}
          />
        )}
      </div>

      {/* Color picker dropdown */}
      {isOpen && (
        <div className={`${styles.colorPickerDropdown} ${styles[`position-${position}`]}`}>
          <div className={styles.pickerContent}>
            {/* Color Picker Section */}
            <div className={styles.pickerSection}>
              <div className={styles.pickerHeader}>
                <label className={styles.sectionLabel}>Color Picker</label>
                <button
                  type="button"
                  className={styles.eyedropperIcon}
                  onClick={async () => {
                    if ('EyeDropper' in window) {
                      try {
                        const eyeDropper = new window.EyeDropper();
                        const result = await eyeDropper.open();
                        setLocalColor(result.sRGBHex);
                        onChange(result.sRGBHex);
                        addToRecentColors(result.sRGBHex);
                        setIsOpen(false);
                      } catch (e) {
                        console.log('Eye dropper cancelled');
                      }
                    }
                  }}
                  title="Pick color from screen"
                >
                  <Pipette className="icon" size={14} />
                </button>
              </div>
              <div
                className={styles.colorCanvas}
                style={{ backgroundColor: localColor }}
                onClick={() => colorInputRef.current?.click()}
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  value={localColor}
                  onChange={handleColorChange}
                  className={styles.nativeColorInput}
                  style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* Recent Colors Section */}
            {recentColors.length > 0 && (
              <div className={styles.pickerSection}>
                <label className={styles.sectionLabel}>Recents</label>
                <div className={styles.colorGrid}>
                  {recentColors.map((color, index) => (
                    <button
                      key={`recent-${index}`}
                      type="button"
                      className={styles.colorGridItem}
                      style={{ backgroundColor: color }}
                      onClick={() => selectPresetColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Brand Colors Section */}
            <div className={styles.pickerSection}>
              <label className={styles.sectionLabel}>Brand Colors</label>
              <div className={styles.colorGrid}>
                {colors.map((color, index) => (
                  <button
                    key={`brand-${index}`}
                    type="button"
                    className={styles.colorGridItem}
                    style={{ backgroundColor: color }}
                    onClick={() => selectPresetColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
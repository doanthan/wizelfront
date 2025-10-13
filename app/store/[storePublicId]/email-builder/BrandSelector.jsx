"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Palette } from 'lucide-react';
import { useBrand } from './BrandContext';
import styles from './email-builder.module.css';

const BrandSelector = () => {
  const { selectedBrand, setSelectedBrand, availableBrands, isLoading } = useBrand();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (brand) => {
    setSelectedBrand(brand);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className={styles.brandSelector}>
        <button className={styles.brandSelectorButton} disabled>
          <Palette className="icon" style={{ width: '16px', height: '16px' }} />
          <span>Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.brandSelector} ref={dropdownRef}>
      <button
        className={styles.brandSelectorButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select brand"
        aria-expanded={isOpen}
      >
        <Palette className="icon" style={{ width: '16px', height: '16px' }} />
        <span>{selectedBrand?.brandName || 'Select Brand'}</span>
        <ChevronDown
          className="icon"
          style={{
            width: '16px',
            height: '16px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {isOpen && availableBrands.length > 0 && (
        <div className={styles.brandSelectorDropdown}>
          {availableBrands.map((brand) => {
            const isSelected = selectedBrand?.slug === brand.slug;

            return (
              <button
                key={brand.slug}
                className={`${styles.brandSelectorOption} ${
                  isSelected ? styles.brandSelectorOptionActive : ''
                }`}
                onClick={() => handleSelect(brand)}
              >
                <div className={styles.brandSelectorOptionContent}>
                  <div className={styles.brandSelectorOptionMain}>
                    <span className={styles.brandSelectorOptionName}>
                      {brand.brandName}
                    </span>
                    {brand.brandTagline && (
                      <span className={styles.brandSelectorOptionTagline}>
                        {brand.brandTagline}
                      </span>
                    )}
                  </div>
                  <div className={styles.brandSelectorColorSwatches}>
                    {brand.primaryColor?.[0]?.hex && (
                      <div
                        className={styles.brandSelectorColorSwatch}
                        style={{ backgroundColor: brand.primaryColor[0].hex }}
                        title={brand.primaryColor[0].name}
                      />
                    )}
                    {brand.secondaryColors?.slice(0, 2).map((color, idx) => (
                      <div
                        key={idx}
                        className={styles.brandSelectorColorSwatch}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <Check
                    className="icon"
                    style={{ width: '16px', height: '16px', color: '#007bff' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrandSelector;

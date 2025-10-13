"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const BrandContext = createContext();

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

export const BrandProvider = ({ children }) => {
  const params = useParams();
  const storePublicId = params?.storePublicId;

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load brand data from the store's brand settings
  useEffect(() => {
    const loadBrands = async () => {
      if (!storePublicId) {
        console.error('No storePublicId available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch brand settings from the store's API with credentials
        console.log('🔍 Fetching brand settings for store:', storePublicId);
        const response = await fetch(`/api/store/${storePublicId}/brand-settings`, {
          method: 'GET',
          credentials: 'include', // Include session cookies
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('📡 API Response Status:', response.status, response.statusText);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log('📄 Response Content-Type:', contentType);

        if (!contentType || !contentType.includes('application/json')) {
          console.warn('⚠️ Brand settings API returned non-JSON response');
          // Read the text to see what was returned
          const text = await response.text();
          console.log('📝 Response body preview:', text.substring(0, 200));
          throw new Error('Invalid response format - received HTML instead of JSON');
        }

        const data = await response.json();
        console.log('📦 API Response Data:', data);

        if (response.ok && data.success && data.brandSettings) {
          console.log('✅ Brand settings loaded from API:', data.brandSettings.brandName || 'Unnamed Brand');
          // Wrap in array since we have one brand per store
          const brands = [data.brandSettings];
          setAvailableBrands(brands);
          setSelectedBrand(data.brandSettings);
        } else {
          // API returned error or no brand settings
          console.log('⚠️ API returned error or no brand settings:', data.error || 'Unknown error');
          throw new Error(data.error || 'No brand settings');
        }
      } catch (error) {
        console.log('ℹ️ Loading fallback brand due to:', error.message);

        // Try fallback to sample brand
        try {
          const fallbackResponse = await fetch('/SampleBrand.json');
          const fallbackBrand = await fallbackResponse.json();
          const brands = [fallbackBrand];
          setAvailableBrands(brands);
          setSelectedBrand(fallbackBrand);
          console.log('✅ Fallback brand loaded successfully');
        } catch (fallbackError) {
          console.error('❌ Error loading fallback brand:', fallbackError);
          setAvailableBrands([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBrands();
  }, [storePublicId]);

  // Extract brand colors for color picker
  const getBrandColors = () => {
    if (!selectedBrand) {
      return [];
    }

    const colors = [];

    // Add primary color
    if (selectedBrand.primaryColor && selectedBrand.primaryColor.length > 0) {
      colors.push(selectedBrand.primaryColor[0].hex);
    }

    // Add secondary colors
    if (selectedBrand.secondaryColors && selectedBrand.secondaryColors.length > 0) {
      selectedBrand.secondaryColors.forEach(color => {
        colors.push(color.hex);
      });
    }

    // If we have fewer than 6 colors, add from CSS styles
    if (colors.length < 6 && selectedBrand.css?.colors) {
      const cssColors = selectedBrand.css.colors;

      // Add text colors
      if (cssColors.text && Array.isArray(cssColors.text)) {
        cssColors.text.forEach(color => {
          if (colors.length < 6 && !colors.includes(color)) {
            colors.push(color);
          }
        });
      }

      // Add background colors
      if (cssColors.background && Array.isArray(cssColors.background)) {
        cssColors.background.forEach(color => {
          if (colors.length < 6 && !colors.includes(color)) {
            colors.push(color);
          }
        });
      }
    }

    // Return first 6 colors
    return colors.slice(0, 6);
  };

  // Extract brand styles for easy access
  const getBrandStyles = () => {
    if (!selectedBrand || !selectedBrand.css) {
      return {
        primaryColor: '#007bff',
        textColor: '#2d3748',
        buttonBackgroundColor: '#007bff',
        buttonTextColor: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        buttonStyles: {},
        typographyStyles: {},
        brandColors: []
      };
    }

    const { css } = selectedBrand;

    return {
      primaryColor: selectedBrand.primaryColor?.[0]?.hex || '#007bff',
      textColor: selectedBrand.brandFontColor || '#2d3748',
      buttonBackgroundColor: selectedBrand.buttonBackgroundColor || '#ffffff',
      buttonTextColor: selectedBrand.buttonTextColor || '#212121',
      fontFamily: selectedBrand.customFontFamily
        ? `${selectedBrand.customFontFamily}, ${selectedBrand.emailFallbackFont || 'Arial'}, sans-serif`
        : selectedBrand.emailFallbackFont || 'Arial, Helvetica, sans-serif',
      buttonStyles: css.components?.button?.primary || {},
      typographyStyles: css.typography || {},
      buttonBorderRadius: selectedBrand.buttonBorderRadius || 4,
      buttonPadding: selectedBrand.buttonPadding || 12,
      colors: css.colors || {},
      emailOptimized: css.email?.optimized || {},
      brandColors: getBrandColors()
    };
  };

  // Apply brand styles to a block's default overrides
  const applyBrandToBlock = (blockType, defaultOverrides = {}) => {
    const brandStyles = getBrandStyles();

    switch (blockType) {
      case 'text':
      case 'headline':
      case 'paragraph':
        return {
          ...defaultOverrides,
          fontFamily: brandStyles.fontFamily,
          textColor: brandStyles.textColor,
          // Apply typography styles based on fontSize
          ...applyTypographyStyles(defaultOverrides.fontSize, brandStyles.typographyStyles),
        };

      case 'button':
        return {
          ...defaultOverrides,
          fontFamily: brandStyles.fontFamily,
          backgroundColor: brandStyles.buttonBackgroundColor,
          textColor: brandStyles.buttonTextColor,
          borderRadius: brandStyles.buttonBorderRadius,
          // Apply additional button styles from CSS
          ...parseButtonStyles(brandStyles.buttonStyles),
        };

      case 'section':
        return {
          ...defaultOverrides,
          // Apply brand background colors if not specified
          background: defaultOverrides.background === 'transparent'
            ? 'transparent'
            : defaultOverrides.background || brandStyles.colors?.background?.[0] || defaultOverrides.background,
        };

      default:
        return defaultOverrides;
    }
  };

  // Apply typography styles based on text size
  const applyTypographyStyles = (fontSize, typographyStyles) => {
    if (!typographyStyles || !fontSize) return {};

    // Map fontSize to appropriate heading level or paragraph
    let typographyKey = 'p';
    if (fontSize >= 36) typographyKey = 'h1';
    else if (fontSize >= 24) typographyKey = 'h2';
    else if (fontSize >= 18) typographyKey = 'h3';
    else if (fontSize >= 14) typographyKey = 'h4';

    const styles = typographyStyles[typographyKey];
    if (!styles) return {};

    const parsed = {};

    // Parse CSS properties to block properties
    if (styles['font-size']) {
      parsed.fontSize = parseInt(styles['font-size']);
    }
    if (styles['font-weight']) {
      parsed.fontWeight = styles['font-weight'];
    }
    if (styles['font-family']) {
      // Extract font family name
      parsed.fontFamily = styles['font-family'];
    }
    if (styles['line-height']) {
      // Parse line-height to a number
      const lineHeight = parseFloat(styles['line-height']);
      if (!isNaN(lineHeight)) {
        parsed.lineHeight = lineHeight / (parsed.fontSize || fontSize || 16);
      }
    }
    if (styles['letter-spacing']) {
      parsed.letterSpacing = parseFloat(styles['letter-spacing']);
    }
    if (styles['text-align']) {
      parsed.alignment = styles['text-align'];
    }
    if (styles.color) {
      parsed.textColor = styles.color;
    }

    return parsed;
  };

  // Apply brand styles to Quick Add blocks recursively
  const applyBrandToQuickAddBlocks = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) return blocks;

    return blocks.map(block => {
      // Apply brand styles to this block's overrides
      const brandedOverrides = applyBrandToBlock(block.type, block.overrides || {});

      // Recursively apply to children
      const brandedChildren = block.children
        ? applyBrandToQuickAddBlocks(block.children)
        : block.children;

      return {
        ...block,
        overrides: brandedOverrides,
        children: brandedChildren
      };
    });
  };

  const value = {
    selectedBrand,
    setSelectedBrand,
    availableBrands,
    isLoading,
    getBrandStyles,
    getBrandColors,
    applyBrandToBlock,
    applyBrandToQuickAddBlocks
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};

// Helper function to parse button styles from CSS object
function parseButtonStyles(buttonStyles) {
  if (!buttonStyles) return {};

  const parsed = {};

  // Extract common CSS properties that map to our button block properties
  if (buttonStyles['font-size']) {
    parsed.fontSize = parseInt(buttonStyles['font-size']);
  }
  if (buttonStyles['font-weight']) {
    parsed.fontWeight = buttonStyles['font-weight'];
  }
  if (buttonStyles['border-radius']) {
    // Handle values like "3.35544e+07px" by capping at reasonable max
    const radius = parseFloat(buttonStyles['border-radius']);
    parsed.borderRadius = Math.min(radius, 100); // Cap at 100px
  }
  if (buttonStyles.padding) {
    // Parse padding like "8px 16px" into buttonPaddingY and buttonPaddingX
    const paddingParts = buttonStyles.padding.split(' ');
    if (paddingParts.length === 2) {
      parsed.buttonPaddingY = parseInt(paddingParts[0]);
      parsed.buttonPaddingX = parseInt(paddingParts[1]);
    } else if (paddingParts.length === 1) {
      const padding = parseInt(paddingParts[0]);
      parsed.buttonPaddingY = padding;
      parsed.buttonPaddingX = padding;
    }
  }
  if (buttonStyles.border && buttonStyles.border !== 'none' && buttonStyles.border !== '0px') {
    const borderMatch = buttonStyles.border.match(/(\d+)px/);
    if (borderMatch) {
      parsed.borderWidth = parseInt(borderMatch[1]);
    }
    // Extract border color
    const colorMatch = buttonStyles.border.match(/rgb\([^)]+\)|#[0-9a-fA-F]{3,6}/);
    if (colorMatch) {
      parsed.borderColor = colorMatch[0];
    }
  }
  if (buttonStyles['background-color']) {
    parsed.backgroundColor = buttonStyles['background-color'];
  }
  if (buttonStyles.color) {
    parsed.textColor = buttonStyles.color;
  }
  if (buttonStyles['text-transform']) {
    parsed.textTransform = buttonStyles['text-transform'];
  }
  if (buttonStyles['letter-spacing']) {
    parsed.letterSpacing = parseFloat(buttonStyles['letter-spacing']);
  }

  return parsed;
}

export default BrandContext;

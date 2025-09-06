"use client";

import { useMemo } from 'react';

export function useBrandColors(selectedBrand) {
  return useMemo(() => {
    if (!selectedBrand) return [];

    const colors = [];
    
    // Extract colors from brand object
    if (selectedBrand.colors) {
      const brandColors = selectedBrand.colors;
      if (brandColors.primary) colors.push(brandColors.primary);
      if (brandColors.secondary) colors.push(brandColors.secondary);
      if (brandColors.accent) colors.push(brandColors.accent);
      if (brandColors.text) colors.push(brandColors.text);
      if (brandColors.background) colors.push(brandColors.background);
    }

    // Legacy support for individual color properties
    if (selectedBrand.primaryColor) colors.push(selectedBrand.primaryColor);
    if (selectedBrand.secondaryColor) colors.push(selectedBrand.secondaryColor);
    if (selectedBrand.accentColor) colors.push(selectedBrand.accentColor);
    if (selectedBrand.textColor) colors.push(selectedBrand.textColor);
    if (selectedBrand.backgroundColor) colors.push(selectedBrand.backgroundColor);

    // Remove duplicates and null/undefined values
    return [...new Set(colors.filter(Boolean))];
  }, [selectedBrand]);
}
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers for display in analytics with appropriate suffixes
 * - Numbers < 10,000: show as is with commas (e.g., 1,000 or 9,999)
 * - Numbers 10,000 - 999,999: show with K suffix (e.g., 12.5K)
 * - Numbers 1,000,000+: show with M suffix (e.g., 1.03M)
 * - Numbers 1,000,000,000+: show with B suffix (e.g., 2.45B)
 */
export function formatNumber(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }

  // Handle negative numbers
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  let result = '';

  if (absValue >= 1000000000) {
    // Billions
    result = `${(absValue / 1000000000).toFixed(2).replace(/\.?0+$/, '')}B`;
  } else if (absValue >= 1000000) {
    // Millions
    result = `${(absValue / 1000000).toFixed(2).replace(/\.?0+$/, '')}M`;
  } else if (absValue >= 10000) {
    // Ten thousands and up - use K notation
    result = `${(absValue / 1000).toFixed(1).replace(/\.?0+$/, '')}K`;
  } else {
    // Less than 10,000 - show as formatted integer with commas
    result = Math.round(absValue).toLocaleString();
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format currency values with appropriate suffixes
 * - Small amounts < $10,000: show as is (e.g., $1,234 or $9,999)
 * - $10,000 - $999,999: show with K suffix (e.g., $12.5K)
 * - $1,000,000+: show with M suffix (e.g., $1.03M)
 * - $1,000,000,000+: show with B suffix (e.g., $2.45B)
 */
export function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '$0';
  }

  // Handle negative numbers
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  let result = '';

  if (absValue >= 1000000000) {
    // Billions
    result = `$${(absValue / 1000000000).toFixed(2).replace(/\.?0+$/, '')}B`;
  } else if (absValue >= 1000000) {
    // Millions
    result = `$${(absValue / 1000000).toFixed(2).replace(/\.?0+$/, '')}M`;
  } else if (absValue >= 10000) {
    // Ten thousands and up - use K notation
    result = `$${(absValue / 1000).toFixed(1).replace(/\.?0+$/, '')}K`;
  } else {
    // Less than 10,000 - show as formatted currency with commas
    result = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: absValue < 100 ? 2 : 0,
      maximumFractionDigits: absValue < 100 ? 2 : 0
    }).format(absValue);
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format percentage values
 * Handles both decimal (0.55) and percentage (55) formats
 */
export function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  // If value is less than 1, assume it's in decimal format (0.55 = 55%)
  // If value is 1 or greater, assume it's already in percentage format (55 = 55%)
  const percentageValue = value < 1 ? value * 100 : value;

  return `${percentageValue.toFixed(1)}%`;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage change with sign
 */
export function formatPercentageChange(change) {
  if (change === 0) return "0%";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
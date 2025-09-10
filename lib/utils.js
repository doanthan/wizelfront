import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers for display in analytics with appropriate suffixes
 * - Numbers < 1,000: show as is (e.g., 856)
 * - Numbers 1,000 - 999,999: show with K suffix (e.g., 1.2K)
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
  } else if (absValue >= 1000) {
    // Thousands
    result = `${(absValue / 1000).toFixed(1).replace(/\.?0+$/, '')}K`;
  } else {
    // Less than 1000 - show as integer
    result = Math.round(absValue).toLocaleString();
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format currency values with appropriate suffixes
 * - Small amounts: $12.34
 * - Large amounts: $1.03M, $2.45B
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
  } else if (absValue >= 1000) {
    // Thousands
    result = `$${(absValue / 1000).toFixed(1).replace(/\.?0+$/, '')}K`;
  } else {
    // Less than 1000 - show with cents
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
 */
export function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
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
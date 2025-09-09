/**
 * Calendar Store Color System
 * 50 distinct pastel colors for store color coding
 */

// 50 Distinct Pastel Colors with good contrast
export const PASTEL_COLORS = [
  // Pink/Rose shades
  { name: 'Rose', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900', hex: '#ffe4e6' },
  { name: 'Pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900', hex: '#fce7f3' },
  { name: 'Fuchsia', bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-900', hex: '#fae8ff' },
  
  // Purple shades
  { name: 'Purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', hex: '#f3e8ff' },
  { name: 'Violet', bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-900', hex: '#ede9fe' },
  { name: 'Indigo', bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', hex: '#e0e7ff' },
  
  // Blue shades
  { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', hex: '#dbeafe' },
  { name: 'Sky', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-900', hex: '#e0f2fe' },
  { name: 'Cyan', bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900', hex: '#cffafe' },
  
  // Green shades
  { name: 'Teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', hex: '#ccfbf1' },
  { name: 'Emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', hex: '#d1fae5' },
  { name: 'Green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', hex: '#dcfce7' },
  { name: 'Lime', bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-900', hex: '#ecfccb' },
  
  // Yellow/Orange shades
  { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', hex: '#fef3c7' },
  { name: 'Amber', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', hex: '#fed7aa' },
  { name: 'Orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', hex: '#ffedd5' },
  { name: 'Red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', hex: '#fee2e2' },
  
  // Lighter variations with mix
  { name: 'Blush', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', hex: '#fff1f2' },
  { name: 'Lavender', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', hex: '#faf5ff' },
  { name: 'Periwinkle', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', hex: '#eef2ff' },
  { name: 'Powder Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', hex: '#eff6ff' },
  { name: 'Mint', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', hex: '#f0fdf4' },
  { name: 'Cream', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', hex: '#fefce8' },
  { name: 'Peach', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', hex: '#fff7ed' },
  
  // Gradient-like pastels (using Tailwind's intermediate shades)
  { name: 'Coral', bg: 'bg-red-200/50', border: 'border-red-300', text: 'text-red-900', hex: '#fecaca' },
  { name: 'Salmon', bg: 'bg-rose-200/50', border: 'border-rose-400', text: 'text-rose-900', hex: '#fbbf24' },
  { name: 'Mauve', bg: 'bg-purple-200/50', border: 'border-purple-400', text: 'text-purple-900', hex: '#e9d5ff' },
  { name: 'Lilac', bg: 'bg-violet-200/50', border: 'border-violet-400', text: 'text-violet-900', hex: '#ddd6fe' },
  { name: 'Azure', bg: 'bg-sky-200/50', border: 'border-sky-400', text: 'text-sky-900', hex: '#bae6fd' },
  { name: 'Aqua', bg: 'bg-cyan-200/50', border: 'border-cyan-400', text: 'text-cyan-900', hex: '#a5f3fc' },
  { name: 'Seafoam', bg: 'bg-teal-200/50', border: 'border-teal-400', text: 'text-teal-900', hex: '#99f6e4' },
  { name: 'Jade', bg: 'bg-emerald-200/50', border: 'border-emerald-400', text: 'text-emerald-900', hex: '#a7f3d0' },
  { name: 'Sage', bg: 'bg-green-200/50', border: 'border-green-400', text: 'text-green-900', hex: '#bbf7d0' },
  { name: 'Chartreuse', bg: 'bg-lime-200/50', border: 'border-lime-400', text: 'text-lime-900', hex: '#d9f99d' },
  { name: 'Honey', bg: 'bg-amber-200/50', border: 'border-amber-400', text: 'text-amber-900', hex: '#fde68a' },
  
  // Unique mixed pastels
  { name: 'Dusty Rose', bg: 'bg-pink-200/60', border: 'border-pink-400', text: 'text-pink-900', hex: '#fbcfe8' },
  { name: 'Orchid', bg: 'bg-fuchsia-200/60', border: 'border-fuchsia-400', text: 'text-fuchsia-900', hex: '#f0abfc' },
  { name: 'Wisteria', bg: 'bg-purple-200/60', border: 'border-purple-500', text: 'text-purple-900', hex: '#d8b4fe' },
  { name: 'Iris', bg: 'bg-violet-200/60', border: 'border-violet-500', text: 'text-violet-900', hex: '#c4b5fd' },
  { name: 'Cornflower', bg: 'bg-blue-200/60', border: 'border-blue-500', text: 'text-blue-900', hex: '#bfdbfe' },
  { name: 'Turquoise', bg: 'bg-cyan-200/60', border: 'border-cyan-500', text: 'text-cyan-900', hex: '#67e8f9' },
  { name: 'Pistachio', bg: 'bg-green-200/60', border: 'border-green-500', text: 'text-green-900', hex: '#86efac' },
  { name: 'Lemon', bg: 'bg-yellow-200/60', border: 'border-yellow-500', text: 'text-yellow-900', hex: '#fde047' },
  { name: 'Apricot', bg: 'bg-orange-200/60', border: 'border-orange-500', text: 'text-orange-900', hex: '#fdba74' },
  { name: 'Tangerine', bg: 'bg-amber-200/70', border: 'border-amber-500', text: 'text-amber-900', hex: '#fbbf24' },
  
  // Final unique shades
  { name: 'Pearl', bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-900', hex: '#f3f4f6' },
  { name: 'Opal', bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-900', hex: '#f1f5f9' },
  { name: 'Misty Rose', bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-800', hex: '#fdf2f8' },
  { name: 'Cloud', bg: 'bg-blue-50/70', border: 'border-blue-300', text: 'text-blue-800', hex: '#e0f2fe' },
];

// Store a mapping of store IDs to color indices
const storeColorMap = new Map();
let nextColorIndex = 0;

/**
 * Get a consistent color for a store ID
 * @param {string} storeId - The store ID or klaviyo_public_id
 * @returns {Object} Color object with bg, border, text, and hex properties
 */
export function getStoreColor(storeId) {
  if (!storeId) {
    return PASTEL_COLORS[0]; // Default to first color
  }

  // Check if we already have a color for this store
  if (storeColorMap.has(storeId)) {
    return PASTEL_COLORS[storeColorMap.get(storeId)];
  }

  // Assign a new color
  const colorIndex = nextColorIndex % PASTEL_COLORS.length;
  storeColorMap.set(storeId, colorIndex);
  nextColorIndex++;

  return PASTEL_COLORS[colorIndex];
}

/**
 * Get color by index
 * @param {number} index - Color index
 * @returns {Object} Color object
 */
export function getColorByIndex(index) {
  return PASTEL_COLORS[index % PASTEL_COLORS.length];
}

/**
 * Reset color assignments (useful when stores change)
 */
export function resetColorAssignments() {
  storeColorMap.clear();
  nextColorIndex = 0;
}

/**
 * Get all colors for legend display
 * @returns {Array} All pastel colors
 */
export function getAllColors() {
  return PASTEL_COLORS;
}

/**
 * Get color assignments for current stores
 * @param {Array} stores - Array of store objects
 * @returns {Array} Array of store-color pairs
 */
export function getStoreColorAssignments(stores) {
  return stores.map(store => {
    const storeId = store.klaviyo_integration?.public_id || store.public_id || store.id || store._id;
    return {
      store,
      color: getStoreColor(storeId)
    };
  });
}
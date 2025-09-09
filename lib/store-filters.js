/**
 * Store filter utilities for sharing selected stores across components
 * Used by Calendar and Multi-Account Reporting
 */

/**
 * Get selected stores from localStorage
 * @returns {Array<string>} Array of selected store public_ids
 */
export function getSelectedStores() {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem('selectedStores');
    if (saved) {
      const stores = JSON.parse(saved);
      if (Array.isArray(stores)) {
        return stores;
      }
    }
  } catch (error) {
    console.error('Error reading selected stores from localStorage:', error);
  }
  
  return [];
}

/**
 * Save selected stores to localStorage
 * @param {Array<string>} stores - Array of store public_ids
 */
export function saveSelectedStores(stores) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('selectedStores', JSON.stringify(stores));
  } catch (error) {
    console.error('Error saving selected stores to localStorage:', error);
  }
}

/**
 * Clear selected stores from localStorage
 */
export function clearSelectedStores() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('selectedStores');
  } catch (error) {
    console.error('Error clearing selected stores from localStorage:', error);
  }
}

/**
 * Check if viewing all stores (no filter applied)
 * @param {Array<string>} selectedStores - Array of selected store public_ids
 * @returns {boolean} True if viewing all stores
 */
export function isViewingAllStores(selectedStores) {
  return !selectedStores || selectedStores.length === 0;
}

/**
 * Get display text for selected stores
 * @param {Array<string>} selectedStores - Array of selected store public_ids
 * @param {Array<Object>} allStores - Array of all store objects
 * @returns {string} Display text for the filter
 */
export function getStoreFilterDisplayText(selectedStores, allStores) {
  if (isViewingAllStores(selectedStores)) {
    return 'View All Stores';
  }
  
  if (selectedStores.length === 1) {
    const store = allStores.find(s => 
      s.public_id === selectedStores[0] || 
      s.id === selectedStores[0] || 
      s._id === selectedStores[0]
    );
    return store?.name || '1 Store';
  }
  
  return `${selectedStores.length} Stores`;
}

/**
 * Map selected store public_ids to Klaviyo public_ids
 * @param {Array<string>} selectedStores - Array of selected store public_ids
 * @param {Array<Object>} allStores - Array of all store objects
 * @returns {Array<string>} Array of Klaviyo public_ids
 */
export function mapToKlaviyoIds(selectedStores, allStores) {
  if (isViewingAllStores(selectedStores)) {
    // Return all Klaviyo IDs when viewing all stores
    return allStores
      .map(s => s.klaviyo_integration?.public_id)
      .filter(Boolean);
  }
  
  return selectedStores
    .map(storeId => {
      const store = allStores.find(s => 
        s.public_id === storeId || 
        s.id === storeId || 
        s._id === storeId
      );
      return store?.klaviyo_integration?.public_id;
    })
    .filter(Boolean);
}

/**
 * Subscribe to store filter changes
 * @param {Function} callback - Function to call when filter changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToStoreFilterChanges(callback) {
  if (typeof window === 'undefined') return () => {};
  
  const handleStorageChange = (e) => {
    if (e.key === 'selectedStores') {
      try {
        const newValue = e.newValue ? JSON.parse(e.newValue) : [];
        callback(newValue);
      } catch (error) {
        console.error('Error parsing store filter change:', error);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
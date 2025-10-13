export const createId = () => {
  return Math.random().toString(36).substring(2, 10);
};

export const createBlock = (type, overrides = {}) => {
  // Import library here to avoid circular dependency issues
  const { library } = require('./constants');

  // Find the default overrides for this block type
  const libraryItem = library.find(item => item.type === type);
  const defaultOverrides = libraryItem?.defaultOverrides || {};

  const block = {
    id: createId(),
    type,
    ...defaultOverrides,
    ...overrides
  };

  return block;
};

export const assignDragData = (event, payload) => {
  event.dataTransfer.setData("application/x-aurora-block", JSON.stringify(payload));
};

export const extractDragData = (event) => {
  try {
    const data = event.dataTransfer.getData("application/x-aurora-block");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const groupLibraryByCategory = (library, categoryOrder) => {
  return categoryOrder.map((category) => ({
    category,
    items: library.filter((item) => item.category === category)
  })).filter((group) => group.items.length > 0);
};
import mongoose from 'mongoose';

// Prevent duplicate model compilation in development
// This is a common issue with Next.js hot module replacement

class ModelRegistry {
  constructor() {
    this.models = {};
  }

  // Register a model with duplicate check
  registerModel(name, schema) {
    // Check if model already exists in mongoose.models
    if (mongoose.models && mongoose.models[name]) {
      return mongoose.models[name];
    }

    // Check if model exists in our registry
    if (this.models[name]) {
      return this.models[name];
    }

    // Remove duplicate indexes in development to prevent warnings
    if (process.env.NODE_ENV === 'development') {
      // Get all indexes that will be created
      const indexes = schema.indexes();
      const indexMap = new Map();
      
      // Check for duplicates
      indexes.forEach((index) => {
        const key = JSON.stringify(index[0]);
        if (!indexMap.has(key)) {
          indexMap.set(key, index);
        }
      });
      
      // Clear all indexes and re-add unique ones
      schema.clearIndexes();
      indexMap.forEach((index) => {
        schema.index(index[0], index[1] || {});
      });
    }

    // Create and register the model
    const model = mongoose.model(name, schema);
    this.models[name] = model;
    
    return model;
  }

  // Clear all registered models (useful for testing)
  clearAll() {
    this.models = {};
    // Also clear mongoose models
    if (mongoose.models) {
      Object.keys(mongoose.models).forEach(key => {
        delete mongoose.models[key];
      });
    }
  }
}

// Export singleton instance
const modelRegistry = new ModelRegistry();
export default modelRegistry;
// Helper to prevent duplicate model compilation in development
// This is a common issue with Next.js hot reloading

const modelCache = {};

export function getModel(name, schema) {
  // If model already exists in Mongoose, return it
  if (mongoose.models[name]) {
    return mongoose.models[name];
  }
  
  // If model exists in our cache, return it
  if (modelCache[name]) {
    return modelCache[name];
  }
  
  // Otherwise, compile and cache the model
  const model = mongoose.model(name, schema);
  modelCache[name] = model;
  return model;
}

// Clear duplicate index warnings by checking if indexes already exist
export function preventDuplicateIndexes(schema) {
  // Remove automatic index creation in development
  if (process.env.NODE_ENV === 'development') {
    schema.set('autoIndex', false);
  }
  return schema;
}
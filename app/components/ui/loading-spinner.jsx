"use client";

// Re-export loaders from the main loading file
export { default as MorphingLoader, InlineLoader } from './loading';

// Alias for backward compatibility
export const InlineLoading = ({ text, ...props }) => {
  const { InlineLoader } = require('./loading');
  return <InlineLoader showText={!!text} text={text} {...props} />;
};

// Default export for backward compatibility
export { default } from './loading';
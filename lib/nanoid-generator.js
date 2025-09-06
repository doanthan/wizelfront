import { customAlphabet } from 'nanoid';

// Create custom nanoid with only alphanumeric characters (no hyphens or underscores)
const nanoidAlphanumeric = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');

/**
 * Generate a custom alphanumeric ID with specified length
 * @param {number} length - Length of the ID to generate
 * @returns {Promise<string>} - Generated alphanumeric ID
 */
export async function generateNanoid(length = 7) {
  return nanoidAlphanumeric(length);
}

/**
 * Generate a store public ID (7 alphanumeric characters)
 * @returns {Promise<string>} - Generated store ID
 */
export async function generateStoreId() {
  return nanoidAlphanumeric(7);
}

/**
 * Generate a contract public ID (12 alphanumeric characters)
 * @returns {Promise<string>} - Generated contract ID
 */
export async function generateContractId() {
  return nanoidAlphanumeric(12);
}
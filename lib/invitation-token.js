import crypto from 'crypto';

/**
 * Generate a secure invitation token
 * @returns {string} - 64-character hex token
 */
export function generateInvitationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash an invitation token for storage
 * @param {string} token - Plain token
 * @returns {string} - SHA256 hash of token
 */
export function hashInvitationToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate token expiration date (7 days from now)
 * @returns {Date} - Expiration date
 */
export function getTokenExpiration() {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7); // 7 days
  return expirationDate;
}

/**
 * Check if a token is expired
 * @param {Date} expiresAt - Token expiration date
 * @returns {boolean} - True if expired
 */
export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
}

/**
 * Generate a complete invitation token object
 * @returns {Object} - { token, hashedToken, expiresAt }
 */
export function createInvitationToken() {
  const token = generateInvitationToken();
  const hashedToken = hashInvitationToken(token);
  const expiresAt = getTokenExpiration();

  return {
    token,           // Plain token (send in email, don't store)
    hashedToken,     // Hashed token (store in database)
    expiresAt        // Expiration date
  };
}

/**
 * Validate a token against stored hash
 * @param {string} token - Plain token from user
 * @param {string} storedHash - Hash from database
 * @param {Date} expiresAt - Token expiration date
 * @returns {Object} - { valid: boolean, reason?: string }
 */
export function validateInvitationToken(token, storedHash, expiresAt) {
  if (!token || !storedHash) {
    return { valid: false, reason: 'Invalid token' };
  }

  if (isTokenExpired(expiresAt)) {
    return { valid: false, reason: 'Token expired' };
  }

  const hashedToken = hashInvitationToken(token);

  if (hashedToken !== storedHash) {
    return { valid: false, reason: 'Token mismatch' };
  }

  return { valid: true };
}

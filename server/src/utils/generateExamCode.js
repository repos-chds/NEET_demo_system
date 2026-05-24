const crypto = require('crypto');

/**
 * Generate a unique 6-character alphanumeric exam code
 * Uppercase only for easy sharing
 */
function generateExamCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

module.exports = generateExamCode;

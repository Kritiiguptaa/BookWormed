/**
 * Input Sanitization Utility
 * Prevents XSS attacks by escaping HTML special characters
 */

/**
 * Sanitize string input by escaping HTML special characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string safe for display
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize object fields recursively
 * @param {object} obj - Object with string fields to sanitize
 * @param {array} fields - Array of field names to sanitize
 * @returns {object} - Object with sanitized fields
 */
export const sanitizeObject = (obj, fields) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  fields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeInput(sanitized[field]);
    }
  });
  
  return sanitized;
};

/**
 * Validate and sanitize text content
 * Removes potentially dangerous patterns while preserving readability
 * @param {string} text - The text to validate and sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {object} - { valid: boolean, sanitized: string, error: string }
 */
export const validateAndSanitizeText = (text, maxLength = 5000) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, sanitized: '', error: 'Text must be a string' };
  }

  // Remove leading/trailing whitespace
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Text cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, sanitized: '', error: `Text exceeds maximum length of ${maxLength} characters` };
  }

  // Check for dangerous patterns (script tags, event handlers, etc.)
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<iframe/gi,
    /<embed/gi,
    /<object/gi
  ];

  let hasDangerousContent = false;
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(trimmed)) {
      hasDangerousContent = true;
    }
  });

  if (hasDangerousContent) {
    // Sanitize by escaping HTML
    const sanitized = sanitizeInput(trimmed);
    return { valid: true, sanitized, error: null };
  }

  // Text is safe, no HTML to escape
  return { valid: true, sanitized: trimmed, error: null };
};

/**
 * Sanitize search query to prevent SQL/NoSQL injection
 * @param {string} query - Search query string
 * @returns {string} - Sanitized query
 */
export const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return '';
  
  // Remove special regex characters that could cause ReDoS
  // Allow alphanumeric, spaces, and common punctuation
  return query
    .trim()
    .slice(0, 200) // Limit length
    .replace(/[^\w\s\-.,!?@#]/g, ''); // Remove special chars except safe ones
};

export default {
  sanitizeInput,
  sanitizeObject,
  validateAndSanitizeText,
  sanitizeSearchQuery
};

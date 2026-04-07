/**
 * utils/helpers.js
 * Shared utility functions across the backend
 */

/**
 * Convert kg CO2e → tCO2e
 */
function kgToTonnes(kg) {
  return kg / 1000;
}

/**
 * Format large INR numbers → Crore / Lakh
 */
function formatINR(amount) {
  if (!amount || isNaN(amount)) return '₹0';
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toFixed(0)}`;
}

/**
 * Round to specified decimal places
 */
function round(val, decimals = 2) {
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}

/**
 * Safe parse float — returns 0 if invalid
 */
function safeFloat(val, fallback = 0) {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safe parse int — returns fallback if invalid
 */
function safeInt(val, fallback = 0) {
  const parsed = parseInt(val);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Calculate percentage
 */
function percentage(part, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, (part / total) * 100);
}

/**
 * Generate unique report ID
 */
function generateReportId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CCR-${ts}-${rand}`;
}

/**
 * Normalize state name for lookup
 */
function normalizeState(state) {
  if (!state) return 'default';
  return state.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Build a structured API response envelope
 */
function apiResponse(res, data, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: statusCode < 400,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}

/**
 * Build an error response
 */
function apiError(res, message, statusCode = 400, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  kgToTonnes,
  formatINR,
  round,
  safeFloat,
  safeInt,
  percentage,
  generateReportId,
  normalizeState,
  deepMerge,
  apiResponse,
  apiError
};

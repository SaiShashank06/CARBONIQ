/**
 * middleware/errorHandler.js
 * Centralized error handling for all routes
 */

const config = require('../config');

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isDev = config.server.isDev;

  console.error(`[ERROR] ${req.method} ${req.path} → ${status}: ${err.message}`);
  if (isDev && err.stack) console.error(err.stack);

  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, notFoundHandler, asyncHandler };

/**
 * middleware/rateLimiter.js
 * In-memory rate limiting middleware (no external dependency)
 */

const config = require('../config');

const requests = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, data] of requests.entries()) {
    if (now - data.windowStart > config.rateLimit.windowMs) {
      requests.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const { windowMs, max } = config.rateLimit;

  let data = requests.get(ip);

  if (!data || now - data.windowStart > windowMs) {
    data = { count: 1, windowStart: now };
    requests.set(ip, data);
    return next();
  }

  data.count++;

  if (data.count > max) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((windowMs - (now - data.windowStart)) / 1000)
    });
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', max);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, max - data.count));
  res.setHeader('X-RateLimit-Reset', new Date(data.windowStart + windowMs).toISOString());

  next();
}

module.exports = rateLimiter;

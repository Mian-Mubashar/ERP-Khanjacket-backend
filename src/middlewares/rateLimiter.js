const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Global API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.badRequest('Too many requests from this IP, please try again later.', [], 429));
  }
});

/**
 * Strict Rate Limiter for Authentication / Login endpoints
 */
const authLimiter = rateLimit({
  windowMs: config.security.authRateLimitWindowMs,
  max: config.security.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};

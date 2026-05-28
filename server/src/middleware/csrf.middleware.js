/**
 * CSRF protection middleware.
 * Skips CSRF check for public auth routes.
 * @module middleware/csrf
 */
const crypto = require('crypto');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Routes that do NOT require CSRF (relative to /api mount point)
const CSRF_WHITELIST = [
  '/v1/auth/login',
  '/v1/auth/refresh',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/csrf-token',
];

/**
 * Generate a CSRF token and set it as a cookie.
 */
function generateCsrfToken(req, res, next) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 * 1000, // 1 hour
  });
  req.csrfToken = token;
  next();
}

/**
 * Verify CSRF token for state-changing methods (POST, PUT, PATCH, DELETE),
 * unless the request path is whitelisted.
 */
function csrfProtection(req, res, next) {
  // Whitelisted paths – skip CSRF
  if (CSRF_WHITELIST.includes(req.path)) {
    return next();
  }

  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!methods.includes(req.method)) {
    return next();
  }

  const tokenFromCookie = req.cookies && req.cookies['csrf-token'];
  const tokenFromHeader = req.headers['x-csrf-token'];

  if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
    logger.warn(`CSRF validation failed for ${req.path}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }
  next();
}

module.exports = { generateCsrfToken, csrfProtection };
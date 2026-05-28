/**
 * Global error handling middleware.
 * Catches all errors and returns a consistent JSON envelope.
 * @module middleware/errorHandler
 */
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Express error‑handler (must have 4 parameters).
 */
function errorHandler(err, req, res, next) {
  // Default status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';


  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = `Validation failed: ${messages.join(', ')}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}. Please use another value.`;
  }

  // Handle JWT errors (caught by auth middleware but just in case)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Log full error in development, minimal in production
  if (process.env.NODE_ENV === 'development') {
    logger.error(`[${req.method}] ${req.originalUrl} - ${err.stack}`);
  } else {
    logger.error(`[${req.method}] ${req.originalUrl} - ${message}`);
  }

  // Operational errors (trusted) – send full message
  if (err instanceof AppError) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // Programming or unknown errors – don't leak details in production
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

module.exports = errorHandler;
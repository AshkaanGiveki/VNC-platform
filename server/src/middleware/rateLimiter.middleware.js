/**
 * Rate limiting middleware using express-rate-limit with Redis store.
 * @module middleware/rateLimiter
 */
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');  // ← named export
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

/**
 * Strict limiter for authentication routes: 5 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later',
    });
  },
});

module.exports = { globalLimiter, authLimiter };
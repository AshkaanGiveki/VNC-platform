/**
 * Redis client setup using ioredis.
 * Provides a shared Redis instance with connection handling,
 * compatible with Bull queues (no enableReadyCheck, maxRetriesPerRequest null).
 * @module config/redis
 */
const Redis = require('ioredis');
const logger = require('../utils/logger');
const env = require('./env');

/**
 * Create Redis client with retry strategy.
 * @returns {Redis} Configured ioredis client.
 */
function createRedisClient() {
  const client = new Redis(env.redis.url, {
    maxRetriesPerRequest: null, // Required for Bull
    enableReadyCheck: false,    // Required for Bull
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'CONNECTION_BROKEN'];
      if (targetErrors.some((e) => err.message.includes(e))) {
        return true;
      }
      return false;
    },
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (err) => {
    logger.error(`Redis client error: ${err.message}`);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
}

// Singleton instance
const redisClient = createRedisClient();

module.exports = redisClient;
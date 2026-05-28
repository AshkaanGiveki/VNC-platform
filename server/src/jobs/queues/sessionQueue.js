/**
 * Session Bull queue – used for deferred session lifecycle jobs.
 * e.g., auto‑stop after maxSessionDuration, retry launching, etc.
 * @module jobs/queues/sessionQueue
 */
const Bull = require('bull');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');

// Redis connection reused from the existing client (Bull accepts ioredis instance)
const sessionQueue = new Bull('session-queue', {
  createClient: (type) => {
    switch (type) {
      case 'client':
        return redisClient;
      case 'subscriber':
        return redisClient.duplicate();
      default:
        return redisClient.duplicate();
    }
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Listeners
sessionQueue.on('error', (err) => {
  logger.error(`Session queue error: ${err.message}`);
});

sessionQueue.on('failed', (job, err) => {
  logger.error(`Session job ${job.id} failed: ${err.message}`);
});

/**
 * Get the queue instance (useful for adding jobs from services).
 * @returns {Bull.Queue}
 */
function getQueue() {
  return sessionQueue;
}

module.exports = { getQueue };
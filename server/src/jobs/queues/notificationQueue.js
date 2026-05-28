/**
 * Notification Bull queue – used for sending batched or delayed notifications (email/push).
 * @module jobs/queues/notificationQueue
 */
const Bull = require('bull');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');

const notificationQueue = new Bull('notification-queue', {
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
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

notificationQueue.on('error', (err) => {
  logger.error(`Notification queue error: ${err.message}`);
});

function getQueue() {
  return notificationQueue;
}

module.exports = { getQueue };
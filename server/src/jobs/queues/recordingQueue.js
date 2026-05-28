/**
 * Recording Bull queue – used for processing session recordings (start/stop capture, transcode).
 * @module jobs/queues/recordingQueue
 */
const Bull = require('bull');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');

const recordingQueue = new Bull('recording-queue', {
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
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

recordingQueue.on('error', (err) => {
  logger.error(`Recording queue error: ${err.message}`);
});

function getQueue() {
  return recordingQueue;
}

module.exports = { getQueue };
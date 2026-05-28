/**
 * Scheduler – sets up repeatable cron‑like jobs using Bull.
 * Runs maintenance tasks: clean expired tokens from Redis, archive old logs, etc.
 * @module jobs/scheduler
 */
const { getQueue: getSessionQueue } = require('./queues/sessionQueue');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const Log = require('../models/Log');

/**
 * Initialise all repeatable jobs.
 */
async function initScheduler() {
  // Clean expired tokens from Redis blacklist (already auto‑expire, but we can remove stale keys if needed)
  // Not strictly necessary, but we can add a job that scans and cleans old keys.

  // Example: Delete logs older than 90 days (run daily)
  const logCleanupJob = async () => {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const result = await Log.deleteMany({ timestamp: { $lt: ninetyDaysAgo } });
      if (result.deletedCount > 0) {
        logger.info(`Log cleanup: removed ${result.deletedCount} old log entries`);
      }
    } catch (err) {
      logger.error(`Log cleanup job failed: ${err.message}`);
    }
  };

  // Run cleanup every 24 hours
  setInterval(logCleanupJob, 24 * 60 * 60 * 1000);

  // Optionally, we could also clean orphaned session files, etc.
  logger.info('Scheduler initialised');
}

module.exports = { initScheduler };
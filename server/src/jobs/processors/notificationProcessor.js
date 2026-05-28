/**
 * Notification queue processor – handles email/push delivery via external services.
 * Currently a placeholder; production would integrate with SendGrid, SES, etc.
 * @module jobs/processors/notificationProcessor
 */
const { getQueue } = require('../queues/notificationQueue');
const logger = require('../../utils/logger');

function registerProcessors() {
  const queue = getQueue();

  queue.process('sendEmail', async (job) => {
    const { userId, subject, body } = job.data;
    logger.info(`Processing email notification for user ${userId}`);

    try {
      // TODO: Integrate with email provider
      // await emailService.send({ to: user.email, subject, body });
      logger.debug(`Email sent to user ${userId} (simulated)`);
    } catch (err) {
      logger.error(`Email notification failed for user ${userId}: ${err.message}`);
      throw err;
    }
  });

  // Additional job types (push notifications, etc.) can be added here.
}

module.exports = { registerProcessors };
/**
 * Session queue processor – handles session auto‑stop and retry logic.
 * @module jobs/processors/sessionProcessor
 */
const { getQueue } = require('../queues/sessionQueue');
const sessionService = require('../../services/session.service');
const logger = require('../../utils/logger');

/**
 * Register job processors on the session queue.
 */
function registerProcessors() {
  const queue = getQueue();

  // Auto‑stop a session after maxSessionDuration expires
  queue.process('autoStopSession', async (job) => {
    const { sessionId } = job.data;
    logger.info(`Auto‑stop job triggered for session ${sessionId}`);

    try {
      // We need a way to call stopSession with an admin context.
      // Since this is system‑initiated, we can fetch the session and user details.
      const Session = require('../../models/Session');
      const session = await Session.findById(sessionId);

      if (!session || session.status === 'stopped') {
        logger.info(`Session ${sessionId} already stopped or not found`);
        return;
      }

      // We'll call sessionService.stopSession with a minimal user object representing system
      await sessionService.stopSession({
        user: { userId: session.userId, role: 'system' }, // system role bypasses user check? Need to ensure stopSession allows.
        sessionId,
        ip: 'system',
      });

      logger.info(`Session ${sessionId} auto‑stopped successfully`);
    } catch (err) {
      logger.error(`Auto‑stop session ${sessionId} failed: ${err.message}`);
      throw err; // let Bull retry
    }
  });

  // Could add a retry launch processor in future.
}

module.exports = { registerProcessors };
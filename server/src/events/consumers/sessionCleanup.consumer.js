/**
 * Session cleanup consumer – listens for session.stopped events and performs cleanup tasks:
 * - Release container resources
 * - Initiate file cleanup if policy doesn't allow persistence
 * - Trigger recording stop if necessary
 * @module events/consumers/sessionCleanup
 */
const { getChannel } = require('../../config/rabbitmq');
const logger = require('../../utils/logger');
const containerService = require('../../services/container.service');

const EXCHANGE = 'sessions';
const QUEUE = 'session_cleanup';
const ROUTING_KEY = 'session.*';

async function start() {
  try {
    const channel = getChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      const content = JSON.parse(msg.content.toString());

      logger.info(`Session cleanup: processing ${routingKey}`);

      try {
        if (routingKey === 'session.stopped') {
          const { sessionId, containerId, policySnapshot } = content;

          // Ensure container is removed if still present
          if (containerId) {
            await containerService.deleteContainer(containerId);
          }

          // If file persistence is off, publish a file cleanup event (or do it here)
          if (policySnapshot && !policySnapshot.filePersistence) {
            // Publish to sessions exchange for file cleanup (or we could call file service directly)
            channel.publish(EXCHANGE, 'session.cleanup.files', Buffer.from(JSON.stringify({ sessionId })), {
              persistent: true,
            });
          }

          // Trigger recording stop if not already done (but recording service may already handle)
          channel.publish('recordings', 'recording.finalize', Buffer.from(JSON.stringify({ sessionId })), {
            persistent: true,
          });
        }

        channel.ack(msg);
      } catch (err) {
        logger.error(`Session cleanup error: ${err.message}`);
        channel.nack(msg, false, false); // dead-letter or discard
      }
    });

    logger.info('Session cleanup consumer started');
  } catch (err) {
    logger.error(`Failed to start session cleanup consumer: ${err.message}`);
    setTimeout(start, 5000);
  }
}

module.exports = { start };
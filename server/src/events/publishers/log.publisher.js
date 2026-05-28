/**
 * Log event publisher – publishes audit log entries to 'logs' exchange.
 * @module events/publishers/log
 */
const { getChannel } = require('../../config/rabbitmq');
const logger = require('../../utils/logger');

const EXCHANGE = 'logs';

/**
 * Publish a log entry.
 * @param {object} logEntry - { action, resource, resourceId, userId, organizationId, details, ip, timestamp }
 */
function publishLogEntry(logEntry) {
  try {
    const channel = getChannel();
    channel.publish(EXCHANGE, 'log.entry', Buffer.from(JSON.stringify(logEntry)), {
      persistent: true,
      contentType: 'application/json',
    });
    logger.debug(`Log event published: ${logEntry.action}`);
  } catch (err) {
    logger.error(`Failed to publish log event: ${err.message}`);
  }
}

module.exports = { publishLogEntry };
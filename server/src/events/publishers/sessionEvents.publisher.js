/**
 * Session event publisher – publishes session lifecycle events to the 'sessions' exchange.
 * @module events/publishers/sessionEvents
 */
const { getChannel } = require('../../config/rabbitmq');
const logger = require('../../utils/logger');

const EXCHANGE = 'sessions';

/**
 * Publish a session event.
 * @param {string} routingKey - e.g. 'session.started', 'session.stopped', 'session.paused', 'session.resumed'
 * @param {object} data - Payload (session object, etc.)
 */
function publishSessionEvent(routingKey, data) {
  try {
    const channel = getChannel();
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(data)), {
      persistent: true,
      contentType: 'application/json',
    });
    logger.debug(`Session event published: ${routingKey}`);
  } catch (err) {
    logger.error(`Failed to publish session event ${routingKey}: ${err.message}`);
  }
}

module.exports = { publishSessionEvent };
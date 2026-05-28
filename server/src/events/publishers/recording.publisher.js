/**
 * Recording event publisher – publishes to 'recordings' exchange.
 * @module events/publishers/recording
 */
const { getChannel } = require('../../config/rabbitmq');
const logger = require('../../utils/logger');

const EXCHANGE = 'recordings';

/**
 * Publish a recording-related event.
 * @param {string} routingKey - 'recording.requested', 'recording.finalize', etc.
 * @param {object} data - { recordingId, sessionId, ... }
 */
function publishRecordingEvent(routingKey, data) {
  try {
    const channel = getChannel();
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(data)), {
      persistent: true,
      contentType: 'application/json',
    });
    logger.debug(`Recording event published: ${routingKey}`);
  } catch (err) {
    logger.error(`Failed to publish recording event: ${err.message}`);
  }
}

module.exports = { publishRecordingEvent };
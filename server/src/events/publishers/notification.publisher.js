/**
 * Notification event publisher – publishes to 'notifications' exchange.
 * @module events/publishers/notification
 */
const { getChannel } = require('../../config/rabbitmq');
const logger = require('../../utils/logger');

const EXCHANGE = 'notifications';

/**
 * Publish a notification creation event.
 * @param {object} notificationPayload - includes scope, recipientIds, title, body, etc.
 */
function publishNotification(notificationPayload) {
  try {
    const channel = getChannel();
    channel.publish(EXCHANGE, 'notification.created', Buffer.from(JSON.stringify(notificationPayload)), {
      persistent: true,
      contentType: 'application/json',
    });
    logger.debug('Notification event published');
  } catch (err) {
    logger.error(`Failed to publish notification event: ${err.message}`);
  }
}

module.exports = { publishNotification };
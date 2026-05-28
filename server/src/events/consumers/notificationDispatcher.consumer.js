/**
 * Notification dispatcher consumer – listens for notification.created events,
 * persists them to MongoDB, and optionally sends email/push.
 * @module events/consumers/notificationDispatcher
 */
const { getChannel } = require('../../config/rabbitmq');
const Notification = require('../../models/Notification');
const logger = require('../../utils/logger');

const EXCHANGE = 'notifications';
const QUEUE = 'notification_dispatch';
const ROUTING_KEY = 'notification.created';

async function start() {
  try {
    const channel = getChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const payload = JSON.parse(msg.content.toString());
      logger.info('Notification dispatch: received new notification');

      try {
        // Persist notification to DB
        await Notification.create(payload);

        // TODO: send email/push notifications via another queue or direct integration
        // For now, we just persist. In production, we'd call an email service.
        logger.debug(`Notification saved: ${payload.title}`);

        channel.ack(msg);
      } catch (err) {
        logger.error(`Notification dispatch error: ${err.message}`);
        channel.nack(msg, false, false);
      }
    });

    logger.info('Notification dispatcher consumer started');
  } catch (err) {
    logger.error(`Failed to start notification dispatcher: ${err.message}`);
    setTimeout(start, 5000);
  }
}

module.exports = { start };
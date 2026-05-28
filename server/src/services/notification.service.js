/**
 * Notification service – creates notifications and dispatches them via RabbitMQ.
 * Handles platform, organization, group, and user scopes.
 * @module services/notification.service
 */
const { getChannel } = require('../config/rabbitmq');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { NOTIFICATION_CATEGORIES, NOTIFICATION_SCOPE } = require('../utils/constants');

/**
 * Create a notification and publish it for async processing (DB insertion, email, push).
 *
 * @param {object} params
 * @param {string} params.scope               - One of NOTIFICATION_SCOPE values
 * @param {string[]} params.recipientIds      - Array of user IDs (ObjectId strings)
 * @param {string} [params.category]          - Notification category
 * @param {string} params.title
 * @param {string} [params.body]
 * @param {string} [params.organizationId]    - Organisation ID if scoped
 * @returns {Promise<void>}
 */
async function createNotification({
  scope,
  recipientIds,
  category = NOTIFICATION_CATEGORIES.INFO,
  title,
  body = '',
  organizationId = null,
}) {
  // Validate required fields
  if (!scope || !Object.values(NOTIFICATION_SCOPE).includes(scope)) {
    throw new AppError('Invalid notification scope', 400);
  }
  if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    throw new AppError('At least one recipient is required', 400);
  }
  if (!title) {
    throw new AppError('Notification title is required', 400);
  }

  const notificationPayload = {
    scope,
    recipientIds: recipientIds.map(id => id.toString()),
    category,
    title,
    body,
    organizationId: organizationId ? organizationId.toString() : null,
    createdAt: new Date(),
  };

  try {
    const channel = getChannel();
    channel.publish(
      'notifications',
      'notification.created',
      Buffer.from(JSON.stringify(notificationPayload)),
      { persistent: true, contentType: 'application/json' }
    );
    logger.debug(`Notification published: ${title}`);
  } catch (err) {
    logger.error(`Failed to publish notification: ${err.message}`);
    // We rethrow so the caller can decide to handle failure
    throw new AppError('Notification delivery failed', 500);
  }
}

module.exports = { createNotification };
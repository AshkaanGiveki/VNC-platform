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
  if (scope === 'user' && (!recipientIds || recipientIds.length === 0)) {
    throw new AppError('At least one recipient is required for user scope', 400);
  }

  
  // If scope is platform or organization, we need to fetch recipient IDs.
  let finalRecipients = recipientIds || [];
  if (scope === 'platform') {
    const User = require('../models/User');
    const users = await User.find({ isActive: true }).select('_id');
    finalRecipients = users.map(u => u._id);
  } else if (scope === 'admins') {
    if (!organizationId) throw new AppError('Organization ID is required for admins scope', 400);
    const User = require('../models/User');
    const users = await User.find({
      organizationId,
      role: { $in: ['org_admin'] },
      isActive: true,
    }).select('_id');
    finalRecipients = users.map(u => u._id);
  }
  else if (scope === 'organization') {
    if (!organizationId) throw new AppError('Organization ID is required for organization scope', 400);
    const User = require('../models/User');
    const users = await User.find({ organizationId, isActive: true }).select('_id');
    finalRecipients = users.map(u => u._id);
  }

  const notificationPayload = {
    scope,
    recipientIds: finalRecipients.map(id => id.toString()),
    category,
    title,
    body,
    organizationId: organizationId ? organizationId.toString() : null,
    createdAt: new Date(),
  };

  // Publish to RabbitMQ as before
  const { getChannel } = require('../config/rabbitmq');
  const channel = getChannel();
  channel.publish(
    'notifications',
    'notification.created',
    Buffer.from(JSON.stringify(notificationPayload)),
    { persistent: true, contentType: 'application/json' }
  );
}

module.exports = { createNotification };
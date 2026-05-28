/**
 * Audit logging service – publishes log events to RabbitMQ for asynchronous persistence.
 * Every significant action should call `logAction`.
 * @module services/log.service
 */
const { getChannel } = require('../config/rabbitmq');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Publish an audit log entry via RabbitMQ.
 * The dedicated consumer persists it to MongoDB asynchronously.
 *
 * @param {object} params
 * @param {string} params.action          - e.g., 'user.created', 'session.started'
 * @param {string} params.resource        - e.g., 'user', 'session', 'workspace'
 * @param {string} [params.resourceId]    - MongoDB ObjectId of the resource
 * @param {string} [params.userId]        - User who performed the action
 * @param {string} [params.organizationId] - Organization context (nullable)
 * @param {object} [params.details]       - Additional metadata
 * @param {string} [params.ip]            - Client IP address
 * @returns {Promise<void>}
 */
async function logAction({
  action,
  resource,
  resourceId = null,
  userId = null,
  organizationId = null,
  details = {},
  ip = '',
}) {
  if (!action || !resource) {
    throw new AppError('Action and resource are required for logging', 500);
  }

  const logEntry = {
    action,
    resource,
    resourceId: resourceId ? resourceId.toString() : null,
    userId: userId ? userId.toString() : null,
    organizationId: organizationId ? organizationId.toString() : null,
    details,
    ip,
    timestamp: new Date(),
  };

  try {
    const channel = getChannel();
    channel.publish(
      'logs',
      'log.entry',
      Buffer.from(JSON.stringify(logEntry)),
      { persistent: true, contentType: 'application/json' }
    );
    logger.debug(`Log event published: ${action}`);
  } catch (err) {
    // Logging failures must never break the main flow – log locally and continue
    logger.error(`Failed to publish log event: ${err.message}`);
  }
}

module.exports = { logAction };
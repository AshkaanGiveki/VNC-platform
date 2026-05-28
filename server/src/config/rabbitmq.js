/**
 * RabbitMQ connection manager using amqplib.
 * Provides a persistent connection and channel with reconnection logic.
 * @module config/rabbitmq
 */
const amqp = require('amqplib');
const logger = require('../utils/logger');
const env = require('./env');

let connection = null;
let channel = null;
let isShuttingDown = false;

/**
 * Connect to RabbitMQ and create a channel.
 * Retries on failure and sets up event handlers for connection errors.
 * @returns {Promise<void>}
 */
async function connectRabbitMQ() {
  if (isShuttingDown) return;

  try {
    connection = await amqp.connect(env.rabbitmq.url);
    logger.info('RabbitMQ connection established');

    connection.on('error', (err) => {
      logger.error(`RabbitMQ connection error: ${err.message}`);
      if (!isShuttingDown) {
        setTimeout(connectRabbitMQ, 5000); // Auto-reconnect after 5s
      }
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      if (!isShuttingDown) {
        setTimeout(connectRabbitMQ, 5000);
      }
    });

    channel = await connection.createChannel();
    logger.info('RabbitMQ channel created');

    // Declare exchanges (topic type) for different event streams
    await channel.assertExchange('sessions', 'topic', { durable: true });
    await channel.assertExchange('notifications', 'topic', { durable: true });
    await channel.assertExchange('logs', 'topic', { durable: true });
    await channel.assertExchange('recordings', 'topic', { durable: true });

    logger.info('RabbitMQ exchanges asserted');

  } catch (error) {
    logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
    if (!isShuttingDown) {
      setTimeout(connectRabbitMQ, 5000);
    }
  }
}

/**
 * Get the current RabbitMQ channel.
 * Throws if not connected yet.
 * @returns {amqp.Channel}
 */
function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel not available. Ensure connectRabbitMQ has been called.');
  }
  return channel;
}

/**
 * Graceful shutdown – close channel and connection.
 */
async function closeRabbitMQ() {
  isShuttingDown = true;
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    logger.info('RabbitMQ connection closed gracefully');
  } catch (err) {
    logger.error(`Error during RabbitMQ shutdown: ${err.message}`);
  }
}

// Handle application termination
process.on('SIGINT', closeRabbitMQ);
process.on('SIGTERM', closeRabbitMQ);

module.exports = { connectRabbitMQ, getChannel, closeRabbitMQ };
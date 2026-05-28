/**
 * Events initialisation – starts all RabbitMQ consumers.
 * Called from server.js after connections are established.
 * @module events
 */
const sessionCleanupConsumer = require('./consumers/sessionCleanup.consumer');
const notificationDispatcherConsumer = require('./consumers/notificationDispatcher.consumer');
const logWriterConsumer = require('./consumers/logWriter.consumer');
const recordingProcessorConsumer = require('./consumers/recordingProcessor.consumer');
const logger = require('../utils/logger');

async function initConsumers() {
  try {
    await sessionCleanupConsumer.start();
    await notificationDispatcherConsumer.start();
    await logWriterConsumer.start();
    await recordingProcessorConsumer.start();
    logger.info('All event consumers initialised');
  } catch (err) {
    logger.error(`Failed to initialise consumers: ${err.message}`);
  }
}

module.exports = { initConsumers };
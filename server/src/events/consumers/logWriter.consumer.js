/**
 * Log writer consumer – listens for log.entry events and bulk-inserts into MongoDB.
 * This decouples audit logging from the API response time.
 * @module events/consumers/logWriter
 */
const { getChannel } = require('../../config/rabbitmq');
const Log = require('../../models/Log');
const logger = require('../../utils/logger');

const EXCHANGE = 'logs';
const QUEUE = 'log_writer';
const ROUTING_KEY = 'log.entry';

// Buffer for batch insertion (optional performance improvement)
let logBuffer = [];
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 5000;

async function flushBuffer() {
  if (logBuffer.length === 0) return;
  const toInsert = [...logBuffer];
  logBuffer = [];
  try {
    await Log.insertMany(toInsert, { ordered: false });
    logger.debug(`Inserted ${toInsert.length} log entries`);
  } catch (err) {
    logger.error(`Batch log insert error: ${err.message}`);
    // Push back to buffer? For simplicity, we log and discard to avoid memory leak.
  }
}

setInterval(flushBuffer, FLUSH_INTERVAL_MS);

async function start() {
  try {
    const channel = getChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      try {
        const logEntry = JSON.parse(msg.content.toString());
        logBuffer.push(logEntry);

        if (logBuffer.length >= BATCH_SIZE) {
          await flushBuffer();
        }
        channel.ack(msg);
      } catch (err) {
        logger.error(`Log writer error: ${err.message}`);
        channel.nack(msg, false, false);
      }
    });

    logger.info('Log writer consumer started');
  } catch (err) {
    logger.error(`Failed to start log writer consumer: ${err.message}`);
    setTimeout(start, 5000);
  }
}

module.exports = { start };
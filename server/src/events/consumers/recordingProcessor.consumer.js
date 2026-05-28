/**
 * Recording processor consumer – listens for recording.requested and recording.finalize events,
 * interacts with the recording service to start/stop actual recording streams.
 * @module events/consumers/recordingProcessor
 */
const { getChannel } = require('../../config/rabbitmq');
const recordingService = require('../../services/recording.service');
const logger = require('../../utils/logger');

const EXCHANGE = 'recordings';
const QUEUE = 'recording_processor';
const ROUTING_KEYS = ['recording.requested', 'recording.finalize'];

async function start() {
  try {
    const channel = getChannel();
    await channel.assertQueue(QUEUE, { durable: true });
    for (const key of ROUTING_KEYS) {
      await channel.bindQueue(QUEUE, EXCHANGE, key);
    }

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      const payload = JSON.parse(msg.content.toString());
      logger.info(`Recording processor: ${routingKey}`);

      try {
        if (routingKey === 'recording.requested') {
          // Start the actual recording via integration (e.g., Kasm recording API)
          // The recording document is already created, we need to trigger the stream.
          // For now we just log; actual implementation will call Kasm client.
          logger.info(`Start recording for session ${payload.sessionId}`);
          // In production: kasmClient.startRecording(payload.sessionId)
        } else if (routingKey === 'recording.finalize') {
          // Finalize recording: stop stream, retrieve file, process it.
          logger.info(`Finalize recording for session ${payload.sessionId}`);
          // Call recordingService.stopRecording(payload.sessionId) if not already done
        }

        channel.ack(msg);
      } catch (err) {
        logger.error(`Recording processor error: ${err.message}`);
        channel.nack(msg, false, false);
      }
    });

    logger.info('Recording processor consumer started');
  } catch (err) {
    logger.error(`Failed to start recording processor: ${err.message}`);
    setTimeout(start, 5000);
  }
}

module.exports = { start };
/**
 * Recording queue processor – handles stop & process recording jobs.
 * @module jobs/processors/recordingProcessor
 */
const { getQueue } = require('../queues/recordingQueue');
const recordingService = require('../../services/recording.service');
const logger = require('../../utils/logger');

function registerProcessors() {
  const queue = getQueue();

  // Stop an active recording (triggered when session ends)
  queue.process('stopRecording', async (job) => {
    const { sessionId } = job.data;
    logger.info(`Processing stopRecording for session ${sessionId}`);

    try {
      const recording = await recordingService.stopRecording(sessionId);
      if (recording) {
        logger.info(`Recording stopped for session ${sessionId}`);
      }
    } catch (err) {
      logger.error(`Stop recording failed for session ${sessionId}: ${err.message}`);
      throw err;
    }
  });

  // Future: transcode recording, upload to storage, update status.
  queue.process('processRecording', async (job) => {
    const { recordingId } = job.data;
    logger.info(`Processing recording ${recordingId}`);

    try {
      // TODO: Implement actual transcoding/storage logic
      // After processing, call recordingService.completeRecording(recordingId, { storagePath, duration, size })
      logger.info(`Recording ${recordingId} processed (simulated)`);
    } catch (err) {
      logger.error(`Process recording failed: ${err.message}`);
      throw err;
    }
  });
}

module.exports = { registerProcessors };
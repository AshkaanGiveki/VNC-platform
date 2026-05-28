/**
 * Recording service – manages session recordings metadata and triggers processing.
 * Recordings are started/stopped based on session events and organization settings.
 * @module services/recording.service
 */
const Recording = require('../models/Recording');
const Session = require('../models/Session');
const Organization = require('../models/Organization');
const { RECORDING_STATUS, SESSION_STATUS } = require('../utils/constants');
const { NotFoundError, AuthorizationError, AppError } = require('../utils/errors');
const { logAction } = require('./log.service');
const { getChannel } = require('../config/rabbitmq');
const { getDownloadUrl, deleteFile } = require('../config/storage');
const logger = require('../utils/logger');

/**
 * Start recording for a session (called internally when recording is enabled).
 * @param {string} sessionId
 * @returns {Promise<object>} Recording document.
 */
async function startRecording(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) throw new NotFoundError('Session not found');
  if (session.status !== SESSION_STATUS.RUNNING) {
    throw new AppError('Cannot record a non-running session', 400);
  }

  const org = await Organization.findById(session.organizationId);
  if (!org || !org.settings.recordingEnabled) {
    throw new AppError('Recording is disabled for this organization', 400);
  }

  // Check if a recording already exists for this session
  const existing = await Recording.findOne({ sessionId });
  if (existing) {
    if (existing.status === RECORDING_STATUS.RECORDING) {
      return existing; // already recording
    }
    // If previous recording exists, we could create a new one, but let's enforce uniqueness
    throw new AppError('A recording already exists for this session', 409);
  }

  const recording = await Recording.create({
    sessionId,
    organizationId: session.organizationId,
    userId: session.userId,
    status: RECORDING_STATUS.RECORDING,
    startedAt: new Date(),
  });

  // Link recording to session
  session.recordingId = recording._id;
  await session.save();

  // Publish event to start the actual recording stream (consumer handles integration)
  const channel = getChannel();
  channel.publish(
    'recordings',
    'recording.requested',
    Buffer.from(JSON.stringify({ recordingId: recording._id.toString(), sessionId: session._id.toString() }))
  );

  logger.info(`Recording started for session ${sessionId}`);
  await logAction({
    action: 'recording.started',
    resource: 'recording',
    resourceId: recording._id,
    userId: session.userId,
    organizationId: session.organizationId,
  });

  return recording;
}

/**
 * Stop recording and mark as processing.
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
async function stopRecording(sessionId) {
  const recording = await Recording.findOne({ sessionId, status: RECORDING_STATUS.RECORDING });
  if (!recording) {
    // No active recording
    return null;
  }

  recording.status = RECORDING_STATUS.PROCESSING;
  recording.finishedAt = new Date();
  await recording.save();

  // Publish event to finalise recording (transcoding, upload)
  const channel = getChannel();
  channel.publish(
    'recordings',
    'recording.finalize',
    Buffer.from(JSON.stringify({ recordingId: recording._id.toString() }))
  );

  logger.info(`Recording stopped for session ${sessionId}`);
  await logAction({
    action: 'recording.stopped',
    resource: 'recording',
    resourceId: recording._id,
    userId: recording.userId,
    organizationId: recording.organizationId,
  });

  return recording;
}

/**
 * Update recording metadata after processing is complete.
 * @param {string} recordingId
 * @param {object} data - { storagePath, duration, size }
 * @returns {Promise<object>}
 */
async function completeRecording(recordingId, { storagePath, duration, size }) {
  const recording = await Recording.findById(recordingId);
  if (!recording) throw new NotFoundError('Recording not found');

  recording.status = RECORDING_STATUS.READY;
  recording.storagePath = storagePath;
  recording.duration = duration;
  recording.size = size;
  await recording.save();

  logger.info(`Recording ${recordingId} completed and ready`);
  await logAction({
    action: 'recording.completed',
    resource: 'recording',
    resourceId: recording._id,
    userId: recording.userId,
    organizationId: recording.organizationId,
  });

  return recording;
}

/**
 * Get recordings for a user or organization.
 * @param {object} params
 * @param {object} params.user - requesting user
 * @param {object} [params.queryParams]
 * @param {string} [params.organizationId] - for admin queries
 * @returns {Promise<{recordings: Array, meta: object}>}
 */
async function getRecordings({ user, queryParams, organizationId }) {
  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(queryParams);
  const filter = {};

  // Regular users see only their own recordings; admins can see org-wide
  if (user.role === 'org_admin' || user.role === 'superadmin') {
    if (organizationId) filter.organizationId = organizationId;
  } else {
    filter.userId = user.userId;
  }

  if (queryParams.status) filter.status = queryParams.status;

  const [recordings, total] = await Promise.all([
    applyPagination(
      Recording.find(filter).populate('userId', 'email firstName lastName').sort({ createdAt: -1 }),
      pagination
    ).lean(),
    Recording.countDocuments(filter),
  ]);

  return { recordings, meta: buildMeta(total, pagination) };
}

/**
 * Get a single recording by ID.
 * @param {string} recordingId
 * @returns {Promise<object>}
 */
async function getRecording(recordingId) {
  const recording = await Recording.findById(recordingId).populate('userId', 'email');
  if (!recording) throw new NotFoundError('Recording not found');
  return recording;
}

/**
 * Delete a recording and its associated file from storage.
 * @param {string} recordingId
 * @param {object} actor - user performing delete
 * @returns {Promise<void>}
 */
async function deleteRecording(recordingId, actor) {
  const recording = await Recording.findById(recordingId);
  if (!recording) throw new NotFoundError('Recording not found');

  // Authorization: only org admin or superadmin can delete recordings, or the owner (if that policy)
  if (
    actor.role !== 'superadmin' &&
    actor.role !== 'org_admin' &&
    recording.userId.toString() !== actor.userId.toString()
  ) {
    throw new AuthorizationError('Insufficient permissions to delete this recording');
  }

  // Delete from storage
  if (recording.storagePath) {
    await deleteFile(recording.storagePath);
  }

  // Remove link from session
  await Session.updateOne({ recordingId: recording._id }, { $unset: { recordingId: 1 } });

  await Recording.findByIdAndDelete(recordingId);

  logger.info(`Recording ${recordingId} deleted`);
  await logAction({
    action: 'recording.deleted',
    resource: 'recording',
    resourceId: recording._id,
    userId: actor.userId || actor.userId,
    organizationId: recording.organizationId,
  });
}

module.exports = {
  startRecording,
  stopRecording,
  completeRecording,
  getRecordings,
  getRecording,
  deleteRecording,
};
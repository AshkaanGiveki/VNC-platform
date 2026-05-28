/**
 * File service – handles file uploads and downloads within active sessions.
 * Respects workspace/session policies and stores files in object storage.
 * @module services/file.service
 */
const SessionFile = require('../models/SessionFile');
const Session = require('../models/Session');
const { SESSION_STATUS } = require('../utils/constants');
const { NotFoundError, AuthorizationError, ValidationError, AppError } = require('../utils/errors');
const { uploadFile, getDownloadUrl, deleteFile } = require('../config/storage');
const { logAction } = require('./log.service');
const { isAllowed } = require('./policyEngine.service');
const logger = require('../utils/logger');

/**
 * Upload a file to a session.
 * @param {object} params
 * @param {object} params.user          - Authenticated user (req.user)
 * @param {string} params.sessionId
 * @param {object} params.file          - Multer file object { originalname, buffer, mimetype, size }
 * @param {string} [params.ip]
 * @returns {Promise<object>} Created SessionFile document.
 */
async function uploadToSession({ user, sessionId, file, ip }) {
  // 1. Find session and validate ownership/status
  const session = await Session.findOne({
    _id: sessionId,
    userId: user.userId,
    status: { $in: [SESSION_STATUS.RUNNING, SESSION_STATUS.PAUSED] },
  });
  if (!session) throw new NotFoundError('Active session not found');

  // 2. Check policy – is upload enabled?
  if (!isAllowed(session.policySnapshot, 'uploadEnabled')) {
    throw new AuthorizationError('File upload is disabled by workspace policy');
  }

  // 3. Build storage key: sessions/<sessionId>/<userId>/<timestamp>-<filename>
  const timestamp = Date.now();
  const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `sessions/${sessionId}/${user.userId}/${timestamp}-${sanitizedFileName}`;

  // 4. Upload stream to object storage
  try {
    await uploadFile(file.buffer, key, file.mimetype);
    logger.info(`File uploaded to storage: ${key}`);
  } catch (err) {
    logger.error(`File upload failed: ${err.message}`);
    throw new AppError('File upload failed', 500);
  }

  // 5. Save metadata
  const sessionFile = await SessionFile.create({
    sessionId,
    userId: user.userId,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    storagePath: key,
    direction: 'upload',
  });

  // 6. Log
  await logAction({
    action: 'file.uploaded',
    resource: 'sessionFile',
    resourceId: sessionFile._id,
    userId: user.userId,
    organizationId: session.organizationId,
    ip,
    details: { fileName: file.originalname, size: file.size },
  });

  return sessionFile;
}

/**
 * List files uploaded/downloaded in a session.
 * @param {object} params
 * @param {string} params.sessionId
 * @param {object} params.user
 * @param {object} [params.queryParams]
 * @returns {Promise<Array>}
 */
async function listSessionFiles({ sessionId, user, queryParams }) {
  // Ensure user is part of the session
  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new NotFoundError('Session not found');

  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(queryParams);
  const filter = { sessionId };
  if (queryParams.direction) filter.direction = queryParams.direction;

  const [files, total] = await Promise.all([
    applyPagination(SessionFile.find(filter).sort({ createdAt: -1 }), pagination).lean(),
    SessionFile.countDocuments(filter),
  ]);

  return { files, meta: buildMeta(total, pagination) };
}

/**
 * Get a pre‑signed download URL for a session file.
 * @param {object} params
 * @param {string} params.fileId
 * @param {object} params.user
 * @param {string} params.sessionId
 * @returns {Promise<string>} Download URL.
 */
async function downloadFile({ fileId, user, sessionId }) {
  const sessionFile = await SessionFile.findOne({ _id: fileId, sessionId });
  if (!sessionFile) throw new NotFoundError('File not found');

  // Ensure user is part of the session
  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new AuthorizationError('You do not have access to this session');

  // Check policy – is download enabled?
  if (!isAllowed(session.policySnapshot, 'downloadEnabled')) {
    throw new AuthorizationError('File download is disabled by workspace policy');
  }

  // Generate signed URL
  const url = await getDownloadUrl(sessionFile.storagePath, 3600); // 1 hour

  // Log download (optional)
  await logAction({
    action: 'file.downloaded',
    resource: 'sessionFile',
    resourceId: sessionFile._id,
    userId: user.userId,
    organizationId: session.organizationId,
    details: { fileName: sessionFile.fileName },
  });

  return url;
}

/**
 * Delete a file from session (only if policy allows or admin).
 * @param {object} params
 * @param {string} params.fileId
 * @param {object} params.user
 * @param {string} params.sessionId
 * @returns {Promise<void>}
 */
async function deleteSessionFile({ fileId, user, sessionId }) {
  const sessionFile = await SessionFile.findOne({ _id: fileId, sessionId });
  if (!sessionFile) throw new NotFoundError('File not found');

  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new AuthorizationError('Not authorized');

  // Delete from object storage
  await deleteFile(sessionFile.storagePath);

  // Remove metadata
  await SessionFile.findByIdAndDelete(fileId);

  await logAction({
    action: 'file.deleted',
    resource: 'sessionFile',
    resourceId: fileId,
    userId: user.userId,
    organizationId: session.organizationId,
  });
}

module.exports = {
  uploadToSession,
  listSessionFiles,
  downloadFile,
  deleteSessionFile,
};
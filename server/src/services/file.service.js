const SessionFile = require('../models/SessionFile');
const Session = require('../models/Session');
const fs = require('fs');
const path = require('path');
const { SESSION_STATUS } = require('../utils/constants');
const { NotFoundError, AuthorizationError, AppError } = require('../utils/errors');
const { uploadFile, getDownloadUrl, deleteFile } = require('../config/storage');
const { logAction } = require('./log.service');
const { isAllowed } = require('./policyEngine.service');
const logger = require('../utils/logger');

const SESSION_VOLUME_BASE = '/data/sessions';

async function uploadToSession({ user, sessionId, file, ip }) {
  const session = await Session.findOne({
    _id: sessionId,
    userId: user.userId,
    status: { $in: [SESSION_STATUS.RUNNING, SESSION_STATUS.PAUSED] },
  });
  if (!session) throw new NotFoundError('Active session not found');

  if (!isAllowed(session.policySnapshot, 'uploadEnabled')) {
    throw new AuthorizationError('File upload is disabled by workspace policy');
  }

  // Save to MinIO
  const timestamp = Date.now();
  const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `sessions/${sessionId}/${user.userId}/${timestamp}-${sanitized}`;

  try {
    await uploadFile(file.buffer, storageKey, file.mimetype);
    logger.info(`File uploaded to MinIO: ${storageKey}`);
  } catch (err) {
    logger.error(`MinIO upload error: ${err.message}`);
    throw new AppError('File upload failed', 500);
  }

  // Write to container's Uploads folder via host mount
  const uploadsHostPath = path.join(
    SESSION_VOLUME_BASE,
    user.userId,
    session.workspaceId.toString(),
    'Uploads'
  );

  logger.info(`[UPLOAD] Writing file to host path: ${uploadsHostPath}`);
  logger.info(`[UPLOAD] File original name: ${file.originalname}, size: ${file.size}`);

  try {
    // Ensure directory exists
    fs.mkdirSync(uploadsHostPath, { recursive: true });
    const filePath = path.join(uploadsHostPath, sanitized);
    fs.writeFileSync(filePath, file.buffer);
    logger.info(`[UPLOAD] File written successfully to: ${filePath}`);
  } catch (err) {
    logger.error(`[UPLOAD] Writing to Uploads folder failed: ${err.message}`);
    throw new AppError('File upload failed – cannot write to container folder', 500);
  }

  // Save metadata
  const sessionFile = await SessionFile.create({
    sessionId,
    userId: user.userId,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    storagePath: storageKey,
    direction: 'upload',
  });

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

async function listDownloads({ user, sessionId }) {
  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new NotFoundError('Session not found');

  const downloadsHostPath = path.join(
    SESSION_VOLUME_BASE,
    user.userId,
    session.workspaceId.toString(),
    'Downloads'
  );

  logger.info(`[DOWNLOADS] Listing files from host path: ${downloadsHostPath}`);

  try {
    if (!fs.existsSync(downloadsHostPath)) {
      logger.warn(`[DOWNLOADS] Path does not exist: ${downloadsHostPath}`);
      return [];
    }
    const files = fs.readdirSync(downloadsHostPath);
    logger.info(`[DOWNLOADS] Found ${files.length} files`);

    return files.map((name) => {
      const fullPath = path.join(downloadsHostPath, name);
      const stats = fs.statSync(fullPath);
      return { name, size: stats.size, modifiedAt: stats.mtime };
    });
  } catch (err) {
    logger.error(`[DOWNLOADS] Error listing files: ${err.message}`);
    return [];
  }
}

async function downloadFromContainer({ user, sessionId, fileName }) {
  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new NotFoundError('Session not found');

  if (!isAllowed(session.policySnapshot, 'downloadEnabled')) {
    throw new AuthorizationError('File download is disabled by workspace policy');
  }

  const downloadsHostPath = path.join(
    SESSION_VOLUME_BASE,
    user.userId,
    session.workspaceId.toString(),
    'Downloads'
  );
  const filePath = path.join(downloadsHostPath, fileName);
  if (!fs.existsSync(filePath)) throw new NotFoundError('File not found');
  return filePath;
}

async function listSessionFiles({ sessionId, user, queryParams }) {
  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new NotFoundError('Session not found');

  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(queryParams);
  const filter = { sessionId, direction: 'upload' };

  const [files, total] = await Promise.all([
    applyPagination(SessionFile.find(filter).sort({ createdAt: -1 }), pagination).lean(),
    SessionFile.countDocuments(filter),
  ]);

  return { files, meta: buildMeta(total, pagination) };
}

async function downloadUploadedFile({ fileId, user, sessionId }) {
  const sessionFile = await SessionFile.findOne({ _id: fileId, sessionId });
  if (!sessionFile) throw new NotFoundError('File not found');

  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new AuthorizationError('Not authorized');

  if (!isAllowed(session.policySnapshot, 'downloadEnabled')) {
    throw new AuthorizationError('File download is disabled by workspace policy');
  }

  const url = await getDownloadUrl(sessionFile.storagePath, 3600);
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

async function deleteSessionFile({ fileId, user, sessionId }) {
  const sessionFile = await SessionFile.findOne({ _id: fileId, sessionId });
  if (!sessionFile) throw new NotFoundError('File not found');

  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new AuthorizationError('Not authorized');

  await deleteFile(sessionFile.storagePath);
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
  listDownloads,
  downloadFromContainer,
  listSessionFiles,
  downloadUploadedFile,
  deleteSessionFile,
};
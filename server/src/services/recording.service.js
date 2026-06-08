const Recording = require('../models/Recording');
const Session = require('../models/Session');
const Organization = require('../models/Organization');
const { RECORDING_STATUS, SESSION_STATUS } = require('../utils/constants');
const { NotFoundError, AuthorizationError, AppError } = require('../utils/errors');
const { logAction } = require('./log.service');
const { uploadFile, getDownloadUrl, deleteFile } = require('../config/storage');
const logger = require('../utils/logger');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const activeRecordings = new Map();

async function startRecording(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) throw new NotFoundError('Session not found');
  if (session.status !== SESSION_STATUS.RUNNING) throw new AppError('Can only record running sessions', 400);

  const org = await Organization.findById(session.organizationId);
  if (!org || !org.settings?.recordingEnabled) throw new AppError('Recording is disabled for this organization', 400);

  // If there's already an active recording for this session, stop it first
  if (activeRecordings.has(sessionId)) {
    logger.info(`Stopping existing active recording for session ${sessionId} before starting new one`);
    await stopRecording(sessionId);
  }

  // Create a new recording document (no duplicate check)
  const recording = new Recording({
    sessionId,
    organizationId: session.organizationId,
    userId: session.userId,
    status: RECORDING_STATUS.RECORDING,
    startedAt: new Date(),
  });
  await recording.save();
  session.recordingId = recording._id;
  await session.save();

  // ... rest of the function unchanged (output path, docker exec ffmpeg, etc.)
  // (keep the existing recording logic exactly as you have it)
  
  // (the rest of the function from your current working version)

  // ── Output file ────────────────────────────────────────────────────────
  const storageRoot = path.resolve(config.env.sessionStoragePath);
  const recordingsHostPath = path.join(
    storageRoot,
    session.userId.toString(),
    session.workspaceId.toString(),
    'Desktop', 'Recordings',
  );
  fs.mkdirSync(recordingsHostPath, { recursive: true });
  const outputFile = path.join(recordingsHostPath, 'recording-' + Date.now() + '.mkv');

  // ── Validate containerId ───────────────────────────────────────────────
  const containerId = session.containerId;
  if (!containerId) throw new AppError('Session has no containerId — cannot record', 500);

  // ── Display number ─────────────────────────────────────────────────────
  // Kasm containers use :1 by default. Override via config.env.kasmDisplayNumber if needed.
  const display = config.env.kasmDisplayNumber || ':1';

  logger.debug('Starting docker exec ffmpeg on container ' + containerId + ' display ' + display);

  // ── docker exec ffmpeg inside container ───────────────────────────────
  // ffmpeg captures the X display with x11grab and writes MKV to stdout.
  // We pipe that stdout to a file on the host.
  // No VNC / rfb2 / proxy needed — KasmVNC disables legacy RFB auth.
  const dockerArgs = [
    'exec', '-i', containerId,
    'ffmpeg',
    '-f', 'x11grab',
    '-r', '5',
    '-i', display,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-pix_fmt', 'yuv420p',
    '-f', 'matroska',
    'pipe:1',
  ];

  const proc = spawn('docker', dockerArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const outStream = fs.createWriteStream(outputFile);
  proc.stdout.pipe(outStream);

  let bytesWritten = 0;
  proc.stdout.on('data', (d) => { bytesWritten += d.length; });
  proc.stderr.on('data', (d) => logger.debug('ffmpeg[' + containerId + ']: ' + d));
  proc.on('error', (e) => logger.error('docker exec spawn error: ' + e.message));

  activeRecordings.set(sessionId, {
    proc,
    outStream,
    outputFile,
    recordingId: recording._id,
    getBytesWritten: () => bytesWritten,
  });

  await logAction({
    action: 'recording.started', resource: 'recording',
    resourceId: recording._id, userId: session.userId,
    organizationId: session.organizationId,
  });
  logger.info('Recording started for session ' + sessionId);
  return recording;
}

async function stopRecording(sessionId) {
  const active = activeRecordings.get(sessionId);
  if (!active) {
    const rec = await Recording.findOne({ sessionId, status: RECORDING_STATUS.RECORDING });
    if (rec) { rec.status = RECORDING_STATUS.FAILED; rec.finishedAt = new Date(); await rec.save(); }
    return null;
  }

  const { proc, outStream, outputFile, recordingId, getBytesWritten } = active;
  activeRecordings.delete(sessionId);

  // SIGINT tells ffmpeg to flush and finalise the MKV cleanly before exiting
  try { proc.kill('SIGINT'); } catch (_) { }

  // Wait for process exit
  await new Promise((resolve) => {
    proc.on('close', resolve);
    setTimeout(resolve, 15000);
  });

  // Wait for file stream to finish writing
  await new Promise((resolve) => {
    if (outStream.writableEnded) return resolve();
    outStream.end(resolve);
  });

  // Let OS flush file buffers
  await new Promise((r) => setTimeout(r, 1000));

  const recording = await Recording.findById(recordingId);
  if (!recording) return null;

  recording.status = RECORDING_STATUS.PROCESSING;
  recording.finishedAt = new Date();
  await recording.save();

  try {
    if (!fs.existsSync(outputFile))
      throw new Error('Output file not created by ffmpeg');

    const stats = fs.statSync(outputFile);
    if (stats.size === 0)
      throw new Error('Output file is empty — ffmpeg captured no frames (stdout bytes: ' + getBytesWritten() + ')');

    const fileBuffer = fs.readFileSync(outputFile);
    const storageKey = 'recordings/' + sessionId + '/' + Date.now() + '.mkv';
    await uploadFile(fileBuffer, storageKey, 'video/x-matroska');

    recording.storagePath = storageKey;
    recording.size = fileBuffer.length;
    recording.status = RECORDING_STATUS.READY;
    await recording.save();
    fs.unlinkSync(outputFile);
  } catch (err) {
    logger.error('Recording upload failed for session ' + sessionId + ': ' + err.message);
    recording.status = RECORDING_STATUS.FAILED;
    await recording.save();
  }

  await Session.updateOne({ recordingId: recording._id }, { $unset: { recordingId: 1 } });
  await logAction({
    action: 'recording.stopped', resource: 'recording',
    resourceId: recording._id, userId: recording.userId,
    organizationId: recording.organizationId,
  });
  return recording;
}

async function getRecordings({ user, queryParams, organizationId }) {
  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(queryParams);
  const filter = {};
  if (user.role === 'org_admin' || user.role === 'manager') filter.organizationId = user.organizationId;
  else if (user.role === 'superadmin' && organizationId) filter.organizationId = organizationId;
  else if (user.role === 'user') filter.userId = user.userId;
  if (queryParams.status) filter.status = queryParams.status;

  const [recordings, total] = await Promise.all([
    applyPagination(
      Recording.find(filter).populate('userId', 'firstName lastName email').sort({ createdAt: -1 }),
      pagination
    ).lean(),
    Recording.countDocuments(filter),
  ]);

  const result = [];
  for (const r of recordings) {
    const item = { ...r };
    console.log("1");
    item.downloadUrl = '';   // always present
    console.log("2");
    if (r.status === RECORDING_STATUS.READY && r.storagePath) {
      try {

        console.log("3");
        item.downloadUrl = await getDownloadUrl(r.storagePath, 3600);
      } catch (err) {

        console.log("4");
        logger.error(`Failed to generate download URL for ${r._id}: ${err.message}`);
      }
    }

    console.log("5");
    result.push(item);
  }

  console.log("6");
  return { recordings: result, meta: buildMeta(total, pagination) };
}

async function getRecording(recordingId) {
  const recording = await Recording.findById(recordingId)
    .populate('userId', 'firstName lastName email')
    .lean();
  if (!recording) throw new NotFoundError('Recording not found');

  const item = { ...recording };
  item.downloadUrl = '';
  if (item.status === RECORDING_STATUS.READY && item.storagePath) {
    try {
      item.downloadUrl = await getDownloadUrl(item.storagePath, 3600);
    } catch (err) {
      logger.error(`Failed to generate download URL for ${item._id}: ${err.message}`);
    }
  }
  return item;
}

async function deleteRecording(recordingId, actor) {
  const recording = await Recording.findById(recordingId);
  if (!recording) throw new NotFoundError('Recording not found');
  if (
    actor.role !== 'superadmin' && actor.role !== 'org_admin' && actor.role !== 'manager' &&
    recording.userId.toString() !== actor.userId.toString()
  ) throw new AuthorizationError('Insufficient permissions');
  if (recording.storagePath) await deleteFile(recording.storagePath);
  await Session.updateOne({ recordingId: recording._id }, { $unset: { recordingId: 1 } });
  await Recording.findByIdAndDelete(recordingId);
  await logAction({
    action: 'recording.deleted', resource: 'recording',
    resourceId: recording._id, userId: actor.userId,
    organizationId: recording.organizationId,
  });
}

module.exports = { startRecording, stopRecording, getRecordings, getRecording, deleteRecording };
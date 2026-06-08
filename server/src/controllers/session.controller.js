/**
 * Session controller – lifecycle operations.
 * @module controllers/session.controller
 */
const sessionService = require('../services/session.service');
const { buildMeta } = require('../utils/pagination');
const { success, paginated } = require('../utils/response');
const recordingService = require('../services/recording.service');
const containerService = require('../services/container.service');
const Session = require('../models/Session');
const logger = require('../utils/logger');
const { SESSION_STATUS } = require('../utils/constants');
const { logAction } = require('../services/log.service');

const startSession = async (req, res, next) => {
  try {
    const session = await sessionService.startSession({
      user: req.user,
      workspaceId: req.body.workspaceId,
      ip: req.ip,
    });
    return success(res, session, 201);
  } catch (err) {
    next(err);
  }
};

const stopSession = async (req, res, next) => {
  try {
    const session = await sessionService.stopSession({
      user: req.user,
      sessionId: req.params.id,
      ip: req.ip,
    });
    return success(res, session);
  } catch (err) {
    next(err);
  }
};

const pauseSession = async (req, res, next) => {
  try {
    const session = await sessionService.pauseSession({
      user: req.user,
      sessionId: req.params.id,
      ip: req.ip,
    });
    return success(res, session);
  } catch (err) {
    next(err);
  }
};

const resumeSession = async (req, res, next) => {
  try {
    const session = await sessionService.resumeSession({
      user: req.user,
      sessionId: req.params.id,
      ip: req.ip,
    });
    return success(res, session);
  } catch (err) {
    next(err);
  }
};

const getSession = async (req, res, next) => {
  try {
    const session = await sessionService.getSession({
      user: req.user,
      sessionId: req.params.id,
    });
    return success(res, session);
  } catch (err) {
    next(err);
  }
};

const listUserSessions = async (req, res, next) => {
  try {
    const { sessions, meta } = await sessionService.listUserSessions({
      user: req.user,
      queryParams: req.query,
    });
    return paginated(res, sessions, meta);
  } catch (err) {
    next(err);
  }
};

const listOrgSessions = async (req, res, next) => {
  try {
    const { sessions, meta } = await sessionService.listOrgSessions({
      organizationId: req.params.orgId,
      queryParams: req.query,
    });
    return paginated(res, sessions, buildMeta(meta.total, meta));
  } catch (err) {
    next(err);
  }
};



const startRecording = async (req, res, next) => {
  try {
    const recording = await recordingService.startRecording(req.params.id);
    return success(res, recording, 201);
  } catch (err) {
    next(err);
  }
};

const stopRecording = async (req, res, next) => {
  try {
    const recording = await recordingService.stopRecording(req.params.id);
    return success(res, recording);
  } catch (err) {
    next(err);
  }
};

const forceStopSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) throw new NotFoundError('Session not found');

    // Authorization
    const isOwner = session.userId.toString() === req.user.userId;
    const isOrgAdmin = (req.user.role === 'org_admin' || req.user.role === 'manager') &&
      session.organizationId.toString() === req.user.organizationId.toString();
    if (!isOwner && !isOrgAdmin && req.user.role !== 'superadmin') {
      throw new AuthorizationError('Not authorized');
    }

    // Attempt container deletion – ignore if missing
    try {
      if (session.containerId) {
        await containerService.deleteContainer(session.containerId);
      }
    } catch (err) {
      logger.warn(`Force-stop: could not delete container ${session.containerId}: ${err.message}`);
    }

    // Stop any active recording
    try {
      await stopRecording(session._id.toString());
    } catch (err) {
      logger.warn(`Force-stop: could not stop recording for session ${session._id}: ${err.message}`);
    }

    // Mark stopped
    session.status = SESSION_STATUS.STOPPED;
    session.stoppedAt = new Date();
    await session.save();

    await logAction({
      action: 'session.force_stopped',
      resource: 'session',
      resourceId: session._id,
      userId: req.user.userId,
      organizationId: session.organizationId,
    });

    return success(res, session);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  startSession,
  stopSession,
  pauseSession,
  resumeSession,
  getSession,
  listUserSessions,
  listOrgSessions,
  startRecording,
  stopRecording,
  forceStopSession
};
/**
 * Session controller – lifecycle operations.
 * @module controllers/session.controller
 */
const sessionService = require('../services/session.service');
const { success, paginated } = require('../utils/response');

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
    return paginated(res, sessions, meta);
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
};
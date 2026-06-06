const Session = require('../models/Session');
const Workspace = require('../models/Workspace');
const UserWorkspace = require('../models/UserWorkspace');
const Image = require('../models/Image');
const Organization = require('../models/Organization');
const { SESSION_STATUS, ROLES } = require('../utils/constants');
const {
  NotFoundError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} = require('../utils/errors');
const { logAction } = require('./log.service');
const { createNotification } = require('./notification.service');
const { resolvePolicy } = require('./policyEngine.service');
const containerService = require('./container.service');
const logger = require('../utils/logger');
const config = require('../config');
const path = require('path');

/**
 * Start a new session for a user's workspace.
 * Creates the session immediately with status 'starting',
 * then launches the container and updates to 'running' or 'failed'.
 *
 * @param {object} params
 * @param {object} params.user         - Authenticated user (req.user)
 * @param {string} params.workspaceId  - Workspace to launch
 * @param {string} [params.ip]         - Client IP
 * @returns {Promise<object>} The created session document.
 */
async function startSession({ user, workspaceId, ip }) {
  // 1. Verify user has access to this workspace
  const assignment = await UserWorkspace.findOne({
    userId: user.userId,
    workspaceId,
    organizationId: user.organizationId,
  });
  if (!assignment) {
    throw new AuthorizationError('You do not have access to this workspace');
  }

  // 2. Load workspace, ensure it's active and belongs to user's org
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    organizationId: user.organizationId,
    isActive: true,
  });
  if (!workspace) {
    throw new NotFoundError('Workspace not found or disabled');
  }

  // 3. Check existing sessions on the same workspace for this user
  const activeSessions = await Session.countDocuments({
    userId: user.userId,
    workspaceId,
    status: { $in: [SESSION_STATUS.RUNNING, SESSION_STATUS.PAUSED, SESSION_STATUS.STARTING] },
  });

  // Only one active session per workspace (configurable)
  if (activeSessions > 0) {
    throw new ConflictError(
      'You already have an active or starting session on this workspace. Please stop it before starting a new one.'
    );
  }

  // 4. Load image
  const image = await Image.findById(workspace.imageId);
  if (!image || !image.isEnabled) {
    throw new NotFoundError('این فضای کاری در حال حاضر قابل اجرا نیست.');
  }

  // 5. Resolve effective policy
  const policy = await resolvePolicy(workspace);

  // 6. Create session document with status 'starting'
  // 6. Create session document with status 'starting'
  const session = await Session.create({
    userId: user.userId,
    workspaceId: workspace._id,
    organizationId: user.organizationId,
    containerId: 'pending',
    accessUrl: 'pending',
    websocketUrl: null,
    status: SESSION_STATUS.STARTING,
    policySnapshot: policy,
    resources: workspace.resources,
    startedAt: new Date(),
    lastActivityAt: new Date(),
  });

  // Build volume path for persistent home directory
  const sessionStoragePath = config.env.sessionStoragePath || path.join(__dirname, '../../sessions');
  const sessionHomePath = path.join(sessionStoragePath, user.userId, workspace._id.toString());

  try {
    const container = await containerService.launchContainer({
      image,
      resources: workspace.resources,
      policy,
      user: { _id: user.userId },
      workspaceId: workspace._id,
      sessionId: session._id.toString(),
      volumePath: policy.filePersistence ? sessionHomePath : null,   // ← home mount
    });

    session.containerId = container.containerId;
    session.accessUrl = container.url;
    session.websocketUrl = container.websocketUrl || null;
    session.status = SESSION_STATUS.RUNNING;
    await session.save();

     await logAction({
      action: 'session.started',
      resource: 'session',
      resourceId: session._id,
      userId: user.userId,
      organizationId: user.organizationId,
      ip,
      details: { workspace: workspace.name },
    });

    await createNotification({
      scope: 'user',
      recipientIds: [user.userId],
      category: 'info',
      title: 'آغاز نشست',
      body: policy.maxSessionDuration > 0
        ? `نشست ${workspace.name} شما راه‌اندازی شد. این نشست به‌طور خودکار پس از ${policy.maxSessionDuration} دقیقه پایان خواهد یافت.`
        : `نشست ${workspace.name} شما راه‌اندازی شد.`,
      organizationId: user.organizationId,
    });

    // If maxSessionDuration is set, schedule an auto-stop job
    if (policy.maxSessionDuration > 0) {
      const { getQueue } = require('../jobs/queues/sessionQueue');
      const queue = getQueue();
      await queue.add(
        'autoStopSession',
        { sessionId: session._id.toString() },
        { delay: policy.maxSessionDuration * 60 * 1000 }
      );
    }

    logger.info(`Session ${session._id} started for user ${user.userId}`);
    return session;
  } catch (err) {
    // Container launch failed – mark session as failed
    session.status = SESSION_STATUS.FAILED;
    await session.save();

    await logAction({
      action: 'session.failed',
      resource: 'session',
      resourceId: session._id,
      userId: user.userId,
      organizationId: user.organizationId,
      ip,
      details: { error: err.message },
    });

    throw err; // rethrow to let controller handle it
  }
}

/**
 * Stop a session – stops the container, updates status, and triggers cleanup.
 */
async function stopSession({ user, sessionId, ip }) {
  const query = { _id: sessionId };
  if (user.role !== 'system') {
    query.userId = user.userId; // regular users can only stop own sessions
  }

  const session = await Session.findOne(query);
  if (!session) throw new NotFoundError('Session not found');
  if (session.status === SESSION_STATUS.STOPPED) {
    throw new ConflictError('Session is already stopped');
  }

  // Stop the container
  await containerService.stopContainer(session.containerId);

  // Update session
  session.status = SESSION_STATUS.STOPPED;
  session.stoppedAt = new Date();
  await session.save();

  // If file persistence is off, trigger file cleanup
  if (session.policySnapshot && !session.policySnapshot.filePersistence) {
    const { getChannel } = require('../config/rabbitmq');
    const channel = getChannel();
    channel.publish(
      'sessions',
      'session.cleanup.files',
      Buffer.from(JSON.stringify({ sessionId: session._id.toString() }))
    );
  }

  // Audit log
  await logAction({
    action: 'session.stopped',
    resource: 'session',
    resourceId: session._id,
    userId: user.userId,
    organizationId: session.organizationId,
    ip,
  });

  // Notify user (skip for system calls)
  if (user.role !== 'system') {
    await createNotification({
      scope: 'user',
      recipientIds: [user.userId],
      category: 'info',
      title: 'پایان نشست',
      body: `نشست شما به پایان رسید.`,
      organizationId: session.organizationId,
    });
  }

  // If recording was active, queue recording stop
  if (session.recordingId) {
    const { getQueue } = require('../jobs/queues/recordingQueue');
    const queue = getQueue();
    await queue.add('stopRecording', { sessionId: session._id.toString() });
  }

  logger.info(`Session ${session._id} stopped`);
  return session;
}

/**
 * Pause a running session.
 */
async function pauseSession({ user, sessionId, ip }) {
  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new NotFoundError('Session not found');
  if (session.status !== SESSION_STATUS.RUNNING) {
    throw new ConflictError('Only running sessions can be paused');
  }

  await containerService.pauseContainer(session.containerId);
  session.status = SESSION_STATUS.PAUSED;
  await session.save();

  await logAction({
    action: 'session.paused',
    resource: 'session',
    resourceId: session._id,
    userId: user.userId,
    organizationId: session.organizationId,
    ip,
  });

  return session;
}

/**
 * Resume a paused session.
 */
async function resumeSession({ user, sessionId, ip }) {
  const session = await Session.findOne({ _id: sessionId, userId: user.userId });
  if (!session) throw new NotFoundError('Session not found');
  if (session.status !== SESSION_STATUS.PAUSED) {
    throw new ConflictError('Only paused sessions can be resumed');
  }

  await containerService.resumeContainer(session.containerId);
  session.status = SESSION_STATUS.RUNNING;
  session.lastActivityAt = new Date();
  await session.save();

  await logAction({
    action: 'session.resumed',
    resource: 'session',
    resourceId: session._id,
    userId: user.userId,
    organizationId: session.organizationId,
    ip,
  });

  return session;
}

/**
 * Get a single session by ID, scoped to the requesting user.
 */
async function getSession({ user, sessionId }) {
  const query = { _id: sessionId };
  if (user.role !== ROLES.SUPERADMIN && user.role !== ROLES.ORG_ADMIN) {
    query.userId = user.userId;
  }
  const session = await Session.findOne(query).populate('workspaceId', 'name');
  if (!session) throw new NotFoundError('Session not found');
  return session;
}

/**
 * List sessions for the current user.
 */
async function listUserSessions({ user, queryParams }) {
  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(queryParams);

  const filter = { userId: user.userId };
  if (queryParams.status) filter.status = queryParams.status;

  const [sessions, total] = await Promise.all([
    applyPagination(
      Session.find(filter)
        .populate('workspaceId', 'name imageId')
        .populate({
          path: 'workspaceId',
          populate: { path: 'imageId', select: 'iconUrl name' },
        })
        .sort({ createdAt: -1 }),
      pagination
    ).lean(),
    Session.countDocuments(filter),
  ]);

  return { sessions, meta: buildMeta(total, pagination) };
}

/**
 * Admin: list all sessions within an organization.
 */
async function listOrgSessions({ organizationId, queryParams }) {
  console.log('>>> listOrgSessions called with filter:', { organizationId, queryParams });
  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(queryParams);

  const filter = { organizationId };

  if (queryParams.userId) {
    filter.userId = queryParams.userId;
  }

  if (queryParams.status) {
    // Split comma‑separated string into an array for $in operator
    const statusList = queryParams.status.split(',').map(s => s.trim());
    filter.status = { $in: statusList };
  }

  const [sessions, total] = await Promise.all([
    applyPagination(
      Session.find(filter)
        .populate('userId', 'email firstName lastName')
        .populate('workspaceId', 'name')
        .sort({ createdAt: -1 }),
      pagination
    ).lean(),
    Session.countDocuments(filter),
  ]);

  return { sessions, meta: buildMeta(total, pagination) };
}

module.exports = {
  startSession,
  stopSession,
  pauseSession,
  resumeSession,
  getSession,
  listUserSessions,
  listOrgSessions,
};
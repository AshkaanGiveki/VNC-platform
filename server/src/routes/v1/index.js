const router = require('express').Router();
const authRoutes = require('./auth.routes');
const orgRoutes = require('./organization.routes');
const userRoutes = require('./user.routes');
const imageRoutes = require('./image.routes');
const policyRoutes = require('./policyTemplate.routes');
const workspaceRoutes = require('./workspace.routes');
const { userSessionRouter, orgSessionRouter } = require('./session.routes');
const fileRoutes = require('./file.routes');
const notificationRoutes = require('./notification.routes');
const logRoutes = require('./log.routes');
const recordingRoutes = require('./recording.routes');
const adminRoutes = require('./admin.routes');

// Auth
router.use('/auth', authRoutes);

router.use('/users', adminRoutes);   

// Org‑scoped resources – more specific routes first to avoid superadmin blanket catch
router.use('/organizations/:orgId/users', userRoutes);
router.use('/organizations/:orgId/policies', policyRoutes);
router.use('/organizations/:orgId/workspaces', workspaceRoutes);
router.use('/organizations/:orgId/sessions', orgSessionRouter);

// Organizations (superadmin only) – must be AFTER the above or blanket auth catches them
router.use('/organizations', orgRoutes);

// User sessions (non‑org specific)
router.use('/sessions', userSessionRouter);

// Files under a session
router.use('/sessions/:sessionId/files', fileRoutes);

// Images
router.use('/images', imageRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Logs
router.use('/logs', logRoutes);

// Recordings
router.use('/recordings', recordingRoutes);

module.exports = router;
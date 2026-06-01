const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const notificationValidator = require('../../validators/notification.validator');
const notificationController = require('../../controllers/notification.controller');
const { ROLES } = require('../../utils/constants');

router.use(authenticate);

// Regular user notifications
router.get('/', validate({ query: notificationValidator.queryParams }), notificationController.getUserNotifications);

// Superadmin platform notifications
router.get('/admin', authorize(ROLES.SUPERADMIN), validate({ query: notificationValidator.queryParams }), notificationController.getAdminNotifications);

// Manager / Org‑admin org notifications
router.get('/organization', authorize(ROLES.ORG_ADMIN, ROLES.MANAGER), validate({ query: notificationValidator.queryParams }), notificationController.getOrgNotifications);

router.patch('/:id/read', validate({ params: notificationValidator.notificationIdParam }), notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllRead);
router.post(
  '/',
  authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER),
  validate({ body: notificationValidator.createBody }),
  notificationController.createNotification
);
module.exports = router;
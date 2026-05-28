const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const notificationValidator = require('../../validators/notification.validator');
const notificationController = require('../../controllers/notification.controller');
const { ROLES } = require('../../utils/constants');

router.use(authenticate);

router.get('/', validate({ query: notificationValidator.queryParams }), notificationController.getUserNotifications);
router.patch('/:id/read', validate({ params: notificationValidator.notificationIdParam }), notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllRead);

// Only admins can create notifications manually
router.post('/', authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN), validate({ body: notificationValidator.createBody }), notificationController.createNotification);

module.exports = router;
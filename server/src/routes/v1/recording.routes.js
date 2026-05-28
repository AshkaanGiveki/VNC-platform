const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const recordingController = require('../../controllers/recording.controller');
const { ROLES } = require('../../utils/constants');

router.use(authenticate);

// Users see their own recordings; admins can query org-wide
router.get('/', recordingController.getRecordings);
router.get('/:id', recordingController.getRecording);
router.delete('/:id', authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN), recordingController.deleteRecording);

module.exports = router;
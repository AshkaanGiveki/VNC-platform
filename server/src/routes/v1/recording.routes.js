const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const recordingController = require('../../controllers/recording.controller');
const sessionController = require('../../controllers/session.controller');
const { ROLES } = require('../../utils/constants');

router.use(authenticate);
const orgRecordingRouter = require('express').Router({ mergeParams: true });
orgRecordingRouter.post('/:id/recording/start', sessionController.startRecording);
orgRecordingRouter.post('/:id/recording/stop', sessionController.stopRecording);

// Users see their own recordings; admins can query org-wide
router.get('/', recordingController.getRecordings);
router.get('/:id', recordingController.getRecording);
router.delete('/:id', authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN, ROLES.MANAGER), recordingController.deleteRecording);


module.exports = router;
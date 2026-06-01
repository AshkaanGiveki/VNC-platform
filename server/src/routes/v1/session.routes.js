const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const sessionValidator = require('../../validators/session.validator');
const sessionController = require('../../controllers/session.controller');

// Authenticate all
router.use(authenticate);

// User session routes (for /api/v1/sessions)
router.post('/start', validate({ body: sessionValidator.startBody }), sessionController.startSession);
router.get('/', validate({ query: sessionValidator.queryParams }), sessionController.listUserSessions);
router.get('/:id', validate({ params: sessionValidator.sessionIdParam }), sessionController.getSession);
router.post('/:id/stop', validate({ params: sessionValidator.sessionIdParam }), sessionController.stopSession);
router.post('/:id/pause', validate({ params: sessionValidator.sessionIdParam }), sessionController.pauseSession);
router.post('/:id/resume', validate({ params: sessionValidator.sessionIdParam }), sessionController.resumeSession);

// Org-scoped session routes (for /api/v1/organizations/:orgId/sessions)
const orgSessionRouter = require('express').Router({ mergeParams: true });
const resolveOrg = require('../../middleware/organization.middleware');
const authorize = require('../../middleware/role.middleware');
const { ROLES } = require('../../utils/constants');

orgSessionRouter.use(authenticate, resolveOrg, authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN));
orgSessionRouter.get('/', validate({ query: sessionValidator.orgSessionQueryParams }), sessionController.listOrgSessions);
orgSessionRouter.post('/:id/recording/start', sessionController.startRecording);
orgSessionRouter.post('/:id/recording/stop', sessionController.stopRecording);

module.exports = { userSessionRouter: router, orgSessionRouter };
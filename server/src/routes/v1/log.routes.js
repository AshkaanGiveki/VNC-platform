const router = require('express').Router();
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const logController = require('../../controllers/log.controller');
const { ROLES } = require('../../utils/constants');

router.use(authenticate, authorize(ROLES.ORG_ADMIN, ROLES.SUPERADMIN));
router.get('/', logController.getLogs);

module.exports = router;
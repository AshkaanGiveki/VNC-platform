const router = require('express').Router();
const authenticate = require('../middleware/auth.middleware');
const { authorizeSessionAccess, sessionProxy } = require('../middleware/sessionProxy.middleware');

// (*) captures everything after the session ID, including nothing, a slash, or subpaths
router.use('/:sessionId(*)', authenticate, authorizeSessionAccess, sessionProxy);

module.exports = router;
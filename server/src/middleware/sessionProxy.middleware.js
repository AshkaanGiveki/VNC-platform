// const { createProxyMiddleware } = require('http-proxy-middleware');
// const Session = require('../models/Session');
// const { NotFoundError, AuthorizationError } = require('../utils/errors');
// const { SESSION_STATUS } = require('../utils/constants');
// const logger = require('../utils/logger');

// const KASM_USER = 'kasm_user';
// const KASM_PASS = 'password';
// const BASIC_AUTH = 'Basic ' + Buffer.from(`${KASM_USER}:${KASM_PASS}`).toString('base64');

// const sessionCache = new Map();

// async function authorizeSessionAccess(req, res, next) {
//   // Clean the session ID (remove trailing slash captured by the wildcard)
//   let sessionId = req.params.sessionId;
//   if (sessionId && sessionId.endsWith('/')) {
//     sessionId = sessionId.slice(0, -1);
//   }

//   if (!sessionId) {
//     return res.status(400).json({ success: false, message: 'Missing session ID' });
//   }

//   try {
//     // Store the clean session ID for later use
//     req.sessionId = sessionId;

//     if (sessionCache.has(sessionId)) {
//       req.sessionTarget = sessionCache.get(sessionId);
//       return next();
//     }

//     const session = await Session.findById(sessionId).lean();
//     if (!session) throw new NotFoundError('Session not found');

//     const isOwner = session.userId.toString() === req.user.userId;
//     const isAdmin = req.user.role === 'org_admin' || req.user.role === 'superadmin';
//     if (!isOwner && !isAdmin) throw new AuthorizationError('Access denied');

//     if (![SESSION_STATUS.RUNNING, SESSION_STATUS.PAUSED].includes(session.status)) {
//       return res.status(400).json({ success: false, message: `Session is ${session.status}` });
//     }

//     sessionCache.set(sessionId, session.accessUrl);
//     req.sessionTarget = session.accessUrl;
//     next();
//   } catch (err) {
//     if (err instanceof NotFoundError) return res.status(404).json({ success: false, message: err.message });
//     if (err instanceof AuthorizationError) return res.status(403).json({ success: false, message: err.message });
//     logger.error(`Session auth error: ${err.message}`);
//     return res.status(500).json({ success: false, message: 'Internal error' });
//   }
// }

// const sessionProxy = createProxyMiddleware({
//   router: (req) => {
//     if (req.sessionTarget) return req.sessionTarget;
//     if (req.sessionId && sessionCache.has(req.sessionId)) return sessionCache.get(req.sessionId);
//     logger.error(`No target for session ${req.sessionId || 'unknown'}, URL ${req.originalUrl}`);
//     return 'http://127.0.0.1:6901';   // fallback
//   },

//   pathRewrite: (path, req) => {
//     const sessionId = req.sessionId;
//     if (!sessionId) return path;

//     const prefix = `/session/${sessionId}`;
//     if (path.startsWith(prefix)) {
//       return path.slice(prefix.length) || '/';
//     }
//     return path;
//   },

//   ws: true,
//   secure: false,
//   changeOrigin: true,

//   onProxyReq: (proxyReq, req, res) => {
//     proxyReq.setHeader('Authorization', BASIC_AUTH);
//     proxyReq.setHeader('Origin', '');
//   },
//   onProxyReqWs: (proxyReq, req, socket, options, head) => {
//     proxyReq.setHeader('Authorization', BASIC_AUTH);
//     proxyReq.setHeader('Origin', '');
//   },

//   onProxyRes: (proxyRes, req, res) => {
//     const cookies = proxyRes.headers['set-cookie'];
//     if (cookies) {
//       proxyRes.headers['set-cookie'] = cookies.map(cookie =>
//         cookie.replace(/;\s*Secure/gi, '').replace(/;\s*Domain=[^;]+/gi, '')
//       );
//     }
//   },

//   onError: (err, req, res) => {
//     logger.error(`Proxy error for ${req.url}: ${err.message}`);
//     if (!res.headersSent) res.status(502).json({ success: false, message: 'Session container unreachable' });
//   },
// });

// module.exports = { authorizeSessionAccess, sessionProxy };

const { createProxyMiddleware } = require('http-proxy-middleware');
const Session = require('../models/Session');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { SESSION_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

const KASM_USER = 'kasm_user';
const KASM_PASS = 'password';
const BASIC_AUTH = 'Basic ' + Buffer.from(`${KASM_USER}:${KASM_PASS}`).toString('base64');

const sessionCache = new Map();

async function authorizeSessionAccess(req, res, next) {
  // The wildcard (*) gives us everything after /session/ – extract the first segment
  let raw = req.params.sessionId || '';
  if (raw.endsWith('/')) raw = raw.slice(0, -1);
  const sessionId = raw.split('/')[0];          // ← keep only the ID

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Missing session ID' });
  }

  // Store the clean session ID for the proxy and pathRewrite
  req.sessionId = sessionId;

  try {
    if (sessionCache.has(sessionId)) {
      req.sessionTarget = sessionCache.get(sessionId);
      return next();
    }

    const session = await Session.findById(sessionId).lean();
    if (!session) throw new NotFoundError('Session not found');

    const isOwner = session.userId.toString() === req.user.userId;
    const isAdmin = req.user.role === 'org_admin' || req.user.role === 'superadmin';
    if (!isOwner && !isAdmin) throw new AuthorizationError('Access denied');

    if (![SESSION_STATUS.RUNNING, SESSION_STATUS.PAUSED].includes(session.status)) {
      return res.status(400).json({ success: false, message: `Session is ${session.status}` });
    }

    sessionCache.set(sessionId, session.accessUrl);
    req.sessionTarget = session.accessUrl;
    next();
  } catch (err) {
    if (err instanceof NotFoundError) return res.status(404).json({ success: false, message: err.message });
    if (err instanceof AuthorizationError) return res.status(403).json({ success: false, message: err.message });
    logger.error(`Session auth error: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
}

const sessionProxy = createProxyMiddleware({
  // IMPORTANT: do not self-handle responses – let the proxy pipe automatically
  router: (req) => {
    if (req.sessionTarget) return req.sessionTarget;
    if (req.sessionId && sessionCache.has(req.sessionId)) return sessionCache.get(req.sessionId);
    logger.error(`No target for session ${req.sessionId || 'unknown'}`);
    return 'http://127.0.0.1:6901';   // fallback
  },

  pathRewrite: (path, req) => {
    const sessionId = req.sessionId;
    if (!sessionId) return path;
    const prefix = `/session/${sessionId}`;
    if (path.startsWith(prefix)) {
      return path.slice(prefix.length) || '/';
    }
    return path;
  },

  ws: true,
  secure: false,
  changeOrigin: true,

  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Authorization', BASIC_AUTH);
    proxyReq.setHeader('Origin', '');
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    proxyReq.setHeader('Authorization', BASIC_AUTH);
    proxyReq.setHeader('Origin', '');
  },

  // Only clean cookies – the proxy still pipes the response automatically
  onProxyRes: (proxyRes, req, res) => {
    const cookies = proxyRes.headers['set-cookie'];
    if (cookies) {
      proxyRes.headers['set-cookie'] = cookies.map(cookie =>
        cookie.replace(/;\s*Secure/gi, '').replace(/;\s*Domain=[^;]+/gi, '')
      );
    }
  },

  onError: (err, req, res) => {
    logger.error(`Proxy error for ${req.url}: ${err.message}`);
    if (!res.headersSent) res.status(502).json({ success: false, message: 'Session container unreachable' });
  },
});

module.exports = { authorizeSessionAccess, sessionProxy, sessionCache };
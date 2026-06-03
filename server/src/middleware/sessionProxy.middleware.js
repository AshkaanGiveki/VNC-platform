const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const url = require('url');
const Session = require('../models/Session');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { SESSION_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

const KASM_USER = 'kasm_user';
const KASM_PASS = 'password';
const BASIC_AUTH = 'Basic ' + Buffer.from(`${KASM_USER}:${KASM_PASS}`).toString('base64');

const sessionCache = new Map();               // sessionId → accessUrl

/**
 * Set a sessionId cookie so the WebSocket upgrade can read it later.
 */
function setSessionCookie(res, sessionId) {
  res.cookie('sessionId', sessionId, {
    path: '/',
    sameSite: 'lax',
    secure: false,               // true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
}

async function authorizeSessionAccess(req, res, next) {
  let raw = req.params.sessionId || '';
  if (raw.endsWith('/')) raw = raw.slice(0, -1);
  const sessionId = raw.split('/')[0];

  logger.info(`[AUTH] Original URL: ${req.originalUrl}`);

  if (!sessionId) {
    logger.warn('[AUTH] Missing session ID');
    return res.status(400).json({ success: false, message: 'Missing session ID' });
  }

  req.sessionId = sessionId;

  try {
    if (sessionCache.has(sessionId)) {
      req.sessionTarget = sessionCache.get(sessionId);
      setSessionCookie(res, sessionId);
      logger.info(`[AUTH] Cache hit for ${sessionId}, cookie set`);
      return next();
    }

    logger.info(`[AUTH] Loading session from DB: ${sessionId}`);
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
    setSessionCookie(res, sessionId);
    logger.info(`[AUTH] Session loaded, target = ${session.accessUrl}, cookie set`);
    next();
  } catch (err) {
    logger.error(`[AUTH] Error: ${err.message}`);
    if (err instanceof NotFoundError) return res.status(404).json({ success: false, message: err.message });
    if (err instanceof AuthorizationError) return res.status(403).json({ success: false, message: err.message });
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
}

// ---------- HTTP proxy (works perfectly, unchanged) ----------
const sessionProxy = createProxyMiddleware({
  ws: false,                  // ← DISABLE built‑in upgrade – we handle it manually
  secure: false,
  changeOrigin: true,

  router: (req) => {
    if (req.sessionTarget) return req.sessionTarget;
    if (req.sessionId && sessionCache.has(req.sessionId)) return sessionCache.get(req.sessionId);
    logger.error(`[ROUTER] No target for session ${req.sessionId || 'unknown'}`);
    return 'http://127.0.0.1:6901';
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

  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Authorization', BASIC_AUTH);
    proxyReq.setHeader('Origin', '');
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    // This is never called now, but we keep it harmless
    proxyReq.setHeader('Authorization', BASIC_AUTH);
    proxyReq.setHeader('Origin', '');
  },

  onProxyRes: (proxyRes, req, res) => {
    const cookies = proxyRes.headers['set-cookie'];
    if (cookies) {
      proxyRes.headers['set-cookie'] = cookies.map(cookie =>
        cookie.replace(/;\s*Secure/gi, '').replace(/;\s*Domain=[^;]+/gi, '')
      );
    }
  },

  onError: (err, req, res) => {
    logger.error(`[PROXY ERROR] ${req.url}: ${err.message}`);
    if (res.writeHead) {
      res.writeHead(502);
      res.end('Session container unreachable');
    } else if (res.status) {
      res.status(502).json({ success: false, message: 'Session container unreachable' });
    }
  },
});

// ---------- Raw WebSocket upgrade (bypasses http-proxy-middleware) ----------
function upgradeWebSocket(req, socket, head, sessionId, targetUrl) {
  const parsed = url.parse(targetUrl);
  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: req.url,
    method: 'GET',
    rejectUnauthorized: false,
    headers: {
      Authorization: BASIC_AUTH,
      Upgrade: 'websocket',
      Connection: 'Upgrade',
      Origin: '',
      'Sec-WebSocket-Key': req.headers['sec-websocket-key'],
      'Sec-WebSocket-Version': req.headers['sec-websocket-version'],
      'Sec-WebSocket-Protocol': req.headers['sec-websocket-protocol'],
    },
  };

  const proxyReq = https.request(options);

  proxyReq.on('response', (proxyRes) => {
    // If we get a non‑101 response, log and destroy
    logger.warn(`[WS UPGRADE] unexpected response: ${proxyRes.statusCode}`);
    socket.destroy();
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    // Build 101 Switching Protocols response
    const responseLines = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
    ];
    if (proxyRes.headers['sec-websocket-accept']) {
      responseLines.push(`Sec-WebSocket-Accept: ${proxyRes.headers['sec-websocket-accept']}`);
    }
    if (proxyRes.headers['sec-websocket-protocol']) {
      responseLines.push(`Sec-WebSocket-Protocol: ${proxyRes.headers['sec-websocket-protocol']}`);
    }
    responseLines.push('\r\n');

    socket.write(responseLines.join('\r\n'));

    // Start piping after the handshake
    proxySocket.write(head);
    socket.pipe(proxySocket);
    proxySocket.pipe(socket);
  });

  proxyReq.on('error', (err) => {
    logger.error(`[WS UPGRADE] ${err.message}`);
    socket.destroy();
  });

  proxyReq.end();
}

module.exports = { authorizeSessionAccess, sessionProxy, sessionCache, upgradeWebSocket };
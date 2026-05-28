const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const { globalLimiter } = require('./middleware/rateLimiter.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');

// Route imports
const apiRoutes = require('./routes');
const proxyRoutes = require('./routes/proxy.routes');

const app = express();

// ---------- Global middlewares (no body parsing yet) ----------
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
app.use(compression());

// Cookie parser (needed for auth and CSRF)
app.use(cookieParser());

// Rate limiting
app.use(globalLimiter);

// Logging
app.use(requestLogger);

// ---------- Session proxy (mount before body parsers) ----------
app.use('/session', proxyRoutes);
// ---------- Body parsing (only for API routes) ----------
app.use('/api', express.json({ limit: '10mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', mongoSanitize());

// ---------- API routes ----------
app.get('/health', require('./controllers/health.controller').healthCheck);
app.use('/api', apiRoutes);

// ---------- 404 & error handler ----------
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler);

module.exports = app;

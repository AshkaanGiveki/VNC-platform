const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectDatabase } = require('./config/database');
const redisClient = require('./config/redis');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { initConsumers } = require('./events');
const logger = require('./utils/logger');
const cookie = require('cookie');

const { sessionProxy, sessionCache, upgradeWebSocket } = require('./middleware/sessionProxy.middleware');

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  logger.info(`[UPGRADE] URL: ${req.url}`);

  let sessionId = null;
  const match = req.url.match(/\/session\/([a-f\d]{24})/);
  if (match) {
    sessionId = match[1];
  }
  if (!sessionId && req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    sessionId = cookies.sessionId;
  }

  if (sessionId) {
    const target = sessionCache.get(sessionId);
    if (target) {
      logger.info(`[UPGRADE] Direct WebSocket to target: ${target}`);
      upgradeWebSocket(req, socket, head, sessionId, target);
      return;
    }
  }
  socket.destroy();
});

async function startServer() {
  try {
    await connectDatabase();
    logger.info('MongoDB connected');

    await redisClient.ping();
    logger.info('Redis connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    // Initialise event consumers (RabbitMQ)
    await initConsumers();
    logger.info('Event consumers initialised');

    // Register Bull job processors
    const sessionProcessor = require('./jobs/processors/sessionProcessor');
    const notificationProcessor = require('./jobs/processors/notificationProcessor');
    const recordingProcessor = require('./jobs/processors/recordingProcessor');
    sessionProcessor.registerProcessors();
    notificationProcessor.registerProcessors();
    recordingProcessor.registerProcessors();
    logger.info('Job processors registered');

    // Start scheduler for recurring tasks
    const { initScheduler } = require('./jobs/scheduler');
    initScheduler();
    logger.info('Scheduler initialised');

    const port = config.env.port;
    server.listen(port, () => {
      logger.info(`Server listening on port ${port} in ${config.env.nodeEnv} mode`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

startServer();
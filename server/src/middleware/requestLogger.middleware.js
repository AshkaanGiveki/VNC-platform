/**
 * HTTP request logger middleware using Morgan (streams to Winston).
 * @module middleware/requestLogger
 */
const morgan = require('morgan');
const logger = require('../utils/logger');

// Use a custom token to log user id if available
morgan.token('user-id', (req) => (req.user ? req.user.userId : 'anonymous'));

// Format string
const httpFormat =
  ':remote-addr - :user-id [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms';

// Stream that writes to Winston's http level
const stream = {
  write: (message) => logger.http(message.trim()),
};

const requestLogger = morgan(httpFormat, { stream });

module.exports = requestLogger;
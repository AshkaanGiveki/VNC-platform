/**
 * Environment variables validation and export.
 * @module config/env
 */
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
  'MONGO_URI',
  'REDIS_URL',
  'RABBITMQ_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'STORAGE_ENDPOINT',
  'STORAGE_ACCESS_KEY',
  'STORAGE_SECRET_KEY',
  'STORAGE_BUCKET',
  'SESSION_STORAGE_PATH',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS'
];

/**
 * Validate required environment variables.
 * @throws {Error} If any required variable is missing.
 */
function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

validateEnv();

/**
 * Exported environment configuration object.
 * Contains all settings with defaults applied.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  mongo: {
    uri: process.env.MONGO_URI,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    exchangeEvents: process.env.RABBITMQ_EXCHANGE_EVENTS || 'events',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT,
    port: parseInt(process.env.STORAGE_PORT, 10) || 4410,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    bucket: process.env.STORAGE_BUCKET,
    useSSL: process.env.STORAGE_USE_SSL === 'true',
  },
  sessionStoragePath: process.env.SESSION_STORAGE_PATH || path.join(__dirname, '../../sessions'),

  containerProvider: process.env.CONTAINER_PROVIDER || 'kasm',
  kasm: {
    apiUrl: process.env.KASM_API_URL,
    apiKey: process.env.KASM_API_KEY,
  },

  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
};

module.exports = Object.freeze(env);
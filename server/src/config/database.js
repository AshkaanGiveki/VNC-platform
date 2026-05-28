/**
 * MongoDB connection using Mongoose.
 * Provides a connection function and handles reconnection logic.
 * @module config/database
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Connection options (Mongoose 6+ uses new URL parser and unified topology by default)
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
};

/**
 * Connect to MongoDB with retry logic.
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  const uri = require('./env').mongo.uri;

  // Mongoose events
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed due to app termination');
    process.exit(0);
  });

  // Attempt connection with retry
  const connectWithRetry = async (retries = 5, delay = 3000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await mongoose.connect(uri, options);
        logger.info('Successfully connected to MongoDB');
        return;
      } catch (error) {
        logger.error(
          `MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`
        );
        if (attempt === retries) {
          throw new Error(
            `Failed to connect to MongoDB after ${retries} attempts`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  await connectWithRetry();
}

module.exports = { connectDatabase };